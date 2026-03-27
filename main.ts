import { Plugin, Editor, TFile, TFolder, TAbstractFile, MarkdownView, Notice, Menu, MenuItem } from 'obsidian';
import { ImageLibraryView, VIEW_TYPE_IMAGE_LIBRARY } from './view/ImageLibraryView';
import { UnreferencedImagesView, VIEW_TYPE_UNREFERENCED_IMAGES } from './view/UnreferencedImagesView';
import { TrashManagementView, VIEW_TYPE_TRASH_MANAGEMENT } from './view/TrashManagementView';
import { DuplicateDetectionView, VIEW_TYPE_DUPLICATE_DETECTION } from './view/DuplicateDetectionView';
import { MediaPreviewModal } from './view/MediaPreviewModal';
import { ImageManagerSettings, DEFAULT_SETTINGS, SettingsTab } from './settings';
import { ImageAlignment } from './utils/imageAlignment';
import { AlignmentPostProcessor } from './utils/postProcessor';
import { t as translate, getSystemLanguage, Language, Translations } from './utils/i18n';
import { getEnabledExtensions, isMediaFile } from './utils/mediaTypes';
import { isPathSafe } from './utils/security';
import { getFileNameFromPath, getParentPath, normalizeVaultPath, safeDecodeURIComponent } from './utils/path';
import { ThumbnailCache } from './utils/thumbnailCache';
import { MediaFileIndex } from './utils/fileWatcher';

interface ElectronShell {
	openPath?: (path: string) => Promise<string>;
	openExternal?: (url: string) => Promise<void>;
}

interface ElectronModule {
	shell?: ElectronShell;
}

interface ElectronWindow {
	require?: (name: string) => ElectronModule;
}

export default class ImageManagerPlugin extends Plugin {
	settings: ImageManagerSettings = DEFAULT_SETTINGS;
	private static readonly LEGACY_PLUGIN_ID = 'obsidian-media-toolkit';
	private static readonly LEGACY_TRASH_FOLDER = '.obsidian-media-toolkit-trash';
	// 缓存引用的图片以提高大型 Vault 的性能
	private referencedImagesCache: Set<string> | null = null;
	private cacheTimestamp: number = 0;
	private static readonly CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟
	private refreshViewsTimer: ReturnType<typeof setTimeout> | null = null;

	// 性能：缩略图缓存 + 增量文件索引
	thumbnailCache: ThumbnailCache = new ThumbnailCache();
	fileIndex!: MediaFileIndex;
	private indexedExtensionsKey: string = '';
	private indexedTrashFolder: string = '';
	private activePreviewModal: MediaPreviewModal | null = null;

	/**
	 * 获取当前语言设置
	 */
	getCurrentLanguage(): Language {
		if (this.settings.language === 'system') {
			return getSystemLanguage();
		}
		return this.settings.language as Language;
	}

	/**
	 * 翻译函数
	 */
	t(key: string, params?: Record<string, string | number>): string {
		return translate(this.getCurrentLanguage(), key as keyof Translations, params);
	}

	async onload() {
		await this.loadSettings();
		await this.migrateLegacyTrashFolder();

		// 初始化性能基础设施
		await this.initPerformanceInfra();

		// 注册图片库视图
		this.registerView(VIEW_TYPE_IMAGE_LIBRARY, (leaf) => new ImageLibraryView(leaf, this));

		// 注册未引用图片视图
		this.registerView(VIEW_TYPE_UNREFERENCED_IMAGES, (leaf) => new UnreferencedImagesView(leaf, this));

		// 注册隔离文件夹管理视图
		this.registerView(VIEW_TYPE_TRASH_MANAGEMENT, (leaf) => new TrashManagementView(leaf, this));

		// 注册重复检测视图
		this.registerView(VIEW_TYPE_DUPLICATE_DETECTION, (leaf) => new DuplicateDetectionView(leaf, this));

		// 注册图片对齐 PostProcessor
		const alignmentProcessor = new AlignmentPostProcessor(this);
		alignmentProcessor.register();

		// 添加命令面板命令
		this.addCommand({
			id: 'open-image-library',
			name: this.t('cmdImageLibrary'),
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				void this.openImageLibrary();
			}
		});

		this.addCommand({
			id: 'find-unreferenced-images',
			name: this.t('cmdFindUnreferencedImages'),
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				void this.findUnreferencedImages();
			}
		});

		// 缓存刷新命令
		this.addCommand({
			id: 'refresh-cache',
			name: this.t('cmdRefreshCache'),
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				void this.refreshCache();
			}
		});

		// 重复检测命令
		this.addCommand({
			id: 'open-duplicate-detection',
			name: this.t('cmdDuplicateDetection'),
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				void this.openDuplicateDetection();
			}
		});

		// 隔离管理命令
		this.addCommand({
			id: 'open-trash-management',
			name: this.t('cmdTrashManagement'),
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				void this.openTrashManagement();
			}
		});

		// 图片对齐命令
		this.addCommand({
			id: 'align-image-left',
			name: this.t('cmdAlignImageLeft'),
			editorCallback: (editor: Editor) => {
				this.alignSelectedImage(editor, 'left');
			}
		});

		this.addCommand({
			id: 'align-image-center',
			name: this.t('cmdAlignImageCenter'),
			editorCallback: (editor: Editor) => {
				this.alignSelectedImage(editor, 'center');
			}
		});

		this.addCommand({
			id: 'align-image-right',
			name: this.t('cmdAlignImageRight'),
			editorCallback: (editor: Editor) => {
				this.alignSelectedImage(editor, 'right');
			}
		});

		// 注册编辑器上下文菜单
		this.registerEvent(this.app.workspace.on('editor-menu', (menu, editor) => {
			this.addAlignmentMenuItems(menu, editor);
		}));

		// 添加设置标签页
		this.addSettingTab(new SettingsTab(this.app, this));

		// 监听 Vault 文件变化，自动失效缓存并刷新视图
		this.registerVaultEventListeners();

		// 启动时执行隔离文件夹自动清理
		void this.autoCleanupTrashOnStartup();
	}

	/**
	 * 迁移旧版默认隔离目录（隐藏目录）到新版默认目录，避免被 Vault 索引忽略
	 */
	private async migrateLegacyTrashFolder() {
		const legacyPath = normalizeVaultPath(ImageManagerPlugin.LEGACY_TRASH_FOLDER);
		const defaultTrashPath = normalizeVaultPath(DEFAULT_SETTINGS.trashFolder) || DEFAULT_SETTINGS.trashFolder;
		const configuredTrashPath = normalizeVaultPath(this.settings.trashFolder) || defaultTrashPath;
		let settingsChanged = false;

		if (configuredTrashPath === legacyPath) {
			this.settings.trashFolder = defaultTrashPath;
			settingsChanged = true;
		}

		try {
			const adapter = this.app.vault.adapter;
			const legacyExists = await adapter.exists(legacyPath);

			if (legacyExists) {
				const targetExists = await adapter.exists(defaultTrashPath);
				if (!targetExists) {
					await adapter.rename(legacyPath, defaultTrashPath);
				}
			}
		} catch (error) {
			console.error('迁移旧版隔离目录失败:', error);
		}

		if (settingsChanged) {
			await this.saveData(this.settings);
		}
	}

	/**
	 * 启动时自动清理隔离文件夹
	 */
	private async autoCleanupTrashOnStartup() {
		// 检查是否启用自动清理
		if (!this.settings.autoCleanupTrash) {
			return;
		}

		try {
			await this.cleanupOldTrashFiles();
		} catch (error) {
			console.error('自动清理隔离文件夹失败:', error);
		}
	}

	/**
	 * 清理过期的隔离文件
	 */
	async cleanupOldTrashFiles(): Promise<number> {
		const { vault } = this.app;
		const trashPath = normalizeVaultPath(this.settings.trashFolder);

		if (!trashPath || !isPathSafe(trashPath)) {
			return 0;
		}

		const trashFolder = vault.getAbstractFileByPath(trashPath);

		// 检查隔离文件夹是否存在
		if (!trashFolder) {
			return 0;
		}

		// 检查是否为文件夹
		if (!(trashFolder instanceof TFolder)) {
			return 0;
		}

		const days = Math.max(1, this.settings.trashCleanupDays || 30);
		const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
		let deletedCount = 0;

		// 获取隔离文件夹中的所有文件
		const files = trashFolder.children;

		for (const file of files) {
			if (file instanceof TFile) {
				// 检查文件修改时间
				if (file.stat.mtime < cutoffTime) {
					try {
						await this.app.fileManager.trashFile(file);
						deletedCount++;
					} catch (error) {
						console.error(`删除隔离文件失败: ${file.name}`, error);
					}
				}
			}
		}

		if (deletedCount > 0) {
			new Notice(this.t('autoCleanupComplete').replace('{count}', String(deletedCount)));
		}

		return deletedCount;
	}

	/**
	 * 注册 Vault 事件监听
	 */
	private registerVaultEventListeners() {
		// 委托给 MediaFileIndex 处理增量索引更新
		this.registerEvent(this.app.vault.on('create', (file: TAbstractFile) => {
			this.fileIndex.onFileCreated(file);
			this.handleVaultFileChange(file);
		}));
		this.registerEvent(this.app.vault.on('delete', (file: TAbstractFile) => {
			this.fileIndex.onFileDeleted(file);
			this.handleVaultFileChange(file);
		}));
		this.registerEvent(this.app.vault.on('modify', (file: TAbstractFile) => {
			this.fileIndex.onFileModified(file);
			this.handleVaultFileChange(file);
		}));
		this.registerEvent(this.app.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
			this.fileIndex.onFileRenamed(file, oldPath);
			this.handleVaultFileChange(file, oldPath);
		}));
	}

	/**
	 * 初始化性能基础设施
	 */
	private async initPerformanceInfra(): Promise<void> {
		// 打开缩略图缓存
		await this.thumbnailCache.open();

		// 初始化文件索引
		this.fileIndex = new MediaFileIndex(this.app.vault, this.thumbnailCache);
		await this.syncPerformanceInfraSettings(true);
	}

	/**
	 * 同步性能基础设施配置
	 * 当媒体类型或隔离目录发生变化时，需要重建文件索引
	 */
	private syncPerformanceInfraSettings(forceFullScan: boolean = false): Promise<void> {
		const enabledExtensions = getEnabledExtensions(this.settings);
		const trashFolder = normalizeVaultPath(this.settings.trashFolder) || DEFAULT_SETTINGS.trashFolder;
		const extensionsKey = [...enabledExtensions].sort().join('|');
		const needsRescan = forceFullScan
			|| !this.fileIndex.isInitialized
			|| this.indexedExtensionsKey !== extensionsKey
			|| this.indexedTrashFolder !== trashFolder;

		this.fileIndex.setEnabledExtensions(enabledExtensions);
		this.fileIndex.setTrashFolder(trashFolder);
		this.indexedExtensionsKey = extensionsKey;
		this.indexedTrashFolder = trashFolder;

		if (needsRescan) {
			this.fileIndex.fullScan();
		}

		return Promise.resolve();
	}

	/**
	 * 处理 Vault 文件变化
	 */
	private handleVaultFileChange(file: TAbstractFile, oldPath?: string) {
		if (file instanceof TFolder) {
			this.clearCache();
			if (this.settings.autoRefresh) {
				this.scheduleRefreshOpenViews();
			}
			return;
		}

		if (!(file instanceof TFile)) {
			return;
		}

		const normalizedOldPath = normalizeVaultPath(oldPath || '').toLowerCase();
		const oldWasMarkdown = normalizedOldPath.endsWith('.md');
		const oldWasMedia = normalizedOldPath ? isMediaFile(normalizedOldPath) : false;
		const isMarkdown = file.extension === 'md';
		const isMedia = isMediaFile(file.name);

		// Markdown 变更会影响引用关系，需清除缓存
		if (isMarkdown || oldWasMarkdown) {
			this.clearCache();
		}

		// 仅媒体文件变更（包含重命名前是媒体）才触发视图刷新
		if (!isMedia && !oldWasMedia) {
			return;
		}

		if (!(isMarkdown || oldWasMarkdown)) {
			this.clearCache();
		}

		if (this.settings.autoRefresh) {
			this.scheduleRefreshOpenViews();
		}
	}

	/**
	 * 防抖刷新已打开视图
	 */
	private scheduleRefreshOpenViews(delayMs: number = 300) {
		if (this.refreshViewsTimer) {
			clearTimeout(this.refreshViewsTimer);
		}

		this.refreshViewsTimer = setTimeout(() => {
			this.refreshViewsTimer = null;
			void this.refreshOpenViews();
		}, delayMs);
	}

	/**
	 * 刷新所有已打开的插件视图
	 */
	private async refreshOpenViews() {
		const tasks: Promise<unknown>[] = [];

		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_IMAGE_LIBRARY)) {
			const view = leaf.view;
			if (view instanceof ImageLibraryView) {
				tasks.push(view.refreshImages());
			}
		}

		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_UNREFERENCED_IMAGES)) {
			const view = leaf.view;
			if (view instanceof UnreferencedImagesView) {
				tasks.push(view.scanUnreferencedImages());
			}
		}

		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TRASH_MANAGEMENT)) {
			const view = leaf.view;
			if (view instanceof TrashManagementView) {
				tasks.push(Promise.resolve().then(() => view.loadTrashItems()));
			}
		}

		if (tasks.length > 0) {
			await Promise.allSettled(tasks);
		}
	}

	/**
	 * 打开隔离文件夹管理视图
	 */
	async openTrashManagement() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_TRASH_MANAGEMENT)[0];
		if (!leaf) {
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({
				type: VIEW_TYPE_TRASH_MANAGEMENT,
				active: true
			});
		}
		await workspace.revealLeaf(leaf);
	}

	/**
	 * 打开媒体预览
	 */
	openMediaPreview(file: TFile) {
		if (!this.settings.enablePreviewModal) {
			const src = this.app.vault.getResourcePath(file);
			window.open(src, '_blank', 'noopener,noreferrer');
			return;
		}

		// 保持单实例预览，避免并发弹窗导致按钮/状态错位
		if (this.activePreviewModal) {
			try {
				this.activePreviewModal.close();
			} catch (error) {
				console.debug('关闭现有预览窗口失败:', error);
			}
			this.activePreviewModal = null;
		}

		const modal = new MediaPreviewModal(this.app, this, file, [], () => {
			if (this.activePreviewModal === modal) {
				this.activePreviewModal = null;
			}
		});
		this.activePreviewModal = modal;
		modal.open();
	}

	onunload() {
		if (this.refreshViewsTimer) {
			clearTimeout(this.refreshViewsTimer);
			this.refreshViewsTimer = null;
		}
		// 关闭缩略图缓存
		this.thumbnailCache.close();
		this.fileIndex.clear();
		if (this.activePreviewModal) {
			try {
				this.activePreviewModal.close();
			} catch (error) {
				console.debug('关闭媒体预览窗口失败:', error);
			}
			this.activePreviewModal = null;
		}
	}

	/**
	 * 打开重复检测视图
	 */
	async openDuplicateDetection() {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_DUPLICATE_DETECTION)[0];
		if (!leaf) {
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({
				type: VIEW_TYPE_DUPLICATE_DETECTION,
				active: true
			});
		}
		await workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		try {
			const loaded = await this.loadData();
			const effectiveLoaded = this.shouldMigrateLegacySettings(loaded)
				? await this.loadLegacyPluginData() ?? loaded
				: loaded;
			const migratedLegacyData = Boolean(
				effectiveLoaded !== loaded && effectiveLoaded && typeof effectiveLoaded === 'object'
			);
			const sanitized = effectiveLoaded && typeof effectiveLoaded === 'object'
				? Object.fromEntries(
					Object.entries(effectiveLoaded).filter(([k]) =>
						k !== '__proto__' && k !== 'constructor' && k !== 'prototype'
					)
				)
				: {};
			const merged = Object.assign({}, DEFAULT_SETTINGS, sanitized) as Partial<ImageManagerSettings> & Record<string, unknown>;
			const toBool = (value: unknown, fallback: boolean): boolean =>
				typeof value === 'boolean' ? value : fallback;

			const imageFolder = normalizeVaultPath(typeof merged.imageFolder === 'string' ? merged.imageFolder : '');
			const trashFolderRaw = typeof merged.trashFolder === 'string' ? merged.trashFolder : DEFAULT_SETTINGS.trashFolder;
			const trashFolder = normalizeVaultPath(trashFolderRaw) || DEFAULT_SETTINGS.trashFolder;

			this.settings = {
				...DEFAULT_SETTINGS,
				...merged,
				imageFolder,
				trashFolder,
				thumbnailSize: ['small', 'medium', 'large'].includes(String(merged.thumbnailSize))
					? merged.thumbnailSize as 'small' | 'medium' | 'large'
					: DEFAULT_SETTINGS.thumbnailSize,
				sortBy: ['name', 'date', 'size'].includes(String(merged.sortBy))
					? merged.sortBy as 'name' | 'date' | 'size'
					: DEFAULT_SETTINGS.sortBy,
				sortOrder: ['asc', 'desc'].includes(String(merged.sortOrder))
					? merged.sortOrder as 'asc' | 'desc'
					: DEFAULT_SETTINGS.sortOrder,
				defaultAlignment: ['left', 'center', 'right'].includes(String(merged.defaultAlignment))
					? merged.defaultAlignment as 'left' | 'center' | 'right'
					: DEFAULT_SETTINGS.defaultAlignment,
				language: ['zh', 'en', 'system'].includes(String(merged.language))
					? merged.language as 'zh' | 'en' | 'system'
					: 'system',
				trashCleanupDays: Math.max(1, Math.min(365, Number(merged.trashCleanupDays) || DEFAULT_SETTINGS.trashCleanupDays)),
				pageSize: Math.max(1, Math.min(1000, Number(merged.pageSize) || DEFAULT_SETTINGS.pageSize)),
				showImageInfo: toBool(merged.showImageInfo, DEFAULT_SETTINGS.showImageInfo),
				autoRefresh: toBool(merged.autoRefresh, DEFAULT_SETTINGS.autoRefresh),
				useTrashFolder: toBool(merged.useTrashFolder, DEFAULT_SETTINGS.useTrashFolder),
				autoCleanupTrash: toBool(merged.autoCleanupTrash, DEFAULT_SETTINGS.autoCleanupTrash),
				enableImages: toBool(merged.enableImages, DEFAULT_SETTINGS.enableImages),
				enableVideos: toBool(merged.enableVideos, DEFAULT_SETTINGS.enableVideos),
				enableAudio: toBool(merged.enableAudio, DEFAULT_SETTINGS.enableAudio),
				enablePDF: toBool(merged.enablePDF, DEFAULT_SETTINGS.enablePDF),
				enablePreviewModal: toBool(merged.enablePreviewModal, DEFAULT_SETTINGS.enablePreviewModal),
				enableKeyboardNav: toBool(merged.enableKeyboardNav, DEFAULT_SETTINGS.enableKeyboardNav),
				// 新增设置字段
				safeScanEnabled: toBool(merged.safeScanEnabled, DEFAULT_SETTINGS.safeScanEnabled),
				safeScanUnrefDays: Math.max(1, Math.min(365, Number(merged.safeScanUnrefDays) || DEFAULT_SETTINGS.safeScanUnrefDays)),
				safeScanMinSize: Math.max(0, Number(merged.safeScanMinSize) || DEFAULT_SETTINGS.safeScanMinSize),
				duplicateThreshold: Math.max(50, Math.min(100, Number(merged.duplicateThreshold) || DEFAULT_SETTINGS.duplicateThreshold)),
				organizeRules: Array.isArray(merged.organizeRules) ? merged.organizeRules : DEFAULT_SETTINGS.organizeRules,
				defaultProcessQuality: Math.max(1, Math.min(100, Number(merged.defaultProcessQuality) || DEFAULT_SETTINGS.defaultProcessQuality)),
				defaultProcessFormat: ['webp', 'jpeg', 'png'].includes(String(merged.defaultProcessFormat))
					? merged.defaultProcessFormat as 'webp' | 'jpeg' | 'png'
					: DEFAULT_SETTINGS.defaultProcessFormat,
				watermarkText: typeof merged.watermarkText === 'string' ? merged.watermarkText : DEFAULT_SETTINGS.watermarkText
			};
			if (migratedLegacyData) {
				await this.saveData(this.settings);
			}
		} catch (error) {
			console.error('加载设置失败，使用默认设置:', error);
			this.settings = { ...DEFAULT_SETTINGS };
		}
	}

	private shouldMigrateLegacySettings(loaded: unknown): boolean {
		if (loaded == null) {
			return true;
		}
		if (typeof loaded !== 'object' || Array.isArray(loaded)) {
			return false;
		}
		return Object.keys(loaded).length === 0;
	}

	private async loadLegacyPluginData(): Promise<Record<string, unknown> | null> {
		const legacyDataPath = normalizeVaultPath(
			`${this.app.vault.configDir}/plugins/${ImageManagerPlugin.LEGACY_PLUGIN_ID}/data.json`
		);
		if (!legacyDataPath) {
			return null;
		}

		try {
			if (!await this.app.vault.adapter.exists(legacyDataPath)) {
				return null;
			}
			const raw = await this.app.vault.adapter.read(legacyDataPath);
			const parsed = JSON.parse(raw);
			return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
				? parsed as Record<string, unknown>
				: null;
		} catch (error) {
			console.warn('读取旧插件配置失败，跳过迁移:', error);
			return null;
		}
	}

	async saveSettings() {
		this.settings.imageFolder = normalizeVaultPath(this.settings.imageFolder);
		this.settings.trashFolder = normalizeVaultPath(this.settings.trashFolder) || DEFAULT_SETTINGS.trashFolder;
		await this.saveData(this.settings);
		await this.syncPerformanceInfraSettings();
		this.clearCache();
		this.scheduleRefreshOpenViews(150);
	}

	/**
	 * 清除引用缓存
	 * 当设置变更影响缓存有效性时调用
	 */
	clearCache() {
		this.referencedImagesCache = null;
		this.cacheTimestamp = 0;
	}

	async openImageLibrary() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_IMAGE_LIBRARY)[0];
		if (!leaf) {
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({
				type: VIEW_TYPE_IMAGE_LIBRARY,
				active: true
			});
		}
		await workspace.revealLeaf(leaf);
	}

	async findUnreferencedImages() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_UNREFERENCED_IMAGES)[0];
		if (!leaf) {
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({
				type: VIEW_TYPE_UNREFERENCED_IMAGES,
				active: true
			});
		}
		await workspace.revealLeaf(leaf);
	}

	// 获取所有媒体文件（图片、音视频、文档）
	getAllImageFiles(): TFile[] {
		// 从设置中获取启用的扩展名
		const enabledExtensions = getEnabledExtensions({
			enableImages: this.settings.enableImages,
			enableVideos: this.settings.enableVideos,
			enableAudio: this.settings.enableAudio,
			enablePDF: this.settings.enablePDF
		});

		// 检查是否所有媒体类型都被禁用
		if (enabledExtensions.length === 0) {
			new Notice(this.t('allMediaTypesDisabled'));
			return [];
		}

		const allFiles = this.app.vault.getFiles();
		return allFiles.filter(file =>
			enabledExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
		);
	}

	// 获取所有图片文件（保留兼容性）
	getAllMediaFiles(): TFile[] {
		return this.getAllImageFiles();
	}

	// 获取所有Markdown文件中引用的图片
	async getReferencedImages(signal?: AbortSignal): Promise<Set<string>> {
		const now = Date.now();

		// 检查缓存是否有效
		if (this.referencedImagesCache && (now - this.cacheTimestamp) < ImageManagerPlugin.CACHE_DURATION) {
			return this.referencedImagesCache;
		}

		// 检查是否已中止
		if (signal?.aborted) {
			throw new Error('Scan cancelled');
		}

		const referenced = new Set<string>();
		const { vault } = this.app;
		const enabledExtensions = getEnabledExtensions({
			enableImages: this.settings.enableImages,
			enableVideos: this.settings.enableVideos,
			enableAudio: this.settings.enableAudio,
			enablePDF: this.settings.enablePDF
		});
		const extensionPattern = enabledExtensions.map(ext => ext.slice(1)).join('|');

		if (!extensionPattern) {
			this.referencedImagesCache = referenced;
			this.cacheTimestamp = now;
			return referenced;
		}

		const wikiLinkPatternSource = `\\[\\[([^\\]|]+\\.(?:${extensionPattern}))(?:\\|[^\\]]*)?\\]\\]`;
		const markdownLinkPatternSource = `!?\\[[^\\]]*\\]\\(([^)]+\\.(?:${extensionPattern})(?:\\?[^)#]*)?(?:#[^)]+)?)\\)`;
		const addReferencedPath = (rawPath: string, sourceFilePath: string) => {
			if (!rawPath) return;

			let candidate = rawPath.trim();
			if (candidate.startsWith('<') && candidate.endsWith('>')) {
				candidate = candidate.slice(1, -1).trim();
			}

			candidate = candidate.replace(/\\ /g, ' ');
			candidate = safeDecodeURIComponent(candidate);

			if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
				return;
			}

			const [withoutQuery] = candidate.split(/[?#]/);
			const normalizedCandidate = normalizeVaultPath(withoutQuery);
			const resolvedFile = this.app.metadataCache.getFirstLinkpathDest(
				normalizedCandidate || withoutQuery,
				sourceFilePath
			);
			const normalized = resolvedFile
				? normalizeVaultPath(resolvedFile.path).toLowerCase()
				: normalizedCandidate.toLowerCase();

			if (!normalized) return;
			referenced.add(normalized);
		};

		// 使用正则扫描所有 Markdown 文件
		const markdownFiles = vault.getFiles().filter(f => f.extension === 'md');
		const totalFiles = markdownFiles.length;

		// 扫描超时保护（默认 5 分钟）
		const SCAN_TIMEOUT = 5 * 60 * 1000;
		const scanStartTime = Date.now();
		let timeoutId: NodeJS.Timeout | null = null;

		// 如果传入了外部 signal，则不设置内部超时
		if (!signal) {
			timeoutId = setTimeout(() => {
				console.warn('Scan timeout reached, returning partial results');
			}, SCAN_TIMEOUT);
		}

		// 监听外部中止信号
		if (signal) {
			signal.addEventListener('abort', () => {
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
				console.warn('Scan aborted by external signal');
			});
		}

		// 对于大型 Vault，显示开始扫描通知
		// 注意：Obsidian 的 Notice 不支持动态更新，每次 setMessage() 会创建新的 Notice
		// 因此我们只在开始时显示一个通知，扫描完成后用新的通知替换
		let scanNotice: Notice | null = null;
		if (totalFiles > 100) {
			scanNotice = new Notice(this.t('scanningReferences') + ` (0/${totalFiles})`, 0);
		}

		// 分批处理以避免阻塞 UI
		const BATCH_SIZE = 20;
		for (let i = 0; i < markdownFiles.length; i += BATCH_SIZE) {
			// 检查超时或中止
			if (Date.now() - scanStartTime > SCAN_TIMEOUT) {
				console.warn('Scan timeout reached, returning partial results');
				break;
			}
			if (signal?.aborted) {
				console.warn('Scan aborted');
				break;
			}

			const batch = markdownFiles.slice(i, i + BATCH_SIZE);

			await Promise.all(batch.map(async (file) => {
				// 检查中止信号
				if (signal?.aborted) {
					return;
				}

				let content: string;
				try {
					content = await vault.read(file);
				} catch {
					return;
				}

				const wikiLinkPattern = new RegExp(wikiLinkPatternSource, 'gi');
				const markdownLinkPattern = new RegExp(markdownLinkPatternSource, 'gi');
				let match;

				// 匹配 Wiki 链接（含带别名的）
				while ((match = wikiLinkPattern.exec(content)) !== null) {
					addReferencedPath(match[1], file.path);
				}

				// 匹配 Markdown 链接（图片/音视频/文档）
				while ((match = markdownLinkPattern.exec(content)) !== null) {
					addReferencedPath(match[1], file.path);
				}
			}));

			// 更新扫描进度通知
			if (scanNotice && i % (BATCH_SIZE * 5) === 0) {
				scanNotice.hide();
				scanNotice = new Notice(this.t('scanningReferences') + ` (${Math.min(i + BATCH_SIZE, totalFiles)}/${totalFiles})`, 0);
			}

			// 让 UI 有机会更新
			await new Promise(resolve => setTimeout(resolve, 0));
		}

		// 清理超时定时器
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		// 扫描完成，显示完成通知
		// 注意：不使用 setMessage()，因为它会创建新的 Notice
		if (scanNotice) {
			scanNotice.hide();
			new Notice(this.t('scanComplete') + ` (${totalFiles} ${this.t('filesScanned')})`);
		}

		// 更新缓存
		this.referencedImagesCache = referenced;
		this.cacheTimestamp = now;

		return referenced;
	}

	// 查找未引用的图片
	async findUnreferenced(): Promise<TFile[]> {
		const allImages = this.getAllImageFiles();
		const referenced = await this.getReferencedImages();

		return allImages.filter(file => {
			const filePath = normalizeVaultPath(file.path).toLowerCase();
			return !referenced.has(filePath);
		});
	}

	// 手动刷新缓存
	async refreshCache() {
		// 清除缓存
		this.referencedImagesCache = null;
		this.cacheTimestamp = 0;

		// 重新获取引用
		await this.getReferencedImages();

		new Notice(this.t('scanComplete'));
	}

	// 打开图片所在的笔记
	async openImageInNotes(imageFile: TFile) {
		const { workspace, vault } = this.app;
		const results: { file: TFile; line: number }[] = [];
		const imageName = imageFile.name;

		// 使用正则扫描所有 Markdown 文件
		const markdownFiles = vault.getFiles().filter(f => f.extension === 'md');

		for (const file of markdownFiles) {
			let content: string;
			try {
				content = await vault.read(file);
			} catch {
				continue;
			}
			const lines = content.split('\n');

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				// 使用更精确的匹配：匹配图片链接格式
				if (line.includes(imageName) &&
					(line.includes('[[') || line.includes('![') || line.includes(']('))) {
					results.push({ file, line: i + 1 });
					break; // 每个文件只取第一个匹配
				}
			}
		}

		if (results.length > 0) {
			const result = results[0];
			// 打开文件并跳转到指定行
			const leaf = workspace.getLeaf('tab');
			await leaf.openFile(result.file);

			// 尝试跳转到具体行
			if (result.line > 1) {
				setTimeout(() => {
					const view = workspace.getActiveViewOfType(MarkdownView);
					if (view) {
						const editor = view.editor;
						editor.setCursor({ ch: 0, line: result.line - 1 });
						editor.scrollIntoView({ from: { ch: 0, line: result.line - 1 }, to: { ch: 0, line: result.line - 1 } }, true);
					}
				}, 100);
			}
		} else {
			new Notice(this.t('notReferenced'));
		}
	}

	/**
	 * 生成可稳定解析的 Wiki 链接（同名冲突时自动使用路径）
	 */
	getStableWikiLink(file: TFile): string {
		const normalizedPath = normalizeVaultPath(file.path) || file.path;
		const normalizedPathLower = normalizedPath.toLowerCase();
		const lowerName = file.name.toLowerCase();
		const hasNameCollision = this.app.vault.getFiles().some(candidate =>
			candidate.path !== file.path &&
			candidate.name.toLowerCase() === lowerName &&
			(normalizeVaultPath(candidate.path) || candidate.path).toLowerCase() !== normalizedPathLower
		);
		const linkPath = hasNameCollision ? normalizedPath : file.name;
		return `[[${linkPath}]]`;
	}

	/**
	 * 通过系统默认程序打开原文件（桌面端优先）
	 */
	async openOriginalFile(file: TFile): Promise<boolean> {
		const appLike = this.app as unknown as {
			openWithDefaultApp?: (path: string) => Promise<void> | void;
		};

		try {
			if (typeof appLike.openWithDefaultApp === 'function') {
				await appLike.openWithDefaultApp(file.path);
				return true;
			}
		} catch (error) {
			console.warn('openWithDefaultApp 失败，尝试回退方案:', error);
		}

		const adapter = this.app.vault.adapter as unknown as {
			getFullPath?: (path: string) => string;
		};
		const fullPath = typeof adapter.getFullPath === 'function'
			? adapter.getFullPath(file.path)
			: '';

		try {
			const electronRequire = (window as unknown as ElectronWindow).require;
			if (typeof electronRequire === 'function') {
				const electron = electronRequire('electron');
				const shell = electron?.shell;
				if (shell && fullPath && typeof shell.openPath === 'function') {
					const errorMessage = await shell.openPath(fullPath);
					if (!errorMessage) {
						return true;
					}
				}
				if (shell && typeof shell.openExternal === 'function') {
					await shell.openExternal(this.app.vault.getResourcePath(file));
					return true;
				}
			}
		} catch (error) {
			console.warn('electron shell 打开失败，尝试浏览器回退:', error);
		}

		const popup = window.open(this.app.vault.getResourcePath(file), '_blank', 'noopener,noreferrer');
		if (popup) {
			return true;
		}

		new Notice(this.t('operationFailed', { name: file.name }));
		return false;
	}

	// 对齐选中的图片
	alignSelectedImage(editor: Editor, alignment: 'left' | 'center' | 'right') {
		const selection = editor.getSelection();
		if (!selection) {
			new Notice(this.t('selectImageFirst'));
			return;
		}

		// 检查是否选中的是图片
		if (!selection.includes('![') && !selection.includes('[[')) {
			new Notice(this.t('selectImage'));
			return;
		}

		const alignedText = ImageAlignment.applyAlignment(selection, alignment);
		editor.replaceSelection(alignedText);

		// 根据对齐方式显示对应的消息
		const alignmentKey = alignment === 'left' ? 'imageAlignedLeft' : alignment === 'center' ? 'imageAlignedCenter' : 'imageAlignedRight';
		new Notice(this.t(alignmentKey));
	}

	// 添加编辑器上下文菜单项
	addAlignmentMenuItems(menu: Menu, editor: Editor) {
		const selection = editor.getSelection();

		// 检查是否选中了图片
		if (!selection || (!selection.includes('![') && !selection.includes('[['))) {
			return;
		}

		menu.addSeparator();

		menu.addItem((item: MenuItem) => {
			item.setTitle(this.t('alignImageLeft'))
				.setIcon('align-left')
				.onClick(() => {
					this.alignSelectedImage(editor, 'left');
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle(this.t('alignImageCenter'))
				.setIcon('align-center')
				.onClick(() => {
					this.alignSelectedImage(editor, 'center');
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle(this.t('alignImageRight'))
				.setIcon('align-right')
				.onClick(() => {
					this.alignSelectedImage(editor, 'right');
				});
		});
	}

	/**
	 * 确保目录存在（支持递归创建）
	 */
	async ensureFolderExists(path: string): Promise<boolean> {
		const normalizedPath = normalizeVaultPath(path);

		if (!normalizedPath) {
			return true;
		}

		if (!isPathSafe(normalizedPath)) {
			return false;
		}

		const { vault } = this.app;
		const segments = normalizedPath.split('/').filter(Boolean);
		let currentPath = '';

		for (const segment of segments) {
			currentPath = currentPath ? `${currentPath}/${segment}` : segment;
			const existing = vault.getAbstractFileByPath(currentPath);

			if (existing instanceof TFolder) {
				continue;
			}

			if (existing) {
				return false;
			}

			try {
				await vault.createFolder(currentPath);
			} catch {
				// 并发创建时忽略“已存在”场景
				const retried = vault.getAbstractFileByPath(currentPath);
				if (!(retried instanceof TFolder)) {
					return false;
				}
			}
		}

		return true;
	}

	// 安全删除文件到隔离文件夹
	async safeDeleteFile(file: TFile): Promise<boolean> {
		const { vault } = this.app;

		if (!this.settings.useTrashFolder) {
			// 按用户的 Obsidian 删除偏好执行删除
			try {
				await this.app.fileManager.trashFile(file);
				return true;
			} catch (error) {
				console.error('删除文件失败:', error);
				new Notice(this.t('deleteFailedWithName', { name: file.name }));
				return false;
			}
		}

		// 移动到隔离文件夹
		// 使用双下划线 __ 作为分隔符，避免文件名中包含下划线时解析错误
		const trashPath = normalizeVaultPath(this.settings.trashFolder) || DEFAULT_SETTINGS.trashFolder;

		if (!isPathSafe(trashPath)) {
			new Notice(this.t('operationFailed', { name: file.name }));
			return false;
		}

		const fileName = file.name;
		const timestamp = Date.now();
		const encodedOriginalPath = encodeURIComponent(normalizeVaultPath(file.path) || file.name);
		const newFileName = `${timestamp}__${encodedOriginalPath}`;
		const targetPath = `${trashPath}/${newFileName}`;

		try {
			// 确保隔离文件夹存在
			const folderReady = await this.ensureFolderExists(trashPath);
			if (!folderReady) {
				new Notice(this.t('operationFailed', { name: fileName }));
				return false;
			}

			// 移动文件到隔离文件夹
			await vault.rename(file, targetPath);
			new Notice(this.t('movedToTrash', { name: fileName }));
			return true;
		} catch (error) {
			console.error('移动文件到隔离文件夹失败:', error);
			new Notice(this.t('operationFailed', { name: fileName }));
			return false;
		}
	}

	// 恢复隔离文件夹中的文件
	async restoreFile(file: TFile, originalPath: string): Promise<boolean> {
		const { vault } = this.app;
		const normalizedOriginalPath = normalizeVaultPath(safeDecodeURIComponent(originalPath));

		if (!normalizedOriginalPath || !isPathSafe(normalizedOriginalPath)) {
			new Notice(this.t('restoreFailed', { message: this.t('error') }));
			return false;
		}

		const targetFile = vault.getAbstractFileByPath(normalizedOriginalPath);
		if (targetFile) {
			new Notice(this.t('restoreFailed', { message: this.t('targetFileExists') }));
			return false;
		}

		const parentPath = getParentPath(normalizedOriginalPath);
		if (parentPath) {
			const parentReady = await this.ensureFolderExists(parentPath);
			if (!parentReady) {
				new Notice(this.t('restoreFailed', { message: this.t('error') }));
				return false;
			}
		}

		const restoredName = getFileNameFromPath(normalizedOriginalPath) || file.name;

		try {
			await vault.rename(file, normalizedOriginalPath);
			new Notice(this.t('restoreSuccess', { name: restoredName }));
			return true;
		} catch (error) {
			console.error('恢复文件失败:', error);
			new Notice(this.t('restoreFailed', { message: (error as Error).message }));
			return false;
		}
	}

	// 彻底删除隔离文件夹中的文件
	async permanentlyDeleteFile(file: TFile): Promise<boolean> {
		try {
			await this.app.fileManager.trashFile(file);
			new Notice(this.t('fileDeleted', { name: file.name }));
			return true;
		} catch (error) {
			console.error('彻底删除文件失败:', error);
			new Notice(this.t('deleteFailed'));
			return false;
		}
	}
}

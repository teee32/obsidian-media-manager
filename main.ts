import { Plugin, Editor, TFile, TFolder, TAbstractFile, MarkdownView, Notice, Menu, MenuItem } from 'obsidian';
import { ImageLibraryView, VIEW_TYPE_IMAGE_LIBRARY } from './view/ImageLibraryView';
import { UnreferencedImagesView, VIEW_TYPE_UNREFERENCED_IMAGES } from './view/UnreferencedImagesView';
import { TrashManagementView, VIEW_TYPE_TRASH_MANAGEMENT } from './view/TrashManagementView';
import { DuplicateDetectionView, VIEW_TYPE_DUPLICATE_DETECTION } from './view/DuplicateDetectionView';
import { MediaPreviewModal } from './view/MediaPreviewModal';
import { ImageManagerSettings, DEFAULT_SETTINGS, SettingsTab } from './settings';
import { ImageAlignment, AlignmentType } from './utils/imageAlignment';
import { AlignmentPostProcessor } from './utils/postProcessor';
import { t as translate, getSystemLanguage, Language, Translations } from './utils/i18n';
import { getEnabledExtensions, isMediaFile } from './utils/mediaTypes';
import { isPathSafe } from './utils/security';
import { getFileNameFromPath, getParentPath, normalizeVaultPath, safeDecodeURIComponent } from './utils/path';
import { ThumbnailCache } from './utils/thumbnailCache';
import { MediaFileIndex } from './utils/fileWatcher';

export default class ImageManagerPlugin extends Plugin {
	settings: ImageManagerSettings = DEFAULT_SETTINGS;
	private static readonly LEGACY_TRASH_FOLDER = '.obsidian-media-toolkit-trash';
	// 缓存引用的图片以提高大型 Vault 的性能
	private referencedImagesCache: Set<string> | null = null;
	private cacheTimestamp: number = 0;
	private static readonly CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟
	private refreshViewsTimer: ReturnType<typeof setTimeout> | null = null;

	// 性能：缩略图缓存 + 增量文件索引
	thumbnailCache: ThumbnailCache = new ThumbnailCache();
	fileIndex: MediaFileIndex = new MediaFileIndex(null as any);
	private indexedExtensionsKey: string = '';
	private indexedTrashFolder: string = '';

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

		// 加载样式
		this.addStyle();

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
				this.openImageLibrary();
			}
		});

		this.addCommand({
			id: 'find-unreferenced-images',
			name: this.t('cmdFindUnreferencedImages'),
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				this.findUnreferencedImages();
			}
		});

		// 缓存刷新命令
		this.addCommand({
			id: 'refresh-cache',
			name: this.t('cmdRefreshCache'),
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				this.refreshCache();
			}
		});

		// 重复检测命令
		this.addCommand({
			id: 'open-duplicate-detection',
			name: this.t('cmdDuplicateDetection'),
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				this.openDuplicateDetection();
			}
		});

		// 隔离管理命令
		this.addCommand({
			id: 'open-trash-management',
			name: this.t('cmdTrashManagement'),
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				this.openTrashManagement();
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
		this.registerEvent(
			// @ts-ignore - editor-context-menu event
			this.app.workspace.on('editor-context-menu', (menu: any, editor: any) => {
				this.addAlignmentMenuItems(menu, editor);
			})
		);

		// 添加设置标签页
		this.addSettingTab(new SettingsTab(this.app, this));

		// 注册快捷键
		this.registerKeyboardShortcuts();

		// 监听 Vault 文件变化，自动失效缓存并刷新视图
		this.registerVaultEventListeners();

		// 启动时执行隔离文件夹自动清理
		this.autoCleanupTrashOnStartup();
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
						await vault.delete(file);
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
	 * 注册快捷键
	 */
	registerKeyboardShortcuts() {
		// Ctrl+Shift+M 打开媒体库
		this.addCommand({
			id: 'open-media-library-shortcut',
			name: this.t('cmdOpenMediaLibrary'),
			hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'm' }],
			callback: () => {
				this.openImageLibrary();
			}
		});

		// Ctrl+Shift+U 查找未引用媒体
		this.addCommand({
			id: 'find-unreferenced-media-shortcut',
			name: this.t('cmdFindUnreferencedMedia'),
			hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'u' }],
			callback: () => {
				this.findUnreferencedImages();
			}
		});

		// Ctrl+Shift+T 打开隔离文件夹管理
		this.addCommand({
			id: 'open-trash-management-shortcut',
			name: this.t('cmdOpenTrashManagement'),
			hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 't' }],
			callback: () => {
				this.openTrashManagement();
			}
		});
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
	private async syncPerformanceInfraSettings(forceFullScan: boolean = false): Promise<void> {
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
			await this.fileIndex.fullScan();
		}
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
				tasks.push(view.loadTrashItems());
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
		workspace.revealLeaf(leaf);
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
		new MediaPreviewModal(this.app, this, file).open();
	}

	onunload() {
		if (this.refreshViewsTimer) {
			clearTimeout(this.refreshViewsTimer);
			this.refreshViewsTimer = null;
		}
		// 关闭缩略图缓存
		this.thumbnailCache.close();
		this.fileIndex.clear();

		this.app.workspace.detachLeavesOfType(VIEW_TYPE_IMAGE_LIBRARY);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_UNREFERENCED_IMAGES);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_TRASH_MANAGEMENT);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_DUPLICATE_DETECTION);
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
		workspace.revealLeaf(leaf);
	}

	// 加载样式文件
	// 注意：优先使用 styles.css 中的样式，addStyle 作为后备方案
	addStyle() {
		// 尝试从外部样式文件加载样式
		this.loadExternalStyles();

		// 同时添加内联样式作为后备，确保样式始终可用
		this.addInlineStyle();
	}

	// 从外部样式文件加载
	async loadExternalStyles() {
		// 检查是否已存在样式元素，避免重复添加
		if (document.getElementById('obsidian-media-toolkit-styles')) {
			return;
		}

		try {
			const stylesFile = this.app.vault.getAbstractFileByPath('styles.css');
			if (stylesFile && stylesFile instanceof TFile) {
				const content = await this.app.vault.read(stylesFile);
				const sanitizedCss = content
					// 阻止 expression() 等 JavaScript 执行
					.replace(/expression\s*\(/gi, '/* blocked */(')
					.replace(/javascript\s*:/gi, '/* blocked */:')
					.replace(/vbscript\s*:/gi, '/* blocked */:')
					// 阻止 url() 引用外部资源
					.replace(/url\s*\([^)]*\)/gi, '/* url() blocked */')
					// 阻止 @import 引入外部样式
					.replace(/@import\s*[^;]+;/gi, '/* @import blocked */')
					// 阻止事件处理器属性 (onclick, onerror, onload, onmouseover 等)
					.replace(/\bon(click|error|load|mouseover|mouseout|focus|blur|change|submit|keydown|keyup)\s*=/gi, 'data-blocked-on$1=')
					// 阻止 filter:url() 引用外部资源
					.replace(/filter\s*:\s*url\s*\([^)]*\)/gi, '/* filter:url() blocked */')
					// 阻止 behavior (IE 行为属性)
					.replace(/behavior\s*:/gi, '/* behavior blocked */:')
					// 阻止 -ms-behavior (IE 专有)
					.replace(/-ms-behavior\s*:/gi, '/* -ms-behavior blocked */:')
					// 阻止 binding (XUL 绑定)
					.replace(/binding\s*:\s*url\s*\([^)]*\)/gi, '/* binding blocked */')
					// 阻止 animation/transition 中的 url()
					.replace(/(animation|transition)\s*:[^;]*url\s*\([^)]*\)/gi, '/* $1 url() blocked */');
				const styleEl = document.createElement('style');
				styleEl.id = 'obsidian-media-toolkit-styles';
				styleEl.textContent = sanitizedCss;
				document.head.appendChild(styleEl);
			}
		} catch (error) {
			console.log('加载外部样式文件失败，使用内联样式', error);
		}
	}

	// 内联样式（后备方案）
	addInlineStyle() {
		// 检查是否已存在样式元素，避免重复添加
		if (document.getElementById('image-manager-styles')) {
			return;
		}

		const styleEl = document.createElement('style');
		styleEl.id = 'image-manager-styles';
		styleEl.textContent = `/* Obsidian Image Manager Plugin Styles */

/* ===== 全局样式 ===== */
.image-library-view,
.unreferenced-images-view {
	height: 100%;
	overflow-y: auto;
	padding: 16px;
	box-sizing: border-box;
}

/* ===== 头部样式 ===== */
.image-library-header,
.unreferenced-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.image-library-header h2,
.unreferenced-header h2 {
	margin: 0;
	font-size: 1.5em;
	font-weight: 600;
}

.image-stats,
.header-description {
	margin-top: 4px;
	color: var(--text-muted);
	font-size: 0.9em;
}

.header-description {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

/* ===== 按钮样式 ===== */
.refresh-button,
.action-button,
.item-button {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	border: none;
	background: var(--background-secondary);
	color: var(--text-normal);
	border-radius: 4px;
	cursor: pointer;
	transition: background 0.2s, color 0.2s;
}

.refresh-button:hover,
.action-button:hover,
.item-button:hover {
	background: var(--background-tertiary);
}

.refresh-button svg,
.action-button svg,
.item-button svg {
	width: 16px;
	height: 16px;
}

.action-button.danger,
.item-button.danger {
	color: var(--text-error);
}

.action-button.danger:hover,
.item-button.danger:hover {
	background: var(--background-modifier-error);
	color: white;
}

.header-actions {
	display: flex;
	gap: 8px;
}

/* ===== 排序选择器 ===== */
.sort-select {
	padding: 6px 12px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-secondary);
	color: var(--text-normal);
	font-size: 0.9em;
	cursor: pointer;
}

.order-button {
	padding: 6px 8px;
	margin-left: 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-secondary);
	color: var(--text-normal);
	cursor: pointer;
}

.order-button svg {
	width: 16px;
	height: 16px;
}

/* ===== 图片网格 ===== */
.image-grid {
	display: grid;
	gap: 16px;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.image-grid-small {
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

.image-grid-medium {
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.image-grid-large {
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* ===== 图片项 ===== */
.image-item {
	display: flex;
	flex-direction: column;
	background: var(--background-secondary);
	border-radius: 8px;
	overflow: hidden;
	transition: transform 0.2s, box-shadow 0.2s;
	cursor: pointer;
}

.image-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-container {
	position: relative;
	width: 100%;
	padding-top: 100%;
	overflow: hidden;
	background: var(--background-tertiary);
}

.image-container img {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.image-info {
	padding: 8px;
	border-top: 1px solid var(--background-modifier-border);
}

.image-name {
	font-size: 0.85em;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.image-size {
	font-size: 0.75em;
	color: var(--text-muted);
	margin-top: 2px;
}

/* ===== 未引用图片列表 ===== */
.stats-bar {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px 16px;
	background: var(--background-secondary);
	border-radius: 6px;
	margin-bottom: 16px;
}

.stats-count {
	font-weight: 600;
	color: var(--text-warning);
}

.stats-size {
	color: var(--text-muted);
}

.unreferenced-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.unreferenced-item {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px;
	background: var(--background-secondary);
	border-radius: 8px;
	transition: background 0.2s;
}

.unreferenced-item:hover {
	background: var(--background-tertiary);
}

.item-thumbnail {
	width: 60px;
	height: 60px;
	flex-shrink: 0;
	border-radius: 4px;
	overflow: hidden;
	background: var(--background-tertiary);
}

.item-thumbnail img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.item-info {
	flex: 1;
	min-width: 0;
}

.item-name {
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-path {
	font-size: 0.8em;
	color: var(--text-muted);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-top: 2px;
}

.item-size {
	font-size: 0.85em;
	color: var(--text-muted);
	margin-top: 4px;
}

.item-actions {
	display: flex;
	gap: 8px;
	flex-shrink: 0;
}

/* ===== 空状态 ===== */
.empty-state,
.loading-state,
.success-state,
.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	color: var(--text-muted);
	text-align: center;
}

.empty-state::before {
	content: '🖼️';
	font-size: 48px;
	margin-bottom: 16px;
}

.success-state::before {
	content: '✅';
	font-size: 48px;
	margin-bottom: 16px;
}

.error-state::before {
	content: '❌';
	font-size: 48px;
	margin-bottom: 16px;
}

/* 加载动画 */
.spinner {
	width: 32px;
	height: 32px;
	border: 3px solid var(--background-modifier-border);
	border-top-color: var(--text-accent);
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 16px;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

/* ===== 设置页面样式 ===== */
.settings-divider {
	margin: 24px 0;
	border: none;
	border-top: 1px solid var(--background-modifier-border);
}

.settings-description {
	color: var(--text-muted);
	margin-bottom: 8px;
}

.settings-list {
	margin: 0;
	padding-left: 20px;
	color: var(--text-muted);
}

.settings-list li {
	margin-bottom: 4px;
}

/* ===== 搜索框样式 ===== */
.search-container {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 16px;
	padding: 8px 12px;
	background: var(--background-secondary);
	border-radius: 6px;
}

.search-input {
	flex: 1;
	padding: 8px 12px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-primary);
	color: var(--text-normal);
	font-size: 0.9em;
}

.search-input:focus {
	outline: none;
	border-color: var(--text-accent);
}

.search-icon {
	color: var(--text-muted);
}

.search-results-count {
	color: var(--text-muted);
	font-size: 0.85em;
}

.clear-search {
	padding: 4px;
	border: none;
	background: transparent;
	color: var(--text-muted);
	cursor: pointer;
}

.clear-search:hover {
	color: var(--text-normal);
}

/* ===== 分页控件 ===== */
.pagination {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	margin-top: 20px;
	padding: 16px;
	background: var(--background-secondary);
	border-radius: 6px;
}

.page-button {
	padding: 6px 12px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-secondary);
	color: var(--text-normal);
	cursor: pointer;
}

.page-button:hover:not(:disabled) {
	background: var(--background-tertiary);
}

.page-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.page-info {
	color: var(--text-muted);
	font-size: 0.9em;
}

.page-jump-input {
	width: 50px;
	padding: 4px 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-primary);
	color: var(--text-normal);
	text-align: center;
}

/* ===== 选择模式工具栏 ===== */
.selection-toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
	padding: 12px;
	background: var(--background-secondary);
	border-radius: 6px;
}

.selection-count {
	font-weight: 600;
	color: var(--text-accent);
}

.toolbar-button {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	border: none;
	background: var(--background-tertiary);
	color: var(--text-normal);
	border-radius: 4px;
	cursor: pointer;
}

.toolbar-button:hover {
	background: var(--background-modifier-border);
}

.toolbar-button.danger {
	color: var(--text-error);
}

.toolbar-button.danger:hover {
	background: var(--background-modifier-error);
	color: white;
}

/* ===== 图片选择框 ===== */
.image-item {
	position: relative;
}

.item-checkbox {
	position: absolute;
	top: 8px;
	left: 8px;
	z-index: 10;
	width: 18px;
	height: 18px;
	cursor: pointer;
}

/* ===== 隔离文件管理视图 ===== */
.trash-management-view {
	height: 100%;
	overflow-y: auto;
	padding: 16px;
	box-sizing: border-box;
}

.trash-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.trash-header h2 {
	margin: 0;
	font-size: 1.5em;
	font-weight: 600;
}

.trash-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.trash-item {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px;
	background: var(--background-secondary);
	border-radius: 8px;
	transition: background 0.2s;
}

.trash-item:hover {
	background: var(--background-tertiary);
}

.item-icon {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--background-tertiary);
	border-radius: 4px;
	color: var(--text-muted);
}

.item-original-path {
	font-size: 0.8em;
	color: var(--text-muted);
	margin-top: 2px;
}

.item-date {
	font-size: 0.8em;
	color: var(--text-muted);
	margin-top: 2px;
}

/* ===== 媒体预览 Modal ===== */
.media-preview-modal {
	max-width: 90vw;
	max-height: 90vh;
}

.media-preview-modal .modal-content {
	padding: 0;
	background: var(--background-primary);
}

.preview-close {
	position: absolute;
	top: 10px;
	right: 15px;
	font-size: 24px;
	color: var(--text-muted);
	cursor: pointer;
	z-index: 100;
}

.preview-close:hover {
	color: var(--text-normal);
}

.preview-container {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 400px;
	max-height: 70vh;
	overflow: auto;
}

.preview-image {
	max-width: 100%;
	max-height: 70vh;
	object-fit: contain;
}

.preview-video,
.preview-audio {
	max-width: 100%;
}

.preview-pdf {
	width: 100%;
	height: 70vh;
	border: none;
}

.preview-unsupported {
	padding: 40px;
	color: var(--text-muted);
}

.preview-nav {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	left: 0;
	right: 0;
	display: flex;
	justify-content: space-between;
	padding: 0 20px;
	pointer-events: none;
}

.nav-button {
	pointer-events: auto;
	font-size: 32px;
	padding: 10px 15px;
	border: none;
	background: var(--background-secondary);
	color: var(--text-normal);
	border-radius: 4px;
	cursor: pointer;
}

.nav-button:hover {
	background: var(--background-tertiary);
}

.nav-info {
	position: absolute;
	bottom: 10px;
	left: 50%;
	transform: translateX(-50%);
	padding: 4px 12px;
	background: var(--background-secondary);
	border-radius: 4px;
	font-size: 0.9em;
	color: var(--text-muted);
}

.preview-info-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 20px;
	background: var(--background-secondary);
	border-top: 1px solid var(--background-modifier-border);
}

.info-name {
	font-weight: 500;
}

.info-actions {
	display: flex;
	gap: 8px;
}

.info-actions button {
	padding: 4px 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: transparent;
	color: var(--text-normal);
	cursor: pointer;
}

.info-actions button:hover {
	background: var(--background-tertiary);
}

/* ===== 响应式设计 ===== */
@media (max-width: 768px) {
	.image-library-header,
	.unreferenced-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	.header-actions {
		width: 100%;
		justify-content: flex-end;
	}

	.unreferenced-item {
		flex-direction: column;
		align-items: flex-start;
	}

	.item-actions {
		width: 100%;
		justify-content: flex-end;
		margin-top: 8px;
	}
}`;
		document.head.appendChild(styleEl);
	}

	async loadSettings() {
		try {
			const loaded = await this.loadData();
			const sanitized = loaded && typeof loaded === 'object'
				? Object.fromEntries(
					Object.entries(loaded).filter(([k]) =>
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
		} catch (error) {
			console.error('加载设置失败，使用默认设置:', error);
			this.settings = { ...DEFAULT_SETTINGS };
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
		workspace.revealLeaf(leaf);
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
		workspace.revealLeaf(leaf);
	}

	// 获取所有媒体文件（图片、音视频、PDF）
	async getAllImageFiles(): Promise<TFile[]> {
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
	async getAllMediaFiles(): Promise<TFile[]> {
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

				// 匹配 Markdown 链接（图片/音视频/PDF）
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
		const allImages = await this.getAllImageFiles();
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
			// 直接删除
			try {
				await vault.delete(file);
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
		const { vault } = this.app;

		try {
			await vault.delete(file);
			new Notice(this.t('fileDeleted', { name: file.name }));
			return true;
		} catch (error) {
			console.error('彻底删除文件失败:', error);
			new Notice(this.t('deleteFailed'));
			return false;
		}
	}
}

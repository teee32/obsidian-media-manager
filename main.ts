import { Plugin, Editor, TFile, MarkdownView, Notice, Menu, MenuItem, setIcon, EditorPosition, EditorSelection, Events } from 'obsidian';
import { ImageLibraryView, VIEW_TYPE_IMAGE_LIBRARY } from './view/ImageLibraryView';
import { UnreferencedImagesView, VIEW_TYPE_UNREFERENCED_IMAGES } from './view/UnreferencedImagesView';
import { TrashManagementView, VIEW_TYPE_TRASH_MANAGEMENT } from './view/TrashManagementView';
import { MediaPreviewModal } from './view/MediaPreviewModal';
import { ImageManagerSettings, DEFAULT_SETTINGS, SettingsTab } from './settings';
import { ImageAlignment, AlignmentType } from './utils/imageAlignment';
import { AlignmentPostProcessor } from './utils/postProcessor';
import { t as translate, getSystemLanguage, Language } from './utils/i18n';

export default class ImageManagerPlugin extends Plugin {
	settings: ImageManagerSettings = DEFAULT_SETTINGS;
	// 缓存引用的图片以提高大型 Vault 的性能
	private referencedImagesCache: Set<string> | null = null;
	private cacheTimestamp: number = 0;
	private static readonly CACHE_DURATION = 5 * 60 * 1000; // 缓存5分钟

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
		return translate(this.getCurrentLanguage(), key as any, params);
	}

	async onload() {
		await this.loadSettings();

		// 加载样式
		this.addStyle();

		// 注册图片库视图
		this.registerView(VIEW_TYPE_IMAGE_LIBRARY, (leaf) => new ImageLibraryView(leaf, this));

		// 注册未引用图片视图
		this.registerView(VIEW_TYPE_UNREFERENCED_IMAGES, (leaf) => new UnreferencedImagesView(leaf, this));

		// 注册隔离文件夹管理视图
		this.registerView(VIEW_TYPE_TRASH_MANAGEMENT, (leaf) => new TrashManagementView(leaf, this));

		// 注册图片对齐 PostProcessor
		const alignmentProcessor = new AlignmentPostProcessor(this);
		alignmentProcessor.register();

		// 添加命令面板命令
		this.addCommand({
			id: 'open-image-library',
			name: '图片库',
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				this.openImageLibrary();
			}
		});

		this.addCommand({
			id: 'find-unreferenced-images',
			name: '查找未引用图片',
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				this.findUnreferencedImages();
			}
		});

		// 图片对齐命令
		this.addCommand({
			id: 'align-image-left',
			name: '图片居左对齐',
			editorCallback: (editor: Editor) => {
				this.alignSelectedImage(editor, 'left');
			}
		});

		this.addCommand({
			id: 'align-image-center',
			name: '图片居中对齐',
			editorCallback: (editor: Editor) => {
				this.alignSelectedImage(editor, 'center');
			}
		});

		this.addCommand({
			id: 'align-image-right',
			name: '图片居右对齐',
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
	}

	/**
	 * 注册快捷键
	 */
	registerKeyboardShortcuts() {
		// Ctrl+Shift+M 打开媒体库
		this.addCommand({
			id: 'open-media-library-shortcut',
			name: '打开媒体库',
			hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'm' }],
			callback: () => {
				this.openImageLibrary();
			}
		});

		// Ctrl+Shift+U 查找未引用媒体
		this.addCommand({
			id: 'find-unreferenced-media-shortcut',
			name: '查找未引用媒体',
			hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'u' }],
			callback: () => {
				this.findUnreferencedImages();
			}
		});

		// Ctrl+Shift+T 打开隔离文件夹管理
		this.addCommand({
			id: 'open-trash-management-shortcut',
			name: '打开隔离文件管理',
			hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 't' }],
			callback: () => {
				this.openTrashManagement();
			}
		});
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
		new MediaPreviewModal(this.app, this, file).open();
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_IMAGE_LIBRARY);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_UNREFERENCED_IMAGES);
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
				const styleEl = document.createElement('style');
				styleEl.id = 'obsidian-media-toolkit-styles';
				styleEl.textContent = content;
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
		styleEl.textContent = `\/* Obsidian Image Manager Plugin Styles *\/

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
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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
		const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];
		const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
		const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
		const documentExtensions = ['.pdf'];

		const allExtensions = [...imageExtensions, ...videoExtensions, ...audioExtensions, ...documentExtensions];
		const allFiles = this.app.vault.getFiles();
		return allFiles.filter(file =>
			allExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
		);
	}

	// 获取所有图片文件（保留兼容性）
	async getAllMediaFiles(): Promise<TFile[]> {
		return this.getAllImageFiles();
	}

	// 获取所有Markdown文件中引用的图片
	async getReferencedImages(): Promise<Set<string>> {
		const now = Date.now();

		// 检查缓存是否有效
		if (this.referencedImagesCache && (now - this.cacheTimestamp) < ImageManagerPlugin.CACHE_DURATION) {
			return this.referencedImagesCache;
		}

		const referenced = new Set<string>();
		const { vault } = this.app;

		// 使用正则扫描所有 Markdown 文件
		const markdownFiles = vault.getFiles().filter(f => f.extension === 'md');
		const totalFiles = markdownFiles.length;

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
			const batch = markdownFiles.slice(i, i + BATCH_SIZE);

			await Promise.all(batch.map(async (file) => {
				const content = await vault.read(file);

				// 匹配各种链接格式
				// [[filename.png]] 或 [[path/to/filename.png]]
				const wikiLinkPattern = /\[\[([^\]|]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|mov|mp4|mp3|wav|pdf))\]\]/gi;
				// [[filename.png|alias]] 带别名的
				const wikiLinkAliasPattern = /\[\[([^|\]]+)\|([^\]]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|mov|mp4|mp3|wav|pdf))\]\]/gi;
				// ![alt](path/to/image.png)
				const markdownLinkPattern = /!\[.*?\]\(([^)]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp|mov|mp4|mp3|wav|pdf))\)/gi;

				let match;

				// 匹配基本 Wiki 链接
				while ((match = wikiLinkPattern.exec(content)) !== null) {
					const path = match[1].toLowerCase();
					referenced.add(path);
					// 添加文件名
					const fileName = path.split('/').pop() || path;
					referenced.add(fileName);
				}

				// 匹配带别名的 Wiki 链接
				while ((match = wikiLinkAliasPattern.exec(content)) !== null) {
					const path = match[1].toLowerCase();
					referenced.add(path);
					const fileName = path.split('/').pop() || path;
					referenced.add(fileName);
				}

				// 匹配 Markdown 图片链接
				while ((match = markdownLinkPattern.exec(content)) !== null) {
					const url = match[1];
					// 只处理相对路径或仓库内文件
					if (!url.startsWith('http')) {
						const filename = url.split('/').pop()?.toLowerCase() || '';
						referenced.add(filename);
						// 也添加完整路径
						referenced.add(url.toLowerCase());
					}
				}
			}));

			// 让 UI 有机会更新
			await new Promise(resolve => setTimeout(resolve, 0));
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
			return !referenced.has(file.name.toLowerCase());
		});
	}

	// 打开图片所在的笔记
	async openImageInNotes(imageFile: TFile) {
		const { workspace, vault } = this.app;
		const results: { file: TFile; line: number }[] = [];
		const imageName = imageFile.name;

		// 使用正则扫描所有 Markdown 文件
		const markdownFiles = vault.getFiles().filter(f => f.extension === 'md');

		for (const file of markdownFiles) {
			const content = await vault.read(file);
			const lines = content.split('\n');

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				// 使用更精确的匹配：匹配图片链接格式
				if (line.includes(imageName) &&
					(line.includes('[[') || line.includes('![') || line.includes('](', ))) {
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
			new Notice('该图片未被任何笔记引用');
		}
	}

	// 对齐选中的图片
	alignSelectedImage(editor: Editor, alignment: 'left' | 'center' | 'right') {
		const selection = editor.getSelection();
		if (!selection) {
			new Notice('请先选中一张图片');
			return;
		}

		// 检查是否选中的是图片
		if (!selection.includes('![') && !selection.includes('[[')) {
			new Notice('请选中图片');
			return;
		}

		const alignedText = ImageAlignment.applyAlignment(selection, alignment);
		editor.replaceSelection(alignedText);
		new Notice(`图片已${alignment === 'left' ? '居左' : alignment === 'center' ? '居中' : '居右'}对齐`);
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
			item.setTitle('图片居左对齐')
				.setIcon('align-left')
				.onClick(() => {
					this.alignSelectedImage(editor, 'left');
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle('图片居中对齐')
				.setIcon('align-center')
				.onClick(() => {
					this.alignSelectedImage(editor, 'center');
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle('图片居右对齐')
				.setIcon('align-right')
				.onClick(() => {
					this.alignSelectedImage(editor, 'right');
				});
		});
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
				new Notice(`删除失败: ${file.name}`);
				return false;
			}
		}

		// 移动到隔离文件夹
		// 使用双下划线 __ 作为分隔符，避免文件名中包含下划线时解析错误
		const trashPath = this.settings.trashFolder;
		const fileName = file.name;
		const timestamp = Date.now();
		const newFileName = `${timestamp}__${fileName}`;
		const targetPath = `${trashPath}/${newFileName}`;

		try {
			// 确保隔离文件夹存在
			const trashFolder = vault.getAbstractFileByPath(trashPath);
			if (!trashFolder) {
				await vault.createFolder(trashPath);
			}

			// 移动文件到隔离文件夹
			await vault.rename(file, targetPath);
			new Notice(`已移至隔离文件夹: ${fileName}`);
			return true;
		} catch (error) {
			console.error('移动文件到隔离文件夹失败:', error);
			// 如果移动失败，尝试直接删除
			try {
				await vault.delete(file);
				new Notice(`已删除: ${fileName}（隔离失败）`);
				return true;
			} catch (deleteError) {
				console.error('删除文件失败:', deleteError);
				new Notice(`操作失败: ${fileName}`);
				return false;
			}
		}
	}

	// 恢复隔离文件夹中的文件
	async restoreFile(file: TFile, originalPath: string): Promise<boolean> {
		const { vault } = this.app;

		try {
			await vault.rename(file, originalPath);
			new Notice(`已恢复文件`);
			return true;
		} catch (error) {
			console.error('恢复文件失败:', error);
			new Notice(`恢复失败`);
			return false;
		}
	}

	// 彻底删除隔离文件夹中的文件
	async permanentlyDeleteFile(file: TFile): Promise<boolean> {
		const { vault } = this.app;

		try {
			await vault.delete(file);
			new Notice(`已彻底删除: ${file.name}`);
			return true;
		} catch (error) {
			console.error('彻底删除文件失败:', error);
			new Notice(`删除失败`);
			return false;
		}
	}
}

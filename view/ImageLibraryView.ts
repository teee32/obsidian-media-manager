import { TFile, ItemView, WorkspaceLeaf, setIcon, Menu, MenuItem, Notice } from 'obsidian';
import ImageManagerPlugin from '../main';
import { DeleteConfirmModal, DeleteTarget } from './DeleteConfirmModal';
import { formatFileSize, debounce } from '../utils/format';
import { normalizeVaultPath } from '../utils/path';
import { getMediaType, getFileExtension, getDocumentDisplayLabel } from '../utils/mediaTypes';
import { generateThumbnail } from '../utils/thumbnailCache';
import { findMatchingRule, computeTarget, OrganizeContext } from '../utils/ruleEngine';
import { parseExif } from '../utils/exifReader';
import { processImage, getFormatExtension } from '../utils/mediaProcessor';

export const VIEW_TYPE_IMAGE_LIBRARY = 'image-library-view';

interface ImageItem {
	file: TFile;
	path: string;
	name: string;
	size: number;
	modified: number;
	dimensions?: { width: number; height: number };
}

export class ImageLibraryView extends ItemView {
	plugin: ImageManagerPlugin;
	images: ImageItem[] = [];
	filteredImages: ImageItem[] = [];
	private searchQuery: string = '';
	private currentPage: number = 1;
	private pageSize: number = 50;
	private selectedFiles: Set<string> = new Set();
	private isSelectionMode: boolean = false;
	private searchInput: HTMLInputElement | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	private isProcessableImage(file: TFile): boolean {
		const ext = getFileExtension(file.name);
		return ['.png', '.jpg', '.jpeg', '.webp', '.bmp'].includes(ext);
	}

	getViewType() {
		return VIEW_TYPE_IMAGE_LIBRARY;
	}

	getDisplayText() {
		return this.plugin.t('mediaLibrary');
	}

	async onOpen() {
		// 等待 contentEl 准备好（ItemView 的 contentEl 需要 Obsidian 初始化）
		let retries = 0;
		while (!this.contentEl && retries < 10) {
			await new Promise(resolve => setTimeout(resolve, 50));
			retries++;
		}
		if (!this.contentEl) {
			console.error('ImageLibraryView: contentEl not ready after retries');
			return;
		}
		this.contentEl.addClass('image-library-view');
		// 从设置中读取 pageSize
		this.pageSize = this.plugin.settings.pageSize || 50;
		await this.refreshImages();
	}

	onClose(): Promise<void> {
		// 清理工作 - 事件监听会在 View 卸载时自动清理
		return Promise.resolve();
	}

	refreshImages(): Promise<void> {
		// 如果视图已关闭或 contentEl 不可用，直接返回
		if (!this.contentEl) {
			return Promise.resolve();
		}

		// 同步最新分页设置，保证设置变更后立即生效
		this.pageSize = Math.max(1, this.plugin.settings.pageSize || 50);

		const sizeMap: Record<string, 'small' | 'medium' | 'large'> = {
			'small': 'small',
			'medium': 'medium',
			'large': 'large'
		};

		const size = sizeMap[this.plugin.settings.thumbnailSize] || 'medium';
		this.contentEl.empty();

		// 先获取所有图片数据：优先使用文件索引（增量扫描），回退到全量遍历
		let imageFiles: TFile[];
		if (this.plugin.fileIndex.isInitialized) {
			const entries = this.plugin.fileIndex.getFiles();
			imageFiles = entries
				.map(e => this.app.vault.getAbstractFileByPath(e.path))
				.filter((f): f is TFile => f instanceof TFile);
		} else {
			imageFiles = this.plugin.getAllImageFiles();
		}

		// 过滤图片文件夹（如果设置了）
		let filteredImages: TFile[];
		if (this.plugin.settings.imageFolder) {
			const folder = normalizeVaultPath(this.plugin.settings.imageFolder);
			const prefix = folder ? `${folder}/` : '';
			filteredImages = imageFiles.filter(f => {
				const normalizedPath = normalizeVaultPath(f.path);
				return normalizedPath === folder || (prefix ? normalizedPath.startsWith(prefix) : false);
			});
		} else {
			filteredImages = imageFiles;
		}

		// 排序图片
		this.images = filteredImages.map(file => ({
			file,
			path: file.path,
			name: file.name,
			size: file.stat.size,
			modified: file.stat.mtime
		}));

		this.sortImages();

		// 应用搜索过滤
		this.applySearch();

		// 当数据量变化或分页大小变化时，修正当前页码
		const totalPages = Math.max(1, Math.ceil(this.filteredImages.length / this.pageSize));
		if (this.currentPage > totalPages) {
			this.currentPage = totalPages;
		}

		// 创建头部（在获取数据之后渲染）
		this.renderHeader();
		this.renderWorkspaceSummary();

		// 创建搜索框
		this.renderSearchBox();

		// 创建选择模式工具栏
		if (this.isSelectionMode) {
			this.renderSelectionToolbar();
		}

		// 创建图片网格容器
		const grid = this.contentEl.createDiv({ cls: 'image-grid' });
		grid.addClass(`image-grid-${size}`);

		// 计算分页
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = Math.min(startIndex + this.pageSize, this.filteredImages.length);
		const pageImages = this.filteredImages.slice(startIndex, endIndex);

		// 渲染当前页的图片
		for (const image of pageImages) {
			this.renderImageItem(grid, image);
		}

		// 创建分页控件
		this.renderPagination();

		if (this.filteredImages.length === 0) {
			this.contentEl.createDiv({
				cls: 'empty-state',
				text: this.searchQuery ? this.plugin.t('noMatchingFiles') : this.plugin.t('noMediaFiles')
			});
		}

		return Promise.resolve();
	}

	private renderWorkspaceSummary() {
		const summary = this.contentEl.createDiv({ cls: 'workspace-summary-grid' });
		const totalNote = this.searchQuery
			? this.plugin.t('searchResults').replace('{count}', String(this.filteredImages.length))
			: this.plugin.t('mediaFolder');
		this.createSummaryCard(
			summary,
			this.plugin.t('mediaLibrary'),
			String(this.filteredImages.length),
			totalNote
		);
		this.createSummaryCard(
			summary,
			this.plugin.t('pageSize'),
			String(this.pageSize),
			this.plugin.settings.thumbnailSize.toUpperCase()
		);
		this.createSummaryCard(
			summary,
			this.plugin.t('defaultSortBy'),
			this.getSortLabel(this.plugin.settings.sortBy),
			this.getSortOrderLabel(this.plugin.settings.sortOrder)
		);
		this.createSummaryCard(
			summary,
			this.plugin.t('mediaFolder'),
			this.plugin.settings.imageFolder || this.plugin.t('allVault'),
			this.isSelectionMode
				? this.plugin.t('selectFiles').replace('{count}', String(this.selectedFiles.size))
				: this.plugin.t('multiSelectMode')
		);
	}

	private createSummaryCard(container: HTMLElement, label: string, value: string, note?: string) {
		const card = container.createDiv({ cls: 'workspace-summary-card' });
		card.createDiv({ cls: 'workspace-summary-label', text: label });
		card.createDiv({ cls: 'workspace-summary-value', text: value });
		if (note) {
			card.createDiv({ cls: 'workspace-summary-note', text: note });
		}
	}

	private getSortLabel(sortBy: 'name' | 'date' | 'size'): string {
		switch (sortBy) {
			case 'date':
				return this.plugin.t('sortByDate');
			case 'size':
				return this.plugin.t('sortBySize');
			case 'name':
			default:
				return this.plugin.t('sortByName');
		}
	}

	private getSortOrderLabel(sortOrder: 'asc' | 'desc'): string {
		return sortOrder === 'asc' ? this.plugin.t('sortAsc') : this.plugin.t('sortDesc');
	}

	private getMediaLabel(file: TFile): string {
		const mediaType = getMediaType(file.name);
		if (mediaType === 'document') {
			return getDocumentDisplayLabel(file.name);
		}

		const dot = file.name.lastIndexOf('.');
		if (dot !== -1 && dot < file.name.length - 1) {
			return file.name.slice(dot + 1).toUpperCase();
		}

		if (mediaType) {
			return mediaType.toUpperCase();
		}

		return 'FILE';
	}

	private copyToClipboard(text: string, successMessage: string) {
		void navigator.clipboard.writeText(text).then(() => {
			new Notice(successMessage);
		}).catch((error) => {
			console.error('复制到剪贴板失败:', error);
			new Notice(this.plugin.t('error'));
		});
	}

	private createImageActionButton(
		container: HTMLElement,
		icon: string,
		title: string,
		onClick: () => void | Promise<unknown>
	) {
		const button = container.createEl('button', { cls: 'image-card-action', attr: { 'aria-label': title } });
		setIcon(button, icon);
		button.title = title;
		button.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			void onClick();
		});
		return button;
	}

	/**
	 * 应用搜索过滤
	 */
	applySearch() {
		if (!this.searchQuery) {
			this.filteredImages = [...this.images];
		} else {
			const query = this.searchQuery.toLowerCase();
			this.filteredImages = this.images.filter(img =>
				img.name.toLowerCase().includes(query) ||
				img.path.toLowerCase().includes(query)
			);
		}
	}

	/**
	 * 渲染搜索框
	 */
	renderSearchBox() {
		const searchContainer = this.contentEl.createDiv({ cls: 'search-container' });
		const searchField = searchContainer.createDiv({ cls: 'search-field' });

		// 搜索图标
		const searchIcon = searchField.createDiv({ cls: 'search-icon' });
		setIcon(searchIcon, 'search');

		this.searchInput = searchField.createEl('input', {
			type: 'text',
			cls: 'search-input',
			attr: {
				placeholder: this.plugin.t('searchPlaceholder'),
				value: this.searchQuery
			}
		});

		// 清除搜索按钮
		if (this.searchQuery) {
			const clearBtn = searchField.createEl('button', { cls: 'clear-search' });
			setIcon(clearBtn, 'x');
			clearBtn.addEventListener('click', () => {
				this.searchQuery = '';
				this.currentPage = 1;
				this.applySearch();
				void this.refreshImages();
			});
		}

		// 使用防抖处理搜索输入
		const debouncedSearch = debounce(() => {
			this.currentPage = 1;
			this.applySearch();
			void this.refreshImages();
		}, 300);

		this.searchInput.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			this.searchQuery = target.value;
			debouncedSearch();
		});

		// 显示结果计数
		if (this.searchQuery) {
			const searchMeta = searchContainer.createDiv({ cls: 'search-meta' });
			searchMeta.createSpan({
				text: this.plugin.t('searchResults').replace('{count}', String(this.filteredImages.length)),
				cls: 'search-results-count'
			});
		}
	}

	/**
	 * 渲染选择模式工具栏
	 */
	renderSelectionToolbar() {
		const toolbar = this.contentEl.createDiv({ cls: 'selection-toolbar' });

		toolbar.createSpan({
			text: this.plugin.t('selectFiles').replace('{count}', String(this.selectedFiles.size)),
			cls: 'selection-count'
		});

		const selectAllBtn = toolbar.createEl('button', { cls: 'toolbar-button' });
		setIcon(selectAllBtn, 'check-square');
		selectAllBtn.createSpan({ cls: 'button-label', text: this.plugin.t('selectAll') });
		selectAllBtn.addEventListener('click', () => {
			this.filteredImages.forEach(img => this.selectedFiles.add(img.file.path));
			void this.refreshImages();
		});

		const deselectAllBtn = toolbar.createEl('button', { cls: 'toolbar-button' });
		setIcon(deselectAllBtn, 'square');
		deselectAllBtn.createSpan({ cls: 'button-label', text: this.plugin.t('deselectAll') });
		deselectAllBtn.addEventListener('click', () => {
			this.selectedFiles.clear();
			void this.refreshImages();
		});

		const deleteSelectedBtn = toolbar.createEl('button', { cls: 'toolbar-button danger' });
		setIcon(deleteSelectedBtn, 'trash-2');
		deleteSelectedBtn.createSpan({ cls: 'button-label', text: this.plugin.t('delete') });
		deleteSelectedBtn.addEventListener('click', () => {
			void this.deleteSelected();
		});

		// 整理按钮
		const organizeBtn = toolbar.createEl('button', { cls: 'toolbar-button' });
		setIcon(organizeBtn, 'folder-input');
		organizeBtn.createSpan({ cls: 'button-label', text: this.plugin.t('organizing') });
		organizeBtn.title = this.plugin.t('organizing');
		organizeBtn.addEventListener('click', () => {
			void this.organizeSelected();
		});

		// 压缩按钮
		const processBtn = toolbar.createEl('button', { cls: 'toolbar-button' });
		setIcon(processBtn, 'image-down');
		processBtn.createSpan({ cls: 'button-label', text: this.plugin.t('processing') });
		processBtn.title = this.plugin.t('processing');
		processBtn.addEventListener('click', () => {
			void this.processSelected();
		});

		const exitSelectionBtn = toolbar.createEl('button', { cls: 'toolbar-button' });
		setIcon(exitSelectionBtn, 'x');
		exitSelectionBtn.createSpan({ cls: 'button-label', text: this.plugin.t('cancel') });
		exitSelectionBtn.addEventListener('click', () => {
			this.isSelectionMode = false;
			this.selectedFiles.clear();
			void this.refreshImages();
		});
	}

	/**
	 * 渲染分页控件
	 */
	renderPagination() {
		const totalPages = Math.ceil(this.filteredImages.length / this.pageSize);
		if (totalPages <= 1) return;

		const pagination = this.contentEl.createDiv({ cls: 'pagination' });

		// 上一页
		const prevBtn = pagination.createEl('button', { cls: 'page-button' });
		prevBtn.textContent = this.plugin.t('prevPage');
		prevBtn.disabled = this.currentPage <= 1;
		prevBtn.addEventListener('click', () => {
			if (this.currentPage > 1) {
				this.currentPage--;
				void this.refreshImages();
			}
		});

		// 页码信息
		pagination.createSpan({
			text: this.plugin.t('pageInfo')
				.replace('{current}', String(this.currentPage))
				.replace('{total}', String(totalPages)),
			cls: 'page-info'
		});

		// 下一页
		const nextBtn = pagination.createEl('button', { cls: 'page-button' });
		nextBtn.textContent = this.plugin.t('nextPage');
		nextBtn.disabled = this.currentPage >= totalPages;
		nextBtn.addEventListener('click', () => {
			if (this.currentPage < totalPages) {
				this.currentPage++;
				void this.refreshImages();
			}
		});

		// 跳转到页
		const jumpInput = pagination.createEl('input', {
			type: 'number',
			cls: 'page-jump-input',
			attr: {
				min: '1',
				max: String(totalPages),
				value: String(this.currentPage)
			}
		});
		jumpInput.addEventListener('change', (e) => {
			const target = e.target as HTMLInputElement;
			let page = parseInt(target.value, 10);
			if (isNaN(page)) page = this.currentPage;
			page = Math.max(1, Math.min(page, totalPages));
			this.currentPage = page;
			void this.refreshImages();
		});
	}

	/**
	 * 删除选中的文件
	 */
	deleteSelected() {
		if (this.selectedFiles.size === 0) {
			new Notice(this.plugin.t('confirmDeleteSelected').replace('{count}', '0'));
			return;
		}
		const filesToDelete = this.filteredImages.filter(img =>
			this.selectedFiles.has(img.file.path)
		);
		const deleteTargets: DeleteTarget[] = filesToDelete.map(img => ({
			file: img.file,
			path: img.path,
			name: img.name,
			size: img.size,
			modified: img.modified
		}));

		new DeleteConfirmModal(
			this.app,
			this.plugin,
			deleteTargets,
			async () => {
				const results = await Promise.all(
					filesToDelete.map(img => this.plugin.safeDeleteFile(img.file))
				);

				const successCount = results.filter(r => r).length;
				const failCount = results.filter(r => !r).length;

				if (successCount > 0) {
					new Notice(this.plugin.t('deletedFiles').replace('{count}', String(successCount)));
				}
				if (failCount > 0) {
					new Notice(this.plugin.t('deleteFilesFailed').replace('{count}', String(failCount)), 3000);
				}

				this.selectedFiles.clear();
				this.isSelectionMode = false;
				await this.refreshImages();
			}
		).open();
	}

	renderHeader() {
		const header = this.contentEl.createDiv({ cls: 'image-library-header' });
		const headerMain = header.createDiv({ cls: 'view-header-main' });
		const titleBlock = headerMain.createDiv({ cls: 'view-header-copy' });
		const kicker = titleBlock.createDiv({ cls: 'view-kicker-row' });
		kicker.createSpan({ cls: 'view-kicker', text: this.plugin.t('vaultMediaWorkspace') });
		kicker.createSpan({
			cls: 'view-inline-badge',
			text: this.plugin.settings.imageFolder || this.plugin.t('allVault')
		});

		titleBlock.createEl('h2', { text: this.plugin.t('mediaLibrary') });

		const stats = titleBlock.createDiv({ cls: 'image-stats' });
		stats.createSpan({ text: this.plugin.t('totalMediaFiles').replace('{count}', String(this.filteredImages.length)) });
		if (this.searchQuery) {
			stats.createSpan({
				cls: 'view-inline-badge',
				text: this.plugin.t('searchResults').replace('{count}', String(this.filteredImages.length))
			});
		}

		const controls = header.createDiv({ cls: 'view-header-controls' });
		const primaryActions = controls.createDiv({ cls: 'view-control-cluster' });

		// 刷新按钮
		const refreshBtn = primaryActions.createEl('button', { cls: 'refresh-button button-with-label' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.createSpan({ cls: 'button-label', text: this.plugin.t('refresh') });
		refreshBtn.addEventListener('click', () => {
			void this.refreshImages();
		});

		// 多选模式按钮
		const selectBtn = primaryActions.createEl('button', { cls: 'action-button button-with-label' });
		setIcon(selectBtn, 'check-square');
		selectBtn.createSpan({
			cls: 'button-label',
			text: this.isSelectionMode ? this.plugin.t('cancel') : this.plugin.t('multiSelectMode')
		});
		selectBtn.addEventListener('click', () => {
			this.isSelectionMode = !this.isSelectionMode;
			if (!this.isSelectionMode) {
				this.selectedFiles.clear();
			}
			void this.refreshImages();
		});
		selectBtn.title = this.plugin.t('multiSelectMode');

		// 排序选项
		const sortControls = controls.createDiv({ cls: 'view-control-cluster view-control-cluster-tight' });
		const sortSelect = sortControls.createEl('select', { cls: 'sort-select' });
		const options = [
			{ value: 'name', text: this.plugin.t('sortByName') },
			{ value: 'date', text: this.plugin.t('sortByDate') },
			{ value: 'size', text: this.plugin.t('sortBySize') }
		];
		options.forEach(opt => {
			const option = sortSelect.createEl('option', { value: opt.value, text: opt.text });
			if (this.plugin.settings.sortBy === opt.value) {
				option.setAttribute('selected', 'selected');
			}
		});
		sortSelect.addEventListener('change', (e) => {
			void (async () => {
				const target = e.target as HTMLSelectElement;
				this.plugin.settings.sortBy = target.value as 'name' | 'date' | 'size';
				await this.plugin.saveSettings();
				this.sortImages();
				this.currentPage = 1; // 排序变化后重置到第一页
				await this.refreshImages();
			})();
		});

		// 顺序切换
		const orderBtn = sortControls.createEl('button', { cls: 'order-button button-with-label' });
		orderBtn.addEventListener('click', () => {
			void (async () => {
				this.plugin.settings.sortOrder = this.plugin.settings.sortOrder === 'asc' ? 'desc' : 'asc';
				await this.plugin.saveSettings();
				this.sortImages();
				this.currentPage = 1; // 排序顺序变化后重置到第一页
				await this.refreshImages();
			})();
		});
		setIcon(orderBtn, this.plugin.settings.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down');
		orderBtn.createSpan({
			cls: 'button-label',
			text: this.plugin.settings.sortOrder === 'asc' ? this.plugin.t('sortAsc') : this.plugin.t('sortDesc')
		});
	}

	sortImages() {
		const { sortBy, sortOrder } = this.plugin.settings;
		const multiplier = sortOrder === 'asc' ? 1 : -1;

		this.images.sort((a, b) => {
			switch (sortBy) {
				case 'name':
					return multiplier * a.name.localeCompare(b.name);
				case 'date':
					return multiplier * (a.modified - b.modified);
				case 'size':
					return multiplier * (a.size - b.size);
				default:
					return 0;
			}
		});
	}

	private renderThumbnailFallback(container: HTMLElement, iconName: string, label: string) {
		container.empty();

		const fallback = container.createDiv({ cls: 'media-thumbnail-fallback' });

		const iconEl = fallback.createDiv();
		setIcon(iconEl, iconName);

		fallback.createDiv({
			cls: 'media-thumbnail-fallback-label',
			text: label
		});
	}

	private renderMediaThumbnail(container: HTMLElement, file: TFile, displayName: string) {
		const mediaType = getMediaType(file.name);
		const src = this.app.vault.getResourcePath(file);

		if (mediaType === 'image') {
			// 优先从 IndexedDB 缓存加载缩略图
			this.renderCachedThumbnail(container, file, src, displayName);
			return;
		}

		if (mediaType === 'video') {
			const video = container.createEl('video', { cls: 'media-thumbnail-video' });
			video.src = src;
			video.muted = true;
			video.preload = 'metadata';
			video.playsInline = true;
			video.addEventListener('error', () => {
				this.renderThumbnailFallback(container, 'video', 'VIDEO');
			});
			return;
		}

		if (mediaType === 'audio') {
			this.renderThumbnailFallback(container, 'music', 'AUDIO');
			return;
		}

		if (mediaType === 'document') {
			this.renderThumbnailFallback(container, 'file-text', getDocumentDisplayLabel(file.name));
			return;
		}

		this.renderThumbnailFallback(container, 'file', 'FILE');
	}

	/**
	 * 使用 IndexedDB 缓存的缩略图渲染图片
	 * 缓存命中时直接用 Blob URL，否则使用原始src并异步生成缓存
	 */
	private renderCachedThumbnail(container: HTMLElement, file: TFile, src: string, displayName: string) {
		const cache = this.plugin.thumbnailCache;
		const mtime = file.stat.mtime;

		// 创建 img 元素（先用占位）
		const img = container.createEl('img', {
			cls: 'media-thumbnail-image',
			attr: { alt: displayName }
		});
		img.addEventListener('load', () => {
			img.addClass('is-loaded');
		});

		img.addEventListener('error', () => {
			container.empty();
			container.createDiv({
				cls: 'image-error',
				text: this.plugin.t('imageLoadError')
			});
		});

		// SVG 不需要缓存缩略图——直接使用原始路径
		if (file.extension.toLowerCase() === 'svg') {
			img.src = src;
			return;
		}

		// 尝试从缓存获取
		void cache.get(file.path, mtime).then(cachedUrl => {
			if (cachedUrl) {
				img.src = cachedUrl;
			} else {
				// 缓存未命中：先显示原图
				img.src = src;

				// 异步生成缩略图并存入缓存
				void generateThumbnail(src, 300).then(({ blob, width, height }) => {
					return cache.put(file.path, mtime, blob, width, height);
				}).catch(() => {
					// 缩略图生成失败不影响显示
				});
			}
		});
	}

	renderImageItem(container: HTMLElement, image: ImageItem) {
		const isSelected = this.selectedFiles.has(image.file.path);
		const item = container.createDiv({ cls: `image-item${isSelected ? ' is-selected' : ''}` });
		item.title = image.path;

		// 如果在选择模式下，添加复选框
		if (this.isSelectionMode) {
			const checkbox = item.createEl('input', {
				type: 'checkbox',
				cls: 'item-checkbox'
			});
			checkbox.checked = this.selectedFiles.has(image.file.path);
			checkbox.addEventListener('change', (e) => {
				const target = e.target as HTMLInputElement;
				if (target.checked) {
					this.selectedFiles.add(image.file.path);
				} else {
					this.selectedFiles.delete(image.file.path);
				}
			});
		}

		// 创建图片容器
		const imgContainer = item.createDiv({ cls: 'image-container' });

		const file = image.file;
		this.renderMediaThumbnail(imgContainer, file, image.name);
		const chrome = imgContainer.createDiv({ cls: 'image-item-chrome' });
		chrome.createSpan({
			cls: 'image-item-media-badge',
			text: this.getMediaLabel(file)
		});
		const previewHint = imgContainer.createDiv({ cls: 'image-item-preview-hint' });
		const previewIcon = previewHint.createDiv({ cls: 'image-item-preview-icon' });
		setIcon(previewIcon, 'maximize-2');
		previewHint.createSpan({ text: this.plugin.t('preview') });

		imgContainer.addEventListener('click', () => {
			if (this.isSelectionMode) {
				// 在选择模式下，点击切换选择状态
				if (this.selectedFiles.has(image.file.path)) {
					this.selectedFiles.delete(image.file.path);
				} else {
					this.selectedFiles.add(image.file.path);
				}
				void this.refreshImages();
			} else {
				// 在普通模式下，打开预览
				this.plugin.openMediaPreview(image.file);
			}
		});

		// 右键菜单
		item.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showContextMenu(e as MouseEvent, file);
		});

		// 显示图片信息
		if (this.plugin.settings.showImageInfo) {
			const info = item.createDiv({ cls: 'image-info' });
			const infoTop = info.createDiv({ cls: 'image-info-top' });
			infoTop.createDiv({ cls: 'image-name', text: image.name });
			infoTop.createSpan({
				cls: 'item-type-badge',
				text: image.file.extension.toUpperCase()
			});

			const meta = info.createDiv({ cls: 'image-meta' });
			meta.createDiv({ cls: 'image-size', text: formatFileSize(image.size) });
			meta.createDiv({
				cls: 'image-date',
				text: new Date(image.modified).toLocaleDateString()
			});
			info.createDiv({ cls: 'image-path', text: image.path });
			const actions = info.createDiv({ cls: 'image-card-actions' });
			this.createImageActionButton(actions, 'search', this.plugin.t('findInNotes'), () => (
				this.plugin.openImageInNotes(image.file)
			));
			this.createImageActionButton(actions, 'copy', this.plugin.t('copyLink'), () => {
				this.copyToClipboard(this.plugin.getStableWikiLink(image.file), this.plugin.t('linkCopied'));
			});
			this.createImageActionButton(actions, 'external-link', this.plugin.t('openOriginal'), () => (
				this.plugin.openOriginalFile(image.file)
			));
		}
	}

	showContextMenu(event: MouseEvent, file: TFile) {
		const menu = new Menu();

		menu.addItem((item: MenuItem) => {
			item.setTitle(this.plugin.t('openInNotes'))
				.setIcon('search')
				.onClick(() => {
					void this.plugin.openImageInNotes(file);
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle(this.plugin.t('copyPath'))
				.setIcon('link')
				.onClick(() => {
					void navigator.clipboard.writeText(file.path).then(() => {
						new Notice(this.plugin.t('pathCopied'));
					}).catch((error) => {
						console.error('复制到剪贴板失败:', error);
						new Notice(this.plugin.t('error'));
					});
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle(this.plugin.t('copyLink'))
				.setIcon('copy')
				.onClick(() => {
					const link = this.plugin.getStableWikiLink(file);
					void navigator.clipboard.writeText(link).then(() => {
						new Notice(this.plugin.t('linkCopied'));
					}).catch((error) => {
						console.error('复制到剪贴板失败:', error);
						new Notice(this.plugin.t('error'));
					});
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle(this.plugin.t('openOriginal'))
				.setIcon('external-link')
				.onClick(() => {
					void this.plugin.openOriginalFile(file);
				});
		});

		// 仅图片显示处理选项
		if (getMediaType(file.name) === 'image') {
			menu.addSeparator();

			menu.addItem((item: MenuItem) => {
				item.setTitle(this.plugin.t('organizing'))
					.setIcon('folder-input')
					.onClick(() => {
						void this.organizeFile(file);
					});
			});

			if (this.isProcessableImage(file)) {
				menu.addItem((item: MenuItem) => {
					item.setTitle(this.plugin.t('processing'))
						.setIcon('image-down')
						.onClick(() => {
							void this.processFile(file);
						});
				});
			}
		}

		menu.showAtPosition({ x: event.clientX, y: event.clientY });
	}

	/**
	 * 按规则整理单个文件
	 */
	private async organizeFile(file: TFile) {
		const rules = this.plugin.settings.organizeRules;
		const rule = findMatchingRule(rules, file);
		if (!rule) {
			new Notice(this.plugin.t('noMatchingFiles'));
			return;
		}

		const ctx = await this.buildOrganizeContext(file);
		const target = computeTarget(rule, ctx);

		if (target.newPath === file.path) return;

		await this.plugin.ensureFolderExists(target.newPath.substring(0, target.newPath.lastIndexOf('/')));
		await this.app.fileManager.renameFile(file, target.newPath);
		new Notice(this.plugin.t('organizeComplete', { count: 1 }));
	}

	/**
	 * 批量整理选中文件
	 */
	private async organizeSelected() {
		if (this.selectedFiles.size === 0) return;

		const rules = this.plugin.settings.organizeRules;
		let organizedCount = 0;

		for (const path of this.selectedFiles) {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (!(file instanceof TFile)) continue;

			const rule = findMatchingRule(rules, file);
			if (!rule) continue;

			const ctx = await this.buildOrganizeContext(file);
			const target = computeTarget(rule, ctx);

			if (target.newPath === file.path) continue;

			try {
				await this.plugin.ensureFolderExists(target.newPath.substring(0, target.newPath.lastIndexOf('/')));
				await this.app.fileManager.renameFile(file, target.newPath);
				organizedCount++;
			} catch (error) {
				console.warn(`整理文件失败: ${file.name}`, error);
			}
		}

		new Notice(this.plugin.t('organizeComplete', { count: organizedCount }));
		this.selectedFiles.clear();
		this.isSelectionMode = false;
		await this.refreshImages();
	}

	/**
	 * 构建整理上下文（包含 EXIF 解析）
	 */
	private async buildOrganizeContext(file: TFile): Promise<OrganizeContext> {
		const date = new Date(file.stat.mtime);
		const ctx: OrganizeContext = { file, date };

		// 尝试解析 EXIF（仅 JPEG）
		const ext = file.extension.toLowerCase();
		if (ext === 'jpg' || ext === 'jpeg') {
			try {
				const buffer = await this.app.vault.readBinary(file);
				ctx.exif = parseExif(buffer);
			} catch { /* EXIF 解析失败不影响整理 */ }
		}

		return ctx;
	}

	private getProcessSettings() {
		const settings = this.plugin.settings;
		return {
			quality: settings.defaultProcessQuality,
			format: settings.defaultProcessFormat,
			watermark: settings.watermarkText ? {
				text: settings.watermarkText,
				position: 'bottom-right' as const,
				opacity: 0.5
			} : undefined
		};
	}

	private async processAndReplaceFile(file: TFile): Promise<{
		baseName: string;
		originalSize: number;
		newSize: number;
	}> {
		const src = this.app.vault.getResourcePath(file);
		const originalSize = file.stat.size;
		const result = await processImage(src, originalSize, this.getProcessSettings());
		const newExt = getFormatExtension(result.format);
		const baseName = file.name.replace(/\.[^.]+$/, '');
		const newPath = file.parent
			? `${file.parent.path}/${baseName}${newExt}`
			: `${baseName}${newExt}`;
		const arrayBuffer = await result.blob.arrayBuffer();

		if (newPath === file.path) {
			await this.app.vault.modifyBinary(file, arrayBuffer);
			return {
				baseName,
				originalSize,
				newSize: result.newSize
			};
		}

		const existing = this.app.vault.getAbstractFileByPath(newPath);
		if (existing && existing.path !== file.path) {
			throw new Error(this.plugin.t('targetFileExists'));
		}

		const originalBuffer = await this.app.vault.readBinary(file);

		// 先写入转换后的内容，避免 rename 期间出现扩展名和实际字节格式不一致。
		await this.app.vault.modifyBinary(file, arrayBuffer);

		try {
			await this.app.fileManager.renameFile(file, newPath);
		} catch (error) {
			try {
				await this.app.vault.modifyBinary(file, originalBuffer);
			} catch (rollbackError) {
				console.error(`回滚处理后的文件失败: ${file.name}`, rollbackError);
			}
			throw error;
		}

		return {
			baseName,
			originalSize,
			newSize: result.newSize
		};
	}

	/**
	 * Canvas 处理单个文件
	 */
	private async processFile(file: TFile) {
		if (!this.isProcessableImage(file)) {
			new Notice(this.plugin.t('unsupportedFileType'));
			return;
		}

		try {
			const { baseName, originalSize, newSize } = await this.processAndReplaceFile(file);
			const saved = Math.max(0, originalSize - newSize);
			new Notice(`✅ ${baseName}: ${formatFileSize(originalSize)} → ${formatFileSize(newSize)} (节省 ${formatFileSize(saved)})`);
		} catch (error) {
			console.error(`处理失败: ${file.name}`, error);
			new Notice(this.plugin.t('error') + `: ${file.name}`);
		}
	}

	/**
	 * 批量 Canvas 处理选中文件
	 */
	private async processSelected() {
		if (this.selectedFiles.size === 0) return;

		let processed = 0;
		let skipped = 0;
		let totalSaved = 0;

		for (const path of this.selectedFiles) {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (!(file instanceof TFile)) continue;
			if (!this.isProcessableImage(file)) {
				skipped++;
				continue;
			}

			try {
				const { originalSize, newSize } = await this.processAndReplaceFile(file);
				processed++;
				totalSaved += Math.max(0, originalSize - newSize);
			} catch (error) {
				console.warn(`处理失败: ${path}`, error);
			}
		}

		const suffix = skipped > 0 ? `，跳过 ${skipped} 个不支持的文件` : '';
		new Notice(`✅ 处理完成: ${processed} 个文件，节省 ${formatFileSize(totalSaved)}${suffix}`);
		this.selectedFiles.clear();
		this.isSelectionMode = false;
		await this.refreshImages();
	}

	// 已移除 formatFileSize 方法，使用 utils/format.ts 中的实现
}

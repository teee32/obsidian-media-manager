import { TFile, View, WorkspaceLeaf, setIcon, Menu, MenuItem, Notice } from 'obsidian';
import ImageManagerPlugin from '../main';

export const VIEW_TYPE_IMAGE_LIBRARY = 'image-library-view';

interface ImageItem {
	file: TFile;
	path: string;
	name: string;
	size: number;
	modified: number;
	dimensions?: { width: number; height: number };
}

export class ImageLibraryView extends View {
	plugin: ImageManagerPlugin;
	images: ImageItem[] = [];
	filteredImages: ImageItem[] = [];
	private contentEl!: HTMLElement;
	private searchQuery: string = '';
	private currentPage: number = 1;
	private pageSize: number = 50;
	private selectedFiles: Set<string> = new Set();
	private isSelectionMode: boolean = false;

	constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_IMAGE_LIBRARY;
	}

	getDisplayText() {
		return '媒体库';
	}

	async onOpen() {
		this.contentEl = this.containerEl.children[1] as HTMLElement;
		this.contentEl.addClass('image-library-view');
		await this.refreshImages();
	}

	async onClose() {
		// 清理工作
	}

	async refreshImages() {
		const sizeMap: Record<string, 'small' | 'medium' | 'large'> = {
			'small': 'small',
			'medium': 'medium',
			'large': 'large'
		};

		const size = sizeMap[this.plugin.settings.thumbnailSize] || 'medium';
		this.contentEl.empty();

		// 先获取所有图片数据
		const imageFiles = await this.plugin.getAllImageFiles();

		// 过滤图片文件夹（如果设置了）
		const filteredImages = this.plugin.settings.imageFolder
			? imageFiles.filter(f => f.path.startsWith(this.plugin.settings.imageFolder))
			: imageFiles;

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

		// 创建头部（在获取数据之后渲染）
		this.renderHeader();

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
				text: this.searchQuery ? '没有匹配的文件' : '未找到媒体文件'
			});
		}
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
		this.currentPage = 1;  // 重置到第一页
	}

	/**
	 * 渲染搜索框
	 */
	renderSearchBox() {
		const searchContainer = this.contentEl.createDiv({ cls: 'search-container' });

		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			cls: 'search-input',
			attr: {
				placeholder: '搜索文件名...',
				value: this.searchQuery
			}
		});

		// 搜索图标
		const searchIcon = searchContainer.createDiv({ cls: 'search-icon' });
		setIcon(searchIcon, 'search');

		// 清除搜索按钮
		if (this.searchQuery) {
			const clearBtn = searchContainer.createEl('button', { cls: 'clear-search' });
			setIcon(clearBtn, 'x');
			clearBtn.addEventListener('click', () => {
				this.searchQuery = '';
				this.applySearch();
				this.refreshImages();
			});
		}

		searchInput.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			this.searchQuery = target.value;
			this.applySearch();
			this.refreshImages();
		});

		// 显示结果计数
		if (this.searchQuery) {
			searchContainer.createSpan({
				text: `找到 ${this.filteredImages.length} 个结果`,
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
			text: `已选择 ${this.selectedFiles.size} 个文件`,
			cls: 'selection-count'
		});

		const selectAllBtn = toolbar.createEl('button', { cls: 'toolbar-button' });
		setIcon(selectAllBtn, 'check-square');
		selectAllBtn.addEventListener('click', () => {
			this.filteredImages.forEach(img => this.selectedFiles.add(img.file.path));
			this.refreshImages();
		});

		const deselectAllBtn = toolbar.createEl('button', { cls: 'toolbar-button' });
		setIcon(deselectAllBtn, 'square');
		deselectAllBtn.addEventListener('click', () => {
			this.selectedFiles.clear();
			this.refreshImages();
		});

		const deleteSelectedBtn = toolbar.createEl('button', { cls: 'toolbar-button danger' });
		setIcon(deleteSelectedBtn, 'trash-2');
		deleteSelectedBtn.addEventListener('click', () => this.deleteSelected());

		const exitSelectionBtn = toolbar.createEl('button', { cls: 'toolbar-button' });
		setIcon(exitSelectionBtn, 'x');
		exitSelectionBtn.addEventListener('click', () => {
			this.isSelectionMode = false;
			this.selectedFiles.clear();
			this.refreshImages();
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
		prevBtn.textContent = '上一页';
		prevBtn.disabled = this.currentPage <= 1;
		prevBtn.addEventListener('click', () => {
			if (this.currentPage > 1) {
				this.currentPage--;
				this.refreshImages();
			}
		});

		// 页码信息
		pagination.createSpan({
			text: `第 ${this.currentPage} / ${totalPages} 页`,
			cls: 'page-info'
		});

		// 下一页
		const nextBtn = pagination.createEl('button', { cls: 'page-button' });
		nextBtn.textContent = '下一页';
		nextBtn.disabled = this.currentPage >= totalPages;
		nextBtn.addEventListener('click', () => {
			if (this.currentPage < totalPages) {
				this.currentPage++;
				this.refreshImages();
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
			page = Math.max(1, Math.min(page, totalPages));
			this.currentPage = page;
			this.refreshImages();
		});
	}

	/**
	 * 删除选中的文件
	 */
	async deleteSelected() {
		if (this.selectedFiles.size === 0) {
			new Notice('请先选择要删除的文件');
			return;
		}

		const confirmed = confirm(
			`确定要删除选中的 ${this.selectedFiles.size} 个文件吗？`
		);

		if (confirmed) {
			const filesToDelete = this.filteredImages.filter(img =>
				this.selectedFiles.has(img.file.path)
			);

			// 使用 Promise.all 并发处理删除
			const results = await Promise.all(
				filesToDelete.map(img => this.plugin.safeDeleteFile(img.file))
			);

			// 统计成功和失败的数量
			const successCount = results.filter(r => r).length;
			const failCount = results.filter(r => !r).length;

			if (successCount > 0) {
				new Notice(`已删除 ${successCount} 个文件`);
			}
			if (failCount > 0) {
				new Notice(`删除 ${failCount} 个文件失败`, 3000);
			}

			this.selectedFiles.clear();
			this.isSelectionMode = false;
			await this.refreshImages();
		}
	}

	renderHeader() {
		const header = this.contentEl.createDiv({ cls: 'image-library-header' });

		header.createEl('h2', { text: '媒体库' });

		const stats = header.createDiv({ cls: 'image-stats' });
		stats.createSpan({ text: `共 ${this.filteredImages.length} 个媒体文件` });

		// 刷新按钮
		const refreshBtn = header.createEl('button', { cls: 'refresh-button' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.addEventListener('click', () => this.refreshImages());

		// 多选模式按钮
		const selectBtn = header.createEl('button', { cls: 'refresh-button' });
		setIcon(selectBtn, 'check-square');
		selectBtn.addEventListener('click', () => {
			this.isSelectionMode = !this.isSelectionMode;
			if (!this.isSelectionMode) {
				this.selectedFiles.clear();
			}
			this.refreshImages();
		});
		selectBtn.title = '多选模式';

		// 排序选项
		const sortSelect = header.createEl('select', { cls: 'sort-select' });
		const options = [
			{ value: 'name', text: '名称' },
			{ value: 'date', text: '日期' },
			{ value: 'size', text: '大小' }
		];
		options.forEach(opt => {
			const option = sortSelect.createEl('option', { value: opt.value, text: opt.text });
			if (this.plugin.settings.sortBy === opt.value) {
				option.setAttribute('selected', 'selected');
			}
		});
		sortSelect.addEventListener('change', async (e) => {
			const target = e.target as HTMLSelectElement;
			this.plugin.settings.sortBy = target.value as 'name' | 'date' | 'size';
			await this.plugin.saveSettings();
			this.sortImages();
			this.refreshImages();
		});

		// 顺序切换
		const orderBtn = header.createEl('button', { cls: 'order-button' });
		orderBtn.addEventListener('click', async () => {
			this.plugin.settings.sortOrder = this.plugin.settings.sortOrder === 'asc' ? 'desc' : 'asc';
			await this.plugin.saveSettings();
			this.sortImages();
			this.refreshImages();
		});
		setIcon(orderBtn, this.plugin.settings.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down');
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

	renderImageItem(container: HTMLElement, image: ImageItem) {
		const item = container.createDiv({ cls: 'image-item' });

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

		// 获取文件链接
		const file = image.file;
		const src = this.app.vault.getResourcePath(file);

		// 创建图片元素
		const img = imgContainer.createEl('img', {
			attr: {
				src: src,
				alt: image.name
			}
		});

		img.addEventListener('click', () => {
			if (this.isSelectionMode) {
				// 在选择模式下，点击切换选择状态
				if (this.selectedFiles.has(image.file.path)) {
					this.selectedFiles.delete(image.file.path);
				} else {
					this.selectedFiles.add(image.file.path);
				}
				this.refreshImages();
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
			info.createDiv({ cls: 'image-name', text: image.name });
			info.createDiv({ cls: 'image-size', text: this.formatFileSize(image.size) });
		}
	}

	showContextMenu(event: MouseEvent, file: TFile) {
		const menu = new Menu();

		menu.addItem((item: MenuItem) => {
			item.setTitle('在笔记中查找')
				.setIcon('search')
				.onClick(() => {
					this.plugin.openImageInNotes(file);
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle('复制文件路径')
				.setIcon('link')
				.onClick(() => {
					navigator.clipboard.writeText(file.path);
					new Notice('文件路径已复制');
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle('复制Markdown链接')
				.setIcon('copy')
				.onClick(() => {
					const link = `[[${file.name}]]`;
					navigator.clipboard.writeText(link);
					new Notice('Markdown链接已复制');
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle('打开原始文件')
				.setIcon('external-link')
				.onClick(() => {
					const src = this.app.vault.getResourcePath(file);
					window.open(src, '_blank');
				});
		});

		menu.showAtPosition({ x: event.clientX, y: event.clientY });
	}

	formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
}

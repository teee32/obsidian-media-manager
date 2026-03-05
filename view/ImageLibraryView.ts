import { TFile, View, WorkspaceLeaf, setIcon, Menu, Notice } from 'obsidian';
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
	private contentEl: HTMLElement;

	constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_IMAGE_LIBRARY;
	}

	getDisplayText() {
		return '图片库';
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

		// 创建头部
		this.renderHeader();

		// 创建图片网格容器
		const grid = this.contentEl.createDiv({ cls: 'image-grid' });
		grid.addClass(`image-grid-${size}`);

		// 获取所有图片
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

		// 渲染图片
		for (const image of this.images) {
			this.renderImageItem(grid, image);
		}

		if (this.images.length === 0) {
			this.contentEl.createDiv({
				cls: 'empty-state',
				text: '未找到图片文件'
			});
		}
	}

	renderHeader() {
		const header = this.contentEl.createDiv({ cls: 'image-library-header' });

		header.createEl('h2', { text: '图片库' });

		const stats = header.createDiv({ cls: 'image-stats' });
		stats.createSpan({ text: `共 ${this.images.length} 张图片` });

		// 刷新按钮
		const refreshBtn = header.createEl('button', { cls: 'refresh-button' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.addEventListener('click', () => this.refreshImages());

		// 排序选项
		const sortSelect = header.createEl('select', { cls: 'sort-select' });
		sortSelect.createEl('option', { value: 'name', text: '名称', selected: this.plugin.settings.sortBy === 'name' });
		sortSelect.createEl('option', { value: 'date', text: '日期', selected: this.plugin.settings.sortBy === 'date' });
		sortSelect.createEl('option', { value: 'size', text: '大小', selected: this.plugin.settings.sortBy === 'size' });
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
			this.plugin.openImageInNotes(file);
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

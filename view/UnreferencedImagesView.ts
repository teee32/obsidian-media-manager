import { TFile, View, WorkspaceLeaf, setIcon, Menu, MenuItem, Notice } from 'obsidian';
import ImageManagerPlugin from '../main';

export const VIEW_TYPE_UNREFERENCED_IMAGES = 'unreferenced-images-view';

interface UnreferencedImage {
	file: TFile;
	path: string;
	name: string;
	size: number;
	modified: number;
}

export class UnreferencedImagesView extends View {
	plugin: ImageManagerPlugin;
	unreferencedImages: UnreferencedImage[] = [];
	private contentEl: HTMLElement;
	private isScanning: boolean = false;

	constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_UNREFERENCED_IMAGES;
	}

	getDisplayText() {
		return '未引用图片';
	}

	async onOpen() {
		this.contentEl = this.containerEl.children[1] as HTMLElement;
		this.contentEl.addClass('unreferenced-images-view');

		if (!this.isScanning) {
			await this.scanUnreferencedImages();
		}
	}

	async onClose() {
		// 清理工作
	}

	async scanUnreferencedImages() {
		this.isScanning = true;
		this.contentEl.empty();

		// 显示扫描中状态
		const loading = this.contentEl.createDiv({ cls: 'loading-state' });
		loading.createEl('div', { cls: 'spinner' });
		loading.createDiv({ text: '正在扫描未引用的图片...' });

		try {
			// 查找未引用的图片
			const files = await this.plugin.findUnreferenced();

			this.unreferencedImages = files.map(file => ({
				file,
				path: file.path,
				name: file.name,
				size: file.stat.size,
				modified: file.stat.mtime
			}));

			// 按大小排序
			this.unreferencedImages.sort((a, b) => b.size - a.size);

			// 渲染视图
			await this.renderView();
		} catch (error) {
			console.error('扫描图片时出错:', error);
			this.contentEl.createDiv({
				cls: 'error-state',
				text: '扫描图片时出错'
			});
		}

		this.isScanning = false;
	}

	async renderView() {
		this.contentEl.empty();

		// 创建头部
		this.renderHeader();

		if (this.unreferencedImages.length === 0) {
			this.contentEl.createDiv({
				cls: 'success-state',
				text: '太棒了！所有图片都已被引用'
			});
			return;
		}

		// 创建统计信息
		const stats = this.contentEl.createDiv({ cls: 'stats-bar' });
		stats.createSpan({
			text: `找到 ${this.unreferencedImages.length} 张未引用的图片`,
			cls: 'stats-count'
		});

		const totalSize = this.unreferencedImages.reduce((sum, img) => sum + img.size, 0);
		stats.createSpan({
			text: `总计 ${this.formatFileSize(totalSize)}`,
			cls: 'stats-size'
		});

		// 创建图片列表
		const list = this.contentEl.createDiv({ cls: 'unreferenced-list' });

		for (const image of this.unreferencedImages) {
			this.renderImageItem(list, image);
		}
	}

	renderHeader() {
		const header = this.contentEl.createDiv({ cls: 'unreferenced-header' });

		header.createEl('h2', { text: '未引用图片' });

		const desc = header.createDiv({ cls: 'header-description' });
		desc.createSpan({ text: '以下图片未被任何笔记引用，可能可以删除以释放空间' });

		// 重新扫描按钮
		const refreshBtn = header.createEl('button', { cls: 'refresh-button' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.addEventListener('click', () => this.scanUnreferencedImages());

		// 批量操作按钮
		const actions = header.createDiv({ cls: 'header-actions' });

		const copyAllBtn = actions.createEl('button', { cls: 'action-button' });
		setIcon(copyAllBtn, 'copy');
		copyAllBtn.addEventListener('click', () => this.copyAllPaths());

		const deleteAllBtn = actions.createEl('button', { cls: 'action-button danger' });
		setIcon(deleteAllBtn, 'trash-2');
		deleteAllBtn.addEventListener('click', () => this.confirmDeleteAll());
	}

	renderImageItem(container: HTMLElement, image: UnreferencedImage) {
		const item = container.createDiv({ cls: 'unreferenced-item' });

		// 图片缩略图
		const thumbnail = item.createDiv({ cls: 'item-thumbnail' });
		const src = this.app.vault.getResourcePath(image.file);
		thumbnail.createEl('img', {
			attr: {
				src: src,
				alt: image.name
			}
		});

		// 图片信息
		const info = item.createDiv({ cls: 'item-info' });
		info.createDiv({ cls: 'item-name', text: image.name });
		info.createDiv({ cls: 'item-path', text: image.path });
		info.createDiv({ cls: 'item-size', text: this.formatFileSize(image.size) });

		// 操作按钮
		const actions = item.createDiv({ cls: 'item-actions' });

		// 在笔记中查找按钮
		const findBtn = actions.createEl('button', { cls: 'item-button' });
		setIcon(findBtn, 'search');
		findBtn.addEventListener('click', () => {
			this.plugin.openImageInNotes(image.file);
		});

		// 复制路径按钮
		const copyBtn = actions.createEl('button', { cls: 'item-button' });
		setIcon(copyBtn, 'link');
		copyBtn.addEventListener('click', () => {
			navigator.clipboard.writeText(image.path);
			new Notice('文件路径已复制');
		});

		// 删除按钮
		const deleteBtn = actions.createEl('button', { cls: 'item-button danger' });
		setIcon(deleteBtn, 'trash-2');
		deleteBtn.addEventListener('click', () => {
			this.confirmDelete(image);
		});

		// 右键菜单
		item.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showContextMenu(e as MouseEvent, image.file);
		});
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

		menu.addSeparator();

		menu.addItem((item: MenuItem) => {
			item.setTitle('删除图片')
				.setIcon('trash-2')
				.onClick(() => {
					this.confirmDelete({ file } as UnreferencedImage);
				});
		});

		menu.showAtPosition({ x: event.clientX, y: event.clientY });
	}

	async confirmDelete(image: UnreferencedImage) {
		const confirmed = confirm(`确定要删除 "${image.name}" 吗？此操作不可撤销。`);

		if (confirmed) {
			try {
				await this.app.vault.delete(image.file);
				new Notice(`已删除 ${image.name}`);

				// 从列表中移除
				this.unreferencedImages = this.unreferencedImages.filter(
					img => img.file.path !== image.file.path
				);

				// 重新渲染
				await this.renderView();
			} catch (error) {
				console.error('删除文件时出错:', error);
				new Notice('删除文件时出错');
			}
		}
	}

	async confirmDeleteAll() {
		if (this.unreferencedImages.length === 0) {
			new Notice('没有需要删除的图片');
			return;
		}

		const confirmed = confirm(
			`确定要删除所有 ${this.unreferencedImages.length} 张未引用的图片吗？此操作不可撤销。`
		);

		if (confirmed) {
			const deleted: string[] = [];
			const errors: string[] = [];

			for (const image of this.unreferencedImages) {
				try {
					await this.app.vault.delete(image.file);
					deleted.push(image.name);
				} catch (error) {
					errors.push(image.name);
				}
			}

			if (deleted.length > 0) {
				new Notice(`已删除 ${deleted.length} 张图片`);
			}
			if (errors.length > 0) {
				new Notice(`删除 ${errors.length} 张图片时出错`);
			}

			// 重新扫描
			await this.scanUnreferencedImages();
		}
	}

	copyAllPaths() {
		const paths = this.unreferencedImages.map(img => img.path).join('\n');
		navigator.clipboard.writeText(paths);
		new Notice(`已复制 ${this.unreferencedImages.length} 个文件路径`);
	}

	formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
}

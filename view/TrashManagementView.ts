import { TFile, View, WorkspaceLeaf, setIcon, Menu, MenuItem, Notice } from 'obsidian';
import ImageManagerPlugin from '../main';

export const VIEW_TYPE_TRASH_MANAGEMENT = 'trash-management-view';

interface TrashItem {
	file: TFile;
	path: string;
	name: string;
	size: number;
	modified: number;
	originalPath?: string;  // 从隔离文件夹名字中提取的原始路径
}

export class TrashManagementView extends View {
	plugin: ImageManagerPlugin;
	trashItems: TrashItem[] = [];
	private contentEl!: HTMLElement;
	private isLoading: boolean = false;

	constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_TRASH_MANAGEMENT;
	}

	getDisplayText() {
		return '隔离文件管理';
	}

	async onOpen() {
		this.contentEl = this.containerEl.children[1] as HTMLElement;
		this.contentEl.addClass('trash-management-view');
		await this.loadTrashItems();
	}

	async onClose() {
		// 清理工作
	}

	/**
	 * 加载隔离文件夹中的文件
	 */
	async loadTrashItems() {
		if (this.isLoading) return;
		this.isLoading = true;
		this.contentEl.empty();

		// 显示加载状态
		const loading = this.contentEl.createDiv({ cls: 'loading-state' });
		loading.createEl('div', { cls: 'spinner' });
		loading.createDiv({ text: '正在加载隔离文件...' });

		try {
			const trashPath = this.plugin.settings.trashFolder;
			const trashFolder = this.plugin.app.vault.getAbstractFileByPath(trashPath);

			if (!trashFolder || !trashFolder.children) {
				this.trashItems = [];
				await this.renderView();
				return;
			}

			// 获取隔离文件夹中的所有文件
			this.trashItems = [];
			for (const file of trashFolder.children) {
				if (file instanceof TFile) {
					// 从文件名中提取原始路径（格式：timestamp_originalPath）
					let originalPath: string | undefined;
					const nameParts = file.name.split('_');
					if (nameParts.length > 1) {
						// 去掉时间戳部分，剩余的就是原始路径
						originalPath = nameParts.slice(1).join('_');
					}

					this.trashItems.push({
						file,
						path: file.path,
						name: file.name,
						size: file.stat.size,
						modified: file.stat.mtime,
						originalPath
					});
				}
			}

			// 按修改时间排序（最新的在前）
			this.trashItems.sort((a, b) => b.modified - a.modified);

			await this.renderView();
		} catch (error) {
			console.error('加载隔离文件失败:', error);
			this.contentEl.createDiv({
				cls: 'error-state',
				text: '加载隔离文件失败'
			});
		}

		this.isLoading = false;
	}

	/**
	 * 渲染视图
	 */
	async renderView() {
		this.contentEl.empty();

		// 创建头部
		this.renderHeader();

		if (this.trashItems.length === 0) {
			this.contentEl.createDiv({
				cls: 'empty-state',
				text: '隔离文件夹为空'
			});
			return;
		}

		// 创建统计信息
		const stats = this.contentEl.createDiv({ cls: 'stats-bar' });
		stats.createSpan({
			text: `隔离文件夹中有 ${this.trashItems.length} 个文件`,
			cls: 'stats-count'
		});

		const totalSize = this.trashItems.reduce((sum, item) => sum + item.size, 0);
		stats.createSpan({
			text: `总计 ${this.formatFileSize(totalSize)}`,
			cls: 'stats-size'
		});

		// 创建文件列表
		const list = this.contentEl.createDiv({ cls: 'trash-list' });

		for (const item of this.trashItems) {
			this.renderTrashItem(list, item);
		}
	}

	/**
	 * 渲染头部
	 */
	renderHeader() {
		const header = this.contentEl.createDiv({ cls: 'trash-header' });

		header.createEl('h2', { text: '隔离文件管理' });

		const desc = header.createDiv({ cls: 'header-description' });
		desc.createSpan({ text: '已删除的文件会临时存放在这里，您可以恢复或彻底删除它们' });

		// 刷新按钮
		const refreshBtn = header.createEl('button', { cls: 'refresh-button' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.addEventListener('click', () => this.loadTrashItems());

		// 操作按钮
		const actions = header.createDiv({ cls: 'header-actions' });

		// 清空隔离文件夹按钮
		const clearAllBtn = actions.createEl('button', { cls: 'action-button danger' });
		setIcon(clearAllBtn, 'trash-2');
		clearAllBtn.addEventListener('click', () => this.confirmClearAll());
		clearAllBtn.title = '清空隔离文件夹';
	}

	/**
	 * 渲染单个隔离文件项
	 */
	renderTrashItem(container: HTMLElement, item: TrashItem) {
		const itemEl = container.createDiv({ cls: 'trash-item' });

		// 文件图标
		const icon = itemEl.createDiv({ cls: 'item-icon' });
		const ext = item.name.split('.').pop()?.toLowerCase() || '';
		setIcon(icon, this.getFileIcon(ext));

		// 文件信息
		const info = itemEl.createDiv({ cls: 'item-info' });
		info.createDiv({ cls: 'item-name', text: item.name });
		if (item.originalPath) {
			info.createDiv({ cls: 'item-original-path', text: `原始位置: ${item.originalPath}` });
		}
		info.createDiv({ cls: 'item-size', text: this.formatFileSize(item.size) });
		info.createDiv({ cls: 'item-date', text: `删除时间: ${new Date(item.modified).toLocaleString()}` });

		// 操作按钮
		const actions = itemEl.createDiv({ cls: 'item-actions' });

		// 恢复按钮
		const restoreBtn = actions.createEl('button', { cls: 'item-button success' });
		setIcon(restoreBtn, 'rotate-ccw');
		restoreBtn.addEventListener('click', () => this.restoreFile(item));
		restoreBtn.title = '恢复文件';

		// 彻底删除按钮
		const deleteBtn = actions.createEl('button', { cls: 'item-button danger' });
		setIcon(deleteBtn, 'trash-2');
		deleteBtn.addEventListener('click', () => this.confirmDelete(item));
		deleteBtn.title = '彻底删除';

		// 右键菜单
		itemEl.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showContextMenu(e as MouseEvent, item);
		});
	}

	/**
	 * 显示右键菜单
	 */
	showContextMenu(event: MouseEvent, item: TrashItem) {
		const menu = new Menu();

		menu.addItem((item: MenuItem) => {
			item.setTitle('恢复文件')
				.setIcon('rotate-ccw')
				.onClick(() => this.restoreFile(item));
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle('彻底删除')
				.setIcon('trash-2')
				.onClick(() => this.confirmDelete(item));
		});

		menu.addSeparator();

		menu.addItem((item: MenuItem) => {
			item.setTitle('复制文件名')
				.setIcon('copy')
				.onClick(() => {
					navigator.clipboard.writeText(item.name);
					new Notice('文件名已复制');
				});
		});

		menu.addItem((item: MenuItem) => {
			item.setTitle('复制原始路径')
				.setIcon('link')
				.onClick(() => {
					if (item.originalPath) {
						navigator.clipboard.writeText(item.originalPath);
						new Notice('原始路径已复制');
					}
				});
		});

		menu.showAtPosition({ x: event.clientX, y: event.clientY });
	}

	/**
	 * 恢复文件
	 */
	async restoreFile(item: TrashItem) {
		try {
			const targetPath = item.originalPath || item.name;
			await this.plugin.app.vault.rename(item.file, targetPath);
			new Notice(`已恢复: ${item.name}`);

			// 从列表中移除
			this.trashItems = this.trashItems.filter(i => i.file.path !== item.file.path);
			await this.renderView();
		} catch (error) {
			console.error('恢复文件失败:', error);
			new Notice('恢复失败: ' + (error as Error).message);
		}
	}

	/**
	 * 确认删除单个文件
	 */
	async confirmDelete(item: TrashItem) {
		const confirmed = confirm(`确定要彻底删除 "${item.name}" 吗？此操作不可撤销。`);

		if (confirmed) {
			try {
				await this.plugin.app.vault.delete(item.file);
				new Notice(`已彻底删除: ${item.name}`);

				// 从列表中移除
				this.trashItems = this.trashItems.filter(i => i.file.path !== item.file.path);
				await this.renderView();
			} catch (error) {
				console.error('删除文件失败:', error);
				new Notice('删除失败');
			}
		}
	}

	/**
	 * 确认清空所有文件
	 */
	async confirmClearAll() {
		if (this.trashItems.length === 0) {
			new Notice('隔离文件夹为空');
			return;
		}

		const confirmed = confirm(
			`确定要清空隔离文件夹吗？${this.trashItems.length} 个文件将被彻底删除，此操作不可撤销。`
		);

		if (confirmed) {
			const deleted: string[] = [];
			const errors: string[] = [];

			for (const item of this.trashItems) {
				try {
					await this.plugin.app.vault.delete(item.file);
					deleted.push(item.name);
				} catch (error) {
					errors.push(item.name);
				}
			}

			if (deleted.length > 0) {
				new Notice(`已彻底删除 ${deleted.length} 个文件`);
			}
			if (errors.length > 0) {
				new Notice(`删除 ${errors.length} 个文件时出错`);
			}

			await this.loadTrashItems();
		}
	}

	/**
	 * 获取文件图标
	 */
	private getFileIcon(ext: string): string {
		const iconMap: Record<string, string> = {
			// 图片
			'png': 'image',
			'jpg': 'image',
			'jpeg': 'image',
			'gif': 'image',
			'webp': 'image',
			'svg': 'image',
			'bmp': 'image',
			// 视频
			'mp4': 'video',
			'mov': 'video',
			'avi': 'video',
			'mkv': 'video',
			'webm': 'video',
			// 音频
			'mp3': 'music',
			'wav': 'music',
			'ogg': 'music',
			'm4a': 'music',
			'flac': 'music',
			// 文档
			'pdf': 'file-text',
			'doc': 'file-text',
			'docx': 'file-text',
			'txt': 'file-text',
			// 默认
			'file': 'file'
		};

		return iconMap[ext] || 'file';
	}

	/**
	 * 格式化文件大小
	 */
	formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
}

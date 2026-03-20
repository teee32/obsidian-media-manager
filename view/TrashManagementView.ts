import { TFile, TFolder, ItemView, WorkspaceLeaf, setIcon, Menu, MenuItem, Notice, Modal, ButtonComponent } from 'obsidian';
import ImageManagerPlugin from '../main';
import { formatFileSize } from '../utils/format';
import { getDocumentDisplayLabel, getMediaType } from '../utils/mediaTypes';
import { isPathSafe } from '../utils/security';
import { getFileNameFromPath, normalizeVaultPath, safeDecodeURIComponent } from '../utils/path';

export const VIEW_TYPE_TRASH_MANAGEMENT = 'trash-management-view';

interface TrashItem {
	file: TFile;
	path: string;
	rawName: string;
	name: string;
	size: number;
	modified: number;
	originalPath?: string;
	referenceCount: number;
	selected: boolean;
}

interface DashboardStats {
	totalFiles: number;
	totalSize: number;
	byType: Record<string, number>;
	unreferencedRate: number;
}

export class TrashManagementView extends ItemView {
	plugin: ImageManagerPlugin;
	trashItems: TrashItem[] = [];
	private isLoading: boolean = false;

	constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_TRASH_MANAGEMENT;
	}

	getDisplayText() {
		return this.plugin.t('trashManagement');
	}

	async onOpen() {
		let retries = 0;
		while (!this.contentEl && retries < 10) {
			await new Promise(resolve => setTimeout(resolve, 50));
			retries++;
		}
		if (!this.contentEl) {
			console.error('TrashManagementView: contentEl not ready');
			return;
		}
		this.contentEl.addClass('trash-management-view');
		this.loadTrashItems();
	}

	onClose(): Promise<void> {
		// 清理工作
		return Promise.resolve();
	}

	/**
	 * 加载隔离文件夹中的文件
	 */
	loadTrashItems(): void {
		if (!this.contentEl) return;
		if (this.isLoading) return;
		this.isLoading = true;
		this.contentEl.empty();

		const loading = this.contentEl.createDiv({ cls: 'loading-state' });
		loading.createEl('div', { cls: 'spinner' });
		loading.createDiv({ text: this.plugin.t('loadingTrashFiles') });

		try {
			const trashPath = normalizeVaultPath(this.plugin.settings.trashFolder);
			if (!trashPath || !isPathSafe(trashPath)) {
				this.trashItems = [];
				this.renderView();
				return;
			}

			const trashFolder = this.plugin.app.vault.getAbstractFileByPath(trashPath);
			if (!trashFolder || !(trashFolder instanceof TFolder)) {
				this.trashItems = [];
				this.renderView();
				return;
			}

			const refCountMap = this.buildRefCountMap();

			this.trashItems = [];
			for (const file of trashFolder.children) {
				if (file instanceof TFile) {
					const originalPath = this.extractOriginalPath(file.name);
					const displayName = originalPath ? getFileNameFromPath(originalPath) || file.name : file.name;

					// 从预建 Map 中查找引用次数 O(1)
					const refCount = originalPath
						? this.lookupRefCount(originalPath, refCountMap)
						: 0;

					this.trashItems.push({
						file,
						path: file.path,
						rawName: file.name,
						name: displayName,
						size: file.stat.size,
						modified: file.stat.mtime,
						originalPath,
						referenceCount: refCount,
						selected: false
					});
				}
			}

			this.trashItems.sort((a, b) => b.modified - a.modified);
			this.renderView();
		} catch (error) {
			console.error('加载隔离文件失败:', error);
			this.contentEl.createDiv({
				cls: 'error-state',
				text: this.plugin.t('error')
			});
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * 一次性遍历所有笔记，构建引用计数 Map
	 * key = 归一化文件名 (lowercase), value = 被引用次数
	 * O(笔记数 × 平均 embed 数)，只执行一次
	 */
	private buildRefCountMap(): Map<string, number> {
		const countMap = new Map<string, number>();

		const markdownFiles = this.app.vault.getMarkdownFiles();
		for (const md of markdownFiles) {
			const cache = this.app.metadataCache.getFileCache(md);
			if (!cache) continue;

			const entries = [...(cache.embeds || []), ...(cache.links || [])];
			for (const entry of entries) {
				const linkPath = normalizeVaultPath(entry.link).toLowerCase();
				const linkName = (getFileNameFromPath(linkPath) || linkPath).toLowerCase();

				// 按完整路径和裸文件名分别累加
				countMap.set(linkPath, (countMap.get(linkPath) || 0) + 1);
				if (linkName !== linkPath) {
					countMap.set(linkName, (countMap.get(linkName) || 0) + 1);
				}
			}
		}

		return countMap;
	}

	/**
	 * 从预建 Map 中查询引用次数
	 */
	private lookupRefCount(originalPath: string, refCountMap: Map<string, number>): number {
		const normalizedPath = normalizeVaultPath(originalPath).toLowerCase();
		const fileName = (getFileNameFromPath(normalizedPath) || normalizedPath).toLowerCase();
		const exactCount = refCountMap.get(normalizedPath) || 0;
		const nameCount = refCountMap.get(fileName) || 0;

		// 兼容裸文件名与完整路径两种写法，避免同一文件不同链接风格时被低估。
		return Math.max(exactCount, nameCount);
	}

	/**
	 * 从隔离文件名中提取原始路径
	 */
	private extractOriginalPath(fileName: string): string | undefined {
		const separatorIndex = fileName.indexOf('__');
		if (separatorIndex === -1) return undefined;

		const encodedPart = fileName.substring(separatorIndex + 2);
		if (!encodedPart) return undefined;

		const decoded = normalizeVaultPath(safeDecodeURIComponent(encodedPart));
		return decoded || undefined;
	}

	/**
	 * 计算仪表盘统计数据
	 */
	private computeStats(): DashboardStats {
		const byType: Record<string, number> = {};
		let totalSize = 0;
		let unreferencedCount = 0;

		for (const item of this.trashItems) {
			totalSize += item.size;
			const type = getMediaType(item.name) || 'other';
			byType[type] = (byType[type] || 0) + 1;
			if (item.referenceCount === 0) {
				unreferencedCount++;
			}
		}

		return {
			totalFiles: this.trashItems.length,
			totalSize,
			byType,
			unreferencedRate: this.trashItems.length > 0
				? Math.round((unreferencedCount / this.trashItems.length) * 100)
				: 0
		};
	}

	/**
	 * 渲染视图
	 */
	renderView() {
		if (!this.contentEl) return;
		this.contentEl.empty();

		// 头部
		this.renderHeader();

		// 仪表盘
		if (this.trashItems.length > 0) {
			this.renderDashboard();
		}

		if (this.trashItems.length === 0) {
			this.contentEl.createDiv({
				cls: 'empty-state',
				text: this.plugin.t('trashFolderEmpty')
			});
			return;
		}

		// 批量操作工具栏
		this.renderBatchToolbar();

		// 文件列表
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
		header.createEl('h2', { text: this.plugin.t('trashManagement') });

		const desc = header.createDiv({ cls: 'header-description' });
		desc.createSpan({ text: this.plugin.t('trashManagementDesc') });

		const actions = header.createDiv({ cls: 'header-actions' });

		// 刷新按钮
		const refreshBtn = actions.createEl('button', { cls: 'refresh-button' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.addEventListener('click', () => {
			this.loadTrashItems();
		});
		refreshBtn.title = this.plugin.t('refresh');

		// 安全扫描按钮
		const scanBtn = actions.createEl('button', { cls: 'action-button' });
		setIcon(scanBtn, 'shield-check');
		scanBtn.createSpan({ text: ` ${this.plugin.t('safeScan')}` });
		scanBtn.disabled = !this.plugin.settings.safeScanEnabled;
		scanBtn.addEventListener('click', () => {
			void this.runSafeScan();
		});
		scanBtn.title = this.plugin.t('safeScanDesc');

		// 清空隔离文件夹按钮
		const clearAllBtn = actions.createEl('button', { cls: 'action-button danger' });
		setIcon(clearAllBtn, 'trash-2');
		clearAllBtn.addEventListener('click', () => {
			void this.confirmClearAll();
		});
		clearAllBtn.title = this.plugin.t('clearTrashTooltip');
	}

	/**
	 * 渲染统计仪表盘
	 */
	private renderDashboard() {
		const stats = this.computeStats();
		const dashboard = this.contentEl.createDiv({ cls: 'trash-dashboard' });

		// 卡片1：总文件数
		const cardFiles = dashboard.createDiv({ cls: 'dashboard-card' });
		const filesIcon = cardFiles.createDiv({ cls: 'dashboard-icon' });
		setIcon(filesIcon, 'files');
		cardFiles.createDiv({ cls: 'dashboard-value', text: String(stats.totalFiles) });
		cardFiles.createDiv({ cls: 'dashboard-label', text: this.plugin.t('filesInTrash').replace('{count}', '') });

		// 卡片2：占用空间
		const cardSize = dashboard.createDiv({ cls: 'dashboard-card' });
		const sizeIcon = cardSize.createDiv({ cls: 'dashboard-icon' });
		setIcon(sizeIcon, 'hard-drive');
		cardSize.createDiv({ cls: 'dashboard-value', text: formatFileSize(stats.totalSize) });
		cardSize.createDiv({ cls: 'dashboard-label', text: this.plugin.t('totalSize').replace('{size}', '') });

		// 卡片3：类型分布
		const cardType = dashboard.createDiv({ cls: 'dashboard-card' });
		const typeIcon = cardType.createDiv({ cls: 'dashboard-icon' });
		setIcon(typeIcon, 'pie-chart');
		const typeParts: string[] = [];
		for (const [type, count] of Object.entries(stats.byType)) {
			typeParts.push(`${type}: ${count}`);
		}
		cardType.createDiv({ cls: 'dashboard-value', text: typeParts.join(', ') || '-' });
		cardType.createDiv({ cls: 'dashboard-label', text: this.plugin.t('typeDistribution') });

		// 卡片4：未引用率
		const cardUnref = dashboard.createDiv({ cls: 'dashboard-card' });
		const unrefIcon = cardUnref.createDiv({ cls: 'dashboard-icon' });
		setIcon(unrefIcon, 'unlink');
		cardUnref.createDiv({ cls: 'dashboard-value', text: `${stats.unreferencedRate}%` });
		cardUnref.createDiv({ cls: 'dashboard-label', text: this.plugin.t('unreferencedRate') });
	}

	/**
	 * 渲染批量操作工具栏
	 */
	private renderBatchToolbar() {
		const toolbar = this.contentEl.createDiv({ cls: 'batch-toolbar' });

		// 全选/反选
		const selectAllBtn = toolbar.createEl('button', { cls: 'toolbar-btn' });
		setIcon(selectAllBtn, 'check-square');
		selectAllBtn.createSpan({ text: ` ${this.plugin.t('selectAll')}` });
		selectAllBtn.addEventListener('click', () => {
			const allSelected = this.trashItems.every(i => i.selected);
			this.trashItems.forEach(i => i.selected = !allSelected);
			this.renderView();
		});

		const selectedCount = this.trashItems.filter(i => i.selected).length;
		toolbar.createSpan({
			cls: 'selected-count',
			text: this.plugin.t('selectedCount', { count: selectedCount })
		});

		// 批量恢复
		const batchRestoreBtn = toolbar.createEl('button', { cls: 'toolbar-btn success' });
		setIcon(batchRestoreBtn, 'rotate-ccw');
		batchRestoreBtn.createSpan({ text: ` ${this.plugin.t('batchRestore')}` });
		batchRestoreBtn.addEventListener('click', () => {
			void this.batchRestore();
		});

		// 批量删除
		const batchDeleteBtn = toolbar.createEl('button', { cls: 'toolbar-btn danger' });
		setIcon(batchDeleteBtn, 'trash-2');
		batchDeleteBtn.createSpan({ text: ` ${this.plugin.t('batchDelete')}` });
		batchDeleteBtn.addEventListener('click', () => {
			void this.batchDelete();
		});
	}

	/**
	 * 渲染单个隔离文件项
	 */
	renderTrashItem(container: HTMLElement, item: TrashItem) {
		const itemEl = container.createDiv({ cls: `trash-item ${item.selected ? 'selected' : ''}` });

		// 复选框
		const checkbox = itemEl.createEl('input', {
			type: 'checkbox',
			cls: 'item-checkbox'
		});
		checkbox.checked = item.selected;
		checkbox.addEventListener('change', () => {
			item.selected = checkbox.checked;
			itemEl.toggleClass('selected', item.selected);
			// 更新工具栏计数
			const toolbar = this.contentEl.querySelector('.batch-toolbar .selected-count');
			if (toolbar) {
				const count = this.trashItems.filter(i => i.selected).length;
				toolbar.textContent = this.plugin.t('selectedCount', { count });
			}
		});

		// 缩略图
		const thumbEl = itemEl.createDiv({ cls: 'item-thumbnail' });
		this.renderItemThumbnail(thumbEl, item);

		// 文件信息
		const info = itemEl.createDiv({ cls: 'item-info' });
		info.createDiv({ cls: 'item-name', text: item.name });
		info.createSpan({
			cls: 'item-type-badge',
			text: this.getTypeLabel(item.name)
		});

		if (item.originalPath) {
			info.createDiv({
				cls: 'item-original-path',
				text: `${this.plugin.t('originalPath')}: ${item.originalPath}`
			});
		}

		const meta = info.createDiv({ cls: 'item-meta' });
		meta.createSpan({ cls: 'item-size', text: formatFileSize(item.size) });
		meta.createSpan({
			cls: 'item-date',
			text: `${this.plugin.t('deletedTime')}: ${new Date(item.modified).toLocaleString()}`
		});

		// 引用次数徽章
		info.createSpan({
			cls: `ref-badge ${item.referenceCount > 0 ? 'ref-active' : 'ref-zero'}`,
			text: this.plugin.t('referencedBy', { count: item.referenceCount })
		});

		// 操作按钮
		const actions = itemEl.createDiv({ cls: 'item-actions' });

		const restoreBtn = actions.createEl('button', { cls: 'item-button success' });
		setIcon(restoreBtn, 'rotate-ccw');
		restoreBtn.addEventListener('click', () => {
			void this.restoreFile(item);
		});
		restoreBtn.title = this.plugin.t('restoreTooltip');

		const deleteBtn = actions.createEl('button', { cls: 'item-button danger' });
		setIcon(deleteBtn, 'trash-2');
		deleteBtn.addEventListener('click', () => {
			void this.confirmDelete(item);
		});
		deleteBtn.title = this.plugin.t('permanentDeleteTooltip');

		// 右键菜单
		itemEl.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showContextMenu(e as MouseEvent, item);
		});
	}

	/**
	 * 渲染条目缩略图
	 */
	private renderItemThumbnail(container: HTMLElement, item: TrashItem) {
		const mediaType = getMediaType(item.name);

		if (mediaType === 'image') {
			const src = this.app.vault.getResourcePath(item.file);
			const img = container.createEl('img', {
				attr: { src, alt: item.name }
			});
			img.addEventListener('error', () => {
				container.empty();
				const icon = container.createDiv({ cls: 'thumb-icon' });
				setIcon(icon, 'image');
			});
		} else {
			const iconName = mediaType === 'video' ? 'video' :
				mediaType === 'audio' ? 'music' :
				mediaType === 'document' ? 'file-text' : 'file';
			this.renderThumbnailFallback(container, iconName, this.getTypeLabel(item.name));
		}
	}

	private renderThumbnailFallback(container: HTMLElement, iconName: string, label: string) {
		container.empty();

		const fallback = container.createDiv({ cls: 'media-thumbnail-fallback' });

		const icon = fallback.createDiv({ cls: 'thumb-icon' });
		setIcon(icon, iconName);

		fallback.createDiv({
			cls: 'media-thumbnail-fallback-label media-thumbnail-fallback-label-strong',
			text: label
		});
	}

	private getTypeLabel(fileName: string): string {
		const mediaType = getMediaType(fileName);
		if (mediaType === 'document') {
			return getDocumentDisplayLabel(fileName);
		}

		const dot = fileName.lastIndexOf('.');
		if (dot !== -1 && dot < fileName.length - 1) {
			return fileName.slice(dot + 1).toUpperCase();
		}

		if (mediaType) {
			return mediaType.toUpperCase();
		}

		return 'FILE';
	}

	/**
	 * 安全扫描：自动查找孤立文件并送入隔离
	 */
	async runSafeScan() {
		const settings = this.plugin.settings;
		if (!settings.safeScanEnabled) {
			new Notice(this.plugin.t('safeScanDesc'));
			return;
		}

		const now = Date.now();
		const dayMs = 24 * 60 * 60 * 1000;
		const cutoffTime = now - (settings.safeScanUnrefDays * dayMs);
		const minSize = settings.safeScanMinSize;

		new Notice(this.plugin.t('safeScanStarted'));

		try {
			const referencedImages = await this.plugin.getReferencedImages();
			const allMedia = this.plugin.fileIndex.isInitialized
				? this.plugin.fileIndex.getFiles()
					.map(e => this.app.vault.getAbstractFileByPath(e.path))
					.filter((f): f is TFile => f instanceof TFile)
				: this.plugin.getAllImageFiles();

			const trashPath = normalizeVaultPath(this.plugin.settings.trashFolder) || '';
			const candidates: TFile[] = [];

			for (const file of allMedia) {
				// 排除已在隔离区的文件
				if (trashPath && file.path.startsWith(trashPath + '/')) continue;

				const normalizedPath = normalizeVaultPath(file.path).toLowerCase();
				const normalizedName = file.name.toLowerCase();
				const isReferenced = referencedImages.has(normalizedPath) ||
					referencedImages.has(normalizedName);

				if (!isReferenced &&
					file.stat.mtime < cutoffTime &&
					file.stat.size >= minSize) {
					candidates.push(file);
				}
			}

			if (candidates.length === 0) {
				new Notice(this.plugin.t('safeScanNoResults'));
				return;
			}

			// 确认对话框
			const confirmed = await this.showConfirmModal(
				this.plugin.t('safeScanConfirm', {
					count: candidates.length,
					days: settings.safeScanUnrefDays,
					size: formatFileSize(minSize)
				})
			);

			if (!confirmed) return;

			let moved = 0;
			for (const file of candidates) {
				const result = await this.plugin.safeDeleteFile(file);
				if (result) moved++;
			}

			new Notice(this.plugin.t('safeScanComplete', { count: moved }));
			this.loadTrashItems();
		} catch (error) {
			console.error('安全扫描失败:', error);
			new Notice(this.plugin.t('safeScanFailed'));
		}
	}

	/**
	 * 批量恢复选中文件
	 */
	async batchRestore() {
		const selected = this.trashItems.filter(i => i.selected);
		if (selected.length === 0) {
			new Notice(this.plugin.t('noItemsSelected'));
			return;
		}

		const confirmed = await this.showConfirmModal(
			this.plugin.t('confirmBatchRestore', { count: selected.length })
		);
		if (!confirmed) return;

		let restored = 0;
		for (const item of selected) {
			try {
				let targetPath = normalizeVaultPath(item.originalPath || '');
				if (!targetPath) {
					const separatorIndex = item.rawName.indexOf('__');
					if (separatorIndex !== -1) {
						targetPath = normalizeVaultPath(
							safeDecodeURIComponent(item.rawName.substring(separatorIndex + 2))
						);
					} else {
						targetPath = normalizeVaultPath(item.rawName);
					}
				}

				if (targetPath) {
					const result = await this.plugin.restoreFile(item.file, targetPath);
					if (result) restored++;
				}
			} catch (error) {
				console.warn(`恢复文件失败: ${item.name}`, error);
			}
		}

		new Notice(this.plugin.t('batchRestoreComplete', { count: restored }));
		this.loadTrashItems();
	}

	/**
	 * 批量删除选中文件
	 */
	async batchDelete() {
		const selected = this.trashItems.filter(i => i.selected);
		if (selected.length === 0) {
			new Notice(this.plugin.t('noItemsSelected'));
			return;
		}

		const confirmed = await this.showConfirmModal(
			this.plugin.t('confirmClearTrash').replace('{count}', String(selected.length))
		);
		if (!confirmed) return;

		const results = await Promise.all(
			selected.map(item =>
				this.plugin.app.fileManager.trashFile(item.file).then(() => true).catch(() => false)
			)
		);

		const deleted = results.filter(r => r).length;
		new Notice(this.plugin.t('batchDeleteComplete').replace('{count}', String(deleted)));
		this.loadTrashItems();
	}

	/**
	 * 显示右键菜单
	 */
	showContextMenu(event: MouseEvent, trashItem: TrashItem) {
		const menu = new Menu();

		menu.addItem((menuItem: MenuItem) => {
			menuItem.setTitle(this.plugin.t('restore'))
				.setIcon('rotate-ccw')
				.onClick(() => {
					void this.restoreFile(trashItem);
				});
		});

		menu.addItem((menuItem: MenuItem) => {
			menuItem.setTitle(this.plugin.t('permanentDelete'))
				.setIcon('trash-2')
				.onClick(() => {
					void this.confirmDelete(trashItem);
				});
		});

		menu.addSeparator();

		menu.addItem((menuItem: MenuItem) => {
			menuItem.setTitle(this.plugin.t('copiedFileName'))
				.setIcon('copy')
				.onClick(() => {
					void navigator.clipboard.writeText(trashItem.name).then(() => {
						new Notice(this.plugin.t('fileNameCopied'));
					}).catch((error) => {
						console.error('复制到剪贴板失败:', error);
						new Notice(this.plugin.t('error'));
					});
				});
		});

		menu.addItem((menuItem: MenuItem) => {
			menuItem.setTitle(this.plugin.t('copiedOriginalPath'))
				.setIcon('link')
				.onClick(() => {
					if (trashItem.originalPath) {
						void navigator.clipboard.writeText(trashItem.originalPath).then(() => {
							new Notice(this.plugin.t('originalPathCopied'));
						}).catch((error) => {
							console.error('复制到剪贴板失败:', error);
							new Notice(this.plugin.t('error'));
						});
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
			let targetPath = normalizeVaultPath(item.originalPath || '');
			if (!targetPath) {
				const separatorIndex = item.rawName.indexOf('__');
				if (separatorIndex !== -1) {
					targetPath = normalizeVaultPath(
						safeDecodeURIComponent(item.rawName.substring(separatorIndex + 2))
					);
				} else {
					targetPath = normalizeVaultPath(item.rawName);
				}
			}

			if (!targetPath) {
				new Notice(this.plugin.t('restoreFailed').replace('{message}', this.plugin.t('error')));
				return;
			}

			const restored = await this.plugin.restoreFile(item.file, targetPath);
			if (!restored) return;

			this.trashItems = this.trashItems.filter(i => i.file.path !== item.file.path);
			this.renderView();
		} catch (error) {
			console.error('恢复文件失败:', error);
			new Notice(this.plugin.t('restoreFailed').replace('{message}', (error as Error).message));
		}
	}

	/**
	 * 显示国际化确认对话框
	 */
	private showConfirmModal(message: string): Promise<boolean> {
		return new Promise((resolve) => {
			const modal = new Modal(this.plugin.app);
			let resolved = false;

			modal.onClose = () => {
				if (!resolved) {
					resolved = true;
					resolve(false);
				}
			};

			modal.contentEl.createDiv({ cls: 'confirm-modal-content' }, (el) => {
				el.createDiv({ text: message, cls: 'confirm-modal-message' });
				el.createDiv({ cls: 'confirm-modal-buttons' }, (buttonsEl) => {
					const cancelBtn = new ButtonComponent(buttonsEl);
					cancelBtn.setButtonText(this.plugin.t('cancel'));
					cancelBtn.onClick(() => {
						resolved = true;
						modal.close();
						resolve(false);
					});

					const confirmBtn = new ButtonComponent(buttonsEl);
					confirmBtn.setButtonText(this.plugin.t('confirm'));
					confirmBtn.setCta();
					confirmBtn.onClick(() => {
						resolved = true;
						modal.close();
						resolve(true);
					});
				});
			});

			modal.open();
		});
	}

	/**
	 * 确认删除单个文件
	 */
	async confirmDelete(item: TrashItem) {
		const confirmed = await this.showConfirmModal(
			this.plugin.t('confirmDeleteFile').replace('{name}', item.name)
		);

		if (confirmed) {
			try {
				await this.plugin.app.fileManager.trashFile(item.file);
				new Notice(this.plugin.t('fileDeleted').replace('{name}', item.name));
				this.trashItems = this.trashItems.filter(i => i.file.path !== item.file.path);
				this.renderView();
			} catch (error) {
				console.error('删除文件失败:', error);
				new Notice(this.plugin.t('deleteFailed'));
			}
		}
	}

	/**
	 * 确认清空所有文件
	 */
	async confirmClearAll() {
		if (this.trashItems.length === 0) {
			new Notice(this.plugin.t('trashEmpty'));
			return;
		}

		const confirmed = await this.showConfirmModal(
			this.plugin.t('confirmClearTrash').replace('{count}', String(this.trashItems.length))
		);

		if (confirmed) {
			const results = await Promise.all(
				this.trashItems.map(item =>
					this.plugin.app.fileManager.trashFile(item.file).then(() => true).catch(() => false)
				)
			);

			const deleted = results.filter(r => r).length;
			const errors = results.filter(r => !r).length;

			if (deleted > 0) {
				new Notice(this.plugin.t('batchDeleteComplete').replace('{count}', String(deleted)));
			}
			if (errors > 0) {
				new Notice(this.plugin.t('batchDeleteComplete').replace('{count}', String(errors)) + ' (' + this.plugin.t('error') + ')');
			}

			this.loadTrashItems();
		}
	}

	/**
	 * 获取文件图标
	 */
	private getFileIcon(ext: string): string {
		const mediaType = getMediaType(`filename.${ext}`);
		switch (mediaType) {
			case 'image': return 'image';
			case 'video': return 'video';
			case 'audio': return 'music';
			case 'document': return 'file-text';
			default: return 'file';
		}
	}
}

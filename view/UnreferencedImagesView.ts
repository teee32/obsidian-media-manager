import { TFile, ItemView, WorkspaceLeaf, setIcon, Menu, MenuItem, Notice } from 'obsidian';
import ImageManagerPlugin from '../main';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { formatFileSize } from '../utils/format';
import { getMediaType, getDocumentDisplayLabel } from '../utils/mediaTypes';

export const VIEW_TYPE_UNREFERENCED_IMAGES = 'unreferenced-images-view';

interface UnreferencedImage {
	file: TFile;
	path: string;
	name: string;
	size: number;
	modified: number;
}

export class UnreferencedImagesView extends ItemView {
	plugin: ImageManagerPlugin;
	unreferencedImages: UnreferencedImage[] = [];
	private isScanning: boolean = false;

	constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_UNREFERENCED_IMAGES;
	}

	getDisplayText() {
		return this.plugin.t('unreferencedMedia');
	}

	async onOpen() {
		// 等待 contentEl 准备好
		let retries = 0;
		while (!this.contentEl && retries < 10) {
			await new Promise(resolve => setTimeout(resolve, 50));
			retries++;
		}
		if (!this.contentEl) {
			console.error('UnreferencedImagesView: contentEl not ready');
			return;
		}
		this.contentEl.addClass('unreferenced-images-view');

		if (!this.isScanning) {
			await this.scanUnreferencedImages();
		}
	}

	onClose(): Promise<void> {
		// 清理工作
		return Promise.resolve();
	}

	async scanUnreferencedImages() {
		// 如果视图已关闭或 contentEl 不可用，直接返回
		if (!this.contentEl || this.isScanning) {
			return;
		}

		this.isScanning = true;
		this.contentEl.empty();

		// 显示扫描中状态
		const loading = this.contentEl.createDiv({ cls: 'loading-state' });
		loading.createEl('div', { cls: 'spinner' });
		loading.createDiv({ text: this.plugin.t('scanningUnreferenced') });

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
			this.renderView();
		} catch (error) {
			console.error('扫描图片时出错:', error);
			this.contentEl.createDiv({
				cls: 'error-state',
				text: this.plugin.t('scanError')
			});
		} finally {
			this.isScanning = false;
		}
	}

	renderView() {
		// 如果视图已关闭或 contentEl 不可用，直接返回
		if (!this.contentEl) {
			return;
		}

		this.contentEl.empty();

		// 创建头部
		this.renderHeader();
		this.renderWorkspaceSummary();

		if (this.unreferencedImages.length === 0) {
			this.contentEl.createDiv({
				cls: 'success-state',
				text: this.plugin.t('allMediaReferenced')
			});
			return;
		}

		// 创建统计信息
		const stats = this.contentEl.createDiv({ cls: 'stats-bar' });
		stats.createSpan({
			text: this.plugin.t('unreferencedFound').replace('{count}', String(this.unreferencedImages.length)),
			cls: 'stats-count'
		});

		const totalSize = this.unreferencedImages.reduce((sum, img) => sum + img.size, 0);
		stats.createSpan({
			text: this.plugin.t('totalSizeLabel').replace('{size}', formatFileSize(totalSize)),
			cls: 'stats-size'
		});

		// 创建图片列表
		const list = this.contentEl.createDiv({ cls: 'unreferenced-list' });

		for (const image of this.unreferencedImages) {
			this.renderImageItem(list, image);
		}
	}

	private renderWorkspaceSummary() {
		const totalSize = this.unreferencedImages.reduce((sum, img) => sum + img.size, 0);
		const summary = this.contentEl.createDiv({ cls: 'workspace-summary-grid workspace-summary-grid-compact' });
		this.createSummaryCard(
			summary,
			this.plugin.t('reviewQueue'),
			String(this.unreferencedImages.length),
			this.plugin.t('unreferencedMedia')
		);
		this.createSummaryCard(
			summary,
			this.plugin.t('totalSize'),
			formatFileSize(totalSize),
			this.plugin.t('deleteToTrash')
		);
		this.createSummaryCard(
			summary,
			this.plugin.t('trashFolderPath'),
			this.plugin.settings.trashFolder,
			this.plugin.t('copyAllPaths')
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

	renderHeader() {
		const header = this.contentEl.createDiv({ cls: 'unreferenced-header' });
		const headerMain = header.createDiv({ cls: 'view-header-main' });
		const titleBlock = headerMain.createDiv({ cls: 'view-header-copy' });
		const kicker = titleBlock.createDiv({ cls: 'view-kicker-row' });
		kicker.createSpan({ cls: 'view-kicker', text: this.plugin.t('reviewQueue') });
		kicker.createSpan({ cls: 'view-inline-badge', text: this.plugin.t('trashManagement') });

		titleBlock.createEl('h2', { text: this.plugin.t('unreferencedMedia') });

		const desc = titleBlock.createDiv({ cls: 'header-description' });
		desc.createSpan({ text: this.plugin.t('unreferencedDesc') });
		desc.createSpan({
			cls: 'view-inline-badge',
			text: this.plugin.t('unreferencedFound').replace('{count}', String(this.unreferencedImages.length))
		});
		if (this.unreferencedImages.length > 0) {
			const totalSize = this.unreferencedImages.reduce((sum, img) => sum + img.size, 0);
			desc.createSpan({
				cls: 'view-inline-badge',
				text: this.plugin.t('totalSizeLabel').replace('{size}', formatFileSize(totalSize))
			});
		}

		// 操作按钮
		const actions = header.createDiv({ cls: 'view-header-controls' });

		const refreshBtn = actions.createEl('button', { cls: 'refresh-button button-with-label' });
		setIcon(refreshBtn, 'refresh-cw');
		refreshBtn.createSpan({ cls: 'button-label', text: this.plugin.t('refresh') });
		refreshBtn.addEventListener('click', () => {
			void this.scanUnreferencedImages();
		});

		const bulkActions = actions.createDiv({ cls: 'view-control-cluster' });

		const copyAllBtn = bulkActions.createEl('button', { cls: 'action-button button-with-label' });
		setIcon(copyAllBtn, 'copy');
		copyAllBtn.createSpan({ cls: 'button-label', text: this.plugin.t('copyAllPaths') });
		copyAllBtn.addEventListener('click', () => this.copyAllPaths());

		const deleteAllBtn = bulkActions.createEl('button', { cls: 'action-button danger button-with-label' });
		setIcon(deleteAllBtn, 'trash-2');
		deleteAllBtn.createSpan({ cls: 'button-label', text: this.plugin.t('delete') });
		deleteAllBtn.addEventListener('click', () => this.confirmDeleteAll());
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
			const img = container.createEl('img', {
				attr: {
					src,
					alt: displayName
				}
			});

			img.addEventListener('error', () => {
				container.empty();
				container.createDiv({
					cls: 'image-error',
					text: this.plugin.t('imageLoadError')
				});
			});
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

	renderImageItem(container: HTMLElement, image: UnreferencedImage) {
		const item = container.createDiv({ cls: 'unreferenced-item' });
		item.title = image.path;

		// 图片缩略图
		const thumbnail = item.createDiv({ cls: 'item-thumbnail' });
		this.renderMediaThumbnail(thumbnail, image.file, image.name);

		// 图片信息
		const info = item.createDiv({ cls: 'item-info' });
		const header = info.createDiv({ cls: 'item-head' });
		header.createDiv({ cls: 'item-name', text: image.name });
		header.createSpan({
			cls: 'item-type-badge',
			text: image.file.extension.toUpperCase()
		});
		info.createDiv({ cls: 'item-path', text: image.path });
		const meta = info.createDiv({ cls: 'item-meta' });
		meta.createDiv({ cls: 'item-size', text: formatFileSize(image.size) });
		meta.createDiv({
			cls: 'item-date',
			text: new Date(image.modified).toLocaleDateString()
		});

		// 操作按钮
		const actions = item.createDiv({ cls: 'item-actions' });

		// 在笔记中查找按钮
		const findBtn = actions.createEl('button', { cls: 'item-button' });
		setIcon(findBtn, 'search');
		findBtn.title = this.plugin.t('findInNotes');
		findBtn.addEventListener('click', () => {
			void this.plugin.openImageInNotes(image.file);
		});

		// 复制路径按钮
		const copyBtn = actions.createEl('button', { cls: 'item-button' });
		setIcon(copyBtn, 'link');
		copyBtn.title = this.plugin.t('copyPath');
		copyBtn.addEventListener('click', () => {
			void navigator.clipboard.writeText(image.path).then(() => {
				new Notice(this.plugin.t('pathCopied'));
			}).catch((error) => {
				console.error('复制到剪贴板失败:', error);
				new Notice(this.plugin.t('error'));
			});
		});

		// 删除按钮
		const deleteBtn = actions.createEl('button', { cls: 'item-button danger' });
		setIcon(deleteBtn, 'trash-2');
		deleteBtn.title = this.plugin.t('delete');
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

		menu.addSeparator();

		menu.addItem((item: MenuItem) => {
			item.setTitle(this.plugin.t('delete'))
				.setIcon('trash-2')
				.onClick(() => {
					const img = this.unreferencedImages.find(i => i.file.path === file.path)
						|| { file, path: file.path, name: file.name, size: file.stat.size, modified: file.stat.mtime };
					this.confirmDelete(img);
				});
		});

		menu.showAtPosition({ x: event.clientX, y: event.clientY });
	}

	confirmDelete(image: UnreferencedImage) {
		new DeleteConfirmModal(
			this.app,
			this.plugin,
			[image],
			async () => {
				const success = await this.plugin.safeDeleteFile(image.file);
				if (success) {
					// 从列表中移除
					this.unreferencedImages = this.unreferencedImages.filter(
						img => img.file.path !== image.file.path
					);
					// 重新渲染
					this.renderView();
				}
			}
		).open();
	}

	confirmDeleteAll() {
		if (this.unreferencedImages.length === 0) {
			new Notice(this.plugin.t('noFilesToDelete'));
			return;
		}

		new DeleteConfirmModal(
			this.app,
			this.plugin,
			this.unreferencedImages,
			async () => {
				// 使用 Promise.all 并发处理删除
				const results = await Promise.all(
					this.unreferencedImages.map(image => this.plugin.safeDeleteFile(image.file))
				);

				// 统计成功和失败的数量
				const deleted = this.unreferencedImages.filter((_, i) => results[i]).map(img => img.name);
				const errors = this.unreferencedImages.filter((_, i) => !results[i]).map(img => img.name);

				if (deleted.length > 0) {
					new Notice(this.plugin.t('processedFiles').replace('{count}', String(deleted.length)));
				}
				if (errors.length > 0) {
					new Notice(this.plugin.t('processedFilesError').replace('{errors}', String(errors.length)));
				}

				// 重新扫描
				await this.scanUnreferencedImages();
			}
		).open();
	}

	copyAllPaths() {
		const paths = this.unreferencedImages.map(img => img.path).join('\n');
		void navigator.clipboard.writeText(paths).then(() => {
			new Notice(this.plugin.t('copiedFilePaths').replace('{count}', String(this.unreferencedImages.length)));
		}).catch((error) => {
			console.error('复制到剪贴板失败:', error);
			new Notice(this.plugin.t('error'));
		});
	}

	// 已移除 formatFileSize 方法，使用 utils/format.ts 中的实现
}

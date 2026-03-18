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

	async onClose() {
		// 清理工作
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
			await this.renderView();
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

	async renderView() {
		// 如果视图已关闭或 contentEl 不可用，直接返回
		if (!this.contentEl) {
			return;
		}

		this.contentEl.empty();

		// 创建头部
		this.renderHeader();

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

	renderHeader() {
		const header = this.contentEl.createDiv({ cls: 'unreferenced-header' });

		header.createEl('h2', { text: this.plugin.t('unreferencedMedia') });

		const desc = header.createDiv({ cls: 'header-description' });
		desc.createSpan({ text: this.plugin.t('unreferencedDesc') });

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

	private renderThumbnailFallback(container: HTMLElement, iconName: string, label: string) {
		container.empty();

		const fallback = container.createDiv();
		fallback.style.width = '100%';
		fallback.style.height = '100%';
		fallback.style.display = 'flex';
		fallback.style.flexDirection = 'column';
		fallback.style.alignItems = 'center';
		fallback.style.justifyContent = 'center';
		fallback.style.gap = '6px';
		fallback.style.color = 'var(--text-muted)';

		const iconEl = fallback.createDiv();
		setIcon(iconEl, iconName);

		const labelEl = fallback.createDiv({ text: label });
		labelEl.style.fontSize = '0.75em';
		labelEl.style.textTransform = 'uppercase';
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
			const video = container.createEl('video');
			video.src = src;
			video.muted = true;
			video.preload = 'metadata';
			video.playsInline = true;
			video.style.width = '100%';
			video.style.height = '100%';
			video.style.objectFit = 'cover';
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

		// 图片缩略图
		const thumbnail = item.createDiv({ cls: 'item-thumbnail' });
		this.renderMediaThumbnail(thumbnail, image.file, image.name);

		// 图片信息
		const info = item.createDiv({ cls: 'item-info' });
		info.createDiv({ cls: 'item-name', text: image.name });
		info.createDiv({ cls: 'item-path', text: image.path });
		info.createDiv({ cls: 'item-size', text: formatFileSize(image.size) });

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
					this.plugin.openImageInNotes(file);
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
					const link = `[[${file.name}]]`;
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
					const src = this.app.vault.getResourcePath(file);
					window.open(src, '_blank', 'noopener,noreferrer');
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

	async confirmDelete(image: UnreferencedImage) {
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
					await this.renderView();
				}
			}
		).open();
	}

	async confirmDeleteAll() {
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

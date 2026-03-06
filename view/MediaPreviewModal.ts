import { Modal, Notice, TFile } from 'obsidian';
import ImageManagerPlugin from '../main';

export class MediaPreviewModal extends Modal {
	plugin: ImageManagerPlugin;
	file: TFile;
	currentIndex: number = 0;
	allFiles: TFile[] = [];

	constructor(app: any, plugin: ImageManagerPlugin, file: TFile, allFiles: TFile[] = []) {
		super(app);
		this.plugin = plugin;
		this.file = file;
		this.allFiles = allFiles.length > 0 ? allFiles : [file];
		this.currentIndex = this.allFiles.findIndex(f => f.path === file.path);
	}

	onOpen() {
		const { contentEl, modalEl } = this;
		modalEl.addClass('media-preview-modal');

		// 关闭按钮
		const closeBtn = contentEl.createDiv({ cls: 'preview-close' });
		closeBtn.textContent = '×';
		closeBtn.addEventListener('click', () => this.close());

		// 媒体容器
		const container = contentEl.createDiv({ cls: 'preview-container' });

		// 渲染媒体
		this.renderMedia(container);

		// 导航控件（如果有多张图片）
		if (this.allFiles.length > 1) {
			this.renderNavigation(container);
		}

		// 信息栏
		this.renderInfoBar(contentEl);

		// 键盘导航
		this.registerKeyboardNav();
	}

	/**
	 * 渲染媒体
	 */
	renderMedia(container: HTMLElement) {
		container.empty();
		const file = this.allFiles[this.currentIndex];
		const ext = file.extension.toLowerCase();
		const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
		const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
		const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext);
		const isPdf = ext === 'pdf';

		if (isImage) {
			const img = container.createEl('img', {
				cls: 'preview-image',
				attr: { src: this.app.vault.getResourcePath(file) }
			});
		} else if (isVideo) {
			const video = container.createEl('video', {
				cls: 'preview-video',
				attr: { controls: 'true' }
			});
			video.src = this.app.vault.getResourcePath(file);
		} else if (isAudio) {
			const audio = container.createEl('audio', {
				cls: 'preview-audio',
				attr: { controls: 'true' }
			});
			audio.src = this.app.vault.getResourcePath(file);
		} else if (isPdf) {
			const iframe = container.createEl('iframe', {
				cls: 'preview-pdf',
				attr: { src: this.app.vault.getResourcePath(file) }
			});
		} else {
			container.createDiv({ cls: 'preview-unsupported', text: '不支持预览此类型文件' });
		}
	}

	/**
	 * 渲染导航控件
	 */
	renderNavigation(container: HTMLElement) {
		const nav = container.createDiv({ cls: 'preview-nav' });

		// 上一张
		const prevBtn = nav.createEl('button', { cls: 'nav-button prev' });
		prevBtn.textContent = '‹';
		prevBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.prev();
		});

		// 页码
		nav.createSpan({
			text: `${this.currentIndex + 1} / ${this.allFiles.length}`,
			cls: 'nav-info'
		});

		// 下一张
		const nextBtn = nav.createEl('button', { cls: 'nav-button next' });
		nextBtn.textContent = '›';
		nextBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.next();
		});
	}

	/**
	 * 渲染信息栏
	 */
	renderInfoBar(contentEl: HTMLElement) {
		const file = this.allFiles[this.currentIndex];
		const infoBar = contentEl.createDiv({ cls: 'preview-info-bar' });

		// 文件名
		infoBar.createDiv({ cls: 'info-name', text: file.name });

		// 操作按钮
		const actions = infoBar.createDiv({ cls: 'info-actions' });

		// 复制路径
		const copyPathBtn = actions.createEl('button');
		copyPathBtn.textContent = '复制路径';
		copyPathBtn.addEventListener('click', () => {
			navigator.clipboard.writeText(file.path);
			new Notice('路径已复制');
		});

		// 复制链接
		const copyLinkBtn = actions.createEl('button');
		copyLinkBtn.textContent = '复制链接';
		copyLinkBtn.addEventListener('click', () => {
			const link = `[[${file.name}]]`;
			navigator.clipboard.writeText(link);
			new Notice('链接已复制');
		});

		// 在笔记中查找
		const findBtn = actions.createEl('button');
		findBtn.textContent = '在笔记中查找';
		findBtn.addEventListener('click', () => {
			this.close();
			this.plugin.openImageInNotes(file);
		});
	}

	/**
	 * 注册键盘导航
	 */
	registerKeyboardNav() {
		const handleKey = (e: KeyboardEvent) => {
			switch (e.key) {
				case 'ArrowLeft':
					this.prev();
					break;
				case 'ArrowRight':
					this.next();
					break;
				case 'Escape':
					this.close();
					break;
			}
		};

		this.modalEl.addEventListener('keydown', handleKey);
	}

	/**
	 * 上一张
	 */
	prev() {
		if (this.currentIndex > 0) {
			this.currentIndex--;
			this.updateContent();
		}
	}

	/**
	 * 下一张
	 */
	next() {
		if (this.currentIndex < this.allFiles.length - 1) {
			this.currentIndex++;
			this.updateContent();
		}
	}

	/**
	 * 更新内容
	 */
	updateContent() {
		const container = this.contentEl.querySelector('.preview-container');
		if (container) {
			this.renderMedia(container as HTMLElement);
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

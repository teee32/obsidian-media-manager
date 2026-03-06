import { Modal, Notice, TFile } from 'obsidian';
import ImageManagerPlugin from '../main';

interface UnreferencedImage {
	file: TFile;
	path: string;
	name: string;
	size: number;
	modified: number;
}

export class DeleteConfirmModal extends Modal {
	plugin: ImageManagerPlugin;
	images: UnreferencedImage[];
	onConfirm: () => Promise<void>;
	private isDeleting: boolean = false;

	constructor(
		app: any,
		plugin: ImageManagerPlugin,
		images: UnreferencedImage[],
		onConfirm: () => Promise<void>
	) {
		super(app);
		this.plugin = plugin;
		this.images = images;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// 标题
		contentEl.createEl('h2', {
			text: this.images.length === 1
				? '确认删除'
				: `确认删除 ${this.images.length} 个文件`
		});

		// 警告信息
		const warning = contentEl.createDiv({ cls: 'modal-warning' });
		const warningText = warning.createEl('p');
		warningText.textContent = this.plugin.settings.useTrashFolder
			? '文件将被移至隔离文件夹，您可以在设置中恢复或彻底删除。'
			: '此操作不可撤销，文件将被永久删除。';
		warningText.style.color = 'var(--text-warning)';
		warningText.style.margin = '16px 0';

		// 文件列表
		const listContainer = contentEl.createDiv({ cls: 'modal-file-list' });
		listContainer.createEl('h3', { text: '以下文件将被删除：' });

		const list = listContainer.createEl('ul');
		const maxShow = 10;
		for (let i = 0; i < Math.min(this.images.length, maxShow); i++) {
			const img = this.images[i];
			list.createEl('li', {
				text: `${img.name} (${this.formatFileSize(img.size)})`
			});
		}
		if (this.images.length > maxShow) {
			list.createEl('li', {
				text: `... 以及其他 ${this.images.length - maxShow} 个文件`
			});
		}

		// 按钮区域
		const buttonContainer = contentEl.createDiv({ cls: 'modal-buttons' });
		buttonContainer.style.display = 'flex';
		buttonContainer.style.gap = '12px';
		buttonContainer.style.justifyContent = 'flex-end';
		buttonContainer.style.marginTop = '20px';

		// 取消按钮
		const cancelBtn = buttonContainer.createEl('button', {
			text: '取消',
			cls: 'mod-cta'
		});
		cancelBtn.addEventListener('click', () => this.close());

		// 删除按钮
		const deleteBtn = buttonContainer.createEl('button', {
			text: this.plugin.settings.useTrashFolder ? '移至隔离文件夹' : '删除',
			cls: 'mod-warning'
		});
		deleteBtn.addEventListener('click', async () => {
			if (this.isDeleting) return;
			this.isDeleting = true;
			deleteBtn.setAttribute('disabled', 'true');
			deleteBtn.textContent = '处理中...';

			try {
				await this.onConfirm();
				this.close();
			} catch (error) {
				console.error('删除操作失败:', error);
				new Notice('删除操作失败');
				this.isDeleting = false;
				deleteBtn.removeAttribute('disabled');
				deleteBtn.textContent = this.plugin.settings.useTrashFolder ? '移至隔离文件夹' : '删除';
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
}

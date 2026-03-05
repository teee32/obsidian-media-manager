import { Plugin, Editor, TFile, MarkdownView, Notice, Menu, MenuItem, setIcon } from 'obsidian';
import { ImageLibraryView, VIEW_TYPE_IMAGE_LIBRARY } from './view/ImageLibraryView';
import { UnreferencedImagesView, VIEW_TYPE_UNREFERENCED_IMAGES } from './view/UnreferencedImagesView';
import { ImageManagerSettings, DEFAULT_SETTINGS, SettingsTab } from './settings';

export default class ImageManagerPlugin extends Plugin {
	settings: ImageManagerSettings;

	async onload() {
		await this.loadSettings();

		// 加载样式
		this.addStyle();

		// 注册图片库视图
		this.registerView(VIEW_TYPE_IMAGE_LIBRARY, (leaf) => new ImageLibraryView(leaf, this));

		// 注册未引用图片视图
		this.registerView(VIEW_TYPE_UNREFERENCED_IMAGES, (leaf) => new UnreferencedImagesView(leaf, this));

		// 添加命令面板命令
		this.addCommand({
			id: 'open-image-library',
			name: '图片库',
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				this.openImageLibrary();
			}
		});

		this.addCommand({
			id: 'find-unreferenced-images',
			name: '查找未引用图片',
			checkCallback: (checking: boolean) => {
				if (checking) return true;
				this.findUnreferencedImages();
			}
		});

		// 添加设置标签页
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_IMAGE_LIBRARY);
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_UNREFERENCED_IMAGES);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async openImageLibrary() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_IMAGE_LIBRARY)[0];
		if (!leaf) {
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({
				type: VIEW_TYPE_IMAGE_LIBRARY,
				active: true
			});
		}
		workspace.revealLeaf(leaf);
	}

	async findUnreferencedImages() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType(VIEW_TYPE_UNREFERENCED_IMAGES)[0];
		if (!leaf) {
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({
				type: VIEW_TYPE_UNREFERENCED_IMAGES,
				active: true
			});
		}
		workspace.revealLeaf(leaf);
	}

	// 获取所有图片文件
	async getAllImageFiles(): Promise<TFile[]> {
		const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];
		const allFiles = this.app.vault.getFiles();
		return allFiles.filter(file =>
			imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
		);
	}

	// 获取所有Markdown文件中引用的图片
	async getReferencedImages(): Promise<Set<string>> {
		const referenced = new Set<string>();
		const markdownFiles = this.app.vault.getFiles().filter(f => f.extension === 'md');

		for (const file of markdownFiles) {
			const content = await this.app.vault.read(file);
			// 匹配 [[文件名]] 或 ![](链接) 格式
			const wikiLinkPattern = /\[\[([^\]|]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))\]\]/gi;
			const markdownLinkPattern = /!\[.*?\]\(([^)]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))\)/gi;

			let match;
			while ((match = wikiLinkPattern.exec(content)) !== null) {
				referenced.add(match[1].toLowerCase());
			}
			while ((match = markdownLinkPattern.exec(content)) !== null) {
				const url = match[1];
				// 只处理相对路径或仓库内图片
				if (!url.startsWith('http')) {
					const filename = url.split('/').pop()?.toLowerCase() || '';
					referenced.add(filename);
				}
			}
		}

		return referenced;
	}

	// 查找未引用的图片
	async findUnreferenced(): Promise<TFile[]> {
		const allImages = await this.getAllImageFiles();
		const referenced = await this.getReferencedImages();

		return allImages.filter(file => {
			return !referenced.has(file.name.toLowerCase());
		});
	}

	// 打开图片所在的笔记
	async openImageInNotes(imageFile: TFile) {
		const markdownFiles = this.app.vault.getFiles().filter(f => f.extension === 'md');
		const results: { file: TFile; line: number }[] = [];

		for (const file of markdownFiles) {
			const content = await this.app.vault.read(file);
			const lines = content.split('\n');

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (line.includes(imageFile.name)) {
					results.push({ file, line: i + 1 });
				}
			}
		}

		if (results.length > 0) {
			const file = results[0].file;
			const line = results[0].line;
			this.app.workspace.openLinkText(file.name, file.path, true);
		} else {
			new Notice('该图片未被任何笔记引用');
		}
	}
}

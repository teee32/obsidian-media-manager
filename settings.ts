import { App, PluginSettingTab, Setting, DropdownComponent } from 'obsidian';
import ImageManagerPlugin from './main';

export interface ImageManagerSettings {
	imageFolder: string;
	thumbnailSize: 'small' | 'medium' | 'large';
	showImageInfo: boolean;
	sortBy: 'name' | 'date' | 'size';
	sortOrder: 'asc' | 'desc';
	autoRefresh: boolean;
	defaultAlignment: 'left' | 'center' | 'right';
	useTrashFolder: boolean;
	trashFolder: string;
	autoCleanupTrash: boolean;
	trashCleanupDays: number;
	// 新增设置
	enableImages: boolean;
	enableVideos: boolean;
	enableAudio: boolean;
	enablePDF: boolean;
	pageSize: number;
	enablePreviewModal: boolean;
	enableKeyboardNav: boolean;
}

export const DEFAULT_SETTINGS: ImageManagerSettings = {
	imageFolder: '',
	thumbnailSize: 'medium',
	showImageInfo: true,
	sortBy: 'name',
	sortOrder: 'asc',
	autoRefresh: true,
	defaultAlignment: 'center',
	useTrashFolder: true,
	trashFolder: '.obsidian-media-manager-trash',
	autoCleanupTrash: false,
	trashCleanupDays: 30,
	// 新增默认值
	enableImages: true,
	enableVideos: true,
	enableAudio: true,
	enablePDF: true,
	pageSize: 50,
	enablePreviewModal: true,
	enableKeyboardNav: true
};

export class SettingsTab extends PluginSettingTab {
	plugin: ImageManagerPlugin;

	constructor(app: App, plugin: ImageManagerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: '媒体管理插件设置' });

		// 媒体文件夹设置
		new Setting(containerEl)
			.setName('媒体文件夹')
			.setDesc('指定要扫描的媒体文件夹路径（留空则扫描整个库）')
			.addText(text => text
				.setPlaceholder('例如: attachments/media')
				.setValue(this.plugin.settings.imageFolder)
				.onChange(async (value) => {
					this.plugin.settings.imageFolder = value;
					await this.plugin.saveSettings();
				}));

		// 缩略图大小
		new Setting(containerEl)
			.setName('缩略图大小')
			.setDesc('选择媒体库视图中缩略图的显示大小')
			.addDropdown(dropdown => dropdown
				.addOption('small', '小 (100px)')
				.addOption('medium', '中 (150px)')
				.addOption('large', '大 (200px)')
				.setValue(this.plugin.settings.thumbnailSize)
				.onChange(async (value: string) => {
					this.plugin.settings.thumbnailSize = value as 'small' | 'medium' | 'large';
					await this.plugin.saveSettings();
				}));

		// 排序方式
		new Setting(containerEl)
			.setName('默认排序方式')
			.setDesc('选择图片的默认排序方式')
			.addDropdown(dropdown => dropdown
				.addOption('name', '按名称')
				.addOption('date', '按修改日期')
				.addOption('size', '按文件大小')
				.setValue(this.plugin.settings.sortBy)
				.onChange(async (value: string) => {
					this.plugin.settings.sortBy = value as 'name' | 'date' | 'size';
					await this.plugin.saveSettings();
				}));

		// 排序顺序
		new Setting(containerEl)
			.setName('排序顺序')
			.setDesc('选择升序或降序')
			.addDropdown(dropdown => dropdown
				.addOption('asc', '升序')
				.addOption('desc', '降序')
				.setValue(this.plugin.settings.sortOrder)
				.onChange(async (value: string) => {
					this.plugin.settings.sortOrder = value as 'asc' | 'desc';
					await this.plugin.saveSettings();
				}));

		// 显示图片信息
		new Setting(containerEl)
			.setName('显示图片信息')
			.setDesc('在图片缩略图下方显示文件名和大小')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showImageInfo)
				.onChange(async (value) => {
					this.plugin.settings.showImageInfo = value;
					await this.plugin.saveSettings();
				}));

		// 自动刷新
		new Setting(containerEl)
			.setName('自动刷新')
			.setDesc('当库中的图片发生变化时自动刷新视图')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoRefresh)
				.onChange(async (value) => {
					this.plugin.settings.autoRefresh = value;
					await this.plugin.saveSettings();
				}));

		// 默认对齐方式
		new Setting(containerEl)
			.setName('默认图片对齐方式')
			.setDesc('插入图片时的默认对齐方式')
			.addDropdown(dropdown => dropdown
				.addOption('left', '居左')
				.addOption('center', '居中')
				.addOption('right', '居右')
				.setValue(this.plugin.settings.defaultAlignment)
				.onChange(async (value: string) => {
					this.plugin.settings.defaultAlignment = value as 'left' | 'center' | 'right';
					await this.plugin.saveSettings();
				}));

		// 分隔线
		containerEl.createEl('hr', { cls: 'settings-divider' });

		// 安全删除设置
		containerEl.createEl('h3', { text: '安全删除设置' });

		// 使用隔离文件夹
		new Setting(containerEl)
			.setName('使用隔离文件夹')
			.setDesc('删除文件时先移入隔离文件夹，而不是直接删除')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useTrashFolder)
				.onChange(async (value) => {
					this.plugin.settings.useTrashFolder = value;
					await this.plugin.saveSettings();
				}));

		// 隔离文件夹路径
		new Setting(containerEl)
			.setName('隔离文件夹')
			.setDesc('隔离文件夹的路径（相对路径）')
			.addText(text => text
				.setPlaceholder('.obsidian-media-manager-trash')
				.setValue(this.plugin.settings.trashFolder)
				.onChange(async (value) => {
					this.plugin.settings.trashFolder = value;
					await this.plugin.saveSettings();
				}));

		// 自动清理隔离文件夹
		new Setting(containerEl)
			.setName('自动清理隔离文件夹')
			.setDesc('自动清理隔离文件夹中的旧文件')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoCleanupTrash)
				.onChange(async (value) => {
					this.plugin.settings.autoCleanupTrash = value;
					await this.plugin.saveSettings();
				}));

		// 清理天数
		new Setting(containerEl)
			.setName('清理天数')
			.setDesc('隔离文件夹中的文件超过此天数后将自动删除')
			.addText(text => text
				.setPlaceholder('30')
				.setValue(String(this.plugin.settings.trashCleanupDays))
				.onChange(async (value) => {
					const days = parseInt(value, 10);
					if (!isNaN(days) && days > 0) {
						this.plugin.settings.trashCleanupDays = days;
						await this.plugin.saveSettings();
					}
				}));

		// 分隔线
		containerEl.createEl('hr', { cls: 'settings-divider' });

		// 媒体类型过滤
		containerEl.createEl('h3', { text: '媒体类型' });

		new Setting(containerEl)
			.setName('启用图片支持')
			.setDesc('在媒体库中显示图片文件 (png, jpg, gif, webp, svg, bmp)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableImages)
				.onChange(async (value) => {
					this.plugin.settings.enableImages = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('启用视频支持')
			.setDesc('在媒体库中显示视频文件 (mp4, mov, avi, mkv, webm)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableVideos)
				.onChange(async (value) => {
					this.plugin.settings.enableVideos = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('启用音频支持')
			.setDesc('在媒体库中显示音频文件 (mp3, wav, ogg, m4a, flac)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableAudio)
				.onChange(async (value) => {
					this.plugin.settings.enableAudio = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('启用 PDF 支持')
			.setDesc('在媒体库中显示 PDF 文件')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enablePDF)
				.onChange(async (value) => {
					this.plugin.settings.enablePDF = value;
					await this.plugin.saveSettings();
				}));

		// 分隔线
		containerEl.createEl('hr', { cls: 'settings-divider' });

		// 视图设置
		containerEl.createEl('h3', { text: '视图设置' });

		new Setting(containerEl)
			.setName('分页大小')
			.setDesc('媒体库中每页显示的文件数量')
			.addText(text => text
				.setPlaceholder('50')
				.setValue(String(this.plugin.settings.pageSize))
				.onChange(async (value) => {
					const size = parseInt(value, 10);
					if (!isNaN(size) && size > 0) {
						this.plugin.settings.pageSize = size;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('启用预览 Modal')
			.setDesc('点击媒体文件时打开预览窗口')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enablePreviewModal)
				.onChange(async (value) => {
					this.plugin.settings.enablePreviewModal = value;
					await this.plugin.saveSettings();
				}));

		// 分隔线
		containerEl.createEl('hr', { cls: 'settings-divider' });

		// 帮助信息
		containerEl.createEl('h3', { text: '快捷键' });
		containerEl.createEl('p', {
			text: '插件支持的快捷键：',
			cls: 'settings-description'
		});
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: 'Ctrl+Shift+M - 打开媒体库' });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: 'Ctrl+Shift+U - 查找未引用媒体' });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: 'Ctrl+Shift+T - 打开隔离文件管理' });

		containerEl.createEl('h3', { text: '快捷命令' });
		containerEl.createEl('p', {
			text: '在命令面板中使用以下命令：',
			cls: 'settings-description'
		});
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: '媒体库 - 打开媒体库视图' });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: '查找未引用媒体 - 查找未被任何笔记引用的媒体文件' });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: '隔离文件管理 - 管理已删除的文件' });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: '图片居左对齐 - 将选中图片居左对齐' });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: '图片居中对齐 - 将选中图片居中对齐' });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: '图片居右对齐 - 将选中图片居右对齐' });
	}
}

import { App, PluginSettingTab, Setting, DropdownComponent } from 'obsidian';
import ImageManagerPlugin from './main';
import { Translations } from './utils/i18n';

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
	// 国际化设置
	language: 'zh' | 'en' | 'system';
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
	trashFolder: '.obsidian-media-toolkit-trash',
	autoCleanupTrash: false,
	trashCleanupDays: 30,
	// 新增默认值
	enableImages: true,
	enableVideos: true,
	enableAudio: true,
	enablePDF: true,
	pageSize: 50,
	enablePreviewModal: true,
	enableKeyboardNav: true,
	// 国际化设置
	language: 'system'
};

export class SettingsTab extends PluginSettingTab {
	plugin: ImageManagerPlugin;

	constructor(app: App, plugin: ImageManagerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// 翻译辅助方法
	private t(key: keyof Translations): string {
		return this.plugin.t(key);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// 使用翻译
		containerEl.createEl('h2', { text: this.t('pluginSettings') });

		// 媒体文件夹设置
		new Setting(containerEl)
			.setName(this.t('mediaFolder'))
			.setDesc(this.t('mediaFolderDesc'))
			.addText(text => text
				.setPlaceholder('attachments/media')
				.setValue(this.plugin.settings.imageFolder)
				.onChange(async (value) => {
					this.plugin.settings.imageFolder = value;
					await this.plugin.saveSettings();
				}));

		// 缩略图大小
		new Setting(containerEl)
			.setName(this.t('thumbnailSize'))
			.setDesc(this.t('thumbnailSizeDesc'))
			.addDropdown(dropdown => dropdown
				.addOption('small', this.t('thumbnailSmall'))
				.addOption('medium', this.t('thumbnailMedium'))
				.addOption('large', this.t('thumbnailLarge'))
				.setValue(this.plugin.settings.thumbnailSize)
				.onChange(async (value: string) => {
					this.plugin.settings.thumbnailSize = value as 'small' | 'medium' | 'large';
					await this.plugin.saveSettings();
				}));

		// 排序方式
		new Setting(containerEl)
			.setName(this.t('defaultSortBy'))
			.setDesc(this.t('sortByDesc'))
			.addDropdown(dropdown => dropdown
				.addOption('name', this.t('sortByName'))
				.addOption('date', this.t('sortByDate'))
				.addOption('size', this.t('sortBySize'))
				.setValue(this.plugin.settings.sortBy)
				.onChange(async (value: string) => {
					this.plugin.settings.sortBy = value as 'name' | 'date' | 'size';
					await this.plugin.saveSettings();
				}));

		// 排序顺序
		new Setting(containerEl)
			.setName(this.t('sortOrder'))
			.setDesc(this.t('sortOrderDesc'))
			.addDropdown(dropdown => dropdown
				.addOption('asc', this.t('sortAsc'))
				.addOption('desc', this.t('sortDesc'))
				.setValue(this.plugin.settings.sortOrder)
				.onChange(async (value: string) => {
					this.plugin.settings.sortOrder = value as 'asc' | 'desc';
					await this.plugin.saveSettings();
				}));

		// 显示图片信息
		new Setting(containerEl)
			.setName(this.t('showImageInfo'))
			.setDesc(this.t('showImageInfoDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showImageInfo)
				.onChange(async (value) => {
					this.plugin.settings.showImageInfo = value;
					await this.plugin.saveSettings();
				}));

		// 自动刷新
		new Setting(containerEl)
			.setName(this.t('autoRefresh'))
			.setDesc(this.t('autoRefreshDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoRefresh)
				.onChange(async (value) => {
					this.plugin.settings.autoRefresh = value;
					await this.plugin.saveSettings();
				}));

		// 默认对齐方式
		new Setting(containerEl)
			.setName(this.t('defaultAlignment'))
			.setDesc(this.t('alignmentDesc'))
			.addDropdown(dropdown => dropdown
				.addOption('left', this.t('alignLeft'))
				.addOption('center', this.t('alignCenter'))
				.addOption('right', this.t('alignRight'))
				.setValue(this.plugin.settings.defaultAlignment)
				.onChange(async (value: string) => {
					this.plugin.settings.defaultAlignment = value as 'left' | 'center' | 'right';
					await this.plugin.saveSettings();
				}));

		// 分隔线
		containerEl.createEl('hr', { cls: 'settings-divider' });

		// 安全删除设置
		containerEl.createEl('h3', { text: this.t('safeDeleteSettings') });

		// 使用隔离文件夹
		new Setting(containerEl)
			.setName(this.t('useTrashFolder'))
			.setDesc(this.t('useTrashFolderDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useTrashFolder)
				.onChange(async (value) => {
					this.plugin.settings.useTrashFolder = value;
					await this.plugin.saveSettings();
				}));

		// 隔离文件夹路径
		new Setting(containerEl)
			.setName(this.t('trashFolderPath'))
			.setDesc(this.t('trashFolderPathDesc'))
			.addText(text => text
				.setPlaceholder('.obsidian-media-toolkit-trash')
				.setValue(this.plugin.settings.trashFolder)
				.onChange(async (value) => {
					this.plugin.settings.trashFolder = value;
					await this.plugin.saveSettings();
				}));

		// 自动清理隔离文件夹
		new Setting(containerEl)
			.setName(this.t('autoCleanupTrash'))
			.setDesc(this.t('autoCleanupTrashDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoCleanupTrash)
				.onChange(async (value) => {
					this.plugin.settings.autoCleanupTrash = value;
					await this.plugin.saveSettings();
				}));

		// 清理天数
		new Setting(containerEl)
			.setName(this.t('cleanupDays'))
			.setDesc(this.t('cleanupDaysDesc'))
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
		containerEl.createEl('h3', { text: this.t('mediaTypes') });

		new Setting(containerEl)
			.setName(this.t('enableImageSupport'))
			.setDesc(this.t('enableImageSupportDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableImages)
				.onChange(async (value) => {
					this.plugin.settings.enableImages = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.t('enableVideoSupport'))
			.setDesc(this.t('enableVideoSupportDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableVideos)
				.onChange(async (value) => {
					this.plugin.settings.enableVideos = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.t('enableAudioSupport'))
			.setDesc(this.t('enableAudioSupportDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableAudio)
				.onChange(async (value) => {
					this.plugin.settings.enableAudio = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.t('enablePDFSupport'))
			.setDesc(this.t('enablePDFSupportDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enablePDF)
				.onChange(async (value) => {
					this.plugin.settings.enablePDF = value;
					await this.plugin.saveSettings();
				}));

		// 分隔线
		containerEl.createEl('hr', { cls: 'settings-divider' });

		// 视图设置
		containerEl.createEl('h3', { text: this.t('viewSettings') });

		// 语言设置
		new Setting(containerEl)
			.setName(this.t('interfaceLanguage'))
			.setDesc(this.t('languageDesc'))
			.addDropdown(dropdown => dropdown
				.addOption('system', this.t('languageSystem'))
				.addOption('zh', '中文')
				.addOption('en', 'English')
				.setValue(this.plugin.settings.language)
				.onChange(async (value: string) => {
					this.plugin.settings.language = value as 'zh' | 'en' | 'system';
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.t('pageSize'))
			.setDesc(this.t('pageSizeDesc'))
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
			.setName(this.t('enablePreviewModal'))
			.setDesc(this.t('enablePreviewModalDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enablePreviewModal)
				.onChange(async (value) => {
					this.plugin.settings.enablePreviewModal = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.t('enableKeyboardNav'))
			.setDesc(this.t('enableKeyboardNavDesc'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableKeyboardNav)
				.onChange(async (value) => {
					this.plugin.settings.enableKeyboardNav = value;
					await this.plugin.saveSettings();
				}));

		// 分隔线
		containerEl.createEl('hr', { cls: 'settings-divider' });

		// 帮助信息
		containerEl.createEl('h3', { text: this.t('keyboardShortcuts') });
		containerEl.createEl('p', {
			text: this.t('shortcutsDesc'),
			cls: 'settings-description'
		});
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: this.t('shortcutOpenLibrary') });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: this.t('shortcutFindUnreferenced') });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: this.t('shortcutOpenTrash') });

		containerEl.createEl('h3', { text: this.t('commands') });
		containerEl.createEl('p', {
			text: this.t('commandsDesc'),
			cls: 'settings-description'
		});
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: this.t('cmdOpenLibrary') });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: this.t('cmdFindUnreferenced') });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: this.t('cmdTrashManagement') });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: this.t('cmdAlignLeft') });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: this.t('cmdAlignCenter') });
		containerEl.createEl('ul', { cls: 'settings-list' }).createEl('li', { text: this.t('cmdAlignRight') });
	}
}

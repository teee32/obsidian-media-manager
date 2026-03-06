import { App, PluginSettingTab } from 'obsidian';
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
    enableImages: boolean;
    enableVideos: boolean;
    enableAudio: boolean;
    enablePDF: boolean;
    pageSize: number;
    enablePreviewModal: boolean;
    enableKeyboardNav: boolean;
    language: 'zh' | 'en' | 'system';
}
export declare const DEFAULT_SETTINGS: ImageManagerSettings;
export declare class SettingsTab extends PluginSettingTab {
    plugin: ImageManagerPlugin;
    constructor(app: App, plugin: ImageManagerPlugin);
    private t;
    display(): void;
}
//# sourceMappingURL=settings.d.ts.map
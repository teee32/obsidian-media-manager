import { Plugin, Editor, TFile, Menu } from 'obsidian';
import { ImageManagerSettings } from './settings';
import { Language } from './utils/i18n';
export default class ImageManagerPlugin extends Plugin {
    settings: ImageManagerSettings;
    private referencedImagesCache;
    private cacheTimestamp;
    private static readonly CACHE_DURATION;
    /**
     * 获取当前语言设置
     */
    getCurrentLanguage(): Language;
    /**
     * 翻译函数
     */
    t(key: string, params?: Record<string, string | number>): string;
    onload(): Promise<void>;
    /**
     * 注册快捷键
     */
    registerKeyboardShortcuts(): void;
    /**
     * 打开隔离文件夹管理视图
     */
    openTrashManagement(): Promise<void>;
    /**
     * 打开媒体预览
     */
    openMediaPreview(file: TFile): void;
    onunload(): void;
    addStyle(): void;
    loadExternalStyles(): Promise<void>;
    addInlineStyle(): void;
    loadSettings(): Promise<void>;
    saveSettings(): Promise<void>;
    openImageLibrary(): Promise<void>;
    findUnreferencedImages(): Promise<void>;
    getAllImageFiles(): Promise<TFile[]>;
    getAllMediaFiles(): Promise<TFile[]>;
    getReferencedImages(): Promise<Set<string>>;
    findUnreferenced(): Promise<TFile[]>;
    openImageInNotes(imageFile: TFile): Promise<void>;
    alignSelectedImage(editor: Editor, alignment: 'left' | 'center' | 'right'): void;
    addAlignmentMenuItems(menu: Menu, editor: Editor): void;
    safeDeleteFile(file: TFile): Promise<boolean>;
    restoreFile(file: TFile, originalPath: string): Promise<boolean>;
    permanentlyDeleteFile(file: TFile): Promise<boolean>;
}
//# sourceMappingURL=main.d.ts.map
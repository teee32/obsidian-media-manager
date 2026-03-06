import { Modal, TFile } from 'obsidian';
import ImageManagerPlugin from '../main';
export declare class MediaPreviewModal extends Modal {
    plugin: ImageManagerPlugin;
    file: TFile;
    currentIndex: number;
    allFiles: TFile[];
    private keydownHandler;
    constructor(app: any, plugin: ImageManagerPlugin, file: TFile, allFiles?: TFile[]);
    onOpen(): void;
    /**
     * 渲染媒体
     */
    renderMedia(container: HTMLElement): void;
    /**
     * 渲染导航控件
     */
    renderNavigation(container: HTMLElement): void;
    /**
     * 渲染信息栏
     */
    renderInfoBar(contentEl: HTMLElement): void;
    /**
     * 注册键盘导航
     */
    registerKeyboardNav(): void;
    /**
     * 上一张
     */
    prev(): void;
    /**
     * 下一张
     */
    next(): void;
    /**
     * 更新内容
     */
    updateContent(): void;
    onClose(): void;
}
//# sourceMappingURL=MediaPreviewModal.d.ts.map
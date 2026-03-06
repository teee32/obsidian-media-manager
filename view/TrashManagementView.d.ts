import { TFile, View, WorkspaceLeaf } from 'obsidian';
import ImageManagerPlugin from '../main';
export declare const VIEW_TYPE_TRASH_MANAGEMENT = "trash-management-view";
interface TrashItem {
    file: TFile;
    path: string;
    name: string;
    size: number;
    modified: number;
    originalPath?: string;
}
export declare class TrashManagementView extends View {
    plugin: ImageManagerPlugin;
    trashItems: TrashItem[];
    private contentEl;
    private isLoading;
    constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin);
    getViewType(): string;
    getDisplayText(): string;
    onOpen(): Promise<void>;
    onClose(): Promise<void>;
    /**
     * 加载隔离文件夹中的文件
     */
    loadTrashItems(): Promise<void>;
    /**
     * 渲染视图
     */
    renderView(): Promise<void>;
    /**
     * 渲染头部
     */
    renderHeader(): void;
    /**
     * 渲染单个隔离文件项
     */
    renderTrashItem(container: HTMLElement, item: TrashItem): void;
    /**
     * 显示右键菜单
     */
    showContextMenu(event: MouseEvent, trashItem: TrashItem): void;
    /**
     * 恢复文件
     */
    restoreFile(item: TrashItem): Promise<void>;
    /**
     * 确认删除单个文件
     */
    confirmDelete(item: TrashItem): Promise<void>;
    /**
     * 确认清空所有文件
     */
    confirmClearAll(): Promise<void>;
    /**
     * 获取文件图标
     */
    private getFileIcon;
    /**
     * 格式化文件大小
     */
    formatFileSize(bytes: number): string;
}
export {};
//# sourceMappingURL=TrashManagementView.d.ts.map
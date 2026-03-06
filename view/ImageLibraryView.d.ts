import { TFile, View, WorkspaceLeaf } from 'obsidian';
import ImageManagerPlugin from '../main';
export declare const VIEW_TYPE_IMAGE_LIBRARY = "image-library-view";
interface ImageItem {
    file: TFile;
    path: string;
    name: string;
    size: number;
    modified: number;
    dimensions?: {
        width: number;
        height: number;
    };
}
export declare class ImageLibraryView extends View {
    plugin: ImageManagerPlugin;
    images: ImageItem[];
    filteredImages: ImageItem[];
    private contentEl;
    private searchQuery;
    private currentPage;
    private pageSize;
    private selectedFiles;
    private isSelectionMode;
    constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin);
    getViewType(): string;
    getDisplayText(): string;
    onOpen(): Promise<void>;
    onClose(): Promise<void>;
    refreshImages(): Promise<void>;
    /**
     * 应用搜索过滤
     */
    applySearch(): void;
    /**
     * 渲染搜索框
     */
    renderSearchBox(): void;
    /**
     * 渲染选择模式工具栏
     */
    renderSelectionToolbar(): void;
    /**
     * 渲染分页控件
     */
    renderPagination(): void;
    /**
     * 删除选中的文件
     */
    deleteSelected(): Promise<void>;
    renderHeader(): void;
    sortImages(): void;
    renderImageItem(container: HTMLElement, image: ImageItem): void;
    showContextMenu(event: MouseEvent, file: TFile): void;
    formatFileSize(bytes: number): string;
}
export {};
//# sourceMappingURL=ImageLibraryView.d.ts.map
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
    private contentEl;
    constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin);
    getViewType(): string;
    getDisplayText(): string;
    onOpen(): Promise<void>;
    onClose(): Promise<void>;
    refreshImages(): Promise<void>;
    renderHeader(): void;
    sortImages(): void;
    renderImageItem(container: HTMLElement, image: ImageItem): void;
    showContextMenu(event: MouseEvent, file: TFile): void;
    formatFileSize(bytes: number): string;
}
export {};
//# sourceMappingURL=ImageLibraryView.d.ts.map
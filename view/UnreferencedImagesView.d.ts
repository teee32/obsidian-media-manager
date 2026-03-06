import { TFile, View, WorkspaceLeaf } from 'obsidian';
import ImageManagerPlugin from '../main';
export declare const VIEW_TYPE_UNREFERENCED_IMAGES = "unreferenced-images-view";
interface UnreferencedImage {
    file: TFile;
    path: string;
    name: string;
    size: number;
    modified: number;
}
export declare class UnreferencedImagesView extends View {
    plugin: ImageManagerPlugin;
    unreferencedImages: UnreferencedImage[];
    private contentEl;
    private isScanning;
    constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin);
    getViewType(): string;
    getDisplayText(): string;
    onOpen(): Promise<void>;
    onClose(): Promise<void>;
    scanUnreferencedImages(): Promise<void>;
    renderView(): Promise<void>;
    renderHeader(): void;
    renderImageItem(container: HTMLElement, image: UnreferencedImage): void;
    showContextMenu(event: MouseEvent, file: TFile): void;
    confirmDelete(image: UnreferencedImage): Promise<void>;
    confirmDeleteAll(): Promise<void>;
    copyAllPaths(): void;
    formatFileSize(bytes: number): string;
}
export {};
//# sourceMappingURL=UnreferencedImagesView.d.ts.map
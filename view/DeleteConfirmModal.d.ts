import { Modal, TFile } from 'obsidian';
import ImageManagerPlugin from '../main';
interface UnreferencedImage {
    file: TFile;
    path: string;
    name: string;
    size: number;
    modified: number;
}
export declare class DeleteConfirmModal extends Modal {
    plugin: ImageManagerPlugin;
    images: UnreferencedImage[];
    onConfirm: () => Promise<void>;
    private isDeleting;
    constructor(app: any, plugin: ImageManagerPlugin, images: UnreferencedImage[], onConfirm: () => Promise<void>);
    onOpen(): void;
    onClose(): void;
    formatFileSize(bytes: number): string;
}
export {};
//# sourceMappingURL=DeleteConfirmModal.d.ts.map
import { Plugin, Editor, TFile, Menu } from 'obsidian';
import { ImageManagerSettings } from './settings';
export default class ImageManagerPlugin extends Plugin {
    settings: ImageManagerSettings;
    onload(): Promise<void>;
    onunload(): void;
    addStyle(): void;
    loadSettings(): Promise<void>;
    saveSettings(): Promise<void>;
    openImageLibrary(): Promise<void>;
    findUnreferencedImages(): Promise<void>;
    getAllImageFiles(): Promise<TFile[]>;
    getReferencedImages(): Promise<Set<string>>;
    findUnreferenced(): Promise<TFile[]>;
    openImageInNotes(imageFile: TFile): Promise<void>;
    alignSelectedImage(editor: Editor, alignment: 'left' | 'center' | 'right'): void;
    addAlignmentMenuItems(menu: Menu, editor: Editor): void;
}
//# sourceMappingURL=main.d.ts.map
# Obsidian 图片管理插件架构设计

## 1. 插件整体架构

### 1.1 项目结构

```
obsidian-image-manager/
├── manifest.json              # 插件清单文件
├── package.json               # NPM 包配置
├── tsconfig.json              # TypeScript 配置
├── src/
│   ├── main.ts                # 插件入口文件
│   ├── manifest.ts             # 插件清单类型定义
│   ├── types/
│   │   └── index.ts            # 全局类型定义
│   ├── core/
│   │   ├── ImageService.ts    # 图片核心服务
│   │   ├── MetadataStore.ts   # 元数据存储管理
│   │   ├── FileManager.ts     # 文件操作管理
│   │   └── ImageProcessor.ts  # 图片处理引擎
│   ├── ui/
│   │   ├── ImageManagerView.ts    # 主视图（侧边栏）
│   │   ├── GalleryView.ts         # 画廊视图
│   │   ├── ImageGrid.ts           # 图片网格组件
│   │   ├── ImageCard.ts           # 单个图片卡片
│   │   ├── FolderTree.ts         # 文件夹树组件
│   │   ├── ImageModal.ts          # 图片详情模态框
│   │   ├── Toolbar.ts             # 工具栏组件
│   │   └── settings/
│   │       └── settingsTab.ts      # 设置面板
│   ├── commands/
│   │   └── ImageCommands.ts       # 命令面板命令
│   ├── hooks/
│   │   └── useImageManager.ts     # React 风格钩子（可选）
│   └── utils/
│       ├── constants.ts           # 常量定义
│       ├── helpers.ts             # 工具函数
│       └── logger.ts              # 日志工具
├── styles.css                 # 全局样式
├── styles/
│   ├── gallery.css            # 画廊视图样式
│   ├── modal.css              # 模态框样式
│   └── components.css         # 组件样式
├── resources/
│   └── icon.svg               # 插件图标
└── README.md                  # 插件说明
```

### 1.2 manifest.json 设计

```json
{
  "id": "image-manager",
  "name": "Image Manager",
  "version": "1.0.0",
  "description": "强大的图片与媒体资产管理插件 - 支持对齐、分类、标签和快速插入",
  "author": "Your Name",
  "authorUrl": "https://github.com/yourname",
  "fundingUrl": "https://github.com/sponsors/yourname",
  "license": "MIT",
  "homepage": "https://github.com/yourname/obsidian-image-manager",
  "minAppVersion": "0.15.0",
  "targetAppVersion": "1.0.0",
  "isDesktopOnly": false,
  "hasStyles": true,
  "permissions": [
    "filesystem",
    "shell:open"
  ]
}
```

### 1.3 main.ts 入口设计

```typescript
import { Plugin, TAbstractFile, TFile, TFolder, Notice, Menu, MenuItem } from 'obsidian';
import { ImageService } from './core/ImageService';
import { MetadataStore } from './core/MetadataStore';
import { FileManager } from './core/FileManager';
import { ImageProcessor } from './core/ImageProcessor';
import { ImageManagerView } from './ui/ImageManagerView';
import { ImageCommands } from './commands/ImageCommands';
import { SettingsTab } from './ui/settings/settingsTab';
import { IMAGE_MANAGER_VIEW_TYPE } from './types';

export default class ImageManagerPlugin extends Plugin {
  // 核心服务实例
  public imageService!: ImageService;
  public metadataStore!: MetadataStore;
  public fileManager!: FileManager;
  public imageProcessor!: ImageProcessor;

  // UI 组件
  private imageManagerView: ImageManagerView | null = null;
  private settingsTab!: SettingsTab;

  // 插件设置
  public settings: ImageManagerSettings;

  async onload() {
    console.log('[Image Manager] 插件加载中...');

    // 1. 加载设置
    await this.loadSettings();

    // 2. 初始化核心服务
    this.initializeServices();

    // 3. 注册视图
    this.registerViews();

    // 4. 注册命令
    this.registerCommands();

    // 5. 注册事件监听
    this.registerEventListeners();

    // 6. 添加设置面板
    this.addSettingTab(this.settingsTab = new SettingsTab(this.app, this));

    // 7. 添加ribbon图标
    this.addRibbonIcon('image', '图片管理', () => {
      this.toggleView();
    });

    console.log('[Image Manager] 插件加载完成');
  }

  onunload() {
    console.log('[Image Manager] 插件卸载中...');
    this.metadataStore?.save();
  }

  private initializeServices() {
    this.metadataStore = new MetadataStore(this);
    this.fileManager = new FileManager(this);
    this.imageProcessor = new ImageProcessor(this);
    this.imageService = new ImageService(this);

    // 初始化元数据存储
    this.metadataStore.load();
  }

  private registerViews() {
    this.registerView(
      IMAGE_MANAGER_VIEW_TYPE,
      (leaf) => (this.imageManagerView = new ImageManagerView(leaf, this))
    );
  }

  private registerCommands() {
    new ImageCommands(this).register();
  }

  private registerEventListeners() {
    // 文件创建事件
    this.registerEvent(this.app.vault.on('create', (file) => {
      if (this.isImageFile(file)) {
        this.imageService.onImageCreated(file as TFile);
      }
    }));

    // 文件删除事件
    this.registerEvent(this.app.vault.on('delete', (file) => {
      if (this.isImageFile(file)) {
        this.imageService.onImageDeleted(file.path);
      }
    }));

    // 文件重命名事件
    this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
      if (this.isImageFile(file)) {
        this.imageService.onImageRenamed(file as TFile, oldPath);
      }
    }));

    // 快捷菜单
    this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
      if (this.isImageFile(file)) {
        this.addImageContextMenu(menu, file as TFile);
      }
    }));
  }

  private isImageFile(file: TAbstractFile): boolean {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
    return file instanceof TFile &&
           imageExtensions.includes(file.extension.toLowerCase());
  }

  private addImageContextMenu(menu: Menu, file: TFile) {
    menu.addItem((item: MenuItem) => {
      item.setTitle('插入图片（居中）')
          .setIcon('image')
          .onClick(() => this.imageService.insertImage(file, 'center'));
    });

    menu.addItem((item: MenuItem) => {
      item.setTitle('标记为收藏')
          .setIcon('star')
          .onClick(() => this.imageService.toggleFavorite(file.path));
    });
  }

  async toggleView() {
    const { workspace } = this.app;
    const existing = workspace.getLeavesOfView(IMAGE_MANAGER_VIEW_TYPE);

    if (existing.length) {
      workspace.detachLeavesOfView(IMAGE_MANAGER_VIEW_TYPE);
    } else {
      await workspace.getLeftLeaf(false).setView(IMAGE_MANAGER_VIEW_TYPE);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

---

## 2. 核心功能模块划分

### 2.1 模块架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      ImageManagerPlugin                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  ImageService   │  │  FileManager    │  │ MetadataStore  │  │
│  │   (核心服务)      │  │   (文件操作)     │  │   (元数据存储)   │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │            │
│  ┌────────┴────────────────────┴────────────────────┴────────┐  │
│  │                     ImageProcessor                          │  │
│  │                      (图片处理引擎)                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                         UI Layer                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐   │
│  │  View    │  │ Gallery  │  │  Modal   │  │  Settings Tab  │   │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 模块职责

#### 2.2.1 ImageService（核心服务）

```typescript
// src/core/ImageService.ts
import { TFile, Notice, Clipboard } from 'obsidian';

export class ImageService {
  constructor(private plugin: ImageManagerPlugin) {}

  /**
   * 获取所有图片文件
   */
  async getAllImages(): Promise<ImageItem[]> {
    return this.plugin.metadataStore.getAllImages();
  }

  /**
   * 获取指定文件夹下的图片
   */
  async getImagesInFolder(folderPath: string): Promise<ImageItem[]> {
    return this.plugin.metadataStore.getImagesByFolder(folderPath);
  }

  /**
   * 搜索图片
   */
  async searchImages(query: string): Promise<ImageItem[]> {
    return this.plugin.metadataStore.searchImages(query);
  }

  /**
   * 插入图片到当前笔记
   */
  async insertImage(file: TFile, alignment: AlignmentType = 'none'): Promise<void> {
    const { app, settings } = this.plugin;
    const activeFile = app.workspace.getActiveFile();

    if (!activeFile) {
      new Notice('请先打开一个笔记文件');
      return;
    }

    const imagePath = app.vault.getResourcePath(file.path);
    let markdown = `![${file.basename}](${imagePath})`;

    // 根据对齐方式添加样式
    if (alignment !== 'none') {
      markdown = `<div align="${alignment}">\n${markdown}\n</div>`;
    }

    // 插入到编辑器
    const editor = app.workspace.activeEditor?.editor;
    if (editor) {
      const cursor = editor.getCursor();
      editor.replaceRange(markdown, cursor);
    }
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(imagePath: string): Promise<void> {
    const image = this.plugin.metadataStore.getImage(imagePath);
    if (image) {
      image.isFavorite = !image.isFavorite;
      image.updatedAt = Date.now();
      await this.plugin.metadataStore.saveImage(image);
      new Notice(image.isFavorite ? '已添加到收藏' : '已从收藏移除');
    }
  }

  /**
   * 添加标签
   */
  async addTag(imagePath: string, tag: string): Promise<void> {
    const image = this.plugin.metadataStore.getImage(imagePath);
    if (image) {
      if (!image.tags) image.tags = [];
      if (!image.tags.includes(tag)) {
        image.tags.push(tag);
        image.updatedAt = Date.now();
        await this.plugin.metadataStore.saveImage(image);
      }
    }
  }

  /**
   * 批量操作
   */
  async batchOperation(
    images: string[],
    operation: 'move' | 'copy' | 'delete' | 'tag',
    params?: any
  ): Promise<void> {
    for (const imagePath of images) {
      switch (operation) {
        case 'move':
          await this.plugin.fileManager.moveFile(imagePath, params.targetFolder);
          break;
        case 'delete':
          await this.plugin.fileManager.deleteFile(imagePath);
          break;
        case 'tag':
          await this.addTag(imagePath, params.tag);
          break;
      }
    }
  }

  /**
   * 导出图片
   */
  async exportImages(images: string[], targetFolder: string): Promise<void> {
    for (const imagePath of images) {
      await this.plugin.fileManager.copyFile(imagePath, targetFolder);
    }
    new Notice(`已导出 ${images.length} 张图片`);
  }
}
```

#### 2.2.2 MetadataStore（元数据存储）

```typescript
// src/core/MetadataStore.ts
import { TFile, TFolder, CachedMetadata } from 'obsidian';

export class MetadataStore {
  private images: Map<string, ImageItem> = new Map();
  private index: ImageIndex = { byFolder: {}, byTag: {}, byDate: {} };

  constructor(private plugin: ImageManagerPlugin) {}

  /**
   * 从 vault 扫描并构建图片索引
   */
  async scanVault(): Promise<void> {
    const { app, settings } = this.plugin;
    const root = app.vault.getRoot();

    await this.scanFolder(root);
    this.rebuildIndex();
  }

  private async scanFolder(folder: TFolder): Promise<void> {
    const { app, settings } = this.plugin;
    const children = folder.children;

    for (const child of children) {
      if (child instanceof TFile) {
        if (this.isImageFile(child)) {
          await this.addImage(child);
        }
      } else if (child instanceof TFolder) {
        // 递归扫描子文件夹
        if (!this.shouldIgnoreFolder(child.path)) {
          await this.scanFolder(child);
        }
      }
    }
  }

  private isImageFile(file: TFile): boolean {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
    return imageExtensions.includes(file.extension.toLowerCase());
  }

  private shouldIgnoreFolder(path: string): boolean {
    const ignoreFolders = ['.git', '.obsidian', 'node_modules', '.trash'];
    return ignoreFolders.some(ignored => path.includes(`/${ignored}/`) || path === ignored);
  }

  private async addImage(file: TFile): Promise<void> {
    const stats = await file.stat();

    const imageItem: ImageItem = {
      id: this.generateId(),
      path: file.path,
      name: file.name,
      folder: file.parent?.path || '/',
      extension: file.extension,
      size: stats.size,
      createdAt: stats.created,
      modifiedAt: stats.mtime,
      updatedAt: Date.now(),
      width: 0,  // 延迟加载
      height: 0,
      tags: [],
      isFavorite: false,
      description: '',
      linkedNotes: []
    };

    this.images.set(file.path, imageItem);
  }

  private rebuildIndex(): void {
    this.index = { byFolder: {}, byTag: {}, byDate: {} };

    for (const [path, image] of this.images) {
      // 按文件夹索引
      if (!this.index.byFolder[image.folder]) {
        this.index.byFolder[image.folder] = [];
      }
      this.index.byFolder[image.folder].push(path);

      // 按标签索引
      if (image.tags) {
        for (const tag of image.tags) {
          if (!this.index.byTag[tag]) {
            this.index.byTag[tag] = [];
          }
          this.index.byTag[tag].push(path);
        }
      }

      // 按日期索引 (年月)
      const dateKey = new Date(image.createdAt).toISOString().slice(0, 7);
      if (!this.index.byDate[dateKey]) {
        this.index.byDate[dateKey] = [];
      }
      this.index.byDate[dateKey].push(path);
    }
  }

  getAllImages(): ImageItem[] {
    return Array.from(this.images.values());
  }

  getImagesByFolder(folderPath: string): ImageItem[] {
    const paths = this.index.byFolder[folderPath] || [];
    return paths.map(p => this.images.get(p)).filter(Boolean);
  }

  getImagesByTag(tag: string): ImageItem[] {
    const paths = this.index.byTag[tag] || [];
    return paths.map(p => this.images.get(p)).filter(Boolean);
  }

  searchImages(query: string): ImageItem[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllImages().filter(img =>
      img.name.toLowerCase().includes(lowerQuery) ||
      img.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      img.description?.toLowerCase().includes(lowerQuery)
    );
  }

  getImage(path: string): ImageItem | undefined {
    return this.images.get(path);
  }

  async saveImage(image: ImageItem): Promise<void> {
    this.images.set(image.path, image);
    await this.save();
  }

  async deleteImage(path: string): Promise<void> {
    this.images.delete(path);
    await this.save();
  }

  async save(): Promise<void> {
    const data = {
      images: Array.from(this.images.entries()),
      version: CURRENT_VERSION
    };
    await this.plugin.saveData(data);
  }

  load(): void {
    const data = this.plugin.loadData();
    if (data && data.images) {
      this.images = new Map(data.images);
      this.rebuildIndex();
    } else {
      // 首次加载，执行扫描
      this.scanVault();
    }
  }

  private generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 2.2.3 FileManager（文件操作）

```typescript
// src/core/FileManager.ts
import { TFile, TFolder, Notice } from 'obsidian';

export class FileManager {
  constructor(private plugin: ImageManagerPlugin) {}

  /**
   * 移动文件到指定文件夹
   */
  async moveFile(sourcePath: string, targetFolder: string): Promise<boolean> {
    const { app } = this.plugin;
    const sourceFile = app.vault.getAbstractFileByPath(sourcePath);

    if (!sourceFile || !(sourceFile instanceof TFile)) {
      new Notice('源文件不存在');
      return false;
    }

    // 确保目标文件夹存在
    let targetFolderObj = app.vault.getAbstractFileByPath(targetFolder);
    if (!targetFolderObj) {
      await app.vault.createFolder(targetFolder);
      targetFolderObj = app.vault.getAbstractFileByPath(targetFolder);
    }

    try {
      await app.vault.rename(sourceFile, `${targetFolder}/${sourceFile.name}`);

      // 更新元数据
      await this.plugin.metadataStore.updateImagePath(sourcePath,
        `${targetFolder}/${sourceFile.name}`);

      new Notice(`已移动到 ${targetFolder}`);
      return true;
    } catch (error) {
      new Notice(`移动失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 复制文件
   */
  async copyFile(sourcePath: string, targetFolder: string): Promise<boolean> {
    const { app } = this.plugin;
    const sourceFile = app.vault.getAbstractFileByPath(sourcePath);

    if (!sourceFile || !(sourceFile instanceof TFile)) {
      return false;
    }

    const content = await app.vault.read(sourceFile as TFile);
    const targetPath = `${targetFolder}/${sourceFile.name}`;

    try {
      await app.vault.create(targetPath, content);
      return true;
    } catch (error) {
      console.error('[Image Manager] 复制文件失败:', error);
      return false;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath: string): Promise<boolean> {
    const { app } = this.plugin;
    const file = app.vault.getAbstractFileByPath(filePath);

    if (!file) {
      new Notice('文件不存在');
      return false;
    }

    try {
      await app.vault.delete(file);
      await this.plugin.metadataStore.deleteImage(filePath);
      new Notice('文件已删除');
      return true;
    } catch (error) {
      new Notice(`删除失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 创建新文件夹
   */
  async createFolder(path: string): Promise<boolean> {
    const { app } = this.plugin;

    try {
      await app.vault.createFolder(path);
      return true;
    } catch (error) {
      new Notice(`创建文件夹失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 重命名文件
   */
  async renameFile(oldPath: string, newName: string): Promise<boolean> {
    const { app } = this.plugin;
    const file = app.vault.getAbstractFileByPath(oldPath);

    if (!file) {
      new Notice('文件不存在');
      return false;
    }

    const folder = file.parent?.path || '';
    const newPath = folder === '' ? newName : `${folder}/${newName}`;

    try {
      await app.vault.rename(file, newPath);
      await this.plugin.metadataStore.updateImagePath(oldPath, newPath);
      new Notice(`已重命名为 ${newName}`);
      return true;
    } catch (error) {
      new Notice(`重命名失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取文件夹列表
   */
  getAllFolders(): string[] {
    const { app } = this.plugin;
    const folders: string[] = [];

    const traverse = (folder: TFolder) => {
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          folders.push(child.path);
          traverse(child);
        }
      }
    };

    traverse(app.vault.getRoot());
    return folders;
  }
}
```

#### 2.2.4 ImageProcessor（图片处理）

```typescript
// src/core/ImageProcessor.ts
import { TFile, ImageElement, CachedMetadata } from 'obsidian';

export class ImageProcessor {
  constructor(private plugin: ImageManagerPlugin) {}

  /**
   * 获取图片尺寸
   */
  async getImageDimensions(file: TFile): Promise<{ width: number; height: number }> {
    const { app } = this.plugin;
    const path = app.vault.getResourcePath(file.path);

    return new Promise((resolve, reject) => {
      const img = new ImageElement();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        img.remove();
      };
      img.onerror = () => reject(new Error('无法加载图片'));
      img.src = path;
    });
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(
    imagePath: string,
    maxSize: number = 200
  ): Promise<string> {
    // 使用浏览器原生 canvas 生成缩略图
    return new Promise((resolve, reject) => {
      const { app } = this.plugin;
      const src = app.vault.getResourcePath(imagePath);

      const img = new ImageElement();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('无法创建 canvas'));
          return;
        }

        // 计算缩放比例
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
        img.remove();
      };

      img.onerror = () => reject(new Error('加载图片失败'));
      img.src = src;
    });
  }

  /**
   * 图片格式化
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * 获取图片类型
   */
  getImageType(extension: string): ImageType {
    const types: Record<string, ImageType> = {
      'png': 'PNG',
      'jpg': 'JPEG',
      'jpeg': 'JPEG',
      'gif': 'GIF',
      'webp': 'WebP',
      'svg': 'SVG',
      'bmp': 'BMP',
      'tiff': 'TIFF'
    };
    return types[extension.toLowerCase()] || 'Unknown';
  }

  /**
   * 批量处理图片
   */
  async batchProcess(
    images: string[],
    processor: (image: ImageItem) => Promise<any>
  ): Promise<any[]> {
    const results = [];
    for (const imagePath of images) {
      const image = this.plugin.metadataStore.getImage(imagePath);
      if (image) {
        results.push(await processor(image));
      }
    }
    return results;
  }
}
```

---

## 3. 数据结构设计

### 3.1 类型定义

```typescript
// src/types/index.ts

// 对齐类型
export type AlignmentType = 'left' | 'center' | 'right' | 'none';

// 图片项目
export interface ImageItem {
  id: string;                    // 唯一标识符
  path: string;                  // 文件路径
  name: string;                  // 文件名
  folder: string;                // 所属文件夹
  extension: string;             // 文件扩展名
  size: number;                  // 文件大小（字节）
  width: number;                 // 图片宽度
  height: number;                // 图片高度
  createdAt: number;             // 创建时间戳
  modifiedAt: number;            // 修改时间戳
  updatedAt: number;            // 更新时间戳
  tags: string[];                // 标签列表
  isFavorite: boolean;           // 是否收藏
  description: string;           // 描述
  linkedNotes: string[];         // 关联笔记
  thumbnail?: string;            // 缩略图（Base64）
  exif?: EXIFData;               // EXIF 数据
}

// EXIF 数据
export interface EXIFData {
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  dateTaken?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// 图片索引结构
export interface ImageIndex {
  byFolder: Record<string, string[]>;  // 按文件夹索引
  byTag: Record<string, string[]>;      // 按标签索引
  byDate: Record<string, string[]>;    // 按日期索引
}

// 视图模式
export type ViewMode = 'grid' | 'list' | 'gallery';

// 排序方式
export type SortBy = 'name' | 'date' | 'size' | 'modified';

// 排序方向
export type SortOrder = 'asc' | 'desc';

// 筛选选项
export interface FilterOptions {
  folder?: string;
  tags?: string[];
  favorites?: boolean;
  searchQuery?: string;
  dateRange?: {
    start: number;
    end: number;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
}

// 插件设置
export interface ImageManagerSettings {
  // 基础设置
  defaultAlignment: AlignmentType;     // 默认对齐方式
  imageFolder: string;                // 默认图片文件夹

  // 显示设置
  viewMode: ViewMode;                  // 默认视图模式
  thumbnailSize: number;              // 缩略图大小
  showFileInfo: boolean;               // 显示文件信息
  gridColumns: number;                 // 网格列数

  // 行为设置
  autoScan: boolean;                   // 自动扫描
  scanOnStartup: boolean;              // 启动时扫描
  watchChanges: boolean;               // 监听文件变化

  // 功能设置
  enableQuickInsert: boolean;          // 快速插入
  quickInsertShortcut: string;         // 快速插入快捷键
  enableDragDrop: boolean;             // 拖放支持
  enableKeyboardShortcuts: boolean;    // 键盘快捷键

  // 高级设置
  excludedFolders: string[];           // 排除的文件夹
  fileExtensions: string[];            // 允许的文件扩展名
  maxCacheSize: number;                // 最大缓存大小
}

// 常量
export const IMAGE_MANAGER_VIEW_TYPE = 'image-manager-view';
export const CURRENT_VERSION = '1.0.0';

// 默认设置
export const DEFAULT_SETTINGS: ImageManagerSettings = {
  defaultAlignment: 'none',
  imageFolder: '/assets/images',
  viewMode: 'grid',
  thumbnailSize: 200,
  showFileInfo: true,
  gridColumns: 4,
  autoScan: true,
  scanOnStartup: true,
  watchChanges: true,
  enableQuickInsert: true,
  quickInsertShortcut: 'Mod+Shift+I',
  enableDragDrop: true,
  enableKeyboardShortcuts: true,
  excludedFolders: ['.git', '.obsidian', 'node_modules'],
  fileExtensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
  maxCacheSize: 100 * 1024 * 1024 // 100MB
};
```

### 3.2 数据存储策略

```typescript
// 元数据存储结构示例
{
  "version": "1.0.0",
  "images": [
    {
      "id": "img_1707032400000_abc123",
      "path": "/assets/images/photo.jpg",
      "name": "photo.jpg",
      "folder": "/assets/images",
      "extension": "jpg",
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "createdAt": 1707032400000,
      "modifiedAt": 1707032400000,
      "updatedAt": 1707032400000,
      "tags": ["travel", "nature"],
      "isFavorite": true,
      "description": "美丽的日出风景",
      "linkedNotes": ["/notes/vacation.md"],
      "exif": {
        "camera": "Canon EOS R5",
        "iso": 100,
        "aperture": "f/8"
      }
    }
  ],
  "index": {
    "byFolder": {
      "/assets/images": ["img_1", "img_2"]
    },
    "byTag": {
      "travel": ["img_1"],
      "nature": ["img_1", "img_2"]
    },
    "byDate": {
      "2024-01": ["img_1", "img_2"]
    }
  }
}
```

---

## 4. 用户界面设计方案

### 4.1 侧边栏主视图

```typescript
// src/ui/ImageManagerView.ts
import { View, TFolder, WorkspaceLeaf, Menu } from 'obsidian';
import { IMAGE_MANAGER_VIEW_TYPE } from '../types';
import { ImageGrid } from './ImageGrid';
import { FolderTree } from './FolderTree';
import { Toolbar } from './Toolbar';
import { ImageModal } from './ImageModal';

export class ImageManagerView extends View {
  private grid: ImageGrid;
  private toolbar: Toolbar;
  private folderTree: FolderTree;
  private currentFolder: string = '/';
  private currentFilter: FilterOptions = {};
  private sortBy: SortBy = 'date';
  private sortOrder: SortOrder = 'desc';

  constructor(leaf: WorkspaceLeaf, private plugin: ImageManagerPlugin) {
    super(leaf);
    this.grid = new ImageGrid(this);
    this.toolbar = new Toolbar(this);
    this.folderTree = new FolderTree(this);
  }

  getViewType(): string {
    return IMAGE_MANAGER_VIEW_TYPE;
  }

  getDisplayText(): string {
    return '图片管理';
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass('image-manager-view');

    // 构建界面布局
    this.contentEl.innerHTML = `
      <div class="image-manager-container">
        <div class="image-manager-sidebar">
          <div class="sidebar-header">
            <h3>文件夹</h3>
          </div>
          <div class="folder-tree-container"></div>
        </div>
        <div class="image-manager-main">
          <div class="toolbar-container"></div>
          <div class="image-grid-container"></div>
        </div>
      </div>
    `;

    // 初始化组件
    this.folderTree.render(
      this.contentEl.querySelector('.folder-tree-container') as HTMLElement
    );
    this.toolbar.render(
      this.contentEl.querySelector('.toolbar-container') as HTMLElement
    );
    this.grid.render(
      this.contentEl.querySelector('.image-grid-container') as HTMLElement
    );

    // 加载初始数据
    await this.refreshImages();
  }

  async refreshImages(): Promise<void> {
    let images = await this.plugin.imageService.getImagesInFolder(this.currentFolder);

    // 应用筛选
    images = this.applyFilter(images);

    // 应用排序
    images = this.applySort(images);

    // 渲染
    this.grid.setImages(images);
  }

  private applyFilter(images: ImageItem[]): ImageItem[] {
    let result = images;

    if (this.currentFilter.tags?.length) {
      result = result.filter(img =>
        img.tags?.some(tag => this.currentFilter.tags?.includes(tag))
      );
    }

    if (this.currentFilter.favorites) {
      result = result.filter(img => img.isFavorite);
    }

    if (this.currentFilter.searchQuery) {
      const query = this.currentFilter.searchQuery.toLowerCase();
      result = result.filter(img =>
        img.name.toLowerCase().includes(query) ||
        img.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }

  private applySort(images: ImageItem[]): ImageItem[] {
    return images.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'modified':
          comparison = a.modifiedAt - b.modifiedAt;
          break;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  setFolder(folderPath: string): void {
    this.currentFolder = folderPath;
    this.refreshImages();
  }

  setSort(sortBy: SortBy, sortOrder: SortOrder): void {
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.refreshImages();
  }

  setFilter(filter: FilterOptions): void {
    this.currentFilter = filter;
    this.refreshImages();
  }

  openImageModal(image: ImageItem): void {
    new ImageModal(this.app, image, this.plugin).open();
  }

  getSelectedImages(): ImageItem[] {
    return this.grid.getSelectedImages();
  }
}
```

### 4.2 HTML 结构设计

```html
<!-- 整体布局 -->
<div class="image-manager-view">
  <!-- 侧边栏：文件夹树 -->
  <div class="image-manager-sidebar">
    <div class="sidebar-header">
      <span class="search-input-wrapper">
        <input type="text" placeholder="搜索图片..." />
      </span>
    </div>
    <div class="folder-tree">
      <div class="folder-item active" data-path="/">
        <span class="folder-icon">📁</span>
        <span class="folder-name">全部图片</span>
        <span class="folder-count">128</span>
      </div>
      <div class="folder-item" data-path="/assets">
        <span class="folder-icon">📁</span>
        <span class="folder-name">assets</span>
        <span class="folder-count">64</span>
      </div>
      <!-- 更多文件夹... -->
    </div>
    <div class="sidebar-tags">
      <h4>标签</h4>
      <div class="tag-list">
        <span class="tag">#travel</span>
        <span class="tag">#nature</span>
        <span class="tag">#work</span>
      </div>
    </div>
  </div>

  <!-- 主区域 -->
  <div class="image-manager-main">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="btn-view-grid active" title="网格视图">▦</button>
        <button class="btn-view-list" title="列表视图">☰</button>
        <button class="btn-view-gallery" title="画廊视图">▣</button>
      </div>
      <div class="toolbar-center">
        <span class="image-count">128 张图片</span>
      </div>
      <div class="toolbar-right">
        <select class="sort-select">
          <option value="date">按日期</option>
          <option value="name">按名称</option>
          <option value="size">按大小</option>
        </select>
        <button class="btn-sort-order">↓</button>
        <button class="btn-filter" title="筛选">⚙</button>
      </div>
    </div>

    <!-- 图片网格 -->
    <div class="image-grid" style="--columns: 4;">
      <!-- 图片卡片 -->
      <div class="image-card" data-path="/path/to/image.jpg">
        <div class="image-thumbnail">
          <img src="thumbnail-base64" alt="image.jpg" loading="lazy" />
          <div class="image-overlay">
            <button class="btn-insert">插入</button>
            <button class="btn-favorite">☆</button>
          </div>
        </div>
        <div class="image-info">
          <span class="image-name">image.jpg</span>
          <span class="image-size">1.2 MB</span>
        </div>
      </div>
      <!-- 更多卡片... -->
    </div>
  </div>
</div>
```

### 4.3 CSS 样式设计

```css
/* src/styles.css */

/* 基础布局 */
.image-manager-view {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* 侧边栏 */
.image-manager-sidebar {
  width: 240px;
  min-width: 200px;
  border-right: 1px solid var(--background-modifier-border);
  display: flex;
  flex-direction: column;
  background: var(--background-secondary);
}

.sidebar-header {
  padding: 12px;
  border-bottom: 1px solid var(--background-modifier-border);
}

.search-input-wrapper input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
}

/* 文件夹树 */
.folder-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.folder-item:hover {
  background: var(--background-modifier-hover);
}

.folder-item.active {
  background: var(--interactive-active);
}

.folder-icon {
  margin-right: 8px;
}

.folder-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-count {
  font-size: 0.8em;
  color: var(--text-muted);
  background: var(--background-secondary);
  padding: 2px 8px;
  border-radius: 10px;
}

/* 主区域 */
.image-manager-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--background-modifier-border);
  gap: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-center {
  flex: 1;
  text-align: center;
}

.toolbar button {
  padding: 6px 10px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-normal);
}

.toolbar button:hover {
  background: var(--background-modifier-hover);
}

.toolbar button.active {
  background: var(--interactive-active);
}

/* 图片网格 */
.image-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(var(--columns, 4), 1fr);
  gap: 16px;
  align-content: start;
}

/* 图片卡片 */
.image-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--background-secondary);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-card.selected {
  outline: 2px solid var(--interactive-active);
}

.image-thumbnail {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}

.image-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.image-overlay button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: white;
  color: black;
  cursor: pointer;
  font-weight: 500;
}

.image-info {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-name {
  font-size: 0.9em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-size {
  font-size: 0.8em;
  color: var(--text-muted);
}

/* 标签样式 */
.tag {
  display: inline-block;
  padding: 4px 10px;
  background: var(--background-secondary);
  border-radius: 12px;
  font-size: 0.85em;
  color: var(--text-normal);
  margin: 2px;
  cursor: pointer;
}

.tag:hover {
  background: var(--interactive-hover);
}
```

### 4.4 图片详情模态框

```typescript
// src/ui/ImageModal.ts
import { Modal, TFile } from 'obsidian';

export class ImageModal extends Modal {
  private image: ImageItem;

  constructor(app: any, image: ImageItem, private plugin: ImageManagerPlugin) {
    super(app);
    this.image = image;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass('image-modal');

    contentEl.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h2>${this.image.name}</h2>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="image-preview">
            <img src="${this.app.vault.getResourcePath(this.image.path)}" />
          </div>
          <div class="image-details">
            <div class="detail-row">
              <span class="label">路径</span>
              <span class="value">${this.image.path}</span>
            </div>
            <div class="detail-row">
              <span class="label">尺寸</span>
              <span class="value">${this.image.width} × ${this.image.height}</span>
            </div>
            <div class="detail-row">
              <span class="label">大小</span>
              <span class="value">${this.plugin.imageProcessor.formatFileSize(this.image.size)}</span>
            </div>
            <div class="detail-row">
              <span class="label">创建时间</span>
              <span class="value">${new Date(this.image.createdAt).toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="label">标签</span>
              <div class="tags-container">
                ${(this.image.tags || []).map(tag =>
                  `<span class="tag">#${tag}</span>`
                ).join('')}
                <button class="btn-add-tag">+ 添加标签</button>
              </div>
            </div>
            <div class="detail-row">
              <span class="label">描述</span>
              <textarea class="description-input" placeholder="添加描述...">${this.image.description || ''}</textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-insert-center">居中插入</button>
          <button class="btn-insert-left">左对齐插入</button>
          <button class="btn-insert-right">右对齐插入</button>
          <button class="btn-favorite ${this.image.isFavorite ? 'active' : ''}">
            ${this.image.isFavorite ? '★ 取消收藏' : '☆ 收藏'}
          </button>
          <button class="btn-delete">删除</button>
        </div>
      </div>
    `;

    this.bindEvents(contentEl);
  }

  private bindEvents(contentEl: HTMLElement) {
    // 关闭按钮
    contentEl.querySelector('.modal-close')?.addEventListener('click', () => {
      this.close();
    });

    // 插入按钮
    contentEl.querySelector('.btn-insert-center')?.addEventListener('click', () => {
      this.insertImage('center');
    });

    // 收藏按钮
    contentEl.querySelector('.btn-favorite')?.addEventListener('click', async () => {
      await this.plugin.imageService.toggleFavorite(this.image.path);
      this.image.isFavorite = !this.image.isFavorite;
      this.onOpen(); // 刷新
    });

    // 删除按钮
    contentEl.querySelector('.btn-delete')?.addEventListener('click', async () => {
      if (confirm('确定要删除这张图片吗？')) {
        await this.plugin.fileManager.deleteFile(this.image.path);
        this.close();
      }
    });
  }

  private async insertImage(alignment: AlignmentType) {
    const file = this.app.vault.getAbstractFileByPath(this.image.path) as TFile;
    await this.plugin.imageService.insertImage(file, alignment);
    this.close();
  }
}
```

---

## 5. 核心功能流程图

### 5.1 图片插入流程

```
用户点击图片
    ↓
选择对齐方式（居中/左/右）
    ↓
获取图片资源路径
    ↓
生成 Markdown 语法
    ↓
添加对齐 HTML 包装（如果需要）
    ↓
插入到当前编辑器光标位置
    ↓
显示成功提示
```

### 5.2 批量操作流程

```
用户选择多张图片
    ↓
选择操作类型（移动/复制/删除/添加标签）
    ↓
确认目标位置/标签
    ↓
遍历执行操作
    ↓
更新元数据索引
    ↓
刷新视图显示
    ↓
显示操作结果
```

---

## 6. 插件命令注册

```typescript
// src/commands/ImageCommands.ts
export class ImageCommands {
  constructor(private plugin: ImageManagerPlugin) {}

  register(): void {
    // 打开图片管理器
    this.plugin.addCommand({
      id: 'open-image-manager',
      name: '打开图片管理器',
      callback: () => this.plugin.toggleView()
    });

    // 快速插入图片
    this.plugin.addCommand({
      id: 'quick-insert-image',
      name: '快速插入图片',
      hotkey: {
        key: 'I',
        modifiers: ['Mod', 'Shift']
      },
      callback: () => this.showQuickInsertModal()
    });

    // 插入当前图片（居中）
    this.plugin.addCommand({
      id: 'insert-image-center',
      name: '插入图片（居中）',
      check: (checking) => {
        if (checking) {
          return this.getSelectedImage() !== null;
        }
        return this.insertSelectedImage('center');
      }
    });

    // 切换收藏
    this.plugin.addCommand({
      id: 'toggle-favorite',
      name: '切换图片收藏状态',
      check: (checking) => {
        if (checking) {
          return this.getSelectedImage() !== null;
        }
        return this.toggleFavorite();
      }
    });
  }

  private showQuickInsertModal(): void {
    // 实现快速插入弹窗
  }

  private getSelectedImage(): string | null {
    // 获取选中的图片路径
    return null;
  }

  private async insertSelectedImage(alignment: AlignmentType): Promise<void> {
    const path = this.getSelectedImage();
    if (path) {
      const file = this.plugin.app.vault.getAbstractFileByPath(path);
      if (file instanceof TFile) {
        await this.plugin.imageService.insertImage(file, alignment);
      }
    }
  }

  private async toggleFavorite(): Promise<void> {
    const path = this.getSelectedImage();
    if (path) {
      await this.plugin.imageService.toggleFavorite(path);
    }
  }
}
```

---

## 7. 总结

这个架构设计涵盖了：

1. **完整的项目结构** - 清晰的文件组织，便于维护和扩展
2. **模块化设计** - 核心服务分离，各司其职
3. **灵活的数据存储** - 基于 JSON 的元数据存储，支持快速检索
4. **现代化的 UI** - 采用网格视图、工具栏、模态框等现代设计
5. **丰富的功能** - 图片插入、批量操作、标签管理、收藏功能等
6. **可扩展性** - 预留了 EXIF 数据、缩略图缓存等扩展点

所有代码都遵循 TypeScript 最佳实践和 Obsidian 插件开发规范。

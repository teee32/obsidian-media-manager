/**
 * 增量文件扫描 + 文件监视器
 * 维护内存中的媒体文件索引，避免每次视图刷新全量遍历 Vault
 */

import { TFile, TAbstractFile, Vault, Events } from 'obsidian';
import { isMediaFile } from './mediaTypes';
import { ThumbnailCache } from './thumbnailCache';

export interface FileEntry {
	path: string;
	name: string;
	size: number;
	mtime: number;
	extension: string;
}

type ChangeType = 'create' | 'modify' | 'delete' | 'rename';
type ChangeListener = (type: ChangeType, entry: FileEntry, oldPath?: string) => void;

export class MediaFileIndex {
	private index: Map<string, FileEntry> = new Map();
	private vault: Vault;
	private thumbnailCache: ThumbnailCache | null;
	private listeners: ChangeListener[] = [];
	private enabledExtensions: Set<string> = new Set();
	private trashFolder: string = '';
	private initialized = false;

	constructor(vault: Vault, thumbnailCache: ThumbnailCache | null = null) {
		this.vault = vault;
		this.thumbnailCache = thumbnailCache;
	}

	/**
	 * 更新启用的扩展名（设置变更时调用）
	 */
	setEnabledExtensions(extensions: string[]): void {
		this.enabledExtensions = new Set(extensions.map(e => e.toLowerCase()));
	}

	/**
	 * 设置隔离文件夹路径（排除该文件夹内的文件）
	 */
	setTrashFolder(path: string): void {
		this.trashFolder = path;
	}

	/**
	 * 判断文件是否在隔离文件夹中
	 */
	private isInTrashFolder(filePath: string): boolean {
		if (!this.trashFolder) return false;
		return filePath.startsWith(this.trashFolder + '/') || filePath === this.trashFolder;
	}

	/**
	 * 判断文件是否应该被索引
	 */
	private shouldIndex(file: TAbstractFile): boolean {
		if (!(file instanceof TFile)) return false;
		if (this.isInTrashFolder(file.path)) return false;

		const ext = '.' + file.extension.toLowerCase();
		if (this.enabledExtensions.size > 0) {
			return this.enabledExtensions.has(ext);
		}
		return isMediaFile(file.name);
	}

	/**
	 * 从 TFile 创建 FileEntry
	 */
	private toEntry(file: TFile): FileEntry {
		return {
			path: file.path,
			name: file.name,
			size: file.stat.size,
			mtime: file.stat.mtime,
			extension: file.extension.toLowerCase()
		};
	}

	/**
	 * 首次全量扫描，建立索引
	 */
	async fullScan(): Promise<void> {
		this.index.clear();

		const allFiles = this.vault.getFiles();
		for (const file of allFiles) {
			if (this.shouldIndex(file)) {
				this.index.set(file.path, this.toEntry(file));
			}
		}

		this.initialized = true;
	}

	/**
	 * 文件变化事件处理器（由 Vault 事件回调调用）
	 */
	onFileCreated(file: TAbstractFile): void {
		if (!this.shouldIndex(file)) return;
		const entry = this.toEntry(file as TFile);
		this.index.set(entry.path, entry);
		this.notifyListeners('create', entry);
	}

	onFileModified(file: TAbstractFile): void {
		if (!this.shouldIndex(file)) return;
		const entry = this.toEntry(file as TFile);
		this.index.set(entry.path, entry);
		this.notifyListeners('modify', entry);
	}

	onFileDeleted(file: TAbstractFile): void {
		const path = file.path;
		const existing = this.index.get(path);
		if (!existing) return;

		this.index.delete(path);

		// 清理缩略图缓存
		if (this.thumbnailCache) {
			void this.thumbnailCache.delete(path);
		}

		this.notifyListeners('delete', existing);
	}

	onFileRenamed(file: TAbstractFile, oldPath: string): void {
		const oldEntry = this.index.get(oldPath);

		// 从旧路径中移除
		if (oldEntry) {
			this.index.delete(oldPath);
		}

		// 如果新路径仍然是媒体文件，添加到索引
		if (this.shouldIndex(file)) {
			const newEntry = this.toEntry(file as TFile);
			this.index.set(newEntry.path, newEntry);

			// 迁移缩略图缓存
			if (this.thumbnailCache) {
				void this.thumbnailCache.rename(oldPath, newEntry.path);
			}

			this.notifyListeners('rename', newEntry, oldPath);
		} else if (oldEntry) {
			// 文件从媒体变为非媒体（例如重命名到隔离文件夹）
			if (this.thumbnailCache) {
				void this.thumbnailCache.delete(oldPath);
			}
			this.notifyListeners('delete', oldEntry);
		}
	}

	/**
	 * 获取当前索引的所有文件
	 */
	getFiles(): FileEntry[] {
		return Array.from(this.index.values());
	}

	/**
	 * 获取文件数量
	 */
	get size(): number {
		return this.index.size;
	}

	/**
	 * 是否已完成初始扫描
	 */
	get isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * 按路径获取单个条目
	 */
	getEntry(path: string): FileEntry | undefined {
		return this.index.get(path);
	}

	/**
	 * 注册变化监听器
	 */
	onChange(listener: ChangeListener): void {
		this.listeners.push(listener);
	}

	/**
	 * 移除变化监听器
	 */
	offChange(listener: ChangeListener): void {
		const idx = this.listeners.indexOf(listener);
		if (idx >= 0) {
			this.listeners.splice(idx, 1);
		}
	}

	/**
	 * 通知所有监听器
	 */
	private notifyListeners(type: ChangeType, entry: FileEntry, oldPath?: string): void {
		for (const listener of this.listeners) {
			try {
				listener(type, entry, oldPath);
			} catch (error) {
				console.error('MediaFileIndex listener error:', error);
			}
		}
	}

	/**
	 * 清除索引
	 */
	clear(): void {
		this.index.clear();
		this.initialized = false;
	}
}

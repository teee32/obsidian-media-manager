/**
 * IndexedDB 缩略图持久缓存
 * 缓存媒体文件的缩略图 Blob，避免每次打开视图重新生成
 */

const DB_NAME = 'obsidian-media-toolkit-thumbs';
const DB_VERSION = 1;
const STORE_NAME = 'thumbnails';

interface ThumbnailEntry {
	path: string;
	mtime: number;
	blob: Blob;
	width: number;
	height: number;
	createdAt: number;
}

export class ThumbnailCache {
	private db: IDBDatabase | null = null;
	private maxEntries: number;
	private memoryCache: Map<string, { mtime: number; url: string }> = new Map();

	constructor(maxEntries: number = 5000) {
		this.maxEntries = maxEntries;
	}

	/**
	 * 打开 IndexedDB 连接
	 */
	async open(): Promise<void> {
		if (this.db) return;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					const store = db.createObjectStore(STORE_NAME, { keyPath: 'path' });
					store.createIndex('createdAt', 'createdAt', { unique: false });
				}
			};

			request.onsuccess = (event) => {
				this.db = (event.target as IDBOpenDBRequest).result;
				resolve();
			};

			request.onerror = () => {
				console.warn('ThumbnailCache: Failed to open IndexedDB, running without cache');
				resolve(); // 不阻塞，无缓存模式继续运行
			};
		});
	}

	/**
	 * 关闭 IndexedDB 连接，释放内存中的 Object URL
	 */
	close(): void {
		// 释放所有内存中的 Object URL
		for (const entry of this.memoryCache.values()) {
			URL.revokeObjectURL(entry.url);
		}
		this.memoryCache.clear();

		if (this.db) {
			this.db.close();
			this.db = null;
		}
	}

	/**
	 * 获取缓存的缩略图 Object URL
	 * 仅当路径匹配且 mtime 未变时返回缓存
	 */
	async get(path: string, mtime: number): Promise<string | null> {
		// 先查内存缓存
		const memEntry = this.memoryCache.get(path);
		if (memEntry && memEntry.mtime === mtime) {
			return memEntry.url;
		}

		if (!this.db) return null;

		return new Promise((resolve) => {
			const tx = this.db!.transaction(STORE_NAME, 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const request = store.get(path);

			request.onsuccess = () => {
				const entry = request.result as ThumbnailEntry | undefined;
				if (entry && entry.mtime === mtime) {
					const url = URL.createObjectURL(entry.blob);
					this.memoryCache.set(path, { mtime, url });
					resolve(url);
				} else {
					resolve(null);
				}
			};

			request.onerror = () => resolve(null);
		});
	}

	/**
	 * 存入缩略图缓存
	 */
	async put(path: string, mtime: number, blob: Blob, width: number, height: number): Promise<void> {
		// 更新内存缓存
		const oldEntry = this.memoryCache.get(path);
		if (oldEntry) {
			URL.revokeObjectURL(oldEntry.url);
		}
		const url = URL.createObjectURL(blob);
		this.memoryCache.set(path, { mtime, url });

		if (!this.db) return;

		return new Promise((resolve) => {
			const tx = this.db!.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);

			const entry: ThumbnailEntry = {
				path,
				mtime,
				blob,
				width,
				height,
				createdAt: Date.now()
			};

			store.put(entry);
			tx.oncomplete = () => {
				this.evictIfNeeded();
				resolve();
			};
			tx.onerror = () => resolve();
		});
	}

	/**
	 * 删除指定路径的缓存
	 */
	async delete(path: string): Promise<void> {
		const memEntry = this.memoryCache.get(path);
		if (memEntry) {
			URL.revokeObjectURL(memEntry.url);
			this.memoryCache.delete(path);
		}

		if (!this.db) return;

		return new Promise((resolve) => {
			const tx = this.db!.transaction(STORE_NAME, 'readwrite');
			tx.objectStore(STORE_NAME).delete(path);
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		});
	}

	/**
	 * 清空所有缓存
	 */
	async clear(): Promise<void> {
		for (const entry of this.memoryCache.values()) {
			URL.revokeObjectURL(entry.url);
		}
		this.memoryCache.clear();

		if (!this.db) return;

		return new Promise((resolve) => {
			const tx = this.db!.transaction(STORE_NAME, 'readwrite');
			tx.objectStore(STORE_NAME).clear();
			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		});
	}

	/**
	 * 重命名路径的缓存条目（文件重命名时调用）
	 */
	async rename(oldPath: string, newPath: string): Promise<void> {
		const memEntry = this.memoryCache.get(oldPath);
		if (memEntry) {
			this.memoryCache.delete(oldPath);
			this.memoryCache.set(newPath, memEntry);
		}

		if (!this.db) return;

		return new Promise((resolve) => {
			const tx = this.db!.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			const getReq = store.get(oldPath);

			getReq.onsuccess = () => {
				const entry = getReq.result as ThumbnailEntry | undefined;
				if (entry) {
					store.delete(oldPath);
					entry.path = newPath;
					store.put(entry);
				}
			};

			tx.oncomplete = () => resolve();
			tx.onerror = () => resolve();
		});
	}

	/**
	 * LRU 淘汰：超过最大条目数时删除最旧的
	 */
	private async evictIfNeeded(): Promise<void> {
		if (!this.db) return;

		const tx = this.db.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const countReq = store.count();

		countReq.onsuccess = () => {
			const count = countReq.result;
			if (count <= this.maxEntries) return;

			const evictCount = count - this.maxEntries;
			const evictTx = this.db!.transaction(STORE_NAME, 'readwrite');
			const evictStore = evictTx.objectStore(STORE_NAME);
			const index = evictStore.index('createdAt');
			const cursor = index.openCursor();
			let deleted = 0;

			cursor.onsuccess = (event) => {
				const c = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
				if (c && deleted < evictCount) {
					const path = (c.value as ThumbnailEntry).path;
					const memEntry = this.memoryCache.get(path);
					if (memEntry) {
						URL.revokeObjectURL(memEntry.url);
						this.memoryCache.delete(path);
					}
					c.delete();
					deleted++;
					c.continue();
				}
			};
		};
	}
}

/**
 * 用 Canvas 生成缩略图 Blob
 */
export function generateThumbnail(
	imageSrc: string,
	maxSize: number = 200
): Promise<{ blob: Blob; width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			try {
				const { width: origW, height: origH } = img;
				let targetW = origW;
				let targetH = origH;

				if (origW > maxSize || origH > maxSize) {
					const ratio = Math.min(maxSize / origW, maxSize / origH);
					targetW = Math.round(origW * ratio);
					targetH = Math.round(origH * ratio);
				}

				const canvas = document.createElement('canvas');
				canvas.width = targetW;
				canvas.height = targetH;

				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Cannot get canvas context'));
					return;
				}

				ctx.drawImage(img, 0, 0, targetW, targetH);

				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve({ blob, width: targetW, height: targetH });
						} else {
							reject(new Error('Canvas toBlob returned null'));
						}
					},
					'image/webp',
					0.7
				);
			} catch (error) {
				reject(error);
			}
		};

		img.onerror = () => reject(new Error(`Failed to load image: ${imageSrc}`));
		img.src = imageSrc;
	});
}

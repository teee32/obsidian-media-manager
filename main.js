"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ImageManagerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian10 = require("obsidian");

// view/ImageLibraryView.ts
var import_obsidian = require("obsidian");

// utils/format.ts
function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
function debounce(fn, delay) {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

// utils/path.ts
function normalizeVaultPath(input) {
  if (typeof input !== "string") return "";
  let normalized = input.trim().replace(/\\/g, "/");
  normalized = normalized.replace(/\/{2,}/g, "/");
  normalized = normalized.replace(/^\/+/, "");
  while (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }
  normalized = normalized.replace(/\/+$/, "");
  return normalized;
}
function getFileNameFromPath(input) {
  const normalized = normalizeVaultPath(input);
  if (!normalized) return "";
  const parts = normalized.split("/");
  return parts[parts.length - 1] || "";
}
function getParentPath(input) {
  const normalized = normalizeVaultPath(input);
  if (!normalized) return "";
  const idx = normalized.lastIndexOf("/");
  return idx === -1 ? "" : normalized.slice(0, idx);
}
function safeDecodeURIComponent(input) {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

// utils/mediaTypes.ts
var IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"];
var VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
var AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a", ".flac"];
var DOCUMENT_EXTENSIONS = [".pdf"];
var IMAGE_EXTENSIONS_STR = [...IMAGE_EXTENSIONS];
var VIDEO_EXTENSIONS_STR = [...VIDEO_EXTENSIONS];
var AUDIO_EXTENSIONS_STR = [...AUDIO_EXTENSIONS];
var DOCUMENT_EXTENSIONS_STR = [...DOCUMENT_EXTENSIONS];
var ALL_MEDIA_EXTENSIONS = [
  ...IMAGE_EXTENSIONS_STR,
  ...VIDEO_EXTENSIONS_STR,
  ...AUDIO_EXTENSIONS_STR,
  ...DOCUMENT_EXTENSIONS_STR
];
var EXTENSION_TO_TYPE = {
  // 图片
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".gif": "image",
  ".webp": "image",
  ".svg": "image",
  ".bmp": "image",
  // 视频
  ".mp4": "video",
  ".mov": "video",
  ".avi": "video",
  ".mkv": "video",
  ".webm": "video",
  // 音频
  ".mp3": "audio",
  ".wav": "audio",
  ".ogg": "audio",
  ".m4a": "audio",
  ".flac": "audio",
  // 文档
  ".pdf": "document"
};
function getFileExtension(filename) {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.substring(lastDot).toLowerCase();
}
function getMediaType(filename) {
  const ext = getFileExtension(filename);
  return EXTENSION_TO_TYPE[ext] || null;
}
function isMediaFile(filename) {
  const ext = getFileExtension(filename);
  return ALL_MEDIA_EXTENSIONS.includes(ext);
}
function getEnabledExtensions(settings) {
  const extensions = [];
  if (settings.enableImages !== false) {
    extensions.push(...IMAGE_EXTENSIONS_STR);
  }
  if (settings.enableVideos !== false) {
    extensions.push(...VIDEO_EXTENSIONS_STR);
  }
  if (settings.enableAudio !== false) {
    extensions.push(...AUDIO_EXTENSIONS_STR);
  }
  if (settings.enablePDF !== false) {
    extensions.push(...DOCUMENT_EXTENSIONS_STR);
  }
  return extensions;
}

// utils/thumbnailCache.ts
var DB_NAME = "obsidian-media-toolkit-thumbs";
var DB_VERSION = 1;
var STORE_NAME = "thumbnails";
var ThumbnailCache = class {
  constructor(maxEntries = 5e3) {
    this.db = null;
    this.memoryCache = /* @__PURE__ */ new Map();
    this.maxEntries = maxEntries;
  }
  /**
   * 打开 IndexedDB 连接
   */
  async open() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "path" });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };
      request.onerror = () => {
        console.warn("ThumbnailCache: Failed to open IndexedDB, running without cache");
        resolve();
      };
    });
  }
  /**
   * 关闭 IndexedDB 连接，释放内存中的 Object URL
   */
  close() {
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
  async get(path, mtime) {
    const memEntry = this.memoryCache.get(path);
    if (memEntry && memEntry.mtime === mtime) {
      return memEntry.url;
    }
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(path);
      request.onsuccess = () => {
        const entry = request.result;
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
  async put(path, mtime, blob, width, height) {
    const oldEntry = this.memoryCache.get(path);
    if (oldEntry) {
      URL.revokeObjectURL(oldEntry.url);
    }
    const url = URL.createObjectURL(blob);
    this.memoryCache.set(path, { mtime, url });
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry = {
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
  async delete(path) {
    const memEntry = this.memoryCache.get(path);
    if (memEntry) {
      URL.revokeObjectURL(memEntry.url);
      this.memoryCache.delete(path);
    }
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(path);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
  /**
   * 清空所有缓存
   */
  async clear() {
    for (const entry of this.memoryCache.values()) {
      URL.revokeObjectURL(entry.url);
    }
    this.memoryCache.clear();
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
  /**
   * 重命名路径的缓存条目（文件重命名时调用）
   */
  async rename(oldPath, newPath) {
    const memEntry = this.memoryCache.get(oldPath);
    if (memEntry) {
      this.memoryCache.delete(oldPath);
      this.memoryCache.set(newPath, memEntry);
    }
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(oldPath);
      getReq.onsuccess = () => {
        const entry = getReq.result;
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
  async evictIfNeeded() {
    if (!this.db) return;
    const tx = this.db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const countReq = store.count();
    countReq.onsuccess = () => {
      const count = countReq.result;
      if (count <= this.maxEntries) return;
      const evictCount = count - this.maxEntries;
      const evictTx = this.db.transaction(STORE_NAME, "readwrite");
      const evictStore = evictTx.objectStore(STORE_NAME);
      const index = evictStore.index("createdAt");
      const cursor = index.openCursor();
      let deleted = 0;
      cursor.onsuccess = (event) => {
        const c = event.target.result;
        if (c && deleted < evictCount) {
          const path = c.value.path;
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
};
function generateThumbnail(imageSrc, maxSize = 200) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
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
        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Cannot get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, width: targetW, height: targetH });
            } else {
              reject(new Error("Canvas toBlob returned null"));
            }
          },
          "image/webp",
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

// utils/exifReader.ts
var TAG_DATE_TIME_ORIGINAL = 36867;
var TAG_MAKE = 271;
var TAG_MODEL = 272;
var TAG_IMAGE_WIDTH = 40962;
var TAG_IMAGE_HEIGHT = 40963;
var TAG_ORIENTATION = 274;
var TAG_EXIF_IFD = 34665;
function parseExif(buffer) {
  const view = new DataView(buffer);
  const result = {};
  if (view.getUint16(0) !== 65496) {
    return result;
  }
  let offset = 2;
  const length = Math.min(buffer.byteLength, 65536);
  while (offset < length) {
    if (view.getUint8(offset) !== 255) break;
    const marker = view.getUint8(offset + 1);
    offset += 2;
    if (marker === 225) {
      const segmentLength = view.getUint16(offset);
      if (segmentLength > 8 && view.getUint32(offset + 2) === 1165519206 && // "Exif"
      view.getUint16(offset + 6) === 0) {
        const tiffOffset = offset + 8;
        parseTiff(view, tiffOffset, result);
      }
      return result;
    }
    if (marker >= 224 && marker <= 239 || marker === 254) {
      const segmentLength = view.getUint16(offset);
      offset += segmentLength;
    } else if (marker === 218) {
      break;
    } else {
      if (offset + 2 <= length) {
        const segmentLength = view.getUint16(offset);
        offset += segmentLength;
      } else {
        break;
      }
    }
  }
  return result;
}
function parseTiff(view, tiffStart, result) {
  if (tiffStart + 8 > view.byteLength) return;
  const byteOrder = view.getUint16(tiffStart);
  const littleEndian = byteOrder === 18761;
  if (byteOrder !== 18761 && byteOrder !== 19789) return;
  if (view.getUint16(tiffStart + 2, littleEndian) !== 42) return;
  const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian);
  parseIFD(view, tiffStart, tiffStart + ifd0Offset, littleEndian, result, true);
}
function parseIFD(view, tiffStart, ifdOffset, littleEndian, result, followExifIFD) {
  if (ifdOffset + 2 > view.byteLength) return;
  const entryCount = view.getUint16(ifdOffset, littleEndian);
  let offset = ifdOffset + 2;
  for (let i = 0; i < entryCount; i++) {
    if (offset + 12 > view.byteLength) break;
    const tag = view.getUint16(offset, littleEndian);
    const type = view.getUint16(offset + 2, littleEndian);
    const count = view.getUint32(offset + 4, littleEndian);
    const valueOffset = offset + 8;
    switch (tag) {
      case TAG_MAKE:
        result.make = readStringValue(view, tiffStart, valueOffset, type, count, littleEndian);
        break;
      case TAG_MODEL:
        result.model = readStringValue(view, tiffStart, valueOffset, type, count, littleEndian);
        break;
      case TAG_ORIENTATION:
        result.orientation = readShortValue(view, valueOffset, littleEndian);
        break;
      case TAG_DATE_TIME_ORIGINAL:
        result.dateTimeOriginal = readStringValue(view, tiffStart, valueOffset, type, count, littleEndian);
        break;
      case TAG_IMAGE_WIDTH:
        result.imageWidth = readLongOrShort(view, valueOffset, type, littleEndian);
        break;
      case TAG_IMAGE_HEIGHT:
        result.imageHeight = readLongOrShort(view, valueOffset, type, littleEndian);
        break;
      case TAG_EXIF_IFD:
        if (followExifIFD) {
          const exifOffset = view.getUint32(valueOffset, littleEndian);
          parseIFD(view, tiffStart, tiffStart + exifOffset, littleEndian, result, false);
        }
        break;
    }
    offset += 12;
  }
}
function readShortValue(view, offset, littleEndian) {
  if (offset + 2 > view.byteLength) return 0;
  return view.getUint16(offset, littleEndian);
}
function readLongOrShort(view, offset, type, littleEndian) {
  if (type === 3) {
    return readShortValue(view, offset, littleEndian);
  }
  if (offset + 4 > view.byteLength) return 0;
  return view.getUint32(offset, littleEndian);
}
function readStringValue(view, tiffStart, valueOffset, type, count, littleEndian) {
  if (type !== 2) return "";
  let dataOffset;
  if (count <= 4) {
    dataOffset = valueOffset;
  } else {
    if (valueOffset + 4 > view.byteLength) return "";
    dataOffset = tiffStart + view.getUint32(valueOffset, littleEndian);
  }
  if (dataOffset + count > view.byteLength) return "";
  let str = "";
  for (let i = 0; i < count - 1; i++) {
    const charCode = view.getUint8(dataOffset + i);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str.trim();
}
function parseExifDate(dateStr) {
  const match = dateStr.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

// utils/ruleEngine.ts
function findMatchingRule(rules, file, metadata) {
  const ext = getFileExtension(file.name).replace(".", "").toLowerCase();
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.matchExtensions) {
      const allowedExts = rule.matchExtensions.split(",").map((e) => e.trim().toLowerCase());
      if (!allowedExts.includes(ext)) continue;
    }
    return rule;
  }
  return null;
}
function computeTarget(rule, ctx) {
  const ext = getFileExtension(ctx.file.name);
  const baseName = ctx.file.name.replace(/\.[^.]+$/, "");
  const mediaType = getMediaType(ctx.file.name) || "other";
  let date = ctx.date;
  if (ctx.exif?.dateTimeOriginal) {
    const exifDate = parseExifDate(ctx.exif.dateTimeOriginal);
    if (exifDate) date = exifDate;
  }
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const camera = ctx.exif?.make ? `${ctx.exif.make}${ctx.exif.model ? " " + ctx.exif.model : ""}` : "Unknown";
  const tag = ctx.tags?.[0] || "untagged";
  const vars = {
    "{year}": year,
    "{month}": month,
    "{day}": day,
    "{ext}": ext.replace(".", ""),
    "{name}": baseName,
    "{camera}": sanitizeFileName(camera),
    "{type}": mediaType,
    "{tag}": sanitizeFileName(tag)
  };
  let newDir = rule.pathTemplate;
  for (const [key, value] of Object.entries(vars)) {
    newDir = newDir.replace(new RegExp(escapeRegex(key), "g"), value);
  }
  let newName = rule.renameTemplate || "{name}";
  for (const [key, value] of Object.entries(vars)) {
    newName = newName.replace(new RegExp(escapeRegex(key), "g"), value);
  }
  if (!newName.endsWith(ext)) {
    newName = newName + ext;
  }
  newDir = newDir.replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  const newPath = newDir ? `${newDir}/${newName}` : newName;
  return {
    originalPath: ctx.file.path,
    newPath,
    newName
  };
}
function sanitizeFileName(name) {
  return name.replace(/[/\\:*?"<>|]/g, "_").replace(/\s+/g, "_").replace(/_+/g, "_").trim();
}
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// utils/mediaProcessor.ts
var MIME_MAP = {
  "webp": "image/webp",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "avif": "image/avif"
};
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
async function processImage(src, originalSize, options = {}) {
  const img = await loadImage(src);
  let { width: srcW, height: srcH } = img;
  let drawX = 0;
  let drawY = 0;
  let drawW = srcW;
  let drawH = srcH;
  if (options.crop) {
    drawX = -options.crop.x;
    drawY = -options.crop.y;
    srcW = options.crop.width;
    srcH = options.crop.height;
  }
  let targetW = srcW;
  let targetH = srcH;
  if (options.maxWidth || options.maxHeight) {
    const maxW = options.maxWidth || Infinity;
    const maxH = options.maxHeight || Infinity;
    const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
    targetW = Math.round(srcW * ratio);
    targetH = Math.round(srcH * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get canvas context");
  if (options.crop) {
    const scaleX = targetW / srcW;
    const scaleY = targetH / srcH;
    ctx.drawImage(
      img,
      options.crop.x,
      options.crop.y,
      options.crop.width,
      options.crop.height,
      0,
      0,
      targetW,
      targetH
    );
  } else {
    ctx.drawImage(img, 0, 0, targetW, targetH);
  }
  if (options.watermark?.text) {
    const wm = options.watermark;
    const fontSize = wm.fontSize || Math.max(16, Math.round(targetW / 30));
    ctx.save();
    ctx.globalAlpha = wm.opacity;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    const textMetrics = ctx.measureText(wm.text);
    let textX;
    let textY;
    switch (wm.position) {
      case "center":
        textX = (targetW - textMetrics.width) / 2;
        textY = targetH / 2 + fontSize / 2;
        break;
      case "bottom-left":
        textX = 20;
        textY = targetH - 20;
        break;
      case "bottom-right":
      default:
        textX = targetW - textMetrics.width - 20;
        textY = targetH - 20;
        break;
    }
    ctx.strokeText(wm.text, textX, textY);
    ctx.fillText(wm.text, textX, textY);
    ctx.restore();
  }
  const format = options.format || "webp";
  const quality = (options.quality ?? 80) / 100;
  const mimeType = MIME_MAP[format] || "image/webp";
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob returned null"));
      },
      mimeType,
      quality
    );
  });
  return {
    blob,
    width: targetW,
    height: targetH,
    originalSize,
    newSize: blob.size,
    format
  };
}
function getFormatExtension(format) {
  switch (format) {
    case "jpeg":
      return ".jpg";
    case "webp":
      return ".webp";
    case "png":
      return ".png";
    case "avif":
      return ".avif";
    default:
      return `.${format}`;
  }
}

// view/ImageLibraryView.ts
var VIEW_TYPE_IMAGE_LIBRARY = "image-library-view";
var ImageLibraryView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.images = [];
    this.filteredImages = [];
    this.searchQuery = "";
    this.currentPage = 1;
    this.pageSize = 50;
    this.selectedFiles = /* @__PURE__ */ new Set();
    this.isSelectionMode = false;
    this.searchInput = null;
    this.plugin = plugin;
  }
  isProcessableImage(file) {
    const ext = getFileExtension(file.name);
    return [".png", ".jpg", ".jpeg", ".webp", ".bmp"].includes(ext);
  }
  getViewType() {
    return VIEW_TYPE_IMAGE_LIBRARY;
  }
  getDisplayText() {
    return this.plugin.t("mediaLibrary");
  }
  async onOpen() {
    let retries = 0;
    while (!this.contentEl && retries < 10) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      retries++;
    }
    if (!this.contentEl) {
      console.error("ImageLibraryView: contentEl not ready after retries");
      return;
    }
    this.contentEl.addClass("image-library-view");
    this.pageSize = this.plugin.settings.pageSize || 50;
    await this.refreshImages();
  }
  async onClose() {
  }
  async refreshImages() {
    if (!this.contentEl) {
      return;
    }
    this.pageSize = Math.max(1, this.plugin.settings.pageSize || 50);
    const sizeMap = {
      "small": "small",
      "medium": "medium",
      "large": "large"
    };
    const size = sizeMap[this.plugin.settings.thumbnailSize] || "medium";
    this.contentEl.empty();
    let imageFiles;
    if (this.plugin.fileIndex.isInitialized) {
      const entries = this.plugin.fileIndex.getFiles();
      imageFiles = entries.map((e) => this.app.vault.getAbstractFileByPath(e.path)).filter((f) => f instanceof import_obsidian.TFile);
    } else {
      imageFiles = await this.plugin.getAllImageFiles();
    }
    let filteredImages;
    if (this.plugin.settings.imageFolder) {
      const folder = normalizeVaultPath(this.plugin.settings.imageFolder);
      const prefix = folder ? `${folder}/` : "";
      filteredImages = imageFiles.filter((f) => {
        const normalizedPath = normalizeVaultPath(f.path);
        return normalizedPath === folder || (prefix ? normalizedPath.startsWith(prefix) : false);
      });
    } else {
      filteredImages = imageFiles;
    }
    this.images = filteredImages.map((file) => ({
      file,
      path: file.path,
      name: file.name,
      size: file.stat.size,
      modified: file.stat.mtime
    }));
    this.sortImages();
    this.applySearch();
    const totalPages = Math.max(1, Math.ceil(this.filteredImages.length / this.pageSize));
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }
    this.renderHeader();
    this.renderSearchBox();
    if (this.isSelectionMode) {
      this.renderSelectionToolbar();
    }
    const grid = this.contentEl.createDiv({ cls: "image-grid" });
    grid.addClass(`image-grid-${size}`);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.filteredImages.length);
    const pageImages = this.filteredImages.slice(startIndex, endIndex);
    for (const image of pageImages) {
      this.renderImageItem(grid, image);
    }
    this.renderPagination();
    if (this.filteredImages.length === 0) {
      this.contentEl.createDiv({
        cls: "empty-state",
        text: this.searchQuery ? this.plugin.t("noMatchingFiles") : this.plugin.t("noMediaFiles")
      });
    }
  }
  /**
   * 应用搜索过滤
   */
  applySearch() {
    if (!this.searchQuery) {
      this.filteredImages = [...this.images];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredImages = this.images.filter(
        (img) => img.name.toLowerCase().includes(query) || img.path.toLowerCase().includes(query)
      );
    }
  }
  /**
   * 渲染搜索框
   */
  renderSearchBox() {
    const searchContainer = this.contentEl.createDiv({ cls: "search-container" });
    this.searchInput = searchContainer.createEl("input", {
      type: "text",
      cls: "search-input",
      attr: {
        placeholder: this.plugin.t("searchPlaceholder"),
        value: this.searchQuery
      }
    });
    const searchIcon = searchContainer.createDiv({ cls: "search-icon" });
    (0, import_obsidian.setIcon)(searchIcon, "search");
    if (this.searchQuery) {
      const clearBtn = searchContainer.createEl("button", { cls: "clear-search" });
      (0, import_obsidian.setIcon)(clearBtn, "x");
      clearBtn.addEventListener("click", () => {
        this.searchQuery = "";
        this.currentPage = 1;
        this.applySearch();
        this.refreshImages();
      });
    }
    const debouncedSearch = debounce(() => {
      this.currentPage = 1;
      this.applySearch();
      this.refreshImages();
    }, 300);
    this.searchInput.addEventListener("input", (e) => {
      const target = e.target;
      this.searchQuery = target.value;
      debouncedSearch();
    });
    if (this.searchQuery) {
      searchContainer.createSpan({
        text: this.plugin.t("searchResults").replace("{count}", String(this.filteredImages.length)),
        cls: "search-results-count"
      });
    }
  }
  /**
   * 渲染选择模式工具栏
   */
  renderSelectionToolbar() {
    const toolbar = this.contentEl.createDiv({ cls: "selection-toolbar" });
    toolbar.createSpan({
      text: this.plugin.t("selectFiles").replace("{count}", String(this.selectedFiles.size)),
      cls: "selection-count"
    });
    const selectAllBtn = toolbar.createEl("button", { cls: "toolbar-button" });
    (0, import_obsidian.setIcon)(selectAllBtn, "check-square");
    selectAllBtn.addEventListener("click", () => {
      this.filteredImages.forEach((img) => this.selectedFiles.add(img.file.path));
      this.refreshImages();
    });
    const deselectAllBtn = toolbar.createEl("button", { cls: "toolbar-button" });
    (0, import_obsidian.setIcon)(deselectAllBtn, "square");
    deselectAllBtn.addEventListener("click", () => {
      this.selectedFiles.clear();
      this.refreshImages();
    });
    const deleteSelectedBtn = toolbar.createEl("button", { cls: "toolbar-button danger" });
    (0, import_obsidian.setIcon)(deleteSelectedBtn, "trash-2");
    deleteSelectedBtn.addEventListener("click", () => this.deleteSelected());
    const organizeBtn = toolbar.createEl("button", { cls: "toolbar-button" });
    (0, import_obsidian.setIcon)(organizeBtn, "folder-input");
    organizeBtn.title = this.plugin.t("organizing");
    organizeBtn.addEventListener("click", () => this.organizeSelected());
    const processBtn = toolbar.createEl("button", { cls: "toolbar-button" });
    (0, import_obsidian.setIcon)(processBtn, "image-down");
    processBtn.title = this.plugin.t("processing");
    processBtn.addEventListener("click", () => this.processSelected());
    const exitSelectionBtn = toolbar.createEl("button", { cls: "toolbar-button" });
    (0, import_obsidian.setIcon)(exitSelectionBtn, "x");
    exitSelectionBtn.addEventListener("click", () => {
      this.isSelectionMode = false;
      this.selectedFiles.clear();
      this.refreshImages();
    });
  }
  /**
   * 渲染分页控件
   */
  renderPagination() {
    const totalPages = Math.ceil(this.filteredImages.length / this.pageSize);
    if (totalPages <= 1) return;
    const pagination = this.contentEl.createDiv({ cls: "pagination" });
    const prevBtn = pagination.createEl("button", { cls: "page-button" });
    prevBtn.textContent = this.plugin.t("prevPage");
    prevBtn.disabled = this.currentPage <= 1;
    prevBtn.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.refreshImages();
      }
    });
    pagination.createSpan({
      text: this.plugin.t("pageInfo").replace("{current}", String(this.currentPage)).replace("{total}", String(totalPages)),
      cls: "page-info"
    });
    const nextBtn = pagination.createEl("button", { cls: "page-button" });
    nextBtn.textContent = this.plugin.t("nextPage");
    nextBtn.disabled = this.currentPage >= totalPages;
    nextBtn.addEventListener("click", () => {
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.refreshImages();
      }
    });
    const jumpInput = pagination.createEl("input", {
      type: "number",
      cls: "page-jump-input",
      attr: {
        min: "1",
        max: String(totalPages),
        value: String(this.currentPage)
      }
    });
    jumpInput.addEventListener("change", (e) => {
      const target = e.target;
      let page = parseInt(target.value, 10);
      if (isNaN(page)) page = this.currentPage;
      page = Math.max(1, Math.min(page, totalPages));
      this.currentPage = page;
      this.refreshImages();
    });
  }
  /**
   * 删除选中的文件
   */
  async deleteSelected() {
    if (this.selectedFiles.size === 0) {
      new import_obsidian.Notice(this.plugin.t("confirmDeleteSelected").replace("{count}", "0"));
      return;
    }
    const confirmed = confirm(
      this.plugin.t("confirmDeleteSelected").replace("{count}", String(this.selectedFiles.size))
    );
    if (confirmed) {
      const filesToDelete = this.filteredImages.filter(
        (img) => this.selectedFiles.has(img.file.path)
      );
      const results = await Promise.all(
        filesToDelete.map((img) => this.plugin.safeDeleteFile(img.file))
      );
      const successCount = results.filter((r) => r).length;
      const failCount = results.filter((r) => !r).length;
      if (successCount > 0) {
        new import_obsidian.Notice(this.plugin.t("deletedFiles").replace("{count}", String(successCount)));
      }
      if (failCount > 0) {
        new import_obsidian.Notice(this.plugin.t("deleteFilesFailed").replace("{count}", String(failCount)), 3e3);
      }
      this.selectedFiles.clear();
      this.isSelectionMode = false;
      await this.refreshImages();
    }
  }
  renderHeader() {
    const header = this.contentEl.createDiv({ cls: "image-library-header" });
    header.createEl("h2", { text: this.plugin.t("mediaLibrary") });
    const stats = header.createDiv({ cls: "image-stats" });
    stats.createSpan({ text: this.plugin.t("totalMediaFiles").replace("{count}", String(this.filteredImages.length)) });
    const refreshBtn = header.createEl("button", { cls: "refresh-button" });
    (0, import_obsidian.setIcon)(refreshBtn, "refresh-cw");
    refreshBtn.addEventListener("click", () => this.refreshImages());
    const selectBtn = header.createEl("button", { cls: "refresh-button" });
    (0, import_obsidian.setIcon)(selectBtn, "check-square");
    selectBtn.addEventListener("click", () => {
      this.isSelectionMode = !this.isSelectionMode;
      if (!this.isSelectionMode) {
        this.selectedFiles.clear();
      }
      this.refreshImages();
    });
    selectBtn.title = this.plugin.t("multiSelectMode");
    const sortSelect = header.createEl("select", { cls: "sort-select" });
    const options = [
      { value: "name", text: this.plugin.t("sortByName") },
      { value: "date", text: this.plugin.t("sortByDate") },
      { value: "size", text: this.plugin.t("sortBySize") }
    ];
    options.forEach((opt) => {
      const option = sortSelect.createEl("option", { value: opt.value, text: opt.text });
      if (this.plugin.settings.sortBy === opt.value) {
        option.setAttribute("selected", "selected");
      }
    });
    sortSelect.addEventListener("change", async (e) => {
      const target = e.target;
      this.plugin.settings.sortBy = target.value;
      await this.plugin.saveSettings();
      this.sortImages();
      this.currentPage = 1;
      this.refreshImages();
    });
    const orderBtn = header.createEl("button", { cls: "order-button" });
    orderBtn.addEventListener("click", async () => {
      this.plugin.settings.sortOrder = this.plugin.settings.sortOrder === "asc" ? "desc" : "asc";
      await this.plugin.saveSettings();
      this.sortImages();
      this.currentPage = 1;
      this.refreshImages();
    });
    (0, import_obsidian.setIcon)(orderBtn, this.plugin.settings.sortOrder === "asc" ? "arrow-up" : "arrow-down");
  }
  sortImages() {
    const { sortBy, sortOrder } = this.plugin.settings;
    const multiplier = sortOrder === "asc" ? 1 : -1;
    this.images.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return multiplier * a.name.localeCompare(b.name);
        case "date":
          return multiplier * (a.modified - b.modified);
        case "size":
          return multiplier * (a.size - b.size);
        default:
          return 0;
      }
    });
  }
  renderThumbnailFallback(container, iconName, label) {
    container.empty();
    const fallback = container.createDiv();
    fallback.style.width = "100%";
    fallback.style.height = "100%";
    fallback.style.display = "flex";
    fallback.style.flexDirection = "column";
    fallback.style.alignItems = "center";
    fallback.style.justifyContent = "center";
    fallback.style.gap = "6px";
    fallback.style.color = "var(--text-muted)";
    const iconEl = fallback.createDiv();
    (0, import_obsidian.setIcon)(iconEl, iconName);
    const labelEl = fallback.createDiv({ text: label });
    labelEl.style.fontSize = "0.75em";
    labelEl.style.textTransform = "uppercase";
  }
  renderMediaThumbnail(container, file, displayName) {
    const mediaType = getMediaType(file.name);
    const src = this.app.vault.getResourcePath(file);
    if (mediaType === "image") {
      this.renderCachedThumbnail(container, file, src, displayName);
      return;
    }
    if (mediaType === "video") {
      const video = container.createEl("video");
      video.src = src;
      video.muted = true;
      video.preload = "metadata";
      video.playsInline = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      video.addEventListener("error", () => {
        this.renderThumbnailFallback(container, "video", "VIDEO");
      });
      return;
    }
    if (mediaType === "audio") {
      this.renderThumbnailFallback(container, "music", "AUDIO");
      return;
    }
    if (mediaType === "document") {
      this.renderThumbnailFallback(container, "file-text", "PDF");
      return;
    }
    this.renderThumbnailFallback(container, "file", "FILE");
  }
  /**
   * 使用 IndexedDB 缓存的缩略图渲染图片
   * 缓存命中时直接用 Blob URL，否则使用原始src并异步生成缓存
   */
  renderCachedThumbnail(container, file, src, displayName) {
    const cache = this.plugin.thumbnailCache;
    const mtime = file.stat.mtime;
    const img = container.createEl("img", {
      attr: { alt: displayName }
    });
    img.style.opacity = "0";
    img.style.transition = "opacity 0.2s";
    img.addEventListener("error", () => {
      container.empty();
      container.createDiv({
        cls: "image-error",
        text: this.plugin.t("imageLoadError")
      });
    });
    if (file.extension.toLowerCase() === "svg") {
      img.src = src;
      img.style.opacity = "1";
      return;
    }
    void cache.get(file.path, mtime).then((cachedUrl) => {
      if (cachedUrl) {
        img.src = cachedUrl;
        img.style.opacity = "1";
      } else {
        img.src = src;
        img.style.opacity = "1";
        void generateThumbnail(src, 300).then(({ blob, width, height }) => {
          return cache.put(file.path, mtime, blob, width, height);
        }).catch(() => {
        });
      }
    });
  }
  renderImageItem(container, image) {
    const item = container.createDiv({ cls: "image-item" });
    if (this.isSelectionMode) {
      const checkbox = item.createEl("input", {
        type: "checkbox",
        cls: "item-checkbox"
      });
      checkbox.checked = this.selectedFiles.has(image.file.path);
      checkbox.addEventListener("change", (e) => {
        const target = e.target;
        if (target.checked) {
          this.selectedFiles.add(image.file.path);
        } else {
          this.selectedFiles.delete(image.file.path);
        }
      });
    }
    const imgContainer = item.createDiv({ cls: "image-container" });
    const file = image.file;
    this.renderMediaThumbnail(imgContainer, file, image.name);
    imgContainer.addEventListener("click", () => {
      if (this.isSelectionMode) {
        if (this.selectedFiles.has(image.file.path)) {
          this.selectedFiles.delete(image.file.path);
        } else {
          this.selectedFiles.add(image.file.path);
        }
        this.refreshImages();
      } else {
        this.plugin.openMediaPreview(image.file);
      }
    });
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showContextMenu(e, file);
    });
    if (this.plugin.settings.showImageInfo) {
      const info = item.createDiv({ cls: "image-info" });
      info.createDiv({ cls: "image-name", text: image.name });
      info.createDiv({ cls: "image-size", text: formatFileSize(image.size) });
    }
  }
  showContextMenu(event, file) {
    const menu = new import_obsidian.Menu();
    menu.addItem((item) => {
      item.setTitle(this.plugin.t("openInNotes")).setIcon("search").onClick(() => {
        this.plugin.openImageInNotes(file);
      });
    });
    menu.addItem((item) => {
      item.setTitle(this.plugin.t("copyPath")).setIcon("link").onClick(() => {
        void navigator.clipboard.writeText(file.path).then(() => {
          new import_obsidian.Notice(this.plugin.t("pathCopied"));
        }).catch((error) => {
          console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
          new import_obsidian.Notice(this.plugin.t("error"));
        });
      });
    });
    menu.addItem((item) => {
      item.setTitle(this.plugin.t("copyLink")).setIcon("copy").onClick(() => {
        const link = `[[${file.name}]]`;
        void navigator.clipboard.writeText(link).then(() => {
          new import_obsidian.Notice(this.plugin.t("linkCopied"));
        }).catch((error) => {
          console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
          new import_obsidian.Notice(this.plugin.t("error"));
        });
      });
    });
    menu.addItem((item) => {
      item.setTitle(this.plugin.t("openOriginal")).setIcon("external-link").onClick(() => {
        const src = this.app.vault.getResourcePath(file);
        window.open(src, "_blank", "noopener,noreferrer");
      });
    });
    if (getMediaType(file.name) === "image") {
      menu.addSeparator();
      menu.addItem((item) => {
        item.setTitle(this.plugin.t("organizing")).setIcon("folder-input").onClick(() => this.organizeFile(file));
      });
      if (this.isProcessableImage(file)) {
        menu.addItem((item) => {
          item.setTitle(this.plugin.t("processing")).setIcon("image-down").onClick(() => this.processFile(file));
        });
      }
    }
    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }
  /**
   * 按规则整理单个文件
   */
  async organizeFile(file) {
    const rules = this.plugin.settings.organizeRules;
    const rule = findMatchingRule(rules, file);
    if (!rule) {
      new import_obsidian.Notice(this.plugin.t("noMatchingFiles"));
      return;
    }
    const ctx = await this.buildOrganizeContext(file);
    const target = computeTarget(rule, ctx);
    if (target.newPath === file.path) return;
    await this.plugin.ensureFolderExists(target.newPath.substring(0, target.newPath.lastIndexOf("/")));
    await this.app.fileManager.renameFile(file, target.newPath);
    new import_obsidian.Notice(this.plugin.t("organizeComplete", { count: 1 }));
  }
  /**
   * 批量整理选中文件
   */
  async organizeSelected() {
    if (this.selectedFiles.size === 0) return;
    const rules = this.plugin.settings.organizeRules;
    let organizedCount = 0;
    for (const path of this.selectedFiles) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof import_obsidian.TFile)) continue;
      const rule = findMatchingRule(rules, file);
      if (!rule) continue;
      const ctx = await this.buildOrganizeContext(file);
      const target = computeTarget(rule, ctx);
      if (target.newPath === file.path) continue;
      try {
        await this.plugin.ensureFolderExists(target.newPath.substring(0, target.newPath.lastIndexOf("/")));
        await this.app.fileManager.renameFile(file, target.newPath);
        organizedCount++;
      } catch (error) {
        console.warn(`\u6574\u7406\u6587\u4EF6\u5931\u8D25: ${file.name}`, error);
      }
    }
    new import_obsidian.Notice(this.plugin.t("organizeComplete", { count: organizedCount }));
    this.selectedFiles.clear();
    this.isSelectionMode = false;
    await this.refreshImages();
  }
  /**
   * 构建整理上下文（包含 EXIF 解析）
   */
  async buildOrganizeContext(file) {
    const date = new Date(file.stat.mtime);
    const ctx = { file, date };
    const ext = file.extension.toLowerCase();
    if (ext === "jpg" || ext === "jpeg") {
      try {
        const buffer = await this.app.vault.readBinary(file);
        ctx.exif = parseExif(buffer);
      } catch {
      }
    }
    return ctx;
  }
  getProcessSettings() {
    const settings = this.plugin.settings;
    return {
      quality: settings.defaultProcessQuality,
      format: settings.defaultProcessFormat,
      watermark: settings.watermarkText ? {
        text: settings.watermarkText,
        position: "bottom-right",
        opacity: 0.5
      } : void 0
    };
  }
  async processAndReplaceFile(file) {
    const src = this.app.vault.getResourcePath(file);
    const originalSize = file.stat.size;
    const result = await processImage(src, originalSize, this.getProcessSettings());
    const newExt = getFormatExtension(result.format);
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const newPath = file.parent ? `${file.parent.path}/${baseName}${newExt}` : `${baseName}${newExt}`;
    const arrayBuffer = await result.blob.arrayBuffer();
    if (newPath === file.path) {
      await this.app.vault.modifyBinary(file, arrayBuffer);
      return {
        baseName,
        originalSize,
        newSize: result.newSize
      };
    }
    const existing = this.app.vault.getAbstractFileByPath(newPath);
    if (existing && existing.path !== file.path) {
      throw new Error(this.plugin.t("targetFileExists"));
    }
    const originalBuffer = await this.app.vault.readBinary(file);
    await this.app.vault.modifyBinary(file, arrayBuffer);
    try {
      await this.app.fileManager.renameFile(file, newPath);
    } catch (error) {
      try {
        await this.app.vault.modifyBinary(file, originalBuffer);
      } catch (rollbackError) {
        console.error(`\u56DE\u6EDA\u5904\u7406\u540E\u7684\u6587\u4EF6\u5931\u8D25: ${file.name}`, rollbackError);
      }
      throw error;
    }
    return {
      baseName,
      originalSize,
      newSize: result.newSize
    };
  }
  /**
   * Canvas 处理单个文件
   */
  async processFile(file) {
    if (!this.isProcessableImage(file)) {
      new import_obsidian.Notice(this.plugin.t("unsupportedFileType"));
      return;
    }
    try {
      const { baseName, originalSize, newSize } = await this.processAndReplaceFile(file);
      const saved = Math.max(0, originalSize - newSize);
      new import_obsidian.Notice(`\u2705 ${baseName}: ${formatFileSize(originalSize)} \u2192 ${formatFileSize(newSize)} (\u8282\u7701 ${formatFileSize(saved)})`);
    } catch (error) {
      console.error(`\u5904\u7406\u5931\u8D25: ${file.name}`, error);
      new import_obsidian.Notice(this.plugin.t("error") + `: ${file.name}`);
    }
  }
  /**
   * 批量 Canvas 处理选中文件
   */
  async processSelected() {
    if (this.selectedFiles.size === 0) return;
    let processed = 0;
    let skipped = 0;
    let totalSaved = 0;
    for (const path of this.selectedFiles) {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof import_obsidian.TFile)) continue;
      if (!this.isProcessableImage(file)) {
        skipped++;
        continue;
      }
      try {
        const { originalSize, newSize } = await this.processAndReplaceFile(file);
        processed++;
        totalSaved += Math.max(0, originalSize - newSize);
      } catch (error) {
        console.warn(`\u5904\u7406\u5931\u8D25: ${path}`, error);
      }
    }
    const suffix = skipped > 0 ? `\uFF0C\u8DF3\u8FC7 ${skipped} \u4E2A\u4E0D\u652F\u6301\u7684\u6587\u4EF6` : "";
    new import_obsidian.Notice(`\u2705 \u5904\u7406\u5B8C\u6210: ${processed} \u4E2A\u6587\u4EF6\uFF0C\u8282\u7701 ${formatFileSize(totalSaved)}${suffix}`);
    this.selectedFiles.clear();
    this.isSelectionMode = false;
    await this.refreshImages();
  }
  // 已移除 formatFileSize 方法，使用 utils/format.ts 中的实现
};

// view/UnreferencedImagesView.ts
var import_obsidian3 = require("obsidian");

// view/DeleteConfirmModal.ts
var import_obsidian2 = require("obsidian");
var DeleteConfirmModal = class extends import_obsidian2.Modal {
  constructor(app, plugin, images, onConfirm) {
    super(app);
    this.isDeleting = false;
    this.plugin = plugin;
    this.images = images;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    const t2 = (key) => this.plugin.t(key);
    contentEl.createEl("h2", {
      text: this.images.length === 1 ? t2("confirmDeleteFile").replace("{name}", this.images[0].name) : t2("confirmDeleteSelected").replace("{count}", String(this.images.length))
    });
    const warning = contentEl.createDiv({ cls: "modal-warning" });
    const warningText = warning.createEl("p");
    warningText.textContent = this.plugin.settings.useTrashFolder ? t2("deleteToTrash") : t2("confirmClearAll");
    warningText.style.color = "var(--text-warning)";
    warningText.style.margin = "16px 0";
    const listContainer = contentEl.createDiv({ cls: "modal-file-list" });
    listContainer.createEl("h3", { text: t2("deleteToTrash") });
    const list = listContainer.createEl("ul");
    const maxShow = 10;
    for (let i = 0; i < Math.min(this.images.length, maxShow); i++) {
      const img = this.images[i];
      list.createEl("li", {
        text: `${img.name} (${formatFileSize(img.size)})`
      });
    }
    if (this.images.length > maxShow) {
      list.createEl("li", {
        text: `... ${this.images.length - maxShow} ${t2("filesScanned")}`
      });
    }
    const buttonContainer = contentEl.createDiv({ cls: "modal-buttons" });
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "12px";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.marginTop = "20px";
    const cancelBtn = buttonContainer.createEl("button", {
      text: t2("cancel"),
      cls: "mod-cta"
    });
    cancelBtn.addEventListener("click", () => this.close());
    const deleteBtn = buttonContainer.createEl("button", {
      text: this.plugin.settings.useTrashFolder ? t2("deleteToTrash") : t2("delete"),
      cls: "mod-warning"
    });
    deleteBtn.addEventListener("click", async () => {
      if (this.isDeleting) return;
      this.isDeleting = true;
      deleteBtn.setAttribute("disabled", "true");
      deleteBtn.textContent = t2("processing") || "\u5904\u7406\u4E2D...";
      try {
        await this.onConfirm();
        this.close();
      } catch (error) {
        console.error("\u5220\u9664\u64CD\u4F5C\u5931\u8D25:", error);
        new import_obsidian2.Notice(t2("deleteFailed"));
        this.isDeleting = false;
        deleteBtn.removeAttribute("disabled");
        deleteBtn.textContent = this.plugin.settings.useTrashFolder ? t2("deleteToTrash") : t2("delete");
      }
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// view/UnreferencedImagesView.ts
var VIEW_TYPE_UNREFERENCED_IMAGES = "unreferenced-images-view";
var UnreferencedImagesView = class extends import_obsidian3.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.unreferencedImages = [];
    this.isScanning = false;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_UNREFERENCED_IMAGES;
  }
  getDisplayText() {
    return this.plugin.t("unreferencedMedia");
  }
  async onOpen() {
    let retries = 0;
    while (!this.contentEl && retries < 10) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      retries++;
    }
    if (!this.contentEl) {
      console.error("UnreferencedImagesView: contentEl not ready");
      return;
    }
    this.contentEl.addClass("unreferenced-images-view");
    if (!this.isScanning) {
      await this.scanUnreferencedImages();
    }
  }
  async onClose() {
  }
  async scanUnreferencedImages() {
    if (!this.contentEl || this.isScanning) {
      return;
    }
    this.isScanning = true;
    this.contentEl.empty();
    const loading = this.contentEl.createDiv({ cls: "loading-state" });
    loading.createEl("div", { cls: "spinner" });
    loading.createDiv({ text: this.plugin.t("scanningUnreferenced") });
    try {
      const files = await this.plugin.findUnreferenced();
      this.unreferencedImages = files.map((file) => ({
        file,
        path: file.path,
        name: file.name,
        size: file.stat.size,
        modified: file.stat.mtime
      }));
      this.unreferencedImages.sort((a, b) => b.size - a.size);
      await this.renderView();
    } catch (error) {
      console.error("\u626B\u63CF\u56FE\u7247\u65F6\u51FA\u9519:", error);
      this.contentEl.createDiv({
        cls: "error-state",
        text: this.plugin.t("scanError")
      });
    } finally {
      this.isScanning = false;
    }
  }
  async renderView() {
    if (!this.contentEl) {
      return;
    }
    this.contentEl.empty();
    this.renderHeader();
    if (this.unreferencedImages.length === 0) {
      this.contentEl.createDiv({
        cls: "success-state",
        text: this.plugin.t("allMediaReferenced")
      });
      return;
    }
    const stats = this.contentEl.createDiv({ cls: "stats-bar" });
    stats.createSpan({
      text: this.plugin.t("unreferencedFound").replace("{count}", String(this.unreferencedImages.length)),
      cls: "stats-count"
    });
    const totalSize = this.unreferencedImages.reduce((sum, img) => sum + img.size, 0);
    stats.createSpan({
      text: this.plugin.t("totalSizeLabel").replace("{size}", formatFileSize(totalSize)),
      cls: "stats-size"
    });
    const list = this.contentEl.createDiv({ cls: "unreferenced-list" });
    for (const image of this.unreferencedImages) {
      this.renderImageItem(list, image);
    }
  }
  renderHeader() {
    const header = this.contentEl.createDiv({ cls: "unreferenced-header" });
    header.createEl("h2", { text: this.plugin.t("unreferencedMedia") });
    const desc = header.createDiv({ cls: "header-description" });
    desc.createSpan({ text: this.plugin.t("unreferencedDesc") });
    const refreshBtn = header.createEl("button", { cls: "refresh-button" });
    (0, import_obsidian3.setIcon)(refreshBtn, "refresh-cw");
    refreshBtn.addEventListener("click", () => this.scanUnreferencedImages());
    const actions = header.createDiv({ cls: "header-actions" });
    const copyAllBtn = actions.createEl("button", { cls: "action-button" });
    (0, import_obsidian3.setIcon)(copyAllBtn, "copy");
    copyAllBtn.addEventListener("click", () => this.copyAllPaths());
    const deleteAllBtn = actions.createEl("button", { cls: "action-button danger" });
    (0, import_obsidian3.setIcon)(deleteAllBtn, "trash-2");
    deleteAllBtn.addEventListener("click", () => this.confirmDeleteAll());
  }
  renderThumbnailFallback(container, iconName, label) {
    container.empty();
    const fallback = container.createDiv();
    fallback.style.width = "100%";
    fallback.style.height = "100%";
    fallback.style.display = "flex";
    fallback.style.flexDirection = "column";
    fallback.style.alignItems = "center";
    fallback.style.justifyContent = "center";
    fallback.style.gap = "6px";
    fallback.style.color = "var(--text-muted)";
    const iconEl = fallback.createDiv();
    (0, import_obsidian3.setIcon)(iconEl, iconName);
    const labelEl = fallback.createDiv({ text: label });
    labelEl.style.fontSize = "0.75em";
    labelEl.style.textTransform = "uppercase";
  }
  renderMediaThumbnail(container, file, displayName) {
    const mediaType = getMediaType(file.name);
    const src = this.app.vault.getResourcePath(file);
    if (mediaType === "image") {
      const img = container.createEl("img", {
        attr: {
          src,
          alt: displayName
        }
      });
      img.addEventListener("error", () => {
        container.empty();
        container.createDiv({
          cls: "image-error",
          text: this.plugin.t("imageLoadError")
        });
      });
      return;
    }
    if (mediaType === "video") {
      const video = container.createEl("video");
      video.src = src;
      video.muted = true;
      video.preload = "metadata";
      video.playsInline = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      video.addEventListener("error", () => {
        this.renderThumbnailFallback(container, "video", "VIDEO");
      });
      return;
    }
    if (mediaType === "audio") {
      this.renderThumbnailFallback(container, "music", "AUDIO");
      return;
    }
    if (mediaType === "document") {
      this.renderThumbnailFallback(container, "file-text", "PDF");
      return;
    }
    this.renderThumbnailFallback(container, "file", "FILE");
  }
  renderImageItem(container, image) {
    const item = container.createDiv({ cls: "unreferenced-item" });
    const thumbnail = item.createDiv({ cls: "item-thumbnail" });
    this.renderMediaThumbnail(thumbnail, image.file, image.name);
    const info = item.createDiv({ cls: "item-info" });
    info.createDiv({ cls: "item-name", text: image.name });
    info.createDiv({ cls: "item-path", text: image.path });
    info.createDiv({ cls: "item-size", text: formatFileSize(image.size) });
    const actions = item.createDiv({ cls: "item-actions" });
    const findBtn = actions.createEl("button", { cls: "item-button" });
    (0, import_obsidian3.setIcon)(findBtn, "search");
    findBtn.addEventListener("click", () => {
      this.plugin.openImageInNotes(image.file);
    });
    const copyBtn = actions.createEl("button", { cls: "item-button" });
    (0, import_obsidian3.setIcon)(copyBtn, "link");
    copyBtn.addEventListener("click", () => {
      void navigator.clipboard.writeText(image.path).then(() => {
        new import_obsidian3.Notice(this.plugin.t("pathCopied"));
      }).catch((error) => {
        console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
        new import_obsidian3.Notice(this.plugin.t("error"));
      });
    });
    const deleteBtn = actions.createEl("button", { cls: "item-button danger" });
    (0, import_obsidian3.setIcon)(deleteBtn, "trash-2");
    deleteBtn.addEventListener("click", () => {
      this.confirmDelete(image);
    });
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showContextMenu(e, image.file);
    });
  }
  showContextMenu(event, file) {
    const menu = new import_obsidian3.Menu();
    menu.addItem((item) => {
      item.setTitle(this.plugin.t("openInNotes")).setIcon("search").onClick(() => {
        this.plugin.openImageInNotes(file);
      });
    });
    menu.addItem((item) => {
      item.setTitle(this.plugin.t("copyPath")).setIcon("link").onClick(() => {
        void navigator.clipboard.writeText(file.path).then(() => {
          new import_obsidian3.Notice(this.plugin.t("pathCopied"));
        }).catch((error) => {
          console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
          new import_obsidian3.Notice(this.plugin.t("error"));
        });
      });
    });
    menu.addItem((item) => {
      item.setTitle(this.plugin.t("copyLink")).setIcon("copy").onClick(() => {
        const link = `[[${file.name}]]`;
        void navigator.clipboard.writeText(link).then(() => {
          new import_obsidian3.Notice(this.plugin.t("linkCopied"));
        }).catch((error) => {
          console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
          new import_obsidian3.Notice(this.plugin.t("error"));
        });
      });
    });
    menu.addItem((item) => {
      item.setTitle(this.plugin.t("openOriginal")).setIcon("external-link").onClick(() => {
        const src = this.app.vault.getResourcePath(file);
        window.open(src, "_blank", "noopener,noreferrer");
      });
    });
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle(this.plugin.t("delete")).setIcon("trash-2").onClick(() => {
        const img = this.unreferencedImages.find((i) => i.file.path === file.path) || { file, path: file.path, name: file.name, size: file.stat.size, modified: file.stat.mtime };
        this.confirmDelete(img);
      });
    });
    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }
  async confirmDelete(image) {
    new DeleteConfirmModal(
      this.app,
      this.plugin,
      [image],
      async () => {
        const success = await this.plugin.safeDeleteFile(image.file);
        if (success) {
          this.unreferencedImages = this.unreferencedImages.filter(
            (img) => img.file.path !== image.file.path
          );
          await this.renderView();
        }
      }
    ).open();
  }
  async confirmDeleteAll() {
    if (this.unreferencedImages.length === 0) {
      new import_obsidian3.Notice(this.plugin.t("noFilesToDelete"));
      return;
    }
    new DeleteConfirmModal(
      this.app,
      this.plugin,
      this.unreferencedImages,
      async () => {
        const results = await Promise.all(
          this.unreferencedImages.map((image) => this.plugin.safeDeleteFile(image.file))
        );
        const deleted = this.unreferencedImages.filter((_, i) => results[i]).map((img) => img.name);
        const errors = this.unreferencedImages.filter((_, i) => !results[i]).map((img) => img.name);
        if (deleted.length > 0) {
          new import_obsidian3.Notice(this.plugin.t("processedFiles").replace("{count}", String(deleted.length)));
        }
        if (errors.length > 0) {
          new import_obsidian3.Notice(this.plugin.t("processedFilesError").replace("{errors}", String(errors.length)));
        }
        await this.scanUnreferencedImages();
      }
    ).open();
  }
  copyAllPaths() {
    const paths = this.unreferencedImages.map((img) => img.path).join("\n");
    void navigator.clipboard.writeText(paths).then(() => {
      new import_obsidian3.Notice(this.plugin.t("copiedFilePaths").replace("{count}", String(this.unreferencedImages.length)));
    }).catch((error) => {
      console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
      new import_obsidian3.Notice(this.plugin.t("error"));
    });
  }
  // 已移除 formatFileSize 方法，使用 utils/format.ts 中的实现
};

// view/TrashManagementView.ts
var import_obsidian4 = require("obsidian");

// utils/security.ts
function isPathSafe(filePath) {
  if (!filePath || !filePath.trim()) return false;
  try {
    const decoded = decodeURIComponent(filePath);
    const normalized = decoded.replace(/\\/g, "/");
    if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) return false;
    if (normalized.includes("\0")) return false;
    const parts = normalized.split("/");
    return parts.every((part) => part !== ".." && part !== ".");
  } catch {
    return false;
  }
}
function isSafeUrl(url) {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return true;
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) return false;
  return !trimmed.includes(":");
}
function escapeHtmlAttr(str) {
  if (typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// view/TrashManagementView.ts
var VIEW_TYPE_TRASH_MANAGEMENT = "trash-management-view";
var TrashManagementView = class extends import_obsidian4.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.trashItems = [];
    this.isLoading = false;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_TRASH_MANAGEMENT;
  }
  getDisplayText() {
    return this.plugin.t("trashManagement");
  }
  async onOpen() {
    let retries = 0;
    while (!this.contentEl && retries < 10) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      retries++;
    }
    if (!this.contentEl) {
      console.error("TrashManagementView: contentEl not ready");
      return;
    }
    this.contentEl.addClass("trash-management-view");
    await this.loadTrashItems();
  }
  async onClose() {
  }
  /**
   * 加载隔离文件夹中的文件
   */
  async loadTrashItems() {
    if (!this.contentEl) return;
    if (this.isLoading) return;
    this.isLoading = true;
    this.contentEl.empty();
    const loading = this.contentEl.createDiv({ cls: "loading-state" });
    loading.createEl("div", { cls: "spinner" });
    loading.createDiv({ text: this.plugin.t("loadingTrashFiles") });
    try {
      const trashPath = normalizeVaultPath(this.plugin.settings.trashFolder);
      if (!trashPath || !isPathSafe(trashPath)) {
        this.trashItems = [];
        await this.renderView();
        return;
      }
      const trashFolder = this.plugin.app.vault.getAbstractFileByPath(trashPath);
      if (!trashFolder || !(trashFolder instanceof import_obsidian4.TFolder)) {
        this.trashItems = [];
        await this.renderView();
        return;
      }
      const refCountMap = this.buildRefCountMap();
      this.trashItems = [];
      for (const file of trashFolder.children) {
        if (file instanceof import_obsidian4.TFile) {
          const originalPath = this.extractOriginalPath(file.name);
          const displayName = originalPath ? getFileNameFromPath(originalPath) || file.name : file.name;
          const refCount = originalPath ? this.lookupRefCount(originalPath, refCountMap) : 0;
          this.trashItems.push({
            file,
            path: file.path,
            rawName: file.name,
            name: displayName,
            size: file.stat.size,
            modified: file.stat.mtime,
            originalPath,
            referenceCount: refCount,
            selected: false
          });
        }
      }
      this.trashItems.sort((a, b) => b.modified - a.modified);
      await this.renderView();
    } catch (error) {
      console.error("\u52A0\u8F7D\u9694\u79BB\u6587\u4EF6\u5931\u8D25:", error);
      this.contentEl.createDiv({
        cls: "error-state",
        text: this.plugin.t("error")
      });
    } finally {
      this.isLoading = false;
    }
  }
  /**
   * 一次性遍历所有笔记，构建引用计数 Map
   * key = 归一化文件名 (lowercase), value = 被引用次数
   * O(笔记数 × 平均 embed 数)，只执行一次
   */
  buildRefCountMap() {
    const countMap = /* @__PURE__ */ new Map();
    const markdownFiles = this.app.vault.getMarkdownFiles();
    for (const md of markdownFiles) {
      const cache = this.app.metadataCache.getFileCache(md);
      if (!cache) continue;
      const entries = [...cache.embeds || [], ...cache.links || []];
      for (const entry of entries) {
        const linkPath = normalizeVaultPath(entry.link).toLowerCase();
        const linkName = (getFileNameFromPath(linkPath) || linkPath).toLowerCase();
        countMap.set(linkPath, (countMap.get(linkPath) || 0) + 1);
        if (linkName !== linkPath) {
          countMap.set(linkName, (countMap.get(linkName) || 0) + 1);
        }
      }
    }
    return countMap;
  }
  /**
   * 从预建 Map 中查询引用次数
   */
  lookupRefCount(originalPath, refCountMap) {
    const normalizedPath = normalizeVaultPath(originalPath).toLowerCase();
    const fileName = (getFileNameFromPath(normalizedPath) || normalizedPath).toLowerCase();
    const exactCount = refCountMap.get(normalizedPath) || 0;
    const nameCount = refCountMap.get(fileName) || 0;
    return Math.max(exactCount, nameCount);
  }
  /**
   * 从隔离文件名中提取原始路径
   */
  extractOriginalPath(fileName) {
    const separatorIndex = fileName.indexOf("__");
    if (separatorIndex === -1) return void 0;
    const encodedPart = fileName.substring(separatorIndex + 2);
    if (!encodedPart) return void 0;
    const decoded = normalizeVaultPath(safeDecodeURIComponent(encodedPart));
    return decoded || void 0;
  }
  /**
   * 计算仪表盘统计数据
   */
  computeStats() {
    const byType = {};
    let totalSize = 0;
    let unreferencedCount = 0;
    for (const item of this.trashItems) {
      totalSize += item.size;
      const type = getMediaType(item.name) || "other";
      byType[type] = (byType[type] || 0) + 1;
      if (item.referenceCount === 0) {
        unreferencedCount++;
      }
    }
    return {
      totalFiles: this.trashItems.length,
      totalSize,
      byType,
      unreferencedRate: this.trashItems.length > 0 ? Math.round(unreferencedCount / this.trashItems.length * 100) : 0
    };
  }
  /**
   * 渲染视图
   */
  async renderView() {
    if (!this.contentEl) return;
    this.contentEl.empty();
    this.renderHeader();
    if (this.trashItems.length > 0) {
      this.renderDashboard();
    }
    if (this.trashItems.length === 0) {
      this.contentEl.createDiv({
        cls: "empty-state",
        text: this.plugin.t("trashFolderEmpty")
      });
      return;
    }
    this.renderBatchToolbar();
    const list = this.contentEl.createDiv({ cls: "trash-list" });
    for (const item of this.trashItems) {
      this.renderTrashItem(list, item);
    }
  }
  /**
   * 渲染头部
   */
  renderHeader() {
    const header = this.contentEl.createDiv({ cls: "trash-header" });
    header.createEl("h2", { text: this.plugin.t("trashManagement") });
    const desc = header.createDiv({ cls: "header-description" });
    desc.createSpan({ text: this.plugin.t("trashManagementDesc") });
    const actions = header.createDiv({ cls: "header-actions" });
    const refreshBtn = actions.createEl("button", { cls: "refresh-button" });
    (0, import_obsidian4.setIcon)(refreshBtn, "refresh-cw");
    refreshBtn.addEventListener("click", () => this.loadTrashItems());
    refreshBtn.title = this.plugin.t("refresh");
    const scanBtn = actions.createEl("button", { cls: "action-button" });
    (0, import_obsidian4.setIcon)(scanBtn, "shield-check");
    scanBtn.createSpan({ text: ` ${this.plugin.t("safeScan")}` });
    scanBtn.disabled = !this.plugin.settings.safeScanEnabled;
    scanBtn.addEventListener("click", () => this.runSafeScan());
    scanBtn.title = this.plugin.t("safeScanDesc");
    const clearAllBtn = actions.createEl("button", { cls: "action-button danger" });
    (0, import_obsidian4.setIcon)(clearAllBtn, "trash-2");
    clearAllBtn.addEventListener("click", () => this.confirmClearAll());
    clearAllBtn.title = this.plugin.t("clearTrashTooltip");
  }
  /**
   * 渲染统计仪表盘
   */
  renderDashboard() {
    const stats = this.computeStats();
    const dashboard = this.contentEl.createDiv({ cls: "trash-dashboard" });
    const cardFiles = dashboard.createDiv({ cls: "dashboard-card" });
    const filesIcon = cardFiles.createDiv({ cls: "dashboard-icon" });
    (0, import_obsidian4.setIcon)(filesIcon, "files");
    cardFiles.createDiv({ cls: "dashboard-value", text: String(stats.totalFiles) });
    cardFiles.createDiv({ cls: "dashboard-label", text: this.plugin.t("filesInTrash").replace("{count}", "") });
    const cardSize = dashboard.createDiv({ cls: "dashboard-card" });
    const sizeIcon = cardSize.createDiv({ cls: "dashboard-icon" });
    (0, import_obsidian4.setIcon)(sizeIcon, "hard-drive");
    cardSize.createDiv({ cls: "dashboard-value", text: formatFileSize(stats.totalSize) });
    cardSize.createDiv({ cls: "dashboard-label", text: this.plugin.t("totalSize").replace("{size}", "") });
    const cardType = dashboard.createDiv({ cls: "dashboard-card" });
    const typeIcon = cardType.createDiv({ cls: "dashboard-icon" });
    (0, import_obsidian4.setIcon)(typeIcon, "pie-chart");
    const typeParts = [];
    for (const [type, count] of Object.entries(stats.byType)) {
      typeParts.push(`${type}: ${count}`);
    }
    cardType.createDiv({ cls: "dashboard-value", text: typeParts.join(", ") || "-" });
    cardType.createDiv({ cls: "dashboard-label", text: this.plugin.t("typeDistribution") });
    const cardUnref = dashboard.createDiv({ cls: "dashboard-card" });
    const unrefIcon = cardUnref.createDiv({ cls: "dashboard-icon" });
    (0, import_obsidian4.setIcon)(unrefIcon, "unlink");
    cardUnref.createDiv({ cls: "dashboard-value", text: `${stats.unreferencedRate}%` });
    cardUnref.createDiv({ cls: "dashboard-label", text: this.plugin.t("unreferencedRate") });
  }
  /**
   * 渲染批量操作工具栏
   */
  renderBatchToolbar() {
    const toolbar = this.contentEl.createDiv({ cls: "batch-toolbar" });
    const selectAllBtn = toolbar.createEl("button", { cls: "toolbar-btn" });
    (0, import_obsidian4.setIcon)(selectAllBtn, "check-square");
    selectAllBtn.createSpan({ text: ` ${this.plugin.t("selectAll")}` });
    selectAllBtn.addEventListener("click", () => {
      const allSelected = this.trashItems.every((i) => i.selected);
      this.trashItems.forEach((i) => i.selected = !allSelected);
      this.renderView();
    });
    const selectedCount = this.trashItems.filter((i) => i.selected).length;
    toolbar.createSpan({
      cls: "selected-count",
      text: this.plugin.t("selectedCount", { count: selectedCount })
    });
    const batchRestoreBtn = toolbar.createEl("button", { cls: "toolbar-btn success" });
    (0, import_obsidian4.setIcon)(batchRestoreBtn, "rotate-ccw");
    batchRestoreBtn.createSpan({ text: ` ${this.plugin.t("batchRestore")}` });
    batchRestoreBtn.addEventListener("click", () => this.batchRestore());
    const batchDeleteBtn = toolbar.createEl("button", { cls: "toolbar-btn danger" });
    (0, import_obsidian4.setIcon)(batchDeleteBtn, "trash-2");
    batchDeleteBtn.createSpan({ text: ` ${this.plugin.t("batchDelete")}` });
    batchDeleteBtn.addEventListener("click", () => this.batchDelete());
  }
  /**
   * 渲染单个隔离文件项
   */
  renderTrashItem(container, item) {
    const itemEl = container.createDiv({ cls: `trash-item ${item.selected ? "selected" : ""}` });
    const checkbox = itemEl.createEl("input", {
      type: "checkbox",
      cls: "item-checkbox"
    });
    checkbox.checked = item.selected;
    checkbox.addEventListener("change", () => {
      item.selected = checkbox.checked;
      itemEl.toggleClass("selected", item.selected);
      const toolbar = this.contentEl.querySelector(".batch-toolbar .selected-count");
      if (toolbar) {
        const count = this.trashItems.filter((i) => i.selected).length;
        toolbar.textContent = this.plugin.t("selectedCount", { count });
      }
    });
    const thumbEl = itemEl.createDiv({ cls: "item-thumbnail" });
    this.renderItemThumbnail(thumbEl, item);
    const info = itemEl.createDiv({ cls: "item-info" });
    info.createDiv({ cls: "item-name", text: item.name });
    if (item.originalPath) {
      info.createDiv({
        cls: "item-original-path",
        text: `${this.plugin.t("originalPath")}: ${item.originalPath}`
      });
    }
    const meta = info.createDiv({ cls: "item-meta" });
    meta.createSpan({ cls: "item-size", text: formatFileSize(item.size) });
    meta.createSpan({
      cls: "item-date",
      text: `${this.plugin.t("deletedTime")}: ${new Date(item.modified).toLocaleString()}`
    });
    const refBadge = info.createSpan({
      cls: `ref-badge ${item.referenceCount > 0 ? "ref-active" : "ref-zero"}`,
      text: this.plugin.t("referencedBy", { count: item.referenceCount })
    });
    const actions = itemEl.createDiv({ cls: "item-actions" });
    const restoreBtn = actions.createEl("button", { cls: "item-button success" });
    (0, import_obsidian4.setIcon)(restoreBtn, "rotate-ccw");
    restoreBtn.addEventListener("click", () => this.restoreFile(item));
    restoreBtn.title = this.plugin.t("restoreTooltip");
    const deleteBtn = actions.createEl("button", { cls: "item-button danger" });
    (0, import_obsidian4.setIcon)(deleteBtn, "trash-2");
    deleteBtn.addEventListener("click", () => this.confirmDelete(item));
    deleteBtn.title = this.plugin.t("permanentDeleteTooltip");
    itemEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showContextMenu(e, item);
    });
  }
  /**
   * 渲染条目缩略图
   */
  renderItemThumbnail(container, item) {
    const mediaType = getMediaType(item.name);
    if (mediaType === "image") {
      const src = this.app.vault.getResourcePath(item.file);
      const img = container.createEl("img", {
        attr: { src, alt: item.name }
      });
      img.addEventListener("error", () => {
        container.empty();
        const icon = container.createDiv({ cls: "thumb-icon" });
        (0, import_obsidian4.setIcon)(icon, "image");
      });
    } else {
      const iconName = mediaType === "video" ? "video" : mediaType === "audio" ? "music" : mediaType === "document" ? "file-text" : "file";
      const icon = container.createDiv({ cls: "thumb-icon" });
      (0, import_obsidian4.setIcon)(icon, iconName);
    }
  }
  /**
   * 安全扫描：自动查找孤立文件并送入隔离
   */
  async runSafeScan() {
    const settings = this.plugin.settings;
    if (!settings.safeScanEnabled) {
      new import_obsidian4.Notice(this.plugin.t("safeScanDesc"));
      return;
    }
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1e3;
    const cutoffTime = now - settings.safeScanUnrefDays * dayMs;
    const minSize = settings.safeScanMinSize;
    new import_obsidian4.Notice(this.plugin.t("safeScanStarted"));
    try {
      const referencedImages = await this.plugin.getReferencedImages();
      const allMedia = this.plugin.fileIndex.isInitialized ? this.plugin.fileIndex.getFiles().map((e) => this.app.vault.getAbstractFileByPath(e.path)).filter((f) => f instanceof import_obsidian4.TFile) : await this.plugin.getAllImageFiles();
      const trashPath = normalizeVaultPath(this.plugin.settings.trashFolder) || "";
      const candidates = [];
      for (const file of allMedia) {
        if (trashPath && file.path.startsWith(trashPath + "/")) continue;
        const normalizedPath = normalizeVaultPath(file.path).toLowerCase();
        const normalizedName = file.name.toLowerCase();
        const isReferenced = referencedImages.has(normalizedPath) || referencedImages.has(normalizedName);
        if (!isReferenced && file.stat.mtime < cutoffTime && file.stat.size >= minSize) {
          candidates.push(file);
        }
      }
      if (candidates.length === 0) {
        new import_obsidian4.Notice(this.plugin.t("safeScanNoResults"));
        return;
      }
      const confirmed = await this.showConfirmModal(
        this.plugin.t("safeScanConfirm", {
          count: candidates.length,
          days: settings.safeScanUnrefDays,
          size: formatFileSize(minSize)
        })
      );
      if (!confirmed) return;
      let moved = 0;
      for (const file of candidates) {
        const result = await this.plugin.safeDeleteFile(file);
        if (result) moved++;
      }
      new import_obsidian4.Notice(this.plugin.t("safeScanComplete", { count: moved }));
      await this.loadTrashItems();
    } catch (error) {
      console.error("\u5B89\u5168\u626B\u63CF\u5931\u8D25:", error);
      new import_obsidian4.Notice(this.plugin.t("safeScanFailed"));
    }
  }
  /**
   * 批量恢复选中文件
   */
  async batchRestore() {
    const selected = this.trashItems.filter((i) => i.selected);
    if (selected.length === 0) {
      new import_obsidian4.Notice(this.plugin.t("noItemsSelected"));
      return;
    }
    const confirmed = await this.showConfirmModal(
      this.plugin.t("confirmBatchRestore", { count: selected.length })
    );
    if (!confirmed) return;
    let restored = 0;
    for (const item of selected) {
      try {
        let targetPath = normalizeVaultPath(item.originalPath || "");
        if (!targetPath) {
          const separatorIndex = item.rawName.indexOf("__");
          if (separatorIndex !== -1) {
            targetPath = normalizeVaultPath(
              safeDecodeURIComponent(item.rawName.substring(separatorIndex + 2))
            );
          } else {
            targetPath = normalizeVaultPath(item.rawName);
          }
        }
        if (targetPath) {
          const result = await this.plugin.restoreFile(item.file, targetPath);
          if (result) restored++;
        }
      } catch (error) {
        console.warn(`\u6062\u590D\u6587\u4EF6\u5931\u8D25: ${item.name}`, error);
      }
    }
    new import_obsidian4.Notice(this.plugin.t("batchRestoreComplete", { count: restored }));
    await this.loadTrashItems();
  }
  /**
   * 批量删除选中文件
   */
  async batchDelete() {
    const selected = this.trashItems.filter((i) => i.selected);
    if (selected.length === 0) {
      new import_obsidian4.Notice(this.plugin.t("noItemsSelected"));
      return;
    }
    const confirmed = await this.showConfirmModal(
      this.plugin.t("confirmClearTrash").replace("{count}", String(selected.length))
    );
    if (!confirmed) return;
    const results = await Promise.all(
      selected.map(
        (item) => this.plugin.app.vault.delete(item.file).then(() => true).catch(() => false)
      )
    );
    const deleted = results.filter((r) => r).length;
    new import_obsidian4.Notice(this.plugin.t("batchDeleteComplete").replace("{count}", String(deleted)));
    await this.loadTrashItems();
  }
  /**
   * 显示右键菜单
   */
  showContextMenu(event, trashItem) {
    const menu = new import_obsidian4.Menu();
    menu.addItem((menuItem) => {
      menuItem.setTitle(this.plugin.t("restore")).setIcon("rotate-ccw").onClick(() => this.restoreFile(trashItem));
    });
    menu.addItem((menuItem) => {
      menuItem.setTitle(this.plugin.t("permanentDelete")).setIcon("trash-2").onClick(() => this.confirmDelete(trashItem));
    });
    menu.addSeparator();
    menu.addItem((menuItem) => {
      menuItem.setTitle(this.plugin.t("copiedFileName")).setIcon("copy").onClick(() => {
        void navigator.clipboard.writeText(trashItem.name).then(() => {
          new import_obsidian4.Notice(this.plugin.t("fileNameCopied"));
        }).catch((error) => {
          console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
          new import_obsidian4.Notice(this.plugin.t("error"));
        });
      });
    });
    menu.addItem((menuItem) => {
      menuItem.setTitle(this.plugin.t("copiedOriginalPath")).setIcon("link").onClick(() => {
        if (trashItem.originalPath) {
          void navigator.clipboard.writeText(trashItem.originalPath).then(() => {
            new import_obsidian4.Notice(this.plugin.t("originalPathCopied"));
          }).catch((error) => {
            console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
            new import_obsidian4.Notice(this.plugin.t("error"));
          });
        }
      });
    });
    menu.showAtPosition({ x: event.clientX, y: event.clientY });
  }
  /**
   * 恢复文件
   */
  async restoreFile(item) {
    try {
      let targetPath = normalizeVaultPath(item.originalPath || "");
      if (!targetPath) {
        const separatorIndex = item.rawName.indexOf("__");
        if (separatorIndex !== -1) {
          targetPath = normalizeVaultPath(
            safeDecodeURIComponent(item.rawName.substring(separatorIndex + 2))
          );
        } else {
          targetPath = normalizeVaultPath(item.rawName);
        }
      }
      if (!targetPath) {
        new import_obsidian4.Notice(this.plugin.t("restoreFailed").replace("{message}", this.plugin.t("error")));
        return;
      }
      const restored = await this.plugin.restoreFile(item.file, targetPath);
      if (!restored) return;
      this.trashItems = this.trashItems.filter((i) => i.file.path !== item.file.path);
      await this.renderView();
    } catch (error) {
      console.error("\u6062\u590D\u6587\u4EF6\u5931\u8D25:", error);
      new import_obsidian4.Notice(this.plugin.t("restoreFailed").replace("{message}", error.message));
    }
  }
  /**
   * 显示国际化确认对话框
   */
  showConfirmModal(message) {
    return new Promise((resolve) => {
      const modal = new import_obsidian4.Modal(this.plugin.app);
      let resolved = false;
      modal.onClose = () => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      };
      modal.contentEl.createDiv({ cls: "confirm-modal-content" }, (el) => {
        el.createDiv({ text: message, cls: "confirm-modal-message" });
        el.createDiv({ cls: "confirm-modal-buttons" }, (buttonsEl) => {
          const cancelBtn = new import_obsidian4.ButtonComponent(buttonsEl);
          cancelBtn.setButtonText(this.plugin.t("cancel"));
          cancelBtn.onClick(() => {
            resolved = true;
            modal.close();
            resolve(false);
          });
          const confirmBtn = new import_obsidian4.ButtonComponent(buttonsEl);
          confirmBtn.setButtonText(this.plugin.t("confirm"));
          confirmBtn.setCta();
          confirmBtn.onClick(() => {
            resolved = true;
            modal.close();
            resolve(true);
          });
        });
      });
      modal.open();
    });
  }
  /**
   * 确认删除单个文件
   */
  async confirmDelete(item) {
    const confirmed = await this.showConfirmModal(
      this.plugin.t("confirmDeleteFile").replace("{name}", item.name)
    );
    if (confirmed) {
      try {
        await this.plugin.app.vault.delete(item.file);
        new import_obsidian4.Notice(this.plugin.t("fileDeleted").replace("{name}", item.name));
        this.trashItems = this.trashItems.filter((i) => i.file.path !== item.file.path);
        await this.renderView();
      } catch (error) {
        console.error("\u5220\u9664\u6587\u4EF6\u5931\u8D25:", error);
        new import_obsidian4.Notice(this.plugin.t("deleteFailed"));
      }
    }
  }
  /**
   * 确认清空所有文件
   */
  async confirmClearAll() {
    if (this.trashItems.length === 0) {
      new import_obsidian4.Notice(this.plugin.t("trashEmpty"));
      return;
    }
    const confirmed = await this.showConfirmModal(
      this.plugin.t("confirmClearTrash").replace("{count}", String(this.trashItems.length))
    );
    if (confirmed) {
      const results = await Promise.all(
        this.trashItems.map(
          (item) => this.plugin.app.vault.delete(item.file).then(() => true).catch(() => false)
        )
      );
      const deleted = results.filter((r) => r).length;
      const errors = results.filter((r) => !r).length;
      if (deleted > 0) {
        new import_obsidian4.Notice(this.plugin.t("batchDeleteComplete").replace("{count}", String(deleted)));
      }
      if (errors > 0) {
        new import_obsidian4.Notice(this.plugin.t("batchDeleteComplete").replace("{count}", String(errors)) + " (" + this.plugin.t("error") + ")");
      }
      await this.loadTrashItems();
    }
  }
  /**
   * 获取文件图标
   */
  getFileIcon(ext) {
    const mediaType = getMediaType(`filename.${ext}`);
    switch (mediaType) {
      case "image":
        return "image";
      case "video":
        return "video";
      case "audio":
        return "music";
      case "document":
        return "file-text";
      default:
        return "file";
    }
  }
};

// view/DuplicateDetectionView.ts
var import_obsidian5 = require("obsidian");

// utils/perceptualHash.ts
var DEFAULT_IMAGE_LOAD_TIMEOUT = 8e3;
function getGrayscaleData(img, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const gray = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  return gray;
}
function dct2d(matrix, size, outputSize) {
  const result = new Array(outputSize * outputSize);
  for (let u = 0; u < outputSize; u++) {
    for (let v = 0; v < outputSize; v++) {
      let sum = 0;
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          sum += matrix[x * size + y] * Math.cos(Math.PI * (2 * x + 1) * u / (2 * size)) * Math.cos(Math.PI * (2 * y + 1) * v / (2 * size));
        }
      }
      result[u * outputSize + v] = sum;
    }
  }
  return result;
}
function computePHash(img) {
  const SIZE = 32;
  const LOW_FREQ = 8;
  const gray = getGrayscaleData(img, SIZE, SIZE);
  const dctCoeffs = dct2d(gray, SIZE, LOW_FREQ);
  const values = dctCoeffs.slice(1);
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  let hash = "";
  for (let i = 0; i < LOW_FREQ * LOW_FREQ; i++) {
    hash += dctCoeffs[i] > median ? "1" : "0";
  }
  return binaryToHex(hash);
}
function computeDHash(img) {
  const gray = getGrayscaleData(img, 9, 8);
  let hash = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      hash += gray[y * 9 + x] < gray[y * 9 + x + 1] ? "1" : "0";
    }
  }
  return binaryToHex(hash);
}
function binaryToHex(binary) {
  let hex = "";
  for (let i = 0; i < binary.length; i += 4) {
    hex += parseInt(binary.substring(i, i + 4), 2).toString(16);
  }
  return hex;
}
async function computePerceptualHash(imageSrc) {
  const img = await loadImage2(imageSrc);
  const pHash = computePHash(img);
  const dHash = computeDHash(img);
  return pHash + dHash;
}
function loadImage2(src, timeoutMs = DEFAULT_IMAGE_LOAD_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      img.src = "";
      reject(new Error(`Failed to load image (timeout): ${src}`));
    }, timeoutMs);
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
}
function hammingDistance(h1, h2) {
  if (h1.length !== h2.length) {
    throw new Error(`Hash length mismatch: ${h1.length} vs ${h2.length}`);
  }
  let distance = 0;
  for (let i = 0; i < h1.length; i++) {
    const n1 = parseInt(h1[i], 16);
    const n2 = parseInt(h2[i], 16);
    let xor = n1 ^ n2;
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}
function hashSimilarity(h1, h2) {
  const totalBits = h1.length * 4;
  const distance = hammingDistance(h1, h2);
  return Math.round((1 - distance / totalBits) * 100);
}
function findDuplicateGroups(hashMap, threshold = 90) {
  const entries = Array.from(hashMap.entries());
  const visited = /* @__PURE__ */ new Set();
  const groups = [];
  for (let i = 0; i < entries.length; i++) {
    const [path1, hash1] = entries[i];
    if (visited.has(path1)) continue;
    const group = {
      hash: hash1,
      files: [{ path: path1, hash: hash1, similarity: 100 }]
    };
    for (let j = i + 1; j < entries.length; j++) {
      const [path2, hash2] = entries[j];
      if (visited.has(path2)) continue;
      const similarity = hashSimilarity(hash1, hash2);
      if (similarity >= threshold) {
        group.files.push({ path: path2, hash: hash2, similarity });
        visited.add(path2);
      }
    }
    if (group.files.length > 1) {
      visited.add(path1);
      groups.push(group);
    }
  }
  return groups;
}

// view/DuplicateDetectionView.ts
var VIEW_TYPE_DUPLICATE_DETECTION = "duplicate-detection-view";
var DuplicateDetectionView = class extends import_obsidian5.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.duplicateGroups = [];
    this.isScanning = false;
    this.scanProgress = { current: 0, total: 0 };
    this.lastProgressAt = 0;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_DUPLICATE_DETECTION;
  }
  getDisplayText() {
    return this.plugin.t("duplicateDetection");
  }
  async onOpen() {
    let retries = 0;
    while (!this.contentEl && retries < 10) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      retries++;
    }
    if (!this.contentEl) {
      console.error("DuplicateDetectionView: contentEl not ready");
      return;
    }
    this.ensureStyles();
    this.isScanning = false;
    this.scanProgress = { current: 0, total: 0 };
    this.contentEl.addClass("duplicate-detection-view");
    await this.renderView();
  }
  async onClose() {
    this.isScanning = false;
  }
  /**
   * 渲染视图
   */
  async renderView() {
    if (!this.contentEl) return;
    this.ensureStyles();
    this.contentEl.empty();
    this.renderHeader();
    if (this.isScanning) {
      this.renderProgress();
      return;
    }
    if (this.duplicateGroups.length === 0) {
      const emptyState = this.contentEl.createDiv({ cls: "duplicate-empty-state" });
      emptyState.createDiv({
        cls: "duplicate-empty-text",
        text: this.plugin.t("noDuplicatesFound")
      });
      this.renderStartScanButton(emptyState, "duplicate-empty-action");
      return;
    }
    const totalDuplicates = this.duplicateGroups.reduce(
      (sum, g) => sum + g.files.length - 1,
      0
    );
    const statsBar = this.contentEl.createDiv({ cls: "duplicate-stats-bar" });
    statsBar.createSpan({
      text: this.plugin.t("duplicateGroupsFound", {
        groups: this.duplicateGroups.length,
        files: totalDuplicates
      }),
      cls: "duplicate-stats-count"
    });
    const cleanAllBtn = statsBar.createEl("button", { cls: "duplicate-action-button" });
    (0, import_obsidian5.setIcon)(cleanAllBtn, "broom");
    cleanAllBtn.createSpan({ text: ` ${this.plugin.t("quarantineAllDuplicates")}` });
    cleanAllBtn.addEventListener("click", () => this.quarantineAllDuplicates());
    const groupsContainer = this.contentEl.createDiv({ cls: "duplicate-groups" });
    for (let i = 0; i < this.duplicateGroups.length; i++) {
      this.renderDuplicateGroup(groupsContainer, this.duplicateGroups[i], i + 1);
    }
  }
  /**
   * 渲染头部
   */
  renderHeader() {
    const header = this.contentEl.createDiv({ cls: "duplicate-header" });
    header.createEl("h2", { text: this.plugin.t("duplicateDetection") });
    const desc = header.createDiv({ cls: "duplicate-header-description" });
    desc.createSpan({ text: this.plugin.t("duplicateDetectionDesc") });
    const actions = header.createDiv({ cls: "duplicate-header-actions" });
    this.renderStartScanButton(actions);
    actions.createSpan({
      cls: "duplicate-threshold-label",
      text: this.plugin.t("similarityThreshold", {
        value: this.plugin.settings.duplicateThreshold
      })
    });
  }
  renderStartScanButton(container, extraClass) {
    const cls = ["duplicate-action-button", "duplicate-action-button-primary"];
    if (extraClass) cls.push(extraClass);
    const scanBtn = container.createEl("button", { cls: cls.join(" ") });
    (0, import_obsidian5.setIcon)(scanBtn, "search");
    scanBtn.createSpan({ text: ` ${this.plugin.t("startScan")}` });
    scanBtn.disabled = this.isScanning;
    scanBtn.addEventListener("click", () => {
      void this.startScan();
    });
    return scanBtn;
  }
  /**
   * 渲染扫描进度
   */
  renderProgress() {
    const progressContainer = this.contentEl.createDiv({ cls: "duplicate-scan-progress" });
    const progressBar = progressContainer.createDiv({ cls: "duplicate-progress-bar" });
    const progressFill = progressBar.createDiv({ cls: "duplicate-progress-fill" });
    const percent = this.scanProgress.total > 0 ? Math.round(this.scanProgress.current / this.scanProgress.total * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressContainer.createDiv({
      cls: "duplicate-progress-text",
      text: this.plugin.t("scanProgress", {
        current: this.scanProgress.current,
        total: this.scanProgress.total
      })
    });
  }
  compareDuplicateFiles(pathA, pathB) {
    const fileA = this.app.vault.getAbstractFileByPath(pathA);
    const fileB = this.app.vault.getAbstractFileByPath(pathB);
    if (fileA instanceof import_obsidian5.TFile && fileB instanceof import_obsidian5.TFile) {
      return fileB.stat.mtime - fileA.stat.mtime || fileB.stat.size - fileA.stat.size || pathA.localeCompare(pathB);
    }
    if (fileA instanceof import_obsidian5.TFile) return -1;
    if (fileB instanceof import_obsidian5.TFile) return 1;
    return pathA.localeCompare(pathB);
  }
  normalizeDuplicateGroup(group) {
    return {
      ...group,
      files: [...group.files].sort((a, b) => this.compareDuplicateFiles(a.path, b.path))
    };
  }
  /**
   * 开始扫描
   */
  async startScan() {
    if (this.isScanning) {
      const now = Date.now();
      if (this.lastProgressAt && now - this.lastProgressAt > 15e3) {
        this.isScanning = false;
      } else {
        return;
      }
    }
    this.isScanning = true;
    this.duplicateGroups = [];
    this.lastProgressAt = Date.now();
    try {
      const imageFiles = [];
      if (this.plugin.fileIndex.isInitialized) {
        for (const entry of this.plugin.fileIndex.getFiles()) {
          if (getMediaType(entry.name) === "image") {
            const file = this.app.vault.getAbstractFileByPath(entry.path);
            if (file instanceof import_obsidian5.TFile) {
              imageFiles.push(file);
            }
          }
        }
      } else {
        const allFiles = await this.plugin.getAllImageFiles();
        imageFiles.push(...allFiles.filter((f) => getMediaType(f.name) === "image"));
      }
      this.scanProgress = { current: 0, total: imageFiles.length };
      this.lastProgressAt = Date.now();
      await this.renderView();
      const hashMap = /* @__PURE__ */ new Map();
      const BATCH_SIZE = 5;
      for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
        const batch = imageFiles.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (file) => {
          try {
            const src = this.app.vault.getResourcePath(file);
            const hash = await computePerceptualHash(src);
            hashMap.set(file.path, hash);
          } catch (error) {
            console.warn(`Hash computation failed for ${file.name}:`, error);
          }
        }));
        this.scanProgress.current = Math.min(i + BATCH_SIZE, imageFiles.length);
        this.lastProgressAt = Date.now();
        const progressFill = this.contentEl.querySelector(".duplicate-progress-fill");
        const progressText = this.contentEl.querySelector(".duplicate-progress-text");
        if (progressFill && progressText) {
          const percent = Math.round(this.scanProgress.current / this.scanProgress.total * 100);
          progressFill.style.width = `${percent}%`;
          progressText.textContent = this.plugin.t("scanProgress", {
            current: this.scanProgress.current,
            total: this.scanProgress.total
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      const threshold = this.plugin.settings.duplicateThreshold;
      this.duplicateGroups = findDuplicateGroups(hashMap, threshold).map((group) => this.normalizeDuplicateGroup(group));
      if (this.duplicateGroups.length === 0) {
        new import_obsidian5.Notice(this.plugin.t("noDuplicatesFound"));
      } else {
        const totalDuplicates = this.duplicateGroups.reduce(
          (sum, g) => sum + g.files.length - 1,
          0
        );
        new import_obsidian5.Notice(this.plugin.t("duplicatesFound", {
          groups: this.duplicateGroups.length,
          files: totalDuplicates
        }));
      }
    } catch (error) {
      console.error("Duplicate detection failed:", error);
      new import_obsidian5.Notice(this.plugin.t("scanError"));
    } finally {
      this.isScanning = false;
      await this.renderView();
    }
  }
  ensureStyles() {
    if (document.getElementById("obsidian-media-toolkit-styles") || document.getElementById("image-manager-styles")) {
      return;
    }
    void this.plugin.addStyle();
  }
  /**
   * 渲染单个重复组
   */
  renderDuplicateGroup(container, group, index) {
    group.files.sort((a, b) => this.compareDuplicateFiles(a.path, b.path));
    const groupEl = container.createDiv({ cls: "duplicate-group" });
    const groupHeader = groupEl.createDiv({ cls: "duplicate-group-header" });
    groupHeader.createSpan({
      cls: "duplicate-group-title",
      text: this.plugin.t("duplicateGroup", { index })
    });
    groupHeader.createSpan({
      cls: "duplicate-group-count",
      text: `${group.files.length} ${this.plugin.t("files")}`
    });
    const fileList = groupEl.createDiv({ cls: "duplicate-group-files" });
    for (let i = 0; i < group.files.length; i++) {
      const fileInfo = group.files[i];
      const file = this.app.vault.getAbstractFileByPath(fileInfo.path);
      if (!(file instanceof import_obsidian5.TFile)) continue;
      const fileEl = fileList.createDiv({
        cls: `duplicate-group-file ${i === 0 ? "duplicate-keep-suggestion" : "duplicate-file-suggestion"}`
      });
      const thumb = fileEl.createDiv({ cls: "duplicate-file-thumbnail" });
      const src = this.app.vault.getResourcePath(file);
      const img = thumb.createEl("img", {
        attr: { src, alt: file.name }
      });
      img.addEventListener("error", () => {
        thumb.empty();
        const icon = thumb.createDiv();
        (0, import_obsidian5.setIcon)(icon, "image");
      });
      const info = fileEl.createDiv({ cls: "duplicate-file-info" });
      info.createDiv({ cls: "duplicate-file-name", text: file.name });
      info.createDiv({ cls: "duplicate-file-path", text: file.path });
      const meta = info.createDiv({ cls: "duplicate-file-meta" });
      meta.createSpan({ text: formatFileSize(file.stat.size) });
      meta.createSpan({ text: ` | ${new Date(file.stat.mtime).toLocaleDateString()}` });
      meta.createSpan({
        cls: "duplicate-similarity-badge",
        text: ` ${fileInfo.similarity}%`
      });
      if (i === 0) {
        fileEl.createSpan({ cls: "duplicate-keep-badge", text: this.plugin.t("suggestKeep") });
      } else {
        const quarantineBtn = fileEl.createEl("button", { cls: "duplicate-quarantine-btn" });
        (0, import_obsidian5.setIcon)(quarantineBtn, "archive");
        quarantineBtn.createSpan({ text: ` ${this.plugin.t("quarantine")}` });
        quarantineBtn.addEventListener("click", async () => {
          const result = await this.plugin.safeDeleteFile(file);
          if (result) {
            group.files.splice(i, 1);
            if (group.files.length <= 1) {
              const idx = this.duplicateGroups.indexOf(group);
              if (idx >= 0) this.duplicateGroups.splice(idx, 1);
            }
            await this.renderView();
          }
        });
      }
    }
  }
  /**
   * 一键隔离所有重复项（每组保留最新版）
   */
  async quarantineAllDuplicates() {
    let totalQuarantined = 0;
    for (const group of this.duplicateGroups) {
      group.files.sort((a, b) => this.compareDuplicateFiles(a.path, b.path));
      for (let i = 1; i < group.files.length; i++) {
        const entry = group.files[i];
        const file = this.app.vault.getAbstractFileByPath(entry.path);
        if (!(file instanceof import_obsidian5.TFile)) continue;
        const result = await this.plugin.safeDeleteFile(file);
        if (result) totalQuarantined++;
      }
    }
    new import_obsidian5.Notice(this.plugin.t("duplicatesQuarantined", { count: totalQuarantined }));
    this.duplicateGroups = [];
    await this.renderView();
  }
};

// view/MediaPreviewModal.ts
var import_obsidian6 = require("obsidian");
var MediaPreviewModal = class extends import_obsidian6.Modal {
  constructor(app, plugin, file, allFiles = []) {
    super(app);
    this.currentIndex = 0;
    this.allFiles = [];
    this.keydownHandler = null;
    this.plugin = plugin;
    this.file = file;
    this.allFiles = allFiles.length > 0 ? allFiles : [file];
    const idx = this.allFiles.findIndex((f) => f.path === file.path);
    this.currentIndex = idx >= 0 ? idx : 0;
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("media-preview-modal");
    const closeBtn = contentEl.createDiv({ cls: "preview-close" });
    closeBtn.textContent = "\xD7";
    closeBtn.addEventListener("click", () => this.close());
    const container = contentEl.createDiv({ cls: "preview-container" });
    this.renderMedia(container);
    if (this.allFiles.length > 1) {
      this.renderNavigation(container);
    }
    this.renderInfoBar(contentEl);
    if (this.plugin.settings.enableKeyboardNav) {
      this.registerKeyboardNav();
    }
  }
  /**
   * 渲染媒体
   */
  renderMedia(container) {
    container.empty();
    const file = this.allFiles[this.currentIndex];
    const ext = file.extension.toLowerCase();
    const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext);
    const isVideo = ["mp4", "mov", "avi", "mkv", "webm"].includes(ext);
    const isAudio = ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext);
    const isPdf = ext === "pdf";
    if (isImage) {
      const img = container.createEl("img", {
        cls: "preview-image",
        attr: { src: this.app.vault.getResourcePath(file) }
      });
      img.addEventListener("error", () => {
        container.empty();
        container.createDiv({
          cls: "preview-error",
          text: this.plugin.t("imageLoadError") || "Failed to load image"
        });
      });
    } else if (isVideo) {
      const video = container.createEl("video", {
        cls: "preview-video",
        attr: { controls: "true" }
      });
      video.src = this.app.vault.getResourcePath(file);
    } else if (isAudio) {
      const audio = container.createEl("audio", {
        cls: "preview-audio",
        attr: { controls: "true" }
      });
      audio.src = this.app.vault.getResourcePath(file);
    } else if (isPdf) {
      const iframe = container.createEl("iframe", {
        cls: "preview-pdf",
        attr: {
          src: this.app.vault.getResourcePath(file),
          sandbox: "allow-scripts"
        }
      });
    } else {
      container.createDiv({ cls: "preview-unsupported", text: this.plugin.t("unsupportedFileType") });
    }
  }
  /**
   * 渲染导航控件
   */
  renderNavigation(container) {
    const nav = container.createDiv({ cls: "preview-nav" });
    const prevBtn = nav.createEl("button", { cls: "nav-button prev" });
    prevBtn.textContent = "\u2039";
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.prev();
    });
    nav.createSpan({
      text: `${this.currentIndex + 1} / ${this.allFiles.length}`,
      cls: "nav-info"
    });
    const nextBtn = nav.createEl("button", { cls: "nav-button next" });
    nextBtn.textContent = "\u203A";
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.next();
    });
  }
  /**
   * 渲染信息栏
   */
  renderInfoBar(contentEl) {
    const file = this.allFiles[this.currentIndex];
    const infoBar = contentEl.createDiv({ cls: "preview-info-bar" });
    infoBar.createDiv({ cls: "info-name", text: file.name });
    const actions = infoBar.createDiv({ cls: "info-actions" });
    const copyPathBtn = actions.createEl("button");
    copyPathBtn.textContent = this.plugin.t("copyPathBtn");
    copyPathBtn.addEventListener("click", () => {
      void navigator.clipboard.writeText(file.path).then(() => {
        new import_obsidian6.Notice(this.plugin.t("pathCopied"));
      }).catch((error) => {
        console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
        new import_obsidian6.Notice(this.plugin.t("error"));
      });
    });
    const copyLinkBtn = actions.createEl("button");
    copyLinkBtn.textContent = this.plugin.t("copyLinkBtn");
    copyLinkBtn.addEventListener("click", () => {
      const link = `[[${file.name}]]`;
      void navigator.clipboard.writeText(link).then(() => {
        new import_obsidian6.Notice(this.plugin.t("linkCopied"));
      }).catch((error) => {
        console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
        new import_obsidian6.Notice(this.plugin.t("error"));
      });
    });
    const findBtn = actions.createEl("button");
    findBtn.textContent = this.plugin.t("findInNotes");
    findBtn.addEventListener("click", () => {
      this.close();
      this.plugin.openImageInNotes(file);
    });
  }
  /**
   * 注册键盘导航
   */
  registerKeyboardNav() {
    this.keydownHandler = (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.prev();
          break;
        case "ArrowRight":
          this.next();
          break;
        case "Escape":
          this.close();
          break;
      }
    };
    this.modalEl.addEventListener("keydown", this.keydownHandler);
  }
  /**
   * 上一张
   */
  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateContent();
    }
  }
  /**
   * 下一张
   */
  next() {
    if (this.currentIndex < this.allFiles.length - 1) {
      this.currentIndex++;
      this.updateContent();
    }
  }
  /**
   * 更新内容
   */
  updateContent() {
    if (!this.contentEl) {
      return;
    }
    const container = this.contentEl.querySelector(".preview-container");
    if (container) {
      this.renderMedia(container);
      const oldNav = container.querySelector(".preview-nav");
      if (oldNav) oldNav.remove();
      if (this.allFiles.length > 1) {
        this.renderNavigation(container);
      }
    }
    const oldInfoBar = this.contentEl.querySelector(".preview-info-bar");
    if (oldInfoBar) oldInfoBar.remove();
    this.renderInfoBar(this.contentEl);
  }
  onClose() {
    const { contentEl, modalEl } = this;
    if (this.keydownHandler) {
      modalEl.removeEventListener("keydown", this.keydownHandler);
      this.keydownHandler = null;
    }
    contentEl.empty();
  }
};

// settings.ts
var import_obsidian7 = require("obsidian");
var DEFAULT_SETTINGS = {
  imageFolder: "",
  thumbnailSize: "medium",
  showImageInfo: true,
  sortBy: "name",
  sortOrder: "asc",
  autoRefresh: true,
  defaultAlignment: "center",
  useTrashFolder: true,
  trashFolder: "obsidian-media-toolkit-trash",
  autoCleanupTrash: false,
  trashCleanupDays: 30,
  // 新增默认值
  enableImages: true,
  enableVideos: true,
  enableAudio: true,
  enablePDF: true,
  pageSize: 50,
  enablePreviewModal: true,
  enableKeyboardNav: true,
  // 国际化设置
  language: "system",
  // Quarantine 安全扫描
  safeScanEnabled: false,
  safeScanUnrefDays: 30,
  safeScanMinSize: 5 * 1024 * 1024,
  // 5MB
  // 去重
  duplicateThreshold: 90,
  // 自动整理
  organizeRules: [
    {
      name: "Default",
      enabled: false,
      pathTemplate: "Media/{year}/{month}",
      renameTemplate: "{name}",
      matchExtensions: "jpg,jpeg,png,gif,webp"
    }
  ],
  // 媒体处理
  defaultProcessQuality: 80,
  defaultProcessFormat: "webp",
  watermarkText: ""
};
var SettingsTab = class extends import_obsidian7.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  // 翻译辅助方法
  t(key) {
    return this.plugin.t(key);
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: this.t("pluginSettings") });
    new import_obsidian7.Setting(containerEl).setName(this.t("mediaFolder")).setDesc(this.t("mediaFolderDesc")).addText((text) => text.setPlaceholder("attachments/media").setValue(this.plugin.settings.imageFolder).onChange(async (value) => {
      this.plugin.settings.imageFolder = normalizeVaultPath(value);
      this.plugin.clearCache();
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("thumbnailSize")).setDesc(this.t("thumbnailSizeDesc")).addDropdown((dropdown) => dropdown.addOption("small", this.t("thumbnailSmall")).addOption("medium", this.t("thumbnailMedium")).addOption("large", this.t("thumbnailLarge")).setValue(this.plugin.settings.thumbnailSize).onChange(async (value) => {
      this.plugin.settings.thumbnailSize = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("defaultSortBy")).setDesc(this.t("sortByDesc")).addDropdown((dropdown) => dropdown.addOption("name", this.t("sortByName")).addOption("date", this.t("sortByDate")).addOption("size", this.t("sortBySize")).setValue(this.plugin.settings.sortBy).onChange(async (value) => {
      this.plugin.settings.sortBy = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("sortOrder")).setDesc(this.t("sortOrderDesc")).addDropdown((dropdown) => dropdown.addOption("asc", this.t("sortAsc")).addOption("desc", this.t("sortDesc")).setValue(this.plugin.settings.sortOrder).onChange(async (value) => {
      this.plugin.settings.sortOrder = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("showImageInfo")).setDesc(this.t("showImageInfoDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.showImageInfo).onChange(async (value) => {
      this.plugin.settings.showImageInfo = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("autoRefresh")).setDesc(this.t("autoRefreshDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.autoRefresh).onChange(async (value) => {
      this.plugin.settings.autoRefresh = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("defaultAlignment")).setDesc(this.t("alignmentDesc")).addDropdown((dropdown) => dropdown.addOption("left", this.t("alignLeft")).addOption("center", this.t("alignCenter")).addOption("right", this.t("alignRight")).setValue(this.plugin.settings.defaultAlignment).onChange(async (value) => {
      this.plugin.settings.defaultAlignment = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("safeDeleteSettings") });
    new import_obsidian7.Setting(containerEl).setName(this.t("useTrashFolder")).setDesc(this.t("useTrashFolderDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.useTrashFolder).onChange(async (value) => {
      this.plugin.settings.useTrashFolder = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("trashFolderPath")).setDesc(this.t("trashFolderPathDesc")).addText((text) => text.setPlaceholder("obsidian-media-toolkit-trash").setValue(this.plugin.settings.trashFolder).onChange(async (value) => {
      this.plugin.settings.trashFolder = normalizeVaultPath(value);
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("autoCleanupTrash")).setDesc(this.t("autoCleanupTrashDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.autoCleanupTrash).onChange(async (value) => {
      this.plugin.settings.autoCleanupTrash = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("cleanupDays")).setDesc(this.t("cleanupDaysDesc")).addText((text) => text.setPlaceholder("30").setValue(String(this.plugin.settings.trashCleanupDays)).onChange(async (value) => {
      const days = parseInt(value, 10);
      if (!isNaN(days) && days > 0) {
        this.plugin.settings.trashCleanupDays = days;
        await this.plugin.saveSettings();
      }
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("safeScanSettings") });
    new import_obsidian7.Setting(containerEl).setName(this.t("safeScan")).setDesc(this.t("safeScanEnabledDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.safeScanEnabled).onChange(async (value) => {
      this.plugin.settings.safeScanEnabled = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("safeScanUnrefDays")).setDesc(this.t("safeScanUnrefDaysDesc")).addText((text) => text.setPlaceholder("30").setValue(String(this.plugin.settings.safeScanUnrefDays)).onChange(async (value) => {
      const days = parseInt(value, 10);
      if (!isNaN(days) && days > 0) {
        this.plugin.settings.safeScanUnrefDays = days;
        await this.plugin.saveSettings();
      }
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("safeScanMinSize")).setDesc(this.t("safeScanMinSizeDesc")).addText((text) => text.setPlaceholder("5").setValue(String(Number((this.plugin.settings.safeScanMinSize / (1024 * 1024)).toFixed(2)))).onChange(async (value) => {
      const sizeMb = parseFloat(value);
      if (!isNaN(sizeMb) && sizeMb >= 0) {
        this.plugin.settings.safeScanMinSize = Math.round(sizeMb * 1024 * 1024);
        await this.plugin.saveSettings();
      }
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("duplicateDetectionSettings") });
    new import_obsidian7.Setting(containerEl).setName(this.t("duplicateThresholdSetting")).setDesc(this.t("duplicateThresholdDesc")).addText((text) => text.setPlaceholder("90").setValue(String(this.plugin.settings.duplicateThreshold)).onChange(async (value) => {
      const threshold = parseInt(value, 10);
      if (!isNaN(threshold) && threshold >= 50 && threshold <= 100) {
        this.plugin.settings.duplicateThreshold = threshold;
        await this.plugin.saveSettings();
      }
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("mediaTypes") });
    new import_obsidian7.Setting(containerEl).setName(this.t("enableImageSupport")).setDesc(this.t("enableImageSupportDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enableImages).onChange(async (value) => {
      this.plugin.settings.enableImages = value;
      this.plugin.clearCache();
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("enableVideoSupport")).setDesc(this.t("enableVideoSupportDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enableVideos).onChange(async (value) => {
      this.plugin.settings.enableVideos = value;
      this.plugin.clearCache();
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("enableAudioSupport")).setDesc(this.t("enableAudioSupportDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enableAudio).onChange(async (value) => {
      this.plugin.settings.enableAudio = value;
      this.plugin.clearCache();
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("enablePDFSupport")).setDesc(this.t("enablePDFSupportDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enablePDF).onChange(async (value) => {
      this.plugin.settings.enablePDF = value;
      this.plugin.clearCache();
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("viewSettings") });
    new import_obsidian7.Setting(containerEl).setName(this.t("interfaceLanguage")).setDesc(this.t("languageDesc")).addDropdown((dropdown) => dropdown.addOption("system", this.t("languageSystem")).addOption("zh", "\u4E2D\u6587").addOption("en", "English").setValue(this.plugin.settings.language).onChange(async (value) => {
      this.plugin.settings.language = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("pageSize")).setDesc(this.t("pageSizeDesc")).addText((text) => text.setPlaceholder("50").setValue(String(this.plugin.settings.pageSize)).onChange(async (value) => {
      const size = parseInt(value, 10);
      if (!isNaN(size) && size > 0) {
        this.plugin.settings.pageSize = size;
        await this.plugin.saveSettings();
      }
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("enablePreviewModal")).setDesc(this.t("enablePreviewModalDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enablePreviewModal).onChange(async (value) => {
      this.plugin.settings.enablePreviewModal = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian7.Setting(containerEl).setName(this.t("enableKeyboardNav")).setDesc(this.t("enableKeyboardNavDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enableKeyboardNav).onChange(async (value) => {
      this.plugin.settings.enableKeyboardNav = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("keyboardShortcuts") });
    containerEl.createEl("p", {
      text: this.t("shortcutsDesc"),
      cls: "settings-description"
    });
    containerEl.createEl("ul", { cls: "settings-list" }).createEl("li", { text: this.t("shortcutOpenLibrary") });
    containerEl.createEl("ul", { cls: "settings-list" }).createEl("li", { text: this.t("shortcutFindUnreferenced") });
    containerEl.createEl("ul", { cls: "settings-list" }).createEl("li", { text: this.t("shortcutOpenTrash") });
    containerEl.createEl("h3", { text: this.t("commands") });
    containerEl.createEl("p", {
      text: this.t("commandsDesc"),
      cls: "settings-description"
    });
    containerEl.createEl("ul", { cls: "settings-list" }).createEl("li", { text: this.t("cmdOpenLibrary") });
    containerEl.createEl("ul", { cls: "settings-list" }).createEl("li", { text: this.t("cmdFindUnreferenced") });
    containerEl.createEl("ul", { cls: "settings-list" }).createEl("li", { text: this.t("cmdTrashManagement") });
    containerEl.createEl("ul", { cls: "settings-list" }).createEl("li", { text: this.t("cmdAlignLeft") });
    containerEl.createEl("ul", { cls: "settings-list" }).createEl("li", { text: this.t("cmdAlignCenter") });
    containerEl.createEl("ul", { cls: "settings-list" }).createEl("li", { text: this.t("cmdAlignRight") });
  }
};

// utils/imageAlignment.ts
var ImageAlignment = class {
  /**
   * 去除已存在的对齐包装，避免重复嵌套
   */
  static stripExistingAlignment(markdown) {
    let cleanMarkdown = markdown.trim();
    const blockMatch = cleanMarkdown.match(/^===\s*(left|center|right)\s*===\s*([\s\S]*?)\s*===$/i);
    if (blockMatch) {
      return blockMatch[2].trim();
    }
    cleanMarkdown = cleanMarkdown.replace(/^\{\s*align\s*=\s*(left|center|right)\s*\}\s*/i, "").trim();
    const linkMatch = cleanMarkdown.match(/^!?\[\[([^\]|]+)\|([^\]]+)\]\]$/);
    if (linkMatch) {
      const alignment = linkMatch[2].toLowerCase();
      if (alignment === "left" || alignment === "center" || alignment === "right") {
        return `![[${linkMatch[1]}]]`;
      }
    }
    cleanMarkdown = cleanMarkdown.replace(/^\{\s*\.(left|center|right)\s*\}$/i, "").trim();
    return cleanMarkdown;
  }
  /**
   * 为图片Markdown语法添加对齐属性
   * 新语法: ![[image.png|center]]
   */
  static applyAlignment(markdown, alignment) {
    const cleanMarkdown = this.stripExistingAlignment(markdown).trim();
    const wikiLinkMatch = cleanMarkdown.match(/^!?\[\[([^\]]+)\]\]$/);
    if (wikiLinkMatch) {
      const imagePath = wikiLinkMatch[1];
      return `![[${imagePath}|${alignment}]]`;
    }
    const mdImageMatch = cleanMarkdown.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (mdImageMatch) {
      const altText = mdImageMatch[1];
      const imagePath = mdImageMatch[2];
      return `![[${imagePath}|${alignment}]]`;
    }
    return markdown;
  }
  /**
   * 从图片语法中提取对齐方式
   * 支持: ![[image.png|center]], ===center=== 块语法, {align=center} 风格
   */
  static getAlignment(markdown) {
    const linkMatch = markdown.match(/!?\[\[([^\]|]+)\|([^\]]+)\]\]/);
    if (linkMatch) {
      const alignment = linkMatch[2].toLowerCase();
      if (alignment === "left" || alignment === "center" || alignment === "right") {
        return alignment;
      }
    }
    const blockMatch = markdown.match(/^===\s*(left|center|right)\s*===/i);
    if (blockMatch) {
      const alignment = blockMatch[1].toLowerCase();
      if (alignment === "left" || alignment === "center" || alignment === "right") {
        return alignment;
      }
    }
    const alignMatch = markdown.match(/{\s*align\s*=\s*(\w+)\s*}/i);
    if (alignMatch) {
      const alignment = alignMatch[1].toLowerCase();
      if (alignment === "left" || alignment === "center" || alignment === "right") {
        return alignment;
      }
    }
    const classMatch = markdown.match(/\{\s*\.(left|center|right)\s*\}/i);
    if (classMatch) {
      return classMatch[1].toLowerCase();
    }
    return null;
  }
  /**
   * 生成带对齐样式的HTML图片标签
   */
  static toHTML(imagePath, altText = "", alignment = "center") {
    const styleMap = {
      "left": "display: block; margin-left: 0; margin-right: auto;",
      "center": "display: block; margin-left: auto; margin-right: auto;",
      "right": "display: block; margin-left: auto; margin-right: 0;"
    };
    return `<img src="${escapeHtmlAttr(imagePath)}" alt="${escapeHtmlAttr(altText)}" style="${styleMap[alignment]}" />`;
  }
};

// utils/postProcessor.ts
var import_obsidian8 = require("obsidian");
var AlignmentPostProcessor = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  /**
   * 注册 PostProcessor
   */
  register() {
    this.plugin.registerMarkdownPostProcessor((element, context) => {
      this.processAlignment(element);
    });
  }
  /**
   * 处理对齐语法
   */
  processAlignment(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    const nodesToProcess = [];
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent || "";
      const parentElement = node.parentElement;
      if (!parentElement) continue;
      if (text.includes("===") && (text.includes("center") || text.includes("left") || text.includes("right"))) {
        nodesToProcess.push({ node, parent: parentElement });
      } else if (text.includes("|center") || text.includes("|left") || text.includes("|right")) {
        nodesToProcess.push({ node, parent: parentElement });
      }
    }
    for (const { node: node2, parent } of nodesToProcess) {
      this.processNode(node2, parent);
    }
  }
  /**
   * 处理单个节点
   */
  processNode(node, parent) {
    const text = node.textContent || "";
    let lastIndex = 0;
    const fragment = document.createDocumentFragment();
    const newLinkRegex = /!?\[\[([^|\]]+)\|(center|left|right)\]\]/gi;
    let match;
    while ((match = newLinkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
      }
      const imagePath = match[1].trim();
      const alignment = match[2].toLowerCase();
      const alignContainer = document.createElement("div");
      alignContainer.className = `alignment-${alignment}`;
      alignContainer.style.textAlign = alignment;
      alignContainer.style.margin = "10px 0";
      this.renderImageSync(`![[${imagePath}]]`, alignContainer);
      fragment.appendChild(alignContainer);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex === 0) {
      const blockRegex = /===\s*(center|left|right)\s*===\s*([\s\S]*?)\s*===/gi;
      lastIndex = 0;
      while ((match = blockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
        }
        const alignment = match[1].toLowerCase();
        const content = match[2].trim();
        const alignContainer = document.createElement("div");
        alignContainer.className = `alignment-${alignment}`;
        alignContainer.style.textAlign = alignment;
        alignContainer.style.margin = "10px 0";
        this.renderImageSync(content, alignContainer);
        fragment.appendChild(alignContainer);
        lastIndex = match.index + match[0].length;
      }
    }
    if (lastIndex === 0 && fragment.childNodes.length === 0) {
      return;
    }
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }
    if (parent && fragment.childNodes.length > 0) {
      parent.replaceChild(fragment, node);
    }
  }
  /**
   * 同步渲染图片
   */
  renderImageSync(content, container) {
    const wikiLinkRegex = /\[\[([^\]|]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:\|[^\]]+)?\]\]/gi;
    const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    const images = [];
    while ((match = wikiLinkRegex.exec(content)) !== null) {
      const fileName = match[1];
      images.push({ src: fileName, alt: fileName });
    }
    while ((match = markdownImageRegex.exec(content)) !== null) {
      images.push({ alt: match[1], src: match[2] });
    }
    for (const img of images) {
      if (!isSafeUrl(img.src)) continue;
      const imgEl = document.createElement("img");
      imgEl.alt = img.alt;
      if (!img.src.startsWith("http")) {
        const normalizedSrc = normalizeVaultPath(img.src);
        if (!isPathSafe(normalizedSrc)) continue;
        const file = this.plugin.app.vault.getAbstractFileByPath(normalizedSrc);
        if (file && file instanceof import_obsidian8.TFile) {
          imgEl.src = this.plugin.app.vault.getResourcePath(file);
        } else {
          const attachmentsPath = this.findFileInVault(normalizedSrc);
          if (attachmentsPath) {
            imgEl.src = attachmentsPath;
          } else {
            continue;
          }
        }
      } else {
        imgEl.src = img.src;
      }
      imgEl.style.maxWidth = "100%";
      imgEl.style.height = "auto";
      container.appendChild(imgEl);
    }
  }
  /**
   * 在 Vault 中查找文件
   */
  findFileInVault(fileName) {
    const normalizedFileName = normalizeVaultPath(fileName);
    const files = this.plugin.app.vault.getFiles();
    for (const file of files) {
      if (file.name === normalizedFileName || file.path.endsWith(normalizedFileName)) {
        return this.plugin.app.vault.getResourcePath(file);
      }
    }
    return null;
  }
};

// utils/i18n.ts
var zh = {
  // 通用
  ok: "\u786E\u5B9A",
  cancel: "\u53D6\u6D88",
  delete: "\u5220\u9664",
  restore: "\u6062\u590D",
  confirm: "\u786E\u8BA4",
  success: "\u6210\u529F",
  error: "\u9519\u8BEF",
  // 视图名称
  mediaLibrary: "\u5A92\u4F53\u5E93",
  unreferencedMedia: "\u672A\u5F15\u7528\u5A92\u4F53",
  trashManagement: "\u9694\u79BB\u6587\u4EF6\u7BA1\u7406",
  // 媒体库
  totalMediaFiles: "\u5171 {count} \u4E2A\u5A92\u4F53\u6587\u4EF6",
  noMediaFiles: "\u672A\u627E\u5230\u5A92\u4F53\u6587\u4EF6",
  allMediaTypesDisabled: "\u6240\u6709\u5A92\u4F53\u7C7B\u578B\u5DF2\u88AB\u7981\u7528\uFF0C\u8BF7\u5230\u8BBE\u7F6E\u4E2D\u542F\u7528\u81F3\u5C11\u4E00\u79CD\u5A92\u4F53\u7C7B\u578B",
  searchPlaceholder: "\u641C\u7D22\u6587\u4EF6\u540D...",
  searchResults: "\u627E\u5230 {count} \u4E2A\u7ED3\u679C",
  // 未引用媒体
  unreferencedFound: "\u627E\u5230 {count} \u4E2A\u672A\u5F15\u7528\u7684\u5A92\u4F53\u6587\u4EF6",
  allMediaReferenced: "\u592A\u68D2\u4E86\uFF01\u6240\u6709\u5A92\u4F53\u6587\u4EF6\u90FD\u5DF2\u88AB\u5F15\u7528",
  deleteToTrash: "\u6587\u4EF6\u5C06\u88AB\u79FB\u5165\u9694\u79BB\u6587\u4EF6\u5939",
  // 隔离文件夹
  trashEmpty: "\u9694\u79BB\u6587\u4EF6\u5939\u4E3A\u7A7A",
  originalPath: "\u539F\u59CB\u4F4D\u7F6E",
  deletedAt: "\u5220\u9664\u65F6\u95F4",
  confirmClearAll: "\u786E\u5B9A\u8981\u6E05\u7A7A\u9694\u79BB\u6587\u4EF6\u5939\u5417\uFF1F",
  // 操作
  openInNotes: "\u5728\u7B14\u8BB0\u4E2D\u67E5\u627E",
  copyPath: "\u590D\u5236\u6587\u4EF6\u8DEF\u5F84",
  copyLink: "\u590D\u5236Markdown\u94FE\u63A5",
  openOriginal: "\u6253\u5F00\u539F\u59CB\u6587\u4EF6",
  preview: "\u9884\u89C8",
  // 快捷键
  shortcuts: "\u5FEB\u6377\u952E",
  openLibrary: "\u6253\u5F00\u5A92\u4F53\u5E93",
  findUnreferenced: "\u67E5\u627E\u672A\u5F15\u7528\u5A92\u4F53",
  openTrash: "\u6253\u5F00\u9694\u79BB\u6587\u4EF6\u7BA1\u7406",
  // 扫描进度
  scanningReferences: "\u6B63\u5728\u626B\u63CF\u5F15\u7528",
  scanComplete: "\u626B\u63CF\u5B8C\u6210",
  filesScanned: "\u4E2A\u6587\u4EF6\u5DF2\u626B\u63CF",
  // 批量操作
  batchDeleteComplete: "\u5DF2\u5220\u9664 {count} \u4E2A\u6587\u4EF6",
  batchDeleteProgress: "\u6B63\u5728\u5220\u9664 {current}/{total}",
  batchRestoreComplete: "\u5DF2\u6062\u590D {count} \u4E2A\u6587\u4EF6",
  // 设置页面
  pluginSettings: "\u5A92\u4F53\u5DE5\u5177\u7BB1\u63D2\u4EF6\u8BBE\u7F6E",
  mediaFolder: "\u5A92\u4F53\u6587\u4EF6\u5939",
  mediaFolderDesc: "\u6307\u5B9A\u8981\u626B\u63CF\u7684\u5A92\u4F53\u6587\u4EF6\u5939\u8DEF\u5F84\uFF08\u7559\u7A7A\u5219\u626B\u63CF\u6574\u4E2A\u5E93\uFF09",
  thumbnailSize: "\u7F29\u7565\u56FE\u5927\u5C0F",
  thumbnailSizeDesc: "\u9009\u62E9\u5A92\u4F53\u5E93\u89C6\u56FE\u4E2D\u7F29\u7565\u56FE\u7684\u663E\u793A\u5927\u5C0F",
  thumbnailSmall: "\u5C0F (100px)",
  thumbnailMedium: "\u4E2D (150px)",
  thumbnailLarge: "\u5927 (200px)",
  defaultSortBy: "\u9ED8\u8BA4\u6392\u5E8F\u65B9\u5F0F",
  sortByDesc: "\u9009\u62E9\u56FE\u7247\u7684\u9ED8\u8BA4\u6392\u5E8F\u65B9\u5F0F",
  sortByName: "\u6309\u540D\u79F0",
  sortByDate: "\u6309\u4FEE\u6539\u65E5\u671F",
  sortBySize: "\u6309\u6587\u4EF6\u5927\u5C0F",
  sortOrder: "\u6392\u5E8F\u987A\u5E8F",
  sortOrderDesc: "\u9009\u62E9\u5347\u5E8F\u6216\u964D\u5E8F",
  sortAsc: "\u5347\u5E8F",
  sortDesc: "\u964D\u5E8F",
  showImageInfo: "\u663E\u793A\u56FE\u7247\u4FE1\u606F",
  showImageInfoDesc: "\u5728\u56FE\u7247\u7F29\u7565\u56FE\u4E0B\u65B9\u663E\u793A\u6587\u4EF6\u540D\u548C\u5927\u5C0F",
  autoRefresh: "\u81EA\u52A8\u5237\u65B0",
  autoRefreshDesc: "\u5F53\u5E93\u4E2D\u7684\u56FE\u7247\u53D1\u751F\u53D8\u5316\u65F6\u81EA\u52A8\u5237\u65B0\u89C6\u56FE",
  defaultAlignment: "\u9ED8\u8BA4\u56FE\u7247\u5BF9\u9F50\u65B9\u5F0F",
  alignmentDesc: "\u63D2\u5165\u56FE\u7247\u65F6\u7684\u9ED8\u8BA4\u5BF9\u9F50\u65B9\u5F0F",
  alignLeft: "\u5C45\u5DE6",
  alignCenter: "\u5C45\u4E2D",
  alignRight: "\u5C45\u53F3",
  safeDeleteSettings: "\u5B89\u5168\u5220\u9664\u8BBE\u7F6E",
  useTrashFolder: "\u4F7F\u7528\u9694\u79BB\u6587\u4EF6\u5939",
  useTrashFolderDesc: "\u5220\u9664\u6587\u4EF6\u65F6\u5148\u79FB\u5165\u9694\u79BB\u6587\u4EF6\u5939\uFF0C\u800C\u4E0D\u662F\u76F4\u63A5\u5220\u9664",
  trashFolderPath: "\u9694\u79BB\u6587\u4EF6\u5939",
  trashFolderPathDesc: "\u9694\u79BB\u6587\u4EF6\u5939\u7684\u8DEF\u5F84\uFF08\u76F8\u5BF9\u8DEF\u5F84\uFF09",
  autoCleanupTrash: "\u81EA\u52A8\u6E05\u7406\u9694\u79BB\u6587\u4EF6\u5939",
  autoCleanupTrashDesc: "\u81EA\u52A8\u6E05\u7406\u9694\u79BB\u6587\u4EF6\u5939\u4E2D\u7684\u65E7\u6587\u4EF6",
  autoCleanupComplete: "\u81EA\u52A8\u6E05\u7406\u5B8C\u6210\uFF0C\u5DF2\u5220\u9664 {count} \u4E2A\u6587\u4EF6",
  cleanupDays: "\u6E05\u7406\u5929\u6570",
  cleanupDaysDesc: "\u9694\u79BB\u6587\u4EF6\u5939\u4E2D\u7684\u6587\u4EF6\u8D85\u8FC7\u6B64\u5929\u6570\u540E\u5C06\u81EA\u52A8\u5220\u9664",
  mediaTypes: "\u5A92\u4F53\u7C7B\u578B",
  enableImageSupport: "\u542F\u7528\u56FE\u7247\u652F\u6301",
  enableImageSupportDesc: "\u5728\u5A92\u4F53\u5E93\u4E2D\u663E\u793A\u56FE\u7247\u6587\u4EF6 (png, jpg, gif, webp, svg, bmp)",
  enableVideoSupport: "\u542F\u7528\u89C6\u9891\u652F\u6301",
  enableVideoSupportDesc: "\u5728\u5A92\u4F53\u5E93\u4E2D\u663E\u793A\u89C6\u9891\u6587\u4EF6 (mp4, mov, avi, mkv, webm)",
  enableAudioSupport: "\u542F\u7528\u97F3\u9891\u652F\u6301",
  enableAudioSupportDesc: "\u5728\u5A92\u4F53\u5E93\u4E2D\u663E\u793A\u97F3\u9891\u6587\u4EF6 (mp3, wav, ogg, m4a, flac)",
  enablePDFSupport: "\u542F\u7528 PDF \u652F\u6301",
  enablePDFSupportDesc: "\u5728\u5A92\u4F53\u5E93\u4E2D\u663E\u793A PDF \u6587\u4EF6",
  viewSettings: "\u89C6\u56FE\u8BBE\u7F6E",
  interfaceLanguage: "\u754C\u9762\u8BED\u8A00",
  languageDesc: "\u9009\u62E9\u63D2\u4EF6\u754C\u9762\u663E\u793A\u7684\u8BED\u8A00",
  languageSystem: "\u8DDF\u968F\u7CFB\u7EDF",
  pageSize: "\u5206\u9875\u5927\u5C0F",
  pageSizeDesc: "\u5A92\u4F53\u5E93\u4E2D\u6BCF\u9875\u663E\u793A\u7684\u6587\u4EF6\u6570\u91CF",
  enablePreviewModal: "\u542F\u7528\u9884\u89C8 Modal",
  enablePreviewModalDesc: "\u70B9\u51FB\u5A92\u4F53\u6587\u4EF6\u65F6\u6253\u5F00\u9884\u89C8\u7A97\u53E3",
  enableKeyboardNav: "\u542F\u7528\u952E\u76D8\u5BFC\u822A",
  enableKeyboardNavDesc: "\u5728\u9884\u89C8\u7A97\u53E3\u4E2D\u4F7F\u7528\u65B9\u5411\u952E\u5207\u6362\u56FE\u7247",
  safeScanSettings: "\u5B89\u5168\u626B\u63CF",
  safeScanEnabledDesc: "\u542F\u7528\u540E\u53EF\u5728\u9694\u79BB\u6587\u4EF6\u7BA1\u7406\u4E2D\u6267\u884C\u6761\u4EF6\u626B\u63CF",
  safeScanUnrefDays: "\u672A\u5F15\u7528\u5929\u6570",
  safeScanUnrefDaysDesc: "\u4EC5\u626B\u63CF\u8D85\u8FC7\u6B64\u5929\u6570\u672A\u88AB\u5F15\u7528\u7684\u5A92\u4F53\u6587\u4EF6",
  safeScanMinSize: "\u6700\u5C0F\u6587\u4EF6\u5927\u5C0F (MB)",
  safeScanMinSizeDesc: "\u4EC5\u626B\u63CF\u5927\u4E8E\u7B49\u4E8E\u6B64\u5927\u5C0F\u7684\u5A92\u4F53\u6587\u4EF6",
  duplicateDetectionSettings: "\u91CD\u590D\u68C0\u6D4B",
  duplicateThresholdSetting: "\u76F8\u4F3C\u5EA6\u9608\u503C",
  duplicateThresholdDesc: "\u8FBE\u5230\u8BE5\u767E\u5206\u6BD4\u624D\u4F1A\u88AB\u5224\u5B9A\u4E3A\u91CD\u590D",
  keyboardShortcuts: "\u5FEB\u6377\u952E",
  shortcutsDesc: "\u63D2\u4EF6\u652F\u6301\u7684\u5FEB\u6377\u952E\uFF1A",
  shortcutOpenLibrary: "Ctrl+Shift+M - \u6253\u5F00\u5A92\u4F53\u5E93",
  shortcutFindUnreferenced: "Ctrl+Shift+U - \u67E5\u627E\u672A\u5F15\u7528\u5A92\u4F53",
  shortcutOpenTrash: "Ctrl+Shift+T - \u6253\u5F00\u9694\u79BB\u6587\u4EF6\u7BA1\u7406",
  commands: "\u5FEB\u6377\u547D\u4EE4",
  commandsDesc: "\u5728\u547D\u4EE4\u9762\u677F\u4E2D\u4F7F\u7528\u4EE5\u4E0B\u547D\u4EE4\uFF1A",
  cmdOpenLibrary: "\u5A92\u4F53\u5E93 - \u6253\u5F00\u5A92\u4F53\u5E93\u89C6\u56FE",
  cmdFindUnreferenced: "\u67E5\u627E\u672A\u5F15\u7528\u5A92\u4F53 - \u67E5\u627E\u672A\u88AB\u4EFB\u4F55\u7B14\u8BB0\u5F15\u7528\u7684\u5A92\u4F53\u6587\u4EF6",
  cmdTrashManagement: "\u9694\u79BB\u6587\u4EF6\u7BA1\u7406 - \u7BA1\u7406\u5DF2\u5220\u9664\u7684\u6587\u4EF6",
  cmdAlignLeft: "\u56FE\u7247\u5C45\u5DE6\u5BF9\u9F50 - \u5C06\u9009\u4E2D\u56FE\u7247\u5C45\u5DE6\u5BF9\u9F50",
  cmdAlignCenter: "\u56FE\u7247\u5C45\u4E2D\u5BF9\u9F50 - \u5C06\u9009\u4E2D\u56FE\u7247\u5C45\u4E2D\u5BF9\u9F50",
  cmdAlignRight: "\u56FE\u7247\u5C45\u53F3\u5BF9\u9F50 - \u5C06\u9009\u4E2D\u56FE\u7247\u5C45\u53F3\u5BF9\u9F50",
  // Trash Management View
  loadingTrashFiles: "\u6B63\u5728\u52A0\u8F7D\u9694\u79BB\u6587\u4EF6...",
  trashFolderEmpty: "\u9694\u79BB\u6587\u4EF6\u5939\u4E3A\u7A7A",
  filesInTrash: "\u9694\u79BB\u6587\u4EF6\u5939\u4E2D\u6709 {count} \u4E2A\u6587\u4EF6",
  totalSize: "\u603B\u8BA1 {size}",
  trashManagementDesc: "\u5DF2\u5220\u9664\u7684\u6587\u4EF6\u4F1A\u4E34\u65F6\u5B58\u653E\u5728\u8FD9\u91CC\uFF0C\u60A8\u53EF\u4EE5\u6062\u590D\u6216\u5F7B\u5E95\u5220\u9664\u5B83\u4EEC",
  refresh: "\u5237\u65B0",
  clearTrash: "\u6E05\u7A7A\u9694\u79BB\u6587\u4EF6\u5939",
  clearTrashTooltip: "\u6E05\u7A7A\u9694\u79BB\u6587\u4EF6\u5939",
  restoreTooltip: "\u6062\u590D\u6587\u4EF6",
  permanentDelete: "\u5F7B\u5E95\u5220\u9664",
  permanentDeleteTooltip: "\u5F7B\u5E95\u5220\u9664",
  deletedTime: "\u5220\u9664\u65F6\u95F4",
  confirmDeleteFile: '\u786E\u5B9A\u8981\u5F7B\u5E95\u5220\u9664 "{name}" \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002',
  confirmClearTrash: "\u786E\u5B9A\u8981\u6E05\u7A7A\u9694\u79BB\u6587\u4EF6\u5939\u5417\uFF1F{count} \u4E2A\u6587\u4EF6\u5C06\u88AB\u5F7B\u5E95\u5220\u9664\uFF0C\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002",
  fileDeleted: "\u5DF2\u5F7B\u5E95\u5220\u9664: {name}",
  restoreSuccess: "\u5DF2\u6062\u590D: {name}",
  restoreFailed: "\u6062\u590D\u5931\u8D25: {message}",
  targetFileExists: "\u76EE\u6807\u6587\u4EF6\u5DF2\u5B58\u5728",
  deleteFailed: "\u5220\u9664\u5931\u8D25",
  fileNameCopied: "\u6587\u4EF6\u540D\u5DF2\u590D\u5236",
  originalPathCopied: "\u539F\u59CB\u8DEF\u5F84\u5DF2\u590D\u5236",
  // 未引用图片视图
  scanningUnreferenced: "\u6B63\u5728\u626B\u63CF\u672A\u5F15\u7528\u7684\u5A92\u4F53\u6587\u4EF6...",
  totalSizeLabel: "\u603B\u8BA1 {size}",
  scanError: "\u626B\u63CF\u56FE\u7247\u65F6\u51FA\u9519",
  unreferencedDesc: "\u4EE5\u4E0B\u5A92\u4F53\u6587\u4EF6\u672A\u88AB\u4EFB\u4F55\u7B14\u8BB0\u5F15\u7528\uFF0C\u53EF\u80FD\u53EF\u4EE5\u5220\u9664\u4EE5\u91CA\u653E\u7A7A\u95F4",
  noFilesToDelete: "\u6CA1\u6709\u9700\u8981\u5220\u9664\u7684\u56FE\u7247",
  processedFiles: "\u5DF2\u5904\u7406 {count} \u4E2A\u6587\u4EF6",
  processedFilesError: "\u5904\u7406 {errors} \u4E2A\u6587\u4EF6\u65F6\u51FA\u9519",
  copyAllPaths: "\u590D\u5236\u6240\u6709\u8DEF\u5F84",
  copiedFilePaths: "\u5DF2\u590D\u5236 {count} \u4E2A\u6587\u4EF6\u8DEF\u5F84",
  // 图片库视图
  noMatchingFiles: "\u6CA1\u6709\u5339\u914D\u7684\u6587\u4EF6",
  prevPage: "\u4E0A\u4E00\u9875",
  nextPage: "\u4E0B\u4E00\u9875",
  pageInfo: "\u7B2C {current} / {total} \u9875",
  selectFiles: "\u5DF2\u9009\u62E9 {count} \u4E2A\u6587\u4EF6",
  selectAll: "\u5168\u9009",
  deselectAll: "\u53D6\u6D88\u5168\u9009",
  confirmDeleteSelected: "\u786E\u5B9A\u8981\u5220\u9664\u9009\u4E2D\u7684 {count} \u4E2A\u6587\u4EF6\u5417\uFF1F",
  deletedFiles: "\u5DF2\u5220\u9664 {count} \u4E2A\u6587\u4EF6",
  deleteFilesFailed: "\u5220\u9664 {count} \u4E2A\u6587\u4EF6\u5931\u8D25",
  multiSelectMode: "\u591A\u9009\u6A21\u5F0F",
  // 媒体预览
  unsupportedFileType: "\u4E0D\u652F\u6301\u9884\u89C8\u6B64\u7C7B\u578B\u6587\u4EF6",
  copyPathBtn: "\u590D\u5236\u8DEF\u5F84",
  copyLinkBtn: "\u590D\u5236\u94FE\u63A5",
  findInNotes: "\u5728\u7B14\u8BB0\u4E2D\u67E5\u627E",
  pathCopied: "\u8DEF\u5F84\u5DF2\u590D\u5236",
  linkCopied: "\u94FE\u63A5\u5DF2\u590D\u5236",
  imageLoadError: "\u56FE\u7247\u52A0\u8F7D\u5931\u8D25",
  // 图片对齐
  alignImageLeft: "\u56FE\u7247\u5C45\u5DE6\u5BF9\u9F50",
  alignImageCenter: "\u56FE\u7247\u5C45\u4E2D\u5BF9\u9F50",
  alignImageRight: "\u56FE\u7247\u5C45\u53F3\u5BF9\u9F50",
  selectImageFirst: "\u8BF7\u5148\u9009\u4E2D\u4E00\u5F20\u56FE\u7247",
  selectImage: "\u8BF7\u9009\u4E2D\u56FE\u7247",
  imageAlignedLeft: "\u56FE\u7247\u5DF2\u5C45\u5DE6\u5BF9\u9F50",
  imageAlignedCenter: "\u56FE\u7247\u5DF2\u5C45\u4E2D\u5BF9\u9F50",
  imageAlignedRight: "\u56FE\u7247\u5DF2\u5C45\u53F3\u5BF9\u9F50",
  // 隔离文件夹操作
  copiedFileName: "\u5DF2\u590D\u5236\u6587\u4EF6\u540D",
  copiedOriginalPath: "\u5DF2\u590D\u5236\u539F\u59CB\u8DEF\u5F84",
  notReferenced: "\u8BE5\u56FE\u7247\u672A\u88AB\u4EFB\u4F55\u7B14\u8BB0\u5F15\u7528",
  movedToTrash: "\u5DF2\u79FB\u81F3\u9694\u79BB\u6587\u4EF6\u5939: {name}",
  deletedFile: "\u5DF2\u5220\u9664: {name}",
  restoredFile: "\u5DF2\u6062\u590D\u6587\u4EF6",
  // 命令名称
  cmdImageLibrary: "\u56FE\u7247\u5E93",
  cmdFindUnreferencedImages: "\u67E5\u627E\u672A\u5F15\u7528\u56FE\u7247",
  cmdRefreshCache: "\u5237\u65B0\u5A92\u4F53\u5F15\u7528\u7F13\u5B58",
  cmdAlignImageLeft: "\u56FE\u7247\u5C45\u5DE6\u5BF9\u9F50",
  cmdAlignImageCenter: "\u56FE\u7247\u5C45\u4E2D\u5BF9\u9F50",
  cmdAlignImageRight: "\u56FE\u7247\u5C45\u53F3\u5BF9\u9F50",
  cmdOpenMediaLibrary: "\u6253\u5F00\u5A92\u4F53\u5E93",
  cmdFindUnreferencedMedia: "\u67E5\u627E\u672A\u5F15\u7528\u5A92\u4F53",
  cmdOpenTrashManagement: "\u6253\u5F00\u9694\u79BB\u6587\u4EF6\u7BA1\u7406",
  // 删除操作
  deleteFailedWithName: "\u5220\u9664\u5931\u8D25: {name}",
  deletedWithQuarantineFailed: "\u5DF2\u5220\u9664: {name}\uFF08\u9694\u79BB\u5931\u8D25\uFF09",
  operationFailed: "\u64CD\u4F5C\u5931\u8D25: {name}",
  processing: "\u5904\u7406\u4E2D...",
  // v2.0 新增
  duplicateDetection: "\u91CD\u590D\u68C0\u6D4B",
  duplicateDetectionDesc: "\u4F7F\u7528\u611F\u77E5\u54C8\u5E0C\u7B97\u6CD5\u68C0\u6D4B\u50CF\u7D20\u7EA7\u91CD\u590D\u56FE\u7247\uFF0C\u975E\u6587\u4EF6\u540D\u5BF9\u6BD4",
  noDuplicatesFound: "\u672A\u53D1\u73B0\u91CD\u590D\u6587\u4EF6\uFF0C\u70B9\u51FB\u201C\u5F00\u59CB\u626B\u63CF\u201D\u68C0\u6D4B",
  startScan: "\u5F00\u59CB\u626B\u63CF",
  scanProgress: "\u626B\u63CF\u8FDB\u5EA6: {current}/{total}",
  similarityThreshold: "\u76F8\u4F3C\u5EA6\u9608\u503C: {value}%",
  duplicateGroupsFound: "\u53D1\u73B0 {groups} \u7EC4\u91CD\u590D\uFF0C\u5171 {files} \u4E2A\u5197\u4F59\u6587\u4EF6",
  duplicateGroup: "\u91CD\u590D\u7EC4 #{index}",
  files: "\u4E2A\u6587\u4EF6",
  suggestKeep: "\u2705 \u5EFA\u8BAE\u4FDD\u7559",
  quarantine: "\u9694\u79BB",
  quarantineAllDuplicates: "\u4E00\u952E\u9694\u79BB\u6240\u6709\u91CD\u590D",
  duplicatesFound: "\u53D1\u73B0 {groups} \u7EC4\u91CD\u590D\uFF0C\u5171 {files} \u4E2A\u5197\u4F59\u6587\u4EF6",
  duplicatesQuarantined: "\u5DF2\u9694\u79BB {count} \u4E2A\u91CD\u590D\u6587\u4EF6",
  typeDistribution: "\u7C7B\u578B\u5206\u5E03",
  unreferencedRate: "\u672A\u5F15\u7528\u7387",
  referencedBy: "\u88AB {count} \u7BC7\u7B14\u8BB0\u5F15\u7528",
  selectedCount: "\u5DF2\u9009\u62E9 {count} \u9879",
  batchRestore: "\u6279\u91CF\u6062\u590D",
  batchDelete: "\u6279\u91CF\u5220\u9664",
  noItemsSelected: "\u8BF7\u5148\u9009\u62E9\u6587\u4EF6",
  confirmBatchRestore: "\u786E\u8BA4\u6062\u590D {count} \u4E2A\u6587\u4EF6\uFF1F",
  batchRestoreCompleted: "\u5DF2\u6062\u590D {count} \u4E2A\u6587\u4EF6",
  safeScan: "\u5B89\u5168\u626B\u63CF",
  safeScanDesc: "\u81EA\u52A8\u626B\u63CF\u672A\u5F15\u7528\u3001\u8D85\u671F\u3001\u8D85\u5927\u7684\u5A92\u4F53\u6587\u4EF6",
  safeScanStarted: "\u5F00\u59CB\u5B89\u5168\u626B\u63CF...",
  safeScanNoResults: "\u672A\u53D1\u73B0\u7B26\u5408\u6761\u4EF6\u7684\u6587\u4EF6",
  safeScanConfirm: "\u53D1\u73B0 {count} \u4E2A\u6587\u4EF6\u7B26\u5408\u6761\u4EF6\uFF08\u672A\u5F15\u7528>{days}\u5929 + \u5927\u5C0F>{size}\uFF09\uFF0C\u786E\u8BA4\u9001\u5165\u9694\u79BB\u533A\uFF1F",
  safeScanComplete: "\u5B89\u5168\u626B\u63CF\u5B8C\u6210\uFF0C\u5DF2\u9694\u79BB {count} \u4E2A\u6587\u4EF6",
  safeScanFailed: "\u5B89\u5168\u626B\u63CF\u5931\u8D25",
  cmdDuplicateDetection: "\u6253\u5F00\u91CD\u590D\u68C0\u6D4B",
  organizing: "\u6574\u7406\u4E2D",
  organizeComplete: "\u5DF2\u6574\u7406 {count} \u4E2A\u6587\u4EF6"
};
var en = {
  // General
  ok: "OK",
  cancel: "Cancel",
  delete: "Delete",
  restore: "Restore",
  confirm: "Confirm",
  success: "Success",
  error: "Error",
  // View names
  mediaLibrary: "Media Library",
  unreferencedMedia: "Unreferenced Media",
  trashManagement: "Trash Management",
  // Media Library
  totalMediaFiles: "{count} media files",
  noMediaFiles: "No media files found",
  allMediaTypesDisabled: "All media types have been disabled. Please enable at least one media type in settings",
  searchPlaceholder: "Search by filename...",
  searchResults: "{count} results found",
  // Unreferenced Media
  unreferencedFound: "{count} unreferenced media files found",
  allMediaReferenced: "Great! All media files are referenced",
  deleteToTrash: "Files will be moved to trash folder",
  // Trash Folder
  trashEmpty: "Trash folder is empty",
  originalPath: "Original location",
  deletedAt: "Deleted at",
  confirmClearAll: "Are you sure you want to empty the trash folder?",
  // Actions
  openInNotes: "Find in Notes",
  copyPath: "Copy Path",
  copyLink: "Copy Link",
  openOriginal: "Open Original",
  preview: "Preview",
  // Shortcuts
  shortcuts: "Shortcuts",
  openLibrary: "Open Media Library",
  findUnreferenced: "Find Unreferenced Media",
  openTrash: "Open Trash Management",
  // Scanning progress
  scanningReferences: "Scanning references",
  scanComplete: "Scan complete",
  filesScanned: "files scanned",
  // Batch operations
  batchDeleteComplete: "{count} files deleted",
  batchDeleteProgress: "Deleting {current}/{total}",
  batchRestoreComplete: "{count} files restored",
  // Settings page
  pluginSettings: "Media Toolkit Plugin Settings",
  mediaFolder: "Media Folder",
  mediaFolderDesc: "Specify the media folder path to scan (leave empty to scan entire vault)",
  thumbnailSize: "Thumbnail Size",
  thumbnailSizeDesc: "Choose thumbnail size in media library view",
  thumbnailSmall: "Small (100px)",
  thumbnailMedium: "Medium (150px)",
  thumbnailLarge: "Large (200px)",
  defaultSortBy: "Default Sort By",
  sortByDesc: "Choose default sort method for images",
  sortOrder: "Sort Order",
  sortOrderDesc: "Choose ascending or descending order",
  sortByName: "By Name",
  sortByDate: "By Date",
  sortBySize: "By Size",
  sortAsc: "Ascending",
  sortDesc: "Descending",
  showImageInfo: "Show Image Info",
  showImageInfoDesc: "Display filename and size below image thumbnails",
  autoRefresh: "Auto Refresh",
  autoRefreshDesc: "Automatically refresh view when images change in vault",
  defaultAlignment: "Default Image Alignment",
  alignmentDesc: "Default alignment when inserting images",
  alignLeft: "Left",
  alignCenter: "Center",
  alignRight: "Right",
  safeDeleteSettings: "Safe Delete Settings",
  useTrashFolder: "Use Trash Folder",
  useTrashFolderDesc: "Move files to trash folder instead of deleting directly",
  trashFolderPath: "Trash Folder",
  trashFolderPathDesc: "Path to trash folder (relative path)",
  autoCleanupTrash: "Auto Cleanup Trash",
  autoCleanupTrashDesc: "Automatically clean up old files in trash folder",
  autoCleanupComplete: "Auto cleanup complete, deleted {count} files",
  cleanupDays: "Cleanup Days",
  cleanupDaysDesc: "Files older than this many days will be automatically deleted",
  mediaTypes: "Media Types",
  enableImageSupport: "Enable Image Support",
  enableImageSupportDesc: "Show image files in media library (png, jpg, gif, webp, svg, bmp)",
  enableVideoSupport: "Enable Video Support",
  enableVideoSupportDesc: "Show video files in media library (mp4, mov, avi, mkv, webm)",
  enableAudioSupport: "Enable Audio Support",
  enableAudioSupportDesc: "Show audio files in media library (mp3, wav, ogg, m4a, flac)",
  enablePDFSupport: "Enable PDF Support",
  enablePDFSupportDesc: "Show PDF files in media library",
  viewSettings: "View Settings",
  interfaceLanguage: "Interface Language",
  languageDesc: "Choose language for plugin interface",
  languageSystem: "Follow System",
  pageSize: "Page Size",
  pageSizeDesc: "Number of files per page in media library",
  enablePreviewModal: "Enable Preview Modal",
  enablePreviewModalDesc: "Open preview window when clicking media files",
  enableKeyboardNav: "Enable Keyboard Navigation",
  enableKeyboardNavDesc: "Use arrow keys to navigate in preview window",
  safeScanSettings: "Safe Scan",
  safeScanEnabledDesc: "Enable conditional scanning from trash management view",
  safeScanUnrefDays: "Unreferenced Days",
  safeScanUnrefDaysDesc: "Only scan media files unreferenced for at least this many days",
  safeScanMinSize: "Minimum File Size (MB)",
  safeScanMinSizeDesc: "Only scan media files at or above this size",
  duplicateDetectionSettings: "Duplicate Detection",
  duplicateThresholdSetting: "Similarity Threshold",
  duplicateThresholdDesc: "Only groups at or above this percentage are treated as duplicates",
  keyboardShortcuts: "Keyboard Shortcuts",
  shortcutsDesc: "Plugin keyboard shortcuts:",
  shortcutOpenLibrary: "Ctrl+Shift+M - Open Media Library",
  shortcutFindUnreferenced: "Ctrl+Shift+U - Find Unreferenced Media",
  shortcutOpenTrash: "Ctrl+Shift+T - Open Trash Management",
  commands: "Commands",
  commandsDesc: "Use these commands in command palette:",
  cmdOpenLibrary: "Media Library - Open media library view",
  cmdFindUnreferenced: "Find Unreferenced Media - Find media files not referenced by any notes",
  cmdTrashManagement: "Trash Management - Manage deleted files",
  cmdAlignLeft: "Align Image Left - Align selected image to left",
  cmdAlignCenter: "Align Image Center - Center align selected image",
  cmdAlignRight: "Align Image Right - Align selected image to right",
  // Trash Management View
  loadingTrashFiles: "Loading trash files...",
  trashFolderEmpty: "Trash folder is empty",
  filesInTrash: "{count} files in trash folder",
  totalSize: "Total: {size}",
  trashManagementDesc: "Deleted files are temporarily stored here. You can restore or permanently delete them.",
  refresh: "Refresh",
  clearTrash: "Empty Trash",
  clearTrashTooltip: "Empty trash folder",
  restoreTooltip: "Restore file",
  permanentDelete: "Delete",
  permanentDeleteTooltip: "Permanently delete",
  deletedTime: "Deleted at",
  confirmDeleteFile: 'Are you sure you want to permanently delete "{name}"? This cannot be undone.',
  confirmClearTrash: "Are you sure you want to empty the trash folder? {count} files will be permanently deleted. This cannot be undone.",
  fileDeleted: "Permanently deleted: {name}",
  restoreSuccess: "Restored: {name}",
  restoreFailed: "Restore failed: {message}",
  targetFileExists: "Target file already exists",
  deleteFailed: "Delete failed",
  fileNameCopied: "File name copied",
  originalPathCopied: "Original path copied",
  // Unreferenced Images View
  scanningUnreferenced: "Scanning unreferenced media files...",
  totalSizeLabel: "Total: {size}",
  scanError: "Error scanning images",
  unreferencedDesc: "These media files are not referenced by any notes and can be deleted to free up space",
  noFilesToDelete: "No files to delete",
  processedFiles: "Processed {count} files",
  processedFilesError: "Error processing {errors} files",
  copyAllPaths: "Copy all paths",
  copiedFilePaths: "Copied {count} file paths",
  // Image Library View
  noMatchingFiles: "No matching files",
  prevPage: "Previous",
  nextPage: "Next",
  pageInfo: "Page {current} / {total}",
  selectFiles: "{count} files selected",
  selectAll: "Select All",
  deselectAll: "Deselect All",
  confirmDeleteSelected: "Are you sure you want to delete {count} selected files?",
  deletedFiles: "{count} files deleted",
  deleteFilesFailed: "Failed to delete {count} files",
  multiSelectMode: "Multi-select mode",
  // Media Preview
  unsupportedFileType: "Preview not supported for this file type",
  copyPathBtn: "Copy Path",
  copyLinkBtn: "Copy Link",
  findInNotes: "Find in Notes",
  pathCopied: "Path copied",
  linkCopied: "Link copied",
  imageLoadError: "Image failed to load",
  // Image alignment
  alignImageLeft: "Align Image Left",
  alignImageCenter: "Align Image Center",
  alignImageRight: "Align Image Right",
  selectImageFirst: "Please select an image first",
  selectImage: "Please select an image",
  imageAlignedLeft: "Image aligned to left",
  imageAlignedCenter: "Image centered",
  imageAlignedRight: "Image aligned to right",
  // Trash folder operations
  copiedFileName: "File name copied",
  copiedOriginalPath: "Original path copied",
  notReferenced: "This image is not referenced by any notes",
  movedToTrash: "Moved to trash folder: {name}",
  deletedFile: "Deleted: {name}",
  restoredFile: "File restored",
  // Command names
  cmdImageLibrary: "Image Library",
  cmdFindUnreferencedImages: "Find Unreferenced Images",
  cmdRefreshCache: "Refresh Media Reference Cache",
  cmdAlignImageLeft: "Align Image Left",
  cmdAlignImageCenter: "Align Image Center",
  cmdAlignImageRight: "Align Image Right",
  cmdOpenMediaLibrary: "Open Media Library",
  cmdFindUnreferencedMedia: "Find Unreferenced Media",
  cmdOpenTrashManagement: "Open Trash Management",
  // Delete operations
  deleteFailedWithName: "Delete failed: {name}",
  deletedWithQuarantineFailed: "Deleted: {name} (quarantine failed)",
  operationFailed: "Operation failed: {name}",
  processing: "Processing...",
  // v2.0 new
  duplicateDetection: "Duplicate Detection",
  duplicateDetectionDesc: "Detect pixel-level duplicate images using perceptual hashing algorithm",
  noDuplicatesFound: 'No duplicates found. Click "Start Scan" to detect.',
  startScan: "Start Scan",
  scanProgress: "Scanning: {current}/{total}",
  similarityThreshold: "Similarity threshold: {value}%",
  duplicateGroupsFound: "Found {groups} group(s), {files} redundant file(s)",
  duplicateGroup: "Group #{index}",
  files: "files",
  suggestKeep: "\u2705 Keep",
  quarantine: "Quarantine",
  quarantineAllDuplicates: "Quarantine All Duplicates",
  duplicatesFound: "Found {groups} group(s), {files} redundant file(s)",
  duplicatesQuarantined: "Quarantined {count} duplicate file(s)",
  typeDistribution: "Type Distribution",
  unreferencedRate: "Unreferenced Rate",
  referencedBy: "Referenced by {count} note(s)",
  selectedCount: "{count} selected",
  batchRestore: "Batch Restore",
  batchDelete: "Batch Delete",
  noItemsSelected: "Please select files first",
  confirmBatchRestore: "Restore {count} file(s)?",
  batchRestoreCompleted: "Restored {count} file(s)",
  safeScan: "Safe Scan",
  safeScanDesc: "Auto-detect unreferenced, old, and large media files",
  safeScanStarted: "Starting safe scan...",
  safeScanNoResults: "No files match the criteria",
  safeScanConfirm: "Found {count} file(s) matching criteria (unreferenced >{days} days + size >{size}). Send to quarantine?",
  safeScanComplete: "Safe scan complete, quarantined {count} file(s)",
  safeScanFailed: "Safe scan failed",
  cmdDuplicateDetection: "Open Duplicate Detection",
  organizing: "Organizing",
  organizeComplete: "Organized {count} file(s)"
};
var translations = { zh, en };
function t(lang, key, params) {
  let text = (translations[lang] ?? translations["zh"])[key] || translations["zh"][key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.split(`{${k}}`).join(String(v));
    });
  }
  return text;
}
function getSystemLanguage() {
  const navLanguage = typeof navigator !== "undefined" ? navigator.language : null;
  const lang = navLanguage ? navLanguage.toLowerCase() : "zh";
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

// utils/fileWatcher.ts
var import_obsidian9 = require("obsidian");
var MediaFileIndex = class {
  constructor(vault, thumbnailCache = null) {
    this.index = /* @__PURE__ */ new Map();
    this.listeners = [];
    this.enabledExtensions = /* @__PURE__ */ new Set();
    this.trashFolder = "";
    this.initialized = false;
    this.vault = vault;
    this.thumbnailCache = thumbnailCache;
  }
  /**
   * 更新启用的扩展名（设置变更时调用）
   */
  setEnabledExtensions(extensions) {
    this.enabledExtensions = new Set(extensions.map((e) => e.toLowerCase()));
  }
  /**
   * 设置隔离文件夹路径（排除该文件夹内的文件）
   */
  setTrashFolder(path) {
    this.trashFolder = path;
  }
  /**
   * 判断文件是否在隔离文件夹中
   */
  isInTrashFolder(filePath) {
    if (!this.trashFolder) return false;
    return filePath.startsWith(this.trashFolder + "/") || filePath === this.trashFolder;
  }
  /**
   * 判断文件是否应该被索引
   */
  shouldIndex(file) {
    if (!(file instanceof import_obsidian9.TFile)) return false;
    if (this.isInTrashFolder(file.path)) return false;
    const ext = "." + file.extension.toLowerCase();
    if (this.enabledExtensions.size > 0) {
      return this.enabledExtensions.has(ext);
    }
    return isMediaFile(file.name);
  }
  /**
   * 从 TFile 创建 FileEntry
   */
  toEntry(file) {
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
  async fullScan() {
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
  onFileCreated(file) {
    if (!this.shouldIndex(file)) return;
    const entry = this.toEntry(file);
    this.index.set(entry.path, entry);
    this.notifyListeners("create", entry);
  }
  onFileModified(file) {
    if (!this.shouldIndex(file)) return;
    const entry = this.toEntry(file);
    this.index.set(entry.path, entry);
    this.notifyListeners("modify", entry);
  }
  onFileDeleted(file) {
    const path = file.path;
    const existing = this.index.get(path);
    if (!existing) return;
    this.index.delete(path);
    if (this.thumbnailCache) {
      void this.thumbnailCache.delete(path);
    }
    this.notifyListeners("delete", existing);
  }
  onFileRenamed(file, oldPath) {
    const oldEntry = this.index.get(oldPath);
    if (oldEntry) {
      this.index.delete(oldPath);
    }
    if (this.shouldIndex(file)) {
      const newEntry = this.toEntry(file);
      this.index.set(newEntry.path, newEntry);
      if (this.thumbnailCache) {
        void this.thumbnailCache.rename(oldPath, newEntry.path);
      }
      this.notifyListeners("rename", newEntry, oldPath);
    } else if (oldEntry) {
      if (this.thumbnailCache) {
        void this.thumbnailCache.delete(oldPath);
      }
      this.notifyListeners("delete", oldEntry);
    }
  }
  /**
   * 获取当前索引的所有文件
   */
  getFiles() {
    return Array.from(this.index.values());
  }
  /**
   * 获取文件数量
   */
  get size() {
    return this.index.size;
  }
  /**
   * 是否已完成初始扫描
   */
  get isInitialized() {
    return this.initialized;
  }
  /**
   * 按路径获取单个条目
   */
  getEntry(path) {
    return this.index.get(path);
  }
  /**
   * 注册变化监听器
   */
  onChange(listener) {
    this.listeners.push(listener);
  }
  /**
   * 移除变化监听器
   */
  offChange(listener) {
    const idx = this.listeners.indexOf(listener);
    if (idx >= 0) {
      this.listeners.splice(idx, 1);
    }
  }
  /**
   * 通知所有监听器
   */
  notifyListeners(type, entry, oldPath) {
    for (const listener of this.listeners) {
      try {
        listener(type, entry, oldPath);
      } catch (error) {
        console.error("MediaFileIndex listener error:", error);
      }
    }
  }
  /**
   * 清除索引
   */
  clear() {
    this.index.clear();
    this.initialized = false;
  }
};

// main.ts
var _ImageManagerPlugin = class _ImageManagerPlugin extends import_obsidian10.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    // 缓存引用的图片以提高大型 Vault 的性能
    this.referencedImagesCache = null;
    this.cacheTimestamp = 0;
    // 缓存5分钟
    this.refreshViewsTimer = null;
    // 性能：缩略图缓存 + 增量文件索引
    this.thumbnailCache = new ThumbnailCache();
    this.fileIndex = new MediaFileIndex(null);
    this.indexedExtensionsKey = "";
    this.indexedTrashFolder = "";
  }
  /**
   * 获取当前语言设置
   */
  getCurrentLanguage() {
    if (this.settings.language === "system") {
      return getSystemLanguage();
    }
    return this.settings.language;
  }
  /**
   * 翻译函数
   */
  t(key, params) {
    return t(this.getCurrentLanguage(), key, params);
  }
  async onload() {
    await this.loadSettings();
    await this.migrateLegacyTrashFolder();
    await this.initPerformanceInfra();
    this.removeManagedStyles();
    await this.addStyle();
    this.registerView(VIEW_TYPE_IMAGE_LIBRARY, (leaf) => new ImageLibraryView(leaf, this));
    this.registerView(VIEW_TYPE_UNREFERENCED_IMAGES, (leaf) => new UnreferencedImagesView(leaf, this));
    this.registerView(VIEW_TYPE_TRASH_MANAGEMENT, (leaf) => new TrashManagementView(leaf, this));
    this.registerView(VIEW_TYPE_DUPLICATE_DETECTION, (leaf) => new DuplicateDetectionView(leaf, this));
    const alignmentProcessor = new AlignmentPostProcessor(this);
    alignmentProcessor.register();
    this.addCommand({
      id: "open-image-library",
      name: this.t("cmdImageLibrary"),
      checkCallback: (checking) => {
        if (checking) return true;
        this.openImageLibrary();
      }
    });
    this.addCommand({
      id: "find-unreferenced-images",
      name: this.t("cmdFindUnreferencedImages"),
      checkCallback: (checking) => {
        if (checking) return true;
        this.findUnreferencedImages();
      }
    });
    this.addCommand({
      id: "refresh-cache",
      name: this.t("cmdRefreshCache"),
      checkCallback: (checking) => {
        if (checking) return true;
        this.refreshCache();
      }
    });
    this.addCommand({
      id: "open-duplicate-detection",
      name: this.t("cmdDuplicateDetection"),
      checkCallback: (checking) => {
        if (checking) return true;
        this.openDuplicateDetection();
      }
    });
    this.addCommand({
      id: "open-trash-management",
      name: this.t("cmdTrashManagement"),
      checkCallback: (checking) => {
        if (checking) return true;
        this.openTrashManagement();
      }
    });
    this.addCommand({
      id: "align-image-left",
      name: this.t("cmdAlignImageLeft"),
      editorCallback: (editor) => {
        this.alignSelectedImage(editor, "left");
      }
    });
    this.addCommand({
      id: "align-image-center",
      name: this.t("cmdAlignImageCenter"),
      editorCallback: (editor) => {
        this.alignSelectedImage(editor, "center");
      }
    });
    this.addCommand({
      id: "align-image-right",
      name: this.t("cmdAlignImageRight"),
      editorCallback: (editor) => {
        this.alignSelectedImage(editor, "right");
      }
    });
    this.registerEvent(
      // @ts-ignore - editor-context-menu event
      this.app.workspace.on("editor-context-menu", (menu, editor) => {
        this.addAlignmentMenuItems(menu, editor);
      })
    );
    this.addSettingTab(new SettingsTab(this.app, this));
    this.registerKeyboardShortcuts();
    this.registerVaultEventListeners();
    this.autoCleanupTrashOnStartup();
  }
  /**
   * 迁移旧版默认隔离目录（隐藏目录）到新版默认目录，避免被 Vault 索引忽略
   */
  async migrateLegacyTrashFolder() {
    const legacyPath = normalizeVaultPath(_ImageManagerPlugin.LEGACY_TRASH_FOLDER);
    const defaultTrashPath = normalizeVaultPath(DEFAULT_SETTINGS.trashFolder) || DEFAULT_SETTINGS.trashFolder;
    const configuredTrashPath = normalizeVaultPath(this.settings.trashFolder) || defaultTrashPath;
    let settingsChanged = false;
    if (configuredTrashPath === legacyPath) {
      this.settings.trashFolder = defaultTrashPath;
      settingsChanged = true;
    }
    try {
      const adapter = this.app.vault.adapter;
      const legacyExists = await adapter.exists(legacyPath);
      if (legacyExists) {
        const targetExists = await adapter.exists(defaultTrashPath);
        if (!targetExists) {
          await adapter.rename(legacyPath, defaultTrashPath);
        }
      }
    } catch (error) {
      console.error("\u8FC1\u79FB\u65E7\u7248\u9694\u79BB\u76EE\u5F55\u5931\u8D25:", error);
    }
    if (settingsChanged) {
      await this.saveData(this.settings);
    }
  }
  /**
   * 启动时自动清理隔离文件夹
   */
  async autoCleanupTrashOnStartup() {
    if (!this.settings.autoCleanupTrash) {
      return;
    }
    try {
      await this.cleanupOldTrashFiles();
    } catch (error) {
      console.error("\u81EA\u52A8\u6E05\u7406\u9694\u79BB\u6587\u4EF6\u5939\u5931\u8D25:", error);
    }
  }
  /**
   * 清理过期的隔离文件
   */
  async cleanupOldTrashFiles() {
    const { vault } = this.app;
    const trashPath = normalizeVaultPath(this.settings.trashFolder);
    if (!trashPath || !isPathSafe(trashPath)) {
      return 0;
    }
    const trashFolder = vault.getAbstractFileByPath(trashPath);
    if (!trashFolder) {
      return 0;
    }
    if (!(trashFolder instanceof import_obsidian10.TFolder)) {
      return 0;
    }
    const days = Math.max(1, this.settings.trashCleanupDays || 30);
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1e3;
    let deletedCount = 0;
    const files = trashFolder.children;
    for (const file of files) {
      if (file instanceof import_obsidian10.TFile) {
        if (file.stat.mtime < cutoffTime) {
          try {
            await vault.delete(file);
            deletedCount++;
          } catch (error) {
            console.error(`\u5220\u9664\u9694\u79BB\u6587\u4EF6\u5931\u8D25: ${file.name}`, error);
          }
        }
      }
    }
    if (deletedCount > 0) {
      new import_obsidian10.Notice(this.t("autoCleanupComplete").replace("{count}", String(deletedCount)));
    }
    return deletedCount;
  }
  /**
   * 注册快捷键
   */
  registerKeyboardShortcuts() {
    this.addCommand({
      id: "open-media-library-shortcut",
      name: this.t("cmdOpenMediaLibrary"),
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "m" }],
      callback: () => {
        this.openImageLibrary();
      }
    });
    this.addCommand({
      id: "find-unreferenced-media-shortcut",
      name: this.t("cmdFindUnreferencedMedia"),
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "u" }],
      callback: () => {
        this.findUnreferencedImages();
      }
    });
    this.addCommand({
      id: "open-trash-management-shortcut",
      name: this.t("cmdOpenTrashManagement"),
      hotkeys: [{ modifiers: ["Ctrl", "Shift"], key: "t" }],
      callback: () => {
        this.openTrashManagement();
      }
    });
  }
  /**
   * 注册 Vault 事件监听
   */
  registerVaultEventListeners() {
    this.registerEvent(this.app.vault.on("create", (file) => {
      this.fileIndex.onFileCreated(file);
      this.handleVaultFileChange(file);
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      this.fileIndex.onFileDeleted(file);
      this.handleVaultFileChange(file);
    }));
    this.registerEvent(this.app.vault.on("modify", (file) => {
      this.fileIndex.onFileModified(file);
      this.handleVaultFileChange(file);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      this.fileIndex.onFileRenamed(file, oldPath);
      this.handleVaultFileChange(file, oldPath);
    }));
  }
  /**
   * 初始化性能基础设施
   */
  async initPerformanceInfra() {
    await this.thumbnailCache.open();
    this.fileIndex = new MediaFileIndex(this.app.vault, this.thumbnailCache);
    await this.syncPerformanceInfraSettings(true);
  }
  /**
   * 同步性能基础设施配置
   * 当媒体类型或隔离目录发生变化时，需要重建文件索引
   */
  async syncPerformanceInfraSettings(forceFullScan = false) {
    const enabledExtensions = getEnabledExtensions(this.settings);
    const trashFolder = normalizeVaultPath(this.settings.trashFolder) || DEFAULT_SETTINGS.trashFolder;
    const extensionsKey = [...enabledExtensions].sort().join("|");
    const needsRescan = forceFullScan || !this.fileIndex.isInitialized || this.indexedExtensionsKey !== extensionsKey || this.indexedTrashFolder !== trashFolder;
    this.fileIndex.setEnabledExtensions(enabledExtensions);
    this.fileIndex.setTrashFolder(trashFolder);
    this.indexedExtensionsKey = extensionsKey;
    this.indexedTrashFolder = trashFolder;
    if (needsRescan) {
      await this.fileIndex.fullScan();
    }
  }
  /**
   * 处理 Vault 文件变化
   */
  handleVaultFileChange(file, oldPath) {
    if (file instanceof import_obsidian10.TFolder) {
      this.clearCache();
      if (this.settings.autoRefresh) {
        this.scheduleRefreshOpenViews();
      }
      return;
    }
    if (!(file instanceof import_obsidian10.TFile)) {
      return;
    }
    const normalizedOldPath = normalizeVaultPath(oldPath || "").toLowerCase();
    const oldWasMarkdown = normalizedOldPath.endsWith(".md");
    const oldWasMedia = normalizedOldPath ? isMediaFile(normalizedOldPath) : false;
    const isMarkdown = file.extension === "md";
    const isMedia = isMediaFile(file.name);
    if (isMarkdown || oldWasMarkdown) {
      this.clearCache();
    }
    if (!isMedia && !oldWasMedia) {
      return;
    }
    if (!(isMarkdown || oldWasMarkdown)) {
      this.clearCache();
    }
    if (this.settings.autoRefresh) {
      this.scheduleRefreshOpenViews();
    }
  }
  /**
   * 防抖刷新已打开视图
   */
  scheduleRefreshOpenViews(delayMs = 300) {
    if (this.refreshViewsTimer) {
      clearTimeout(this.refreshViewsTimer);
    }
    this.refreshViewsTimer = setTimeout(() => {
      this.refreshViewsTimer = null;
      void this.refreshOpenViews();
    }, delayMs);
  }
  /**
   * 刷新所有已打开的插件视图
   */
  async refreshOpenViews() {
    const tasks = [];
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_IMAGE_LIBRARY)) {
      const view = leaf.view;
      if (view instanceof ImageLibraryView) {
        tasks.push(view.refreshImages());
      }
    }
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_UNREFERENCED_IMAGES)) {
      const view = leaf.view;
      if (view instanceof UnreferencedImagesView) {
        tasks.push(view.scanUnreferencedImages());
      }
    }
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TRASH_MANAGEMENT)) {
      const view = leaf.view;
      if (view instanceof TrashManagementView) {
        tasks.push(view.loadTrashItems());
      }
    }
    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
  }
  /**
   * 打开隔离文件夹管理视图
   */
  async openTrashManagement() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_TRASH_MANAGEMENT)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: VIEW_TYPE_TRASH_MANAGEMENT,
        active: true
      });
    }
    workspace.revealLeaf(leaf);
  }
  /**
   * 打开媒体预览
   */
  openMediaPreview(file) {
    if (!this.settings.enablePreviewModal) {
      const src = this.app.vault.getResourcePath(file);
      window.open(src, "_blank", "noopener,noreferrer");
      return;
    }
    new MediaPreviewModal(this.app, this, file).open();
  }
  onunload() {
    if (this.refreshViewsTimer) {
      clearTimeout(this.refreshViewsTimer);
      this.refreshViewsTimer = null;
    }
    this.thumbnailCache.close();
    this.fileIndex.clear();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_IMAGE_LIBRARY);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_UNREFERENCED_IMAGES);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TRASH_MANAGEMENT);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DUPLICATE_DETECTION);
    this.removeManagedStyles();
  }
  removeManagedStyles() {
    document.getElementById("obsidian-media-toolkit-styles")?.remove();
    document.getElementById("image-manager-styles")?.remove();
  }
  /**
   * 打开重复检测视图
   */
  async openDuplicateDetection() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_DUPLICATE_DETECTION)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: VIEW_TYPE_DUPLICATE_DETECTION,
        active: true
      });
    }
    workspace.revealLeaf(leaf);
  }
  // 加载样式文件
  // 注意：优先使用 styles.css 中的样式，addStyle 作为后备方案
  async addStyle() {
    const loaded = await this.loadExternalStyles();
    if (!loaded) {
      this.addInlineStyle();
    }
  }
  // 从外部样式文件加载
  async loadExternalStyles() {
    if (document.getElementById("obsidian-media-toolkit-styles")) {
      return true;
    }
    const stylePaths = [
      this.manifest.dir ? `${normalizeVaultPath(this.manifest.dir)}/styles.css` : "",
      `.obsidian/plugins/${this.manifest.id}/styles.css`,
      "styles.css"
    ].filter((path, index, arr) => path && arr.indexOf(path) === index);
    try {
      for (const stylePath of stylePaths) {
        if (!await this.app.vault.adapter.exists(stylePath)) {
          continue;
        }
        const content = await this.app.vault.adapter.read(stylePath);
        const sanitizedCss = content.replace(/expression\s*\(/gi, "/* blocked */(").replace(/javascript\s*:/gi, "/* blocked */:").replace(/vbscript\s*:/gi, "/* blocked */:").replace(/url\s*\([^)]*\)/gi, "/* url() blocked */").replace(/@import\s*[^;]+;/gi, "/* @import blocked */").replace(/\bon(click|error|load|mouseover|mouseout|focus|blur|change|submit|keydown|keyup)\s*=/gi, "data-blocked-on$1=").replace(/filter\s*:\s*url\s*\([^)]*\)/gi, "/* filter:url() blocked */").replace(/behavior\s*:/gi, "/* behavior blocked */:").replace(/-ms-behavior\s*:/gi, "/* -ms-behavior blocked */:").replace(/binding\s*:\s*url\s*\([^)]*\)/gi, "/* binding blocked */").replace(/(animation|transition)\s*:[^;]*url\s*\([^)]*\)/gi, "/* $1 url() blocked */");
        const styleEl = document.createElement("style");
        styleEl.id = "obsidian-media-toolkit-styles";
        styleEl.textContent = sanitizedCss;
        document.head.appendChild(styleEl);
        return true;
      }
    } catch (error) {
      console.log("\u52A0\u8F7D\u5916\u90E8\u6837\u5F0F\u6587\u4EF6\u5931\u8D25\uFF0C\u4F7F\u7528\u5185\u8054\u6837\u5F0F", error);
    }
    return false;
  }
  // 内联样式（后备方案）
  addInlineStyle() {
    if (document.getElementById("image-manager-styles")) {
      return;
    }
    const styleEl = document.createElement("style");
    styleEl.id = "image-manager-styles";
    styleEl.textContent = `/* Obsidian Image Manager Plugin Styles */

/* ===== \u5168\u5C40\u6837\u5F0F ===== */
.image-library-view,
.unreferenced-images-view {
	height: 100%;
	overflow-y: auto;
	padding: 16px;
	box-sizing: border-box;
}

/* ===== \u5934\u90E8\u6837\u5F0F ===== */
.image-library-header,
.unreferenced-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.image-library-header h2,
.unreferenced-header h2 {
	margin: 0;
	font-size: 1.5em;
	font-weight: 600;
}

.image-stats,
.header-description {
	margin-top: 4px;
	color: var(--text-muted);
	font-size: 0.9em;
}

.header-description {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

/* ===== \u6309\u94AE\u6837\u5F0F ===== */
.refresh-button,
.action-button,
.item-button {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	border: none;
	background: var(--background-secondary);
	color: var(--text-normal);
	border-radius: 4px;
	cursor: pointer;
	transition: background 0.2s, color 0.2s;
}

.refresh-button:hover,
.action-button:hover,
.item-button:hover {
	background: var(--background-tertiary);
}

.refresh-button svg,
.action-button svg,
.item-button svg {
	width: 16px;
	height: 16px;
}

.action-button.danger,
.item-button.danger {
	color: var(--text-error);
}

.action-button.danger:hover,
.item-button.danger:hover {
	background: var(--background-modifier-error);
	color: white;
}

.header-actions {
	display: flex;
	gap: 8px;
}

/* ===== \u6392\u5E8F\u9009\u62E9\u5668 ===== */
.sort-select {
	padding: 6px 12px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-secondary);
	color: var(--text-normal);
	font-size: 0.9em;
	cursor: pointer;
}

.order-button {
	padding: 6px 8px;
	margin-left: 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-secondary);
	color: var(--text-normal);
	cursor: pointer;
}

.order-button svg {
	width: 16px;
	height: 16px;
}

/* ===== \u56FE\u7247\u7F51\u683C ===== */
.image-grid {
	display: grid;
	gap: 16px;
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.image-grid-small {
	grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}

.image-grid-medium {
	grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.image-grid-large {
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* ===== \u56FE\u7247\u9879 ===== */
.image-item {
	display: flex;
	flex-direction: column;
	background: var(--background-secondary);
	border-radius: 8px;
	overflow: hidden;
	transition: transform 0.2s, box-shadow 0.2s;
	cursor: pointer;
}

.image-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-container {
	position: relative;
	width: 100%;
	padding-top: 100%;
	overflow: hidden;
	background: var(--background-tertiary);
}

.image-container img {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.image-info {
	padding: 8px;
	border-top: 1px solid var(--background-modifier-border);
}

.image-name {
	font-size: 0.85em;
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.image-size {
	font-size: 0.75em;
	color: var(--text-muted);
	margin-top: 2px;
}

/* ===== \u672A\u5F15\u7528\u56FE\u7247\u5217\u8868 ===== */
.stats-bar {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px 16px;
	background: var(--background-secondary);
	border-radius: 6px;
	margin-bottom: 16px;
}

.stats-count {
	font-weight: 600;
	color: var(--text-warning);
}

.stats-size {
	color: var(--text-muted);
}

.unreferenced-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.unreferenced-item {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px;
	background: var(--background-secondary);
	border-radius: 8px;
	transition: background 0.2s;
}

.unreferenced-item:hover {
	background: var(--background-tertiary);
}

.item-thumbnail {
	width: 60px;
	height: 60px;
	flex-shrink: 0;
	border-radius: 4px;
	overflow: hidden;
	background: var(--background-tertiary);
}

.item-thumbnail img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.item-info {
	flex: 1;
	min-width: 0;
}

.item-name {
	font-weight: 500;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-path {
	font-size: 0.8em;
	color: var(--text-muted);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-top: 2px;
}

.item-size {
	font-size: 0.85em;
	color: var(--text-muted);
	margin-top: 4px;
}

.item-actions {
	display: flex;
	gap: 8px;
	flex-shrink: 0;
}

/* ===== \u7A7A\u72B6\u6001 ===== */
.empty-state,
.loading-state,
.success-state,
.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 48px;
	color: var(--text-muted);
	text-align: center;
}

.empty-state::before {
	content: '\u{1F5BC}\uFE0F';
	font-size: 48px;
	margin-bottom: 16px;
}

.success-state::before {
	content: '\u2705';
	font-size: 48px;
	margin-bottom: 16px;
}

.error-state::before {
	content: '\u274C';
	font-size: 48px;
	margin-bottom: 16px;
}

/* \u52A0\u8F7D\u52A8\u753B */
.spinner {
	width: 32px;
	height: 32px;
	border: 3px solid var(--background-modifier-border);
	border-top-color: var(--text-accent);
	border-radius: 50%;
	animation: spin 1s linear infinite;
	margin-bottom: 16px;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

/* ===== \u8BBE\u7F6E\u9875\u9762\u6837\u5F0F ===== */
.settings-divider {
	margin: 24px 0;
	border: none;
	border-top: 1px solid var(--background-modifier-border);
}

.settings-description {
	color: var(--text-muted);
	margin-bottom: 8px;
}

.settings-list {
	margin: 0;
	padding-left: 20px;
	color: var(--text-muted);
}

.settings-list li {
	margin-bottom: 4px;
}

/* ===== \u641C\u7D22\u6846\u6837\u5F0F ===== */
.search-container {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 16px;
	padding: 8px 12px;
	background: var(--background-secondary);
	border-radius: 6px;
}

.search-input {
	flex: 1;
	padding: 8px 12px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-primary);
	color: var(--text-normal);
	font-size: 0.9em;
}

.search-input:focus {
	outline: none;
	border-color: var(--text-accent);
}

.search-icon {
	color: var(--text-muted);
}

.search-results-count {
	color: var(--text-muted);
	font-size: 0.85em;
}

.clear-search {
	padding: 4px;
	border: none;
	background: transparent;
	color: var(--text-muted);
	cursor: pointer;
}

.clear-search:hover {
	color: var(--text-normal);
}

/* ===== \u5206\u9875\u63A7\u4EF6 ===== */
.pagination {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	margin-top: 20px;
	padding: 16px;
	background: var(--background-secondary);
	border-radius: 6px;
}

.page-button {
	padding: 6px 12px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-secondary);
	color: var(--text-normal);
	cursor: pointer;
}

.page-button:hover:not(:disabled) {
	background: var(--background-tertiary);
}

.page-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.page-info {
	color: var(--text-muted);
	font-size: 0.9em;
}

.page-jump-input {
	width: 50px;
	padding: 4px 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-primary);
	color: var(--text-normal);
	text-align: center;
}

/* ===== \u9009\u62E9\u6A21\u5F0F\u5DE5\u5177\u680F ===== */
.selection-toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
	padding: 12px;
	background: var(--background-secondary);
	border-radius: 6px;
}

.selection-count {
	font-weight: 600;
	color: var(--text-accent);
}

.toolbar-button {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	border: none;
	background: var(--background-tertiary);
	color: var(--text-normal);
	border-radius: 4px;
	cursor: pointer;
}

.toolbar-button:hover {
	background: var(--background-modifier-border);
}

.toolbar-button.danger {
	color: var(--text-error);
}

.toolbar-button.danger:hover {
	background: var(--background-modifier-error);
	color: white;
}

/* ===== \u56FE\u7247\u9009\u62E9\u6846 ===== */
.image-item {
	position: relative;
}

.item-checkbox {
	position: absolute;
	top: 8px;
	left: 8px;
	z-index: 10;
	width: 18px;
	height: 18px;
	cursor: pointer;
}

/* ===== \u9694\u79BB\u6587\u4EF6\u7BA1\u7406\u89C6\u56FE ===== */
.trash-management-view {
	height: 100%;
	overflow-y: auto;
	padding: 16px;
	box-sizing: border-box;
}

.trash-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.trash-header h2 {
	margin: 0;
	font-size: 1.5em;
	font-weight: 600;
}

.trash-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.trash-item {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px;
	background: var(--background-secondary);
	border-radius: 8px;
	transition: background 0.2s;
}

.trash-item:hover {
	background: var(--background-tertiary);
}

.item-icon {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--background-tertiary);
	border-radius: 4px;
	color: var(--text-muted);
}

.item-original-path {
	font-size: 0.8em;
	color: var(--text-muted);
	margin-top: 2px;
}

.item-date {
	font-size: 0.8em;
	color: var(--text-muted);
	margin-top: 2px;
}

/* ===== \u5A92\u4F53\u9884\u89C8 Modal ===== */
.media-preview-modal {
	max-width: 90vw;
	max-height: 90vh;
}

.media-preview-modal .modal-content {
	padding: 0;
	background: var(--background-primary);
}

.preview-close {
	position: absolute;
	top: 10px;
	right: 15px;
	font-size: 24px;
	color: var(--text-muted);
	cursor: pointer;
	z-index: 100;
}

.preview-close:hover {
	color: var(--text-normal);
}

.preview-container {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 400px;
	max-height: 70vh;
	overflow: auto;
}

.preview-image {
	max-width: 100%;
	max-height: 70vh;
	object-fit: contain;
}

.preview-video,
.preview-audio {
	max-width: 100%;
}

.preview-pdf {
	width: 100%;
	height: 70vh;
	border: none;
}

.preview-unsupported {
	padding: 40px;
	color: var(--text-muted);
}

.preview-nav {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	left: 0;
	right: 0;
	display: flex;
	justify-content: space-between;
	padding: 0 20px;
	pointer-events: none;
}

.nav-button {
	pointer-events: auto;
	font-size: 32px;
	padding: 10px 15px;
	border: none;
	background: var(--background-secondary);
	color: var(--text-normal);
	border-radius: 4px;
	cursor: pointer;
}

.nav-button:hover {
	background: var(--background-tertiary);
}

.nav-info {
	position: absolute;
	bottom: 10px;
	left: 50%;
	transform: translateX(-50%);
	padding: 4px 12px;
	background: var(--background-secondary);
	border-radius: 4px;
	font-size: 0.9em;
	color: var(--text-muted);
}

.preview-info-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 20px;
	background: var(--background-secondary);
	border-top: 1px solid var(--background-modifier-border);
}

.info-name {
	font-weight: 500;
}

.info-actions {
	display: flex;
	gap: 8px;
}

.info-actions button {
	padding: 4px 8px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: transparent;
	color: var(--text-normal);
	cursor: pointer;
}

.info-actions button:hover {
	background: var(--background-tertiary);
}

/* ===== \u91CD\u590D\u68C0\u6D4B\uFF08\u540E\u5907\u6837\u5F0F\uFF09 ===== */
.duplicate-empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16px;
	padding: 48px 24px;
	color: var(--text-muted);
	text-align: center;
}

.duplicate-empty-action {
	margin-top: 8px;
}

.duplicate-scan-progress {
	padding: 20px;
	text-align: center;
}

.duplicate-progress-bar {
	height: 8px;
	background: var(--background-modifier-border);
	border-radius: 4px;
	overflow: hidden;
	margin: 16px 0;
}

.duplicate-progress-fill {
	height: 100%;
	background: var(--interactive-accent);
	border-radius: 4px;
	transition: width 0.3s ease;
}

.duplicate-progress-text {
	font-size: 0.9em;
	color: var(--text-muted);
}

.duplicate-detection-view {
	height: 100%;
	overflow-y: auto;
	padding: 16px;
	box-sizing: border-box;
}

.duplicate-header {
	margin-bottom: 16px;
	padding-bottom: 12px;
	border-bottom: 1px solid var(--background-modifier-border);
}

.duplicate-header-description {
	margin-top: 4px;
	color: var(--text-muted);
	font-size: 0.9em;
}

.duplicate-header-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
	margin-top: 8px;
}

.duplicate-action-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	padding: 8px 12px;
	border: none;
	background: var(--background-secondary);
	color: var(--text-normal);
	border-radius: 6px;
	cursor: pointer;
	transition: background 0.2s, color 0.2s, opacity 0.2s;
}

.duplicate-action-button:hover:not(:disabled) {
	background: var(--background-tertiary);
}

.duplicate-action-button:disabled {
	opacity: 0.6;
	cursor: wait;
}

.duplicate-action-button-primary {
	background: var(--interactive-accent);
	color: var(--text-on-accent);
}

.duplicate-action-button-primary:hover:not(:disabled) {
	background: var(--interactive-accent-hover);
}

.duplicate-threshold-label {
	font-size: 0.85em;
	color: var(--text-muted);
}

.duplicate-stats-bar {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 12px 16px;
	background: var(--background-secondary);
	border-radius: 6px;
	margin-bottom: 16px;
}

.duplicate-stats-count {
	font-weight: 600;
	color: var(--text-warning);
}

.duplicate-group {
	margin-bottom: 16px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 8px;
	overflow: hidden;
}

.duplicate-group-header {
	display: flex;
	justify-content: space-between;
	padding: 8px 12px;
	background: var(--background-secondary);
	font-weight: 600;
}

.duplicate-group-count {
	color: var(--text-muted);
	font-weight: normal;
	font-size: 0.85em;
}

.duplicate-group-file {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 12px;
	border-top: 1px solid var(--background-modifier-border);
	position: relative;
}

.duplicate-keep-suggestion {
	background: rgba(0, 200, 83, 0.05);
}

.duplicate-file-suggestion {
	background: rgba(255, 152, 0, 0.05);
}

.duplicate-file-thumbnail {
	width: 60px;
	height: 60px;
	border-radius: 6px;
	overflow: hidden;
	flex-shrink: 0;
}

.duplicate-file-thumbnail img {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.duplicate-file-info {
	flex: 1;
	min-width: 0;
}

.duplicate-file-name,
.duplicate-file-path {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.duplicate-file-name {
	font-weight: 500;
}

.duplicate-file-path,
.duplicate-file-meta {
	font-size: 0.8em;
	color: var(--text-muted);
}

.duplicate-similarity-badge {
	display: inline-block;
	padding: 1px 6px;
	border-radius: 8px;
	background: var(--interactive-accent);
	color: var(--text-on-accent);
	font-size: 0.75em;
	font-weight: 600;
}

.duplicate-keep-badge {
	position: absolute;
	top: 8px;
	right: 12px;
	font-size: 0.85em;
}

.duplicate-quarantine-btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 10px;
	border-radius: 6px;
	font-size: 0.8em;
	cursor: pointer;
	background: rgba(255, 152, 0, 0.15);
	color: var(--color-orange, #ff9800);
	border: none;
	position: absolute;
	top: 8px;
	right: 12px;
}

.duplicate-quarantine-btn:hover {
	background: rgba(255, 152, 0, 0.3);
}

/* ===== \u54CD\u5E94\u5F0F\u8BBE\u8BA1 ===== */
@media (max-width: 768px) {
	.image-library-header,
	.unreferenced-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	.header-actions {
		width: 100%;
		justify-content: flex-end;
	}

	.unreferenced-item {
		flex-direction: column;
		align-items: flex-start;
	}

	.item-actions {
		width: 100%;
		justify-content: flex-end;
		margin-top: 8px;
	}
}`;
    document.head.appendChild(styleEl);
  }
  async loadSettings() {
    try {
      const loaded = await this.loadData();
      const sanitized = loaded && typeof loaded === "object" ? Object.fromEntries(
        Object.entries(loaded).filter(
          ([k]) => k !== "__proto__" && k !== "constructor" && k !== "prototype"
        )
      ) : {};
      const merged = Object.assign({}, DEFAULT_SETTINGS, sanitized);
      const toBool = (value, fallback) => typeof value === "boolean" ? value : fallback;
      const imageFolder = normalizeVaultPath(typeof merged.imageFolder === "string" ? merged.imageFolder : "");
      const trashFolderRaw = typeof merged.trashFolder === "string" ? merged.trashFolder : DEFAULT_SETTINGS.trashFolder;
      const trashFolder = normalizeVaultPath(trashFolderRaw) || DEFAULT_SETTINGS.trashFolder;
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...merged,
        imageFolder,
        trashFolder,
        thumbnailSize: ["small", "medium", "large"].includes(String(merged.thumbnailSize)) ? merged.thumbnailSize : DEFAULT_SETTINGS.thumbnailSize,
        sortBy: ["name", "date", "size"].includes(String(merged.sortBy)) ? merged.sortBy : DEFAULT_SETTINGS.sortBy,
        sortOrder: ["asc", "desc"].includes(String(merged.sortOrder)) ? merged.sortOrder : DEFAULT_SETTINGS.sortOrder,
        defaultAlignment: ["left", "center", "right"].includes(String(merged.defaultAlignment)) ? merged.defaultAlignment : DEFAULT_SETTINGS.defaultAlignment,
        language: ["zh", "en", "system"].includes(String(merged.language)) ? merged.language : "system",
        trashCleanupDays: Math.max(1, Math.min(365, Number(merged.trashCleanupDays) || DEFAULT_SETTINGS.trashCleanupDays)),
        pageSize: Math.max(1, Math.min(1e3, Number(merged.pageSize) || DEFAULT_SETTINGS.pageSize)),
        showImageInfo: toBool(merged.showImageInfo, DEFAULT_SETTINGS.showImageInfo),
        autoRefresh: toBool(merged.autoRefresh, DEFAULT_SETTINGS.autoRefresh),
        useTrashFolder: toBool(merged.useTrashFolder, DEFAULT_SETTINGS.useTrashFolder),
        autoCleanupTrash: toBool(merged.autoCleanupTrash, DEFAULT_SETTINGS.autoCleanupTrash),
        enableImages: toBool(merged.enableImages, DEFAULT_SETTINGS.enableImages),
        enableVideos: toBool(merged.enableVideos, DEFAULT_SETTINGS.enableVideos),
        enableAudio: toBool(merged.enableAudio, DEFAULT_SETTINGS.enableAudio),
        enablePDF: toBool(merged.enablePDF, DEFAULT_SETTINGS.enablePDF),
        enablePreviewModal: toBool(merged.enablePreviewModal, DEFAULT_SETTINGS.enablePreviewModal),
        enableKeyboardNav: toBool(merged.enableKeyboardNav, DEFAULT_SETTINGS.enableKeyboardNav),
        // 新增设置字段
        safeScanEnabled: toBool(merged.safeScanEnabled, DEFAULT_SETTINGS.safeScanEnabled),
        safeScanUnrefDays: Math.max(1, Math.min(365, Number(merged.safeScanUnrefDays) || DEFAULT_SETTINGS.safeScanUnrefDays)),
        safeScanMinSize: Math.max(0, Number(merged.safeScanMinSize) || DEFAULT_SETTINGS.safeScanMinSize),
        duplicateThreshold: Math.max(50, Math.min(100, Number(merged.duplicateThreshold) || DEFAULT_SETTINGS.duplicateThreshold)),
        organizeRules: Array.isArray(merged.organizeRules) ? merged.organizeRules : DEFAULT_SETTINGS.organizeRules,
        defaultProcessQuality: Math.max(1, Math.min(100, Number(merged.defaultProcessQuality) || DEFAULT_SETTINGS.defaultProcessQuality)),
        defaultProcessFormat: ["webp", "jpeg", "png"].includes(String(merged.defaultProcessFormat)) ? merged.defaultProcessFormat : DEFAULT_SETTINGS.defaultProcessFormat,
        watermarkText: typeof merged.watermarkText === "string" ? merged.watermarkText : DEFAULT_SETTINGS.watermarkText
      };
    } catch (error) {
      console.error("\u52A0\u8F7D\u8BBE\u7F6E\u5931\u8D25\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u8BBE\u7F6E:", error);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }
  async saveSettings() {
    this.settings.imageFolder = normalizeVaultPath(this.settings.imageFolder);
    this.settings.trashFolder = normalizeVaultPath(this.settings.trashFolder) || DEFAULT_SETTINGS.trashFolder;
    await this.saveData(this.settings);
    await this.syncPerformanceInfraSettings();
    this.clearCache();
    this.scheduleRefreshOpenViews(150);
  }
  /**
   * 清除引用缓存
   * 当设置变更影响缓存有效性时调用
   */
  clearCache() {
    this.referencedImagesCache = null;
    this.cacheTimestamp = 0;
  }
  async openImageLibrary() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_IMAGE_LIBRARY)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: VIEW_TYPE_IMAGE_LIBRARY,
        active: true
      });
    }
    workspace.revealLeaf(leaf);
  }
  async findUnreferencedImages() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_UNREFERENCED_IMAGES)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: VIEW_TYPE_UNREFERENCED_IMAGES,
        active: true
      });
    }
    workspace.revealLeaf(leaf);
  }
  // 获取所有媒体文件（图片、音视频、PDF）
  async getAllImageFiles() {
    const enabledExtensions = getEnabledExtensions({
      enableImages: this.settings.enableImages,
      enableVideos: this.settings.enableVideos,
      enableAudio: this.settings.enableAudio,
      enablePDF: this.settings.enablePDF
    });
    if (enabledExtensions.length === 0) {
      new import_obsidian10.Notice(this.t("allMediaTypesDisabled"));
      return [];
    }
    const allFiles = this.app.vault.getFiles();
    return allFiles.filter(
      (file) => enabledExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    );
  }
  // 获取所有图片文件（保留兼容性）
  async getAllMediaFiles() {
    return this.getAllImageFiles();
  }
  // 获取所有Markdown文件中引用的图片
  async getReferencedImages(signal) {
    const now = Date.now();
    if (this.referencedImagesCache && now - this.cacheTimestamp < _ImageManagerPlugin.CACHE_DURATION) {
      return this.referencedImagesCache;
    }
    if (signal?.aborted) {
      throw new Error("Scan cancelled");
    }
    const referenced = /* @__PURE__ */ new Set();
    const { vault } = this.app;
    const enabledExtensions = getEnabledExtensions({
      enableImages: this.settings.enableImages,
      enableVideos: this.settings.enableVideos,
      enableAudio: this.settings.enableAudio,
      enablePDF: this.settings.enablePDF
    });
    const extensionPattern = enabledExtensions.map((ext) => ext.slice(1)).join("|");
    if (!extensionPattern) {
      this.referencedImagesCache = referenced;
      this.cacheTimestamp = now;
      return referenced;
    }
    const wikiLinkPatternSource = `\\[\\[([^\\]|]+\\.(?:${extensionPattern}))(?:\\|[^\\]]*)?\\]\\]`;
    const markdownLinkPatternSource = `!?\\[[^\\]]*\\]\\(([^)]+\\.(?:${extensionPattern})(?:\\?[^)#]*)?(?:#[^)]+)?)\\)`;
    const addReferencedPath = (rawPath, sourceFilePath) => {
      if (!rawPath) return;
      let candidate = rawPath.trim();
      if (candidate.startsWith("<") && candidate.endsWith(">")) {
        candidate = candidate.slice(1, -1).trim();
      }
      candidate = candidate.replace(/\\ /g, " ");
      candidate = safeDecodeURIComponent(candidate);
      if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
        return;
      }
      const [withoutQuery] = candidate.split(/[?#]/);
      const normalizedCandidate = normalizeVaultPath(withoutQuery);
      const resolvedFile = this.app.metadataCache.getFirstLinkpathDest(
        normalizedCandidate || withoutQuery,
        sourceFilePath
      );
      const normalized = resolvedFile ? normalizeVaultPath(resolvedFile.path).toLowerCase() : normalizedCandidate.toLowerCase();
      if (!normalized) return;
      referenced.add(normalized);
    };
    const markdownFiles = vault.getFiles().filter((f) => f.extension === "md");
    const totalFiles = markdownFiles.length;
    const SCAN_TIMEOUT = 5 * 60 * 1e3;
    const scanStartTime = Date.now();
    let timeoutId = null;
    if (!signal) {
      timeoutId = setTimeout(() => {
        console.warn("Scan timeout reached, returning partial results");
      }, SCAN_TIMEOUT);
    }
    if (signal) {
      signal.addEventListener("abort", () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        console.warn("Scan aborted by external signal");
      });
    }
    let scanNotice = null;
    if (totalFiles > 100) {
      scanNotice = new import_obsidian10.Notice(this.t("scanningReferences") + ` (0/${totalFiles})`, 0);
    }
    const BATCH_SIZE = 20;
    for (let i = 0; i < markdownFiles.length; i += BATCH_SIZE) {
      if (Date.now() - scanStartTime > SCAN_TIMEOUT) {
        console.warn("Scan timeout reached, returning partial results");
        break;
      }
      if (signal?.aborted) {
        console.warn("Scan aborted");
        break;
      }
      const batch = markdownFiles.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (file) => {
        if (signal?.aborted) {
          return;
        }
        let content;
        try {
          content = await vault.read(file);
        } catch {
          return;
        }
        const wikiLinkPattern = new RegExp(wikiLinkPatternSource, "gi");
        const markdownLinkPattern = new RegExp(markdownLinkPatternSource, "gi");
        let match;
        while ((match = wikiLinkPattern.exec(content)) !== null) {
          addReferencedPath(match[1], file.path);
        }
        while ((match = markdownLinkPattern.exec(content)) !== null) {
          addReferencedPath(match[1], file.path);
        }
      }));
      if (scanNotice && i % (BATCH_SIZE * 5) === 0) {
        scanNotice.hide();
        scanNotice = new import_obsidian10.Notice(this.t("scanningReferences") + ` (${Math.min(i + BATCH_SIZE, totalFiles)}/${totalFiles})`, 0);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (scanNotice) {
      scanNotice.hide();
      new import_obsidian10.Notice(this.t("scanComplete") + ` (${totalFiles} ${this.t("filesScanned")})`);
    }
    this.referencedImagesCache = referenced;
    this.cacheTimestamp = now;
    return referenced;
  }
  // 查找未引用的图片
  async findUnreferenced() {
    const allImages = await this.getAllImageFiles();
    const referenced = await this.getReferencedImages();
    return allImages.filter((file) => {
      const filePath = normalizeVaultPath(file.path).toLowerCase();
      return !referenced.has(filePath);
    });
  }
  // 手动刷新缓存
  async refreshCache() {
    this.referencedImagesCache = null;
    this.cacheTimestamp = 0;
    await this.getReferencedImages();
    new import_obsidian10.Notice(this.t("scanComplete"));
  }
  // 打开图片所在的笔记
  async openImageInNotes(imageFile) {
    const { workspace, vault } = this.app;
    const results = [];
    const imageName = imageFile.name;
    const markdownFiles = vault.getFiles().filter((f) => f.extension === "md");
    for (const file of markdownFiles) {
      let content;
      try {
        content = await vault.read(file);
      } catch {
        continue;
      }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(imageName) && (line.includes("[[") || line.includes("![") || line.includes("]("))) {
          results.push({ file, line: i + 1 });
          break;
        }
      }
    }
    if (results.length > 0) {
      const result = results[0];
      const leaf = workspace.getLeaf("tab");
      await leaf.openFile(result.file);
      if (result.line > 1) {
        setTimeout(() => {
          const view = workspace.getActiveViewOfType(import_obsidian10.MarkdownView);
          if (view) {
            const editor = view.editor;
            editor.setCursor({ ch: 0, line: result.line - 1 });
            editor.scrollIntoView({ from: { ch: 0, line: result.line - 1 }, to: { ch: 0, line: result.line - 1 } }, true);
          }
        }, 100);
      }
    } else {
      new import_obsidian10.Notice(this.t("notReferenced"));
    }
  }
  // 对齐选中的图片
  alignSelectedImage(editor, alignment) {
    const selection = editor.getSelection();
    if (!selection) {
      new import_obsidian10.Notice(this.t("selectImageFirst"));
      return;
    }
    if (!selection.includes("![") && !selection.includes("[[")) {
      new import_obsidian10.Notice(this.t("selectImage"));
      return;
    }
    const alignedText = ImageAlignment.applyAlignment(selection, alignment);
    editor.replaceSelection(alignedText);
    const alignmentKey = alignment === "left" ? "imageAlignedLeft" : alignment === "center" ? "imageAlignedCenter" : "imageAlignedRight";
    new import_obsidian10.Notice(this.t(alignmentKey));
  }
  // 添加编辑器上下文菜单项
  addAlignmentMenuItems(menu, editor) {
    const selection = editor.getSelection();
    if (!selection || !selection.includes("![") && !selection.includes("[[")) {
      return;
    }
    menu.addSeparator();
    menu.addItem((item) => {
      item.setTitle(this.t("alignImageLeft")).setIcon("align-left").onClick(() => {
        this.alignSelectedImage(editor, "left");
      });
    });
    menu.addItem((item) => {
      item.setTitle(this.t("alignImageCenter")).setIcon("align-center").onClick(() => {
        this.alignSelectedImage(editor, "center");
      });
    });
    menu.addItem((item) => {
      item.setTitle(this.t("alignImageRight")).setIcon("align-right").onClick(() => {
        this.alignSelectedImage(editor, "right");
      });
    });
  }
  /**
   * 确保目录存在（支持递归创建）
   */
  async ensureFolderExists(path) {
    const normalizedPath = normalizeVaultPath(path);
    if (!normalizedPath) {
      return true;
    }
    if (!isPathSafe(normalizedPath)) {
      return false;
    }
    const { vault } = this.app;
    const segments = normalizedPath.split("/").filter(Boolean);
    let currentPath = "";
    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;
      const existing = vault.getAbstractFileByPath(currentPath);
      if (existing instanceof import_obsidian10.TFolder) {
        continue;
      }
      if (existing) {
        return false;
      }
      try {
        await vault.createFolder(currentPath);
      } catch {
        const retried = vault.getAbstractFileByPath(currentPath);
        if (!(retried instanceof import_obsidian10.TFolder)) {
          return false;
        }
      }
    }
    return true;
  }
  // 安全删除文件到隔离文件夹
  async safeDeleteFile(file) {
    const { vault } = this.app;
    if (!this.settings.useTrashFolder) {
      try {
        await vault.delete(file);
        return true;
      } catch (error) {
        console.error("\u5220\u9664\u6587\u4EF6\u5931\u8D25:", error);
        new import_obsidian10.Notice(this.t("deleteFailedWithName", { name: file.name }));
        return false;
      }
    }
    const trashPath = normalizeVaultPath(this.settings.trashFolder) || DEFAULT_SETTINGS.trashFolder;
    if (!isPathSafe(trashPath)) {
      new import_obsidian10.Notice(this.t("operationFailed", { name: file.name }));
      return false;
    }
    const fileName = file.name;
    const timestamp = Date.now();
    const encodedOriginalPath = encodeURIComponent(normalizeVaultPath(file.path) || file.name);
    const newFileName = `${timestamp}__${encodedOriginalPath}`;
    const targetPath = `${trashPath}/${newFileName}`;
    try {
      const folderReady = await this.ensureFolderExists(trashPath);
      if (!folderReady) {
        new import_obsidian10.Notice(this.t("operationFailed", { name: fileName }));
        return false;
      }
      await vault.rename(file, targetPath);
      new import_obsidian10.Notice(this.t("movedToTrash", { name: fileName }));
      return true;
    } catch (error) {
      console.error("\u79FB\u52A8\u6587\u4EF6\u5230\u9694\u79BB\u6587\u4EF6\u5939\u5931\u8D25:", error);
      new import_obsidian10.Notice(this.t("operationFailed", { name: fileName }));
      return false;
    }
  }
  // 恢复隔离文件夹中的文件
  async restoreFile(file, originalPath) {
    const { vault } = this.app;
    const normalizedOriginalPath = normalizeVaultPath(safeDecodeURIComponent(originalPath));
    if (!normalizedOriginalPath || !isPathSafe(normalizedOriginalPath)) {
      new import_obsidian10.Notice(this.t("restoreFailed", { message: this.t("error") }));
      return false;
    }
    const targetFile = vault.getAbstractFileByPath(normalizedOriginalPath);
    if (targetFile) {
      new import_obsidian10.Notice(this.t("restoreFailed", { message: this.t("targetFileExists") }));
      return false;
    }
    const parentPath = getParentPath(normalizedOriginalPath);
    if (parentPath) {
      const parentReady = await this.ensureFolderExists(parentPath);
      if (!parentReady) {
        new import_obsidian10.Notice(this.t("restoreFailed", { message: this.t("error") }));
        return false;
      }
    }
    const restoredName = getFileNameFromPath(normalizedOriginalPath) || file.name;
    try {
      await vault.rename(file, normalizedOriginalPath);
      new import_obsidian10.Notice(this.t("restoreSuccess", { name: restoredName }));
      return true;
    } catch (error) {
      console.error("\u6062\u590D\u6587\u4EF6\u5931\u8D25:", error);
      new import_obsidian10.Notice(this.t("restoreFailed", { message: error.message }));
      return false;
    }
  }
  // 彻底删除隔离文件夹中的文件
  async permanentlyDeleteFile(file) {
    const { vault } = this.app;
    try {
      await vault.delete(file);
      new import_obsidian10.Notice(this.t("fileDeleted", { name: file.name }));
      return true;
    } catch (error) {
      console.error("\u5F7B\u5E95\u5220\u9664\u6587\u4EF6\u5931\u8D25:", error);
      new import_obsidian10.Notice(this.t("deleteFailed"));
      return false;
    }
  }
};
_ImageManagerPlugin.LEGACY_TRASH_FOLDER = ".obsidian-media-toolkit-trash";
_ImageManagerPlugin.CACHE_DURATION = 5 * 60 * 1e3;
var ImageManagerPlugin = _ImageManagerPlugin;
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJ2aWV3L0ltYWdlTGlicmFyeVZpZXcudHMiLCAidXRpbHMvZm9ybWF0LnRzIiwgInV0aWxzL3BhdGgudHMiLCAidXRpbHMvbWVkaWFUeXBlcy50cyIsICJ1dGlscy90aHVtYm5haWxDYWNoZS50cyIsICJ1dGlscy9leGlmUmVhZGVyLnRzIiwgInV0aWxzL3J1bGVFbmdpbmUudHMiLCAidXRpbHMvbWVkaWFQcm9jZXNzb3IudHMiLCAidmlldy9VbnJlZmVyZW5jZWRJbWFnZXNWaWV3LnRzIiwgInZpZXcvRGVsZXRlQ29uZmlybU1vZGFsLnRzIiwgInZpZXcvVHJhc2hNYW5hZ2VtZW50Vmlldy50cyIsICJ1dGlscy9zZWN1cml0eS50cyIsICJ2aWV3L0R1cGxpY2F0ZURldGVjdGlvblZpZXcudHMiLCAidXRpbHMvcGVyY2VwdHVhbEhhc2gudHMiLCAidmlldy9NZWRpYVByZXZpZXdNb2RhbC50cyIsICJzZXR0aW5ncy50cyIsICJ1dGlscy9pbWFnZUFsaWdubWVudC50cyIsICJ1dGlscy9wb3N0UHJvY2Vzc29yLnRzIiwgInV0aWxzL2kxOG4udHMiLCAidXRpbHMvZmlsZVdhdGNoZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBsdWdpbiwgRWRpdG9yLCBURmlsZSwgVEZvbGRlciwgVEFic3RyYWN0RmlsZSwgTWFya2Rvd25WaWV3LCBOb3RpY2UsIE1lbnUsIE1lbnVJdGVtIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgSW1hZ2VMaWJyYXJ5VmlldywgVklFV19UWVBFX0lNQUdFX0xJQlJBUlkgfSBmcm9tICcuL3ZpZXcvSW1hZ2VMaWJyYXJ5Vmlldyc7XG5pbXBvcnQgeyBVbnJlZmVyZW5jZWRJbWFnZXNWaWV3LCBWSUVXX1RZUEVfVU5SRUZFUkVOQ0VEX0lNQUdFUyB9IGZyb20gJy4vdmlldy9VbnJlZmVyZW5jZWRJbWFnZXNWaWV3JztcbmltcG9ydCB7IFRyYXNoTWFuYWdlbWVudFZpZXcsIFZJRVdfVFlQRV9UUkFTSF9NQU5BR0VNRU5UIH0gZnJvbSAnLi92aWV3L1RyYXNoTWFuYWdlbWVudFZpZXcnO1xuaW1wb3J0IHsgRHVwbGljYXRlRGV0ZWN0aW9uVmlldywgVklFV19UWVBFX0RVUExJQ0FURV9ERVRFQ1RJT04gfSBmcm9tICcuL3ZpZXcvRHVwbGljYXRlRGV0ZWN0aW9uVmlldyc7XG5pbXBvcnQgeyBNZWRpYVByZXZpZXdNb2RhbCB9IGZyb20gJy4vdmlldy9NZWRpYVByZXZpZXdNb2RhbCc7XG5pbXBvcnQgeyBJbWFnZU1hbmFnZXJTZXR0aW5ncywgREVGQVVMVF9TRVRUSU5HUywgU2V0dGluZ3NUYWIgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IEltYWdlQWxpZ25tZW50LCBBbGlnbm1lbnRUeXBlIH0gZnJvbSAnLi91dGlscy9pbWFnZUFsaWdubWVudCc7XG5pbXBvcnQgeyBBbGlnbm1lbnRQb3N0UHJvY2Vzc29yIH0gZnJvbSAnLi91dGlscy9wb3N0UHJvY2Vzc29yJztcbmltcG9ydCB7IHQgYXMgdHJhbnNsYXRlLCBnZXRTeXN0ZW1MYW5ndWFnZSwgTGFuZ3VhZ2UsIFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdXRpbHMvaTE4bic7XG5pbXBvcnQgeyBnZXRFbmFibGVkRXh0ZW5zaW9ucywgaXNNZWRpYUZpbGUgfSBmcm9tICcuL3V0aWxzL21lZGlhVHlwZXMnO1xuaW1wb3J0IHsgaXNQYXRoU2FmZSB9IGZyb20gJy4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgZ2V0RmlsZU5hbWVGcm9tUGF0aCwgZ2V0UGFyZW50UGF0aCwgbm9ybWFsaXplVmF1bHRQYXRoLCBzYWZlRGVjb2RlVVJJQ29tcG9uZW50IH0gZnJvbSAnLi91dGlscy9wYXRoJztcbmltcG9ydCB7IFRodW1ibmFpbENhY2hlIH0gZnJvbSAnLi91dGlscy90aHVtYm5haWxDYWNoZSc7XG5pbXBvcnQgeyBNZWRpYUZpbGVJbmRleCB9IGZyb20gJy4vdXRpbHMvZmlsZVdhdGNoZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbWFnZU1hbmFnZXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRzZXR0aW5nczogSW1hZ2VNYW5hZ2VyU2V0dGluZ3MgPSBERUZBVUxUX1NFVFRJTkdTO1xuXHRwcml2YXRlIHN0YXRpYyByZWFkb25seSBMRUdBQ1lfVFJBU0hfRk9MREVSID0gJy5vYnNpZGlhbi1tZWRpYS10b29sa2l0LXRyYXNoJztcblx0Ly8gXHU3RjEzXHU1QjU4XHU1RjE1XHU3NTI4XHU3Njg0XHU1NkZFXHU3MjQ3XHU0RUU1XHU2M0QwXHU5QUQ4XHU1OTI3XHU1NzhCIFZhdWx0IFx1NzY4NFx1NjAyN1x1ODBGRFxuXHRwcml2YXRlIHJlZmVyZW5jZWRJbWFnZXNDYWNoZTogU2V0PHN0cmluZz4gfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBjYWNoZVRpbWVzdGFtcDogbnVtYmVyID0gMDtcblx0cHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQ0FDSEVfRFVSQVRJT04gPSA1ICogNjAgKiAxMDAwOyAvLyBcdTdGMTNcdTVCNTg1XHU1MjA2XHU5NDlGXG5cdHByaXZhdGUgcmVmcmVzaFZpZXdzVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGw7XG5cblx0Ly8gXHU2MDI3XHU4MEZEXHVGRjFBXHU3RjI5XHU3NTY1XHU1NkZFXHU3RjEzXHU1QjU4ICsgXHU1ODlFXHU5MUNGXHU2NTg3XHU0RUY2XHU3RDIyXHU1RjE1XG5cdHRodW1ibmFpbENhY2hlOiBUaHVtYm5haWxDYWNoZSA9IG5ldyBUaHVtYm5haWxDYWNoZSgpO1xuXHRmaWxlSW5kZXg6IE1lZGlhRmlsZUluZGV4ID0gbmV3IE1lZGlhRmlsZUluZGV4KG51bGwgYXMgYW55KTtcblx0cHJpdmF0ZSBpbmRleGVkRXh0ZW5zaW9uc0tleTogc3RyaW5nID0gJyc7XG5cdHByaXZhdGUgaW5kZXhlZFRyYXNoRm9sZGVyOiBzdHJpbmcgPSAnJztcblxuXHQvKipcblx0ICogXHU4M0I3XHU1M0Q2XHU1RjUzXHU1MjREXHU4QkVEXHU4QTAwXHU4QkJFXHU3RjZFXG5cdCAqL1xuXHRnZXRDdXJyZW50TGFuZ3VhZ2UoKTogTGFuZ3VhZ2Uge1xuXHRcdGlmICh0aGlzLnNldHRpbmdzLmxhbmd1YWdlID09PSAnc3lzdGVtJykge1xuXHRcdFx0cmV0dXJuIGdldFN5c3RlbUxhbmd1YWdlKCk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnNldHRpbmdzLmxhbmd1YWdlIGFzIExhbmd1YWdlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1N0ZGQlx1OEJEMVx1NTFGRFx1NjU3MFxuXHQgKi9cblx0dChrZXk6IHN0cmluZywgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPik6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRyYW5zbGF0ZSh0aGlzLmdldEN1cnJlbnRMYW5ndWFnZSgpLCBrZXkgYXMga2V5b2YgVHJhbnNsYXRpb25zLCBwYXJhbXMpO1xuXHR9XG5cblx0YXN5bmMgb25sb2FkKCkge1xuXHRcdGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cdFx0YXdhaXQgdGhpcy5taWdyYXRlTGVnYWN5VHJhc2hGb2xkZXIoKTtcblxuXHRcdC8vIFx1NTIxRFx1NTlDQlx1NTMxNlx1NjAyN1x1ODBGRFx1NTdGQVx1Nzg0MFx1OEJCRVx1NjVCRFxuXHRcdGF3YWl0IHRoaXMuaW5pdFBlcmZvcm1hbmNlSW5mcmEoKTtcblxuXHRcdC8vIFx1NTJBMFx1OEY3RFx1NjgzN1x1NUYwRlxuXHRcdHRoaXMucmVtb3ZlTWFuYWdlZFN0eWxlcygpO1xuXHRcdGF3YWl0IHRoaXMuYWRkU3R5bGUoKTtcblxuXHRcdC8vIFx1NkNFOFx1NTE4Q1x1NTZGRVx1NzI0N1x1NUU5M1x1ODlDNlx1NTZGRVxuXHRcdHRoaXMucmVnaXN0ZXJWaWV3KFZJRVdfVFlQRV9JTUFHRV9MSUJSQVJZLCAobGVhZikgPT4gbmV3IEltYWdlTGlicmFyeVZpZXcobGVhZiwgdGhpcykpO1xuXG5cdFx0Ly8gXHU2Q0U4XHU1MThDXHU2NzJBXHU1RjE1XHU3NTI4XHU1NkZFXHU3MjQ3XHU4OUM2XHU1NkZFXG5cdFx0dGhpcy5yZWdpc3RlclZpZXcoVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVMsIChsZWFmKSA9PiBuZXcgVW5yZWZlcmVuY2VkSW1hZ2VzVmlldyhsZWFmLCB0aGlzKSk7XG5cblx0XHQvLyBcdTZDRThcdTUxOENcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTdCQTFcdTc0MDZcdTg5QzZcdTU2RkVcblx0XHR0aGlzLnJlZ2lzdGVyVmlldyhWSUVXX1RZUEVfVFJBU0hfTUFOQUdFTUVOVCwgKGxlYWYpID0+IG5ldyBUcmFzaE1hbmFnZW1lbnRWaWV3KGxlYWYsIHRoaXMpKTtcblxuXHRcdC8vIFx1NkNFOFx1NTE4Q1x1OTFDRFx1NTkwRFx1NjhDMFx1NkQ0Qlx1ODlDNlx1NTZGRVxuXHRcdHRoaXMucmVnaXN0ZXJWaWV3KFZJRVdfVFlQRV9EVVBMSUNBVEVfREVURUNUSU9OLCAobGVhZikgPT4gbmV3IER1cGxpY2F0ZURldGVjdGlvblZpZXcobGVhZiwgdGhpcykpO1xuXG5cdFx0Ly8gXHU2Q0U4XHU1MThDXHU1NkZFXHU3MjQ3XHU1QkY5XHU5RjUwIFBvc3RQcm9jZXNzb3Jcblx0XHRjb25zdCBhbGlnbm1lbnRQcm9jZXNzb3IgPSBuZXcgQWxpZ25tZW50UG9zdFByb2Nlc3Nvcih0aGlzKTtcblx0XHRhbGlnbm1lbnRQcm9jZXNzb3IucmVnaXN0ZXIoKTtcblxuXHRcdC8vIFx1NkRGQlx1NTJBMFx1NTQ3RFx1NEVFNFx1OTc2Mlx1Njc3Rlx1NTQ3RFx1NEVFNFxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ29wZW4taW1hZ2UtbGlicmFyeScsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEltYWdlTGlicmFyeScpLFxuXHRcdFx0Y2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG5cdFx0XHRcdGlmIChjaGVja2luZykgcmV0dXJuIHRydWU7XG5cdFx0XHRcdHRoaXMub3BlbkltYWdlTGlicmFyeSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnZmluZC11bnJlZmVyZW5jZWQtaW1hZ2VzJyxcblx0XHRcdG5hbWU6IHRoaXMudCgnY21kRmluZFVucmVmZXJlbmNlZEltYWdlcycpLFxuXHRcdFx0Y2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG5cdFx0XHRcdGlmIChjaGVja2luZykgcmV0dXJuIHRydWU7XG5cdFx0XHRcdHRoaXMuZmluZFVucmVmZXJlbmNlZEltYWdlcygpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU3RjEzXHU1QjU4XHU1MjM3XHU2NUIwXHU1NDdEXHU0RUU0XG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAncmVmcmVzaC1jYWNoZScsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZFJlZnJlc2hDYWNoZScpLFxuXHRcdFx0Y2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG5cdFx0XHRcdGlmIChjaGVja2luZykgcmV0dXJuIHRydWU7XG5cdFx0XHRcdHRoaXMucmVmcmVzaENhY2hlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEJcdTU0N0RcdTRFRTRcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdvcGVuLWR1cGxpY2F0ZS1kZXRlY3Rpb24nLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWREdXBsaWNhdGVEZXRlY3Rpb24nKSxcblx0XHRcdGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuXHRcdFx0XHRpZiAoY2hlY2tpbmcpIHJldHVybiB0cnVlO1xuXHRcdFx0XHR0aGlzLm9wZW5EdXBsaWNhdGVEZXRlY3Rpb24oKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFx1OTY5NFx1NzlCQlx1N0JBMVx1NzQwNlx1NTQ3RFx1NEVFNFxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ29wZW4tdHJhc2gtbWFuYWdlbWVudCcsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZFRyYXNoTWFuYWdlbWVudCcpLFxuXHRcdFx0Y2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG5cdFx0XHRcdGlmIChjaGVja2luZykgcmV0dXJuIHRydWU7XG5cdFx0XHRcdHRoaXMub3BlblRyYXNoTWFuYWdlbWVudCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU1NkZFXHU3MjQ3XHU1QkY5XHU5RjUwXHU1NDdEXHU0RUU0XG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnYWxpZ24taW1hZ2UtbGVmdCcsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEFsaWduSW1hZ2VMZWZ0JyksXG5cdFx0XHRlZGl0b3JDYWxsYmFjazogKGVkaXRvcjogRWRpdG9yKSA9PiB7XG5cdFx0XHRcdHRoaXMuYWxpZ25TZWxlY3RlZEltYWdlKGVkaXRvciwgJ2xlZnQnKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ2FsaWduLWltYWdlLWNlbnRlcicsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEFsaWduSW1hZ2VDZW50ZXInKSxcblx0XHRcdGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yOiBFZGl0b3IpID0+IHtcblx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAnY2VudGVyJyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdhbGlnbi1pbWFnZS1yaWdodCcsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEFsaWduSW1hZ2VSaWdodCcpLFxuXHRcdFx0ZWRpdG9yQ2FsbGJhY2s6IChlZGl0b3I6IEVkaXRvcikgPT4ge1xuXHRcdFx0XHR0aGlzLmFsaWduU2VsZWN0ZWRJbWFnZShlZGl0b3IsICdyaWdodCcpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU2Q0U4XHU1MThDXHU3RjE2XHU4RjkxXHU1NjY4XHU0RTBBXHU0RTBCXHU2NTg3XHU4M0RDXHU1MzU1XG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KFxuXHRcdFx0Ly8gQHRzLWlnbm9yZSAtIGVkaXRvci1jb250ZXh0LW1lbnUgZXZlbnRcblx0XHRcdHRoaXMuYXBwLndvcmtzcGFjZS5vbignZWRpdG9yLWNvbnRleHQtbWVudScsIChtZW51OiBhbnksIGVkaXRvcjogYW55KSA9PiB7XG5cdFx0XHRcdHRoaXMuYWRkQWxpZ25tZW50TWVudUl0ZW1zKG1lbnUsIGVkaXRvcik7XG5cdFx0XHR9KVxuXHRcdCk7XG5cblx0XHQvLyBcdTZERkJcdTUyQTBcdThCQkVcdTdGNkVcdTY4MDdcdTdCN0VcdTk4NzVcblx0XHR0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNldHRpbmdzVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cblx0XHQvLyBcdTZDRThcdTUxOENcdTVGRUJcdTYzNzdcdTk1MkVcblx0XHR0aGlzLnJlZ2lzdGVyS2V5Ym9hcmRTaG9ydGN1dHMoKTtcblxuXHRcdC8vIFx1NzZEMVx1NTQyQyBWYXVsdCBcdTY1ODdcdTRFRjZcdTUzRDhcdTUzMTZcdUZGMENcdTgxRUFcdTUyQThcdTU5MzFcdTY1NDhcdTdGMTNcdTVCNThcdTVFNzZcdTUyMzdcdTY1QjBcdTg5QzZcdTU2RkVcblx0XHR0aGlzLnJlZ2lzdGVyVmF1bHRFdmVudExpc3RlbmVycygpO1xuXG5cdFx0Ly8gXHU1NDJGXHU1MkE4XHU2NUY2XHU2MjY3XHU4ODRDXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XG5cdFx0dGhpcy5hdXRvQ2xlYW51cFRyYXNoT25TdGFydHVwKCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU4RkMxXHU3OUZCXHU2NUU3XHU3MjQ4XHU5RUQ4XHU4QkE0XHU5Njk0XHU3OUJCXHU3NkVFXHU1RjU1XHVGRjA4XHU5NjkwXHU4NUNGXHU3NkVFXHU1RjU1XHVGRjA5XHU1MjMwXHU2NUIwXHU3MjQ4XHU5RUQ4XHU4QkE0XHU3NkVFXHU1RjU1XHVGRjBDXHU5MDdGXHU1MTREXHU4OEFCIFZhdWx0IFx1N0QyMlx1NUYxNVx1NUZGRFx1NzU2NVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBtaWdyYXRlTGVnYWN5VHJhc2hGb2xkZXIoKSB7XG5cdFx0Y29uc3QgbGVnYWN5UGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChJbWFnZU1hbmFnZXJQbHVnaW4uTEVHQUNZX1RSQVNIX0ZPTERFUik7XG5cdFx0Y29uc3QgZGVmYXVsdFRyYXNoUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChERUZBVUxUX1NFVFRJTkdTLnRyYXNoRm9sZGVyKSB8fCBERUZBVUxUX1NFVFRJTkdTLnRyYXNoRm9sZGVyO1xuXHRcdGNvbnN0IGNvbmZpZ3VyZWRUcmFzaFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgodGhpcy5zZXR0aW5ncy50cmFzaEZvbGRlcikgfHwgZGVmYXVsdFRyYXNoUGF0aDtcblx0XHRsZXQgc2V0dGluZ3NDaGFuZ2VkID0gZmFsc2U7XG5cblx0XHRpZiAoY29uZmlndXJlZFRyYXNoUGF0aCA9PT0gbGVnYWN5UGF0aCkge1xuXHRcdFx0dGhpcy5zZXR0aW5ncy50cmFzaEZvbGRlciA9IGRlZmF1bHRUcmFzaFBhdGg7XG5cdFx0XHRzZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBhZGFwdGVyID0gdGhpcy5hcHAudmF1bHQuYWRhcHRlcjtcblx0XHRcdGNvbnN0IGxlZ2FjeUV4aXN0cyA9IGF3YWl0IGFkYXB0ZXIuZXhpc3RzKGxlZ2FjeVBhdGgpO1xuXG5cdFx0XHRpZiAobGVnYWN5RXhpc3RzKSB7XG5cdFx0XHRcdGNvbnN0IHRhcmdldEV4aXN0cyA9IGF3YWl0IGFkYXB0ZXIuZXhpc3RzKGRlZmF1bHRUcmFzaFBhdGgpO1xuXHRcdFx0XHRpZiAoIXRhcmdldEV4aXN0cykge1xuXHRcdFx0XHRcdGF3YWl0IGFkYXB0ZXIucmVuYW1lKGxlZ2FjeVBhdGgsIGRlZmF1bHRUcmFzaFBhdGgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1OEZDMVx1NzlGQlx1NjVFN1x1NzI0OFx1OTY5NFx1NzlCQlx1NzZFRVx1NUY1NVx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0fVxuXG5cdFx0aWYgKHNldHRpbmdzQ2hhbmdlZCkge1xuXHRcdFx0YXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU1NDJGXHU1MkE4XHU2NUY2XHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGF1dG9DbGVhbnVwVHJhc2hPblN0YXJ0dXAoKSB7XG5cdFx0Ly8gXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU1NDJGXHU3NTI4XHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XG5cdFx0aWYgKCF0aGlzLnNldHRpbmdzLmF1dG9DbGVhbnVwVHJhc2gpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5jbGVhbnVwT2xkVHJhc2hGaWxlcygpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdTgxRUFcdTUyQThcdTZFMDVcdTc0MDZcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMDVcdTc0MDZcdThGQzdcdTY3MUZcdTc2ODRcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcblx0ICovXG5cdGFzeW5jIGNsZWFudXBPbGRUcmFzaEZpbGVzKCk6IFByb21pc2U8bnVtYmVyPiB7XG5cdFx0Y29uc3QgeyB2YXVsdCB9ID0gdGhpcy5hcHA7XG5cdFx0Y29uc3QgdHJhc2hQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMuc2V0dGluZ3MudHJhc2hGb2xkZXIpO1xuXG5cdFx0aWYgKCF0cmFzaFBhdGggfHwgIWlzUGF0aFNhZmUodHJhc2hQYXRoKSkge1xuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdHJhc2hGb2xkZXIgPSB2YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodHJhc2hQYXRoKTtcblxuXHRcdC8vIFx1NjhDMFx1NjdFNVx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NjYyRlx1NTQyNlx1NUI1OFx1NTcyOFxuXHRcdGlmICghdHJhc2hGb2xkZXIpIHtcblx0XHRcdHJldHVybiAwO1xuXHRcdH1cblxuXHRcdC8vIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NEUzQVx1NjU4N1x1NEVGNlx1NTkzOVxuXHRcdGlmICghKHRyYXNoRm9sZGVyIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcblx0XHRcdHJldHVybiAwO1xuXHRcdH1cblxuXHRcdGNvbnN0IGRheXMgPSBNYXRoLm1heCgxLCB0aGlzLnNldHRpbmdzLnRyYXNoQ2xlYW51cERheXMgfHwgMzApO1xuXHRcdGNvbnN0IGN1dG9mZlRpbWUgPSBEYXRlLm5vdygpIC0gKGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKTtcblx0XHRsZXQgZGVsZXRlZENvdW50ID0gMDtcblxuXHRcdC8vIFx1ODNCN1x1NTNENlx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NzY4NFx1NjI0MFx1NjcwOVx1NjU4N1x1NEVGNlxuXHRcdGNvbnN0IGZpbGVzID0gdHJhc2hGb2xkZXIuY2hpbGRyZW47XG5cblx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcblx0XHRcdGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcblx0XHRcdFx0Ly8gXHU2OEMwXHU2N0U1XHU2NTg3XHU0RUY2XHU0RkVFXHU2NTM5XHU2NUY2XHU5NUY0XG5cdFx0XHRcdGlmIChmaWxlLnN0YXQubXRpbWUgPCBjdXRvZmZUaW1lKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGF3YWl0IHZhdWx0LmRlbGV0ZShmaWxlKTtcblx0XHRcdFx0XHRcdGRlbGV0ZWRDb3VudCsrO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGBcdTUyMjBcdTk2NjRcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6ICR7ZmlsZS5uYW1lfWAsIGVycm9yKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZGVsZXRlZENvdW50ID4gMCkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ2F1dG9DbGVhbnVwQ29tcGxldGUnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKGRlbGV0ZWRDb3VudCkpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZGVsZXRlZENvdW50O1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkNFOFx1NTE4Q1x1NUZFQlx1NjM3N1x1OTUyRVxuXHQgKi9cblx0cmVnaXN0ZXJLZXlib2FyZFNob3J0Y3V0cygpIHtcblx0XHQvLyBDdHJsK1NoaWZ0K00gXHU2MjUzXHU1RjAwXHU1QTkyXHU0RjUzXHU1RTkzXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnb3Blbi1tZWRpYS1saWJyYXJ5LXNob3J0Y3V0Jyxcblx0XHRcdG5hbWU6IHRoaXMudCgnY21kT3Blbk1lZGlhTGlicmFyeScpLFxuXHRcdFx0aG90a2V5czogW3sgbW9kaWZpZXJzOiBbJ0N0cmwnLCAnU2hpZnQnXSwga2V5OiAnbScgfV0sXG5cdFx0XHRjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHR0aGlzLm9wZW5JbWFnZUxpYnJhcnkoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIEN0cmwrU2hpZnQrVSBcdTY3RTVcdTYyN0VcdTY3MkFcdTVGMTVcdTc1MjhcdTVBOTJcdTRGNTNcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdmaW5kLXVucmVmZXJlbmNlZC1tZWRpYS1zaG9ydGN1dCcsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEZpbmRVbnJlZmVyZW5jZWRNZWRpYScpLFxuXHRcdFx0aG90a2V5czogW3sgbW9kaWZpZXJzOiBbJ0N0cmwnLCAnU2hpZnQnXSwga2V5OiAndScgfV0sXG5cdFx0XHRjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmZpbmRVbnJlZmVyZW5jZWRJbWFnZXMoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIEN0cmwrU2hpZnQrVCBcdTYyNTNcdTVGMDBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTdCQTFcdTc0MDZcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdvcGVuLXRyYXNoLW1hbmFnZW1lbnQtc2hvcnRjdXQnLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWRPcGVuVHJhc2hNYW5hZ2VtZW50JyksXG5cdFx0XHRob3RrZXlzOiBbeyBtb2RpZmllcnM6IFsnQ3RybCcsICdTaGlmdCddLCBrZXk6ICd0JyB9XSxcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB7XG5cdFx0XHRcdHRoaXMub3BlblRyYXNoTWFuYWdlbWVudCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkNFOFx1NTE4QyBWYXVsdCBcdTRFOEJcdTRFRjZcdTc2RDFcdTU0MkNcblx0ICovXG5cdHByaXZhdGUgcmVnaXN0ZXJWYXVsdEV2ZW50TGlzdGVuZXJzKCkge1xuXHRcdC8vIFx1NTlENFx1NjI1OFx1N0VEOSBNZWRpYUZpbGVJbmRleCBcdTU5MDRcdTc0MDZcdTU4OUVcdTkxQ0ZcdTdEMjJcdTVGMTVcdTY2RjRcdTY1QjBcblx0XHR0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oJ2NyZWF0ZScsIChmaWxlOiBUQWJzdHJhY3RGaWxlKSA9PiB7XG5cdFx0XHR0aGlzLmZpbGVJbmRleC5vbkZpbGVDcmVhdGVkKGZpbGUpO1xuXHRcdFx0dGhpcy5oYW5kbGVWYXVsdEZpbGVDaGFuZ2UoZmlsZSk7XG5cdFx0fSkpO1xuXHRcdHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC52YXVsdC5vbignZGVsZXRlJywgKGZpbGU6IFRBYnN0cmFjdEZpbGUpID0+IHtcblx0XHRcdHRoaXMuZmlsZUluZGV4Lm9uRmlsZURlbGV0ZWQoZmlsZSk7XG5cdFx0XHR0aGlzLmhhbmRsZVZhdWx0RmlsZUNoYW5nZShmaWxlKTtcblx0XHR9KSk7XG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKCdtb2RpZnknLCAoZmlsZTogVEFic3RyYWN0RmlsZSkgPT4ge1xuXHRcdFx0dGhpcy5maWxlSW5kZXgub25GaWxlTW9kaWZpZWQoZmlsZSk7XG5cdFx0XHR0aGlzLmhhbmRsZVZhdWx0RmlsZUNoYW5nZShmaWxlKTtcblx0XHR9KSk7XG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKCdyZW5hbWUnLCAoZmlsZTogVEFic3RyYWN0RmlsZSwgb2xkUGF0aDogc3RyaW5nKSA9PiB7XG5cdFx0XHR0aGlzLmZpbGVJbmRleC5vbkZpbGVSZW5hbWVkKGZpbGUsIG9sZFBhdGgpO1xuXHRcdFx0dGhpcy5oYW5kbGVWYXVsdEZpbGVDaGFuZ2UoZmlsZSwgb2xkUGF0aCk7XG5cdFx0fSkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTIxRFx1NTlDQlx1NTMxNlx1NjAyN1x1ODBGRFx1NTdGQVx1Nzg0MFx1OEJCRVx1NjVCRFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBpbml0UGVyZm9ybWFuY2VJbmZyYSgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBcdTYyNTNcdTVGMDBcdTdGMjlcdTc1NjVcdTU2RkVcdTdGMTNcdTVCNThcblx0XHRhd2FpdCB0aGlzLnRodW1ibmFpbENhY2hlLm9wZW4oKTtcblxuXHRcdC8vIFx1NTIxRFx1NTlDQlx1NTMxNlx1NjU4N1x1NEVGNlx1N0QyMlx1NUYxNVxuXHRcdHRoaXMuZmlsZUluZGV4ID0gbmV3IE1lZGlhRmlsZUluZGV4KHRoaXMuYXBwLnZhdWx0LCB0aGlzLnRodW1ibmFpbENhY2hlKTtcblx0XHRhd2FpdCB0aGlzLnN5bmNQZXJmb3JtYW5jZUluZnJhU2V0dGluZ3ModHJ1ZSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1NDBDXHU2QjY1XHU2MDI3XHU4MEZEXHU1N0ZBXHU3ODQwXHU4QkJFXHU2NUJEXHU5MTREXHU3RjZFXG5cdCAqIFx1NUY1M1x1NUE5Mlx1NEY1M1x1N0M3Qlx1NTc4Qlx1NjIxNlx1OTY5NFx1NzlCQlx1NzZFRVx1NUY1NVx1NTNEMVx1NzUxRlx1NTNEOFx1NTMxNlx1NjVGNlx1RkYwQ1x1OTcwMFx1ODk4MVx1OTFDRFx1NUVGQVx1NjU4N1x1NEVGNlx1N0QyMlx1NUYxNVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBzeW5jUGVyZm9ybWFuY2VJbmZyYVNldHRpbmdzKGZvcmNlRnVsbFNjYW46IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGVuYWJsZWRFeHRlbnNpb25zID0gZ2V0RW5hYmxlZEV4dGVuc2lvbnModGhpcy5zZXR0aW5ncyk7XG5cdFx0Y29uc3QgdHJhc2hGb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodGhpcy5zZXR0aW5ncy50cmFzaEZvbGRlcikgfHwgREVGQVVMVF9TRVRUSU5HUy50cmFzaEZvbGRlcjtcblx0XHRjb25zdCBleHRlbnNpb25zS2V5ID0gWy4uLmVuYWJsZWRFeHRlbnNpb25zXS5zb3J0KCkuam9pbignfCcpO1xuXHRcdGNvbnN0IG5lZWRzUmVzY2FuID0gZm9yY2VGdWxsU2NhblxuXHRcdFx0fHwgIXRoaXMuZmlsZUluZGV4LmlzSW5pdGlhbGl6ZWRcblx0XHRcdHx8IHRoaXMuaW5kZXhlZEV4dGVuc2lvbnNLZXkgIT09IGV4dGVuc2lvbnNLZXlcblx0XHRcdHx8IHRoaXMuaW5kZXhlZFRyYXNoRm9sZGVyICE9PSB0cmFzaEZvbGRlcjtcblxuXHRcdHRoaXMuZmlsZUluZGV4LnNldEVuYWJsZWRFeHRlbnNpb25zKGVuYWJsZWRFeHRlbnNpb25zKTtcblx0XHR0aGlzLmZpbGVJbmRleC5zZXRUcmFzaEZvbGRlcih0cmFzaEZvbGRlcik7XG5cdFx0dGhpcy5pbmRleGVkRXh0ZW5zaW9uc0tleSA9IGV4dGVuc2lvbnNLZXk7XG5cdFx0dGhpcy5pbmRleGVkVHJhc2hGb2xkZXIgPSB0cmFzaEZvbGRlcjtcblxuXHRcdGlmIChuZWVkc1Jlc2Nhbikge1xuXHRcdFx0YXdhaXQgdGhpcy5maWxlSW5kZXguZnVsbFNjYW4oKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU1OTA0XHU3NDA2IFZhdWx0IFx1NjU4N1x1NEVGNlx1NTNEOFx1NTMxNlxuXHQgKi9cblx0cHJpdmF0ZSBoYW5kbGVWYXVsdEZpbGVDaGFuZ2UoZmlsZTogVEFic3RyYWN0RmlsZSwgb2xkUGF0aD86IHN0cmluZykge1xuXHRcdGlmIChmaWxlIGluc3RhbmNlb2YgVEZvbGRlcikge1xuXHRcdFx0dGhpcy5jbGVhckNhY2hlKCk7XG5cdFx0XHRpZiAodGhpcy5zZXR0aW5ncy5hdXRvUmVmcmVzaCkge1xuXHRcdFx0XHR0aGlzLnNjaGVkdWxlUmVmcmVzaE9wZW5WaWV3cygpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBub3JtYWxpemVkT2xkUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChvbGRQYXRoIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGNvbnN0IG9sZFdhc01hcmtkb3duID0gbm9ybWFsaXplZE9sZFBhdGguZW5kc1dpdGgoJy5tZCcpO1xuXHRcdGNvbnN0IG9sZFdhc01lZGlhID0gbm9ybWFsaXplZE9sZFBhdGggPyBpc01lZGlhRmlsZShub3JtYWxpemVkT2xkUGF0aCkgOiBmYWxzZTtcblx0XHRjb25zdCBpc01hcmtkb3duID0gZmlsZS5leHRlbnNpb24gPT09ICdtZCc7XG5cdFx0Y29uc3QgaXNNZWRpYSA9IGlzTWVkaWFGaWxlKGZpbGUubmFtZSk7XG5cblx0XHQvLyBNYXJrZG93biBcdTUzRDhcdTY2RjRcdTRGMUFcdTVGNzFcdTU0Q0RcdTVGMTVcdTc1MjhcdTUxNzNcdTdDRkJcdUZGMENcdTk3MDBcdTZFMDVcdTk2NjRcdTdGMTNcdTVCNThcblx0XHRpZiAoaXNNYXJrZG93biB8fCBvbGRXYXNNYXJrZG93bikge1xuXHRcdFx0dGhpcy5jbGVhckNhY2hlKCk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU0RUM1XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHU1M0Q4XHU2NkY0XHVGRjA4XHU1MzA1XHU1NDJCXHU5MUNEXHU1NDdEXHU1NDBEXHU1MjREXHU2NjJGXHU1QTkyXHU0RjUzXHVGRjA5XHU2MjREXHU4OUU2XHU1M0QxXHU4OUM2XHU1NkZFXHU1MjM3XHU2NUIwXG5cdFx0aWYgKCFpc01lZGlhICYmICFvbGRXYXNNZWRpYSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICghKGlzTWFya2Rvd24gfHwgb2xkV2FzTWFya2Rvd24pKSB7XG5cdFx0XHR0aGlzLmNsZWFyQ2FjaGUoKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5zZXR0aW5ncy5hdXRvUmVmcmVzaCkge1xuXHRcdFx0dGhpcy5zY2hlZHVsZVJlZnJlc2hPcGVuVmlld3MoKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU5NjMyXHU2Mjk2XHU1MjM3XHU2NUIwXHU1REYyXHU2MjUzXHU1RjAwXHU4OUM2XHU1NkZFXG5cdCAqL1xuXHRwcml2YXRlIHNjaGVkdWxlUmVmcmVzaE9wZW5WaWV3cyhkZWxheU1zOiBudW1iZXIgPSAzMDApIHtcblx0XHRpZiAodGhpcy5yZWZyZXNoVmlld3NUaW1lcikge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMucmVmcmVzaFZpZXdzVGltZXIpO1xuXHRcdH1cblxuXHRcdHRoaXMucmVmcmVzaFZpZXdzVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdHRoaXMucmVmcmVzaFZpZXdzVGltZXIgPSBudWxsO1xuXHRcdFx0dm9pZCB0aGlzLnJlZnJlc2hPcGVuVmlld3MoKTtcblx0XHR9LCBkZWxheU1zKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTUyMzdcdTY1QjBcdTYyNDBcdTY3MDlcdTVERjJcdTYyNTNcdTVGMDBcdTc2ODRcdTYzRDJcdTRFRjZcdTg5QzZcdTU2RkVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcmVmcmVzaE9wZW5WaWV3cygpIHtcblx0XHRjb25zdCB0YXNrczogUHJvbWlzZTx1bmtub3duPltdID0gW107XG5cblx0XHRmb3IgKGNvbnN0IGxlYWYgb2YgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfSU1BR0VfTElCUkFSWSkpIHtcblx0XHRcdGNvbnN0IHZpZXcgPSBsZWFmLnZpZXc7XG5cdFx0XHRpZiAodmlldyBpbnN0YW5jZW9mIEltYWdlTGlicmFyeVZpZXcpIHtcblx0XHRcdFx0dGFza3MucHVzaCh2aWV3LnJlZnJlc2hJbWFnZXMoKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCBsZWFmIG9mIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVMpKSB7XG5cdFx0XHRjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuXHRcdFx0aWYgKHZpZXcgaW5zdGFuY2VvZiBVbnJlZmVyZW5jZWRJbWFnZXNWaWV3KSB7XG5cdFx0XHRcdHRhc2tzLnB1c2godmlldy5zY2FuVW5yZWZlcmVuY2VkSW1hZ2VzKCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgbGVhZiBvZiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9UUkFTSF9NQU5BR0VNRU5UKSkge1xuXHRcdFx0Y29uc3QgdmlldyA9IGxlYWYudmlldztcblx0XHRcdGlmICh2aWV3IGluc3RhbmNlb2YgVHJhc2hNYW5hZ2VtZW50Vmlldykge1xuXHRcdFx0XHR0YXNrcy5wdXNoKHZpZXcubG9hZFRyYXNoSXRlbXMoKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHRhc2tzLmxlbmd0aCA+IDApIHtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZCh0YXNrcyk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjI1M1x1NUYwMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1N0JBMVx1NzQwNlx1ODlDNlx1NTZGRVxuXHQgKi9cblx0YXN5bmMgb3BlblRyYXNoTWFuYWdlbWVudCgpIHtcblx0XHRjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG5cblx0XHRsZXQgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX1RSQVNIX01BTkFHRU1FTlQpWzBdO1xuXHRcdGlmICghbGVhZikge1xuXHRcdFx0bGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKCd0YWInKTtcblx0XHRcdGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcblx0XHRcdFx0dHlwZTogVklFV19UWVBFX1RSQVNIX01BTkFHRU1FTlQsXG5cdFx0XHRcdGFjdGl2ZTogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjI1M1x1NUYwMFx1NUE5Mlx1NEY1M1x1OTg4NFx1ODlDOFxuXHQgKi9cblx0b3Blbk1lZGlhUHJldmlldyhmaWxlOiBURmlsZSkge1xuXHRcdGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVQcmV2aWV3TW9kYWwpIHtcblx0XHRcdGNvbnN0IHNyYyA9IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcblx0XHRcdHdpbmRvdy5vcGVuKHNyYywgJ19ibGFuaycsICdub29wZW5lcixub3JlZmVycmVyJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdG5ldyBNZWRpYVByZXZpZXdNb2RhbCh0aGlzLmFwcCwgdGhpcywgZmlsZSkub3BlbigpO1xuXHR9XG5cblx0b251bmxvYWQoKSB7XG5cdFx0aWYgKHRoaXMucmVmcmVzaFZpZXdzVGltZXIpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLnJlZnJlc2hWaWV3c1RpbWVyKTtcblx0XHRcdHRoaXMucmVmcmVzaFZpZXdzVGltZXIgPSBudWxsO1xuXHRcdH1cblx0XHQvLyBcdTUxNzNcdTk1RURcdTdGMjlcdTc1NjVcdTU2RkVcdTdGMTNcdTVCNThcblx0XHR0aGlzLnRodW1ibmFpbENhY2hlLmNsb3NlKCk7XG5cdFx0dGhpcy5maWxlSW5kZXguY2xlYXIoKTtcblxuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0lNQUdFX0xJQlJBUlkpO1xuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVMpO1xuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFX1RSQVNIX01BTkFHRU1FTlQpO1xuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0RVUExJQ0FURV9ERVRFQ1RJT04pO1xuXHRcdHRoaXMucmVtb3ZlTWFuYWdlZFN0eWxlcygpO1xuXHR9XG5cblx0cHJpdmF0ZSByZW1vdmVNYW5hZ2VkU3R5bGVzKCkge1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvYnNpZGlhbi1tZWRpYS10b29sa2l0LXN0eWxlcycpPy5yZW1vdmUoKTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1hZ2UtbWFuYWdlci1zdHlsZXMnKT8ucmVtb3ZlKCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2MjUzXHU1RjAwXHU5MUNEXHU1OTBEXHU2OEMwXHU2RDRCXHU4OUM2XHU1NkZFXG5cdCAqL1xuXHRhc3luYyBvcGVuRHVwbGljYXRlRGV0ZWN0aW9uKCkge1xuXHRcdGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcblx0XHRsZXQgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0RVUExJQ0FURV9ERVRFQ1RJT04pWzBdO1xuXHRcdGlmICghbGVhZikge1xuXHRcdFx0bGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKCd0YWInKTtcblx0XHRcdGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcblx0XHRcdFx0dHlwZTogVklFV19UWVBFX0RVUExJQ0FURV9ERVRFQ1RJT04sXG5cdFx0XHRcdGFjdGl2ZTogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuXHR9XG5cblx0Ly8gXHU1MkEwXHU4RjdEXHU2ODM3XHU1RjBGXHU2NTg3XHU0RUY2XG5cdC8vIFx1NkNFOFx1NjEwRlx1RkYxQVx1NEYxOFx1NTE0OFx1NEY3Rlx1NzUyOCBzdHlsZXMuY3NzIFx1NEUyRFx1NzY4NFx1NjgzN1x1NUYwRlx1RkYwQ2FkZFN0eWxlIFx1NEY1Q1x1NEUzQVx1NTQwRVx1NTkwN1x1NjVCOVx1Njg0OFxuXHRhc3luYyBhZGRTdHlsZSgpIHtcblx0XHRjb25zdCBsb2FkZWQgPSBhd2FpdCB0aGlzLmxvYWRFeHRlcm5hbFN0eWxlcygpO1xuXHRcdGlmICghbG9hZGVkKSB7XG5cdFx0XHR0aGlzLmFkZElubGluZVN0eWxlKCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gXHU0RUNFXHU1OTE2XHU5MEU4XHU2ODM3XHU1RjBGXHU2NTg3XHU0RUY2XHU1MkEwXHU4RjdEXG5cdGFzeW5jIGxvYWRFeHRlcm5hbFN0eWxlcygpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHQvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTVERjJcdTVCNThcdTU3MjhcdTY4MzdcdTVGMEZcdTUxNDNcdTdEMjBcdUZGMENcdTkwN0ZcdTUxNERcdTkxQ0RcdTU5MERcdTZERkJcdTUyQTBcblx0XHRpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29ic2lkaWFuLW1lZGlhLXRvb2xraXQtc3R5bGVzJykpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN0eWxlUGF0aHMgPSBbXG5cdFx0XHR0aGlzLm1hbmlmZXN0LmRpciA/IGAke25vcm1hbGl6ZVZhdWx0UGF0aCh0aGlzLm1hbmlmZXN0LmRpcil9L3N0eWxlcy5jc3NgIDogJycsXG5cdFx0XHRgLm9ic2lkaWFuL3BsdWdpbnMvJHt0aGlzLm1hbmlmZXN0LmlkfS9zdHlsZXMuY3NzYCxcblx0XHRcdCdzdHlsZXMuY3NzJ1xuXHRcdF0uZmlsdGVyKChwYXRoLCBpbmRleCwgYXJyKSA9PiBwYXRoICYmIGFyci5pbmRleE9mKHBhdGgpID09PSBpbmRleCk7XG5cblx0XHR0cnkge1xuXHRcdFx0Zm9yIChjb25zdCBzdHlsZVBhdGggb2Ygc3R5bGVQYXRocykge1xuXHRcdFx0XHRpZiAoIWF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIuZXhpc3RzKHN0eWxlUGF0aCkpIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLnJlYWQoc3R5bGVQYXRoKTtcblx0XHRcdFx0Y29uc3Qgc2FuaXRpemVkQ3NzID0gY29udGVudFxuXHRcdFx0XHRcdC8vIFx1OTYzQlx1NkI2MiBleHByZXNzaW9uKCkgXHU3QjQ5IEphdmFTY3JpcHQgXHU2MjY3XHU4ODRDXG5cdFx0XHRcdFx0LnJlcGxhY2UoL2V4cHJlc3Npb25cXHMqXFwoL2dpLCAnLyogYmxvY2tlZCAqLygnKVxuXHRcdFx0XHRcdC5yZXBsYWNlKC9qYXZhc2NyaXB0XFxzKjovZ2ksICcvKiBibG9ja2VkICovOicpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL3Zic2NyaXB0XFxzKjovZ2ksICcvKiBibG9ja2VkICovOicpXG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyIHVybCgpIFx1NUYxNVx1NzUyOFx1NTkxNlx1OTBFOFx1OEQ0NFx1NkU5MFxuXHRcdFx0XHRcdC5yZXBsYWNlKC91cmxcXHMqXFwoW14pXSpcXCkvZ2ksICcvKiB1cmwoKSBibG9ja2VkICovJylcblx0XHRcdFx0XHQvLyBcdTk2M0JcdTZCNjIgQGltcG9ydCBcdTVGMTVcdTUxNjVcdTU5MTZcdTkwRThcdTY4MzdcdTVGMEZcblx0XHRcdFx0XHQucmVwbGFjZSgvQGltcG9ydFxccypbXjtdKzsvZ2ksICcvKiBAaW1wb3J0IGJsb2NrZWQgKi8nKVxuXHRcdFx0XHRcdC8vIFx1OTYzQlx1NkI2Mlx1NEU4Qlx1NEVGNlx1NTkwNFx1NzQwNlx1NTY2OFx1NUM1RVx1NjAyNyAob25jbGljaywgb25lcnJvciwgb25sb2FkLCBvbm1vdXNlb3ZlciBcdTdCNDkpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL1xcYm9uKGNsaWNrfGVycm9yfGxvYWR8bW91c2VvdmVyfG1vdXNlb3V0fGZvY3VzfGJsdXJ8Y2hhbmdlfHN1Ym1pdHxrZXlkb3dufGtleXVwKVxccyo9L2dpLCAnZGF0YS1ibG9ja2VkLW9uJDE9Jylcblx0XHRcdFx0XHQvLyBcdTk2M0JcdTZCNjIgZmlsdGVyOnVybCgpIFx1NUYxNVx1NzUyOFx1NTkxNlx1OTBFOFx1OEQ0NFx1NkU5MFxuXHRcdFx0XHRcdC5yZXBsYWNlKC9maWx0ZXJcXHMqOlxccyp1cmxcXHMqXFwoW14pXSpcXCkvZ2ksICcvKiBmaWx0ZXI6dXJsKCkgYmxvY2tlZCAqLycpXG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyIGJlaGF2aW9yIChJRSBcdTg4NENcdTRFM0FcdTVDNUVcdTYwMjcpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL2JlaGF2aW9yXFxzKjovZ2ksICcvKiBiZWhhdmlvciBibG9ja2VkICovOicpXG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyIC1tcy1iZWhhdmlvciAoSUUgXHU0RTEzXHU2NzA5KVxuXHRcdFx0XHRcdC5yZXBsYWNlKC8tbXMtYmVoYXZpb3JcXHMqOi9naSwgJy8qIC1tcy1iZWhhdmlvciBibG9ja2VkICovOicpXG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyIGJpbmRpbmcgKFhVTCBcdTdFRDFcdTVCOUEpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL2JpbmRpbmdcXHMqOlxccyp1cmxcXHMqXFwoW14pXSpcXCkvZ2ksICcvKiBiaW5kaW5nIGJsb2NrZWQgKi8nKVxuXHRcdFx0XHRcdC8vIFx1OTYzQlx1NkI2MiBhbmltYXRpb24vdHJhbnNpdGlvbiBcdTRFMkRcdTc2ODQgdXJsKClcblx0XHRcdFx0XHQucmVwbGFjZSgvKGFuaW1hdGlvbnx0cmFuc2l0aW9uKVxccyo6W147XSp1cmxcXHMqXFwoW14pXSpcXCkvZ2ksICcvKiAkMSB1cmwoKSBibG9ja2VkICovJyk7XG5cdFx0XHRcdGNvbnN0IHN0eWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuXHRcdFx0XHRzdHlsZUVsLmlkID0gJ29ic2lkaWFuLW1lZGlhLXRvb2xraXQtc3R5bGVzJztcblx0XHRcdFx0c3R5bGVFbC50ZXh0Q29udGVudCA9IHNhbml0aXplZENzcztcblx0XHRcdFx0ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZUVsKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdcdTUyQTBcdThGN0RcdTU5MTZcdTkwRThcdTY4MzdcdTVGMEZcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjVcdUZGMENcdTRGN0ZcdTc1MjhcdTUxODVcdTgwNTRcdTY4MzdcdTVGMEYnLCBlcnJvcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gXHU1MTg1XHU4MDU0XHU2ODM3XHU1RjBGXHVGRjA4XHU1NDBFXHU1OTA3XHU2NUI5XHU2ODQ4XHVGRjA5XG5cdGFkZElubGluZVN0eWxlKCkge1xuXHRcdC8vIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NURGMlx1NUI1OFx1NTcyOFx1NjgzN1x1NUYwRlx1NTE0M1x1N0QyMFx1RkYwQ1x1OTA3Rlx1NTE0RFx1OTFDRFx1NTkwRFx1NkRGQlx1NTJBMFxuXHRcdGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1hZ2UtbWFuYWdlci1zdHlsZXMnKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN0eWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuXHRcdHN0eWxlRWwuaWQgPSAnaW1hZ2UtbWFuYWdlci1zdHlsZXMnO1xuXHRcdHN0eWxlRWwudGV4dENvbnRlbnQgPSBgLyogT2JzaWRpYW4gSW1hZ2UgTWFuYWdlciBQbHVnaW4gU3R5bGVzICovXG5cbi8qID09PT09IFx1NTE2OFx1NUM0MFx1NjgzN1x1NUYwRiA9PT09PSAqL1xuLmltYWdlLWxpYnJhcnktdmlldyxcbi51bnJlZmVyZW5jZWQtaW1hZ2VzLXZpZXcge1xuXHRoZWlnaHQ6IDEwMCU7XG5cdG92ZXJmbG93LXk6IGF1dG87XG5cdHBhZGRpbmc6IDE2cHg7XG5cdGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG59XG5cbi8qID09PT09IFx1NTkzNFx1OTBFOFx1NjgzN1x1NUYwRiA9PT09PSAqL1xuLmltYWdlLWxpYnJhcnktaGVhZGVyLFxuLnVucmVmZXJlbmNlZC1oZWFkZXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG5cdG1hcmdpbi1ib3R0b206IDIwcHg7XG5cdHBhZGRpbmctYm90dG9tOiAxNnB4O1xuXHRib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4uaW1hZ2UtbGlicmFyeS1oZWFkZXIgaDIsXG4udW5yZWZlcmVuY2VkLWhlYWRlciBoMiB7XG5cdG1hcmdpbjogMDtcblx0Zm9udC1zaXplOiAxLjVlbTtcblx0Zm9udC13ZWlnaHQ6IDYwMDtcbn1cblxuLmltYWdlLXN0YXRzLFxuLmhlYWRlci1kZXNjcmlwdGlvbiB7XG5cdG1hcmdpbi10b3A6IDRweDtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRmb250LXNpemU6IDAuOWVtO1xufVxuXG4uaGVhZGVyLWRlc2NyaXB0aW9uIHtcblx0ZGlzcGxheTogZmxleDtcblx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblx0Z2FwOiA0cHg7XG59XG5cbi8qID09PT09IFx1NjMwOVx1OTRBRVx1NjgzN1x1NUYwRiA9PT09PSAqL1xuLnJlZnJlc2gtYnV0dG9uLFxuLmFjdGlvbi1idXR0b24sXG4uaXRlbS1idXR0b24ge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0cGFkZGluZzogOHB4O1xuXHRib3JkZXI6IG5vbmU7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Y29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRjdXJzb3I6IHBvaW50ZXI7XG5cdHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4ycywgY29sb3IgMC4ycztcbn1cblxuLnJlZnJlc2gtYnV0dG9uOmhvdmVyLFxuLmFjdGlvbi1idXR0b246aG92ZXIsXG4uaXRlbS1idXR0b246aG92ZXIge1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcbn1cblxuLnJlZnJlc2gtYnV0dG9uIHN2Zyxcbi5hY3Rpb24tYnV0dG9uIHN2Zyxcbi5pdGVtLWJ1dHRvbiBzdmcge1xuXHR3aWR0aDogMTZweDtcblx0aGVpZ2h0OiAxNnB4O1xufVxuXG4uYWN0aW9uLWJ1dHRvbi5kYW5nZXIsXG4uaXRlbS1idXR0b24uZGFuZ2VyIHtcblx0Y29sb3I6IHZhcigtLXRleHQtZXJyb3IpO1xufVxuXG4uYWN0aW9uLWJ1dHRvbi5kYW5nZXI6aG92ZXIsXG4uaXRlbS1idXR0b24uZGFuZ2VyOmhvdmVyIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1lcnJvcik7XG5cdGNvbG9yOiB3aGl0ZTtcbn1cblxuLmhlYWRlci1hY3Rpb25zIHtcblx0ZGlzcGxheTogZmxleDtcblx0Z2FwOiA4cHg7XG59XG5cbi8qID09PT09IFx1NjM5Mlx1NUU4Rlx1OTAwOVx1NjJFOVx1NTY2OCA9PT09PSAqL1xuLnNvcnQtc2VsZWN0IHtcblx0cGFkZGluZzogNnB4IDEycHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG5cdGZvbnQtc2l6ZTogMC45ZW07XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLm9yZGVyLWJ1dHRvbiB7XG5cdHBhZGRpbmc6IDZweCA4cHg7XG5cdG1hcmdpbi1sZWZ0OiA4cHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLm9yZGVyLWJ1dHRvbiBzdmcge1xuXHR3aWR0aDogMTZweDtcblx0aGVpZ2h0OiAxNnB4O1xufVxuXG4vKiA9PT09PSBcdTU2RkVcdTcyNDdcdTdGNTFcdTY4M0MgPT09PT0gKi9cbi5pbWFnZS1ncmlkIHtcblx0ZGlzcGxheTogZ3JpZDtcblx0Z2FwOiAxNnB4O1xuXHRncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpbGwsIG1pbm1heCgxNTBweCwgMWZyKSk7XG59XG5cbi5pbWFnZS1ncmlkLXNtYWxsIHtcblx0Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoYXV0by1maWxsLCBtaW5tYXgoMTAwcHgsIDFmcikpO1xufVxuXG4uaW1hZ2UtZ3JpZC1tZWRpdW0ge1xuXHRncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpbGwsIG1pbm1heCgxNTBweCwgMWZyKSk7XG59XG5cbi5pbWFnZS1ncmlkLWxhcmdlIHtcblx0Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoYXV0by1maWxsLCBtaW5tYXgoMjAwcHgsIDFmcikpO1xufVxuXG4vKiA9PT09PSBcdTU2RkVcdTcyNDdcdTk4NzkgPT09PT0gKi9cbi5pbWFnZS1pdGVtIHtcblx0ZGlzcGxheTogZmxleDtcblx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA4cHg7XG5cdG92ZXJmbG93OiBoaWRkZW47XG5cdHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjJzLCBib3gtc2hhZG93IDAuMnM7XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLmltYWdlLWl0ZW06aG92ZXIge1xuXHR0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTJweCk7XG5cdGJveC1zaGFkb3c6IDAgNHB4IDEycHggcmdiYSgwLCAwLCAwLCAwLjE1KTtcbn1cblxuLmltYWdlLWNvbnRhaW5lciB7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcblx0d2lkdGg6IDEwMCU7XG5cdHBhZGRpbmctdG9wOiAxMDAlO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcbn1cblxuLmltYWdlLWNvbnRhaW5lciBpbWcge1xuXHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdHRvcDogMDtcblx0bGVmdDogMDtcblx0d2lkdGg6IDEwMCU7XG5cdGhlaWdodDogMTAwJTtcblx0b2JqZWN0LWZpdDogY292ZXI7XG59XG5cbi5pbWFnZS1pbmZvIHtcblx0cGFkZGluZzogOHB4O1xuXHRib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4uaW1hZ2UtbmFtZSB7XG5cdGZvbnQtc2l6ZTogMC44NWVtO1xuXHRmb250LXdlaWdodDogNTAwO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHR0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcblx0d2hpdGUtc3BhY2U6IG5vd3JhcDtcbn1cblxuLmltYWdlLXNpemUge1xuXHRmb250LXNpemU6IDAuNzVlbTtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRtYXJnaW4tdG9wOiAycHg7XG59XG5cbi8qID09PT09IFx1NjcyQVx1NUYxNVx1NzUyOFx1NTZGRVx1NzI0N1x1NTIxN1x1ODg2OCA9PT09PSAqL1xuLnN0YXRzLWJhciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogMTZweDtcblx0cGFkZGluZzogMTJweCAxNnB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0bWFyZ2luLWJvdHRvbTogMTZweDtcbn1cblxuLnN0YXRzLWNvdW50IHtcblx0Zm9udC13ZWlnaHQ6IDYwMDtcblx0Y29sb3I6IHZhcigtLXRleHQtd2FybmluZyk7XG59XG5cbi5zdGF0cy1zaXplIHtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4udW5yZWZlcmVuY2VkLWxpc3Qge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRnYXA6IDEycHg7XG59XG5cbi51bnJlZmVyZW5jZWQtaXRlbSB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogMTZweDtcblx0cGFkZGluZzogMTJweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA4cHg7XG5cdHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4ycztcbn1cblxuLnVucmVmZXJlbmNlZC1pdGVtOmhvdmVyIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC10ZXJ0aWFyeSk7XG59XG5cbi5pdGVtLXRodW1ibmFpbCB7XG5cdHdpZHRoOiA2MHB4O1xuXHRoZWlnaHQ6IDYwcHg7XG5cdGZsZXgtc2hyaW5rOiAwO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdG92ZXJmbG93OiBoaWRkZW47XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4uaXRlbS10aHVtYm5haWwgaW1nIHtcblx0d2lkdGg6IDEwMCU7XG5cdGhlaWdodDogMTAwJTtcblx0b2JqZWN0LWZpdDogY292ZXI7XG59XG5cbi5pdGVtLWluZm8ge1xuXHRmbGV4OiAxO1xuXHRtaW4td2lkdGg6IDA7XG59XG5cbi5pdGVtLW5hbWUge1xuXHRmb250LXdlaWdodDogNTAwO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHR0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcblx0d2hpdGUtc3BhY2U6IG5vd3JhcDtcbn1cblxuLml0ZW0tcGF0aCB7XG5cdGZvbnQtc2l6ZTogMC44ZW07XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0b3ZlcmZsb3c6IGhpZGRlbjtcblx0dGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG5cdHdoaXRlLXNwYWNlOiBub3dyYXA7XG5cdG1hcmdpbi10b3A6IDJweDtcbn1cblxuLml0ZW0tc2l6ZSB7XG5cdGZvbnQtc2l6ZTogMC44NWVtO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdG1hcmdpbi10b3A6IDRweDtcbn1cblxuLml0ZW0tYWN0aW9ucyB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGdhcDogOHB4O1xuXHRmbGV4LXNocmluazogMDtcbn1cblxuLyogPT09PT0gXHU3QTdBXHU3MkI2XHU2MDAxID09PT09ICovXG4uZW1wdHktc3RhdGUsXG4ubG9hZGluZy1zdGF0ZSxcbi5zdWNjZXNzLXN0YXRlLFxuLmVycm9yLXN0YXRlIHtcblx0ZGlzcGxheTogZmxleDtcblx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0anVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG5cdHBhZGRpbmc6IDQ4cHg7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4uZW1wdHktc3RhdGU6OmJlZm9yZSB7XG5cdGNvbnRlbnQ6ICdcdUQ4M0RcdUREQkNcdUZFMEYnO1xuXHRmb250LXNpemU6IDQ4cHg7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG59XG5cbi5zdWNjZXNzLXN0YXRlOjpiZWZvcmUge1xuXHRjb250ZW50OiAnXHUyNzA1Jztcblx0Zm9udC1zaXplOiA0OHB4O1xuXHRtYXJnaW4tYm90dG9tOiAxNnB4O1xufVxuXG4uZXJyb3Itc3RhdGU6OmJlZm9yZSB7XG5cdGNvbnRlbnQ6ICdcdTI3NEMnO1xuXHRmb250LXNpemU6IDQ4cHg7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG59XG5cbi8qIFx1NTJBMFx1OEY3RFx1NTJBOFx1NzUzQiAqL1xuLnNwaW5uZXIge1xuXHR3aWR0aDogMzJweDtcblx0aGVpZ2h0OiAzMnB4O1xuXHRib3JkZXI6IDNweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG5cdGJvcmRlci10b3AtY29sb3I6IHZhcigtLXRleHQtYWNjZW50KTtcblx0Ym9yZGVyLXJhZGl1czogNTAlO1xuXHRhbmltYXRpb246IHNwaW4gMXMgbGluZWFyIGluZmluaXRlO1xuXHRtYXJnaW4tYm90dG9tOiAxNnB4O1xufVxuXG5Aa2V5ZnJhbWVzIHNwaW4ge1xuXHR0byB7XG5cdFx0dHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTtcblx0fVxufVxuXG4vKiA9PT09PSBcdThCQkVcdTdGNkVcdTk4NzVcdTk3NjJcdTY4MzdcdTVGMEYgPT09PT0gKi9cbi5zZXR0aW5ncy1kaXZpZGVyIHtcblx0bWFyZ2luOiAyNHB4IDA7XG5cdGJvcmRlcjogbm9uZTtcblx0Ym9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbn1cblxuLnNldHRpbmdzLWRlc2NyaXB0aW9uIHtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRtYXJnaW4tYm90dG9tOiA4cHg7XG59XG5cbi5zZXR0aW5ncy1saXN0IHtcblx0bWFyZ2luOiAwO1xuXHRwYWRkaW5nLWxlZnQ6IDIwcHg7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLnNldHRpbmdzLWxpc3QgbGkge1xuXHRtYXJnaW4tYm90dG9tOiA0cHg7XG59XG5cbi8qID09PT09IFx1NjQxQ1x1N0QyMlx1Njg0Nlx1NjgzN1x1NUYwRiA9PT09PSAqL1xuLnNlYXJjaC1jb250YWluZXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRnYXA6IDhweDtcblx0bWFyZ2luLWJvdHRvbTogMTZweDtcblx0cGFkZGluZzogOHB4IDEycHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xufVxuXG4uc2VhcmNoLWlucHV0IHtcblx0ZmxleDogMTtcblx0cGFkZGluZzogOHB4IDEycHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRmb250LXNpemU6IDAuOWVtO1xufVxuXG4uc2VhcmNoLWlucHV0OmZvY3VzIHtcblx0b3V0bGluZTogbm9uZTtcblx0Ym9yZGVyLWNvbG9yOiB2YXIoLS10ZXh0LWFjY2VudCk7XG59XG5cbi5zZWFyY2gtaWNvbiB7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLnNlYXJjaC1yZXN1bHRzLWNvdW50IHtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRmb250LXNpemU6IDAuODVlbTtcbn1cblxuLmNsZWFyLXNlYXJjaCB7XG5cdHBhZGRpbmc6IDRweDtcblx0Ym9yZGVyOiBub25lO1xuXHRiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi5jbGVhci1zZWFyY2g6aG92ZXIge1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xufVxuXG4vKiA9PT09PSBcdTUyMDZcdTk4NzVcdTYzQTdcdTRFRjYgPT09PT0gKi9cbi5wYWdpbmF0aW9uIHtcblx0ZGlzcGxheTogZmxleDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0anVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG5cdGdhcDogMTJweDtcblx0bWFyZ2luLXRvcDogMjBweDtcblx0cGFkZGluZzogMTZweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG59XG5cbi5wYWdlLWJ1dHRvbiB7XG5cdHBhZGRpbmc6IDZweCAxMnB4O1xuXHRib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi5wYWdlLWJ1dHRvbjpob3Zlcjpub3QoOmRpc2FibGVkKSB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4ucGFnZS1idXR0b246ZGlzYWJsZWQge1xuXHRvcGFjaXR5OiAwLjU7XG5cdGN1cnNvcjogbm90LWFsbG93ZWQ7XG59XG5cbi5wYWdlLWluZm8ge1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdGZvbnQtc2l6ZTogMC45ZW07XG59XG5cbi5wYWdlLWp1bXAtaW5wdXQge1xuXHR3aWR0aDogNTBweDtcblx0cGFkZGluZzogNHB4IDhweDtcblx0Ym9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtcHJpbWFyeSk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG5cdHRleHQtYWxpZ246IGNlbnRlcjtcbn1cblxuLyogPT09PT0gXHU5MDA5XHU2MkU5XHU2QTIxXHU1RjBGXHU1REU1XHU1MTc3XHU2ODBGID09PT09ICovXG4uc2VsZWN0aW9uLXRvb2xiYXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRnYXA6IDEycHg7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG5cdHBhZGRpbmc6IDEycHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xufVxuXG4uc2VsZWN0aW9uLWNvdW50IHtcblx0Zm9udC13ZWlnaHQ6IDYwMDtcblx0Y29sb3I6IHZhcigtLXRleHQtYWNjZW50KTtcbn1cblxuLnRvb2xiYXItYnV0dG9uIHtcblx0ZGlzcGxheTogZmxleDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0anVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG5cdHBhZGRpbmc6IDhweDtcblx0Ym9yZGVyOiBub25lO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcblx0Y29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi50b29sYmFyLWJ1dHRvbjpob3ZlciB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbn1cblxuLnRvb2xiYXItYnV0dG9uLmRhbmdlciB7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LWVycm9yKTtcbn1cblxuLnRvb2xiYXItYnV0dG9uLmRhbmdlcjpob3ZlciB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItZXJyb3IpO1xuXHRjb2xvcjogd2hpdGU7XG59XG5cbi8qID09PT09IFx1NTZGRVx1NzI0N1x1OTAwOVx1NjJFOVx1Njg0NiA9PT09PSAqL1xuLmltYWdlLWl0ZW0ge1xuXHRwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbi5pdGVtLWNoZWNrYm94IHtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6IDhweDtcblx0bGVmdDogOHB4O1xuXHR6LWluZGV4OiAxMDtcblx0d2lkdGg6IDE4cHg7XG5cdGhlaWdodDogMThweDtcblx0Y3Vyc29yOiBwb2ludGVyO1xufVxuXG4vKiA9PT09PSBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTdCQTFcdTc0MDZcdTg5QzZcdTU2RkUgPT09PT0gKi9cbi50cmFzaC1tYW5hZ2VtZW50LXZpZXcge1xuXHRoZWlnaHQ6IDEwMCU7XG5cdG92ZXJmbG93LXk6IGF1dG87XG5cdHBhZGRpbmc6IDE2cHg7XG5cdGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG59XG5cbi50cmFzaC1oZWFkZXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG5cdG1hcmdpbi1ib3R0b206IDIwcHg7XG5cdHBhZGRpbmctYm90dG9tOiAxNnB4O1xuXHRib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4udHJhc2gtaGVhZGVyIGgyIHtcblx0bWFyZ2luOiAwO1xuXHRmb250LXNpemU6IDEuNWVtO1xuXHRmb250LXdlaWdodDogNjAwO1xufVxuXG4udHJhc2gtbGlzdCB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG5cdGdhcDogMTJweDtcbn1cblxuLnRyYXNoLWl0ZW0ge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRnYXA6IDE2cHg7XG5cdHBhZGRpbmc6IDEycHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Ym9yZGVyLXJhZGl1czogOHB4O1xuXHR0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMnM7XG59XG5cbi50cmFzaC1pdGVtOmhvdmVyIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC10ZXJ0aWFyeSk7XG59XG5cbi5pdGVtLWljb24ge1xuXHR3aWR0aDogNDBweDtcblx0aGVpZ2h0OiA0MHB4O1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC10ZXJ0aWFyeSk7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4uaXRlbS1vcmlnaW5hbC1wYXRoIHtcblx0Zm9udC1zaXplOiAwLjhlbTtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRtYXJnaW4tdG9wOiAycHg7XG59XG5cbi5pdGVtLWRhdGUge1xuXHRmb250LXNpemU6IDAuOGVtO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdG1hcmdpbi10b3A6IDJweDtcbn1cblxuLyogPT09PT0gXHU1QTkyXHU0RjUzXHU5ODg0XHU4OUM4IE1vZGFsID09PT09ICovXG4ubWVkaWEtcHJldmlldy1tb2RhbCB7XG5cdG1heC13aWR0aDogOTB2dztcblx0bWF4LWhlaWdodDogOTB2aDtcbn1cblxuLm1lZGlhLXByZXZpZXctbW9kYWwgLm1vZGFsLWNvbnRlbnQge1xuXHRwYWRkaW5nOiAwO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpO1xufVxuXG4ucHJldmlldy1jbG9zZSB7XG5cdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOiAxMHB4O1xuXHRyaWdodDogMTVweDtcblx0Zm9udC1zaXplOiAyNHB4O1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdGN1cnNvcjogcG9pbnRlcjtcblx0ei1pbmRleDogMTAwO1xufVxuXG4ucHJldmlldy1jbG9zZTpob3ZlciB7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG59XG5cbi5wcmV2aWV3LWNvbnRhaW5lciB7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcblx0ZGlzcGxheTogZmxleDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0anVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG5cdG1pbi1oZWlnaHQ6IDQwMHB4O1xuXHRtYXgtaGVpZ2h0OiA3MHZoO1xuXHRvdmVyZmxvdzogYXV0bztcbn1cblxuLnByZXZpZXctaW1hZ2Uge1xuXHRtYXgtd2lkdGg6IDEwMCU7XG5cdG1heC1oZWlnaHQ6IDcwdmg7XG5cdG9iamVjdC1maXQ6IGNvbnRhaW47XG59XG5cbi5wcmV2aWV3LXZpZGVvLFxuLnByZXZpZXctYXVkaW8ge1xuXHRtYXgtd2lkdGg6IDEwMCU7XG59XG5cbi5wcmV2aWV3LXBkZiB7XG5cdHdpZHRoOiAxMDAlO1xuXHRoZWlnaHQ6IDcwdmg7XG5cdGJvcmRlcjogbm9uZTtcbn1cblxuLnByZXZpZXctdW5zdXBwb3J0ZWQge1xuXHRwYWRkaW5nOiA0MHB4O1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG59XG5cbi5wcmV2aWV3LW5hdiB7XG5cdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOiA1MCU7XG5cdHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKTtcblx0bGVmdDogMDtcblx0cmlnaHQ6IDA7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2Vlbjtcblx0cGFkZGluZzogMCAyMHB4O1xuXHRwb2ludGVyLWV2ZW50czogbm9uZTtcbn1cblxuLm5hdi1idXR0b24ge1xuXHRwb2ludGVyLWV2ZW50czogYXV0bztcblx0Zm9udC1zaXplOiAzMnB4O1xuXHRwYWRkaW5nOiAxMHB4IDE1cHg7XG5cdGJvcmRlcjogbm9uZTtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLm5hdi1idXR0b246aG92ZXIge1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcbn1cblxuLm5hdi1pbmZvIHtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHRib3R0b206IDEwcHg7XG5cdGxlZnQ6IDUwJTtcblx0dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpO1xuXHRwYWRkaW5nOiA0cHggMTJweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGZvbnQtc2l6ZTogMC45ZW07XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLnByZXZpZXctaW5mby1iYXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG5cdHBhZGRpbmc6IDEycHggMjBweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4uaW5mby1uYW1lIHtcblx0Zm9udC13ZWlnaHQ6IDUwMDtcbn1cblxuLmluZm8tYWN0aW9ucyB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGdhcDogOHB4O1xufVxuXG4uaW5mby1hY3Rpb25zIGJ1dHRvbiB7XG5cdHBhZGRpbmc6IDRweCA4cHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcblx0Y29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcblx0Y3Vyc29yOiBwb2ludGVyO1xufVxuXG4uaW5mby1hY3Rpb25zIGJ1dHRvbjpob3ZlciB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4vKiA9PT09PSBcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEJcdUZGMDhcdTU0MEVcdTU5MDdcdTY4MzdcdTVGMEZcdUZGMDkgPT09PT0gKi9cbi5kdXBsaWNhdGUtZW1wdHktc3RhdGUge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0Z2FwOiAxNnB4O1xuXHRwYWRkaW5nOiA0OHB4IDI0cHg7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4uZHVwbGljYXRlLWVtcHR5LWFjdGlvbiB7XG5cdG1hcmdpbi10b3A6IDhweDtcbn1cblxuLmR1cGxpY2F0ZS1zY2FuLXByb2dyZXNzIHtcblx0cGFkZGluZzogMjBweDtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4uZHVwbGljYXRlLXByb2dyZXNzLWJhciB7XG5cdGhlaWdodDogOHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0b3ZlcmZsb3c6IGhpZGRlbjtcblx0bWFyZ2luOiAxNnB4IDA7XG59XG5cbi5kdXBsaWNhdGUtcHJvZ3Jlc3MtZmlsbCB7XG5cdGhlaWdodDogMTAwJTtcblx0YmFja2dyb3VuZDogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHR0cmFuc2l0aW9uOiB3aWR0aCAwLjNzIGVhc2U7XG59XG5cbi5kdXBsaWNhdGUtcHJvZ3Jlc3MtdGV4dCB7XG5cdGZvbnQtc2l6ZTogMC45ZW07XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLmR1cGxpY2F0ZS1kZXRlY3Rpb24tdmlldyB7XG5cdGhlaWdodDogMTAwJTtcblx0b3ZlcmZsb3cteTogYXV0bztcblx0cGFkZGluZzogMTZweDtcblx0Ym94LXNpemluZzogYm9yZGVyLWJveDtcbn1cblxuLmR1cGxpY2F0ZS1oZWFkZXIge1xuXHRtYXJnaW4tYm90dG9tOiAxNnB4O1xuXHRwYWRkaW5nLWJvdHRvbTogMTJweDtcblx0Ym9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbn1cblxuLmR1cGxpY2F0ZS1oZWFkZXItZGVzY3JpcHRpb24ge1xuXHRtYXJnaW4tdG9wOiA0cHg7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0Zm9udC1zaXplOiAwLjllbTtcbn1cblxuLmR1cGxpY2F0ZS1oZWFkZXItYWN0aW9ucyB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGZsZXgtd3JhcDogd3JhcDtcblx0Z2FwOiA4cHg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdG1hcmdpbi10b3A6IDhweDtcbn1cblxuLmR1cGxpY2F0ZS1hY3Rpb24tYnV0dG9uIHtcblx0ZGlzcGxheTogaW5saW5lLWZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGp1c3RpZnktY29udGVudDogY2VudGVyO1xuXHRnYXA6IDRweDtcblx0cGFkZGluZzogOHB4IDEycHg7XG5cdGJvcmRlcjogbm9uZTtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG5cdGN1cnNvcjogcG9pbnRlcjtcblx0dHJhbnNpdGlvbjogYmFja2dyb3VuZCAwLjJzLCBjb2xvciAwLjJzLCBvcGFjaXR5IDAuMnM7XG59XG5cbi5kdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbjpob3Zlcjpub3QoOmRpc2FibGVkKSB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4uZHVwbGljYXRlLWFjdGlvbi1idXR0b246ZGlzYWJsZWQge1xuXHRvcGFjaXR5OiAwLjY7XG5cdGN1cnNvcjogd2FpdDtcbn1cblxuLmR1cGxpY2F0ZS1hY3Rpb24tYnV0dG9uLXByaW1hcnkge1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1vbi1hY2NlbnQpO1xufVxuXG4uZHVwbGljYXRlLWFjdGlvbi1idXR0b24tcHJpbWFyeTpob3Zlcjpub3QoOmRpc2FibGVkKSB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWludGVyYWN0aXZlLWFjY2VudC1ob3Zlcik7XG59XG5cbi5kdXBsaWNhdGUtdGhyZXNob2xkLWxhYmVsIHtcblx0Zm9udC1zaXplOiAwLjg1ZW07XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLmR1cGxpY2F0ZS1zdGF0cy1iYXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRnYXA6IDE2cHg7XG5cdHBhZGRpbmc6IDEycHggMTZweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG59XG5cbi5kdXBsaWNhdGUtc3RhdHMtY291bnQge1xuXHRmb250LXdlaWdodDogNjAwO1xuXHRjb2xvcjogdmFyKC0tdGV4dC13YXJuaW5nKTtcbn1cblxuLmR1cGxpY2F0ZS1ncm91cCB7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogOHB4O1xuXHRvdmVyZmxvdzogaGlkZGVuO1xufVxuXG4uZHVwbGljYXRlLWdyb3VwLWhlYWRlciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2Vlbjtcblx0cGFkZGluZzogOHB4IDEycHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Zm9udC13ZWlnaHQ6IDYwMDtcbn1cblxuLmR1cGxpY2F0ZS1ncm91cC1jb3VudCB7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0Zm9udC13ZWlnaHQ6IG5vcm1hbDtcblx0Zm9udC1zaXplOiAwLjg1ZW07XG59XG5cbi5kdXBsaWNhdGUtZ3JvdXAtZmlsZSB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogMTBweDtcblx0cGFkZGluZzogOHB4IDEycHg7XG5cdGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLmR1cGxpY2F0ZS1rZWVwLXN1Z2dlc3Rpb24ge1xuXHRiYWNrZ3JvdW5kOiByZ2JhKDAsIDIwMCwgODMsIDAuMDUpO1xufVxuXG4uZHVwbGljYXRlLWZpbGUtc3VnZ2VzdGlvbiB7XG5cdGJhY2tncm91bmQ6IHJnYmEoMjU1LCAxNTIsIDAsIDAuMDUpO1xufVxuXG4uZHVwbGljYXRlLWZpbGUtdGh1bWJuYWlsIHtcblx0d2lkdGg6IDYwcHg7XG5cdGhlaWdodDogNjBweDtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHRmbGV4LXNocmluazogMDtcbn1cblxuLmR1cGxpY2F0ZS1maWxlLXRodW1ibmFpbCBpbWcge1xuXHR3aWR0aDogMTAwJTtcblx0aGVpZ2h0OiAxMDAlO1xuXHRvYmplY3QtZml0OiBjb3Zlcjtcbn1cblxuLmR1cGxpY2F0ZS1maWxlLWluZm8ge1xuXHRmbGV4OiAxO1xuXHRtaW4td2lkdGg6IDA7XG59XG5cbi5kdXBsaWNhdGUtZmlsZS1uYW1lLFxuLmR1cGxpY2F0ZS1maWxlLXBhdGgge1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHR0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcblx0d2hpdGUtc3BhY2U6IG5vd3JhcDtcbn1cblxuLmR1cGxpY2F0ZS1maWxlLW5hbWUge1xuXHRmb250LXdlaWdodDogNTAwO1xufVxuXG4uZHVwbGljYXRlLWZpbGUtcGF0aCxcbi5kdXBsaWNhdGUtZmlsZS1tZXRhIHtcblx0Zm9udC1zaXplOiAwLjhlbTtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4uZHVwbGljYXRlLXNpbWlsYXJpdHktYmFkZ2Uge1xuXHRkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG5cdHBhZGRpbmc6IDFweCA2cHg7XG5cdGJvcmRlci1yYWRpdXM6IDhweDtcblx0YmFja2dyb3VuZDogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcblx0Y29sb3I6IHZhcigtLXRleHQtb24tYWNjZW50KTtcblx0Zm9udC1zaXplOiAwLjc1ZW07XG5cdGZvbnQtd2VpZ2h0OiA2MDA7XG59XG5cbi5kdXBsaWNhdGUta2VlcC1iYWRnZSB7XG5cdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOiA4cHg7XG5cdHJpZ2h0OiAxMnB4O1xuXHRmb250LXNpemU6IDAuODVlbTtcbn1cblxuLmR1cGxpY2F0ZS1xdWFyYW50aW5lLWJ0biB7XG5cdGRpc3BsYXk6IGlubGluZS1mbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRnYXA6IDRweDtcblx0cGFkZGluZzogNHB4IDEwcHg7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0Zm9udC1zaXplOiAwLjhlbTtcblx0Y3Vyc29yOiBwb2ludGVyO1xuXHRiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMTUyLCAwLCAwLjE1KTtcblx0Y29sb3I6IHZhcigtLWNvbG9yLW9yYW5nZSwgI2ZmOTgwMCk7XG5cdGJvcmRlcjogbm9uZTtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6IDhweDtcblx0cmlnaHQ6IDEycHg7XG59XG5cbi5kdXBsaWNhdGUtcXVhcmFudGluZS1idG46aG92ZXIge1xuXHRiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMTUyLCAwLCAwLjMpO1xufVxuXG4vKiA9PT09PSBcdTU0Q0RcdTVFOTRcdTVGMEZcdThCQkVcdThCQTEgPT09PT0gKi9cbkBtZWRpYSAobWF4LXdpZHRoOiA3NjhweCkge1xuXHQuaW1hZ2UtbGlicmFyeS1oZWFkZXIsXG5cdC51bnJlZmVyZW5jZWQtaGVhZGVyIHtcblx0XHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRcdGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuXHRcdGdhcDogMTJweDtcblx0fVxuXG5cdC5oZWFkZXItYWN0aW9ucyB7XG5cdFx0d2lkdGg6IDEwMCU7XG5cdFx0anVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcblx0fVxuXG5cdC51bnJlZmVyZW5jZWQtaXRlbSB7XG5cdFx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblx0XHRhbGlnbi1pdGVtczogZmxleC1zdGFydDtcblx0fVxuXG5cdC5pdGVtLWFjdGlvbnMge1xuXHRcdHdpZHRoOiAxMDAlO1xuXHRcdGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG5cdFx0bWFyZ2luLXRvcDogOHB4O1xuXHR9XG59YDtcblx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlRWwpO1xuXHR9XG5cblx0YXN5bmMgbG9hZFNldHRpbmdzKCkge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBsb2FkZWQgPSBhd2FpdCB0aGlzLmxvYWREYXRhKCk7XG5cdFx0XHRjb25zdCBzYW5pdGl6ZWQgPSBsb2FkZWQgJiYgdHlwZW9mIGxvYWRlZCA9PT0gJ29iamVjdCdcblx0XHRcdFx0PyBPYmplY3QuZnJvbUVudHJpZXMoXG5cdFx0XHRcdFx0T2JqZWN0LmVudHJpZXMobG9hZGVkKS5maWx0ZXIoKFtrXSkgPT5cblx0XHRcdFx0XHRcdGsgIT09ICdfX3Byb3RvX18nICYmIGsgIT09ICdjb25zdHJ1Y3RvcicgJiYgayAhPT0gJ3Byb3RvdHlwZSdcblx0XHRcdFx0XHQpXG5cdFx0XHRcdClcblx0XHRcdFx0OiB7fTtcblx0XHRcdGNvbnN0IG1lcmdlZCA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIHNhbml0aXplZCkgYXMgUGFydGlhbDxJbWFnZU1hbmFnZXJTZXR0aW5ncz4gJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcblx0XHRcdGNvbnN0IHRvQm9vbCA9ICh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2s6IGJvb2xlYW4pOiBib29sZWFuID0+XG5cdFx0XHRcdHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nID8gdmFsdWUgOiBmYWxsYmFjaztcblxuXHRcdFx0Y29uc3QgaW1hZ2VGb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodHlwZW9mIG1lcmdlZC5pbWFnZUZvbGRlciA9PT0gJ3N0cmluZycgPyBtZXJnZWQuaW1hZ2VGb2xkZXIgOiAnJyk7XG5cdFx0XHRjb25zdCB0cmFzaEZvbGRlclJhdyA9IHR5cGVvZiBtZXJnZWQudHJhc2hGb2xkZXIgPT09ICdzdHJpbmcnID8gbWVyZ2VkLnRyYXNoRm9sZGVyIDogREVGQVVMVF9TRVRUSU5HUy50cmFzaEZvbGRlcjtcblx0XHRcdGNvbnN0IHRyYXNoRm9sZGVyID0gbm9ybWFsaXplVmF1bHRQYXRoKHRyYXNoRm9sZGVyUmF3KSB8fCBERUZBVUxUX1NFVFRJTkdTLnRyYXNoRm9sZGVyO1xuXG5cdFx0XHR0aGlzLnNldHRpbmdzID0ge1xuXHRcdFx0XHQuLi5ERUZBVUxUX1NFVFRJTkdTLFxuXHRcdFx0XHQuLi5tZXJnZWQsXG5cdFx0XHRcdGltYWdlRm9sZGVyLFxuXHRcdFx0XHR0cmFzaEZvbGRlcixcblx0XHRcdFx0dGh1bWJuYWlsU2l6ZTogWydzbWFsbCcsICdtZWRpdW0nLCAnbGFyZ2UnXS5pbmNsdWRlcyhTdHJpbmcobWVyZ2VkLnRodW1ibmFpbFNpemUpKVxuXHRcdFx0XHRcdD8gbWVyZ2VkLnRodW1ibmFpbFNpemUgYXMgJ3NtYWxsJyB8ICdtZWRpdW0nIHwgJ2xhcmdlJ1xuXHRcdFx0XHRcdDogREVGQVVMVF9TRVRUSU5HUy50aHVtYm5haWxTaXplLFxuXHRcdFx0XHRzb3J0Qnk6IFsnbmFtZScsICdkYXRlJywgJ3NpemUnXS5pbmNsdWRlcyhTdHJpbmcobWVyZ2VkLnNvcnRCeSkpXG5cdFx0XHRcdFx0PyBtZXJnZWQuc29ydEJ5IGFzICduYW1lJyB8ICdkYXRlJyB8ICdzaXplJ1xuXHRcdFx0XHRcdDogREVGQVVMVF9TRVRUSU5HUy5zb3J0QnksXG5cdFx0XHRcdHNvcnRPcmRlcjogWydhc2MnLCAnZGVzYyddLmluY2x1ZGVzKFN0cmluZyhtZXJnZWQuc29ydE9yZGVyKSlcblx0XHRcdFx0XHQ/IG1lcmdlZC5zb3J0T3JkZXIgYXMgJ2FzYycgfCAnZGVzYydcblx0XHRcdFx0XHQ6IERFRkFVTFRfU0VUVElOR1Muc29ydE9yZGVyLFxuXHRcdFx0XHRkZWZhdWx0QWxpZ25tZW50OiBbJ2xlZnQnLCAnY2VudGVyJywgJ3JpZ2h0J10uaW5jbHVkZXMoU3RyaW5nKG1lcmdlZC5kZWZhdWx0QWxpZ25tZW50KSlcblx0XHRcdFx0XHQ/IG1lcmdlZC5kZWZhdWx0QWxpZ25tZW50IGFzICdsZWZ0JyB8ICdjZW50ZXInIHwgJ3JpZ2h0J1xuXHRcdFx0XHRcdDogREVGQVVMVF9TRVRUSU5HUy5kZWZhdWx0QWxpZ25tZW50LFxuXHRcdFx0XHRsYW5ndWFnZTogWyd6aCcsICdlbicsICdzeXN0ZW0nXS5pbmNsdWRlcyhTdHJpbmcobWVyZ2VkLmxhbmd1YWdlKSlcblx0XHRcdFx0XHQ/IG1lcmdlZC5sYW5ndWFnZSBhcyAnemgnIHwgJ2VuJyB8ICdzeXN0ZW0nXG5cdFx0XHRcdFx0OiAnc3lzdGVtJyxcblx0XHRcdFx0dHJhc2hDbGVhbnVwRGF5czogTWF0aC5tYXgoMSwgTWF0aC5taW4oMzY1LCBOdW1iZXIobWVyZ2VkLnRyYXNoQ2xlYW51cERheXMpIHx8IERFRkFVTFRfU0VUVElOR1MudHJhc2hDbGVhbnVwRGF5cykpLFxuXHRcdFx0XHRwYWdlU2l6ZTogTWF0aC5tYXgoMSwgTWF0aC5taW4oMTAwMCwgTnVtYmVyKG1lcmdlZC5wYWdlU2l6ZSkgfHwgREVGQVVMVF9TRVRUSU5HUy5wYWdlU2l6ZSkpLFxuXHRcdFx0XHRzaG93SW1hZ2VJbmZvOiB0b0Jvb2wobWVyZ2VkLnNob3dJbWFnZUluZm8sIERFRkFVTFRfU0VUVElOR1Muc2hvd0ltYWdlSW5mbyksXG5cdFx0XHRcdGF1dG9SZWZyZXNoOiB0b0Jvb2wobWVyZ2VkLmF1dG9SZWZyZXNoLCBERUZBVUxUX1NFVFRJTkdTLmF1dG9SZWZyZXNoKSxcblx0XHRcdFx0dXNlVHJhc2hGb2xkZXI6IHRvQm9vbChtZXJnZWQudXNlVHJhc2hGb2xkZXIsIERFRkFVTFRfU0VUVElOR1MudXNlVHJhc2hGb2xkZXIpLFxuXHRcdFx0XHRhdXRvQ2xlYW51cFRyYXNoOiB0b0Jvb2wobWVyZ2VkLmF1dG9DbGVhbnVwVHJhc2gsIERFRkFVTFRfU0VUVElOR1MuYXV0b0NsZWFudXBUcmFzaCksXG5cdFx0XHRcdGVuYWJsZUltYWdlczogdG9Cb29sKG1lcmdlZC5lbmFibGVJbWFnZXMsIERFRkFVTFRfU0VUVElOR1MuZW5hYmxlSW1hZ2VzKSxcblx0XHRcdFx0ZW5hYmxlVmlkZW9zOiB0b0Jvb2wobWVyZ2VkLmVuYWJsZVZpZGVvcywgREVGQVVMVF9TRVRUSU5HUy5lbmFibGVWaWRlb3MpLFxuXHRcdFx0XHRlbmFibGVBdWRpbzogdG9Cb29sKG1lcmdlZC5lbmFibGVBdWRpbywgREVGQVVMVF9TRVRUSU5HUy5lbmFibGVBdWRpbyksXG5cdFx0XHRcdGVuYWJsZVBERjogdG9Cb29sKG1lcmdlZC5lbmFibGVQREYsIERFRkFVTFRfU0VUVElOR1MuZW5hYmxlUERGKSxcblx0XHRcdFx0ZW5hYmxlUHJldmlld01vZGFsOiB0b0Jvb2wobWVyZ2VkLmVuYWJsZVByZXZpZXdNb2RhbCwgREVGQVVMVF9TRVRUSU5HUy5lbmFibGVQcmV2aWV3TW9kYWwpLFxuXHRcdFx0XHRlbmFibGVLZXlib2FyZE5hdjogdG9Cb29sKG1lcmdlZC5lbmFibGVLZXlib2FyZE5hdiwgREVGQVVMVF9TRVRUSU5HUy5lbmFibGVLZXlib2FyZE5hdiksXG5cdFx0XHRcdC8vIFx1NjVCMFx1NTg5RVx1OEJCRVx1N0Y2RVx1NUI1N1x1NkJCNVxuXHRcdFx0XHRzYWZlU2NhbkVuYWJsZWQ6IHRvQm9vbChtZXJnZWQuc2FmZVNjYW5FbmFibGVkLCBERUZBVUxUX1NFVFRJTkdTLnNhZmVTY2FuRW5hYmxlZCksXG5cdFx0XHRcdHNhZmVTY2FuVW5yZWZEYXlzOiBNYXRoLm1heCgxLCBNYXRoLm1pbigzNjUsIE51bWJlcihtZXJnZWQuc2FmZVNjYW5VbnJlZkRheXMpIHx8IERFRkFVTFRfU0VUVElOR1Muc2FmZVNjYW5VbnJlZkRheXMpKSxcblx0XHRcdFx0c2FmZVNjYW5NaW5TaXplOiBNYXRoLm1heCgwLCBOdW1iZXIobWVyZ2VkLnNhZmVTY2FuTWluU2l6ZSkgfHwgREVGQVVMVF9TRVRUSU5HUy5zYWZlU2Nhbk1pblNpemUpLFxuXHRcdFx0XHRkdXBsaWNhdGVUaHJlc2hvbGQ6IE1hdGgubWF4KDUwLCBNYXRoLm1pbigxMDAsIE51bWJlcihtZXJnZWQuZHVwbGljYXRlVGhyZXNob2xkKSB8fCBERUZBVUxUX1NFVFRJTkdTLmR1cGxpY2F0ZVRocmVzaG9sZCkpLFxuXHRcdFx0XHRvcmdhbml6ZVJ1bGVzOiBBcnJheS5pc0FycmF5KG1lcmdlZC5vcmdhbml6ZVJ1bGVzKSA/IG1lcmdlZC5vcmdhbml6ZVJ1bGVzIDogREVGQVVMVF9TRVRUSU5HUy5vcmdhbml6ZVJ1bGVzLFxuXHRcdFx0XHRkZWZhdWx0UHJvY2Vzc1F1YWxpdHk6IE1hdGgubWF4KDEsIE1hdGgubWluKDEwMCwgTnVtYmVyKG1lcmdlZC5kZWZhdWx0UHJvY2Vzc1F1YWxpdHkpIHx8IERFRkFVTFRfU0VUVElOR1MuZGVmYXVsdFByb2Nlc3NRdWFsaXR5KSksXG5cdFx0XHRcdGRlZmF1bHRQcm9jZXNzRm9ybWF0OiBbJ3dlYnAnLCAnanBlZycsICdwbmcnXS5pbmNsdWRlcyhTdHJpbmcobWVyZ2VkLmRlZmF1bHRQcm9jZXNzRm9ybWF0KSlcblx0XHRcdFx0XHQ/IG1lcmdlZC5kZWZhdWx0UHJvY2Vzc0Zvcm1hdCBhcyAnd2VicCcgfCAnanBlZycgfCAncG5nJ1xuXHRcdFx0XHRcdDogREVGQVVMVF9TRVRUSU5HUy5kZWZhdWx0UHJvY2Vzc0Zvcm1hdCxcblx0XHRcdFx0d2F0ZXJtYXJrVGV4dDogdHlwZW9mIG1lcmdlZC53YXRlcm1hcmtUZXh0ID09PSAnc3RyaW5nJyA/IG1lcmdlZC53YXRlcm1hcmtUZXh0IDogREVGQVVMVF9TRVRUSU5HUy53YXRlcm1hcmtUZXh0XG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdTUyQTBcdThGN0RcdThCQkVcdTdGNkVcdTU5MzFcdThEMjVcdUZGMENcdTRGN0ZcdTc1MjhcdTlFRDhcdThCQTRcdThCQkVcdTdGNkU6JywgZXJyb3IpO1xuXHRcdFx0dGhpcy5zZXR0aW5ncyA9IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9O1xuXHRcdH1cblx0fVxuXG5cdGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcblx0XHR0aGlzLnNldHRpbmdzLmltYWdlRm9sZGVyID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMuc2V0dGluZ3MuaW1hZ2VGb2xkZXIpO1xuXHRcdHRoaXMuc2V0dGluZ3MudHJhc2hGb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodGhpcy5zZXR0aW5ncy50cmFzaEZvbGRlcikgfHwgREVGQVVMVF9TRVRUSU5HUy50cmFzaEZvbGRlcjtcblx0XHRhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuXHRcdGF3YWl0IHRoaXMuc3luY1BlcmZvcm1hbmNlSW5mcmFTZXR0aW5ncygpO1xuXHRcdHRoaXMuY2xlYXJDYWNoZSgpO1xuXHRcdHRoaXMuc2NoZWR1bGVSZWZyZXNoT3BlblZpZXdzKDE1MCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTA1XHU5NjY0XHU1RjE1XHU3NTI4XHU3RjEzXHU1QjU4XG5cdCAqIFx1NUY1M1x1OEJCRVx1N0Y2RVx1NTNEOFx1NjZGNFx1NUY3MVx1NTRDRFx1N0YxM1x1NUI1OFx1NjcwOVx1NjU0OFx1NjAyN1x1NjVGNlx1OEMwM1x1NzUyOFxuXHQgKi9cblx0Y2xlYXJDYWNoZSgpIHtcblx0XHR0aGlzLnJlZmVyZW5jZWRJbWFnZXNDYWNoZSA9IG51bGw7XG5cdFx0dGhpcy5jYWNoZVRpbWVzdGFtcCA9IDA7XG5cdH1cblxuXHRhc3luYyBvcGVuSW1hZ2VMaWJyYXJ5KCkge1xuXHRcdGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcblxuXHRcdGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfSU1BR0VfTElCUkFSWSlbMF07XG5cdFx0aWYgKCFsZWFmKSB7XG5cdFx0XHRsZWFmID0gd29ya3NwYWNlLmdldExlYWYoJ3RhYicpO1xuXHRcdFx0YXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuXHRcdFx0XHR0eXBlOiBWSUVXX1RZUEVfSU1BR0VfTElCUkFSWSxcblx0XHRcdFx0YWN0aXZlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0d29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cdH1cblxuXHRhc3luYyBmaW5kVW5yZWZlcmVuY2VkSW1hZ2VzKCkge1xuXHRcdGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcblxuXHRcdGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfVU5SRUZFUkVOQ0VEX0lNQUdFUylbMF07XG5cdFx0aWYgKCFsZWFmKSB7XG5cdFx0XHRsZWFmID0gd29ya3NwYWNlLmdldExlYWYoJ3RhYicpO1xuXHRcdFx0YXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuXHRcdFx0XHR0eXBlOiBWSUVXX1RZUEVfVU5SRUZFUkVOQ0VEX0lNQUdFUyxcblx0XHRcdFx0YWN0aXZlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0d29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cdH1cblxuXHQvLyBcdTgzQjdcdTUzRDZcdTYyNDBcdTY3MDlcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdUZGMDhcdTU2RkVcdTcyNDdcdTMwMDFcdTk3RjNcdTg5QzZcdTk4OTFcdTMwMDFQREZcdUZGMDlcblx0YXN5bmMgZ2V0QWxsSW1hZ2VGaWxlcygpOiBQcm9taXNlPFRGaWxlW10+IHtcblx0XHQvLyBcdTRFQ0VcdThCQkVcdTdGNkVcdTRFMkRcdTgzQjdcdTUzRDZcdTU0MkZcdTc1MjhcdTc2ODRcdTYyNjlcdTVDNTVcdTU0MERcblx0XHRjb25zdCBlbmFibGVkRXh0ZW5zaW9ucyA9IGdldEVuYWJsZWRFeHRlbnNpb25zKHtcblx0XHRcdGVuYWJsZUltYWdlczogdGhpcy5zZXR0aW5ncy5lbmFibGVJbWFnZXMsXG5cdFx0XHRlbmFibGVWaWRlb3M6IHRoaXMuc2V0dGluZ3MuZW5hYmxlVmlkZW9zLFxuXHRcdFx0ZW5hYmxlQXVkaW86IHRoaXMuc2V0dGluZ3MuZW5hYmxlQXVkaW8sXG5cdFx0XHRlbmFibGVQREY6IHRoaXMuc2V0dGluZ3MuZW5hYmxlUERGXG5cdFx0fSk7XG5cblx0XHQvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTYyNDBcdTY3MDlcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEJcdTkwRkRcdTg4QUJcdTc5ODFcdTc1Mjhcblx0XHRpZiAoZW5hYmxlZEV4dGVuc2lvbnMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnYWxsTWVkaWFUeXBlc0Rpc2FibGVkJykpO1xuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFsbEZpbGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZXMoKTtcblx0XHRyZXR1cm4gYWxsRmlsZXMuZmlsdGVyKGZpbGUgPT5cblx0XHRcdGVuYWJsZWRFeHRlbnNpb25zLnNvbWUoZXh0ID0+IGZpbGUubmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKGV4dCkpXG5cdFx0KTtcblx0fVxuXG5cdC8vIFx1ODNCN1x1NTNENlx1NjI0MFx1NjcwOVx1NTZGRVx1NzI0N1x1NjU4N1x1NEVGNlx1RkYwOFx1NEZERFx1NzU1OVx1NTE3Q1x1NUJCOVx1NjAyN1x1RkYwOVxuXHRhc3luYyBnZXRBbGxNZWRpYUZpbGVzKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuXHRcdHJldHVybiB0aGlzLmdldEFsbEltYWdlRmlsZXMoKTtcblx0fVxuXG5cdC8vIFx1ODNCN1x1NTNENlx1NjI0MFx1NjcwOU1hcmtkb3duXHU2NTg3XHU0RUY2XHU0RTJEXHU1RjE1XHU3NTI4XHU3Njg0XHU1NkZFXHU3MjQ3XG5cdGFzeW5jIGdldFJlZmVyZW5jZWRJbWFnZXMoc2lnbmFsPzogQWJvcnRTaWduYWwpOiBQcm9taXNlPFNldDxzdHJpbmc+PiB7XG5cdFx0Y29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblxuXHRcdC8vIFx1NjhDMFx1NjdFNVx1N0YxM1x1NUI1OFx1NjYyRlx1NTQyNlx1NjcwOVx1NjU0OFxuXHRcdGlmICh0aGlzLnJlZmVyZW5jZWRJbWFnZXNDYWNoZSAmJiAobm93IC0gdGhpcy5jYWNoZVRpbWVzdGFtcCkgPCBJbWFnZU1hbmFnZXJQbHVnaW4uQ0FDSEVfRFVSQVRJT04pIHtcblx0XHRcdHJldHVybiB0aGlzLnJlZmVyZW5jZWRJbWFnZXNDYWNoZTtcblx0XHR9XG5cblx0XHQvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTVERjJcdTRFMkRcdTZCNjJcblx0XHRpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1NjYW4gY2FuY2VsbGVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVmZXJlbmNlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXHRcdGNvbnN0IHsgdmF1bHQgfSA9IHRoaXMuYXBwO1xuXHRcdGNvbnN0IGVuYWJsZWRFeHRlbnNpb25zID0gZ2V0RW5hYmxlZEV4dGVuc2lvbnMoe1xuXHRcdFx0ZW5hYmxlSW1hZ2VzOiB0aGlzLnNldHRpbmdzLmVuYWJsZUltYWdlcyxcblx0XHRcdGVuYWJsZVZpZGVvczogdGhpcy5zZXR0aW5ncy5lbmFibGVWaWRlb3MsXG5cdFx0XHRlbmFibGVBdWRpbzogdGhpcy5zZXR0aW5ncy5lbmFibGVBdWRpbyxcblx0XHRcdGVuYWJsZVBERjogdGhpcy5zZXR0aW5ncy5lbmFibGVQREZcblx0XHR9KTtcblx0XHRjb25zdCBleHRlbnNpb25QYXR0ZXJuID0gZW5hYmxlZEV4dGVuc2lvbnMubWFwKGV4dCA9PiBleHQuc2xpY2UoMSkpLmpvaW4oJ3wnKTtcblxuXHRcdGlmICghZXh0ZW5zaW9uUGF0dGVybikge1xuXHRcdFx0dGhpcy5yZWZlcmVuY2VkSW1hZ2VzQ2FjaGUgPSByZWZlcmVuY2VkO1xuXHRcdFx0dGhpcy5jYWNoZVRpbWVzdGFtcCA9IG5vdztcblx0XHRcdHJldHVybiByZWZlcmVuY2VkO1xuXHRcdH1cblxuXHRcdGNvbnN0IHdpa2lMaW5rUGF0dGVyblNvdXJjZSA9IGBcXFxcW1xcXFxbKFteXFxcXF18XStcXFxcLig/OiR7ZXh0ZW5zaW9uUGF0dGVybn0pKSg/OlxcXFx8W15cXFxcXV0qKT9cXFxcXVxcXFxdYDtcblx0XHRjb25zdCBtYXJrZG93bkxpbmtQYXR0ZXJuU291cmNlID0gYCE/XFxcXFtbXlxcXFxdXSpcXFxcXVxcXFwoKFteKV0rXFxcXC4oPzoke2V4dGVuc2lvblBhdHRlcm59KSg/OlxcXFw/W14pI10qKT8oPzojW14pXSspPylcXFxcKWA7XG5cdFx0Y29uc3QgYWRkUmVmZXJlbmNlZFBhdGggPSAocmF3UGF0aDogc3RyaW5nLCBzb3VyY2VGaWxlUGF0aDogc3RyaW5nKSA9PiB7XG5cdFx0XHRpZiAoIXJhd1BhdGgpIHJldHVybjtcblxuXHRcdFx0bGV0IGNhbmRpZGF0ZSA9IHJhd1BhdGgudHJpbSgpO1xuXHRcdFx0aWYgKGNhbmRpZGF0ZS5zdGFydHNXaXRoKCc8JykgJiYgY2FuZGlkYXRlLmVuZHNXaXRoKCc+JykpIHtcblx0XHRcdFx0Y2FuZGlkYXRlID0gY2FuZGlkYXRlLnNsaWNlKDEsIC0xKS50cmltKCk7XG5cdFx0XHR9XG5cblx0XHRcdGNhbmRpZGF0ZSA9IGNhbmRpZGF0ZS5yZXBsYWNlKC9cXFxcIC9nLCAnICcpO1xuXHRcdFx0Y2FuZGlkYXRlID0gc2FmZURlY29kZVVSSUNvbXBvbmVudChjYW5kaWRhdGUpO1xuXG5cdFx0XHRpZiAoL15bYS16XVthLXowLTkrLi1dKjovaS50ZXN0KGNhbmRpZGF0ZSkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBbd2l0aG91dFF1ZXJ5XSA9IGNhbmRpZGF0ZS5zcGxpdCgvWz8jXS8pO1xuXHRcdFx0Y29uc3Qgbm9ybWFsaXplZENhbmRpZGF0ZSA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh3aXRob3V0UXVlcnkpO1xuXHRcdFx0Y29uc3QgcmVzb2x2ZWRGaWxlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChcblx0XHRcdFx0bm9ybWFsaXplZENhbmRpZGF0ZSB8fCB3aXRob3V0UXVlcnksXG5cdFx0XHRcdHNvdXJjZUZpbGVQYXRoXG5cdFx0XHQpO1xuXHRcdFx0Y29uc3Qgbm9ybWFsaXplZCA9IHJlc29sdmVkRmlsZVxuXHRcdFx0XHQ/IG5vcm1hbGl6ZVZhdWx0UGF0aChyZXNvbHZlZEZpbGUucGF0aCkudG9Mb3dlckNhc2UoKVxuXHRcdFx0XHQ6IG5vcm1hbGl6ZWRDYW5kaWRhdGUudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0aWYgKCFub3JtYWxpemVkKSByZXR1cm47XG5cdFx0XHRyZWZlcmVuY2VkLmFkZChub3JtYWxpemVkKTtcblx0XHR9O1xuXG5cdFx0Ly8gXHU0RjdGXHU3NTI4XHU2QjYzXHU1MjE5XHU2MjZCXHU2M0NGXHU2MjQwXHU2NzA5IE1hcmtkb3duIFx1NjU4N1x1NEVGNlxuXHRcdGNvbnN0IG1hcmtkb3duRmlsZXMgPSB2YXVsdC5nZXRGaWxlcygpLmZpbHRlcihmID0+IGYuZXh0ZW5zaW9uID09PSAnbWQnKTtcblx0XHRjb25zdCB0b3RhbEZpbGVzID0gbWFya2Rvd25GaWxlcy5sZW5ndGg7XG5cblx0XHQvLyBcdTYyNkJcdTYzQ0ZcdThEODVcdTY1RjZcdTRGRERcdTYyQTRcdUZGMDhcdTlFRDhcdThCQTQgNSBcdTUyMDZcdTk0OUZcdUZGMDlcblx0XHRjb25zdCBTQ0FOX1RJTUVPVVQgPSA1ICogNjAgKiAxMDAwO1xuXHRcdGNvbnN0IHNjYW5TdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXHRcdGxldCB0aW1lb3V0SWQ6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG5cblx0XHQvLyBcdTU5ODJcdTY3OUNcdTRGMjBcdTUxNjVcdTRFODZcdTU5MTZcdTkwRTggc2lnbmFsXHVGRjBDXHU1MjE5XHU0RTBEXHU4QkJFXHU3RjZFXHU1MTg1XHU5MEU4XHU4RDg1XHU2NUY2XG5cdFx0aWYgKCFzaWduYWwpIHtcblx0XHRcdHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1NjYW4gdGltZW91dCByZWFjaGVkLCByZXR1cm5pbmcgcGFydGlhbCByZXN1bHRzJyk7XG5cdFx0XHR9LCBTQ0FOX1RJTUVPVVQpO1xuXHRcdH1cblxuXHRcdC8vIFx1NzZEMVx1NTQyQ1x1NTkxNlx1OTBFOFx1NEUyRFx1NkI2Mlx1NEZFMVx1NTNGN1xuXHRcdGlmIChzaWduYWwpIHtcblx0XHRcdHNpZ25hbC5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsICgpID0+IHtcblx0XHRcdFx0aWYgKHRpbWVvdXRJZCkge1xuXHRcdFx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnNvbGUud2FybignU2NhbiBhYm9ydGVkIGJ5IGV4dGVybmFsIHNpZ25hbCcpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1QkY5XHU0RThFXHU1OTI3XHU1NzhCIFZhdWx0XHVGRjBDXHU2NjNFXHU3OTNBXHU1RjAwXHU1OUNCXHU2MjZCXHU2M0NGXHU5MDFBXHU3N0U1XG5cdFx0Ly8gXHU2Q0U4XHU2MTBGXHVGRjFBT2JzaWRpYW4gXHU3Njg0IE5vdGljZSBcdTRFMERcdTY1MkZcdTYzMDFcdTUyQThcdTYwMDFcdTY2RjRcdTY1QjBcdUZGMENcdTZCQ0ZcdTZCMjEgc2V0TWVzc2FnZSgpIFx1NEYxQVx1NTIxQlx1NUVGQVx1NjVCMFx1NzY4NCBOb3RpY2Vcblx0XHQvLyBcdTU2RTBcdTZCNjRcdTYyMTFcdTRFRUNcdTUzRUFcdTU3MjhcdTVGMDBcdTU5Q0JcdTY1RjZcdTY2M0VcdTc5M0FcdTRFMDBcdTRFMkFcdTkwMUFcdTc3RTVcdUZGMENcdTYyNkJcdTYzQ0ZcdTVCOENcdTYyMTBcdTU0MEVcdTc1MjhcdTY1QjBcdTc2ODRcdTkwMUFcdTc3RTVcdTY2RkZcdTYzNjJcblx0XHRsZXQgc2Nhbk5vdGljZTogTm90aWNlIHwgbnVsbCA9IG51bGw7XG5cdFx0aWYgKHRvdGFsRmlsZXMgPiAxMDApIHtcblx0XHRcdHNjYW5Ob3RpY2UgPSBuZXcgTm90aWNlKHRoaXMudCgnc2Nhbm5pbmdSZWZlcmVuY2VzJykgKyBgICgwLyR7dG90YWxGaWxlc30pYCwgMCk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MjA2XHU2Mjc5XHU1OTA0XHU3NDA2XHU0RUU1XHU5MDdGXHU1MTREXHU5NjNCXHU1ODVFIFVJXG5cdFx0Y29uc3QgQkFUQ0hfU0laRSA9IDIwO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbWFya2Rvd25GaWxlcy5sZW5ndGg7IGkgKz0gQkFUQ0hfU0laRSkge1xuXHRcdFx0Ly8gXHU2OEMwXHU2N0U1XHU4RDg1XHU2NUY2XHU2MjE2XHU0RTJEXHU2QjYyXG5cdFx0XHRpZiAoRGF0ZS5ub3coKSAtIHNjYW5TdGFydFRpbWUgPiBTQ0FOX1RJTUVPVVQpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdTY2FuIHRpbWVvdXQgcmVhY2hlZCwgcmV0dXJuaW5nIHBhcnRpYWwgcmVzdWx0cycpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHRcdGlmIChzaWduYWw/LmFib3J0ZWQpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdTY2FuIGFib3J0ZWQnKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGJhdGNoID0gbWFya2Rvd25GaWxlcy5zbGljZShpLCBpICsgQkFUQ0hfU0laRSk7XG5cblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKGJhdGNoLm1hcChhc3luYyAoZmlsZSkgPT4ge1xuXHRcdFx0XHQvLyBcdTY4QzBcdTY3RTVcdTRFMkRcdTZCNjJcdTRGRTFcdTUzRjdcblx0XHRcdFx0aWYgKHNpZ25hbD8uYWJvcnRlZCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBjb250ZW50OiBzdHJpbmc7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Y29udGVudCA9IGF3YWl0IHZhdWx0LnJlYWQoZmlsZSk7XG5cdFx0XHRcdH0gY2F0Y2gge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHdpa2lMaW5rUGF0dGVybiA9IG5ldyBSZWdFeHAod2lraUxpbmtQYXR0ZXJuU291cmNlLCAnZ2knKTtcblx0XHRcdFx0Y29uc3QgbWFya2Rvd25MaW5rUGF0dGVybiA9IG5ldyBSZWdFeHAobWFya2Rvd25MaW5rUGF0dGVyblNvdXJjZSwgJ2dpJyk7XG5cdFx0XHRcdGxldCBtYXRjaDtcblxuXHRcdFx0XHQvLyBcdTUzMzlcdTkxNEQgV2lraSBcdTk0RkVcdTYzQTVcdUZGMDhcdTU0MkJcdTVFMjZcdTUyMkJcdTU0MERcdTc2ODRcdUZGMDlcblx0XHRcdFx0d2hpbGUgKChtYXRjaCA9IHdpa2lMaW5rUGF0dGVybi5leGVjKGNvbnRlbnQpKSAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdGFkZFJlZmVyZW5jZWRQYXRoKG1hdGNoWzFdLCBmaWxlLnBhdGgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gXHU1MzM5XHU5MTREIE1hcmtkb3duIFx1OTRGRVx1NjNBNVx1RkYwOFx1NTZGRVx1NzI0Ny9cdTk3RjNcdTg5QzZcdTk4OTEvUERGXHVGRjA5XG5cdFx0XHRcdHdoaWxlICgobWF0Y2ggPSBtYXJrZG93bkxpbmtQYXR0ZXJuLmV4ZWMoY29udGVudCkpICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0YWRkUmVmZXJlbmNlZFBhdGgobWF0Y2hbMV0sIGZpbGUucGF0aCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pKTtcblxuXHRcdFx0Ly8gXHU2NkY0XHU2NUIwXHU2MjZCXHU2M0NGXHU4RkRCXHU1RUE2XHU5MDFBXHU3N0U1XG5cdFx0XHRpZiAoc2Nhbk5vdGljZSAmJiBpICUgKEJBVENIX1NJWkUgKiA1KSA9PT0gMCkge1xuXHRcdFx0XHRzY2FuTm90aWNlLmhpZGUoKTtcblx0XHRcdFx0c2Nhbk5vdGljZSA9IG5ldyBOb3RpY2UodGhpcy50KCdzY2FubmluZ1JlZmVyZW5jZXMnKSArIGAgKCR7TWF0aC5taW4oaSArIEJBVENIX1NJWkUsIHRvdGFsRmlsZXMpfS8ke3RvdGFsRmlsZXN9KWAsIDApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBcdThCQTkgVUkgXHU2NzA5XHU2NzNBXHU0RjFBXHU2NkY0XHU2NUIwXG5cdFx0XHRhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMCkpO1xuXHRcdH1cblxuXHRcdC8vIFx1NkUwNVx1NzQwNlx1OEQ4NVx1NjVGNlx1NUI5QVx1NjVGNlx1NTY2OFxuXHRcdGlmICh0aW1lb3V0SWQpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuXHRcdH1cblxuXHRcdC8vIFx1NjI2Qlx1NjNDRlx1NUI4Q1x1NjIxMFx1RkYwQ1x1NjYzRVx1NzkzQVx1NUI4Q1x1NjIxMFx1OTAxQVx1NzdFNVxuXHRcdC8vIFx1NkNFOFx1NjEwRlx1RkYxQVx1NEUwRFx1NEY3Rlx1NzUyOCBzZXRNZXNzYWdlKClcdUZGMENcdTU2RTBcdTRFM0FcdTVCODNcdTRGMUFcdTUyMUJcdTVFRkFcdTY1QjBcdTc2ODQgTm90aWNlXG5cdFx0aWYgKHNjYW5Ob3RpY2UpIHtcblx0XHRcdHNjYW5Ob3RpY2UuaGlkZSgpO1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3NjYW5Db21wbGV0ZScpICsgYCAoJHt0b3RhbEZpbGVzfSAke3RoaXMudCgnZmlsZXNTY2FubmVkJyl9KWApO1xuXHRcdH1cblxuXHRcdC8vIFx1NjZGNFx1NjVCMFx1N0YxM1x1NUI1OFxuXHRcdHRoaXMucmVmZXJlbmNlZEltYWdlc0NhY2hlID0gcmVmZXJlbmNlZDtcblx0XHR0aGlzLmNhY2hlVGltZXN0YW1wID0gbm93O1xuXG5cdFx0cmV0dXJuIHJlZmVyZW5jZWQ7XG5cdH1cblxuXHQvLyBcdTY3RTVcdTYyN0VcdTY3MkFcdTVGMTVcdTc1MjhcdTc2ODRcdTU2RkVcdTcyNDdcblx0YXN5bmMgZmluZFVucmVmZXJlbmNlZCgpOiBQcm9taXNlPFRGaWxlW10+IHtcblx0XHRjb25zdCBhbGxJbWFnZXMgPSBhd2FpdCB0aGlzLmdldEFsbEltYWdlRmlsZXMoKTtcblx0XHRjb25zdCByZWZlcmVuY2VkID0gYXdhaXQgdGhpcy5nZXRSZWZlcmVuY2VkSW1hZ2VzKCk7XG5cblx0XHRyZXR1cm4gYWxsSW1hZ2VzLmZpbHRlcihmaWxlID0+IHtcblx0XHRcdGNvbnN0IGZpbGVQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKGZpbGUucGF0aCkudG9Mb3dlckNhc2UoKTtcblx0XHRcdHJldHVybiAhcmVmZXJlbmNlZC5oYXMoZmlsZVBhdGgpO1xuXHRcdH0pO1xuXHR9XG5cblx0Ly8gXHU2MjRCXHU1MkE4XHU1MjM3XHU2NUIwXHU3RjEzXHU1QjU4XG5cdGFzeW5jIHJlZnJlc2hDYWNoZSgpIHtcblx0XHQvLyBcdTZFMDVcdTk2NjRcdTdGMTNcdTVCNThcblx0XHR0aGlzLnJlZmVyZW5jZWRJbWFnZXNDYWNoZSA9IG51bGw7XG5cdFx0dGhpcy5jYWNoZVRpbWVzdGFtcCA9IDA7XG5cblx0XHQvLyBcdTkxQ0RcdTY1QjBcdTgzQjdcdTUzRDZcdTVGMTVcdTc1Mjhcblx0XHRhd2FpdCB0aGlzLmdldFJlZmVyZW5jZWRJbWFnZXMoKTtcblxuXHRcdG5ldyBOb3RpY2UodGhpcy50KCdzY2FuQ29tcGxldGUnKSk7XG5cdH1cblxuXHQvLyBcdTYyNTNcdTVGMDBcdTU2RkVcdTcyNDdcdTYyNDBcdTU3MjhcdTc2ODRcdTdCMTRcdThCQjBcblx0YXN5bmMgb3BlbkltYWdlSW5Ob3RlcyhpbWFnZUZpbGU6IFRGaWxlKSB7XG5cdFx0Y29uc3QgeyB3b3Jrc3BhY2UsIHZhdWx0IH0gPSB0aGlzLmFwcDtcblx0XHRjb25zdCByZXN1bHRzOiB7IGZpbGU6IFRGaWxlOyBsaW5lOiBudW1iZXIgfVtdID0gW107XG5cdFx0Y29uc3QgaW1hZ2VOYW1lID0gaW1hZ2VGaWxlLm5hbWU7XG5cblx0XHQvLyBcdTRGN0ZcdTc1MjhcdTZCNjNcdTUyMTlcdTYyNkJcdTYzQ0ZcdTYyNDBcdTY3MDkgTWFya2Rvd24gXHU2NTg3XHU0RUY2XG5cdFx0Y29uc3QgbWFya2Rvd25GaWxlcyA9IHZhdWx0LmdldEZpbGVzKCkuZmlsdGVyKGYgPT4gZi5leHRlbnNpb24gPT09ICdtZCcpO1xuXG5cdFx0Zm9yIChjb25zdCBmaWxlIG9mIG1hcmtkb3duRmlsZXMpIHtcblx0XHRcdGxldCBjb250ZW50OiBzdHJpbmc7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb250ZW50ID0gYXdhaXQgdmF1bHQucmVhZChmaWxlKTtcblx0XHRcdH0gY2F0Y2gge1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc3QgbGluZSA9IGxpbmVzW2ldO1xuXHRcdFx0XHQvLyBcdTRGN0ZcdTc1MjhcdTY2RjRcdTdDQkVcdTc4NkVcdTc2ODRcdTUzMzlcdTkxNERcdUZGMUFcdTUzMzlcdTkxNERcdTU2RkVcdTcyNDdcdTk0RkVcdTYzQTVcdTY4M0NcdTVGMEZcblx0XHRcdFx0aWYgKGxpbmUuaW5jbHVkZXMoaW1hZ2VOYW1lKSAmJlxuXHRcdFx0XHRcdChsaW5lLmluY2x1ZGVzKCdbWycpIHx8IGxpbmUuaW5jbHVkZXMoJyFbJykgfHwgbGluZS5pbmNsdWRlcygnXSgnKSkpIHtcblx0XHRcdFx0XHRyZXN1bHRzLnB1c2goeyBmaWxlLCBsaW5lOiBpICsgMSB9KTtcblx0XHRcdFx0XHRicmVhazsgLy8gXHU2QkNGXHU0RTJBXHU2NTg3XHU0RUY2XHU1M0VBXHU1M0Q2XHU3QjJDXHU0RTAwXHU0RTJBXHU1MzM5XHU5MTREXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAocmVzdWx0cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRjb25zdCByZXN1bHQgPSByZXN1bHRzWzBdO1xuXHRcdFx0Ly8gXHU2MjUzXHU1RjAwXHU2NTg3XHU0RUY2XHU1RTc2XHU4REYzXHU4RjZDXHU1MjMwXHU2MzA3XHU1QjlBXHU4ODRDXG5cdFx0XHRjb25zdCBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoJ3RhYicpO1xuXHRcdFx0YXdhaXQgbGVhZi5vcGVuRmlsZShyZXN1bHQuZmlsZSk7XG5cblx0XHRcdC8vIFx1NUMxRFx1OEJENVx1OERGM1x1OEY2Q1x1NTIzMFx1NTE3N1x1NEY1M1x1ODg0Q1xuXHRcdFx0aWYgKHJlc3VsdC5saW5lID4gMSkge1xuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCB2aWV3ID0gd29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcblx0XHRcdFx0XHRpZiAodmlldykge1xuXHRcdFx0XHRcdFx0Y29uc3QgZWRpdG9yID0gdmlldy5lZGl0b3I7XG5cdFx0XHRcdFx0XHRlZGl0b3Iuc2V0Q3Vyc29yKHsgY2g6IDAsIGxpbmU6IHJlc3VsdC5saW5lIC0gMSB9KTtcblx0XHRcdFx0XHRcdGVkaXRvci5zY3JvbGxJbnRvVmlldyh7IGZyb206IHsgY2g6IDAsIGxpbmU6IHJlc3VsdC5saW5lIC0gMSB9LCB0bzogeyBjaDogMCwgbGluZTogcmVzdWx0LmxpbmUgLSAxIH0gfSwgdHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAxMDApO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnbm90UmVmZXJlbmNlZCcpKTtcblx0XHR9XG5cdH1cblxuXHQvLyBcdTVCRjlcdTlGNTBcdTkwMDlcdTRFMkRcdTc2ODRcdTU2RkVcdTcyNDdcblx0YWxpZ25TZWxlY3RlZEltYWdlKGVkaXRvcjogRWRpdG9yLCBhbGlnbm1lbnQ6ICdsZWZ0JyB8ICdjZW50ZXInIHwgJ3JpZ2h0Jykge1xuXHRcdGNvbnN0IHNlbGVjdGlvbiA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcblx0XHRpZiAoIXNlbGVjdGlvbikge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3NlbGVjdEltYWdlRmlyc3QnKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU5MDA5XHU0RTJEXHU3Njg0XHU2NjJGXHU1NkZFXHU3MjQ3XG5cdFx0aWYgKCFzZWxlY3Rpb24uaW5jbHVkZXMoJyFbJykgJiYgIXNlbGVjdGlvbi5pbmNsdWRlcygnW1snKSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3NlbGVjdEltYWdlJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFsaWduZWRUZXh0ID0gSW1hZ2VBbGlnbm1lbnQuYXBwbHlBbGlnbm1lbnQoc2VsZWN0aW9uLCBhbGlnbm1lbnQpO1xuXHRcdGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGFsaWduZWRUZXh0KTtcblxuXHRcdC8vIFx1NjgzOVx1NjM2RVx1NUJGOVx1OUY1MFx1NjVCOVx1NUYwRlx1NjYzRVx1NzkzQVx1NUJGOVx1NUU5NFx1NzY4NFx1NkQ4OFx1NjA2RlxuXHRcdGNvbnN0IGFsaWdubWVudEtleSA9IGFsaWdubWVudCA9PT0gJ2xlZnQnID8gJ2ltYWdlQWxpZ25lZExlZnQnIDogYWxpZ25tZW50ID09PSAnY2VudGVyJyA/ICdpbWFnZUFsaWduZWRDZW50ZXInIDogJ2ltYWdlQWxpZ25lZFJpZ2h0Jztcblx0XHRuZXcgTm90aWNlKHRoaXMudChhbGlnbm1lbnRLZXkpKTtcblx0fVxuXG5cdC8vIFx1NkRGQlx1NTJBMFx1N0YxNlx1OEY5MVx1NTY2OFx1NEUwQVx1NEUwQlx1NjU4N1x1ODNEQ1x1NTM1NVx1OTg3OVxuXHRhZGRBbGlnbm1lbnRNZW51SXRlbXMobWVudTogTWVudSwgZWRpdG9yOiBFZGl0b3IpIHtcblx0XHRjb25zdCBzZWxlY3Rpb24gPSBlZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XG5cblx0XHQvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTkwMDlcdTRFMkRcdTRFODZcdTU2RkVcdTcyNDdcblx0XHRpZiAoIXNlbGVjdGlvbiB8fCAoIXNlbGVjdGlvbi5pbmNsdWRlcygnIVsnKSAmJiAhc2VsZWN0aW9uLmluY2x1ZGVzKCdbWycpKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cblx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRpdGVtLnNldFRpdGxlKHRoaXMudCgnYWxpZ25JbWFnZUxlZnQnKSlcblx0XHRcdFx0LnNldEljb24oJ2FsaWduLWxlZnQnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAnbGVmdCcpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy50KCdhbGlnbkltYWdlQ2VudGVyJykpXG5cdFx0XHRcdC5zZXRJY29uKCdhbGlnbi1jZW50ZXInKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAnY2VudGVyJyk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnQoJ2FsaWduSW1hZ2VSaWdodCcpKVxuXHRcdFx0XHQuc2V0SWNvbignYWxpZ24tcmlnaHQnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAncmlnaHQnKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU3ODZFXHU0RkREXHU3NkVFXHU1RjU1XHU1QjU4XHU1NzI4XHVGRjA4XHU2NTJGXHU2MzAxXHU5MDEyXHU1RjUyXHU1MjFCXHU1RUZBXHVGRjA5XG5cdCAqL1xuXHRhc3luYyBlbnN1cmVGb2xkZXJFeGlzdHMocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Y29uc3Qgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgocGF0aCk7XG5cblx0XHRpZiAoIW5vcm1hbGl6ZWRQYXRoKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoIWlzUGF0aFNhZmUobm9ybWFsaXplZFBhdGgpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyB2YXVsdCB9ID0gdGhpcy5hcHA7XG5cdFx0Y29uc3Qgc2VnbWVudHMgPSBub3JtYWxpemVkUGF0aC5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKTtcblx0XHRsZXQgY3VycmVudFBhdGggPSAnJztcblxuXHRcdGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuXHRcdFx0Y3VycmVudFBhdGggPSBjdXJyZW50UGF0aCA/IGAke2N1cnJlbnRQYXRofS8ke3NlZ21lbnR9YCA6IHNlZ21lbnQ7XG5cdFx0XHRjb25zdCBleGlzdGluZyA9IHZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50UGF0aCk7XG5cblx0XHRcdGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChleGlzdGluZykge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHZhdWx0LmNyZWF0ZUZvbGRlcihjdXJyZW50UGF0aCk7XG5cdFx0XHR9IGNhdGNoIHtcblx0XHRcdFx0Ly8gXHU1RTc2XHU1M0QxXHU1MjFCXHU1RUZBXHU2NUY2XHU1RkZEXHU3NTY1XHUyMDFDXHU1REYyXHU1QjU4XHU1NzI4XHUyMDFEXHU1NzNBXHU2NjZGXG5cdFx0XHRcdGNvbnN0IHJldHJpZWQgPSB2YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudFBhdGgpO1xuXHRcdFx0XHRpZiAoIShyZXRyaWVkIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdC8vIFx1NUI4OVx1NTE2OFx1NTIyMFx1OTY2NFx1NjU4N1x1NEVGNlx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHRhc3luYyBzYWZlRGVsZXRlRmlsZShmaWxlOiBURmlsZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHsgdmF1bHQgfSA9IHRoaXMuYXBwO1xuXG5cdFx0aWYgKCF0aGlzLnNldHRpbmdzLnVzZVRyYXNoRm9sZGVyKSB7XG5cdFx0XHQvLyBcdTc2RjRcdTYzQTVcdTUyMjBcdTk2NjRcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHZhdWx0LmRlbGV0ZShmaWxlKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdcdTUyMjBcdTk2NjRcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnZGVsZXRlRmFpbGVkV2l0aE5hbWUnLCB7IG5hbWU6IGZpbGUubmFtZSB9KSk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBcdTc5RkJcdTUyQThcdTUyMzBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzlcblx0XHQvLyBcdTRGN0ZcdTc1MjhcdTUzQ0NcdTRFMEJcdTUyMTJcdTdFQkYgX18gXHU0RjVDXHU0RTNBXHU1MjA2XHU5Njk0XHU3QjI2XHVGRjBDXHU5MDdGXHU1MTREXHU2NTg3XHU0RUY2XHU1NDBEXHU0RTJEXHU1MzA1XHU1NDJCXHU0RTBCXHU1MjEyXHU3RUJGXHU2NUY2XHU4OUUzXHU2NzkwXHU5NTE5XHU4QkVGXG5cdFx0Y29uc3QgdHJhc2hQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMuc2V0dGluZ3MudHJhc2hGb2xkZXIpIHx8IERFRkFVTFRfU0VUVElOR1MudHJhc2hGb2xkZXI7XG5cblx0XHRpZiAoIWlzUGF0aFNhZmUodHJhc2hQYXRoKSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ29wZXJhdGlvbkZhaWxlZCcsIHsgbmFtZTogZmlsZS5uYW1lIH0pKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlTmFtZSA9IGZpbGUubmFtZTtcblx0XHRjb25zdCB0aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuXHRcdGNvbnN0IGVuY29kZWRPcmlnaW5hbFBhdGggPSBlbmNvZGVVUklDb21wb25lbnQobm9ybWFsaXplVmF1bHRQYXRoKGZpbGUucGF0aCkgfHwgZmlsZS5uYW1lKTtcblx0XHRjb25zdCBuZXdGaWxlTmFtZSA9IGAke3RpbWVzdGFtcH1fXyR7ZW5jb2RlZE9yaWdpbmFsUGF0aH1gO1xuXHRcdGNvbnN0IHRhcmdldFBhdGggPSBgJHt0cmFzaFBhdGh9LyR7bmV3RmlsZU5hbWV9YDtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBcdTc4NkVcdTRGRERcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTVCNThcdTU3Mjhcblx0XHRcdGNvbnN0IGZvbGRlclJlYWR5ID0gYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJFeGlzdHModHJhc2hQYXRoKTtcblx0XHRcdGlmICghZm9sZGVyUmVhZHkpIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ29wZXJhdGlvbkZhaWxlZCcsIHsgbmFtZTogZmlsZU5hbWUgfSkpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFx1NzlGQlx1NTJBOFx1NjU4N1x1NEVGNlx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHRcdFx0YXdhaXQgdmF1bHQucmVuYW1lKGZpbGUsIHRhcmdldFBhdGgpO1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ21vdmVkVG9UcmFzaCcsIHsgbmFtZTogZmlsZU5hbWUgfSkpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NzlGQlx1NTJBOFx1NjU4N1x1NEVGNlx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnb3BlcmF0aW9uRmFpbGVkJywgeyBuYW1lOiBmaWxlTmFtZSB9KSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0Ly8gXHU2MDYyXHU1OTBEXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XG5cdGFzeW5jIHJlc3RvcmVGaWxlKGZpbGU6IFRGaWxlLCBvcmlnaW5hbFBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHsgdmF1bHQgfSA9IHRoaXMuYXBwO1xuXHRcdGNvbnN0IG5vcm1hbGl6ZWRPcmlnaW5hbFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoc2FmZURlY29kZVVSSUNvbXBvbmVudChvcmlnaW5hbFBhdGgpKTtcblxuXHRcdGlmICghbm9ybWFsaXplZE9yaWdpbmFsUGF0aCB8fCAhaXNQYXRoU2FmZShub3JtYWxpemVkT3JpZ2luYWxQYXRoKSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3Jlc3RvcmVGYWlsZWQnLCB7IG1lc3NhZ2U6IHRoaXMudCgnZXJyb3InKSB9KSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdGFyZ2V0RmlsZSA9IHZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkT3JpZ2luYWxQYXRoKTtcblx0XHRpZiAodGFyZ2V0RmlsZSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3Jlc3RvcmVGYWlsZWQnLCB7IG1lc3NhZ2U6IHRoaXMudCgndGFyZ2V0RmlsZUV4aXN0cycpIH0pKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBwYXJlbnRQYXRoID0gZ2V0UGFyZW50UGF0aChub3JtYWxpemVkT3JpZ2luYWxQYXRoKTtcblx0XHRpZiAocGFyZW50UGF0aCkge1xuXHRcdFx0Y29uc3QgcGFyZW50UmVhZHkgPSBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlckV4aXN0cyhwYXJlbnRQYXRoKTtcblx0XHRcdGlmICghcGFyZW50UmVhZHkpIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3Jlc3RvcmVGYWlsZWQnLCB7IG1lc3NhZ2U6IHRoaXMudCgnZXJyb3InKSB9KSk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCByZXN0b3JlZE5hbWUgPSBnZXRGaWxlTmFtZUZyb21QYXRoKG5vcm1hbGl6ZWRPcmlnaW5hbFBhdGgpIHx8IGZpbGUubmFtZTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB2YXVsdC5yZW5hbWUoZmlsZSwgbm9ybWFsaXplZE9yaWdpbmFsUGF0aCk7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgncmVzdG9yZVN1Y2Nlc3MnLCB7IG5hbWU6IHJlc3RvcmVkTmFtZSB9KSk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU2MDYyXHU1OTBEXHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy50KCdyZXN0b3JlRmFpbGVkJywgeyBtZXNzYWdlOiAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2UgfSkpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdC8vIFx1NUY3Qlx1NUU5NVx1NTIyMFx1OTY2NFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NzY4NFx1NjU4N1x1NEVGNlxuXHRhc3luYyBwZXJtYW5lbnRseURlbGV0ZUZpbGUoZmlsZTogVEZpbGUpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCB7IHZhdWx0IH0gPSB0aGlzLmFwcDtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB2YXVsdC5kZWxldGUoZmlsZSk7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnZmlsZURlbGV0ZWQnLCB7IG5hbWU6IGZpbGUubmFtZSB9KSk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU1RjdCXHU1RTk1XHU1MjIwXHU5NjY0XHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy50KCdkZWxldGVGYWlsZWQnKSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59XG4iLCAiaW1wb3J0IHsgVEZpbGUsIEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBzZXRJY29uLCBNZW51LCBNZW51SXRlbSwgTm90aWNlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IEltYWdlTWFuYWdlclBsdWdpbiBmcm9tICcuLi9tYWluJztcbmltcG9ydCB7IGZvcm1hdEZpbGVTaXplLCBkZWJvdW5jZSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBub3JtYWxpemVWYXVsdFBhdGggfSBmcm9tICcuLi91dGlscy9wYXRoJztcbmltcG9ydCB7IGdldE1lZGlhVHlwZSwgZ2V0RmlsZUV4dGVuc2lvbiB9IGZyb20gJy4uL3V0aWxzL21lZGlhVHlwZXMnO1xuaW1wb3J0IHsgZ2VuZXJhdGVUaHVtYm5haWwgfSBmcm9tICcuLi91dGlscy90aHVtYm5haWxDYWNoZSc7XG5pbXBvcnQgeyBmaW5kTWF0Y2hpbmdSdWxlLCBjb21wdXRlVGFyZ2V0LCBPcmdhbml6ZUNvbnRleHQgfSBmcm9tICcuLi91dGlscy9ydWxlRW5naW5lJztcbmltcG9ydCB7IHBhcnNlRXhpZiB9IGZyb20gJy4uL3V0aWxzL2V4aWZSZWFkZXInO1xuaW1wb3J0IHsgcHJvY2Vzc0ltYWdlLCBnZXRGb3JtYXRFeHRlbnNpb24gfSBmcm9tICcuLi91dGlscy9tZWRpYVByb2Nlc3Nvcic7XG5cbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfSU1BR0VfTElCUkFSWSA9ICdpbWFnZS1saWJyYXJ5LXZpZXcnO1xuXG5pbnRlcmZhY2UgSW1hZ2VJdGVtIHtcblx0ZmlsZTogVEZpbGU7XG5cdHBhdGg6IHN0cmluZztcblx0bmFtZTogc3RyaW5nO1xuXHRzaXplOiBudW1iZXI7XG5cdG1vZGlmaWVkOiBudW1iZXI7XG5cdGRpbWVuc2lvbnM/OiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH07XG59XG5cbmV4cG9ydCBjbGFzcyBJbWFnZUxpYnJhcnlWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0aW1hZ2VzOiBJbWFnZUl0ZW1bXSA9IFtdO1xuXHRmaWx0ZXJlZEltYWdlczogSW1hZ2VJdGVtW10gPSBbXTtcblx0cHJpdmF0ZSBzZWFyY2hRdWVyeTogc3RyaW5nID0gJyc7XG5cdHByaXZhdGUgY3VycmVudFBhZ2U6IG51bWJlciA9IDE7XG5cdHByaXZhdGUgcGFnZVNpemU6IG51bWJlciA9IDUwO1xuXHRwcml2YXRlIHNlbGVjdGVkRmlsZXM6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuXHRwcml2YXRlIGlzU2VsZWN0aW9uTW9kZTogYm9vbGVhbiA9IGZhbHNlO1xuXHRwcml2YXRlIHNlYXJjaElucHV0OiBIVE1MSW5wdXRFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cblx0Y29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcGx1Z2luOiBJbWFnZU1hbmFnZXJQbHVnaW4pIHtcblx0XHRzdXBlcihsZWFmKTtcblx0XHR0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblx0fVxuXG5cdHByaXZhdGUgaXNQcm9jZXNzYWJsZUltYWdlKGZpbGU6IFRGaWxlKTogYm9vbGVhbiB7XG5cdFx0Y29uc3QgZXh0ID0gZ2V0RmlsZUV4dGVuc2lvbihmaWxlLm5hbWUpO1xuXHRcdHJldHVybiBbJy5wbmcnLCAnLmpwZycsICcuanBlZycsICcud2VicCcsICcuYm1wJ10uaW5jbHVkZXMoZXh0KTtcblx0fVxuXG5cdGdldFZpZXdUeXBlKCkge1xuXHRcdHJldHVybiBWSUVXX1RZUEVfSU1BR0VfTElCUkFSWTtcblx0fVxuXG5cdGdldERpc3BsYXlUZXh0KCkge1xuXHRcdHJldHVybiB0aGlzLnBsdWdpbi50KCdtZWRpYUxpYnJhcnknKTtcblx0fVxuXG5cdGFzeW5jIG9uT3BlbigpIHtcblx0XHQvLyBcdTdCNDlcdTVGODUgY29udGVudEVsIFx1NTFDNlx1NTkwN1x1NTk3RFx1RkYwOEl0ZW1WaWV3IFx1NzY4NCBjb250ZW50RWwgXHU5NzAwXHU4OTgxIE9ic2lkaWFuIFx1NTIxRFx1NTlDQlx1NTMxNlx1RkYwOVxuXHRcdGxldCByZXRyaWVzID0gMDtcblx0XHR3aGlsZSAoIXRoaXMuY29udGVudEVsICYmIHJldHJpZXMgPCAxMCkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7XG5cdFx0XHRyZXRyaWVzKys7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0ltYWdlTGlicmFyeVZpZXc6IGNvbnRlbnRFbCBub3QgcmVhZHkgYWZ0ZXIgcmV0cmllcycpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcygnaW1hZ2UtbGlicmFyeS12aWV3Jyk7XG5cdFx0Ly8gXHU0RUNFXHU4QkJFXHU3RjZFXHU0RTJEXHU4QkZCXHU1M0Q2IHBhZ2VTaXplXG5cdFx0dGhpcy5wYWdlU2l6ZSA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnBhZ2VTaXplIHx8IDUwO1xuXHRcdGF3YWl0IHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHR9XG5cblx0YXN5bmMgb25DbG9zZSgpIHtcblx0XHQvLyBcdTZFMDVcdTc0MDZcdTVERTVcdTRGNUMgLSBcdTRFOEJcdTRFRjZcdTc2RDFcdTU0MkNcdTRGMUFcdTU3MjggVmlldyBcdTUzNzhcdThGN0RcdTY1RjZcdTgxRUFcdTUyQThcdTZFMDVcdTc0MDZcblx0fVxuXG5cdGFzeW5jIHJlZnJlc2hJbWFnZXMoKSB7XG5cdFx0Ly8gXHU1OTgyXHU2NzlDXHU4OUM2XHU1NkZFXHU1REYyXHU1MTczXHU5NUVEXHU2MjE2IGNvbnRlbnRFbCBcdTRFMERcdTUzRUZcdTc1MjhcdUZGMENcdTc2RjRcdTYzQTVcdThGRDRcdTU2REVcblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU1NDBDXHU2QjY1XHU2NzAwXHU2NUIwXHU1MjA2XHU5ODc1XHU4QkJFXHU3RjZFXHVGRjBDXHU0RkREXHU4QkMxXHU4QkJFXHU3RjZFXHU1M0Q4XHU2NkY0XHU1NDBFXHU3QUNCXHU1MzczXHU3NTFGXHU2NTQ4XG5cdFx0dGhpcy5wYWdlU2l6ZSA9IE1hdGgubWF4KDEsIHRoaXMucGx1Z2luLnNldHRpbmdzLnBhZ2VTaXplIHx8IDUwKTtcblxuXHRcdGNvbnN0IHNpemVNYXA6IFJlY29yZDxzdHJpbmcsICdzbWFsbCcgfCAnbWVkaXVtJyB8ICdsYXJnZSc+ID0ge1xuXHRcdFx0J3NtYWxsJzogJ3NtYWxsJyxcblx0XHRcdCdtZWRpdW0nOiAnbWVkaXVtJyxcblx0XHRcdCdsYXJnZSc6ICdsYXJnZSdcblx0XHR9O1xuXG5cdFx0Y29uc3Qgc2l6ZSA9IHNpemVNYXBbdGhpcy5wbHVnaW4uc2V0dGluZ3MudGh1bWJuYWlsU2l6ZV0gfHwgJ21lZGl1bSc7XG5cdFx0dGhpcy5jb250ZW50RWwuZW1wdHkoKTtcblxuXHRcdC8vIFx1NTE0OFx1ODNCN1x1NTNENlx1NjI0MFx1NjcwOVx1NTZGRVx1NzI0N1x1NjU3MFx1NjM2RVx1RkYxQVx1NEYxOFx1NTE0OFx1NEY3Rlx1NzUyOFx1NjU4N1x1NEVGNlx1N0QyMlx1NUYxNVx1RkYwOFx1NTg5RVx1OTFDRlx1NjI2Qlx1NjNDRlx1RkYwOVx1RkYwQ1x1NTZERVx1OTAwMFx1NTIzMFx1NTE2OFx1OTFDRlx1OTA0RFx1NTM4NlxuXHRcdGxldCBpbWFnZUZpbGVzOiBURmlsZVtdO1xuXHRcdGlmICh0aGlzLnBsdWdpbi5maWxlSW5kZXguaXNJbml0aWFsaXplZCkge1xuXHRcdFx0Y29uc3QgZW50cmllcyA9IHRoaXMucGx1Z2luLmZpbGVJbmRleC5nZXRGaWxlcygpO1xuXHRcdFx0aW1hZ2VGaWxlcyA9IGVudHJpZXNcblx0XHRcdFx0Lm1hcChlID0+IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChlLnBhdGgpKVxuXHRcdFx0XHQuZmlsdGVyKChmKTogZiBpcyBURmlsZSA9PiBmIGluc3RhbmNlb2YgVEZpbGUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpbWFnZUZpbGVzID0gYXdhaXQgdGhpcy5wbHVnaW4uZ2V0QWxsSW1hZ2VGaWxlcygpO1xuXHRcdH1cblxuXHRcdC8vIFx1OEZDN1x1NkVFNFx1NTZGRVx1NzI0N1x1NjU4N1x1NEVGNlx1NTkzOVx1RkYwOFx1NTk4Mlx1Njc5Q1x1OEJCRVx1N0Y2RVx1NEU4Nlx1RkYwOVxuXHRcdGxldCBmaWx0ZXJlZEltYWdlczogVEZpbGVbXTtcblx0XHRpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGb2xkZXIpIHtcblx0XHRcdGNvbnN0IGZvbGRlciA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZvbGRlcik7XG5cdFx0XHRjb25zdCBwcmVmaXggPSBmb2xkZXIgPyBgJHtmb2xkZXJ9L2AgOiAnJztcblx0XHRcdGZpbHRlcmVkSW1hZ2VzID0gaW1hZ2VGaWxlcy5maWx0ZXIoZiA9PiB7XG5cdFx0XHRcdGNvbnN0IG5vcm1hbGl6ZWRQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKGYucGF0aCk7XG5cdFx0XHRcdHJldHVybiBub3JtYWxpemVkUGF0aCA9PT0gZm9sZGVyIHx8IChwcmVmaXggPyBub3JtYWxpemVkUGF0aC5zdGFydHNXaXRoKHByZWZpeCkgOiBmYWxzZSk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmlsdGVyZWRJbWFnZXMgPSBpbWFnZUZpbGVzO1xuXHRcdH1cblxuXHRcdC8vIFx1NjM5Mlx1NUU4Rlx1NTZGRVx1NzI0N1xuXHRcdHRoaXMuaW1hZ2VzID0gZmlsdGVyZWRJbWFnZXMubWFwKGZpbGUgPT4gKHtcblx0XHRcdGZpbGUsXG5cdFx0XHRwYXRoOiBmaWxlLnBhdGgsXG5cdFx0XHRuYW1lOiBmaWxlLm5hbWUsXG5cdFx0XHRzaXplOiBmaWxlLnN0YXQuc2l6ZSxcblx0XHRcdG1vZGlmaWVkOiBmaWxlLnN0YXQubXRpbWVcblx0XHR9KSk7XG5cblx0XHR0aGlzLnNvcnRJbWFnZXMoKTtcblxuXHRcdC8vIFx1NUU5NFx1NzUyOFx1NjQxQ1x1N0QyMlx1OEZDN1x1NkVFNFxuXHRcdHRoaXMuYXBwbHlTZWFyY2goKTtcblxuXHRcdC8vIFx1NUY1M1x1NjU3MFx1NjM2RVx1OTFDRlx1NTNEOFx1NTMxNlx1NjIxNlx1NTIwNlx1OTg3NVx1NTkyN1x1NUMwRlx1NTNEOFx1NTMxNlx1NjVGNlx1RkYwQ1x1NEZFRVx1NkI2M1x1NUY1M1x1NTI0RFx1OTg3NVx1NzgwMVxuXHRcdGNvbnN0IHRvdGFsUGFnZXMgPSBNYXRoLm1heCgxLCBNYXRoLmNlaWwodGhpcy5maWx0ZXJlZEltYWdlcy5sZW5ndGggLyB0aGlzLnBhZ2VTaXplKSk7XG5cdFx0aWYgKHRoaXMuY3VycmVudFBhZ2UgPiB0b3RhbFBhZ2VzKSB7XG5cdFx0XHR0aGlzLmN1cnJlbnRQYWdlID0gdG90YWxQYWdlcztcblx0XHR9XG5cblx0XHQvLyBcdTUyMUJcdTVFRkFcdTU5MzRcdTkwRThcdUZGMDhcdTU3MjhcdTgzQjdcdTUzRDZcdTY1NzBcdTYzNkVcdTRFNEJcdTU0MEVcdTZFMzJcdTY3RDNcdUZGMDlcblx0XHR0aGlzLnJlbmRlckhlYWRlcigpO1xuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBXHU2NDFDXHU3RDIyXHU2ODQ2XG5cdFx0dGhpcy5yZW5kZXJTZWFyY2hCb3goKTtcblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1OTAwOVx1NjJFOVx1NkEyMVx1NUYwRlx1NURFNVx1NTE3N1x1NjgwRlxuXHRcdGlmICh0aGlzLmlzU2VsZWN0aW9uTW9kZSkge1xuXHRcdFx0dGhpcy5yZW5kZXJTZWxlY3Rpb25Ub29sYmFyKCk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBXHU1NkZFXHU3MjQ3XHU3RjUxXHU2ODNDXHU1QkI5XHU1NjY4XG5cdFx0Y29uc3QgZ3JpZCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ2ltYWdlLWdyaWQnIH0pO1xuXHRcdGdyaWQuYWRkQ2xhc3MoYGltYWdlLWdyaWQtJHtzaXplfWApO1xuXG5cdFx0Ly8gXHU4QkExXHU3Qjk3XHU1MjA2XHU5ODc1XG5cdFx0Y29uc3Qgc3RhcnRJbmRleCA9ICh0aGlzLmN1cnJlbnRQYWdlIC0gMSkgKiB0aGlzLnBhZ2VTaXplO1xuXHRcdGNvbnN0IGVuZEluZGV4ID0gTWF0aC5taW4oc3RhcnRJbmRleCArIHRoaXMucGFnZVNpemUsIHRoaXMuZmlsdGVyZWRJbWFnZXMubGVuZ3RoKTtcblx0XHRjb25zdCBwYWdlSW1hZ2VzID0gdGhpcy5maWx0ZXJlZEltYWdlcy5zbGljZShzdGFydEluZGV4LCBlbmRJbmRleCk7XG5cblx0XHQvLyBcdTZFMzJcdTY3RDNcdTVGNTNcdTUyNERcdTk4NzVcdTc2ODRcdTU2RkVcdTcyNDdcblx0XHRmb3IgKGNvbnN0IGltYWdlIG9mIHBhZ2VJbWFnZXMpIHtcblx0XHRcdHRoaXMucmVuZGVySW1hZ2VJdGVtKGdyaWQsIGltYWdlKTtcblx0XHR9XG5cblx0XHQvLyBcdTUyMUJcdTVFRkFcdTUyMDZcdTk4NzVcdTYzQTdcdTRFRjZcblx0XHR0aGlzLnJlbmRlclBhZ2luYXRpb24oKTtcblxuXHRcdGlmICh0aGlzLmZpbHRlcmVkSW1hZ2VzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHtcblx0XHRcdFx0Y2xzOiAnZW1wdHktc3RhdGUnLFxuXHRcdFx0XHR0ZXh0OiB0aGlzLnNlYXJjaFF1ZXJ5ID8gdGhpcy5wbHVnaW4udCgnbm9NYXRjaGluZ0ZpbGVzJykgOiB0aGlzLnBsdWdpbi50KCdub01lZGlhRmlsZXMnKVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NUU5NFx1NzUyOFx1NjQxQ1x1N0QyMlx1OEZDN1x1NkVFNFxuXHQgKi9cblx0YXBwbHlTZWFyY2goKSB7XG5cdFx0aWYgKCF0aGlzLnNlYXJjaFF1ZXJ5KSB7XG5cdFx0XHR0aGlzLmZpbHRlcmVkSW1hZ2VzID0gWy4uLnRoaXMuaW1hZ2VzXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgcXVlcnkgPSB0aGlzLnNlYXJjaFF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG5cdFx0XHR0aGlzLmZpbHRlcmVkSW1hZ2VzID0gdGhpcy5pbWFnZXMuZmlsdGVyKGltZyA9PlxuXHRcdFx0XHRpbWcubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KSB8fFxuXHRcdFx0XHRpbWcucGF0aC50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KVxuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTMyXHU2N0QzXHU2NDFDXHU3RDIyXHU2ODQ2XG5cdCAqL1xuXHRyZW5kZXJTZWFyY2hCb3goKSB7XG5cdFx0Y29uc3Qgc2VhcmNoQ29udGFpbmVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnc2VhcmNoLWNvbnRhaW5lcicgfSk7XG5cblx0XHR0aGlzLnNlYXJjaElucHV0ID0gc2VhcmNoQ29udGFpbmVyLmNyZWF0ZUVsKCdpbnB1dCcsIHtcblx0XHRcdHR5cGU6ICd0ZXh0Jyxcblx0XHRcdGNsczogJ3NlYXJjaC1pbnB1dCcsXG5cdFx0XHRhdHRyOiB7XG5cdFx0XHRcdHBsYWNlaG9sZGVyOiB0aGlzLnBsdWdpbi50KCdzZWFyY2hQbGFjZWhvbGRlcicpLFxuXHRcdFx0XHR2YWx1ZTogdGhpcy5zZWFyY2hRdWVyeVxuXHRcdFx0fVxuXHRcdH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cblx0XHQvLyBcdTY0MUNcdTdEMjJcdTU2RkVcdTY4MDdcblx0XHRjb25zdCBzZWFyY2hJY29uID0gc2VhcmNoQ29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3NlYXJjaC1pY29uJyB9KTtcblx0XHRzZXRJY29uKHNlYXJjaEljb24sICdzZWFyY2gnKTtcblxuXHRcdC8vIFx1NkUwNVx1OTY2NFx1NjQxQ1x1N0QyMlx1NjMwOVx1OTRBRVxuXHRcdGlmICh0aGlzLnNlYXJjaFF1ZXJ5KSB7XG5cdFx0XHRjb25zdCBjbGVhckJ0biA9IHNlYXJjaENvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdjbGVhci1zZWFyY2gnIH0pO1xuXHRcdFx0c2V0SWNvbihjbGVhckJ0biwgJ3gnKTtcblx0XHRcdGNsZWFyQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0XHR0aGlzLnNlYXJjaFF1ZXJ5ID0gJyc7XG5cdFx0XHRcdHRoaXMuY3VycmVudFBhZ2UgPSAxO1xuXHRcdFx0XHR0aGlzLmFwcGx5U2VhcmNoKCk7XG5cdFx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU0RjdGXHU3NTI4XHU5NjMyXHU2Mjk2XHU1OTA0XHU3NDA2XHU2NDFDXHU3RDIyXHU4RjkzXHU1MTY1XG5cdFx0Y29uc3QgZGVib3VuY2VkU2VhcmNoID0gZGVib3VuY2UoKCkgPT4ge1xuXHRcdFx0dGhpcy5jdXJyZW50UGFnZSA9IDE7XG5cdFx0XHR0aGlzLmFwcGx5U2VhcmNoKCk7XG5cdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHR9LCAzMDApO1xuXG5cdFx0dGhpcy5zZWFyY2hJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIChlKSA9PiB7XG5cdFx0XHRjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXHRcdFx0dGhpcy5zZWFyY2hRdWVyeSA9IHRhcmdldC52YWx1ZTtcblx0XHRcdGRlYm91bmNlZFNlYXJjaCgpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU2NjNFXHU3OTNBXHU3RUQzXHU2NzlDXHU4QkExXHU2NTcwXG5cdFx0aWYgKHRoaXMuc2VhcmNoUXVlcnkpIHtcblx0XHRcdHNlYXJjaENvbnRhaW5lci5jcmVhdGVTcGFuKHtcblx0XHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnc2VhcmNoUmVzdWx0cycpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcodGhpcy5maWx0ZXJlZEltYWdlcy5sZW5ndGgpKSxcblx0XHRcdFx0Y2xzOiAnc2VhcmNoLXJlc3VsdHMtY291bnQnXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTMyXHU2N0QzXHU5MDA5XHU2MkU5XHU2QTIxXHU1RjBGXHU1REU1XHU1MTc3XHU2ODBGXG5cdCAqL1xuXHRyZW5kZXJTZWxlY3Rpb25Ub29sYmFyKCkge1xuXHRcdGNvbnN0IHRvb2xiYXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdzZWxlY3Rpb24tdG9vbGJhcicgfSk7XG5cblx0XHR0b29sYmFyLmNyZWF0ZVNwYW4oe1xuXHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnc2VsZWN0RmlsZXMnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKHRoaXMuc2VsZWN0ZWRGaWxlcy5zaXplKSksXG5cdFx0XHRjbHM6ICdzZWxlY3Rpb24tY291bnQnXG5cdFx0fSk7XG5cblx0XHRjb25zdCBzZWxlY3RBbGxCdG4gPSB0b29sYmFyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3Rvb2xiYXItYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKHNlbGVjdEFsbEJ0biwgJ2NoZWNrLXNxdWFyZScpO1xuXHRcdHNlbGVjdEFsbEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHRoaXMuZmlsdGVyZWRJbWFnZXMuZm9yRWFjaChpbWcgPT4gdGhpcy5zZWxlY3RlZEZpbGVzLmFkZChpbWcuZmlsZS5wYXRoKSk7XG5cdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IGRlc2VsZWN0QWxsQnRuID0gdG9vbGJhci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICd0b29sYmFyLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihkZXNlbGVjdEFsbEJ0biwgJ3NxdWFyZScpO1xuXHRcdGRlc2VsZWN0QWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5zZWxlY3RlZEZpbGVzLmNsZWFyKCk7XG5cdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IGRlbGV0ZVNlbGVjdGVkQnRuID0gdG9vbGJhci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICd0b29sYmFyLWJ1dHRvbiBkYW5nZXInIH0pO1xuXHRcdHNldEljb24oZGVsZXRlU2VsZWN0ZWRCdG4sICd0cmFzaC0yJyk7XG5cdFx0ZGVsZXRlU2VsZWN0ZWRCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGVkKCkpO1xuXG5cdFx0Ly8gXHU2NTc0XHU3NDA2XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3Qgb3JnYW5pemVCdG4gPSB0b29sYmFyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3Rvb2xiYXItYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKG9yZ2FuaXplQnRuLCAnZm9sZGVyLWlucHV0Jyk7XG5cdFx0b3JnYW5pemVCdG4udGl0bGUgPSB0aGlzLnBsdWdpbi50KCdvcmdhbml6aW5nJyk7XG5cdFx0b3JnYW5pemVCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLm9yZ2FuaXplU2VsZWN0ZWQoKSk7XG5cblx0XHQvLyBcdTUzOEJcdTdGMjlcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBwcm9jZXNzQnRuID0gdG9vbGJhci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICd0b29sYmFyLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihwcm9jZXNzQnRuLCAnaW1hZ2UtZG93bicpO1xuXHRcdHByb2Nlc3NCdG4udGl0bGUgPSB0aGlzLnBsdWdpbi50KCdwcm9jZXNzaW5nJyk7XG5cdFx0cHJvY2Vzc0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucHJvY2Vzc1NlbGVjdGVkKCkpO1xuXG5cdFx0Y29uc3QgZXhpdFNlbGVjdGlvbkJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idXR0b24nIH0pO1xuXHRcdHNldEljb24oZXhpdFNlbGVjdGlvbkJ0biwgJ3gnKTtcblx0XHRleGl0U2VsZWN0aW9uQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBmYWxzZTtcblx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5jbGVhcigpO1xuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTMyXHU2N0QzXHU1MjA2XHU5ODc1XHU2M0E3XHU0RUY2XG5cdCAqL1xuXHRyZW5kZXJQYWdpbmF0aW9uKCkge1xuXHRcdGNvbnN0IHRvdGFsUGFnZXMgPSBNYXRoLmNlaWwodGhpcy5maWx0ZXJlZEltYWdlcy5sZW5ndGggLyB0aGlzLnBhZ2VTaXplKTtcblx0XHRpZiAodG90YWxQYWdlcyA8PSAxKSByZXR1cm47XG5cblx0XHRjb25zdCBwYWdpbmF0aW9uID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAncGFnaW5hdGlvbicgfSk7XG5cblx0XHQvLyBcdTRFMEFcdTRFMDBcdTk4NzVcblx0XHRjb25zdCBwcmV2QnRuID0gcGFnaW5hdGlvbi5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdwYWdlLWJ1dHRvbicgfSk7XG5cdFx0cHJldkJ0bi50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnQoJ3ByZXZQYWdlJyk7XG5cdFx0cHJldkJ0bi5kaXNhYmxlZCA9IHRoaXMuY3VycmVudFBhZ2UgPD0gMTtcblx0XHRwcmV2QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuY3VycmVudFBhZ2UgPiAxKSB7XG5cdFx0XHRcdHRoaXMuY3VycmVudFBhZ2UtLTtcblx0XHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBcdTk4NzVcdTc4MDFcdTRGRTFcdTYwNkZcblx0XHRwYWdpbmF0aW9uLmNyZWF0ZVNwYW4oe1xuXHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgncGFnZUluZm8nKVxuXHRcdFx0XHQucmVwbGFjZSgne2N1cnJlbnR9JywgU3RyaW5nKHRoaXMuY3VycmVudFBhZ2UpKVxuXHRcdFx0XHQucmVwbGFjZSgne3RvdGFsfScsIFN0cmluZyh0b3RhbFBhZ2VzKSksXG5cdFx0XHRjbHM6ICdwYWdlLWluZm8nXG5cdFx0fSk7XG5cblx0XHQvLyBcdTRFMEJcdTRFMDBcdTk4NzVcblx0XHRjb25zdCBuZXh0QnRuID0gcGFnaW5hdGlvbi5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdwYWdlLWJ1dHRvbicgfSk7XG5cdFx0bmV4dEJ0bi50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnQoJ25leHRQYWdlJyk7XG5cdFx0bmV4dEJ0bi5kaXNhYmxlZCA9IHRoaXMuY3VycmVudFBhZ2UgPj0gdG90YWxQYWdlcztcblx0XHRuZXh0QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuY3VycmVudFBhZ2UgPCB0b3RhbFBhZ2VzKSB7XG5cdFx0XHRcdHRoaXMuY3VycmVudFBhZ2UrKztcblx0XHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBcdThERjNcdThGNkNcdTUyMzBcdTk4NzVcblx0XHRjb25zdCBqdW1wSW5wdXQgPSBwYWdpbmF0aW9uLmNyZWF0ZUVsKCdpbnB1dCcsIHtcblx0XHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdFx0Y2xzOiAncGFnZS1qdW1wLWlucHV0Jyxcblx0XHRcdGF0dHI6IHtcblx0XHRcdFx0bWluOiAnMScsXG5cdFx0XHRcdG1heDogU3RyaW5nKHRvdGFsUGFnZXMpLFxuXHRcdFx0XHR2YWx1ZTogU3RyaW5nKHRoaXMuY3VycmVudFBhZ2UpXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0anVtcElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlKSA9PiB7XG5cdFx0XHRjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXHRcdFx0bGV0IHBhZ2UgPSBwYXJzZUludCh0YXJnZXQudmFsdWUsIDEwKTtcblx0XHRcdGlmIChpc05hTihwYWdlKSkgcGFnZSA9IHRoaXMuY3VycmVudFBhZ2U7XG5cdFx0XHRwYWdlID0gTWF0aC5tYXgoMSwgTWF0aC5taW4ocGFnZSwgdG90YWxQYWdlcykpO1xuXHRcdFx0dGhpcy5jdXJyZW50UGFnZSA9IHBhZ2U7XG5cdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTUyMjBcdTk2NjRcdTkwMDlcdTRFMkRcdTc2ODRcdTY1ODdcdTRFRjZcblx0ICovXG5cdGFzeW5jIGRlbGV0ZVNlbGVjdGVkKCkge1xuXHRcdGlmICh0aGlzLnNlbGVjdGVkRmlsZXMuc2l6ZSA9PT0gMCkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdjb25maXJtRGVsZXRlU2VsZWN0ZWQnKS5yZXBsYWNlKCd7Y291bnR9JywgJzAnKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgY29uZmlybWVkID0gY29uZmlybShcblx0XHRcdHRoaXMucGx1Z2luLnQoJ2NvbmZpcm1EZWxldGVTZWxlY3RlZCcpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcodGhpcy5zZWxlY3RlZEZpbGVzLnNpemUpKVxuXHRcdCk7XG5cblx0XHRpZiAoY29uZmlybWVkKSB7XG5cdFx0XHRjb25zdCBmaWxlc1RvRGVsZXRlID0gdGhpcy5maWx0ZXJlZEltYWdlcy5maWx0ZXIoaW1nID0+XG5cdFx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5oYXMoaW1nLmZpbGUucGF0aClcblx0XHRcdCk7XG5cblx0XHRcdC8vIFx1NEY3Rlx1NzUyOCBQcm9taXNlLmFsbCBcdTVFNzZcdTUzRDFcdTU5MDRcdTc0MDZcdTUyMjBcdTk2NjRcblx0XHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcblx0XHRcdFx0ZmlsZXNUb0RlbGV0ZS5tYXAoaW1nID0+IHRoaXMucGx1Z2luLnNhZmVEZWxldGVGaWxlKGltZy5maWxlKSlcblx0XHRcdCk7XG5cblx0XHRcdC8vIFx1N0VERlx1OEJBMVx1NjIxMFx1NTI5Rlx1NTQ4Q1x1NTkzMVx1OEQyNVx1NzY4NFx1NjU3MFx1OTFDRlxuXHRcdFx0Y29uc3Qgc3VjY2Vzc0NvdW50ID0gcmVzdWx0cy5maWx0ZXIociA9PiByKS5sZW5ndGg7XG5cdFx0XHRjb25zdCBmYWlsQ291bnQgPSByZXN1bHRzLmZpbHRlcihyID0+ICFyKS5sZW5ndGg7XG5cblx0XHRcdGlmIChzdWNjZXNzQ291bnQgPiAwKSB7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZGVsZXRlZEZpbGVzJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhzdWNjZXNzQ291bnQpKSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZmFpbENvdW50ID4gMCkge1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2RlbGV0ZUZpbGVzRmFpbGVkJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhmYWlsQ291bnQpKSwgMzAwMCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5jbGVhcigpO1xuXHRcdFx0dGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBmYWxzZTtcblx0XHRcdGF3YWl0IHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdH1cblx0fVxuXG5cdHJlbmRlckhlYWRlcigpIHtcblx0XHRjb25zdCBoZWFkZXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1saWJyYXJ5LWhlYWRlcicgfSk7XG5cblx0XHRoZWFkZXIuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiB0aGlzLnBsdWdpbi50KCdtZWRpYUxpYnJhcnknKSB9KTtcblxuXHRcdGNvbnN0IHN0YXRzID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2ltYWdlLXN0YXRzJyB9KTtcblx0XHRzdGF0cy5jcmVhdGVTcGFuKHsgdGV4dDogdGhpcy5wbHVnaW4udCgndG90YWxNZWRpYUZpbGVzJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyh0aGlzLmZpbHRlcmVkSW1hZ2VzLmxlbmd0aCkpIH0pO1xuXG5cdFx0Ly8gXHU1MjM3XHU2NUIwXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgcmVmcmVzaEJ0biA9IGhlYWRlci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdyZWZyZXNoLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihyZWZyZXNoQnRuLCAncmVmcmVzaC1jdycpO1xuXHRcdHJlZnJlc2hCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnJlZnJlc2hJbWFnZXMoKSk7XG5cblx0XHQvLyBcdTU5MUFcdTkwMDlcdTZBMjFcdTVGMEZcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBzZWxlY3RCdG4gPSBoZWFkZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAncmVmcmVzaC1idXR0b24nIH0pO1xuXHRcdHNldEljb24oc2VsZWN0QnRuLCAnY2hlY2stc3F1YXJlJyk7XG5cdFx0c2VsZWN0QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5pc1NlbGVjdGlvbk1vZGUgPSAhdGhpcy5pc1NlbGVjdGlvbk1vZGU7XG5cdFx0XHRpZiAoIXRoaXMuaXNTZWxlY3Rpb25Nb2RlKSB7XG5cdFx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5jbGVhcigpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSk7XG5cdFx0c2VsZWN0QnRuLnRpdGxlID0gdGhpcy5wbHVnaW4udCgnbXVsdGlTZWxlY3RNb2RlJyk7XG5cblx0XHQvLyBcdTYzOTJcdTVFOEZcdTkwMDlcdTk4Nzlcblx0XHRjb25zdCBzb3J0U2VsZWN0ID0gaGVhZGVyLmNyZWF0ZUVsKCdzZWxlY3QnLCB7IGNsczogJ3NvcnQtc2VsZWN0JyB9KTtcblx0XHRjb25zdCBvcHRpb25zID0gW1xuXHRcdFx0eyB2YWx1ZTogJ25hbWUnLCB0ZXh0OiB0aGlzLnBsdWdpbi50KCdzb3J0QnlOYW1lJykgfSxcblx0XHRcdHsgdmFsdWU6ICdkYXRlJywgdGV4dDogdGhpcy5wbHVnaW4udCgnc29ydEJ5RGF0ZScpIH0sXG5cdFx0XHR7IHZhbHVlOiAnc2l6ZScsIHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NvcnRCeVNpemUnKSB9XG5cdFx0XTtcblx0XHRvcHRpb25zLmZvckVhY2gob3B0ID0+IHtcblx0XHRcdGNvbnN0IG9wdGlvbiA9IHNvcnRTZWxlY3QuY3JlYXRlRWwoJ29wdGlvbicsIHsgdmFsdWU6IG9wdC52YWx1ZSwgdGV4dDogb3B0LnRleHQgfSk7XG5cdFx0XHRpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3Muc29ydEJ5ID09PSBvcHQudmFsdWUpIHtcblx0XHRcdFx0b3B0aW9uLnNldEF0dHJpYnV0ZSgnc2VsZWN0ZWQnLCAnc2VsZWN0ZWQnKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRzb3J0U2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGFzeW5jIChlKSA9PiB7XG5cdFx0XHRjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MU2VsZWN0RWxlbWVudDtcblx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRCeSA9IHRhcmdldC52YWx1ZSBhcyAnbmFtZScgfCAnZGF0ZScgfCAnc2l6ZSc7XG5cdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdHRoaXMuc29ydEltYWdlcygpO1xuXHRcdFx0dGhpcy5jdXJyZW50UGFnZSA9IDE7IC8vIFx1NjM5Mlx1NUU4Rlx1NTNEOFx1NTMxNlx1NTQwRVx1OTFDRFx1N0Y2RVx1NTIzMFx1N0IyQ1x1NEUwMFx1OTg3NVxuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTk4N0FcdTVFOEZcdTUyMDdcdTYzNjJcblx0XHRjb25zdCBvcmRlckJ0biA9IGhlYWRlci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdvcmRlci1idXR0b24nIH0pO1xuXHRcdG9yZGVyQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuXHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3Muc29ydE9yZGVyID0gdGhpcy5wbHVnaW4uc2V0dGluZ3Muc29ydE9yZGVyID09PSAnYXNjJyA/ICdkZXNjJyA6ICdhc2MnO1xuXHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHR0aGlzLnNvcnRJbWFnZXMoKTtcblx0XHRcdHRoaXMuY3VycmVudFBhZ2UgPSAxOyAvLyBcdTYzOTJcdTVFOEZcdTk4N0FcdTVFOEZcdTUzRDhcdTUzMTZcdTU0MEVcdTkxQ0RcdTdGNkVcdTUyMzBcdTdCMkNcdTRFMDBcdTk4NzVcblx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdH0pO1xuXHRcdHNldEljb24ob3JkZXJCdG4sIHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRPcmRlciA9PT0gJ2FzYycgPyAnYXJyb3ctdXAnIDogJ2Fycm93LWRvd24nKTtcblx0fVxuXG5cdHNvcnRJbWFnZXMoKSB7XG5cdFx0Y29uc3QgeyBzb3J0QnksIHNvcnRPcmRlciB9ID0gdGhpcy5wbHVnaW4uc2V0dGluZ3M7XG5cdFx0Y29uc3QgbXVsdGlwbGllciA9IHNvcnRPcmRlciA9PT0gJ2FzYycgPyAxIDogLTE7XG5cblx0XHR0aGlzLmltYWdlcy5zb3J0KChhLCBiKSA9PiB7XG5cdFx0XHRzd2l0Y2ggKHNvcnRCeSkge1xuXHRcdFx0XHRjYXNlICduYW1lJzpcblx0XHRcdFx0XHRyZXR1cm4gbXVsdGlwbGllciAqIGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSk7XG5cdFx0XHRcdGNhc2UgJ2RhdGUnOlxuXHRcdFx0XHRcdHJldHVybiBtdWx0aXBsaWVyICogKGEubW9kaWZpZWQgLSBiLm1vZGlmaWVkKTtcblx0XHRcdFx0Y2FzZSAnc2l6ZSc6XG5cdFx0XHRcdFx0cmV0dXJuIG11bHRpcGxpZXIgKiAoYS5zaXplIC0gYi5zaXplKTtcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyOiBIVE1MRWxlbWVudCwgaWNvbk5hbWU6IHN0cmluZywgbGFiZWw6IHN0cmluZykge1xuXHRcdGNvbnRhaW5lci5lbXB0eSgpO1xuXG5cdFx0Y29uc3QgZmFsbGJhY2sgPSBjb250YWluZXIuY3JlYXRlRGl2KCk7XG5cdFx0ZmFsbGJhY2suc3R5bGUud2lkdGggPSAnMTAwJSc7XG5cdFx0ZmFsbGJhY2suc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG5cdFx0ZmFsbGJhY2suc3R5bGUuZmxleERpcmVjdGlvbiA9ICdjb2x1bW4nO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmFsaWduSXRlbXMgPSAnY2VudGVyJztcblx0XHRmYWxsYmFjay5zdHlsZS5qdXN0aWZ5Q29udGVudCA9ICdjZW50ZXInO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmdhcCA9ICc2cHgnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmNvbG9yID0gJ3ZhcigtLXRleHQtbXV0ZWQpJztcblxuXHRcdGNvbnN0IGljb25FbCA9IGZhbGxiYWNrLmNyZWF0ZURpdigpO1xuXHRcdHNldEljb24oaWNvbkVsLCBpY29uTmFtZSk7XG5cblx0XHRjb25zdCBsYWJlbEVsID0gZmFsbGJhY2suY3JlYXRlRGl2KHsgdGV4dDogbGFiZWwgfSk7XG5cdFx0bGFiZWxFbC5zdHlsZS5mb250U2l6ZSA9ICcwLjc1ZW0nO1xuXHRcdGxhYmVsRWwuc3R5bGUudGV4dFRyYW5zZm9ybSA9ICd1cHBlcmNhc2UnO1xuXHR9XG5cblx0cHJpdmF0ZSByZW5kZXJNZWRpYVRodW1ibmFpbChjb250YWluZXI6IEhUTUxFbGVtZW50LCBmaWxlOiBURmlsZSwgZGlzcGxheU5hbWU6IHN0cmluZykge1xuXHRcdGNvbnN0IG1lZGlhVHlwZSA9IGdldE1lZGlhVHlwZShmaWxlLm5hbWUpO1xuXHRcdGNvbnN0IHNyYyA9IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICdpbWFnZScpIHtcblx0XHRcdC8vIFx1NEYxOFx1NTE0OFx1NEVDRSBJbmRleGVkREIgXHU3RjEzXHU1QjU4XHU1MkEwXHU4RjdEXHU3RjI5XHU3NTY1XHU1NkZFXG5cdFx0XHR0aGlzLnJlbmRlckNhY2hlZFRodW1ibmFpbChjb250YWluZXIsIGZpbGUsIHNyYywgZGlzcGxheU5hbWUpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICd2aWRlbycpIHtcblx0XHRcdGNvbnN0IHZpZGVvID0gY29udGFpbmVyLmNyZWF0ZUVsKCd2aWRlbycpO1xuXHRcdFx0dmlkZW8uc3JjID0gc3JjO1xuXHRcdFx0dmlkZW8ubXV0ZWQgPSB0cnVlO1xuXHRcdFx0dmlkZW8ucHJlbG9hZCA9ICdtZXRhZGF0YSc7XG5cdFx0XHR2aWRlby5wbGF5c0lubGluZSA9IHRydWU7XG5cdFx0XHR2aWRlby5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0XHRcdHZpZGVvLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRcdHZpZGVvLnN0eWxlLm9iamVjdEZpdCA9ICdjb3Zlcic7XG5cdFx0XHR2aWRlby5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsICd2aWRlbycsICdWSURFTycpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKG1lZGlhVHlwZSA9PT0gJ2F1ZGlvJykge1xuXHRcdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsICdtdXNpYycsICdBVURJTycpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICdkb2N1bWVudCcpIHtcblx0XHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAnZmlsZS10ZXh0JywgJ1BERicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAnZmlsZScsICdGSUxFJyk7XG5cdH1cblxuXHQvKipcblx0ICogXHU0RjdGXHU3NTI4IEluZGV4ZWREQiBcdTdGMTNcdTVCNThcdTc2ODRcdTdGMjlcdTc1NjVcdTU2RkVcdTZFMzJcdTY3RDNcdTU2RkVcdTcyNDdcblx0ICogXHU3RjEzXHU1QjU4XHU1NDdEXHU0RTJEXHU2NUY2XHU3NkY0XHU2M0E1XHU3NTI4IEJsb2IgVVJMXHVGRjBDXHU1NDI2XHU1MjE5XHU0RjdGXHU3NTI4XHU1MzlGXHU1OUNCc3JjXHU1RTc2XHU1RjAyXHU2QjY1XHU3NTFGXHU2MjEwXHU3RjEzXHU1QjU4XG5cdCAqL1xuXHRwcml2YXRlIHJlbmRlckNhY2hlZFRodW1ibmFpbChjb250YWluZXI6IEhUTUxFbGVtZW50LCBmaWxlOiBURmlsZSwgc3JjOiBzdHJpbmcsIGRpc3BsYXlOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBjYWNoZSA9IHRoaXMucGx1Z2luLnRodW1ibmFpbENhY2hlO1xuXHRcdGNvbnN0IG10aW1lID0gZmlsZS5zdGF0Lm10aW1lO1xuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBIGltZyBcdTUxNDNcdTdEMjBcdUZGMDhcdTUxNDhcdTc1MjhcdTUzNjBcdTRGNERcdUZGMDlcblx0XHRjb25zdCBpbWcgPSBjb250YWluZXIuY3JlYXRlRWwoJ2ltZycsIHtcblx0XHRcdGF0dHI6IHsgYWx0OiBkaXNwbGF5TmFtZSB9XG5cdFx0fSk7XG5cdFx0aW1nLnN0eWxlLm9wYWNpdHkgPSAnMCc7XG5cdFx0aW1nLnN0eWxlLnRyYW5zaXRpb24gPSAnb3BhY2l0eSAwLjJzJztcblxuXHRcdGltZy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdGNvbnRhaW5lci5lbXB0eSgpO1xuXHRcdFx0Y29udGFpbmVyLmNyZWF0ZURpdih7XG5cdFx0XHRcdGNsczogJ2ltYWdlLWVycm9yJyxcblx0XHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnaW1hZ2VMb2FkRXJyb3InKVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBTVkcgXHU0RTBEXHU5NzAwXHU4OTgxXHU3RjEzXHU1QjU4XHU3RjI5XHU3NTY1XHU1NkZFXHUyMDE0XHUyMDE0XHU3NkY0XHU2M0E1XHU0RjdGXHU3NTI4XHU1MzlGXHU1OUNCXHU4REVGXHU1Rjg0XG5cdFx0aWYgKGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkgPT09ICdzdmcnKSB7XG5cdFx0XHRpbWcuc3JjID0gc3JjO1xuXHRcdFx0aW1nLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU1QzFEXHU4QkQ1XHU0RUNFXHU3RjEzXHU1QjU4XHU4M0I3XHU1M0Q2XG5cdFx0dm9pZCBjYWNoZS5nZXQoZmlsZS5wYXRoLCBtdGltZSkudGhlbihjYWNoZWRVcmwgPT4ge1xuXHRcdFx0aWYgKGNhY2hlZFVybCkge1xuXHRcdFx0XHRpbWcuc3JjID0gY2FjaGVkVXJsO1xuXHRcdFx0XHRpbWcuc3R5bGUub3BhY2l0eSA9ICcxJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFx1N0YxM1x1NUI1OFx1NjcyQVx1NTQ3RFx1NEUyRFx1RkYxQVx1NTE0OFx1NjYzRVx1NzkzQVx1NTM5Rlx1NTZGRVxuXHRcdFx0XHRpbWcuc3JjID0gc3JjO1xuXHRcdFx0XHRpbWcuc3R5bGUub3BhY2l0eSA9ICcxJztcblxuXHRcdFx0XHQvLyBcdTVGMDJcdTZCNjVcdTc1MUZcdTYyMTBcdTdGMjlcdTc1NjVcdTU2RkVcdTVFNzZcdTVCNThcdTUxNjVcdTdGMTNcdTVCNThcblx0XHRcdFx0dm9pZCBnZW5lcmF0ZVRodW1ibmFpbChzcmMsIDMwMCkudGhlbigoeyBibG9iLCB3aWR0aCwgaGVpZ2h0IH0pID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gY2FjaGUucHV0KGZpbGUucGF0aCwgbXRpbWUsIGJsb2IsIHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0XHR9KS5jYXRjaCgoKSA9PiB7XG5cdFx0XHRcdFx0Ly8gXHU3RjI5XHU3NTY1XHU1NkZFXHU3NTFGXHU2MjEwXHU1OTMxXHU4RDI1XHU0RTBEXHU1RjcxXHU1NENEXHU2NjNFXHU3OTNBXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmVuZGVySW1hZ2VJdGVtKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGltYWdlOiBJbWFnZUl0ZW0pIHtcblx0XHRjb25zdCBpdGVtID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ2ltYWdlLWl0ZW0nIH0pO1xuXG5cdFx0Ly8gXHU1OTgyXHU2NzlDXHU1NzI4XHU5MDA5XHU2MkU5XHU2QTIxXHU1RjBGXHU0RTBCXHVGRjBDXHU2REZCXHU1MkEwXHU1OTBEXHU5MDA5XHU2ODQ2XG5cdFx0aWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKSB7XG5cdFx0XHRjb25zdCBjaGVja2JveCA9IGl0ZW0uY3JlYXRlRWwoJ2lucHV0Jywge1xuXHRcdFx0XHR0eXBlOiAnY2hlY2tib3gnLFxuXHRcdFx0XHRjbHM6ICdpdGVtLWNoZWNrYm94J1xuXHRcdFx0fSk7XG5cdFx0XHRjaGVja2JveC5jaGVja2VkID0gdGhpcy5zZWxlY3RlZEZpbGVzLmhhcyhpbWFnZS5maWxlLnBhdGgpO1xuXHRcdFx0Y2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcblx0XHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHRcdFx0aWYgKHRhcmdldC5jaGVja2VkKSB7XG5cdFx0XHRcdFx0dGhpcy5zZWxlY3RlZEZpbGVzLmFkZChpbWFnZS5maWxlLnBhdGgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5kZWxldGUoaW1hZ2UuZmlsZS5wYXRoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBXHU1NkZFXHU3MjQ3XHU1QkI5XHU1NjY4XG5cdFx0Y29uc3QgaW1nQ29udGFpbmVyID0gaXRlbS5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1jb250YWluZXInIH0pO1xuXG5cdFx0Y29uc3QgZmlsZSA9IGltYWdlLmZpbGU7XG5cdFx0dGhpcy5yZW5kZXJNZWRpYVRodW1ibmFpbChpbWdDb250YWluZXIsIGZpbGUsIGltYWdlLm5hbWUpO1xuXG5cdFx0aW1nQ29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKSB7XG5cdFx0XHRcdC8vIFx1NTcyOFx1OTAwOVx1NjJFOVx1NkEyMVx1NUYwRlx1NEUwQlx1RkYwQ1x1NzBCOVx1NTFGQlx1NTIwN1x1NjM2Mlx1OTAwOVx1NjJFOVx1NzJCNlx1NjAwMVxuXHRcdFx0XHRpZiAodGhpcy5zZWxlY3RlZEZpbGVzLmhhcyhpbWFnZS5maWxlLnBhdGgpKSB7XG5cdFx0XHRcdFx0dGhpcy5zZWxlY3RlZEZpbGVzLmRlbGV0ZShpbWFnZS5maWxlLnBhdGgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5hZGQoaW1hZ2UuZmlsZS5wYXRoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFx1NTcyOFx1NjY2RVx1OTAxQVx1NkEyMVx1NUYwRlx1NEUwQlx1RkYwQ1x1NjI1M1x1NUYwMFx1OTg4NFx1ODlDOFxuXHRcdFx0XHR0aGlzLnBsdWdpbi5vcGVuTWVkaWFQcmV2aWV3KGltYWdlLmZpbGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU1M0YzXHU5NTJFXHU4M0RDXHU1MzU1XG5cdFx0aXRlbS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIChlKSA9PiB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLnNob3dDb250ZXh0TWVudShlIGFzIE1vdXNlRXZlbnQsIGZpbGUpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU2NjNFXHU3OTNBXHU1NkZFXHU3MjQ3XHU0RkUxXHU2MDZGXG5cdFx0aWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dJbWFnZUluZm8pIHtcblx0XHRcdGNvbnN0IGluZm8gPSBpdGVtLmNyZWF0ZURpdih7IGNsczogJ2ltYWdlLWluZm8nIH0pO1xuXHRcdFx0aW5mby5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1uYW1lJywgdGV4dDogaW1hZ2UubmFtZSB9KTtcblx0XHRcdGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaW1hZ2Utc2l6ZScsIHRleHQ6IGZvcm1hdEZpbGVTaXplKGltYWdlLnNpemUpIH0pO1xuXHRcdH1cblx0fVxuXG5cdHNob3dDb250ZXh0TWVudShldmVudDogTW91c2VFdmVudCwgZmlsZTogVEZpbGUpIHtcblx0XHRjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnb3BlbkluTm90ZXMnKSlcblx0XHRcdFx0LnNldEljb24oJ3NlYXJjaCcpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5vcGVuSW1hZ2VJbk5vdGVzKGZpbGUpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnY29weVBhdGgnKSlcblx0XHRcdFx0LnNldEljb24oJ2xpbmsnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChmaWxlLnBhdGgpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdwYXRoQ29waWVkJykpO1xuXHRcdFx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdjb3B5TGluaycpKVxuXHRcdFx0XHQuc2V0SWNvbignY29weScpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBsaW5rID0gYFtbJHtmaWxlLm5hbWV9XV1gO1xuXHRcdFx0XHRcdHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobGluaykudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2xpbmtDb3BpZWQnKSk7XG5cdFx0XHRcdFx0fSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdcdTU5MERcdTUyMzZcdTUyMzBcdTUyNkFcdThEMzRcdTY3N0ZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdlcnJvcicpKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRpdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ29wZW5PcmlnaW5hbCcpKVxuXHRcdFx0XHQuc2V0SWNvbignZXh0ZXJuYWwtbGluaycpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBzcmMgPSB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cdFx0XHRcdFx0d2luZG93Lm9wZW4oc3JjLCAnX2JsYW5rJywgJ25vb3BlbmVyLG5vcmVmZXJyZXInKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTRFQzVcdTU2RkVcdTcyNDdcdTY2M0VcdTc5M0FcdTU5MDRcdTc0MDZcdTkwMDlcdTk4Nzlcblx0XHRpZiAoZ2V0TWVkaWFUeXBlKGZpbGUubmFtZSkgPT09ICdpbWFnZScpIHtcblx0XHRcdG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cblx0XHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdvcmdhbml6aW5nJykpXG5cdFx0XHRcdFx0LnNldEljb24oJ2ZvbGRlci1pbnB1dCcpXG5cdFx0XHRcdFx0Lm9uQ2xpY2soKCkgPT4gdGhpcy5vcmdhbml6ZUZpbGUoZmlsZSkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh0aGlzLmlzUHJvY2Vzc2FibGVJbWFnZShmaWxlKSkge1xuXHRcdFx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdwcm9jZXNzaW5nJykpXG5cdFx0XHRcdFx0XHQuc2V0SWNvbignaW1hZ2UtZG93bicpXG5cdFx0XHRcdFx0XHQub25DbGljaygoKSA9PiB0aGlzLnByb2Nlc3NGaWxlKGZpbGUpKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bWVudS5zaG93QXRQb3NpdGlvbih7IHg6IGV2ZW50LmNsaWVudFgsIHk6IGV2ZW50LmNsaWVudFkgfSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2MzA5XHU4OUM0XHU1MjE5XHU2NTc0XHU3NDA2XHU1MzU1XHU0RTJBXHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIG9yZ2FuaXplRmlsZShmaWxlOiBURmlsZSkge1xuXHRcdGNvbnN0IHJ1bGVzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3JnYW5pemVSdWxlcztcblx0XHRjb25zdCBydWxlID0gZmluZE1hdGNoaW5nUnVsZShydWxlcywgZmlsZSk7XG5cdFx0aWYgKCFydWxlKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ25vTWF0Y2hpbmdGaWxlcycpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBjdHggPSBhd2FpdCB0aGlzLmJ1aWxkT3JnYW5pemVDb250ZXh0KGZpbGUpO1xuXHRcdGNvbnN0IHRhcmdldCA9IGNvbXB1dGVUYXJnZXQocnVsZSwgY3R4KTtcblxuXHRcdGlmICh0YXJnZXQubmV3UGF0aCA9PT0gZmlsZS5wYXRoKSByZXR1cm47XG5cblx0XHRhd2FpdCB0aGlzLnBsdWdpbi5lbnN1cmVGb2xkZXJFeGlzdHModGFyZ2V0Lm5ld1BhdGguc3Vic3RyaW5nKDAsIHRhcmdldC5uZXdQYXRoLmxhc3RJbmRleE9mKCcvJykpKTtcblx0XHRhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIHRhcmdldC5uZXdQYXRoKTtcblx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ29yZ2FuaXplQ29tcGxldGUnLCB7IGNvdW50OiAxIH0pKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYyNzlcdTkxQ0ZcdTY1NzRcdTc0MDZcdTkwMDlcdTRFMkRcdTY1ODdcdTRFRjZcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgb3JnYW5pemVTZWxlY3RlZCgpIHtcblx0XHRpZiAodGhpcy5zZWxlY3RlZEZpbGVzLnNpemUgPT09IDApIHJldHVybjtcblxuXHRcdGNvbnN0IHJ1bGVzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3JnYW5pemVSdWxlcztcblx0XHRsZXQgb3JnYW5pemVkQ291bnQgPSAwO1xuXG5cdFx0Zm9yIChjb25zdCBwYXRoIG9mIHRoaXMuc2VsZWN0ZWRGaWxlcykge1xuXHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblx0XHRcdGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBydWxlID0gZmluZE1hdGNoaW5nUnVsZShydWxlcywgZmlsZSk7XG5cdFx0XHRpZiAoIXJ1bGUpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBjdHggPSBhd2FpdCB0aGlzLmJ1aWxkT3JnYW5pemVDb250ZXh0KGZpbGUpO1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gY29tcHV0ZVRhcmdldChydWxlLCBjdHgpO1xuXG5cdFx0XHRpZiAodGFyZ2V0Lm5ld1BhdGggPT09IGZpbGUucGF0aCkgY29udGludWU7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLmVuc3VyZUZvbGRlckV4aXN0cyh0YXJnZXQubmV3UGF0aC5zdWJzdHJpbmcoMCwgdGFyZ2V0Lm5ld1BhdGgubGFzdEluZGV4T2YoJy8nKSkpO1xuXHRcdFx0XHRhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIHRhcmdldC5uZXdQYXRoKTtcblx0XHRcdFx0b3JnYW5pemVkQ291bnQrKztcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgXHU2NTc0XHU3NDA2XHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OiAke2ZpbGUubmFtZX1gLCBlcnJvcik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdvcmdhbml6ZUNvbXBsZXRlJywgeyBjb3VudDogb3JnYW5pemVkQ291bnQgfSkpO1xuXHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5jbGVhcigpO1xuXHRcdHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0gZmFsc2U7XG5cdFx0YXdhaXQgdGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2Nzg0XHU1RUZBXHU2NTc0XHU3NDA2XHU0RTBBXHU0RTBCXHU2NTg3XHVGRjA4XHU1MzA1XHU1NDJCIEVYSUYgXHU4OUUzXHU2NzkwXHVGRjA5XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGJ1aWxkT3JnYW5pemVDb250ZXh0KGZpbGU6IFRGaWxlKTogUHJvbWlzZTxPcmdhbml6ZUNvbnRleHQ+IHtcblx0XHRjb25zdCBkYXRlID0gbmV3IERhdGUoZmlsZS5zdGF0Lm10aW1lKTtcblx0XHRjb25zdCBjdHg6IE9yZ2FuaXplQ29udGV4dCA9IHsgZmlsZSwgZGF0ZSB9O1xuXG5cdFx0Ly8gXHU1QzFEXHU4QkQ1XHU4OUUzXHU2NzkwIEVYSUZcdUZGMDhcdTRFQzUgSlBFR1x1RkYwOVxuXHRcdGNvbnN0IGV4dCA9IGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKGV4dCA9PT0gJ2pwZycgfHwgZXh0ID09PSAnanBlZycpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWRCaW5hcnkoZmlsZSk7XG5cdFx0XHRcdGN0eC5leGlmID0gcGFyc2VFeGlmKGJ1ZmZlcik7XG5cdFx0XHR9IGNhdGNoIHsgLyogRVhJRiBcdTg5RTNcdTY3OTBcdTU5MzFcdThEMjVcdTRFMERcdTVGNzFcdTU0Q0RcdTY1NzRcdTc0MDYgKi8gfVxuXHRcdH1cblxuXHRcdHJldHVybiBjdHg7XG5cdH1cblxuXHRwcml2YXRlIGdldFByb2Nlc3NTZXR0aW5ncygpIHtcblx0XHRjb25zdCBzZXR0aW5ncyA9IHRoaXMucGx1Z2luLnNldHRpbmdzO1xuXHRcdHJldHVybiB7XG5cdFx0XHRxdWFsaXR5OiBzZXR0aW5ncy5kZWZhdWx0UHJvY2Vzc1F1YWxpdHksXG5cdFx0XHRmb3JtYXQ6IHNldHRpbmdzLmRlZmF1bHRQcm9jZXNzRm9ybWF0LFxuXHRcdFx0d2F0ZXJtYXJrOiBzZXR0aW5ncy53YXRlcm1hcmtUZXh0ID8ge1xuXHRcdFx0XHR0ZXh0OiBzZXR0aW5ncy53YXRlcm1hcmtUZXh0LFxuXHRcdFx0XHRwb3NpdGlvbjogJ2JvdHRvbS1yaWdodCcgYXMgY29uc3QsXG5cdFx0XHRcdG9wYWNpdHk6IDAuNVxuXHRcdFx0fSA6IHVuZGVmaW5lZFxuXHRcdH07XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHByb2Nlc3NBbmRSZXBsYWNlRmlsZShmaWxlOiBURmlsZSk6IFByb21pc2U8e1xuXHRcdGJhc2VOYW1lOiBzdHJpbmc7XG5cdFx0b3JpZ2luYWxTaXplOiBudW1iZXI7XG5cdFx0bmV3U2l6ZTogbnVtYmVyO1xuXHR9PiB7XG5cdFx0Y29uc3Qgc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdGNvbnN0IG9yaWdpbmFsU2l6ZSA9IGZpbGUuc3RhdC5zaXplO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHByb2Nlc3NJbWFnZShzcmMsIG9yaWdpbmFsU2l6ZSwgdGhpcy5nZXRQcm9jZXNzU2V0dGluZ3MoKSk7XG5cdFx0Y29uc3QgbmV3RXh0ID0gZ2V0Rm9ybWF0RXh0ZW5zaW9uKHJlc3VsdC5mb3JtYXQpO1xuXHRcdGNvbnN0IGJhc2VOYW1lID0gZmlsZS5uYW1lLnJlcGxhY2UoL1xcLlteLl0rJC8sICcnKTtcblx0XHRjb25zdCBuZXdQYXRoID0gZmlsZS5wYXJlbnRcblx0XHRcdD8gYCR7ZmlsZS5wYXJlbnQucGF0aH0vJHtiYXNlTmFtZX0ke25ld0V4dH1gXG5cdFx0XHQ6IGAke2Jhc2VOYW1lfSR7bmV3RXh0fWA7XG5cdFx0Y29uc3QgYXJyYXlCdWZmZXIgPSBhd2FpdCByZXN1bHQuYmxvYi5hcnJheUJ1ZmZlcigpO1xuXG5cdFx0aWYgKG5ld1BhdGggPT09IGZpbGUucGF0aCkge1xuXHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5QmluYXJ5KGZpbGUsIGFycmF5QnVmZmVyKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGJhc2VOYW1lLFxuXHRcdFx0XHRvcmlnaW5hbFNpemUsXG5cdFx0XHRcdG5ld1NpemU6IHJlc3VsdC5uZXdTaXplXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5ld1BhdGgpO1xuXHRcdGlmIChleGlzdGluZyAmJiBleGlzdGluZy5wYXRoICE9PSBmaWxlLnBhdGgpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcih0aGlzLnBsdWdpbi50KCd0YXJnZXRGaWxlRXhpc3RzJykpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9yaWdpbmFsQnVmZmVyID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZEJpbmFyeShmaWxlKTtcblxuXHRcdC8vIFx1NTE0OFx1NTE5OVx1NTE2NVx1OEY2Q1x1NjM2Mlx1NTQwRVx1NzY4NFx1NTE4NVx1NUJCOVx1RkYwQ1x1OTA3Rlx1NTE0RCByZW5hbWUgXHU2NzFGXHU5NUY0XHU1MUZBXHU3M0IwXHU2MjY5XHU1QzU1XHU1NDBEXHU1NDhDXHU1QjlFXHU5NjQ1XHU1QjU3XHU4MjgyXHU2ODNDXHU1RjBGXHU0RTBEXHU0RTAwXHU4MUY0XHUzMDAyXG5cdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5QmluYXJ5KGZpbGUsIGFycmF5QnVmZmVyKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIG5ld1BhdGgpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnlCaW5hcnkoZmlsZSwgb3JpZ2luYWxCdWZmZXIpO1xuXHRcdFx0fSBjYXRjaCAocm9sbGJhY2tFcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBcdTU2REVcdTZFREFcdTU5MDRcdTc0MDZcdTU0MEVcdTc2ODRcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6ICR7ZmlsZS5uYW1lfWAsIHJvbGxiYWNrRXJyb3IpO1xuXHRcdFx0fVxuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGJhc2VOYW1lLFxuXHRcdFx0b3JpZ2luYWxTaXplLFxuXHRcdFx0bmV3U2l6ZTogcmVzdWx0Lm5ld1NpemVcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIENhbnZhcyBcdTU5MDRcdTc0MDZcdTUzNTVcdTRFMkFcdTY1ODdcdTRFRjZcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcHJvY2Vzc0ZpbGUoZmlsZTogVEZpbGUpIHtcblx0XHRpZiAoIXRoaXMuaXNQcm9jZXNzYWJsZUltYWdlKGZpbGUpKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3Vuc3VwcG9ydGVkRmlsZVR5cGUnKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHsgYmFzZU5hbWUsIG9yaWdpbmFsU2l6ZSwgbmV3U2l6ZSB9ID0gYXdhaXQgdGhpcy5wcm9jZXNzQW5kUmVwbGFjZUZpbGUoZmlsZSk7XG5cdFx0XHRjb25zdCBzYXZlZCA9IE1hdGgubWF4KDAsIG9yaWdpbmFsU2l6ZSAtIG5ld1NpemUpO1xuXHRcdFx0bmV3IE5vdGljZShgXHUyNzA1ICR7YmFzZU5hbWV9OiAke2Zvcm1hdEZpbGVTaXplKG9yaWdpbmFsU2l6ZSl9IFx1MjE5MiAke2Zvcm1hdEZpbGVTaXplKG5ld1NpemUpfSAoXHU4MjgyXHU3NzAxICR7Zm9ybWF0RmlsZVNpemUoc2F2ZWQpfSlgKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihgXHU1OTA0XHU3NDA2XHU1OTMxXHU4RDI1OiAke2ZpbGUubmFtZX1gLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykgKyBgOiAke2ZpbGUubmFtZX1gKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2Mjc5XHU5MUNGIENhbnZhcyBcdTU5MDRcdTc0MDZcdTkwMDlcdTRFMkRcdTY1ODdcdTRFRjZcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcHJvY2Vzc1NlbGVjdGVkKCkge1xuXHRcdGlmICh0aGlzLnNlbGVjdGVkRmlsZXMuc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXG5cdFx0bGV0IHByb2Nlc3NlZCA9IDA7XG5cdFx0bGV0IHNraXBwZWQgPSAwO1xuXHRcdGxldCB0b3RhbFNhdmVkID0gMDtcblxuXHRcdGZvciAoY29uc3QgcGF0aCBvZiB0aGlzLnNlbGVjdGVkRmlsZXMpIHtcblx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG5cdFx0XHRpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcblx0XHRcdGlmICghdGhpcy5pc1Byb2Nlc3NhYmxlSW1hZ2UoZmlsZSkpIHtcblx0XHRcdFx0c2tpcHBlZCsrO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgeyBvcmlnaW5hbFNpemUsIG5ld1NpemUgfSA9IGF3YWl0IHRoaXMucHJvY2Vzc0FuZFJlcGxhY2VGaWxlKGZpbGUpO1xuXHRcdFx0XHRwcm9jZXNzZWQrKztcblx0XHRcdFx0dG90YWxTYXZlZCArPSBNYXRoLm1heCgwLCBvcmlnaW5hbFNpemUgLSBuZXdTaXplKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgXHU1OTA0XHU3NDA2XHU1OTMxXHU4RDI1OiAke3BhdGh9YCwgZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IHN1ZmZpeCA9IHNraXBwZWQgPiAwID8gYFx1RkYwQ1x1OERGM1x1OEZDNyAke3NraXBwZWR9IFx1NEUyQVx1NEUwRFx1NjUyRlx1NjMwMVx1NzY4NFx1NjU4N1x1NEVGNmAgOiAnJztcblx0XHRuZXcgTm90aWNlKGBcdTI3MDUgXHU1OTA0XHU3NDA2XHU1QjhDXHU2MjEwOiAke3Byb2Nlc3NlZH0gXHU0RTJBXHU2NTg3XHU0RUY2XHVGRjBDXHU4MjgyXHU3NzAxICR7Zm9ybWF0RmlsZVNpemUodG90YWxTYXZlZCl9JHtzdWZmaXh9YCk7XG5cdFx0dGhpcy5zZWxlY3RlZEZpbGVzLmNsZWFyKCk7XG5cdFx0dGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBmYWxzZTtcblx0XHRhd2FpdCB0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0fVxuXG5cdC8vIFx1NURGMlx1NzlGQlx1OTY2NCBmb3JtYXRGaWxlU2l6ZSBcdTY1QjlcdTZDRDVcdUZGMENcdTRGN0ZcdTc1MjggdXRpbHMvZm9ybWF0LnRzIFx1NEUyRFx1NzY4NFx1NUI5RVx1NzNCMFxufVxuIiwgIi8qKlxuICogXHU5MDFBXHU3NTI4XHU1REU1XHU1MTc3XHU1MUZEXHU2NTcwXHU2QTIxXHU1NzU3XG4gKi9cblxuLyoqXG4gKiBcdTY4M0NcdTVGMEZcdTUzMTZcdTY1ODdcdTRFRjZcdTU5MjdcdTVDMEZcbiAqIEBwYXJhbSBieXRlcyBcdTVCNTdcdTgyODJcdTY1NzBcbiAqIEByZXR1cm5zIFx1NjgzQ1x1NUYwRlx1NTMxNlx1NTQwRVx1NzY4NFx1NTkyN1x1NUMwRlx1NUI1N1x1N0IyNlx1NEUzMlx1RkYwQ1x1NTk4MiBcIjEuNSBNQlwiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRGaWxlU2l6ZShieXRlczogbnVtYmVyKTogc3RyaW5nIHtcblx0aWYgKCFOdW1iZXIuaXNGaW5pdGUoYnl0ZXMpIHx8IGJ5dGVzIDw9IDApIHJldHVybiAnMCBCJztcblx0Y29uc3QgayA9IDEwMjQ7XG5cdGNvbnN0IHNpemVzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJ107XG5cdGNvbnN0IGkgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihNYXRoLmZsb29yKE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKGspKSwgc2l6ZXMubGVuZ3RoIC0gMSkpO1xuXHRyZXR1cm4gcGFyc2VGbG9hdCgoYnl0ZXMgLyBNYXRoLnBvdyhrLCBpKSkudG9GaXhlZCgyKSkgKyAnICcgKyBzaXplc1tpXTtcbn1cblxuLyoqXG4gKiBcdTk2MzJcdTYyOTZcdTUxRkRcdTY1NzBcbiAqIEBwYXJhbSBmbiBcdTg5ODFcdTYyNjdcdTg4NENcdTc2ODRcdTUxRkRcdTY1NzBcbiAqIEBwYXJhbSBkZWxheSBcdTVFRjZcdThGREZcdTY1RjZcdTk1RjRcdUZGMDhcdTZCRUJcdTc5RDJcdUZGMDlcbiAqIEByZXR1cm5zIFx1OTYzMlx1NjI5Nlx1NTkwNFx1NzQwNlx1NTQwRVx1NzY4NFx1NTFGRFx1NjU3MFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVib3VuY2U8VCBleHRlbmRzICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24+KFxuXHRmbjogVCxcblx0ZGVsYXk6IG51bWJlclxuKTogKC4uLmFyZ3M6IFBhcmFtZXRlcnM8VD4pID0+IHZvaWQge1xuXHRsZXQgdGltZW91dElkOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xuXG5cdHJldHVybiAoLi4uYXJnczogUGFyYW1ldGVyczxUPikgPT4ge1xuXHRcdGlmICh0aW1lb3V0SWQpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuXHRcdH1cblx0XHR0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGZuKC4uLmFyZ3MpO1xuXHRcdH0sIGRlbGF5KTtcblx0fTtcbn1cbiIsICIvKipcbiAqIFx1OERFRlx1NUY4NFx1NURFNVx1NTE3N1x1NTFGRFx1NjU3MFxuICogT2JzaWRpYW4gXHU1MTg1XHU5MEU4XHU4REVGXHU1Rjg0XHU3RURGXHU0RTAwXHU0RjdGXHU3NTI4IFwiL1wiXHVGRjBDXHU4RkQ5XHU5MUNDXHU5NkM2XHU0RTJEXHU1MDVBXHU4REU4XHU1RTczXHU1M0YwXHU4OUM0XHU4MzAzXHU1MzE2XG4gKi9cblxuLyoqXG4gKiBcdTg5QzRcdTgzMDNcdTUzMTYgVmF1bHQgXHU3NkY4XHU1QkY5XHU4REVGXHU1Rjg0XG4gKiAtIFx1N0VERlx1NEUwMFx1NTIwNlx1OTY5NFx1N0IyNlx1NEUzQSBcIi9cIlxuICogLSBcdTUzQkJcdTYzODlcdTk5OTZcdTVDM0VcdTdBN0FcdTc2N0RcbiAqIC0gXHU1M0JCXHU2Mzg5XHU5MUNEXHU1OTBEXHU1MjA2XHU5Njk0XHU3QjI2XHUzMDAxXHU1MjREXHU1QkZDIFwiLi9cIlx1MzAwMVx1NjcyQlx1NUMzRSBcIi9cIlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVmF1bHRQYXRoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJykgcmV0dXJuICcnO1xuXG5cdGxldCBub3JtYWxpemVkID0gaW5wdXQudHJpbSgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblx0bm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQucmVwbGFjZSgvXFwvezIsfS9nLCAnLycpO1xuXHRub3JtYWxpemVkID0gbm9ybWFsaXplZC5yZXBsYWNlKC9eXFwvKy8sICcnKTtcblxuXHR3aGlsZSAobm9ybWFsaXplZC5zdGFydHNXaXRoKCcuLycpKSB7XG5cdFx0bm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQuc2xpY2UoMik7XG5cdH1cblxuXHRub3JtYWxpemVkID0gbm9ybWFsaXplZC5yZXBsYWNlKC9cXC8rJC8sICcnKTtcblx0cmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU4REVGXHU1Rjg0XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XHU1NDBEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGaWxlTmFtZUZyb21QYXRoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplVmF1bHRQYXRoKGlucHV0KTtcblx0aWYgKCFub3JtYWxpemVkKSByZXR1cm4gJyc7XG5cdGNvbnN0IHBhcnRzID0gbm9ybWFsaXplZC5zcGxpdCgnLycpO1xuXHRyZXR1cm4gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gfHwgJyc7XG59XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU4REVGXHU1Rjg0XHU0RTJEXHU3Njg0XHU3MjM2XHU3NkVFXHU1RjU1XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRQYXRoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplVmF1bHRQYXRoKGlucHV0KTtcblx0aWYgKCFub3JtYWxpemVkKSByZXR1cm4gJyc7XG5cdGNvbnN0IGlkeCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoJy8nKTtcblx0cmV0dXJuIGlkeCA9PT0gLTEgPyAnJyA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgaWR4KTtcbn1cblxuLyoqXG4gKiBcdTVCODlcdTUxNjhcdTg5RTNcdTc4MDEgVVJJIFx1NzI0N1x1NkJCNVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FmZURlY29kZVVSSUNvbXBvbmVudChpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGlucHV0KTtcblx0fSBjYXRjaCB7XG5cdFx0cmV0dXJuIGlucHV0O1xuXHR9XG59XG4iLCAiLyoqXG4gKiBcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEJcdTYyNjlcdTVDNTVcdTU0MERcdTdFREZcdTRFMDBcdTdCQTFcdTc0MDZcbiAqIFx1OTZDNlx1NEUyRFx1N0JBMVx1NzQwNlx1NjI0MFx1NjcwOVx1NjUyRlx1NjMwMVx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1NjI2OVx1NUM1NVx1NTQwRFx1RkYwQ1x1NEZCRlx1NEU4RVx1N0VGNFx1NjJBNFx1NTQ4Q1x1NjI2OVx1NUM1NVxuICovXG5cbi8qKlxuICogXHU1NkZFXHU3MjQ3XHU2MjY5XHU1QzU1XHU1NDBEXG4gKi9cbmV4cG9ydCBjb25zdCBJTUFHRV9FWFRFTlNJT05TID0gWycucG5nJywgJy5qcGcnLCAnLmpwZWcnLCAnLmdpZicsICcud2VicCcsICcuc3ZnJywgJy5ibXAnXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTg5QzZcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGNvbnN0IFZJREVPX0VYVEVOU0lPTlMgPSBbJy5tcDQnLCAnLm1vdicsICcuYXZpJywgJy5ta3YnLCAnLndlYm0nXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTk3RjNcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGNvbnN0IEFVRElPX0VYVEVOU0lPTlMgPSBbJy5tcDMnLCAnLndhdicsICcub2dnJywgJy5tNGEnLCAnLmZsYWMnXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTY1ODdcdTY4NjNcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGNvbnN0IERPQ1VNRU5UX0VYVEVOU0lPTlMgPSBbJy5wZGYnXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTU2RkVcdTcyNDdcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IElNQUdFX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5JTUFHRV9FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTg5QzZcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IFZJREVPX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5WSURFT19FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTk3RjNcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IEFVRElPX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5BVURJT19FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTY1ODdcdTY4NjNcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IERPQ1VNRU5UX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5ET0NVTUVOVF9FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTVBOTJcdTRGNTNcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IEFMTF9NRURJQV9FWFRFTlNJT05TOiBzdHJpbmdbXSA9IFtcblx0Li4uSU1BR0VfRVhURU5TSU9OU19TVFIsXG5cdC4uLlZJREVPX0VYVEVOU0lPTlNfU1RSLFxuXHQuLi5BVURJT19FWFRFTlNJT05TX1NUUixcblx0Li4uRE9DVU1FTlRfRVhURU5TSU9OU19TVFJcbl07XG5cbi8qKlxuICogXHU2MjY5XHU1QzU1XHU1NDBEXHU1MjMwXHU1QTkyXHU0RjUzXHU3QzdCXHU1NzhCXHU3Njg0XHU2NjIwXHU1QzA0XG4gKi9cbmV4cG9ydCBjb25zdCBFWFRFTlNJT05fVE9fVFlQRTogUmVjb3JkPHN0cmluZywgJ2ltYWdlJyB8ICd2aWRlbycgfCAnYXVkaW8nIHwgJ2RvY3VtZW50Jz4gPSB7XG5cdC8vIFx1NTZGRVx1NzI0N1xuXHQnLnBuZyc6ICdpbWFnZScsXG5cdCcuanBnJzogJ2ltYWdlJyxcblx0Jy5qcGVnJzogJ2ltYWdlJyxcblx0Jy5naWYnOiAnaW1hZ2UnLFxuXHQnLndlYnAnOiAnaW1hZ2UnLFxuXHQnLnN2Zyc6ICdpbWFnZScsXG5cdCcuYm1wJzogJ2ltYWdlJyxcblx0Ly8gXHU4OUM2XHU5ODkxXG5cdCcubXA0JzogJ3ZpZGVvJyxcblx0Jy5tb3YnOiAndmlkZW8nLFxuXHQnLmF2aSc6ICd2aWRlbycsXG5cdCcubWt2JzogJ3ZpZGVvJyxcblx0Jy53ZWJtJzogJ3ZpZGVvJyxcblx0Ly8gXHU5N0YzXHU5ODkxXG5cdCcubXAzJzogJ2F1ZGlvJyxcblx0Jy53YXYnOiAnYXVkaW8nLFxuXHQnLm9nZyc6ICdhdWRpbycsXG5cdCcubTRhJzogJ2F1ZGlvJyxcblx0Jy5mbGFjJzogJ2F1ZGlvJyxcblx0Ly8gXHU2NTg3XHU2ODYzXG5cdCcucGRmJzogJ2RvY3VtZW50J1xufTtcblxuLyoqXG4gKiBcdTgzQjdcdTUzRDZcdTY1ODdcdTRFRjZcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVDMEZcdTUxOTlcdUZGMDlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEZpbGVFeHRlbnNpb24oZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG5cdGNvbnN0IGxhc3REb3QgPSBmaWxlbmFtZS5sYXN0SW5kZXhPZignLicpO1xuXHRpZiAobGFzdERvdCA9PT0gLTEpIHJldHVybiAnJztcblx0cmV0dXJuIGZpbGVuYW1lLnN1YnN0cmluZyhsYXN0RG90KS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIFx1NjgzOVx1NjM2RVx1NjI2OVx1NUM1NVx1NTQwRFx1ODNCN1x1NTNENlx1NUE5Mlx1NEY1M1x1N0M3Qlx1NTc4QlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWVkaWFUeXBlKGZpbGVuYW1lOiBzdHJpbmcpOiAnaW1hZ2UnIHwgJ3ZpZGVvJyB8ICdhdWRpbycgfCAnZG9jdW1lbnQnIHwgbnVsbCB7XG5cdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZW5hbWUpO1xuXHRyZXR1cm4gRVhURU5TSU9OX1RPX1RZUEVbZXh0XSB8fCBudWxsO1xufVxuXG4vKipcbiAqIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NEUzQVx1NTZGRVx1NzI0N1x1NjU4N1x1NEVGNlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbWFnZUZpbGUoZmlsZW5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRjb25zdCBleHQgPSBnZXRGaWxlRXh0ZW5zaW9uKGZpbGVuYW1lKTtcblx0cmV0dXJuIElNQUdFX0VYVEVOU0lPTlNfU1RSLmluY2x1ZGVzKGV4dCk7XG59XG5cbi8qKlxuICogXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU0RTNBXHU4OUM2XHU5ODkxXHU2NTg3XHU0RUY2XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1ZpZGVvRmlsZShmaWxlbmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG5cdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZW5hbWUpO1xuXHRyZXR1cm4gVklERU9fRVhURU5TSU9OU19TVFIuaW5jbHVkZXMoZXh0KTtcbn1cblxuLyoqXG4gKiBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTRFM0FcdTk3RjNcdTk4OTFcdTY1ODdcdTRFRjZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQXVkaW9GaWxlKGZpbGVuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcblx0Y29uc3QgZXh0ID0gZ2V0RmlsZUV4dGVuc2lvbihmaWxlbmFtZSk7XG5cdHJldHVybiBBVURJT19FWFRFTlNJT05TX1NUUi5pbmNsdWRlcyhleHQpO1xufVxuXG4vKipcbiAqIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NEUzQVx1NjU4N1x1Njg2M1x1NjU4N1x1NEVGNlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEb2N1bWVudEZpbGUoZmlsZW5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRjb25zdCBleHQgPSBnZXRGaWxlRXh0ZW5zaW9uKGZpbGVuYW1lKTtcblx0cmV0dXJuIERPQ1VNRU5UX0VYVEVOU0lPTlNfU1RSLmluY2x1ZGVzKGV4dCk7XG59XG5cbi8qKlxuICogXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU0RTNBXHU2NTJGXHU2MzAxXHU3Njg0XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01lZGlhRmlsZShmaWxlbmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG5cdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZW5hbWUpO1xuXHRyZXR1cm4gQUxMX01FRElBX0VYVEVOU0lPTlMuaW5jbHVkZXMoZXh0KTtcbn1cblxuLyoqXG4gKiBcdTY4MzlcdTYzNkVcdThCQkVcdTdGNkVcdTgzQjdcdTUzRDZcdTU0MkZcdTc1MjhcdTc2ODRcdTVBOTJcdTRGNTNcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEVuYWJsZWRFeHRlbnNpb25zKHNldHRpbmdzOiB7XG5cdGVuYWJsZUltYWdlcz86IGJvb2xlYW47XG5cdGVuYWJsZVZpZGVvcz86IGJvb2xlYW47XG5cdGVuYWJsZUF1ZGlvPzogYm9vbGVhbjtcblx0ZW5hYmxlUERGPzogYm9vbGVhbjtcbn0pOiBzdHJpbmdbXSB7XG5cdGNvbnN0IGV4dGVuc2lvbnM6IHN0cmluZ1tdID0gW107XG5cblx0aWYgKHNldHRpbmdzLmVuYWJsZUltYWdlcyAhPT0gZmFsc2UpIHtcblx0XHRleHRlbnNpb25zLnB1c2goLi4uSU1BR0VfRVhURU5TSU9OU19TVFIpO1xuXHR9XG5cdGlmIChzZXR0aW5ncy5lbmFibGVWaWRlb3MgIT09IGZhbHNlKSB7XG5cdFx0ZXh0ZW5zaW9ucy5wdXNoKC4uLlZJREVPX0VYVEVOU0lPTlNfU1RSKTtcblx0fVxuXHRpZiAoc2V0dGluZ3MuZW5hYmxlQXVkaW8gIT09IGZhbHNlKSB7XG5cdFx0ZXh0ZW5zaW9ucy5wdXNoKC4uLkFVRElPX0VYVEVOU0lPTlNfU1RSKTtcblx0fVxuXHRpZiAoc2V0dGluZ3MuZW5hYmxlUERGICE9PSBmYWxzZSkge1xuXHRcdGV4dGVuc2lvbnMucHVzaCguLi5ET0NVTUVOVF9FWFRFTlNJT05TX1NUUik7XG5cdH1cblxuXHRyZXR1cm4gZXh0ZW5zaW9ucztcbn1cbiIsICIvKipcbiAqIEluZGV4ZWREQiBcdTdGMjlcdTc1NjVcdTU2RkVcdTYzMDFcdTRFNDVcdTdGMTNcdTVCNThcbiAqIFx1N0YxM1x1NUI1OFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1NzY4NFx1N0YyOVx1NzU2NVx1NTZGRSBCbG9iXHVGRjBDXHU5MDdGXHU1MTREXHU2QkNGXHU2QjIxXHU2MjUzXHU1RjAwXHU4OUM2XHU1NkZFXHU5MUNEXHU2NUIwXHU3NTFGXHU2MjEwXG4gKi9cblxuY29uc3QgREJfTkFNRSA9ICdvYnNpZGlhbi1tZWRpYS10b29sa2l0LXRodW1icyc7XG5jb25zdCBEQl9WRVJTSU9OID0gMTtcbmNvbnN0IFNUT1JFX05BTUUgPSAndGh1bWJuYWlscyc7XG5cbmludGVyZmFjZSBUaHVtYm5haWxFbnRyeSB7XG5cdHBhdGg6IHN0cmluZztcblx0bXRpbWU6IG51bWJlcjtcblx0YmxvYjogQmxvYjtcblx0d2lkdGg6IG51bWJlcjtcblx0aGVpZ2h0OiBudW1iZXI7XG5cdGNyZWF0ZWRBdDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgVGh1bWJuYWlsQ2FjaGUge1xuXHRwcml2YXRlIGRiOiBJREJEYXRhYmFzZSB8IG51bGwgPSBudWxsO1xuXHRwcml2YXRlIG1heEVudHJpZXM6IG51bWJlcjtcblx0cHJpdmF0ZSBtZW1vcnlDYWNoZTogTWFwPHN0cmluZywgeyBtdGltZTogbnVtYmVyOyB1cmw6IHN0cmluZyB9PiA9IG5ldyBNYXAoKTtcblxuXHRjb25zdHJ1Y3RvcihtYXhFbnRyaWVzOiBudW1iZXIgPSA1MDAwKSB7XG5cdFx0dGhpcy5tYXhFbnRyaWVzID0gbWF4RW50cmllcztcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYyNTNcdTVGMDAgSW5kZXhlZERCIFx1OEZERVx1NjNBNVxuXHQgKi9cblx0YXN5bmMgb3BlbigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRpZiAodGhpcy5kYikgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGNvbnN0IHJlcXVlc3QgPSBpbmRleGVkREIub3BlbihEQl9OQU1FLCBEQl9WRVJTSU9OKTtcblxuXHRcdFx0cmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSAoZXZlbnQpID0+IHtcblx0XHRcdFx0Y29uc3QgZGIgPSAoZXZlbnQudGFyZ2V0IGFzIElEQk9wZW5EQlJlcXVlc3QpLnJlc3VsdDtcblx0XHRcdFx0aWYgKCFkYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKFNUT1JFX05BTUUpKSB7XG5cdFx0XHRcdFx0Y29uc3Qgc3RvcmUgPSBkYi5jcmVhdGVPYmplY3RTdG9yZShTVE9SRV9OQU1FLCB7IGtleVBhdGg6ICdwYXRoJyB9KTtcblx0XHRcdFx0XHRzdG9yZS5jcmVhdGVJbmRleCgnY3JlYXRlZEF0JywgJ2NyZWF0ZWRBdCcsIHsgdW5pcXVlOiBmYWxzZSB9KTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0cmVxdWVzdC5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcblx0XHRcdFx0dGhpcy5kYiA9IChldmVudC50YXJnZXQgYXMgSURCT3BlbkRCUmVxdWVzdCkucmVzdWx0O1xuXHRcdFx0XHRyZXNvbHZlKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRyZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUud2FybignVGh1bWJuYWlsQ2FjaGU6IEZhaWxlZCB0byBvcGVuIEluZGV4ZWREQiwgcnVubmluZyB3aXRob3V0IGNhY2hlJyk7XG5cdFx0XHRcdHJlc29sdmUoKTsgLy8gXHU0RTBEXHU5NjNCXHU1ODVFXHVGRjBDXHU2NUUwXHU3RjEzXHU1QjU4XHU2QTIxXHU1RjBGXHU3RUU3XHU3RUVEXHU4RkQwXHU4ODRDXG5cdFx0XHR9O1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTE3M1x1OTVFRCBJbmRleGVkREIgXHU4RkRFXHU2M0E1XHVGRjBDXHU5MUNBXHU2NTNFXHU1MTg1XHU1QjU4XHU0RTJEXHU3Njg0IE9iamVjdCBVUkxcblx0ICovXG5cdGNsb3NlKCk6IHZvaWQge1xuXHRcdC8vIFx1OTFDQVx1NjUzRVx1NjI0MFx1NjcwOVx1NTE4NVx1NUI1OFx1NEUyRFx1NzY4NCBPYmplY3QgVVJMXG5cdFx0Zm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLm1lbW9yeUNhY2hlLnZhbHVlcygpKSB7XG5cdFx0XHRVUkwucmV2b2tlT2JqZWN0VVJMKGVudHJ5LnVybCk7XG5cdFx0fVxuXHRcdHRoaXMubWVtb3J5Q2FjaGUuY2xlYXIoKTtcblxuXHRcdGlmICh0aGlzLmRiKSB7XG5cdFx0XHR0aGlzLmRiLmNsb3NlKCk7XG5cdFx0XHR0aGlzLmRiID0gbnVsbDtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU4M0I3XHU1M0Q2XHU3RjEzXHU1QjU4XHU3Njg0XHU3RjI5XHU3NTY1XHU1NkZFIE9iamVjdCBVUkxcblx0ICogXHU0RUM1XHU1RjUzXHU4REVGXHU1Rjg0XHU1MzM5XHU5MTREXHU0RTE0IG10aW1lIFx1NjcyQVx1NTNEOFx1NjVGNlx1OEZENFx1NTZERVx1N0YxM1x1NUI1OFxuXHQgKi9cblx0YXN5bmMgZ2V0KHBhdGg6IHN0cmluZywgbXRpbWU6IG51bWJlcik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuXHRcdC8vIFx1NTE0OFx1NjdFNVx1NTE4NVx1NUI1OFx1N0YxM1x1NUI1OFxuXHRcdGNvbnN0IG1lbUVudHJ5ID0gdGhpcy5tZW1vcnlDYWNoZS5nZXQocGF0aCk7XG5cdFx0aWYgKG1lbUVudHJ5ICYmIG1lbUVudHJ5Lm10aW1lID09PSBtdGltZSkge1xuXHRcdFx0cmV0dXJuIG1lbUVudHJ5LnVybDtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuZGIpIHJldHVybiBudWxsO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRjb25zdCB0eCA9IHRoaXMuZGIhLnRyYW5zYWN0aW9uKFNUT1JFX05BTUUsICdyZWFkb25seScpO1xuXHRcdFx0Y29uc3Qgc3RvcmUgPSB0eC5vYmplY3RTdG9yZShTVE9SRV9OQU1FKTtcblx0XHRcdGNvbnN0IHJlcXVlc3QgPSBzdG9yZS5nZXQocGF0aCk7XG5cblx0XHRcdHJlcXVlc3Qub25zdWNjZXNzID0gKCkgPT4ge1xuXHRcdFx0XHRjb25zdCBlbnRyeSA9IHJlcXVlc3QucmVzdWx0IGFzIFRodW1ibmFpbEVudHJ5IHwgdW5kZWZpbmVkO1xuXHRcdFx0XHRpZiAoZW50cnkgJiYgZW50cnkubXRpbWUgPT09IG10aW1lKSB7XG5cdFx0XHRcdFx0Y29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChlbnRyeS5ibG9iKTtcblx0XHRcdFx0XHR0aGlzLm1lbW9yeUNhY2hlLnNldChwYXRoLCB7IG10aW1lLCB1cmwgfSk7XG5cdFx0XHRcdFx0cmVzb2x2ZSh1cmwpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlc29sdmUobnVsbCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlc29sdmUobnVsbCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1QjU4XHU1MTY1XHU3RjI5XHU3NTY1XHU1NkZFXHU3RjEzXHU1QjU4XG5cdCAqL1xuXHRhc3luYyBwdXQocGF0aDogc3RyaW5nLCBtdGltZTogbnVtYmVyLCBibG9iOiBCbG9iLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuXHRcdC8vIFx1NjZGNFx1NjVCMFx1NTE4NVx1NUI1OFx1N0YxM1x1NUI1OFxuXHRcdGNvbnN0IG9sZEVudHJ5ID0gdGhpcy5tZW1vcnlDYWNoZS5nZXQocGF0aCk7XG5cdFx0aWYgKG9sZEVudHJ5KSB7XG5cdFx0XHRVUkwucmV2b2tlT2JqZWN0VVJMKG9sZEVudHJ5LnVybCk7XG5cdFx0fVxuXHRcdGNvbnN0IHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0dGhpcy5tZW1vcnlDYWNoZS5zZXQocGF0aCwgeyBtdGltZSwgdXJsIH0pO1xuXG5cdFx0aWYgKCF0aGlzLmRiKSByZXR1cm47XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGNvbnN0IHR4ID0gdGhpcy5kYiEudHJhbnNhY3Rpb24oU1RPUkVfTkFNRSwgJ3JlYWR3cml0ZScpO1xuXHRcdFx0Y29uc3Qgc3RvcmUgPSB0eC5vYmplY3RTdG9yZShTVE9SRV9OQU1FKTtcblxuXHRcdFx0Y29uc3QgZW50cnk6IFRodW1ibmFpbEVudHJ5ID0ge1xuXHRcdFx0XHRwYXRoLFxuXHRcdFx0XHRtdGltZSxcblx0XHRcdFx0YmxvYixcblx0XHRcdFx0d2lkdGgsXG5cdFx0XHRcdGhlaWdodCxcblx0XHRcdFx0Y3JlYXRlZEF0OiBEYXRlLm5vdygpXG5cdFx0XHR9O1xuXG5cdFx0XHRzdG9yZS5wdXQoZW50cnkpO1xuXHRcdFx0dHgub25jb21wbGV0ZSA9ICgpID0+IHtcblx0XHRcdFx0dGhpcy5ldmljdElmTmVlZGVkKCk7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH07XG5cdFx0XHR0eC5vbmVycm9yID0gKCkgPT4gcmVzb2x2ZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTIyMFx1OTY2NFx1NjMwN1x1NUI5QVx1OERFRlx1NUY4NFx1NzY4NFx1N0YxM1x1NUI1OFxuXHQgKi9cblx0YXN5bmMgZGVsZXRlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG1lbUVudHJ5ID0gdGhpcy5tZW1vcnlDYWNoZS5nZXQocGF0aCk7XG5cdFx0aWYgKG1lbUVudHJ5KSB7XG5cdFx0XHRVUkwucmV2b2tlT2JqZWN0VVJMKG1lbUVudHJ5LnVybCk7XG5cdFx0XHR0aGlzLm1lbW9yeUNhY2hlLmRlbGV0ZShwYXRoKTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuZGIpIHJldHVybjtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Y29uc3QgdHggPSB0aGlzLmRiIS50cmFuc2FjdGlvbihTVE9SRV9OQU1FLCAncmVhZHdyaXRlJyk7XG5cdFx0XHR0eC5vYmplY3RTdG9yZShTVE9SRV9OQU1FKS5kZWxldGUocGF0aCk7XG5cdFx0XHR0eC5vbmNvbXBsZXRlID0gKCkgPT4gcmVzb2x2ZSgpO1xuXHRcdFx0dHgub25lcnJvciA9ICgpID0+IHJlc29sdmUoKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMDVcdTdBN0FcdTYyNDBcdTY3MDlcdTdGMTNcdTVCNThcblx0ICovXG5cdGFzeW5jIGNsZWFyKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGZvciAoY29uc3QgZW50cnkgb2YgdGhpcy5tZW1vcnlDYWNoZS52YWx1ZXMoKSkge1xuXHRcdFx0VVJMLnJldm9rZU9iamVjdFVSTChlbnRyeS51cmwpO1xuXHRcdH1cblx0XHR0aGlzLm1lbW9yeUNhY2hlLmNsZWFyKCk7XG5cblx0XHRpZiAoIXRoaXMuZGIpIHJldHVybjtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Y29uc3QgdHggPSB0aGlzLmRiIS50cmFuc2FjdGlvbihTVE9SRV9OQU1FLCAncmVhZHdyaXRlJyk7XG5cdFx0XHR0eC5vYmplY3RTdG9yZShTVE9SRV9OQU1FKS5jbGVhcigpO1xuXHRcdFx0dHgub25jb21wbGV0ZSA9ICgpID0+IHJlc29sdmUoKTtcblx0XHRcdHR4Lm9uZXJyb3IgPSAoKSA9PiByZXNvbHZlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU5MUNEXHU1NDdEXHU1NDBEXHU4REVGXHU1Rjg0XHU3Njg0XHU3RjEzXHU1QjU4XHU2NzYxXHU3NkVFXHVGRjA4XHU2NTg3XHU0RUY2XHU5MUNEXHU1NDdEXHU1NDBEXHU2NUY2XHU4QzAzXHU3NTI4XHVGRjA5XG5cdCAqL1xuXHRhc3luYyByZW5hbWUob2xkUGF0aDogc3RyaW5nLCBuZXdQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBtZW1FbnRyeSA9IHRoaXMubWVtb3J5Q2FjaGUuZ2V0KG9sZFBhdGgpO1xuXHRcdGlmIChtZW1FbnRyeSkge1xuXHRcdFx0dGhpcy5tZW1vcnlDYWNoZS5kZWxldGUob2xkUGF0aCk7XG5cdFx0XHR0aGlzLm1lbW9yeUNhY2hlLnNldChuZXdQYXRoLCBtZW1FbnRyeSk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLmRiKSByZXR1cm47XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGNvbnN0IHR4ID0gdGhpcy5kYiEudHJhbnNhY3Rpb24oU1RPUkVfTkFNRSwgJ3JlYWR3cml0ZScpO1xuXHRcdFx0Y29uc3Qgc3RvcmUgPSB0eC5vYmplY3RTdG9yZShTVE9SRV9OQU1FKTtcblx0XHRcdGNvbnN0IGdldFJlcSA9IHN0b3JlLmdldChvbGRQYXRoKTtcblxuXHRcdFx0Z2V0UmVxLm9uc3VjY2VzcyA9ICgpID0+IHtcblx0XHRcdFx0Y29uc3QgZW50cnkgPSBnZXRSZXEucmVzdWx0IGFzIFRodW1ibmFpbEVudHJ5IHwgdW5kZWZpbmVkO1xuXHRcdFx0XHRpZiAoZW50cnkpIHtcblx0XHRcdFx0XHRzdG9yZS5kZWxldGUob2xkUGF0aCk7XG5cdFx0XHRcdFx0ZW50cnkucGF0aCA9IG5ld1BhdGg7XG5cdFx0XHRcdFx0c3RvcmUucHV0KGVudHJ5KTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0dHgub25jb21wbGV0ZSA9ICgpID0+IHJlc29sdmUoKTtcblx0XHRcdHR4Lm9uZXJyb3IgPSAoKSA9PiByZXNvbHZlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogTFJVIFx1NkREOFx1NkM3MFx1RkYxQVx1OEQ4NVx1OEZDN1x1NjcwMFx1NTkyN1x1Njc2MVx1NzZFRVx1NjU3MFx1NjVGNlx1NTIyMFx1OTY2NFx1NjcwMFx1NjVFN1x1NzY4NFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBldmljdElmTmVlZGVkKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICghdGhpcy5kYikgcmV0dXJuO1xuXG5cdFx0Y29uc3QgdHggPSB0aGlzLmRiLnRyYW5zYWN0aW9uKFNUT1JFX05BTUUsICdyZWFkb25seScpO1xuXHRcdGNvbnN0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoU1RPUkVfTkFNRSk7XG5cdFx0Y29uc3QgY291bnRSZXEgPSBzdG9yZS5jb3VudCgpO1xuXG5cdFx0Y291bnRSZXEub25zdWNjZXNzID0gKCkgPT4ge1xuXHRcdFx0Y29uc3QgY291bnQgPSBjb3VudFJlcS5yZXN1bHQ7XG5cdFx0XHRpZiAoY291bnQgPD0gdGhpcy5tYXhFbnRyaWVzKSByZXR1cm47XG5cblx0XHRcdGNvbnN0IGV2aWN0Q291bnQgPSBjb3VudCAtIHRoaXMubWF4RW50cmllcztcblx0XHRcdGNvbnN0IGV2aWN0VHggPSB0aGlzLmRiIS50cmFuc2FjdGlvbihTVE9SRV9OQU1FLCAncmVhZHdyaXRlJyk7XG5cdFx0XHRjb25zdCBldmljdFN0b3JlID0gZXZpY3RUeC5vYmplY3RTdG9yZShTVE9SRV9OQU1FKTtcblx0XHRcdGNvbnN0IGluZGV4ID0gZXZpY3RTdG9yZS5pbmRleCgnY3JlYXRlZEF0Jyk7XG5cdFx0XHRjb25zdCBjdXJzb3IgPSBpbmRleC5vcGVuQ3Vyc29yKCk7XG5cdFx0XHRsZXQgZGVsZXRlZCA9IDA7XG5cblx0XHRcdGN1cnNvci5vbnN1Y2Nlc3MgPSAoZXZlbnQpID0+IHtcblx0XHRcdFx0Y29uc3QgYyA9IChldmVudC50YXJnZXQgYXMgSURCUmVxdWVzdDxJREJDdXJzb3JXaXRoVmFsdWUgfCBudWxsPikucmVzdWx0O1xuXHRcdFx0XHRpZiAoYyAmJiBkZWxldGVkIDwgZXZpY3RDb3VudCkge1xuXHRcdFx0XHRcdGNvbnN0IHBhdGggPSAoYy52YWx1ZSBhcyBUaHVtYm5haWxFbnRyeSkucGF0aDtcblx0XHRcdFx0XHRjb25zdCBtZW1FbnRyeSA9IHRoaXMubWVtb3J5Q2FjaGUuZ2V0KHBhdGgpO1xuXHRcdFx0XHRcdGlmIChtZW1FbnRyeSkge1xuXHRcdFx0XHRcdFx0VVJMLnJldm9rZU9iamVjdFVSTChtZW1FbnRyeS51cmwpO1xuXHRcdFx0XHRcdFx0dGhpcy5tZW1vcnlDYWNoZS5kZWxldGUocGF0aCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGMuZGVsZXRlKCk7XG5cdFx0XHRcdFx0ZGVsZXRlZCsrO1xuXHRcdFx0XHRcdGMuY29udGludWUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9O1xuXHR9XG59XG5cbi8qKlxuICogXHU3NTI4IENhbnZhcyBcdTc1MUZcdTYyMTBcdTdGMjlcdTc1NjVcdTU2RkUgQmxvYlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVUaHVtYm5haWwoXG5cdGltYWdlU3JjOiBzdHJpbmcsXG5cdG1heFNpemU6IG51bWJlciA9IDIwMFxuKTogUHJvbWlzZTx7IGJsb2I6IEJsb2I7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0+IHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRpbWcuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcblxuXHRcdGltZy5vbmxvYWQgPSAoKSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCB7IHdpZHRoOiBvcmlnVywgaGVpZ2h0OiBvcmlnSCB9ID0gaW1nO1xuXHRcdFx0XHRsZXQgdGFyZ2V0VyA9IG9yaWdXO1xuXHRcdFx0XHRsZXQgdGFyZ2V0SCA9IG9yaWdIO1xuXG5cdFx0XHRcdGlmIChvcmlnVyA+IG1heFNpemUgfHwgb3JpZ0ggPiBtYXhTaXplKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmF0aW8gPSBNYXRoLm1pbihtYXhTaXplIC8gb3JpZ1csIG1heFNpemUgLyBvcmlnSCk7XG5cdFx0XHRcdFx0dGFyZ2V0VyA9IE1hdGgucm91bmQob3JpZ1cgKiByYXRpbyk7XG5cdFx0XHRcdFx0dGFyZ2V0SCA9IE1hdGgucm91bmQob3JpZ0ggKiByYXRpbyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdFx0Y2FudmFzLndpZHRoID0gdGFyZ2V0Vztcblx0XHRcdFx0Y2FudmFzLmhlaWdodCA9IHRhcmdldEg7XG5cblx0XHRcdFx0Y29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0XHRcdGlmICghY3R4KSB7XG5cdFx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcignQ2Fubm90IGdldCBjYW52YXMgY29udGV4dCcpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgdGFyZ2V0VywgdGFyZ2V0SCk7XG5cblx0XHRcdFx0Y2FudmFzLnRvQmxvYihcblx0XHRcdFx0XHQoYmxvYikgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGJsb2IpIHtcblx0XHRcdFx0XHRcdFx0cmVzb2x2ZSh7IGJsb2IsIHdpZHRoOiB0YXJnZXRXLCBoZWlnaHQ6IHRhcmdldEggfSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyZWplY3QobmV3IEVycm9yKCdDYW52YXMgdG9CbG9iIHJldHVybmVkIG51bGwnKSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQnaW1hZ2Uvd2VicCcsXG5cdFx0XHRcdFx0MC43XG5cdFx0XHRcdCk7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRpbWcub25lcnJvciA9ICgpID0+IHJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBsb2FkIGltYWdlOiAke2ltYWdlU3JjfWApKTtcblx0XHRpbWcuc3JjID0gaW1hZ2VTcmM7XG5cdH0pO1xufVxuIiwgIi8qKlxuICogXHU3RUFGIEpTIEVYSUYgXHU4OUUzXHU2NzkwXHU1NjY4XG4gKiBcdTRFQ0UgSlBFRyBcdTY1ODdcdTRFRjZcdTc2ODQgQVBQMSBcdTZCQjVcdTRFMkRcdTg5RTNcdTY3OTAgVElGRiBJRkRcdUZGMENcdTYzRDBcdTUzRDZcdTUxNzNcdTk1MkUgRVhJRiBcdTRGRTFcdTYwNkZcbiAqIFx1NjVFMFx1NTkxNlx1OTBFOFx1NEY5RFx1OEQ1NlxuICovXG5cbmV4cG9ydCBpbnRlcmZhY2UgRXhpZkRhdGEge1xuXHRkYXRlVGltZU9yaWdpbmFsPzogc3RyaW5nOyAgLy8gWVlZWTpNTTpERCBISDptbTpzc1xuXHRtYWtlPzogc3RyaW5nOyAgICAgICAgICAgICAvLyBcdTc2RjhcdTY3M0FcdTU0QzFcdTcyNENcblx0bW9kZWw/OiBzdHJpbmc7ICAgICAgICAgICAgLy8gXHU3NkY4XHU2NzNBXHU1NzhCXHU1M0Y3XG5cdGltYWdlV2lkdGg/OiBudW1iZXI7XG5cdGltYWdlSGVpZ2h0PzogbnVtYmVyO1xuXHRvcmllbnRhdGlvbj86IG51bWJlcjtcbn1cblxuLy8gRVhJRiB0YWcgSURzXG5jb25zdCBUQUdfREFURV9USU1FX09SSUdJTkFMID0gMHg5MDAzO1xuY29uc3QgVEFHX01BS0UgPSAweDAxMEY7XG5jb25zdCBUQUdfTU9ERUwgPSAweDAxMTA7XG5jb25zdCBUQUdfSU1BR0VfV0lEVEggPSAweEEwMDI7XG5jb25zdCBUQUdfSU1BR0VfSEVJR0hUID0gMHhBMDAzO1xuY29uc3QgVEFHX09SSUVOVEFUSU9OID0gMHgwMTEyO1xuY29uc3QgVEFHX0VYSUZfSUZEID0gMHg4NzY5O1xuXG4vKipcbiAqIFx1NEVDRSBBcnJheUJ1ZmZlciBcdTg5RTNcdTY3OTAgRVhJRiBcdTY1NzBcdTYzNkVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRXhpZihidWZmZXI6IEFycmF5QnVmZmVyKTogRXhpZkRhdGEge1xuXHRjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG5cdGNvbnN0IHJlc3VsdDogRXhpZkRhdGEgPSB7fTtcblxuXHQvLyBcdTY4QzBcdTY3RTUgSlBFRyBTT0kgXHU2ODA3XHU4QkIwXG5cdGlmICh2aWV3LmdldFVpbnQxNigwKSAhPT0gMHhGRkQ4KSB7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdGxldCBvZmZzZXQgPSAyO1xuXHRjb25zdCBsZW5ndGggPSBNYXRoLm1pbihidWZmZXIuYnl0ZUxlbmd0aCwgNjU1MzYpOyAvLyBcdTUzRUFcdTYyNkJcdTYzQ0ZcdTUyNEQgNjRLQlxuXG5cdHdoaWxlIChvZmZzZXQgPCBsZW5ndGgpIHtcblx0XHRpZiAodmlldy5nZXRVaW50OChvZmZzZXQpICE9PSAweEZGKSBicmVhaztcblxuXHRcdGNvbnN0IG1hcmtlciA9IHZpZXcuZ2V0VWludDgob2Zmc2V0ICsgMSk7XG5cdFx0b2Zmc2V0ICs9IDI7XG5cblx0XHQvLyBBUFAxIFx1NkJCNVx1RkYwOEVYSUYgXHU2NTcwXHU2MzZFXHVGRjA5XG5cdFx0aWYgKG1hcmtlciA9PT0gMHhFMSkge1xuXHRcdFx0Y29uc3Qgc2VnbWVudExlbmd0aCA9IHZpZXcuZ2V0VWludDE2KG9mZnNldCk7XG5cblx0XHRcdC8vIFx1NjhDMFx1NjdFNSBcIkV4aWZcXDBcXDBcIiBcdTY4MDdcdThCQzZcblx0XHRcdGlmIChzZWdtZW50TGVuZ3RoID4gOCAmJlxuXHRcdFx0XHR2aWV3LmdldFVpbnQzMihvZmZzZXQgKyAyKSA9PT0gMHg0NTc4Njk2NiAmJiAvLyBcIkV4aWZcIlxuXHRcdFx0XHR2aWV3LmdldFVpbnQxNihvZmZzZXQgKyA2KSA9PT0gMHgwMDAwKSB7XG5cblx0XHRcdFx0Y29uc3QgdGlmZk9mZnNldCA9IG9mZnNldCArIDg7XG5cdFx0XHRcdHBhcnNlVGlmZih2aWV3LCB0aWZmT2Zmc2V0LCByZXN1bHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH1cblxuXHRcdC8vIFx1NTE3Nlx1NEVENlx1NkJCNVx1RkYxQVx1OERGM1x1OEZDN1xuXHRcdGlmIChtYXJrZXIgPj0gMHhFMCAmJiBtYXJrZXIgPD0gMHhFRiB8fCBtYXJrZXIgPT09IDB4RkUpIHtcblx0XHRcdGNvbnN0IHNlZ21lbnRMZW5ndGggPSB2aWV3LmdldFVpbnQxNihvZmZzZXQpO1xuXHRcdFx0b2Zmc2V0ICs9IHNlZ21lbnRMZW5ndGg7XG5cdFx0fSBlbHNlIGlmIChtYXJrZXIgPT09IDB4REEpIHtcblx0XHRcdC8vIFNPUyBcdTY4MDdcdThCQjBcdUZGMENcdTRFMERcdTUxOERcdTY3MDkgRVhJRlxuXHRcdFx0YnJlYWs7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIFx1NUMxRFx1OEJENVx1OERGM1x1OEZDN1xuXHRcdFx0aWYgKG9mZnNldCArIDIgPD0gbGVuZ3RoKSB7XG5cdFx0XHRcdGNvbnN0IHNlZ21lbnRMZW5ndGggPSB2aWV3LmdldFVpbnQxNihvZmZzZXQpO1xuXHRcdFx0XHRvZmZzZXQgKz0gc2VnbWVudExlbmd0aDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogXHU4OUUzXHU2NzkwIFRJRkYgXHU1OTM0XHU1NDhDIElGRFxuICovXG5mdW5jdGlvbiBwYXJzZVRpZmYodmlldzogRGF0YVZpZXcsIHRpZmZTdGFydDogbnVtYmVyLCByZXN1bHQ6IEV4aWZEYXRhKTogdm9pZCB7XG5cdGlmICh0aWZmU3RhcnQgKyA4ID4gdmlldy5ieXRlTGVuZ3RoKSByZXR1cm47XG5cblx0Ly8gXHU1QjU3XHU4MjgyXHU1RThGXHU2ODA3XHU4QkIwXG5cdGNvbnN0IGJ5dGVPcmRlciA9IHZpZXcuZ2V0VWludDE2KHRpZmZTdGFydCk7XG5cdGNvbnN0IGxpdHRsZUVuZGlhbiA9IGJ5dGVPcmRlciA9PT0gMHg0OTQ5OyAvLyBcIklJXCJcblx0aWYgKGJ5dGVPcmRlciAhPT0gMHg0OTQ5ICYmIGJ5dGVPcmRlciAhPT0gMHg0RDREKSByZXR1cm47IC8vIFx1OTc1RSBcIklJXCIgXHU0RTVGXHU5NzVFIFwiTU1cIlxuXG5cdC8vIFRJRkYgXHU3MjQ4XHU2NzJDXHU1M0Y3XHVGRjA4XHU1RTk0XHU0RTNBIDQyXHVGRjA5XG5cdGlmICh2aWV3LmdldFVpbnQxNih0aWZmU3RhcnQgKyAyLCBsaXR0bGVFbmRpYW4pICE9PSA0MikgcmV0dXJuO1xuXG5cdC8vIElGRDAgXHU1MDRGXHU3OUZCXG5cdGNvbnN0IGlmZDBPZmZzZXQgPSB2aWV3LmdldFVpbnQzMih0aWZmU3RhcnQgKyA0LCBsaXR0bGVFbmRpYW4pO1xuXHRwYXJzZUlGRCh2aWV3LCB0aWZmU3RhcnQsIHRpZmZTdGFydCArIGlmZDBPZmZzZXQsIGxpdHRsZUVuZGlhbiwgcmVzdWx0LCB0cnVlKTtcbn1cblxuLyoqXG4gKiBcdTg5RTNcdTY3OTAgSUZEXHVGRjA4SW1hZ2UgRmlsZSBEaXJlY3RvcnlcdUZGMDlcbiAqL1xuZnVuY3Rpb24gcGFyc2VJRkQoXG5cdHZpZXc6IERhdGFWaWV3LFxuXHR0aWZmU3RhcnQ6IG51bWJlcixcblx0aWZkT2Zmc2V0OiBudW1iZXIsXG5cdGxpdHRsZUVuZGlhbjogYm9vbGVhbixcblx0cmVzdWx0OiBFeGlmRGF0YSxcblx0Zm9sbG93RXhpZklGRDogYm9vbGVhblxuKTogdm9pZCB7XG5cdGlmIChpZmRPZmZzZXQgKyAyID4gdmlldy5ieXRlTGVuZ3RoKSByZXR1cm47XG5cblx0Y29uc3QgZW50cnlDb3VudCA9IHZpZXcuZ2V0VWludDE2KGlmZE9mZnNldCwgbGl0dGxlRW5kaWFuKTtcblx0bGV0IG9mZnNldCA9IGlmZE9mZnNldCArIDI7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlbnRyeUNvdW50OyBpKyspIHtcblx0XHRpZiAob2Zmc2V0ICsgMTIgPiB2aWV3LmJ5dGVMZW5ndGgpIGJyZWFrO1xuXG5cdFx0Y29uc3QgdGFnID0gdmlldy5nZXRVaW50MTYob2Zmc2V0LCBsaXR0bGVFbmRpYW4pO1xuXHRcdGNvbnN0IHR5cGUgPSB2aWV3LmdldFVpbnQxNihvZmZzZXQgKyAyLCBsaXR0bGVFbmRpYW4pO1xuXHRcdGNvbnN0IGNvdW50ID0gdmlldy5nZXRVaW50MzIob2Zmc2V0ICsgNCwgbGl0dGxlRW5kaWFuKTtcblx0XHRjb25zdCB2YWx1ZU9mZnNldCA9IG9mZnNldCArIDg7XG5cblx0XHRzd2l0Y2ggKHRhZykge1xuXHRcdFx0Y2FzZSBUQUdfTUFLRTpcblx0XHRcdFx0cmVzdWx0Lm1ha2UgPSByZWFkU3RyaW5nVmFsdWUodmlldywgdGlmZlN0YXJ0LCB2YWx1ZU9mZnNldCwgdHlwZSwgY291bnQsIGxpdHRsZUVuZGlhbik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBUQUdfTU9ERUw6XG5cdFx0XHRcdHJlc3VsdC5tb2RlbCA9IHJlYWRTdHJpbmdWYWx1ZSh2aWV3LCB0aWZmU3RhcnQsIHZhbHVlT2Zmc2V0LCB0eXBlLCBjb3VudCwgbGl0dGxlRW5kaWFuKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFRBR19PUklFTlRBVElPTjpcblx0XHRcdFx0cmVzdWx0Lm9yaWVudGF0aW9uID0gcmVhZFNob3J0VmFsdWUodmlldywgdmFsdWVPZmZzZXQsIGxpdHRsZUVuZGlhbik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBUQUdfREFURV9USU1FX09SSUdJTkFMOlxuXHRcdFx0XHRyZXN1bHQuZGF0ZVRpbWVPcmlnaW5hbCA9IHJlYWRTdHJpbmdWYWx1ZSh2aWV3LCB0aWZmU3RhcnQsIHZhbHVlT2Zmc2V0LCB0eXBlLCBjb3VudCwgbGl0dGxlRW5kaWFuKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFRBR19JTUFHRV9XSURUSDpcblx0XHRcdFx0cmVzdWx0LmltYWdlV2lkdGggPSByZWFkTG9uZ09yU2hvcnQodmlldywgdmFsdWVPZmZzZXQsIHR5cGUsIGxpdHRsZUVuZGlhbik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBUQUdfSU1BR0VfSEVJR0hUOlxuXHRcdFx0XHRyZXN1bHQuaW1hZ2VIZWlnaHQgPSByZWFkTG9uZ09yU2hvcnQodmlldywgdmFsdWVPZmZzZXQsIHR5cGUsIGxpdHRsZUVuZGlhbik7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBUQUdfRVhJRl9JRkQ6XG5cdFx0XHRcdGlmIChmb2xsb3dFeGlmSUZEKSB7XG5cdFx0XHRcdFx0Y29uc3QgZXhpZk9mZnNldCA9IHZpZXcuZ2V0VWludDMyKHZhbHVlT2Zmc2V0LCBsaXR0bGVFbmRpYW4pO1xuXHRcdFx0XHRcdHBhcnNlSUZEKHZpZXcsIHRpZmZTdGFydCwgdGlmZlN0YXJ0ICsgZXhpZk9mZnNldCwgbGl0dGxlRW5kaWFuLCByZXN1bHQsIGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRvZmZzZXQgKz0gMTI7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVhZFNob3J0VmFsdWUodmlldzogRGF0YVZpZXcsIG9mZnNldDogbnVtYmVyLCBsaXR0bGVFbmRpYW46IGJvb2xlYW4pOiBudW1iZXIge1xuXHRpZiAob2Zmc2V0ICsgMiA+IHZpZXcuYnl0ZUxlbmd0aCkgcmV0dXJuIDA7XG5cdHJldHVybiB2aWV3LmdldFVpbnQxNihvZmZzZXQsIGxpdHRsZUVuZGlhbik7XG59XG5cbmZ1bmN0aW9uIHJlYWRMb25nT3JTaG9ydCh2aWV3OiBEYXRhVmlldywgb2Zmc2V0OiBudW1iZXIsIHR5cGU6IG51bWJlciwgbGl0dGxlRW5kaWFuOiBib29sZWFuKTogbnVtYmVyIHtcblx0aWYgKHR5cGUgPT09IDMpIHsgLy8gU0hPUlRcblx0XHRyZXR1cm4gcmVhZFNob3J0VmFsdWUodmlldywgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pO1xuXHR9XG5cdGlmIChvZmZzZXQgKyA0ID4gdmlldy5ieXRlTGVuZ3RoKSByZXR1cm4gMDtcblx0cmV0dXJuIHZpZXcuZ2V0VWludDMyKG9mZnNldCwgbGl0dGxlRW5kaWFuKTtcbn1cblxuZnVuY3Rpb24gcmVhZFN0cmluZ1ZhbHVlKFxuXHR2aWV3OiBEYXRhVmlldyxcblx0dGlmZlN0YXJ0OiBudW1iZXIsXG5cdHZhbHVlT2Zmc2V0OiBudW1iZXIsXG5cdHR5cGU6IG51bWJlcixcblx0Y291bnQ6IG51bWJlcixcblx0bGl0dGxlRW5kaWFuOiBib29sZWFuXG4pOiBzdHJpbmcge1xuXHRpZiAodHlwZSAhPT0gMikgcmV0dXJuICcnOyAvLyBBU0NJSSB0eXBlXG5cblx0bGV0IGRhdGFPZmZzZXQ6IG51bWJlcjtcblx0aWYgKGNvdW50IDw9IDQpIHtcblx0XHRkYXRhT2Zmc2V0ID0gdmFsdWVPZmZzZXQ7XG5cdH0gZWxzZSB7XG5cdFx0aWYgKHZhbHVlT2Zmc2V0ICsgNCA+IHZpZXcuYnl0ZUxlbmd0aCkgcmV0dXJuICcnO1xuXHRcdGRhdGFPZmZzZXQgPSB0aWZmU3RhcnQgKyB2aWV3LmdldFVpbnQzMih2YWx1ZU9mZnNldCwgbGl0dGxlRW5kaWFuKTtcblx0fVxuXG5cdGlmIChkYXRhT2Zmc2V0ICsgY291bnQgPiB2aWV3LmJ5dGVMZW5ndGgpIHJldHVybiAnJztcblxuXHRsZXQgc3RyID0gJyc7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQgLSAxOyBpKyspIHsgLy8gLTEgdG8gZXhjbHVkZSBudWxsIHRlcm1pbmF0b3Jcblx0XHRjb25zdCBjaGFyQ29kZSA9IHZpZXcuZ2V0VWludDgoZGF0YU9mZnNldCArIGkpO1xuXHRcdGlmIChjaGFyQ29kZSA9PT0gMCkgYnJlYWs7XG5cdFx0c3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2hhckNvZGUpO1xuXHR9XG5cblx0cmV0dXJuIHN0ci50cmltKCk7XG59XG5cbi8qKlxuICogXHU0RUNFIEVYSUYgXHU2NUU1XHU2NzFGXHU1QjU3XHU3QjI2XHU0RTMyXHU4OUUzXHU2NzkwIERhdGUgXHU1QkY5XHU4QzYxXG4gKiBcdTY4M0NcdTVGMEY6IFwiWVlZWTpNTTpERCBISDptbTpzc1wiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUV4aWZEYXRlKGRhdGVTdHI6IHN0cmluZyk6IERhdGUgfCBudWxsIHtcblx0Y29uc3QgbWF0Y2ggPSBkYXRlU3RyLm1hdGNoKC9eKFxcZHs0fSk6KFxcZHsyfSk6KFxcZHsyfSlcXHMrKFxcZHsyfSk6KFxcZHsyfSk6KFxcZHsyfSkvKTtcblx0aWYgKCFtYXRjaCkgcmV0dXJuIG51bGw7XG5cblx0Y29uc3QgWywgeWVhciwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmRdID0gbWF0Y2g7XG5cdHJldHVybiBuZXcgRGF0ZShcblx0XHRwYXJzZUludCh5ZWFyKSwgcGFyc2VJbnQobW9udGgpIC0gMSwgcGFyc2VJbnQoZGF5KSxcblx0XHRwYXJzZUludChob3VyKSwgcGFyc2VJbnQobWludXRlKSwgcGFyc2VJbnQoc2Vjb25kKVxuXHQpO1xufVxuIiwgIi8qKlxuICogXHU4OUM0XHU1MjE5XHU1RjE1XHU2NENFXHVGRjFBXHU1N0ZBXHU0RThFXHU2NUU1XHU2NzFGICsgXHU3QzdCXHU1NzhCICsgRVhJRiBcdTRGRTFcdTYwNkZcdTgxRUFcdTUyQThcdTY1NzRcdTc0MDZcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcbiAqL1xuXG5pbXBvcnQgeyBURmlsZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IE9yZ2FuaXplUnVsZSB9IGZyb20gJy4uL3NldHRpbmdzJztcbmltcG9ydCB7IGdldEZpbGVFeHRlbnNpb24sIGdldE1lZGlhVHlwZSB9IGZyb20gJy4vbWVkaWFUeXBlcyc7XG5pbXBvcnQgeyBFeGlmRGF0YSwgcGFyc2VFeGlmRGF0ZSB9IGZyb20gJy4vZXhpZlJlYWRlcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3JnYW5pemVDb250ZXh0IHtcblx0ZmlsZTogVEZpbGU7XG5cdGRhdGU6IERhdGU7XG5cdGV4aWY/OiBFeGlmRGF0YTtcblx0dGFncz86IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9yZ2FuaXplVGFyZ2V0IHtcblx0b3JpZ2luYWxQYXRoOiBzdHJpbmc7XG5cdG5ld1BhdGg6IHN0cmluZztcblx0bmV3TmFtZTogc3RyaW5nO1xufVxuXG4vKipcbiAqIFx1NjdFNVx1NjI3RVx1NTMzOVx1OTE0RFx1NzY4NFx1N0IyQ1x1NEUwMFx1Njc2MVx1ODlDNFx1NTIxOVxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZE1hdGNoaW5nUnVsZShcblx0cnVsZXM6IE9yZ2FuaXplUnVsZVtdLFxuXHRmaWxlOiBURmlsZSxcblx0bWV0YWRhdGE/OiB7IGV4aWY/OiBFeGlmRGF0YTsgdGFncz86IHN0cmluZ1tdIH1cbik6IE9yZ2FuaXplUnVsZSB8IG51bGwge1xuXHRjb25zdCBleHQgPSBnZXRGaWxlRXh0ZW5zaW9uKGZpbGUubmFtZSkucmVwbGFjZSgnLicsICcnKS50b0xvd2VyQ2FzZSgpO1xuXG5cdGZvciAoY29uc3QgcnVsZSBvZiBydWxlcykge1xuXHRcdGlmICghcnVsZS5lbmFibGVkKSBjb250aW51ZTtcblxuXHRcdC8vIFx1NjhDMFx1NjdFNVx1NjI2OVx1NUM1NVx1NTQwRFx1NTMzOVx1OTE0RFxuXHRcdGlmIChydWxlLm1hdGNoRXh0ZW5zaW9ucykge1xuXHRcdFx0Y29uc3QgYWxsb3dlZEV4dHMgPSBydWxlLm1hdGNoRXh0ZW5zaW9uc1xuXHRcdFx0XHQuc3BsaXQoJywnKVxuXHRcdFx0XHQubWFwKGUgPT4gZS50cmltKCkudG9Mb3dlckNhc2UoKSk7XG5cblx0XHRcdGlmICghYWxsb3dlZEV4dHMuaW5jbHVkZXMoZXh0KSkgY29udGludWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJ1bGU7XG5cdH1cblxuXHRyZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBcdTY4MzlcdTYzNkVcdTg5QzRcdTUyMTlcdTU0OENcdTRFMEFcdTRFMEJcdTY1ODdcdThCQTFcdTdCOTdcdTc2RUVcdTY4MDdcdThERUZcdTVGODRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVUYXJnZXQocnVsZTogT3JnYW5pemVSdWxlLCBjdHg6IE9yZ2FuaXplQ29udGV4dCk6IE9yZ2FuaXplVGFyZ2V0IHtcblx0Y29uc3QgZXh0ID0gZ2V0RmlsZUV4dGVuc2lvbihjdHguZmlsZS5uYW1lKTtcblx0Y29uc3QgYmFzZU5hbWUgPSBjdHguZmlsZS5uYW1lLnJlcGxhY2UoL1xcLlteLl0rJC8sICcnKTtcblx0Y29uc3QgbWVkaWFUeXBlID0gZ2V0TWVkaWFUeXBlKGN0eC5maWxlLm5hbWUpIHx8ICdvdGhlcic7XG5cblx0Ly8gXHU0RjE4XHU1MTQ4XHU0RjdGXHU3NTI4IEVYSUYgXHU2NUU1XHU2NzFGXG5cdGxldCBkYXRlID0gY3R4LmRhdGU7XG5cdGlmIChjdHguZXhpZj8uZGF0ZVRpbWVPcmlnaW5hbCkge1xuXHRcdGNvbnN0IGV4aWZEYXRlID0gcGFyc2VFeGlmRGF0ZShjdHguZXhpZi5kYXRlVGltZU9yaWdpbmFsKTtcblx0XHRpZiAoZXhpZkRhdGUpIGRhdGUgPSBleGlmRGF0ZTtcblx0fVxuXG5cdGNvbnN0IHllYXIgPSBTdHJpbmcoZGF0ZS5nZXRGdWxsWWVhcigpKTtcblx0Y29uc3QgbW9udGggPSBTdHJpbmcoZGF0ZS5nZXRNb250aCgpICsgMSkucGFkU3RhcnQoMiwgJzAnKTtcblx0Y29uc3QgZGF5ID0gU3RyaW5nKGRhdGUuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCAnMCcpO1xuXG5cdGNvbnN0IGNhbWVyYSA9IGN0eC5leGlmPy5tYWtlXG5cdFx0PyBgJHtjdHguZXhpZi5tYWtlfSR7Y3R4LmV4aWYubW9kZWwgPyAnICcgKyBjdHguZXhpZi5tb2RlbCA6ICcnfWBcblx0XHQ6ICdVbmtub3duJztcblxuXHRjb25zdCB0YWcgPSBjdHgudGFncz8uWzBdIHx8ICd1bnRhZ2dlZCc7XG5cblx0Y29uc3QgdmFyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcblx0XHQne3llYXJ9JzogeWVhcixcblx0XHQne21vbnRofSc6IG1vbnRoLFxuXHRcdCd7ZGF5fSc6IGRheSxcblx0XHQne2V4dH0nOiBleHQucmVwbGFjZSgnLicsICcnKSxcblx0XHQne25hbWV9JzogYmFzZU5hbWUsXG5cdFx0J3tjYW1lcmF9Jzogc2FuaXRpemVGaWxlTmFtZShjYW1lcmEpLFxuXHRcdCd7dHlwZX0nOiBtZWRpYVR5cGUsXG5cdFx0J3t0YWd9Jzogc2FuaXRpemVGaWxlTmFtZSh0YWcpXG5cdH07XG5cblx0Ly8gXHU1QzU1XHU1RjAwXHU4REVGXHU1Rjg0XHU2QTIxXHU2NzdGXG5cdGxldCBuZXdEaXIgPSBydWxlLnBhdGhUZW1wbGF0ZTtcblx0Zm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModmFycykpIHtcblx0XHRuZXdEaXIgPSBuZXdEaXIucmVwbGFjZShuZXcgUmVnRXhwKGVzY2FwZVJlZ2V4KGtleSksICdnJyksIHZhbHVlKTtcblx0fVxuXG5cdC8vIFx1NUM1NVx1NUYwMFx1NjU4N1x1NEVGNlx1NTQwRFx1NkEyMVx1Njc3RlxuXHRsZXQgbmV3TmFtZSA9IHJ1bGUucmVuYW1lVGVtcGxhdGUgfHwgJ3tuYW1lfSc7XG5cdGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHZhcnMpKSB7XG5cdFx0bmV3TmFtZSA9IG5ld05hbWUucmVwbGFjZShuZXcgUmVnRXhwKGVzY2FwZVJlZ2V4KGtleSksICdnJyksIHZhbHVlKTtcblx0fVxuXG5cdC8vIFx1Nzg2RVx1NEZERFx1NjU4N1x1NEVGNlx1NTQwRFx1NjcwOVx1NjI2OVx1NUM1NVx1NTQwRFxuXHRpZiAoIW5ld05hbWUuZW5kc1dpdGgoZXh0KSkge1xuXHRcdG5ld05hbWUgPSBuZXdOYW1lICsgZXh0O1xuXHR9XG5cblx0Ly8gXHU2RTA1XHU3NDA2XHU4REVGXHU1Rjg0XG5cdG5ld0RpciA9IG5ld0Rpci5yZXBsYWNlKC9cXC8rL2csICcvJykucmVwbGFjZSgvXlxcL3xcXC8kL2csICcnKTtcblxuXHRjb25zdCBuZXdQYXRoID0gbmV3RGlyID8gYCR7bmV3RGlyfS8ke25ld05hbWV9YCA6IG5ld05hbWU7XG5cblx0cmV0dXJuIHtcblx0XHRvcmlnaW5hbFBhdGg6IGN0eC5maWxlLnBhdGgsXG5cdFx0bmV3UGF0aCxcblx0XHRuZXdOYW1lXG5cdH07XG59XG5cbi8qKlxuICogXHU2RTA1XHU3NDA2XHU2NTg3XHU0RUY2XHU1NDBEXHU0RTJEXHU3Njg0XHU5NzVFXHU2Q0Q1XHU1QjU3XHU3QjI2XG4gKi9cbmZ1bmN0aW9uIHNhbml0aXplRmlsZU5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcblx0cmV0dXJuIG5hbWVcblx0XHQucmVwbGFjZSgvWy9cXFxcOio/XCI8PnxdL2csICdfJylcblx0XHQucmVwbGFjZSgvXFxzKy9nLCAnXycpXG5cdFx0LnJlcGxhY2UoL18rL2csICdfJylcblx0XHQudHJpbSgpO1xufVxuXG4vKipcbiAqIFx1OEY2Q1x1NEU0OVx1NkI2M1x1NTIxOVx1ODg2OFx1OEZCRVx1NUYwRlx1NzI3OVx1NkI4QVx1NUI1N1x1N0IyNlxuICovXG5mdW5jdGlvbiBlc2NhcGVSZWdleChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG5cdHJldHVybiBzdHIucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csICdcXFxcJCYnKTtcbn1cbiIsICIvKipcbiAqIENhbnZhcyBcdTVBOTJcdTRGNTNcdTU5MDRcdTc0MDZcdTU2NjhcbiAqIFx1NEY3Rlx1NzUyOCBDYW52YXMgQVBJIFx1NUI5RVx1NzNCMFx1NTZGRVx1NzI0N1x1NTM4Qlx1N0YyOS9cdThGNkNcdTYzNjIvXHU2QzM0XHU1MzcwL1x1ODhDMVx1NTI2QVxuICogXHU3RUFGXHU2RDRGXHU4OUM4XHU1NjY4XHU1QjlFXHU3M0IwXHVGRjBDXHU2NUUwXHU1MzlGXHU3NTFGXHU0RjlEXHU4RDU2XG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBQcm9jZXNzT3B0aW9ucyB7XG5cdHF1YWxpdHk/OiBudW1iZXI7ICAgICAgICAvLyAwLTEwMCwgZGVmYXVsdCA4MFxuXHRtYXhXaWR0aD86IG51bWJlcjtcblx0bWF4SGVpZ2h0PzogbnVtYmVyO1xuXHRmb3JtYXQ/OiAnd2VicCcgfCAnanBlZycgfCAncG5nJztcblx0d2F0ZXJtYXJrPzoge1xuXHRcdHRleHQ6IHN0cmluZztcblx0XHRwb3NpdGlvbjogJ2NlbnRlcicgfCAnYm90dG9tLXJpZ2h0JyB8ICdib3R0b20tbGVmdCc7XG5cdFx0b3BhY2l0eTogbnVtYmVyOyAgICAgICAvLyAwLTFcblx0XHRmb250U2l6ZT86IG51bWJlcjsgICAgIC8vIGRlZmF1bHQgMjRcblx0fTtcblx0Y3JvcD86IHtcblx0XHR4OiBudW1iZXI7XG5cdFx0eTogbnVtYmVyO1xuXHRcdHdpZHRoOiBudW1iZXI7XG5cdFx0aGVpZ2h0OiBudW1iZXI7XG5cdH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvY2Vzc1Jlc3VsdCB7XG5cdGJsb2I6IEJsb2I7XG5cdHdpZHRoOiBudW1iZXI7XG5cdGhlaWdodDogbnVtYmVyO1xuXHRvcmlnaW5hbFNpemU6IG51bWJlcjtcblx0bmV3U2l6ZTogbnVtYmVyO1xuXHRmb3JtYXQ6IHN0cmluZztcbn1cblxuY29uc3QgTUlNRV9NQVA6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG5cdCd3ZWJwJzogJ2ltYWdlL3dlYnAnLFxuXHQnanBlZyc6ICdpbWFnZS9qcGVnJyxcblx0J2pwZyc6ICdpbWFnZS9qcGVnJyxcblx0J3BuZyc6ICdpbWFnZS9wbmcnLFxuXHQnYXZpZic6ICdpbWFnZS9hdmlmJ1xufTtcblxuLyoqXG4gKiBcdTY4QzBcdTZENEJcdTZENEZcdTg5QzhcdTU2NjhcdTY2MkZcdTU0MjZcdTY1MkZcdTYzMDFcdTY3RDBcdTc5Q0RcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzRm9ybWF0U3VwcG9ydGVkKGZvcm1hdDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRjYW52YXMud2lkdGggPSAxO1xuXHRjYW52YXMuaGVpZ2h0ID0gMTtcblx0Y29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdGlmICghY3R4KSByZXR1cm4gZmFsc2U7XG5cdGN0eC5maWxsUmVjdCgwLCAwLCAxLCAxKTtcblxuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRjYW52YXMudG9CbG9iKFxuXHRcdFx0KGJsb2IpID0+IHJlc29sdmUoYmxvYiAhPT0gbnVsbCAmJiBibG9iLnNpemUgPiAwKSxcblx0XHRcdE1JTUVfTUFQW2Zvcm1hdF0gfHwgYGltYWdlLyR7Zm9ybWF0fWBcblx0XHQpO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBcdTUyQTBcdThGN0RcdTU2RkVcdTcyNDdcbiAqL1xuZnVuY3Rpb24gbG9hZEltYWdlKHNyYzogc3RyaW5nKTogUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50PiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0Y29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG5cdFx0aW1nLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XG5cdFx0aW1nLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoaW1nKTtcblx0XHRpbWcub25lcnJvciA9ICgpID0+IHJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBsb2FkIGltYWdlOiAke3NyY31gKSk7XG5cdFx0aW1nLnNyYyA9IHNyYztcblx0fSk7XG59XG5cbi8qKlxuICogXHU1OTA0XHU3NDA2XHU1MzU1XHU1RjIwXHU1NkZFXHU3MjQ3XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcm9jZXNzSW1hZ2UoXG5cdHNyYzogc3RyaW5nLFxuXHRvcmlnaW5hbFNpemU6IG51bWJlcixcblx0b3B0aW9uczogUHJvY2Vzc09wdGlvbnMgPSB7fVxuKTogUHJvbWlzZTxQcm9jZXNzUmVzdWx0PiB7XG5cdGNvbnN0IGltZyA9IGF3YWl0IGxvYWRJbWFnZShzcmMpO1xuXG5cdGxldCB7IHdpZHRoOiBzcmNXLCBoZWlnaHQ6IHNyY0ggfSA9IGltZztcblx0bGV0IGRyYXdYID0gMDtcblx0bGV0IGRyYXdZID0gMDtcblx0bGV0IGRyYXdXID0gc3JjVztcblx0bGV0IGRyYXdIID0gc3JjSDtcblxuXHQvLyBcdTg4QzFcdTUyNkFcblx0aWYgKG9wdGlvbnMuY3JvcCkge1xuXHRcdGRyYXdYID0gLW9wdGlvbnMuY3JvcC54O1xuXHRcdGRyYXdZID0gLW9wdGlvbnMuY3JvcC55O1xuXHRcdHNyY1cgPSBvcHRpb25zLmNyb3Aud2lkdGg7XG5cdFx0c3JjSCA9IG9wdGlvbnMuY3JvcC5oZWlnaHQ7XG5cdH1cblxuXHQvLyBcdTdGMjlcdTY1M0VcdTdFQTZcdTY3NUZcblx0bGV0IHRhcmdldFcgPSBzcmNXO1xuXHRsZXQgdGFyZ2V0SCA9IHNyY0g7XG5cblx0aWYgKG9wdGlvbnMubWF4V2lkdGggfHwgb3B0aW9ucy5tYXhIZWlnaHQpIHtcblx0XHRjb25zdCBtYXhXID0gb3B0aW9ucy5tYXhXaWR0aCB8fCBJbmZpbml0eTtcblx0XHRjb25zdCBtYXhIID0gb3B0aW9ucy5tYXhIZWlnaHQgfHwgSW5maW5pdHk7XG5cdFx0Y29uc3QgcmF0aW8gPSBNYXRoLm1pbihtYXhXIC8gc3JjVywgbWF4SCAvIHNyY0gsIDEpO1xuXHRcdHRhcmdldFcgPSBNYXRoLnJvdW5kKHNyY1cgKiByYXRpbyk7XG5cdFx0dGFyZ2V0SCA9IE1hdGgucm91bmQoc3JjSCAqIHJhdGlvKTtcblx0fVxuXG5cdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRjYW52YXMud2lkdGggPSB0YXJnZXRXO1xuXHRjYW52YXMuaGVpZ2h0ID0gdGFyZ2V0SDtcblxuXHRjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0aWYgKCFjdHgpIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGdldCBjYW52YXMgY29udGV4dCcpO1xuXG5cdC8vIFx1N0VEOFx1NTIzNlx1NTZGRVx1NzI0N1xuXHRpZiAob3B0aW9ucy5jcm9wKSB7XG5cdFx0Y29uc3Qgc2NhbGVYID0gdGFyZ2V0VyAvIHNyY1c7XG5cdFx0Y29uc3Qgc2NhbGVZID0gdGFyZ2V0SCAvIHNyY0g7XG5cdFx0Y3R4LmRyYXdJbWFnZShcblx0XHRcdGltZyxcblx0XHRcdG9wdGlvbnMuY3JvcC54LCBvcHRpb25zLmNyb3AueSwgb3B0aW9ucy5jcm9wLndpZHRoLCBvcHRpb25zLmNyb3AuaGVpZ2h0LFxuXHRcdFx0MCwgMCwgdGFyZ2V0VywgdGFyZ2V0SFxuXHRcdCk7XG5cdH0gZWxzZSB7XG5cdFx0Y3R4LmRyYXdJbWFnZShpbWcsIDAsIDAsIHRhcmdldFcsIHRhcmdldEgpO1xuXHR9XG5cblx0Ly8gXHU2QzM0XHU1MzcwXG5cdGlmIChvcHRpb25zLndhdGVybWFyaz8udGV4dCkge1xuXHRcdGNvbnN0IHdtID0gb3B0aW9ucy53YXRlcm1hcms7XG5cdFx0Y29uc3QgZm9udFNpemUgPSB3bS5mb250U2l6ZSB8fCBNYXRoLm1heCgxNiwgTWF0aC5yb3VuZCh0YXJnZXRXIC8gMzApKTtcblxuXHRcdGN0eC5zYXZlKCk7XG5cdFx0Y3R4Lmdsb2JhbEFscGhhID0gd20ub3BhY2l0eTtcblx0XHRjdHguZm9udCA9IGAke2ZvbnRTaXplfXB4IHNhbnMtc2VyaWZgO1xuXHRcdGN0eC5maWxsU3R5bGUgPSAnI2ZmZmZmZic7XG5cdFx0Y3R4LnN0cm9rZVN0eWxlID0gJyMwMDAwMDAnO1xuXHRcdGN0eC5saW5lV2lkdGggPSAyO1xuXG5cdFx0Y29uc3QgdGV4dE1ldHJpY3MgPSBjdHgubWVhc3VyZVRleHQod20udGV4dCk7XG5cdFx0bGV0IHRleHRYOiBudW1iZXI7XG5cdFx0bGV0IHRleHRZOiBudW1iZXI7XG5cblx0XHRzd2l0Y2ggKHdtLnBvc2l0aW9uKSB7XG5cdFx0XHRjYXNlICdjZW50ZXInOlxuXHRcdFx0XHR0ZXh0WCA9ICh0YXJnZXRXIC0gdGV4dE1ldHJpY3Mud2lkdGgpIC8gMjtcblx0XHRcdFx0dGV4dFkgPSB0YXJnZXRIIC8gMiArIGZvbnRTaXplIC8gMjtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdib3R0b20tbGVmdCc6XG5cdFx0XHRcdHRleHRYID0gMjA7XG5cdFx0XHRcdHRleHRZID0gdGFyZ2V0SCAtIDIwO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2JvdHRvbS1yaWdodCc6XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0ZXh0WCA9IHRhcmdldFcgLSB0ZXh0TWV0cmljcy53aWR0aCAtIDIwO1xuXHRcdFx0XHR0ZXh0WSA9IHRhcmdldEggLSAyMDtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXG5cdFx0Y3R4LnN0cm9rZVRleHQod20udGV4dCwgdGV4dFgsIHRleHRZKTtcblx0XHRjdHguZmlsbFRleHQod20udGV4dCwgdGV4dFgsIHRleHRZKTtcblx0XHRjdHgucmVzdG9yZSgpO1xuXHR9XG5cblx0Ly8gXHU4RjkzXHU1MUZBXHU2ODNDXHU1RjBGXHU1NDhDXHU4RDI4XHU5MUNGXG5cdGNvbnN0IGZvcm1hdCA9IG9wdGlvbnMuZm9ybWF0IHx8ICd3ZWJwJztcblx0Y29uc3QgcXVhbGl0eSA9IChvcHRpb25zLnF1YWxpdHkgPz8gODApIC8gMTAwO1xuXHRjb25zdCBtaW1lVHlwZSA9IE1JTUVfTUFQW2Zvcm1hdF0gfHwgJ2ltYWdlL3dlYnAnO1xuXG5cdGNvbnN0IGJsb2IgPSBhd2FpdCBuZXcgUHJvbWlzZTxCbG9iPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0Y2FudmFzLnRvQmxvYihcblx0XHRcdChiKSA9PiB7XG5cdFx0XHRcdGlmIChiKSByZXNvbHZlKGIpO1xuXHRcdFx0XHRlbHNlIHJlamVjdChuZXcgRXJyb3IoJ0NhbnZhcyB0b0Jsb2IgcmV0dXJuZWQgbnVsbCcpKTtcblx0XHRcdH0sXG5cdFx0XHRtaW1lVHlwZSxcblx0XHRcdHF1YWxpdHlcblx0XHQpO1xuXHR9KTtcblxuXHRyZXR1cm4ge1xuXHRcdGJsb2IsXG5cdFx0d2lkdGg6IHRhcmdldFcsXG5cdFx0aGVpZ2h0OiB0YXJnZXRILFxuXHRcdG9yaWdpbmFsU2l6ZSxcblx0XHRuZXdTaXplOiBibG9iLnNpemUsXG5cdFx0Zm9ybWF0XG5cdH07XG59XG5cbi8qKlxuICogXHU2Mjc5XHU5MUNGXHU1OTA0XHU3NDA2XHU1NkZFXHU3MjQ3XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBiYXRjaFByb2Nlc3MoXG5cdGZpbGVzOiBBcnJheTx7IHNyYzogc3RyaW5nOyBvcmlnaW5hbFNpemU6IG51bWJlcjsgbmFtZTogc3RyaW5nIH0+LFxuXHRvcHRpb25zOiBQcm9jZXNzT3B0aW9ucyxcblx0b25Qcm9ncmVzcz86IChwcm9jZXNzZWQ6IG51bWJlciwgdG90YWw6IG51bWJlciwgY3VycmVudE5hbWU6IHN0cmluZykgPT4gdm9pZFxuKTogUHJvbWlzZTxBcnJheTx7IG5hbWU6IHN0cmluZzsgcmVzdWx0OiBQcm9jZXNzUmVzdWx0IHwgbnVsbDsgZXJyb3I/OiBzdHJpbmcgfT4+IHtcblx0Y29uc3QgcmVzdWx0czogQXJyYXk8eyBuYW1lOiBzdHJpbmc7IHJlc3VsdDogUHJvY2Vzc1Jlc3VsdCB8IG51bGw7IGVycm9yPzogc3RyaW5nIH0+ID0gW107XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuXHRcdGNvbnN0IGZpbGUgPSBmaWxlc1tpXTtcblx0XHRpZiAob25Qcm9ncmVzcykgb25Qcm9ncmVzcyhpLCBmaWxlcy5sZW5ndGgsIGZpbGUubmFtZSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgcHJvY2Vzc0ltYWdlKGZpbGUuc3JjLCBmaWxlLm9yaWdpbmFsU2l6ZSwgb3B0aW9ucyk7XG5cdFx0XHRyZXN1bHRzLnB1c2goeyBuYW1lOiBmaWxlLm5hbWUsIHJlc3VsdCB9KTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0cmVzdWx0cy5wdXNoKHtcblx0XHRcdFx0bmFtZTogZmlsZS5uYW1lLFxuXHRcdFx0XHRyZXN1bHQ6IG51bGwsXG5cdFx0XHRcdGVycm9yOiAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2Vcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdGlmIChvblByb2dyZXNzKSBvblByb2dyZXNzKGZpbGVzLmxlbmd0aCwgZmlsZXMubGVuZ3RoLCAnJyk7XG5cblx0cmV0dXJuIHJlc3VsdHM7XG59XG5cbi8qKlxuICogXHU0RUNFXHU4OUM2XHU5ODkxXHU2MjJBXHU1M0Q2XHU1RTI3XHU0RjVDXHU0RTNBXHU3RjI5XHU3NTY1XHU1NkZFXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0VmlkZW9GcmFtZShcblx0dmlkZW9TcmM6IHN0cmluZyxcblx0c2Vla1RpbWU6IG51bWJlciA9IDFcbik6IFByb21pc2U8eyBibG9iOiBCbG9iOyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9PiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0Y29uc3QgdmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpO1xuXHRcdHZpZGVvLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XG5cdFx0dmlkZW8ubXV0ZWQgPSB0cnVlO1xuXHRcdHZpZGVvLnByZWxvYWQgPSAnbWV0YWRhdGEnO1xuXG5cdFx0dmlkZW8uYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVkbWV0YWRhdGEnLCAoKSA9PiB7XG5cdFx0XHR2aWRlby5jdXJyZW50VGltZSA9IE1hdGgubWluKHNlZWtUaW1lLCB2aWRlby5kdXJhdGlvbiAqIDAuMSk7XG5cdFx0fSk7XG5cblx0XHR2aWRlby5hZGRFdmVudExpc3RlbmVyKCdzZWVrZWQnLCAoKSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0XHRcdFx0Y2FudmFzLndpZHRoID0gdmlkZW8udmlkZW9XaWR0aDtcblx0XHRcdFx0Y2FudmFzLmhlaWdodCA9IHZpZGVvLnZpZGVvSGVpZ2h0O1xuXG5cdFx0XHRcdGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRcdFx0XHRpZiAoIWN0eCkge1xuXHRcdFx0XHRcdHJlamVjdChuZXcgRXJyb3IoJ0Nhbm5vdCBnZXQgY2FudmFzIGNvbnRleHQnKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y3R4LmRyYXdJbWFnZSh2aWRlbywgMCwgMCk7XG5cblx0XHRcdFx0Y2FudmFzLnRvQmxvYihcblx0XHRcdFx0XHQoYmxvYikgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGJsb2IpIHtcblx0XHRcdFx0XHRcdFx0cmVzb2x2ZSh7XG5cdFx0XHRcdFx0XHRcdFx0YmxvYixcblx0XHRcdFx0XHRcdFx0XHR3aWR0aDogdmlkZW8udmlkZW9XaWR0aCxcblx0XHRcdFx0XHRcdFx0XHRoZWlnaHQ6IHZpZGVvLnZpZGVvSGVpZ2h0XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcignVmlkZW8gZnJhbWUgZXh0cmFjdGlvbiBmYWlsZWQnKSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQnaW1hZ2Uvd2VicCcsXG5cdFx0XHRcdFx0MC44XG5cdFx0XHRcdCk7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRyZWplY3QoZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dmlkZW8uYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoKSA9PiB7XG5cdFx0XHRyZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCB2aWRlbzogJHt2aWRlb1NyY31gKSk7XG5cdFx0fSk7XG5cblx0XHR2aWRlby5zcmMgPSB2aWRlb1NyYztcblx0fSk7XG59XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU4RjkzXHU1MUZBXHU2ODNDXHU1RjBGXHU3Njg0XHU2NTg3XHU0RUY2XHU2MjY5XHU1QzU1XHU1NDBEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGb3JtYXRFeHRlbnNpb24oZm9ybWF0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRzd2l0Y2ggKGZvcm1hdCkge1xuXHRcdGNhc2UgJ2pwZWcnOiByZXR1cm4gJy5qcGcnO1xuXHRcdGNhc2UgJ3dlYnAnOiByZXR1cm4gJy53ZWJwJztcblx0XHRjYXNlICdwbmcnOiByZXR1cm4gJy5wbmcnO1xuXHRcdGNhc2UgJ2F2aWYnOiByZXR1cm4gJy5hdmlmJztcblx0XHRkZWZhdWx0OiByZXR1cm4gYC4ke2Zvcm1hdH1gO1xuXHR9XG59XG4iLCAiaW1wb3J0IHsgVEZpbGUsIEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBzZXRJY29uLCBNZW51LCBNZW51SXRlbSwgTm90aWNlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IEltYWdlTWFuYWdlclBsdWdpbiBmcm9tICcuLi9tYWluJztcbmltcG9ydCB7IERlbGV0ZUNvbmZpcm1Nb2RhbCB9IGZyb20gJy4vRGVsZXRlQ29uZmlybU1vZGFsJztcbmltcG9ydCB7IGZvcm1hdEZpbGVTaXplIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGdldE1lZGlhVHlwZSB9IGZyb20gJy4uL3V0aWxzL21lZGlhVHlwZXMnO1xuXG5leHBvcnQgY29uc3QgVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVMgPSAndW5yZWZlcmVuY2VkLWltYWdlcy12aWV3JztcblxuaW50ZXJmYWNlIFVucmVmZXJlbmNlZEltYWdlIHtcblx0ZmlsZTogVEZpbGU7XG5cdHBhdGg6IHN0cmluZztcblx0bmFtZTogc3RyaW5nO1xuXHRzaXplOiBudW1iZXI7XG5cdG1vZGlmaWVkOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBVbnJlZmVyZW5jZWRJbWFnZXNWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0dW5yZWZlcmVuY2VkSW1hZ2VzOiBVbnJlZmVyZW5jZWRJbWFnZVtdID0gW107XG5cdHByaXZhdGUgaXNTY2FubmluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luKSB7XG5cdFx0c3VwZXIobGVhZik7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblxuXHRnZXRWaWV3VHlwZSgpIHtcblx0XHRyZXR1cm4gVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVM7XG5cdH1cblxuXHRnZXREaXNwbGF5VGV4dCgpIHtcblx0XHRyZXR1cm4gdGhpcy5wbHVnaW4udCgndW5yZWZlcmVuY2VkTWVkaWEnKTtcblx0fVxuXG5cdGFzeW5jIG9uT3BlbigpIHtcblx0XHQvLyBcdTdCNDlcdTVGODUgY29udGVudEVsIFx1NTFDNlx1NTkwN1x1NTk3RFxuXHRcdGxldCByZXRyaWVzID0gMDtcblx0XHR3aGlsZSAoIXRoaXMuY29udGVudEVsICYmIHJldHJpZXMgPCAxMCkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7XG5cdFx0XHRyZXRyaWVzKys7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1VucmVmZXJlbmNlZEltYWdlc1ZpZXc6IGNvbnRlbnRFbCBub3QgcmVhZHknKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoJ3VucmVmZXJlbmNlZC1pbWFnZXMtdmlldycpO1xuXG5cdFx0aWYgKCF0aGlzLmlzU2Nhbm5pbmcpIHtcblx0XHRcdGF3YWl0IHRoaXMuc2NhblVucmVmZXJlbmNlZEltYWdlcygpO1xuXHRcdH1cblx0fVxuXG5cdGFzeW5jIG9uQ2xvc2UoKSB7XG5cdFx0Ly8gXHU2RTA1XHU3NDA2XHU1REU1XHU0RjVDXG5cdH1cblxuXHRhc3luYyBzY2FuVW5yZWZlcmVuY2VkSW1hZ2VzKCkge1xuXHRcdC8vIFx1NTk4Mlx1Njc5Q1x1ODlDNlx1NTZGRVx1NURGMlx1NTE3M1x1OTVFRFx1NjIxNiBjb250ZW50RWwgXHU0RTBEXHU1M0VGXHU3NTI4XHVGRjBDXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXG5cdFx0aWYgKCF0aGlzLmNvbnRlbnRFbCB8fCB0aGlzLmlzU2Nhbm5pbmcpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmlzU2Nhbm5pbmcgPSB0cnVlO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHQvLyBcdTY2M0VcdTc5M0FcdTYyNkJcdTYzQ0ZcdTRFMkRcdTcyQjZcdTYwMDFcblx0XHRjb25zdCBsb2FkaW5nID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbG9hZGluZy1zdGF0ZScgfSk7XG5cdFx0bG9hZGluZy5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdzcGlubmVyJyB9KTtcblx0XHRsb2FkaW5nLmNyZWF0ZURpdih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NjYW5uaW5nVW5yZWZlcmVuY2VkJykgfSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU3Njg0XHU1NkZFXHU3MjQ3XG5cdFx0XHRjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMucGx1Z2luLmZpbmRVbnJlZmVyZW5jZWQoKTtcblxuXHRcdFx0dGhpcy51bnJlZmVyZW5jZWRJbWFnZXMgPSBmaWxlcy5tYXAoZmlsZSA9PiAoe1xuXHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRwYXRoOiBmaWxlLnBhdGgsXG5cdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0c2l6ZTogZmlsZS5zdGF0LnNpemUsXG5cdFx0XHRcdG1vZGlmaWVkOiBmaWxlLnN0YXQubXRpbWVcblx0XHRcdH0pKTtcblxuXHRcdFx0Ly8gXHU2MzA5XHU1OTI3XHU1QzBGXHU2MzkyXHU1RThGXG5cdFx0XHR0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5zb3J0KChhLCBiKSA9PiBiLnNpemUgLSBhLnNpemUpO1xuXG5cdFx0XHQvLyBcdTZFMzJcdTY3RDNcdTg5QzZcdTU2RkVcblx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdTYyNkJcdTYzQ0ZcdTU2RkVcdTcyNDdcdTY1RjZcdTUxRkFcdTk1MTk6JywgZXJyb3IpO1xuXHRcdFx0dGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHtcblx0XHRcdFx0Y2xzOiAnZXJyb3Itc3RhdGUnLFxuXHRcdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdzY2FuRXJyb3InKVxuXHRcdFx0fSk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHRoaXMuaXNTY2FubmluZyA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdGFzeW5jIHJlbmRlclZpZXcoKSB7XG5cdFx0Ly8gXHU1OTgyXHU2NzlDXHU4OUM2XHU1NkZFXHU1REYyXHU1MTczXHU5NUVEXHU2MjE2IGNvbnRlbnRFbCBcdTRFMERcdTUzRUZcdTc1MjhcdUZGMENcdTc2RjRcdTYzQTVcdThGRDRcdTU2REVcblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5jb250ZW50RWwuZW1wdHkoKTtcblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1NTkzNFx1OTBFOFxuXHRcdHRoaXMucmVuZGVySGVhZGVyKCk7XG5cblx0XHRpZiAodGhpcy51bnJlZmVyZW5jZWRJbWFnZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuXHRcdFx0XHRjbHM6ICdzdWNjZXNzLXN0YXRlJyxcblx0XHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnYWxsTWVkaWFSZWZlcmVuY2VkJylcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1N0VERlx1OEJBMVx1NEZFMVx1NjA2RlxuXHRcdGNvbnN0IHN0YXRzID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnc3RhdHMtYmFyJyB9KTtcblx0XHRzdGF0cy5jcmVhdGVTcGFuKHtcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3VucmVmZXJlbmNlZEZvdW5kJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyh0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5sZW5ndGgpKSxcblx0XHRcdGNsczogJ3N0YXRzLWNvdW50J1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgdG90YWxTaXplID0gdGhpcy51bnJlZmVyZW5jZWRJbWFnZXMucmVkdWNlKChzdW0sIGltZykgPT4gc3VtICsgaW1nLnNpemUsIDApO1xuXHRcdHN0YXRzLmNyZWF0ZVNwYW4oe1xuXHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgndG90YWxTaXplTGFiZWwnKS5yZXBsYWNlKCd7c2l6ZX0nLCBmb3JtYXRGaWxlU2l6ZSh0b3RhbFNpemUpKSxcblx0XHRcdGNsczogJ3N0YXRzLXNpemUnXG5cdFx0fSk7XG5cblx0XHQvLyBcdTUyMUJcdTVFRkFcdTU2RkVcdTcyNDdcdTUyMTdcdTg4Njhcblx0XHRjb25zdCBsaXN0ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAndW5yZWZlcmVuY2VkLWxpc3QnIH0pO1xuXG5cdFx0Zm9yIChjb25zdCBpbWFnZSBvZiB0aGlzLnVucmVmZXJlbmNlZEltYWdlcykge1xuXHRcdFx0dGhpcy5yZW5kZXJJbWFnZUl0ZW0obGlzdCwgaW1hZ2UpO1xuXHRcdH1cblx0fVxuXG5cdHJlbmRlckhlYWRlcigpIHtcblx0XHRjb25zdCBoZWFkZXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICd1bnJlZmVyZW5jZWQtaGVhZGVyJyB9KTtcblxuXHRcdGhlYWRlci5jcmVhdGVFbCgnaDInLCB7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ3VucmVmZXJlbmNlZE1lZGlhJykgfSk7XG5cblx0XHRjb25zdCBkZXNjID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2hlYWRlci1kZXNjcmlwdGlvbicgfSk7XG5cdFx0ZGVzYy5jcmVhdGVTcGFuKHsgdGV4dDogdGhpcy5wbHVnaW4udCgndW5yZWZlcmVuY2VkRGVzYycpIH0pO1xuXG5cdFx0Ly8gXHU5MUNEXHU2NUIwXHU2MjZCXHU2M0NGXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgcmVmcmVzaEJ0biA9IGhlYWRlci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdyZWZyZXNoLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihyZWZyZXNoQnRuLCAncmVmcmVzaC1jdycpO1xuXHRcdHJlZnJlc2hCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnNjYW5VbnJlZmVyZW5jZWRJbWFnZXMoKSk7XG5cblx0XHQvLyBcdTYyNzlcdTkxQ0ZcdTY0Q0RcdTRGNUNcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBhY3Rpb25zID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2hlYWRlci1hY3Rpb25zJyB9KTtcblxuXHRcdGNvbnN0IGNvcHlBbGxCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24nIH0pO1xuXHRcdHNldEljb24oY29weUFsbEJ0biwgJ2NvcHknKTtcblx0XHRjb3B5QWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jb3B5QWxsUGF0aHMoKSk7XG5cblx0XHRjb25zdCBkZWxldGVBbGxCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGRlbGV0ZUFsbEJ0biwgJ3RyYXNoLTInKTtcblx0XHRkZWxldGVBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNvbmZpcm1EZWxldGVBbGwoKSk7XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclRodW1ibmFpbEZhbGxiYWNrKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGljb25OYW1lOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpIHtcblx0XHRjb250YWluZXIuZW1wdHkoKTtcblxuXHRcdGNvbnN0IGZhbGxiYWNrID0gY29udGFpbmVyLmNyZWF0ZURpdigpO1xuXHRcdGZhbGxiYWNrLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRmYWxsYmFjay5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcblx0XHRmYWxsYmFjay5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG5cdFx0ZmFsbGJhY2suc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcblx0XHRmYWxsYmFjay5zdHlsZS5nYXAgPSAnNnB4Jztcblx0XHRmYWxsYmFjay5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LW11dGVkKSc7XG5cblx0XHRjb25zdCBpY29uRWwgPSBmYWxsYmFjay5jcmVhdGVEaXYoKTtcblx0XHRzZXRJY29uKGljb25FbCwgaWNvbk5hbWUpO1xuXG5cdFx0Y29uc3QgbGFiZWxFbCA9IGZhbGxiYWNrLmNyZWF0ZURpdih7IHRleHQ6IGxhYmVsIH0pO1xuXHRcdGxhYmVsRWwuc3R5bGUuZm9udFNpemUgPSAnMC43NWVtJztcblx0XHRsYWJlbEVsLnN0eWxlLnRleHRUcmFuc2Zvcm0gPSAndXBwZXJjYXNlJztcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTWVkaWFUaHVtYm5haWwoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZmlsZTogVEZpbGUsIGRpc3BsYXlOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBtZWRpYVR5cGUgPSBnZXRNZWRpYVR5cGUoZmlsZS5uYW1lKTtcblx0XHRjb25zdCBzcmMgPSB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cblx0XHRpZiAobWVkaWFUeXBlID09PSAnaW1hZ2UnKSB7XG5cdFx0XHRjb25zdCBpbWcgPSBjb250YWluZXIuY3JlYXRlRWwoJ2ltZycsIHtcblx0XHRcdFx0YXR0cjoge1xuXHRcdFx0XHRcdHNyYyxcblx0XHRcdFx0XHRhbHQ6IGRpc3BsYXlOYW1lXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRpbWcuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoKSA9PiB7XG5cdFx0XHRcdGNvbnRhaW5lci5lbXB0eSgpO1xuXHRcdFx0XHRjb250YWluZXIuY3JlYXRlRGl2KHtcblx0XHRcdFx0XHRjbHM6ICdpbWFnZS1lcnJvcicsXG5cdFx0XHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnaW1hZ2VMb2FkRXJyb3InKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICd2aWRlbycpIHtcblx0XHRcdGNvbnN0IHZpZGVvID0gY29udGFpbmVyLmNyZWF0ZUVsKCd2aWRlbycpO1xuXHRcdFx0dmlkZW8uc3JjID0gc3JjO1xuXHRcdFx0dmlkZW8ubXV0ZWQgPSB0cnVlO1xuXHRcdFx0dmlkZW8ucHJlbG9hZCA9ICdtZXRhZGF0YSc7XG5cdFx0XHR2aWRlby5wbGF5c0lubGluZSA9IHRydWU7XG5cdFx0XHR2aWRlby5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0XHRcdHZpZGVvLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRcdHZpZGVvLnN0eWxlLm9iamVjdEZpdCA9ICdjb3Zlcic7XG5cdFx0XHR2aWRlby5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsICd2aWRlbycsICdWSURFTycpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKG1lZGlhVHlwZSA9PT0gJ2F1ZGlvJykge1xuXHRcdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsICdtdXNpYycsICdBVURJTycpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICdkb2N1bWVudCcpIHtcblx0XHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAnZmlsZS10ZXh0JywgJ1BERicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAnZmlsZScsICdGSUxFJyk7XG5cdH1cblxuXHRyZW5kZXJJbWFnZUl0ZW0oY29udGFpbmVyOiBIVE1MRWxlbWVudCwgaW1hZ2U6IFVucmVmZXJlbmNlZEltYWdlKSB7XG5cdFx0Y29uc3QgaXRlbSA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICd1bnJlZmVyZW5jZWQtaXRlbScgfSk7XG5cblx0XHQvLyBcdTU2RkVcdTcyNDdcdTdGMjlcdTc1NjVcdTU2RkVcblx0XHRjb25zdCB0aHVtYm5haWwgPSBpdGVtLmNyZWF0ZURpdih7IGNsczogJ2l0ZW0tdGh1bWJuYWlsJyB9KTtcblx0XHR0aGlzLnJlbmRlck1lZGlhVGh1bWJuYWlsKHRodW1ibmFpbCwgaW1hZ2UuZmlsZSwgaW1hZ2UubmFtZSk7XG5cblx0XHQvLyBcdTU2RkVcdTcyNDdcdTRGRTFcdTYwNkZcblx0XHRjb25zdCBpbmZvID0gaXRlbS5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLWluZm8nIH0pO1xuXHRcdGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1uYW1lJywgdGV4dDogaW1hZ2UubmFtZSB9KTtcblx0XHRpbmZvLmNyZWF0ZURpdih7IGNsczogJ2l0ZW0tcGF0aCcsIHRleHQ6IGltYWdlLnBhdGggfSk7XG5cdFx0aW5mby5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLXNpemUnLCB0ZXh0OiBmb3JtYXRGaWxlU2l6ZShpbWFnZS5zaXplKSB9KTtcblxuXHRcdC8vIFx1NjRDRFx1NEY1Q1x1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IGFjdGlvbnMgPSBpdGVtLmNyZWF0ZURpdih7IGNsczogJ2l0ZW0tYWN0aW9ucycgfSk7XG5cblx0XHQvLyBcdTU3MjhcdTdCMTRcdThCQjBcdTRFMkRcdTY3RTVcdTYyN0VcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBmaW5kQnRuID0gYWN0aW9ucy5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdpdGVtLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihmaW5kQnRuLCAnc2VhcmNoJyk7XG5cdFx0ZmluZEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHRoaXMucGx1Z2luLm9wZW5JbWFnZUluTm90ZXMoaW1hZ2UuZmlsZSk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTU5MERcdTUyMzZcdThERUZcdTVGODRcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBjb3B5QnRuID0gYWN0aW9ucy5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdpdGVtLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihjb3B5QnRuLCAnbGluaycpO1xuXHRcdGNvcHlCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHR2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGltYWdlLnBhdGgpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3BhdGhDb3BpZWQnKSk7XG5cdFx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdlcnJvcicpKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU1MjIwXHU5NjY0XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgZGVsZXRlQnRuID0gYWN0aW9ucy5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdpdGVtLWJ1dHRvbiBkYW5nZXInIH0pO1xuXHRcdHNldEljb24oZGVsZXRlQnRuLCAndHJhc2gtMicpO1xuXHRcdGRlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHRoaXMuY29uZmlybURlbGV0ZShpbWFnZSk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTUzRjNcdTk1MkVcdTgzRENcdTUzNTVcblx0XHRpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbnRleHRtZW51JywgKGUpID0+IHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHRoaXMuc2hvd0NvbnRleHRNZW51KGUgYXMgTW91c2VFdmVudCwgaW1hZ2UuZmlsZSk7XG5cdFx0fSk7XG5cdH1cblxuXHRzaG93Q29udGV4dE1lbnUoZXZlbnQ6IE1vdXNlRXZlbnQsIGZpbGU6IFRGaWxlKSB7XG5cdFx0Y29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG5cblx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRpdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ29wZW5Jbk5vdGVzJykpXG5cdFx0XHRcdC5zZXRJY29uKCdzZWFyY2gnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4ub3BlbkltYWdlSW5Ob3RlcyhmaWxlKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRpdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ2NvcHlQYXRoJykpXG5cdFx0XHRcdC5zZXRJY29uKCdsaW5rJylcblx0XHRcdFx0Lm9uQ2xpY2soKCkgPT4ge1xuXHRcdFx0XHRcdHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoZmlsZS5wYXRoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgncGF0aENvcGllZCcpKTtcblx0XHRcdFx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTkwRFx1NTIzNlx1NTIzMFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnY29weUxpbmsnKSlcblx0XHRcdFx0LnNldEljb24oJ2NvcHknKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgbGluayA9IGBbWyR7ZmlsZS5uYW1lfV1dYDtcblx0XHRcdFx0XHR2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGxpbmspLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdsaW5rQ29waWVkJykpO1xuXHRcdFx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdvcGVuT3JpZ2luYWwnKSlcblx0XHRcdFx0LnNldEljb24oJ2V4dGVybmFsLWxpbmsnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3Qgc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdFx0XHRcdHdpbmRvdy5vcGVuKHNyYywgJ19ibGFuaycsICdub29wZW5lcixub3JlZmVycmVyJyk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRTZXBhcmF0b3IoKTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnZGVsZXRlJykpXG5cdFx0XHRcdC5zZXRJY29uKCd0cmFzaC0yJylcblx0XHRcdFx0Lm9uQ2xpY2soKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGltZyA9IHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLmZpbmQoaSA9PiBpLmZpbGUucGF0aCA9PT0gZmlsZS5wYXRoKVxuXHRcdFx0XHRcdFx0fHwgeyBmaWxlLCBwYXRoOiBmaWxlLnBhdGgsIG5hbWU6IGZpbGUubmFtZSwgc2l6ZTogZmlsZS5zdGF0LnNpemUsIG1vZGlmaWVkOiBmaWxlLnN0YXQubXRpbWUgfTtcblx0XHRcdFx0XHR0aGlzLmNvbmZpcm1EZWxldGUoaW1nKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRtZW51LnNob3dBdFBvc2l0aW9uKHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSB9KTtcblx0fVxuXG5cdGFzeW5jIGNvbmZpcm1EZWxldGUoaW1hZ2U6IFVucmVmZXJlbmNlZEltYWdlKSB7XG5cdFx0bmV3IERlbGV0ZUNvbmZpcm1Nb2RhbChcblx0XHRcdHRoaXMuYXBwLFxuXHRcdFx0dGhpcy5wbHVnaW4sXG5cdFx0XHRbaW1hZ2VdLFxuXHRcdFx0YXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRjb25zdCBzdWNjZXNzID0gYXdhaXQgdGhpcy5wbHVnaW4uc2FmZURlbGV0ZUZpbGUoaW1hZ2UuZmlsZSk7XG5cdFx0XHRcdGlmIChzdWNjZXNzKSB7XG5cdFx0XHRcdFx0Ly8gXHU0RUNFXHU1MjE3XHU4ODY4XHU0RTJEXHU3OUZCXHU5NjY0XG5cdFx0XHRcdFx0dGhpcy51bnJlZmVyZW5jZWRJbWFnZXMgPSB0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5maWx0ZXIoXG5cdFx0XHRcdFx0XHRpbWcgPT4gaW1nLmZpbGUucGF0aCAhPT0gaW1hZ2UuZmlsZS5wYXRoXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHQvLyBcdTkxQ0RcdTY1QjBcdTZFMzJcdTY3RDNcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdCkub3BlbigpO1xuXHR9XG5cblx0YXN5bmMgY29uZmlybURlbGV0ZUFsbCgpIHtcblx0XHRpZiAodGhpcy51bnJlZmVyZW5jZWRJbWFnZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ25vRmlsZXNUb0RlbGV0ZScpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRuZXcgRGVsZXRlQ29uZmlybU1vZGFsKFxuXHRcdFx0dGhpcy5hcHAsXG5cdFx0XHR0aGlzLnBsdWdpbixcblx0XHRcdHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLFxuXHRcdFx0YXN5bmMgKCkgPT4ge1xuXHRcdFx0XHQvLyBcdTRGN0ZcdTc1MjggUHJvbWlzZS5hbGwgXHU1RTc2XHU1M0QxXHU1OTA0XHU3NDA2XHU1MjIwXHU5NjY0XG5cdFx0XHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcblx0XHRcdFx0XHR0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5tYXAoaW1hZ2UgPT4gdGhpcy5wbHVnaW4uc2FmZURlbGV0ZUZpbGUoaW1hZ2UuZmlsZSkpXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0Ly8gXHU3RURGXHU4QkExXHU2MjEwXHU1MjlGXHU1NDhDXHU1OTMxXHU4RDI1XHU3Njg0XHU2NTcwXHU5MUNGXG5cdFx0XHRcdGNvbnN0IGRlbGV0ZWQgPSB0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5maWx0ZXIoKF8sIGkpID0+IHJlc3VsdHNbaV0pLm1hcChpbWcgPT4gaW1nLm5hbWUpO1xuXHRcdFx0XHRjb25zdCBlcnJvcnMgPSB0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5maWx0ZXIoKF8sIGkpID0+ICFyZXN1bHRzW2ldKS5tYXAoaW1nID0+IGltZy5uYW1lKTtcblxuXHRcdFx0XHRpZiAoZGVsZXRlZC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdwcm9jZXNzZWRGaWxlcycpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcoZGVsZXRlZC5sZW5ndGgpKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGVycm9ycy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdwcm9jZXNzZWRGaWxlc0Vycm9yJykucmVwbGFjZSgne2Vycm9yc30nLCBTdHJpbmcoZXJyb3JzLmxlbmd0aCkpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFx1OTFDRFx1NjVCMFx1NjI2Qlx1NjNDRlxuXHRcdFx0XHRhd2FpdCB0aGlzLnNjYW5VbnJlZmVyZW5jZWRJbWFnZXMoKTtcblx0XHRcdH1cblx0XHQpLm9wZW4oKTtcblx0fVxuXG5cdGNvcHlBbGxQYXRocygpIHtcblx0XHRjb25zdCBwYXRocyA9IHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLm1hcChpbWcgPT4gaW1nLnBhdGgpLmpvaW4oJ1xcbicpO1xuXHRcdHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQocGF0aHMpLnRoZW4oKCkgPT4ge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdjb3BpZWRGaWxlUGF0aHMnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLmxlbmd0aCkpKTtcblx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTkwRFx1NTIzNlx1NTIzMFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykpO1xuXHRcdH0pO1xuXHR9XG5cblx0Ly8gXHU1REYyXHU3OUZCXHU5NjY0IGZvcm1hdEZpbGVTaXplIFx1NjVCOVx1NkNENVx1RkYwQ1x1NEY3Rlx1NzUyOCB1dGlscy9mb3JtYXQudHMgXHU0RTJEXHU3Njg0XHU1QjlFXHU3M0IwXG59XG4iLCAiaW1wb3J0IHsgTW9kYWwsIE5vdGljZSwgVEZpbGUgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgSW1hZ2VNYW5hZ2VyUGx1Z2luIGZyb20gJy4uL21haW4nO1xuaW1wb3J0IHsgZm9ybWF0RmlsZVNpemUgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xuXG5pbnRlcmZhY2UgVW5yZWZlcmVuY2VkSW1hZ2Uge1xuXHRmaWxlOiBURmlsZTtcblx0cGF0aDogc3RyaW5nO1xuXHRuYW1lOiBzdHJpbmc7XG5cdHNpemU6IG51bWJlcjtcblx0bW9kaWZpZWQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIERlbGV0ZUNvbmZpcm1Nb2RhbCBleHRlbmRzIE1vZGFsIHtcblx0cGx1Z2luOiBJbWFnZU1hbmFnZXJQbHVnaW47XG5cdGltYWdlczogVW5yZWZlcmVuY2VkSW1hZ2VbXTtcblx0b25Db25maXJtOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuXHRwcml2YXRlIGlzRGVsZXRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRjb25zdHJ1Y3Rvcihcblx0XHRhcHA6IGFueSxcblx0XHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbixcblx0XHRpbWFnZXM6IFVucmVmZXJlbmNlZEltYWdlW10sXG5cdFx0b25Db25maXJtOiAoKSA9PiBQcm9taXNlPHZvaWQ+XG5cdCkge1xuXHRcdHN1cGVyKGFwcCk7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdFx0dGhpcy5pbWFnZXMgPSBpbWFnZXM7XG5cdFx0dGhpcy5vbkNvbmZpcm0gPSBvbkNvbmZpcm07XG5cdH1cblxuXHRvbk9wZW4oKSB7XG5cdFx0Y29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG5cdFx0Y29udGVudEVsLmVtcHR5KCk7XG5cblx0XHQvLyBcdTRGN0ZcdTc1MjhcdTdGRkJcdThCRDFcdTUxRkRcdTY1NzBcblx0XHRjb25zdCB0ID0gKGtleTogc3RyaW5nKSA9PiB0aGlzLnBsdWdpbi50KGtleSk7XG5cblx0XHQvLyBcdTY4MDdcdTk4OThcblx0XHRjb250ZW50RWwuY3JlYXRlRWwoJ2gyJywge1xuXHRcdFx0dGV4dDogdGhpcy5pbWFnZXMubGVuZ3RoID09PSAxXG5cdFx0XHRcdD8gdCgnY29uZmlybURlbGV0ZUZpbGUnKS5yZXBsYWNlKCd7bmFtZX0nLCB0aGlzLmltYWdlc1swXS5uYW1lKVxuXHRcdFx0XHQ6IHQoJ2NvbmZpcm1EZWxldGVTZWxlY3RlZCcpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcodGhpcy5pbWFnZXMubGVuZ3RoKSlcblx0XHR9KTtcblxuXHRcdC8vIFx1OEI2Nlx1NTQ0QVx1NEZFMVx1NjA2RlxuXHRcdGNvbnN0IHdhcm5pbmcgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbW9kYWwtd2FybmluZycgfSk7XG5cdFx0Y29uc3Qgd2FybmluZ1RleHQgPSB3YXJuaW5nLmNyZWF0ZUVsKCdwJyk7XG5cdFx0d2FybmluZ1RleHQudGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VUcmFzaEZvbGRlclxuXHRcdFx0PyB0KCdkZWxldGVUb1RyYXNoJylcblx0XHRcdDogdCgnY29uZmlybUNsZWFyQWxsJyk7XG5cdFx0d2FybmluZ1RleHQuc3R5bGUuY29sb3IgPSAndmFyKC0tdGV4dC13YXJuaW5nKSc7XG5cdFx0d2FybmluZ1RleHQuc3R5bGUubWFyZ2luID0gJzE2cHggMCc7XG5cblx0XHQvLyBcdTY1ODdcdTRFRjZcdTUyMTdcdTg4Njhcblx0XHRjb25zdCBsaXN0Q29udGFpbmVyID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ21vZGFsLWZpbGUtbGlzdCcgfSk7XG5cdFx0bGlzdENvbnRhaW5lci5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6IHQoJ2RlbGV0ZVRvVHJhc2gnKSB9KTtcblxuXHRcdGNvbnN0IGxpc3QgPSBsaXN0Q29udGFpbmVyLmNyZWF0ZUVsKCd1bCcpO1xuXHRcdGNvbnN0IG1heFNob3cgPSAxMDtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IE1hdGgubWluKHRoaXMuaW1hZ2VzLmxlbmd0aCwgbWF4U2hvdyk7IGkrKykge1xuXHRcdFx0Y29uc3QgaW1nID0gdGhpcy5pbWFnZXNbaV07XG5cdFx0XHRsaXN0LmNyZWF0ZUVsKCdsaScsIHtcblx0XHRcdFx0dGV4dDogYCR7aW1nLm5hbWV9ICgke2Zvcm1hdEZpbGVTaXplKGltZy5zaXplKX0pYFxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmltYWdlcy5sZW5ndGggPiBtYXhTaG93KSB7XG5cdFx0XHRsaXN0LmNyZWF0ZUVsKCdsaScsIHtcblx0XHRcdFx0dGV4dDogYC4uLiAke3RoaXMuaW1hZ2VzLmxlbmd0aCAtIG1heFNob3d9ICR7dCgnZmlsZXNTY2FubmVkJyl9YFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU2MzA5XHU5NEFFXHU1MzNBXHU1N0RGXG5cdFx0Y29uc3QgYnV0dG9uQ29udGFpbmVyID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ21vZGFsLWJ1dHRvbnMnIH0pO1xuXHRcdGJ1dHRvbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuXHRcdGJ1dHRvbkNvbnRhaW5lci5zdHlsZS5nYXAgPSAnMTJweCc7XG5cdFx0YnV0dG9uQ29udGFpbmVyLnN0eWxlLmp1c3RpZnlDb250ZW50ID0gJ2ZsZXgtZW5kJztcblx0XHRidXR0b25Db250YWluZXIuc3R5bGUubWFyZ2luVG9wID0gJzIwcHgnO1xuXG5cdFx0Ly8gXHU1M0Q2XHU2RDg4XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgY2FuY2VsQnRuID0gYnV0dG9uQ29udGFpbmVyLmNyZWF0ZUVsKCdidXR0b24nLCB7XG5cdFx0XHR0ZXh0OiB0KCdjYW5jZWwnKSxcblx0XHRcdGNsczogJ21vZC1jdGEnXG5cdFx0fSk7XG5cdFx0Y2FuY2VsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jbG9zZSgpKTtcblxuXHRcdC8vIFx1NTIyMFx1OTY2NFx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IGRlbGV0ZUJ0biA9IGJ1dHRvbkNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywge1xuXHRcdFx0dGV4dDogdGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlVHJhc2hGb2xkZXIgPyB0KCdkZWxldGVUb1RyYXNoJykgOiB0KCdkZWxldGUnKSxcblx0XHRcdGNsczogJ21vZC13YXJuaW5nJ1xuXHRcdH0pO1xuXHRcdGRlbGV0ZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzRGVsZXRpbmcpIHJldHVybjtcblx0XHRcdHRoaXMuaXNEZWxldGluZyA9IHRydWU7XG5cdFx0XHRkZWxldGVCdG4uc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsICd0cnVlJyk7XG5cdFx0XHRkZWxldGVCdG4udGV4dENvbnRlbnQgPSB0KCdwcm9jZXNzaW5nJykgfHwgJ1x1NTkwNFx1NzQwNlx1NEUyRC4uLic7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMub25Db25maXJtKCk7XG5cdFx0XHRcdHRoaXMuY2xvc2UoKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTIyMFx1OTY2NFx1NjRDRFx1NEY1Q1x1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdG5ldyBOb3RpY2UodCgnZGVsZXRlRmFpbGVkJykpO1xuXHRcdFx0XHR0aGlzLmlzRGVsZXRpbmcgPSBmYWxzZTtcblx0XHRcdFx0ZGVsZXRlQnRuLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcblx0XHRcdFx0ZGVsZXRlQnRuLnRleHRDb250ZW50ID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlVHJhc2hGb2xkZXIgPyB0KCdkZWxldGVUb1RyYXNoJykgOiB0KCdkZWxldGUnKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdG9uQ2xvc2UoKSB7XG5cdFx0Y29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG5cdFx0Y29udGVudEVsLmVtcHR5KCk7XG5cdH1cbn1cbiIsICJpbXBvcnQgeyBURmlsZSwgVEZvbGRlciwgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYsIHNldEljb24sIE1lbnUsIE1lbnVJdGVtLCBOb3RpY2UsIE1vZGFsLCBCdXR0b25Db21wb25lbnQgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgSW1hZ2VNYW5hZ2VyUGx1Z2luIGZyb20gJy4uL21haW4nO1xuaW1wb3J0IHsgZm9ybWF0RmlsZVNpemUgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHsgZ2V0TWVkaWFUeXBlIH0gZnJvbSAnLi4vdXRpbHMvbWVkaWFUeXBlcyc7XG5pbXBvcnQgeyBpc1BhdGhTYWZlIH0gZnJvbSAnLi4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgZ2V0RmlsZU5hbWVGcm9tUGF0aCwgbm9ybWFsaXplVmF1bHRQYXRoLCBzYWZlRGVjb2RlVVJJQ29tcG9uZW50IH0gZnJvbSAnLi4vdXRpbHMvcGF0aCc7XG5cbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfVFJBU0hfTUFOQUdFTUVOVCA9ICd0cmFzaC1tYW5hZ2VtZW50LXZpZXcnO1xuXG5pbnRlcmZhY2UgVHJhc2hJdGVtIHtcblx0ZmlsZTogVEZpbGU7XG5cdHBhdGg6IHN0cmluZztcblx0cmF3TmFtZTogc3RyaW5nO1xuXHRuYW1lOiBzdHJpbmc7XG5cdHNpemU6IG51bWJlcjtcblx0bW9kaWZpZWQ6IG51bWJlcjtcblx0b3JpZ2luYWxQYXRoPzogc3RyaW5nO1xuXHRyZWZlcmVuY2VDb3VudDogbnVtYmVyO1xuXHRzZWxlY3RlZDogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIERhc2hib2FyZFN0YXRzIHtcblx0dG90YWxGaWxlczogbnVtYmVyO1xuXHR0b3RhbFNpemU6IG51bWJlcjtcblx0YnlUeXBlOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuXHR1bnJlZmVyZW5jZWRSYXRlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBUcmFzaE1hbmFnZW1lbnRWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0dHJhc2hJdGVtczogVHJhc2hJdGVtW10gPSBbXTtcblx0cHJpdmF0ZSBpc0xvYWRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbikge1xuXHRcdHN1cGVyKGxlYWYpO1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHR9XG5cblx0Z2V0Vmlld1R5cGUoKSB7XG5cdFx0cmV0dXJuIFZJRVdfVFlQRV9UUkFTSF9NQU5BR0VNRU5UO1xuXHR9XG5cblx0Z2V0RGlzcGxheVRleHQoKSB7XG5cdFx0cmV0dXJuIHRoaXMucGx1Z2luLnQoJ3RyYXNoTWFuYWdlbWVudCcpO1xuXHR9XG5cblx0YXN5bmMgb25PcGVuKCkge1xuXHRcdGxldCByZXRyaWVzID0gMDtcblx0XHR3aGlsZSAoIXRoaXMuY29udGVudEVsICYmIHJldHJpZXMgPCAxMCkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7XG5cdFx0XHRyZXRyaWVzKys7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1RyYXNoTWFuYWdlbWVudFZpZXc6IGNvbnRlbnRFbCBub3QgcmVhZHknKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoJ3RyYXNoLW1hbmFnZW1lbnQtdmlldycpO1xuXHRcdGF3YWl0IHRoaXMubG9hZFRyYXNoSXRlbXMoKTtcblx0fVxuXG5cdGFzeW5jIG9uQ2xvc2UoKSB7XG5cdFx0Ly8gXHU2RTA1XHU3NDA2XHU1REU1XHU0RjVDXG5cdH1cblxuXHQvKipcblx0ICogXHU1MkEwXHU4RjdEXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRhc3luYyBsb2FkVHJhc2hJdGVtcygpIHtcblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSByZXR1cm47XG5cdFx0aWYgKHRoaXMuaXNMb2FkaW5nKSByZXR1cm47XG5cdFx0dGhpcy5pc0xvYWRpbmcgPSB0cnVlO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHRjb25zdCBsb2FkaW5nID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbG9hZGluZy1zdGF0ZScgfSk7XG5cdFx0bG9hZGluZy5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdzcGlubmVyJyB9KTtcblx0XHRsb2FkaW5nLmNyZWF0ZURpdih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ2xvYWRpbmdUcmFzaEZpbGVzJykgfSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgdHJhc2hQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMucGx1Z2luLnNldHRpbmdzLnRyYXNoRm9sZGVyKTtcblx0XHRcdGlmICghdHJhc2hQYXRoIHx8ICFpc1BhdGhTYWZlKHRyYXNoUGF0aCkpIHtcblx0XHRcdFx0dGhpcy50cmFzaEl0ZW1zID0gW107XG5cdFx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHRyYXNoRm9sZGVyID0gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aCh0cmFzaFBhdGgpO1xuXHRcdFx0aWYgKCF0cmFzaEZvbGRlciB8fCAhKHRyYXNoRm9sZGVyIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcblx0XHRcdFx0dGhpcy50cmFzaEl0ZW1zID0gW107XG5cdFx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHJlZkNvdW50TWFwID0gdGhpcy5idWlsZFJlZkNvdW50TWFwKCk7XG5cblx0XHRcdHRoaXMudHJhc2hJdGVtcyA9IFtdO1xuXHRcdFx0Zm9yIChjb25zdCBmaWxlIG9mIHRyYXNoRm9sZGVyLmNoaWxkcmVuKSB7XG5cdFx0XHRcdGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcblx0XHRcdFx0XHRjb25zdCBvcmlnaW5hbFBhdGggPSB0aGlzLmV4dHJhY3RPcmlnaW5hbFBhdGgoZmlsZS5uYW1lKTtcblx0XHRcdFx0XHRjb25zdCBkaXNwbGF5TmFtZSA9IG9yaWdpbmFsUGF0aCA/IGdldEZpbGVOYW1lRnJvbVBhdGgob3JpZ2luYWxQYXRoKSB8fCBmaWxlLm5hbWUgOiBmaWxlLm5hbWU7XG5cblx0XHRcdFx0XHQvLyBcdTRFQ0VcdTk4ODRcdTVFRkEgTWFwIFx1NEUyRFx1NjdFNVx1NjI3RVx1NUYxNVx1NzUyOFx1NkIyMVx1NjU3MCBPKDEpXG5cdFx0XHRcdFx0Y29uc3QgcmVmQ291bnQgPSBvcmlnaW5hbFBhdGhcblx0XHRcdFx0XHRcdD8gdGhpcy5sb29rdXBSZWZDb3VudChvcmlnaW5hbFBhdGgsIHJlZkNvdW50TWFwKVxuXHRcdFx0XHRcdFx0OiAwO1xuXG5cdFx0XHRcdFx0dGhpcy50cmFzaEl0ZW1zLnB1c2goe1xuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdHBhdGg6IGZpbGUucGF0aCxcblx0XHRcdFx0XHRcdHJhd05hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0XHRcdG5hbWU6IGRpc3BsYXlOYW1lLFxuXHRcdFx0XHRcdFx0c2l6ZTogZmlsZS5zdGF0LnNpemUsXG5cdFx0XHRcdFx0XHRtb2RpZmllZDogZmlsZS5zdGF0Lm10aW1lLFxuXHRcdFx0XHRcdFx0b3JpZ2luYWxQYXRoLFxuXHRcdFx0XHRcdFx0cmVmZXJlbmNlQ291bnQ6IHJlZkNvdW50LFxuXHRcdFx0XHRcdFx0c2VsZWN0ZWQ6IGZhbHNlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy50cmFzaEl0ZW1zLnNvcnQoKGEsIGIpID0+IGIubW9kaWZpZWQgLSBhLm1vZGlmaWVkKTtcblx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdTUyQTBcdThGN0RcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0dGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHtcblx0XHRcdFx0Y2xzOiAnZXJyb3Itc3RhdGUnLFxuXHRcdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdlcnJvcicpXG5cdFx0XHR9KTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0dGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU0RTAwXHU2QjIxXHU2MDI3XHU5MDREXHU1Mzg2XHU2MjQwXHU2NzA5XHU3QjE0XHU4QkIwXHVGRjBDXHU2Nzg0XHU1RUZBXHU1RjE1XHU3NTI4XHU4QkExXHU2NTcwIE1hcFxuXHQgKiBrZXkgPSBcdTVGNTJcdTRFMDBcdTUzMTZcdTY1ODdcdTRFRjZcdTU0MEQgKGxvd2VyY2FzZSksIHZhbHVlID0gXHU4OEFCXHU1RjE1XHU3NTI4XHU2QjIxXHU2NTcwXG5cdCAqIE8oXHU3QjE0XHU4QkIwXHU2NTcwIFx1MDBENyBcdTVFNzNcdTU3NDcgZW1iZWQgXHU2NTcwKVx1RkYwQ1x1NTNFQVx1NjI2N1x1ODg0Q1x1NEUwMFx1NkIyMVxuXHQgKi9cblx0cHJpdmF0ZSBidWlsZFJlZkNvdW50TWFwKCk6IE1hcDxzdHJpbmcsIG51bWJlcj4ge1xuXHRcdGNvbnN0IGNvdW50TWFwID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuXHRcdGNvbnN0IG1hcmtkb3duRmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG5cdFx0Zm9yIChjb25zdCBtZCBvZiBtYXJrZG93bkZpbGVzKSB7XG5cdFx0XHRjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKG1kKTtcblx0XHRcdGlmICghY2FjaGUpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBlbnRyaWVzID0gWy4uLihjYWNoZS5lbWJlZHMgfHwgW10pLCAuLi4oY2FjaGUubGlua3MgfHwgW10pXTtcblx0XHRcdGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuXHRcdFx0XHRjb25zdCBsaW5rUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChlbnRyeS5saW5rKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRjb25zdCBsaW5rTmFtZSA9IChnZXRGaWxlTmFtZUZyb21QYXRoKGxpbmtQYXRoKSB8fCBsaW5rUGF0aCkudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQvLyBcdTYzMDlcdTVCOENcdTY1NzRcdThERUZcdTVGODRcdTU0OENcdTg4RjhcdTY1ODdcdTRFRjZcdTU0MERcdTUyMDZcdTUyMkJcdTdEMkZcdTUyQTBcblx0XHRcdFx0Y291bnRNYXAuc2V0KGxpbmtQYXRoLCAoY291bnRNYXAuZ2V0KGxpbmtQYXRoKSB8fCAwKSArIDEpO1xuXHRcdFx0XHRpZiAobGlua05hbWUgIT09IGxpbmtQYXRoKSB7XG5cdFx0XHRcdFx0Y291bnRNYXAuc2V0KGxpbmtOYW1lLCAoY291bnRNYXAuZ2V0KGxpbmtOYW1lKSB8fCAwKSArIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvdW50TWFwO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NEVDRVx1OTg4NFx1NUVGQSBNYXAgXHU0RTJEXHU2N0U1XHU4QkUyXHU1RjE1XHU3NTI4XHU2QjIxXHU2NTcwXG5cdCAqL1xuXHRwcml2YXRlIGxvb2t1cFJlZkNvdW50KG9yaWdpbmFsUGF0aDogc3RyaW5nLCByZWZDb3VudE1hcDogTWFwPHN0cmluZywgbnVtYmVyPik6IG51bWJlciB7XG5cdFx0Y29uc3Qgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgob3JpZ2luYWxQYXRoKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGNvbnN0IGZpbGVOYW1lID0gKGdldEZpbGVOYW1lRnJvbVBhdGgobm9ybWFsaXplZFBhdGgpIHx8IG5vcm1hbGl6ZWRQYXRoKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGNvbnN0IGV4YWN0Q291bnQgPSByZWZDb3VudE1hcC5nZXQobm9ybWFsaXplZFBhdGgpIHx8IDA7XG5cdFx0Y29uc3QgbmFtZUNvdW50ID0gcmVmQ291bnRNYXAuZ2V0KGZpbGVOYW1lKSB8fCAwO1xuXG5cdFx0Ly8gXHU1MTdDXHU1QkI5XHU4OEY4XHU2NTg3XHU0RUY2XHU1NDBEXHU0RTBFXHU1QjhDXHU2NTc0XHU4REVGXHU1Rjg0XHU0RTI0XHU3OUNEXHU1MTk5XHU2Q0Q1XHVGRjBDXHU5MDdGXHU1MTREXHU1NDBDXHU0RTAwXHU2NTg3XHU0RUY2XHU0RTBEXHU1NDBDXHU5NEZFXHU2M0E1XHU5OENFXHU2ODNDXHU2NUY2XHU4OEFCXHU0RjRFXHU0RjMwXHUzMDAyXG5cdFx0cmV0dXJuIE1hdGgubWF4KGV4YWN0Q291bnQsIG5hbWVDb3VudCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU0RUNFXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1NDBEXHU0RTJEXHU2M0QwXHU1M0Q2XHU1MzlGXHU1OUNCXHU4REVGXHU1Rjg0XG5cdCAqL1xuXHRwcml2YXRlIGV4dHJhY3RPcmlnaW5hbFBhdGgoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG5cdFx0Y29uc3Qgc2VwYXJhdG9ySW5kZXggPSBmaWxlTmFtZS5pbmRleE9mKCdfXycpO1xuXHRcdGlmIChzZXBhcmF0b3JJbmRleCA9PT0gLTEpIHJldHVybiB1bmRlZmluZWQ7XG5cblx0XHRjb25zdCBlbmNvZGVkUGFydCA9IGZpbGVOYW1lLnN1YnN0cmluZyhzZXBhcmF0b3JJbmRleCArIDIpO1xuXHRcdGlmICghZW5jb2RlZFBhcnQpIHJldHVybiB1bmRlZmluZWQ7XG5cblx0XHRjb25zdCBkZWNvZGVkID0gbm9ybWFsaXplVmF1bHRQYXRoKHNhZmVEZWNvZGVVUklDb21wb25lbnQoZW5jb2RlZFBhcnQpKTtcblx0XHRyZXR1cm4gZGVjb2RlZCB8fCB1bmRlZmluZWQ7XG5cdH1cblxuXHQvKipcblx0ICogXHU4QkExXHU3Qjk3XHU0RUVBXHU4ODY4XHU3NkQ4XHU3RURGXHU4QkExXHU2NTcwXHU2MzZFXG5cdCAqL1xuXHRwcml2YXRlIGNvbXB1dGVTdGF0cygpOiBEYXNoYm9hcmRTdGF0cyB7XG5cdFx0Y29uc3QgYnlUeXBlOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG5cdFx0bGV0IHRvdGFsU2l6ZSA9IDA7XG5cdFx0bGV0IHVucmVmZXJlbmNlZENvdW50ID0gMDtcblxuXHRcdGZvciAoY29uc3QgaXRlbSBvZiB0aGlzLnRyYXNoSXRlbXMpIHtcblx0XHRcdHRvdGFsU2l6ZSArPSBpdGVtLnNpemU7XG5cdFx0XHRjb25zdCB0eXBlID0gZ2V0TWVkaWFUeXBlKGl0ZW0ubmFtZSkgfHwgJ290aGVyJztcblx0XHRcdGJ5VHlwZVt0eXBlXSA9IChieVR5cGVbdHlwZV0gfHwgMCkgKyAxO1xuXHRcdFx0aWYgKGl0ZW0ucmVmZXJlbmNlQ291bnQgPT09IDApIHtcblx0XHRcdFx0dW5yZWZlcmVuY2VkQ291bnQrKztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dG90YWxGaWxlczogdGhpcy50cmFzaEl0ZW1zLmxlbmd0aCxcblx0XHRcdHRvdGFsU2l6ZSxcblx0XHRcdGJ5VHlwZSxcblx0XHRcdHVucmVmZXJlbmNlZFJhdGU6IHRoaXMudHJhc2hJdGVtcy5sZW5ndGggPiAwXG5cdFx0XHRcdD8gTWF0aC5yb3VuZCgodW5yZWZlcmVuY2VkQ291bnQgLyB0aGlzLnRyYXNoSXRlbXMubGVuZ3RoKSAqIDEwMClcblx0XHRcdFx0OiAwXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTg5QzZcdTU2RkVcblx0ICovXG5cdGFzeW5jIHJlbmRlclZpZXcoKSB7XG5cdFx0aWYgKCF0aGlzLmNvbnRlbnRFbCkgcmV0dXJuO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHQvLyBcdTU5MzRcdTkwRThcblx0XHR0aGlzLnJlbmRlckhlYWRlcigpO1xuXG5cdFx0Ly8gXHU0RUVBXHU4ODY4XHU3NkQ4XG5cdFx0aWYgKHRoaXMudHJhc2hJdGVtcy5sZW5ndGggPiAwKSB7XG5cdFx0XHR0aGlzLnJlbmRlckRhc2hib2FyZCgpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnRyYXNoSXRlbXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuXHRcdFx0XHRjbHM6ICdlbXB0eS1zdGF0ZScsXG5cdFx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3RyYXNoRm9sZGVyRW1wdHknKVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU2Mjc5XHU5MUNGXHU2NENEXHU0RjVDXHU1REU1XHU1MTc3XHU2ODBGXG5cdFx0dGhpcy5yZW5kZXJCYXRjaFRvb2xiYXIoKTtcblxuXHRcdC8vIFx1NjU4N1x1NEVGNlx1NTIxN1x1ODg2OFxuXHRcdGNvbnN0IGxpc3QgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICd0cmFzaC1saXN0JyB9KTtcblx0XHRmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy50cmFzaEl0ZW1zKSB7XG5cdFx0XHR0aGlzLnJlbmRlclRyYXNoSXRlbShsaXN0LCBpdGVtKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTMyXHU2N0QzXHU1OTM0XHU5MEU4XG5cdCAqL1xuXHRyZW5kZXJIZWFkZXIoKSB7XG5cdFx0Y29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAndHJhc2gtaGVhZGVyJyB9KTtcblx0XHRoZWFkZXIuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiB0aGlzLnBsdWdpbi50KCd0cmFzaE1hbmFnZW1lbnQnKSB9KTtcblxuXHRcdGNvbnN0IGRlc2MgPSBoZWFkZXIuY3JlYXRlRGl2KHsgY2xzOiAnaGVhZGVyLWRlc2NyaXB0aW9uJyB9KTtcblx0XHRkZXNjLmNyZWF0ZVNwYW4oeyB0ZXh0OiB0aGlzLnBsdWdpbi50KCd0cmFzaE1hbmFnZW1lbnREZXNjJykgfSk7XG5cblx0XHRjb25zdCBhY3Rpb25zID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2hlYWRlci1hY3Rpb25zJyB9KTtcblxuXHRcdC8vIFx1NTIzN1x1NjVCMFx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IHJlZnJlc2hCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3JlZnJlc2gtYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKHJlZnJlc2hCdG4sICdyZWZyZXNoLWN3Jyk7XG5cdFx0cmVmcmVzaEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMubG9hZFRyYXNoSXRlbXMoKSk7XG5cdFx0cmVmcmVzaEJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ3JlZnJlc2gnKTtcblxuXHRcdC8vIFx1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRlx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IHNjYW5CdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24nIH0pO1xuXHRcdHNldEljb24oc2NhbkJ0biwgJ3NoaWVsZC1jaGVjaycpO1xuXHRcdHNjYW5CdG4uY3JlYXRlU3Bhbih7IHRleHQ6IGAgJHt0aGlzLnBsdWdpbi50KCdzYWZlU2NhbicpfWAgfSk7XG5cdFx0c2NhbkJ0bi5kaXNhYmxlZCA9ICF0aGlzLnBsdWdpbi5zZXR0aW5ncy5zYWZlU2NhbkVuYWJsZWQ7XG5cdFx0c2NhbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucnVuU2FmZVNjYW4oKSk7XG5cdFx0c2NhbkJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuRGVzYycpO1xuXG5cdFx0Ly8gXHU2RTA1XHU3QTdBXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgY2xlYXJBbGxCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGNsZWFyQWxsQnRuLCAndHJhc2gtMicpO1xuXHRcdGNsZWFyQWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jb25maXJtQ2xlYXJBbGwoKSk7XG5cdFx0Y2xlYXJBbGxCdG4udGl0bGUgPSB0aGlzLnBsdWdpbi50KCdjbGVhclRyYXNoVG9vbHRpcCcpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1N0VERlx1OEJBMVx1NEVFQVx1ODg2OFx1NzZEOFxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJEYXNoYm9hcmQoKSB7XG5cdFx0Y29uc3Qgc3RhdHMgPSB0aGlzLmNvbXB1dGVTdGF0cygpO1xuXHRcdGNvbnN0IGRhc2hib2FyZCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3RyYXNoLWRhc2hib2FyZCcgfSk7XG5cblx0XHQvLyBcdTUzNjFcdTcyNDcxXHVGRjFBXHU2MDNCXHU2NTg3XHU0RUY2XHU2NTcwXG5cdFx0Y29uc3QgY2FyZEZpbGVzID0gZGFzaGJvYXJkLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1jYXJkJyB9KTtcblx0XHRjb25zdCBmaWxlc0ljb24gPSBjYXJkRmlsZXMuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWljb24nIH0pO1xuXHRcdHNldEljb24oZmlsZXNJY29uLCAnZmlsZXMnKTtcblx0XHRjYXJkRmlsZXMuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLXZhbHVlJywgdGV4dDogU3RyaW5nKHN0YXRzLnRvdGFsRmlsZXMpIH0pO1xuXHRcdGNhcmRGaWxlcy5jcmVhdGVEaXYoeyBjbHM6ICdkYXNoYm9hcmQtbGFiZWwnLCB0ZXh0OiB0aGlzLnBsdWdpbi50KCdmaWxlc0luVHJhc2gnKS5yZXBsYWNlKCd7Y291bnR9JywgJycpIH0pO1xuXG5cdFx0Ly8gXHU1MzYxXHU3MjQ3Mlx1RkYxQVx1NTM2MFx1NzUyOFx1N0E3QVx1OTVGNFxuXHRcdGNvbnN0IGNhcmRTaXplID0gZGFzaGJvYXJkLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1jYXJkJyB9KTtcblx0XHRjb25zdCBzaXplSWNvbiA9IGNhcmRTaXplLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1pY29uJyB9KTtcblx0XHRzZXRJY29uKHNpemVJY29uLCAnaGFyZC1kcml2ZScpO1xuXHRcdGNhcmRTaXplLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC12YWx1ZScsIHRleHQ6IGZvcm1hdEZpbGVTaXplKHN0YXRzLnRvdGFsU2l6ZSkgfSk7XG5cdFx0Y2FyZFNpemUuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWxhYmVsJywgdGV4dDogdGhpcy5wbHVnaW4udCgndG90YWxTaXplJykucmVwbGFjZSgne3NpemV9JywgJycpIH0pO1xuXG5cdFx0Ly8gXHU1MzYxXHU3MjQ3M1x1RkYxQVx1N0M3Qlx1NTc4Qlx1NTIwNlx1NUUwM1xuXHRcdGNvbnN0IGNhcmRUeXBlID0gZGFzaGJvYXJkLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1jYXJkJyB9KTtcblx0XHRjb25zdCB0eXBlSWNvbiA9IGNhcmRUeXBlLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1pY29uJyB9KTtcblx0XHRzZXRJY29uKHR5cGVJY29uLCAncGllLWNoYXJ0Jyk7XG5cdFx0Y29uc3QgdHlwZVBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXHRcdGZvciAoY29uc3QgW3R5cGUsIGNvdW50XSBvZiBPYmplY3QuZW50cmllcyhzdGF0cy5ieVR5cGUpKSB7XG5cdFx0XHR0eXBlUGFydHMucHVzaChgJHt0eXBlfTogJHtjb3VudH1gKTtcblx0XHR9XG5cdFx0Y2FyZFR5cGUuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLXZhbHVlJywgdGV4dDogdHlwZVBhcnRzLmpvaW4oJywgJykgfHwgJy0nIH0pO1xuXHRcdGNhcmRUeXBlLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1sYWJlbCcsIHRleHQ6IHRoaXMucGx1Z2luLnQoJ3R5cGVEaXN0cmlidXRpb24nKSB9KTtcblxuXHRcdC8vIFx1NTM2MVx1NzI0NzRcdUZGMUFcdTY3MkFcdTVGMTVcdTc1MjhcdTczODdcblx0XHRjb25zdCBjYXJkVW5yZWYgPSBkYXNoYm9hcmQuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWNhcmQnIH0pO1xuXHRcdGNvbnN0IHVucmVmSWNvbiA9IGNhcmRVbnJlZi5jcmVhdGVEaXYoeyBjbHM6ICdkYXNoYm9hcmQtaWNvbicgfSk7XG5cdFx0c2V0SWNvbih1bnJlZkljb24sICd1bmxpbmsnKTtcblx0XHRjYXJkVW5yZWYuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLXZhbHVlJywgdGV4dDogYCR7c3RhdHMudW5yZWZlcmVuY2VkUmF0ZX0lYCB9KTtcblx0XHRjYXJkVW5yZWYuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWxhYmVsJywgdGV4dDogdGhpcy5wbHVnaW4udCgndW5yZWZlcmVuY2VkUmF0ZScpIH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NjI3OVx1OTFDRlx1NjRDRFx1NEY1Q1x1NURFNVx1NTE3N1x1NjgwRlxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJCYXRjaFRvb2xiYXIoKSB7XG5cdFx0Y29uc3QgdG9vbGJhciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ2JhdGNoLXRvb2xiYXInIH0pO1xuXG5cdFx0Ly8gXHU1MTY4XHU5MDA5L1x1NTNDRFx1OTAwOVxuXHRcdGNvbnN0IHNlbGVjdEFsbEJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idG4nIH0pO1xuXHRcdHNldEljb24oc2VsZWN0QWxsQnRuLCAnY2hlY2stc3F1YXJlJyk7XG5cdFx0c2VsZWN0QWxsQnRuLmNyZWF0ZVNwYW4oeyB0ZXh0OiBgICR7dGhpcy5wbHVnaW4udCgnc2VsZWN0QWxsJyl9YCB9KTtcblx0XHRzZWxlY3RBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHRjb25zdCBhbGxTZWxlY3RlZCA9IHRoaXMudHJhc2hJdGVtcy5ldmVyeShpID0+IGkuc2VsZWN0ZWQpO1xuXHRcdFx0dGhpcy50cmFzaEl0ZW1zLmZvckVhY2goaSA9PiBpLnNlbGVjdGVkID0gIWFsbFNlbGVjdGVkKTtcblx0XHRcdHRoaXMucmVuZGVyVmlldygpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3Qgc2VsZWN0ZWRDb3VudCA9IHRoaXMudHJhc2hJdGVtcy5maWx0ZXIoaSA9PiBpLnNlbGVjdGVkKS5sZW5ndGg7XG5cdFx0dG9vbGJhci5jcmVhdGVTcGFuKHtcblx0XHRcdGNsczogJ3NlbGVjdGVkLWNvdW50Jyxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NlbGVjdGVkQ291bnQnLCB7IGNvdW50OiBzZWxlY3RlZENvdW50IH0pXG5cdFx0fSk7XG5cblx0XHQvLyBcdTYyNzlcdTkxQ0ZcdTYwNjJcdTU5MERcblx0XHRjb25zdCBiYXRjaFJlc3RvcmVCdG4gPSB0b29sYmFyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3Rvb2xiYXItYnRuIHN1Y2Nlc3MnIH0pO1xuXHRcdHNldEljb24oYmF0Y2hSZXN0b3JlQnRuLCAncm90YXRlLWNjdycpO1xuXHRcdGJhdGNoUmVzdG9yZUJ0bi5jcmVhdGVTcGFuKHsgdGV4dDogYCAke3RoaXMucGx1Z2luLnQoJ2JhdGNoUmVzdG9yZScpfWAgfSk7XG5cdFx0YmF0Y2hSZXN0b3JlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5iYXRjaFJlc3RvcmUoKSk7XG5cblx0XHQvLyBcdTYyNzlcdTkxQ0ZcdTUyMjBcdTk2NjRcblx0XHRjb25zdCBiYXRjaERlbGV0ZUJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idG4gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGJhdGNoRGVsZXRlQnRuLCAndHJhc2gtMicpO1xuXHRcdGJhdGNoRGVsZXRlQnRuLmNyZWF0ZVNwYW4oeyB0ZXh0OiBgICR7dGhpcy5wbHVnaW4udCgnYmF0Y2hEZWxldGUnKX1gIH0pO1xuXHRcdGJhdGNoRGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5iYXRjaERlbGV0ZSgpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTUzNTVcdTRFMkFcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTk4Nzlcblx0ICovXG5cdHJlbmRlclRyYXNoSXRlbShjb250YWluZXI6IEhUTUxFbGVtZW50LCBpdGVtOiBUcmFzaEl0ZW0pIHtcblx0XHRjb25zdCBpdGVtRWwgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBgdHJhc2gtaXRlbSAke2l0ZW0uc2VsZWN0ZWQgPyAnc2VsZWN0ZWQnIDogJyd9YCB9KTtcblxuXHRcdC8vIFx1NTkwRFx1OTAwOVx1Njg0NlxuXHRcdGNvbnN0IGNoZWNrYm94ID0gaXRlbUVsLmNyZWF0ZUVsKCdpbnB1dCcsIHtcblx0XHRcdHR5cGU6ICdjaGVja2JveCcsXG5cdFx0XHRjbHM6ICdpdGVtLWNoZWNrYm94J1xuXHRcdH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cdFx0Y2hlY2tib3guY2hlY2tlZCA9IGl0ZW0uc2VsZWN0ZWQ7XG5cdFx0Y2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuXHRcdFx0aXRlbS5zZWxlY3RlZCA9IGNoZWNrYm94LmNoZWNrZWQ7XG5cdFx0XHRpdGVtRWwudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJywgaXRlbS5zZWxlY3RlZCk7XG5cdFx0XHQvLyBcdTY2RjRcdTY1QjBcdTVERTVcdTUxNzdcdTY4MEZcdThCQTFcdTY1NzBcblx0XHRcdGNvbnN0IHRvb2xiYXIgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKCcuYmF0Y2gtdG9vbGJhciAuc2VsZWN0ZWQtY291bnQnKTtcblx0XHRcdGlmICh0b29sYmFyKSB7XG5cdFx0XHRcdGNvbnN0IGNvdW50ID0gdGhpcy50cmFzaEl0ZW1zLmZpbHRlcihpID0+IGkuc2VsZWN0ZWQpLmxlbmd0aDtcblx0XHRcdFx0dG9vbGJhci50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnQoJ3NlbGVjdGVkQ291bnQnLCB7IGNvdW50IH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU3RjI5XHU3NTY1XHU1NkZFXG5cdFx0Y29uc3QgdGh1bWJFbCA9IGl0ZW1FbC5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLXRodW1ibmFpbCcgfSk7XG5cdFx0dGhpcy5yZW5kZXJJdGVtVGh1bWJuYWlsKHRodW1iRWwsIGl0ZW0pO1xuXG5cdFx0Ly8gXHU2NTg3XHU0RUY2XHU0RkUxXHU2MDZGXG5cdFx0Y29uc3QgaW5mbyA9IGl0ZW1FbC5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLWluZm8nIH0pO1xuXHRcdGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1uYW1lJywgdGV4dDogaXRlbS5uYW1lIH0pO1xuXG5cdFx0aWYgKGl0ZW0ub3JpZ2luYWxQYXRoKSB7XG5cdFx0XHRpbmZvLmNyZWF0ZURpdih7XG5cdFx0XHRcdGNsczogJ2l0ZW0tb3JpZ2luYWwtcGF0aCcsXG5cdFx0XHRcdHRleHQ6IGAke3RoaXMucGx1Z2luLnQoJ29yaWdpbmFsUGF0aCcpfTogJHtpdGVtLm9yaWdpbmFsUGF0aH1gXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCBtZXRhID0gaW5mby5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLW1ldGEnIH0pO1xuXHRcdG1ldGEuY3JlYXRlU3Bhbih7IGNsczogJ2l0ZW0tc2l6ZScsIHRleHQ6IGZvcm1hdEZpbGVTaXplKGl0ZW0uc2l6ZSkgfSk7XG5cdFx0bWV0YS5jcmVhdGVTcGFuKHtcblx0XHRcdGNsczogJ2l0ZW0tZGF0ZScsXG5cdFx0XHR0ZXh0OiBgJHt0aGlzLnBsdWdpbi50KCdkZWxldGVkVGltZScpfTogJHtuZXcgRGF0ZShpdGVtLm1vZGlmaWVkKS50b0xvY2FsZVN0cmluZygpfWBcblx0XHR9KTtcblxuXHRcdC8vIFx1NUYxNVx1NzUyOFx1NkIyMVx1NjU3MFx1NUZCRFx1N0FFMFxuXHRcdGNvbnN0IHJlZkJhZGdlID0gaW5mby5jcmVhdGVTcGFuKHtcblx0XHRcdGNsczogYHJlZi1iYWRnZSAke2l0ZW0ucmVmZXJlbmNlQ291bnQgPiAwID8gJ3JlZi1hY3RpdmUnIDogJ3JlZi16ZXJvJ31gLFxuXHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgncmVmZXJlbmNlZEJ5JywgeyBjb3VudDogaXRlbS5yZWZlcmVuY2VDb3VudCB9KVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU2NENEXHU0RjVDXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgYWN0aW9ucyA9IGl0ZW1FbC5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLWFjdGlvbnMnIH0pO1xuXG5cdFx0Y29uc3QgcmVzdG9yZUJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnaXRlbS1idXR0b24gc3VjY2VzcycgfSk7XG5cdFx0c2V0SWNvbihyZXN0b3JlQnRuLCAncm90YXRlLWNjdycpO1xuXHRcdHJlc3RvcmVCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnJlc3RvcmVGaWxlKGl0ZW0pKTtcblx0XHRyZXN0b3JlQnRuLnRpdGxlID0gdGhpcy5wbHVnaW4udCgncmVzdG9yZVRvb2x0aXAnKTtcblxuXHRcdGNvbnN0IGRlbGV0ZUJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnaXRlbS1idXR0b24gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGRlbGV0ZUJ0biwgJ3RyYXNoLTInKTtcblx0XHRkZWxldGVCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNvbmZpcm1EZWxldGUoaXRlbSkpO1xuXHRcdGRlbGV0ZUJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ3Blcm1hbmVudERlbGV0ZVRvb2x0aXAnKTtcblxuXHRcdC8vIFx1NTNGM1x1OTUyRVx1ODNEQ1x1NTM1NVxuXHRcdGl0ZW1FbC5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIChlKSA9PiB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLnNob3dDb250ZXh0TWVudShlIGFzIE1vdXNlRXZlbnQsIGl0ZW0pO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1Njc2MVx1NzZFRVx1N0YyOVx1NzU2NVx1NTZGRVxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJJdGVtVGh1bWJuYWlsKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGl0ZW06IFRyYXNoSXRlbSkge1xuXHRcdGNvbnN0IG1lZGlhVHlwZSA9IGdldE1lZGlhVHlwZShpdGVtLm5hbWUpO1xuXG5cdFx0aWYgKG1lZGlhVHlwZSA9PT0gJ2ltYWdlJykge1xuXHRcdFx0Y29uc3Qgc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGl0ZW0uZmlsZSk7XG5cdFx0XHRjb25zdCBpbWcgPSBjb250YWluZXIuY3JlYXRlRWwoJ2ltZycsIHtcblx0XHRcdFx0YXR0cjogeyBzcmMsIGFsdDogaXRlbS5uYW1lIH1cblx0XHRcdH0pO1xuXHRcdFx0aW1nLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKCkgPT4ge1xuXHRcdFx0XHRjb250YWluZXIuZW1wdHkoKTtcblx0XHRcdFx0Y29uc3QgaWNvbiA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICd0aHVtYi1pY29uJyB9KTtcblx0XHRcdFx0c2V0SWNvbihpY29uLCAnaW1hZ2UnKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBpY29uTmFtZSA9IG1lZGlhVHlwZSA9PT0gJ3ZpZGVvJyA/ICd2aWRlbycgOlxuXHRcdFx0XHRtZWRpYVR5cGUgPT09ICdhdWRpbycgPyAnbXVzaWMnIDpcblx0XHRcdFx0bWVkaWFUeXBlID09PSAnZG9jdW1lbnQnID8gJ2ZpbGUtdGV4dCcgOiAnZmlsZSc7XG5cdFx0XHRjb25zdCBpY29uID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3RodW1iLWljb24nIH0pO1xuXHRcdFx0c2V0SWNvbihpY29uLCBpY29uTmFtZSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRlx1RkYxQVx1ODFFQVx1NTJBOFx1NjdFNVx1NjI3RVx1NUI2NFx1N0FDQlx1NjU4N1x1NEVGNlx1NUU3Nlx1OTAwMVx1NTE2NVx1OTY5NFx1NzlCQlxuXHQgKi9cblx0YXN5bmMgcnVuU2FmZVNjYW4oKSB7XG5cdFx0Y29uc3Qgc2V0dGluZ3MgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncztcblx0XHRpZiAoIXNldHRpbmdzLnNhZmVTY2FuRW5hYmxlZCkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdzYWZlU2NhbkRlc2MnKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblx0XHRjb25zdCBkYXlNcyA9IDI0ICogNjAgKiA2MCAqIDEwMDA7XG5cdFx0Y29uc3QgY3V0b2ZmVGltZSA9IG5vdyAtIChzZXR0aW5ncy5zYWZlU2NhblVucmVmRGF5cyAqIGRheU1zKTtcblx0XHRjb25zdCBtaW5TaXplID0gc2V0dGluZ3Muc2FmZVNjYW5NaW5TaXplO1xuXG5cdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdzYWZlU2NhblN0YXJ0ZWQnKSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVmZXJlbmNlZEltYWdlcyA9IGF3YWl0IHRoaXMucGx1Z2luLmdldFJlZmVyZW5jZWRJbWFnZXMoKTtcblx0XHRcdGNvbnN0IGFsbE1lZGlhID0gdGhpcy5wbHVnaW4uZmlsZUluZGV4LmlzSW5pdGlhbGl6ZWRcblx0XHRcdFx0PyB0aGlzLnBsdWdpbi5maWxlSW5kZXguZ2V0RmlsZXMoKVxuXHRcdFx0XHRcdC5tYXAoZSA9PiB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZS5wYXRoKSlcblx0XHRcdFx0XHQuZmlsdGVyKChmKTogZiBpcyBURmlsZSA9PiBmIGluc3RhbmNlb2YgVEZpbGUpXG5cdFx0XHRcdDogYXdhaXQgdGhpcy5wbHVnaW4uZ2V0QWxsSW1hZ2VGaWxlcygpO1xuXG5cdFx0XHRjb25zdCB0cmFzaFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgodGhpcy5wbHVnaW4uc2V0dGluZ3MudHJhc2hGb2xkZXIpIHx8ICcnO1xuXHRcdFx0Y29uc3QgY2FuZGlkYXRlczogVEZpbGVbXSA9IFtdO1xuXG5cdFx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgYWxsTWVkaWEpIHtcblx0XHRcdFx0Ly8gXHU2MzkyXHU5NjY0XHU1REYyXHU1NzI4XHU5Njk0XHU3OUJCXHU1MzNBXHU3Njg0XHU2NTg3XHU0RUY2XG5cdFx0XHRcdGlmICh0cmFzaFBhdGggJiYgZmlsZS5wYXRoLnN0YXJ0c1dpdGgodHJhc2hQYXRoICsgJy8nKSkgY29udGludWU7XG5cblx0XHRcdFx0Y29uc3Qgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoZmlsZS5wYXRoKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRjb25zdCBub3JtYWxpemVkTmFtZSA9IGZpbGUubmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRjb25zdCBpc1JlZmVyZW5jZWQgPSByZWZlcmVuY2VkSW1hZ2VzLmhhcyhub3JtYWxpemVkUGF0aCkgfHxcblx0XHRcdFx0XHRyZWZlcmVuY2VkSW1hZ2VzLmhhcyhub3JtYWxpemVkTmFtZSk7XG5cblx0XHRcdFx0aWYgKCFpc1JlZmVyZW5jZWQgJiZcblx0XHRcdFx0XHRmaWxlLnN0YXQubXRpbWUgPCBjdXRvZmZUaW1lICYmXG5cdFx0XHRcdFx0ZmlsZS5zdGF0LnNpemUgPj0gbWluU2l6ZSkge1xuXHRcdFx0XHRcdGNhbmRpZGF0ZXMucHVzaChmaWxlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoY2FuZGlkYXRlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdzYWZlU2Nhbk5vUmVzdWx0cycpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBcdTc4NkVcdThCQTRcdTVCRjlcdThCRERcdTY4NDZcblx0XHRcdGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IHRoaXMuc2hvd0NvbmZpcm1Nb2RhbChcblx0XHRcdFx0dGhpcy5wbHVnaW4udCgnc2FmZVNjYW5Db25maXJtJywge1xuXHRcdFx0XHRcdGNvdW50OiBjYW5kaWRhdGVzLmxlbmd0aCxcblx0XHRcdFx0XHRkYXlzOiBzZXR0aW5ncy5zYWZlU2NhblVucmVmRGF5cyxcblx0XHRcdFx0XHRzaXplOiBmb3JtYXRGaWxlU2l6ZShtaW5TaXplKVxuXHRcdFx0XHR9KVxuXHRcdFx0KTtcblxuXHRcdFx0aWYgKCFjb25maXJtZWQpIHJldHVybjtcblxuXHRcdFx0bGV0IG1vdmVkID0gMDtcblx0XHRcdGZvciAoY29uc3QgZmlsZSBvZiBjYW5kaWRhdGVzKSB7XG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucGx1Z2luLnNhZmVEZWxldGVGaWxlKGZpbGUpO1xuXHRcdFx0XHRpZiAocmVzdWx0KSBtb3ZlZCsrO1xuXHRcdFx0fVxuXG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuQ29tcGxldGUnLCB7IGNvdW50OiBtb3ZlZCB9KSk7XG5cdFx0XHRhd2FpdCB0aGlzLmxvYWRUcmFzaEl0ZW1zKCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuRmFpbGVkJykpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYyNzlcdTkxQ0ZcdTYwNjJcdTU5MERcdTkwMDlcdTRFMkRcdTY1ODdcdTRFRjZcblx0ICovXG5cdGFzeW5jIGJhdGNoUmVzdG9yZSgpIHtcblx0XHRjb25zdCBzZWxlY3RlZCA9IHRoaXMudHJhc2hJdGVtcy5maWx0ZXIoaSA9PiBpLnNlbGVjdGVkKTtcblx0XHRpZiAoc2VsZWN0ZWQubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ25vSXRlbXNTZWxlY3RlZCcpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBjb25maXJtZWQgPSBhd2FpdCB0aGlzLnNob3dDb25maXJtTW9kYWwoXG5cdFx0XHR0aGlzLnBsdWdpbi50KCdjb25maXJtQmF0Y2hSZXN0b3JlJywgeyBjb3VudDogc2VsZWN0ZWQubGVuZ3RoIH0pXG5cdFx0KTtcblx0XHRpZiAoIWNvbmZpcm1lZCkgcmV0dXJuO1xuXG5cdFx0bGV0IHJlc3RvcmVkID0gMDtcblx0XHRmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0ZWQpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGxldCB0YXJnZXRQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKGl0ZW0ub3JpZ2luYWxQYXRoIHx8ICcnKTtcblx0XHRcdFx0aWYgKCF0YXJnZXRQYXRoKSB7XG5cdFx0XHRcdFx0Y29uc3Qgc2VwYXJhdG9ySW5kZXggPSBpdGVtLnJhd05hbWUuaW5kZXhPZignX18nKTtcblx0XHRcdFx0XHRpZiAoc2VwYXJhdG9ySW5kZXggIT09IC0xKSB7XG5cdFx0XHRcdFx0XHR0YXJnZXRQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKFxuXHRcdFx0XHRcdFx0XHRzYWZlRGVjb2RlVVJJQ29tcG9uZW50KGl0ZW0ucmF3TmFtZS5zdWJzdHJpbmcoc2VwYXJhdG9ySW5kZXggKyAyKSlcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHRhcmdldFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoaXRlbS5yYXdOYW1lKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodGFyZ2V0UGF0aCkge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucGx1Z2luLnJlc3RvcmVGaWxlKGl0ZW0uZmlsZSwgdGFyZ2V0UGF0aCk7XG5cdFx0XHRcdFx0aWYgKHJlc3VsdCkgcmVzdG9yZWQrKztcblx0XHRcdFx0fVxuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKGBcdTYwNjJcdTU5MERcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6ICR7aXRlbS5uYW1lfWAsIGVycm9yKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2JhdGNoUmVzdG9yZUNvbXBsZXRlJywgeyBjb3VudDogcmVzdG9yZWQgfSkpO1xuXHRcdGF3YWl0IHRoaXMubG9hZFRyYXNoSXRlbXMoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYyNzlcdTkxQ0ZcdTUyMjBcdTk2NjRcdTkwMDlcdTRFMkRcdTY1ODdcdTRFRjZcblx0ICovXG5cdGFzeW5jIGJhdGNoRGVsZXRlKCkge1xuXHRcdGNvbnN0IHNlbGVjdGVkID0gdGhpcy50cmFzaEl0ZW1zLmZpbHRlcihpID0+IGkuc2VsZWN0ZWQpO1xuXHRcdGlmIChzZWxlY3RlZC5sZW5ndGggPT09IDApIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnbm9JdGVtc1NlbGVjdGVkJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IHRoaXMuc2hvd0NvbmZpcm1Nb2RhbChcblx0XHRcdHRoaXMucGx1Z2luLnQoJ2NvbmZpcm1DbGVhclRyYXNoJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhzZWxlY3RlZC5sZW5ndGgpKVxuXHRcdCk7XG5cdFx0aWYgKCFjb25maXJtZWQpIHJldHVybjtcblxuXHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcblx0XHRcdHNlbGVjdGVkLm1hcChpdGVtID0+XG5cdFx0XHRcdHRoaXMucGx1Z2luLmFwcC52YXVsdC5kZWxldGUoaXRlbS5maWxlKS50aGVuKCgpID0+IHRydWUpLmNhdGNoKCgpID0+IGZhbHNlKVxuXHRcdFx0KVxuXHRcdCk7XG5cblx0XHRjb25zdCBkZWxldGVkID0gcmVzdWx0cy5maWx0ZXIociA9PiByKS5sZW5ndGg7XG5cdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdiYXRjaERlbGV0ZUNvbXBsZXRlJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhkZWxldGVkKSkpO1xuXHRcdGF3YWl0IHRoaXMubG9hZFRyYXNoSXRlbXMoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTY2M0VcdTc5M0FcdTUzRjNcdTk1MkVcdTgzRENcdTUzNTVcblx0ICovXG5cdHNob3dDb250ZXh0TWVudShldmVudDogTW91c2VFdmVudCwgdHJhc2hJdGVtOiBUcmFzaEl0ZW0pIHtcblx0XHRjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuXHRcdG1lbnUuYWRkSXRlbSgobWVudUl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRtZW51SXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdyZXN0b3JlJykpXG5cdFx0XHRcdC5zZXRJY29uKCdyb3RhdGUtY2N3Jylcblx0XHRcdFx0Lm9uQ2xpY2soKCkgPT4gdGhpcy5yZXN0b3JlRmlsZSh0cmFzaEl0ZW0pKTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgobWVudUl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRtZW51SXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdwZXJtYW5lbnREZWxldGUnKSlcblx0XHRcdFx0LnNldEljb24oJ3RyYXNoLTInKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB0aGlzLmNvbmZpcm1EZWxldGUodHJhc2hJdGVtKSk7XG5cdFx0fSk7XG5cblx0XHRtZW51LmFkZFNlcGFyYXRvcigpO1xuXG5cdFx0bWVudS5hZGRJdGVtKChtZW51SXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdG1lbnVJdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ2NvcGllZEZpbGVOYW1lJykpXG5cdFx0XHRcdC5zZXRJY29uKCdjb3B5Jylcblx0XHRcdFx0Lm9uQ2xpY2soKCkgPT4ge1xuXHRcdFx0XHRcdHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodHJhc2hJdGVtLm5hbWUpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdmaWxlTmFtZUNvcGllZCcpKTtcblx0XHRcdFx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTkwRFx1NTIzNlx1NTIzMFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgobWVudUl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRtZW51SXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdjb3BpZWRPcmlnaW5hbFBhdGgnKSlcblx0XHRcdFx0LnNldEljb24oJ2xpbmsnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0aWYgKHRyYXNoSXRlbS5vcmlnaW5hbFBhdGgpIHtcblx0XHRcdFx0XHRcdHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodHJhc2hJdGVtLm9yaWdpbmFsUGF0aCkudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnb3JpZ2luYWxQYXRoQ29waWVkJykpO1xuXHRcdFx0XHRcdFx0fSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTkwRFx1NTIzNlx1NTIzMFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5zaG93QXRQb3NpdGlvbih7IHg6IGV2ZW50LmNsaWVudFgsIHk6IGV2ZW50LmNsaWVudFkgfSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2MDYyXHU1OTBEXHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRhc3luYyByZXN0b3JlRmlsZShpdGVtOiBUcmFzaEl0ZW0pIHtcblx0XHR0cnkge1xuXHRcdFx0bGV0IHRhcmdldFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoaXRlbS5vcmlnaW5hbFBhdGggfHwgJycpO1xuXHRcdFx0aWYgKCF0YXJnZXRQYXRoKSB7XG5cdFx0XHRcdGNvbnN0IHNlcGFyYXRvckluZGV4ID0gaXRlbS5yYXdOYW1lLmluZGV4T2YoJ19fJyk7XG5cdFx0XHRcdGlmIChzZXBhcmF0b3JJbmRleCAhPT0gLTEpIHtcblx0XHRcdFx0XHR0YXJnZXRQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKFxuXHRcdFx0XHRcdFx0c2FmZURlY29kZVVSSUNvbXBvbmVudChpdGVtLnJhd05hbWUuc3Vic3RyaW5nKHNlcGFyYXRvckluZGV4ICsgMikpXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0YXJnZXRQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKGl0ZW0ucmF3TmFtZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCF0YXJnZXRQYXRoKSB7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgncmVzdG9yZUZhaWxlZCcpLnJlcGxhY2UoJ3ttZXNzYWdlfScsIHRoaXMucGx1Z2luLnQoJ2Vycm9yJykpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCByZXN0b3JlZCA9IGF3YWl0IHRoaXMucGx1Z2luLnJlc3RvcmVGaWxlKGl0ZW0uZmlsZSwgdGFyZ2V0UGF0aCk7XG5cdFx0XHRpZiAoIXJlc3RvcmVkKSByZXR1cm47XG5cblx0XHRcdHRoaXMudHJhc2hJdGVtcyA9IHRoaXMudHJhc2hJdGVtcy5maWx0ZXIoaSA9PiBpLmZpbGUucGF0aCAhPT0gaXRlbS5maWxlLnBhdGgpO1xuXHRcdFx0YXdhaXQgdGhpcy5yZW5kZXJWaWV3KCk7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NjA2Mlx1NTkwRFx1NjU4N1x1NEVGNlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3Jlc3RvcmVGYWlsZWQnKS5yZXBsYWNlKCd7bWVzc2FnZX0nLCAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2UpKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2NjNFXHU3OTNBXHU1NkZEXHU5NjQ1XHU1MzE2XHU3ODZFXHU4QkE0XHU1QkY5XHU4QkREXHU2ODQ2XG5cdCAqL1xuXHRwcml2YXRlIHNob3dDb25maXJtTW9kYWwobWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRjb25zdCBtb2RhbCA9IG5ldyBNb2RhbCh0aGlzLnBsdWdpbi5hcHApO1xuXHRcdFx0bGV0IHJlc29sdmVkID0gZmFsc2U7XG5cblx0XHRcdG1vZGFsLm9uQ2xvc2UgPSAoKSA9PiB7XG5cdFx0XHRcdGlmICghcmVzb2x2ZWQpIHtcblx0XHRcdFx0XHRyZXNvbHZlZCA9IHRydWU7XG5cdFx0XHRcdFx0cmVzb2x2ZShmYWxzZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdG1vZGFsLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdjb25maXJtLW1vZGFsLWNvbnRlbnQnIH0sIChlbCkgPT4ge1xuXHRcdFx0XHRlbC5jcmVhdGVEaXYoeyB0ZXh0OiBtZXNzYWdlLCBjbHM6ICdjb25maXJtLW1vZGFsLW1lc3NhZ2UnIH0pO1xuXHRcdFx0XHRlbC5jcmVhdGVEaXYoeyBjbHM6ICdjb25maXJtLW1vZGFsLWJ1dHRvbnMnIH0sIChidXR0b25zRWwpID0+IHtcblx0XHRcdFx0XHRjb25zdCBjYW5jZWxCdG4gPSBuZXcgQnV0dG9uQ29tcG9uZW50KGJ1dHRvbnNFbCk7XG5cdFx0XHRcdFx0Y2FuY2VsQnRuLnNldEJ1dHRvblRleHQodGhpcy5wbHVnaW4udCgnY2FuY2VsJykpO1xuXHRcdFx0XHRcdGNhbmNlbEJ0bi5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRcdHJlc29sdmVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdG1vZGFsLmNsb3NlKCk7XG5cdFx0XHRcdFx0XHRyZXNvbHZlKGZhbHNlKTtcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGNvbnN0IGNvbmZpcm1CdG4gPSBuZXcgQnV0dG9uQ29tcG9uZW50KGJ1dHRvbnNFbCk7XG5cdFx0XHRcdFx0Y29uZmlybUJ0bi5zZXRCdXR0b25UZXh0KHRoaXMucGx1Z2luLnQoJ2NvbmZpcm0nKSk7XG5cdFx0XHRcdFx0Y29uZmlybUJ0bi5zZXRDdGEoKTtcblx0XHRcdFx0XHRjb25maXJtQnRuLm9uQ2xpY2soKCkgPT4ge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0bW9kYWwuY2xvc2UoKTtcblx0XHRcdFx0XHRcdHJlc29sdmUodHJ1ZSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdG1vZGFsLm9wZW4oKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTc4NkVcdThCQTRcdTUyMjBcdTk2NjRcdTUzNTVcdTRFMkFcdTY1ODdcdTRFRjZcblx0ICovXG5cdGFzeW5jIGNvbmZpcm1EZWxldGUoaXRlbTogVHJhc2hJdGVtKSB7XG5cdFx0Y29uc3QgY29uZmlybWVkID0gYXdhaXQgdGhpcy5zaG93Q29uZmlybU1vZGFsKFxuXHRcdFx0dGhpcy5wbHVnaW4udCgnY29uZmlybURlbGV0ZUZpbGUnKS5yZXBsYWNlKCd7bmFtZX0nLCBpdGVtLm5hbWUpXG5cdFx0KTtcblxuXHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLmFwcC52YXVsdC5kZWxldGUoaXRlbS5maWxlKTtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdmaWxlRGVsZXRlZCcpLnJlcGxhY2UoJ3tuYW1lfScsIGl0ZW0ubmFtZSkpO1xuXHRcdFx0XHR0aGlzLnRyYXNoSXRlbXMgPSB0aGlzLnRyYXNoSXRlbXMuZmlsdGVyKGkgPT4gaS5maWxlLnBhdGggIT09IGl0ZW0uZmlsZS5wYXRoKTtcblx0XHRcdFx0YXdhaXQgdGhpcy5yZW5kZXJWaWV3KCk7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdcdTUyMjBcdTk2NjRcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2RlbGV0ZUZhaWxlZCcpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU3ODZFXHU4QkE0XHU2RTA1XHU3QTdBXHU2MjQwXHU2NzA5XHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRhc3luYyBjb25maXJtQ2xlYXJBbGwoKSB7XG5cdFx0aWYgKHRoaXMudHJhc2hJdGVtcy5sZW5ndGggPT09IDApIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgndHJhc2hFbXB0eScpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBjb25maXJtZWQgPSBhd2FpdCB0aGlzLnNob3dDb25maXJtTW9kYWwoXG5cdFx0XHR0aGlzLnBsdWdpbi50KCdjb25maXJtQ2xlYXJUcmFzaCcpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcodGhpcy50cmFzaEl0ZW1zLmxlbmd0aCkpXG5cdFx0KTtcblxuXHRcdGlmIChjb25maXJtZWQpIHtcblx0XHRcdGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChcblx0XHRcdFx0dGhpcy50cmFzaEl0ZW1zLm1hcChpdGVtID0+XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uYXBwLnZhdWx0LmRlbGV0ZShpdGVtLmZpbGUpLnRoZW4oKCkgPT4gdHJ1ZSkuY2F0Y2goKCkgPT4gZmFsc2UpXG5cdFx0XHRcdClcblx0XHRcdCk7XG5cblx0XHRcdGNvbnN0IGRlbGV0ZWQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIpLmxlbmd0aDtcblx0XHRcdGNvbnN0IGVycm9ycyA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gIXIpLmxlbmd0aDtcblxuXHRcdFx0aWYgKGRlbGV0ZWQgPiAwKSB7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnYmF0Y2hEZWxldGVDb21wbGV0ZScpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcoZGVsZXRlZCkpKTtcblx0XHRcdH1cblx0XHRcdGlmIChlcnJvcnMgPiAwKSB7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnYmF0Y2hEZWxldGVDb21wbGV0ZScpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcoZXJyb3JzKSkgKyAnICgnICsgdGhpcy5wbHVnaW4udCgnZXJyb3InKSArICcpJyk7XG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IHRoaXMubG9hZFRyYXNoSXRlbXMoKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU4M0I3XHU1M0Q2XHU2NTg3XHU0RUY2XHU1NkZFXHU2ODA3XG5cdCAqL1xuXHRwcml2YXRlIGdldEZpbGVJY29uKGV4dDogc3RyaW5nKTogc3RyaW5nIHtcblx0XHRjb25zdCBtZWRpYVR5cGUgPSBnZXRNZWRpYVR5cGUoYGZpbGVuYW1lLiR7ZXh0fWApO1xuXHRcdHN3aXRjaCAobWVkaWFUeXBlKSB7XG5cdFx0XHRjYXNlICdpbWFnZSc6IHJldHVybiAnaW1hZ2UnO1xuXHRcdFx0Y2FzZSAndmlkZW8nOiByZXR1cm4gJ3ZpZGVvJztcblx0XHRcdGNhc2UgJ2F1ZGlvJzogcmV0dXJuICdtdXNpYyc7XG5cdFx0XHRjYXNlICdkb2N1bWVudCc6IHJldHVybiAnZmlsZS10ZXh0Jztcblx0XHRcdGRlZmF1bHQ6IHJldHVybiAnZmlsZSc7XG5cdFx0fVxuXHR9XG59XG4iLCAiLyoqXG4gKiBcdTVCODlcdTUxNjhcdTVERTVcdTUxNzdcdTUxRkRcdTY1NzBcbiAqL1xuXG4vKipcbiAqIFx1NjgyMVx1OUE4Q1x1OERFRlx1NUY4NFx1NjYyRlx1NTQyNlx1NUI4OVx1NTE2OFx1RkYwOFx1NjVFMFx1OTA0RFx1NTM4Nlx1NUU4Rlx1NTIxN1x1MzAwMVx1OTc1RVx1N0VERFx1NUJGOVx1OERFRlx1NUY4NFx1RkYwOVxuICogXHU1MTQ4XHU1MDVBIFVSTCBcdTg5RTNcdTc4MDFcdTRFRTVcdTk2MzIgJTJlJTJlIFx1N0I0OVx1N0YxNlx1NzgwMVx1N0VENVx1OEZDN1xuICovXG5leHBvcnQgZnVuY3Rpb24gaXNQYXRoU2FmZShmaWxlUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG5cdGlmICghZmlsZVBhdGggfHwgIWZpbGVQYXRoLnRyaW0oKSkgcmV0dXJuIGZhbHNlO1xuXHR0cnkge1xuXHRcdGNvbnN0IGRlY29kZWQgPSBkZWNvZGVVUklDb21wb25lbnQoZmlsZVBhdGgpO1xuXHRcdGNvbnN0IG5vcm1hbGl6ZWQgPSBkZWNvZGVkLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblx0XHRpZiAobm9ybWFsaXplZC5zdGFydHNXaXRoKCcvJykgfHwgL15bYS16QS1aXTovLnRlc3Qobm9ybWFsaXplZCkpIHJldHVybiBmYWxzZTtcblx0XHRpZiAobm9ybWFsaXplZC5pbmNsdWRlcygnXFwwJykpIHJldHVybiBmYWxzZTtcblx0XHRjb25zdCBwYXJ0cyA9IG5vcm1hbGl6ZWQuc3BsaXQoJy8nKTtcblx0XHRyZXR1cm4gcGFydHMuZXZlcnkocGFydCA9PiBwYXJ0ICE9PSAnLi4nICYmIHBhcnQgIT09ICcuJyk7XG5cdH0gY2F0Y2gge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG4vKipcbiAqIFx1NjgyMVx1OUE4QyBVUkwgXHU1MzRGXHU4QkFFXHU2NjJGXHU1NDI2XHU1Qjg5XHU1MTY4XG4gKiBcdTUxNDFcdThCQjggaHR0cC9odHRwcyBcdTU0OENcdTY1RTBcdTUzNEZcdThCQUVcdTUyNERcdTdGMDBcdTc2ODRcdTUxODVcdTkwRThcdThERUZcdTVGODRcdUZGMENcdTYyRTZcdTYyMkEgamF2YXNjcmlwdDovZGF0YTovdmJzY3JpcHQ6IFx1N0I0OVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTYWZlVXJsKHVybDogc3RyaW5nKTogYm9vbGVhbiB7XG5cdGlmICghdXJsIHx8ICF1cmwudHJpbSgpKSByZXR1cm4gZmFsc2U7XG5cdGNvbnN0IHRyaW1tZWQgPSB1cmwudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG5cdGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoJ2h0dHA6Ly8nKSB8fCB0cmltbWVkLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykpIHJldHVybiB0cnVlO1xuXHRpZiAodHJpbW1lZC5zdGFydHNXaXRoKCdqYXZhc2NyaXB0OicpIHx8IHRyaW1tZWQuc3RhcnRzV2l0aCgnZGF0YTonKSB8fCB0cmltbWVkLnN0YXJ0c1dpdGgoJ3Zic2NyaXB0OicpKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiAhdHJpbW1lZC5pbmNsdWRlcygnOicpO1xufVxuXG4vKipcbiAqIFx1OEY2Q1x1NEU0OVx1NUI1N1x1N0IyNlx1NEUzMlx1NzUyOFx1NEU4RSBIVE1MIFx1NUM1RVx1NjAyN1x1RkYwQ1x1OTYzMlx1NkI2Mlx1NUM1RVx1NjAyN1x1NkNFOFx1NTE2NVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlSHRtbEF0dHIoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHJldHVybiAnJztcblx0cmV0dXJuIHN0clxuXHRcdC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG5cdFx0LnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuXHRcdC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG5cdFx0LnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuXHRcdC5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG59XG4iLCAiLyoqXG4gKiBcdTkxQ0RcdTU5MERcdTY1ODdcdTRFRjZcdTY4QzBcdTZENEJcdTg5QzZcdTU2RkVcbiAqIFx1NEY3Rlx1NzUyOFx1NjExRlx1NzdFNVx1NTRDOFx1NUUwQ1x1NUI5RVx1NzNCMFx1NTBDRlx1N0QyMFx1N0VBN1x1NTZGRVx1NzI0N1x1NTNCQlx1OTFDRFxuICovXG5cbmltcG9ydCB7IFRGaWxlLCBJdGVtVmlldywgV29ya3NwYWNlTGVhZiwgc2V0SWNvbiwgTm90aWNlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IEltYWdlTWFuYWdlclBsdWdpbiBmcm9tICcuLi9tYWluJztcbmltcG9ydCB7IGZvcm1hdEZpbGVTaXplIH0gZnJvbSAnLi4vdXRpbHMvZm9ybWF0JztcbmltcG9ydCB7IGdldE1lZGlhVHlwZSB9IGZyb20gJy4uL3V0aWxzL21lZGlhVHlwZXMnO1xuaW1wb3J0IHsgY29tcHV0ZVBlcmNlcHR1YWxIYXNoLCBmaW5kRHVwbGljYXRlR3JvdXBzLCBEdXBsaWNhdGVHcm91cCB9IGZyb20gJy4uL3V0aWxzL3BlcmNlcHR1YWxIYXNoJztcblxuZXhwb3J0IGNvbnN0IFZJRVdfVFlQRV9EVVBMSUNBVEVfREVURUNUSU9OID0gJ2R1cGxpY2F0ZS1kZXRlY3Rpb24tdmlldyc7XG5cbmV4cG9ydCBjbGFzcyBEdXBsaWNhdGVEZXRlY3Rpb25WaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0cHJpdmF0ZSBkdXBsaWNhdGVHcm91cHM6IER1cGxpY2F0ZUdyb3VwW10gPSBbXTtcblx0cHJpdmF0ZSBpc1NjYW5uaW5nOiBib29sZWFuID0gZmFsc2U7XG5cdHByaXZhdGUgc2NhblByb2dyZXNzOiB7IGN1cnJlbnQ6IG51bWJlcjsgdG90YWw6IG51bWJlciB9ID0geyBjdXJyZW50OiAwLCB0b3RhbDogMCB9O1xuXHRwcml2YXRlIGxhc3RQcm9ncmVzc0F0OiBudW1iZXIgPSAwO1xuXG5cdGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luKSB7XG5cdFx0c3VwZXIobGVhZik7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblxuXHRnZXRWaWV3VHlwZSgpIHtcblx0XHRyZXR1cm4gVklFV19UWVBFX0RVUExJQ0FURV9ERVRFQ1RJT047XG5cdH1cblxuXHRnZXREaXNwbGF5VGV4dCgpIHtcblx0XHRyZXR1cm4gdGhpcy5wbHVnaW4udCgnZHVwbGljYXRlRGV0ZWN0aW9uJyk7XG5cdH1cblxuXHRhc3luYyBvbk9wZW4oKSB7XG5cdFx0bGV0IHJldHJpZXMgPSAwO1xuXHRcdHdoaWxlICghdGhpcy5jb250ZW50RWwgJiYgcmV0cmllcyA8IDEwKSB7XG5cdFx0XHRhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTApKTtcblx0XHRcdHJldHJpZXMrKztcblx0XHR9XG5cdFx0aWYgKCF0aGlzLmNvbnRlbnRFbCkge1xuXHRcdFx0Y29uc29sZS5lcnJvcignRHVwbGljYXRlRGV0ZWN0aW9uVmlldzogY29udGVudEVsIG5vdCByZWFkeScpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHQvLyBFbnN1cmUgc3R5bGVzIGV4aXN0IGV2ZW4gaWYgZXh0ZXJuYWwgc3R5bGVzaGVldCB3YXMgcmVtb3ZlZCBvciBub3QgbG9hZGVkLlxuXHRcdHRoaXMuZW5zdXJlU3R5bGVzKCk7XG5cdFx0Ly8gUmVzZXQgc2NhbiBzdGF0ZSBvbiByZW9wZW4gdG8gYXZvaWQgc3RhbGUgXCJpc1NjYW5uaW5nXCIgYmxvY2tpbmcgdGhlIFVJLlxuXHRcdHRoaXMuaXNTY2FubmluZyA9IGZhbHNlO1xuXHRcdHRoaXMuc2NhblByb2dyZXNzID0geyBjdXJyZW50OiAwLCB0b3RhbDogMCB9O1xuXHRcdHRoaXMuY29udGVudEVsLmFkZENsYXNzKCdkdXBsaWNhdGUtZGV0ZWN0aW9uLXZpZXcnKTtcblx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0fVxuXG5cdGFzeW5jIG9uQ2xvc2UoKSB7XG5cdFx0dGhpcy5pc1NjYW5uaW5nID0gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTMyXHU2N0QzXHU4OUM2XHU1NkZFXG5cdCAqL1xuXHRhc3luYyByZW5kZXJWaWV3KCkge1xuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHJldHVybjtcblx0XHR0aGlzLmVuc3VyZVN0eWxlcygpO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHR0aGlzLnJlbmRlckhlYWRlcigpO1xuXG5cdFx0aWYgKHRoaXMuaXNTY2FubmluZykge1xuXHRcdFx0dGhpcy5yZW5kZXJQcm9ncmVzcygpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5sZW5ndGggPT09IDApIHtcblx0XHRcdGNvbnN0IGVtcHR5U3RhdGUgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZW1wdHktc3RhdGUnIH0pO1xuXHRcdFx0ZW1wdHlTdGF0ZS5jcmVhdGVEaXYoe1xuXHRcdFx0XHRjbHM6ICdkdXBsaWNhdGUtZW1wdHktdGV4dCcsXG5cdFx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ25vRHVwbGljYXRlc0ZvdW5kJylcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5yZW5kZXJTdGFydFNjYW5CdXR0b24oZW1wdHlTdGF0ZSwgJ2R1cGxpY2F0ZS1lbXB0eS1hY3Rpb24nKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBcdTdFREZcdThCQTFcblx0XHRjb25zdCB0b3RhbER1cGxpY2F0ZXMgPSB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5yZWR1Y2UoXG5cdFx0XHQoc3VtLCBnKSA9PiBzdW0gKyBnLmZpbGVzLmxlbmd0aCAtIDEsIDBcblx0XHQpO1xuXHRcdGNvbnN0IHN0YXRzQmFyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLXN0YXRzLWJhcicgfSk7XG5cdFx0c3RhdHNCYXIuY3JlYXRlU3Bhbih7XG5cdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdkdXBsaWNhdGVHcm91cHNGb3VuZCcsIHtcblx0XHRcdFx0Z3JvdXBzOiB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5sZW5ndGgsXG5cdFx0XHRcdGZpbGVzOiB0b3RhbER1cGxpY2F0ZXNcblx0XHRcdH0pLFxuXHRcdFx0Y2xzOiAnZHVwbGljYXRlLXN0YXRzLWNvdW50J1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU0RTAwXHU5NTJFXHU2RTA1XHU3NDA2XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgY2xlYW5BbGxCdG4gPSBzdGF0c0Jhci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdkdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihjbGVhbkFsbEJ0biwgJ2Jyb29tJyk7XG5cdFx0Y2xlYW5BbGxCdG4uY3JlYXRlU3Bhbih7IHRleHQ6IGAgJHt0aGlzLnBsdWdpbi50KCdxdWFyYW50aW5lQWxsRHVwbGljYXRlcycpfWAgfSk7XG5cdFx0Y2xlYW5BbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnF1YXJhbnRpbmVBbGxEdXBsaWNhdGVzKCkpO1xuXG5cdFx0Ly8gXHU2RTMyXHU2N0QzXHU5MUNEXHU1OTBEXHU3RUM0XG5cdFx0Y29uc3QgZ3JvdXBzQ29udGFpbmVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWdyb3VwcycgfSk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5yZW5kZXJEdXBsaWNhdGVHcm91cChncm91cHNDb250YWluZXIsIHRoaXMuZHVwbGljYXRlR3JvdXBzW2ldLCBpICsgMSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NTkzNFx1OTBFOFxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJIZWFkZXIoKSB7XG5cdFx0Y29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWhlYWRlcicgfSk7XG5cdFx0aGVhZGVyLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy5wbHVnaW4udCgnZHVwbGljYXRlRGV0ZWN0aW9uJykgfSk7XG5cblx0XHRjb25zdCBkZXNjID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1oZWFkZXItZGVzY3JpcHRpb24nIH0pO1xuXHRcdGRlc2MuY3JlYXRlU3Bhbih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ2R1cGxpY2F0ZURldGVjdGlvbkRlc2MnKSB9KTtcblxuXHRcdGNvbnN0IGFjdGlvbnMgPSBoZWFkZXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWhlYWRlci1hY3Rpb25zJyB9KTtcblx0XHR0aGlzLnJlbmRlclN0YXJ0U2NhbkJ1dHRvbihhY3Rpb25zKTtcblxuXHRcdC8vIFx1OTYwOFx1NTAzQ1x1NjYzRVx1NzkzQVxuXHRcdGFjdGlvbnMuY3JlYXRlU3Bhbih7XG5cdFx0XHRjbHM6ICdkdXBsaWNhdGUtdGhyZXNob2xkLWxhYmVsJyxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NpbWlsYXJpdHlUaHJlc2hvbGQnLCB7XG5cdFx0XHRcdHZhbHVlOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kdXBsaWNhdGVUaHJlc2hvbGRcblx0XHRcdH0pXG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclN0YXJ0U2NhbkJ1dHRvbihjb250YWluZXI6IEhUTUxFbGVtZW50LCBleHRyYUNsYXNzPzogc3RyaW5nKSB7XG5cdFx0Y29uc3QgY2xzID0gWydkdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbicsICdkdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbi1wcmltYXJ5J107XG5cdFx0aWYgKGV4dHJhQ2xhc3MpIGNscy5wdXNoKGV4dHJhQ2xhc3MpO1xuXG5cdFx0Y29uc3Qgc2NhbkJ0biA9IGNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6IGNscy5qb2luKCcgJykgfSk7XG5cdFx0c2V0SWNvbihzY2FuQnRuLCAnc2VhcmNoJyk7XG5cdFx0c2NhbkJ0bi5jcmVhdGVTcGFuKHsgdGV4dDogYCAke3RoaXMucGx1Z2luLnQoJ3N0YXJ0U2NhbicpfWAgfSk7XG5cdFx0c2NhbkJ0bi5kaXNhYmxlZCA9IHRoaXMuaXNTY2FubmluZztcblx0XHRzY2FuQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dm9pZCB0aGlzLnN0YXJ0U2NhbigpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBzY2FuQnRuO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NjI2Qlx1NjNDRlx1OEZEQlx1NUVBNlxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJQcm9ncmVzcygpIHtcblx0XHRjb25zdCBwcm9ncmVzc0NvbnRhaW5lciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1zY2FuLXByb2dyZXNzJyB9KTtcblxuXHRcdGNvbnN0IHByb2dyZXNzQmFyID0gcHJvZ3Jlc3NDb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLXByb2dyZXNzLWJhcicgfSk7XG5cdFx0Y29uc3QgcHJvZ3Jlc3NGaWxsID0gcHJvZ3Jlc3NCYXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLXByb2dyZXNzLWZpbGwnIH0pO1xuXHRcdGNvbnN0IHBlcmNlbnQgPSB0aGlzLnNjYW5Qcm9ncmVzcy50b3RhbCA+IDBcblx0XHRcdD8gTWF0aC5yb3VuZCgodGhpcy5zY2FuUHJvZ3Jlc3MuY3VycmVudCAvIHRoaXMuc2NhblByb2dyZXNzLnRvdGFsKSAqIDEwMClcblx0XHRcdDogMDtcblx0XHRwcm9ncmVzc0ZpbGwuc3R5bGUud2lkdGggPSBgJHtwZXJjZW50fSVgO1xuXG5cdFx0cHJvZ3Jlc3NDb250YWluZXIuY3JlYXRlRGl2KHtcblx0XHRcdGNsczogJ2R1cGxpY2F0ZS1wcm9ncmVzcy10ZXh0Jyxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NjYW5Qcm9ncmVzcycsIHtcblx0XHRcdFx0Y3VycmVudDogdGhpcy5zY2FuUHJvZ3Jlc3MuY3VycmVudCxcblx0XHRcdFx0dG90YWw6IHRoaXMuc2NhblByb2dyZXNzLnRvdGFsXG5cdFx0XHR9KVxuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBjb21wYXJlRHVwbGljYXRlRmlsZXMocGF0aEE6IHN0cmluZywgcGF0aEI6IHN0cmluZyk6IG51bWJlciB7XG5cdFx0Y29uc3QgZmlsZUEgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aEEpO1xuXHRcdGNvbnN0IGZpbGVCID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGhCKTtcblxuXHRcdGlmIChmaWxlQSBpbnN0YW5jZW9mIFRGaWxlICYmIGZpbGVCIGluc3RhbmNlb2YgVEZpbGUpIHtcblx0XHRcdHJldHVybiAoZmlsZUIuc3RhdC5tdGltZSAtIGZpbGVBLnN0YXQubXRpbWUpXG5cdFx0XHRcdHx8IChmaWxlQi5zdGF0LnNpemUgLSBmaWxlQS5zdGF0LnNpemUpXG5cdFx0XHRcdHx8IHBhdGhBLmxvY2FsZUNvbXBhcmUocGF0aEIpO1xuXHRcdH1cblx0XHRpZiAoZmlsZUEgaW5zdGFuY2VvZiBURmlsZSkgcmV0dXJuIC0xO1xuXHRcdGlmIChmaWxlQiBpbnN0YW5jZW9mIFRGaWxlKSByZXR1cm4gMTtcblx0XHRyZXR1cm4gcGF0aEEubG9jYWxlQ29tcGFyZShwYXRoQik7XG5cdH1cblxuXHRwcml2YXRlIG5vcm1hbGl6ZUR1cGxpY2F0ZUdyb3VwKGdyb3VwOiBEdXBsaWNhdGVHcm91cCk6IER1cGxpY2F0ZUdyb3VwIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Li4uZ3JvdXAsXG5cdFx0XHRmaWxlczogWy4uLmdyb3VwLmZpbGVzXS5zb3J0KChhLCBiKSA9PiB0aGlzLmNvbXBhcmVEdXBsaWNhdGVGaWxlcyhhLnBhdGgsIGIucGF0aCkpXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTVGMDBcdTU5Q0JcdTYyNkJcdTYzQ0Zcblx0ICovXG5cdGFzeW5jIHN0YXJ0U2NhbigpIHtcblx0XHRpZiAodGhpcy5pc1NjYW5uaW5nKSB7XG5cdFx0XHQvLyBJZiB0aGUgcHJldmlvdXMgc2NhbiBhcHBlYXJzIHN0dWNrLCBhbGxvdyBhIHJlc3RhcnQuXG5cdFx0XHRjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuXHRcdFx0aWYgKHRoaXMubGFzdFByb2dyZXNzQXQgJiYgbm93IC0gdGhpcy5sYXN0UHJvZ3Jlc3NBdCA+IDE1MDAwKSB7XG5cdFx0XHRcdHRoaXMuaXNTY2FubmluZyA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLmlzU2Nhbm5pbmcgPSB0cnVlO1xuXHRcdHRoaXMuZHVwbGljYXRlR3JvdXBzID0gW107XG5cdFx0dGhpcy5sYXN0UHJvZ3Jlc3NBdCA9IERhdGUubm93KCk7XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gXHU4M0I3XHU1M0Q2XHU2MjQwXHU2NzA5XHU1NkZFXHU3MjQ3XHU2NTg3XHU0RUY2XG5cdFx0XHRjb25zdCBpbWFnZUZpbGVzOiBURmlsZVtdID0gW107XG5cdFx0XHRpZiAodGhpcy5wbHVnaW4uZmlsZUluZGV4LmlzSW5pdGlhbGl6ZWQpIHtcblx0XHRcdFx0Zm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLnBsdWdpbi5maWxlSW5kZXguZ2V0RmlsZXMoKSkge1xuXHRcdFx0XHRcdGlmIChnZXRNZWRpYVR5cGUoZW50cnkubmFtZSkgPT09ICdpbWFnZScpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZW50cnkucGF0aCk7XG5cdFx0XHRcdFx0XHRpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG5cdFx0XHRcdFx0XHRcdGltYWdlRmlsZXMucHVzaChmaWxlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGFsbEZpbGVzID0gYXdhaXQgdGhpcy5wbHVnaW4uZ2V0QWxsSW1hZ2VGaWxlcygpO1xuXHRcdFx0XHRpbWFnZUZpbGVzLnB1c2goLi4uYWxsRmlsZXMuZmlsdGVyKGYgPT4gZ2V0TWVkaWFUeXBlKGYubmFtZSkgPT09ICdpbWFnZScpKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zY2FuUHJvZ3Jlc3MgPSB7IGN1cnJlbnQ6IDAsIHRvdGFsOiBpbWFnZUZpbGVzLmxlbmd0aCB9O1xuXHRcdFx0dGhpcy5sYXN0UHJvZ3Jlc3NBdCA9IERhdGUubm93KCk7XG5cdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblxuXHRcdFx0Ly8gXHU1MjA2XHU2Mjc5XHU4QkExXHU3Qjk3XHU1NEM4XHU1RTBDXG5cdFx0XHRjb25zdCBoYXNoTWFwID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblx0XHRcdGNvbnN0IEJBVENIX1NJWkUgPSA1O1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGltYWdlRmlsZXMubGVuZ3RoOyBpICs9IEJBVENIX1NJWkUpIHtcblx0XHRcdFx0Y29uc3QgYmF0Y2ggPSBpbWFnZUZpbGVzLnNsaWNlKGksIGkgKyBCQVRDSF9TSVpFKTtcblxuXHRcdFx0XHRhd2FpdCBQcm9taXNlLmFsbChiYXRjaC5tYXAoYXN5bmMgKGZpbGUpID0+IHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Y29uc3Qgc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdFx0XHRcdFx0Y29uc3QgaGFzaCA9IGF3YWl0IGNvbXB1dGVQZXJjZXB0dWFsSGFzaChzcmMpO1xuXHRcdFx0XHRcdFx0aGFzaE1hcC5zZXQoZmlsZS5wYXRoLCBoYXNoKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBIYXNoIGNvbXB1dGF0aW9uIGZhaWxlZCBmb3IgJHtmaWxlLm5hbWV9OmAsIGVycm9yKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pKTtcblxuXHRcdFx0XHR0aGlzLnNjYW5Qcm9ncmVzcy5jdXJyZW50ID0gTWF0aC5taW4oaSArIEJBVENIX1NJWkUsIGltYWdlRmlsZXMubGVuZ3RoKTtcblx0XHRcdFx0dGhpcy5sYXN0UHJvZ3Jlc3NBdCA9IERhdGUubm93KCk7XG5cblx0XHRcdFx0Ly8gXHU2NkY0XHU2NUIwXHU4RkRCXHU1RUE2IFVJXG5cdFx0XHRcdGNvbnN0IHByb2dyZXNzRmlsbCA9IHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoJy5kdXBsaWNhdGUtcHJvZ3Jlc3MtZmlsbCcpIGFzIEhUTUxFbGVtZW50O1xuXHRcdFx0XHRjb25zdCBwcm9ncmVzc1RleHQgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKCcuZHVwbGljYXRlLXByb2dyZXNzLXRleHQnKSBhcyBIVE1MRWxlbWVudDtcblx0XHRcdFx0aWYgKHByb2dyZXNzRmlsbCAmJiBwcm9ncmVzc1RleHQpIHtcblx0XHRcdFx0XHRjb25zdCBwZXJjZW50ID0gTWF0aC5yb3VuZCgodGhpcy5zY2FuUHJvZ3Jlc3MuY3VycmVudCAvIHRoaXMuc2NhblByb2dyZXNzLnRvdGFsKSAqIDEwMCk7XG5cdFx0XHRcdFx0cHJvZ3Jlc3NGaWxsLnN0eWxlLndpZHRoID0gYCR7cGVyY2VudH0lYDtcblx0XHRcdFx0XHRwcm9ncmVzc1RleHQudGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi50KCdzY2FuUHJvZ3Jlc3MnLCB7XG5cdFx0XHRcdFx0XHRjdXJyZW50OiB0aGlzLnNjYW5Qcm9ncmVzcy5jdXJyZW50LFxuXHRcdFx0XHRcdFx0dG90YWw6IHRoaXMuc2NhblByb2dyZXNzLnRvdGFsXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBcdThCQTkgVUkgXHU2NzA5XHU2NzNBXHU0RjFBXHU2NkY0XHU2NUIwXG5cdFx0XHRcdGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMCkpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBcdTY3RTVcdTYyN0VcdTkxQ0RcdTU5MERcdTdFQzRcblx0XHRcdGNvbnN0IHRocmVzaG9sZCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmR1cGxpY2F0ZVRocmVzaG9sZDtcblx0XHRcdHRoaXMuZHVwbGljYXRlR3JvdXBzID0gZmluZER1cGxpY2F0ZUdyb3VwcyhoYXNoTWFwLCB0aHJlc2hvbGQpXG5cdFx0XHRcdC5tYXAoZ3JvdXAgPT4gdGhpcy5ub3JtYWxpemVEdXBsaWNhdGVHcm91cChncm91cCkpO1xuXG5cdFx0XHRpZiAodGhpcy5kdXBsaWNhdGVHcm91cHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnbm9EdXBsaWNhdGVzRm91bmQnKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCB0b3RhbER1cGxpY2F0ZXMgPSB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5yZWR1Y2UoXG5cdFx0XHRcdFx0KHN1bSwgZykgPT4gc3VtICsgZy5maWxlcy5sZW5ndGggLSAxLCAwXG5cdFx0XHRcdCk7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZHVwbGljYXRlc0ZvdW5kJywge1xuXHRcdFx0XHRcdGdyb3VwczogdGhpcy5kdXBsaWNhdGVHcm91cHMubGVuZ3RoLFxuXHRcdFx0XHRcdGZpbGVzOiB0b3RhbER1cGxpY2F0ZXNcblx0XHRcdFx0fSkpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdEdXBsaWNhdGUgZGV0ZWN0aW9uIGZhaWxlZDonLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3NjYW5FcnJvcicpKTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0dGhpcy5pc1NjYW5uaW5nID0gZmFsc2U7XG5cdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGVuc3VyZVN0eWxlcygpIHtcblx0XHRpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29ic2lkaWFuLW1lZGlhLXRvb2xraXQtc3R5bGVzJykgfHxcblx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbWFnZS1tYW5hZ2VyLXN0eWxlcycpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHZvaWQgdGhpcy5wbHVnaW4uYWRkU3R5bGUoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTUzNTVcdTRFMkFcdTkxQ0RcdTU5MERcdTdFQzRcblx0ICovXG5cdHByaXZhdGUgcmVuZGVyRHVwbGljYXRlR3JvdXAoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZ3JvdXA6IER1cGxpY2F0ZUdyb3VwLCBpbmRleDogbnVtYmVyKSB7XG5cdFx0Z3JvdXAuZmlsZXMuc29ydCgoYSwgYikgPT4gdGhpcy5jb21wYXJlRHVwbGljYXRlRmlsZXMoYS5wYXRoLCBiLnBhdGgpKTtcblxuXHRcdGNvbnN0IGdyb3VwRWwgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWdyb3VwJyB9KTtcblxuXHRcdC8vIFx1N0VDNFx1NjgwN1x1OTg5OFxuXHRcdGNvbnN0IGdyb3VwSGVhZGVyID0gZ3JvdXBFbC5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZ3JvdXAtaGVhZGVyJyB9KTtcblx0XHRncm91cEhlYWRlci5jcmVhdGVTcGFuKHtcblx0XHRcdGNsczogJ2R1cGxpY2F0ZS1ncm91cC10aXRsZScsXG5cdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdkdXBsaWNhdGVHcm91cCcsIHsgaW5kZXggfSlcblx0XHR9KTtcblx0XHRncm91cEhlYWRlci5jcmVhdGVTcGFuKHtcblx0XHRcdGNsczogJ2R1cGxpY2F0ZS1ncm91cC1jb3VudCcsXG5cdFx0XHR0ZXh0OiBgJHtncm91cC5maWxlcy5sZW5ndGh9ICR7dGhpcy5wbHVnaW4udCgnZmlsZXMnKX1gXG5cdFx0fSk7XG5cblx0XHQvLyBcdTY1ODdcdTRFRjZcdTUyMTdcdTg4Njhcblx0XHRjb25zdCBmaWxlTGlzdCA9IGdyb3VwRWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWdyb3VwLWZpbGVzJyB9KTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZ3JvdXAuZmlsZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IGZpbGVJbmZvID0gZ3JvdXAuZmlsZXNbaV07XG5cdFx0XHRjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZpbGVJbmZvLnBhdGgpO1xuXHRcdFx0aWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG5cblx0XHRcdGNvbnN0IGZpbGVFbCA9IGZpbGVMaXN0LmNyZWF0ZURpdih7XG5cdFx0XHRcdGNsczogYGR1cGxpY2F0ZS1ncm91cC1maWxlICR7aSA9PT0gMCA/ICdkdXBsaWNhdGUta2VlcC1zdWdnZXN0aW9uJyA6ICdkdXBsaWNhdGUtZmlsZS1zdWdnZXN0aW9uJ31gXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gXHU3RjI5XHU3NTY1XHU1NkZFXG5cdFx0XHRjb25zdCB0aHVtYiA9IGZpbGVFbC5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZmlsZS10aHVtYm5haWwnIH0pO1xuXHRcdFx0Y29uc3Qgc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdFx0Y29uc3QgaW1nID0gdGh1bWIuY3JlYXRlRWwoJ2ltZycsIHtcblx0XHRcdFx0YXR0cjogeyBzcmMsIGFsdDogZmlsZS5uYW1lIH1cblx0XHRcdH0pO1xuXHRcdFx0aW1nLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKCkgPT4ge1xuXHRcdFx0XHR0aHVtYi5lbXB0eSgpO1xuXHRcdFx0XHRjb25zdCBpY29uID0gdGh1bWIuY3JlYXRlRGl2KCk7XG5cdFx0XHRcdHNldEljb24oaWNvbiwgJ2ltYWdlJyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gXHU2NTg3XHU0RUY2XHU0RkUxXHU2MDZGXG5cdFx0XHRjb25zdCBpbmZvID0gZmlsZUVsLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1maWxlLWluZm8nIH0pO1xuXHRcdFx0aW5mby5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZmlsZS1uYW1lJywgdGV4dDogZmlsZS5uYW1lIH0pO1xuXHRcdFx0aW5mby5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZmlsZS1wYXRoJywgdGV4dDogZmlsZS5wYXRoIH0pO1xuXG5cdFx0XHRjb25zdCBtZXRhID0gaW5mby5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZmlsZS1tZXRhJyB9KTtcblx0XHRcdG1ldGEuY3JlYXRlU3Bhbih7IHRleHQ6IGZvcm1hdEZpbGVTaXplKGZpbGUuc3RhdC5zaXplKSB9KTtcblx0XHRcdG1ldGEuY3JlYXRlU3Bhbih7IHRleHQ6IGAgfCAke25ldyBEYXRlKGZpbGUuc3RhdC5tdGltZSkudG9Mb2NhbGVEYXRlU3RyaW5nKCl9YCB9KTtcblx0XHRcdG1ldGEuY3JlYXRlU3Bhbih7XG5cdFx0XHRcdGNsczogJ2R1cGxpY2F0ZS1zaW1pbGFyaXR5LWJhZGdlJyxcblx0XHRcdFx0dGV4dDogYCAke2ZpbGVJbmZvLnNpbWlsYXJpdHl9JWBcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBcdTY4MDdcdThCQjBcblx0XHRcdGlmIChpID09PSAwKSB7XG5cdFx0XHRcdGZpbGVFbC5jcmVhdGVTcGFuKHsgY2xzOiAnZHVwbGljYXRlLWtlZXAtYmFkZ2UnLCB0ZXh0OiB0aGlzLnBsdWdpbi50KCdzdWdnZXN0S2VlcCcpIH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gXHU5Njk0XHU3OUJCXHU2MzA5XHU5NEFFXG5cdFx0XHRcdGNvbnN0IHF1YXJhbnRpbmVCdG4gPSBmaWxlRWwuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnZHVwbGljYXRlLXF1YXJhbnRpbmUtYnRuJyB9KTtcblx0XHRcdFx0c2V0SWNvbihxdWFyYW50aW5lQnRuLCAnYXJjaGl2ZScpO1xuXHRcdFx0XHRxdWFyYW50aW5lQnRuLmNyZWF0ZVNwYW4oeyB0ZXh0OiBgICR7dGhpcy5wbHVnaW4udCgncXVhcmFudGluZScpfWAgfSk7XG5cdFx0XHRcdHF1YXJhbnRpbmVCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5wbHVnaW4uc2FmZURlbGV0ZUZpbGUoZmlsZSk7XG5cdFx0XHRcdFx0aWYgKHJlc3VsdCkge1xuXHRcdFx0XHRcdFx0Ly8gXHU0RUNFXHU3RUM0XHU0RTJEXHU3OUZCXHU5NjY0XG5cdFx0XHRcdFx0XHRncm91cC5maWxlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0XHRpZiAoZ3JvdXAuZmlsZXMubGVuZ3RoIDw9IDEpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgaWR4ID0gdGhpcy5kdXBsaWNhdGVHcm91cHMuaW5kZXhPZihncm91cCk7XG5cdFx0XHRcdFx0XHRcdGlmIChpZHggPj0gMCkgdGhpcy5kdXBsaWNhdGVHcm91cHMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTRFMDBcdTk1MkVcdTk2OTRcdTc5QkJcdTYyNDBcdTY3MDlcdTkxQ0RcdTU5MERcdTk4NzlcdUZGMDhcdTZCQ0ZcdTdFQzRcdTRGRERcdTc1NTlcdTY3MDBcdTY1QjBcdTcyNDhcdUZGMDlcblx0ICovXG5cdGFzeW5jIHF1YXJhbnRpbmVBbGxEdXBsaWNhdGVzKCkge1xuXHRcdGxldCB0b3RhbFF1YXJhbnRpbmVkID0gMDtcblxuXHRcdGZvciAoY29uc3QgZ3JvdXAgb2YgdGhpcy5kdXBsaWNhdGVHcm91cHMpIHtcblx0XHRcdGdyb3VwLmZpbGVzLnNvcnQoKGEsIGIpID0+IHRoaXMuY29tcGFyZUR1cGxpY2F0ZUZpbGVzKGEucGF0aCwgYi5wYXRoKSk7XG5cblx0XHRcdC8vIFx1NEZERFx1NzU1OVx1N0IyQ1x1NEUwMFx1NEUyQVx1RkYwOFx1NjcwMFx1NjVCMFx1RkYwOVx1RkYwQ1x1OTY5NFx1NzlCQlx1NTE3Nlx1NEY1OVxuXHRcdFx0Zm9yIChsZXQgaSA9IDE7IGkgPCBncm91cC5maWxlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zdCBlbnRyeSA9IGdyb3VwLmZpbGVzW2ldO1xuXHRcdFx0XHRjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGVudHJ5LnBhdGgpO1xuXHRcdFx0XHRpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcblxuXHRcdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnBsdWdpbi5zYWZlRGVsZXRlRmlsZShmaWxlKTtcblx0XHRcdFx0aWYgKHJlc3VsdCkgdG90YWxRdWFyYW50aW5lZCsrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZHVwbGljYXRlc1F1YXJhbnRpbmVkJywgeyBjb3VudDogdG90YWxRdWFyYW50aW5lZCB9KSk7XG5cdFx0dGhpcy5kdXBsaWNhdGVHcm91cHMgPSBbXTtcblx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0fVxufVxuIiwgIi8qKlxuICogXHU2MTFGXHU3N0U1XHU1NEM4XHU1RTBDXHU1M0JCXHU5MUNEXHU2QTIxXHU1NzU3XG4gKiBcdTRGN0ZcdTc1MjggRENUIHBIYXNoICsgZEhhc2ggXHU3RUM0XHU1NDA4XHU1NEM4XHU1RTBDXHU1QjlFXHU3M0IwXHU1MENGXHU3RDIwXHU3RUE3XHU1NkZFXHU3MjQ3XHU1M0JCXHU5MUNEXG4gKiBcdTdFQUZcdTZENEZcdTg5QzhcdTU2NjggQ2FudmFzIEFQSSBcdTVCOUVcdTczQjBcdUZGMENcdTY1RTBcdTU5MTZcdTkwRThcdTRGOURcdThENTZcbiAqL1xuXG5jb25zdCBERUZBVUxUX0lNQUdFX0xPQURfVElNRU9VVCA9IDgwMDA7XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU1NkZFXHU3MjQ3XHU3Njg0XHU3MDcwXHU1RUE2XHU1MENGXHU3RDIwXHU2NTcwXHU2MzZFXG4gKi9cbmZ1bmN0aW9uIGdldEdyYXlzY2FsZURhdGEoaW1nOiBIVE1MSW1hZ2VFbGVtZW50LCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IG51bWJlcltdIHtcblx0Y29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuXHRjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XG5cdGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblx0Y29uc3QgaW1hZ2VEYXRhID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblx0Y29uc3QgZGF0YSA9IGltYWdlRGF0YS5kYXRhO1xuXHRjb25zdCBncmF5OiBudW1iZXJbXSA9IFtdO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkgKz0gNCkge1xuXHRcdGdyYXkucHVzaCgwLjI5OSAqIGRhdGFbaV0gKyAwLjU4NyAqIGRhdGFbaSArIDFdICsgMC4xMTQgKiBkYXRhW2kgKyAyXSk7XG5cdH1cblxuXHRyZXR1cm4gZ3JheTtcbn1cblxuLyoqXG4gKiBcdTdCODBcdTUzMTYgRENUIFx1NTNEOFx1NjM2Mlx1RkYwOFx1NEVDNVx1OEJBMVx1N0I5N1x1NEY0RVx1OTg5MVx1NTIwNlx1OTFDRlx1RkYwOVxuICovXG5mdW5jdGlvbiBkY3QyZChtYXRyaXg6IG51bWJlcltdLCBzaXplOiBudW1iZXIsIG91dHB1dFNpemU6IG51bWJlcik6IG51bWJlcltdIHtcblx0Y29uc3QgcmVzdWx0OiBudW1iZXJbXSA9IG5ldyBBcnJheShvdXRwdXRTaXplICogb3V0cHV0U2l6ZSk7XG5cblx0Zm9yIChsZXQgdSA9IDA7IHUgPCBvdXRwdXRTaXplOyB1KyspIHtcblx0XHRmb3IgKGxldCB2ID0gMDsgdiA8IG91dHB1dFNpemU7IHYrKykge1xuXHRcdFx0bGV0IHN1bSA9IDA7XG5cdFx0XHRmb3IgKGxldCB4ID0gMDsgeCA8IHNpemU7IHgrKykge1xuXHRcdFx0XHRmb3IgKGxldCB5ID0gMDsgeSA8IHNpemU7IHkrKykge1xuXHRcdFx0XHRcdHN1bSArPSBtYXRyaXhbeCAqIHNpemUgKyB5XSAqXG5cdFx0XHRcdFx0XHRNYXRoLmNvcyhNYXRoLlBJICogKDIgKiB4ICsgMSkgKiB1IC8gKDIgKiBzaXplKSkgKlxuXHRcdFx0XHRcdFx0TWF0aC5jb3MoTWF0aC5QSSAqICgyICogeSArIDEpICogdiAvICgyICogc2l6ZSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXN1bHRbdSAqIG91dHB1dFNpemUgKyB2XSA9IHN1bTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIERDVCBwSGFzaDogMzJcdTAwRDczMlx1NzA3MFx1NUVBNiBcdTIxOTIgRENUIFx1MjE5MiBcdTUzRDY4XHUwMEQ3OFx1NEY0RVx1OTg5MSBcdTIxOTIgXHU0RTJEXHU0RjREXHU2NTcwXHU5NjA4XHU1MDNDIFx1MjE5MiA2NC1iaXQgaGV4XG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVQSGFzaChpbWc6IEhUTUxJbWFnZUVsZW1lbnQpOiBzdHJpbmcge1xuXHRjb25zdCBTSVpFID0gMzI7XG5cdGNvbnN0IExPV19GUkVRID0gODtcblxuXHRjb25zdCBncmF5ID0gZ2V0R3JheXNjYWxlRGF0YShpbWcsIFNJWkUsIFNJWkUpO1xuXHRjb25zdCBkY3RDb2VmZnMgPSBkY3QyZChncmF5LCBTSVpFLCBMT1dfRlJFUSk7XG5cblx0Ly8gXHU2MzkyXHU5NjY0IERDIFx1NTIwNlx1OTFDRiAoMCwwKVxuXHRjb25zdCB2YWx1ZXMgPSBkY3RDb2VmZnMuc2xpY2UoMSk7XG5cdGNvbnN0IHNvcnRlZCA9IFsuLi52YWx1ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcblx0Y29uc3QgbWVkaWFuID0gc29ydGVkW01hdGguZmxvb3Ioc29ydGVkLmxlbmd0aCAvIDIpXTtcblxuXHQvLyBcdTc1MUZcdTYyMTAgNjQtYml0IFx1NTRDOFx1NUUwQ1xuXHRsZXQgaGFzaCA9ICcnO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IExPV19GUkVRICogTE9XX0ZSRVE7IGkrKykge1xuXHRcdGhhc2ggKz0gZGN0Q29lZmZzW2ldID4gbWVkaWFuID8gJzEnIDogJzAnO1xuXHR9XG5cblx0cmV0dXJuIGJpbmFyeVRvSGV4KGhhc2gpO1xufVxuXG4vKipcbiAqIGRIYXNoOiA5XHUwMEQ3OFx1NzA3MFx1NUVBNiBcdTIxOTIgXHU2QzM0XHU1RTczXHU1REVFXHU1MjA2IFx1MjE5MiA2NC1iaXQgaGV4XG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVESGFzaChpbWc6IEhUTUxJbWFnZUVsZW1lbnQpOiBzdHJpbmcge1xuXHRjb25zdCBncmF5ID0gZ2V0R3JheXNjYWxlRGF0YShpbWcsIDksIDgpO1xuXHRsZXQgaGFzaCA9ICcnO1xuXG5cdGZvciAobGV0IHkgPSAwOyB5IDwgODsgeSsrKSB7XG5cdFx0Zm9yIChsZXQgeCA9IDA7IHggPCA4OyB4KyspIHtcblx0XHRcdGhhc2ggKz0gZ3JheVt5ICogOSArIHhdIDwgZ3JheVt5ICogOSArIHggKyAxXSA/ICcxJyA6ICcwJztcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gYmluYXJ5VG9IZXgoaGFzaCk7XG59XG5cbi8qKlxuICogXHU0RThDXHU4RkRCXHU1MjM2XHU1QjU3XHU3QjI2XHU0RTMyXHU4RjZDXHU1MzQxXHU1MTZEXHU4RkRCXHU1MjM2XG4gKi9cbmZ1bmN0aW9uIGJpbmFyeVRvSGV4KGJpbmFyeTogc3RyaW5nKTogc3RyaW5nIHtcblx0bGV0IGhleCA9ICcnO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGJpbmFyeS5sZW5ndGg7IGkgKz0gNCkge1xuXHRcdGhleCArPSBwYXJzZUludChiaW5hcnkuc3Vic3RyaW5nKGksIGkgKyA0KSwgMikudG9TdHJpbmcoMTYpO1xuXHR9XG5cdHJldHVybiBoZXg7XG59XG5cbi8qKlxuICogXHU4QkExXHU3Qjk3XHU3RUM0XHU1NDA4IDEyOC1iaXQgXHU1NEM4XHU1RTBDXHVGRjA4cEhhc2ggKyBkSGFzaFx1RkYwOVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcHV0ZVBlcmNlcHR1YWxIYXNoKGltYWdlU3JjOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRjb25zdCBpbWcgPSBhd2FpdCBsb2FkSW1hZ2UoaW1hZ2VTcmMpO1xuXHRjb25zdCBwSGFzaCA9IGNvbXB1dGVQSGFzaChpbWcpO1xuXHRjb25zdCBkSGFzaCA9IGNvbXB1dGVESGFzaChpbWcpO1xuXHRyZXR1cm4gcEhhc2ggKyBkSGFzaDtcbn1cblxuLyoqXG4gKiBcdTRFQ0UgQXJyYXlCdWZmZXIgXHU4QkExXHU3Qjk3XHU1NEM4XHU1RTBDXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21wdXRlSGFzaEZyb21CdWZmZXIoYnVmZmVyOiBBcnJheUJ1ZmZlciwgbWltZVR5cGU6IHN0cmluZyA9ICdpbWFnZS9wbmcnKTogUHJvbWlzZTxzdHJpbmc+IHtcblx0Y29uc3QgYmxvYiA9IG5ldyBCbG9iKFtidWZmZXJdLCB7IHR5cGU6IG1pbWVUeXBlIH0pO1xuXHRjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXHR0cnkge1xuXHRcdHJldHVybiBhd2FpdCBjb21wdXRlUGVyY2VwdHVhbEhhc2godXJsKTtcblx0fSBmaW5hbGx5IHtcblx0XHRVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG5cdH1cbn1cblxuLyoqXG4gKiBcdTUyQTBcdThGN0RcdTU2RkVcdTcyNDdcbiAqL1xuZnVuY3Rpb24gbG9hZEltYWdlKHNyYzogc3RyaW5nLCB0aW1lb3V0TXM6IG51bWJlciA9IERFRkFVTFRfSU1BR0VfTE9BRF9USU1FT1VUKTogUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50PiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0Y29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG5cdFx0bGV0IHNldHRsZWQgPSBmYWxzZTtcblx0XHRjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0aWYgKHNldHRsZWQpIHJldHVybjtcblx0XHRcdHNldHRsZWQgPSB0cnVlO1xuXHRcdFx0Ly8gQmVzdC1lZmZvcnQgYWJvcnQgdG8gYXZvaWQgaGFuZ2luZyByZXF1ZXN0c1xuXHRcdFx0aW1nLnNyYyA9ICcnO1xuXHRcdFx0cmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgaW1hZ2UgKHRpbWVvdXQpOiAke3NyY31gKSk7XG5cdFx0fSwgdGltZW91dE1zKTtcblxuXHRcdGltZy5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xuXHRcdGltZy5vbmxvYWQgPSAoKSA9PiB7XG5cdFx0XHRpZiAoc2V0dGxlZCkgcmV0dXJuO1xuXHRcdFx0c2V0dGxlZCA9IHRydWU7XG5cdFx0XHRjbGVhclRpbWVvdXQodGltZXIpO1xuXHRcdFx0cmVzb2x2ZShpbWcpO1xuXHRcdH07XG5cdFx0aW1nLm9uZXJyb3IgPSAoKSA9PiB7XG5cdFx0XHRpZiAoc2V0dGxlZCkgcmV0dXJuO1xuXHRcdFx0c2V0dGxlZCA9IHRydWU7XG5cdFx0XHRjbGVhclRpbWVvdXQodGltZXIpO1xuXHRcdFx0cmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgaW1hZ2U6ICR7c3JjfWApKTtcblx0XHR9O1xuXHRcdGltZy5zcmMgPSBzcmM7XG5cdH0pO1xufVxuXG4vKipcbiAqIFx1OEJBMVx1N0I5N1x1NEUyNFx1NEUyQVx1NTRDOFx1NUUwQ1x1NzY4NFx1NkM0OVx1NjYwRVx1OERERFx1NzlCQlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFtbWluZ0Rpc3RhbmNlKGgxOiBzdHJpbmcsIGgyOiBzdHJpbmcpOiBudW1iZXIge1xuXHRpZiAoaDEubGVuZ3RoICE9PSBoMi5sZW5ndGgpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEhhc2ggbGVuZ3RoIG1pc21hdGNoOiAke2gxLmxlbmd0aH0gdnMgJHtoMi5sZW5ndGh9YCk7XG5cdH1cblxuXHRsZXQgZGlzdGFuY2UgPSAwO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGgxLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y29uc3QgbjEgPSBwYXJzZUludChoMVtpXSwgMTYpO1xuXHRcdGNvbnN0IG4yID0gcGFyc2VJbnQoaDJbaV0sIDE2KTtcblx0XHRsZXQgeG9yID0gbjEgXiBuMjtcblx0XHR3aGlsZSAoeG9yKSB7XG5cdFx0XHRkaXN0YW5jZSArPSB4b3IgJiAxO1xuXHRcdFx0eG9yID4+PSAxO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBkaXN0YW5jZTtcbn1cblxuLyoqXG4gKiBcdThCQTFcdTdCOTdcdTRFMjRcdTRFMkFcdTU0QzhcdTVFMENcdTc2ODRcdTc2RjhcdTRGM0NcdTVFQTZcdTc2N0VcdTUyMDZcdTZCRDRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc2hTaW1pbGFyaXR5KGgxOiBzdHJpbmcsIGgyOiBzdHJpbmcpOiBudW1iZXIge1xuXHRjb25zdCB0b3RhbEJpdHMgPSBoMS5sZW5ndGggKiA0OyAvLyBcdTZCQ0ZcdTRFMkEgaGV4IFx1NUI1N1x1N0IyNiA0IGJpdHNcblx0Y29uc3QgZGlzdGFuY2UgPSBoYW1taW5nRGlzdGFuY2UoaDEsIGgyKTtcblx0cmV0dXJuIE1hdGgucm91bmQoKDEgLSBkaXN0YW5jZSAvIHRvdGFsQml0cykgKiAxMDApO1xufVxuXG4vKipcbiAqIFx1OTFDRFx1NTkwRFx1N0VDNFxuICovXG5leHBvcnQgaW50ZXJmYWNlIER1cGxpY2F0ZUdyb3VwIHtcblx0aGFzaDogc3RyaW5nO1xuXHRmaWxlczogQXJyYXk8eyBwYXRoOiBzdHJpbmc7IGhhc2g6IHN0cmluZzsgc2ltaWxhcml0eTogbnVtYmVyIH0+O1xufVxuXG4vKipcbiAqIFx1NEVDRVx1NTRDOFx1NUUwQ1x1NjYyMFx1NUMwNFx1NEUyRFx1NjdFNVx1NjI3RVx1OTFDRFx1NTkwRFx1N0VDNFxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZER1cGxpY2F0ZUdyb3Vwcyhcblx0aGFzaE1hcDogTWFwPHN0cmluZywgc3RyaW5nPixcblx0dGhyZXNob2xkOiBudW1iZXIgPSA5MFxuKTogRHVwbGljYXRlR3JvdXBbXSB7XG5cdGNvbnN0IGVudHJpZXMgPSBBcnJheS5mcm9tKGhhc2hNYXAuZW50cmllcygpKTtcblx0Y29uc3QgdmlzaXRlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXHRjb25zdCBncm91cHM6IER1cGxpY2F0ZUdyb3VwW10gPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGVudHJpZXMubGVuZ3RoOyBpKyspIHtcblx0XHRjb25zdCBbcGF0aDEsIGhhc2gxXSA9IGVudHJpZXNbaV07XG5cdFx0aWYgKHZpc2l0ZWQuaGFzKHBhdGgxKSkgY29udGludWU7XG5cblx0XHRjb25zdCBncm91cDogRHVwbGljYXRlR3JvdXAgPSB7XG5cdFx0XHRoYXNoOiBoYXNoMSxcblx0XHRcdGZpbGVzOiBbeyBwYXRoOiBwYXRoMSwgaGFzaDogaGFzaDEsIHNpbWlsYXJpdHk6IDEwMCB9XVxuXHRcdH07XG5cblx0XHRmb3IgKGxldCBqID0gaSArIDE7IGogPCBlbnRyaWVzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRjb25zdCBbcGF0aDIsIGhhc2gyXSA9IGVudHJpZXNbal07XG5cdFx0XHRpZiAodmlzaXRlZC5oYXMocGF0aDIpKSBjb250aW51ZTtcblxuXHRcdFx0Y29uc3Qgc2ltaWxhcml0eSA9IGhhc2hTaW1pbGFyaXR5KGhhc2gxLCBoYXNoMik7XG5cdFx0XHRpZiAoc2ltaWxhcml0eSA+PSB0aHJlc2hvbGQpIHtcblx0XHRcdFx0Z3JvdXAuZmlsZXMucHVzaCh7IHBhdGg6IHBhdGgyLCBoYXNoOiBoYXNoMiwgc2ltaWxhcml0eSB9KTtcblx0XHRcdFx0dmlzaXRlZC5hZGQocGF0aDIpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChncm91cC5maWxlcy5sZW5ndGggPiAxKSB7XG5cdFx0XHR2aXNpdGVkLmFkZChwYXRoMSk7XG5cdFx0XHRncm91cHMucHVzaChncm91cCk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGdyb3Vwcztcbn1cbiIsICJpbXBvcnQgeyBNb2RhbCwgTm90aWNlLCBURmlsZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCBJbWFnZU1hbmFnZXJQbHVnaW4gZnJvbSAnLi4vbWFpbic7XG5cbmV4cG9ydCBjbGFzcyBNZWRpYVByZXZpZXdNb2RhbCBleHRlbmRzIE1vZGFsIHtcblx0cGx1Z2luOiBJbWFnZU1hbmFnZXJQbHVnaW47XG5cdGZpbGU6IFRGaWxlO1xuXHRjdXJyZW50SW5kZXg6IG51bWJlciA9IDA7XG5cdGFsbEZpbGVzOiBURmlsZVtdID0gW107XG5cdHByaXZhdGUga2V5ZG93bkhhbmRsZXI6ICgoZTogS2V5Ym9hcmRFdmVudCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuXHRjb25zdHJ1Y3RvcihhcHA6IGFueSwgcGx1Z2luOiBJbWFnZU1hbmFnZXJQbHVnaW4sIGZpbGU6IFRGaWxlLCBhbGxGaWxlczogVEZpbGVbXSA9IFtdKSB7XG5cdFx0c3VwZXIoYXBwKTtcblx0XHR0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblx0XHR0aGlzLmZpbGUgPSBmaWxlO1xuXHRcdHRoaXMuYWxsRmlsZXMgPSBhbGxGaWxlcy5sZW5ndGggPiAwID8gYWxsRmlsZXMgOiBbZmlsZV07XG5cdFx0Y29uc3QgaWR4ID0gdGhpcy5hbGxGaWxlcy5maW5kSW5kZXgoZiA9PiBmLnBhdGggPT09IGZpbGUucGF0aCk7XG5cdFx0dGhpcy5jdXJyZW50SW5kZXggPSBpZHggPj0gMCA/IGlkeCA6IDA7XG5cdH1cblxuXHRvbk9wZW4oKSB7XG5cdFx0Y29uc3QgeyBjb250ZW50RWwsIG1vZGFsRWwgfSA9IHRoaXM7XG5cdFx0bW9kYWxFbC5hZGRDbGFzcygnbWVkaWEtcHJldmlldy1tb2RhbCcpO1xuXG5cdFx0Ly8gXHU1MTczXHU5NUVEXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgY2xvc2VCdG4gPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAncHJldmlldy1jbG9zZScgfSk7XG5cdFx0Y2xvc2VCdG4udGV4dENvbnRlbnQgPSAnXHUwMEQ3Jztcblx0XHRjbG9zZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuY2xvc2UoKSk7XG5cblx0XHQvLyBcdTVBOTJcdTRGNTNcdTVCQjlcdTU2Njhcblx0XHRjb25zdCBjb250YWluZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAncHJldmlldy1jb250YWluZXInIH0pO1xuXG5cdFx0Ly8gXHU2RTMyXHU2N0QzXHU1QTkyXHU0RjUzXG5cdFx0dGhpcy5yZW5kZXJNZWRpYShjb250YWluZXIpO1xuXG5cdFx0Ly8gXHU1QkZDXHU4MjJBXHU2M0E3XHU0RUY2XHVGRjA4XHU1OTgyXHU2NzlDXHU2NzA5XHU1OTFBXHU1RjIwXHU1NkZFXHU3MjQ3XHVGRjA5XG5cdFx0aWYgKHRoaXMuYWxsRmlsZXMubGVuZ3RoID4gMSkge1xuXHRcdFx0dGhpcy5yZW5kZXJOYXZpZ2F0aW9uKGNvbnRhaW5lcik7XG5cdFx0fVxuXG5cdFx0Ly8gXHU0RkUxXHU2MDZGXHU2ODBGXG5cdFx0dGhpcy5yZW5kZXJJbmZvQmFyKGNvbnRlbnRFbCk7XG5cblx0XHQvLyBcdTk1MkVcdTc2RDhcdTVCRkNcdTgyMkFcdUZGMDhcdTY4MzlcdTYzNkVcdThCQkVcdTdGNkVcdTUxQjNcdTVCOUFcdTY2MkZcdTU0MjZcdTU0MkZcdTc1MjhcdUZGMDlcblx0XHRpZiAodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlS2V5Ym9hcmROYXYpIHtcblx0XHRcdHRoaXMucmVnaXN0ZXJLZXlib2FyZE5hdigpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTVBOTJcdTRGNTNcblx0ICovXG5cdHJlbmRlck1lZGlhKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcblx0XHRjb250YWluZXIuZW1wdHkoKTtcblx0XHRjb25zdCBmaWxlID0gdGhpcy5hbGxGaWxlc1t0aGlzLmN1cnJlbnRJbmRleF07XG5cdFx0Y29uc3QgZXh0ID0gZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKTtcblx0XHRjb25zdCBpc0ltYWdlID0gWydwbmcnLCAnanBnJywgJ2pwZWcnLCAnZ2lmJywgJ3dlYnAnLCAnc3ZnJywgJ2JtcCddLmluY2x1ZGVzKGV4dCk7XG5cdFx0Y29uc3QgaXNWaWRlbyA9IFsnbXA0JywgJ21vdicsICdhdmknLCAnbWt2JywgJ3dlYm0nXS5pbmNsdWRlcyhleHQpO1xuXHRcdGNvbnN0IGlzQXVkaW8gPSBbJ21wMycsICd3YXYnLCAnb2dnJywgJ200YScsICdmbGFjJ10uaW5jbHVkZXMoZXh0KTtcblx0XHRjb25zdCBpc1BkZiA9IGV4dCA9PT0gJ3BkZic7XG5cblx0XHRpZiAoaXNJbWFnZSkge1xuXHRcdFx0Y29uc3QgaW1nID0gY29udGFpbmVyLmNyZWF0ZUVsKCdpbWcnLCB7XG5cdFx0XHRcdGNsczogJ3ByZXZpZXctaW1hZ2UnLFxuXHRcdFx0XHRhdHRyOiB7IHNyYzogdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpIH1cblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBcdTU2RkVcdTcyNDdcdTUyQTBcdThGN0RcdTU5MzFcdThEMjVcdTY1RjZcdTY2M0VcdTc5M0FcdTk1MTlcdThCRUZcdTcyQjZcdTYwMDFcblx0XHRcdGltZy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdFx0Y29udGFpbmVyLmVtcHR5KCk7XG5cdFx0XHRcdGNvbnRhaW5lci5jcmVhdGVEaXYoe1xuXHRcdFx0XHRcdGNsczogJ3ByZXZpZXctZXJyb3InLFxuXHRcdFx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ2ltYWdlTG9hZEVycm9yJykgfHwgJ0ZhaWxlZCB0byBsb2FkIGltYWdlJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSBpZiAoaXNWaWRlbykge1xuXHRcdFx0Y29uc3QgdmlkZW8gPSBjb250YWluZXIuY3JlYXRlRWwoJ3ZpZGVvJywge1xuXHRcdFx0XHRjbHM6ICdwcmV2aWV3LXZpZGVvJyxcblx0XHRcdFx0YXR0cjogeyBjb250cm9sczogJ3RydWUnIH1cblx0XHRcdH0pO1xuXHRcdFx0dmlkZW8uc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdH0gZWxzZSBpZiAoaXNBdWRpbykge1xuXHRcdFx0Y29uc3QgYXVkaW8gPSBjb250YWluZXIuY3JlYXRlRWwoJ2F1ZGlvJywge1xuXHRcdFx0XHRjbHM6ICdwcmV2aWV3LWF1ZGlvJyxcblx0XHRcdFx0YXR0cjogeyBjb250cm9sczogJ3RydWUnIH1cblx0XHRcdH0pO1xuXHRcdFx0YXVkaW8uc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdH0gZWxzZSBpZiAoaXNQZGYpIHtcblx0XHRcdGNvbnN0IGlmcmFtZSA9IGNvbnRhaW5lci5jcmVhdGVFbCgnaWZyYW1lJywge1xuXHRcdFx0XHRjbHM6ICdwcmV2aWV3LXBkZicsXG5cdFx0XHRcdGF0dHI6IHtcblx0XHRcdFx0XHRzcmM6IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKSxcblx0XHRcdFx0XHRzYW5kYm94OiAnYWxsb3ctc2NyaXB0cydcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdwcmV2aWV3LXVuc3VwcG9ydGVkJywgdGV4dDogdGhpcy5wbHVnaW4udCgndW5zdXBwb3J0ZWRGaWxlVHlwZScpIH0pO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTVCRkNcdTgyMkFcdTYzQTdcdTRFRjZcblx0ICovXG5cdHJlbmRlck5hdmlnYXRpb24oY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuXHRcdGNvbnN0IG5hdiA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdwcmV2aWV3LW5hdicgfSk7XG5cblx0XHQvLyBcdTRFMEFcdTRFMDBcdTVGMjBcblx0XHRjb25zdCBwcmV2QnRuID0gbmF2LmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ25hdi1idXR0b24gcHJldicgfSk7XG5cdFx0cHJldkJ0bi50ZXh0Q29udGVudCA9ICdcdTIwMzknO1xuXHRcdHByZXZCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdHRoaXMucHJldigpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU5ODc1XHU3ODAxXG5cdFx0bmF2LmNyZWF0ZVNwYW4oe1xuXHRcdFx0dGV4dDogYCR7dGhpcy5jdXJyZW50SW5kZXggKyAxfSAvICR7dGhpcy5hbGxGaWxlcy5sZW5ndGh9YCxcblx0XHRcdGNsczogJ25hdi1pbmZvJ1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU0RTBCXHU0RTAwXHU1RjIwXG5cdFx0Y29uc3QgbmV4dEJ0biA9IG5hdi5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICduYXYtYnV0dG9uIG5leHQnIH0pO1xuXHRcdG5leHRCdG4udGV4dENvbnRlbnQgPSAnXHUyMDNBJztcblx0XHRuZXh0QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR0aGlzLm5leHQoKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTRGRTFcdTYwNkZcdTY4MEZcblx0ICovXG5cdHJlbmRlckluZm9CYXIoY29udGVudEVsOiBIVE1MRWxlbWVudCkge1xuXHRcdGNvbnN0IGZpbGUgPSB0aGlzLmFsbEZpbGVzW3RoaXMuY3VycmVudEluZGV4XTtcblx0XHRjb25zdCBpbmZvQmFyID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3ByZXZpZXctaW5mby1iYXInIH0pO1xuXG5cdFx0Ly8gXHU2NTg3XHU0RUY2XHU1NDBEXG5cdFx0aW5mb0Jhci5jcmVhdGVEaXYoeyBjbHM6ICdpbmZvLW5hbWUnLCB0ZXh0OiBmaWxlLm5hbWUgfSk7XG5cblx0XHQvLyBcdTY0Q0RcdTRGNUNcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBhY3Rpb25zID0gaW5mb0Jhci5jcmVhdGVEaXYoeyBjbHM6ICdpbmZvLWFjdGlvbnMnIH0pO1xuXG5cdFx0Ly8gXHU1OTBEXHU1MjM2XHU4REVGXHU1Rjg0XG5cdFx0Y29uc3QgY29weVBhdGhCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nKTtcblx0XHRjb3B5UGF0aEJ0bi50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnQoJ2NvcHlQYXRoQnRuJyk7XG5cdFx0Y29weVBhdGhCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHR2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGZpbGUucGF0aCkudGhlbigoKSA9PiB7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgncGF0aENvcGllZCcpKTtcblx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdcdTU5MERcdTUyMzZcdTUyMzBcdTUyNkFcdThEMzRcdTY3N0ZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTU5MERcdTUyMzZcdTk0RkVcdTYzQTVcblx0XHRjb25zdCBjb3B5TGlua0J0biA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicpO1xuXHRcdGNvcHlMaW5rQnRuLnRleHRDb250ZW50ID0gdGhpcy5wbHVnaW4udCgnY29weUxpbmtCdG4nKTtcblx0XHRjb3B5TGlua0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdGNvbnN0IGxpbmsgPSBgW1ske2ZpbGUubmFtZX1dXWA7XG5cdFx0XHR2b2lkIG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KGxpbmspLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2xpbmtDb3BpZWQnKSk7XG5cdFx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdlcnJvcicpKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU1NzI4XHU3QjE0XHU4QkIwXHU0RTJEXHU2N0U1XHU2MjdFXG5cdFx0Y29uc3QgZmluZEJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicpO1xuXHRcdGZpbmRCdG4udGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi50KCdmaW5kSW5Ob3RlcycpO1xuXHRcdGZpbmRCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHR0aGlzLmNsb3NlKCk7XG5cdFx0XHR0aGlzLnBsdWdpbi5vcGVuSW1hZ2VJbk5vdGVzKGZpbGUpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkNFOFx1NTE4Q1x1OTUyRVx1NzZEOFx1NUJGQ1x1ODIyQVxuXHQgKi9cblx0cmVnaXN0ZXJLZXlib2FyZE5hdigpIHtcblx0XHR0aGlzLmtleWRvd25IYW5kbGVyID0gKGU6IEtleWJvYXJkRXZlbnQpID0+IHtcblx0XHRcdHN3aXRjaCAoZS5rZXkpIHtcblx0XHRcdFx0Y2FzZSAnQXJyb3dMZWZ0Jzpcblx0XHRcdFx0XHR0aGlzLnByZXYoKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnQXJyb3dSaWdodCc6XG5cdFx0XHRcdFx0dGhpcy5uZXh0KCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0VzY2FwZSc6XG5cdFx0XHRcdFx0dGhpcy5jbG9zZSgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHR0aGlzLm1vZGFsRWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5ZG93bkhhbmRsZXIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NEUwQVx1NEUwMFx1NUYyMFxuXHQgKi9cblx0cHJldigpIHtcblx0XHRpZiAodGhpcy5jdXJyZW50SW5kZXggPiAwKSB7XG5cdFx0XHR0aGlzLmN1cnJlbnRJbmRleC0tO1xuXHRcdFx0dGhpcy51cGRhdGVDb250ZW50KCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NEUwQlx1NEUwMFx1NUYyMFxuXHQgKi9cblx0bmV4dCgpIHtcblx0XHRpZiAodGhpcy5jdXJyZW50SW5kZXggPCB0aGlzLmFsbEZpbGVzLmxlbmd0aCAtIDEpIHtcblx0XHRcdHRoaXMuY3VycmVudEluZGV4Kys7XG5cdFx0XHR0aGlzLnVwZGF0ZUNvbnRlbnQoKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2NkY0XHU2NUIwXHU1MTg1XHU1QkI5XG5cdCAqL1xuXHR1cGRhdGVDb250ZW50KCkge1xuXHRcdC8vIFx1NjhDMFx1NjdFNSBjb250ZW50RWwgXHU2NjJGXHU1NDI2XHU1QjU4XHU1NzI4XG5cdFx0aWYgKCF0aGlzLmNvbnRlbnRFbCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoJy5wcmV2aWV3LWNvbnRhaW5lcicpO1xuXHRcdGlmIChjb250YWluZXIpIHtcblx0XHRcdHRoaXMucmVuZGVyTWVkaWEoY29udGFpbmVyIGFzIEhUTUxFbGVtZW50KTtcblx0XHRcdGNvbnN0IG9sZE5hdiA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcucHJldmlldy1uYXYnKTtcblx0XHRcdGlmIChvbGROYXYpIG9sZE5hdi5yZW1vdmUoKTtcblx0XHRcdGlmICh0aGlzLmFsbEZpbGVzLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0dGhpcy5yZW5kZXJOYXZpZ2F0aW9uKGNvbnRhaW5lciBhcyBIVE1MRWxlbWVudCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGNvbnN0IG9sZEluZm9CYXIgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKCcucHJldmlldy1pbmZvLWJhcicpO1xuXHRcdGlmIChvbGRJbmZvQmFyKSBvbGRJbmZvQmFyLnJlbW92ZSgpO1xuXHRcdHRoaXMucmVuZGVySW5mb0Jhcih0aGlzLmNvbnRlbnRFbCk7XG5cdH1cblxuXHRvbkNsb3NlKCkge1xuXHRcdGNvbnN0IHsgY29udGVudEVsLCBtb2RhbEVsIH0gPSB0aGlzO1xuXHRcdC8vIFx1NzlGQlx1OTY2NFx1OTUyRVx1NzZEOFx1NEU4Qlx1NEVGNlx1NzZEMVx1NTQyQ1x1NTY2OFx1RkYwQ1x1OTYzMlx1NkI2Mlx1NTE4NVx1NUI1OFx1NkNDNFx1NkYwRlxuXHRcdGlmICh0aGlzLmtleWRvd25IYW5kbGVyKSB7XG5cdFx0XHRtb2RhbEVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWRvd25IYW5kbGVyKTtcblx0XHRcdHRoaXMua2V5ZG93bkhhbmRsZXIgPSBudWxsO1xuXHRcdH1cblx0XHRjb250ZW50RWwuZW1wdHkoKTtcblx0fVxufVxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgRHJvcGRvd25Db21wb25lbnQgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgSW1hZ2VNYW5hZ2VyUGx1Z2luIGZyb20gJy4vbWFpbic7XG5pbXBvcnQgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL3V0aWxzL2kxOG4nO1xuaW1wb3J0IHsgbm9ybWFsaXplVmF1bHRQYXRoIH0gZnJvbSAnLi91dGlscy9wYXRoJztcblxuZXhwb3J0IGludGVyZmFjZSBJbWFnZU1hbmFnZXJTZXR0aW5ncyB7XG5cdGltYWdlRm9sZGVyOiBzdHJpbmc7XG5cdHRodW1ibmFpbFNpemU6ICdzbWFsbCcgfCAnbWVkaXVtJyB8ICdsYXJnZSc7XG5cdHNob3dJbWFnZUluZm86IGJvb2xlYW47XG5cdHNvcnRCeTogJ25hbWUnIHwgJ2RhdGUnIHwgJ3NpemUnO1xuXHRzb3J0T3JkZXI6ICdhc2MnIHwgJ2Rlc2MnO1xuXHRhdXRvUmVmcmVzaDogYm9vbGVhbjtcblx0ZGVmYXVsdEFsaWdubWVudDogJ2xlZnQnIHwgJ2NlbnRlcicgfCAncmlnaHQnO1xuXHR1c2VUcmFzaEZvbGRlcjogYm9vbGVhbjtcblx0dHJhc2hGb2xkZXI6IHN0cmluZztcblx0YXV0b0NsZWFudXBUcmFzaDogYm9vbGVhbjtcblx0dHJhc2hDbGVhbnVwRGF5czogbnVtYmVyO1xuXHQvLyBcdTY1QjBcdTU4OUVcdThCQkVcdTdGNkVcblx0ZW5hYmxlSW1hZ2VzOiBib29sZWFuO1xuXHRlbmFibGVWaWRlb3M6IGJvb2xlYW47XG5cdGVuYWJsZUF1ZGlvOiBib29sZWFuO1xuXHRlbmFibGVQREY6IGJvb2xlYW47XG5cdHBhZ2VTaXplOiBudW1iZXI7XG5cdGVuYWJsZVByZXZpZXdNb2RhbDogYm9vbGVhbjtcblx0ZW5hYmxlS2V5Ym9hcmROYXY6IGJvb2xlYW47XG5cdC8vIFx1NTZGRFx1OTY0NVx1NTMxNlx1OEJCRVx1N0Y2RVxuXHRsYW5ndWFnZTogJ3poJyB8ICdlbicgfCAnc3lzdGVtJztcblx0Ly8gUXVhcmFudGluZSBcdTVCODlcdTUxNjhcdTYyNkJcdTYzQ0Zcblx0c2FmZVNjYW5FbmFibGVkOiBib29sZWFuO1xuXHRzYWZlU2NhblVucmVmRGF5czogbnVtYmVyO1xuXHRzYWZlU2Nhbk1pblNpemU6IG51bWJlcjsgLy8gYnl0ZXNcblx0Ly8gXHU1M0JCXHU5MUNEXHU4QkJFXHU3RjZFXG5cdGR1cGxpY2F0ZVRocmVzaG9sZDogbnVtYmVyO1xuXHQvLyBcdTgxRUFcdTUyQThcdTY1NzRcdTc0MDZcdTg5QzRcdTUyMTlcblx0b3JnYW5pemVSdWxlczogT3JnYW5pemVSdWxlW107XG5cdC8vIFx1NUE5Mlx1NEY1M1x1NTkwNFx1NzQwNlx1OUVEOFx1OEJBNFx1NTNDMlx1NjU3MFxuXHRkZWZhdWx0UHJvY2Vzc1F1YWxpdHk6IG51bWJlcjtcblx0ZGVmYXVsdFByb2Nlc3NGb3JtYXQ6ICd3ZWJwJyB8ICdqcGVnJyB8ICdwbmcnO1xuXHR3YXRlcm1hcmtUZXh0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3JnYW5pemVSdWxlIHtcblx0bmFtZTogc3RyaW5nO1xuXHRlbmFibGVkOiBib29sZWFuO1xuXHRwYXRoVGVtcGxhdGU6IHN0cmluZztcblx0cmVuYW1lVGVtcGxhdGU6IHN0cmluZztcblx0bWF0Y2hFeHRlbnNpb25zOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBJbWFnZU1hbmFnZXJTZXR0aW5ncyA9IHtcblx0aW1hZ2VGb2xkZXI6ICcnLFxuXHR0aHVtYm5haWxTaXplOiAnbWVkaXVtJyxcblx0c2hvd0ltYWdlSW5mbzogdHJ1ZSxcblx0c29ydEJ5OiAnbmFtZScsXG5cdHNvcnRPcmRlcjogJ2FzYycsXG5cdGF1dG9SZWZyZXNoOiB0cnVlLFxuXHRkZWZhdWx0QWxpZ25tZW50OiAnY2VudGVyJyxcblx0dXNlVHJhc2hGb2xkZXI6IHRydWUsXG5cdHRyYXNoRm9sZGVyOiAnb2JzaWRpYW4tbWVkaWEtdG9vbGtpdC10cmFzaCcsXG5cdGF1dG9DbGVhbnVwVHJhc2g6IGZhbHNlLFxuXHR0cmFzaENsZWFudXBEYXlzOiAzMCxcblx0Ly8gXHU2NUIwXHU1ODlFXHU5RUQ4XHU4QkE0XHU1MDNDXG5cdGVuYWJsZUltYWdlczogdHJ1ZSxcblx0ZW5hYmxlVmlkZW9zOiB0cnVlLFxuXHRlbmFibGVBdWRpbzogdHJ1ZSxcblx0ZW5hYmxlUERGOiB0cnVlLFxuXHRwYWdlU2l6ZTogNTAsXG5cdGVuYWJsZVByZXZpZXdNb2RhbDogdHJ1ZSxcblx0ZW5hYmxlS2V5Ym9hcmROYXY6IHRydWUsXG5cdC8vIFx1NTZGRFx1OTY0NVx1NTMxNlx1OEJCRVx1N0Y2RVxuXHRsYW5ndWFnZTogJ3N5c3RlbScsXG5cdC8vIFF1YXJhbnRpbmUgXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGXG5cdHNhZmVTY2FuRW5hYmxlZDogZmFsc2UsXG5cdHNhZmVTY2FuVW5yZWZEYXlzOiAzMCxcblx0c2FmZVNjYW5NaW5TaXplOiA1ICogMTAyNCAqIDEwMjQsIC8vIDVNQlxuXHQvLyBcdTUzQkJcdTkxQ0Rcblx0ZHVwbGljYXRlVGhyZXNob2xkOiA5MCxcblx0Ly8gXHU4MUVBXHU1MkE4XHU2NTc0XHU3NDA2XG5cdG9yZ2FuaXplUnVsZXM6IFtcblx0XHR7XG5cdFx0XHRuYW1lOiAnRGVmYXVsdCcsXG5cdFx0XHRlbmFibGVkOiBmYWxzZSxcblx0XHRcdHBhdGhUZW1wbGF0ZTogJ01lZGlhL3t5ZWFyfS97bW9udGh9Jyxcblx0XHRcdHJlbmFtZVRlbXBsYXRlOiAne25hbWV9Jyxcblx0XHRcdG1hdGNoRXh0ZW5zaW9uczogJ2pwZyxqcGVnLHBuZyxnaWYsd2VicCdcblx0XHR9XG5cdF0sXG5cdC8vIFx1NUE5Mlx1NEY1M1x1NTkwNFx1NzQwNlxuXHRkZWZhdWx0UHJvY2Vzc1F1YWxpdHk6IDgwLFxuXHRkZWZhdWx0UHJvY2Vzc0Zvcm1hdDogJ3dlYnAnLFxuXHR3YXRlcm1hcmtUZXh0OiAnJ1xufTtcblxuZXhwb3J0IGNsYXNzIFNldHRpbmdzVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG5cdHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luO1xuXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbikge1xuXHRcdHN1cGVyKGFwcCwgcGx1Z2luKTtcblx0XHR0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblx0fVxuXG5cdC8vIFx1N0ZGQlx1OEJEMVx1OEY4NVx1NTJBOVx1NjVCOVx1NkNENVxuXHRwcml2YXRlIHQoa2V5OiBrZXlvZiBUcmFuc2xhdGlvbnMpOiBzdHJpbmcge1xuXHRcdHJldHVybiB0aGlzLnBsdWdpbi50KGtleSk7XG5cdH1cblxuXHRkaXNwbGF5KCk6IHZvaWQge1xuXHRcdGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcblxuXHRcdC8vIFx1NEY3Rlx1NzUyOFx1N0ZGQlx1OEJEMVxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy50KCdwbHVnaW5TZXR0aW5ncycpIH0pO1xuXG5cdFx0Ly8gXHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHU1OTM5XHU4QkJFXHU3RjZFXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ21lZGlhRm9sZGVyJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ21lZGlhRm9sZGVyRGVzYycpKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB0ZXh0XG5cdFx0XHRcdC5zZXRQbGFjZWhvbGRlcignYXR0YWNobWVudHMvbWVkaWEnKVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGb2xkZXIpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZvbGRlciA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh2YWx1ZSk7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uY2xlYXJDYWNoZSgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTdGMjlcdTc1NjVcdTU2RkVcdTU5MjdcdTVDMEZcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgndGh1bWJuYWlsU2l6ZScpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCd0aHVtYm5haWxTaXplRGVzYycpKVxuXHRcdFx0LmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IGRyb3Bkb3duXG5cdFx0XHRcdC5hZGRPcHRpb24oJ3NtYWxsJywgdGhpcy50KCd0aHVtYm5haWxTbWFsbCcpKVxuXHRcdFx0XHQuYWRkT3B0aW9uKCdtZWRpdW0nLCB0aGlzLnQoJ3RodW1ibmFpbE1lZGl1bScpKVxuXHRcdFx0XHQuYWRkT3B0aW9uKCdsYXJnZScsIHRoaXMudCgndGh1bWJuYWlsTGFyZ2UnKSlcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRodW1ibmFpbFNpemUpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWU6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnRodW1ibmFpbFNpemUgPSB2YWx1ZSBhcyAnc21hbGwnIHwgJ21lZGl1bScgfCAnbGFyZ2UnO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTYzOTJcdTVFOEZcdTY1QjlcdTVGMEZcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZGVmYXVsdFNvcnRCeScpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdzb3J0QnlEZXNjJykpXG5cdFx0XHQuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4gZHJvcGRvd25cblx0XHRcdFx0LmFkZE9wdGlvbignbmFtZScsIHRoaXMudCgnc29ydEJ5TmFtZScpKVxuXHRcdFx0XHQuYWRkT3B0aW9uKCdkYXRlJywgdGhpcy50KCdzb3J0QnlEYXRlJykpXG5cdFx0XHRcdC5hZGRPcHRpb24oJ3NpemUnLCB0aGlzLnQoJ3NvcnRCeVNpemUnKSlcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRCeSlcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3Muc29ydEJ5ID0gdmFsdWUgYXMgJ25hbWUnIHwgJ2RhdGUnIHwgJ3NpemUnO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTYzOTJcdTVFOEZcdTk4N0FcdTVFOEZcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnc29ydE9yZGVyJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ3NvcnRPcmRlckRlc2MnKSlcblx0XHRcdC5hZGREcm9wZG93bihkcm9wZG93biA9PiBkcm9wZG93blxuXHRcdFx0XHQuYWRkT3B0aW9uKCdhc2MnLCB0aGlzLnQoJ3NvcnRBc2MnKSlcblx0XHRcdFx0LmFkZE9wdGlvbignZGVzYycsIHRoaXMudCgnc29ydERlc2MnKSlcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRPcmRlcilcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3Muc29ydE9yZGVyID0gdmFsdWUgYXMgJ2FzYycgfCAnZGVzYyc7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NjYzRVx1NzkzQVx1NTZGRVx1NzI0N1x1NEZFMVx1NjA2RlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdzaG93SW1hZ2VJbmZvJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ3Nob3dJbWFnZUluZm9EZXNjJykpXG5cdFx0XHQuYWRkVG9nZ2xlKHRvZ2dsZSA9PiB0b2dnbGVcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dJbWFnZUluZm8pXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93SW1hZ2VJbmZvID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1ODFFQVx1NTJBOFx1NTIzN1x1NjVCMFxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdhdXRvUmVmcmVzaCcpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdhdXRvUmVmcmVzaERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1JlZnJlc2gpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvUmVmcmVzaCA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTlFRDhcdThCQTRcdTVCRjlcdTlGNTBcdTY1QjlcdTVGMEZcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZGVmYXVsdEFsaWdubWVudCcpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdhbGlnbm1lbnREZXNjJykpXG5cdFx0XHQuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4gZHJvcGRvd25cblx0XHRcdFx0LmFkZE9wdGlvbignbGVmdCcsIHRoaXMudCgnYWxpZ25MZWZ0JykpXG5cdFx0XHRcdC5hZGRPcHRpb24oJ2NlbnRlcicsIHRoaXMudCgnYWxpZ25DZW50ZXInKSlcblx0XHRcdFx0LmFkZE9wdGlvbigncmlnaHQnLCB0aGlzLnQoJ2FsaWduUmlnaHQnKSlcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRBbGlnbm1lbnQpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWU6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRBbGlnbm1lbnQgPSB2YWx1ZSBhcyAnbGVmdCcgfCAnY2VudGVyJyB8ICdyaWdodCc7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NTIwNlx1OTY5NFx1N0VCRlxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdocicsIHsgY2xzOiAnc2V0dGluZ3MtZGl2aWRlcicgfSk7XG5cblx0XHQvLyBcdTVCODlcdTUxNjhcdTUyMjBcdTk2NjRcdThCQkVcdTdGNkVcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6IHRoaXMudCgnc2FmZURlbGV0ZVNldHRpbmdzJykgfSk7XG5cblx0XHQvLyBcdTRGN0ZcdTc1MjhcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzlcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgndXNlVHJhc2hGb2xkZXInKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgndXNlVHJhc2hGb2xkZXJEZXNjJykpXG5cdFx0XHQuYWRkVG9nZ2xlKHRvZ2dsZSA9PiB0b2dnbGVcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnVzZVRyYXNoRm9sZGVyKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlVHJhc2hGb2xkZXIgPSB2YWx1ZTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0Ly8gXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU4REVGXHU1Rjg0XG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ3RyYXNoRm9sZGVyUGF0aCcpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCd0cmFzaEZvbGRlclBhdGhEZXNjJykpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHRleHRcblx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCdvYnNpZGlhbi1tZWRpYS10b29sa2l0LXRyYXNoJylcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRyYXNoRm9sZGVyKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MudHJhc2hGb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodmFsdWUpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTgxRUFcdTUyQThcdTZFMDVcdTc0MDZcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzlcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnYXV0b0NsZWFudXBUcmFzaCcpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdhdXRvQ2xlYW51cFRyYXNoRGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvQ2xlYW51cFRyYXNoKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0NsZWFudXBUcmFzaCA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTZFMDVcdTc0MDZcdTU5MjlcdTY1NzBcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnY2xlYW51cERheXMnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnY2xlYW51cERheXNEZXNjJykpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHRleHRcblx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCczMCcpXG5cdFx0XHRcdC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MudHJhc2hDbGVhbnVwRGF5cykpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRjb25zdCBkYXlzID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcblx0XHRcdFx0XHRpZiAoIWlzTmFOKGRheXMpICYmIGRheXMgPiAwKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy50cmFzaENsZWFudXBEYXlzID0gZGF5cztcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSkpO1xuXG5cdFx0Ly8gXHU1MjA2XHU5Njk0XHU3RUJGXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2hyJywgeyBjbHM6ICdzZXR0aW5ncy1kaXZpZGVyJyB9KTtcblxuXHRcdC8vIFx1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRlx1OEJCRVx1N0Y2RVxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogdGhpcy50KCdzYWZlU2NhblNldHRpbmdzJykgfSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnc2FmZVNjYW4nKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnc2FmZVNjYW5FbmFibGVkRGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zYWZlU2NhbkVuYWJsZWQpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zYWZlU2NhbkVuYWJsZWQgPSB2YWx1ZTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ3NhZmVTY2FuVW5yZWZEYXlzJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ3NhZmVTY2FuVW5yZWZEYXlzRGVzYycpKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB0ZXh0XG5cdFx0XHRcdC5zZXRQbGFjZWhvbGRlcignMzAnKVxuXHRcdFx0XHQuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnNhZmVTY2FuVW5yZWZEYXlzKSlcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGRheXMgPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuXHRcdFx0XHRcdGlmICghaXNOYU4oZGF5cykgJiYgZGF5cyA+IDApIHtcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnNhZmVTY2FuVW5yZWZEYXlzID0gZGF5cztcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSkpO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ3NhZmVTY2FuTWluU2l6ZScpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdzYWZlU2Nhbk1pblNpemVEZXNjJykpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHRleHRcblx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCc1Jylcblx0XHRcdFx0LnNldFZhbHVlKFN0cmluZyhOdW1iZXIoKHRoaXMucGx1Z2luLnNldHRpbmdzLnNhZmVTY2FuTWluU2l6ZSAvICgxMDI0ICogMTAyNCkpLnRvRml4ZWQoMikpKSlcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHNpemVNYiA9IHBhcnNlRmxvYXQodmFsdWUpO1xuXHRcdFx0XHRcdGlmICghaXNOYU4oc2l6ZU1iKSAmJiBzaXplTWIgPj0gMCkge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3Muc2FmZVNjYW5NaW5TaXplID0gTWF0aC5yb3VuZChzaXplTWIgKiAxMDI0ICogMTAyNCk7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NTIwNlx1OTY5NFx1N0VCRlxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdocicsIHsgY2xzOiAnc2V0dGluZ3MtZGl2aWRlcicgfSk7XG5cblx0XHQvLyBcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEJcdThCQkVcdTdGNkVcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6IHRoaXMudCgnZHVwbGljYXRlRGV0ZWN0aW9uU2V0dGluZ3MnKSB9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdkdXBsaWNhdGVUaHJlc2hvbGRTZXR0aW5nJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2R1cGxpY2F0ZVRocmVzaG9sZERlc2MnKSlcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuXHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoJzkwJylcblx0XHRcdFx0LnNldFZhbHVlKFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kdXBsaWNhdGVUaHJlc2hvbGQpKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgdGhyZXNob2xkID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcblx0XHRcdFx0XHRpZiAoIWlzTmFOKHRocmVzaG9sZCkgJiYgdGhyZXNob2xkID49IDUwICYmIHRocmVzaG9sZCA8PSAxMDApIHtcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLmR1cGxpY2F0ZVRocmVzaG9sZCA9IHRocmVzaG9sZDtcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSkpO1xuXG5cdFx0Ly8gXHU1MjA2XHU5Njk0XHU3RUJGXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2hyJywgeyBjbHM6ICdzZXR0aW5ncy1kaXZpZGVyJyB9KTtcblxuXHRcdC8vIFx1NUE5Mlx1NEY1M1x1N0M3Qlx1NTc4Qlx1OEZDN1x1NkVFNFxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogdGhpcy50KCdtZWRpYVR5cGVzJykgfSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZW5hYmxlSW1hZ2VTdXBwb3J0JykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2VuYWJsZUltYWdlU3VwcG9ydERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlSW1hZ2VzKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlSW1hZ2VzID0gdmFsdWU7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uY2xlYXJDYWNoZSgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZW5hYmxlVmlkZW9TdXBwb3J0JykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2VuYWJsZVZpZGVvU3VwcG9ydERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlVmlkZW9zKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlVmlkZW9zID0gdmFsdWU7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uY2xlYXJDYWNoZSgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZW5hYmxlQXVkaW9TdXBwb3J0JykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2VuYWJsZUF1ZGlvU3VwcG9ydERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQXVkaW8pXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBdWRpbyA9IHZhbHVlO1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLmNsZWFyQ2FjaGUoKTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ2VuYWJsZVBERlN1cHBvcnQnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnZW5hYmxlUERGU3VwcG9ydERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlUERGKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlUERGID0gdmFsdWU7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uY2xlYXJDYWNoZSgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTUyMDZcdTk2OTRcdTdFQkZcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaHInLCB7IGNsczogJ3NldHRpbmdzLWRpdmlkZXInIH0pO1xuXG5cdFx0Ly8gXHU4OUM2XHU1NkZFXHU4QkJFXHU3RjZFXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiB0aGlzLnQoJ3ZpZXdTZXR0aW5ncycpIH0pO1xuXG5cdFx0Ly8gXHU4QkVEXHU4QTAwXHU4QkJFXHU3RjZFXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ2ludGVyZmFjZUxhbmd1YWdlJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2xhbmd1YWdlRGVzYycpKVxuXHRcdFx0LmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IGRyb3Bkb3duXG5cdFx0XHRcdC5hZGRPcHRpb24oJ3N5c3RlbScsIHRoaXMudCgnbGFuZ3VhZ2VTeXN0ZW0nKSlcblx0XHRcdFx0LmFkZE9wdGlvbignemgnLCAnXHU0RTJEXHU2NTg3Jylcblx0XHRcdFx0LmFkZE9wdGlvbignZW4nLCAnRW5nbGlzaCcpXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5sYW5ndWFnZSlcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MubGFuZ3VhZ2UgPSB2YWx1ZSBhcyAnemgnIHwgJ2VuJyB8ICdzeXN0ZW0nO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgncGFnZVNpemUnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgncGFnZVNpemVEZXNjJykpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHRleHRcblx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCc1MCcpXG5cdFx0XHRcdC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MucGFnZVNpemUpKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3Qgc2l6ZSA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG5cdFx0XHRcdFx0aWYgKCFpc05hTihzaXplKSAmJiBzaXplID4gMCkge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MucGFnZVNpemUgPSBzaXplO1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZW5hYmxlUHJldmlld01vZGFsJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2VuYWJsZVByZXZpZXdNb2RhbERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlUHJldmlld01vZGFsKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlUHJldmlld01vZGFsID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdlbmFibGVLZXlib2FyZE5hdicpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdlbmFibGVLZXlib2FyZE5hdkRlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlS2V5Ym9hcmROYXYpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVLZXlib2FyZE5hdiA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTUyMDZcdTk2OTRcdTdFQkZcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaHInLCB7IGNsczogJ3NldHRpbmdzLWRpdmlkZXInIH0pO1xuXG5cdFx0Ly8gXHU1RTJFXHU1MkE5XHU0RkUxXHU2MDZGXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiB0aGlzLnQoJ2tleWJvYXJkU2hvcnRjdXRzJykgfSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3AnLCB7XG5cdFx0XHR0ZXh0OiB0aGlzLnQoJ3Nob3J0Y3V0c0Rlc2MnKSxcblx0XHRcdGNsczogJ3NldHRpbmdzLWRlc2NyaXB0aW9uJ1xuXHRcdH0pO1xuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCd1bCcsIHsgY2xzOiAnc2V0dGluZ3MtbGlzdCcgfSkuY3JlYXRlRWwoJ2xpJywgeyB0ZXh0OiB0aGlzLnQoJ3Nob3J0Y3V0T3BlbkxpYnJhcnknKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdzaG9ydGN1dEZpbmRVbnJlZmVyZW5jZWQnKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdzaG9ydGN1dE9wZW5UcmFzaCcpIH0pO1xuXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiB0aGlzLnQoJ2NvbW1hbmRzJykgfSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3AnLCB7XG5cdFx0XHR0ZXh0OiB0aGlzLnQoJ2NvbW1hbmRzRGVzYycpLFxuXHRcdFx0Y2xzOiAnc2V0dGluZ3MtZGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3VsJywgeyBjbHM6ICdzZXR0aW5ncy1saXN0JyB9KS5jcmVhdGVFbCgnbGknLCB7IHRleHQ6IHRoaXMudCgnY21kT3BlbkxpYnJhcnknKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdjbWRGaW5kVW5yZWZlcmVuY2VkJykgfSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3VsJywgeyBjbHM6ICdzZXR0aW5ncy1saXN0JyB9KS5jcmVhdGVFbCgnbGknLCB7IHRleHQ6IHRoaXMudCgnY21kVHJhc2hNYW5hZ2VtZW50JykgfSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3VsJywgeyBjbHM6ICdzZXR0aW5ncy1saXN0JyB9KS5jcmVhdGVFbCgnbGknLCB7IHRleHQ6IHRoaXMudCgnY21kQWxpZ25MZWZ0JykgfSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3VsJywgeyBjbHM6ICdzZXR0aW5ncy1saXN0JyB9KS5jcmVhdGVFbCgnbGknLCB7IHRleHQ6IHRoaXMudCgnY21kQWxpZ25DZW50ZXInKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdjbWRBbGlnblJpZ2h0JykgfSk7XG5cdH1cbn1cbiIsICJpbXBvcnQgeyBlc2NhcGVIdG1sQXR0ciB9IGZyb20gJy4vc2VjdXJpdHknO1xuXG5leHBvcnQgdHlwZSBBbGlnbm1lbnRUeXBlID0gJ2xlZnQnIHwgJ2NlbnRlcicgfCAncmlnaHQnO1xuXG5leHBvcnQgY2xhc3MgSW1hZ2VBbGlnbm1lbnQge1xuXHQvKipcblx0ICogXHU1M0JCXHU5NjY0XHU1REYyXHU1QjU4XHU1NzI4XHU3Njg0XHU1QkY5XHU5RjUwXHU1MzA1XHU4OEM1XHVGRjBDXHU5MDdGXHU1MTREXHU5MUNEXHU1OTBEXHU1RDRDXHU1OTU3XG5cdCAqL1xuXHRwcml2YXRlIHN0YXRpYyBzdHJpcEV4aXN0aW5nQWxpZ25tZW50KG1hcmtkb3duOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdGxldCBjbGVhbk1hcmtkb3duID0gbWFya2Rvd24udHJpbSgpO1xuXG5cdFx0Ly8gXHU1MzM5XHU5MTREID09PWNlbnRlcj09PSBcdTU3NTdcdThCRURcdTZDRDVcdUZGMDhcdTY1RTdcdTc2ODRcdUZGMDlcblx0XHRjb25zdCBibG9ja01hdGNoID0gY2xlYW5NYXJrZG93bi5tYXRjaCgvXj09PVxccyoobGVmdHxjZW50ZXJ8cmlnaHQpXFxzKj09PVxccyooW1xcc1xcU10qPylcXHMqPT09JC9pKTtcblx0XHRpZiAoYmxvY2tNYXRjaCkge1xuXHRcdFx0cmV0dXJuIGJsb2NrTWF0Y2hbMl0udHJpbSgpO1xuXHRcdH1cblxuXHRcdC8vIFx1NTMzOVx1OTE0RCB7YWxpZ249Y2VudGVyfSBcdTYyMTYgeyBhbGlnbj1jZW50ZXIgfSBcdTk4Q0VcdTY4M0NcdUZGMDhcdTY1RTdcdTc2ODRcdUZGMDlcblx0XHRjbGVhbk1hcmtkb3duID0gY2xlYW5NYXJrZG93bi5yZXBsYWNlKC9eXFx7XFxzKmFsaWduXFxzKj1cXHMqKGxlZnR8Y2VudGVyfHJpZ2h0KVxccypcXH1cXHMqL2ksICcnKS50cmltKCk7XG5cblx0XHQvLyBcdTUzMzlcdTkxNERcdTY1QjBcdTc2ODRcdTYyNjlcdTVDNTVcdTk0RkVcdTYzQTVcdThCRURcdTZDRDUgIVtbaW1hZ2V8Y2VudGVyXV0gXHU2MjE2ICFbW2ltYWdlfGFsaWduXV1cblx0XHQvLyBcdTYzRDBcdTUzRDZcdTUxRkFcdTU2RkVcdTcyNDdcdThERUZcdTVGODRcdUZGMENcdTUzQkJcdTk2NjRcdTVCRjlcdTlGNTBcdTUzQzJcdTY1NzBcblx0XHRjb25zdCBsaW5rTWF0Y2ggPSBjbGVhbk1hcmtkb3duLm1hdGNoKC9eIT9cXFtcXFsoW15cXF18XSspXFx8KFteXFxdXSspXFxdXFxdJC8pO1xuXHRcdGlmIChsaW5rTWF0Y2gpIHtcblx0XHRcdC8vIFx1NTk4Mlx1Njc5Q1x1N0IyQ1x1NEU4Q1x1NEUyQVx1NTNDMlx1NjU3MFx1NjYyRiBsZWZ0L2NlbnRlci9yaWdodFx1RkYwQ1x1NTIxOVx1NTNCQlx1NjM4OVx1NUI4M1xuXHRcdFx0Y29uc3QgYWxpZ25tZW50ID0gbGlua01hdGNoWzJdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRpZiAoYWxpZ25tZW50ID09PSAnbGVmdCcgfHwgYWxpZ25tZW50ID09PSAnY2VudGVyJyB8fCBhbGlnbm1lbnQgPT09ICdyaWdodCcpIHtcblx0XHRcdFx0cmV0dXJuIGAhW1ske2xpbmtNYXRjaFsxXX1dXWA7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gXHU0RTVGXHU2NTJGXHU2MzAxXHU2ODA3XHU1MUM2XHU3Njg0IFtbaW1hZ2UucG5nfDMwMF1dIFx1NUJCRFx1NUVBNlx1NTNDMlx1NjU3MFx1NUY2Mlx1NUYwRlxuXHRcdGNsZWFuTWFya2Rvd24gPSBjbGVhbk1hcmtkb3duLnJlcGxhY2UoL15cXHtcXHMqXFwuKGxlZnR8Y2VudGVyfHJpZ2h0KVxccypcXH0kL2ksICcnKS50cmltKCk7XG5cblx0XHRyZXR1cm4gY2xlYW5NYXJrZG93bjtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTRFM0FcdTU2RkVcdTcyNDdNYXJrZG93blx1OEJFRFx1NkNENVx1NkRGQlx1NTJBMFx1NUJGOVx1OUY1MFx1NUM1RVx1NjAyN1xuXHQgKiBcdTY1QjBcdThCRURcdTZDRDU6ICFbW2ltYWdlLnBuZ3xjZW50ZXJdXVxuXHQgKi9cblx0c3RhdGljIGFwcGx5QWxpZ25tZW50KG1hcmtkb3duOiBzdHJpbmcsIGFsaWdubWVudDogQWxpZ25tZW50VHlwZSk6IHN0cmluZyB7XG5cdFx0Y29uc3QgY2xlYW5NYXJrZG93biA9IHRoaXMuc3RyaXBFeGlzdGluZ0FsaWdubWVudChtYXJrZG93bikudHJpbSgpO1xuXG5cdFx0Ly8gXHU1MzM5XHU5MTREIFdpa2kgXHU5NEZFXHU2M0E1XHU4QkVEXHU2Q0Q1ICFbW2ltYWdlLnBuZ11dIFx1NjIxNiBbW2ltYWdlLnBuZ11dXG5cdFx0Y29uc3Qgd2lraUxpbmtNYXRjaCA9IGNsZWFuTWFya2Rvd24ubWF0Y2goL14hP1xcW1xcWyhbXlxcXV0rKVxcXVxcXSQvKTtcblx0XHRpZiAod2lraUxpbmtNYXRjaCkge1xuXHRcdFx0Y29uc3QgaW1hZ2VQYXRoID0gd2lraUxpbmtNYXRjaFsxXTtcblx0XHRcdHJldHVybiBgIVtbJHtpbWFnZVBhdGh9fCR7YWxpZ25tZW50fV1dYDtcblx0XHR9XG5cblx0XHQvLyBcdTUzMzlcdTkxNERcdTY4MDdcdTUxQzYgTWFya2Rvd24gXHU1NkZFXHU3MjQ3XHU4QkVEXHU2Q0Q1ICFbYWx0XShpbWFnZS5wbmcpXG5cdFx0Y29uc3QgbWRJbWFnZU1hdGNoID0gY2xlYW5NYXJrZG93bi5tYXRjaCgvXiFcXFsoW15cXF1dKilcXF1cXCgoW14pXSspXFwpJC8pO1xuXHRcdGlmIChtZEltYWdlTWF0Y2gpIHtcblx0XHRcdGNvbnN0IGFsdFRleHQgPSBtZEltYWdlTWF0Y2hbMV07XG5cdFx0XHRjb25zdCBpbWFnZVBhdGggPSBtZEltYWdlTWF0Y2hbMl07XG5cdFx0XHQvLyBcdThGNkNcdTYzNjJcdTRFM0EgV2lraSBcdTk0RkVcdTYzQTVcdThCRURcdTZDRDUgKyBcdTVCRjlcdTlGNTBcdTUzQzJcdTY1NzBcblx0XHRcdHJldHVybiBgIVtbJHtpbWFnZVBhdGh9fCR7YWxpZ25tZW50fV1dYDtcblx0XHR9XG5cblx0XHQvLyBcdTU5ODJcdTY3OUNcdTRFMERcdTY2MkZcdTU2RkVcdTcyNDdcdThCRURcdTZDRDVcdUZGMENcdThGRDRcdTU2REVcdTUzOUZcdTY4Mzdcblx0XHRyZXR1cm4gbWFya2Rvd247XG5cdH1cblxuXHQvKipcblx0ICogXHU0RUNFXHU1NkZFXHU3MjQ3XHU4QkVEXHU2Q0Q1XHU0RTJEXHU2M0QwXHU1M0Q2XHU1QkY5XHU5RjUwXHU2NUI5XHU1RjBGXG5cdCAqIFx1NjUyRlx1NjMwMTogIVtbaW1hZ2UucG5nfGNlbnRlcl1dLCA9PT1jZW50ZXI9PT0gXHU1NzU3XHU4QkVEXHU2Q0Q1LCB7YWxpZ249Y2VudGVyfSBcdTk4Q0VcdTY4M0Ncblx0ICovXG5cdHN0YXRpYyBnZXRBbGlnbm1lbnQobWFya2Rvd246IHN0cmluZyk6IEFsaWdubWVudFR5cGUgfCBudWxsIHtcblx0XHQvLyBcdTUzMzlcdTkxNERcdTY1QjBcdTc2ODRcdTYyNjlcdTVDNTVcdTk0RkVcdTYzQTVcdThCRURcdTZDRDUgIVtbaW1hZ2V8Y2VudGVyXV1cblx0XHRjb25zdCBsaW5rTWF0Y2ggPSBtYXJrZG93bi5tYXRjaCgvIT9cXFtcXFsoW15cXF18XSspXFx8KFteXFxdXSspXFxdXFxdLyk7XG5cdFx0aWYgKGxpbmtNYXRjaCkge1xuXHRcdFx0Y29uc3QgYWxpZ25tZW50ID0gbGlua01hdGNoWzJdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRpZiAoYWxpZ25tZW50ID09PSAnbGVmdCcgfHwgYWxpZ25tZW50ID09PSAnY2VudGVyJyB8fCBhbGlnbm1lbnQgPT09ICdyaWdodCcpIHtcblx0XHRcdFx0cmV0dXJuIGFsaWdubWVudCBhcyBBbGlnbm1lbnRUeXBlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFx1NTMzOVx1OTE0RCA9PT1jZW50ZXI9PT0gXHU1NzU3XHU4QkVEXHU2Q0Q1XHVGRjA4XHU0RkREXHU3NTU5XHU1MTdDXHU1QkI5XHU2NUU3XHU3Njg0XHVGRjA5XG5cdFx0Y29uc3QgYmxvY2tNYXRjaCA9IG1hcmtkb3duLm1hdGNoKC9ePT09XFxzKihsZWZ0fGNlbnRlcnxyaWdodClcXHMqPT09L2kpO1xuXHRcdGlmIChibG9ja01hdGNoKSB7XG5cdFx0XHRjb25zdCBhbGlnbm1lbnQgPSBibG9ja01hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRpZiAoYWxpZ25tZW50ID09PSAnbGVmdCcgfHwgYWxpZ25tZW50ID09PSAnY2VudGVyJyB8fCBhbGlnbm1lbnQgPT09ICdyaWdodCcpIHtcblx0XHRcdFx0cmV0dXJuIGFsaWdubWVudCBhcyBBbGlnbm1lbnRUeXBlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFx1NTMzOVx1OTE0RCB7YWxpZ249Y2VudGVyfSBcdTYyMTYgeyBhbGlnbj1jZW50ZXIgfSBcdTk4Q0VcdTY4M0NcdUZGMDhcdTRGRERcdTc1NTlcdTUxN0NcdTVCQjlcdTY1RTdcdTc2ODRcdUZGMDlcblx0XHRjb25zdCBhbGlnbk1hdGNoID0gbWFya2Rvd24ubWF0Y2goL3tcXHMqYWxpZ25cXHMqPVxccyooXFx3KylcXHMqfS9pKTtcblx0XHRpZiAoYWxpZ25NYXRjaCkge1xuXHRcdFx0Y29uc3QgYWxpZ25tZW50ID0gYWxpZ25NYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0aWYgKGFsaWdubWVudCA9PT0gJ2xlZnQnIHx8IGFsaWdubWVudCA9PT0gJ2NlbnRlcicgfHwgYWxpZ25tZW50ID09PSAncmlnaHQnKSB7XG5cdFx0XHRcdHJldHVybiBhbGlnbm1lbnQgYXMgQWxpZ25tZW50VHlwZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBcdTUzMzlcdTkxNEQgey5jZW50ZXJ9IFx1OThDRVx1NjgzQ1xuXHRcdGNvbnN0IGNsYXNzTWF0Y2ggPSBtYXJrZG93bi5tYXRjaCgvXFx7XFxzKlxcLihsZWZ0fGNlbnRlcnxyaWdodClcXHMqXFx9L2kpO1xuXHRcdGlmIChjbGFzc01hdGNoKSB7XG5cdFx0XHRyZXR1cm4gY2xhc3NNYXRjaFsxXS50b0xvd2VyQ2FzZSgpIGFzIEFsaWdubWVudFR5cGU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHQvKipcblx0ICogXHU3NTFGXHU2MjEwXHU1RTI2XHU1QkY5XHU5RjUwXHU2ODM3XHU1RjBGXHU3Njg0SFRNTFx1NTZGRVx1NzI0N1x1NjgwN1x1N0I3RVxuXHQgKi9cblx0c3RhdGljIHRvSFRNTChpbWFnZVBhdGg6IHN0cmluZywgYWx0VGV4dDogc3RyaW5nID0gJycsIGFsaWdubWVudDogQWxpZ25tZW50VHlwZSA9ICdjZW50ZXInKTogc3RyaW5nIHtcblx0XHRjb25zdCBzdHlsZU1hcDogUmVjb3JkPEFsaWdubWVudFR5cGUsIHN0cmluZz4gPSB7XG5cdFx0XHQnbGVmdCc6ICdkaXNwbGF5OiBibG9jazsgbWFyZ2luLWxlZnQ6IDA7IG1hcmdpbi1yaWdodDogYXV0bzsnLFxuXHRcdFx0J2NlbnRlcic6ICdkaXNwbGF5OiBibG9jazsgbWFyZ2luLWxlZnQ6IGF1dG87IG1hcmdpbi1yaWdodDogYXV0bzsnLFxuXHRcdFx0J3JpZ2h0JzogJ2Rpc3BsYXk6IGJsb2NrOyBtYXJnaW4tbGVmdDogYXV0bzsgbWFyZ2luLXJpZ2h0OiAwOydcblx0XHR9O1xuXG5cdFx0cmV0dXJuIGA8aW1nIHNyYz1cIiR7ZXNjYXBlSHRtbEF0dHIoaW1hZ2VQYXRoKX1cIiBhbHQ9XCIke2VzY2FwZUh0bWxBdHRyKGFsdFRleHQpfVwiIHN0eWxlPVwiJHtzdHlsZU1hcFthbGlnbm1lbnRdfVwiIC8+YDtcblx0fVxufVxuIiwgImltcG9ydCB7IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQsIFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IEltYWdlTWFuYWdlclBsdWdpbiBmcm9tICcuLi9tYWluJztcbmltcG9ydCB7IEFsaWdubWVudFR5cGUgfSBmcm9tICcuL2ltYWdlQWxpZ25tZW50JztcbmltcG9ydCB7IGlzU2FmZVVybCwgaXNQYXRoU2FmZSB9IGZyb20gJy4vc2VjdXJpdHknO1xuaW1wb3J0IHsgbm9ybWFsaXplVmF1bHRQYXRoIH0gZnJvbSAnLi9wYXRoJztcblxuLyoqXG4gKiBcdTU2RkVcdTcyNDdcdTVCRjlcdTlGNTAgUG9zdFByb2Nlc3NvclxuICogXHU2RTMyXHU2N0QzID09PWNlbnRlcj09PVx1MzAwMT09PWxlZnQ9PT1cdTMwMDE9PT1yaWdodD09PSBcdThCRURcdTZDRDVcbiAqIFx1NEVFNVx1NTNDQVx1NjVCMFx1NzY4NCAhW1tpbWFnZXxjZW50ZXJdXSBcdTYyNjlcdTVDNTVcdTk0RkVcdTYzQTVcdThCRURcdTZDRDVcbiAqL1xuZXhwb3J0IGNsYXNzIEFsaWdubWVudFBvc3RQcm9jZXNzb3Ige1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblxuXHRjb25zdHJ1Y3RvcihwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbikge1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkNFOFx1NTE4QyBQb3N0UHJvY2Vzc29yXG5cdCAqL1xuXHRyZWdpc3RlcigpIHtcblx0XHR0aGlzLnBsdWdpbi5yZWdpc3Rlck1hcmtkb3duUG9zdFByb2Nlc3NvcigoZWxlbWVudCwgY29udGV4dCkgPT4ge1xuXHRcdFx0dGhpcy5wcm9jZXNzQWxpZ25tZW50KGVsZW1lbnQpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTkwNFx1NzQwNlx1NUJGOVx1OUY1MFx1OEJFRFx1NkNENVxuXHQgKi9cblx0cHJpdmF0ZSBwcm9jZXNzQWxpZ25tZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG5cdFx0Ly8gXHU2N0U1XHU2MjdFXHU2MjQwXHU2NzA5XHU1MzA1XHU1NDJCXHU1QkY5XHU5RjUwXHU2ODA3XHU4QkIwXHU3Njg0XHU2NTg3XHU2NzJDXHU4MjgyXHU3MEI5XG5cdFx0Y29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihcblx0XHRcdGVsZW1lbnQsXG5cdFx0XHROb2RlRmlsdGVyLlNIT1dfVEVYVCxcblx0XHRcdG51bGxcblx0XHQpO1xuXG5cdFx0Y29uc3Qgbm9kZXNUb1Byb2Nlc3M6IHsgbm9kZTogVGV4dDsgcGFyZW50OiBIVE1MRWxlbWVudCB9W10gPSBbXTtcblx0XHRsZXQgbm9kZTogVGV4dCB8IG51bGw7XG5cblx0XHR3aGlsZSAobm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpIGFzIFRleHQpIHtcblx0XHRcdGNvbnN0IHRleHQgPSBub2RlLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0Y29uc3QgcGFyZW50RWxlbWVudCA9IG5vZGUucGFyZW50RWxlbWVudDtcblx0XHRcdGlmICghcGFyZW50RWxlbWVudCkgY29udGludWU7XG5cdFx0XHQvLyBcdTY4QzBcdTZENEJcdTY1RTdcdTc2ODQgPT09Y2VudGVyPT09IFx1OEJFRFx1NkNENSBcdTYyMTZcdTY1QjBcdTc2ODQgIVtbaW1hZ2V8Y2VudGVyXV0gXHU4QkVEXHU2Q0Q1XG5cdFx0XHRpZiAodGV4dC5pbmNsdWRlcygnPT09JykgJiYgKHRleHQuaW5jbHVkZXMoJ2NlbnRlcicpIHx8IHRleHQuaW5jbHVkZXMoJ2xlZnQnKSB8fCB0ZXh0LmluY2x1ZGVzKCdyaWdodCcpKSkge1xuXHRcdFx0XHRub2Rlc1RvUHJvY2Vzcy5wdXNoKHsgbm9kZSwgcGFyZW50OiBwYXJlbnRFbGVtZW50IH0pO1xuXHRcdFx0fSBlbHNlIGlmICh0ZXh0LmluY2x1ZGVzKCd8Y2VudGVyJykgfHwgdGV4dC5pbmNsdWRlcygnfGxlZnQnKSB8fCB0ZXh0LmluY2x1ZGVzKCd8cmlnaHQnKSkge1xuXHRcdFx0XHQvLyBcdTY1QjBcdThCRURcdTZDRDU6ICFbW2ltYWdlfGNlbnRlcl1dXG5cdFx0XHRcdG5vZGVzVG9Qcm9jZXNzLnB1c2goeyBub2RlLCBwYXJlbnQ6IHBhcmVudEVsZW1lbnQgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gXHU1OTA0XHU3NDA2XHU2MjdFXHU1MjMwXHU3Njg0XHU4MjgyXHU3MEI5XG5cdFx0Zm9yIChjb25zdCB7IG5vZGUsIHBhcmVudCB9IG9mIG5vZGVzVG9Qcm9jZXNzKSB7XG5cdFx0XHR0aGlzLnByb2Nlc3NOb2RlKG5vZGUsIHBhcmVudCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTkwNFx1NzQwNlx1NTM1NVx1NEUyQVx1ODI4Mlx1NzBCOVxuXHQgKi9cblx0cHJpdmF0ZSBwcm9jZXNzTm9kZShub2RlOiBUZXh0LCBwYXJlbnQ6IEhUTUxFbGVtZW50KSB7XG5cdFx0Y29uc3QgdGV4dCA9IG5vZGUudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0bGV0IGxhc3RJbmRleCA9IDA7XG5cdFx0Y29uc3QgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cblx0XHQvLyAxLiBcdTUxNDhcdTUzMzlcdTkxNERcdTY1QjBcdTc2ODRcdTYyNjlcdTVDNTVcdTk0RkVcdTYzQTVcdThCRURcdTZDRDUgIVtbaW1hZ2V8Y2VudGVyXV1cblx0XHRjb25zdCBuZXdMaW5rUmVnZXggPSAvIT9cXFtcXFsoW158XFxdXSspXFx8KGNlbnRlcnxsZWZ0fHJpZ2h0KVxcXVxcXS9naTtcblx0XHRsZXQgbWF0Y2g7XG5cblx0XHR3aGlsZSAoKG1hdGNoID0gbmV3TGlua1JlZ2V4LmV4ZWModGV4dCkpICE9PSBudWxsKSB7XG5cdFx0XHQvLyBcdTZERkJcdTUyQTBcdTUzMzlcdTkxNERcdTRFNEJcdTUyNERcdTc2ODRcdTY1ODdcdTY3MkNcblx0XHRcdGlmIChtYXRjaC5pbmRleCA+IGxhc3RJbmRleCkge1xuXHRcdFx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0LnN1YnN0cmluZyhsYXN0SW5kZXgsIG1hdGNoLmluZGV4KSkpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBpbWFnZVBhdGggPSBtYXRjaFsxXS50cmltKCk7XG5cdFx0XHRjb25zdCBhbGlnbm1lbnQgPSBtYXRjaFsyXS50b0xvd2VyQ2FzZSgpIGFzIEFsaWdubWVudFR5cGU7XG5cblx0XHRcdC8vIFx1NTIxQlx1NUVGQVx1NUJGOVx1OUY1MFx1NUJCOVx1NTY2OFxuXHRcdFx0Y29uc3QgYWxpZ25Db250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdGFsaWduQ29udGFpbmVyLmNsYXNzTmFtZSA9IGBhbGlnbm1lbnQtJHthbGlnbm1lbnR9YDtcblx0XHRcdGFsaWduQ29udGFpbmVyLnN0eWxlLnRleHRBbGlnbiA9IGFsaWdubWVudDtcblx0XHRcdGFsaWduQ29udGFpbmVyLnN0eWxlLm1hcmdpbiA9ICcxMHB4IDAnO1xuXG5cdFx0XHQvLyBcdTZFMzJcdTY3RDNcdTU2RkVcdTcyNDdcblx0XHRcdHRoaXMucmVuZGVySW1hZ2VTeW5jKGAhW1ske2ltYWdlUGF0aH1dXWAsIGFsaWduQ29udGFpbmVyKTtcblxuXHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoYWxpZ25Db250YWluZXIpO1xuXHRcdFx0bGFzdEluZGV4ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG5cdFx0fVxuXG5cdFx0Ly8gMi4gXHU3MTM2XHU1NDBFXHU1MzM5XHU5MTREXHU2NUU3XHU3Njg0XHU1NzU3XHU4QkVEXHU2Q0Q1ID09PWNlbnRlcj09PSAuLi4gPT09XG5cdFx0aWYgKGxhc3RJbmRleCA9PT0gMCkge1xuXHRcdFx0Ly8gXHU1M0VBXHU2NzA5XHU1NzI4XHU2Q0ExXHU2NzA5XHU1MzM5XHU5MTREXHU1MjMwXHU2NUIwXHU4QkVEXHU2Q0Q1XHU2NUY2XHU2MjREXHU1OTA0XHU3NDA2XHU2NUU3XHU4QkVEXHU2Q0Q1XHVGRjA4XHU5MDdGXHU1MTREXHU5MUNEXHU1OTBEXHU1OTA0XHU3NDA2XHVGRjA5XG5cdFx0XHRjb25zdCBibG9ja1JlZ2V4ID0gLz09PVxccyooY2VudGVyfGxlZnR8cmlnaHQpXFxzKj09PVxccyooW1xcc1xcU10qPylcXHMqPT09L2dpO1xuXHRcdFx0bGFzdEluZGV4ID0gMDtcblxuXHRcdFx0d2hpbGUgKChtYXRjaCA9IGJsb2NrUmVnZXguZXhlYyh0ZXh0KSkgIT09IG51bGwpIHtcblx0XHRcdFx0Ly8gXHU2REZCXHU1MkEwXHU1MzM5XHU5MTREXHU0RTRCXHU1MjREXHU3Njg0XHU2NTg3XHU2NzJDXG5cdFx0XHRcdGlmIChtYXRjaC5pbmRleCA+IGxhc3RJbmRleCkge1xuXHRcdFx0XHRcdGZyYWdtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQuc3Vic3RyaW5nKGxhc3RJbmRleCwgbWF0Y2guaW5kZXgpKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBhbGlnbm1lbnQgPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpIGFzIEFsaWdubWVudFR5cGU7XG5cdFx0XHRcdGNvbnN0IGNvbnRlbnQgPSBtYXRjaFsyXS50cmltKCk7XG5cblx0XHRcdFx0Ly8gXHU1MjFCXHU1RUZBXHU1QkY5XHU5RjUwXHU1QkI5XHU1NjY4XG5cdFx0XHRcdGNvbnN0IGFsaWduQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHRcdGFsaWduQ29udGFpbmVyLmNsYXNzTmFtZSA9IGBhbGlnbm1lbnQtJHthbGlnbm1lbnR9YDtcblx0XHRcdFx0YWxpZ25Db250YWluZXIuc3R5bGUudGV4dEFsaWduID0gYWxpZ25tZW50O1xuXHRcdFx0XHRhbGlnbkNvbnRhaW5lci5zdHlsZS5tYXJnaW4gPSAnMTBweCAwJztcblxuXHRcdFx0XHQvLyBcdTZFMzJcdTY3RDNcdTUxODVcdTVCQjkgLSBcdTU0MENcdTZCNjVcdTU5MDRcdTc0MDZcblx0XHRcdFx0dGhpcy5yZW5kZXJJbWFnZVN5bmMoY29udGVudCwgYWxpZ25Db250YWluZXIpO1xuXG5cdFx0XHRcdGZyYWdtZW50LmFwcGVuZENoaWxkKGFsaWduQ29udGFpbmVyKTtcblx0XHRcdFx0bGFzdEluZGV4ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gXHU1OTgyXHU2NzlDXHU2Q0ExXHU2NzA5XHU1MzM5XHU5MTREXHU1MjMwXHU0RUZCXHU0RjU1XHU4QkVEXHU2Q0Q1XHVGRjBDXHU0RkREXHU2MzAxXHU1MzlGXHU2ODM3XG5cdFx0aWYgKGxhc3RJbmRleCA9PT0gMCAmJiBmcmFnbWVudC5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFx1NkRGQlx1NTJBMFx1NTI2OVx1NEY1OVx1NjU4N1x1NjcyQ1xuXHRcdGlmIChsYXN0SW5kZXggPCB0ZXh0Lmxlbmd0aCkge1xuXHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dC5zdWJzdHJpbmcobGFzdEluZGV4KSkpO1xuXHRcdH1cblxuXHRcdC8vIFx1NjZGRlx1NjM2Mlx1NTM5Rlx1ODI4Mlx1NzBCOVxuXHRcdGlmIChwYXJlbnQgJiYgZnJhZ21lbnQuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRwYXJlbnQucmVwbGFjZUNoaWxkKGZyYWdtZW50LCBub2RlKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU1NDBDXHU2QjY1XHU2RTMyXHU2N0QzXHU1NkZFXHU3MjQ3XG5cdCAqL1xuXHRwcml2YXRlIHJlbmRlckltYWdlU3luYyhjb250ZW50OiBzdHJpbmcsIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcblx0XHQvLyBcdTUzMzlcdTkxNERcdTU0MDRcdTc5Q0RcdTU2RkVcdTcyNDdcdThCRURcdTZDRDVcblx0XHRjb25zdCB3aWtpTGlua1JlZ2V4ID0gL1xcW1xcWyhbXlxcXXxdK1xcLig/OnBuZ3xqcGd8anBlZ3xnaWZ8d2VicHxzdmd8Ym1wKSkoPzpcXHxbXlxcXV0rKT9cXF1cXF0vZ2k7XG5cdFx0Y29uc3QgbWFya2Rvd25JbWFnZVJlZ2V4ID0gLyFcXFsoW15cXF1dKilcXF1cXCgoW14pXSspXFwpL2c7XG5cblx0XHRsZXQgbWF0Y2g7XG5cdFx0Y29uc3QgaW1hZ2VzOiB7IHNyYzogc3RyaW5nOyBhbHQ6IHN0cmluZyB9W10gPSBbXTtcblxuXHRcdC8vIFx1NTMzOVx1OTE0RCBbW3dpa2lcdTU2RkVcdTcyNDddXVxuXHRcdHdoaWxlICgobWF0Y2ggPSB3aWtpTGlua1JlZ2V4LmV4ZWMoY29udGVudCkpICE9PSBudWxsKSB7XG5cdFx0XHRjb25zdCBmaWxlTmFtZSA9IG1hdGNoWzFdO1xuXHRcdFx0aW1hZ2VzLnB1c2goeyBzcmM6IGZpbGVOYW1lLCBhbHQ6IGZpbGVOYW1lIH0pO1xuXHRcdH1cblxuXHRcdC8vIFx1NTMzOVx1OTE0RCAhW2FsdF0odXJsKVxuXHRcdHdoaWxlICgobWF0Y2ggPSBtYXJrZG93bkltYWdlUmVnZXguZXhlYyhjb250ZW50KSkgIT09IG51bGwpIHtcblx0XHRcdGltYWdlcy5wdXNoKHsgYWx0OiBtYXRjaFsxXSwgc3JjOiBtYXRjaFsyXSB9KTtcblx0XHR9XG5cblx0XHQvLyBcdTZFMzJcdTY3RDNcdTU2RkVcdTcyNDdcblx0XHRmb3IgKGNvbnN0IGltZyBvZiBpbWFnZXMpIHtcblx0XHRcdGlmICghaXNTYWZlVXJsKGltZy5zcmMpKSBjb250aW51ZTtcblxuXHRcdFx0Y29uc3QgaW1nRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblx0XHRcdGltZ0VsLmFsdCA9IGltZy5hbHQ7XG5cblx0XHRcdGlmICghaW1nLnNyYy5zdGFydHNXaXRoKCdodHRwJykpIHtcblx0XHRcdFx0Y29uc3Qgbm9ybWFsaXplZFNyYyA9IG5vcm1hbGl6ZVZhdWx0UGF0aChpbWcuc3JjKTtcblx0XHRcdFx0aWYgKCFpc1BhdGhTYWZlKG5vcm1hbGl6ZWRTcmMpKSBjb250aW51ZTtcblx0XHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZFNyYyk7XG5cdFx0XHRcdGlmIChmaWxlICYmIGZpbGUgaW5zdGFuY2VvZiBURmlsZSkge1xuXHRcdFx0XHRcdGltZ0VsLnNyYyA9IHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc3QgYXR0YWNobWVudHNQYXRoID0gdGhpcy5maW5kRmlsZUluVmF1bHQobm9ybWFsaXplZFNyYyk7XG5cdFx0XHRcdFx0aWYgKGF0dGFjaG1lbnRzUGF0aCkge1xuXHRcdFx0XHRcdFx0aW1nRWwuc3JjID0gYXR0YWNobWVudHNQYXRoO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGltZ0VsLnNyYyA9IGltZy5zcmM7XG5cdFx0XHR9XG5cblx0XHRcdGltZ0VsLnN0eWxlLm1heFdpZHRoID0gJzEwMCUnO1xuXHRcdFx0aW1nRWwuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xuXHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGltZ0VsKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU1NzI4IFZhdWx0IFx1NEUyRFx1NjdFNVx1NjI3RVx1NjU4N1x1NEVGNlxuXHQgKi9cblx0cHJpdmF0ZSBmaW5kRmlsZUluVmF1bHQoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuXHRcdGNvbnN0IG5vcm1hbGl6ZWRGaWxlTmFtZSA9IG5vcm1hbGl6ZVZhdWx0UGF0aChmaWxlTmFtZSk7XG5cdFx0Y29uc3QgZmlsZXMgPSB0aGlzLnBsdWdpbi5hcHAudmF1bHQuZ2V0RmlsZXMoKTtcblx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcblx0XHRcdGlmIChmaWxlLm5hbWUgPT09IG5vcm1hbGl6ZWRGaWxlTmFtZSB8fCBmaWxlLnBhdGguZW5kc1dpdGgobm9ybWFsaXplZEZpbGVOYW1lKSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cbn1cbiIsICIvKipcbiAqIFx1NTZGRFx1OTY0NVx1NTMxNlx1NjUyRlx1NjMwMVx1NkEyMVx1NTc1N1xuICogXHU2NTJGXHU2MzAxXHU0RTJEXHU2NTg3XHU1NDhDXHU4MkYxXHU2NTg3XG4gKi9cblxuZXhwb3J0IHR5cGUgTGFuZ3VhZ2UgPSAnemgnIHwgJ2VuJztcblxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2xhdGlvbnMge1xuXHQvLyBcdTkwMUFcdTc1Mjhcblx0b2s6IHN0cmluZztcblx0Y2FuY2VsOiBzdHJpbmc7XG5cdGRlbGV0ZTogc3RyaW5nO1xuXHRyZXN0b3JlOiBzdHJpbmc7XG5cdGNvbmZpcm06IHN0cmluZztcblx0c3VjY2Vzczogc3RyaW5nO1xuXHRlcnJvcjogc3RyaW5nO1xuXG5cdC8vIFx1ODlDNlx1NTZGRVx1NTQwRFx1NzlGMFxuXHRtZWRpYUxpYnJhcnk6IHN0cmluZztcblx0dW5yZWZlcmVuY2VkTWVkaWE6IHN0cmluZztcblx0dHJhc2hNYW5hZ2VtZW50OiBzdHJpbmc7XG5cblx0Ly8gXHU1QTkyXHU0RjUzXHU1RTkzXG5cdHRvdGFsTWVkaWFGaWxlczogc3RyaW5nO1xuXHRub01lZGlhRmlsZXM6IHN0cmluZztcblx0YWxsTWVkaWFUeXBlc0Rpc2FibGVkOiBzdHJpbmc7XG5cdHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmc7XG5cdHNlYXJjaFJlc3VsdHM6IHN0cmluZztcblxuXHQvLyBcdTY3MkFcdTVGMTVcdTc1MjhcdTVBOTJcdTRGNTNcblx0dW5yZWZlcmVuY2VkRm91bmQ6IHN0cmluZztcblx0YWxsTWVkaWFSZWZlcmVuY2VkOiBzdHJpbmc7XG5cdGRlbGV0ZVRvVHJhc2g6IHN0cmluZztcblxuXHQvLyBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzlcblx0dHJhc2hFbXB0eTogc3RyaW5nO1xuXHRvcmlnaW5hbFBhdGg6IHN0cmluZztcblx0ZGVsZXRlZEF0OiBzdHJpbmc7XG5cdGNvbmZpcm1DbGVhckFsbDogc3RyaW5nO1xuXG5cdC8vIFx1NjRDRFx1NEY1Q1xuXHRvcGVuSW5Ob3Rlczogc3RyaW5nO1xuXHRjb3B5UGF0aDogc3RyaW5nO1xuXHRjb3B5TGluazogc3RyaW5nO1xuXHRvcGVuT3JpZ2luYWw6IHN0cmluZztcblx0cHJldmlldzogc3RyaW5nO1xuXG5cdC8vIFx1NUZFQlx1NjM3N1x1OTUyRVxuXHRzaG9ydGN1dHM6IHN0cmluZztcblx0b3BlbkxpYnJhcnk6IHN0cmluZztcblx0ZmluZFVucmVmZXJlbmNlZDogc3RyaW5nO1xuXHRvcGVuVHJhc2g6IHN0cmluZztcblxuXHQvLyBcdTYyNkJcdTYzQ0ZcdThGREJcdTVFQTZcblx0c2Nhbm5pbmdSZWZlcmVuY2VzOiBzdHJpbmc7XG5cdHNjYW5Db21wbGV0ZTogc3RyaW5nO1xuXHRmaWxlc1NjYW5uZWQ6IHN0cmluZztcblxuXHQvLyBcdTYyNzlcdTkxQ0ZcdTY0Q0RcdTRGNUNcblx0YmF0Y2hEZWxldGVDb21wbGV0ZTogc3RyaW5nO1xuXHRiYXRjaERlbGV0ZVByb2dyZXNzOiBzdHJpbmc7XG5cdGJhdGNoUmVzdG9yZUNvbXBsZXRlOiBzdHJpbmc7XG5cblx0Ly8gXHU4QkJFXHU3RjZFXHU5ODc1XHU5NzYyXG5cdHBsdWdpblNldHRpbmdzOiBzdHJpbmc7XG5cdG1lZGlhRm9sZGVyOiBzdHJpbmc7XG5cdG1lZGlhRm9sZGVyRGVzYzogc3RyaW5nO1xuXHR0aHVtYm5haWxTaXplOiBzdHJpbmc7XG5cdHRodW1ibmFpbFNpemVEZXNjOiBzdHJpbmc7XG5cdHRodW1ibmFpbFNtYWxsOiBzdHJpbmc7XG5cdHRodW1ibmFpbE1lZGl1bTogc3RyaW5nO1xuXHR0aHVtYm5haWxMYXJnZTogc3RyaW5nO1xuXHRkZWZhdWx0U29ydEJ5OiBzdHJpbmc7XG5cdHNvcnRCeURlc2M6IHN0cmluZztcblx0c29ydEJ5TmFtZTogc3RyaW5nO1xuXHRzb3J0QnlEYXRlOiBzdHJpbmc7XG5cdHNvcnRCeVNpemU6IHN0cmluZztcblx0c29ydE9yZGVyOiBzdHJpbmc7XG5cdHNvcnRPcmRlckRlc2M6IHN0cmluZztcblx0c29ydEFzYzogc3RyaW5nO1xuXHRzb3J0RGVzYzogc3RyaW5nO1xuXHRzaG93SW1hZ2VJbmZvOiBzdHJpbmc7XG5cdHNob3dJbWFnZUluZm9EZXNjOiBzdHJpbmc7XG5cdGF1dG9SZWZyZXNoOiBzdHJpbmc7XG5cdGF1dG9SZWZyZXNoRGVzYzogc3RyaW5nO1xuXHRkZWZhdWx0QWxpZ25tZW50OiBzdHJpbmc7XG5cdGFsaWdubWVudERlc2M6IHN0cmluZztcblx0YWxpZ25MZWZ0OiBzdHJpbmc7XG5cdGFsaWduQ2VudGVyOiBzdHJpbmc7XG5cdGFsaWduUmlnaHQ6IHN0cmluZztcblx0c2FmZURlbGV0ZVNldHRpbmdzOiBzdHJpbmc7XG5cdHVzZVRyYXNoRm9sZGVyOiBzdHJpbmc7XG5cdHVzZVRyYXNoRm9sZGVyRGVzYzogc3RyaW5nO1xuXHR0cmFzaEZvbGRlclBhdGg6IHN0cmluZztcblx0dHJhc2hGb2xkZXJQYXRoRGVzYzogc3RyaW5nO1xuXHRhdXRvQ2xlYW51cFRyYXNoOiBzdHJpbmc7XG5cdGF1dG9DbGVhbnVwVHJhc2hEZXNjOiBzdHJpbmc7XG5cdGF1dG9DbGVhbnVwQ29tcGxldGU6IHN0cmluZztcblx0Y2xlYW51cERheXM6IHN0cmluZztcblx0Y2xlYW51cERheXNEZXNjOiBzdHJpbmc7XG5cdG1lZGlhVHlwZXM6IHN0cmluZztcblx0ZW5hYmxlSW1hZ2VTdXBwb3J0OiBzdHJpbmc7XG5cdGVuYWJsZUltYWdlU3VwcG9ydERlc2M6IHN0cmluZztcblx0ZW5hYmxlVmlkZW9TdXBwb3J0OiBzdHJpbmc7XG5cdGVuYWJsZVZpZGVvU3VwcG9ydERlc2M6IHN0cmluZztcblx0ZW5hYmxlQXVkaW9TdXBwb3J0OiBzdHJpbmc7XG5cdGVuYWJsZUF1ZGlvU3VwcG9ydERlc2M6IHN0cmluZztcblx0ZW5hYmxlUERGU3VwcG9ydDogc3RyaW5nO1xuXHRlbmFibGVQREZTdXBwb3J0RGVzYzogc3RyaW5nO1xuXHR2aWV3U2V0dGluZ3M6IHN0cmluZztcblx0aW50ZXJmYWNlTGFuZ3VhZ2U6IHN0cmluZztcblx0bGFuZ3VhZ2VEZXNjOiBzdHJpbmc7XG5cdGxhbmd1YWdlU3lzdGVtOiBzdHJpbmc7XG5cdHBhZ2VTaXplOiBzdHJpbmc7XG5cdHBhZ2VTaXplRGVzYzogc3RyaW5nO1xuXHRcdGVuYWJsZVByZXZpZXdNb2RhbDogc3RyaW5nO1xuXHRcdGVuYWJsZVByZXZpZXdNb2RhbERlc2M6IHN0cmluZztcblx0XHRlbmFibGVLZXlib2FyZE5hdjogc3RyaW5nO1xuXHRcdGVuYWJsZUtleWJvYXJkTmF2RGVzYzogc3RyaW5nO1xuXHRcdHNhZmVTY2FuU2V0dGluZ3M6IHN0cmluZztcblx0XHRzYWZlU2NhbkVuYWJsZWREZXNjOiBzdHJpbmc7XG5cdFx0c2FmZVNjYW5VbnJlZkRheXM6IHN0cmluZztcblx0XHRzYWZlU2NhblVucmVmRGF5c0Rlc2M6IHN0cmluZztcblx0XHRzYWZlU2Nhbk1pblNpemU6IHN0cmluZztcblx0XHRzYWZlU2Nhbk1pblNpemVEZXNjOiBzdHJpbmc7XG5cdFx0ZHVwbGljYXRlRGV0ZWN0aW9uU2V0dGluZ3M6IHN0cmluZztcblx0XHRkdXBsaWNhdGVUaHJlc2hvbGRTZXR0aW5nOiBzdHJpbmc7XG5cdFx0ZHVwbGljYXRlVGhyZXNob2xkRGVzYzogc3RyaW5nO1xuXHRcdGtleWJvYXJkU2hvcnRjdXRzOiBzdHJpbmc7XG5cdFx0c2hvcnRjdXRzRGVzYzogc3RyaW5nO1xuXHRcdHNob3J0Y3V0T3BlbkxpYnJhcnk6IHN0cmluZztcblx0c2hvcnRjdXRGaW5kVW5yZWZlcmVuY2VkOiBzdHJpbmc7XG5cdHNob3J0Y3V0T3BlblRyYXNoOiBzdHJpbmc7XG5cdGNvbW1hbmRzOiBzdHJpbmc7XG5cdGNvbW1hbmRzRGVzYzogc3RyaW5nO1xuXHRjbWRPcGVuTGlicmFyeTogc3RyaW5nO1xuXHRjbWRGaW5kVW5yZWZlcmVuY2VkOiBzdHJpbmc7XG5cdGNtZFRyYXNoTWFuYWdlbWVudDogc3RyaW5nO1xuXHRjbWRBbGlnbkxlZnQ6IHN0cmluZztcblx0Y21kQWxpZ25DZW50ZXI6IHN0cmluZztcblx0Y21kQWxpZ25SaWdodDogc3RyaW5nO1xuXG5cdC8vIFRyYXNoIE1hbmFnZW1lbnQgVmlld1xuXHRsb2FkaW5nVHJhc2hGaWxlczogc3RyaW5nO1xuXHR0cmFzaEZvbGRlckVtcHR5OiBzdHJpbmc7XG5cdGZpbGVzSW5UcmFzaDogc3RyaW5nO1xuXHR0b3RhbFNpemU6IHN0cmluZztcblx0dHJhc2hNYW5hZ2VtZW50RGVzYzogc3RyaW5nO1xuXHRyZWZyZXNoOiBzdHJpbmc7XG5cdGNsZWFyVHJhc2g6IHN0cmluZztcblx0Y2xlYXJUcmFzaFRvb2x0aXA6IHN0cmluZztcblx0cmVzdG9yZVRvb2x0aXA6IHN0cmluZztcblx0cGVybWFuZW50RGVsZXRlOiBzdHJpbmc7XG5cdHBlcm1hbmVudERlbGV0ZVRvb2x0aXA6IHN0cmluZztcblx0ZGVsZXRlZFRpbWU6IHN0cmluZztcblx0Y29uZmlybURlbGV0ZUZpbGU6IHN0cmluZztcblx0Y29uZmlybUNsZWFyVHJhc2g6IHN0cmluZztcblx0ZmlsZURlbGV0ZWQ6IHN0cmluZztcblx0cmVzdG9yZVN1Y2Nlc3M6IHN0cmluZztcblx0cmVzdG9yZUZhaWxlZDogc3RyaW5nO1xuXHR0YXJnZXRGaWxlRXhpc3RzOiBzdHJpbmc7XG5cdGRlbGV0ZUZhaWxlZDogc3RyaW5nO1xuXHRmaWxlTmFtZUNvcGllZDogc3RyaW5nO1xuXHRvcmlnaW5hbFBhdGhDb3BpZWQ6IHN0cmluZztcblxuXHQvLyBcdTY3MkFcdTVGMTVcdTc1MjhcdTU2RkVcdTcyNDdcdTg5QzZcdTU2RkVcblx0c2Nhbm5pbmdVbnJlZmVyZW5jZWQ6IHN0cmluZztcblx0dG90YWxTaXplTGFiZWw6IHN0cmluZztcblx0c2NhbkVycm9yOiBzdHJpbmc7XG5cdHVucmVmZXJlbmNlZERlc2M6IHN0cmluZztcblx0bm9GaWxlc1RvRGVsZXRlOiBzdHJpbmc7XG5cdHByb2Nlc3NlZEZpbGVzOiBzdHJpbmc7XG5cdHByb2Nlc3NlZEZpbGVzRXJyb3I6IHN0cmluZztcblx0Y29weUFsbFBhdGhzOiBzdHJpbmc7XG5cdGNvcGllZEZpbGVQYXRoczogc3RyaW5nO1xuXG5cdC8vIFx1NTZGRVx1NzI0N1x1NUU5M1x1ODlDNlx1NTZGRVxuXHRub01hdGNoaW5nRmlsZXM6IHN0cmluZztcblx0cHJldlBhZ2U6IHN0cmluZztcblx0bmV4dFBhZ2U6IHN0cmluZztcblx0cGFnZUluZm86IHN0cmluZztcblx0c2VsZWN0RmlsZXM6IHN0cmluZztcblx0c2VsZWN0QWxsOiBzdHJpbmc7XG5cdGRlc2VsZWN0QWxsOiBzdHJpbmc7XG5cdGNvbmZpcm1EZWxldGVTZWxlY3RlZDogc3RyaW5nO1xuXHRkZWxldGVkRmlsZXM6IHN0cmluZztcblx0ZGVsZXRlRmlsZXNGYWlsZWQ6IHN0cmluZztcblx0bXVsdGlTZWxlY3RNb2RlOiBzdHJpbmc7XG5cblx0Ly8gXHU1QTkyXHU0RjUzXHU5ODg0XHU4OUM4XG5cdHVuc3VwcG9ydGVkRmlsZVR5cGU6IHN0cmluZztcblx0Y29weVBhdGhCdG46IHN0cmluZztcblx0Y29weUxpbmtCdG46IHN0cmluZztcblx0ZmluZEluTm90ZXM6IHN0cmluZztcblx0cGF0aENvcGllZDogc3RyaW5nO1xuXHRsaW5rQ29waWVkOiBzdHJpbmc7XG5cdGltYWdlTG9hZEVycm9yOiBzdHJpbmc7XG5cblx0Ly8gXHU1NkZFXHU3MjQ3XHU1QkY5XHU5RjUwXG5cdGFsaWduSW1hZ2VMZWZ0OiBzdHJpbmc7XG5cdGFsaWduSW1hZ2VDZW50ZXI6IHN0cmluZztcblx0YWxpZ25JbWFnZVJpZ2h0OiBzdHJpbmc7XG5cdHNlbGVjdEltYWdlRmlyc3Q6IHN0cmluZztcblx0c2VsZWN0SW1hZ2U6IHN0cmluZztcblx0aW1hZ2VBbGlnbmVkTGVmdDogc3RyaW5nO1xuXHRpbWFnZUFsaWduZWRDZW50ZXI6IHN0cmluZztcblx0aW1hZ2VBbGlnbmVkUmlnaHQ6IHN0cmluZztcblxuXHQvLyBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTY0Q0RcdTRGNUNcblx0Y29waWVkRmlsZU5hbWU6IHN0cmluZztcblx0Y29waWVkT3JpZ2luYWxQYXRoOiBzdHJpbmc7XG5cdG5vdFJlZmVyZW5jZWQ6IHN0cmluZztcblx0bW92ZWRUb1RyYXNoOiBzdHJpbmc7XG5cdGRlbGV0ZWRGaWxlOiBzdHJpbmc7XG5cdHJlc3RvcmVkRmlsZTogc3RyaW5nO1xuXG5cdC8vIFx1NTQ3RFx1NEVFNFx1NTQwRFx1NzlGMFxuXHRjbWRJbWFnZUxpYnJhcnk6IHN0cmluZztcblx0Y21kRmluZFVucmVmZXJlbmNlZEltYWdlczogc3RyaW5nO1xuXHRjbWRSZWZyZXNoQ2FjaGU6IHN0cmluZztcblx0Y21kQWxpZ25JbWFnZUxlZnQ6IHN0cmluZztcblx0Y21kQWxpZ25JbWFnZUNlbnRlcjogc3RyaW5nO1xuXHRjbWRBbGlnbkltYWdlUmlnaHQ6IHN0cmluZztcblx0Y21kT3Blbk1lZGlhTGlicmFyeTogc3RyaW5nO1xuXHRjbWRGaW5kVW5yZWZlcmVuY2VkTWVkaWE6IHN0cmluZztcblx0Y21kT3BlblRyYXNoTWFuYWdlbWVudDogc3RyaW5nO1xuXG5cdC8vIFx1NTIyMFx1OTY2NFx1NjRDRFx1NEY1Q1xuXHRkZWxldGVGYWlsZWRXaXRoTmFtZTogc3RyaW5nO1xuXHRkZWxldGVkV2l0aFF1YXJhbnRpbmVGYWlsZWQ6IHN0cmluZztcblx0b3BlcmF0aW9uRmFpbGVkOiBzdHJpbmc7XG5cdHByb2Nlc3Npbmc6IHN0cmluZztcblxuXHQvLyB2Mi4wIFx1NjVCMFx1NTg5RVxuXHRkdXBsaWNhdGVEZXRlY3Rpb246IHN0cmluZztcblx0ZHVwbGljYXRlRGV0ZWN0aW9uRGVzYzogc3RyaW5nO1xuXHRub0R1cGxpY2F0ZXNGb3VuZDogc3RyaW5nO1xuXHRzdGFydFNjYW46IHN0cmluZztcblx0c2NhblByb2dyZXNzOiBzdHJpbmc7XG5cdHNpbWlsYXJpdHlUaHJlc2hvbGQ6IHN0cmluZztcblx0ZHVwbGljYXRlR3JvdXBzRm91bmQ6IHN0cmluZztcblx0ZHVwbGljYXRlR3JvdXA6IHN0cmluZztcblx0ZmlsZXM6IHN0cmluZztcblx0c3VnZ2VzdEtlZXA6IHN0cmluZztcblx0cXVhcmFudGluZTogc3RyaW5nO1xuXHRxdWFyYW50aW5lQWxsRHVwbGljYXRlczogc3RyaW5nO1xuXHRkdXBsaWNhdGVzRm91bmQ6IHN0cmluZztcblx0ZHVwbGljYXRlc1F1YXJhbnRpbmVkOiBzdHJpbmc7XG5cdHR5cGVEaXN0cmlidXRpb246IHN0cmluZztcblx0dW5yZWZlcmVuY2VkUmF0ZTogc3RyaW5nO1xuXHRyZWZlcmVuY2VkQnk6IHN0cmluZztcblx0c2VsZWN0ZWRDb3VudDogc3RyaW5nO1xuXHRiYXRjaFJlc3RvcmU6IHN0cmluZztcblx0YmF0Y2hEZWxldGU6IHN0cmluZztcblx0bm9JdGVtc1NlbGVjdGVkOiBzdHJpbmc7XG5cdGNvbmZpcm1CYXRjaFJlc3RvcmU6IHN0cmluZztcblx0YmF0Y2hSZXN0b3JlQ29tcGxldGVkOiBzdHJpbmc7XG5cdHNhZmVTY2FuOiBzdHJpbmc7XG5cdHNhZmVTY2FuRGVzYzogc3RyaW5nO1xuXHRzYWZlU2NhblN0YXJ0ZWQ6IHN0cmluZztcblx0c2FmZVNjYW5Ob1Jlc3VsdHM6IHN0cmluZztcblx0c2FmZVNjYW5Db25maXJtOiBzdHJpbmc7XG5cdHNhZmVTY2FuQ29tcGxldGU6IHN0cmluZztcblx0c2FmZVNjYW5GYWlsZWQ6IHN0cmluZztcblx0Y21kRHVwbGljYXRlRGV0ZWN0aW9uOiBzdHJpbmc7XG5cdG9yZ2FuaXppbmc6IHN0cmluZztcblx0b3JnYW5pemVDb21wbGV0ZTogc3RyaW5nO1xufVxuXG5jb25zdCB6aDogVHJhbnNsYXRpb25zID0ge1xuXHQvLyBcdTkwMUFcdTc1Mjhcblx0b2s6ICdcdTc4NkVcdTVCOUEnLFxuXHRjYW5jZWw6ICdcdTUzRDZcdTZEODgnLFxuXHRkZWxldGU6ICdcdTUyMjBcdTk2NjQnLFxuXHRyZXN0b3JlOiAnXHU2MDYyXHU1OTBEJyxcblx0Y29uZmlybTogJ1x1Nzg2RVx1OEJBNCcsXG5cdHN1Y2Nlc3M6ICdcdTYyMTBcdTUyOUYnLFxuXHRlcnJvcjogJ1x1OTUxOVx1OEJFRicsXG5cblx0Ly8gXHU4OUM2XHU1NkZFXHU1NDBEXHU3OUYwXG5cdG1lZGlhTGlicmFyeTogJ1x1NUE5Mlx1NEY1M1x1NUU5MycsXG5cdHVucmVmZXJlbmNlZE1lZGlhOiAnXHU2NzJBXHU1RjE1XHU3NTI4XHU1QTkyXHU0RjUzJyxcblx0dHJhc2hNYW5hZ2VtZW50OiAnXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU3QkExXHU3NDA2JyxcblxuXHQvLyBcdTVBOTJcdTRGNTNcdTVFOTNcblx0dG90YWxNZWRpYUZpbGVzOiAnXHU1MTcxIHtjb3VudH0gXHU0RTJBXHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2Jyxcblx0bm9NZWRpYUZpbGVzOiAnXHU2NzJBXHU2MjdFXHU1MjMwXHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2Jyxcblx0YWxsTWVkaWFUeXBlc0Rpc2FibGVkOiAnXHU2MjQwXHU2NzA5XHU1QTkyXHU0RjUzXHU3QzdCXHU1NzhCXHU1REYyXHU4OEFCXHU3OTgxXHU3NTI4XHVGRjBDXHU4QkY3XHU1MjMwXHU4QkJFXHU3RjZFXHU0RTJEXHU1NDJGXHU3NTI4XHU4MUYzXHU1QzExXHU0RTAwXHU3OUNEXHU1QTkyXHU0RjUzXHU3QzdCXHU1NzhCJyxcblx0c2VhcmNoUGxhY2Vob2xkZXI6ICdcdTY0MUNcdTdEMjJcdTY1ODdcdTRFRjZcdTU0MEQuLi4nLFxuXHRzZWFyY2hSZXN1bHRzOiAnXHU2MjdFXHU1MjMwIHtjb3VudH0gXHU0RTJBXHU3RUQzXHU2NzlDJyxcblxuXHQvLyBcdTY3MkFcdTVGMTVcdTc1MjhcdTVBOTJcdTRGNTNcblx0dW5yZWZlcmVuY2VkRm91bmQ6ICdcdTYyN0VcdTUyMzAge2NvdW50fSBcdTRFMkFcdTY3MkFcdTVGMTVcdTc1MjhcdTc2ODRcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjYnLFxuXHRhbGxNZWRpYVJlZmVyZW5jZWQ6ICdcdTU5MkFcdTY4RDJcdTRFODZcdUZGMDFcdTYyNDBcdTY3MDlcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTkwRkRcdTVERjJcdTg4QUJcdTVGMTVcdTc1MjgnLFxuXHRkZWxldGVUb1RyYXNoOiAnXHU2NTg3XHU0RUY2XHU1QzA2XHU4OEFCXHU3OUZCXHU1MTY1XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5JyxcblxuXHQvLyBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzlcblx0dHJhc2hFbXB0eTogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUzQVx1N0E3QScsXG5cdG9yaWdpbmFsUGF0aDogJ1x1NTM5Rlx1NTlDQlx1NEY0RFx1N0Y2RScsXG5cdGRlbGV0ZWRBdDogJ1x1NTIyMFx1OTY2NFx1NjVGNlx1OTVGNCcsXG5cdGNvbmZpcm1DbGVhckFsbDogJ1x1Nzg2RVx1NUI5QVx1ODk4MVx1NkUwNVx1N0E3QVx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NTQxN1x1RkYxRicsXG5cblx0Ly8gXHU2NENEXHU0RjVDXG5cdG9wZW5Jbk5vdGVzOiAnXHU1NzI4XHU3QjE0XHU4QkIwXHU0RTJEXHU2N0U1XHU2MjdFJyxcblx0Y29weVBhdGg6ICdcdTU5MERcdTUyMzZcdTY1ODdcdTRFRjZcdThERUZcdTVGODQnLFxuXHRjb3B5TGluazogJ1x1NTkwRFx1NTIzNk1hcmtkb3duXHU5NEZFXHU2M0E1Jyxcblx0b3Blbk9yaWdpbmFsOiAnXHU2MjUzXHU1RjAwXHU1MzlGXHU1OUNCXHU2NTg3XHU0RUY2Jyxcblx0cHJldmlldzogJ1x1OTg4NFx1ODlDOCcsXG5cblx0Ly8gXHU1RkVCXHU2Mzc3XHU5NTJFXG5cdHNob3J0Y3V0czogJ1x1NUZFQlx1NjM3N1x1OTUyRScsXG5cdG9wZW5MaWJyYXJ5OiAnXHU2MjUzXHU1RjAwXHU1QTkyXHU0RjUzXHU1RTkzJyxcblx0ZmluZFVucmVmZXJlbmNlZDogJ1x1NjdFNVx1NjI3RVx1NjcyQVx1NUYxNVx1NzUyOFx1NUE5Mlx1NEY1MycsXG5cdG9wZW5UcmFzaDogJ1x1NjI1M1x1NUYwMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1N0JBMVx1NzQwNicsXG5cblx0Ly8gXHU2MjZCXHU2M0NGXHU4RkRCXHU1RUE2XG5cdHNjYW5uaW5nUmVmZXJlbmNlczogJ1x1NkI2M1x1NTcyOFx1NjI2Qlx1NjNDRlx1NUYxNVx1NzUyOCcsXG5cdHNjYW5Db21wbGV0ZTogJ1x1NjI2Qlx1NjNDRlx1NUI4Q1x1NjIxMCcsXG5cdGZpbGVzU2Nhbm5lZDogJ1x1NEUyQVx1NjU4N1x1NEVGNlx1NURGMlx1NjI2Qlx1NjNDRicsXG5cblx0Ly8gXHU2Mjc5XHU5MUNGXHU2NENEXHU0RjVDXG5cdGJhdGNoRGVsZXRlQ29tcGxldGU6ICdcdTVERjJcdTUyMjBcdTk2NjQge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjYnLFxuXHRiYXRjaERlbGV0ZVByb2dyZXNzOiAnXHU2QjYzXHU1NzI4XHU1MjIwXHU5NjY0IHtjdXJyZW50fS97dG90YWx9Jyxcblx0YmF0Y2hSZXN0b3JlQ29tcGxldGU6ICdcdTVERjJcdTYwNjJcdTU5MEQge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjYnLFxuXG5cdC8vIFx1OEJCRVx1N0Y2RVx1OTg3NVx1OTc2MlxuXHRwbHVnaW5TZXR0aW5nczogJ1x1NUE5Mlx1NEY1M1x1NURFNVx1NTE3N1x1N0JCMVx1NjNEMlx1NEVGNlx1OEJCRVx1N0Y2RScsXG5cdG1lZGlhRm9sZGVyOiAnXHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHU1OTM5Jyxcblx0bWVkaWFGb2xkZXJEZXNjOiAnXHU2MzA3XHU1QjlBXHU4OTgxXHU2MjZCXHU2M0NGXHU3Njg0XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHU1OTM5XHU4REVGXHU1Rjg0XHVGRjA4XHU3NTU5XHU3QTdBXHU1MjE5XHU2MjZCXHU2M0NGXHU2NTc0XHU0RTJBXHU1RTkzXHVGRjA5Jyxcblx0dGh1bWJuYWlsU2l6ZTogJ1x1N0YyOVx1NzU2NVx1NTZGRVx1NTkyN1x1NUMwRicsXG5cdHRodW1ibmFpbFNpemVEZXNjOiAnXHU5MDA5XHU2MkU5XHU1QTkyXHU0RjUzXHU1RTkzXHU4OUM2XHU1NkZFXHU0RTJEXHU3RjI5XHU3NTY1XHU1NkZFXHU3Njg0XHU2NjNFXHU3OTNBXHU1OTI3XHU1QzBGJyxcblx0dGh1bWJuYWlsU21hbGw6ICdcdTVDMEYgKDEwMHB4KScsXG5cdHRodW1ibmFpbE1lZGl1bTogJ1x1NEUyRCAoMTUwcHgpJyxcblx0dGh1bWJuYWlsTGFyZ2U6ICdcdTU5MjcgKDIwMHB4KScsXG5cdGRlZmF1bHRTb3J0Qnk6ICdcdTlFRDhcdThCQTRcdTYzOTJcdTVFOEZcdTY1QjlcdTVGMEYnLFxuXHRzb3J0QnlEZXNjOiAnXHU5MDA5XHU2MkU5XHU1NkZFXHU3MjQ3XHU3Njg0XHU5RUQ4XHU4QkE0XHU2MzkyXHU1RThGXHU2NUI5XHU1RjBGJyxcblx0c29ydEJ5TmFtZTogJ1x1NjMwOVx1NTQwRFx1NzlGMCcsXG5cdHNvcnRCeURhdGU6ICdcdTYzMDlcdTRGRUVcdTY1MzlcdTY1RTVcdTY3MUYnLFxuXHRzb3J0QnlTaXplOiAnXHU2MzA5XHU2NTg3XHU0RUY2XHU1OTI3XHU1QzBGJyxcblx0c29ydE9yZGVyOiAnXHU2MzkyXHU1RThGXHU5ODdBXHU1RThGJyxcblx0c29ydE9yZGVyRGVzYzogJ1x1OTAwOVx1NjJFOVx1NTM0N1x1NUU4Rlx1NjIxNlx1OTY0RFx1NUU4RicsXG5cdHNvcnRBc2M6ICdcdTUzNDdcdTVFOEYnLFxuXHRzb3J0RGVzYzogJ1x1OTY0RFx1NUU4RicsXG5cdHNob3dJbWFnZUluZm86ICdcdTY2M0VcdTc5M0FcdTU2RkVcdTcyNDdcdTRGRTFcdTYwNkYnLFxuXHRzaG93SW1hZ2VJbmZvRGVzYzogJ1x1NTcyOFx1NTZGRVx1NzI0N1x1N0YyOVx1NzU2NVx1NTZGRVx1NEUwQlx1NjVCOVx1NjYzRVx1NzkzQVx1NjU4N1x1NEVGNlx1NTQwRFx1NTQ4Q1x1NTkyN1x1NUMwRicsXG5cdGF1dG9SZWZyZXNoOiAnXHU4MUVBXHU1MkE4XHU1MjM3XHU2NUIwJyxcblx0YXV0b1JlZnJlc2hEZXNjOiAnXHU1RjUzXHU1RTkzXHU0RTJEXHU3Njg0XHU1NkZFXHU3MjQ3XHU1M0QxXHU3NTFGXHU1M0Q4XHU1MzE2XHU2NUY2XHU4MUVBXHU1MkE4XHU1MjM3XHU2NUIwXHU4OUM2XHU1NkZFJyxcblx0ZGVmYXVsdEFsaWdubWVudDogJ1x1OUVEOFx1OEJBNFx1NTZGRVx1NzI0N1x1NUJGOVx1OUY1MFx1NjVCOVx1NUYwRicsXG5cdGFsaWdubWVudERlc2M6ICdcdTYzRDJcdTUxNjVcdTU2RkVcdTcyNDdcdTY1RjZcdTc2ODRcdTlFRDhcdThCQTRcdTVCRjlcdTlGNTBcdTY1QjlcdTVGMEYnLFxuXHRhbGlnbkxlZnQ6ICdcdTVDNDVcdTVERTYnLFxuXHRhbGlnbkNlbnRlcjogJ1x1NUM0NVx1NEUyRCcsXG5cdGFsaWduUmlnaHQ6ICdcdTVDNDVcdTUzRjMnLFxuXHRzYWZlRGVsZXRlU2V0dGluZ3M6ICdcdTVCODlcdTUxNjhcdTUyMjBcdTk2NjRcdThCQkVcdTdGNkUnLFxuXHR1c2VUcmFzaEZvbGRlcjogJ1x1NEY3Rlx1NzUyOFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOScsXG5cdHVzZVRyYXNoRm9sZGVyRGVzYzogJ1x1NTIyMFx1OTY2NFx1NjU4N1x1NEVGNlx1NjVGNlx1NTE0OFx1NzlGQlx1NTE2NVx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwQ1x1ODAwQ1x1NEUwRFx1NjYyRlx1NzZGNFx1NjNBNVx1NTIyMFx1OTY2NCcsXG5cdHRyYXNoRm9sZGVyUGF0aDogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOScsXG5cdHRyYXNoRm9sZGVyUGF0aERlc2M6ICdcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTc2ODRcdThERUZcdTVGODRcdUZGMDhcdTc2RjhcdTVCRjlcdThERUZcdTVGODRcdUZGMDknLFxuXHRhdXRvQ2xlYW51cFRyYXNoOiAnXHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5Jyxcblx0YXV0b0NsZWFudXBUcmFzaERlc2M6ICdcdTgxRUFcdTUyQThcdTZFMDVcdTc0MDZcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTRFMkRcdTc2ODRcdTY1RTdcdTY1ODdcdTRFRjYnLFxuXHRhdXRvQ2xlYW51cENvbXBsZXRlOiAnXHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XHU1QjhDXHU2MjEwXHVGRjBDXHU1REYyXHU1MjIwXHU5NjY0IHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2Jyxcblx0Y2xlYW51cERheXM6ICdcdTZFMDVcdTc0MDZcdTU5MjlcdTY1NzAnLFxuXHRjbGVhbnVwRGF5c0Rlc2M6ICdcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTRFMkRcdTc2ODRcdTY1ODdcdTRFRjZcdThEODVcdThGQzdcdTZCNjRcdTU5MjlcdTY1NzBcdTU0MEVcdTVDMDZcdTgxRUFcdTUyQThcdTUyMjBcdTk2NjQnLFxuXHRtZWRpYVR5cGVzOiAnXHU1QTkyXHU0RjUzXHU3QzdCXHU1NzhCJyxcblx0ZW5hYmxlSW1hZ2VTdXBwb3J0OiAnXHU1NDJGXHU3NTI4XHU1NkZFXHU3MjQ3XHU2NTJGXHU2MzAxJyxcblx0ZW5hYmxlSW1hZ2VTdXBwb3J0RGVzYzogJ1x1NTcyOFx1NUE5Mlx1NEY1M1x1NUU5M1x1NEUyRFx1NjYzRVx1NzkzQVx1NTZGRVx1NzI0N1x1NjU4N1x1NEVGNiAocG5nLCBqcGcsIGdpZiwgd2VicCwgc3ZnLCBibXApJyxcblx0ZW5hYmxlVmlkZW9TdXBwb3J0OiAnXHU1NDJGXHU3NTI4XHU4OUM2XHU5ODkxXHU2NTJGXHU2MzAxJyxcblx0ZW5hYmxlVmlkZW9TdXBwb3J0RGVzYzogJ1x1NTcyOFx1NUE5Mlx1NEY1M1x1NUU5M1x1NEUyRFx1NjYzRVx1NzkzQVx1ODlDNlx1OTg5MVx1NjU4N1x1NEVGNiAobXA0LCBtb3YsIGF2aSwgbWt2LCB3ZWJtKScsXG5cdGVuYWJsZUF1ZGlvU3VwcG9ydDogJ1x1NTQyRlx1NzUyOFx1OTdGM1x1OTg5MVx1NjUyRlx1NjMwMScsXG5cdGVuYWJsZUF1ZGlvU3VwcG9ydERlc2M6ICdcdTU3MjhcdTVBOTJcdTRGNTNcdTVFOTNcdTRFMkRcdTY2M0VcdTc5M0FcdTk3RjNcdTk4OTFcdTY1ODdcdTRFRjYgKG1wMywgd2F2LCBvZ2csIG00YSwgZmxhYyknLFxuXHRlbmFibGVQREZTdXBwb3J0OiAnXHU1NDJGXHU3NTI4IFBERiBcdTY1MkZcdTYzMDEnLFxuXHRlbmFibGVQREZTdXBwb3J0RGVzYzogJ1x1NTcyOFx1NUE5Mlx1NEY1M1x1NUU5M1x1NEUyRFx1NjYzRVx1NzkzQSBQREYgXHU2NTg3XHU0RUY2Jyxcblx0dmlld1NldHRpbmdzOiAnXHU4OUM2XHU1NkZFXHU4QkJFXHU3RjZFJyxcblx0aW50ZXJmYWNlTGFuZ3VhZ2U6ICdcdTc1NENcdTk3NjJcdThCRURcdThBMDAnLFxuXHRsYW5ndWFnZURlc2M6ICdcdTkwMDlcdTYyRTlcdTYzRDJcdTRFRjZcdTc1NENcdTk3NjJcdTY2M0VcdTc5M0FcdTc2ODRcdThCRURcdThBMDAnLFxuXHRsYW5ndWFnZVN5c3RlbTogJ1x1OERERlx1OTY4Rlx1N0NGQlx1N0VERicsXG5cdHBhZ2VTaXplOiAnXHU1MjA2XHU5ODc1XHU1OTI3XHU1QzBGJyxcblx0cGFnZVNpemVEZXNjOiAnXHU1QTkyXHU0RjUzXHU1RTkzXHU0RTJEXHU2QkNGXHU5ODc1XHU2NjNFXHU3OTNBXHU3Njg0XHU2NTg3XHU0RUY2XHU2NTcwXHU5MUNGJyxcblx0XHRlbmFibGVQcmV2aWV3TW9kYWw6ICdcdTU0MkZcdTc1MjhcdTk4ODRcdTg5QzggTW9kYWwnLFxuXHRcdGVuYWJsZVByZXZpZXdNb2RhbERlc2M6ICdcdTcwQjlcdTUxRkJcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTY1RjZcdTYyNTNcdTVGMDBcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTMnLFxuXHRcdGVuYWJsZUtleWJvYXJkTmF2OiAnXHU1NDJGXHU3NTI4XHU5NTJFXHU3NkQ4XHU1QkZDXHU4MjJBJyxcblx0XHRlbmFibGVLZXlib2FyZE5hdkRlc2M6ICdcdTU3MjhcdTk4ODRcdTg5QzhcdTdBOTdcdTUzRTNcdTRFMkRcdTRGN0ZcdTc1MjhcdTY1QjlcdTU0MTFcdTk1MkVcdTUyMDdcdTYzNjJcdTU2RkVcdTcyNDcnLFxuXHRcdHNhZmVTY2FuU2V0dGluZ3M6ICdcdTVCODlcdTUxNjhcdTYyNkJcdTYzQ0YnLFxuXHRcdHNhZmVTY2FuRW5hYmxlZERlc2M6ICdcdTU0MkZcdTc1MjhcdTU0MEVcdTUzRUZcdTU3MjhcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTdCQTFcdTc0MDZcdTRFMkRcdTYyNjdcdTg4NENcdTY3NjFcdTRFRjZcdTYyNkJcdTYzQ0YnLFxuXHRcdHNhZmVTY2FuVW5yZWZEYXlzOiAnXHU2NzJBXHU1RjE1XHU3NTI4XHU1OTI5XHU2NTcwJyxcblx0XHRzYWZlU2NhblVucmVmRGF5c0Rlc2M6ICdcdTRFQzVcdTYyNkJcdTYzQ0ZcdThEODVcdThGQzdcdTZCNjRcdTU5MjlcdTY1NzBcdTY3MkFcdTg4QUJcdTVGMTVcdTc1MjhcdTc2ODRcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjYnLFxuXHRcdHNhZmVTY2FuTWluU2l6ZTogJ1x1NjcwMFx1NUMwRlx1NjU4N1x1NEVGNlx1NTkyN1x1NUMwRiAoTUIpJyxcblx0XHRzYWZlU2Nhbk1pblNpemVEZXNjOiAnXHU0RUM1XHU2MjZCXHU2M0NGXHU1OTI3XHU0RThFXHU3QjQ5XHU0RThFXHU2QjY0XHU1OTI3XHU1QzBGXHU3Njg0XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2Jyxcblx0XHRkdXBsaWNhdGVEZXRlY3Rpb25TZXR0aW5nczogJ1x1OTFDRFx1NTkwRFx1NjhDMFx1NkQ0QicsXG5cdFx0ZHVwbGljYXRlVGhyZXNob2xkU2V0dGluZzogJ1x1NzZGOFx1NEYzQ1x1NUVBNlx1OTYwOFx1NTAzQycsXG5cdFx0ZHVwbGljYXRlVGhyZXNob2xkRGVzYzogJ1x1OEZCRVx1NTIzMFx1OEJFNVx1NzY3RVx1NTIwNlx1NkJENFx1NjI0RFx1NEYxQVx1ODhBQlx1NTIyNFx1NUI5QVx1NEUzQVx1OTFDRFx1NTkwRCcsXG5cdFx0a2V5Ym9hcmRTaG9ydGN1dHM6ICdcdTVGRUJcdTYzNzdcdTk1MkUnLFxuXHRcdHNob3J0Y3V0c0Rlc2M6ICdcdTYzRDJcdTRFRjZcdTY1MkZcdTYzMDFcdTc2ODRcdTVGRUJcdTYzNzdcdTk1MkVcdUZGMUEnLFxuXHRcdHNob3J0Y3V0T3BlbkxpYnJhcnk6ICdDdHJsK1NoaWZ0K00gLSBcdTYyNTNcdTVGMDBcdTVBOTJcdTRGNTNcdTVFOTMnLFxuXHRzaG9ydGN1dEZpbmRVbnJlZmVyZW5jZWQ6ICdDdHJsK1NoaWZ0K1UgLSBcdTY3RTVcdTYyN0VcdTY3MkFcdTVGMTVcdTc1MjhcdTVBOTJcdTRGNTMnLFxuXHRzaG9ydGN1dE9wZW5UcmFzaDogJ0N0cmwrU2hpZnQrVCAtIFx1NjI1M1x1NUYwMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1N0JBMVx1NzQwNicsXG5cdGNvbW1hbmRzOiAnXHU1RkVCXHU2Mzc3XHU1NDdEXHU0RUU0Jyxcblx0Y29tbWFuZHNEZXNjOiAnXHU1NzI4XHU1NDdEXHU0RUU0XHU5NzYyXHU2NzdGXHU0RTJEXHU0RjdGXHU3NTI4XHU0RUU1XHU0RTBCXHU1NDdEXHU0RUU0XHVGRjFBJyxcblx0Y21kT3BlbkxpYnJhcnk6ICdcdTVBOTJcdTRGNTNcdTVFOTMgLSBcdTYyNTNcdTVGMDBcdTVBOTJcdTRGNTNcdTVFOTNcdTg5QzZcdTU2RkUnLFxuXHRjbWRGaW5kVW5yZWZlcmVuY2VkOiAnXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU1QTkyXHU0RjUzIC0gXHU2N0U1XHU2MjdFXHU2NzJBXHU4OEFCXHU0RUZCXHU0RjU1XHU3QjE0XHU4QkIwXHU1RjE1XHU3NTI4XHU3Njg0XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2Jyxcblx0Y21kVHJhc2hNYW5hZ2VtZW50OiAnXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU3QkExXHU3NDA2IC0gXHU3QkExXHU3NDA2XHU1REYyXHU1MjIwXHU5NjY0XHU3Njg0XHU2NTg3XHU0RUY2Jyxcblx0Y21kQWxpZ25MZWZ0OiAnXHU1NkZFXHU3MjQ3XHU1QzQ1XHU1REU2XHU1QkY5XHU5RjUwIC0gXHU1QzA2XHU5MDA5XHU0RTJEXHU1NkZFXHU3MjQ3XHU1QzQ1XHU1REU2XHU1QkY5XHU5RjUwJyxcblx0Y21kQWxpZ25DZW50ZXI6ICdcdTU2RkVcdTcyNDdcdTVDNDVcdTRFMkRcdTVCRjlcdTlGNTAgLSBcdTVDMDZcdTkwMDlcdTRFMkRcdTU2RkVcdTcyNDdcdTVDNDVcdTRFMkRcdTVCRjlcdTlGNTAnLFxuXHRjbWRBbGlnblJpZ2h0OiAnXHU1NkZFXHU3MjQ3XHU1QzQ1XHU1M0YzXHU1QkY5XHU5RjUwIC0gXHU1QzA2XHU5MDA5XHU0RTJEXHU1NkZFXHU3MjQ3XHU1QzQ1XHU1M0YzXHU1QkY5XHU5RjUwJyxcblxuXHQvLyBUcmFzaCBNYW5hZ2VtZW50IFZpZXdcblx0bG9hZGluZ1RyYXNoRmlsZXM6ICdcdTZCNjNcdTU3MjhcdTUyQTBcdThGN0RcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjYuLi4nLFxuXHR0cmFzaEZvbGRlckVtcHR5OiAnXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTNBXHU3QTdBJyxcblx0ZmlsZXNJblRyYXNoOiAnXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTJEXHU2NzA5IHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2Jyxcblx0dG90YWxTaXplOiAnXHU2MDNCXHU4QkExIHtzaXplfScsXG5cdHRyYXNoTWFuYWdlbWVudERlc2M6ICdcdTVERjJcdTUyMjBcdTk2NjRcdTc2ODRcdTY1ODdcdTRFRjZcdTRGMUFcdTRFMzRcdTY1RjZcdTVCNThcdTY1M0VcdTU3MjhcdThGRDlcdTkxQ0NcdUZGMENcdTYwQThcdTUzRUZcdTRFRTVcdTYwNjJcdTU5MERcdTYyMTZcdTVGN0JcdTVFOTVcdTUyMjBcdTk2NjRcdTVCODNcdTRFRUMnLFxuXHRyZWZyZXNoOiAnXHU1MjM3XHU2NUIwJyxcblx0Y2xlYXJUcmFzaDogJ1x1NkUwNVx1N0E3QVx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOScsXG5cdGNsZWFyVHJhc2hUb29sdGlwOiAnXHU2RTA1XHU3QTdBXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5Jyxcblx0cmVzdG9yZVRvb2x0aXA6ICdcdTYwNjJcdTU5MERcdTY1ODdcdTRFRjYnLFxuXHRwZXJtYW5lbnREZWxldGU6ICdcdTVGN0JcdTVFOTVcdTUyMjBcdTk2NjQnLFxuXHRwZXJtYW5lbnREZWxldGVUb29sdGlwOiAnXHU1RjdCXHU1RTk1XHU1MjIwXHU5NjY0Jyxcblx0ZGVsZXRlZFRpbWU6ICdcdTUyMjBcdTk2NjRcdTY1RjZcdTk1RjQnLFxuXHRjb25maXJtRGVsZXRlRmlsZTogJ1x1Nzg2RVx1NUI5QVx1ODk4MVx1NUY3Qlx1NUU5NVx1NTIyMFx1OTY2NCBcIntuYW1lfVwiIFx1NTQxN1x1RkYxRlx1NkI2NFx1NjRDRFx1NEY1Q1x1NEUwRFx1NTNFRlx1NjRBNFx1OTUwMFx1MzAwMicsXG5cdGNvbmZpcm1DbGVhclRyYXNoOiAnXHU3ODZFXHU1QjlBXHU4OTgxXHU2RTA1XHU3QTdBXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU1NDE3XHVGRjFGe2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjZcdTVDMDZcdTg4QUJcdTVGN0JcdTVFOTVcdTUyMjBcdTk2NjRcdUZGMENcdTZCNjRcdTY0Q0RcdTRGNUNcdTRFMERcdTUzRUZcdTY0QTRcdTk1MDBcdTMwMDInLFxuXHRmaWxlRGVsZXRlZDogJ1x1NURGMlx1NUY3Qlx1NUU5NVx1NTIyMFx1OTY2NDoge25hbWV9Jyxcblx0cmVzdG9yZVN1Y2Nlc3M6ICdcdTVERjJcdTYwNjJcdTU5MEQ6IHtuYW1lfScsXG5cdHJlc3RvcmVGYWlsZWQ6ICdcdTYwNjJcdTU5MERcdTU5MzFcdThEMjU6IHttZXNzYWdlfScsXG5cdHRhcmdldEZpbGVFeGlzdHM6ICdcdTc2RUVcdTY4MDdcdTY1ODdcdTRFRjZcdTVERjJcdTVCNThcdTU3MjgnLFxuXHRkZWxldGVGYWlsZWQ6ICdcdTUyMjBcdTk2NjRcdTU5MzFcdThEMjUnLFxuXHRmaWxlTmFtZUNvcGllZDogJ1x1NjU4N1x1NEVGNlx1NTQwRFx1NURGMlx1NTkwRFx1NTIzNicsXG5cdG9yaWdpbmFsUGF0aENvcGllZDogJ1x1NTM5Rlx1NTlDQlx1OERFRlx1NUY4NFx1NURGMlx1NTkwRFx1NTIzNicsXG5cblx0Ly8gXHU2NzJBXHU1RjE1XHU3NTI4XHU1NkZFXHU3MjQ3XHU4OUM2XHU1NkZFXG5cdHNjYW5uaW5nVW5yZWZlcmVuY2VkOiAnXHU2QjYzXHU1NzI4XHU2MjZCXHU2M0NGXHU2NzJBXHU1RjE1XHU3NTI4XHU3Njg0XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2Li4uJyxcblx0dG90YWxTaXplTGFiZWw6ICdcdTYwM0JcdThCQTEge3NpemV9Jyxcblx0c2NhbkVycm9yOiAnXHU2MjZCXHU2M0NGXHU1NkZFXHU3MjQ3XHU2NUY2XHU1MUZBXHU5NTE5Jyxcblx0dW5yZWZlcmVuY2VkRGVzYzogJ1x1NEVFNVx1NEUwQlx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1NjcyQVx1ODhBQlx1NEVGQlx1NEY1NVx1N0IxNFx1OEJCMFx1NUYxNVx1NzUyOFx1RkYwQ1x1NTNFRlx1ODBGRFx1NTNFRlx1NEVFNVx1NTIyMFx1OTY2NFx1NEVFNVx1OTFDQVx1NjUzRVx1N0E3QVx1OTVGNCcsXG5cdG5vRmlsZXNUb0RlbGV0ZTogJ1x1NkNBMVx1NjcwOVx1OTcwMFx1ODk4MVx1NTIyMFx1OTY2NFx1NzY4NFx1NTZGRVx1NzI0NycsXG5cdHByb2Nlc3NlZEZpbGVzOiAnXHU1REYyXHU1OTA0XHU3NDA2IHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2Jyxcblx0cHJvY2Vzc2VkRmlsZXNFcnJvcjogJ1x1NTkwNFx1NzQwNiB7ZXJyb3JzfSBcdTRFMkFcdTY1ODdcdTRFRjZcdTY1RjZcdTUxRkFcdTk1MTknLFxuXHRjb3B5QWxsUGF0aHM6ICdcdTU5MERcdTUyMzZcdTYyNDBcdTY3MDlcdThERUZcdTVGODQnLFxuXHRjb3BpZWRGaWxlUGF0aHM6ICdcdTVERjJcdTU5MERcdTUyMzYge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjZcdThERUZcdTVGODQnLFxuXG5cdC8vIFx1NTZGRVx1NzI0N1x1NUU5M1x1ODlDNlx1NTZGRVxuXHRub01hdGNoaW5nRmlsZXM6ICdcdTZDQTFcdTY3MDlcdTUzMzlcdTkxNERcdTc2ODRcdTY1ODdcdTRFRjYnLFxuXHRwcmV2UGFnZTogJ1x1NEUwQVx1NEUwMFx1OTg3NScsXG5cdG5leHRQYWdlOiAnXHU0RTBCXHU0RTAwXHU5ODc1Jyxcblx0cGFnZUluZm86ICdcdTdCMkMge2N1cnJlbnR9IC8ge3RvdGFsfSBcdTk4NzUnLFxuXHRzZWxlY3RGaWxlczogJ1x1NURGMlx1OTAwOVx1NjJFOSB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdHNlbGVjdEFsbDogJ1x1NTE2OFx1OTAwOScsXG5cdGRlc2VsZWN0QWxsOiAnXHU1M0Q2XHU2RDg4XHU1MTY4XHU5MDA5Jyxcblx0Y29uZmlybURlbGV0ZVNlbGVjdGVkOiAnXHU3ODZFXHU1QjlBXHU4OTgxXHU1MjIwXHU5NjY0XHU5MDA5XHU0RTJEXHU3Njg0IHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2XHU1NDE3XHVGRjFGJyxcblx0ZGVsZXRlZEZpbGVzOiAnXHU1REYyXHU1MjIwXHU5NjY0IHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2Jyxcblx0ZGVsZXRlRmlsZXNGYWlsZWQ6ICdcdTUyMjBcdTk2NjQge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjUnLFxuXHRtdWx0aVNlbGVjdE1vZGU6ICdcdTU5MUFcdTkwMDlcdTZBMjFcdTVGMEYnLFxuXG5cdC8vIFx1NUE5Mlx1NEY1M1x1OTg4NFx1ODlDOFxuXHR1bnN1cHBvcnRlZEZpbGVUeXBlOiAnXHU0RTBEXHU2NTJGXHU2MzAxXHU5ODg0XHU4OUM4XHU2QjY0XHU3QzdCXHU1NzhCXHU2NTg3XHU0RUY2Jyxcblx0Y29weVBhdGhCdG46ICdcdTU5MERcdTUyMzZcdThERUZcdTVGODQnLFxuXHRjb3B5TGlua0J0bjogJ1x1NTkwRFx1NTIzNlx1OTRGRVx1NjNBNScsXG5cdGZpbmRJbk5vdGVzOiAnXHU1NzI4XHU3QjE0XHU4QkIwXHU0RTJEXHU2N0U1XHU2MjdFJyxcblx0cGF0aENvcGllZDogJ1x1OERFRlx1NUY4NFx1NURGMlx1NTkwRFx1NTIzNicsXG5cdGxpbmtDb3BpZWQ6ICdcdTk0RkVcdTYzQTVcdTVERjJcdTU5MERcdTUyMzYnLFxuXHRpbWFnZUxvYWRFcnJvcjogJ1x1NTZGRVx1NzI0N1x1NTJBMFx1OEY3RFx1NTkzMVx1OEQyNScsXG5cblx0Ly8gXHU1NkZFXHU3MjQ3XHU1QkY5XHU5RjUwXG5cdGFsaWduSW1hZ2VMZWZ0OiAnXHU1NkZFXHU3MjQ3XHU1QzQ1XHU1REU2XHU1QkY5XHU5RjUwJyxcblx0YWxpZ25JbWFnZUNlbnRlcjogJ1x1NTZGRVx1NzI0N1x1NUM0NVx1NEUyRFx1NUJGOVx1OUY1MCcsXG5cdGFsaWduSW1hZ2VSaWdodDogJ1x1NTZGRVx1NzI0N1x1NUM0NVx1NTNGM1x1NUJGOVx1OUY1MCcsXG5cdHNlbGVjdEltYWdlRmlyc3Q6ICdcdThCRjdcdTUxNDhcdTkwMDlcdTRFMkRcdTRFMDBcdTVGMjBcdTU2RkVcdTcyNDcnLFxuXHRzZWxlY3RJbWFnZTogJ1x1OEJGN1x1OTAwOVx1NEUyRFx1NTZGRVx1NzI0NycsXG5cdGltYWdlQWxpZ25lZExlZnQ6ICdcdTU2RkVcdTcyNDdcdTVERjJcdTVDNDVcdTVERTZcdTVCRjlcdTlGNTAnLFxuXHRpbWFnZUFsaWduZWRDZW50ZXI6ICdcdTU2RkVcdTcyNDdcdTVERjJcdTVDNDVcdTRFMkRcdTVCRjlcdTlGNTAnLFxuXHRpbWFnZUFsaWduZWRSaWdodDogJ1x1NTZGRVx1NzI0N1x1NURGMlx1NUM0NVx1NTNGM1x1NUJGOVx1OUY1MCcsXG5cblx0Ly8gXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU2NENEXHU0RjVDXG5cdGNvcGllZEZpbGVOYW1lOiAnXHU1REYyXHU1OTBEXHU1MjM2XHU2NTg3XHU0RUY2XHU1NDBEJyxcblx0Y29waWVkT3JpZ2luYWxQYXRoOiAnXHU1REYyXHU1OTBEXHU1MjM2XHU1MzlGXHU1OUNCXHU4REVGXHU1Rjg0Jyxcblx0bm90UmVmZXJlbmNlZDogJ1x1OEJFNVx1NTZGRVx1NzI0N1x1NjcyQVx1ODhBQlx1NEVGQlx1NEY1NVx1N0IxNFx1OEJCMFx1NUYxNVx1NzUyOCcsXG5cdG1vdmVkVG9UcmFzaDogJ1x1NURGMlx1NzlGQlx1ODFGM1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOToge25hbWV9Jyxcblx0ZGVsZXRlZEZpbGU6ICdcdTVERjJcdTUyMjBcdTk2NjQ6IHtuYW1lfScsXG5cdHJlc3RvcmVkRmlsZTogJ1x1NURGMlx1NjA2Mlx1NTkwRFx1NjU4N1x1NEVGNicsXG5cblx0Ly8gXHU1NDdEXHU0RUU0XHU1NDBEXHU3OUYwXG5cdGNtZEltYWdlTGlicmFyeTogJ1x1NTZGRVx1NzI0N1x1NUU5MycsXG5cdGNtZEZpbmRVbnJlZmVyZW5jZWRJbWFnZXM6ICdcdTY3RTVcdTYyN0VcdTY3MkFcdTVGMTVcdTc1MjhcdTU2RkVcdTcyNDcnLFxuXHRjbWRSZWZyZXNoQ2FjaGU6ICdcdTUyMzdcdTY1QjBcdTVBOTJcdTRGNTNcdTVGMTVcdTc1MjhcdTdGMTNcdTVCNTgnLFxuXHRjbWRBbGlnbkltYWdlTGVmdDogJ1x1NTZGRVx1NzI0N1x1NUM0NVx1NURFNlx1NUJGOVx1OUY1MCcsXG5cdGNtZEFsaWduSW1hZ2VDZW50ZXI6ICdcdTU2RkVcdTcyNDdcdTVDNDVcdTRFMkRcdTVCRjlcdTlGNTAnLFxuXHRjbWRBbGlnbkltYWdlUmlnaHQ6ICdcdTU2RkVcdTcyNDdcdTVDNDVcdTUzRjNcdTVCRjlcdTlGNTAnLFxuXHRjbWRPcGVuTWVkaWFMaWJyYXJ5OiAnXHU2MjUzXHU1RjAwXHU1QTkyXHU0RjUzXHU1RTkzJyxcblx0Y21kRmluZFVucmVmZXJlbmNlZE1lZGlhOiAnXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU1QTkyXHU0RjUzJyxcblx0Y21kT3BlblRyYXNoTWFuYWdlbWVudDogJ1x1NjI1M1x1NUYwMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1N0JBMVx1NzQwNicsXG5cblx0Ly8gXHU1MjIwXHU5NjY0XHU2NENEXHU0RjVDXG5cdGRlbGV0ZUZhaWxlZFdpdGhOYW1lOiAnXHU1MjIwXHU5NjY0XHU1OTMxXHU4RDI1OiB7bmFtZX0nLFxuXHRkZWxldGVkV2l0aFF1YXJhbnRpbmVGYWlsZWQ6ICdcdTVERjJcdTUyMjBcdTk2NjQ6IHtuYW1lfVx1RkYwOFx1OTY5NFx1NzlCQlx1NTkzMVx1OEQyNVx1RkYwOScsXG5cdG9wZXJhdGlvbkZhaWxlZDogJ1x1NjRDRFx1NEY1Q1x1NTkzMVx1OEQyNToge25hbWV9Jyxcblx0cHJvY2Vzc2luZzogJ1x1NTkwNFx1NzQwNlx1NEUyRC4uLicsXG5cblx0Ly8gdjIuMCBcdTY1QjBcdTU4OUVcblx0ZHVwbGljYXRlRGV0ZWN0aW9uOiAnXHU5MUNEXHU1OTBEXHU2OEMwXHU2RDRCJyxcblx0ZHVwbGljYXRlRGV0ZWN0aW9uRGVzYzogJ1x1NEY3Rlx1NzUyOFx1NjExRlx1NzdFNVx1NTRDOFx1NUUwQ1x1N0I5N1x1NkNENVx1NjhDMFx1NkQ0Qlx1NTBDRlx1N0QyMFx1N0VBN1x1OTFDRFx1NTkwRFx1NTZGRVx1NzI0N1x1RkYwQ1x1OTc1RVx1NjU4N1x1NEVGNlx1NTQwRFx1NUJGOVx1NkJENCcsXG5cdG5vRHVwbGljYXRlc0ZvdW5kOiAnXHU2NzJBXHU1M0QxXHU3M0IwXHU5MUNEXHU1OTBEXHU2NTg3XHU0RUY2XHVGRjBDXHU3MEI5XHU1MUZCXHUyMDFDXHU1RjAwXHU1OUNCXHU2MjZCXHU2M0NGXHUyMDFEXHU2OEMwXHU2RDRCJyxcblx0c3RhcnRTY2FuOiAnXHU1RjAwXHU1OUNCXHU2MjZCXHU2M0NGJyxcblx0c2NhblByb2dyZXNzOiAnXHU2MjZCXHU2M0NGXHU4RkRCXHU1RUE2OiB7Y3VycmVudH0ve3RvdGFsfScsXG5cdHNpbWlsYXJpdHlUaHJlc2hvbGQ6ICdcdTc2RjhcdTRGM0NcdTVFQTZcdTk2MDhcdTUwM0M6IHt2YWx1ZX0lJyxcblx0ZHVwbGljYXRlR3JvdXBzRm91bmQ6ICdcdTUzRDFcdTczQjAge2dyb3Vwc30gXHU3RUM0XHU5MUNEXHU1OTBEXHVGRjBDXHU1MTcxIHtmaWxlc30gXHU0RTJBXHU1MTk3XHU0RjU5XHU2NTg3XHU0RUY2Jyxcblx0ZHVwbGljYXRlR3JvdXA6ICdcdTkxQ0RcdTU5MERcdTdFQzQgI3tpbmRleH0nLFxuXHRmaWxlczogJ1x1NEUyQVx1NjU4N1x1NEVGNicsXG5cdHN1Z2dlc3RLZWVwOiAnXHUyNzA1IFx1NUVGQVx1OEJBRVx1NEZERFx1NzU1OScsXG5cdHF1YXJhbnRpbmU6ICdcdTk2OTRcdTc5QkInLFxuXHRxdWFyYW50aW5lQWxsRHVwbGljYXRlczogJ1x1NEUwMFx1OTUyRVx1OTY5NFx1NzlCQlx1NjI0MFx1NjcwOVx1OTFDRFx1NTkwRCcsXG5cdGR1cGxpY2F0ZXNGb3VuZDogJ1x1NTNEMVx1NzNCMCB7Z3JvdXBzfSBcdTdFQzRcdTkxQ0RcdTU5MERcdUZGMENcdTUxNzEge2ZpbGVzfSBcdTRFMkFcdTUxOTdcdTRGNTlcdTY1ODdcdTRFRjYnLFxuXHRkdXBsaWNhdGVzUXVhcmFudGluZWQ6ICdcdTVERjJcdTk2OTRcdTc5QkIge2NvdW50fSBcdTRFMkFcdTkxQ0RcdTU5MERcdTY1ODdcdTRFRjYnLFxuXHR0eXBlRGlzdHJpYnV0aW9uOiAnXHU3QzdCXHU1NzhCXHU1MjA2XHU1RTAzJyxcblx0dW5yZWZlcmVuY2VkUmF0ZTogJ1x1NjcyQVx1NUYxNVx1NzUyOFx1NzM4NycsXG5cdHJlZmVyZW5jZWRCeTogJ1x1ODhBQiB7Y291bnR9IFx1N0JDN1x1N0IxNFx1OEJCMFx1NUYxNVx1NzUyOCcsXG5cdHNlbGVjdGVkQ291bnQ6ICdcdTVERjJcdTkwMDlcdTYyRTkge2NvdW50fSBcdTk4NzknLFxuXHRiYXRjaFJlc3RvcmU6ICdcdTYyNzlcdTkxQ0ZcdTYwNjJcdTU5MEQnLFxuXHRiYXRjaERlbGV0ZTogJ1x1NjI3OVx1OTFDRlx1NTIyMFx1OTY2NCcsXG5cdG5vSXRlbXNTZWxlY3RlZDogJ1x1OEJGN1x1NTE0OFx1OTAwOVx1NjJFOVx1NjU4N1x1NEVGNicsXG5cdGNvbmZpcm1CYXRjaFJlc3RvcmU6ICdcdTc4NkVcdThCQTRcdTYwNjJcdTU5MEQge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjZcdUZGMUYnLFxuXHRiYXRjaFJlc3RvcmVDb21wbGV0ZWQ6ICdcdTVERjJcdTYwNjJcdTU5MEQge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjYnLFxuXHRzYWZlU2NhbjogJ1x1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRicsXG5cdHNhZmVTY2FuRGVzYzogJ1x1ODFFQVx1NTJBOFx1NjI2Qlx1NjNDRlx1NjcyQVx1NUYxNVx1NzUyOFx1MzAwMVx1OEQ4NVx1NjcxRlx1MzAwMVx1OEQ4NVx1NTkyN1x1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNicsXG5cdHNhZmVTY2FuU3RhcnRlZDogJ1x1NUYwMFx1NTlDQlx1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRi4uLicsXG5cdHNhZmVTY2FuTm9SZXN1bHRzOiAnXHU2NzJBXHU1M0QxXHU3M0IwXHU3QjI2XHU1NDA4XHU2NzYxXHU0RUY2XHU3Njg0XHU2NTg3XHU0RUY2Jyxcblx0c2FmZVNjYW5Db25maXJtOiAnXHU1M0QxXHU3M0IwIHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2XHU3QjI2XHU1NDA4XHU2NzYxXHU0RUY2XHVGRjA4XHU2NzJBXHU1RjE1XHU3NTI4PntkYXlzfVx1NTkyOSArIFx1NTkyN1x1NUMwRj57c2l6ZX1cdUZGMDlcdUZGMENcdTc4NkVcdThCQTRcdTkwMDFcdTUxNjVcdTk2OTRcdTc5QkJcdTUzM0FcdUZGMUYnLFxuXHRzYWZlU2NhbkNvbXBsZXRlOiAnXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGXHU1QjhDXHU2MjEwXHVGRjBDXHU1REYyXHU5Njk0XHU3OUJCIHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2Jyxcblx0c2FmZVNjYW5GYWlsZWQ6ICdcdTVCODlcdTUxNjhcdTYyNkJcdTYzQ0ZcdTU5MzFcdThEMjUnLFxuXHRjbWREdXBsaWNhdGVEZXRlY3Rpb246ICdcdTYyNTNcdTVGMDBcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEInLFxuXHRvcmdhbml6aW5nOiAnXHU2NTc0XHU3NDA2XHU0RTJEJyxcblx0b3JnYW5pemVDb21wbGV0ZTogJ1x1NURGMlx1NjU3NFx1NzQwNiB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNidcbn07XG5cbmNvbnN0IGVuOiBUcmFuc2xhdGlvbnMgPSB7XG5cdC8vIEdlbmVyYWxcblx0b2s6ICdPSycsXG5cdGNhbmNlbDogJ0NhbmNlbCcsXG5cdGRlbGV0ZTogJ0RlbGV0ZScsXG5cdHJlc3RvcmU6ICdSZXN0b3JlJyxcblx0Y29uZmlybTogJ0NvbmZpcm0nLFxuXHRzdWNjZXNzOiAnU3VjY2VzcycsXG5cdGVycm9yOiAnRXJyb3InLFxuXG5cdC8vIFZpZXcgbmFtZXNcblx0bWVkaWFMaWJyYXJ5OiAnTWVkaWEgTGlicmFyeScsXG5cdHVucmVmZXJlbmNlZE1lZGlhOiAnVW5yZWZlcmVuY2VkIE1lZGlhJyxcblx0dHJhc2hNYW5hZ2VtZW50OiAnVHJhc2ggTWFuYWdlbWVudCcsXG5cblx0Ly8gTWVkaWEgTGlicmFyeVxuXHR0b3RhbE1lZGlhRmlsZXM6ICd7Y291bnR9IG1lZGlhIGZpbGVzJyxcblx0bm9NZWRpYUZpbGVzOiAnTm8gbWVkaWEgZmlsZXMgZm91bmQnLFxuXHRhbGxNZWRpYVR5cGVzRGlzYWJsZWQ6ICdBbGwgbWVkaWEgdHlwZXMgaGF2ZSBiZWVuIGRpc2FibGVkLiBQbGVhc2UgZW5hYmxlIGF0IGxlYXN0IG9uZSBtZWRpYSB0eXBlIGluIHNldHRpbmdzJyxcblx0c2VhcmNoUGxhY2Vob2xkZXI6ICdTZWFyY2ggYnkgZmlsZW5hbWUuLi4nLFxuXHRzZWFyY2hSZXN1bHRzOiAne2NvdW50fSByZXN1bHRzIGZvdW5kJyxcblxuXHQvLyBVbnJlZmVyZW5jZWQgTWVkaWFcblx0dW5yZWZlcmVuY2VkRm91bmQ6ICd7Y291bnR9IHVucmVmZXJlbmNlZCBtZWRpYSBmaWxlcyBmb3VuZCcsXG5cdGFsbE1lZGlhUmVmZXJlbmNlZDogJ0dyZWF0ISBBbGwgbWVkaWEgZmlsZXMgYXJlIHJlZmVyZW5jZWQnLFxuXHRkZWxldGVUb1RyYXNoOiAnRmlsZXMgd2lsbCBiZSBtb3ZlZCB0byB0cmFzaCBmb2xkZXInLFxuXG5cdC8vIFRyYXNoIEZvbGRlclxuXHR0cmFzaEVtcHR5OiAnVHJhc2ggZm9sZGVyIGlzIGVtcHR5Jyxcblx0b3JpZ2luYWxQYXRoOiAnT3JpZ2luYWwgbG9jYXRpb24nLFxuXHRkZWxldGVkQXQ6ICdEZWxldGVkIGF0Jyxcblx0Y29uZmlybUNsZWFyQWxsOiAnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGVtcHR5IHRoZSB0cmFzaCBmb2xkZXI/JyxcblxuXHQvLyBBY3Rpb25zXG5cdG9wZW5Jbk5vdGVzOiAnRmluZCBpbiBOb3RlcycsXG5cdGNvcHlQYXRoOiAnQ29weSBQYXRoJyxcblx0Y29weUxpbms6ICdDb3B5IExpbmsnLFxuXHRvcGVuT3JpZ2luYWw6ICdPcGVuIE9yaWdpbmFsJyxcblx0cHJldmlldzogJ1ByZXZpZXcnLFxuXG5cdC8vIFNob3J0Y3V0c1xuXHRzaG9ydGN1dHM6ICdTaG9ydGN1dHMnLFxuXHRvcGVuTGlicmFyeTogJ09wZW4gTWVkaWEgTGlicmFyeScsXG5cdGZpbmRVbnJlZmVyZW5jZWQ6ICdGaW5kIFVucmVmZXJlbmNlZCBNZWRpYScsXG5cdG9wZW5UcmFzaDogJ09wZW4gVHJhc2ggTWFuYWdlbWVudCcsXG5cblx0Ly8gU2Nhbm5pbmcgcHJvZ3Jlc3Ncblx0c2Nhbm5pbmdSZWZlcmVuY2VzOiAnU2Nhbm5pbmcgcmVmZXJlbmNlcycsXG5cdHNjYW5Db21wbGV0ZTogJ1NjYW4gY29tcGxldGUnLFxuXHRmaWxlc1NjYW5uZWQ6ICdmaWxlcyBzY2FubmVkJyxcblxuXHQvLyBCYXRjaCBvcGVyYXRpb25zXG5cdGJhdGNoRGVsZXRlQ29tcGxldGU6ICd7Y291bnR9IGZpbGVzIGRlbGV0ZWQnLFxuXHRiYXRjaERlbGV0ZVByb2dyZXNzOiAnRGVsZXRpbmcge2N1cnJlbnR9L3t0b3RhbH0nLFxuXHRiYXRjaFJlc3RvcmVDb21wbGV0ZTogJ3tjb3VudH0gZmlsZXMgcmVzdG9yZWQnLFxuXG5cdC8vIFNldHRpbmdzIHBhZ2Vcblx0cGx1Z2luU2V0dGluZ3M6ICdNZWRpYSBUb29sa2l0IFBsdWdpbiBTZXR0aW5ncycsXG5cdG1lZGlhRm9sZGVyOiAnTWVkaWEgRm9sZGVyJyxcblx0bWVkaWFGb2xkZXJEZXNjOiAnU3BlY2lmeSB0aGUgbWVkaWEgZm9sZGVyIHBhdGggdG8gc2NhbiAobGVhdmUgZW1wdHkgdG8gc2NhbiBlbnRpcmUgdmF1bHQpJyxcblx0dGh1bWJuYWlsU2l6ZTogJ1RodW1ibmFpbCBTaXplJyxcblx0dGh1bWJuYWlsU2l6ZURlc2M6ICdDaG9vc2UgdGh1bWJuYWlsIHNpemUgaW4gbWVkaWEgbGlicmFyeSB2aWV3Jyxcblx0dGh1bWJuYWlsU21hbGw6ICdTbWFsbCAoMTAwcHgpJyxcblx0dGh1bWJuYWlsTWVkaXVtOiAnTWVkaXVtICgxNTBweCknLFxuXHR0aHVtYm5haWxMYXJnZTogJ0xhcmdlICgyMDBweCknLFxuXHRkZWZhdWx0U29ydEJ5OiAnRGVmYXVsdCBTb3J0IEJ5Jyxcblx0c29ydEJ5RGVzYzogJ0Nob29zZSBkZWZhdWx0IHNvcnQgbWV0aG9kIGZvciBpbWFnZXMnLFxuXHRzb3J0T3JkZXI6ICdTb3J0IE9yZGVyJyxcblx0c29ydE9yZGVyRGVzYzogJ0Nob29zZSBhc2NlbmRpbmcgb3IgZGVzY2VuZGluZyBvcmRlcicsXG5cdHNvcnRCeU5hbWU6ICdCeSBOYW1lJyxcblx0c29ydEJ5RGF0ZTogJ0J5IERhdGUnLFxuXHRzb3J0QnlTaXplOiAnQnkgU2l6ZScsXG5cdHNvcnRBc2M6ICdBc2NlbmRpbmcnLFxuXHRzb3J0RGVzYzogJ0Rlc2NlbmRpbmcnLFxuXHRzaG93SW1hZ2VJbmZvOiAnU2hvdyBJbWFnZSBJbmZvJyxcblx0c2hvd0ltYWdlSW5mb0Rlc2M6ICdEaXNwbGF5IGZpbGVuYW1lIGFuZCBzaXplIGJlbG93IGltYWdlIHRodW1ibmFpbHMnLFxuXHRhdXRvUmVmcmVzaDogJ0F1dG8gUmVmcmVzaCcsXG5cdGF1dG9SZWZyZXNoRGVzYzogJ0F1dG9tYXRpY2FsbHkgcmVmcmVzaCB2aWV3IHdoZW4gaW1hZ2VzIGNoYW5nZSBpbiB2YXVsdCcsXG5cdGRlZmF1bHRBbGlnbm1lbnQ6ICdEZWZhdWx0IEltYWdlIEFsaWdubWVudCcsXG5cdGFsaWdubWVudERlc2M6ICdEZWZhdWx0IGFsaWdubWVudCB3aGVuIGluc2VydGluZyBpbWFnZXMnLFxuXHRhbGlnbkxlZnQ6ICdMZWZ0Jyxcblx0YWxpZ25DZW50ZXI6ICdDZW50ZXInLFxuXHRhbGlnblJpZ2h0OiAnUmlnaHQnLFxuXHRzYWZlRGVsZXRlU2V0dGluZ3M6ICdTYWZlIERlbGV0ZSBTZXR0aW5ncycsXG5cdHVzZVRyYXNoRm9sZGVyOiAnVXNlIFRyYXNoIEZvbGRlcicsXG5cdHVzZVRyYXNoRm9sZGVyRGVzYzogJ01vdmUgZmlsZXMgdG8gdHJhc2ggZm9sZGVyIGluc3RlYWQgb2YgZGVsZXRpbmcgZGlyZWN0bHknLFxuXHR0cmFzaEZvbGRlclBhdGg6ICdUcmFzaCBGb2xkZXInLFxuXHR0cmFzaEZvbGRlclBhdGhEZXNjOiAnUGF0aCB0byB0cmFzaCBmb2xkZXIgKHJlbGF0aXZlIHBhdGgpJyxcblx0YXV0b0NsZWFudXBUcmFzaDogJ0F1dG8gQ2xlYW51cCBUcmFzaCcsXG5cdGF1dG9DbGVhbnVwVHJhc2hEZXNjOiAnQXV0b21hdGljYWxseSBjbGVhbiB1cCBvbGQgZmlsZXMgaW4gdHJhc2ggZm9sZGVyJyxcblx0YXV0b0NsZWFudXBDb21wbGV0ZTogJ0F1dG8gY2xlYW51cCBjb21wbGV0ZSwgZGVsZXRlZCB7Y291bnR9IGZpbGVzJyxcblx0Y2xlYW51cERheXM6ICdDbGVhbnVwIERheXMnLFxuXHRjbGVhbnVwRGF5c0Rlc2M6ICdGaWxlcyBvbGRlciB0aGFuIHRoaXMgbWFueSBkYXlzIHdpbGwgYmUgYXV0b21hdGljYWxseSBkZWxldGVkJyxcblx0bWVkaWFUeXBlczogJ01lZGlhIFR5cGVzJyxcblx0ZW5hYmxlSW1hZ2VTdXBwb3J0OiAnRW5hYmxlIEltYWdlIFN1cHBvcnQnLFxuXHRlbmFibGVJbWFnZVN1cHBvcnREZXNjOiAnU2hvdyBpbWFnZSBmaWxlcyBpbiBtZWRpYSBsaWJyYXJ5IChwbmcsIGpwZywgZ2lmLCB3ZWJwLCBzdmcsIGJtcCknLFxuXHRlbmFibGVWaWRlb1N1cHBvcnQ6ICdFbmFibGUgVmlkZW8gU3VwcG9ydCcsXG5cdGVuYWJsZVZpZGVvU3VwcG9ydERlc2M6ICdTaG93IHZpZGVvIGZpbGVzIGluIG1lZGlhIGxpYnJhcnkgKG1wNCwgbW92LCBhdmksIG1rdiwgd2VibSknLFxuXHRlbmFibGVBdWRpb1N1cHBvcnQ6ICdFbmFibGUgQXVkaW8gU3VwcG9ydCcsXG5cdGVuYWJsZUF1ZGlvU3VwcG9ydERlc2M6ICdTaG93IGF1ZGlvIGZpbGVzIGluIG1lZGlhIGxpYnJhcnkgKG1wMywgd2F2LCBvZ2csIG00YSwgZmxhYyknLFxuXHRlbmFibGVQREZTdXBwb3J0OiAnRW5hYmxlIFBERiBTdXBwb3J0Jyxcblx0ZW5hYmxlUERGU3VwcG9ydERlc2M6ICdTaG93IFBERiBmaWxlcyBpbiBtZWRpYSBsaWJyYXJ5Jyxcblx0dmlld1NldHRpbmdzOiAnVmlldyBTZXR0aW5ncycsXG5cdGludGVyZmFjZUxhbmd1YWdlOiAnSW50ZXJmYWNlIExhbmd1YWdlJyxcblx0bGFuZ3VhZ2VEZXNjOiAnQ2hvb3NlIGxhbmd1YWdlIGZvciBwbHVnaW4gaW50ZXJmYWNlJyxcblx0bGFuZ3VhZ2VTeXN0ZW06ICdGb2xsb3cgU3lzdGVtJyxcblx0cGFnZVNpemU6ICdQYWdlIFNpemUnLFxuXHRwYWdlU2l6ZURlc2M6ICdOdW1iZXIgb2YgZmlsZXMgcGVyIHBhZ2UgaW4gbWVkaWEgbGlicmFyeScsXG5cdFx0ZW5hYmxlUHJldmlld01vZGFsOiAnRW5hYmxlIFByZXZpZXcgTW9kYWwnLFxuXHRcdGVuYWJsZVByZXZpZXdNb2RhbERlc2M6ICdPcGVuIHByZXZpZXcgd2luZG93IHdoZW4gY2xpY2tpbmcgbWVkaWEgZmlsZXMnLFxuXHRcdGVuYWJsZUtleWJvYXJkTmF2OiAnRW5hYmxlIEtleWJvYXJkIE5hdmlnYXRpb24nLFxuXHRcdGVuYWJsZUtleWJvYXJkTmF2RGVzYzogJ1VzZSBhcnJvdyBrZXlzIHRvIG5hdmlnYXRlIGluIHByZXZpZXcgd2luZG93Jyxcblx0XHRzYWZlU2NhblNldHRpbmdzOiAnU2FmZSBTY2FuJyxcblx0XHRzYWZlU2NhbkVuYWJsZWREZXNjOiAnRW5hYmxlIGNvbmRpdGlvbmFsIHNjYW5uaW5nIGZyb20gdHJhc2ggbWFuYWdlbWVudCB2aWV3Jyxcblx0XHRzYWZlU2NhblVucmVmRGF5czogJ1VucmVmZXJlbmNlZCBEYXlzJyxcblx0XHRzYWZlU2NhblVucmVmRGF5c0Rlc2M6ICdPbmx5IHNjYW4gbWVkaWEgZmlsZXMgdW5yZWZlcmVuY2VkIGZvciBhdCBsZWFzdCB0aGlzIG1hbnkgZGF5cycsXG5cdFx0c2FmZVNjYW5NaW5TaXplOiAnTWluaW11bSBGaWxlIFNpemUgKE1CKScsXG5cdFx0c2FmZVNjYW5NaW5TaXplRGVzYzogJ09ubHkgc2NhbiBtZWRpYSBmaWxlcyBhdCBvciBhYm92ZSB0aGlzIHNpemUnLFxuXHRcdGR1cGxpY2F0ZURldGVjdGlvblNldHRpbmdzOiAnRHVwbGljYXRlIERldGVjdGlvbicsXG5cdFx0ZHVwbGljYXRlVGhyZXNob2xkU2V0dGluZzogJ1NpbWlsYXJpdHkgVGhyZXNob2xkJyxcblx0XHRkdXBsaWNhdGVUaHJlc2hvbGREZXNjOiAnT25seSBncm91cHMgYXQgb3IgYWJvdmUgdGhpcyBwZXJjZW50YWdlIGFyZSB0cmVhdGVkIGFzIGR1cGxpY2F0ZXMnLFxuXHRcdGtleWJvYXJkU2hvcnRjdXRzOiAnS2V5Ym9hcmQgU2hvcnRjdXRzJyxcblx0XHRzaG9ydGN1dHNEZXNjOiAnUGx1Z2luIGtleWJvYXJkIHNob3J0Y3V0czonLFxuXHRcdHNob3J0Y3V0T3BlbkxpYnJhcnk6ICdDdHJsK1NoaWZ0K00gLSBPcGVuIE1lZGlhIExpYnJhcnknLFxuXHRzaG9ydGN1dEZpbmRVbnJlZmVyZW5jZWQ6ICdDdHJsK1NoaWZ0K1UgLSBGaW5kIFVucmVmZXJlbmNlZCBNZWRpYScsXG5cdHNob3J0Y3V0T3BlblRyYXNoOiAnQ3RybCtTaGlmdCtUIC0gT3BlbiBUcmFzaCBNYW5hZ2VtZW50Jyxcblx0Y29tbWFuZHM6ICdDb21tYW5kcycsXG5cdGNvbW1hbmRzRGVzYzogJ1VzZSB0aGVzZSBjb21tYW5kcyBpbiBjb21tYW5kIHBhbGV0dGU6Jyxcblx0Y21kT3BlbkxpYnJhcnk6ICdNZWRpYSBMaWJyYXJ5IC0gT3BlbiBtZWRpYSBsaWJyYXJ5IHZpZXcnLFxuXHRjbWRGaW5kVW5yZWZlcmVuY2VkOiAnRmluZCBVbnJlZmVyZW5jZWQgTWVkaWEgLSBGaW5kIG1lZGlhIGZpbGVzIG5vdCByZWZlcmVuY2VkIGJ5IGFueSBub3RlcycsXG5cdGNtZFRyYXNoTWFuYWdlbWVudDogJ1RyYXNoIE1hbmFnZW1lbnQgLSBNYW5hZ2UgZGVsZXRlZCBmaWxlcycsXG5cdGNtZEFsaWduTGVmdDogJ0FsaWduIEltYWdlIExlZnQgLSBBbGlnbiBzZWxlY3RlZCBpbWFnZSB0byBsZWZ0Jyxcblx0Y21kQWxpZ25DZW50ZXI6ICdBbGlnbiBJbWFnZSBDZW50ZXIgLSBDZW50ZXIgYWxpZ24gc2VsZWN0ZWQgaW1hZ2UnLFxuXHRjbWRBbGlnblJpZ2h0OiAnQWxpZ24gSW1hZ2UgUmlnaHQgLSBBbGlnbiBzZWxlY3RlZCBpbWFnZSB0byByaWdodCcsXG5cblx0Ly8gVHJhc2ggTWFuYWdlbWVudCBWaWV3XG5cdGxvYWRpbmdUcmFzaEZpbGVzOiAnTG9hZGluZyB0cmFzaCBmaWxlcy4uLicsXG5cdHRyYXNoRm9sZGVyRW1wdHk6ICdUcmFzaCBmb2xkZXIgaXMgZW1wdHknLFxuXHRmaWxlc0luVHJhc2g6ICd7Y291bnR9IGZpbGVzIGluIHRyYXNoIGZvbGRlcicsXG5cdHRvdGFsU2l6ZTogJ1RvdGFsOiB7c2l6ZX0nLFxuXHR0cmFzaE1hbmFnZW1lbnREZXNjOiAnRGVsZXRlZCBmaWxlcyBhcmUgdGVtcG9yYXJpbHkgc3RvcmVkIGhlcmUuIFlvdSBjYW4gcmVzdG9yZSBvciBwZXJtYW5lbnRseSBkZWxldGUgdGhlbS4nLFxuXHRyZWZyZXNoOiAnUmVmcmVzaCcsXG5cdGNsZWFyVHJhc2g6ICdFbXB0eSBUcmFzaCcsXG5cdGNsZWFyVHJhc2hUb29sdGlwOiAnRW1wdHkgdHJhc2ggZm9sZGVyJyxcblx0cmVzdG9yZVRvb2x0aXA6ICdSZXN0b3JlIGZpbGUnLFxuXHRwZXJtYW5lbnREZWxldGU6ICdEZWxldGUnLFxuXHRwZXJtYW5lbnREZWxldGVUb29sdGlwOiAnUGVybWFuZW50bHkgZGVsZXRlJyxcblx0ZGVsZXRlZFRpbWU6ICdEZWxldGVkIGF0Jyxcblx0Y29uZmlybURlbGV0ZUZpbGU6ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gcGVybWFuZW50bHkgZGVsZXRlIFwie25hbWV9XCI/IFRoaXMgY2Fubm90IGJlIHVuZG9uZS4nLFxuXHRjb25maXJtQ2xlYXJUcmFzaDogJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBlbXB0eSB0aGUgdHJhc2ggZm9sZGVyPyB7Y291bnR9IGZpbGVzIHdpbGwgYmUgcGVybWFuZW50bHkgZGVsZXRlZC4gVGhpcyBjYW5ub3QgYmUgdW5kb25lLicsXG5cdGZpbGVEZWxldGVkOiAnUGVybWFuZW50bHkgZGVsZXRlZDoge25hbWV9Jyxcblx0cmVzdG9yZVN1Y2Nlc3M6ICdSZXN0b3JlZDoge25hbWV9Jyxcblx0cmVzdG9yZUZhaWxlZDogJ1Jlc3RvcmUgZmFpbGVkOiB7bWVzc2FnZX0nLFxuXHR0YXJnZXRGaWxlRXhpc3RzOiAnVGFyZ2V0IGZpbGUgYWxyZWFkeSBleGlzdHMnLFxuXHRkZWxldGVGYWlsZWQ6ICdEZWxldGUgZmFpbGVkJyxcblx0ZmlsZU5hbWVDb3BpZWQ6ICdGaWxlIG5hbWUgY29waWVkJyxcblx0b3JpZ2luYWxQYXRoQ29waWVkOiAnT3JpZ2luYWwgcGF0aCBjb3BpZWQnLFxuXG5cdC8vIFVucmVmZXJlbmNlZCBJbWFnZXMgVmlld1xuXHRzY2FubmluZ1VucmVmZXJlbmNlZDogJ1NjYW5uaW5nIHVucmVmZXJlbmNlZCBtZWRpYSBmaWxlcy4uLicsXG5cdHRvdGFsU2l6ZUxhYmVsOiAnVG90YWw6IHtzaXplfScsXG5cdHNjYW5FcnJvcjogJ0Vycm9yIHNjYW5uaW5nIGltYWdlcycsXG5cdHVucmVmZXJlbmNlZERlc2M6ICdUaGVzZSBtZWRpYSBmaWxlcyBhcmUgbm90IHJlZmVyZW5jZWQgYnkgYW55IG5vdGVzIGFuZCBjYW4gYmUgZGVsZXRlZCB0byBmcmVlIHVwIHNwYWNlJyxcblx0bm9GaWxlc1RvRGVsZXRlOiAnTm8gZmlsZXMgdG8gZGVsZXRlJyxcblx0cHJvY2Vzc2VkRmlsZXM6ICdQcm9jZXNzZWQge2NvdW50fSBmaWxlcycsXG5cdHByb2Nlc3NlZEZpbGVzRXJyb3I6ICdFcnJvciBwcm9jZXNzaW5nIHtlcnJvcnN9IGZpbGVzJyxcblx0Y29weUFsbFBhdGhzOiAnQ29weSBhbGwgcGF0aHMnLFxuXHRjb3BpZWRGaWxlUGF0aHM6ICdDb3BpZWQge2NvdW50fSBmaWxlIHBhdGhzJyxcblxuXHQvLyBJbWFnZSBMaWJyYXJ5IFZpZXdcblx0bm9NYXRjaGluZ0ZpbGVzOiAnTm8gbWF0Y2hpbmcgZmlsZXMnLFxuXHRwcmV2UGFnZTogJ1ByZXZpb3VzJyxcblx0bmV4dFBhZ2U6ICdOZXh0Jyxcblx0cGFnZUluZm86ICdQYWdlIHtjdXJyZW50fSAvIHt0b3RhbH0nLFxuXHRzZWxlY3RGaWxlczogJ3tjb3VudH0gZmlsZXMgc2VsZWN0ZWQnLFxuXHRzZWxlY3RBbGw6ICdTZWxlY3QgQWxsJyxcblx0ZGVzZWxlY3RBbGw6ICdEZXNlbGVjdCBBbGwnLFxuXHRjb25maXJtRGVsZXRlU2VsZWN0ZWQ6ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHtjb3VudH0gc2VsZWN0ZWQgZmlsZXM/Jyxcblx0ZGVsZXRlZEZpbGVzOiAne2NvdW50fSBmaWxlcyBkZWxldGVkJyxcblx0ZGVsZXRlRmlsZXNGYWlsZWQ6ICdGYWlsZWQgdG8gZGVsZXRlIHtjb3VudH0gZmlsZXMnLFxuXHRtdWx0aVNlbGVjdE1vZGU6ICdNdWx0aS1zZWxlY3QgbW9kZScsXG5cblx0Ly8gTWVkaWEgUHJldmlld1xuXHR1bnN1cHBvcnRlZEZpbGVUeXBlOiAnUHJldmlldyBub3Qgc3VwcG9ydGVkIGZvciB0aGlzIGZpbGUgdHlwZScsXG5cdGNvcHlQYXRoQnRuOiAnQ29weSBQYXRoJyxcblx0Y29weUxpbmtCdG46ICdDb3B5IExpbmsnLFxuXHRmaW5kSW5Ob3RlczogJ0ZpbmQgaW4gTm90ZXMnLFxuXHRwYXRoQ29waWVkOiAnUGF0aCBjb3BpZWQnLFxuXHRsaW5rQ29waWVkOiAnTGluayBjb3BpZWQnLFxuXHRpbWFnZUxvYWRFcnJvcjogJ0ltYWdlIGZhaWxlZCB0byBsb2FkJyxcblxuXHQvLyBJbWFnZSBhbGlnbm1lbnRcblx0YWxpZ25JbWFnZUxlZnQ6ICdBbGlnbiBJbWFnZSBMZWZ0Jyxcblx0YWxpZ25JbWFnZUNlbnRlcjogJ0FsaWduIEltYWdlIENlbnRlcicsXG5cdGFsaWduSW1hZ2VSaWdodDogJ0FsaWduIEltYWdlIFJpZ2h0Jyxcblx0c2VsZWN0SW1hZ2VGaXJzdDogJ1BsZWFzZSBzZWxlY3QgYW4gaW1hZ2UgZmlyc3QnLFxuXHRzZWxlY3RJbWFnZTogJ1BsZWFzZSBzZWxlY3QgYW4gaW1hZ2UnLFxuXHRpbWFnZUFsaWduZWRMZWZ0OiAnSW1hZ2UgYWxpZ25lZCB0byBsZWZ0Jyxcblx0aW1hZ2VBbGlnbmVkQ2VudGVyOiAnSW1hZ2UgY2VudGVyZWQnLFxuXHRpbWFnZUFsaWduZWRSaWdodDogJ0ltYWdlIGFsaWduZWQgdG8gcmlnaHQnLFxuXG5cdC8vIFRyYXNoIGZvbGRlciBvcGVyYXRpb25zXG5cdGNvcGllZEZpbGVOYW1lOiAnRmlsZSBuYW1lIGNvcGllZCcsXG5cdGNvcGllZE9yaWdpbmFsUGF0aDogJ09yaWdpbmFsIHBhdGggY29waWVkJyxcblx0bm90UmVmZXJlbmNlZDogJ1RoaXMgaW1hZ2UgaXMgbm90IHJlZmVyZW5jZWQgYnkgYW55IG5vdGVzJyxcblx0bW92ZWRUb1RyYXNoOiAnTW92ZWQgdG8gdHJhc2ggZm9sZGVyOiB7bmFtZX0nLFxuXHRkZWxldGVkRmlsZTogJ0RlbGV0ZWQ6IHtuYW1lfScsXG5cdHJlc3RvcmVkRmlsZTogJ0ZpbGUgcmVzdG9yZWQnLFxuXG5cdC8vIENvbW1hbmQgbmFtZXNcblx0Y21kSW1hZ2VMaWJyYXJ5OiAnSW1hZ2UgTGlicmFyeScsXG5cdGNtZEZpbmRVbnJlZmVyZW5jZWRJbWFnZXM6ICdGaW5kIFVucmVmZXJlbmNlZCBJbWFnZXMnLFxuXHRjbWRSZWZyZXNoQ2FjaGU6ICdSZWZyZXNoIE1lZGlhIFJlZmVyZW5jZSBDYWNoZScsXG5cdGNtZEFsaWduSW1hZ2VMZWZ0OiAnQWxpZ24gSW1hZ2UgTGVmdCcsXG5cdGNtZEFsaWduSW1hZ2VDZW50ZXI6ICdBbGlnbiBJbWFnZSBDZW50ZXInLFxuXHRjbWRBbGlnbkltYWdlUmlnaHQ6ICdBbGlnbiBJbWFnZSBSaWdodCcsXG5cdGNtZE9wZW5NZWRpYUxpYnJhcnk6ICdPcGVuIE1lZGlhIExpYnJhcnknLFxuXHRjbWRGaW5kVW5yZWZlcmVuY2VkTWVkaWE6ICdGaW5kIFVucmVmZXJlbmNlZCBNZWRpYScsXG5cdGNtZE9wZW5UcmFzaE1hbmFnZW1lbnQ6ICdPcGVuIFRyYXNoIE1hbmFnZW1lbnQnLFxuXG5cdC8vIERlbGV0ZSBvcGVyYXRpb25zXG5cdGRlbGV0ZUZhaWxlZFdpdGhOYW1lOiAnRGVsZXRlIGZhaWxlZDoge25hbWV9Jyxcblx0ZGVsZXRlZFdpdGhRdWFyYW50aW5lRmFpbGVkOiAnRGVsZXRlZDoge25hbWV9IChxdWFyYW50aW5lIGZhaWxlZCknLFxuXHRvcGVyYXRpb25GYWlsZWQ6ICdPcGVyYXRpb24gZmFpbGVkOiB7bmFtZX0nLFxuXHRwcm9jZXNzaW5nOiAnUHJvY2Vzc2luZy4uLicsXG5cblx0Ly8gdjIuMCBuZXdcblx0ZHVwbGljYXRlRGV0ZWN0aW9uOiAnRHVwbGljYXRlIERldGVjdGlvbicsXG5cdGR1cGxpY2F0ZURldGVjdGlvbkRlc2M6ICdEZXRlY3QgcGl4ZWwtbGV2ZWwgZHVwbGljYXRlIGltYWdlcyB1c2luZyBwZXJjZXB0dWFsIGhhc2hpbmcgYWxnb3JpdGhtJyxcblx0bm9EdXBsaWNhdGVzRm91bmQ6ICdObyBkdXBsaWNhdGVzIGZvdW5kLiBDbGljayBcIlN0YXJ0IFNjYW5cIiB0byBkZXRlY3QuJyxcblx0c3RhcnRTY2FuOiAnU3RhcnQgU2NhbicsXG5cdHNjYW5Qcm9ncmVzczogJ1NjYW5uaW5nOiB7Y3VycmVudH0ve3RvdGFsfScsXG5cdHNpbWlsYXJpdHlUaHJlc2hvbGQ6ICdTaW1pbGFyaXR5IHRocmVzaG9sZDoge3ZhbHVlfSUnLFxuXHRkdXBsaWNhdGVHcm91cHNGb3VuZDogJ0ZvdW5kIHtncm91cHN9IGdyb3VwKHMpLCB7ZmlsZXN9IHJlZHVuZGFudCBmaWxlKHMpJyxcblx0ZHVwbGljYXRlR3JvdXA6ICdHcm91cCAje2luZGV4fScsXG5cdGZpbGVzOiAnZmlsZXMnLFxuXHRzdWdnZXN0S2VlcDogJ1x1MjcwNSBLZWVwJyxcblx0cXVhcmFudGluZTogJ1F1YXJhbnRpbmUnLFxuXHRxdWFyYW50aW5lQWxsRHVwbGljYXRlczogJ1F1YXJhbnRpbmUgQWxsIER1cGxpY2F0ZXMnLFxuXHRkdXBsaWNhdGVzRm91bmQ6ICdGb3VuZCB7Z3JvdXBzfSBncm91cChzKSwge2ZpbGVzfSByZWR1bmRhbnQgZmlsZShzKScsXG5cdGR1cGxpY2F0ZXNRdWFyYW50aW5lZDogJ1F1YXJhbnRpbmVkIHtjb3VudH0gZHVwbGljYXRlIGZpbGUocyknLFxuXHR0eXBlRGlzdHJpYnV0aW9uOiAnVHlwZSBEaXN0cmlidXRpb24nLFxuXHR1bnJlZmVyZW5jZWRSYXRlOiAnVW5yZWZlcmVuY2VkIFJhdGUnLFxuXHRyZWZlcmVuY2VkQnk6ICdSZWZlcmVuY2VkIGJ5IHtjb3VudH0gbm90ZShzKScsXG5cdHNlbGVjdGVkQ291bnQ6ICd7Y291bnR9IHNlbGVjdGVkJyxcblx0YmF0Y2hSZXN0b3JlOiAnQmF0Y2ggUmVzdG9yZScsXG5cdGJhdGNoRGVsZXRlOiAnQmF0Y2ggRGVsZXRlJyxcblx0bm9JdGVtc1NlbGVjdGVkOiAnUGxlYXNlIHNlbGVjdCBmaWxlcyBmaXJzdCcsXG5cdGNvbmZpcm1CYXRjaFJlc3RvcmU6ICdSZXN0b3JlIHtjb3VudH0gZmlsZShzKT8nLFxuXHRiYXRjaFJlc3RvcmVDb21wbGV0ZWQ6ICdSZXN0b3JlZCB7Y291bnR9IGZpbGUocyknLFxuXHRzYWZlU2NhbjogJ1NhZmUgU2NhbicsXG5cdHNhZmVTY2FuRGVzYzogJ0F1dG8tZGV0ZWN0IHVucmVmZXJlbmNlZCwgb2xkLCBhbmQgbGFyZ2UgbWVkaWEgZmlsZXMnLFxuXHRzYWZlU2NhblN0YXJ0ZWQ6ICdTdGFydGluZyBzYWZlIHNjYW4uLi4nLFxuXHRzYWZlU2Nhbk5vUmVzdWx0czogJ05vIGZpbGVzIG1hdGNoIHRoZSBjcml0ZXJpYScsXG5cdHNhZmVTY2FuQ29uZmlybTogJ0ZvdW5kIHtjb3VudH0gZmlsZShzKSBtYXRjaGluZyBjcml0ZXJpYSAodW5yZWZlcmVuY2VkID57ZGF5c30gZGF5cyArIHNpemUgPntzaXplfSkuIFNlbmQgdG8gcXVhcmFudGluZT8nLFxuXHRzYWZlU2NhbkNvbXBsZXRlOiAnU2FmZSBzY2FuIGNvbXBsZXRlLCBxdWFyYW50aW5lZCB7Y291bnR9IGZpbGUocyknLFxuXHRzYWZlU2NhbkZhaWxlZDogJ1NhZmUgc2NhbiBmYWlsZWQnLFxuXHRjbWREdXBsaWNhdGVEZXRlY3Rpb246ICdPcGVuIER1cGxpY2F0ZSBEZXRlY3Rpb24nLFxuXHRvcmdhbml6aW5nOiAnT3JnYW5pemluZycsXG5cdG9yZ2FuaXplQ29tcGxldGU6ICdPcmdhbml6ZWQge2NvdW50fSBmaWxlKHMpJ1xufTtcblxuY29uc3QgdHJhbnNsYXRpb25zOiBSZWNvcmQ8TGFuZ3VhZ2UsIFRyYW5zbGF0aW9ucz4gPSB7IHpoLCBlbiB9O1xuXG4vKipcbiAqIFx1ODNCN1x1NTNENlx1N0ZGQlx1OEJEMVxuICovXG5leHBvcnQgZnVuY3Rpb24gdChsYW5nOiBMYW5ndWFnZSwga2V5OiBrZXlvZiBUcmFuc2xhdGlvbnMsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj4pOiBzdHJpbmcge1xuXHRsZXQgdGV4dCA9ICh0cmFuc2xhdGlvbnNbbGFuZ10gPz8gdHJhbnNsYXRpb25zWyd6aCddKVtrZXldIHx8IHRyYW5zbGF0aW9uc1snemgnXVtrZXldIHx8IGtleTtcblxuXHRpZiAocGFyYW1zKSB7XG5cdFx0T2JqZWN0LmVudHJpZXMocGFyYW1zKS5mb3JFYWNoKChbaywgdl0pID0+IHtcblx0XHRcdHRleHQgPSB0ZXh0LnNwbGl0KGB7JHtrfX1gKS5qb2luKFN0cmluZyh2KSk7XG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuLyoqXG4gKiBcdTgzQjdcdTUzRDZcdTdDRkJcdTdFREZcdThCRURcdThBMDBcdThCQkVcdTdGNkVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN5c3RlbUxhbmd1YWdlKCk6IExhbmd1YWdlIHtcblx0Ly8gXHU2OEMwXHU2N0U1IG5hdmlnYXRvciBcdTY2MkZcdTU0MjZcdTVCNThcdTU3MjhcdUZGMDhcdTk3NUVcdTZENEZcdTg5QzhcdTU2NjhcdTczQUZcdTU4ODNcdTUzRUZcdTgwRkRcdTRFMERcdTVCNThcdTU3MjhcdUZGMDlcblx0Y29uc3QgbmF2TGFuZ3VhZ2UgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyA/IG5hdmlnYXRvci5sYW5ndWFnZSA6IG51bGw7XG5cdGNvbnN0IGxhbmcgPSBuYXZMYW5ndWFnZSA/IG5hdkxhbmd1YWdlLnRvTG93ZXJDYXNlKCkgOiAnemgnO1xuXHRpZiAobGFuZy5zdGFydHNXaXRoKCd6aCcpKSByZXR1cm4gJ3poJztcblx0cmV0dXJuICdlbic7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHsgdCwgZ2V0U3lzdGVtTGFuZ3VhZ2UsIHpoLCBlbiB9O1xuIiwgIi8qKlxuICogXHU1ODlFXHU5MUNGXHU2NTg3XHU0RUY2XHU2MjZCXHU2M0NGICsgXHU2NTg3XHU0RUY2XHU3NkQxXHU4OUM2XHU1NjY4XG4gKiBcdTdFRjRcdTYyQTRcdTUxODVcdTVCNThcdTRFMkRcdTc2ODRcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTdEMjJcdTVGMTVcdUZGMENcdTkwN0ZcdTUxNERcdTZCQ0ZcdTZCMjFcdTg5QzZcdTU2RkVcdTUyMzdcdTY1QjBcdTUxNjhcdTkxQ0ZcdTkwNERcdTUzODYgVmF1bHRcbiAqL1xuXG5pbXBvcnQgeyBURmlsZSwgVEFic3RyYWN0RmlsZSwgVmF1bHQsIEV2ZW50cyB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IGlzTWVkaWFGaWxlIH0gZnJvbSAnLi9tZWRpYVR5cGVzJztcbmltcG9ydCB7IFRodW1ibmFpbENhY2hlIH0gZnJvbSAnLi90aHVtYm5haWxDYWNoZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmlsZUVudHJ5IHtcblx0cGF0aDogc3RyaW5nO1xuXHRuYW1lOiBzdHJpbmc7XG5cdHNpemU6IG51bWJlcjtcblx0bXRpbWU6IG51bWJlcjtcblx0ZXh0ZW5zaW9uOiBzdHJpbmc7XG59XG5cbnR5cGUgQ2hhbmdlVHlwZSA9ICdjcmVhdGUnIHwgJ21vZGlmeScgfCAnZGVsZXRlJyB8ICdyZW5hbWUnO1xudHlwZSBDaGFuZ2VMaXN0ZW5lciA9ICh0eXBlOiBDaGFuZ2VUeXBlLCBlbnRyeTogRmlsZUVudHJ5LCBvbGRQYXRoPzogc3RyaW5nKSA9PiB2b2lkO1xuXG5leHBvcnQgY2xhc3MgTWVkaWFGaWxlSW5kZXgge1xuXHRwcml2YXRlIGluZGV4OiBNYXA8c3RyaW5nLCBGaWxlRW50cnk+ID0gbmV3IE1hcCgpO1xuXHRwcml2YXRlIHZhdWx0OiBWYXVsdDtcblx0cHJpdmF0ZSB0aHVtYm5haWxDYWNoZTogVGh1bWJuYWlsQ2FjaGUgfCBudWxsO1xuXHRwcml2YXRlIGxpc3RlbmVyczogQ2hhbmdlTGlzdGVuZXJbXSA9IFtdO1xuXHRwcml2YXRlIGVuYWJsZWRFeHRlbnNpb25zOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcblx0cHJpdmF0ZSB0cmFzaEZvbGRlcjogc3RyaW5nID0gJyc7XG5cdHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuXHRjb25zdHJ1Y3Rvcih2YXVsdDogVmF1bHQsIHRodW1ibmFpbENhY2hlOiBUaHVtYm5haWxDYWNoZSB8IG51bGwgPSBudWxsKSB7XG5cdFx0dGhpcy52YXVsdCA9IHZhdWx0O1xuXHRcdHRoaXMudGh1bWJuYWlsQ2FjaGUgPSB0aHVtYm5haWxDYWNoZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTY2RjRcdTY1QjBcdTU0MkZcdTc1MjhcdTc2ODRcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdThCQkVcdTdGNkVcdTUzRDhcdTY2RjRcdTY1RjZcdThDMDNcdTc1MjhcdUZGMDlcblx0ICovXG5cdHNldEVuYWJsZWRFeHRlbnNpb25zKGV4dGVuc2lvbnM6IHN0cmluZ1tdKTogdm9pZCB7XG5cdFx0dGhpcy5lbmFibGVkRXh0ZW5zaW9ucyA9IG5ldyBTZXQoZXh0ZW5zaW9ucy5tYXAoZSA9PiBlLnRvTG93ZXJDYXNlKCkpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdThCQkVcdTdGNkVcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdThERUZcdTVGODRcdUZGMDhcdTYzOTJcdTk2NjRcdThCRTVcdTY1ODdcdTRFRjZcdTU5MzlcdTUxODVcdTc2ODRcdTY1ODdcdTRFRjZcdUZGMDlcblx0ICovXG5cdHNldFRyYXNoRm9sZGVyKHBhdGg6IHN0cmluZyk6IHZvaWQge1xuXHRcdHRoaXMudHJhc2hGb2xkZXIgPSBwYXRoO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTIyNFx1NjVBRFx1NjU4N1x1NEVGNlx1NjYyRlx1NTQyNlx1NTcyOFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFxuXHQgKi9cblx0cHJpdmF0ZSBpc0luVHJhc2hGb2xkZXIoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRcdGlmICghdGhpcy50cmFzaEZvbGRlcikgcmV0dXJuIGZhbHNlO1xuXHRcdHJldHVybiBmaWxlUGF0aC5zdGFydHNXaXRoKHRoaXMudHJhc2hGb2xkZXIgKyAnLycpIHx8IGZpbGVQYXRoID09PSB0aGlzLnRyYXNoRm9sZGVyO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTIyNFx1NjVBRFx1NjU4N1x1NEVGNlx1NjYyRlx1NTQyNlx1NUU5NFx1OEJFNVx1ODhBQlx1N0QyMlx1NUYxNVxuXHQgKi9cblx0cHJpdmF0ZSBzaG91bGRJbmRleChmaWxlOiBUQWJzdHJhY3RGaWxlKTogYm9vbGVhbiB7XG5cdFx0aWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuIGZhbHNlO1xuXHRcdGlmICh0aGlzLmlzSW5UcmFzaEZvbGRlcihmaWxlLnBhdGgpKSByZXR1cm4gZmFsc2U7XG5cblx0XHRjb25zdCBleHQgPSAnLicgKyBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICh0aGlzLmVuYWJsZWRFeHRlbnNpb25zLnNpemUgPiAwKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lbmFibGVkRXh0ZW5zaW9ucy5oYXMoZXh0KTtcblx0XHR9XG5cdFx0cmV0dXJuIGlzTWVkaWFGaWxlKGZpbGUubmFtZSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU0RUNFIFRGaWxlIFx1NTIxQlx1NUVGQSBGaWxlRW50cnlcblx0ICovXG5cdHByaXZhdGUgdG9FbnRyeShmaWxlOiBURmlsZSk6IEZpbGVFbnRyeSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHBhdGg6IGZpbGUucGF0aCxcblx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdHNpemU6IGZpbGUuc3RhdC5zaXplLFxuXHRcdFx0bXRpbWU6IGZpbGUuc3RhdC5tdGltZSxcblx0XHRcdGV4dGVuc2lvbjogZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKVxuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogXHU5OTk2XHU2QjIxXHU1MTY4XHU5MUNGXHU2MjZCXHU2M0NGXHVGRjBDXHU1RUZBXHU3QUNCXHU3RDIyXHU1RjE1XG5cdCAqL1xuXHRhc3luYyBmdWxsU2NhbigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmluZGV4LmNsZWFyKCk7XG5cblx0XHRjb25zdCBhbGxGaWxlcyA9IHRoaXMudmF1bHQuZ2V0RmlsZXMoKTtcblx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgYWxsRmlsZXMpIHtcblx0XHRcdGlmICh0aGlzLnNob3VsZEluZGV4KGZpbGUpKSB7XG5cdFx0XHRcdHRoaXMuaW5kZXguc2V0KGZpbGUucGF0aCwgdGhpcy50b0VudHJ5KGZpbGUpKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTY1ODdcdTRFRjZcdTUzRDhcdTUzMTZcdTRFOEJcdTRFRjZcdTU5MDRcdTc0MDZcdTU2NjhcdUZGMDhcdTc1MzEgVmF1bHQgXHU0RThCXHU0RUY2XHU1NkRFXHU4QzAzXHU4QzAzXHU3NTI4XHVGRjA5XG5cdCAqL1xuXHRvbkZpbGVDcmVhdGVkKGZpbGU6IFRBYnN0cmFjdEZpbGUpOiB2b2lkIHtcblx0XHRpZiAoIXRoaXMuc2hvdWxkSW5kZXgoZmlsZSkpIHJldHVybjtcblx0XHRjb25zdCBlbnRyeSA9IHRoaXMudG9FbnRyeShmaWxlIGFzIFRGaWxlKTtcblx0XHR0aGlzLmluZGV4LnNldChlbnRyeS5wYXRoLCBlbnRyeSk7XG5cdFx0dGhpcy5ub3RpZnlMaXN0ZW5lcnMoJ2NyZWF0ZScsIGVudHJ5KTtcblx0fVxuXG5cdG9uRmlsZU1vZGlmaWVkKGZpbGU6IFRBYnN0cmFjdEZpbGUpOiB2b2lkIHtcblx0XHRpZiAoIXRoaXMuc2hvdWxkSW5kZXgoZmlsZSkpIHJldHVybjtcblx0XHRjb25zdCBlbnRyeSA9IHRoaXMudG9FbnRyeShmaWxlIGFzIFRGaWxlKTtcblx0XHR0aGlzLmluZGV4LnNldChlbnRyeS5wYXRoLCBlbnRyeSk7XG5cdFx0dGhpcy5ub3RpZnlMaXN0ZW5lcnMoJ21vZGlmeScsIGVudHJ5KTtcblx0fVxuXG5cdG9uRmlsZURlbGV0ZWQoZmlsZTogVEFic3RyYWN0RmlsZSk6IHZvaWQge1xuXHRcdGNvbnN0IHBhdGggPSBmaWxlLnBhdGg7XG5cdFx0Y29uc3QgZXhpc3RpbmcgPSB0aGlzLmluZGV4LmdldChwYXRoKTtcblx0XHRpZiAoIWV4aXN0aW5nKSByZXR1cm47XG5cblx0XHR0aGlzLmluZGV4LmRlbGV0ZShwYXRoKTtcblxuXHRcdC8vIFx1NkUwNVx1NzQwNlx1N0YyOVx1NzU2NVx1NTZGRVx1N0YxM1x1NUI1OFxuXHRcdGlmICh0aGlzLnRodW1ibmFpbENhY2hlKSB7XG5cdFx0XHR2b2lkIHRoaXMudGh1bWJuYWlsQ2FjaGUuZGVsZXRlKHBhdGgpO1xuXHRcdH1cblxuXHRcdHRoaXMubm90aWZ5TGlzdGVuZXJzKCdkZWxldGUnLCBleGlzdGluZyk7XG5cdH1cblxuXHRvbkZpbGVSZW5hbWVkKGZpbGU6IFRBYnN0cmFjdEZpbGUsIG9sZFBhdGg6IHN0cmluZyk6IHZvaWQge1xuXHRcdGNvbnN0IG9sZEVudHJ5ID0gdGhpcy5pbmRleC5nZXQob2xkUGF0aCk7XG5cblx0XHQvLyBcdTRFQ0VcdTY1RTdcdThERUZcdTVGODRcdTRFMkRcdTc5RkJcdTk2NjRcblx0XHRpZiAob2xkRW50cnkpIHtcblx0XHRcdHRoaXMuaW5kZXguZGVsZXRlKG9sZFBhdGgpO1xuXHRcdH1cblxuXHRcdC8vIFx1NTk4Mlx1Njc5Q1x1NjVCMFx1OERFRlx1NUY4NFx1NEVDRFx1NzEzNlx1NjYyRlx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1RkYwQ1x1NkRGQlx1NTJBMFx1NTIzMFx1N0QyMlx1NUYxNVxuXHRcdGlmICh0aGlzLnNob3VsZEluZGV4KGZpbGUpKSB7XG5cdFx0XHRjb25zdCBuZXdFbnRyeSA9IHRoaXMudG9FbnRyeShmaWxlIGFzIFRGaWxlKTtcblx0XHRcdHRoaXMuaW5kZXguc2V0KG5ld0VudHJ5LnBhdGgsIG5ld0VudHJ5KTtcblxuXHRcdFx0Ly8gXHU4RkMxXHU3OUZCXHU3RjI5XHU3NTY1XHU1NkZFXHU3RjEzXHU1QjU4XG5cdFx0XHRpZiAodGhpcy50aHVtYm5haWxDYWNoZSkge1xuXHRcdFx0XHR2b2lkIHRoaXMudGh1bWJuYWlsQ2FjaGUucmVuYW1lKG9sZFBhdGgsIG5ld0VudHJ5LnBhdGgpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm5vdGlmeUxpc3RlbmVycygncmVuYW1lJywgbmV3RW50cnksIG9sZFBhdGgpO1xuXHRcdH0gZWxzZSBpZiAob2xkRW50cnkpIHtcblx0XHRcdC8vIFx1NjU4N1x1NEVGNlx1NEVDRVx1NUE5Mlx1NEY1M1x1NTNEOFx1NEUzQVx1OTc1RVx1NUE5Mlx1NEY1M1x1RkYwOFx1NEY4Qlx1NTk4Mlx1OTFDRFx1NTQ3RFx1NTQwRFx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwOVxuXHRcdFx0aWYgKHRoaXMudGh1bWJuYWlsQ2FjaGUpIHtcblx0XHRcdFx0dm9pZCB0aGlzLnRodW1ibmFpbENhY2hlLmRlbGV0ZShvbGRQYXRoKTtcblx0XHRcdH1cblx0XHRcdHRoaXMubm90aWZ5TGlzdGVuZXJzKCdkZWxldGUnLCBvbGRFbnRyeSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1ODNCN1x1NTNENlx1NUY1M1x1NTI0RFx1N0QyMlx1NUYxNVx1NzY4NFx1NjI0MFx1NjcwOVx1NjU4N1x1NEVGNlxuXHQgKi9cblx0Z2V0RmlsZXMoKTogRmlsZUVudHJ5W10ge1xuXHRcdHJldHVybiBBcnJheS5mcm9tKHRoaXMuaW5kZXgudmFsdWVzKCkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1ODNCN1x1NTNENlx1NjU4N1x1NEVGNlx1NjU3MFx1OTFDRlxuXHQgKi9cblx0Z2V0IHNpemUoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gdGhpcy5pbmRleC5zaXplO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjYyRlx1NTQyNlx1NURGMlx1NUI4Q1x1NjIxMFx1NTIxRFx1NTlDQlx1NjI2Qlx1NjNDRlxuXHQgKi9cblx0Z2V0IGlzSW5pdGlhbGl6ZWQoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuaW5pdGlhbGl6ZWQ7XG5cdH1cblxuXHQvKipcblx0ICogXHU2MzA5XHU4REVGXHU1Rjg0XHU4M0I3XHU1M0Q2XHU1MzU1XHU0RTJBXHU2NzYxXHU3NkVFXG5cdCAqL1xuXHRnZXRFbnRyeShwYXRoOiBzdHJpbmcpOiBGaWxlRW50cnkgfCB1bmRlZmluZWQge1xuXHRcdHJldHVybiB0aGlzLmluZGV4LmdldChwYXRoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZDRThcdTUxOENcdTUzRDhcdTUzMTZcdTc2RDFcdTU0MkNcdTU2Njhcblx0ICovXG5cdG9uQ2hhbmdlKGxpc3RlbmVyOiBDaGFuZ2VMaXN0ZW5lcik6IHZvaWQge1xuXHRcdHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NzlGQlx1OTY2NFx1NTNEOFx1NTMxNlx1NzZEMVx1NTQyQ1x1NTY2OFxuXHQgKi9cblx0b2ZmQ2hhbmdlKGxpc3RlbmVyOiBDaGFuZ2VMaXN0ZW5lcik6IHZvaWQge1xuXHRcdGNvbnN0IGlkeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuXHRcdGlmIChpZHggPj0gMCkge1xuXHRcdFx0dGhpcy5saXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1OTAxQVx1NzdFNVx1NjI0MFx1NjcwOVx1NzZEMVx1NTQyQ1x1NTY2OFxuXHQgKi9cblx0cHJpdmF0ZSBub3RpZnlMaXN0ZW5lcnModHlwZTogQ2hhbmdlVHlwZSwgZW50cnk6IEZpbGVFbnRyeSwgb2xkUGF0aD86IHN0cmluZyk6IHZvaWQge1xuXHRcdGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGxpc3RlbmVyKHR5cGUsIGVudHJ5LCBvbGRQYXRoKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ01lZGlhRmlsZUluZGV4IGxpc3RlbmVyIGVycm9yOicsIGVycm9yKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTA1XHU5NjY0XHU3RDIyXHU1RjE1XG5cdCAqL1xuXHRjbGVhcigpOiB2b2lkIHtcblx0XHR0aGlzLmluZGV4LmNsZWFyKCk7XG5cdFx0dGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXHR9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxvQkFBb0c7OztBQ0FwRyxzQkFBZ0Y7OztBQ1N6RSxTQUFTLGVBQWUsT0FBdUI7QUFDckQsTUFBSSxDQUFDLE9BQU8sU0FBUyxLQUFLLEtBQUssU0FBUyxFQUFHLFFBQU87QUFDbEQsUUFBTSxJQUFJO0FBQ1YsUUFBTSxRQUFRLENBQUMsS0FBSyxNQUFNLE1BQU0sSUFBSTtBQUNwQyxRQUFNLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLFNBQVMsQ0FBQyxDQUFDO0FBQzNGLFNBQU8sWUFBWSxRQUFRLEtBQUssSUFBSSxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3ZFO0FBUU8sU0FBUyxTQUNmLElBQ0EsT0FDbUM7QUFDbkMsTUFBSSxZQUFrRDtBQUV0RCxTQUFPLElBQUksU0FBd0I7QUFDbEMsUUFBSSxXQUFXO0FBQ2QsbUJBQWEsU0FBUztBQUFBLElBQ3ZCO0FBQ0EsZ0JBQVksV0FBVyxNQUFNO0FBQzVCLFNBQUcsR0FBRyxJQUFJO0FBQUEsSUFDWCxHQUFHLEtBQUs7QUFBQSxFQUNUO0FBQ0Q7OztBQzFCTyxTQUFTLG1CQUFtQixPQUF1QjtBQUN6RCxNQUFJLE9BQU8sVUFBVSxTQUFVLFFBQU87QUFFdEMsTUFBSSxhQUFhLE1BQU0sS0FBSyxFQUFFLFFBQVEsT0FBTyxHQUFHO0FBQ2hELGVBQWEsV0FBVyxRQUFRLFdBQVcsR0FBRztBQUM5QyxlQUFhLFdBQVcsUUFBUSxRQUFRLEVBQUU7QUFFMUMsU0FBTyxXQUFXLFdB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QkFBc0IsR0FBRztBQUNwRDtBQUFBLElBQ0Q7QUFFQSxVQUFNLFVBQVUsU0FBUyxjQUFjLE9BQU87QUFDOUMsWUFBUSxLQUFLO0FBQ2IsWUFBUSxjQUFjO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FB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LEVBQUUsTUFBTSxJQUFJLEtBQUs7QUFFdkIsUUFBSTtBQUNILFlBQU0sTUFBTSxPQUFPLElBQUk7QUFDdkIsVUFBSSx5QkFBTyxLQUFLLEVBQUUsZUFBZSxFQUFFLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQztBQUNyRCxhQUFPO0FBQUEsSUFDUixTQUFTLE9BQU87QUFDZixjQUFRLE1BQU0scURBQWEsS0FBSztBQUNoQyxVQUFJLHlCQUFPLEtBQUssRUFBRSxjQUFjLENBQUM7QUFDakMsYUFBTztBQUFBLElBQ1I7QUFBQSxFQUNEO0FBQ0Q7QUFyakVxQixvQkFFSSxzQkFBc0I7QUFGMUIsb0JBTUksaUJBQWlCLElBQUksS0FBSztBQU5uRCxJQUFxQixxQkFBckI7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgInQiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJsb2FkSW1hZ2UiLCAibG9hZEltYWdlIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgIm5vZGUiLCAiaW1wb3J0X29ic2lkaWFuIl0KfQo=

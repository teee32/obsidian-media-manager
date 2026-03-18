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
var import_obsidian11 = require("obsidian");

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
var DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".pptx", ".doc", ".xls", ".ppt"];
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
  ".pdf": "document",
  ".docx": "document",
  ".xlsx": "document",
  ".pptx": "document",
  ".doc": "document",
  ".xls": "document",
  ".ppt": "document"
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
function getDocumentDisplayLabel(filename) {
  const ext = getFileExtension(filename);
  if (!ext) {
    return "DOC";
  }
  return ext.slice(1).toUpperCase();
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
      this.renderThumbnailFallback(container, "file-text", getDocumentDisplayLabel(file.name));
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
      this.renderThumbnailFallback(container, "file-text", getDocumentDisplayLabel(file.name));
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
    const typeBadge = info.createSpan({
      cls: "item-type-badge",
      text: this.getTypeLabel(item.name)
    });
    typeBadge.style.display = "inline-flex";
    typeBadge.style.alignItems = "center";
    typeBadge.style.width = "fit-content";
    typeBadge.style.padding = "2px 8px";
    typeBadge.style.marginTop = "4px";
    typeBadge.style.borderRadius = "999px";
    typeBadge.style.fontSize = "0.75em";
    typeBadge.style.fontWeight = "600";
    typeBadge.style.letterSpacing = "0.04em";
    typeBadge.style.border = "1px solid var(--background-modifier-border)";
    typeBadge.style.color = "var(--text-muted)";
    typeBadge.style.background = "var(--background-secondary)";
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
      this.renderThumbnailFallback(container, iconName, this.getTypeLabel(item.name));
    }
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
    const icon = fallback.createDiv({ cls: "thumb-icon" });
    (0, import_obsidian4.setIcon)(icon, iconName);
    const text = fallback.createDiv({ text: label });
    text.style.fontSize = "0.72em";
    text.style.fontWeight = "600";
    text.style.letterSpacing = "0.04em";
    text.style.textTransform = "uppercase";
  }
  getTypeLabel(fileName) {
    const mediaType = getMediaType(fileName);
    if (mediaType === "document") {
      return getDocumentDisplayLabel(fileName);
    }
    const dot = fileName.lastIndexOf(".");
    if (dot !== -1 && dot < fileName.length - 1) {
      return fileName.slice(dot + 1).toUpperCase();
    }
    if (mediaType) {
      return mediaType.toUpperCase();
    }
    return "FILE";
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
var import_obsidian6 = require("obsidian");

// utils/perceptualHash.ts
var DEFAULT_IMAGE_LOAD_TIMEOUT = 8e3;
var HASH_BACKGROUND_RGB = 255;
var ALPHA_CONTENT_THRESHOLD = 8;
function analyzeImageData(imageData) {
  const { data, width, height } = imageData;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  let hasTransparency = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < 255) {
        hasTransparency = true;
      }
      if (alpha <= ALPHA_CONTENT_THRESHOLD) continue;
      if (x < left) left = x;
      if (y < top) top = y;
      if (x > right) right = x;
      if (y > bottom) bottom = y;
    }
  }
  if (right < left || bottom < top) {
    return {
      bounds: { left: 0, top: 0, width, height },
      hasTransparency
    };
  }
  return {
    bounds: {
      left,
      top,
      width: right - left + 1,
      height: bottom - top + 1
    },
    hasTransparency
  };
}
function captureSourceBitmap(img) {
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = img.naturalWidth || img.width;
  sourceCanvas.height = img.naturalHeight || img.height;
  const sourceCtx = sourceCanvas.getContext("2d");
  sourceCtx.drawImage(img, 0, 0);
  const sourceImageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const { bounds, hasTransparency } = analyzeImageData(sourceImageData);
  return {
    canvas: sourceCanvas,
    imageData: sourceImageData,
    bounds,
    hasTransparency
  };
}
function getGrayscaleData(source, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `rgb(${HASH_BACKGROUND_RGB}, ${HASH_BACKGROUND_RGB}, ${HASH_BACKGROUND_RGB})`;
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(
    source.canvas,
    source.bounds.left,
    source.bounds.top,
    source.bounds.width,
    source.bounds.height,
    0,
    0,
    width,
    height
  );
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
function computePHash(source) {
  const SIZE = 32;
  const LOW_FREQ = 8;
  const gray = getGrayscaleData(source, SIZE, SIZE);
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
function computeDHash(source) {
  const gray = getGrayscaleData(source, 9, 8);
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
function computeAlphaMaskHash(source) {
  const SIZE = 16;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.drawImage(
    source.canvas,
    source.bounds.left,
    source.bounds.top,
    source.bounds.width,
    source.bounds.height,
    0,
    0,
    SIZE,
    SIZE
  );
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
  let binary = "";
  for (let i = 0; i < data.length; i += 4) {
    binary += data[i + 3] > ALPHA_CONTENT_THRESHOLD ? "1" : "0";
  }
  return binaryToHex(binary);
}
function computeQuantizedColorHash(source) {
  const { data } = source.imageData;
  let visiblePixels = 0;
  let rTotal = 0;
  let gTotal = 0;
  let bTotal = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha <= ALPHA_CONTENT_THRESHOLD) continue;
    rTotal += data[i];
    gTotal += data[i + 1];
    bTotal += data[i + 2];
    visiblePixels++;
  }
  if (visiblePixels === 0) {
    return "000";
  }
  const quantize = (value) => {
    const bucket = Math.max(0, Math.min(15, Math.round(value / 17)));
    return bucket.toString(16);
  };
  return [
    quantize(rTotal / visiblePixels),
    quantize(gTotal / visiblePixels),
    quantize(bTotal / visiblePixels)
  ].join("");
}
async function computePerceptualHash(imageSrc) {
  const img = await loadImage2(imageSrc);
  const source = captureSourceBitmap(img);
  if (source.hasTransparency) {
    return {
      mode: "transparent",
      hashes: [
        computeAlphaMaskHash(source),
        computeQuantizedColorHash(source)
      ]
    };
  }
  return {
    mode: "opaque",
    hashes: [
      computePHash(source),
      computeDHash(source)
    ]
  };
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
    if (/^https?:\/\//i.test(src)) {
      img.crossOrigin = "anonymous";
    }
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
function hashSegmentSimilarity(h1, h2) {
  const totalBits = h1.length * 4;
  const distance = hammingDistance(h1, h2);
  return Math.round((1 - distance / totalBits) * 100);
}
function hashSimilarity(h1, h2) {
  if (h1.mode !== h2.mode) {
    return 0;
  }
  if (h1.mode === "transparent") {
    const shapeSimilarity = hashSegmentSimilarity(h1.hashes[0], h2.hashes[0]);
    const colorSimilarity = hashSegmentSimilarity(h1.hashes[1], h2.hashes[1]);
    return Math.round(shapeSimilarity * 0.8 + colorSimilarity * 0.2);
  }
  const pHashSimilarity = hashSegmentSimilarity(h1.hashes[0], h2.hashes[0]);
  const dHashSimilarity = hashSegmentSimilarity(h1.hashes[1], h2.hashes[1]);
  return Math.round((pHashSimilarity + dHashSimilarity) / 2);
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

// utils/linkUpdater.ts
var import_obsidian5 = require("obsidian");
var WIKI_LINK_PATTERN = /(!?\[\[)([^\]|]+)(\|[^\]]*)?(\]\])/g;
var MARKDOWN_LINK_PATTERN = /(!?\[[^\]]*\]\()([^)]+)(\))/g;
async function updateLinksInVault(app, oldPath, newPath) {
  const normalizedOldPath = normalizeVaultPath(oldPath).toLowerCase();
  const normalizedNewPath = normalizeVaultPath(newPath);
  if (!normalizedOldPath || !normalizedNewPath || normalizedOldPath === normalizedNewPath.toLowerCase()) {
    return 0;
  }
  const newFile = app.vault.getAbstractFileByPath(normalizedNewPath);
  if (!(newFile instanceof import_obsidian5.TFile)) {
    return 0;
  }
  const markdownFiles = app.vault.getMarkdownFiles();
  let updatedCount = 0;
  for (const file of markdownFiles) {
    const content = await app.vault.read(file);
    const newContent = updateLinksInContent(app, file, content, normalizedOldPath, newFile);
    if (newContent !== content) {
      await app.vault.modify(file, newContent);
      updatedCount++;
    }
  }
  return updatedCount;
}
function updateLinksInContent(app, sourceFile, content, oldPath, newFile) {
  const normalizedNewPath = normalizeVaultPath(newFile.path);
  content = content.replace(WIKI_LINK_PATTERN, (fullMatch, prefix, linktext, alias = "", suffix) => {
    const parsed = (0, import_obsidian5.parseLinktext)(linktext);
    const resolvedPath = resolveLinkDestination(app, parsed.path, sourceFile.path);
    if (!shouldRewriteLink(parsed.path, resolvedPath, oldPath)) {
      return fullMatch;
    }
    const replacementLinkPath = composeReplacementPath(parsed.path, sourceFile.path, normalizedNewPath);
    return `${prefix}${replacementLinkPath}${parsed.subpath || ""}${alias}${suffix}`;
  });
  content = content.replace(MARKDOWN_LINK_PATTERN, (fullMatch, prefix, destination, suffix) => {
    const parsed = parseMarkdownDestination(destination);
    const resolvedPath = resolveLinkDestination(app, parsed.path, sourceFile.path);
    if (!shouldRewriteLink(parsed.path, resolvedPath, oldPath)) {
      return fullMatch;
    }
    const nextDestination = formatMarkdownDestination(
      composeReplacementPath(parsed.path, sourceFile.path, normalizedNewPath),
      parsed.suffix,
      parsed.isWrapped
    );
    return `${prefix}${nextDestination}${suffix}`;
  });
  return content;
}
function resolveLinkDestination(app, rawLinkPath, sourcePath) {
  let candidate = rawLinkPath.trim();
  if (!candidate) {
    return "";
  }
  candidate = candidate.replace(/\\ /g, " ");
  candidate = safeDecodeURIComponent(candidate);
  if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    return "";
  }
  const normalizedCandidate = normalizeVaultPath(candidate);
  const resolved = app.metadataCache.getFirstLinkpathDest(normalizedCandidate || candidate, sourcePath);
  const resolvedPath = resolved ? resolved.path : normalizedCandidate;
  return normalizeVaultPath(resolvedPath).toLowerCase();
}
function parseMarkdownDestination(destination) {
  let normalized = destination.trim();
  const isWrapped = normalized.startsWith("<") && normalized.endsWith(">");
  if (isWrapped) {
    normalized = normalized.slice(1, -1).trim();
  }
  normalized = normalized.replace(/\\ /g, " ");
  const match = normalized.match(/^[^?#]*/);
  const path = match ? match[0] : normalized;
  const suffix = normalized.slice(path.length);
  return {
    path,
    suffix,
    isWrapped
  };
}
function formatMarkdownDestination(linkPath, suffix, isWrapped) {
  const combined = `${linkPath}${suffix}`;
  if (isWrapped) {
    return `<${combined}>`;
  }
  return combined.replace(/ /g, "\\ ");
}
function shouldRewriteLink(rawPath, resolvedPath, oldPath) {
  if (resolvedPath === oldPath) {
    return true;
  }
  const normalized = normalizeVaultPath(safeDecodeURIComponent(rawPath).replace(/\\ /g, " ")).toLowerCase();
  if (!normalized || normalized.includes("/")) {
    return false;
  }
  const oldBase = getFileNameFromPath(oldPath).toLowerCase();
  return normalized === oldBase;
}
function composeReplacementPath(rawPath, sourcePath, newPath) {
  const style = detectLinkPathStyle(rawPath);
  switch (style) {
    case "basename":
      return getFileNameFromPath(newPath) || newPath;
    case "relative":
      return toRelativeVaultPath(sourcePath, newPath) || getFileNameFromPath(newPath) || newPath;
    case "absolute":
      return `/${newPath}`;
    case "vault":
    default:
      return newPath;
  }
}
function detectLinkPathStyle(rawPath) {
  const trimmed = String(rawPath || "").trim();
  if (!trimmed) return "basename";
  if (trimmed.startsWith("/")) return "absolute";
  if (trimmed.startsWith("./") || trimmed.startsWith("../")) return "relative";
  const normalized = normalizeVaultPath(trimmed);
  if (normalized.includes("/")) {
    return "vault";
  }
  return "basename";
}
function toRelativeVaultPath(sourcePath, targetPath) {
  const fromDir = normalizeVaultPath(getParentPath(sourcePath));
  const to = normalizeVaultPath(targetPath);
  if (!to) return "";
  const fromParts = fromDir ? fromDir.split("/") : [];
  const toParts = to.split("/");
  let common = 0;
  while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
    common++;
  }
  const upCount = fromParts.length - common;
  const parts = [];
  for (let i = 0; i < upCount; i++) {
    parts.push("..");
  }
  parts.push(...toParts.slice(common));
  return parts.join("/");
}

// view/DuplicateDetectionView.ts
var VIEW_TYPE_DUPLICATE_DETECTION = "duplicate-detection-view";
var DuplicateDetectionView = class extends import_obsidian6.ItemView {
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
    (0, import_obsidian6.setIcon)(cleanAllBtn, "broom");
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
    (0, import_obsidian6.setIcon)(scanBtn, "search");
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
    if (fileA instanceof import_obsidian6.TFile && fileB instanceof import_obsidian6.TFile) {
      return fileB.stat.mtime - fileA.stat.mtime || fileB.stat.size - fileA.stat.size || pathA.localeCompare(pathB);
    }
    if (fileA instanceof import_obsidian6.TFile) return -1;
    if (fileB instanceof import_obsidian6.TFile) return 1;
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
            if (file instanceof import_obsidian6.TFile) {
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
        new import_obsidian6.Notice(this.plugin.t("noDuplicatesFound"));
      } else {
        const totalDuplicates = this.duplicateGroups.reduce(
          (sum, g) => sum + g.files.length - 1,
          0
        );
        new import_obsidian6.Notice(this.plugin.t("duplicatesFound", {
          groups: this.duplicateGroups.length,
          files: totalDuplicates
        }));
      }
    } catch (error) {
      console.error("Duplicate detection failed:", error);
      new import_obsidian6.Notice(this.plugin.t("scanError"));
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
      if (!(file instanceof import_obsidian6.TFile)) continue;
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
        (0, import_obsidian6.setIcon)(icon, "image");
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
        (0, import_obsidian6.setIcon)(quarantineBtn, "archive");
        quarantineBtn.createSpan({ text: ` ${this.plugin.t("quarantine")}` });
        quarantineBtn.addEventListener("click", async () => {
          const keepFile = group.files[0];
          await updateLinksInVault(this.app, file.path, keepFile.path);
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
      const keepFile = group.files[0];
      for (let i = 1; i < group.files.length; i++) {
        const entry = group.files[i];
        const file = this.app.vault.getAbstractFileByPath(entry.path);
        if (!(file instanceof import_obsidian6.TFile)) continue;
        await updateLinksInVault(this.app, file.path, keepFile.path);
        const result = await this.plugin.safeDeleteFile(file);
        if (result) totalQuarantined++;
      }
    }
    new import_obsidian6.Notice(this.plugin.t("duplicatesQuarantined", { count: totalQuarantined }));
    this.duplicateGroups = [];
    await this.renderView();
  }
};

// view/MediaPreviewModal.ts
var import_obsidian7 = require("obsidian");
var MediaPreviewModal = class extends import_obsidian7.Modal {
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
    const mediaType = getMediaType(file.name);
    const isImage = mediaType === "image";
    const isVideo = mediaType === "video";
    const isAudio = mediaType === "audio";
    const isDocument = mediaType === "document";
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
    } else if (isDocument) {
      const unsupported = container.createDiv({ cls: "preview-unsupported" });
      unsupported.createDiv({ text: getDocumentDisplayLabel(file.name) });
      unsupported.createDiv({ text: this.plugin.t("unsupportedFileType") });
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
        new import_obsidian7.Notice(this.plugin.t("pathCopied"));
      }).catch((error) => {
        console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
        new import_obsidian7.Notice(this.plugin.t("error"));
      });
    });
    const copyLinkBtn = actions.createEl("button");
    copyLinkBtn.textContent = this.plugin.t("copyLinkBtn");
    copyLinkBtn.addEventListener("click", () => {
      const link = `[[${file.name}]]`;
      void navigator.clipboard.writeText(link).then(() => {
        new import_obsidian7.Notice(this.plugin.t("linkCopied"));
      }).catch((error) => {
        console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
        new import_obsidian7.Notice(this.plugin.t("error"));
      });
    });
    const openOriginalBtn = actions.createEl("button");
    openOriginalBtn.textContent = this.plugin.t("openOriginal");
    openOriginalBtn.addEventListener("click", () => {
      const src = this.app.vault.getResourcePath(file);
      window.open(src, "_blank", "noopener,noreferrer");
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
var import_obsidian8 = require("obsidian");
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
var SettingsTab = class extends import_obsidian8.PluginSettingTab {
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
    new import_obsidian8.Setting(containerEl).setName(this.t("mediaFolder")).setDesc(this.t("mediaFolderDesc")).addText((text) => text.setPlaceholder("attachments/media").setValue(this.plugin.settings.imageFolder).onChange(async (value) => {
      this.plugin.settings.imageFolder = normalizeVaultPath(value);
      this.plugin.clearCache();
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("thumbnailSize")).setDesc(this.t("thumbnailSizeDesc")).addDropdown((dropdown) => dropdown.addOption("small", this.t("thumbnailSmall")).addOption("medium", this.t("thumbnailMedium")).addOption("large", this.t("thumbnailLarge")).setValue(this.plugin.settings.thumbnailSize).onChange(async (value) => {
      this.plugin.settings.thumbnailSize = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("defaultSortBy")).setDesc(this.t("sortByDesc")).addDropdown((dropdown) => dropdown.addOption("name", this.t("sortByName")).addOption("date", this.t("sortByDate")).addOption("size", this.t("sortBySize")).setValue(this.plugin.settings.sortBy).onChange(async (value) => {
      this.plugin.settings.sortBy = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("sortOrder")).setDesc(this.t("sortOrderDesc")).addDropdown((dropdown) => dropdown.addOption("asc", this.t("sortAsc")).addOption("desc", this.t("sortDesc")).setValue(this.plugin.settings.sortOrder).onChange(async (value) => {
      this.plugin.settings.sortOrder = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("showImageInfo")).setDesc(this.t("showImageInfoDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.showImageInfo).onChange(async (value) => {
      this.plugin.settings.showImageInfo = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("autoRefresh")).setDesc(this.t("autoRefreshDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.autoRefresh).onChange(async (value) => {
      this.plugin.settings.autoRefresh = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("defaultAlignment")).setDesc(this.t("alignmentDesc")).addDropdown((dropdown) => dropdown.addOption("left", this.t("alignLeft")).addOption("center", this.t("alignCenter")).addOption("right", this.t("alignRight")).setValue(this.plugin.settings.defaultAlignment).onChange(async (value) => {
      this.plugin.settings.defaultAlignment = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("safeDeleteSettings") });
    new import_obsidian8.Setting(containerEl).setName(this.t("useTrashFolder")).setDesc(this.t("useTrashFolderDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.useTrashFolder).onChange(async (value) => {
      this.plugin.settings.useTrashFolder = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("trashFolderPath")).setDesc(this.t("trashFolderPathDesc")).addText((text) => text.setPlaceholder("obsidian-media-toolkit-trash").setValue(this.plugin.settings.trashFolder).onChange(async (value) => {
      this.plugin.settings.trashFolder = normalizeVaultPath(value);
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("autoCleanupTrash")).setDesc(this.t("autoCleanupTrashDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.autoCleanupTrash).onChange(async (value) => {
      this.plugin.settings.autoCleanupTrash = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("cleanupDays")).setDesc(this.t("cleanupDaysDesc")).addText((text) => text.setPlaceholder("30").setValue(String(this.plugin.settings.trashCleanupDays)).onChange(async (value) => {
      const days = parseInt(value, 10);
      if (!isNaN(days) && days > 0) {
        this.plugin.settings.trashCleanupDays = days;
        await this.plugin.saveSettings();
      }
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("safeScanSettings") });
    new import_obsidian8.Setting(containerEl).setName(this.t("safeScan")).setDesc(this.t("safeScanEnabledDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.safeScanEnabled).onChange(async (value) => {
      this.plugin.settings.safeScanEnabled = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("safeScanUnrefDays")).setDesc(this.t("safeScanUnrefDaysDesc")).addText((text) => text.setPlaceholder("30").setValue(String(this.plugin.settings.safeScanUnrefDays)).onChange(async (value) => {
      const days = parseInt(value, 10);
      if (!isNaN(days) && days > 0) {
        this.plugin.settings.safeScanUnrefDays = days;
        await this.plugin.saveSettings();
      }
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("safeScanMinSize")).setDesc(this.t("safeScanMinSizeDesc")).addText((text) => text.setPlaceholder("5").setValue(String(Number((this.plugin.settings.safeScanMinSize / (1024 * 1024)).toFixed(2)))).onChange(async (value) => {
      const sizeMb = parseFloat(value);
      if (!isNaN(sizeMb) && sizeMb >= 0) {
        this.plugin.settings.safeScanMinSize = Math.round(sizeMb * 1024 * 1024);
        await this.plugin.saveSettings();
      }
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("duplicateDetectionSettings") });
    new import_obsidian8.Setting(containerEl).setName(this.t("duplicateThresholdSetting")).setDesc(this.t("duplicateThresholdDesc")).addText((text) => text.setPlaceholder("90").setValue(String(this.plugin.settings.duplicateThreshold)).onChange(async (value) => {
      const threshold = parseInt(value, 10);
      if (!isNaN(threshold) && threshold >= 50 && threshold <= 100) {
        this.plugin.settings.duplicateThreshold = threshold;
        await this.plugin.saveSettings();
      }
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("mediaTypes") });
    new import_obsidian8.Setting(containerEl).setName(this.t("enableImageSupport")).setDesc(this.t("enableImageSupportDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enableImages).onChange(async (value) => {
      this.plugin.settings.enableImages = value;
      this.plugin.clearCache();
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("enableVideoSupport")).setDesc(this.t("enableVideoSupportDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enableVideos).onChange(async (value) => {
      this.plugin.settings.enableVideos = value;
      this.plugin.clearCache();
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("enableAudioSupport")).setDesc(this.t("enableAudioSupportDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enableAudio).onChange(async (value) => {
      this.plugin.settings.enableAudio = value;
      this.plugin.clearCache();
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("enablePDFSupport")).setDesc(this.t("enablePDFSupportDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enablePDF).onChange(async (value) => {
      this.plugin.settings.enablePDF = value;
      this.plugin.clearCache();
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("hr", { cls: "settings-divider" });
    containerEl.createEl("h3", { text: this.t("viewSettings") });
    new import_obsidian8.Setting(containerEl).setName(this.t("interfaceLanguage")).setDesc(this.t("languageDesc")).addDropdown((dropdown) => dropdown.addOption("system", this.t("languageSystem")).addOption("zh", "\u4E2D\u6587").addOption("en", "English").setValue(this.plugin.settings.language).onChange(async (value) => {
      this.plugin.settings.language = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("pageSize")).setDesc(this.t("pageSizeDesc")).addText((text) => text.setPlaceholder("50").setValue(String(this.plugin.settings.pageSize)).onChange(async (value) => {
      const size = parseInt(value, 10);
      if (!isNaN(size) && size > 0) {
        this.plugin.settings.pageSize = size;
        await this.plugin.saveSettings();
      }
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("enablePreviewModal")).setDesc(this.t("enablePreviewModalDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enablePreviewModal).onChange(async (value) => {
      this.plugin.settings.enablePreviewModal = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian8.Setting(containerEl).setName(this.t("enableKeyboardNav")).setDesc(this.t("enableKeyboardNavDesc")).addToggle((toggle) => toggle.setValue(this.plugin.settings.enableKeyboardNav).onChange(async (value) => {
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
var import_obsidian9 = require("obsidian");
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
        if (file && file instanceof import_obsidian9.TFile) {
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
  enablePDFSupport: "\u542F\u7528\u6587\u6863\u652F\u6301",
  enablePDFSupportDesc: "\u5728\u5A92\u4F53\u5E93\u4E2D\u663E\u793A\u6587\u6863\u6587\u4EF6 (pdf, doc, docx, xls, xlsx, ppt, pptx)",
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
  enablePDFSupport: "Enable Document Support",
  enablePDFSupportDesc: "Show document files in media library (pdf, doc, docx, xls, xlsx, ppt, pptx)",
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
var import_obsidian10 = require("obsidian");
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
    if (!(file instanceof import_obsidian10.TFile)) return false;
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
var _ImageManagerPlugin = class _ImageManagerPlugin extends import_obsidian11.Plugin {
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
    if (!(trashFolder instanceof import_obsidian11.TFolder)) {
      return 0;
    }
    const days = Math.max(1, this.settings.trashCleanupDays || 30);
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1e3;
    let deletedCount = 0;
    const files = trashFolder.children;
    for (const file of files) {
      if (file instanceof import_obsidian11.TFile) {
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
      new import_obsidian11.Notice(this.t("autoCleanupComplete").replace("{count}", String(deletedCount)));
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
    if (file instanceof import_obsidian11.TFolder) {
      this.clearCache();
      if (this.settings.autoRefresh) {
        this.scheduleRefreshOpenViews();
      }
      return;
    }
    if (!(file instanceof import_obsidian11.TFile)) {
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
  // 获取所有媒体文件（图片、音视频、文档）
  async getAllImageFiles() {
    const enabledExtensions = getEnabledExtensions({
      enableImages: this.settings.enableImages,
      enableVideos: this.settings.enableVideos,
      enableAudio: this.settings.enableAudio,
      enablePDF: this.settings.enablePDF
    });
    if (enabledExtensions.length === 0) {
      new import_obsidian11.Notice(this.t("allMediaTypesDisabled"));
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
      scanNotice = new import_obsidian11.Notice(this.t("scanningReferences") + ` (0/${totalFiles})`, 0);
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
        scanNotice = new import_obsidian11.Notice(this.t("scanningReferences") + ` (${Math.min(i + BATCH_SIZE, totalFiles)}/${totalFiles})`, 0);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (scanNotice) {
      scanNotice.hide();
      new import_obsidian11.Notice(this.t("scanComplete") + ` (${totalFiles} ${this.t("filesScanned")})`);
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
    new import_obsidian11.Notice(this.t("scanComplete"));
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
          const view = workspace.getActiveViewOfType(import_obsidian11.MarkdownView);
          if (view) {
            const editor = view.editor;
            editor.setCursor({ ch: 0, line: result.line - 1 });
            editor.scrollIntoView({ from: { ch: 0, line: result.line - 1 }, to: { ch: 0, line: result.line - 1 } }, true);
          }
        }, 100);
      }
    } else {
      new import_obsidian11.Notice(this.t("notReferenced"));
    }
  }
  // 对齐选中的图片
  alignSelectedImage(editor, alignment) {
    const selection = editor.getSelection();
    if (!selection) {
      new import_obsidian11.Notice(this.t("selectImageFirst"));
      return;
    }
    if (!selection.includes("![") && !selection.includes("[[")) {
      new import_obsidian11.Notice(this.t("selectImage"));
      return;
    }
    const alignedText = ImageAlignment.applyAlignment(selection, alignment);
    editor.replaceSelection(alignedText);
    const alignmentKey = alignment === "left" ? "imageAlignedLeft" : alignment === "center" ? "imageAlignedCenter" : "imageAlignedRight";
    new import_obsidian11.Notice(this.t(alignmentKey));
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
      if (existing instanceof import_obsidian11.TFolder) {
        continue;
      }
      if (existing) {
        return false;
      }
      try {
        await vault.createFolder(currentPath);
      } catch {
        const retried = vault.getAbstractFileByPath(currentPath);
        if (!(retried instanceof import_obsidian11.TFolder)) {
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
        new import_obsidian11.Notice(this.t("deleteFailedWithName", { name: file.name }));
        return false;
      }
    }
    const trashPath = normalizeVaultPath(this.settings.trashFolder) || DEFAULT_SETTINGS.trashFolder;
    if (!isPathSafe(trashPath)) {
      new import_obsidian11.Notice(this.t("operationFailed", { name: file.name }));
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
        new import_obsidian11.Notice(this.t("operationFailed", { name: fileName }));
        return false;
      }
      await vault.rename(file, targetPath);
      new import_obsidian11.Notice(this.t("movedToTrash", { name: fileName }));
      return true;
    } catch (error) {
      console.error("\u79FB\u52A8\u6587\u4EF6\u5230\u9694\u79BB\u6587\u4EF6\u5939\u5931\u8D25:", error);
      new import_obsidian11.Notice(this.t("operationFailed", { name: fileName }));
      return false;
    }
  }
  // 恢复隔离文件夹中的文件
  async restoreFile(file, originalPath) {
    const { vault } = this.app;
    const normalizedOriginalPath = normalizeVaultPath(safeDecodeURIComponent(originalPath));
    if (!normalizedOriginalPath || !isPathSafe(normalizedOriginalPath)) {
      new import_obsidian11.Notice(this.t("restoreFailed", { message: this.t("error") }));
      return false;
    }
    const targetFile = vault.getAbstractFileByPath(normalizedOriginalPath);
    if (targetFile) {
      new import_obsidian11.Notice(this.t("restoreFailed", { message: this.t("targetFileExists") }));
      return false;
    }
    const parentPath = getParentPath(normalizedOriginalPath);
    if (parentPath) {
      const parentReady = await this.ensureFolderExists(parentPath);
      if (!parentReady) {
        new import_obsidian11.Notice(this.t("restoreFailed", { message: this.t("error") }));
        return false;
      }
    }
    const restoredName = getFileNameFromPath(normalizedOriginalPath) || file.name;
    try {
      await vault.rename(file, normalizedOriginalPath);
      new import_obsidian11.Notice(this.t("restoreSuccess", { name: restoredName }));
      return true;
    } catch (error) {
      console.error("\u6062\u590D\u6587\u4EF6\u5931\u8D25:", error);
      new import_obsidian11.Notice(this.t("restoreFailed", { message: error.message }));
      return false;
    }
  }
  // 彻底删除隔离文件夹中的文件
  async permanentlyDeleteFile(file) {
    const { vault } = this.app;
    try {
      await vault.delete(file);
      new import_obsidian11.Notice(this.t("fileDeleted", { name: file.name }));
      return true;
    } catch (error) {
      console.error("\u5F7B\u5E95\u5220\u9664\u6587\u4EF6\u5931\u8D25:", error);
      new import_obsidian11.Notice(this.t("deleteFailed"));
      return false;
    }
  }
};
_ImageManagerPlugin.LEGACY_TRASH_FOLDER = ".obsidian-media-toolkit-trash";
_ImageManagerPlugin.CACHE_DURATION = 5 * 60 * 1e3;
var ImageManagerPlugin = _ImageManagerPlugin;
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJ2aWV3L0ltYWdlTGlicmFyeVZpZXcudHMiLCAidXRpbHMvZm9ybWF0LnRzIiwgInV0aWxzL3BhdGgudHMiLCAidXRpbHMvbWVkaWFUeXBlcy50cyIsICJ1dGlscy90aHVtYm5haWxDYWNoZS50cyIsICJ1dGlscy9leGlmUmVhZGVyLnRzIiwgInV0aWxzL3J1bGVFbmdpbmUudHMiLCAidXRpbHMvbWVkaWFQcm9jZXNzb3IudHMiLCAidmlldy9VbnJlZmVyZW5jZWRJbWFnZXNWaWV3LnRzIiwgInZpZXcvRGVsZXRlQ29uZmlybU1vZGFsLnRzIiwgInZpZXcvVHJhc2hNYW5hZ2VtZW50Vmlldy50cyIsICJ1dGlscy9zZWN1cml0eS50cyIsICJ2aWV3L0R1cGxpY2F0ZURldGVjdGlvblZpZXcudHMiLCAidXRpbHMvcGVyY2VwdHVhbEhhc2gudHMiLCAidXRpbHMvbGlua1VwZGF0ZXIudHMiLCAidmlldy9NZWRpYVByZXZpZXdNb2RhbC50cyIsICJzZXR0aW5ncy50cyIsICJ1dGlscy9pbWFnZUFsaWdubWVudC50cyIsICJ1dGlscy9wb3N0UHJvY2Vzc29yLnRzIiwgInV0aWxzL2kxOG4udHMiLCAidXRpbHMvZmlsZVdhdGNoZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBsdWdpbiwgRWRpdG9yLCBURmlsZSwgVEZvbGRlciwgVEFic3RyYWN0RmlsZSwgTWFya2Rvd25WaWV3LCBOb3RpY2UsIE1lbnUsIE1lbnVJdGVtIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgSW1hZ2VMaWJyYXJ5VmlldywgVklFV19UWVBFX0lNQUdFX0xJQlJBUlkgfSBmcm9tICcuL3ZpZXcvSW1hZ2VMaWJyYXJ5Vmlldyc7XG5pbXBvcnQgeyBVbnJlZmVyZW5jZWRJbWFnZXNWaWV3LCBWSUVXX1RZUEVfVU5SRUZFUkVOQ0VEX0lNQUdFUyB9IGZyb20gJy4vdmlldy9VbnJlZmVyZW5jZWRJbWFnZXNWaWV3JztcbmltcG9ydCB7IFRyYXNoTWFuYWdlbWVudFZpZXcsIFZJRVdfVFlQRV9UUkFTSF9NQU5BR0VNRU5UIH0gZnJvbSAnLi92aWV3L1RyYXNoTWFuYWdlbWVudFZpZXcnO1xuaW1wb3J0IHsgRHVwbGljYXRlRGV0ZWN0aW9uVmlldywgVklFV19UWVBFX0RVUExJQ0FURV9ERVRFQ1RJT04gfSBmcm9tICcuL3ZpZXcvRHVwbGljYXRlRGV0ZWN0aW9uVmlldyc7XG5pbXBvcnQgeyBNZWRpYVByZXZpZXdNb2RhbCB9IGZyb20gJy4vdmlldy9NZWRpYVByZXZpZXdNb2RhbCc7XG5pbXBvcnQgeyBJbWFnZU1hbmFnZXJTZXR0aW5ncywgREVGQVVMVF9TRVRUSU5HUywgU2V0dGluZ3NUYWIgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IEltYWdlQWxpZ25tZW50LCBBbGlnbm1lbnRUeXBlIH0gZnJvbSAnLi91dGlscy9pbWFnZUFsaWdubWVudCc7XG5pbXBvcnQgeyBBbGlnbm1lbnRQb3N0UHJvY2Vzc29yIH0gZnJvbSAnLi91dGlscy9wb3N0UHJvY2Vzc29yJztcbmltcG9ydCB7IHQgYXMgdHJhbnNsYXRlLCBnZXRTeXN0ZW1MYW5ndWFnZSwgTGFuZ3VhZ2UsIFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdXRpbHMvaTE4bic7XG5pbXBvcnQgeyBnZXRFbmFibGVkRXh0ZW5zaW9ucywgaXNNZWRpYUZpbGUgfSBmcm9tICcuL3V0aWxzL21lZGlhVHlwZXMnO1xuaW1wb3J0IHsgaXNQYXRoU2FmZSB9IGZyb20gJy4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgZ2V0RmlsZU5hbWVGcm9tUGF0aCwgZ2V0UGFyZW50UGF0aCwgbm9ybWFsaXplVmF1bHRQYXRoLCBzYWZlRGVjb2RlVVJJQ29tcG9uZW50IH0gZnJvbSAnLi91dGlscy9wYXRoJztcbmltcG9ydCB7IFRodW1ibmFpbENhY2hlIH0gZnJvbSAnLi91dGlscy90aHVtYm5haWxDYWNoZSc7XG5pbXBvcnQgeyBNZWRpYUZpbGVJbmRleCB9IGZyb20gJy4vdXRpbHMvZmlsZVdhdGNoZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbWFnZU1hbmFnZXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRzZXR0aW5nczogSW1hZ2VNYW5hZ2VyU2V0dGluZ3MgPSBERUZBVUxUX1NFVFRJTkdTO1xuXHRwcml2YXRlIHN0YXRpYyByZWFkb25seSBMRUdBQ1lfVFJBU0hfRk9MREVSID0gJy5vYnNpZGlhbi1tZWRpYS10b29sa2l0LXRyYXNoJztcblx0Ly8gXHU3RjEzXHU1QjU4XHU1RjE1XHU3NTI4XHU3Njg0XHU1NkZFXHU3MjQ3XHU0RUU1XHU2M0QwXHU5QUQ4XHU1OTI3XHU1NzhCIFZhdWx0IFx1NzY4NFx1NjAyN1x1ODBGRFxuXHRwcml2YXRlIHJlZmVyZW5jZWRJbWFnZXNDYWNoZTogU2V0PHN0cmluZz4gfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBjYWNoZVRpbWVzdGFtcDogbnVtYmVyID0gMDtcblx0cHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQ0FDSEVfRFVSQVRJT04gPSA1ICogNjAgKiAxMDAwOyAvLyBcdTdGMTNcdTVCNTg1XHU1MjA2XHU5NDlGXG5cdHByaXZhdGUgcmVmcmVzaFZpZXdzVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGw7XG5cblx0Ly8gXHU2MDI3XHU4MEZEXHVGRjFBXHU3RjI5XHU3NTY1XHU1NkZFXHU3RjEzXHU1QjU4ICsgXHU1ODlFXHU5MUNGXHU2NTg3XHU0RUY2XHU3RDIyXHU1RjE1XG5cdHRodW1ibmFpbENhY2hlOiBUaHVtYm5haWxDYWNoZSA9IG5ldyBUaHVtYm5haWxDYWNoZSgpO1xuXHRmaWxlSW5kZXg6IE1lZGlhRmlsZUluZGV4ID0gbmV3IE1lZGlhRmlsZUluZGV4KG51bGwgYXMgYW55KTtcblx0cHJpdmF0ZSBpbmRleGVkRXh0ZW5zaW9uc0tleTogc3RyaW5nID0gJyc7XG5cdHByaXZhdGUgaW5kZXhlZFRyYXNoRm9sZGVyOiBzdHJpbmcgPSAnJztcblxuXHQvKipcblx0ICogXHU4M0I3XHU1M0Q2XHU1RjUzXHU1MjREXHU4QkVEXHU4QTAwXHU4QkJFXHU3RjZFXG5cdCAqL1xuXHRnZXRDdXJyZW50TGFuZ3VhZ2UoKTogTGFuZ3VhZ2Uge1xuXHRcdGlmICh0aGlzLnNldHRpbmdzLmxhbmd1YWdlID09PSAnc3lzdGVtJykge1xuXHRcdFx0cmV0dXJuIGdldFN5c3RlbUxhbmd1YWdlKCk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnNldHRpbmdzLmxhbmd1YWdlIGFzIExhbmd1YWdlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1N0ZGQlx1OEJEMVx1NTFGRFx1NjU3MFxuXHQgKi9cblx0dChrZXk6IHN0cmluZywgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPik6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRyYW5zbGF0ZSh0aGlzLmdldEN1cnJlbnRMYW5ndWFnZSgpLCBrZXkgYXMga2V5b2YgVHJhbnNsYXRpb25zLCBwYXJhbXMpO1xuXHR9XG5cblx0YXN5bmMgb25sb2FkKCkge1xuXHRcdGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cdFx0YXdhaXQgdGhpcy5taWdyYXRlTGVnYWN5VHJhc2hGb2xkZXIoKTtcblxuXHRcdC8vIFx1NTIxRFx1NTlDQlx1NTMxNlx1NjAyN1x1ODBGRFx1NTdGQVx1Nzg0MFx1OEJCRVx1NjVCRFxuXHRcdGF3YWl0IHRoaXMuaW5pdFBlcmZvcm1hbmNlSW5mcmEoKTtcblxuXHRcdC8vIFx1NTJBMFx1OEY3RFx1NjgzN1x1NUYwRlxuXHRcdHRoaXMucmVtb3ZlTWFuYWdlZFN0eWxlcygpO1xuXHRcdGF3YWl0IHRoaXMuYWRkU3R5bGUoKTtcblxuXHRcdC8vIFx1NkNFOFx1NTE4Q1x1NTZGRVx1NzI0N1x1NUU5M1x1ODlDNlx1NTZGRVxuXHRcdHRoaXMucmVnaXN0ZXJWaWV3KFZJRVdfVFlQRV9JTUFHRV9MSUJSQVJZLCAobGVhZikgPT4gbmV3IEltYWdlTGlicmFyeVZpZXcobGVhZiwgdGhpcykpO1xuXG5cdFx0Ly8gXHU2Q0U4XHU1MThDXHU2NzJBXHU1RjE1XHU3NTI4XHU1NkZFXHU3MjQ3XHU4OUM2XHU1NkZFXG5cdFx0dGhpcy5yZWdpc3RlclZpZXcoVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVMsIChsZWFmKSA9PiBuZXcgVW5yZWZlcmVuY2VkSW1hZ2VzVmlldyhsZWFmLCB0aGlzKSk7XG5cblx0XHQvLyBcdTZDRThcdTUxOENcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTdCQTFcdTc0MDZcdTg5QzZcdTU2RkVcblx0XHR0aGlzLnJlZ2lzdGVyVmlldyhWSUVXX1RZUEVfVFJBU0hfTUFOQUdFTUVOVCwgKGxlYWYpID0+IG5ldyBUcmFzaE1hbmFnZW1lbnRWaWV3KGxlYWYsIHRoaXMpKTtcblxuXHRcdC8vIFx1NkNFOFx1NTE4Q1x1OTFDRFx1NTkwRFx1NjhDMFx1NkQ0Qlx1ODlDNlx1NTZGRVxuXHRcdHRoaXMucmVnaXN0ZXJWaWV3KFZJRVdfVFlQRV9EVVBMSUNBVEVfREVURUNUSU9OLCAobGVhZikgPT4gbmV3IER1cGxpY2F0ZURldGVjdGlvblZpZXcobGVhZiwgdGhpcykpO1xuXG5cdFx0Ly8gXHU2Q0U4XHU1MThDXHU1NkZFXHU3MjQ3XHU1QkY5XHU5RjUwIFBvc3RQcm9jZXNzb3Jcblx0XHRjb25zdCBhbGlnbm1lbnRQcm9jZXNzb3IgPSBuZXcgQWxpZ25tZW50UG9zdFByb2Nlc3Nvcih0aGlzKTtcblx0XHRhbGlnbm1lbnRQcm9jZXNzb3IucmVnaXN0ZXIoKTtcblxuXHRcdC8vIFx1NkRGQlx1NTJBMFx1NTQ3RFx1NEVFNFx1OTc2Mlx1Njc3Rlx1NTQ3RFx1NEVFNFxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ29wZW4taW1hZ2UtbGlicmFyeScsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEltYWdlTGlicmFyeScpLFxuXHRcdFx0Y2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG5cdFx0XHRcdGlmIChjaGVja2luZykgcmV0dXJuIHRydWU7XG5cdFx0XHRcdHRoaXMub3BlbkltYWdlTGlicmFyeSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnZmluZC11bnJlZmVyZW5jZWQtaW1hZ2VzJyxcblx0XHRcdG5hbWU6IHRoaXMudCgnY21kRmluZFVucmVmZXJlbmNlZEltYWdlcycpLFxuXHRcdFx0Y2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG5cdFx0XHRcdGlmIChjaGVja2luZykgcmV0dXJuIHRydWU7XG5cdFx0XHRcdHRoaXMuZmluZFVucmVmZXJlbmNlZEltYWdlcygpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU3RjEzXHU1QjU4XHU1MjM3XHU2NUIwXHU1NDdEXHU0RUU0XG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAncmVmcmVzaC1jYWNoZScsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZFJlZnJlc2hDYWNoZScpLFxuXHRcdFx0Y2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG5cdFx0XHRcdGlmIChjaGVja2luZykgcmV0dXJuIHRydWU7XG5cdFx0XHRcdHRoaXMucmVmcmVzaENhY2hlKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEJcdTU0N0RcdTRFRTRcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdvcGVuLWR1cGxpY2F0ZS1kZXRlY3Rpb24nLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWREdXBsaWNhdGVEZXRlY3Rpb24nKSxcblx0XHRcdGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuXHRcdFx0XHRpZiAoY2hlY2tpbmcpIHJldHVybiB0cnVlO1xuXHRcdFx0XHR0aGlzLm9wZW5EdXBsaWNhdGVEZXRlY3Rpb24oKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFx1OTY5NFx1NzlCQlx1N0JBMVx1NzQwNlx1NTQ3RFx1NEVFNFxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ29wZW4tdHJhc2gtbWFuYWdlbWVudCcsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZFRyYXNoTWFuYWdlbWVudCcpLFxuXHRcdFx0Y2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG5cdFx0XHRcdGlmIChjaGVja2luZykgcmV0dXJuIHRydWU7XG5cdFx0XHRcdHRoaXMub3BlblRyYXNoTWFuYWdlbWVudCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU1NkZFXHU3MjQ3XHU1QkY5XHU5RjUwXHU1NDdEXHU0RUU0XG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnYWxpZ24taW1hZ2UtbGVmdCcsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEFsaWduSW1hZ2VMZWZ0JyksXG5cdFx0XHRlZGl0b3JDYWxsYmFjazogKGVkaXRvcjogRWRpdG9yKSA9PiB7XG5cdFx0XHRcdHRoaXMuYWxpZ25TZWxlY3RlZEltYWdlKGVkaXRvciwgJ2xlZnQnKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ2FsaWduLWltYWdlLWNlbnRlcicsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEFsaWduSW1hZ2VDZW50ZXInKSxcblx0XHRcdGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yOiBFZGl0b3IpID0+IHtcblx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAnY2VudGVyJyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdhbGlnbi1pbWFnZS1yaWdodCcsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEFsaWduSW1hZ2VSaWdodCcpLFxuXHRcdFx0ZWRpdG9yQ2FsbGJhY2s6IChlZGl0b3I6IEVkaXRvcikgPT4ge1xuXHRcdFx0XHR0aGlzLmFsaWduU2VsZWN0ZWRJbWFnZShlZGl0b3IsICdyaWdodCcpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU2Q0U4XHU1MThDXHU3RjE2XHU4RjkxXHU1NjY4XHU0RTBBXHU0RTBCXHU2NTg3XHU4M0RDXHU1MzU1XG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KFxuXHRcdFx0Ly8gQHRzLWlnbm9yZSAtIGVkaXRvci1jb250ZXh0LW1lbnUgZXZlbnRcblx0XHRcdHRoaXMuYXBwLndvcmtzcGFjZS5vbignZWRpdG9yLWNvbnRleHQtbWVudScsIChtZW51OiBhbnksIGVkaXRvcjogYW55KSA9PiB7XG5cdFx0XHRcdHRoaXMuYWRkQWxpZ25tZW50TWVudUl0ZW1zKG1lbnUsIGVkaXRvcik7XG5cdFx0XHR9KVxuXHRcdCk7XG5cblx0XHQvLyBcdTZERkJcdTUyQTBcdThCQkVcdTdGNkVcdTY4MDdcdTdCN0VcdTk4NzVcblx0XHR0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNldHRpbmdzVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cblx0XHQvLyBcdTZDRThcdTUxOENcdTVGRUJcdTYzNzdcdTk1MkVcblx0XHR0aGlzLnJlZ2lzdGVyS2V5Ym9hcmRTaG9ydGN1dHMoKTtcblxuXHRcdC8vIFx1NzZEMVx1NTQyQyBWYXVsdCBcdTY1ODdcdTRFRjZcdTUzRDhcdTUzMTZcdUZGMENcdTgxRUFcdTUyQThcdTU5MzFcdTY1NDhcdTdGMTNcdTVCNThcdTVFNzZcdTUyMzdcdTY1QjBcdTg5QzZcdTU2RkVcblx0XHR0aGlzLnJlZ2lzdGVyVmF1bHRFdmVudExpc3RlbmVycygpO1xuXG5cdFx0Ly8gXHU1NDJGXHU1MkE4XHU2NUY2XHU2MjY3XHU4ODRDXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XG5cdFx0dGhpcy5hdXRvQ2xlYW51cFRyYXNoT25TdGFydHVwKCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU4RkMxXHU3OUZCXHU2NUU3XHU3MjQ4XHU5RUQ4XHU4QkE0XHU5Njk0XHU3OUJCXHU3NkVFXHU1RjU1XHVGRjA4XHU5NjkwXHU4NUNGXHU3NkVFXHU1RjU1XHVGRjA5XHU1MjMwXHU2NUIwXHU3MjQ4XHU5RUQ4XHU4QkE0XHU3NkVFXHU1RjU1XHVGRjBDXHU5MDdGXHU1MTREXHU4OEFCIFZhdWx0IFx1N0QyMlx1NUYxNVx1NUZGRFx1NzU2NVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBtaWdyYXRlTGVnYWN5VHJhc2hGb2xkZXIoKSB7XG5cdFx0Y29uc3QgbGVnYWN5UGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChJbWFnZU1hbmFnZXJQbHVnaW4uTEVHQUNZX1RSQVNIX0ZPTERFUik7XG5cdFx0Y29uc3QgZGVmYXVsdFRyYXNoUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChERUZBVUxUX1NFVFRJTkdTLnRyYXNoRm9sZGVyKSB8fCBERUZBVUxUX1NFVFRJTkdTLnRyYXNoRm9sZGVyO1xuXHRcdGNvbnN0IGNvbmZpZ3VyZWRUcmFzaFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgodGhpcy5zZXR0aW5ncy50cmFzaEZvbGRlcikgfHwgZGVmYXVsdFRyYXNoUGF0aDtcblx0XHRsZXQgc2V0dGluZ3NDaGFuZ2VkID0gZmFsc2U7XG5cblx0XHRpZiAoY29uZmlndXJlZFRyYXNoUGF0aCA9PT0gbGVnYWN5UGF0aCkge1xuXHRcdFx0dGhpcy5zZXR0aW5ncy50cmFzaEZvbGRlciA9IGRlZmF1bHRUcmFzaFBhdGg7XG5cdFx0XHRzZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBhZGFwdGVyID0gdGhpcy5hcHAudmF1bHQuYWRhcHRlcjtcblx0XHRcdGNvbnN0IGxlZ2FjeUV4aXN0cyA9IGF3YWl0IGFkYXB0ZXIuZXhpc3RzKGxlZ2FjeVBhdGgpO1xuXG5cdFx0XHRpZiAobGVnYWN5RXhpc3RzKSB7XG5cdFx0XHRcdGNvbnN0IHRhcmdldEV4aXN0cyA9IGF3YWl0IGFkYXB0ZXIuZXhpc3RzKGRlZmF1bHRUcmFzaFBhdGgpO1xuXHRcdFx0XHRpZiAoIXRhcmdldEV4aXN0cykge1xuXHRcdFx0XHRcdGF3YWl0IGFkYXB0ZXIucmVuYW1lKGxlZ2FjeVBhdGgsIGRlZmF1bHRUcmFzaFBhdGgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1OEZDMVx1NzlGQlx1NjVFN1x1NzI0OFx1OTY5NFx1NzlCQlx1NzZFRVx1NUY1NVx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0fVxuXG5cdFx0aWYgKHNldHRpbmdzQ2hhbmdlZCkge1xuXHRcdFx0YXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU1NDJGXHU1MkE4XHU2NUY2XHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGF1dG9DbGVhbnVwVHJhc2hPblN0YXJ0dXAoKSB7XG5cdFx0Ly8gXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU1NDJGXHU3NTI4XHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XG5cdFx0aWYgKCF0aGlzLnNldHRpbmdzLmF1dG9DbGVhbnVwVHJhc2gpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0YXdhaXQgdGhpcy5jbGVhbnVwT2xkVHJhc2hGaWxlcygpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdTgxRUFcdTUyQThcdTZFMDVcdTc0MDZcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMDVcdTc0MDZcdThGQzdcdTY3MUZcdTc2ODRcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcblx0ICovXG5cdGFzeW5jIGNsZWFudXBPbGRUcmFzaEZpbGVzKCk6IFByb21pc2U8bnVtYmVyPiB7XG5cdFx0Y29uc3QgeyB2YXVsdCB9ID0gdGhpcy5hcHA7XG5cdFx0Y29uc3QgdHJhc2hQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMuc2V0dGluZ3MudHJhc2hGb2xkZXIpO1xuXG5cdFx0aWYgKCF0cmFzaFBhdGggfHwgIWlzUGF0aFNhZmUodHJhc2hQYXRoKSkge1xuXHRcdFx0cmV0dXJuIDA7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdHJhc2hGb2xkZXIgPSB2YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodHJhc2hQYXRoKTtcblxuXHRcdC8vIFx1NjhDMFx1NjdFNVx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NjYyRlx1NTQyNlx1NUI1OFx1NTcyOFxuXHRcdGlmICghdHJhc2hGb2xkZXIpIHtcblx0XHRcdHJldHVybiAwO1xuXHRcdH1cblxuXHRcdC8vIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NEUzQVx1NjU4N1x1NEVGNlx1NTkzOVxuXHRcdGlmICghKHRyYXNoRm9sZGVyIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcblx0XHRcdHJldHVybiAwO1xuXHRcdH1cblxuXHRcdGNvbnN0IGRheXMgPSBNYXRoLm1heCgxLCB0aGlzLnNldHRpbmdzLnRyYXNoQ2xlYW51cERheXMgfHwgMzApO1xuXHRcdGNvbnN0IGN1dG9mZlRpbWUgPSBEYXRlLm5vdygpIC0gKGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKTtcblx0XHRsZXQgZGVsZXRlZENvdW50ID0gMDtcblxuXHRcdC8vIFx1ODNCN1x1NTNENlx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NzY4NFx1NjI0MFx1NjcwOVx1NjU4N1x1NEVGNlxuXHRcdGNvbnN0IGZpbGVzID0gdHJhc2hGb2xkZXIuY2hpbGRyZW47XG5cblx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcblx0XHRcdGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcblx0XHRcdFx0Ly8gXHU2OEMwXHU2N0U1XHU2NTg3XHU0RUY2XHU0RkVFXHU2NTM5XHU2NUY2XHU5NUY0XG5cdFx0XHRcdGlmIChmaWxlLnN0YXQubXRpbWUgPCBjdXRvZmZUaW1lKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGF3YWl0IHZhdWx0LmRlbGV0ZShmaWxlKTtcblx0XHRcdFx0XHRcdGRlbGV0ZWRDb3VudCsrO1xuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGBcdTUyMjBcdTk2NjRcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6ICR7ZmlsZS5uYW1lfWAsIGVycm9yKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZGVsZXRlZENvdW50ID4gMCkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ2F1dG9DbGVhbnVwQ29tcGxldGUnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKGRlbGV0ZWRDb3VudCkpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZGVsZXRlZENvdW50O1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkNFOFx1NTE4Q1x1NUZFQlx1NjM3N1x1OTUyRVxuXHQgKi9cblx0cmVnaXN0ZXJLZXlib2FyZFNob3J0Y3V0cygpIHtcblx0XHQvLyBDdHJsK1NoaWZ0K00gXHU2MjUzXHU1RjAwXHU1QTkyXHU0RjUzXHU1RTkzXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnb3Blbi1tZWRpYS1saWJyYXJ5LXNob3J0Y3V0Jyxcblx0XHRcdG5hbWU6IHRoaXMudCgnY21kT3Blbk1lZGlhTGlicmFyeScpLFxuXHRcdFx0aG90a2V5czogW3sgbW9kaWZpZXJzOiBbJ0N0cmwnLCAnU2hpZnQnXSwga2V5OiAnbScgfV0sXG5cdFx0XHRjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHR0aGlzLm9wZW5JbWFnZUxpYnJhcnkoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIEN0cmwrU2hpZnQrVSBcdTY3RTVcdTYyN0VcdTY3MkFcdTVGMTVcdTc1MjhcdTVBOTJcdTRGNTNcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdmaW5kLXVucmVmZXJlbmNlZC1tZWRpYS1zaG9ydGN1dCcsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEZpbmRVbnJlZmVyZW5jZWRNZWRpYScpLFxuXHRcdFx0aG90a2V5czogW3sgbW9kaWZpZXJzOiBbJ0N0cmwnLCAnU2hpZnQnXSwga2V5OiAndScgfV0sXG5cdFx0XHRjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmZpbmRVbnJlZmVyZW5jZWRJbWFnZXMoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIEN0cmwrU2hpZnQrVCBcdTYyNTNcdTVGMDBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTdCQTFcdTc0MDZcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdvcGVuLXRyYXNoLW1hbmFnZW1lbnQtc2hvcnRjdXQnLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWRPcGVuVHJhc2hNYW5hZ2VtZW50JyksXG5cdFx0XHRob3RrZXlzOiBbeyBtb2RpZmllcnM6IFsnQ3RybCcsICdTaGlmdCddLCBrZXk6ICd0JyB9XSxcblx0XHRcdGNhbGxiYWNrOiAoKSA9PiB7XG5cdFx0XHRcdHRoaXMub3BlblRyYXNoTWFuYWdlbWVudCgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkNFOFx1NTE4QyBWYXVsdCBcdTRFOEJcdTRFRjZcdTc2RDFcdTU0MkNcblx0ICovXG5cdHByaXZhdGUgcmVnaXN0ZXJWYXVsdEV2ZW50TGlzdGVuZXJzKCkge1xuXHRcdC8vIFx1NTlENFx1NjI1OFx1N0VEOSBNZWRpYUZpbGVJbmRleCBcdTU5MDRcdTc0MDZcdTU4OUVcdTkxQ0ZcdTdEMjJcdTVGMTVcdTY2RjRcdTY1QjBcblx0XHR0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oJ2NyZWF0ZScsIChmaWxlOiBUQWJzdHJhY3RGaWxlKSA9PiB7XG5cdFx0XHR0aGlzLmZpbGVJbmRleC5vbkZpbGVDcmVhdGVkKGZpbGUpO1xuXHRcdFx0dGhpcy5oYW5kbGVWYXVsdEZpbGVDaGFuZ2UoZmlsZSk7XG5cdFx0fSkpO1xuXHRcdHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC52YXVsdC5vbignZGVsZXRlJywgKGZpbGU6IFRBYnN0cmFjdEZpbGUpID0+IHtcblx0XHRcdHRoaXMuZmlsZUluZGV4Lm9uRmlsZURlbGV0ZWQoZmlsZSk7XG5cdFx0XHR0aGlzLmhhbmRsZVZhdWx0RmlsZUNoYW5nZShmaWxlKTtcblx0XHR9KSk7XG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKCdtb2RpZnknLCAoZmlsZTogVEFic3RyYWN0RmlsZSkgPT4ge1xuXHRcdFx0dGhpcy5maWxlSW5kZXgub25GaWxlTW9kaWZpZWQoZmlsZSk7XG5cdFx0XHR0aGlzLmhhbmRsZVZhdWx0RmlsZUNoYW5nZShmaWxlKTtcblx0XHR9KSk7XG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKCdyZW5hbWUnLCAoZmlsZTogVEFic3RyYWN0RmlsZSwgb2xkUGF0aDogc3RyaW5nKSA9PiB7XG5cdFx0XHR0aGlzLmZpbGVJbmRleC5vbkZpbGVSZW5hbWVkKGZpbGUsIG9sZFBhdGgpO1xuXHRcdFx0dGhpcy5oYW5kbGVWYXVsdEZpbGVDaGFuZ2UoZmlsZSwgb2xkUGF0aCk7XG5cdFx0fSkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTIxRFx1NTlDQlx1NTMxNlx1NjAyN1x1ODBGRFx1NTdGQVx1Nzg0MFx1OEJCRVx1NjVCRFxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBpbml0UGVyZm9ybWFuY2VJbmZyYSgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHQvLyBcdTYyNTNcdTVGMDBcdTdGMjlcdTc1NjVcdTU2RkVcdTdGMTNcdTVCNThcblx0XHRhd2FpdCB0aGlzLnRodW1ibmFpbENhY2hlLm9wZW4oKTtcblxuXHRcdC8vIFx1NTIxRFx1NTlDQlx1NTMxNlx1NjU4N1x1NEVGNlx1N0QyMlx1NUYxNVxuXHRcdHRoaXMuZmlsZUluZGV4ID0gbmV3IE1lZGlhRmlsZUluZGV4KHRoaXMuYXBwLnZhdWx0LCB0aGlzLnRodW1ibmFpbENhY2hlKTtcblx0XHRhd2FpdCB0aGlzLnN5bmNQZXJmb3JtYW5jZUluZnJhU2V0dGluZ3ModHJ1ZSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1NDBDXHU2QjY1XHU2MDI3XHU4MEZEXHU1N0ZBXHU3ODQwXHU4QkJFXHU2NUJEXHU5MTREXHU3RjZFXG5cdCAqIFx1NUY1M1x1NUE5Mlx1NEY1M1x1N0M3Qlx1NTc4Qlx1NjIxNlx1OTY5NFx1NzlCQlx1NzZFRVx1NUY1NVx1NTNEMVx1NzUxRlx1NTNEOFx1NTMxNlx1NjVGNlx1RkYwQ1x1OTcwMFx1ODk4MVx1OTFDRFx1NUVGQVx1NjU4N1x1NEVGNlx1N0QyMlx1NUYxNVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBzeW5jUGVyZm9ybWFuY2VJbmZyYVNldHRpbmdzKGZvcmNlRnVsbFNjYW46IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IGVuYWJsZWRFeHRlbnNpb25zID0gZ2V0RW5hYmxlZEV4dGVuc2lvbnModGhpcy5zZXR0aW5ncyk7XG5cdFx0Y29uc3QgdHJhc2hGb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodGhpcy5zZXR0aW5ncy50cmFzaEZvbGRlcikgfHwgREVGQVVMVF9TRVRUSU5HUy50cmFzaEZvbGRlcjtcblx0XHRjb25zdCBleHRlbnNpb25zS2V5ID0gWy4uLmVuYWJsZWRFeHRlbnNpb25zXS5zb3J0KCkuam9pbignfCcpO1xuXHRcdGNvbnN0IG5lZWRzUmVzY2FuID0gZm9yY2VGdWxsU2NhblxuXHRcdFx0fHwgIXRoaXMuZmlsZUluZGV4LmlzSW5pdGlhbGl6ZWRcblx0XHRcdHx8IHRoaXMuaW5kZXhlZEV4dGVuc2lvbnNLZXkgIT09IGV4dGVuc2lvbnNLZXlcblx0XHRcdHx8IHRoaXMuaW5kZXhlZFRyYXNoRm9sZGVyICE9PSB0cmFzaEZvbGRlcjtcblxuXHRcdHRoaXMuZmlsZUluZGV4LnNldEVuYWJsZWRFeHRlbnNpb25zKGVuYWJsZWRFeHRlbnNpb25zKTtcblx0XHR0aGlzLmZpbGVJbmRleC5zZXRUcmFzaEZvbGRlcih0cmFzaEZvbGRlcik7XG5cdFx0dGhpcy5pbmRleGVkRXh0ZW5zaW9uc0tleSA9IGV4dGVuc2lvbnNLZXk7XG5cdFx0dGhpcy5pbmRleGVkVHJhc2hGb2xkZXIgPSB0cmFzaEZvbGRlcjtcblxuXHRcdGlmIChuZWVkc1Jlc2Nhbikge1xuXHRcdFx0YXdhaXQgdGhpcy5maWxlSW5kZXguZnVsbFNjYW4oKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU1OTA0XHU3NDA2IFZhdWx0IFx1NjU4N1x1NEVGNlx1NTNEOFx1NTMxNlxuXHQgKi9cblx0cHJpdmF0ZSBoYW5kbGVWYXVsdEZpbGVDaGFuZ2UoZmlsZTogVEFic3RyYWN0RmlsZSwgb2xkUGF0aD86IHN0cmluZykge1xuXHRcdGlmIChmaWxlIGluc3RhbmNlb2YgVEZvbGRlcikge1xuXHRcdFx0dGhpcy5jbGVhckNhY2hlKCk7XG5cdFx0XHRpZiAodGhpcy5zZXR0aW5ncy5hdXRvUmVmcmVzaCkge1xuXHRcdFx0XHR0aGlzLnNjaGVkdWxlUmVmcmVzaE9wZW5WaWV3cygpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBub3JtYWxpemVkT2xkUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChvbGRQYXRoIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGNvbnN0IG9sZFdhc01hcmtkb3duID0gbm9ybWFsaXplZE9sZFBhdGguZW5kc1dpdGgoJy5tZCcpO1xuXHRcdGNvbnN0IG9sZFdhc01lZGlhID0gbm9ybWFsaXplZE9sZFBhdGggPyBpc01lZGlhRmlsZShub3JtYWxpemVkT2xkUGF0aCkgOiBmYWxzZTtcblx0XHRjb25zdCBpc01hcmtkb3duID0gZmlsZS5leHRlbnNpb24gPT09ICdtZCc7XG5cdFx0Y29uc3QgaXNNZWRpYSA9IGlzTWVkaWFGaWxlKGZpbGUubmFtZSk7XG5cblx0XHQvLyBNYXJrZG93biBcdTUzRDhcdTY2RjRcdTRGMUFcdTVGNzFcdTU0Q0RcdTVGMTVcdTc1MjhcdTUxNzNcdTdDRkJcdUZGMENcdTk3MDBcdTZFMDVcdTk2NjRcdTdGMTNcdTVCNThcblx0XHRpZiAoaXNNYXJrZG93biB8fCBvbGRXYXNNYXJrZG93bikge1xuXHRcdFx0dGhpcy5jbGVhckNhY2hlKCk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU0RUM1XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHU1M0Q4XHU2NkY0XHVGRjA4XHU1MzA1XHU1NDJCXHU5MUNEXHU1NDdEXHU1NDBEXHU1MjREXHU2NjJGXHU1QTkyXHU0RjUzXHVGRjA5XHU2MjREXHU4OUU2XHU1M0QxXHU4OUM2XHU1NkZFXHU1MjM3XHU2NUIwXG5cdFx0aWYgKCFpc01lZGlhICYmICFvbGRXYXNNZWRpYSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICghKGlzTWFya2Rvd24gfHwgb2xkV2FzTWFya2Rvd24pKSB7XG5cdFx0XHR0aGlzLmNsZWFyQ2FjaGUoKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5zZXR0aW5ncy5hdXRvUmVmcmVzaCkge1xuXHRcdFx0dGhpcy5zY2hlZHVsZVJlZnJlc2hPcGVuVmlld3MoKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU5NjMyXHU2Mjk2XHU1MjM3XHU2NUIwXHU1REYyXHU2MjUzXHU1RjAwXHU4OUM2XHU1NkZFXG5cdCAqL1xuXHRwcml2YXRlIHNjaGVkdWxlUmVmcmVzaE9wZW5WaWV3cyhkZWxheU1zOiBudW1iZXIgPSAzMDApIHtcblx0XHRpZiAodGhpcy5yZWZyZXNoVmlld3NUaW1lcikge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMucmVmcmVzaFZpZXdzVGltZXIpO1xuXHRcdH1cblxuXHRcdHRoaXMucmVmcmVzaFZpZXdzVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdHRoaXMucmVmcmVzaFZpZXdzVGltZXIgPSBudWxsO1xuXHRcdFx0dm9pZCB0aGlzLnJlZnJlc2hPcGVuVmlld3MoKTtcblx0XHR9LCBkZWxheU1zKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTUyMzdcdTY1QjBcdTYyNDBcdTY3MDlcdTVERjJcdTYyNTNcdTVGMDBcdTc2ODRcdTYzRDJcdTRFRjZcdTg5QzZcdTU2RkVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcmVmcmVzaE9wZW5WaWV3cygpIHtcblx0XHRjb25zdCB0YXNrczogUHJvbWlzZTx1bmtub3duPltdID0gW107XG5cblx0XHRmb3IgKGNvbnN0IGxlYWYgb2YgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfSU1BR0VfTElCUkFSWSkpIHtcblx0XHRcdGNvbnN0IHZpZXcgPSBsZWFmLnZpZXc7XG5cdFx0XHRpZiAodmlldyBpbnN0YW5jZW9mIEltYWdlTGlicmFyeVZpZXcpIHtcblx0XHRcdFx0dGFza3MucHVzaCh2aWV3LnJlZnJlc2hJbWFnZXMoKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChjb25zdCBsZWFmIG9mIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVMpKSB7XG5cdFx0XHRjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuXHRcdFx0aWYgKHZpZXcgaW5zdGFuY2VvZiBVbnJlZmVyZW5jZWRJbWFnZXNWaWV3KSB7XG5cdFx0XHRcdHRhc2tzLnB1c2godmlldy5zY2FuVW5yZWZlcmVuY2VkSW1hZ2VzKCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgbGVhZiBvZiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9UUkFTSF9NQU5BR0VNRU5UKSkge1xuXHRcdFx0Y29uc3QgdmlldyA9IGxlYWYudmlldztcblx0XHRcdGlmICh2aWV3IGluc3RhbmNlb2YgVHJhc2hNYW5hZ2VtZW50Vmlldykge1xuXHRcdFx0XHR0YXNrcy5wdXNoKHZpZXcubG9hZFRyYXNoSXRlbXMoKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHRhc2tzLmxlbmd0aCA+IDApIHtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZCh0YXNrcyk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjI1M1x1NUYwMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1N0JBMVx1NzQwNlx1ODlDNlx1NTZGRVxuXHQgKi9cblx0YXN5bmMgb3BlblRyYXNoTWFuYWdlbWVudCgpIHtcblx0XHRjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG5cblx0XHRsZXQgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX1RSQVNIX01BTkFHRU1FTlQpWzBdO1xuXHRcdGlmICghbGVhZikge1xuXHRcdFx0bGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKCd0YWInKTtcblx0XHRcdGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcblx0XHRcdFx0dHlwZTogVklFV19UWVBFX1RSQVNIX01BTkFHRU1FTlQsXG5cdFx0XHRcdGFjdGl2ZTogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjI1M1x1NUYwMFx1NUE5Mlx1NEY1M1x1OTg4NFx1ODlDOFxuXHQgKi9cblx0b3Blbk1lZGlhUHJldmlldyhmaWxlOiBURmlsZSkge1xuXHRcdGlmICghdGhpcy5zZXR0aW5ncy5lbmFibGVQcmV2aWV3TW9kYWwpIHtcblx0XHRcdGNvbnN0IHNyYyA9IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcblx0XHRcdHdpbmRvdy5vcGVuKHNyYywgJ19ibGFuaycsICdub29wZW5lcixub3JlZmVycmVyJyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdG5ldyBNZWRpYVByZXZpZXdNb2RhbCh0aGlzLmFwcCwgdGhpcywgZmlsZSkub3BlbigpO1xuXHR9XG5cblx0b251bmxvYWQoKSB7XG5cdFx0aWYgKHRoaXMucmVmcmVzaFZpZXdzVGltZXIpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLnJlZnJlc2hWaWV3c1RpbWVyKTtcblx0XHRcdHRoaXMucmVmcmVzaFZpZXdzVGltZXIgPSBudWxsO1xuXHRcdH1cblx0XHQvLyBcdTUxNzNcdTk1RURcdTdGMjlcdTc1NjVcdTU2RkVcdTdGMTNcdTVCNThcblx0XHR0aGlzLnRodW1ibmFpbENhY2hlLmNsb3NlKCk7XG5cdFx0dGhpcy5maWxlSW5kZXguY2xlYXIoKTtcblxuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0lNQUdFX0xJQlJBUlkpO1xuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVMpO1xuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFX1RSQVNIX01BTkFHRU1FTlQpO1xuXHRcdHRoaXMuYXBwLndvcmtzcGFjZS5kZXRhY2hMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0RVUExJQ0FURV9ERVRFQ1RJT04pO1xuXHRcdHRoaXMucmVtb3ZlTWFuYWdlZFN0eWxlcygpO1xuXHR9XG5cblx0cHJpdmF0ZSByZW1vdmVNYW5hZ2VkU3R5bGVzKCkge1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdvYnNpZGlhbi1tZWRpYS10b29sa2l0LXN0eWxlcycpPy5yZW1vdmUoKTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1hZ2UtbWFuYWdlci1zdHlsZXMnKT8ucmVtb3ZlKCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2MjUzXHU1RjAwXHU5MUNEXHU1OTBEXHU2OEMwXHU2RDRCXHU4OUM2XHU1NkZFXG5cdCAqL1xuXHRhc3luYyBvcGVuRHVwbGljYXRlRGV0ZWN0aW9uKCkge1xuXHRcdGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcblx0XHRsZXQgbGVhZiA9IHdvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0RVUExJQ0FURV9ERVRFQ1RJT04pWzBdO1xuXHRcdGlmICghbGVhZikge1xuXHRcdFx0bGVhZiA9IHdvcmtzcGFjZS5nZXRMZWFmKCd0YWInKTtcblx0XHRcdGF3YWl0IGxlYWYuc2V0Vmlld1N0YXRlKHtcblx0XHRcdFx0dHlwZTogVklFV19UWVBFX0RVUExJQ0FURV9ERVRFQ1RJT04sXG5cdFx0XHRcdGFjdGl2ZTogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHdvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuXHR9XG5cblx0Ly8gXHU1MkEwXHU4RjdEXHU2ODM3XHU1RjBGXHU2NTg3XHU0RUY2XG5cdC8vIFx1NkNFOFx1NjEwRlx1RkYxQVx1NEYxOFx1NTE0OFx1NEY3Rlx1NzUyOCBzdHlsZXMuY3NzIFx1NEUyRFx1NzY4NFx1NjgzN1x1NUYwRlx1RkYwQ2FkZFN0eWxlIFx1NEY1Q1x1NEUzQVx1NTQwRVx1NTkwN1x1NjVCOVx1Njg0OFxuXHRhc3luYyBhZGRTdHlsZSgpIHtcblx0XHRjb25zdCBsb2FkZWQgPSBhd2FpdCB0aGlzLmxvYWRFeHRlcm5hbFN0eWxlcygpO1xuXHRcdGlmICghbG9hZGVkKSB7XG5cdFx0XHR0aGlzLmFkZElubGluZVN0eWxlKCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gXHU0RUNFXHU1OTE2XHU5MEU4XHU2ODM3XHU1RjBGXHU2NTg3XHU0RUY2XHU1MkEwXHU4RjdEXG5cdGFzeW5jIGxvYWRFeHRlcm5hbFN0eWxlcygpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHQvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTVERjJcdTVCNThcdTU3MjhcdTY4MzdcdTVGMEZcdTUxNDNcdTdEMjBcdUZGMENcdTkwN0ZcdTUxNERcdTkxQ0RcdTU5MERcdTZERkJcdTUyQTBcblx0XHRpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29ic2lkaWFuLW1lZGlhLXRvb2xraXQtc3R5bGVzJykpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN0eWxlUGF0aHMgPSBbXG5cdFx0XHR0aGlzLm1hbmlmZXN0LmRpciA/IGAke25vcm1hbGl6ZVZhdWx0UGF0aCh0aGlzLm1hbmlmZXN0LmRpcil9L3N0eWxlcy5jc3NgIDogJycsXG5cdFx0XHRgLm9ic2lkaWFuL3BsdWdpbnMvJHt0aGlzLm1hbmlmZXN0LmlkfS9zdHlsZXMuY3NzYCxcblx0XHRcdCdzdHlsZXMuY3NzJ1xuXHRcdF0uZmlsdGVyKChwYXRoLCBpbmRleCwgYXJyKSA9PiBwYXRoICYmIGFyci5pbmRleE9mKHBhdGgpID09PSBpbmRleCk7XG5cblx0XHR0cnkge1xuXHRcdFx0Zm9yIChjb25zdCBzdHlsZVBhdGggb2Ygc3R5bGVQYXRocykge1xuXHRcdFx0XHRpZiAoIWF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIuZXhpc3RzKHN0eWxlUGF0aCkpIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLnJlYWQoc3R5bGVQYXRoKTtcblx0XHRcdFx0Y29uc3Qgc2FuaXRpemVkQ3NzID0gY29udGVudFxuXHRcdFx0XHRcdC8vIFx1OTYzQlx1NkI2MiBleHByZXNzaW9uKCkgXHU3QjQ5IEphdmFTY3JpcHQgXHU2MjY3XHU4ODRDXG5cdFx0XHRcdFx0LnJlcGxhY2UoL2V4cHJlc3Npb25cXHMqXFwoL2dpLCAnLyogYmxvY2tlZCAqLygnKVxuXHRcdFx0XHRcdC5yZXBsYWNlKC9qYXZhc2NyaXB0XFxzKjovZ2ksICcvKiBibG9ja2VkICovOicpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL3Zic2NyaXB0XFxzKjovZ2ksICcvKiBibG9ja2VkICovOicpXG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyIHVybCgpIFx1NUYxNVx1NzUyOFx1NTkxNlx1OTBFOFx1OEQ0NFx1NkU5MFxuXHRcdFx0XHRcdC5yZXBsYWNlKC91cmxcXHMqXFwoW14pXSpcXCkvZ2ksICcvKiB1cmwoKSBibG9ja2VkICovJylcblx0XHRcdFx0XHQvLyBcdTk2M0JcdTZCNjIgQGltcG9ydCBcdTVGMTVcdTUxNjVcdTU5MTZcdTkwRThcdTY4MzdcdTVGMEZcblx0XHRcdFx0XHQucmVwbGFjZSgvQGltcG9ydFxccypbXjtdKzsvZ2ksICcvKiBAaW1wb3J0IGJsb2NrZWQgKi8nKVxuXHRcdFx0XHRcdC8vIFx1OTYzQlx1NkI2Mlx1NEU4Qlx1NEVGNlx1NTkwNFx1NzQwNlx1NTY2OFx1NUM1RVx1NjAyNyAob25jbGljaywgb25lcnJvciwgb25sb2FkLCBvbm1vdXNlb3ZlciBcdTdCNDkpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL1xcYm9uKGNsaWNrfGVycm9yfGxvYWR8bW91c2VvdmVyfG1vdXNlb3V0fGZvY3VzfGJsdXJ8Y2hhbmdlfHN1Ym1pdHxrZXlkb3dufGtleXVwKVxccyo9L2dpLCAnZGF0YS1ibG9ja2VkLW9uJDE9Jylcblx0XHRcdFx0XHQvLyBcdTk2M0JcdTZCNjIgZmlsdGVyOnVybCgpIFx1NUYxNVx1NzUyOFx1NTkxNlx1OTBFOFx1OEQ0NFx1NkU5MFxuXHRcdFx0XHRcdC5yZXBsYWNlKC9maWx0ZXJcXHMqOlxccyp1cmxcXHMqXFwoW14pXSpcXCkvZ2ksICcvKiBmaWx0ZXI6dXJsKCkgYmxvY2tlZCAqLycpXG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyIGJlaGF2aW9yIChJRSBcdTg4NENcdTRFM0FcdTVDNUVcdTYwMjcpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL2JlaGF2aW9yXFxzKjovZ2ksICcvKiBiZWhhdmlvciBibG9ja2VkICovOicpXG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyIC1tcy1iZWhhdmlvciAoSUUgXHU0RTEzXHU2NzA5KVxuXHRcdFx0XHRcdC5yZXBsYWNlKC8tbXMtYmVoYXZpb3JcXHMqOi9naSwgJy8qIC1tcy1iZWhhdmlvciBibG9ja2VkICovOicpXG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyIGJpbmRpbmcgKFhVTCBcdTdFRDFcdTVCOUEpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL2JpbmRpbmdcXHMqOlxccyp1cmxcXHMqXFwoW14pXSpcXCkvZ2ksICcvKiBiaW5kaW5nIGJsb2NrZWQgKi8nKVxuXHRcdFx0XHRcdC8vIFx1OTYzQlx1NkI2MiBhbmltYXRpb24vdHJhbnNpdGlvbiBcdTRFMkRcdTc2ODQgdXJsKClcblx0XHRcdFx0XHQucmVwbGFjZSgvKGFuaW1hdGlvbnx0cmFuc2l0aW9uKVxccyo6W147XSp1cmxcXHMqXFwoW14pXSpcXCkvZ2ksICcvKiAkMSB1cmwoKSBibG9ja2VkICovJyk7XG5cdFx0XHRcdGNvbnN0IHN0eWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuXHRcdFx0XHRzdHlsZUVsLmlkID0gJ29ic2lkaWFuLW1lZGlhLXRvb2xraXQtc3R5bGVzJztcblx0XHRcdFx0c3R5bGVFbC50ZXh0Q29udGVudCA9IHNhbml0aXplZENzcztcblx0XHRcdFx0ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZUVsKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdcdTUyQTBcdThGN0RcdTU5MTZcdTkwRThcdTY4MzdcdTVGMEZcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjVcdUZGMENcdTRGN0ZcdTc1MjhcdTUxODVcdTgwNTRcdTY4MzdcdTVGMEYnLCBlcnJvcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gXHU1MTg1XHU4MDU0XHU2ODM3XHU1RjBGXHVGRjA4XHU1NDBFXHU1OTA3XHU2NUI5XHU2ODQ4XHVGRjA5XG5cdGFkZElubGluZVN0eWxlKCkge1xuXHRcdC8vIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NURGMlx1NUI1OFx1NTcyOFx1NjgzN1x1NUYwRlx1NTE0M1x1N0QyMFx1RkYwQ1x1OTA3Rlx1NTE0RFx1OTFDRFx1NTkwRFx1NkRGQlx1NTJBMFxuXHRcdGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW1hZ2UtbWFuYWdlci1zdHlsZXMnKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN0eWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuXHRcdHN0eWxlRWwuaWQgPSAnaW1hZ2UtbWFuYWdlci1zdHlsZXMnO1xuXHRcdHN0eWxlRWwudGV4dENvbnRlbnQgPSBgLyogT2JzaWRpYW4gSW1hZ2UgTWFuYWdlciBQbHVnaW4gU3R5bGVzICovXG5cbi8qID09PT09IFx1NTE2OFx1NUM0MFx1NjgzN1x1NUYwRiA9PT09PSAqL1xuLmltYWdlLWxpYnJhcnktdmlldyxcbi51bnJlZmVyZW5jZWQtaW1hZ2VzLXZpZXcge1xuXHRoZWlnaHQ6IDEwMCU7XG5cdG92ZXJmbG93LXk6IGF1dG87XG5cdHBhZGRpbmc6IDE2cHg7XG5cdGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG59XG5cbi8qID09PT09IFx1NTkzNFx1OTBFOFx1NjgzN1x1NUYwRiA9PT09PSAqL1xuLmltYWdlLWxpYnJhcnktaGVhZGVyLFxuLnVucmVmZXJlbmNlZC1oZWFkZXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG5cdG1hcmdpbi1ib3R0b206IDIwcHg7XG5cdHBhZGRpbmctYm90dG9tOiAxNnB4O1xuXHRib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4uaW1hZ2UtbGlicmFyeS1oZWFkZXIgaDIsXG4udW5yZWZlcmVuY2VkLWhlYWRlciBoMiB7XG5cdG1hcmdpbjogMDtcblx0Zm9udC1zaXplOiAxLjVlbTtcblx0Zm9udC13ZWlnaHQ6IDYwMDtcbn1cblxuLmltYWdlLXN0YXRzLFxuLmhlYWRlci1kZXNjcmlwdGlvbiB7XG5cdG1hcmdpbi10b3A6IDRweDtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRmb250LXNpemU6IDAuOWVtO1xufVxuXG4uaGVhZGVyLWRlc2NyaXB0aW9uIHtcblx0ZGlzcGxheTogZmxleDtcblx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblx0Z2FwOiA0cHg7XG59XG5cbi8qID09PT09IFx1NjMwOVx1OTRBRVx1NjgzN1x1NUYwRiA9PT09PSAqL1xuLnJlZnJlc2gtYnV0dG9uLFxuLmFjdGlvbi1idXR0b24sXG4uaXRlbS1idXR0b24ge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0cGFkZGluZzogOHB4O1xuXHRib3JkZXI6IG5vbmU7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Y29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRjdXJzb3I6IHBvaW50ZXI7XG5cdHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4ycywgY29sb3IgMC4ycztcbn1cblxuLnJlZnJlc2gtYnV0dG9uOmhvdmVyLFxuLmFjdGlvbi1idXR0b246aG92ZXIsXG4uaXRlbS1idXR0b246aG92ZXIge1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcbn1cblxuLnJlZnJlc2gtYnV0dG9uIHN2Zyxcbi5hY3Rpb24tYnV0dG9uIHN2Zyxcbi5pdGVtLWJ1dHRvbiBzdmcge1xuXHR3aWR0aDogMTZweDtcblx0aGVpZ2h0OiAxNnB4O1xufVxuXG4uYWN0aW9uLWJ1dHRvbi5kYW5nZXIsXG4uaXRlbS1idXR0b24uZGFuZ2VyIHtcblx0Y29sb3I6IHZhcigtLXRleHQtZXJyb3IpO1xufVxuXG4uYWN0aW9uLWJ1dHRvbi5kYW5nZXI6aG92ZXIsXG4uaXRlbS1idXR0b24uZGFuZ2VyOmhvdmVyIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1lcnJvcik7XG5cdGNvbG9yOiB3aGl0ZTtcbn1cblxuLmhlYWRlci1hY3Rpb25zIHtcblx0ZGlzcGxheTogZmxleDtcblx0Z2FwOiA4cHg7XG59XG5cbi8qID09PT09IFx1NjM5Mlx1NUU4Rlx1OTAwOVx1NjJFOVx1NTY2OCA9PT09PSAqL1xuLnNvcnQtc2VsZWN0IHtcblx0cGFkZGluZzogNnB4IDEycHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG5cdGZvbnQtc2l6ZTogMC45ZW07XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLm9yZGVyLWJ1dHRvbiB7XG5cdHBhZGRpbmc6IDZweCA4cHg7XG5cdG1hcmdpbi1sZWZ0OiA4cHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLm9yZGVyLWJ1dHRvbiBzdmcge1xuXHR3aWR0aDogMTZweDtcblx0aGVpZ2h0OiAxNnB4O1xufVxuXG4vKiA9PT09PSBcdTU2RkVcdTcyNDdcdTdGNTFcdTY4M0MgPT09PT0gKi9cbi5pbWFnZS1ncmlkIHtcblx0ZGlzcGxheTogZ3JpZDtcblx0Z2FwOiAxNnB4O1xuXHRncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpbGwsIG1pbm1heCgxNTBweCwgMWZyKSk7XG59XG5cbi5pbWFnZS1ncmlkLXNtYWxsIHtcblx0Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoYXV0by1maWxsLCBtaW5tYXgoMTAwcHgsIDFmcikpO1xufVxuXG4uaW1hZ2UtZ3JpZC1tZWRpdW0ge1xuXHRncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpbGwsIG1pbm1heCgxNTBweCwgMWZyKSk7XG59XG5cbi5pbWFnZS1ncmlkLWxhcmdlIHtcblx0Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoYXV0by1maWxsLCBtaW5tYXgoMjAwcHgsIDFmcikpO1xufVxuXG4vKiA9PT09PSBcdTU2RkVcdTcyNDdcdTk4NzkgPT09PT0gKi9cbi5pbWFnZS1pdGVtIHtcblx0ZGlzcGxheTogZmxleDtcblx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA4cHg7XG5cdG92ZXJmbG93OiBoaWRkZW47XG5cdHRyYW5zaXRpb246IHRyYW5zZm9ybSAwLjJzLCBib3gtc2hhZG93IDAuMnM7XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLmltYWdlLWl0ZW06aG92ZXIge1xuXHR0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTJweCk7XG5cdGJveC1zaGFkb3c6IDAgNHB4IDEycHggcmdiYSgwLCAwLCAwLCAwLjE1KTtcbn1cblxuLmltYWdlLWNvbnRhaW5lciB7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcblx0d2lkdGg6IDEwMCU7XG5cdHBhZGRpbmctdG9wOiAxMDAlO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcbn1cblxuLmltYWdlLWNvbnRhaW5lciBpbWcge1xuXHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdHRvcDogMDtcblx0bGVmdDogMDtcblx0d2lkdGg6IDEwMCU7XG5cdGhlaWdodDogMTAwJTtcblx0b2JqZWN0LWZpdDogY292ZXI7XG59XG5cbi5pbWFnZS1pbmZvIHtcblx0cGFkZGluZzogOHB4O1xuXHRib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4uaW1hZ2UtbmFtZSB7XG5cdGZvbnQtc2l6ZTogMC44NWVtO1xuXHRmb250LXdlaWdodDogNTAwO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHR0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcblx0d2hpdGUtc3BhY2U6IG5vd3JhcDtcbn1cblxuLmltYWdlLXNpemUge1xuXHRmb250LXNpemU6IDAuNzVlbTtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRtYXJnaW4tdG9wOiAycHg7XG59XG5cbi8qID09PT09IFx1NjcyQVx1NUYxNVx1NzUyOFx1NTZGRVx1NzI0N1x1NTIxN1x1ODg2OCA9PT09PSAqL1xuLnN0YXRzLWJhciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogMTZweDtcblx0cGFkZGluZzogMTJweCAxNnB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0bWFyZ2luLWJvdHRvbTogMTZweDtcbn1cblxuLnN0YXRzLWNvdW50IHtcblx0Zm9udC13ZWlnaHQ6IDYwMDtcblx0Y29sb3I6IHZhcigtLXRleHQtd2FybmluZyk7XG59XG5cbi5zdGF0cy1zaXplIHtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4udW5yZWZlcmVuY2VkLWxpc3Qge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRnYXA6IDEycHg7XG59XG5cbi51bnJlZmVyZW5jZWQtaXRlbSB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogMTZweDtcblx0cGFkZGluZzogMTJweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA4cHg7XG5cdHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4ycztcbn1cblxuLnVucmVmZXJlbmNlZC1pdGVtOmhvdmVyIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC10ZXJ0aWFyeSk7XG59XG5cbi5pdGVtLXRodW1ibmFpbCB7XG5cdHdpZHRoOiA2MHB4O1xuXHRoZWlnaHQ6IDYwcHg7XG5cdGZsZXgtc2hyaW5rOiAwO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdG92ZXJmbG93OiBoaWRkZW47XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4uaXRlbS10aHVtYm5haWwgaW1nIHtcblx0d2lkdGg6IDEwMCU7XG5cdGhlaWdodDogMTAwJTtcblx0b2JqZWN0LWZpdDogY292ZXI7XG59XG5cbi5pdGVtLWluZm8ge1xuXHRmbGV4OiAxO1xuXHRtaW4td2lkdGg6IDA7XG59XG5cbi5pdGVtLW5hbWUge1xuXHRmb250LXdlaWdodDogNTAwO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHR0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcblx0d2hpdGUtc3BhY2U6IG5vd3JhcDtcbn1cblxuLml0ZW0tcGF0aCB7XG5cdGZvbnQtc2l6ZTogMC44ZW07XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0b3ZlcmZsb3c6IGhpZGRlbjtcblx0dGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG5cdHdoaXRlLXNwYWNlOiBub3dyYXA7XG5cdG1hcmdpbi10b3A6IDJweDtcbn1cblxuLml0ZW0tc2l6ZSB7XG5cdGZvbnQtc2l6ZTogMC44NWVtO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdG1hcmdpbi10b3A6IDRweDtcbn1cblxuLml0ZW0tYWN0aW9ucyB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGdhcDogOHB4O1xuXHRmbGV4LXNocmluazogMDtcbn1cblxuLyogPT09PT0gXHU3QTdBXHU3MkI2XHU2MDAxID09PT09ICovXG4uZW1wdHktc3RhdGUsXG4ubG9hZGluZy1zdGF0ZSxcbi5zdWNjZXNzLXN0YXRlLFxuLmVycm9yLXN0YXRlIHtcblx0ZGlzcGxheTogZmxleDtcblx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0anVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG5cdHBhZGRpbmc6IDQ4cHg7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4uZW1wdHktc3RhdGU6OmJlZm9yZSB7XG5cdGNvbnRlbnQ6ICdcdUQ4M0RcdUREQkNcdUZFMEYnO1xuXHRmb250LXNpemU6IDQ4cHg7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG59XG5cbi5zdWNjZXNzLXN0YXRlOjpiZWZvcmUge1xuXHRjb250ZW50OiAnXHUyNzA1Jztcblx0Zm9udC1zaXplOiA0OHB4O1xuXHRtYXJnaW4tYm90dG9tOiAxNnB4O1xufVxuXG4uZXJyb3Itc3RhdGU6OmJlZm9yZSB7XG5cdGNvbnRlbnQ6ICdcdTI3NEMnO1xuXHRmb250LXNpemU6IDQ4cHg7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG59XG5cbi8qIFx1NTJBMFx1OEY3RFx1NTJBOFx1NzUzQiAqL1xuLnNwaW5uZXIge1xuXHR3aWR0aDogMzJweDtcblx0aGVpZ2h0OiAzMnB4O1xuXHRib3JkZXI6IDNweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG5cdGJvcmRlci10b3AtY29sb3I6IHZhcigtLXRleHQtYWNjZW50KTtcblx0Ym9yZGVyLXJhZGl1czogNTAlO1xuXHRhbmltYXRpb246IHNwaW4gMXMgbGluZWFyIGluZmluaXRlO1xuXHRtYXJnaW4tYm90dG9tOiAxNnB4O1xufVxuXG5Aa2V5ZnJhbWVzIHNwaW4ge1xuXHR0byB7XG5cdFx0dHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTtcblx0fVxufVxuXG4vKiA9PT09PSBcdThCQkVcdTdGNkVcdTk4NzVcdTk3NjJcdTY4MzdcdTVGMEYgPT09PT0gKi9cbi5zZXR0aW5ncy1kaXZpZGVyIHtcblx0bWFyZ2luOiAyNHB4IDA7XG5cdGJvcmRlcjogbm9uZTtcblx0Ym9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbn1cblxuLnNldHRpbmdzLWRlc2NyaXB0aW9uIHtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRtYXJnaW4tYm90dG9tOiA4cHg7XG59XG5cbi5zZXR0aW5ncy1saXN0IHtcblx0bWFyZ2luOiAwO1xuXHRwYWRkaW5nLWxlZnQ6IDIwcHg7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLnNldHRpbmdzLWxpc3QgbGkge1xuXHRtYXJnaW4tYm90dG9tOiA0cHg7XG59XG5cbi8qID09PT09IFx1NjQxQ1x1N0QyMlx1Njg0Nlx1NjgzN1x1NUYwRiA9PT09PSAqL1xuLnNlYXJjaC1jb250YWluZXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRnYXA6IDhweDtcblx0bWFyZ2luLWJvdHRvbTogMTZweDtcblx0cGFkZGluZzogOHB4IDEycHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xufVxuXG4uc2VhcmNoLWlucHV0IHtcblx0ZmxleDogMTtcblx0cGFkZGluZzogOHB4IDEycHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRmb250LXNpemU6IDAuOWVtO1xufVxuXG4uc2VhcmNoLWlucHV0OmZvY3VzIHtcblx0b3V0bGluZTogbm9uZTtcblx0Ym9yZGVyLWNvbG9yOiB2YXIoLS10ZXh0LWFjY2VudCk7XG59XG5cbi5zZWFyY2gtaWNvbiB7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLnNlYXJjaC1yZXN1bHRzLWNvdW50IHtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRmb250LXNpemU6IDAuODVlbTtcbn1cblxuLmNsZWFyLXNlYXJjaCB7XG5cdHBhZGRpbmc6IDRweDtcblx0Ym9yZGVyOiBub25lO1xuXHRiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi5jbGVhci1zZWFyY2g6aG92ZXIge1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xufVxuXG4vKiA9PT09PSBcdTUyMDZcdTk4NzVcdTYzQTdcdTRFRjYgPT09PT0gKi9cbi5wYWdpbmF0aW9uIHtcblx0ZGlzcGxheTogZmxleDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0anVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG5cdGdhcDogMTJweDtcblx0bWFyZ2luLXRvcDogMjBweDtcblx0cGFkZGluZzogMTZweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG59XG5cbi5wYWdlLWJ1dHRvbiB7XG5cdHBhZGRpbmc6IDZweCAxMnB4O1xuXHRib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi5wYWdlLWJ1dHRvbjpob3Zlcjpub3QoOmRpc2FibGVkKSB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4ucGFnZS1idXR0b246ZGlzYWJsZWQge1xuXHRvcGFjaXR5OiAwLjU7XG5cdGN1cnNvcjogbm90LWFsbG93ZWQ7XG59XG5cbi5wYWdlLWluZm8ge1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdGZvbnQtc2l6ZTogMC45ZW07XG59XG5cbi5wYWdlLWp1bXAtaW5wdXQge1xuXHR3aWR0aDogNTBweDtcblx0cGFkZGluZzogNHB4IDhweDtcblx0Ym9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtcHJpbWFyeSk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG5cdHRleHQtYWxpZ246IGNlbnRlcjtcbn1cblxuLyogPT09PT0gXHU5MDA5XHU2MkU5XHU2QTIxXHU1RjBGXHU1REU1XHU1MTc3XHU2ODBGID09PT09ICovXG4uc2VsZWN0aW9uLXRvb2xiYXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRnYXA6IDEycHg7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG5cdHBhZGRpbmc6IDEycHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xufVxuXG4uc2VsZWN0aW9uLWNvdW50IHtcblx0Zm9udC13ZWlnaHQ6IDYwMDtcblx0Y29sb3I6IHZhcigtLXRleHQtYWNjZW50KTtcbn1cblxuLnRvb2xiYXItYnV0dG9uIHtcblx0ZGlzcGxheTogZmxleDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0anVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG5cdHBhZGRpbmc6IDhweDtcblx0Ym9yZGVyOiBub25lO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcblx0Y29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi50b29sYmFyLWJ1dHRvbjpob3ZlciB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbn1cblxuLnRvb2xiYXItYnV0dG9uLmRhbmdlciB7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LWVycm9yKTtcbn1cblxuLnRvb2xiYXItYnV0dG9uLmRhbmdlcjpob3ZlciB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItZXJyb3IpO1xuXHRjb2xvcjogd2hpdGU7XG59XG5cbi8qID09PT09IFx1NTZGRVx1NzI0N1x1OTAwOVx1NjJFOVx1Njg0NiA9PT09PSAqL1xuLmltYWdlLWl0ZW0ge1xuXHRwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbi5pdGVtLWNoZWNrYm94IHtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6IDhweDtcblx0bGVmdDogOHB4O1xuXHR6LWluZGV4OiAxMDtcblx0d2lkdGg6IDE4cHg7XG5cdGhlaWdodDogMThweDtcblx0Y3Vyc29yOiBwb2ludGVyO1xufVxuXG4vKiA9PT09PSBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTdCQTFcdTc0MDZcdTg5QzZcdTU2RkUgPT09PT0gKi9cbi50cmFzaC1tYW5hZ2VtZW50LXZpZXcge1xuXHRoZWlnaHQ6IDEwMCU7XG5cdG92ZXJmbG93LXk6IGF1dG87XG5cdHBhZGRpbmc6IDE2cHg7XG5cdGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG59XG5cbi50cmFzaC1oZWFkZXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG5cdG1hcmdpbi1ib3R0b206IDIwcHg7XG5cdHBhZGRpbmctYm90dG9tOiAxNnB4O1xuXHRib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4udHJhc2gtaGVhZGVyIGgyIHtcblx0bWFyZ2luOiAwO1xuXHRmb250LXNpemU6IDEuNWVtO1xuXHRmb250LXdlaWdodDogNjAwO1xufVxuXG4udHJhc2gtbGlzdCB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG5cdGdhcDogMTJweDtcbn1cblxuLnRyYXNoLWl0ZW0ge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRnYXA6IDE2cHg7XG5cdHBhZGRpbmc6IDEycHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Ym9yZGVyLXJhZGl1czogOHB4O1xuXHR0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMnM7XG59XG5cbi50cmFzaC1pdGVtOmhvdmVyIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC10ZXJ0aWFyeSk7XG59XG5cbi5pdGVtLWljb24ge1xuXHR3aWR0aDogNDBweDtcblx0aGVpZ2h0OiA0MHB4O1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC10ZXJ0aWFyeSk7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4uaXRlbS1vcmlnaW5hbC1wYXRoIHtcblx0Zm9udC1zaXplOiAwLjhlbTtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRtYXJnaW4tdG9wOiAycHg7XG59XG5cbi5pdGVtLWRhdGUge1xuXHRmb250LXNpemU6IDAuOGVtO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdG1hcmdpbi10b3A6IDJweDtcbn1cblxuLyogPT09PT0gXHU1QTkyXHU0RjUzXHU5ODg0XHU4OUM4IE1vZGFsID09PT09ICovXG4ubWVkaWEtcHJldmlldy1tb2RhbCB7XG5cdG1heC13aWR0aDogOTB2dztcblx0bWF4LWhlaWdodDogOTB2aDtcbn1cblxuLm1lZGlhLXByZXZpZXctbW9kYWwgLm1vZGFsLWNvbnRlbnQge1xuXHRwYWRkaW5nOiAwO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpO1xufVxuXG4ucHJldmlldy1jbG9zZSB7XG5cdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOiAxMHB4O1xuXHRyaWdodDogMTVweDtcblx0Zm9udC1zaXplOiAyNHB4O1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdGN1cnNvcjogcG9pbnRlcjtcblx0ei1pbmRleDogMTAwO1xufVxuXG4ucHJldmlldy1jbG9zZTpob3ZlciB7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG59XG5cbi5wcmV2aWV3LWNvbnRhaW5lciB7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcblx0ZGlzcGxheTogZmxleDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0anVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG5cdG1pbi1oZWlnaHQ6IDQwMHB4O1xuXHRtYXgtaGVpZ2h0OiA3MHZoO1xuXHRvdmVyZmxvdzogYXV0bztcbn1cblxuLnByZXZpZXctaW1hZ2Uge1xuXHRtYXgtd2lkdGg6IDEwMCU7XG5cdG1heC1oZWlnaHQ6IDcwdmg7XG5cdG9iamVjdC1maXQ6IGNvbnRhaW47XG59XG5cbi5wcmV2aWV3LXZpZGVvLFxuLnByZXZpZXctYXVkaW8ge1xuXHRtYXgtd2lkdGg6IDEwMCU7XG59XG5cbi5wcmV2aWV3LXBkZiB7XG5cdHdpZHRoOiAxMDAlO1xuXHRoZWlnaHQ6IDcwdmg7XG5cdGJvcmRlcjogbm9uZTtcbn1cblxuLnByZXZpZXctdW5zdXBwb3J0ZWQge1xuXHRwYWRkaW5nOiA0MHB4O1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG59XG5cbi5wcmV2aWV3LW5hdiB7XG5cdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOiA1MCU7XG5cdHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKTtcblx0bGVmdDogMDtcblx0cmlnaHQ6IDA7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2Vlbjtcblx0cGFkZGluZzogMCAyMHB4O1xuXHRwb2ludGVyLWV2ZW50czogbm9uZTtcbn1cblxuLm5hdi1idXR0b24ge1xuXHRwb2ludGVyLWV2ZW50czogYXV0bztcblx0Zm9udC1zaXplOiAzMnB4O1xuXHRwYWRkaW5nOiAxMHB4IDE1cHg7XG5cdGJvcmRlcjogbm9uZTtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLm5hdi1idXR0b246aG92ZXIge1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcbn1cblxuLm5hdi1pbmZvIHtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHRib3R0b206IDEwcHg7XG5cdGxlZnQ6IDUwJTtcblx0dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpO1xuXHRwYWRkaW5nOiA0cHggMTJweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGZvbnQtc2l6ZTogMC45ZW07XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLnByZXZpZXctaW5mby1iYXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG5cdHBhZGRpbmc6IDEycHggMjBweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4uaW5mby1uYW1lIHtcblx0Zm9udC13ZWlnaHQ6IDUwMDtcbn1cblxuLmluZm8tYWN0aW9ucyB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGdhcDogOHB4O1xufVxuXG4uaW5mby1hY3Rpb25zIGJ1dHRvbiB7XG5cdHBhZGRpbmc6IDRweCA4cHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcblx0Y29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcblx0Y3Vyc29yOiBwb2ludGVyO1xufVxuXG4uaW5mby1hY3Rpb25zIGJ1dHRvbjpob3ZlciB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4vKiA9PT09PSBcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEJcdUZGMDhcdTU0MEVcdTU5MDdcdTY4MzdcdTVGMEZcdUZGMDkgPT09PT0gKi9cbi5kdXBsaWNhdGUtZW1wdHktc3RhdGUge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0Z2FwOiAxNnB4O1xuXHRwYWRkaW5nOiA0OHB4IDI0cHg7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4uZHVwbGljYXRlLWVtcHR5LWFjdGlvbiB7XG5cdG1hcmdpbi10b3A6IDhweDtcbn1cblxuLmR1cGxpY2F0ZS1zY2FuLXByb2dyZXNzIHtcblx0cGFkZGluZzogMjBweDtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4uZHVwbGljYXRlLXByb2dyZXNzLWJhciB7XG5cdGhlaWdodDogOHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0b3ZlcmZsb3c6IGhpZGRlbjtcblx0bWFyZ2luOiAxNnB4IDA7XG59XG5cbi5kdXBsaWNhdGUtcHJvZ3Jlc3MtZmlsbCB7XG5cdGhlaWdodDogMTAwJTtcblx0YmFja2dyb3VuZDogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHR0cmFuc2l0aW9uOiB3aWR0aCAwLjNzIGVhc2U7XG59XG5cbi5kdXBsaWNhdGUtcHJvZ3Jlc3MtdGV4dCB7XG5cdGZvbnQtc2l6ZTogMC45ZW07XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLmR1cGxpY2F0ZS1kZXRlY3Rpb24tdmlldyB7XG5cdGhlaWdodDogMTAwJTtcblx0b3ZlcmZsb3cteTogYXV0bztcblx0cGFkZGluZzogMTZweDtcblx0Ym94LXNpemluZzogYm9yZGVyLWJveDtcbn1cblxuLmR1cGxpY2F0ZS1oZWFkZXIge1xuXHRtYXJnaW4tYm90dG9tOiAxNnB4O1xuXHRwYWRkaW5nLWJvdHRvbTogMTJweDtcblx0Ym9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbn1cblxuLmR1cGxpY2F0ZS1oZWFkZXItZGVzY3JpcHRpb24ge1xuXHRtYXJnaW4tdG9wOiA0cHg7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0Zm9udC1zaXplOiAwLjllbTtcbn1cblxuLmR1cGxpY2F0ZS1oZWFkZXItYWN0aW9ucyB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGZsZXgtd3JhcDogd3JhcDtcblx0Z2FwOiA4cHg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdG1hcmdpbi10b3A6IDhweDtcbn1cblxuLmR1cGxpY2F0ZS1hY3Rpb24tYnV0dG9uIHtcblx0ZGlzcGxheTogaW5saW5lLWZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGp1c3RpZnktY29udGVudDogY2VudGVyO1xuXHRnYXA6IDRweDtcblx0cGFkZGluZzogOHB4IDEycHg7XG5cdGJvcmRlcjogbm9uZTtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG5cdGN1cnNvcjogcG9pbnRlcjtcblx0dHJhbnNpdGlvbjogYmFja2dyb3VuZCAwLjJzLCBjb2xvciAwLjJzLCBvcGFjaXR5IDAuMnM7XG59XG5cbi5kdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbjpob3Zlcjpub3QoOmRpc2FibGVkKSB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4uZHVwbGljYXRlLWFjdGlvbi1idXR0b246ZGlzYWJsZWQge1xuXHRvcGFjaXR5OiAwLjY7XG5cdGN1cnNvcjogd2FpdDtcbn1cblxuLmR1cGxpY2F0ZS1hY3Rpb24tYnV0dG9uLXByaW1hcnkge1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1vbi1hY2NlbnQpO1xufVxuXG4uZHVwbGljYXRlLWFjdGlvbi1idXR0b24tcHJpbWFyeTpob3Zlcjpub3QoOmRpc2FibGVkKSB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWludGVyYWN0aXZlLWFjY2VudC1ob3Zlcik7XG59XG5cbi5kdXBsaWNhdGUtdGhyZXNob2xkLWxhYmVsIHtcblx0Zm9udC1zaXplOiAwLjg1ZW07XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLmR1cGxpY2F0ZS1zdGF0cy1iYXIge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRnYXA6IDE2cHg7XG5cdHBhZGRpbmc6IDEycHggMTZweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG59XG5cbi5kdXBsaWNhdGUtc3RhdHMtY291bnQge1xuXHRmb250LXdlaWdodDogNjAwO1xuXHRjb2xvcjogdmFyKC0tdGV4dC13YXJuaW5nKTtcbn1cblxuLmR1cGxpY2F0ZS1ncm91cCB7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogOHB4O1xuXHRvdmVyZmxvdzogaGlkZGVuO1xufVxuXG4uZHVwbGljYXRlLWdyb3VwLWhlYWRlciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2Vlbjtcblx0cGFkZGluZzogOHB4IDEycHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Zm9udC13ZWlnaHQ6IDYwMDtcbn1cblxuLmR1cGxpY2F0ZS1ncm91cC1jb3VudCB7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0Zm9udC13ZWlnaHQ6IG5vcm1hbDtcblx0Zm9udC1zaXplOiAwLjg1ZW07XG59XG5cbi5kdXBsaWNhdGUtZ3JvdXAtZmlsZSB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogMTBweDtcblx0cGFkZGluZzogOHB4IDEycHg7XG5cdGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLmR1cGxpY2F0ZS1rZWVwLXN1Z2dlc3Rpb24ge1xuXHRiYWNrZ3JvdW5kOiByZ2JhKDAsIDIwMCwgODMsIDAuMDUpO1xufVxuXG4uZHVwbGljYXRlLWZpbGUtc3VnZ2VzdGlvbiB7XG5cdGJhY2tncm91bmQ6IHJnYmEoMjU1LCAxNTIsIDAsIDAuMDUpO1xufVxuXG4uZHVwbGljYXRlLWZpbGUtdGh1bWJuYWlsIHtcblx0d2lkdGg6IDYwcHg7XG5cdGhlaWdodDogNjBweDtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHRmbGV4LXNocmluazogMDtcbn1cblxuLmR1cGxpY2F0ZS1maWxlLXRodW1ibmFpbCBpbWcge1xuXHR3aWR0aDogMTAwJTtcblx0aGVpZ2h0OiAxMDAlO1xuXHRvYmplY3QtZml0OiBjb3Zlcjtcbn1cblxuLmR1cGxpY2F0ZS1maWxlLWluZm8ge1xuXHRmbGV4OiAxO1xuXHRtaW4td2lkdGg6IDA7XG59XG5cbi5kdXBsaWNhdGUtZmlsZS1uYW1lLFxuLmR1cGxpY2F0ZS1maWxlLXBhdGgge1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHR0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcblx0d2hpdGUtc3BhY2U6IG5vd3JhcDtcbn1cblxuLmR1cGxpY2F0ZS1maWxlLW5hbWUge1xuXHRmb250LXdlaWdodDogNTAwO1xufVxuXG4uZHVwbGljYXRlLWZpbGUtcGF0aCxcbi5kdXBsaWNhdGUtZmlsZS1tZXRhIHtcblx0Zm9udC1zaXplOiAwLjhlbTtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4uZHVwbGljYXRlLXNpbWlsYXJpdHktYmFkZ2Uge1xuXHRkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG5cdHBhZGRpbmc6IDFweCA2cHg7XG5cdGJvcmRlci1yYWRpdXM6IDhweDtcblx0YmFja2dyb3VuZDogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcblx0Y29sb3I6IHZhcigtLXRleHQtb24tYWNjZW50KTtcblx0Zm9udC1zaXplOiAwLjc1ZW07XG5cdGZvbnQtd2VpZ2h0OiA2MDA7XG59XG5cbi5kdXBsaWNhdGUta2VlcC1iYWRnZSB7XG5cdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOiA4cHg7XG5cdHJpZ2h0OiAxMnB4O1xuXHRmb250LXNpemU6IDAuODVlbTtcbn1cblxuLmR1cGxpY2F0ZS1xdWFyYW50aW5lLWJ0biB7XG5cdGRpc3BsYXk6IGlubGluZS1mbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRnYXA6IDRweDtcblx0cGFkZGluZzogNHB4IDEwcHg7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0Zm9udC1zaXplOiAwLjhlbTtcblx0Y3Vyc29yOiBwb2ludGVyO1xuXHRiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMTUyLCAwLCAwLjE1KTtcblx0Y29sb3I6IHZhcigtLWNvbG9yLW9yYW5nZSwgI2ZmOTgwMCk7XG5cdGJvcmRlcjogbm9uZTtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6IDhweDtcblx0cmlnaHQ6IDEycHg7XG59XG5cbi5kdXBsaWNhdGUtcXVhcmFudGluZS1idG46aG92ZXIge1xuXHRiYWNrZ3JvdW5kOiByZ2JhKDI1NSwgMTUyLCAwLCAwLjMpO1xufVxuXG4vKiA9PT09PSBcdTU0Q0RcdTVFOTRcdTVGMEZcdThCQkVcdThCQTEgPT09PT0gKi9cbkBtZWRpYSAobWF4LXdpZHRoOiA3NjhweCkge1xuXHQuaW1hZ2UtbGlicmFyeS1oZWFkZXIsXG5cdC51bnJlZmVyZW5jZWQtaGVhZGVyIHtcblx0XHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRcdGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuXHRcdGdhcDogMTJweDtcblx0fVxuXG5cdC5oZWFkZXItYWN0aW9ucyB7XG5cdFx0d2lkdGg6IDEwMCU7XG5cdFx0anVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcblx0fVxuXG5cdC51bnJlZmVyZW5jZWQtaXRlbSB7XG5cdFx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblx0XHRhbGlnbi1pdGVtczogZmxleC1zdGFydDtcblx0fVxuXG5cdC5pdGVtLWFjdGlvbnMge1xuXHRcdHdpZHRoOiAxMDAlO1xuXHRcdGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG5cdFx0bWFyZ2luLXRvcDogOHB4O1xuXHR9XG59YDtcblx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlRWwpO1xuXHR9XG5cblx0YXN5bmMgbG9hZFNldHRpbmdzKCkge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBsb2FkZWQgPSBhd2FpdCB0aGlzLmxvYWREYXRhKCk7XG5cdFx0XHRjb25zdCBzYW5pdGl6ZWQgPSBsb2FkZWQgJiYgdHlwZW9mIGxvYWRlZCA9PT0gJ29iamVjdCdcblx0XHRcdFx0PyBPYmplY3QuZnJvbUVudHJpZXMoXG5cdFx0XHRcdFx0T2JqZWN0LmVudHJpZXMobG9hZGVkKS5maWx0ZXIoKFtrXSkgPT5cblx0XHRcdFx0XHRcdGsgIT09ICdfX3Byb3RvX18nICYmIGsgIT09ICdjb25zdHJ1Y3RvcicgJiYgayAhPT0gJ3Byb3RvdHlwZSdcblx0XHRcdFx0XHQpXG5cdFx0XHRcdClcblx0XHRcdFx0OiB7fTtcblx0XHRcdGNvbnN0IG1lcmdlZCA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIHNhbml0aXplZCkgYXMgUGFydGlhbDxJbWFnZU1hbmFnZXJTZXR0aW5ncz4gJiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcblx0XHRcdGNvbnN0IHRvQm9vbCA9ICh2YWx1ZTogdW5rbm93biwgZmFsbGJhY2s6IGJvb2xlYW4pOiBib29sZWFuID0+XG5cdFx0XHRcdHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nID8gdmFsdWUgOiBmYWxsYmFjaztcblxuXHRcdFx0Y29uc3QgaW1hZ2VGb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodHlwZW9mIG1lcmdlZC5pbWFnZUZvbGRlciA9PT0gJ3N0cmluZycgPyBtZXJnZWQuaW1hZ2VGb2xkZXIgOiAnJyk7XG5cdFx0XHRjb25zdCB0cmFzaEZvbGRlclJhdyA9IHR5cGVvZiBtZXJnZWQudHJhc2hGb2xkZXIgPT09ICdzdHJpbmcnID8gbWVyZ2VkLnRyYXNoRm9sZGVyIDogREVGQVVMVF9TRVRUSU5HUy50cmFzaEZvbGRlcjtcblx0XHRcdGNvbnN0IHRyYXNoRm9sZGVyID0gbm9ybWFsaXplVmF1bHRQYXRoKHRyYXNoRm9sZGVyUmF3KSB8fCBERUZBVUxUX1NFVFRJTkdTLnRyYXNoRm9sZGVyO1xuXG5cdFx0XHR0aGlzLnNldHRpbmdzID0ge1xuXHRcdFx0XHQuLi5ERUZBVUxUX1NFVFRJTkdTLFxuXHRcdFx0XHQuLi5tZXJnZWQsXG5cdFx0XHRcdGltYWdlRm9sZGVyLFxuXHRcdFx0XHR0cmFzaEZvbGRlcixcblx0XHRcdFx0dGh1bWJuYWlsU2l6ZTogWydzbWFsbCcsICdtZWRpdW0nLCAnbGFyZ2UnXS5pbmNsdWRlcyhTdHJpbmcobWVyZ2VkLnRodW1ibmFpbFNpemUpKVxuXHRcdFx0XHRcdD8gbWVyZ2VkLnRodW1ibmFpbFNpemUgYXMgJ3NtYWxsJyB8ICdtZWRpdW0nIHwgJ2xhcmdlJ1xuXHRcdFx0XHRcdDogREVGQVVMVF9TRVRUSU5HUy50aHVtYm5haWxTaXplLFxuXHRcdFx0XHRzb3J0Qnk6IFsnbmFtZScsICdkYXRlJywgJ3NpemUnXS5pbmNsdWRlcyhTdHJpbmcobWVyZ2VkLnNvcnRCeSkpXG5cdFx0XHRcdFx0PyBtZXJnZWQuc29ydEJ5IGFzICduYW1lJyB8ICdkYXRlJyB8ICdzaXplJ1xuXHRcdFx0XHRcdDogREVGQVVMVF9TRVRUSU5HUy5zb3J0QnksXG5cdFx0XHRcdHNvcnRPcmRlcjogWydhc2MnLCAnZGVzYyddLmluY2x1ZGVzKFN0cmluZyhtZXJnZWQuc29ydE9yZGVyKSlcblx0XHRcdFx0XHQ/IG1lcmdlZC5zb3J0T3JkZXIgYXMgJ2FzYycgfCAnZGVzYydcblx0XHRcdFx0XHQ6IERFRkFVTFRfU0VUVElOR1Muc29ydE9yZGVyLFxuXHRcdFx0XHRkZWZhdWx0QWxpZ25tZW50OiBbJ2xlZnQnLCAnY2VudGVyJywgJ3JpZ2h0J10uaW5jbHVkZXMoU3RyaW5nKG1lcmdlZC5kZWZhdWx0QWxpZ25tZW50KSlcblx0XHRcdFx0XHQ/IG1lcmdlZC5kZWZhdWx0QWxpZ25tZW50IGFzICdsZWZ0JyB8ICdjZW50ZXInIHwgJ3JpZ2h0J1xuXHRcdFx0XHRcdDogREVGQVVMVF9TRVRUSU5HUy5kZWZhdWx0QWxpZ25tZW50LFxuXHRcdFx0XHRsYW5ndWFnZTogWyd6aCcsICdlbicsICdzeXN0ZW0nXS5pbmNsdWRlcyhTdHJpbmcobWVyZ2VkLmxhbmd1YWdlKSlcblx0XHRcdFx0XHQ/IG1lcmdlZC5sYW5ndWFnZSBhcyAnemgnIHwgJ2VuJyB8ICdzeXN0ZW0nXG5cdFx0XHRcdFx0OiAnc3lzdGVtJyxcblx0XHRcdFx0dHJhc2hDbGVhbnVwRGF5czogTWF0aC5tYXgoMSwgTWF0aC5taW4oMzY1LCBOdW1iZXIobWVyZ2VkLnRyYXNoQ2xlYW51cERheXMpIHx8IERFRkFVTFRfU0VUVElOR1MudHJhc2hDbGVhbnVwRGF5cykpLFxuXHRcdFx0XHRwYWdlU2l6ZTogTWF0aC5tYXgoMSwgTWF0aC5taW4oMTAwMCwgTnVtYmVyKG1lcmdlZC5wYWdlU2l6ZSkgfHwgREVGQVVMVF9TRVRUSU5HUy5wYWdlU2l6ZSkpLFxuXHRcdFx0XHRzaG93SW1hZ2VJbmZvOiB0b0Jvb2wobWVyZ2VkLnNob3dJbWFnZUluZm8sIERFRkFVTFRfU0VUVElOR1Muc2hvd0ltYWdlSW5mbyksXG5cdFx0XHRcdGF1dG9SZWZyZXNoOiB0b0Jvb2wobWVyZ2VkLmF1dG9SZWZyZXNoLCBERUZBVUxUX1NFVFRJTkdTLmF1dG9SZWZyZXNoKSxcblx0XHRcdFx0dXNlVHJhc2hGb2xkZXI6IHRvQm9vbChtZXJnZWQudXNlVHJhc2hGb2xkZXIsIERFRkFVTFRfU0VUVElOR1MudXNlVHJhc2hGb2xkZXIpLFxuXHRcdFx0XHRhdXRvQ2xlYW51cFRyYXNoOiB0b0Jvb2wobWVyZ2VkLmF1dG9DbGVhbnVwVHJhc2gsIERFRkFVTFRfU0VUVElOR1MuYXV0b0NsZWFudXBUcmFzaCksXG5cdFx0XHRcdGVuYWJsZUltYWdlczogdG9Cb29sKG1lcmdlZC5lbmFibGVJbWFnZXMsIERFRkFVTFRfU0VUVElOR1MuZW5hYmxlSW1hZ2VzKSxcblx0XHRcdFx0ZW5hYmxlVmlkZW9zOiB0b0Jvb2wobWVyZ2VkLmVuYWJsZVZpZGVvcywgREVGQVVMVF9TRVRUSU5HUy5lbmFibGVWaWRlb3MpLFxuXHRcdFx0XHRlbmFibGVBdWRpbzogdG9Cb29sKG1lcmdlZC5lbmFibGVBdWRpbywgREVGQVVMVF9TRVRUSU5HUy5lbmFibGVBdWRpbyksXG5cdFx0XHRcdGVuYWJsZVBERjogdG9Cb29sKG1lcmdlZC5lbmFibGVQREYsIERFRkFVTFRfU0VUVElOR1MuZW5hYmxlUERGKSxcblx0XHRcdFx0ZW5hYmxlUHJldmlld01vZGFsOiB0b0Jvb2wobWVyZ2VkLmVuYWJsZVByZXZpZXdNb2RhbCwgREVGQVVMVF9TRVRUSU5HUy5lbmFibGVQcmV2aWV3TW9kYWwpLFxuXHRcdFx0XHRlbmFibGVLZXlib2FyZE5hdjogdG9Cb29sKG1lcmdlZC5lbmFibGVLZXlib2FyZE5hdiwgREVGQVVMVF9TRVRUSU5HUy5lbmFibGVLZXlib2FyZE5hdiksXG5cdFx0XHRcdC8vIFx1NjVCMFx1NTg5RVx1OEJCRVx1N0Y2RVx1NUI1N1x1NkJCNVxuXHRcdFx0XHRzYWZlU2NhbkVuYWJsZWQ6IHRvQm9vbChtZXJnZWQuc2FmZVNjYW5FbmFibGVkLCBERUZBVUxUX1NFVFRJTkdTLnNhZmVTY2FuRW5hYmxlZCksXG5cdFx0XHRcdHNhZmVTY2FuVW5yZWZEYXlzOiBNYXRoLm1heCgxLCBNYXRoLm1pbigzNjUsIE51bWJlcihtZXJnZWQuc2FmZVNjYW5VbnJlZkRheXMpIHx8IERFRkFVTFRfU0VUVElOR1Muc2FmZVNjYW5VbnJlZkRheXMpKSxcblx0XHRcdFx0c2FmZVNjYW5NaW5TaXplOiBNYXRoLm1heCgwLCBOdW1iZXIobWVyZ2VkLnNhZmVTY2FuTWluU2l6ZSkgfHwgREVGQVVMVF9TRVRUSU5HUy5zYWZlU2Nhbk1pblNpemUpLFxuXHRcdFx0XHRkdXBsaWNhdGVUaHJlc2hvbGQ6IE1hdGgubWF4KDUwLCBNYXRoLm1pbigxMDAsIE51bWJlcihtZXJnZWQuZHVwbGljYXRlVGhyZXNob2xkKSB8fCBERUZBVUxUX1NFVFRJTkdTLmR1cGxpY2F0ZVRocmVzaG9sZCkpLFxuXHRcdFx0XHRvcmdhbml6ZVJ1bGVzOiBBcnJheS5pc0FycmF5KG1lcmdlZC5vcmdhbml6ZVJ1bGVzKSA/IG1lcmdlZC5vcmdhbml6ZVJ1bGVzIDogREVGQVVMVF9TRVRUSU5HUy5vcmdhbml6ZVJ1bGVzLFxuXHRcdFx0XHRkZWZhdWx0UHJvY2Vzc1F1YWxpdHk6IE1hdGgubWF4KDEsIE1hdGgubWluKDEwMCwgTnVtYmVyKG1lcmdlZC5kZWZhdWx0UHJvY2Vzc1F1YWxpdHkpIHx8IERFRkFVTFRfU0VUVElOR1MuZGVmYXVsdFByb2Nlc3NRdWFsaXR5KSksXG5cdFx0XHRcdGRlZmF1bHRQcm9jZXNzRm9ybWF0OiBbJ3dlYnAnLCAnanBlZycsICdwbmcnXS5pbmNsdWRlcyhTdHJpbmcobWVyZ2VkLmRlZmF1bHRQcm9jZXNzRm9ybWF0KSlcblx0XHRcdFx0XHQ/IG1lcmdlZC5kZWZhdWx0UHJvY2Vzc0Zvcm1hdCBhcyAnd2VicCcgfCAnanBlZycgfCAncG5nJ1xuXHRcdFx0XHRcdDogREVGQVVMVF9TRVRUSU5HUy5kZWZhdWx0UHJvY2Vzc0Zvcm1hdCxcblx0XHRcdFx0d2F0ZXJtYXJrVGV4dDogdHlwZW9mIG1lcmdlZC53YXRlcm1hcmtUZXh0ID09PSAnc3RyaW5nJyA/IG1lcmdlZC53YXRlcm1hcmtUZXh0IDogREVGQVVMVF9TRVRUSU5HUy53YXRlcm1hcmtUZXh0XG5cdFx0XHR9O1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdTUyQTBcdThGN0RcdThCQkVcdTdGNkVcdTU5MzFcdThEMjVcdUZGMENcdTRGN0ZcdTc1MjhcdTlFRDhcdThCQTRcdThCQkVcdTdGNkU6JywgZXJyb3IpO1xuXHRcdFx0dGhpcy5zZXR0aW5ncyA9IHsgLi4uREVGQVVMVF9TRVRUSU5HUyB9O1xuXHRcdH1cblx0fVxuXG5cdGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcblx0XHR0aGlzLnNldHRpbmdzLmltYWdlRm9sZGVyID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMuc2V0dGluZ3MuaW1hZ2VGb2xkZXIpO1xuXHRcdHRoaXMuc2V0dGluZ3MudHJhc2hGb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodGhpcy5zZXR0aW5ncy50cmFzaEZvbGRlcikgfHwgREVGQVVMVF9TRVRUSU5HUy50cmFzaEZvbGRlcjtcblx0XHRhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuXHRcdGF3YWl0IHRoaXMuc3luY1BlcmZvcm1hbmNlSW5mcmFTZXR0aW5ncygpO1xuXHRcdHRoaXMuY2xlYXJDYWNoZSgpO1xuXHRcdHRoaXMuc2NoZWR1bGVSZWZyZXNoT3BlblZpZXdzKDE1MCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTA1XHU5NjY0XHU1RjE1XHU3NTI4XHU3RjEzXHU1QjU4XG5cdCAqIFx1NUY1M1x1OEJCRVx1N0Y2RVx1NTNEOFx1NjZGNFx1NUY3MVx1NTRDRFx1N0YxM1x1NUI1OFx1NjcwOVx1NjU0OFx1NjAyN1x1NjVGNlx1OEMwM1x1NzUyOFxuXHQgKi9cblx0Y2xlYXJDYWNoZSgpIHtcblx0XHR0aGlzLnJlZmVyZW5jZWRJbWFnZXNDYWNoZSA9IG51bGw7XG5cdFx0dGhpcy5jYWNoZVRpbWVzdGFtcCA9IDA7XG5cdH1cblxuXHRhc3luYyBvcGVuSW1hZ2VMaWJyYXJ5KCkge1xuXHRcdGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcblxuXHRcdGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfSU1BR0VfTElCUkFSWSlbMF07XG5cdFx0aWYgKCFsZWFmKSB7XG5cdFx0XHRsZWFmID0gd29ya3NwYWNlLmdldExlYWYoJ3RhYicpO1xuXHRcdFx0YXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuXHRcdFx0XHR0eXBlOiBWSUVXX1RZUEVfSU1BR0VfTElCUkFSWSxcblx0XHRcdFx0YWN0aXZlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0d29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cdH1cblxuXHRhc3luYyBmaW5kVW5yZWZlcmVuY2VkSW1hZ2VzKCkge1xuXHRcdGNvbnN0IHsgd29ya3NwYWNlIH0gPSB0aGlzLmFwcDtcblxuXHRcdGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfVU5SRUZFUkVOQ0VEX0lNQUdFUylbMF07XG5cdFx0aWYgKCFsZWFmKSB7XG5cdFx0XHRsZWFmID0gd29ya3NwYWNlLmdldExlYWYoJ3RhYicpO1xuXHRcdFx0YXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuXHRcdFx0XHR0eXBlOiBWSUVXX1RZUEVfVU5SRUZFUkVOQ0VEX0lNQUdFUyxcblx0XHRcdFx0YWN0aXZlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0d29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cdH1cblxuXHQvLyBcdTgzQjdcdTUzRDZcdTYyNDBcdTY3MDlcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdUZGMDhcdTU2RkVcdTcyNDdcdTMwMDFcdTk3RjNcdTg5QzZcdTk4OTFcdTMwMDFcdTY1ODdcdTY4NjNcdUZGMDlcblx0YXN5bmMgZ2V0QWxsSW1hZ2VGaWxlcygpOiBQcm9taXNlPFRGaWxlW10+IHtcblx0XHQvLyBcdTRFQ0VcdThCQkVcdTdGNkVcdTRFMkRcdTgzQjdcdTUzRDZcdTU0MkZcdTc1MjhcdTc2ODRcdTYyNjlcdTVDNTVcdTU0MERcblx0XHRjb25zdCBlbmFibGVkRXh0ZW5zaW9ucyA9IGdldEVuYWJsZWRFeHRlbnNpb25zKHtcblx0XHRcdGVuYWJsZUltYWdlczogdGhpcy5zZXR0aW5ncy5lbmFibGVJbWFnZXMsXG5cdFx0XHRlbmFibGVWaWRlb3M6IHRoaXMuc2V0dGluZ3MuZW5hYmxlVmlkZW9zLFxuXHRcdFx0ZW5hYmxlQXVkaW86IHRoaXMuc2V0dGluZ3MuZW5hYmxlQXVkaW8sXG5cdFx0XHRlbmFibGVQREY6IHRoaXMuc2V0dGluZ3MuZW5hYmxlUERGXG5cdFx0fSk7XG5cblx0XHQvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTYyNDBcdTY3MDlcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEJcdTkwRkRcdTg4QUJcdTc5ODFcdTc1Mjhcblx0XHRpZiAoZW5hYmxlZEV4dGVuc2lvbnMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnYWxsTWVkaWFUeXBlc0Rpc2FibGVkJykpO1xuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFsbEZpbGVzID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZXMoKTtcblx0XHRyZXR1cm4gYWxsRmlsZXMuZmlsdGVyKGZpbGUgPT5cblx0XHRcdGVuYWJsZWRFeHRlbnNpb25zLnNvbWUoZXh0ID0+IGZpbGUubmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKGV4dCkpXG5cdFx0KTtcblx0fVxuXG5cdC8vIFx1ODNCN1x1NTNENlx1NjI0MFx1NjcwOVx1NTZGRVx1NzI0N1x1NjU4N1x1NEVGNlx1RkYwOFx1NEZERFx1NzU1OVx1NTE3Q1x1NUJCOVx1NjAyN1x1RkYwOVxuXHRhc3luYyBnZXRBbGxNZWRpYUZpbGVzKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuXHRcdHJldHVybiB0aGlzLmdldEFsbEltYWdlRmlsZXMoKTtcblx0fVxuXG5cdC8vIFx1ODNCN1x1NTNENlx1NjI0MFx1NjcwOU1hcmtkb3duXHU2NTg3XHU0RUY2XHU0RTJEXHU1RjE1XHU3NTI4XHU3Njg0XHU1NkZFXHU3MjQ3XG5cdGFzeW5jIGdldFJlZmVyZW5jZWRJbWFnZXMoc2lnbmFsPzogQWJvcnRTaWduYWwpOiBQcm9taXNlPFNldDxzdHJpbmc+PiB7XG5cdFx0Y29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblxuXHRcdC8vIFx1NjhDMFx1NjdFNVx1N0YxM1x1NUI1OFx1NjYyRlx1NTQyNlx1NjcwOVx1NjU0OFxuXHRcdGlmICh0aGlzLnJlZmVyZW5jZWRJbWFnZXNDYWNoZSAmJiAobm93IC0gdGhpcy5jYWNoZVRpbWVzdGFtcCkgPCBJbWFnZU1hbmFnZXJQbHVnaW4uQ0FDSEVfRFVSQVRJT04pIHtcblx0XHRcdHJldHVybiB0aGlzLnJlZmVyZW5jZWRJbWFnZXNDYWNoZTtcblx0XHR9XG5cblx0XHQvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTVERjJcdTRFMkRcdTZCNjJcblx0XHRpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1NjYW4gY2FuY2VsbGVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVmZXJlbmNlZCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXHRcdGNvbnN0IHsgdmF1bHQgfSA9IHRoaXMuYXBwO1xuXHRcdGNvbnN0IGVuYWJsZWRFeHRlbnNpb25zID0gZ2V0RW5hYmxlZEV4dGVuc2lvbnMoe1xuXHRcdFx0ZW5hYmxlSW1hZ2VzOiB0aGlzLnNldHRpbmdzLmVuYWJsZUltYWdlcyxcblx0XHRcdGVuYWJsZVZpZGVvczogdGhpcy5zZXR0aW5ncy5lbmFibGVWaWRlb3MsXG5cdFx0XHRlbmFibGVBdWRpbzogdGhpcy5zZXR0aW5ncy5lbmFibGVBdWRpbyxcblx0XHRcdGVuYWJsZVBERjogdGhpcy5zZXR0aW5ncy5lbmFibGVQREZcblx0XHR9KTtcblx0XHRjb25zdCBleHRlbnNpb25QYXR0ZXJuID0gZW5hYmxlZEV4dGVuc2lvbnMubWFwKGV4dCA9PiBleHQuc2xpY2UoMSkpLmpvaW4oJ3wnKTtcblxuXHRcdGlmICghZXh0ZW5zaW9uUGF0dGVybikge1xuXHRcdFx0dGhpcy5yZWZlcmVuY2VkSW1hZ2VzQ2FjaGUgPSByZWZlcmVuY2VkO1xuXHRcdFx0dGhpcy5jYWNoZVRpbWVzdGFtcCA9IG5vdztcblx0XHRcdHJldHVybiByZWZlcmVuY2VkO1xuXHRcdH1cblxuXHRcdGNvbnN0IHdpa2lMaW5rUGF0dGVyblNvdXJjZSA9IGBcXFxcW1xcXFxbKFteXFxcXF18XStcXFxcLig/OiR7ZXh0ZW5zaW9uUGF0dGVybn0pKSg/OlxcXFx8W15cXFxcXV0qKT9cXFxcXVxcXFxdYDtcblx0XHRjb25zdCBtYXJrZG93bkxpbmtQYXR0ZXJuU291cmNlID0gYCE/XFxcXFtbXlxcXFxdXSpcXFxcXVxcXFwoKFteKV0rXFxcXC4oPzoke2V4dGVuc2lvblBhdHRlcm59KSg/OlxcXFw/W14pI10qKT8oPzojW14pXSspPylcXFxcKWA7XG5cdFx0Y29uc3QgYWRkUmVmZXJlbmNlZFBhdGggPSAocmF3UGF0aDogc3RyaW5nLCBzb3VyY2VGaWxlUGF0aDogc3RyaW5nKSA9PiB7XG5cdFx0XHRpZiAoIXJhd1BhdGgpIHJldHVybjtcblxuXHRcdFx0bGV0IGNhbmRpZGF0ZSA9IHJhd1BhdGgudHJpbSgpO1xuXHRcdFx0aWYgKGNhbmRpZGF0ZS5zdGFydHNXaXRoKCc8JykgJiYgY2FuZGlkYXRlLmVuZHNXaXRoKCc+JykpIHtcblx0XHRcdFx0Y2FuZGlkYXRlID0gY2FuZGlkYXRlLnNsaWNlKDEsIC0xKS50cmltKCk7XG5cdFx0XHR9XG5cblx0XHRcdGNhbmRpZGF0ZSA9IGNhbmRpZGF0ZS5yZXBsYWNlKC9cXFxcIC9nLCAnICcpO1xuXHRcdFx0Y2FuZGlkYXRlID0gc2FmZURlY29kZVVSSUNvbXBvbmVudChjYW5kaWRhdGUpO1xuXG5cdFx0XHRpZiAoL15bYS16XVthLXowLTkrLi1dKjovaS50ZXN0KGNhbmRpZGF0ZSkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBbd2l0aG91dFF1ZXJ5XSA9IGNhbmRpZGF0ZS5zcGxpdCgvWz8jXS8pO1xuXHRcdFx0Y29uc3Qgbm9ybWFsaXplZENhbmRpZGF0ZSA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh3aXRob3V0UXVlcnkpO1xuXHRcdFx0Y29uc3QgcmVzb2x2ZWRGaWxlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChcblx0XHRcdFx0bm9ybWFsaXplZENhbmRpZGF0ZSB8fCB3aXRob3V0UXVlcnksXG5cdFx0XHRcdHNvdXJjZUZpbGVQYXRoXG5cdFx0XHQpO1xuXHRcdFx0Y29uc3Qgbm9ybWFsaXplZCA9IHJlc29sdmVkRmlsZVxuXHRcdFx0XHQ/IG5vcm1hbGl6ZVZhdWx0UGF0aChyZXNvbHZlZEZpbGUucGF0aCkudG9Mb3dlckNhc2UoKVxuXHRcdFx0XHQ6IG5vcm1hbGl6ZWRDYW5kaWRhdGUudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0aWYgKCFub3JtYWxpemVkKSByZXR1cm47XG5cdFx0XHRyZWZlcmVuY2VkLmFkZChub3JtYWxpemVkKTtcblx0XHR9O1xuXG5cdFx0Ly8gXHU0RjdGXHU3NTI4XHU2QjYzXHU1MjE5XHU2MjZCXHU2M0NGXHU2MjQwXHU2NzA5IE1hcmtkb3duIFx1NjU4N1x1NEVGNlxuXHRcdGNvbnN0IG1hcmtkb3duRmlsZXMgPSB2YXVsdC5nZXRGaWxlcygpLmZpbHRlcihmID0+IGYuZXh0ZW5zaW9uID09PSAnbWQnKTtcblx0XHRjb25zdCB0b3RhbEZpbGVzID0gbWFya2Rvd25GaWxlcy5sZW5ndGg7XG5cblx0XHQvLyBcdTYyNkJcdTYzQ0ZcdThEODVcdTY1RjZcdTRGRERcdTYyQTRcdUZGMDhcdTlFRDhcdThCQTQgNSBcdTUyMDZcdTk0OUZcdUZGMDlcblx0XHRjb25zdCBTQ0FOX1RJTUVPVVQgPSA1ICogNjAgKiAxMDAwO1xuXHRcdGNvbnN0IHNjYW5TdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXHRcdGxldCB0aW1lb3V0SWQ6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG5cblx0XHQvLyBcdTU5ODJcdTY3OUNcdTRGMjBcdTUxNjVcdTRFODZcdTU5MTZcdTkwRTggc2lnbmFsXHVGRjBDXHU1MjE5XHU0RTBEXHU4QkJFXHU3RjZFXHU1MTg1XHU5MEU4XHU4RDg1XHU2NUY2XG5cdFx0aWYgKCFzaWduYWwpIHtcblx0XHRcdHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1NjYW4gdGltZW91dCByZWFjaGVkLCByZXR1cm5pbmcgcGFydGlhbCByZXN1bHRzJyk7XG5cdFx0XHR9LCBTQ0FOX1RJTUVPVVQpO1xuXHRcdH1cblxuXHRcdC8vIFx1NzZEMVx1NTQyQ1x1NTkxNlx1OTBFOFx1NEUyRFx1NkI2Mlx1NEZFMVx1NTNGN1xuXHRcdGlmIChzaWduYWwpIHtcblx0XHRcdHNpZ25hbC5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsICgpID0+IHtcblx0XHRcdFx0aWYgKHRpbWVvdXRJZCkge1xuXHRcdFx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnNvbGUud2FybignU2NhbiBhYm9ydGVkIGJ5IGV4dGVybmFsIHNpZ25hbCcpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1QkY5XHU0RThFXHU1OTI3XHU1NzhCIFZhdWx0XHVGRjBDXHU2NjNFXHU3OTNBXHU1RjAwXHU1OUNCXHU2MjZCXHU2M0NGXHU5MDFBXHU3N0U1XG5cdFx0Ly8gXHU2Q0U4XHU2MTBGXHVGRjFBT2JzaWRpYW4gXHU3Njg0IE5vdGljZSBcdTRFMERcdTY1MkZcdTYzMDFcdTUyQThcdTYwMDFcdTY2RjRcdTY1QjBcdUZGMENcdTZCQ0ZcdTZCMjEgc2V0TWVzc2FnZSgpIFx1NEYxQVx1NTIxQlx1NUVGQVx1NjVCMFx1NzY4NCBOb3RpY2Vcblx0XHQvLyBcdTU2RTBcdTZCNjRcdTYyMTFcdTRFRUNcdTUzRUFcdTU3MjhcdTVGMDBcdTU5Q0JcdTY1RjZcdTY2M0VcdTc5M0FcdTRFMDBcdTRFMkFcdTkwMUFcdTc3RTVcdUZGMENcdTYyNkJcdTYzQ0ZcdTVCOENcdTYyMTBcdTU0MEVcdTc1MjhcdTY1QjBcdTc2ODRcdTkwMUFcdTc3RTVcdTY2RkZcdTYzNjJcblx0XHRsZXQgc2Nhbk5vdGljZTogTm90aWNlIHwgbnVsbCA9IG51bGw7XG5cdFx0aWYgKHRvdGFsRmlsZXMgPiAxMDApIHtcblx0XHRcdHNjYW5Ob3RpY2UgPSBuZXcgTm90aWNlKHRoaXMudCgnc2Nhbm5pbmdSZWZlcmVuY2VzJykgKyBgICgwLyR7dG90YWxGaWxlc30pYCwgMCk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MjA2XHU2Mjc5XHU1OTA0XHU3NDA2XHU0RUU1XHU5MDdGXHU1MTREXHU5NjNCXHU1ODVFIFVJXG5cdFx0Y29uc3QgQkFUQ0hfU0laRSA9IDIwO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbWFya2Rvd25GaWxlcy5sZW5ndGg7IGkgKz0gQkFUQ0hfU0laRSkge1xuXHRcdFx0Ly8gXHU2OEMwXHU2N0U1XHU4RDg1XHU2NUY2XHU2MjE2XHU0RTJEXHU2QjYyXG5cdFx0XHRpZiAoRGF0ZS5ub3coKSAtIHNjYW5TdGFydFRpbWUgPiBTQ0FOX1RJTUVPVVQpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdTY2FuIHRpbWVvdXQgcmVhY2hlZCwgcmV0dXJuaW5nIHBhcnRpYWwgcmVzdWx0cycpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHRcdGlmIChzaWduYWw/LmFib3J0ZWQpIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdTY2FuIGFib3J0ZWQnKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGJhdGNoID0gbWFya2Rvd25GaWxlcy5zbGljZShpLCBpICsgQkFUQ0hfU0laRSk7XG5cblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKGJhdGNoLm1hcChhc3luYyAoZmlsZSkgPT4ge1xuXHRcdFx0XHQvLyBcdTY4QzBcdTY3RTVcdTRFMkRcdTZCNjJcdTRGRTFcdTUzRjdcblx0XHRcdFx0aWYgKHNpZ25hbD8uYWJvcnRlZCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBjb250ZW50OiBzdHJpbmc7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Y29udGVudCA9IGF3YWl0IHZhdWx0LnJlYWQoZmlsZSk7XG5cdFx0XHRcdH0gY2F0Y2gge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHdpa2lMaW5rUGF0dGVybiA9IG5ldyBSZWdFeHAod2lraUxpbmtQYXR0ZXJuU291cmNlLCAnZ2knKTtcblx0XHRcdFx0Y29uc3QgbWFya2Rvd25MaW5rUGF0dGVybiA9IG5ldyBSZWdFeHAobWFya2Rvd25MaW5rUGF0dGVyblNvdXJjZSwgJ2dpJyk7XG5cdFx0XHRcdGxldCBtYXRjaDtcblxuXHRcdFx0XHQvLyBcdTUzMzlcdTkxNEQgV2lraSBcdTk0RkVcdTYzQTVcdUZGMDhcdTU0MkJcdTVFMjZcdTUyMkJcdTU0MERcdTc2ODRcdUZGMDlcblx0XHRcdFx0d2hpbGUgKChtYXRjaCA9IHdpa2lMaW5rUGF0dGVybi5leGVjKGNvbnRlbnQpKSAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdGFkZFJlZmVyZW5jZWRQYXRoKG1hdGNoWzFdLCBmaWxlLnBhdGgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gXHU1MzM5XHU5MTREIE1hcmtkb3duIFx1OTRGRVx1NjNBNVx1RkYwOFx1NTZGRVx1NzI0Ny9cdTk3RjNcdTg5QzZcdTk4OTEvXHU2NTg3XHU2ODYzXHVGRjA5XG5cdFx0XHRcdHdoaWxlICgobWF0Y2ggPSBtYXJrZG93bkxpbmtQYXR0ZXJuLmV4ZWMoY29udGVudCkpICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0YWRkUmVmZXJlbmNlZFBhdGgobWF0Y2hbMV0sIGZpbGUucGF0aCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pKTtcblxuXHRcdFx0Ly8gXHU2NkY0XHU2NUIwXHU2MjZCXHU2M0NGXHU4RkRCXHU1RUE2XHU5MDFBXHU3N0U1XG5cdFx0XHRpZiAoc2Nhbk5vdGljZSAmJiBpICUgKEJBVENIX1NJWkUgKiA1KSA9PT0gMCkge1xuXHRcdFx0XHRzY2FuTm90aWNlLmhpZGUoKTtcblx0XHRcdFx0c2Nhbk5vdGljZSA9IG5ldyBOb3RpY2UodGhpcy50KCdzY2FubmluZ1JlZmVyZW5jZXMnKSArIGAgKCR7TWF0aC5taW4oaSArIEJBVENIX1NJWkUsIHRvdGFsRmlsZXMpfS8ke3RvdGFsRmlsZXN9KWAsIDApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBcdThCQTkgVUkgXHU2NzA5XHU2NzNBXHU0RjFBXHU2NkY0XHU2NUIwXG5cdFx0XHRhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMCkpO1xuXHRcdH1cblxuXHRcdC8vIFx1NkUwNVx1NzQwNlx1OEQ4NVx1NjVGNlx1NUI5QVx1NjVGNlx1NTY2OFxuXHRcdGlmICh0aW1lb3V0SWQpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuXHRcdH1cblxuXHRcdC8vIFx1NjI2Qlx1NjNDRlx1NUI4Q1x1NjIxMFx1RkYwQ1x1NjYzRVx1NzkzQVx1NUI4Q1x1NjIxMFx1OTAxQVx1NzdFNVxuXHRcdC8vIFx1NkNFOFx1NjEwRlx1RkYxQVx1NEUwRFx1NEY3Rlx1NzUyOCBzZXRNZXNzYWdlKClcdUZGMENcdTU2RTBcdTRFM0FcdTVCODNcdTRGMUFcdTUyMUJcdTVFRkFcdTY1QjBcdTc2ODQgTm90aWNlXG5cdFx0aWYgKHNjYW5Ob3RpY2UpIHtcblx0XHRcdHNjYW5Ob3RpY2UuaGlkZSgpO1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3NjYW5Db21wbGV0ZScpICsgYCAoJHt0b3RhbEZpbGVzfSAke3RoaXMudCgnZmlsZXNTY2FubmVkJyl9KWApO1xuXHRcdH1cblxuXHRcdC8vIFx1NjZGNFx1NjVCMFx1N0YxM1x1NUI1OFxuXHRcdHRoaXMucmVmZXJlbmNlZEltYWdlc0NhY2hlID0gcmVmZXJlbmNlZDtcblx0XHR0aGlzLmNhY2hlVGltZXN0YW1wID0gbm93O1xuXG5cdFx0cmV0dXJuIHJlZmVyZW5jZWQ7XG5cdH1cblxuXHQvLyBcdTY3RTVcdTYyN0VcdTY3MkFcdTVGMTVcdTc1MjhcdTc2ODRcdTU2RkVcdTcyNDdcblx0YXN5bmMgZmluZFVucmVmZXJlbmNlZCgpOiBQcm9taXNlPFRGaWxlW10+IHtcblx0XHRjb25zdCBhbGxJbWFnZXMgPSBhd2FpdCB0aGlzLmdldEFsbEltYWdlRmlsZXMoKTtcblx0XHRjb25zdCByZWZlcmVuY2VkID0gYXdhaXQgdGhpcy5nZXRSZWZlcmVuY2VkSW1hZ2VzKCk7XG5cblx0XHRyZXR1cm4gYWxsSW1hZ2VzLmZpbHRlcihmaWxlID0+IHtcblx0XHRcdGNvbnN0IGZpbGVQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKGZpbGUucGF0aCkudG9Mb3dlckNhc2UoKTtcblx0XHRcdHJldHVybiAhcmVmZXJlbmNlZC5oYXMoZmlsZVBhdGgpO1xuXHRcdH0pO1xuXHR9XG5cblx0Ly8gXHU2MjRCXHU1MkE4XHU1MjM3XHU2NUIwXHU3RjEzXHU1QjU4XG5cdGFzeW5jIHJlZnJlc2hDYWNoZSgpIHtcblx0XHQvLyBcdTZFMDVcdTk2NjRcdTdGMTNcdTVCNThcblx0XHR0aGlzLnJlZmVyZW5jZWRJbWFnZXNDYWNoZSA9IG51bGw7XG5cdFx0dGhpcy5jYWNoZVRpbWVzdGFtcCA9IDA7XG5cblx0XHQvLyBcdTkxQ0RcdTY1QjBcdTgzQjdcdTUzRDZcdTVGMTVcdTc1Mjhcblx0XHRhd2FpdCB0aGlzLmdldFJlZmVyZW5jZWRJbWFnZXMoKTtcblxuXHRcdG5ldyBOb3RpY2UodGhpcy50KCdzY2FuQ29tcGxldGUnKSk7XG5cdH1cblxuXHQvLyBcdTYyNTNcdTVGMDBcdTU2RkVcdTcyNDdcdTYyNDBcdTU3MjhcdTc2ODRcdTdCMTRcdThCQjBcblx0YXN5bmMgb3BlbkltYWdlSW5Ob3RlcyhpbWFnZUZpbGU6IFRGaWxlKSB7XG5cdFx0Y29uc3QgeyB3b3Jrc3BhY2UsIHZhdWx0IH0gPSB0aGlzLmFwcDtcblx0XHRjb25zdCByZXN1bHRzOiB7IGZpbGU6IFRGaWxlOyBsaW5lOiBudW1iZXIgfVtdID0gW107XG5cdFx0Y29uc3QgaW1hZ2VOYW1lID0gaW1hZ2VGaWxlLm5hbWU7XG5cblx0XHQvLyBcdTRGN0ZcdTc1MjhcdTZCNjNcdTUyMTlcdTYyNkJcdTYzQ0ZcdTYyNDBcdTY3MDkgTWFya2Rvd24gXHU2NTg3XHU0RUY2XG5cdFx0Y29uc3QgbWFya2Rvd25GaWxlcyA9IHZhdWx0LmdldEZpbGVzKCkuZmlsdGVyKGYgPT4gZi5leHRlbnNpb24gPT09ICdtZCcpO1xuXG5cdFx0Zm9yIChjb25zdCBmaWxlIG9mIG1hcmtkb3duRmlsZXMpIHtcblx0XHRcdGxldCBjb250ZW50OiBzdHJpbmc7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRjb250ZW50ID0gYXdhaXQgdmF1bHQucmVhZChmaWxlKTtcblx0XHRcdH0gY2F0Y2gge1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG5cblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0Y29uc3QgbGluZSA9IGxpbmVzW2ldO1xuXHRcdFx0XHQvLyBcdTRGN0ZcdTc1MjhcdTY2RjRcdTdDQkVcdTc4NkVcdTc2ODRcdTUzMzlcdTkxNERcdUZGMUFcdTUzMzlcdTkxNERcdTU2RkVcdTcyNDdcdTk0RkVcdTYzQTVcdTY4M0NcdTVGMEZcblx0XHRcdFx0aWYgKGxpbmUuaW5jbHVkZXMoaW1hZ2VOYW1lKSAmJlxuXHRcdFx0XHRcdChsaW5lLmluY2x1ZGVzKCdbWycpIHx8IGxpbmUuaW5jbHVkZXMoJyFbJykgfHwgbGluZS5pbmNsdWRlcygnXSgnKSkpIHtcblx0XHRcdFx0XHRyZXN1bHRzLnB1c2goeyBmaWxlLCBsaW5lOiBpICsgMSB9KTtcblx0XHRcdFx0XHRicmVhazsgLy8gXHU2QkNGXHU0RTJBXHU2NTg3XHU0RUY2XHU1M0VBXHU1M0Q2XHU3QjJDXHU0RTAwXHU0RTJBXHU1MzM5XHU5MTREXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAocmVzdWx0cy5sZW5ndGggPiAwKSB7XG5cdFx0XHRjb25zdCByZXN1bHQgPSByZXN1bHRzWzBdO1xuXHRcdFx0Ly8gXHU2MjUzXHU1RjAwXHU2NTg3XHU0RUY2XHU1RTc2XHU4REYzXHU4RjZDXHU1MjMwXHU2MzA3XHU1QjlBXHU4ODRDXG5cdFx0XHRjb25zdCBsZWFmID0gd29ya3NwYWNlLmdldExlYWYoJ3RhYicpO1xuXHRcdFx0YXdhaXQgbGVhZi5vcGVuRmlsZShyZXN1bHQuZmlsZSk7XG5cblx0XHRcdC8vIFx1NUMxRFx1OEJENVx1OERGM1x1OEY2Q1x1NTIzMFx1NTE3N1x1NEY1M1x1ODg0Q1xuXHRcdFx0aWYgKHJlc3VsdC5saW5lID4gMSkge1xuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCB2aWV3ID0gd29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcblx0XHRcdFx0XHRpZiAodmlldykge1xuXHRcdFx0XHRcdFx0Y29uc3QgZWRpdG9yID0gdmlldy5lZGl0b3I7XG5cdFx0XHRcdFx0XHRlZGl0b3Iuc2V0Q3Vyc29yKHsgY2g6IDAsIGxpbmU6IHJlc3VsdC5saW5lIC0gMSB9KTtcblx0XHRcdFx0XHRcdGVkaXRvci5zY3JvbGxJbnRvVmlldyh7IGZyb206IHsgY2g6IDAsIGxpbmU6IHJlc3VsdC5saW5lIC0gMSB9LCB0bzogeyBjaDogMCwgbGluZTogcmVzdWx0LmxpbmUgLSAxIH0gfSwgdHJ1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCAxMDApO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnbm90UmVmZXJlbmNlZCcpKTtcblx0XHR9XG5cdH1cblxuXHQvLyBcdTVCRjlcdTlGNTBcdTkwMDlcdTRFMkRcdTc2ODRcdTU2RkVcdTcyNDdcblx0YWxpZ25TZWxlY3RlZEltYWdlKGVkaXRvcjogRWRpdG9yLCBhbGlnbm1lbnQ6ICdsZWZ0JyB8ICdjZW50ZXInIHwgJ3JpZ2h0Jykge1xuXHRcdGNvbnN0IHNlbGVjdGlvbiA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcblx0XHRpZiAoIXNlbGVjdGlvbikge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3NlbGVjdEltYWdlRmlyc3QnKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU5MDA5XHU0RTJEXHU3Njg0XHU2NjJGXHU1NkZFXHU3MjQ3XG5cdFx0aWYgKCFzZWxlY3Rpb24uaW5jbHVkZXMoJyFbJykgJiYgIXNlbGVjdGlvbi5pbmNsdWRlcygnW1snKSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3NlbGVjdEltYWdlJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFsaWduZWRUZXh0ID0gSW1hZ2VBbGlnbm1lbnQuYXBwbHlBbGlnbm1lbnQoc2VsZWN0aW9uLCBhbGlnbm1lbnQpO1xuXHRcdGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGFsaWduZWRUZXh0KTtcblxuXHRcdC8vIFx1NjgzOVx1NjM2RVx1NUJGOVx1OUY1MFx1NjVCOVx1NUYwRlx1NjYzRVx1NzkzQVx1NUJGOVx1NUU5NFx1NzY4NFx1NkQ4OFx1NjA2RlxuXHRcdGNvbnN0IGFsaWdubWVudEtleSA9IGFsaWdubWVudCA9PT0gJ2xlZnQnID8gJ2ltYWdlQWxpZ25lZExlZnQnIDogYWxpZ25tZW50ID09PSAnY2VudGVyJyA/ICdpbWFnZUFsaWduZWRDZW50ZXInIDogJ2ltYWdlQWxpZ25lZFJpZ2h0Jztcblx0XHRuZXcgTm90aWNlKHRoaXMudChhbGlnbm1lbnRLZXkpKTtcblx0fVxuXG5cdC8vIFx1NkRGQlx1NTJBMFx1N0YxNlx1OEY5MVx1NTY2OFx1NEUwQVx1NEUwQlx1NjU4N1x1ODNEQ1x1NTM1NVx1OTg3OVxuXHRhZGRBbGlnbm1lbnRNZW51SXRlbXMobWVudTogTWVudSwgZWRpdG9yOiBFZGl0b3IpIHtcblx0XHRjb25zdCBzZWxlY3Rpb24gPSBlZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XG5cblx0XHQvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTkwMDlcdTRFMkRcdTRFODZcdTU2RkVcdTcyNDdcblx0XHRpZiAoIXNlbGVjdGlvbiB8fCAoIXNlbGVjdGlvbi5pbmNsdWRlcygnIVsnKSAmJiAhc2VsZWN0aW9uLmluY2x1ZGVzKCdbWycpKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cblx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRpdGVtLnNldFRpdGxlKHRoaXMudCgnYWxpZ25JbWFnZUxlZnQnKSlcblx0XHRcdFx0LnNldEljb24oJ2FsaWduLWxlZnQnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAnbGVmdCcpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy50KCdhbGlnbkltYWdlQ2VudGVyJykpXG5cdFx0XHRcdC5zZXRJY29uKCdhbGlnbi1jZW50ZXInKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAnY2VudGVyJyk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnQoJ2FsaWduSW1hZ2VSaWdodCcpKVxuXHRcdFx0XHQuc2V0SWNvbignYWxpZ24tcmlnaHQnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAncmlnaHQnKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU3ODZFXHU0RkREXHU3NkVFXHU1RjU1XHU1QjU4XHU1NzI4XHVGRjA4XHU2NTJGXHU2MzAxXHU5MDEyXHU1RjUyXHU1MjFCXHU1RUZBXHVGRjA5XG5cdCAqL1xuXHRhc3luYyBlbnN1cmVGb2xkZXJFeGlzdHMocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Y29uc3Qgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgocGF0aCk7XG5cblx0XHRpZiAoIW5vcm1hbGl6ZWRQYXRoKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoIWlzUGF0aFNhZmUobm9ybWFsaXplZFBhdGgpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyB2YXVsdCB9ID0gdGhpcy5hcHA7XG5cdFx0Y29uc3Qgc2VnbWVudHMgPSBub3JtYWxpemVkUGF0aC5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKTtcblx0XHRsZXQgY3VycmVudFBhdGggPSAnJztcblxuXHRcdGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuXHRcdFx0Y3VycmVudFBhdGggPSBjdXJyZW50UGF0aCA/IGAke2N1cnJlbnRQYXRofS8ke3NlZ21lbnR9YCA6IHNlZ21lbnQ7XG5cdFx0XHRjb25zdCBleGlzdGluZyA9IHZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50UGF0aCk7XG5cblx0XHRcdGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChleGlzdGluZykge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHZhdWx0LmNyZWF0ZUZvbGRlcihjdXJyZW50UGF0aCk7XG5cdFx0XHR9IGNhdGNoIHtcblx0XHRcdFx0Ly8gXHU1RTc2XHU1M0QxXHU1MjFCXHU1RUZBXHU2NUY2XHU1RkZEXHU3NTY1XHUyMDFDXHU1REYyXHU1QjU4XHU1NzI4XHUyMDFEXHU1NzNBXHU2NjZGXG5cdFx0XHRcdGNvbnN0IHJldHJpZWQgPSB2YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudFBhdGgpO1xuXHRcdFx0XHRpZiAoIShyZXRyaWVkIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdC8vIFx1NUI4OVx1NTE2OFx1NTIyMFx1OTY2NFx1NjU4N1x1NEVGNlx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHRhc3luYyBzYWZlRGVsZXRlRmlsZShmaWxlOiBURmlsZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHsgdmF1bHQgfSA9IHRoaXMuYXBwO1xuXG5cdFx0aWYgKCF0aGlzLnNldHRpbmdzLnVzZVRyYXNoRm9sZGVyKSB7XG5cdFx0XHQvLyBcdTc2RjRcdTYzQTVcdTUyMjBcdTk2NjRcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHZhdWx0LmRlbGV0ZShmaWxlKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdcdTUyMjBcdTk2NjRcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnZGVsZXRlRmFpbGVkV2l0aE5hbWUnLCB7IG5hbWU6IGZpbGUubmFtZSB9KSk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBcdTc5RkJcdTUyQThcdTUyMzBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzlcblx0XHQvLyBcdTRGN0ZcdTc1MjhcdTUzQ0NcdTRFMEJcdTUyMTJcdTdFQkYgX18gXHU0RjVDXHU0RTNBXHU1MjA2XHU5Njk0XHU3QjI2XHVGRjBDXHU5MDdGXHU1MTREXHU2NTg3XHU0RUY2XHU1NDBEXHU0RTJEXHU1MzA1XHU1NDJCXHU0RTBCXHU1MjEyXHU3RUJGXHU2NUY2XHU4OUUzXHU2NzkwXHU5NTE5XHU4QkVGXG5cdFx0Y29uc3QgdHJhc2hQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMuc2V0dGluZ3MudHJhc2hGb2xkZXIpIHx8IERFRkFVTFRfU0VUVElOR1MudHJhc2hGb2xkZXI7XG5cblx0XHRpZiAoIWlzUGF0aFNhZmUodHJhc2hQYXRoKSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ29wZXJhdGlvbkZhaWxlZCcsIHsgbmFtZTogZmlsZS5uYW1lIH0pKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlTmFtZSA9IGZpbGUubmFtZTtcblx0XHRjb25zdCB0aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuXHRcdGNvbnN0IGVuY29kZWRPcmlnaW5hbFBhdGggPSBlbmNvZGVVUklDb21wb25lbnQobm9ybWFsaXplVmF1bHRQYXRoKGZpbGUucGF0aCkgfHwgZmlsZS5uYW1lKTtcblx0XHRjb25zdCBuZXdGaWxlTmFtZSA9IGAke3RpbWVzdGFtcH1fXyR7ZW5jb2RlZE9yaWdpbmFsUGF0aH1gO1xuXHRcdGNvbnN0IHRhcmdldFBhdGggPSBgJHt0cmFzaFBhdGh9LyR7bmV3RmlsZU5hbWV9YDtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBcdTc4NkVcdTRGRERcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTVCNThcdTU3Mjhcblx0XHRcdGNvbnN0IGZvbGRlclJlYWR5ID0gYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJFeGlzdHModHJhc2hQYXRoKTtcblx0XHRcdGlmICghZm9sZGVyUmVhZHkpIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ29wZXJhdGlvbkZhaWxlZCcsIHsgbmFtZTogZmlsZU5hbWUgfSkpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFx1NzlGQlx1NTJBOFx1NjU4N1x1NEVGNlx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHRcdFx0YXdhaXQgdmF1bHQucmVuYW1lKGZpbGUsIHRhcmdldFBhdGgpO1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ21vdmVkVG9UcmFzaCcsIHsgbmFtZTogZmlsZU5hbWUgfSkpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NzlGQlx1NTJBOFx1NjU4N1x1NEVGNlx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnb3BlcmF0aW9uRmFpbGVkJywgeyBuYW1lOiBmaWxlTmFtZSB9KSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0Ly8gXHU2MDYyXHU1OTBEXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XG5cdGFzeW5jIHJlc3RvcmVGaWxlKGZpbGU6IFRGaWxlLCBvcmlnaW5hbFBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHsgdmF1bHQgfSA9IHRoaXMuYXBwO1xuXHRcdGNvbnN0IG5vcm1hbGl6ZWRPcmlnaW5hbFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoc2FmZURlY29kZVVSSUNvbXBvbmVudChvcmlnaW5hbFBhdGgpKTtcblxuXHRcdGlmICghbm9ybWFsaXplZE9yaWdpbmFsUGF0aCB8fCAhaXNQYXRoU2FmZShub3JtYWxpemVkT3JpZ2luYWxQYXRoKSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3Jlc3RvcmVGYWlsZWQnLCB7IG1lc3NhZ2U6IHRoaXMudCgnZXJyb3InKSB9KSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdGFyZ2V0RmlsZSA9IHZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkT3JpZ2luYWxQYXRoKTtcblx0XHRpZiAodGFyZ2V0RmlsZSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3Jlc3RvcmVGYWlsZWQnLCB7IG1lc3NhZ2U6IHRoaXMudCgndGFyZ2V0RmlsZUV4aXN0cycpIH0pKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBwYXJlbnRQYXRoID0gZ2V0UGFyZW50UGF0aChub3JtYWxpemVkT3JpZ2luYWxQYXRoKTtcblx0XHRpZiAocGFyZW50UGF0aCkge1xuXHRcdFx0Y29uc3QgcGFyZW50UmVhZHkgPSBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlckV4aXN0cyhwYXJlbnRQYXRoKTtcblx0XHRcdGlmICghcGFyZW50UmVhZHkpIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3Jlc3RvcmVGYWlsZWQnLCB7IG1lc3NhZ2U6IHRoaXMudCgnZXJyb3InKSB9KSk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCByZXN0b3JlZE5hbWUgPSBnZXRGaWxlTmFtZUZyb21QYXRoKG5vcm1hbGl6ZWRPcmlnaW5hbFBhdGgpIHx8IGZpbGUubmFtZTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB2YXVsdC5yZW5hbWUoZmlsZSwgbm9ybWFsaXplZE9yaWdpbmFsUGF0aCk7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgncmVzdG9yZVN1Y2Nlc3MnLCB7IG5hbWU6IHJlc3RvcmVkTmFtZSB9KSk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU2MDYyXHU1OTBEXHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy50KCdyZXN0b3JlRmFpbGVkJywgeyBtZXNzYWdlOiAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2UgfSkpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdC8vIFx1NUY3Qlx1NUU5NVx1NTIyMFx1OTY2NFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NzY4NFx1NjU4N1x1NEVGNlxuXHRhc3luYyBwZXJtYW5lbnRseURlbGV0ZUZpbGUoZmlsZTogVEZpbGUpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCB7IHZhdWx0IH0gPSB0aGlzLmFwcDtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB2YXVsdC5kZWxldGUoZmlsZSk7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnZmlsZURlbGV0ZWQnLCB7IG5hbWU6IGZpbGUubmFtZSB9KSk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU1RjdCXHU1RTk1XHU1MjIwXHU5NjY0XHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy50KCdkZWxldGVGYWlsZWQnKSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59XG4iLCAiaW1wb3J0IHsgVEZpbGUsIEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBzZXRJY29uLCBNZW51LCBNZW51SXRlbSwgTm90aWNlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IEltYWdlTWFuYWdlclBsdWdpbiBmcm9tICcuLi9tYWluJztcbmltcG9ydCB7IGZvcm1hdEZpbGVTaXplLCBkZWJvdW5jZSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBub3JtYWxpemVWYXVsdFBhdGggfSBmcm9tICcuLi91dGlscy9wYXRoJztcbmltcG9ydCB7IGdldE1lZGlhVHlwZSwgZ2V0RmlsZUV4dGVuc2lvbiwgZ2V0RG9jdW1lbnREaXNwbGF5TGFiZWwgfSBmcm9tICcuLi91dGlscy9tZWRpYVR5cGVzJztcbmltcG9ydCB7IGdlbmVyYXRlVGh1bWJuYWlsIH0gZnJvbSAnLi4vdXRpbHMvdGh1bWJuYWlsQ2FjaGUnO1xuaW1wb3J0IHsgZmluZE1hdGNoaW5nUnVsZSwgY29tcHV0ZVRhcmdldCwgT3JnYW5pemVDb250ZXh0IH0gZnJvbSAnLi4vdXRpbHMvcnVsZUVuZ2luZSc7XG5pbXBvcnQgeyBwYXJzZUV4aWYgfSBmcm9tICcuLi91dGlscy9leGlmUmVhZGVyJztcbmltcG9ydCB7IHByb2Nlc3NJbWFnZSwgZ2V0Rm9ybWF0RXh0ZW5zaW9uIH0gZnJvbSAnLi4vdXRpbHMvbWVkaWFQcm9jZXNzb3InO1xuXG5leHBvcnQgY29uc3QgVklFV19UWVBFX0lNQUdFX0xJQlJBUlkgPSAnaW1hZ2UtbGlicmFyeS12aWV3JztcblxuaW50ZXJmYWNlIEltYWdlSXRlbSB7XG5cdGZpbGU6IFRGaWxlO1xuXHRwYXRoOiBzdHJpbmc7XG5cdG5hbWU6IHN0cmluZztcblx0c2l6ZTogbnVtYmVyO1xuXHRtb2RpZmllZDogbnVtYmVyO1xuXHRkaW1lbnNpb25zPzogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufVxuXG5leHBvcnQgY2xhc3MgSW1hZ2VMaWJyYXJ5VmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcblx0cGx1Z2luOiBJbWFnZU1hbmFnZXJQbHVnaW47XG5cdGltYWdlczogSW1hZ2VJdGVtW10gPSBbXTtcblx0ZmlsdGVyZWRJbWFnZXM6IEltYWdlSXRlbVtdID0gW107XG5cdHByaXZhdGUgc2VhcmNoUXVlcnk6IHN0cmluZyA9ICcnO1xuXHRwcml2YXRlIGN1cnJlbnRQYWdlOiBudW1iZXIgPSAxO1xuXHRwcml2YXRlIHBhZ2VTaXplOiBudW1iZXIgPSA1MDtcblx0cHJpdmF0ZSBzZWxlY3RlZEZpbGVzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcblx0cHJpdmF0ZSBpc1NlbGVjdGlvbk1vZGU6IGJvb2xlYW4gPSBmYWxzZTtcblx0cHJpdmF0ZSBzZWFyY2hJbnB1dDogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG5cdGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luKSB7XG5cdFx0c3VwZXIobGVhZik7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblxuXHRwcml2YXRlIGlzUHJvY2Vzc2FibGVJbWFnZShmaWxlOiBURmlsZSk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZS5uYW1lKTtcblx0XHRyZXR1cm4gWycucG5nJywgJy5qcGcnLCAnLmpwZWcnLCAnLndlYnAnLCAnLmJtcCddLmluY2x1ZGVzKGV4dCk7XG5cdH1cblxuXHRnZXRWaWV3VHlwZSgpIHtcblx0XHRyZXR1cm4gVklFV19UWVBFX0lNQUdFX0xJQlJBUlk7XG5cdH1cblxuXHRnZXREaXNwbGF5VGV4dCgpIHtcblx0XHRyZXR1cm4gdGhpcy5wbHVnaW4udCgnbWVkaWFMaWJyYXJ5Jyk7XG5cdH1cblxuXHRhc3luYyBvbk9wZW4oKSB7XG5cdFx0Ly8gXHU3QjQ5XHU1Rjg1IGNvbnRlbnRFbCBcdTUxQzZcdTU5MDdcdTU5N0RcdUZGMDhJdGVtVmlldyBcdTc2ODQgY29udGVudEVsIFx1OTcwMFx1ODk4MSBPYnNpZGlhbiBcdTUyMURcdTU5Q0JcdTUzMTZcdUZGMDlcblx0XHRsZXQgcmV0cmllcyA9IDA7XG5cdFx0d2hpbGUgKCF0aGlzLmNvbnRlbnRFbCAmJiByZXRyaWVzIDwgMTApIHtcblx0XHRcdGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MCkpO1xuXHRcdFx0cmV0cmllcysrO1xuXHRcdH1cblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdJbWFnZUxpYnJhcnlWaWV3OiBjb250ZW50RWwgbm90IHJlYWR5IGFmdGVyIHJldHJpZXMnKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoJ2ltYWdlLWxpYnJhcnktdmlldycpO1xuXHRcdC8vIFx1NEVDRVx1OEJCRVx1N0Y2RVx1NEUyRFx1OEJGQlx1NTNENiBwYWdlU2l6ZVxuXHRcdHRoaXMucGFnZVNpemUgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYWdlU2l6ZSB8fCA1MDtcblx0XHRhd2FpdCB0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0fVxuXG5cdGFzeW5jIG9uQ2xvc2UoKSB7XG5cdFx0Ly8gXHU2RTA1XHU3NDA2XHU1REU1XHU0RjVDIC0gXHU0RThCXHU0RUY2XHU3NkQxXHU1NDJDXHU0RjFBXHU1NzI4IFZpZXcgXHU1Mzc4XHU4RjdEXHU2NUY2XHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XG5cdH1cblxuXHRhc3luYyByZWZyZXNoSW1hZ2VzKCkge1xuXHRcdC8vIFx1NTk4Mlx1Njc5Q1x1ODlDNlx1NTZGRVx1NURGMlx1NTE3M1x1OTVFRFx1NjIxNiBjb250ZW50RWwgXHU0RTBEXHU1M0VGXHU3NTI4XHVGRjBDXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXG5cdFx0aWYgKCF0aGlzLmNvbnRlbnRFbCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFx1NTQwQ1x1NkI2NVx1NjcwMFx1NjVCMFx1NTIwNlx1OTg3NVx1OEJCRVx1N0Y2RVx1RkYwQ1x1NEZERFx1OEJDMVx1OEJCRVx1N0Y2RVx1NTNEOFx1NjZGNFx1NTQwRVx1N0FDQlx1NTM3M1x1NzUxRlx1NjU0OFxuXHRcdHRoaXMucGFnZVNpemUgPSBNYXRoLm1heCgxLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYWdlU2l6ZSB8fCA1MCk7XG5cblx0XHRjb25zdCBzaXplTWFwOiBSZWNvcmQ8c3RyaW5nLCAnc21hbGwnIHwgJ21lZGl1bScgfCAnbGFyZ2UnPiA9IHtcblx0XHRcdCdzbWFsbCc6ICdzbWFsbCcsXG5cdFx0XHQnbWVkaXVtJzogJ21lZGl1bScsXG5cdFx0XHQnbGFyZ2UnOiAnbGFyZ2UnXG5cdFx0fTtcblxuXHRcdGNvbnN0IHNpemUgPSBzaXplTWFwW3RoaXMucGx1Z2luLnNldHRpbmdzLnRodW1ibmFpbFNpemVdIHx8ICdtZWRpdW0nO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHQvLyBcdTUxNDhcdTgzQjdcdTUzRDZcdTYyNDBcdTY3MDlcdTU2RkVcdTcyNDdcdTY1NzBcdTYzNkVcdUZGMUFcdTRGMThcdTUxNDhcdTRGN0ZcdTc1MjhcdTY1ODdcdTRFRjZcdTdEMjJcdTVGMTVcdUZGMDhcdTU4OUVcdTkxQ0ZcdTYyNkJcdTYzQ0ZcdUZGMDlcdUZGMENcdTU2REVcdTkwMDBcdTUyMzBcdTUxNjhcdTkxQ0ZcdTkwNERcdTUzODZcblx0XHRsZXQgaW1hZ2VGaWxlczogVEZpbGVbXTtcblx0XHRpZiAodGhpcy5wbHVnaW4uZmlsZUluZGV4LmlzSW5pdGlhbGl6ZWQpIHtcblx0XHRcdGNvbnN0IGVudHJpZXMgPSB0aGlzLnBsdWdpbi5maWxlSW5kZXguZ2V0RmlsZXMoKTtcblx0XHRcdGltYWdlRmlsZXMgPSBlbnRyaWVzXG5cdFx0XHRcdC5tYXAoZSA9PiB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZS5wYXRoKSlcblx0XHRcdFx0LmZpbHRlcigoZik6IGYgaXMgVEZpbGUgPT4gZiBpbnN0YW5jZW9mIFRGaWxlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aW1hZ2VGaWxlcyA9IGF3YWl0IHRoaXMucGx1Z2luLmdldEFsbEltYWdlRmlsZXMoKTtcblx0XHR9XG5cblx0XHQvLyBcdThGQzdcdTZFRTRcdTU2RkVcdTcyNDdcdTY1ODdcdTRFRjZcdTU5MzlcdUZGMDhcdTU5ODJcdTY3OUNcdThCQkVcdTdGNkVcdTRFODZcdUZGMDlcblx0XHRsZXQgZmlsdGVyZWRJbWFnZXM6IFRGaWxlW107XG5cdFx0aWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlRm9sZGVyKSB7XG5cdFx0XHRjb25zdCBmb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGb2xkZXIpO1xuXHRcdFx0Y29uc3QgcHJlZml4ID0gZm9sZGVyID8gYCR7Zm9sZGVyfS9gIDogJyc7XG5cdFx0XHRmaWx0ZXJlZEltYWdlcyA9IGltYWdlRmlsZXMuZmlsdGVyKGYgPT4ge1xuXHRcdFx0XHRjb25zdCBub3JtYWxpemVkUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChmLnBhdGgpO1xuXHRcdFx0XHRyZXR1cm4gbm9ybWFsaXplZFBhdGggPT09IGZvbGRlciB8fCAocHJlZml4ID8gbm9ybWFsaXplZFBhdGguc3RhcnRzV2l0aChwcmVmaXgpIDogZmFsc2UpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZpbHRlcmVkSW1hZ2VzID0gaW1hZ2VGaWxlcztcblx0XHR9XG5cblx0XHQvLyBcdTYzOTJcdTVFOEZcdTU2RkVcdTcyNDdcblx0XHR0aGlzLmltYWdlcyA9IGZpbHRlcmVkSW1hZ2VzLm1hcChmaWxlID0+ICh7XG5cdFx0XHRmaWxlLFxuXHRcdFx0cGF0aDogZmlsZS5wYXRoLFxuXHRcdFx0bmFtZTogZmlsZS5uYW1lLFxuXHRcdFx0c2l6ZTogZmlsZS5zdGF0LnNpemUsXG5cdFx0XHRtb2RpZmllZDogZmlsZS5zdGF0Lm10aW1lXG5cdFx0fSkpO1xuXG5cdFx0dGhpcy5zb3J0SW1hZ2VzKCk7XG5cblx0XHQvLyBcdTVFOTRcdTc1MjhcdTY0MUNcdTdEMjJcdThGQzdcdTZFRTRcblx0XHR0aGlzLmFwcGx5U2VhcmNoKCk7XG5cblx0XHQvLyBcdTVGNTNcdTY1NzBcdTYzNkVcdTkxQ0ZcdTUzRDhcdTUzMTZcdTYyMTZcdTUyMDZcdTk4NzVcdTU5MjdcdTVDMEZcdTUzRDhcdTUzMTZcdTY1RjZcdUZGMENcdTRGRUVcdTZCNjNcdTVGNTNcdTUyNERcdTk4NzVcdTc4MDFcblx0XHRjb25zdCB0b3RhbFBhZ2VzID0gTWF0aC5tYXgoMSwgTWF0aC5jZWlsKHRoaXMuZmlsdGVyZWRJbWFnZXMubGVuZ3RoIC8gdGhpcy5wYWdlU2l6ZSkpO1xuXHRcdGlmICh0aGlzLmN1cnJlbnRQYWdlID4gdG90YWxQYWdlcykge1xuXHRcdFx0dGhpcy5jdXJyZW50UGFnZSA9IHRvdGFsUGFnZXM7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBXHU1OTM0XHU5MEU4XHVGRjA4XHU1NzI4XHU4M0I3XHU1M0Q2XHU2NTcwXHU2MzZFXHU0RTRCXHU1NDBFXHU2RTMyXHU2N0QzXHVGRjA5XG5cdFx0dGhpcy5yZW5kZXJIZWFkZXIoKTtcblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1NjQxQ1x1N0QyMlx1Njg0NlxuXHRcdHRoaXMucmVuZGVyU2VhcmNoQm94KCk7XG5cblx0XHQvLyBcdTUyMUJcdTVFRkFcdTkwMDlcdTYyRTlcdTZBMjFcdTVGMEZcdTVERTVcdTUxNzdcdTY4MEZcblx0XHRpZiAodGhpcy5pc1NlbGVjdGlvbk1vZGUpIHtcblx0XHRcdHRoaXMucmVuZGVyU2VsZWN0aW9uVG9vbGJhcigpO1xuXHRcdH1cblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1NTZGRVx1NzI0N1x1N0Y1MVx1NjgzQ1x1NUJCOVx1NTY2OFxuXHRcdGNvbnN0IGdyaWQgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1ncmlkJyB9KTtcblx0XHRncmlkLmFkZENsYXNzKGBpbWFnZS1ncmlkLSR7c2l6ZX1gKTtcblxuXHRcdC8vIFx1OEJBMVx1N0I5N1x1NTIwNlx1OTg3NVxuXHRcdGNvbnN0IHN0YXJ0SW5kZXggPSAodGhpcy5jdXJyZW50UGFnZSAtIDEpICogdGhpcy5wYWdlU2l6ZTtcblx0XHRjb25zdCBlbmRJbmRleCA9IE1hdGgubWluKHN0YXJ0SW5kZXggKyB0aGlzLnBhZ2VTaXplLCB0aGlzLmZpbHRlcmVkSW1hZ2VzLmxlbmd0aCk7XG5cdFx0Y29uc3QgcGFnZUltYWdlcyA9IHRoaXMuZmlsdGVyZWRJbWFnZXMuc2xpY2Uoc3RhcnRJbmRleCwgZW5kSW5kZXgpO1xuXG5cdFx0Ly8gXHU2RTMyXHU2N0QzXHU1RjUzXHU1MjREXHU5ODc1XHU3Njg0XHU1NkZFXHU3MjQ3XG5cdFx0Zm9yIChjb25zdCBpbWFnZSBvZiBwYWdlSW1hZ2VzKSB7XG5cdFx0XHR0aGlzLnJlbmRlckltYWdlSXRlbShncmlkLCBpbWFnZSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBXHU1MjA2XHU5ODc1XHU2M0E3XHU0RUY2XG5cdFx0dGhpcy5yZW5kZXJQYWdpbmF0aW9uKCk7XG5cblx0XHRpZiAodGhpcy5maWx0ZXJlZEltYWdlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdGNsczogJ2VtcHR5LXN0YXRlJyxcblx0XHRcdFx0dGV4dDogdGhpcy5zZWFyY2hRdWVyeSA/IHRoaXMucGx1Z2luLnQoJ25vTWF0Y2hpbmdGaWxlcycpIDogdGhpcy5wbHVnaW4udCgnbm9NZWRpYUZpbGVzJylcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTVFOTRcdTc1MjhcdTY0MUNcdTdEMjJcdThGQzdcdTZFRTRcblx0ICovXG5cdGFwcGx5U2VhcmNoKCkge1xuXHRcdGlmICghdGhpcy5zZWFyY2hRdWVyeSkge1xuXHRcdFx0dGhpcy5maWx0ZXJlZEltYWdlcyA9IFsuLi50aGlzLmltYWdlc107XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IHF1ZXJ5ID0gdGhpcy5zZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0dGhpcy5maWx0ZXJlZEltYWdlcyA9IHRoaXMuaW1hZ2VzLmZpbHRlcihpbWcgPT5cblx0XHRcdFx0aW1nLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSkgfHxcblx0XHRcdFx0aW1nLnBhdGgudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSlcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NjQxQ1x1N0QyMlx1Njg0NlxuXHQgKi9cblx0cmVuZGVyU2VhcmNoQm94KCkge1xuXHRcdGNvbnN0IHNlYXJjaENvbnRhaW5lciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3NlYXJjaC1jb250YWluZXInIH0pO1xuXG5cdFx0dGhpcy5zZWFyY2hJbnB1dCA9IHNlYXJjaENvbnRhaW5lci5jcmVhdGVFbCgnaW5wdXQnLCB7XG5cdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRjbHM6ICdzZWFyY2gtaW5wdXQnLFxuXHRcdFx0YXR0cjoge1xuXHRcdFx0XHRwbGFjZWhvbGRlcjogdGhpcy5wbHVnaW4udCgnc2VhcmNoUGxhY2Vob2xkZXInKSxcblx0XHRcdFx0dmFsdWU6IHRoaXMuc2VhcmNoUXVlcnlcblx0XHRcdH1cblx0XHR9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXG5cdFx0Ly8gXHU2NDFDXHU3RDIyXHU1NkZFXHU2ODA3XG5cdFx0Y29uc3Qgc2VhcmNoSWNvbiA9IHNlYXJjaENvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdzZWFyY2gtaWNvbicgfSk7XG5cdFx0c2V0SWNvbihzZWFyY2hJY29uLCAnc2VhcmNoJyk7XG5cblx0XHQvLyBcdTZFMDVcdTk2NjRcdTY0MUNcdTdEMjJcdTYzMDlcdTk0QUVcblx0XHRpZiAodGhpcy5zZWFyY2hRdWVyeSkge1xuXHRcdFx0Y29uc3QgY2xlYXJCdG4gPSBzZWFyY2hDb250YWluZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnY2xlYXItc2VhcmNoJyB9KTtcblx0XHRcdHNldEljb24oY2xlYXJCdG4sICd4Jyk7XG5cdFx0XHRjbGVhckJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdFx0dGhpcy5zZWFyY2hRdWVyeSA9ICcnO1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRQYWdlID0gMTtcblx0XHRcdFx0dGhpcy5hcHBseVNlYXJjaCgpO1xuXHRcdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vIFx1NEY3Rlx1NzUyOFx1OTYzMlx1NjI5Nlx1NTkwNFx1NzQwNlx1NjQxQ1x1N0QyMlx1OEY5M1x1NTE2NVxuXHRcdGNvbnN0IGRlYm91bmNlZFNlYXJjaCA9IGRlYm91bmNlKCgpID0+IHtcblx0XHRcdHRoaXMuY3VycmVudFBhZ2UgPSAxO1xuXHRcdFx0dGhpcy5hcHBseVNlYXJjaCgpO1xuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSwgMzAwKTtcblxuXHRcdHRoaXMuc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCAoZSkgPT4ge1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHRcdHRoaXMuc2VhcmNoUXVlcnkgPSB0YXJnZXQudmFsdWU7XG5cdFx0XHRkZWJvdW5jZWRTZWFyY2goKTtcblx0XHR9KTtcblxuXHRcdC8vIFx1NjYzRVx1NzkzQVx1N0VEM1x1Njc5Q1x1OEJBMVx1NjU3MFxuXHRcdGlmICh0aGlzLnNlYXJjaFF1ZXJ5KSB7XG5cdFx0XHRzZWFyY2hDb250YWluZXIuY3JlYXRlU3Bhbih7XG5cdFx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NlYXJjaFJlc3VsdHMnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKHRoaXMuZmlsdGVyZWRJbWFnZXMubGVuZ3RoKSksXG5cdFx0XHRcdGNsczogJ3NlYXJjaC1yZXN1bHRzLWNvdW50J1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1OTAwOVx1NjJFOVx1NkEyMVx1NUYwRlx1NURFNVx1NTE3N1x1NjgwRlxuXHQgKi9cblx0cmVuZGVyU2VsZWN0aW9uVG9vbGJhcigpIHtcblx0XHRjb25zdCB0b29sYmFyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnc2VsZWN0aW9uLXRvb2xiYXInIH0pO1xuXG5cdFx0dG9vbGJhci5jcmVhdGVTcGFuKHtcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NlbGVjdEZpbGVzJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyh0aGlzLnNlbGVjdGVkRmlsZXMuc2l6ZSkpLFxuXHRcdFx0Y2xzOiAnc2VsZWN0aW9uLWNvdW50J1xuXHRcdH0pO1xuXG5cdFx0Y29uc3Qgc2VsZWN0QWxsQnRuID0gdG9vbGJhci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICd0b29sYmFyLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihzZWxlY3RBbGxCdG4sICdjaGVjay1zcXVhcmUnKTtcblx0XHRzZWxlY3RBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHR0aGlzLmZpbHRlcmVkSW1hZ2VzLmZvckVhY2goaW1nID0+IHRoaXMuc2VsZWN0ZWRGaWxlcy5hZGQoaW1nLmZpbGUucGF0aCkpO1xuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSk7XG5cblx0XHRjb25zdCBkZXNlbGVjdEFsbEJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idXR0b24nIH0pO1xuXHRcdHNldEljb24oZGVzZWxlY3RBbGxCdG4sICdzcXVhcmUnKTtcblx0XHRkZXNlbGVjdEFsbEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5jbGVhcigpO1xuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSk7XG5cblx0XHRjb25zdCBkZWxldGVTZWxlY3RlZEJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idXR0b24gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGRlbGV0ZVNlbGVjdGVkQnRuLCAndHJhc2gtMicpO1xuXHRcdGRlbGV0ZVNlbGVjdGVkQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5kZWxldGVTZWxlY3RlZCgpKTtcblxuXHRcdC8vIFx1NjU3NFx1NzQwNlx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IG9yZ2FuaXplQnRuID0gdG9vbGJhci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICd0b29sYmFyLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihvcmdhbml6ZUJ0biwgJ2ZvbGRlci1pbnB1dCcpO1xuXHRcdG9yZ2FuaXplQnRuLnRpdGxlID0gdGhpcy5wbHVnaW4udCgnb3JnYW5pemluZycpO1xuXHRcdG9yZ2FuaXplQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5vcmdhbml6ZVNlbGVjdGVkKCkpO1xuXG5cdFx0Ly8gXHU1MzhCXHU3RjI5XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgcHJvY2Vzc0J0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idXR0b24nIH0pO1xuXHRcdHNldEljb24ocHJvY2Vzc0J0biwgJ2ltYWdlLWRvd24nKTtcblx0XHRwcm9jZXNzQnRuLnRpdGxlID0gdGhpcy5wbHVnaW4udCgncHJvY2Vzc2luZycpO1xuXHRcdHByb2Nlc3NCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnByb2Nlc3NTZWxlY3RlZCgpKTtcblxuXHRcdGNvbnN0IGV4aXRTZWxlY3Rpb25CdG4gPSB0b29sYmFyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3Rvb2xiYXItYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKGV4aXRTZWxlY3Rpb25CdG4sICd4Jyk7XG5cdFx0ZXhpdFNlbGVjdGlvbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0gZmFsc2U7XG5cdFx0XHR0aGlzLnNlbGVjdGVkRmlsZXMuY2xlYXIoKTtcblx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NTIwNlx1OTg3NVx1NjNBN1x1NEVGNlxuXHQgKi9cblx0cmVuZGVyUGFnaW5hdGlvbigpIHtcblx0XHRjb25zdCB0b3RhbFBhZ2VzID0gTWF0aC5jZWlsKHRoaXMuZmlsdGVyZWRJbWFnZXMubGVuZ3RoIC8gdGhpcy5wYWdlU2l6ZSk7XG5cdFx0aWYgKHRvdGFsUGFnZXMgPD0gMSkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgcGFnaW5hdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3BhZ2luYXRpb24nIH0pO1xuXG5cdFx0Ly8gXHU0RTBBXHU0RTAwXHU5ODc1XG5cdFx0Y29uc3QgcHJldkJ0biA9IHBhZ2luYXRpb24uY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAncGFnZS1idXR0b24nIH0pO1xuXHRcdHByZXZCdG4udGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi50KCdwcmV2UGFnZScpO1xuXHRcdHByZXZCdG4uZGlzYWJsZWQgPSB0aGlzLmN1cnJlbnRQYWdlIDw9IDE7XG5cdFx0cHJldkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdGlmICh0aGlzLmN1cnJlbnRQYWdlID4gMSkge1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRQYWdlLS07XG5cdFx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU5ODc1XHU3ODAxXHU0RkUxXHU2MDZGXG5cdFx0cGFnaW5hdGlvbi5jcmVhdGVTcGFuKHtcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3BhZ2VJbmZvJylcblx0XHRcdFx0LnJlcGxhY2UoJ3tjdXJyZW50fScsIFN0cmluZyh0aGlzLmN1cnJlbnRQYWdlKSlcblx0XHRcdFx0LnJlcGxhY2UoJ3t0b3RhbH0nLCBTdHJpbmcodG90YWxQYWdlcykpLFxuXHRcdFx0Y2xzOiAncGFnZS1pbmZvJ1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU0RTBCXHU0RTAwXHU5ODc1XG5cdFx0Y29uc3QgbmV4dEJ0biA9IHBhZ2luYXRpb24uY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAncGFnZS1idXR0b24nIH0pO1xuXHRcdG5leHRCdG4udGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi50KCduZXh0UGFnZScpO1xuXHRcdG5leHRCdG4uZGlzYWJsZWQgPSB0aGlzLmN1cnJlbnRQYWdlID49IHRvdGFsUGFnZXM7XG5cdFx0bmV4dEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdGlmICh0aGlzLmN1cnJlbnRQYWdlIDwgdG90YWxQYWdlcykge1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRQYWdlKys7XG5cdFx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU4REYzXHU4RjZDXHU1MjMwXHU5ODc1XG5cdFx0Y29uc3QganVtcElucHV0ID0gcGFnaW5hdGlvbi5jcmVhdGVFbCgnaW5wdXQnLCB7XG5cdFx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHRcdGNsczogJ3BhZ2UtanVtcC1pbnB1dCcsXG5cdFx0XHRhdHRyOiB7XG5cdFx0XHRcdG1pbjogJzEnLFxuXHRcdFx0XHRtYXg6IFN0cmluZyh0b3RhbFBhZ2VzKSxcblx0XHRcdFx0dmFsdWU6IFN0cmluZyh0aGlzLmN1cnJlbnRQYWdlKVxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGp1bXBJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4ge1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHRcdGxldCBwYWdlID0gcGFyc2VJbnQodGFyZ2V0LnZhbHVlLCAxMCk7XG5cdFx0XHRpZiAoaXNOYU4ocGFnZSkpIHBhZ2UgPSB0aGlzLmN1cnJlbnRQYWdlO1xuXHRcdFx0cGFnZSA9IE1hdGgubWF4KDEsIE1hdGgubWluKHBhZ2UsIHRvdGFsUGFnZXMpKTtcblx0XHRcdHRoaXMuY3VycmVudFBhZ2UgPSBwYWdlO1xuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1MjIwXHU5NjY0XHU5MDA5XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRhc3luYyBkZWxldGVTZWxlY3RlZCgpIHtcblx0XHRpZiAodGhpcy5zZWxlY3RlZEZpbGVzLnNpemUgPT09IDApIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnY29uZmlybURlbGV0ZVNlbGVjdGVkJykucmVwbGFjZSgne2NvdW50fScsICcwJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNvbmZpcm1lZCA9IGNvbmZpcm0oXG5cdFx0XHR0aGlzLnBsdWdpbi50KCdjb25maXJtRGVsZXRlU2VsZWN0ZWQnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKHRoaXMuc2VsZWN0ZWRGaWxlcy5zaXplKSlcblx0XHQpO1xuXG5cdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0Y29uc3QgZmlsZXNUb0RlbGV0ZSA9IHRoaXMuZmlsdGVyZWRJbWFnZXMuZmlsdGVyKGltZyA9PlxuXHRcdFx0XHR0aGlzLnNlbGVjdGVkRmlsZXMuaGFzKGltZy5maWxlLnBhdGgpXG5cdFx0XHQpO1xuXG5cdFx0XHQvLyBcdTRGN0ZcdTc1MjggUHJvbWlzZS5hbGwgXHU1RTc2XHU1M0QxXHU1OTA0XHU3NDA2XHU1MjIwXHU5NjY0XG5cdFx0XHRjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG5cdFx0XHRcdGZpbGVzVG9EZWxldGUubWFwKGltZyA9PiB0aGlzLnBsdWdpbi5zYWZlRGVsZXRlRmlsZShpbWcuZmlsZSkpXG5cdFx0XHQpO1xuXG5cdFx0XHQvLyBcdTdFREZcdThCQTFcdTYyMTBcdTUyOUZcdTU0OENcdTU5MzFcdThEMjVcdTc2ODRcdTY1NzBcdTkxQ0Zcblx0XHRcdGNvbnN0IHN1Y2Nlc3NDb3VudCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gcikubGVuZ3RoO1xuXHRcdFx0Y29uc3QgZmFpbENvdW50ID0gcmVzdWx0cy5maWx0ZXIociA9PiAhcikubGVuZ3RoO1xuXG5cdFx0XHRpZiAoc3VjY2Vzc0NvdW50ID4gMCkge1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2RlbGV0ZWRGaWxlcycpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcoc3VjY2Vzc0NvdW50KSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGZhaWxDb3VudCA+IDApIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdkZWxldGVGaWxlc0ZhaWxlZCcpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcoZmFpbENvdW50KSksIDMwMDApO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnNlbGVjdGVkRmlsZXMuY2xlYXIoKTtcblx0XHRcdHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0gZmFsc2U7XG5cdFx0XHRhd2FpdCB0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHR9XG5cdH1cblxuXHRyZW5kZXJIZWFkZXIoKSB7XG5cdFx0Y29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnaW1hZ2UtbGlicmFyeS1oZWFkZXInIH0pO1xuXG5cdFx0aGVhZGVyLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy5wbHVnaW4udCgnbWVkaWFMaWJyYXJ5JykgfSk7XG5cblx0XHRjb25zdCBzdGF0cyA9IGhlYWRlci5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1zdGF0cycgfSk7XG5cdFx0c3RhdHMuY3JlYXRlU3Bhbih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ3RvdGFsTWVkaWFGaWxlcycpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcodGhpcy5maWx0ZXJlZEltYWdlcy5sZW5ndGgpKSB9KTtcblxuXHRcdC8vIFx1NTIzN1x1NjVCMFx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IHJlZnJlc2hCdG4gPSBoZWFkZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAncmVmcmVzaC1idXR0b24nIH0pO1xuXHRcdHNldEljb24ocmVmcmVzaEJ0biwgJ3JlZnJlc2gtY3cnKTtcblx0XHRyZWZyZXNoQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5yZWZyZXNoSW1hZ2VzKCkpO1xuXG5cdFx0Ly8gXHU1OTFBXHU5MDA5XHU2QTIxXHU1RjBGXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3Qgc2VsZWN0QnRuID0gaGVhZGVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3JlZnJlc2gtYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKHNlbGVjdEJ0biwgJ2NoZWNrLXNxdWFyZScpO1xuXHRcdHNlbGVjdEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0gIXRoaXMuaXNTZWxlY3Rpb25Nb2RlO1xuXHRcdFx0aWYgKCF0aGlzLmlzU2VsZWN0aW9uTW9kZSkge1xuXHRcdFx0XHR0aGlzLnNlbGVjdGVkRmlsZXMuY2xlYXIoKTtcblx0XHRcdH1cblx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdH0pO1xuXHRcdHNlbGVjdEJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ211bHRpU2VsZWN0TW9kZScpO1xuXG5cdFx0Ly8gXHU2MzkyXHU1RThGXHU5MDA5XHU5ODc5XG5cdFx0Y29uc3Qgc29ydFNlbGVjdCA9IGhlYWRlci5jcmVhdGVFbCgnc2VsZWN0JywgeyBjbHM6ICdzb3J0LXNlbGVjdCcgfSk7XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IFtcblx0XHRcdHsgdmFsdWU6ICduYW1lJywgdGV4dDogdGhpcy5wbHVnaW4udCgnc29ydEJ5TmFtZScpIH0sXG5cdFx0XHR7IHZhbHVlOiAnZGF0ZScsIHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NvcnRCeURhdGUnKSB9LFxuXHRcdFx0eyB2YWx1ZTogJ3NpemUnLCB0ZXh0OiB0aGlzLnBsdWdpbi50KCdzb3J0QnlTaXplJykgfVxuXHRcdF07XG5cdFx0b3B0aW9ucy5mb3JFYWNoKG9wdCA9PiB7XG5cdFx0XHRjb25zdCBvcHRpb24gPSBzb3J0U2VsZWN0LmNyZWF0ZUVsKCdvcHRpb24nLCB7IHZhbHVlOiBvcHQudmFsdWUsIHRleHQ6IG9wdC50ZXh0IH0pO1xuXHRcdFx0aWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRCeSA9PT0gb3B0LnZhbHVlKSB7XG5cdFx0XHRcdG9wdGlvbi5zZXRBdHRyaWJ1dGUoJ3NlbGVjdGVkJywgJ3NlbGVjdGVkJyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0c29ydFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoZSkgPT4ge1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG5cdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zb3J0QnkgPSB0YXJnZXQudmFsdWUgYXMgJ25hbWUnIHwgJ2RhdGUnIHwgJ3NpemUnO1xuXHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHR0aGlzLnNvcnRJbWFnZXMoKTtcblx0XHRcdHRoaXMuY3VycmVudFBhZ2UgPSAxOyAvLyBcdTYzOTJcdTVFOEZcdTUzRDhcdTUzMTZcdTU0MEVcdTkxQ0RcdTdGNkVcdTUyMzBcdTdCMkNcdTRFMDBcdTk4NzVcblx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU5ODdBXHU1RThGXHU1MjA3XHU2MzYyXG5cdFx0Y29uc3Qgb3JkZXJCdG4gPSBoZWFkZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnb3JkZXItYnV0dG9uJyB9KTtcblx0XHRvcmRlckJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcblx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRPcmRlciA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRPcmRlciA9PT0gJ2FzYycgPyAnZGVzYycgOiAnYXNjJztcblx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0dGhpcy5zb3J0SW1hZ2VzKCk7XG5cdFx0XHR0aGlzLmN1cnJlbnRQYWdlID0gMTsgLy8gXHU2MzkyXHU1RThGXHU5ODdBXHU1RThGXHU1M0Q4XHU1MzE2XHU1NDBFXHU5MUNEXHU3RjZFXHU1MjMwXHU3QjJDXHU0RTAwXHU5ODc1XG5cdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHR9KTtcblx0XHRzZXRJY29uKG9yZGVyQnRuLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zb3J0T3JkZXIgPT09ICdhc2MnID8gJ2Fycm93LXVwJyA6ICdhcnJvdy1kb3duJyk7XG5cdH1cblxuXHRzb3J0SW1hZ2VzKCkge1xuXHRcdGNvbnN0IHsgc29ydEJ5LCBzb3J0T3JkZXIgfSA9IHRoaXMucGx1Z2luLnNldHRpbmdzO1xuXHRcdGNvbnN0IG11bHRpcGxpZXIgPSBzb3J0T3JkZXIgPT09ICdhc2MnID8gMSA6IC0xO1xuXG5cdFx0dGhpcy5pbWFnZXMuc29ydCgoYSwgYikgPT4ge1xuXHRcdFx0c3dpdGNoIChzb3J0QnkpIHtcblx0XHRcdFx0Y2FzZSAnbmFtZSc6XG5cdFx0XHRcdFx0cmV0dXJuIG11bHRpcGxpZXIgKiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuXHRcdFx0XHRjYXNlICdkYXRlJzpcblx0XHRcdFx0XHRyZXR1cm4gbXVsdGlwbGllciAqIChhLm1vZGlmaWVkIC0gYi5tb2RpZmllZCk7XG5cdFx0XHRcdGNhc2UgJ3NpemUnOlxuXHRcdFx0XHRcdHJldHVybiBtdWx0aXBsaWVyICogKGEuc2l6ZSAtIGIuc2l6ZSk7XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclRodW1ibmFpbEZhbGxiYWNrKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGljb25OYW1lOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpIHtcblx0XHRjb250YWluZXIuZW1wdHkoKTtcblxuXHRcdGNvbnN0IGZhbGxiYWNrID0gY29udGFpbmVyLmNyZWF0ZURpdigpO1xuXHRcdGZhbGxiYWNrLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRmYWxsYmFjay5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcblx0XHRmYWxsYmFjay5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG5cdFx0ZmFsbGJhY2suc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcblx0XHRmYWxsYmFjay5zdHlsZS5nYXAgPSAnNnB4Jztcblx0XHRmYWxsYmFjay5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LW11dGVkKSc7XG5cblx0XHRjb25zdCBpY29uRWwgPSBmYWxsYmFjay5jcmVhdGVEaXYoKTtcblx0XHRzZXRJY29uKGljb25FbCwgaWNvbk5hbWUpO1xuXG5cdFx0Y29uc3QgbGFiZWxFbCA9IGZhbGxiYWNrLmNyZWF0ZURpdih7IHRleHQ6IGxhYmVsIH0pO1xuXHRcdGxhYmVsRWwuc3R5bGUuZm9udFNpemUgPSAnMC43NWVtJztcblx0XHRsYWJlbEVsLnN0eWxlLnRleHRUcmFuc2Zvcm0gPSAndXBwZXJjYXNlJztcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTWVkaWFUaHVtYm5haWwoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZmlsZTogVEZpbGUsIGRpc3BsYXlOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBtZWRpYVR5cGUgPSBnZXRNZWRpYVR5cGUoZmlsZS5uYW1lKTtcblx0XHRjb25zdCBzcmMgPSB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cblx0XHRpZiAobWVkaWFUeXBlID09PSAnaW1hZ2UnKSB7XG5cdFx0XHQvLyBcdTRGMThcdTUxNDhcdTRFQ0UgSW5kZXhlZERCIFx1N0YxM1x1NUI1OFx1NTJBMFx1OEY3RFx1N0YyOVx1NzU2NVx1NTZGRVxuXHRcdFx0dGhpcy5yZW5kZXJDYWNoZWRUaHVtYm5haWwoY29udGFpbmVyLCBmaWxlLCBzcmMsIGRpc3BsYXlOYW1lKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAobWVkaWFUeXBlID09PSAndmlkZW8nKSB7XG5cdFx0XHRjb25zdCB2aWRlbyA9IGNvbnRhaW5lci5jcmVhdGVFbCgndmlkZW8nKTtcblx0XHRcdHZpZGVvLnNyYyA9IHNyYztcblx0XHRcdHZpZGVvLm11dGVkID0gdHJ1ZTtcblx0XHRcdHZpZGVvLnByZWxvYWQgPSAnbWV0YWRhdGEnO1xuXHRcdFx0dmlkZW8ucGxheXNJbmxpbmUgPSB0cnVlO1xuXHRcdFx0dmlkZW8uc3R5bGUud2lkdGggPSAnMTAwJSc7XG5cdFx0XHR2aWRlby5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG5cdFx0XHR2aWRlby5zdHlsZS5vYmplY3RGaXQgPSAnY292ZXInO1xuXHRcdFx0dmlkZW8uYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAndmlkZW8nLCAnVklERU8nKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICdhdWRpbycpIHtcblx0XHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAnbXVzaWMnLCAnQVVESU8nKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAobWVkaWFUeXBlID09PSAnZG9jdW1lbnQnKSB7XG5cdFx0XHR0aGlzLnJlbmRlclRodW1ibmFpbEZhbGxiYWNrKGNvbnRhaW5lciwgJ2ZpbGUtdGV4dCcsIGdldERvY3VtZW50RGlzcGxheUxhYmVsKGZpbGUubmFtZSkpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAnZmlsZScsICdGSUxFJyk7XG5cdH1cblxuXHQvKipcblx0ICogXHU0RjdGXHU3NTI4IEluZGV4ZWREQiBcdTdGMTNcdTVCNThcdTc2ODRcdTdGMjlcdTc1NjVcdTU2RkVcdTZFMzJcdTY3RDNcdTU2RkVcdTcyNDdcblx0ICogXHU3RjEzXHU1QjU4XHU1NDdEXHU0RTJEXHU2NUY2XHU3NkY0XHU2M0E1XHU3NTI4IEJsb2IgVVJMXHVGRjBDXHU1NDI2XHU1MjE5XHU0RjdGXHU3NTI4XHU1MzlGXHU1OUNCc3JjXHU1RTc2XHU1RjAyXHU2QjY1XHU3NTFGXHU2MjEwXHU3RjEzXHU1QjU4XG5cdCAqL1xuXHRwcml2YXRlIHJlbmRlckNhY2hlZFRodW1ibmFpbChjb250YWluZXI6IEhUTUxFbGVtZW50LCBmaWxlOiBURmlsZSwgc3JjOiBzdHJpbmcsIGRpc3BsYXlOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBjYWNoZSA9IHRoaXMucGx1Z2luLnRodW1ibmFpbENhY2hlO1xuXHRcdGNvbnN0IG10aW1lID0gZmlsZS5zdGF0Lm10aW1lO1xuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBIGltZyBcdTUxNDNcdTdEMjBcdUZGMDhcdTUxNDhcdTc1MjhcdTUzNjBcdTRGNERcdUZGMDlcblx0XHRjb25zdCBpbWcgPSBjb250YWluZXIuY3JlYXRlRWwoJ2ltZycsIHtcblx0XHRcdGF0dHI6IHsgYWx0OiBkaXNwbGF5TmFtZSB9XG5cdFx0fSk7XG5cdFx0aW1nLnN0eWxlLm9wYWNpdHkgPSAnMCc7XG5cdFx0aW1nLnN0eWxlLnRyYW5zaXRpb24gPSAnb3BhY2l0eSAwLjJzJztcblxuXHRcdGltZy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdGNvbnRhaW5lci5lbXB0eSgpO1xuXHRcdFx0Y29udGFpbmVyLmNyZWF0ZURpdih7XG5cdFx0XHRcdGNsczogJ2ltYWdlLWVycm9yJyxcblx0XHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnaW1hZ2VMb2FkRXJyb3InKVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBTVkcgXHU0RTBEXHU5NzAwXHU4OTgxXHU3RjEzXHU1QjU4XHU3RjI5XHU3NTY1XHU1NkZFXHUyMDE0XHUyMDE0XHU3NkY0XHU2M0E1XHU0RjdGXHU3NTI4XHU1MzlGXHU1OUNCXHU4REVGXHU1Rjg0XG5cdFx0aWYgKGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkgPT09ICdzdmcnKSB7XG5cdFx0XHRpbWcuc3JjID0gc3JjO1xuXHRcdFx0aW1nLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU1QzFEXHU4QkQ1XHU0RUNFXHU3RjEzXHU1QjU4XHU4M0I3XHU1M0Q2XG5cdFx0dm9pZCBjYWNoZS5nZXQoZmlsZS5wYXRoLCBtdGltZSkudGhlbihjYWNoZWRVcmwgPT4ge1xuXHRcdFx0aWYgKGNhY2hlZFVybCkge1xuXHRcdFx0XHRpbWcuc3JjID0gY2FjaGVkVXJsO1xuXHRcdFx0XHRpbWcuc3R5bGUub3BhY2l0eSA9ICcxJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFx1N0YxM1x1NUI1OFx1NjcyQVx1NTQ3RFx1NEUyRFx1RkYxQVx1NTE0OFx1NjYzRVx1NzkzQVx1NTM5Rlx1NTZGRVxuXHRcdFx0XHRpbWcuc3JjID0gc3JjO1xuXHRcdFx0XHRpbWcuc3R5bGUub3BhY2l0eSA9ICcxJztcblxuXHRcdFx0XHQvLyBcdTVGMDJcdTZCNjVcdTc1MUZcdTYyMTBcdTdGMjlcdTc1NjVcdTU2RkVcdTVFNzZcdTVCNThcdTUxNjVcdTdGMTNcdTVCNThcblx0XHRcdFx0dm9pZCBnZW5lcmF0ZVRodW1ibmFpbChzcmMsIDMwMCkudGhlbigoeyBibG9iLCB3aWR0aCwgaGVpZ2h0IH0pID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gY2FjaGUucHV0KGZpbGUucGF0aCwgbXRpbWUsIGJsb2IsIHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0XHR9KS5jYXRjaCgoKSA9PiB7XG5cdFx0XHRcdFx0Ly8gXHU3RjI5XHU3NTY1XHU1NkZFXHU3NTFGXHU2MjEwXHU1OTMxXHU4RDI1XHU0RTBEXHU1RjcxXHU1NENEXHU2NjNFXHU3OTNBXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmVuZGVySW1hZ2VJdGVtKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGltYWdlOiBJbWFnZUl0ZW0pIHtcblx0XHRjb25zdCBpdGVtID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ2ltYWdlLWl0ZW0nIH0pO1xuXG5cdFx0Ly8gXHU1OTgyXHU2NzlDXHU1NzI4XHU5MDA5XHU2MkU5XHU2QTIxXHU1RjBGXHU0RTBCXHVGRjBDXHU2REZCXHU1MkEwXHU1OTBEXHU5MDA5XHU2ODQ2XG5cdFx0aWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKSB7XG5cdFx0XHRjb25zdCBjaGVja2JveCA9IGl0ZW0uY3JlYXRlRWwoJ2lucHV0Jywge1xuXHRcdFx0XHR0eXBlOiAnY2hlY2tib3gnLFxuXHRcdFx0XHRjbHM6ICdpdGVtLWNoZWNrYm94J1xuXHRcdFx0fSk7XG5cdFx0XHRjaGVja2JveC5jaGVja2VkID0gdGhpcy5zZWxlY3RlZEZpbGVzLmhhcyhpbWFnZS5maWxlLnBhdGgpO1xuXHRcdFx0Y2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcblx0XHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHRcdFx0aWYgKHRhcmdldC5jaGVja2VkKSB7XG5cdFx0XHRcdFx0dGhpcy5zZWxlY3RlZEZpbGVzLmFkZChpbWFnZS5maWxlLnBhdGgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5kZWxldGUoaW1hZ2UuZmlsZS5wYXRoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBXHU1NkZFXHU3MjQ3XHU1QkI5XHU1NjY4XG5cdFx0Y29uc3QgaW1nQ29udGFpbmVyID0gaXRlbS5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1jb250YWluZXInIH0pO1xuXG5cdFx0Y29uc3QgZmlsZSA9IGltYWdlLmZpbGU7XG5cdFx0dGhpcy5yZW5kZXJNZWRpYVRodW1ibmFpbChpbWdDb250YWluZXIsIGZpbGUsIGltYWdlLm5hbWUpO1xuXG5cdFx0aW1nQ29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKSB7XG5cdFx0XHRcdC8vIFx1NTcyOFx1OTAwOVx1NjJFOVx1NkEyMVx1NUYwRlx1NEUwQlx1RkYwQ1x1NzBCOVx1NTFGQlx1NTIwN1x1NjM2Mlx1OTAwOVx1NjJFOVx1NzJCNlx1NjAwMVxuXHRcdFx0XHRpZiAodGhpcy5zZWxlY3RlZEZpbGVzLmhhcyhpbWFnZS5maWxlLnBhdGgpKSB7XG5cdFx0XHRcdFx0dGhpcy5zZWxlY3RlZEZpbGVzLmRlbGV0ZShpbWFnZS5maWxlLnBhdGgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5hZGQoaW1hZ2UuZmlsZS5wYXRoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFx1NTcyOFx1NjY2RVx1OTAxQVx1NkEyMVx1NUYwRlx1NEUwQlx1RkYwQ1x1NjI1M1x1NUYwMFx1OTg4NFx1ODlDOFxuXHRcdFx0XHR0aGlzLnBsdWdpbi5vcGVuTWVkaWFQcmV2aWV3KGltYWdlLmZpbGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU1M0YzXHU5NTJFXHU4M0RDXHU1MzU1XG5cdFx0aXRlbS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIChlKSA9PiB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLnNob3dDb250ZXh0TWVudShlIGFzIE1vdXNlRXZlbnQsIGZpbGUpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU2NjNFXHU3OTNBXHU1NkZFXHU3MjQ3XHU0RkUxXHU2MDZGXG5cdFx0aWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dJbWFnZUluZm8pIHtcblx0XHRcdGNvbnN0IGluZm8gPSBpdGVtLmNyZWF0ZURpdih7IGNsczogJ2ltYWdlLWluZm8nIH0pO1xuXHRcdFx0aW5mby5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1uYW1lJywgdGV4dDogaW1hZ2UubmFtZSB9KTtcblx0XHRcdGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaW1hZ2Utc2l6ZScsIHRleHQ6IGZvcm1hdEZpbGVTaXplKGltYWdlLnNpemUpIH0pO1xuXHRcdH1cblx0fVxuXG5cdHNob3dDb250ZXh0TWVudShldmVudDogTW91c2VFdmVudCwgZmlsZTogVEZpbGUpIHtcblx0XHRjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnb3BlbkluTm90ZXMnKSlcblx0XHRcdFx0LnNldEljb24oJ3NlYXJjaCcpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5vcGVuSW1hZ2VJbk5vdGVzKGZpbGUpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnY29weVBhdGgnKSlcblx0XHRcdFx0LnNldEljb24oJ2xpbmsnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChmaWxlLnBhdGgpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdwYXRoQ29waWVkJykpO1xuXHRcdFx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdjb3B5TGluaycpKVxuXHRcdFx0XHQuc2V0SWNvbignY29weScpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBsaW5rID0gYFtbJHtmaWxlLm5hbWV9XV1gO1xuXHRcdFx0XHRcdHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobGluaykudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2xpbmtDb3BpZWQnKSk7XG5cdFx0XHRcdFx0fSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdcdTU5MERcdTUyMzZcdTUyMzBcdTUyNkFcdThEMzRcdTY3N0ZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdlcnJvcicpKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRpdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ29wZW5PcmlnaW5hbCcpKVxuXHRcdFx0XHQuc2V0SWNvbignZXh0ZXJuYWwtbGluaycpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBzcmMgPSB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cdFx0XHRcdFx0d2luZG93Lm9wZW4oc3JjLCAnX2JsYW5rJywgJ25vb3BlbmVyLG5vcmVmZXJyZXInKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTRFQzVcdTU2RkVcdTcyNDdcdTY2M0VcdTc5M0FcdTU5MDRcdTc0MDZcdTkwMDlcdTk4Nzlcblx0XHRpZiAoZ2V0TWVkaWFUeXBlKGZpbGUubmFtZSkgPT09ICdpbWFnZScpIHtcblx0XHRcdG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cblx0XHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdvcmdhbml6aW5nJykpXG5cdFx0XHRcdFx0LnNldEljb24oJ2ZvbGRlci1pbnB1dCcpXG5cdFx0XHRcdFx0Lm9uQ2xpY2soKCkgPT4gdGhpcy5vcmdhbml6ZUZpbGUoZmlsZSkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh0aGlzLmlzUHJvY2Vzc2FibGVJbWFnZShmaWxlKSkge1xuXHRcdFx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdwcm9jZXNzaW5nJykpXG5cdFx0XHRcdFx0XHQuc2V0SWNvbignaW1hZ2UtZG93bicpXG5cdFx0XHRcdFx0XHQub25DbGljaygoKSA9PiB0aGlzLnByb2Nlc3NGaWxlKGZpbGUpKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bWVudS5zaG93QXRQb3NpdGlvbih7IHg6IGV2ZW50LmNsaWVudFgsIHk6IGV2ZW50LmNsaWVudFkgfSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2MzA5XHU4OUM0XHU1MjE5XHU2NTc0XHU3NDA2XHU1MzU1XHU0RTJBXHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIG9yZ2FuaXplRmlsZShmaWxlOiBURmlsZSkge1xuXHRcdGNvbnN0IHJ1bGVzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3JnYW5pemVSdWxlcztcblx0XHRjb25zdCBydWxlID0gZmluZE1hdGNoaW5nUnVsZShydWxlcywgZmlsZSk7XG5cdFx0aWYgKCFydWxlKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ25vTWF0Y2hpbmdGaWxlcycpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBjdHggPSBhd2FpdCB0aGlzLmJ1aWxkT3JnYW5pemVDb250ZXh0KGZpbGUpO1xuXHRcdGNvbnN0IHRhcmdldCA9IGNvbXB1dGVUYXJnZXQocnVsZSwgY3R4KTtcblxuXHRcdGlmICh0YXJnZXQubmV3UGF0aCA9PT0gZmlsZS5wYXRoKSByZXR1cm47XG5cblx0XHRhd2FpdCB0aGlzLnBsdWdpbi5lbnN1cmVGb2xkZXJFeGlzdHModGFyZ2V0Lm5ld1BhdGguc3Vic3RyaW5nKDAsIHRhcmdldC5uZXdQYXRoLmxhc3RJbmRleE9mKCcvJykpKTtcblx0XHRhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIHRhcmdldC5uZXdQYXRoKTtcblx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ29yZ2FuaXplQ29tcGxldGUnLCB7IGNvdW50OiAxIH0pKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYyNzlcdTkxQ0ZcdTY1NzRcdTc0MDZcdTkwMDlcdTRFMkRcdTY1ODdcdTRFRjZcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgb3JnYW5pemVTZWxlY3RlZCgpIHtcblx0XHRpZiAodGhpcy5zZWxlY3RlZEZpbGVzLnNpemUgPT09IDApIHJldHVybjtcblxuXHRcdGNvbnN0IHJ1bGVzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3JnYW5pemVSdWxlcztcblx0XHRsZXQgb3JnYW5pemVkQ291bnQgPSAwO1xuXG5cdFx0Zm9yIChjb25zdCBwYXRoIG9mIHRoaXMuc2VsZWN0ZWRGaWxlcykge1xuXHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblx0XHRcdGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBydWxlID0gZmluZE1hdGNoaW5nUnVsZShydWxlcywgZmlsZSk7XG5cdFx0XHRpZiAoIXJ1bGUpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBjdHggPSBhd2FpdCB0aGlzLmJ1aWxkT3JnYW5pemVDb250ZXh0KGZpbGUpO1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gY29tcHV0ZVRhcmdldChydWxlLCBjdHgpO1xuXG5cdFx0XHRpZiAodGFyZ2V0Lm5ld1BhdGggPT09IGZpbGUucGF0aCkgY29udGludWU7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLmVuc3VyZUZvbGRlckV4aXN0cyh0YXJnZXQubmV3UGF0aC5zdWJzdHJpbmcoMCwgdGFyZ2V0Lm5ld1BhdGgubGFzdEluZGV4T2YoJy8nKSkpO1xuXHRcdFx0XHRhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIHRhcmdldC5uZXdQYXRoKTtcblx0XHRcdFx0b3JnYW5pemVkQ291bnQrKztcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgXHU2NTc0XHU3NDA2XHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OiAke2ZpbGUubmFtZX1gLCBlcnJvcik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdvcmdhbml6ZUNvbXBsZXRlJywgeyBjb3VudDogb3JnYW5pemVkQ291bnQgfSkpO1xuXHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5jbGVhcigpO1xuXHRcdHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0gZmFsc2U7XG5cdFx0YXdhaXQgdGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2Nzg0XHU1RUZBXHU2NTc0XHU3NDA2XHU0RTBBXHU0RTBCXHU2NTg3XHVGRjA4XHU1MzA1XHU1NDJCIEVYSUYgXHU4OUUzXHU2NzkwXHVGRjA5XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGJ1aWxkT3JnYW5pemVDb250ZXh0KGZpbGU6IFRGaWxlKTogUHJvbWlzZTxPcmdhbml6ZUNvbnRleHQ+IHtcblx0XHRjb25zdCBkYXRlID0gbmV3IERhdGUoZmlsZS5zdGF0Lm10aW1lKTtcblx0XHRjb25zdCBjdHg6IE9yZ2FuaXplQ29udGV4dCA9IHsgZmlsZSwgZGF0ZSB9O1xuXG5cdFx0Ly8gXHU1QzFEXHU4QkQ1XHU4OUUzXHU2NzkwIEVYSUZcdUZGMDhcdTRFQzUgSlBFR1x1RkYwOVxuXHRcdGNvbnN0IGV4dCA9IGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKGV4dCA9PT0gJ2pwZycgfHwgZXh0ID09PSAnanBlZycpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWRCaW5hcnkoZmlsZSk7XG5cdFx0XHRcdGN0eC5leGlmID0gcGFyc2VFeGlmKGJ1ZmZlcik7XG5cdFx0XHR9IGNhdGNoIHsgLyogRVhJRiBcdTg5RTNcdTY3OTBcdTU5MzFcdThEMjVcdTRFMERcdTVGNzFcdTU0Q0RcdTY1NzRcdTc0MDYgKi8gfVxuXHRcdH1cblxuXHRcdHJldHVybiBjdHg7XG5cdH1cblxuXHRwcml2YXRlIGdldFByb2Nlc3NTZXR0aW5ncygpIHtcblx0XHRjb25zdCBzZXR0aW5ncyA9IHRoaXMucGx1Z2luLnNldHRpbmdzO1xuXHRcdHJldHVybiB7XG5cdFx0XHRxdWFsaXR5OiBzZXR0aW5ncy5kZWZhdWx0UHJvY2Vzc1F1YWxpdHksXG5cdFx0XHRmb3JtYXQ6IHNldHRpbmdzLmRlZmF1bHRQcm9jZXNzRm9ybWF0LFxuXHRcdFx0d2F0ZXJtYXJrOiBzZXR0aW5ncy53YXRlcm1hcmtUZXh0ID8ge1xuXHRcdFx0XHR0ZXh0OiBzZXR0aW5ncy53YXRlcm1hcmtUZXh0LFxuXHRcdFx0XHRwb3NpdGlvbjogJ2JvdHRvbS1yaWdodCcgYXMgY29uc3QsXG5cdFx0XHRcdG9wYWNpdHk6IDAuNVxuXHRcdFx0fSA6IHVuZGVmaW5lZFxuXHRcdH07XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHByb2Nlc3NBbmRSZXBsYWNlRmlsZShmaWxlOiBURmlsZSk6IFByb21pc2U8e1xuXHRcdGJhc2VOYW1lOiBzdHJpbmc7XG5cdFx0b3JpZ2luYWxTaXplOiBudW1iZXI7XG5cdFx0bmV3U2l6ZTogbnVtYmVyO1xuXHR9PiB7XG5cdFx0Y29uc3Qgc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdGNvbnN0IG9yaWdpbmFsU2l6ZSA9IGZpbGUuc3RhdC5zaXplO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHByb2Nlc3NJbWFnZShzcmMsIG9yaWdpbmFsU2l6ZSwgdGhpcy5nZXRQcm9jZXNzU2V0dGluZ3MoKSk7XG5cdFx0Y29uc3QgbmV3RXh0ID0gZ2V0Rm9ybWF0RXh0ZW5zaW9uKHJlc3VsdC5mb3JtYXQpO1xuXHRcdGNvbnN0IGJhc2VOYW1lID0gZmlsZS5uYW1lLnJlcGxhY2UoL1xcLlteLl0rJC8sICcnKTtcblx0XHRjb25zdCBuZXdQYXRoID0gZmlsZS5wYXJlbnRcblx0XHRcdD8gYCR7ZmlsZS5wYXJlbnQucGF0aH0vJHtiYXNlTmFtZX0ke25ld0V4dH1gXG5cdFx0XHQ6IGAke2Jhc2VOYW1lfSR7bmV3RXh0fWA7XG5cdFx0Y29uc3QgYXJyYXlCdWZmZXIgPSBhd2FpdCByZXN1bHQuYmxvYi5hcnJheUJ1ZmZlcigpO1xuXG5cdFx0aWYgKG5ld1BhdGggPT09IGZpbGUucGF0aCkge1xuXHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5QmluYXJ5KGZpbGUsIGFycmF5QnVmZmVyKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGJhc2VOYW1lLFxuXHRcdFx0XHRvcmlnaW5hbFNpemUsXG5cdFx0XHRcdG5ld1NpemU6IHJlc3VsdC5uZXdTaXplXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5ld1BhdGgpO1xuXHRcdGlmIChleGlzdGluZyAmJiBleGlzdGluZy5wYXRoICE9PSBmaWxlLnBhdGgpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcih0aGlzLnBsdWdpbi50KCd0YXJnZXRGaWxlRXhpc3RzJykpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9yaWdpbmFsQnVmZmVyID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZEJpbmFyeShmaWxlKTtcblxuXHRcdC8vIFx1NTE0OFx1NTE5OVx1NTE2NVx1OEY2Q1x1NjM2Mlx1NTQwRVx1NzY4NFx1NTE4NVx1NUJCOVx1RkYwQ1x1OTA3Rlx1NTE0RCByZW5hbWUgXHU2NzFGXHU5NUY0XHU1MUZBXHU3M0IwXHU2MjY5XHU1QzU1XHU1NDBEXHU1NDhDXHU1QjlFXHU5NjQ1XHU1QjU3XHU4MjgyXHU2ODNDXHU1RjBGXHU0RTBEXHU0RTAwXHU4MUY0XHUzMDAyXG5cdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5QmluYXJ5KGZpbGUsIGFycmF5QnVmZmVyKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIG5ld1BhdGgpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnlCaW5hcnkoZmlsZSwgb3JpZ2luYWxCdWZmZXIpO1xuXHRcdFx0fSBjYXRjaCAocm9sbGJhY2tFcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBcdTU2REVcdTZFREFcdTU5MDRcdTc0MDZcdTU0MEVcdTc2ODRcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6ICR7ZmlsZS5uYW1lfWAsIHJvbGxiYWNrRXJyb3IpO1xuXHRcdFx0fVxuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGJhc2VOYW1lLFxuXHRcdFx0b3JpZ2luYWxTaXplLFxuXHRcdFx0bmV3U2l6ZTogcmVzdWx0Lm5ld1NpemVcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIENhbnZhcyBcdTU5MDRcdTc0MDZcdTUzNTVcdTRFMkFcdTY1ODdcdTRFRjZcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcHJvY2Vzc0ZpbGUoZmlsZTogVEZpbGUpIHtcblx0XHRpZiAoIXRoaXMuaXNQcm9jZXNzYWJsZUltYWdlKGZpbGUpKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3Vuc3VwcG9ydGVkRmlsZVR5cGUnKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHsgYmFzZU5hbWUsIG9yaWdpbmFsU2l6ZSwgbmV3U2l6ZSB9ID0gYXdhaXQgdGhpcy5wcm9jZXNzQW5kUmVwbGFjZUZpbGUoZmlsZSk7XG5cdFx0XHRjb25zdCBzYXZlZCA9IE1hdGgubWF4KDAsIG9yaWdpbmFsU2l6ZSAtIG5ld1NpemUpO1xuXHRcdFx0bmV3IE5vdGljZShgXHUyNzA1ICR7YmFzZU5hbWV9OiAke2Zvcm1hdEZpbGVTaXplKG9yaWdpbmFsU2l6ZSl9IFx1MjE5MiAke2Zvcm1hdEZpbGVTaXplKG5ld1NpemUpfSAoXHU4MjgyXHU3NzAxICR7Zm9ybWF0RmlsZVNpemUoc2F2ZWQpfSlgKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihgXHU1OTA0XHU3NDA2XHU1OTMxXHU4RDI1OiAke2ZpbGUubmFtZX1gLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykgKyBgOiAke2ZpbGUubmFtZX1gKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2Mjc5XHU5MUNGIENhbnZhcyBcdTU5MDRcdTc0MDZcdTkwMDlcdTRFMkRcdTY1ODdcdTRFRjZcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcHJvY2Vzc1NlbGVjdGVkKCkge1xuXHRcdGlmICh0aGlzLnNlbGVjdGVkRmlsZXMuc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXG5cdFx0bGV0IHByb2Nlc3NlZCA9IDA7XG5cdFx0bGV0IHNraXBwZWQgPSAwO1xuXHRcdGxldCB0b3RhbFNhdmVkID0gMDtcblxuXHRcdGZvciAoY29uc3QgcGF0aCBvZiB0aGlzLnNlbGVjdGVkRmlsZXMpIHtcblx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG5cdFx0XHRpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcblx0XHRcdGlmICghdGhpcy5pc1Byb2Nlc3NhYmxlSW1hZ2UoZmlsZSkpIHtcblx0XHRcdFx0c2tpcHBlZCsrO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgeyBvcmlnaW5hbFNpemUsIG5ld1NpemUgfSA9IGF3YWl0IHRoaXMucHJvY2Vzc0FuZFJlcGxhY2VGaWxlKGZpbGUpO1xuXHRcdFx0XHRwcm9jZXNzZWQrKztcblx0XHRcdFx0dG90YWxTYXZlZCArPSBNYXRoLm1heCgwLCBvcmlnaW5hbFNpemUgLSBuZXdTaXplKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgXHU1OTA0XHU3NDA2XHU1OTMxXHU4RDI1OiAke3BhdGh9YCwgZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IHN1ZmZpeCA9IHNraXBwZWQgPiAwID8gYFx1RkYwQ1x1OERGM1x1OEZDNyAke3NraXBwZWR9IFx1NEUyQVx1NEUwRFx1NjUyRlx1NjMwMVx1NzY4NFx1NjU4N1x1NEVGNmAgOiAnJztcblx0XHRuZXcgTm90aWNlKGBcdTI3MDUgXHU1OTA0XHU3NDA2XHU1QjhDXHU2MjEwOiAke3Byb2Nlc3NlZH0gXHU0RTJBXHU2NTg3XHU0RUY2XHVGRjBDXHU4MjgyXHU3NzAxICR7Zm9ybWF0RmlsZVNpemUodG90YWxTYXZlZCl9JHtzdWZmaXh9YCk7XG5cdFx0dGhpcy5zZWxlY3RlZEZpbGVzLmNsZWFyKCk7XG5cdFx0dGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBmYWxzZTtcblx0XHRhd2FpdCB0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0fVxuXG5cdC8vIFx1NURGMlx1NzlGQlx1OTY2NCBmb3JtYXRGaWxlU2l6ZSBcdTY1QjlcdTZDRDVcdUZGMENcdTRGN0ZcdTc1MjggdXRpbHMvZm9ybWF0LnRzIFx1NEUyRFx1NzY4NFx1NUI5RVx1NzNCMFxufVxuIiwgIi8qKlxuICogXHU5MDFBXHU3NTI4XHU1REU1XHU1MTc3XHU1MUZEXHU2NTcwXHU2QTIxXHU1NzU3XG4gKi9cblxuLyoqXG4gKiBcdTY4M0NcdTVGMEZcdTUzMTZcdTY1ODdcdTRFRjZcdTU5MjdcdTVDMEZcbiAqIEBwYXJhbSBieXRlcyBcdTVCNTdcdTgyODJcdTY1NzBcbiAqIEByZXR1cm5zIFx1NjgzQ1x1NUYwRlx1NTMxNlx1NTQwRVx1NzY4NFx1NTkyN1x1NUMwRlx1NUI1N1x1N0IyNlx1NEUzMlx1RkYwQ1x1NTk4MiBcIjEuNSBNQlwiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRGaWxlU2l6ZShieXRlczogbnVtYmVyKTogc3RyaW5nIHtcblx0aWYgKCFOdW1iZXIuaXNGaW5pdGUoYnl0ZXMpIHx8IGJ5dGVzIDw9IDApIHJldHVybiAnMCBCJztcblx0Y29uc3QgayA9IDEwMjQ7XG5cdGNvbnN0IHNpemVzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJ107XG5cdGNvbnN0IGkgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihNYXRoLmZsb29yKE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKGspKSwgc2l6ZXMubGVuZ3RoIC0gMSkpO1xuXHRyZXR1cm4gcGFyc2VGbG9hdCgoYnl0ZXMgLyBNYXRoLnBvdyhrLCBpKSkudG9GaXhlZCgyKSkgKyAnICcgKyBzaXplc1tpXTtcbn1cblxuLyoqXG4gKiBcdTk2MzJcdTYyOTZcdTUxRkRcdTY1NzBcbiAqIEBwYXJhbSBmbiBcdTg5ODFcdTYyNjdcdTg4NENcdTc2ODRcdTUxRkRcdTY1NzBcbiAqIEBwYXJhbSBkZWxheSBcdTVFRjZcdThGREZcdTY1RjZcdTk1RjRcdUZGMDhcdTZCRUJcdTc5RDJcdUZGMDlcbiAqIEByZXR1cm5zIFx1OTYzMlx1NjI5Nlx1NTkwNFx1NzQwNlx1NTQwRVx1NzY4NFx1NTFGRFx1NjU3MFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVib3VuY2U8VCBleHRlbmRzICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24+KFxuXHRmbjogVCxcblx0ZGVsYXk6IG51bWJlclxuKTogKC4uLmFyZ3M6IFBhcmFtZXRlcnM8VD4pID0+IHZvaWQge1xuXHRsZXQgdGltZW91dElkOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xuXG5cdHJldHVybiAoLi4uYXJnczogUGFyYW1ldGVyczxUPikgPT4ge1xuXHRcdGlmICh0aW1lb3V0SWQpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuXHRcdH1cblx0XHR0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGZuKC4uLmFyZ3MpO1xuXHRcdH0sIGRlbGF5KTtcblx0fTtcbn1cbiIsICIvKipcbiAqIFx1OERFRlx1NUY4NFx1NURFNVx1NTE3N1x1NTFGRFx1NjU3MFxuICogT2JzaWRpYW4gXHU1MTg1XHU5MEU4XHU4REVGXHU1Rjg0XHU3RURGXHU0RTAwXHU0RjdGXHU3NTI4IFwiL1wiXHVGRjBDXHU4RkQ5XHU5MUNDXHU5NkM2XHU0RTJEXHU1MDVBXHU4REU4XHU1RTczXHU1M0YwXHU4OUM0XHU4MzAzXHU1MzE2XG4gKi9cblxuLyoqXG4gKiBcdTg5QzRcdTgzMDNcdTUzMTYgVmF1bHQgXHU3NkY4XHU1QkY5XHU4REVGXHU1Rjg0XG4gKiAtIFx1N0VERlx1NEUwMFx1NTIwNlx1OTY5NFx1N0IyNlx1NEUzQSBcIi9cIlxuICogLSBcdTUzQkJcdTYzODlcdTk5OTZcdTVDM0VcdTdBN0FcdTc2N0RcbiAqIC0gXHU1M0JCXHU2Mzg5XHU5MUNEXHU1OTBEXHU1MjA2XHU5Njk0XHU3QjI2XHUzMDAxXHU1MjREXHU1QkZDIFwiLi9cIlx1MzAwMVx1NjcyQlx1NUMzRSBcIi9cIlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVmF1bHRQYXRoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJykgcmV0dXJuICcnO1xuXG5cdGxldCBub3JtYWxpemVkID0gaW5wdXQudHJpbSgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblx0bm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQucmVwbGFjZSgvXFwvezIsfS9nLCAnLycpO1xuXHRub3JtYWxpemVkID0gbm9ybWFsaXplZC5yZXBsYWNlKC9eXFwvKy8sICcnKTtcblxuXHR3aGlsZSAobm9ybWFsaXplZC5zdGFydHNXaXRoKCcuLycpKSB7XG5cdFx0bm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQuc2xpY2UoMik7XG5cdH1cblxuXHRub3JtYWxpemVkID0gbm9ybWFsaXplZC5yZXBsYWNlKC9cXC8rJC8sICcnKTtcblx0cmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU4REVGXHU1Rjg0XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XHU1NDBEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGaWxlTmFtZUZyb21QYXRoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplVmF1bHRQYXRoKGlucHV0KTtcblx0aWYgKCFub3JtYWxpemVkKSByZXR1cm4gJyc7XG5cdGNvbnN0IHBhcnRzID0gbm9ybWFsaXplZC5zcGxpdCgnLycpO1xuXHRyZXR1cm4gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gfHwgJyc7XG59XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU4REVGXHU1Rjg0XHU0RTJEXHU3Njg0XHU3MjM2XHU3NkVFXHU1RjU1XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRQYXRoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplVmF1bHRQYXRoKGlucHV0KTtcblx0aWYgKCFub3JtYWxpemVkKSByZXR1cm4gJyc7XG5cdGNvbnN0IGlkeCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoJy8nKTtcblx0cmV0dXJuIGlkeCA9PT0gLTEgPyAnJyA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgaWR4KTtcbn1cblxuLyoqXG4gKiBcdTVCODlcdTUxNjhcdTg5RTNcdTc4MDEgVVJJIFx1NzI0N1x1NkJCNVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FmZURlY29kZVVSSUNvbXBvbmVudChpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGlucHV0KTtcblx0fSBjYXRjaCB7XG5cdFx0cmV0dXJuIGlucHV0O1xuXHR9XG59XG4iLCAiLyoqXG4gKiBcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEJcdTYyNjlcdTVDNTVcdTU0MERcdTdFREZcdTRFMDBcdTdCQTFcdTc0MDZcbiAqIFx1OTZDNlx1NEUyRFx1N0JBMVx1NzQwNlx1NjI0MFx1NjcwOVx1NjUyRlx1NjMwMVx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1NjI2OVx1NUM1NVx1NTQwRFx1RkYwQ1x1NEZCRlx1NEU4RVx1N0VGNFx1NjJBNFx1NTQ4Q1x1NjI2OVx1NUM1NVxuICovXG5cbi8qKlxuICogXHU1NkZFXHU3MjQ3XHU2MjY5XHU1QzU1XHU1NDBEXG4gKi9cbmV4cG9ydCBjb25zdCBJTUFHRV9FWFRFTlNJT05TID0gWycucG5nJywgJy5qcGcnLCAnLmpwZWcnLCAnLmdpZicsICcud2VicCcsICcuc3ZnJywgJy5ibXAnXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTg5QzZcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGNvbnN0IFZJREVPX0VYVEVOU0lPTlMgPSBbJy5tcDQnLCAnLm1vdicsICcuYXZpJywgJy5ta3YnLCAnLndlYm0nXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTk3RjNcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGNvbnN0IEFVRElPX0VYVEVOU0lPTlMgPSBbJy5tcDMnLCAnLndhdicsICcub2dnJywgJy5tNGEnLCAnLmZsYWMnXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTY1ODdcdTY4NjNcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGNvbnN0IERPQ1VNRU5UX0VYVEVOU0lPTlMgPSBbJy5wZGYnLCAnLmRvY3gnLCAnLnhsc3gnLCAnLnBwdHgnLCAnLmRvYycsICcueGxzJywgJy5wcHQnXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTU2RkVcdTcyNDdcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IElNQUdFX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5JTUFHRV9FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTg5QzZcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IFZJREVPX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5WSURFT19FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTk3RjNcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IEFVRElPX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5BVURJT19FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTY1ODdcdTY4NjNcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IERPQ1VNRU5UX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5ET0NVTUVOVF9FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTVBOTJcdTRGNTNcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IEFMTF9NRURJQV9FWFRFTlNJT05TOiBzdHJpbmdbXSA9IFtcblx0Li4uSU1BR0VfRVhURU5TSU9OU19TVFIsXG5cdC4uLlZJREVPX0VYVEVOU0lPTlNfU1RSLFxuXHQuLi5BVURJT19FWFRFTlNJT05TX1NUUixcblx0Li4uRE9DVU1FTlRfRVhURU5TSU9OU19TVFJcbl07XG5cbi8qKlxuICogXHU2MjY5XHU1QzU1XHU1NDBEXHU1MjMwXHU1QTkyXHU0RjUzXHU3QzdCXHU1NzhCXHU3Njg0XHU2NjIwXHU1QzA0XG4gKi9cbmV4cG9ydCBjb25zdCBFWFRFTlNJT05fVE9fVFlQRTogUmVjb3JkPHN0cmluZywgJ2ltYWdlJyB8ICd2aWRlbycgfCAnYXVkaW8nIHwgJ2RvY3VtZW50Jz4gPSB7XG5cdC8vIFx1NTZGRVx1NzI0N1xuXHQnLnBuZyc6ICdpbWFnZScsXG5cdCcuanBnJzogJ2ltYWdlJyxcblx0Jy5qcGVnJzogJ2ltYWdlJyxcblx0Jy5naWYnOiAnaW1hZ2UnLFxuXHQnLndlYnAnOiAnaW1hZ2UnLFxuXHQnLnN2Zyc6ICdpbWFnZScsXG5cdCcuYm1wJzogJ2ltYWdlJyxcblx0Ly8gXHU4OUM2XHU5ODkxXG5cdCcubXA0JzogJ3ZpZGVvJyxcblx0Jy5tb3YnOiAndmlkZW8nLFxuXHQnLmF2aSc6ICd2aWRlbycsXG5cdCcubWt2JzogJ3ZpZGVvJyxcblx0Jy53ZWJtJzogJ3ZpZGVvJyxcblx0Ly8gXHU5N0YzXHU5ODkxXG5cdCcubXAzJzogJ2F1ZGlvJyxcblx0Jy53YXYnOiAnYXVkaW8nLFxuXHQnLm9nZyc6ICdhdWRpbycsXG5cdCcubTRhJzogJ2F1ZGlvJyxcblx0Jy5mbGFjJzogJ2F1ZGlvJyxcblx0Ly8gXHU2NTg3XHU2ODYzXG5cdCcucGRmJzogJ2RvY3VtZW50Jyxcblx0Jy5kb2N4JzogJ2RvY3VtZW50Jyxcblx0Jy54bHN4JzogJ2RvY3VtZW50Jyxcblx0Jy5wcHR4JzogJ2RvY3VtZW50Jyxcblx0Jy5kb2MnOiAnZG9jdW1lbnQnLFxuXHQnLnhscyc6ICdkb2N1bWVudCcsXG5cdCcucHB0JzogJ2RvY3VtZW50J1xufTtcblxuLyoqXG4gKiBcdTgzQjdcdTUzRDZcdTY1ODdcdTRFRjZcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVDMEZcdTUxOTlcdUZGMDlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEZpbGVFeHRlbnNpb24oZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG5cdGNvbnN0IGxhc3REb3QgPSBmaWxlbmFtZS5sYXN0SW5kZXhPZignLicpO1xuXHRpZiAobGFzdERvdCA9PT0gLTEpIHJldHVybiAnJztcblx0cmV0dXJuIGZpbGVuYW1lLnN1YnN0cmluZyhsYXN0RG90KS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIFx1NjgzOVx1NjM2RVx1NjI2OVx1NUM1NVx1NTQwRFx1ODNCN1x1NTNENlx1NUE5Mlx1NEY1M1x1N0M3Qlx1NTc4QlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWVkaWFUeXBlKGZpbGVuYW1lOiBzdHJpbmcpOiAnaW1hZ2UnIHwgJ3ZpZGVvJyB8ICdhdWRpbycgfCAnZG9jdW1lbnQnIHwgbnVsbCB7XG5cdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZW5hbWUpO1xuXHRyZXR1cm4gRVhURU5TSU9OX1RPX1RZUEVbZXh0XSB8fCBudWxsO1xufVxuXG4vKipcbiAqIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NEUzQVx1NTZGRVx1NzI0N1x1NjU4N1x1NEVGNlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbWFnZUZpbGUoZmlsZW5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRjb25zdCBleHQgPSBnZXRGaWxlRXh0ZW5zaW9uKGZpbGVuYW1lKTtcblx0cmV0dXJuIElNQUdFX0VYVEVOU0lPTlNfU1RSLmluY2x1ZGVzKGV4dCk7XG59XG5cbi8qKlxuICogXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU0RTNBXHU4OUM2XHU5ODkxXHU2NTg3XHU0RUY2XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1ZpZGVvRmlsZShmaWxlbmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG5cdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZW5hbWUpO1xuXHRyZXR1cm4gVklERU9fRVhURU5TSU9OU19TVFIuaW5jbHVkZXMoZXh0KTtcbn1cblxuLyoqXG4gKiBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTRFM0FcdTk3RjNcdTk4OTFcdTY1ODdcdTRFRjZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQXVkaW9GaWxlKGZpbGVuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcblx0Y29uc3QgZXh0ID0gZ2V0RmlsZUV4dGVuc2lvbihmaWxlbmFtZSk7XG5cdHJldHVybiBBVURJT19FWFRFTlNJT05TX1NUUi5pbmNsdWRlcyhleHQpO1xufVxuXG4vKipcbiAqIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NEUzQVx1NjU4N1x1Njg2M1x1NjU4N1x1NEVGNlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEb2N1bWVudEZpbGUoZmlsZW5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRjb25zdCBleHQgPSBnZXRGaWxlRXh0ZW5zaW9uKGZpbGVuYW1lKTtcblx0cmV0dXJuIERPQ1VNRU5UX0VYVEVOU0lPTlNfU1RSLmluY2x1ZGVzKGV4dCk7XG59XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU2NTg3XHU2ODYzXHU1NkRFXHU5MDAwXHU1QzU1XHU3OTNBXHU2ODA3XHU3QjdFXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREb2N1bWVudERpc3BsYXlMYWJlbChmaWxlbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcblx0Y29uc3QgZXh0ID0gZ2V0RmlsZUV4dGVuc2lvbihmaWxlbmFtZSk7XG5cdGlmICghZXh0KSB7XG5cdFx0cmV0dXJuICdET0MnO1xuXHR9XG5cdHJldHVybiBleHQuc2xpY2UoMSkudG9VcHBlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTRFM0FcdTY1MkZcdTYzMDFcdTc2ODRcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTWVkaWFGaWxlKGZpbGVuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcblx0Y29uc3QgZXh0ID0gZ2V0RmlsZUV4dGVuc2lvbihmaWxlbmFtZSk7XG5cdHJldHVybiBBTExfTUVESUFfRVhURU5TSU9OUy5pbmNsdWRlcyhleHQpO1xufVxuXG4vKipcbiAqIFx1NjgzOVx1NjM2RVx1OEJCRVx1N0Y2RVx1ODNCN1x1NTNENlx1NTQyRlx1NzUyOFx1NzY4NFx1NUE5Mlx1NEY1M1x1NjI2OVx1NUM1NVx1NTQwRFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5hYmxlZEV4dGVuc2lvbnMoc2V0dGluZ3M6IHtcblx0ZW5hYmxlSW1hZ2VzPzogYm9vbGVhbjtcblx0ZW5hYmxlVmlkZW9zPzogYm9vbGVhbjtcblx0ZW5hYmxlQXVkaW8/OiBib29sZWFuO1xuXHRlbmFibGVQREY/OiBib29sZWFuO1xufSk6IHN0cmluZ1tdIHtcblx0Y29uc3QgZXh0ZW5zaW9uczogc3RyaW5nW10gPSBbXTtcblxuXHRpZiAoc2V0dGluZ3MuZW5hYmxlSW1hZ2VzICE9PSBmYWxzZSkge1xuXHRcdGV4dGVuc2lvbnMucHVzaCguLi5JTUFHRV9FWFRFTlNJT05TX1NUUik7XG5cdH1cblx0aWYgKHNldHRpbmdzLmVuYWJsZVZpZGVvcyAhPT0gZmFsc2UpIHtcblx0XHRleHRlbnNpb25zLnB1c2goLi4uVklERU9fRVhURU5TSU9OU19TVFIpO1xuXHR9XG5cdGlmIChzZXR0aW5ncy5lbmFibGVBdWRpbyAhPT0gZmFsc2UpIHtcblx0XHRleHRlbnNpb25zLnB1c2goLi4uQVVESU9fRVhURU5TSU9OU19TVFIpO1xuXHR9XG5cdGlmIChzZXR0aW5ncy5lbmFibGVQREYgIT09IGZhbHNlKSB7XG5cdFx0ZXh0ZW5zaW9ucy5wdXNoKC4uLkRPQ1VNRU5UX0VYVEVOU0lPTlNfU1RSKTtcblx0fVxuXG5cdHJldHVybiBleHRlbnNpb25zO1xufVxuIiwgIi8qKlxuICogSW5kZXhlZERCIFx1N0YyOVx1NzU2NVx1NTZGRVx1NjMwMVx1NEU0NVx1N0YxM1x1NUI1OFxuICogXHU3RjEzXHU1QjU4XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHU3Njg0XHU3RjI5XHU3NTY1XHU1NkZFIEJsb2JcdUZGMENcdTkwN0ZcdTUxNERcdTZCQ0ZcdTZCMjFcdTYyNTNcdTVGMDBcdTg5QzZcdTU2RkVcdTkxQ0RcdTY1QjBcdTc1MUZcdTYyMTBcbiAqL1xuXG5jb25zdCBEQl9OQU1FID0gJ29ic2lkaWFuLW1lZGlhLXRvb2xraXQtdGh1bWJzJztcbmNvbnN0IERCX1ZFUlNJT04gPSAxO1xuY29uc3QgU1RPUkVfTkFNRSA9ICd0aHVtYm5haWxzJztcblxuaW50ZXJmYWNlIFRodW1ibmFpbEVudHJ5IHtcblx0cGF0aDogc3RyaW5nO1xuXHRtdGltZTogbnVtYmVyO1xuXHRibG9iOiBCbG9iO1xuXHR3aWR0aDogbnVtYmVyO1xuXHRoZWlnaHQ6IG51bWJlcjtcblx0Y3JlYXRlZEF0OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBUaHVtYm5haWxDYWNoZSB7XG5cdHByaXZhdGUgZGI6IElEQkRhdGFiYXNlIHwgbnVsbCA9IG51bGw7XG5cdHByaXZhdGUgbWF4RW50cmllczogbnVtYmVyO1xuXHRwcml2YXRlIG1lbW9yeUNhY2hlOiBNYXA8c3RyaW5nLCB7IG10aW1lOiBudW1iZXI7IHVybDogc3RyaW5nIH0+ID0gbmV3IE1hcCgpO1xuXG5cdGNvbnN0cnVjdG9yKG1heEVudHJpZXM6IG51bWJlciA9IDUwMDApIHtcblx0XHR0aGlzLm1heEVudHJpZXMgPSBtYXhFbnRyaWVzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjI1M1x1NUYwMCBJbmRleGVkREIgXHU4RkRFXHU2M0E1XG5cdCAqL1xuXHRhc3luYyBvcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLmRiKSByZXR1cm47XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0Y29uc3QgcmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKERCX05BTUUsIERCX1ZFUlNJT04pO1xuXG5cdFx0XHRyZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IChldmVudCkgPT4ge1xuXHRcdFx0XHRjb25zdCBkYiA9IChldmVudC50YXJnZXQgYXMgSURCT3BlbkRCUmVxdWVzdCkucmVzdWx0O1xuXHRcdFx0XHRpZiAoIWRiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoU1RPUkVfTkFNRSkpIHtcblx0XHRcdFx0XHRjb25zdCBzdG9yZSA9IGRiLmNyZWF0ZU9iamVjdFN0b3JlKFNUT1JFX05BTUUsIHsga2V5UGF0aDogJ3BhdGgnIH0pO1xuXHRcdFx0XHRcdHN0b3JlLmNyZWF0ZUluZGV4KCdjcmVhdGVkQXQnLCAnY3JlYXRlZEF0JywgeyB1bmlxdWU6IGZhbHNlIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRyZXF1ZXN0Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuXHRcdFx0XHR0aGlzLmRiID0gKGV2ZW50LnRhcmdldCBhcyBJREJPcGVuREJSZXF1ZXN0KS5yZXN1bHQ7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH07XG5cblx0XHRcdHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdUaHVtYm5haWxDYWNoZTogRmFpbGVkIHRvIG9wZW4gSW5kZXhlZERCLCBydW5uaW5nIHdpdGhvdXQgY2FjaGUnKTtcblx0XHRcdFx0cmVzb2x2ZSgpOyAvLyBcdTRFMERcdTk2M0JcdTU4NUVcdUZGMENcdTY1RTBcdTdGMTNcdTVCNThcdTZBMjFcdTVGMEZcdTdFRTdcdTdFRURcdThGRDBcdTg4NENcblx0XHRcdH07XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1MTczXHU5NUVEIEluZGV4ZWREQiBcdThGREVcdTYzQTVcdUZGMENcdTkxQ0FcdTY1M0VcdTUxODVcdTVCNThcdTRFMkRcdTc2ODQgT2JqZWN0IFVSTFxuXHQgKi9cblx0Y2xvc2UoKTogdm9pZCB7XG5cdFx0Ly8gXHU5MUNBXHU2NTNFXHU2MjQwXHU2NzA5XHU1MTg1XHU1QjU4XHU0RTJEXHU3Njg0IE9iamVjdCBVUkxcblx0XHRmb3IgKGNvbnN0IGVudHJ5IG9mIHRoaXMubWVtb3J5Q2FjaGUudmFsdWVzKCkpIHtcblx0XHRcdFVSTC5yZXZva2VPYmplY3RVUkwoZW50cnkudXJsKTtcblx0XHR9XG5cdFx0dGhpcy5tZW1vcnlDYWNoZS5jbGVhcigpO1xuXG5cdFx0aWYgKHRoaXMuZGIpIHtcblx0XHRcdHRoaXMuZGIuY2xvc2UoKTtcblx0XHRcdHRoaXMuZGIgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTgzQjdcdTUzRDZcdTdGMTNcdTVCNThcdTc2ODRcdTdGMjlcdTc1NjVcdTU2RkUgT2JqZWN0IFVSTFxuXHQgKiBcdTRFQzVcdTVGNTNcdThERUZcdTVGODRcdTUzMzlcdTkxNERcdTRFMTQgbXRpbWUgXHU2NzJBXHU1M0Q4XHU2NUY2XHU4RkQ0XHU1NkRFXHU3RjEzXHU1QjU4XG5cdCAqL1xuXHRhc3luYyBnZXQocGF0aDogc3RyaW5nLCBtdGltZTogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG5cdFx0Ly8gXHU1MTQ4XHU2N0U1XHU1MTg1XHU1QjU4XHU3RjEzXHU1QjU4XG5cdFx0Y29uc3QgbWVtRW50cnkgPSB0aGlzLm1lbW9yeUNhY2hlLmdldChwYXRoKTtcblx0XHRpZiAobWVtRW50cnkgJiYgbWVtRW50cnkubXRpbWUgPT09IG10aW1lKSB7XG5cdFx0XHRyZXR1cm4gbWVtRW50cnkudXJsO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5kYikgcmV0dXJuIG51bGw7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGNvbnN0IHR4ID0gdGhpcy5kYiEudHJhbnNhY3Rpb24oU1RPUkVfTkFNRSwgJ3JlYWRvbmx5Jyk7XG5cdFx0XHRjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpO1xuXHRcdFx0Y29uc3QgcmVxdWVzdCA9IHN0b3JlLmdldChwYXRoKTtcblxuXHRcdFx0cmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGVudHJ5ID0gcmVxdWVzdC5yZXN1bHQgYXMgVGh1bWJuYWlsRW50cnkgfCB1bmRlZmluZWQ7XG5cdFx0XHRcdGlmIChlbnRyeSAmJiBlbnRyeS5tdGltZSA9PT0gbXRpbWUpIHtcblx0XHRcdFx0XHRjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGVudHJ5LmJsb2IpO1xuXHRcdFx0XHRcdHRoaXMubWVtb3J5Q2FjaGUuc2V0KHBhdGgsIHsgbXRpbWUsIHVybCB9KTtcblx0XHRcdFx0XHRyZXNvbHZlKHVybCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzb2x2ZShudWxsKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0cmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVzb2x2ZShudWxsKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTVCNThcdTUxNjVcdTdGMjlcdTc1NjVcdTU2RkVcdTdGMTNcdTVCNThcblx0ICovXG5cdGFzeW5jIHB1dChwYXRoOiBzdHJpbmcsIG10aW1lOiBudW1iZXIsIGJsb2I6IEJsb2IsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gXHU2NkY0XHU2NUIwXHU1MTg1XHU1QjU4XHU3RjEzXHU1QjU4XG5cdFx0Y29uc3Qgb2xkRW50cnkgPSB0aGlzLm1lbW9yeUNhY2hlLmdldChwYXRoKTtcblx0XHRpZiAob2xkRW50cnkpIHtcblx0XHRcdFVSTC5yZXZva2VPYmplY3RVUkwob2xkRW50cnkudXJsKTtcblx0XHR9XG5cdFx0Y29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcblx0XHR0aGlzLm1lbW9yeUNhY2hlLnNldChwYXRoLCB7IG10aW1lLCB1cmwgfSk7XG5cblx0XHRpZiAoIXRoaXMuZGIpIHJldHVybjtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Y29uc3QgdHggPSB0aGlzLmRiIS50cmFuc2FjdGlvbihTVE9SRV9OQU1FLCAncmVhZHdyaXRlJyk7XG5cdFx0XHRjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpO1xuXG5cdFx0XHRjb25zdCBlbnRyeTogVGh1bWJuYWlsRW50cnkgPSB7XG5cdFx0XHRcdHBhdGgsXG5cdFx0XHRcdG10aW1lLFxuXHRcdFx0XHRibG9iLFxuXHRcdFx0XHR3aWR0aCxcblx0XHRcdFx0aGVpZ2h0LFxuXHRcdFx0XHRjcmVhdGVkQXQ6IERhdGUubm93KClcblx0XHRcdH07XG5cblx0XHRcdHN0b3JlLnB1dChlbnRyeSk7XG5cdFx0XHR0eC5vbmNvbXBsZXRlID0gKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmV2aWN0SWZOZWVkZWQoKTtcblx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0fTtcblx0XHRcdHR4Lm9uZXJyb3IgPSAoKSA9PiByZXNvbHZlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1MjIwXHU5NjY0XHU2MzA3XHU1QjlBXHU4REVGXHU1Rjg0XHU3Njg0XHU3RjEzXHU1QjU4XG5cdCAqL1xuXHRhc3luYyBkZWxldGUocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgbWVtRW50cnkgPSB0aGlzLm1lbW9yeUNhY2hlLmdldChwYXRoKTtcblx0XHRpZiAobWVtRW50cnkpIHtcblx0XHRcdFVSTC5yZXZva2VPYmplY3RVUkwobWVtRW50cnkudXJsKTtcblx0XHRcdHRoaXMubWVtb3J5Q2FjaGUuZGVsZXRlKHBhdGgpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5kYikgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRjb25zdCB0eCA9IHRoaXMuZGIhLnRyYW5zYWN0aW9uKFNUT1JFX05BTUUsICdyZWFkd3JpdGUnKTtcblx0XHRcdHR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpLmRlbGV0ZShwYXRoKTtcblx0XHRcdHR4Lm9uY29tcGxldGUgPSAoKSA9PiByZXNvbHZlKCk7XG5cdFx0XHR0eC5vbmVycm9yID0gKCkgPT4gcmVzb2x2ZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUwNVx1N0E3QVx1NjI0MFx1NjcwOVx1N0YxM1x1NUI1OFxuXHQgKi9cblx0YXN5bmMgY2xlYXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Zm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLm1lbW9yeUNhY2hlLnZhbHVlcygpKSB7XG5cdFx0XHRVUkwucmV2b2tlT2JqZWN0VVJMKGVudHJ5LnVybCk7XG5cdFx0fVxuXHRcdHRoaXMubWVtb3J5Q2FjaGUuY2xlYXIoKTtcblxuXHRcdGlmICghdGhpcy5kYikgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRjb25zdCB0eCA9IHRoaXMuZGIhLnRyYW5zYWN0aW9uKFNUT1JFX05BTUUsICdyZWFkd3JpdGUnKTtcblx0XHRcdHR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpLmNsZWFyKCk7XG5cdFx0XHR0eC5vbmNvbXBsZXRlID0gKCkgPT4gcmVzb2x2ZSgpO1xuXHRcdFx0dHgub25lcnJvciA9ICgpID0+IHJlc29sdmUoKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTkxQ0RcdTU0N0RcdTU0MERcdThERUZcdTVGODRcdTc2ODRcdTdGMTNcdTVCNThcdTY3NjFcdTc2RUVcdUZGMDhcdTY1ODdcdTRFRjZcdTkxQ0RcdTU0N0RcdTU0MERcdTY1RjZcdThDMDNcdTc1MjhcdUZGMDlcblx0ICovXG5cdGFzeW5jIHJlbmFtZShvbGRQYXRoOiBzdHJpbmcsIG5ld1BhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG1lbUVudHJ5ID0gdGhpcy5tZW1vcnlDYWNoZS5nZXQob2xkUGF0aCk7XG5cdFx0aWYgKG1lbUVudHJ5KSB7XG5cdFx0XHR0aGlzLm1lbW9yeUNhY2hlLmRlbGV0ZShvbGRQYXRoKTtcblx0XHRcdHRoaXMubWVtb3J5Q2FjaGUuc2V0KG5ld1BhdGgsIG1lbUVudHJ5KTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuZGIpIHJldHVybjtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Y29uc3QgdHggPSB0aGlzLmRiIS50cmFuc2FjdGlvbihTVE9SRV9OQU1FLCAncmVhZHdyaXRlJyk7XG5cdFx0XHRjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpO1xuXHRcdFx0Y29uc3QgZ2V0UmVxID0gc3RvcmUuZ2V0KG9sZFBhdGgpO1xuXG5cdFx0XHRnZXRSZXEub25zdWNjZXNzID0gKCkgPT4ge1xuXHRcdFx0XHRjb25zdCBlbnRyeSA9IGdldFJlcS5yZXN1bHQgYXMgVGh1bWJuYWlsRW50cnkgfCB1bmRlZmluZWQ7XG5cdFx0XHRcdGlmIChlbnRyeSkge1xuXHRcdFx0XHRcdHN0b3JlLmRlbGV0ZShvbGRQYXRoKTtcblx0XHRcdFx0XHRlbnRyeS5wYXRoID0gbmV3UGF0aDtcblx0XHRcdFx0XHRzdG9yZS5wdXQoZW50cnkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR0eC5vbmNvbXBsZXRlID0gKCkgPT4gcmVzb2x2ZSgpO1xuXHRcdFx0dHgub25lcnJvciA9ICgpID0+IHJlc29sdmUoKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBMUlUgXHU2REQ4XHU2QzcwXHVGRjFBXHU4RDg1XHU4RkM3XHU2NzAwXHU1OTI3XHU2NzYxXHU3NkVFXHU2NTcwXHU2NUY2XHU1MjIwXHU5NjY0XHU2NzAwXHU2NUU3XHU3Njg0XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGV2aWN0SWZOZWVkZWQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCF0aGlzLmRiKSByZXR1cm47XG5cblx0XHRjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oU1RPUkVfTkFNRSwgJ3JlYWRvbmx5Jyk7XG5cdFx0Y29uc3Qgc3RvcmUgPSB0eC5vYmplY3RTdG9yZShTVE9SRV9OQU1FKTtcblx0XHRjb25zdCBjb3VudFJlcSA9IHN0b3JlLmNvdW50KCk7XG5cblx0XHRjb3VudFJlcS5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG5cdFx0XHRjb25zdCBjb3VudCA9IGNvdW50UmVxLnJlc3VsdDtcblx0XHRcdGlmIChjb3VudCA8PSB0aGlzLm1heEVudHJpZXMpIHJldHVybjtcblxuXHRcdFx0Y29uc3QgZXZpY3RDb3VudCA9IGNvdW50IC0gdGhpcy5tYXhFbnRyaWVzO1xuXHRcdFx0Y29uc3QgZXZpY3RUeCA9IHRoaXMuZGIhLnRyYW5zYWN0aW9uKFNUT1JFX05BTUUsICdyZWFkd3JpdGUnKTtcblx0XHRcdGNvbnN0IGV2aWN0U3RvcmUgPSBldmljdFR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpO1xuXHRcdFx0Y29uc3QgaW5kZXggPSBldmljdFN0b3JlLmluZGV4KCdjcmVhdGVkQXQnKTtcblx0XHRcdGNvbnN0IGN1cnNvciA9IGluZGV4Lm9wZW5DdXJzb3IoKTtcblx0XHRcdGxldCBkZWxldGVkID0gMDtcblxuXHRcdFx0Y3Vyc29yLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuXHRcdFx0XHRjb25zdCBjID0gKGV2ZW50LnRhcmdldCBhcyBJREJSZXF1ZXN0PElEQkN1cnNvcldpdGhWYWx1ZSB8IG51bGw+KS5yZXN1bHQ7XG5cdFx0XHRcdGlmIChjICYmIGRlbGV0ZWQgPCBldmljdENvdW50KSB7XG5cdFx0XHRcdFx0Y29uc3QgcGF0aCA9IChjLnZhbHVlIGFzIFRodW1ibmFpbEVudHJ5KS5wYXRoO1xuXHRcdFx0XHRcdGNvbnN0IG1lbUVudHJ5ID0gdGhpcy5tZW1vcnlDYWNoZS5nZXQocGF0aCk7XG5cdFx0XHRcdFx0aWYgKG1lbUVudHJ5KSB7XG5cdFx0XHRcdFx0XHRVUkwucmV2b2tlT2JqZWN0VVJMKG1lbUVudHJ5LnVybCk7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbW9yeUNhY2hlLmRlbGV0ZShwYXRoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Yy5kZWxldGUoKTtcblx0XHRcdFx0XHRkZWxldGVkKys7XG5cdFx0XHRcdFx0Yy5jb250aW51ZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH07XG5cdH1cbn1cblxuLyoqXG4gKiBcdTc1MjggQ2FudmFzIFx1NzUxRlx1NjIxMFx1N0YyOVx1NzU2NVx1NTZGRSBCbG9iXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVRodW1ibmFpbChcblx0aW1hZ2VTcmM6IHN0cmluZyxcblx0bWF4U2l6ZTogbnVtYmVyID0gMjAwXG4pOiBQcm9taXNlPHsgYmxvYjogQmxvYjsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfT4ge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdGltZy5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xuXG5cdFx0aW1nLm9ubG9hZCA9ICgpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IHsgd2lkdGg6IG9yaWdXLCBoZWlnaHQ6IG9yaWdIIH0gPSBpbWc7XG5cdFx0XHRcdGxldCB0YXJnZXRXID0gb3JpZ1c7XG5cdFx0XHRcdGxldCB0YXJnZXRIID0gb3JpZ0g7XG5cblx0XHRcdFx0aWYgKG9yaWdXID4gbWF4U2l6ZSB8fCBvcmlnSCA+IG1heFNpemUpIHtcblx0XHRcdFx0XHRjb25zdCByYXRpbyA9IE1hdGgubWluKG1heFNpemUgLyBvcmlnVywgbWF4U2l6ZSAvIG9yaWdIKTtcblx0XHRcdFx0XHR0YXJnZXRXID0gTWF0aC5yb3VuZChvcmlnVyAqIHJhdGlvKTtcblx0XHRcdFx0XHR0YXJnZXRIID0gTWF0aC5yb3VuZChvcmlnSCAqIHJhdGlvKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0XHRjYW52YXMud2lkdGggPSB0YXJnZXRXO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gdGFyZ2V0SDtcblxuXHRcdFx0XHRjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0XHRcdFx0aWYgKCFjdHgpIHtcblx0XHRcdFx0XHRyZWplY3QobmV3IEVycm9yKCdDYW5ub3QgZ2V0IGNhbnZhcyBjb250ZXh0JykpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCB0YXJnZXRXLCB0YXJnZXRIKTtcblxuXHRcdFx0XHRjYW52YXMudG9CbG9iKFxuXHRcdFx0XHRcdChibG9iKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoYmxvYikge1xuXHRcdFx0XHRcdFx0XHRyZXNvbHZlKHsgYmxvYiwgd2lkdGg6IHRhcmdldFcsIGhlaWdodDogdGFyZ2V0SCB9KTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHJlamVjdChuZXcgRXJyb3IoJ0NhbnZhcyB0b0Jsb2IgcmV0dXJuZWQgbnVsbCcpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCdpbWFnZS93ZWJwJyxcblx0XHRcdFx0XHQwLjdcblx0XHRcdFx0KTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGltZy5vbmVycm9yID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgaW1hZ2U6ICR7aW1hZ2VTcmN9YCkpO1xuXHRcdGltZy5zcmMgPSBpbWFnZVNyYztcblx0fSk7XG59XG4iLCAiLyoqXG4gKiBcdTdFQUYgSlMgRVhJRiBcdTg5RTNcdTY3OTBcdTU2NjhcbiAqIFx1NEVDRSBKUEVHIFx1NjU4N1x1NEVGNlx1NzY4NCBBUFAxIFx1NkJCNVx1NEUyRFx1ODlFM1x1Njc5MCBUSUZGIElGRFx1RkYwQ1x1NjNEMFx1NTNENlx1NTE3M1x1OTUyRSBFWElGIFx1NEZFMVx1NjA2RlxuICogXHU2NUUwXHU1OTE2XHU5MEU4XHU0RjlEXHU4RDU2XG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBFeGlmRGF0YSB7XG5cdGRhdGVUaW1lT3JpZ2luYWw/OiBzdHJpbmc7ICAvLyBZWVlZOk1NOkREIEhIOm1tOnNzXG5cdG1ha2U/OiBzdHJpbmc7ICAgICAgICAgICAgIC8vIFx1NzZGOFx1NjczQVx1NTRDMVx1NzI0Q1xuXHRtb2RlbD86IHN0cmluZzsgICAgICAgICAgICAvLyBcdTc2RjhcdTY3M0FcdTU3OEJcdTUzRjdcblx0aW1hZ2VXaWR0aD86IG51bWJlcjtcblx0aW1hZ2VIZWlnaHQ/OiBudW1iZXI7XG5cdG9yaWVudGF0aW9uPzogbnVtYmVyO1xufVxuXG4vLyBFWElGIHRhZyBJRHNcbmNvbnN0IFRBR19EQVRFX1RJTUVfT1JJR0lOQUwgPSAweDkwMDM7XG5jb25zdCBUQUdfTUFLRSA9IDB4MDEwRjtcbmNvbnN0IFRBR19NT0RFTCA9IDB4MDExMDtcbmNvbnN0IFRBR19JTUFHRV9XSURUSCA9IDB4QTAwMjtcbmNvbnN0IFRBR19JTUFHRV9IRUlHSFQgPSAweEEwMDM7XG5jb25zdCBUQUdfT1JJRU5UQVRJT04gPSAweDAxMTI7XG5jb25zdCBUQUdfRVhJRl9JRkQgPSAweDg3Njk7XG5cbi8qKlxuICogXHU0RUNFIEFycmF5QnVmZmVyIFx1ODlFM1x1Njc5MCBFWElGIFx1NjU3MFx1NjM2RVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VFeGlmKGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBFeGlmRGF0YSB7XG5cdGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcblx0Y29uc3QgcmVzdWx0OiBFeGlmRGF0YSA9IHt9O1xuXG5cdC8vIFx1NjhDMFx1NjdFNSBKUEVHIFNPSSBcdTY4MDdcdThCQjBcblx0aWYgKHZpZXcuZ2V0VWludDE2KDApICE9PSAweEZGRDgpIHtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0bGV0IG9mZnNldCA9IDI7XG5cdGNvbnN0IGxlbmd0aCA9IE1hdGgubWluKGJ1ZmZlci5ieXRlTGVuZ3RoLCA2NTUzNik7IC8vIFx1NTNFQVx1NjI2Qlx1NjNDRlx1NTI0RCA2NEtCXG5cblx0d2hpbGUgKG9mZnNldCA8IGxlbmd0aCkge1xuXHRcdGlmICh2aWV3LmdldFVpbnQ4KG9mZnNldCkgIT09IDB4RkYpIGJyZWFrO1xuXG5cdFx0Y29uc3QgbWFya2VyID0gdmlldy5nZXRVaW50OChvZmZzZXQgKyAxKTtcblx0XHRvZmZzZXQgKz0gMjtcblxuXHRcdC8vIEFQUDEgXHU2QkI1XHVGRjA4RVhJRiBcdTY1NzBcdTYzNkVcdUZGMDlcblx0XHRpZiAobWFya2VyID09PSAweEUxKSB7XG5cdFx0XHRjb25zdCBzZWdtZW50TGVuZ3RoID0gdmlldy5nZXRVaW50MTYob2Zmc2V0KTtcblxuXHRcdFx0Ly8gXHU2OEMwXHU2N0U1IFwiRXhpZlxcMFxcMFwiIFx1NjgwN1x1OEJDNlxuXHRcdFx0aWYgKHNlZ21lbnRMZW5ndGggPiA4ICYmXG5cdFx0XHRcdHZpZXcuZ2V0VWludDMyKG9mZnNldCArIDIpID09PSAweDQ1Nzg2OTY2ICYmIC8vIFwiRXhpZlwiXG5cdFx0XHRcdHZpZXcuZ2V0VWludDE2KG9mZnNldCArIDYpID09PSAweDAwMDApIHtcblxuXHRcdFx0XHRjb25zdCB0aWZmT2Zmc2V0ID0gb2Zmc2V0ICsgODtcblx0XHRcdFx0cGFyc2VUaWZmKHZpZXcsIHRpZmZPZmZzZXQsIHJlc3VsdCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MTc2XHU0RUQ2XHU2QkI1XHVGRjFBXHU4REYzXHU4RkM3XG5cdFx0aWYgKG1hcmtlciA+PSAweEUwICYmIG1hcmtlciA8PSAweEVGIHx8IG1hcmtlciA9PT0gMHhGRSkge1xuXHRcdFx0Y29uc3Qgc2VnbWVudExlbmd0aCA9IHZpZXcuZ2V0VWludDE2KG9mZnNldCk7XG5cdFx0XHRvZmZzZXQgKz0gc2VnbWVudExlbmd0aDtcblx0XHR9IGVsc2UgaWYgKG1hcmtlciA9PT0gMHhEQSkge1xuXHRcdFx0Ly8gU09TIFx1NjgwN1x1OEJCMFx1RkYwQ1x1NEUwRFx1NTE4RFx1NjcwOSBFWElGXG5cdFx0XHRicmVhaztcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gXHU1QzFEXHU4QkQ1XHU4REYzXHU4RkM3XG5cdFx0XHRpZiAob2Zmc2V0ICsgMiA8PSBsZW5ndGgpIHtcblx0XHRcdFx0Y29uc3Qgc2VnbWVudExlbmd0aCA9IHZpZXcuZ2V0VWludDE2KG9mZnNldCk7XG5cdFx0XHRcdG9mZnNldCArPSBzZWdtZW50TGVuZ3RoO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBcdTg5RTNcdTY3OTAgVElGRiBcdTU5MzRcdTU0OEMgSUZEXG4gKi9cbmZ1bmN0aW9uIHBhcnNlVGlmZih2aWV3OiBEYXRhVmlldywgdGlmZlN0YXJ0OiBudW1iZXIsIHJlc3VsdDogRXhpZkRhdGEpOiB2b2lkIHtcblx0aWYgKHRpZmZTdGFydCArIDggPiB2aWV3LmJ5dGVMZW5ndGgpIHJldHVybjtcblxuXHQvLyBcdTVCNTdcdTgyODJcdTVFOEZcdTY4MDdcdThCQjBcblx0Y29uc3QgYnl0ZU9yZGVyID0gdmlldy5nZXRVaW50MTYodGlmZlN0YXJ0KTtcblx0Y29uc3QgbGl0dGxlRW5kaWFuID0gYnl0ZU9yZGVyID09PSAweDQ5NDk7IC8vIFwiSUlcIlxuXHRpZiAoYnl0ZU9yZGVyICE9PSAweDQ5NDkgJiYgYnl0ZU9yZGVyICE9PSAweDRENEQpIHJldHVybjsgLy8gXHU5NzVFIFwiSUlcIiBcdTRFNUZcdTk3NUUgXCJNTVwiXG5cblx0Ly8gVElGRiBcdTcyNDhcdTY3MkNcdTUzRjdcdUZGMDhcdTVFOTRcdTRFM0EgNDJcdUZGMDlcblx0aWYgKHZpZXcuZ2V0VWludDE2KHRpZmZTdGFydCArIDIsIGxpdHRsZUVuZGlhbikgIT09IDQyKSByZXR1cm47XG5cblx0Ly8gSUZEMCBcdTUwNEZcdTc5RkJcblx0Y29uc3QgaWZkME9mZnNldCA9IHZpZXcuZ2V0VWludDMyKHRpZmZTdGFydCArIDQsIGxpdHRsZUVuZGlhbik7XG5cdHBhcnNlSUZEKHZpZXcsIHRpZmZTdGFydCwgdGlmZlN0YXJ0ICsgaWZkME9mZnNldCwgbGl0dGxlRW5kaWFuLCByZXN1bHQsIHRydWUpO1xufVxuXG4vKipcbiAqIFx1ODlFM1x1Njc5MCBJRkRcdUZGMDhJbWFnZSBGaWxlIERpcmVjdG9yeVx1RkYwOVxuICovXG5mdW5jdGlvbiBwYXJzZUlGRChcblx0dmlldzogRGF0YVZpZXcsXG5cdHRpZmZTdGFydDogbnVtYmVyLFxuXHRpZmRPZmZzZXQ6IG51bWJlcixcblx0bGl0dGxlRW5kaWFuOiBib29sZWFuLFxuXHRyZXN1bHQ6IEV4aWZEYXRhLFxuXHRmb2xsb3dFeGlmSUZEOiBib29sZWFuXG4pOiB2b2lkIHtcblx0aWYgKGlmZE9mZnNldCArIDIgPiB2aWV3LmJ5dGVMZW5ndGgpIHJldHVybjtcblxuXHRjb25zdCBlbnRyeUNvdW50ID0gdmlldy5nZXRVaW50MTYoaWZkT2Zmc2V0LCBsaXR0bGVFbmRpYW4pO1xuXHRsZXQgb2Zmc2V0ID0gaWZkT2Zmc2V0ICsgMjtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGVudHJ5Q291bnQ7IGkrKykge1xuXHRcdGlmIChvZmZzZXQgKyAxMiA+IHZpZXcuYnl0ZUxlbmd0aCkgYnJlYWs7XG5cblx0XHRjb25zdCB0YWcgPSB2aWV3LmdldFVpbnQxNihvZmZzZXQsIGxpdHRsZUVuZGlhbik7XG5cdFx0Y29uc3QgdHlwZSA9IHZpZXcuZ2V0VWludDE2KG9mZnNldCArIDIsIGxpdHRsZUVuZGlhbik7XG5cdFx0Y29uc3QgY291bnQgPSB2aWV3LmdldFVpbnQzMihvZmZzZXQgKyA0LCBsaXR0bGVFbmRpYW4pO1xuXHRcdGNvbnN0IHZhbHVlT2Zmc2V0ID0gb2Zmc2V0ICsgODtcblxuXHRcdHN3aXRjaCAodGFnKSB7XG5cdFx0XHRjYXNlIFRBR19NQUtFOlxuXHRcdFx0XHRyZXN1bHQubWFrZSA9IHJlYWRTdHJpbmdWYWx1ZSh2aWV3LCB0aWZmU3RhcnQsIHZhbHVlT2Zmc2V0LCB0eXBlLCBjb3VudCwgbGl0dGxlRW5kaWFuKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFRBR19NT0RFTDpcblx0XHRcdFx0cmVzdWx0Lm1vZGVsID0gcmVhZFN0cmluZ1ZhbHVlKHZpZXcsIHRpZmZTdGFydCwgdmFsdWVPZmZzZXQsIHR5cGUsIGNvdW50LCBsaXR0bGVFbmRpYW4pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgVEFHX09SSUVOVEFUSU9OOlxuXHRcdFx0XHRyZXN1bHQub3JpZW50YXRpb24gPSByZWFkU2hvcnRWYWx1ZSh2aWV3LCB2YWx1ZU9mZnNldCwgbGl0dGxlRW5kaWFuKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFRBR19EQVRFX1RJTUVfT1JJR0lOQUw6XG5cdFx0XHRcdHJlc3VsdC5kYXRlVGltZU9yaWdpbmFsID0gcmVhZFN0cmluZ1ZhbHVlKHZpZXcsIHRpZmZTdGFydCwgdmFsdWVPZmZzZXQsIHR5cGUsIGNvdW50LCBsaXR0bGVFbmRpYW4pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgVEFHX0lNQUdFX1dJRFRIOlxuXHRcdFx0XHRyZXN1bHQuaW1hZ2VXaWR0aCA9IHJlYWRMb25nT3JTaG9ydCh2aWV3LCB2YWx1ZU9mZnNldCwgdHlwZSwgbGl0dGxlRW5kaWFuKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFRBR19JTUFHRV9IRUlHSFQ6XG5cdFx0XHRcdHJlc3VsdC5pbWFnZUhlaWdodCA9IHJlYWRMb25nT3JTaG9ydCh2aWV3LCB2YWx1ZU9mZnNldCwgdHlwZSwgbGl0dGxlRW5kaWFuKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFRBR19FWElGX0lGRDpcblx0XHRcdFx0aWYgKGZvbGxvd0V4aWZJRkQpIHtcblx0XHRcdFx0XHRjb25zdCBleGlmT2Zmc2V0ID0gdmlldy5nZXRVaW50MzIodmFsdWVPZmZzZXQsIGxpdHRsZUVuZGlhbik7XG5cdFx0XHRcdFx0cGFyc2VJRkQodmlldywgdGlmZlN0YXJ0LCB0aWZmU3RhcnQgKyBleGlmT2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHJlc3VsdCwgZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHRcdG9mZnNldCArPSAxMjtcblx0fVxufVxuXG5mdW5jdGlvbiByZWFkU2hvcnRWYWx1ZSh2aWV3OiBEYXRhVmlldywgb2Zmc2V0OiBudW1iZXIsIGxpdHRsZUVuZGlhbjogYm9vbGVhbik6IG51bWJlciB7XG5cdGlmIChvZmZzZXQgKyAyID4gdmlldy5ieXRlTGVuZ3RoKSByZXR1cm4gMDtcblx0cmV0dXJuIHZpZXcuZ2V0VWludDE2KG9mZnNldCwgbGl0dGxlRW5kaWFuKTtcbn1cblxuZnVuY3Rpb24gcmVhZExvbmdPclNob3J0KHZpZXc6IERhdGFWaWV3LCBvZmZzZXQ6IG51bWJlciwgdHlwZTogbnVtYmVyLCBsaXR0bGVFbmRpYW46IGJvb2xlYW4pOiBudW1iZXIge1xuXHRpZiAodHlwZSA9PT0gMykgeyAvLyBTSE9SVFxuXHRcdHJldHVybiByZWFkU2hvcnRWYWx1ZSh2aWV3LCBvZmZzZXQsIGxpdHRsZUVuZGlhbik7XG5cdH1cblx0aWYgKG9mZnNldCArIDQgPiB2aWV3LmJ5dGVMZW5ndGgpIHJldHVybiAwO1xuXHRyZXR1cm4gdmlldy5nZXRVaW50MzIob2Zmc2V0LCBsaXR0bGVFbmRpYW4pO1xufVxuXG5mdW5jdGlvbiByZWFkU3RyaW5nVmFsdWUoXG5cdHZpZXc6IERhdGFWaWV3LFxuXHR0aWZmU3RhcnQ6IG51bWJlcixcblx0dmFsdWVPZmZzZXQ6IG51bWJlcixcblx0dHlwZTogbnVtYmVyLFxuXHRjb3VudDogbnVtYmVyLFxuXHRsaXR0bGVFbmRpYW46IGJvb2xlYW5cbik6IHN0cmluZyB7XG5cdGlmICh0eXBlICE9PSAyKSByZXR1cm4gJyc7IC8vIEFTQ0lJIHR5cGVcblxuXHRsZXQgZGF0YU9mZnNldDogbnVtYmVyO1xuXHRpZiAoY291bnQgPD0gNCkge1xuXHRcdGRhdGFPZmZzZXQgPSB2YWx1ZU9mZnNldDtcblx0fSBlbHNlIHtcblx0XHRpZiAodmFsdWVPZmZzZXQgKyA0ID4gdmlldy5ieXRlTGVuZ3RoKSByZXR1cm4gJyc7XG5cdFx0ZGF0YU9mZnNldCA9IHRpZmZTdGFydCArIHZpZXcuZ2V0VWludDMyKHZhbHVlT2Zmc2V0LCBsaXR0bGVFbmRpYW4pO1xuXHR9XG5cblx0aWYgKGRhdGFPZmZzZXQgKyBjb3VudCA+IHZpZXcuYnl0ZUxlbmd0aCkgcmV0dXJuICcnO1xuXG5cdGxldCBzdHIgPSAnJztcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudCAtIDE7IGkrKykgeyAvLyAtMSB0byBleGNsdWRlIG51bGwgdGVybWluYXRvclxuXHRcdGNvbnN0IGNoYXJDb2RlID0gdmlldy5nZXRVaW50OChkYXRhT2Zmc2V0ICsgaSk7XG5cdFx0aWYgKGNoYXJDb2RlID09PSAwKSBicmVhaztcblx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZSk7XG5cdH1cblxuXHRyZXR1cm4gc3RyLnRyaW0oKTtcbn1cblxuLyoqXG4gKiBcdTRFQ0UgRVhJRiBcdTY1RTVcdTY3MUZcdTVCNTdcdTdCMjZcdTRFMzJcdTg5RTNcdTY3OTAgRGF0ZSBcdTVCRjlcdThDNjFcbiAqIFx1NjgzQ1x1NUYwRjogXCJZWVlZOk1NOkREIEhIOm1tOnNzXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRXhpZkRhdGUoZGF0ZVN0cjogc3RyaW5nKTogRGF0ZSB8IG51bGwge1xuXHRjb25zdCBtYXRjaCA9IGRhdGVTdHIubWF0Y2goL14oXFxkezR9KTooXFxkezJ9KTooXFxkezJ9KVxccysoXFxkezJ9KTooXFxkezJ9KTooXFxkezJ9KS8pO1xuXHRpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcblxuXHRjb25zdCBbLCB5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZF0gPSBtYXRjaDtcblx0cmV0dXJuIG5ldyBEYXRlKFxuXHRcdHBhcnNlSW50KHllYXIpLCBwYXJzZUludChtb250aCkgLSAxLCBwYXJzZUludChkYXkpLFxuXHRcdHBhcnNlSW50KGhvdXIpLCBwYXJzZUludChtaW51dGUpLCBwYXJzZUludChzZWNvbmQpXG5cdCk7XG59XG4iLCAiLyoqXG4gKiBcdTg5QzRcdTUyMTlcdTVGMTVcdTY0Q0VcdUZGMUFcdTU3RkFcdTRFOEVcdTY1RTVcdTY3MUYgKyBcdTdDN0JcdTU3OEIgKyBFWElGIFx1NEZFMVx1NjA2Rlx1ODFFQVx1NTJBOFx1NjU3NFx1NzQwNlx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlxuICovXG5cbmltcG9ydCB7IFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgT3JnYW5pemVSdWxlIH0gZnJvbSAnLi4vc2V0dGluZ3MnO1xuaW1wb3J0IHsgZ2V0RmlsZUV4dGVuc2lvbiwgZ2V0TWVkaWFUeXBlIH0gZnJvbSAnLi9tZWRpYVR5cGVzJztcbmltcG9ydCB7IEV4aWZEYXRhLCBwYXJzZUV4aWZEYXRlIH0gZnJvbSAnLi9leGlmUmVhZGVyJztcblxuZXhwb3J0IGludGVyZmFjZSBPcmdhbml6ZUNvbnRleHQge1xuXHRmaWxlOiBURmlsZTtcblx0ZGF0ZTogRGF0ZTtcblx0ZXhpZj86IEV4aWZEYXRhO1xuXHR0YWdzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3JnYW5pemVUYXJnZXQge1xuXHRvcmlnaW5hbFBhdGg6IHN0cmluZztcblx0bmV3UGF0aDogc3RyaW5nO1xuXHRuZXdOYW1lOiBzdHJpbmc7XG59XG5cbi8qKlxuICogXHU2N0U1XHU2MjdFXHU1MzM5XHU5MTREXHU3Njg0XHU3QjJDXHU0RTAwXHU2NzYxXHU4OUM0XHU1MjE5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTWF0Y2hpbmdSdWxlKFxuXHRydWxlczogT3JnYW5pemVSdWxlW10sXG5cdGZpbGU6IFRGaWxlLFxuXHRtZXRhZGF0YT86IHsgZXhpZj86IEV4aWZEYXRhOyB0YWdzPzogc3RyaW5nW10gfVxuKTogT3JnYW5pemVSdWxlIHwgbnVsbCB7XG5cdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZS5uYW1lKS5yZXBsYWNlKCcuJywgJycpLnRvTG93ZXJDYXNlKCk7XG5cblx0Zm9yIChjb25zdCBydWxlIG9mIHJ1bGVzKSB7XG5cdFx0aWYgKCFydWxlLmVuYWJsZWQpIGNvbnRpbnVlO1xuXG5cdFx0Ly8gXHU2OEMwXHU2N0U1XHU2MjY5XHU1QzU1XHU1NDBEXHU1MzM5XHU5MTREXG5cdFx0aWYgKHJ1bGUubWF0Y2hFeHRlbnNpb25zKSB7XG5cdFx0XHRjb25zdCBhbGxvd2VkRXh0cyA9IHJ1bGUubWF0Y2hFeHRlbnNpb25zXG5cdFx0XHRcdC5zcGxpdCgnLCcpXG5cdFx0XHRcdC5tYXAoZSA9PiBlLnRyaW0oKS50b0xvd2VyQ2FzZSgpKTtcblxuXHRcdFx0aWYgKCFhbGxvd2VkRXh0cy5pbmNsdWRlcyhleHQpKSBjb250aW51ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcnVsZTtcblx0fVxuXG5cdHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFx1NjgzOVx1NjM2RVx1ODlDNFx1NTIxOVx1NTQ4Q1x1NEUwQVx1NEUwQlx1NjU4N1x1OEJBMVx1N0I5N1x1NzZFRVx1NjgwN1x1OERFRlx1NUY4NFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZVRhcmdldChydWxlOiBPcmdhbml6ZVJ1bGUsIGN0eDogT3JnYW5pemVDb250ZXh0KTogT3JnYW5pemVUYXJnZXQge1xuXHRjb25zdCBleHQgPSBnZXRGaWxlRXh0ZW5zaW9uKGN0eC5maWxlLm5hbWUpO1xuXHRjb25zdCBiYXNlTmFtZSA9IGN0eC5maWxlLm5hbWUucmVwbGFjZSgvXFwuW14uXSskLywgJycpO1xuXHRjb25zdCBtZWRpYVR5cGUgPSBnZXRNZWRpYVR5cGUoY3R4LmZpbGUubmFtZSkgfHwgJ290aGVyJztcblxuXHQvLyBcdTRGMThcdTUxNDhcdTRGN0ZcdTc1MjggRVhJRiBcdTY1RTVcdTY3MUZcblx0bGV0IGRhdGUgPSBjdHguZGF0ZTtcblx0aWYgKGN0eC5leGlmPy5kYXRlVGltZU9yaWdpbmFsKSB7XG5cdFx0Y29uc3QgZXhpZkRhdGUgPSBwYXJzZUV4aWZEYXRlKGN0eC5leGlmLmRhdGVUaW1lT3JpZ2luYWwpO1xuXHRcdGlmIChleGlmRGF0ZSkgZGF0ZSA9IGV4aWZEYXRlO1xuXHR9XG5cblx0Y29uc3QgeWVhciA9IFN0cmluZyhkYXRlLmdldEZ1bGxZZWFyKCkpO1xuXHRjb25zdCBtb250aCA9IFN0cmluZyhkYXRlLmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCAnMCcpO1xuXHRjb25zdCBkYXkgPSBTdHJpbmcoZGF0ZS5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsICcwJyk7XG5cblx0Y29uc3QgY2FtZXJhID0gY3R4LmV4aWY/Lm1ha2Vcblx0XHQ/IGAke2N0eC5leGlmLm1ha2V9JHtjdHguZXhpZi5tb2RlbCA/ICcgJyArIGN0eC5leGlmLm1vZGVsIDogJyd9YFxuXHRcdDogJ1Vua25vd24nO1xuXG5cdGNvbnN0IHRhZyA9IGN0eC50YWdzPy5bMF0gfHwgJ3VudGFnZ2VkJztcblxuXHRjb25zdCB2YXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuXHRcdCd7eWVhcn0nOiB5ZWFyLFxuXHRcdCd7bW9udGh9JzogbW9udGgsXG5cdFx0J3tkYXl9JzogZGF5LFxuXHRcdCd7ZXh0fSc6IGV4dC5yZXBsYWNlKCcuJywgJycpLFxuXHRcdCd7bmFtZX0nOiBiYXNlTmFtZSxcblx0XHQne2NhbWVyYX0nOiBzYW5pdGl6ZUZpbGVOYW1lKGNhbWVyYSksXG5cdFx0J3t0eXBlfSc6IG1lZGlhVHlwZSxcblx0XHQne3RhZ30nOiBzYW5pdGl6ZUZpbGVOYW1lKHRhZylcblx0fTtcblxuXHQvLyBcdTVDNTVcdTVGMDBcdThERUZcdTVGODRcdTZBMjFcdTY3N0Zcblx0bGV0IG5ld0RpciA9IHJ1bGUucGF0aFRlbXBsYXRlO1xuXHRmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh2YXJzKSkge1xuXHRcdG5ld0RpciA9IG5ld0Rpci5yZXBsYWNlKG5ldyBSZWdFeHAoZXNjYXBlUmVnZXgoa2V5KSwgJ2cnKSwgdmFsdWUpO1xuXHR9XG5cblx0Ly8gXHU1QzU1XHU1RjAwXHU2NTg3XHU0RUY2XHU1NDBEXHU2QTIxXHU2NzdGXG5cdGxldCBuZXdOYW1lID0gcnVsZS5yZW5hbWVUZW1wbGF0ZSB8fCAne25hbWV9Jztcblx0Zm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModmFycykpIHtcblx0XHRuZXdOYW1lID0gbmV3TmFtZS5yZXBsYWNlKG5ldyBSZWdFeHAoZXNjYXBlUmVnZXgoa2V5KSwgJ2cnKSwgdmFsdWUpO1xuXHR9XG5cblx0Ly8gXHU3ODZFXHU0RkREXHU2NTg3XHU0RUY2XHU1NDBEXHU2NzA5XHU2MjY5XHU1QzU1XHU1NDBEXG5cdGlmICghbmV3TmFtZS5lbmRzV2l0aChleHQpKSB7XG5cdFx0bmV3TmFtZSA9IG5ld05hbWUgKyBleHQ7XG5cdH1cblxuXHQvLyBcdTZFMDVcdTc0MDZcdThERUZcdTVGODRcblx0bmV3RGlyID0gbmV3RGlyLnJlcGxhY2UoL1xcLysvZywgJy8nKS5yZXBsYWNlKC9eXFwvfFxcLyQvZywgJycpO1xuXG5cdGNvbnN0IG5ld1BhdGggPSBuZXdEaXIgPyBgJHtuZXdEaXJ9LyR7bmV3TmFtZX1gIDogbmV3TmFtZTtcblxuXHRyZXR1cm4ge1xuXHRcdG9yaWdpbmFsUGF0aDogY3R4LmZpbGUucGF0aCxcblx0XHRuZXdQYXRoLFxuXHRcdG5ld05hbWVcblx0fTtcbn1cblxuLyoqXG4gKiBcdTZFMDVcdTc0MDZcdTY1ODdcdTRFRjZcdTU0MERcdTRFMkRcdTc2ODRcdTk3NUVcdTZDRDVcdTVCNTdcdTdCMjZcbiAqL1xuZnVuY3Rpb24gc2FuaXRpemVGaWxlTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRyZXR1cm4gbmFtZVxuXHRcdC5yZXBsYWNlKC9bL1xcXFw6Kj9cIjw+fF0vZywgJ18nKVxuXHRcdC5yZXBsYWNlKC9cXHMrL2csICdfJylcblx0XHQucmVwbGFjZSgvXysvZywgJ18nKVxuXHRcdC50cmltKCk7XG59XG5cbi8qKlxuICogXHU4RjZDXHU0RTQ5XHU2QjYzXHU1MjE5XHU4ODY4XHU4RkJFXHU1RjBGXHU3Mjc5XHU2QjhBXHU1QjU3XHU3QjI2XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVJlZ2V4KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcblx0cmV0dXJuIHN0ci5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgJ1xcXFwkJicpO1xufVxuIiwgIi8qKlxuICogQ2FudmFzIFx1NUE5Mlx1NEY1M1x1NTkwNFx1NzQwNlx1NTY2OFxuICogXHU0RjdGXHU3NTI4IENhbnZhcyBBUEkgXHU1QjlFXHU3M0IwXHU1NkZFXHU3MjQ3XHU1MzhCXHU3RjI5L1x1OEY2Q1x1NjM2Mi9cdTZDMzRcdTUzNzAvXHU4OEMxXHU1MjZBXG4gKiBcdTdFQUZcdTZENEZcdTg5QzhcdTU2NjhcdTVCOUVcdTczQjBcdUZGMENcdTY1RTBcdTUzOUZcdTc1MUZcdTRGOURcdThENTZcbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb2Nlc3NPcHRpb25zIHtcblx0cXVhbGl0eT86IG51bWJlcjsgICAgICAgIC8vIDAtMTAwLCBkZWZhdWx0IDgwXG5cdG1heFdpZHRoPzogbnVtYmVyO1xuXHRtYXhIZWlnaHQ/OiBudW1iZXI7XG5cdGZvcm1hdD86ICd3ZWJwJyB8ICdqcGVnJyB8ICdwbmcnO1xuXHR3YXRlcm1hcms/OiB7XG5cdFx0dGV4dDogc3RyaW5nO1xuXHRcdHBvc2l0aW9uOiAnY2VudGVyJyB8ICdib3R0b20tcmlnaHQnIHwgJ2JvdHRvbS1sZWZ0Jztcblx0XHRvcGFjaXR5OiBudW1iZXI7ICAgICAgIC8vIDAtMVxuXHRcdGZvbnRTaXplPzogbnVtYmVyOyAgICAgLy8gZGVmYXVsdCAyNFxuXHR9O1xuXHRjcm9wPzoge1xuXHRcdHg6IG51bWJlcjtcblx0XHR5OiBudW1iZXI7XG5cdFx0d2lkdGg6IG51bWJlcjtcblx0XHRoZWlnaHQ6IG51bWJlcjtcblx0fTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9jZXNzUmVzdWx0IHtcblx0YmxvYjogQmxvYjtcblx0d2lkdGg6IG51bWJlcjtcblx0aGVpZ2h0OiBudW1iZXI7XG5cdG9yaWdpbmFsU2l6ZTogbnVtYmVyO1xuXHRuZXdTaXplOiBudW1iZXI7XG5cdGZvcm1hdDogc3RyaW5nO1xufVxuXG5jb25zdCBNSU1FX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcblx0J3dlYnAnOiAnaW1hZ2Uvd2VicCcsXG5cdCdqcGVnJzogJ2ltYWdlL2pwZWcnLFxuXHQnanBnJzogJ2ltYWdlL2pwZWcnLFxuXHQncG5nJzogJ2ltYWdlL3BuZycsXG5cdCdhdmlmJzogJ2ltYWdlL2F2aWYnXG59O1xuXG4vKipcbiAqIFx1NjhDMFx1NkQ0Qlx1NkQ0Rlx1ODlDOFx1NTY2OFx1NjYyRlx1NTQyNlx1NjUyRlx1NjMwMVx1NjdEMFx1NzlDRFx1OEY5M1x1NTFGQVx1NjgzQ1x1NUYwRlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNGb3JtYXRTdXBwb3J0ZWQoZm9ybWF0OiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0Y29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdGNhbnZhcy53aWR0aCA9IDE7XG5cdGNhbnZhcy5oZWlnaHQgPSAxO1xuXHRjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0aWYgKCFjdHgpIHJldHVybiBmYWxzZTtcblx0Y3R4LmZpbGxSZWN0KDAsIDAsIDEsIDEpO1xuXG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdGNhbnZhcy50b0Jsb2IoXG5cdFx0XHQoYmxvYikgPT4gcmVzb2x2ZShibG9iICE9PSBudWxsICYmIGJsb2Iuc2l6ZSA+IDApLFxuXHRcdFx0TUlNRV9NQVBbZm9ybWF0XSB8fCBgaW1hZ2UvJHtmb3JtYXR9YFxuXHRcdCk7XG5cdH0pO1xufVxuXG4vKipcbiAqIFx1NTJBMFx1OEY3RFx1NTZGRVx1NzI0N1xuICovXG5mdW5jdGlvbiBsb2FkSW1hZ2Uoc3JjOiBzdHJpbmcpOiBQcm9taXNlPEhUTUxJbWFnZUVsZW1lbnQ+IHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRpbWcuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcblx0XHRpbWcub25sb2FkID0gKCkgPT4gcmVzb2x2ZShpbWcpO1xuXHRcdGltZy5vbmVycm9yID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgaW1hZ2U6ICR7c3JjfWApKTtcblx0XHRpbWcuc3JjID0gc3JjO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBcdTU5MDRcdTc0MDZcdTUzNTVcdTVGMjBcdTU2RkVcdTcyNDdcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NJbWFnZShcblx0c3JjOiBzdHJpbmcsXG5cdG9yaWdpbmFsU2l6ZTogbnVtYmVyLFxuXHRvcHRpb25zOiBQcm9jZXNzT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPFByb2Nlc3NSZXN1bHQ+IHtcblx0Y29uc3QgaW1nID0gYXdhaXQgbG9hZEltYWdlKHNyYyk7XG5cblx0bGV0IHsgd2lkdGg6IHNyY1csIGhlaWdodDogc3JjSCB9ID0gaW1nO1xuXHRsZXQgZHJhd1ggPSAwO1xuXHRsZXQgZHJhd1kgPSAwO1xuXHRsZXQgZHJhd1cgPSBzcmNXO1xuXHRsZXQgZHJhd0ggPSBzcmNIO1xuXG5cdC8vIFx1ODhDMVx1NTI2QVxuXHRpZiAob3B0aW9ucy5jcm9wKSB7XG5cdFx0ZHJhd1ggPSAtb3B0aW9ucy5jcm9wLng7XG5cdFx0ZHJhd1kgPSAtb3B0aW9ucy5jcm9wLnk7XG5cdFx0c3JjVyA9IG9wdGlvbnMuY3JvcC53aWR0aDtcblx0XHRzcmNIID0gb3B0aW9ucy5jcm9wLmhlaWdodDtcblx0fVxuXG5cdC8vIFx1N0YyOVx1NjUzRVx1N0VBNlx1Njc1RlxuXHRsZXQgdGFyZ2V0VyA9IHNyY1c7XG5cdGxldCB0YXJnZXRIID0gc3JjSDtcblxuXHRpZiAob3B0aW9ucy5tYXhXaWR0aCB8fCBvcHRpb25zLm1heEhlaWdodCkge1xuXHRcdGNvbnN0IG1heFcgPSBvcHRpb25zLm1heFdpZHRoIHx8IEluZmluaXR5O1xuXHRcdGNvbnN0IG1heEggPSBvcHRpb25zLm1heEhlaWdodCB8fCBJbmZpbml0eTtcblx0XHRjb25zdCByYXRpbyA9IE1hdGgubWluKG1heFcgLyBzcmNXLCBtYXhIIC8gc3JjSCwgMSk7XG5cdFx0dGFyZ2V0VyA9IE1hdGgucm91bmQoc3JjVyAqIHJhdGlvKTtcblx0XHR0YXJnZXRIID0gTWF0aC5yb3VuZChzcmNIICogcmF0aW8pO1xuXHR9XG5cblx0Y29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdGNhbnZhcy53aWR0aCA9IHRhcmdldFc7XG5cdGNhbnZhcy5oZWlnaHQgPSB0YXJnZXRIO1xuXG5cdGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRpZiAoIWN0eCkgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZ2V0IGNhbnZhcyBjb250ZXh0Jyk7XG5cblx0Ly8gXHU3RUQ4XHU1MjM2XHU1NkZFXHU3MjQ3XG5cdGlmIChvcHRpb25zLmNyb3ApIHtcblx0XHRjb25zdCBzY2FsZVggPSB0YXJnZXRXIC8gc3JjVztcblx0XHRjb25zdCBzY2FsZVkgPSB0YXJnZXRIIC8gc3JjSDtcblx0XHRjdHguZHJhd0ltYWdlKFxuXHRcdFx0aW1nLFxuXHRcdFx0b3B0aW9ucy5jcm9wLngsIG9wdGlvbnMuY3JvcC55LCBvcHRpb25zLmNyb3Aud2lkdGgsIG9wdGlvbnMuY3JvcC5oZWlnaHQsXG5cdFx0XHQwLCAwLCB0YXJnZXRXLCB0YXJnZXRIXG5cdFx0KTtcblx0fSBlbHNlIHtcblx0XHRjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgdGFyZ2V0VywgdGFyZ2V0SCk7XG5cdH1cblxuXHQvLyBcdTZDMzRcdTUzNzBcblx0aWYgKG9wdGlvbnMud2F0ZXJtYXJrPy50ZXh0KSB7XG5cdFx0Y29uc3Qgd20gPSBvcHRpb25zLndhdGVybWFyaztcblx0XHRjb25zdCBmb250U2l6ZSA9IHdtLmZvbnRTaXplIHx8IE1hdGgubWF4KDE2LCBNYXRoLnJvdW5kKHRhcmdldFcgLyAzMCkpO1xuXG5cdFx0Y3R4LnNhdmUoKTtcblx0XHRjdHguZ2xvYmFsQWxwaGEgPSB3bS5vcGFjaXR5O1xuXHRcdGN0eC5mb250ID0gYCR7Zm9udFNpemV9cHggc2Fucy1zZXJpZmA7XG5cdFx0Y3R4LmZpbGxTdHlsZSA9ICcjZmZmZmZmJztcblx0XHRjdHguc3Ryb2tlU3R5bGUgPSAnIzAwMDAwMCc7XG5cdFx0Y3R4LmxpbmVXaWR0aCA9IDI7XG5cblx0XHRjb25zdCB0ZXh0TWV0cmljcyA9IGN0eC5tZWFzdXJlVGV4dCh3bS50ZXh0KTtcblx0XHRsZXQgdGV4dFg6IG51bWJlcjtcblx0XHRsZXQgdGV4dFk6IG51bWJlcjtcblxuXHRcdHN3aXRjaCAod20ucG9zaXRpb24pIHtcblx0XHRcdGNhc2UgJ2NlbnRlcic6XG5cdFx0XHRcdHRleHRYID0gKHRhcmdldFcgLSB0ZXh0TWV0cmljcy53aWR0aCkgLyAyO1xuXHRcdFx0XHR0ZXh0WSA9IHRhcmdldEggLyAyICsgZm9udFNpemUgLyAyO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2JvdHRvbS1sZWZ0Jzpcblx0XHRcdFx0dGV4dFggPSAyMDtcblx0XHRcdFx0dGV4dFkgPSB0YXJnZXRIIC0gMjA7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnYm90dG9tLXJpZ2h0Jzpcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRleHRYID0gdGFyZ2V0VyAtIHRleHRNZXRyaWNzLndpZHRoIC0gMjA7XG5cdFx0XHRcdHRleHRZID0gdGFyZ2V0SCAtIDIwO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRjdHguc3Ryb2tlVGV4dCh3bS50ZXh0LCB0ZXh0WCwgdGV4dFkpO1xuXHRcdGN0eC5maWxsVGV4dCh3bS50ZXh0LCB0ZXh0WCwgdGV4dFkpO1xuXHRcdGN0eC5yZXN0b3JlKCk7XG5cdH1cblxuXHQvLyBcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcdTU0OENcdThEMjhcdTkxQ0Zcblx0Y29uc3QgZm9ybWF0ID0gb3B0aW9ucy5mb3JtYXQgfHwgJ3dlYnAnO1xuXHRjb25zdCBxdWFsaXR5ID0gKG9wdGlvbnMucXVhbGl0eSA/PyA4MCkgLyAxMDA7XG5cdGNvbnN0IG1pbWVUeXBlID0gTUlNRV9NQVBbZm9ybWF0XSB8fCAnaW1hZ2Uvd2VicCc7XG5cblx0Y29uc3QgYmxvYiA9IGF3YWl0IG5ldyBQcm9taXNlPEJsb2I+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjYW52YXMudG9CbG9iKFxuXHRcdFx0KGIpID0+IHtcblx0XHRcdFx0aWYgKGIpIHJlc29sdmUoYik7XG5cdFx0XHRcdGVsc2UgcmVqZWN0KG5ldyBFcnJvcignQ2FudmFzIHRvQmxvYiByZXR1cm5lZCBudWxsJykpO1xuXHRcdFx0fSxcblx0XHRcdG1pbWVUeXBlLFxuXHRcdFx0cXVhbGl0eVxuXHRcdCk7XG5cdH0pO1xuXG5cdHJldHVybiB7XG5cdFx0YmxvYixcblx0XHR3aWR0aDogdGFyZ2V0Vyxcblx0XHRoZWlnaHQ6IHRhcmdldEgsXG5cdFx0b3JpZ2luYWxTaXplLFxuXHRcdG5ld1NpemU6IGJsb2Iuc2l6ZSxcblx0XHRmb3JtYXRcblx0fTtcbn1cblxuLyoqXG4gKiBcdTYyNzlcdTkxQ0ZcdTU5MDRcdTc0MDZcdTU2RkVcdTcyNDdcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJhdGNoUHJvY2Vzcyhcblx0ZmlsZXM6IEFycmF5PHsgc3JjOiBzdHJpbmc7IG9yaWdpbmFsU2l6ZTogbnVtYmVyOyBuYW1lOiBzdHJpbmcgfT4sXG5cdG9wdGlvbnM6IFByb2Nlc3NPcHRpb25zLFxuXHRvblByb2dyZXNzPzogKHByb2Nlc3NlZDogbnVtYmVyLCB0b3RhbDogbnVtYmVyLCBjdXJyZW50TmFtZTogc3RyaW5nKSA9PiB2b2lkXG4pOiBQcm9taXNlPEFycmF5PHsgbmFtZTogc3RyaW5nOyByZXN1bHQ6IFByb2Nlc3NSZXN1bHQgfCBudWxsOyBlcnJvcj86IHN0cmluZyB9Pj4ge1xuXHRjb25zdCByZXN1bHRzOiBBcnJheTx7IG5hbWU6IHN0cmluZzsgcmVzdWx0OiBQcm9jZXNzUmVzdWx0IHwgbnVsbDsgZXJyb3I/OiBzdHJpbmcgfT4gPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y29uc3QgZmlsZSA9IGZpbGVzW2ldO1xuXHRcdGlmIChvblByb2dyZXNzKSBvblByb2dyZXNzKGksIGZpbGVzLmxlbmd0aCwgZmlsZS5uYW1lKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBwcm9jZXNzSW1hZ2UoZmlsZS5zcmMsIGZpbGUub3JpZ2luYWxTaXplLCBvcHRpb25zKTtcblx0XHRcdHJlc3VsdHMucHVzaCh7IG5hbWU6IGZpbGUubmFtZSwgcmVzdWx0IH0pO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRyZXN1bHRzLnB1c2goe1xuXHRcdFx0XHRuYW1lOiBmaWxlLm5hbWUsXG5cdFx0XHRcdHJlc3VsdDogbnVsbCxcblx0XHRcdFx0ZXJyb3I6IChlcnJvciBhcyBFcnJvcikubWVzc2FnZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKG9uUHJvZ3Jlc3MpIG9uUHJvZ3Jlc3MoZmlsZXMubGVuZ3RoLCBmaWxlcy5sZW5ndGgsICcnKTtcblxuXHRyZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBcdTRFQ0VcdTg5QzZcdTk4OTFcdTYyMkFcdTUzRDZcdTVFMjdcdTRGNUNcdTRFM0FcdTdGMjlcdTc1NjVcdTU2RkVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RWaWRlb0ZyYW1lKFxuXHR2aWRlb1NyYzogc3RyaW5nLFxuXHRzZWVrVGltZTogbnVtYmVyID0gMVxuKTogUHJvbWlzZTx7IGJsb2I6IEJsb2I7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0+IHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XG5cdFx0dmlkZW8uY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcblx0XHR2aWRlby5tdXRlZCA9IHRydWU7XG5cdFx0dmlkZW8ucHJlbG9hZCA9ICdtZXRhZGF0YSc7XG5cblx0XHR2aWRlby5hZGRFdmVudExpc3RlbmVyKCdsb2FkZWRtZXRhZGF0YScsICgpID0+IHtcblx0XHRcdHZpZGVvLmN1cnJlbnRUaW1lID0gTWF0aC5taW4oc2Vla1RpbWUsIHZpZGVvLmR1cmF0aW9uICogMC4xKTtcblx0XHR9KTtcblxuXHRcdHZpZGVvLmFkZEV2ZW50TGlzdGVuZXIoJ3NlZWtlZCcsICgpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0XHRjYW52YXMud2lkdGggPSB2aWRlby52aWRlb1dpZHRoO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gdmlkZW8udmlkZW9IZWlnaHQ7XG5cblx0XHRcdFx0Y29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0XHRcdGlmICghY3R4KSB7XG5cdFx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcignQ2Fubm90IGdldCBjYW52YXMgY29udGV4dCcpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjdHguZHJhd0ltYWdlKHZpZGVvLCAwLCAwKTtcblxuXHRcdFx0XHRjYW52YXMudG9CbG9iKFxuXHRcdFx0XHRcdChibG9iKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoYmxvYikge1xuXHRcdFx0XHRcdFx0XHRyZXNvbHZlKHtcblx0XHRcdFx0XHRcdFx0XHRibG9iLFxuXHRcdFx0XHRcdFx0XHRcdHdpZHRoOiB2aWRlby52aWRlb1dpZHRoLFxuXHRcdFx0XHRcdFx0XHRcdGhlaWdodDogdmlkZW8udmlkZW9IZWlnaHRcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyZWplY3QobmV3IEVycm9yKCdWaWRlbyBmcmFtZSBleHRyYWN0aW9uIGZhaWxlZCcpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCdpbWFnZS93ZWJwJyxcblx0XHRcdFx0XHQwLjhcblx0XHRcdFx0KTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR2aWRlby5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdHJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBsb2FkIHZpZGVvOiAke3ZpZGVvU3JjfWApKTtcblx0XHR9KTtcblxuXHRcdHZpZGVvLnNyYyA9IHZpZGVvU3JjO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBcdTgzQjdcdTUzRDZcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcdTc2ODRcdTY1ODdcdTRFRjZcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1hdEV4dGVuc2lvbihmb3JtYXQ6IHN0cmluZyk6IHN0cmluZyB7XG5cdHN3aXRjaCAoZm9ybWF0KSB7XG5cdFx0Y2FzZSAnanBlZyc6IHJldHVybiAnLmpwZyc7XG5cdFx0Y2FzZSAnd2VicCc6IHJldHVybiAnLndlYnAnO1xuXHRcdGNhc2UgJ3BuZyc6IHJldHVybiAnLnBuZyc7XG5cdFx0Y2FzZSAnYXZpZic6IHJldHVybiAnLmF2aWYnO1xuXHRcdGRlZmF1bHQ6IHJldHVybiBgLiR7Zm9ybWF0fWA7XG5cdH1cbn1cbiIsICJpbXBvcnQgeyBURmlsZSwgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYsIHNldEljb24sIE1lbnUsIE1lbnVJdGVtLCBOb3RpY2UgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgSW1hZ2VNYW5hZ2VyUGx1Z2luIGZyb20gJy4uL21haW4nO1xuaW1wb3J0IHsgRGVsZXRlQ29uZmlybU1vZGFsIH0gZnJvbSAnLi9EZWxldGVDb25maXJtTW9kYWwnO1xuaW1wb3J0IHsgZm9ybWF0RmlsZVNpemUgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHsgZ2V0TWVkaWFUeXBlLCBnZXREb2N1bWVudERpc3BsYXlMYWJlbCB9IGZyb20gJy4uL3V0aWxzL21lZGlhVHlwZXMnO1xuXG5leHBvcnQgY29uc3QgVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVMgPSAndW5yZWZlcmVuY2VkLWltYWdlcy12aWV3JztcblxuaW50ZXJmYWNlIFVucmVmZXJlbmNlZEltYWdlIHtcblx0ZmlsZTogVEZpbGU7XG5cdHBhdGg6IHN0cmluZztcblx0bmFtZTogc3RyaW5nO1xuXHRzaXplOiBudW1iZXI7XG5cdG1vZGlmaWVkOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBVbnJlZmVyZW5jZWRJbWFnZXNWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0dW5yZWZlcmVuY2VkSW1hZ2VzOiBVbnJlZmVyZW5jZWRJbWFnZVtdID0gW107XG5cdHByaXZhdGUgaXNTY2FubmluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luKSB7XG5cdFx0c3VwZXIobGVhZik7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblxuXHRnZXRWaWV3VHlwZSgpIHtcblx0XHRyZXR1cm4gVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVM7XG5cdH1cblxuXHRnZXREaXNwbGF5VGV4dCgpIHtcblx0XHRyZXR1cm4gdGhpcy5wbHVnaW4udCgndW5yZWZlcmVuY2VkTWVkaWEnKTtcblx0fVxuXG5cdGFzeW5jIG9uT3BlbigpIHtcblx0XHQvLyBcdTdCNDlcdTVGODUgY29udGVudEVsIFx1NTFDNlx1NTkwN1x1NTk3RFxuXHRcdGxldCByZXRyaWVzID0gMDtcblx0XHR3aGlsZSAoIXRoaXMuY29udGVudEVsICYmIHJldHJpZXMgPCAxMCkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7XG5cdFx0XHRyZXRyaWVzKys7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1VucmVmZXJlbmNlZEltYWdlc1ZpZXc6IGNvbnRlbnRFbCBub3QgcmVhZHknKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoJ3VucmVmZXJlbmNlZC1pbWFnZXMtdmlldycpO1xuXG5cdFx0aWYgKCF0aGlzLmlzU2Nhbm5pbmcpIHtcblx0XHRcdGF3YWl0IHRoaXMuc2NhblVucmVmZXJlbmNlZEltYWdlcygpO1xuXHRcdH1cblx0fVxuXG5cdGFzeW5jIG9uQ2xvc2UoKSB7XG5cdFx0Ly8gXHU2RTA1XHU3NDA2XHU1REU1XHU0RjVDXG5cdH1cblxuXHRhc3luYyBzY2FuVW5yZWZlcmVuY2VkSW1hZ2VzKCkge1xuXHRcdC8vIFx1NTk4Mlx1Njc5Q1x1ODlDNlx1NTZGRVx1NURGMlx1NTE3M1x1OTVFRFx1NjIxNiBjb250ZW50RWwgXHU0RTBEXHU1M0VGXHU3NTI4XHVGRjBDXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXG5cdFx0aWYgKCF0aGlzLmNvbnRlbnRFbCB8fCB0aGlzLmlzU2Nhbm5pbmcpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmlzU2Nhbm5pbmcgPSB0cnVlO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHQvLyBcdTY2M0VcdTc5M0FcdTYyNkJcdTYzQ0ZcdTRFMkRcdTcyQjZcdTYwMDFcblx0XHRjb25zdCBsb2FkaW5nID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbG9hZGluZy1zdGF0ZScgfSk7XG5cdFx0bG9hZGluZy5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdzcGlubmVyJyB9KTtcblx0XHRsb2FkaW5nLmNyZWF0ZURpdih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NjYW5uaW5nVW5yZWZlcmVuY2VkJykgfSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU3Njg0XHU1NkZFXHU3MjQ3XG5cdFx0XHRjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMucGx1Z2luLmZpbmRVbnJlZmVyZW5jZWQoKTtcblxuXHRcdFx0dGhpcy51bnJlZmVyZW5jZWRJbWFnZXMgPSBmaWxlcy5tYXAoZmlsZSA9PiAoe1xuXHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRwYXRoOiBmaWxlLnBhdGgsXG5cdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0c2l6ZTogZmlsZS5zdGF0LnNpemUsXG5cdFx0XHRcdG1vZGlmaWVkOiBmaWxlLnN0YXQubXRpbWVcblx0XHRcdH0pKTtcblxuXHRcdFx0Ly8gXHU2MzA5XHU1OTI3XHU1QzBGXHU2MzkyXHU1RThGXG5cdFx0XHR0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5zb3J0KChhLCBiKSA9PiBiLnNpemUgLSBhLnNpemUpO1xuXG5cdFx0XHQvLyBcdTZFMzJcdTY3RDNcdTg5QzZcdTU2RkVcblx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdTYyNkJcdTYzQ0ZcdTU2RkVcdTcyNDdcdTY1RjZcdTUxRkFcdTk1MTk6JywgZXJyb3IpO1xuXHRcdFx0dGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHtcblx0XHRcdFx0Y2xzOiAnZXJyb3Itc3RhdGUnLFxuXHRcdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdzY2FuRXJyb3InKVxuXHRcdFx0fSk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHRoaXMuaXNTY2FubmluZyA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdGFzeW5jIHJlbmRlclZpZXcoKSB7XG5cdFx0Ly8gXHU1OTgyXHU2NzlDXHU4OUM2XHU1NkZFXHU1REYyXHU1MTczXHU5NUVEXHU2MjE2IGNvbnRlbnRFbCBcdTRFMERcdTUzRUZcdTc1MjhcdUZGMENcdTc2RjRcdTYzQTVcdThGRDRcdTU2REVcblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5jb250ZW50RWwuZW1wdHkoKTtcblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1NTkzNFx1OTBFOFxuXHRcdHRoaXMucmVuZGVySGVhZGVyKCk7XG5cblx0XHRpZiAodGhpcy51bnJlZmVyZW5jZWRJbWFnZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuXHRcdFx0XHRjbHM6ICdzdWNjZXNzLXN0YXRlJyxcblx0XHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnYWxsTWVkaWFSZWZlcmVuY2VkJylcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1N0VERlx1OEJBMVx1NEZFMVx1NjA2RlxuXHRcdGNvbnN0IHN0YXRzID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnc3RhdHMtYmFyJyB9KTtcblx0XHRzdGF0cy5jcmVhdGVTcGFuKHtcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3VucmVmZXJlbmNlZEZvdW5kJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyh0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5sZW5ndGgpKSxcblx0XHRcdGNsczogJ3N0YXRzLWNvdW50J1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgdG90YWxTaXplID0gdGhpcy51bnJlZmVyZW5jZWRJbWFnZXMucmVkdWNlKChzdW0sIGltZykgPT4gc3VtICsgaW1nLnNpemUsIDApO1xuXHRcdHN0YXRzLmNyZWF0ZVNwYW4oe1xuXHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgndG90YWxTaXplTGFiZWwnKS5yZXBsYWNlKCd7c2l6ZX0nLCBmb3JtYXRGaWxlU2l6ZSh0b3RhbFNpemUpKSxcblx0XHRcdGNsczogJ3N0YXRzLXNpemUnXG5cdFx0fSk7XG5cblx0XHQvLyBcdTUyMUJcdTVFRkFcdTU2RkVcdTcyNDdcdTUyMTdcdTg4Njhcblx0XHRjb25zdCBsaXN0ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAndW5yZWZlcmVuY2VkLWxpc3QnIH0pO1xuXG5cdFx0Zm9yIChjb25zdCBpbWFnZSBvZiB0aGlzLnVucmVmZXJlbmNlZEltYWdlcykge1xuXHRcdFx0dGhpcy5yZW5kZXJJbWFnZUl0ZW0obGlzdCwgaW1hZ2UpO1xuXHRcdH1cblx0fVxuXG5cdHJlbmRlckhlYWRlcigpIHtcblx0XHRjb25zdCBoZWFkZXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICd1bnJlZmVyZW5jZWQtaGVhZGVyJyB9KTtcblxuXHRcdGhlYWRlci5jcmVhdGVFbCgnaDInLCB7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ3VucmVmZXJlbmNlZE1lZGlhJykgfSk7XG5cblx0XHRjb25zdCBkZXNjID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2hlYWRlci1kZXNjcmlwdGlvbicgfSk7XG5cdFx0ZGVzYy5jcmVhdGVTcGFuKHsgdGV4dDogdGhpcy5wbHVnaW4udCgndW5yZWZlcmVuY2VkRGVzYycpIH0pO1xuXG5cdFx0Ly8gXHU5MUNEXHU2NUIwXHU2MjZCXHU2M0NGXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgcmVmcmVzaEJ0biA9IGhlYWRlci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdyZWZyZXNoLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihyZWZyZXNoQnRuLCAncmVmcmVzaC1jdycpO1xuXHRcdHJlZnJlc2hCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnNjYW5VbnJlZmVyZW5jZWRJbWFnZXMoKSk7XG5cblx0XHQvLyBcdTYyNzlcdTkxQ0ZcdTY0Q0RcdTRGNUNcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBhY3Rpb25zID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2hlYWRlci1hY3Rpb25zJyB9KTtcblxuXHRcdGNvbnN0IGNvcHlBbGxCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24nIH0pO1xuXHRcdHNldEljb24oY29weUFsbEJ0biwgJ2NvcHknKTtcblx0XHRjb3B5QWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jb3B5QWxsUGF0aHMoKSk7XG5cblx0XHRjb25zdCBkZWxldGVBbGxCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGRlbGV0ZUFsbEJ0biwgJ3RyYXNoLTInKTtcblx0XHRkZWxldGVBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNvbmZpcm1EZWxldGVBbGwoKSk7XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclRodW1ibmFpbEZhbGxiYWNrKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGljb25OYW1lOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpIHtcblx0XHRjb250YWluZXIuZW1wdHkoKTtcblxuXHRcdGNvbnN0IGZhbGxiYWNrID0gY29udGFpbmVyLmNyZWF0ZURpdigpO1xuXHRcdGZhbGxiYWNrLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRmYWxsYmFjay5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcblx0XHRmYWxsYmFjay5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG5cdFx0ZmFsbGJhY2suc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcblx0XHRmYWxsYmFjay5zdHlsZS5nYXAgPSAnNnB4Jztcblx0XHRmYWxsYmFjay5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LW11dGVkKSc7XG5cblx0XHRjb25zdCBpY29uRWwgPSBmYWxsYmFjay5jcmVhdGVEaXYoKTtcblx0XHRzZXRJY29uKGljb25FbCwgaWNvbk5hbWUpO1xuXG5cdFx0Y29uc3QgbGFiZWxFbCA9IGZhbGxiYWNrLmNyZWF0ZURpdih7IHRleHQ6IGxhYmVsIH0pO1xuXHRcdGxhYmVsRWwuc3R5bGUuZm9udFNpemUgPSAnMC43NWVtJztcblx0XHRsYWJlbEVsLnN0eWxlLnRleHRUcmFuc2Zvcm0gPSAndXBwZXJjYXNlJztcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTWVkaWFUaHVtYm5haWwoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZmlsZTogVEZpbGUsIGRpc3BsYXlOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBtZWRpYVR5cGUgPSBnZXRNZWRpYVR5cGUoZmlsZS5uYW1lKTtcblx0XHRjb25zdCBzcmMgPSB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cblx0XHRpZiAobWVkaWFUeXBlID09PSAnaW1hZ2UnKSB7XG5cdFx0XHRjb25zdCBpbWcgPSBjb250YWluZXIuY3JlYXRlRWwoJ2ltZycsIHtcblx0XHRcdFx0YXR0cjoge1xuXHRcdFx0XHRcdHNyYyxcblx0XHRcdFx0XHRhbHQ6IGRpc3BsYXlOYW1lXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRpbWcuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoKSA9PiB7XG5cdFx0XHRcdGNvbnRhaW5lci5lbXB0eSgpO1xuXHRcdFx0XHRjb250YWluZXIuY3JlYXRlRGl2KHtcblx0XHRcdFx0XHRjbHM6ICdpbWFnZS1lcnJvcicsXG5cdFx0XHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnaW1hZ2VMb2FkRXJyb3InKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICd2aWRlbycpIHtcblx0XHRcdGNvbnN0IHZpZGVvID0gY29udGFpbmVyLmNyZWF0ZUVsKCd2aWRlbycpO1xuXHRcdFx0dmlkZW8uc3JjID0gc3JjO1xuXHRcdFx0dmlkZW8ubXV0ZWQgPSB0cnVlO1xuXHRcdFx0dmlkZW8ucHJlbG9hZCA9ICdtZXRhZGF0YSc7XG5cdFx0XHR2aWRlby5wbGF5c0lubGluZSA9IHRydWU7XG5cdFx0XHR2aWRlby5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0XHRcdHZpZGVvLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRcdHZpZGVvLnN0eWxlLm9iamVjdEZpdCA9ICdjb3Zlcic7XG5cdFx0XHR2aWRlby5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsICd2aWRlbycsICdWSURFTycpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKG1lZGlhVHlwZSA9PT0gJ2F1ZGlvJykge1xuXHRcdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsICdtdXNpYycsICdBVURJTycpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICdkb2N1bWVudCcpIHtcblx0XHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAnZmlsZS10ZXh0JywgZ2V0RG9jdW1lbnREaXNwbGF5TGFiZWwoZmlsZS5uYW1lKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsICdmaWxlJywgJ0ZJTEUnKTtcblx0fVxuXG5cdHJlbmRlckltYWdlSXRlbShjb250YWluZXI6IEhUTUxFbGVtZW50LCBpbWFnZTogVW5yZWZlcmVuY2VkSW1hZ2UpIHtcblx0XHRjb25zdCBpdGVtID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3VucmVmZXJlbmNlZC1pdGVtJyB9KTtcblxuXHRcdC8vIFx1NTZGRVx1NzI0N1x1N0YyOVx1NzU2NVx1NTZGRVxuXHRcdGNvbnN0IHRodW1ibmFpbCA9IGl0ZW0uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS10aHVtYm5haWwnIH0pO1xuXHRcdHRoaXMucmVuZGVyTWVkaWFUaHVtYm5haWwodGh1bWJuYWlsLCBpbWFnZS5maWxlLCBpbWFnZS5uYW1lKTtcblxuXHRcdC8vIFx1NTZGRVx1NzI0N1x1NEZFMVx1NjA2RlxuXHRcdGNvbnN0IGluZm8gPSBpdGVtLmNyZWF0ZURpdih7IGNsczogJ2l0ZW0taW5mbycgfSk7XG5cdFx0aW5mby5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLW5hbWUnLCB0ZXh0OiBpbWFnZS5uYW1lIH0pO1xuXHRcdGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1wYXRoJywgdGV4dDogaW1hZ2UucGF0aCB9KTtcblx0XHRpbmZvLmNyZWF0ZURpdih7IGNsczogJ2l0ZW0tc2l6ZScsIHRleHQ6IGZvcm1hdEZpbGVTaXplKGltYWdlLnNpemUpIH0pO1xuXG5cdFx0Ly8gXHU2NENEXHU0RjVDXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgYWN0aW9ucyA9IGl0ZW0uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1hY3Rpb25zJyB9KTtcblxuXHRcdC8vIFx1NTcyOFx1N0IxNFx1OEJCMFx1NEUyRFx1NjdFNVx1NjI3RVx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IGZpbmRCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2l0ZW0tYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKGZpbmRCdG4sICdzZWFyY2gnKTtcblx0XHRmaW5kQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5wbHVnaW4ub3BlbkltYWdlSW5Ob3RlcyhpbWFnZS5maWxlKTtcblx0XHR9KTtcblxuXHRcdC8vIFx1NTkwRFx1NTIzNlx1OERFRlx1NUY4NFx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IGNvcHlCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2l0ZW0tYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKGNvcHlCdG4sICdsaW5rJyk7XG5cdFx0Y29weUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoaW1hZ2UucGF0aCkudGhlbigoKSA9PiB7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgncGF0aENvcGllZCcpKTtcblx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdcdTU5MERcdTUyMzZcdTUyMzBcdTUyNkFcdThEMzRcdTY3N0ZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTUyMjBcdTk2NjRcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBkZWxldGVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2l0ZW0tYnV0dG9uIGRhbmdlcicgfSk7XG5cdFx0c2V0SWNvbihkZWxldGVCdG4sICd0cmFzaC0yJyk7XG5cdFx0ZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5jb25maXJtRGVsZXRlKGltYWdlKTtcblx0XHR9KTtcblxuXHRcdC8vIFx1NTNGM1x1OTUyRVx1ODNEQ1x1NTM1NVxuXHRcdGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCAoZSkgPT4ge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dGhpcy5zaG93Q29udGV4dE1lbnUoZSBhcyBNb3VzZUV2ZW50LCBpbWFnZS5maWxlKTtcblx0XHR9KTtcblx0fVxuXG5cdHNob3dDb250ZXh0TWVudShldmVudDogTW91c2VFdmVudCwgZmlsZTogVEZpbGUpIHtcblx0XHRjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnb3BlbkluTm90ZXMnKSlcblx0XHRcdFx0LnNldEljb24oJ3NlYXJjaCcpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5vcGVuSW1hZ2VJbk5vdGVzKGZpbGUpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnY29weVBhdGgnKSlcblx0XHRcdFx0LnNldEljb24oJ2xpbmsnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChmaWxlLnBhdGgpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdwYXRoQ29waWVkJykpO1xuXHRcdFx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdjb3B5TGluaycpKVxuXHRcdFx0XHQuc2V0SWNvbignY29weScpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBsaW5rID0gYFtbJHtmaWxlLm5hbWV9XV1gO1xuXHRcdFx0XHRcdHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobGluaykudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2xpbmtDb3BpZWQnKSk7XG5cdFx0XHRcdFx0fSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKCdcdTU5MERcdTUyMzZcdTUyMzBcdTUyNkFcdThEMzRcdTY3N0ZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdlcnJvcicpKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRpdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ29wZW5PcmlnaW5hbCcpKVxuXHRcdFx0XHQuc2V0SWNvbignZXh0ZXJuYWwtbGluaycpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBzcmMgPSB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cdFx0XHRcdFx0d2luZG93Lm9wZW4oc3JjLCAnX2JsYW5rJywgJ25vb3BlbmVyLG5vcmVmZXJyZXInKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRtZW51LmFkZFNlcGFyYXRvcigpO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdkZWxldGUnKSlcblx0XHRcdFx0LnNldEljb24oJ3RyYXNoLTInKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgaW1nID0gdGhpcy51bnJlZmVyZW5jZWRJbWFnZXMuZmluZChpID0+IGkuZmlsZS5wYXRoID09PSBmaWxlLnBhdGgpXG5cdFx0XHRcdFx0XHR8fCB7IGZpbGUsIHBhdGg6IGZpbGUucGF0aCwgbmFtZTogZmlsZS5uYW1lLCBzaXplOiBmaWxlLnN0YXQuc2l6ZSwgbW9kaWZpZWQ6IGZpbGUuc3RhdC5tdGltZSB9O1xuXHRcdFx0XHRcdHRoaXMuY29uZmlybURlbGV0ZShpbWcpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuc2hvd0F0UG9zaXRpb24oeyB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZIH0pO1xuXHR9XG5cblx0YXN5bmMgY29uZmlybURlbGV0ZShpbWFnZTogVW5yZWZlcmVuY2VkSW1hZ2UpIHtcblx0XHRuZXcgRGVsZXRlQ29uZmlybU1vZGFsKFxuXHRcdFx0dGhpcy5hcHAsXG5cdFx0XHR0aGlzLnBsdWdpbixcblx0XHRcdFtpbWFnZV0sXG5cdFx0XHRhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCB0aGlzLnBsdWdpbi5zYWZlRGVsZXRlRmlsZShpbWFnZS5maWxlKTtcblx0XHRcdFx0aWYgKHN1Y2Nlc3MpIHtcblx0XHRcdFx0XHQvLyBcdTRFQ0VcdTUyMTdcdTg4NjhcdTRFMkRcdTc5RkJcdTk2NjRcblx0XHRcdFx0XHR0aGlzLnVucmVmZXJlbmNlZEltYWdlcyA9IHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLmZpbHRlcihcblx0XHRcdFx0XHRcdGltZyA9PiBpbWcuZmlsZS5wYXRoICE9PSBpbWFnZS5maWxlLnBhdGhcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdC8vIFx1OTFDRFx1NjVCMFx1NkUzMlx1NjdEM1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0KS5vcGVuKCk7XG5cdH1cblxuXHRhc3luYyBjb25maXJtRGVsZXRlQWxsKCkge1xuXHRcdGlmICh0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnbm9GaWxlc1RvRGVsZXRlJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdG5ldyBEZWxldGVDb25maXJtTW9kYWwoXG5cdFx0XHR0aGlzLmFwcCxcblx0XHRcdHRoaXMucGx1Z2luLFxuXHRcdFx0dGhpcy51bnJlZmVyZW5jZWRJbWFnZXMsXG5cdFx0XHRhc3luYyAoKSA9PiB7XG5cdFx0XHRcdC8vIFx1NEY3Rlx1NzUyOCBQcm9taXNlLmFsbCBcdTVFNzZcdTUzRDFcdTU5MDRcdTc0MDZcdTUyMjBcdTk2NjRcblx0XHRcdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdFx0XHRcdHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLm1hcChpbWFnZSA9PiB0aGlzLnBsdWdpbi5zYWZlRGVsZXRlRmlsZShpbWFnZS5maWxlKSlcblx0XHRcdFx0KTtcblxuXHRcdFx0XHQvLyBcdTdFREZcdThCQTFcdTYyMTBcdTUyOUZcdTU0OENcdTU5MzFcdThEMjVcdTc2ODRcdTY1NzBcdTkxQ0Zcblx0XHRcdFx0Y29uc3QgZGVsZXRlZCA9IHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLmZpbHRlcigoXywgaSkgPT4gcmVzdWx0c1tpXSkubWFwKGltZyA9PiBpbWcubmFtZSk7XG5cdFx0XHRcdGNvbnN0IGVycm9ycyA9IHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLmZpbHRlcigoXywgaSkgPT4gIXJlc3VsdHNbaV0pLm1hcChpbWcgPT4gaW1nLm5hbWUpO1xuXG5cdFx0XHRcdGlmIChkZWxldGVkLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3Byb2Nlc3NlZEZpbGVzJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhkZWxldGVkLmxlbmd0aCkpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZXJyb3JzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3Byb2Nlc3NlZEZpbGVzRXJyb3InKS5yZXBsYWNlKCd7ZXJyb3JzfScsIFN0cmluZyhlcnJvcnMubGVuZ3RoKSkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gXHU5MUNEXHU2NUIwXHU2MjZCXHU2M0NGXG5cdFx0XHRcdGF3YWl0IHRoaXMuc2NhblVucmVmZXJlbmNlZEltYWdlcygpO1xuXHRcdFx0fVxuXHRcdCkub3BlbigpO1xuXHR9XG5cblx0Y29weUFsbFBhdGhzKCkge1xuXHRcdGNvbnN0IHBhdGhzID0gdGhpcy51bnJlZmVyZW5jZWRJbWFnZXMubWFwKGltZyA9PiBpbWcucGF0aCkuam9pbignXFxuJyk7XG5cdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChwYXRocykudGhlbigoKSA9PiB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2NvcGllZEZpbGVQYXRocycpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcodGhpcy51bnJlZmVyZW5jZWRJbWFnZXMubGVuZ3RoKSkpO1xuXHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBcdTVERjJcdTc5RkJcdTk2NjQgZm9ybWF0RmlsZVNpemUgXHU2NUI5XHU2Q0Q1XHVGRjBDXHU0RjdGXHU3NTI4IHV0aWxzL2Zvcm1hdC50cyBcdTRFMkRcdTc2ODRcdTVCOUVcdTczQjBcbn1cbiIsICJpbXBvcnQgeyBNb2RhbCwgTm90aWNlLCBURmlsZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCBJbWFnZU1hbmFnZXJQbHVnaW4gZnJvbSAnLi4vbWFpbic7XG5pbXBvcnQgeyBmb3JtYXRGaWxlU2l6ZSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5cbmludGVyZmFjZSBVbnJlZmVyZW5jZWRJbWFnZSB7XG5cdGZpbGU6IFRGaWxlO1xuXHRwYXRoOiBzdHJpbmc7XG5cdG5hbWU6IHN0cmluZztcblx0c2l6ZTogbnVtYmVyO1xuXHRtb2RpZmllZDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgRGVsZXRlQ29uZmlybU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0aW1hZ2VzOiBVbnJlZmVyZW5jZWRJbWFnZVtdO1xuXHRvbkNvbmZpcm06ICgpID0+IFByb21pc2U8dm9pZD47XG5cdHByaXZhdGUgaXNEZWxldGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdGFwcDogYW55LFxuXHRcdHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luLFxuXHRcdGltYWdlczogVW5yZWZlcmVuY2VkSW1hZ2VbXSxcblx0XHRvbkNvbmZpcm06ICgpID0+IFByb21pc2U8dm9pZD5cblx0KSB7XG5cdFx0c3VwZXIoYXBwKTtcblx0XHR0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblx0XHR0aGlzLmltYWdlcyA9IGltYWdlcztcblx0XHR0aGlzLm9uQ29uZmlybSA9IG9uQ29uZmlybTtcblx0fVxuXG5cdG9uT3BlbigpIHtcblx0XHRjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcblx0XHRjb250ZW50RWwuZW1wdHkoKTtcblxuXHRcdC8vIFx1NEY3Rlx1NzUyOFx1N0ZGQlx1OEJEMVx1NTFGRFx1NjU3MFxuXHRcdGNvbnN0IHQgPSAoa2V5OiBzdHJpbmcpID0+IHRoaXMucGx1Z2luLnQoa2V5KTtcblxuXHRcdC8vIFx1NjgwN1x1OTg5OFxuXHRcdGNvbnRlbnRFbC5jcmVhdGVFbCgnaDInLCB7XG5cdFx0XHR0ZXh0OiB0aGlzLmltYWdlcy5sZW5ndGggPT09IDFcblx0XHRcdFx0PyB0KCdjb25maXJtRGVsZXRlRmlsZScpLnJlcGxhY2UoJ3tuYW1lfScsIHRoaXMuaW1hZ2VzWzBdLm5hbWUpXG5cdFx0XHRcdDogdCgnY29uZmlybURlbGV0ZVNlbGVjdGVkJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyh0aGlzLmltYWdlcy5sZW5ndGgpKVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU4QjY2XHU1NDRBXHU0RkUxXHU2MDZGXG5cdFx0Y29uc3Qgd2FybmluZyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdtb2RhbC13YXJuaW5nJyB9KTtcblx0XHRjb25zdCB3YXJuaW5nVGV4dCA9IHdhcm5pbmcuY3JlYXRlRWwoJ3AnKTtcblx0XHR3YXJuaW5nVGV4dC50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnVzZVRyYXNoRm9sZGVyXG5cdFx0XHQ/IHQoJ2RlbGV0ZVRvVHJhc2gnKVxuXHRcdFx0OiB0KCdjb25maXJtQ2xlYXJBbGwnKTtcblx0XHR3YXJuaW5nVGV4dC5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LXdhcm5pbmcpJztcblx0XHR3YXJuaW5nVGV4dC5zdHlsZS5tYXJnaW4gPSAnMTZweCAwJztcblxuXHRcdC8vIFx1NjU4N1x1NEVGNlx1NTIxN1x1ODg2OFxuXHRcdGNvbnN0IGxpc3RDb250YWluZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbW9kYWwtZmlsZS1saXN0JyB9KTtcblx0XHRsaXN0Q29udGFpbmVyLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogdCgnZGVsZXRlVG9UcmFzaCcpIH0pO1xuXG5cdFx0Y29uc3QgbGlzdCA9IGxpc3RDb250YWluZXIuY3JlYXRlRWwoJ3VsJyk7XG5cdFx0Y29uc3QgbWF4U2hvdyA9IDEwO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5taW4odGhpcy5pbWFnZXMubGVuZ3RoLCBtYXhTaG93KTsgaSsrKSB7XG5cdFx0XHRjb25zdCBpbWcgPSB0aGlzLmltYWdlc1tpXTtcblx0XHRcdGxpc3QuY3JlYXRlRWwoJ2xpJywge1xuXHRcdFx0XHR0ZXh0OiBgJHtpbWcubmFtZX0gKCR7Zm9ybWF0RmlsZVNpemUoaW1nLnNpemUpfSlgXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuaW1hZ2VzLmxlbmd0aCA+IG1heFNob3cpIHtcblx0XHRcdGxpc3QuY3JlYXRlRWwoJ2xpJywge1xuXHRcdFx0XHR0ZXh0OiBgLi4uICR7dGhpcy5pbWFnZXMubGVuZ3RoIC0gbWF4U2hvd30gJHt0KCdmaWxlc1NjYW5uZWQnKX1gXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBcdTYzMDlcdTk0QUVcdTUzM0FcdTU3REZcblx0XHRjb25zdCBidXR0b25Db250YWluZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbW9kYWwtYnV0dG9ucycgfSk7XG5cdFx0YnV0dG9uQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG5cdFx0YnV0dG9uQ29udGFpbmVyLnN0eWxlLmdhcCA9ICcxMnB4Jztcblx0XHRidXR0b25Db250YWluZXIuc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnZmxleC1lbmQnO1xuXHRcdGJ1dHRvbkNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSAnMjBweCc7XG5cblx0XHQvLyBcdTUzRDZcdTZEODhcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBjYW5jZWxCdG4gPSBidXR0b25Db250YWluZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHtcblx0XHRcdHRleHQ6IHQoJ2NhbmNlbCcpLFxuXHRcdFx0Y2xzOiAnbW9kLWN0YSdcblx0XHR9KTtcblx0XHRjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuXG5cdFx0Ly8gXHU1MjIwXHU5NjY0XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgZGVsZXRlQnRuID0gYnV0dG9uQ29udGFpbmVyLmNyZWF0ZUVsKCdidXR0b24nLCB7XG5cdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VUcmFzaEZvbGRlciA/IHQoJ2RlbGV0ZVRvVHJhc2gnKSA6IHQoJ2RlbGV0ZScpLFxuXHRcdFx0Y2xzOiAnbW9kLXdhcm5pbmcnXG5cdFx0fSk7XG5cdFx0ZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNEZWxldGluZykgcmV0dXJuO1xuXHRcdFx0dGhpcy5pc0RlbGV0aW5nID0gdHJ1ZTtcblx0XHRcdGRlbGV0ZUJ0bi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgJ3RydWUnKTtcblx0XHRcdGRlbGV0ZUJ0bi50ZXh0Q29udGVudCA9IHQoJ3Byb2Nlc3NpbmcnKSB8fCAnXHU1OTA0XHU3NDA2XHU0RTJELi4uJztcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5vbkNvbmZpcm0oKTtcblx0XHRcdFx0dGhpcy5jbG9zZSgpO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1MjIwXHU5NjY0XHU2NENEXHU0RjVDXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0bmV3IE5vdGljZSh0KCdkZWxldGVGYWlsZWQnKSk7XG5cdFx0XHRcdHRoaXMuaXNEZWxldGluZyA9IGZhbHNlO1xuXHRcdFx0XHRkZWxldGVCdG4ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuXHRcdFx0XHRkZWxldGVCdG4udGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VUcmFzaEZvbGRlciA/IHQoJ2RlbGV0ZVRvVHJhc2gnKSA6IHQoJ2RlbGV0ZScpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0b25DbG9zZSgpIHtcblx0XHRjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcblx0XHRjb250ZW50RWwuZW1wdHkoKTtcblx0fVxufVxuIiwgImltcG9ydCB7IFRGaWxlLCBURm9sZGVyLCBJdGVtVmlldywgV29ya3NwYWNlTGVhZiwgc2V0SWNvbiwgTWVudSwgTWVudUl0ZW0sIE5vdGljZSwgTW9kYWwsIEJ1dHRvbkNvbXBvbmVudCB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCBJbWFnZU1hbmFnZXJQbHVnaW4gZnJvbSAnLi4vbWFpbic7XG5pbXBvcnQgeyBmb3JtYXRGaWxlU2l6ZSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBnZXREb2N1bWVudERpc3BsYXlMYWJlbCwgZ2V0TWVkaWFUeXBlIH0gZnJvbSAnLi4vdXRpbHMvbWVkaWFUeXBlcyc7XG5pbXBvcnQgeyBpc1BhdGhTYWZlIH0gZnJvbSAnLi4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgZ2V0RmlsZU5hbWVGcm9tUGF0aCwgbm9ybWFsaXplVmF1bHRQYXRoLCBzYWZlRGVjb2RlVVJJQ29tcG9uZW50IH0gZnJvbSAnLi4vdXRpbHMvcGF0aCc7XG5cbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfVFJBU0hfTUFOQUdFTUVOVCA9ICd0cmFzaC1tYW5hZ2VtZW50LXZpZXcnO1xuXG5pbnRlcmZhY2UgVHJhc2hJdGVtIHtcblx0ZmlsZTogVEZpbGU7XG5cdHBhdGg6IHN0cmluZztcblx0cmF3TmFtZTogc3RyaW5nO1xuXHRuYW1lOiBzdHJpbmc7XG5cdHNpemU6IG51bWJlcjtcblx0bW9kaWZpZWQ6IG51bWJlcjtcblx0b3JpZ2luYWxQYXRoPzogc3RyaW5nO1xuXHRyZWZlcmVuY2VDb3VudDogbnVtYmVyO1xuXHRzZWxlY3RlZDogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIERhc2hib2FyZFN0YXRzIHtcblx0dG90YWxGaWxlczogbnVtYmVyO1xuXHR0b3RhbFNpemU6IG51bWJlcjtcblx0YnlUeXBlOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuXHR1bnJlZmVyZW5jZWRSYXRlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBUcmFzaE1hbmFnZW1lbnRWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0dHJhc2hJdGVtczogVHJhc2hJdGVtW10gPSBbXTtcblx0cHJpdmF0ZSBpc0xvYWRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbikge1xuXHRcdHN1cGVyKGxlYWYpO1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHR9XG5cblx0Z2V0Vmlld1R5cGUoKSB7XG5cdFx0cmV0dXJuIFZJRVdfVFlQRV9UUkFTSF9NQU5BR0VNRU5UO1xuXHR9XG5cblx0Z2V0RGlzcGxheVRleHQoKSB7XG5cdFx0cmV0dXJuIHRoaXMucGx1Z2luLnQoJ3RyYXNoTWFuYWdlbWVudCcpO1xuXHR9XG5cblx0YXN5bmMgb25PcGVuKCkge1xuXHRcdGxldCByZXRyaWVzID0gMDtcblx0XHR3aGlsZSAoIXRoaXMuY29udGVudEVsICYmIHJldHJpZXMgPCAxMCkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7XG5cdFx0XHRyZXRyaWVzKys7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1RyYXNoTWFuYWdlbWVudFZpZXc6IGNvbnRlbnRFbCBub3QgcmVhZHknKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoJ3RyYXNoLW1hbmFnZW1lbnQtdmlldycpO1xuXHRcdGF3YWl0IHRoaXMubG9hZFRyYXNoSXRlbXMoKTtcblx0fVxuXG5cdGFzeW5jIG9uQ2xvc2UoKSB7XG5cdFx0Ly8gXHU2RTA1XHU3NDA2XHU1REU1XHU0RjVDXG5cdH1cblxuXHQvKipcblx0ICogXHU1MkEwXHU4RjdEXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRhc3luYyBsb2FkVHJhc2hJdGVtcygpIHtcblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSByZXR1cm47XG5cdFx0aWYgKHRoaXMuaXNMb2FkaW5nKSByZXR1cm47XG5cdFx0dGhpcy5pc0xvYWRpbmcgPSB0cnVlO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHRjb25zdCBsb2FkaW5nID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbG9hZGluZy1zdGF0ZScgfSk7XG5cdFx0bG9hZGluZy5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdzcGlubmVyJyB9KTtcblx0XHRsb2FkaW5nLmNyZWF0ZURpdih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ2xvYWRpbmdUcmFzaEZpbGVzJykgfSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgdHJhc2hQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMucGx1Z2luLnNldHRpbmdzLnRyYXNoRm9sZGVyKTtcblx0XHRcdGlmICghdHJhc2hQYXRoIHx8ICFpc1BhdGhTYWZlKHRyYXNoUGF0aCkpIHtcblx0XHRcdFx0dGhpcy50cmFzaEl0ZW1zID0gW107XG5cdFx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHRyYXNoRm9sZGVyID0gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aCh0cmFzaFBhdGgpO1xuXHRcdFx0aWYgKCF0cmFzaEZvbGRlciB8fCAhKHRyYXNoRm9sZGVyIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcblx0XHRcdFx0dGhpcy50cmFzaEl0ZW1zID0gW107XG5cdFx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHJlZkNvdW50TWFwID0gdGhpcy5idWlsZFJlZkNvdW50TWFwKCk7XG5cblx0XHRcdHRoaXMudHJhc2hJdGVtcyA9IFtdO1xuXHRcdFx0Zm9yIChjb25zdCBmaWxlIG9mIHRyYXNoRm9sZGVyLmNoaWxkcmVuKSB7XG5cdFx0XHRcdGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcblx0XHRcdFx0XHRjb25zdCBvcmlnaW5hbFBhdGggPSB0aGlzLmV4dHJhY3RPcmlnaW5hbFBhdGgoZmlsZS5uYW1lKTtcblx0XHRcdFx0XHRjb25zdCBkaXNwbGF5TmFtZSA9IG9yaWdpbmFsUGF0aCA/IGdldEZpbGVOYW1lRnJvbVBhdGgob3JpZ2luYWxQYXRoKSB8fCBmaWxlLm5hbWUgOiBmaWxlLm5hbWU7XG5cblx0XHRcdFx0XHQvLyBcdTRFQ0VcdTk4ODRcdTVFRkEgTWFwIFx1NEUyRFx1NjdFNVx1NjI3RVx1NUYxNVx1NzUyOFx1NkIyMVx1NjU3MCBPKDEpXG5cdFx0XHRcdFx0Y29uc3QgcmVmQ291bnQgPSBvcmlnaW5hbFBhdGhcblx0XHRcdFx0XHRcdD8gdGhpcy5sb29rdXBSZWZDb3VudChvcmlnaW5hbFBhdGgsIHJlZkNvdW50TWFwKVxuXHRcdFx0XHRcdFx0OiAwO1xuXG5cdFx0XHRcdFx0dGhpcy50cmFzaEl0ZW1zLnB1c2goe1xuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdHBhdGg6IGZpbGUucGF0aCxcblx0XHRcdFx0XHRcdHJhd05hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0XHRcdG5hbWU6IGRpc3BsYXlOYW1lLFxuXHRcdFx0XHRcdFx0c2l6ZTogZmlsZS5zdGF0LnNpemUsXG5cdFx0XHRcdFx0XHRtb2RpZmllZDogZmlsZS5zdGF0Lm10aW1lLFxuXHRcdFx0XHRcdFx0b3JpZ2luYWxQYXRoLFxuXHRcdFx0XHRcdFx0cmVmZXJlbmNlQ291bnQ6IHJlZkNvdW50LFxuXHRcdFx0XHRcdFx0c2VsZWN0ZWQ6IGZhbHNlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy50cmFzaEl0ZW1zLnNvcnQoKGEsIGIpID0+IGIubW9kaWZpZWQgLSBhLm1vZGlmaWVkKTtcblx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdTUyQTBcdThGN0RcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0dGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHtcblx0XHRcdFx0Y2xzOiAnZXJyb3Itc3RhdGUnLFxuXHRcdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdlcnJvcicpXG5cdFx0XHR9KTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0dGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU0RTAwXHU2QjIxXHU2MDI3XHU5MDREXHU1Mzg2XHU2MjQwXHU2NzA5XHU3QjE0XHU4QkIwXHVGRjBDXHU2Nzg0XHU1RUZBXHU1RjE1XHU3NTI4XHU4QkExXHU2NTcwIE1hcFxuXHQgKiBrZXkgPSBcdTVGNTJcdTRFMDBcdTUzMTZcdTY1ODdcdTRFRjZcdTU0MEQgKGxvd2VyY2FzZSksIHZhbHVlID0gXHU4OEFCXHU1RjE1XHU3NTI4XHU2QjIxXHU2NTcwXG5cdCAqIE8oXHU3QjE0XHU4QkIwXHU2NTcwIFx1MDBENyBcdTVFNzNcdTU3NDcgZW1iZWQgXHU2NTcwKVx1RkYwQ1x1NTNFQVx1NjI2N1x1ODg0Q1x1NEUwMFx1NkIyMVxuXHQgKi9cblx0cHJpdmF0ZSBidWlsZFJlZkNvdW50TWFwKCk6IE1hcDxzdHJpbmcsIG51bWJlcj4ge1xuXHRcdGNvbnN0IGNvdW50TWFwID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuXHRcdGNvbnN0IG1hcmtkb3duRmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG5cdFx0Zm9yIChjb25zdCBtZCBvZiBtYXJrZG93bkZpbGVzKSB7XG5cdFx0XHRjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKG1kKTtcblx0XHRcdGlmICghY2FjaGUpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBlbnRyaWVzID0gWy4uLihjYWNoZS5lbWJlZHMgfHwgW10pLCAuLi4oY2FjaGUubGlua3MgfHwgW10pXTtcblx0XHRcdGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuXHRcdFx0XHRjb25zdCBsaW5rUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChlbnRyeS5saW5rKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRjb25zdCBsaW5rTmFtZSA9IChnZXRGaWxlTmFtZUZyb21QYXRoKGxpbmtQYXRoKSB8fCBsaW5rUGF0aCkudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQvLyBcdTYzMDlcdTVCOENcdTY1NzRcdThERUZcdTVGODRcdTU0OENcdTg4RjhcdTY1ODdcdTRFRjZcdTU0MERcdTUyMDZcdTUyMkJcdTdEMkZcdTUyQTBcblx0XHRcdFx0Y291bnRNYXAuc2V0KGxpbmtQYXRoLCAoY291bnRNYXAuZ2V0KGxpbmtQYXRoKSB8fCAwKSArIDEpO1xuXHRcdFx0XHRpZiAobGlua05hbWUgIT09IGxpbmtQYXRoKSB7XG5cdFx0XHRcdFx0Y291bnRNYXAuc2V0KGxpbmtOYW1lLCAoY291bnRNYXAuZ2V0KGxpbmtOYW1lKSB8fCAwKSArIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvdW50TWFwO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NEVDRVx1OTg4NFx1NUVGQSBNYXAgXHU0RTJEXHU2N0U1XHU4QkUyXHU1RjE1XHU3NTI4XHU2QjIxXHU2NTcwXG5cdCAqL1xuXHRwcml2YXRlIGxvb2t1cFJlZkNvdW50KG9yaWdpbmFsUGF0aDogc3RyaW5nLCByZWZDb3VudE1hcDogTWFwPHN0cmluZywgbnVtYmVyPik6IG51bWJlciB7XG5cdFx0Y29uc3Qgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgob3JpZ2luYWxQYXRoKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGNvbnN0IGZpbGVOYW1lID0gKGdldEZpbGVOYW1lRnJvbVBhdGgobm9ybWFsaXplZFBhdGgpIHx8IG5vcm1hbGl6ZWRQYXRoKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGNvbnN0IGV4YWN0Q291bnQgPSByZWZDb3VudE1hcC5nZXQobm9ybWFsaXplZFBhdGgpIHx8IDA7XG5cdFx0Y29uc3QgbmFtZUNvdW50ID0gcmVmQ291bnRNYXAuZ2V0KGZpbGVOYW1lKSB8fCAwO1xuXG5cdFx0Ly8gXHU1MTdDXHU1QkI5XHU4OEY4XHU2NTg3XHU0RUY2XHU1NDBEXHU0RTBFXHU1QjhDXHU2NTc0XHU4REVGXHU1Rjg0XHU0RTI0XHU3OUNEXHU1MTk5XHU2Q0Q1XHVGRjBDXHU5MDdGXHU1MTREXHU1NDBDXHU0RTAwXHU2NTg3XHU0RUY2XHU0RTBEXHU1NDBDXHU5NEZFXHU2M0E1XHU5OENFXHU2ODNDXHU2NUY2XHU4OEFCXHU0RjRFXHU0RjMwXHUzMDAyXG5cdFx0cmV0dXJuIE1hdGgubWF4KGV4YWN0Q291bnQsIG5hbWVDb3VudCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU0RUNFXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1NDBEXHU0RTJEXHU2M0QwXHU1M0Q2XHU1MzlGXHU1OUNCXHU4REVGXHU1Rjg0XG5cdCAqL1xuXHRwcml2YXRlIGV4dHJhY3RPcmlnaW5hbFBhdGgoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG5cdFx0Y29uc3Qgc2VwYXJhdG9ySW5kZXggPSBmaWxlTmFtZS5pbmRleE9mKCdfXycpO1xuXHRcdGlmIChzZXBhcmF0b3JJbmRleCA9PT0gLTEpIHJldHVybiB1bmRlZmluZWQ7XG5cblx0XHRjb25zdCBlbmNvZGVkUGFydCA9IGZpbGVOYW1lLnN1YnN0cmluZyhzZXBhcmF0b3JJbmRleCArIDIpO1xuXHRcdGlmICghZW5jb2RlZFBhcnQpIHJldHVybiB1bmRlZmluZWQ7XG5cblx0XHRjb25zdCBkZWNvZGVkID0gbm9ybWFsaXplVmF1bHRQYXRoKHNhZmVEZWNvZGVVUklDb21wb25lbnQoZW5jb2RlZFBhcnQpKTtcblx0XHRyZXR1cm4gZGVjb2RlZCB8fCB1bmRlZmluZWQ7XG5cdH1cblxuXHQvKipcblx0ICogXHU4QkExXHU3Qjk3XHU0RUVBXHU4ODY4XHU3NkQ4XHU3RURGXHU4QkExXHU2NTcwXHU2MzZFXG5cdCAqL1xuXHRwcml2YXRlIGNvbXB1dGVTdGF0cygpOiBEYXNoYm9hcmRTdGF0cyB7XG5cdFx0Y29uc3QgYnlUeXBlOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG5cdFx0bGV0IHRvdGFsU2l6ZSA9IDA7XG5cdFx0bGV0IHVucmVmZXJlbmNlZENvdW50ID0gMDtcblxuXHRcdGZvciAoY29uc3QgaXRlbSBvZiB0aGlzLnRyYXNoSXRlbXMpIHtcblx0XHRcdHRvdGFsU2l6ZSArPSBpdGVtLnNpemU7XG5cdFx0XHRjb25zdCB0eXBlID0gZ2V0TWVkaWFUeXBlKGl0ZW0ubmFtZSkgfHwgJ290aGVyJztcblx0XHRcdGJ5VHlwZVt0eXBlXSA9IChieVR5cGVbdHlwZV0gfHwgMCkgKyAxO1xuXHRcdFx0aWYgKGl0ZW0ucmVmZXJlbmNlQ291bnQgPT09IDApIHtcblx0XHRcdFx0dW5yZWZlcmVuY2VkQ291bnQrKztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dG90YWxGaWxlczogdGhpcy50cmFzaEl0ZW1zLmxlbmd0aCxcblx0XHRcdHRvdGFsU2l6ZSxcblx0XHRcdGJ5VHlwZSxcblx0XHRcdHVucmVmZXJlbmNlZFJhdGU6IHRoaXMudHJhc2hJdGVtcy5sZW5ndGggPiAwXG5cdFx0XHRcdD8gTWF0aC5yb3VuZCgodW5yZWZlcmVuY2VkQ291bnQgLyB0aGlzLnRyYXNoSXRlbXMubGVuZ3RoKSAqIDEwMClcblx0XHRcdFx0OiAwXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTg5QzZcdTU2RkVcblx0ICovXG5cdGFzeW5jIHJlbmRlclZpZXcoKSB7XG5cdFx0aWYgKCF0aGlzLmNvbnRlbnRFbCkgcmV0dXJuO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHQvLyBcdTU5MzRcdTkwRThcblx0XHR0aGlzLnJlbmRlckhlYWRlcigpO1xuXG5cdFx0Ly8gXHU0RUVBXHU4ODY4XHU3NkQ4XG5cdFx0aWYgKHRoaXMudHJhc2hJdGVtcy5sZW5ndGggPiAwKSB7XG5cdFx0XHR0aGlzLnJlbmRlckRhc2hib2FyZCgpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnRyYXNoSXRlbXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuXHRcdFx0XHRjbHM6ICdlbXB0eS1zdGF0ZScsXG5cdFx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3RyYXNoRm9sZGVyRW1wdHknKVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU2Mjc5XHU5MUNGXHU2NENEXHU0RjVDXHU1REU1XHU1MTc3XHU2ODBGXG5cdFx0dGhpcy5yZW5kZXJCYXRjaFRvb2xiYXIoKTtcblxuXHRcdC8vIFx1NjU4N1x1NEVGNlx1NTIxN1x1ODg2OFxuXHRcdGNvbnN0IGxpc3QgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICd0cmFzaC1saXN0JyB9KTtcblx0XHRmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy50cmFzaEl0ZW1zKSB7XG5cdFx0XHR0aGlzLnJlbmRlclRyYXNoSXRlbShsaXN0LCBpdGVtKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTMyXHU2N0QzXHU1OTM0XHU5MEU4XG5cdCAqL1xuXHRyZW5kZXJIZWFkZXIoKSB7XG5cdFx0Y29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAndHJhc2gtaGVhZGVyJyB9KTtcblx0XHRoZWFkZXIuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiB0aGlzLnBsdWdpbi50KCd0cmFzaE1hbmFnZW1lbnQnKSB9KTtcblxuXHRcdGNvbnN0IGRlc2MgPSBoZWFkZXIuY3JlYXRlRGl2KHsgY2xzOiAnaGVhZGVyLWRlc2NyaXB0aW9uJyB9KTtcblx0XHRkZXNjLmNyZWF0ZVNwYW4oeyB0ZXh0OiB0aGlzLnBsdWdpbi50KCd0cmFzaE1hbmFnZW1lbnREZXNjJykgfSk7XG5cblx0XHRjb25zdCBhY3Rpb25zID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2hlYWRlci1hY3Rpb25zJyB9KTtcblxuXHRcdC8vIFx1NTIzN1x1NjVCMFx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IHJlZnJlc2hCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3JlZnJlc2gtYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKHJlZnJlc2hCdG4sICdyZWZyZXNoLWN3Jyk7XG5cdFx0cmVmcmVzaEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMubG9hZFRyYXNoSXRlbXMoKSk7XG5cdFx0cmVmcmVzaEJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ3JlZnJlc2gnKTtcblxuXHRcdC8vIFx1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRlx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IHNjYW5CdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24nIH0pO1xuXHRcdHNldEljb24oc2NhbkJ0biwgJ3NoaWVsZC1jaGVjaycpO1xuXHRcdHNjYW5CdG4uY3JlYXRlU3Bhbih7IHRleHQ6IGAgJHt0aGlzLnBsdWdpbi50KCdzYWZlU2NhbicpfWAgfSk7XG5cdFx0c2NhbkJ0bi5kaXNhYmxlZCA9ICF0aGlzLnBsdWdpbi5zZXR0aW5ncy5zYWZlU2NhbkVuYWJsZWQ7XG5cdFx0c2NhbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucnVuU2FmZVNjYW4oKSk7XG5cdFx0c2NhbkJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuRGVzYycpO1xuXG5cdFx0Ly8gXHU2RTA1XHU3QTdBXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgY2xlYXJBbGxCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGNsZWFyQWxsQnRuLCAndHJhc2gtMicpO1xuXHRcdGNsZWFyQWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jb25maXJtQ2xlYXJBbGwoKSk7XG5cdFx0Y2xlYXJBbGxCdG4udGl0bGUgPSB0aGlzLnBsdWdpbi50KCdjbGVhclRyYXNoVG9vbHRpcCcpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1N0VERlx1OEJBMVx1NEVFQVx1ODg2OFx1NzZEOFxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJEYXNoYm9hcmQoKSB7XG5cdFx0Y29uc3Qgc3RhdHMgPSB0aGlzLmNvbXB1dGVTdGF0cygpO1xuXHRcdGNvbnN0IGRhc2hib2FyZCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3RyYXNoLWRhc2hib2FyZCcgfSk7XG5cblx0XHQvLyBcdTUzNjFcdTcyNDcxXHVGRjFBXHU2MDNCXHU2NTg3XHU0RUY2XHU2NTcwXG5cdFx0Y29uc3QgY2FyZEZpbGVzID0gZGFzaGJvYXJkLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1jYXJkJyB9KTtcblx0XHRjb25zdCBmaWxlc0ljb24gPSBjYXJkRmlsZXMuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWljb24nIH0pO1xuXHRcdHNldEljb24oZmlsZXNJY29uLCAnZmlsZXMnKTtcblx0XHRjYXJkRmlsZXMuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLXZhbHVlJywgdGV4dDogU3RyaW5nKHN0YXRzLnRvdGFsRmlsZXMpIH0pO1xuXHRcdGNhcmRGaWxlcy5jcmVhdGVEaXYoeyBjbHM6ICdkYXNoYm9hcmQtbGFiZWwnLCB0ZXh0OiB0aGlzLnBsdWdpbi50KCdmaWxlc0luVHJhc2gnKS5yZXBsYWNlKCd7Y291bnR9JywgJycpIH0pO1xuXG5cdFx0Ly8gXHU1MzYxXHU3MjQ3Mlx1RkYxQVx1NTM2MFx1NzUyOFx1N0E3QVx1OTVGNFxuXHRcdGNvbnN0IGNhcmRTaXplID0gZGFzaGJvYXJkLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1jYXJkJyB9KTtcblx0XHRjb25zdCBzaXplSWNvbiA9IGNhcmRTaXplLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1pY29uJyB9KTtcblx0XHRzZXRJY29uKHNpemVJY29uLCAnaGFyZC1kcml2ZScpO1xuXHRcdGNhcmRTaXplLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC12YWx1ZScsIHRleHQ6IGZvcm1hdEZpbGVTaXplKHN0YXRzLnRvdGFsU2l6ZSkgfSk7XG5cdFx0Y2FyZFNpemUuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWxhYmVsJywgdGV4dDogdGhpcy5wbHVnaW4udCgndG90YWxTaXplJykucmVwbGFjZSgne3NpemV9JywgJycpIH0pO1xuXG5cdFx0Ly8gXHU1MzYxXHU3MjQ3M1x1RkYxQVx1N0M3Qlx1NTc4Qlx1NTIwNlx1NUUwM1xuXHRcdGNvbnN0IGNhcmRUeXBlID0gZGFzaGJvYXJkLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1jYXJkJyB9KTtcblx0XHRjb25zdCB0eXBlSWNvbiA9IGNhcmRUeXBlLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1pY29uJyB9KTtcblx0XHRzZXRJY29uKHR5cGVJY29uLCAncGllLWNoYXJ0Jyk7XG5cdFx0Y29uc3QgdHlwZVBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXHRcdGZvciAoY29uc3QgW3R5cGUsIGNvdW50XSBvZiBPYmplY3QuZW50cmllcyhzdGF0cy5ieVR5cGUpKSB7XG5cdFx0XHR0eXBlUGFydHMucHVzaChgJHt0eXBlfTogJHtjb3VudH1gKTtcblx0XHR9XG5cdFx0Y2FyZFR5cGUuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLXZhbHVlJywgdGV4dDogdHlwZVBhcnRzLmpvaW4oJywgJykgfHwgJy0nIH0pO1xuXHRcdGNhcmRUeXBlLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1sYWJlbCcsIHRleHQ6IHRoaXMucGx1Z2luLnQoJ3R5cGVEaXN0cmlidXRpb24nKSB9KTtcblxuXHRcdC8vIFx1NTM2MVx1NzI0NzRcdUZGMUFcdTY3MkFcdTVGMTVcdTc1MjhcdTczODdcblx0XHRjb25zdCBjYXJkVW5yZWYgPSBkYXNoYm9hcmQuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWNhcmQnIH0pO1xuXHRcdGNvbnN0IHVucmVmSWNvbiA9IGNhcmRVbnJlZi5jcmVhdGVEaXYoeyBjbHM6ICdkYXNoYm9hcmQtaWNvbicgfSk7XG5cdFx0c2V0SWNvbih1bnJlZkljb24sICd1bmxpbmsnKTtcblx0XHRjYXJkVW5yZWYuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLXZhbHVlJywgdGV4dDogYCR7c3RhdHMudW5yZWZlcmVuY2VkUmF0ZX0lYCB9KTtcblx0XHRjYXJkVW5yZWYuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWxhYmVsJywgdGV4dDogdGhpcy5wbHVnaW4udCgndW5yZWZlcmVuY2VkUmF0ZScpIH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NjI3OVx1OTFDRlx1NjRDRFx1NEY1Q1x1NURFNVx1NTE3N1x1NjgwRlxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJCYXRjaFRvb2xiYXIoKSB7XG5cdFx0Y29uc3QgdG9vbGJhciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ2JhdGNoLXRvb2xiYXInIH0pO1xuXG5cdFx0Ly8gXHU1MTY4XHU5MDA5L1x1NTNDRFx1OTAwOVxuXHRcdGNvbnN0IHNlbGVjdEFsbEJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idG4nIH0pO1xuXHRcdHNldEljb24oc2VsZWN0QWxsQnRuLCAnY2hlY2stc3F1YXJlJyk7XG5cdFx0c2VsZWN0QWxsQnRuLmNyZWF0ZVNwYW4oeyB0ZXh0OiBgICR7dGhpcy5wbHVnaW4udCgnc2VsZWN0QWxsJyl9YCB9KTtcblx0XHRzZWxlY3RBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHRjb25zdCBhbGxTZWxlY3RlZCA9IHRoaXMudHJhc2hJdGVtcy5ldmVyeShpID0+IGkuc2VsZWN0ZWQpO1xuXHRcdFx0dGhpcy50cmFzaEl0ZW1zLmZvckVhY2goaSA9PiBpLnNlbGVjdGVkID0gIWFsbFNlbGVjdGVkKTtcblx0XHRcdHRoaXMucmVuZGVyVmlldygpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3Qgc2VsZWN0ZWRDb3VudCA9IHRoaXMudHJhc2hJdGVtcy5maWx0ZXIoaSA9PiBpLnNlbGVjdGVkKS5sZW5ndGg7XG5cdFx0dG9vbGJhci5jcmVhdGVTcGFuKHtcblx0XHRcdGNsczogJ3NlbGVjdGVkLWNvdW50Jyxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NlbGVjdGVkQ291bnQnLCB7IGNvdW50OiBzZWxlY3RlZENvdW50IH0pXG5cdFx0fSk7XG5cblx0XHQvLyBcdTYyNzlcdTkxQ0ZcdTYwNjJcdTU5MERcblx0XHRjb25zdCBiYXRjaFJlc3RvcmVCdG4gPSB0b29sYmFyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3Rvb2xiYXItYnRuIHN1Y2Nlc3MnIH0pO1xuXHRcdHNldEljb24oYmF0Y2hSZXN0b3JlQnRuLCAncm90YXRlLWNjdycpO1xuXHRcdGJhdGNoUmVzdG9yZUJ0bi5jcmVhdGVTcGFuKHsgdGV4dDogYCAke3RoaXMucGx1Z2luLnQoJ2JhdGNoUmVzdG9yZScpfWAgfSk7XG5cdFx0YmF0Y2hSZXN0b3JlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5iYXRjaFJlc3RvcmUoKSk7XG5cblx0XHQvLyBcdTYyNzlcdTkxQ0ZcdTUyMjBcdTk2NjRcblx0XHRjb25zdCBiYXRjaERlbGV0ZUJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idG4gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGJhdGNoRGVsZXRlQnRuLCAndHJhc2gtMicpO1xuXHRcdGJhdGNoRGVsZXRlQnRuLmNyZWF0ZVNwYW4oeyB0ZXh0OiBgICR7dGhpcy5wbHVnaW4udCgnYmF0Y2hEZWxldGUnKX1gIH0pO1xuXHRcdGJhdGNoRGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5iYXRjaERlbGV0ZSgpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTUzNTVcdTRFMkFcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTk4Nzlcblx0ICovXG5cdHJlbmRlclRyYXNoSXRlbShjb250YWluZXI6IEhUTUxFbGVtZW50LCBpdGVtOiBUcmFzaEl0ZW0pIHtcblx0XHRjb25zdCBpdGVtRWwgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBgdHJhc2gtaXRlbSAke2l0ZW0uc2VsZWN0ZWQgPyAnc2VsZWN0ZWQnIDogJyd9YCB9KTtcblxuXHRcdC8vIFx1NTkwRFx1OTAwOVx1Njg0NlxuXHRcdGNvbnN0IGNoZWNrYm94ID0gaXRlbUVsLmNyZWF0ZUVsKCdpbnB1dCcsIHtcblx0XHRcdHR5cGU6ICdjaGVja2JveCcsXG5cdFx0XHRjbHM6ICdpdGVtLWNoZWNrYm94J1xuXHRcdH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cdFx0Y2hlY2tib3guY2hlY2tlZCA9IGl0ZW0uc2VsZWN0ZWQ7XG5cdFx0Y2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuXHRcdFx0aXRlbS5zZWxlY3RlZCA9IGNoZWNrYm94LmNoZWNrZWQ7XG5cdFx0XHRpdGVtRWwudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJywgaXRlbS5zZWxlY3RlZCk7XG5cdFx0XHQvLyBcdTY2RjRcdTY1QjBcdTVERTVcdTUxNzdcdTY4MEZcdThCQTFcdTY1NzBcblx0XHRcdGNvbnN0IHRvb2xiYXIgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKCcuYmF0Y2gtdG9vbGJhciAuc2VsZWN0ZWQtY291bnQnKTtcblx0XHRcdGlmICh0b29sYmFyKSB7XG5cdFx0XHRcdGNvbnN0IGNvdW50ID0gdGhpcy50cmFzaEl0ZW1zLmZpbHRlcihpID0+IGkuc2VsZWN0ZWQpLmxlbmd0aDtcblx0XHRcdFx0dG9vbGJhci50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnQoJ3NlbGVjdGVkQ291bnQnLCB7IGNvdW50IH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU3RjI5XHU3NTY1XHU1NkZFXG5cdFx0Y29uc3QgdGh1bWJFbCA9IGl0ZW1FbC5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLXRodW1ibmFpbCcgfSk7XG5cdFx0dGhpcy5yZW5kZXJJdGVtVGh1bWJuYWlsKHRodW1iRWwsIGl0ZW0pO1xuXG5cdFx0Ly8gXHU2NTg3XHU0RUY2XHU0RkUxXHU2MDZGXG5cdFx0Y29uc3QgaW5mbyA9IGl0ZW1FbC5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLWluZm8nIH0pO1xuXHRcdGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1uYW1lJywgdGV4dDogaXRlbS5uYW1lIH0pO1xuXHRcdGNvbnN0IHR5cGVCYWRnZSA9IGluZm8uY3JlYXRlU3Bhbih7XG5cdFx0XHRjbHM6ICdpdGVtLXR5cGUtYmFkZ2UnLFxuXHRcdFx0dGV4dDogdGhpcy5nZXRUeXBlTGFiZWwoaXRlbS5uYW1lKVxuXHRcdH0pO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4Jztcblx0XHR0eXBlQmFkZ2Uuc3R5bGUuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS53aWR0aCA9ICdmaXQtY29udGVudCc7XG5cdFx0dHlwZUJhZGdlLnN0eWxlLnBhZGRpbmcgPSAnMnB4IDhweCc7XG5cdFx0dHlwZUJhZGdlLnN0eWxlLm1hcmdpblRvcCA9ICc0cHgnO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnOTk5cHgnO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS5mb250U2l6ZSA9ICcwLjc1ZW0nO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS5mb250V2VpZ2h0ID0gJzYwMCc7XG5cdFx0dHlwZUJhZGdlLnN0eWxlLmxldHRlclNwYWNpbmcgPSAnMC4wNGVtJztcblx0XHR0eXBlQmFkZ2Uuc3R5bGUuYm9yZGVyID0gJzFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlciknO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LW11dGVkKSc7XG5cdFx0dHlwZUJhZGdlLnN0eWxlLmJhY2tncm91bmQgPSAndmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpJztcblxuXHRcdGlmIChpdGVtLm9yaWdpbmFsUGF0aCkge1xuXHRcdFx0aW5mby5jcmVhdGVEaXYoe1xuXHRcdFx0XHRjbHM6ICdpdGVtLW9yaWdpbmFsLXBhdGgnLFxuXHRcdFx0XHR0ZXh0OiBgJHt0aGlzLnBsdWdpbi50KCdvcmlnaW5hbFBhdGgnKX06ICR7aXRlbS5vcmlnaW5hbFBhdGh9YFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWV0YSA9IGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1tZXRhJyB9KTtcblx0XHRtZXRhLmNyZWF0ZVNwYW4oeyBjbHM6ICdpdGVtLXNpemUnLCB0ZXh0OiBmb3JtYXRGaWxlU2l6ZShpdGVtLnNpemUpIH0pO1xuXHRcdG1ldGEuY3JlYXRlU3Bhbih7XG5cdFx0XHRjbHM6ICdpdGVtLWRhdGUnLFxuXHRcdFx0dGV4dDogYCR7dGhpcy5wbHVnaW4udCgnZGVsZXRlZFRpbWUnKX06ICR7bmV3IERhdGUoaXRlbS5tb2RpZmllZCkudG9Mb2NhbGVTdHJpbmcoKX1gXG5cdFx0fSk7XG5cblx0XHQvLyBcdTVGMTVcdTc1MjhcdTZCMjFcdTY1NzBcdTVGQkRcdTdBRTBcblx0XHRjb25zdCByZWZCYWRnZSA9IGluZm8uY3JlYXRlU3Bhbih7XG5cdFx0XHRjbHM6IGByZWYtYmFkZ2UgJHtpdGVtLnJlZmVyZW5jZUNvdW50ID4gMCA/ICdyZWYtYWN0aXZlJyA6ICdyZWYtemVybyd9YCxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3JlZmVyZW5jZWRCeScsIHsgY291bnQ6IGl0ZW0ucmVmZXJlbmNlQ291bnQgfSlcblx0XHR9KTtcblxuXHRcdC8vIFx1NjRDRFx1NEY1Q1x1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IGFjdGlvbnMgPSBpdGVtRWwuY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1hY3Rpb25zJyB9KTtcblxuXHRcdGNvbnN0IHJlc3RvcmVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2l0ZW0tYnV0dG9uIHN1Y2Nlc3MnIH0pO1xuXHRcdHNldEljb24ocmVzdG9yZUJ0biwgJ3JvdGF0ZS1jY3cnKTtcblx0XHRyZXN0b3JlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5yZXN0b3JlRmlsZShpdGVtKSk7XG5cdFx0cmVzdG9yZUJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ3Jlc3RvcmVUb29sdGlwJyk7XG5cblx0XHRjb25zdCBkZWxldGVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2l0ZW0tYnV0dG9uIGRhbmdlcicgfSk7XG5cdFx0c2V0SWNvbihkZWxldGVCdG4sICd0cmFzaC0yJyk7XG5cdFx0ZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jb25maXJtRGVsZXRlKGl0ZW0pKTtcblx0XHRkZWxldGVCdG4udGl0bGUgPSB0aGlzLnBsdWdpbi50KCdwZXJtYW5lbnREZWxldGVUb29sdGlwJyk7XG5cblx0XHQvLyBcdTUzRjNcdTk1MkVcdTgzRENcdTUzNTVcblx0XHRpdGVtRWwuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCAoZSkgPT4ge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dGhpcy5zaG93Q29udGV4dE1lbnUoZSBhcyBNb3VzZUV2ZW50LCBpdGVtKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTY3NjFcdTc2RUVcdTdGMjlcdTc1NjVcdTU2RkVcblx0ICovXG5cdHByaXZhdGUgcmVuZGVySXRlbVRodW1ibmFpbChjb250YWluZXI6IEhUTUxFbGVtZW50LCBpdGVtOiBUcmFzaEl0ZW0pIHtcblx0XHRjb25zdCBtZWRpYVR5cGUgPSBnZXRNZWRpYVR5cGUoaXRlbS5uYW1lKTtcblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICdpbWFnZScpIHtcblx0XHRcdGNvbnN0IHNyYyA9IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChpdGVtLmZpbGUpO1xuXHRcdFx0Y29uc3QgaW1nID0gY29udGFpbmVyLmNyZWF0ZUVsKCdpbWcnLCB7XG5cdFx0XHRcdGF0dHI6IHsgc3JjLCBhbHQ6IGl0ZW0ubmFtZSB9XG5cdFx0XHR9KTtcblx0XHRcdGltZy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdFx0Y29udGFpbmVyLmVtcHR5KCk7XG5cdFx0XHRcdGNvbnN0IGljb24gPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAndGh1bWItaWNvbicgfSk7XG5cdFx0XHRcdHNldEljb24oaWNvbiwgJ2ltYWdlJyk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgaWNvbk5hbWUgPSBtZWRpYVR5cGUgPT09ICd2aWRlbycgPyAndmlkZW8nIDpcblx0XHRcdFx0bWVkaWFUeXBlID09PSAnYXVkaW8nID8gJ211c2ljJyA6XG5cdFx0XHRcdG1lZGlhVHlwZSA9PT0gJ2RvY3VtZW50JyA/ICdmaWxlLXRleHQnIDogJ2ZpbGUnO1xuXHRcdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsIGljb25OYW1lLCB0aGlzLmdldFR5cGVMYWJlbChpdGVtLm5hbWUpKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclRodW1ibmFpbEZhbGxiYWNrKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGljb25OYW1lOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpIHtcblx0XHRjb250YWluZXIuZW1wdHkoKTtcblxuXHRcdGNvbnN0IGZhbGxiYWNrID0gY29udGFpbmVyLmNyZWF0ZURpdigpO1xuXHRcdGZhbGxiYWNrLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRmYWxsYmFjay5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcblx0XHRmYWxsYmFjay5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG5cdFx0ZmFsbGJhY2suc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcblx0XHRmYWxsYmFjay5zdHlsZS5nYXAgPSAnNnB4Jztcblx0XHRmYWxsYmFjay5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LW11dGVkKSc7XG5cblx0XHRjb25zdCBpY29uID0gZmFsbGJhY2suY3JlYXRlRGl2KHsgY2xzOiAndGh1bWItaWNvbicgfSk7XG5cdFx0c2V0SWNvbihpY29uLCBpY29uTmFtZSk7XG5cblx0XHRjb25zdCB0ZXh0ID0gZmFsbGJhY2suY3JlYXRlRGl2KHsgdGV4dDogbGFiZWwgfSk7XG5cdFx0dGV4dC5zdHlsZS5mb250U2l6ZSA9ICcwLjcyZW0nO1xuXHRcdHRleHQuc3R5bGUuZm9udFdlaWdodCA9ICc2MDAnO1xuXHRcdHRleHQuc3R5bGUubGV0dGVyU3BhY2luZyA9ICcwLjA0ZW0nO1xuXHRcdHRleHQuc3R5bGUudGV4dFRyYW5zZm9ybSA9ICd1cHBlcmNhc2UnO1xuXHR9XG5cblx0cHJpdmF0ZSBnZXRUeXBlTGFiZWwoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0Y29uc3QgbWVkaWFUeXBlID0gZ2V0TWVkaWFUeXBlKGZpbGVOYW1lKTtcblx0XHRpZiAobWVkaWFUeXBlID09PSAnZG9jdW1lbnQnKSB7XG5cdFx0XHRyZXR1cm4gZ2V0RG9jdW1lbnREaXNwbGF5TGFiZWwoZmlsZU5hbWUpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGRvdCA9IGZpbGVOYW1lLmxhc3RJbmRleE9mKCcuJyk7XG5cdFx0aWYgKGRvdCAhPT0gLTEgJiYgZG90IDwgZmlsZU5hbWUubGVuZ3RoIC0gMSkge1xuXHRcdFx0cmV0dXJuIGZpbGVOYW1lLnNsaWNlKGRvdCArIDEpLnRvVXBwZXJDYXNlKCk7XG5cdFx0fVxuXG5cdFx0aWYgKG1lZGlhVHlwZSkge1xuXHRcdFx0cmV0dXJuIG1lZGlhVHlwZS50b1VwcGVyQ2FzZSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiAnRklMRSc7XG5cdH1cblxuXHQvKipcblx0ICogXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGXHVGRjFBXHU4MUVBXHU1MkE4XHU2N0U1XHU2MjdFXHU1QjY0XHU3QUNCXHU2NTg3XHU0RUY2XHU1RTc2XHU5MDAxXHU1MTY1XHU5Njk0XHU3OUJCXG5cdCAqL1xuXHRhc3luYyBydW5TYWZlU2NhbigpIHtcblx0XHRjb25zdCBzZXR0aW5ncyA9IHRoaXMucGx1Z2luLnNldHRpbmdzO1xuXHRcdGlmICghc2V0dGluZ3Muc2FmZVNjYW5FbmFibGVkKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuRGVzYycpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuXHRcdGNvbnN0IGRheU1zID0gMjQgKiA2MCAqIDYwICogMTAwMDtcblx0XHRjb25zdCBjdXRvZmZUaW1lID0gbm93IC0gKHNldHRpbmdzLnNhZmVTY2FuVW5yZWZEYXlzICogZGF5TXMpO1xuXHRcdGNvbnN0IG1pblNpemUgPSBzZXR0aW5ncy5zYWZlU2Nhbk1pblNpemU7XG5cblx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuU3RhcnRlZCcpKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByZWZlcmVuY2VkSW1hZ2VzID0gYXdhaXQgdGhpcy5wbHVnaW4uZ2V0UmVmZXJlbmNlZEltYWdlcygpO1xuXHRcdFx0Y29uc3QgYWxsTWVkaWEgPSB0aGlzLnBsdWdpbi5maWxlSW5kZXguaXNJbml0aWFsaXplZFxuXHRcdFx0XHQ/IHRoaXMucGx1Z2luLmZpbGVJbmRleC5nZXRGaWxlcygpXG5cdFx0XHRcdFx0Lm1hcChlID0+IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChlLnBhdGgpKVxuXHRcdFx0XHRcdC5maWx0ZXIoKGYpOiBmIGlzIFRGaWxlID0+IGYgaW5zdGFuY2VvZiBURmlsZSlcblx0XHRcdFx0OiBhd2FpdCB0aGlzLnBsdWdpbi5nZXRBbGxJbWFnZUZpbGVzKCk7XG5cblx0XHRcdGNvbnN0IHRyYXNoUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh0aGlzLnBsdWdpbi5zZXR0aW5ncy50cmFzaEZvbGRlcikgfHwgJyc7XG5cdFx0XHRjb25zdCBjYW5kaWRhdGVzOiBURmlsZVtdID0gW107XG5cblx0XHRcdGZvciAoY29uc3QgZmlsZSBvZiBhbGxNZWRpYSkge1xuXHRcdFx0XHQvLyBcdTYzOTJcdTk2NjRcdTVERjJcdTU3MjhcdTk2OTRcdTc5QkJcdTUzM0FcdTc2ODRcdTY1ODdcdTRFRjZcblx0XHRcdFx0aWYgKHRyYXNoUGF0aCAmJiBmaWxlLnBhdGguc3RhcnRzV2l0aCh0cmFzaFBhdGggKyAnLycpKSBjb250aW51ZTtcblxuXHRcdFx0XHRjb25zdCBub3JtYWxpemVkUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChmaWxlLnBhdGgpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdGNvbnN0IG5vcm1hbGl6ZWROYW1lID0gZmlsZS5uYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdGNvbnN0IGlzUmVmZXJlbmNlZCA9IHJlZmVyZW5jZWRJbWFnZXMuaGFzKG5vcm1hbGl6ZWRQYXRoKSB8fFxuXHRcdFx0XHRcdHJlZmVyZW5jZWRJbWFnZXMuaGFzKG5vcm1hbGl6ZWROYW1lKTtcblxuXHRcdFx0XHRpZiAoIWlzUmVmZXJlbmNlZCAmJlxuXHRcdFx0XHRcdGZpbGUuc3RhdC5tdGltZSA8IGN1dG9mZlRpbWUgJiZcblx0XHRcdFx0XHRmaWxlLnN0YXQuc2l6ZSA+PSBtaW5TaXplKSB7XG5cdFx0XHRcdFx0Y2FuZGlkYXRlcy5wdXNoKGZpbGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjYW5kaWRhdGVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuTm9SZXN1bHRzJykpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIFx1Nzg2RVx1OEJBNFx1NUJGOVx1OEJERFx1Njg0NlxuXHRcdFx0Y29uc3QgY29uZmlybWVkID0gYXdhaXQgdGhpcy5zaG93Q29uZmlybU1vZGFsKFxuXHRcdFx0XHR0aGlzLnBsdWdpbi50KCdzYWZlU2NhbkNvbmZpcm0nLCB7XG5cdFx0XHRcdFx0Y291bnQ6IGNhbmRpZGF0ZXMubGVuZ3RoLFxuXHRcdFx0XHRcdGRheXM6IHNldHRpbmdzLnNhZmVTY2FuVW5yZWZEYXlzLFxuXHRcdFx0XHRcdHNpemU6IGZvcm1hdEZpbGVTaXplKG1pblNpemUpXG5cdFx0XHRcdH0pXG5cdFx0XHQpO1xuXG5cdFx0XHRpZiAoIWNvbmZpcm1lZCkgcmV0dXJuO1xuXG5cdFx0XHRsZXQgbW92ZWQgPSAwO1xuXHRcdFx0Zm9yIChjb25zdCBmaWxlIG9mIGNhbmRpZGF0ZXMpIHtcblx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5wbHVnaW4uc2FmZURlbGV0ZUZpbGUoZmlsZSk7XG5cdFx0XHRcdGlmIChyZXN1bHQpIG1vdmVkKys7XG5cdFx0XHR9XG5cblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnc2FmZVNjYW5Db21wbGV0ZScsIHsgY291bnQ6IG1vdmVkIH0pKTtcblx0XHRcdGF3YWl0IHRoaXMubG9hZFRyYXNoSXRlbXMoKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnc2FmZVNjYW5GYWlsZWQnKSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjI3OVx1OTFDRlx1NjA2Mlx1NTkwRFx1OTAwOVx1NEUyRFx1NjU4N1x1NEVGNlxuXHQgKi9cblx0YXN5bmMgYmF0Y2hSZXN0b3JlKCkge1xuXHRcdGNvbnN0IHNlbGVjdGVkID0gdGhpcy50cmFzaEl0ZW1zLmZpbHRlcihpID0+IGkuc2VsZWN0ZWQpO1xuXHRcdGlmIChzZWxlY3RlZC5sZW5ndGggPT09IDApIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnbm9JdGVtc1NlbGVjdGVkJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IHRoaXMuc2hvd0NvbmZpcm1Nb2RhbChcblx0XHRcdHRoaXMucGx1Z2luLnQoJ2NvbmZpcm1CYXRjaFJlc3RvcmUnLCB7IGNvdW50OiBzZWxlY3RlZC5sZW5ndGggfSlcblx0XHQpO1xuXHRcdGlmICghY29uZmlybWVkKSByZXR1cm47XG5cblx0XHRsZXQgcmVzdG9yZWQgPSAwO1xuXHRcdGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3RlZCkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bGV0IHRhcmdldFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoaXRlbS5vcmlnaW5hbFBhdGggfHwgJycpO1xuXHRcdFx0XHRpZiAoIXRhcmdldFBhdGgpIHtcblx0XHRcdFx0XHRjb25zdCBzZXBhcmF0b3JJbmRleCA9IGl0ZW0ucmF3TmFtZS5pbmRleE9mKCdfXycpO1xuXHRcdFx0XHRcdGlmIChzZXBhcmF0b3JJbmRleCAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdHRhcmdldFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoXG5cdFx0XHRcdFx0XHRcdHNhZmVEZWNvZGVVUklDb21wb25lbnQoaXRlbS5yYXdOYW1lLnN1YnN0cmluZyhzZXBhcmF0b3JJbmRleCArIDIpKVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGFyZ2V0UGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChpdGVtLnJhd05hbWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0YXJnZXRQYXRoKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5wbHVnaW4ucmVzdG9yZUZpbGUoaXRlbS5maWxlLCB0YXJnZXRQYXRoKTtcblx0XHRcdFx0XHRpZiAocmVzdWx0KSByZXN0b3JlZCsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYFx1NjA2Mlx1NTkwRFx1NjU4N1x1NEVGNlx1NTkzMVx1OEQyNTogJHtpdGVtLm5hbWV9YCwgZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnYmF0Y2hSZXN0b3JlQ29tcGxldGUnLCB7IGNvdW50OiByZXN0b3JlZCB9KSk7XG5cdFx0YXdhaXQgdGhpcy5sb2FkVHJhc2hJdGVtcygpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjI3OVx1OTFDRlx1NTIyMFx1OTY2NFx1OTAwOVx1NEUyRFx1NjU4N1x1NEVGNlxuXHQgKi9cblx0YXN5bmMgYmF0Y2hEZWxldGUoKSB7XG5cdFx0Y29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnRyYXNoSXRlbXMuZmlsdGVyKGkgPT4gaS5zZWxlY3RlZCk7XG5cdFx0aWYgKHNlbGVjdGVkLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdub0l0ZW1zU2VsZWN0ZWQnKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgY29uZmlybWVkID0gYXdhaXQgdGhpcy5zaG93Q29uZmlybU1vZGFsKFxuXHRcdFx0dGhpcy5wbHVnaW4udCgnY29uZmlybUNsZWFyVHJhc2gnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKHNlbGVjdGVkLmxlbmd0aCkpXG5cdFx0KTtcblx0XHRpZiAoIWNvbmZpcm1lZCkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdFx0c2VsZWN0ZWQubWFwKGl0ZW0gPT5cblx0XHRcdFx0dGhpcy5wbHVnaW4uYXBwLnZhdWx0LmRlbGV0ZShpdGVtLmZpbGUpLnRoZW4oKCkgPT4gdHJ1ZSkuY2F0Y2goKCkgPT4gZmFsc2UpXG5cdFx0XHQpXG5cdFx0KTtcblxuXHRcdGNvbnN0IGRlbGV0ZWQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIpLmxlbmd0aDtcblx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2JhdGNoRGVsZXRlQ29tcGxldGUnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKGRlbGV0ZWQpKSk7XG5cdFx0YXdhaXQgdGhpcy5sb2FkVHJhc2hJdGVtcygpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjYzRVx1NzkzQVx1NTNGM1x1OTUyRVx1ODNEQ1x1NTM1NVxuXHQgKi9cblx0c2hvd0NvbnRleHRNZW51KGV2ZW50OiBNb3VzZUV2ZW50LCB0cmFzaEl0ZW06IFRyYXNoSXRlbSkge1xuXHRcdGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG5cdFx0bWVudS5hZGRJdGVtKChtZW51SXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdG1lbnVJdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ3Jlc3RvcmUnKSlcblx0XHRcdFx0LnNldEljb24oJ3JvdGF0ZS1jY3cnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB0aGlzLnJlc3RvcmVGaWxlKHRyYXNoSXRlbSkpO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChtZW51SXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdG1lbnVJdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ3Blcm1hbmVudERlbGV0ZScpKVxuXHRcdFx0XHQuc2V0SWNvbigndHJhc2gtMicpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHRoaXMuY29uZmlybURlbGV0ZSh0cmFzaEl0ZW0pKTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cblx0XHRtZW51LmFkZEl0ZW0oKG1lbnVJdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0bWVudUl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnY29waWVkRmlsZU5hbWUnKSlcblx0XHRcdFx0LnNldEljb24oJ2NvcHknKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0cmFzaEl0ZW0ubmFtZSkudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2ZpbGVOYW1lQ29waWVkJykpO1xuXHRcdFx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChtZW51SXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdG1lbnVJdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ2NvcGllZE9yaWdpbmFsUGF0aCcpKVxuXHRcdFx0XHQuc2V0SWNvbignbGluaycpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRpZiAodHJhc2hJdGVtLm9yaWdpbmFsUGF0aCkge1xuXHRcdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0cmFzaEl0ZW0ub3JpZ2luYWxQYXRoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdvcmlnaW5hbFBhdGhDb3BpZWQnKSk7XG5cdFx0XHRcdFx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdlcnJvcicpKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRtZW51LnNob3dBdFBvc2l0aW9uKHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSB9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYwNjJcdTU5MERcdTY1ODdcdTRFRjZcblx0ICovXG5cdGFzeW5jIHJlc3RvcmVGaWxlKGl0ZW06IFRyYXNoSXRlbSkge1xuXHRcdHRyeSB7XG5cdFx0XHRsZXQgdGFyZ2V0UGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChpdGVtLm9yaWdpbmFsUGF0aCB8fCAnJyk7XG5cdFx0XHRpZiAoIXRhcmdldFBhdGgpIHtcblx0XHRcdFx0Y29uc3Qgc2VwYXJhdG9ySW5kZXggPSBpdGVtLnJhd05hbWUuaW5kZXhPZignX18nKTtcblx0XHRcdFx0aWYgKHNlcGFyYXRvckluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdHRhcmdldFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoXG5cdFx0XHRcdFx0XHRzYWZlRGVjb2RlVVJJQ29tcG9uZW50KGl0ZW0ucmF3TmFtZS5zdWJzdHJpbmcoc2VwYXJhdG9ySW5kZXggKyAyKSlcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRhcmdldFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoaXRlbS5yYXdOYW1lKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRhcmdldFBhdGgpIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdyZXN0b3JlRmFpbGVkJykucmVwbGFjZSgne21lc3NhZ2V9JywgdGhpcy5wbHVnaW4udCgnZXJyb3InKSkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHJlc3RvcmVkID0gYXdhaXQgdGhpcy5wbHVnaW4ucmVzdG9yZUZpbGUoaXRlbS5maWxlLCB0YXJnZXRQYXRoKTtcblx0XHRcdGlmICghcmVzdG9yZWQpIHJldHVybjtcblxuXHRcdFx0dGhpcy50cmFzaEl0ZW1zID0gdGhpcy50cmFzaEl0ZW1zLmZpbHRlcihpID0+IGkuZmlsZS5wYXRoICE9PSBpdGVtLmZpbGUucGF0aCk7XG5cdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU2MDYyXHU1OTBEXHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgncmVzdG9yZUZhaWxlZCcpLnJlcGxhY2UoJ3ttZXNzYWdlfScsIChlcnJvciBhcyBFcnJvcikubWVzc2FnZSkpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTY2M0VcdTc5M0FcdTU2RkRcdTk2NDVcdTUzMTZcdTc4NkVcdThCQTRcdTVCRjlcdThCRERcdTY4NDZcblx0ICovXG5cdHByaXZhdGUgc2hvd0NvbmZpcm1Nb2RhbChtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGNvbnN0IG1vZGFsID0gbmV3IE1vZGFsKHRoaXMucGx1Z2luLmFwcCk7XG5cdFx0XHRsZXQgcmVzb2x2ZWQgPSBmYWxzZTtcblxuXHRcdFx0bW9kYWwub25DbG9zZSA9ICgpID0+IHtcblx0XHRcdFx0aWYgKCFyZXNvbHZlZCkge1xuXHRcdFx0XHRcdHJlc29sdmVkID0gdHJ1ZTtcblx0XHRcdFx0XHRyZXNvbHZlKGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0bW9kYWwuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ2NvbmZpcm0tbW9kYWwtY29udGVudCcgfSwgKGVsKSA9PiB7XG5cdFx0XHRcdGVsLmNyZWF0ZURpdih7IHRleHQ6IG1lc3NhZ2UsIGNsczogJ2NvbmZpcm0tbW9kYWwtbWVzc2FnZScgfSk7XG5cdFx0XHRcdGVsLmNyZWF0ZURpdih7IGNsczogJ2NvbmZpcm0tbW9kYWwtYnV0dG9ucycgfSwgKGJ1dHRvbnNFbCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGNhbmNlbEJ0biA9IG5ldyBCdXR0b25Db21wb25lbnQoYnV0dG9uc0VsKTtcblx0XHRcdFx0XHRjYW5jZWxCdG4uc2V0QnV0dG9uVGV4dCh0aGlzLnBsdWdpbi50KCdjYW5jZWwnKSk7XG5cdFx0XHRcdFx0Y2FuY2VsQnRuLm9uQ2xpY2soKCkgPT4ge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0bW9kYWwuY2xvc2UoKTtcblx0XHRcdFx0XHRcdHJlc29sdmUoZmFsc2UpO1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0Y29uc3QgY29uZmlybUJ0biA9IG5ldyBCdXR0b25Db21wb25lbnQoYnV0dG9uc0VsKTtcblx0XHRcdFx0XHRjb25maXJtQnRuLnNldEJ1dHRvblRleHQodGhpcy5wbHVnaW4udCgnY29uZmlybScpKTtcblx0XHRcdFx0XHRjb25maXJtQnRuLnNldEN0YSgpO1xuXHRcdFx0XHRcdGNvbmZpcm1CdG4ub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRtb2RhbC5jbG9zZSgpO1xuXHRcdFx0XHRcdFx0cmVzb2x2ZSh0cnVlKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0bW9kYWwub3BlbigpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1Nzg2RVx1OEJBNFx1NTIyMFx1OTY2NFx1NTM1NVx1NEUyQVx1NjU4N1x1NEVGNlxuXHQgKi9cblx0YXN5bmMgY29uZmlybURlbGV0ZShpdGVtOiBUcmFzaEl0ZW0pIHtcblx0XHRjb25zdCBjb25maXJtZWQgPSBhd2FpdCB0aGlzLnNob3dDb25maXJtTW9kYWwoXG5cdFx0XHR0aGlzLnBsdWdpbi50KCdjb25maXJtRGVsZXRlRmlsZScpLnJlcGxhY2UoJ3tuYW1lfScsIGl0ZW0ubmFtZSlcblx0XHQpO1xuXG5cdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmRlbGV0ZShpdGVtLmZpbGUpO1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2ZpbGVEZWxldGVkJykucmVwbGFjZSgne25hbWV9JywgaXRlbS5uYW1lKSk7XG5cdFx0XHRcdHRoaXMudHJhc2hJdGVtcyA9IHRoaXMudHJhc2hJdGVtcy5maWx0ZXIoaSA9PiBpLmZpbGUucGF0aCAhPT0gaXRlbS5maWxlLnBhdGgpO1xuXHRcdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTIyMFx1OTY2NFx1NjU4N1x1NEVGNlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZGVsZXRlRmFpbGVkJykpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTc4NkVcdThCQTRcdTZFMDVcdTdBN0FcdTYyNDBcdTY3MDlcdTY1ODdcdTRFRjZcblx0ICovXG5cdGFzeW5jIGNvbmZpcm1DbGVhckFsbCgpIHtcblx0XHRpZiAodGhpcy50cmFzaEl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCd0cmFzaEVtcHR5JykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IHRoaXMuc2hvd0NvbmZpcm1Nb2RhbChcblx0XHRcdHRoaXMucGx1Z2luLnQoJ2NvbmZpcm1DbGVhclRyYXNoJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyh0aGlzLnRyYXNoSXRlbXMubGVuZ3RoKSlcblx0XHQpO1xuXG5cdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdFx0XHR0aGlzLnRyYXNoSXRlbXMubWFwKGl0ZW0gPT5cblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5hcHAudmF1bHQuZGVsZXRlKGl0ZW0uZmlsZSkudGhlbigoKSA9PiB0cnVlKS5jYXRjaCgoKSA9PiBmYWxzZSlcblx0XHRcdFx0KVxuXHRcdFx0KTtcblxuXHRcdFx0Y29uc3QgZGVsZXRlZCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gcikubGVuZ3RoO1xuXHRcdFx0Y29uc3QgZXJyb3JzID0gcmVzdWx0cy5maWx0ZXIociA9PiAhcikubGVuZ3RoO1xuXG5cdFx0XHRpZiAoZGVsZXRlZCA+IDApIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdiYXRjaERlbGV0ZUNvbXBsZXRlJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhkZWxldGVkKSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGVycm9ycyA+IDApIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdiYXRjaERlbGV0ZUNvbXBsZXRlJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhlcnJvcnMpKSArICcgKCcgKyB0aGlzLnBsdWdpbi50KCdlcnJvcicpICsgJyknKTtcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgdGhpcy5sb2FkVHJhc2hJdGVtcygpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTgzQjdcdTUzRDZcdTY1ODdcdTRFRjZcdTU2RkVcdTY4MDdcblx0ICovXG5cdHByaXZhdGUgZ2V0RmlsZUljb24oZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdGNvbnN0IG1lZGlhVHlwZSA9IGdldE1lZGlhVHlwZShgZmlsZW5hbWUuJHtleHR9YCk7XG5cdFx0c3dpdGNoIChtZWRpYVR5cGUpIHtcblx0XHRcdGNhc2UgJ2ltYWdlJzogcmV0dXJuICdpbWFnZSc7XG5cdFx0XHRjYXNlICd2aWRlbyc6IHJldHVybiAndmlkZW8nO1xuXHRcdFx0Y2FzZSAnYXVkaW8nOiByZXR1cm4gJ211c2ljJztcblx0XHRcdGNhc2UgJ2RvY3VtZW50JzogcmV0dXJuICdmaWxlLXRleHQnO1xuXHRcdFx0ZGVmYXVsdDogcmV0dXJuICdmaWxlJztcblx0XHR9XG5cdH1cbn1cbiIsICIvKipcbiAqIFx1NUI4OVx1NTE2OFx1NURFNVx1NTE3N1x1NTFGRFx1NjU3MFxuICovXG5cbi8qKlxuICogXHU2ODIxXHU5QThDXHU4REVGXHU1Rjg0XHU2NjJGXHU1NDI2XHU1Qjg5XHU1MTY4XHVGRjA4XHU2NUUwXHU5MDREXHU1Mzg2XHU1RThGXHU1MjE3XHUzMDAxXHU5NzVFXHU3RUREXHU1QkY5XHU4REVGXHU1Rjg0XHVGRjA5XG4gKiBcdTUxNDhcdTUwNUEgVVJMIFx1ODlFM1x1NzgwMVx1NEVFNVx1OTYzMiAlMmUlMmUgXHU3QjQ5XHU3RjE2XHU3ODAxXHU3RUQ1XHU4RkM3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1BhdGhTYWZlKGZpbGVQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcblx0aWYgKCFmaWxlUGF0aCB8fCAhZmlsZVBhdGgudHJpbSgpKSByZXR1cm4gZmFsc2U7XG5cdHRyeSB7XG5cdFx0Y29uc3QgZGVjb2RlZCA9IGRlY29kZVVSSUNvbXBvbmVudChmaWxlUGF0aCk7XG5cdFx0Y29uc3Qgbm9ybWFsaXplZCA9IGRlY29kZWQucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuXHRcdGlmIChub3JtYWxpemVkLnN0YXJ0c1dpdGgoJy8nKSB8fCAvXlthLXpBLVpdOi8udGVzdChub3JtYWxpemVkKSkgcmV0dXJuIGZhbHNlO1xuXHRcdGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCdcXDAnKSkgcmV0dXJuIGZhbHNlO1xuXHRcdGNvbnN0IHBhcnRzID0gbm9ybWFsaXplZC5zcGxpdCgnLycpO1xuXHRcdHJldHVybiBwYXJ0cy5ldmVyeShwYXJ0ID0+IHBhcnQgIT09ICcuLicgJiYgcGFydCAhPT0gJy4nKTtcblx0fSBjYXRjaCB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbi8qKlxuICogXHU2ODIxXHU5QThDIFVSTCBcdTUzNEZcdThCQUVcdTY2MkZcdTU0MjZcdTVCODlcdTUxNjhcbiAqIFx1NTE0MVx1OEJCOCBodHRwL2h0dHBzIFx1NTQ4Q1x1NjVFMFx1NTM0Rlx1OEJBRVx1NTI0RFx1N0YwMFx1NzY4NFx1NTE4NVx1OTBFOFx1OERFRlx1NUY4NFx1RkYwQ1x1NjJFNlx1NjIyQSBqYXZhc2NyaXB0Oi9kYXRhOi92YnNjcmlwdDogXHU3QjQ5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NhZmVVcmwodXJsOiBzdHJpbmcpOiBib29sZWFuIHtcblx0aWYgKCF1cmwgfHwgIXVybC50cmltKCkpIHJldHVybiBmYWxzZTtcblx0Y29uc3QgdHJpbW1lZCA9IHVybC50cmltKCkudG9Mb3dlckNhc2UoKTtcblx0aWYgKHRyaW1tZWQuc3RhcnRzV2l0aCgnaHR0cDovLycpIHx8IHRyaW1tZWQuc3RhcnRzV2l0aCgnaHR0cHM6Ly8nKSkgcmV0dXJuIHRydWU7XG5cdGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoJ2phdmFzY3JpcHQ6JykgfHwgdHJpbW1lZC5zdGFydHNXaXRoKCdkYXRhOicpIHx8IHRyaW1tZWQuc3RhcnRzV2l0aCgndmJzY3JpcHQ6JykpIHJldHVybiBmYWxzZTtcblx0cmV0dXJuICF0cmltbWVkLmluY2x1ZGVzKCc6Jyk7XG59XG5cbi8qKlxuICogXHU4RjZDXHU0RTQ5XHU1QjU3XHU3QjI2XHU0RTMyXHU3NTI4XHU0RThFIEhUTUwgXHU1QzVFXHU2MDI3XHVGRjBDXHU5NjMyXHU2QjYyXHU1QzVFXHU2MDI3XHU2Q0U4XHU1MTY1XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVIdG1sQXR0cihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG5cdGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykgcmV0dXJuICcnO1xuXHRyZXR1cm4gc3RyXG5cdFx0LnJlcGxhY2UoLyYvZywgJyZhbXA7Jylcblx0XHQucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG5cdFx0LnJlcGxhY2UoLycvZywgJyYjMzk7Jylcblx0XHQucmVwbGFjZSgvPC9nLCAnJmx0OycpXG5cdFx0LnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbn1cbiIsICIvKipcbiAqIFx1OTFDRFx1NTkwRFx1NjU4N1x1NEVGNlx1NjhDMFx1NkQ0Qlx1ODlDNlx1NTZGRVxuICogXHU0RjdGXHU3NTI4XHU2MTFGXHU3N0U1XHU1NEM4XHU1RTBDXHU1QjlFXHU3M0IwXHU1MENGXHU3RDIwXHU3RUE3XHU1NkZFXHU3MjQ3XHU1M0JCXHU5MUNEXG4gKi9cblxuaW1wb3J0IHsgVEZpbGUsIEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBzZXRJY29uLCBOb3RpY2UgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgSW1hZ2VNYW5hZ2VyUGx1Z2luIGZyb20gJy4uL21haW4nO1xuaW1wb3J0IHsgZm9ybWF0RmlsZVNpemUgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHsgZ2V0TWVkaWFUeXBlIH0gZnJvbSAnLi4vdXRpbHMvbWVkaWFUeXBlcyc7XG5pbXBvcnQgeyBjb21wdXRlUGVyY2VwdHVhbEhhc2gsIGZpbmREdXBsaWNhdGVHcm91cHMsIER1cGxpY2F0ZUdyb3VwLCBJbWFnZUhhc2ggfSBmcm9tICcuLi91dGlscy9wZXJjZXB0dWFsSGFzaCc7XG5pbXBvcnQgeyB1cGRhdGVMaW5rc0luVmF1bHQgfSBmcm9tICcuLi91dGlscy9saW5rVXBkYXRlcic7XG5cbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfRFVQTElDQVRFX0RFVEVDVElPTiA9ICdkdXBsaWNhdGUtZGV0ZWN0aW9uLXZpZXcnO1xuXG5leHBvcnQgY2xhc3MgRHVwbGljYXRlRGV0ZWN0aW9uVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcblx0cGx1Z2luOiBJbWFnZU1hbmFnZXJQbHVnaW47XG5cdHByaXZhdGUgZHVwbGljYXRlR3JvdXBzOiBEdXBsaWNhdGVHcm91cFtdID0gW107XG5cdHByaXZhdGUgaXNTY2FubmluZzogYm9vbGVhbiA9IGZhbHNlO1xuXHRwcml2YXRlIHNjYW5Qcm9ncmVzczogeyBjdXJyZW50OiBudW1iZXI7IHRvdGFsOiBudW1iZXIgfSA9IHsgY3VycmVudDogMCwgdG90YWw6IDAgfTtcblx0cHJpdmF0ZSBsYXN0UHJvZ3Jlc3NBdDogbnVtYmVyID0gMDtcblxuXHRjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbikge1xuXHRcdHN1cGVyKGxlYWYpO1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHR9XG5cblx0Z2V0Vmlld1R5cGUoKSB7XG5cdFx0cmV0dXJuIFZJRVdfVFlQRV9EVVBMSUNBVEVfREVURUNUSU9OO1xuXHR9XG5cblx0Z2V0RGlzcGxheVRleHQoKSB7XG5cdFx0cmV0dXJuIHRoaXMucGx1Z2luLnQoJ2R1cGxpY2F0ZURldGVjdGlvbicpO1xuXHR9XG5cblx0YXN5bmMgb25PcGVuKCkge1xuXHRcdGxldCByZXRyaWVzID0gMDtcblx0XHR3aGlsZSAoIXRoaXMuY29udGVudEVsICYmIHJldHJpZXMgPCAxMCkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7XG5cdFx0XHRyZXRyaWVzKys7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0R1cGxpY2F0ZURldGVjdGlvblZpZXc6IGNvbnRlbnRFbCBub3QgcmVhZHknKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly8gRW5zdXJlIHN0eWxlcyBleGlzdCBldmVuIGlmIGV4dGVybmFsIHN0eWxlc2hlZXQgd2FzIHJlbW92ZWQgb3Igbm90IGxvYWRlZC5cblx0XHR0aGlzLmVuc3VyZVN0eWxlcygpO1xuXHRcdC8vIFJlc2V0IHNjYW4gc3RhdGUgb24gcmVvcGVuIHRvIGF2b2lkIHN0YWxlIFwiaXNTY2FubmluZ1wiIGJsb2NraW5nIHRoZSBVSS5cblx0XHR0aGlzLmlzU2Nhbm5pbmcgPSBmYWxzZTtcblx0XHR0aGlzLnNjYW5Qcm9ncmVzcyA9IHsgY3VycmVudDogMCwgdG90YWw6IDAgfTtcblx0XHR0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcygnZHVwbGljYXRlLWRldGVjdGlvbi12aWV3Jyk7XG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJWaWV3KCk7XG5cdH1cblxuXHRhc3luYyBvbkNsb3NlKCkge1xuXHRcdHRoaXMuaXNTY2FubmluZyA9IGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1ODlDNlx1NTZGRVxuXHQgKi9cblx0YXN5bmMgcmVuZGVyVmlldygpIHtcblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSByZXR1cm47XG5cdFx0dGhpcy5lbnN1cmVTdHlsZXMoKTtcblx0XHR0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuXG5cdFx0dGhpcy5yZW5kZXJIZWFkZXIoKTtcblxuXHRcdGlmICh0aGlzLmlzU2Nhbm5pbmcpIHtcblx0XHRcdHRoaXMucmVuZGVyUHJvZ3Jlc3MoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5kdXBsaWNhdGVHcm91cHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRjb25zdCBlbXB0eVN0YXRlID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWVtcHR5LXN0YXRlJyB9KTtcblx0XHRcdGVtcHR5U3RhdGUuY3JlYXRlRGl2KHtcblx0XHRcdFx0Y2xzOiAnZHVwbGljYXRlLWVtcHR5LXRleHQnLFxuXHRcdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdub0R1cGxpY2F0ZXNGb3VuZCcpXG5cdFx0XHR9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBcdTdFREZcdThCQTFcblx0XHRjb25zdCB0b3RhbER1cGxpY2F0ZXMgPSB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5yZWR1Y2UoXG5cdFx0XHQoc3VtLCBnKSA9PiBzdW0gKyBnLmZpbGVzLmxlbmd0aCAtIDEsIDBcblx0XHQpO1xuXHRcdGNvbnN0IHN0YXRzQmFyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLXN0YXRzLWJhcicgfSk7XG5cdFx0c3RhdHNCYXIuY3JlYXRlU3Bhbih7XG5cdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdkdXBsaWNhdGVHcm91cHNGb3VuZCcsIHtcblx0XHRcdFx0Z3JvdXBzOiB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5sZW5ndGgsXG5cdFx0XHRcdGZpbGVzOiB0b3RhbER1cGxpY2F0ZXNcblx0XHRcdH0pLFxuXHRcdFx0Y2xzOiAnZHVwbGljYXRlLXN0YXRzLWNvdW50J1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU0RTAwXHU5NTJFXHU2RTA1XHU3NDA2XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgY2xlYW5BbGxCdG4gPSBzdGF0c0Jhci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdkdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihjbGVhbkFsbEJ0biwgJ2Jyb29tJyk7XG5cdFx0Y2xlYW5BbGxCdG4uY3JlYXRlU3Bhbih7IHRleHQ6IGAgJHt0aGlzLnBsdWdpbi50KCdxdWFyYW50aW5lQWxsRHVwbGljYXRlcycpfWAgfSk7XG5cdFx0Y2xlYW5BbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnF1YXJhbnRpbmVBbGxEdXBsaWNhdGVzKCkpO1xuXG5cdFx0Ly8gXHU2RTMyXHU2N0QzXHU5MUNEXHU1OTBEXHU3RUM0XG5cdFx0Y29uc3QgZ3JvdXBzQ29udGFpbmVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWdyb3VwcycgfSk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5yZW5kZXJEdXBsaWNhdGVHcm91cChncm91cHNDb250YWluZXIsIHRoaXMuZHVwbGljYXRlR3JvdXBzW2ldLCBpICsgMSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NTkzNFx1OTBFOFxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJIZWFkZXIoKSB7XG5cdFx0Y29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWhlYWRlcicgfSk7XG5cdFx0aGVhZGVyLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy5wbHVnaW4udCgnZHVwbGljYXRlRGV0ZWN0aW9uJykgfSk7XG5cblx0XHRjb25zdCBkZXNjID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1oZWFkZXItZGVzY3JpcHRpb24nIH0pO1xuXHRcdGRlc2MuY3JlYXRlU3Bhbih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ2R1cGxpY2F0ZURldGVjdGlvbkRlc2MnKSB9KTtcblxuXHRcdGNvbnN0IGFjdGlvbnMgPSBoZWFkZXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWhlYWRlci1hY3Rpb25zJyB9KTtcblx0XHR0aGlzLnJlbmRlclN0YXJ0U2NhbkJ1dHRvbihhY3Rpb25zKTtcblxuXHRcdC8vIFx1OTYwOFx1NTAzQ1x1NjYzRVx1NzkzQVxuXHRcdGFjdGlvbnMuY3JlYXRlU3Bhbih7XG5cdFx0XHRjbHM6ICdkdXBsaWNhdGUtdGhyZXNob2xkLWxhYmVsJyxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NpbWlsYXJpdHlUaHJlc2hvbGQnLCB7XG5cdFx0XHRcdHZhbHVlOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kdXBsaWNhdGVUaHJlc2hvbGRcblx0XHRcdH0pXG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclN0YXJ0U2NhbkJ1dHRvbihjb250YWluZXI6IEhUTUxFbGVtZW50LCBleHRyYUNsYXNzPzogc3RyaW5nKSB7XG5cdFx0Y29uc3QgY2xzID0gWydkdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbicsICdkdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbi1wcmltYXJ5J107XG5cdFx0aWYgKGV4dHJhQ2xhc3MpIGNscy5wdXNoKGV4dHJhQ2xhc3MpO1xuXG5cdFx0Y29uc3Qgc2NhbkJ0biA9IGNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6IGNscy5qb2luKCcgJykgfSk7XG5cdFx0c2V0SWNvbihzY2FuQnRuLCAnc2VhcmNoJyk7XG5cdFx0c2NhbkJ0bi5jcmVhdGVTcGFuKHsgdGV4dDogYCAke3RoaXMucGx1Z2luLnQoJ3N0YXJ0U2NhbicpfWAgfSk7XG5cdFx0c2NhbkJ0bi5kaXNhYmxlZCA9IHRoaXMuaXNTY2FubmluZztcblx0XHRzY2FuQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dm9pZCB0aGlzLnN0YXJ0U2NhbigpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBzY2FuQnRuO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NjI2Qlx1NjNDRlx1OEZEQlx1NUVBNlxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJQcm9ncmVzcygpIHtcblx0XHRjb25zdCBwcm9ncmVzc0NvbnRhaW5lciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1zY2FuLXByb2dyZXNzJyB9KTtcblxuXHRcdGNvbnN0IHByb2dyZXNzQmFyID0gcHJvZ3Jlc3NDb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLXByb2dyZXNzLWJhcicgfSk7XG5cdFx0Y29uc3QgcHJvZ3Jlc3NGaWxsID0gcHJvZ3Jlc3NCYXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLXByb2dyZXNzLWZpbGwnIH0pO1xuXHRcdGNvbnN0IHBlcmNlbnQgPSB0aGlzLnNjYW5Qcm9ncmVzcy50b3RhbCA+IDBcblx0XHRcdD8gTWF0aC5yb3VuZCgodGhpcy5zY2FuUHJvZ3Jlc3MuY3VycmVudCAvIHRoaXMuc2NhblByb2dyZXNzLnRvdGFsKSAqIDEwMClcblx0XHRcdDogMDtcblx0XHRwcm9ncmVzc0ZpbGwuc3R5bGUud2lkdGggPSBgJHtwZXJjZW50fSVgO1xuXG5cdFx0cHJvZ3Jlc3NDb250YWluZXIuY3JlYXRlRGl2KHtcblx0XHRcdGNsczogJ2R1cGxpY2F0ZS1wcm9ncmVzcy10ZXh0Jyxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NjYW5Qcm9ncmVzcycsIHtcblx0XHRcdFx0Y3VycmVudDogdGhpcy5zY2FuUHJvZ3Jlc3MuY3VycmVudCxcblx0XHRcdFx0dG90YWw6IHRoaXMuc2NhblByb2dyZXNzLnRvdGFsXG5cdFx0XHR9KVxuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBjb21wYXJlRHVwbGljYXRlRmlsZXMocGF0aEE6IHN0cmluZywgcGF0aEI6IHN0cmluZyk6IG51bWJlciB7XG5cdFx0Y29uc3QgZmlsZUEgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aEEpO1xuXHRcdGNvbnN0IGZpbGVCID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGhCKTtcblxuXHRcdGlmIChmaWxlQSBpbnN0YW5jZW9mIFRGaWxlICYmIGZpbGVCIGluc3RhbmNlb2YgVEZpbGUpIHtcblx0XHRcdHJldHVybiAoZmlsZUIuc3RhdC5tdGltZSAtIGZpbGVBLnN0YXQubXRpbWUpXG5cdFx0XHRcdHx8IChmaWxlQi5zdGF0LnNpemUgLSBmaWxlQS5zdGF0LnNpemUpXG5cdFx0XHRcdHx8IHBhdGhBLmxvY2FsZUNvbXBhcmUocGF0aEIpO1xuXHRcdH1cblx0XHRpZiAoZmlsZUEgaW5zdGFuY2VvZiBURmlsZSkgcmV0dXJuIC0xO1xuXHRcdGlmIChmaWxlQiBpbnN0YW5jZW9mIFRGaWxlKSByZXR1cm4gMTtcblx0XHRyZXR1cm4gcGF0aEEubG9jYWxlQ29tcGFyZShwYXRoQik7XG5cdH1cblxuXHRwcml2YXRlIG5vcm1hbGl6ZUR1cGxpY2F0ZUdyb3VwKGdyb3VwOiBEdXBsaWNhdGVHcm91cCk6IER1cGxpY2F0ZUdyb3VwIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Li4uZ3JvdXAsXG5cdFx0XHRmaWxlczogWy4uLmdyb3VwLmZpbGVzXS5zb3J0KChhLCBiKSA9PiB0aGlzLmNvbXBhcmVEdXBsaWNhdGVGaWxlcyhhLnBhdGgsIGIucGF0aCkpXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTVGMDBcdTU5Q0JcdTYyNkJcdTYzQ0Zcblx0ICovXG5cdGFzeW5jIHN0YXJ0U2NhbigpIHtcblx0XHRpZiAodGhpcy5pc1NjYW5uaW5nKSB7XG5cdFx0XHQvLyBJZiB0aGUgcHJldmlvdXMgc2NhbiBhcHBlYXJzIHN0dWNrLCBhbGxvdyBhIHJlc3RhcnQuXG5cdFx0XHRjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuXHRcdFx0aWYgKHRoaXMubGFzdFByb2dyZXNzQXQgJiYgbm93IC0gdGhpcy5sYXN0UHJvZ3Jlc3NBdCA+IDE1MDAwKSB7XG5cdFx0XHRcdHRoaXMuaXNTY2FubmluZyA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLmlzU2Nhbm5pbmcgPSB0cnVlO1xuXHRcdHRoaXMuZHVwbGljYXRlR3JvdXBzID0gW107XG5cdFx0dGhpcy5sYXN0UHJvZ3Jlc3NBdCA9IERhdGUubm93KCk7XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gXHU4M0I3XHU1M0Q2XHU2MjQwXHU2NzA5XHU1NkZFXHU3MjQ3XHU2NTg3XHU0RUY2XG5cdFx0XHRjb25zdCBpbWFnZUZpbGVzOiBURmlsZVtdID0gW107XG5cdFx0XHRpZiAodGhpcy5wbHVnaW4uZmlsZUluZGV4LmlzSW5pdGlhbGl6ZWQpIHtcblx0XHRcdFx0Zm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLnBsdWdpbi5maWxlSW5kZXguZ2V0RmlsZXMoKSkge1xuXHRcdFx0XHRcdGlmIChnZXRNZWRpYVR5cGUoZW50cnkubmFtZSkgPT09ICdpbWFnZScpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZW50cnkucGF0aCk7XG5cdFx0XHRcdFx0XHRpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG5cdFx0XHRcdFx0XHRcdGltYWdlRmlsZXMucHVzaChmaWxlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGFsbEZpbGVzID0gYXdhaXQgdGhpcy5wbHVnaW4uZ2V0QWxsSW1hZ2VGaWxlcygpO1xuXHRcdFx0XHRpbWFnZUZpbGVzLnB1c2goLi4uYWxsRmlsZXMuZmlsdGVyKGYgPT4gZ2V0TWVkaWFUeXBlKGYubmFtZSkgPT09ICdpbWFnZScpKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zY2FuUHJvZ3Jlc3MgPSB7IGN1cnJlbnQ6IDAsIHRvdGFsOiBpbWFnZUZpbGVzLmxlbmd0aCB9O1xuXHRcdFx0dGhpcy5sYXN0UHJvZ3Jlc3NBdCA9IERhdGUubm93KCk7XG5cdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblxuXHRcdFx0Ly8gXHU1MjA2XHU2Mjc5XHU4QkExXHU3Qjk3XHU1NEM4XHU1RTBDXG5cdFx0XHRjb25zdCBoYXNoTWFwID0gbmV3IE1hcDxzdHJpbmcsIEltYWdlSGFzaD4oKTtcblx0XHRcdGNvbnN0IEJBVENIX1NJWkUgPSA1O1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGltYWdlRmlsZXMubGVuZ3RoOyBpICs9IEJBVENIX1NJWkUpIHtcblx0XHRcdFx0Y29uc3QgYmF0Y2ggPSBpbWFnZUZpbGVzLnNsaWNlKGksIGkgKyBCQVRDSF9TSVpFKTtcblxuXHRcdFx0XHRhd2FpdCBQcm9taXNlLmFsbChiYXRjaC5tYXAoYXN5bmMgKGZpbGUpID0+IHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Y29uc3Qgc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdFx0XHRcdFx0Y29uc3QgaGFzaCA9IGF3YWl0IGNvbXB1dGVQZXJjZXB0dWFsSGFzaChzcmMpO1xuXHRcdFx0XHRcdFx0aGFzaE1hcC5zZXQoZmlsZS5wYXRoLCBoYXNoKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBIYXNoIGNvbXB1dGF0aW9uIGZhaWxlZCBmb3IgJHtmaWxlLm5hbWV9OmAsIGVycm9yKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pKTtcblxuXHRcdFx0XHR0aGlzLnNjYW5Qcm9ncmVzcy5jdXJyZW50ID0gTWF0aC5taW4oaSArIEJBVENIX1NJWkUsIGltYWdlRmlsZXMubGVuZ3RoKTtcblx0XHRcdFx0dGhpcy5sYXN0UHJvZ3Jlc3NBdCA9IERhdGUubm93KCk7XG5cblx0XHRcdFx0Ly8gXHU2NkY0XHU2NUIwXHU4RkRCXHU1RUE2IFVJXG5cdFx0XHRcdGNvbnN0IHByb2dyZXNzRmlsbCA9IHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoJy5kdXBsaWNhdGUtcHJvZ3Jlc3MtZmlsbCcpIGFzIEhUTUxFbGVtZW50O1xuXHRcdFx0XHRjb25zdCBwcm9ncmVzc1RleHQgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKCcuZHVwbGljYXRlLXByb2dyZXNzLXRleHQnKSBhcyBIVE1MRWxlbWVudDtcblx0XHRcdFx0aWYgKHByb2dyZXNzRmlsbCAmJiBwcm9ncmVzc1RleHQpIHtcblx0XHRcdFx0XHRjb25zdCBwZXJjZW50ID0gTWF0aC5yb3VuZCgodGhpcy5zY2FuUHJvZ3Jlc3MuY3VycmVudCAvIHRoaXMuc2NhblByb2dyZXNzLnRvdGFsKSAqIDEwMCk7XG5cdFx0XHRcdFx0cHJvZ3Jlc3NGaWxsLnN0eWxlLndpZHRoID0gYCR7cGVyY2VudH0lYDtcblx0XHRcdFx0XHRwcm9ncmVzc1RleHQudGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi50KCdzY2FuUHJvZ3Jlc3MnLCB7XG5cdFx0XHRcdFx0XHRjdXJyZW50OiB0aGlzLnNjYW5Qcm9ncmVzcy5jdXJyZW50LFxuXHRcdFx0XHRcdFx0dG90YWw6IHRoaXMuc2NhblByb2dyZXNzLnRvdGFsXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBcdThCQTkgVUkgXHU2NzA5XHU2NzNBXHU0RjFBXHU2NkY0XHU2NUIwXG5cdFx0XHRcdGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMCkpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBcdTY3RTVcdTYyN0VcdTkxQ0RcdTU5MERcdTdFQzRcblx0XHRcdGNvbnN0IHRocmVzaG9sZCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmR1cGxpY2F0ZVRocmVzaG9sZDtcblx0XHRcdHRoaXMuZHVwbGljYXRlR3JvdXBzID0gZmluZER1cGxpY2F0ZUdyb3VwcyhoYXNoTWFwLCB0aHJlc2hvbGQpXG5cdFx0XHRcdC5tYXAoZ3JvdXAgPT4gdGhpcy5ub3JtYWxpemVEdXBsaWNhdGVHcm91cChncm91cCkpO1xuXG5cdFx0XHRpZiAodGhpcy5kdXBsaWNhdGVHcm91cHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnbm9EdXBsaWNhdGVzRm91bmQnKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCB0b3RhbER1cGxpY2F0ZXMgPSB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5yZWR1Y2UoXG5cdFx0XHRcdFx0KHN1bSwgZykgPT4gc3VtICsgZy5maWxlcy5sZW5ndGggLSAxLCAwXG5cdFx0XHRcdCk7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZHVwbGljYXRlc0ZvdW5kJywge1xuXHRcdFx0XHRcdGdyb3VwczogdGhpcy5kdXBsaWNhdGVHcm91cHMubGVuZ3RoLFxuXHRcdFx0XHRcdGZpbGVzOiB0b3RhbER1cGxpY2F0ZXNcblx0XHRcdFx0fSkpO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdEdXBsaWNhdGUgZGV0ZWN0aW9uIGZhaWxlZDonLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3NjYW5FcnJvcicpKTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0dGhpcy5pc1NjYW5uaW5nID0gZmFsc2U7XG5cdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIGVuc3VyZVN0eWxlcygpIHtcblx0XHRpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29ic2lkaWFuLW1lZGlhLXRvb2xraXQtc3R5bGVzJykgfHxcblx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbWFnZS1tYW5hZ2VyLXN0eWxlcycpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHZvaWQgdGhpcy5wbHVnaW4uYWRkU3R5bGUoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTUzNTVcdTRFMkFcdTkxQ0RcdTU5MERcdTdFQzRcblx0ICovXG5cdHByaXZhdGUgcmVuZGVyRHVwbGljYXRlR3JvdXAoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZ3JvdXA6IER1cGxpY2F0ZUdyb3VwLCBpbmRleDogbnVtYmVyKSB7XG5cdFx0Z3JvdXAuZmlsZXMuc29ydCgoYSwgYikgPT4gdGhpcy5jb21wYXJlRHVwbGljYXRlRmlsZXMoYS5wYXRoLCBiLnBhdGgpKTtcblxuXHRcdGNvbnN0IGdyb3VwRWwgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWdyb3VwJyB9KTtcblxuXHRcdC8vIFx1N0VDNFx1NjgwN1x1OTg5OFxuXHRcdGNvbnN0IGdyb3VwSGVhZGVyID0gZ3JvdXBFbC5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZ3JvdXAtaGVhZGVyJyB9KTtcblx0XHRncm91cEhlYWRlci5jcmVhdGVTcGFuKHtcblx0XHRcdGNsczogJ2R1cGxpY2F0ZS1ncm91cC10aXRsZScsXG5cdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdkdXBsaWNhdGVHcm91cCcsIHsgaW5kZXggfSlcblx0XHR9KTtcblx0XHRncm91cEhlYWRlci5jcmVhdGVTcGFuKHtcblx0XHRcdGNsczogJ2R1cGxpY2F0ZS1ncm91cC1jb3VudCcsXG5cdFx0XHR0ZXh0OiBgJHtncm91cC5maWxlcy5sZW5ndGh9ICR7dGhpcy5wbHVnaW4udCgnZmlsZXMnKX1gXG5cdFx0fSk7XG5cblx0XHQvLyBcdTY1ODdcdTRFRjZcdTUyMTdcdTg4Njhcblx0XHRjb25zdCBmaWxlTGlzdCA9IGdyb3VwRWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWdyb3VwLWZpbGVzJyB9KTtcblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZ3JvdXAuZmlsZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IGZpbGVJbmZvID0gZ3JvdXAuZmlsZXNbaV07XG5cdFx0XHRjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGZpbGVJbmZvLnBhdGgpO1xuXHRcdFx0aWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgY29udGludWU7XG5cblx0XHRcdGNvbnN0IGZpbGVFbCA9IGZpbGVMaXN0LmNyZWF0ZURpdih7XG5cdFx0XHRcdGNsczogYGR1cGxpY2F0ZS1ncm91cC1maWxlICR7aSA9PT0gMCA/ICdkdXBsaWNhdGUta2VlcC1zdWdnZXN0aW9uJyA6ICdkdXBsaWNhdGUtZmlsZS1zdWdnZXN0aW9uJ31gXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gXHU3RjI5XHU3NTY1XHU1NkZFXG5cdFx0XHRjb25zdCB0aHVtYiA9IGZpbGVFbC5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZmlsZS10aHVtYm5haWwnIH0pO1xuXHRcdFx0Y29uc3Qgc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdFx0Y29uc3QgaW1nID0gdGh1bWIuY3JlYXRlRWwoJ2ltZycsIHtcblx0XHRcdFx0YXR0cjogeyBzcmMsIGFsdDogZmlsZS5uYW1lIH1cblx0XHRcdH0pO1xuXHRcdFx0aW1nLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKCkgPT4ge1xuXHRcdFx0XHR0aHVtYi5lbXB0eSgpO1xuXHRcdFx0XHRjb25zdCBpY29uID0gdGh1bWIuY3JlYXRlRGl2KCk7XG5cdFx0XHRcdHNldEljb24oaWNvbiwgJ2ltYWdlJyk7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gXHU2NTg3XHU0RUY2XHU0RkUxXHU2MDZGXG5cdFx0XHRjb25zdCBpbmZvID0gZmlsZUVsLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1maWxlLWluZm8nIH0pO1xuXHRcdFx0aW5mby5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZmlsZS1uYW1lJywgdGV4dDogZmlsZS5uYW1lIH0pO1xuXHRcdFx0aW5mby5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZmlsZS1wYXRoJywgdGV4dDogZmlsZS5wYXRoIH0pO1xuXG5cdFx0XHRjb25zdCBtZXRhID0gaW5mby5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZmlsZS1tZXRhJyB9KTtcblx0XHRcdG1ldGEuY3JlYXRlU3Bhbih7IHRleHQ6IGZvcm1hdEZpbGVTaXplKGZpbGUuc3RhdC5zaXplKSB9KTtcblx0XHRcdG1ldGEuY3JlYXRlU3Bhbih7IHRleHQ6IGAgfCAke25ldyBEYXRlKGZpbGUuc3RhdC5tdGltZSkudG9Mb2NhbGVEYXRlU3RyaW5nKCl9YCB9KTtcblx0XHRcdG1ldGEuY3JlYXRlU3Bhbih7XG5cdFx0XHRcdGNsczogJ2R1cGxpY2F0ZS1zaW1pbGFyaXR5LWJhZGdlJyxcblx0XHRcdFx0dGV4dDogYCAke2ZpbGVJbmZvLnNpbWlsYXJpdHl9JWBcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBcdTY4MDdcdThCQjBcblx0XHRcdGlmIChpID09PSAwKSB7XG5cdFx0XHRcdGZpbGVFbC5jcmVhdGVTcGFuKHsgY2xzOiAnZHVwbGljYXRlLWtlZXAtYmFkZ2UnLCB0ZXh0OiB0aGlzLnBsdWdpbi50KCdzdWdnZXN0S2VlcCcpIH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gXHU5Njk0XHU3OUJCXHU2MzA5XHU5NEFFXG5cdFx0XHRcdGNvbnN0IHF1YXJhbnRpbmVCdG4gPSBmaWxlRWwuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnZHVwbGljYXRlLXF1YXJhbnRpbmUtYnRuJyB9KTtcblx0XHRcdFx0c2V0SWNvbihxdWFyYW50aW5lQnRuLCAnYXJjaGl2ZScpO1xuXHRcdFx0XHRxdWFyYW50aW5lQnRuLmNyZWF0ZVNwYW4oeyB0ZXh0OiBgICR7dGhpcy5wbHVnaW4udCgncXVhcmFudGluZScpfWAgfSk7XG5cdFx0XHRcdHF1YXJhbnRpbmVCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3Qga2VlcEZpbGUgPSBncm91cC5maWxlc1swXTtcblx0XHRcdFx0XHRhd2FpdCB1cGRhdGVMaW5rc0luVmF1bHQodGhpcy5hcHAsIGZpbGUucGF0aCwga2VlcEZpbGUucGF0aCk7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5wbHVnaW4uc2FmZURlbGV0ZUZpbGUoZmlsZSk7XG5cdFx0XHRcdFx0aWYgKHJlc3VsdCkge1xuXHRcdFx0XHRcdFx0Z3JvdXAuZmlsZXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHRcdFx0aWYgKGdyb3VwLmZpbGVzLmxlbmd0aCA8PSAxKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IGlkeCA9IHRoaXMuZHVwbGljYXRlR3JvdXBzLmluZGV4T2YoZ3JvdXApO1xuXHRcdFx0XHRcdFx0XHRpZiAoaWR4ID49IDApIHRoaXMuZHVwbGljYXRlR3JvdXBzLnNwbGljZShpZHgsIDEpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5yZW5kZXJWaWV3KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU0RTAwXHU5NTJFXHU5Njk0XHU3OUJCXHU2MjQwXHU2NzA5XHU5MUNEXHU1OTBEXHU5ODc5XHVGRjA4XHU2QkNGXHU3RUM0XHU0RkREXHU3NTU5XHU2NzAwXHU2NUIwXHU3MjQ4XHVGRjA5XG5cdCAqL1xuXHRhc3luYyBxdWFyYW50aW5lQWxsRHVwbGljYXRlcygpIHtcblx0XHRsZXQgdG90YWxRdWFyYW50aW5lZCA9IDA7XG5cblx0XHRmb3IgKGNvbnN0IGdyb3VwIG9mIHRoaXMuZHVwbGljYXRlR3JvdXBzKSB7XG5cdFx0XHRncm91cC5maWxlcy5zb3J0KChhLCBiKSA9PiB0aGlzLmNvbXBhcmVEdXBsaWNhdGVGaWxlcyhhLnBhdGgsIGIucGF0aCkpO1xuXG5cdFx0XHRjb25zdCBrZWVwRmlsZSA9IGdyb3VwLmZpbGVzWzBdO1xuXHRcdFx0Ly8gXHU0RkREXHU3NTU5XHU3QjJDXHU0RTAwXHU0RTJBXHVGRjA4XHU2NzAwXHU2NUIwXHVGRjA5XHVGRjBDXHU5Njk0XHU3OUJCXHU1MTc2XHU0RjU5XG5cdFx0XHRmb3IgKGxldCBpID0gMTsgaSA8IGdyb3VwLmZpbGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGNvbnN0IGVudHJ5ID0gZ3JvdXAuZmlsZXNbaV07XG5cdFx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZW50cnkucGF0aCk7XG5cdFx0XHRcdGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIGNvbnRpbnVlO1xuXG5cdFx0XHRcdGF3YWl0IHVwZGF0ZUxpbmtzSW5WYXVsdCh0aGlzLmFwcCwgZmlsZS5wYXRoLCBrZWVwRmlsZS5wYXRoKTtcblx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5wbHVnaW4uc2FmZURlbGV0ZUZpbGUoZmlsZSk7XG5cdFx0XHRcdGlmIChyZXN1bHQpIHRvdGFsUXVhcmFudGluZWQrKztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2R1cGxpY2F0ZXNRdWFyYW50aW5lZCcsIHsgY291bnQ6IHRvdGFsUXVhcmFudGluZWQgfSkpO1xuXHRcdHRoaXMuZHVwbGljYXRlR3JvdXBzID0gW107XG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJWaWV3KCk7XG5cdH1cbn1cbiIsICIvKipcbiAqIFx1NjExRlx1NzdFNVx1NTRDOFx1NUUwQ1x1NTNCQlx1OTFDRFx1NkEyMVx1NTc1N1xuICogXHU0RjdGXHU3NTI4IERDVCBwSGFzaCArIGRIYXNoIFx1N0VDNFx1NTQwOFx1NTRDOFx1NUUwQ1x1NUI5RVx1NzNCMFx1NTBDRlx1N0QyMFx1N0VBN1x1NTZGRVx1NzI0N1x1NTNCQlx1OTFDRFxuICogXHU3RUFGXHU2RDRGXHU4OUM4XHU1NjY4IENhbnZhcyBBUEkgXHU1QjlFXHU3M0IwXHVGRjBDXHU2NUUwXHU1OTE2XHU5MEU4XHU0RjlEXHU4RDU2XG4gKi9cblxuY29uc3QgREVGQVVMVF9JTUFHRV9MT0FEX1RJTUVPVVQgPSA4MDAwO1xuY29uc3QgSEFTSF9CQUNLR1JPVU5EX1JHQiA9IDI1NTtcbmNvbnN0IEFMUEhBX0NPTlRFTlRfVEhSRVNIT0xEID0gODtcblxuaW50ZXJmYWNlIEltYWdlQm91bmRzIHtcblx0bGVmdDogbnVtYmVyO1xuXHR0b3A6IG51bWJlcjtcblx0d2lkdGg6IG51bWJlcjtcblx0aGVpZ2h0OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBTb3VyY2VCaXRtYXAge1xuXHRjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuXHRpbWFnZURhdGE6IEltYWdlRGF0YTtcblx0Ym91bmRzOiBJbWFnZUJvdW5kcztcblx0aGFzVHJhbnNwYXJlbmN5OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFx1OEJBMVx1N0I5N1x1OTAwRlx1NjYwRVx1NTZGRVx1NzI0N1x1NzY4NFx1NjcwOVx1NjU0OFx1NTE4NVx1NUJCOVx1NTMzQVx1NTdERlx1MzAwMlxuICogXHU4RkQ5XHU2ODM3XHU1M0VGXHU0RUU1XHU1MUNGXHU1QzExXHU1OTI3XHU5NzYyXHU3OUVGXHU5MDBGXHU2NjBFXHU3NTU5XHU3NjdEXHU1QkY5XHU1NEM4XHU1RTBDXHU3RUQzXHU2NzlDXHU3Njg0XHU1RTcyXHU2MjcwXHUzMDAyXG4gKi9cbmZ1bmN0aW9uIGFuYWx5emVJbWFnZURhdGEoaW1hZ2VEYXRhOiBJbWFnZURhdGEpOiB7IGJvdW5kczogSW1hZ2VCb3VuZHM7IGhhc1RyYW5zcGFyZW5jeTogYm9vbGVhbiB9IHtcblx0Y29uc3QgeyBkYXRhLCB3aWR0aCwgaGVpZ2h0IH0gPSBpbWFnZURhdGE7XG5cdGxldCBsZWZ0ID0gd2lkdGg7XG5cdGxldCB0b3AgPSBoZWlnaHQ7XG5cdGxldCByaWdodCA9IC0xO1xuXHRsZXQgYm90dG9tID0gLTE7XG5cdGxldCBoYXNUcmFuc3BhcmVuY3kgPSBmYWxzZTtcblxuXHRmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XG5cdFx0Zm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XG5cdFx0XHRjb25zdCBhbHBoYSA9IGRhdGFbKHkgKiB3aWR0aCArIHgpICogNCArIDNdO1xuXHRcdFx0aWYgKGFscGhhIDwgMjU1KSB7XG5cdFx0XHRcdGhhc1RyYW5zcGFyZW5jeSA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHRpZiAoYWxwaGEgPD0gQUxQSEFfQ09OVEVOVF9USFJFU0hPTEQpIGNvbnRpbnVlO1xuXG5cdFx0XHRpZiAoeCA8IGxlZnQpIGxlZnQgPSB4O1xuXHRcdFx0aWYgKHkgPCB0b3ApIHRvcCA9IHk7XG5cdFx0XHRpZiAoeCA+IHJpZ2h0KSByaWdodCA9IHg7XG5cdFx0XHRpZiAoeSA+IGJvdHRvbSkgYm90dG9tID0geTtcblx0XHR9XG5cdH1cblxuXHRpZiAocmlnaHQgPCBsZWZ0IHx8IGJvdHRvbSA8IHRvcCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRib3VuZHM6IHsgbGVmdDogMCwgdG9wOiAwLCB3aWR0aCwgaGVpZ2h0IH0sXG5cdFx0XHRoYXNUcmFuc3BhcmVuY3lcblx0XHR9O1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRib3VuZHM6IHtcblx0XHRcdGxlZnQsXG5cdFx0XHR0b3AsXG5cdFx0XHR3aWR0aDogcmlnaHQgLSBsZWZ0ICsgMSxcblx0XHRcdGhlaWdodDogYm90dG9tIC0gdG9wICsgMVxuXHRcdH0sXG5cdFx0aGFzVHJhbnNwYXJlbmN5XG5cdH07XG59XG5cbi8qKlxuICogXHU4QkZCXHU1M0Q2XHU1MzlGXHU1NkZFXHU1MENGXHU3RDIwXHU2NTcwXHU2MzZFXHVGRjBDXHU1RTc2XHU5ODg0XHU1MTQ4XHU1MjA2XHU2NzkwXHU5MDBGXHU2NjBFXHU1MzNBXHU1N0RGXHU0RTBFXHU2NzA5XHU2NTQ4XHU1MTg1XHU1QkI5XHU4RkI5XHU3NTRDXHUzMDAyXG4gKi9cbmZ1bmN0aW9uIGNhcHR1cmVTb3VyY2VCaXRtYXAoaW1nOiBIVE1MSW1hZ2VFbGVtZW50KTogU291cmNlQml0bWFwIHtcblx0Y29uc3Qgc291cmNlQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdHNvdXJjZUNhbnZhcy53aWR0aCA9IGltZy5uYXR1cmFsV2lkdGggfHwgaW1nLndpZHRoO1xuXHRzb3VyY2VDYW52YXMuaGVpZ2h0ID0gaW1nLm5hdHVyYWxIZWlnaHQgfHwgaW1nLmhlaWdodDtcblx0Y29uc3Qgc291cmNlQ3R4ID0gc291cmNlQ2FudmFzLmdldENvbnRleHQoJzJkJykhO1xuXHRzb3VyY2VDdHguZHJhd0ltYWdlKGltZywgMCwgMCk7XG5cblx0Y29uc3Qgc291cmNlSW1hZ2VEYXRhID0gc291cmNlQ3R4LmdldEltYWdlRGF0YSgwLCAwLCBzb3VyY2VDYW52YXMud2lkdGgsIHNvdXJjZUNhbnZhcy5oZWlnaHQpO1xuXHRjb25zdCB7IGJvdW5kcywgaGFzVHJhbnNwYXJlbmN5IH0gPSBhbmFseXplSW1hZ2VEYXRhKHNvdXJjZUltYWdlRGF0YSk7XG5cblx0cmV0dXJuIHtcblx0XHRjYW52YXM6IHNvdXJjZUNhbnZhcyxcblx0XHRpbWFnZURhdGE6IHNvdXJjZUltYWdlRGF0YSxcblx0XHRib3VuZHMsXG5cdFx0aGFzVHJhbnNwYXJlbmN5XG5cdH07XG59XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU1NkZFXHU3MjQ3XHU3Njg0XHU3MDcwXHU1RUE2XHU1MENGXHU3RDIwXHU2NTcwXHU2MzZFXHUzMDAyXG4gKiBcdTVCRjlcdTkwMEZcdTY2MEUgUE5HIFx1NEYxQVx1NTE0OFx1NTcyOFx1NzY3RFx1NUU5NVx1NEUwQVx1NTQwOFx1NjIxMFx1RkYwQ1x1NTE4RFx1ODhDMVx1NjM4OVx1OTAwRlx1NjYwRVx1NzU1OVx1NzY3RFx1RkYwQ1x1OTA3Rlx1NTE0RFx1OTAwRlx1NjYwRVx1ODBDQ1x1NjY2Rlx1NEUwRVx1OUVEMVx1ODI3Mlx1NTZGRVx1NUY2Mlx1ODhBQlx1OEJFRlx1OEJBNFx1NEUzQVx1NTQwQ1x1NEUwMFx1NzlDRFx1NTBDRlx1N0QyMFx1MzAwMlxuICovXG5mdW5jdGlvbiBnZXRHcmF5c2NhbGVEYXRhKHNvdXJjZTogU291cmNlQml0bWFwLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcik6IG51bWJlcltdIHtcblx0Y29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuXHRjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XG5cdGN0eC5maWxsU3R5bGUgPSBgcmdiKCR7SEFTSF9CQUNLR1JPVU5EX1JHQn0sICR7SEFTSF9CQUNLR1JPVU5EX1JHQn0sICR7SEFTSF9CQUNLR1JPVU5EX1JHQn0pYDtcblx0Y3R4LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXHRjdHguZHJhd0ltYWdlKFxuXHRcdHNvdXJjZS5jYW52YXMsXG5cdFx0c291cmNlLmJvdW5kcy5sZWZ0LFxuXHRcdHNvdXJjZS5ib3VuZHMudG9wLFxuXHRcdHNvdXJjZS5ib3VuZHMud2lkdGgsXG5cdFx0c291cmNlLmJvdW5kcy5oZWlnaHQsXG5cdFx0MCxcblx0XHQwLFxuXHRcdHdpZHRoLFxuXHRcdGhlaWdodFxuXHQpO1xuXG5cdGNvbnN0IGltYWdlRGF0YSA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cdGNvbnN0IGRhdGEgPSBpbWFnZURhdGEuZGF0YTtcblx0Y29uc3QgZ3JheTogbnVtYmVyW10gPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpICs9IDQpIHtcblx0XHRncmF5LnB1c2goMC4yOTkgKiBkYXRhW2ldICsgMC41ODcgKiBkYXRhW2kgKyAxXSArIDAuMTE0ICogZGF0YVtpICsgMl0pO1xuXHR9XG5cblx0cmV0dXJuIGdyYXk7XG59XG5cbi8qKlxuICogXHU3QjgwXHU1MzE2IERDVCBcdTUzRDhcdTYzNjJcdUZGMDhcdTRFQzVcdThCQTFcdTdCOTdcdTRGNEVcdTk4OTFcdTUyMDZcdTkxQ0ZcdUZGMDlcbiAqL1xuZnVuY3Rpb24gZGN0MmQobWF0cml4OiBudW1iZXJbXSwgc2l6ZTogbnVtYmVyLCBvdXRwdXRTaXplOiBudW1iZXIpOiBudW1iZXJbXSB7XG5cdGNvbnN0IHJlc3VsdDogbnVtYmVyW10gPSBuZXcgQXJyYXkob3V0cHV0U2l6ZSAqIG91dHB1dFNpemUpO1xuXG5cdGZvciAobGV0IHUgPSAwOyB1IDwgb3V0cHV0U2l6ZTsgdSsrKSB7XG5cdFx0Zm9yIChsZXQgdiA9IDA7IHYgPCBvdXRwdXRTaXplOyB2KyspIHtcblx0XHRcdGxldCBzdW0gPSAwO1xuXHRcdFx0Zm9yIChsZXQgeCA9IDA7IHggPCBzaXplOyB4KyspIHtcblx0XHRcdFx0Zm9yIChsZXQgeSA9IDA7IHkgPCBzaXplOyB5KyspIHtcblx0XHRcdFx0XHRzdW0gKz0gbWF0cml4W3ggKiBzaXplICsgeV0gKlxuXHRcdFx0XHRcdFx0TWF0aC5jb3MoTWF0aC5QSSAqICgyICogeCArIDEpICogdSAvICgyICogc2l6ZSkpICpcblx0XHRcdFx0XHRcdE1hdGguY29zKE1hdGguUEkgKiAoMiAqIHkgKyAxKSAqIHYgLyAoMiAqIHNpemUpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmVzdWx0W3UgKiBvdXRwdXRTaXplICsgdl0gPSBzdW07XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBEQ1QgcEhhc2g6IDMyXHUwMEQ3MzJcdTcwNzBcdTVFQTYgXHUyMTkyIERDVCBcdTIxOTIgXHU1M0Q2OFx1MDBENzhcdTRGNEVcdTk4OTEgXHUyMTkyIFx1NEUyRFx1NEY0RFx1NjU3MFx1OTYwOFx1NTAzQyBcdTIxOTIgNjQtYml0IGhleFxuICovXG5mdW5jdGlvbiBjb21wdXRlUEhhc2goc291cmNlOiBTb3VyY2VCaXRtYXApOiBzdHJpbmcge1xuXHRjb25zdCBTSVpFID0gMzI7XG5cdGNvbnN0IExPV19GUkVRID0gODtcblxuXHRjb25zdCBncmF5ID0gZ2V0R3JheXNjYWxlRGF0YShzb3VyY2UsIFNJWkUsIFNJWkUpO1xuXHRjb25zdCBkY3RDb2VmZnMgPSBkY3QyZChncmF5LCBTSVpFLCBMT1dfRlJFUSk7XG5cblx0Ly8gXHU2MzkyXHU5NjY0IERDIFx1NTIwNlx1OTFDRiAoMCwwKVxuXHRjb25zdCB2YWx1ZXMgPSBkY3RDb2VmZnMuc2xpY2UoMSk7XG5cdGNvbnN0IHNvcnRlZCA9IFsuLi52YWx1ZXNdLnNvcnQoKGEsIGIpID0+IGEgLSBiKTtcblx0Y29uc3QgbWVkaWFuID0gc29ydGVkW01hdGguZmxvb3Ioc29ydGVkLmxlbmd0aCAvIDIpXTtcblxuXHQvLyBcdTc1MUZcdTYyMTAgNjQtYml0IFx1NTRDOFx1NUUwQ1xuXHRsZXQgaGFzaCA9ICcnO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IExPV19GUkVRICogTE9XX0ZSRVE7IGkrKykge1xuXHRcdGhhc2ggKz0gZGN0Q29lZmZzW2ldID4gbWVkaWFuID8gJzEnIDogJzAnO1xuXHR9XG5cblx0cmV0dXJuIGJpbmFyeVRvSGV4KGhhc2gpO1xufVxuXG4vKipcbiAqIGRIYXNoOiA5XHUwMEQ3OFx1NzA3MFx1NUVBNiBcdTIxOTIgXHU2QzM0XHU1RTczXHU1REVFXHU1MjA2IFx1MjE5MiA2NC1iaXQgaGV4XG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVESGFzaChzb3VyY2U6IFNvdXJjZUJpdG1hcCk6IHN0cmluZyB7XG5cdGNvbnN0IGdyYXkgPSBnZXRHcmF5c2NhbGVEYXRhKHNvdXJjZSwgOSwgOCk7XG5cdGxldCBoYXNoID0gJyc7XG5cblx0Zm9yIChsZXQgeSA9IDA7IHkgPCA4OyB5KyspIHtcblx0XHRmb3IgKGxldCB4ID0gMDsgeCA8IDg7IHgrKykge1xuXHRcdFx0aGFzaCArPSBncmF5W3kgKiA5ICsgeF0gPCBncmF5W3kgKiA5ICsgeCArIDFdID8gJzEnIDogJzAnO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBiaW5hcnlUb0hleChoYXNoKTtcbn1cblxuLyoqXG4gKiBcdTRFOENcdThGREJcdTUyMzZcdTVCNTdcdTdCMjZcdTRFMzJcdThGNkNcdTUzNDFcdTUxNkRcdThGREJcdTUyMzZcbiAqL1xuZnVuY3Rpb24gYmluYXJ5VG9IZXgoYmluYXJ5OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRsZXQgaGV4ID0gJyc7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgYmluYXJ5Lmxlbmd0aDsgaSArPSA0KSB7XG5cdFx0aGV4ICs9IHBhcnNlSW50KGJpbmFyeS5zdWJzdHJpbmcoaSwgaSArIDQpLCAyKS50b1N0cmluZygxNik7XG5cdH1cblx0cmV0dXJuIGhleDtcbn1cblxuLyoqXG4gKiBcdThCQTFcdTdCOTdcdTkwMEZcdTY2MEVcdTU2RkVcdTUwQ0ZcdTc2ODRcdThGNkVcdTVFRDNcdTU0QzhcdTVFMENcdTMwMDJcbiAqIFx1NzZGNFx1NjNBNVx1NUJGOSBhbHBoYSBcdTg0OTlcdTcyNDhcdTkxQzdcdTY4MzdcdUZGMENcdTZCRDRcdTU3MjhcdTkwMEZcdTY2MEVcdTgwQ0NcdTY2NkZcdTRFMEFcdTUwNUFcdTcwNzBcdTVFQTZcdTU0QzhcdTVFMENcdTY2RjRcdTkwMDJcdTU0MDhcdTU2RkVcdTY4MDdcdTdDN0JcdTdEMjBcdTY3NTBcdTMwMDJcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUFscGhhTWFza0hhc2goc291cmNlOiBTb3VyY2VCaXRtYXApOiBzdHJpbmcge1xuXHRjb25zdCBTSVpFID0gMTY7XG5cdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRjYW52YXMud2lkdGggPSBTSVpFO1xuXHRjYW52YXMuaGVpZ2h0ID0gU0laRTtcblx0Y29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJykhO1xuXHRjdHguY2xlYXJSZWN0KDAsIDAsIFNJWkUsIFNJWkUpO1xuXHRjdHguZHJhd0ltYWdlKFxuXHRcdHNvdXJjZS5jYW52YXMsXG5cdFx0c291cmNlLmJvdW5kcy5sZWZ0LFxuXHRcdHNvdXJjZS5ib3VuZHMudG9wLFxuXHRcdHNvdXJjZS5ib3VuZHMud2lkdGgsXG5cdFx0c291cmNlLmJvdW5kcy5oZWlnaHQsXG5cdFx0MCxcblx0XHQwLFxuXHRcdFNJWkUsXG5cdFx0U0laRVxuXHQpO1xuXHRjb25zdCBkYXRhID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBTSVpFLCBTSVpFKS5kYXRhO1xuXHRsZXQgYmluYXJ5ID0gJyc7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkgKz0gNCkge1xuXHRcdGJpbmFyeSArPSBkYXRhW2kgKyAzXSA+IEFMUEhBX0NPTlRFTlRfVEhSRVNIT0xEID8gJzEnIDogJzAnO1xuXHR9XG5cdHJldHVybiBiaW5hcnlUb0hleChiaW5hcnkpO1xufVxuXG4vKipcbiAqIFx1OEJBMVx1N0I5N1x1OTAwRlx1NjYwRVx1NTZGRVx1NTBDRlx1NzY4NFx1N0M5N1x1OTg5Q1x1ODI3Mlx1N0I3RVx1NTQwRFx1MzAwMlxuICogXHU5ODlDXHU4MjcyXHU5MUNGXHU1MzE2XHU1NDBFXHU1M0VGXHU0RUU1XHU1QkI5XHU1RkNEXHU4RjdCXHU1RkFFXHU2Mjk3XHU5NTJGXHU5RjdGXHU1REVFXHU1RjAyXHVGRjBDXHU1NDBDXHU2NUY2XHU5MDdGXHU1MTREXHUyMDFDXHU1NDBDXHU4RjZFXHU1RUQzXHU0RTBEXHU1NDBDXHU5ODlDXHU4MjcyXHUyMDFEXHU4OEFCXHU1RjUzXHU2MjEwXHU1QjhDXHU1MTY4XHU5MUNEXHU1OTBEXHUzMDAyXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVRdWFudGl6ZWRDb2xvckhhc2goc291cmNlOiBTb3VyY2VCaXRtYXApOiBzdHJpbmcge1xuXHRjb25zdCB7IGRhdGEgfSA9IHNvdXJjZS5pbWFnZURhdGE7XG5cdGxldCB2aXNpYmxlUGl4ZWxzID0gMDtcblx0bGV0IHJUb3RhbCA9IDA7XG5cdGxldCBnVG90YWwgPSAwO1xuXHRsZXQgYlRvdGFsID0gMDtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpICs9IDQpIHtcblx0XHRjb25zdCBhbHBoYSA9IGRhdGFbaSArIDNdO1xuXHRcdGlmIChhbHBoYSA8PSBBTFBIQV9DT05URU5UX1RIUkVTSE9MRCkgY29udGludWU7XG5cblx0XHRyVG90YWwgKz0gZGF0YVtpXTtcblx0XHRnVG90YWwgKz0gZGF0YVtpICsgMV07XG5cdFx0YlRvdGFsICs9IGRhdGFbaSArIDJdO1xuXHRcdHZpc2libGVQaXhlbHMrKztcblx0fVxuXG5cdGlmICh2aXNpYmxlUGl4ZWxzID09PSAwKSB7XG5cdFx0cmV0dXJuICcwMDAnO1xuXHR9XG5cblx0Y29uc3QgcXVhbnRpemUgPSAodmFsdWU6IG51bWJlcik6IHN0cmluZyA9PiB7XG5cdFx0Y29uc3QgYnVja2V0ID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTUsIE1hdGgucm91bmQodmFsdWUgLyAxNykpKTtcblx0XHRyZXR1cm4gYnVja2V0LnRvU3RyaW5nKDE2KTtcblx0fTtcblxuXHRyZXR1cm4gW1xuXHRcdHF1YW50aXplKHJUb3RhbCAvIHZpc2libGVQaXhlbHMpLFxuXHRcdHF1YW50aXplKGdUb3RhbCAvIHZpc2libGVQaXhlbHMpLFxuXHRcdHF1YW50aXplKGJUb3RhbCAvIHZpc2libGVQaXhlbHMpXG5cdF0uam9pbignJyk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW1hZ2VIYXNoIHtcblx0bW9kZTogJ29wYXF1ZScgfCAndHJhbnNwYXJlbnQnO1xuXHRoYXNoZXM6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFx1OEJBMVx1N0I5N1x1NTZGRVx1NzI0N1x1NTRDOFx1NUUwQ1x1MzAwMlxuICogXHU5MDBGXHU2NjBFXHU1NkZFXHU0RjE4XHU1MTQ4XHU0RjdGXHU3NTI4IGFscGhhIFx1ODQ5OVx1NzI0OFx1OEY2RVx1NUVEMyArIFx1N0M5N1x1OTg5Q1x1ODI3Mlx1N0I3RVx1NTQwRFx1RkYxQlx1NjY2RVx1OTAxQVx1NTZGRVx1N0VFN1x1N0VFRFx1NEY3Rlx1NzUyOCBwSGFzaCArIGRIYXNoXHUzMDAyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21wdXRlUGVyY2VwdHVhbEhhc2goaW1hZ2VTcmM6IHN0cmluZyk6IFByb21pc2U8SW1hZ2VIYXNoPiB7XG5cdGNvbnN0IGltZyA9IGF3YWl0IGxvYWRJbWFnZShpbWFnZVNyYyk7XG5cdGNvbnN0IHNvdXJjZSA9IGNhcHR1cmVTb3VyY2VCaXRtYXAoaW1nKTtcblxuXHRpZiAoc291cmNlLmhhc1RyYW5zcGFyZW5jeSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRtb2RlOiAndHJhbnNwYXJlbnQnLFxuXHRcdFx0aGFzaGVzOiBbXG5cdFx0XHRcdGNvbXB1dGVBbHBoYU1hc2tIYXNoKHNvdXJjZSksXG5cdFx0XHRcdGNvbXB1dGVRdWFudGl6ZWRDb2xvckhhc2goc291cmNlKVxuXHRcdFx0XVxuXHRcdH07XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdG1vZGU6ICdvcGFxdWUnLFxuXHRcdGhhc2hlczogW1xuXHRcdFx0Y29tcHV0ZVBIYXNoKHNvdXJjZSksXG5cdFx0XHRjb21wdXRlREhhc2goc291cmNlKVxuXHRcdF1cblx0fTtcbn1cblxuLyoqXG4gKiBcdTRFQ0UgQXJyYXlCdWZmZXIgXHU4QkExXHU3Qjk3XHU1NEM4XHU1RTBDXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjb21wdXRlSGFzaEZyb21CdWZmZXIoYnVmZmVyOiBBcnJheUJ1ZmZlciwgbWltZVR5cGU6IHN0cmluZyA9ICdpbWFnZS9wbmcnKTogUHJvbWlzZTxJbWFnZUhhc2g+IHtcblx0Y29uc3QgYmxvYiA9IG5ldyBCbG9iKFtidWZmZXJdLCB7IHR5cGU6IG1pbWVUeXBlIH0pO1xuXHRjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXHR0cnkge1xuXHRcdHJldHVybiBhd2FpdCBjb21wdXRlUGVyY2VwdHVhbEhhc2godXJsKTtcblx0fSBmaW5hbGx5IHtcblx0XHRVUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XG5cdH1cbn1cblxuLyoqXG4gKiBcdTUyQTBcdThGN0RcdTU2RkVcdTcyNDdcbiAqL1xuZnVuY3Rpb24gbG9hZEltYWdlKHNyYzogc3RyaW5nLCB0aW1lb3V0TXM6IG51bWJlciA9IERFRkFVTFRfSU1BR0VfTE9BRF9USU1FT1VUKTogUHJvbWlzZTxIVE1MSW1hZ2VFbGVtZW50PiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0Y29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG5cdFx0bGV0IHNldHRsZWQgPSBmYWxzZTtcblx0XHRjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0aWYgKHNldHRsZWQpIHJldHVybjtcblx0XHRcdHNldHRsZWQgPSB0cnVlO1xuXHRcdFx0Ly8gQmVzdC1lZmZvcnQgYWJvcnQgdG8gYXZvaWQgaGFuZ2luZyByZXF1ZXN0c1xuXHRcdFx0aW1nLnNyYyA9ICcnO1xuXHRcdFx0cmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgaW1hZ2UgKHRpbWVvdXQpOiAke3NyY31gKSk7XG5cdFx0fSwgdGltZW91dE1zKTtcblxuXHRcdC8vIGFwcDovLyAvIGZpbGU6Ly8gLyBibG9iOiBcdTdCNDlcdTY3MkNcdTU3MzBcdThENDRcdTZFOTBcdTRFMERcdTVFOTRcdTVGM0FcdTUyMzZcdThENzAgQ09SU1x1RkYwQ1xuXHRcdC8vIFx1NTQyNlx1NTIxOVx1NTcyOFx1OTBFOFx1NTIwNlx1NzNBRlx1NTg4M1x1NEUwQlx1NEYxQVx1NzZGNFx1NjNBNVx1ODlFNlx1NTNEMSBlcnJvclx1RkYwQ1x1NUJGQ1x1ODFGNFx1NTRDOFx1NUUwQ1x1OEJBMVx1N0I5N1x1NTkzMVx1OEQyNVx1MzAwMlxuXHRcdGlmICgvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KHNyYykpIHtcblx0XHRcdGltZy5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xuXHRcdH1cblx0XHRpbWcub25sb2FkID0gKCkgPT4ge1xuXHRcdFx0aWYgKHNldHRsZWQpIHJldHVybjtcblx0XHRcdHNldHRsZWQgPSB0cnVlO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVyKTtcblx0XHRcdHJlc29sdmUoaW1nKTtcblx0XHR9O1xuXHRcdGltZy5vbmVycm9yID0gKCkgPT4ge1xuXHRcdFx0aWYgKHNldHRsZWQpIHJldHVybjtcblx0XHRcdHNldHRsZWQgPSB0cnVlO1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVyKTtcblx0XHRcdHJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBsb2FkIGltYWdlOiAke3NyY31gKSk7XG5cdFx0fTtcblx0XHRpbWcuc3JjID0gc3JjO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBcdThCQTFcdTdCOTdcdTRFMjRcdTRFMkFcdTU0QzhcdTVFMENcdTc2ODRcdTZDNDlcdTY2MEVcdThERERcdTc5QkJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhbW1pbmdEaXN0YW5jZShoMTogc3RyaW5nLCBoMjogc3RyaW5nKTogbnVtYmVyIHtcblx0aWYgKGgxLmxlbmd0aCAhPT0gaDIubGVuZ3RoKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBIYXNoIGxlbmd0aCBtaXNtYXRjaDogJHtoMS5sZW5ndGh9IHZzICR7aDIubGVuZ3RofWApO1xuXHR9XG5cblx0bGV0IGRpc3RhbmNlID0gMDtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBoMS5sZW5ndGg7IGkrKykge1xuXHRcdGNvbnN0IG4xID0gcGFyc2VJbnQoaDFbaV0sIDE2KTtcblx0XHRjb25zdCBuMiA9IHBhcnNlSW50KGgyW2ldLCAxNik7XG5cdFx0bGV0IHhvciA9IG4xIF4gbjI7XG5cdFx0d2hpbGUgKHhvcikge1xuXHRcdFx0ZGlzdGFuY2UgKz0geG9yICYgMTtcblx0XHRcdHhvciA+Pj0gMTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZGlzdGFuY2U7XG59XG5cbi8qKlxuICogXHU4QkExXHU3Qjk3XHU0RTI0XHU0RTJBXHU1NEM4XHU1RTBDXHU3Njg0XHU3NkY4XHU0RjNDXHU1RUE2XHU3NjdFXHU1MjA2XHU2QkQ0XG4gKi9cbmZ1bmN0aW9uIGhhc2hTZWdtZW50U2ltaWxhcml0eShoMTogc3RyaW5nLCBoMjogc3RyaW5nKTogbnVtYmVyIHtcblx0Y29uc3QgdG90YWxCaXRzID0gaDEubGVuZ3RoICogNDsgLy8gXHU2QkNGXHU0RTJBIGhleCBcdTVCNTdcdTdCMjYgNCBiaXRzXG5cdGNvbnN0IGRpc3RhbmNlID0gaGFtbWluZ0Rpc3RhbmNlKGgxLCBoMik7XG5cdHJldHVybiBNYXRoLnJvdW5kKCgxIC0gZGlzdGFuY2UgLyB0b3RhbEJpdHMpICogMTAwKTtcbn1cblxuLyoqXG4gKiBcdThCQTFcdTdCOTdcdTRFMjRcdTRFMkFcdTU2RkVcdTcyNDdcdTU0QzhcdTVFMENcdTc2ODRcdTc2RjhcdTRGM0NcdTVFQTZcdTc2N0VcdTUyMDZcdTZCRDRcdTMwMDJcbiAqIFx1OTAwRlx1NjYwRVx1NTZGRVx1NjZGNFx1NzcwQlx1OTFDRFx1OEY2RVx1NUVEM1x1RkYwQ1x1NEUwMFx1ODIyQ1x1NTZGRVx1NzI0N1x1NkNCRlx1NzUyOFx1NTM5Rlx1Njc2NVx1NzY4NCBwSGFzaCArIGRIYXNoIFx1N0VDNFx1NTQwOFx1MzAwMlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzaFNpbWlsYXJpdHkoaDE6IEltYWdlSGFzaCwgaDI6IEltYWdlSGFzaCk6IG51bWJlciB7XG5cdGlmIChoMS5tb2RlICE9PSBoMi5tb2RlKSB7XG5cdFx0cmV0dXJuIDA7XG5cdH1cblxuXHRpZiAoaDEubW9kZSA9PT0gJ3RyYW5zcGFyZW50Jykge1xuXHRcdGNvbnN0IHNoYXBlU2ltaWxhcml0eSA9IGhhc2hTZWdtZW50U2ltaWxhcml0eShoMS5oYXNoZXNbMF0sIGgyLmhhc2hlc1swXSk7XG5cdFx0Y29uc3QgY29sb3JTaW1pbGFyaXR5ID0gaGFzaFNlZ21lbnRTaW1pbGFyaXR5KGgxLmhhc2hlc1sxXSwgaDIuaGFzaGVzWzFdKTtcblx0XHRyZXR1cm4gTWF0aC5yb3VuZChzaGFwZVNpbWlsYXJpdHkgKiAwLjggKyBjb2xvclNpbWlsYXJpdHkgKiAwLjIpO1xuXHR9XG5cblx0Y29uc3QgcEhhc2hTaW1pbGFyaXR5ID0gaGFzaFNlZ21lbnRTaW1pbGFyaXR5KGgxLmhhc2hlc1swXSwgaDIuaGFzaGVzWzBdKTtcblx0Y29uc3QgZEhhc2hTaW1pbGFyaXR5ID0gaGFzaFNlZ21lbnRTaW1pbGFyaXR5KGgxLmhhc2hlc1sxXSwgaDIuaGFzaGVzWzFdKTtcblx0cmV0dXJuIE1hdGgucm91bmQoKHBIYXNoU2ltaWxhcml0eSArIGRIYXNoU2ltaWxhcml0eSkgLyAyKTtcbn1cblxuLyoqXG4gKiBcdTkxQ0RcdTU5MERcdTdFQzRcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEdXBsaWNhdGVHcm91cCB7XG5cdGhhc2g6IEltYWdlSGFzaDtcblx0ZmlsZXM6IEFycmF5PHsgcGF0aDogc3RyaW5nOyBoYXNoOiBJbWFnZUhhc2g7IHNpbWlsYXJpdHk6IG51bWJlciB9Pjtcbn1cblxuLyoqXG4gKiBcdTRFQ0VcdTU0QzhcdTVFMENcdTY2MjBcdTVDMDRcdTRFMkRcdTY3RTVcdTYyN0VcdTkxQ0RcdTU5MERcdTdFQzRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmREdXBsaWNhdGVHcm91cHMoXG5cdGhhc2hNYXA6IE1hcDxzdHJpbmcsIEltYWdlSGFzaD4sXG5cdHRocmVzaG9sZDogbnVtYmVyID0gOTBcbik6IER1cGxpY2F0ZUdyb3VwW10ge1xuXHRjb25zdCBlbnRyaWVzID0gQXJyYXkuZnJvbShoYXNoTWFwLmVudHJpZXMoKSk7XG5cdGNvbnN0IHZpc2l0ZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcblx0Y29uc3QgZ3JvdXBzOiBEdXBsaWNhdGVHcm91cFtdID0gW107XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y29uc3QgW3BhdGgxLCBoYXNoMV0gPSBlbnRyaWVzW2ldO1xuXHRcdGlmICh2aXNpdGVkLmhhcyhwYXRoMSkpIGNvbnRpbnVlO1xuXG5cdFx0Y29uc3QgZ3JvdXA6IER1cGxpY2F0ZUdyb3VwID0ge1xuXHRcdFx0aGFzaDogaGFzaDEsXG5cdFx0XHRmaWxlczogW3sgcGF0aDogcGF0aDEsIGhhc2g6IGhhc2gxLCBzaW1pbGFyaXR5OiAxMDAgfV1cblx0XHR9O1xuXG5cdFx0Zm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgZW50cmllcy5sZW5ndGg7IGorKykge1xuXHRcdFx0Y29uc3QgW3BhdGgyLCBoYXNoMl0gPSBlbnRyaWVzW2pdO1xuXHRcdFx0aWYgKHZpc2l0ZWQuaGFzKHBhdGgyKSkgY29udGludWU7XG5cblx0XHRcdGNvbnN0IHNpbWlsYXJpdHkgPSBoYXNoU2ltaWxhcml0eShoYXNoMSwgaGFzaDIpO1xuXHRcdFx0aWYgKHNpbWlsYXJpdHkgPj0gdGhyZXNob2xkKSB7XG5cdFx0XHRcdGdyb3VwLmZpbGVzLnB1c2goeyBwYXRoOiBwYXRoMiwgaGFzaDogaGFzaDIsIHNpbWlsYXJpdHkgfSk7XG5cdFx0XHRcdHZpc2l0ZWQuYWRkKHBhdGgyKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZ3JvdXAuZmlsZXMubGVuZ3RoID4gMSkge1xuXHRcdFx0dmlzaXRlZC5hZGQocGF0aDEpO1xuXHRcdFx0Z3JvdXBzLnB1c2goZ3JvdXApO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBncm91cHM7XG59XG4iLCAiLyoqXG4gKiBcdTk0RkVcdTYzQTVcdTY2RjRcdTY1QjBcdTVERTVcdTUxNzdcbiAqIFx1NzUyOFx1NEU4RVx1NTcyOFx1NjU4N1x1NEVGNlx1NzlGQlx1NTJBOFx1NjIxNlx1NTIyMFx1OTY2NFx1NjVGNlx1NjMwOSBPYnNpZGlhbiBcdTc2ODRcdTc3MUZcdTVCOUVcdTg5RTNcdTY3OTBcdTdFRDNcdTY3OUNcdTY2RjRcdTY1QjBcdTdCMTRcdThCQjBcdTRFMkRcdTc2ODRcdTVGMTVcdTc1MjhcbiAqL1xuXG5pbXBvcnQgeyBBcHAsIFRGaWxlLCBwYXJzZUxpbmt0ZXh0IH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgZ2V0RmlsZU5hbWVGcm9tUGF0aCwgZ2V0UGFyZW50UGF0aCwgbm9ybWFsaXplVmF1bHRQYXRoLCBzYWZlRGVjb2RlVVJJQ29tcG9uZW50IH0gZnJvbSAnLi9wYXRoJztcblxuY29uc3QgV0lLSV9MSU5LX1BBVFRFUk4gPSAvKCE/XFxbXFxbKShbXlxcXXxdKykoXFx8W15cXF1dKik/KFxcXVxcXSkvZztcbmNvbnN0IE1BUktET1dOX0xJTktfUEFUVEVSTiA9IC8oIT9cXFtbXlxcXV0qXFxdXFwoKShbXildKykoXFwpKS9nO1xudHlwZSBMaW5rUGF0aFN0eWxlID0gJ2Jhc2VuYW1lJyB8ICdyZWxhdGl2ZScgfCAndmF1bHQnIHwgJ2Fic29sdXRlJztcblxuLyoqXG4gKiBcdTY2RjRcdTY1QjBcdTYyNDBcdTY3MDlcdTdCMTRcdThCQjBcdTRFMkRcdTc2ODRcdTY1ODdcdTRFRjZcdTk0RkVcdTYzQTVcbiAqIEBwYXJhbSBhcHAgT2JzaWRpYW4gYXBwIFx1NUI5RVx1NEY4QlxuICogQHBhcmFtIG9sZFBhdGggXHU2NUU3XHU2NTg3XHU0RUY2XHU4REVGXHU1Rjg0XG4gKiBAcGFyYW0gbmV3UGF0aCBcdTY1QjBcdTY1ODdcdTRFRjZcdThERUZcdTVGODRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUxpbmtzSW5WYXVsdChcblx0YXBwOiBBcHAsXG5cdG9sZFBhdGg6IHN0cmluZyxcblx0bmV3UGF0aDogc3RyaW5nXG4pOiBQcm9taXNlPG51bWJlcj4ge1xuXHRjb25zdCBub3JtYWxpemVkT2xkUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChvbGRQYXRoKS50b0xvd2VyQ2FzZSgpO1xuXHRjb25zdCBub3JtYWxpemVkTmV3UGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChuZXdQYXRoKTtcblx0aWYgKCFub3JtYWxpemVkT2xkUGF0aCB8fCAhbm9ybWFsaXplZE5ld1BhdGggfHwgbm9ybWFsaXplZE9sZFBhdGggPT09IG5vcm1hbGl6ZWROZXdQYXRoLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRyZXR1cm4gMDtcblx0fVxuXG5cdGNvbnN0IG5ld0ZpbGUgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWROZXdQYXRoKTtcblx0aWYgKCEobmV3RmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuXHRcdHJldHVybiAwO1xuXHR9XG5cblx0Y29uc3QgbWFya2Rvd25GaWxlcyA9IGFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG5cdGxldCB1cGRhdGVkQ291bnQgPSAwO1xuXG5cdGZvciAoY29uc3QgZmlsZSBvZiBtYXJrZG93bkZpbGVzKSB7XG5cdFx0Y29uc3QgY29udGVudCA9IGF3YWl0IGFwcC52YXVsdC5yZWFkKGZpbGUpO1xuXHRcdGNvbnN0IG5ld0NvbnRlbnQgPSB1cGRhdGVMaW5rc0luQ29udGVudChhcHAsIGZpbGUsIGNvbnRlbnQsIG5vcm1hbGl6ZWRPbGRQYXRoLCBuZXdGaWxlKTtcblxuXHRcdGlmIChuZXdDb250ZW50ICE9PSBjb250ZW50KSB7XG5cdFx0XHRhd2FpdCBhcHAudmF1bHQubW9kaWZ5KGZpbGUsIG5ld0NvbnRlbnQpO1xuXHRcdFx0dXBkYXRlZENvdW50Kys7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHVwZGF0ZWRDb3VudDtcbn1cblxuLyoqXG4gKiBcdTY2RjRcdTY1QjBcdTY1ODdcdTY3MkNcdTUxODVcdTVCQjlcdTRFMkRcdTc2ODRcdTY1ODdcdTRFRjZcdTk0RkVcdTYzQTVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUxpbmtzSW5Db250ZW50KFxuXHRhcHA6IEFwcCxcblx0c291cmNlRmlsZTogVEZpbGUsXG5cdGNvbnRlbnQ6IHN0cmluZyxcblx0b2xkUGF0aDogc3RyaW5nLFxuXHRuZXdGaWxlOiBURmlsZVxuKTogc3RyaW5nIHtcblx0Y29uc3Qgbm9ybWFsaXplZE5ld1BhdGggPSBub3JtYWxpemVWYXVsdFBhdGgobmV3RmlsZS5wYXRoKTtcblxuXHRjb250ZW50ID0gY29udGVudC5yZXBsYWNlKFdJS0lfTElOS19QQVRURVJOLCAoZnVsbE1hdGNoLCBwcmVmaXgsIGxpbmt0ZXh0LCBhbGlhcyA9ICcnLCBzdWZmaXgpID0+IHtcblx0XHRjb25zdCBwYXJzZWQgPSBwYXJzZUxpbmt0ZXh0KGxpbmt0ZXh0KTtcblx0XHRjb25zdCByZXNvbHZlZFBhdGggPSByZXNvbHZlTGlua0Rlc3RpbmF0aW9uKGFwcCwgcGFyc2VkLnBhdGgsIHNvdXJjZUZpbGUucGF0aCk7XG5cdFx0aWYgKCFzaG91bGRSZXdyaXRlTGluayhwYXJzZWQucGF0aCwgcmVzb2x2ZWRQYXRoLCBvbGRQYXRoKSkge1xuXHRcdFx0cmV0dXJuIGZ1bGxNYXRjaDtcblx0XHR9XG5cblx0XHRjb25zdCByZXBsYWNlbWVudExpbmtQYXRoID0gY29tcG9zZVJlcGxhY2VtZW50UGF0aChwYXJzZWQucGF0aCwgc291cmNlRmlsZS5wYXRoLCBub3JtYWxpemVkTmV3UGF0aCk7XG5cdFx0cmV0dXJuIGAke3ByZWZpeH0ke3JlcGxhY2VtZW50TGlua1BhdGh9JHtwYXJzZWQuc3VicGF0aCB8fCAnJ30ke2FsaWFzfSR7c3VmZml4fWA7XG5cdH0pO1xuXG5cdGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoTUFSS0RPV05fTElOS19QQVRURVJOLCAoZnVsbE1hdGNoLCBwcmVmaXgsIGRlc3RpbmF0aW9uLCBzdWZmaXgpID0+IHtcblx0XHRjb25zdCBwYXJzZWQgPSBwYXJzZU1hcmtkb3duRGVzdGluYXRpb24oZGVzdGluYXRpb24pO1xuXHRcdGNvbnN0IHJlc29sdmVkUGF0aCA9IHJlc29sdmVMaW5rRGVzdGluYXRpb24oYXBwLCBwYXJzZWQucGF0aCwgc291cmNlRmlsZS5wYXRoKTtcblx0XHRpZiAoIXNob3VsZFJld3JpdGVMaW5rKHBhcnNlZC5wYXRoLCByZXNvbHZlZFBhdGgsIG9sZFBhdGgpKSB7XG5cdFx0XHRyZXR1cm4gZnVsbE1hdGNoO1xuXHRcdH1cblxuXHRcdGNvbnN0IG5leHREZXN0aW5hdGlvbiA9IGZvcm1hdE1hcmtkb3duRGVzdGluYXRpb24oXG5cdFx0XHRjb21wb3NlUmVwbGFjZW1lbnRQYXRoKHBhcnNlZC5wYXRoLCBzb3VyY2VGaWxlLnBhdGgsIG5vcm1hbGl6ZWROZXdQYXRoKSxcblx0XHRcdHBhcnNlZC5zdWZmaXgsXG5cdFx0XHRwYXJzZWQuaXNXcmFwcGVkXG5cdFx0KTtcblx0XHRyZXR1cm4gYCR7cHJlZml4fSR7bmV4dERlc3RpbmF0aW9ufSR7c3VmZml4fWA7XG5cdH0pO1xuXG5cdHJldHVybiBjb250ZW50O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlTGlua0Rlc3RpbmF0aW9uKGFwcDogQXBwLCByYXdMaW5rUGF0aDogc3RyaW5nLCBzb3VyY2VQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRsZXQgY2FuZGlkYXRlID0gcmF3TGlua1BhdGgudHJpbSgpO1xuXHRpZiAoIWNhbmRpZGF0ZSkge1xuXHRcdHJldHVybiAnJztcblx0fVxuXG5cdGNhbmRpZGF0ZSA9IGNhbmRpZGF0ZS5yZXBsYWNlKC9cXFxcIC9nLCAnICcpO1xuXHRjYW5kaWRhdGUgPSBzYWZlRGVjb2RlVVJJQ29tcG9uZW50KGNhbmRpZGF0ZSk7XG5cblx0aWYgKC9eW2Etel1bYS16MC05Ky4tXSo6L2kudGVzdChjYW5kaWRhdGUpKSB7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cblx0Y29uc3Qgbm9ybWFsaXplZENhbmRpZGF0ZSA9IG5vcm1hbGl6ZVZhdWx0UGF0aChjYW5kaWRhdGUpO1xuXHRjb25zdCByZXNvbHZlZCA9IGFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KG5vcm1hbGl6ZWRDYW5kaWRhdGUgfHwgY2FuZGlkYXRlLCBzb3VyY2VQYXRoKTtcblx0Y29uc3QgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZWQgPyByZXNvbHZlZC5wYXRoIDogbm9ybWFsaXplZENhbmRpZGF0ZTtcblx0cmV0dXJuIG5vcm1hbGl6ZVZhdWx0UGF0aChyZXNvbHZlZFBhdGgpLnRvTG93ZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlTWFya2Rvd25EZXN0aW5hdGlvbihkZXN0aW5hdGlvbjogc3RyaW5nKToge1xuXHRwYXRoOiBzdHJpbmc7XG5cdHN1ZmZpeDogc3RyaW5nO1xuXHRpc1dyYXBwZWQ6IGJvb2xlYW47XG59IHtcblx0bGV0IG5vcm1hbGl6ZWQgPSBkZXN0aW5hdGlvbi50cmltKCk7XG5cdGNvbnN0IGlzV3JhcHBlZCA9IG5vcm1hbGl6ZWQuc3RhcnRzV2l0aCgnPCcpICYmIG5vcm1hbGl6ZWQuZW5kc1dpdGgoJz4nKTtcblxuXHRpZiAoaXNXcmFwcGVkKSB7XG5cdFx0bm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQuc2xpY2UoMSwgLTEpLnRyaW0oKTtcblx0fVxuXG5cdG5vcm1hbGl6ZWQgPSBub3JtYWxpemVkLnJlcGxhY2UoL1xcXFwgL2csICcgJyk7XG5cdGNvbnN0IG1hdGNoID0gbm9ybWFsaXplZC5tYXRjaCgvXltePyNdKi8pO1xuXHRjb25zdCBwYXRoID0gbWF0Y2ggPyBtYXRjaFswXSA6IG5vcm1hbGl6ZWQ7XG5cdGNvbnN0IHN1ZmZpeCA9IG5vcm1hbGl6ZWQuc2xpY2UocGF0aC5sZW5ndGgpO1xuXG5cdHJldHVybiB7XG5cdFx0cGF0aCxcblx0XHRzdWZmaXgsXG5cdFx0aXNXcmFwcGVkXG5cdH07XG59XG5cbmZ1bmN0aW9uIGZvcm1hdE1hcmtkb3duRGVzdGluYXRpb24obGlua1BhdGg6IHN0cmluZywgc3VmZml4OiBzdHJpbmcsIGlzV3JhcHBlZDogYm9vbGVhbik6IHN0cmluZyB7XG5cdGNvbnN0IGNvbWJpbmVkID0gYCR7bGlua1BhdGh9JHtzdWZmaXh9YDtcblx0aWYgKGlzV3JhcHBlZCkge1xuXHRcdHJldHVybiBgPCR7Y29tYmluZWR9PmA7XG5cdH1cblx0cmV0dXJuIGNvbWJpbmVkLnJlcGxhY2UoLyAvZywgJ1xcXFwgJyk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFJld3JpdGVMaW5rKHJhd1BhdGg6IHN0cmluZywgcmVzb2x2ZWRQYXRoOiBzdHJpbmcsIG9sZFBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRpZiAocmVzb2x2ZWRQYXRoID09PSBvbGRQYXRoKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHQvLyBcdTUxNUNcdTVFOTVcdUZGMUFcdTVGNTNcdTk0RkVcdTYzQTVcdTY2MkZcdTg4RjhcdTY1ODdcdTRFRjZcdTU0MERcdUZGMDhcdTRGOEJcdTU5ODIgW1ttb29uLWEuanBnXV1cdUZGMDlcdTRFMTRcdTRFMEVcdTY1RTdcdTY1ODdcdTRFRjZcdTU0MENcdTU0MERcdTY1RjZcdUZGMENcblx0Ly8gXHU1MzczXHU0RjdGIG1ldGFkYXRhQ2FjaGUgXHU1NkUwXHU1NDBDXHU1NDBEXHU2NTg3XHU0RUY2XHU2QjY3XHU0RTQ5XHU4RkQ0XHU1NkRFXHU0RTg2XHU1MTc2XHU0RUQ2XHU3NkVFXHU2ODA3XHVGRjBDXHU0RTVGXHU2MzA5XHU2NUU3XHU2NTg3XHU0RUY2XHU1OTA0XHU3NDA2XHUzMDAyXG5cdGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVWYXVsdFBhdGgoc2FmZURlY29kZVVSSUNvbXBvbmVudChyYXdQYXRoKS5yZXBsYWNlKC9cXFxcIC9nLCAnICcpKS50b0xvd2VyQ2FzZSgpO1xuXHRpZiAoIW5vcm1hbGl6ZWQgfHwgbm9ybWFsaXplZC5pbmNsdWRlcygnLycpKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Y29uc3Qgb2xkQmFzZSA9IGdldEZpbGVOYW1lRnJvbVBhdGgob2xkUGF0aCkudG9Mb3dlckNhc2UoKTtcblx0cmV0dXJuIG5vcm1hbGl6ZWQgPT09IG9sZEJhc2U7XG59XG5cbmZ1bmN0aW9uIGNvbXBvc2VSZXBsYWNlbWVudFBhdGgocmF3UGF0aDogc3RyaW5nLCBzb3VyY2VQYXRoOiBzdHJpbmcsIG5ld1BhdGg6IHN0cmluZyk6IHN0cmluZyB7XG5cdGNvbnN0IHN0eWxlID0gZGV0ZWN0TGlua1BhdGhTdHlsZShyYXdQYXRoKTtcblx0c3dpdGNoIChzdHlsZSkge1xuXHRcdGNhc2UgJ2Jhc2VuYW1lJzpcblx0XHRcdHJldHVybiBnZXRGaWxlTmFtZUZyb21QYXRoKG5ld1BhdGgpIHx8IG5ld1BhdGg7XG5cdFx0Y2FzZSAncmVsYXRpdmUnOlxuXHRcdFx0cmV0dXJuIHRvUmVsYXRpdmVWYXVsdFBhdGgoc291cmNlUGF0aCwgbmV3UGF0aCkgfHwgZ2V0RmlsZU5hbWVGcm9tUGF0aChuZXdQYXRoKSB8fCBuZXdQYXRoO1xuXHRcdGNhc2UgJ2Fic29sdXRlJzpcblx0XHRcdHJldHVybiBgLyR7bmV3UGF0aH1gO1xuXHRcdGNhc2UgJ3ZhdWx0Jzpcblx0XHRkZWZhdWx0OlxuXHRcdFx0cmV0dXJuIG5ld1BhdGg7XG5cdH1cbn1cblxuZnVuY3Rpb24gZGV0ZWN0TGlua1BhdGhTdHlsZShyYXdQYXRoOiBzdHJpbmcpOiBMaW5rUGF0aFN0eWxlIHtcblx0Y29uc3QgdHJpbW1lZCA9IFN0cmluZyhyYXdQYXRoIHx8ICcnKS50cmltKCk7XG5cdGlmICghdHJpbW1lZCkgcmV0dXJuICdiYXNlbmFtZSc7XG5cdGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoJy8nKSkgcmV0dXJuICdhYnNvbHV0ZSc7XG5cdGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoJy4vJykgfHwgdHJpbW1lZC5zdGFydHNXaXRoKCcuLi8nKSkgcmV0dXJuICdyZWxhdGl2ZSc7XG5cblx0Y29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh0cmltbWVkKTtcblx0aWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJy8nKSkge1xuXHRcdHJldHVybiAndmF1bHQnO1xuXHR9XG5cdHJldHVybiAnYmFzZW5hbWUnO1xufVxuXG5mdW5jdGlvbiB0b1JlbGF0aXZlVmF1bHRQYXRoKHNvdXJjZVBhdGg6IHN0cmluZywgdGFyZ2V0UGF0aDogc3RyaW5nKTogc3RyaW5nIHtcblx0Y29uc3QgZnJvbURpciA9IG5vcm1hbGl6ZVZhdWx0UGF0aChnZXRQYXJlbnRQYXRoKHNvdXJjZVBhdGgpKTtcblx0Y29uc3QgdG8gPSBub3JtYWxpemVWYXVsdFBhdGgodGFyZ2V0UGF0aCk7XG5cdGlmICghdG8pIHJldHVybiAnJztcblxuXHRjb25zdCBmcm9tUGFydHMgPSBmcm9tRGlyID8gZnJvbURpci5zcGxpdCgnLycpIDogW107XG5cdGNvbnN0IHRvUGFydHMgPSB0by5zcGxpdCgnLycpO1xuXG5cdGxldCBjb21tb24gPSAwO1xuXHR3aGlsZSAoXG5cdFx0Y29tbW9uIDwgZnJvbVBhcnRzLmxlbmd0aCAmJlxuXHRcdGNvbW1vbiA8IHRvUGFydHMubGVuZ3RoICYmXG5cdFx0ZnJvbVBhcnRzW2NvbW1vbl0gPT09IHRvUGFydHNbY29tbW9uXVxuXHQpIHtcblx0XHRjb21tb24rKztcblx0fVxuXG5cdGNvbnN0IHVwQ291bnQgPSBmcm9tUGFydHMubGVuZ3RoIC0gY29tbW9uO1xuXHRjb25zdCBwYXJ0czogc3RyaW5nW10gPSBbXTtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCB1cENvdW50OyBpKyspIHtcblx0XHRwYXJ0cy5wdXNoKCcuLicpO1xuXHR9XG5cdHBhcnRzLnB1c2goLi4udG9QYXJ0cy5zbGljZShjb21tb24pKTtcblxuXHRyZXR1cm4gcGFydHMuam9pbignLycpO1xufVxuIiwgImltcG9ydCB7IE1vZGFsLCBOb3RpY2UsIFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IEltYWdlTWFuYWdlclBsdWdpbiBmcm9tICcuLi9tYWluJztcbmltcG9ydCB7IGdldERvY3VtZW50RGlzcGxheUxhYmVsLCBnZXRNZWRpYVR5cGUgfSBmcm9tICcuLi91dGlscy9tZWRpYVR5cGVzJztcblxuZXhwb3J0IGNsYXNzIE1lZGlhUHJldmlld01vZGFsIGV4dGVuZHMgTW9kYWwge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0ZmlsZTogVEZpbGU7XG5cdGN1cnJlbnRJbmRleDogbnVtYmVyID0gMDtcblx0YWxsRmlsZXM6IFRGaWxlW10gPSBbXTtcblx0cHJpdmF0ZSBrZXlkb3duSGFuZGxlcjogKChlOiBLZXlib2FyZEV2ZW50KSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuXG5cdGNvbnN0cnVjdG9yKGFwcDogYW55LCBwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbiwgZmlsZTogVEZpbGUsIGFsbEZpbGVzOiBURmlsZVtdID0gW10pIHtcblx0XHRzdXBlcihhcHApO1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHRcdHRoaXMuZmlsZSA9IGZpbGU7XG5cdFx0dGhpcy5hbGxGaWxlcyA9IGFsbEZpbGVzLmxlbmd0aCA+IDAgPyBhbGxGaWxlcyA6IFtmaWxlXTtcblx0XHRjb25zdCBpZHggPSB0aGlzLmFsbEZpbGVzLmZpbmRJbmRleChmID0+IGYucGF0aCA9PT0gZmlsZS5wYXRoKTtcblx0XHR0aGlzLmN1cnJlbnRJbmRleCA9IGlkeCA+PSAwID8gaWR4IDogMDtcblx0fVxuXG5cdG9uT3BlbigpIHtcblx0XHRjb25zdCB7IGNvbnRlbnRFbCwgbW9kYWxFbCB9ID0gdGhpcztcblx0XHRtb2RhbEVsLmFkZENsYXNzKCdtZWRpYS1wcmV2aWV3LW1vZGFsJyk7XG5cblx0XHQvLyBcdTUxNzNcdTk1RURcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBjbG9zZUJ0biA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdwcmV2aWV3LWNsb3NlJyB9KTtcblx0XHRjbG9zZUJ0bi50ZXh0Q29udGVudCA9ICdcdTAwRDcnO1xuXHRcdGNsb3NlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jbG9zZSgpKTtcblxuXHRcdC8vIFx1NUE5Mlx1NEY1M1x1NUJCOVx1NTY2OFxuXHRcdGNvbnN0IGNvbnRhaW5lciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdwcmV2aWV3LWNvbnRhaW5lcicgfSk7XG5cblx0XHQvLyBcdTZFMzJcdTY3RDNcdTVBOTJcdTRGNTNcblx0XHR0aGlzLnJlbmRlck1lZGlhKGNvbnRhaW5lcik7XG5cblx0XHQvLyBcdTVCRkNcdTgyMkFcdTYzQTdcdTRFRjZcdUZGMDhcdTU5ODJcdTY3OUNcdTY3MDlcdTU5MUFcdTVGMjBcdTU2RkVcdTcyNDdcdUZGMDlcblx0XHRpZiAodGhpcy5hbGxGaWxlcy5sZW5ndGggPiAxKSB7XG5cdFx0XHR0aGlzLnJlbmRlck5hdmlnYXRpb24oY29udGFpbmVyKTtcblx0XHR9XG5cblx0XHQvLyBcdTRGRTFcdTYwNkZcdTY4MEZcblx0XHR0aGlzLnJlbmRlckluZm9CYXIoY29udGVudEVsKTtcblxuXHRcdC8vIFx1OTUyRVx1NzZEOFx1NUJGQ1x1ODIyQVx1RkYwOFx1NjgzOVx1NjM2RVx1OEJCRVx1N0Y2RVx1NTFCM1x1NUI5QVx1NjYyRlx1NTQyNlx1NTQyRlx1NzUyOFx1RkYwOVxuXHRcdGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVLZXlib2FyZE5hdikge1xuXHRcdFx0dGhpcy5yZWdpc3RlcktleWJvYXJkTmF2KCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NUE5Mlx1NEY1M1xuXHQgKi9cblx0cmVuZGVyTWVkaWEoY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuXHRcdGNvbnRhaW5lci5lbXB0eSgpO1xuXHRcdGNvbnN0IGZpbGUgPSB0aGlzLmFsbEZpbGVzW3RoaXMuY3VycmVudEluZGV4XTtcblx0XHRjb25zdCBleHQgPSBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xuXHRcdGNvbnN0IG1lZGlhVHlwZSA9IGdldE1lZGlhVHlwZShmaWxlLm5hbWUpO1xuXHRcdGNvbnN0IGlzSW1hZ2UgPSBtZWRpYVR5cGUgPT09ICdpbWFnZSc7XG5cdFx0Y29uc3QgaXNWaWRlbyA9IG1lZGlhVHlwZSA9PT0gJ3ZpZGVvJztcblx0XHRjb25zdCBpc0F1ZGlvID0gbWVkaWFUeXBlID09PSAnYXVkaW8nO1xuXHRcdGNvbnN0IGlzRG9jdW1lbnQgPSBtZWRpYVR5cGUgPT09ICdkb2N1bWVudCc7XG5cdFx0Y29uc3QgaXNQZGYgPSBleHQgPT09ICdwZGYnO1xuXG5cdFx0aWYgKGlzSW1hZ2UpIHtcblx0XHRcdGNvbnN0IGltZyA9IGNvbnRhaW5lci5jcmVhdGVFbCgnaW1nJywge1xuXHRcdFx0XHRjbHM6ICdwcmV2aWV3LWltYWdlJyxcblx0XHRcdFx0YXR0cjogeyBzcmM6IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKSB9XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gXHU1NkZFXHU3MjQ3XHU1MkEwXHU4RjdEXHU1OTMxXHU4RDI1XHU2NUY2XHU2NjNFXHU3OTNBXHU5NTE5XHU4QkVGXHU3MkI2XHU2MDAxXG5cdFx0XHRpbWcuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoKSA9PiB7XG5cdFx0XHRcdGNvbnRhaW5lci5lbXB0eSgpO1xuXHRcdFx0XHRjb250YWluZXIuY3JlYXRlRGl2KHtcblx0XHRcdFx0XHRjbHM6ICdwcmV2aWV3LWVycm9yJyxcblx0XHRcdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdpbWFnZUxvYWRFcnJvcicpIHx8ICdGYWlsZWQgdG8gbG9hZCBpbWFnZSdcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2UgaWYgKGlzVmlkZW8pIHtcblx0XHRcdGNvbnN0IHZpZGVvID0gY29udGFpbmVyLmNyZWF0ZUVsKCd2aWRlbycsIHtcblx0XHRcdFx0Y2xzOiAncHJldmlldy12aWRlbycsXG5cdFx0XHRcdGF0dHI6IHsgY29udHJvbHM6ICd0cnVlJyB9XG5cdFx0XHR9KTtcblx0XHRcdHZpZGVvLnNyYyA9IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcblx0XHR9IGVsc2UgaWYgKGlzQXVkaW8pIHtcblx0XHRcdGNvbnN0IGF1ZGlvID0gY29udGFpbmVyLmNyZWF0ZUVsKCdhdWRpbycsIHtcblx0XHRcdFx0Y2xzOiAncHJldmlldy1hdWRpbycsXG5cdFx0XHRcdGF0dHI6IHsgY29udHJvbHM6ICd0cnVlJyB9XG5cdFx0XHR9KTtcblx0XHRcdGF1ZGlvLnNyYyA9IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcblx0XHR9IGVsc2UgaWYgKGlzUGRmKSB7XG5cdFx0XHRjb25zdCBpZnJhbWUgPSBjb250YWluZXIuY3JlYXRlRWwoJ2lmcmFtZScsIHtcblx0XHRcdFx0Y2xzOiAncHJldmlldy1wZGYnLFxuXHRcdFx0XHRhdHRyOiB7XG5cdFx0XHRcdFx0c3JjOiB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSksXG5cdFx0XHRcdFx0c2FuZGJveDogJ2FsbG93LXNjcmlwdHMnXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0gZWxzZSBpZiAoaXNEb2N1bWVudCkge1xuXHRcdFx0Y29uc3QgdW5zdXBwb3J0ZWQgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAncHJldmlldy11bnN1cHBvcnRlZCcgfSk7XG5cdFx0XHR1bnN1cHBvcnRlZC5jcmVhdGVEaXYoeyB0ZXh0OiBnZXREb2N1bWVudERpc3BsYXlMYWJlbChmaWxlLm5hbWUpIH0pO1xuXHRcdFx0dW5zdXBwb3J0ZWQuY3JlYXRlRGl2KHsgdGV4dDogdGhpcy5wbHVnaW4udCgndW5zdXBwb3J0ZWRGaWxlVHlwZScpIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAncHJldmlldy11bnN1cHBvcnRlZCcsIHRleHQ6IHRoaXMucGx1Z2luLnQoJ3Vuc3VwcG9ydGVkRmlsZVR5cGUnKSB9KTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTMyXHU2N0QzXHU1QkZDXHU4MjJBXHU2M0E3XHU0RUY2XG5cdCAqL1xuXHRyZW5kZXJOYXZpZ2F0aW9uKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcblx0XHRjb25zdCBuYXYgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAncHJldmlldy1uYXYnIH0pO1xuXG5cdFx0Ly8gXHU0RTBBXHU0RTAwXHU1RjIwXG5cdFx0Y29uc3QgcHJldkJ0biA9IG5hdi5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICduYXYtYnV0dG9uIHByZXYnIH0pO1xuXHRcdHByZXZCdG4udGV4dENvbnRlbnQgPSAnXHUyMDM5Jztcblx0XHRwcmV2QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHR0aGlzLnByZXYoKTtcblx0XHR9KTtcblxuXHRcdC8vIFx1OTg3NVx1NzgwMVxuXHRcdG5hdi5jcmVhdGVTcGFuKHtcblx0XHRcdHRleHQ6IGAke3RoaXMuY3VycmVudEluZGV4ICsgMX0gLyAke3RoaXMuYWxsRmlsZXMubGVuZ3RofWAsXG5cdFx0XHRjbHM6ICduYXYtaW5mbydcblx0XHR9KTtcblxuXHRcdC8vIFx1NEUwQlx1NEUwMFx1NUYyMFxuXHRcdGNvbnN0IG5leHRCdG4gPSBuYXYuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnbmF2LWJ1dHRvbiBuZXh0JyB9KTtcblx0XHRuZXh0QnRuLnRleHRDb250ZW50ID0gJ1x1MjAzQSc7XG5cdFx0bmV4dEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0dGhpcy5uZXh0KCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTMyXHU2N0QzXHU0RkUxXHU2MDZGXHU2ODBGXG5cdCAqL1xuXHRyZW5kZXJJbmZvQmFyKGNvbnRlbnRFbDogSFRNTEVsZW1lbnQpIHtcblx0XHRjb25zdCBmaWxlID0gdGhpcy5hbGxGaWxlc1t0aGlzLmN1cnJlbnRJbmRleF07XG5cdFx0Y29uc3QgaW5mb0JhciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdwcmV2aWV3LWluZm8tYmFyJyB9KTtcblxuXHRcdC8vIFx1NjU4N1x1NEVGNlx1NTQwRFxuXHRcdGluZm9CYXIuY3JlYXRlRGl2KHsgY2xzOiAnaW5mby1uYW1lJywgdGV4dDogZmlsZS5uYW1lIH0pO1xuXG5cdFx0Ly8gXHU2NENEXHU0RjVDXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgYWN0aW9ucyA9IGluZm9CYXIuY3JlYXRlRGl2KHsgY2xzOiAnaW5mby1hY3Rpb25zJyB9KTtcblxuXHRcdC8vIFx1NTkwRFx1NTIzNlx1OERFRlx1NUY4NFxuXHRcdGNvbnN0IGNvcHlQYXRoQnRuID0gYWN0aW9ucy5jcmVhdGVFbCgnYnV0dG9uJyk7XG5cdFx0Y29weVBhdGhCdG4udGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi50KCdjb3B5UGF0aEJ0bicpO1xuXHRcdGNvcHlQYXRoQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChmaWxlLnBhdGgpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3BhdGhDb3BpZWQnKSk7XG5cdFx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdlcnJvcicpKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU1OTBEXHU1MjM2XHU5NEZFXHU2M0E1XG5cdFx0Y29uc3QgY29weUxpbmtCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nKTtcblx0XHRjb3B5TGlua0J0bi50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnQoJ2NvcHlMaW5rQnRuJyk7XG5cdFx0Y29weUxpbmtCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHRjb25zdCBsaW5rID0gYFtbJHtmaWxlLm5hbWV9XV1gO1xuXHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChsaW5rKS50aGVuKCgpID0+IHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdsaW5rQ29waWVkJykpO1xuXHRcdFx0fSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTkwRFx1NTIzNlx1NTIzMFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdC8vIFx1NjI1M1x1NUYwMFx1NTM5Rlx1NjU4N1x1NEVGNlxuXHRcdGNvbnN0IG9wZW5PcmlnaW5hbEJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicpO1xuXHRcdG9wZW5PcmlnaW5hbEJ0bi50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnQoJ29wZW5PcmlnaW5hbCcpO1xuXHRcdG9wZW5PcmlnaW5hbEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdGNvbnN0IHNyYyA9IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcblx0XHRcdHdpbmRvdy5vcGVuKHNyYywgJ19ibGFuaycsICdub29wZW5lcixub3JlZmVycmVyJyk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTU3MjhcdTdCMTRcdThCQjBcdTRFMkRcdTY3RTVcdTYyN0Vcblx0XHRjb25zdCBmaW5kQnRuID0gYWN0aW9ucy5jcmVhdGVFbCgnYnV0dG9uJyk7XG5cdFx0ZmluZEJ0bi50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnQoJ2ZpbmRJbk5vdGVzJyk7XG5cdFx0ZmluZEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHRoaXMuY2xvc2UoKTtcblx0XHRcdHRoaXMucGx1Z2luLm9wZW5JbWFnZUluTm90ZXMoZmlsZSk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2Q0U4XHU1MThDXHU5NTJFXHU3NkQ4XHU1QkZDXHU4MjJBXG5cdCAqL1xuXHRyZWdpc3RlcktleWJvYXJkTmF2KCkge1xuXHRcdHRoaXMua2V5ZG93bkhhbmRsZXIgPSAoZTogS2V5Ym9hcmRFdmVudCkgPT4ge1xuXHRcdFx0c3dpdGNoIChlLmtleSkge1xuXHRcdFx0XHRjYXNlICdBcnJvd0xlZnQnOlxuXHRcdFx0XHRcdHRoaXMucHJldigpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdBcnJvd1JpZ2h0Jzpcblx0XHRcdFx0XHR0aGlzLm5leHQoKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnRXNjYXBlJzpcblx0XHRcdFx0XHR0aGlzLmNsb3NlKCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRoaXMubW9kYWxFbC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duSGFuZGxlcik7XG5cdH1cblxuXHQvKipcblx0ICogXHU0RTBBXHU0RTAwXHU1RjIwXG5cdCAqL1xuXHRwcmV2KCkge1xuXHRcdGlmICh0aGlzLmN1cnJlbnRJbmRleCA+IDApIHtcblx0XHRcdHRoaXMuY3VycmVudEluZGV4LS07XG5cdFx0XHR0aGlzLnVwZGF0ZUNvbnRlbnQoKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU0RTBCXHU0RTAwXHU1RjIwXG5cdCAqL1xuXHRuZXh0KCkge1xuXHRcdGlmICh0aGlzLmN1cnJlbnRJbmRleCA8IHRoaXMuYWxsRmlsZXMubGVuZ3RoIC0gMSkge1xuXHRcdFx0dGhpcy5jdXJyZW50SW5kZXgrKztcblx0XHRcdHRoaXMudXBkYXRlQ29udGVudCgpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTY2RjRcdTY1QjBcdTUxODVcdTVCQjlcblx0ICovXG5cdHVwZGF0ZUNvbnRlbnQoKSB7XG5cdFx0Ly8gXHU2OEMwXHU2N0U1IGNvbnRlbnRFbCBcdTY2MkZcdTU0MjZcdTVCNThcdTU3Mjhcblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgY29udGFpbmVyID0gdGhpcy5jb250ZW50RWwucXVlcnlTZWxlY3RvcignLnByZXZpZXctY29udGFpbmVyJyk7XG5cdFx0aWYgKGNvbnRhaW5lcikge1xuXHRcdFx0dGhpcy5yZW5kZXJNZWRpYShjb250YWluZXIgYXMgSFRNTEVsZW1lbnQpO1xuXHRcdFx0Y29uc3Qgb2xkTmF2ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5wcmV2aWV3LW5hdicpO1xuXHRcdFx0aWYgKG9sZE5hdikgb2xkTmF2LnJlbW92ZSgpO1xuXHRcdFx0aWYgKHRoaXMuYWxsRmlsZXMubGVuZ3RoID4gMSkge1xuXHRcdFx0XHR0aGlzLnJlbmRlck5hdmlnYXRpb24oY29udGFpbmVyIGFzIEhUTUxFbGVtZW50KTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Y29uc3Qgb2xkSW5mb0JhciA9IHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoJy5wcmV2aWV3LWluZm8tYmFyJyk7XG5cdFx0aWYgKG9sZEluZm9CYXIpIG9sZEluZm9CYXIucmVtb3ZlKCk7XG5cdFx0dGhpcy5yZW5kZXJJbmZvQmFyKHRoaXMuY29udGVudEVsKTtcblx0fVxuXG5cdG9uQ2xvc2UoKSB7XG5cdFx0Y29uc3QgeyBjb250ZW50RWwsIG1vZGFsRWwgfSA9IHRoaXM7XG5cdFx0Ly8gXHU3OUZCXHU5NjY0XHU5NTJFXHU3NkQ4XHU0RThCXHU0RUY2XHU3NkQxXHU1NDJDXHU1NjY4XHVGRjBDXHU5NjMyXHU2QjYyXHU1MTg1XHU1QjU4XHU2Q0M0XHU2RjBGXG5cdFx0aWYgKHRoaXMua2V5ZG93bkhhbmRsZXIpIHtcblx0XHRcdG1vZGFsRWwucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMua2V5ZG93bkhhbmRsZXIpO1xuXHRcdFx0dGhpcy5rZXlkb3duSGFuZGxlciA9IG51bGw7XG5cdFx0fVxuXHRcdGNvbnRlbnRFbC5lbXB0eSgpO1xuXHR9XG59XG4iLCAiaW1wb3J0IHsgQXBwLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBEcm9wZG93bkNvbXBvbmVudCB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCBJbWFnZU1hbmFnZXJQbHVnaW4gZnJvbSAnLi9tYWluJztcbmltcG9ydCB7IFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdXRpbHMvaTE4bic7XG5pbXBvcnQgeyBub3JtYWxpemVWYXVsdFBhdGggfSBmcm9tICcuL3V0aWxzL3BhdGgnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlTWFuYWdlclNldHRpbmdzIHtcblx0aW1hZ2VGb2xkZXI6IHN0cmluZztcblx0dGh1bWJuYWlsU2l6ZTogJ3NtYWxsJyB8ICdtZWRpdW0nIHwgJ2xhcmdlJztcblx0c2hvd0ltYWdlSW5mbzogYm9vbGVhbjtcblx0c29ydEJ5OiAnbmFtZScgfCAnZGF0ZScgfCAnc2l6ZSc7XG5cdHNvcnRPcmRlcjogJ2FzYycgfCAnZGVzYyc7XG5cdGF1dG9SZWZyZXNoOiBib29sZWFuO1xuXHRkZWZhdWx0QWxpZ25tZW50OiAnbGVmdCcgfCAnY2VudGVyJyB8ICdyaWdodCc7XG5cdHVzZVRyYXNoRm9sZGVyOiBib29sZWFuO1xuXHR0cmFzaEZvbGRlcjogc3RyaW5nO1xuXHRhdXRvQ2xlYW51cFRyYXNoOiBib29sZWFuO1xuXHR0cmFzaENsZWFudXBEYXlzOiBudW1iZXI7XG5cdC8vIFx1NjVCMFx1NTg5RVx1OEJCRVx1N0Y2RVxuXHRlbmFibGVJbWFnZXM6IGJvb2xlYW47XG5cdGVuYWJsZVZpZGVvczogYm9vbGVhbjtcblx0ZW5hYmxlQXVkaW86IGJvb2xlYW47XG5cdGVuYWJsZVBERjogYm9vbGVhbjtcblx0cGFnZVNpemU6IG51bWJlcjtcblx0ZW5hYmxlUHJldmlld01vZGFsOiBib29sZWFuO1xuXHRlbmFibGVLZXlib2FyZE5hdjogYm9vbGVhbjtcblx0Ly8gXHU1NkZEXHU5NjQ1XHU1MzE2XHU4QkJFXHU3RjZFXG5cdGxhbmd1YWdlOiAnemgnIHwgJ2VuJyB8ICdzeXN0ZW0nO1xuXHQvLyBRdWFyYW50aW5lIFx1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRlxuXHRzYWZlU2NhbkVuYWJsZWQ6IGJvb2xlYW47XG5cdHNhZmVTY2FuVW5yZWZEYXlzOiBudW1iZXI7XG5cdHNhZmVTY2FuTWluU2l6ZTogbnVtYmVyOyAvLyBieXRlc1xuXHQvLyBcdTUzQkJcdTkxQ0RcdThCQkVcdTdGNkVcblx0ZHVwbGljYXRlVGhyZXNob2xkOiBudW1iZXI7XG5cdC8vIFx1ODFFQVx1NTJBOFx1NjU3NFx1NzQwNlx1ODlDNFx1NTIxOVxuXHRvcmdhbml6ZVJ1bGVzOiBPcmdhbml6ZVJ1bGVbXTtcblx0Ly8gXHU1QTkyXHU0RjUzXHU1OTA0XHU3NDA2XHU5RUQ4XHU4QkE0XHU1M0MyXHU2NTcwXG5cdGRlZmF1bHRQcm9jZXNzUXVhbGl0eTogbnVtYmVyO1xuXHRkZWZhdWx0UHJvY2Vzc0Zvcm1hdDogJ3dlYnAnIHwgJ2pwZWcnIHwgJ3BuZyc7XG5cdHdhdGVybWFya1RleHQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPcmdhbml6ZVJ1bGUge1xuXHRuYW1lOiBzdHJpbmc7XG5cdGVuYWJsZWQ6IGJvb2xlYW47XG5cdHBhdGhUZW1wbGF0ZTogc3RyaW5nO1xuXHRyZW5hbWVUZW1wbGF0ZTogc3RyaW5nO1xuXHRtYXRjaEV4dGVuc2lvbnM6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEltYWdlTWFuYWdlclNldHRpbmdzID0ge1xuXHRpbWFnZUZvbGRlcjogJycsXG5cdHRodW1ibmFpbFNpemU6ICdtZWRpdW0nLFxuXHRzaG93SW1hZ2VJbmZvOiB0cnVlLFxuXHRzb3J0Qnk6ICduYW1lJyxcblx0c29ydE9yZGVyOiAnYXNjJyxcblx0YXV0b1JlZnJlc2g6IHRydWUsXG5cdGRlZmF1bHRBbGlnbm1lbnQ6ICdjZW50ZXInLFxuXHR1c2VUcmFzaEZvbGRlcjogdHJ1ZSxcblx0dHJhc2hGb2xkZXI6ICdvYnNpZGlhbi1tZWRpYS10b29sa2l0LXRyYXNoJyxcblx0YXV0b0NsZWFudXBUcmFzaDogZmFsc2UsXG5cdHRyYXNoQ2xlYW51cERheXM6IDMwLFxuXHQvLyBcdTY1QjBcdTU4OUVcdTlFRDhcdThCQTRcdTUwM0Ncblx0ZW5hYmxlSW1hZ2VzOiB0cnVlLFxuXHRlbmFibGVWaWRlb3M6IHRydWUsXG5cdGVuYWJsZUF1ZGlvOiB0cnVlLFxuXHRlbmFibGVQREY6IHRydWUsXG5cdHBhZ2VTaXplOiA1MCxcblx0ZW5hYmxlUHJldmlld01vZGFsOiB0cnVlLFxuXHRlbmFibGVLZXlib2FyZE5hdjogdHJ1ZSxcblx0Ly8gXHU1NkZEXHU5NjQ1XHU1MzE2XHU4QkJFXHU3RjZFXG5cdGxhbmd1YWdlOiAnc3lzdGVtJyxcblx0Ly8gUXVhcmFudGluZSBcdTVCODlcdTUxNjhcdTYyNkJcdTYzQ0Zcblx0c2FmZVNjYW5FbmFibGVkOiBmYWxzZSxcblx0c2FmZVNjYW5VbnJlZkRheXM6IDMwLFxuXHRzYWZlU2Nhbk1pblNpemU6IDUgKiAxMDI0ICogMTAyNCwgLy8gNU1CXG5cdC8vIFx1NTNCQlx1OTFDRFxuXHRkdXBsaWNhdGVUaHJlc2hvbGQ6IDkwLFxuXHQvLyBcdTgxRUFcdTUyQThcdTY1NzRcdTc0MDZcblx0b3JnYW5pemVSdWxlczogW1xuXHRcdHtcblx0XHRcdG5hbWU6ICdEZWZhdWx0Jyxcblx0XHRcdGVuYWJsZWQ6IGZhbHNlLFxuXHRcdFx0cGF0aFRlbXBsYXRlOiAnTWVkaWEve3llYXJ9L3ttb250aH0nLFxuXHRcdFx0cmVuYW1lVGVtcGxhdGU6ICd7bmFtZX0nLFxuXHRcdFx0bWF0Y2hFeHRlbnNpb25zOiAnanBnLGpwZWcscG5nLGdpZix3ZWJwJ1xuXHRcdH1cblx0XSxcblx0Ly8gXHU1QTkyXHU0RjUzXHU1OTA0XHU3NDA2XG5cdGRlZmF1bHRQcm9jZXNzUXVhbGl0eTogODAsXG5cdGRlZmF1bHRQcm9jZXNzRm9ybWF0OiAnd2VicCcsXG5cdHdhdGVybWFya1RleHQ6ICcnXG59O1xuXG5leHBvcnQgY2xhc3MgU2V0dGluZ3NUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcblx0cGx1Z2luOiBJbWFnZU1hbmFnZXJQbHVnaW47XG5cblx0Y29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luKSB7XG5cdFx0c3VwZXIoYXBwLCBwbHVnaW4pO1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHR9XG5cblx0Ly8gXHU3RkZCXHU4QkQxXHU4Rjg1XHU1MkE5XHU2NUI5XHU2Q0Q1XG5cdHByaXZhdGUgdChrZXk6IGtleW9mIFRyYW5zbGF0aW9ucyk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRoaXMucGx1Z2luLnQoa2V5KTtcblx0fVxuXG5cdGRpc3BsYXkoKTogdm9pZCB7XG5cdFx0Y29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcblx0XHRjb250YWluZXJFbC5lbXB0eSgpO1xuXG5cdFx0Ly8gXHU0RjdGXHU3NTI4XHU3RkZCXHU4QkQxXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiB0aGlzLnQoJ3BsdWdpblNldHRpbmdzJykgfSk7XG5cblx0XHQvLyBcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTU5MzlcdThCQkVcdTdGNkVcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnbWVkaWFGb2xkZXInKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnbWVkaWFGb2xkZXJEZXNjJykpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHRleHRcblx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCdhdHRhY2htZW50cy9tZWRpYScpXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZvbGRlcilcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlRm9sZGVyID0gbm9ybWFsaXplVmF1bHRQYXRoKHZhbHVlKTtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5jbGVhckNhY2hlKCk7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1N0YyOVx1NzU2NVx1NTZGRVx1NTkyN1x1NUMwRlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCd0aHVtYm5haWxTaXplJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ3RodW1ibmFpbFNpemVEZXNjJykpXG5cdFx0XHQuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4gZHJvcGRvd25cblx0XHRcdFx0LmFkZE9wdGlvbignc21hbGwnLCB0aGlzLnQoJ3RodW1ibmFpbFNtYWxsJykpXG5cdFx0XHRcdC5hZGRPcHRpb24oJ21lZGl1bScsIHRoaXMudCgndGh1bWJuYWlsTWVkaXVtJykpXG5cdFx0XHRcdC5hZGRPcHRpb24oJ2xhcmdlJywgdGhpcy50KCd0aHVtYm5haWxMYXJnZScpKVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MudGh1bWJuYWlsU2l6ZSlcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MudGh1bWJuYWlsU2l6ZSA9IHZhbHVlIGFzICdzbWFsbCcgfCAnbWVkaXVtJyB8ICdsYXJnZSc7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NjM5Mlx1NUU4Rlx1NjVCOVx1NUYwRlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdkZWZhdWx0U29ydEJ5JykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ3NvcnRCeURlc2MnKSlcblx0XHRcdC5hZGREcm9wZG93bihkcm9wZG93biA9PiBkcm9wZG93blxuXHRcdFx0XHQuYWRkT3B0aW9uKCduYW1lJywgdGhpcy50KCdzb3J0QnlOYW1lJykpXG5cdFx0XHRcdC5hZGRPcHRpb24oJ2RhdGUnLCB0aGlzLnQoJ3NvcnRCeURhdGUnKSlcblx0XHRcdFx0LmFkZE9wdGlvbignc2l6ZScsIHRoaXMudCgnc29ydEJ5U2l6ZScpKVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc29ydEJ5KVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zb3J0QnkgPSB2YWx1ZSBhcyAnbmFtZScgfCAnZGF0ZScgfCAnc2l6ZSc7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NjM5Mlx1NUU4Rlx1OTg3QVx1NUU4RlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdzb3J0T3JkZXInKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnc29ydE9yZGVyRGVzYycpKVxuXHRcdFx0LmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IGRyb3Bkb3duXG5cdFx0XHRcdC5hZGRPcHRpb24oJ2FzYycsIHRoaXMudCgnc29ydEFzYycpKVxuXHRcdFx0XHQuYWRkT3B0aW9uKCdkZXNjJywgdGhpcy50KCdzb3J0RGVzYycpKVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc29ydE9yZGVyKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zb3J0T3JkZXIgPSB2YWx1ZSBhcyAnYXNjJyB8ICdkZXNjJztcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0Ly8gXHU2NjNFXHU3OTNBXHU1NkZFXHU3MjQ3XHU0RkUxXHU2MDZGXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ3Nob3dJbWFnZUluZm8nKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnc2hvd0ltYWdlSW5mb0Rlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2hvd0ltYWdlSW5mbylcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dJbWFnZUluZm8gPSB2YWx1ZTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0Ly8gXHU4MUVBXHU1MkE4XHU1MjM3XHU2NUIwXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ2F1dG9SZWZyZXNoJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2F1dG9SZWZyZXNoRGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvUmVmcmVzaClcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9SZWZyZXNoID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1OUVEOFx1OEJBNFx1NUJGOVx1OUY1MFx1NjVCOVx1NUYwRlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdkZWZhdWx0QWxpZ25tZW50JykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2FsaWdubWVudERlc2MnKSlcblx0XHRcdC5hZGREcm9wZG93bihkcm9wZG93biA9PiBkcm9wZG93blxuXHRcdFx0XHQuYWRkT3B0aW9uKCdsZWZ0JywgdGhpcy50KCdhbGlnbkxlZnQnKSlcblx0XHRcdFx0LmFkZE9wdGlvbignY2VudGVyJywgdGhpcy50KCdhbGlnbkNlbnRlcicpKVxuXHRcdFx0XHQuYWRkT3B0aW9uKCdyaWdodCcsIHRoaXMudCgnYWxpZ25SaWdodCcpKVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdEFsaWdubWVudClcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdEFsaWdubWVudCA9IHZhbHVlIGFzICdsZWZ0JyB8ICdjZW50ZXInIHwgJ3JpZ2h0Jztcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0Ly8gXHU1MjA2XHU5Njk0XHU3RUJGXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2hyJywgeyBjbHM6ICdzZXR0aW5ncy1kaXZpZGVyJyB9KTtcblxuXHRcdC8vIFx1NUI4OVx1NTE2OFx1NTIyMFx1OTY2NFx1OEJCRVx1N0Y2RVxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogdGhpcy50KCdzYWZlRGVsZXRlU2V0dGluZ3MnKSB9KTtcblxuXHRcdC8vIFx1NEY3Rlx1NzUyOFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCd1c2VUcmFzaEZvbGRlcicpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCd1c2VUcmFzaEZvbGRlckRlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlVHJhc2hGb2xkZXIpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VUcmFzaEZvbGRlciA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdThERUZcdTVGODRcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgndHJhc2hGb2xkZXJQYXRoJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ3RyYXNoRm9sZGVyUGF0aERlc2MnKSlcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuXHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoJ29ic2lkaWFuLW1lZGlhLXRvb2xraXQtdHJhc2gnKVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MudHJhc2hGb2xkZXIpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy50cmFzaEZvbGRlciA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh2YWx1ZSk7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1ODFFQVx1NTJBOFx1NkUwNVx1NzQwNlx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdhdXRvQ2xlYW51cFRyYXNoJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2F1dG9DbGVhbnVwVHJhc2hEZXNjJykpXG5cdFx0XHQuYWRkVG9nZ2xlKHRvZ2dsZSA9PiB0b2dnbGVcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmF1dG9DbGVhbnVwVHJhc2gpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvQ2xlYW51cFRyYXNoID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NkUwNVx1NzQwNlx1NTkyOVx1NjU3MFxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdjbGVhbnVwRGF5cycpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdjbGVhbnVwRGF5c0Rlc2MnKSlcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuXHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoJzMwJylcblx0XHRcdFx0LnNldFZhbHVlKFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy50cmFzaENsZWFudXBEYXlzKSlcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGRheXMgPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuXHRcdFx0XHRcdGlmICghaXNOYU4oZGF5cykgJiYgZGF5cyA+IDApIHtcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnRyYXNoQ2xlYW51cERheXMgPSBkYXlzO1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTUyMDZcdTk2OTRcdTdFQkZcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaHInLCB7IGNsczogJ3NldHRpbmdzLWRpdmlkZXInIH0pO1xuXG5cdFx0Ly8gXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGXHU4QkJFXHU3RjZFXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiB0aGlzLnQoJ3NhZmVTY2FuU2V0dGluZ3MnKSB9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdzYWZlU2NhbicpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdzYWZlU2NhbkVuYWJsZWREZXNjJykpXG5cdFx0XHQuYWRkVG9nZ2xlKHRvZ2dsZSA9PiB0b2dnbGVcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNhZmVTY2FuRW5hYmxlZClcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnNhZmVTY2FuRW5hYmxlZCA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnc2FmZVNjYW5VbnJlZkRheXMnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnc2FmZVNjYW5VbnJlZkRheXNEZXNjJykpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHRleHRcblx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCczMCcpXG5cdFx0XHRcdC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2FmZVNjYW5VbnJlZkRheXMpKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgZGF5cyA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG5cdFx0XHRcdFx0aWYgKCFpc05hTihkYXlzKSAmJiBkYXlzID4gMCkge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3Muc2FmZVNjYW5VbnJlZkRheXMgPSBkYXlzO1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnc2FmZVNjYW5NaW5TaXplJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ3NhZmVTY2FuTWluU2l6ZURlc2MnKSlcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuXHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoJzUnKVxuXHRcdFx0XHQuc2V0VmFsdWUoU3RyaW5nKE51bWJlcigodGhpcy5wbHVnaW4uc2V0dGluZ3Muc2FmZVNjYW5NaW5TaXplIC8gKDEwMjQgKiAxMDI0KSkudG9GaXhlZCgyKSkpKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3Qgc2l6ZU1iID0gcGFyc2VGbG9hdCh2YWx1ZSk7XG5cdFx0XHRcdFx0aWYgKCFpc05hTihzaXplTWIpICYmIHNpemVNYiA+PSAwKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zYWZlU2Nhbk1pblNpemUgPSBNYXRoLnJvdW5kKHNpemVNYiAqIDEwMjQgKiAxMDI0KTtcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSkpO1xuXG5cdFx0Ly8gXHU1MjA2XHU5Njk0XHU3RUJGXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2hyJywgeyBjbHM6ICdzZXR0aW5ncy1kaXZpZGVyJyB9KTtcblxuXHRcdC8vIFx1OTFDRFx1NTkwRFx1NjhDMFx1NkQ0Qlx1OEJCRVx1N0Y2RVxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogdGhpcy50KCdkdXBsaWNhdGVEZXRlY3Rpb25TZXR0aW5ncycpIH0pO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ2R1cGxpY2F0ZVRocmVzaG9sZFNldHRpbmcnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnZHVwbGljYXRlVGhyZXNob2xkRGVzYycpKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB0ZXh0XG5cdFx0XHRcdC5zZXRQbGFjZWhvbGRlcignOTAnKVxuXHRcdFx0XHQuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLmR1cGxpY2F0ZVRocmVzaG9sZCkpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRjb25zdCB0aHJlc2hvbGQgPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuXHRcdFx0XHRcdGlmICghaXNOYU4odGhyZXNob2xkKSAmJiB0aHJlc2hvbGQgPj0gNTAgJiYgdGhyZXNob2xkIDw9IDEwMCkge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZHVwbGljYXRlVGhyZXNob2xkID0gdGhyZXNob2xkO1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTUyMDZcdTk2OTRcdTdFQkZcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaHInLCB7IGNsczogJ3NldHRpbmdzLWRpdmlkZXInIH0pO1xuXG5cdFx0Ly8gXHU1QTkyXHU0RjUzXHU3QzdCXHU1NzhCXHU4RkM3XHU2RUU0XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiB0aGlzLnQoJ21lZGlhVHlwZXMnKSB9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdlbmFibGVJbWFnZVN1cHBvcnQnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnZW5hYmxlSW1hZ2VTdXBwb3J0RGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVJbWFnZXMpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVJbWFnZXMgPSB2YWx1ZTtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5jbGVhckNhY2hlKCk7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdlbmFibGVWaWRlb1N1cHBvcnQnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnZW5hYmxlVmlkZW9TdXBwb3J0RGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVWaWRlb3MpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVWaWRlb3MgPSB2YWx1ZTtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5jbGVhckNhY2hlKCk7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdlbmFibGVBdWRpb1N1cHBvcnQnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnZW5hYmxlQXVkaW9TdXBwb3J0RGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBdWRpbylcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUF1ZGlvID0gdmFsdWU7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uY2xlYXJDYWNoZSgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZW5hYmxlUERGU3VwcG9ydCcpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdlbmFibGVQREZTdXBwb3J0RGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVQREYpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVQREYgPSB2YWx1ZTtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5jbGVhckNhY2hlKCk7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NTIwNlx1OTY5NFx1N0VCRlxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdocicsIHsgY2xzOiAnc2V0dGluZ3MtZGl2aWRlcicgfSk7XG5cblx0XHQvLyBcdTg5QzZcdTU2RkVcdThCQkVcdTdGNkVcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6IHRoaXMudCgndmlld1NldHRpbmdzJykgfSk7XG5cblx0XHQvLyBcdThCRURcdThBMDBcdThCQkVcdTdGNkVcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnaW50ZXJmYWNlTGFuZ3VhZ2UnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnbGFuZ3VhZ2VEZXNjJykpXG5cdFx0XHQuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4gZHJvcGRvd25cblx0XHRcdFx0LmFkZE9wdGlvbignc3lzdGVtJywgdGhpcy50KCdsYW5ndWFnZVN5c3RlbScpKVxuXHRcdFx0XHQuYWRkT3B0aW9uKCd6aCcsICdcdTRFMkRcdTY1ODcnKVxuXHRcdFx0XHQuYWRkT3B0aW9uKCdlbicsICdFbmdsaXNoJylcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmxhbmd1YWdlKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5sYW5ndWFnZSA9IHZhbHVlIGFzICd6aCcgfCAnZW4nIHwgJ3N5c3RlbSc7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdwYWdlU2l6ZScpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdwYWdlU2l6ZURlc2MnKSlcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuXHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoJzUwJylcblx0XHRcdFx0LnNldFZhbHVlKFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYWdlU2l6ZSkpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRjb25zdCBzaXplID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcblx0XHRcdFx0XHRpZiAoIWlzTmFOKHNpemUpICYmIHNpemUgPiAwKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYWdlU2l6ZSA9IHNpemU7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pKTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdlbmFibGVQcmV2aWV3TW9kYWwnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnZW5hYmxlUHJldmlld01vZGFsRGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVQcmV2aWV3TW9kYWwpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVQcmV2aWV3TW9kYWwgPSB2YWx1ZTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ2VuYWJsZUtleWJvYXJkTmF2JykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2VuYWJsZUtleWJvYXJkTmF2RGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVLZXlib2FyZE5hdilcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUtleWJvYXJkTmF2ID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NTIwNlx1OTY5NFx1N0VCRlxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdocicsIHsgY2xzOiAnc2V0dGluZ3MtZGl2aWRlcicgfSk7XG5cblx0XHQvLyBcdTVFMkVcdTUyQTlcdTRGRTFcdTYwNkZcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6IHRoaXMudCgna2V5Ym9hcmRTaG9ydGN1dHMnKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgncCcsIHtcblx0XHRcdHRleHQ6IHRoaXMudCgnc2hvcnRjdXRzRGVzYycpLFxuXHRcdFx0Y2xzOiAnc2V0dGluZ3MtZGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3VsJywgeyBjbHM6ICdzZXR0aW5ncy1saXN0JyB9KS5jcmVhdGVFbCgnbGknLCB7IHRleHQ6IHRoaXMudCgnc2hvcnRjdXRPcGVuTGlicmFyeScpIH0pO1xuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCd1bCcsIHsgY2xzOiAnc2V0dGluZ3MtbGlzdCcgfSkuY3JlYXRlRWwoJ2xpJywgeyB0ZXh0OiB0aGlzLnQoJ3Nob3J0Y3V0RmluZFVucmVmZXJlbmNlZCcpIH0pO1xuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCd1bCcsIHsgY2xzOiAnc2V0dGluZ3MtbGlzdCcgfSkuY3JlYXRlRWwoJ2xpJywgeyB0ZXh0OiB0aGlzLnQoJ3Nob3J0Y3V0T3BlblRyYXNoJykgfSk7XG5cblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6IHRoaXMudCgnY29tbWFuZHMnKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgncCcsIHtcblx0XHRcdHRleHQ6IHRoaXMudCgnY29tbWFuZHNEZXNjJyksXG5cdFx0XHRjbHM6ICdzZXR0aW5ncy1kZXNjcmlwdGlvbidcblx0XHR9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdjbWRPcGVuTGlicmFyeScpIH0pO1xuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCd1bCcsIHsgY2xzOiAnc2V0dGluZ3MtbGlzdCcgfSkuY3JlYXRlRWwoJ2xpJywgeyB0ZXh0OiB0aGlzLnQoJ2NtZEZpbmRVbnJlZmVyZW5jZWQnKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdjbWRUcmFzaE1hbmFnZW1lbnQnKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdjbWRBbGlnbkxlZnQnKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdjbWRBbGlnbkNlbnRlcicpIH0pO1xuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCd1bCcsIHsgY2xzOiAnc2V0dGluZ3MtbGlzdCcgfSkuY3JlYXRlRWwoJ2xpJywgeyB0ZXh0OiB0aGlzLnQoJ2NtZEFsaWduUmlnaHQnKSB9KTtcblx0fVxufVxuIiwgImltcG9ydCB7IGVzY2FwZUh0bWxBdHRyIH0gZnJvbSAnLi9zZWN1cml0eSc7XG5cbmV4cG9ydCB0eXBlIEFsaWdubWVudFR5cGUgPSAnbGVmdCcgfCAnY2VudGVyJyB8ICdyaWdodCc7XG5cbmV4cG9ydCBjbGFzcyBJbWFnZUFsaWdubWVudCB7XG5cdC8qKlxuXHQgKiBcdTUzQkJcdTk2NjRcdTVERjJcdTVCNThcdTU3MjhcdTc2ODRcdTVCRjlcdTlGNTBcdTUzMDVcdTg4QzVcdUZGMENcdTkwN0ZcdTUxNERcdTkxQ0RcdTU5MERcdTVENENcdTU5NTdcblx0ICovXG5cdHByaXZhdGUgc3RhdGljIHN0cmlwRXhpc3RpbmdBbGlnbm1lbnQobWFya2Rvd246IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0bGV0IGNsZWFuTWFya2Rvd24gPSBtYXJrZG93bi50cmltKCk7XG5cblx0XHQvLyBcdTUzMzlcdTkxNEQgPT09Y2VudGVyPT09IFx1NTc1N1x1OEJFRFx1NkNENVx1RkYwOFx1NjVFN1x1NzY4NFx1RkYwOVxuXHRcdGNvbnN0IGJsb2NrTWF0Y2ggPSBjbGVhbk1hcmtkb3duLm1hdGNoKC9ePT09XFxzKihsZWZ0fGNlbnRlcnxyaWdodClcXHMqPT09XFxzKihbXFxzXFxTXSo/KVxccyo9PT0kL2kpO1xuXHRcdGlmIChibG9ja01hdGNoKSB7XG5cdFx0XHRyZXR1cm4gYmxvY2tNYXRjaFsyXS50cmltKCk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MzM5XHU5MTREIHthbGlnbj1jZW50ZXJ9IFx1NjIxNiB7IGFsaWduPWNlbnRlciB9IFx1OThDRVx1NjgzQ1x1RkYwOFx1NjVFN1x1NzY4NFx1RkYwOVxuXHRcdGNsZWFuTWFya2Rvd24gPSBjbGVhbk1hcmtkb3duLnJlcGxhY2UoL15cXHtcXHMqYWxpZ25cXHMqPVxccyoobGVmdHxjZW50ZXJ8cmlnaHQpXFxzKlxcfVxccyovaSwgJycpLnRyaW0oKTtcblxuXHRcdC8vIFx1NTMzOVx1OTE0RFx1NjVCMFx1NzY4NFx1NjI2OVx1NUM1NVx1OTRGRVx1NjNBNVx1OEJFRFx1NkNENSAhW1tpbWFnZXxjZW50ZXJdXSBcdTYyMTYgIVtbaW1hZ2V8YWxpZ25dXVxuXHRcdC8vIFx1NjNEMFx1NTNENlx1NTFGQVx1NTZGRVx1NzI0N1x1OERFRlx1NUY4NFx1RkYwQ1x1NTNCQlx1OTY2NFx1NUJGOVx1OUY1MFx1NTNDMlx1NjU3MFxuXHRcdGNvbnN0IGxpbmtNYXRjaCA9IGNsZWFuTWFya2Rvd24ubWF0Y2goL14hP1xcW1xcWyhbXlxcXXxdKylcXHwoW15cXF1dKylcXF1cXF0kLyk7XG5cdFx0aWYgKGxpbmtNYXRjaCkge1xuXHRcdFx0Ly8gXHU1OTgyXHU2NzlDXHU3QjJDXHU0RThDXHU0RTJBXHU1M0MyXHU2NTcwXHU2NjJGIGxlZnQvY2VudGVyL3JpZ2h0XHVGRjBDXHU1MjE5XHU1M0JCXHU2Mzg5XHU1QjgzXG5cdFx0XHRjb25zdCBhbGlnbm1lbnQgPSBsaW5rTWF0Y2hbMl0udG9Mb3dlckNhc2UoKTtcblx0XHRcdGlmIChhbGlnbm1lbnQgPT09ICdsZWZ0JyB8fCBhbGlnbm1lbnQgPT09ICdjZW50ZXInIHx8IGFsaWdubWVudCA9PT0gJ3JpZ2h0Jykge1xuXHRcdFx0XHRyZXR1cm4gYCFbWyR7bGlua01hdGNoWzFdfV1dYDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBcdTRFNUZcdTY1MkZcdTYzMDFcdTY4MDdcdTUxQzZcdTc2ODQgW1tpbWFnZS5wbmd8MzAwXV0gXHU1QkJEXHU1RUE2XHU1M0MyXHU2NTcwXHU1RjYyXHU1RjBGXG5cdFx0Y2xlYW5NYXJrZG93biA9IGNsZWFuTWFya2Rvd24ucmVwbGFjZSgvXlxce1xccypcXC4obGVmdHxjZW50ZXJ8cmlnaHQpXFxzKlxcfSQvaSwgJycpLnRyaW0oKTtcblxuXHRcdHJldHVybiBjbGVhbk1hcmtkb3duO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NEUzQVx1NTZGRVx1NzI0N01hcmtkb3duXHU4QkVEXHU2Q0Q1XHU2REZCXHU1MkEwXHU1QkY5XHU5RjUwXHU1QzVFXHU2MDI3XG5cdCAqIFx1NjVCMFx1OEJFRFx1NkNENTogIVtbaW1hZ2UucG5nfGNlbnRlcl1dXG5cdCAqL1xuXHRzdGF0aWMgYXBwbHlBbGlnbm1lbnQobWFya2Rvd246IHN0cmluZywgYWxpZ25tZW50OiBBbGlnbm1lbnRUeXBlKTogc3RyaW5nIHtcblx0XHRjb25zdCBjbGVhbk1hcmtkb3duID0gdGhpcy5zdHJpcEV4aXN0aW5nQWxpZ25tZW50KG1hcmtkb3duKS50cmltKCk7XG5cblx0XHQvLyBcdTUzMzlcdTkxNEQgV2lraSBcdTk0RkVcdTYzQTVcdThCRURcdTZDRDUgIVtbaW1hZ2UucG5nXV0gXHU2MjE2IFtbaW1hZ2UucG5nXV1cblx0XHRjb25zdCB3aWtpTGlua01hdGNoID0gY2xlYW5NYXJrZG93bi5tYXRjaCgvXiE/XFxbXFxbKFteXFxdXSspXFxdXFxdJC8pO1xuXHRcdGlmICh3aWtpTGlua01hdGNoKSB7XG5cdFx0XHRjb25zdCBpbWFnZVBhdGggPSB3aWtpTGlua01hdGNoWzFdO1xuXHRcdFx0cmV0dXJuIGAhW1ske2ltYWdlUGF0aH18JHthbGlnbm1lbnR9XV1gO1xuXHRcdH1cblxuXHRcdC8vIFx1NTMzOVx1OTE0RFx1NjgwN1x1NTFDNiBNYXJrZG93biBcdTU2RkVcdTcyNDdcdThCRURcdTZDRDUgIVthbHRdKGltYWdlLnBuZylcblx0XHRjb25zdCBtZEltYWdlTWF0Y2ggPSBjbGVhbk1hcmtkb3duLm1hdGNoKC9eIVxcWyhbXlxcXV0qKVxcXVxcKChbXildKylcXCkkLyk7XG5cdFx0aWYgKG1kSW1hZ2VNYXRjaCkge1xuXHRcdFx0Y29uc3QgYWx0VGV4dCA9IG1kSW1hZ2VNYXRjaFsxXTtcblx0XHRcdGNvbnN0IGltYWdlUGF0aCA9IG1kSW1hZ2VNYXRjaFsyXTtcblx0XHRcdC8vIFx1OEY2Q1x1NjM2Mlx1NEUzQSBXaWtpIFx1OTRGRVx1NjNBNVx1OEJFRFx1NkNENSArIFx1NUJGOVx1OUY1MFx1NTNDMlx1NjU3MFxuXHRcdFx0cmV0dXJuIGAhW1ske2ltYWdlUGF0aH18JHthbGlnbm1lbnR9XV1gO1xuXHRcdH1cblxuXHRcdC8vIFx1NTk4Mlx1Njc5Q1x1NEUwRFx1NjYyRlx1NTZGRVx1NzI0N1x1OEJFRFx1NkNENVx1RkYwQ1x1OEZENFx1NTZERVx1NTM5Rlx1NjgzN1xuXHRcdHJldHVybiBtYXJrZG93bjtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTRFQ0VcdTU2RkVcdTcyNDdcdThCRURcdTZDRDVcdTRFMkRcdTYzRDBcdTUzRDZcdTVCRjlcdTlGNTBcdTY1QjlcdTVGMEZcblx0ICogXHU2NTJGXHU2MzAxOiAhW1tpbWFnZS5wbmd8Y2VudGVyXV0sID09PWNlbnRlcj09PSBcdTU3NTdcdThCRURcdTZDRDUsIHthbGlnbj1jZW50ZXJ9IFx1OThDRVx1NjgzQ1xuXHQgKi9cblx0c3RhdGljIGdldEFsaWdubWVudChtYXJrZG93bjogc3RyaW5nKTogQWxpZ25tZW50VHlwZSB8IG51bGwge1xuXHRcdC8vIFx1NTMzOVx1OTE0RFx1NjVCMFx1NzY4NFx1NjI2OVx1NUM1NVx1OTRGRVx1NjNBNVx1OEJFRFx1NkNENSAhW1tpbWFnZXxjZW50ZXJdXVxuXHRcdGNvbnN0IGxpbmtNYXRjaCA9IG1hcmtkb3duLm1hdGNoKC8hP1xcW1xcWyhbXlxcXXxdKylcXHwoW15cXF1dKylcXF1cXF0vKTtcblx0XHRpZiAobGlua01hdGNoKSB7XG5cdFx0XHRjb25zdCBhbGlnbm1lbnQgPSBsaW5rTWF0Y2hbMl0udG9Mb3dlckNhc2UoKTtcblx0XHRcdGlmIChhbGlnbm1lbnQgPT09ICdsZWZ0JyB8fCBhbGlnbm1lbnQgPT09ICdjZW50ZXInIHx8IGFsaWdubWVudCA9PT0gJ3JpZ2h0Jykge1xuXHRcdFx0XHRyZXR1cm4gYWxpZ25tZW50IGFzIEFsaWdubWVudFR5cGU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MzM5XHU5MTREID09PWNlbnRlcj09PSBcdTU3NTdcdThCRURcdTZDRDVcdUZGMDhcdTRGRERcdTc1NTlcdTUxN0NcdTVCQjlcdTY1RTdcdTc2ODRcdUZGMDlcblx0XHRjb25zdCBibG9ja01hdGNoID0gbWFya2Rvd24ubWF0Y2goL149PT1cXHMqKGxlZnR8Y2VudGVyfHJpZ2h0KVxccyo9PT0vaSk7XG5cdFx0aWYgKGJsb2NrTWF0Y2gpIHtcblx0XHRcdGNvbnN0IGFsaWdubWVudCA9IGJsb2NrTWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcblx0XHRcdGlmIChhbGlnbm1lbnQgPT09ICdsZWZ0JyB8fCBhbGlnbm1lbnQgPT09ICdjZW50ZXInIHx8IGFsaWdubWVudCA9PT0gJ3JpZ2h0Jykge1xuXHRcdFx0XHRyZXR1cm4gYWxpZ25tZW50IGFzIEFsaWdubWVudFR5cGU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MzM5XHU5MTREIHthbGlnbj1jZW50ZXJ9IFx1NjIxNiB7IGFsaWduPWNlbnRlciB9IFx1OThDRVx1NjgzQ1x1RkYwOFx1NEZERFx1NzU1OVx1NTE3Q1x1NUJCOVx1NjVFN1x1NzY4NFx1RkYwOVxuXHRcdGNvbnN0IGFsaWduTWF0Y2ggPSBtYXJrZG93bi5tYXRjaCgve1xccyphbGlnblxccyo9XFxzKihcXHcrKVxccyp9L2kpO1xuXHRcdGlmIChhbGlnbk1hdGNoKSB7XG5cdFx0XHRjb25zdCBhbGlnbm1lbnQgPSBhbGlnbk1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRpZiAoYWxpZ25tZW50ID09PSAnbGVmdCcgfHwgYWxpZ25tZW50ID09PSAnY2VudGVyJyB8fCBhbGlnbm1lbnQgPT09ICdyaWdodCcpIHtcblx0XHRcdFx0cmV0dXJuIGFsaWdubWVudCBhcyBBbGlnbm1lbnRUeXBlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFx1NTMzOVx1OTE0RCB7LmNlbnRlcn0gXHU5OENFXHU2ODNDXG5cdFx0Y29uc3QgY2xhc3NNYXRjaCA9IG1hcmtkb3duLm1hdGNoKC9cXHtcXHMqXFwuKGxlZnR8Y2VudGVyfHJpZ2h0KVxccypcXH0vaSk7XG5cdFx0aWYgKGNsYXNzTWF0Y2gpIHtcblx0XHRcdHJldHVybiBjbGFzc01hdGNoWzFdLnRvTG93ZXJDYXNlKCkgYXMgQWxpZ25tZW50VHlwZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTc1MUZcdTYyMTBcdTVFMjZcdTVCRjlcdTlGNTBcdTY4MzdcdTVGMEZcdTc2ODRIVE1MXHU1NkZFXHU3MjQ3XHU2ODA3XHU3QjdFXG5cdCAqL1xuXHRzdGF0aWMgdG9IVE1MKGltYWdlUGF0aDogc3RyaW5nLCBhbHRUZXh0OiBzdHJpbmcgPSAnJywgYWxpZ25tZW50OiBBbGlnbm1lbnRUeXBlID0gJ2NlbnRlcicpOiBzdHJpbmcge1xuXHRcdGNvbnN0IHN0eWxlTWFwOiBSZWNvcmQ8QWxpZ25tZW50VHlwZSwgc3RyaW5nPiA9IHtcblx0XHRcdCdsZWZ0JzogJ2Rpc3BsYXk6IGJsb2NrOyBtYXJnaW4tbGVmdDogMDsgbWFyZ2luLXJpZ2h0OiBhdXRvOycsXG5cdFx0XHQnY2VudGVyJzogJ2Rpc3BsYXk6IGJsb2NrOyBtYXJnaW4tbGVmdDogYXV0bzsgbWFyZ2luLXJpZ2h0OiBhdXRvOycsXG5cdFx0XHQncmlnaHQnOiAnZGlzcGxheTogYmxvY2s7IG1hcmdpbi1sZWZ0OiBhdXRvOyBtYXJnaW4tcmlnaHQ6IDA7J1xuXHRcdH07XG5cblx0XHRyZXR1cm4gYDxpbWcgc3JjPVwiJHtlc2NhcGVIdG1sQXR0cihpbWFnZVBhdGgpfVwiIGFsdD1cIiR7ZXNjYXBlSHRtbEF0dHIoYWx0VGV4dCl9XCIgc3R5bGU9XCIke3N0eWxlTWFwW2FsaWdubWVudF19XCIgLz5gO1xuXHR9XG59XG4iLCAiaW1wb3J0IHsgTWFya2Rvd25Qb3N0UHJvY2Vzc29yQ29udGV4dCwgVEZpbGUgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgSW1hZ2VNYW5hZ2VyUGx1Z2luIGZyb20gJy4uL21haW4nO1xuaW1wb3J0IHsgQWxpZ25tZW50VHlwZSB9IGZyb20gJy4vaW1hZ2VBbGlnbm1lbnQnO1xuaW1wb3J0IHsgaXNTYWZlVXJsLCBpc1BhdGhTYWZlIH0gZnJvbSAnLi9zZWN1cml0eSc7XG5pbXBvcnQgeyBub3JtYWxpemVWYXVsdFBhdGggfSBmcm9tICcuL3BhdGgnO1xuXG4vKipcbiAqIFx1NTZGRVx1NzI0N1x1NUJGOVx1OUY1MCBQb3N0UHJvY2Vzc29yXG4gKiBcdTZFMzJcdTY3RDMgPT09Y2VudGVyPT09XHUzMDAxPT09bGVmdD09PVx1MzAwMT09PXJpZ2h0PT09IFx1OEJFRFx1NkNENVxuICogXHU0RUU1XHU1M0NBXHU2NUIwXHU3Njg0ICFbW2ltYWdlfGNlbnRlcl1dIFx1NjI2OVx1NUM1NVx1OTRGRVx1NjNBNVx1OEJFRFx1NkNENVxuICovXG5leHBvcnQgY2xhc3MgQWxpZ25tZW50UG9zdFByb2Nlc3NvciB7XG5cdHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luO1xuXG5cdGNvbnN0cnVjdG9yKHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luKSB7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblxuXHQvKipcblx0ICogXHU2Q0U4XHU1MThDIFBvc3RQcm9jZXNzb3Jcblx0ICovXG5cdHJlZ2lzdGVyKCkge1xuXHRcdHRoaXMucGx1Z2luLnJlZ2lzdGVyTWFya2Rvd25Qb3N0UHJvY2Vzc29yKChlbGVtZW50LCBjb250ZXh0KSA9PiB7XG5cdFx0XHR0aGlzLnByb2Nlc3NBbGlnbm1lbnQoZWxlbWVudCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1OTA0XHU3NDA2XHU1QkY5XHU5RjUwXHU4QkVEXHU2Q0Q1XG5cdCAqL1xuXHRwcml2YXRlIHByb2Nlc3NBbGlnbm1lbnQoZWxlbWVudDogSFRNTEVsZW1lbnQpIHtcblx0XHQvLyBcdTY3RTVcdTYyN0VcdTYyNDBcdTY3MDlcdTUzMDVcdTU0MkJcdTVCRjlcdTlGNTBcdTY4MDdcdThCQjBcdTc2ODRcdTY1ODdcdTY3MkNcdTgyODJcdTcwQjlcblx0XHRjb25zdCB3YWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKFxuXHRcdFx0ZWxlbWVudCxcblx0XHRcdE5vZGVGaWx0ZXIuU0hPV19URVhULFxuXHRcdFx0bnVsbFxuXHRcdCk7XG5cblx0XHRjb25zdCBub2Rlc1RvUHJvY2VzczogeyBub2RlOiBUZXh0OyBwYXJlbnQ6IEhUTUxFbGVtZW50IH1bXSA9IFtdO1xuXHRcdGxldCBub2RlOiBUZXh0IHwgbnVsbDtcblxuXHRcdHdoaWxlIChub2RlID0gd2Fsa2VyLm5leHROb2RlKCkgYXMgVGV4dCkge1xuXHRcdFx0Y29uc3QgdGV4dCA9IG5vZGUudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0XHRjb25zdCBwYXJlbnRFbGVtZW50ID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuXHRcdFx0aWYgKCFwYXJlbnRFbGVtZW50KSBjb250aW51ZTtcblx0XHRcdC8vIFx1NjhDMFx1NkQ0Qlx1NjVFN1x1NzY4NCA9PT1jZW50ZXI9PT0gXHU4QkVEXHU2Q0Q1IFx1NjIxNlx1NjVCMFx1NzY4NCAhW1tpbWFnZXxjZW50ZXJdXSBcdThCRURcdTZDRDVcblx0XHRcdGlmICh0ZXh0LmluY2x1ZGVzKCc9PT0nKSAmJiAodGV4dC5pbmNsdWRlcygnY2VudGVyJykgfHwgdGV4dC5pbmNsdWRlcygnbGVmdCcpIHx8IHRleHQuaW5jbHVkZXMoJ3JpZ2h0JykpKSB7XG5cdFx0XHRcdG5vZGVzVG9Qcm9jZXNzLnB1c2goeyBub2RlLCBwYXJlbnQ6IHBhcmVudEVsZW1lbnQgfSk7XG5cdFx0XHR9IGVsc2UgaWYgKHRleHQuaW5jbHVkZXMoJ3xjZW50ZXInKSB8fCB0ZXh0LmluY2x1ZGVzKCd8bGVmdCcpIHx8IHRleHQuaW5jbHVkZXMoJ3xyaWdodCcpKSB7XG5cdFx0XHRcdC8vIFx1NjVCMFx1OEJFRFx1NkNENTogIVtbaW1hZ2V8Y2VudGVyXV1cblx0XHRcdFx0bm9kZXNUb1Byb2Nlc3MucHVzaCh7IG5vZGUsIHBhcmVudDogcGFyZW50RWxlbWVudCB9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBcdTU5MDRcdTc0MDZcdTYyN0VcdTUyMzBcdTc2ODRcdTgyODJcdTcwQjlcblx0XHRmb3IgKGNvbnN0IHsgbm9kZSwgcGFyZW50IH0gb2Ygbm9kZXNUb1Byb2Nlc3MpIHtcblx0XHRcdHRoaXMucHJvY2Vzc05vZGUobm9kZSwgcGFyZW50KTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU1OTA0XHU3NDA2XHU1MzU1XHU0RTJBXHU4MjgyXHU3MEI5XG5cdCAqL1xuXHRwcml2YXRlIHByb2Nlc3NOb2RlKG5vZGU6IFRleHQsIHBhcmVudDogSFRNTEVsZW1lbnQpIHtcblx0XHRjb25zdCB0ZXh0ID0gbm9kZS50ZXh0Q29udGVudCB8fCAnJztcblx0XHRsZXQgbGFzdEluZGV4ID0gMDtcblx0XHRjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblxuXHRcdC8vIDEuIFx1NTE0OFx1NTMzOVx1OTE0RFx1NjVCMFx1NzY4NFx1NjI2OVx1NUM1NVx1OTRGRVx1NjNBNVx1OEJFRFx1NkNENSAhW1tpbWFnZXxjZW50ZXJdXVxuXHRcdGNvbnN0IG5ld0xpbmtSZWdleCA9IC8hP1xcW1xcWyhbXnxcXF1dKylcXHwoY2VudGVyfGxlZnR8cmlnaHQpXFxdXFxdL2dpO1xuXHRcdGxldCBtYXRjaDtcblxuXHRcdHdoaWxlICgobWF0Y2ggPSBuZXdMaW5rUmVnZXguZXhlYyh0ZXh0KSkgIT09IG51bGwpIHtcblx0XHRcdC8vIFx1NkRGQlx1NTJBMFx1NTMzOVx1OTE0RFx1NEU0Qlx1NTI0RFx1NzY4NFx1NjU4N1x1NjcyQ1xuXHRcdFx0aWYgKG1hdGNoLmluZGV4ID4gbGFzdEluZGV4KSB7XG5cdFx0XHRcdGZyYWdtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQuc3Vic3RyaW5nKGxhc3RJbmRleCwgbWF0Y2guaW5kZXgpKSk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGltYWdlUGF0aCA9IG1hdGNoWzFdLnRyaW0oKTtcblx0XHRcdGNvbnN0IGFsaWdubWVudCA9IG1hdGNoWzJdLnRvTG93ZXJDYXNlKCkgYXMgQWxpZ25tZW50VHlwZTtcblxuXHRcdFx0Ly8gXHU1MjFCXHU1RUZBXHU1QkY5XHU5RjUwXHU1QkI5XHU1NjY4XG5cdFx0XHRjb25zdCBhbGlnbkNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdFx0YWxpZ25Db250YWluZXIuY2xhc3NOYW1lID0gYGFsaWdubWVudC0ke2FsaWdubWVudH1gO1xuXHRcdFx0YWxpZ25Db250YWluZXIuc3R5bGUudGV4dEFsaWduID0gYWxpZ25tZW50O1xuXHRcdFx0YWxpZ25Db250YWluZXIuc3R5bGUubWFyZ2luID0gJzEwcHggMCc7XG5cblx0XHRcdC8vIFx1NkUzMlx1NjdEM1x1NTZGRVx1NzI0N1xuXHRcdFx0dGhpcy5yZW5kZXJJbWFnZVN5bmMoYCFbWyR7aW1hZ2VQYXRofV1dYCwgYWxpZ25Db250YWluZXIpO1xuXG5cdFx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChhbGlnbkNvbnRhaW5lcik7XG5cdFx0XHRsYXN0SW5kZXggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcblx0XHR9XG5cblx0XHQvLyAyLiBcdTcxMzZcdTU0MEVcdTUzMzlcdTkxNERcdTY1RTdcdTc2ODRcdTU3NTdcdThCRURcdTZDRDUgPT09Y2VudGVyPT09IC4uLiA9PT1cblx0XHRpZiAobGFzdEluZGV4ID09PSAwKSB7XG5cdFx0XHQvLyBcdTUzRUFcdTY3MDlcdTU3MjhcdTZDQTFcdTY3MDlcdTUzMzlcdTkxNERcdTUyMzBcdTY1QjBcdThCRURcdTZDRDVcdTY1RjZcdTYyNERcdTU5MDRcdTc0MDZcdTY1RTdcdThCRURcdTZDRDVcdUZGMDhcdTkwN0ZcdTUxNERcdTkxQ0RcdTU5MERcdTU5MDRcdTc0MDZcdUZGMDlcblx0XHRcdGNvbnN0IGJsb2NrUmVnZXggPSAvPT09XFxzKihjZW50ZXJ8bGVmdHxyaWdodClcXHMqPT09XFxzKihbXFxzXFxTXSo/KVxccyo9PT0vZ2k7XG5cdFx0XHRsYXN0SW5kZXggPSAwO1xuXG5cdFx0XHR3aGlsZSAoKG1hdGNoID0gYmxvY2tSZWdleC5leGVjKHRleHQpKSAhPT0gbnVsbCkge1xuXHRcdFx0XHQvLyBcdTZERkJcdTUyQTBcdTUzMzlcdTkxNERcdTRFNEJcdTUyNERcdTc2ODRcdTY1ODdcdTY3MkNcblx0XHRcdFx0aWYgKG1hdGNoLmluZGV4ID4gbGFzdEluZGV4KSB7XG5cdFx0XHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dC5zdWJzdHJpbmcobGFzdEluZGV4LCBtYXRjaC5pbmRleCkpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGFsaWdubWVudCA9IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCkgYXMgQWxpZ25tZW50VHlwZTtcblx0XHRcdFx0Y29uc3QgY29udGVudCA9IG1hdGNoWzJdLnRyaW0oKTtcblxuXHRcdFx0XHQvLyBcdTUyMUJcdTVFRkFcdTVCRjlcdTlGNTBcdTVCQjlcdTU2Njhcblx0XHRcdFx0Y29uc3QgYWxpZ25Db250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdFx0YWxpZ25Db250YWluZXIuY2xhc3NOYW1lID0gYGFsaWdubWVudC0ke2FsaWdubWVudH1gO1xuXHRcdFx0XHRhbGlnbkNvbnRhaW5lci5zdHlsZS50ZXh0QWxpZ24gPSBhbGlnbm1lbnQ7XG5cdFx0XHRcdGFsaWduQ29udGFpbmVyLnN0eWxlLm1hcmdpbiA9ICcxMHB4IDAnO1xuXG5cdFx0XHRcdC8vIFx1NkUzMlx1NjdEM1x1NTE4NVx1NUJCOSAtIFx1NTQwQ1x1NkI2NVx1NTkwNFx1NzQwNlxuXHRcdFx0XHR0aGlzLnJlbmRlckltYWdlU3luYyhjb250ZW50LCBhbGlnbkNvbnRhaW5lcik7XG5cblx0XHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoYWxpZ25Db250YWluZXIpO1xuXHRcdFx0XHRsYXN0SW5kZXggPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBcdTU5ODJcdTY3OUNcdTZDQTFcdTY3MDlcdTUzMzlcdTkxNERcdTUyMzBcdTRFRkJcdTRGNTVcdThCRURcdTZDRDVcdUZGMENcdTRGRERcdTYzMDFcdTUzOUZcdTY4Mzdcblx0XHRpZiAobGFzdEluZGV4ID09PSAwICYmIGZyYWdtZW50LmNoaWxkTm9kZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU2REZCXHU1MkEwXHU1MjY5XHU0RjU5XHU2NTg3XHU2NzJDXG5cdFx0aWYgKGxhc3RJbmRleCA8IHRleHQubGVuZ3RoKSB7XG5cdFx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0LnN1YnN0cmluZyhsYXN0SW5kZXgpKSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU2NkZGXHU2MzYyXHU1MzlGXHU4MjgyXHU3MEI5XG5cdFx0aWYgKHBhcmVudCAmJiBmcmFnbWVudC5jaGlsZE5vZGVzLmxlbmd0aCA+IDApIHtcblx0XHRcdHBhcmVudC5yZXBsYWNlQ2hpbGQoZnJhZ21lbnQsIG5vZGUpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTU0MENcdTZCNjVcdTZFMzJcdTY3RDNcdTU2RkVcdTcyNDdcblx0ICovXG5cdHByaXZhdGUgcmVuZGVySW1hZ2VTeW5jKGNvbnRlbnQ6IHN0cmluZywgY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuXHRcdC8vIFx1NTMzOVx1OTE0RFx1NTQwNFx1NzlDRFx1NTZGRVx1NzI0N1x1OEJFRFx1NkNENVxuXHRcdGNvbnN0IHdpa2lMaW5rUmVnZXggPSAvXFxbXFxbKFteXFxdfF0rXFwuKD86cG5nfGpwZ3xqcGVnfGdpZnx3ZWJwfHN2Z3xibXApKSg/OlxcfFteXFxdXSspP1xcXVxcXS9naTtcblx0XHRjb25zdCBtYXJrZG93bkltYWdlUmVnZXggPSAvIVxcWyhbXlxcXV0qKVxcXVxcKChbXildKylcXCkvZztcblxuXHRcdGxldCBtYXRjaDtcblx0XHRjb25zdCBpbWFnZXM6IHsgc3JjOiBzdHJpbmc7IGFsdDogc3RyaW5nIH1bXSA9IFtdO1xuXG5cdFx0Ly8gXHU1MzM5XHU5MTREIFtbd2lraVx1NTZGRVx1NzI0N11dXG5cdFx0d2hpbGUgKChtYXRjaCA9IHdpa2lMaW5rUmVnZXguZXhlYyhjb250ZW50KSkgIT09IG51bGwpIHtcblx0XHRcdGNvbnN0IGZpbGVOYW1lID0gbWF0Y2hbMV07XG5cdFx0XHRpbWFnZXMucHVzaCh7IHNyYzogZmlsZU5hbWUsIGFsdDogZmlsZU5hbWUgfSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MzM5XHU5MTREICFbYWx0XSh1cmwpXG5cdFx0d2hpbGUgKChtYXRjaCA9IG1hcmtkb3duSW1hZ2VSZWdleC5leGVjKGNvbnRlbnQpKSAhPT0gbnVsbCkge1xuXHRcdFx0aW1hZ2VzLnB1c2goeyBhbHQ6IG1hdGNoWzFdLCBzcmM6IG1hdGNoWzJdIH0pO1xuXHRcdH1cblxuXHRcdC8vIFx1NkUzMlx1NjdEM1x1NTZGRVx1NzI0N1xuXHRcdGZvciAoY29uc3QgaW1nIG9mIGltYWdlcykge1xuXHRcdFx0aWYgKCFpc1NhZmVVcmwoaW1nLnNyYykpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBpbWdFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuXHRcdFx0aW1nRWwuYWx0ID0gaW1nLmFsdDtcblxuXHRcdFx0aWYgKCFpbWcuc3JjLnN0YXJ0c1dpdGgoJ2h0dHAnKSkge1xuXHRcdFx0XHRjb25zdCBub3JtYWxpemVkU3JjID0gbm9ybWFsaXplVmF1bHRQYXRoKGltZy5zcmMpO1xuXHRcdFx0XHRpZiAoIWlzUGF0aFNhZmUobm9ybWFsaXplZFNyYykpIGNvbnRpbnVlO1xuXHRcdFx0XHRjb25zdCBmaWxlID0gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkU3JjKTtcblx0XHRcdFx0aWYgKGZpbGUgJiYgZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG5cdFx0XHRcdFx0aW1nRWwuc3JjID0gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zdCBhdHRhY2htZW50c1BhdGggPSB0aGlzLmZpbmRGaWxlSW5WYXVsdChub3JtYWxpemVkU3JjKTtcblx0XHRcdFx0XHRpZiAoYXR0YWNobWVudHNQYXRoKSB7XG5cdFx0XHRcdFx0XHRpbWdFbC5zcmMgPSBhdHRhY2htZW50c1BhdGg7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aW1nRWwuc3JjID0gaW1nLnNyYztcblx0XHRcdH1cblxuXHRcdFx0aW1nRWwuc3R5bGUubWF4V2lkdGggPSAnMTAwJSc7XG5cdFx0XHRpbWdFbC5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG5cdFx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQoaW1nRWwpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTU3MjggVmF1bHQgXHU0RTJEXHU2N0U1XHU2MjdFXHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRwcml2YXRlIGZpbmRGaWxlSW5WYXVsdChmaWxlTmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG5cdFx0Y29uc3Qgbm9ybWFsaXplZEZpbGVOYW1lID0gbm9ybWFsaXplVmF1bHRQYXRoKGZpbGVOYW1lKTtcblx0XHRjb25zdCBmaWxlcyA9IHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRGaWxlcygpO1xuXHRcdGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuXHRcdFx0aWYgKGZpbGUubmFtZSA9PT0gbm9ybWFsaXplZEZpbGVOYW1lIHx8IGZpbGUucGF0aC5lbmRzV2l0aChub3JtYWxpemVkRmlsZU5hbWUpKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLnBsdWdpbi5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gbnVsbDtcblx0fVxufVxuIiwgIi8qKlxuICogXHU1NkZEXHU5NjQ1XHU1MzE2XHU2NTJGXHU2MzAxXHU2QTIxXHU1NzU3XG4gKiBcdTY1MkZcdTYzMDFcdTRFMkRcdTY1ODdcdTU0OENcdTgyRjFcdTY1ODdcbiAqL1xuXG5leHBvcnQgdHlwZSBMYW5ndWFnZSA9ICd6aCcgfCAnZW4nO1xuXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zbGF0aW9ucyB7XG5cdC8vIFx1OTAxQVx1NzUyOFxuXHRvazogc3RyaW5nO1xuXHRjYW5jZWw6IHN0cmluZztcblx0ZGVsZXRlOiBzdHJpbmc7XG5cdHJlc3RvcmU6IHN0cmluZztcblx0Y29uZmlybTogc3RyaW5nO1xuXHRzdWNjZXNzOiBzdHJpbmc7XG5cdGVycm9yOiBzdHJpbmc7XG5cblx0Ly8gXHU4OUM2XHU1NkZFXHU1NDBEXHU3OUYwXG5cdG1lZGlhTGlicmFyeTogc3RyaW5nO1xuXHR1bnJlZmVyZW5jZWRNZWRpYTogc3RyaW5nO1xuXHR0cmFzaE1hbmFnZW1lbnQ6IHN0cmluZztcblxuXHQvLyBcdTVBOTJcdTRGNTNcdTVFOTNcblx0dG90YWxNZWRpYUZpbGVzOiBzdHJpbmc7XG5cdG5vTWVkaWFGaWxlczogc3RyaW5nO1xuXHRhbGxNZWRpYVR5cGVzRGlzYWJsZWQ6IHN0cmluZztcblx0c2VhcmNoUGxhY2Vob2xkZXI6IHN0cmluZztcblx0c2VhcmNoUmVzdWx0czogc3RyaW5nO1xuXG5cdC8vIFx1NjcyQVx1NUYxNVx1NzUyOFx1NUE5Mlx1NEY1M1xuXHR1bnJlZmVyZW5jZWRGb3VuZDogc3RyaW5nO1xuXHRhbGxNZWRpYVJlZmVyZW5jZWQ6IHN0cmluZztcblx0ZGVsZXRlVG9UcmFzaDogc3RyaW5nO1xuXG5cdC8vIFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHR0cmFzaEVtcHR5OiBzdHJpbmc7XG5cdG9yaWdpbmFsUGF0aDogc3RyaW5nO1xuXHRkZWxldGVkQXQ6IHN0cmluZztcblx0Y29uZmlybUNsZWFyQWxsOiBzdHJpbmc7XG5cblx0Ly8gXHU2NENEXHU0RjVDXG5cdG9wZW5Jbk5vdGVzOiBzdHJpbmc7XG5cdGNvcHlQYXRoOiBzdHJpbmc7XG5cdGNvcHlMaW5rOiBzdHJpbmc7XG5cdG9wZW5PcmlnaW5hbDogc3RyaW5nO1xuXHRwcmV2aWV3OiBzdHJpbmc7XG5cblx0Ly8gXHU1RkVCXHU2Mzc3XHU5NTJFXG5cdHNob3J0Y3V0czogc3RyaW5nO1xuXHRvcGVuTGlicmFyeTogc3RyaW5nO1xuXHRmaW5kVW5yZWZlcmVuY2VkOiBzdHJpbmc7XG5cdG9wZW5UcmFzaDogc3RyaW5nO1xuXG5cdC8vIFx1NjI2Qlx1NjNDRlx1OEZEQlx1NUVBNlxuXHRzY2FubmluZ1JlZmVyZW5jZXM6IHN0cmluZztcblx0c2NhbkNvbXBsZXRlOiBzdHJpbmc7XG5cdGZpbGVzU2Nhbm5lZDogc3RyaW5nO1xuXG5cdC8vIFx1NjI3OVx1OTFDRlx1NjRDRFx1NEY1Q1xuXHRiYXRjaERlbGV0ZUNvbXBsZXRlOiBzdHJpbmc7XG5cdGJhdGNoRGVsZXRlUHJvZ3Jlc3M6IHN0cmluZztcblx0YmF0Y2hSZXN0b3JlQ29tcGxldGU6IHN0cmluZztcblxuXHQvLyBcdThCQkVcdTdGNkVcdTk4NzVcdTk3NjJcblx0cGx1Z2luU2V0dGluZ3M6IHN0cmluZztcblx0bWVkaWFGb2xkZXI6IHN0cmluZztcblx0bWVkaWFGb2xkZXJEZXNjOiBzdHJpbmc7XG5cdHRodW1ibmFpbFNpemU6IHN0cmluZztcblx0dGh1bWJuYWlsU2l6ZURlc2M6IHN0cmluZztcblx0dGh1bWJuYWlsU21hbGw6IHN0cmluZztcblx0dGh1bWJuYWlsTWVkaXVtOiBzdHJpbmc7XG5cdHRodW1ibmFpbExhcmdlOiBzdHJpbmc7XG5cdGRlZmF1bHRTb3J0Qnk6IHN0cmluZztcblx0c29ydEJ5RGVzYzogc3RyaW5nO1xuXHRzb3J0QnlOYW1lOiBzdHJpbmc7XG5cdHNvcnRCeURhdGU6IHN0cmluZztcblx0c29ydEJ5U2l6ZTogc3RyaW5nO1xuXHRzb3J0T3JkZXI6IHN0cmluZztcblx0c29ydE9yZGVyRGVzYzogc3RyaW5nO1xuXHRzb3J0QXNjOiBzdHJpbmc7XG5cdHNvcnREZXNjOiBzdHJpbmc7XG5cdHNob3dJbWFnZUluZm86IHN0cmluZztcblx0c2hvd0ltYWdlSW5mb0Rlc2M6IHN0cmluZztcblx0YXV0b1JlZnJlc2g6IHN0cmluZztcblx0YXV0b1JlZnJlc2hEZXNjOiBzdHJpbmc7XG5cdGRlZmF1bHRBbGlnbm1lbnQ6IHN0cmluZztcblx0YWxpZ25tZW50RGVzYzogc3RyaW5nO1xuXHRhbGlnbkxlZnQ6IHN0cmluZztcblx0YWxpZ25DZW50ZXI6IHN0cmluZztcblx0YWxpZ25SaWdodDogc3RyaW5nO1xuXHRzYWZlRGVsZXRlU2V0dGluZ3M6IHN0cmluZztcblx0dXNlVHJhc2hGb2xkZXI6IHN0cmluZztcblx0dXNlVHJhc2hGb2xkZXJEZXNjOiBzdHJpbmc7XG5cdHRyYXNoRm9sZGVyUGF0aDogc3RyaW5nO1xuXHR0cmFzaEZvbGRlclBhdGhEZXNjOiBzdHJpbmc7XG5cdGF1dG9DbGVhbnVwVHJhc2g6IHN0cmluZztcblx0YXV0b0NsZWFudXBUcmFzaERlc2M6IHN0cmluZztcblx0YXV0b0NsZWFudXBDb21wbGV0ZTogc3RyaW5nO1xuXHRjbGVhbnVwRGF5czogc3RyaW5nO1xuXHRjbGVhbnVwRGF5c0Rlc2M6IHN0cmluZztcblx0bWVkaWFUeXBlczogc3RyaW5nO1xuXHRlbmFibGVJbWFnZVN1cHBvcnQ6IHN0cmluZztcblx0ZW5hYmxlSW1hZ2VTdXBwb3J0RGVzYzogc3RyaW5nO1xuXHRlbmFibGVWaWRlb1N1cHBvcnQ6IHN0cmluZztcblx0ZW5hYmxlVmlkZW9TdXBwb3J0RGVzYzogc3RyaW5nO1xuXHRlbmFibGVBdWRpb1N1cHBvcnQ6IHN0cmluZztcblx0ZW5hYmxlQXVkaW9TdXBwb3J0RGVzYzogc3RyaW5nO1xuXHRlbmFibGVQREZTdXBwb3J0OiBzdHJpbmc7XG5cdGVuYWJsZVBERlN1cHBvcnREZXNjOiBzdHJpbmc7XG5cdHZpZXdTZXR0aW5nczogc3RyaW5nO1xuXHRpbnRlcmZhY2VMYW5ndWFnZTogc3RyaW5nO1xuXHRsYW5ndWFnZURlc2M6IHN0cmluZztcblx0bGFuZ3VhZ2VTeXN0ZW06IHN0cmluZztcblx0cGFnZVNpemU6IHN0cmluZztcblx0cGFnZVNpemVEZXNjOiBzdHJpbmc7XG5cdFx0ZW5hYmxlUHJldmlld01vZGFsOiBzdHJpbmc7XG5cdFx0ZW5hYmxlUHJldmlld01vZGFsRGVzYzogc3RyaW5nO1xuXHRcdGVuYWJsZUtleWJvYXJkTmF2OiBzdHJpbmc7XG5cdFx0ZW5hYmxlS2V5Ym9hcmROYXZEZXNjOiBzdHJpbmc7XG5cdFx0c2FmZVNjYW5TZXR0aW5nczogc3RyaW5nO1xuXHRcdHNhZmVTY2FuRW5hYmxlZERlc2M6IHN0cmluZztcblx0XHRzYWZlU2NhblVucmVmRGF5czogc3RyaW5nO1xuXHRcdHNhZmVTY2FuVW5yZWZEYXlzRGVzYzogc3RyaW5nO1xuXHRcdHNhZmVTY2FuTWluU2l6ZTogc3RyaW5nO1xuXHRcdHNhZmVTY2FuTWluU2l6ZURlc2M6IHN0cmluZztcblx0XHRkdXBsaWNhdGVEZXRlY3Rpb25TZXR0aW5nczogc3RyaW5nO1xuXHRcdGR1cGxpY2F0ZVRocmVzaG9sZFNldHRpbmc6IHN0cmluZztcblx0XHRkdXBsaWNhdGVUaHJlc2hvbGREZXNjOiBzdHJpbmc7XG5cdFx0a2V5Ym9hcmRTaG9ydGN1dHM6IHN0cmluZztcblx0XHRzaG9ydGN1dHNEZXNjOiBzdHJpbmc7XG5cdFx0c2hvcnRjdXRPcGVuTGlicmFyeTogc3RyaW5nO1xuXHRzaG9ydGN1dEZpbmRVbnJlZmVyZW5jZWQ6IHN0cmluZztcblx0c2hvcnRjdXRPcGVuVHJhc2g6IHN0cmluZztcblx0Y29tbWFuZHM6IHN0cmluZztcblx0Y29tbWFuZHNEZXNjOiBzdHJpbmc7XG5cdGNtZE9wZW5MaWJyYXJ5OiBzdHJpbmc7XG5cdGNtZEZpbmRVbnJlZmVyZW5jZWQ6IHN0cmluZztcblx0Y21kVHJhc2hNYW5hZ2VtZW50OiBzdHJpbmc7XG5cdGNtZEFsaWduTGVmdDogc3RyaW5nO1xuXHRjbWRBbGlnbkNlbnRlcjogc3RyaW5nO1xuXHRjbWRBbGlnblJpZ2h0OiBzdHJpbmc7XG5cblx0Ly8gVHJhc2ggTWFuYWdlbWVudCBWaWV3XG5cdGxvYWRpbmdUcmFzaEZpbGVzOiBzdHJpbmc7XG5cdHRyYXNoRm9sZGVyRW1wdHk6IHN0cmluZztcblx0ZmlsZXNJblRyYXNoOiBzdHJpbmc7XG5cdHRvdGFsU2l6ZTogc3RyaW5nO1xuXHR0cmFzaE1hbmFnZW1lbnREZXNjOiBzdHJpbmc7XG5cdHJlZnJlc2g6IHN0cmluZztcblx0Y2xlYXJUcmFzaDogc3RyaW5nO1xuXHRjbGVhclRyYXNoVG9vbHRpcDogc3RyaW5nO1xuXHRyZXN0b3JlVG9vbHRpcDogc3RyaW5nO1xuXHRwZXJtYW5lbnREZWxldGU6IHN0cmluZztcblx0cGVybWFuZW50RGVsZXRlVG9vbHRpcDogc3RyaW5nO1xuXHRkZWxldGVkVGltZTogc3RyaW5nO1xuXHRjb25maXJtRGVsZXRlRmlsZTogc3RyaW5nO1xuXHRjb25maXJtQ2xlYXJUcmFzaDogc3RyaW5nO1xuXHRmaWxlRGVsZXRlZDogc3RyaW5nO1xuXHRyZXN0b3JlU3VjY2Vzczogc3RyaW5nO1xuXHRyZXN0b3JlRmFpbGVkOiBzdHJpbmc7XG5cdHRhcmdldEZpbGVFeGlzdHM6IHN0cmluZztcblx0ZGVsZXRlRmFpbGVkOiBzdHJpbmc7XG5cdGZpbGVOYW1lQ29waWVkOiBzdHJpbmc7XG5cdG9yaWdpbmFsUGF0aENvcGllZDogc3RyaW5nO1xuXG5cdC8vIFx1NjcyQVx1NUYxNVx1NzUyOFx1NTZGRVx1NzI0N1x1ODlDNlx1NTZGRVxuXHRzY2FubmluZ1VucmVmZXJlbmNlZDogc3RyaW5nO1xuXHR0b3RhbFNpemVMYWJlbDogc3RyaW5nO1xuXHRzY2FuRXJyb3I6IHN0cmluZztcblx0dW5yZWZlcmVuY2VkRGVzYzogc3RyaW5nO1xuXHRub0ZpbGVzVG9EZWxldGU6IHN0cmluZztcblx0cHJvY2Vzc2VkRmlsZXM6IHN0cmluZztcblx0cHJvY2Vzc2VkRmlsZXNFcnJvcjogc3RyaW5nO1xuXHRjb3B5QWxsUGF0aHM6IHN0cmluZztcblx0Y29waWVkRmlsZVBhdGhzOiBzdHJpbmc7XG5cblx0Ly8gXHU1NkZFXHU3MjQ3XHU1RTkzXHU4OUM2XHU1NkZFXG5cdG5vTWF0Y2hpbmdGaWxlczogc3RyaW5nO1xuXHRwcmV2UGFnZTogc3RyaW5nO1xuXHRuZXh0UGFnZTogc3RyaW5nO1xuXHRwYWdlSW5mbzogc3RyaW5nO1xuXHRzZWxlY3RGaWxlczogc3RyaW5nO1xuXHRzZWxlY3RBbGw6IHN0cmluZztcblx0ZGVzZWxlY3RBbGw6IHN0cmluZztcblx0Y29uZmlybURlbGV0ZVNlbGVjdGVkOiBzdHJpbmc7XG5cdGRlbGV0ZWRGaWxlczogc3RyaW5nO1xuXHRkZWxldGVGaWxlc0ZhaWxlZDogc3RyaW5nO1xuXHRtdWx0aVNlbGVjdE1vZGU6IHN0cmluZztcblxuXHQvLyBcdTVBOTJcdTRGNTNcdTk4ODRcdTg5Qzhcblx0dW5zdXBwb3J0ZWRGaWxlVHlwZTogc3RyaW5nO1xuXHRjb3B5UGF0aEJ0bjogc3RyaW5nO1xuXHRjb3B5TGlua0J0bjogc3RyaW5nO1xuXHRmaW5kSW5Ob3Rlczogc3RyaW5nO1xuXHRwYXRoQ29waWVkOiBzdHJpbmc7XG5cdGxpbmtDb3BpZWQ6IHN0cmluZztcblx0aW1hZ2VMb2FkRXJyb3I6IHN0cmluZztcblxuXHQvLyBcdTU2RkVcdTcyNDdcdTVCRjlcdTlGNTBcblx0YWxpZ25JbWFnZUxlZnQ6IHN0cmluZztcblx0YWxpZ25JbWFnZUNlbnRlcjogc3RyaW5nO1xuXHRhbGlnbkltYWdlUmlnaHQ6IHN0cmluZztcblx0c2VsZWN0SW1hZ2VGaXJzdDogc3RyaW5nO1xuXHRzZWxlY3RJbWFnZTogc3RyaW5nO1xuXHRpbWFnZUFsaWduZWRMZWZ0OiBzdHJpbmc7XG5cdGltYWdlQWxpZ25lZENlbnRlcjogc3RyaW5nO1xuXHRpbWFnZUFsaWduZWRSaWdodDogc3RyaW5nO1xuXG5cdC8vIFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NjRDRFx1NEY1Q1xuXHRjb3BpZWRGaWxlTmFtZTogc3RyaW5nO1xuXHRjb3BpZWRPcmlnaW5hbFBhdGg6IHN0cmluZztcblx0bm90UmVmZXJlbmNlZDogc3RyaW5nO1xuXHRtb3ZlZFRvVHJhc2g6IHN0cmluZztcblx0ZGVsZXRlZEZpbGU6IHN0cmluZztcblx0cmVzdG9yZWRGaWxlOiBzdHJpbmc7XG5cblx0Ly8gXHU1NDdEXHU0RUU0XHU1NDBEXHU3OUYwXG5cdGNtZEltYWdlTGlicmFyeTogc3RyaW5nO1xuXHRjbWRGaW5kVW5yZWZlcmVuY2VkSW1hZ2VzOiBzdHJpbmc7XG5cdGNtZFJlZnJlc2hDYWNoZTogc3RyaW5nO1xuXHRjbWRBbGlnbkltYWdlTGVmdDogc3RyaW5nO1xuXHRjbWRBbGlnbkltYWdlQ2VudGVyOiBzdHJpbmc7XG5cdGNtZEFsaWduSW1hZ2VSaWdodDogc3RyaW5nO1xuXHRjbWRPcGVuTWVkaWFMaWJyYXJ5OiBzdHJpbmc7XG5cdGNtZEZpbmRVbnJlZmVyZW5jZWRNZWRpYTogc3RyaW5nO1xuXHRjbWRPcGVuVHJhc2hNYW5hZ2VtZW50OiBzdHJpbmc7XG5cblx0Ly8gXHU1MjIwXHU5NjY0XHU2NENEXHU0RjVDXG5cdGRlbGV0ZUZhaWxlZFdpdGhOYW1lOiBzdHJpbmc7XG5cdGRlbGV0ZWRXaXRoUXVhcmFudGluZUZhaWxlZDogc3RyaW5nO1xuXHRvcGVyYXRpb25GYWlsZWQ6IHN0cmluZztcblx0cHJvY2Vzc2luZzogc3RyaW5nO1xuXG5cdC8vIHYyLjAgXHU2NUIwXHU1ODlFXG5cdGR1cGxpY2F0ZURldGVjdGlvbjogc3RyaW5nO1xuXHRkdXBsaWNhdGVEZXRlY3Rpb25EZXNjOiBzdHJpbmc7XG5cdG5vRHVwbGljYXRlc0ZvdW5kOiBzdHJpbmc7XG5cdHN0YXJ0U2Nhbjogc3RyaW5nO1xuXHRzY2FuUHJvZ3Jlc3M6IHN0cmluZztcblx0c2ltaWxhcml0eVRocmVzaG9sZDogc3RyaW5nO1xuXHRkdXBsaWNhdGVHcm91cHNGb3VuZDogc3RyaW5nO1xuXHRkdXBsaWNhdGVHcm91cDogc3RyaW5nO1xuXHRmaWxlczogc3RyaW5nO1xuXHRzdWdnZXN0S2VlcDogc3RyaW5nO1xuXHRxdWFyYW50aW5lOiBzdHJpbmc7XG5cdHF1YXJhbnRpbmVBbGxEdXBsaWNhdGVzOiBzdHJpbmc7XG5cdGR1cGxpY2F0ZXNGb3VuZDogc3RyaW5nO1xuXHRkdXBsaWNhdGVzUXVhcmFudGluZWQ6IHN0cmluZztcblx0dHlwZURpc3RyaWJ1dGlvbjogc3RyaW5nO1xuXHR1bnJlZmVyZW5jZWRSYXRlOiBzdHJpbmc7XG5cdHJlZmVyZW5jZWRCeTogc3RyaW5nO1xuXHRzZWxlY3RlZENvdW50OiBzdHJpbmc7XG5cdGJhdGNoUmVzdG9yZTogc3RyaW5nO1xuXHRiYXRjaERlbGV0ZTogc3RyaW5nO1xuXHRub0l0ZW1zU2VsZWN0ZWQ6IHN0cmluZztcblx0Y29uZmlybUJhdGNoUmVzdG9yZTogc3RyaW5nO1xuXHRiYXRjaFJlc3RvcmVDb21wbGV0ZWQ6IHN0cmluZztcblx0c2FmZVNjYW46IHN0cmluZztcblx0c2FmZVNjYW5EZXNjOiBzdHJpbmc7XG5cdHNhZmVTY2FuU3RhcnRlZDogc3RyaW5nO1xuXHRzYWZlU2Nhbk5vUmVzdWx0czogc3RyaW5nO1xuXHRzYWZlU2NhbkNvbmZpcm06IHN0cmluZztcblx0c2FmZVNjYW5Db21wbGV0ZTogc3RyaW5nO1xuXHRzYWZlU2NhbkZhaWxlZDogc3RyaW5nO1xuXHRjbWREdXBsaWNhdGVEZXRlY3Rpb246IHN0cmluZztcblx0b3JnYW5pemluZzogc3RyaW5nO1xuXHRvcmdhbml6ZUNvbXBsZXRlOiBzdHJpbmc7XG59XG5cbmNvbnN0IHpoOiBUcmFuc2xhdGlvbnMgPSB7XG5cdC8vIFx1OTAxQVx1NzUyOFxuXHRvazogJ1x1Nzg2RVx1NUI5QScsXG5cdGNhbmNlbDogJ1x1NTNENlx1NkQ4OCcsXG5cdGRlbGV0ZTogJ1x1NTIyMFx1OTY2NCcsXG5cdHJlc3RvcmU6ICdcdTYwNjJcdTU5MEQnLFxuXHRjb25maXJtOiAnXHU3ODZFXHU4QkE0Jyxcblx0c3VjY2VzczogJ1x1NjIxMFx1NTI5RicsXG5cdGVycm9yOiAnXHU5NTE5XHU4QkVGJyxcblxuXHQvLyBcdTg5QzZcdTU2RkVcdTU0MERcdTc5RjBcblx0bWVkaWFMaWJyYXJ5OiAnXHU1QTkyXHU0RjUzXHU1RTkzJyxcblx0dW5yZWZlcmVuY2VkTWVkaWE6ICdcdTY3MkFcdTVGMTVcdTc1MjhcdTVBOTJcdTRGNTMnLFxuXHR0cmFzaE1hbmFnZW1lbnQ6ICdcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTdCQTFcdTc0MDYnLFxuXG5cdC8vIFx1NUE5Mlx1NEY1M1x1NUU5M1xuXHR0b3RhbE1lZGlhRmlsZXM6ICdcdTUxNzEge2NvdW50fSBcdTRFMkFcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjYnLFxuXHRub01lZGlhRmlsZXM6ICdcdTY3MkFcdTYyN0VcdTUyMzBcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjYnLFxuXHRhbGxNZWRpYVR5cGVzRGlzYWJsZWQ6ICdcdTYyNDBcdTY3MDlcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEJcdTVERjJcdTg4QUJcdTc5ODFcdTc1MjhcdUZGMENcdThCRjdcdTUyMzBcdThCQkVcdTdGNkVcdTRFMkRcdTU0MkZcdTc1MjhcdTgxRjNcdTVDMTFcdTRFMDBcdTc5Q0RcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEInLFxuXHRzZWFyY2hQbGFjZWhvbGRlcjogJ1x1NjQxQ1x1N0QyMlx1NjU4N1x1NEVGNlx1NTQwRC4uLicsXG5cdHNlYXJjaFJlc3VsdHM6ICdcdTYyN0VcdTUyMzAge2NvdW50fSBcdTRFMkFcdTdFRDNcdTY3OUMnLFxuXG5cdC8vIFx1NjcyQVx1NUYxNVx1NzUyOFx1NUE5Mlx1NEY1M1xuXHR1bnJlZmVyZW5jZWRGb3VuZDogJ1x1NjI3RVx1NTIzMCB7Y291bnR9IFx1NEUyQVx1NjcyQVx1NUYxNVx1NzUyOFx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNicsXG5cdGFsbE1lZGlhUmVmZXJlbmNlZDogJ1x1NTkyQVx1NjhEMlx1NEU4Nlx1RkYwMVx1NjI0MFx1NjcwOVx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1OTBGRFx1NURGMlx1ODhBQlx1NUYxNVx1NzUyOCcsXG5cdGRlbGV0ZVRvVHJhc2g6ICdcdTY1ODdcdTRFRjZcdTVDMDZcdTg4QUJcdTc5RkJcdTUxNjVcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzknLFxuXG5cdC8vIFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHR0cmFzaEVtcHR5OiAnXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTNBXHU3QTdBJyxcblx0b3JpZ2luYWxQYXRoOiAnXHU1MzlGXHU1OUNCXHU0RjREXHU3RjZFJyxcblx0ZGVsZXRlZEF0OiAnXHU1MjIwXHU5NjY0XHU2NUY2XHU5NUY0Jyxcblx0Y29uZmlybUNsZWFyQWxsOiAnXHU3ODZFXHU1QjlBXHU4OTgxXHU2RTA1XHU3QTdBXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU1NDE3XHVGRjFGJyxcblxuXHQvLyBcdTY0Q0RcdTRGNUNcblx0b3BlbkluTm90ZXM6ICdcdTU3MjhcdTdCMTRcdThCQjBcdTRFMkRcdTY3RTVcdTYyN0UnLFxuXHRjb3B5UGF0aDogJ1x1NTkwRFx1NTIzNlx1NjU4N1x1NEVGNlx1OERFRlx1NUY4NCcsXG5cdGNvcHlMaW5rOiAnXHU1OTBEXHU1MjM2TWFya2Rvd25cdTk0RkVcdTYzQTUnLFxuXHRvcGVuT3JpZ2luYWw6ICdcdTYyNTNcdTVGMDBcdTUzOUZcdTU5Q0JcdTY1ODdcdTRFRjYnLFxuXHRwcmV2aWV3OiAnXHU5ODg0XHU4OUM4JyxcblxuXHQvLyBcdTVGRUJcdTYzNzdcdTk1MkVcblx0c2hvcnRjdXRzOiAnXHU1RkVCXHU2Mzc3XHU5NTJFJyxcblx0b3BlbkxpYnJhcnk6ICdcdTYyNTNcdTVGMDBcdTVBOTJcdTRGNTNcdTVFOTMnLFxuXHRmaW5kVW5yZWZlcmVuY2VkOiAnXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU1QTkyXHU0RjUzJyxcblx0b3BlblRyYXNoOiAnXHU2MjUzXHU1RjAwXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU3QkExXHU3NDA2JyxcblxuXHQvLyBcdTYyNkJcdTYzQ0ZcdThGREJcdTVFQTZcblx0c2Nhbm5pbmdSZWZlcmVuY2VzOiAnXHU2QjYzXHU1NzI4XHU2MjZCXHU2M0NGXHU1RjE1XHU3NTI4Jyxcblx0c2NhbkNvbXBsZXRlOiAnXHU2MjZCXHU2M0NGXHU1QjhDXHU2MjEwJyxcblx0ZmlsZXNTY2FubmVkOiAnXHU0RTJBXHU2NTg3XHU0RUY2XHU1REYyXHU2MjZCXHU2M0NGJyxcblxuXHQvLyBcdTYyNzlcdTkxQ0ZcdTY0Q0RcdTRGNUNcblx0YmF0Y2hEZWxldGVDb21wbGV0ZTogJ1x1NURGMlx1NTIyMFx1OTY2NCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdGJhdGNoRGVsZXRlUHJvZ3Jlc3M6ICdcdTZCNjNcdTU3MjhcdTUyMjBcdTk2NjQge2N1cnJlbnR9L3t0b3RhbH0nLFxuXHRiYXRjaFJlc3RvcmVDb21wbGV0ZTogJ1x1NURGMlx1NjA2Mlx1NTkwRCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cblx0Ly8gXHU4QkJFXHU3RjZFXHU5ODc1XHU5NzYyXG5cdHBsdWdpblNldHRpbmdzOiAnXHU1QTkyXHU0RjUzXHU1REU1XHU1MTc3XHU3QkIxXHU2M0QyXHU0RUY2XHU4QkJFXHU3RjZFJyxcblx0bWVkaWFGb2xkZXI6ICdcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTU5MzknLFxuXHRtZWRpYUZvbGRlckRlc2M6ICdcdTYzMDdcdTVCOUFcdTg5ODFcdTYyNkJcdTYzQ0ZcdTc2ODRcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTU5MzlcdThERUZcdTVGODRcdUZGMDhcdTc1NTlcdTdBN0FcdTUyMTlcdTYyNkJcdTYzQ0ZcdTY1NzRcdTRFMkFcdTVFOTNcdUZGMDknLFxuXHR0aHVtYm5haWxTaXplOiAnXHU3RjI5XHU3NTY1XHU1NkZFXHU1OTI3XHU1QzBGJyxcblx0dGh1bWJuYWlsU2l6ZURlc2M6ICdcdTkwMDlcdTYyRTlcdTVBOTJcdTRGNTNcdTVFOTNcdTg5QzZcdTU2RkVcdTRFMkRcdTdGMjlcdTc1NjVcdTU2RkVcdTc2ODRcdTY2M0VcdTc5M0FcdTU5MjdcdTVDMEYnLFxuXHR0aHVtYm5haWxTbWFsbDogJ1x1NUMwRiAoMTAwcHgpJyxcblx0dGh1bWJuYWlsTWVkaXVtOiAnXHU0RTJEICgxNTBweCknLFxuXHR0aHVtYm5haWxMYXJnZTogJ1x1NTkyNyAoMjAwcHgpJyxcblx0ZGVmYXVsdFNvcnRCeTogJ1x1OUVEOFx1OEJBNFx1NjM5Mlx1NUU4Rlx1NjVCOVx1NUYwRicsXG5cdHNvcnRCeURlc2M6ICdcdTkwMDlcdTYyRTlcdTU2RkVcdTcyNDdcdTc2ODRcdTlFRDhcdThCQTRcdTYzOTJcdTVFOEZcdTY1QjlcdTVGMEYnLFxuXHRzb3J0QnlOYW1lOiAnXHU2MzA5XHU1NDBEXHU3OUYwJyxcblx0c29ydEJ5RGF0ZTogJ1x1NjMwOVx1NEZFRVx1NjUzOVx1NjVFNVx1NjcxRicsXG5cdHNvcnRCeVNpemU6ICdcdTYzMDlcdTY1ODdcdTRFRjZcdTU5MjdcdTVDMEYnLFxuXHRzb3J0T3JkZXI6ICdcdTYzOTJcdTVFOEZcdTk4N0FcdTVFOEYnLFxuXHRzb3J0T3JkZXJEZXNjOiAnXHU5MDA5XHU2MkU5XHU1MzQ3XHU1RThGXHU2MjE2XHU5NjREXHU1RThGJyxcblx0c29ydEFzYzogJ1x1NTM0N1x1NUU4RicsXG5cdHNvcnREZXNjOiAnXHU5NjREXHU1RThGJyxcblx0c2hvd0ltYWdlSW5mbzogJ1x1NjYzRVx1NzkzQVx1NTZGRVx1NzI0N1x1NEZFMVx1NjA2RicsXG5cdHNob3dJbWFnZUluZm9EZXNjOiAnXHU1NzI4XHU1NkZFXHU3MjQ3XHU3RjI5XHU3NTY1XHU1NkZFXHU0RTBCXHU2NUI5XHU2NjNFXHU3OTNBXHU2NTg3XHU0RUY2XHU1NDBEXHU1NDhDXHU1OTI3XHU1QzBGJyxcblx0YXV0b1JlZnJlc2g6ICdcdTgxRUFcdTUyQThcdTUyMzdcdTY1QjAnLFxuXHRhdXRvUmVmcmVzaERlc2M6ICdcdTVGNTNcdTVFOTNcdTRFMkRcdTc2ODRcdTU2RkVcdTcyNDdcdTUzRDFcdTc1MUZcdTUzRDhcdTUzMTZcdTY1RjZcdTgxRUFcdTUyQThcdTUyMzdcdTY1QjBcdTg5QzZcdTU2RkUnLFxuXHRkZWZhdWx0QWxpZ25tZW50OiAnXHU5RUQ4XHU4QkE0XHU1NkZFXHU3MjQ3XHU1QkY5XHU5RjUwXHU2NUI5XHU1RjBGJyxcblx0YWxpZ25tZW50RGVzYzogJ1x1NjNEMlx1NTE2NVx1NTZGRVx1NzI0N1x1NjVGNlx1NzY4NFx1OUVEOFx1OEJBNFx1NUJGOVx1OUY1MFx1NjVCOVx1NUYwRicsXG5cdGFsaWduTGVmdDogJ1x1NUM0NVx1NURFNicsXG5cdGFsaWduQ2VudGVyOiAnXHU1QzQ1XHU0RTJEJyxcblx0YWxpZ25SaWdodDogJ1x1NUM0NVx1NTNGMycsXG5cdHNhZmVEZWxldGVTZXR0aW5nczogJ1x1NUI4OVx1NTE2OFx1NTIyMFx1OTY2NFx1OEJCRVx1N0Y2RScsXG5cdHVzZVRyYXNoRm9sZGVyOiAnXHU0RjdGXHU3NTI4XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5Jyxcblx0dXNlVHJhc2hGb2xkZXJEZXNjOiAnXHU1MjIwXHU5NjY0XHU2NTg3XHU0RUY2XHU2NUY2XHU1MTQ4XHU3OUZCXHU1MTY1XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHVGRjBDXHU4MDBDXHU0RTBEXHU2NjJGXHU3NkY0XHU2M0E1XHU1MjIwXHU5NjY0Jyxcblx0dHJhc2hGb2xkZXJQYXRoOiAnXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5Jyxcblx0dHJhc2hGb2xkZXJQYXRoRGVzYzogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NzY4NFx1OERFRlx1NUY4NFx1RkYwOFx1NzZGOFx1NUJGOVx1OERFRlx1NUY4NFx1RkYwOScsXG5cdGF1dG9DbGVhbnVwVHJhc2g6ICdcdTgxRUFcdTUyQThcdTZFMDVcdTc0MDZcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzknLFxuXHRhdXRvQ2xlYW51cFRyYXNoRGVzYzogJ1x1ODFFQVx1NTJBOFx1NkUwNVx1NzQwNlx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NzY4NFx1NjVFN1x1NjU4N1x1NEVGNicsXG5cdGF1dG9DbGVhbnVwQ29tcGxldGU6ICdcdTgxRUFcdTUyQThcdTZFMDVcdTc0MDZcdTVCOENcdTYyMTBcdUZGMENcdTVERjJcdTUyMjBcdTk2NjQge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjYnLFxuXHRjbGVhbnVwRGF5czogJ1x1NkUwNVx1NzQwNlx1NTkyOVx1NjU3MCcsXG5cdGNsZWFudXBEYXlzRGVzYzogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NzY4NFx1NjU4N1x1NEVGNlx1OEQ4NVx1OEZDN1x1NkI2NFx1NTkyOVx1NjU3MFx1NTQwRVx1NUMwNlx1ODFFQVx1NTJBOFx1NTIyMFx1OTY2NCcsXG5cdG1lZGlhVHlwZXM6ICdcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEInLFxuXHRlbmFibGVJbWFnZVN1cHBvcnQ6ICdcdTU0MkZcdTc1MjhcdTU2RkVcdTcyNDdcdTY1MkZcdTYzMDEnLFxuXHRlbmFibGVJbWFnZVN1cHBvcnREZXNjOiAnXHU1NzI4XHU1QTkyXHU0RjUzXHU1RTkzXHU0RTJEXHU2NjNFXHU3OTNBXHU1NkZFXHU3MjQ3XHU2NTg3XHU0RUY2IChwbmcsIGpwZywgZ2lmLCB3ZWJwLCBzdmcsIGJtcCknLFxuXHRlbmFibGVWaWRlb1N1cHBvcnQ6ICdcdTU0MkZcdTc1MjhcdTg5QzZcdTk4OTFcdTY1MkZcdTYzMDEnLFxuXHRlbmFibGVWaWRlb1N1cHBvcnREZXNjOiAnXHU1NzI4XHU1QTkyXHU0RjUzXHU1RTkzXHU0RTJEXHU2NjNFXHU3OTNBXHU4OUM2XHU5ODkxXHU2NTg3XHU0RUY2IChtcDQsIG1vdiwgYXZpLCBta3YsIHdlYm0pJyxcblx0ZW5hYmxlQXVkaW9TdXBwb3J0OiAnXHU1NDJGXHU3NTI4XHU5N0YzXHU5ODkxXHU2NTJGXHU2MzAxJyxcblx0ZW5hYmxlQXVkaW9TdXBwb3J0RGVzYzogJ1x1NTcyOFx1NUE5Mlx1NEY1M1x1NUU5M1x1NEUyRFx1NjYzRVx1NzkzQVx1OTdGM1x1OTg5MVx1NjU4N1x1NEVGNiAobXAzLCB3YXYsIG9nZywgbTRhLCBmbGFjKScsXG5cdGVuYWJsZVBERlN1cHBvcnQ6ICdcdTU0MkZcdTc1MjhcdTY1ODdcdTY4NjNcdTY1MkZcdTYzMDEnLFxuXHRlbmFibGVQREZTdXBwb3J0RGVzYzogJ1x1NTcyOFx1NUE5Mlx1NEY1M1x1NUU5M1x1NEUyRFx1NjYzRVx1NzkzQVx1NjU4N1x1Njg2M1x1NjU4N1x1NEVGNiAocGRmLCBkb2MsIGRvY3gsIHhscywgeGxzeCwgcHB0LCBwcHR4KScsXG5cdHZpZXdTZXR0aW5nczogJ1x1ODlDNlx1NTZGRVx1OEJCRVx1N0Y2RScsXG5cdGludGVyZmFjZUxhbmd1YWdlOiAnXHU3NTRDXHU5NzYyXHU4QkVEXHU4QTAwJyxcblx0bGFuZ3VhZ2VEZXNjOiAnXHU5MDA5XHU2MkU5XHU2M0QyXHU0RUY2XHU3NTRDXHU5NzYyXHU2NjNFXHU3OTNBXHU3Njg0XHU4QkVEXHU4QTAwJyxcblx0bGFuZ3VhZ2VTeXN0ZW06ICdcdThEREZcdTk2OEZcdTdDRkJcdTdFREYnLFxuXHRwYWdlU2l6ZTogJ1x1NTIwNlx1OTg3NVx1NTkyN1x1NUMwRicsXG5cdHBhZ2VTaXplRGVzYzogJ1x1NUE5Mlx1NEY1M1x1NUU5M1x1NEUyRFx1NkJDRlx1OTg3NVx1NjYzRVx1NzkzQVx1NzY4NFx1NjU4N1x1NEVGNlx1NjU3MFx1OTFDRicsXG5cdFx0ZW5hYmxlUHJldmlld01vZGFsOiAnXHU1NDJGXHU3NTI4XHU5ODg0XHU4OUM4IE1vZGFsJyxcblx0XHRlbmFibGVQcmV2aWV3TW9kYWxEZXNjOiAnXHU3MEI5XHU1MUZCXHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHU2NUY2XHU2MjUzXHU1RjAwXHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzJyxcblx0XHRlbmFibGVLZXlib2FyZE5hdjogJ1x1NTQyRlx1NzUyOFx1OTUyRVx1NzZEOFx1NUJGQ1x1ODIyQScsXG5cdFx0ZW5hYmxlS2V5Ym9hcmROYXZEZXNjOiAnXHU1NzI4XHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzXHU0RTJEXHU0RjdGXHU3NTI4XHU2NUI5XHU1NDExXHU5NTJFXHU1MjA3XHU2MzYyXHU1NkZFXHU3MjQ3Jyxcblx0XHRzYWZlU2NhblNldHRpbmdzOiAnXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGJyxcblx0XHRzYWZlU2NhbkVuYWJsZWREZXNjOiAnXHU1NDJGXHU3NTI4XHU1NDBFXHU1M0VGXHU1NzI4XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU3QkExXHU3NDA2XHU0RTJEXHU2MjY3XHU4ODRDXHU2NzYxXHU0RUY2XHU2MjZCXHU2M0NGJyxcblx0XHRzYWZlU2NhblVucmVmRGF5czogJ1x1NjcyQVx1NUYxNVx1NzUyOFx1NTkyOVx1NjU3MCcsXG5cdFx0c2FmZVNjYW5VbnJlZkRheXNEZXNjOiAnXHU0RUM1XHU2MjZCXHU2M0NGXHU4RDg1XHU4RkM3XHU2QjY0XHU1OTI5XHU2NTcwXHU2NzJBXHU4OEFCXHU1RjE1XHU3NTI4XHU3Njg0XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2Jyxcblx0XHRzYWZlU2Nhbk1pblNpemU6ICdcdTY3MDBcdTVDMEZcdTY1ODdcdTRFRjZcdTU5MjdcdTVDMEYgKE1CKScsXG5cdFx0c2FmZVNjYW5NaW5TaXplRGVzYzogJ1x1NEVDNVx1NjI2Qlx1NjNDRlx1NTkyN1x1NEU4RVx1N0I0OVx1NEU4RVx1NkI2NFx1NTkyN1x1NUMwRlx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNicsXG5cdFx0ZHVwbGljYXRlRGV0ZWN0aW9uU2V0dGluZ3M6ICdcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEInLFxuXHRcdGR1cGxpY2F0ZVRocmVzaG9sZFNldHRpbmc6ICdcdTc2RjhcdTRGM0NcdTVFQTZcdTk2MDhcdTUwM0MnLFxuXHRcdGR1cGxpY2F0ZVRocmVzaG9sZERlc2M6ICdcdThGQkVcdTUyMzBcdThCRTVcdTc2N0VcdTUyMDZcdTZCRDRcdTYyNERcdTRGMUFcdTg4QUJcdTUyMjRcdTVCOUFcdTRFM0FcdTkxQ0RcdTU5MEQnLFxuXHRcdGtleWJvYXJkU2hvcnRjdXRzOiAnXHU1RkVCXHU2Mzc3XHU5NTJFJyxcblx0XHRzaG9ydGN1dHNEZXNjOiAnXHU2M0QyXHU0RUY2XHU2NTJGXHU2MzAxXHU3Njg0XHU1RkVCXHU2Mzc3XHU5NTJFXHVGRjFBJyxcblx0XHRzaG9ydGN1dE9wZW5MaWJyYXJ5OiAnQ3RybCtTaGlmdCtNIC0gXHU2MjUzXHU1RjAwXHU1QTkyXHU0RjUzXHU1RTkzJyxcblx0c2hvcnRjdXRGaW5kVW5yZWZlcmVuY2VkOiAnQ3RybCtTaGlmdCtVIC0gXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU1QTkyXHU0RjUzJyxcblx0c2hvcnRjdXRPcGVuVHJhc2g6ICdDdHJsK1NoaWZ0K1QgLSBcdTYyNTNcdTVGMDBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTdCQTFcdTc0MDYnLFxuXHRjb21tYW5kczogJ1x1NUZFQlx1NjM3N1x1NTQ3RFx1NEVFNCcsXG5cdGNvbW1hbmRzRGVzYzogJ1x1NTcyOFx1NTQ3RFx1NEVFNFx1OTc2Mlx1Njc3Rlx1NEUyRFx1NEY3Rlx1NzUyOFx1NEVFNVx1NEUwQlx1NTQ3RFx1NEVFNFx1RkYxQScsXG5cdGNtZE9wZW5MaWJyYXJ5OiAnXHU1QTkyXHU0RjUzXHU1RTkzIC0gXHU2MjUzXHU1RjAwXHU1QTkyXHU0RjUzXHU1RTkzXHU4OUM2XHU1NkZFJyxcblx0Y21kRmluZFVucmVmZXJlbmNlZDogJ1x1NjdFNVx1NjI3RVx1NjcyQVx1NUYxNVx1NzUyOFx1NUE5Mlx1NEY1MyAtIFx1NjdFNVx1NjI3RVx1NjcyQVx1ODhBQlx1NEVGQlx1NEY1NVx1N0IxNFx1OEJCMFx1NUYxNVx1NzUyOFx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNicsXG5cdGNtZFRyYXNoTWFuYWdlbWVudDogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1N0JBMVx1NzQwNiAtIFx1N0JBMVx1NzQwNlx1NURGMlx1NTIyMFx1OTY2NFx1NzY4NFx1NjU4N1x1NEVGNicsXG5cdGNtZEFsaWduTGVmdDogJ1x1NTZGRVx1NzI0N1x1NUM0NVx1NURFNlx1NUJGOVx1OUY1MCAtIFx1NUMwNlx1OTAwOVx1NEUyRFx1NTZGRVx1NzI0N1x1NUM0NVx1NURFNlx1NUJGOVx1OUY1MCcsXG5cdGNtZEFsaWduQ2VudGVyOiAnXHU1NkZFXHU3MjQ3XHU1QzQ1XHU0RTJEXHU1QkY5XHU5RjUwIC0gXHU1QzA2XHU5MDA5XHU0RTJEXHU1NkZFXHU3MjQ3XHU1QzQ1XHU0RTJEXHU1QkY5XHU5RjUwJyxcblx0Y21kQWxpZ25SaWdodDogJ1x1NTZGRVx1NzI0N1x1NUM0NVx1NTNGM1x1NUJGOVx1OUY1MCAtIFx1NUMwNlx1OTAwOVx1NEUyRFx1NTZGRVx1NzI0N1x1NUM0NVx1NTNGM1x1NUJGOVx1OUY1MCcsXG5cblx0Ly8gVHJhc2ggTWFuYWdlbWVudCBWaWV3XG5cdGxvYWRpbmdUcmFzaEZpbGVzOiAnXHU2QjYzXHU1NzI4XHU1MkEwXHU4RjdEXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2Li4uJyxcblx0dHJhc2hGb2xkZXJFbXB0eTogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUzQVx1N0E3QScsXG5cdGZpbGVzSW5UcmFzaDogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NjcwOSB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdHRvdGFsU2l6ZTogJ1x1NjAzQlx1OEJBMSB7c2l6ZX0nLFxuXHR0cmFzaE1hbmFnZW1lbnREZXNjOiAnXHU1REYyXHU1MjIwXHU5NjY0XHU3Njg0XHU2NTg3XHU0RUY2XHU0RjFBXHU0RTM0XHU2NUY2XHU1QjU4XHU2NTNFXHU1NzI4XHU4RkQ5XHU5MUNDXHVGRjBDXHU2MEE4XHU1M0VGXHU0RUU1XHU2MDYyXHU1OTBEXHU2MjE2XHU1RjdCXHU1RTk1XHU1MjIwXHU5NjY0XHU1QjgzXHU0RUVDJyxcblx0cmVmcmVzaDogJ1x1NTIzN1x1NjVCMCcsXG5cdGNsZWFyVHJhc2g6ICdcdTZFMDVcdTdBN0FcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzknLFxuXHRjbGVhclRyYXNoVG9vbHRpcDogJ1x1NkUwNVx1N0E3QVx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOScsXG5cdHJlc3RvcmVUb29sdGlwOiAnXHU2MDYyXHU1OTBEXHU2NTg3XHU0RUY2Jyxcblx0cGVybWFuZW50RGVsZXRlOiAnXHU1RjdCXHU1RTk1XHU1MjIwXHU5NjY0Jyxcblx0cGVybWFuZW50RGVsZXRlVG9vbHRpcDogJ1x1NUY3Qlx1NUU5NVx1NTIyMFx1OTY2NCcsXG5cdGRlbGV0ZWRUaW1lOiAnXHU1MjIwXHU5NjY0XHU2NUY2XHU5NUY0Jyxcblx0Y29uZmlybURlbGV0ZUZpbGU6ICdcdTc4NkVcdTVCOUFcdTg5ODFcdTVGN0JcdTVFOTVcdTUyMjBcdTk2NjQgXCJ7bmFtZX1cIiBcdTU0MTdcdUZGMUZcdTZCNjRcdTY0Q0RcdTRGNUNcdTRFMERcdTUzRUZcdTY0QTRcdTk1MDBcdTMwMDInLFxuXHRjb25maXJtQ2xlYXJUcmFzaDogJ1x1Nzg2RVx1NUI5QVx1ODk4MVx1NkUwNVx1N0E3QVx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NTQxN1x1RkYxRntjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2XHU1QzA2XHU4OEFCXHU1RjdCXHU1RTk1XHU1MjIwXHU5NjY0XHVGRjBDXHU2QjY0XHU2NENEXHU0RjVDXHU0RTBEXHU1M0VGXHU2NEE0XHU5NTAwXHUzMDAyJyxcblx0ZmlsZURlbGV0ZWQ6ICdcdTVERjJcdTVGN0JcdTVFOTVcdTUyMjBcdTk2NjQ6IHtuYW1lfScsXG5cdHJlc3RvcmVTdWNjZXNzOiAnXHU1REYyXHU2MDYyXHU1OTBEOiB7bmFtZX0nLFxuXHRyZXN0b3JlRmFpbGVkOiAnXHU2MDYyXHU1OTBEXHU1OTMxXHU4RDI1OiB7bWVzc2FnZX0nLFxuXHR0YXJnZXRGaWxlRXhpc3RzOiAnXHU3NkVFXHU2ODA3XHU2NTg3XHU0RUY2XHU1REYyXHU1QjU4XHU1NzI4Jyxcblx0ZGVsZXRlRmFpbGVkOiAnXHU1MjIwXHU5NjY0XHU1OTMxXHU4RDI1Jyxcblx0ZmlsZU5hbWVDb3BpZWQ6ICdcdTY1ODdcdTRFRjZcdTU0MERcdTVERjJcdTU5MERcdTUyMzYnLFxuXHRvcmlnaW5hbFBhdGhDb3BpZWQ6ICdcdTUzOUZcdTU5Q0JcdThERUZcdTVGODRcdTVERjJcdTU5MERcdTUyMzYnLFxuXG5cdC8vIFx1NjcyQVx1NUYxNVx1NzUyOFx1NTZGRVx1NzI0N1x1ODlDNlx1NTZGRVxuXHRzY2FubmluZ1VucmVmZXJlbmNlZDogJ1x1NkI2M1x1NTcyOFx1NjI2Qlx1NjNDRlx1NjcyQVx1NUYxNVx1NzUyOFx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNi4uLicsXG5cdHRvdGFsU2l6ZUxhYmVsOiAnXHU2MDNCXHU4QkExIHtzaXplfScsXG5cdHNjYW5FcnJvcjogJ1x1NjI2Qlx1NjNDRlx1NTZGRVx1NzI0N1x1NjVGNlx1NTFGQVx1OTUxOScsXG5cdHVucmVmZXJlbmNlZERlc2M6ICdcdTRFRTVcdTRFMEJcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTY3MkFcdTg4QUJcdTRFRkJcdTRGNTVcdTdCMTRcdThCQjBcdTVGMTVcdTc1MjhcdUZGMENcdTUzRUZcdTgwRkRcdTUzRUZcdTRFRTVcdTUyMjBcdTk2NjRcdTRFRTVcdTkxQ0FcdTY1M0VcdTdBN0FcdTk1RjQnLFxuXHRub0ZpbGVzVG9EZWxldGU6ICdcdTZDQTFcdTY3MDlcdTk3MDBcdTg5ODFcdTUyMjBcdTk2NjRcdTc2ODRcdTU2RkVcdTcyNDcnLFxuXHRwcm9jZXNzZWRGaWxlczogJ1x1NURGMlx1NTkwNFx1NzQwNiB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdHByb2Nlc3NlZEZpbGVzRXJyb3I6ICdcdTU5MDRcdTc0MDYge2Vycm9yc30gXHU0RTJBXHU2NTg3XHU0RUY2XHU2NUY2XHU1MUZBXHU5NTE5Jyxcblx0Y29weUFsbFBhdGhzOiAnXHU1OTBEXHU1MjM2XHU2MjQwXHU2NzA5XHU4REVGXHU1Rjg0Jyxcblx0Y29waWVkRmlsZVBhdGhzOiAnXHU1REYyXHU1OTBEXHU1MjM2IHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2XHU4REVGXHU1Rjg0JyxcblxuXHQvLyBcdTU2RkVcdTcyNDdcdTVFOTNcdTg5QzZcdTU2RkVcblx0bm9NYXRjaGluZ0ZpbGVzOiAnXHU2Q0ExXHU2NzA5XHU1MzM5XHU5MTREXHU3Njg0XHU2NTg3XHU0RUY2Jyxcblx0cHJldlBhZ2U6ICdcdTRFMEFcdTRFMDBcdTk4NzUnLFxuXHRuZXh0UGFnZTogJ1x1NEUwQlx1NEUwMFx1OTg3NScsXG5cdHBhZ2VJbmZvOiAnXHU3QjJDIHtjdXJyZW50fSAvIHt0b3RhbH0gXHU5ODc1Jyxcblx0c2VsZWN0RmlsZXM6ICdcdTVERjJcdTkwMDlcdTYyRTkge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjYnLFxuXHRzZWxlY3RBbGw6ICdcdTUxNjhcdTkwMDknLFxuXHRkZXNlbGVjdEFsbDogJ1x1NTNENlx1NkQ4OFx1NTE2OFx1OTAwOScsXG5cdGNvbmZpcm1EZWxldGVTZWxlY3RlZDogJ1x1Nzg2RVx1NUI5QVx1ODk4MVx1NTIyMFx1OTY2NFx1OTAwOVx1NEUyRFx1NzY4NCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNlx1NTQxN1x1RkYxRicsXG5cdGRlbGV0ZWRGaWxlczogJ1x1NURGMlx1NTIyMFx1OTY2NCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdGRlbGV0ZUZpbGVzRmFpbGVkOiAnXHU1MjIwXHU5NjY0IHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1Jyxcblx0bXVsdGlTZWxlY3RNb2RlOiAnXHU1OTFBXHU5MDA5XHU2QTIxXHU1RjBGJyxcblxuXHQvLyBcdTVBOTJcdTRGNTNcdTk4ODRcdTg5Qzhcblx0dW5zdXBwb3J0ZWRGaWxlVHlwZTogJ1x1NEUwRFx1NjUyRlx1NjMwMVx1OTg4NFx1ODlDOFx1NkI2NFx1N0M3Qlx1NTc4Qlx1NjU4N1x1NEVGNicsXG5cdGNvcHlQYXRoQnRuOiAnXHU1OTBEXHU1MjM2XHU4REVGXHU1Rjg0Jyxcblx0Y29weUxpbmtCdG46ICdcdTU5MERcdTUyMzZcdTk0RkVcdTYzQTUnLFxuXHRmaW5kSW5Ob3RlczogJ1x1NTcyOFx1N0IxNFx1OEJCMFx1NEUyRFx1NjdFNVx1NjI3RScsXG5cdHBhdGhDb3BpZWQ6ICdcdThERUZcdTVGODRcdTVERjJcdTU5MERcdTUyMzYnLFxuXHRsaW5rQ29waWVkOiAnXHU5NEZFXHU2M0E1XHU1REYyXHU1OTBEXHU1MjM2Jyxcblx0aW1hZ2VMb2FkRXJyb3I6ICdcdTU2RkVcdTcyNDdcdTUyQTBcdThGN0RcdTU5MzFcdThEMjUnLFxuXG5cdC8vIFx1NTZGRVx1NzI0N1x1NUJGOVx1OUY1MFxuXHRhbGlnbkltYWdlTGVmdDogJ1x1NTZGRVx1NzI0N1x1NUM0NVx1NURFNlx1NUJGOVx1OUY1MCcsXG5cdGFsaWduSW1hZ2VDZW50ZXI6ICdcdTU2RkVcdTcyNDdcdTVDNDVcdTRFMkRcdTVCRjlcdTlGNTAnLFxuXHRhbGlnbkltYWdlUmlnaHQ6ICdcdTU2RkVcdTcyNDdcdTVDNDVcdTUzRjNcdTVCRjlcdTlGNTAnLFxuXHRzZWxlY3RJbWFnZUZpcnN0OiAnXHU4QkY3XHU1MTQ4XHU5MDA5XHU0RTJEXHU0RTAwXHU1RjIwXHU1NkZFXHU3MjQ3Jyxcblx0c2VsZWN0SW1hZ2U6ICdcdThCRjdcdTkwMDlcdTRFMkRcdTU2RkVcdTcyNDcnLFxuXHRpbWFnZUFsaWduZWRMZWZ0OiAnXHU1NkZFXHU3MjQ3XHU1REYyXHU1QzQ1XHU1REU2XHU1QkY5XHU5RjUwJyxcblx0aW1hZ2VBbGlnbmVkQ2VudGVyOiAnXHU1NkZFXHU3MjQ3XHU1REYyXHU1QzQ1XHU0RTJEXHU1QkY5XHU5RjUwJyxcblx0aW1hZ2VBbGlnbmVkUmlnaHQ6ICdcdTU2RkVcdTcyNDdcdTVERjJcdTVDNDVcdTUzRjNcdTVCRjlcdTlGNTAnLFxuXG5cdC8vIFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NjRDRFx1NEY1Q1xuXHRjb3BpZWRGaWxlTmFtZTogJ1x1NURGMlx1NTkwRFx1NTIzNlx1NjU4N1x1NEVGNlx1NTQwRCcsXG5cdGNvcGllZE9yaWdpbmFsUGF0aDogJ1x1NURGMlx1NTkwRFx1NTIzNlx1NTM5Rlx1NTlDQlx1OERFRlx1NUY4NCcsXG5cdG5vdFJlZmVyZW5jZWQ6ICdcdThCRTVcdTU2RkVcdTcyNDdcdTY3MkFcdTg4QUJcdTRFRkJcdTRGNTVcdTdCMTRcdThCQjBcdTVGMTVcdTc1MjgnLFxuXHRtb3ZlZFRvVHJhc2g6ICdcdTVERjJcdTc5RkJcdTgxRjNcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzk6IHtuYW1lfScsXG5cdGRlbGV0ZWRGaWxlOiAnXHU1REYyXHU1MjIwXHU5NjY0OiB7bmFtZX0nLFxuXHRyZXN0b3JlZEZpbGU6ICdcdTVERjJcdTYwNjJcdTU5MERcdTY1ODdcdTRFRjYnLFxuXG5cdC8vIFx1NTQ3RFx1NEVFNFx1NTQwRFx1NzlGMFxuXHRjbWRJbWFnZUxpYnJhcnk6ICdcdTU2RkVcdTcyNDdcdTVFOTMnLFxuXHRjbWRGaW5kVW5yZWZlcmVuY2VkSW1hZ2VzOiAnXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU1NkZFXHU3MjQ3Jyxcblx0Y21kUmVmcmVzaENhY2hlOiAnXHU1MjM3XHU2NUIwXHU1QTkyXHU0RjUzXHU1RjE1XHU3NTI4XHU3RjEzXHU1QjU4Jyxcblx0Y21kQWxpZ25JbWFnZUxlZnQ6ICdcdTU2RkVcdTcyNDdcdTVDNDVcdTVERTZcdTVCRjlcdTlGNTAnLFxuXHRjbWRBbGlnbkltYWdlQ2VudGVyOiAnXHU1NkZFXHU3MjQ3XHU1QzQ1XHU0RTJEXHU1QkY5XHU5RjUwJyxcblx0Y21kQWxpZ25JbWFnZVJpZ2h0OiAnXHU1NkZFXHU3MjQ3XHU1QzQ1XHU1M0YzXHU1QkY5XHU5RjUwJyxcblx0Y21kT3Blbk1lZGlhTGlicmFyeTogJ1x1NjI1M1x1NUYwMFx1NUE5Mlx1NEY1M1x1NUU5MycsXG5cdGNtZEZpbmRVbnJlZmVyZW5jZWRNZWRpYTogJ1x1NjdFNVx1NjI3RVx1NjcyQVx1NUYxNVx1NzUyOFx1NUE5Mlx1NEY1MycsXG5cdGNtZE9wZW5UcmFzaE1hbmFnZW1lbnQ6ICdcdTYyNTNcdTVGMDBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTdCQTFcdTc0MDYnLFxuXG5cdC8vIFx1NTIyMFx1OTY2NFx1NjRDRFx1NEY1Q1xuXHRkZWxldGVGYWlsZWRXaXRoTmFtZTogJ1x1NTIyMFx1OTY2NFx1NTkzMVx1OEQyNToge25hbWV9Jyxcblx0ZGVsZXRlZFdpdGhRdWFyYW50aW5lRmFpbGVkOiAnXHU1REYyXHU1MjIwXHU5NjY0OiB7bmFtZX1cdUZGMDhcdTk2OTRcdTc5QkJcdTU5MzFcdThEMjVcdUZGMDknLFxuXHRvcGVyYXRpb25GYWlsZWQ6ICdcdTY0Q0RcdTRGNUNcdTU5MzFcdThEMjU6IHtuYW1lfScsXG5cdHByb2Nlc3Npbmc6ICdcdTU5MDRcdTc0MDZcdTRFMkQuLi4nLFxuXG5cdC8vIHYyLjAgXHU2NUIwXHU1ODlFXG5cdGR1cGxpY2F0ZURldGVjdGlvbjogJ1x1OTFDRFx1NTkwRFx1NjhDMFx1NkQ0QicsXG5cdGR1cGxpY2F0ZURldGVjdGlvbkRlc2M6ICdcdTRGN0ZcdTc1MjhcdTYxMUZcdTc3RTVcdTU0QzhcdTVFMENcdTdCOTdcdTZDRDVcdTY4QzBcdTZENEJcdTUwQ0ZcdTdEMjBcdTdFQTdcdTkxQ0RcdTU5MERcdTU2RkVcdTcyNDdcdUZGMENcdTk3NUVcdTY1ODdcdTRFRjZcdTU0MERcdTVCRjlcdTZCRDQnLFxuXHRub0R1cGxpY2F0ZXNGb3VuZDogJ1x1NjcyQVx1NTNEMVx1NzNCMFx1OTFDRFx1NTkwRFx1NjU4N1x1NEVGNlx1RkYwQ1x1NzBCOVx1NTFGQlx1MjAxQ1x1NUYwMFx1NTlDQlx1NjI2Qlx1NjNDRlx1MjAxRFx1NjhDMFx1NkQ0QicsXG5cdHN0YXJ0U2NhbjogJ1x1NUYwMFx1NTlDQlx1NjI2Qlx1NjNDRicsXG5cdHNjYW5Qcm9ncmVzczogJ1x1NjI2Qlx1NjNDRlx1OEZEQlx1NUVBNjoge2N1cnJlbnR9L3t0b3RhbH0nLFxuXHRzaW1pbGFyaXR5VGhyZXNob2xkOiAnXHU3NkY4XHU0RjNDXHU1RUE2XHU5NjA4XHU1MDNDOiB7dmFsdWV9JScsXG5cdGR1cGxpY2F0ZUdyb3Vwc0ZvdW5kOiAnXHU1M0QxXHU3M0IwIHtncm91cHN9IFx1N0VDNFx1OTFDRFx1NTkwRFx1RkYwQ1x1NTE3MSB7ZmlsZXN9IFx1NEUyQVx1NTE5N1x1NEY1OVx1NjU4N1x1NEVGNicsXG5cdGR1cGxpY2F0ZUdyb3VwOiAnXHU5MUNEXHU1OTBEXHU3RUM0ICN7aW5kZXh9Jyxcblx0ZmlsZXM6ICdcdTRFMkFcdTY1ODdcdTRFRjYnLFxuXHRzdWdnZXN0S2VlcDogJ1x1MjcwNSBcdTVFRkFcdThCQUVcdTRGRERcdTc1NTknLFxuXHRxdWFyYW50aW5lOiAnXHU5Njk0XHU3OUJCJyxcblx0cXVhcmFudGluZUFsbER1cGxpY2F0ZXM6ICdcdTRFMDBcdTk1MkVcdTk2OTRcdTc5QkJcdTYyNDBcdTY3MDlcdTkxQ0RcdTU5MEQnLFxuXHRkdXBsaWNhdGVzRm91bmQ6ICdcdTUzRDFcdTczQjAge2dyb3Vwc30gXHU3RUM0XHU5MUNEXHU1OTBEXHVGRjBDXHU1MTcxIHtmaWxlc30gXHU0RTJBXHU1MTk3XHU0RjU5XHU2NTg3XHU0RUY2Jyxcblx0ZHVwbGljYXRlc1F1YXJhbnRpbmVkOiAnXHU1REYyXHU5Njk0XHU3OUJCIHtjb3VudH0gXHU0RTJBXHU5MUNEXHU1OTBEXHU2NTg3XHU0RUY2Jyxcblx0dHlwZURpc3RyaWJ1dGlvbjogJ1x1N0M3Qlx1NTc4Qlx1NTIwNlx1NUUwMycsXG5cdHVucmVmZXJlbmNlZFJhdGU6ICdcdTY3MkFcdTVGMTVcdTc1MjhcdTczODcnLFxuXHRyZWZlcmVuY2VkQnk6ICdcdTg4QUIge2NvdW50fSBcdTdCQzdcdTdCMTRcdThCQjBcdTVGMTVcdTc1MjgnLFxuXHRzZWxlY3RlZENvdW50OiAnXHU1REYyXHU5MDA5XHU2MkU5IHtjb3VudH0gXHU5ODc5Jyxcblx0YmF0Y2hSZXN0b3JlOiAnXHU2Mjc5XHU5MUNGXHU2MDYyXHU1OTBEJyxcblx0YmF0Y2hEZWxldGU6ICdcdTYyNzlcdTkxQ0ZcdTUyMjBcdTk2NjQnLFxuXHRub0l0ZW1zU2VsZWN0ZWQ6ICdcdThCRjdcdTUxNDhcdTkwMDlcdTYyRTlcdTY1ODdcdTRFRjYnLFxuXHRjb25maXJtQmF0Y2hSZXN0b3JlOiAnXHU3ODZFXHU4QkE0XHU2MDYyXHU1OTBEIHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2XHVGRjFGJyxcblx0YmF0Y2hSZXN0b3JlQ29tcGxldGVkOiAnXHU1REYyXHU2MDYyXHU1OTBEIHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2Jyxcblx0c2FmZVNjYW46ICdcdTVCODlcdTUxNjhcdTYyNkJcdTYzQ0YnLFxuXHRzYWZlU2NhbkRlc2M6ICdcdTgxRUFcdTUyQThcdTYyNkJcdTYzQ0ZcdTY3MkFcdTVGMTVcdTc1MjhcdTMwMDFcdThEODVcdTY3MUZcdTMwMDFcdThEODVcdTU5MjdcdTc2ODRcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjYnLFxuXHRzYWZlU2NhblN0YXJ0ZWQ6ICdcdTVGMDBcdTU5Q0JcdTVCODlcdTUxNjhcdTYyNkJcdTYzQ0YuLi4nLFxuXHRzYWZlU2Nhbk5vUmVzdWx0czogJ1x1NjcyQVx1NTNEMVx1NzNCMFx1N0IyNlx1NTQwOFx1Njc2MVx1NEVGNlx1NzY4NFx1NjU4N1x1NEVGNicsXG5cdHNhZmVTY2FuQ29uZmlybTogJ1x1NTNEMVx1NzNCMCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNlx1N0IyNlx1NTQwOFx1Njc2MVx1NEVGNlx1RkYwOFx1NjcyQVx1NUYxNVx1NzUyOD57ZGF5c31cdTU5MjkgKyBcdTU5MjdcdTVDMEY+e3NpemV9XHVGRjA5XHVGRjBDXHU3ODZFXHU4QkE0XHU5MDAxXHU1MTY1XHU5Njk0XHU3OUJCXHU1MzNBXHVGRjFGJyxcblx0c2FmZVNjYW5Db21wbGV0ZTogJ1x1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRlx1NUI4Q1x1NjIxMFx1RkYwQ1x1NURGMlx1OTY5NFx1NzlCQiB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdHNhZmVTY2FuRmFpbGVkOiAnXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGXHU1OTMxXHU4RDI1Jyxcblx0Y21kRHVwbGljYXRlRGV0ZWN0aW9uOiAnXHU2MjUzXHU1RjAwXHU5MUNEXHU1OTBEXHU2OEMwXHU2RDRCJyxcblx0b3JnYW5pemluZzogJ1x1NjU3NFx1NzQwNlx1NEUyRCcsXG5cdG9yZ2FuaXplQ29tcGxldGU6ICdcdTVERjJcdTY1NzRcdTc0MDYge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjYnXG59O1xuXG5jb25zdCBlbjogVHJhbnNsYXRpb25zID0ge1xuXHQvLyBHZW5lcmFsXG5cdG9rOiAnT0snLFxuXHRjYW5jZWw6ICdDYW5jZWwnLFxuXHRkZWxldGU6ICdEZWxldGUnLFxuXHRyZXN0b3JlOiAnUmVzdG9yZScsXG5cdGNvbmZpcm06ICdDb25maXJtJyxcblx0c3VjY2VzczogJ1N1Y2Nlc3MnLFxuXHRlcnJvcjogJ0Vycm9yJyxcblxuXHQvLyBWaWV3IG5hbWVzXG5cdG1lZGlhTGlicmFyeTogJ01lZGlhIExpYnJhcnknLFxuXHR1bnJlZmVyZW5jZWRNZWRpYTogJ1VucmVmZXJlbmNlZCBNZWRpYScsXG5cdHRyYXNoTWFuYWdlbWVudDogJ1RyYXNoIE1hbmFnZW1lbnQnLFxuXG5cdC8vIE1lZGlhIExpYnJhcnlcblx0dG90YWxNZWRpYUZpbGVzOiAne2NvdW50fSBtZWRpYSBmaWxlcycsXG5cdG5vTWVkaWFGaWxlczogJ05vIG1lZGlhIGZpbGVzIGZvdW5kJyxcblx0YWxsTWVkaWFUeXBlc0Rpc2FibGVkOiAnQWxsIG1lZGlhIHR5cGVzIGhhdmUgYmVlbiBkaXNhYmxlZC4gUGxlYXNlIGVuYWJsZSBhdCBsZWFzdCBvbmUgbWVkaWEgdHlwZSBpbiBzZXR0aW5ncycsXG5cdHNlYXJjaFBsYWNlaG9sZGVyOiAnU2VhcmNoIGJ5IGZpbGVuYW1lLi4uJyxcblx0c2VhcmNoUmVzdWx0czogJ3tjb3VudH0gcmVzdWx0cyBmb3VuZCcsXG5cblx0Ly8gVW5yZWZlcmVuY2VkIE1lZGlhXG5cdHVucmVmZXJlbmNlZEZvdW5kOiAne2NvdW50fSB1bnJlZmVyZW5jZWQgbWVkaWEgZmlsZXMgZm91bmQnLFxuXHRhbGxNZWRpYVJlZmVyZW5jZWQ6ICdHcmVhdCEgQWxsIG1lZGlhIGZpbGVzIGFyZSByZWZlcmVuY2VkJyxcblx0ZGVsZXRlVG9UcmFzaDogJ0ZpbGVzIHdpbGwgYmUgbW92ZWQgdG8gdHJhc2ggZm9sZGVyJyxcblxuXHQvLyBUcmFzaCBGb2xkZXJcblx0dHJhc2hFbXB0eTogJ1RyYXNoIGZvbGRlciBpcyBlbXB0eScsXG5cdG9yaWdpbmFsUGF0aDogJ09yaWdpbmFsIGxvY2F0aW9uJyxcblx0ZGVsZXRlZEF0OiAnRGVsZXRlZCBhdCcsXG5cdGNvbmZpcm1DbGVhckFsbDogJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBlbXB0eSB0aGUgdHJhc2ggZm9sZGVyPycsXG5cblx0Ly8gQWN0aW9uc1xuXHRvcGVuSW5Ob3RlczogJ0ZpbmQgaW4gTm90ZXMnLFxuXHRjb3B5UGF0aDogJ0NvcHkgUGF0aCcsXG5cdGNvcHlMaW5rOiAnQ29weSBMaW5rJyxcblx0b3Blbk9yaWdpbmFsOiAnT3BlbiBPcmlnaW5hbCcsXG5cdHByZXZpZXc6ICdQcmV2aWV3JyxcblxuXHQvLyBTaG9ydGN1dHNcblx0c2hvcnRjdXRzOiAnU2hvcnRjdXRzJyxcblx0b3BlbkxpYnJhcnk6ICdPcGVuIE1lZGlhIExpYnJhcnknLFxuXHRmaW5kVW5yZWZlcmVuY2VkOiAnRmluZCBVbnJlZmVyZW5jZWQgTWVkaWEnLFxuXHRvcGVuVHJhc2g6ICdPcGVuIFRyYXNoIE1hbmFnZW1lbnQnLFxuXG5cdC8vIFNjYW5uaW5nIHByb2dyZXNzXG5cdHNjYW5uaW5nUmVmZXJlbmNlczogJ1NjYW5uaW5nIHJlZmVyZW5jZXMnLFxuXHRzY2FuQ29tcGxldGU6ICdTY2FuIGNvbXBsZXRlJyxcblx0ZmlsZXNTY2FubmVkOiAnZmlsZXMgc2Nhbm5lZCcsXG5cblx0Ly8gQmF0Y2ggb3BlcmF0aW9uc1xuXHRiYXRjaERlbGV0ZUNvbXBsZXRlOiAne2NvdW50fSBmaWxlcyBkZWxldGVkJyxcblx0YmF0Y2hEZWxldGVQcm9ncmVzczogJ0RlbGV0aW5nIHtjdXJyZW50fS97dG90YWx9Jyxcblx0YmF0Y2hSZXN0b3JlQ29tcGxldGU6ICd7Y291bnR9IGZpbGVzIHJlc3RvcmVkJyxcblxuXHQvLyBTZXR0aW5ncyBwYWdlXG5cdHBsdWdpblNldHRpbmdzOiAnTWVkaWEgVG9vbGtpdCBQbHVnaW4gU2V0dGluZ3MnLFxuXHRtZWRpYUZvbGRlcjogJ01lZGlhIEZvbGRlcicsXG5cdG1lZGlhRm9sZGVyRGVzYzogJ1NwZWNpZnkgdGhlIG1lZGlhIGZvbGRlciBwYXRoIHRvIHNjYW4gKGxlYXZlIGVtcHR5IHRvIHNjYW4gZW50aXJlIHZhdWx0KScsXG5cdHRodW1ibmFpbFNpemU6ICdUaHVtYm5haWwgU2l6ZScsXG5cdHRodW1ibmFpbFNpemVEZXNjOiAnQ2hvb3NlIHRodW1ibmFpbCBzaXplIGluIG1lZGlhIGxpYnJhcnkgdmlldycsXG5cdHRodW1ibmFpbFNtYWxsOiAnU21hbGwgKDEwMHB4KScsXG5cdHRodW1ibmFpbE1lZGl1bTogJ01lZGl1bSAoMTUwcHgpJyxcblx0dGh1bWJuYWlsTGFyZ2U6ICdMYXJnZSAoMjAwcHgpJyxcblx0ZGVmYXVsdFNvcnRCeTogJ0RlZmF1bHQgU29ydCBCeScsXG5cdHNvcnRCeURlc2M6ICdDaG9vc2UgZGVmYXVsdCBzb3J0IG1ldGhvZCBmb3IgaW1hZ2VzJyxcblx0c29ydE9yZGVyOiAnU29ydCBPcmRlcicsXG5cdHNvcnRPcmRlckRlc2M6ICdDaG9vc2UgYXNjZW5kaW5nIG9yIGRlc2NlbmRpbmcgb3JkZXInLFxuXHRzb3J0QnlOYW1lOiAnQnkgTmFtZScsXG5cdHNvcnRCeURhdGU6ICdCeSBEYXRlJyxcblx0c29ydEJ5U2l6ZTogJ0J5IFNpemUnLFxuXHRzb3J0QXNjOiAnQXNjZW5kaW5nJyxcblx0c29ydERlc2M6ICdEZXNjZW5kaW5nJyxcblx0c2hvd0ltYWdlSW5mbzogJ1Nob3cgSW1hZ2UgSW5mbycsXG5cdHNob3dJbWFnZUluZm9EZXNjOiAnRGlzcGxheSBmaWxlbmFtZSBhbmQgc2l6ZSBiZWxvdyBpbWFnZSB0aHVtYm5haWxzJyxcblx0YXV0b1JlZnJlc2g6ICdBdXRvIFJlZnJlc2gnLFxuXHRhdXRvUmVmcmVzaERlc2M6ICdBdXRvbWF0aWNhbGx5IHJlZnJlc2ggdmlldyB3aGVuIGltYWdlcyBjaGFuZ2UgaW4gdmF1bHQnLFxuXHRkZWZhdWx0QWxpZ25tZW50OiAnRGVmYXVsdCBJbWFnZSBBbGlnbm1lbnQnLFxuXHRhbGlnbm1lbnREZXNjOiAnRGVmYXVsdCBhbGlnbm1lbnQgd2hlbiBpbnNlcnRpbmcgaW1hZ2VzJyxcblx0YWxpZ25MZWZ0OiAnTGVmdCcsXG5cdGFsaWduQ2VudGVyOiAnQ2VudGVyJyxcblx0YWxpZ25SaWdodDogJ1JpZ2h0Jyxcblx0c2FmZURlbGV0ZVNldHRpbmdzOiAnU2FmZSBEZWxldGUgU2V0dGluZ3MnLFxuXHR1c2VUcmFzaEZvbGRlcjogJ1VzZSBUcmFzaCBGb2xkZXInLFxuXHR1c2VUcmFzaEZvbGRlckRlc2M6ICdNb3ZlIGZpbGVzIHRvIHRyYXNoIGZvbGRlciBpbnN0ZWFkIG9mIGRlbGV0aW5nIGRpcmVjdGx5Jyxcblx0dHJhc2hGb2xkZXJQYXRoOiAnVHJhc2ggRm9sZGVyJyxcblx0dHJhc2hGb2xkZXJQYXRoRGVzYzogJ1BhdGggdG8gdHJhc2ggZm9sZGVyIChyZWxhdGl2ZSBwYXRoKScsXG5cdGF1dG9DbGVhbnVwVHJhc2g6ICdBdXRvIENsZWFudXAgVHJhc2gnLFxuXHRhdXRvQ2xlYW51cFRyYXNoRGVzYzogJ0F1dG9tYXRpY2FsbHkgY2xlYW4gdXAgb2xkIGZpbGVzIGluIHRyYXNoIGZvbGRlcicsXG5cdGF1dG9DbGVhbnVwQ29tcGxldGU6ICdBdXRvIGNsZWFudXAgY29tcGxldGUsIGRlbGV0ZWQge2NvdW50fSBmaWxlcycsXG5cdGNsZWFudXBEYXlzOiAnQ2xlYW51cCBEYXlzJyxcblx0Y2xlYW51cERheXNEZXNjOiAnRmlsZXMgb2xkZXIgdGhhbiB0aGlzIG1hbnkgZGF5cyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgZGVsZXRlZCcsXG5cdG1lZGlhVHlwZXM6ICdNZWRpYSBUeXBlcycsXG5cdGVuYWJsZUltYWdlU3VwcG9ydDogJ0VuYWJsZSBJbWFnZSBTdXBwb3J0Jyxcblx0ZW5hYmxlSW1hZ2VTdXBwb3J0RGVzYzogJ1Nob3cgaW1hZ2UgZmlsZXMgaW4gbWVkaWEgbGlicmFyeSAocG5nLCBqcGcsIGdpZiwgd2VicCwgc3ZnLCBibXApJyxcblx0ZW5hYmxlVmlkZW9TdXBwb3J0OiAnRW5hYmxlIFZpZGVvIFN1cHBvcnQnLFxuXHRlbmFibGVWaWRlb1N1cHBvcnREZXNjOiAnU2hvdyB2aWRlbyBmaWxlcyBpbiBtZWRpYSBsaWJyYXJ5IChtcDQsIG1vdiwgYXZpLCBta3YsIHdlYm0pJyxcblx0ZW5hYmxlQXVkaW9TdXBwb3J0OiAnRW5hYmxlIEF1ZGlvIFN1cHBvcnQnLFxuXHRlbmFibGVBdWRpb1N1cHBvcnREZXNjOiAnU2hvdyBhdWRpbyBmaWxlcyBpbiBtZWRpYSBsaWJyYXJ5IChtcDMsIHdhdiwgb2dnLCBtNGEsIGZsYWMpJyxcblx0ZW5hYmxlUERGU3VwcG9ydDogJ0VuYWJsZSBEb2N1bWVudCBTdXBwb3J0Jyxcblx0ZW5hYmxlUERGU3VwcG9ydERlc2M6ICdTaG93IGRvY3VtZW50IGZpbGVzIGluIG1lZGlhIGxpYnJhcnkgKHBkZiwgZG9jLCBkb2N4LCB4bHMsIHhsc3gsIHBwdCwgcHB0eCknLFxuXHR2aWV3U2V0dGluZ3M6ICdWaWV3IFNldHRpbmdzJyxcblx0aW50ZXJmYWNlTGFuZ3VhZ2U6ICdJbnRlcmZhY2UgTGFuZ3VhZ2UnLFxuXHRsYW5ndWFnZURlc2M6ICdDaG9vc2UgbGFuZ3VhZ2UgZm9yIHBsdWdpbiBpbnRlcmZhY2UnLFxuXHRsYW5ndWFnZVN5c3RlbTogJ0ZvbGxvdyBTeXN0ZW0nLFxuXHRwYWdlU2l6ZTogJ1BhZ2UgU2l6ZScsXG5cdHBhZ2VTaXplRGVzYzogJ051bWJlciBvZiBmaWxlcyBwZXIgcGFnZSBpbiBtZWRpYSBsaWJyYXJ5Jyxcblx0XHRlbmFibGVQcmV2aWV3TW9kYWw6ICdFbmFibGUgUHJldmlldyBNb2RhbCcsXG5cdFx0ZW5hYmxlUHJldmlld01vZGFsRGVzYzogJ09wZW4gcHJldmlldyB3aW5kb3cgd2hlbiBjbGlja2luZyBtZWRpYSBmaWxlcycsXG5cdFx0ZW5hYmxlS2V5Ym9hcmROYXY6ICdFbmFibGUgS2V5Ym9hcmQgTmF2aWdhdGlvbicsXG5cdFx0ZW5hYmxlS2V5Ym9hcmROYXZEZXNjOiAnVXNlIGFycm93IGtleXMgdG8gbmF2aWdhdGUgaW4gcHJldmlldyB3aW5kb3cnLFxuXHRcdHNhZmVTY2FuU2V0dGluZ3M6ICdTYWZlIFNjYW4nLFxuXHRcdHNhZmVTY2FuRW5hYmxlZERlc2M6ICdFbmFibGUgY29uZGl0aW9uYWwgc2Nhbm5pbmcgZnJvbSB0cmFzaCBtYW5hZ2VtZW50IHZpZXcnLFxuXHRcdHNhZmVTY2FuVW5yZWZEYXlzOiAnVW5yZWZlcmVuY2VkIERheXMnLFxuXHRcdHNhZmVTY2FuVW5yZWZEYXlzRGVzYzogJ09ubHkgc2NhbiBtZWRpYSBmaWxlcyB1bnJlZmVyZW5jZWQgZm9yIGF0IGxlYXN0IHRoaXMgbWFueSBkYXlzJyxcblx0XHRzYWZlU2Nhbk1pblNpemU6ICdNaW5pbXVtIEZpbGUgU2l6ZSAoTUIpJyxcblx0XHRzYWZlU2Nhbk1pblNpemVEZXNjOiAnT25seSBzY2FuIG1lZGlhIGZpbGVzIGF0IG9yIGFib3ZlIHRoaXMgc2l6ZScsXG5cdFx0ZHVwbGljYXRlRGV0ZWN0aW9uU2V0dGluZ3M6ICdEdXBsaWNhdGUgRGV0ZWN0aW9uJyxcblx0XHRkdXBsaWNhdGVUaHJlc2hvbGRTZXR0aW5nOiAnU2ltaWxhcml0eSBUaHJlc2hvbGQnLFxuXHRcdGR1cGxpY2F0ZVRocmVzaG9sZERlc2M6ICdPbmx5IGdyb3VwcyBhdCBvciBhYm92ZSB0aGlzIHBlcmNlbnRhZ2UgYXJlIHRyZWF0ZWQgYXMgZHVwbGljYXRlcycsXG5cdFx0a2V5Ym9hcmRTaG9ydGN1dHM6ICdLZXlib2FyZCBTaG9ydGN1dHMnLFxuXHRcdHNob3J0Y3V0c0Rlc2M6ICdQbHVnaW4ga2V5Ym9hcmQgc2hvcnRjdXRzOicsXG5cdFx0c2hvcnRjdXRPcGVuTGlicmFyeTogJ0N0cmwrU2hpZnQrTSAtIE9wZW4gTWVkaWEgTGlicmFyeScsXG5cdHNob3J0Y3V0RmluZFVucmVmZXJlbmNlZDogJ0N0cmwrU2hpZnQrVSAtIEZpbmQgVW5yZWZlcmVuY2VkIE1lZGlhJyxcblx0c2hvcnRjdXRPcGVuVHJhc2g6ICdDdHJsK1NoaWZ0K1QgLSBPcGVuIFRyYXNoIE1hbmFnZW1lbnQnLFxuXHRjb21tYW5kczogJ0NvbW1hbmRzJyxcblx0Y29tbWFuZHNEZXNjOiAnVXNlIHRoZXNlIGNvbW1hbmRzIGluIGNvbW1hbmQgcGFsZXR0ZTonLFxuXHRjbWRPcGVuTGlicmFyeTogJ01lZGlhIExpYnJhcnkgLSBPcGVuIG1lZGlhIGxpYnJhcnkgdmlldycsXG5cdGNtZEZpbmRVbnJlZmVyZW5jZWQ6ICdGaW5kIFVucmVmZXJlbmNlZCBNZWRpYSAtIEZpbmQgbWVkaWEgZmlsZXMgbm90IHJlZmVyZW5jZWQgYnkgYW55IG5vdGVzJyxcblx0Y21kVHJhc2hNYW5hZ2VtZW50OiAnVHJhc2ggTWFuYWdlbWVudCAtIE1hbmFnZSBkZWxldGVkIGZpbGVzJyxcblx0Y21kQWxpZ25MZWZ0OiAnQWxpZ24gSW1hZ2UgTGVmdCAtIEFsaWduIHNlbGVjdGVkIGltYWdlIHRvIGxlZnQnLFxuXHRjbWRBbGlnbkNlbnRlcjogJ0FsaWduIEltYWdlIENlbnRlciAtIENlbnRlciBhbGlnbiBzZWxlY3RlZCBpbWFnZScsXG5cdGNtZEFsaWduUmlnaHQ6ICdBbGlnbiBJbWFnZSBSaWdodCAtIEFsaWduIHNlbGVjdGVkIGltYWdlIHRvIHJpZ2h0JyxcblxuXHQvLyBUcmFzaCBNYW5hZ2VtZW50IFZpZXdcblx0bG9hZGluZ1RyYXNoRmlsZXM6ICdMb2FkaW5nIHRyYXNoIGZpbGVzLi4uJyxcblx0dHJhc2hGb2xkZXJFbXB0eTogJ1RyYXNoIGZvbGRlciBpcyBlbXB0eScsXG5cdGZpbGVzSW5UcmFzaDogJ3tjb3VudH0gZmlsZXMgaW4gdHJhc2ggZm9sZGVyJyxcblx0dG90YWxTaXplOiAnVG90YWw6IHtzaXplfScsXG5cdHRyYXNoTWFuYWdlbWVudERlc2M6ICdEZWxldGVkIGZpbGVzIGFyZSB0ZW1wb3JhcmlseSBzdG9yZWQgaGVyZS4gWW91IGNhbiByZXN0b3JlIG9yIHBlcm1hbmVudGx5IGRlbGV0ZSB0aGVtLicsXG5cdHJlZnJlc2g6ICdSZWZyZXNoJyxcblx0Y2xlYXJUcmFzaDogJ0VtcHR5IFRyYXNoJyxcblx0Y2xlYXJUcmFzaFRvb2x0aXA6ICdFbXB0eSB0cmFzaCBmb2xkZXInLFxuXHRyZXN0b3JlVG9vbHRpcDogJ1Jlc3RvcmUgZmlsZScsXG5cdHBlcm1hbmVudERlbGV0ZTogJ0RlbGV0ZScsXG5cdHBlcm1hbmVudERlbGV0ZVRvb2x0aXA6ICdQZXJtYW5lbnRseSBkZWxldGUnLFxuXHRkZWxldGVkVGltZTogJ0RlbGV0ZWQgYXQnLFxuXHRjb25maXJtRGVsZXRlRmlsZTogJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBwZXJtYW5lbnRseSBkZWxldGUgXCJ7bmFtZX1cIj8gVGhpcyBjYW5ub3QgYmUgdW5kb25lLicsXG5cdGNvbmZpcm1DbGVhclRyYXNoOiAnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGVtcHR5IHRoZSB0cmFzaCBmb2xkZXI/IHtjb3VudH0gZmlsZXMgd2lsbCBiZSBwZXJtYW5lbnRseSBkZWxldGVkLiBUaGlzIGNhbm5vdCBiZSB1bmRvbmUuJyxcblx0ZmlsZURlbGV0ZWQ6ICdQZXJtYW5lbnRseSBkZWxldGVkOiB7bmFtZX0nLFxuXHRyZXN0b3JlU3VjY2VzczogJ1Jlc3RvcmVkOiB7bmFtZX0nLFxuXHRyZXN0b3JlRmFpbGVkOiAnUmVzdG9yZSBmYWlsZWQ6IHttZXNzYWdlfScsXG5cdHRhcmdldEZpbGVFeGlzdHM6ICdUYXJnZXQgZmlsZSBhbHJlYWR5IGV4aXN0cycsXG5cdGRlbGV0ZUZhaWxlZDogJ0RlbGV0ZSBmYWlsZWQnLFxuXHRmaWxlTmFtZUNvcGllZDogJ0ZpbGUgbmFtZSBjb3BpZWQnLFxuXHRvcmlnaW5hbFBhdGhDb3BpZWQ6ICdPcmlnaW5hbCBwYXRoIGNvcGllZCcsXG5cblx0Ly8gVW5yZWZlcmVuY2VkIEltYWdlcyBWaWV3XG5cdHNjYW5uaW5nVW5yZWZlcmVuY2VkOiAnU2Nhbm5pbmcgdW5yZWZlcmVuY2VkIG1lZGlhIGZpbGVzLi4uJyxcblx0dG90YWxTaXplTGFiZWw6ICdUb3RhbDoge3NpemV9Jyxcblx0c2NhbkVycm9yOiAnRXJyb3Igc2Nhbm5pbmcgaW1hZ2VzJyxcblx0dW5yZWZlcmVuY2VkRGVzYzogJ1RoZXNlIG1lZGlhIGZpbGVzIGFyZSBub3QgcmVmZXJlbmNlZCBieSBhbnkgbm90ZXMgYW5kIGNhbiBiZSBkZWxldGVkIHRvIGZyZWUgdXAgc3BhY2UnLFxuXHRub0ZpbGVzVG9EZWxldGU6ICdObyBmaWxlcyB0byBkZWxldGUnLFxuXHRwcm9jZXNzZWRGaWxlczogJ1Byb2Nlc3NlZCB7Y291bnR9IGZpbGVzJyxcblx0cHJvY2Vzc2VkRmlsZXNFcnJvcjogJ0Vycm9yIHByb2Nlc3Npbmcge2Vycm9yc30gZmlsZXMnLFxuXHRjb3B5QWxsUGF0aHM6ICdDb3B5IGFsbCBwYXRocycsXG5cdGNvcGllZEZpbGVQYXRoczogJ0NvcGllZCB7Y291bnR9IGZpbGUgcGF0aHMnLFxuXG5cdC8vIEltYWdlIExpYnJhcnkgVmlld1xuXHRub01hdGNoaW5nRmlsZXM6ICdObyBtYXRjaGluZyBmaWxlcycsXG5cdHByZXZQYWdlOiAnUHJldmlvdXMnLFxuXHRuZXh0UGFnZTogJ05leHQnLFxuXHRwYWdlSW5mbzogJ1BhZ2Uge2N1cnJlbnR9IC8ge3RvdGFsfScsXG5cdHNlbGVjdEZpbGVzOiAne2NvdW50fSBmaWxlcyBzZWxlY3RlZCcsXG5cdHNlbGVjdEFsbDogJ1NlbGVjdCBBbGwnLFxuXHRkZXNlbGVjdEFsbDogJ0Rlc2VsZWN0IEFsbCcsXG5cdGNvbmZpcm1EZWxldGVTZWxlY3RlZDogJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUge2NvdW50fSBzZWxlY3RlZCBmaWxlcz8nLFxuXHRkZWxldGVkRmlsZXM6ICd7Y291bnR9IGZpbGVzIGRlbGV0ZWQnLFxuXHRkZWxldGVGaWxlc0ZhaWxlZDogJ0ZhaWxlZCB0byBkZWxldGUge2NvdW50fSBmaWxlcycsXG5cdG11bHRpU2VsZWN0TW9kZTogJ011bHRpLXNlbGVjdCBtb2RlJyxcblxuXHQvLyBNZWRpYSBQcmV2aWV3XG5cdHVuc3VwcG9ydGVkRmlsZVR5cGU6ICdQcmV2aWV3IG5vdCBzdXBwb3J0ZWQgZm9yIHRoaXMgZmlsZSB0eXBlJyxcblx0Y29weVBhdGhCdG46ICdDb3B5IFBhdGgnLFxuXHRjb3B5TGlua0J0bjogJ0NvcHkgTGluaycsXG5cdGZpbmRJbk5vdGVzOiAnRmluZCBpbiBOb3RlcycsXG5cdHBhdGhDb3BpZWQ6ICdQYXRoIGNvcGllZCcsXG5cdGxpbmtDb3BpZWQ6ICdMaW5rIGNvcGllZCcsXG5cdGltYWdlTG9hZEVycm9yOiAnSW1hZ2UgZmFpbGVkIHRvIGxvYWQnLFxuXG5cdC8vIEltYWdlIGFsaWdubWVudFxuXHRhbGlnbkltYWdlTGVmdDogJ0FsaWduIEltYWdlIExlZnQnLFxuXHRhbGlnbkltYWdlQ2VudGVyOiAnQWxpZ24gSW1hZ2UgQ2VudGVyJyxcblx0YWxpZ25JbWFnZVJpZ2h0OiAnQWxpZ24gSW1hZ2UgUmlnaHQnLFxuXHRzZWxlY3RJbWFnZUZpcnN0OiAnUGxlYXNlIHNlbGVjdCBhbiBpbWFnZSBmaXJzdCcsXG5cdHNlbGVjdEltYWdlOiAnUGxlYXNlIHNlbGVjdCBhbiBpbWFnZScsXG5cdGltYWdlQWxpZ25lZExlZnQ6ICdJbWFnZSBhbGlnbmVkIHRvIGxlZnQnLFxuXHRpbWFnZUFsaWduZWRDZW50ZXI6ICdJbWFnZSBjZW50ZXJlZCcsXG5cdGltYWdlQWxpZ25lZFJpZ2h0OiAnSW1hZ2UgYWxpZ25lZCB0byByaWdodCcsXG5cblx0Ly8gVHJhc2ggZm9sZGVyIG9wZXJhdGlvbnNcblx0Y29waWVkRmlsZU5hbWU6ICdGaWxlIG5hbWUgY29waWVkJyxcblx0Y29waWVkT3JpZ2luYWxQYXRoOiAnT3JpZ2luYWwgcGF0aCBjb3BpZWQnLFxuXHRub3RSZWZlcmVuY2VkOiAnVGhpcyBpbWFnZSBpcyBub3QgcmVmZXJlbmNlZCBieSBhbnkgbm90ZXMnLFxuXHRtb3ZlZFRvVHJhc2g6ICdNb3ZlZCB0byB0cmFzaCBmb2xkZXI6IHtuYW1lfScsXG5cdGRlbGV0ZWRGaWxlOiAnRGVsZXRlZDoge25hbWV9Jyxcblx0cmVzdG9yZWRGaWxlOiAnRmlsZSByZXN0b3JlZCcsXG5cblx0Ly8gQ29tbWFuZCBuYW1lc1xuXHRjbWRJbWFnZUxpYnJhcnk6ICdJbWFnZSBMaWJyYXJ5Jyxcblx0Y21kRmluZFVucmVmZXJlbmNlZEltYWdlczogJ0ZpbmQgVW5yZWZlcmVuY2VkIEltYWdlcycsXG5cdGNtZFJlZnJlc2hDYWNoZTogJ1JlZnJlc2ggTWVkaWEgUmVmZXJlbmNlIENhY2hlJyxcblx0Y21kQWxpZ25JbWFnZUxlZnQ6ICdBbGlnbiBJbWFnZSBMZWZ0Jyxcblx0Y21kQWxpZ25JbWFnZUNlbnRlcjogJ0FsaWduIEltYWdlIENlbnRlcicsXG5cdGNtZEFsaWduSW1hZ2VSaWdodDogJ0FsaWduIEltYWdlIFJpZ2h0Jyxcblx0Y21kT3Blbk1lZGlhTGlicmFyeTogJ09wZW4gTWVkaWEgTGlicmFyeScsXG5cdGNtZEZpbmRVbnJlZmVyZW5jZWRNZWRpYTogJ0ZpbmQgVW5yZWZlcmVuY2VkIE1lZGlhJyxcblx0Y21kT3BlblRyYXNoTWFuYWdlbWVudDogJ09wZW4gVHJhc2ggTWFuYWdlbWVudCcsXG5cblx0Ly8gRGVsZXRlIG9wZXJhdGlvbnNcblx0ZGVsZXRlRmFpbGVkV2l0aE5hbWU6ICdEZWxldGUgZmFpbGVkOiB7bmFtZX0nLFxuXHRkZWxldGVkV2l0aFF1YXJhbnRpbmVGYWlsZWQ6ICdEZWxldGVkOiB7bmFtZX0gKHF1YXJhbnRpbmUgZmFpbGVkKScsXG5cdG9wZXJhdGlvbkZhaWxlZDogJ09wZXJhdGlvbiBmYWlsZWQ6IHtuYW1lfScsXG5cdHByb2Nlc3Npbmc6ICdQcm9jZXNzaW5nLi4uJyxcblxuXHQvLyB2Mi4wIG5ld1xuXHRkdXBsaWNhdGVEZXRlY3Rpb246ICdEdXBsaWNhdGUgRGV0ZWN0aW9uJyxcblx0ZHVwbGljYXRlRGV0ZWN0aW9uRGVzYzogJ0RldGVjdCBwaXhlbC1sZXZlbCBkdXBsaWNhdGUgaW1hZ2VzIHVzaW5nIHBlcmNlcHR1YWwgaGFzaGluZyBhbGdvcml0aG0nLFxuXHRub0R1cGxpY2F0ZXNGb3VuZDogJ05vIGR1cGxpY2F0ZXMgZm91bmQuIENsaWNrIFwiU3RhcnQgU2NhblwiIHRvIGRldGVjdC4nLFxuXHRzdGFydFNjYW46ICdTdGFydCBTY2FuJyxcblx0c2NhblByb2dyZXNzOiAnU2Nhbm5pbmc6IHtjdXJyZW50fS97dG90YWx9Jyxcblx0c2ltaWxhcml0eVRocmVzaG9sZDogJ1NpbWlsYXJpdHkgdGhyZXNob2xkOiB7dmFsdWV9JScsXG5cdGR1cGxpY2F0ZUdyb3Vwc0ZvdW5kOiAnRm91bmQge2dyb3Vwc30gZ3JvdXAocyksIHtmaWxlc30gcmVkdW5kYW50IGZpbGUocyknLFxuXHRkdXBsaWNhdGVHcm91cDogJ0dyb3VwICN7aW5kZXh9Jyxcblx0ZmlsZXM6ICdmaWxlcycsXG5cdHN1Z2dlc3RLZWVwOiAnXHUyNzA1IEtlZXAnLFxuXHRxdWFyYW50aW5lOiAnUXVhcmFudGluZScsXG5cdHF1YXJhbnRpbmVBbGxEdXBsaWNhdGVzOiAnUXVhcmFudGluZSBBbGwgRHVwbGljYXRlcycsXG5cdGR1cGxpY2F0ZXNGb3VuZDogJ0ZvdW5kIHtncm91cHN9IGdyb3VwKHMpLCB7ZmlsZXN9IHJlZHVuZGFudCBmaWxlKHMpJyxcblx0ZHVwbGljYXRlc1F1YXJhbnRpbmVkOiAnUXVhcmFudGluZWQge2NvdW50fSBkdXBsaWNhdGUgZmlsZShzKScsXG5cdHR5cGVEaXN0cmlidXRpb246ICdUeXBlIERpc3RyaWJ1dGlvbicsXG5cdHVucmVmZXJlbmNlZFJhdGU6ICdVbnJlZmVyZW5jZWQgUmF0ZScsXG5cdHJlZmVyZW5jZWRCeTogJ1JlZmVyZW5jZWQgYnkge2NvdW50fSBub3RlKHMpJyxcblx0c2VsZWN0ZWRDb3VudDogJ3tjb3VudH0gc2VsZWN0ZWQnLFxuXHRiYXRjaFJlc3RvcmU6ICdCYXRjaCBSZXN0b3JlJyxcblx0YmF0Y2hEZWxldGU6ICdCYXRjaCBEZWxldGUnLFxuXHRub0l0ZW1zU2VsZWN0ZWQ6ICdQbGVhc2Ugc2VsZWN0IGZpbGVzIGZpcnN0Jyxcblx0Y29uZmlybUJhdGNoUmVzdG9yZTogJ1Jlc3RvcmUge2NvdW50fSBmaWxlKHMpPycsXG5cdGJhdGNoUmVzdG9yZUNvbXBsZXRlZDogJ1Jlc3RvcmVkIHtjb3VudH0gZmlsZShzKScsXG5cdHNhZmVTY2FuOiAnU2FmZSBTY2FuJyxcblx0c2FmZVNjYW5EZXNjOiAnQXV0by1kZXRlY3QgdW5yZWZlcmVuY2VkLCBvbGQsIGFuZCBsYXJnZSBtZWRpYSBmaWxlcycsXG5cdHNhZmVTY2FuU3RhcnRlZDogJ1N0YXJ0aW5nIHNhZmUgc2Nhbi4uLicsXG5cdHNhZmVTY2FuTm9SZXN1bHRzOiAnTm8gZmlsZXMgbWF0Y2ggdGhlIGNyaXRlcmlhJyxcblx0c2FmZVNjYW5Db25maXJtOiAnRm91bmQge2NvdW50fSBmaWxlKHMpIG1hdGNoaW5nIGNyaXRlcmlhICh1bnJlZmVyZW5jZWQgPntkYXlzfSBkYXlzICsgc2l6ZSA+e3NpemV9KS4gU2VuZCB0byBxdWFyYW50aW5lPycsXG5cdHNhZmVTY2FuQ29tcGxldGU6ICdTYWZlIHNjYW4gY29tcGxldGUsIHF1YXJhbnRpbmVkIHtjb3VudH0gZmlsZShzKScsXG5cdHNhZmVTY2FuRmFpbGVkOiAnU2FmZSBzY2FuIGZhaWxlZCcsXG5cdGNtZER1cGxpY2F0ZURldGVjdGlvbjogJ09wZW4gRHVwbGljYXRlIERldGVjdGlvbicsXG5cdG9yZ2FuaXppbmc6ICdPcmdhbml6aW5nJyxcblx0b3JnYW5pemVDb21wbGV0ZTogJ09yZ2FuaXplZCB7Y291bnR9IGZpbGUocyknXG59O1xuXG5jb25zdCB0cmFuc2xhdGlvbnM6IFJlY29yZDxMYW5ndWFnZSwgVHJhbnNsYXRpb25zPiA9IHsgemgsIGVuIH07XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU3RkZCXHU4QkQxXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0KGxhbmc6IExhbmd1YWdlLCBrZXk6IGtleW9mIFRyYW5zbGF0aW9ucywgcGFyYW1zPzogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPik6IHN0cmluZyB7XG5cdGxldCB0ZXh0ID0gKHRyYW5zbGF0aW9uc1tsYW5nXSA/PyB0cmFuc2xhdGlvbnNbJ3poJ10pW2tleV0gfHwgdHJhbnNsYXRpb25zWyd6aCddW2tleV0gfHwga2V5O1xuXG5cdGlmIChwYXJhbXMpIHtcblx0XHRPYmplY3QuZW50cmllcyhwYXJhbXMpLmZvckVhY2goKFtrLCB2XSkgPT4ge1xuXHRcdFx0dGV4dCA9IHRleHQuc3BsaXQoYHske2t9fWApLmpvaW4oU3RyaW5nKHYpKTtcblx0XHR9KTtcblx0fVxuXG5cdHJldHVybiB0ZXh0O1xufVxuXG4vKipcbiAqIFx1ODNCN1x1NTNENlx1N0NGQlx1N0VERlx1OEJFRFx1OEEwMFx1OEJCRVx1N0Y2RVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3lzdGVtTGFuZ3VhZ2UoKTogTGFuZ3VhZ2Uge1xuXHQvLyBcdTY4QzBcdTY3RTUgbmF2aWdhdG9yIFx1NjYyRlx1NTQyNlx1NUI1OFx1NTcyOFx1RkYwOFx1OTc1RVx1NkQ0Rlx1ODlDOFx1NTY2OFx1NzNBRlx1NTg4M1x1NTNFRlx1ODBGRFx1NEUwRFx1NUI1OFx1NTcyOFx1RkYwOVxuXHRjb25zdCBuYXZMYW5ndWFnZSA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnID8gbmF2aWdhdG9yLmxhbmd1YWdlIDogbnVsbDtcblx0Y29uc3QgbGFuZyA9IG5hdkxhbmd1YWdlID8gbmF2TGFuZ3VhZ2UudG9Mb3dlckNhc2UoKSA6ICd6aCc7XG5cdGlmIChsYW5nLnN0YXJ0c1dpdGgoJ3poJykpIHJldHVybiAnemgnO1xuXHRyZXR1cm4gJ2VuJztcbn1cblxuZXhwb3J0IGRlZmF1bHQgeyB0LCBnZXRTeXN0ZW1MYW5ndWFnZSwgemgsIGVuIH07XG4iLCAiLyoqXG4gKiBcdTU4OUVcdTkxQ0ZcdTY1ODdcdTRFRjZcdTYyNkJcdTYzQ0YgKyBcdTY1ODdcdTRFRjZcdTc2RDFcdTg5QzZcdTU2NjhcbiAqIFx1N0VGNFx1NjJBNFx1NTE4NVx1NUI1OFx1NEUyRFx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1N0QyMlx1NUYxNVx1RkYwQ1x1OTA3Rlx1NTE0RFx1NkJDRlx1NkIyMVx1ODlDNlx1NTZGRVx1NTIzN1x1NjVCMFx1NTE2OFx1OTFDRlx1OTA0RFx1NTM4NiBWYXVsdFxuICovXG5cbmltcG9ydCB7IFRGaWxlLCBUQWJzdHJhY3RGaWxlLCBWYXVsdCwgRXZlbnRzIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgaXNNZWRpYUZpbGUgfSBmcm9tICcuL21lZGlhVHlwZXMnO1xuaW1wb3J0IHsgVGh1bWJuYWlsQ2FjaGUgfSBmcm9tICcuL3RodW1ibmFpbENhY2hlJztcblxuZXhwb3J0IGludGVyZmFjZSBGaWxlRW50cnkge1xuXHRwYXRoOiBzdHJpbmc7XG5cdG5hbWU6IHN0cmluZztcblx0c2l6ZTogbnVtYmVyO1xuXHRtdGltZTogbnVtYmVyO1xuXHRleHRlbnNpb246IHN0cmluZztcbn1cblxudHlwZSBDaGFuZ2VUeXBlID0gJ2NyZWF0ZScgfCAnbW9kaWZ5JyB8ICdkZWxldGUnIHwgJ3JlbmFtZSc7XG50eXBlIENoYW5nZUxpc3RlbmVyID0gKHR5cGU6IENoYW5nZVR5cGUsIGVudHJ5OiBGaWxlRW50cnksIG9sZFBhdGg/OiBzdHJpbmcpID0+IHZvaWQ7XG5cbmV4cG9ydCBjbGFzcyBNZWRpYUZpbGVJbmRleCB7XG5cdHByaXZhdGUgaW5kZXg6IE1hcDxzdHJpbmcsIEZpbGVFbnRyeT4gPSBuZXcgTWFwKCk7XG5cdHByaXZhdGUgdmF1bHQ6IFZhdWx0O1xuXHRwcml2YXRlIHRodW1ibmFpbENhY2hlOiBUaHVtYm5haWxDYWNoZSB8IG51bGw7XG5cdHByaXZhdGUgbGlzdGVuZXJzOiBDaGFuZ2VMaXN0ZW5lcltdID0gW107XG5cdHByaXZhdGUgZW5hYmxlZEV4dGVuc2lvbnM6IFNldDxzdHJpbmc+ID0gbmV3IFNldCgpO1xuXHRwcml2YXRlIHRyYXNoRm9sZGVyOiBzdHJpbmcgPSAnJztcblx0cHJpdmF0ZSBpbml0aWFsaXplZCA9IGZhbHNlO1xuXG5cdGNvbnN0cnVjdG9yKHZhdWx0OiBWYXVsdCwgdGh1bWJuYWlsQ2FjaGU6IFRodW1ibmFpbENhY2hlIHwgbnVsbCA9IG51bGwpIHtcblx0XHR0aGlzLnZhdWx0ID0gdmF1bHQ7XG5cdFx0dGhpcy50aHVtYm5haWxDYWNoZSA9IHRodW1ibmFpbENhY2hlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjZGNFx1NjVCMFx1NTQyRlx1NzUyOFx1NzY4NFx1NjI2OVx1NUM1NVx1NTQwRFx1RkYwOFx1OEJCRVx1N0Y2RVx1NTNEOFx1NjZGNFx1NjVGNlx1OEMwM1x1NzUyOFx1RkYwOVxuXHQgKi9cblx0c2V0RW5hYmxlZEV4dGVuc2lvbnMoZXh0ZW5zaW9uczogc3RyaW5nW10pOiB2b2lkIHtcblx0XHR0aGlzLmVuYWJsZWRFeHRlbnNpb25zID0gbmV3IFNldChleHRlbnNpb25zLm1hcChlID0+IGUudG9Mb3dlckNhc2UoKSkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1OEJCRVx1N0Y2RVx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1OERFRlx1NUY4NFx1RkYwOFx1NjM5Mlx1OTY2NFx1OEJFNVx1NjU4N1x1NEVGNlx1NTkzOVx1NTE4NVx1NzY4NFx1NjU4N1x1NEVGNlx1RkYwOVxuXHQgKi9cblx0c2V0VHJhc2hGb2xkZXIocGF0aDogc3RyaW5nKTogdm9pZCB7XG5cdFx0dGhpcy50cmFzaEZvbGRlciA9IHBhdGg7XG5cdH1cblxuXHQvKipcblx0ICogXHU1MjI0XHU2NUFEXHU2NTg3XHU0RUY2XHU2NjJGXHU1NDI2XHU1NzI4XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTJEXG5cdCAqL1xuXHRwcml2YXRlIGlzSW5UcmFzaEZvbGRlcihmaWxlUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG5cdFx0aWYgKCF0aGlzLnRyYXNoRm9sZGVyKSByZXR1cm4gZmFsc2U7XG5cdFx0cmV0dXJuIGZpbGVQYXRoLnN0YXJ0c1dpdGgodGhpcy50cmFzaEZvbGRlciArICcvJykgfHwgZmlsZVBhdGggPT09IHRoaXMudHJhc2hGb2xkZXI7XG5cdH1cblxuXHQvKipcblx0ICogXHU1MjI0XHU2NUFEXHU2NTg3XHU0RUY2XHU2NjJGXHU1NDI2XHU1RTk0XHU4QkU1XHU4OEFCXHU3RDIyXHU1RjE1XG5cdCAqL1xuXHRwcml2YXRlIHNob3VsZEluZGV4KGZpbGU6IFRBYnN0cmFjdEZpbGUpOiBib29sZWFuIHtcblx0XHRpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSByZXR1cm4gZmFsc2U7XG5cdFx0aWYgKHRoaXMuaXNJblRyYXNoRm9sZGVyKGZpbGUucGF0aCkpIHJldHVybiBmYWxzZTtcblxuXHRcdGNvbnN0IGV4dCA9ICcuJyArIGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKHRoaXMuZW5hYmxlZEV4dGVuc2lvbnMuc2l6ZSA+IDApIHtcblx0XHRcdHJldHVybiB0aGlzLmVuYWJsZWRFeHRlbnNpb25zLmhhcyhleHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gaXNNZWRpYUZpbGUoZmlsZS5uYW1lKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTRFQ0UgVEZpbGUgXHU1MjFCXHU1RUZBIEZpbGVFbnRyeVxuXHQgKi9cblx0cHJpdmF0ZSB0b0VudHJ5KGZpbGU6IFRGaWxlKTogRmlsZUVudHJ5IHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cGF0aDogZmlsZS5wYXRoLFxuXHRcdFx0bmFtZTogZmlsZS5uYW1lLFxuXHRcdFx0c2l6ZTogZmlsZS5zdGF0LnNpemUsXG5cdFx0XHRtdGltZTogZmlsZS5zdGF0Lm10aW1lLFxuXHRcdFx0ZXh0ZW5zaW9uOiBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTk5OTZcdTZCMjFcdTUxNjhcdTkxQ0ZcdTYyNkJcdTYzQ0ZcdUZGMENcdTVFRkFcdTdBQ0JcdTdEMjJcdTVGMTVcblx0ICovXG5cdGFzeW5jIGZ1bGxTY2FuKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdHRoaXMuaW5kZXguY2xlYXIoKTtcblxuXHRcdGNvbnN0IGFsbEZpbGVzID0gdGhpcy52YXVsdC5nZXRGaWxlcygpO1xuXHRcdGZvciAoY29uc3QgZmlsZSBvZiBhbGxGaWxlcykge1xuXHRcdFx0aWYgKHRoaXMuc2hvdWxkSW5kZXgoZmlsZSkpIHtcblx0XHRcdFx0dGhpcy5pbmRleC5zZXQoZmlsZS5wYXRoLCB0aGlzLnRvRW50cnkoZmlsZSkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjU4N1x1NEVGNlx1NTNEOFx1NTMxNlx1NEU4Qlx1NEVGNlx1NTkwNFx1NzQwNlx1NTY2OFx1RkYwOFx1NzUzMSBWYXVsdCBcdTRFOEJcdTRFRjZcdTU2REVcdThDMDNcdThDMDNcdTc1MjhcdUZGMDlcblx0ICovXG5cdG9uRmlsZUNyZWF0ZWQoZmlsZTogVEFic3RyYWN0RmlsZSk6IHZvaWQge1xuXHRcdGlmICghdGhpcy5zaG91bGRJbmRleChmaWxlKSkgcmV0dXJuO1xuXHRcdGNvbnN0IGVudHJ5ID0gdGhpcy50b0VudHJ5KGZpbGUgYXMgVEZpbGUpO1xuXHRcdHRoaXMuaW5kZXguc2V0KGVudHJ5LnBhdGgsIGVudHJ5KTtcblx0XHR0aGlzLm5vdGlmeUxpc3RlbmVycygnY3JlYXRlJywgZW50cnkpO1xuXHR9XG5cblx0b25GaWxlTW9kaWZpZWQoZmlsZTogVEFic3RyYWN0RmlsZSk6IHZvaWQge1xuXHRcdGlmICghdGhpcy5zaG91bGRJbmRleChmaWxlKSkgcmV0dXJuO1xuXHRcdGNvbnN0IGVudHJ5ID0gdGhpcy50b0VudHJ5KGZpbGUgYXMgVEZpbGUpO1xuXHRcdHRoaXMuaW5kZXguc2V0KGVudHJ5LnBhdGgsIGVudHJ5KTtcblx0XHR0aGlzLm5vdGlmeUxpc3RlbmVycygnbW9kaWZ5JywgZW50cnkpO1xuXHR9XG5cblx0b25GaWxlRGVsZXRlZChmaWxlOiBUQWJzdHJhY3RGaWxlKTogdm9pZCB7XG5cdFx0Y29uc3QgcGF0aCA9IGZpbGUucGF0aDtcblx0XHRjb25zdCBleGlzdGluZyA9IHRoaXMuaW5kZXguZ2V0KHBhdGgpO1xuXHRcdGlmICghZXhpc3RpbmcpIHJldHVybjtcblxuXHRcdHRoaXMuaW5kZXguZGVsZXRlKHBhdGgpO1xuXG5cdFx0Ly8gXHU2RTA1XHU3NDA2XHU3RjI5XHU3NTY1XHU1NkZFXHU3RjEzXHU1QjU4XG5cdFx0aWYgKHRoaXMudGh1bWJuYWlsQ2FjaGUpIHtcblx0XHRcdHZvaWQgdGhpcy50aHVtYm5haWxDYWNoZS5kZWxldGUocGF0aCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5ub3RpZnlMaXN0ZW5lcnMoJ2RlbGV0ZScsIGV4aXN0aW5nKTtcblx0fVxuXG5cdG9uRmlsZVJlbmFtZWQoZmlsZTogVEFic3RyYWN0RmlsZSwgb2xkUGF0aDogc3RyaW5nKTogdm9pZCB7XG5cdFx0Y29uc3Qgb2xkRW50cnkgPSB0aGlzLmluZGV4LmdldChvbGRQYXRoKTtcblxuXHRcdC8vIFx1NEVDRVx1NjVFN1x1OERFRlx1NUY4NFx1NEUyRFx1NzlGQlx1OTY2NFxuXHRcdGlmIChvbGRFbnRyeSkge1xuXHRcdFx0dGhpcy5pbmRleC5kZWxldGUob2xkUGF0aCk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1OTgyXHU2NzlDXHU2NUIwXHU4REVGXHU1Rjg0XHU0RUNEXHU3MTM2XHU2NjJGXHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHVGRjBDXHU2REZCXHU1MkEwXHU1MjMwXHU3RDIyXHU1RjE1XG5cdFx0aWYgKHRoaXMuc2hvdWxkSW5kZXgoZmlsZSkpIHtcblx0XHRcdGNvbnN0IG5ld0VudHJ5ID0gdGhpcy50b0VudHJ5KGZpbGUgYXMgVEZpbGUpO1xuXHRcdFx0dGhpcy5pbmRleC5zZXQobmV3RW50cnkucGF0aCwgbmV3RW50cnkpO1xuXG5cdFx0XHQvLyBcdThGQzFcdTc5RkJcdTdGMjlcdTc1NjVcdTU2RkVcdTdGMTNcdTVCNThcblx0XHRcdGlmICh0aGlzLnRodW1ibmFpbENhY2hlKSB7XG5cdFx0XHRcdHZvaWQgdGhpcy50aHVtYm5haWxDYWNoZS5yZW5hbWUob2xkUGF0aCwgbmV3RW50cnkucGF0aCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMubm90aWZ5TGlzdGVuZXJzKCdyZW5hbWUnLCBuZXdFbnRyeSwgb2xkUGF0aCk7XG5cdFx0fSBlbHNlIGlmIChvbGRFbnRyeSkge1xuXHRcdFx0Ly8gXHU2NTg3XHU0RUY2XHU0RUNFXHU1QTkyXHU0RjUzXHU1M0Q4XHU0RTNBXHU5NzVFXHU1QTkyXHU0RjUzXHVGRjA4XHU0RjhCXHU1OTgyXHU5MUNEXHU1NDdEXHU1NDBEXHU1MjMwXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHVGRjA5XG5cdFx0XHRpZiAodGhpcy50aHVtYm5haWxDYWNoZSkge1xuXHRcdFx0XHR2b2lkIHRoaXMudGh1bWJuYWlsQ2FjaGUuZGVsZXRlKG9sZFBhdGgpO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5ub3RpZnlMaXN0ZW5lcnMoJ2RlbGV0ZScsIG9sZEVudHJ5KTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU4M0I3XHU1M0Q2XHU1RjUzXHU1MjREXHU3RDIyXHU1RjE1XHU3Njg0XHU2MjQwXHU2NzA5XHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRnZXRGaWxlcygpOiBGaWxlRW50cnlbXSB7XG5cdFx0cmV0dXJuIEFycmF5LmZyb20odGhpcy5pbmRleC52YWx1ZXMoKSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU4M0I3XHU1M0Q2XHU2NTg3XHU0RUY2XHU2NTcwXHU5MUNGXG5cdCAqL1xuXHRnZXQgc2l6ZSgpOiBudW1iZXIge1xuXHRcdHJldHVybiB0aGlzLmluZGV4LnNpemU7XG5cdH1cblxuXHQvKipcblx0ICogXHU2NjJGXHU1NDI2XHU1REYyXHU1QjhDXHU2MjEwXHU1MjFEXHU1OUNCXHU2MjZCXHU2M0NGXG5cdCAqL1xuXHRnZXQgaXNJbml0aWFsaXplZCgpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gdGhpcy5pbml0aWFsaXplZDtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYzMDlcdThERUZcdTVGODRcdTgzQjdcdTUzRDZcdTUzNTVcdTRFMkFcdTY3NjFcdTc2RUVcblx0ICovXG5cdGdldEVudHJ5KHBhdGg6IHN0cmluZyk6IEZpbGVFbnRyeSB8IHVuZGVmaW5lZCB7XG5cdFx0cmV0dXJuIHRoaXMuaW5kZXguZ2V0KHBhdGgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkNFOFx1NTE4Q1x1NTNEOFx1NTMxNlx1NzZEMVx1NTQyQ1x1NTY2OFxuXHQgKi9cblx0b25DaGFuZ2UobGlzdGVuZXI6IENoYW5nZUxpc3RlbmVyKTogdm9pZCB7XG5cdFx0dGhpcy5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG5cdH1cblxuXHQvKipcblx0ICogXHU3OUZCXHU5NjY0XHU1M0Q4XHU1MzE2XHU3NkQxXHU1NDJDXHU1NjY4XG5cdCAqL1xuXHRvZmZDaGFuZ2UobGlzdGVuZXI6IENoYW5nZUxpc3RlbmVyKTogdm9pZCB7XG5cdFx0Y29uc3QgaWR4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG5cdFx0aWYgKGlkeCA+PSAwKSB7XG5cdFx0XHR0aGlzLmxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU5MDFBXHU3N0U1XHU2MjQwXHU2NzA5XHU3NkQxXHU1NDJDXHU1NjY4XG5cdCAqL1xuXHRwcml2YXRlIG5vdGlmeUxpc3RlbmVycyh0eXBlOiBDaGFuZ2VUeXBlLCBlbnRyeTogRmlsZUVudHJ5LCBvbGRQYXRoPzogc3RyaW5nKTogdm9pZCB7XG5cdFx0Zm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bGlzdGVuZXIodHlwZSwgZW50cnksIG9sZFBhdGgpO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignTWVkaWFGaWxlSW5kZXggbGlzdGVuZXIgZXJyb3I6JywgZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMDVcdTk2NjRcdTdEMjJcdTVGMTVcblx0ICovXG5cdGNsZWFyKCk6IHZvaWQge1xuXHRcdHRoaXMuaW5kZXguY2xlYXIoKTtcblx0XHR0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG5cdH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG9CQUFvRzs7O0FDQXBHLHNCQUFnRjs7O0FDU3pFLFNBQVMsZUFBZSxPQUF1QjtBQUNyRCxNQUFJLENBQUMsT0FBTyxTQUFTLEtBQUssS0FBSyxTQUFTLEVBQUcsUUFBTztBQUNsRCxRQUFNLElBQUk7QUFDVixRQUFNLFFBQVEsQ0FBQyxLQUFLLE1BQU0sTUFBTSxJQUFJO0FBQ3BDLFFBQU0sSUFBSSxLQUFLLElBQUksR0FBRyxLQUFLLElBQUksS0FBSyxNQUFNLEtBQUssSUFBSSxLQUFLLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sU0FBUyxDQUFDLENBQUM7QUFDM0YsU0FBTyxZQUFZLFFBQVEsS0FBSyxJQUFJLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksTUFBTSxNQUFNLENBQUM7QUFDdkU7QUFRTyxTQUFTLFNBQ2YsSUFDQSxPQUNtQztBQUNuQyxNQUFJLFlBQWtEO0FBRXRELFNBQU8sSUFBSSxTQUF3QjtBQUNsQyxRQUFJLFdBQVc7QUFDZCxtQkFBYSxTQUFTO0FBQUEsSUFDdkI7QUFDQSxnQkFBWSxXQUFXLE1BQU07QUFDNUIsU0FBRyxHQUFHLElBQUk7QUFBQSxJQUNYLEdBQUcsS0FBSztBQUFBLEVBQ1Q7QUFDRDs7O0FDMUJPLFNBQVMsbUJBQW1CLE9BQXVCO0FBQ3pELE1BQUksT0FB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LGFBQWE7QUFBQSxFQUNiLGlCQUFpQjtBQUFBLEVBQ2pCLGVBQWU7QUFBQSxFQUNmLG1CQUFtQjtBQUFBLEVBQ25CLGdCQUFnQjtBQUFBLEVBQ2hCLGlCQUFpQjtBQUFBLEVBQ2pCLGdCQUFnQjtBQUFBLEVBQ2hCLGVBQWU7QUFBQSxFQUNmLFlBQVk7QUFBQSxFQUNaLFdBQVc7QUFBQSxFQUNYLGVBQWU7QUFBQSxFQUNmLFlBQVk7QUFBQSxFQUNaLFlBQVk7QUFBQSxFQUNaLFlBQVk7QUFBQSxFQUNaLFNBQVM7QUFBQSxFQUNULFVBQVU7QUFBQSxFQUNWLGVBQWU7QUFBQSxFQUNmLG1CQUFtQjtBQUFBLEVBQ25CLGFBQWE7QUFBQSxFQUNiLGlCQUFpQjtBQUFBLEVBQ2pCLGtCQUFrQjtBQUFBLEVBQ2xCLGVBQWU7QUFBQSxFQUNmLFdBQVc7QUFBQSxFQUNYLGFBQWE7QUFBQSxFQUNiLFlBQVk7QUFBQSxFQUNaLG9CQUFvQjtBQUFBLEVBQ3BCLGdCQUFnQjtBQUFBLEVBQ2hCLG9CQUFvQjtBQUFBLEVBQ3BCLGlCQUFpQjtBQUFBLEVBQ2pCLHFCQUFxQjtBQUFBLEVBQ3JCLGtCQUFrQjtBQUFBLEVBQ2xCLHNCQUFzQjtBQUFBLEVBQ3RCLHFCQUFxQjtBQUFBLEVBQ3JCLGFBQWE7QUFBQSxFQUNiLGlCQUFpQjtBQUFBLEVBQ2pCLFlBQVk7QUFBQSxFQUNaLG9CQUFvQjtBQUFBLEVBQ3BCLHdCQUF3QjtBQUFBLEVBQ3hCLG9CQUFvQjtBQUFBLEVBQ3BCLHdCQUF3QjtBQUFBLEVBQ3hCLG9CQUFvQjtBQUFBLEVBQ3BCLHdCQUF3QjtBQUFBLEVBQ3hCLGtCQUFrQjtBQUFBLEVBQ2xCLHNCQUFzQjtBQUFBLEVBQ3RCLGNBQWM7QUFBQSxFQUNkLG1CQUFtQjtBQUFBLEVBQ25CLGNBQWM7QUFBQSxFQUNkLGdCQUFnQjtBQUFBLEVBQ2hCLFVBQVU7QUFBQSxFQUNWLGNBQWM7QUFBQSxFQUNiLG9CQUFvQjtBQUFBLEVBQ3BCLHdCQUF3QjtBQUFBLEVBQ3hCLG1CQUFtQjtBQUFBLEVBQ25CLHVCQUF1QjtBQUFBLEVB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QTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQTQ2QnRCLGFBQVMsS0FBSyxZQUFZLE9BQU87QUFBQSxFQUNsQztBQUFBLEVBRUEsTUFBTSxlQUFlO0FBQ3BCLFFBQUk7QUFDSCxZQUFNLFNBQVMsTUFB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LGNBQWMsc0JBQXNCO0FBQ3ZELFFBQUksWUFBWTtBQUNmLFlBQU0sY0FBYyxNQUFNLEtBQUssbUJBQW1CLFVBQVU7QUFDNUQsVUFBSSxDQUFDLGFBQWE7QUFDakIsWUFBSSx5QkFBTyxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUNoRSxlQUFPO0FBQUEsTUFDUjtBQUFBLElBQ0Q7QUFFQSxVQUFNLGVBQWUsb0JBQW9CLHNCQUFzQixLQUFLLEtBQUs7QUFFekUsUUFBSTtBQUNILFlBQU0sTUFBTSxPQUFPLE1BQU0sc0JBQXNCO0FBQy9DLFVBQUkseUJBQU8sS0FBSyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sYUFBYSxDQUFDLENBQUM7QUFDM0QsYUFBTztBQUFBLElBQ1IsU0FBUyxPQUFPO0FBQ2YsY0FBUSxNQUFNLHlDQUFXLEtBQUs7QUFDOUIsVUFBSSx5QkFBTyxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsU0FBVSxNQUFnQixRQUFRLENBQUMsQ0FBQztBQUN6RSxhQUFPO0FBQUEsSUFDUjtBQUFBLEVBQ0Q7QUFBQTtBQUFBLEVBR0EsTUFBTSxzQkFBc0IsTUFBK0I7QUFDMUQsVUFBTSxFQUFFLE1BQU0sSUFBSSxLQUFLO0FBRXZCLFFBQUk7QUFDSCxZQUFNLE1BQU0sT0FBTyxJQUFJO0FBQ3ZCLFVBQUkseUJBQU8sS0FBSyxFQUFFLGVBQWUsRUFBRSxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUM7QUFDckQsYUFBTztBQUFBLElBQ1IsU0FBUyxPQUFPO0FBQ2YsY0FBUSxNQUFNLHFEQUFhLEtBQUs7QUFDaEMsVUFBSSx5QkFBTyxLQUFLLEVBQUUsY0FBYyxDQUFDO0FBQ2pDLGFBQU87QUFBQSxJQUNSO0FBQUEsRUFDRDtBQUNEO0FBcmpFcUIsb0JBRUksc0JBQXNCO0FBRjFCLG9CQU1JLGlCQUFpQixJQUFJLEtBQUs7QUFObkQsSUFBcUIscUJBQXJCOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJ0IiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAibG9hZEltYWdlIiwgImxvYWRJbWFnZSIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAibm9kZSIsICJpbXBvcnRfb2JzaWRpYW4iXQp9Cg==

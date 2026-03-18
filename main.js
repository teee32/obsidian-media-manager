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
        const link = this.plugin.getStableWikiLink(file);
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
        void this.plugin.openOriginalFile(file);
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
        const link = this.plugin.getStableWikiLink(file);
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
        void this.plugin.openOriginalFile(file);
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
  const forceDisambiguateBasename = hasFilenameCollision(app, newFile.name, normalizedNewPath);
  const markdownFiles = app.vault.getMarkdownFiles();
  let updatedCount = 0;
  for (const file of markdownFiles) {
    const content = await app.vault.read(file);
    const newContent = updateLinksInContent(
      app,
      file,
      content,
      normalizedOldPath,
      newFile,
      forceDisambiguateBasename
    );
    if (newContent !== content) {
      await app.vault.modify(file, newContent);
      updatedCount++;
    }
  }
  return updatedCount;
}
function updateLinksInContent(app, sourceFile, content, oldPath, newFile, forceDisambiguateBasename = false) {
  const normalizedNewPath = normalizeVaultPath(newFile.path);
  content = content.replace(WIKI_LINK_PATTERN, (fullMatch, prefix, linktext, alias = "", suffix) => {
    const parsed = (0, import_obsidian5.parseLinktext)(linktext);
    const resolvedPath = resolveLinkDestination(app, parsed.path, sourceFile.path);
    if (!shouldRewriteLink(parsed.path, resolvedPath, oldPath, sourceFile.path)) {
      return fullMatch;
    }
    const replacementLinkPath = composeReplacementPath(
      parsed.path,
      sourceFile.path,
      normalizedNewPath,
      forceDisambiguateBasename,
      "wiki"
    );
    return `${prefix}${replacementLinkPath}${parsed.subpath || ""}${alias}${suffix}`;
  });
  content = content.replace(MARKDOWN_LINK_PATTERN, (fullMatch, prefix, destination, suffix) => {
    const parsed = parseMarkdownDestination(destination);
    const resolvedPath = resolveLinkDestination(app, parsed.path, sourceFile.path);
    if (!shouldRewriteLink(parsed.path, resolvedPath, oldPath, sourceFile.path)) {
      return fullMatch;
    }
    const nextDestination = formatMarkdownDestination(
      composeReplacementPath(
        parsed.path,
        sourceFile.path,
        normalizedNewPath,
        forceDisambiguateBasename,
        "markdown"
      ),
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
function shouldRewriteLink(rawPath, resolvedPath, oldPath, sourcePath) {
  if (resolvedPath === oldPath) {
    return true;
  }
  if (resolvedPath) {
    return false;
  }
  return resolveDeterministicPath(rawPath, sourcePath) === oldPath;
}
function composeReplacementPath(rawPath, sourcePath, newPath, forceDisambiguateBasename, linkKind) {
  const style = detectLinkPathStyle(rawPath);
  switch (style) {
    case "basename":
      if (linkKind === "markdown") {
        return toRelativeVaultPath(sourcePath, newPath) || getFileNameFromPath(newPath) || newPath;
      }
      if (forceDisambiguateBasename) {
        return newPath;
      }
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
function resolveDeterministicPath(rawPath, sourcePath) {
  let candidate = String(rawPath || "").trim();
  if (!candidate) {
    return "";
  }
  candidate = candidate.replace(/\\ /g, " ");
  candidate = safeDecodeURIComponent(candidate);
  if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    return "";
  }
  if (candidate.startsWith("/")) {
    return normalizeVaultPath(candidate).toLowerCase();
  }
  if (candidate.startsWith("./") || candidate.startsWith("../")) {
    const sourceDir = normalizeVaultPath(getParentPath(sourcePath));
    return resolveRelativePath(sourceDir, candidate).toLowerCase();
  }
  const normalized = normalizeVaultPath(candidate).toLowerCase();
  if (normalized.includes("/")) {
    return normalized;
  }
  return "";
}
function resolveRelativePath(sourceDir, relativePath) {
  const baseParts = sourceDir ? sourceDir.split("/").filter(Boolean) : [];
  const relParts = String(relativePath || "").replace(/\\/g, "/").split("/");
  for (const part of relParts) {
    if (!part || part === ".") {
      continue;
    }
    if (part === "..") {
      if (baseParts.length === 0) {
        return "";
      }
      baseParts.pop();
      continue;
    }
    baseParts.push(part);
  }
  return normalizeVaultPath(baseParts.join("/"));
}
function hasFilenameCollision(app, fileName, canonicalPath) {
  const normalizedPath = normalizeVaultPath(canonicalPath).toLowerCase();
  const lowerName = fileName.toLowerCase();
  return app.vault.getFiles().some(
    (file) => file.name.toLowerCase() === lowerName && normalizeVaultPath(file.path).toLowerCase() !== normalizedPath
  );
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
      this.duplicateGroups.sort((a, b) => {
        const pathA = a.files[0]?.path || "";
        const pathB = b.files[0]?.path || "";
        return pathA.localeCompare(pathB);
      });
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
          if (!keepFile || keepFile.path === file.path) {
            return;
          }
          quarantineBtn.disabled = true;
          try {
            await updateLinksInVault(this.app, file.path, keepFile.path);
            const result = await this.plugin.safeDeleteFile(file);
            if (!result) {
              quarantineBtn.disabled = false;
              return;
            }
            group.files = group.files.filter((entry) => entry.path !== file.path);
            if (group.files.length <= 1) {
              const idx = this.duplicateGroups.indexOf(group);
              if (idx >= 0) this.duplicateGroups.splice(idx, 1);
            }
            await this.renderView();
          } catch (error) {
            console.error("\u5355\u4E2A\u91CD\u590D\u9694\u79BB\u5931\u8D25:", error);
            new import_obsidian6.Notice(this.plugin.t("operationFailed", { name: file.name }));
            quarantineBtn.disabled = false;
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
  constructor(app, plugin, file, allFiles = [], onDidClose = null) {
    super(app);
    this.currentIndex = 0;
    this.allFiles = [];
    this.keydownHandler = null;
    this.onDidClose = null;
    this.plugin = plugin;
    this.file = file;
    this.allFiles = allFiles.length > 0 ? allFiles : [file];
    const idx = this.allFiles.findIndex((f) => f.path === file.path);
    this.currentIndex = idx >= 0 ? idx : 0;
    this.onDidClose = onDidClose;
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
      unsupported.createDiv({
        text: this.plugin.t("documentEmbedPreviewUnsupported") || this.plugin.t("unsupportedFileType")
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
        new import_obsidian7.Notice(this.plugin.t("pathCopied"));
      }).catch((error) => {
        console.error("\u590D\u5236\u5230\u526A\u8D34\u677F\u5931\u8D25:", error);
        new import_obsidian7.Notice(this.plugin.t("error"));
      });
    });
    const copyLinkBtn = actions.createEl("button");
    copyLinkBtn.textContent = this.plugin.t("copyLinkBtn");
    copyLinkBtn.addEventListener("click", () => {
      const link = this.plugin.getStableWikiLink(file);
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
      void this.plugin.openOriginalFile(file);
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
    if (this.onDidClose) {
      try {
        this.onDidClose();
      } catch (_) {
      }
    }
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
  openOriginal: "\u6253\u5F00\u539F\u6587\u4EF6",
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
  documentEmbedPreviewUnsupported: "\u8BE5\u6587\u6863\u7C7B\u578B\u4E0D\u652F\u6301\u5185\u5D4C\u9884\u89C8\uFF0C\u8BF7\u4F7F\u7528\u201C\u6253\u5F00\u539F\u6587\u4EF6\u201D",
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
  documentEmbedPreviewUnsupported: 'Embedded preview is not supported for this document type. Use "Open Original".',
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
    this.activePreviewModal = null;
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
    if (this.activePreviewModal) {
      try {
        this.activePreviewModal.close();
      } catch (_) {
      }
      this.activePreviewModal = null;
    }
    const modal = new MediaPreviewModal(this.app, this, file, [], () => {
      if (this.activePreviewModal === modal) {
        this.activePreviewModal = null;
      }
    });
    this.activePreviewModal = modal;
    modal.open();
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
    if (this.activePreviewModal) {
      try {
        this.activePreviewModal.close();
      } catch (_) {
      }
      this.activePreviewModal = null;
    }
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
  /**
   * 生成可稳定解析的 Wiki 链接（同名冲突时自动使用路径）
   */
  getStableWikiLink(file) {
    const normalizedPath = normalizeVaultPath(file.path) || file.path;
    const normalizedPathLower = normalizedPath.toLowerCase();
    const lowerName = file.name.toLowerCase();
    const hasNameCollision = this.app.vault.getFiles().some(
      (candidate) => candidate.path !== file.path && candidate.name.toLowerCase() === lowerName && (normalizeVaultPath(candidate.path) || candidate.path).toLowerCase() !== normalizedPathLower
    );
    const linkPath = hasNameCollision ? normalizedPath : file.name;
    return `[[${linkPath}]]`;
  }
  /**
   * 通过系统默认程序打开原文件（桌面端优先）
   */
  async openOriginalFile(file) {
    const appLike = this.app;
    try {
      if (typeof appLike.openWithDefaultApp === "function") {
        await appLike.openWithDefaultApp(file.path);
        return true;
      }
    } catch (error) {
      console.warn("openWithDefaultApp \u5931\u8D25\uFF0C\u5C1D\u8BD5\u56DE\u9000\u65B9\u6848:", error);
    }
    const adapter = this.app.vault.adapter;
    const fullPath = typeof adapter.getFullPath === "function" ? adapter.getFullPath(file.path) : "";
    try {
      const electronRequire = window.require;
      if (typeof electronRequire === "function") {
        const electron = electronRequire("electron");
        const shell = electron?.shell;
        if (shell && fullPath && typeof shell.openPath === "function") {
          const errorMessage = await shell.openPath(fullPath);
          if (!errorMessage) {
            return true;
          }
        }
        if (shell && typeof shell.openExternal === "function") {
          await shell.openExternal(this.app.vault.getResourcePath(file));
          return true;
        }
      }
    } catch (error) {
      console.warn("electron shell \u6253\u5F00\u5931\u8D25\uFF0C\u5C1D\u8BD5\u6D4F\u89C8\u5668\u56DE\u9000:", error);
    }
    const popup = window.open(this.app.vault.getResourcePath(file), "_blank", "noopener,noreferrer");
    if (popup) {
      return true;
    }
    new import_obsidian11.Notice(this.t("operationFailed", { name: file.name }));
    return false;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJ2aWV3L0ltYWdlTGlicmFyeVZpZXcudHMiLCAidXRpbHMvZm9ybWF0LnRzIiwgInV0aWxzL3BhdGgudHMiLCAidXRpbHMvbWVkaWFUeXBlcy50cyIsICJ1dGlscy90aHVtYm5haWxDYWNoZS50cyIsICJ1dGlscy9leGlmUmVhZGVyLnRzIiwgInV0aWxzL3J1bGVFbmdpbmUudHMiLCAidXRpbHMvbWVkaWFQcm9jZXNzb3IudHMiLCAidmlldy9VbnJlZmVyZW5jZWRJbWFnZXNWaWV3LnRzIiwgInZpZXcvRGVsZXRlQ29uZmlybU1vZGFsLnRzIiwgInZpZXcvVHJhc2hNYW5hZ2VtZW50Vmlldy50cyIsICJ1dGlscy9zZWN1cml0eS50cyIsICJ2aWV3L0R1cGxpY2F0ZURldGVjdGlvblZpZXcudHMiLCAidXRpbHMvcGVyY2VwdHVhbEhhc2gudHMiLCAidXRpbHMvbGlua1VwZGF0ZXIudHMiLCAidmlldy9NZWRpYVByZXZpZXdNb2RhbC50cyIsICJzZXR0aW5ncy50cyIsICJ1dGlscy9pbWFnZUFsaWdubWVudC50cyIsICJ1dGlscy9wb3N0UHJvY2Vzc29yLnRzIiwgInV0aWxzL2kxOG4udHMiLCAidXRpbHMvZmlsZVdhdGNoZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IFBsdWdpbiwgRWRpdG9yLCBURmlsZSwgVEZvbGRlciwgVEFic3RyYWN0RmlsZSwgTWFya2Rvd25WaWV3LCBOb3RpY2UsIE1lbnUsIE1lbnVJdGVtIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgSW1hZ2VMaWJyYXJ5VmlldywgVklFV19UWVBFX0lNQUdFX0xJQlJBUlkgfSBmcm9tICcuL3ZpZXcvSW1hZ2VMaWJyYXJ5Vmlldyc7XG5pbXBvcnQgeyBVbnJlZmVyZW5jZWRJbWFnZXNWaWV3LCBWSUVXX1RZUEVfVU5SRUZFUkVOQ0VEX0lNQUdFUyB9IGZyb20gJy4vdmlldy9VbnJlZmVyZW5jZWRJbWFnZXNWaWV3JztcbmltcG9ydCB7IFRyYXNoTWFuYWdlbWVudFZpZXcsIFZJRVdfVFlQRV9UUkFTSF9NQU5BR0VNRU5UIH0gZnJvbSAnLi92aWV3L1RyYXNoTWFuYWdlbWVudFZpZXcnO1xuaW1wb3J0IHsgRHVwbGljYXRlRGV0ZWN0aW9uVmlldywgVklFV19UWVBFX0RVUExJQ0FURV9ERVRFQ1RJT04gfSBmcm9tICcuL3ZpZXcvRHVwbGljYXRlRGV0ZWN0aW9uVmlldyc7XG5pbXBvcnQgeyBNZWRpYVByZXZpZXdNb2RhbCB9IGZyb20gJy4vdmlldy9NZWRpYVByZXZpZXdNb2RhbCc7XG5pbXBvcnQgeyBJbWFnZU1hbmFnZXJTZXR0aW5ncywgREVGQVVMVF9TRVRUSU5HUywgU2V0dGluZ3NUYWIgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IEltYWdlQWxpZ25tZW50LCBBbGlnbm1lbnRUeXBlIH0gZnJvbSAnLi91dGlscy9pbWFnZUFsaWdubWVudCc7XG5pbXBvcnQgeyBBbGlnbm1lbnRQb3N0UHJvY2Vzc29yIH0gZnJvbSAnLi91dGlscy9wb3N0UHJvY2Vzc29yJztcbmltcG9ydCB7IHQgYXMgdHJhbnNsYXRlLCBnZXRTeXN0ZW1MYW5ndWFnZSwgTGFuZ3VhZ2UsIFRyYW5zbGF0aW9ucyB9IGZyb20gJy4vdXRpbHMvaTE4bic7XG5pbXBvcnQgeyBnZXRFbmFibGVkRXh0ZW5zaW9ucywgaXNNZWRpYUZpbGUgfSBmcm9tICcuL3V0aWxzL21lZGlhVHlwZXMnO1xuaW1wb3J0IHsgaXNQYXRoU2FmZSB9IGZyb20gJy4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgZ2V0RmlsZU5hbWVGcm9tUGF0aCwgZ2V0UGFyZW50UGF0aCwgbm9ybWFsaXplVmF1bHRQYXRoLCBzYWZlRGVjb2RlVVJJQ29tcG9uZW50IH0gZnJvbSAnLi91dGlscy9wYXRoJztcbmltcG9ydCB7IFRodW1ibmFpbENhY2hlIH0gZnJvbSAnLi91dGlscy90aHVtYm5haWxDYWNoZSc7XG5pbXBvcnQgeyBNZWRpYUZpbGVJbmRleCB9IGZyb20gJy4vdXRpbHMvZmlsZVdhdGNoZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBJbWFnZU1hbmFnZXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRzZXR0aW5nczogSW1hZ2VNYW5hZ2VyU2V0dGluZ3MgPSBERUZBVUxUX1NFVFRJTkdTO1xuXHRwcml2YXRlIHN0YXRpYyByZWFkb25seSBMRUdBQ1lfVFJBU0hfRk9MREVSID0gJy5vYnNpZGlhbi1tZWRpYS10b29sa2l0LXRyYXNoJztcblx0Ly8gXHU3RjEzXHU1QjU4XHU1RjE1XHU3NTI4XHU3Njg0XHU1NkZFXHU3MjQ3XHU0RUU1XHU2M0QwXHU5QUQ4XHU1OTI3XHU1NzhCIFZhdWx0IFx1NzY4NFx1NjAyN1x1ODBGRFxuXHRwcml2YXRlIHJlZmVyZW5jZWRJbWFnZXNDYWNoZTogU2V0PHN0cmluZz4gfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBjYWNoZVRpbWVzdGFtcDogbnVtYmVyID0gMDtcblx0cHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQ0FDSEVfRFVSQVRJT04gPSA1ICogNjAgKiAxMDAwOyAvLyBcdTdGMTNcdTVCNTg1XHU1MjA2XHU5NDlGXG5cdHByaXZhdGUgcmVmcmVzaFZpZXdzVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGw7XG5cblx0Ly8gXHU2MDI3XHU4MEZEXHVGRjFBXHU3RjI5XHU3NTY1XHU1NkZFXHU3RjEzXHU1QjU4ICsgXHU1ODlFXHU5MUNGXHU2NTg3XHU0RUY2XHU3RDIyXHU1RjE1XG5cdHRodW1ibmFpbENhY2hlOiBUaHVtYm5haWxDYWNoZSA9IG5ldyBUaHVtYm5haWxDYWNoZSgpO1xuXHRmaWxlSW5kZXg6IE1lZGlhRmlsZUluZGV4ID0gbmV3IE1lZGlhRmlsZUluZGV4KG51bGwgYXMgYW55KTtcblx0cHJpdmF0ZSBpbmRleGVkRXh0ZW5zaW9uc0tleTogc3RyaW5nID0gJyc7XG5cdHByaXZhdGUgaW5kZXhlZFRyYXNoRm9sZGVyOiBzdHJpbmcgPSAnJztcblx0cHJpdmF0ZSBhY3RpdmVQcmV2aWV3TW9kYWw6IE1lZGlhUHJldmlld01vZGFsIHwgbnVsbCA9IG51bGw7XG5cblx0LyoqXG5cdCAqIFx1ODNCN1x1NTNENlx1NUY1M1x1NTI0RFx1OEJFRFx1OEEwMFx1OEJCRVx1N0Y2RVxuXHQgKi9cblx0Z2V0Q3VycmVudExhbmd1YWdlKCk6IExhbmd1YWdlIHtcblx0XHRpZiAodGhpcy5zZXR0aW5ncy5sYW5ndWFnZSA9PT0gJ3N5c3RlbScpIHtcblx0XHRcdHJldHVybiBnZXRTeXN0ZW1MYW5ndWFnZSgpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5zZXR0aW5ncy5sYW5ndWFnZSBhcyBMYW5ndWFnZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTdGRkJcdThCRDFcdTUxRkRcdTY1NzBcblx0ICovXG5cdHQoa2V5OiBzdHJpbmcsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj4pOiBzdHJpbmcge1xuXHRcdHJldHVybiB0cmFuc2xhdGUodGhpcy5nZXRDdXJyZW50TGFuZ3VhZ2UoKSwga2V5IGFzIGtleW9mIFRyYW5zbGF0aW9ucywgcGFyYW1zKTtcblx0fVxuXG5cdGFzeW5jIG9ubG9hZCgpIHtcblx0XHRhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXHRcdGF3YWl0IHRoaXMubWlncmF0ZUxlZ2FjeVRyYXNoRm9sZGVyKCk7XG5cblx0XHQvLyBcdTUyMURcdTU5Q0JcdTUzMTZcdTYwMjdcdTgwRkRcdTU3RkFcdTc4NDBcdThCQkVcdTY1QkRcblx0XHRhd2FpdCB0aGlzLmluaXRQZXJmb3JtYW5jZUluZnJhKCk7XG5cblx0XHQvLyBcdTUyQTBcdThGN0RcdTY4MzdcdTVGMEZcblx0XHR0aGlzLnJlbW92ZU1hbmFnZWRTdHlsZXMoKTtcblx0XHRhd2FpdCB0aGlzLmFkZFN0eWxlKCk7XG5cblx0XHQvLyBcdTZDRThcdTUxOENcdTU2RkVcdTcyNDdcdTVFOTNcdTg5QzZcdTU2RkVcblx0XHR0aGlzLnJlZ2lzdGVyVmlldyhWSUVXX1RZUEVfSU1BR0VfTElCUkFSWSwgKGxlYWYpID0+IG5ldyBJbWFnZUxpYnJhcnlWaWV3KGxlYWYsIHRoaXMpKTtcblxuXHRcdC8vIFx1NkNFOFx1NTE4Q1x1NjcyQVx1NUYxNVx1NzUyOFx1NTZGRVx1NzI0N1x1ODlDNlx1NTZGRVxuXHRcdHRoaXMucmVnaXN0ZXJWaWV3KFZJRVdfVFlQRV9VTlJFRkVSRU5DRURfSU1BR0VTLCAobGVhZikgPT4gbmV3IFVucmVmZXJlbmNlZEltYWdlc1ZpZXcobGVhZiwgdGhpcykpO1xuXG5cdFx0Ly8gXHU2Q0U4XHU1MThDXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU3QkExXHU3NDA2XHU4OUM2XHU1NkZFXG5cdFx0dGhpcy5yZWdpc3RlclZpZXcoVklFV19UWVBFX1RSQVNIX01BTkFHRU1FTlQsIChsZWFmKSA9PiBuZXcgVHJhc2hNYW5hZ2VtZW50VmlldyhsZWFmLCB0aGlzKSk7XG5cblx0XHQvLyBcdTZDRThcdTUxOENcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEJcdTg5QzZcdTU2RkVcblx0XHR0aGlzLnJlZ2lzdGVyVmlldyhWSUVXX1RZUEVfRFVQTElDQVRFX0RFVEVDVElPTiwgKGxlYWYpID0+IG5ldyBEdXBsaWNhdGVEZXRlY3Rpb25WaWV3KGxlYWYsIHRoaXMpKTtcblxuXHRcdC8vIFx1NkNFOFx1NTE4Q1x1NTZGRVx1NzI0N1x1NUJGOVx1OUY1MCBQb3N0UHJvY2Vzc29yXG5cdFx0Y29uc3QgYWxpZ25tZW50UHJvY2Vzc29yID0gbmV3IEFsaWdubWVudFBvc3RQcm9jZXNzb3IodGhpcyk7XG5cdFx0YWxpZ25tZW50UHJvY2Vzc29yLnJlZ2lzdGVyKCk7XG5cblx0XHQvLyBcdTZERkJcdTUyQTBcdTU0N0RcdTRFRTRcdTk3NjJcdTY3N0ZcdTU0N0RcdTRFRTRcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdvcGVuLWltYWdlLWxpYnJhcnknLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWRJbWFnZUxpYnJhcnknKSxcblx0XHRcdGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuXHRcdFx0XHRpZiAoY2hlY2tpbmcpIHJldHVybiB0cnVlO1xuXHRcdFx0XHR0aGlzLm9wZW5JbWFnZUxpYnJhcnkoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ2ZpbmQtdW5yZWZlcmVuY2VkLWltYWdlcycsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZEZpbmRVbnJlZmVyZW5jZWRJbWFnZXMnKSxcblx0XHRcdGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuXHRcdFx0XHRpZiAoY2hlY2tpbmcpIHJldHVybiB0cnVlO1xuXHRcdFx0XHR0aGlzLmZpbmRVbnJlZmVyZW5jZWRJbWFnZXMoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFx1N0YxM1x1NUI1OFx1NTIzN1x1NjVCMFx1NTQ3RFx1NEVFNFxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ3JlZnJlc2gtY2FjaGUnLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWRSZWZyZXNoQ2FjaGUnKSxcblx0XHRcdGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuXHRcdFx0XHRpZiAoY2hlY2tpbmcpIHJldHVybiB0cnVlO1xuXHRcdFx0XHR0aGlzLnJlZnJlc2hDYWNoZSgpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU5MUNEXHU1OTBEXHU2OEMwXHU2RDRCXHU1NDdEXHU0RUU0XG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnb3Blbi1kdXBsaWNhdGUtZGV0ZWN0aW9uJyxcblx0XHRcdG5hbWU6IHRoaXMudCgnY21kRHVwbGljYXRlRGV0ZWN0aW9uJyksXG5cdFx0XHRjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmc6IGJvb2xlYW4pID0+IHtcblx0XHRcdFx0aWYgKGNoZWNraW5nKSByZXR1cm4gdHJ1ZTtcblx0XHRcdFx0dGhpcy5vcGVuRHVwbGljYXRlRGV0ZWN0aW9uKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBcdTk2OTRcdTc5QkJcdTdCQTFcdTc0MDZcdTU0N0RcdTRFRTRcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdvcGVuLXRyYXNoLW1hbmFnZW1lbnQnLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWRUcmFzaE1hbmFnZW1lbnQnKSxcblx0XHRcdGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuXHRcdFx0XHRpZiAoY2hlY2tpbmcpIHJldHVybiB0cnVlO1xuXHRcdFx0XHR0aGlzLm9wZW5UcmFzaE1hbmFnZW1lbnQoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFx1NTZGRVx1NzI0N1x1NUJGOVx1OUY1MFx1NTQ3RFx1NEVFNFxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ2FsaWduLWltYWdlLWxlZnQnLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWRBbGlnbkltYWdlTGVmdCcpLFxuXHRcdFx0ZWRpdG9yQ2FsbGJhY2s6IChlZGl0b3I6IEVkaXRvcikgPT4ge1xuXHRcdFx0XHR0aGlzLmFsaWduU2VsZWN0ZWRJbWFnZShlZGl0b3IsICdsZWZ0Jyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0aWQ6ICdhbGlnbi1pbWFnZS1jZW50ZXInLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWRBbGlnbkltYWdlQ2VudGVyJyksXG5cdFx0XHRlZGl0b3JDYWxsYmFjazogKGVkaXRvcjogRWRpdG9yKSA9PiB7XG5cdFx0XHRcdHRoaXMuYWxpZ25TZWxlY3RlZEltYWdlKGVkaXRvciwgJ2NlbnRlcicpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnYWxpZ24taW1hZ2UtcmlnaHQnLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWRBbGlnbkltYWdlUmlnaHQnKSxcblx0XHRcdGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yOiBFZGl0b3IpID0+IHtcblx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAncmlnaHQnKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIFx1NkNFOFx1NTE4Q1x1N0YxNlx1OEY5MVx1NTY2OFx1NEUwQVx1NEUwQlx1NjU4N1x1ODNEQ1x1NTM1NVxuXHRcdHRoaXMucmVnaXN0ZXJFdmVudChcblx0XHRcdC8vIEB0cy1pZ25vcmUgLSBlZGl0b3ItY29udGV4dC1tZW51IGV2ZW50XG5cdFx0XHR0aGlzLmFwcC53b3Jrc3BhY2Uub24oJ2VkaXRvci1jb250ZXh0LW1lbnUnLCAobWVudTogYW55LCBlZGl0b3I6IGFueSkgPT4ge1xuXHRcdFx0XHR0aGlzLmFkZEFsaWdubWVudE1lbnVJdGVtcyhtZW51LCBlZGl0b3IpO1xuXHRcdFx0fSlcblx0XHQpO1xuXG5cdFx0Ly8gXHU2REZCXHU1MkEwXHU4QkJFXHU3RjZFXHU2ODA3XHU3QjdFXHU5ODc1XG5cdFx0dGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTZXR0aW5nc1RhYih0aGlzLmFwcCwgdGhpcykpO1xuXG5cdFx0Ly8gXHU2Q0U4XHU1MThDXHU1RkVCXHU2Mzc3XHU5NTJFXG5cdFx0dGhpcy5yZWdpc3RlcktleWJvYXJkU2hvcnRjdXRzKCk7XG5cblx0XHQvLyBcdTc2RDFcdTU0MkMgVmF1bHQgXHU2NTg3XHU0RUY2XHU1M0Q4XHU1MzE2XHVGRjBDXHU4MUVBXHU1MkE4XHU1OTMxXHU2NTQ4XHU3RjEzXHU1QjU4XHU1RTc2XHU1MjM3XHU2NUIwXHU4OUM2XHU1NkZFXG5cdFx0dGhpcy5yZWdpc3RlclZhdWx0RXZlbnRMaXN0ZW5lcnMoKTtcblxuXHRcdC8vIFx1NTQyRlx1NTJBOFx1NjVGNlx1NjI2N1x1ODg0Q1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1ODFFQVx1NTJBOFx1NkUwNVx1NzQwNlxuXHRcdHRoaXMuYXV0b0NsZWFudXBUcmFzaE9uU3RhcnR1cCgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1OEZDMVx1NzlGQlx1NjVFN1x1NzI0OFx1OUVEOFx1OEJBNFx1OTY5NFx1NzlCQlx1NzZFRVx1NUY1NVx1RkYwOFx1OTY5MFx1ODVDRlx1NzZFRVx1NUY1NVx1RkYwOVx1NTIzMFx1NjVCMFx1NzI0OFx1OUVEOFx1OEJBNFx1NzZFRVx1NUY1NVx1RkYwQ1x1OTA3Rlx1NTE0RFx1ODhBQiBWYXVsdCBcdTdEMjJcdTVGMTVcdTVGRkRcdTc1NjVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgbWlncmF0ZUxlZ2FjeVRyYXNoRm9sZGVyKCkge1xuXHRcdGNvbnN0IGxlZ2FjeVBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoSW1hZ2VNYW5hZ2VyUGx1Z2luLkxFR0FDWV9UUkFTSF9GT0xERVIpO1xuXHRcdGNvbnN0IGRlZmF1bHRUcmFzaFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoREVGQVVMVF9TRVRUSU5HUy50cmFzaEZvbGRlcikgfHwgREVGQVVMVF9TRVRUSU5HUy50cmFzaEZvbGRlcjtcblx0XHRjb25zdCBjb25maWd1cmVkVHJhc2hQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMuc2V0dGluZ3MudHJhc2hGb2xkZXIpIHx8IGRlZmF1bHRUcmFzaFBhdGg7XG5cdFx0bGV0IHNldHRpbmdzQ2hhbmdlZCA9IGZhbHNlO1xuXG5cdFx0aWYgKGNvbmZpZ3VyZWRUcmFzaFBhdGggPT09IGxlZ2FjeVBhdGgpIHtcblx0XHRcdHRoaXMuc2V0dGluZ3MudHJhc2hGb2xkZXIgPSBkZWZhdWx0VHJhc2hQYXRoO1xuXHRcdFx0c2V0dGluZ3NDaGFuZ2VkID0gdHJ1ZTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgYWRhcHRlciA9IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXI7XG5cdFx0XHRjb25zdCBsZWdhY3lFeGlzdHMgPSBhd2FpdCBhZGFwdGVyLmV4aXN0cyhsZWdhY3lQYXRoKTtcblxuXHRcdFx0aWYgKGxlZ2FjeUV4aXN0cykge1xuXHRcdFx0XHRjb25zdCB0YXJnZXRFeGlzdHMgPSBhd2FpdCBhZGFwdGVyLmV4aXN0cyhkZWZhdWx0VHJhc2hQYXRoKTtcblx0XHRcdFx0aWYgKCF0YXJnZXRFeGlzdHMpIHtcblx0XHRcdFx0XHRhd2FpdCBhZGFwdGVyLnJlbmFtZShsZWdhY3lQYXRoLCBkZWZhdWx0VHJhc2hQYXRoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdThGQzFcdTc5RkJcdTY1RTdcdTcyNDhcdTk2OTRcdTc5QkJcdTc2RUVcdTVGNTVcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdH1cblxuXHRcdGlmIChzZXR0aW5nc0NoYW5nZWQpIHtcblx0XHRcdGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTQyRlx1NTJBOFx1NjVGNlx1ODFFQVx1NTJBOFx1NkUwNVx1NzQwNlx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHQgKi9cblx0cHJpdmF0ZSBhc3luYyBhdXRvQ2xlYW51cFRyYXNoT25TdGFydHVwKCkge1xuXHRcdC8vIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NTQyRlx1NzUyOFx1ODFFQVx1NTJBOFx1NkUwNVx1NzQwNlxuXHRcdGlmICghdGhpcy5zZXR0aW5ncy5hdXRvQ2xlYW51cFRyYXNoKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGF3YWl0IHRoaXMuY2xlYW51cE9sZFRyYXNoRmlsZXMoKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTA1XHU3NDA2XHU4RkM3XHU2NzFGXHU3Njg0XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRhc3luYyBjbGVhbnVwT2xkVHJhc2hGaWxlcygpOiBQcm9taXNlPG51bWJlcj4ge1xuXHRcdGNvbnN0IHsgdmF1bHQgfSA9IHRoaXMuYXBwO1xuXHRcdGNvbnN0IHRyYXNoUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh0aGlzLnNldHRpbmdzLnRyYXNoRm9sZGVyKTtcblxuXHRcdGlmICghdHJhc2hQYXRoIHx8ICFpc1BhdGhTYWZlKHRyYXNoUGF0aCkpIHtcblx0XHRcdHJldHVybiAwO1xuXHRcdH1cblxuXHRcdGNvbnN0IHRyYXNoRm9sZGVyID0gdmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHRyYXNoUGF0aCk7XG5cblx0XHQvLyBcdTY4QzBcdTY3RTVcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTY2MkZcdTU0MjZcdTVCNThcdTU3Mjhcblx0XHRpZiAoIXRyYXNoRm9sZGVyKSB7XG5cdFx0XHRyZXR1cm4gMDtcblx0XHR9XG5cblx0XHQvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTRFM0FcdTY1ODdcdTRFRjZcdTU5Mzlcblx0XHRpZiAoISh0cmFzaEZvbGRlciBpbnN0YW5jZW9mIFRGb2xkZXIpKSB7XG5cdFx0XHRyZXR1cm4gMDtcblx0XHR9XG5cblx0XHRjb25zdCBkYXlzID0gTWF0aC5tYXgoMSwgdGhpcy5zZXR0aW5ncy50cmFzaENsZWFudXBEYXlzIHx8IDMwKTtcblx0XHRjb25zdCBjdXRvZmZUaW1lID0gRGF0ZS5ub3coKSAtIChkYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCk7XG5cdFx0bGV0IGRlbGV0ZWRDb3VudCA9IDA7XG5cblx0XHQvLyBcdTgzQjdcdTUzRDZcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTRFMkRcdTc2ODRcdTYyNDBcdTY3MDlcdTY1ODdcdTRFRjZcblx0XHRjb25zdCBmaWxlcyA9IHRyYXNoRm9sZGVyLmNoaWxkcmVuO1xuXG5cdFx0Zm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG5cdFx0XHRpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG5cdFx0XHRcdC8vIFx1NjhDMFx1NjdFNVx1NjU4N1x1NEVGNlx1NEZFRVx1NjUzOVx1NjVGNlx1OTVGNFxuXHRcdFx0XHRpZiAoZmlsZS5zdGF0Lm10aW1lIDwgY3V0b2ZmVGltZSkge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRhd2FpdCB2YXVsdC5kZWxldGUoZmlsZSk7XG5cdFx0XHRcdFx0XHRkZWxldGVkQ291bnQrKztcblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihgXHU1MjIwXHU5NjY0XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OiAke2ZpbGUubmFtZX1gLCBlcnJvcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGRlbGV0ZWRDb3VudCA+IDApIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy50KCdhdXRvQ2xlYW51cENvbXBsZXRlJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhkZWxldGVkQ291bnQpKSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRlbGV0ZWRDb3VudDtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZDRThcdTUxOENcdTVGRUJcdTYzNzdcdTk1MkVcblx0ICovXG5cdHJlZ2lzdGVyS2V5Ym9hcmRTaG9ydGN1dHMoKSB7XG5cdFx0Ly8gQ3RybCtTaGlmdCtNIFx1NjI1M1x1NUYwMFx1NUE5Mlx1NEY1M1x1NUU5M1xuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRpZDogJ29wZW4tbWVkaWEtbGlicmFyeS1zaG9ydGN1dCcsXG5cdFx0XHRuYW1lOiB0aGlzLnQoJ2NtZE9wZW5NZWRpYUxpYnJhcnknKSxcblx0XHRcdGhvdGtleXM6IFt7IG1vZGlmaWVyczogWydDdHJsJywgJ1NoaWZ0J10sIGtleTogJ20nIH1dLFxuXHRcdFx0Y2FsbGJhY2s6ICgpID0+IHtcblx0XHRcdFx0dGhpcy5vcGVuSW1hZ2VMaWJyYXJ5KCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBDdHJsK1NoaWZ0K1UgXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU1QTkyXHU0RjUzXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnZmluZC11bnJlZmVyZW5jZWQtbWVkaWEtc2hvcnRjdXQnLFxuXHRcdFx0bmFtZTogdGhpcy50KCdjbWRGaW5kVW5yZWZlcmVuY2VkTWVkaWEnKSxcblx0XHRcdGhvdGtleXM6IFt7IG1vZGlmaWVyczogWydDdHJsJywgJ1NoaWZ0J10sIGtleTogJ3UnIH1dLFxuXHRcdFx0Y2FsbGJhY2s6ICgpID0+IHtcblx0XHRcdFx0dGhpcy5maW5kVW5yZWZlcmVuY2VkSW1hZ2VzKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBDdHJsK1NoaWZ0K1QgXHU2MjUzXHU1RjAwXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU3QkExXHU3NDA2XG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcblx0XHRcdGlkOiAnb3Blbi10cmFzaC1tYW5hZ2VtZW50LXNob3J0Y3V0Jyxcblx0XHRcdG5hbWU6IHRoaXMudCgnY21kT3BlblRyYXNoTWFuYWdlbWVudCcpLFxuXHRcdFx0aG90a2V5czogW3sgbW9kaWZpZXJzOiBbJ0N0cmwnLCAnU2hpZnQnXSwga2V5OiAndCcgfV0sXG5cdFx0XHRjYWxsYmFjazogKCkgPT4ge1xuXHRcdFx0XHR0aGlzLm9wZW5UcmFzaE1hbmFnZW1lbnQoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZDRThcdTUxOEMgVmF1bHQgXHU0RThCXHU0RUY2XHU3NkQxXHU1NDJDXG5cdCAqL1xuXHRwcml2YXRlIHJlZ2lzdGVyVmF1bHRFdmVudExpc3RlbmVycygpIHtcblx0XHQvLyBcdTU5RDRcdTYyNThcdTdFRDkgTWVkaWFGaWxlSW5kZXggXHU1OTA0XHU3NDA2XHU1ODlFXHU5MUNGXHU3RDIyXHU1RjE1XHU2NkY0XHU2NUIwXG5cdFx0dGhpcy5yZWdpc3RlckV2ZW50KHRoaXMuYXBwLnZhdWx0Lm9uKCdjcmVhdGUnLCAoZmlsZTogVEFic3RyYWN0RmlsZSkgPT4ge1xuXHRcdFx0dGhpcy5maWxlSW5kZXgub25GaWxlQ3JlYXRlZChmaWxlKTtcblx0XHRcdHRoaXMuaGFuZGxlVmF1bHRGaWxlQ2hhbmdlKGZpbGUpO1xuXHRcdH0pKTtcblx0XHR0aGlzLnJlZ2lzdGVyRXZlbnQodGhpcy5hcHAudmF1bHQub24oJ2RlbGV0ZScsIChmaWxlOiBUQWJzdHJhY3RGaWxlKSA9PiB7XG5cdFx0XHR0aGlzLmZpbGVJbmRleC5vbkZpbGVEZWxldGVkKGZpbGUpO1xuXHRcdFx0dGhpcy5oYW5kbGVWYXVsdEZpbGVDaGFuZ2UoZmlsZSk7XG5cdFx0fSkpO1xuXHRcdHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC52YXVsdC5vbignbW9kaWZ5JywgKGZpbGU6IFRBYnN0cmFjdEZpbGUpID0+IHtcblx0XHRcdHRoaXMuZmlsZUluZGV4Lm9uRmlsZU1vZGlmaWVkKGZpbGUpO1xuXHRcdFx0dGhpcy5oYW5kbGVWYXVsdEZpbGVDaGFuZ2UoZmlsZSk7XG5cdFx0fSkpO1xuXHRcdHRoaXMucmVnaXN0ZXJFdmVudCh0aGlzLmFwcC52YXVsdC5vbigncmVuYW1lJywgKGZpbGU6IFRBYnN0cmFjdEZpbGUsIG9sZFBhdGg6IHN0cmluZykgPT4ge1xuXHRcdFx0dGhpcy5maWxlSW5kZXgub25GaWxlUmVuYW1lZChmaWxlLCBvbGRQYXRoKTtcblx0XHRcdHRoaXMuaGFuZGxlVmF1bHRGaWxlQ2hhbmdlKGZpbGUsIG9sZFBhdGgpO1xuXHRcdH0pKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTUyMURcdTU5Q0JcdTUzMTZcdTYwMjdcdTgwRkRcdTU3RkFcdTc4NDBcdThCQkVcdTY1QkRcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgaW5pdFBlcmZvcm1hbmNlSW5mcmEoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gXHU2MjUzXHU1RjAwXHU3RjI5XHU3NTY1XHU1NkZFXHU3RjEzXHU1QjU4XG5cdFx0YXdhaXQgdGhpcy50aHVtYm5haWxDYWNoZS5vcGVuKCk7XG5cblx0XHQvLyBcdTUyMURcdTU5Q0JcdTUzMTZcdTY1ODdcdTRFRjZcdTdEMjJcdTVGMTVcblx0XHR0aGlzLmZpbGVJbmRleCA9IG5ldyBNZWRpYUZpbGVJbmRleCh0aGlzLmFwcC52YXVsdCwgdGhpcy50aHVtYm5haWxDYWNoZSk7XG5cdFx0YXdhaXQgdGhpcy5zeW5jUGVyZm9ybWFuY2VJbmZyYVNldHRpbmdzKHRydWUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTQwQ1x1NkI2NVx1NjAyN1x1ODBGRFx1NTdGQVx1Nzg0MFx1OEJCRVx1NjVCRFx1OTE0RFx1N0Y2RVxuXHQgKiBcdTVGNTNcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEJcdTYyMTZcdTk2OTRcdTc5QkJcdTc2RUVcdTVGNTVcdTUzRDFcdTc1MUZcdTUzRDhcdTUzMTZcdTY1RjZcdUZGMENcdTk3MDBcdTg5ODFcdTkxQ0RcdTVFRkFcdTY1ODdcdTRFRjZcdTdEMjJcdTVGMTVcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgc3luY1BlcmZvcm1hbmNlSW5mcmFTZXR0aW5ncyhmb3JjZUZ1bGxTY2FuOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCBlbmFibGVkRXh0ZW5zaW9ucyA9IGdldEVuYWJsZWRFeHRlbnNpb25zKHRoaXMuc2V0dGluZ3MpO1xuXHRcdGNvbnN0IHRyYXNoRm9sZGVyID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMuc2V0dGluZ3MudHJhc2hGb2xkZXIpIHx8IERFRkFVTFRfU0VUVElOR1MudHJhc2hGb2xkZXI7XG5cdFx0Y29uc3QgZXh0ZW5zaW9uc0tleSA9IFsuLi5lbmFibGVkRXh0ZW5zaW9uc10uc29ydCgpLmpvaW4oJ3wnKTtcblx0XHRjb25zdCBuZWVkc1Jlc2NhbiA9IGZvcmNlRnVsbFNjYW5cblx0XHRcdHx8ICF0aGlzLmZpbGVJbmRleC5pc0luaXRpYWxpemVkXG5cdFx0XHR8fCB0aGlzLmluZGV4ZWRFeHRlbnNpb25zS2V5ICE9PSBleHRlbnNpb25zS2V5XG5cdFx0XHR8fCB0aGlzLmluZGV4ZWRUcmFzaEZvbGRlciAhPT0gdHJhc2hGb2xkZXI7XG5cblx0XHR0aGlzLmZpbGVJbmRleC5zZXRFbmFibGVkRXh0ZW5zaW9ucyhlbmFibGVkRXh0ZW5zaW9ucyk7XG5cdFx0dGhpcy5maWxlSW5kZXguc2V0VHJhc2hGb2xkZXIodHJhc2hGb2xkZXIpO1xuXHRcdHRoaXMuaW5kZXhlZEV4dGVuc2lvbnNLZXkgPSBleHRlbnNpb25zS2V5O1xuXHRcdHRoaXMuaW5kZXhlZFRyYXNoRm9sZGVyID0gdHJhc2hGb2xkZXI7XG5cblx0XHRpZiAobmVlZHNSZXNjYW4pIHtcblx0XHRcdGF3YWl0IHRoaXMuZmlsZUluZGV4LmZ1bGxTY2FuKCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTkwNFx1NzQwNiBWYXVsdCBcdTY1ODdcdTRFRjZcdTUzRDhcdTUzMTZcblx0ICovXG5cdHByaXZhdGUgaGFuZGxlVmF1bHRGaWxlQ2hhbmdlKGZpbGU6IFRBYnN0cmFjdEZpbGUsIG9sZFBhdGg/OiBzdHJpbmcpIHtcblx0XHRpZiAoZmlsZSBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcblx0XHRcdHRoaXMuY2xlYXJDYWNoZSgpO1xuXHRcdFx0aWYgKHRoaXMuc2V0dGluZ3MuYXV0b1JlZnJlc2gpIHtcblx0XHRcdFx0dGhpcy5zY2hlZHVsZVJlZnJlc2hPcGVuVmlld3MoKTtcblx0XHRcdH1cblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qgbm9ybWFsaXplZE9sZFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgob2xkUGF0aCB8fCAnJykudG9Mb3dlckNhc2UoKTtcblx0XHRjb25zdCBvbGRXYXNNYXJrZG93biA9IG5vcm1hbGl6ZWRPbGRQYXRoLmVuZHNXaXRoKCcubWQnKTtcblx0XHRjb25zdCBvbGRXYXNNZWRpYSA9IG5vcm1hbGl6ZWRPbGRQYXRoID8gaXNNZWRpYUZpbGUobm9ybWFsaXplZE9sZFBhdGgpIDogZmFsc2U7XG5cdFx0Y29uc3QgaXNNYXJrZG93biA9IGZpbGUuZXh0ZW5zaW9uID09PSAnbWQnO1xuXHRcdGNvbnN0IGlzTWVkaWEgPSBpc01lZGlhRmlsZShmaWxlLm5hbWUpO1xuXG5cdFx0Ly8gTWFya2Rvd24gXHU1M0Q4XHU2NkY0XHU0RjFBXHU1RjcxXHU1NENEXHU1RjE1XHU3NTI4XHU1MTczXHU3Q0ZCXHVGRjBDXHU5NzAwXHU2RTA1XHU5NjY0XHU3RjEzXHU1QjU4XG5cdFx0aWYgKGlzTWFya2Rvd24gfHwgb2xkV2FzTWFya2Rvd24pIHtcblx0XHRcdHRoaXMuY2xlYXJDYWNoZSgpO1xuXHRcdH1cblxuXHRcdC8vIFx1NEVDNVx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1NTNEOFx1NjZGNFx1RkYwOFx1NTMwNVx1NTQyQlx1OTFDRFx1NTQ3RFx1NTQwRFx1NTI0RFx1NjYyRlx1NUE5Mlx1NEY1M1x1RkYwOVx1NjI0RFx1ODlFNlx1NTNEMVx1ODlDNlx1NTZGRVx1NTIzN1x1NjVCMFxuXHRcdGlmICghaXNNZWRpYSAmJiAhb2xkV2FzTWVkaWEpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIShpc01hcmtkb3duIHx8IG9sZFdhc01hcmtkb3duKSkge1xuXHRcdFx0dGhpcy5jbGVhckNhY2hlKCk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuc2V0dGluZ3MuYXV0b1JlZnJlc2gpIHtcblx0XHRcdHRoaXMuc2NoZWR1bGVSZWZyZXNoT3BlblZpZXdzKCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1OTYzMlx1NjI5Nlx1NTIzN1x1NjVCMFx1NURGMlx1NjI1M1x1NUYwMFx1ODlDNlx1NTZGRVxuXHQgKi9cblx0cHJpdmF0ZSBzY2hlZHVsZVJlZnJlc2hPcGVuVmlld3MoZGVsYXlNczogbnVtYmVyID0gMzAwKSB7XG5cdFx0aWYgKHRoaXMucmVmcmVzaFZpZXdzVGltZXIpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aGlzLnJlZnJlc2hWaWV3c1RpbWVyKTtcblx0XHR9XG5cblx0XHR0aGlzLnJlZnJlc2hWaWV3c1RpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHR0aGlzLnJlZnJlc2hWaWV3c1RpbWVyID0gbnVsbDtcblx0XHRcdHZvaWQgdGhpcy5yZWZyZXNoT3BlblZpZXdzKCk7XG5cdFx0fSwgZGVsYXlNcyk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1MjM3XHU2NUIwXHU2MjQwXHU2NzA5XHU1REYyXHU2MjUzXHU1RjAwXHU3Njg0XHU2M0QyXHU0RUY2XHU4OUM2XHU1NkZFXG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIHJlZnJlc2hPcGVuVmlld3MoKSB7XG5cdFx0Y29uc3QgdGFza3M6IFByb21pc2U8dW5rbm93bj5bXSA9IFtdO1xuXG5cdFx0Zm9yIChjb25zdCBsZWFmIG9mIHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX0lNQUdFX0xJQlJBUlkpKSB7XG5cdFx0XHRjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuXHRcdFx0aWYgKHZpZXcgaW5zdGFuY2VvZiBJbWFnZUxpYnJhcnlWaWV3KSB7XG5cdFx0XHRcdHRhc2tzLnB1c2godmlldy5yZWZyZXNoSW1hZ2VzKCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgbGVhZiBvZiB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9VTlJFRkVSRU5DRURfSU1BR0VTKSkge1xuXHRcdFx0Y29uc3QgdmlldyA9IGxlYWYudmlldztcblx0XHRcdGlmICh2aWV3IGluc3RhbmNlb2YgVW5yZWZlcmVuY2VkSW1hZ2VzVmlldykge1xuXHRcdFx0XHR0YXNrcy5wdXNoKHZpZXcuc2NhblVucmVmZXJlbmNlZEltYWdlcygpKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IGxlYWYgb2YgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfVFJBU0hfTUFOQUdFTUVOVCkpIHtcblx0XHRcdGNvbnN0IHZpZXcgPSBsZWFmLnZpZXc7XG5cdFx0XHRpZiAodmlldyBpbnN0YW5jZW9mIFRyYXNoTWFuYWdlbWVudFZpZXcpIHtcblx0XHRcdFx0dGFza3MucHVzaCh2aWV3LmxvYWRUcmFzaEl0ZW1zKCkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICh0YXNrcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQodGFza3MpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYyNTNcdTVGMDBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTdCQTFcdTc0MDZcdTg5QzZcdTU2RkVcblx0ICovXG5cdGFzeW5jIG9wZW5UcmFzaE1hbmFnZW1lbnQoKSB7XG5cdFx0Y29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuXG5cdFx0bGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9UUkFTSF9NQU5BR0VNRU5UKVswXTtcblx0XHRpZiAoIWxlYWYpIHtcblx0XHRcdGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZigndGFiJyk7XG5cdFx0XHRhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG5cdFx0XHRcdHR5cGU6IFZJRVdfVFlQRV9UUkFTSF9NQU5BR0VNRU5ULFxuXHRcdFx0XHRhY3RpdmU6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0XHR3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYyNTNcdTVGMDBcdTVBOTJcdTRGNTNcdTk4ODRcdTg5Qzhcblx0ICovXG5cdG9wZW5NZWRpYVByZXZpZXcoZmlsZTogVEZpbGUpIHtcblx0XHRpZiAoIXRoaXMuc2V0dGluZ3MuZW5hYmxlUHJldmlld01vZGFsKSB7XG5cdFx0XHRjb25zdCBzcmMgPSB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cdFx0XHR3aW5kb3cub3BlbihzcmMsICdfYmxhbmsnLCAnbm9vcGVuZXIsbm9yZWZlcnJlcicpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFx1NEZERFx1NjMwMVx1NTM1NVx1NUI5RVx1NEY4Qlx1OTg4NFx1ODlDOFx1RkYwQ1x1OTA3Rlx1NTE0RFx1NUU3Nlx1NTNEMVx1NUYzOVx1N0E5N1x1NUJGQ1x1ODFGNFx1NjMwOVx1OTRBRS9cdTcyQjZcdTYwMDFcdTk1MTlcdTRGNERcblx0XHRpZiAodGhpcy5hY3RpdmVQcmV2aWV3TW9kYWwpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMuYWN0aXZlUHJldmlld01vZGFsLmNsb3NlKCk7XG5cdFx0XHR9IGNhdGNoIChfKSB7fVxuXHRcdFx0dGhpcy5hY3RpdmVQcmV2aWV3TW9kYWwgPSBudWxsO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1vZGFsID0gbmV3IE1lZGlhUHJldmlld01vZGFsKHRoaXMuYXBwLCB0aGlzLCBmaWxlLCBbXSwgKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuYWN0aXZlUHJldmlld01vZGFsID09PSBtb2RhbCkge1xuXHRcdFx0XHR0aGlzLmFjdGl2ZVByZXZpZXdNb2RhbCA9IG51bGw7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hY3RpdmVQcmV2aWV3TW9kYWwgPSBtb2RhbDtcblx0XHRtb2RhbC5vcGVuKCk7XG5cdH1cblxuXHRvbnVubG9hZCgpIHtcblx0XHRpZiAodGhpcy5yZWZyZXNoVmlld3NUaW1lcikge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMucmVmcmVzaFZpZXdzVGltZXIpO1xuXHRcdFx0dGhpcy5yZWZyZXNoVmlld3NUaW1lciA9IG51bGw7XG5cdFx0fVxuXHRcdC8vIFx1NTE3M1x1OTVFRFx1N0YyOVx1NzU2NVx1NTZGRVx1N0YxM1x1NUI1OFxuXHRcdHRoaXMudGh1bWJuYWlsQ2FjaGUuY2xvc2UoKTtcblx0XHR0aGlzLmZpbGVJbmRleC5jbGVhcigpO1xuXG5cdFx0dGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShWSUVXX1RZUEVfSU1BR0VfTElCUkFSWSk7XG5cdFx0dGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShWSUVXX1RZUEVfVU5SRUZFUkVOQ0VEX0lNQUdFUyk7XG5cdFx0dGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShWSUVXX1RZUEVfVFJBU0hfTUFOQUdFTUVOVCk7XG5cdFx0dGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShWSUVXX1RZUEVfRFVQTElDQVRFX0RFVEVDVElPTik7XG5cdFx0aWYgKHRoaXMuYWN0aXZlUHJldmlld01vZGFsKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLmFjdGl2ZVByZXZpZXdNb2RhbC5jbG9zZSgpO1xuXHRcdFx0fSBjYXRjaCAoXykge31cblx0XHRcdHRoaXMuYWN0aXZlUHJldmlld01vZGFsID0gbnVsbDtcblx0XHR9XG5cdFx0dGhpcy5yZW1vdmVNYW5hZ2VkU3R5bGVzKCk7XG5cdH1cblxuXHRwcml2YXRlIHJlbW92ZU1hbmFnZWRTdHlsZXMoKSB7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ29ic2lkaWFuLW1lZGlhLXRvb2xraXQtc3R5bGVzJyk/LnJlbW92ZSgpO1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbWFnZS1tYW5hZ2VyLXN0eWxlcycpPy5yZW1vdmUoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYyNTNcdTVGMDBcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEJcdTg5QzZcdTU2RkVcblx0ICovXG5cdGFzeW5jIG9wZW5EdXBsaWNhdGVEZXRlY3Rpb24oKSB7XG5cdFx0Y29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuXHRcdGxldCBsZWFmID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfRFVQTElDQVRFX0RFVEVDVElPTilbMF07XG5cdFx0aWYgKCFsZWFmKSB7XG5cdFx0XHRsZWFmID0gd29ya3NwYWNlLmdldExlYWYoJ3RhYicpO1xuXHRcdFx0YXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoe1xuXHRcdFx0XHR0eXBlOiBWSUVXX1RZUEVfRFVQTElDQVRFX0RFVEVDVElPTixcblx0XHRcdFx0YWN0aXZlOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0d29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cdH1cblxuXHQvLyBcdTUyQTBcdThGN0RcdTY4MzdcdTVGMEZcdTY1ODdcdTRFRjZcblx0Ly8gXHU2Q0U4XHU2MTBGXHVGRjFBXHU0RjE4XHU1MTQ4XHU0RjdGXHU3NTI4IHN0eWxlcy5jc3MgXHU0RTJEXHU3Njg0XHU2ODM3XHU1RjBGXHVGRjBDYWRkU3R5bGUgXHU0RjVDXHU0RTNBXHU1NDBFXHU1OTA3XHU2NUI5XHU2ODQ4XG5cdGFzeW5jIGFkZFN0eWxlKCkge1xuXHRcdGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZEV4dGVybmFsU3R5bGVzKCk7XG5cdFx0aWYgKCFsb2FkZWQpIHtcblx0XHRcdHRoaXMuYWRkSW5saW5lU3R5bGUoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBcdTRFQ0VcdTU5MTZcdTkwRThcdTY4MzdcdTVGMEZcdTY1ODdcdTRFRjZcdTUyQTBcdThGN0Rcblx0YXN5bmMgbG9hZEV4dGVybmFsU3R5bGVzKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdC8vIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NURGMlx1NUI1OFx1NTcyOFx1NjgzN1x1NUYwRlx1NTE0M1x1N0QyMFx1RkYwQ1x1OTA3Rlx1NTE0RFx1OTFDRFx1NTkwRFx1NkRGQlx1NTJBMFxuXHRcdGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb2JzaWRpYW4tbWVkaWEtdG9vbGtpdC1zdHlsZXMnKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3R5bGVQYXRocyA9IFtcblx0XHRcdHRoaXMubWFuaWZlc3QuZGlyID8gYCR7bm9ybWFsaXplVmF1bHRQYXRoKHRoaXMubWFuaWZlc3QuZGlyKX0vc3R5bGVzLmNzc2AgOiAnJyxcblx0XHRcdGAub2JzaWRpYW4vcGx1Z2lucy8ke3RoaXMubWFuaWZlc3QuaWR9L3N0eWxlcy5jc3NgLFxuXHRcdFx0J3N0eWxlcy5jc3MnXG5cdFx0XS5maWx0ZXIoKHBhdGgsIGluZGV4LCBhcnIpID0+IHBhdGggJiYgYXJyLmluZGV4T2YocGF0aCkgPT09IGluZGV4KTtcblxuXHRcdHRyeSB7XG5cdFx0XHRmb3IgKGNvbnN0IHN0eWxlUGF0aCBvZiBzdHlsZVBhdGhzKSB7XG5cdFx0XHRcdGlmICghYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5leGlzdHMoc3R5bGVQYXRoKSkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIucmVhZChzdHlsZVBhdGgpO1xuXHRcdFx0XHRjb25zdCBzYW5pdGl6ZWRDc3MgPSBjb250ZW50XG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyIGV4cHJlc3Npb24oKSBcdTdCNDkgSmF2YVNjcmlwdCBcdTYyNjdcdTg4NENcblx0XHRcdFx0XHQucmVwbGFjZSgvZXhwcmVzc2lvblxccypcXCgvZ2ksICcvKiBibG9ja2VkICovKCcpXG5cdFx0XHRcdFx0LnJlcGxhY2UoL2phdmFzY3JpcHRcXHMqOi9naSwgJy8qIGJsb2NrZWQgKi86Jylcblx0XHRcdFx0XHQucmVwbGFjZSgvdmJzY3JpcHRcXHMqOi9naSwgJy8qIGJsb2NrZWQgKi86Jylcblx0XHRcdFx0XHQvLyBcdTk2M0JcdTZCNjIgdXJsKCkgXHU1RjE1XHU3NTI4XHU1OTE2XHU5MEU4XHU4RDQ0XHU2RTkwXG5cdFx0XHRcdFx0LnJlcGxhY2UoL3VybFxccypcXChbXildKlxcKS9naSwgJy8qIHVybCgpIGJsb2NrZWQgKi8nKVxuXHRcdFx0XHRcdC8vIFx1OTYzQlx1NkI2MiBAaW1wb3J0IFx1NUYxNVx1NTE2NVx1NTkxNlx1OTBFOFx1NjgzN1x1NUYwRlxuXHRcdFx0XHRcdC5yZXBsYWNlKC9AaW1wb3J0XFxzKlteO10rOy9naSwgJy8qIEBpbXBvcnQgYmxvY2tlZCAqLycpXG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyXHU0RThCXHU0RUY2XHU1OTA0XHU3NDA2XHU1NjY4XHU1QzVFXHU2MDI3IChvbmNsaWNrLCBvbmVycm9yLCBvbmxvYWQsIG9ubW91c2VvdmVyIFx1N0I0OSlcblx0XHRcdFx0XHQucmVwbGFjZSgvXFxib24oY2xpY2t8ZXJyb3J8bG9hZHxtb3VzZW92ZXJ8bW91c2VvdXR8Zm9jdXN8Ymx1cnxjaGFuZ2V8c3VibWl0fGtleWRvd258a2V5dXApXFxzKj0vZ2ksICdkYXRhLWJsb2NrZWQtb24kMT0nKVxuXHRcdFx0XHRcdC8vIFx1OTYzQlx1NkI2MiBmaWx0ZXI6dXJsKCkgXHU1RjE1XHU3NTI4XHU1OTE2XHU5MEU4XHU4RDQ0XHU2RTkwXG5cdFx0XHRcdFx0LnJlcGxhY2UoL2ZpbHRlclxccyo6XFxzKnVybFxccypcXChbXildKlxcKS9naSwgJy8qIGZpbHRlcjp1cmwoKSBibG9ja2VkICovJylcblx0XHRcdFx0XHQvLyBcdTk2M0JcdTZCNjIgYmVoYXZpb3IgKElFIFx1ODg0Q1x1NEUzQVx1NUM1RVx1NjAyNylcblx0XHRcdFx0XHQucmVwbGFjZSgvYmVoYXZpb3JcXHMqOi9naSwgJy8qIGJlaGF2aW9yIGJsb2NrZWQgKi86Jylcblx0XHRcdFx0XHQvLyBcdTk2M0JcdTZCNjIgLW1zLWJlaGF2aW9yIChJRSBcdTRFMTNcdTY3MDkpXG5cdFx0XHRcdFx0LnJlcGxhY2UoLy1tcy1iZWhhdmlvclxccyo6L2dpLCAnLyogLW1zLWJlaGF2aW9yIGJsb2NrZWQgKi86Jylcblx0XHRcdFx0XHQvLyBcdTk2M0JcdTZCNjIgYmluZGluZyAoWFVMIFx1N0VEMVx1NUI5QSlcblx0XHRcdFx0XHQucmVwbGFjZSgvYmluZGluZ1xccyo6XFxzKnVybFxccypcXChbXildKlxcKS9naSwgJy8qIGJpbmRpbmcgYmxvY2tlZCAqLycpXG5cdFx0XHRcdFx0Ly8gXHU5NjNCXHU2QjYyIGFuaW1hdGlvbi90cmFuc2l0aW9uIFx1NEUyRFx1NzY4NCB1cmwoKVxuXHRcdFx0XHRcdC5yZXBsYWNlKC8oYW5pbWF0aW9ufHRyYW5zaXRpb24pXFxzKjpbXjtdKnVybFxccypcXChbXildKlxcKS9naSwgJy8qICQxIHVybCgpIGJsb2NrZWQgKi8nKTtcblx0XHRcdFx0Y29uc3Qgc3R5bGVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cdFx0XHRcdHN0eWxlRWwuaWQgPSAnb2JzaWRpYW4tbWVkaWEtdG9vbGtpdC1zdHlsZXMnO1xuXHRcdFx0XHRzdHlsZUVsLnRleHRDb250ZW50ID0gc2FuaXRpemVkQ3NzO1xuXHRcdFx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlRWwpO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5sb2coJ1x1NTJBMFx1OEY3RFx1NTkxNlx1OTBFOFx1NjgzN1x1NUYwRlx1NjU4N1x1NEVGNlx1NTkzMVx1OEQyNVx1RkYwQ1x1NEY3Rlx1NzUyOFx1NTE4NVx1ODA1NFx1NjgzN1x1NUYwRicsIGVycm9yKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBcdTUxODVcdTgwNTRcdTY4MzdcdTVGMEZcdUZGMDhcdTU0MEVcdTU5MDdcdTY1QjlcdTY4NDhcdUZGMDlcblx0YWRkSW5saW5lU3R5bGUoKSB7XG5cdFx0Ly8gXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU1REYyXHU1QjU4XHU1NzI4XHU2ODM3XHU1RjBGXHU1MTQzXHU3RDIwXHVGRjBDXHU5MDdGXHU1MTREXHU5MUNEXHU1OTBEXHU2REZCXHU1MkEwXG5cdFx0aWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbWFnZS1tYW5hZ2VyLXN0eWxlcycpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3R5bGVFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cdFx0c3R5bGVFbC5pZCA9ICdpbWFnZS1tYW5hZ2VyLXN0eWxlcyc7XG5cdFx0c3R5bGVFbC50ZXh0Q29udGVudCA9IGAvKiBPYnNpZGlhbiBJbWFnZSBNYW5hZ2VyIFBsdWdpbiBTdHlsZXMgKi9cblxuLyogPT09PT0gXHU1MTY4XHU1QzQwXHU2ODM3XHU1RjBGID09PT09ICovXG4uaW1hZ2UtbGlicmFyeS12aWV3LFxuLnVucmVmZXJlbmNlZC1pbWFnZXMtdmlldyB7XG5cdGhlaWdodDogMTAwJTtcblx0b3ZlcmZsb3cteTogYXV0bztcblx0cGFkZGluZzogMTZweDtcblx0Ym94LXNpemluZzogYm9yZGVyLWJveDtcbn1cblxuLyogPT09PT0gXHU1OTM0XHU5MEU4XHU2ODM3XHU1RjBGID09PT09ICovXG4uaW1hZ2UtbGlicmFyeS1oZWFkZXIsXG4udW5yZWZlcmVuY2VkLWhlYWRlciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2Vlbjtcblx0bWFyZ2luLWJvdHRvbTogMjBweDtcblx0cGFkZGluZy1ib3R0b206IDE2cHg7XG5cdGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi5pbWFnZS1saWJyYXJ5LWhlYWRlciBoMixcbi51bnJlZmVyZW5jZWQtaGVhZGVyIGgyIHtcblx0bWFyZ2luOiAwO1xuXHRmb250LXNpemU6IDEuNWVtO1xuXHRmb250LXdlaWdodDogNjAwO1xufVxuXG4uaW1hZ2Utc3RhdHMsXG4uaGVhZGVyLWRlc2NyaXB0aW9uIHtcblx0bWFyZ2luLXRvcDogNHB4O1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdGZvbnQtc2l6ZTogMC45ZW07XG59XG5cbi5oZWFkZXItZGVzY3JpcHRpb24ge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRnYXA6IDRweDtcbn1cblxuLyogPT09PT0gXHU2MzA5XHU5NEFFXHU2ODM3XHU1RjBGID09PT09ICovXG4ucmVmcmVzaC1idXR0b24sXG4uYWN0aW9uLWJ1dHRvbixcbi5pdGVtLWJ1dHRvbiB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGp1c3RpZnktY29udGVudDogY2VudGVyO1xuXHRwYWRkaW5nOiA4cHg7XG5cdGJvcmRlcjogbm9uZTtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGN1cnNvcjogcG9pbnRlcjtcblx0dHJhbnNpdGlvbjogYmFja2dyb3VuZCAwLjJzLCBjb2xvciAwLjJzO1xufVxuXG4ucmVmcmVzaC1idXR0b246aG92ZXIsXG4uYWN0aW9uLWJ1dHRvbjpob3Zlcixcbi5pdGVtLWJ1dHRvbjpob3ZlciB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4ucmVmcmVzaC1idXR0b24gc3ZnLFxuLmFjdGlvbi1idXR0b24gc3ZnLFxuLml0ZW0tYnV0dG9uIHN2ZyB7XG5cdHdpZHRoOiAxNnB4O1xuXHRoZWlnaHQ6IDE2cHg7XG59XG5cbi5hY3Rpb24tYnV0dG9uLmRhbmdlcixcbi5pdGVtLWJ1dHRvbi5kYW5nZXIge1xuXHRjb2xvcjogdmFyKC0tdGV4dC1lcnJvcik7XG59XG5cbi5hY3Rpb24tYnV0dG9uLmRhbmdlcjpob3Zlcixcbi5pdGVtLWJ1dHRvbi5kYW5nZXI6aG92ZXIge1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWVycm9yKTtcblx0Y29sb3I6IHdoaXRlO1xufVxuXG4uaGVhZGVyLWFjdGlvbnMge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRnYXA6IDhweDtcbn1cblxuLyogPT09PT0gXHU2MzkyXHU1RThGXHU5MDA5XHU2MkU5XHU1NjY4ID09PT09ICovXG4uc29ydC1zZWxlY3Qge1xuXHRwYWRkaW5nOiA2cHggMTJweDtcblx0Ym9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Y29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcblx0Zm9udC1zaXplOiAwLjllbTtcblx0Y3Vyc29yOiBwb2ludGVyO1xufVxuXG4ub3JkZXItYnV0dG9uIHtcblx0cGFkZGluZzogNnB4IDhweDtcblx0bWFyZ2luLWxlZnQ6IDhweDtcblx0Ym9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Y29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcblx0Y3Vyc29yOiBwb2ludGVyO1xufVxuXG4ub3JkZXItYnV0dG9uIHN2ZyB7XG5cdHdpZHRoOiAxNnB4O1xuXHRoZWlnaHQ6IDE2cHg7XG59XG5cbi8qID09PT09IFx1NTZGRVx1NzI0N1x1N0Y1MVx1NjgzQyA9PT09PSAqL1xuLmltYWdlLWdyaWQge1xuXHRkaXNwbGF5OiBncmlkO1xuXHRnYXA6IDE2cHg7XG5cdGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZmlsbCwgbWlubWF4KDE1MHB4LCAxZnIpKTtcbn1cblxuLmltYWdlLWdyaWQtc21hbGwge1xuXHRncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpbGwsIG1pbm1heCgxMDBweCwgMWZyKSk7XG59XG5cbi5pbWFnZS1ncmlkLW1lZGl1bSB7XG5cdGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZmlsbCwgbWlubWF4KDE1MHB4LCAxZnIpKTtcbn1cblxuLmltYWdlLWdyaWQtbGFyZ2Uge1xuXHRncmlkLXRlbXBsYXRlLWNvbHVtbnM6IHJlcGVhdChhdXRvLWZpbGwsIG1pbm1heCgyMDBweCwgMWZyKSk7XG59XG5cbi8qID09PT09IFx1NTZGRVx1NzI0N1x1OTg3OSA9PT09PSAqL1xuLmltYWdlLWl0ZW0ge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGJvcmRlci1yYWRpdXM6IDhweDtcblx0b3ZlcmZsb3c6IGhpZGRlbjtcblx0dHJhbnNpdGlvbjogdHJhbnNmb3JtIDAuMnMsIGJveC1zaGFkb3cgMC4ycztcblx0Y3Vyc29yOiBwb2ludGVyO1xufVxuXG4uaW1hZ2UtaXRlbTpob3ZlciB7XG5cdHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtMnB4KTtcblx0Ym94LXNoYWRvdzogMCA0cHggMTJweCByZ2JhKDAsIDAsIDAsIDAuMTUpO1xufVxuXG4uaW1hZ2UtY29udGFpbmVyIHtcblx0cG9zaXRpb246IHJlbGF0aXZlO1xuXHR3aWR0aDogMTAwJTtcblx0cGFkZGluZy10b3A6IDEwMCU7XG5cdG92ZXJmbG93OiBoaWRkZW47XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4uaW1hZ2UtY29udGFpbmVyIGltZyB7XG5cdHBvc2l0aW9uOiBhYnNvbHV0ZTtcblx0dG9wOiAwO1xuXHRsZWZ0OiAwO1xuXHR3aWR0aDogMTAwJTtcblx0aGVpZ2h0OiAxMDAlO1xuXHRvYmplY3QtZml0OiBjb3Zlcjtcbn1cblxuLmltYWdlLWluZm8ge1xuXHRwYWRkaW5nOiA4cHg7XG5cdGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi5pbWFnZS1uYW1lIHtcblx0Zm9udC1zaXplOiAwLjg1ZW07XG5cdGZvbnQtd2VpZ2h0OiA1MDA7XG5cdG92ZXJmbG93OiBoaWRkZW47XG5cdHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuXHR3aGl0ZS1zcGFjZTogbm93cmFwO1xufVxuXG4uaW1hZ2Utc2l6ZSB7XG5cdGZvbnQtc2l6ZTogMC43NWVtO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdG1hcmdpbi10b3A6IDJweDtcbn1cblxuLyogPT09PT0gXHU2NzJBXHU1RjE1XHU3NTI4XHU1NkZFXHU3MjQ3XHU1MjE3XHU4ODY4ID09PT09ICovXG4uc3RhdHMtYmFyIHtcblx0ZGlzcGxheTogZmxleDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0Z2FwOiAxNnB4O1xuXHRwYWRkaW5nOiAxMnB4IDE2cHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRtYXJnaW4tYm90dG9tOiAxNnB4O1xufVxuXG4uc3RhdHMtY291bnQge1xuXHRmb250LXdlaWdodDogNjAwO1xuXHRjb2xvcjogdmFyKC0tdGV4dC13YXJuaW5nKTtcbn1cblxuLnN0YXRzLXNpemUge1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG59XG5cbi51bnJlZmVyZW5jZWQtbGlzdCB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG5cdGdhcDogMTJweDtcbn1cblxuLnVucmVmZXJlbmNlZC1pdGVtIHtcblx0ZGlzcGxheTogZmxleDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0Z2FwOiAxNnB4O1xuXHRwYWRkaW5nOiAxMnB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGJvcmRlci1yYWRpdXM6IDhweDtcblx0dHJhbnNpdGlvbjogYmFja2dyb3VuZCAwLjJzO1xufVxuXG4udW5yZWZlcmVuY2VkLWl0ZW06aG92ZXIge1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcbn1cblxuLml0ZW0tdGh1bWJuYWlsIHtcblx0d2lkdGg6IDYwcHg7XG5cdGhlaWdodDogNjBweDtcblx0ZmxleC1zaHJpbms6IDA7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0b3ZlcmZsb3c6IGhpZGRlbjtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC10ZXJ0aWFyeSk7XG59XG5cbi5pdGVtLXRodW1ibmFpbCBpbWcge1xuXHR3aWR0aDogMTAwJTtcblx0aGVpZ2h0OiAxMDAlO1xuXHRvYmplY3QtZml0OiBjb3Zlcjtcbn1cblxuLml0ZW0taW5mbyB7XG5cdGZsZXg6IDE7XG5cdG1pbi13aWR0aDogMDtcbn1cblxuLml0ZW0tbmFtZSB7XG5cdGZvbnQtd2VpZ2h0OiA1MDA7XG5cdG92ZXJmbG93OiBoaWRkZW47XG5cdHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuXHR3aGl0ZS1zcGFjZTogbm93cmFwO1xufVxuXG4uaXRlbS1wYXRoIHtcblx0Zm9udC1zaXplOiAwLjhlbTtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHR0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcblx0d2hpdGUtc3BhY2U6IG5vd3JhcDtcblx0bWFyZ2luLXRvcDogMnB4O1xufVxuXG4uaXRlbS1zaXplIHtcblx0Zm9udC1zaXplOiAwLjg1ZW07XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0bWFyZ2luLXRvcDogNHB4O1xufVxuXG4uaXRlbS1hY3Rpb25zIHtcblx0ZGlzcGxheTogZmxleDtcblx0Z2FwOiA4cHg7XG5cdGZsZXgtc2hyaW5rOiAwO1xufVxuXG4vKiA9PT09PSBcdTdBN0FcdTcyQjZcdTYwMDEgPT09PT0gKi9cbi5lbXB0eS1zdGF0ZSxcbi5sb2FkaW5nLXN0YXRlLFxuLnN1Y2Nlc3Mtc3RhdGUsXG4uZXJyb3Itc3RhdGUge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0cGFkZGluZzogNDhweDtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHR0ZXh0LWFsaWduOiBjZW50ZXI7XG59XG5cbi5lbXB0eS1zdGF0ZTo6YmVmb3JlIHtcblx0Y29udGVudDogJ1x1RDgzRFx1RERCQ1x1RkUwRic7XG5cdGZvbnQtc2l6ZTogNDhweDtcblx0bWFyZ2luLWJvdHRvbTogMTZweDtcbn1cblxuLnN1Y2Nlc3Mtc3RhdGU6OmJlZm9yZSB7XG5cdGNvbnRlbnQ6ICdcdTI3MDUnO1xuXHRmb250LXNpemU6IDQ4cHg7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG59XG5cbi5lcnJvci1zdGF0ZTo6YmVmb3JlIHtcblx0Y29udGVudDogJ1x1Mjc0Qyc7XG5cdGZvbnQtc2l6ZTogNDhweDtcblx0bWFyZ2luLWJvdHRvbTogMTZweDtcbn1cblxuLyogXHU1MkEwXHU4RjdEXHU1MkE4XHU3NTNCICovXG4uc3Bpbm5lciB7XG5cdHdpZHRoOiAzMnB4O1xuXHRoZWlnaHQ6IDMycHg7XG5cdGJvcmRlcjogM3B4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXRvcC1jb2xvcjogdmFyKC0tdGV4dC1hY2NlbnQpO1xuXHRib3JkZXItcmFkaXVzOiA1MCU7XG5cdGFuaW1hdGlvbjogc3BpbiAxcyBsaW5lYXIgaW5maW5pdGU7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG59XG5cbkBrZXlmcmFtZXMgc3BpbiB7XG5cdHRvIHtcblx0XHR0cmFuc2Zvcm06IHJvdGF0ZSgzNjBkZWcpO1xuXHR9XG59XG5cbi8qID09PT09IFx1OEJCRVx1N0Y2RVx1OTg3NVx1OTc2Mlx1NjgzN1x1NUYwRiA9PT09PSAqL1xuLnNldHRpbmdzLWRpdmlkZXIge1xuXHRtYXJnaW46IDI0cHggMDtcblx0Ym9yZGVyOiBub25lO1xuXHRib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4uc2V0dGluZ3MtZGVzY3JpcHRpb24ge1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdG1hcmdpbi1ib3R0b206IDhweDtcbn1cblxuLnNldHRpbmdzLWxpc3Qge1xuXHRtYXJnaW46IDA7XG5cdHBhZGRpbmctbGVmdDogMjBweDtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4uc2V0dGluZ3MtbGlzdCBsaSB7XG5cdG1hcmdpbi1ib3R0b206IDRweDtcbn1cblxuLyogPT09PT0gXHU2NDFDXHU3RDIyXHU2ODQ2XHU2ODM3XHU1RjBGID09PT09ICovXG4uc2VhcmNoLWNvbnRhaW5lciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogOHB4O1xuXHRtYXJnaW4tYm90dG9tOiAxNnB4O1xuXHRwYWRkaW5nOiA4cHggMTJweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG59XG5cbi5zZWFyY2gtaW5wdXQge1xuXHRmbGV4OiAxO1xuXHRwYWRkaW5nOiA4cHggMTJweDtcblx0Ym9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtcHJpbWFyeSk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG5cdGZvbnQtc2l6ZTogMC45ZW07XG59XG5cbi5zZWFyY2gtaW5wdXQ6Zm9jdXMge1xuXHRvdXRsaW5lOiBub25lO1xuXHRib3JkZXItY29sb3I6IHZhcigtLXRleHQtYWNjZW50KTtcbn1cblxuLnNlYXJjaC1pY29uIHtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4uc2VhcmNoLXJlc3VsdHMtY291bnQge1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdGZvbnQtc2l6ZTogMC44NWVtO1xufVxuXG4uY2xlYXItc2VhcmNoIHtcblx0cGFkZGluZzogNHB4O1xuXHRib3JkZXI6IG5vbmU7XG5cdGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLmNsZWFyLXNlYXJjaDpob3ZlciB7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG59XG5cbi8qID09PT09IFx1NTIwNlx1OTg3NVx1NjNBN1x1NEVGNiA9PT09PSAqL1xuLnBhZ2luYXRpb24ge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0Z2FwOiAxMnB4O1xuXHRtYXJnaW4tdG9wOiAyMHB4O1xuXHRwYWRkaW5nOiAxNnB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcbn1cblxuLnBhZ2UtYnV0dG9uIHtcblx0cGFkZGluZzogNnB4IDEycHg7XG5cdGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLnBhZ2UtYnV0dG9uOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC10ZXJ0aWFyeSk7XG59XG5cbi5wYWdlLWJ1dHRvbjpkaXNhYmxlZCB7XG5cdG9wYWNpdHk6IDAuNTtcblx0Y3Vyc29yOiBub3QtYWxsb3dlZDtcbn1cblxuLnBhZ2UtaW5mbyB7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0Zm9udC1zaXplOiAwLjllbTtcbn1cblxuLnBhZ2UtanVtcC1pbnB1dCB7XG5cdHdpZHRoOiA1MHB4O1xuXHRwYWRkaW5nOiA0cHggOHB4O1xuXHRib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KTtcblx0Y29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcblx0dGV4dC1hbGlnbjogY2VudGVyO1xufVxuXG4vKiA9PT09PSBcdTkwMDlcdTYyRTlcdTZBMjFcdTVGMEZcdTVERTVcdTUxNzdcdTY4MEYgPT09PT0gKi9cbi5zZWxlY3Rpb24tdG9vbGJhciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogMTJweDtcblx0bWFyZ2luLWJvdHRvbTogMTZweDtcblx0cGFkZGluZzogMTJweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG59XG5cbi5zZWxlY3Rpb24tY291bnQge1xuXHRmb250LXdlaWdodDogNjAwO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1hY2NlbnQpO1xufVxuXG4udG9vbGJhci1idXR0b24ge1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0cGFkZGluZzogOHB4O1xuXHRib3JkZXI6IG5vbmU7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLnRvb2xiYXItYnV0dG9uOmhvdmVyIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4udG9vbGJhci1idXR0b24uZGFuZ2VyIHtcblx0Y29sb3I6IHZhcigtLXRleHQtZXJyb3IpO1xufVxuXG4udG9vbGJhci1idXR0b24uZGFuZ2VyOmhvdmVyIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1lcnJvcik7XG5cdGNvbG9yOiB3aGl0ZTtcbn1cblxuLyogPT09PT0gXHU1NkZFXHU3MjQ3XHU5MDA5XHU2MkU5XHU2ODQ2ID09PT09ICovXG4uaW1hZ2UtaXRlbSB7XG5cdHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLml0ZW0tY2hlY2tib3gge1xuXHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdHRvcDogOHB4O1xuXHRsZWZ0OiA4cHg7XG5cdHotaW5kZXg6IDEwO1xuXHR3aWR0aDogMThweDtcblx0aGVpZ2h0OiAxOHB4O1xuXHRjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi8qID09PT09IFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1N0JBMVx1NzQwNlx1ODlDNlx1NTZGRSA9PT09PSAqL1xuLnRyYXNoLW1hbmFnZW1lbnQtdmlldyB7XG5cdGhlaWdodDogMTAwJTtcblx0b3ZlcmZsb3cteTogYXV0bztcblx0cGFkZGluZzogMTZweDtcblx0Ym94LXNpemluZzogYm9yZGVyLWJveDtcbn1cblxuLnRyYXNoLWhlYWRlciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2Vlbjtcblx0bWFyZ2luLWJvdHRvbTogMjBweDtcblx0cGFkZGluZy1ib3R0b206IDE2cHg7XG5cdGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi50cmFzaC1oZWFkZXIgaDIge1xuXHRtYXJnaW46IDA7XG5cdGZvbnQtc2l6ZTogMS41ZW07XG5cdGZvbnQtd2VpZ2h0OiA2MDA7XG59XG5cbi50cmFzaC1saXN0IHtcblx0ZGlzcGxheTogZmxleDtcblx0ZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcblx0Z2FwOiAxMnB4O1xufVxuXG4udHJhc2gtaXRlbSB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogMTZweDtcblx0cGFkZGluZzogMTJweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRib3JkZXItcmFkaXVzOiA4cHg7XG5cdHRyYW5zaXRpb246IGJhY2tncm91bmQgMC4ycztcbn1cblxuLnRyYXNoLWl0ZW06aG92ZXIge1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcbn1cblxuLml0ZW0taWNvbiB7XG5cdHdpZHRoOiA0MHB4O1xuXHRoZWlnaHQ6IDQwcHg7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGp1c3RpZnktY29udGVudDogY2VudGVyO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXRlcnRpYXJ5KTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG59XG5cbi5pdGVtLW9yaWdpbmFsLXBhdGgge1xuXHRmb250LXNpemU6IDAuOGVtO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG5cdG1hcmdpbi10b3A6IDJweDtcbn1cblxuLml0ZW0tZGF0ZSB7XG5cdGZvbnQtc2l6ZTogMC44ZW07XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0bWFyZ2luLXRvcDogMnB4O1xufVxuXG4vKiA9PT09PSBcdTVBOTJcdTRGNTNcdTk4ODRcdTg5QzggTW9kYWwgPT09PT0gKi9cbi5tZWRpYS1wcmV2aWV3LW1vZGFsIHtcblx0bWF4LXdpZHRoOiA5MHZ3O1xuXHRtYXgtaGVpZ2h0OiA5MHZoO1xufVxuXG4ubWVkaWEtcHJldmlldy1tb2RhbCAubW9kYWwtY29udGVudCB7XG5cdHBhZGRpbmc6IDA7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtcHJpbWFyeSk7XG59XG5cbi5wcmV2aWV3LWNsb3NlIHtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6IDEwcHg7XG5cdHJpZ2h0OiAxNXB4O1xuXHRmb250LXNpemU6IDI0cHg7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcblx0Y3Vyc29yOiBwb2ludGVyO1xuXHR6LWluZGV4OiAxMDA7XG59XG5cbi5wcmV2aWV3LWNsb3NlOmhvdmVyIHtcblx0Y29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcbn1cblxuLnByZXZpZXctY29udGFpbmVyIHtcblx0cG9zaXRpb246IHJlbGF0aXZlO1xuXHRkaXNwbGF5OiBmbGV4O1xuXHRhbGlnbi1pdGVtczogY2VudGVyO1xuXHRqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcblx0bWluLWhlaWdodDogNDAwcHg7XG5cdG1heC1oZWlnaHQ6IDcwdmg7XG5cdG92ZXJmbG93OiBhdXRvO1xufVxuXG4ucHJldmlldy1pbWFnZSB7XG5cdG1heC13aWR0aDogMTAwJTtcblx0bWF4LWhlaWdodDogNzB2aDtcblx0b2JqZWN0LWZpdDogY29udGFpbjtcbn1cblxuLnByZXZpZXctdmlkZW8sXG4ucHJldmlldy1hdWRpbyB7XG5cdG1heC13aWR0aDogMTAwJTtcbn1cblxuLnByZXZpZXctcGRmIHtcblx0d2lkdGg6IDEwMCU7XG5cdGhlaWdodDogNzB2aDtcblx0Ym9yZGVyOiBub25lO1xufVxuXG4ucHJldmlldy11bnN1cHBvcnRlZCB7XG5cdHBhZGRpbmc6IDQwcHg7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbn1cblxuLnByZXZpZXctbmF2IHtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6IDUwJTtcblx0dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1xuXHRsZWZ0OiAwO1xuXHRyaWdodDogMDtcblx0ZGlzcGxheTogZmxleDtcblx0anVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuXHRwYWRkaW5nOiAwIDIwcHg7XG5cdHBvaW50ZXItZXZlbnRzOiBub25lO1xufVxuXG4ubmF2LWJ1dHRvbiB7XG5cdHBvaW50ZXItZXZlbnRzOiBhdXRvO1xuXHRmb250LXNpemU6IDMycHg7XG5cdHBhZGRpbmc6IDEwcHggMTVweDtcblx0Ym9yZGVyOiBub25lO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0Y3Vyc29yOiBwb2ludGVyO1xufVxuXG4ubmF2LWJ1dHRvbjpob3ZlciB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtdGVydGlhcnkpO1xufVxuXG4ubmF2LWluZm8ge1xuXHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdGJvdHRvbTogMTBweDtcblx0bGVmdDogNTAlO1xuXHR0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG5cdHBhZGRpbmc6IDRweCAxMnB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGJvcmRlci1yYWRpdXM6IDRweDtcblx0Zm9udC1zaXplOiAwLjllbTtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4ucHJldmlldy1pbmZvLWJhciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2Vlbjtcblx0cGFkZGluZzogMTJweCAyMHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi5pbmZvLW5hbWUge1xuXHRmb250LXdlaWdodDogNTAwO1xufVxuXG4uaW5mby1hY3Rpb25zIHtcblx0ZGlzcGxheTogZmxleDtcblx0Z2FwOiA4cHg7XG59XG5cbi5pbmZvLWFjdGlvbnMgYnV0dG9uIHtcblx0cGFkZGluZzogNHB4IDhweDtcblx0Ym9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuXHRjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuXHRjdXJzb3I6IHBvaW50ZXI7XG59XG5cbi5pbmZvLWFjdGlvbnMgYnV0dG9uOmhvdmVyIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC10ZXJ0aWFyeSk7XG59XG5cbi8qID09PT09IFx1OTFDRFx1NTkwRFx1NjhDMFx1NkQ0Qlx1RkYwOFx1NTQwRVx1NTkwN1x1NjgzN1x1NUYwRlx1RkYwOSA9PT09PSAqL1xuLmR1cGxpY2F0ZS1lbXB0eS1zdGF0ZSB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGp1c3RpZnktY29udGVudDogY2VudGVyO1xuXHRnYXA6IDE2cHg7XG5cdHBhZGRpbmc6IDQ4cHggMjRweDtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHR0ZXh0LWFsaWduOiBjZW50ZXI7XG59XG5cbi5kdXBsaWNhdGUtZW1wdHktYWN0aW9uIHtcblx0bWFyZ2luLXRvcDogOHB4O1xufVxuXG4uZHVwbGljYXRlLXNjYW4tcHJvZ3Jlc3Mge1xuXHRwYWRkaW5nOiAyMHB4O1xuXHR0ZXh0LWFsaWduOiBjZW50ZXI7XG59XG5cbi5kdXBsaWNhdGUtcHJvZ3Jlc3MtYmFyIHtcblx0aGVpZ2h0OiA4cHg7XG5cdGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0Ym9yZGVyLXJhZGl1czogNHB4O1xuXHRvdmVyZmxvdzogaGlkZGVuO1xuXHRtYXJnaW46IDE2cHggMDtcbn1cblxuLmR1cGxpY2F0ZS1wcm9ncmVzcy1maWxsIHtcblx0aGVpZ2h0OiAxMDAlO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xuXHRib3JkZXItcmFkaXVzOiA0cHg7XG5cdHRyYW5zaXRpb246IHdpZHRoIDAuM3MgZWFzZTtcbn1cblxuLmR1cGxpY2F0ZS1wcm9ncmVzcy10ZXh0IHtcblx0Zm9udC1zaXplOiAwLjllbTtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4uZHVwbGljYXRlLWRldGVjdGlvbi12aWV3IHtcblx0aGVpZ2h0OiAxMDAlO1xuXHRvdmVyZmxvdy15OiBhdXRvO1xuXHRwYWRkaW5nOiAxNnB4O1xuXHRib3gtc2l6aW5nOiBib3JkZXItYm94O1xufVxuXG4uZHVwbGljYXRlLWhlYWRlciB7XG5cdG1hcmdpbi1ib3R0b206IDE2cHg7XG5cdHBhZGRpbmctYm90dG9tOiAxMnB4O1xuXHRib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4uZHVwbGljYXRlLWhlYWRlci1kZXNjcmlwdGlvbiB7XG5cdG1hcmdpbi10b3A6IDRweDtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRmb250LXNpemU6IDAuOWVtO1xufVxuXG4uZHVwbGljYXRlLWhlYWRlci1hY3Rpb25zIHtcblx0ZGlzcGxheTogZmxleDtcblx0ZmxleC13cmFwOiB3cmFwO1xuXHRnYXA6IDhweDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0bWFyZ2luLXRvcDogOHB4O1xufVxuXG4uZHVwbGljYXRlLWFjdGlvbi1idXR0b24ge1xuXHRkaXNwbGF5OiBpbmxpbmUtZmxleDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0anVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG5cdGdhcDogNHB4O1xuXHRwYWRkaW5nOiA4cHggMTJweDtcblx0Ym9yZGVyOiBub25lO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0Y3Vyc29yOiBwb2ludGVyO1xuXHR0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kIDAuMnMsIGNvbG9yIDAuMnMsIG9wYWNpdHkgMC4ycztcbn1cblxuLmR1cGxpY2F0ZS1hY3Rpb24tYnV0dG9uOmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC10ZXJ0aWFyeSk7XG59XG5cbi5kdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbjpkaXNhYmxlZCB7XG5cdG9wYWNpdHk6IDAuNjtcblx0Y3Vyc29yOiB3YWl0O1xufVxuXG4uZHVwbGljYXRlLWFjdGlvbi1idXR0b24tcHJpbWFyeSB7XG5cdGJhY2tncm91bmQ6IHZhcigtLWludGVyYWN0aXZlLWFjY2VudCk7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LW9uLWFjY2VudCk7XG59XG5cbi5kdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbi1wcmltYXJ5OmhvdmVyOm5vdCg6ZGlzYWJsZWQpIHtcblx0YmFja2dyb3VuZDogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50LWhvdmVyKTtcbn1cblxuLmR1cGxpY2F0ZS10aHJlc2hvbGQtbGFiZWwge1xuXHRmb250LXNpemU6IDAuODVlbTtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xufVxuXG4uZHVwbGljYXRlLXN0YXRzLWJhciB7XG5cdGRpc3BsYXk6IGZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogMTZweDtcblx0cGFkZGluZzogMTJweCAxNnB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG5cdGJvcmRlci1yYWRpdXM6IDZweDtcblx0bWFyZ2luLWJvdHRvbTogMTZweDtcbn1cblxuLmR1cGxpY2F0ZS1zdGF0cy1jb3VudCB7XG5cdGZvbnQtd2VpZ2h0OiA2MDA7XG5cdGNvbG9yOiB2YXIoLS10ZXh0LXdhcm5pbmcpO1xufVxuXG4uZHVwbGljYXRlLWdyb3VwIHtcblx0bWFyZ2luLWJvdHRvbTogMTZweDtcblx0Ym9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuXHRib3JkZXItcmFkaXVzOiA4cHg7XG5cdG92ZXJmbG93OiBoaWRkZW47XG59XG5cbi5kdXBsaWNhdGUtZ3JvdXAtaGVhZGVyIHtcblx0ZGlzcGxheTogZmxleDtcblx0anVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuXHRwYWRkaW5nOiA4cHggMTJweDtcblx0YmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuXHRmb250LXdlaWdodDogNjAwO1xufVxuXG4uZHVwbGljYXRlLWdyb3VwLWNvdW50IHtcblx0Y29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuXHRmb250LXdlaWdodDogbm9ybWFsO1xuXHRmb250LXNpemU6IDAuODVlbTtcbn1cblxuLmR1cGxpY2F0ZS1ncm91cC1maWxlIHtcblx0ZGlzcGxheTogZmxleDtcblx0YWxpZ24taXRlbXM6IGNlbnRlcjtcblx0Z2FwOiAxMHB4O1xuXHRwYWRkaW5nOiA4cHggMTJweDtcblx0Ym9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcblx0cG9zaXRpb246IHJlbGF0aXZlO1xufVxuXG4uZHVwbGljYXRlLWtlZXAtc3VnZ2VzdGlvbiB7XG5cdGJhY2tncm91bmQ6IHJnYmEoMCwgMjAwLCA4MywgMC4wNSk7XG59XG5cbi5kdXBsaWNhdGUtZmlsZS1zdWdnZXN0aW9uIHtcblx0YmFja2dyb3VuZDogcmdiYSgyNTUsIDE1MiwgMCwgMC4wNSk7XG59XG5cbi5kdXBsaWNhdGUtZmlsZS10aHVtYm5haWwge1xuXHR3aWR0aDogNjBweDtcblx0aGVpZ2h0OiA2MHB4O1xuXHRib3JkZXItcmFkaXVzOiA2cHg7XG5cdG92ZXJmbG93OiBoaWRkZW47XG5cdGZsZXgtc2hyaW5rOiAwO1xufVxuXG4uZHVwbGljYXRlLWZpbGUtdGh1bWJuYWlsIGltZyB7XG5cdHdpZHRoOiAxMDAlO1xuXHRoZWlnaHQ6IDEwMCU7XG5cdG9iamVjdC1maXQ6IGNvdmVyO1xufVxuXG4uZHVwbGljYXRlLWZpbGUtaW5mbyB7XG5cdGZsZXg6IDE7XG5cdG1pbi13aWR0aDogMDtcbn1cblxuLmR1cGxpY2F0ZS1maWxlLW5hbWUsXG4uZHVwbGljYXRlLWZpbGUtcGF0aCB7XG5cdG92ZXJmbG93OiBoaWRkZW47XG5cdHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuXHR3aGl0ZS1zcGFjZTogbm93cmFwO1xufVxuXG4uZHVwbGljYXRlLWZpbGUtbmFtZSB7XG5cdGZvbnQtd2VpZ2h0OiA1MDA7XG59XG5cbi5kdXBsaWNhdGUtZmlsZS1wYXRoLFxuLmR1cGxpY2F0ZS1maWxlLW1ldGEge1xuXHRmb250LXNpemU6IDAuOGVtO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG59XG5cbi5kdXBsaWNhdGUtc2ltaWxhcml0eS1iYWRnZSB7XG5cdGRpc3BsYXk6IGlubGluZS1ibG9jaztcblx0cGFkZGluZzogMXB4IDZweDtcblx0Ym9yZGVyLXJhZGl1czogOHB4O1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xuXHRjb2xvcjogdmFyKC0tdGV4dC1vbi1hY2NlbnQpO1xuXHRmb250LXNpemU6IDAuNzVlbTtcblx0Zm9udC13ZWlnaHQ6IDYwMDtcbn1cblxuLmR1cGxpY2F0ZS1rZWVwLWJhZGdlIHtcblx0cG9zaXRpb246IGFic29sdXRlO1xuXHR0b3A6IDhweDtcblx0cmlnaHQ6IDEycHg7XG5cdGZvbnQtc2l6ZTogMC44NWVtO1xufVxuXG4uZHVwbGljYXRlLXF1YXJhbnRpbmUtYnRuIHtcblx0ZGlzcGxheTogaW5saW5lLWZsZXg7XG5cdGFsaWduLWl0ZW1zOiBjZW50ZXI7XG5cdGdhcDogNHB4O1xuXHRwYWRkaW5nOiA0cHggMTBweDtcblx0Ym9yZGVyLXJhZGl1czogNnB4O1xuXHRmb250LXNpemU6IDAuOGVtO1xuXHRjdXJzb3I6IHBvaW50ZXI7XG5cdGJhY2tncm91bmQ6IHJnYmEoMjU1LCAxNTIsIDAsIDAuMTUpO1xuXHRjb2xvcjogdmFyKC0tY29sb3Itb3JhbmdlLCAjZmY5ODAwKTtcblx0Ym9yZGVyOiBub25lO1xuXHRwb3NpdGlvbjogYWJzb2x1dGU7XG5cdHRvcDogOHB4O1xuXHRyaWdodDogMTJweDtcbn1cblxuLmR1cGxpY2F0ZS1xdWFyYW50aW5lLWJ0bjpob3ZlciB7XG5cdGJhY2tncm91bmQ6IHJnYmEoMjU1LCAxNTIsIDAsIDAuMyk7XG59XG5cbi8qID09PT09IFx1NTRDRFx1NUU5NFx1NUYwRlx1OEJCRVx1OEJBMSA9PT09PSAqL1xuQG1lZGlhIChtYXgtd2lkdGg6IDc2OHB4KSB7XG5cdC5pbWFnZS1saWJyYXJ5LWhlYWRlcixcblx0LnVucmVmZXJlbmNlZC1oZWFkZXIge1xuXHRcdGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG5cdFx0YWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG5cdFx0Z2FwOiAxMnB4O1xuXHR9XG5cblx0LmhlYWRlci1hY3Rpb25zIHtcblx0XHR3aWR0aDogMTAwJTtcblx0XHRqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuXHR9XG5cblx0LnVucmVmZXJlbmNlZC1pdGVtIHtcblx0XHRmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuXHRcdGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuXHR9XG5cblx0Lml0ZW0tYWN0aW9ucyB7XG5cdFx0d2lkdGg6IDEwMCU7XG5cdFx0anVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcblx0XHRtYXJnaW4tdG9wOiA4cHg7XG5cdH1cbn1gO1xuXHRcdGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGVFbCk7XG5cdH1cblxuXHRhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKTtcblx0XHRcdGNvbnN0IHNhbml0aXplZCA9IGxvYWRlZCAmJiB0eXBlb2YgbG9hZGVkID09PSAnb2JqZWN0J1xuXHRcdFx0XHQ/IE9iamVjdC5mcm9tRW50cmllcyhcblx0XHRcdFx0XHRPYmplY3QuZW50cmllcyhsb2FkZWQpLmZpbHRlcigoW2tdKSA9PlxuXHRcdFx0XHRcdFx0ayAhPT0gJ19fcHJvdG9fXycgJiYgayAhPT0gJ2NvbnN0cnVjdG9yJyAmJiBrICE9PSAncHJvdG90eXBlJ1xuXHRcdFx0XHRcdClcblx0XHRcdFx0KVxuXHRcdFx0XHQ6IHt9O1xuXHRcdFx0Y29uc3QgbWVyZ2VkID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgc2FuaXRpemVkKSBhcyBQYXJ0aWFsPEltYWdlTWFuYWdlclNldHRpbmdzPiAmIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuXHRcdFx0Y29uc3QgdG9Cb29sID0gKHZhbHVlOiB1bmtub3duLCBmYWxsYmFjazogYm9vbGVhbik6IGJvb2xlYW4gPT5cblx0XHRcdFx0dHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicgPyB2YWx1ZSA6IGZhbGxiYWNrO1xuXG5cdFx0XHRjb25zdCBpbWFnZUZvbGRlciA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh0eXBlb2YgbWVyZ2VkLmltYWdlRm9sZGVyID09PSAnc3RyaW5nJyA/IG1lcmdlZC5pbWFnZUZvbGRlciA6ICcnKTtcblx0XHRcdGNvbnN0IHRyYXNoRm9sZGVyUmF3ID0gdHlwZW9mIG1lcmdlZC50cmFzaEZvbGRlciA9PT0gJ3N0cmluZycgPyBtZXJnZWQudHJhc2hGb2xkZXIgOiBERUZBVUxUX1NFVFRJTkdTLnRyYXNoRm9sZGVyO1xuXHRcdFx0Y29uc3QgdHJhc2hGb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodHJhc2hGb2xkZXJSYXcpIHx8IERFRkFVTFRfU0VUVElOR1MudHJhc2hGb2xkZXI7XG5cblx0XHRcdHRoaXMuc2V0dGluZ3MgPSB7XG5cdFx0XHRcdC4uLkRFRkFVTFRfU0VUVElOR1MsXG5cdFx0XHRcdC4uLm1lcmdlZCxcblx0XHRcdFx0aW1hZ2VGb2xkZXIsXG5cdFx0XHRcdHRyYXNoRm9sZGVyLFxuXHRcdFx0XHR0aHVtYm5haWxTaXplOiBbJ3NtYWxsJywgJ21lZGl1bScsICdsYXJnZSddLmluY2x1ZGVzKFN0cmluZyhtZXJnZWQudGh1bWJuYWlsU2l6ZSkpXG5cdFx0XHRcdFx0PyBtZXJnZWQudGh1bWJuYWlsU2l6ZSBhcyAnc21hbGwnIHwgJ21lZGl1bScgfCAnbGFyZ2UnXG5cdFx0XHRcdFx0OiBERUZBVUxUX1NFVFRJTkdTLnRodW1ibmFpbFNpemUsXG5cdFx0XHRcdHNvcnRCeTogWyduYW1lJywgJ2RhdGUnLCAnc2l6ZSddLmluY2x1ZGVzKFN0cmluZyhtZXJnZWQuc29ydEJ5KSlcblx0XHRcdFx0XHQ/IG1lcmdlZC5zb3J0QnkgYXMgJ25hbWUnIHwgJ2RhdGUnIHwgJ3NpemUnXG5cdFx0XHRcdFx0OiBERUZBVUxUX1NFVFRJTkdTLnNvcnRCeSxcblx0XHRcdFx0c29ydE9yZGVyOiBbJ2FzYycsICdkZXNjJ10uaW5jbHVkZXMoU3RyaW5nKG1lcmdlZC5zb3J0T3JkZXIpKVxuXHRcdFx0XHRcdD8gbWVyZ2VkLnNvcnRPcmRlciBhcyAnYXNjJyB8ICdkZXNjJ1xuXHRcdFx0XHRcdDogREVGQVVMVF9TRVRUSU5HUy5zb3J0T3JkZXIsXG5cdFx0XHRcdGRlZmF1bHRBbGlnbm1lbnQ6IFsnbGVmdCcsICdjZW50ZXInLCAncmlnaHQnXS5pbmNsdWRlcyhTdHJpbmcobWVyZ2VkLmRlZmF1bHRBbGlnbm1lbnQpKVxuXHRcdFx0XHRcdD8gbWVyZ2VkLmRlZmF1bHRBbGlnbm1lbnQgYXMgJ2xlZnQnIHwgJ2NlbnRlcicgfCAncmlnaHQnXG5cdFx0XHRcdFx0OiBERUZBVUxUX1NFVFRJTkdTLmRlZmF1bHRBbGlnbm1lbnQsXG5cdFx0XHRcdGxhbmd1YWdlOiBbJ3poJywgJ2VuJywgJ3N5c3RlbSddLmluY2x1ZGVzKFN0cmluZyhtZXJnZWQubGFuZ3VhZ2UpKVxuXHRcdFx0XHRcdD8gbWVyZ2VkLmxhbmd1YWdlIGFzICd6aCcgfCAnZW4nIHwgJ3N5c3RlbSdcblx0XHRcdFx0XHQ6ICdzeXN0ZW0nLFxuXHRcdFx0XHR0cmFzaENsZWFudXBEYXlzOiBNYXRoLm1heCgxLCBNYXRoLm1pbigzNjUsIE51bWJlcihtZXJnZWQudHJhc2hDbGVhbnVwRGF5cykgfHwgREVGQVVMVF9TRVRUSU5HUy50cmFzaENsZWFudXBEYXlzKSksXG5cdFx0XHRcdHBhZ2VTaXplOiBNYXRoLm1heCgxLCBNYXRoLm1pbigxMDAwLCBOdW1iZXIobWVyZ2VkLnBhZ2VTaXplKSB8fCBERUZBVUxUX1NFVFRJTkdTLnBhZ2VTaXplKSksXG5cdFx0XHRcdHNob3dJbWFnZUluZm86IHRvQm9vbChtZXJnZWQuc2hvd0ltYWdlSW5mbywgREVGQVVMVF9TRVRUSU5HUy5zaG93SW1hZ2VJbmZvKSxcblx0XHRcdFx0YXV0b1JlZnJlc2g6IHRvQm9vbChtZXJnZWQuYXV0b1JlZnJlc2gsIERFRkFVTFRfU0VUVElOR1MuYXV0b1JlZnJlc2gpLFxuXHRcdFx0XHR1c2VUcmFzaEZvbGRlcjogdG9Cb29sKG1lcmdlZC51c2VUcmFzaEZvbGRlciwgREVGQVVMVF9TRVRUSU5HUy51c2VUcmFzaEZvbGRlciksXG5cdFx0XHRcdGF1dG9DbGVhbnVwVHJhc2g6IHRvQm9vbChtZXJnZWQuYXV0b0NsZWFudXBUcmFzaCwgREVGQVVMVF9TRVRUSU5HUy5hdXRvQ2xlYW51cFRyYXNoKSxcblx0XHRcdFx0ZW5hYmxlSW1hZ2VzOiB0b0Jvb2wobWVyZ2VkLmVuYWJsZUltYWdlcywgREVGQVVMVF9TRVRUSU5HUy5lbmFibGVJbWFnZXMpLFxuXHRcdFx0XHRlbmFibGVWaWRlb3M6IHRvQm9vbChtZXJnZWQuZW5hYmxlVmlkZW9zLCBERUZBVUxUX1NFVFRJTkdTLmVuYWJsZVZpZGVvcyksXG5cdFx0XHRcdGVuYWJsZUF1ZGlvOiB0b0Jvb2wobWVyZ2VkLmVuYWJsZUF1ZGlvLCBERUZBVUxUX1NFVFRJTkdTLmVuYWJsZUF1ZGlvKSxcblx0XHRcdFx0ZW5hYmxlUERGOiB0b0Jvb2wobWVyZ2VkLmVuYWJsZVBERiwgREVGQVVMVF9TRVRUSU5HUy5lbmFibGVQREYpLFxuXHRcdFx0XHRlbmFibGVQcmV2aWV3TW9kYWw6IHRvQm9vbChtZXJnZWQuZW5hYmxlUHJldmlld01vZGFsLCBERUZBVUxUX1NFVFRJTkdTLmVuYWJsZVByZXZpZXdNb2RhbCksXG5cdFx0XHRcdGVuYWJsZUtleWJvYXJkTmF2OiB0b0Jvb2wobWVyZ2VkLmVuYWJsZUtleWJvYXJkTmF2LCBERUZBVUxUX1NFVFRJTkdTLmVuYWJsZUtleWJvYXJkTmF2KSxcblx0XHRcdFx0Ly8gXHU2NUIwXHU1ODlFXHU4QkJFXHU3RjZFXHU1QjU3XHU2QkI1XG5cdFx0XHRcdHNhZmVTY2FuRW5hYmxlZDogdG9Cb29sKG1lcmdlZC5zYWZlU2NhbkVuYWJsZWQsIERFRkFVTFRfU0VUVElOR1Muc2FmZVNjYW5FbmFibGVkKSxcblx0XHRcdFx0c2FmZVNjYW5VbnJlZkRheXM6IE1hdGgubWF4KDEsIE1hdGgubWluKDM2NSwgTnVtYmVyKG1lcmdlZC5zYWZlU2NhblVucmVmRGF5cykgfHwgREVGQVVMVF9TRVRUSU5HUy5zYWZlU2NhblVucmVmRGF5cykpLFxuXHRcdFx0XHRzYWZlU2Nhbk1pblNpemU6IE1hdGgubWF4KDAsIE51bWJlcihtZXJnZWQuc2FmZVNjYW5NaW5TaXplKSB8fCBERUZBVUxUX1NFVFRJTkdTLnNhZmVTY2FuTWluU2l6ZSksXG5cdFx0XHRcdGR1cGxpY2F0ZVRocmVzaG9sZDogTWF0aC5tYXgoNTAsIE1hdGgubWluKDEwMCwgTnVtYmVyKG1lcmdlZC5kdXBsaWNhdGVUaHJlc2hvbGQpIHx8IERFRkFVTFRfU0VUVElOR1MuZHVwbGljYXRlVGhyZXNob2xkKSksXG5cdFx0XHRcdG9yZ2FuaXplUnVsZXM6IEFycmF5LmlzQXJyYXkobWVyZ2VkLm9yZ2FuaXplUnVsZXMpID8gbWVyZ2VkLm9yZ2FuaXplUnVsZXMgOiBERUZBVUxUX1NFVFRJTkdTLm9yZ2FuaXplUnVsZXMsXG5cdFx0XHRcdGRlZmF1bHRQcm9jZXNzUXVhbGl0eTogTWF0aC5tYXgoMSwgTWF0aC5taW4oMTAwLCBOdW1iZXIobWVyZ2VkLmRlZmF1bHRQcm9jZXNzUXVhbGl0eSkgfHwgREVGQVVMVF9TRVRUSU5HUy5kZWZhdWx0UHJvY2Vzc1F1YWxpdHkpKSxcblx0XHRcdFx0ZGVmYXVsdFByb2Nlc3NGb3JtYXQ6IFsnd2VicCcsICdqcGVnJywgJ3BuZyddLmluY2x1ZGVzKFN0cmluZyhtZXJnZWQuZGVmYXVsdFByb2Nlc3NGb3JtYXQpKVxuXHRcdFx0XHRcdD8gbWVyZ2VkLmRlZmF1bHRQcm9jZXNzRm9ybWF0IGFzICd3ZWJwJyB8ICdqcGVnJyB8ICdwbmcnXG5cdFx0XHRcdFx0OiBERUZBVUxUX1NFVFRJTkdTLmRlZmF1bHRQcm9jZXNzRm9ybWF0LFxuXHRcdFx0XHR3YXRlcm1hcmtUZXh0OiB0eXBlb2YgbWVyZ2VkLndhdGVybWFya1RleHQgPT09ICdzdHJpbmcnID8gbWVyZ2VkLndhdGVybWFya1RleHQgOiBERUZBVUxUX1NFVFRJTkdTLndhdGVybWFya1RleHRcblx0XHRcdH07XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTJBMFx1OEY3RFx1OEJCRVx1N0Y2RVx1NTkzMVx1OEQyNVx1RkYwQ1x1NEY3Rlx1NzUyOFx1OUVEOFx1OEJBNFx1OEJCRVx1N0Y2RTonLCBlcnJvcik7XG5cdFx0XHR0aGlzLnNldHRpbmdzID0geyAuLi5ERUZBVUxUX1NFVFRJTkdTIH07XG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuXHRcdHRoaXMuc2V0dGluZ3MuaW1hZ2VGb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodGhpcy5zZXR0aW5ncy5pbWFnZUZvbGRlcik7XG5cdFx0dGhpcy5zZXR0aW5ncy50cmFzaEZvbGRlciA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh0aGlzLnNldHRpbmdzLnRyYXNoRm9sZGVyKSB8fCBERUZBVUxUX1NFVFRJTkdTLnRyYXNoRm9sZGVyO1xuXHRcdGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG5cdFx0YXdhaXQgdGhpcy5zeW5jUGVyZm9ybWFuY2VJbmZyYVNldHRpbmdzKCk7XG5cdFx0dGhpcy5jbGVhckNhY2hlKCk7XG5cdFx0dGhpcy5zY2hlZHVsZVJlZnJlc2hPcGVuVmlld3MoMTUwKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMDVcdTk2NjRcdTVGMTVcdTc1MjhcdTdGMTNcdTVCNThcblx0ICogXHU1RjUzXHU4QkJFXHU3RjZFXHU1M0Q4XHU2NkY0XHU1RjcxXHU1NENEXHU3RjEzXHU1QjU4XHU2NzA5XHU2NTQ4XHU2MDI3XHU2NUY2XHU4QzAzXHU3NTI4XG5cdCAqL1xuXHRjbGVhckNhY2hlKCkge1xuXHRcdHRoaXMucmVmZXJlbmNlZEltYWdlc0NhY2hlID0gbnVsbDtcblx0XHR0aGlzLmNhY2hlVGltZXN0YW1wID0gMDtcblx0fVxuXG5cdGFzeW5jIG9wZW5JbWFnZUxpYnJhcnkoKSB7XG5cdFx0Y29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuXG5cdFx0bGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9JTUFHRV9MSUJSQVJZKVswXTtcblx0XHRpZiAoIWxlYWYpIHtcblx0XHRcdGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZigndGFiJyk7XG5cdFx0XHRhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG5cdFx0XHRcdHR5cGU6IFZJRVdfVFlQRV9JTUFHRV9MSUJSQVJZLFxuXHRcdFx0XHRhY3RpdmU6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0XHR3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcblx0fVxuXG5cdGFzeW5jIGZpbmRVbnJlZmVyZW5jZWRJbWFnZXMoKSB7XG5cdFx0Y29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuXG5cdFx0bGV0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9VTlJFRkVSRU5DRURfSU1BR0VTKVswXTtcblx0XHRpZiAoIWxlYWYpIHtcblx0XHRcdGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZigndGFiJyk7XG5cdFx0XHRhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7XG5cdFx0XHRcdHR5cGU6IFZJRVdfVFlQRV9VTlJFRkVSRU5DRURfSU1BR0VTLFxuXHRcdFx0XHRhY3RpdmU6IHRydWVcblx0XHRcdH0pO1xuXHRcdH1cblx0XHR3b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTtcblx0fVxuXG5cdC8vIFx1ODNCN1x1NTNENlx1NjI0MFx1NjcwOVx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1RkYwOFx1NTZGRVx1NzI0N1x1MzAwMVx1OTdGM1x1ODlDNlx1OTg5MVx1MzAwMVx1NjU4N1x1Njg2M1x1RkYwOVxuXHRhc3luYyBnZXRBbGxJbWFnZUZpbGVzKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuXHRcdC8vIFx1NEVDRVx1OEJCRVx1N0Y2RVx1NEUyRFx1ODNCN1x1NTNENlx1NTQyRlx1NzUyOFx1NzY4NFx1NjI2OVx1NUM1NVx1NTQwRFxuXHRcdGNvbnN0IGVuYWJsZWRFeHRlbnNpb25zID0gZ2V0RW5hYmxlZEV4dGVuc2lvbnMoe1xuXHRcdFx0ZW5hYmxlSW1hZ2VzOiB0aGlzLnNldHRpbmdzLmVuYWJsZUltYWdlcyxcblx0XHRcdGVuYWJsZVZpZGVvczogdGhpcy5zZXR0aW5ncy5lbmFibGVWaWRlb3MsXG5cdFx0XHRlbmFibGVBdWRpbzogdGhpcy5zZXR0aW5ncy5lbmFibGVBdWRpbyxcblx0XHRcdGVuYWJsZVBERjogdGhpcy5zZXR0aW5ncy5lbmFibGVQREZcblx0XHR9KTtcblxuXHRcdC8vIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NjI0MFx1NjcwOVx1NUE5Mlx1NEY1M1x1N0M3Qlx1NTc4Qlx1OTBGRFx1ODhBQlx1Nzk4MVx1NzUyOFxuXHRcdGlmIChlbmFibGVkRXh0ZW5zaW9ucy5sZW5ndGggPT09IDApIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy50KCdhbGxNZWRpYVR5cGVzRGlzYWJsZWQnKSk7XG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fVxuXG5cdFx0Y29uc3QgYWxsRmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlcygpO1xuXHRcdHJldHVybiBhbGxGaWxlcy5maWx0ZXIoZmlsZSA9PlxuXHRcdFx0ZW5hYmxlZEV4dGVuc2lvbnMuc29tZShleHQgPT4gZmlsZS5uYW1lLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoZXh0KSlcblx0XHQpO1xuXHR9XG5cblx0Ly8gXHU4M0I3XHU1M0Q2XHU2MjQwXHU2NzA5XHU1NkZFXHU3MjQ3XHU2NTg3XHU0RUY2XHVGRjA4XHU0RkREXHU3NTU5XHU1MTdDXHU1QkI5XHU2MDI3XHVGRjA5XG5cdGFzeW5jIGdldEFsbE1lZGlhRmlsZXMoKTogUHJvbWlzZTxURmlsZVtdPiB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0QWxsSW1hZ2VGaWxlcygpO1xuXHR9XG5cblx0Ly8gXHU4M0I3XHU1M0Q2XHU2MjQwXHU2NzA5TWFya2Rvd25cdTY1ODdcdTRFRjZcdTRFMkRcdTVGMTVcdTc1MjhcdTc2ODRcdTU2RkVcdTcyNDdcblx0YXN5bmMgZ2V0UmVmZXJlbmNlZEltYWdlcyhzaWduYWw/OiBBYm9ydFNpZ25hbCk6IFByb21pc2U8U2V0PHN0cmluZz4+IHtcblx0XHRjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuXG5cdFx0Ly8gXHU2OEMwXHU2N0U1XHU3RjEzXHU1QjU4XHU2NjJGXHU1NDI2XHU2NzA5XHU2NTQ4XG5cdFx0aWYgKHRoaXMucmVmZXJlbmNlZEltYWdlc0NhY2hlICYmIChub3cgLSB0aGlzLmNhY2hlVGltZXN0YW1wKSA8IEltYWdlTWFuYWdlclBsdWdpbi5DQUNIRV9EVVJBVElPTikge1xuXHRcdFx0cmV0dXJuIHRoaXMucmVmZXJlbmNlZEltYWdlc0NhY2hlO1xuXHRcdH1cblxuXHRcdC8vIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NURGMlx1NEUyRFx1NkI2MlxuXHRcdGlmIChzaWduYWw/LmFib3J0ZWQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignU2NhbiBjYW5jZWxsZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCByZWZlcmVuY2VkID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cdFx0Y29uc3QgeyB2YXVsdCB9ID0gdGhpcy5hcHA7XG5cdFx0Y29uc3QgZW5hYmxlZEV4dGVuc2lvbnMgPSBnZXRFbmFibGVkRXh0ZW5zaW9ucyh7XG5cdFx0XHRlbmFibGVJbWFnZXM6IHRoaXMuc2V0dGluZ3MuZW5hYmxlSW1hZ2VzLFxuXHRcdFx0ZW5hYmxlVmlkZW9zOiB0aGlzLnNldHRpbmdzLmVuYWJsZVZpZGVvcyxcblx0XHRcdGVuYWJsZUF1ZGlvOiB0aGlzLnNldHRpbmdzLmVuYWJsZUF1ZGlvLFxuXHRcdFx0ZW5hYmxlUERGOiB0aGlzLnNldHRpbmdzLmVuYWJsZVBERlxuXHRcdH0pO1xuXHRcdGNvbnN0IGV4dGVuc2lvblBhdHRlcm4gPSBlbmFibGVkRXh0ZW5zaW9ucy5tYXAoZXh0ID0+IGV4dC5zbGljZSgxKSkuam9pbignfCcpO1xuXG5cdFx0aWYgKCFleHRlbnNpb25QYXR0ZXJuKSB7XG5cdFx0XHR0aGlzLnJlZmVyZW5jZWRJbWFnZXNDYWNoZSA9IHJlZmVyZW5jZWQ7XG5cdFx0XHR0aGlzLmNhY2hlVGltZXN0YW1wID0gbm93O1xuXHRcdFx0cmV0dXJuIHJlZmVyZW5jZWQ7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgd2lraUxpbmtQYXR0ZXJuU291cmNlID0gYFxcXFxbXFxcXFsoW15cXFxcXXxdK1xcXFwuKD86JHtleHRlbnNpb25QYXR0ZXJufSkpKD86XFxcXHxbXlxcXFxdXSopP1xcXFxdXFxcXF1gO1xuXHRcdGNvbnN0IG1hcmtkb3duTGlua1BhdHRlcm5Tb3VyY2UgPSBgIT9cXFxcW1teXFxcXF1dKlxcXFxdXFxcXCgoW14pXStcXFxcLig/OiR7ZXh0ZW5zaW9uUGF0dGVybn0pKD86XFxcXD9bXikjXSopPyg/OiNbXildKyk/KVxcXFwpYDtcblx0XHRjb25zdCBhZGRSZWZlcmVuY2VkUGF0aCA9IChyYXdQYXRoOiBzdHJpbmcsIHNvdXJjZUZpbGVQYXRoOiBzdHJpbmcpID0+IHtcblx0XHRcdGlmICghcmF3UGF0aCkgcmV0dXJuO1xuXG5cdFx0XHRsZXQgY2FuZGlkYXRlID0gcmF3UGF0aC50cmltKCk7XG5cdFx0XHRpZiAoY2FuZGlkYXRlLnN0YXJ0c1dpdGgoJzwnKSAmJiBjYW5kaWRhdGUuZW5kc1dpdGgoJz4nKSkge1xuXHRcdFx0XHRjYW5kaWRhdGUgPSBjYW5kaWRhdGUuc2xpY2UoMSwgLTEpLnRyaW0oKTtcblx0XHRcdH1cblxuXHRcdFx0Y2FuZGlkYXRlID0gY2FuZGlkYXRlLnJlcGxhY2UoL1xcXFwgL2csICcgJyk7XG5cdFx0XHRjYW5kaWRhdGUgPSBzYWZlRGVjb2RlVVJJQ29tcG9uZW50KGNhbmRpZGF0ZSk7XG5cblx0XHRcdGlmICgvXlthLXpdW2EtejAtOSsuLV0qOi9pLnRlc3QoY2FuZGlkYXRlKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IFt3aXRob3V0UXVlcnldID0gY2FuZGlkYXRlLnNwbGl0KC9bPyNdLyk7XG5cdFx0XHRjb25zdCBub3JtYWxpemVkQ2FuZGlkYXRlID0gbm9ybWFsaXplVmF1bHRQYXRoKHdpdGhvdXRRdWVyeSk7XG5cdFx0XHRjb25zdCByZXNvbHZlZEZpbGUgPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpcnN0TGlua3BhdGhEZXN0KFxuXHRcdFx0XHRub3JtYWxpemVkQ2FuZGlkYXRlIHx8IHdpdGhvdXRRdWVyeSxcblx0XHRcdFx0c291cmNlRmlsZVBhdGhcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBub3JtYWxpemVkID0gcmVzb2x2ZWRGaWxlXG5cdFx0XHRcdD8gbm9ybWFsaXplVmF1bHRQYXRoKHJlc29sdmVkRmlsZS5wYXRoKS50b0xvd2VyQ2FzZSgpXG5cdFx0XHRcdDogbm9ybWFsaXplZENhbmRpZGF0ZS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0XHRpZiAoIW5vcm1hbGl6ZWQpIHJldHVybjtcblx0XHRcdHJlZmVyZW5jZWQuYWRkKG5vcm1hbGl6ZWQpO1xuXHRcdH07XG5cblx0XHQvLyBcdTRGN0ZcdTc1MjhcdTZCNjNcdTUyMTlcdTYyNkJcdTYzQ0ZcdTYyNDBcdTY3MDkgTWFya2Rvd24gXHU2NTg3XHU0RUY2XG5cdFx0Y29uc3QgbWFya2Rvd25GaWxlcyA9IHZhdWx0LmdldEZpbGVzKCkuZmlsdGVyKGYgPT4gZi5leHRlbnNpb24gPT09ICdtZCcpO1xuXHRcdGNvbnN0IHRvdGFsRmlsZXMgPSBtYXJrZG93bkZpbGVzLmxlbmd0aDtcblxuXHRcdC8vIFx1NjI2Qlx1NjNDRlx1OEQ4NVx1NjVGNlx1NEZERFx1NjJBNFx1RkYwOFx1OUVEOFx1OEJBNCA1IFx1NTIwNlx1OTQ5Rlx1RkYwOVxuXHRcdGNvbnN0IFNDQU5fVElNRU9VVCA9IDUgKiA2MCAqIDEwMDA7XG5cdFx0Y29uc3Qgc2NhblN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cdFx0bGV0IHRpbWVvdXRJZDogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcblxuXHRcdC8vIFx1NTk4Mlx1Njc5Q1x1NEYyMFx1NTE2NVx1NEU4Nlx1NTkxNlx1OTBFOCBzaWduYWxcdUZGMENcdTUyMTlcdTRFMERcdThCQkVcdTdGNkVcdTUxODVcdTkwRThcdThEODVcdTY1RjZcblx0XHRpZiAoIXNpZ25hbCkge1xuXHRcdFx0dGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUud2FybignU2NhbiB0aW1lb3V0IHJlYWNoZWQsIHJldHVybmluZyBwYXJ0aWFsIHJlc3VsdHMnKTtcblx0XHRcdH0sIFNDQU5fVElNRU9VVCk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU3NkQxXHU1NDJDXHU1OTE2XHU5MEU4XHU0RTJEXHU2QjYyXHU0RkUxXHU1M0Y3XG5cdFx0aWYgKHNpZ25hbCkge1xuXHRcdFx0c2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0JywgKCkgPT4ge1xuXHRcdFx0XHRpZiAodGltZW91dElkKSB7XG5cdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc29sZS53YXJuKCdTY2FuIGFib3J0ZWQgYnkgZXh0ZXJuYWwgc2lnbmFsJyk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBcdTVCRjlcdTRFOEVcdTU5MjdcdTU3OEIgVmF1bHRcdUZGMENcdTY2M0VcdTc5M0FcdTVGMDBcdTU5Q0JcdTYyNkJcdTYzQ0ZcdTkwMUFcdTc3RTVcblx0XHQvLyBcdTZDRThcdTYxMEZcdUZGMUFPYnNpZGlhbiBcdTc2ODQgTm90aWNlIFx1NEUwRFx1NjUyRlx1NjMwMVx1NTJBOFx1NjAwMVx1NjZGNFx1NjVCMFx1RkYwQ1x1NkJDRlx1NkIyMSBzZXRNZXNzYWdlKCkgXHU0RjFBXHU1MjFCXHU1RUZBXHU2NUIwXHU3Njg0IE5vdGljZVxuXHRcdC8vIFx1NTZFMFx1NkI2NFx1NjIxMVx1NEVFQ1x1NTNFQVx1NTcyOFx1NUYwMFx1NTlDQlx1NjVGNlx1NjYzRVx1NzkzQVx1NEUwMFx1NEUyQVx1OTAxQVx1NzdFNVx1RkYwQ1x1NjI2Qlx1NjNDRlx1NUI4Q1x1NjIxMFx1NTQwRVx1NzUyOFx1NjVCMFx1NzY4NFx1OTAxQVx1NzdFNVx1NjZGRlx1NjM2MlxuXHRcdGxldCBzY2FuTm90aWNlOiBOb3RpY2UgfCBudWxsID0gbnVsbDtcblx0XHRpZiAodG90YWxGaWxlcyA+IDEwMCkge1xuXHRcdFx0c2Nhbk5vdGljZSA9IG5ldyBOb3RpY2UodGhpcy50KCdzY2FubmluZ1JlZmVyZW5jZXMnKSArIGAgKDAvJHt0b3RhbEZpbGVzfSlgLCAwKTtcblx0XHR9XG5cblx0XHQvLyBcdTUyMDZcdTYyNzlcdTU5MDRcdTc0MDZcdTRFRTVcdTkwN0ZcdTUxNERcdTk2M0JcdTU4NUUgVUlcblx0XHRjb25zdCBCQVRDSF9TSVpFID0gMjA7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBtYXJrZG93bkZpbGVzLmxlbmd0aDsgaSArPSBCQVRDSF9TSVpFKSB7XG5cdFx0XHQvLyBcdTY4QzBcdTY3RTVcdThEODVcdTY1RjZcdTYyMTZcdTRFMkRcdTZCNjJcblx0XHRcdGlmIChEYXRlLm5vdygpIC0gc2NhblN0YXJ0VGltZSA+IFNDQU5fVElNRU9VVCkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1NjYW4gdGltZW91dCByZWFjaGVkLCByZXR1cm5pbmcgcGFydGlhbCByZXN1bHRzJyk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNpZ25hbD8uYWJvcnRlZCkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1NjYW4gYWJvcnRlZCcpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgYmF0Y2ggPSBtYXJrZG93bkZpbGVzLnNsaWNlKGksIGkgKyBCQVRDSF9TSVpFKTtcblxuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoYmF0Y2gubWFwKGFzeW5jIChmaWxlKSA9PiB7XG5cdFx0XHRcdC8vIFx1NjhDMFx1NjdFNVx1NEUyRFx1NkI2Mlx1NEZFMVx1NTNGN1xuXHRcdFx0XHRpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IGNvbnRlbnQ6IHN0cmluZztcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRjb250ZW50ID0gYXdhaXQgdmF1bHQucmVhZChmaWxlKTtcblx0XHRcdFx0fSBjYXRjaCB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3Qgd2lraUxpbmtQYXR0ZXJuID0gbmV3IFJlZ0V4cCh3aWtpTGlua1BhdHRlcm5Tb3VyY2UsICdnaScpO1xuXHRcdFx0XHRjb25zdCBtYXJrZG93bkxpbmtQYXR0ZXJuID0gbmV3IFJlZ0V4cChtYXJrZG93bkxpbmtQYXR0ZXJuU291cmNlLCAnZ2knKTtcblx0XHRcdFx0bGV0IG1hdGNoO1xuXG5cdFx0XHRcdC8vIFx1NTMzOVx1OTE0RCBXaWtpIFx1OTRGRVx1NjNBNVx1RkYwOFx1NTQyQlx1NUUyNlx1NTIyQlx1NTQwRFx1NzY4NFx1RkYwOVxuXHRcdFx0XHR3aGlsZSAoKG1hdGNoID0gd2lraUxpbmtQYXR0ZXJuLmV4ZWMoY29udGVudCkpICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0YWRkUmVmZXJlbmNlZFBhdGgobWF0Y2hbMV0sIGZpbGUucGF0aCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBcdTUzMzlcdTkxNEQgTWFya2Rvd24gXHU5NEZFXHU2M0E1XHVGRjA4XHU1NkZFXHU3MjQ3L1x1OTdGM1x1ODlDNlx1OTg5MS9cdTY1ODdcdTY4NjNcdUZGMDlcblx0XHRcdFx0d2hpbGUgKChtYXRjaCA9IG1hcmtkb3duTGlua1BhdHRlcm4uZXhlYyhjb250ZW50KSkgIT09IG51bGwpIHtcblx0XHRcdFx0XHRhZGRSZWZlcmVuY2VkUGF0aChtYXRjaFsxXSwgZmlsZS5wYXRoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSkpO1xuXG5cdFx0XHQvLyBcdTY2RjRcdTY1QjBcdTYyNkJcdTYzQ0ZcdThGREJcdTVFQTZcdTkwMUFcdTc3RTVcblx0XHRcdGlmIChzY2FuTm90aWNlICYmIGkgJSAoQkFUQ0hfU0laRSAqIDUpID09PSAwKSB7XG5cdFx0XHRcdHNjYW5Ob3RpY2UuaGlkZSgpO1xuXHRcdFx0XHRzY2FuTm90aWNlID0gbmV3IE5vdGljZSh0aGlzLnQoJ3NjYW5uaW5nUmVmZXJlbmNlcycpICsgYCAoJHtNYXRoLm1pbihpICsgQkFUQ0hfU0laRSwgdG90YWxGaWxlcyl9LyR7dG90YWxGaWxlc30pYCwgMCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFx1OEJBOSBVSSBcdTY3MDlcdTY3M0FcdTRGMUFcdTY2RjRcdTY1QjBcblx0XHRcdGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAwKSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU2RTA1XHU3NDA2XHU4RDg1XHU2NUY2XHU1QjlBXHU2NUY2XHU1NjY4XG5cdFx0aWYgKHRpbWVvdXRJZCkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU2MjZCXHU2M0NGXHU1QjhDXHU2MjEwXHVGRjBDXHU2NjNFXHU3OTNBXHU1QjhDXHU2MjEwXHU5MDFBXHU3N0U1XG5cdFx0Ly8gXHU2Q0U4XHU2MTBGXHVGRjFBXHU0RTBEXHU0RjdGXHU3NTI4IHNldE1lc3NhZ2UoKVx1RkYwQ1x1NTZFMFx1NEUzQVx1NUI4M1x1NEYxQVx1NTIxQlx1NUVGQVx1NjVCMFx1NzY4NCBOb3RpY2Vcblx0XHRpZiAoc2Nhbk5vdGljZSkge1xuXHRcdFx0c2Nhbk5vdGljZS5oaWRlKCk7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnc2NhbkNvbXBsZXRlJykgKyBgICgke3RvdGFsRmlsZXN9ICR7dGhpcy50KCdmaWxlc1NjYW5uZWQnKX0pYCk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU2NkY0XHU2NUIwXHU3RjEzXHU1QjU4XG5cdFx0dGhpcy5yZWZlcmVuY2VkSW1hZ2VzQ2FjaGUgPSByZWZlcmVuY2VkO1xuXHRcdHRoaXMuY2FjaGVUaW1lc3RhbXAgPSBub3c7XG5cblx0XHRyZXR1cm4gcmVmZXJlbmNlZDtcblx0fVxuXG5cdC8vIFx1NjdFNVx1NjI3RVx1NjcyQVx1NUYxNVx1NzUyOFx1NzY4NFx1NTZGRVx1NzI0N1xuXHRhc3luYyBmaW5kVW5yZWZlcmVuY2VkKCk6IFByb21pc2U8VEZpbGVbXT4ge1xuXHRcdGNvbnN0IGFsbEltYWdlcyA9IGF3YWl0IHRoaXMuZ2V0QWxsSW1hZ2VGaWxlcygpO1xuXHRcdGNvbnN0IHJlZmVyZW5jZWQgPSBhd2FpdCB0aGlzLmdldFJlZmVyZW5jZWRJbWFnZXMoKTtcblxuXHRcdHJldHVybiBhbGxJbWFnZXMuZmlsdGVyKGZpbGUgPT4ge1xuXHRcdFx0Y29uc3QgZmlsZVBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoZmlsZS5wYXRoKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0cmV0dXJuICFyZWZlcmVuY2VkLmhhcyhmaWxlUGF0aCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBcdTYyNEJcdTUyQThcdTUyMzdcdTY1QjBcdTdGMTNcdTVCNThcblx0YXN5bmMgcmVmcmVzaENhY2hlKCkge1xuXHRcdC8vIFx1NkUwNVx1OTY2NFx1N0YxM1x1NUI1OFxuXHRcdHRoaXMucmVmZXJlbmNlZEltYWdlc0NhY2hlID0gbnVsbDtcblx0XHR0aGlzLmNhY2hlVGltZXN0YW1wID0gMDtcblxuXHRcdC8vIFx1OTFDRFx1NjVCMFx1ODNCN1x1NTNENlx1NUYxNVx1NzUyOFxuXHRcdGF3YWl0IHRoaXMuZ2V0UmVmZXJlbmNlZEltYWdlcygpO1xuXG5cdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3NjYW5Db21wbGV0ZScpKTtcblx0fVxuXG5cdC8vIFx1NjI1M1x1NUYwMFx1NTZGRVx1NzI0N1x1NjI0MFx1NTcyOFx1NzY4NFx1N0IxNFx1OEJCMFxuXHRhc3luYyBvcGVuSW1hZ2VJbk5vdGVzKGltYWdlRmlsZTogVEZpbGUpIHtcblx0XHRjb25zdCB7IHdvcmtzcGFjZSwgdmF1bHQgfSA9IHRoaXMuYXBwO1xuXHRcdGNvbnN0IHJlc3VsdHM6IHsgZmlsZTogVEZpbGU7IGxpbmU6IG51bWJlciB9W10gPSBbXTtcblx0XHRjb25zdCBpbWFnZU5hbWUgPSBpbWFnZUZpbGUubmFtZTtcblxuXHRcdC8vIFx1NEY3Rlx1NzUyOFx1NkI2M1x1NTIxOVx1NjI2Qlx1NjNDRlx1NjI0MFx1NjcwOSBNYXJrZG93biBcdTY1ODdcdTRFRjZcblx0XHRjb25zdCBtYXJrZG93bkZpbGVzID0gdmF1bHQuZ2V0RmlsZXMoKS5maWx0ZXIoZiA9PiBmLmV4dGVuc2lvbiA9PT0gJ21kJyk7XG5cblx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgbWFya2Rvd25GaWxlcykge1xuXHRcdFx0bGV0IGNvbnRlbnQ6IHN0cmluZztcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnRlbnQgPSBhd2FpdCB2YXVsdC5yZWFkKGZpbGUpO1xuXHRcdFx0fSBjYXRjaCB7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KCdcXG4nKTtcblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zdCBsaW5lID0gbGluZXNbaV07XG5cdFx0XHRcdC8vIFx1NEY3Rlx1NzUyOFx1NjZGNFx1N0NCRVx1Nzg2RVx1NzY4NFx1NTMzOVx1OTE0RFx1RkYxQVx1NTMzOVx1OTE0RFx1NTZGRVx1NzI0N1x1OTRGRVx1NjNBNVx1NjgzQ1x1NUYwRlxuXHRcdFx0XHRpZiAobGluZS5pbmNsdWRlcyhpbWFnZU5hbWUpICYmXG5cdFx0XHRcdFx0KGxpbmUuaW5jbHVkZXMoJ1tbJykgfHwgbGluZS5pbmNsdWRlcygnIVsnKSB8fCBsaW5lLmluY2x1ZGVzKCddKCcpKSkge1xuXHRcdFx0XHRcdHJlc3VsdHMucHVzaCh7IGZpbGUsIGxpbmU6IGkgKyAxIH0pO1xuXHRcdFx0XHRcdGJyZWFrOyAvLyBcdTZCQ0ZcdTRFMkFcdTY1ODdcdTRFRjZcdTUzRUFcdTUzRDZcdTdCMkNcdTRFMDBcdTRFMkFcdTUzMzlcdTkxNERcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcblx0XHRcdGNvbnN0IHJlc3VsdCA9IHJlc3VsdHNbMF07XG5cdFx0XHQvLyBcdTYyNTNcdTVGMDBcdTY1ODdcdTRFRjZcdTVFNzZcdThERjNcdThGNkNcdTUyMzBcdTYzMDdcdTVCOUFcdTg4NENcblx0XHRcdGNvbnN0IGxlYWYgPSB3b3Jrc3BhY2UuZ2V0TGVhZigndGFiJyk7XG5cdFx0XHRhd2FpdCBsZWFmLm9wZW5GaWxlKHJlc3VsdC5maWxlKTtcblxuXHRcdFx0Ly8gXHU1QzFEXHU4QkQ1XHU4REYzXHU4RjZDXHU1MjMwXHU1MTc3XHU0RjUzXHU4ODRDXG5cdFx0XHRpZiAocmVzdWx0LmxpbmUgPiAxKSB7XG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHZpZXcgPSB3b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuXHRcdFx0XHRcdGlmICh2aWV3KSB7XG5cdFx0XHRcdFx0XHRjb25zdCBlZGl0b3IgPSB2aWV3LmVkaXRvcjtcblx0XHRcdFx0XHRcdGVkaXRvci5zZXRDdXJzb3IoeyBjaDogMCwgbGluZTogcmVzdWx0LmxpbmUgLSAxIH0pO1xuXHRcdFx0XHRcdFx0ZWRpdG9yLnNjcm9sbEludG9WaWV3KHsgZnJvbTogeyBjaDogMCwgbGluZTogcmVzdWx0LmxpbmUgLSAxIH0sIHRvOiB7IGNoOiAwLCBsaW5lOiByZXN1bHQubGluZSAtIDEgfSB9LCB0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIDEwMCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy50KCdub3RSZWZlcmVuY2VkJykpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTc1MUZcdTYyMTBcdTUzRUZcdTdBMzNcdTVCOUFcdTg5RTNcdTY3OTBcdTc2ODQgV2lraSBcdTk0RkVcdTYzQTVcdUZGMDhcdTU0MENcdTU0MERcdTUxQjJcdTdBODFcdTY1RjZcdTgxRUFcdTUyQThcdTRGN0ZcdTc1MjhcdThERUZcdTVGODRcdUZGMDlcblx0ICovXG5cdGdldFN0YWJsZVdpa2lMaW5rKGZpbGU6IFRGaWxlKTogc3RyaW5nIHtcblx0XHRjb25zdCBub3JtYWxpemVkUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChmaWxlLnBhdGgpIHx8IGZpbGUucGF0aDtcblx0XHRjb25zdCBub3JtYWxpemVkUGF0aExvd2VyID0gbm9ybWFsaXplZFBhdGgudG9Mb3dlckNhc2UoKTtcblx0XHRjb25zdCBsb3dlck5hbWUgPSBmaWxlLm5hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRjb25zdCBoYXNOYW1lQ29sbGlzaW9uID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZXMoKS5zb21lKGNhbmRpZGF0ZSA9PlxuXHRcdFx0Y2FuZGlkYXRlLnBhdGggIT09IGZpbGUucGF0aCAmJlxuXHRcdFx0Y2FuZGlkYXRlLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbG93ZXJOYW1lICYmXG5cdFx0XHQobm9ybWFsaXplVmF1bHRQYXRoKGNhbmRpZGF0ZS5wYXRoKSB8fCBjYW5kaWRhdGUucGF0aCkudG9Mb3dlckNhc2UoKSAhPT0gbm9ybWFsaXplZFBhdGhMb3dlclxuXHRcdCk7XG5cdFx0Y29uc3QgbGlua1BhdGggPSBoYXNOYW1lQ29sbGlzaW9uID8gbm9ybWFsaXplZFBhdGggOiBmaWxlLm5hbWU7XG5cdFx0cmV0dXJuIGBbWyR7bGlua1BhdGh9XV1gO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1OTAxQVx1OEZDN1x1N0NGQlx1N0VERlx1OUVEOFx1OEJBNFx1N0EwQlx1NUU4Rlx1NjI1M1x1NUYwMFx1NTM5Rlx1NjU4N1x1NEVGNlx1RkYwOFx1Njg0Q1x1OTc2Mlx1N0FFRlx1NEYxOFx1NTE0OFx1RkYwOVxuXHQgKi9cblx0YXN5bmMgb3Blbk9yaWdpbmFsRmlsZShmaWxlOiBURmlsZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IGFwcExpa2UgPSB0aGlzLmFwcCBhcyB1bmtub3duIGFzIHtcblx0XHRcdG9wZW5XaXRoRGVmYXVsdEFwcD86IChwYXRoOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD4gfCB2b2lkO1xuXHRcdH07XG5cblx0XHR0cnkge1xuXHRcdFx0aWYgKHR5cGVvZiBhcHBMaWtlLm9wZW5XaXRoRGVmYXVsdEFwcCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRhd2FpdCBhcHBMaWtlLm9wZW5XaXRoRGVmYXVsdEFwcChmaWxlLnBhdGgpO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS53YXJuKCdvcGVuV2l0aERlZmF1bHRBcHAgXHU1OTMxXHU4RDI1XHVGRjBDXHU1QzFEXHU4QkQ1XHU1NkRFXHU5MDAwXHU2NUI5XHU2ODQ4OicsIGVycm9yKTtcblx0XHR9XG5cblx0XHRjb25zdCBhZGFwdGVyID0gdGhpcy5hcHAudmF1bHQuYWRhcHRlciBhcyB1bmtub3duIGFzIHtcblx0XHRcdGdldEZ1bGxQYXRoPzogKHBhdGg6IHN0cmluZykgPT4gc3RyaW5nO1xuXHRcdH07XG5cdFx0Y29uc3QgZnVsbFBhdGggPSB0eXBlb2YgYWRhcHRlci5nZXRGdWxsUGF0aCA9PT0gJ2Z1bmN0aW9uJ1xuXHRcdFx0PyBhZGFwdGVyLmdldEZ1bGxQYXRoKGZpbGUucGF0aClcblx0XHRcdDogJyc7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgZWxlY3Ryb25SZXF1aXJlID0gKHdpbmRvdyBhcyB1bmtub3duIGFzIHsgcmVxdWlyZT86IChuYW1lOiBzdHJpbmcpID0+IGFueSB9KS5yZXF1aXJlO1xuXHRcdFx0aWYgKHR5cGVvZiBlbGVjdHJvblJlcXVpcmUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0Y29uc3QgZWxlY3Ryb24gPSBlbGVjdHJvblJlcXVpcmUoJ2VsZWN0cm9uJyk7XG5cdFx0XHRcdGNvbnN0IHNoZWxsID0gZWxlY3Ryb24/LnNoZWxsO1xuXHRcdFx0XHRpZiAoc2hlbGwgJiYgZnVsbFBhdGggJiYgdHlwZW9mIHNoZWxsLm9wZW5QYXRoID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0Y29uc3QgZXJyb3JNZXNzYWdlID0gYXdhaXQgc2hlbGwub3BlblBhdGgoZnVsbFBhdGgpO1xuXHRcdFx0XHRcdGlmICghZXJyb3JNZXNzYWdlKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHNoZWxsICYmIHR5cGVvZiBzaGVsbC5vcGVuRXh0ZXJuYWwgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRhd2FpdCBzaGVsbC5vcGVuRXh0ZXJuYWwodGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpKTtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ2VsZWN0cm9uIHNoZWxsIFx1NjI1M1x1NUYwMFx1NTkzMVx1OEQyNVx1RkYwQ1x1NUMxRFx1OEJENVx1NkQ0Rlx1ODlDOFx1NTY2OFx1NTZERVx1OTAwMDonLCBlcnJvcik7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcG9wdXAgPSB3aW5kb3cub3Blbih0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSksICdfYmxhbmsnLCAnbm9vcGVuZXIsbm9yZWZlcnJlcicpO1xuXHRcdGlmIChwb3B1cCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0bmV3IE5vdGljZSh0aGlzLnQoJ29wZXJhdGlvbkZhaWxlZCcsIHsgbmFtZTogZmlsZS5uYW1lIH0pKTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHQvLyBcdTVCRjlcdTlGNTBcdTkwMDlcdTRFMkRcdTc2ODRcdTU2RkVcdTcyNDdcblx0YWxpZ25TZWxlY3RlZEltYWdlKGVkaXRvcjogRWRpdG9yLCBhbGlnbm1lbnQ6ICdsZWZ0JyB8ICdjZW50ZXInIHwgJ3JpZ2h0Jykge1xuXHRcdGNvbnN0IHNlbGVjdGlvbiA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcblx0XHRpZiAoIXNlbGVjdGlvbikge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3NlbGVjdEltYWdlRmlyc3QnKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU5MDA5XHU0RTJEXHU3Njg0XHU2NjJGXHU1NkZFXHU3MjQ3XG5cdFx0aWYgKCFzZWxlY3Rpb24uaW5jbHVkZXMoJyFbJykgJiYgIXNlbGVjdGlvbi5pbmNsdWRlcygnW1snKSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3NlbGVjdEltYWdlJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFsaWduZWRUZXh0ID0gSW1hZ2VBbGlnbm1lbnQuYXBwbHlBbGlnbm1lbnQoc2VsZWN0aW9uLCBhbGlnbm1lbnQpO1xuXHRcdGVkaXRvci5yZXBsYWNlU2VsZWN0aW9uKGFsaWduZWRUZXh0KTtcblxuXHRcdC8vIFx1NjgzOVx1NjM2RVx1NUJGOVx1OUY1MFx1NjVCOVx1NUYwRlx1NjYzRVx1NzkzQVx1NUJGOVx1NUU5NFx1NzY4NFx1NkQ4OFx1NjA2RlxuXHRcdGNvbnN0IGFsaWdubWVudEtleSA9IGFsaWdubWVudCA9PT0gJ2xlZnQnID8gJ2ltYWdlQWxpZ25lZExlZnQnIDogYWxpZ25tZW50ID09PSAnY2VudGVyJyA/ICdpbWFnZUFsaWduZWRDZW50ZXInIDogJ2ltYWdlQWxpZ25lZFJpZ2h0Jztcblx0XHRuZXcgTm90aWNlKHRoaXMudChhbGlnbm1lbnRLZXkpKTtcblx0fVxuXG5cdC8vIFx1NkRGQlx1NTJBMFx1N0YxNlx1OEY5MVx1NTY2OFx1NEUwQVx1NEUwQlx1NjU4N1x1ODNEQ1x1NTM1NVx1OTg3OVxuXHRhZGRBbGlnbm1lbnRNZW51SXRlbXMobWVudTogTWVudSwgZWRpdG9yOiBFZGl0b3IpIHtcblx0XHRjb25zdCBzZWxlY3Rpb24gPSBlZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XG5cblx0XHQvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTkwMDlcdTRFMkRcdTRFODZcdTU2RkVcdTcyNDdcblx0XHRpZiAoIXNlbGVjdGlvbiB8fCAoIXNlbGVjdGlvbi5pbmNsdWRlcygnIVsnKSAmJiAhc2VsZWN0aW9uLmluY2x1ZGVzKCdbWycpKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cblx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRpdGVtLnNldFRpdGxlKHRoaXMudCgnYWxpZ25JbWFnZUxlZnQnKSlcblx0XHRcdFx0LnNldEljb24oJ2FsaWduLWxlZnQnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAnbGVmdCcpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy50KCdhbGlnbkltYWdlQ2VudGVyJykpXG5cdFx0XHRcdC5zZXRJY29uKCdhbGlnbi1jZW50ZXInKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAnY2VudGVyJyk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnQoJ2FsaWduSW1hZ2VSaWdodCcpKVxuXHRcdFx0XHQuc2V0SWNvbignYWxpZ24tcmlnaHQnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5hbGlnblNlbGVjdGVkSW1hZ2UoZWRpdG9yLCAncmlnaHQnKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU3ODZFXHU0RkREXHU3NkVFXHU1RjU1XHU1QjU4XHU1NzI4XHVGRjA4XHU2NTJGXHU2MzAxXHU5MDEyXHU1RjUyXHU1MjFCXHU1RUZBXHVGRjA5XG5cdCAqL1xuXHRhc3luYyBlbnN1cmVGb2xkZXJFeGlzdHMocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG5cdFx0Y29uc3Qgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgocGF0aCk7XG5cblx0XHRpZiAoIW5vcm1hbGl6ZWRQYXRoKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoIWlzUGF0aFNhZmUobm9ybWFsaXplZFBhdGgpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyB2YXVsdCB9ID0gdGhpcy5hcHA7XG5cdFx0Y29uc3Qgc2VnbWVudHMgPSBub3JtYWxpemVkUGF0aC5zcGxpdCgnLycpLmZpbHRlcihCb29sZWFuKTtcblx0XHRsZXQgY3VycmVudFBhdGggPSAnJztcblxuXHRcdGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuXHRcdFx0Y3VycmVudFBhdGggPSBjdXJyZW50UGF0aCA/IGAke2N1cnJlbnRQYXRofS8ke3NlZ21lbnR9YCA6IHNlZ21lbnQ7XG5cdFx0XHRjb25zdCBleGlzdGluZyA9IHZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChjdXJyZW50UGF0aCk7XG5cblx0XHRcdGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGb2xkZXIpIHtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChleGlzdGluZykge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHZhdWx0LmNyZWF0ZUZvbGRlcihjdXJyZW50UGF0aCk7XG5cdFx0XHR9IGNhdGNoIHtcblx0XHRcdFx0Ly8gXHU1RTc2XHU1M0QxXHU1MjFCXHU1RUZBXHU2NUY2XHU1RkZEXHU3NTY1XHUyMDFDXHU1REYyXHU1QjU4XHU1NzI4XHUyMDFEXHU1NzNBXHU2NjZGXG5cdFx0XHRcdGNvbnN0IHJldHJpZWQgPSB2YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoY3VycmVudFBhdGgpO1xuXHRcdFx0XHRpZiAoIShyZXRyaWVkIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdC8vIFx1NUI4OVx1NTE2OFx1NTIyMFx1OTY2NFx1NjU4N1x1NEVGNlx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHRhc3luYyBzYWZlRGVsZXRlRmlsZShmaWxlOiBURmlsZSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHsgdmF1bHQgfSA9IHRoaXMuYXBwO1xuXG5cdFx0aWYgKCF0aGlzLnNldHRpbmdzLnVzZVRyYXNoRm9sZGVyKSB7XG5cdFx0XHQvLyBcdTc2RjRcdTYzQTVcdTUyMjBcdTk2NjRcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHZhdWx0LmRlbGV0ZShmaWxlKTtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdcdTUyMjBcdTk2NjRcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnZGVsZXRlRmFpbGVkV2l0aE5hbWUnLCB7IG5hbWU6IGZpbGUubmFtZSB9KSk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBcdTc5RkJcdTUyQThcdTUyMzBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzlcblx0XHQvLyBcdTRGN0ZcdTc1MjhcdTUzQ0NcdTRFMEJcdTUyMTJcdTdFQkYgX18gXHU0RjVDXHU0RTNBXHU1MjA2XHU5Njk0XHU3QjI2XHVGRjBDXHU5MDdGXHU1MTREXHU2NTg3XHU0RUY2XHU1NDBEXHU0RTJEXHU1MzA1XHU1NDJCXHU0RTBCXHU1MjEyXHU3RUJGXHU2NUY2XHU4OUUzXHU2NzkwXHU5NTE5XHU4QkVGXG5cdFx0Y29uc3QgdHJhc2hQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMuc2V0dGluZ3MudHJhc2hGb2xkZXIpIHx8IERFRkFVTFRfU0VUVElOR1MudHJhc2hGb2xkZXI7XG5cblx0XHRpZiAoIWlzUGF0aFNhZmUodHJhc2hQYXRoKSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ29wZXJhdGlvbkZhaWxlZCcsIHsgbmFtZTogZmlsZS5uYW1lIH0pKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlTmFtZSA9IGZpbGUubmFtZTtcblx0XHRjb25zdCB0aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuXHRcdGNvbnN0IGVuY29kZWRPcmlnaW5hbFBhdGggPSBlbmNvZGVVUklDb21wb25lbnQobm9ybWFsaXplVmF1bHRQYXRoKGZpbGUucGF0aCkgfHwgZmlsZS5uYW1lKTtcblx0XHRjb25zdCBuZXdGaWxlTmFtZSA9IGAke3RpbWVzdGFtcH1fXyR7ZW5jb2RlZE9yaWdpbmFsUGF0aH1gO1xuXHRcdGNvbnN0IHRhcmdldFBhdGggPSBgJHt0cmFzaFBhdGh9LyR7bmV3RmlsZU5hbWV9YDtcblxuXHRcdHRyeSB7XG5cdFx0XHQvLyBcdTc4NkVcdTRGRERcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTVCNThcdTU3Mjhcblx0XHRcdGNvbnN0IGZvbGRlclJlYWR5ID0gYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXJFeGlzdHModHJhc2hQYXRoKTtcblx0XHRcdGlmICghZm9sZGVyUmVhZHkpIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ29wZXJhdGlvbkZhaWxlZCcsIHsgbmFtZTogZmlsZU5hbWUgfSkpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFx1NzlGQlx1NTJBOFx1NjU4N1x1NEVGNlx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHRcdFx0YXdhaXQgdmF1bHQucmVuYW1lKGZpbGUsIHRhcmdldFBhdGgpO1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ21vdmVkVG9UcmFzaCcsIHsgbmFtZTogZmlsZU5hbWUgfSkpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NzlGQlx1NTJBOFx1NjU4N1x1NEVGNlx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnb3BlcmF0aW9uRmFpbGVkJywgeyBuYW1lOiBmaWxlTmFtZSB9KSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0Ly8gXHU2MDYyXHU1OTBEXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XG5cdGFzeW5jIHJlc3RvcmVGaWxlKGZpbGU6IFRGaWxlLCBvcmlnaW5hbFBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IHsgdmF1bHQgfSA9IHRoaXMuYXBwO1xuXHRcdGNvbnN0IG5vcm1hbGl6ZWRPcmlnaW5hbFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoc2FmZURlY29kZVVSSUNvbXBvbmVudChvcmlnaW5hbFBhdGgpKTtcblxuXHRcdGlmICghbm9ybWFsaXplZE9yaWdpbmFsUGF0aCB8fCAhaXNQYXRoU2FmZShub3JtYWxpemVkT3JpZ2luYWxQYXRoKSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3Jlc3RvcmVGYWlsZWQnLCB7IG1lc3NhZ2U6IHRoaXMudCgnZXJyb3InKSB9KSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdGFyZ2V0RmlsZSA9IHZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3JtYWxpemVkT3JpZ2luYWxQYXRoKTtcblx0XHRpZiAodGFyZ2V0RmlsZSkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3Jlc3RvcmVGYWlsZWQnLCB7IG1lc3NhZ2U6IHRoaXMudCgndGFyZ2V0RmlsZUV4aXN0cycpIH0pKTtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBwYXJlbnRQYXRoID0gZ2V0UGFyZW50UGF0aChub3JtYWxpemVkT3JpZ2luYWxQYXRoKTtcblx0XHRpZiAocGFyZW50UGF0aCkge1xuXHRcdFx0Y29uc3QgcGFyZW50UmVhZHkgPSBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlckV4aXN0cyhwYXJlbnRQYXRoKTtcblx0XHRcdGlmICghcGFyZW50UmVhZHkpIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnQoJ3Jlc3RvcmVGYWlsZWQnLCB7IG1lc3NhZ2U6IHRoaXMudCgnZXJyb3InKSB9KSk7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCByZXN0b3JlZE5hbWUgPSBnZXRGaWxlTmFtZUZyb21QYXRoKG5vcm1hbGl6ZWRPcmlnaW5hbFBhdGgpIHx8IGZpbGUubmFtZTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB2YXVsdC5yZW5hbWUoZmlsZSwgbm9ybWFsaXplZE9yaWdpbmFsUGF0aCk7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgncmVzdG9yZVN1Y2Nlc3MnLCB7IG5hbWU6IHJlc3RvcmVkTmFtZSB9KSk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU2MDYyXHU1OTBEXHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy50KCdyZXN0b3JlRmFpbGVkJywgeyBtZXNzYWdlOiAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2UgfSkpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdC8vIFx1NUY3Qlx1NUU5NVx1NTIyMFx1OTY2NFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NzY4NFx1NjU4N1x1NEVGNlxuXHRhc3luYyBwZXJtYW5lbnRseURlbGV0ZUZpbGUoZmlsZTogVEZpbGUpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRjb25zdCB7IHZhdWx0IH0gPSB0aGlzLmFwcDtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB2YXVsdC5kZWxldGUoZmlsZSk7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMudCgnZmlsZURlbGV0ZWQnLCB7IG5hbWU6IGZpbGUubmFtZSB9KSk7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU1RjdCXHU1RTk1XHU1MjIwXHU5NjY0XHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy50KCdkZWxldGVGYWlsZWQnKSk7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG59XG4iLCAiaW1wb3J0IHsgVEZpbGUsIEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBzZXRJY29uLCBNZW51LCBNZW51SXRlbSwgTm90aWNlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IEltYWdlTWFuYWdlclBsdWdpbiBmcm9tICcuLi9tYWluJztcbmltcG9ydCB7IGZvcm1hdEZpbGVTaXplLCBkZWJvdW5jZSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBub3JtYWxpemVWYXVsdFBhdGggfSBmcm9tICcuLi91dGlscy9wYXRoJztcbmltcG9ydCB7IGdldE1lZGlhVHlwZSwgZ2V0RmlsZUV4dGVuc2lvbiwgZ2V0RG9jdW1lbnREaXNwbGF5TGFiZWwgfSBmcm9tICcuLi91dGlscy9tZWRpYVR5cGVzJztcbmltcG9ydCB7IGdlbmVyYXRlVGh1bWJuYWlsIH0gZnJvbSAnLi4vdXRpbHMvdGh1bWJuYWlsQ2FjaGUnO1xuaW1wb3J0IHsgZmluZE1hdGNoaW5nUnVsZSwgY29tcHV0ZVRhcmdldCwgT3JnYW5pemVDb250ZXh0IH0gZnJvbSAnLi4vdXRpbHMvcnVsZUVuZ2luZSc7XG5pbXBvcnQgeyBwYXJzZUV4aWYgfSBmcm9tICcuLi91dGlscy9leGlmUmVhZGVyJztcbmltcG9ydCB7IHByb2Nlc3NJbWFnZSwgZ2V0Rm9ybWF0RXh0ZW5zaW9uIH0gZnJvbSAnLi4vdXRpbHMvbWVkaWFQcm9jZXNzb3InO1xuXG5leHBvcnQgY29uc3QgVklFV19UWVBFX0lNQUdFX0xJQlJBUlkgPSAnaW1hZ2UtbGlicmFyeS12aWV3JztcblxuaW50ZXJmYWNlIEltYWdlSXRlbSB7XG5cdGZpbGU6IFRGaWxlO1xuXHRwYXRoOiBzdHJpbmc7XG5cdG5hbWU6IHN0cmluZztcblx0c2l6ZTogbnVtYmVyO1xuXHRtb2RpZmllZDogbnVtYmVyO1xuXHRkaW1lbnNpb25zPzogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9O1xufVxuXG5leHBvcnQgY2xhc3MgSW1hZ2VMaWJyYXJ5VmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcblx0cGx1Z2luOiBJbWFnZU1hbmFnZXJQbHVnaW47XG5cdGltYWdlczogSW1hZ2VJdGVtW10gPSBbXTtcblx0ZmlsdGVyZWRJbWFnZXM6IEltYWdlSXRlbVtdID0gW107XG5cdHByaXZhdGUgc2VhcmNoUXVlcnk6IHN0cmluZyA9ICcnO1xuXHRwcml2YXRlIGN1cnJlbnRQYWdlOiBudW1iZXIgPSAxO1xuXHRwcml2YXRlIHBhZ2VTaXplOiBudW1iZXIgPSA1MDtcblx0cHJpdmF0ZSBzZWxlY3RlZEZpbGVzOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcblx0cHJpdmF0ZSBpc1NlbGVjdGlvbk1vZGU6IGJvb2xlYW4gPSBmYWxzZTtcblx0cHJpdmF0ZSBzZWFyY2hJbnB1dDogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG5cdGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luKSB7XG5cdFx0c3VwZXIobGVhZik7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblxuXHRwcml2YXRlIGlzUHJvY2Vzc2FibGVJbWFnZShmaWxlOiBURmlsZSk6IGJvb2xlYW4ge1xuXHRcdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZS5uYW1lKTtcblx0XHRyZXR1cm4gWycucG5nJywgJy5qcGcnLCAnLmpwZWcnLCAnLndlYnAnLCAnLmJtcCddLmluY2x1ZGVzKGV4dCk7XG5cdH1cblxuXHRnZXRWaWV3VHlwZSgpIHtcblx0XHRyZXR1cm4gVklFV19UWVBFX0lNQUdFX0xJQlJBUlk7XG5cdH1cblxuXHRnZXREaXNwbGF5VGV4dCgpIHtcblx0XHRyZXR1cm4gdGhpcy5wbHVnaW4udCgnbWVkaWFMaWJyYXJ5Jyk7XG5cdH1cblxuXHRhc3luYyBvbk9wZW4oKSB7XG5cdFx0Ly8gXHU3QjQ5XHU1Rjg1IGNvbnRlbnRFbCBcdTUxQzZcdTU5MDdcdTU5N0RcdUZGMDhJdGVtVmlldyBcdTc2ODQgY29udGVudEVsIFx1OTcwMFx1ODk4MSBPYnNpZGlhbiBcdTUyMURcdTU5Q0JcdTUzMTZcdUZGMDlcblx0XHRsZXQgcmV0cmllcyA9IDA7XG5cdFx0d2hpbGUgKCF0aGlzLmNvbnRlbnRFbCAmJiByZXRyaWVzIDwgMTApIHtcblx0XHRcdGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MCkpO1xuXHRcdFx0cmV0cmllcysrO1xuXHRcdH1cblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdJbWFnZUxpYnJhcnlWaWV3OiBjb250ZW50RWwgbm90IHJlYWR5IGFmdGVyIHJldHJpZXMnKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoJ2ltYWdlLWxpYnJhcnktdmlldycpO1xuXHRcdC8vIFx1NEVDRVx1OEJCRVx1N0Y2RVx1NEUyRFx1OEJGQlx1NTNENiBwYWdlU2l6ZVxuXHRcdHRoaXMucGFnZVNpemUgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYWdlU2l6ZSB8fCA1MDtcblx0XHRhd2FpdCB0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0fVxuXG5cdGFzeW5jIG9uQ2xvc2UoKSB7XG5cdFx0Ly8gXHU2RTA1XHU3NDA2XHU1REU1XHU0RjVDIC0gXHU0RThCXHU0RUY2XHU3NkQxXHU1NDJDXHU0RjFBXHU1NzI4IFZpZXcgXHU1Mzc4XHU4RjdEXHU2NUY2XHU4MUVBXHU1MkE4XHU2RTA1XHU3NDA2XG5cdH1cblxuXHRhc3luYyByZWZyZXNoSW1hZ2VzKCkge1xuXHRcdC8vIFx1NTk4Mlx1Njc5Q1x1ODlDNlx1NTZGRVx1NURGMlx1NTE3M1x1OTVFRFx1NjIxNiBjb250ZW50RWwgXHU0RTBEXHU1M0VGXHU3NTI4XHVGRjBDXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXG5cdFx0aWYgKCF0aGlzLmNvbnRlbnRFbCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFx1NTQwQ1x1NkI2NVx1NjcwMFx1NjVCMFx1NTIwNlx1OTg3NVx1OEJCRVx1N0Y2RVx1RkYwQ1x1NEZERFx1OEJDMVx1OEJCRVx1N0Y2RVx1NTNEOFx1NjZGNFx1NTQwRVx1N0FDQlx1NTM3M1x1NzUxRlx1NjU0OFxuXHRcdHRoaXMucGFnZVNpemUgPSBNYXRoLm1heCgxLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy5wYWdlU2l6ZSB8fCA1MCk7XG5cblx0XHRjb25zdCBzaXplTWFwOiBSZWNvcmQ8c3RyaW5nLCAnc21hbGwnIHwgJ21lZGl1bScgfCAnbGFyZ2UnPiA9IHtcblx0XHRcdCdzbWFsbCc6ICdzbWFsbCcsXG5cdFx0XHQnbWVkaXVtJzogJ21lZGl1bScsXG5cdFx0XHQnbGFyZ2UnOiAnbGFyZ2UnXG5cdFx0fTtcblxuXHRcdGNvbnN0IHNpemUgPSBzaXplTWFwW3RoaXMucGx1Z2luLnNldHRpbmdzLnRodW1ibmFpbFNpemVdIHx8ICdtZWRpdW0nO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHQvLyBcdTUxNDhcdTgzQjdcdTUzRDZcdTYyNDBcdTY3MDlcdTU2RkVcdTcyNDdcdTY1NzBcdTYzNkVcdUZGMUFcdTRGMThcdTUxNDhcdTRGN0ZcdTc1MjhcdTY1ODdcdTRFRjZcdTdEMjJcdTVGMTVcdUZGMDhcdTU4OUVcdTkxQ0ZcdTYyNkJcdTYzQ0ZcdUZGMDlcdUZGMENcdTU2REVcdTkwMDBcdTUyMzBcdTUxNjhcdTkxQ0ZcdTkwNERcdTUzODZcblx0XHRsZXQgaW1hZ2VGaWxlczogVEZpbGVbXTtcblx0XHRpZiAodGhpcy5wbHVnaW4uZmlsZUluZGV4LmlzSW5pdGlhbGl6ZWQpIHtcblx0XHRcdGNvbnN0IGVudHJpZXMgPSB0aGlzLnBsdWdpbi5maWxlSW5kZXguZ2V0RmlsZXMoKTtcblx0XHRcdGltYWdlRmlsZXMgPSBlbnRyaWVzXG5cdFx0XHRcdC5tYXAoZSA9PiB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZS5wYXRoKSlcblx0XHRcdFx0LmZpbHRlcigoZik6IGYgaXMgVEZpbGUgPT4gZiBpbnN0YW5jZW9mIFRGaWxlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aW1hZ2VGaWxlcyA9IGF3YWl0IHRoaXMucGx1Z2luLmdldEFsbEltYWdlRmlsZXMoKTtcblx0XHR9XG5cblx0XHQvLyBcdThGQzdcdTZFRTRcdTU2RkVcdTcyNDdcdTY1ODdcdTRFRjZcdTU5MzlcdUZGMDhcdTU5ODJcdTY3OUNcdThCQkVcdTdGNkVcdTRFODZcdUZGMDlcblx0XHRsZXQgZmlsdGVyZWRJbWFnZXM6IFRGaWxlW107XG5cdFx0aWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmltYWdlRm9sZGVyKSB7XG5cdFx0XHRjb25zdCBmb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGb2xkZXIpO1xuXHRcdFx0Y29uc3QgcHJlZml4ID0gZm9sZGVyID8gYCR7Zm9sZGVyfS9gIDogJyc7XG5cdFx0XHRmaWx0ZXJlZEltYWdlcyA9IGltYWdlRmlsZXMuZmlsdGVyKGYgPT4ge1xuXHRcdFx0XHRjb25zdCBub3JtYWxpemVkUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChmLnBhdGgpO1xuXHRcdFx0XHRyZXR1cm4gbm9ybWFsaXplZFBhdGggPT09IGZvbGRlciB8fCAocHJlZml4ID8gbm9ybWFsaXplZFBhdGguc3RhcnRzV2l0aChwcmVmaXgpIDogZmFsc2UpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZpbHRlcmVkSW1hZ2VzID0gaW1hZ2VGaWxlcztcblx0XHR9XG5cblx0XHQvLyBcdTYzOTJcdTVFOEZcdTU2RkVcdTcyNDdcblx0XHR0aGlzLmltYWdlcyA9IGZpbHRlcmVkSW1hZ2VzLm1hcChmaWxlID0+ICh7XG5cdFx0XHRmaWxlLFxuXHRcdFx0cGF0aDogZmlsZS5wYXRoLFxuXHRcdFx0bmFtZTogZmlsZS5uYW1lLFxuXHRcdFx0c2l6ZTogZmlsZS5zdGF0LnNpemUsXG5cdFx0XHRtb2RpZmllZDogZmlsZS5zdGF0Lm10aW1lXG5cdFx0fSkpO1xuXG5cdFx0dGhpcy5zb3J0SW1hZ2VzKCk7XG5cblx0XHQvLyBcdTVFOTRcdTc1MjhcdTY0MUNcdTdEMjJcdThGQzdcdTZFRTRcblx0XHR0aGlzLmFwcGx5U2VhcmNoKCk7XG5cblx0XHQvLyBcdTVGNTNcdTY1NzBcdTYzNkVcdTkxQ0ZcdTUzRDhcdTUzMTZcdTYyMTZcdTUyMDZcdTk4NzVcdTU5MjdcdTVDMEZcdTUzRDhcdTUzMTZcdTY1RjZcdUZGMENcdTRGRUVcdTZCNjNcdTVGNTNcdTUyNERcdTk4NzVcdTc4MDFcblx0XHRjb25zdCB0b3RhbFBhZ2VzID0gTWF0aC5tYXgoMSwgTWF0aC5jZWlsKHRoaXMuZmlsdGVyZWRJbWFnZXMubGVuZ3RoIC8gdGhpcy5wYWdlU2l6ZSkpO1xuXHRcdGlmICh0aGlzLmN1cnJlbnRQYWdlID4gdG90YWxQYWdlcykge1xuXHRcdFx0dGhpcy5jdXJyZW50UGFnZSA9IHRvdGFsUGFnZXM7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBXHU1OTM0XHU5MEU4XHVGRjA4XHU1NzI4XHU4M0I3XHU1M0Q2XHU2NTcwXHU2MzZFXHU0RTRCXHU1NDBFXHU2RTMyXHU2N0QzXHVGRjA5XG5cdFx0dGhpcy5yZW5kZXJIZWFkZXIoKTtcblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1NjQxQ1x1N0QyMlx1Njg0NlxuXHRcdHRoaXMucmVuZGVyU2VhcmNoQm94KCk7XG5cblx0XHQvLyBcdTUyMUJcdTVFRkFcdTkwMDlcdTYyRTlcdTZBMjFcdTVGMEZcdTVERTVcdTUxNzdcdTY4MEZcblx0XHRpZiAodGhpcy5pc1NlbGVjdGlvbk1vZGUpIHtcblx0XHRcdHRoaXMucmVuZGVyU2VsZWN0aW9uVG9vbGJhcigpO1xuXHRcdH1cblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1NTZGRVx1NzI0N1x1N0Y1MVx1NjgzQ1x1NUJCOVx1NTY2OFxuXHRcdGNvbnN0IGdyaWQgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1ncmlkJyB9KTtcblx0XHRncmlkLmFkZENsYXNzKGBpbWFnZS1ncmlkLSR7c2l6ZX1gKTtcblxuXHRcdC8vIFx1OEJBMVx1N0I5N1x1NTIwNlx1OTg3NVxuXHRcdGNvbnN0IHN0YXJ0SW5kZXggPSAodGhpcy5jdXJyZW50UGFnZSAtIDEpICogdGhpcy5wYWdlU2l6ZTtcblx0XHRjb25zdCBlbmRJbmRleCA9IE1hdGgubWluKHN0YXJ0SW5kZXggKyB0aGlzLnBhZ2VTaXplLCB0aGlzLmZpbHRlcmVkSW1hZ2VzLmxlbmd0aCk7XG5cdFx0Y29uc3QgcGFnZUltYWdlcyA9IHRoaXMuZmlsdGVyZWRJbWFnZXMuc2xpY2Uoc3RhcnRJbmRleCwgZW5kSW5kZXgpO1xuXG5cdFx0Ly8gXHU2RTMyXHU2N0QzXHU1RjUzXHU1MjREXHU5ODc1XHU3Njg0XHU1NkZFXHU3MjQ3XG5cdFx0Zm9yIChjb25zdCBpbWFnZSBvZiBwYWdlSW1hZ2VzKSB7XG5cdFx0XHR0aGlzLnJlbmRlckltYWdlSXRlbShncmlkLCBpbWFnZSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBXHU1MjA2XHU5ODc1XHU2M0E3XHU0RUY2XG5cdFx0dGhpcy5yZW5kZXJQYWdpbmF0aW9uKCk7XG5cblx0XHRpZiAodGhpcy5maWx0ZXJlZEltYWdlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7XG5cdFx0XHRcdGNsczogJ2VtcHR5LXN0YXRlJyxcblx0XHRcdFx0dGV4dDogdGhpcy5zZWFyY2hRdWVyeSA/IHRoaXMucGx1Z2luLnQoJ25vTWF0Y2hpbmdGaWxlcycpIDogdGhpcy5wbHVnaW4udCgnbm9NZWRpYUZpbGVzJylcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTVFOTRcdTc1MjhcdTY0MUNcdTdEMjJcdThGQzdcdTZFRTRcblx0ICovXG5cdGFwcGx5U2VhcmNoKCkge1xuXHRcdGlmICghdGhpcy5zZWFyY2hRdWVyeSkge1xuXHRcdFx0dGhpcy5maWx0ZXJlZEltYWdlcyA9IFsuLi50aGlzLmltYWdlc107XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnN0IHF1ZXJ5ID0gdGhpcy5zZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0dGhpcy5maWx0ZXJlZEltYWdlcyA9IHRoaXMuaW1hZ2VzLmZpbHRlcihpbWcgPT5cblx0XHRcdFx0aW1nLm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSkgfHxcblx0XHRcdFx0aW1nLnBhdGgudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSlcblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NjQxQ1x1N0QyMlx1Njg0NlxuXHQgKi9cblx0cmVuZGVyU2VhcmNoQm94KCkge1xuXHRcdGNvbnN0IHNlYXJjaENvbnRhaW5lciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3NlYXJjaC1jb250YWluZXInIH0pO1xuXG5cdFx0dGhpcy5zZWFyY2hJbnB1dCA9IHNlYXJjaENvbnRhaW5lci5jcmVhdGVFbCgnaW5wdXQnLCB7XG5cdFx0XHR0eXBlOiAndGV4dCcsXG5cdFx0XHRjbHM6ICdzZWFyY2gtaW5wdXQnLFxuXHRcdFx0YXR0cjoge1xuXHRcdFx0XHRwbGFjZWhvbGRlcjogdGhpcy5wbHVnaW4udCgnc2VhcmNoUGxhY2Vob2xkZXInKSxcblx0XHRcdFx0dmFsdWU6IHRoaXMuc2VhcmNoUXVlcnlcblx0XHRcdH1cblx0XHR9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXG5cdFx0Ly8gXHU2NDFDXHU3RDIyXHU1NkZFXHU2ODA3XG5cdFx0Y29uc3Qgc2VhcmNoSWNvbiA9IHNlYXJjaENvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdzZWFyY2gtaWNvbicgfSk7XG5cdFx0c2V0SWNvbihzZWFyY2hJY29uLCAnc2VhcmNoJyk7XG5cblx0XHQvLyBcdTZFMDVcdTk2NjRcdTY0MUNcdTdEMjJcdTYzMDlcdTk0QUVcblx0XHRpZiAodGhpcy5zZWFyY2hRdWVyeSkge1xuXHRcdFx0Y29uc3QgY2xlYXJCdG4gPSBzZWFyY2hDb250YWluZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnY2xlYXItc2VhcmNoJyB9KTtcblx0XHRcdHNldEljb24oY2xlYXJCdG4sICd4Jyk7XG5cdFx0XHRjbGVhckJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdFx0dGhpcy5zZWFyY2hRdWVyeSA9ICcnO1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRQYWdlID0gMTtcblx0XHRcdFx0dGhpcy5hcHBseVNlYXJjaCgpO1xuXHRcdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vIFx1NEY3Rlx1NzUyOFx1OTYzMlx1NjI5Nlx1NTkwNFx1NzQwNlx1NjQxQ1x1N0QyMlx1OEY5M1x1NTE2NVxuXHRcdGNvbnN0IGRlYm91bmNlZFNlYXJjaCA9IGRlYm91bmNlKCgpID0+IHtcblx0XHRcdHRoaXMuY3VycmVudFBhZ2UgPSAxO1xuXHRcdFx0dGhpcy5hcHBseVNlYXJjaCgpO1xuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSwgMzAwKTtcblxuXHRcdHRoaXMuc2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignaW5wdXQnLCAoZSkgPT4ge1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHRcdHRoaXMuc2VhcmNoUXVlcnkgPSB0YXJnZXQudmFsdWU7XG5cdFx0XHRkZWJvdW5jZWRTZWFyY2goKTtcblx0XHR9KTtcblxuXHRcdC8vIFx1NjYzRVx1NzkzQVx1N0VEM1x1Njc5Q1x1OEJBMVx1NjU3MFxuXHRcdGlmICh0aGlzLnNlYXJjaFF1ZXJ5KSB7XG5cdFx0XHRzZWFyY2hDb250YWluZXIuY3JlYXRlU3Bhbih7XG5cdFx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NlYXJjaFJlc3VsdHMnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKHRoaXMuZmlsdGVyZWRJbWFnZXMubGVuZ3RoKSksXG5cdFx0XHRcdGNsczogJ3NlYXJjaC1yZXN1bHRzLWNvdW50J1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1OTAwOVx1NjJFOVx1NkEyMVx1NUYwRlx1NURFNVx1NTE3N1x1NjgwRlxuXHQgKi9cblx0cmVuZGVyU2VsZWN0aW9uVG9vbGJhcigpIHtcblx0XHRjb25zdCB0b29sYmFyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnc2VsZWN0aW9uLXRvb2xiYXInIH0pO1xuXG5cdFx0dG9vbGJhci5jcmVhdGVTcGFuKHtcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NlbGVjdEZpbGVzJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyh0aGlzLnNlbGVjdGVkRmlsZXMuc2l6ZSkpLFxuXHRcdFx0Y2xzOiAnc2VsZWN0aW9uLWNvdW50J1xuXHRcdH0pO1xuXG5cdFx0Y29uc3Qgc2VsZWN0QWxsQnRuID0gdG9vbGJhci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICd0b29sYmFyLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihzZWxlY3RBbGxCdG4sICdjaGVjay1zcXVhcmUnKTtcblx0XHRzZWxlY3RBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHR0aGlzLmZpbHRlcmVkSW1hZ2VzLmZvckVhY2goaW1nID0+IHRoaXMuc2VsZWN0ZWRGaWxlcy5hZGQoaW1nLmZpbGUucGF0aCkpO1xuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSk7XG5cblx0XHRjb25zdCBkZXNlbGVjdEFsbEJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idXR0b24nIH0pO1xuXHRcdHNldEljb24oZGVzZWxlY3RBbGxCdG4sICdzcXVhcmUnKTtcblx0XHRkZXNlbGVjdEFsbEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5jbGVhcigpO1xuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSk7XG5cblx0XHRjb25zdCBkZWxldGVTZWxlY3RlZEJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idXR0b24gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGRlbGV0ZVNlbGVjdGVkQnRuLCAndHJhc2gtMicpO1xuXHRcdGRlbGV0ZVNlbGVjdGVkQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5kZWxldGVTZWxlY3RlZCgpKTtcblxuXHRcdC8vIFx1NjU3NFx1NzQwNlx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IG9yZ2FuaXplQnRuID0gdG9vbGJhci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICd0b29sYmFyLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihvcmdhbml6ZUJ0biwgJ2ZvbGRlci1pbnB1dCcpO1xuXHRcdG9yZ2FuaXplQnRuLnRpdGxlID0gdGhpcy5wbHVnaW4udCgnb3JnYW5pemluZycpO1xuXHRcdG9yZ2FuaXplQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5vcmdhbml6ZVNlbGVjdGVkKCkpO1xuXG5cdFx0Ly8gXHU1MzhCXHU3RjI5XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgcHJvY2Vzc0J0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idXR0b24nIH0pO1xuXHRcdHNldEljb24ocHJvY2Vzc0J0biwgJ2ltYWdlLWRvd24nKTtcblx0XHRwcm9jZXNzQnRuLnRpdGxlID0gdGhpcy5wbHVnaW4udCgncHJvY2Vzc2luZycpO1xuXHRcdHByb2Nlc3NCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnByb2Nlc3NTZWxlY3RlZCgpKTtcblxuXHRcdGNvbnN0IGV4aXRTZWxlY3Rpb25CdG4gPSB0b29sYmFyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3Rvb2xiYXItYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKGV4aXRTZWxlY3Rpb25CdG4sICd4Jyk7XG5cdFx0ZXhpdFNlbGVjdGlvbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0gZmFsc2U7XG5cdFx0XHR0aGlzLnNlbGVjdGVkRmlsZXMuY2xlYXIoKTtcblx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NTIwNlx1OTg3NVx1NjNBN1x1NEVGNlxuXHQgKi9cblx0cmVuZGVyUGFnaW5hdGlvbigpIHtcblx0XHRjb25zdCB0b3RhbFBhZ2VzID0gTWF0aC5jZWlsKHRoaXMuZmlsdGVyZWRJbWFnZXMubGVuZ3RoIC8gdGhpcy5wYWdlU2l6ZSk7XG5cdFx0aWYgKHRvdGFsUGFnZXMgPD0gMSkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgcGFnaW5hdGlvbiA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3BhZ2luYXRpb24nIH0pO1xuXG5cdFx0Ly8gXHU0RTBBXHU0RTAwXHU5ODc1XG5cdFx0Y29uc3QgcHJldkJ0biA9IHBhZ2luYXRpb24uY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAncGFnZS1idXR0b24nIH0pO1xuXHRcdHByZXZCdG4udGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi50KCdwcmV2UGFnZScpO1xuXHRcdHByZXZCdG4uZGlzYWJsZWQgPSB0aGlzLmN1cnJlbnRQYWdlIDw9IDE7XG5cdFx0cHJldkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdGlmICh0aGlzLmN1cnJlbnRQYWdlID4gMSkge1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRQYWdlLS07XG5cdFx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU5ODc1XHU3ODAxXHU0RkUxXHU2MDZGXG5cdFx0cGFnaW5hdGlvbi5jcmVhdGVTcGFuKHtcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3BhZ2VJbmZvJylcblx0XHRcdFx0LnJlcGxhY2UoJ3tjdXJyZW50fScsIFN0cmluZyh0aGlzLmN1cnJlbnRQYWdlKSlcblx0XHRcdFx0LnJlcGxhY2UoJ3t0b3RhbH0nLCBTdHJpbmcodG90YWxQYWdlcykpLFxuXHRcdFx0Y2xzOiAncGFnZS1pbmZvJ1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU0RTBCXHU0RTAwXHU5ODc1XG5cdFx0Y29uc3QgbmV4dEJ0biA9IHBhZ2luYXRpb24uY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAncGFnZS1idXR0b24nIH0pO1xuXHRcdG5leHRCdG4udGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi50KCduZXh0UGFnZScpO1xuXHRcdG5leHRCdG4uZGlzYWJsZWQgPSB0aGlzLmN1cnJlbnRQYWdlID49IHRvdGFsUGFnZXM7XG5cdFx0bmV4dEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdGlmICh0aGlzLmN1cnJlbnRQYWdlIDwgdG90YWxQYWdlcykge1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRQYWdlKys7XG5cdFx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU4REYzXHU4RjZDXHU1MjMwXHU5ODc1XG5cdFx0Y29uc3QganVtcElucHV0ID0gcGFnaW5hdGlvbi5jcmVhdGVFbCgnaW5wdXQnLCB7XG5cdFx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHRcdGNsczogJ3BhZ2UtanVtcC1pbnB1dCcsXG5cdFx0XHRhdHRyOiB7XG5cdFx0XHRcdG1pbjogJzEnLFxuXHRcdFx0XHRtYXg6IFN0cmluZyh0b3RhbFBhZ2VzKSxcblx0XHRcdFx0dmFsdWU6IFN0cmluZyh0aGlzLmN1cnJlbnRQYWdlKVxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGp1bXBJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZSkgPT4ge1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHRcdGxldCBwYWdlID0gcGFyc2VJbnQodGFyZ2V0LnZhbHVlLCAxMCk7XG5cdFx0XHRpZiAoaXNOYU4ocGFnZSkpIHBhZ2UgPSB0aGlzLmN1cnJlbnRQYWdlO1xuXHRcdFx0cGFnZSA9IE1hdGgubWF4KDEsIE1hdGgubWluKHBhZ2UsIHRvdGFsUGFnZXMpKTtcblx0XHRcdHRoaXMuY3VycmVudFBhZ2UgPSBwYWdlO1xuXHRcdFx0dGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1MjIwXHU5NjY0XHU5MDA5XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRhc3luYyBkZWxldGVTZWxlY3RlZCgpIHtcblx0XHRpZiAodGhpcy5zZWxlY3RlZEZpbGVzLnNpemUgPT09IDApIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnY29uZmlybURlbGV0ZVNlbGVjdGVkJykucmVwbGFjZSgne2NvdW50fScsICcwJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNvbmZpcm1lZCA9IGNvbmZpcm0oXG5cdFx0XHR0aGlzLnBsdWdpbi50KCdjb25maXJtRGVsZXRlU2VsZWN0ZWQnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKHRoaXMuc2VsZWN0ZWRGaWxlcy5zaXplKSlcblx0XHQpO1xuXG5cdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0Y29uc3QgZmlsZXNUb0RlbGV0ZSA9IHRoaXMuZmlsdGVyZWRJbWFnZXMuZmlsdGVyKGltZyA9PlxuXHRcdFx0XHR0aGlzLnNlbGVjdGVkRmlsZXMuaGFzKGltZy5maWxlLnBhdGgpXG5cdFx0XHQpO1xuXG5cdFx0XHQvLyBcdTRGN0ZcdTc1MjggUHJvbWlzZS5hbGwgXHU1RTc2XHU1M0QxXHU1OTA0XHU3NDA2XHU1MjIwXHU5NjY0XG5cdFx0XHRjb25zdCByZXN1bHRzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG5cdFx0XHRcdGZpbGVzVG9EZWxldGUubWFwKGltZyA9PiB0aGlzLnBsdWdpbi5zYWZlRGVsZXRlRmlsZShpbWcuZmlsZSkpXG5cdFx0XHQpO1xuXG5cdFx0XHQvLyBcdTdFREZcdThCQTFcdTYyMTBcdTUyOUZcdTU0OENcdTU5MzFcdThEMjVcdTc2ODRcdTY1NzBcdTkxQ0Zcblx0XHRcdGNvbnN0IHN1Y2Nlc3NDb3VudCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gcikubGVuZ3RoO1xuXHRcdFx0Y29uc3QgZmFpbENvdW50ID0gcmVzdWx0cy5maWx0ZXIociA9PiAhcikubGVuZ3RoO1xuXG5cdFx0XHRpZiAoc3VjY2Vzc0NvdW50ID4gMCkge1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2RlbGV0ZWRGaWxlcycpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcoc3VjY2Vzc0NvdW50KSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGZhaWxDb3VudCA+IDApIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdkZWxldGVGaWxlc0ZhaWxlZCcpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcoZmFpbENvdW50KSksIDMwMDApO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnNlbGVjdGVkRmlsZXMuY2xlYXIoKTtcblx0XHRcdHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0gZmFsc2U7XG5cdFx0XHRhd2FpdCB0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHR9XG5cdH1cblxuXHRyZW5kZXJIZWFkZXIoKSB7XG5cdFx0Y29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnaW1hZ2UtbGlicmFyeS1oZWFkZXInIH0pO1xuXG5cdFx0aGVhZGVyLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy5wbHVnaW4udCgnbWVkaWFMaWJyYXJ5JykgfSk7XG5cblx0XHRjb25zdCBzdGF0cyA9IGhlYWRlci5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1zdGF0cycgfSk7XG5cdFx0c3RhdHMuY3JlYXRlU3Bhbih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ3RvdGFsTWVkaWFGaWxlcycpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcodGhpcy5maWx0ZXJlZEltYWdlcy5sZW5ndGgpKSB9KTtcblxuXHRcdC8vIFx1NTIzN1x1NjVCMFx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IHJlZnJlc2hCdG4gPSBoZWFkZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAncmVmcmVzaC1idXR0b24nIH0pO1xuXHRcdHNldEljb24ocmVmcmVzaEJ0biwgJ3JlZnJlc2gtY3cnKTtcblx0XHRyZWZyZXNoQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5yZWZyZXNoSW1hZ2VzKCkpO1xuXG5cdFx0Ly8gXHU1OTFBXHU5MDA5XHU2QTIxXHU1RjBGXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3Qgc2VsZWN0QnRuID0gaGVhZGVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3JlZnJlc2gtYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKHNlbGVjdEJ0biwgJ2NoZWNrLXNxdWFyZScpO1xuXHRcdHNlbGVjdEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0gIXRoaXMuaXNTZWxlY3Rpb25Nb2RlO1xuXHRcdFx0aWYgKCF0aGlzLmlzU2VsZWN0aW9uTW9kZSkge1xuXHRcdFx0XHR0aGlzLnNlbGVjdGVkRmlsZXMuY2xlYXIoKTtcblx0XHRcdH1cblx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdH0pO1xuXHRcdHNlbGVjdEJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ211bHRpU2VsZWN0TW9kZScpO1xuXG5cdFx0Ly8gXHU2MzkyXHU1RThGXHU5MDA5XHU5ODc5XG5cdFx0Y29uc3Qgc29ydFNlbGVjdCA9IGhlYWRlci5jcmVhdGVFbCgnc2VsZWN0JywgeyBjbHM6ICdzb3J0LXNlbGVjdCcgfSk7XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IFtcblx0XHRcdHsgdmFsdWU6ICduYW1lJywgdGV4dDogdGhpcy5wbHVnaW4udCgnc29ydEJ5TmFtZScpIH0sXG5cdFx0XHR7IHZhbHVlOiAnZGF0ZScsIHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NvcnRCeURhdGUnKSB9LFxuXHRcdFx0eyB2YWx1ZTogJ3NpemUnLCB0ZXh0OiB0aGlzLnBsdWdpbi50KCdzb3J0QnlTaXplJykgfVxuXHRcdF07XG5cdFx0b3B0aW9ucy5mb3JFYWNoKG9wdCA9PiB7XG5cdFx0XHRjb25zdCBvcHRpb24gPSBzb3J0U2VsZWN0LmNyZWF0ZUVsKCdvcHRpb24nLCB7IHZhbHVlOiBvcHQudmFsdWUsIHRleHQ6IG9wdC50ZXh0IH0pO1xuXHRcdFx0aWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRCeSA9PT0gb3B0LnZhbHVlKSB7XG5cdFx0XHRcdG9wdGlvbi5zZXRBdHRyaWJ1dGUoJ3NlbGVjdGVkJywgJ3NlbGVjdGVkJyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0c29ydFNlbGVjdC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoZSkgPT4ge1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG5cdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zb3J0QnkgPSB0YXJnZXQudmFsdWUgYXMgJ25hbWUnIHwgJ2RhdGUnIHwgJ3NpemUnO1xuXHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHR0aGlzLnNvcnRJbWFnZXMoKTtcblx0XHRcdHRoaXMuY3VycmVudFBhZ2UgPSAxOyAvLyBcdTYzOTJcdTVFOEZcdTUzRDhcdTUzMTZcdTU0MEVcdTkxQ0RcdTdGNkVcdTUyMzBcdTdCMkNcdTRFMDBcdTk4NzVcblx0XHRcdHRoaXMucmVmcmVzaEltYWdlcygpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU5ODdBXHU1RThGXHU1MjA3XHU2MzYyXG5cdFx0Y29uc3Qgb3JkZXJCdG4gPSBoZWFkZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnb3JkZXItYnV0dG9uJyB9KTtcblx0XHRvcmRlckJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcblx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRPcmRlciA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRPcmRlciA9PT0gJ2FzYycgPyAnZGVzYycgOiAnYXNjJztcblx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0dGhpcy5zb3J0SW1hZ2VzKCk7XG5cdFx0XHR0aGlzLmN1cnJlbnRQYWdlID0gMTsgLy8gXHU2MzkyXHU1RThGXHU5ODdBXHU1RThGXHU1M0Q4XHU1MzE2XHU1NDBFXHU5MUNEXHU3RjZFXHU1MjMwXHU3QjJDXHU0RTAwXHU5ODc1XG5cdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHR9KTtcblx0XHRzZXRJY29uKG9yZGVyQnRuLCB0aGlzLnBsdWdpbi5zZXR0aW5ncy5zb3J0T3JkZXIgPT09ICdhc2MnID8gJ2Fycm93LXVwJyA6ICdhcnJvdy1kb3duJyk7XG5cdH1cblxuXHRzb3J0SW1hZ2VzKCkge1xuXHRcdGNvbnN0IHsgc29ydEJ5LCBzb3J0T3JkZXIgfSA9IHRoaXMucGx1Z2luLnNldHRpbmdzO1xuXHRcdGNvbnN0IG11bHRpcGxpZXIgPSBzb3J0T3JkZXIgPT09ICdhc2MnID8gMSA6IC0xO1xuXG5cdFx0dGhpcy5pbWFnZXMuc29ydCgoYSwgYikgPT4ge1xuXHRcdFx0c3dpdGNoIChzb3J0QnkpIHtcblx0XHRcdFx0Y2FzZSAnbmFtZSc6XG5cdFx0XHRcdFx0cmV0dXJuIG11bHRpcGxpZXIgKiBhLm5hbWUubG9jYWxlQ29tcGFyZShiLm5hbWUpO1xuXHRcdFx0XHRjYXNlICdkYXRlJzpcblx0XHRcdFx0XHRyZXR1cm4gbXVsdGlwbGllciAqIChhLm1vZGlmaWVkIC0gYi5tb2RpZmllZCk7XG5cdFx0XHRcdGNhc2UgJ3NpemUnOlxuXHRcdFx0XHRcdHJldHVybiBtdWx0aXBsaWVyICogKGEuc2l6ZSAtIGIuc2l6ZSk7XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclRodW1ibmFpbEZhbGxiYWNrKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGljb25OYW1lOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpIHtcblx0XHRjb250YWluZXIuZW1wdHkoKTtcblxuXHRcdGNvbnN0IGZhbGxiYWNrID0gY29udGFpbmVyLmNyZWF0ZURpdigpO1xuXHRcdGZhbGxiYWNrLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRmYWxsYmFjay5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcblx0XHRmYWxsYmFjay5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG5cdFx0ZmFsbGJhY2suc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcblx0XHRmYWxsYmFjay5zdHlsZS5nYXAgPSAnNnB4Jztcblx0XHRmYWxsYmFjay5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LW11dGVkKSc7XG5cblx0XHRjb25zdCBpY29uRWwgPSBmYWxsYmFjay5jcmVhdGVEaXYoKTtcblx0XHRzZXRJY29uKGljb25FbCwgaWNvbk5hbWUpO1xuXG5cdFx0Y29uc3QgbGFiZWxFbCA9IGZhbGxiYWNrLmNyZWF0ZURpdih7IHRleHQ6IGxhYmVsIH0pO1xuXHRcdGxhYmVsRWwuc3R5bGUuZm9udFNpemUgPSAnMC43NWVtJztcblx0XHRsYWJlbEVsLnN0eWxlLnRleHRUcmFuc2Zvcm0gPSAndXBwZXJjYXNlJztcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTWVkaWFUaHVtYm5haWwoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZmlsZTogVEZpbGUsIGRpc3BsYXlOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBtZWRpYVR5cGUgPSBnZXRNZWRpYVR5cGUoZmlsZS5uYW1lKTtcblx0XHRjb25zdCBzcmMgPSB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cblx0XHRpZiAobWVkaWFUeXBlID09PSAnaW1hZ2UnKSB7XG5cdFx0XHQvLyBcdTRGMThcdTUxNDhcdTRFQ0UgSW5kZXhlZERCIFx1N0YxM1x1NUI1OFx1NTJBMFx1OEY3RFx1N0YyOVx1NzU2NVx1NTZGRVxuXHRcdFx0dGhpcy5yZW5kZXJDYWNoZWRUaHVtYm5haWwoY29udGFpbmVyLCBmaWxlLCBzcmMsIGRpc3BsYXlOYW1lKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAobWVkaWFUeXBlID09PSAndmlkZW8nKSB7XG5cdFx0XHRjb25zdCB2aWRlbyA9IGNvbnRhaW5lci5jcmVhdGVFbCgndmlkZW8nKTtcblx0XHRcdHZpZGVvLnNyYyA9IHNyYztcblx0XHRcdHZpZGVvLm11dGVkID0gdHJ1ZTtcblx0XHRcdHZpZGVvLnByZWxvYWQgPSAnbWV0YWRhdGEnO1xuXHRcdFx0dmlkZW8ucGxheXNJbmxpbmUgPSB0cnVlO1xuXHRcdFx0dmlkZW8uc3R5bGUud2lkdGggPSAnMTAwJSc7XG5cdFx0XHR2aWRlby5zdHlsZS5oZWlnaHQgPSAnMTAwJSc7XG5cdFx0XHR2aWRlby5zdHlsZS5vYmplY3RGaXQgPSAnY292ZXInO1xuXHRcdFx0dmlkZW8uYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoKSA9PiB7XG5cdFx0XHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAndmlkZW8nLCAnVklERU8nKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICdhdWRpbycpIHtcblx0XHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAnbXVzaWMnLCAnQVVESU8nKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAobWVkaWFUeXBlID09PSAnZG9jdW1lbnQnKSB7XG5cdFx0XHR0aGlzLnJlbmRlclRodW1ibmFpbEZhbGxiYWNrKGNvbnRhaW5lciwgJ2ZpbGUtdGV4dCcsIGdldERvY3VtZW50RGlzcGxheUxhYmVsKGZpbGUubmFtZSkpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAnZmlsZScsICdGSUxFJyk7XG5cdH1cblxuXHQvKipcblx0ICogXHU0RjdGXHU3NTI4IEluZGV4ZWREQiBcdTdGMTNcdTVCNThcdTc2ODRcdTdGMjlcdTc1NjVcdTU2RkVcdTZFMzJcdTY3RDNcdTU2RkVcdTcyNDdcblx0ICogXHU3RjEzXHU1QjU4XHU1NDdEXHU0RTJEXHU2NUY2XHU3NkY0XHU2M0E1XHU3NTI4IEJsb2IgVVJMXHVGRjBDXHU1NDI2XHU1MjE5XHU0RjdGXHU3NTI4XHU1MzlGXHU1OUNCc3JjXHU1RTc2XHU1RjAyXHU2QjY1XHU3NTFGXHU2MjEwXHU3RjEzXHU1QjU4XG5cdCAqL1xuXHRwcml2YXRlIHJlbmRlckNhY2hlZFRodW1ibmFpbChjb250YWluZXI6IEhUTUxFbGVtZW50LCBmaWxlOiBURmlsZSwgc3JjOiBzdHJpbmcsIGRpc3BsYXlOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBjYWNoZSA9IHRoaXMucGx1Z2luLnRodW1ibmFpbENhY2hlO1xuXHRcdGNvbnN0IG10aW1lID0gZmlsZS5zdGF0Lm10aW1lO1xuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBIGltZyBcdTUxNDNcdTdEMjBcdUZGMDhcdTUxNDhcdTc1MjhcdTUzNjBcdTRGNERcdUZGMDlcblx0XHRjb25zdCBpbWcgPSBjb250YWluZXIuY3JlYXRlRWwoJ2ltZycsIHtcblx0XHRcdGF0dHI6IHsgYWx0OiBkaXNwbGF5TmFtZSB9XG5cdFx0fSk7XG5cdFx0aW1nLnN0eWxlLm9wYWNpdHkgPSAnMCc7XG5cdFx0aW1nLnN0eWxlLnRyYW5zaXRpb24gPSAnb3BhY2l0eSAwLjJzJztcblxuXHRcdGltZy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdGNvbnRhaW5lci5lbXB0eSgpO1xuXHRcdFx0Y29udGFpbmVyLmNyZWF0ZURpdih7XG5cdFx0XHRcdGNsczogJ2ltYWdlLWVycm9yJyxcblx0XHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnaW1hZ2VMb2FkRXJyb3InKVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBTVkcgXHU0RTBEXHU5NzAwXHU4OTgxXHU3RjEzXHU1QjU4XHU3RjI5XHU3NTY1XHU1NkZFXHUyMDE0XHUyMDE0XHU3NkY0XHU2M0E1XHU0RjdGXHU3NTI4XHU1MzlGXHU1OUNCXHU4REVGXHU1Rjg0XG5cdFx0aWYgKGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkgPT09ICdzdmcnKSB7XG5cdFx0XHRpbWcuc3JjID0gc3JjO1xuXHRcdFx0aW1nLnN0eWxlLm9wYWNpdHkgPSAnMSc7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU1QzFEXHU4QkQ1XHU0RUNFXHU3RjEzXHU1QjU4XHU4M0I3XHU1M0Q2XG5cdFx0dm9pZCBjYWNoZS5nZXQoZmlsZS5wYXRoLCBtdGltZSkudGhlbihjYWNoZWRVcmwgPT4ge1xuXHRcdFx0aWYgKGNhY2hlZFVybCkge1xuXHRcdFx0XHRpbWcuc3JjID0gY2FjaGVkVXJsO1xuXHRcdFx0XHRpbWcuc3R5bGUub3BhY2l0eSA9ICcxJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFx1N0YxM1x1NUI1OFx1NjcyQVx1NTQ3RFx1NEUyRFx1RkYxQVx1NTE0OFx1NjYzRVx1NzkzQVx1NTM5Rlx1NTZGRVxuXHRcdFx0XHRpbWcuc3JjID0gc3JjO1xuXHRcdFx0XHRpbWcuc3R5bGUub3BhY2l0eSA9ICcxJztcblxuXHRcdFx0XHQvLyBcdTVGMDJcdTZCNjVcdTc1MUZcdTYyMTBcdTdGMjlcdTc1NjVcdTU2RkVcdTVFNzZcdTVCNThcdTUxNjVcdTdGMTNcdTVCNThcblx0XHRcdFx0dm9pZCBnZW5lcmF0ZVRodW1ibmFpbChzcmMsIDMwMCkudGhlbigoeyBibG9iLCB3aWR0aCwgaGVpZ2h0IH0pID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gY2FjaGUucHV0KGZpbGUucGF0aCwgbXRpbWUsIGJsb2IsIHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0XHR9KS5jYXRjaCgoKSA9PiB7XG5cdFx0XHRcdFx0Ly8gXHU3RjI5XHU3NTY1XHU1NkZFXHU3NTFGXHU2MjEwXHU1OTMxXHU4RDI1XHU0RTBEXHU1RjcxXHU1NENEXHU2NjNFXHU3OTNBXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmVuZGVySW1hZ2VJdGVtKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGltYWdlOiBJbWFnZUl0ZW0pIHtcblx0XHRjb25zdCBpdGVtID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ2ltYWdlLWl0ZW0nIH0pO1xuXG5cdFx0Ly8gXHU1OTgyXHU2NzlDXHU1NzI4XHU5MDA5XHU2MkU5XHU2QTIxXHU1RjBGXHU0RTBCXHVGRjBDXHU2REZCXHU1MkEwXHU1OTBEXHU5MDA5XHU2ODQ2XG5cdFx0aWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKSB7XG5cdFx0XHRjb25zdCBjaGVja2JveCA9IGl0ZW0uY3JlYXRlRWwoJ2lucHV0Jywge1xuXHRcdFx0XHR0eXBlOiAnY2hlY2tib3gnLFxuXHRcdFx0XHRjbHM6ICdpdGVtLWNoZWNrYm94J1xuXHRcdFx0fSk7XG5cdFx0XHRjaGVja2JveC5jaGVja2VkID0gdGhpcy5zZWxlY3RlZEZpbGVzLmhhcyhpbWFnZS5maWxlLnBhdGgpO1xuXHRcdFx0Y2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGUpID0+IHtcblx0XHRcdFx0Y29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHRcdFx0aWYgKHRhcmdldC5jaGVja2VkKSB7XG5cdFx0XHRcdFx0dGhpcy5zZWxlY3RlZEZpbGVzLmFkZChpbWFnZS5maWxlLnBhdGgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5kZWxldGUoaW1hZ2UuZmlsZS5wYXRoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MjFCXHU1RUZBXHU1NkZFXHU3MjQ3XHU1QkI5XHU1NjY4XG5cdFx0Y29uc3QgaW1nQ29udGFpbmVyID0gaXRlbS5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1jb250YWluZXInIH0pO1xuXG5cdFx0Y29uc3QgZmlsZSA9IGltYWdlLmZpbGU7XG5cdFx0dGhpcy5yZW5kZXJNZWRpYVRodW1ibmFpbChpbWdDb250YWluZXIsIGZpbGUsIGltYWdlLm5hbWUpO1xuXG5cdFx0aW1nQ29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNTZWxlY3Rpb25Nb2RlKSB7XG5cdFx0XHRcdC8vIFx1NTcyOFx1OTAwOVx1NjJFOVx1NkEyMVx1NUYwRlx1NEUwQlx1RkYwQ1x1NzBCOVx1NTFGQlx1NTIwN1x1NjM2Mlx1OTAwOVx1NjJFOVx1NzJCNlx1NjAwMVxuXHRcdFx0XHRpZiAodGhpcy5zZWxlY3RlZEZpbGVzLmhhcyhpbWFnZS5maWxlLnBhdGgpKSB7XG5cdFx0XHRcdFx0dGhpcy5zZWxlY3RlZEZpbGVzLmRlbGV0ZShpbWFnZS5maWxlLnBhdGgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5hZGQoaW1hZ2UuZmlsZS5wYXRoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFx1NTcyOFx1NjY2RVx1OTAxQVx1NkEyMVx1NUYwRlx1NEUwQlx1RkYwQ1x1NjI1M1x1NUYwMFx1OTg4NFx1ODlDOFxuXHRcdFx0XHR0aGlzLnBsdWdpbi5vcGVuTWVkaWFQcmV2aWV3KGltYWdlLmZpbGUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU1M0YzXHU5NTJFXHU4M0RDXHU1MzU1XG5cdFx0aXRlbS5hZGRFdmVudExpc3RlbmVyKCdjb250ZXh0bWVudScsIChlKSA9PiB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLnNob3dDb250ZXh0TWVudShlIGFzIE1vdXNlRXZlbnQsIGZpbGUpO1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU2NjNFXHU3OTNBXHU1NkZFXHU3MjQ3XHU0RkUxXHU2MDZGXG5cdFx0aWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dJbWFnZUluZm8pIHtcblx0XHRcdGNvbnN0IGluZm8gPSBpdGVtLmNyZWF0ZURpdih7IGNsczogJ2ltYWdlLWluZm8nIH0pO1xuXHRcdFx0aW5mby5jcmVhdGVEaXYoeyBjbHM6ICdpbWFnZS1uYW1lJywgdGV4dDogaW1hZ2UubmFtZSB9KTtcblx0XHRcdGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaW1hZ2Utc2l6ZScsIHRleHQ6IGZvcm1hdEZpbGVTaXplKGltYWdlLnNpemUpIH0pO1xuXHRcdH1cblx0fVxuXG5cdHNob3dDb250ZXh0TWVudShldmVudDogTW91c2VFdmVudCwgZmlsZTogVEZpbGUpIHtcblx0XHRjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnb3BlbkluTm90ZXMnKSlcblx0XHRcdFx0LnNldEljb24oJ3NlYXJjaCcpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5vcGVuSW1hZ2VJbk5vdGVzKGZpbGUpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnY29weVBhdGgnKSlcblx0XHRcdFx0LnNldEljb24oJ2xpbmsnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChmaWxlLnBhdGgpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdwYXRoQ29waWVkJykpO1xuXHRcdFx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdjb3B5TGluaycpKVxuXHRcdFx0XHQuc2V0SWNvbignY29weScpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBsaW5rID0gdGhpcy5wbHVnaW4uZ2V0U3RhYmxlV2lraUxpbmsoZmlsZSk7XG5cdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChsaW5rKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnbGlua0NvcGllZCcpKTtcblx0XHRcdFx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTkwRFx1NTIzNlx1NTIzMFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnb3Blbk9yaWdpbmFsJykpXG5cdFx0XHRcdC5zZXRJY29uKCdleHRlcm5hbC1saW5rJylcblx0XHRcdFx0Lm9uQ2xpY2soKCkgPT4ge1xuXHRcdFx0XHRcdHZvaWQgdGhpcy5wbHVnaW4ub3Blbk9yaWdpbmFsRmlsZShmaWxlKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTRFQzVcdTU2RkVcdTcyNDdcdTY2M0VcdTc5M0FcdTU5MDRcdTc0MDZcdTkwMDlcdTk4Nzlcblx0XHRpZiAoZ2V0TWVkaWFUeXBlKGZpbGUubmFtZSkgPT09ICdpbWFnZScpIHtcblx0XHRcdG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cblx0XHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdvcmdhbml6aW5nJykpXG5cdFx0XHRcdFx0LnNldEljb24oJ2ZvbGRlci1pbnB1dCcpXG5cdFx0XHRcdFx0Lm9uQ2xpY2soKCkgPT4gdGhpcy5vcmdhbml6ZUZpbGUoZmlsZSkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh0aGlzLmlzUHJvY2Vzc2FibGVJbWFnZShmaWxlKSkge1xuXHRcdFx0XHRtZW51LmFkZEl0ZW0oKGl0ZW06IE1lbnVJdGVtKSA9PiB7XG5cdFx0XHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdwcm9jZXNzaW5nJykpXG5cdFx0XHRcdFx0XHQuc2V0SWNvbignaW1hZ2UtZG93bicpXG5cdFx0XHRcdFx0XHQub25DbGljaygoKSA9PiB0aGlzLnByb2Nlc3NGaWxlKGZpbGUpKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bWVudS5zaG93QXRQb3NpdGlvbih7IHg6IGV2ZW50LmNsaWVudFgsIHk6IGV2ZW50LmNsaWVudFkgfSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2MzA5XHU4OUM0XHU1MjE5XHU2NTc0XHU3NDA2XHU1MzU1XHU0RTJBXHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIG9yZ2FuaXplRmlsZShmaWxlOiBURmlsZSkge1xuXHRcdGNvbnN0IHJ1bGVzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3JnYW5pemVSdWxlcztcblx0XHRjb25zdCBydWxlID0gZmluZE1hdGNoaW5nUnVsZShydWxlcywgZmlsZSk7XG5cdFx0aWYgKCFydWxlKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ25vTWF0Y2hpbmdGaWxlcycpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBjdHggPSBhd2FpdCB0aGlzLmJ1aWxkT3JnYW5pemVDb250ZXh0KGZpbGUpO1xuXHRcdGNvbnN0IHRhcmdldCA9IGNvbXB1dGVUYXJnZXQocnVsZSwgY3R4KTtcblxuXHRcdGlmICh0YXJnZXQubmV3UGF0aCA9PT0gZmlsZS5wYXRoKSByZXR1cm47XG5cblx0XHRhd2FpdCB0aGlzLnBsdWdpbi5lbnN1cmVGb2xkZXJFeGlzdHModGFyZ2V0Lm5ld1BhdGguc3Vic3RyaW5nKDAsIHRhcmdldC5uZXdQYXRoLmxhc3RJbmRleE9mKCcvJykpKTtcblx0XHRhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIHRhcmdldC5uZXdQYXRoKTtcblx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ29yZ2FuaXplQ29tcGxldGUnLCB7IGNvdW50OiAxIH0pKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYyNzlcdTkxQ0ZcdTY1NzRcdTc0MDZcdTkwMDlcdTRFMkRcdTY1ODdcdTRFRjZcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgb3JnYW5pemVTZWxlY3RlZCgpIHtcblx0XHRpZiAodGhpcy5zZWxlY3RlZEZpbGVzLnNpemUgPT09IDApIHJldHVybjtcblxuXHRcdGNvbnN0IHJ1bGVzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3Mub3JnYW5pemVSdWxlcztcblx0XHRsZXQgb3JnYW5pemVkQ291bnQgPSAwO1xuXG5cdFx0Zm9yIChjb25zdCBwYXRoIG9mIHRoaXMuc2VsZWN0ZWRGaWxlcykge1xuXHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKTtcblx0XHRcdGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBydWxlID0gZmluZE1hdGNoaW5nUnVsZShydWxlcywgZmlsZSk7XG5cdFx0XHRpZiAoIXJ1bGUpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBjdHggPSBhd2FpdCB0aGlzLmJ1aWxkT3JnYW5pemVDb250ZXh0KGZpbGUpO1xuXHRcdFx0Y29uc3QgdGFyZ2V0ID0gY29tcHV0ZVRhcmdldChydWxlLCBjdHgpO1xuXG5cdFx0XHRpZiAodGFyZ2V0Lm5ld1BhdGggPT09IGZpbGUucGF0aCkgY29udGludWU7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLmVuc3VyZUZvbGRlckV4aXN0cyh0YXJnZXQubmV3UGF0aC5zdWJzdHJpbmcoMCwgdGFyZ2V0Lm5ld1BhdGgubGFzdEluZGV4T2YoJy8nKSkpO1xuXHRcdFx0XHRhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIHRhcmdldC5uZXdQYXRoKTtcblx0XHRcdFx0b3JnYW5pemVkQ291bnQrKztcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgXHU2NTc0XHU3NDA2XHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OiAke2ZpbGUubmFtZX1gLCBlcnJvcik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdvcmdhbml6ZUNvbXBsZXRlJywgeyBjb3VudDogb3JnYW5pemVkQ291bnQgfSkpO1xuXHRcdHRoaXMuc2VsZWN0ZWRGaWxlcy5jbGVhcigpO1xuXHRcdHRoaXMuaXNTZWxlY3Rpb25Nb2RlID0gZmFsc2U7XG5cdFx0YXdhaXQgdGhpcy5yZWZyZXNoSW1hZ2VzKCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU2Nzg0XHU1RUZBXHU2NTc0XHU3NDA2XHU0RTBBXHU0RTBCXHU2NTg3XHVGRjA4XHU1MzA1XHU1NDJCIEVYSUYgXHU4OUUzXHU2NzkwXHVGRjA5XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGJ1aWxkT3JnYW5pemVDb250ZXh0KGZpbGU6IFRGaWxlKTogUHJvbWlzZTxPcmdhbml6ZUNvbnRleHQ+IHtcblx0XHRjb25zdCBkYXRlID0gbmV3IERhdGUoZmlsZS5zdGF0Lm10aW1lKTtcblx0XHRjb25zdCBjdHg6IE9yZ2FuaXplQ29udGV4dCA9IHsgZmlsZSwgZGF0ZSB9O1xuXG5cdFx0Ly8gXHU1QzFEXHU4QkQ1XHU4OUUzXHU2NzkwIEVYSUZcdUZGMDhcdTRFQzUgSlBFR1x1RkYwOVxuXHRcdGNvbnN0IGV4dCA9IGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKGV4dCA9PT0gJ2pwZycgfHwgZXh0ID09PSAnanBlZycpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWRCaW5hcnkoZmlsZSk7XG5cdFx0XHRcdGN0eC5leGlmID0gcGFyc2VFeGlmKGJ1ZmZlcik7XG5cdFx0XHR9IGNhdGNoIHsgLyogRVhJRiBcdTg5RTNcdTY3OTBcdTU5MzFcdThEMjVcdTRFMERcdTVGNzFcdTU0Q0RcdTY1NzRcdTc0MDYgKi8gfVxuXHRcdH1cblxuXHRcdHJldHVybiBjdHg7XG5cdH1cblxuXHRwcml2YXRlIGdldFByb2Nlc3NTZXR0aW5ncygpIHtcblx0XHRjb25zdCBzZXR0aW5ncyA9IHRoaXMucGx1Z2luLnNldHRpbmdzO1xuXHRcdHJldHVybiB7XG5cdFx0XHRxdWFsaXR5OiBzZXR0aW5ncy5kZWZhdWx0UHJvY2Vzc1F1YWxpdHksXG5cdFx0XHRmb3JtYXQ6IHNldHRpbmdzLmRlZmF1bHRQcm9jZXNzRm9ybWF0LFxuXHRcdFx0d2F0ZXJtYXJrOiBzZXR0aW5ncy53YXRlcm1hcmtUZXh0ID8ge1xuXHRcdFx0XHR0ZXh0OiBzZXR0aW5ncy53YXRlcm1hcmtUZXh0LFxuXHRcdFx0XHRwb3NpdGlvbjogJ2JvdHRvbS1yaWdodCcgYXMgY29uc3QsXG5cdFx0XHRcdG9wYWNpdHk6IDAuNVxuXHRcdFx0fSA6IHVuZGVmaW5lZFxuXHRcdH07XG5cdH1cblxuXHRwcml2YXRlIGFzeW5jIHByb2Nlc3NBbmRSZXBsYWNlRmlsZShmaWxlOiBURmlsZSk6IFByb21pc2U8e1xuXHRcdGJhc2VOYW1lOiBzdHJpbmc7XG5cdFx0b3JpZ2luYWxTaXplOiBudW1iZXI7XG5cdFx0bmV3U2l6ZTogbnVtYmVyO1xuXHR9PiB7XG5cdFx0Y29uc3Qgc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdGNvbnN0IG9yaWdpbmFsU2l6ZSA9IGZpbGUuc3RhdC5zaXplO1xuXHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHByb2Nlc3NJbWFnZShzcmMsIG9yaWdpbmFsU2l6ZSwgdGhpcy5nZXRQcm9jZXNzU2V0dGluZ3MoKSk7XG5cdFx0Y29uc3QgbmV3RXh0ID0gZ2V0Rm9ybWF0RXh0ZW5zaW9uKHJlc3VsdC5mb3JtYXQpO1xuXHRcdGNvbnN0IGJhc2VOYW1lID0gZmlsZS5uYW1lLnJlcGxhY2UoL1xcLlteLl0rJC8sICcnKTtcblx0XHRjb25zdCBuZXdQYXRoID0gZmlsZS5wYXJlbnRcblx0XHRcdD8gYCR7ZmlsZS5wYXJlbnQucGF0aH0vJHtiYXNlTmFtZX0ke25ld0V4dH1gXG5cdFx0XHQ6IGAke2Jhc2VOYW1lfSR7bmV3RXh0fWA7XG5cdFx0Y29uc3QgYXJyYXlCdWZmZXIgPSBhd2FpdCByZXN1bHQuYmxvYi5hcnJheUJ1ZmZlcigpO1xuXG5cdFx0aWYgKG5ld1BhdGggPT09IGZpbGUucGF0aCkge1xuXHRcdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5QmluYXJ5KGZpbGUsIGFycmF5QnVmZmVyKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGJhc2VOYW1lLFxuXHRcdFx0XHRvcmlnaW5hbFNpemUsXG5cdFx0XHRcdG5ld1NpemU6IHJlc3VsdC5uZXdTaXplXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5ld1BhdGgpO1xuXHRcdGlmIChleGlzdGluZyAmJiBleGlzdGluZy5wYXRoICE9PSBmaWxlLnBhdGgpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcih0aGlzLnBsdWdpbi50KCd0YXJnZXRGaWxlRXhpc3RzJykpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9yaWdpbmFsQnVmZmVyID0gYXdhaXQgdGhpcy5hcHAudmF1bHQucmVhZEJpbmFyeShmaWxlKTtcblxuXHRcdC8vIFx1NTE0OFx1NTE5OVx1NTE2NVx1OEY2Q1x1NjM2Mlx1NTQwRVx1NzY4NFx1NTE4NVx1NUJCOVx1RkYwQ1x1OTA3Rlx1NTE0RCByZW5hbWUgXHU2NzFGXHU5NUY0XHU1MUZBXHU3M0IwXHU2MjY5XHU1QzU1XHU1NDBEXHU1NDhDXHU1QjlFXHU5NjQ1XHU1QjU3XHU4MjgyXHU2ODNDXHU1RjBGXHU0RTBEXHU0RTAwXHU4MUY0XHUzMDAyXG5cdFx0YXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5QmluYXJ5KGZpbGUsIGFycmF5QnVmZmVyKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRhd2FpdCB0aGlzLmFwcC5maWxlTWFuYWdlci5yZW5hbWVGaWxlKGZpbGUsIG5ld1BhdGgpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnlCaW5hcnkoZmlsZSwgb3JpZ2luYWxCdWZmZXIpO1xuXHRcdFx0fSBjYXRjaCAocm9sbGJhY2tFcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBcdTU2REVcdTZFREFcdTU5MDRcdTc0MDZcdTU0MEVcdTc2ODRcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6ICR7ZmlsZS5uYW1lfWAsIHJvbGxiYWNrRXJyb3IpO1xuXHRcdFx0fVxuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGJhc2VOYW1lLFxuXHRcdFx0b3JpZ2luYWxTaXplLFxuXHRcdFx0bmV3U2l6ZTogcmVzdWx0Lm5ld1NpemVcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIENhbnZhcyBcdTU5MDRcdTc0MDZcdTUzNTVcdTRFMkFcdTY1ODdcdTRFRjZcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcHJvY2Vzc0ZpbGUoZmlsZTogVEZpbGUpIHtcblx0XHRpZiAoIXRoaXMuaXNQcm9jZXNzYWJsZUltYWdlKGZpbGUpKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3Vuc3VwcG9ydGVkRmlsZVR5cGUnKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHsgYmFzZU5hbWUsIG9yaWdpbmFsU2l6ZSwgbmV3U2l6ZSB9ID0gYXdhaXQgdGhpcy5wcm9jZXNzQW5kUmVwbGFjZUZpbGUoZmlsZSk7XG5cdFx0XHRjb25zdCBzYXZlZCA9IE1hdGgubWF4KDAsIG9yaWdpbmFsU2l6ZSAtIG5ld1NpemUpO1xuXHRcdFx0bmV3IE5vdGljZShgXHUyNzA1ICR7YmFzZU5hbWV9OiAke2Zvcm1hdEZpbGVTaXplKG9yaWdpbmFsU2l6ZSl9IFx1MjE5MiAke2Zvcm1hdEZpbGVTaXplKG5ld1NpemUpfSAoXHU4MjgyXHU3NzAxICR7Zm9ybWF0RmlsZVNpemUoc2F2ZWQpfSlgKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihgXHU1OTA0XHU3NDA2XHU1OTMxXHU4RDI1OiAke2ZpbGUubmFtZX1gLCBlcnJvcik7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykgKyBgOiAke2ZpbGUubmFtZX1gKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2Mjc5XHU5MUNGIENhbnZhcyBcdTU5MDRcdTc0MDZcdTkwMDlcdTRFMkRcdTY1ODdcdTRFRjZcblx0ICovXG5cdHByaXZhdGUgYXN5bmMgcHJvY2Vzc1NlbGVjdGVkKCkge1xuXHRcdGlmICh0aGlzLnNlbGVjdGVkRmlsZXMuc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXG5cdFx0bGV0IHByb2Nlc3NlZCA9IDA7XG5cdFx0bGV0IHNraXBwZWQgPSAwO1xuXHRcdGxldCB0b3RhbFNhdmVkID0gMDtcblxuXHRcdGZvciAoY29uc3QgcGF0aCBvZiB0aGlzLnNlbGVjdGVkRmlsZXMpIHtcblx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aCk7XG5cdFx0XHRpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcblx0XHRcdGlmICghdGhpcy5pc1Byb2Nlc3NhYmxlSW1hZ2UoZmlsZSkpIHtcblx0XHRcdFx0c2tpcHBlZCsrO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgeyBvcmlnaW5hbFNpemUsIG5ld1NpemUgfSA9IGF3YWl0IHRoaXMucHJvY2Vzc0FuZFJlcGxhY2VGaWxlKGZpbGUpO1xuXHRcdFx0XHRwcm9jZXNzZWQrKztcblx0XHRcdFx0dG90YWxTYXZlZCArPSBNYXRoLm1heCgwLCBvcmlnaW5hbFNpemUgLSBuZXdTaXplKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgXHU1OTA0XHU3NDA2XHU1OTMxXHU4RDI1OiAke3BhdGh9YCwgZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IHN1ZmZpeCA9IHNraXBwZWQgPiAwID8gYFx1RkYwQ1x1OERGM1x1OEZDNyAke3NraXBwZWR9IFx1NEUyQVx1NEUwRFx1NjUyRlx1NjMwMVx1NzY4NFx1NjU4N1x1NEVGNmAgOiAnJztcblx0XHRuZXcgTm90aWNlKGBcdTI3MDUgXHU1OTA0XHU3NDA2XHU1QjhDXHU2MjEwOiAke3Byb2Nlc3NlZH0gXHU0RTJBXHU2NTg3XHU0RUY2XHVGRjBDXHU4MjgyXHU3NzAxICR7Zm9ybWF0RmlsZVNpemUodG90YWxTYXZlZCl9JHtzdWZmaXh9YCk7XG5cdFx0dGhpcy5zZWxlY3RlZEZpbGVzLmNsZWFyKCk7XG5cdFx0dGhpcy5pc1NlbGVjdGlvbk1vZGUgPSBmYWxzZTtcblx0XHRhd2FpdCB0aGlzLnJlZnJlc2hJbWFnZXMoKTtcblx0fVxuXG5cdC8vIFx1NURGMlx1NzlGQlx1OTY2NCBmb3JtYXRGaWxlU2l6ZSBcdTY1QjlcdTZDRDVcdUZGMENcdTRGN0ZcdTc1MjggdXRpbHMvZm9ybWF0LnRzIFx1NEUyRFx1NzY4NFx1NUI5RVx1NzNCMFxufVxuIiwgIi8qKlxuICogXHU5MDFBXHU3NTI4XHU1REU1XHU1MTc3XHU1MUZEXHU2NTcwXHU2QTIxXHU1NzU3XG4gKi9cblxuLyoqXG4gKiBcdTY4M0NcdTVGMEZcdTUzMTZcdTY1ODdcdTRFRjZcdTU5MjdcdTVDMEZcbiAqIEBwYXJhbSBieXRlcyBcdTVCNTdcdTgyODJcdTY1NzBcbiAqIEByZXR1cm5zIFx1NjgzQ1x1NUYwRlx1NTMxNlx1NTQwRVx1NzY4NFx1NTkyN1x1NUMwRlx1NUI1N1x1N0IyNlx1NEUzMlx1RkYwQ1x1NTk4MiBcIjEuNSBNQlwiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRGaWxlU2l6ZShieXRlczogbnVtYmVyKTogc3RyaW5nIHtcblx0aWYgKCFOdW1iZXIuaXNGaW5pdGUoYnl0ZXMpIHx8IGJ5dGVzIDw9IDApIHJldHVybiAnMCBCJztcblx0Y29uc3QgayA9IDEwMjQ7XG5cdGNvbnN0IHNpemVzID0gWydCJywgJ0tCJywgJ01CJywgJ0dCJ107XG5cdGNvbnN0IGkgPSBNYXRoLm1heCgwLCBNYXRoLm1pbihNYXRoLmZsb29yKE1hdGgubG9nKGJ5dGVzKSAvIE1hdGgubG9nKGspKSwgc2l6ZXMubGVuZ3RoIC0gMSkpO1xuXHRyZXR1cm4gcGFyc2VGbG9hdCgoYnl0ZXMgLyBNYXRoLnBvdyhrLCBpKSkudG9GaXhlZCgyKSkgKyAnICcgKyBzaXplc1tpXTtcbn1cblxuLyoqXG4gKiBcdTk2MzJcdTYyOTZcdTUxRkRcdTY1NzBcbiAqIEBwYXJhbSBmbiBcdTg5ODFcdTYyNjdcdTg4NENcdTc2ODRcdTUxRkRcdTY1NzBcbiAqIEBwYXJhbSBkZWxheSBcdTVFRjZcdThGREZcdTY1RjZcdTk1RjRcdUZGMDhcdTZCRUJcdTc5RDJcdUZGMDlcbiAqIEByZXR1cm5zIFx1OTYzMlx1NjI5Nlx1NTkwNFx1NzQwNlx1NTQwRVx1NzY4NFx1NTFGRFx1NjU3MFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVib3VuY2U8VCBleHRlbmRzICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24+KFxuXHRmbjogVCxcblx0ZGVsYXk6IG51bWJlclxuKTogKC4uLmFyZ3M6IFBhcmFtZXRlcnM8VD4pID0+IHZvaWQge1xuXHRsZXQgdGltZW91dElkOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xuXG5cdHJldHVybiAoLi4uYXJnczogUGFyYW1ldGVyczxUPikgPT4ge1xuXHRcdGlmICh0aW1lb3V0SWQpIHtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuXHRcdH1cblx0XHR0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGZuKC4uLmFyZ3MpO1xuXHRcdH0sIGRlbGF5KTtcblx0fTtcbn1cbiIsICIvKipcbiAqIFx1OERFRlx1NUY4NFx1NURFNVx1NTE3N1x1NTFGRFx1NjU3MFxuICogT2JzaWRpYW4gXHU1MTg1XHU5MEU4XHU4REVGXHU1Rjg0XHU3RURGXHU0RTAwXHU0RjdGXHU3NTI4IFwiL1wiXHVGRjBDXHU4RkQ5XHU5MUNDXHU5NkM2XHU0RTJEXHU1MDVBXHU4REU4XHU1RTczXHU1M0YwXHU4OUM0XHU4MzAzXHU1MzE2XG4gKi9cblxuLyoqXG4gKiBcdTg5QzRcdTgzMDNcdTUzMTYgVmF1bHQgXHU3NkY4XHU1QkY5XHU4REVGXHU1Rjg0XG4gKiAtIFx1N0VERlx1NEUwMFx1NTIwNlx1OTY5NFx1N0IyNlx1NEUzQSBcIi9cIlxuICogLSBcdTUzQkJcdTYzODlcdTk5OTZcdTVDM0VcdTdBN0FcdTc2N0RcbiAqIC0gXHU1M0JCXHU2Mzg5XHU5MUNEXHU1OTBEXHU1MjA2XHU5Njk0XHU3QjI2XHUzMDAxXHU1MjREXHU1QkZDIFwiLi9cIlx1MzAwMVx1NjcyQlx1NUMzRSBcIi9cIlxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVmF1bHRQYXRoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJykgcmV0dXJuICcnO1xuXG5cdGxldCBub3JtYWxpemVkID0gaW5wdXQudHJpbSgpLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcblx0bm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQucmVwbGFjZSgvXFwvezIsfS9nLCAnLycpO1xuXHRub3JtYWxpemVkID0gbm9ybWFsaXplZC5yZXBsYWNlKC9eXFwvKy8sICcnKTtcblxuXHR3aGlsZSAobm9ybWFsaXplZC5zdGFydHNXaXRoKCcuLycpKSB7XG5cdFx0bm9ybWFsaXplZCA9IG5vcm1hbGl6ZWQuc2xpY2UoMik7XG5cdH1cblxuXHRub3JtYWxpemVkID0gbm9ybWFsaXplZC5yZXBsYWNlKC9cXC8rJC8sICcnKTtcblx0cmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU4REVGXHU1Rjg0XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XHU1NDBEXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRGaWxlTmFtZUZyb21QYXRoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplVmF1bHRQYXRoKGlucHV0KTtcblx0aWYgKCFub3JtYWxpemVkKSByZXR1cm4gJyc7XG5cdGNvbnN0IHBhcnRzID0gbm9ybWFsaXplZC5zcGxpdCgnLycpO1xuXHRyZXR1cm4gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gfHwgJyc7XG59XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU4REVGXHU1Rjg0XHU0RTJEXHU3Njg0XHU3MjM2XHU3NkVFXHU1RjU1XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRQYXRoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplVmF1bHRQYXRoKGlucHV0KTtcblx0aWYgKCFub3JtYWxpemVkKSByZXR1cm4gJyc7XG5cdGNvbnN0IGlkeCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoJy8nKTtcblx0cmV0dXJuIGlkeCA9PT0gLTEgPyAnJyA6IG5vcm1hbGl6ZWQuc2xpY2UoMCwgaWR4KTtcbn1cblxuLyoqXG4gKiBcdTVCODlcdTUxNjhcdTg5RTNcdTc4MDEgVVJJIFx1NzI0N1x1NkJCNVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FmZURlY29kZVVSSUNvbXBvbmVudChpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGlucHV0KTtcblx0fSBjYXRjaCB7XG5cdFx0cmV0dXJuIGlucHV0O1xuXHR9XG59XG4iLCAiLyoqXG4gKiBcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEJcdTYyNjlcdTVDNTVcdTU0MERcdTdFREZcdTRFMDBcdTdCQTFcdTc0MDZcbiAqIFx1OTZDNlx1NEUyRFx1N0JBMVx1NzQwNlx1NjI0MFx1NjcwOVx1NjUyRlx1NjMwMVx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1NjI2OVx1NUM1NVx1NTQwRFx1RkYwQ1x1NEZCRlx1NEU4RVx1N0VGNFx1NjJBNFx1NTQ4Q1x1NjI2OVx1NUM1NVxuICovXG5cbi8qKlxuICogXHU1NkZFXHU3MjQ3XHU2MjY5XHU1QzU1XHU1NDBEXG4gKi9cbmV4cG9ydCBjb25zdCBJTUFHRV9FWFRFTlNJT05TID0gWycucG5nJywgJy5qcGcnLCAnLmpwZWcnLCAnLmdpZicsICcud2VicCcsICcuc3ZnJywgJy5ibXAnXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTg5QzZcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGNvbnN0IFZJREVPX0VYVEVOU0lPTlMgPSBbJy5tcDQnLCAnLm1vdicsICcuYXZpJywgJy5ta3YnLCAnLndlYm0nXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTk3RjNcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGNvbnN0IEFVRElPX0VYVEVOU0lPTlMgPSBbJy5tcDMnLCAnLndhdicsICcub2dnJywgJy5tNGEnLCAnLmZsYWMnXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTY1ODdcdTY4NjNcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGNvbnN0IERPQ1VNRU5UX0VYVEVOU0lPTlMgPSBbJy5wZGYnLCAnLmRvY3gnLCAnLnhsc3gnLCAnLnBwdHgnLCAnLmRvYycsICcueGxzJywgJy5wcHQnXSBhcyBjb25zdDtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTU2RkVcdTcyNDdcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IElNQUdFX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5JTUFHRV9FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTg5QzZcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IFZJREVPX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5WSURFT19FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTk3RjNcdTk4OTFcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IEFVRElPX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5BVURJT19FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTY1ODdcdTY4NjNcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IERPQ1VNRU5UX0VYVEVOU0lPTlNfU1RSOiBzdHJpbmdbXSA9IFsuLi5ET0NVTUVOVF9FWFRFTlNJT05TXTtcblxuLyoqXG4gKiBcdTYyNDBcdTY3MDlcdTY1MkZcdTYzMDFcdTc2ODRcdTVBOTJcdTRGNTNcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVCNTdcdTdCMjZcdTRFMzJcdTY1NzBcdTdFQzRcdUZGMDlcbiAqL1xuZXhwb3J0IGNvbnN0IEFMTF9NRURJQV9FWFRFTlNJT05TOiBzdHJpbmdbXSA9IFtcblx0Li4uSU1BR0VfRVhURU5TSU9OU19TVFIsXG5cdC4uLlZJREVPX0VYVEVOU0lPTlNfU1RSLFxuXHQuLi5BVURJT19FWFRFTlNJT05TX1NUUixcblx0Li4uRE9DVU1FTlRfRVhURU5TSU9OU19TVFJcbl07XG5cbi8qKlxuICogXHU2MjY5XHU1QzU1XHU1NDBEXHU1MjMwXHU1QTkyXHU0RjUzXHU3QzdCXHU1NzhCXHU3Njg0XHU2NjIwXHU1QzA0XG4gKi9cbmV4cG9ydCBjb25zdCBFWFRFTlNJT05fVE9fVFlQRTogUmVjb3JkPHN0cmluZywgJ2ltYWdlJyB8ICd2aWRlbycgfCAnYXVkaW8nIHwgJ2RvY3VtZW50Jz4gPSB7XG5cdC8vIFx1NTZGRVx1NzI0N1xuXHQnLnBuZyc6ICdpbWFnZScsXG5cdCcuanBnJzogJ2ltYWdlJyxcblx0Jy5qcGVnJzogJ2ltYWdlJyxcblx0Jy5naWYnOiAnaW1hZ2UnLFxuXHQnLndlYnAnOiAnaW1hZ2UnLFxuXHQnLnN2Zyc6ICdpbWFnZScsXG5cdCcuYm1wJzogJ2ltYWdlJyxcblx0Ly8gXHU4OUM2XHU5ODkxXG5cdCcubXA0JzogJ3ZpZGVvJyxcblx0Jy5tb3YnOiAndmlkZW8nLFxuXHQnLmF2aSc6ICd2aWRlbycsXG5cdCcubWt2JzogJ3ZpZGVvJyxcblx0Jy53ZWJtJzogJ3ZpZGVvJyxcblx0Ly8gXHU5N0YzXHU5ODkxXG5cdCcubXAzJzogJ2F1ZGlvJyxcblx0Jy53YXYnOiAnYXVkaW8nLFxuXHQnLm9nZyc6ICdhdWRpbycsXG5cdCcubTRhJzogJ2F1ZGlvJyxcblx0Jy5mbGFjJzogJ2F1ZGlvJyxcblx0Ly8gXHU2NTg3XHU2ODYzXG5cdCcucGRmJzogJ2RvY3VtZW50Jyxcblx0Jy5kb2N4JzogJ2RvY3VtZW50Jyxcblx0Jy54bHN4JzogJ2RvY3VtZW50Jyxcblx0Jy5wcHR4JzogJ2RvY3VtZW50Jyxcblx0Jy5kb2MnOiAnZG9jdW1lbnQnLFxuXHQnLnhscyc6ICdkb2N1bWVudCcsXG5cdCcucHB0JzogJ2RvY3VtZW50J1xufTtcblxuLyoqXG4gKiBcdTgzQjdcdTUzRDZcdTY1ODdcdTRFRjZcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdTVDMEZcdTUxOTlcdUZGMDlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEZpbGVFeHRlbnNpb24oZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG5cdGNvbnN0IGxhc3REb3QgPSBmaWxlbmFtZS5sYXN0SW5kZXhPZignLicpO1xuXHRpZiAobGFzdERvdCA9PT0gLTEpIHJldHVybiAnJztcblx0cmV0dXJuIGZpbGVuYW1lLnN1YnN0cmluZyhsYXN0RG90KS50b0xvd2VyQ2FzZSgpO1xufVxuXG4vKipcbiAqIFx1NjgzOVx1NjM2RVx1NjI2OVx1NUM1NVx1NTQwRFx1ODNCN1x1NTNENlx1NUE5Mlx1NEY1M1x1N0M3Qlx1NTc4QlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWVkaWFUeXBlKGZpbGVuYW1lOiBzdHJpbmcpOiAnaW1hZ2UnIHwgJ3ZpZGVvJyB8ICdhdWRpbycgfCAnZG9jdW1lbnQnIHwgbnVsbCB7XG5cdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZW5hbWUpO1xuXHRyZXR1cm4gRVhURU5TSU9OX1RPX1RZUEVbZXh0XSB8fCBudWxsO1xufVxuXG4vKipcbiAqIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NEUzQVx1NTZGRVx1NzI0N1x1NjU4N1x1NEVGNlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbWFnZUZpbGUoZmlsZW5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRjb25zdCBleHQgPSBnZXRGaWxlRXh0ZW5zaW9uKGZpbGVuYW1lKTtcblx0cmV0dXJuIElNQUdFX0VYVEVOU0lPTlNfU1RSLmluY2x1ZGVzKGV4dCk7XG59XG5cbi8qKlxuICogXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU0RTNBXHU4OUM2XHU5ODkxXHU2NTg3XHU0RUY2XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1ZpZGVvRmlsZShmaWxlbmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG5cdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZW5hbWUpO1xuXHRyZXR1cm4gVklERU9fRVhURU5TSU9OU19TVFIuaW5jbHVkZXMoZXh0KTtcbn1cblxuLyoqXG4gKiBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTRFM0FcdTk3RjNcdTk4OTFcdTY1ODdcdTRFRjZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQXVkaW9GaWxlKGZpbGVuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcblx0Y29uc3QgZXh0ID0gZ2V0RmlsZUV4dGVuc2lvbihmaWxlbmFtZSk7XG5cdHJldHVybiBBVURJT19FWFRFTlNJT05TX1NUUi5pbmNsdWRlcyhleHQpO1xufVxuXG4vKipcbiAqIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NEUzQVx1NjU4N1x1Njg2M1x1NjU4N1x1NEVGNlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNEb2N1bWVudEZpbGUoZmlsZW5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRjb25zdCBleHQgPSBnZXRGaWxlRXh0ZW5zaW9uKGZpbGVuYW1lKTtcblx0cmV0dXJuIERPQ1VNRU5UX0VYVEVOU0lPTlNfU1RSLmluY2x1ZGVzKGV4dCk7XG59XG5cbi8qKlxuICogXHU4M0I3XHU1M0Q2XHU2NTg3XHU2ODYzXHU1NkRFXHU5MDAwXHU1QzU1XHU3OTNBXHU2ODA3XHU3QjdFXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXREb2N1bWVudERpc3BsYXlMYWJlbChmaWxlbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcblx0Y29uc3QgZXh0ID0gZ2V0RmlsZUV4dGVuc2lvbihmaWxlbmFtZSk7XG5cdGlmICghZXh0KSB7XG5cdFx0cmV0dXJuICdET0MnO1xuXHR9XG5cdHJldHVybiBleHQuc2xpY2UoMSkudG9VcHBlckNhc2UoKTtcbn1cblxuLyoqXG4gKiBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTRFM0FcdTY1MkZcdTYzMDFcdTc2ODRcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTWVkaWFGaWxlKGZpbGVuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcblx0Y29uc3QgZXh0ID0gZ2V0RmlsZUV4dGVuc2lvbihmaWxlbmFtZSk7XG5cdHJldHVybiBBTExfTUVESUFfRVhURU5TSU9OUy5pbmNsdWRlcyhleHQpO1xufVxuXG4vKipcbiAqIFx1NjgzOVx1NjM2RVx1OEJCRVx1N0Y2RVx1ODNCN1x1NTNENlx1NTQyRlx1NzUyOFx1NzY4NFx1NUE5Mlx1NEY1M1x1NjI2OVx1NUM1NVx1NTQwRFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5hYmxlZEV4dGVuc2lvbnMoc2V0dGluZ3M6IHtcblx0ZW5hYmxlSW1hZ2VzPzogYm9vbGVhbjtcblx0ZW5hYmxlVmlkZW9zPzogYm9vbGVhbjtcblx0ZW5hYmxlQXVkaW8/OiBib29sZWFuO1xuXHRlbmFibGVQREY/OiBib29sZWFuO1xufSk6IHN0cmluZ1tdIHtcblx0Y29uc3QgZXh0ZW5zaW9uczogc3RyaW5nW10gPSBbXTtcblxuXHRpZiAoc2V0dGluZ3MuZW5hYmxlSW1hZ2VzICE9PSBmYWxzZSkge1xuXHRcdGV4dGVuc2lvbnMucHVzaCguLi5JTUFHRV9FWFRFTlNJT05TX1NUUik7XG5cdH1cblx0aWYgKHNldHRpbmdzLmVuYWJsZVZpZGVvcyAhPT0gZmFsc2UpIHtcblx0XHRleHRlbnNpb25zLnB1c2goLi4uVklERU9fRVhURU5TSU9OU19TVFIpO1xuXHR9XG5cdGlmIChzZXR0aW5ncy5lbmFibGVBdWRpbyAhPT0gZmFsc2UpIHtcblx0XHRleHRlbnNpb25zLnB1c2goLi4uQVVESU9fRVhURU5TSU9OU19TVFIpO1xuXHR9XG5cdGlmIChzZXR0aW5ncy5lbmFibGVQREYgIT09IGZhbHNlKSB7XG5cdFx0ZXh0ZW5zaW9ucy5wdXNoKC4uLkRPQ1VNRU5UX0VYVEVOU0lPTlNfU1RSKTtcblx0fVxuXG5cdHJldHVybiBleHRlbnNpb25zO1xufVxuIiwgIi8qKlxuICogSW5kZXhlZERCIFx1N0YyOVx1NzU2NVx1NTZGRVx1NjMwMVx1NEU0NVx1N0YxM1x1NUI1OFxuICogXHU3RjEzXHU1QjU4XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHU3Njg0XHU3RjI5XHU3NTY1XHU1NkZFIEJsb2JcdUZGMENcdTkwN0ZcdTUxNERcdTZCQ0ZcdTZCMjFcdTYyNTNcdTVGMDBcdTg5QzZcdTU2RkVcdTkxQ0RcdTY1QjBcdTc1MUZcdTYyMTBcbiAqL1xuXG5jb25zdCBEQl9OQU1FID0gJ29ic2lkaWFuLW1lZGlhLXRvb2xraXQtdGh1bWJzJztcbmNvbnN0IERCX1ZFUlNJT04gPSAxO1xuY29uc3QgU1RPUkVfTkFNRSA9ICd0aHVtYm5haWxzJztcblxuaW50ZXJmYWNlIFRodW1ibmFpbEVudHJ5IHtcblx0cGF0aDogc3RyaW5nO1xuXHRtdGltZTogbnVtYmVyO1xuXHRibG9iOiBCbG9iO1xuXHR3aWR0aDogbnVtYmVyO1xuXHRoZWlnaHQ6IG51bWJlcjtcblx0Y3JlYXRlZEF0OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBUaHVtYm5haWxDYWNoZSB7XG5cdHByaXZhdGUgZGI6IElEQkRhdGFiYXNlIHwgbnVsbCA9IG51bGw7XG5cdHByaXZhdGUgbWF4RW50cmllczogbnVtYmVyO1xuXHRwcml2YXRlIG1lbW9yeUNhY2hlOiBNYXA8c3RyaW5nLCB7IG10aW1lOiBudW1iZXI7IHVybDogc3RyaW5nIH0+ID0gbmV3IE1hcCgpO1xuXG5cdGNvbnN0cnVjdG9yKG1heEVudHJpZXM6IG51bWJlciA9IDUwMDApIHtcblx0XHR0aGlzLm1heEVudHJpZXMgPSBtYXhFbnRyaWVzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjI1M1x1NUYwMCBJbmRleGVkREIgXHU4RkRFXHU2M0E1XG5cdCAqL1xuXHRhc3luYyBvcGVuKCk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLmRiKSByZXR1cm47XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0Y29uc3QgcmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKERCX05BTUUsIERCX1ZFUlNJT04pO1xuXG5cdFx0XHRyZXF1ZXN0Lm9udXBncmFkZW5lZWRlZCA9IChldmVudCkgPT4ge1xuXHRcdFx0XHRjb25zdCBkYiA9IChldmVudC50YXJnZXQgYXMgSURCT3BlbkRCUmVxdWVzdCkucmVzdWx0O1xuXHRcdFx0XHRpZiAoIWRiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoU1RPUkVfTkFNRSkpIHtcblx0XHRcdFx0XHRjb25zdCBzdG9yZSA9IGRiLmNyZWF0ZU9iamVjdFN0b3JlKFNUT1JFX05BTUUsIHsga2V5UGF0aDogJ3BhdGgnIH0pO1xuXHRcdFx0XHRcdHN0b3JlLmNyZWF0ZUluZGV4KCdjcmVhdGVkQXQnLCAnY3JlYXRlZEF0JywgeyB1bmlxdWU6IGZhbHNlIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRyZXF1ZXN0Lm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuXHRcdFx0XHR0aGlzLmRiID0gKGV2ZW50LnRhcmdldCBhcyBJREJPcGVuREJSZXF1ZXN0KS5yZXN1bHQ7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH07XG5cblx0XHRcdHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHtcblx0XHRcdFx0Y29uc29sZS53YXJuKCdUaHVtYm5haWxDYWNoZTogRmFpbGVkIHRvIG9wZW4gSW5kZXhlZERCLCBydW5uaW5nIHdpdGhvdXQgY2FjaGUnKTtcblx0XHRcdFx0cmVzb2x2ZSgpOyAvLyBcdTRFMERcdTk2M0JcdTU4NUVcdUZGMENcdTY1RTBcdTdGMTNcdTVCNThcdTZBMjFcdTVGMEZcdTdFRTdcdTdFRURcdThGRDBcdTg4NENcblx0XHRcdH07XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1MTczXHU5NUVEIEluZGV4ZWREQiBcdThGREVcdTYzQTVcdUZGMENcdTkxQ0FcdTY1M0VcdTUxODVcdTVCNThcdTRFMkRcdTc2ODQgT2JqZWN0IFVSTFxuXHQgKi9cblx0Y2xvc2UoKTogdm9pZCB7XG5cdFx0Ly8gXHU5MUNBXHU2NTNFXHU2MjQwXHU2NzA5XHU1MTg1XHU1QjU4XHU0RTJEXHU3Njg0IE9iamVjdCBVUkxcblx0XHRmb3IgKGNvbnN0IGVudHJ5IG9mIHRoaXMubWVtb3J5Q2FjaGUudmFsdWVzKCkpIHtcblx0XHRcdFVSTC5yZXZva2VPYmplY3RVUkwoZW50cnkudXJsKTtcblx0XHR9XG5cdFx0dGhpcy5tZW1vcnlDYWNoZS5jbGVhcigpO1xuXG5cdFx0aWYgKHRoaXMuZGIpIHtcblx0XHRcdHRoaXMuZGIuY2xvc2UoKTtcblx0XHRcdHRoaXMuZGIgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTgzQjdcdTUzRDZcdTdGMTNcdTVCNThcdTc2ODRcdTdGMjlcdTc1NjVcdTU2RkUgT2JqZWN0IFVSTFxuXHQgKiBcdTRFQzVcdTVGNTNcdThERUZcdTVGODRcdTUzMzlcdTkxNERcdTRFMTQgbXRpbWUgXHU2NzJBXHU1M0Q4XHU2NUY2XHU4RkQ0XHU1NkRFXHU3RjEzXHU1QjU4XG5cdCAqL1xuXHRhc3luYyBnZXQocGF0aDogc3RyaW5nLCBtdGltZTogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG5cdFx0Ly8gXHU1MTQ4XHU2N0U1XHU1MTg1XHU1QjU4XHU3RjEzXHU1QjU4XG5cdFx0Y29uc3QgbWVtRW50cnkgPSB0aGlzLm1lbW9yeUNhY2hlLmdldChwYXRoKTtcblx0XHRpZiAobWVtRW50cnkgJiYgbWVtRW50cnkubXRpbWUgPT09IG10aW1lKSB7XG5cdFx0XHRyZXR1cm4gbWVtRW50cnkudXJsO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5kYikgcmV0dXJuIG51bGw7XG5cblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGNvbnN0IHR4ID0gdGhpcy5kYiEudHJhbnNhY3Rpb24oU1RPUkVfTkFNRSwgJ3JlYWRvbmx5Jyk7XG5cdFx0XHRjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpO1xuXHRcdFx0Y29uc3QgcmVxdWVzdCA9IHN0b3JlLmdldChwYXRoKTtcblxuXHRcdFx0cmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGVudHJ5ID0gcmVxdWVzdC5yZXN1bHQgYXMgVGh1bWJuYWlsRW50cnkgfCB1bmRlZmluZWQ7XG5cdFx0XHRcdGlmIChlbnRyeSAmJiBlbnRyeS5tdGltZSA9PT0gbXRpbWUpIHtcblx0XHRcdFx0XHRjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGVudHJ5LmJsb2IpO1xuXHRcdFx0XHRcdHRoaXMubWVtb3J5Q2FjaGUuc2V0KHBhdGgsIHsgbXRpbWUsIHVybCB9KTtcblx0XHRcdFx0XHRyZXNvbHZlKHVybCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmVzb2x2ZShudWxsKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0cmVxdWVzdC5vbmVycm9yID0gKCkgPT4gcmVzb2x2ZShudWxsKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTVCNThcdTUxNjVcdTdGMjlcdTc1NjVcdTU2RkVcdTdGMTNcdTVCNThcblx0ICovXG5cdGFzeW5jIHB1dChwYXRoOiBzdHJpbmcsIG10aW1lOiBudW1iZXIsIGJsb2I6IEJsb2IsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Ly8gXHU2NkY0XHU2NUIwXHU1MTg1XHU1QjU4XHU3RjEzXHU1QjU4XG5cdFx0Y29uc3Qgb2xkRW50cnkgPSB0aGlzLm1lbW9yeUNhY2hlLmdldChwYXRoKTtcblx0XHRpZiAob2xkRW50cnkpIHtcblx0XHRcdFVSTC5yZXZva2VPYmplY3RVUkwob2xkRW50cnkudXJsKTtcblx0XHR9XG5cdFx0Y29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcblx0XHR0aGlzLm1lbW9yeUNhY2hlLnNldChwYXRoLCB7IG10aW1lLCB1cmwgfSk7XG5cblx0XHRpZiAoIXRoaXMuZGIpIHJldHVybjtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Y29uc3QgdHggPSB0aGlzLmRiIS50cmFuc2FjdGlvbihTVE9SRV9OQU1FLCAncmVhZHdyaXRlJyk7XG5cdFx0XHRjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpO1xuXG5cdFx0XHRjb25zdCBlbnRyeTogVGh1bWJuYWlsRW50cnkgPSB7XG5cdFx0XHRcdHBhdGgsXG5cdFx0XHRcdG10aW1lLFxuXHRcdFx0XHRibG9iLFxuXHRcdFx0XHR3aWR0aCxcblx0XHRcdFx0aGVpZ2h0LFxuXHRcdFx0XHRjcmVhdGVkQXQ6IERhdGUubm93KClcblx0XHRcdH07XG5cblx0XHRcdHN0b3JlLnB1dChlbnRyeSk7XG5cdFx0XHR0eC5vbmNvbXBsZXRlID0gKCkgPT4ge1xuXHRcdFx0XHR0aGlzLmV2aWN0SWZOZWVkZWQoKTtcblx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0fTtcblx0XHRcdHR4Lm9uZXJyb3IgPSAoKSA9PiByZXNvbHZlKCk7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU1MjIwXHU5NjY0XHU2MzA3XHU1QjlBXHU4REVGXHU1Rjg0XHU3Njg0XHU3RjEzXHU1QjU4XG5cdCAqL1xuXHRhc3luYyBkZWxldGUocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Y29uc3QgbWVtRW50cnkgPSB0aGlzLm1lbW9yeUNhY2hlLmdldChwYXRoKTtcblx0XHRpZiAobWVtRW50cnkpIHtcblx0XHRcdFVSTC5yZXZva2VPYmplY3RVUkwobWVtRW50cnkudXJsKTtcblx0XHRcdHRoaXMubWVtb3J5Q2FjaGUuZGVsZXRlKHBhdGgpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5kYikgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRjb25zdCB0eCA9IHRoaXMuZGIhLnRyYW5zYWN0aW9uKFNUT1JFX05BTUUsICdyZWFkd3JpdGUnKTtcblx0XHRcdHR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpLmRlbGV0ZShwYXRoKTtcblx0XHRcdHR4Lm9uY29tcGxldGUgPSAoKSA9PiByZXNvbHZlKCk7XG5cdFx0XHR0eC5vbmVycm9yID0gKCkgPT4gcmVzb2x2ZSgpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUwNVx1N0E3QVx1NjI0MFx1NjcwOVx1N0YxM1x1NUI1OFxuXHQgKi9cblx0YXN5bmMgY2xlYXIoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0Zm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLm1lbW9yeUNhY2hlLnZhbHVlcygpKSB7XG5cdFx0XHRVUkwucmV2b2tlT2JqZWN0VVJMKGVudHJ5LnVybCk7XG5cdFx0fVxuXHRcdHRoaXMubWVtb3J5Q2FjaGUuY2xlYXIoKTtcblxuXHRcdGlmICghdGhpcy5kYikgcmV0dXJuO1xuXG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG5cdFx0XHRjb25zdCB0eCA9IHRoaXMuZGIhLnRyYW5zYWN0aW9uKFNUT1JFX05BTUUsICdyZWFkd3JpdGUnKTtcblx0XHRcdHR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpLmNsZWFyKCk7XG5cdFx0XHR0eC5vbmNvbXBsZXRlID0gKCkgPT4gcmVzb2x2ZSgpO1xuXHRcdFx0dHgub25lcnJvciA9ICgpID0+IHJlc29sdmUoKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTkxQ0RcdTU0N0RcdTU0MERcdThERUZcdTVGODRcdTc2ODRcdTdGMTNcdTVCNThcdTY3NjFcdTc2RUVcdUZGMDhcdTY1ODdcdTRFRjZcdTkxQ0RcdTU0N0RcdTU0MERcdTY1RjZcdThDMDNcdTc1MjhcdUZGMDlcblx0ICovXG5cdGFzeW5jIHJlbmFtZShvbGRQYXRoOiBzdHJpbmcsIG5ld1BhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGNvbnN0IG1lbUVudHJ5ID0gdGhpcy5tZW1vcnlDYWNoZS5nZXQob2xkUGF0aCk7XG5cdFx0aWYgKG1lbUVudHJ5KSB7XG5cdFx0XHR0aGlzLm1lbW9yeUNhY2hlLmRlbGV0ZShvbGRQYXRoKTtcblx0XHRcdHRoaXMubWVtb3J5Q2FjaGUuc2V0KG5ld1BhdGgsIG1lbUVudHJ5KTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuZGIpIHJldHVybjtcblxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdFx0Y29uc3QgdHggPSB0aGlzLmRiIS50cmFuc2FjdGlvbihTVE9SRV9OQU1FLCAncmVhZHdyaXRlJyk7XG5cdFx0XHRjb25zdCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpO1xuXHRcdFx0Y29uc3QgZ2V0UmVxID0gc3RvcmUuZ2V0KG9sZFBhdGgpO1xuXG5cdFx0XHRnZXRSZXEub25zdWNjZXNzID0gKCkgPT4ge1xuXHRcdFx0XHRjb25zdCBlbnRyeSA9IGdldFJlcS5yZXN1bHQgYXMgVGh1bWJuYWlsRW50cnkgfCB1bmRlZmluZWQ7XG5cdFx0XHRcdGlmIChlbnRyeSkge1xuXHRcdFx0XHRcdHN0b3JlLmRlbGV0ZShvbGRQYXRoKTtcblx0XHRcdFx0XHRlbnRyeS5wYXRoID0gbmV3UGF0aDtcblx0XHRcdFx0XHRzdG9yZS5wdXQoZW50cnkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHR0eC5vbmNvbXBsZXRlID0gKCkgPT4gcmVzb2x2ZSgpO1xuXHRcdFx0dHgub25lcnJvciA9ICgpID0+IHJlc29sdmUoKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBMUlUgXHU2REQ4XHU2QzcwXHVGRjFBXHU4RDg1XHU4RkM3XHU2NzAwXHU1OTI3XHU2NzYxXHU3NkVFXHU2NTcwXHU2NUY2XHU1MjIwXHU5NjY0XHU2NzAwXHU2NUU3XHU3Njg0XG5cdCAqL1xuXHRwcml2YXRlIGFzeW5jIGV2aWN0SWZOZWVkZWQoKTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKCF0aGlzLmRiKSByZXR1cm47XG5cblx0XHRjb25zdCB0eCA9IHRoaXMuZGIudHJhbnNhY3Rpb24oU1RPUkVfTkFNRSwgJ3JlYWRvbmx5Jyk7XG5cdFx0Y29uc3Qgc3RvcmUgPSB0eC5vYmplY3RTdG9yZShTVE9SRV9OQU1FKTtcblx0XHRjb25zdCBjb3VudFJlcSA9IHN0b3JlLmNvdW50KCk7XG5cblx0XHRjb3VudFJlcS5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG5cdFx0XHRjb25zdCBjb3VudCA9IGNvdW50UmVxLnJlc3VsdDtcblx0XHRcdGlmIChjb3VudCA8PSB0aGlzLm1heEVudHJpZXMpIHJldHVybjtcblxuXHRcdFx0Y29uc3QgZXZpY3RDb3VudCA9IGNvdW50IC0gdGhpcy5tYXhFbnRyaWVzO1xuXHRcdFx0Y29uc3QgZXZpY3RUeCA9IHRoaXMuZGIhLnRyYW5zYWN0aW9uKFNUT1JFX05BTUUsICdyZWFkd3JpdGUnKTtcblx0XHRcdGNvbnN0IGV2aWN0U3RvcmUgPSBldmljdFR4Lm9iamVjdFN0b3JlKFNUT1JFX05BTUUpO1xuXHRcdFx0Y29uc3QgaW5kZXggPSBldmljdFN0b3JlLmluZGV4KCdjcmVhdGVkQXQnKTtcblx0XHRcdGNvbnN0IGN1cnNvciA9IGluZGV4Lm9wZW5DdXJzb3IoKTtcblx0XHRcdGxldCBkZWxldGVkID0gMDtcblxuXHRcdFx0Y3Vyc29yLm9uc3VjY2VzcyA9IChldmVudCkgPT4ge1xuXHRcdFx0XHRjb25zdCBjID0gKGV2ZW50LnRhcmdldCBhcyBJREJSZXF1ZXN0PElEQkN1cnNvcldpdGhWYWx1ZSB8IG51bGw+KS5yZXN1bHQ7XG5cdFx0XHRcdGlmIChjICYmIGRlbGV0ZWQgPCBldmljdENvdW50KSB7XG5cdFx0XHRcdFx0Y29uc3QgcGF0aCA9IChjLnZhbHVlIGFzIFRodW1ibmFpbEVudHJ5KS5wYXRoO1xuXHRcdFx0XHRcdGNvbnN0IG1lbUVudHJ5ID0gdGhpcy5tZW1vcnlDYWNoZS5nZXQocGF0aCk7XG5cdFx0XHRcdFx0aWYgKG1lbUVudHJ5KSB7XG5cdFx0XHRcdFx0XHRVUkwucmV2b2tlT2JqZWN0VVJMKG1lbUVudHJ5LnVybCk7XG5cdFx0XHRcdFx0XHR0aGlzLm1lbW9yeUNhY2hlLmRlbGV0ZShwYXRoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Yy5kZWxldGUoKTtcblx0XHRcdFx0XHRkZWxldGVkKys7XG5cdFx0XHRcdFx0Yy5jb250aW51ZSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH07XG5cdH1cbn1cblxuLyoqXG4gKiBcdTc1MjggQ2FudmFzIFx1NzUxRlx1NjIxMFx1N0YyOVx1NzU2NVx1NTZGRSBCbG9iXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVRodW1ibmFpbChcblx0aW1hZ2VTcmM6IHN0cmluZyxcblx0bWF4U2l6ZTogbnVtYmVyID0gMjAwXG4pOiBQcm9taXNlPHsgYmxvYjogQmxvYjsgd2lkdGg6IG51bWJlcjsgaGVpZ2h0OiBudW1iZXIgfT4ge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdGltZy5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xuXG5cdFx0aW1nLm9ubG9hZCA9ICgpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IHsgd2lkdGg6IG9yaWdXLCBoZWlnaHQ6IG9yaWdIIH0gPSBpbWc7XG5cdFx0XHRcdGxldCB0YXJnZXRXID0gb3JpZ1c7XG5cdFx0XHRcdGxldCB0YXJnZXRIID0gb3JpZ0g7XG5cblx0XHRcdFx0aWYgKG9yaWdXID4gbWF4U2l6ZSB8fCBvcmlnSCA+IG1heFNpemUpIHtcblx0XHRcdFx0XHRjb25zdCByYXRpbyA9IE1hdGgubWluKG1heFNpemUgLyBvcmlnVywgbWF4U2l6ZSAvIG9yaWdIKTtcblx0XHRcdFx0XHR0YXJnZXRXID0gTWF0aC5yb3VuZChvcmlnVyAqIHJhdGlvKTtcblx0XHRcdFx0XHR0YXJnZXRIID0gTWF0aC5yb3VuZChvcmlnSCAqIHJhdGlvKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0XHRjYW52YXMud2lkdGggPSB0YXJnZXRXO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gdGFyZ2V0SDtcblxuXHRcdFx0XHRjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0XHRcdFx0aWYgKCFjdHgpIHtcblx0XHRcdFx0XHRyZWplY3QobmV3IEVycm9yKCdDYW5ub3QgZ2V0IGNhbnZhcyBjb250ZXh0JykpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCB0YXJnZXRXLCB0YXJnZXRIKTtcblxuXHRcdFx0XHRjYW52YXMudG9CbG9iKFxuXHRcdFx0XHRcdChibG9iKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoYmxvYikge1xuXHRcdFx0XHRcdFx0XHRyZXNvbHZlKHsgYmxvYiwgd2lkdGg6IHRhcmdldFcsIGhlaWdodDogdGFyZ2V0SCB9KTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHJlamVjdChuZXcgRXJyb3IoJ0NhbnZhcyB0b0Jsb2IgcmV0dXJuZWQgbnVsbCcpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCdpbWFnZS93ZWJwJyxcblx0XHRcdFx0XHQwLjdcblx0XHRcdFx0KTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGltZy5vbmVycm9yID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgaW1hZ2U6ICR7aW1hZ2VTcmN9YCkpO1xuXHRcdGltZy5zcmMgPSBpbWFnZVNyYztcblx0fSk7XG59XG4iLCAiLyoqXG4gKiBcdTdFQUYgSlMgRVhJRiBcdTg5RTNcdTY3OTBcdTU2NjhcbiAqIFx1NEVDRSBKUEVHIFx1NjU4N1x1NEVGNlx1NzY4NCBBUFAxIFx1NkJCNVx1NEUyRFx1ODlFM1x1Njc5MCBUSUZGIElGRFx1RkYwQ1x1NjNEMFx1NTNENlx1NTE3M1x1OTUyRSBFWElGIFx1NEZFMVx1NjA2RlxuICogXHU2NUUwXHU1OTE2XHU5MEU4XHU0RjlEXHU4RDU2XG4gKi9cblxuZXhwb3J0IGludGVyZmFjZSBFeGlmRGF0YSB7XG5cdGRhdGVUaW1lT3JpZ2luYWw/OiBzdHJpbmc7ICAvLyBZWVlZOk1NOkREIEhIOm1tOnNzXG5cdG1ha2U/OiBzdHJpbmc7ICAgICAgICAgICAgIC8vIFx1NzZGOFx1NjczQVx1NTRDMVx1NzI0Q1xuXHRtb2RlbD86IHN0cmluZzsgICAgICAgICAgICAvLyBcdTc2RjhcdTY3M0FcdTU3OEJcdTUzRjdcblx0aW1hZ2VXaWR0aD86IG51bWJlcjtcblx0aW1hZ2VIZWlnaHQ/OiBudW1iZXI7XG5cdG9yaWVudGF0aW9uPzogbnVtYmVyO1xufVxuXG4vLyBFWElGIHRhZyBJRHNcbmNvbnN0IFRBR19EQVRFX1RJTUVfT1JJR0lOQUwgPSAweDkwMDM7XG5jb25zdCBUQUdfTUFLRSA9IDB4MDEwRjtcbmNvbnN0IFRBR19NT0RFTCA9IDB4MDExMDtcbmNvbnN0IFRBR19JTUFHRV9XSURUSCA9IDB4QTAwMjtcbmNvbnN0IFRBR19JTUFHRV9IRUlHSFQgPSAweEEwMDM7XG5jb25zdCBUQUdfT1JJRU5UQVRJT04gPSAweDAxMTI7XG5jb25zdCBUQUdfRVhJRl9JRkQgPSAweDg3Njk7XG5cbi8qKlxuICogXHU0RUNFIEFycmF5QnVmZmVyIFx1ODlFM1x1Njc5MCBFWElGIFx1NjU3MFx1NjM2RVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VFeGlmKGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBFeGlmRGF0YSB7XG5cdGNvbnN0IHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcblx0Y29uc3QgcmVzdWx0OiBFeGlmRGF0YSA9IHt9O1xuXG5cdC8vIFx1NjhDMFx1NjdFNSBKUEVHIFNPSSBcdTY4MDdcdThCQjBcblx0aWYgKHZpZXcuZ2V0VWludDE2KDApICE9PSAweEZGRDgpIHtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0bGV0IG9mZnNldCA9IDI7XG5cdGNvbnN0IGxlbmd0aCA9IE1hdGgubWluKGJ1ZmZlci5ieXRlTGVuZ3RoLCA2NTUzNik7IC8vIFx1NTNFQVx1NjI2Qlx1NjNDRlx1NTI0RCA2NEtCXG5cblx0d2hpbGUgKG9mZnNldCA8IGxlbmd0aCkge1xuXHRcdGlmICh2aWV3LmdldFVpbnQ4KG9mZnNldCkgIT09IDB4RkYpIGJyZWFrO1xuXG5cdFx0Y29uc3QgbWFya2VyID0gdmlldy5nZXRVaW50OChvZmZzZXQgKyAxKTtcblx0XHRvZmZzZXQgKz0gMjtcblxuXHRcdC8vIEFQUDEgXHU2QkI1XHVGRjA4RVhJRiBcdTY1NzBcdTYzNkVcdUZGMDlcblx0XHRpZiAobWFya2VyID09PSAweEUxKSB7XG5cdFx0XHRjb25zdCBzZWdtZW50TGVuZ3RoID0gdmlldy5nZXRVaW50MTYob2Zmc2V0KTtcblxuXHRcdFx0Ly8gXHU2OEMwXHU2N0U1IFwiRXhpZlxcMFxcMFwiIFx1NjgwN1x1OEJDNlxuXHRcdFx0aWYgKHNlZ21lbnRMZW5ndGggPiA4ICYmXG5cdFx0XHRcdHZpZXcuZ2V0VWludDMyKG9mZnNldCArIDIpID09PSAweDQ1Nzg2OTY2ICYmIC8vIFwiRXhpZlwiXG5cdFx0XHRcdHZpZXcuZ2V0VWludDE2KG9mZnNldCArIDYpID09PSAweDAwMDApIHtcblxuXHRcdFx0XHRjb25zdCB0aWZmT2Zmc2V0ID0gb2Zmc2V0ICsgODtcblx0XHRcdFx0cGFyc2VUaWZmKHZpZXcsIHRpZmZPZmZzZXQsIHJlc3VsdCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fVxuXG5cdFx0Ly8gXHU1MTc2XHU0RUQ2XHU2QkI1XHVGRjFBXHU4REYzXHU4RkM3XG5cdFx0aWYgKG1hcmtlciA+PSAweEUwICYmIG1hcmtlciA8PSAweEVGIHx8IG1hcmtlciA9PT0gMHhGRSkge1xuXHRcdFx0Y29uc3Qgc2VnbWVudExlbmd0aCA9IHZpZXcuZ2V0VWludDE2KG9mZnNldCk7XG5cdFx0XHRvZmZzZXQgKz0gc2VnbWVudExlbmd0aDtcblx0XHR9IGVsc2UgaWYgKG1hcmtlciA9PT0gMHhEQSkge1xuXHRcdFx0Ly8gU09TIFx1NjgwN1x1OEJCMFx1RkYwQ1x1NEUwRFx1NTE4RFx1NjcwOSBFWElGXG5cdFx0XHRicmVhaztcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gXHU1QzFEXHU4QkQ1XHU4REYzXHU4RkM3XG5cdFx0XHRpZiAob2Zmc2V0ICsgMiA8PSBsZW5ndGgpIHtcblx0XHRcdFx0Y29uc3Qgc2VnbWVudExlbmd0aCA9IHZpZXcuZ2V0VWludDE2KG9mZnNldCk7XG5cdFx0XHRcdG9mZnNldCArPSBzZWdtZW50TGVuZ3RoO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBcdTg5RTNcdTY3OTAgVElGRiBcdTU5MzRcdTU0OEMgSUZEXG4gKi9cbmZ1bmN0aW9uIHBhcnNlVGlmZih2aWV3OiBEYXRhVmlldywgdGlmZlN0YXJ0OiBudW1iZXIsIHJlc3VsdDogRXhpZkRhdGEpOiB2b2lkIHtcblx0aWYgKHRpZmZTdGFydCArIDggPiB2aWV3LmJ5dGVMZW5ndGgpIHJldHVybjtcblxuXHQvLyBcdTVCNTdcdTgyODJcdTVFOEZcdTY4MDdcdThCQjBcblx0Y29uc3QgYnl0ZU9yZGVyID0gdmlldy5nZXRVaW50MTYodGlmZlN0YXJ0KTtcblx0Y29uc3QgbGl0dGxlRW5kaWFuID0gYnl0ZU9yZGVyID09PSAweDQ5NDk7IC8vIFwiSUlcIlxuXHRpZiAoYnl0ZU9yZGVyICE9PSAweDQ5NDkgJiYgYnl0ZU9yZGVyICE9PSAweDRENEQpIHJldHVybjsgLy8gXHU5NzVFIFwiSUlcIiBcdTRFNUZcdTk3NUUgXCJNTVwiXG5cblx0Ly8gVElGRiBcdTcyNDhcdTY3MkNcdTUzRjdcdUZGMDhcdTVFOTRcdTRFM0EgNDJcdUZGMDlcblx0aWYgKHZpZXcuZ2V0VWludDE2KHRpZmZTdGFydCArIDIsIGxpdHRsZUVuZGlhbikgIT09IDQyKSByZXR1cm47XG5cblx0Ly8gSUZEMCBcdTUwNEZcdTc5RkJcblx0Y29uc3QgaWZkME9mZnNldCA9IHZpZXcuZ2V0VWludDMyKHRpZmZTdGFydCArIDQsIGxpdHRsZUVuZGlhbik7XG5cdHBhcnNlSUZEKHZpZXcsIHRpZmZTdGFydCwgdGlmZlN0YXJ0ICsgaWZkME9mZnNldCwgbGl0dGxlRW5kaWFuLCByZXN1bHQsIHRydWUpO1xufVxuXG4vKipcbiAqIFx1ODlFM1x1Njc5MCBJRkRcdUZGMDhJbWFnZSBGaWxlIERpcmVjdG9yeVx1RkYwOVxuICovXG5mdW5jdGlvbiBwYXJzZUlGRChcblx0dmlldzogRGF0YVZpZXcsXG5cdHRpZmZTdGFydDogbnVtYmVyLFxuXHRpZmRPZmZzZXQ6IG51bWJlcixcblx0bGl0dGxlRW5kaWFuOiBib29sZWFuLFxuXHRyZXN1bHQ6IEV4aWZEYXRhLFxuXHRmb2xsb3dFeGlmSUZEOiBib29sZWFuXG4pOiB2b2lkIHtcblx0aWYgKGlmZE9mZnNldCArIDIgPiB2aWV3LmJ5dGVMZW5ndGgpIHJldHVybjtcblxuXHRjb25zdCBlbnRyeUNvdW50ID0gdmlldy5nZXRVaW50MTYoaWZkT2Zmc2V0LCBsaXR0bGVFbmRpYW4pO1xuXHRsZXQgb2Zmc2V0ID0gaWZkT2Zmc2V0ICsgMjtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGVudHJ5Q291bnQ7IGkrKykge1xuXHRcdGlmIChvZmZzZXQgKyAxMiA+IHZpZXcuYnl0ZUxlbmd0aCkgYnJlYWs7XG5cblx0XHRjb25zdCB0YWcgPSB2aWV3LmdldFVpbnQxNihvZmZzZXQsIGxpdHRsZUVuZGlhbik7XG5cdFx0Y29uc3QgdHlwZSA9IHZpZXcuZ2V0VWludDE2KG9mZnNldCArIDIsIGxpdHRsZUVuZGlhbik7XG5cdFx0Y29uc3QgY291bnQgPSB2aWV3LmdldFVpbnQzMihvZmZzZXQgKyA0LCBsaXR0bGVFbmRpYW4pO1xuXHRcdGNvbnN0IHZhbHVlT2Zmc2V0ID0gb2Zmc2V0ICsgODtcblxuXHRcdHN3aXRjaCAodGFnKSB7XG5cdFx0XHRjYXNlIFRBR19NQUtFOlxuXHRcdFx0XHRyZXN1bHQubWFrZSA9IHJlYWRTdHJpbmdWYWx1ZSh2aWV3LCB0aWZmU3RhcnQsIHZhbHVlT2Zmc2V0LCB0eXBlLCBjb3VudCwgbGl0dGxlRW5kaWFuKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFRBR19NT0RFTDpcblx0XHRcdFx0cmVzdWx0Lm1vZGVsID0gcmVhZFN0cmluZ1ZhbHVlKHZpZXcsIHRpZmZTdGFydCwgdmFsdWVPZmZzZXQsIHR5cGUsIGNvdW50LCBsaXR0bGVFbmRpYW4pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgVEFHX09SSUVOVEFUSU9OOlxuXHRcdFx0XHRyZXN1bHQub3JpZW50YXRpb24gPSByZWFkU2hvcnRWYWx1ZSh2aWV3LCB2YWx1ZU9mZnNldCwgbGl0dGxlRW5kaWFuKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFRBR19EQVRFX1RJTUVfT1JJR0lOQUw6XG5cdFx0XHRcdHJlc3VsdC5kYXRlVGltZU9yaWdpbmFsID0gcmVhZFN0cmluZ1ZhbHVlKHZpZXcsIHRpZmZTdGFydCwgdmFsdWVPZmZzZXQsIHR5cGUsIGNvdW50LCBsaXR0bGVFbmRpYW4pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgVEFHX0lNQUdFX1dJRFRIOlxuXHRcdFx0XHRyZXN1bHQuaW1hZ2VXaWR0aCA9IHJlYWRMb25nT3JTaG9ydCh2aWV3LCB2YWx1ZU9mZnNldCwgdHlwZSwgbGl0dGxlRW5kaWFuKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFRBR19JTUFHRV9IRUlHSFQ6XG5cdFx0XHRcdHJlc3VsdC5pbWFnZUhlaWdodCA9IHJlYWRMb25nT3JTaG9ydCh2aWV3LCB2YWx1ZU9mZnNldCwgdHlwZSwgbGl0dGxlRW5kaWFuKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFRBR19FWElGX0lGRDpcblx0XHRcdFx0aWYgKGZvbGxvd0V4aWZJRkQpIHtcblx0XHRcdFx0XHRjb25zdCBleGlmT2Zmc2V0ID0gdmlldy5nZXRVaW50MzIodmFsdWVPZmZzZXQsIGxpdHRsZUVuZGlhbik7XG5cdFx0XHRcdFx0cGFyc2VJRkQodmlldywgdGlmZlN0YXJ0LCB0aWZmU3RhcnQgKyBleGlmT2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHJlc3VsdCwgZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHRcdG9mZnNldCArPSAxMjtcblx0fVxufVxuXG5mdW5jdGlvbiByZWFkU2hvcnRWYWx1ZSh2aWV3OiBEYXRhVmlldywgb2Zmc2V0OiBudW1iZXIsIGxpdHRsZUVuZGlhbjogYm9vbGVhbik6IG51bWJlciB7XG5cdGlmIChvZmZzZXQgKyAyID4gdmlldy5ieXRlTGVuZ3RoKSByZXR1cm4gMDtcblx0cmV0dXJuIHZpZXcuZ2V0VWludDE2KG9mZnNldCwgbGl0dGxlRW5kaWFuKTtcbn1cblxuZnVuY3Rpb24gcmVhZExvbmdPclNob3J0KHZpZXc6IERhdGFWaWV3LCBvZmZzZXQ6IG51bWJlciwgdHlwZTogbnVtYmVyLCBsaXR0bGVFbmRpYW46IGJvb2xlYW4pOiBudW1iZXIge1xuXHRpZiAodHlwZSA9PT0gMykgeyAvLyBTSE9SVFxuXHRcdHJldHVybiByZWFkU2hvcnRWYWx1ZSh2aWV3LCBvZmZzZXQsIGxpdHRsZUVuZGlhbik7XG5cdH1cblx0aWYgKG9mZnNldCArIDQgPiB2aWV3LmJ5dGVMZW5ndGgpIHJldHVybiAwO1xuXHRyZXR1cm4gdmlldy5nZXRVaW50MzIob2Zmc2V0LCBsaXR0bGVFbmRpYW4pO1xufVxuXG5mdW5jdGlvbiByZWFkU3RyaW5nVmFsdWUoXG5cdHZpZXc6IERhdGFWaWV3LFxuXHR0aWZmU3RhcnQ6IG51bWJlcixcblx0dmFsdWVPZmZzZXQ6IG51bWJlcixcblx0dHlwZTogbnVtYmVyLFxuXHRjb3VudDogbnVtYmVyLFxuXHRsaXR0bGVFbmRpYW46IGJvb2xlYW5cbik6IHN0cmluZyB7XG5cdGlmICh0eXBlICE9PSAyKSByZXR1cm4gJyc7IC8vIEFTQ0lJIHR5cGVcblxuXHRsZXQgZGF0YU9mZnNldDogbnVtYmVyO1xuXHRpZiAoY291bnQgPD0gNCkge1xuXHRcdGRhdGFPZmZzZXQgPSB2YWx1ZU9mZnNldDtcblx0fSBlbHNlIHtcblx0XHRpZiAodmFsdWVPZmZzZXQgKyA0ID4gdmlldy5ieXRlTGVuZ3RoKSByZXR1cm4gJyc7XG5cdFx0ZGF0YU9mZnNldCA9IHRpZmZTdGFydCArIHZpZXcuZ2V0VWludDMyKHZhbHVlT2Zmc2V0LCBsaXR0bGVFbmRpYW4pO1xuXHR9XG5cblx0aWYgKGRhdGFPZmZzZXQgKyBjb3VudCA+IHZpZXcuYnl0ZUxlbmd0aCkgcmV0dXJuICcnO1xuXG5cdGxldCBzdHIgPSAnJztcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudCAtIDE7IGkrKykgeyAvLyAtMSB0byBleGNsdWRlIG51bGwgdGVybWluYXRvclxuXHRcdGNvbnN0IGNoYXJDb2RlID0gdmlldy5nZXRVaW50OChkYXRhT2Zmc2V0ICsgaSk7XG5cdFx0aWYgKGNoYXJDb2RlID09PSAwKSBicmVhaztcblx0XHRzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaGFyQ29kZSk7XG5cdH1cblxuXHRyZXR1cm4gc3RyLnRyaW0oKTtcbn1cblxuLyoqXG4gKiBcdTRFQ0UgRVhJRiBcdTY1RTVcdTY3MUZcdTVCNTdcdTdCMjZcdTRFMzJcdTg5RTNcdTY3OTAgRGF0ZSBcdTVCRjlcdThDNjFcbiAqIFx1NjgzQ1x1NUYwRjogXCJZWVlZOk1NOkREIEhIOm1tOnNzXCJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRXhpZkRhdGUoZGF0ZVN0cjogc3RyaW5nKTogRGF0ZSB8IG51bGwge1xuXHRjb25zdCBtYXRjaCA9IGRhdGVTdHIubWF0Y2goL14oXFxkezR9KTooXFxkezJ9KTooXFxkezJ9KVxccysoXFxkezJ9KTooXFxkezJ9KTooXFxkezJ9KS8pO1xuXHRpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcblxuXHRjb25zdCBbLCB5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZF0gPSBtYXRjaDtcblx0cmV0dXJuIG5ldyBEYXRlKFxuXHRcdHBhcnNlSW50KHllYXIpLCBwYXJzZUludChtb250aCkgLSAxLCBwYXJzZUludChkYXkpLFxuXHRcdHBhcnNlSW50KGhvdXIpLCBwYXJzZUludChtaW51dGUpLCBwYXJzZUludChzZWNvbmQpXG5cdCk7XG59XG4iLCAiLyoqXG4gKiBcdTg5QzRcdTUyMTlcdTVGMTVcdTY0Q0VcdUZGMUFcdTU3RkFcdTRFOEVcdTY1RTVcdTY3MUYgKyBcdTdDN0JcdTU3OEIgKyBFWElGIFx1NEZFMVx1NjA2Rlx1ODFFQVx1NTJBOFx1NjU3NFx1NzQwNlx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlxuICovXG5cbmltcG9ydCB7IFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgT3JnYW5pemVSdWxlIH0gZnJvbSAnLi4vc2V0dGluZ3MnO1xuaW1wb3J0IHsgZ2V0RmlsZUV4dGVuc2lvbiwgZ2V0TWVkaWFUeXBlIH0gZnJvbSAnLi9tZWRpYVR5cGVzJztcbmltcG9ydCB7IEV4aWZEYXRhLCBwYXJzZUV4aWZEYXRlIH0gZnJvbSAnLi9leGlmUmVhZGVyJztcblxuZXhwb3J0IGludGVyZmFjZSBPcmdhbml6ZUNvbnRleHQge1xuXHRmaWxlOiBURmlsZTtcblx0ZGF0ZTogRGF0ZTtcblx0ZXhpZj86IEV4aWZEYXRhO1xuXHR0YWdzPzogc3RyaW5nW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3JnYW5pemVUYXJnZXQge1xuXHRvcmlnaW5hbFBhdGg6IHN0cmluZztcblx0bmV3UGF0aDogc3RyaW5nO1xuXHRuZXdOYW1lOiBzdHJpbmc7XG59XG5cbi8qKlxuICogXHU2N0U1XHU2MjdFXHU1MzM5XHU5MTREXHU3Njg0XHU3QjJDXHU0RTAwXHU2NzYxXHU4OUM0XHU1MjE5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTWF0Y2hpbmdSdWxlKFxuXHRydWxlczogT3JnYW5pemVSdWxlW10sXG5cdGZpbGU6IFRGaWxlLFxuXHRtZXRhZGF0YT86IHsgZXhpZj86IEV4aWZEYXRhOyB0YWdzPzogc3RyaW5nW10gfVxuKTogT3JnYW5pemVSdWxlIHwgbnVsbCB7XG5cdGNvbnN0IGV4dCA9IGdldEZpbGVFeHRlbnNpb24oZmlsZS5uYW1lKS5yZXBsYWNlKCcuJywgJycpLnRvTG93ZXJDYXNlKCk7XG5cblx0Zm9yIChjb25zdCBydWxlIG9mIHJ1bGVzKSB7XG5cdFx0aWYgKCFydWxlLmVuYWJsZWQpIGNvbnRpbnVlO1xuXG5cdFx0Ly8gXHU2OEMwXHU2N0U1XHU2MjY5XHU1QzU1XHU1NDBEXHU1MzM5XHU5MTREXG5cdFx0aWYgKHJ1bGUubWF0Y2hFeHRlbnNpb25zKSB7XG5cdFx0XHRjb25zdCBhbGxvd2VkRXh0cyA9IHJ1bGUubWF0Y2hFeHRlbnNpb25zXG5cdFx0XHRcdC5zcGxpdCgnLCcpXG5cdFx0XHRcdC5tYXAoZSA9PiBlLnRyaW0oKS50b0xvd2VyQ2FzZSgpKTtcblxuXHRcdFx0aWYgKCFhbGxvd2VkRXh0cy5pbmNsdWRlcyhleHQpKSBjb250aW51ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcnVsZTtcblx0fVxuXG5cdHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFx1NjgzOVx1NjM2RVx1ODlDNFx1NTIxOVx1NTQ4Q1x1NEUwQVx1NEUwQlx1NjU4N1x1OEJBMVx1N0I5N1x1NzZFRVx1NjgwN1x1OERFRlx1NUY4NFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZVRhcmdldChydWxlOiBPcmdhbml6ZVJ1bGUsIGN0eDogT3JnYW5pemVDb250ZXh0KTogT3JnYW5pemVUYXJnZXQge1xuXHRjb25zdCBleHQgPSBnZXRGaWxlRXh0ZW5zaW9uKGN0eC5maWxlLm5hbWUpO1xuXHRjb25zdCBiYXNlTmFtZSA9IGN0eC5maWxlLm5hbWUucmVwbGFjZSgvXFwuW14uXSskLywgJycpO1xuXHRjb25zdCBtZWRpYVR5cGUgPSBnZXRNZWRpYVR5cGUoY3R4LmZpbGUubmFtZSkgfHwgJ290aGVyJztcblxuXHQvLyBcdTRGMThcdTUxNDhcdTRGN0ZcdTc1MjggRVhJRiBcdTY1RTVcdTY3MUZcblx0bGV0IGRhdGUgPSBjdHguZGF0ZTtcblx0aWYgKGN0eC5leGlmPy5kYXRlVGltZU9yaWdpbmFsKSB7XG5cdFx0Y29uc3QgZXhpZkRhdGUgPSBwYXJzZUV4aWZEYXRlKGN0eC5leGlmLmRhdGVUaW1lT3JpZ2luYWwpO1xuXHRcdGlmIChleGlmRGF0ZSkgZGF0ZSA9IGV4aWZEYXRlO1xuXHR9XG5cblx0Y29uc3QgeWVhciA9IFN0cmluZyhkYXRlLmdldEZ1bGxZZWFyKCkpO1xuXHRjb25zdCBtb250aCA9IFN0cmluZyhkYXRlLmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCAnMCcpO1xuXHRjb25zdCBkYXkgPSBTdHJpbmcoZGF0ZS5nZXREYXRlKCkpLnBhZFN0YXJ0KDIsICcwJyk7XG5cblx0Y29uc3QgY2FtZXJhID0gY3R4LmV4aWY/Lm1ha2Vcblx0XHQ/IGAke2N0eC5leGlmLm1ha2V9JHtjdHguZXhpZi5tb2RlbCA/ICcgJyArIGN0eC5leGlmLm1vZGVsIDogJyd9YFxuXHRcdDogJ1Vua25vd24nO1xuXG5cdGNvbnN0IHRhZyA9IGN0eC50YWdzPy5bMF0gfHwgJ3VudGFnZ2VkJztcblxuXHRjb25zdCB2YXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuXHRcdCd7eWVhcn0nOiB5ZWFyLFxuXHRcdCd7bW9udGh9JzogbW9udGgsXG5cdFx0J3tkYXl9JzogZGF5LFxuXHRcdCd7ZXh0fSc6IGV4dC5yZXBsYWNlKCcuJywgJycpLFxuXHRcdCd7bmFtZX0nOiBiYXNlTmFtZSxcblx0XHQne2NhbWVyYX0nOiBzYW5pdGl6ZUZpbGVOYW1lKGNhbWVyYSksXG5cdFx0J3t0eXBlfSc6IG1lZGlhVHlwZSxcblx0XHQne3RhZ30nOiBzYW5pdGl6ZUZpbGVOYW1lKHRhZylcblx0fTtcblxuXHQvLyBcdTVDNTVcdTVGMDBcdThERUZcdTVGODRcdTZBMjFcdTY3N0Zcblx0bGV0IG5ld0RpciA9IHJ1bGUucGF0aFRlbXBsYXRlO1xuXHRmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyh2YXJzKSkge1xuXHRcdG5ld0RpciA9IG5ld0Rpci5yZXBsYWNlKG5ldyBSZWdFeHAoZXNjYXBlUmVnZXgoa2V5KSwgJ2cnKSwgdmFsdWUpO1xuXHR9XG5cblx0Ly8gXHU1QzU1XHU1RjAwXHU2NTg3XHU0RUY2XHU1NDBEXHU2QTIxXHU2NzdGXG5cdGxldCBuZXdOYW1lID0gcnVsZS5yZW5hbWVUZW1wbGF0ZSB8fCAne25hbWV9Jztcblx0Zm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXModmFycykpIHtcblx0XHRuZXdOYW1lID0gbmV3TmFtZS5yZXBsYWNlKG5ldyBSZWdFeHAoZXNjYXBlUmVnZXgoa2V5KSwgJ2cnKSwgdmFsdWUpO1xuXHR9XG5cblx0Ly8gXHU3ODZFXHU0RkREXHU2NTg3XHU0RUY2XHU1NDBEXHU2NzA5XHU2MjY5XHU1QzU1XHU1NDBEXG5cdGlmICghbmV3TmFtZS5lbmRzV2l0aChleHQpKSB7XG5cdFx0bmV3TmFtZSA9IG5ld05hbWUgKyBleHQ7XG5cdH1cblxuXHQvLyBcdTZFMDVcdTc0MDZcdThERUZcdTVGODRcblx0bmV3RGlyID0gbmV3RGlyLnJlcGxhY2UoL1xcLysvZywgJy8nKS5yZXBsYWNlKC9eXFwvfFxcLyQvZywgJycpO1xuXG5cdGNvbnN0IG5ld1BhdGggPSBuZXdEaXIgPyBgJHtuZXdEaXJ9LyR7bmV3TmFtZX1gIDogbmV3TmFtZTtcblxuXHRyZXR1cm4ge1xuXHRcdG9yaWdpbmFsUGF0aDogY3R4LmZpbGUucGF0aCxcblx0XHRuZXdQYXRoLFxuXHRcdG5ld05hbWVcblx0fTtcbn1cblxuLyoqXG4gKiBcdTZFMDVcdTc0MDZcdTY1ODdcdTRFRjZcdTU0MERcdTRFMkRcdTc2ODRcdTk3NUVcdTZDRDVcdTVCNTdcdTdCMjZcbiAqL1xuZnVuY3Rpb24gc2FuaXRpemVGaWxlTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRyZXR1cm4gbmFtZVxuXHRcdC5yZXBsYWNlKC9bL1xcXFw6Kj9cIjw+fF0vZywgJ18nKVxuXHRcdC5yZXBsYWNlKC9cXHMrL2csICdfJylcblx0XHQucmVwbGFjZSgvXysvZywgJ18nKVxuXHRcdC50cmltKCk7XG59XG5cbi8qKlxuICogXHU4RjZDXHU0RTQ5XHU2QjYzXHU1MjE5XHU4ODY4XHU4RkJFXHU1RjBGXHU3Mjc5XHU2QjhBXHU1QjU3XHU3QjI2XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVJlZ2V4KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcblx0cmV0dXJuIHN0ci5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgJ1xcXFwkJicpO1xufVxuIiwgIi8qKlxuICogQ2FudmFzIFx1NUE5Mlx1NEY1M1x1NTkwNFx1NzQwNlx1NTY2OFxuICogXHU0RjdGXHU3NTI4IENhbnZhcyBBUEkgXHU1QjlFXHU3M0IwXHU1NkZFXHU3MjQ3XHU1MzhCXHU3RjI5L1x1OEY2Q1x1NjM2Mi9cdTZDMzRcdTUzNzAvXHU4OEMxXHU1MjZBXG4gKiBcdTdFQUZcdTZENEZcdTg5QzhcdTU2NjhcdTVCOUVcdTczQjBcdUZGMENcdTY1RTBcdTUzOUZcdTc1MUZcdTRGOURcdThENTZcbiAqL1xuXG5leHBvcnQgaW50ZXJmYWNlIFByb2Nlc3NPcHRpb25zIHtcblx0cXVhbGl0eT86IG51bWJlcjsgICAgICAgIC8vIDAtMTAwLCBkZWZhdWx0IDgwXG5cdG1heFdpZHRoPzogbnVtYmVyO1xuXHRtYXhIZWlnaHQ/OiBudW1iZXI7XG5cdGZvcm1hdD86ICd3ZWJwJyB8ICdqcGVnJyB8ICdwbmcnO1xuXHR3YXRlcm1hcms/OiB7XG5cdFx0dGV4dDogc3RyaW5nO1xuXHRcdHBvc2l0aW9uOiAnY2VudGVyJyB8ICdib3R0b20tcmlnaHQnIHwgJ2JvdHRvbS1sZWZ0Jztcblx0XHRvcGFjaXR5OiBudW1iZXI7ICAgICAgIC8vIDAtMVxuXHRcdGZvbnRTaXplPzogbnVtYmVyOyAgICAgLy8gZGVmYXVsdCAyNFxuXHR9O1xuXHRjcm9wPzoge1xuXHRcdHg6IG51bWJlcjtcblx0XHR5OiBudW1iZXI7XG5cdFx0d2lkdGg6IG51bWJlcjtcblx0XHRoZWlnaHQ6IG51bWJlcjtcblx0fTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9jZXNzUmVzdWx0IHtcblx0YmxvYjogQmxvYjtcblx0d2lkdGg6IG51bWJlcjtcblx0aGVpZ2h0OiBudW1iZXI7XG5cdG9yaWdpbmFsU2l6ZTogbnVtYmVyO1xuXHRuZXdTaXplOiBudW1iZXI7XG5cdGZvcm1hdDogc3RyaW5nO1xufVxuXG5jb25zdCBNSU1FX01BUDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcblx0J3dlYnAnOiAnaW1hZ2Uvd2VicCcsXG5cdCdqcGVnJzogJ2ltYWdlL2pwZWcnLFxuXHQnanBnJzogJ2ltYWdlL2pwZWcnLFxuXHQncG5nJzogJ2ltYWdlL3BuZycsXG5cdCdhdmlmJzogJ2ltYWdlL2F2aWYnXG59O1xuXG4vKipcbiAqIFx1NjhDMFx1NkQ0Qlx1NkQ0Rlx1ODlDOFx1NTY2OFx1NjYyRlx1NTQyNlx1NjUyRlx1NjMwMVx1NjdEMFx1NzlDRFx1OEY5M1x1NTFGQVx1NjgzQ1x1NUYwRlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNGb3JtYXRTdXBwb3J0ZWQoZm9ybWF0OiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0Y29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdGNhbnZhcy53aWR0aCA9IDE7XG5cdGNhbnZhcy5oZWlnaHQgPSAxO1xuXHRjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblx0aWYgKCFjdHgpIHJldHVybiBmYWxzZTtcblx0Y3R4LmZpbGxSZWN0KDAsIDAsIDEsIDEpO1xuXG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuXHRcdGNhbnZhcy50b0Jsb2IoXG5cdFx0XHQoYmxvYikgPT4gcmVzb2x2ZShibG9iICE9PSBudWxsICYmIGJsb2Iuc2l6ZSA+IDApLFxuXHRcdFx0TUlNRV9NQVBbZm9ybWF0XSB8fCBgaW1hZ2UvJHtmb3JtYXR9YFxuXHRcdCk7XG5cdH0pO1xufVxuXG4vKipcbiAqIFx1NTJBMFx1OEY3RFx1NTZGRVx1NzI0N1xuICovXG5mdW5jdGlvbiBsb2FkSW1hZ2Uoc3JjOiBzdHJpbmcpOiBQcm9taXNlPEhUTUxJbWFnZUVsZW1lbnQ+IHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRpbWcuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcblx0XHRpbWcub25sb2FkID0gKCkgPT4gcmVzb2x2ZShpbWcpO1xuXHRcdGltZy5vbmVycm9yID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGxvYWQgaW1hZ2U6ICR7c3JjfWApKTtcblx0XHRpbWcuc3JjID0gc3JjO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBcdTU5MDRcdTc0MDZcdTUzNTVcdTVGMjBcdTU2RkVcdTcyNDdcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NJbWFnZShcblx0c3JjOiBzdHJpbmcsXG5cdG9yaWdpbmFsU2l6ZTogbnVtYmVyLFxuXHRvcHRpb25zOiBQcm9jZXNzT3B0aW9ucyA9IHt9XG4pOiBQcm9taXNlPFByb2Nlc3NSZXN1bHQ+IHtcblx0Y29uc3QgaW1nID0gYXdhaXQgbG9hZEltYWdlKHNyYyk7XG5cblx0bGV0IHsgd2lkdGg6IHNyY1csIGhlaWdodDogc3JjSCB9ID0gaW1nO1xuXHRsZXQgZHJhd1ggPSAwO1xuXHRsZXQgZHJhd1kgPSAwO1xuXHRsZXQgZHJhd1cgPSBzcmNXO1xuXHRsZXQgZHJhd0ggPSBzcmNIO1xuXG5cdC8vIFx1ODhDMVx1NTI2QVxuXHRpZiAob3B0aW9ucy5jcm9wKSB7XG5cdFx0ZHJhd1ggPSAtb3B0aW9ucy5jcm9wLng7XG5cdFx0ZHJhd1kgPSAtb3B0aW9ucy5jcm9wLnk7XG5cdFx0c3JjVyA9IG9wdGlvbnMuY3JvcC53aWR0aDtcblx0XHRzcmNIID0gb3B0aW9ucy5jcm9wLmhlaWdodDtcblx0fVxuXG5cdC8vIFx1N0YyOVx1NjUzRVx1N0VBNlx1Njc1RlxuXHRsZXQgdGFyZ2V0VyA9IHNyY1c7XG5cdGxldCB0YXJnZXRIID0gc3JjSDtcblxuXHRpZiAob3B0aW9ucy5tYXhXaWR0aCB8fCBvcHRpb25zLm1heEhlaWdodCkge1xuXHRcdGNvbnN0IG1heFcgPSBvcHRpb25zLm1heFdpZHRoIHx8IEluZmluaXR5O1xuXHRcdGNvbnN0IG1heEggPSBvcHRpb25zLm1heEhlaWdodCB8fCBJbmZpbml0eTtcblx0XHRjb25zdCByYXRpbyA9IE1hdGgubWluKG1heFcgLyBzcmNXLCBtYXhIIC8gc3JjSCwgMSk7XG5cdFx0dGFyZ2V0VyA9IE1hdGgucm91bmQoc3JjVyAqIHJhdGlvKTtcblx0XHR0YXJnZXRIID0gTWF0aC5yb3VuZChzcmNIICogcmF0aW8pO1xuXHR9XG5cblx0Y29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdGNhbnZhcy53aWR0aCA9IHRhcmdldFc7XG5cdGNhbnZhcy5oZWlnaHQgPSB0YXJnZXRIO1xuXG5cdGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXHRpZiAoIWN0eCkgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZ2V0IGNhbnZhcyBjb250ZXh0Jyk7XG5cblx0Ly8gXHU3RUQ4XHU1MjM2XHU1NkZFXHU3MjQ3XG5cdGlmIChvcHRpb25zLmNyb3ApIHtcblx0XHRjb25zdCBzY2FsZVggPSB0YXJnZXRXIC8gc3JjVztcblx0XHRjb25zdCBzY2FsZVkgPSB0YXJnZXRIIC8gc3JjSDtcblx0XHRjdHguZHJhd0ltYWdlKFxuXHRcdFx0aW1nLFxuXHRcdFx0b3B0aW9ucy5jcm9wLngsIG9wdGlvbnMuY3JvcC55LCBvcHRpb25zLmNyb3Aud2lkdGgsIG9wdGlvbnMuY3JvcC5oZWlnaHQsXG5cdFx0XHQwLCAwLCB0YXJnZXRXLCB0YXJnZXRIXG5cdFx0KTtcblx0fSBlbHNlIHtcblx0XHRjdHguZHJhd0ltYWdlKGltZywgMCwgMCwgdGFyZ2V0VywgdGFyZ2V0SCk7XG5cdH1cblxuXHQvLyBcdTZDMzRcdTUzNzBcblx0aWYgKG9wdGlvbnMud2F0ZXJtYXJrPy50ZXh0KSB7XG5cdFx0Y29uc3Qgd20gPSBvcHRpb25zLndhdGVybWFyaztcblx0XHRjb25zdCBmb250U2l6ZSA9IHdtLmZvbnRTaXplIHx8IE1hdGgubWF4KDE2LCBNYXRoLnJvdW5kKHRhcmdldFcgLyAzMCkpO1xuXG5cdFx0Y3R4LnNhdmUoKTtcblx0XHRjdHguZ2xvYmFsQWxwaGEgPSB3bS5vcGFjaXR5O1xuXHRcdGN0eC5mb250ID0gYCR7Zm9udFNpemV9cHggc2Fucy1zZXJpZmA7XG5cdFx0Y3R4LmZpbGxTdHlsZSA9ICcjZmZmZmZmJztcblx0XHRjdHguc3Ryb2tlU3R5bGUgPSAnIzAwMDAwMCc7XG5cdFx0Y3R4LmxpbmVXaWR0aCA9IDI7XG5cblx0XHRjb25zdCB0ZXh0TWV0cmljcyA9IGN0eC5tZWFzdXJlVGV4dCh3bS50ZXh0KTtcblx0XHRsZXQgdGV4dFg6IG51bWJlcjtcblx0XHRsZXQgdGV4dFk6IG51bWJlcjtcblxuXHRcdHN3aXRjaCAod20ucG9zaXRpb24pIHtcblx0XHRcdGNhc2UgJ2NlbnRlcic6XG5cdFx0XHRcdHRleHRYID0gKHRhcmdldFcgLSB0ZXh0TWV0cmljcy53aWR0aCkgLyAyO1xuXHRcdFx0XHR0ZXh0WSA9IHRhcmdldEggLyAyICsgZm9udFNpemUgLyAyO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2JvdHRvbS1sZWZ0Jzpcblx0XHRcdFx0dGV4dFggPSAyMDtcblx0XHRcdFx0dGV4dFkgPSB0YXJnZXRIIC0gMjA7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnYm90dG9tLXJpZ2h0Jzpcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRleHRYID0gdGFyZ2V0VyAtIHRleHRNZXRyaWNzLndpZHRoIC0gMjA7XG5cdFx0XHRcdHRleHRZID0gdGFyZ2V0SCAtIDIwO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRjdHguc3Ryb2tlVGV4dCh3bS50ZXh0LCB0ZXh0WCwgdGV4dFkpO1xuXHRcdGN0eC5maWxsVGV4dCh3bS50ZXh0LCB0ZXh0WCwgdGV4dFkpO1xuXHRcdGN0eC5yZXN0b3JlKCk7XG5cdH1cblxuXHQvLyBcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcdTU0OENcdThEMjhcdTkxQ0Zcblx0Y29uc3QgZm9ybWF0ID0gb3B0aW9ucy5mb3JtYXQgfHwgJ3dlYnAnO1xuXHRjb25zdCBxdWFsaXR5ID0gKG9wdGlvbnMucXVhbGl0eSA/PyA4MCkgLyAxMDA7XG5cdGNvbnN0IG1pbWVUeXBlID0gTUlNRV9NQVBbZm9ybWF0XSB8fCAnaW1hZ2Uvd2VicCc7XG5cblx0Y29uc3QgYmxvYiA9IGF3YWl0IG5ldyBQcm9taXNlPEJsb2I+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjYW52YXMudG9CbG9iKFxuXHRcdFx0KGIpID0+IHtcblx0XHRcdFx0aWYgKGIpIHJlc29sdmUoYik7XG5cdFx0XHRcdGVsc2UgcmVqZWN0KG5ldyBFcnJvcignQ2FudmFzIHRvQmxvYiByZXR1cm5lZCBudWxsJykpO1xuXHRcdFx0fSxcblx0XHRcdG1pbWVUeXBlLFxuXHRcdFx0cXVhbGl0eVxuXHRcdCk7XG5cdH0pO1xuXG5cdHJldHVybiB7XG5cdFx0YmxvYixcblx0XHR3aWR0aDogdGFyZ2V0Vyxcblx0XHRoZWlnaHQ6IHRhcmdldEgsXG5cdFx0b3JpZ2luYWxTaXplLFxuXHRcdG5ld1NpemU6IGJsb2Iuc2l6ZSxcblx0XHRmb3JtYXRcblx0fTtcbn1cblxuLyoqXG4gKiBcdTYyNzlcdTkxQ0ZcdTU5MDRcdTc0MDZcdTU2RkVcdTcyNDdcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJhdGNoUHJvY2Vzcyhcblx0ZmlsZXM6IEFycmF5PHsgc3JjOiBzdHJpbmc7IG9yaWdpbmFsU2l6ZTogbnVtYmVyOyBuYW1lOiBzdHJpbmcgfT4sXG5cdG9wdGlvbnM6IFByb2Nlc3NPcHRpb25zLFxuXHRvblByb2dyZXNzPzogKHByb2Nlc3NlZDogbnVtYmVyLCB0b3RhbDogbnVtYmVyLCBjdXJyZW50TmFtZTogc3RyaW5nKSA9PiB2b2lkXG4pOiBQcm9taXNlPEFycmF5PHsgbmFtZTogc3RyaW5nOyByZXN1bHQ6IFByb2Nlc3NSZXN1bHQgfCBudWxsOyBlcnJvcj86IHN0cmluZyB9Pj4ge1xuXHRjb25zdCByZXN1bHRzOiBBcnJheTx7IG5hbWU6IHN0cmluZzsgcmVzdWx0OiBQcm9jZXNzUmVzdWx0IHwgbnVsbDsgZXJyb3I/OiBzdHJpbmcgfT4gPSBbXTtcblxuXHRmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0Y29uc3QgZmlsZSA9IGZpbGVzW2ldO1xuXHRcdGlmIChvblByb2dyZXNzKSBvblByb2dyZXNzKGksIGZpbGVzLmxlbmd0aCwgZmlsZS5uYW1lKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBwcm9jZXNzSW1hZ2UoZmlsZS5zcmMsIGZpbGUub3JpZ2luYWxTaXplLCBvcHRpb25zKTtcblx0XHRcdHJlc3VsdHMucHVzaCh7IG5hbWU6IGZpbGUubmFtZSwgcmVzdWx0IH0pO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRyZXN1bHRzLnB1c2goe1xuXHRcdFx0XHRuYW1lOiBmaWxlLm5hbWUsXG5cdFx0XHRcdHJlc3VsdDogbnVsbCxcblx0XHRcdFx0ZXJyb3I6IChlcnJvciBhcyBFcnJvcikubWVzc2FnZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKG9uUHJvZ3Jlc3MpIG9uUHJvZ3Jlc3MoZmlsZXMubGVuZ3RoLCBmaWxlcy5sZW5ndGgsICcnKTtcblxuXHRyZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBcdTRFQ0VcdTg5QzZcdTk4OTFcdTYyMkFcdTUzRDZcdTVFMjdcdTRGNUNcdTRFM0FcdTdGMjlcdTc1NjVcdTU2RkVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RWaWRlb0ZyYW1lKFxuXHR2aWRlb1NyYzogc3RyaW5nLFxuXHRzZWVrVGltZTogbnVtYmVyID0gMVxuKTogUHJvbWlzZTx7IGJsb2I6IEJsb2I7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0+IHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRjb25zdCB2aWRlbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3ZpZGVvJyk7XG5cdFx0dmlkZW8uY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcblx0XHR2aWRlby5tdXRlZCA9IHRydWU7XG5cdFx0dmlkZW8ucHJlbG9hZCA9ICdtZXRhZGF0YSc7XG5cblx0XHR2aWRlby5hZGRFdmVudExpc3RlbmVyKCdsb2FkZWRtZXRhZGF0YScsICgpID0+IHtcblx0XHRcdHZpZGVvLmN1cnJlbnRUaW1lID0gTWF0aC5taW4oc2Vla1RpbWUsIHZpZGVvLmR1cmF0aW9uICogMC4xKTtcblx0XHR9KTtcblxuXHRcdHZpZGVvLmFkZEV2ZW50TGlzdGVuZXIoJ3NlZWtlZCcsICgpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRcdFx0XHRjYW52YXMud2lkdGggPSB2aWRlby52aWRlb1dpZHRoO1xuXHRcdFx0XHRjYW52YXMuaGVpZ2h0ID0gdmlkZW8udmlkZW9IZWlnaHQ7XG5cblx0XHRcdFx0Y29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0XHRcdGlmICghY3R4KSB7XG5cdFx0XHRcdFx0cmVqZWN0KG5ldyBFcnJvcignQ2Fubm90IGdldCBjYW52YXMgY29udGV4dCcpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjdHguZHJhd0ltYWdlKHZpZGVvLCAwLCAwKTtcblxuXHRcdFx0XHRjYW52YXMudG9CbG9iKFxuXHRcdFx0XHRcdChibG9iKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoYmxvYikge1xuXHRcdFx0XHRcdFx0XHRyZXNvbHZlKHtcblx0XHRcdFx0XHRcdFx0XHRibG9iLFxuXHRcdFx0XHRcdFx0XHRcdHdpZHRoOiB2aWRlby52aWRlb1dpZHRoLFxuXHRcdFx0XHRcdFx0XHRcdGhlaWdodDogdmlkZW8udmlkZW9IZWlnaHRcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRyZWplY3QobmV3IEVycm9yKCdWaWRlbyBmcmFtZSBleHRyYWN0aW9uIGZhaWxlZCcpKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdCdpbWFnZS93ZWJwJyxcblx0XHRcdFx0XHQwLjhcblx0XHRcdFx0KTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdHJlamVjdChlcnJvcik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR2aWRlby5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdHJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBsb2FkIHZpZGVvOiAke3ZpZGVvU3JjfWApKTtcblx0XHR9KTtcblxuXHRcdHZpZGVvLnNyYyA9IHZpZGVvU3JjO1xuXHR9KTtcbn1cblxuLyoqXG4gKiBcdTgzQjdcdTUzRDZcdThGOTNcdTUxRkFcdTY4M0NcdTVGMEZcdTc2ODRcdTY1ODdcdTRFRjZcdTYyNjlcdTVDNTVcdTU0MERcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1hdEV4dGVuc2lvbihmb3JtYXQ6IHN0cmluZyk6IHN0cmluZyB7XG5cdHN3aXRjaCAoZm9ybWF0KSB7XG5cdFx0Y2FzZSAnanBlZyc6IHJldHVybiAnLmpwZyc7XG5cdFx0Y2FzZSAnd2VicCc6IHJldHVybiAnLndlYnAnO1xuXHRcdGNhc2UgJ3BuZyc6IHJldHVybiAnLnBuZyc7XG5cdFx0Y2FzZSAnYXZpZic6IHJldHVybiAnLmF2aWYnO1xuXHRcdGRlZmF1bHQ6IHJldHVybiBgLiR7Zm9ybWF0fWA7XG5cdH1cbn1cbiIsICJpbXBvcnQgeyBURmlsZSwgSXRlbVZpZXcsIFdvcmtzcGFjZUxlYWYsIHNldEljb24sIE1lbnUsIE1lbnVJdGVtLCBOb3RpY2UgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgSW1hZ2VNYW5hZ2VyUGx1Z2luIGZyb20gJy4uL21haW4nO1xuaW1wb3J0IHsgRGVsZXRlQ29uZmlybU1vZGFsIH0gZnJvbSAnLi9EZWxldGVDb25maXJtTW9kYWwnO1xuaW1wb3J0IHsgZm9ybWF0RmlsZVNpemUgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHsgZ2V0TWVkaWFUeXBlLCBnZXREb2N1bWVudERpc3BsYXlMYWJlbCB9IGZyb20gJy4uL3V0aWxzL21lZGlhVHlwZXMnO1xuXG5leHBvcnQgY29uc3QgVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVMgPSAndW5yZWZlcmVuY2VkLWltYWdlcy12aWV3JztcblxuaW50ZXJmYWNlIFVucmVmZXJlbmNlZEltYWdlIHtcblx0ZmlsZTogVEZpbGU7XG5cdHBhdGg6IHN0cmluZztcblx0bmFtZTogc3RyaW5nO1xuXHRzaXplOiBudW1iZXI7XG5cdG1vZGlmaWVkOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBVbnJlZmVyZW5jZWRJbWFnZXNWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0dW5yZWZlcmVuY2VkSW1hZ2VzOiBVbnJlZmVyZW5jZWRJbWFnZVtdID0gW107XG5cdHByaXZhdGUgaXNTY2FubmluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luKSB7XG5cdFx0c3VwZXIobGVhZik7XG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XG5cdH1cblxuXHRnZXRWaWV3VHlwZSgpIHtcblx0XHRyZXR1cm4gVklFV19UWVBFX1VOUkVGRVJFTkNFRF9JTUFHRVM7XG5cdH1cblxuXHRnZXREaXNwbGF5VGV4dCgpIHtcblx0XHRyZXR1cm4gdGhpcy5wbHVnaW4udCgndW5yZWZlcmVuY2VkTWVkaWEnKTtcblx0fVxuXG5cdGFzeW5jIG9uT3BlbigpIHtcblx0XHQvLyBcdTdCNDlcdTVGODUgY29udGVudEVsIFx1NTFDNlx1NTkwN1x1NTk3RFxuXHRcdGxldCByZXRyaWVzID0gMDtcblx0XHR3aGlsZSAoIXRoaXMuY29udGVudEVsICYmIHJldHJpZXMgPCAxMCkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7XG5cdFx0XHRyZXRyaWVzKys7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1VucmVmZXJlbmNlZEltYWdlc1ZpZXc6IGNvbnRlbnRFbCBub3QgcmVhZHknKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoJ3VucmVmZXJlbmNlZC1pbWFnZXMtdmlldycpO1xuXG5cdFx0aWYgKCF0aGlzLmlzU2Nhbm5pbmcpIHtcblx0XHRcdGF3YWl0IHRoaXMuc2NhblVucmVmZXJlbmNlZEltYWdlcygpO1xuXHRcdH1cblx0fVxuXG5cdGFzeW5jIG9uQ2xvc2UoKSB7XG5cdFx0Ly8gXHU2RTA1XHU3NDA2XHU1REU1XHU0RjVDXG5cdH1cblxuXHRhc3luYyBzY2FuVW5yZWZlcmVuY2VkSW1hZ2VzKCkge1xuXHRcdC8vIFx1NTk4Mlx1Njc5Q1x1ODlDNlx1NTZGRVx1NURGMlx1NTE3M1x1OTVFRFx1NjIxNiBjb250ZW50RWwgXHU0RTBEXHU1M0VGXHU3NTI4XHVGRjBDXHU3NkY0XHU2M0E1XHU4RkQ0XHU1NkRFXG5cdFx0aWYgKCF0aGlzLmNvbnRlbnRFbCB8fCB0aGlzLmlzU2Nhbm5pbmcpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0aGlzLmlzU2Nhbm5pbmcgPSB0cnVlO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHQvLyBcdTY2M0VcdTc5M0FcdTYyNkJcdTYzQ0ZcdTRFMkRcdTcyQjZcdTYwMDFcblx0XHRjb25zdCBsb2FkaW5nID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbG9hZGluZy1zdGF0ZScgfSk7XG5cdFx0bG9hZGluZy5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdzcGlubmVyJyB9KTtcblx0XHRsb2FkaW5nLmNyZWF0ZURpdih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NjYW5uaW5nVW5yZWZlcmVuY2VkJykgfSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU3Njg0XHU1NkZFXHU3MjQ3XG5cdFx0XHRjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMucGx1Z2luLmZpbmRVbnJlZmVyZW5jZWQoKTtcblxuXHRcdFx0dGhpcy51bnJlZmVyZW5jZWRJbWFnZXMgPSBmaWxlcy5tYXAoZmlsZSA9PiAoe1xuXHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRwYXRoOiBmaWxlLnBhdGgsXG5cdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0c2l6ZTogZmlsZS5zdGF0LnNpemUsXG5cdFx0XHRcdG1vZGlmaWVkOiBmaWxlLnN0YXQubXRpbWVcblx0XHRcdH0pKTtcblxuXHRcdFx0Ly8gXHU2MzA5XHU1OTI3XHU1QzBGXHU2MzkyXHU1RThGXG5cdFx0XHR0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5zb3J0KChhLCBiKSA9PiBiLnNpemUgLSBhLnNpemUpO1xuXG5cdFx0XHQvLyBcdTZFMzJcdTY3RDNcdTg5QzZcdTU2RkVcblx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdTYyNkJcdTYzQ0ZcdTU2RkVcdTcyNDdcdTY1RjZcdTUxRkFcdTk1MTk6JywgZXJyb3IpO1xuXHRcdFx0dGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHtcblx0XHRcdFx0Y2xzOiAnZXJyb3Itc3RhdGUnLFxuXHRcdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdzY2FuRXJyb3InKVxuXHRcdFx0fSk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHRoaXMuaXNTY2FubmluZyA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdGFzeW5jIHJlbmRlclZpZXcoKSB7XG5cdFx0Ly8gXHU1OTgyXHU2NzlDXHU4OUM2XHU1NkZFXHU1REYyXHU1MTczXHU5NUVEXHU2MjE2IGNvbnRlbnRFbCBcdTRFMERcdTUzRUZcdTc1MjhcdUZGMENcdTc2RjRcdTYzQTVcdThGRDRcdTU2REVcblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5jb250ZW50RWwuZW1wdHkoKTtcblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1NTkzNFx1OTBFOFxuXHRcdHRoaXMucmVuZGVySGVhZGVyKCk7XG5cblx0XHRpZiAodGhpcy51bnJlZmVyZW5jZWRJbWFnZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuXHRcdFx0XHRjbHM6ICdzdWNjZXNzLXN0YXRlJyxcblx0XHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnYWxsTWVkaWFSZWZlcmVuY2VkJylcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFx1NTIxQlx1NUVGQVx1N0VERlx1OEJBMVx1NEZFMVx1NjA2RlxuXHRcdGNvbnN0IHN0YXRzID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnc3RhdHMtYmFyJyB9KTtcblx0XHRzdGF0cy5jcmVhdGVTcGFuKHtcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3VucmVmZXJlbmNlZEZvdW5kJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyh0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5sZW5ndGgpKSxcblx0XHRcdGNsczogJ3N0YXRzLWNvdW50J1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgdG90YWxTaXplID0gdGhpcy51bnJlZmVyZW5jZWRJbWFnZXMucmVkdWNlKChzdW0sIGltZykgPT4gc3VtICsgaW1nLnNpemUsIDApO1xuXHRcdHN0YXRzLmNyZWF0ZVNwYW4oe1xuXHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgndG90YWxTaXplTGFiZWwnKS5yZXBsYWNlKCd7c2l6ZX0nLCBmb3JtYXRGaWxlU2l6ZSh0b3RhbFNpemUpKSxcblx0XHRcdGNsczogJ3N0YXRzLXNpemUnXG5cdFx0fSk7XG5cblx0XHQvLyBcdTUyMUJcdTVFRkFcdTU2RkVcdTcyNDdcdTUyMTdcdTg4Njhcblx0XHRjb25zdCBsaXN0ID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAndW5yZWZlcmVuY2VkLWxpc3QnIH0pO1xuXG5cdFx0Zm9yIChjb25zdCBpbWFnZSBvZiB0aGlzLnVucmVmZXJlbmNlZEltYWdlcykge1xuXHRcdFx0dGhpcy5yZW5kZXJJbWFnZUl0ZW0obGlzdCwgaW1hZ2UpO1xuXHRcdH1cblx0fVxuXG5cdHJlbmRlckhlYWRlcigpIHtcblx0XHRjb25zdCBoZWFkZXIgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICd1bnJlZmVyZW5jZWQtaGVhZGVyJyB9KTtcblxuXHRcdGhlYWRlci5jcmVhdGVFbCgnaDInLCB7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ3VucmVmZXJlbmNlZE1lZGlhJykgfSk7XG5cblx0XHRjb25zdCBkZXNjID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2hlYWRlci1kZXNjcmlwdGlvbicgfSk7XG5cdFx0ZGVzYy5jcmVhdGVTcGFuKHsgdGV4dDogdGhpcy5wbHVnaW4udCgndW5yZWZlcmVuY2VkRGVzYycpIH0pO1xuXG5cdFx0Ly8gXHU5MUNEXHU2NUIwXHU2MjZCXHU2M0NGXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgcmVmcmVzaEJ0biA9IGhlYWRlci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdyZWZyZXNoLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihyZWZyZXNoQnRuLCAncmVmcmVzaC1jdycpO1xuXHRcdHJlZnJlc2hCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnNjYW5VbnJlZmVyZW5jZWRJbWFnZXMoKSk7XG5cblx0XHQvLyBcdTYyNzlcdTkxQ0ZcdTY0Q0RcdTRGNUNcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBhY3Rpb25zID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2hlYWRlci1hY3Rpb25zJyB9KTtcblxuXHRcdGNvbnN0IGNvcHlBbGxCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24nIH0pO1xuXHRcdHNldEljb24oY29weUFsbEJ0biwgJ2NvcHknKTtcblx0XHRjb3B5QWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jb3B5QWxsUGF0aHMoKSk7XG5cblx0XHRjb25zdCBkZWxldGVBbGxCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGRlbGV0ZUFsbEJ0biwgJ3RyYXNoLTInKTtcblx0XHRkZWxldGVBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNvbmZpcm1EZWxldGVBbGwoKSk7XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclRodW1ibmFpbEZhbGxiYWNrKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGljb25OYW1lOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpIHtcblx0XHRjb250YWluZXIuZW1wdHkoKTtcblxuXHRcdGNvbnN0IGZhbGxiYWNrID0gY29udGFpbmVyLmNyZWF0ZURpdigpO1xuXHRcdGZhbGxiYWNrLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRmYWxsYmFjay5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcblx0XHRmYWxsYmFjay5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG5cdFx0ZmFsbGJhY2suc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcblx0XHRmYWxsYmFjay5zdHlsZS5nYXAgPSAnNnB4Jztcblx0XHRmYWxsYmFjay5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LW11dGVkKSc7XG5cblx0XHRjb25zdCBpY29uRWwgPSBmYWxsYmFjay5jcmVhdGVEaXYoKTtcblx0XHRzZXRJY29uKGljb25FbCwgaWNvbk5hbWUpO1xuXG5cdFx0Y29uc3QgbGFiZWxFbCA9IGZhbGxiYWNrLmNyZWF0ZURpdih7IHRleHQ6IGxhYmVsIH0pO1xuXHRcdGxhYmVsRWwuc3R5bGUuZm9udFNpemUgPSAnMC43NWVtJztcblx0XHRsYWJlbEVsLnN0eWxlLnRleHRUcmFuc2Zvcm0gPSAndXBwZXJjYXNlJztcblx0fVxuXG5cdHByaXZhdGUgcmVuZGVyTWVkaWFUaHVtYm5haWwoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgZmlsZTogVEZpbGUsIGRpc3BsYXlOYW1lOiBzdHJpbmcpIHtcblx0XHRjb25zdCBtZWRpYVR5cGUgPSBnZXRNZWRpYVR5cGUoZmlsZS5uYW1lKTtcblx0XHRjb25zdCBzcmMgPSB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cblx0XHRpZiAobWVkaWFUeXBlID09PSAnaW1hZ2UnKSB7XG5cdFx0XHRjb25zdCBpbWcgPSBjb250YWluZXIuY3JlYXRlRWwoJ2ltZycsIHtcblx0XHRcdFx0YXR0cjoge1xuXHRcdFx0XHRcdHNyYyxcblx0XHRcdFx0XHRhbHQ6IGRpc3BsYXlOYW1lXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRpbWcuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoKSA9PiB7XG5cdFx0XHRcdGNvbnRhaW5lci5lbXB0eSgpO1xuXHRcdFx0XHRjb250YWluZXIuY3JlYXRlRGl2KHtcblx0XHRcdFx0XHRjbHM6ICdpbWFnZS1lcnJvcicsXG5cdFx0XHRcdFx0dGV4dDogdGhpcy5wbHVnaW4udCgnaW1hZ2VMb2FkRXJyb3InKVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICd2aWRlbycpIHtcblx0XHRcdGNvbnN0IHZpZGVvID0gY29udGFpbmVyLmNyZWF0ZUVsKCd2aWRlbycpO1xuXHRcdFx0dmlkZW8uc3JjID0gc3JjO1xuXHRcdFx0dmlkZW8ubXV0ZWQgPSB0cnVlO1xuXHRcdFx0dmlkZW8ucHJlbG9hZCA9ICdtZXRhZGF0YSc7XG5cdFx0XHR2aWRlby5wbGF5c0lubGluZSA9IHRydWU7XG5cdFx0XHR2aWRlby5zdHlsZS53aWR0aCA9ICcxMDAlJztcblx0XHRcdHZpZGVvLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRcdHZpZGVvLnN0eWxlLm9iamVjdEZpdCA9ICdjb3Zlcic7XG5cdFx0XHR2aWRlby5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsICd2aWRlbycsICdWSURFTycpO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKG1lZGlhVHlwZSA9PT0gJ2F1ZGlvJykge1xuXHRcdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsICdtdXNpYycsICdBVURJTycpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICdkb2N1bWVudCcpIHtcblx0XHRcdHRoaXMucmVuZGVyVGh1bWJuYWlsRmFsbGJhY2soY29udGFpbmVyLCAnZmlsZS10ZXh0JywgZ2V0RG9jdW1lbnREaXNwbGF5TGFiZWwoZmlsZS5uYW1lKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsICdmaWxlJywgJ0ZJTEUnKTtcblx0fVxuXG5cdHJlbmRlckltYWdlSXRlbShjb250YWluZXI6IEhUTUxFbGVtZW50LCBpbWFnZTogVW5yZWZlcmVuY2VkSW1hZ2UpIHtcblx0XHRjb25zdCBpdGVtID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3VucmVmZXJlbmNlZC1pdGVtJyB9KTtcblxuXHRcdC8vIFx1NTZGRVx1NzI0N1x1N0YyOVx1NzU2NVx1NTZGRVxuXHRcdGNvbnN0IHRodW1ibmFpbCA9IGl0ZW0uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS10aHVtYm5haWwnIH0pO1xuXHRcdHRoaXMucmVuZGVyTWVkaWFUaHVtYm5haWwodGh1bWJuYWlsLCBpbWFnZS5maWxlLCBpbWFnZS5uYW1lKTtcblxuXHRcdC8vIFx1NTZGRVx1NzI0N1x1NEZFMVx1NjA2RlxuXHRcdGNvbnN0IGluZm8gPSBpdGVtLmNyZWF0ZURpdih7IGNsczogJ2l0ZW0taW5mbycgfSk7XG5cdFx0aW5mby5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLW5hbWUnLCB0ZXh0OiBpbWFnZS5uYW1lIH0pO1xuXHRcdGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1wYXRoJywgdGV4dDogaW1hZ2UucGF0aCB9KTtcblx0XHRpbmZvLmNyZWF0ZURpdih7IGNsczogJ2l0ZW0tc2l6ZScsIHRleHQ6IGZvcm1hdEZpbGVTaXplKGltYWdlLnNpemUpIH0pO1xuXG5cdFx0Ly8gXHU2NENEXHU0RjVDXHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgYWN0aW9ucyA9IGl0ZW0uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1hY3Rpb25zJyB9KTtcblxuXHRcdC8vIFx1NTcyOFx1N0IxNFx1OEJCMFx1NEUyRFx1NjdFNVx1NjI3RVx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IGZpbmRCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2l0ZW0tYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKGZpbmRCdG4sICdzZWFyY2gnKTtcblx0XHRmaW5kQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5wbHVnaW4ub3BlbkltYWdlSW5Ob3RlcyhpbWFnZS5maWxlKTtcblx0XHR9KTtcblxuXHRcdC8vIFx1NTkwRFx1NTIzNlx1OERFRlx1NUY4NFx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IGNvcHlCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2l0ZW0tYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKGNvcHlCdG4sICdsaW5rJyk7XG5cdFx0Y29weUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoaW1hZ2UucGF0aCkudGhlbigoKSA9PiB7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgncGF0aENvcGllZCcpKTtcblx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdcdTU5MERcdTUyMzZcdTUyMzBcdTUyNkFcdThEMzRcdTY3N0ZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTUyMjBcdTk2NjRcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBkZWxldGVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2l0ZW0tYnV0dG9uIGRhbmdlcicgfSk7XG5cdFx0c2V0SWNvbihkZWxldGVCdG4sICd0cmFzaC0yJyk7XG5cdFx0ZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5jb25maXJtRGVsZXRlKGltYWdlKTtcblx0XHR9KTtcblxuXHRcdC8vIFx1NTNGM1x1OTUyRVx1ODNEQ1x1NTM1NVxuXHRcdGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCAoZSkgPT4ge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dGhpcy5zaG93Q29udGV4dE1lbnUoZSBhcyBNb3VzZUV2ZW50LCBpbWFnZS5maWxlKTtcblx0XHR9KTtcblx0fVxuXG5cdHNob3dDb250ZXh0TWVudShldmVudDogTW91c2VFdmVudCwgZmlsZTogVEZpbGUpIHtcblx0XHRjb25zdCBtZW51ID0gbmV3IE1lbnUoKTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnb3BlbkluTm90ZXMnKSlcblx0XHRcdFx0LnNldEljb24oJ3NlYXJjaCcpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5vcGVuSW1hZ2VJbk5vdGVzKGZpbGUpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnY29weVBhdGgnKSlcblx0XHRcdFx0LnNldEljb24oJ2xpbmsnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChmaWxlLnBhdGgpLnRoZW4oKCkgPT4ge1xuXHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdwYXRoQ29waWVkJykpO1xuXHRcdFx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdjb3B5TGluaycpKVxuXHRcdFx0XHQuc2V0SWNvbignY29weScpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBsaW5rID0gdGhpcy5wbHVnaW4uZ2V0U3RhYmxlV2lraUxpbmsoZmlsZSk7XG5cdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChsaW5rKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnbGlua0NvcGllZCcpKTtcblx0XHRcdFx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTkwRFx1NTIzNlx1NTIzMFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2Vycm9yJykpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkSXRlbSgoaXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdGl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnb3Blbk9yaWdpbmFsJykpXG5cdFx0XHRcdC5zZXRJY29uKCdleHRlcm5hbC1saW5rJylcblx0XHRcdFx0Lm9uQ2xpY2soKCkgPT4ge1xuXHRcdFx0XHRcdHZvaWQgdGhpcy5wbHVnaW4ub3Blbk9yaWdpbmFsRmlsZShmaWxlKTtcblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRtZW51LmFkZFNlcGFyYXRvcigpO1xuXG5cdFx0bWVudS5hZGRJdGVtKChpdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0aXRlbS5zZXRUaXRsZSh0aGlzLnBsdWdpbi50KCdkZWxldGUnKSlcblx0XHRcdFx0LnNldEljb24oJ3RyYXNoLTInKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgaW1nID0gdGhpcy51bnJlZmVyZW5jZWRJbWFnZXMuZmluZChpID0+IGkuZmlsZS5wYXRoID09PSBmaWxlLnBhdGgpXG5cdFx0XHRcdFx0XHR8fCB7IGZpbGUsIHBhdGg6IGZpbGUucGF0aCwgbmFtZTogZmlsZS5uYW1lLCBzaXplOiBmaWxlLnN0YXQuc2l6ZSwgbW9kaWZpZWQ6IGZpbGUuc3RhdC5tdGltZSB9O1xuXHRcdFx0XHRcdHRoaXMuY29uZmlybURlbGV0ZShpbWcpO1xuXHRcdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdG1lbnUuc2hvd0F0UG9zaXRpb24oeyB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZIH0pO1xuXHR9XG5cblx0YXN5bmMgY29uZmlybURlbGV0ZShpbWFnZTogVW5yZWZlcmVuY2VkSW1hZ2UpIHtcblx0XHRuZXcgRGVsZXRlQ29uZmlybU1vZGFsKFxuXHRcdFx0dGhpcy5hcHAsXG5cdFx0XHR0aGlzLnBsdWdpbixcblx0XHRcdFtpbWFnZV0sXG5cdFx0XHRhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHN1Y2Nlc3MgPSBhd2FpdCB0aGlzLnBsdWdpbi5zYWZlRGVsZXRlRmlsZShpbWFnZS5maWxlKTtcblx0XHRcdFx0aWYgKHN1Y2Nlc3MpIHtcblx0XHRcdFx0XHQvLyBcdTRFQ0VcdTUyMTdcdTg4NjhcdTRFMkRcdTc5RkJcdTk2NjRcblx0XHRcdFx0XHR0aGlzLnVucmVmZXJlbmNlZEltYWdlcyA9IHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLmZpbHRlcihcblx0XHRcdFx0XHRcdGltZyA9PiBpbWcuZmlsZS5wYXRoICE9PSBpbWFnZS5maWxlLnBhdGhcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdC8vIFx1OTFDRFx1NjVCMFx1NkUzMlx1NjdEM1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0KS5vcGVuKCk7XG5cdH1cblxuXHRhc3luYyBjb25maXJtRGVsZXRlQWxsKCkge1xuXHRcdGlmICh0aGlzLnVucmVmZXJlbmNlZEltYWdlcy5sZW5ndGggPT09IDApIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnbm9GaWxlc1RvRGVsZXRlJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdG5ldyBEZWxldGVDb25maXJtTW9kYWwoXG5cdFx0XHR0aGlzLmFwcCxcblx0XHRcdHRoaXMucGx1Z2luLFxuXHRcdFx0dGhpcy51bnJlZmVyZW5jZWRJbWFnZXMsXG5cdFx0XHRhc3luYyAoKSA9PiB7XG5cdFx0XHRcdC8vIFx1NEY3Rlx1NzUyOCBQcm9taXNlLmFsbCBcdTVFNzZcdTUzRDFcdTU5MDRcdTc0MDZcdTUyMjBcdTk2NjRcblx0XHRcdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdFx0XHRcdHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLm1hcChpbWFnZSA9PiB0aGlzLnBsdWdpbi5zYWZlRGVsZXRlRmlsZShpbWFnZS5maWxlKSlcblx0XHRcdFx0KTtcblxuXHRcdFx0XHQvLyBcdTdFREZcdThCQTFcdTYyMTBcdTUyOUZcdTU0OENcdTU5MzFcdThEMjVcdTc2ODRcdTY1NzBcdTkxQ0Zcblx0XHRcdFx0Y29uc3QgZGVsZXRlZCA9IHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLmZpbHRlcigoXywgaSkgPT4gcmVzdWx0c1tpXSkubWFwKGltZyA9PiBpbWcubmFtZSk7XG5cdFx0XHRcdGNvbnN0IGVycm9ycyA9IHRoaXMudW5yZWZlcmVuY2VkSW1hZ2VzLmZpbHRlcigoXywgaSkgPT4gIXJlc3VsdHNbaV0pLm1hcChpbWcgPT4gaW1nLm5hbWUpO1xuXG5cdFx0XHRcdGlmIChkZWxldGVkLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3Byb2Nlc3NlZEZpbGVzJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhkZWxldGVkLmxlbmd0aCkpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZXJyb3JzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3Byb2Nlc3NlZEZpbGVzRXJyb3InKS5yZXBsYWNlKCd7ZXJyb3JzfScsIFN0cmluZyhlcnJvcnMubGVuZ3RoKSkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gXHU5MUNEXHU2NUIwXHU2MjZCXHU2M0NGXG5cdFx0XHRcdGF3YWl0IHRoaXMuc2NhblVucmVmZXJlbmNlZEltYWdlcygpO1xuXHRcdFx0fVxuXHRcdCkub3BlbigpO1xuXHR9XG5cblx0Y29weUFsbFBhdGhzKCkge1xuXHRcdGNvbnN0IHBhdGhzID0gdGhpcy51bnJlZmVyZW5jZWRJbWFnZXMubWFwKGltZyA9PiBpbWcucGF0aCkuam9pbignXFxuJyk7XG5cdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChwYXRocykudGhlbigoKSA9PiB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2NvcGllZEZpbGVQYXRocycpLnJlcGxhY2UoJ3tjb3VudH0nLCBTdHJpbmcodGhpcy51bnJlZmVyZW5jZWRJbWFnZXMubGVuZ3RoKSkpO1xuXHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBcdTVERjJcdTc5RkJcdTk2NjQgZm9ybWF0RmlsZVNpemUgXHU2NUI5XHU2Q0Q1XHVGRjBDXHU0RjdGXHU3NTI4IHV0aWxzL2Zvcm1hdC50cyBcdTRFMkRcdTc2ODRcdTVCOUVcdTczQjBcbn1cbiIsICJpbXBvcnQgeyBNb2RhbCwgTm90aWNlLCBURmlsZSB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCBJbWFnZU1hbmFnZXJQbHVnaW4gZnJvbSAnLi4vbWFpbic7XG5pbXBvcnQgeyBmb3JtYXRGaWxlU2l6ZSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5cbmludGVyZmFjZSBVbnJlZmVyZW5jZWRJbWFnZSB7XG5cdGZpbGU6IFRGaWxlO1xuXHRwYXRoOiBzdHJpbmc7XG5cdG5hbWU6IHN0cmluZztcblx0c2l6ZTogbnVtYmVyO1xuXHRtb2RpZmllZDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgRGVsZXRlQ29uZmlybU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0aW1hZ2VzOiBVbnJlZmVyZW5jZWRJbWFnZVtdO1xuXHRvbkNvbmZpcm06ICgpID0+IFByb21pc2U8dm9pZD47XG5cdHByaXZhdGUgaXNEZWxldGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdGNvbnN0cnVjdG9yKFxuXHRcdGFwcDogYW55LFxuXHRcdHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luLFxuXHRcdGltYWdlczogVW5yZWZlcmVuY2VkSW1hZ2VbXSxcblx0XHRvbkNvbmZpcm06ICgpID0+IFByb21pc2U8dm9pZD5cblx0KSB7XG5cdFx0c3VwZXIoYXBwKTtcblx0XHR0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblx0XHR0aGlzLmltYWdlcyA9IGltYWdlcztcblx0XHR0aGlzLm9uQ29uZmlybSA9IG9uQ29uZmlybTtcblx0fVxuXG5cdG9uT3BlbigpIHtcblx0XHRjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcblx0XHRjb250ZW50RWwuZW1wdHkoKTtcblxuXHRcdC8vIFx1NEY3Rlx1NzUyOFx1N0ZGQlx1OEJEMVx1NTFGRFx1NjU3MFxuXHRcdGNvbnN0IHQgPSAoa2V5OiBzdHJpbmcpID0+IHRoaXMucGx1Z2luLnQoa2V5KTtcblxuXHRcdC8vIFx1NjgwN1x1OTg5OFxuXHRcdGNvbnRlbnRFbC5jcmVhdGVFbCgnaDInLCB7XG5cdFx0XHR0ZXh0OiB0aGlzLmltYWdlcy5sZW5ndGggPT09IDFcblx0XHRcdFx0PyB0KCdjb25maXJtRGVsZXRlRmlsZScpLnJlcGxhY2UoJ3tuYW1lfScsIHRoaXMuaW1hZ2VzWzBdLm5hbWUpXG5cdFx0XHRcdDogdCgnY29uZmlybURlbGV0ZVNlbGVjdGVkJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyh0aGlzLmltYWdlcy5sZW5ndGgpKVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU4QjY2XHU1NDRBXHU0RkUxXHU2MDZGXG5cdFx0Y29uc3Qgd2FybmluZyA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICdtb2RhbC13YXJuaW5nJyB9KTtcblx0XHRjb25zdCB3YXJuaW5nVGV4dCA9IHdhcm5pbmcuY3JlYXRlRWwoJ3AnKTtcblx0XHR3YXJuaW5nVGV4dC50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnVzZVRyYXNoRm9sZGVyXG5cdFx0XHQ/IHQoJ2RlbGV0ZVRvVHJhc2gnKVxuXHRcdFx0OiB0KCdjb25maXJtQ2xlYXJBbGwnKTtcblx0XHR3YXJuaW5nVGV4dC5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LXdhcm5pbmcpJztcblx0XHR3YXJuaW5nVGV4dC5zdHlsZS5tYXJnaW4gPSAnMTZweCAwJztcblxuXHRcdC8vIFx1NjU4N1x1NEVGNlx1NTIxN1x1ODg2OFxuXHRcdGNvbnN0IGxpc3RDb250YWluZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbW9kYWwtZmlsZS1saXN0JyB9KTtcblx0XHRsaXN0Q29udGFpbmVyLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogdCgnZGVsZXRlVG9UcmFzaCcpIH0pO1xuXG5cdFx0Y29uc3QgbGlzdCA9IGxpc3RDb250YWluZXIuY3JlYXRlRWwoJ3VsJyk7XG5cdFx0Y29uc3QgbWF4U2hvdyA9IDEwO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5taW4odGhpcy5pbWFnZXMubGVuZ3RoLCBtYXhTaG93KTsgaSsrKSB7XG5cdFx0XHRjb25zdCBpbWcgPSB0aGlzLmltYWdlc1tpXTtcblx0XHRcdGxpc3QuY3JlYXRlRWwoJ2xpJywge1xuXHRcdFx0XHR0ZXh0OiBgJHtpbWcubmFtZX0gKCR7Zm9ybWF0RmlsZVNpemUoaW1nLnNpemUpfSlgXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuaW1hZ2VzLmxlbmd0aCA+IG1heFNob3cpIHtcblx0XHRcdGxpc3QuY3JlYXRlRWwoJ2xpJywge1xuXHRcdFx0XHR0ZXh0OiBgLi4uICR7dGhpcy5pbWFnZXMubGVuZ3RoIC0gbWF4U2hvd30gJHt0KCdmaWxlc1NjYW5uZWQnKX1gXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBcdTYzMDlcdTk0QUVcdTUzM0FcdTU3REZcblx0XHRjb25zdCBidXR0b25Db250YWluZXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbW9kYWwtYnV0dG9ucycgfSk7XG5cdFx0YnV0dG9uQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG5cdFx0YnV0dG9uQ29udGFpbmVyLnN0eWxlLmdhcCA9ICcxMnB4Jztcblx0XHRidXR0b25Db250YWluZXIuc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnZmxleC1lbmQnO1xuXHRcdGJ1dHRvbkNvbnRhaW5lci5zdHlsZS5tYXJnaW5Ub3AgPSAnMjBweCc7XG5cblx0XHQvLyBcdTUzRDZcdTZEODhcdTYzMDlcdTk0QUVcblx0XHRjb25zdCBjYW5jZWxCdG4gPSBidXR0b25Db250YWluZXIuY3JlYXRlRWwoJ2J1dHRvbicsIHtcblx0XHRcdHRleHQ6IHQoJ2NhbmNlbCcpLFxuXHRcdFx0Y2xzOiAnbW9kLWN0YSdcblx0XHR9KTtcblx0XHRjYW5jZWxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuXG5cdFx0Ly8gXHU1MjIwXHU5NjY0XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgZGVsZXRlQnRuID0gYnV0dG9uQ29udGFpbmVyLmNyZWF0ZUVsKCdidXR0b24nLCB7XG5cdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VUcmFzaEZvbGRlciA/IHQoJ2RlbGV0ZVRvVHJhc2gnKSA6IHQoJ2RlbGV0ZScpLFxuXHRcdFx0Y2xzOiAnbW9kLXdhcm5pbmcnXG5cdFx0fSk7XG5cdFx0ZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNEZWxldGluZykgcmV0dXJuO1xuXHRcdFx0dGhpcy5pc0RlbGV0aW5nID0gdHJ1ZTtcblx0XHRcdGRlbGV0ZUJ0bi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgJ3RydWUnKTtcblx0XHRcdGRlbGV0ZUJ0bi50ZXh0Q29udGVudCA9IHQoJ3Byb2Nlc3NpbmcnKSB8fCAnXHU1OTA0XHU3NDA2XHU0RTJELi4uJztcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5vbkNvbmZpcm0oKTtcblx0XHRcdFx0dGhpcy5jbG9zZSgpO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1MjIwXHU5NjY0XHU2NENEXHU0RjVDXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0bmV3IE5vdGljZSh0KCdkZWxldGVGYWlsZWQnKSk7XG5cdFx0XHRcdHRoaXMuaXNEZWxldGluZyA9IGZhbHNlO1xuXHRcdFx0XHRkZWxldGVCdG4ucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuXHRcdFx0XHRkZWxldGVCdG4udGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy51c2VUcmFzaEZvbGRlciA/IHQoJ2RlbGV0ZVRvVHJhc2gnKSA6IHQoJ2RlbGV0ZScpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0b25DbG9zZSgpIHtcblx0XHRjb25zdCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcblx0XHRjb250ZW50RWwuZW1wdHkoKTtcblx0fVxufVxuIiwgImltcG9ydCB7IFRGaWxlLCBURm9sZGVyLCBJdGVtVmlldywgV29ya3NwYWNlTGVhZiwgc2V0SWNvbiwgTWVudSwgTWVudUl0ZW0sIE5vdGljZSwgTW9kYWwsIEJ1dHRvbkNvbXBvbmVudCB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCBJbWFnZU1hbmFnZXJQbHVnaW4gZnJvbSAnLi4vbWFpbic7XG5pbXBvcnQgeyBmb3JtYXRGaWxlU2l6ZSB9IGZyb20gJy4uL3V0aWxzL2Zvcm1hdCc7XG5pbXBvcnQgeyBnZXREb2N1bWVudERpc3BsYXlMYWJlbCwgZ2V0TWVkaWFUeXBlIH0gZnJvbSAnLi4vdXRpbHMvbWVkaWFUeXBlcyc7XG5pbXBvcnQgeyBpc1BhdGhTYWZlIH0gZnJvbSAnLi4vdXRpbHMvc2VjdXJpdHknO1xuaW1wb3J0IHsgZ2V0RmlsZU5hbWVGcm9tUGF0aCwgbm9ybWFsaXplVmF1bHRQYXRoLCBzYWZlRGVjb2RlVVJJQ29tcG9uZW50IH0gZnJvbSAnLi4vdXRpbHMvcGF0aCc7XG5cbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfVFJBU0hfTUFOQUdFTUVOVCA9ICd0cmFzaC1tYW5hZ2VtZW50LXZpZXcnO1xuXG5pbnRlcmZhY2UgVHJhc2hJdGVtIHtcblx0ZmlsZTogVEZpbGU7XG5cdHBhdGg6IHN0cmluZztcblx0cmF3TmFtZTogc3RyaW5nO1xuXHRuYW1lOiBzdHJpbmc7XG5cdHNpemU6IG51bWJlcjtcblx0bW9kaWZpZWQ6IG51bWJlcjtcblx0b3JpZ2luYWxQYXRoPzogc3RyaW5nO1xuXHRyZWZlcmVuY2VDb3VudDogbnVtYmVyO1xuXHRzZWxlY3RlZDogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIERhc2hib2FyZFN0YXRzIHtcblx0dG90YWxGaWxlczogbnVtYmVyO1xuXHR0b3RhbFNpemU6IG51bWJlcjtcblx0YnlUeXBlOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+O1xuXHR1bnJlZmVyZW5jZWRSYXRlOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBUcmFzaE1hbmFnZW1lbnRWaWV3IGV4dGVuZHMgSXRlbVZpZXcge1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblx0dHJhc2hJdGVtczogVHJhc2hJdGVtW10gPSBbXTtcblx0cHJpdmF0ZSBpc0xvYWRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuXHRjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbikge1xuXHRcdHN1cGVyKGxlYWYpO1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHR9XG5cblx0Z2V0Vmlld1R5cGUoKSB7XG5cdFx0cmV0dXJuIFZJRVdfVFlQRV9UUkFTSF9NQU5BR0VNRU5UO1xuXHR9XG5cblx0Z2V0RGlzcGxheVRleHQoKSB7XG5cdFx0cmV0dXJuIHRoaXMucGx1Z2luLnQoJ3RyYXNoTWFuYWdlbWVudCcpO1xuXHR9XG5cblx0YXN5bmMgb25PcGVuKCkge1xuXHRcdGxldCByZXRyaWVzID0gMDtcblx0XHR3aGlsZSAoIXRoaXMuY29udGVudEVsICYmIHJldHJpZXMgPCAxMCkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7XG5cdFx0XHRyZXRyaWVzKys7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ1RyYXNoTWFuYWdlbWVudFZpZXc6IGNvbnRlbnRFbCBub3QgcmVhZHknKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5jb250ZW50RWwuYWRkQ2xhc3MoJ3RyYXNoLW1hbmFnZW1lbnQtdmlldycpO1xuXHRcdGF3YWl0IHRoaXMubG9hZFRyYXNoSXRlbXMoKTtcblx0fVxuXG5cdGFzeW5jIG9uQ2xvc2UoKSB7XG5cdFx0Ly8gXHU2RTA1XHU3NDA2XHU1REU1XHU0RjVDXG5cdH1cblxuXHQvKipcblx0ICogXHU1MkEwXHU4RjdEXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTJEXHU3Njg0XHU2NTg3XHU0RUY2XG5cdCAqL1xuXHRhc3luYyBsb2FkVHJhc2hJdGVtcygpIHtcblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSByZXR1cm47XG5cdFx0aWYgKHRoaXMuaXNMb2FkaW5nKSByZXR1cm47XG5cdFx0dGhpcy5pc0xvYWRpbmcgPSB0cnVlO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHRjb25zdCBsb2FkaW5nID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnbG9hZGluZy1zdGF0ZScgfSk7XG5cdFx0bG9hZGluZy5jcmVhdGVFbCgnZGl2JywgeyBjbHM6ICdzcGlubmVyJyB9KTtcblx0XHRsb2FkaW5nLmNyZWF0ZURpdih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ2xvYWRpbmdUcmFzaEZpbGVzJykgfSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgdHJhc2hQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKHRoaXMucGx1Z2luLnNldHRpbmdzLnRyYXNoRm9sZGVyKTtcblx0XHRcdGlmICghdHJhc2hQYXRoIHx8ICFpc1BhdGhTYWZlKHRyYXNoUGF0aCkpIHtcblx0XHRcdFx0dGhpcy50cmFzaEl0ZW1zID0gW107XG5cdFx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHRyYXNoRm9sZGVyID0gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aCh0cmFzaFBhdGgpO1xuXHRcdFx0aWYgKCF0cmFzaEZvbGRlciB8fCAhKHRyYXNoRm9sZGVyIGluc3RhbmNlb2YgVEZvbGRlcikpIHtcblx0XHRcdFx0dGhpcy50cmFzaEl0ZW1zID0gW107XG5cdFx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHJlZkNvdW50TWFwID0gdGhpcy5idWlsZFJlZkNvdW50TWFwKCk7XG5cblx0XHRcdHRoaXMudHJhc2hJdGVtcyA9IFtdO1xuXHRcdFx0Zm9yIChjb25zdCBmaWxlIG9mIHRyYXNoRm9sZGVyLmNoaWxkcmVuKSB7XG5cdFx0XHRcdGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcblx0XHRcdFx0XHRjb25zdCBvcmlnaW5hbFBhdGggPSB0aGlzLmV4dHJhY3RPcmlnaW5hbFBhdGgoZmlsZS5uYW1lKTtcblx0XHRcdFx0XHRjb25zdCBkaXNwbGF5TmFtZSA9IG9yaWdpbmFsUGF0aCA/IGdldEZpbGVOYW1lRnJvbVBhdGgob3JpZ2luYWxQYXRoKSB8fCBmaWxlLm5hbWUgOiBmaWxlLm5hbWU7XG5cblx0XHRcdFx0XHQvLyBcdTRFQ0VcdTk4ODRcdTVFRkEgTWFwIFx1NEUyRFx1NjdFNVx1NjI3RVx1NUYxNVx1NzUyOFx1NkIyMVx1NjU3MCBPKDEpXG5cdFx0XHRcdFx0Y29uc3QgcmVmQ291bnQgPSBvcmlnaW5hbFBhdGhcblx0XHRcdFx0XHRcdD8gdGhpcy5sb29rdXBSZWZDb3VudChvcmlnaW5hbFBhdGgsIHJlZkNvdW50TWFwKVxuXHRcdFx0XHRcdFx0OiAwO1xuXG5cdFx0XHRcdFx0dGhpcy50cmFzaEl0ZW1zLnB1c2goe1xuXHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdHBhdGg6IGZpbGUucGF0aCxcblx0XHRcdFx0XHRcdHJhd05hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0XHRcdG5hbWU6IGRpc3BsYXlOYW1lLFxuXHRcdFx0XHRcdFx0c2l6ZTogZmlsZS5zdGF0LnNpemUsXG5cdFx0XHRcdFx0XHRtb2RpZmllZDogZmlsZS5zdGF0Lm10aW1lLFxuXHRcdFx0XHRcdFx0b3JpZ2luYWxQYXRoLFxuXHRcdFx0XHRcdFx0cmVmZXJlbmNlQ291bnQ6IHJlZkNvdW50LFxuXHRcdFx0XHRcdFx0c2VsZWN0ZWQ6IGZhbHNlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dGhpcy50cmFzaEl0ZW1zLnNvcnQoKGEsIGIpID0+IGIubW9kaWZpZWQgLSBhLm1vZGlmaWVkKTtcblx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdcdTUyQTBcdThGN0RcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzFcdThEMjU6JywgZXJyb3IpO1xuXHRcdFx0dGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHtcblx0XHRcdFx0Y2xzOiAnZXJyb3Itc3RhdGUnLFxuXHRcdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdlcnJvcicpXG5cdFx0XHR9KTtcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0dGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU0RTAwXHU2QjIxXHU2MDI3XHU5MDREXHU1Mzg2XHU2MjQwXHU2NzA5XHU3QjE0XHU4QkIwXHVGRjBDXHU2Nzg0XHU1RUZBXHU1RjE1XHU3NTI4XHU4QkExXHU2NTcwIE1hcFxuXHQgKiBrZXkgPSBcdTVGNTJcdTRFMDBcdTUzMTZcdTY1ODdcdTRFRjZcdTU0MEQgKGxvd2VyY2FzZSksIHZhbHVlID0gXHU4OEFCXHU1RjE1XHU3NTI4XHU2QjIxXHU2NTcwXG5cdCAqIE8oXHU3QjE0XHU4QkIwXHU2NTcwIFx1MDBENyBcdTVFNzNcdTU3NDcgZW1iZWQgXHU2NTcwKVx1RkYwQ1x1NTNFQVx1NjI2N1x1ODg0Q1x1NEUwMFx1NkIyMVxuXHQgKi9cblx0cHJpdmF0ZSBidWlsZFJlZkNvdW50TWFwKCk6IE1hcDxzdHJpbmcsIG51bWJlcj4ge1xuXHRcdGNvbnN0IGNvdW50TWFwID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuXHRcdGNvbnN0IG1hcmtkb3duRmlsZXMgPSB0aGlzLmFwcC52YXVsdC5nZXRNYXJrZG93bkZpbGVzKCk7XG5cdFx0Zm9yIChjb25zdCBtZCBvZiBtYXJrZG93bkZpbGVzKSB7XG5cdFx0XHRjb25zdCBjYWNoZSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKG1kKTtcblx0XHRcdGlmICghY2FjaGUpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBlbnRyaWVzID0gWy4uLihjYWNoZS5lbWJlZHMgfHwgW10pLCAuLi4oY2FjaGUubGlua3MgfHwgW10pXTtcblx0XHRcdGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuXHRcdFx0XHRjb25zdCBsaW5rUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChlbnRyeS5saW5rKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHRjb25zdCBsaW5rTmFtZSA9IChnZXRGaWxlTmFtZUZyb21QYXRoKGxpbmtQYXRoKSB8fCBsaW5rUGF0aCkudG9Mb3dlckNhc2UoKTtcblxuXHRcdFx0XHQvLyBcdTYzMDlcdTVCOENcdTY1NzRcdThERUZcdTVGODRcdTU0OENcdTg4RjhcdTY1ODdcdTRFRjZcdTU0MERcdTUyMDZcdTUyMkJcdTdEMkZcdTUyQTBcblx0XHRcdFx0Y291bnRNYXAuc2V0KGxpbmtQYXRoLCAoY291bnRNYXAuZ2V0KGxpbmtQYXRoKSB8fCAwKSArIDEpO1xuXHRcdFx0XHRpZiAobGlua05hbWUgIT09IGxpbmtQYXRoKSB7XG5cdFx0XHRcdFx0Y291bnRNYXAuc2V0KGxpbmtOYW1lLCAoY291bnRNYXAuZ2V0KGxpbmtOYW1lKSB8fCAwKSArIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvdW50TWFwO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NEVDRVx1OTg4NFx1NUVGQSBNYXAgXHU0RTJEXHU2N0U1XHU4QkUyXHU1RjE1XHU3NTI4XHU2QjIxXHU2NTcwXG5cdCAqL1xuXHRwcml2YXRlIGxvb2t1cFJlZkNvdW50KG9yaWdpbmFsUGF0aDogc3RyaW5nLCByZWZDb3VudE1hcDogTWFwPHN0cmluZywgbnVtYmVyPik6IG51bWJlciB7XG5cdFx0Y29uc3Qgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgob3JpZ2luYWxQYXRoKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGNvbnN0IGZpbGVOYW1lID0gKGdldEZpbGVOYW1lRnJvbVBhdGgobm9ybWFsaXplZFBhdGgpIHx8IG5vcm1hbGl6ZWRQYXRoKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGNvbnN0IGV4YWN0Q291bnQgPSByZWZDb3VudE1hcC5nZXQobm9ybWFsaXplZFBhdGgpIHx8IDA7XG5cdFx0Y29uc3QgbmFtZUNvdW50ID0gcmVmQ291bnRNYXAuZ2V0KGZpbGVOYW1lKSB8fCAwO1xuXG5cdFx0Ly8gXHU1MTdDXHU1QkI5XHU4OEY4XHU2NTg3XHU0RUY2XHU1NDBEXHU0RTBFXHU1QjhDXHU2NTc0XHU4REVGXHU1Rjg0XHU0RTI0XHU3OUNEXHU1MTk5XHU2Q0Q1XHVGRjBDXHU5MDdGXHU1MTREXHU1NDBDXHU0RTAwXHU2NTg3XHU0RUY2XHU0RTBEXHU1NDBDXHU5NEZFXHU2M0E1XHU5OENFXHU2ODNDXHU2NUY2XHU4OEFCXHU0RjRFXHU0RjMwXHUzMDAyXG5cdFx0cmV0dXJuIE1hdGgubWF4KGV4YWN0Q291bnQsIG5hbWVDb3VudCk7XG5cdH1cblxuXHQvKipcblx0ICogXHU0RUNFXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1NDBEXHU0RTJEXHU2M0QwXHU1M0Q2XHU1MzlGXHU1OUNCXHU4REVGXHU1Rjg0XG5cdCAqL1xuXHRwcml2YXRlIGV4dHJhY3RPcmlnaW5hbFBhdGgoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG5cdFx0Y29uc3Qgc2VwYXJhdG9ySW5kZXggPSBmaWxlTmFtZS5pbmRleE9mKCdfXycpO1xuXHRcdGlmIChzZXBhcmF0b3JJbmRleCA9PT0gLTEpIHJldHVybiB1bmRlZmluZWQ7XG5cblx0XHRjb25zdCBlbmNvZGVkUGFydCA9IGZpbGVOYW1lLnN1YnN0cmluZyhzZXBhcmF0b3JJbmRleCArIDIpO1xuXHRcdGlmICghZW5jb2RlZFBhcnQpIHJldHVybiB1bmRlZmluZWQ7XG5cblx0XHRjb25zdCBkZWNvZGVkID0gbm9ybWFsaXplVmF1bHRQYXRoKHNhZmVEZWNvZGVVUklDb21wb25lbnQoZW5jb2RlZFBhcnQpKTtcblx0XHRyZXR1cm4gZGVjb2RlZCB8fCB1bmRlZmluZWQ7XG5cdH1cblxuXHQvKipcblx0ICogXHU4QkExXHU3Qjk3XHU0RUVBXHU4ODY4XHU3NkQ4XHU3RURGXHU4QkExXHU2NTcwXHU2MzZFXG5cdCAqL1xuXHRwcml2YXRlIGNvbXB1dGVTdGF0cygpOiBEYXNoYm9hcmRTdGF0cyB7XG5cdFx0Y29uc3QgYnlUeXBlOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG5cdFx0bGV0IHRvdGFsU2l6ZSA9IDA7XG5cdFx0bGV0IHVucmVmZXJlbmNlZENvdW50ID0gMDtcblxuXHRcdGZvciAoY29uc3QgaXRlbSBvZiB0aGlzLnRyYXNoSXRlbXMpIHtcblx0XHRcdHRvdGFsU2l6ZSArPSBpdGVtLnNpemU7XG5cdFx0XHRjb25zdCB0eXBlID0gZ2V0TWVkaWFUeXBlKGl0ZW0ubmFtZSkgfHwgJ290aGVyJztcblx0XHRcdGJ5VHlwZVt0eXBlXSA9IChieVR5cGVbdHlwZV0gfHwgMCkgKyAxO1xuXHRcdFx0aWYgKGl0ZW0ucmVmZXJlbmNlQ291bnQgPT09IDApIHtcblx0XHRcdFx0dW5yZWZlcmVuY2VkQ291bnQrKztcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0dG90YWxGaWxlczogdGhpcy50cmFzaEl0ZW1zLmxlbmd0aCxcblx0XHRcdHRvdGFsU2l6ZSxcblx0XHRcdGJ5VHlwZSxcblx0XHRcdHVucmVmZXJlbmNlZFJhdGU6IHRoaXMudHJhc2hJdGVtcy5sZW5ndGggPiAwXG5cdFx0XHRcdD8gTWF0aC5yb3VuZCgodW5yZWZlcmVuY2VkQ291bnQgLyB0aGlzLnRyYXNoSXRlbXMubGVuZ3RoKSAqIDEwMClcblx0XHRcdFx0OiAwXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTg5QzZcdTU2RkVcblx0ICovXG5cdGFzeW5jIHJlbmRlclZpZXcoKSB7XG5cdFx0aWYgKCF0aGlzLmNvbnRlbnRFbCkgcmV0dXJuO1xuXHRcdHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cblx0XHQvLyBcdTU5MzRcdTkwRThcblx0XHR0aGlzLnJlbmRlckhlYWRlcigpO1xuXG5cdFx0Ly8gXHU0RUVBXHU4ODY4XHU3NkQ4XG5cdFx0aWYgKHRoaXMudHJhc2hJdGVtcy5sZW5ndGggPiAwKSB7XG5cdFx0XHR0aGlzLnJlbmRlckRhc2hib2FyZCgpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnRyYXNoSXRlbXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoe1xuXHRcdFx0XHRjbHM6ICdlbXB0eS1zdGF0ZScsXG5cdFx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3RyYXNoRm9sZGVyRW1wdHknKVxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gXHU2Mjc5XHU5MUNGXHU2NENEXHU0RjVDXHU1REU1XHU1MTc3XHU2ODBGXG5cdFx0dGhpcy5yZW5kZXJCYXRjaFRvb2xiYXIoKTtcblxuXHRcdC8vIFx1NjU4N1x1NEVGNlx1NTIxN1x1ODg2OFxuXHRcdGNvbnN0IGxpc3QgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6ICd0cmFzaC1saXN0JyB9KTtcblx0XHRmb3IgKGNvbnN0IGl0ZW0gb2YgdGhpcy50cmFzaEl0ZW1zKSB7XG5cdFx0XHR0aGlzLnJlbmRlclRyYXNoSXRlbShsaXN0LCBpdGVtKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTMyXHU2N0QzXHU1OTM0XHU5MEU4XG5cdCAqL1xuXHRyZW5kZXJIZWFkZXIoKSB7XG5cdFx0Y29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAndHJhc2gtaGVhZGVyJyB9KTtcblx0XHRoZWFkZXIuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiB0aGlzLnBsdWdpbi50KCd0cmFzaE1hbmFnZW1lbnQnKSB9KTtcblxuXHRcdGNvbnN0IGRlc2MgPSBoZWFkZXIuY3JlYXRlRGl2KHsgY2xzOiAnaGVhZGVyLWRlc2NyaXB0aW9uJyB9KTtcblx0XHRkZXNjLmNyZWF0ZVNwYW4oeyB0ZXh0OiB0aGlzLnBsdWdpbi50KCd0cmFzaE1hbmFnZW1lbnREZXNjJykgfSk7XG5cblx0XHRjb25zdCBhY3Rpb25zID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2hlYWRlci1hY3Rpb25zJyB9KTtcblxuXHRcdC8vIFx1NTIzN1x1NjVCMFx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IHJlZnJlc2hCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3JlZnJlc2gtYnV0dG9uJyB9KTtcblx0XHRzZXRJY29uKHJlZnJlc2hCdG4sICdyZWZyZXNoLWN3Jyk7XG5cdFx0cmVmcmVzaEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMubG9hZFRyYXNoSXRlbXMoKSk7XG5cdFx0cmVmcmVzaEJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ3JlZnJlc2gnKTtcblxuXHRcdC8vIFx1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRlx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IHNjYW5CdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24nIH0pO1xuXHRcdHNldEljb24oc2NhbkJ0biwgJ3NoaWVsZC1jaGVjaycpO1xuXHRcdHNjYW5CdG4uY3JlYXRlU3Bhbih7IHRleHQ6IGAgJHt0aGlzLnBsdWdpbi50KCdzYWZlU2NhbicpfWAgfSk7XG5cdFx0c2NhbkJ0bi5kaXNhYmxlZCA9ICF0aGlzLnBsdWdpbi5zZXR0aW5ncy5zYWZlU2NhbkVuYWJsZWQ7XG5cdFx0c2NhbkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMucnVuU2FmZVNjYW4oKSk7XG5cdFx0c2NhbkJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuRGVzYycpO1xuXG5cdFx0Ly8gXHU2RTA1XHU3QTdBXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgY2xlYXJBbGxCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGNsZWFyQWxsQnRuLCAndHJhc2gtMicpO1xuXHRcdGNsZWFyQWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jb25maXJtQ2xlYXJBbGwoKSk7XG5cdFx0Y2xlYXJBbGxCdG4udGl0bGUgPSB0aGlzLnBsdWdpbi50KCdjbGVhclRyYXNoVG9vbHRpcCcpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1N0VERlx1OEJBMVx1NEVFQVx1ODg2OFx1NzZEOFxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJEYXNoYm9hcmQoKSB7XG5cdFx0Y29uc3Qgc3RhdHMgPSB0aGlzLmNvbXB1dGVTdGF0cygpO1xuXHRcdGNvbnN0IGRhc2hib2FyZCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3RyYXNoLWRhc2hib2FyZCcgfSk7XG5cblx0XHQvLyBcdTUzNjFcdTcyNDcxXHVGRjFBXHU2MDNCXHU2NTg3XHU0RUY2XHU2NTcwXG5cdFx0Y29uc3QgY2FyZEZpbGVzID0gZGFzaGJvYXJkLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1jYXJkJyB9KTtcblx0XHRjb25zdCBmaWxlc0ljb24gPSBjYXJkRmlsZXMuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWljb24nIH0pO1xuXHRcdHNldEljb24oZmlsZXNJY29uLCAnZmlsZXMnKTtcblx0XHRjYXJkRmlsZXMuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLXZhbHVlJywgdGV4dDogU3RyaW5nKHN0YXRzLnRvdGFsRmlsZXMpIH0pO1xuXHRcdGNhcmRGaWxlcy5jcmVhdGVEaXYoeyBjbHM6ICdkYXNoYm9hcmQtbGFiZWwnLCB0ZXh0OiB0aGlzLnBsdWdpbi50KCdmaWxlc0luVHJhc2gnKS5yZXBsYWNlKCd7Y291bnR9JywgJycpIH0pO1xuXG5cdFx0Ly8gXHU1MzYxXHU3MjQ3Mlx1RkYxQVx1NTM2MFx1NzUyOFx1N0E3QVx1OTVGNFxuXHRcdGNvbnN0IGNhcmRTaXplID0gZGFzaGJvYXJkLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1jYXJkJyB9KTtcblx0XHRjb25zdCBzaXplSWNvbiA9IGNhcmRTaXplLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1pY29uJyB9KTtcblx0XHRzZXRJY29uKHNpemVJY29uLCAnaGFyZC1kcml2ZScpO1xuXHRcdGNhcmRTaXplLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC12YWx1ZScsIHRleHQ6IGZvcm1hdEZpbGVTaXplKHN0YXRzLnRvdGFsU2l6ZSkgfSk7XG5cdFx0Y2FyZFNpemUuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWxhYmVsJywgdGV4dDogdGhpcy5wbHVnaW4udCgndG90YWxTaXplJykucmVwbGFjZSgne3NpemV9JywgJycpIH0pO1xuXG5cdFx0Ly8gXHU1MzYxXHU3MjQ3M1x1RkYxQVx1N0M3Qlx1NTc4Qlx1NTIwNlx1NUUwM1xuXHRcdGNvbnN0IGNhcmRUeXBlID0gZGFzaGJvYXJkLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1jYXJkJyB9KTtcblx0XHRjb25zdCB0eXBlSWNvbiA9IGNhcmRUeXBlLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1pY29uJyB9KTtcblx0XHRzZXRJY29uKHR5cGVJY29uLCAncGllLWNoYXJ0Jyk7XG5cdFx0Y29uc3QgdHlwZVBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXHRcdGZvciAoY29uc3QgW3R5cGUsIGNvdW50XSBvZiBPYmplY3QuZW50cmllcyhzdGF0cy5ieVR5cGUpKSB7XG5cdFx0XHR0eXBlUGFydHMucHVzaChgJHt0eXBlfTogJHtjb3VudH1gKTtcblx0XHR9XG5cdFx0Y2FyZFR5cGUuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLXZhbHVlJywgdGV4dDogdHlwZVBhcnRzLmpvaW4oJywgJykgfHwgJy0nIH0pO1xuXHRcdGNhcmRUeXBlLmNyZWF0ZURpdih7IGNsczogJ2Rhc2hib2FyZC1sYWJlbCcsIHRleHQ6IHRoaXMucGx1Z2luLnQoJ3R5cGVEaXN0cmlidXRpb24nKSB9KTtcblxuXHRcdC8vIFx1NTM2MVx1NzI0NzRcdUZGMUFcdTY3MkFcdTVGMTVcdTc1MjhcdTczODdcblx0XHRjb25zdCBjYXJkVW5yZWYgPSBkYXNoYm9hcmQuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWNhcmQnIH0pO1xuXHRcdGNvbnN0IHVucmVmSWNvbiA9IGNhcmRVbnJlZi5jcmVhdGVEaXYoeyBjbHM6ICdkYXNoYm9hcmQtaWNvbicgfSk7XG5cdFx0c2V0SWNvbih1bnJlZkljb24sICd1bmxpbmsnKTtcblx0XHRjYXJkVW5yZWYuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLXZhbHVlJywgdGV4dDogYCR7c3RhdHMudW5yZWZlcmVuY2VkUmF0ZX0lYCB9KTtcblx0XHRjYXJkVW5yZWYuY3JlYXRlRGl2KHsgY2xzOiAnZGFzaGJvYXJkLWxhYmVsJywgdGV4dDogdGhpcy5wbHVnaW4udCgndW5yZWZlcmVuY2VkUmF0ZScpIH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NjI3OVx1OTFDRlx1NjRDRFx1NEY1Q1x1NURFNVx1NTE3N1x1NjgwRlxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJCYXRjaFRvb2xiYXIoKSB7XG5cdFx0Y29uc3QgdG9vbGJhciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ2JhdGNoLXRvb2xiYXInIH0pO1xuXG5cdFx0Ly8gXHU1MTY4XHU5MDA5L1x1NTNDRFx1OTAwOVxuXHRcdGNvbnN0IHNlbGVjdEFsbEJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idG4nIH0pO1xuXHRcdHNldEljb24oc2VsZWN0QWxsQnRuLCAnY2hlY2stc3F1YXJlJyk7XG5cdFx0c2VsZWN0QWxsQnRuLmNyZWF0ZVNwYW4oeyB0ZXh0OiBgICR7dGhpcy5wbHVnaW4udCgnc2VsZWN0QWxsJyl9YCB9KTtcblx0XHRzZWxlY3RBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cdFx0XHRjb25zdCBhbGxTZWxlY3RlZCA9IHRoaXMudHJhc2hJdGVtcy5ldmVyeShpID0+IGkuc2VsZWN0ZWQpO1xuXHRcdFx0dGhpcy50cmFzaEl0ZW1zLmZvckVhY2goaSA9PiBpLnNlbGVjdGVkID0gIWFsbFNlbGVjdGVkKTtcblx0XHRcdHRoaXMucmVuZGVyVmlldygpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3Qgc2VsZWN0ZWRDb3VudCA9IHRoaXMudHJhc2hJdGVtcy5maWx0ZXIoaSA9PiBpLnNlbGVjdGVkKS5sZW5ndGg7XG5cdFx0dG9vbGJhci5jcmVhdGVTcGFuKHtcblx0XHRcdGNsczogJ3NlbGVjdGVkLWNvdW50Jyxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NlbGVjdGVkQ291bnQnLCB7IGNvdW50OiBzZWxlY3RlZENvdW50IH0pXG5cdFx0fSk7XG5cblx0XHQvLyBcdTYyNzlcdTkxQ0ZcdTYwNjJcdTU5MERcblx0XHRjb25zdCBiYXRjaFJlc3RvcmVCdG4gPSB0b29sYmFyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3Rvb2xiYXItYnRuIHN1Y2Nlc3MnIH0pO1xuXHRcdHNldEljb24oYmF0Y2hSZXN0b3JlQnRuLCAncm90YXRlLWNjdycpO1xuXHRcdGJhdGNoUmVzdG9yZUJ0bi5jcmVhdGVTcGFuKHsgdGV4dDogYCAke3RoaXMucGx1Z2luLnQoJ2JhdGNoUmVzdG9yZScpfWAgfSk7XG5cdFx0YmF0Y2hSZXN0b3JlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5iYXRjaFJlc3RvcmUoKSk7XG5cblx0XHQvLyBcdTYyNzlcdTkxQ0ZcdTUyMjBcdTk2NjRcblx0XHRjb25zdCBiYXRjaERlbGV0ZUJ0biA9IHRvb2xiYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAndG9vbGJhci1idG4gZGFuZ2VyJyB9KTtcblx0XHRzZXRJY29uKGJhdGNoRGVsZXRlQnRuLCAndHJhc2gtMicpO1xuXHRcdGJhdGNoRGVsZXRlQnRuLmNyZWF0ZVNwYW4oeyB0ZXh0OiBgICR7dGhpcy5wbHVnaW4udCgnYmF0Y2hEZWxldGUnKX1gIH0pO1xuXHRcdGJhdGNoRGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5iYXRjaERlbGV0ZSgpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTUzNTVcdTRFMkFcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTk4Nzlcblx0ICovXG5cdHJlbmRlclRyYXNoSXRlbShjb250YWluZXI6IEhUTUxFbGVtZW50LCBpdGVtOiBUcmFzaEl0ZW0pIHtcblx0XHRjb25zdCBpdGVtRWwgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiBgdHJhc2gtaXRlbSAke2l0ZW0uc2VsZWN0ZWQgPyAnc2VsZWN0ZWQnIDogJyd9YCB9KTtcblxuXHRcdC8vIFx1NTkwRFx1OTAwOVx1Njg0NlxuXHRcdGNvbnN0IGNoZWNrYm94ID0gaXRlbUVsLmNyZWF0ZUVsKCdpbnB1dCcsIHtcblx0XHRcdHR5cGU6ICdjaGVja2JveCcsXG5cdFx0XHRjbHM6ICdpdGVtLWNoZWNrYm94J1xuXHRcdH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG5cdFx0Y2hlY2tib3guY2hlY2tlZCA9IGl0ZW0uc2VsZWN0ZWQ7XG5cdFx0Y2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuXHRcdFx0aXRlbS5zZWxlY3RlZCA9IGNoZWNrYm94LmNoZWNrZWQ7XG5cdFx0XHRpdGVtRWwudG9nZ2xlQ2xhc3MoJ3NlbGVjdGVkJywgaXRlbS5zZWxlY3RlZCk7XG5cdFx0XHQvLyBcdTY2RjRcdTY1QjBcdTVERTVcdTUxNzdcdTY4MEZcdThCQTFcdTY1NzBcblx0XHRcdGNvbnN0IHRvb2xiYXIgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKCcuYmF0Y2gtdG9vbGJhciAuc2VsZWN0ZWQtY291bnQnKTtcblx0XHRcdGlmICh0b29sYmFyKSB7XG5cdFx0XHRcdGNvbnN0IGNvdW50ID0gdGhpcy50cmFzaEl0ZW1zLmZpbHRlcihpID0+IGkuc2VsZWN0ZWQpLmxlbmd0aDtcblx0XHRcdFx0dG9vbGJhci50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnQoJ3NlbGVjdGVkQ291bnQnLCB7IGNvdW50IH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gXHU3RjI5XHU3NTY1XHU1NkZFXG5cdFx0Y29uc3QgdGh1bWJFbCA9IGl0ZW1FbC5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLXRodW1ibmFpbCcgfSk7XG5cdFx0dGhpcy5yZW5kZXJJdGVtVGh1bWJuYWlsKHRodW1iRWwsIGl0ZW0pO1xuXG5cdFx0Ly8gXHU2NTg3XHU0RUY2XHU0RkUxXHU2MDZGXG5cdFx0Y29uc3QgaW5mbyA9IGl0ZW1FbC5jcmVhdGVEaXYoeyBjbHM6ICdpdGVtLWluZm8nIH0pO1xuXHRcdGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1uYW1lJywgdGV4dDogaXRlbS5uYW1lIH0pO1xuXHRcdGNvbnN0IHR5cGVCYWRnZSA9IGluZm8uY3JlYXRlU3Bhbih7XG5cdFx0XHRjbHM6ICdpdGVtLXR5cGUtYmFkZ2UnLFxuXHRcdFx0dGV4dDogdGhpcy5nZXRUeXBlTGFiZWwoaXRlbS5uYW1lKVxuXHRcdH0pO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZS1mbGV4Jztcblx0XHR0eXBlQmFkZ2Uuc3R5bGUuYWxpZ25JdGVtcyA9ICdjZW50ZXInO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS53aWR0aCA9ICdmaXQtY29udGVudCc7XG5cdFx0dHlwZUJhZGdlLnN0eWxlLnBhZGRpbmcgPSAnMnB4IDhweCc7XG5cdFx0dHlwZUJhZGdlLnN0eWxlLm1hcmdpblRvcCA9ICc0cHgnO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS5ib3JkZXJSYWRpdXMgPSAnOTk5cHgnO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS5mb250U2l6ZSA9ICcwLjc1ZW0nO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS5mb250V2VpZ2h0ID0gJzYwMCc7XG5cdFx0dHlwZUJhZGdlLnN0eWxlLmxldHRlclNwYWNpbmcgPSAnMC4wNGVtJztcblx0XHR0eXBlQmFkZ2Uuc3R5bGUuYm9yZGVyID0gJzFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlciknO1xuXHRcdHR5cGVCYWRnZS5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LW11dGVkKSc7XG5cdFx0dHlwZUJhZGdlLnN0eWxlLmJhY2tncm91bmQgPSAndmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpJztcblxuXHRcdGlmIChpdGVtLm9yaWdpbmFsUGF0aCkge1xuXHRcdFx0aW5mby5jcmVhdGVEaXYoe1xuXHRcdFx0XHRjbHM6ICdpdGVtLW9yaWdpbmFsLXBhdGgnLFxuXHRcdFx0XHR0ZXh0OiBgJHt0aGlzLnBsdWdpbi50KCdvcmlnaW5hbFBhdGgnKX06ICR7aXRlbS5vcmlnaW5hbFBhdGh9YFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWV0YSA9IGluZm8uY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1tZXRhJyB9KTtcblx0XHRtZXRhLmNyZWF0ZVNwYW4oeyBjbHM6ICdpdGVtLXNpemUnLCB0ZXh0OiBmb3JtYXRGaWxlU2l6ZShpdGVtLnNpemUpIH0pO1xuXHRcdG1ldGEuY3JlYXRlU3Bhbih7XG5cdFx0XHRjbHM6ICdpdGVtLWRhdGUnLFxuXHRcdFx0dGV4dDogYCR7dGhpcy5wbHVnaW4udCgnZGVsZXRlZFRpbWUnKX06ICR7bmV3IERhdGUoaXRlbS5tb2RpZmllZCkudG9Mb2NhbGVTdHJpbmcoKX1gXG5cdFx0fSk7XG5cblx0XHQvLyBcdTVGMTVcdTc1MjhcdTZCMjFcdTY1NzBcdTVGQkRcdTdBRTBcblx0XHRjb25zdCByZWZCYWRnZSA9IGluZm8uY3JlYXRlU3Bhbih7XG5cdFx0XHRjbHM6IGByZWYtYmFkZ2UgJHtpdGVtLnJlZmVyZW5jZUNvdW50ID4gMCA/ICdyZWYtYWN0aXZlJyA6ICdyZWYtemVybyd9YCxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3JlZmVyZW5jZWRCeScsIHsgY291bnQ6IGl0ZW0ucmVmZXJlbmNlQ291bnQgfSlcblx0XHR9KTtcblxuXHRcdC8vIFx1NjRDRFx1NEY1Q1x1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IGFjdGlvbnMgPSBpdGVtRWwuY3JlYXRlRGl2KHsgY2xzOiAnaXRlbS1hY3Rpb25zJyB9KTtcblxuXHRcdGNvbnN0IHJlc3RvcmVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2l0ZW0tYnV0dG9uIHN1Y2Nlc3MnIH0pO1xuXHRcdHNldEljb24ocmVzdG9yZUJ0biwgJ3JvdGF0ZS1jY3cnKTtcblx0XHRyZXN0b3JlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5yZXN0b3JlRmlsZShpdGVtKSk7XG5cdFx0cmVzdG9yZUJ0bi50aXRsZSA9IHRoaXMucGx1Z2luLnQoJ3Jlc3RvcmVUb29sdGlwJyk7XG5cblx0XHRjb25zdCBkZWxldGVCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2l0ZW0tYnV0dG9uIGRhbmdlcicgfSk7XG5cdFx0c2V0SWNvbihkZWxldGVCdG4sICd0cmFzaC0yJyk7XG5cdFx0ZGVsZXRlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jb25maXJtRGVsZXRlKGl0ZW0pKTtcblx0XHRkZWxldGVCdG4udGl0bGUgPSB0aGlzLnBsdWdpbi50KCdwZXJtYW5lbnREZWxldGVUb29sdGlwJyk7XG5cblx0XHQvLyBcdTUzRjNcdTk1MkVcdTgzRENcdTUzNTVcblx0XHRpdGVtRWwuYWRkRXZlbnRMaXN0ZW5lcignY29udGV4dG1lbnUnLCAoZSkgPT4ge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dGhpcy5zaG93Q29udGV4dE1lbnUoZSBhcyBNb3VzZUV2ZW50LCBpdGVtKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZFMzJcdTY3RDNcdTY3NjFcdTc2RUVcdTdGMjlcdTc1NjVcdTU2RkVcblx0ICovXG5cdHByaXZhdGUgcmVuZGVySXRlbVRodW1ibmFpbChjb250YWluZXI6IEhUTUxFbGVtZW50LCBpdGVtOiBUcmFzaEl0ZW0pIHtcblx0XHRjb25zdCBtZWRpYVR5cGUgPSBnZXRNZWRpYVR5cGUoaXRlbS5uYW1lKTtcblxuXHRcdGlmIChtZWRpYVR5cGUgPT09ICdpbWFnZScpIHtcblx0XHRcdGNvbnN0IHNyYyA9IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChpdGVtLmZpbGUpO1xuXHRcdFx0Y29uc3QgaW1nID0gY29udGFpbmVyLmNyZWF0ZUVsKCdpbWcnLCB7XG5cdFx0XHRcdGF0dHI6IHsgc3JjLCBhbHQ6IGl0ZW0ubmFtZSB9XG5cdFx0XHR9KTtcblx0XHRcdGltZy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdFx0Y29udGFpbmVyLmVtcHR5KCk7XG5cdFx0XHRcdGNvbnN0IGljb24gPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAndGh1bWItaWNvbicgfSk7XG5cdFx0XHRcdHNldEljb24oaWNvbiwgJ2ltYWdlJyk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgaWNvbk5hbWUgPSBtZWRpYVR5cGUgPT09ICd2aWRlbycgPyAndmlkZW8nIDpcblx0XHRcdFx0bWVkaWFUeXBlID09PSAnYXVkaW8nID8gJ211c2ljJyA6XG5cdFx0XHRcdG1lZGlhVHlwZSA9PT0gJ2RvY3VtZW50JyA/ICdmaWxlLXRleHQnIDogJ2ZpbGUnO1xuXHRcdFx0dGhpcy5yZW5kZXJUaHVtYm5haWxGYWxsYmFjayhjb250YWluZXIsIGljb25OYW1lLCB0aGlzLmdldFR5cGVMYWJlbChpdGVtLm5hbWUpKTtcblx0XHR9XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclRodW1ibmFpbEZhbGxiYWNrKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGljb25OYW1lOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpIHtcblx0XHRjb250YWluZXIuZW1wdHkoKTtcblxuXHRcdGNvbnN0IGZhbGxiYWNrID0gY29udGFpbmVyLmNyZWF0ZURpdigpO1xuXHRcdGZhbGxiYWNrLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblx0XHRmYWxsYmFjay5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuXHRcdGZhbGxiYWNrLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcblx0XHRmYWxsYmFjay5zdHlsZS5hbGlnbkl0ZW1zID0gJ2NlbnRlcic7XG5cdFx0ZmFsbGJhY2suc3R5bGUuanVzdGlmeUNvbnRlbnQgPSAnY2VudGVyJztcblx0XHRmYWxsYmFjay5zdHlsZS5nYXAgPSAnNnB4Jztcblx0XHRmYWxsYmFjay5zdHlsZS5jb2xvciA9ICd2YXIoLS10ZXh0LW11dGVkKSc7XG5cblx0XHRjb25zdCBpY29uID0gZmFsbGJhY2suY3JlYXRlRGl2KHsgY2xzOiAndGh1bWItaWNvbicgfSk7XG5cdFx0c2V0SWNvbihpY29uLCBpY29uTmFtZSk7XG5cblx0XHRjb25zdCB0ZXh0ID0gZmFsbGJhY2suY3JlYXRlRGl2KHsgdGV4dDogbGFiZWwgfSk7XG5cdFx0dGV4dC5zdHlsZS5mb250U2l6ZSA9ICcwLjcyZW0nO1xuXHRcdHRleHQuc3R5bGUuZm9udFdlaWdodCA9ICc2MDAnO1xuXHRcdHRleHQuc3R5bGUubGV0dGVyU3BhY2luZyA9ICcwLjA0ZW0nO1xuXHRcdHRleHQuc3R5bGUudGV4dFRyYW5zZm9ybSA9ICd1cHBlcmNhc2UnO1xuXHR9XG5cblx0cHJpdmF0ZSBnZXRUeXBlTGFiZWwoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0Y29uc3QgbWVkaWFUeXBlID0gZ2V0TWVkaWFUeXBlKGZpbGVOYW1lKTtcblx0XHRpZiAobWVkaWFUeXBlID09PSAnZG9jdW1lbnQnKSB7XG5cdFx0XHRyZXR1cm4gZ2V0RG9jdW1lbnREaXNwbGF5TGFiZWwoZmlsZU5hbWUpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGRvdCA9IGZpbGVOYW1lLmxhc3RJbmRleE9mKCcuJyk7XG5cdFx0aWYgKGRvdCAhPT0gLTEgJiYgZG90IDwgZmlsZU5hbWUubGVuZ3RoIC0gMSkge1xuXHRcdFx0cmV0dXJuIGZpbGVOYW1lLnNsaWNlKGRvdCArIDEpLnRvVXBwZXJDYXNlKCk7XG5cdFx0fVxuXG5cdFx0aWYgKG1lZGlhVHlwZSkge1xuXHRcdFx0cmV0dXJuIG1lZGlhVHlwZS50b1VwcGVyQ2FzZSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiAnRklMRSc7XG5cdH1cblxuXHQvKipcblx0ICogXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGXHVGRjFBXHU4MUVBXHU1MkE4XHU2N0U1XHU2MjdFXHU1QjY0XHU3QUNCXHU2NTg3XHU0RUY2XHU1RTc2XHU5MDAxXHU1MTY1XHU5Njk0XHU3OUJCXG5cdCAqL1xuXHRhc3luYyBydW5TYWZlU2NhbigpIHtcblx0XHRjb25zdCBzZXR0aW5ncyA9IHRoaXMucGx1Z2luLnNldHRpbmdzO1xuXHRcdGlmICghc2V0dGluZ3Muc2FmZVNjYW5FbmFibGVkKSB7XG5cdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuRGVzYycpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuXHRcdGNvbnN0IGRheU1zID0gMjQgKiA2MCAqIDYwICogMTAwMDtcblx0XHRjb25zdCBjdXRvZmZUaW1lID0gbm93IC0gKHNldHRpbmdzLnNhZmVTY2FuVW5yZWZEYXlzICogZGF5TXMpO1xuXHRcdGNvbnN0IG1pblNpemUgPSBzZXR0aW5ncy5zYWZlU2Nhbk1pblNpemU7XG5cblx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuU3RhcnRlZCcpKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByZWZlcmVuY2VkSW1hZ2VzID0gYXdhaXQgdGhpcy5wbHVnaW4uZ2V0UmVmZXJlbmNlZEltYWdlcygpO1xuXHRcdFx0Y29uc3QgYWxsTWVkaWEgPSB0aGlzLnBsdWdpbi5maWxlSW5kZXguaXNJbml0aWFsaXplZFxuXHRcdFx0XHQ/IHRoaXMucGx1Z2luLmZpbGVJbmRleC5nZXRGaWxlcygpXG5cdFx0XHRcdFx0Lm1hcChlID0+IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChlLnBhdGgpKVxuXHRcdFx0XHRcdC5maWx0ZXIoKGYpOiBmIGlzIFRGaWxlID0+IGYgaW5zdGFuY2VvZiBURmlsZSlcblx0XHRcdFx0OiBhd2FpdCB0aGlzLnBsdWdpbi5nZXRBbGxJbWFnZUZpbGVzKCk7XG5cblx0XHRcdGNvbnN0IHRyYXNoUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh0aGlzLnBsdWdpbi5zZXR0aW5ncy50cmFzaEZvbGRlcikgfHwgJyc7XG5cdFx0XHRjb25zdCBjYW5kaWRhdGVzOiBURmlsZVtdID0gW107XG5cblx0XHRcdGZvciAoY29uc3QgZmlsZSBvZiBhbGxNZWRpYSkge1xuXHRcdFx0XHQvLyBcdTYzOTJcdTk2NjRcdTVERjJcdTU3MjhcdTk2OTRcdTc5QkJcdTUzM0FcdTc2ODRcdTY1ODdcdTRFRjZcblx0XHRcdFx0aWYgKHRyYXNoUGF0aCAmJiBmaWxlLnBhdGguc3RhcnRzV2l0aCh0cmFzaFBhdGggKyAnLycpKSBjb250aW51ZTtcblxuXHRcdFx0XHRjb25zdCBub3JtYWxpemVkUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChmaWxlLnBhdGgpLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdGNvbnN0IG5vcm1hbGl6ZWROYW1lID0gZmlsZS5uYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRcdGNvbnN0IGlzUmVmZXJlbmNlZCA9IHJlZmVyZW5jZWRJbWFnZXMuaGFzKG5vcm1hbGl6ZWRQYXRoKSB8fFxuXHRcdFx0XHRcdHJlZmVyZW5jZWRJbWFnZXMuaGFzKG5vcm1hbGl6ZWROYW1lKTtcblxuXHRcdFx0XHRpZiAoIWlzUmVmZXJlbmNlZCAmJlxuXHRcdFx0XHRcdGZpbGUuc3RhdC5tdGltZSA8IGN1dG9mZlRpbWUgJiZcblx0XHRcdFx0XHRmaWxlLnN0YXQuc2l6ZSA+PSBtaW5TaXplKSB7XG5cdFx0XHRcdFx0Y2FuZGlkYXRlcy5wdXNoKGZpbGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmIChjYW5kaWRhdGVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ3NhZmVTY2FuTm9SZXN1bHRzJykpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vIFx1Nzg2RVx1OEJBNFx1NUJGOVx1OEJERFx1Njg0NlxuXHRcdFx0Y29uc3QgY29uZmlybWVkID0gYXdhaXQgdGhpcy5zaG93Q29uZmlybU1vZGFsKFxuXHRcdFx0XHR0aGlzLnBsdWdpbi50KCdzYWZlU2NhbkNvbmZpcm0nLCB7XG5cdFx0XHRcdFx0Y291bnQ6IGNhbmRpZGF0ZXMubGVuZ3RoLFxuXHRcdFx0XHRcdGRheXM6IHNldHRpbmdzLnNhZmVTY2FuVW5yZWZEYXlzLFxuXHRcdFx0XHRcdHNpemU6IGZvcm1hdEZpbGVTaXplKG1pblNpemUpXG5cdFx0XHRcdH0pXG5cdFx0XHQpO1xuXG5cdFx0XHRpZiAoIWNvbmZpcm1lZCkgcmV0dXJuO1xuXG5cdFx0XHRsZXQgbW92ZWQgPSAwO1xuXHRcdFx0Zm9yIChjb25zdCBmaWxlIG9mIGNhbmRpZGF0ZXMpIHtcblx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5wbHVnaW4uc2FmZURlbGV0ZUZpbGUoZmlsZSk7XG5cdFx0XHRcdGlmIChyZXN1bHQpIG1vdmVkKys7XG5cdFx0XHR9XG5cblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnc2FmZVNjYW5Db21wbGV0ZScsIHsgY291bnQ6IG1vdmVkIH0pKTtcblx0XHRcdGF3YWl0IHRoaXMubG9hZFRyYXNoSXRlbXMoKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnc2FmZVNjYW5GYWlsZWQnKSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjI3OVx1OTFDRlx1NjA2Mlx1NTkwRFx1OTAwOVx1NEUyRFx1NjU4N1x1NEVGNlxuXHQgKi9cblx0YXN5bmMgYmF0Y2hSZXN0b3JlKCkge1xuXHRcdGNvbnN0IHNlbGVjdGVkID0gdGhpcy50cmFzaEl0ZW1zLmZpbHRlcihpID0+IGkuc2VsZWN0ZWQpO1xuXHRcdGlmIChzZWxlY3RlZC5sZW5ndGggPT09IDApIHtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnbm9JdGVtc1NlbGVjdGVkJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IHRoaXMuc2hvd0NvbmZpcm1Nb2RhbChcblx0XHRcdHRoaXMucGx1Z2luLnQoJ2NvbmZpcm1CYXRjaFJlc3RvcmUnLCB7IGNvdW50OiBzZWxlY3RlZC5sZW5ndGggfSlcblx0XHQpO1xuXHRcdGlmICghY29uZmlybWVkKSByZXR1cm47XG5cblx0XHRsZXQgcmVzdG9yZWQgPSAwO1xuXHRcdGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3RlZCkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bGV0IHRhcmdldFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoaXRlbS5vcmlnaW5hbFBhdGggfHwgJycpO1xuXHRcdFx0XHRpZiAoIXRhcmdldFBhdGgpIHtcblx0XHRcdFx0XHRjb25zdCBzZXBhcmF0b3JJbmRleCA9IGl0ZW0ucmF3TmFtZS5pbmRleE9mKCdfXycpO1xuXHRcdFx0XHRcdGlmIChzZXBhcmF0b3JJbmRleCAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdHRhcmdldFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoXG5cdFx0XHRcdFx0XHRcdHNhZmVEZWNvZGVVUklDb21wb25lbnQoaXRlbS5yYXdOYW1lLnN1YnN0cmluZyhzZXBhcmF0b3JJbmRleCArIDIpKVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGFyZ2V0UGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChpdGVtLnJhd05hbWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0YXJnZXRQYXRoKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5wbHVnaW4ucmVzdG9yZUZpbGUoaXRlbS5maWxlLCB0YXJnZXRQYXRoKTtcblx0XHRcdFx0XHRpZiAocmVzdWx0KSByZXN0b3JlZCsrO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYFx1NjA2Mlx1NTkwRFx1NjU4N1x1NEVGNlx1NTkzMVx1OEQyNTogJHtpdGVtLm5hbWV9YCwgZXJyb3IpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnYmF0Y2hSZXN0b3JlQ29tcGxldGUnLCB7IGNvdW50OiByZXN0b3JlZCB9KSk7XG5cdFx0YXdhaXQgdGhpcy5sb2FkVHJhc2hJdGVtcygpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjI3OVx1OTFDRlx1NTIyMFx1OTY2NFx1OTAwOVx1NEUyRFx1NjU4N1x1NEVGNlxuXHQgKi9cblx0YXN5bmMgYmF0Y2hEZWxldGUoKSB7XG5cdFx0Y29uc3Qgc2VsZWN0ZWQgPSB0aGlzLnRyYXNoSXRlbXMuZmlsdGVyKGkgPT4gaS5zZWxlY3RlZCk7XG5cdFx0aWYgKHNlbGVjdGVkLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdub0l0ZW1zU2VsZWN0ZWQnKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgY29uZmlybWVkID0gYXdhaXQgdGhpcy5zaG93Q29uZmlybU1vZGFsKFxuXHRcdFx0dGhpcy5wbHVnaW4udCgnY29uZmlybUNsZWFyVHJhc2gnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKHNlbGVjdGVkLmxlbmd0aCkpXG5cdFx0KTtcblx0XHRpZiAoIWNvbmZpcm1lZCkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdFx0c2VsZWN0ZWQubWFwKGl0ZW0gPT5cblx0XHRcdFx0dGhpcy5wbHVnaW4uYXBwLnZhdWx0LmRlbGV0ZShpdGVtLmZpbGUpLnRoZW4oKCkgPT4gdHJ1ZSkuY2F0Y2goKCkgPT4gZmFsc2UpXG5cdFx0XHQpXG5cdFx0KTtcblxuXHRcdGNvbnN0IGRlbGV0ZWQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIpLmxlbmd0aDtcblx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2JhdGNoRGVsZXRlQ29tcGxldGUnKS5yZXBsYWNlKCd7Y291bnR9JywgU3RyaW5nKGRlbGV0ZWQpKSk7XG5cdFx0YXdhaXQgdGhpcy5sb2FkVHJhc2hJdGVtcygpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjYzRVx1NzkzQVx1NTNGM1x1OTUyRVx1ODNEQ1x1NTM1NVxuXHQgKi9cblx0c2hvd0NvbnRleHRNZW51KGV2ZW50OiBNb3VzZUV2ZW50LCB0cmFzaEl0ZW06IFRyYXNoSXRlbSkge1xuXHRcdGNvbnN0IG1lbnUgPSBuZXcgTWVudSgpO1xuXG5cdFx0bWVudS5hZGRJdGVtKChtZW51SXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdG1lbnVJdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ3Jlc3RvcmUnKSlcblx0XHRcdFx0LnNldEljb24oJ3JvdGF0ZS1jY3cnKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB0aGlzLnJlc3RvcmVGaWxlKHRyYXNoSXRlbSkpO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChtZW51SXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdG1lbnVJdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ3Blcm1hbmVudERlbGV0ZScpKVxuXHRcdFx0XHQuc2V0SWNvbigndHJhc2gtMicpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHRoaXMuY29uZmlybURlbGV0ZSh0cmFzaEl0ZW0pKTtcblx0XHR9KTtcblxuXHRcdG1lbnUuYWRkU2VwYXJhdG9yKCk7XG5cblx0XHRtZW51LmFkZEl0ZW0oKG1lbnVJdGVtOiBNZW51SXRlbSkgPT4ge1xuXHRcdFx0bWVudUl0ZW0uc2V0VGl0bGUodGhpcy5wbHVnaW4udCgnY29waWVkRmlsZU5hbWUnKSlcblx0XHRcdFx0LnNldEljb24oJ2NvcHknKVxuXHRcdFx0XHQub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0cmFzaEl0ZW0ubmFtZSkudGhlbigoKSA9PiB7XG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2ZpbGVOYW1lQ29waWVkJykpO1xuXHRcdFx0XHRcdH0pLmNhdGNoKChlcnJvcikgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0bWVudS5hZGRJdGVtKChtZW51SXRlbTogTWVudUl0ZW0pID0+IHtcblx0XHRcdG1lbnVJdGVtLnNldFRpdGxlKHRoaXMucGx1Z2luLnQoJ2NvcGllZE9yaWdpbmFsUGF0aCcpKVxuXHRcdFx0XHQuc2V0SWNvbignbGluaycpXG5cdFx0XHRcdC5vbkNsaWNrKCgpID0+IHtcblx0XHRcdFx0XHRpZiAodHJhc2hJdGVtLm9yaWdpbmFsUGF0aCkge1xuXHRcdFx0XHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0cmFzaEl0ZW0ub3JpZ2luYWxQYXRoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdvcmlnaW5hbFBhdGhDb3BpZWQnKSk7XG5cdFx0XHRcdFx0XHR9KS5jYXRjaCgoZXJyb3IpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1OTBEXHU1MjM2XHU1MjMwXHU1MjZBXHU4RDM0XHU2NzdGXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdlcnJvcicpKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRtZW51LnNob3dBdFBvc2l0aW9uKHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSB9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTYwNjJcdTU5MERcdTY1ODdcdTRFRjZcblx0ICovXG5cdGFzeW5jIHJlc3RvcmVGaWxlKGl0ZW06IFRyYXNoSXRlbSkge1xuXHRcdHRyeSB7XG5cdFx0XHRsZXQgdGFyZ2V0UGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChpdGVtLm9yaWdpbmFsUGF0aCB8fCAnJyk7XG5cdFx0XHRpZiAoIXRhcmdldFBhdGgpIHtcblx0XHRcdFx0Y29uc3Qgc2VwYXJhdG9ySW5kZXggPSBpdGVtLnJhd05hbWUuaW5kZXhPZignX18nKTtcblx0XHRcdFx0aWYgKHNlcGFyYXRvckluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdHRhcmdldFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoXG5cdFx0XHRcdFx0XHRzYWZlRGVjb2RlVVJJQ29tcG9uZW50KGl0ZW0ucmF3TmFtZS5zdWJzdHJpbmcoc2VwYXJhdG9ySW5kZXggKyAyKSlcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRhcmdldFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoaXRlbS5yYXdOYW1lKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRhcmdldFBhdGgpIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdyZXN0b3JlRmFpbGVkJykucmVwbGFjZSgne21lc3NhZ2V9JywgdGhpcy5wbHVnaW4udCgnZXJyb3InKSkpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHJlc3RvcmVkID0gYXdhaXQgdGhpcy5wbHVnaW4ucmVzdG9yZUZpbGUoaXRlbS5maWxlLCB0YXJnZXRQYXRoKTtcblx0XHRcdGlmICghcmVzdG9yZWQpIHJldHVybjtcblxuXHRcdFx0dGhpcy50cmFzaEl0ZW1zID0gdGhpcy50cmFzaEl0ZW1zLmZpbHRlcihpID0+IGkuZmlsZS5wYXRoICE9PSBpdGVtLmZpbGUucGF0aCk7XG5cdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcignXHU2MDYyXHU1OTBEXHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgncmVzdG9yZUZhaWxlZCcpLnJlcGxhY2UoJ3ttZXNzYWdlfScsIChlcnJvciBhcyBFcnJvcikubWVzc2FnZSkpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTY2M0VcdTc5M0FcdTU2RkRcdTk2NDVcdTUzMTZcdTc4NkVcdThCQTRcdTVCRjlcdThCRERcdTY4NDZcblx0ICovXG5cdHByaXZhdGUgc2hvd0NvbmZpcm1Nb2RhbChtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdGNvbnN0IG1vZGFsID0gbmV3IE1vZGFsKHRoaXMucGx1Z2luLmFwcCk7XG5cdFx0XHRsZXQgcmVzb2x2ZWQgPSBmYWxzZTtcblxuXHRcdFx0bW9kYWwub25DbG9zZSA9ICgpID0+IHtcblx0XHRcdFx0aWYgKCFyZXNvbHZlZCkge1xuXHRcdFx0XHRcdHJlc29sdmVkID0gdHJ1ZTtcblx0XHRcdFx0XHRyZXNvbHZlKGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0bW9kYWwuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ2NvbmZpcm0tbW9kYWwtY29udGVudCcgfSwgKGVsKSA9PiB7XG5cdFx0XHRcdGVsLmNyZWF0ZURpdih7IHRleHQ6IG1lc3NhZ2UsIGNsczogJ2NvbmZpcm0tbW9kYWwtbWVzc2FnZScgfSk7XG5cdFx0XHRcdGVsLmNyZWF0ZURpdih7IGNsczogJ2NvbmZpcm0tbW9kYWwtYnV0dG9ucycgfSwgKGJ1dHRvbnNFbCkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGNhbmNlbEJ0biA9IG5ldyBCdXR0b25Db21wb25lbnQoYnV0dG9uc0VsKTtcblx0XHRcdFx0XHRjYW5jZWxCdG4uc2V0QnV0dG9uVGV4dCh0aGlzLnBsdWdpbi50KCdjYW5jZWwnKSk7XG5cdFx0XHRcdFx0Y2FuY2VsQnRuLm9uQ2xpY2soKCkgPT4ge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0bW9kYWwuY2xvc2UoKTtcblx0XHRcdFx0XHRcdHJlc29sdmUoZmFsc2UpO1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0Y29uc3QgY29uZmlybUJ0biA9IG5ldyBCdXR0b25Db21wb25lbnQoYnV0dG9uc0VsKTtcblx0XHRcdFx0XHRjb25maXJtQnRuLnNldEJ1dHRvblRleHQodGhpcy5wbHVnaW4udCgnY29uZmlybScpKTtcblx0XHRcdFx0XHRjb25maXJtQnRuLnNldEN0YSgpO1xuXHRcdFx0XHRcdGNvbmZpcm1CdG4ub25DbGljaygoKSA9PiB7XG5cdFx0XHRcdFx0XHRyZXNvbHZlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRtb2RhbC5jbG9zZSgpO1xuXHRcdFx0XHRcdFx0cmVzb2x2ZSh0cnVlKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0bW9kYWwub3BlbigpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1Nzg2RVx1OEJBNFx1NTIyMFx1OTY2NFx1NTM1NVx1NEUyQVx1NjU4N1x1NEVGNlxuXHQgKi9cblx0YXN5bmMgY29uZmlybURlbGV0ZShpdGVtOiBUcmFzaEl0ZW0pIHtcblx0XHRjb25zdCBjb25maXJtZWQgPSBhd2FpdCB0aGlzLnNob3dDb25maXJtTW9kYWwoXG5cdFx0XHR0aGlzLnBsdWdpbi50KCdjb25maXJtRGVsZXRlRmlsZScpLnJlcGxhY2UoJ3tuYW1lfScsIGl0ZW0ubmFtZSlcblx0XHQpO1xuXG5cdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmRlbGV0ZShpdGVtLmZpbGUpO1xuXHRcdFx0XHRuZXcgTm90aWNlKHRoaXMucGx1Z2luLnQoJ2ZpbGVEZWxldGVkJykucmVwbGFjZSgne25hbWV9JywgaXRlbS5uYW1lKSk7XG5cdFx0XHRcdHRoaXMudHJhc2hJdGVtcyA9IHRoaXMudHJhc2hJdGVtcy5maWx0ZXIoaSA9PiBpLmZpbGUucGF0aCAhPT0gaXRlbS5maWxlLnBhdGgpO1xuXHRcdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTIyMFx1OTY2NFx1NjU4N1x1NEVGNlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZGVsZXRlRmFpbGVkJykpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTc4NkVcdThCQTRcdTZFMDVcdTdBN0FcdTYyNDBcdTY3MDlcdTY1ODdcdTRFRjZcblx0ICovXG5cdGFzeW5jIGNvbmZpcm1DbGVhckFsbCgpIHtcblx0XHRpZiAodGhpcy50cmFzaEl0ZW1zLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCd0cmFzaEVtcHR5JykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNvbmZpcm1lZCA9IGF3YWl0IHRoaXMuc2hvd0NvbmZpcm1Nb2RhbChcblx0XHRcdHRoaXMucGx1Z2luLnQoJ2NvbmZpcm1DbGVhclRyYXNoJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyh0aGlzLnRyYXNoSXRlbXMubGVuZ3RoKSlcblx0XHQpO1xuXG5cdFx0aWYgKGNvbmZpcm1lZCkge1xuXHRcdFx0Y29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKFxuXHRcdFx0XHR0aGlzLnRyYXNoSXRlbXMubWFwKGl0ZW0gPT5cblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5hcHAudmF1bHQuZGVsZXRlKGl0ZW0uZmlsZSkudGhlbigoKSA9PiB0cnVlKS5jYXRjaCgoKSA9PiBmYWxzZSlcblx0XHRcdFx0KVxuXHRcdFx0KTtcblxuXHRcdFx0Y29uc3QgZGVsZXRlZCA9IHJlc3VsdHMuZmlsdGVyKHIgPT4gcikubGVuZ3RoO1xuXHRcdFx0Y29uc3QgZXJyb3JzID0gcmVzdWx0cy5maWx0ZXIociA9PiAhcikubGVuZ3RoO1xuXG5cdFx0XHRpZiAoZGVsZXRlZCA+IDApIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdiYXRjaERlbGV0ZUNvbXBsZXRlJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhkZWxldGVkKSkpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGVycm9ycyA+IDApIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdiYXRjaERlbGV0ZUNvbXBsZXRlJykucmVwbGFjZSgne2NvdW50fScsIFN0cmluZyhlcnJvcnMpKSArICcgKCcgKyB0aGlzLnBsdWdpbi50KCdlcnJvcicpICsgJyknKTtcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgdGhpcy5sb2FkVHJhc2hJdGVtcygpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTgzQjdcdTUzRDZcdTY1ODdcdTRFRjZcdTU2RkVcdTY4MDdcblx0ICovXG5cdHByaXZhdGUgZ2V0RmlsZUljb24oZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdGNvbnN0IG1lZGlhVHlwZSA9IGdldE1lZGlhVHlwZShgZmlsZW5hbWUuJHtleHR9YCk7XG5cdFx0c3dpdGNoIChtZWRpYVR5cGUpIHtcblx0XHRcdGNhc2UgJ2ltYWdlJzogcmV0dXJuICdpbWFnZSc7XG5cdFx0XHRjYXNlICd2aWRlbyc6IHJldHVybiAndmlkZW8nO1xuXHRcdFx0Y2FzZSAnYXVkaW8nOiByZXR1cm4gJ211c2ljJztcblx0XHRcdGNhc2UgJ2RvY3VtZW50JzogcmV0dXJuICdmaWxlLXRleHQnO1xuXHRcdFx0ZGVmYXVsdDogcmV0dXJuICdmaWxlJztcblx0XHR9XG5cdH1cbn1cbiIsICIvKipcbiAqIFx1NUI4OVx1NTE2OFx1NURFNVx1NTE3N1x1NTFGRFx1NjU3MFxuICovXG5cbi8qKlxuICogXHU2ODIxXHU5QThDXHU4REVGXHU1Rjg0XHU2NjJGXHU1NDI2XHU1Qjg5XHU1MTY4XHVGRjA4XHU2NUUwXHU5MDREXHU1Mzg2XHU1RThGXHU1MjE3XHUzMDAxXHU5NzVFXHU3RUREXHU1QkY5XHU4REVGXHU1Rjg0XHVGRjA5XG4gKiBcdTUxNDhcdTUwNUEgVVJMIFx1ODlFM1x1NzgwMVx1NEVFNVx1OTYzMiAlMmUlMmUgXHU3QjQ5XHU3RjE2XHU3ODAxXHU3RUQ1XHU4RkM3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1BhdGhTYWZlKGZpbGVQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcblx0aWYgKCFmaWxlUGF0aCB8fCAhZmlsZVBhdGgudHJpbSgpKSByZXR1cm4gZmFsc2U7XG5cdHRyeSB7XG5cdFx0Y29uc3QgZGVjb2RlZCA9IGRlY29kZVVSSUNvbXBvbmVudChmaWxlUGF0aCk7XG5cdFx0Y29uc3Qgbm9ybWFsaXplZCA9IGRlY29kZWQucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuXHRcdGlmIChub3JtYWxpemVkLnN0YXJ0c1dpdGgoJy8nKSB8fCAvXlthLXpBLVpdOi8udGVzdChub3JtYWxpemVkKSkgcmV0dXJuIGZhbHNlO1xuXHRcdGlmIChub3JtYWxpemVkLmluY2x1ZGVzKCdcXDAnKSkgcmV0dXJuIGZhbHNlO1xuXHRcdGNvbnN0IHBhcnRzID0gbm9ybWFsaXplZC5zcGxpdCgnLycpO1xuXHRcdHJldHVybiBwYXJ0cy5ldmVyeShwYXJ0ID0+IHBhcnQgIT09ICcuLicgJiYgcGFydCAhPT0gJy4nKTtcblx0fSBjYXRjaCB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbi8qKlxuICogXHU2ODIxXHU5QThDIFVSTCBcdTUzNEZcdThCQUVcdTY2MkZcdTU0MjZcdTVCODlcdTUxNjhcbiAqIFx1NTE0MVx1OEJCOCBodHRwL2h0dHBzIFx1NTQ4Q1x1NjVFMFx1NTM0Rlx1OEJBRVx1NTI0RFx1N0YwMFx1NzY4NFx1NTE4NVx1OTBFOFx1OERFRlx1NUY4NFx1RkYwQ1x1NjJFNlx1NjIyQSBqYXZhc2NyaXB0Oi9kYXRhOi92YnNjcmlwdDogXHU3QjQ5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NhZmVVcmwodXJsOiBzdHJpbmcpOiBib29sZWFuIHtcblx0aWYgKCF1cmwgfHwgIXVybC50cmltKCkpIHJldHVybiBmYWxzZTtcblx0Y29uc3QgdHJpbW1lZCA9IHVybC50cmltKCkudG9Mb3dlckNhc2UoKTtcblx0aWYgKHRyaW1tZWQuc3RhcnRzV2l0aCgnaHR0cDovLycpIHx8IHRyaW1tZWQuc3RhcnRzV2l0aCgnaHR0cHM6Ly8nKSkgcmV0dXJuIHRydWU7XG5cdGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoJ2phdmFzY3JpcHQ6JykgfHwgdHJpbW1lZC5zdGFydHNXaXRoKCdkYXRhOicpIHx8IHRyaW1tZWQuc3RhcnRzV2l0aCgndmJzY3JpcHQ6JykpIHJldHVybiBmYWxzZTtcblx0cmV0dXJuICF0cmltbWVkLmluY2x1ZGVzKCc6Jyk7XG59XG5cbi8qKlxuICogXHU4RjZDXHU0RTQ5XHU1QjU3XHU3QjI2XHU0RTMyXHU3NTI4XHU0RThFIEhUTUwgXHU1QzVFXHU2MDI3XHVGRjBDXHU5NjMyXHU2QjYyXHU1QzVFXHU2MDI3XHU2Q0U4XHU1MTY1XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc2NhcGVIdG1sQXR0cihzdHI6IHN0cmluZyk6IHN0cmluZyB7XG5cdGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykgcmV0dXJuICcnO1xuXHRyZXR1cm4gc3RyXG5cdFx0LnJlcGxhY2UoLyYvZywgJyZhbXA7Jylcblx0XHQucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG5cdFx0LnJlcGxhY2UoLycvZywgJyYjMzk7Jylcblx0XHQucmVwbGFjZSgvPC9nLCAnJmx0OycpXG5cdFx0LnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbn1cbiIsICIvKipcbiAqIFx1OTFDRFx1NTkwRFx1NjU4N1x1NEVGNlx1NjhDMFx1NkQ0Qlx1ODlDNlx1NTZGRVxuICogXHU0RjdGXHU3NTI4XHU2MTFGXHU3N0U1XHU1NEM4XHU1RTBDXHU1QjlFXHU3M0IwXHU1MENGXHU3RDIwXHU3RUE3XHU1NkZFXHU3MjQ3XHU1M0JCXHU5MUNEXG4gKi9cblxuaW1wb3J0IHsgVEZpbGUsIEl0ZW1WaWV3LCBXb3Jrc3BhY2VMZWFmLCBzZXRJY29uLCBOb3RpY2UgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgSW1hZ2VNYW5hZ2VyUGx1Z2luIGZyb20gJy4uL21haW4nO1xuaW1wb3J0IHsgZm9ybWF0RmlsZVNpemUgfSBmcm9tICcuLi91dGlscy9mb3JtYXQnO1xuaW1wb3J0IHsgZ2V0TWVkaWFUeXBlIH0gZnJvbSAnLi4vdXRpbHMvbWVkaWFUeXBlcyc7XG5pbXBvcnQgeyBjb21wdXRlUGVyY2VwdHVhbEhhc2gsIGZpbmREdXBsaWNhdGVHcm91cHMsIER1cGxpY2F0ZUdyb3VwLCBJbWFnZUhhc2ggfSBmcm9tICcuLi91dGlscy9wZXJjZXB0dWFsSGFzaCc7XG5pbXBvcnQgeyB1cGRhdGVMaW5rc0luVmF1bHQgfSBmcm9tICcuLi91dGlscy9saW5rVXBkYXRlcic7XG5cbmV4cG9ydCBjb25zdCBWSUVXX1RZUEVfRFVQTElDQVRFX0RFVEVDVElPTiA9ICdkdXBsaWNhdGUtZGV0ZWN0aW9uLXZpZXcnO1xuXG5leHBvcnQgY2xhc3MgRHVwbGljYXRlRGV0ZWN0aW9uVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcblx0cGx1Z2luOiBJbWFnZU1hbmFnZXJQbHVnaW47XG5cdHByaXZhdGUgZHVwbGljYXRlR3JvdXBzOiBEdXBsaWNhdGVHcm91cFtdID0gW107XG5cdHByaXZhdGUgaXNTY2FubmluZzogYm9vbGVhbiA9IGZhbHNlO1xuXHRwcml2YXRlIHNjYW5Qcm9ncmVzczogeyBjdXJyZW50OiBudW1iZXI7IHRvdGFsOiBudW1iZXIgfSA9IHsgY3VycmVudDogMCwgdG90YWw6IDAgfTtcblx0cHJpdmF0ZSBsYXN0UHJvZ3Jlc3NBdDogbnVtYmVyID0gMDtcblxuXHRjb25zdHJ1Y3RvcihsZWFmOiBXb3Jrc3BhY2VMZWFmLCBwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbikge1xuXHRcdHN1cGVyKGxlYWYpO1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHR9XG5cblx0Z2V0Vmlld1R5cGUoKSB7XG5cdFx0cmV0dXJuIFZJRVdfVFlQRV9EVVBMSUNBVEVfREVURUNUSU9OO1xuXHR9XG5cblx0Z2V0RGlzcGxheVRleHQoKSB7XG5cdFx0cmV0dXJuIHRoaXMucGx1Z2luLnQoJ2R1cGxpY2F0ZURldGVjdGlvbicpO1xuXHR9XG5cblx0YXN5bmMgb25PcGVuKCkge1xuXHRcdGxldCByZXRyaWVzID0gMDtcblx0XHR3aGlsZSAoIXRoaXMuY29udGVudEVsICYmIHJldHJpZXMgPCAxMCkge1xuXHRcdFx0YXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwKSk7XG5cdFx0XHRyZXRyaWVzKys7XG5cdFx0fVxuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0R1cGxpY2F0ZURldGVjdGlvblZpZXc6IGNvbnRlbnRFbCBub3QgcmVhZHknKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly8gRW5zdXJlIHN0eWxlcyBleGlzdCBldmVuIGlmIGV4dGVybmFsIHN0eWxlc2hlZXQgd2FzIHJlbW92ZWQgb3Igbm90IGxvYWRlZC5cblx0XHR0aGlzLmVuc3VyZVN0eWxlcygpO1xuXHRcdC8vIFJlc2V0IHNjYW4gc3RhdGUgb24gcmVvcGVuIHRvIGF2b2lkIHN0YWxlIFwiaXNTY2FubmluZ1wiIGJsb2NraW5nIHRoZSBVSS5cblx0XHR0aGlzLmlzU2Nhbm5pbmcgPSBmYWxzZTtcblx0XHR0aGlzLnNjYW5Qcm9ncmVzcyA9IHsgY3VycmVudDogMCwgdG90YWw6IDAgfTtcblx0XHR0aGlzLmNvbnRlbnRFbC5hZGRDbGFzcygnZHVwbGljYXRlLWRldGVjdGlvbi12aWV3Jyk7XG5cdFx0YXdhaXQgdGhpcy5yZW5kZXJWaWV3KCk7XG5cdH1cblxuXHRhc3luYyBvbkNsb3NlKCkge1xuXHRcdHRoaXMuaXNTY2FubmluZyA9IGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1ODlDNlx1NTZGRVxuXHQgKi9cblx0YXN5bmMgcmVuZGVyVmlldygpIHtcblx0XHRpZiAoIXRoaXMuY29udGVudEVsKSByZXR1cm47XG5cdFx0dGhpcy5lbnN1cmVTdHlsZXMoKTtcblx0XHR0aGlzLmNvbnRlbnRFbC5lbXB0eSgpO1xuXG5cdFx0dGhpcy5yZW5kZXJIZWFkZXIoKTtcblxuXHRcdGlmICh0aGlzLmlzU2Nhbm5pbmcpIHtcblx0XHRcdHRoaXMucmVuZGVyUHJvZ3Jlc3MoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5kdXBsaWNhdGVHcm91cHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRjb25zdCBlbXB0eVN0YXRlID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWVtcHR5LXN0YXRlJyB9KTtcblx0XHRcdGVtcHR5U3RhdGUuY3JlYXRlRGl2KHtcblx0XHRcdFx0Y2xzOiAnZHVwbGljYXRlLWVtcHR5LXRleHQnLFxuXHRcdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdub0R1cGxpY2F0ZXNGb3VuZCcpXG5cdFx0XHR9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBcdTdFREZcdThCQTFcblx0XHRjb25zdCB0b3RhbER1cGxpY2F0ZXMgPSB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5yZWR1Y2UoXG5cdFx0XHQoc3VtLCBnKSA9PiBzdW0gKyBnLmZpbGVzLmxlbmd0aCAtIDEsIDBcblx0XHQpO1xuXHRcdGNvbnN0IHN0YXRzQmFyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLXN0YXRzLWJhcicgfSk7XG5cdFx0c3RhdHNCYXIuY3JlYXRlU3Bhbih7XG5cdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdkdXBsaWNhdGVHcm91cHNGb3VuZCcsIHtcblx0XHRcdFx0Z3JvdXBzOiB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5sZW5ndGgsXG5cdFx0XHRcdGZpbGVzOiB0b3RhbER1cGxpY2F0ZXNcblx0XHRcdH0pLFxuXHRcdFx0Y2xzOiAnZHVwbGljYXRlLXN0YXRzLWNvdW50J1xuXHRcdH0pO1xuXG5cdFx0Ly8gXHU0RTAwXHU5NTJFXHU2RTA1XHU3NDA2XHU2MzA5XHU5NEFFXG5cdFx0Y29uc3QgY2xlYW5BbGxCdG4gPSBzdGF0c0Jhci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdkdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbicgfSk7XG5cdFx0c2V0SWNvbihjbGVhbkFsbEJ0biwgJ2Jyb29tJyk7XG5cdFx0Y2xlYW5BbGxCdG4uY3JlYXRlU3Bhbih7IHRleHQ6IGAgJHt0aGlzLnBsdWdpbi50KCdxdWFyYW50aW5lQWxsRHVwbGljYXRlcycpfWAgfSk7XG5cdFx0Y2xlYW5BbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLnF1YXJhbnRpbmVBbGxEdXBsaWNhdGVzKCkpO1xuXG5cdFx0Ly8gXHU2RTMyXHU2N0QzXHU5MUNEXHU1OTBEXHU3RUM0XG5cdFx0Y29uc3QgZ3JvdXBzQ29udGFpbmVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWdyb3VwcycgfSk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5yZW5kZXJEdXBsaWNhdGVHcm91cChncm91cHNDb250YWluZXIsIHRoaXMuZHVwbGljYXRlR3JvdXBzW2ldLCBpICsgMSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NTkzNFx1OTBFOFxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJIZWFkZXIoKSB7XG5cdFx0Y29uc3QgaGVhZGVyID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWhlYWRlcicgfSk7XG5cdFx0aGVhZGVyLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy5wbHVnaW4udCgnZHVwbGljYXRlRGV0ZWN0aW9uJykgfSk7XG5cblx0XHRjb25zdCBkZXNjID0gaGVhZGVyLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1oZWFkZXItZGVzY3JpcHRpb24nIH0pO1xuXHRcdGRlc2MuY3JlYXRlU3Bhbih7IHRleHQ6IHRoaXMucGx1Z2luLnQoJ2R1cGxpY2F0ZURldGVjdGlvbkRlc2MnKSB9KTtcblxuXHRcdGNvbnN0IGFjdGlvbnMgPSBoZWFkZXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWhlYWRlci1hY3Rpb25zJyB9KTtcblx0XHR0aGlzLnJlbmRlclN0YXJ0U2NhbkJ1dHRvbihhY3Rpb25zKTtcblxuXHRcdC8vIFx1OTYwOFx1NTAzQ1x1NjYzRVx1NzkzQVxuXHRcdGFjdGlvbnMuY3JlYXRlU3Bhbih7XG5cdFx0XHRjbHM6ICdkdXBsaWNhdGUtdGhyZXNob2xkLWxhYmVsJyxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NpbWlsYXJpdHlUaHJlc2hvbGQnLCB7XG5cdFx0XHRcdHZhbHVlOiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kdXBsaWNhdGVUaHJlc2hvbGRcblx0XHRcdH0pXG5cdFx0fSk7XG5cdH1cblxuXHRwcml2YXRlIHJlbmRlclN0YXJ0U2NhbkJ1dHRvbihjb250YWluZXI6IEhUTUxFbGVtZW50LCBleHRyYUNsYXNzPzogc3RyaW5nKSB7XG5cdFx0Y29uc3QgY2xzID0gWydkdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbicsICdkdXBsaWNhdGUtYWN0aW9uLWJ1dHRvbi1wcmltYXJ5J107XG5cdFx0aWYgKGV4dHJhQ2xhc3MpIGNscy5wdXNoKGV4dHJhQ2xhc3MpO1xuXG5cdFx0Y29uc3Qgc2NhbkJ0biA9IGNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6IGNscy5qb2luKCcgJykgfSk7XG5cdFx0c2V0SWNvbihzY2FuQnRuLCAnc2VhcmNoJyk7XG5cdFx0c2NhbkJ0bi5jcmVhdGVTcGFuKHsgdGV4dDogYCAke3RoaXMucGx1Z2luLnQoJ3N0YXJ0U2NhbicpfWAgfSk7XG5cdFx0c2NhbkJ0bi5kaXNhYmxlZCA9IHRoaXMuaXNTY2FubmluZztcblx0XHRzY2FuQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dm9pZCB0aGlzLnN0YXJ0U2NhbigpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBzY2FuQnRuO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NjI2Qlx1NjNDRlx1OEZEQlx1NUVBNlxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJQcm9ncmVzcygpIHtcblx0XHRjb25zdCBwcm9ncmVzc0NvbnRhaW5lciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1zY2FuLXByb2dyZXNzJyB9KTtcblxuXHRcdGNvbnN0IHByb2dyZXNzQmFyID0gcHJvZ3Jlc3NDb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLXByb2dyZXNzLWJhcicgfSk7XG5cdFx0Y29uc3QgcHJvZ3Jlc3NGaWxsID0gcHJvZ3Jlc3NCYXIuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLXByb2dyZXNzLWZpbGwnIH0pO1xuXHRcdGNvbnN0IHBlcmNlbnQgPSB0aGlzLnNjYW5Qcm9ncmVzcy50b3RhbCA+IDBcblx0XHRcdD8gTWF0aC5yb3VuZCgodGhpcy5zY2FuUHJvZ3Jlc3MuY3VycmVudCAvIHRoaXMuc2NhblByb2dyZXNzLnRvdGFsKSAqIDEwMClcblx0XHRcdDogMDtcblx0XHRwcm9ncmVzc0ZpbGwuc3R5bGUud2lkdGggPSBgJHtwZXJjZW50fSVgO1xuXG5cdFx0cHJvZ3Jlc3NDb250YWluZXIuY3JlYXRlRGl2KHtcblx0XHRcdGNsczogJ2R1cGxpY2F0ZS1wcm9ncmVzcy10ZXh0Jyxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ3NjYW5Qcm9ncmVzcycsIHtcblx0XHRcdFx0Y3VycmVudDogdGhpcy5zY2FuUHJvZ3Jlc3MuY3VycmVudCxcblx0XHRcdFx0dG90YWw6IHRoaXMuc2NhblByb2dyZXNzLnRvdGFsXG5cdFx0XHR9KVxuXHRcdH0pO1xuXHR9XG5cblx0cHJpdmF0ZSBjb21wYXJlRHVwbGljYXRlRmlsZXMocGF0aEE6IHN0cmluZywgcGF0aEI6IHN0cmluZyk6IG51bWJlciB7XG5cdFx0Y29uc3QgZmlsZUEgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocGF0aEEpO1xuXHRcdGNvbnN0IGZpbGVCID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGhCKTtcblxuXHRcdGlmIChmaWxlQSBpbnN0YW5jZW9mIFRGaWxlICYmIGZpbGVCIGluc3RhbmNlb2YgVEZpbGUpIHtcblx0XHRcdHJldHVybiAoZmlsZUIuc3RhdC5tdGltZSAtIGZpbGVBLnN0YXQubXRpbWUpXG5cdFx0XHRcdHx8IChmaWxlQi5zdGF0LnNpemUgLSBmaWxlQS5zdGF0LnNpemUpXG5cdFx0XHRcdHx8IHBhdGhBLmxvY2FsZUNvbXBhcmUocGF0aEIpO1xuXHRcdH1cblx0XHRpZiAoZmlsZUEgaW5zdGFuY2VvZiBURmlsZSkgcmV0dXJuIC0xO1xuXHRcdGlmIChmaWxlQiBpbnN0YW5jZW9mIFRGaWxlKSByZXR1cm4gMTtcblx0XHRyZXR1cm4gcGF0aEEubG9jYWxlQ29tcGFyZShwYXRoQik7XG5cdH1cblxuXHRwcml2YXRlIG5vcm1hbGl6ZUR1cGxpY2F0ZUdyb3VwKGdyb3VwOiBEdXBsaWNhdGVHcm91cCk6IER1cGxpY2F0ZUdyb3VwIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Li4uZ3JvdXAsXG5cdFx0XHRmaWxlczogWy4uLmdyb3VwLmZpbGVzXS5zb3J0KChhLCBiKSA9PiB0aGlzLmNvbXBhcmVEdXBsaWNhdGVGaWxlcyhhLnBhdGgsIGIucGF0aCkpXG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTVGMDBcdTU5Q0JcdTYyNkJcdTYzQ0Zcblx0ICovXG5cdGFzeW5jIHN0YXJ0U2NhbigpIHtcblx0XHRpZiAodGhpcy5pc1NjYW5uaW5nKSB7XG5cdFx0XHQvLyBJZiB0aGUgcHJldmlvdXMgc2NhbiBhcHBlYXJzIHN0dWNrLCBhbGxvdyBhIHJlc3RhcnQuXG5cdFx0XHRjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuXHRcdFx0aWYgKHRoaXMubGFzdFByb2dyZXNzQXQgJiYgbm93IC0gdGhpcy5sYXN0UHJvZ3Jlc3NBdCA+IDE1MDAwKSB7XG5cdFx0XHRcdHRoaXMuaXNTY2FubmluZyA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLmlzU2Nhbm5pbmcgPSB0cnVlO1xuXHRcdHRoaXMuZHVwbGljYXRlR3JvdXBzID0gW107XG5cdFx0dGhpcy5sYXN0UHJvZ3Jlc3NBdCA9IERhdGUubm93KCk7XG5cblx0XHR0cnkge1xuXHRcdFx0Ly8gXHU4M0I3XHU1M0Q2XHU2MjQwXHU2NzA5XHU1NkZFXHU3MjQ3XHU2NTg3XHU0RUY2XG5cdFx0XHRjb25zdCBpbWFnZUZpbGVzOiBURmlsZVtdID0gW107XG5cdFx0XHRpZiAodGhpcy5wbHVnaW4uZmlsZUluZGV4LmlzSW5pdGlhbGl6ZWQpIHtcblx0XHRcdFx0Zm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLnBsdWdpbi5maWxlSW5kZXguZ2V0RmlsZXMoKSkge1xuXHRcdFx0XHRcdGlmIChnZXRNZWRpYVR5cGUoZW50cnkubmFtZSkgPT09ICdpbWFnZScpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZW50cnkucGF0aCk7XG5cdFx0XHRcdFx0XHRpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG5cdFx0XHRcdFx0XHRcdGltYWdlRmlsZXMucHVzaChmaWxlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IGFsbEZpbGVzID0gYXdhaXQgdGhpcy5wbHVnaW4uZ2V0QWxsSW1hZ2VGaWxlcygpO1xuXHRcdFx0XHRpbWFnZUZpbGVzLnB1c2goLi4uYWxsRmlsZXMuZmlsdGVyKGYgPT4gZ2V0TWVkaWFUeXBlKGYubmFtZSkgPT09ICdpbWFnZScpKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5zY2FuUHJvZ3Jlc3MgPSB7IGN1cnJlbnQ6IDAsIHRvdGFsOiBpbWFnZUZpbGVzLmxlbmd0aCB9O1xuXHRcdFx0dGhpcy5sYXN0UHJvZ3Jlc3NBdCA9IERhdGUubm93KCk7XG5cdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblxuXHRcdFx0Ly8gXHU1MjA2XHU2Mjc5XHU4QkExXHU3Qjk3XHU1NEM4XHU1RTBDXG5cdFx0XHRjb25zdCBoYXNoTWFwID0gbmV3IE1hcDxzdHJpbmcsIEltYWdlSGFzaD4oKTtcblx0XHRcdGNvbnN0IEJBVENIX1NJWkUgPSA1O1xuXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGltYWdlRmlsZXMubGVuZ3RoOyBpICs9IEJBVENIX1NJWkUpIHtcblx0XHRcdFx0Y29uc3QgYmF0Y2ggPSBpbWFnZUZpbGVzLnNsaWNlKGksIGkgKyBCQVRDSF9TSVpFKTtcblxuXHRcdFx0XHRhd2FpdCBQcm9taXNlLmFsbChiYXRjaC5tYXAoYXN5bmMgKGZpbGUpID0+IHtcblx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0Y29uc3Qgc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdFx0XHRcdFx0Y29uc3QgaGFzaCA9IGF3YWl0IGNvbXB1dGVQZXJjZXB0dWFsSGFzaChzcmMpO1xuXHRcdFx0XHRcdFx0aGFzaE1hcC5zZXQoZmlsZS5wYXRoLCBoYXNoKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKGBIYXNoIGNvbXB1dGF0aW9uIGZhaWxlZCBmb3IgJHtmaWxlLm5hbWV9OmAsIGVycm9yKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pKTtcblxuXHRcdFx0XHR0aGlzLnNjYW5Qcm9ncmVzcy5jdXJyZW50ID0gTWF0aC5taW4oaSArIEJBVENIX1NJWkUsIGltYWdlRmlsZXMubGVuZ3RoKTtcblx0XHRcdFx0dGhpcy5sYXN0UHJvZ3Jlc3NBdCA9IERhdGUubm93KCk7XG5cblx0XHRcdFx0Ly8gXHU2NkY0XHU2NUIwXHU4RkRCXHU1RUE2IFVJXG5cdFx0XHRcdGNvbnN0IHByb2dyZXNzRmlsbCA9IHRoaXMuY29udGVudEVsLnF1ZXJ5U2VsZWN0b3IoJy5kdXBsaWNhdGUtcHJvZ3Jlc3MtZmlsbCcpIGFzIEhUTUxFbGVtZW50O1xuXHRcdFx0XHRjb25zdCBwcm9ncmVzc1RleHQgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKCcuZHVwbGljYXRlLXByb2dyZXNzLXRleHQnKSBhcyBIVE1MRWxlbWVudDtcblx0XHRcdFx0aWYgKHByb2dyZXNzRmlsbCAmJiBwcm9ncmVzc1RleHQpIHtcblx0XHRcdFx0XHRjb25zdCBwZXJjZW50ID0gTWF0aC5yb3VuZCgodGhpcy5zY2FuUHJvZ3Jlc3MuY3VycmVudCAvIHRoaXMuc2NhblByb2dyZXNzLnRvdGFsKSAqIDEwMCk7XG5cdFx0XHRcdFx0cHJvZ3Jlc3NGaWxsLnN0eWxlLndpZHRoID0gYCR7cGVyY2VudH0lYDtcblx0XHRcdFx0XHRwcm9ncmVzc1RleHQudGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi50KCdzY2FuUHJvZ3Jlc3MnLCB7XG5cdFx0XHRcdFx0XHRjdXJyZW50OiB0aGlzLnNjYW5Qcm9ncmVzcy5jdXJyZW50LFxuXHRcdFx0XHRcdFx0dG90YWw6IHRoaXMuc2NhblByb2dyZXNzLnRvdGFsXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBcdThCQTkgVUkgXHU2NzA5XHU2NzNBXHU0RjFBXHU2NkY0XHU2NUIwXG5cdFx0XHRcdGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMCkpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBcdTY3RTVcdTYyN0VcdTkxQ0RcdTU5MERcdTdFQzRcblx0XHRcdGNvbnN0IHRocmVzaG9sZCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmR1cGxpY2F0ZVRocmVzaG9sZDtcblx0XHRcdHRoaXMuZHVwbGljYXRlR3JvdXBzID0gZmluZER1cGxpY2F0ZUdyb3VwcyhoYXNoTWFwLCB0aHJlc2hvbGQpXG5cdFx0XHRcdC5tYXAoZ3JvdXAgPT4gdGhpcy5ub3JtYWxpemVEdXBsaWNhdGVHcm91cChncm91cCkpO1xuXHRcdFx0dGhpcy5kdXBsaWNhdGVHcm91cHMuc29ydCgoYSwgYikgPT4ge1xuXHRcdFx0XHRjb25zdCBwYXRoQSA9IGEuZmlsZXNbMF0/LnBhdGggfHwgJyc7XG5cdFx0XHRcdGNvbnN0IHBhdGhCID0gYi5maWxlc1swXT8ucGF0aCB8fCAnJztcblx0XHRcdFx0cmV0dXJuIHBhdGhBLmxvY2FsZUNvbXBhcmUocGF0aEIpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdub0R1cGxpY2F0ZXNGb3VuZCcpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IHRvdGFsRHVwbGljYXRlcyA9IHRoaXMuZHVwbGljYXRlR3JvdXBzLnJlZHVjZShcblx0XHRcdFx0XHQoc3VtLCBnKSA9PiBzdW0gKyBnLmZpbGVzLmxlbmd0aCAtIDEsIDBcblx0XHRcdFx0KTtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdkdXBsaWNhdGVzRm91bmQnLCB7XG5cdFx0XHRcdFx0Z3JvdXBzOiB0aGlzLmR1cGxpY2F0ZUdyb3Vwcy5sZW5ndGgsXG5cdFx0XHRcdFx0ZmlsZXM6IHRvdGFsRHVwbGljYXRlc1xuXHRcdFx0XHR9KSk7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0R1cGxpY2F0ZSBkZXRlY3Rpb24gZmFpbGVkOicsIGVycm9yKTtcblx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnc2NhbkVycm9yJykpO1xuXHRcdH0gZmluYWxseSB7XG5cdFx0XHR0aGlzLmlzU2Nhbm5pbmcgPSBmYWxzZTtcblx0XHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHRcdH1cblx0fVxuXG5cdHByaXZhdGUgZW5zdXJlU3R5bGVzKCkge1xuXHRcdGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb2JzaWRpYW4tbWVkaWEtdG9vbGtpdC1zdHlsZXMnKSB8fFxuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ltYWdlLW1hbmFnZXItc3R5bGVzJykpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dm9pZCB0aGlzLnBsdWdpbi5hZGRTdHlsZSgpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NTM1NVx1NEUyQVx1OTFDRFx1NTkwRFx1N0VDNFxuXHQgKi9cblx0cHJpdmF0ZSByZW5kZXJEdXBsaWNhdGVHcm91cChjb250YWluZXI6IEhUTUxFbGVtZW50LCBncm91cDogRHVwbGljYXRlR3JvdXAsIGluZGV4OiBudW1iZXIpIHtcblx0XHRncm91cC5maWxlcy5zb3J0KChhLCBiKSA9PiB0aGlzLmNvbXBhcmVEdXBsaWNhdGVGaWxlcyhhLnBhdGgsIGIucGF0aCkpO1xuXG5cdFx0Y29uc3QgZ3JvdXBFbCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZ3JvdXAnIH0pO1xuXG5cdFx0Ly8gXHU3RUM0XHU2ODA3XHU5ODk4XG5cdFx0Y29uc3QgZ3JvdXBIZWFkZXIgPSBncm91cEVsLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1ncm91cC1oZWFkZXInIH0pO1xuXHRcdGdyb3VwSGVhZGVyLmNyZWF0ZVNwYW4oe1xuXHRcdFx0Y2xzOiAnZHVwbGljYXRlLWdyb3VwLXRpdGxlJyxcblx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ2R1cGxpY2F0ZUdyb3VwJywgeyBpbmRleCB9KVxuXHRcdH0pO1xuXHRcdGdyb3VwSGVhZGVyLmNyZWF0ZVNwYW4oe1xuXHRcdFx0Y2xzOiAnZHVwbGljYXRlLWdyb3VwLWNvdW50Jyxcblx0XHRcdHRleHQ6IGAke2dyb3VwLmZpbGVzLmxlbmd0aH0gJHt0aGlzLnBsdWdpbi50KCdmaWxlcycpfWBcblx0XHR9KTtcblxuXHRcdC8vIFx1NjU4N1x1NEVGNlx1NTIxN1x1ODg2OFxuXHRcdGNvbnN0IGZpbGVMaXN0ID0gZ3JvdXBFbC5jcmVhdGVEaXYoeyBjbHM6ICdkdXBsaWNhdGUtZ3JvdXAtZmlsZXMnIH0pO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBncm91cC5maWxlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Y29uc3QgZmlsZUluZm8gPSBncm91cC5maWxlc1tpXTtcblx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZmlsZUluZm8ucGF0aCk7XG5cdFx0XHRpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcblxuXHRcdFx0Y29uc3QgZmlsZUVsID0gZmlsZUxpc3QuY3JlYXRlRGl2KHtcblx0XHRcdFx0Y2xzOiBgZHVwbGljYXRlLWdyb3VwLWZpbGUgJHtpID09PSAwID8gJ2R1cGxpY2F0ZS1rZWVwLXN1Z2dlc3Rpb24nIDogJ2R1cGxpY2F0ZS1maWxlLXN1Z2dlc3Rpb24nfWBcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBcdTdGMjlcdTc1NjVcdTU2RkVcblx0XHRcdGNvbnN0IHRodW1iID0gZmlsZUVsLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1maWxlLXRodW1ibmFpbCcgfSk7XG5cdFx0XHRjb25zdCBzcmMgPSB0aGlzLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cdFx0XHRjb25zdCBpbWcgPSB0aHVtYi5jcmVhdGVFbCgnaW1nJywge1xuXHRcdFx0XHRhdHRyOiB7IHNyYywgYWx0OiBmaWxlLm5hbWUgfVxuXHRcdFx0fSk7XG5cdFx0XHRpbWcuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoKSA9PiB7XG5cdFx0XHRcdHRodW1iLmVtcHR5KCk7XG5cdFx0XHRcdGNvbnN0IGljb24gPSB0aHVtYi5jcmVhdGVEaXYoKTtcblx0XHRcdFx0c2V0SWNvbihpY29uLCAnaW1hZ2UnKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBcdTY1ODdcdTRFRjZcdTRGRTFcdTYwNkZcblx0XHRcdGNvbnN0IGluZm8gPSBmaWxlRWwuY3JlYXRlRGl2KHsgY2xzOiAnZHVwbGljYXRlLWZpbGUtaW5mbycgfSk7XG5cdFx0XHRpbmZvLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1maWxlLW5hbWUnLCB0ZXh0OiBmaWxlLm5hbWUgfSk7XG5cdFx0XHRpbmZvLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1maWxlLXBhdGgnLCB0ZXh0OiBmaWxlLnBhdGggfSk7XG5cblx0XHRcdGNvbnN0IG1ldGEgPSBpbmZvLmNyZWF0ZURpdih7IGNsczogJ2R1cGxpY2F0ZS1maWxlLW1ldGEnIH0pO1xuXHRcdFx0bWV0YS5jcmVhdGVTcGFuKHsgdGV4dDogZm9ybWF0RmlsZVNpemUoZmlsZS5zdGF0LnNpemUpIH0pO1xuXHRcdFx0bWV0YS5jcmVhdGVTcGFuKHsgdGV4dDogYCB8ICR7bmV3IERhdGUoZmlsZS5zdGF0Lm10aW1lKS50b0xvY2FsZURhdGVTdHJpbmcoKX1gIH0pO1xuXHRcdFx0bWV0YS5jcmVhdGVTcGFuKHtcblx0XHRcdFx0Y2xzOiAnZHVwbGljYXRlLXNpbWlsYXJpdHktYmFkZ2UnLFxuXHRcdFx0XHR0ZXh0OiBgICR7ZmlsZUluZm8uc2ltaWxhcml0eX0lYFxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIFx1NjgwN1x1OEJCMFxuXHRcdFx0aWYgKGkgPT09IDApIHtcblx0XHRcdFx0ZmlsZUVsLmNyZWF0ZVNwYW4oeyBjbHM6ICdkdXBsaWNhdGUta2VlcC1iYWRnZScsIHRleHQ6IHRoaXMucGx1Z2luLnQoJ3N1Z2dlc3RLZWVwJykgfSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBcdTk2OTRcdTc5QkJcdTYzMDlcdTk0QUVcblx0XHRcdFx0Y29uc3QgcXVhcmFudGluZUJ0biA9IGZpbGVFbC5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdkdXBsaWNhdGUtcXVhcmFudGluZS1idG4nIH0pO1xuXHRcdFx0XHRzZXRJY29uKHF1YXJhbnRpbmVCdG4sICdhcmNoaXZlJyk7XG5cdFx0XHRcdHF1YXJhbnRpbmVCdG4uY3JlYXRlU3Bhbih7IHRleHQ6IGAgJHt0aGlzLnBsdWdpbi50KCdxdWFyYW50aW5lJyl9YCB9KTtcblx0XHRcdFx0cXVhcmFudGluZUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRjb25zdCBrZWVwRmlsZSA9IGdyb3VwLmZpbGVzWzBdO1xuXHRcdFx0XHRcdGlmICgha2VlcEZpbGUgfHwga2VlcEZpbGUucGF0aCA9PT0gZmlsZS5wYXRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cXVhcmFudGluZUJ0bi5kaXNhYmxlZCA9IHRydWU7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdGF3YWl0IHVwZGF0ZUxpbmtzSW5WYXVsdCh0aGlzLmFwcCwgZmlsZS5wYXRoLCBrZWVwRmlsZS5wYXRoKTtcblx0XHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucGx1Z2luLnNhZmVEZWxldGVGaWxlKGZpbGUpO1xuXHRcdFx0XHRcdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdFx0XHRcdFx0cXVhcmFudGluZUJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGdyb3VwLmZpbGVzID0gZ3JvdXAuZmlsZXMuZmlsdGVyKGVudHJ5ID0+IGVudHJ5LnBhdGggIT09IGZpbGUucGF0aCk7XG5cdFx0XHRcdFx0XHRpZiAoZ3JvdXAuZmlsZXMubGVuZ3RoIDw9IDEpIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgaWR4ID0gdGhpcy5kdXBsaWNhdGVHcm91cHMuaW5kZXhPZihncm91cCk7XG5cdFx0XHRcdFx0XHRcdGlmIChpZHggPj0gMCkgdGhpcy5kdXBsaWNhdGVHcm91cHMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnJlbmRlclZpZXcoKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcignXHU1MzU1XHU0RTJBXHU5MUNEXHU1OTBEXHU5Njk0XHU3OUJCXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcblx0XHRcdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnb3BlcmF0aW9uRmFpbGVkJywgeyBuYW1lOiBmaWxlLm5hbWUgfSkpO1xuXHRcdFx0XHRcdFx0cXVhcmFudGluZUJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NEUwMFx1OTUyRVx1OTY5NFx1NzlCQlx1NjI0MFx1NjcwOVx1OTFDRFx1NTkwRFx1OTg3OVx1RkYwOFx1NkJDRlx1N0VDNFx1NEZERFx1NzU1OVx1NjcwMFx1NjVCMFx1NzI0OFx1RkYwOVxuXHQgKi9cblx0YXN5bmMgcXVhcmFudGluZUFsbER1cGxpY2F0ZXMoKSB7XG5cdFx0bGV0IHRvdGFsUXVhcmFudGluZWQgPSAwO1xuXG5cdFx0Zm9yIChjb25zdCBncm91cCBvZiB0aGlzLmR1cGxpY2F0ZUdyb3Vwcykge1xuXHRcdFx0Z3JvdXAuZmlsZXMuc29ydCgoYSwgYikgPT4gdGhpcy5jb21wYXJlRHVwbGljYXRlRmlsZXMoYS5wYXRoLCBiLnBhdGgpKTtcblxuXHRcdFx0Y29uc3Qga2VlcEZpbGUgPSBncm91cC5maWxlc1swXTtcblx0XHRcdC8vIFx1NEZERFx1NzU1OVx1N0IyQ1x1NEUwMFx1NEUyQVx1RkYwOFx1NjcwMFx1NjVCMFx1RkYwOVx1RkYwQ1x1OTY5NFx1NzlCQlx1NTE3Nlx1NEY1OVxuXHRcdFx0Zm9yIChsZXQgaSA9IDE7IGkgPCBncm91cC5maWxlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zdCBlbnRyeSA9IGdyb3VwLmZpbGVzW2ldO1xuXHRcdFx0XHRjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKGVudHJ5LnBhdGgpO1xuXHRcdFx0XHRpZiAoIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSBjb250aW51ZTtcblxuXHRcdFx0XHRhd2FpdCB1cGRhdGVMaW5rc0luVmF1bHQodGhpcy5hcHAsIGZpbGUucGF0aCwga2VlcEZpbGUucGF0aCk7XG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucGx1Z2luLnNhZmVEZWxldGVGaWxlKGZpbGUpO1xuXHRcdFx0XHRpZiAocmVzdWx0KSB0b3RhbFF1YXJhbnRpbmVkKys7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdkdXBsaWNhdGVzUXVhcmFudGluZWQnLCB7IGNvdW50OiB0b3RhbFF1YXJhbnRpbmVkIH0pKTtcblx0XHR0aGlzLmR1cGxpY2F0ZUdyb3VwcyA9IFtdO1xuXHRcdGF3YWl0IHRoaXMucmVuZGVyVmlldygpO1xuXHR9XG59XG4iLCAiLyoqXG4gKiBcdTYxMUZcdTc3RTVcdTU0QzhcdTVFMENcdTUzQkJcdTkxQ0RcdTZBMjFcdTU3NTdcbiAqIFx1NEY3Rlx1NzUyOCBEQ1QgcEhhc2ggKyBkSGFzaCBcdTdFQzRcdTU0MDhcdTU0QzhcdTVFMENcdTVCOUVcdTczQjBcdTUwQ0ZcdTdEMjBcdTdFQTdcdTU2RkVcdTcyNDdcdTUzQkJcdTkxQ0RcbiAqIFx1N0VBRlx1NkQ0Rlx1ODlDOFx1NTY2OCBDYW52YXMgQVBJIFx1NUI5RVx1NzNCMFx1RkYwQ1x1NjVFMFx1NTkxNlx1OTBFOFx1NEY5RFx1OEQ1NlxuICovXG5cbmNvbnN0IERFRkFVTFRfSU1BR0VfTE9BRF9USU1FT1VUID0gODAwMDtcbmNvbnN0IEhBU0hfQkFDS0dST1VORF9SR0IgPSAyNTU7XG5jb25zdCBBTFBIQV9DT05URU5UX1RIUkVTSE9MRCA9IDg7XG5cbmludGVyZmFjZSBJbWFnZUJvdW5kcyB7XG5cdGxlZnQ6IG51bWJlcjtcblx0dG9wOiBudW1iZXI7XG5cdHdpZHRoOiBudW1iZXI7XG5cdGhlaWdodDogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgU291cmNlQml0bWFwIHtcblx0Y2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcblx0aW1hZ2VEYXRhOiBJbWFnZURhdGE7XG5cdGJvdW5kczogSW1hZ2VCb3VuZHM7XG5cdGhhc1RyYW5zcGFyZW5jeTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBcdThCQTFcdTdCOTdcdTkwMEZcdTY2MEVcdTU2RkVcdTcyNDdcdTc2ODRcdTY3MDlcdTY1NDhcdTUxODVcdTVCQjlcdTUzM0FcdTU3REZcdTMwMDJcbiAqIFx1OEZEOVx1NjgzN1x1NTNFRlx1NEVFNVx1NTFDRlx1NUMxMVx1NTkyN1x1OTc2Mlx1NzlFRlx1OTAwRlx1NjYwRVx1NzU1OVx1NzY3RFx1NUJGOVx1NTRDOFx1NUUwQ1x1N0VEM1x1Njc5Q1x1NzY4NFx1NUU3Mlx1NjI3MFx1MzAwMlxuICovXG5mdW5jdGlvbiBhbmFseXplSW1hZ2VEYXRhKGltYWdlRGF0YTogSW1hZ2VEYXRhKTogeyBib3VuZHM6IEltYWdlQm91bmRzOyBoYXNUcmFuc3BhcmVuY3k6IGJvb2xlYW4gfSB7XG5cdGNvbnN0IHsgZGF0YSwgd2lkdGgsIGhlaWdodCB9ID0gaW1hZ2VEYXRhO1xuXHRsZXQgbGVmdCA9IHdpZHRoO1xuXHRsZXQgdG9wID0gaGVpZ2h0O1xuXHRsZXQgcmlnaHQgPSAtMTtcblx0bGV0IGJvdHRvbSA9IC0xO1xuXHRsZXQgaGFzVHJhbnNwYXJlbmN5ID0gZmFsc2U7XG5cblx0Zm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xuXHRcdGZvciAobGV0IHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xuXHRcdFx0Y29uc3QgYWxwaGEgPSBkYXRhWyh5ICogd2lkdGggKyB4KSAqIDQgKyAzXTtcblx0XHRcdGlmIChhbHBoYSA8IDI1NSkge1xuXHRcdFx0XHRoYXNUcmFuc3BhcmVuY3kgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGFscGhhIDw9IEFMUEhBX0NPTlRFTlRfVEhSRVNIT0xEKSBjb250aW51ZTtcblxuXHRcdFx0aWYgKHggPCBsZWZ0KSBsZWZ0ID0geDtcblx0XHRcdGlmICh5IDwgdG9wKSB0b3AgPSB5O1xuXHRcdFx0aWYgKHggPiByaWdodCkgcmlnaHQgPSB4O1xuXHRcdFx0aWYgKHkgPiBib3R0b20pIGJvdHRvbSA9IHk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKHJpZ2h0IDwgbGVmdCB8fCBib3R0b20gPCB0b3ApIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Ym91bmRzOiB7IGxlZnQ6IDAsIHRvcDogMCwgd2lkdGgsIGhlaWdodCB9LFxuXHRcdFx0aGFzVHJhbnNwYXJlbmN5XG5cdFx0fTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0Ym91bmRzOiB7XG5cdFx0XHRsZWZ0LFxuXHRcdFx0dG9wLFxuXHRcdFx0d2lkdGg6IHJpZ2h0IC0gbGVmdCArIDEsXG5cdFx0XHRoZWlnaHQ6IGJvdHRvbSAtIHRvcCArIDFcblx0XHR9LFxuXHRcdGhhc1RyYW5zcGFyZW5jeVxuXHR9O1xufVxuXG4vKipcbiAqIFx1OEJGQlx1NTNENlx1NTM5Rlx1NTZGRVx1NTBDRlx1N0QyMFx1NjU3MFx1NjM2RVx1RkYwQ1x1NUU3Nlx1OTg4NFx1NTE0OFx1NTIwNlx1Njc5MFx1OTAwRlx1NjYwRVx1NTMzQVx1NTdERlx1NEUwRVx1NjcwOVx1NjU0OFx1NTE4NVx1NUJCOVx1OEZCOVx1NzU0Q1x1MzAwMlxuICovXG5mdW5jdGlvbiBjYXB0dXJlU291cmNlQml0bWFwKGltZzogSFRNTEltYWdlRWxlbWVudCk6IFNvdXJjZUJpdG1hcCB7XG5cdGNvbnN0IHNvdXJjZUNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRzb3VyY2VDYW52YXMud2lkdGggPSBpbWcubmF0dXJhbFdpZHRoIHx8IGltZy53aWR0aDtcblx0c291cmNlQ2FudmFzLmhlaWdodCA9IGltZy5uYXR1cmFsSGVpZ2h0IHx8IGltZy5oZWlnaHQ7XG5cdGNvbnN0IHNvdXJjZUN0eCA9IHNvdXJjZUNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcblx0c291cmNlQ3R4LmRyYXdJbWFnZShpbWcsIDAsIDApO1xuXG5cdGNvbnN0IHNvdXJjZUltYWdlRGF0YSA9IHNvdXJjZUN0eC5nZXRJbWFnZURhdGEoMCwgMCwgc291cmNlQ2FudmFzLndpZHRoLCBzb3VyY2VDYW52YXMuaGVpZ2h0KTtcblx0Y29uc3QgeyBib3VuZHMsIGhhc1RyYW5zcGFyZW5jeSB9ID0gYW5hbHl6ZUltYWdlRGF0YShzb3VyY2VJbWFnZURhdGEpO1xuXG5cdHJldHVybiB7XG5cdFx0Y2FudmFzOiBzb3VyY2VDYW52YXMsXG5cdFx0aW1hZ2VEYXRhOiBzb3VyY2VJbWFnZURhdGEsXG5cdFx0Ym91bmRzLFxuXHRcdGhhc1RyYW5zcGFyZW5jeVxuXHR9O1xufVxuXG4vKipcbiAqIFx1ODNCN1x1NTNENlx1NTZGRVx1NzI0N1x1NzY4NFx1NzA3MFx1NUVBNlx1NTBDRlx1N0QyMFx1NjU3MFx1NjM2RVx1MzAwMlxuICogXHU1QkY5XHU5MDBGXHU2NjBFIFBORyBcdTRGMUFcdTUxNDhcdTU3MjhcdTc2N0RcdTVFOTVcdTRFMEFcdTU0MDhcdTYyMTBcdUZGMENcdTUxOERcdTg4QzFcdTYzODlcdTkwMEZcdTY2MEVcdTc1NTlcdTc2N0RcdUZGMENcdTkwN0ZcdTUxNERcdTkwMEZcdTY2MEVcdTgwQ0NcdTY2NkZcdTRFMEVcdTlFRDFcdTgyNzJcdTU2RkVcdTVGNjJcdTg4QUJcdThCRUZcdThCQTRcdTRFM0FcdTU0MENcdTRFMDBcdTc5Q0RcdTUwQ0ZcdTdEMjBcdTMwMDJcbiAqL1xuZnVuY3Rpb24gZ2V0R3JheXNjYWxlRGF0YShzb3VyY2U6IFNvdXJjZUJpdG1hcCwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiBudW1iZXJbXSB7XG5cdGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRjYW52YXMud2lkdGggPSB3aWR0aDtcblx0Y2FudmFzLmhlaWdodCA9IGhlaWdodDtcblx0Y29uc3QgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJykhO1xuXHRjdHguZmlsbFN0eWxlID0gYHJnYigke0hBU0hfQkFDS0dST1VORF9SR0J9LCAke0hBU0hfQkFDS0dST1VORF9SR0J9LCAke0hBU0hfQkFDS0dST1VORF9SR0J9KWA7XG5cdGN0eC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcblx0Y3R4LmRyYXdJbWFnZShcblx0XHRzb3VyY2UuY2FudmFzLFxuXHRcdHNvdXJjZS5ib3VuZHMubGVmdCxcblx0XHRzb3VyY2UuYm91bmRzLnRvcCxcblx0XHRzb3VyY2UuYm91bmRzLndpZHRoLFxuXHRcdHNvdXJjZS5ib3VuZHMuaGVpZ2h0LFxuXHRcdDAsXG5cdFx0MCxcblx0XHR3aWR0aCxcblx0XHRoZWlnaHRcblx0KTtcblxuXHRjb25zdCBpbWFnZURhdGEgPSBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXHRjb25zdCBkYXRhID0gaW1hZ2VEYXRhLmRhdGE7XG5cdGNvbnN0IGdyYXk6IG51bWJlcltdID0gW107XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSArPSA0KSB7XG5cdFx0Z3JheS5wdXNoKDAuMjk5ICogZGF0YVtpXSArIDAuNTg3ICogZGF0YVtpICsgMV0gKyAwLjExNCAqIGRhdGFbaSArIDJdKTtcblx0fVxuXG5cdHJldHVybiBncmF5O1xufVxuXG4vKipcbiAqIFx1N0I4MFx1NTMxNiBEQ1QgXHU1M0Q4XHU2MzYyXHVGRjA4XHU0RUM1XHU4QkExXHU3Qjk3XHU0RjRFXHU5ODkxXHU1MjA2XHU5MUNGXHVGRjA5XG4gKi9cbmZ1bmN0aW9uIGRjdDJkKG1hdHJpeDogbnVtYmVyW10sIHNpemU6IG51bWJlciwgb3V0cHV0U2l6ZTogbnVtYmVyKTogbnVtYmVyW10ge1xuXHRjb25zdCByZXN1bHQ6IG51bWJlcltdID0gbmV3IEFycmF5KG91dHB1dFNpemUgKiBvdXRwdXRTaXplKTtcblxuXHRmb3IgKGxldCB1ID0gMDsgdSA8IG91dHB1dFNpemU7IHUrKykge1xuXHRcdGZvciAobGV0IHYgPSAwOyB2IDwgb3V0cHV0U2l6ZTsgdisrKSB7XG5cdFx0XHRsZXQgc3VtID0gMDtcblx0XHRcdGZvciAobGV0IHggPSAwOyB4IDwgc2l6ZTsgeCsrKSB7XG5cdFx0XHRcdGZvciAobGV0IHkgPSAwOyB5IDwgc2l6ZTsgeSsrKSB7XG5cdFx0XHRcdFx0c3VtICs9IG1hdHJpeFt4ICogc2l6ZSArIHldICpcblx0XHRcdFx0XHRcdE1hdGguY29zKE1hdGguUEkgKiAoMiAqIHggKyAxKSAqIHUgLyAoMiAqIHNpemUpKSAqXG5cdFx0XHRcdFx0XHRNYXRoLmNvcyhNYXRoLlBJICogKDIgKiB5ICsgMSkgKiB2IC8gKDIgKiBzaXplKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJlc3VsdFt1ICogb3V0cHV0U2l6ZSArIHZdID0gc3VtO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogRENUIHBIYXNoOiAzMlx1MDBENzMyXHU3MDcwXHU1RUE2IFx1MjE5MiBEQ1QgXHUyMTkyIFx1NTNENjhcdTAwRDc4XHU0RjRFXHU5ODkxIFx1MjE5MiBcdTRFMkRcdTRGNERcdTY1NzBcdTk2MDhcdTUwM0MgXHUyMTkyIDY0LWJpdCBoZXhcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZVBIYXNoKHNvdXJjZTogU291cmNlQml0bWFwKTogc3RyaW5nIHtcblx0Y29uc3QgU0laRSA9IDMyO1xuXHRjb25zdCBMT1dfRlJFUSA9IDg7XG5cblx0Y29uc3QgZ3JheSA9IGdldEdyYXlzY2FsZURhdGEoc291cmNlLCBTSVpFLCBTSVpFKTtcblx0Y29uc3QgZGN0Q29lZmZzID0gZGN0MmQoZ3JheSwgU0laRSwgTE9XX0ZSRVEpO1xuXG5cdC8vIFx1NjM5Mlx1OTY2NCBEQyBcdTUyMDZcdTkxQ0YgKDAsMClcblx0Y29uc3QgdmFsdWVzID0gZGN0Q29lZmZzLnNsaWNlKDEpO1xuXHRjb25zdCBzb3J0ZWQgPSBbLi4udmFsdWVzXS5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG5cdGNvbnN0IG1lZGlhbiA9IHNvcnRlZFtNYXRoLmZsb29yKHNvcnRlZC5sZW5ndGggLyAyKV07XG5cblx0Ly8gXHU3NTFGXHU2MjEwIDY0LWJpdCBcdTU0QzhcdTVFMENcblx0bGV0IGhhc2ggPSAnJztcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBMT1dfRlJFUSAqIExPV19GUkVROyBpKyspIHtcblx0XHRoYXNoICs9IGRjdENvZWZmc1tpXSA+IG1lZGlhbiA/ICcxJyA6ICcwJztcblx0fVxuXG5cdHJldHVybiBiaW5hcnlUb0hleChoYXNoKTtcbn1cblxuLyoqXG4gKiBkSGFzaDogOVx1MDBENzhcdTcwNzBcdTVFQTYgXHUyMTkyIFx1NkMzNFx1NUU3M1x1NURFRVx1NTIwNiBcdTIxOTIgNjQtYml0IGhleFxuICovXG5mdW5jdGlvbiBjb21wdXRlREhhc2goc291cmNlOiBTb3VyY2VCaXRtYXApOiBzdHJpbmcge1xuXHRjb25zdCBncmF5ID0gZ2V0R3JheXNjYWxlRGF0YShzb3VyY2UsIDksIDgpO1xuXHRsZXQgaGFzaCA9ICcnO1xuXG5cdGZvciAobGV0IHkgPSAwOyB5IDwgODsgeSsrKSB7XG5cdFx0Zm9yIChsZXQgeCA9IDA7IHggPCA4OyB4KyspIHtcblx0XHRcdGhhc2ggKz0gZ3JheVt5ICogOSArIHhdIDwgZ3JheVt5ICogOSArIHggKyAxXSA/ICcxJyA6ICcwJztcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gYmluYXJ5VG9IZXgoaGFzaCk7XG59XG5cbi8qKlxuICogXHU0RThDXHU4RkRCXHU1MjM2XHU1QjU3XHU3QjI2XHU0RTMyXHU4RjZDXHU1MzQxXHU1MTZEXHU4RkRCXHU1MjM2XG4gKi9cbmZ1bmN0aW9uIGJpbmFyeVRvSGV4KGJpbmFyeTogc3RyaW5nKTogc3RyaW5nIHtcblx0bGV0IGhleCA9ICcnO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGJpbmFyeS5sZW5ndGg7IGkgKz0gNCkge1xuXHRcdGhleCArPSBwYXJzZUludChiaW5hcnkuc3Vic3RyaW5nKGksIGkgKyA0KSwgMikudG9TdHJpbmcoMTYpO1xuXHR9XG5cdHJldHVybiBoZXg7XG59XG5cbi8qKlxuICogXHU4QkExXHU3Qjk3XHU5MDBGXHU2NjBFXHU1NkZFXHU1MENGXHU3Njg0XHU4RjZFXHU1RUQzXHU1NEM4XHU1RTBDXHUzMDAyXG4gKiBcdTc2RjRcdTYzQTVcdTVCRjkgYWxwaGEgXHU4NDk5XHU3MjQ4XHU5MUM3XHU2ODM3XHVGRjBDXHU2QkQ0XHU1NzI4XHU5MDBGXHU2NjBFXHU4MENDXHU2NjZGXHU0RTBBXHU1MDVBXHU3MDcwXHU1RUE2XHU1NEM4XHU1RTBDXHU2NkY0XHU5MDAyXHU1NDA4XHU1NkZFXHU2ODA3XHU3QzdCXHU3RDIwXHU2NzUwXHUzMDAyXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVBbHBoYU1hc2tIYXNoKHNvdXJjZTogU291cmNlQml0bWFwKTogc3RyaW5nIHtcblx0Y29uc3QgU0laRSA9IDE2O1xuXHRjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblx0Y2FudmFzLndpZHRoID0gU0laRTtcblx0Y2FudmFzLmhlaWdodCA9IFNJWkU7XG5cdGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpITtcblx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBTSVpFLCBTSVpFKTtcblx0Y3R4LmRyYXdJbWFnZShcblx0XHRzb3VyY2UuY2FudmFzLFxuXHRcdHNvdXJjZS5ib3VuZHMubGVmdCxcblx0XHRzb3VyY2UuYm91bmRzLnRvcCxcblx0XHRzb3VyY2UuYm91bmRzLndpZHRoLFxuXHRcdHNvdXJjZS5ib3VuZHMuaGVpZ2h0LFxuXHRcdDAsXG5cdFx0MCxcblx0XHRTSVpFLFxuXHRcdFNJWkVcblx0KTtcblx0Y29uc3QgZGF0YSA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgU0laRSwgU0laRSkuZGF0YTtcblx0bGV0IGJpbmFyeSA9ICcnO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpICs9IDQpIHtcblx0XHRiaW5hcnkgKz0gZGF0YVtpICsgM10gPiBBTFBIQV9DT05URU5UX1RIUkVTSE9MRCA/ICcxJyA6ICcwJztcblx0fVxuXHRyZXR1cm4gYmluYXJ5VG9IZXgoYmluYXJ5KTtcbn1cblxuLyoqXG4gKiBcdThCQTFcdTdCOTdcdTkwMEZcdTY2MEVcdTU2RkVcdTUwQ0ZcdTc2ODRcdTdDOTdcdTk4OUNcdTgyNzJcdTdCN0VcdTU0MERcdTMwMDJcbiAqIFx1OTg5Q1x1ODI3Mlx1OTFDRlx1NTMxNlx1NTQwRVx1NTNFRlx1NEVFNVx1NUJCOVx1NUZDRFx1OEY3Qlx1NUZBRVx1NjI5N1x1OTUyRlx1OUY3Rlx1NURFRVx1NUYwMlx1RkYwQ1x1NTQwQ1x1NjVGNlx1OTA3Rlx1NTE0RFx1MjAxQ1x1NTQwQ1x1OEY2RVx1NUVEM1x1NEUwRFx1NTQwQ1x1OTg5Q1x1ODI3Mlx1MjAxRFx1ODhBQlx1NUY1M1x1NjIxMFx1NUI4Q1x1NTE2OFx1OTFDRFx1NTkwRFx1MzAwMlxuICovXG5mdW5jdGlvbiBjb21wdXRlUXVhbnRpemVkQ29sb3JIYXNoKHNvdXJjZTogU291cmNlQml0bWFwKTogc3RyaW5nIHtcblx0Y29uc3QgeyBkYXRhIH0gPSBzb3VyY2UuaW1hZ2VEYXRhO1xuXHRsZXQgdmlzaWJsZVBpeGVscyA9IDA7XG5cdGxldCByVG90YWwgPSAwO1xuXHRsZXQgZ1RvdGFsID0gMDtcblx0bGV0IGJUb3RhbCA9IDA7XG5cblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSArPSA0KSB7XG5cdFx0Y29uc3QgYWxwaGEgPSBkYXRhW2kgKyAzXTtcblx0XHRpZiAoYWxwaGEgPD0gQUxQSEFfQ09OVEVOVF9USFJFU0hPTEQpIGNvbnRpbnVlO1xuXG5cdFx0clRvdGFsICs9IGRhdGFbaV07XG5cdFx0Z1RvdGFsICs9IGRhdGFbaSArIDFdO1xuXHRcdGJUb3RhbCArPSBkYXRhW2kgKyAyXTtcblx0XHR2aXNpYmxlUGl4ZWxzKys7XG5cdH1cblxuXHRpZiAodmlzaWJsZVBpeGVscyA9PT0gMCkge1xuXHRcdHJldHVybiAnMDAwJztcblx0fVxuXG5cdGNvbnN0IHF1YW50aXplID0gKHZhbHVlOiBudW1iZXIpOiBzdHJpbmcgPT4ge1xuXHRcdGNvbnN0IGJ1Y2tldCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDE1LCBNYXRoLnJvdW5kKHZhbHVlIC8gMTcpKSk7XG5cdFx0cmV0dXJuIGJ1Y2tldC50b1N0cmluZygxNik7XG5cdH07XG5cblx0cmV0dXJuIFtcblx0XHRxdWFudGl6ZShyVG90YWwgLyB2aXNpYmxlUGl4ZWxzKSxcblx0XHRxdWFudGl6ZShnVG90YWwgLyB2aXNpYmxlUGl4ZWxzKSxcblx0XHRxdWFudGl6ZShiVG90YWwgLyB2aXNpYmxlUGl4ZWxzKVxuXHRdLmpvaW4oJycpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEltYWdlSGFzaCB7XG5cdG1vZGU6ICdvcGFxdWUnIHwgJ3RyYW5zcGFyZW50Jztcblx0aGFzaGVzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBcdThCQTFcdTdCOTdcdTU2RkVcdTcyNDdcdTU0QzhcdTVFMENcdTMwMDJcbiAqIFx1OTAwRlx1NjYwRVx1NTZGRVx1NEYxOFx1NTE0OFx1NEY3Rlx1NzUyOCBhbHBoYSBcdTg0OTlcdTcyNDhcdThGNkVcdTVFRDMgKyBcdTdDOTdcdTk4OUNcdTgyNzJcdTdCN0VcdTU0MERcdUZGMUJcdTY2NkVcdTkwMUFcdTU2RkVcdTdFRTdcdTdFRURcdTRGN0ZcdTc1MjggcEhhc2ggKyBkSGFzaFx1MzAwMlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcHV0ZVBlcmNlcHR1YWxIYXNoKGltYWdlU3JjOiBzdHJpbmcpOiBQcm9taXNlPEltYWdlSGFzaD4ge1xuXHRjb25zdCBpbWcgPSBhd2FpdCBsb2FkSW1hZ2UoaW1hZ2VTcmMpO1xuXHRjb25zdCBzb3VyY2UgPSBjYXB0dXJlU291cmNlQml0bWFwKGltZyk7XG5cblx0aWYgKHNvdXJjZS5oYXNUcmFuc3BhcmVuY3kpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bW9kZTogJ3RyYW5zcGFyZW50Jyxcblx0XHRcdGhhc2hlczogW1xuXHRcdFx0XHRjb21wdXRlQWxwaGFNYXNrSGFzaChzb3VyY2UpLFxuXHRcdFx0XHRjb21wdXRlUXVhbnRpemVkQ29sb3JIYXNoKHNvdXJjZSlcblx0XHRcdF1cblx0XHR9O1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRtb2RlOiAnb3BhcXVlJyxcblx0XHRoYXNoZXM6IFtcblx0XHRcdGNvbXB1dGVQSGFzaChzb3VyY2UpLFxuXHRcdFx0Y29tcHV0ZURIYXNoKHNvdXJjZSlcblx0XHRdXG5cdH07XG59XG5cbi8qKlxuICogXHU0RUNFIEFycmF5QnVmZmVyIFx1OEJBMVx1N0I5N1x1NTRDOFx1NUUwQ1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcHV0ZUhhc2hGcm9tQnVmZmVyKGJ1ZmZlcjogQXJyYXlCdWZmZXIsIG1pbWVUeXBlOiBzdHJpbmcgPSAnaW1hZ2UvcG5nJyk6IFByb21pc2U8SW1hZ2VIYXNoPiB7XG5cdGNvbnN0IGJsb2IgPSBuZXcgQmxvYihbYnVmZmVyXSwgeyB0eXBlOiBtaW1lVHlwZSB9KTtcblx0Y29uc3QgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcblx0dHJ5IHtcblx0XHRyZXR1cm4gYXdhaXQgY29tcHV0ZVBlcmNlcHR1YWxIYXNoKHVybCk7XG5cdH0gZmluYWxseSB7XG5cdFx0VVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuXHR9XG59XG5cbi8qKlxuICogXHU1MkEwXHU4RjdEXHU1NkZFXHU3MjQ3XG4gKi9cbmZ1bmN0aW9uIGxvYWRJbWFnZShzcmM6IHN0cmluZywgdGltZW91dE1zOiBudW1iZXIgPSBERUZBVUxUX0lNQUdFX0xPQURfVElNRU9VVCk6IFByb21pc2U8SFRNTEltYWdlRWxlbWVudD4ge1xuXHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdGxldCBzZXR0bGVkID0gZmFsc2U7XG5cdFx0Y29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdGlmIChzZXR0bGVkKSByZXR1cm47XG5cdFx0XHRzZXR0bGVkID0gdHJ1ZTtcblx0XHRcdC8vIEJlc3QtZWZmb3J0IGFib3J0IHRvIGF2b2lkIGhhbmdpbmcgcmVxdWVzdHNcblx0XHRcdGltZy5zcmMgPSAnJztcblx0XHRcdHJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBsb2FkIGltYWdlICh0aW1lb3V0KTogJHtzcmN9YCkpO1xuXHRcdH0sIHRpbWVvdXRNcyk7XG5cblx0XHQvLyBhcHA6Ly8gLyBmaWxlOi8vIC8gYmxvYjogXHU3QjQ5XHU2NzJDXHU1NzMwXHU4RDQ0XHU2RTkwXHU0RTBEXHU1RTk0XHU1RjNBXHU1MjM2XHU4RDcwIENPUlNcdUZGMENcblx0XHQvLyBcdTU0MjZcdTUyMTlcdTU3MjhcdTkwRThcdTUyMDZcdTczQUZcdTU4ODNcdTRFMEJcdTRGMUFcdTc2RjRcdTYzQTVcdTg5RTZcdTUzRDEgZXJyb3JcdUZGMENcdTVCRkNcdTgxRjRcdTU0QzhcdTVFMENcdThCQTFcdTdCOTdcdTU5MzFcdThEMjVcdTMwMDJcblx0XHRpZiAoL15odHRwcz86XFwvXFwvL2kudGVzdChzcmMpKSB7XG5cdFx0XHRpbWcuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcblx0XHR9XG5cdFx0aW1nLm9ubG9hZCA9ICgpID0+IHtcblx0XHRcdGlmIChzZXR0bGVkKSByZXR1cm47XG5cdFx0XHRzZXR0bGVkID0gdHJ1ZTtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lcik7XG5cdFx0XHRyZXNvbHZlKGltZyk7XG5cdFx0fTtcblx0XHRpbWcub25lcnJvciA9ICgpID0+IHtcblx0XHRcdGlmIChzZXR0bGVkKSByZXR1cm47XG5cdFx0XHRzZXR0bGVkID0gdHJ1ZTtcblx0XHRcdGNsZWFyVGltZW91dCh0aW1lcik7XG5cdFx0XHRyZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gbG9hZCBpbWFnZTogJHtzcmN9YCkpO1xuXHRcdH07XG5cdFx0aW1nLnNyYyA9IHNyYztcblx0fSk7XG59XG5cbi8qKlxuICogXHU4QkExXHU3Qjk3XHU0RTI0XHU0RTJBXHU1NEM4XHU1RTBDXHU3Njg0XHU2QzQ5XHU2NjBFXHU4REREXHU3OUJCXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW1taW5nRGlzdGFuY2UoaDE6IHN0cmluZywgaDI6IHN0cmluZyk6IG51bWJlciB7XG5cdGlmIChoMS5sZW5ndGggIT09IGgyLmxlbmd0aCkge1xuXHRcdHRocm93IG5ldyBFcnJvcihgSGFzaCBsZW5ndGggbWlzbWF0Y2g6ICR7aDEubGVuZ3RofSB2cyAke2gyLmxlbmd0aH1gKTtcblx0fVxuXG5cdGxldCBkaXN0YW5jZSA9IDA7XG5cdGZvciAobGV0IGkgPSAwOyBpIDwgaDEubGVuZ3RoOyBpKyspIHtcblx0XHRjb25zdCBuMSA9IHBhcnNlSW50KGgxW2ldLCAxNik7XG5cdFx0Y29uc3QgbjIgPSBwYXJzZUludChoMltpXSwgMTYpO1xuXHRcdGxldCB4b3IgPSBuMSBeIG4yO1xuXHRcdHdoaWxlICh4b3IpIHtcblx0XHRcdGRpc3RhbmNlICs9IHhvciAmIDE7XG5cdFx0XHR4b3IgPj49IDE7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGRpc3RhbmNlO1xufVxuXG4vKipcbiAqIFx1OEJBMVx1N0I5N1x1NEUyNFx1NEUyQVx1NTRDOFx1NUUwQ1x1NzY4NFx1NzZGOFx1NEYzQ1x1NUVBNlx1NzY3RVx1NTIwNlx1NkJENFxuICovXG5mdW5jdGlvbiBoYXNoU2VnbWVudFNpbWlsYXJpdHkoaDE6IHN0cmluZywgaDI6IHN0cmluZyk6IG51bWJlciB7XG5cdGNvbnN0IHRvdGFsQml0cyA9IGgxLmxlbmd0aCAqIDQ7IC8vIFx1NkJDRlx1NEUyQSBoZXggXHU1QjU3XHU3QjI2IDQgYml0c1xuXHRjb25zdCBkaXN0YW5jZSA9IGhhbW1pbmdEaXN0YW5jZShoMSwgaDIpO1xuXHRyZXR1cm4gTWF0aC5yb3VuZCgoMSAtIGRpc3RhbmNlIC8gdG90YWxCaXRzKSAqIDEwMCk7XG59XG5cbi8qKlxuICogXHU4QkExXHU3Qjk3XHU0RTI0XHU0RTJBXHU1NkZFXHU3MjQ3XHU1NEM4XHU1RTBDXHU3Njg0XHU3NkY4XHU0RjNDXHU1RUE2XHU3NjdFXHU1MjA2XHU2QkQ0XHUzMDAyXG4gKiBcdTkwMEZcdTY2MEVcdTU2RkVcdTY2RjRcdTc3MEJcdTkxQ0RcdThGNkVcdTVFRDNcdUZGMENcdTRFMDBcdTgyMkNcdTU2RkVcdTcyNDdcdTZDQkZcdTc1MjhcdTUzOUZcdTY3NjVcdTc2ODQgcEhhc2ggKyBkSGFzaCBcdTdFQzRcdTU0MDhcdTMwMDJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc2hTaW1pbGFyaXR5KGgxOiBJbWFnZUhhc2gsIGgyOiBJbWFnZUhhc2gpOiBudW1iZXIge1xuXHRpZiAoaDEubW9kZSAhPT0gaDIubW9kZSkge1xuXHRcdHJldHVybiAwO1xuXHR9XG5cblx0aWYgKGgxLm1vZGUgPT09ICd0cmFuc3BhcmVudCcpIHtcblx0XHRjb25zdCBzaGFwZVNpbWlsYXJpdHkgPSBoYXNoU2VnbWVudFNpbWlsYXJpdHkoaDEuaGFzaGVzWzBdLCBoMi5oYXNoZXNbMF0pO1xuXHRcdGNvbnN0IGNvbG9yU2ltaWxhcml0eSA9IGhhc2hTZWdtZW50U2ltaWxhcml0eShoMS5oYXNoZXNbMV0sIGgyLmhhc2hlc1sxXSk7XG5cdFx0cmV0dXJuIE1hdGgucm91bmQoc2hhcGVTaW1pbGFyaXR5ICogMC44ICsgY29sb3JTaW1pbGFyaXR5ICogMC4yKTtcblx0fVxuXG5cdGNvbnN0IHBIYXNoU2ltaWxhcml0eSA9IGhhc2hTZWdtZW50U2ltaWxhcml0eShoMS5oYXNoZXNbMF0sIGgyLmhhc2hlc1swXSk7XG5cdGNvbnN0IGRIYXNoU2ltaWxhcml0eSA9IGhhc2hTZWdtZW50U2ltaWxhcml0eShoMS5oYXNoZXNbMV0sIGgyLmhhc2hlc1sxXSk7XG5cdHJldHVybiBNYXRoLnJvdW5kKChwSGFzaFNpbWlsYXJpdHkgKyBkSGFzaFNpbWlsYXJpdHkpIC8gMik7XG59XG5cbi8qKlxuICogXHU5MUNEXHU1OTBEXHU3RUM0XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRHVwbGljYXRlR3JvdXAge1xuXHRoYXNoOiBJbWFnZUhhc2g7XG5cdGZpbGVzOiBBcnJheTx7IHBhdGg6IHN0cmluZzsgaGFzaDogSW1hZ2VIYXNoOyBzaW1pbGFyaXR5OiBudW1iZXIgfT47XG59XG5cbi8qKlxuICogXHU0RUNFXHU1NEM4XHU1RTBDXHU2NjIwXHU1QzA0XHU0RTJEXHU2N0U1XHU2MjdFXHU5MUNEXHU1OTBEXHU3RUM0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kRHVwbGljYXRlR3JvdXBzKFxuXHRoYXNoTWFwOiBNYXA8c3RyaW5nLCBJbWFnZUhhc2g+LFxuXHR0aHJlc2hvbGQ6IG51bWJlciA9IDkwXG4pOiBEdXBsaWNhdGVHcm91cFtdIHtcblx0Y29uc3QgZW50cmllcyA9IEFycmF5LmZyb20oaGFzaE1hcC5lbnRyaWVzKCkpO1xuXHRjb25zdCB2aXNpdGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cdGNvbnN0IGdyb3VwczogRHVwbGljYXRlR3JvdXBbXSA9IFtdO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgZW50cmllcy5sZW5ndGg7IGkrKykge1xuXHRcdGNvbnN0IFtwYXRoMSwgaGFzaDFdID0gZW50cmllc1tpXTtcblx0XHRpZiAodmlzaXRlZC5oYXMocGF0aDEpKSBjb250aW51ZTtcblxuXHRcdGNvbnN0IGdyb3VwOiBEdXBsaWNhdGVHcm91cCA9IHtcblx0XHRcdGhhc2g6IGhhc2gxLFxuXHRcdFx0ZmlsZXM6IFt7IHBhdGg6IHBhdGgxLCBoYXNoOiBoYXNoMSwgc2ltaWxhcml0eTogMTAwIH1dXG5cdFx0fTtcblxuXHRcdGZvciAobGV0IGogPSBpICsgMTsgaiA8IGVudHJpZXMubGVuZ3RoOyBqKyspIHtcblx0XHRcdGNvbnN0IFtwYXRoMiwgaGFzaDJdID0gZW50cmllc1tqXTtcblx0XHRcdGlmICh2aXNpdGVkLmhhcyhwYXRoMikpIGNvbnRpbnVlO1xuXG5cdFx0XHRjb25zdCBzaW1pbGFyaXR5ID0gaGFzaFNpbWlsYXJpdHkoaGFzaDEsIGhhc2gyKTtcblx0XHRcdGlmIChzaW1pbGFyaXR5ID49IHRocmVzaG9sZCkge1xuXHRcdFx0XHRncm91cC5maWxlcy5wdXNoKHsgcGF0aDogcGF0aDIsIGhhc2g6IGhhc2gyLCBzaW1pbGFyaXR5IH0pO1xuXHRcdFx0XHR2aXNpdGVkLmFkZChwYXRoMik7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGdyb3VwLmZpbGVzLmxlbmd0aCA+IDEpIHtcblx0XHRcdHZpc2l0ZWQuYWRkKHBhdGgxKTtcblx0XHRcdGdyb3Vwcy5wdXNoKGdyb3VwKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gZ3JvdXBzO1xufVxuIiwgIi8qKlxuICogXHU5NEZFXHU2M0E1XHU2NkY0XHU2NUIwXHU1REU1XHU1MTc3XG4gKiBcdTc1MjhcdTRFOEVcdTU3MjhcdTY1ODdcdTRFRjZcdTc5RkJcdTUyQThcdTYyMTZcdTUyMjBcdTk2NjRcdTY1RjZcdTYzMDkgT2JzaWRpYW4gXHU3Njg0XHU3NzFGXHU1QjlFXHU4OUUzXHU2NzkwXHU3RUQzXHU2NzlDXHU2NkY0XHU2NUIwXHU3QjE0XHU4QkIwXHU0RTJEXHU3Njg0XHU1RjE1XHU3NTI4XG4gKi9cblxuaW1wb3J0IHsgQXBwLCBURmlsZSwgcGFyc2VMaW5rdGV4dCB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IGdldEZpbGVOYW1lRnJvbVBhdGgsIGdldFBhcmVudFBhdGgsIG5vcm1hbGl6ZVZhdWx0UGF0aCwgc2FmZURlY29kZVVSSUNvbXBvbmVudCB9IGZyb20gJy4vcGF0aCc7XG5cbmNvbnN0IFdJS0lfTElOS19QQVRURVJOID0gLyghP1xcW1xcWykoW15cXF18XSspKFxcfFteXFxdXSopPyhcXF1cXF0pL2c7XG5jb25zdCBNQVJLRE9XTl9MSU5LX1BBVFRFUk4gPSAvKCE/XFxbW15cXF1dKlxcXVxcKCkoW14pXSspKFxcKSkvZztcbnR5cGUgTGlua1BhdGhTdHlsZSA9ICdiYXNlbmFtZScgfCAncmVsYXRpdmUnIHwgJ3ZhdWx0JyB8ICdhYnNvbHV0ZSc7XG50eXBlIExpbmtLaW5kID0gJ3dpa2knIHwgJ21hcmtkb3duJztcblxuLyoqXG4gKiBcdTY2RjRcdTY1QjBcdTYyNDBcdTY3MDlcdTdCMTRcdThCQjBcdTRFMkRcdTc2ODRcdTY1ODdcdTRFRjZcdTk0RkVcdTYzQTVcbiAqIEBwYXJhbSBhcHAgT2JzaWRpYW4gYXBwIFx1NUI5RVx1NEY4QlxuICogQHBhcmFtIG9sZFBhdGggXHU2NUU3XHU2NTg3XHU0RUY2XHU4REVGXHU1Rjg0XG4gKiBAcGFyYW0gbmV3UGF0aCBcdTY1QjBcdTY1ODdcdTRFRjZcdThERUZcdTVGODRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUxpbmtzSW5WYXVsdChcblx0YXBwOiBBcHAsXG5cdG9sZFBhdGg6IHN0cmluZyxcblx0bmV3UGF0aDogc3RyaW5nXG4pOiBQcm9taXNlPG51bWJlcj4ge1xuXHRjb25zdCBub3JtYWxpemVkT2xkUGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChvbGRQYXRoKS50b0xvd2VyQ2FzZSgpO1xuXHRjb25zdCBub3JtYWxpemVkTmV3UGF0aCA9IG5vcm1hbGl6ZVZhdWx0UGF0aChuZXdQYXRoKTtcblx0aWYgKCFub3JtYWxpemVkT2xkUGF0aCB8fCAhbm9ybWFsaXplZE5ld1BhdGggfHwgbm9ybWFsaXplZE9sZFBhdGggPT09IG5vcm1hbGl6ZWROZXdQYXRoLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRyZXR1cm4gMDtcblx0fVxuXG5cdGNvbnN0IG5ld0ZpbGUgPSBhcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vcm1hbGl6ZWROZXdQYXRoKTtcblx0aWYgKCEobmV3RmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuXHRcdHJldHVybiAwO1xuXHR9XG5cdGNvbnN0IGZvcmNlRGlzYW1iaWd1YXRlQmFzZW5hbWUgPSBoYXNGaWxlbmFtZUNvbGxpc2lvbihhcHAsIG5ld0ZpbGUubmFtZSwgbm9ybWFsaXplZE5ld1BhdGgpO1xuXG5cdGNvbnN0IG1hcmtkb3duRmlsZXMgPSBhcHAudmF1bHQuZ2V0TWFya2Rvd25GaWxlcygpO1xuXHRsZXQgdXBkYXRlZENvdW50ID0gMDtcblxuXHRmb3IgKGNvbnN0IGZpbGUgb2YgbWFya2Rvd25GaWxlcykge1xuXHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBhcHAudmF1bHQucmVhZChmaWxlKTtcblx0XHRjb25zdCBuZXdDb250ZW50ID0gdXBkYXRlTGlua3NJbkNvbnRlbnQoXG5cdFx0XHRhcHAsXG5cdFx0XHRmaWxlLFxuXHRcdFx0Y29udGVudCxcblx0XHRcdG5vcm1hbGl6ZWRPbGRQYXRoLFxuXHRcdFx0bmV3RmlsZSxcblx0XHRcdGZvcmNlRGlzYW1iaWd1YXRlQmFzZW5hbWVcblx0XHQpO1xuXG5cdFx0aWYgKG5ld0NvbnRlbnQgIT09IGNvbnRlbnQpIHtcblx0XHRcdGF3YWl0IGFwcC52YXVsdC5tb2RpZnkoZmlsZSwgbmV3Q29udGVudCk7XG5cdFx0XHR1cGRhdGVkQ291bnQrKztcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdXBkYXRlZENvdW50O1xufVxuXG4vKipcbiAqIFx1NjZGNFx1NjVCMFx1NjU4N1x1NjcyQ1x1NTE4NVx1NUJCOVx1NEUyRFx1NzY4NFx1NjU4N1x1NEVGNlx1OTRGRVx1NjNBNVxuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlTGlua3NJbkNvbnRlbnQoXG5cdGFwcDogQXBwLFxuXHRzb3VyY2VGaWxlOiBURmlsZSxcblx0Y29udGVudDogc3RyaW5nLFxuXHRvbGRQYXRoOiBzdHJpbmcsXG5cdG5ld0ZpbGU6IFRGaWxlLFxuXHRmb3JjZURpc2FtYmlndWF0ZUJhc2VuYW1lOiBib29sZWFuID0gZmFsc2Vcbik6IHN0cmluZyB7XG5cdGNvbnN0IG5vcm1hbGl6ZWROZXdQYXRoID0gbm9ybWFsaXplVmF1bHRQYXRoKG5ld0ZpbGUucGF0aCk7XG5cblx0Y29udGVudCA9IGNvbnRlbnQucmVwbGFjZShXSUtJX0xJTktfUEFUVEVSTiwgKGZ1bGxNYXRjaCwgcHJlZml4LCBsaW5rdGV4dCwgYWxpYXMgPSAnJywgc3VmZml4KSA9PiB7XG5cdFx0Y29uc3QgcGFyc2VkID0gcGFyc2VMaW5rdGV4dChsaW5rdGV4dCk7XG5cdFx0Y29uc3QgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZUxpbmtEZXN0aW5hdGlvbihhcHAsIHBhcnNlZC5wYXRoLCBzb3VyY2VGaWxlLnBhdGgpO1xuXHRcdGlmICghc2hvdWxkUmV3cml0ZUxpbmsocGFyc2VkLnBhdGgsIHJlc29sdmVkUGF0aCwgb2xkUGF0aCwgc291cmNlRmlsZS5wYXRoKSkge1xuXHRcdFx0cmV0dXJuIGZ1bGxNYXRjaDtcblx0XHR9XG5cblx0XHRjb25zdCByZXBsYWNlbWVudExpbmtQYXRoID0gY29tcG9zZVJlcGxhY2VtZW50UGF0aChcblx0XHRcdHBhcnNlZC5wYXRoLFxuXHRcdFx0c291cmNlRmlsZS5wYXRoLFxuXHRcdFx0bm9ybWFsaXplZE5ld1BhdGgsXG5cdFx0XHRmb3JjZURpc2FtYmlndWF0ZUJhc2VuYW1lLFxuXHRcdFx0J3dpa2knXG5cdFx0KTtcblx0XHRyZXR1cm4gYCR7cHJlZml4fSR7cmVwbGFjZW1lbnRMaW5rUGF0aH0ke3BhcnNlZC5zdWJwYXRoIHx8ICcnfSR7YWxpYXN9JHtzdWZmaXh9YDtcblx0fSk7XG5cblx0Y29udGVudCA9IGNvbnRlbnQucmVwbGFjZShNQVJLRE9XTl9MSU5LX1BBVFRFUk4sIChmdWxsTWF0Y2gsIHByZWZpeCwgZGVzdGluYXRpb24sIHN1ZmZpeCkgPT4ge1xuXHRcdGNvbnN0IHBhcnNlZCA9IHBhcnNlTWFya2Rvd25EZXN0aW5hdGlvbihkZXN0aW5hdGlvbik7XG5cdFx0Y29uc3QgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZUxpbmtEZXN0aW5hdGlvbihhcHAsIHBhcnNlZC5wYXRoLCBzb3VyY2VGaWxlLnBhdGgpO1xuXHRcdGlmICghc2hvdWxkUmV3cml0ZUxpbmsocGFyc2VkLnBhdGgsIHJlc29sdmVkUGF0aCwgb2xkUGF0aCwgc291cmNlRmlsZS5wYXRoKSkge1xuXHRcdFx0cmV0dXJuIGZ1bGxNYXRjaDtcblx0XHR9XG5cblx0XHRjb25zdCBuZXh0RGVzdGluYXRpb24gPSBmb3JtYXRNYXJrZG93bkRlc3RpbmF0aW9uKFxuXHRcdFx0Y29tcG9zZVJlcGxhY2VtZW50UGF0aChcblx0XHRcdFx0cGFyc2VkLnBhdGgsXG5cdFx0XHRcdHNvdXJjZUZpbGUucGF0aCxcblx0XHRcdFx0bm9ybWFsaXplZE5ld1BhdGgsXG5cdFx0XHRcdGZvcmNlRGlzYW1iaWd1YXRlQmFzZW5hbWUsXG5cdFx0XHRcdCdtYXJrZG93bidcblx0XHRcdCksXG5cdFx0XHRwYXJzZWQuc3VmZml4LFxuXHRcdFx0cGFyc2VkLmlzV3JhcHBlZFxuXHRcdCk7XG5cdFx0cmV0dXJuIGAke3ByZWZpeH0ke25leHREZXN0aW5hdGlvbn0ke3N1ZmZpeH1gO1xuXHR9KTtcblxuXHRyZXR1cm4gY29udGVudDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUxpbmtEZXN0aW5hdGlvbihhcHA6IEFwcCwgcmF3TGlua1BhdGg6IHN0cmluZywgc291cmNlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcblx0bGV0IGNhbmRpZGF0ZSA9IHJhd0xpbmtQYXRoLnRyaW0oKTtcblx0aWYgKCFjYW5kaWRhdGUpIHtcblx0XHRyZXR1cm4gJyc7XG5cdH1cblxuXHRjYW5kaWRhdGUgPSBjYW5kaWRhdGUucmVwbGFjZSgvXFxcXCAvZywgJyAnKTtcblx0Y2FuZGlkYXRlID0gc2FmZURlY29kZVVSSUNvbXBvbmVudChjYW5kaWRhdGUpO1xuXG5cdGlmICgvXlthLXpdW2EtejAtOSsuLV0qOi9pLnRlc3QoY2FuZGlkYXRlKSkge1xuXHRcdHJldHVybiAnJztcblx0fVxuXG5cdGNvbnN0IG5vcm1hbGl6ZWRDYW5kaWRhdGUgPSBub3JtYWxpemVWYXVsdFBhdGgoY2FuZGlkYXRlKTtcblx0Y29uc3QgcmVzb2x2ZWQgPSBhcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChub3JtYWxpemVkQ2FuZGlkYXRlIHx8IGNhbmRpZGF0ZSwgc291cmNlUGF0aCk7XG5cdGNvbnN0IHJlc29sdmVkUGF0aCA9IHJlc29sdmVkID8gcmVzb2x2ZWQucGF0aCA6IG5vcm1hbGl6ZWRDYW5kaWRhdGU7XG5cdHJldHVybiBub3JtYWxpemVWYXVsdFBhdGgocmVzb2x2ZWRQYXRoKS50b0xvd2VyQ2FzZSgpO1xufVxuXG5mdW5jdGlvbiBwYXJzZU1hcmtkb3duRGVzdGluYXRpb24oZGVzdGluYXRpb246IHN0cmluZyk6IHtcblx0cGF0aDogc3RyaW5nO1xuXHRzdWZmaXg6IHN0cmluZztcblx0aXNXcmFwcGVkOiBib29sZWFuO1xufSB7XG5cdGxldCBub3JtYWxpemVkID0gZGVzdGluYXRpb24udHJpbSgpO1xuXHRjb25zdCBpc1dyYXBwZWQgPSBub3JtYWxpemVkLnN0YXJ0c1dpdGgoJzwnKSAmJiBub3JtYWxpemVkLmVuZHNXaXRoKCc+Jyk7XG5cblx0aWYgKGlzV3JhcHBlZCkge1xuXHRcdG5vcm1hbGl6ZWQgPSBub3JtYWxpemVkLnNsaWNlKDEsIC0xKS50cmltKCk7XG5cdH1cblxuXHRub3JtYWxpemVkID0gbm9ybWFsaXplZC5yZXBsYWNlKC9cXFxcIC9nLCAnICcpO1xuXHRjb25zdCBtYXRjaCA9IG5vcm1hbGl6ZWQubWF0Y2goL15bXj8jXSovKTtcblx0Y29uc3QgcGF0aCA9IG1hdGNoID8gbWF0Y2hbMF0gOiBub3JtYWxpemVkO1xuXHRjb25zdCBzdWZmaXggPSBub3JtYWxpemVkLnNsaWNlKHBhdGgubGVuZ3RoKTtcblxuXHRyZXR1cm4ge1xuXHRcdHBhdGgsXG5cdFx0c3VmZml4LFxuXHRcdGlzV3JhcHBlZFxuXHR9O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRNYXJrZG93bkRlc3RpbmF0aW9uKGxpbmtQYXRoOiBzdHJpbmcsIHN1ZmZpeDogc3RyaW5nLCBpc1dyYXBwZWQ6IGJvb2xlYW4pOiBzdHJpbmcge1xuXHRjb25zdCBjb21iaW5lZCA9IGAke2xpbmtQYXRofSR7c3VmZml4fWA7XG5cdGlmIChpc1dyYXBwZWQpIHtcblx0XHRyZXR1cm4gYDwke2NvbWJpbmVkfT5gO1xuXHR9XG5cdHJldHVybiBjb21iaW5lZC5yZXBsYWNlKC8gL2csICdcXFxcICcpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRSZXdyaXRlTGluayhyYXdQYXRoOiBzdHJpbmcsIHJlc29sdmVkUGF0aDogc3RyaW5nLCBvbGRQYXRoOiBzdHJpbmcsIHNvdXJjZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRpZiAocmVzb2x2ZWRQYXRoID09PSBvbGRQYXRoKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblx0aWYgKHJlc29sdmVkUGF0aCkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIFx1NTE1Q1x1NUU5NVx1NEVDNVx1NzUyOFx1NEU4RSBtZXRhZGF0YUNhY2hlIFx1NjVFMFx1NkNENVx1ODlFM1x1Njc5MFx1NjVGNlx1RkYwQ1x1NEUxNCByYXdQYXRoIFx1NTcyOFx1OEJFRFx1NEU0OVx1NEUwQVx1NTNFRlx1NTUyRlx1NEUwMFx1NUI5QVx1NEY0RFx1MzAwMlxuXHQvLyBcdTVCRjlcdTg4RjhcdTY1ODdcdTRFRjZcdTU0MERcdTRFMERcdTUwNUFcdTUxNUNcdTVFOTVcdUZGMENcdTkwN0ZcdTUxNERcdTU0MENcdTU0MERcdTY1ODdcdTRFRjZcdThCRUZcdTY1MzlcdTMwMDJcblx0cmV0dXJuIHJlc29sdmVEZXRlcm1pbmlzdGljUGF0aChyYXdQYXRoLCBzb3VyY2VQYXRoKSA9PT0gb2xkUGF0aDtcbn1cblxuZnVuY3Rpb24gY29tcG9zZVJlcGxhY2VtZW50UGF0aChcblx0cmF3UGF0aDogc3RyaW5nLFxuXHRzb3VyY2VQYXRoOiBzdHJpbmcsXG5cdG5ld1BhdGg6IHN0cmluZyxcblx0Zm9yY2VEaXNhbWJpZ3VhdGVCYXNlbmFtZTogYm9vbGVhbixcblx0bGlua0tpbmQ6IExpbmtLaW5kXG4pOiBzdHJpbmcge1xuXHRjb25zdCBzdHlsZSA9IGRldGVjdExpbmtQYXRoU3R5bGUocmF3UGF0aCk7XG5cdHN3aXRjaCAoc3R5bGUpIHtcblx0XHRjYXNlICdiYXNlbmFtZSc6XG5cdFx0XHRpZiAobGlua0tpbmQgPT09ICdtYXJrZG93bicpIHtcblx0XHRcdFx0cmV0dXJuIHRvUmVsYXRpdmVWYXVsdFBhdGgoc291cmNlUGF0aCwgbmV3UGF0aCkgfHwgZ2V0RmlsZU5hbWVGcm9tUGF0aChuZXdQYXRoKSB8fCBuZXdQYXRoO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGZvcmNlRGlzYW1iaWd1YXRlQmFzZW5hbWUpIHtcblx0XHRcdFx0cmV0dXJuIG5ld1BhdGg7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gZ2V0RmlsZU5hbWVGcm9tUGF0aChuZXdQYXRoKSB8fCBuZXdQYXRoO1xuXHRcdGNhc2UgJ3JlbGF0aXZlJzpcblx0XHRcdHJldHVybiB0b1JlbGF0aXZlVmF1bHRQYXRoKHNvdXJjZVBhdGgsIG5ld1BhdGgpIHx8IGdldEZpbGVOYW1lRnJvbVBhdGgobmV3UGF0aCkgfHwgbmV3UGF0aDtcblx0XHRjYXNlICdhYnNvbHV0ZSc6XG5cdFx0XHRyZXR1cm4gYC8ke25ld1BhdGh9YDtcblx0XHRjYXNlICd2YXVsdCc6XG5cdFx0ZGVmYXVsdDpcblx0XHRcdHJldHVybiBuZXdQYXRoO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVEZXRlcm1pbmlzdGljUGF0aChyYXdQYXRoOiBzdHJpbmcsIHNvdXJjZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG5cdGxldCBjYW5kaWRhdGUgPSBTdHJpbmcocmF3UGF0aCB8fCAnJykudHJpbSgpO1xuXHRpZiAoIWNhbmRpZGF0ZSkge1xuXHRcdHJldHVybiAnJztcblx0fVxuXG5cdGNhbmRpZGF0ZSA9IGNhbmRpZGF0ZS5yZXBsYWNlKC9cXFxcIC9nLCAnICcpO1xuXHRjYW5kaWRhdGUgPSBzYWZlRGVjb2RlVVJJQ29tcG9uZW50KGNhbmRpZGF0ZSk7XG5cblx0aWYgKC9eW2Etel1bYS16MC05Ky4tXSo6L2kudGVzdChjYW5kaWRhdGUpKSB7XG5cdFx0cmV0dXJuICcnO1xuXHR9XG5cblx0aWYgKGNhbmRpZGF0ZS5zdGFydHNXaXRoKCcvJykpIHtcblx0XHRyZXR1cm4gbm9ybWFsaXplVmF1bHRQYXRoKGNhbmRpZGF0ZSkudG9Mb3dlckNhc2UoKTtcblx0fVxuXG5cdGlmIChjYW5kaWRhdGUuc3RhcnRzV2l0aCgnLi8nKSB8fCBjYW5kaWRhdGUuc3RhcnRzV2l0aCgnLi4vJykpIHtcblx0XHRjb25zdCBzb3VyY2VEaXIgPSBub3JtYWxpemVWYXVsdFBhdGgoZ2V0UGFyZW50UGF0aChzb3VyY2VQYXRoKSk7XG5cdFx0cmV0dXJuIHJlc29sdmVSZWxhdGl2ZVBhdGgoc291cmNlRGlyLCBjYW5kaWRhdGUpLnRvTG93ZXJDYXNlKCk7XG5cdH1cblxuXHRjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplVmF1bHRQYXRoKGNhbmRpZGF0ZSkudG9Mb3dlckNhc2UoKTtcblx0aWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoJy8nKSkge1xuXHRcdHJldHVybiBub3JtYWxpemVkO1xuXHR9XG5cblx0Ly8gYmFzZW5hbWUgXHU2NUUwXHU2Q0Q1XHU1NTJGXHU0RTAwXHU3ODZFXHU1QjlBXHU3NkVFXHU2ODA3XG5cdHJldHVybiAnJztcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVJlbGF0aXZlUGF0aChzb3VyY2VEaXI6IHN0cmluZywgcmVsYXRpdmVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBiYXNlUGFydHMgPSBzb3VyY2VEaXIgPyBzb3VyY2VEaXIuc3BsaXQoJy8nKS5maWx0ZXIoQm9vbGVhbikgOiBbXTtcblx0Y29uc3QgcmVsUGFydHMgPSBTdHJpbmcocmVsYXRpdmVQYXRoIHx8ICcnKS5yZXBsYWNlKC9cXFxcL2csICcvJykuc3BsaXQoJy8nKTtcblxuXHRmb3IgKGNvbnN0IHBhcnQgb2YgcmVsUGFydHMpIHtcblx0XHRpZiAoIXBhcnQgfHwgcGFydCA9PT0gJy4nKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cdFx0aWYgKHBhcnQgPT09ICcuLicpIHtcblx0XHRcdGlmIChiYXNlUGFydHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdHJldHVybiAnJztcblx0XHRcdH1cblx0XHRcdGJhc2VQYXJ0cy5wb3AoKTtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblx0XHRiYXNlUGFydHMucHVzaChwYXJ0KTtcblx0fVxuXG5cdHJldHVybiBub3JtYWxpemVWYXVsdFBhdGgoYmFzZVBhcnRzLmpvaW4oJy8nKSk7XG59XG5cbmZ1bmN0aW9uIGhhc0ZpbGVuYW1lQ29sbGlzaW9uKGFwcDogQXBwLCBmaWxlTmFtZTogc3RyaW5nLCBjYW5vbmljYWxQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcblx0Y29uc3Qgbm9ybWFsaXplZFBhdGggPSBub3JtYWxpemVWYXVsdFBhdGgoY2Fub25pY2FsUGF0aCkudG9Mb3dlckNhc2UoKTtcblx0Y29uc3QgbG93ZXJOYW1lID0gZmlsZU5hbWUudG9Mb3dlckNhc2UoKTtcblx0cmV0dXJuIGFwcC52YXVsdC5nZXRGaWxlcygpLnNvbWUoZmlsZSA9PlxuXHRcdGZpbGUubmFtZS50b0xvd2VyQ2FzZSgpID09PSBsb3dlck5hbWUgJiZcblx0XHRub3JtYWxpemVWYXVsdFBhdGgoZmlsZS5wYXRoKS50b0xvd2VyQ2FzZSgpICE9PSBub3JtYWxpemVkUGF0aFxuXHQpO1xufVxuXG5mdW5jdGlvbiBkZXRlY3RMaW5rUGF0aFN0eWxlKHJhd1BhdGg6IHN0cmluZyk6IExpbmtQYXRoU3R5bGUge1xuXHRjb25zdCB0cmltbWVkID0gU3RyaW5nKHJhd1BhdGggfHwgJycpLnRyaW0oKTtcblx0aWYgKCF0cmltbWVkKSByZXR1cm4gJ2Jhc2VuYW1lJztcblx0aWYgKHRyaW1tZWQuc3RhcnRzV2l0aCgnLycpKSByZXR1cm4gJ2Fic29sdXRlJztcblx0aWYgKHRyaW1tZWQuc3RhcnRzV2l0aCgnLi8nKSB8fCB0cmltbWVkLnN0YXJ0c1dpdGgoJy4uLycpKSByZXR1cm4gJ3JlbGF0aXZlJztcblxuXHRjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplVmF1bHRQYXRoKHRyaW1tZWQpO1xuXHRpZiAobm9ybWFsaXplZC5pbmNsdWRlcygnLycpKSB7XG5cdFx0cmV0dXJuICd2YXVsdCc7XG5cdH1cblx0cmV0dXJuICdiYXNlbmFtZSc7XG59XG5cbmZ1bmN0aW9uIHRvUmVsYXRpdmVWYXVsdFBhdGgoc291cmNlUGF0aDogc3RyaW5nLCB0YXJnZXRQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRjb25zdCBmcm9tRGlyID0gbm9ybWFsaXplVmF1bHRQYXRoKGdldFBhcmVudFBhdGgoc291cmNlUGF0aCkpO1xuXHRjb25zdCB0byA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh0YXJnZXRQYXRoKTtcblx0aWYgKCF0bykgcmV0dXJuICcnO1xuXG5cdGNvbnN0IGZyb21QYXJ0cyA9IGZyb21EaXIgPyBmcm9tRGlyLnNwbGl0KCcvJykgOiBbXTtcblx0Y29uc3QgdG9QYXJ0cyA9IHRvLnNwbGl0KCcvJyk7XG5cblx0bGV0IGNvbW1vbiA9IDA7XG5cdHdoaWxlIChcblx0XHRjb21tb24gPCBmcm9tUGFydHMubGVuZ3RoICYmXG5cdFx0Y29tbW9uIDwgdG9QYXJ0cy5sZW5ndGggJiZcblx0XHRmcm9tUGFydHNbY29tbW9uXSA9PT0gdG9QYXJ0c1tjb21tb25dXG5cdCkge1xuXHRcdGNvbW1vbisrO1xuXHR9XG5cblx0Y29uc3QgdXBDb3VudCA9IGZyb21QYXJ0cy5sZW5ndGggLSBjb21tb247XG5cdGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IHVwQ291bnQ7IGkrKykge1xuXHRcdHBhcnRzLnB1c2goJy4uJyk7XG5cdH1cblx0cGFydHMucHVzaCguLi50b1BhcnRzLnNsaWNlKGNvbW1vbikpO1xuXG5cdHJldHVybiBwYXJ0cy5qb2luKCcvJyk7XG59XG4iLCAiaW1wb3J0IHsgTW9kYWwsIE5vdGljZSwgVEZpbGUgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgSW1hZ2VNYW5hZ2VyUGx1Z2luIGZyb20gJy4uL21haW4nO1xuaW1wb3J0IHsgZ2V0RG9jdW1lbnREaXNwbGF5TGFiZWwsIGdldE1lZGlhVHlwZSB9IGZyb20gJy4uL3V0aWxzL21lZGlhVHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgTWVkaWFQcmV2aWV3TW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG5cdHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luO1xuXHRmaWxlOiBURmlsZTtcblx0Y3VycmVudEluZGV4OiBudW1iZXIgPSAwO1xuXHRhbGxGaWxlczogVEZpbGVbXSA9IFtdO1xuXHRwcml2YXRlIGtleWRvd25IYW5kbGVyOiAoKGU6IEtleWJvYXJkRXZlbnQpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cdHByaXZhdGUgb25EaWRDbG9zZTogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG5cblx0Y29uc3RydWN0b3IoXG5cdFx0YXBwOiBhbnksXG5cdFx0cGx1Z2luOiBJbWFnZU1hbmFnZXJQbHVnaW4sXG5cdFx0ZmlsZTogVEZpbGUsXG5cdFx0YWxsRmlsZXM6IFRGaWxlW10gPSBbXSxcblx0XHRvbkRpZENsb3NlOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbFxuXHQpIHtcblx0XHRzdXBlcihhcHApO1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHRcdHRoaXMuZmlsZSA9IGZpbGU7XG5cdFx0dGhpcy5hbGxGaWxlcyA9IGFsbEZpbGVzLmxlbmd0aCA+IDAgPyBhbGxGaWxlcyA6IFtmaWxlXTtcblx0XHRjb25zdCBpZHggPSB0aGlzLmFsbEZpbGVzLmZpbmRJbmRleChmID0+IGYucGF0aCA9PT0gZmlsZS5wYXRoKTtcblx0XHR0aGlzLmN1cnJlbnRJbmRleCA9IGlkeCA+PSAwID8gaWR4IDogMDtcblx0XHR0aGlzLm9uRGlkQ2xvc2UgPSBvbkRpZENsb3NlO1xuXHR9XG5cblx0b25PcGVuKCkge1xuXHRcdGNvbnN0IHsgY29udGVudEVsLCBtb2RhbEVsIH0gPSB0aGlzO1xuXHRcdG1vZGFsRWwuYWRkQ2xhc3MoJ21lZGlhLXByZXZpZXctbW9kYWwnKTtcblxuXHRcdC8vIFx1NTE3M1x1OTVFRFx1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IGNsb3NlQnRuID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3ByZXZpZXctY2xvc2UnIH0pO1xuXHRcdGNsb3NlQnRuLnRleHRDb250ZW50ID0gJ1x1MDBENyc7XG5cdFx0Y2xvc2VCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuXG5cdFx0Ly8gXHU1QTkyXHU0RjUzXHU1QkI5XHU1NjY4XG5cdFx0Y29uc3QgY29udGFpbmVyID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogJ3ByZXZpZXctY29udGFpbmVyJyB9KTtcblxuXHRcdC8vIFx1NkUzMlx1NjdEM1x1NUE5Mlx1NEY1M1xuXHRcdHRoaXMucmVuZGVyTWVkaWEoY29udGFpbmVyKTtcblxuXHRcdC8vIFx1NUJGQ1x1ODIyQVx1NjNBN1x1NEVGNlx1RkYwOFx1NTk4Mlx1Njc5Q1x1NjcwOVx1NTkxQVx1NUYyMFx1NTZGRVx1NzI0N1x1RkYwOVxuXHRcdGlmICh0aGlzLmFsbEZpbGVzLmxlbmd0aCA+IDEpIHtcblx0XHRcdHRoaXMucmVuZGVyTmF2aWdhdGlvbihjb250YWluZXIpO1xuXHRcdH1cblxuXHRcdC8vIFx1NEZFMVx1NjA2Rlx1NjgwRlxuXHRcdHRoaXMucmVuZGVySW5mb0Jhcihjb250ZW50RWwpO1xuXG5cdFx0Ly8gXHU5NTJFXHU3NkQ4XHU1QkZDXHU4MjJBXHVGRjA4XHU2ODM5XHU2MzZFXHU4QkJFXHU3RjZFXHU1MUIzXHU1QjlBXHU2NjJGXHU1NDI2XHU1NDJGXHU3NTI4XHVGRjA5XG5cdFx0aWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmVuYWJsZUtleWJvYXJkTmF2KSB7XG5cdFx0XHR0aGlzLnJlZ2lzdGVyS2V5Ym9hcmROYXYoKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTMyXHU2N0QzXHU1QTkyXHU0RjUzXG5cdCAqL1xuXHRyZW5kZXJNZWRpYShjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG5cdFx0Y29udGFpbmVyLmVtcHR5KCk7XG5cdFx0Y29uc3QgZmlsZSA9IHRoaXMuYWxsRmlsZXNbdGhpcy5jdXJyZW50SW5kZXhdO1xuXHRcdGNvbnN0IGV4dCA9IGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCk7XG5cdFx0Y29uc3QgbWVkaWFUeXBlID0gZ2V0TWVkaWFUeXBlKGZpbGUubmFtZSk7XG5cdFx0Y29uc3QgaXNJbWFnZSA9IG1lZGlhVHlwZSA9PT0gJ2ltYWdlJztcblx0XHRjb25zdCBpc1ZpZGVvID0gbWVkaWFUeXBlID09PSAndmlkZW8nO1xuXHRcdGNvbnN0IGlzQXVkaW8gPSBtZWRpYVR5cGUgPT09ICdhdWRpbyc7XG5cdFx0Y29uc3QgaXNEb2N1bWVudCA9IG1lZGlhVHlwZSA9PT0gJ2RvY3VtZW50Jztcblx0XHRjb25zdCBpc1BkZiA9IGV4dCA9PT0gJ3BkZic7XG5cblx0XHRpZiAoaXNJbWFnZSkge1xuXHRcdFx0Y29uc3QgaW1nID0gY29udGFpbmVyLmNyZWF0ZUVsKCdpbWcnLCB7XG5cdFx0XHRcdGNsczogJ3ByZXZpZXctaW1hZ2UnLFxuXHRcdFx0XHRhdHRyOiB7IHNyYzogdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpIH1cblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBcdTU2RkVcdTcyNDdcdTUyQTBcdThGN0RcdTU5MzFcdThEMjVcdTY1RjZcdTY2M0VcdTc5M0FcdTk1MTlcdThCRUZcdTcyQjZcdTYwMDFcblx0XHRcdGltZy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsICgpID0+IHtcblx0XHRcdFx0Y29udGFpbmVyLmVtcHR5KCk7XG5cdFx0XHRcdGNvbnRhaW5lci5jcmVhdGVEaXYoe1xuXHRcdFx0XHRcdGNsczogJ3ByZXZpZXctZXJyb3InLFxuXHRcdFx0XHRcdHRleHQ6IHRoaXMucGx1Z2luLnQoJ2ltYWdlTG9hZEVycm9yJykgfHwgJ0ZhaWxlZCB0byBsb2FkIGltYWdlJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSBpZiAoaXNWaWRlbykge1xuXHRcdFx0Y29uc3QgdmlkZW8gPSBjb250YWluZXIuY3JlYXRlRWwoJ3ZpZGVvJywge1xuXHRcdFx0XHRjbHM6ICdwcmV2aWV3LXZpZGVvJyxcblx0XHRcdFx0YXR0cjogeyBjb250cm9sczogJ3RydWUnIH1cblx0XHRcdH0pO1xuXHRcdFx0dmlkZW8uc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdH0gZWxzZSBpZiAoaXNBdWRpbykge1xuXHRcdFx0Y29uc3QgYXVkaW8gPSBjb250YWluZXIuY3JlYXRlRWwoJ2F1ZGlvJywge1xuXHRcdFx0XHRjbHM6ICdwcmV2aWV3LWF1ZGlvJyxcblx0XHRcdFx0YXR0cjogeyBjb250cm9sczogJ3RydWUnIH1cblx0XHRcdH0pO1xuXHRcdFx0YXVkaW8uc3JjID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuXHRcdH0gZWxzZSBpZiAoaXNQZGYpIHtcblx0XHRcdGNvbnN0IGlmcmFtZSA9IGNvbnRhaW5lci5jcmVhdGVFbCgnaWZyYW1lJywge1xuXHRcdFx0XHRjbHM6ICdwcmV2aWV3LXBkZicsXG5cdFx0XHRcdGF0dHI6IHtcblx0XHRcdFx0XHRzcmM6IHRoaXMuYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKSxcblx0XHRcdFx0XHRzYW5kYm94OiAnYWxsb3ctc2NyaXB0cydcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIGlmIChpc0RvY3VtZW50KSB7XG5cdFx0XHRjb25zdCB1bnN1cHBvcnRlZCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdwcmV2aWV3LXVuc3VwcG9ydGVkJyB9KTtcblx0XHRcdHVuc3VwcG9ydGVkLmNyZWF0ZURpdih7IHRleHQ6IGdldERvY3VtZW50RGlzcGxheUxhYmVsKGZpbGUubmFtZSkgfSk7XG5cdFx0XHR1bnN1cHBvcnRlZC5jcmVhdGVEaXYoe1xuXHRcdFx0XHR0ZXh0OiB0aGlzLnBsdWdpbi50KCdkb2N1bWVudEVtYmVkUHJldmlld1Vuc3VwcG9ydGVkJykgfHwgdGhpcy5wbHVnaW4udCgndW5zdXBwb3J0ZWRGaWxlVHlwZScpXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3ByZXZpZXctdW5zdXBwb3J0ZWQnLCB0ZXh0OiB0aGlzLnBsdWdpbi50KCd1bnN1cHBvcnRlZEZpbGVUeXBlJykgfSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NUJGQ1x1ODIyQVx1NjNBN1x1NEVGNlxuXHQgKi9cblx0cmVuZGVyTmF2aWdhdGlvbihjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG5cdFx0Y29uc3QgbmF2ID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3ByZXZpZXctbmF2JyB9KTtcblxuXHRcdC8vIFx1NEUwQVx1NEUwMFx1NUYyMFxuXHRcdGNvbnN0IHByZXZCdG4gPSBuYXYuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnbmF2LWJ1dHRvbiBwcmV2JyB9KTtcblx0XHRwcmV2QnRuLnRleHRDb250ZW50ID0gJ1x1MjAzOSc7XG5cdFx0cHJldkJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0dGhpcy5wcmV2KCk7XG5cdFx0fSk7XG5cblx0XHQvLyBcdTk4NzVcdTc4MDFcblx0XHRuYXYuY3JlYXRlU3Bhbih7XG5cdFx0XHR0ZXh0OiBgJHt0aGlzLmN1cnJlbnRJbmRleCArIDF9IC8gJHt0aGlzLmFsbEZpbGVzLmxlbmd0aH1gLFxuXHRcdFx0Y2xzOiAnbmF2LWluZm8nXG5cdFx0fSk7XG5cblx0XHQvLyBcdTRFMEJcdTRFMDBcdTVGMjBcblx0XHRjb25zdCBuZXh0QnRuID0gbmF2LmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ25hdi1idXR0b24gbmV4dCcgfSk7XG5cdFx0bmV4dEJ0bi50ZXh0Q29udGVudCA9ICdcdTIwM0EnO1xuXHRcdG5leHRCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdHRoaXMubmV4dCgpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkUzMlx1NjdEM1x1NEZFMVx1NjA2Rlx1NjgwRlxuXHQgKi9cblx0cmVuZGVySW5mb0Jhcihjb250ZW50RWw6IEhUTUxFbGVtZW50KSB7XG5cdFx0Y29uc3QgZmlsZSA9IHRoaXMuYWxsRmlsZXNbdGhpcy5jdXJyZW50SW5kZXhdO1xuXHRcdGNvbnN0IGluZm9CYXIgPSBjb250ZW50RWwuY3JlYXRlRGl2KHsgY2xzOiAncHJldmlldy1pbmZvLWJhcicgfSk7XG5cblx0XHQvLyBcdTY1ODdcdTRFRjZcdTU0MERcblx0XHRpbmZvQmFyLmNyZWF0ZURpdih7IGNsczogJ2luZm8tbmFtZScsIHRleHQ6IGZpbGUubmFtZSB9KTtcblxuXHRcdC8vIFx1NjRDRFx1NEY1Q1x1NjMwOVx1OTRBRVxuXHRcdGNvbnN0IGFjdGlvbnMgPSBpbmZvQmFyLmNyZWF0ZURpdih7IGNsczogJ2luZm8tYWN0aW9ucycgfSk7XG5cblx0XHQvLyBcdTU5MERcdTUyMzZcdThERUZcdTVGODRcblx0XHRjb25zdCBjb3B5UGF0aEJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicpO1xuXHRcdGNvcHlQYXRoQnRuLnRleHRDb250ZW50ID0gdGhpcy5wbHVnaW4udCgnY29weVBhdGhCdG4nKTtcblx0XHRjb3B5UGF0aEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHZvaWQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoZmlsZS5wYXRoKS50aGVuKCgpID0+IHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdwYXRoQ29waWVkJykpO1xuXHRcdFx0fSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTkwRFx1NTIzNlx1NTIzMFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdC8vIFx1NTkwRFx1NTIzNlx1OTRGRVx1NjNBNVxuXHRcdGNvbnN0IGNvcHlMaW5rQnRuID0gYWN0aW9ucy5jcmVhdGVFbCgnYnV0dG9uJyk7XG5cdFx0Y29weUxpbmtCdG4udGV4dENvbnRlbnQgPSB0aGlzLnBsdWdpbi50KCdjb3B5TGlua0J0bicpO1xuXHRcdGNvcHlMaW5rQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0Y29uc3QgbGluayA9IHRoaXMucGx1Z2luLmdldFN0YWJsZVdpa2lMaW5rKGZpbGUpO1xuXHRcdFx0dm9pZCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChsaW5rKS50aGVuKCgpID0+IHtcblx0XHRcdFx0bmV3IE5vdGljZSh0aGlzLnBsdWdpbi50KCdsaW5rQ29waWVkJykpO1xuXHRcdFx0fSkuY2F0Y2goKGVycm9yKSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ1x1NTkwRFx1NTIzNlx1NTIzMFx1NTI2QVx1OEQzNFx1Njc3Rlx1NTkzMVx1OEQyNTonLCBlcnJvcik7XG5cdFx0XHRcdG5ldyBOb3RpY2UodGhpcy5wbHVnaW4udCgnZXJyb3InKSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdC8vIFx1NjI1M1x1NUYwMFx1NTM5Rlx1NjU4N1x1NEVGNlxuXHRcdGNvbnN0IG9wZW5PcmlnaW5hbEJ0biA9IGFjdGlvbnMuY3JlYXRlRWwoJ2J1dHRvbicpO1xuXHRcdG9wZW5PcmlnaW5hbEJ0bi50ZXh0Q29udGVudCA9IHRoaXMucGx1Z2luLnQoJ29wZW5PcmlnaW5hbCcpO1xuXHRcdG9wZW5PcmlnaW5hbEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblx0XHRcdHZvaWQgdGhpcy5wbHVnaW4ub3Blbk9yaWdpbmFsRmlsZShmaWxlKTtcblx0XHR9KTtcblxuXHRcdC8vIFx1NTcyOFx1N0IxNFx1OEJCMFx1NEUyRFx1NjdFNVx1NjI3RVxuXHRcdGNvbnN0IGZpbmRCdG4gPSBhY3Rpb25zLmNyZWF0ZUVsKCdidXR0b24nKTtcblx0XHRmaW5kQnRuLnRleHRDb250ZW50ID0gdGhpcy5wbHVnaW4udCgnZmluZEluTm90ZXMnKTtcblx0XHRmaW5kQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdFx0dGhpcy5jbG9zZSgpO1xuXHRcdFx0dGhpcy5wbHVnaW4ub3BlbkltYWdlSW5Ob3RlcyhmaWxlKTtcblx0XHR9KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZDRThcdTUxOENcdTk1MkVcdTc2RDhcdTVCRkNcdTgyMkFcblx0ICovXG5cdHJlZ2lzdGVyS2V5Ym9hcmROYXYoKSB7XG5cdFx0dGhpcy5rZXlkb3duSGFuZGxlciA9IChlOiBLZXlib2FyZEV2ZW50KSA9PiB7XG5cdFx0XHRzd2l0Y2ggKGUua2V5KSB7XG5cdFx0XHRcdGNhc2UgJ0Fycm93TGVmdCc6XG5cdFx0XHRcdFx0dGhpcy5wcmV2KCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0Fycm93UmlnaHQnOlxuXHRcdFx0XHRcdHRoaXMubmV4dCgpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdFc2NhcGUnOlxuXHRcdFx0XHRcdHRoaXMuY2xvc2UoKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5tb2RhbEVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLmtleWRvd25IYW5kbGVyKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTRFMEFcdTRFMDBcdTVGMjBcblx0ICovXG5cdHByZXYoKSB7XG5cdFx0aWYgKHRoaXMuY3VycmVudEluZGV4ID4gMCkge1xuXHRcdFx0dGhpcy5jdXJyZW50SW5kZXgtLTtcblx0XHRcdHRoaXMudXBkYXRlQ29udGVudCgpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBcdTRFMEJcdTRFMDBcdTVGMjBcblx0ICovXG5cdG5leHQoKSB7XG5cdFx0aWYgKHRoaXMuY3VycmVudEluZGV4IDwgdGhpcy5hbGxGaWxlcy5sZW5ndGggLSAxKSB7XG5cdFx0XHR0aGlzLmN1cnJlbnRJbmRleCsrO1xuXHRcdFx0dGhpcy51cGRhdGVDb250ZW50KCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjZGNFx1NjVCMFx1NTE4NVx1NUJCOVxuXHQgKi9cblx0dXBkYXRlQ29udGVudCgpIHtcblx0XHQvLyBcdTY4QzBcdTY3RTUgY29udGVudEVsIFx1NjYyRlx1NTQyNlx1NUI1OFx1NTcyOFxuXHRcdGlmICghdGhpcy5jb250ZW50RWwpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBjb250YWluZXIgPSB0aGlzLmNvbnRlbnRFbC5xdWVyeVNlbGVjdG9yKCcucHJldmlldy1jb250YWluZXInKTtcblx0XHRpZiAoY29udGFpbmVyKSB7XG5cdFx0XHR0aGlzLnJlbmRlck1lZGlhKGNvbnRhaW5lciBhcyBIVE1MRWxlbWVudCk7XG5cdFx0XHRjb25zdCBvbGROYXYgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignLnByZXZpZXctbmF2Jyk7XG5cdFx0XHRpZiAob2xkTmF2KSBvbGROYXYucmVtb3ZlKCk7XG5cdFx0XHRpZiAodGhpcy5hbGxGaWxlcy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdHRoaXMucmVuZGVyTmF2aWdhdGlvbihjb250YWluZXIgYXMgSFRNTEVsZW1lbnQpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRjb25zdCBvbGRJbmZvQmFyID0gdGhpcy5jb250ZW50RWwucXVlcnlTZWxlY3RvcignLnByZXZpZXctaW5mby1iYXInKTtcblx0XHRpZiAob2xkSW5mb0Jhcikgb2xkSW5mb0Jhci5yZW1vdmUoKTtcblx0XHR0aGlzLnJlbmRlckluZm9CYXIodGhpcy5jb250ZW50RWwpO1xuXHR9XG5cblx0b25DbG9zZSgpIHtcblx0XHRjb25zdCB7IGNvbnRlbnRFbCwgbW9kYWxFbCB9ID0gdGhpcztcblx0XHQvLyBcdTc5RkJcdTk2NjRcdTk1MkVcdTc2RDhcdTRFOEJcdTRFRjZcdTc2RDFcdTU0MkNcdTU2NjhcdUZGMENcdTk2MzJcdTZCNjJcdTUxODVcdTVCNThcdTZDQzRcdTZGMEZcblx0XHRpZiAodGhpcy5rZXlkb3duSGFuZGxlcikge1xuXHRcdFx0bW9kYWxFbC5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5rZXlkb3duSGFuZGxlcik7XG5cdFx0XHR0aGlzLmtleWRvd25IYW5kbGVyID0gbnVsbDtcblx0XHR9XG5cdFx0Y29udGVudEVsLmVtcHR5KCk7XG5cdFx0aWYgKHRoaXMub25EaWRDbG9zZSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0dGhpcy5vbkRpZENsb3NlKCk7XG5cdFx0XHR9IGNhdGNoIChfKSB7fVxuXHRcdH1cblx0fVxufVxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgRHJvcGRvd25Db21wb25lbnQgfSBmcm9tICdvYnNpZGlhbic7XG5pbXBvcnQgSW1hZ2VNYW5hZ2VyUGx1Z2luIGZyb20gJy4vbWFpbic7XG5pbXBvcnQgeyBUcmFuc2xhdGlvbnMgfSBmcm9tICcuL3V0aWxzL2kxOG4nO1xuaW1wb3J0IHsgbm9ybWFsaXplVmF1bHRQYXRoIH0gZnJvbSAnLi91dGlscy9wYXRoJztcblxuZXhwb3J0IGludGVyZmFjZSBJbWFnZU1hbmFnZXJTZXR0aW5ncyB7XG5cdGltYWdlRm9sZGVyOiBzdHJpbmc7XG5cdHRodW1ibmFpbFNpemU6ICdzbWFsbCcgfCAnbWVkaXVtJyB8ICdsYXJnZSc7XG5cdHNob3dJbWFnZUluZm86IGJvb2xlYW47XG5cdHNvcnRCeTogJ25hbWUnIHwgJ2RhdGUnIHwgJ3NpemUnO1xuXHRzb3J0T3JkZXI6ICdhc2MnIHwgJ2Rlc2MnO1xuXHRhdXRvUmVmcmVzaDogYm9vbGVhbjtcblx0ZGVmYXVsdEFsaWdubWVudDogJ2xlZnQnIHwgJ2NlbnRlcicgfCAncmlnaHQnO1xuXHR1c2VUcmFzaEZvbGRlcjogYm9vbGVhbjtcblx0dHJhc2hGb2xkZXI6IHN0cmluZztcblx0YXV0b0NsZWFudXBUcmFzaDogYm9vbGVhbjtcblx0dHJhc2hDbGVhbnVwRGF5czogbnVtYmVyO1xuXHQvLyBcdTY1QjBcdTU4OUVcdThCQkVcdTdGNkVcblx0ZW5hYmxlSW1hZ2VzOiBib29sZWFuO1xuXHRlbmFibGVWaWRlb3M6IGJvb2xlYW47XG5cdGVuYWJsZUF1ZGlvOiBib29sZWFuO1xuXHRlbmFibGVQREY6IGJvb2xlYW47XG5cdHBhZ2VTaXplOiBudW1iZXI7XG5cdGVuYWJsZVByZXZpZXdNb2RhbDogYm9vbGVhbjtcblx0ZW5hYmxlS2V5Ym9hcmROYXY6IGJvb2xlYW47XG5cdC8vIFx1NTZGRFx1OTY0NVx1NTMxNlx1OEJCRVx1N0Y2RVxuXHRsYW5ndWFnZTogJ3poJyB8ICdlbicgfCAnc3lzdGVtJztcblx0Ly8gUXVhcmFudGluZSBcdTVCODlcdTUxNjhcdTYyNkJcdTYzQ0Zcblx0c2FmZVNjYW5FbmFibGVkOiBib29sZWFuO1xuXHRzYWZlU2NhblVucmVmRGF5czogbnVtYmVyO1xuXHRzYWZlU2Nhbk1pblNpemU6IG51bWJlcjsgLy8gYnl0ZXNcblx0Ly8gXHU1M0JCXHU5MUNEXHU4QkJFXHU3RjZFXG5cdGR1cGxpY2F0ZVRocmVzaG9sZDogbnVtYmVyO1xuXHQvLyBcdTgxRUFcdTUyQThcdTY1NzRcdTc0MDZcdTg5QzRcdTUyMTlcblx0b3JnYW5pemVSdWxlczogT3JnYW5pemVSdWxlW107XG5cdC8vIFx1NUE5Mlx1NEY1M1x1NTkwNFx1NzQwNlx1OUVEOFx1OEJBNFx1NTNDMlx1NjU3MFxuXHRkZWZhdWx0UHJvY2Vzc1F1YWxpdHk6IG51bWJlcjtcblx0ZGVmYXVsdFByb2Nlc3NGb3JtYXQ6ICd3ZWJwJyB8ICdqcGVnJyB8ICdwbmcnO1xuXHR3YXRlcm1hcmtUZXh0OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3JnYW5pemVSdWxlIHtcblx0bmFtZTogc3RyaW5nO1xuXHRlbmFibGVkOiBib29sZWFuO1xuXHRwYXRoVGVtcGxhdGU6IHN0cmluZztcblx0cmVuYW1lVGVtcGxhdGU6IHN0cmluZztcblx0bWF0Y2hFeHRlbnNpb25zOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBJbWFnZU1hbmFnZXJTZXR0aW5ncyA9IHtcblx0aW1hZ2VGb2xkZXI6ICcnLFxuXHR0aHVtYm5haWxTaXplOiAnbWVkaXVtJyxcblx0c2hvd0ltYWdlSW5mbzogdHJ1ZSxcblx0c29ydEJ5OiAnbmFtZScsXG5cdHNvcnRPcmRlcjogJ2FzYycsXG5cdGF1dG9SZWZyZXNoOiB0cnVlLFxuXHRkZWZhdWx0QWxpZ25tZW50OiAnY2VudGVyJyxcblx0dXNlVHJhc2hGb2xkZXI6IHRydWUsXG5cdHRyYXNoRm9sZGVyOiAnb2JzaWRpYW4tbWVkaWEtdG9vbGtpdC10cmFzaCcsXG5cdGF1dG9DbGVhbnVwVHJhc2g6IGZhbHNlLFxuXHR0cmFzaENsZWFudXBEYXlzOiAzMCxcblx0Ly8gXHU2NUIwXHU1ODlFXHU5RUQ4XHU4QkE0XHU1MDNDXG5cdGVuYWJsZUltYWdlczogdHJ1ZSxcblx0ZW5hYmxlVmlkZW9zOiB0cnVlLFxuXHRlbmFibGVBdWRpbzogdHJ1ZSxcblx0ZW5hYmxlUERGOiB0cnVlLFxuXHRwYWdlU2l6ZTogNTAsXG5cdGVuYWJsZVByZXZpZXdNb2RhbDogdHJ1ZSxcblx0ZW5hYmxlS2V5Ym9hcmROYXY6IHRydWUsXG5cdC8vIFx1NTZGRFx1OTY0NVx1NTMxNlx1OEJCRVx1N0Y2RVxuXHRsYW5ndWFnZTogJ3N5c3RlbScsXG5cdC8vIFF1YXJhbnRpbmUgXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGXG5cdHNhZmVTY2FuRW5hYmxlZDogZmFsc2UsXG5cdHNhZmVTY2FuVW5yZWZEYXlzOiAzMCxcblx0c2FmZVNjYW5NaW5TaXplOiA1ICogMTAyNCAqIDEwMjQsIC8vIDVNQlxuXHQvLyBcdTUzQkJcdTkxQ0Rcblx0ZHVwbGljYXRlVGhyZXNob2xkOiA5MCxcblx0Ly8gXHU4MUVBXHU1MkE4XHU2NTc0XHU3NDA2XG5cdG9yZ2FuaXplUnVsZXM6IFtcblx0XHR7XG5cdFx0XHRuYW1lOiAnRGVmYXVsdCcsXG5cdFx0XHRlbmFibGVkOiBmYWxzZSxcblx0XHRcdHBhdGhUZW1wbGF0ZTogJ01lZGlhL3t5ZWFyfS97bW9udGh9Jyxcblx0XHRcdHJlbmFtZVRlbXBsYXRlOiAne25hbWV9Jyxcblx0XHRcdG1hdGNoRXh0ZW5zaW9uczogJ2pwZyxqcGVnLHBuZyxnaWYsd2VicCdcblx0XHR9XG5cdF0sXG5cdC8vIFx1NUE5Mlx1NEY1M1x1NTkwNFx1NzQwNlxuXHRkZWZhdWx0UHJvY2Vzc1F1YWxpdHk6IDgwLFxuXHRkZWZhdWx0UHJvY2Vzc0Zvcm1hdDogJ3dlYnAnLFxuXHR3YXRlcm1hcmtUZXh0OiAnJ1xufTtcblxuZXhwb3J0IGNsYXNzIFNldHRpbmdzVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG5cdHBsdWdpbjogSW1hZ2VNYW5hZ2VyUGx1Z2luO1xuXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbikge1xuXHRcdHN1cGVyKGFwcCwgcGx1Z2luKTtcblx0XHR0aGlzLnBsdWdpbiA9IHBsdWdpbjtcblx0fVxuXG5cdC8vIFx1N0ZGQlx1OEJEMVx1OEY4NVx1NTJBOVx1NjVCOVx1NkNENVxuXHRwcml2YXRlIHQoa2V5OiBrZXlvZiBUcmFuc2xhdGlvbnMpOiBzdHJpbmcge1xuXHRcdHJldHVybiB0aGlzLnBsdWdpbi50KGtleSk7XG5cdH1cblxuXHRkaXNwbGF5KCk6IHZvaWQge1xuXHRcdGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcblxuXHRcdC8vIFx1NEY3Rlx1NzUyOFx1N0ZGQlx1OEJEMVxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHsgdGV4dDogdGhpcy50KCdwbHVnaW5TZXR0aW5ncycpIH0pO1xuXG5cdFx0Ly8gXHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHU1OTM5XHU4QkJFXHU3RjZFXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ21lZGlhRm9sZGVyJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ21lZGlhRm9sZGVyRGVzYycpKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB0ZXh0XG5cdFx0XHRcdC5zZXRQbGFjZWhvbGRlcignYXR0YWNobWVudHMvbWVkaWEnKVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuaW1hZ2VGb2xkZXIpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5pbWFnZUZvbGRlciA9IG5vcm1hbGl6ZVZhdWx0UGF0aCh2YWx1ZSk7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uY2xlYXJDYWNoZSgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTdGMjlcdTc1NjVcdTU2RkVcdTU5MjdcdTVDMEZcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgndGh1bWJuYWlsU2l6ZScpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCd0aHVtYm5haWxTaXplRGVzYycpKVxuXHRcdFx0LmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IGRyb3Bkb3duXG5cdFx0XHRcdC5hZGRPcHRpb24oJ3NtYWxsJywgdGhpcy50KCd0aHVtYm5haWxTbWFsbCcpKVxuXHRcdFx0XHQuYWRkT3B0aW9uKCdtZWRpdW0nLCB0aGlzLnQoJ3RodW1ibmFpbE1lZGl1bScpKVxuXHRcdFx0XHQuYWRkT3B0aW9uKCdsYXJnZScsIHRoaXMudCgndGh1bWJuYWlsTGFyZ2UnKSlcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRodW1ibmFpbFNpemUpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWU6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnRodW1ibmFpbFNpemUgPSB2YWx1ZSBhcyAnc21hbGwnIHwgJ21lZGl1bScgfCAnbGFyZ2UnO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTYzOTJcdTVFOEZcdTY1QjlcdTVGMEZcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZGVmYXVsdFNvcnRCeScpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdzb3J0QnlEZXNjJykpXG5cdFx0XHQuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4gZHJvcGRvd25cblx0XHRcdFx0LmFkZE9wdGlvbignbmFtZScsIHRoaXMudCgnc29ydEJ5TmFtZScpKVxuXHRcdFx0XHQuYWRkT3B0aW9uKCdkYXRlJywgdGhpcy50KCdzb3J0QnlEYXRlJykpXG5cdFx0XHRcdC5hZGRPcHRpb24oJ3NpemUnLCB0aGlzLnQoJ3NvcnRCeVNpemUnKSlcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRCeSlcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3Muc29ydEJ5ID0gdmFsdWUgYXMgJ25hbWUnIHwgJ2RhdGUnIHwgJ3NpemUnO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTYzOTJcdTVFOEZcdTk4N0FcdTVFOEZcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnc29ydE9yZGVyJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ3NvcnRPcmRlckRlc2MnKSlcblx0XHRcdC5hZGREcm9wZG93bihkcm9wZG93biA9PiBkcm9wZG93blxuXHRcdFx0XHQuYWRkT3B0aW9uKCdhc2MnLCB0aGlzLnQoJ3NvcnRBc2MnKSlcblx0XHRcdFx0LmFkZE9wdGlvbignZGVzYycsIHRoaXMudCgnc29ydERlc2MnKSlcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNvcnRPcmRlcilcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3Muc29ydE9yZGVyID0gdmFsdWUgYXMgJ2FzYycgfCAnZGVzYyc7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NjYzRVx1NzkzQVx1NTZGRVx1NzI0N1x1NEZFMVx1NjA2RlxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdzaG93SW1hZ2VJbmZvJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ3Nob3dJbWFnZUluZm9EZXNjJykpXG5cdFx0XHQuYWRkVG9nZ2xlKHRvZ2dsZSA9PiB0b2dnbGVcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnNob3dJbWFnZUluZm8pXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zaG93SW1hZ2VJbmZvID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1ODFFQVx1NTJBOFx1NTIzN1x1NjVCMFxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdhdXRvUmVmcmVzaCcpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdhdXRvUmVmcmVzaERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b1JlZnJlc2gpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvUmVmcmVzaCA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTlFRDhcdThCQTRcdTVCRjlcdTlGNTBcdTY1QjlcdTVGMEZcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZGVmYXVsdEFsaWdubWVudCcpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdhbGlnbm1lbnREZXNjJykpXG5cdFx0XHQuYWRkRHJvcGRvd24oZHJvcGRvd24gPT4gZHJvcGRvd25cblx0XHRcdFx0LmFkZE9wdGlvbignbGVmdCcsIHRoaXMudCgnYWxpZ25MZWZ0JykpXG5cdFx0XHRcdC5hZGRPcHRpb24oJ2NlbnRlcicsIHRoaXMudCgnYWxpZ25DZW50ZXInKSlcblx0XHRcdFx0LmFkZE9wdGlvbigncmlnaHQnLCB0aGlzLnQoJ2FsaWduUmlnaHQnKSlcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRBbGlnbm1lbnQpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWU6IHN0cmluZykgPT4ge1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRBbGlnbm1lbnQgPSB2YWx1ZSBhcyAnbGVmdCcgfCAnY2VudGVyJyB8ICdyaWdodCc7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NTIwNlx1OTY5NFx1N0VCRlxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdocicsIHsgY2xzOiAnc2V0dGluZ3MtZGl2aWRlcicgfSk7XG5cblx0XHQvLyBcdTVCODlcdTUxNjhcdTUyMjBcdTk2NjRcdThCQkVcdTdGNkVcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6IHRoaXMudCgnc2FmZURlbGV0ZVNldHRpbmdzJykgfSk7XG5cblx0XHQvLyBcdTRGN0ZcdTc1MjhcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzlcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgndXNlVHJhc2hGb2xkZXInKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgndXNlVHJhc2hGb2xkZXJEZXNjJykpXG5cdFx0XHQuYWRkVG9nZ2xlKHRvZ2dsZSA9PiB0b2dnbGVcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnVzZVRyYXNoRm9sZGVyKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MudXNlVHJhc2hGb2xkZXIgPSB2YWx1ZTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0Ly8gXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU4REVGXHU1Rjg0XG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ3RyYXNoRm9sZGVyUGF0aCcpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCd0cmFzaEZvbGRlclBhdGhEZXNjJykpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHRleHRcblx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCdvYnNpZGlhbi1tZWRpYS10b29sa2l0LXRyYXNoJylcblx0XHRcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnRyYXNoRm9sZGVyKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MudHJhc2hGb2xkZXIgPSBub3JtYWxpemVWYXVsdFBhdGgodmFsdWUpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTgxRUFcdTUyQThcdTZFMDVcdTc0MDZcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzlcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnYXV0b0NsZWFudXBUcmFzaCcpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdhdXRvQ2xlYW51cFRyYXNoRGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5hdXRvQ2xlYW51cFRyYXNoKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuYXV0b0NsZWFudXBUcmFzaCA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTZFMDVcdTc0MDZcdTU5MjlcdTY1NzBcblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnY2xlYW51cERheXMnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnY2xlYW51cERheXNEZXNjJykpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHRleHRcblx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCczMCcpXG5cdFx0XHRcdC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MudHJhc2hDbGVhbnVwRGF5cykpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRjb25zdCBkYXlzID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcblx0XHRcdFx0XHRpZiAoIWlzTmFOKGRheXMpICYmIGRheXMgPiAwKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy50cmFzaENsZWFudXBEYXlzID0gZGF5cztcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSkpO1xuXG5cdFx0Ly8gXHU1MjA2XHU5Njk0XHU3RUJGXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2hyJywgeyBjbHM6ICdzZXR0aW5ncy1kaXZpZGVyJyB9KTtcblxuXHRcdC8vIFx1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRlx1OEJCRVx1N0Y2RVxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogdGhpcy50KCdzYWZlU2NhblNldHRpbmdzJykgfSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnc2FmZVNjYW4nKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnc2FmZVNjYW5FbmFibGVkRGVzYycpKVxuXHRcdFx0LmFkZFRvZ2dsZSh0b2dnbGUgPT4gdG9nZ2xlXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zYWZlU2NhbkVuYWJsZWQpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5zYWZlU2NhbkVuYWJsZWQgPSB2YWx1ZTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ3NhZmVTY2FuVW5yZWZEYXlzJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ3NhZmVTY2FuVW5yZWZEYXlzRGVzYycpKVxuXHRcdFx0LmFkZFRleHQodGV4dCA9PiB0ZXh0XG5cdFx0XHRcdC5zZXRQbGFjZWhvbGRlcignMzAnKVxuXHRcdFx0XHQuc2V0VmFsdWUoU3RyaW5nKHRoaXMucGx1Z2luLnNldHRpbmdzLnNhZmVTY2FuVW5yZWZEYXlzKSlcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IGRheXMgPSBwYXJzZUludCh2YWx1ZSwgMTApO1xuXHRcdFx0XHRcdGlmICghaXNOYU4oZGF5cykgJiYgZGF5cyA+IDApIHtcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnNhZmVTY2FuVW5yZWZEYXlzID0gZGF5cztcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSkpO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ3NhZmVTY2FuTWluU2l6ZScpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdzYWZlU2Nhbk1pblNpemVEZXNjJykpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHRleHRcblx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCc1Jylcblx0XHRcdFx0LnNldFZhbHVlKFN0cmluZyhOdW1iZXIoKHRoaXMucGx1Z2luLnNldHRpbmdzLnNhZmVTY2FuTWluU2l6ZSAvICgxMDI0ICogMTAyNCkpLnRvRml4ZWQoMikpKSlcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IHNpemVNYiA9IHBhcnNlRmxvYXQodmFsdWUpO1xuXHRcdFx0XHRcdGlmICghaXNOYU4oc2l6ZU1iKSAmJiBzaXplTWIgPj0gMCkge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3Muc2FmZVNjYW5NaW5TaXplID0gTWF0aC5yb3VuZChzaXplTWIgKiAxMDI0ICogMTAyNCk7XG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pKTtcblxuXHRcdC8vIFx1NTIwNlx1OTY5NFx1N0VCRlxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdocicsIHsgY2xzOiAnc2V0dGluZ3MtZGl2aWRlcicgfSk7XG5cblx0XHQvLyBcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEJcdThCQkVcdTdGNkVcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6IHRoaXMudCgnZHVwbGljYXRlRGV0ZWN0aW9uU2V0dGluZ3MnKSB9KTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdkdXBsaWNhdGVUaHJlc2hvbGRTZXR0aW5nJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2R1cGxpY2F0ZVRocmVzaG9sZERlc2MnKSlcblx0XHRcdC5hZGRUZXh0KHRleHQgPT4gdGV4dFxuXHRcdFx0XHQuc2V0UGxhY2Vob2xkZXIoJzkwJylcblx0XHRcdFx0LnNldFZhbHVlKFN0cmluZyh0aGlzLnBsdWdpbi5zZXR0aW5ncy5kdXBsaWNhdGVUaHJlc2hvbGQpKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgdGhyZXNob2xkID0gcGFyc2VJbnQodmFsdWUsIDEwKTtcblx0XHRcdFx0XHRpZiAoIWlzTmFOKHRocmVzaG9sZCkgJiYgdGhyZXNob2xkID49IDUwICYmIHRocmVzaG9sZCA8PSAxMDApIHtcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLmR1cGxpY2F0ZVRocmVzaG9sZCA9IHRocmVzaG9sZDtcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSkpO1xuXG5cdFx0Ly8gXHU1MjA2XHU5Njk0XHU3RUJGXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2hyJywgeyBjbHM6ICdzZXR0aW5ncy1kaXZpZGVyJyB9KTtcblxuXHRcdC8vIFx1NUE5Mlx1NEY1M1x1N0M3Qlx1NTc4Qlx1OEZDN1x1NkVFNFxuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMycsIHsgdGV4dDogdGhpcy50KCdtZWRpYVR5cGVzJykgfSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZW5hYmxlSW1hZ2VTdXBwb3J0JykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2VuYWJsZUltYWdlU3VwcG9ydERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlSW1hZ2VzKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlSW1hZ2VzID0gdmFsdWU7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uY2xlYXJDYWNoZSgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZW5hYmxlVmlkZW9TdXBwb3J0JykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2VuYWJsZVZpZGVvU3VwcG9ydERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlVmlkZW9zKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlVmlkZW9zID0gdmFsdWU7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uY2xlYXJDYWNoZSgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZW5hYmxlQXVkaW9TdXBwb3J0JykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2VuYWJsZUF1ZGlvU3VwcG9ydERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlQXVkaW8pXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVBdWRpbyA9IHZhbHVlO1xuXHRcdFx0XHRcdHRoaXMucGx1Z2luLmNsZWFyQ2FjaGUoKTtcblx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ2VuYWJsZVBERlN1cHBvcnQnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgnZW5hYmxlUERGU3VwcG9ydERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlUERGKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlUERGID0gdmFsdWU7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uY2xlYXJDYWNoZSgpO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTUyMDZcdTk2OTRcdTdFQkZcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaHInLCB7IGNsczogJ3NldHRpbmdzLWRpdmlkZXInIH0pO1xuXG5cdFx0Ly8gXHU4OUM2XHU1NkZFXHU4QkJFXHU3RjZFXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiB0aGlzLnQoJ3ZpZXdTZXR0aW5ncycpIH0pO1xuXG5cdFx0Ly8gXHU4QkVEXHU4QTAwXHU4QkJFXHU3RjZFXG5cdFx0bmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG5cdFx0XHQuc2V0TmFtZSh0aGlzLnQoJ2ludGVyZmFjZUxhbmd1YWdlJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2xhbmd1YWdlRGVzYycpKVxuXHRcdFx0LmFkZERyb3Bkb3duKGRyb3Bkb3duID0+IGRyb3Bkb3duXG5cdFx0XHRcdC5hZGRPcHRpb24oJ3N5c3RlbScsIHRoaXMudCgnbGFuZ3VhZ2VTeXN0ZW0nKSlcblx0XHRcdFx0LmFkZE9wdGlvbignemgnLCAnXHU0RTJEXHU2NTg3Jylcblx0XHRcdFx0LmFkZE9wdGlvbignZW4nLCAnRW5nbGlzaCcpXG5cdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5sYW5ndWFnZSlcblx0XHRcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MubGFuZ3VhZ2UgPSB2YWx1ZSBhcyAnemgnIHwgJ2VuJyB8ICdzeXN0ZW0nO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgncGFnZVNpemUnKSlcblx0XHRcdC5zZXREZXNjKHRoaXMudCgncGFnZVNpemVEZXNjJykpXG5cdFx0XHQuYWRkVGV4dCh0ZXh0ID0+IHRleHRcblx0XHRcdFx0LnNldFBsYWNlaG9sZGVyKCc1MCcpXG5cdFx0XHRcdC5zZXRWYWx1ZShTdHJpbmcodGhpcy5wbHVnaW4uc2V0dGluZ3MucGFnZVNpemUpKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0Y29uc3Qgc2l6ZSA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XG5cdFx0XHRcdFx0aWYgKCFpc05hTihzaXplKSAmJiBzaXplID4gMCkge1xuXHRcdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MucGFnZVNpemUgPSBzaXplO1xuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KSk7XG5cblx0XHRuZXcgU2V0dGluZyhjb250YWluZXJFbClcblx0XHRcdC5zZXROYW1lKHRoaXMudCgnZW5hYmxlUHJldmlld01vZGFsJykpXG5cdFx0XHQuc2V0RGVzYyh0aGlzLnQoJ2VuYWJsZVByZXZpZXdNb2RhbERlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlUHJldmlld01vZGFsKVxuXHRcdFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG5cdFx0XHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlUHJldmlld01vZGFsID0gdmFsdWU7XG5cdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG5cdFx0XHRcdH0pKTtcblxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuXHRcdFx0LnNldE5hbWUodGhpcy50KCdlbmFibGVLZXlib2FyZE5hdicpKVxuXHRcdFx0LnNldERlc2ModGhpcy50KCdlbmFibGVLZXlib2FyZE5hdkRlc2MnKSlcblx0XHRcdC5hZGRUb2dnbGUodG9nZ2xlID0+IHRvZ2dsZVxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZW5hYmxlS2V5Ym9hcmROYXYpXG5cdFx0XHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5lbmFibGVLZXlib2FyZE5hdiA9IHZhbHVlO1xuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuXHRcdFx0XHR9KSk7XG5cblx0XHQvLyBcdTUyMDZcdTk2OTRcdTdFQkZcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgnaHInLCB7IGNsczogJ3NldHRpbmdzLWRpdmlkZXInIH0pO1xuXG5cdFx0Ly8gXHU1RTJFXHU1MkE5XHU0RkUxXHU2MDZGXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiB0aGlzLnQoJ2tleWJvYXJkU2hvcnRjdXRzJykgfSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3AnLCB7XG5cdFx0XHR0ZXh0OiB0aGlzLnQoJ3Nob3J0Y3V0c0Rlc2MnKSxcblx0XHRcdGNsczogJ3NldHRpbmdzLWRlc2NyaXB0aW9uJ1xuXHRcdH0pO1xuXHRcdGNvbnRhaW5lckVsLmNyZWF0ZUVsKCd1bCcsIHsgY2xzOiAnc2V0dGluZ3MtbGlzdCcgfSkuY3JlYXRlRWwoJ2xpJywgeyB0ZXh0OiB0aGlzLnQoJ3Nob3J0Y3V0T3BlbkxpYnJhcnknKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdzaG9ydGN1dEZpbmRVbnJlZmVyZW5jZWQnKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdzaG9ydGN1dE9wZW5UcmFzaCcpIH0pO1xuXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiB0aGlzLnQoJ2NvbW1hbmRzJykgfSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3AnLCB7XG5cdFx0XHR0ZXh0OiB0aGlzLnQoJ2NvbW1hbmRzRGVzYycpLFxuXHRcdFx0Y2xzOiAnc2V0dGluZ3MtZGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3VsJywgeyBjbHM6ICdzZXR0aW5ncy1saXN0JyB9KS5jcmVhdGVFbCgnbGknLCB7IHRleHQ6IHRoaXMudCgnY21kT3BlbkxpYnJhcnknKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdjbWRGaW5kVW5yZWZlcmVuY2VkJykgfSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3VsJywgeyBjbHM6ICdzZXR0aW5ncy1saXN0JyB9KS5jcmVhdGVFbCgnbGknLCB7IHRleHQ6IHRoaXMudCgnY21kVHJhc2hNYW5hZ2VtZW50JykgfSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3VsJywgeyBjbHM6ICdzZXR0aW5ncy1saXN0JyB9KS5jcmVhdGVFbCgnbGknLCB7IHRleHQ6IHRoaXMudCgnY21kQWxpZ25MZWZ0JykgfSk7XG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ3VsJywgeyBjbHM6ICdzZXR0aW5ncy1saXN0JyB9KS5jcmVhdGVFbCgnbGknLCB7IHRleHQ6IHRoaXMudCgnY21kQWxpZ25DZW50ZXInKSB9KTtcblx0XHRjb250YWluZXJFbC5jcmVhdGVFbCgndWwnLCB7IGNsczogJ3NldHRpbmdzLWxpc3QnIH0pLmNyZWF0ZUVsKCdsaScsIHsgdGV4dDogdGhpcy50KCdjbWRBbGlnblJpZ2h0JykgfSk7XG5cdH1cbn1cbiIsICJpbXBvcnQgeyBlc2NhcGVIdG1sQXR0ciB9IGZyb20gJy4vc2VjdXJpdHknO1xuXG5leHBvcnQgdHlwZSBBbGlnbm1lbnRUeXBlID0gJ2xlZnQnIHwgJ2NlbnRlcicgfCAncmlnaHQnO1xuXG5leHBvcnQgY2xhc3MgSW1hZ2VBbGlnbm1lbnQge1xuXHQvKipcblx0ICogXHU1M0JCXHU5NjY0XHU1REYyXHU1QjU4XHU1NzI4XHU3Njg0XHU1QkY5XHU5RjUwXHU1MzA1XHU4OEM1XHVGRjBDXHU5MDdGXHU1MTREXHU5MUNEXHU1OTBEXHU1RDRDXHU1OTU3XG5cdCAqL1xuXHRwcml2YXRlIHN0YXRpYyBzdHJpcEV4aXN0aW5nQWxpZ25tZW50KG1hcmtkb3duOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdGxldCBjbGVhbk1hcmtkb3duID0gbWFya2Rvd24udHJpbSgpO1xuXG5cdFx0Ly8gXHU1MzM5XHU5MTREID09PWNlbnRlcj09PSBcdTU3NTdcdThCRURcdTZDRDVcdUZGMDhcdTY1RTdcdTc2ODRcdUZGMDlcblx0XHRjb25zdCBibG9ja01hdGNoID0gY2xlYW5NYXJrZG93bi5tYXRjaCgvXj09PVxccyoobGVmdHxjZW50ZXJ8cmlnaHQpXFxzKj09PVxccyooW1xcc1xcU10qPylcXHMqPT09JC9pKTtcblx0XHRpZiAoYmxvY2tNYXRjaCkge1xuXHRcdFx0cmV0dXJuIGJsb2NrTWF0Y2hbMl0udHJpbSgpO1xuXHRcdH1cblxuXHRcdC8vIFx1NTMzOVx1OTE0RCB7YWxpZ249Y2VudGVyfSBcdTYyMTYgeyBhbGlnbj1jZW50ZXIgfSBcdTk4Q0VcdTY4M0NcdUZGMDhcdTY1RTdcdTc2ODRcdUZGMDlcblx0XHRjbGVhbk1hcmtkb3duID0gY2xlYW5NYXJrZG93bi5yZXBsYWNlKC9eXFx7XFxzKmFsaWduXFxzKj1cXHMqKGxlZnR8Y2VudGVyfHJpZ2h0KVxccypcXH1cXHMqL2ksICcnKS50cmltKCk7XG5cblx0XHQvLyBcdTUzMzlcdTkxNERcdTY1QjBcdTc2ODRcdTYyNjlcdTVDNTVcdTk0RkVcdTYzQTVcdThCRURcdTZDRDUgIVtbaW1hZ2V8Y2VudGVyXV0gXHU2MjE2ICFbW2ltYWdlfGFsaWduXV1cblx0XHQvLyBcdTYzRDBcdTUzRDZcdTUxRkFcdTU2RkVcdTcyNDdcdThERUZcdTVGODRcdUZGMENcdTUzQkJcdTk2NjRcdTVCRjlcdTlGNTBcdTUzQzJcdTY1NzBcblx0XHRjb25zdCBsaW5rTWF0Y2ggPSBjbGVhbk1hcmtkb3duLm1hdGNoKC9eIT9cXFtcXFsoW15cXF18XSspXFx8KFteXFxdXSspXFxdXFxdJC8pO1xuXHRcdGlmIChsaW5rTWF0Y2gpIHtcblx0XHRcdC8vIFx1NTk4Mlx1Njc5Q1x1N0IyQ1x1NEU4Q1x1NEUyQVx1NTNDMlx1NjU3MFx1NjYyRiBsZWZ0L2NlbnRlci9yaWdodFx1RkYwQ1x1NTIxOVx1NTNCQlx1NjM4OVx1NUI4M1xuXHRcdFx0Y29uc3QgYWxpZ25tZW50ID0gbGlua01hdGNoWzJdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRpZiAoYWxpZ25tZW50ID09PSAnbGVmdCcgfHwgYWxpZ25tZW50ID09PSAnY2VudGVyJyB8fCBhbGlnbm1lbnQgPT09ICdyaWdodCcpIHtcblx0XHRcdFx0cmV0dXJuIGAhW1ske2xpbmtNYXRjaFsxXX1dXWA7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gXHU0RTVGXHU2NTJGXHU2MzAxXHU2ODA3XHU1MUM2XHU3Njg0IFtbaW1hZ2UucG5nfDMwMF1dIFx1NUJCRFx1NUVBNlx1NTNDMlx1NjU3MFx1NUY2Mlx1NUYwRlxuXHRcdGNsZWFuTWFya2Rvd24gPSBjbGVhbk1hcmtkb3duLnJlcGxhY2UoL15cXHtcXHMqXFwuKGxlZnR8Y2VudGVyfHJpZ2h0KVxccypcXH0kL2ksICcnKS50cmltKCk7XG5cblx0XHRyZXR1cm4gY2xlYW5NYXJrZG93bjtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTRFM0FcdTU2RkVcdTcyNDdNYXJrZG93blx1OEJFRFx1NkNENVx1NkRGQlx1NTJBMFx1NUJGOVx1OUY1MFx1NUM1RVx1NjAyN1xuXHQgKiBcdTY1QjBcdThCRURcdTZDRDU6ICFbW2ltYWdlLnBuZ3xjZW50ZXJdXVxuXHQgKi9cblx0c3RhdGljIGFwcGx5QWxpZ25tZW50KG1hcmtkb3duOiBzdHJpbmcsIGFsaWdubWVudDogQWxpZ25tZW50VHlwZSk6IHN0cmluZyB7XG5cdFx0Y29uc3QgY2xlYW5NYXJrZG93biA9IHRoaXMuc3RyaXBFeGlzdGluZ0FsaWdubWVudChtYXJrZG93bikudHJpbSgpO1xuXG5cdFx0Ly8gXHU1MzM5XHU5MTREIFdpa2kgXHU5NEZFXHU2M0E1XHU4QkVEXHU2Q0Q1ICFbW2ltYWdlLnBuZ11dIFx1NjIxNiBbW2ltYWdlLnBuZ11dXG5cdFx0Y29uc3Qgd2lraUxpbmtNYXRjaCA9IGNsZWFuTWFya2Rvd24ubWF0Y2goL14hP1xcW1xcWyhbXlxcXV0rKVxcXVxcXSQvKTtcblx0XHRpZiAod2lraUxpbmtNYXRjaCkge1xuXHRcdFx0Y29uc3QgaW1hZ2VQYXRoID0gd2lraUxpbmtNYXRjaFsxXTtcblx0XHRcdHJldHVybiBgIVtbJHtpbWFnZVBhdGh9fCR7YWxpZ25tZW50fV1dYDtcblx0XHR9XG5cblx0XHQvLyBcdTUzMzlcdTkxNERcdTY4MDdcdTUxQzYgTWFya2Rvd24gXHU1NkZFXHU3MjQ3XHU4QkVEXHU2Q0Q1ICFbYWx0XShpbWFnZS5wbmcpXG5cdFx0Y29uc3QgbWRJbWFnZU1hdGNoID0gY2xlYW5NYXJrZG93bi5tYXRjaCgvXiFcXFsoW15cXF1dKilcXF1cXCgoW14pXSspXFwpJC8pO1xuXHRcdGlmIChtZEltYWdlTWF0Y2gpIHtcblx0XHRcdGNvbnN0IGFsdFRleHQgPSBtZEltYWdlTWF0Y2hbMV07XG5cdFx0XHRjb25zdCBpbWFnZVBhdGggPSBtZEltYWdlTWF0Y2hbMl07XG5cdFx0XHQvLyBcdThGNkNcdTYzNjJcdTRFM0EgV2lraSBcdTk0RkVcdTYzQTVcdThCRURcdTZDRDUgKyBcdTVCRjlcdTlGNTBcdTUzQzJcdTY1NzBcblx0XHRcdHJldHVybiBgIVtbJHtpbWFnZVBhdGh9fCR7YWxpZ25tZW50fV1dYDtcblx0XHR9XG5cblx0XHQvLyBcdTU5ODJcdTY3OUNcdTRFMERcdTY2MkZcdTU2RkVcdTcyNDdcdThCRURcdTZDRDVcdUZGMENcdThGRDRcdTU2REVcdTUzOUZcdTY4Mzdcblx0XHRyZXR1cm4gbWFya2Rvd247XG5cdH1cblxuXHQvKipcblx0ICogXHU0RUNFXHU1NkZFXHU3MjQ3XHU4QkVEXHU2Q0Q1XHU0RTJEXHU2M0QwXHU1M0Q2XHU1QkY5XHU5RjUwXHU2NUI5XHU1RjBGXG5cdCAqIFx1NjUyRlx1NjMwMTogIVtbaW1hZ2UucG5nfGNlbnRlcl1dLCA9PT1jZW50ZXI9PT0gXHU1NzU3XHU4QkVEXHU2Q0Q1LCB7YWxpZ249Y2VudGVyfSBcdTk4Q0VcdTY4M0Ncblx0ICovXG5cdHN0YXRpYyBnZXRBbGlnbm1lbnQobWFya2Rvd246IHN0cmluZyk6IEFsaWdubWVudFR5cGUgfCBudWxsIHtcblx0XHQvLyBcdTUzMzlcdTkxNERcdTY1QjBcdTc2ODRcdTYyNjlcdTVDNTVcdTk0RkVcdTYzQTVcdThCRURcdTZDRDUgIVtbaW1hZ2V8Y2VudGVyXV1cblx0XHRjb25zdCBsaW5rTWF0Y2ggPSBtYXJrZG93bi5tYXRjaCgvIT9cXFtcXFsoW15cXF18XSspXFx8KFteXFxdXSspXFxdXFxdLyk7XG5cdFx0aWYgKGxpbmtNYXRjaCkge1xuXHRcdFx0Y29uc3QgYWxpZ25tZW50ID0gbGlua01hdGNoWzJdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRpZiAoYWxpZ25tZW50ID09PSAnbGVmdCcgfHwgYWxpZ25tZW50ID09PSAnY2VudGVyJyB8fCBhbGlnbm1lbnQgPT09ICdyaWdodCcpIHtcblx0XHRcdFx0cmV0dXJuIGFsaWdubWVudCBhcyBBbGlnbm1lbnRUeXBlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFx1NTMzOVx1OTE0RCA9PT1jZW50ZXI9PT0gXHU1NzU3XHU4QkVEXHU2Q0Q1XHVGRjA4XHU0RkREXHU3NTU5XHU1MTdDXHU1QkI5XHU2NUU3XHU3Njg0XHVGRjA5XG5cdFx0Y29uc3QgYmxvY2tNYXRjaCA9IG1hcmtkb3duLm1hdGNoKC9ePT09XFxzKihsZWZ0fGNlbnRlcnxyaWdodClcXHMqPT09L2kpO1xuXHRcdGlmIChibG9ja01hdGNoKSB7XG5cdFx0XHRjb25zdCBhbGlnbm1lbnQgPSBibG9ja01hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XG5cdFx0XHRpZiAoYWxpZ25tZW50ID09PSAnbGVmdCcgfHwgYWxpZ25tZW50ID09PSAnY2VudGVyJyB8fCBhbGlnbm1lbnQgPT09ICdyaWdodCcpIHtcblx0XHRcdFx0cmV0dXJuIGFsaWdubWVudCBhcyBBbGlnbm1lbnRUeXBlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFx1NTMzOVx1OTE0RCB7YWxpZ249Y2VudGVyfSBcdTYyMTYgeyBhbGlnbj1jZW50ZXIgfSBcdTk4Q0VcdTY4M0NcdUZGMDhcdTRGRERcdTc1NTlcdTUxN0NcdTVCQjlcdTY1RTdcdTc2ODRcdUZGMDlcblx0XHRjb25zdCBhbGlnbk1hdGNoID0gbWFya2Rvd24ubWF0Y2goL3tcXHMqYWxpZ25cXHMqPVxccyooXFx3KylcXHMqfS9pKTtcblx0XHRpZiAoYWxpZ25NYXRjaCkge1xuXHRcdFx0Y29uc3QgYWxpZ25tZW50ID0gYWxpZ25NYXRjaFsxXS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0aWYgKGFsaWdubWVudCA9PT0gJ2xlZnQnIHx8IGFsaWdubWVudCA9PT0gJ2NlbnRlcicgfHwgYWxpZ25tZW50ID09PSAncmlnaHQnKSB7XG5cdFx0XHRcdHJldHVybiBhbGlnbm1lbnQgYXMgQWxpZ25tZW50VHlwZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBcdTUzMzlcdTkxNEQgey5jZW50ZXJ9IFx1OThDRVx1NjgzQ1xuXHRcdGNvbnN0IGNsYXNzTWF0Y2ggPSBtYXJrZG93bi5tYXRjaCgvXFx7XFxzKlxcLihsZWZ0fGNlbnRlcnxyaWdodClcXHMqXFx9L2kpO1xuXHRcdGlmIChjbGFzc01hdGNoKSB7XG5cdFx0XHRyZXR1cm4gY2xhc3NNYXRjaFsxXS50b0xvd2VyQ2FzZSgpIGFzIEFsaWdubWVudFR5cGU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHQvKipcblx0ICogXHU3NTFGXHU2MjEwXHU1RTI2XHU1QkY5XHU5RjUwXHU2ODM3XHU1RjBGXHU3Njg0SFRNTFx1NTZGRVx1NzI0N1x1NjgwN1x1N0I3RVxuXHQgKi9cblx0c3RhdGljIHRvSFRNTChpbWFnZVBhdGg6IHN0cmluZywgYWx0VGV4dDogc3RyaW5nID0gJycsIGFsaWdubWVudDogQWxpZ25tZW50VHlwZSA9ICdjZW50ZXInKTogc3RyaW5nIHtcblx0XHRjb25zdCBzdHlsZU1hcDogUmVjb3JkPEFsaWdubWVudFR5cGUsIHN0cmluZz4gPSB7XG5cdFx0XHQnbGVmdCc6ICdkaXNwbGF5OiBibG9jazsgbWFyZ2luLWxlZnQ6IDA7IG1hcmdpbi1yaWdodDogYXV0bzsnLFxuXHRcdFx0J2NlbnRlcic6ICdkaXNwbGF5OiBibG9jazsgbWFyZ2luLWxlZnQ6IGF1dG87IG1hcmdpbi1yaWdodDogYXV0bzsnLFxuXHRcdFx0J3JpZ2h0JzogJ2Rpc3BsYXk6IGJsb2NrOyBtYXJnaW4tbGVmdDogYXV0bzsgbWFyZ2luLXJpZ2h0OiAwOydcblx0XHR9O1xuXG5cdFx0cmV0dXJuIGA8aW1nIHNyYz1cIiR7ZXNjYXBlSHRtbEF0dHIoaW1hZ2VQYXRoKX1cIiBhbHQ9XCIke2VzY2FwZUh0bWxBdHRyKGFsdFRleHQpfVwiIHN0eWxlPVwiJHtzdHlsZU1hcFthbGlnbm1lbnRdfVwiIC8+YDtcblx0fVxufVxuIiwgImltcG9ydCB7IE1hcmtkb3duUG9zdFByb2Nlc3NvckNvbnRleHQsIFRGaWxlIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IEltYWdlTWFuYWdlclBsdWdpbiBmcm9tICcuLi9tYWluJztcbmltcG9ydCB7IEFsaWdubWVudFR5cGUgfSBmcm9tICcuL2ltYWdlQWxpZ25tZW50JztcbmltcG9ydCB7IGlzU2FmZVVybCwgaXNQYXRoU2FmZSB9IGZyb20gJy4vc2VjdXJpdHknO1xuaW1wb3J0IHsgbm9ybWFsaXplVmF1bHRQYXRoIH0gZnJvbSAnLi9wYXRoJztcblxuLyoqXG4gKiBcdTU2RkVcdTcyNDdcdTVCRjlcdTlGNTAgUG9zdFByb2Nlc3NvclxuICogXHU2RTMyXHU2N0QzID09PWNlbnRlcj09PVx1MzAwMT09PWxlZnQ9PT1cdTMwMDE9PT1yaWdodD09PSBcdThCRURcdTZDRDVcbiAqIFx1NEVFNVx1NTNDQVx1NjVCMFx1NzY4NCAhW1tpbWFnZXxjZW50ZXJdXSBcdTYyNjlcdTVDNTVcdTk0RkVcdTYzQTVcdThCRURcdTZDRDVcbiAqL1xuZXhwb3J0IGNsYXNzIEFsaWdubWVudFBvc3RQcm9jZXNzb3Ige1xuXHRwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbjtcblxuXHRjb25zdHJ1Y3RvcihwbHVnaW46IEltYWdlTWFuYWdlclBsdWdpbikge1xuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NkNFOFx1NTE4QyBQb3N0UHJvY2Vzc29yXG5cdCAqL1xuXHRyZWdpc3RlcigpIHtcblx0XHR0aGlzLnBsdWdpbi5yZWdpc3Rlck1hcmtkb3duUG9zdFByb2Nlc3NvcigoZWxlbWVudCwgY29udGV4dCkgPT4ge1xuXHRcdFx0dGhpcy5wcm9jZXNzQWxpZ25tZW50KGVsZW1lbnQpO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTkwNFx1NzQwNlx1NUJGOVx1OUY1MFx1OEJFRFx1NkNENVxuXHQgKi9cblx0cHJpdmF0ZSBwcm9jZXNzQWxpZ25tZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG5cdFx0Ly8gXHU2N0U1XHU2MjdFXHU2MjQwXHU2NzA5XHU1MzA1XHU1NDJCXHU1QkY5XHU5RjUwXHU2ODA3XHU4QkIwXHU3Njg0XHU2NTg3XHU2NzJDXHU4MjgyXHU3MEI5XG5cdFx0Y29uc3Qgd2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihcblx0XHRcdGVsZW1lbnQsXG5cdFx0XHROb2RlRmlsdGVyLlNIT1dfVEVYVCxcblx0XHRcdG51bGxcblx0XHQpO1xuXG5cdFx0Y29uc3Qgbm9kZXNUb1Byb2Nlc3M6IHsgbm9kZTogVGV4dDsgcGFyZW50OiBIVE1MRWxlbWVudCB9W10gPSBbXTtcblx0XHRsZXQgbm9kZTogVGV4dCB8IG51bGw7XG5cblx0XHR3aGlsZSAobm9kZSA9IHdhbGtlci5uZXh0Tm9kZSgpIGFzIFRleHQpIHtcblx0XHRcdGNvbnN0IHRleHQgPSBub2RlLnRleHRDb250ZW50IHx8ICcnO1xuXHRcdFx0Y29uc3QgcGFyZW50RWxlbWVudCA9IG5vZGUucGFyZW50RWxlbWVudDtcblx0XHRcdGlmICghcGFyZW50RWxlbWVudCkgY29udGludWU7XG5cdFx0XHQvLyBcdTY4QzBcdTZENEJcdTY1RTdcdTc2ODQgPT09Y2VudGVyPT09IFx1OEJFRFx1NkNENSBcdTYyMTZcdTY1QjBcdTc2ODQgIVtbaW1hZ2V8Y2VudGVyXV0gXHU4QkVEXHU2Q0Q1XG5cdFx0XHRpZiAodGV4dC5pbmNsdWRlcygnPT09JykgJiYgKHRleHQuaW5jbHVkZXMoJ2NlbnRlcicpIHx8IHRleHQuaW5jbHVkZXMoJ2xlZnQnKSB8fCB0ZXh0LmluY2x1ZGVzKCdyaWdodCcpKSkge1xuXHRcdFx0XHRub2Rlc1RvUHJvY2Vzcy5wdXNoKHsgbm9kZSwgcGFyZW50OiBwYXJlbnRFbGVtZW50IH0pO1xuXHRcdFx0fSBlbHNlIGlmICh0ZXh0LmluY2x1ZGVzKCd8Y2VudGVyJykgfHwgdGV4dC5pbmNsdWRlcygnfGxlZnQnKSB8fCB0ZXh0LmluY2x1ZGVzKCd8cmlnaHQnKSkge1xuXHRcdFx0XHQvLyBcdTY1QjBcdThCRURcdTZDRDU6ICFbW2ltYWdlfGNlbnRlcl1dXG5cdFx0XHRcdG5vZGVzVG9Qcm9jZXNzLnB1c2goeyBub2RlLCBwYXJlbnQ6IHBhcmVudEVsZW1lbnQgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gXHU1OTA0XHU3NDA2XHU2MjdFXHU1MjMwXHU3Njg0XHU4MjgyXHU3MEI5XG5cdFx0Zm9yIChjb25zdCB7IG5vZGUsIHBhcmVudCB9IG9mIG5vZGVzVG9Qcm9jZXNzKSB7XG5cdFx0XHR0aGlzLnByb2Nlc3NOb2RlKG5vZGUsIHBhcmVudCk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTkwNFx1NzQwNlx1NTM1NVx1NEUyQVx1ODI4Mlx1NzBCOVxuXHQgKi9cblx0cHJpdmF0ZSBwcm9jZXNzTm9kZShub2RlOiBUZXh0LCBwYXJlbnQ6IEhUTUxFbGVtZW50KSB7XG5cdFx0Y29uc3QgdGV4dCA9IG5vZGUudGV4dENvbnRlbnQgfHwgJyc7XG5cdFx0bGV0IGxhc3RJbmRleCA9IDA7XG5cdFx0Y29uc3QgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5cblx0XHQvLyAxLiBcdTUxNDhcdTUzMzlcdTkxNERcdTY1QjBcdTc2ODRcdTYyNjlcdTVDNTVcdTk0RkVcdTYzQTVcdThCRURcdTZDRDUgIVtbaW1hZ2V8Y2VudGVyXV1cblx0XHRjb25zdCBuZXdMaW5rUmVnZXggPSAvIT9cXFtcXFsoW158XFxdXSspXFx8KGNlbnRlcnxsZWZ0fHJpZ2h0KVxcXVxcXS9naTtcblx0XHRsZXQgbWF0Y2g7XG5cblx0XHR3aGlsZSAoKG1hdGNoID0gbmV3TGlua1JlZ2V4LmV4ZWModGV4dCkpICE9PSBudWxsKSB7XG5cdFx0XHQvLyBcdTZERkJcdTUyQTBcdTUzMzlcdTkxNERcdTRFNEJcdTUyNERcdTc2ODRcdTY1ODdcdTY3MkNcblx0XHRcdGlmIChtYXRjaC5pbmRleCA+IGxhc3RJbmRleCkge1xuXHRcdFx0XHRmcmFnbWVudC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0LnN1YnN0cmluZyhsYXN0SW5kZXgsIG1hdGNoLmluZGV4KSkpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBpbWFnZVBhdGggPSBtYXRjaFsxXS50cmltKCk7XG5cdFx0XHRjb25zdCBhbGlnbm1lbnQgPSBtYXRjaFsyXS50b0xvd2VyQ2FzZSgpIGFzIEFsaWdubWVudFR5cGU7XG5cblx0XHRcdC8vIFx1NTIxQlx1NUVGQVx1NUJGOVx1OUY1MFx1NUJCOVx1NTY2OFxuXHRcdFx0Y29uc3QgYWxpZ25Db250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0XHRcdGFsaWduQ29udGFpbmVyLmNsYXNzTmFtZSA9IGBhbGlnbm1lbnQtJHthbGlnbm1lbnR9YDtcblx0XHRcdGFsaWduQ29udGFpbmVyLnN0eWxlLnRleHRBbGlnbiA9IGFsaWdubWVudDtcblx0XHRcdGFsaWduQ29udGFpbmVyLnN0eWxlLm1hcmdpbiA9ICcxMHB4IDAnO1xuXG5cdFx0XHQvLyBcdTZFMzJcdTY3RDNcdTU2RkVcdTcyNDdcblx0XHRcdHRoaXMucmVuZGVySW1hZ2VTeW5jKGAhW1ske2ltYWdlUGF0aH1dXWAsIGFsaWduQ29udGFpbmVyKTtcblxuXHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoYWxpZ25Db250YWluZXIpO1xuXHRcdFx0bGFzdEluZGV4ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG5cdFx0fVxuXG5cdFx0Ly8gMi4gXHU3MTM2XHU1NDBFXHU1MzM5XHU5MTREXHU2NUU3XHU3Njg0XHU1NzU3XHU4QkVEXHU2Q0Q1ID09PWNlbnRlcj09PSAuLi4gPT09XG5cdFx0aWYgKGxhc3RJbmRleCA9PT0gMCkge1xuXHRcdFx0Ly8gXHU1M0VBXHU2NzA5XHU1NzI4XHU2Q0ExXHU2NzA5XHU1MzM5XHU5MTREXHU1MjMwXHU2NUIwXHU4QkVEXHU2Q0Q1XHU2NUY2XHU2MjREXHU1OTA0XHU3NDA2XHU2NUU3XHU4QkVEXHU2Q0Q1XHVGRjA4XHU5MDdGXHU1MTREXHU5MUNEXHU1OTBEXHU1OTA0XHU3NDA2XHVGRjA5XG5cdFx0XHRjb25zdCBibG9ja1JlZ2V4ID0gLz09PVxccyooY2VudGVyfGxlZnR8cmlnaHQpXFxzKj09PVxccyooW1xcc1xcU10qPylcXHMqPT09L2dpO1xuXHRcdFx0bGFzdEluZGV4ID0gMDtcblxuXHRcdFx0d2hpbGUgKChtYXRjaCA9IGJsb2NrUmVnZXguZXhlYyh0ZXh0KSkgIT09IG51bGwpIHtcblx0XHRcdFx0Ly8gXHU2REZCXHU1MkEwXHU1MzM5XHU5MTREXHU0RTRCXHU1MjREXHU3Njg0XHU2NTg3XHU2NzJDXG5cdFx0XHRcdGlmIChtYXRjaC5pbmRleCA+IGxhc3RJbmRleCkge1xuXHRcdFx0XHRcdGZyYWdtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQuc3Vic3RyaW5nKGxhc3RJbmRleCwgbWF0Y2guaW5kZXgpKSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBhbGlnbm1lbnQgPSBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpIGFzIEFsaWdubWVudFR5cGU7XG5cdFx0XHRcdGNvbnN0IGNvbnRlbnQgPSBtYXRjaFsyXS50cmltKCk7XG5cblx0XHRcdFx0Ly8gXHU1MjFCXHU1RUZBXHU1QkY5XHU5RjUwXHU1QkI5XHU1NjY4XG5cdFx0XHRcdGNvbnN0IGFsaWduQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0XHRcdGFsaWduQ29udGFpbmVyLmNsYXNzTmFtZSA9IGBhbGlnbm1lbnQtJHthbGlnbm1lbnR9YDtcblx0XHRcdFx0YWxpZ25Db250YWluZXIuc3R5bGUudGV4dEFsaWduID0gYWxpZ25tZW50O1xuXHRcdFx0XHRhbGlnbkNvbnRhaW5lci5zdHlsZS5tYXJnaW4gPSAnMTBweCAwJztcblxuXHRcdFx0XHQvLyBcdTZFMzJcdTY3RDNcdTUxODVcdTVCQjkgLSBcdTU0MENcdTZCNjVcdTU5MDRcdTc0MDZcblx0XHRcdFx0dGhpcy5yZW5kZXJJbWFnZVN5bmMoY29udGVudCwgYWxpZ25Db250YWluZXIpO1xuXG5cdFx0XHRcdGZyYWdtZW50LmFwcGVuZENoaWxkKGFsaWduQ29udGFpbmVyKTtcblx0XHRcdFx0bGFzdEluZGV4ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gXHU1OTgyXHU2NzlDXHU2Q0ExXHU2NzA5XHU1MzM5XHU5MTREXHU1MjMwXHU0RUZCXHU0RjU1XHU4QkVEXHU2Q0Q1XHVGRjBDXHU0RkREXHU2MzAxXHU1MzlGXHU2ODM3XG5cdFx0aWYgKGxhc3RJbmRleCA9PT0gMCAmJiBmcmFnbWVudC5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFx1NkRGQlx1NTJBMFx1NTI2OVx1NEY1OVx1NjU4N1x1NjcyQ1xuXHRcdGlmIChsYXN0SW5kZXggPCB0ZXh0Lmxlbmd0aCkge1xuXHRcdFx0ZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dC5zdWJzdHJpbmcobGFzdEluZGV4KSkpO1xuXHRcdH1cblxuXHRcdC8vIFx1NjZGRlx1NjM2Mlx1NTM5Rlx1ODI4Mlx1NzBCOVxuXHRcdGlmIChwYXJlbnQgJiYgZnJhZ21lbnQuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRwYXJlbnQucmVwbGFjZUNoaWxkKGZyYWdtZW50LCBub2RlKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU1NDBDXHU2QjY1XHU2RTMyXHU2N0QzXHU1NkZFXHU3MjQ3XG5cdCAqL1xuXHRwcml2YXRlIHJlbmRlckltYWdlU3luYyhjb250ZW50OiBzdHJpbmcsIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcblx0XHQvLyBcdTUzMzlcdTkxNERcdTU0MDRcdTc5Q0RcdTU2RkVcdTcyNDdcdThCRURcdTZDRDVcblx0XHRjb25zdCB3aWtpTGlua1JlZ2V4ID0gL1xcW1xcWyhbXlxcXXxdK1xcLig/OnBuZ3xqcGd8anBlZ3xnaWZ8d2VicHxzdmd8Ym1wKSkoPzpcXHxbXlxcXV0rKT9cXF1cXF0vZ2k7XG5cdFx0Y29uc3QgbWFya2Rvd25JbWFnZVJlZ2V4ID0gLyFcXFsoW15cXF1dKilcXF1cXCgoW14pXSspXFwpL2c7XG5cblx0XHRsZXQgbWF0Y2g7XG5cdFx0Y29uc3QgaW1hZ2VzOiB7IHNyYzogc3RyaW5nOyBhbHQ6IHN0cmluZyB9W10gPSBbXTtcblxuXHRcdC8vIFx1NTMzOVx1OTE0RCBbW3dpa2lcdTU2RkVcdTcyNDddXVxuXHRcdHdoaWxlICgobWF0Y2ggPSB3aWtpTGlua1JlZ2V4LmV4ZWMoY29udGVudCkpICE9PSBudWxsKSB7XG5cdFx0XHRjb25zdCBmaWxlTmFtZSA9IG1hdGNoWzFdO1xuXHRcdFx0aW1hZ2VzLnB1c2goeyBzcmM6IGZpbGVOYW1lLCBhbHQ6IGZpbGVOYW1lIH0pO1xuXHRcdH1cblxuXHRcdC8vIFx1NTMzOVx1OTE0RCAhW2FsdF0odXJsKVxuXHRcdHdoaWxlICgobWF0Y2ggPSBtYXJrZG93bkltYWdlUmVnZXguZXhlYyhjb250ZW50KSkgIT09IG51bGwpIHtcblx0XHRcdGltYWdlcy5wdXNoKHsgYWx0OiBtYXRjaFsxXSwgc3JjOiBtYXRjaFsyXSB9KTtcblx0XHR9XG5cblx0XHQvLyBcdTZFMzJcdTY3RDNcdTU2RkVcdTcyNDdcblx0XHRmb3IgKGNvbnN0IGltZyBvZiBpbWFnZXMpIHtcblx0XHRcdGlmICghaXNTYWZlVXJsKGltZy5zcmMpKSBjb250aW51ZTtcblxuXHRcdFx0Y29uc3QgaW1nRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcblx0XHRcdGltZ0VsLmFsdCA9IGltZy5hbHQ7XG5cblx0XHRcdGlmICghaW1nLnNyYy5zdGFydHNXaXRoKCdodHRwJykpIHtcblx0XHRcdFx0Y29uc3Qgbm9ybWFsaXplZFNyYyA9IG5vcm1hbGl6ZVZhdWx0UGF0aChpbWcuc3JjKTtcblx0XHRcdFx0aWYgKCFpc1BhdGhTYWZlKG5vcm1hbGl6ZWRTcmMpKSBjb250aW51ZTtcblx0XHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm9ybWFsaXplZFNyYyk7XG5cdFx0XHRcdGlmIChmaWxlICYmIGZpbGUgaW5zdGFuY2VvZiBURmlsZSkge1xuXHRcdFx0XHRcdGltZ0VsLnNyYyA9IHRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRSZXNvdXJjZVBhdGgoZmlsZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc3QgYXR0YWNobWVudHNQYXRoID0gdGhpcy5maW5kRmlsZUluVmF1bHQobm9ybWFsaXplZFNyYyk7XG5cdFx0XHRcdFx0aWYgKGF0dGFjaG1lbnRzUGF0aCkge1xuXHRcdFx0XHRcdFx0aW1nRWwuc3JjID0gYXR0YWNobWVudHNQYXRoO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGltZ0VsLnNyYyA9IGltZy5zcmM7XG5cdFx0XHR9XG5cblx0XHRcdGltZ0VsLnN0eWxlLm1heFdpZHRoID0gJzEwMCUnO1xuXHRcdFx0aW1nRWwuc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nO1xuXHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKGltZ0VsKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU1NzI4IFZhdWx0IFx1NEUyRFx1NjdFNVx1NjI3RVx1NjU4N1x1NEVGNlxuXHQgKi9cblx0cHJpdmF0ZSBmaW5kRmlsZUluVmF1bHQoZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuXHRcdGNvbnN0IG5vcm1hbGl6ZWRGaWxlTmFtZSA9IG5vcm1hbGl6ZVZhdWx0UGF0aChmaWxlTmFtZSk7XG5cdFx0Y29uc3QgZmlsZXMgPSB0aGlzLnBsdWdpbi5hcHAudmF1bHQuZ2V0RmlsZXMoKTtcblx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgZmlsZXMpIHtcblx0XHRcdGlmIChmaWxlLm5hbWUgPT09IG5vcm1hbGl6ZWRGaWxlTmFtZSB8fCBmaWxlLnBhdGguZW5kc1dpdGgobm9ybWFsaXplZEZpbGVOYW1lKSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5wbHVnaW4uYXBwLnZhdWx0LmdldFJlc291cmNlUGF0aChmaWxlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cbn1cbiIsICIvKipcbiAqIFx1NTZGRFx1OTY0NVx1NTMxNlx1NjUyRlx1NjMwMVx1NkEyMVx1NTc1N1xuICogXHU2NTJGXHU2MzAxXHU0RTJEXHU2NTg3XHU1NDhDXHU4MkYxXHU2NTg3XG4gKi9cblxuZXhwb3J0IHR5cGUgTGFuZ3VhZ2UgPSAnemgnIHwgJ2VuJztcblxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2xhdGlvbnMge1xuXHQvLyBcdTkwMUFcdTc1Mjhcblx0b2s6IHN0cmluZztcblx0Y2FuY2VsOiBzdHJpbmc7XG5cdGRlbGV0ZTogc3RyaW5nO1xuXHRyZXN0b3JlOiBzdHJpbmc7XG5cdGNvbmZpcm06IHN0cmluZztcblx0c3VjY2Vzczogc3RyaW5nO1xuXHRlcnJvcjogc3RyaW5nO1xuXG5cdC8vIFx1ODlDNlx1NTZGRVx1NTQwRFx1NzlGMFxuXHRtZWRpYUxpYnJhcnk6IHN0cmluZztcblx0dW5yZWZlcmVuY2VkTWVkaWE6IHN0cmluZztcblx0dHJhc2hNYW5hZ2VtZW50OiBzdHJpbmc7XG5cblx0Ly8gXHU1QTkyXHU0RjUzXHU1RTkzXG5cdHRvdGFsTWVkaWFGaWxlczogc3RyaW5nO1xuXHRub01lZGlhRmlsZXM6IHN0cmluZztcblx0YWxsTWVkaWFUeXBlc0Rpc2FibGVkOiBzdHJpbmc7XG5cdHNlYXJjaFBsYWNlaG9sZGVyOiBzdHJpbmc7XG5cdHNlYXJjaFJlc3VsdHM6IHN0cmluZztcblxuXHQvLyBcdTY3MkFcdTVGMTVcdTc1MjhcdTVBOTJcdTRGNTNcblx0dW5yZWZlcmVuY2VkRm91bmQ6IHN0cmluZztcblx0YWxsTWVkaWFSZWZlcmVuY2VkOiBzdHJpbmc7XG5cdGRlbGV0ZVRvVHJhc2g6IHN0cmluZztcblxuXHQvLyBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5Mzlcblx0dHJhc2hFbXB0eTogc3RyaW5nO1xuXHRvcmlnaW5hbFBhdGg6IHN0cmluZztcblx0ZGVsZXRlZEF0OiBzdHJpbmc7XG5cdGNvbmZpcm1DbGVhckFsbDogc3RyaW5nO1xuXG5cdC8vIFx1NjRDRFx1NEY1Q1xuXHRvcGVuSW5Ob3Rlczogc3RyaW5nO1xuXHRjb3B5UGF0aDogc3RyaW5nO1xuXHRjb3B5TGluazogc3RyaW5nO1xuXHRvcGVuT3JpZ2luYWw6IHN0cmluZztcblx0cHJldmlldzogc3RyaW5nO1xuXG5cdC8vIFx1NUZFQlx1NjM3N1x1OTUyRVxuXHRzaG9ydGN1dHM6IHN0cmluZztcblx0b3BlbkxpYnJhcnk6IHN0cmluZztcblx0ZmluZFVucmVmZXJlbmNlZDogc3RyaW5nO1xuXHRvcGVuVHJhc2g6IHN0cmluZztcblxuXHQvLyBcdTYyNkJcdTYzQ0ZcdThGREJcdTVFQTZcblx0c2Nhbm5pbmdSZWZlcmVuY2VzOiBzdHJpbmc7XG5cdHNjYW5Db21wbGV0ZTogc3RyaW5nO1xuXHRmaWxlc1NjYW5uZWQ6IHN0cmluZztcblxuXHQvLyBcdTYyNzlcdTkxQ0ZcdTY0Q0RcdTRGNUNcblx0YmF0Y2hEZWxldGVDb21wbGV0ZTogc3RyaW5nO1xuXHRiYXRjaERlbGV0ZVByb2dyZXNzOiBzdHJpbmc7XG5cdGJhdGNoUmVzdG9yZUNvbXBsZXRlOiBzdHJpbmc7XG5cblx0Ly8gXHU4QkJFXHU3RjZFXHU5ODc1XHU5NzYyXG5cdHBsdWdpblNldHRpbmdzOiBzdHJpbmc7XG5cdG1lZGlhRm9sZGVyOiBzdHJpbmc7XG5cdG1lZGlhRm9sZGVyRGVzYzogc3RyaW5nO1xuXHR0aHVtYm5haWxTaXplOiBzdHJpbmc7XG5cdHRodW1ibmFpbFNpemVEZXNjOiBzdHJpbmc7XG5cdHRodW1ibmFpbFNtYWxsOiBzdHJpbmc7XG5cdHRodW1ibmFpbE1lZGl1bTogc3RyaW5nO1xuXHR0aHVtYm5haWxMYXJnZTogc3RyaW5nO1xuXHRkZWZhdWx0U29ydEJ5OiBzdHJpbmc7XG5cdHNvcnRCeURlc2M6IHN0cmluZztcblx0c29ydEJ5TmFtZTogc3RyaW5nO1xuXHRzb3J0QnlEYXRlOiBzdHJpbmc7XG5cdHNvcnRCeVNpemU6IHN0cmluZztcblx0c29ydE9yZGVyOiBzdHJpbmc7XG5cdHNvcnRPcmRlckRlc2M6IHN0cmluZztcblx0c29ydEFzYzogc3RyaW5nO1xuXHRzb3J0RGVzYzogc3RyaW5nO1xuXHRzaG93SW1hZ2VJbmZvOiBzdHJpbmc7XG5cdHNob3dJbWFnZUluZm9EZXNjOiBzdHJpbmc7XG5cdGF1dG9SZWZyZXNoOiBzdHJpbmc7XG5cdGF1dG9SZWZyZXNoRGVzYzogc3RyaW5nO1xuXHRkZWZhdWx0QWxpZ25tZW50OiBzdHJpbmc7XG5cdGFsaWdubWVudERlc2M6IHN0cmluZztcblx0YWxpZ25MZWZ0OiBzdHJpbmc7XG5cdGFsaWduQ2VudGVyOiBzdHJpbmc7XG5cdGFsaWduUmlnaHQ6IHN0cmluZztcblx0c2FmZURlbGV0ZVNldHRpbmdzOiBzdHJpbmc7XG5cdHVzZVRyYXNoRm9sZGVyOiBzdHJpbmc7XG5cdHVzZVRyYXNoRm9sZGVyRGVzYzogc3RyaW5nO1xuXHR0cmFzaEZvbGRlclBhdGg6IHN0cmluZztcblx0dHJhc2hGb2xkZXJQYXRoRGVzYzogc3RyaW5nO1xuXHRhdXRvQ2xlYW51cFRyYXNoOiBzdHJpbmc7XG5cdGF1dG9DbGVhbnVwVHJhc2hEZXNjOiBzdHJpbmc7XG5cdGF1dG9DbGVhbnVwQ29tcGxldGU6IHN0cmluZztcblx0Y2xlYW51cERheXM6IHN0cmluZztcblx0Y2xlYW51cERheXNEZXNjOiBzdHJpbmc7XG5cdG1lZGlhVHlwZXM6IHN0cmluZztcblx0ZW5hYmxlSW1hZ2VTdXBwb3J0OiBzdHJpbmc7XG5cdGVuYWJsZUltYWdlU3VwcG9ydERlc2M6IHN0cmluZztcblx0ZW5hYmxlVmlkZW9TdXBwb3J0OiBzdHJpbmc7XG5cdGVuYWJsZVZpZGVvU3VwcG9ydERlc2M6IHN0cmluZztcblx0ZW5hYmxlQXVkaW9TdXBwb3J0OiBzdHJpbmc7XG5cdGVuYWJsZUF1ZGlvU3VwcG9ydERlc2M6IHN0cmluZztcblx0ZW5hYmxlUERGU3VwcG9ydDogc3RyaW5nO1xuXHRlbmFibGVQREZTdXBwb3J0RGVzYzogc3RyaW5nO1xuXHR2aWV3U2V0dGluZ3M6IHN0cmluZztcblx0aW50ZXJmYWNlTGFuZ3VhZ2U6IHN0cmluZztcblx0bGFuZ3VhZ2VEZXNjOiBzdHJpbmc7XG5cdGxhbmd1YWdlU3lzdGVtOiBzdHJpbmc7XG5cdHBhZ2VTaXplOiBzdHJpbmc7XG5cdHBhZ2VTaXplRGVzYzogc3RyaW5nO1xuXHRcdGVuYWJsZVByZXZpZXdNb2RhbDogc3RyaW5nO1xuXHRcdGVuYWJsZVByZXZpZXdNb2RhbERlc2M6IHN0cmluZztcblx0XHRlbmFibGVLZXlib2FyZE5hdjogc3RyaW5nO1xuXHRcdGVuYWJsZUtleWJvYXJkTmF2RGVzYzogc3RyaW5nO1xuXHRcdHNhZmVTY2FuU2V0dGluZ3M6IHN0cmluZztcblx0XHRzYWZlU2NhbkVuYWJsZWREZXNjOiBzdHJpbmc7XG5cdFx0c2FmZVNjYW5VbnJlZkRheXM6IHN0cmluZztcblx0XHRzYWZlU2NhblVucmVmRGF5c0Rlc2M6IHN0cmluZztcblx0XHRzYWZlU2Nhbk1pblNpemU6IHN0cmluZztcblx0XHRzYWZlU2Nhbk1pblNpemVEZXNjOiBzdHJpbmc7XG5cdFx0ZHVwbGljYXRlRGV0ZWN0aW9uU2V0dGluZ3M6IHN0cmluZztcblx0XHRkdXBsaWNhdGVUaHJlc2hvbGRTZXR0aW5nOiBzdHJpbmc7XG5cdFx0ZHVwbGljYXRlVGhyZXNob2xkRGVzYzogc3RyaW5nO1xuXHRcdGtleWJvYXJkU2hvcnRjdXRzOiBzdHJpbmc7XG5cdFx0c2hvcnRjdXRzRGVzYzogc3RyaW5nO1xuXHRcdHNob3J0Y3V0T3BlbkxpYnJhcnk6IHN0cmluZztcblx0c2hvcnRjdXRGaW5kVW5yZWZlcmVuY2VkOiBzdHJpbmc7XG5cdHNob3J0Y3V0T3BlblRyYXNoOiBzdHJpbmc7XG5cdGNvbW1hbmRzOiBzdHJpbmc7XG5cdGNvbW1hbmRzRGVzYzogc3RyaW5nO1xuXHRjbWRPcGVuTGlicmFyeTogc3RyaW5nO1xuXHRjbWRGaW5kVW5yZWZlcmVuY2VkOiBzdHJpbmc7XG5cdGNtZFRyYXNoTWFuYWdlbWVudDogc3RyaW5nO1xuXHRjbWRBbGlnbkxlZnQ6IHN0cmluZztcblx0Y21kQWxpZ25DZW50ZXI6IHN0cmluZztcblx0Y21kQWxpZ25SaWdodDogc3RyaW5nO1xuXG5cdC8vIFRyYXNoIE1hbmFnZW1lbnQgVmlld1xuXHRsb2FkaW5nVHJhc2hGaWxlczogc3RyaW5nO1xuXHR0cmFzaEZvbGRlckVtcHR5OiBzdHJpbmc7XG5cdGZpbGVzSW5UcmFzaDogc3RyaW5nO1xuXHR0b3RhbFNpemU6IHN0cmluZztcblx0dHJhc2hNYW5hZ2VtZW50RGVzYzogc3RyaW5nO1xuXHRyZWZyZXNoOiBzdHJpbmc7XG5cdGNsZWFyVHJhc2g6IHN0cmluZztcblx0Y2xlYXJUcmFzaFRvb2x0aXA6IHN0cmluZztcblx0cmVzdG9yZVRvb2x0aXA6IHN0cmluZztcblx0cGVybWFuZW50RGVsZXRlOiBzdHJpbmc7XG5cdHBlcm1hbmVudERlbGV0ZVRvb2x0aXA6IHN0cmluZztcblx0ZGVsZXRlZFRpbWU6IHN0cmluZztcblx0Y29uZmlybURlbGV0ZUZpbGU6IHN0cmluZztcblx0Y29uZmlybUNsZWFyVHJhc2g6IHN0cmluZztcblx0ZmlsZURlbGV0ZWQ6IHN0cmluZztcblx0cmVzdG9yZVN1Y2Nlc3M6IHN0cmluZztcblx0cmVzdG9yZUZhaWxlZDogc3RyaW5nO1xuXHR0YXJnZXRGaWxlRXhpc3RzOiBzdHJpbmc7XG5cdGRlbGV0ZUZhaWxlZDogc3RyaW5nO1xuXHRmaWxlTmFtZUNvcGllZDogc3RyaW5nO1xuXHRvcmlnaW5hbFBhdGhDb3BpZWQ6IHN0cmluZztcblxuXHQvLyBcdTY3MkFcdTVGMTVcdTc1MjhcdTU2RkVcdTcyNDdcdTg5QzZcdTU2RkVcblx0c2Nhbm5pbmdVbnJlZmVyZW5jZWQ6IHN0cmluZztcblx0dG90YWxTaXplTGFiZWw6IHN0cmluZztcblx0c2NhbkVycm9yOiBzdHJpbmc7XG5cdHVucmVmZXJlbmNlZERlc2M6IHN0cmluZztcblx0bm9GaWxlc1RvRGVsZXRlOiBzdHJpbmc7XG5cdHByb2Nlc3NlZEZpbGVzOiBzdHJpbmc7XG5cdHByb2Nlc3NlZEZpbGVzRXJyb3I6IHN0cmluZztcblx0Y29weUFsbFBhdGhzOiBzdHJpbmc7XG5cdGNvcGllZEZpbGVQYXRoczogc3RyaW5nO1xuXG5cdC8vIFx1NTZGRVx1NzI0N1x1NUU5M1x1ODlDNlx1NTZGRVxuXHRub01hdGNoaW5nRmlsZXM6IHN0cmluZztcblx0cHJldlBhZ2U6IHN0cmluZztcblx0bmV4dFBhZ2U6IHN0cmluZztcblx0cGFnZUluZm86IHN0cmluZztcblx0c2VsZWN0RmlsZXM6IHN0cmluZztcblx0c2VsZWN0QWxsOiBzdHJpbmc7XG5cdGRlc2VsZWN0QWxsOiBzdHJpbmc7XG5cdGNvbmZpcm1EZWxldGVTZWxlY3RlZDogc3RyaW5nO1xuXHRkZWxldGVkRmlsZXM6IHN0cmluZztcblx0ZGVsZXRlRmlsZXNGYWlsZWQ6IHN0cmluZztcblx0bXVsdGlTZWxlY3RNb2RlOiBzdHJpbmc7XG5cblx0Ly8gXHU1QTkyXHU0RjUzXHU5ODg0XHU4OUM4XG5cdHVuc3VwcG9ydGVkRmlsZVR5cGU6IHN0cmluZztcblx0ZG9jdW1lbnRFbWJlZFByZXZpZXdVbnN1cHBvcnRlZDogc3RyaW5nO1xuXHRjb3B5UGF0aEJ0bjogc3RyaW5nO1xuXHRjb3B5TGlua0J0bjogc3RyaW5nO1xuXHRmaW5kSW5Ob3Rlczogc3RyaW5nO1xuXHRwYXRoQ29waWVkOiBzdHJpbmc7XG5cdGxpbmtDb3BpZWQ6IHN0cmluZztcblx0aW1hZ2VMb2FkRXJyb3I6IHN0cmluZztcblxuXHQvLyBcdTU2RkVcdTcyNDdcdTVCRjlcdTlGNTBcblx0YWxpZ25JbWFnZUxlZnQ6IHN0cmluZztcblx0YWxpZ25JbWFnZUNlbnRlcjogc3RyaW5nO1xuXHRhbGlnbkltYWdlUmlnaHQ6IHN0cmluZztcblx0c2VsZWN0SW1hZ2VGaXJzdDogc3RyaW5nO1xuXHRzZWxlY3RJbWFnZTogc3RyaW5nO1xuXHRpbWFnZUFsaWduZWRMZWZ0OiBzdHJpbmc7XG5cdGltYWdlQWxpZ25lZENlbnRlcjogc3RyaW5nO1xuXHRpbWFnZUFsaWduZWRSaWdodDogc3RyaW5nO1xuXG5cdC8vIFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NjRDRFx1NEY1Q1xuXHRjb3BpZWRGaWxlTmFtZTogc3RyaW5nO1xuXHRjb3BpZWRPcmlnaW5hbFBhdGg6IHN0cmluZztcblx0bm90UmVmZXJlbmNlZDogc3RyaW5nO1xuXHRtb3ZlZFRvVHJhc2g6IHN0cmluZztcblx0ZGVsZXRlZEZpbGU6IHN0cmluZztcblx0cmVzdG9yZWRGaWxlOiBzdHJpbmc7XG5cblx0Ly8gXHU1NDdEXHU0RUU0XHU1NDBEXHU3OUYwXG5cdGNtZEltYWdlTGlicmFyeTogc3RyaW5nO1xuXHRjbWRGaW5kVW5yZWZlcmVuY2VkSW1hZ2VzOiBzdHJpbmc7XG5cdGNtZFJlZnJlc2hDYWNoZTogc3RyaW5nO1xuXHRjbWRBbGlnbkltYWdlTGVmdDogc3RyaW5nO1xuXHRjbWRBbGlnbkltYWdlQ2VudGVyOiBzdHJpbmc7XG5cdGNtZEFsaWduSW1hZ2VSaWdodDogc3RyaW5nO1xuXHRjbWRPcGVuTWVkaWFMaWJyYXJ5OiBzdHJpbmc7XG5cdGNtZEZpbmRVbnJlZmVyZW5jZWRNZWRpYTogc3RyaW5nO1xuXHRjbWRPcGVuVHJhc2hNYW5hZ2VtZW50OiBzdHJpbmc7XG5cblx0Ly8gXHU1MjIwXHU5NjY0XHU2NENEXHU0RjVDXG5cdGRlbGV0ZUZhaWxlZFdpdGhOYW1lOiBzdHJpbmc7XG5cdGRlbGV0ZWRXaXRoUXVhcmFudGluZUZhaWxlZDogc3RyaW5nO1xuXHRvcGVyYXRpb25GYWlsZWQ6IHN0cmluZztcblx0cHJvY2Vzc2luZzogc3RyaW5nO1xuXG5cdC8vIHYyLjAgXHU2NUIwXHU1ODlFXG5cdGR1cGxpY2F0ZURldGVjdGlvbjogc3RyaW5nO1xuXHRkdXBsaWNhdGVEZXRlY3Rpb25EZXNjOiBzdHJpbmc7XG5cdG5vRHVwbGljYXRlc0ZvdW5kOiBzdHJpbmc7XG5cdHN0YXJ0U2Nhbjogc3RyaW5nO1xuXHRzY2FuUHJvZ3Jlc3M6IHN0cmluZztcblx0c2ltaWxhcml0eVRocmVzaG9sZDogc3RyaW5nO1xuXHRkdXBsaWNhdGVHcm91cHNGb3VuZDogc3RyaW5nO1xuXHRkdXBsaWNhdGVHcm91cDogc3RyaW5nO1xuXHRmaWxlczogc3RyaW5nO1xuXHRzdWdnZXN0S2VlcDogc3RyaW5nO1xuXHRxdWFyYW50aW5lOiBzdHJpbmc7XG5cdHF1YXJhbnRpbmVBbGxEdXBsaWNhdGVzOiBzdHJpbmc7XG5cdGR1cGxpY2F0ZXNGb3VuZDogc3RyaW5nO1xuXHRkdXBsaWNhdGVzUXVhcmFudGluZWQ6IHN0cmluZztcblx0dHlwZURpc3RyaWJ1dGlvbjogc3RyaW5nO1xuXHR1bnJlZmVyZW5jZWRSYXRlOiBzdHJpbmc7XG5cdHJlZmVyZW5jZWRCeTogc3RyaW5nO1xuXHRzZWxlY3RlZENvdW50OiBzdHJpbmc7XG5cdGJhdGNoUmVzdG9yZTogc3RyaW5nO1xuXHRiYXRjaERlbGV0ZTogc3RyaW5nO1xuXHRub0l0ZW1zU2VsZWN0ZWQ6IHN0cmluZztcblx0Y29uZmlybUJhdGNoUmVzdG9yZTogc3RyaW5nO1xuXHRiYXRjaFJlc3RvcmVDb21wbGV0ZWQ6IHN0cmluZztcblx0c2FmZVNjYW46IHN0cmluZztcblx0c2FmZVNjYW5EZXNjOiBzdHJpbmc7XG5cdHNhZmVTY2FuU3RhcnRlZDogc3RyaW5nO1xuXHRzYWZlU2Nhbk5vUmVzdWx0czogc3RyaW5nO1xuXHRzYWZlU2NhbkNvbmZpcm06IHN0cmluZztcblx0c2FmZVNjYW5Db21wbGV0ZTogc3RyaW5nO1xuXHRzYWZlU2NhbkZhaWxlZDogc3RyaW5nO1xuXHRjbWREdXBsaWNhdGVEZXRlY3Rpb246IHN0cmluZztcblx0b3JnYW5pemluZzogc3RyaW5nO1xuXHRvcmdhbml6ZUNvbXBsZXRlOiBzdHJpbmc7XG59XG5cbmNvbnN0IHpoOiBUcmFuc2xhdGlvbnMgPSB7XG5cdC8vIFx1OTAxQVx1NzUyOFxuXHRvazogJ1x1Nzg2RVx1NUI5QScsXG5cdGNhbmNlbDogJ1x1NTNENlx1NkQ4OCcsXG5cdGRlbGV0ZTogJ1x1NTIyMFx1OTY2NCcsXG5cdHJlc3RvcmU6ICdcdTYwNjJcdTU5MEQnLFxuXHRjb25maXJtOiAnXHU3ODZFXHU4QkE0Jyxcblx0c3VjY2VzczogJ1x1NjIxMFx1NTI5RicsXG5cdGVycm9yOiAnXHU5NTE5XHU4QkVGJyxcblxuXHQvLyBcdTg5QzZcdTU2RkVcdTU0MERcdTc5RjBcblx0bWVkaWFMaWJyYXJ5OiAnXHU1QTkyXHU0RjUzXHU1RTkzJyxcblx0dW5yZWZlcmVuY2VkTWVkaWE6ICdcdTY3MkFcdTVGMTVcdTc1MjhcdTVBOTJcdTRGNTMnLFxuXHR0cmFzaE1hbmFnZW1lbnQ6ICdcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTdCQTFcdTc0MDYnLFxuXG5cdC8vIFx1NUE5Mlx1NEY1M1x1NUU5M1xuXHR0b3RhbE1lZGlhRmlsZXM6ICdcdTUxNzEge2NvdW50fSBcdTRFMkFcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjYnLFxuXHRub01lZGlhRmlsZXM6ICdcdTY3MkFcdTYyN0VcdTUyMzBcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjYnLFxuXHRhbGxNZWRpYVR5cGVzRGlzYWJsZWQ6ICdcdTYyNDBcdTY3MDlcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEJcdTVERjJcdTg4QUJcdTc5ODFcdTc1MjhcdUZGMENcdThCRjdcdTUyMzBcdThCQkVcdTdGNkVcdTRFMkRcdTU0MkZcdTc1MjhcdTgxRjNcdTVDMTFcdTRFMDBcdTc5Q0RcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEInLFxuXHRzZWFyY2hQbGFjZWhvbGRlcjogJ1x1NjQxQ1x1N0QyMlx1NjU4N1x1NEVGNlx1NTQwRC4uLicsXG5cdHNlYXJjaFJlc3VsdHM6ICdcdTYyN0VcdTUyMzAge2NvdW50fSBcdTRFMkFcdTdFRDNcdTY3OUMnLFxuXG5cdC8vIFx1NjcyQVx1NUYxNVx1NzUyOFx1NUE5Mlx1NEY1M1xuXHR1bnJlZmVyZW5jZWRGb3VuZDogJ1x1NjI3RVx1NTIzMCB7Y291bnR9IFx1NEUyQVx1NjcyQVx1NUYxNVx1NzUyOFx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNicsXG5cdGFsbE1lZGlhUmVmZXJlbmNlZDogJ1x1NTkyQVx1NjhEMlx1NEU4Nlx1RkYwMVx1NjI0MFx1NjcwOVx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1OTBGRFx1NURGMlx1ODhBQlx1NUYxNVx1NzUyOCcsXG5cdGRlbGV0ZVRvVHJhc2g6ICdcdTY1ODdcdTRFRjZcdTVDMDZcdTg4QUJcdTc5RkJcdTUxNjVcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzknLFxuXG5cdC8vIFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVxuXHR0cmFzaEVtcHR5OiAnXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU0RTNBXHU3QTdBJyxcblx0b3JpZ2luYWxQYXRoOiAnXHU1MzlGXHU1OUNCXHU0RjREXHU3RjZFJyxcblx0ZGVsZXRlZEF0OiAnXHU1MjIwXHU5NjY0XHU2NUY2XHU5NUY0Jyxcblx0Y29uZmlybUNsZWFyQWxsOiAnXHU3ODZFXHU1QjlBXHU4OTgxXHU2RTA1XHU3QTdBXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHU1NDE3XHVGRjFGJyxcblxuXHQvLyBcdTY0Q0RcdTRGNUNcblx0b3BlbkluTm90ZXM6ICdcdTU3MjhcdTdCMTRcdThCQjBcdTRFMkRcdTY3RTVcdTYyN0UnLFxuXHRjb3B5UGF0aDogJ1x1NTkwRFx1NTIzNlx1NjU4N1x1NEVGNlx1OERFRlx1NUY4NCcsXG5cdGNvcHlMaW5rOiAnXHU1OTBEXHU1MjM2TWFya2Rvd25cdTk0RkVcdTYzQTUnLFxuXHRvcGVuT3JpZ2luYWw6ICdcdTYyNTNcdTVGMDBcdTUzOUZcdTY1ODdcdTRFRjYnLFxuXHRwcmV2aWV3OiAnXHU5ODg0XHU4OUM4JyxcblxuXHQvLyBcdTVGRUJcdTYzNzdcdTk1MkVcblx0c2hvcnRjdXRzOiAnXHU1RkVCXHU2Mzc3XHU5NTJFJyxcblx0b3BlbkxpYnJhcnk6ICdcdTYyNTNcdTVGMDBcdTVBOTJcdTRGNTNcdTVFOTMnLFxuXHRmaW5kVW5yZWZlcmVuY2VkOiAnXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU1QTkyXHU0RjUzJyxcblx0b3BlblRyYXNoOiAnXHU2MjUzXHU1RjAwXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU3QkExXHU3NDA2JyxcblxuXHQvLyBcdTYyNkJcdTYzQ0ZcdThGREJcdTVFQTZcblx0c2Nhbm5pbmdSZWZlcmVuY2VzOiAnXHU2QjYzXHU1NzI4XHU2MjZCXHU2M0NGXHU1RjE1XHU3NTI4Jyxcblx0c2NhbkNvbXBsZXRlOiAnXHU2MjZCXHU2M0NGXHU1QjhDXHU2MjEwJyxcblx0ZmlsZXNTY2FubmVkOiAnXHU0RTJBXHU2NTg3XHU0RUY2XHU1REYyXHU2MjZCXHU2M0NGJyxcblxuXHQvLyBcdTYyNzlcdTkxQ0ZcdTY0Q0RcdTRGNUNcblx0YmF0Y2hEZWxldGVDb21wbGV0ZTogJ1x1NURGMlx1NTIyMFx1OTY2NCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdGJhdGNoRGVsZXRlUHJvZ3Jlc3M6ICdcdTZCNjNcdTU3MjhcdTUyMjBcdTk2NjQge2N1cnJlbnR9L3t0b3RhbH0nLFxuXHRiYXRjaFJlc3RvcmVDb21wbGV0ZTogJ1x1NURGMlx1NjA2Mlx1NTkwRCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cblx0Ly8gXHU4QkJFXHU3RjZFXHU5ODc1XHU5NzYyXG5cdHBsdWdpblNldHRpbmdzOiAnXHU1QTkyXHU0RjUzXHU1REU1XHU1MTc3XHU3QkIxXHU2M0QyXHU0RUY2XHU4QkJFXHU3RjZFJyxcblx0bWVkaWFGb2xkZXI6ICdcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTU5MzknLFxuXHRtZWRpYUZvbGRlckRlc2M6ICdcdTYzMDdcdTVCOUFcdTg5ODFcdTYyNkJcdTYzQ0ZcdTc2ODRcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTU5MzlcdThERUZcdTVGODRcdUZGMDhcdTc1NTlcdTdBN0FcdTUyMTlcdTYyNkJcdTYzQ0ZcdTY1NzRcdTRFMkFcdTVFOTNcdUZGMDknLFxuXHR0aHVtYm5haWxTaXplOiAnXHU3RjI5XHU3NTY1XHU1NkZFXHU1OTI3XHU1QzBGJyxcblx0dGh1bWJuYWlsU2l6ZURlc2M6ICdcdTkwMDlcdTYyRTlcdTVBOTJcdTRGNTNcdTVFOTNcdTg5QzZcdTU2RkVcdTRFMkRcdTdGMjlcdTc1NjVcdTU2RkVcdTc2ODRcdTY2M0VcdTc5M0FcdTU5MjdcdTVDMEYnLFxuXHR0aHVtYm5haWxTbWFsbDogJ1x1NUMwRiAoMTAwcHgpJyxcblx0dGh1bWJuYWlsTWVkaXVtOiAnXHU0RTJEICgxNTBweCknLFxuXHR0aHVtYm5haWxMYXJnZTogJ1x1NTkyNyAoMjAwcHgpJyxcblx0ZGVmYXVsdFNvcnRCeTogJ1x1OUVEOFx1OEJBNFx1NjM5Mlx1NUU4Rlx1NjVCOVx1NUYwRicsXG5cdHNvcnRCeURlc2M6ICdcdTkwMDlcdTYyRTlcdTU2RkVcdTcyNDdcdTc2ODRcdTlFRDhcdThCQTRcdTYzOTJcdTVFOEZcdTY1QjlcdTVGMEYnLFxuXHRzb3J0QnlOYW1lOiAnXHU2MzA5XHU1NDBEXHU3OUYwJyxcblx0c29ydEJ5RGF0ZTogJ1x1NjMwOVx1NEZFRVx1NjUzOVx1NjVFNVx1NjcxRicsXG5cdHNvcnRCeVNpemU6ICdcdTYzMDlcdTY1ODdcdTRFRjZcdTU5MjdcdTVDMEYnLFxuXHRzb3J0T3JkZXI6ICdcdTYzOTJcdTVFOEZcdTk4N0FcdTVFOEYnLFxuXHRzb3J0T3JkZXJEZXNjOiAnXHU5MDA5XHU2MkU5XHU1MzQ3XHU1RThGXHU2MjE2XHU5NjREXHU1RThGJyxcblx0c29ydEFzYzogJ1x1NTM0N1x1NUU4RicsXG5cdHNvcnREZXNjOiAnXHU5NjREXHU1RThGJyxcblx0c2hvd0ltYWdlSW5mbzogJ1x1NjYzRVx1NzkzQVx1NTZGRVx1NzI0N1x1NEZFMVx1NjA2RicsXG5cdHNob3dJbWFnZUluZm9EZXNjOiAnXHU1NzI4XHU1NkZFXHU3MjQ3XHU3RjI5XHU3NTY1XHU1NkZFXHU0RTBCXHU2NUI5XHU2NjNFXHU3OTNBXHU2NTg3XHU0RUY2XHU1NDBEXHU1NDhDXHU1OTI3XHU1QzBGJyxcblx0YXV0b1JlZnJlc2g6ICdcdTgxRUFcdTUyQThcdTUyMzdcdTY1QjAnLFxuXHRhdXRvUmVmcmVzaERlc2M6ICdcdTVGNTNcdTVFOTNcdTRFMkRcdTc2ODRcdTU2RkVcdTcyNDdcdTUzRDFcdTc1MUZcdTUzRDhcdTUzMTZcdTY1RjZcdTgxRUFcdTUyQThcdTUyMzdcdTY1QjBcdTg5QzZcdTU2RkUnLFxuXHRkZWZhdWx0QWxpZ25tZW50OiAnXHU5RUQ4XHU4QkE0XHU1NkZFXHU3MjQ3XHU1QkY5XHU5RjUwXHU2NUI5XHU1RjBGJyxcblx0YWxpZ25tZW50RGVzYzogJ1x1NjNEMlx1NTE2NVx1NTZGRVx1NzI0N1x1NjVGNlx1NzY4NFx1OUVEOFx1OEJBNFx1NUJGOVx1OUY1MFx1NjVCOVx1NUYwRicsXG5cdGFsaWduTGVmdDogJ1x1NUM0NVx1NURFNicsXG5cdGFsaWduQ2VudGVyOiAnXHU1QzQ1XHU0RTJEJyxcblx0YWxpZ25SaWdodDogJ1x1NUM0NVx1NTNGMycsXG5cdHNhZmVEZWxldGVTZXR0aW5nczogJ1x1NUI4OVx1NTE2OFx1NTIyMFx1OTY2NFx1OEJCRVx1N0Y2RScsXG5cdHVzZVRyYXNoRm9sZGVyOiAnXHU0RjdGXHU3NTI4XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5Jyxcblx0dXNlVHJhc2hGb2xkZXJEZXNjOiAnXHU1MjIwXHU5NjY0XHU2NTg3XHU0RUY2XHU2NUY2XHU1MTQ4XHU3OUZCXHU1MTY1XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5XHVGRjBDXHU4MDBDXHU0RTBEXHU2NjJGXHU3NkY0XHU2M0E1XHU1MjIwXHU5NjY0Jyxcblx0dHJhc2hGb2xkZXJQYXRoOiAnXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5Jyxcblx0dHJhc2hGb2xkZXJQYXRoRGVzYzogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NzY4NFx1OERFRlx1NUY4NFx1RkYwOFx1NzZGOFx1NUJGOVx1OERFRlx1NUY4NFx1RkYwOScsXG5cdGF1dG9DbGVhbnVwVHJhc2g6ICdcdTgxRUFcdTUyQThcdTZFMDVcdTc0MDZcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzknLFxuXHRhdXRvQ2xlYW51cFRyYXNoRGVzYzogJ1x1ODFFQVx1NTJBOFx1NkUwNVx1NzQwNlx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NzY4NFx1NjVFN1x1NjU4N1x1NEVGNicsXG5cdGF1dG9DbGVhbnVwQ29tcGxldGU6ICdcdTgxRUFcdTUyQThcdTZFMDVcdTc0MDZcdTVCOENcdTYyMTBcdUZGMENcdTVERjJcdTUyMjBcdTk2NjQge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjYnLFxuXHRjbGVhbnVwRGF5czogJ1x1NkUwNVx1NzQwNlx1NTkyOVx1NjU3MCcsXG5cdGNsZWFudXBEYXlzRGVzYzogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NzY4NFx1NjU4N1x1NEVGNlx1OEQ4NVx1OEZDN1x1NkI2NFx1NTkyOVx1NjU3MFx1NTQwRVx1NUMwNlx1ODFFQVx1NTJBOFx1NTIyMFx1OTY2NCcsXG5cdG1lZGlhVHlwZXM6ICdcdTVBOTJcdTRGNTNcdTdDN0JcdTU3OEInLFxuXHRlbmFibGVJbWFnZVN1cHBvcnQ6ICdcdTU0MkZcdTc1MjhcdTU2RkVcdTcyNDdcdTY1MkZcdTYzMDEnLFxuXHRlbmFibGVJbWFnZVN1cHBvcnREZXNjOiAnXHU1NzI4XHU1QTkyXHU0RjUzXHU1RTkzXHU0RTJEXHU2NjNFXHU3OTNBXHU1NkZFXHU3MjQ3XHU2NTg3XHU0RUY2IChwbmcsIGpwZywgZ2lmLCB3ZWJwLCBzdmcsIGJtcCknLFxuXHRlbmFibGVWaWRlb1N1cHBvcnQ6ICdcdTU0MkZcdTc1MjhcdTg5QzZcdTk4OTFcdTY1MkZcdTYzMDEnLFxuXHRlbmFibGVWaWRlb1N1cHBvcnREZXNjOiAnXHU1NzI4XHU1QTkyXHU0RjUzXHU1RTkzXHU0RTJEXHU2NjNFXHU3OTNBXHU4OUM2XHU5ODkxXHU2NTg3XHU0RUY2IChtcDQsIG1vdiwgYXZpLCBta3YsIHdlYm0pJyxcblx0ZW5hYmxlQXVkaW9TdXBwb3J0OiAnXHU1NDJGXHU3NTI4XHU5N0YzXHU5ODkxXHU2NTJGXHU2MzAxJyxcblx0ZW5hYmxlQXVkaW9TdXBwb3J0RGVzYzogJ1x1NTcyOFx1NUE5Mlx1NEY1M1x1NUU5M1x1NEUyRFx1NjYzRVx1NzkzQVx1OTdGM1x1OTg5MVx1NjU4N1x1NEVGNiAobXAzLCB3YXYsIG9nZywgbTRhLCBmbGFjKScsXG5cdGVuYWJsZVBERlN1cHBvcnQ6ICdcdTU0MkZcdTc1MjhcdTY1ODdcdTY4NjNcdTY1MkZcdTYzMDEnLFxuXHRlbmFibGVQREZTdXBwb3J0RGVzYzogJ1x1NTcyOFx1NUE5Mlx1NEY1M1x1NUU5M1x1NEUyRFx1NjYzRVx1NzkzQVx1NjU4N1x1Njg2M1x1NjU4N1x1NEVGNiAocGRmLCBkb2MsIGRvY3gsIHhscywgeGxzeCwgcHB0LCBwcHR4KScsXG5cdHZpZXdTZXR0aW5nczogJ1x1ODlDNlx1NTZGRVx1OEJCRVx1N0Y2RScsXG5cdGludGVyZmFjZUxhbmd1YWdlOiAnXHU3NTRDXHU5NzYyXHU4QkVEXHU4QTAwJyxcblx0bGFuZ3VhZ2VEZXNjOiAnXHU5MDA5XHU2MkU5XHU2M0QyXHU0RUY2XHU3NTRDXHU5NzYyXHU2NjNFXHU3OTNBXHU3Njg0XHU4QkVEXHU4QTAwJyxcblx0bGFuZ3VhZ2VTeXN0ZW06ICdcdThEREZcdTk2OEZcdTdDRkJcdTdFREYnLFxuXHRwYWdlU2l6ZTogJ1x1NTIwNlx1OTg3NVx1NTkyN1x1NUMwRicsXG5cdHBhZ2VTaXplRGVzYzogJ1x1NUE5Mlx1NEY1M1x1NUU5M1x1NEUyRFx1NkJDRlx1OTg3NVx1NjYzRVx1NzkzQVx1NzY4NFx1NjU4N1x1NEVGNlx1NjU3MFx1OTFDRicsXG5cdFx0ZW5hYmxlUHJldmlld01vZGFsOiAnXHU1NDJGXHU3NTI4XHU5ODg0XHU4OUM4IE1vZGFsJyxcblx0XHRlbmFibGVQcmV2aWV3TW9kYWxEZXNjOiAnXHU3MEI5XHU1MUZCXHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2XHU2NUY2XHU2MjUzXHU1RjAwXHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzJyxcblx0XHRlbmFibGVLZXlib2FyZE5hdjogJ1x1NTQyRlx1NzUyOFx1OTUyRVx1NzZEOFx1NUJGQ1x1ODIyQScsXG5cdFx0ZW5hYmxlS2V5Ym9hcmROYXZEZXNjOiAnXHU1NzI4XHU5ODg0XHU4OUM4XHU3QTk3XHU1M0UzXHU0RTJEXHU0RjdGXHU3NTI4XHU2NUI5XHU1NDExXHU5NTJFXHU1MjA3XHU2MzYyXHU1NkZFXHU3MjQ3Jyxcblx0XHRzYWZlU2NhblNldHRpbmdzOiAnXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGJyxcblx0XHRzYWZlU2NhbkVuYWJsZWREZXNjOiAnXHU1NDJGXHU3NTI4XHU1NDBFXHU1M0VGXHU1NzI4XHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU3QkExXHU3NDA2XHU0RTJEXHU2MjY3XHU4ODRDXHU2NzYxXHU0RUY2XHU2MjZCXHU2M0NGJyxcblx0XHRzYWZlU2NhblVucmVmRGF5czogJ1x1NjcyQVx1NUYxNVx1NzUyOFx1NTkyOVx1NjU3MCcsXG5cdFx0c2FmZVNjYW5VbnJlZkRheXNEZXNjOiAnXHU0RUM1XHU2MjZCXHU2M0NGXHU4RDg1XHU4RkM3XHU2QjY0XHU1OTI5XHU2NTcwXHU2NzJBXHU4OEFCXHU1RjE1XHU3NTI4XHU3Njg0XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2Jyxcblx0XHRzYWZlU2Nhbk1pblNpemU6ICdcdTY3MDBcdTVDMEZcdTY1ODdcdTRFRjZcdTU5MjdcdTVDMEYgKE1CKScsXG5cdFx0c2FmZVNjYW5NaW5TaXplRGVzYzogJ1x1NEVDNVx1NjI2Qlx1NjNDRlx1NTkyN1x1NEU4RVx1N0I0OVx1NEU4RVx1NkI2NFx1NTkyN1x1NUMwRlx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNicsXG5cdFx0ZHVwbGljYXRlRGV0ZWN0aW9uU2V0dGluZ3M6ICdcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEInLFxuXHRcdGR1cGxpY2F0ZVRocmVzaG9sZFNldHRpbmc6ICdcdTc2RjhcdTRGM0NcdTVFQTZcdTk2MDhcdTUwM0MnLFxuXHRcdGR1cGxpY2F0ZVRocmVzaG9sZERlc2M6ICdcdThGQkVcdTUyMzBcdThCRTVcdTc2N0VcdTUyMDZcdTZCRDRcdTYyNERcdTRGMUFcdTg4QUJcdTUyMjRcdTVCOUFcdTRFM0FcdTkxQ0RcdTU5MEQnLFxuXHRcdGtleWJvYXJkU2hvcnRjdXRzOiAnXHU1RkVCXHU2Mzc3XHU5NTJFJyxcblx0XHRzaG9ydGN1dHNEZXNjOiAnXHU2M0QyXHU0RUY2XHU2NTJGXHU2MzAxXHU3Njg0XHU1RkVCXHU2Mzc3XHU5NTJFXHVGRjFBJyxcblx0XHRzaG9ydGN1dE9wZW5MaWJyYXJ5OiAnQ3RybCtTaGlmdCtNIC0gXHU2MjUzXHU1RjAwXHU1QTkyXHU0RjUzXHU1RTkzJyxcblx0c2hvcnRjdXRGaW5kVW5yZWZlcmVuY2VkOiAnQ3RybCtTaGlmdCtVIC0gXHU2N0U1XHU2MjdFXHU2NzJBXHU1RjE1XHU3NTI4XHU1QTkyXHU0RjUzJyxcblx0c2hvcnRjdXRPcGVuVHJhc2g6ICdDdHJsK1NoaWZ0K1QgLSBcdTYyNTNcdTVGMDBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTdCQTFcdTc0MDYnLFxuXHRjb21tYW5kczogJ1x1NUZFQlx1NjM3N1x1NTQ3RFx1NEVFNCcsXG5cdGNvbW1hbmRzRGVzYzogJ1x1NTcyOFx1NTQ3RFx1NEVFNFx1OTc2Mlx1Njc3Rlx1NEUyRFx1NEY3Rlx1NzUyOFx1NEVFNVx1NEUwQlx1NTQ3RFx1NEVFNFx1RkYxQScsXG5cdGNtZE9wZW5MaWJyYXJ5OiAnXHU1QTkyXHU0RjUzXHU1RTkzIC0gXHU2MjUzXHU1RjAwXHU1QTkyXHU0RjUzXHU1RTkzXHU4OUM2XHU1NkZFJyxcblx0Y21kRmluZFVucmVmZXJlbmNlZDogJ1x1NjdFNVx1NjI3RVx1NjcyQVx1NUYxNVx1NzUyOFx1NUE5Mlx1NEY1MyAtIFx1NjdFNVx1NjI3RVx1NjcyQVx1ODhBQlx1NEVGQlx1NEY1NVx1N0IxNFx1OEJCMFx1NUYxNVx1NzUyOFx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNicsXG5cdGNtZFRyYXNoTWFuYWdlbWVudDogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1N0JBMVx1NzQwNiAtIFx1N0JBMVx1NzQwNlx1NURGMlx1NTIyMFx1OTY2NFx1NzY4NFx1NjU4N1x1NEVGNicsXG5cdGNtZEFsaWduTGVmdDogJ1x1NTZGRVx1NzI0N1x1NUM0NVx1NURFNlx1NUJGOVx1OUY1MCAtIFx1NUMwNlx1OTAwOVx1NEUyRFx1NTZGRVx1NzI0N1x1NUM0NVx1NURFNlx1NUJGOVx1OUY1MCcsXG5cdGNtZEFsaWduQ2VudGVyOiAnXHU1NkZFXHU3MjQ3XHU1QzQ1XHU0RTJEXHU1QkY5XHU5RjUwIC0gXHU1QzA2XHU5MDA5XHU0RTJEXHU1NkZFXHU3MjQ3XHU1QzQ1XHU0RTJEXHU1QkY5XHU5RjUwJyxcblx0Y21kQWxpZ25SaWdodDogJ1x1NTZGRVx1NzI0N1x1NUM0NVx1NTNGM1x1NUJGOVx1OUY1MCAtIFx1NUMwNlx1OTAwOVx1NEUyRFx1NTZGRVx1NzI0N1x1NUM0NVx1NTNGM1x1NUJGOVx1OUY1MCcsXG5cblx0Ly8gVHJhc2ggTWFuYWdlbWVudCBWaWV3XG5cdGxvYWRpbmdUcmFzaEZpbGVzOiAnXHU2QjYzXHU1NzI4XHU1MkEwXHU4RjdEXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2Li4uJyxcblx0dHJhc2hGb2xkZXJFbXB0eTogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUzQVx1N0E3QScsXG5cdGZpbGVzSW5UcmFzaDogJ1x1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFx1NjcwOSB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdHRvdGFsU2l6ZTogJ1x1NjAzQlx1OEJBMSB7c2l6ZX0nLFxuXHR0cmFzaE1hbmFnZW1lbnREZXNjOiAnXHU1REYyXHU1MjIwXHU5NjY0XHU3Njg0XHU2NTg3XHU0RUY2XHU0RjFBXHU0RTM0XHU2NUY2XHU1QjU4XHU2NTNFXHU1NzI4XHU4RkQ5XHU5MUNDXHVGRjBDXHU2MEE4XHU1M0VGXHU0RUU1XHU2MDYyXHU1OTBEXHU2MjE2XHU1RjdCXHU1RTk1XHU1MjIwXHU5NjY0XHU1QjgzXHU0RUVDJyxcblx0cmVmcmVzaDogJ1x1NTIzN1x1NjVCMCcsXG5cdGNsZWFyVHJhc2g6ICdcdTZFMDVcdTdBN0FcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzknLFxuXHRjbGVhclRyYXNoVG9vbHRpcDogJ1x1NkUwNVx1N0E3QVx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOScsXG5cdHJlc3RvcmVUb29sdGlwOiAnXHU2MDYyXHU1OTBEXHU2NTg3XHU0RUY2Jyxcblx0cGVybWFuZW50RGVsZXRlOiAnXHU1RjdCXHU1RTk1XHU1MjIwXHU5NjY0Jyxcblx0cGVybWFuZW50RGVsZXRlVG9vbHRpcDogJ1x1NUY3Qlx1NUU5NVx1NTIyMFx1OTY2NCcsXG5cdGRlbGV0ZWRUaW1lOiAnXHU1MjIwXHU5NjY0XHU2NUY2XHU5NUY0Jyxcblx0Y29uZmlybURlbGV0ZUZpbGU6ICdcdTc4NkVcdTVCOUFcdTg5ODFcdTVGN0JcdTVFOTVcdTUyMjBcdTk2NjQgXCJ7bmFtZX1cIiBcdTU0MTdcdUZGMUZcdTZCNjRcdTY0Q0RcdTRGNUNcdTRFMERcdTUzRUZcdTY0QTRcdTk1MDBcdTMwMDInLFxuXHRjb25maXJtQ2xlYXJUcmFzaDogJ1x1Nzg2RVx1NUI5QVx1ODk4MVx1NkUwNVx1N0E3QVx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NTQxN1x1RkYxRntjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2XHU1QzA2XHU4OEFCXHU1RjdCXHU1RTk1XHU1MjIwXHU5NjY0XHVGRjBDXHU2QjY0XHU2NENEXHU0RjVDXHU0RTBEXHU1M0VGXHU2NEE0XHU5NTAwXHUzMDAyJyxcblx0ZmlsZURlbGV0ZWQ6ICdcdTVERjJcdTVGN0JcdTVFOTVcdTUyMjBcdTk2NjQ6IHtuYW1lfScsXG5cdHJlc3RvcmVTdWNjZXNzOiAnXHU1REYyXHU2MDYyXHU1OTBEOiB7bmFtZX0nLFxuXHRyZXN0b3JlRmFpbGVkOiAnXHU2MDYyXHU1OTBEXHU1OTMxXHU4RDI1OiB7bWVzc2FnZX0nLFxuXHR0YXJnZXRGaWxlRXhpc3RzOiAnXHU3NkVFXHU2ODA3XHU2NTg3XHU0RUY2XHU1REYyXHU1QjU4XHU1NzI4Jyxcblx0ZGVsZXRlRmFpbGVkOiAnXHU1MjIwXHU5NjY0XHU1OTMxXHU4RDI1Jyxcblx0ZmlsZU5hbWVDb3BpZWQ6ICdcdTY1ODdcdTRFRjZcdTU0MERcdTVERjJcdTU5MERcdTUyMzYnLFxuXHRvcmlnaW5hbFBhdGhDb3BpZWQ6ICdcdTUzOUZcdTU5Q0JcdThERUZcdTVGODRcdTVERjJcdTU5MERcdTUyMzYnLFxuXG5cdC8vIFx1NjcyQVx1NUYxNVx1NzUyOFx1NTZGRVx1NzI0N1x1ODlDNlx1NTZGRVxuXHRzY2FubmluZ1VucmVmZXJlbmNlZDogJ1x1NkI2M1x1NTcyOFx1NjI2Qlx1NjNDRlx1NjcyQVx1NUYxNVx1NzUyOFx1NzY4NFx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNi4uLicsXG5cdHRvdGFsU2l6ZUxhYmVsOiAnXHU2MDNCXHU4QkExIHtzaXplfScsXG5cdHNjYW5FcnJvcjogJ1x1NjI2Qlx1NjNDRlx1NTZGRVx1NzI0N1x1NjVGNlx1NTFGQVx1OTUxOScsXG5cdHVucmVmZXJlbmNlZERlc2M6ICdcdTRFRTVcdTRFMEJcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTY3MkFcdTg4QUJcdTRFRkJcdTRGNTVcdTdCMTRcdThCQjBcdTVGMTVcdTc1MjhcdUZGMENcdTUzRUZcdTgwRkRcdTUzRUZcdTRFRTVcdTUyMjBcdTk2NjRcdTRFRTVcdTkxQ0FcdTY1M0VcdTdBN0FcdTk1RjQnLFxuXHRub0ZpbGVzVG9EZWxldGU6ICdcdTZDQTFcdTY3MDlcdTk3MDBcdTg5ODFcdTUyMjBcdTk2NjRcdTc2ODRcdTU2RkVcdTcyNDcnLFxuXHRwcm9jZXNzZWRGaWxlczogJ1x1NURGMlx1NTkwNFx1NzQwNiB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdHByb2Nlc3NlZEZpbGVzRXJyb3I6ICdcdTU5MDRcdTc0MDYge2Vycm9yc30gXHU0RTJBXHU2NTg3XHU0RUY2XHU2NUY2XHU1MUZBXHU5NTE5Jyxcblx0Y29weUFsbFBhdGhzOiAnXHU1OTBEXHU1MjM2XHU2MjQwXHU2NzA5XHU4REVGXHU1Rjg0Jyxcblx0Y29waWVkRmlsZVBhdGhzOiAnXHU1REYyXHU1OTBEXHU1MjM2IHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2XHU4REVGXHU1Rjg0JyxcblxuXHQvLyBcdTU2RkVcdTcyNDdcdTVFOTNcdTg5QzZcdTU2RkVcblx0bm9NYXRjaGluZ0ZpbGVzOiAnXHU2Q0ExXHU2NzA5XHU1MzM5XHU5MTREXHU3Njg0XHU2NTg3XHU0RUY2Jyxcblx0cHJldlBhZ2U6ICdcdTRFMEFcdTRFMDBcdTk4NzUnLFxuXHRuZXh0UGFnZTogJ1x1NEUwQlx1NEUwMFx1OTg3NScsXG5cdHBhZ2VJbmZvOiAnXHU3QjJDIHtjdXJyZW50fSAvIHt0b3RhbH0gXHU5ODc1Jyxcblx0c2VsZWN0RmlsZXM6ICdcdTVERjJcdTkwMDlcdTYyRTkge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjYnLFxuXHRzZWxlY3RBbGw6ICdcdTUxNjhcdTkwMDknLFxuXHRkZXNlbGVjdEFsbDogJ1x1NTNENlx1NkQ4OFx1NTE2OFx1OTAwOScsXG5cdGNvbmZpcm1EZWxldGVTZWxlY3RlZDogJ1x1Nzg2RVx1NUI5QVx1ODk4MVx1NTIyMFx1OTY2NFx1OTAwOVx1NEUyRFx1NzY4NCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNlx1NTQxN1x1RkYxRicsXG5cdGRlbGV0ZWRGaWxlczogJ1x1NURGMlx1NTIyMFx1OTY2NCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdGRlbGV0ZUZpbGVzRmFpbGVkOiAnXHU1MjIwXHU5NjY0IHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2XHU1OTMxXHU4RDI1Jyxcblx0bXVsdGlTZWxlY3RNb2RlOiAnXHU1OTFBXHU5MDA5XHU2QTIxXHU1RjBGJyxcblxuXHQvLyBcdTVBOTJcdTRGNTNcdTk4ODRcdTg5Qzhcblx0dW5zdXBwb3J0ZWRGaWxlVHlwZTogJ1x1NEUwRFx1NjUyRlx1NjMwMVx1OTg4NFx1ODlDOFx1NkI2NFx1N0M3Qlx1NTc4Qlx1NjU4N1x1NEVGNicsXG5cdGRvY3VtZW50RW1iZWRQcmV2aWV3VW5zdXBwb3J0ZWQ6ICdcdThCRTVcdTY1ODdcdTY4NjNcdTdDN0JcdTU3OEJcdTRFMERcdTY1MkZcdTYzMDFcdTUxODVcdTVENENcdTk4ODRcdTg5QzhcdUZGMENcdThCRjdcdTRGN0ZcdTc1MjhcdTIwMUNcdTYyNTNcdTVGMDBcdTUzOUZcdTY1ODdcdTRFRjZcdTIwMUQnLFxuXHRjb3B5UGF0aEJ0bjogJ1x1NTkwRFx1NTIzNlx1OERFRlx1NUY4NCcsXG5cdGNvcHlMaW5rQnRuOiAnXHU1OTBEXHU1MjM2XHU5NEZFXHU2M0E1Jyxcblx0ZmluZEluTm90ZXM6ICdcdTU3MjhcdTdCMTRcdThCQjBcdTRFMkRcdTY3RTVcdTYyN0UnLFxuXHRwYXRoQ29waWVkOiAnXHU4REVGXHU1Rjg0XHU1REYyXHU1OTBEXHU1MjM2Jyxcblx0bGlua0NvcGllZDogJ1x1OTRGRVx1NjNBNVx1NURGMlx1NTkwRFx1NTIzNicsXG5cdGltYWdlTG9hZEVycm9yOiAnXHU1NkZFXHU3MjQ3XHU1MkEwXHU4RjdEXHU1OTMxXHU4RDI1JyxcblxuXHQvLyBcdTU2RkVcdTcyNDdcdTVCRjlcdTlGNTBcblx0YWxpZ25JbWFnZUxlZnQ6ICdcdTU2RkVcdTcyNDdcdTVDNDVcdTVERTZcdTVCRjlcdTlGNTAnLFxuXHRhbGlnbkltYWdlQ2VudGVyOiAnXHU1NkZFXHU3MjQ3XHU1QzQ1XHU0RTJEXHU1QkY5XHU5RjUwJyxcblx0YWxpZ25JbWFnZVJpZ2h0OiAnXHU1NkZFXHU3MjQ3XHU1QzQ1XHU1M0YzXHU1QkY5XHU5RjUwJyxcblx0c2VsZWN0SW1hZ2VGaXJzdDogJ1x1OEJGN1x1NTE0OFx1OTAwOVx1NEUyRFx1NEUwMFx1NUYyMFx1NTZGRVx1NzI0NycsXG5cdHNlbGVjdEltYWdlOiAnXHU4QkY3XHU5MDA5XHU0RTJEXHU1NkZFXHU3MjQ3Jyxcblx0aW1hZ2VBbGlnbmVkTGVmdDogJ1x1NTZGRVx1NzI0N1x1NURGMlx1NUM0NVx1NURFNlx1NUJGOVx1OUY1MCcsXG5cdGltYWdlQWxpZ25lZENlbnRlcjogJ1x1NTZGRVx1NzI0N1x1NURGMlx1NUM0NVx1NEUyRFx1NUJGOVx1OUY1MCcsXG5cdGltYWdlQWxpZ25lZFJpZ2h0OiAnXHU1NkZFXHU3MjQ3XHU1REYyXHU1QzQ1XHU1M0YzXHU1QkY5XHU5RjUwJyxcblxuXHQvLyBcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdTY0Q0RcdTRGNUNcblx0Y29waWVkRmlsZU5hbWU6ICdcdTVERjJcdTU5MERcdTUyMzZcdTY1ODdcdTRFRjZcdTU0MEQnLFxuXHRjb3BpZWRPcmlnaW5hbFBhdGg6ICdcdTVERjJcdTU5MERcdTUyMzZcdTUzOUZcdTU5Q0JcdThERUZcdTVGODQnLFxuXHRub3RSZWZlcmVuY2VkOiAnXHU4QkU1XHU1NkZFXHU3MjQ3XHU2NzJBXHU4OEFCXHU0RUZCXHU0RjU1XHU3QjE0XHU4QkIwXHU1RjE1XHU3NTI4Jyxcblx0bW92ZWRUb1RyYXNoOiAnXHU1REYyXHU3OUZCXHU4MUYzXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU1OTM5OiB7bmFtZX0nLFxuXHRkZWxldGVkRmlsZTogJ1x1NURGMlx1NTIyMFx1OTY2NDoge25hbWV9Jyxcblx0cmVzdG9yZWRGaWxlOiAnXHU1REYyXHU2MDYyXHU1OTBEXHU2NTg3XHU0RUY2JyxcblxuXHQvLyBcdTU0N0RcdTRFRTRcdTU0MERcdTc5RjBcblx0Y21kSW1hZ2VMaWJyYXJ5OiAnXHU1NkZFXHU3MjQ3XHU1RTkzJyxcblx0Y21kRmluZFVucmVmZXJlbmNlZEltYWdlczogJ1x1NjdFNVx1NjI3RVx1NjcyQVx1NUYxNVx1NzUyOFx1NTZGRVx1NzI0NycsXG5cdGNtZFJlZnJlc2hDYWNoZTogJ1x1NTIzN1x1NjVCMFx1NUE5Mlx1NEY1M1x1NUYxNVx1NzUyOFx1N0YxM1x1NUI1OCcsXG5cdGNtZEFsaWduSW1hZ2VMZWZ0OiAnXHU1NkZFXHU3MjQ3XHU1QzQ1XHU1REU2XHU1QkY5XHU5RjUwJyxcblx0Y21kQWxpZ25JbWFnZUNlbnRlcjogJ1x1NTZGRVx1NzI0N1x1NUM0NVx1NEUyRFx1NUJGOVx1OUY1MCcsXG5cdGNtZEFsaWduSW1hZ2VSaWdodDogJ1x1NTZGRVx1NzI0N1x1NUM0NVx1NTNGM1x1NUJGOVx1OUY1MCcsXG5cdGNtZE9wZW5NZWRpYUxpYnJhcnk6ICdcdTYyNTNcdTVGMDBcdTVBOTJcdTRGNTNcdTVFOTMnLFxuXHRjbWRGaW5kVW5yZWZlcmVuY2VkTWVkaWE6ICdcdTY3RTVcdTYyN0VcdTY3MkFcdTVGMTVcdTc1MjhcdTVBOTJcdTRGNTMnLFxuXHRjbWRPcGVuVHJhc2hNYW5hZ2VtZW50OiAnXHU2MjUzXHU1RjAwXHU5Njk0XHU3OUJCXHU2NTg3XHU0RUY2XHU3QkExXHU3NDA2JyxcblxuXHQvLyBcdTUyMjBcdTk2NjRcdTY0Q0RcdTRGNUNcblx0ZGVsZXRlRmFpbGVkV2l0aE5hbWU6ICdcdTUyMjBcdTk2NjRcdTU5MzFcdThEMjU6IHtuYW1lfScsXG5cdGRlbGV0ZWRXaXRoUXVhcmFudGluZUZhaWxlZDogJ1x1NURGMlx1NTIyMFx1OTY2NDoge25hbWV9XHVGRjA4XHU5Njk0XHU3OUJCXHU1OTMxXHU4RDI1XHVGRjA5Jyxcblx0b3BlcmF0aW9uRmFpbGVkOiAnXHU2NENEXHU0RjVDXHU1OTMxXHU4RDI1OiB7bmFtZX0nLFxuXHRwcm9jZXNzaW5nOiAnXHU1OTA0XHU3NDA2XHU0RTJELi4uJyxcblxuXHQvLyB2Mi4wIFx1NjVCMFx1NTg5RVxuXHRkdXBsaWNhdGVEZXRlY3Rpb246ICdcdTkxQ0RcdTU5MERcdTY4QzBcdTZENEInLFxuXHRkdXBsaWNhdGVEZXRlY3Rpb25EZXNjOiAnXHU0RjdGXHU3NTI4XHU2MTFGXHU3N0U1XHU1NEM4XHU1RTBDXHU3Qjk3XHU2Q0Q1XHU2OEMwXHU2RDRCXHU1MENGXHU3RDIwXHU3RUE3XHU5MUNEXHU1OTBEXHU1NkZFXHU3MjQ3XHVGRjBDXHU5NzVFXHU2NTg3XHU0RUY2XHU1NDBEXHU1QkY5XHU2QkQ0Jyxcblx0bm9EdXBsaWNhdGVzRm91bmQ6ICdcdTY3MkFcdTUzRDFcdTczQjBcdTkxQ0RcdTU5MERcdTY1ODdcdTRFRjZcdUZGMENcdTcwQjlcdTUxRkJcdTIwMUNcdTVGMDBcdTU5Q0JcdTYyNkJcdTYzQ0ZcdTIwMURcdTY4QzBcdTZENEInLFxuXHRzdGFydFNjYW46ICdcdTVGMDBcdTU5Q0JcdTYyNkJcdTYzQ0YnLFxuXHRzY2FuUHJvZ3Jlc3M6ICdcdTYyNkJcdTYzQ0ZcdThGREJcdTVFQTY6IHtjdXJyZW50fS97dG90YWx9Jyxcblx0c2ltaWxhcml0eVRocmVzaG9sZDogJ1x1NzZGOFx1NEYzQ1x1NUVBNlx1OTYwOFx1NTAzQzoge3ZhbHVlfSUnLFxuXHRkdXBsaWNhdGVHcm91cHNGb3VuZDogJ1x1NTNEMVx1NzNCMCB7Z3JvdXBzfSBcdTdFQzRcdTkxQ0RcdTU5MERcdUZGMENcdTUxNzEge2ZpbGVzfSBcdTRFMkFcdTUxOTdcdTRGNTlcdTY1ODdcdTRFRjYnLFxuXHRkdXBsaWNhdGVHcm91cDogJ1x1OTFDRFx1NTkwRFx1N0VDNCAje2luZGV4fScsXG5cdGZpbGVzOiAnXHU0RTJBXHU2NTg3XHU0RUY2Jyxcblx0c3VnZ2VzdEtlZXA6ICdcdTI3MDUgXHU1RUZBXHU4QkFFXHU0RkREXHU3NTU5Jyxcblx0cXVhcmFudGluZTogJ1x1OTY5NFx1NzlCQicsXG5cdHF1YXJhbnRpbmVBbGxEdXBsaWNhdGVzOiAnXHU0RTAwXHU5NTJFXHU5Njk0XHU3OUJCXHU2MjQwXHU2NzA5XHU5MUNEXHU1OTBEJyxcblx0ZHVwbGljYXRlc0ZvdW5kOiAnXHU1M0QxXHU3M0IwIHtncm91cHN9IFx1N0VDNFx1OTFDRFx1NTkwRFx1RkYwQ1x1NTE3MSB7ZmlsZXN9IFx1NEUyQVx1NTE5N1x1NEY1OVx1NjU4N1x1NEVGNicsXG5cdGR1cGxpY2F0ZXNRdWFyYW50aW5lZDogJ1x1NURGMlx1OTY5NFx1NzlCQiB7Y291bnR9IFx1NEUyQVx1OTFDRFx1NTkwRFx1NjU4N1x1NEVGNicsXG5cdHR5cGVEaXN0cmlidXRpb246ICdcdTdDN0JcdTU3OEJcdTUyMDZcdTVFMDMnLFxuXHR1bnJlZmVyZW5jZWRSYXRlOiAnXHU2NzJBXHU1RjE1XHU3NTI4XHU3Mzg3Jyxcblx0cmVmZXJlbmNlZEJ5OiAnXHU4OEFCIHtjb3VudH0gXHU3QkM3XHU3QjE0XHU4QkIwXHU1RjE1XHU3NTI4Jyxcblx0c2VsZWN0ZWRDb3VudDogJ1x1NURGMlx1OTAwOVx1NjJFOSB7Y291bnR9IFx1OTg3OScsXG5cdGJhdGNoUmVzdG9yZTogJ1x1NjI3OVx1OTFDRlx1NjA2Mlx1NTkwRCcsXG5cdGJhdGNoRGVsZXRlOiAnXHU2Mjc5XHU5MUNGXHU1MjIwXHU5NjY0Jyxcblx0bm9JdGVtc1NlbGVjdGVkOiAnXHU4QkY3XHU1MTQ4XHU5MDA5XHU2MkU5XHU2NTg3XHU0RUY2Jyxcblx0Y29uZmlybUJhdGNoUmVzdG9yZTogJ1x1Nzg2RVx1OEJBNFx1NjA2Mlx1NTkwRCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNlx1RkYxRicsXG5cdGJhdGNoUmVzdG9yZUNvbXBsZXRlZDogJ1x1NURGMlx1NjA2Mlx1NTkwRCB7Y291bnR9IFx1NEUyQVx1NjU4N1x1NEVGNicsXG5cdHNhZmVTY2FuOiAnXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGJyxcblx0c2FmZVNjYW5EZXNjOiAnXHU4MUVBXHU1MkE4XHU2MjZCXHU2M0NGXHU2NzJBXHU1RjE1XHU3NTI4XHUzMDAxXHU4RDg1XHU2NzFGXHUzMDAxXHU4RDg1XHU1OTI3XHU3Njg0XHU1QTkyXHU0RjUzXHU2NTg3XHU0RUY2Jyxcblx0c2FmZVNjYW5TdGFydGVkOiAnXHU1RjAwXHU1OUNCXHU1Qjg5XHU1MTY4XHU2MjZCXHU2M0NGLi4uJyxcblx0c2FmZVNjYW5Ob1Jlc3VsdHM6ICdcdTY3MkFcdTUzRDFcdTczQjBcdTdCMjZcdTU0MDhcdTY3NjFcdTRFRjZcdTc2ODRcdTY1ODdcdTRFRjYnLFxuXHRzYWZlU2NhbkNvbmZpcm06ICdcdTUzRDFcdTczQjAge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjZcdTdCMjZcdTU0MDhcdTY3NjFcdTRFRjZcdUZGMDhcdTY3MkFcdTVGMTVcdTc1Mjg+e2RheXN9XHU1OTI5ICsgXHU1OTI3XHU1QzBGPntzaXplfVx1RkYwOVx1RkYwQ1x1Nzg2RVx1OEJBNFx1OTAwMVx1NTE2NVx1OTY5NFx1NzlCQlx1NTMzQVx1RkYxRicsXG5cdHNhZmVTY2FuQ29tcGxldGU6ICdcdTVCODlcdTUxNjhcdTYyNkJcdTYzQ0ZcdTVCOENcdTYyMTBcdUZGMENcdTVERjJcdTk2OTRcdTc5QkIge2NvdW50fSBcdTRFMkFcdTY1ODdcdTRFRjYnLFxuXHRzYWZlU2NhbkZhaWxlZDogJ1x1NUI4OVx1NTE2OFx1NjI2Qlx1NjNDRlx1NTkzMVx1OEQyNScsXG5cdGNtZER1cGxpY2F0ZURldGVjdGlvbjogJ1x1NjI1M1x1NUYwMFx1OTFDRFx1NTkwRFx1NjhDMFx1NkQ0QicsXG5cdG9yZ2FuaXppbmc6ICdcdTY1NzRcdTc0MDZcdTRFMkQnLFxuXHRvcmdhbml6ZUNvbXBsZXRlOiAnXHU1REYyXHU2NTc0XHU3NDA2IHtjb3VudH0gXHU0RTJBXHU2NTg3XHU0RUY2J1xufTtcblxuY29uc3QgZW46IFRyYW5zbGF0aW9ucyA9IHtcblx0Ly8gR2VuZXJhbFxuXHRvazogJ09LJyxcblx0Y2FuY2VsOiAnQ2FuY2VsJyxcblx0ZGVsZXRlOiAnRGVsZXRlJyxcblx0cmVzdG9yZTogJ1Jlc3RvcmUnLFxuXHRjb25maXJtOiAnQ29uZmlybScsXG5cdHN1Y2Nlc3M6ICdTdWNjZXNzJyxcblx0ZXJyb3I6ICdFcnJvcicsXG5cblx0Ly8gVmlldyBuYW1lc1xuXHRtZWRpYUxpYnJhcnk6ICdNZWRpYSBMaWJyYXJ5Jyxcblx0dW5yZWZlcmVuY2VkTWVkaWE6ICdVbnJlZmVyZW5jZWQgTWVkaWEnLFxuXHR0cmFzaE1hbmFnZW1lbnQ6ICdUcmFzaCBNYW5hZ2VtZW50JyxcblxuXHQvLyBNZWRpYSBMaWJyYXJ5XG5cdHRvdGFsTWVkaWFGaWxlczogJ3tjb3VudH0gbWVkaWEgZmlsZXMnLFxuXHRub01lZGlhRmlsZXM6ICdObyBtZWRpYSBmaWxlcyBmb3VuZCcsXG5cdGFsbE1lZGlhVHlwZXNEaXNhYmxlZDogJ0FsbCBtZWRpYSB0eXBlcyBoYXZlIGJlZW4gZGlzYWJsZWQuIFBsZWFzZSBlbmFibGUgYXQgbGVhc3Qgb25lIG1lZGlhIHR5cGUgaW4gc2V0dGluZ3MnLFxuXHRzZWFyY2hQbGFjZWhvbGRlcjogJ1NlYXJjaCBieSBmaWxlbmFtZS4uLicsXG5cdHNlYXJjaFJlc3VsdHM6ICd7Y291bnR9IHJlc3VsdHMgZm91bmQnLFxuXG5cdC8vIFVucmVmZXJlbmNlZCBNZWRpYVxuXHR1bnJlZmVyZW5jZWRGb3VuZDogJ3tjb3VudH0gdW5yZWZlcmVuY2VkIG1lZGlhIGZpbGVzIGZvdW5kJyxcblx0YWxsTWVkaWFSZWZlcmVuY2VkOiAnR3JlYXQhIEFsbCBtZWRpYSBmaWxlcyBhcmUgcmVmZXJlbmNlZCcsXG5cdGRlbGV0ZVRvVHJhc2g6ICdGaWxlcyB3aWxsIGJlIG1vdmVkIHRvIHRyYXNoIGZvbGRlcicsXG5cblx0Ly8gVHJhc2ggRm9sZGVyXG5cdHRyYXNoRW1wdHk6ICdUcmFzaCBmb2xkZXIgaXMgZW1wdHknLFxuXHRvcmlnaW5hbFBhdGg6ICdPcmlnaW5hbCBsb2NhdGlvbicsXG5cdGRlbGV0ZWRBdDogJ0RlbGV0ZWQgYXQnLFxuXHRjb25maXJtQ2xlYXJBbGw6ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZW1wdHkgdGhlIHRyYXNoIGZvbGRlcj8nLFxuXG5cdC8vIEFjdGlvbnNcblx0b3BlbkluTm90ZXM6ICdGaW5kIGluIE5vdGVzJyxcblx0Y29weVBhdGg6ICdDb3B5IFBhdGgnLFxuXHRjb3B5TGluazogJ0NvcHkgTGluaycsXG5cdG9wZW5PcmlnaW5hbDogJ09wZW4gT3JpZ2luYWwnLFxuXHRwcmV2aWV3OiAnUHJldmlldycsXG5cblx0Ly8gU2hvcnRjdXRzXG5cdHNob3J0Y3V0czogJ1Nob3J0Y3V0cycsXG5cdG9wZW5MaWJyYXJ5OiAnT3BlbiBNZWRpYSBMaWJyYXJ5Jyxcblx0ZmluZFVucmVmZXJlbmNlZDogJ0ZpbmQgVW5yZWZlcmVuY2VkIE1lZGlhJyxcblx0b3BlblRyYXNoOiAnT3BlbiBUcmFzaCBNYW5hZ2VtZW50JyxcblxuXHQvLyBTY2FubmluZyBwcm9ncmVzc1xuXHRzY2FubmluZ1JlZmVyZW5jZXM6ICdTY2FubmluZyByZWZlcmVuY2VzJyxcblx0c2NhbkNvbXBsZXRlOiAnU2NhbiBjb21wbGV0ZScsXG5cdGZpbGVzU2Nhbm5lZDogJ2ZpbGVzIHNjYW5uZWQnLFxuXG5cdC8vIEJhdGNoIG9wZXJhdGlvbnNcblx0YmF0Y2hEZWxldGVDb21wbGV0ZTogJ3tjb3VudH0gZmlsZXMgZGVsZXRlZCcsXG5cdGJhdGNoRGVsZXRlUHJvZ3Jlc3M6ICdEZWxldGluZyB7Y3VycmVudH0ve3RvdGFsfScsXG5cdGJhdGNoUmVzdG9yZUNvbXBsZXRlOiAne2NvdW50fSBmaWxlcyByZXN0b3JlZCcsXG5cblx0Ly8gU2V0dGluZ3MgcGFnZVxuXHRwbHVnaW5TZXR0aW5nczogJ01lZGlhIFRvb2xraXQgUGx1Z2luIFNldHRpbmdzJyxcblx0bWVkaWFGb2xkZXI6ICdNZWRpYSBGb2xkZXInLFxuXHRtZWRpYUZvbGRlckRlc2M6ICdTcGVjaWZ5IHRoZSBtZWRpYSBmb2xkZXIgcGF0aCB0byBzY2FuIChsZWF2ZSBlbXB0eSB0byBzY2FuIGVudGlyZSB2YXVsdCknLFxuXHR0aHVtYm5haWxTaXplOiAnVGh1bWJuYWlsIFNpemUnLFxuXHR0aHVtYm5haWxTaXplRGVzYzogJ0Nob29zZSB0aHVtYm5haWwgc2l6ZSBpbiBtZWRpYSBsaWJyYXJ5IHZpZXcnLFxuXHR0aHVtYm5haWxTbWFsbDogJ1NtYWxsICgxMDBweCknLFxuXHR0aHVtYm5haWxNZWRpdW06ICdNZWRpdW0gKDE1MHB4KScsXG5cdHRodW1ibmFpbExhcmdlOiAnTGFyZ2UgKDIwMHB4KScsXG5cdGRlZmF1bHRTb3J0Qnk6ICdEZWZhdWx0IFNvcnQgQnknLFxuXHRzb3J0QnlEZXNjOiAnQ2hvb3NlIGRlZmF1bHQgc29ydCBtZXRob2QgZm9yIGltYWdlcycsXG5cdHNvcnRPcmRlcjogJ1NvcnQgT3JkZXInLFxuXHRzb3J0T3JkZXJEZXNjOiAnQ2hvb3NlIGFzY2VuZGluZyBvciBkZXNjZW5kaW5nIG9yZGVyJyxcblx0c29ydEJ5TmFtZTogJ0J5IE5hbWUnLFxuXHRzb3J0QnlEYXRlOiAnQnkgRGF0ZScsXG5cdHNvcnRCeVNpemU6ICdCeSBTaXplJyxcblx0c29ydEFzYzogJ0FzY2VuZGluZycsXG5cdHNvcnREZXNjOiAnRGVzY2VuZGluZycsXG5cdHNob3dJbWFnZUluZm86ICdTaG93IEltYWdlIEluZm8nLFxuXHRzaG93SW1hZ2VJbmZvRGVzYzogJ0Rpc3BsYXkgZmlsZW5hbWUgYW5kIHNpemUgYmVsb3cgaW1hZ2UgdGh1bWJuYWlscycsXG5cdGF1dG9SZWZyZXNoOiAnQXV0byBSZWZyZXNoJyxcblx0YXV0b1JlZnJlc2hEZXNjOiAnQXV0b21hdGljYWxseSByZWZyZXNoIHZpZXcgd2hlbiBpbWFnZXMgY2hhbmdlIGluIHZhdWx0Jyxcblx0ZGVmYXVsdEFsaWdubWVudDogJ0RlZmF1bHQgSW1hZ2UgQWxpZ25tZW50Jyxcblx0YWxpZ25tZW50RGVzYzogJ0RlZmF1bHQgYWxpZ25tZW50IHdoZW4gaW5zZXJ0aW5nIGltYWdlcycsXG5cdGFsaWduTGVmdDogJ0xlZnQnLFxuXHRhbGlnbkNlbnRlcjogJ0NlbnRlcicsXG5cdGFsaWduUmlnaHQ6ICdSaWdodCcsXG5cdHNhZmVEZWxldGVTZXR0aW5nczogJ1NhZmUgRGVsZXRlIFNldHRpbmdzJyxcblx0dXNlVHJhc2hGb2xkZXI6ICdVc2UgVHJhc2ggRm9sZGVyJyxcblx0dXNlVHJhc2hGb2xkZXJEZXNjOiAnTW92ZSBmaWxlcyB0byB0cmFzaCBmb2xkZXIgaW5zdGVhZCBvZiBkZWxldGluZyBkaXJlY3RseScsXG5cdHRyYXNoRm9sZGVyUGF0aDogJ1RyYXNoIEZvbGRlcicsXG5cdHRyYXNoRm9sZGVyUGF0aERlc2M6ICdQYXRoIHRvIHRyYXNoIGZvbGRlciAocmVsYXRpdmUgcGF0aCknLFxuXHRhdXRvQ2xlYW51cFRyYXNoOiAnQXV0byBDbGVhbnVwIFRyYXNoJyxcblx0YXV0b0NsZWFudXBUcmFzaERlc2M6ICdBdXRvbWF0aWNhbGx5IGNsZWFuIHVwIG9sZCBmaWxlcyBpbiB0cmFzaCBmb2xkZXInLFxuXHRhdXRvQ2xlYW51cENvbXBsZXRlOiAnQXV0byBjbGVhbnVwIGNvbXBsZXRlLCBkZWxldGVkIHtjb3VudH0gZmlsZXMnLFxuXHRjbGVhbnVwRGF5czogJ0NsZWFudXAgRGF5cycsXG5cdGNsZWFudXBEYXlzRGVzYzogJ0ZpbGVzIG9sZGVyIHRoYW4gdGhpcyBtYW55IGRheXMgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IGRlbGV0ZWQnLFxuXHRtZWRpYVR5cGVzOiAnTWVkaWEgVHlwZXMnLFxuXHRlbmFibGVJbWFnZVN1cHBvcnQ6ICdFbmFibGUgSW1hZ2UgU3VwcG9ydCcsXG5cdGVuYWJsZUltYWdlU3VwcG9ydERlc2M6ICdTaG93IGltYWdlIGZpbGVzIGluIG1lZGlhIGxpYnJhcnkgKHBuZywganBnLCBnaWYsIHdlYnAsIHN2ZywgYm1wKScsXG5cdGVuYWJsZVZpZGVvU3VwcG9ydDogJ0VuYWJsZSBWaWRlbyBTdXBwb3J0Jyxcblx0ZW5hYmxlVmlkZW9TdXBwb3J0RGVzYzogJ1Nob3cgdmlkZW8gZmlsZXMgaW4gbWVkaWEgbGlicmFyeSAobXA0LCBtb3YsIGF2aSwgbWt2LCB3ZWJtKScsXG5cdGVuYWJsZUF1ZGlvU3VwcG9ydDogJ0VuYWJsZSBBdWRpbyBTdXBwb3J0Jyxcblx0ZW5hYmxlQXVkaW9TdXBwb3J0RGVzYzogJ1Nob3cgYXVkaW8gZmlsZXMgaW4gbWVkaWEgbGlicmFyeSAobXAzLCB3YXYsIG9nZywgbTRhLCBmbGFjKScsXG5cdGVuYWJsZVBERlN1cHBvcnQ6ICdFbmFibGUgRG9jdW1lbnQgU3VwcG9ydCcsXG5cdGVuYWJsZVBERlN1cHBvcnREZXNjOiAnU2hvdyBkb2N1bWVudCBmaWxlcyBpbiBtZWRpYSBsaWJyYXJ5IChwZGYsIGRvYywgZG9jeCwgeGxzLCB4bHN4LCBwcHQsIHBwdHgpJyxcblx0dmlld1NldHRpbmdzOiAnVmlldyBTZXR0aW5ncycsXG5cdGludGVyZmFjZUxhbmd1YWdlOiAnSW50ZXJmYWNlIExhbmd1YWdlJyxcblx0bGFuZ3VhZ2VEZXNjOiAnQ2hvb3NlIGxhbmd1YWdlIGZvciBwbHVnaW4gaW50ZXJmYWNlJyxcblx0bGFuZ3VhZ2VTeXN0ZW06ICdGb2xsb3cgU3lzdGVtJyxcblx0cGFnZVNpemU6ICdQYWdlIFNpemUnLFxuXHRwYWdlU2l6ZURlc2M6ICdOdW1iZXIgb2YgZmlsZXMgcGVyIHBhZ2UgaW4gbWVkaWEgbGlicmFyeScsXG5cdFx0ZW5hYmxlUHJldmlld01vZGFsOiAnRW5hYmxlIFByZXZpZXcgTW9kYWwnLFxuXHRcdGVuYWJsZVByZXZpZXdNb2RhbERlc2M6ICdPcGVuIHByZXZpZXcgd2luZG93IHdoZW4gY2xpY2tpbmcgbWVkaWEgZmlsZXMnLFxuXHRcdGVuYWJsZUtleWJvYXJkTmF2OiAnRW5hYmxlIEtleWJvYXJkIE5hdmlnYXRpb24nLFxuXHRcdGVuYWJsZUtleWJvYXJkTmF2RGVzYzogJ1VzZSBhcnJvdyBrZXlzIHRvIG5hdmlnYXRlIGluIHByZXZpZXcgd2luZG93Jyxcblx0XHRzYWZlU2NhblNldHRpbmdzOiAnU2FmZSBTY2FuJyxcblx0XHRzYWZlU2NhbkVuYWJsZWREZXNjOiAnRW5hYmxlIGNvbmRpdGlvbmFsIHNjYW5uaW5nIGZyb20gdHJhc2ggbWFuYWdlbWVudCB2aWV3Jyxcblx0XHRzYWZlU2NhblVucmVmRGF5czogJ1VucmVmZXJlbmNlZCBEYXlzJyxcblx0XHRzYWZlU2NhblVucmVmRGF5c0Rlc2M6ICdPbmx5IHNjYW4gbWVkaWEgZmlsZXMgdW5yZWZlcmVuY2VkIGZvciBhdCBsZWFzdCB0aGlzIG1hbnkgZGF5cycsXG5cdFx0c2FmZVNjYW5NaW5TaXplOiAnTWluaW11bSBGaWxlIFNpemUgKE1CKScsXG5cdFx0c2FmZVNjYW5NaW5TaXplRGVzYzogJ09ubHkgc2NhbiBtZWRpYSBmaWxlcyBhdCBvciBhYm92ZSB0aGlzIHNpemUnLFxuXHRcdGR1cGxpY2F0ZURldGVjdGlvblNldHRpbmdzOiAnRHVwbGljYXRlIERldGVjdGlvbicsXG5cdFx0ZHVwbGljYXRlVGhyZXNob2xkU2V0dGluZzogJ1NpbWlsYXJpdHkgVGhyZXNob2xkJyxcblx0XHRkdXBsaWNhdGVUaHJlc2hvbGREZXNjOiAnT25seSBncm91cHMgYXQgb3IgYWJvdmUgdGhpcyBwZXJjZW50YWdlIGFyZSB0cmVhdGVkIGFzIGR1cGxpY2F0ZXMnLFxuXHRcdGtleWJvYXJkU2hvcnRjdXRzOiAnS2V5Ym9hcmQgU2hvcnRjdXRzJyxcblx0XHRzaG9ydGN1dHNEZXNjOiAnUGx1Z2luIGtleWJvYXJkIHNob3J0Y3V0czonLFxuXHRcdHNob3J0Y3V0T3BlbkxpYnJhcnk6ICdDdHJsK1NoaWZ0K00gLSBPcGVuIE1lZGlhIExpYnJhcnknLFxuXHRzaG9ydGN1dEZpbmRVbnJlZmVyZW5jZWQ6ICdDdHJsK1NoaWZ0K1UgLSBGaW5kIFVucmVmZXJlbmNlZCBNZWRpYScsXG5cdHNob3J0Y3V0T3BlblRyYXNoOiAnQ3RybCtTaGlmdCtUIC0gT3BlbiBUcmFzaCBNYW5hZ2VtZW50Jyxcblx0Y29tbWFuZHM6ICdDb21tYW5kcycsXG5cdGNvbW1hbmRzRGVzYzogJ1VzZSB0aGVzZSBjb21tYW5kcyBpbiBjb21tYW5kIHBhbGV0dGU6Jyxcblx0Y21kT3BlbkxpYnJhcnk6ICdNZWRpYSBMaWJyYXJ5IC0gT3BlbiBtZWRpYSBsaWJyYXJ5IHZpZXcnLFxuXHRjbWRGaW5kVW5yZWZlcmVuY2VkOiAnRmluZCBVbnJlZmVyZW5jZWQgTWVkaWEgLSBGaW5kIG1lZGlhIGZpbGVzIG5vdCByZWZlcmVuY2VkIGJ5IGFueSBub3RlcycsXG5cdGNtZFRyYXNoTWFuYWdlbWVudDogJ1RyYXNoIE1hbmFnZW1lbnQgLSBNYW5hZ2UgZGVsZXRlZCBmaWxlcycsXG5cdGNtZEFsaWduTGVmdDogJ0FsaWduIEltYWdlIExlZnQgLSBBbGlnbiBzZWxlY3RlZCBpbWFnZSB0byBsZWZ0Jyxcblx0Y21kQWxpZ25DZW50ZXI6ICdBbGlnbiBJbWFnZSBDZW50ZXIgLSBDZW50ZXIgYWxpZ24gc2VsZWN0ZWQgaW1hZ2UnLFxuXHRjbWRBbGlnblJpZ2h0OiAnQWxpZ24gSW1hZ2UgUmlnaHQgLSBBbGlnbiBzZWxlY3RlZCBpbWFnZSB0byByaWdodCcsXG5cblx0Ly8gVHJhc2ggTWFuYWdlbWVudCBWaWV3XG5cdGxvYWRpbmdUcmFzaEZpbGVzOiAnTG9hZGluZyB0cmFzaCBmaWxlcy4uLicsXG5cdHRyYXNoRm9sZGVyRW1wdHk6ICdUcmFzaCBmb2xkZXIgaXMgZW1wdHknLFxuXHRmaWxlc0luVHJhc2g6ICd7Y291bnR9IGZpbGVzIGluIHRyYXNoIGZvbGRlcicsXG5cdHRvdGFsU2l6ZTogJ1RvdGFsOiB7c2l6ZX0nLFxuXHR0cmFzaE1hbmFnZW1lbnREZXNjOiAnRGVsZXRlZCBmaWxlcyBhcmUgdGVtcG9yYXJpbHkgc3RvcmVkIGhlcmUuIFlvdSBjYW4gcmVzdG9yZSBvciBwZXJtYW5lbnRseSBkZWxldGUgdGhlbS4nLFxuXHRyZWZyZXNoOiAnUmVmcmVzaCcsXG5cdGNsZWFyVHJhc2g6ICdFbXB0eSBUcmFzaCcsXG5cdGNsZWFyVHJhc2hUb29sdGlwOiAnRW1wdHkgdHJhc2ggZm9sZGVyJyxcblx0cmVzdG9yZVRvb2x0aXA6ICdSZXN0b3JlIGZpbGUnLFxuXHRwZXJtYW5lbnREZWxldGU6ICdEZWxldGUnLFxuXHRwZXJtYW5lbnREZWxldGVUb29sdGlwOiAnUGVybWFuZW50bHkgZGVsZXRlJyxcblx0ZGVsZXRlZFRpbWU6ICdEZWxldGVkIGF0Jyxcblx0Y29uZmlybURlbGV0ZUZpbGU6ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gcGVybWFuZW50bHkgZGVsZXRlIFwie25hbWV9XCI/IFRoaXMgY2Fubm90IGJlIHVuZG9uZS4nLFxuXHRjb25maXJtQ2xlYXJUcmFzaDogJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBlbXB0eSB0aGUgdHJhc2ggZm9sZGVyPyB7Y291bnR9IGZpbGVzIHdpbGwgYmUgcGVybWFuZW50bHkgZGVsZXRlZC4gVGhpcyBjYW5ub3QgYmUgdW5kb25lLicsXG5cdGZpbGVEZWxldGVkOiAnUGVybWFuZW50bHkgZGVsZXRlZDoge25hbWV9Jyxcblx0cmVzdG9yZVN1Y2Nlc3M6ICdSZXN0b3JlZDoge25hbWV9Jyxcblx0cmVzdG9yZUZhaWxlZDogJ1Jlc3RvcmUgZmFpbGVkOiB7bWVzc2FnZX0nLFxuXHR0YXJnZXRGaWxlRXhpc3RzOiAnVGFyZ2V0IGZpbGUgYWxyZWFkeSBleGlzdHMnLFxuXHRkZWxldGVGYWlsZWQ6ICdEZWxldGUgZmFpbGVkJyxcblx0ZmlsZU5hbWVDb3BpZWQ6ICdGaWxlIG5hbWUgY29waWVkJyxcblx0b3JpZ2luYWxQYXRoQ29waWVkOiAnT3JpZ2luYWwgcGF0aCBjb3BpZWQnLFxuXG5cdC8vIFVucmVmZXJlbmNlZCBJbWFnZXMgVmlld1xuXHRzY2FubmluZ1VucmVmZXJlbmNlZDogJ1NjYW5uaW5nIHVucmVmZXJlbmNlZCBtZWRpYSBmaWxlcy4uLicsXG5cdHRvdGFsU2l6ZUxhYmVsOiAnVG90YWw6IHtzaXplfScsXG5cdHNjYW5FcnJvcjogJ0Vycm9yIHNjYW5uaW5nIGltYWdlcycsXG5cdHVucmVmZXJlbmNlZERlc2M6ICdUaGVzZSBtZWRpYSBmaWxlcyBhcmUgbm90IHJlZmVyZW5jZWQgYnkgYW55IG5vdGVzIGFuZCBjYW4gYmUgZGVsZXRlZCB0byBmcmVlIHVwIHNwYWNlJyxcblx0bm9GaWxlc1RvRGVsZXRlOiAnTm8gZmlsZXMgdG8gZGVsZXRlJyxcblx0cHJvY2Vzc2VkRmlsZXM6ICdQcm9jZXNzZWQge2NvdW50fSBmaWxlcycsXG5cdHByb2Nlc3NlZEZpbGVzRXJyb3I6ICdFcnJvciBwcm9jZXNzaW5nIHtlcnJvcnN9IGZpbGVzJyxcblx0Y29weUFsbFBhdGhzOiAnQ29weSBhbGwgcGF0aHMnLFxuXHRjb3BpZWRGaWxlUGF0aHM6ICdDb3BpZWQge2NvdW50fSBmaWxlIHBhdGhzJyxcblxuXHQvLyBJbWFnZSBMaWJyYXJ5IFZpZXdcblx0bm9NYXRjaGluZ0ZpbGVzOiAnTm8gbWF0Y2hpbmcgZmlsZXMnLFxuXHRwcmV2UGFnZTogJ1ByZXZpb3VzJyxcblx0bmV4dFBhZ2U6ICdOZXh0Jyxcblx0cGFnZUluZm86ICdQYWdlIHtjdXJyZW50fSAvIHt0b3RhbH0nLFxuXHRzZWxlY3RGaWxlczogJ3tjb3VudH0gZmlsZXMgc2VsZWN0ZWQnLFxuXHRzZWxlY3RBbGw6ICdTZWxlY3QgQWxsJyxcblx0ZGVzZWxlY3RBbGw6ICdEZXNlbGVjdCBBbGwnLFxuXHRjb25maXJtRGVsZXRlU2VsZWN0ZWQ6ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHtjb3VudH0gc2VsZWN0ZWQgZmlsZXM/Jyxcblx0ZGVsZXRlZEZpbGVzOiAne2NvdW50fSBmaWxlcyBkZWxldGVkJyxcblx0ZGVsZXRlRmlsZXNGYWlsZWQ6ICdGYWlsZWQgdG8gZGVsZXRlIHtjb3VudH0gZmlsZXMnLFxuXHRtdWx0aVNlbGVjdE1vZGU6ICdNdWx0aS1zZWxlY3QgbW9kZScsXG5cblx0Ly8gTWVkaWEgUHJldmlld1xuXHR1bnN1cHBvcnRlZEZpbGVUeXBlOiAnUHJldmlldyBub3Qgc3VwcG9ydGVkIGZvciB0aGlzIGZpbGUgdHlwZScsXG5cdGRvY3VtZW50RW1iZWRQcmV2aWV3VW5zdXBwb3J0ZWQ6ICdFbWJlZGRlZCBwcmV2aWV3IGlzIG5vdCBzdXBwb3J0ZWQgZm9yIHRoaXMgZG9jdW1lbnQgdHlwZS4gVXNlIFwiT3BlbiBPcmlnaW5hbFwiLicsXG5cdGNvcHlQYXRoQnRuOiAnQ29weSBQYXRoJyxcblx0Y29weUxpbmtCdG46ICdDb3B5IExpbmsnLFxuXHRmaW5kSW5Ob3RlczogJ0ZpbmQgaW4gTm90ZXMnLFxuXHRwYXRoQ29waWVkOiAnUGF0aCBjb3BpZWQnLFxuXHRsaW5rQ29waWVkOiAnTGluayBjb3BpZWQnLFxuXHRpbWFnZUxvYWRFcnJvcjogJ0ltYWdlIGZhaWxlZCB0byBsb2FkJyxcblxuXHQvLyBJbWFnZSBhbGlnbm1lbnRcblx0YWxpZ25JbWFnZUxlZnQ6ICdBbGlnbiBJbWFnZSBMZWZ0Jyxcblx0YWxpZ25JbWFnZUNlbnRlcjogJ0FsaWduIEltYWdlIENlbnRlcicsXG5cdGFsaWduSW1hZ2VSaWdodDogJ0FsaWduIEltYWdlIFJpZ2h0Jyxcblx0c2VsZWN0SW1hZ2VGaXJzdDogJ1BsZWFzZSBzZWxlY3QgYW4gaW1hZ2UgZmlyc3QnLFxuXHRzZWxlY3RJbWFnZTogJ1BsZWFzZSBzZWxlY3QgYW4gaW1hZ2UnLFxuXHRpbWFnZUFsaWduZWRMZWZ0OiAnSW1hZ2UgYWxpZ25lZCB0byBsZWZ0Jyxcblx0aW1hZ2VBbGlnbmVkQ2VudGVyOiAnSW1hZ2UgY2VudGVyZWQnLFxuXHRpbWFnZUFsaWduZWRSaWdodDogJ0ltYWdlIGFsaWduZWQgdG8gcmlnaHQnLFxuXG5cdC8vIFRyYXNoIGZvbGRlciBvcGVyYXRpb25zXG5cdGNvcGllZEZpbGVOYW1lOiAnRmlsZSBuYW1lIGNvcGllZCcsXG5cdGNvcGllZE9yaWdpbmFsUGF0aDogJ09yaWdpbmFsIHBhdGggY29waWVkJyxcblx0bm90UmVmZXJlbmNlZDogJ1RoaXMgaW1hZ2UgaXMgbm90IHJlZmVyZW5jZWQgYnkgYW55IG5vdGVzJyxcblx0bW92ZWRUb1RyYXNoOiAnTW92ZWQgdG8gdHJhc2ggZm9sZGVyOiB7bmFtZX0nLFxuXHRkZWxldGVkRmlsZTogJ0RlbGV0ZWQ6IHtuYW1lfScsXG5cdHJlc3RvcmVkRmlsZTogJ0ZpbGUgcmVzdG9yZWQnLFxuXG5cdC8vIENvbW1hbmQgbmFtZXNcblx0Y21kSW1hZ2VMaWJyYXJ5OiAnSW1hZ2UgTGlicmFyeScsXG5cdGNtZEZpbmRVbnJlZmVyZW5jZWRJbWFnZXM6ICdGaW5kIFVucmVmZXJlbmNlZCBJbWFnZXMnLFxuXHRjbWRSZWZyZXNoQ2FjaGU6ICdSZWZyZXNoIE1lZGlhIFJlZmVyZW5jZSBDYWNoZScsXG5cdGNtZEFsaWduSW1hZ2VMZWZ0OiAnQWxpZ24gSW1hZ2UgTGVmdCcsXG5cdGNtZEFsaWduSW1hZ2VDZW50ZXI6ICdBbGlnbiBJbWFnZSBDZW50ZXInLFxuXHRjbWRBbGlnbkltYWdlUmlnaHQ6ICdBbGlnbiBJbWFnZSBSaWdodCcsXG5cdGNtZE9wZW5NZWRpYUxpYnJhcnk6ICdPcGVuIE1lZGlhIExpYnJhcnknLFxuXHRjbWRGaW5kVW5yZWZlcmVuY2VkTWVkaWE6ICdGaW5kIFVucmVmZXJlbmNlZCBNZWRpYScsXG5cdGNtZE9wZW5UcmFzaE1hbmFnZW1lbnQ6ICdPcGVuIFRyYXNoIE1hbmFnZW1lbnQnLFxuXG5cdC8vIERlbGV0ZSBvcGVyYXRpb25zXG5cdGRlbGV0ZUZhaWxlZFdpdGhOYW1lOiAnRGVsZXRlIGZhaWxlZDoge25hbWV9Jyxcblx0ZGVsZXRlZFdpdGhRdWFyYW50aW5lRmFpbGVkOiAnRGVsZXRlZDoge25hbWV9IChxdWFyYW50aW5lIGZhaWxlZCknLFxuXHRvcGVyYXRpb25GYWlsZWQ6ICdPcGVyYXRpb24gZmFpbGVkOiB7bmFtZX0nLFxuXHRwcm9jZXNzaW5nOiAnUHJvY2Vzc2luZy4uLicsXG5cblx0Ly8gdjIuMCBuZXdcblx0ZHVwbGljYXRlRGV0ZWN0aW9uOiAnRHVwbGljYXRlIERldGVjdGlvbicsXG5cdGR1cGxpY2F0ZURldGVjdGlvbkRlc2M6ICdEZXRlY3QgcGl4ZWwtbGV2ZWwgZHVwbGljYXRlIGltYWdlcyB1c2luZyBwZXJjZXB0dWFsIGhhc2hpbmcgYWxnb3JpdGhtJyxcblx0bm9EdXBsaWNhdGVzRm91bmQ6ICdObyBkdXBsaWNhdGVzIGZvdW5kLiBDbGljayBcIlN0YXJ0IFNjYW5cIiB0byBkZXRlY3QuJyxcblx0c3RhcnRTY2FuOiAnU3RhcnQgU2NhbicsXG5cdHNjYW5Qcm9ncmVzczogJ1NjYW5uaW5nOiB7Y3VycmVudH0ve3RvdGFsfScsXG5cdHNpbWlsYXJpdHlUaHJlc2hvbGQ6ICdTaW1pbGFyaXR5IHRocmVzaG9sZDoge3ZhbHVlfSUnLFxuXHRkdXBsaWNhdGVHcm91cHNGb3VuZDogJ0ZvdW5kIHtncm91cHN9IGdyb3VwKHMpLCB7ZmlsZXN9IHJlZHVuZGFudCBmaWxlKHMpJyxcblx0ZHVwbGljYXRlR3JvdXA6ICdHcm91cCAje2luZGV4fScsXG5cdGZpbGVzOiAnZmlsZXMnLFxuXHRzdWdnZXN0S2VlcDogJ1x1MjcwNSBLZWVwJyxcblx0cXVhcmFudGluZTogJ1F1YXJhbnRpbmUnLFxuXHRxdWFyYW50aW5lQWxsRHVwbGljYXRlczogJ1F1YXJhbnRpbmUgQWxsIER1cGxpY2F0ZXMnLFxuXHRkdXBsaWNhdGVzRm91bmQ6ICdGb3VuZCB7Z3JvdXBzfSBncm91cChzKSwge2ZpbGVzfSByZWR1bmRhbnQgZmlsZShzKScsXG5cdGR1cGxpY2F0ZXNRdWFyYW50aW5lZDogJ1F1YXJhbnRpbmVkIHtjb3VudH0gZHVwbGljYXRlIGZpbGUocyknLFxuXHR0eXBlRGlzdHJpYnV0aW9uOiAnVHlwZSBEaXN0cmlidXRpb24nLFxuXHR1bnJlZmVyZW5jZWRSYXRlOiAnVW5yZWZlcmVuY2VkIFJhdGUnLFxuXHRyZWZlcmVuY2VkQnk6ICdSZWZlcmVuY2VkIGJ5IHtjb3VudH0gbm90ZShzKScsXG5cdHNlbGVjdGVkQ291bnQ6ICd7Y291bnR9IHNlbGVjdGVkJyxcblx0YmF0Y2hSZXN0b3JlOiAnQmF0Y2ggUmVzdG9yZScsXG5cdGJhdGNoRGVsZXRlOiAnQmF0Y2ggRGVsZXRlJyxcblx0bm9JdGVtc1NlbGVjdGVkOiAnUGxlYXNlIHNlbGVjdCBmaWxlcyBmaXJzdCcsXG5cdGNvbmZpcm1CYXRjaFJlc3RvcmU6ICdSZXN0b3JlIHtjb3VudH0gZmlsZShzKT8nLFxuXHRiYXRjaFJlc3RvcmVDb21wbGV0ZWQ6ICdSZXN0b3JlZCB7Y291bnR9IGZpbGUocyknLFxuXHRzYWZlU2NhbjogJ1NhZmUgU2NhbicsXG5cdHNhZmVTY2FuRGVzYzogJ0F1dG8tZGV0ZWN0IHVucmVmZXJlbmNlZCwgb2xkLCBhbmQgbGFyZ2UgbWVkaWEgZmlsZXMnLFxuXHRzYWZlU2NhblN0YXJ0ZWQ6ICdTdGFydGluZyBzYWZlIHNjYW4uLi4nLFxuXHRzYWZlU2Nhbk5vUmVzdWx0czogJ05vIGZpbGVzIG1hdGNoIHRoZSBjcml0ZXJpYScsXG5cdHNhZmVTY2FuQ29uZmlybTogJ0ZvdW5kIHtjb3VudH0gZmlsZShzKSBtYXRjaGluZyBjcml0ZXJpYSAodW5yZWZlcmVuY2VkID57ZGF5c30gZGF5cyArIHNpemUgPntzaXplfSkuIFNlbmQgdG8gcXVhcmFudGluZT8nLFxuXHRzYWZlU2NhbkNvbXBsZXRlOiAnU2FmZSBzY2FuIGNvbXBsZXRlLCBxdWFyYW50aW5lZCB7Y291bnR9IGZpbGUocyknLFxuXHRzYWZlU2NhbkZhaWxlZDogJ1NhZmUgc2NhbiBmYWlsZWQnLFxuXHRjbWREdXBsaWNhdGVEZXRlY3Rpb246ICdPcGVuIER1cGxpY2F0ZSBEZXRlY3Rpb24nLFxuXHRvcmdhbml6aW5nOiAnT3JnYW5pemluZycsXG5cdG9yZ2FuaXplQ29tcGxldGU6ICdPcmdhbml6ZWQge2NvdW50fSBmaWxlKHMpJ1xufTtcblxuY29uc3QgdHJhbnNsYXRpb25zOiBSZWNvcmQ8TGFuZ3VhZ2UsIFRyYW5zbGF0aW9ucz4gPSB7IHpoLCBlbiB9O1xuXG4vKipcbiAqIFx1ODNCN1x1NTNENlx1N0ZGQlx1OEJEMVxuICovXG5leHBvcnQgZnVuY3Rpb24gdChsYW5nOiBMYW5ndWFnZSwga2V5OiBrZXlvZiBUcmFuc2xhdGlvbnMsIHBhcmFtcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj4pOiBzdHJpbmcge1xuXHRsZXQgdGV4dCA9ICh0cmFuc2xhdGlvbnNbbGFuZ10gPz8gdHJhbnNsYXRpb25zWyd6aCddKVtrZXldIHx8IHRyYW5zbGF0aW9uc1snemgnXVtrZXldIHx8IGtleTtcblxuXHRpZiAocGFyYW1zKSB7XG5cdFx0T2JqZWN0LmVudHJpZXMocGFyYW1zKS5mb3JFYWNoKChbaywgdl0pID0+IHtcblx0XHRcdHRleHQgPSB0ZXh0LnNwbGl0KGB7JHtrfX1gKS5qb2luKFN0cmluZyh2KSk7XG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gdGV4dDtcbn1cblxuLyoqXG4gKiBcdTgzQjdcdTUzRDZcdTdDRkJcdTdFREZcdThCRURcdThBMDBcdThCQkVcdTdGNkVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN5c3RlbUxhbmd1YWdlKCk6IExhbmd1YWdlIHtcblx0Ly8gXHU2OEMwXHU2N0U1IG5hdmlnYXRvciBcdTY2MkZcdTU0MjZcdTVCNThcdTU3MjhcdUZGMDhcdTk3NUVcdTZENEZcdTg5QzhcdTU2NjhcdTczQUZcdTU4ODNcdTUzRUZcdTgwRkRcdTRFMERcdTVCNThcdTU3MjhcdUZGMDlcblx0Y29uc3QgbmF2TGFuZ3VhZ2UgPSB0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyA/IG5hdmlnYXRvci5sYW5ndWFnZSA6IG51bGw7XG5cdGNvbnN0IGxhbmcgPSBuYXZMYW5ndWFnZSA/IG5hdkxhbmd1YWdlLnRvTG93ZXJDYXNlKCkgOiAnemgnO1xuXHRpZiAobGFuZy5zdGFydHNXaXRoKCd6aCcpKSByZXR1cm4gJ3poJztcblx0cmV0dXJuICdlbic7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHsgdCwgZ2V0U3lzdGVtTGFuZ3VhZ2UsIHpoLCBlbiB9O1xuIiwgIi8qKlxuICogXHU1ODlFXHU5MUNGXHU2NTg3XHU0RUY2XHU2MjZCXHU2M0NGICsgXHU2NTg3XHU0RUY2XHU3NkQxXHU4OUM2XHU1NjY4XG4gKiBcdTdFRjRcdTYyQTRcdTUxODVcdTVCNThcdTRFMkRcdTc2ODRcdTVBOTJcdTRGNTNcdTY1ODdcdTRFRjZcdTdEMjJcdTVGMTVcdUZGMENcdTkwN0ZcdTUxNERcdTZCQ0ZcdTZCMjFcdTg5QzZcdTU2RkVcdTUyMzdcdTY1QjBcdTUxNjhcdTkxQ0ZcdTkwNERcdTUzODYgVmF1bHRcbiAqL1xuXG5pbXBvcnQgeyBURmlsZSwgVEFic3RyYWN0RmlsZSwgVmF1bHQsIEV2ZW50cyB9IGZyb20gJ29ic2lkaWFuJztcbmltcG9ydCB7IGlzTWVkaWFGaWxlIH0gZnJvbSAnLi9tZWRpYVR5cGVzJztcbmltcG9ydCB7IFRodW1ibmFpbENhY2hlIH0gZnJvbSAnLi90aHVtYm5haWxDYWNoZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmlsZUVudHJ5IHtcblx0cGF0aDogc3RyaW5nO1xuXHRuYW1lOiBzdHJpbmc7XG5cdHNpemU6IG51bWJlcjtcblx0bXRpbWU6IG51bWJlcjtcblx0ZXh0ZW5zaW9uOiBzdHJpbmc7XG59XG5cbnR5cGUgQ2hhbmdlVHlwZSA9ICdjcmVhdGUnIHwgJ21vZGlmeScgfCAnZGVsZXRlJyB8ICdyZW5hbWUnO1xudHlwZSBDaGFuZ2VMaXN0ZW5lciA9ICh0eXBlOiBDaGFuZ2VUeXBlLCBlbnRyeTogRmlsZUVudHJ5LCBvbGRQYXRoPzogc3RyaW5nKSA9PiB2b2lkO1xuXG5leHBvcnQgY2xhc3MgTWVkaWFGaWxlSW5kZXgge1xuXHRwcml2YXRlIGluZGV4OiBNYXA8c3RyaW5nLCBGaWxlRW50cnk+ID0gbmV3IE1hcCgpO1xuXHRwcml2YXRlIHZhdWx0OiBWYXVsdDtcblx0cHJpdmF0ZSB0aHVtYm5haWxDYWNoZTogVGh1bWJuYWlsQ2FjaGUgfCBudWxsO1xuXHRwcml2YXRlIGxpc3RlbmVyczogQ2hhbmdlTGlzdGVuZXJbXSA9IFtdO1xuXHRwcml2YXRlIGVuYWJsZWRFeHRlbnNpb25zOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoKTtcblx0cHJpdmF0ZSB0cmFzaEZvbGRlcjogc3RyaW5nID0gJyc7XG5cdHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuXHRjb25zdHJ1Y3Rvcih2YXVsdDogVmF1bHQsIHRodW1ibmFpbENhY2hlOiBUaHVtYm5haWxDYWNoZSB8IG51bGwgPSBudWxsKSB7XG5cdFx0dGhpcy52YXVsdCA9IHZhdWx0O1xuXHRcdHRoaXMudGh1bWJuYWlsQ2FjaGUgPSB0aHVtYm5haWxDYWNoZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTY2RjRcdTY1QjBcdTU0MkZcdTc1MjhcdTc2ODRcdTYyNjlcdTVDNTVcdTU0MERcdUZGMDhcdThCQkVcdTdGNkVcdTUzRDhcdTY2RjRcdTY1RjZcdThDMDNcdTc1MjhcdUZGMDlcblx0ICovXG5cdHNldEVuYWJsZWRFeHRlbnNpb25zKGV4dGVuc2lvbnM6IHN0cmluZ1tdKTogdm9pZCB7XG5cdFx0dGhpcy5lbmFibGVkRXh0ZW5zaW9ucyA9IG5ldyBTZXQoZXh0ZW5zaW9ucy5tYXAoZSA9PiBlLnRvTG93ZXJDYXNlKCkpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdThCQkVcdTdGNkVcdTk2OTRcdTc5QkJcdTY1ODdcdTRFRjZcdTU5MzlcdThERUZcdTVGODRcdUZGMDhcdTYzOTJcdTk2NjRcdThCRTVcdTY1ODdcdTRFRjZcdTU5MzlcdTUxODVcdTc2ODRcdTY1ODdcdTRFRjZcdUZGMDlcblx0ICovXG5cdHNldFRyYXNoRm9sZGVyKHBhdGg6IHN0cmluZyk6IHZvaWQge1xuXHRcdHRoaXMudHJhc2hGb2xkZXIgPSBwYXRoO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTIyNFx1NjVBRFx1NjU4N1x1NEVGNlx1NjYyRlx1NTQyNlx1NTcyOFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1NEUyRFxuXHQgKi9cblx0cHJpdmF0ZSBpc0luVHJhc2hGb2xkZXIoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRcdGlmICghdGhpcy50cmFzaEZvbGRlcikgcmV0dXJuIGZhbHNlO1xuXHRcdHJldHVybiBmaWxlUGF0aC5zdGFydHNXaXRoKHRoaXMudHJhc2hGb2xkZXIgKyAnLycpIHx8IGZpbGVQYXRoID09PSB0aGlzLnRyYXNoRm9sZGVyO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NTIyNFx1NjVBRFx1NjU4N1x1NEVGNlx1NjYyRlx1NTQyNlx1NUU5NFx1OEJFNVx1ODhBQlx1N0QyMlx1NUYxNVxuXHQgKi9cblx0cHJpdmF0ZSBzaG91bGRJbmRleChmaWxlOiBUQWJzdHJhY3RGaWxlKTogYm9vbGVhbiB7XG5cdFx0aWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkgcmV0dXJuIGZhbHNlO1xuXHRcdGlmICh0aGlzLmlzSW5UcmFzaEZvbGRlcihmaWxlLnBhdGgpKSByZXR1cm4gZmFsc2U7XG5cblx0XHRjb25zdCBleHQgPSAnLicgKyBmaWxlLmV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICh0aGlzLmVuYWJsZWRFeHRlbnNpb25zLnNpemUgPiAwKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5lbmFibGVkRXh0ZW5zaW9ucy5oYXMoZXh0KTtcblx0XHR9XG5cdFx0cmV0dXJuIGlzTWVkaWFGaWxlKGZpbGUubmFtZSk7XG5cdH1cblxuXHQvKipcblx0ICogXHU0RUNFIFRGaWxlIFx1NTIxQlx1NUVGQSBGaWxlRW50cnlcblx0ICovXG5cdHByaXZhdGUgdG9FbnRyeShmaWxlOiBURmlsZSk6IEZpbGVFbnRyeSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHBhdGg6IGZpbGUucGF0aCxcblx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdHNpemU6IGZpbGUuc3RhdC5zaXplLFxuXHRcdFx0bXRpbWU6IGZpbGUuc3RhdC5tdGltZSxcblx0XHRcdGV4dGVuc2lvbjogZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKVxuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogXHU5OTk2XHU2QjIxXHU1MTY4XHU5MUNGXHU2MjZCXHU2M0NGXHVGRjBDXHU1RUZBXHU3QUNCXHU3RDIyXHU1RjE1XG5cdCAqL1xuXHRhc3luYyBmdWxsU2NhbigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0aGlzLmluZGV4LmNsZWFyKCk7XG5cblx0XHRjb25zdCBhbGxGaWxlcyA9IHRoaXMudmF1bHQuZ2V0RmlsZXMoKTtcblx0XHRmb3IgKGNvbnN0IGZpbGUgb2YgYWxsRmlsZXMpIHtcblx0XHRcdGlmICh0aGlzLnNob3VsZEluZGV4KGZpbGUpKSB7XG5cdFx0XHRcdHRoaXMuaW5kZXguc2V0KGZpbGUucGF0aCwgdGhpcy50b0VudHJ5KGZpbGUpKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTY1ODdcdTRFRjZcdTUzRDhcdTUzMTZcdTRFOEJcdTRFRjZcdTU5MDRcdTc0MDZcdTU2NjhcdUZGMDhcdTc1MzEgVmF1bHQgXHU0RThCXHU0RUY2XHU1NkRFXHU4QzAzXHU4QzAzXHU3NTI4XHVGRjA5XG5cdCAqL1xuXHRvbkZpbGVDcmVhdGVkKGZpbGU6IFRBYnN0cmFjdEZpbGUpOiB2b2lkIHtcblx0XHRpZiAoIXRoaXMuc2hvdWxkSW5kZXgoZmlsZSkpIHJldHVybjtcblx0XHRjb25zdCBlbnRyeSA9IHRoaXMudG9FbnRyeShmaWxlIGFzIFRGaWxlKTtcblx0XHR0aGlzLmluZGV4LnNldChlbnRyeS5wYXRoLCBlbnRyeSk7XG5cdFx0dGhpcy5ub3RpZnlMaXN0ZW5lcnMoJ2NyZWF0ZScsIGVudHJ5KTtcblx0fVxuXG5cdG9uRmlsZU1vZGlmaWVkKGZpbGU6IFRBYnN0cmFjdEZpbGUpOiB2b2lkIHtcblx0XHRpZiAoIXRoaXMuc2hvdWxkSW5kZXgoZmlsZSkpIHJldHVybjtcblx0XHRjb25zdCBlbnRyeSA9IHRoaXMudG9FbnRyeShmaWxlIGFzIFRGaWxlKTtcblx0XHR0aGlzLmluZGV4LnNldChlbnRyeS5wYXRoLCBlbnRyeSk7XG5cdFx0dGhpcy5ub3RpZnlMaXN0ZW5lcnMoJ21vZGlmeScsIGVudHJ5KTtcblx0fVxuXG5cdG9uRmlsZURlbGV0ZWQoZmlsZTogVEFic3RyYWN0RmlsZSk6IHZvaWQge1xuXHRcdGNvbnN0IHBhdGggPSBmaWxlLnBhdGg7XG5cdFx0Y29uc3QgZXhpc3RpbmcgPSB0aGlzLmluZGV4LmdldChwYXRoKTtcblx0XHRpZiAoIWV4aXN0aW5nKSByZXR1cm47XG5cblx0XHR0aGlzLmluZGV4LmRlbGV0ZShwYXRoKTtcblxuXHRcdC8vIFx1NkUwNVx1NzQwNlx1N0YyOVx1NzU2NVx1NTZGRVx1N0YxM1x1NUI1OFxuXHRcdGlmICh0aGlzLnRodW1ibmFpbENhY2hlKSB7XG5cdFx0XHR2b2lkIHRoaXMudGh1bWJuYWlsQ2FjaGUuZGVsZXRlKHBhdGgpO1xuXHRcdH1cblxuXHRcdHRoaXMubm90aWZ5TGlzdGVuZXJzKCdkZWxldGUnLCBleGlzdGluZyk7XG5cdH1cblxuXHRvbkZpbGVSZW5hbWVkKGZpbGU6IFRBYnN0cmFjdEZpbGUsIG9sZFBhdGg6IHN0cmluZyk6IHZvaWQge1xuXHRcdGNvbnN0IG9sZEVudHJ5ID0gdGhpcy5pbmRleC5nZXQob2xkUGF0aCk7XG5cblx0XHQvLyBcdTRFQ0VcdTY1RTdcdThERUZcdTVGODRcdTRFMkRcdTc5RkJcdTk2NjRcblx0XHRpZiAob2xkRW50cnkpIHtcblx0XHRcdHRoaXMuaW5kZXguZGVsZXRlKG9sZFBhdGgpO1xuXHRcdH1cblxuXHRcdC8vIFx1NTk4Mlx1Njc5Q1x1NjVCMFx1OERFRlx1NUY4NFx1NEVDRFx1NzEzNlx1NjYyRlx1NUE5Mlx1NEY1M1x1NjU4N1x1NEVGNlx1RkYwQ1x1NkRGQlx1NTJBMFx1NTIzMFx1N0QyMlx1NUYxNVxuXHRcdGlmICh0aGlzLnNob3VsZEluZGV4KGZpbGUpKSB7XG5cdFx0XHRjb25zdCBuZXdFbnRyeSA9IHRoaXMudG9FbnRyeShmaWxlIGFzIFRGaWxlKTtcblx0XHRcdHRoaXMuaW5kZXguc2V0KG5ld0VudHJ5LnBhdGgsIG5ld0VudHJ5KTtcblxuXHRcdFx0Ly8gXHU4RkMxXHU3OUZCXHU3RjI5XHU3NTY1XHU1NkZFXHU3RjEzXHU1QjU4XG5cdFx0XHRpZiAodGhpcy50aHVtYm5haWxDYWNoZSkge1xuXHRcdFx0XHR2b2lkIHRoaXMudGh1bWJuYWlsQ2FjaGUucmVuYW1lKG9sZFBhdGgsIG5ld0VudHJ5LnBhdGgpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm5vdGlmeUxpc3RlbmVycygncmVuYW1lJywgbmV3RW50cnksIG9sZFBhdGgpO1xuXHRcdH0gZWxzZSBpZiAob2xkRW50cnkpIHtcblx0XHRcdC8vIFx1NjU4N1x1NEVGNlx1NEVDRVx1NUE5Mlx1NEY1M1x1NTNEOFx1NEUzQVx1OTc1RVx1NUE5Mlx1NEY1M1x1RkYwOFx1NEY4Qlx1NTk4Mlx1OTFDRFx1NTQ3RFx1NTQwRFx1NTIzMFx1OTY5NFx1NzlCQlx1NjU4N1x1NEVGNlx1NTkzOVx1RkYwOVxuXHRcdFx0aWYgKHRoaXMudGh1bWJuYWlsQ2FjaGUpIHtcblx0XHRcdFx0dm9pZCB0aGlzLnRodW1ibmFpbENhY2hlLmRlbGV0ZShvbGRQYXRoKTtcblx0XHRcdH1cblx0XHRcdHRoaXMubm90aWZ5TGlzdGVuZXJzKCdkZWxldGUnLCBvbGRFbnRyeSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1ODNCN1x1NTNENlx1NUY1M1x1NTI0RFx1N0QyMlx1NUYxNVx1NzY4NFx1NjI0MFx1NjcwOVx1NjU4N1x1NEVGNlxuXHQgKi9cblx0Z2V0RmlsZXMoKTogRmlsZUVudHJ5W10ge1xuXHRcdHJldHVybiBBcnJheS5mcm9tKHRoaXMuaW5kZXgudmFsdWVzKCkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1ODNCN1x1NTNENlx1NjU4N1x1NEVGNlx1NjU3MFx1OTFDRlxuXHQgKi9cblx0Z2V0IHNpemUoKTogbnVtYmVyIHtcblx0XHRyZXR1cm4gdGhpcy5pbmRleC5zaXplO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NjYyRlx1NTQyNlx1NURGMlx1NUI4Q1x1NjIxMFx1NTIxRFx1NTlDQlx1NjI2Qlx1NjNDRlxuXHQgKi9cblx0Z2V0IGlzSW5pdGlhbGl6ZWQoKTogYm9vbGVhbiB7XG5cdFx0cmV0dXJuIHRoaXMuaW5pdGlhbGl6ZWQ7XG5cdH1cblxuXHQvKipcblx0ICogXHU2MzA5XHU4REVGXHU1Rjg0XHU4M0I3XHU1M0Q2XHU1MzU1XHU0RTJBXHU2NzYxXHU3NkVFXG5cdCAqL1xuXHRnZXRFbnRyeShwYXRoOiBzdHJpbmcpOiBGaWxlRW50cnkgfCB1bmRlZmluZWQge1xuXHRcdHJldHVybiB0aGlzLmluZGV4LmdldChwYXRoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcdTZDRThcdTUxOENcdTUzRDhcdTUzMTZcdTc2RDFcdTU0MkNcdTU2Njhcblx0ICovXG5cdG9uQ2hhbmdlKGxpc3RlbmVyOiBDaGFuZ2VMaXN0ZW5lcik6IHZvaWQge1xuXHRcdHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFx1NzlGQlx1OTY2NFx1NTNEOFx1NTMxNlx1NzZEMVx1NTQyQ1x1NTY2OFxuXHQgKi9cblx0b2ZmQ2hhbmdlKGxpc3RlbmVyOiBDaGFuZ2VMaXN0ZW5lcik6IHZvaWQge1xuXHRcdGNvbnN0IGlkeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuXHRcdGlmIChpZHggPj0gMCkge1xuXHRcdFx0dGhpcy5saXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFx1OTAxQVx1NzdFNVx1NjI0MFx1NjcwOVx1NzZEMVx1NTQyQ1x1NTY2OFxuXHQgKi9cblx0cHJpdmF0ZSBub3RpZnlMaXN0ZW5lcnModHlwZTogQ2hhbmdlVHlwZSwgZW50cnk6IEZpbGVFbnRyeSwgb2xkUGF0aD86IHN0cmluZyk6IHZvaWQge1xuXHRcdGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGxpc3RlbmVyKHR5cGUsIGVudHJ5LCBvbGRQYXRoKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ01lZGlhRmlsZUluZGV4IGxpc3RlbmVyIGVycm9yOicsIGVycm9yKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogXHU2RTA1XHU5NjY0XHU3RDIyXHU1RjE1XG5cdCAqL1xuXHRjbGVhcigpOiB2b2lkIHtcblx0XHR0aGlzLmluZGV4LmNsZWFyKCk7XG5cdFx0dGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuXHR9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxvQkFBb0c7OztBQ0FwRyxzQkFBZ0Y7OztBQ1N6RSxTQUFTLGVBQWUsT0FBdUI7QUFDckQsTUFBSSxDQUFDLE9BQU8sU0FBUyxLQUFLLEtBQUssU0FBUyxFQUFHLFFBQU87QUFDbEQsUUFBTSxJQUFJO0FBQ1YsUUFBTSxRQUFRLENBQUMsS0FBSyxNQUFNLE1BQU0sSUFBSTtBQUNwQyxRQUFNLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLEtBQUssTUFBTSxLQUFLLElBQUksS0FBSyxJQUFJLEtBQUssSUFBSSxDQUFDLENBQUMsR0FBRyxNQUFNLFNBQVMsQ0FBQyxDQUFDO0FBQzNGLFNBQU8sWUFBWSxRQUFRLEtBQUssSUFBSSxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3ZFO0FBUU8sU0FBUyxTQUNmLElBQ0EsT0FDbUM7QUFDbkMsTUFBSSxZQUFrRDtBQUV0RCxTQUFPLElBQUksU0FBd0I7QUFDbEMsUUFBSSxXQUFXO0FBQ2QsbUJBQWEsU0FBUztBQUFBLElBQ3ZCO0FBQ0EsZ0JBQVksV0FBVyxNQUFNO0FBQzVCLFNBQUcsR0FBRyxJQUFJO0FBQUEsSUFDWCxHQUFHLEtBQUs7QUFBQSxFQUNUO0FBQ0Q7OztBQzFCTyxTQUFTLG1CQUFtQixPQUF1QjtBQUN6RCxNQUFJLE9BQU8sVUFBVSxTQUFVLFFBQU87QUFFdEMsTUFBSSxhQUFhLE1BQU0sS0FBSyxFQUFFLFFBQVEsT0FBTyxHQUFHO0FBQ2hELGVBQWEsV0FBVyxRQUFRLFdBQVcsR0FBRztBQUM5QyxlQUFhLFdBQVcsUUFBUSxRQUFRLEVBQUU7QUFFMUMsU0FBTyxXQUFXLFdBQVcsSUFBSSxHQUFHO0FBQ25DLGlCQUFhLFdBQVcsTUFBTSxDQUFDO0FBQUEsRUFDaEM7QUFFQSxlQUFhLFdBQVcsUUFBUSxRQUFRLEVBQUU7QUFDMUMsU0FBTztBQUNSO0FBS08sU0FBUyxvQkFBb0IsT0FBdUI7QUFDMUQsUUFBTSxhQUFhLG1CQUFtQixLQUFLO0FBQzNDLE1BQUksQ0FBQyxXQUFZLFFBQU87QUFDeEIsUUFBTSxRQUFRLFdBQVcsTUFBTSxHQUFHO0FBQ2xDLFNBQU8sTUFBTSxNQUFNLFNBQVMsQ0FBQyxLQUFLO0FBQ25DO0FBS08sU0FBUyxjQUFjLE9BQXVCO0FBQ3BELFFBQU0sYUFBYSxtQkFBbUIsS0FBSztBQUMzQyxNQUFJLENBQUMsV0FBWSxRQUFPO0FBQ3hCLFFBQU0sTUFBTSxXQUFXLFlBQVksR0FBRztBQUN0QyxTQUFPLFFBQVEsS0FBSyxLQUFLLFdBQVcsTUFBTSxHQUFHLEdBQUc7QUFDakQ7QUFLTyxTQUFTLHVCQUF1QixPQUF1QjtBQUM3RCxNQUFJO0FBQ0gsV0FBTyxtQkFBbUIsS0FBSztBQUFBLEVBQ2hDLFFBQVE7QUFDUCxXQUFPO0FBQUEsRUFDUjtBQUNEOzs7QUMvQ08sSUFBTSxtQkFBbUIsQ0FBQyxRQUFRLFFBQVEsU0FBUyxRQUFRLFNBQVMsUUFBUSxNQUFNO0FBS2xGLElBQU0sbUJBQW1CLENBQUMsUUFBUSxRQUFRLFFBQVEsUUFBUSxPQUFPO0FBS2pFLElBQU0sbUJBQW1CLENBQUMsUUFBUSxRQUFRLFFBQVEsUUFBUSxPQUFPO0FBS2pFLElBQU0sc0JBQXNCLENBQUMsUUFBUSxTQUFTLFNBQVMsU0FBUyxRQUFRLFFBQVEsTUFBTTtBQUt0RixJQUFNLHVCQUFpQyxDQUFDLEdBQUcsZ0JBQWdCO0FBSzNELElBQU0sdUJBQWlDLENBQUMsR0FBRyxnQkFBZ0I7QUFLM0QsSUFBTSx1QkFBaUMsQ0FBQyxHQUFHLGdCQUFnQjtBQUszRCxJQUFNLDBCQUFvQyxDQUFDLEdBQUcsbUJBQW1CO0FBS2pFLElBQU0sdUJBQWlDO0FBQUEsRUFDN0MsR0FBRztBQUFBLEVBQ0gsR0FBRztBQUFBLEVBQ0gsR0FBRztBQUFBLEVBQ0gsR0FBRztBQUNKO0FBS08sSUFBTSxvQkFBOEU7QUFBQTtBQUFBLEVBRTFGLFFBQVE7QUFBQSxFQUNSLFFBQVE7QUFBQSxFQUNSLFNBQVM7QUFBQSxFQUNULFFBQVE7QUFBQSxFQUNSLFNBQVM7QUFBQSxFQUNULFFBQVE7QUFBQSxFQUNSLFFBQVE7QUFBQTtBQUFBLEVBRVIsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsU0FBUztBQUFBO0FBQUEsRUFFVCxRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixTQUFTO0FBQUE7QUFBQSxFQUVULFFBQVE7QUFBQSxFQUNSLFNBQVM7QUFBQSxFQUNULFNBQVM7QUFBQSxFQUNULFNBQVM7QUFBQSxFQUNULFFBQVE7QUFBQSxFQUNSLFFBQVE7QUFBQSxFQUNSLFFBQVE7QUFDVDtBQUtPLFNBQVMsaUJBQWlCLFVBQTBCO0FBQzFELFFBQU0sVUFBVSxTQUFTLFlBQVksR0FBRztBQUN4QyxNQUFJLFlBQVksR0FBSSxRQUFPO0FBQzNCLFNBQU8sU0FBUyxVQUFVLE9BQU8sRUFBRSxZQUFZO0FBQ2hEO0FBS08sU0FBUyxhQUFhLFVBQW1FO0FBQy9GLFFBQU0sTUFBTSxpQkFBaUIsUUFBUTtBQUNyQyxTQUFPLGtCQUFrQixHQUFHLEtBQUs7QUFDbEM7QUFxQ08sU0FBUyx3QkFBd0IsVUFBMEI7QUFDakUsUUFBTSxNQUFNLGlCQUFpQixRQUFRO0FBQ3JDLE1BQUksQ0FBQyxLQUFLO0FBQ1QsV0FBTztBQUFBLEVBQ1I7QUFDQSxTQUFPLElBQUksTUFBTSxDQUFDLEVBQUUsWUFBWTtBQUNqQztBQUtPLFNBQVMsWUFBWSxVQUEyQjtBQUN0RCxRQUFNLE1BQU0saUJBQWlCLFFBQVE7QUFDckMsU0FBTyxxQkFBcUIsU0FBUyxHQUFHO0FBQ3pDO0FBS08sU0FBUyxxQkFBcUIsVUFLeEI7QUFDWixRQUFNLGFBQXVCLENBQUM7QUFFOUIsTUFBSSxTQUFTLGlCQUFpQixPQUFPO0FBQ3BDLGVBQVcsS0FBSyxHQUFHLG9CQUFvQjtBQUFBLEVBQ3hDO0FBQ0EsTUFBSSxTQUFTLGlCQUFpQixPQUFPO0FBQ3BDLGVBQVcsS0FBSyxHQUFHLG9CQUFvQjtBQUFBLEVBQ3hDO0FBQ0EsTUFBSSxTQUFTLGdCQUFnQixPQUFPO0FBQ25DLGVBQVcsS0FBSyxHQUFHLG9CQUFvQjtBQUFBLEVBQ3hDO0FBQ0EsTUFBSSxTQUFTLGNBQWMsT0FBTztBQUNqQyxlQUFXLEtBQUssR0FBRyx1QkFBdUI7QUFBQSxFQUMzQztBQUVBLFNBQU87QUFDUjs7O0FDakxBLElBQU0sVUFBVTtBQUNoQixJQUFNLGFBQWE7QUFDbkIsSUFBTSxhQUFhO0FBV1osSUFBTSxpQkFBTixNQUFxQjtBQUFBLEVBSzNCLFlBQVksYUFBcUIsS0FBTTtBQUp2QyxTQUFRLEtBQXlCO0FBRWpDLFNBQVEsY0FBMkQsb0JBQUksSUFBSTtBQUcxRSxTQUFLLGFBQWE7QUFBQSxFQUNuQjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxPQUFzQjtBQUMzQixRQUFJLEtBQUssR0FBSTtBQUViLFdBQU8sSUFBSSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQ3ZDLFlBQU0sVUFBVSxVQUFVLEtBQUssU0FBUyxVQUFVO0FBRWxELGNBQVEsa0JBQWtCLENBQUMsVUFBVTtBQUNwQyxjQUFNLEtBQU0sTUFBTSxPQUE0QjtBQUM5QyxZQUFJLENBQUMsR0FBRyxpQkFBaUIsU0FBUyxVQUFVLEdBQUc7QUFDOUMsZ0JBQU0sUUFBUSxHQUFHLGtCQUFrQixZQUFZLEVBQUUsU0FBUyxPQUFPLENBQUM7QUFDbEUsZ0JBQU0sWUFBWSxhQUFhLGFBQWEsRUFBRSxRQUFRLE1BQU0sQ0FBQztBQUFBLFFBQzlEO0FBQUEsTUFDRDtBQUVBLGNBQVEsWUFBWSxDQUFDLFVBQVU7QUFDOUIsYUFBSyxLQUFNLE1BQU0sT0FBNEI7QUFDN0MsZ0JBQVE7QUFBQSxNQUNUO0FBRUEsY0FBUSxVQUFVLE1BQU07QUFDdkIsZ0JBQVEsS0FBSyxpRUFBaUU7QUFDOUUsZ0JBQVE7QUFBQSxNQUNUO0FBQUEsSUFDRCxDQUFDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsUUFBYztBQUViLGVBQVcsU0FBUyxLQUFLLFlBQVksT0FBTyxHQUFHO0FBQzlDLFVBQUksZ0JBQWdCLE1BQU0sR0FBRztBQUFBLElBQzlCO0FBQ0EsU0FBSyxZQUFZLE1BQU07QUFFdkIsUUFBSSxLQUFLLElBQUk7QUFDWixXQUFLLEdBQUcsTUFBTTtBQUNkLFdBQUssS0FBSztBQUFBLElBQ1g7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLE1BQU0sSUFBSSxNQUFjLE9BQXVDO0FBRTlELFVBQU0sV0FBVyxLQUFLLFlBQVksSUFBSSxJQUFJO0FBQzFDLFFBQUksWUFBWSxTQUFTLFVBQVUsT0FBTztBQUN6QyxhQUFPLFNBQVM7QUFBQSxJQUNqQjtBQUVBLFFBQUksQ0FBQyxLQUFLLEdBQUksUUFBTztBQUVyQixXQUFPLElBQUksUUFBUSxDQUFDLFlBQVk7QUFDL0IsWUFBTSxLQUFLLEtBQUssR0FBSSxZQUFZLFlBQVksVUFBVTtBQUN0RCxZQUFNLFFBQVEsR0FBRyxZQUFZLFVBQVU7QUFDdkMsWUFBTSxVQUFVLE1BQU0sSUFBSSxJQUFJO0FBRTlCLGNBQVEsWUFBWSxNQUFNO0FBQ3pCLGNBQU0sUUFBUSxRQUFRO0FBQ3RCLFlBQUksU0FBUyxNQUFNLFVBQVUsT0FBTztBQUNuQyxnQkFBTSxNQUFNLElBQUksZ0JBQWdCLE1BQU0sSUFBSTtBQUMxQyxlQUFLLFlBQVksSUFBSSxNQUFNLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDekMsa0JBQVEsR0FBRztBQUFBLFFBQ1osT0FBTztBQUNOLGtCQUFRLElBQUk7QUFBQSxRQUNiO0FBQUEsTUFDRDtBQUVBLGNBQVEsVUFBVSxNQUFNLFFBQVEsSUFBSTtBQUFBLElBQ3JDLENBQUM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLElBQUksTUFBYyxPQUFlLE1BQVksT0FBZSxRQUErQjtBQUVoRyxVQUFNLFdBQVcsS0FBSyxZQUFZLElBQUksSUFBSTtBQUMxQyxRQUFJLFVBQVU7QUFDYixVQUFJLGdCQUFnQixTQUFTLEdBQUc7QUFBQSxJQUNqQztBQUNBLFVBQU0sTUFBTSxJQUFJLGdCQUFnQixJQUFJO0FBQ3BDLFNBQUssWUFBWSxJQUFJLE1BQU0sRUFBRSxPQUFPLElBQUksQ0FBQztBQUV6QyxRQUFJLENBQUMsS0FBSyxHQUFJO0FBRWQsV0FBTyxJQUFJLFFBQVEsQ0FBQyxZQUFZO0FBQy9CLFlBQU0sS0FBSyxLQUFLLEdBQUksWUFBWSxZQUFZLFdBQVc7QUFDdkQsWUFBTSxRQUFRLEdBQUcsWUFBWSxVQUFVO0FBRXZDLFlBQU0sUUFBd0I7QUFBQSxRQUM3QjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBLFdBQVcsS0FBSyxJQUFJO0FBQUEsTUFDckI7QUFFQSxZQUFNLElBQUksS0FBSztBQUNmLFNBQUcsYUFBYSxNQUFNO0FBQ3JCLGFBQUssY0FBYztBQUNuQixnQkFBUTtBQUFBLE1BQ1Q7QUFDQSxTQUFHLFVBQVUsTUFBTSxRQUFRO0FBQUEsSUFDNUIsQ0FBQztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sT0FBTyxNQUE2QjtBQUN6QyxVQUFNLFdBQVcsS0FBSyxZQUFZLElBQUksSUFBSTtBQUMxQyxRQUFJLFVBQVU7QUFDYixVQUFJLGdCQUFnQixTQUFTLEdBQUc7QUFDaEMsV0FBSyxZQUFZLE9BQU8sSUFBSTtBQUFBLElBQzdCO0FBRUEsUUFBSSxDQUFDLEtBQUssR0FBSTtBQUVkLFdBQU8sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUMvQixZQUFNLEtBQUssS0FBSyxHQUFJLFlBQVksWUFBWSxXQUFXO0FBQ3ZELFNBQUcsWUFBWSxVQUFVLEVBQUUsT0FBTyxJQUFJO0FBQ3RDLFNBQUcsYUFBYSxNQUFNLFFBQVE7QUFDOUIsU0FBRyxVQUFVLE1BQU0sUUFBUTtBQUFBLElBQzVCLENBQUM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLFFBQXVCO0FBQzVCLGVBQVcsU0FBUyxLQUFLLFlBQVksT0FBTyxHQUFHO0FBQzlDLFVBQUksZ0JBQWdCLE1BQU0sR0FBRztBQUFBLElBQzlCO0FBQ0EsU0FBSyxZQUFZLE1BQU07QUFFdkIsUUFBSSxDQUFDLEtBQUssR0FBSTtBQUVkLFdBQU8sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUMvQixZQUFNLEtBQUssS0FBSyxHQUFJLFlBQVksWUFBWSxXQUFXO0FBQ3ZELFNBQUcsWUFBWSxVQUFVLEVBQUUsTUFBTTtBQUNqQyxTQUFHLGFBQWEsTUFBTSxRQUFRO0FBQzlCLFNBQUcsVUFBVSxNQUFNLFFBQVE7QUFBQSxJQUM1QixDQUFDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxPQUFPLFNBQWlCLFNBQWdDO0FBQzdELFVBQU0sV0FBVyxLQUFLLFlBQVksSUFBSSxPQUFPO0FBQzdDLFFBQUksVUFBVTtBQUNiLFdBQUssWUFBWSxPQUFPLE9BQU87QUFDL0IsV0FBSyxZQUFZLElBQUksU0FBUyxRQUFRO0FBQUEsSUFDdkM7QUFFQSxRQUFJLENBQUMsS0FBSyxHQUFJO0FBRWQsV0FBTyxJQUFJLFFBQVEsQ0FBQyxZQUFZO0FBQy9CLFlBQU0sS0FBSyxLQUFLLEdBQUksWUFBWSxZQUFZLFdBQVc7QUFDdkQsWUFBTSxRQUFRLEdBQUcsWUFBWSxVQUFVO0FBQ3ZDLFlBQU0sU0FBUyxNQUFNLElBQUksT0FBTztBQUVoQyxhQUFPLFlBQVksTUFBTTtBQUN4QixjQUFNLFFBQVEsT0FBTztBQUNyQixZQUFJLE9BQU87QUFDVixnQkFBTSxPQUFPLE9BQU87QUFDcEIsZ0JBQU0sT0FBTztBQUNiLGdCQUFNLElBQUksS0FBSztBQUFBLFFBQ2hCO0FBQUEsTUFDRDtBQUVBLFNBQUcsYUFBYSxNQUFNLFFBQVE7QUFDOUIsU0FBRyxVQUFVLE1BQU0sUUFBUTtBQUFBLElBQzVCLENBQUM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFjLGdCQUErQjtBQUM1QyxRQUFJLENBQUMsS0FBSyxHQUFJO0FBRWQsVUFBTSxLQUFLLEtBQUssR0FBRyxZQUFZLFlBQVksVUFBVTtBQUNyRCxVQUFNLFFBQVEsR0FBRyxZQUFZLFVBQVU7QUFDdkMsVUFBTSxXQUFXLE1BQU0sTUFBTTtBQUU3QixhQUFTLFlBQVksTUFBTTtBQUMxQixZQUFNLFFBQVEsU0FBUztBQUN2QixVQUFJLFNBQVMsS0FBSyxXQUFZO0FBRTlCLFlBQU0sYUFBYSxRQUFRLEtBQUs7QUFDaEMsWUFBTSxVQUFVLEtBQUssR0FBSSxZQUFZLFlBQVksV0FBVztBQUM1RCxZQUFNLGFBQWEsUUFBUSxZQUFZLFVBQVU7QUFDakQsWUFBTSxRQUFRLFdBQVcsTUFBTSxXQUFXO0FBQzFDLFlBQU0sU0FBUyxNQUFNLFdBQVc7QUFDaEMsVUFBSSxVQUFVO0FBRWQsYUFBTyxZQUFZLENBQUMsVUFBVTtBQUM3QixjQUFNLElBQUssTUFBTSxPQUFpRDtBQUNsRSxZQUFJLEtBQUssVUFBVSxZQUFZO0FBQzlCLGdCQUFNLE9BQVEsRUFBRSxNQUF5QjtBQUN6QyxnQkFBTSxXQUFXLEtBQUssWUFBWSxJQUFJLElBQUk7QUFDMUMsY0FBSSxVQUFVO0FBQ2IsZ0JBQUksZ0JBQWdCLFNBQVMsR0FBRztBQUNoQyxpQkFBSyxZQUFZLE9BQU8sSUFBSTtBQUFBLFVBQzdCO0FBQ0EsWUFBRSxPQUFPO0FBQ1Q7QUFDQSxZQUFFLFNBQVM7QUFBQSxRQUNaO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQ0Q7QUFLTyxTQUFTLGtCQUNmLFVBQ0EsVUFBa0IsS0FDdUM7QUFDekQsU0FBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFDdkMsVUFBTSxNQUFNLElBQUksTUFBTTtBQUN0QixRQUFJLGNBQWM7QUFFbEIsUUFBSSxTQUFTLE1BQU07QUFDbEIsVUFBSTtBQUNILGNBQU0sRUFBRSxPQUFPLE9BQU8sUUFBUSxNQUFNLElBQUk7QUFDeEMsWUFBSSxVQUFVO0FBQ2QsWUFBSSxVQUFVO0FBRWQsWUFBSSxRQUFRLFdBQVcsUUFBUSxTQUFTO0FBQ3ZDLGdCQUFNLFFBQVEsS0FBSyxJQUFJLFVBQVUsT0FBTyxVQUFVLEtBQUs7QUFDdkQsb0JBQVUsS0FBSyxNQUFNLFFBQVEsS0FBSztBQUNsQyxvQkFBVSxLQUFLLE1BQU0sUUFBUSxLQUFLO0FBQUEsUUFDbkM7QUFFQSxjQUFNLFNBQVMsU0FBUyxjQUFjLFFBQVE7QUFDOUMsZUFBTyxRQUFRO0FBQ2YsZUFBTyxTQUFTO0FBRWhCLGNBQU0sTUFBTSxPQUFPLFdBQVcsSUFBSTtBQUNsQyxZQUFJLENBQUMsS0FBSztBQUNULGlCQUFPLElBQUksTUFBTSwyQkFBMkIsQ0FBQztBQUM3QztBQUFBLFFBQ0Q7QUFFQSxZQUFJLFVBQVUsS0FBSyxHQUFHLEdBQUcsU0FBUyxPQUFPO0FBRXpDLGVBQU87QUFBQSxVQUNOLENBQUMsU0FBUztBQUNULGdCQUFJLE1BQU07QUFDVCxzQkFBUSxFQUFFLE1BQU0sT0FBTyxTQUFTLFFBQVEsUUFBUSxDQUFDO0FBQUEsWUFDbEQsT0FBTztBQUNOLHFCQUFPLElBQUksTUFBTSw2QkFBNkIsQ0FBQztBQUFBLFlBQ2hEO0FBQUEsVUFDRDtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRDtBQUFBLE1BQ0QsU0FBUyxPQUFPO0FBQ2YsZUFBTyxLQUFLO0FBQUEsTUFDYjtBQUFBLElBQ0Q7QUFFQSxRQUFJLFVBQVUsTUFBTSxPQUFPLElBQUksTUFBTSx5QkFBeUIsUUFBUSxFQUFFLENBQUM7QUFDekUsUUFBSSxNQUFNO0FBQUEsRUFDWCxDQUFDO0FBQ0Y7OztBQ2hTQSxJQUFNLHlCQUF5QjtBQUMvQixJQUFNLFdBQVc7QUFDakIsSUFBTSxZQUFZO0FBQ2xCLElBQU0sa0JBQWtCO0FBQ3hCLElBQU0sbUJBQW1CO0FBQ3pCLElBQU0sa0JBQWtCO0FBQ3hCLElBQU0sZUFBZTtBQUtkLFNBQVMsVUFBVSxRQUErQjtBQUN4RCxRQUFNLE9BQU8sSUFBSSxTQUFTLE1BQU07QUFDaEMsUUFBTSxTQUFtQixDQUFDO0FBRzFCLE1BQUksS0FBSyxVQUFVLENBQUMsTUFBTSxPQUFRO0FBQ2pDLFdBQU87QUFBQSxFQUNSO0FBRUEsTUFBSSxTQUFTO0FBQ2IsUUFBTSxTQUFTLEtBQUssSUFBSSxPQUFPLFlBQVksS0FBSztBQUVoRCxTQUFPLFNBQVMsUUFBUTtBQUN2QixRQUFJLEtBQUssU0FBUyxNQUFNLE1BQU0sSUFBTTtBQUVwQyxVQUFNLFNBQVMsS0FBSyxTQUFTLFNBQVMsQ0FBQztBQUN2QyxjQUFVO0FBR1YsUUFBSSxXQUFXLEtBQU07QUFDcEIsWUFBTSxnQkFBZ0IsS0FBSyxVQUFVLE1BQU07QUFHM0MsVUFBSSxnQkFBZ0IsS0FDbkIsS0FBSyxVQUFVLFNBQVMsQ0FBQyxNQUFNO0FBQUEsTUFDL0IsS0FBSyxVQUFVLFNBQVMsQ0FBQyxNQUFNLEdBQVE7QUFFdkMsY0FBTSxhQUFhLFNBQVM7QUFDNUIsa0JBQVUsTUFBTSxZQUFZLE1BQU07QUFBQSxNQUNuQztBQUVBLGFBQU87QUFBQSxJQUNSO0FBR0EsUUFBSSxVQUFVLE9BQVEsVUFBVSxPQUFRLFdBQVcsS0FBTTtBQUN4RCxZQUFNLGdCQUFnQixLQUFLLFVBQVUsTUFBTTtBQUMzQyxnQkFBVTtBQUFBLElBQ1gsV0FBVyxXQUFXLEtBQU07QUFFM0I7QUFBQSxJQUNELE9BQU87QUFFTixVQUFJLFNBQVMsS0FBSyxRQUFRO0FBQ3pCLGNBQU0sZ0JBQWdCLEtBQUssVUFBVSxNQUFNO0FBQzNDLGtCQUFVO0FBQUEsTUFDWCxPQUFPO0FBQ047QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFFQSxTQUFPO0FBQ1I7QUFLQSxTQUFTLFVBQVUsTUFBZ0IsV0FBbUIsUUFBd0I7QUFDN0UsTUFBSSxZQUFZLElBQUksS0FBSyxXQUFZO0FBR3JDLFFBQU0sWUFBWSxLQUFLLFVBQVUsU0FBUztBQUMxQyxRQUFNLGVBQWUsY0FBYztBQUNuQyxNQUFJLGNBQWMsU0FBVSxjQUFjLE1BQVE7QUFHbEQsTUFBSSxLQUFLLFVBQVUsWUFBWSxHQUFHLFlBQVksTUFBTSxHQUFJO0FBR3hELFFBQU0sYUFBYSxLQUFLLFVBQVUsWUFBWSxHQUFHLFlBQVk7QUFDN0QsV0FBUyxNQUFNLFdBQVcsWUFBWSxZQUFZLGNBQWMsUUFBUSxJQUFJO0FBQzdFO0FBS0EsU0FBUyxTQUNSLE1BQ0EsV0FDQSxXQUNBLGNBQ0EsUUFDQSxlQUNPO0FBQ1AsTUFBSSxZQUFZLElBQUksS0FBSyxXQUFZO0FBRXJDLFFBQU0sYUFBYSxLQUFLLFVBQVUsV0FBVyxZQUFZO0FBQ3pELE1BQUksU0FBUyxZQUFZO0FBRXpCLFdBQVMsSUFBSSxHQUFHLElBQUksWUFBWSxLQUFLO0FBQ3BDLFFBQUksU0FBUyxLQUFLLEtBQUssV0FBWTtBQUVuQyxVQUFNLE1BQU0sS0FBSyxVQUFVLFFBQVEsWUFBWTtBQUMvQyxVQUFNLE9BQU8sS0FBSyxVQUFVLFNBQVMsR0FBRyxZQUFZO0FBQ3BELFVBQU0sUUFBUSxLQUFLLFVBQVUsU0FBUyxHQUFHLFlBQVk7QUFDckQsVUFBTSxjQUFjLFNBQVM7QUFFN0IsWUFBUSxLQUFLO0FBQUEsTUFDWixLQUFLO0FBQ0osZUFBTyxPQUFPLGdCQUFnQixNQUFNLFdBQVcsYUFBYSxNQUFNLE9BQU8sWUFBWTtBQUNyRjtBQUFBLE1BQ0QsS0FBSztBQUNKLGVBQU8sUUFBUSxnQkFBZ0IsTUFBTSxXQUFXLGFBQWEsTUFBTSxPQUFPLFlBQVk7QUFDdEY7QUFBQSxNQUNELEtBQUs7QUFDSixlQUFPLGNBQWMsZUFBZSxNQUFNLGFBQWEsWUFBWTtBQUNuRTtBQUFBLE1BQ0QsS0FBSztBQUNKLGVBQU8sbUJBQW1CLGdCQUFnQixNQUFNLFdBQVcsYUFBYSxNQUFNLE9BQU8sWUFBWTtBQUNqRztBQUFBLE1BQ0QsS0FBSztBQUNKLGVBQU8sYUFBYSxnQkFBZ0IsTUFBTSxhQUFhLE1BQU0sWUFBWTtBQUN6RTtBQUFBLE1BQ0QsS0FBSztBQUNKLGVBQU8sY0FBYyxnQkFBZ0IsTUFBTSxhQUFhLE1BQU0sWUFBWTtBQUMxRTtBQUFBLE1BQ0QsS0FBSztBQUNKLFlBQUksZUFBZTtBQUNsQixnQkFBTSxhQUFhLEtBQUssVUFBVSxhQUFhLFlBQVk7QUFDM0QsbUJBQVMsTUFBTSxXQUFXLFlBQVksWUFBWSxjQUFjLFFBQVEsS0FBSztBQUFBLFFBQzlFO0FBQ0E7QUFBQSxJQUNGO0FBRUEsY0FBVTtBQUFBLEVBQ1g7QUFDRDtBQUVBLFNBQVMsZUFBZSxNQUFnQixRQUFnQixjQUErQjtBQUN0RixNQUFJLFNBQVMsSUFBSSxLQUFLLFdBQVksUUFBTztBQUN6QyxTQUFPLEtBQUssVUFBVSxRQUFRLFlBQVk7QUFDM0M7QUFFQSxTQUFTLGdCQUFnQixNQUFnQixRQUFnQixNQUFjLGNBQStCO0FBQ3JHLE1BQUksU0FBUyxHQUFHO0FBQ2YsV0FBTyxlQUFlLE1BQU0sUUFBUSxZQUFZO0FBQUEsRUFDakQ7QUFDQSxNQUFJLFNBQVMsSUFBSSxLQUFLLFdBQVksUUFBTztBQUN6QyxTQUFPLEtBQUssVUFBVSxRQUFRLFlBQVk7QUFDM0M7QUFFQSxTQUFTLGdCQUNSLE1BQ0EsV0FDQSxhQUNBLE1BQ0EsT0FDQSxjQUNTO0FBQ1QsTUFBSSxTQUFTLEVBQUcsUUFBTztBQUV2QixNQUFJO0FBQ0osTUFBSSxTQUFTLEdBQUc7QUFDZixpQkFBYTtBQUFBLEVBQ2QsT0FBTztBQUNOLFFBQUksY0FBYyxJQUFJLEtBQUssV0FBWSxRQUFPO0FBQzlDLGlCQUFhLFlBQVksS0FBSyxVQUFVLGFBQWEsWUFBWTtBQUFBLEVBQ2xFO0FBRUEsTUFBSSxhQUFhLFFBQVEsS0FBSyxXQUFZLFFBQU87QUFFakQsTUFBSSxNQUFNO0FBQ1YsV0FBUyxJQUFJLEdBQUcsSUFBSSxRQUFRLEdBQUcsS0FBSztBQUNuQyxVQUFNLFdBQVcsS0FBSyxTQUFTLGFBQWEsQ0FBQztBQUM3QyxRQUFJLGFBQWEsRUFBRztBQUNwQixXQUFPLE9BQU8sYUFBYSxRQUFRO0FBQUEsRUFDcEM7QUFFQSxTQUFPLElBQUksS0FBSztBQUNqQjtBQU1PLFNBQVMsY0FBYyxTQUE4QjtBQUMzRCxRQUFNLFFBQVEsUUFBUSxNQUFNLG9EQUFvRDtBQUNoRixNQUFJLENBQUMsTUFBTyxRQUFPO0FBRW5CLFFBQU0sQ0FBQyxFQUFFLE1BQU0sT0FBTyxLQUFLLE1BQU0sUUFBUSxNQUFNLElBQUk7QUFDbkQsU0FBTyxJQUFJO0FBQUEsSUFDVixTQUFTLElBQUk7QUFBQSxJQUFHLFNBQVMsS0FBSyxJQUFJO0FBQUEsSUFBRyxTQUFTLEdBQUc7QUFBQSxJQUNqRCxTQUFTLElBQUk7QUFBQSxJQUFHLFNBQVMsTUFBTTtBQUFBLElBQUcsU0FBUyxNQUFNO0FBQUEsRUFDbEQ7QUFDRDs7O0FDM0xPLFNBQVMsaUJBQ2YsT0FDQSxNQUNBLFVBQ3NCO0FBQ3RCLFFBQU0sTUFBTSxpQkFBaUIsS0FBSyxJQUFJLEVBQUUsUUFBUSxLQUFLLEVBQUUsRUFBRSxZQUFZO0FBRXJFLGFBQVcsUUFBUSxPQUFPO0FBQ3pCLFFBQUksQ0FBQyxLQUFLLFFBQVM7QUFHbkIsUUFBSSxLQUFLLGlCQUFpQjtBQUN6QixZQUFNLGNBQWMsS0FBSyxnQkFDdkIsTUFBTSxHQUFHLEVBQ1QsSUFBSSxPQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQztBQUVqQyxVQUFJLENBQUMsWUFBWSxTQUFTLEdBQUcsRUFBRztBQUFBLElBQ2pDO0FBRUEsV0FBTztBQUFBLEVBQ1I7QUFFQSxTQUFPO0FBQ1I7QUFLTyxTQUFTLGNBQWMsTUFBb0IsS0FBc0M7QUFDdkYsUUFBTSxNQUFNLGlCQUFpQixJQUFJLEtBQUssSUFBSTtBQUMxQyxRQUFNLFdBQVcsSUFBSSxLQUFLLEtBQUssUUFBUSxZQUFZLEVBQUU7QUFDckQsUUFBTSxZQUFZLGFBQWEsSUFBSSxLQUFLLElBQUksS0FBSztBQUdqRCxNQUFJLE9BQU8sSUFBSTtBQUNmLE1BQUksSUFBSSxNQUFNLGtCQUFrQjtBQUMvQixVQUFNLFdBQVcsY0FBYyxJQUFJLEtBQUssZ0JBQWdCO0FBQ3hELFFBQUksU0FBVSxRQUFPO0FBQUEsRUFDdEI7QUFFQSxRQUFNLE9BQU8sT0FBTyxLQUFLLFlBQVksQ0FBQztBQUN0QyxRQUFNLFFBQVEsT0FBTyxLQUFLLFNBQVMsSUFBSSxDQUFDLEVBQUUsU0FBUyxHQUFHLEdBQUc7QUFDekQsUUFBTSxNQUFNLE9BQU8sS0FBSyxRQUFRLENBQUMsRUFBRSxTQUFTLEdBQUcsR0FBRztBQUVsRCxRQUFNLFNBQVMsSUFBSSxNQUFNLE9BQ3RCLEdBQUcsSUFBSSxLQUFLLElBQUksR0FBRyxJQUFJLEtBQUssUUFBUSxNQUFNLElBQUksS0FBSyxRQUFRLEVBQUUsS0FDN0Q7QUFFSCxRQUFNLE1BQU0sSUFBSSxPQUFPLENBQUMsS0FBSztBQUU3QixRQUFNLE9BQStCO0FBQUEsSUFDcEMsVUFBVTtBQUFBLElBQ1YsV0FBVztBQUFBLElBQ1gsU0FBUztBQUFBLElBQ1QsU0FBUyxJQUFJLFFBQVEsS0FBSyxFQUFFO0FBQUEsSUFDNUIsVUFBVTtBQUFBLElBQ1YsWUFBWSxpQkFBaUIsTUFBTTtBQUFBLElBQ25DLFVBQVU7QUFBQSxJQUNWLFNBQVMsaUJBQWlCLEdBQUc7QUFBQSxFQUM5QjtBQUdBLE1BQUksU0FBUyxLQUFLO0FBQ2xCLGFBQVcsQ0FBQyxLQUFLLEtBQUssS0FBSyxPQUFPLFFBQVEsSUFBSSxHQUFHO0FBQ2hELGFBQVMsT0FBTyxRQUFRLElBQUksT0FBTyxZQUFZLEdBQUcsR0FBRyxHQUFHLEdBQUcsS0FBSztBQUFBLEVBQ2pFO0FBR0EsTUFBSSxVQUFVLEtBQUssa0JBQWtCO0FBQ3JDLGFBQVcsQ0FBQyxLQUFLLEtBQUssS0FBSyxPQUFPLFFBQVEsSUFBSSxHQUFHO0FBQ2hELGNBQVUsUUFBUSxRQUFRLElBQUksT0FBTyxZQUFZLEdBQUcsR0FBRyxHQUFHLEdBQUcsS0FBSztBQUFBLEVBQ25FO0FBR0EsTUFBSSxDQUFDLFFBQVEsU0FBUyxHQUFHLEdBQUc7QUFDM0IsY0FBVSxVQUFVO0FBQUEsRUFDckI7QUFHQSxXQUFTLE9BQU8sUUFBUSxRQUFRLEdBQUcsRUFBRSxRQUFRLFlBQVksRUFBRTtBQUUzRCxRQUFNLFVBQVUsU0FBUyxHQUFHLE1BQU0sSUFBSSxPQUFPLEtBQUs7QUFFbEQsU0FBTztBQUFBLElBQ04sY0FBYyxJQUFJLEtBQUs7QUFBQSxJQUN2QjtBQUFBLElBQ0E7QUFBQSxFQUNEO0FBQ0Q7QUFLQSxTQUFTLGlCQUFpQixNQUFzQjtBQUMvQyxTQUFPLEtBQ0wsUUFBUSxpQkFBaUIsR0FBRyxFQUM1QixRQUFRLFFBQVEsR0FBRyxFQUNuQixRQUFRLE9BQU8sR0FBRyxFQUNsQixLQUFLO0FBQ1I7QUFLQSxTQUFTLFlBQVksS0FBcUI7QUFDekMsU0FBTyxJQUFJLFFBQVEsdUJBQXVCLE1BQU07QUFDakQ7OztBQ2pHQSxJQUFNLFdBQW1DO0FBQUEsRUFDeEMsUUFBUTtBQUFBLEVBQ1IsUUFBUTtBQUFBLEVBQ1IsT0FBTztBQUFBLEVBQ1AsT0FBTztBQUFBLEVBQ1AsUUFBUTtBQUNUO0FBd0JBLFNBQVMsVUFBVSxLQUF3QztBQUMxRCxTQUFPLElBQUksUUFBUSxDQUFDLFNBQVMsV0FBVztBQUN2QyxVQUFNLE1BQU0sSUFBSSxNQUFNO0FBQ3RCLFFBQUksY0FBYztBQUNsQixRQUFJLFNBQVMsTUFBTSxRQUFRLEdBQUc7QUFDOUIsUUFBSSxVQUFVLE1BQU0sT0FBTyxJQUFJLE1BQU0seUJBQXlCLEdBQUcsRUFBRSxDQUFDO0FBQ3BFLFFBQUksTUFBTTtBQUFBLEVBQ1gsQ0FBQztBQUNGO0FBS0EsZUFBc0IsYUFDckIsS0FDQSxjQUNBLFVBQTBCLENBQUMsR0FDRjtBQUN6QixRQUFNLE1BQU0sTUFBTSxVQUFVLEdBQUc7QUFFL0IsTUFBSSxFQUFFLE9BQU8sTUFBTSxRQUFRLEtBQUssSUFBSTtBQUNwQyxNQUFJLFFBQVE7QUFDWixNQUFJLFFBQVE7QUFDWixNQUFJLFFBQVE7QUFDWixNQUFJLFFBQVE7QUFHWixNQUFJLFFBQVEsTUFBTTtBQUNqQixZQUFRLENBQUMsUUFBUSxLQUFLO0FBQ3RCLFlBQVEsQ0FBQyxRQUFRLEtBQUs7QUFDdEIsV0FBTyxRQUFRLEtBQUs7QUFDcEIsV0FBTyxRQUFRLEtBQUs7QUFBQSxFQUNyQjtBQUdBLE1BQUksVUFBVTtBQUNkLE1BQUksVUFBVTtBQUVkLE1BQUksUUFBUSxZQUFZLFFBQVEsV0FBVztBQUMxQyxVQUFNLE9BQU8sUUFBUSxZQUFZO0FBQ2pDLFVBQU0sT0FBTyxRQUFRLGFBQWE7QUFDbEMsVUFBTSxRQUFRLEtBQUssSUFBSSxPQUFPLE1BQU0sT0FBTyxNQUFNLENBQUM7QUFDbEQsY0FBVSxLQUFLLE1BQU0sT0FBTyxLQUFLO0FBQ2pDLGNBQVUsS0FBSyxNQUFNLE9BQU8sS0FBSztBQUFBLEVBQ2xDO0FBRUEsUUFBTSxTQUFTLFNBQVMsY0FBYyxRQUFRO0FBQzlDLFNBQU8sUUFBUTtBQUNmLFNBQU8sU0FBUztBQUVoQixRQUFNLE1BQU0sT0FBTyxXQUFXLElBQUk7QUFDbEMsTUFBSSxDQUFDLElBQUssT0FBTSxJQUFJLE1BQU0sMkJBQTJCO0FBR3JELE1BQUksUUFBUSxNQUFNO0FBQ2pCLFVBQU0sU0FBUyxVQUFVO0FBQ3pCLFVBQU0sU0FBUyxVQUFVO0FBQ3pCLFFBQUk7QUFBQSxNQUNIO0FBQUEsTUFDQSxRQUFRLEtBQUs7QUFBQSxNQUFHLFFBQVEsS0FBSztBQUFBLE1BQUcsUUFBUSxLQUFLO0FBQUEsTUFBTyxRQUFRLEtBQUs7QUFBQSxNQUNqRTtBQUFBLE1BQUc7QUFBQSxNQUFHO0FBQUEsTUFBUztBQUFBLElBQ2hCO0FBQUEsRUFDRCxPQUFPO0FBQ04sUUFBSSxVQUFVLEtBQUssR0FBRyxHQUFHLFNBQVMsT0FBTztBQUFBLEVBQzFDO0FBR0EsTUFBSSxRQUFRLFdBQVcsTUFBTTtBQUM1QixVQUFNLEtBQUssUUFBUTtBQUNuQixVQUFNLFdBQVcsR0FBRyxZQUFZLEtBQUssSUFBSSxJQUFJLEtBQUssTUFBTSxVQUFVLEVBQUUsQ0FBQztBQUVyRSxRQUFJLEtBQUs7QUFDVCxRQUFJLGNBQWMsR0FBRztBQUNyQixRQUFJLE9BQU8sR0FBRyxRQUFRO0FBQ3RCLFFBQUksWUFBWTtBQUNoQixRQUFJLGNBQWM7QUFDbEIsUUFBSSxZQUFZO0FBRWhCLFVBQU0sY0FBYyxJQUFJLFlBQVksR0FBRyxJQUFJO0FBQzNDLFFBQUk7QUFDSixRQUFJO0FBRUosWUFBUSxHQUFHLFVBQVU7QUFBQSxNQUNwQixLQUFLO0FBQ0osaUJBQVMsVUFBVSxZQUFZLFNBQVM7QUFDeEMsZ0JBQVEsVUFBVSxJQUFJLFdBQVc7QUFDakM7QUFBQSxNQUNELEtBQUs7QUFDSixnQkFBUTtBQUNSLGdCQUFRLFVBQVU7QUFDbEI7QUFBQSxNQUNELEtBQUs7QUFBQSxNQUNMO0FBQ0MsZ0JBQVEsVUFBVSxZQUFZLFFBQVE7QUFDdEMsZ0JBQVEsVUFBVTtBQUNsQjtBQUFBLElBQ0Y7QUFFQSxRQUFJLFdBQVcsR0FBRyxNQUFNLE9BQU8sS0FBSztBQUNwQyxRQUFJLFNBQVMsR0FBRyxNQUFNLE9BQU8sS0FBSztBQUNsQyxRQUFJLFFBQVE7QUFBQSxFQUNiO0FBR0EsUUFBTSxTQUFTLFFBQVEsVUFBVTtBQUNqQyxRQUFNLFdBQVcsUUFBUSxXQUFXLE1BQU07QUFDMUMsUUFBTSxXQUFXLFNBQVMsTUFBTSxLQUFLO0FBRXJDLFFBQU0sT0FBTyxNQUFNLElBQUksUUFBYyxDQUFDLFNBQVMsV0FBVztBQUN6RCxXQUFPO0FBQUEsTUFDTixDQUFDLE1BQU07QUFDTixZQUFJLEVBQUcsU0FBUSxDQUFDO0FBQUEsWUFDWCxRQUFPLElBQUksTUFBTSw2QkFBNkIsQ0FBQztBQUFBLE1BQ3JEO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRCxDQUFDO0FBRUQsU0FBTztBQUFBLElBQ047QUFBQSxJQUNBLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSO0FBQUEsSUFDQSxTQUFTLEtBQUs7QUFBQSxJQUNkO0FBQUEsRUFDRDtBQUNEO0FBK0ZPLFNBQVMsbUJBQW1CLFFBQXdCO0FBQzFELFVBQVEsUUFBUTtBQUFBLElBQ2YsS0FBSztBQUFRLGFBQU87QUFBQSxJQUNwQixLQUFLO0FBQVEsYUFBTztBQUFBLElBQ3BCLEtBQUs7QUFBTyxhQUFPO0FBQUEsSUFDbkIsS0FBSztBQUFRLGFBQU87QUFBQSxJQUNwQjtBQUFTLGFBQU8sSUFBSSxNQUFNO0FBQUEsRUFDM0I7QUFDRDs7O0FQNVJPLElBQU0sMEJBQTBCO0FBV2hDLElBQU0sbUJBQU4sY0FBK0IseUJBQVM7QUFBQSxFQVc5QyxZQUFZLE1BQXFCLFFBQTRCO0FBQzVELFVBQU0sSUFBSTtBQVZYLGtCQUFzQixDQUFDO0FBQ3ZCLDBCQUE4QixDQUFDO0FBQy9CLFNBQVEsY0FBc0I7QUFDOUIsU0FBUSxjQUFzQjtBQUM5QixTQUFRLFdBQW1CO0FBQzNCLFNBQVEsZ0JBQTZCLG9CQUFJLElBQUk7QUFDN0MsU0FBUSxrQkFBMkI7QUFDbkMsU0FBUSxjQUF1QztBQUk5QyxTQUFLLFNBQVM7QUFBQSxFQUNmO0FBQUEsRUFFUSxtQkFBbUIsTUFBc0I7QUFDaEQsVUFBTSxNQUFNLGlCQUFpQixLQUFLLElBQUk7QUFDdEMsV0FBTyxDQUFDLFFBQVEsUUFBUSxTQUFTLFNBQVMsTUFBTSxFQUFFLFNBQVMsR0FBRztBQUFBLEVBQy9EO0FBQUEsRUFFQSxjQUFjO0FBQ2IsV0FBTztBQUFBLEVBQ1I7QUFBQSxFQUVBLGlCQUFpQjtBQUNoQixXQUFPLEtBQUssT0FBTyxFQUFFLGNBQWM7QUFBQSxFQUNwQztBQUFBLEVBRUEsTUFBTSxTQUFTO0FBRWQsUUFBSSxVQUFVO0FBQ2QsV0FBTyxDQUFDLEtBQUssYUFBYSxVQUFVLElBQUk7QUFDdkMsWUFBTSxJQUFJLFFBQVEsYUFBVyxXQUFXLFNBQVMsRUFBRSxDQUFDO0FBQ3BEO0FBQUEsSUFDRDtBQUNBLFFBQUksQ0FBQyxLQUFLLFdBQVc7QUFDcEIsY0FBUSxNQUFNLHFEQUFxRDtBQUNuRTtBQUFBLElBQ0Q7QUFDQSxTQUFLLFVBQVUsU0FBUyxvQkFBb0I7QUFFNUMsU0FBSyxXQUFXLEtBQUssT0FBTyxTQUFTLFlBQVk7QUFDakQsVUFBTSxLQUFLLGNBQWM7QUFBQSxFQUMxQjtBQUFBLEVBRUEsTUFBTSxVQUFVO0FBQUEsRUFFaEI7QUFBQSxFQUVBLE1BQU0sZ0JBQWdCO0FBRXJCLFFBQUksQ0FBQyxLQUFLLFdBQVc7QUFDcEI7QUFBQSxJQUNEO0FBR0EsU0FBSyxXQUFXLEtBQUssSUFBSSxHQUFHLEtBQUssT0FBTyxTQUFTLFlBQVksRUFBRTtBQUUvRCxVQUFNLFVBQXdEO0FBQUEsTUFDN0QsU0FBUztBQUFBLE1BQ1QsVUFBVTtBQUFBLE1BQ1YsU0FBUztBQUFBLElBQ1Y7QUFFQSxVQUFNLE9BQU8sUUFBUSxLQUFLLE9BQU8sU0FBUyxhQUFhLEtBQUs7QUFDNUQsU0FBSyxVQUFVLE1BQU07QUFHckIsUUFBSTtBQUNKLFFBQUksS0FBSyxPQUFPLFVBQVUsZUFBZTtBQUN4QyxZQUFNLFVBQVUsS0FBSyxPQUFPLFVBQVUsU0FBUztBQUMvQyxtQkFBYSxRQUNYLElBQUksT0FBSyxLQUFLLElBQUksTUFBTSxzQkFBc0IsRUFBRSxJQUFJLENBQUMsRUFDckQsT0FBTyxDQUFDLE1BQWtCLGFBQWEscUJBQUs7QUFBQSxJQUMvQyxPQUFPO0FBQ04sbUJBQWEsTUFBTSxLQUFLLE9BQU8saUJBQWlCO0FBQUEsSUFDakQ7QUFHQSxRQUFJO0FBQ0osUUFBSSxLQUFLLE9BQU8sU0FBUyxhQUFhO0FBQ3JDLFlBQU0sU0FBUyxtQkFBbUIsS0FBSyxPQUFPLFNBQVMsV0FBVztBQUNsRSxZQUFNLFNBQVMsU0FBUyxHQUFHLE1BQU0sTUFBTTtBQUN2Qyx1QkFBaUIsV0FBVyxPQUFPLE9BQUs7QUFDdkMsY0FBTSxpQkFBaUIsbUJBQW1CLEVBQUUsSUFBSTtBQUNoRCxlQUFPLG1CQUFtQixXQUFXLFNBQVMsZUFBZSxXQUFXLE1BQU0sSUFBSTtBQUFBLE1BQ25GLENBQUM7QUFBQSxJQUNGLE9BQU87QUFDTix1QkFBaUI7QUFBQSxJQUNsQjtBQUdBLFNBQUssU0FBUyxlQUFlLElBQUksV0FBUztBQUFBLE1BQ3pDO0FBQUEsTUFDQSxNQUFNLEtBQUs7QUFBQSxNQUNYLE1BQU0sS0FBSztBQUFBLE1BQ1gsTUFBTSxLQUFLLEtBQUs7QUFBQSxNQUNoQixVQUFVLEtBQUssS0FBSztBQUFBLElBQ3JCLEVBQUU7QUFFRixTQUFLLFdBQVc7QUFHaEIsU0FBSyxZQUFZO0FBR2pCLFVBQU0sYUFBYSxLQUFLLElBQUksR0FBRyxLQUFLLEtBQUssS0FBSyxlQUFlLFNBQVMsS0FBSyxRQUFRLENBQUM7QUFDcEYsUUFBSSxLQUFLLGNBQWMsWUFBWTtBQUNsQyxXQUFLLGNBQWM7QUFBQSxJQUNwQjtBQUdBLFNBQUssYUFBYTtBQUdsQixTQUFLLGdCQUFnQjtBQUdyQixRQUFJLEtBQUssaUJBQWlCO0FBQ3pCLFdBQUssdUJBQXVCO0FBQUEsSUFDN0I7QUFHQSxVQUFNLE9BQU8sS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLGFBQWEsQ0FBQztBQUMzRCxTQUFLLFNBQVMsY0FBYyxJQUFJLEVBQUU7QUFHbEMsVUFBTSxjQUFjLEtBQUssY0FBYyxLQUFLLEtBQUs7QUFDakQsVUFBTSxXQUFXLEtBQUssSUFBSSxhQUFhLEtBQUssVUFBVSxLQUFLLGVBQWUsTUFBTTtBQUNoRixVQUFNLGFBQWEsS0FBSyxlQUFlLE1BQU0sWUFBWSxRQUFRO0FBR2pFLGVBQVcsU0FBUyxZQUFZO0FBQy9CLFdBQUssZ0JBQWdCLE1BQU0sS0FBSztBQUFBLElBQ2pDO0FBR0EsU0FBSyxpQkFBaUI7QUFFdEIsUUFBSSxLQUFLLGVBQWUsV0FBVyxHQUFHO0FBQ3JDLFdBQUssVUFBVSxVQUFVO0FBQUEsUUFDeEIsS0FBSztBQUFBLFFBQ0wsTUFBTSxLQUFLLGNBQWMsS0FBSyxPQUFPLEVBQUUsaUJBQWlCLElBQUksS0FBSyxPQUFPLEVBQUUsY0FBYztBQUFBLE1BQ3pGLENBQUM7QUFBQSxJQUNGO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsY0FBYztBQUNiLFFBQUksQ0FBQyxLQUFLLGFBQWE7QUFDdEIsV0FBSyxpQkFBaUIsQ0FBQyxHQUFHLEtBQUssTUFBTTtBQUFBLElBQ3RDLE9BQU87QUFDTixZQUFNLFFBQVEsS0FBSyxZQUFZLFlBQVk7QUFDM0MsV0FBSyxpQkFBaUIsS0FBSyxPQUFPO0FBQUEsUUFBTyxTQUN4QyxJQUFJLEtBQUssWUFBWSxFQUFFLFNBQVMsS0FBSyxLQUNyQyxJQUFJLEtBQUssWUFBWSxFQUFFLFNBQVMsS0FBSztBQUFBLE1BQ3RDO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGtCQUFrQjtBQUNqQixVQUFNLGtCQUFrQixLQUFLLFVBQVUsVUFBVSxFQUFFLEtBQUssbUJBQW1CLENBQUM7QUFFNUUsU0FBSyxjQUFjLGdCQUFnQixTQUFTLFNBQVM7QUFBQSxNQUNwRCxNQUFNO0FBQUEsTUFDTixLQUFLO0FBQUEsTUFDTCxNQUFNO0FBQUEsUUFDTCxhQUFhLEtBQUssT0FBTyxFQUFFLG1CQUFtQjtBQUFBLFFBQzlDLE9BQU8sS0FBSztBQUFBLE1BQ2I7QUFBQSxJQUNELENBQUM7QUFHRCxVQUFNLGFBQWEsZ0JBQWdCLFVBQVUsRUFBRSxLQUFLLGNBQWMsQ0FBQztBQUNuRSxpQ0FBUSxZQUFZLFFBQVE7QUFHNUIsUUFBSSxLQUFLLGFBQWE7QUFDckIsWUFBTSxXQUFXLGdCQUFnQixTQUFTLFVBQVUsRUFBRSxLQUFLLGVBQWUsQ0FBQztBQUMzRSxtQ0FBUSxVQUFVLEdBQUc7QUFDckIsZUFBUyxpQkFBaUIsU0FBUyxNQUFNO0FBQ3hDLGFBQUssY0FBYztBQUNuQixhQUFLLGNBQWM7QUFDbkIsYUFBSyxZQUFZO0FBQ2pCLGFBQUssY0FBYztBQUFBLE1BQ3BCLENBQUM7QUFBQSxJQUNGO0FBR0EsVUFBTSxrQkFBa0IsU0FBUyxNQUFNO0FBQ3RDLFdBQUssY0FBYztBQUNuQixXQUFLLFlBQVk7QUFDakIsV0FBSyxjQUFjO0FBQUEsSUFDcEIsR0FBRyxHQUFHO0FBRU4sU0FBSyxZQUFZLGlCQUFpQixTQUFTLENBQUMsTUFBTTtBQUNqRCxZQUFNLFNBQVMsRUFBRTtBQUNqQixXQUFLLGNBQWMsT0FBTztBQUMxQixzQkFBZ0I7QUFBQSxJQUNqQixDQUFDO0FBR0QsUUFBSSxLQUFLLGFBQWE7QUFDckIsc0JBQWdCLFdBQVc7QUFBQSxRQUMxQixNQUFNLEtBQUssT0FBTyxFQUFFLGVBQWUsRUFBRSxRQUFRLFdBQVcsT0FBTyxLQUFLLGVBQWUsTUFBTSxDQUFDO0FBQUEsUUFDMUYsS0FBSztBQUFBLE1BQ04sQ0FBQztBQUFBLElBQ0Y7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSx5QkFBeUI7QUFDeEIsVUFBTSxVQUFVLEtBQUssVUFBVSxVQUFVLEVBQUUsS0FBSyxvQkFBb0IsQ0FBQztBQUVyRSxZQUFRLFdBQVc7QUFBQSxNQUNsQixNQUFNLEtBQUssT0FBTyxFQUFFLGFBQWEsRUFBRSxRQUFRLFdBQVcsT0FBTyxLQUFLLGNBQWMsSUFBSSxDQUFDO0FBQUEsTUFDckYsS0FBSztBQUFBLElBQ04sQ0FBQztBQUVELFVBQU0sZUFBZSxRQUFRLFNBQVMsVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDekUsaUNBQVEsY0FBYyxjQUFjO0FBQ3BDLGlCQUFhLGlCQUFpQixTQUFTLE1BQU07QUFDNUMsV0FBSyxlQUFlLFFBQVEsU0FBTyxLQUFLLGNBQWMsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDO0FBQ3hFLFdBQUssY0FBYztBQUFBLElBQ3BCLENBQUM7QUFFRCxVQUFNLGlCQUFpQixRQUFRLFNBQVMsVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDM0UsaUNBQVEsZ0JBQWdCLFFBQVE7QUFDaEMsbUJBQWUsaUJBQWlCLFNBQVMsTUFBTTtBQUM5QyxXQUFLLGNBQWMsTUFBTTtBQUN6QixXQUFLLGNBQWM7QUFBQSxJQUNwQixDQUFDO0FBRUQsVUFBTSxvQkFBb0IsUUFBUSxTQUFTLFVBQVUsRUFBRSxLQUFLLHdCQUF3QixDQUFDO0FBQ3JGLGlDQUFRLG1CQUFtQixTQUFTO0FBQ3BDLHNCQUFrQixpQkFBaUIsU0FBUyxNQUFNLEtBQUssZUFBZSxDQUFDO0FBR3ZFLFVBQU0sY0FBYyxRQUFRLFNBQVMsVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDeEUsaUNBQVEsYUFBYSxjQUFjO0FBQ25DLGdCQUFZLFFBQVEsS0FBSyxPQUFPLEVBQUUsWUFBWTtBQUM5QyxnQkFBWSxpQkFBaUIsU0FBUyxNQUFNLEtBQUssaUJBQWlCLENBQUM7QUFHbkUsVUFBTSxhQUFhLFFBQVEsU0FBUyxVQUFVLEVBQUUsS0FBSyxpQkFBaUIsQ0FBQztBQUN2RSxpQ0FBUSxZQUFZLFlBQVk7QUFDaEMsZUFBVyxRQUFRLEtBQUssT0FBTyxFQUFFLFlBQVk7QUFDN0MsZUFBVyxpQkFBaUIsU0FBUyxNQUFNLEtBQUssZ0JBQWdCLENBQUM7QUFFakUsVUFBTSxtQkFBbUIsUUFBUSxTQUFTLFVBQVUsRUFBRSxLQUFLLGlCQUFpQixDQUFDO0FBQzdFLGlDQUFRLGtCQUFrQixHQUFHO0FBQzdCLHFCQUFpQixpQkFBaUIsU0FBUyxNQUFNO0FBQ2hELFdBQUssa0JBQWtCO0FBQ3ZCLFdBQUssY0FBYyxNQUFNO0FBQ3pCLFdBQUssY0FBYztBQUFBLElBQ3BCLENBQUM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxtQkFBbUI7QUFDbEIsVUFBTSxhQUFhLEtBQUssS0FBSyxLQUFLLGVBQWUsU0FBUyxLQUFLLFFBQVE7QUFDdkUsUUFBSSxjQUFjLEVBQUc7QUFFckIsVUFBTSxhQUFhLEtBQUssVUFBVSxVQUFVLEVBQUUsS0FBSyxhQUFhLENBQUM7QUFHakUsVUFBTSxVQUFVLFdBQVcsU0FBUyxVQUFVLEVBQUUsS0FBSyxjQUFjLENBQUM7QUFDcEUsWUFBUSxjQUFjLEtBQUssT0FBTyxFQUFFLFVBQVU7QUFDOUMsWUFBUSxXQUFXLEtBQUssZUFBZTtBQUN2QyxZQUFRLGlCQUFpQixTQUFTLE1BQU07QUFDdkMsVUFBSSxLQUFLLGNBQWMsR0FBRztBQUN6QixhQUFLO0FBQ0wsYUFBSyxjQUFjO0FBQUEsTUFDcEI7QUFBQSxJQUNELENBQUM7QUFHRCxlQUFXLFdBQVc7QUFBQSxNQUNyQixNQUFNLEtBQUssT0FBTyxFQUFFLFVBQVUsRUFDNUIsUUFBUSxhQUFhLE9BQU8sS0FBSyxXQUFXLENBQUMsRUFDN0MsUUFBUSxXQUFXLE9BQU8sVUFBVSxDQUFDO0FBQUEsTUFDdkMsS0FBSztBQUFBLElBQ04sQ0FBQztBQUdELFVBQU0sVUFBVSxXQUFXLFNBQVMsVUFBVSxFQUFFLEtBQUssY0FBYyxDQUFDO0FBQ3BFLFlBQVEsY0FBYyxLQUFLLE9BQU8sRUFBRSxVQUFVO0FBQzlDLFlBQVEsV0FBVyxLQUFLLGVBQWU7QUFDdkMsWUFBUSxpQkFBaUIsU0FBUyxNQUFNO0FBQ3ZDLFVBQUksS0FBSyxjQUFjLFlBQVk7QUFDbEMsYUFBSztBQUNMLGFBQUssY0FBYztBQUFBLE1BQ3BCO0FBQUEsSUFDRCxDQUFDO0FBR0QsVUFBTSxZQUFZLFdBQVcsU0FBUyxTQUFTO0FBQUEsTUFDOUMsTUFBTTtBQUFBLE1BQ04sS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSyxPQUFPLFVBQVU7QUFBQSxRQUN0QixPQUFPLE9BQU8sS0FBSyxXQUFXO0FBQUEsTUFDL0I7QUFBQSxJQUNELENBQUM7QUFDRCxjQUFVLGlCQUFpQixVQUFVLENBQUMsTUFBTTtBQUMzQyxZQUFNLFNBQVMsRUFBRTtBQUNqQixVQUFJLE9BQU8sU0FBUyxPQUFPLE9BQU8sRUFBRTtBQUNwQyxVQUFJLE1BQU0sSUFBSSxFQUFHLFFBQU8sS0FBSztBQUM3QixhQUFPLEtBQUssSUFBSSxHQUFHLEtBQUssSUFBSSxNQUFNLFVBQVUsQ0FBQztBQUM3QyxXQUFLLGNBQWM7QUFDbkIsV0FBSyxjQUFjO0FBQUEsSUFDcEIsQ0FBQztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0saUJBQWlCO0FBQ3RCLFFBQUksS0FBSyxjQUFjLFNBQVMsR0FBRztBQUNsQyxVQUFJLHVCQUFPLEtBQUssT0FBTyxFQUFFLHVCQUF1QixFQUFFLFFBQVEsV0FBVyxHQUFHLENBQUM7QUFDekU7QUFBQSxJQUNEO0FBRUEsVUFBTSxZQUFZO0FBQUEsTUFDakIsS0FBSyxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsUUFBUSxXQUFXLE9BQU8sS0FBSyxjQUFjLElBQUksQ0FBQztBQUFBLElBQzFGO0FBRUEsUUFBSSxXQUFXO0FBQ2QsWUFBTSxnQkFBZ0IsS0FBSyxlQUFlO0FBQUEsUUFBTyxTQUNoRCxLQUFLLGNBQWMsSUFBSSxJQUFJLEtBQUssSUFBSTtBQUFBLE1BQ3JDO0FBR0EsWUFBTSxVQUFVLE1BQU0sUUFBUTtBQUFBLFFBQzdCLGNBQWMsSUFBSSxTQUFPLEtBQUssT0FBTyxlQUFlLElBQUksSUFBSSxDQUFDO0FBQUEsTUFDOUQ7QUFHQSxZQUFNLGVBQWUsUUFBUSxPQUFPLE9BQUssQ0FBQyxFQUFFO0FBQzVDLFlBQU0sWUFBWSxRQUFRLE9BQU8sT0FBSyxDQUFDLENBQUMsRUFBRTtBQUUxQyxVQUFJLGVBQWUsR0FBRztBQUNyQixZQUFJLHVCQUFPLEtBQUssT0FBTyxFQUFFLGNBQWMsRUFBRSxRQUFRLFdBQVcsT0FBTyxZQUFZLENBQUMsQ0FBQztBQUFBLE1BQ2xGO0FBQ0EsVUFBSSxZQUFZLEdBQUc7QUFDbEIsWUFBSSx1QkFBTyxLQUFLLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxRQUFRLFdBQVcsT0FBTyxTQUFTLENBQUMsR0FBRyxHQUFJO0FBQUEsTUFDMUY7QUFFQSxXQUFLLGNBQWMsTUFBTTtBQUN6QixXQUFLLGtCQUFrQjtBQUN2QixZQUFNLEtBQUssY0FBYztBQUFBLElBQzFCO0FBQUEsRUFDRDtBQUFBLEVBRUEsZUFBZTtBQUNkLFVBQU0sU0FBUyxLQUFLLFVBQVUsVUFBVSxFQUFFLEtBQUssdUJBQXVCLENBQUM7QUFFdkUsV0FBTyxTQUFTLE1BQU0sRUFBRSxNQUFNLEtBQUssT0FBTyxFQUFFLGNBQWMsRUFBRSxDQUFDO0FBRTdELFVBQU0sUUFBUSxPQUFPLFVBQVUsRUFBRSxLQUFLLGNBQWMsQ0FBQztBQUNyRCxVQUFNLFdBQVcsRUFBRSxNQUFNLEtBQUssT0FBTyxFQUFFLGlCQUFpQixFQUFFLFFBQVEsV0FBVyxPQUFPLEtBQUssZUFBZSxNQUFNLENBQUMsRUFBRSxDQUFDO0FBR2xILFVBQU0sYUFBYSxPQUFPLFNBQVMsVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDdEUsaUNBQVEsWUFBWSxZQUFZO0FBQ2hDLGVBQVcsaUJBQWlCLFNBQVMsTUFBTSxLQUFLLGNBQWMsQ0FBQztBQUcvRCxVQUFNLFlBQVksT0FBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLGlCQUFpQixDQUFDO0FBQ3JFLGlDQUFRLFdBQVcsY0FBYztBQUNqQyxjQUFVLGlCQUFpQixTQUFTLE1BQU07QUFDekMsV0FBSyxrQkFBa0IsQ0FBQyxLQUFLO0FBQzdCLFVBQUksQ0FBQyxLQUFLLGlCQUFpQjtBQUMxQixhQUFLLGNBQWMsTUFBTTtBQUFBLE1BQzFCO0FBQ0EsV0FBSyxjQUFjO0FBQUEsSUFDcEIsQ0FBQztBQUNELGNBQVUsUUFBUSxLQUFLLE9BQU8sRUFBRSxpQkFBaUI7QUFHakQsVUFBTSxhQUFhLE9BQU8sU0FBUyxVQUFVLEVBQUUsS0FBSyxjQUFjLENBQUM7QUFDbkUsVUFBTSxVQUFVO0FBQUEsTUFDZixFQUFFLE9BQU8sUUFBUSxNQUFNLEtBQUssT0FBTyxFQUFFLFlBQVksRUFBRTtBQUFBLE1BQ25ELEVBQUUsT0FBTyxRQUFRLE1BQU0sS0FBSyxPQUFPLEVBQUUsWUFBWSxFQUFFO0FBQUEsTUFDbkQsRUFBRSxPQUFPLFFBQVEsTUFBTSxLQUFLLE9BQU8sRUFBRSxZQUFZLEVBQUU7QUFBQSxJQUNwRDtBQUNBLFlBQVEsUUFBUSxTQUFPO0FBQ3RCLFlBQU0sU0FBUyxXQUFXLFNBQVMsVUFBVSxFQUFFLE9BQU8sSUFBSSxPQUFPLE1BQU0sSUFBSSxLQUFLLENBQUM7QUFDakYsVUFBSSxLQUFLLE9BQU8sU0FBUyxXQUFXLElBQUksT0FBTztBQUM5QyxlQUFPLGFBQWEsWUFBWSxVQUFVO0FBQUEsTUFDM0M7QUFBQSxJQUNELENBQUM7QUFDRCxlQUFXLGlCQUFpQixVQUFVLE9BQU8sTUFBTTtBQUNsRCxZQUFNLFNBQVMsRUFBRTtBQUNqQixXQUFLLE9BQU8sU0FBUyxTQUFTLE9BQU87QUFDckMsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUMvQixXQUFLLFdBQVc7QUFDaEIsV0FBSyxjQUFjO0FBQ25CLFdBQUssY0FBYztBQUFBLElBQ3BCLENBQUM7QUFHRCxVQUFNLFdBQVcsT0FBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLGVBQWUsQ0FBQztBQUNsRSxhQUFTLGlCQUFpQixTQUFTLFlBQVk7QUFDOUMsV0FBSyxPQUFPLFNBQVMsWUFBWSxLQUFLLE9BQU8sU0FBUyxjQUFjLFFBQVEsU0FBUztBQUNyRixZQUFNLEtBQUssT0FBTyxhQUFhO0FBQy9CLFdBQUssV0FBVztBQUNoQixXQUFLLGNBQWM7QUFDbkIsV0FBSyxjQUFjO0FBQUEsSUFDcEIsQ0FBQztBQUNELGlDQUFRLFVBQVUsS0FBSyxPQUFPLFNBQVMsY0FBYyxRQUFRLGFBQWEsWUFBWTtBQUFBLEVBQ3ZGO0FBQUEsRUFFQSxhQUFhO0FBQ1osVUFBTSxFQUFFLFFBQVEsVUFBVSxJQUFJLEtBQUssT0FBTztBQUMxQyxVQUFNLGFBQWEsY0FBYyxRQUFRLElBQUk7QUFFN0MsU0FBSyxPQUFPLEtBQUssQ0FBQyxHQUFHLE1BQU07QUFDMUIsY0FBUSxRQUFRO0FBQUEsUUFDZixLQUFLO0FBQ0osaUJBQU8sYUFBYSxFQUFFLEtBQUssY0FBYyxFQUFFLElBQUk7QUFBQSxRQUNoRCxLQUFLO0FBQ0osaUJBQU8sY0FBYyxFQUFFLFdBQVcsRUFBRTtBQUFBLFFBQ3JDLEtBQUs7QUFDSixpQkFBTyxjQUFjLEVBQUUsT0FBTyxFQUFFO0FBQUEsUUFDakM7QUFDQyxpQkFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNELENBQUM7QUFBQSxFQUNGO0FBQUEsRUFFUSx3QkFBd0IsV0FBd0IsVUFBa0IsT0FBZTtBQUN4RixjQUFVLE1BQU07QUFFaEIsVUFBTSxXQUFXLFVBQVUsVUFBVTtBQUNyQyxhQUFTLE1BQU0sUUFBUTtBQUN2QixhQUFTLE1BQU0sU0FBUztBQUN4QixhQUFTLE1BQU0sVUFBVTtBQUN6QixhQUFTLE1BQU0sZ0JBQWdCO0FBQy9CLGFBQVMsTUFBTSxhQUFhO0FBQzVCLGFBQVMsTUFBTSxpQkFBaUI7QUFDaEMsYUFBUyxNQUFNLE1BQU07QUFDckIsYUFBUyxNQUFNLFFBQVE7QUFFdkIsVUFBTSxTQUFTLFNBQVMsVUFBVTtBQUNsQyxpQ0FBUSxRQUFRLFFBQVE7QUFFeEIsVUFBTSxVQUFVLFNBQVMsVUFBVSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ2xELFlBQVEsTUFBTSxXQUFXO0FBQ3pCLFlBQVEsTUFBTSxnQkFBZ0I7QUFBQSxFQUMvQjtBQUFBLEVBRVEscUJBQXFCLFdBQXdCLE1BQWEsYUFBcUI7QUFDdEYsVUFBTSxZQUFZLGFBQWEsS0FBSyxJQUFJO0FBQ3hDLFVBQU0sTUFBTSxLQUFLLElBQUksTUFBTSxnQkFBZ0IsSUFBSTtBQUUvQyxRQUFJLGNBQWMsU0FBUztBQUUxQixXQUFLLHNCQUFzQixXQUFXLE1BQU0sS0FBSyxXQUFXO0FBQzVEO0FBQUEsSUFDRDtBQUVBLFFBQUksY0FBYyxTQUFTO0FBQzFCLFlBQU0sUUFBUSxVQUFVLFNBQVMsT0FBTztBQUN4QyxZQUFNLE1BQU07QUFDWixZQUFNLFFBQVE7QUFDZCxZQUFNLFVBQVU7QUFDaEIsWUFBTSxjQUFjO0FBQ3BCLFlBQU0sTUFBTSxRQUFRO0FBQ3BCLFlBQU0sTUFBTSxTQUFTO0FBQ3JCLFlBQU0sTUFBTSxZQUFZO0FBQ3hCLFlBQU0saUJBQWlCLFNBQVMsTUFBTTtBQUNyQyxhQUFLLHdCQUF3QixXQUFXLFNBQVMsT0FBTztBQUFBLE1BQ3pELENBQUM7QUFDRDtBQUFBLElBQ0Q7QUFFQSxRQUFJLGNBQWMsU0FBUztBQUMxQixXQUFLLHdCQUF3QixXQUFXLFNBQVMsT0FBTztBQUN4RDtBQUFBLElBQ0Q7QUFFQSxRQUFJLGNBQWMsWUFBWTtBQUM3QixXQUFLLHdCQUF3QixXQUFXLGFBQWEsd0JBQXdCLEtBQUssSUFBSSxDQUFDO0FBQ3ZGO0FBQUEsSUFDRDtBQUVBLFNBQUssd0JBQXdCLFdBQVcsUUFBUSxNQUFNO0FBQUEsRUFDdkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTVEsc0JBQXNCLFdBQXdCLE1BQWEsS0FBYSxhQUFxQjtBQUNwRyxVQUFNLFFBQVEsS0FBSyxPQUFPO0FBQzFCLFVBQU0sUUFBUSxLQUFLLEtBQUs7QUFHeEIsVUFBTSxNQUFNLFVBQVUsU0FBUyxPQUFPO0FBQUEsTUFDckMsTUFBTSxFQUFFLEtBQUssWUFBWTtBQUFBLElBQzFCLENBQUM7QUFDRCxRQUFJLE1BQU0sVUFBVTtBQUNwQixRQUFJLE1BQU0sYUFBYTtBQUV2QixRQUFJLGlCQUFpQixTQUFTLE1BQU07QUFDbkMsZ0JBQVUsTUFBTTtBQUNoQixnQkFBVSxVQUFVO0FBQUEsUUFDbkIsS0FBSztBQUFBLFFBQ0wsTUFBTSxLQUFLLE9BQU8sRUFBRSxnQkFBZ0I7QUFBQSxNQUNyQyxDQUFDO0FBQUEsSUFDRixDQUFDO0FBR0QsUUFBSSxLQUFLLFVBQVUsWUFBWSxNQUFNLE9BQU87QUFDM0MsVUFBSSxNQUFNO0FBQ1YsVUFBSSxNQUFNLFVBQVU7QUFDcEI7QUFBQSxJQUNEO0FBR0EsU0FBSyxNQUFNLElBQUksS0FBSyxNQUFNLEtBQUssRUFBRSxLQUFLLGVBQWE7QUFDbEQsVUFBSSxXQUFXO0FBQ2QsWUFBSSxNQUFNO0FBQ1YsWUFBSSxNQUFNLFVBQVU7QUFBQSxNQUNyQixPQUFPO0FBRU4sWUFBSSxNQUFNO0FBQ1YsWUFBSSxNQUFNLFVBQVU7QUFHcEIsYUFBSyxrQkFBa0IsS0FBSyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsTUFBTSxPQUFPLE9BQU8sTUFBTTtBQUNsRSxpQkFBTyxNQUFNLElBQUksS0FBSyxNQUFNLE9BQU8sTUFBTSxPQUFPLE1BQU07QUFBQSxRQUN2RCxDQUFDLEVBQUUsTUFBTSxNQUFNO0FBQUEsUUFFZixDQUFDO0FBQUEsTUFDRjtBQUFBLElBQ0QsQ0FBQztBQUFBLEVBQ0Y7QUFBQSxFQUVBLGdCQUFnQixXQUF3QixPQUFrQjtBQUN6RCxVQUFNLE9BQU8sVUFBVSxVQUFVLEVBQUUsS0FBSyxhQUFhLENBQUM7QUFHdEQsUUFBSSxLQUFLLGlCQUFpQjtBQUN6QixZQUFNLFdBQVcsS0FBSyxTQUFTLFNBQVM7QUFBQSxRQUN2QyxNQUFNO0FBQUEsUUFDTixLQUFLO0FBQUEsTUFDTixDQUFDO0FBQ0QsZUFBUyxVQUFVLEtBQUssY0FBYyxJQUFJLE1BQU0sS0FBSyxJQUFJO0FBQ3pELGVBQVMsaUJBQWlCLFVBQVUsQ0FBQyxNQUFNO0FBQzFDLGNBQU0sU0FBUyxFQUFFO0FBQ2pCLFlBQUksT0FBTyxTQUFTO0FBQ25CLGVBQUssY0FBYyxJQUFJLE1BQU0sS0FBSyxJQUFJO0FBQUEsUUFDdkMsT0FBTztBQUNOLGVBQUssY0FBYyxPQUFPLE1BQU0sS0FBSyxJQUFJO0FBQUEsUUFDMUM7QUFBQSxNQUNELENBQUM7QUFBQSxJQUNGO0FBR0EsVUFBTSxlQUFlLEtBQUssVUFBVSxFQUFFLEtBQUssa0JBQWtCLENBQUM7QUFFOUQsVUFBTSxPQUFPLE1BQU07QUFDbkIsU0FBSyxxQkFBcUIsY0FBYyxNQUFNLE1BQU0sSUFBSTtBQUV4RCxpQkFBYSxpQkFBaUIsU0FBUyxNQUFNO0FBQzVDLFVBQUksS0FBSyxpQkFBaUI7QUFFekIsWUFBSSxLQUFLLGNBQWMsSUFBSSxNQUFNLEtBQUssSUFBSSxHQUFHO0FBQzVDLGVBQUssY0FBYyxPQUFPLE1BQU0sS0FBSyxJQUFJO0FBQUEsUUFDMUMsT0FBTztBQUNOLGVBQUssY0FBYyxJQUFJLE1BQU0sS0FBSyxJQUFJO0FBQUEsUUFDdkM7QUFDQSxhQUFLLGNBQWM7QUFBQSxNQUNwQixPQUFPO0FBRU4sYUFBSyxPQUFPLGlCQUFpQixNQUFNLElBQUk7QUFBQSxNQUN4QztBQUFBLElBQ0QsQ0FBQztBQUdELFNBQUssaUJBQWlCLGVBQWUsQ0FBQyxNQUFNO0FBQzNDLFFBQUUsZUFBZTtBQUNqQixXQUFLLGdCQUFnQixHQUFpQixJQUFJO0FBQUEsSUFDM0MsQ0FBQztBQUdELFFBQUksS0FBSyxPQUFPLFNBQVMsZUFBZTtBQUN2QyxZQUFNLE9BQU8sS0FBSyxVQUFVLEVBQUUsS0FBSyxhQUFhLENBQUM7QUFDakQsV0FBSyxVQUFVLEVBQUUsS0FBSyxjQUFjLE1BQU0sTUFBTSxLQUFLLENBQUM7QUFDdEQsV0FBSyxVQUFVLEVBQUUsS0FBSyxjQUFjLE1BQU0sZUFBZSxNQUFNLElBQUksRUFBRSxDQUFDO0FBQUEsSUFDdkU7QUFBQSxFQUNEO0FBQUEsRUFFQSxnQkFBZ0IsT0FBbUIsTUFBYTtBQUMvQyxVQUFNLE9BQU8sSUFBSSxxQkFBSztBQUV0QixTQUFLLFFBQVEsQ0FBQyxTQUFtQjtBQUNoQyxXQUFLLFNBQVMsS0FBSyxPQUFPLEVBQUUsYUFBYSxDQUFDLEVBQ3hDLFFBQVEsUUFBUSxFQUNoQixRQUFRLE1BQU07QUFDZCxhQUFLLE9BQU8saUJBQWlCLElBQUk7QUFBQSxNQUNsQyxDQUFDO0FBQUEsSUFDSCxDQUFDO0FBRUQsU0FBSyxRQUFRLENBQUMsU0FBbUI7QUFDaEMsV0FBSyxTQUFTLEtBQUssT0FBTyxFQUFFLFVBQVUsQ0FBQyxFQUNyQyxRQUFRLE1BQU0sRUFDZCxRQUFRLE1BQU07QUFDZCxhQUFLLFVBQVUsVUFBVSxVQUFVLEtBQUssSUFBSSxFQUFFLEtBQUssTUFBTTtBQUN4RCxjQUFJLHVCQUFPLEtBQUssT0FBTyxFQUFFLFlBQVksQ0FBQztBQUFBLFFBQ3ZDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVTtBQUNuQixrQkFBUSxNQUFNLHFEQUFhLEtBQUs7QUFDaEMsY0FBSSx1QkFBTyxLQUFLLE9BQU8sRUFBRSxPQUFPLENBQUM7QUFBQSxRQUNsQyxDQUFDO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSCxDQUFDO0FBRUQsU0FBSyxRQUFRLENBQUMsU0FBbUI7QUFDaEMsV0FBSyxTQUFTLEtBQUssT0FBTyxFQUFFLFVBQVUsQ0FBQyxFQUNyQyxRQUFRLE1BQU0sRUFDZCxRQUFRLE1BQU07QUFDZCxjQUFNLE9BQU8sS0FBSyxPQUFPLGtCQUFrQixJQUFJO0FBQy9DLGFBQUssVUFBVSxVQUFVLFVBQVUsSUFBSSxFQUFFLEtBQUssTUFBTTtBQUNuRCxjQUFJLHVCQUFPLEtBQUssT0FBTyxFQUFFLFlBQVksQ0FBQztBQUFBLFFBQ3ZDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVTtBQUNuQixrQkFBUSxNQUFNLHFEQUFhLEtBQUs7QUFDaEMsY0FBSSx1QkFBTyxLQUFLLE9BQU8sRUFBRSxPQUFPLENBQUM7QUFBQSxRQUNsQyxDQUFDO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSCxDQUFDO0FBRUQsU0FBSyxRQUFRLENBQUMsU0FBbUI7QUFDaEMsV0FBSyxTQUFTLEtBQUssT0FBTyxFQUFFLGNBQWMsQ0FBQyxFQUN6QyxRQUFRLGVBQWUsRUFDdkIsUUFBUSxNQUFNO0FBQ2QsYUFBSyxLQUFLLE9BQU8saUJBQWlCLElBQUk7QUFBQSxNQUN2QyxDQUFDO0FBQUEsSUFDSCxDQUFDO0FBR0QsUUFBSSxhQUFhLEtBQUssSUFBSSxNQUFNLFNBQVM7QUFDeEMsV0FBSyxhQUFhO0FBRWxCLFdBQUssUUFBUSxDQUFDLFNBQW1CO0FBQ2hDLGFBQUssU0FBUyxLQUFLLE9BQU8sRUFBRSxZQUFZLENBQUMsRUFDdkMsUUFBUSxjQUFjLEVBQ3RCLFFBQVEsTUFBTSxLQUFLLGFBQWEsSUFBSSxDQUFDO0FBQUEsTUFDeEMsQ0FBQztBQUVELFVBQUksS0FBSyxtQkFBbUIsSUFBSSxHQUFHO0FBQ2xDLGFBQUssUUFBUSxDQUFDLFNBQW1CO0FBQ2hDLGVBQUssU0FBUyxLQUFLLE9BQU8sRUFBRSxZQUFZLENBQUMsRUFDdkMsUUFBUSxZQUFZLEVBQ3BCLFFBQVEsTUFBTSxLQUFLLFlBQVksSUFBSSxDQUFDO0FBQUEsUUFDdkMsQ0FBQztBQUFBLE1BQ0Y7QUFBQSxJQUNEO0FBRUEsU0FBSyxlQUFlLEVBQUUsR0FBRyxNQUFNLFNBQVMsR0FBRyxNQUFNLFFBQVEsQ0FBQztBQUFBLEVBQzNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFjLGFBQWEsTUFBYTtBQUN2QyxVQUFNLFFBQVEsS0FBSyxPQUFPLFNBQVM7QUFDbkMsVUFBTSxPQUFPLGlCQUFpQixPQUFPLElBQUk7QUFDekMsUUFBSSxDQUFDLE1BQU07QUFDVixVQUFJLHVCQUFPLEtBQUssT0FBTyxFQUFFLGlCQUFpQixDQUFDO0FBQzNDO0FBQUEsSUFDRDtBQUVBLFVBQU0sTUFBTSxNQUFNLEtBQUsscUJBQXFCLElBQUk7QUFDaEQsVUFBTSxTQUFTLGNBQWMsTUFBTSxHQUFHO0FBRXRDLFFBQUksT0FBTyxZQUFZLEtBQUssS0FBTTtBQUVsQyxVQUFNLEtBQUssT0FBTyxtQkFBbUIsT0FBTyxRQUFRLFVBQVUsR0FBRyxPQUFPLFFBQVEsWUFBWSxHQUFHLENBQUMsQ0FBQztBQUNqRyxVQUFNLEtBQUssSUFBSSxZQUFZLFdBQVcsTUFBTSxPQUFPLE9BQU87QUFDMUQsUUFBSSx1QkFBTyxLQUFLLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQUEsRUFDM0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQWMsbUJBQW1CO0FBQ2hDLFFBQUksS0FBSyxjQUFjLFNBQVMsRUFBRztBQUVuQyxVQUFNLFFBQVEsS0FBSyxPQUFPLFNBQVM7QUFDbkMsUUFBSSxpQkFBaUI7QUFFckIsZUFBVyxRQUFRLEtBQUssZUFBZTtBQUN0QyxZQUFNLE9BQU8sS0FBSyxJQUFJLE1BQU0sc0JBQXNCLElBQUk7QUFDdEQsVUFBSSxFQUFFLGdCQUFnQix1QkFBUTtBQUU5QixZQUFNLE9BQU8saUJBQWlCLE9BQU8sSUFBSTtBQUN6QyxVQUFJLENBQUMsS0FBTTtBQUVYLFlBQU0sTUFBTSxNQUFNLEtBQUsscUJBQXFCLElBQUk7QUFDaEQsWUFBTSxTQUFTLGNBQWMsTUFBTSxHQUFHO0FBRXRDLFVBQUksT0FBTyxZQUFZLEtBQUssS0FBTTtBQUVsQyxVQUFJO0FBQ0gsY0FBTSxLQUFLLE9BQU8sbUJBQW1CLE9BQU8sUUFBUSxVQUFVLEdBQUcsT0FBTyxRQUFRLFlBQVksR0FBRyxDQUFDLENBQUM7QUFDakcsY0FBTSxLQUFLLElBQUksWUFBWSxXQUFXLE1BQU0sT0FBTyxPQUFPO0FBQzFEO0FBQUEsTUFDRCxTQUFTLE9BQU87QUFDZixnQkFBUSxLQUFLLHlDQUFXLEtBQUssSUFBSSxJQUFJLEtBQUs7QUFBQSxNQUMzQztBQUFBLElBQ0Q7QUFFQSxRQUFJLHVCQUFPLEtBQUssT0FBTyxFQUFFLG9CQUFvQixFQUFFLE9BQU8sZUFBZSxDQUFDLENBQUM7QUFDdkUsU0FBSyxjQUFjLE1BQU07QUFDekIsU0FBSyxrQkFBa0I7QUFDdkIsVUFBTSxLQUFLLGNBQWM7QUFBQSxFQUMxQjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBYyxxQkFBcUIsTUFBdUM7QUFDekUsVUFBTSxPQUFPLElBQUksS0FBSyxLQUFLLEtBQUssS0FBSztBQUNyQyxVQUFNLE1BQXVCLEVBQUUsTUFBTSxLQUFLO0FBRzFDLFVBQU0sTUFBTSxLQUFLLFVBQVUsWUFBWTtBQUN2QyxRQUFJLFFBQVEsU0FBUyxRQUFRLFFBQVE7QUFDcEMsVUFBSTtBQUNILGNBQU0sU0FBUyxNQUFNLEtBQUssSUFBSSxNQUFNLFdBQVcsSUFBSTtBQUNuRCxZQUFJLE9BQU8sVUFBVSxNQUFNO0FBQUEsTUFDNUIsUUFBUTtBQUFBLE1BQXVCO0FBQUEsSUFDaEM7QUFFQSxXQUFPO0FBQUEsRUFDUjtBQUFBLEVBRVEscUJBQXFCO0FBQzVCLFVBQU0sV0FBVyxLQUFLLE9BQU87QUFDN0IsV0FBTztBQUFBLE1BQ04sU0FBUyxTQUFTO0FBQUEsTUFDbEIsUUFBUSxTQUFTO0FBQUEsTUFDakIsV0FBVyxTQUFTLGdCQUFnQjtBQUFBLFFBQ25DLE1BQU0sU0FBUztBQUFBLFFBQ2YsVUFBVTtBQUFBLFFBQ1YsU0FBUztBQUFBLE1BQ1YsSUFBSTtBQUFBLElBQ0w7QUFBQSxFQUNEO0FBQUEsRUFFQSxNQUFjLHNCQUFzQixNQUlqQztBQUNGLFVBQU0sTUFBTSxLQUFLLElBQUksTUFBTSxnQkFBZ0IsSUFBSTtBQUMvQyxVQUFNLGVBQWUsS0FBSyxLQUFLO0FBQy9CLFVBQU0sU0FBUyxNQUFNLGFBQWEsS0FBSyxjQUFjLEtBQUssbUJBQW1CLENBQUM7QUFDOUUsVUFBTSxTQUFTLG1CQUFtQixPQUFPLE1BQU07QUFDL0MsVUFBTSxXQUFXLEtBQUssS0FBSyxRQUFRLFlBQVksRUFBRTtBQUNqRCxVQUFNLFVBQVUsS0FBSyxTQUNsQixHQUFHLEtBQUssT0FBTyxJQUFJLElBQUksUUFBUSxHQUFHLE1BQU0sS0FDeEMsR0FBRyxRQUFRLEdBQUcsTUFBTTtBQUN2QixVQUFNLGNBQWMsTUFBTSxPQUFPLEtBQUssWUFBWTtBQUVsRCxRQUFJLFlBQVksS0FBSyxNQUFNO0FBQzFCLFlBQU0sS0FBSyxJQUFJLE1BQU0sYUFBYSxNQUFNLFdBQVc7QUFDbkQsYUFBTztBQUFBLFFBQ047QUFBQSxRQUNBO0FBQUEsUUFDQSxTQUFTLE9BQU87QUFBQSxNQUNqQjtBQUFBLElBQ0Q7QUFFQSxVQUFNLFdBQVcsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLE9BQU87QUFDN0QsUUFBSSxZQUFZLFNBQVMsU0FBUyxLQUFLLE1BQU07QUFDNUMsWUFBTSxJQUFJLE1BQU0sS0FBSyxPQUFPLEVBQUUsa0JBQWtCLENBQUM7QUFBQSxJQUNsRDtBQUVBLFVBQU0saUJBQWlCLE1BQU0sS0FBSyxJQUFJLE1BQU0sV0FBVyxJQUFJO0FBRzNELFVBQU0sS0FBSyxJQUFJLE1BQU0sYUFBYSxNQUFNLFdBQVc7QUFFbkQsUUFBSTtBQUNILFlBQU0sS0FBSyxJQUFJLFlBQVksV0FBVyxNQUFNLE9BQU87QUFBQSxJQUNwRCxTQUFTLE9BQU87QUFDZixVQUFJO0FBQ0gsY0FBTSxLQUFLLElBQUksTUFBTSxhQUFhLE1BQU0sY0FBYztBQUFBLE1BQ3ZELFNBQVMsZUFBZTtBQUN2QixnQkFBUSxNQUFNLGlFQUFlLEtBQUssSUFBSSxJQUFJLGFBQWE7QUFBQSxNQUN4RDtBQUNBLFlBQU07QUFBQSxJQUNQO0FBRUEsV0FBTztBQUFBLE1BQ047QUFBQSxNQUNBO0FBQUEsTUFDQSxTQUFTLE9BQU87QUFBQSxJQUNqQjtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQWMsWUFBWSxNQUFhO0FBQ3RDLFFBQUksQ0FBQyxLQUFLLG1CQUFtQixJQUFJLEdBQUc7QUFDbkMsVUFBSSx1QkFBTyxLQUFLLE9BQU8sRUFBRSxxQkFBcUIsQ0FBQztBQUMvQztBQUFBLElBQ0Q7QUFFQSxRQUFJO0FBQ0gsWUFBTSxFQUFFLFVBQVUsY0FBYyxRQUFRLElBQUksTUFBTSxLQUFLLHNCQUFzQixJQUFJO0FBQ2pGLFlBQU0sUUFBUSxLQUFLLElBQUksR0FBRyxlQUFlLE9BQU87QUFDaEQsVUFBSSx1QkFBTyxVQUFLLFFBQVEsS0FBSyxlQUFlLFlBQVksQ0FBQyxXQUFNLGVBQWUsT0FBTyxDQUFDLGtCQUFRLGVBQWUsS0FBSyxDQUFDLEdBQUc7QUFBQSxJQUN2SCxTQUFTLE9BQU87QUFDZixjQUFRLE1BQU0sNkJBQVMsS0FBSyxJQUFJLElBQUksS0FBSztBQUN6QyxVQUFJLHVCQUFPLEtBQUssT0FBTyxFQUFFLE9BQU8sSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO0FBQUEsSUFDckQ7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFjLGtCQUFrQjtBQUMvQixRQUFJLEtBQUssY0FBYyxTQUFTLEVBQUc7QUFFbkMsUUFBSSxZQUFZO0FBQ2hCLFFBQUksVUFBVTtBQUNkLFFBQUksYUFBYTtBQUVqQixlQUFXLFFBQVEsS0FBSyxlQUFlO0FBQ3RDLFlBQU0sT0FBTyxLQUFLLElBQUksTUFBTSxzQkFBc0IsSUFBSTtBQUN0RCxVQUFJLEVBQUUsZ0JBQWdCLHVCQUFRO0FBQzlCLFVBQUksQ0FBQyxLQUFLLG1CQUFtQixJQUFJLEdBQUc7QUFDbkM7QUFDQTtBQUFBLE1BQ0Q7QUFFQSxVQUFJO0FBQ0gsY0FBTSxFQUFFLGNBQWMsUUFBUSxJQUFJLE1BQU0sS0FBSyxzQkFBc0IsSUFBSTtBQUN2RTtBQUNBLHNCQUFjLEtBQUssSUFBSSxHQUFHLGVBQWUsT0FBTztBQUFBLE1BQ2pELFNBQVMsT0FBTztBQUNmLGdCQUFRLEtBQUssNkJBQVMsSUFBSSxJQUFJLEtBQUs7QUFBQSxNQUNwQztBQUFBLElBQ0Q7QUFFQSxVQUFNLFNBQVMsVUFBVSxJQUFJLHNCQUFPLE9BQU8sZ0RBQWE7QUFDeEQsUUFBSSx1QkFBTyxvQ0FBVyxTQUFTLHlDQUFXLGVBQWUsVUFBVSxDQUFDLEdBQUcsTUFBTSxFQUFFO0FBQy9FLFNBQUssY0FBYyxNQUFNO0FBQ3pCLFNBQUssa0JBQWtCO0FBQ3ZCLFVBQU0sS0FBSyxjQUFjO0FBQUEsRUFDMUI7QUFBQTtBQUdEOzs7QVExM0JBLElBQUFDLG1CQUFnRjs7O0FDQWhGLElBQUFDLG1CQUFxQztBQVk5QixJQUFNLHFCQUFOLGNBQWlDLHVCQUFNO0FBQUEsRUFNN0MsWUFDQyxLQUNBLFFBQ0EsUUFDQSxXQUNDO0FBQ0QsVUFBTSxHQUFHO0FBUlYsU0FBUSxhQUFzQjtBQVM3QixTQUFLLFNBQVM7QUFDZCxTQUFLLFNBQVM7QUFDZCxTQUFLLFlBQVk7QUFBQSxFQUNsQjtBQUFBLEVBRUEsU0FBUztBQUNSLFVBQU0sRUFBRSxVQUFVLElBQUk7QUFDdEIsY0FBVSxNQUFNO0FBR2hCLFVBQU1DLEtBQUksQ0FBQyxRQUFnQixLQUFLLE9BQU8sRUFBRSxHQUFHO0FBRzVDLGNBQVUsU0FBUyxNQUFNO0FBQUEsTUFDeEIsTUFBTSxLQUFLLE9BQU8sV0FBVyxJQUMxQkEsR0FBRSxtQkFBbUIsRUFBRSxRQUFRLFVBQVUsS0FBSyxPQUFPLENBQUMsRUFBRSxJQUFJLElBQzVEQSxHQUFFLHVCQUF1QixFQUFFLFFBQVEsV0FBVyxPQUFPLEtBQUssT0FBTyxNQUFNLENBQUM7QUFBQSxJQUM1RSxDQUFDO0FBR0QsVUFBTSxVQUFVLFVBQVUsVUFBVSxFQUFFLEtBQUssZ0JBQWdCLENBQUM7QUFDNUQsVUFBTSxjQUFjLFFBQVEsU0FBUyxHQUFHO0FBQ3hDLGdCQUFZLGNBQWMsS0FBSyxPQUFPLFNBQVMsaUJBQzVDQSxHQUFFLGVBQWUsSUFDakJBLEdBQUUsaUJBQWlCO0FBQ3RCLGdCQUFZLE1BQU0sUUFBUTtBQUMxQixnQkFBWSxNQUFNLFNBQVM7QUFHM0IsVUFBTSxnQkFBZ0IsVUFBVSxVQUFVLEVBQUUsS0FBSyxrQkFBa0IsQ0FBQztBQUNwRSxrQkFBYyxTQUFTLE1BQU0sRUFBRSxNQUFNQSxHQUFFLGVBQWUsRUFBRSxDQUFDO0FBRXpELFVBQU0sT0FBTyxjQUFjLFNBQVMsSUFBSTtBQUN4QyxVQUFNLFVBQVU7QUFDaEIsYUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLLElBQUksS0FBSyxPQUFPLFFBQVEsT0FBTyxHQUFHLEtBQUs7QUFDL0QsWUFBTSxNQUFNLEtBQUssT0FBTyxDQUFDO0FBQ3pCLFdBQUssU0FBUyxNQUFNO0FBQUEsUUFDbkIsTUFBTSxHQUFHLElBQUksSUFBSSxLQUFLLGVBQWUsSUFBSSxJQUFJLENBQUM7QUFBQSxNQUMvQyxDQUFDO0FBQUEsSUFDRjtBQUNBLFFBQUksS0FBSyxPQUFPLFNBQVMsU0FBUztBQUNqQyxXQUFLLFNBQVMsTUFBTTtBQUFBLFFBQ25CLE1BQU0sT0FBTyxLQUFLLE9BQU8sU0FBUyxPQUFPLElBQUlBLEdBQUUsY0FBYyxDQUFDO0FBQUEsTUFDL0QsQ0FBQztBQUFBLElBQ0Y7QUFHQSxVQUFNLGtCQUFrQixVQUFVLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBQ3BFLG9CQUFnQixNQUFNLFVBQVU7QUFDaEMsb0JBQWdCLE1BQU0sTUFBTTtBQUM1QixvQkFBZ0IsTUFBTSxpQkFBaUI7QUFDdkMsb0JBQWdCLE1BQU0sWUFBWTtBQUdsQyxVQUFNLFlBQVksZ0JBQWdCLFNBQVMsVUFBVTtBQUFBLE1BQ3BELE1BQU1BLEdBQUUsUUFBUTtBQUFBLE1BQ2hCLEtBQUs7QUFBQSxJQUNOLENBQUM7QUFDRCxjQUFVLGlCQUFpQixTQUFTLE1BQU0sS0FBSyxNQUFNLENBQUM7QUFHdEQsVUFBTSxZQUFZLGdCQUFnQixTQUFTLFVBQVU7QUFBQSxNQUNwRCxNQUFNLEtBQUssT0FBTyxTQUFTLGlCQUFpQkEsR0FBRSxlQUFlLElBQUlBLEdBQUUsUUFBUTtBQUFBLE1BQzNFLEtBQUs7QUFBQSxJQUNOLENBQUM7QUFDRCxjQUFVLGlCQUFpQixTQUFTLFlBQVk7QUFDL0MsVUFBSSxLQUFLLFdBQVk7QUFDckIsV0FBSyxhQUFhO0FBQ2xCLGdCQUFVLGFBQWEsWUFBWSxNQUFNO0FBQ3pDLGdCQUFVLGNBQWNBLEdBQUUsWUFBWSxLQUFLO0FBRTNDLFVBQUk7QUFDSCxjQUFNLEtBQUssVUFBVTtBQUNyQixhQUFLLE1BQU07QUFBQSxNQUNaLFNBQVMsT0FBTztBQUNmLGdCQUFRLE1BQU0seUNBQVcsS0FBSztBQUM5QixZQUFJLHdCQUFPQSxHQUFFLGNBQWMsQ0FBQztBQUM1QixhQUFLLGFBQWE7QUFDbEIsa0JBQVUsZ0JBQWdCLFVBQVU7QUFDcEMsa0JBQVUsY0FBYyxLQUFLLE9BQU8sU0FBUyxpQkFBaUJBLEdBQUUsZUFBZSxJQUFJQSxHQUFFLFFBQVE7QUFBQSxNQUM5RjtBQUFBLElBQ0QsQ0FBQztBQUFBLEVBQ0Y7QUFBQSxFQUVBLFVBQVU7QUFDVCxVQUFNLEVBQUUsVUFBVSxJQUFJO0FBQ3RCLGNBQVUsTUFBTTtBQUFBLEVBQ2pCO0FBQ0Q7OztBRDNHTyxJQUFNLGdDQUFnQztBQVV0QyxJQUFNLHlCQUFOLGNBQXFDLDBCQUFTO0FBQUEsRUFLcEQsWUFBWSxNQUFxQixRQUE0QjtBQUM1RCxVQUFNLElBQUk7QUFKWCw4QkFBMEMsQ0FBQztBQUMzQyxTQUFRLGFBQXNCO0FBSTdCLFNBQUssU0FBUztBQUFBLEVBQ2Y7QUFBQSxFQUVBLGNBQWM7QUFDYixXQUFPO0FBQUEsRUFDUjtBQUFBLEVBRUEsaUJBQWlCO0FBQ2hCLFdBQU8sS0FBSyxPQUFPLEVBQUUsbUJBQW1CO0FBQUEsRUFDekM7QUFBQSxFQUVBLE1BQU0sU0FBUztBQUVkLFFBQUksVUFBVTtBQUNkLFdBQU8sQ0FBQyxLQUFLLGFBQWEsVUFBVSxJQUFJO0FBQ3ZDLFlBQU0sSUFBSSxRQUFRLGFBQVcsV0FBVyxTQUFTLEVBQUUsQ0FBQztBQUNwRDtBQUFBLElBQ0Q7QUFDQSxRQUFJLENBQUMsS0FBSyxXQUFXO0FBQ3BCLGNBQVEsTUFBTSw2Q0FBNkM7QUFDM0Q7QUFBQSxJQUNEO0FBQ0EsU0FBSyxVQUFVLFNBQVMsMEJBQTBCO0FBRWxELFFBQUksQ0FBQyxLQUFLLFlBQVk7QUFDckIsWUFBTSxLQUFLLHVCQUF1QjtBQUFBLElBQ25DO0FBQUEsRUFDRDtBQUFBLEVBRUEsTUFBTSxVQUFVO0FBQUEsRUFFaEI7QUFBQSxFQUVBLE1BQU0seUJBQXlCO0FBRTlCLFFBQUksQ0FBQyxLQUFLLGFBQWEsS0FBSyxZQUFZO0FBQ3ZDO0FBQUEsSUFDRDtBQUVBLFNBQUssYUFBYTtBQUNsQixTQUFLLFVBQVUsTUFBTTtBQUdyQixVQUFNLFVBQVUsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBQ2pFLFlBQVEsU0FBUyxPQUFPLEVBQUUsS0FBSyxVQUFVLENBQUM7QUFDMUMsWUFBUSxVQUFVLEVBQUUsTUFBTSxLQUFLLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxDQUFDO0FBRWpFLFFBQUk7QUFFSCxZQUFNLFFBQVEsTUFBTSxLQUFLLE9BQU8saUJBQWlCO0FBRWpELFdBQUsscUJBQXFCLE1BQU0sSUFBSSxXQUFTO0FBQUEsUUFDNUM7QUFBQSxRQUNBLE1BQU0sS0FBSztBQUFBLFFBQ1gsTUFBTSxLQUFLO0FBQUEsUUFDWCxNQUFNLEtBQUssS0FBSztBQUFBLFFBQ2hCLFVBQVUsS0FBSyxLQUFLO0FBQUEsTUFDckIsRUFBRTtBQUdGLFdBQUssbUJBQW1CLEtBQUssQ0FBQyxHQUFHLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSTtBQUd0RCxZQUFNLEtBQUssV0FBVztBQUFBLElBQ3ZCLFNBQVMsT0FBTztBQUNmLGNBQVEsTUFBTSwrQ0FBWSxLQUFLO0FBQy9CLFdBQUssVUFBVSxVQUFVO0FBQUEsUUFDeEIsS0FBSztBQUFBLFFBQ0wsTUFBTSxLQUFLLE9BQU8sRUFBRSxXQUFXO0FBQUEsTUFDaEMsQ0FBQztBQUFBLElBQ0YsVUFBRTtBQUNELFdBQUssYUFBYTtBQUFBLElBQ25CO0FBQUEsRUFDRDtBQUFBLEVBRUEsTUFBTSxhQUFhO0FBRWxCLFFBQUksQ0FBQyxLQUFLLFdBQVc7QUFDcEI7QUFBQSxJQUNEO0FBRUEsU0FBSyxVQUFVLE1BQU07QUFHckIsU0FBSyxhQUFhO0FBRWxCLFFBQUksS0FBSyxtQkFBbUIsV0FBVyxHQUFHO0FBQ3pDLFdBQUssVUFBVSxVQUFVO0FBQUEsUUFDeEIsS0FBSztBQUFBLFFBQ0wsTUFBTSxLQUFLLE9BQU8sRUFBRSxvQkFBb0I7QUFBQSxNQUN6QyxDQUFDO0FBQ0Q7QUFBQSxJQUNEO0FBR0EsVUFBTSxRQUFRLEtBQUssVUFBVSxVQUFVLEVBQUUsS0FBSyxZQUFZLENBQUM7QUFDM0QsVUFBTSxXQUFXO0FBQUEsTUFDaEIsTUFBTSxLQUFLLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxRQUFRLFdBQVcsT0FBTyxLQUFLLG1CQUFtQixNQUFNLENBQUM7QUFBQSxNQUNsRyxLQUFLO0FBQUEsSUFDTixDQUFDO0FBRUQsVUFBTSxZQUFZLEtBQUssbUJBQW1CLE9BQU8sQ0FBQyxLQUFLLFFBQVEsTUFBTSxJQUFJLE1BQU0sQ0FBQztBQUNoRixVQUFNLFdBQVc7QUFBQSxNQUNoQixNQUFNLEtBQUssT0FBTyxFQUFFLGdCQUFnQixFQUFFLFFBQVEsVUFBVSxlQUFlLFNBQVMsQ0FBQztBQUFBLE1BQ2pGLEtBQUs7QUFBQSxJQUNOLENBQUM7QUFHRCxVQUFNLE9BQU8sS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLG9CQUFvQixDQUFDO0FBRWxFLGVBQVcsU0FBUyxLQUFLLG9CQUFvQjtBQUM1QyxXQUFLLGdCQUFnQixNQUFNLEtBQUs7QUFBQSxJQUNqQztBQUFBLEVBQ0Q7QUFBQSxFQUVBLGVBQWU7QUFDZCxVQUFNLFNBQVMsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLHNCQUFzQixDQUFDO0FBRXRFLFdBQU8sU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxDQUFDO0FBRWxFLFVBQU0sT0FBTyxPQUFPLFVBQVUsRUFBRSxLQUFLLHFCQUFxQixDQUFDO0FBQzNELFNBQUssV0FBVyxFQUFFLE1BQU0sS0FBSyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQztBQUczRCxVQUFNLGFBQWEsT0FBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLGlCQUFpQixDQUFDO0FBQ3RFLGtDQUFRLFlBQVksWUFBWTtBQUNoQyxlQUFXLGlCQUFpQixTQUFTLE1BQU0sS0FBSyx1QkFBdUIsQ0FBQztBQUd4RSxVQUFNLFVBQVUsT0FBTyxVQUFVLEVBQUUsS0FBSyxpQkFBaUIsQ0FBQztBQUUxRCxVQUFNLGFBQWEsUUFBUSxTQUFTLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBQ3RFLGtDQUFRLFlBQVksTUFBTTtBQUMxQixlQUFXLGlCQUFpQixTQUFTLE1BQU0sS0FBSyxhQUFhLENBQUM7QUFFOUQsVUFBTSxlQUFlLFFBQVEsU0FBUyxVQUFVLEVBQUUsS0FBSyx1QkFBdUIsQ0FBQztBQUMvRSxrQ0FBUSxjQUFjLFNBQVM7QUFDL0IsaUJBQWEsaUJBQWlCLFNBQVMsTUFBTSxLQUFLLGlCQUFpQixDQUFDO0FBQUEsRUFDckU7QUFBQSxFQUVRLHdCQUF3QixXQUF3QixVQUFrQixPQUFlO0FBQ3hGLGNBQVUsTUFBTTtBQUVoQixVQUFNLFdBQVcsVUFBVSxVQUFVO0FBQ3JDLGFBQVMsTUFBTSxRQUFRO0FBQ3ZCLGFBQVMsTUFBTSxTQUFTO0FBQ3hCLGFBQVMsTUFBTSxVQUFVO0FBQ3pCLGFBQVMsTUFBTSxnQkFBZ0I7QUFDL0IsYUFBUyxNQUFNLGFBQWE7QUFDNUIsYUFBUyxNQUFNLGlCQUFpQjtBQUNoQyxhQUFTLE1BQU0sTUFBTTtBQUNyQixhQUFTLE1BQU0sUUFBUTtBQUV2QixVQUFNLFNBQVMsU0FBUyxVQUFVO0FBQ2xDLGtDQUFRLFFBQVEsUUFBUTtBQUV4QixVQUFNLFVBQVUsU0FBUyxVQUFVLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDbEQsWUFBUSxNQUFNLFdBQVc7QUFDekIsWUFBUSxNQUFNLGdCQUFnQjtBQUFBLEVBQy9CO0FBQUEsRUFFUSxxQkFBcUIsV0FBd0IsTUFBYSxhQUFxQjtBQUN0RixVQUFNLFlBQVksYUFBYSxLQUFLLElBQUk7QUFDeEMsVUFBTSxNQUFNLEtBQUssSUFBSSxNQUFNLGdCQUFnQixJQUFJO0FBRS9DLFFBQUksY0FBYyxTQUFTO0FBQzFCLFlBQU0sTUFBTSxVQUFVLFNBQVMsT0FBTztBQUFBLFFBQ3JDLE1BQU07QUFBQSxVQUNMO0FBQUEsVUFDQSxLQUFLO0FBQUEsUUFDTjtBQUFBLE1BQ0QsQ0FBQztBQUVELFVBQUksaUJBQWlCLFNBQVMsTUFBTTtBQUNuQyxrQkFBVSxNQUFNO0FBQ2hCLGtCQUFVLFVBQVU7QUFBQSxVQUNuQixLQUFLO0FBQUEsVUFDTCxNQUFNLEtBQUssT0FBTyxFQUFFLGdCQUFnQjtBQUFBLFFBQ3JDLENBQUM7QUFBQSxNQUNGLENBQUM7QUFDRDtBQUFBLElBQ0Q7QUFFQSxRQUFJLGNBQWMsU0FBUztBQUMxQixZQUFNLFFBQVEsVUFBVSxTQUFTLE9BQU87QUFDeEMsWUFBTSxNQUFNO0FBQ1osWUFBTSxRQUFRO0FBQ2QsWUFBTSxVQUFVO0FBQ2hCLFlBQU0sY0FBYztBQUNwQixZQUFNLE1BQU0sUUFBUTtBQUNwQixZQUFNLE1BQU0sU0FBUztBQUNyQixZQUFNLE1BQU0sWUFBWTtBQUN4QixZQUFNLGlCQUFpQixTQUFTLE1BQU07QUFDckMsYUFBSyx3QkFBd0IsV0FBVyxTQUFTLE9BQU87QUFBQSxNQUN6RCxDQUFDO0FBQ0Q7QUFBQSxJQUNEO0FBRUEsUUFBSSxjQUFjLFNBQVM7QUFDMUIsV0FBSyx3QkFBd0IsV0FBVyxTQUFTLE9BQU87QUFDeEQ7QUFBQSxJQUNEO0FBRUEsUUFBSSxjQUFjLFlBQVk7QUFDN0IsV0FBSyx3QkFBd0IsV0FBVyxhQUFhLHdCQUF3QixLQUFLLElBQUksQ0FBQztBQUN2RjtBQUFBLElBQ0Q7QUFFQSxTQUFLLHdCQUF3QixXQUFXLFFBQVEsTUFBTTtBQUFBLEVBQ3ZEO0FBQUEsRUFFQSxnQkFBZ0IsV0FBd0IsT0FBMEI7QUFDakUsVUFBTSxPQUFPLFVBQVUsVUFBVSxFQUFFLEtBQUssb0JBQW9CLENBQUM7QUFHN0QsVUFBTSxZQUFZLEtBQUssVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDMUQsU0FBSyxxQkFBcUIsV0FBVyxNQUFNLE1BQU0sTUFBTSxJQUFJO0FBRzNELFVBQU0sT0FBTyxLQUFLLFVBQVUsRUFBRSxLQUFLLFlBQVksQ0FBQztBQUNoRCxTQUFLLFVBQVUsRUFBRSxLQUFLLGFBQWEsTUFBTSxNQUFNLEtBQUssQ0FBQztBQUNyRCxTQUFLLFVBQVUsRUFBRSxLQUFLLGFBQWEsTUFBTSxNQUFNLEtBQUssQ0FBQztBQUNyRCxTQUFLLFVBQVUsRUFBRSxLQUFLLGFBQWEsTUFBTSxlQUFlLE1BQU0sSUFBSSxFQUFFLENBQUM7QUFHckUsVUFBTSxVQUFVLEtBQUssVUFBVSxFQUFFLEtBQUssZUFBZSxDQUFDO0FBR3RELFVBQU0sVUFBVSxRQUFRLFNBQVMsVUFBVSxFQUFFLEtBQUssY0FBYyxDQUFDO0FBQ2pFLGtDQUFRLFNBQVMsUUFBUTtBQUN6QixZQUFRLGlCQUFpQixTQUFTLE1BQU07QUFDdkMsV0FBSyxPQUFPLGlCQUFpQixNQUFNLElBQUk7QUFBQSxJQUN4QyxDQUFDO0FBR0QsVUFBTSxVQUFVLFFBQVEsU0FBUyxVQUFVLEVBQUUsS0FBSyxjQUFjLENBQUM7QUFDakUsa0NBQVEsU0FBUyxNQUFNO0FBQ3ZCLFlBQVEsaUJBQWlCLFNBQVMsTUFBTTtBQUN2QyxXQUFLLFVBQVUsVUFBVSxVQUFVLE1BQU0sSUFBSSxFQUFFLEtBQUssTUFBTTtBQUN6RCxZQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLFlBQVksQ0FBQztBQUFBLE1BQ3ZDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVTtBQUNuQixnQkFBUSxNQUFNLHFEQUFhLEtBQUs7QUFDaEMsWUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxPQUFPLENBQUM7QUFBQSxNQUNsQyxDQUFDO0FBQUEsSUFDRixDQUFDO0FBR0QsVUFBTSxZQUFZLFFBQVEsU0FBUyxVQUFVLEVBQUUsS0FBSyxxQkFBcUIsQ0FBQztBQUMxRSxrQ0FBUSxXQUFXLFNBQVM7QUFDNUIsY0FBVSxpQkFBaUIsU0FBUyxNQUFNO0FBQ3pDLFdBQUssY0FBYyxLQUFLO0FBQUEsSUFDekIsQ0FBQztBQUdELFNBQUssaUJBQWlCLGVBQWUsQ0FBQyxNQUFNO0FBQzNDLFFBQUUsZUFBZTtBQUNqQixXQUFLLGdCQUFnQixHQUFpQixNQUFNLElBQUk7QUFBQSxJQUNqRCxDQUFDO0FBQUEsRUFDRjtBQUFBLEVBRUEsZ0JBQWdCLE9BQW1CLE1BQWE7QUFDL0MsVUFBTSxPQUFPLElBQUksc0JBQUs7QUFFdEIsU0FBSyxRQUFRLENBQUMsU0FBbUI7QUFDaEMsV0FBSyxTQUFTLEtBQUssT0FBTyxFQUFFLGFBQWEsQ0FBQyxFQUN4QyxRQUFRLFFBQVEsRUFDaEIsUUFBUSxNQUFNO0FBQ2QsYUFBSyxPQUFPLGlCQUFpQixJQUFJO0FBQUEsTUFDbEMsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVELFNBQUssUUFBUSxDQUFDLFNBQW1CO0FBQ2hDLFdBQUssU0FBUyxLQUFLLE9BQU8sRUFBRSxVQUFVLENBQUMsRUFDckMsUUFBUSxNQUFNLEVBQ2QsUUFBUSxNQUFNO0FBQ2QsYUFBSyxVQUFVLFVBQVUsVUFBVSxLQUFLLElBQUksRUFBRSxLQUFLLE1BQU07QUFDeEQsY0FBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxZQUFZLENBQUM7QUFBQSxRQUN2QyxDQUFDLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDbkIsa0JBQVEsTUFBTSxxREFBYSxLQUFLO0FBQ2hDLGNBQUksd0JBQU8sS0FBSyxPQUFPLEVBQUUsT0FBTyxDQUFDO0FBQUEsUUFDbEMsQ0FBQztBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVELFNBQUssUUFBUSxDQUFDLFNBQW1CO0FBQ2hDLFdBQUssU0FBUyxLQUFLLE9BQU8sRUFBRSxVQUFVLENBQUMsRUFDckMsUUFBUSxNQUFNLEVBQ2QsUUFBUSxNQUFNO0FBQ2QsY0FBTSxPQUFPLEtBQUssT0FBTyxrQkFBa0IsSUFBSTtBQUMvQyxhQUFLLFVBQVUsVUFBVSxVQUFVLElBQUksRUFBRSxLQUFLLE1BQU07QUFDbkQsY0FBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxZQUFZLENBQUM7QUFBQSxRQUN2QyxDQUFDLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDbkIsa0JBQVEsTUFBTSxxREFBYSxLQUFLO0FBQ2hDLGNBQUksd0JBQU8sS0FBSyxPQUFPLEVBQUUsT0FBTyxDQUFDO0FBQUEsUUFDbEMsQ0FBQztBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVELFNBQUssUUFBUSxDQUFDLFNBQW1CO0FBQ2hDLFdBQUssU0FBUyxLQUFLLE9BQU8sRUFBRSxjQUFjLENBQUMsRUFDekMsUUFBUSxlQUFlLEVBQ3ZCLFFBQVEsTUFBTTtBQUNkLGFBQUssS0FBSyxPQUFPLGlCQUFpQixJQUFJO0FBQUEsTUFDdkMsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVELFNBQUssYUFBYTtBQUVsQixTQUFLLFFBQVEsQ0FBQyxTQUFtQjtBQUNoQyxXQUFLLFNBQVMsS0FBSyxPQUFPLEVBQUUsUUFBUSxDQUFDLEVBQ25DLFFBQVEsU0FBUyxFQUNqQixRQUFRLE1BQU07QUFDZCxjQUFNLE1BQU0sS0FBSyxtQkFBbUIsS0FBSyxPQUFLLEVBQUUsS0FBSyxTQUFTLEtBQUssSUFBSSxLQUNuRSxFQUFFLE1BQU0sTUFBTSxLQUFLLE1BQU0sTUFBTSxLQUFLLE1BQU0sTUFBTSxLQUFLLEtBQUssTUFBTSxVQUFVLEtBQUssS0FBSyxNQUFNO0FBQzlGLGFBQUssY0FBYyxHQUFHO0FBQUEsTUFDdkIsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVELFNBQUssZUFBZSxFQUFFLEdBQUcsTUFBTSxTQUFTLEdBQUcsTUFBTSxRQUFRLENBQUM7QUFBQSxFQUMzRDtBQUFBLEVBRUEsTUFBTSxjQUFjLE9BQTBCO0FBQzdDLFFBQUk7QUFBQSxNQUNILEtBQUs7QUFBQSxNQUNMLEtBQUs7QUFBQSxNQUNMLENBQUMsS0FBSztBQUFBLE1BQ04sWUFBWTtBQUNYLGNBQU0sVUFBVSxNQUFNLEtBQUssT0FBTyxlQUFlLE1BQU0sSUFBSTtBQUMzRCxZQUFJLFNBQVM7QUFFWixlQUFLLHFCQUFxQixLQUFLLG1CQUFtQjtBQUFBLFlBQ2pELFNBQU8sSUFBSSxLQUFLLFNBQVMsTUFBTSxLQUFLO0FBQUEsVUFDckM7QUFFQSxnQkFBTSxLQUFLLFdBQVc7QUFBQSxRQUN2QjtBQUFBLE1BQ0Q7QUFBQSxJQUNELEVBQUUsS0FBSztBQUFBLEVBQ1I7QUFBQSxFQUVBLE1BQU0sbUJBQW1CO0FBQ3hCLFFBQUksS0FBSyxtQkFBbUIsV0FBVyxHQUFHO0FBQ3pDLFVBQUksd0JBQU8sS0FBSyxPQUFPLEVBQUUsaUJBQWlCLENBQUM7QUFDM0M7QUFBQSxJQUNEO0FBRUEsUUFBSTtBQUFBLE1BQ0gsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsWUFBWTtBQUVYLGNBQU0sVUFBVSxNQUFNLFFBQVE7QUFBQSxVQUM3QixLQUFLLG1CQUFtQixJQUFJLFdBQVMsS0FBSyxPQUFPLGVBQWUsTUFBTSxJQUFJLENBQUM7QUFBQSxRQUM1RTtBQUdBLGNBQU0sVUFBVSxLQUFLLG1CQUFtQixPQUFPLENBQUMsR0FBRyxNQUFNLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxTQUFPLElBQUksSUFBSTtBQUN4RixjQUFNLFNBQVMsS0FBSyxtQkFBbUIsT0FBTyxDQUFDLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxTQUFPLElBQUksSUFBSTtBQUV4RixZQUFJLFFBQVEsU0FBUyxHQUFHO0FBQ3ZCLGNBQUksd0JBQU8sS0FBSyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxXQUFXLE9BQU8sUUFBUSxNQUFNLENBQUMsQ0FBQztBQUFBLFFBQ3RGO0FBQ0EsWUFBSSxPQUFPLFNBQVMsR0FBRztBQUN0QixjQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLHFCQUFxQixFQUFFLFFBQVEsWUFBWSxPQUFPLE9BQU8sTUFBTSxDQUFDLENBQUM7QUFBQSxRQUMzRjtBQUdBLGNBQU0sS0FBSyx1QkFBdUI7QUFBQSxNQUNuQztBQUFBLElBQ0QsRUFBRSxLQUFLO0FBQUEsRUFDUjtBQUFBLEVBRUEsZUFBZTtBQUNkLFVBQU0sUUFBUSxLQUFLLG1CQUFtQixJQUFJLFNBQU8sSUFBSSxJQUFJLEVBQUUsS0FBSyxJQUFJO0FBQ3BFLFNBQUssVUFBVSxVQUFVLFVBQVUsS0FBSyxFQUFFLEtBQUssTUFBTTtBQUNwRCxVQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLGlCQUFpQixFQUFFLFFBQVEsV0FBVyxPQUFPLEtBQUssbUJBQW1CLE1BQU0sQ0FBQyxDQUFDO0FBQUEsSUFDdkcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxVQUFVO0FBQ25CLGNBQVEsTUFBTSxxREFBYSxLQUFLO0FBQ2hDLFVBQUksd0JBQU8sS0FBSyxPQUFPLEVBQUUsT0FBTyxDQUFDO0FBQUEsSUFDbEMsQ0FBQztBQUFBLEVBQ0Y7QUFBQTtBQUdEOzs7QUV2WkEsSUFBQUMsbUJBQWlIOzs7QUNRMUcsU0FBUyxXQUFXLFVBQTJCO0FBQ3JELE1BQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxLQUFLLEVBQUcsUUFBTztBQUMxQyxNQUFJO0FBQ0gsVUFBTSxVQUFVLG1CQUFtQixRQUFRO0FBQzNDLFVBQU0sYUFBYSxRQUFRLFFBQVEsT0FBTyxHQUFHO0FBQzdDLFFBQUksV0FBVyxXQUFXLEdBQUcsS0FBSyxhQUFhLEtBQUssVUFBVSxFQUFHLFFBQU87QUFDeEUsUUFBSSxXQUFXLFNBQVMsSUFBSSxFQUFHLFFBQU87QUFDdEMsVUFBTSxRQUFRLFdBQVcsTUFBTSxHQUFHO0FBQ2xDLFdBQU8sTUFBTSxNQUFNLFVBQVEsU0FBUyxRQUFRLFNBQVMsR0FBRztBQUFBLEVBQ3pELFFBQVE7QUFDUCxXQUFPO0FBQUEsRUFDUjtBQUNEO0FBTU8sU0FBUyxVQUFVLEtBQXNCO0FBQy9DLE1BQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxLQUFLLEVBQUcsUUFBTztBQUNoQyxRQUFNLFVBQVUsSUFBSSxLQUFLLEVBQUUsWUFBWTtBQUN2QyxNQUFJLFFBQVEsV0FBVyxTQUFTLEtBQUssUUFBUSxXQUFXLFVBQVUsRUFBRyxRQUFPO0FBQzVFLE1BQUksUUFBUSxXQUFXLGFBQWEsS0FBSyxRQUFRLFdBQVcsT0FBTyxLQUFLLFFBQVEsV0FBVyxXQUFXLEVBQUcsUUFBTztBQUNoSCxTQUFPLENBQUMsUUFBUSxTQUFTLEdBQUc7QUFDN0I7QUFLTyxTQUFTLGVBQWUsS0FBcUI7QUFDbkQsTUFBSSxPQUFPLFFBQVEsU0FBVSxRQUFPO0FBQ3BDLFNBQU8sSUFDTCxRQUFRLE1BQU0sT0FBTyxFQUNyQixRQUFRLE1BQU0sUUFBUSxFQUN0QixRQUFRLE1BQU0sT0FBTyxFQUNyQixRQUFRLE1BQU0sTUFBTSxFQUNwQixRQUFRLE1BQU0sTUFBTTtBQUN2Qjs7O0FEdENPLElBQU0sNkJBQTZCO0FBcUJuQyxJQUFNLHNCQUFOLGNBQWtDLDBCQUFTO0FBQUEsRUFLakQsWUFBWSxNQUFxQixRQUE0QjtBQUM1RCxVQUFNLElBQUk7QUFKWCxzQkFBMEIsQ0FBQztBQUMzQixTQUFRLFlBQXFCO0FBSTVCLFNBQUssU0FBUztBQUFBLEVBQ2Y7QUFBQSxFQUVBLGNBQWM7QUFDYixXQUFPO0FBQUEsRUFDUjtBQUFBLEVBRUEsaUJBQWlCO0FBQ2hCLFdBQU8sS0FBSyxPQUFPLEVBQUUsaUJBQWlCO0FBQUEsRUFDdkM7QUFBQSxFQUVBLE1BQU0sU0FBUztBQUNkLFFBQUksVUFBVTtBQUNkLFdBQU8sQ0FBQyxLQUFLLGFBQWEsVUFBVSxJQUFJO0FBQ3ZDLFlBQU0sSUFBSSxRQUFRLGFBQVcsV0FBVyxTQUFTLEVBQUUsQ0FBQztBQUNwRDtBQUFBLElBQ0Q7QUFDQSxRQUFJLENBQUMsS0FBSyxXQUFXO0FBQ3BCLGNBQVEsTUFBTSwwQ0FBMEM7QUFDeEQ7QUFBQSxJQUNEO0FBQ0EsU0FBSyxVQUFVLFNBQVMsdUJBQXVCO0FBQy9DLFVBQU0sS0FBSyxlQUFlO0FBQUEsRUFDM0I7QUFBQSxFQUVBLE1BQU0sVUFBVTtBQUFBLEVBRWhCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGlCQUFpQjtBQUN0QixRQUFJLENBQUMsS0FBSyxVQUFXO0FBQ3JCLFFBQUksS0FBSyxVQUFXO0FBQ3BCLFNBQUssWUFBWTtBQUNqQixTQUFLLFVBQVUsTUFBTTtBQUVyQixVQUFNLFVBQVUsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBQ2pFLFlBQVEsU0FBUyxPQUFPLEVBQUUsS0FBSyxVQUFVLENBQUM7QUFDMUMsWUFBUSxVQUFVLEVBQUUsTUFBTSxLQUFLLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxDQUFDO0FBRTlELFFBQUk7QUFDSCxZQUFNLFlBQVksbUJBQW1CLEtBQUssT0FBTyxTQUFTLFdBQVc7QUFDckUsVUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLFNBQVMsR0FBRztBQUN6QyxhQUFLLGFBQWEsQ0FBQztBQUNuQixjQUFNLEtBQUssV0FBVztBQUN0QjtBQUFBLE1BQ0Q7QUFFQSxZQUFNLGNBQWMsS0FBSyxPQUFPLElBQUksTUFBTSxzQkFBc0IsU0FBUztBQUN6RSxVQUFJLENBQUMsZUFBZSxFQUFFLHVCQUF1QiwyQkFBVTtBQUN0RCxhQUFLLGFBQWEsQ0FBQztBQUNuQixjQUFNLEtBQUssV0FBVztBQUN0QjtBQUFBLE1BQ0Q7QUFFQSxZQUFNLGNBQWMsS0FBSyxpQkFBaUI7QUFFMUMsV0FBSyxhQUFhLENBQUM7QUFDbkIsaUJBQVcsUUFBUSxZQUFZLFVBQVU7QUFDeEMsWUFBSSxnQkFBZ0Isd0JBQU87QUFDMUIsZ0JBQU0sZUFBZSxLQUFLLG9CQUFvQixLQUFLLElBQUk7QUFDdkQsZ0JBQU0sY0FBYyxlQUFlLG9CQUFvQixZQUFZLEtBQUssS0FBSyxPQUFPLEtBQUs7QUFHekYsZ0JBQU0sV0FBVyxlQUNkLEtBQUssZUFBZSxjQUFjLFdBQVcsSUFDN0M7QUFFSCxlQUFLLFdBQVcsS0FBSztBQUFBLFlBQ3BCO0FBQUEsWUFDQSxNQUFNLEtBQUs7QUFBQSxZQUNYLFNBQVMsS0FBSztBQUFBLFlBQ2QsTUFBTTtBQUFBLFlBQ04sTUFBTSxLQUFLLEtBQUs7QUFBQSxZQUNoQixVQUFVLEtBQUssS0FBSztBQUFBLFlBQ3BCO0FBQUEsWUFDQSxnQkFBZ0I7QUFBQSxZQUNoQixVQUFVO0FBQUEsVUFDWCxDQUFDO0FBQUEsUUFDRjtBQUFBLE1BQ0Q7QUFFQSxXQUFLLFdBQVcsS0FBSyxDQUFDLEdBQUcsTUFBTSxFQUFFLFdBQVcsRUFBRSxRQUFRO0FBQ3RELFlBQU0sS0FBSyxXQUFXO0FBQUEsSUFDdkIsU0FBUyxPQUFPO0FBQ2YsY0FBUSxNQUFNLHFEQUFhLEtBQUs7QUFDaEMsV0FBSyxVQUFVLFVBQVU7QUFBQSxRQUN4QixLQUFLO0FBQUEsUUFDTCxNQUFNLEtBQUssT0FBTyxFQUFFLE9BQU87QUFBQSxNQUM1QixDQUFDO0FBQUEsSUFDRixVQUFFO0FBQ0QsV0FBSyxZQUFZO0FBQUEsSUFDbEI7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT1EsbUJBQXdDO0FBQy9DLFVBQU0sV0FBVyxvQkFBSSxJQUFvQjtBQUV6QyxVQUFNLGdCQUFnQixLQUFLLElBQUksTUFBTSxpQkFBaUI7QUFDdEQsZUFBVyxNQUFNLGVBQWU7QUFDL0IsWUFBTSxRQUFRLEtBQUssSUFBSSxjQUFjLGFBQWEsRUFBRTtBQUNwRCxVQUFJLENBQUMsTUFBTztBQUVaLFlBQU0sVUFBVSxDQUFDLEdBQUksTUFBTSxVQUFVLENBQUMsR0FBSSxHQUFJLE1BQU0sU0FBUyxDQUFDLENBQUU7QUFDaEUsaUJBQVcsU0FBUyxTQUFTO0FBQzVCLGNBQU0sV0FBVyxtQkFBbUIsTUFBTSxJQUFJLEVBQUUsWUFBWTtBQUM1RCxjQUFNLFlBQVksb0JBQW9CLFFBQVEsS0FBSyxVQUFVLFlBQVk7QUFHekUsaUJBQVMsSUFBSSxXQUFXLFNBQVMsSUFBSSxRQUFRLEtBQUssS0FBSyxDQUFDO0FBQ3hELFlBQUksYUFBYSxVQUFVO0FBQzFCLG1CQUFTLElBQUksV0FBVyxTQUFTLElBQUksUUFBUSxLQUFLLEtBQUssQ0FBQztBQUFBLFFBQ3pEO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFFQSxXQUFPO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1EsZUFBZSxjQUFzQixhQUEwQztBQUN0RixVQUFNLGlCQUFpQixtQkFBbUIsWUFBWSxFQUFFLFlBQVk7QUFDcEUsVUFBTSxZQUFZLG9CQUFvQixjQUFjLEtBQUssZ0JBQWdCLFlBQVk7QUFDckYsVUFBTSxhQUFhLFlBQVksSUFBSSxjQUFjLEtBQUs7QUFDdEQsVUFBTSxZQUFZLFlBQVksSUFBSSxRQUFRLEtBQUs7QUFHL0MsV0FBTyxLQUFLLElBQUksWUFBWSxTQUFTO0FBQUEsRUFDdEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtRLG9CQUFvQixVQUFzQztBQUNqRSxVQUFNLGlCQUFpQixTQUFTLFFBQVEsSUFBSTtBQUM1QyxRQUFJLG1CQUFtQixHQUFJLFFBQU87QUFFbEMsVUFBTSxjQUFjLFNBQVMsVUFBVSxpQkFBaUIsQ0FBQztBQUN6RCxRQUFJLENBQUMsWUFBYSxRQUFPO0FBRXpCLFVBQU0sVUFBVSxtQkFBbUIsdUJBQXVCLFdBQVcsQ0FBQztBQUN0RSxXQUFPLFdBQVc7QUFBQSxFQUNuQjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1EsZUFBK0I7QUFDdEMsVUFBTSxTQUFpQyxDQUFDO0FBQ3hDLFFBQUksWUFBWTtBQUNoQixRQUFJLG9CQUFvQjtBQUV4QixlQUFXLFFBQVEsS0FBSyxZQUFZO0FBQ25DLG1CQUFhLEtBQUs7QUFDbEIsWUFBTSxPQUFPLGFBQWEsS0FBSyxJQUFJLEtBQUs7QUFDeEMsYUFBTyxJQUFJLEtBQUssT0FBTyxJQUFJLEtBQUssS0FBSztBQUNyQyxVQUFJLEtBQUssbUJBQW1CLEdBQUc7QUFDOUI7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUVBLFdBQU87QUFBQSxNQUNOLFlBQVksS0FBSyxXQUFXO0FBQUEsTUFDNUI7QUFBQSxNQUNBO0FBQUEsTUFDQSxrQkFBa0IsS0FBSyxXQUFXLFNBQVMsSUFDeEMsS0FBSyxNQUFPLG9CQUFvQixLQUFLLFdBQVcsU0FBVSxHQUFHLElBQzdEO0FBQUEsSUFDSjtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sYUFBYTtBQUNsQixRQUFJLENBQUMsS0FBSyxVQUFXO0FBQ3JCLFNBQUssVUFBVSxNQUFNO0FBR3JCLFNBQUssYUFBYTtBQUdsQixRQUFJLEtBQUssV0FBVyxTQUFTLEdBQUc7QUFDL0IsV0FBSyxnQkFBZ0I7QUFBQSxJQUN0QjtBQUVBLFFBQUksS0FBSyxXQUFXLFdBQVcsR0FBRztBQUNqQyxXQUFLLFVBQVUsVUFBVTtBQUFBLFFBQ3hCLEtBQUs7QUFBQSxRQUNMLE1BQU0sS0FBSyxPQUFPLEVBQUUsa0JBQWtCO0FBQUEsTUFDdkMsQ0FBQztBQUNEO0FBQUEsSUFDRDtBQUdBLFNBQUssbUJBQW1CO0FBR3hCLFVBQU0sT0FBTyxLQUFLLFVBQVUsVUFBVSxFQUFFLEtBQUssYUFBYSxDQUFDO0FBQzNELGVBQVcsUUFBUSxLQUFLLFlBQVk7QUFDbkMsV0FBSyxnQkFBZ0IsTUFBTSxJQUFJO0FBQUEsSUFDaEM7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxlQUFlO0FBQ2QsVUFBTSxTQUFTLEtBQUssVUFBVSxVQUFVLEVBQUUsS0FBSyxlQUFlLENBQUM7QUFDL0QsV0FBTyxTQUFTLE1BQU0sRUFBRSxNQUFNLEtBQUssT0FBTyxFQUFFLGlCQUFpQixFQUFFLENBQUM7QUFFaEUsVUFBTSxPQUFPLE9BQU8sVUFBVSxFQUFFLEtBQUsscUJBQXFCLENBQUM7QUFDM0QsU0FBSyxXQUFXLEVBQUUsTUFBTSxLQUFLLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxDQUFDO0FBRTlELFVBQU0sVUFBVSxPQUFPLFVBQVUsRUFBRSxLQUFLLGlCQUFpQixDQUFDO0FBRzFELFVBQU0sYUFBYSxRQUFRLFNBQVMsVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDdkUsa0NBQVEsWUFBWSxZQUFZO0FBQ2hDLGVBQVcsaUJBQWlCLFNBQVMsTUFBTSxLQUFLLGVBQWUsQ0FBQztBQUNoRSxlQUFXLFFBQVEsS0FBSyxPQUFPLEVBQUUsU0FBUztBQUcxQyxVQUFNLFVBQVUsUUFBUSxTQUFTLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBQ25FLGtDQUFRLFNBQVMsY0FBYztBQUMvQixZQUFRLFdBQVcsRUFBRSxNQUFNLElBQUksS0FBSyxPQUFPLEVBQUUsVUFBVSxDQUFDLEdBQUcsQ0FBQztBQUM1RCxZQUFRLFdBQVcsQ0FBQyxLQUFLLE9BQU8sU0FBUztBQUN6QyxZQUFRLGlCQUFpQixTQUFTLE1BQU0sS0FBSyxZQUFZLENBQUM7QUFDMUQsWUFBUSxRQUFRLEtBQUssT0FBTyxFQUFFLGNBQWM7QUFHNUMsVUFBTSxjQUFjLFFBQVEsU0FBUyxVQUFVLEVBQUUsS0FBSyx1QkFBdUIsQ0FBQztBQUM5RSxrQ0FBUSxhQUFhLFNBQVM7QUFDOUIsZ0JBQVksaUJBQWlCLFNBQVMsTUFBTSxLQUFLLGdCQUFnQixDQUFDO0FBQ2xFLGdCQUFZLFFBQVEsS0FBSyxPQUFPLEVBQUUsbUJBQW1CO0FBQUEsRUFDdEQ7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtRLGtCQUFrQjtBQUN6QixVQUFNLFFBQVEsS0FBSyxhQUFhO0FBQ2hDLFVBQU0sWUFBWSxLQUFLLFVBQVUsVUFBVSxFQUFFLEtBQUssa0JBQWtCLENBQUM7QUFHckUsVUFBTSxZQUFZLFVBQVUsVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDL0QsVUFBTSxZQUFZLFVBQVUsVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDL0Qsa0NBQVEsV0FBVyxPQUFPO0FBQzFCLGNBQVUsVUFBVSxFQUFFLEtBQUssbUJBQW1CLE1BQU0sT0FBTyxNQUFNLFVBQVUsRUFBRSxDQUFDO0FBQzlFLGNBQVUsVUFBVSxFQUFFLEtBQUssbUJBQW1CLE1BQU0sS0FBSyxPQUFPLEVBQUUsY0FBYyxFQUFFLFFBQVEsV0FBVyxFQUFFLEVBQUUsQ0FBQztBQUcxRyxVQUFNLFdBQVcsVUFBVSxVQUFVLEVBQUUsS0FBSyxpQkFBaUIsQ0FBQztBQUM5RCxVQUFNLFdBQVcsU0FBUyxVQUFVLEVBQUUsS0FBSyxpQkFBaUIsQ0FBQztBQUM3RCxrQ0FBUSxVQUFVLFlBQVk7QUFDOUIsYUFBUyxVQUFVLEVBQUUsS0FBSyxtQkFBbUIsTUFBTSxlQUFlLE1BQU0sU0FBUyxFQUFFLENBQUM7QUFDcEYsYUFBUyxVQUFVLEVBQUUsS0FBSyxtQkFBbUIsTUFBTSxLQUFLLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxVQUFVLEVBQUUsRUFBRSxDQUFDO0FBR3JHLFVBQU0sV0FBVyxVQUFVLFVBQVUsRUFBRSxLQUFLLGlCQUFpQixDQUFDO0FBQzlELFVBQU0sV0FBVyxTQUFTLFVBQVUsRUFBRSxLQUFLLGlCQUFpQixDQUFDO0FBQzdELGtDQUFRLFVBQVUsV0FBVztBQUM3QixVQUFNLFlBQXNCLENBQUM7QUFDN0IsZUFBVyxDQUFDLE1BQU0sS0FBSyxLQUFLLE9BQU8sUUFBUSxNQUFNLE1BQU0sR0FBRztBQUN6RCxnQkFBVSxLQUFLLEdBQUcsSUFBSSxLQUFLLEtBQUssRUFBRTtBQUFBLElBQ25DO0FBQ0EsYUFBUyxVQUFVLEVBQUUsS0FBSyxtQkFBbUIsTUFBTSxVQUFVLEtBQUssSUFBSSxLQUFLLElBQUksQ0FBQztBQUNoRixhQUFTLFVBQVUsRUFBRSxLQUFLLG1CQUFtQixNQUFNLEtBQUssT0FBTyxFQUFFLGtCQUFrQixFQUFFLENBQUM7QUFHdEYsVUFBTSxZQUFZLFVBQVUsVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDL0QsVUFBTSxZQUFZLFVBQVUsVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDL0Qsa0NBQVEsV0FBVyxRQUFRO0FBQzNCLGNBQVUsVUFBVSxFQUFFLEtBQUssbUJBQW1CLE1BQU0sR0FBRyxNQUFNLGdCQUFnQixJQUFJLENBQUM7QUFDbEYsY0FBVSxVQUFVLEVBQUUsS0FBSyxtQkFBbUIsTUFBTSxLQUFLLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxDQUFDO0FBQUEsRUFDeEY7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtRLHFCQUFxQjtBQUM1QixVQUFNLFVBQVUsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBR2pFLFVBQU0sZUFBZSxRQUFRLFNBQVMsVUFBVSxFQUFFLEtBQUssY0FBYyxDQUFDO0FBQ3RFLGtDQUFRLGNBQWMsY0FBYztBQUNwQyxpQkFBYSxXQUFXLEVBQUUsTUFBTSxJQUFJLEtBQUssT0FBTyxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUM7QUFDbEUsaUJBQWEsaUJBQWlCLFNBQVMsTUFBTTtBQUM1QyxZQUFNLGNBQWMsS0FBSyxXQUFXLE1BQU0sT0FBSyxFQUFFLFFBQVE7QUFDekQsV0FBSyxXQUFXLFFBQVEsT0FBSyxFQUFFLFdBQVcsQ0FBQyxXQUFXO0FBQ3RELFdBQUssV0FBVztBQUFBLElBQ2pCLENBQUM7QUFFRCxVQUFNLGdCQUFnQixLQUFLLFdBQVcsT0FBTyxPQUFLLEVBQUUsUUFBUSxFQUFFO0FBQzlELFlBQVEsV0FBVztBQUFBLE1BQ2xCLEtBQUs7QUFBQSxNQUNMLE1BQU0sS0FBSyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsT0FBTyxjQUFjLENBQUM7QUFBQSxJQUM5RCxDQUFDO0FBR0QsVUFBTSxrQkFBa0IsUUFBUSxTQUFTLFVBQVUsRUFBRSxLQUFLLHNCQUFzQixDQUFDO0FBQ2pGLGtDQUFRLGlCQUFpQixZQUFZO0FBQ3JDLG9CQUFnQixXQUFXLEVBQUUsTUFBTSxJQUFJLEtBQUssT0FBTyxFQUFFLGNBQWMsQ0FBQyxHQUFHLENBQUM7QUFDeEUsb0JBQWdCLGlCQUFpQixTQUFTLE1BQU0sS0FBSyxhQUFhLENBQUM7QUFHbkUsVUFBTSxpQkFBaUIsUUFBUSxTQUFTLFVBQVUsRUFBRSxLQUFLLHFCQUFxQixDQUFDO0FBQy9FLGtDQUFRLGdCQUFnQixTQUFTO0FBQ2pDLG1CQUFlLFdBQVcsRUFBRSxNQUFNLElBQUksS0FBSyxPQUFPLEVBQUUsYUFBYSxDQUFDLEdBQUcsQ0FBQztBQUN0RSxtQkFBZSxpQkFBaUIsU0FBUyxNQUFNLEtBQUssWUFBWSxDQUFDO0FBQUEsRUFDbEU7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGdCQUFnQixXQUF3QixNQUFpQjtBQUN4RCxVQUFNLFNBQVMsVUFBVSxVQUFVLEVBQUUsS0FBSyxjQUFjLEtBQUssV0FBVyxhQUFhLEVBQUUsR0FBRyxDQUFDO0FBRzNGLFVBQU0sV0FBVyxPQUFPLFNBQVMsU0FBUztBQUFBLE1BQ3pDLE1BQU07QUFBQSxNQUNOLEtBQUs7QUFBQSxJQUNOLENBQUM7QUFDRCxhQUFTLFVBQVUsS0FBSztBQUN4QixhQUFTLGlCQUFpQixVQUFVLE1BQU07QUFDekMsV0FBSyxXQUFXLFNBQVM7QUFDekIsYUFBTyxZQUFZLFlBQVksS0FBSyxRQUFRO0FBRTVDLFlBQU0sVUFBVSxLQUFLLFVBQVUsY0FBYyxnQ0FBZ0M7QUFDN0UsVUFBSSxTQUFTO0FBQ1osY0FBTSxRQUFRLEtBQUssV0FBVyxPQUFPLE9BQUssRUFBRSxRQUFRLEVBQUU7QUFDdEQsZ0JBQVEsY0FBYyxLQUFLLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLENBQUM7QUFBQSxNQUMvRDtBQUFBLElBQ0QsQ0FBQztBQUdELFVBQU0sVUFBVSxPQUFPLFVBQVUsRUFBRSxLQUFLLGlCQUFpQixDQUFDO0FBQzFELFNBQUssb0JBQW9CLFNBQVMsSUFBSTtBQUd0QyxVQUFNLE9BQU8sT0FBTyxVQUFVLEVBQUUsS0FBSyxZQUFZLENBQUM7QUFDbEQsU0FBSyxVQUFVLEVBQUUsS0FBSyxhQUFhLE1BQU0sS0FBSyxLQUFLLENBQUM7QUFDcEQsVUFBTSxZQUFZLEtBQUssV0FBVztBQUFBLE1BQ2pDLEtBQUs7QUFBQSxNQUNMLE1BQU0sS0FBSyxhQUFhLEtBQUssSUFBSTtBQUFBLElBQ2xDLENBQUM7QUFDRCxjQUFVLE1BQU0sVUFBVTtBQUMxQixjQUFVLE1BQU0sYUFBYTtBQUM3QixjQUFVLE1BQU0sUUFBUTtBQUN4QixjQUFVLE1BQU0sVUFBVTtBQUMxQixjQUFVLE1BQU0sWUFBWTtBQUM1QixjQUFVLE1BQU0sZUFBZTtBQUMvQixjQUFVLE1BQU0sV0FBVztBQUMzQixjQUFVLE1BQU0sYUFBYTtBQUM3QixjQUFVLE1BQU0sZ0JBQWdCO0FBQ2hDLGNBQVUsTUFBTSxTQUFTO0FBQ3pCLGNBQVUsTUFBTSxRQUFRO0FBQ3hCLGNBQVUsTUFBTSxhQUFhO0FBRTdCLFFBQUksS0FBSyxjQUFjO0FBQ3RCLFdBQUssVUFBVTtBQUFBLFFBQ2QsS0FBSztBQUFBLFFBQ0wsTUFBTSxHQUFHLEtBQUssT0FBTyxFQUFFLGNBQWMsQ0FBQyxLQUFLLEtBQUssWUFBWTtBQUFBLE1BQzdELENBQUM7QUFBQSxJQUNGO0FBRUEsVUFBTSxPQUFPLEtBQUssVUFBVSxFQUFFLEtBQUssWUFBWSxDQUFDO0FBQ2hELFNBQUssV0FBVyxFQUFFLEtBQUssYUFBYSxNQUFNLGVBQWUsS0FBSyxJQUFJLEVBQUUsQ0FBQztBQUNyRSxTQUFLLFdBQVc7QUFBQSxNQUNmLEtBQUs7QUFBQSxNQUNMLE1BQU0sR0FBRyxLQUFLLE9BQU8sRUFBRSxhQUFhLENBQUMsS0FBSyxJQUFJLEtBQUssS0FBSyxRQUFRLEVBQUUsZUFBZSxDQUFDO0FBQUEsSUFDbkYsQ0FBQztBQUdELFVBQU0sV0FBVyxLQUFLLFdBQVc7QUFBQSxNQUNoQyxLQUFLLGFBQWEsS0FBSyxpQkFBaUIsSUFBSSxlQUFlLFVBQVU7QUFBQSxNQUNyRSxNQUFNLEtBQUssT0FBTyxFQUFFLGdCQUFnQixFQUFFLE9BQU8sS0FBSyxlQUFlLENBQUM7QUFBQSxJQUNuRSxDQUFDO0FBR0QsVUFBTSxVQUFVLE9BQU8sVUFBVSxFQUFFLEtBQUssZUFBZSxDQUFDO0FBRXhELFVBQU0sYUFBYSxRQUFRLFNBQVMsVUFBVSxFQUFFLEtBQUssc0JBQXNCLENBQUM7QUFDNUUsa0NBQVEsWUFBWSxZQUFZO0FBQ2hDLGVBQVcsaUJBQWlCLFNBQVMsTUFBTSxLQUFLLFlBQVksSUFBSSxDQUFDO0FBQ2pFLGVBQVcsUUFBUSxLQUFLLE9BQU8sRUFBRSxnQkFBZ0I7QUFFakQsVUFBTSxZQUFZLFFBQVEsU0FBUyxVQUFVLEVBQUUsS0FBSyxxQkFBcUIsQ0FBQztBQUMxRSxrQ0FBUSxXQUFXLFNBQVM7QUFDNUIsY0FBVSxpQkFBaUIsU0FBUyxNQUFNLEtBQUssY0FBYyxJQUFJLENBQUM7QUFDbEUsY0FBVSxRQUFRLEtBQUssT0FBTyxFQUFFLHdCQUF3QjtBQUd4RCxXQUFPLGlCQUFpQixlQUFlLENBQUMsTUFBTTtBQUM3QyxRQUFFLGVBQWU7QUFDakIsV0FBSyxnQkFBZ0IsR0FBaUIsSUFBSTtBQUFBLElBQzNDLENBQUM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUSxvQkFBb0IsV0FBd0IsTUFBaUI7QUFDcEUsVUFBTSxZQUFZLGFBQWEsS0FBSyxJQUFJO0FBRXhDLFFBQUksY0FBYyxTQUFTO0FBQzFCLFlBQU0sTUFBTSxLQUFLLElBQUksTUFBTSxnQkFBZ0IsS0FBSyxJQUFJO0FBQ3BELFlBQU0sTUFBTSxVQUFVLFNBQVMsT0FBTztBQUFBLFFBQ3JDLE1BQU0sRUFBRSxLQUFLLEtBQUssS0FBSyxLQUFLO0FBQUEsTUFDN0IsQ0FBQztBQUNELFVBQUksaUJBQWlCLFNBQVMsTUFBTTtBQUNuQyxrQkFBVSxNQUFNO0FBQ2hCLGNBQU0sT0FBTyxVQUFVLFVBQVUsRUFBRSxLQUFLLGFBQWEsQ0FBQztBQUN0RCxzQ0FBUSxNQUFNLE9BQU87QUFBQSxNQUN0QixDQUFDO0FBQUEsSUFDRixPQUFPO0FBQ04sWUFBTSxXQUFXLGNBQWMsVUFBVSxVQUN4QyxjQUFjLFVBQVUsVUFDeEIsY0FBYyxhQUFhLGNBQWM7QUFDMUMsV0FBSyx3QkFBd0IsV0FBVyxVQUFVLEtBQUssYUFBYSxLQUFLLElBQUksQ0FBQztBQUFBLElBQy9FO0FBQUEsRUFDRDtBQUFBLEVBRVEsd0JBQXdCLFdBQXdCLFVBQWtCLE9BQWU7QUFDeEYsY0FBVSxNQUFNO0FBRWhCLFVBQU0sV0FBVyxVQUFVLFVBQVU7QUFDckMsYUFBUyxNQUFNLFFBQVE7QUFDdkIsYUFBUyxNQUFNLFNBQVM7QUFDeEIsYUFBUyxNQUFNLFVBQVU7QUFDekIsYUFBUyxNQUFNLGdCQUFnQjtBQUMvQixhQUFTLE1BQU0sYUFBYTtBQUM1QixhQUFTLE1BQU0saUJBQWlCO0FBQ2hDLGFBQVMsTUFBTSxNQUFNO0FBQ3JCLGFBQVMsTUFBTSxRQUFRO0FBRXZCLFVBQU0sT0FBTyxTQUFTLFVBQVUsRUFBRSxLQUFLLGFBQWEsQ0FBQztBQUNyRCxrQ0FBUSxNQUFNLFFBQVE7QUFFdEIsVUFBTSxPQUFPLFNBQVMsVUFBVSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQy9DLFNBQUssTUFBTSxXQUFXO0FBQ3RCLFNBQUssTUFBTSxhQUFhO0FBQ3hCLFNBQUssTUFBTSxnQkFBZ0I7QUFDM0IsU0FBSyxNQUFNLGdCQUFnQjtBQUFBLEVBQzVCO0FBQUEsRUFFUSxhQUFhLFVBQTBCO0FBQzlDLFVBQU0sWUFBWSxhQUFhLFFBQVE7QUFDdkMsUUFBSSxjQUFjLFlBQVk7QUFDN0IsYUFBTyx3QkFBd0IsUUFBUTtBQUFBLElBQ3hDO0FBRUEsVUFBTSxNQUFNLFNBQVMsWUFBWSxHQUFHO0FBQ3BDLFFBQUksUUFBUSxNQUFNLE1BQU0sU0FBUyxTQUFTLEdBQUc7QUFDNUMsYUFBTyxTQUFTLE1BQU0sTUFBTSxDQUFDLEVBQUUsWUFBWTtBQUFBLElBQzVDO0FBRUEsUUFBSSxXQUFXO0FBQ2QsYUFBTyxVQUFVLFlBQVk7QUFBQSxJQUM5QjtBQUVBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGNBQWM7QUFDbkIsVUFBTSxXQUFXLEtBQUssT0FBTztBQUM3QixRQUFJLENBQUMsU0FBUyxpQkFBaUI7QUFDOUIsVUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxjQUFjLENBQUM7QUFDeEM7QUFBQSxJQUNEO0FBRUEsVUFBTSxNQUFNLEtBQUssSUFBSTtBQUNyQixVQUFNLFFBQVEsS0FBSyxLQUFLLEtBQUs7QUFDN0IsVUFBTSxhQUFhLE1BQU8sU0FBUyxvQkFBb0I7QUFDdkQsVUFBTSxVQUFVLFNBQVM7QUFFekIsUUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQztBQUUzQyxRQUFJO0FBQ0gsWUFBTSxtQkFBbUIsTUFBTSxLQUFLLE9BQU8sb0JBQW9CO0FBQy9ELFlBQU0sV0FBVyxLQUFLLE9BQU8sVUFBVSxnQkFDcEMsS0FBSyxPQUFPLFVBQVUsU0FBUyxFQUMvQixJQUFJLE9BQUssS0FBSyxJQUFJLE1BQU0sc0JBQXNCLEVBQUUsSUFBSSxDQUFDLEVBQ3JELE9BQU8sQ0FBQyxNQUFrQixhQUFhLHNCQUFLLElBQzVDLE1BQU0sS0FBSyxPQUFPLGlCQUFpQjtBQUV0QyxZQUFNLFlBQVksbUJBQW1CLEtBQUssT0FBTyxTQUFTLFdBQVcsS0FBSztBQUMxRSxZQUFNLGFBQXNCLENBQUM7QUFFN0IsaUJBQVcsUUFBUSxVQUFVO0FBRTVCLFlBQUksYUFBYSxLQUFLLEtBQUssV0FBVyxZQUFZLEdBQUcsRUFBRztBQUV4RCxjQUFNLGlCQUFpQixtQkFBbUIsS0FBSyxJQUFJLEVBQUUsWUFBWTtBQUNqRSxjQUFNLGlCQUFpQixLQUFLLEtBQUssWUFBWTtBQUM3QyxjQUFNLGVBQWUsaUJBQWlCLElBQUksY0FBYyxLQUN2RCxpQkFBaUIsSUFBSSxjQUFjO0FBRXBDLFlBQUksQ0FBQyxnQkFDSixLQUFLLEtBQUssUUFBUSxjQUNsQixLQUFLLEtBQUssUUFBUSxTQUFTO0FBQzNCLHFCQUFXLEtBQUssSUFBSTtBQUFBLFFBQ3JCO0FBQUEsTUFDRDtBQUVBLFVBQUksV0FBVyxXQUFXLEdBQUc7QUFDNUIsWUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQztBQUM3QztBQUFBLE1BQ0Q7QUFHQSxZQUFNLFlBQVksTUFBTSxLQUFLO0FBQUEsUUFDNUIsS0FBSyxPQUFPLEVBQUUsbUJBQW1CO0FBQUEsVUFDaEMsT0FBTyxXQUFXO0FBQUEsVUFDbEIsTUFBTSxTQUFTO0FBQUEsVUFDZixNQUFNLGVBQWUsT0FBTztBQUFBLFFBQzdCLENBQUM7QUFBQSxNQUNGO0FBRUEsVUFBSSxDQUFDLFVBQVc7QUFFaEIsVUFBSSxRQUFRO0FBQ1osaUJBQVcsUUFBUSxZQUFZO0FBQzlCLGNBQU0sU0FBUyxNQUFNLEtBQUssT0FBTyxlQUFlLElBQUk7QUFDcEQsWUFBSSxPQUFRO0FBQUEsTUFDYjtBQUVBLFVBQUksd0JBQU8sS0FBSyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsT0FBTyxNQUFNLENBQUMsQ0FBQztBQUM5RCxZQUFNLEtBQUssZUFBZTtBQUFBLElBQzNCLFNBQVMsT0FBTztBQUNmLGNBQVEsTUFBTSx5Q0FBVyxLQUFLO0FBQzlCLFVBQUksd0JBQU8sS0FBSyxPQUFPLEVBQUUsZ0JBQWdCLENBQUM7QUFBQSxJQUMzQztBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sZUFBZTtBQUNwQixVQUFNLFdBQVcsS0FBSyxXQUFXLE9BQU8sT0FBSyxFQUFFLFFBQVE7QUFDdkQsUUFBSSxTQUFTLFdBQVcsR0FBRztBQUMxQixVQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLGlCQUFpQixDQUFDO0FBQzNDO0FBQUEsSUFDRDtBQUVBLFVBQU0sWUFBWSxNQUFNLEtBQUs7QUFBQSxNQUM1QixLQUFLLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxPQUFPLFNBQVMsT0FBTyxDQUFDO0FBQUEsSUFDaEU7QUFDQSxRQUFJLENBQUMsVUFBVztBQUVoQixRQUFJLFdBQVc7QUFDZixlQUFXLFFBQVEsVUFBVTtBQUM1QixVQUFJO0FBQ0gsWUFBSSxhQUFhLG1CQUFtQixLQUFLLGdCQUFnQixFQUFFO0FBQzNELFlBQUksQ0FBQyxZQUFZO0FBQ2hCLGdCQUFNLGlCQUFpQixLQUFLLFFBQVEsUUFBUSxJQUFJO0FBQ2hELGNBQUksbUJBQW1CLElBQUk7QUFDMUIseUJBQWE7QUFBQSxjQUNaLHVCQUF1QixLQUFLLFFBQVEsVUFBVSxpQkFBaUIsQ0FBQyxDQUFDO0FBQUEsWUFDbEU7QUFBQSxVQUNELE9BQU87QUFDTix5QkFBYSxtQkFBbUIsS0FBSyxPQUFPO0FBQUEsVUFDN0M7QUFBQSxRQUNEO0FBRUEsWUFBSSxZQUFZO0FBQ2YsZ0JBQU0sU0FBUyxNQUFNLEtBQUssT0FBTyxZQUFZLEtBQUssTUFBTSxVQUFVO0FBQ2xFLGNBQUksT0FBUTtBQUFBLFFBQ2I7QUFBQSxNQUNELFNBQVMsT0FBTztBQUNmLGdCQUFRLEtBQUsseUNBQVcsS0FBSyxJQUFJLElBQUksS0FBSztBQUFBLE1BQzNDO0FBQUEsSUFDRDtBQUVBLFFBQUksd0JBQU8sS0FBSyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsT0FBTyxTQUFTLENBQUMsQ0FBQztBQUNyRSxVQUFNLEtBQUssZUFBZTtBQUFBLEVBQzNCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGNBQWM7QUFDbkIsVUFBTSxXQUFXLEtBQUssV0FBVyxPQUFPLE9BQUssRUFBRSxRQUFRO0FBQ3ZELFFBQUksU0FBUyxXQUFXLEdBQUc7QUFDMUIsVUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQztBQUMzQztBQUFBLElBQ0Q7QUFFQSxVQUFNLFlBQVksTUFBTSxLQUFLO0FBQUEsTUFDNUIsS0FBSyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxXQUFXLE9BQU8sU0FBUyxNQUFNLENBQUM7QUFBQSxJQUM5RTtBQUNBLFFBQUksQ0FBQyxVQUFXO0FBRWhCLFVBQU0sVUFBVSxNQUFNLFFBQVE7QUFBQSxNQUM3QixTQUFTO0FBQUEsUUFBSSxVQUNaLEtBQUssT0FBTyxJQUFJLE1BQU0sT0FBTyxLQUFLLElBQUksRUFBRSxLQUFLLE1BQU0sSUFBSSxFQUFFLE1BQU0sTUFBTSxLQUFLO0FBQUEsTUFDM0U7QUFBQSxJQUNEO0FBRUEsVUFBTSxVQUFVLFFBQVEsT0FBTyxPQUFLLENBQUMsRUFBRTtBQUN2QyxRQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLHFCQUFxQixFQUFFLFFBQVEsV0FBVyxPQUFPLE9BQU8sQ0FBQyxDQUFDO0FBQ25GLFVBQU0sS0FBSyxlQUFlO0FBQUEsRUFDM0I7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGdCQUFnQixPQUFtQixXQUFzQjtBQUN4RCxVQUFNLE9BQU8sSUFBSSxzQkFBSztBQUV0QixTQUFLLFFBQVEsQ0FBQyxhQUF1QjtBQUNwQyxlQUFTLFNBQVMsS0FBSyxPQUFPLEVBQUUsU0FBUyxDQUFDLEVBQ3hDLFFBQVEsWUFBWSxFQUNwQixRQUFRLE1BQU0sS0FBSyxZQUFZLFNBQVMsQ0FBQztBQUFBLElBQzVDLENBQUM7QUFFRCxTQUFLLFFBQVEsQ0FBQyxhQUF1QjtBQUNwQyxlQUFTLFNBQVMsS0FBSyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsRUFDaEQsUUFBUSxTQUFTLEVBQ2pCLFFBQVEsTUFBTSxLQUFLLGNBQWMsU0FBUyxDQUFDO0FBQUEsSUFDOUMsQ0FBQztBQUVELFNBQUssYUFBYTtBQUVsQixTQUFLLFFBQVEsQ0FBQyxhQUF1QjtBQUNwQyxlQUFTLFNBQVMsS0FBSyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsRUFDL0MsUUFBUSxNQUFNLEVBQ2QsUUFBUSxNQUFNO0FBQ2QsYUFBSyxVQUFVLFVBQVUsVUFBVSxVQUFVLElBQUksRUFBRSxLQUFLLE1BQU07QUFDN0QsY0FBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQztBQUFBLFFBQzNDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVTtBQUNuQixrQkFBUSxNQUFNLHFEQUFhLEtBQUs7QUFDaEMsY0FBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxPQUFPLENBQUM7QUFBQSxRQUNsQyxDQUFDO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSCxDQUFDO0FBRUQsU0FBSyxRQUFRLENBQUMsYUFBdUI7QUFDcEMsZUFBUyxTQUFTLEtBQUssT0FBTyxFQUFFLG9CQUFvQixDQUFDLEVBQ25ELFFBQVEsTUFBTSxFQUNkLFFBQVEsTUFBTTtBQUNkLFlBQUksVUFBVSxjQUFjO0FBQzNCLGVBQUssVUFBVSxVQUFVLFVBQVUsVUFBVSxZQUFZLEVBQUUsS0FBSyxNQUFNO0FBQ3JFLGdCQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLG9CQUFvQixDQUFDO0FBQUEsVUFDL0MsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxVQUFVO0FBQ25CLG9CQUFRLE1BQU0scURBQWEsS0FBSztBQUNoQyxnQkFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxPQUFPLENBQUM7QUFBQSxVQUNsQyxDQUFDO0FBQUEsUUFDRjtBQUFBLE1BQ0QsQ0FBQztBQUFBLElBQ0gsQ0FBQztBQUVELFNBQUssZUFBZSxFQUFFLEdBQUcsTUFBTSxTQUFTLEdBQUcsTUFBTSxRQUFRLENBQUM7QUFBQSxFQUMzRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxZQUFZLE1BQWlCO0FBQ2xDLFFBQUk7QUFDSCxVQUFJLGFBQWEsbUJBQW1CLEtBQUssZ0JBQWdCLEVBQUU7QUFDM0QsVUFBSSxDQUFDLFlBQVk7QUFDaEIsY0FBTSxpQkFBaUIsS0FBSyxRQUFRLFFBQVEsSUFBSTtBQUNoRCxZQUFJLG1CQUFtQixJQUFJO0FBQzFCLHVCQUFhO0FBQUEsWUFDWix1QkFBdUIsS0FBSyxRQUFRLFVBQVUsaUJBQWlCLENBQUMsQ0FBQztBQUFBLFVBQ2xFO0FBQUEsUUFDRCxPQUFPO0FBQ04sdUJBQWEsbUJBQW1CLEtBQUssT0FBTztBQUFBLFFBQzdDO0FBQUEsTUFDRDtBQUVBLFVBQUksQ0FBQyxZQUFZO0FBQ2hCLFlBQUksd0JBQU8sS0FBSyxPQUFPLEVBQUUsZUFBZSxFQUFFLFFBQVEsYUFBYSxLQUFLLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN0RjtBQUFBLE1BQ0Q7QUFFQSxZQUFNLFdBQVcsTUFBTSxLQUFLLE9BQU8sWUFBWSxLQUFLLE1BQU0sVUFBVTtBQUNwRSxVQUFJLENBQUMsU0FBVTtBQUVmLFdBQUssYUFBYSxLQUFLLFdBQVcsT0FBTyxPQUFLLEVBQUUsS0FBSyxTQUFTLEtBQUssS0FBSyxJQUFJO0FBQzVFLFlBQU0sS0FBSyxXQUFXO0FBQUEsSUFDdkIsU0FBUyxPQUFPO0FBQ2YsY0FBUSxNQUFNLHlDQUFXLEtBQUs7QUFDOUIsVUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxlQUFlLEVBQUUsUUFBUSxhQUFjLE1BQWdCLE9BQU8sQ0FBQztBQUFBLElBQ3pGO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1EsaUJBQWlCLFNBQW1DO0FBQzNELFdBQU8sSUFBSSxRQUFRLENBQUMsWUFBWTtBQUMvQixZQUFNLFFBQVEsSUFBSSx1QkFBTSxLQUFLLE9BQU8sR0FBRztBQUN2QyxVQUFJLFdBQVc7QUFFZixZQUFNLFVBQVUsTUFBTTtBQUNyQixZQUFJLENBQUMsVUFBVTtBQUNkLHFCQUFXO0FBQ1gsa0JBQVEsS0FBSztBQUFBLFFBQ2Q7QUFBQSxNQUNEO0FBRUEsWUFBTSxVQUFVLFVBQVUsRUFBRSxLQUFLLHdCQUF3QixHQUFHLENBQUMsT0FBTztBQUNuRSxXQUFHLFVBQVUsRUFBRSxNQUFNLFNBQVMsS0FBSyx3QkFBd0IsQ0FBQztBQUM1RCxXQUFHLFVBQVUsRUFBRSxLQUFLLHdCQUF3QixHQUFHLENBQUMsY0FBYztBQUM3RCxnQkFBTSxZQUFZLElBQUksaUNBQWdCLFNBQVM7QUFDL0Msb0JBQVUsY0FBYyxLQUFLLE9BQU8sRUFBRSxRQUFRLENBQUM7QUFDL0Msb0JBQVUsUUFBUSxNQUFNO0FBQ3ZCLHVCQUFXO0FBQ1gsa0JBQU0sTUFBTTtBQUNaLG9CQUFRLEtBQUs7QUFBQSxVQUNkLENBQUM7QUFFRCxnQkFBTSxhQUFhLElBQUksaUNBQWdCLFNBQVM7QUFDaEQscUJBQVcsY0FBYyxLQUFLLE9BQU8sRUFBRSxTQUFTLENBQUM7QUFDakQscUJBQVcsT0FBTztBQUNsQixxQkFBVyxRQUFRLE1BQU07QUFDeEIsdUJBQVc7QUFDWCxrQkFBTSxNQUFNO0FBQ1osb0JBQVEsSUFBSTtBQUFBLFVBQ2IsQ0FBQztBQUFBLFFBQ0YsQ0FBQztBQUFBLE1BQ0YsQ0FBQztBQUVELFlBQU0sS0FBSztBQUFBLElBQ1osQ0FBQztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sY0FBYyxNQUFpQjtBQUNwQyxVQUFNLFlBQVksTUFBTSxLQUFLO0FBQUEsTUFDNUIsS0FBSyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxVQUFVLEtBQUssSUFBSTtBQUFBLElBQy9EO0FBRUEsUUFBSSxXQUFXO0FBQ2QsVUFBSTtBQUNILGNBQU0sS0FBSyxPQUFPLElBQUksTUFBTSxPQUFPLEtBQUssSUFBSTtBQUM1QyxZQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLGFBQWEsRUFBRSxRQUFRLFVBQVUsS0FBSyxJQUFJLENBQUM7QUFDcEUsYUFBSyxhQUFhLEtBQUssV0FBVyxPQUFPLE9BQUssRUFBRSxLQUFLLFNBQVMsS0FBSyxLQUFLLElBQUk7QUFDNUUsY0FBTSxLQUFLLFdBQVc7QUFBQSxNQUN2QixTQUFTLE9BQU87QUFDZixnQkFBUSxNQUFNLHlDQUFXLEtBQUs7QUFDOUIsWUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxjQUFjLENBQUM7QUFBQSxNQUN6QztBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGtCQUFrQjtBQUN2QixRQUFJLEtBQUssV0FBVyxXQUFXLEdBQUc7QUFDakMsVUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxZQUFZLENBQUM7QUFDdEM7QUFBQSxJQUNEO0FBRUEsVUFBTSxZQUFZLE1BQU0sS0FBSztBQUFBLE1BQzVCLEtBQUssT0FBTyxFQUFFLG1CQUFtQixFQUFFLFFBQVEsV0FBVyxPQUFPLEtBQUssV0FBVyxNQUFNLENBQUM7QUFBQSxJQUNyRjtBQUVBLFFBQUksV0FBVztBQUNkLFlBQU0sVUFBVSxNQUFNLFFBQVE7QUFBQSxRQUM3QixLQUFLLFdBQVc7QUFBQSxVQUFJLFVBQ25CLEtBQUssT0FBTyxJQUFJLE1BQU0sT0FBTyxLQUFLLElBQUksRUFBRSxLQUFLLE1BQU0sSUFBSSxFQUFFLE1BQU0sTUFBTSxLQUFLO0FBQUEsUUFDM0U7QUFBQSxNQUNEO0FBRUEsWUFBTSxVQUFVLFFBQVEsT0FBTyxPQUFLLENBQUMsRUFBRTtBQUN2QyxZQUFNLFNBQVMsUUFBUSxPQUFPLE9BQUssQ0FBQyxDQUFDLEVBQUU7QUFFdkMsVUFBSSxVQUFVLEdBQUc7QUFDaEIsWUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxRQUFRLFdBQVcsT0FBTyxPQUFPLENBQUMsQ0FBQztBQUFBLE1BQ3BGO0FBQ0EsVUFBSSxTQUFTLEdBQUc7QUFDZixZQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLHFCQUFxQixFQUFFLFFBQVEsV0FBVyxPQUFPLE1BQU0sQ0FBQyxJQUFJLE9BQU8sS0FBSyxPQUFPLEVBQUUsT0FBTyxJQUFJLEdBQUc7QUFBQSxNQUN6SDtBQUVBLFlBQU0sS0FBSyxlQUFlO0FBQUEsSUFDM0I7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUSxZQUFZLEtBQXFCO0FBQ3hDLFVBQU0sWUFBWSxhQUFhLFlBQVksR0FBRyxFQUFFO0FBQ2hELFlBQVEsV0FBVztBQUFBLE1BQ2xCLEtBQUs7QUFBUyxlQUFPO0FBQUEsTUFDckIsS0FBSztBQUFTLGVBQU87QUFBQSxNQUNyQixLQUFLO0FBQVMsZUFBTztBQUFBLE1BQ3JCLEtBQUs7QUFBWSxlQUFPO0FBQUEsTUFDeEI7QUFBUyxlQUFPO0FBQUEsSUFDakI7QUFBQSxFQUNEO0FBQ0Q7OztBRXYwQkEsSUFBQUMsbUJBQWdFOzs7QUNDaEUsSUFBTSw2QkFBNkI7QUFDbkMsSUFBTSxzQkFBc0I7QUFDNUIsSUFBTSwwQkFBMEI7QUFvQmhDLFNBQVMsaUJBQWlCLFdBQXlFO0FBQ2xHLFFBQU0sRUFBRSxNQUFNLE9BQU8sT0FBTyxJQUFJO0FBQ2hDLE1BQUksT0FBTztBQUNYLE1BQUksTUFBTTtBQUNWLE1BQUksUUFBUTtBQUNaLE1BQUksU0FBUztBQUNiLE1BQUksa0JBQWtCO0FBRXRCLFdBQVMsSUFBSSxHQUFHLElBQUksUUFBUSxLQUFLO0FBQ2hDLGFBQVMsSUFBSSxHQUFHLElBQUksT0FBTyxLQUFLO0FBQy9CLFlBQU0sUUFBUSxNQUFNLElBQUksUUFBUSxLQUFLLElBQUksQ0FBQztBQUMxQyxVQUFJLFFBQVEsS0FBSztBQUNoQiwwQkFBa0I7QUFBQSxNQUNuQjtBQUNBLFVBQUksU0FBUyx3QkFBeUI7QUFFdEMsVUFBSSxJQUFJLEtBQU0sUUFBTztBQUNyQixVQUFJLElBQUksSUFBSyxPQUFNO0FBQ25CLFVBQUksSUFBSSxNQUFPLFNBQVE7QUFDdkIsVUFBSSxJQUFJLE9BQVEsVUFBUztBQUFBLElBQzFCO0FBQUEsRUFDRDtBQUVBLE1BQUksUUFBUSxRQUFRLFNBQVMsS0FBSztBQUNqQyxXQUFPO0FBQUEsTUFDTixRQUFRLEVBQUUsTUFBTSxHQUFHLEtBQUssR0FBRyxPQUFPLE9BQU87QUFBQSxNQUN6QztBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBRUEsU0FBTztBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLFFBQVEsT0FBTztBQUFBLE1BQ3RCLFFBQVEsU0FBUyxNQUFNO0FBQUEsSUFDeEI7QUFBQSxJQUNBO0FBQUEsRUFDRDtBQUNEO0FBS0EsU0FBUyxvQkFBb0IsS0FBcUM7QUFDakUsUUFBTSxlQUFlLFNBQVMsY0FBYyxRQUFRO0FBQ3BELGVBQWEsUUFBUSxJQUFJLGdCQUFnQixJQUFJO0FBQzdDLGVBQWEsU0FBUyxJQUFJLGlCQUFpQixJQUFJO0FBQy9DLFFBQU0sWUFBWSxhQUFhLFdBQVcsSUFBSTtBQUM5QyxZQUFVLFVBQVUsS0FBSyxHQUFHLENBQUM7QUFFN0IsUUFBTSxrQkFBa0IsVUFBVSxhQUFhLEdBQUcsR0FBRyxhQUFhLE9BQU8sYUFBYSxNQUFNO0FBQzVGLFFBQU0sRUFBRSxRQUFRLGdCQUFnQixJQUFJLGlCQUFpQixlQUFlO0FBRXBFLFNBQU87QUFBQSxJQUNOLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYO0FBQUEsSUFDQTtBQUFBLEVBQ0Q7QUFDRDtBQU1BLFNBQVMsaUJBQWlCLFFBQXNCLE9BQWUsUUFBMEI7QUFDeEYsUUFBTSxTQUFTLFNBQVMsY0FBYyxRQUFRO0FBQzlDLFNBQU8sUUFBUTtBQUNmLFNBQU8sU0FBUztBQUNoQixRQUFNLE1BQU0sT0FBTyxXQUFXLElBQUk7QUFDbEMsTUFBSSxZQUFZLE9BQU8sbUJBQW1CLEtBQUssbUJBQW1CLEtBQUssbUJBQW1CO0FBQzFGLE1BQUksU0FBUyxHQUFHLEdBQUcsT0FBTyxNQUFNO0FBQ2hDLE1BQUk7QUFBQSxJQUNILE9BQU87QUFBQSxJQUNQLE9BQU8sT0FBTztBQUFBLElBQ2QsT0FBTyxPQUFPO0FBQUEsSUFDZCxPQUFPLE9BQU87QUFBQSxJQUNkLE9BQU8sT0FBTztBQUFBLElBQ2Q7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNEO0FBRUEsUUFBTSxZQUFZLElBQUksYUFBYSxHQUFHLEdBQUcsT0FBTyxNQUFNO0FBQ3RELFFBQU0sT0FBTyxVQUFVO0FBQ3ZCLFFBQU0sT0FBaUIsQ0FBQztBQUV4QixXQUFTLElBQUksR0FBRyxJQUFJLEtBQUssUUFBUSxLQUFLLEdBQUc7QUFDeEMsU0FBSyxLQUFLLFFBQVEsS0FBSyxDQUFDLElBQUksUUFBUSxLQUFLLElBQUksQ0FBQyxJQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsQ0FBQztBQUFBLEVBQ3RFO0FBRUEsU0FBTztBQUNSO0FBS0EsU0FBUyxNQUFNLFFBQWtCLE1BQWMsWUFBOEI7QUFDNUUsUUFBTSxTQUFtQixJQUFJLE1BQU0sYUFBYSxVQUFVO0FBRTFELFdBQVMsSUFBSSxHQUFHLElBQUksWUFBWSxLQUFLO0FBQ3BDLGFBQVMsSUFBSSxHQUFHLElBQUksWUFBWSxLQUFLO0FBQ3BDLFVBQUksTUFBTTtBQUNWLGVBQVMsSUFBSSxHQUFHLElBQUksTUFBTSxLQUFLO0FBQzlCLGlCQUFTLElBQUksR0FBRyxJQUFJLE1BQU0sS0FBSztBQUM5QixpQkFBTyxPQUFPLElBQUksT0FBTyxDQUFDLElBQ3pCLEtBQUssSUFBSSxLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssS0FBSyxJQUFJLEtBQUssSUFDL0MsS0FBSyxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxLQUFLLElBQUksS0FBSztBQUFBLFFBQ2pEO0FBQUEsTUFDRDtBQUNBLGFBQU8sSUFBSSxhQUFhLENBQUMsSUFBSTtBQUFBLElBQzlCO0FBQUEsRUFDRDtBQUVBLFNBQU87QUFDUjtBQUtBLFNBQVMsYUFBYSxRQUE4QjtBQUNuRCxRQUFNLE9BQU87QUFDYixRQUFNLFdBQVc7QUFFakIsUUFBTSxPQUFPLGlCQUFpQixRQUFRLE1BQU0sSUFBSTtBQUNoRCxRQUFNLFlBQVksTUFBTSxNQUFNLE1BQU0sUUFBUTtBQUc1QyxRQUFNLFNBQVMsVUFBVSxNQUFNLENBQUM7QUFDaEMsUUFBTSxTQUFTLENBQUMsR0FBRyxNQUFNLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUM7QUFDL0MsUUFBTSxTQUFTLE9BQU8sS0FBSyxNQUFNLE9BQU8sU0FBUyxDQUFDLENBQUM7QUFHbkQsTUFBSSxPQUFPO0FBQ1gsV0FBUyxJQUFJLEdBQUcsSUFBSSxXQUFXLFVBQVUsS0FBSztBQUM3QyxZQUFRLFVBQVUsQ0FBQyxJQUFJLFNBQVMsTUFBTTtBQUFBLEVBQ3ZDO0FBRUEsU0FBTyxZQUFZLElBQUk7QUFDeEI7QUFLQSxTQUFTLGFBQWEsUUFBOEI7QUFDbkQsUUFBTSxPQUFPLGlCQUFpQixRQUFRLEdBQUcsQ0FBQztBQUMxQyxNQUFJLE9BQU87QUFFWCxXQUFTLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSztBQUMzQixhQUFTLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSztBQUMzQixjQUFRLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxNQUFNO0FBQUEsSUFDdkQ7QUFBQSxFQUNEO0FBRUEsU0FBTyxZQUFZLElBQUk7QUFDeEI7QUFLQSxTQUFTLFlBQVksUUFBd0I7QUFDNUMsTUFBSSxNQUFNO0FBQ1YsV0FBUyxJQUFJLEdBQUcsSUFBSSxPQUFPLFFBQVEsS0FBSyxHQUFHO0FBQzFDLFdBQU8sU0FBUyxPQUFPLFVBQVUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUyxFQUFFO0FBQUEsRUFDM0Q7QUFDQSxTQUFPO0FBQ1I7QUFNQSxTQUFTLHFCQUFxQixRQUE4QjtBQUMzRCxRQUFNLE9BQU87QUFDYixRQUFNLFNBQVMsU0FBUyxjQUFjLFFBQVE7QUFDOUMsU0FBTyxRQUFRO0FBQ2YsU0FBTyxTQUFTO0FBQ2hCLFFBQU0sTUFBTSxPQUFPLFdBQVcsSUFBSTtBQUNsQyxNQUFJLFVBQVUsR0FBRyxHQUFHLE1BQU0sSUFBSTtBQUM5QixNQUFJO0FBQUEsSUFDSCxPQUFPO0FBQUEsSUFDUCxPQUFPLE9BQU87QUFBQSxJQUNkLE9BQU8sT0FBTztBQUFBLElBQ2QsT0FBTyxPQUFPO0FBQUEsSUFDZCxPQUFPLE9BQU87QUFBQSxJQUNkO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRDtBQUNBLFFBQU0sT0FBTyxJQUFJLGFBQWEsR0FBRyxHQUFHLE1BQU0sSUFBSSxFQUFFO0FBQ2hELE1BQUksU0FBUztBQUNiLFdBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxRQUFRLEtBQUssR0FBRztBQUN4QyxjQUFVLEtBQUssSUFBSSxDQUFDLElBQUksMEJBQTBCLE1BQU07QUFBQSxFQUN6RDtBQUNBLFNBQU8sWUFBWSxNQUFNO0FBQzFCO0FBTUEsU0FBUywwQkFBMEIsUUFBOEI7QUFDaEUsUUFBTSxFQUFFLEtBQUssSUFBSSxPQUFPO0FBQ3hCLE1BQUksZ0JBQWdCO0FBQ3BCLE1BQUksU0FBUztBQUNiLE1BQUksU0FBUztBQUNiLE1BQUksU0FBUztBQUViLFdBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxRQUFRLEtBQUssR0FBRztBQUN4QyxVQUFNLFFBQVEsS0FBSyxJQUFJLENBQUM7QUFDeEIsUUFBSSxTQUFTLHdCQUF5QjtBQUV0QyxjQUFVLEtBQUssQ0FBQztBQUNoQixjQUFVLEtBQUssSUFBSSxDQUFDO0FBQ3BCLGNBQVUsS0FBSyxJQUFJLENBQUM7QUFDcEI7QUFBQSxFQUNEO0FBRUEsTUFBSSxrQkFBa0IsR0FBRztBQUN4QixXQUFPO0FBQUEsRUFDUjtBQUVBLFFBQU0sV0FBVyxDQUFDLFVBQTBCO0FBQzNDLFVBQU0sU0FBUyxLQUFLLElBQUksR0FBRyxLQUFLLElBQUksSUFBSSxLQUFLLE1BQU0sUUFBUSxFQUFFLENBQUMsQ0FBQztBQUMvRCxXQUFPLE9BQU8sU0FBUyxFQUFFO0FBQUEsRUFDMUI7QUFFQSxTQUFPO0FBQUEsSUFDTixTQUFTLFNBQVMsYUFBYTtBQUFBLElBQy9CLFNBQVMsU0FBUyxhQUFhO0FBQUEsSUFDL0IsU0FBUyxTQUFTLGFBQWE7QUFBQSxFQUNoQyxFQUFFLEtBQUssRUFBRTtBQUNWO0FBV0EsZUFBc0Isc0JBQXNCLFVBQXNDO0FBQ2pGLFFBQU0sTUFBTSxNQUFNQyxXQUFVLFFBQVE7QUFDcEMsUUFBTSxTQUFTLG9CQUFvQixHQUFHO0FBRXRDLE1BQUksT0FBTyxpQkFBaUI7QUFDM0IsV0FBTztBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sUUFBUTtBQUFBLFFBQ1AscUJBQXFCLE1BQU07QUFBQSxRQUMzQiwwQkFBMEIsTUFBTTtBQUFBLE1BQ2pDO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFFQSxTQUFPO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsTUFDUCxhQUFhLE1BQU07QUFBQSxNQUNuQixhQUFhLE1BQU07QUFBQSxJQUNwQjtBQUFBLEVBQ0Q7QUFDRDtBQWtCQSxTQUFTQyxXQUFVLEtBQWEsWUFBb0IsNEJBQXVEO0FBQzFHLFNBQU8sSUFBSSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQ3ZDLFVBQU0sTUFBTSxJQUFJLE1BQU07QUFDdEIsUUFBSSxVQUFVO0FBQ2QsVUFBTSxRQUFRLFdBQVcsTUFBTTtBQUM5QixVQUFJLFFBQVM7QUFDYixnQkFBVTtBQUVWLFVBQUksTUFBTTtBQUNWLGFBQU8sSUFBSSxNQUFNLG1DQUFtQyxHQUFHLEVBQUUsQ0FBQztBQUFBLElBQzNELEdBQUcsU0FBUztBQUlaLFFBQUksZ0JBQWdCLEtBQUssR0FBRyxHQUFHO0FBQzlCLFVBQUksY0FBYztBQUFBLElBQ25CO0FBQ0EsUUFBSSxTQUFTLE1BQU07QUFDbEIsVUFBSSxRQUFTO0FBQ2IsZ0JBQVU7QUFDVixtQkFBYSxLQUFLO0FBQ2xCLGNBQVEsR0FBRztBQUFBLElBQ1o7QUFDQSxRQUFJLFVBQVUsTUFBTTtBQUNuQixVQUFJLFFBQVM7QUFDYixnQkFBVTtBQUNWLG1CQUFhLEtBQUs7QUFDbEIsYUFBTyxJQUFJLE1BQU0seUJBQXlCLEdBQUcsRUFBRSxDQUFDO0FBQUEsSUFDakQ7QUFDQSxRQUFJLE1BQU07QUFBQSxFQUNYLENBQUM7QUFDRjtBQUtPLFNBQVMsZ0JBQWdCLElBQVksSUFBb0I7QUFDL0QsTUFBSSxHQUFHLFdBQVcsR0FBRyxRQUFRO0FBQzVCLFVBQU0sSUFBSSxNQUFNLHlCQUF5QixHQUFHLE1BQU0sT0FBTyxHQUFHLE1BQU0sRUFBRTtBQUFBLEVBQ3JFO0FBRUEsTUFBSSxXQUFXO0FBQ2YsV0FBUyxJQUFJLEdBQUcsSUFBSSxHQUFHLFFBQVEsS0FBSztBQUNuQyxVQUFNLEtBQUssU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFO0FBQzdCLFVBQU0sS0FBSyxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUU7QUFDN0IsUUFBSSxNQUFNLEtBQUs7QUFDZixXQUFPLEtBQUs7QUFDWCxrQkFBWSxNQUFNO0FBQ2xCLGNBQVE7QUFBQSxJQUNUO0FBQUEsRUFDRDtBQUVBLFNBQU87QUFDUjtBQUtBLFNBQVMsc0JBQXNCLElBQVksSUFBb0I7QUFDOUQsUUFBTSxZQUFZLEdBQUcsU0FBUztBQUM5QixRQUFNLFdBQVcsZ0JBQWdCLElBQUksRUFBRTtBQUN2QyxTQUFPLEtBQUssT0FBTyxJQUFJLFdBQVcsYUFBYSxHQUFHO0FBQ25EO0FBTU8sU0FBUyxlQUFlLElBQWUsSUFBdUI7QUFDcEUsTUFBSSxHQUFHLFNBQVMsR0FBRyxNQUFNO0FBQ3hCLFdBQU87QUFBQSxFQUNSO0FBRUEsTUFBSSxHQUFHLFNBQVMsZUFBZTtBQUM5QixVQUFNLGtCQUFrQixzQkFBc0IsR0FBRyxPQUFPLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxDQUFDO0FBQ3hFLFVBQU0sa0JBQWtCLHNCQUFzQixHQUFHLE9BQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUM7QUFDeEUsV0FBTyxLQUFLLE1BQU0sa0JBQWtCLE1BQU0sa0JBQWtCLEdBQUc7QUFBQSxFQUNoRTtBQUVBLFFBQU0sa0JBQWtCLHNCQUFzQixHQUFHLE9BQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUM7QUFDeEUsUUFBTSxrQkFBa0Isc0JBQXNCLEdBQUcsT0FBTyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsQ0FBQztBQUN4RSxTQUFPLEtBQUssT0FBTyxrQkFBa0IsbUJBQW1CLENBQUM7QUFDMUQ7QUFhTyxTQUFTLG9CQUNmLFNBQ0EsWUFBb0IsSUFDRDtBQUNuQixRQUFNLFVBQVUsTUFBTSxLQUFLLFFBQVEsUUFBUSxDQUFDO0FBQzVDLFFBQU0sVUFBVSxvQkFBSSxJQUFZO0FBQ2hDLFFBQU0sU0FBMkIsQ0FBQztBQUVsQyxXQUFTLElBQUksR0FBRyxJQUFJLFFBQVEsUUFBUSxLQUFLO0FBQ3hDLFVBQU0sQ0FBQyxPQUFPLEtBQUssSUFBSSxRQUFRLENBQUM7QUFDaEMsUUFBSSxRQUFRLElBQUksS0FBSyxFQUFHO0FBRXhCLFVBQU0sUUFBd0I7QUFBQSxNQUM3QixNQUFNO0FBQUEsTUFDTixPQUFPLENBQUMsRUFBRSxNQUFNLE9BQU8sTUFBTSxPQUFPLFlBQVksSUFBSSxDQUFDO0FBQUEsSUFDdEQ7QUFFQSxhQUFTLElBQUksSUFBSSxHQUFHLElBQUksUUFBUSxRQUFRLEtBQUs7QUFDNUMsWUFBTSxDQUFDLE9BQU8sS0FBSyxJQUFJLFFBQVEsQ0FBQztBQUNoQyxVQUFJLFFBQVEsSUFBSSxLQUFLLEVBQUc7QUFFeEIsWUFBTSxhQUFhLGVBQWUsT0FBTyxLQUFLO0FBQzlDLFVBQUksY0FBYyxXQUFXO0FBQzVCLGNBQU0sTUFBTSxLQUFLLEVBQUUsTUFBTSxPQUFPLE1BQU0sT0FBTyxXQUFXLENBQUM7QUFDekQsZ0JBQVEsSUFBSSxLQUFLO0FBQUEsTUFDbEI7QUFBQSxJQUNEO0FBRUEsUUFBSSxNQUFNLE1BQU0sU0FBUyxHQUFHO0FBQzNCLGNBQVEsSUFBSSxLQUFLO0FBQ2pCLGFBQU8sS0FBSyxLQUFLO0FBQUEsSUFDbEI7QUFBQSxFQUNEO0FBRUEsU0FBTztBQUNSOzs7QUN0YkEsSUFBQUMsbUJBQTBDO0FBRzFDLElBQU0sb0JBQW9CO0FBQzFCLElBQU0sd0JBQXdCO0FBVTlCLGVBQXNCLG1CQUNyQixLQUNBLFNBQ0EsU0FDa0I7QUFDbEIsUUFBTSxvQkFBb0IsbUJBQW1CLE9BQU8sRUFBRSxZQUFZO0FBQ2xFLFFBQU0sb0JBQW9CLG1CQUFtQixPQUFPO0FBQ3BELE1BQUksQ0FBQyxxQkFBcUIsQ0FBQyxxQkFBcUIsc0JBQXNCLGtCQUFrQixZQUFZLEdBQUc7QUFDdEcsV0FBTztBQUFBLEVBQ1I7QUFFQSxRQUFNLFVBQVUsSUFBSSxNQUFNLHNCQUFzQixpQkFBaUI7QUFDakUsTUFBSSxFQUFFLG1CQUFtQix5QkFBUTtBQUNoQyxXQUFPO0FBQUEsRUFDUjtBQUNBLFFBQU0sNEJBQTRCLHFCQUFxQixLQUFLLFFBQVEsTUFBTSxpQkFBaUI7QUFFM0YsUUFBTSxnQkFBZ0IsSUFBSSxNQUFNLGlCQUFpQjtBQUNqRCxNQUFJLGVBQWU7QUFFbkIsYUFBVyxRQUFRLGVBQWU7QUFDakMsVUFBTSxVQUFVLE1BQU0sSUFBSSxNQUFNLEtBQUssSUFBSTtBQUN6QyxVQUFNLGFBQWE7QUFBQSxNQUNsQjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUVBLFFBQUksZUFBZSxTQUFTO0FBQzNCLFlBQU0sSUFBSSxNQUFNLE9BQU8sTUFBTSxVQUFVO0FBQ3ZDO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFFQSxTQUFPO0FBQ1I7QUFLTyxTQUFTLHFCQUNmLEtBQ0EsWUFDQSxTQUNBLFNBQ0EsU0FDQSw0QkFBcUMsT0FDNUI7QUFDVCxRQUFNLG9CQUFvQixtQkFBbUIsUUFBUSxJQUFJO0FBRXpELFlBQVUsUUFBUSxRQUFRLG1CQUFtQixDQUFDLFdBQVcsUUFBUSxVQUFVLFFBQVEsSUFBSSxXQUFXO0FBQ2pHLFVBQU0sYUFBUyxnQ0FBYyxRQUFRO0FBQ3JDLFVBQU0sZUFBZSx1QkFBdUIsS0FBSyxPQUFPLE1BQU0sV0FBVyxJQUFJO0FBQzdFLFFBQUksQ0FBQyxrQkFBa0IsT0FBTyxNQUFNLGNBQWMsU0FBUyxXQUFXLElBQUksR0FBRztBQUM1RSxhQUFPO0FBQUEsSUFDUjtBQUVBLFVBQU0sc0JBQXNCO0FBQUEsTUFDM0IsT0FBTztBQUFBLE1BQ1AsV0FBVztBQUFBLE1BQ1g7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Q7QUFDQSxXQUFPLEdBQUcsTUFBTSxHQUFHLG1CQUFtQixHQUFHLE9BQU8sV0FBVyxFQUFFLEdBQUcsS0FBSyxHQUFHLE1BQU07QUFBQSxFQUMvRSxDQUFDO0FBRUQsWUFBVSxRQUFRLFFBQVEsdUJBQXVCLENBQUMsV0FBVyxRQUFRLGFBQWEsV0FBVztBQUM1RixVQUFNLFNBQVMseUJBQXlCLFdBQVc7QUFDbkQsVUFBTSxlQUFlLHVCQUF1QixLQUFLLE9BQU8sTUFBTSxXQUFXLElBQUk7QUFDN0UsUUFBSSxDQUFDLGtCQUFrQixPQUFPLE1BQU0sY0FBYyxTQUFTLFdBQVcsSUFBSSxHQUFHO0FBQzVFLGFBQU87QUFBQSxJQUNSO0FBRUEsVUFBTSxrQkFBa0I7QUFBQSxNQUN2QjtBQUFBLFFBQ0MsT0FBTztBQUFBLFFBQ1AsV0FBVztBQUFBLFFBQ1g7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Q7QUFBQSxNQUNBLE9BQU87QUFBQSxNQUNQLE9BQU87QUFBQSxJQUNSO0FBQ0EsV0FBTyxHQUFHLE1BQU0sR0FBRyxlQUFlLEdBQUcsTUFBTTtBQUFBLEVBQzVDLENBQUM7QUFFRCxTQUFPO0FBQ1I7QUFFQSxTQUFTLHVCQUF1QixLQUFVLGFBQXFCLFlBQTRCO0FBQzFGLE1BQUksWUFBWSxZQUFZLEtBQUs7QUFDakMsTUFBSSxDQUFDLFdBQVc7QUFDZixXQUFPO0FBQUEsRUFDUjtBQUVBLGNBQVksVUFBVSxRQUFRLFFBQVEsR0FBRztBQUN6QyxjQUFZLHVCQUF1QixTQUFTO0FBRTVDLE1BQUksdUJBQXVCLEtBQUssU0FBUyxHQUFHO0FBQzNDLFdBQU87QUFBQSxFQUNSO0FBRUEsUUFBTSxzQkFBc0IsbUJBQW1CLFNBQVM7QUFDeEQsUUFBTSxXQUFXLElBQUksY0FBYyxxQkFBcUIsdUJBQXVCLFdBQVcsVUFBVTtBQUNwRyxRQUFNLGVBQWUsV0FBVyxTQUFTLE9BQU87QUFDaEQsU0FBTyxtQkFBbUIsWUFBWSxFQUFFLFlBQVk7QUFDckQ7QUFFQSxTQUFTLHlCQUF5QixhQUloQztBQUNELE1BQUksYUFBYSxZQUFZLEtBQUs7QUFDbEMsUUFBTSxZQUFZLFdBQVcsV0FBVyxHQUFHLEtBQUssV0FBVyxTQUFTLEdBQUc7QUFFdkUsTUFBSSxXQUFXO0FBQ2QsaUJBQWEsV0FBVyxNQUFNLEdBQUcsRUFBRSxFQUFFLEtBQUs7QUFBQSxFQUMzQztBQUVBLGVBQWEsV0FBVyxRQUFRLFFBQVEsR0FBRztBQUMzQyxRQUFNLFFBQVEsV0FBVyxNQUFNLFNBQVM7QUFDeEMsUUFBTSxPQUFPLFFBQVEsTUFBTSxDQUFDLElBQUk7QUFDaEMsUUFBTSxTQUFTLFdBQVcsTUFBTSxLQUFLLE1BQU07QUFFM0MsU0FBTztBQUFBLElBQ047QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Q7QUFDRDtBQUVBLFNBQVMsMEJBQTBCLFVBQWtCLFFBQWdCLFdBQTRCO0FBQ2hHLFFBQU0sV0FBVyxHQUFHLFFBQVEsR0FBRyxNQUFNO0FBQ3JDLE1BQUksV0FBVztBQUNkLFdBQU8sSUFBSSxRQUFRO0FBQUEsRUFDcEI7QUFDQSxTQUFPLFNBQVMsUUFBUSxNQUFNLEtBQUs7QUFDcEM7QUFFQSxTQUFTLGtCQUFrQixTQUFpQixjQUFzQixTQUFpQixZQUE2QjtBQUMvRyxNQUFJLGlCQUFpQixTQUFTO0FBQzdCLFdBQU87QUFBQSxFQUNSO0FBQ0EsTUFBSSxjQUFjO0FBQ2pCLFdBQU87QUFBQSxFQUNSO0FBSUEsU0FBTyx5QkFBeUIsU0FBUyxVQUFVLE1BQU07QUFDMUQ7QUFFQSxTQUFTLHVCQUNSLFNBQ0EsWUFDQSxTQUNBLDJCQUNBLFVBQ1M7QUFDVCxRQUFNLFFBQVEsb0JBQW9CLE9BQU87QUFDekMsVUFBUSxPQUFPO0FBQUEsSUFDZCxLQUFLO0FBQ0osVUFBSSxhQUFhLFlBQVk7QUFDNUIsZUFBTyxvQkFBb0IsWUFBWSxPQUFPLEtBQUssb0JBQW9CLE9BQU8sS0FBSztBQUFBLE1BQ3BGO0FBQ0EsVUFBSSwyQkFBMkI7QUFDOUIsZUFBTztBQUFBLE1BQ1I7QUFDQSxhQUFPLG9CQUFvQixPQUFPLEtBQUs7QUFBQSxJQUN4QyxLQUFLO0FBQ0osYUFBTyxvQkFBb0IsWUFBWSxPQUFPLEtBQUssb0JBQW9CLE9BQU8sS0FBSztBQUFBLElBQ3BGLEtBQUs7QUFDSixhQUFPLElBQUksT0FBTztBQUFBLElBQ25CLEtBQUs7QUFBQSxJQUNMO0FBQ0MsYUFBTztBQUFBLEVBQ1Q7QUFDRDtBQUVBLFNBQVMseUJBQXlCLFNBQWlCLFlBQTRCO0FBQzlFLE1BQUksWUFBWSxPQUFPLFdBQVcsRUFBRSxFQUFFLEtBQUs7QUFDM0MsTUFBSSxDQUFDLFdBQVc7QUFDZixXQUFPO0FBQUEsRUFDUjtBQUVBLGNBQVksVUFBVSxRQUFRLFFBQVEsR0FBRztBQUN6QyxjQUFZLHVCQUF1QixTQUFTO0FBRTVDLE1BQUksdUJBQXVCLEtBQUssU0FBUyxHQUFHO0FBQzNDLFdBQU87QUFBQSxFQUNSO0FBRUEsTUFBSSxVQUFVLFdBQVcsR0FBRyxHQUFHO0FBQzlCLFdBQU8sbUJBQW1CLFNBQVMsRUFBRSxZQUFZO0FBQUEsRUFDbEQ7QUFFQSxNQUFJLFVBQVUsV0FBVyxJQUFJLEtBQUssVUFBVSxXQUFXLEtBQUssR0FBRztBQUM5RCxVQUFNLFlBQVksbUJBQW1CLGNBQWMsVUFBVSxDQUFDO0FBQzlELFdBQU8sb0JBQW9CLFdBQVcsU0FBUyxFQUFFLFlBQVk7QUFBQSxFQUM5RDtBQUVBLFFBQU0sYUFBYSxtQkFBbUIsU0FBUyxFQUFFLFlBQVk7QUFDN0QsTUFBSSxXQUFXLFNBQVMsR0FBRyxHQUFHO0FBQzdCLFdBQU87QUFBQSxFQUNSO0FBR0EsU0FBTztBQUNSO0FBRUEsU0FBUyxvQkFBb0IsV0FBbUIsY0FBOEI7QUFDN0UsUUFBTSxZQUFZLFlBQVksVUFBVSxNQUFNLEdBQUcsRUFBRSxPQUFPLE9BQU8sSUFBSSxDQUFDO0FBQ3RFLFFBQU0sV0FBVyxPQUFPLGdCQUFnQixFQUFFLEVBQUUsUUFBUSxPQUFPLEdBQUcsRUFBRSxNQUFNLEdBQUc7QUFFekUsYUFBVyxRQUFRLFVBQVU7QUFDNUIsUUFBSSxDQUFDLFFBQVEsU0FBUyxLQUFLO0FBQzFCO0FBQUEsSUFDRDtBQUNBLFFBQUksU0FBUyxNQUFNO0FBQ2xCLFVBQUksVUFBVSxXQUFXLEdBQUc7QUFDM0IsZUFBTztBQUFBLE1BQ1I7QUFDQSxnQkFBVSxJQUFJO0FBQ2Q7QUFBQSxJQUNEO0FBQ0EsY0FBVSxLQUFLLElBQUk7QUFBQSxFQUNwQjtBQUVBLFNBQU8sbUJBQW1CLFVBQVUsS0FBSyxHQUFHLENBQUM7QUFDOUM7QUFFQSxTQUFTLHFCQUFxQixLQUFVLFVBQWtCLGVBQWdDO0FBQ3pGLFFBQU0saUJBQWlCLG1CQUFtQixhQUFhLEVBQUUsWUFBWTtBQUNyRSxRQUFNLFlBQVksU0FBUyxZQUFZO0FBQ3ZDLFNBQU8sSUFBSSxNQUFNLFNBQVMsRUFBRTtBQUFBLElBQUssVUFDaEMsS0FBSyxLQUFLLFlBQVksTUFBTSxhQUM1QixtQkFBbUIsS0FBSyxJQUFJLEVBQUUsWUFBWSxNQUFNO0FBQUEsRUFDakQ7QUFDRDtBQUVBLFNBQVMsb0JBQW9CLFNBQWdDO0FBQzVELFFBQU0sVUFBVSxPQUFPLFdBQVcsRUFBRSxFQUFFLEtBQUs7QUFDM0MsTUFBSSxDQUFDLFFBQVMsUUFBTztBQUNyQixNQUFJLFFBQVEsV0FBVyxHQUFHLEVBQUcsUUFBTztBQUNwQyxNQUFJLFFBQVEsV0FBVyxJQUFJLEtBQUssUUFBUSxXQUFXLEtBQUssRUFBRyxRQUFPO0FBRWxFLFFBQU0sYUFBYSxtQkFBbUIsT0FBTztBQUM3QyxNQUFJLFdBQVcsU0FBUyxHQUFHLEdBQUc7QUFDN0IsV0FBTztBQUFBLEVBQ1I7QUFDQSxTQUFPO0FBQ1I7QUFFQSxTQUFTLG9CQUFvQixZQUFvQixZQUE0QjtBQUM1RSxRQUFNLFVBQVUsbUJBQW1CLGNBQWMsVUFBVSxDQUFDO0FBQzVELFFBQU0sS0FBSyxtQkFBbUIsVUFBVTtBQUN4QyxNQUFJLENBQUMsR0FBSSxRQUFPO0FBRWhCLFFBQU0sWUFBWSxVQUFVLFFBQVEsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNsRCxRQUFNLFVBQVUsR0FBRyxNQUFNLEdBQUc7QUFFNUIsTUFBSSxTQUFTO0FBQ2IsU0FDQyxTQUFTLFVBQVUsVUFDbkIsU0FBUyxRQUFRLFVBQ2pCLFVBQVUsTUFBTSxNQUFNLFFBQVEsTUFBTSxHQUNuQztBQUNEO0FBQUEsRUFDRDtBQUVBLFFBQU0sVUFBVSxVQUFVLFNBQVM7QUFDbkMsUUFBTSxRQUFrQixDQUFDO0FBQ3pCLFdBQVMsSUFBSSxHQUFHLElBQUksU0FBUyxLQUFLO0FBQ2pDLFVBQU0sS0FBSyxJQUFJO0FBQUEsRUFDaEI7QUFDQSxRQUFNLEtBQUssR0FBRyxRQUFRLE1BQU0sTUFBTSxDQUFDO0FBRW5DLFNBQU8sTUFBTSxLQUFLLEdBQUc7QUFDdEI7OztBRm5TTyxJQUFNLGdDQUFnQztBQUV0QyxJQUFNLHlCQUFOLGNBQXFDLDBCQUFTO0FBQUEsRUFPcEQsWUFBWSxNQUFxQixRQUE0QjtBQUM1RCxVQUFNLElBQUk7QUFOWCxTQUFRLGtCQUFvQyxDQUFDO0FBQzdDLFNBQVEsYUFBc0I7QUFDOUIsU0FBUSxlQUFtRCxFQUFFLFNBQVMsR0FBRyxPQUFPLEVBQUU7QUFDbEYsU0FBUSxpQkFBeUI7QUFJaEMsU0FBSyxTQUFTO0FBQUEsRUFDZjtBQUFBLEVBRUEsY0FBYztBQUNiLFdBQU87QUFBQSxFQUNSO0FBQUEsRUFFQSxpQkFBaUI7QUFDaEIsV0FBTyxLQUFLLE9BQU8sRUFBRSxvQkFBb0I7QUFBQSxFQUMxQztBQUFBLEVBRUEsTUFBTSxTQUFTO0FBQ2QsUUFBSSxVQUFVO0FBQ2QsV0FBTyxDQUFDLEtBQUssYUFBYSxVQUFVLElBQUk7QUFDdkMsWUFBTSxJQUFJLFFBQVEsYUFBVyxXQUFXLFNBQVMsRUFBRSxDQUFDO0FBQ3BEO0FBQUEsSUFDRDtBQUNBLFFBQUksQ0FBQyxLQUFLLFdBQVc7QUFDcEIsY0FBUSxNQUFNLDZDQUE2QztBQUMzRDtBQUFBLElBQ0Q7QUFFQSxTQUFLLGFBQWE7QUFFbEIsU0FBSyxhQUFhO0FBQ2xCLFNBQUssZUFBZSxFQUFFLFNBQVMsR0FBRyxPQUFPLEVBQUU7QUFDM0MsU0FBSyxVQUFVLFNBQVMsMEJBQTBCO0FBQ2xELFVBQU0sS0FBSyxXQUFXO0FBQUEsRUFDdkI7QUFBQSxFQUVBLE1BQU0sVUFBVTtBQUNmLFNBQUssYUFBYTtBQUFBLEVBQ25CO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLGFBQWE7QUFDbEIsUUFBSSxDQUFDLEtBQUssVUFBVztBQUNyQixTQUFLLGFBQWE7QUFDbEIsU0FBSyxVQUFVLE1BQU07QUFFckIsU0FBSyxhQUFhO0FBRWxCLFFBQUksS0FBSyxZQUFZO0FBQ3BCLFdBQUssZUFBZTtBQUNwQjtBQUFBLElBQ0Q7QUFFQSxRQUFJLEtBQUssZ0JBQWdCLFdBQVcsR0FBRztBQUN0QyxZQUFNLGFBQWEsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLHdCQUF3QixDQUFDO0FBQzVFLGlCQUFXLFVBQVU7QUFBQSxRQUNwQixLQUFLO0FBQUEsUUFDTCxNQUFNLEtBQUssT0FBTyxFQUFFLG1CQUFtQjtBQUFBLE1BQ3hDLENBQUM7QUFDRDtBQUFBLElBQ0Q7QUFHQSxVQUFNLGtCQUFrQixLQUFLLGdCQUFnQjtBQUFBLE1BQzVDLENBQUMsS0FBSyxNQUFNLE1BQU0sRUFBRSxNQUFNLFNBQVM7QUFBQSxNQUFHO0FBQUEsSUFDdkM7QUFDQSxVQUFNLFdBQVcsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLHNCQUFzQixDQUFDO0FBQ3hFLGFBQVMsV0FBVztBQUFBLE1BQ25CLE1BQU0sS0FBSyxPQUFPLEVBQUUsd0JBQXdCO0FBQUEsUUFDM0MsUUFBUSxLQUFLLGdCQUFnQjtBQUFBLFFBQzdCLE9BQU87QUFBQSxNQUNSLENBQUM7QUFBQSxNQUNELEtBQUs7QUFBQSxJQUNOLENBQUM7QUFHRCxVQUFNLGNBQWMsU0FBUyxTQUFTLFVBQVUsRUFBRSxLQUFLLDBCQUEwQixDQUFDO0FBQ2xGLGtDQUFRLGFBQWEsT0FBTztBQUM1QixnQkFBWSxXQUFXLEVBQUUsTUFBTSxJQUFJLEtBQUssT0FBTyxFQUFFLHlCQUF5QixDQUFDLEdBQUcsQ0FBQztBQUMvRSxnQkFBWSxpQkFBaUIsU0FBUyxNQUFNLEtBQUssd0JBQXdCLENBQUM7QUFHMUUsVUFBTSxrQkFBa0IsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBQzVFLGFBQVMsSUFBSSxHQUFHLElBQUksS0FBSyxnQkFBZ0IsUUFBUSxLQUFLO0FBQ3JELFdBQUsscUJBQXFCLGlCQUFpQixLQUFLLGdCQUFnQixDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQUEsSUFDMUU7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUSxlQUFlO0FBQ3RCLFVBQU0sU0FBUyxLQUFLLFVBQVUsVUFBVSxFQUFFLEtBQUssbUJBQW1CLENBQUM7QUFDbkUsV0FBTyxTQUFTLE1BQU0sRUFBRSxNQUFNLEtBQUssT0FBTyxFQUFFLG9CQUFvQixFQUFFLENBQUM7QUFFbkUsVUFBTSxPQUFPLE9BQU8sVUFBVSxFQUFFLEtBQUssK0JBQStCLENBQUM7QUFDckUsU0FBSyxXQUFXLEVBQUUsTUFBTSxLQUFLLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxDQUFDO0FBRWpFLFVBQU0sVUFBVSxPQUFPLFVBQVUsRUFBRSxLQUFLLDJCQUEyQixDQUFDO0FBQ3BFLFNBQUssc0JBQXNCLE9BQU87QUFHbEMsWUFBUSxXQUFXO0FBQUEsTUFDbEIsS0FBSztBQUFBLE1BQ0wsTUFBTSxLQUFLLE9BQU8sRUFBRSx1QkFBdUI7QUFBQSxRQUMxQyxPQUFPLEtBQUssT0FBTyxTQUFTO0FBQUEsTUFDN0IsQ0FBQztBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0Y7QUFBQSxFQUVRLHNCQUFzQixXQUF3QixZQUFxQjtBQUMxRSxVQUFNLE1BQU0sQ0FBQywyQkFBMkIsaUNBQWlDO0FBQ3pFLFFBQUksV0FBWSxLQUFJLEtBQUssVUFBVTtBQUVuQyxVQUFNLFVBQVUsVUFBVSxTQUFTLFVBQVUsRUFBRSxLQUFLLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNuRSxrQ0FBUSxTQUFTLFFBQVE7QUFDekIsWUFBUSxXQUFXLEVBQUUsTUFBTSxJQUFJLEtBQUssT0FBTyxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUM7QUFDN0QsWUFBUSxXQUFXLEtBQUs7QUFDeEIsWUFBUSxpQkFBaUIsU0FBUyxNQUFNO0FBQ3ZDLFdBQUssS0FBSyxVQUFVO0FBQUEsSUFDckIsQ0FBQztBQUNELFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUSxpQkFBaUI7QUFDeEIsVUFBTSxvQkFBb0IsS0FBSyxVQUFVLFVBQVUsRUFBRSxLQUFLLDBCQUEwQixDQUFDO0FBRXJGLFVBQU0sY0FBYyxrQkFBa0IsVUFBVSxFQUFFLEtBQUsseUJBQXlCLENBQUM7QUFDakYsVUFBTSxlQUFlLFlBQVksVUFBVSxFQUFFLEtBQUssMEJBQTBCLENBQUM7QUFDN0UsVUFBTSxVQUFVLEtBQUssYUFBYSxRQUFRLElBQ3ZDLEtBQUssTUFBTyxLQUFLLGFBQWEsVUFBVSxLQUFLLGFBQWEsUUFBUyxHQUFHLElBQ3RFO0FBQ0gsaUJBQWEsTUFBTSxRQUFRLEdBQUcsT0FBTztBQUVyQyxzQkFBa0IsVUFBVTtBQUFBLE1BQzNCLEtBQUs7QUFBQSxNQUNMLE1BQU0sS0FBSyxPQUFPLEVBQUUsZ0JBQWdCO0FBQUEsUUFDbkMsU0FBUyxLQUFLLGFBQWE7QUFBQSxRQUMzQixPQUFPLEtBQUssYUFBYTtBQUFBLE1BQzFCLENBQUM7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNGO0FBQUEsRUFFUSxzQkFBc0IsT0FBZSxPQUF1QjtBQUNuRSxVQUFNLFFBQVEsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLEtBQUs7QUFDeEQsVUFBTSxRQUFRLEtBQUssSUFBSSxNQUFNLHNCQUFzQixLQUFLO0FBRXhELFFBQUksaUJBQWlCLDBCQUFTLGlCQUFpQix3QkFBTztBQUNyRCxhQUFRLE1BQU0sS0FBSyxRQUFRLE1BQU0sS0FBSyxTQUNqQyxNQUFNLEtBQUssT0FBTyxNQUFNLEtBQUssUUFDOUIsTUFBTSxjQUFjLEtBQUs7QUFBQSxJQUM5QjtBQUNBLFFBQUksaUJBQWlCLHVCQUFPLFFBQU87QUFDbkMsUUFBSSxpQkFBaUIsdUJBQU8sUUFBTztBQUNuQyxXQUFPLE1BQU0sY0FBYyxLQUFLO0FBQUEsRUFDakM7QUFBQSxFQUVRLHdCQUF3QixPQUF1QztBQUN0RSxXQUFPO0FBQUEsTUFDTixHQUFHO0FBQUEsTUFDSCxPQUFPLENBQUMsR0FBRyxNQUFNLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLEtBQUssc0JBQXNCLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQztBQUFBLElBQ2xGO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxZQUFZO0FBQ2pCLFFBQUksS0FBSyxZQUFZO0FBRXBCLFlBQU0sTUFBTSxLQUFLLElBQUk7QUFDckIsVUFBSSxLQUFLLGtCQUFrQixNQUFNLEtBQUssaUJBQWlCLE1BQU87QUFDN0QsYUFBSyxhQUFhO0FBQUEsTUFDbkIsT0FBTztBQUNOO0FBQUEsTUFDRDtBQUFBLElBQ0Q7QUFDQSxTQUFLLGFBQWE7QUFDbEIsU0FBSyxrQkFBa0IsQ0FBQztBQUN4QixTQUFLLGlCQUFpQixLQUFLLElBQUk7QUFFL0IsUUFBSTtBQUVILFlBQU0sYUFBc0IsQ0FBQztBQUM3QixVQUFJLEtBQUssT0FBTyxVQUFVLGVBQWU7QUFDeEMsbUJBQVcsU0FBUyxLQUFLLE9BQU8sVUFBVSxTQUFTLEdBQUc7QUFDckQsY0FBSSxhQUFhLE1BQU0sSUFBSSxNQUFNLFNBQVM7QUFDekMsa0JBQU0sT0FBTyxLQUFLLElBQUksTUFBTSxzQkFBc0IsTUFBTSxJQUFJO0FBQzVELGdCQUFJLGdCQUFnQix3QkFBTztBQUMxQix5QkFBVyxLQUFLLElBQUk7QUFBQSxZQUNyQjtBQUFBLFVBQ0Q7QUFBQSxRQUNEO0FBQUEsTUFDRCxPQUFPO0FBQ04sY0FBTSxXQUFXLE1BQU0sS0FBSyxPQUFPLGlCQUFpQjtBQUNwRCxtQkFBVyxLQUFLLEdBQUcsU0FBUyxPQUFPLE9BQUssYUFBYSxFQUFFLElBQUksTUFBTSxPQUFPLENBQUM7QUFBQSxNQUMxRTtBQUVBLFdBQUssZUFBZSxFQUFFLFNBQVMsR0FBRyxPQUFPLFdBQVcsT0FBTztBQUMzRCxXQUFLLGlCQUFpQixLQUFLLElBQUk7QUFDL0IsWUFBTSxLQUFLLFdBQVc7QUFHdEIsWUFBTSxVQUFVLG9CQUFJLElBQXVCO0FBQzNDLFlBQU0sYUFBYTtBQUVuQixlQUFTLElBQUksR0FBRyxJQUFJLFdBQVcsUUFBUSxLQUFLLFlBQVk7QUFDdkQsY0FBTSxRQUFRLFdBQVcsTUFBTSxHQUFHLElBQUksVUFBVTtBQUVoRCxjQUFNLFFBQVEsSUFBSSxNQUFNLElBQUksT0FBTyxTQUFTO0FBQzNDLGNBQUk7QUFDSCxrQkFBTSxNQUFNLEtBQUssSUFBSSxNQUFNLGdCQUFnQixJQUFJO0FBQy9DLGtCQUFNLE9BQU8sTUFBTSxzQkFBc0IsR0FBRztBQUM1QyxvQkFBUSxJQUFJLEtBQUssTUFBTSxJQUFJO0FBQUEsVUFDNUIsU0FBUyxPQUFPO0FBQ2Ysb0JBQVEsS0FBSywrQkFBK0IsS0FBSyxJQUFJLEtBQUssS0FBSztBQUFBLFVBQ2hFO0FBQUEsUUFDRCxDQUFDLENBQUM7QUFFRixhQUFLLGFBQWEsVUFBVSxLQUFLLElBQUksSUFBSSxZQUFZLFdBQVcsTUFBTTtBQUN0RSxhQUFLLGlCQUFpQixLQUFLLElBQUk7QUFHL0IsY0FBTSxlQUFlLEtBQUssVUFBVSxjQUFjLDBCQUEwQjtBQUM1RSxjQUFNLGVBQWUsS0FBSyxVQUFVLGNBQWMsMEJBQTBCO0FBQzVFLFlBQUksZ0JBQWdCLGNBQWM7QUFDakMsZ0JBQU0sVUFBVSxLQUFLLE1BQU8sS0FBSyxhQUFhLFVBQVUsS0FBSyxhQUFhLFFBQVMsR0FBRztBQUN0Rix1QkFBYSxNQUFNLFFBQVEsR0FBRyxPQUFPO0FBQ3JDLHVCQUFhLGNBQWMsS0FBSyxPQUFPLEVBQUUsZ0JBQWdCO0FBQUEsWUFDeEQsU0FBUyxLQUFLLGFBQWE7QUFBQSxZQUMzQixPQUFPLEtBQUssYUFBYTtBQUFBLFVBQzFCLENBQUM7QUFBQSxRQUNGO0FBR0EsY0FBTSxJQUFJLFFBQVEsYUFBVyxXQUFXLFNBQVMsRUFBRSxDQUFDO0FBQUEsTUFDckQ7QUFHQSxZQUFNLFlBQVksS0FBSyxPQUFPLFNBQVM7QUFDdkMsV0FBSyxrQkFBa0Isb0JBQW9CLFNBQVMsU0FBUyxFQUMzRCxJQUFJLFdBQVMsS0FBSyx3QkFBd0IsS0FBSyxDQUFDO0FBQ2xELFdBQUssZ0JBQWdCLEtBQUssQ0FBQyxHQUFHLE1BQU07QUFDbkMsY0FBTSxRQUFRLEVBQUUsTUFBTSxDQUFDLEdBQUcsUUFBUTtBQUNsQyxjQUFNLFFBQVEsRUFBRSxNQUFNLENBQUMsR0FBRyxRQUFRO0FBQ2xDLGVBQU8sTUFBTSxjQUFjLEtBQUs7QUFBQSxNQUNqQyxDQUFDO0FBRUQsVUFBSSxLQUFLLGdCQUFnQixXQUFXLEdBQUc7QUFDdEMsWUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxtQkFBbUIsQ0FBQztBQUFBLE1BQzlDLE9BQU87QUFDTixjQUFNLGtCQUFrQixLQUFLLGdCQUFnQjtBQUFBLFVBQzVDLENBQUMsS0FBSyxNQUFNLE1BQU0sRUFBRSxNQUFNLFNBQVM7QUFBQSxVQUFHO0FBQUEsUUFDdkM7QUFDQSxZQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLG1CQUFtQjtBQUFBLFVBQzNDLFFBQVEsS0FBSyxnQkFBZ0I7QUFBQSxVQUM3QixPQUFPO0FBQUEsUUFDUixDQUFDLENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRCxTQUFTLE9BQU87QUFDZixjQUFRLE1BQU0sK0JBQStCLEtBQUs7QUFDbEQsVUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxXQUFXLENBQUM7QUFBQSxJQUN0QyxVQUFFO0FBQ0QsV0FBSyxhQUFhO0FBQ2xCLFlBQU0sS0FBSyxXQUFXO0FBQUEsSUFDdkI7QUFBQSxFQUNEO0FBQUEsRUFFUSxlQUFlO0FBQ3RCLFFBQUksU0FBUyxlQUFlLCtCQUErQixLQUMxRCxTQUFTLGVBQWUsc0JBQXNCLEdBQUc7QUFDakQ7QUFBQSxJQUNEO0FBQ0EsU0FBSyxLQUFLLE9BQU8sU0FBUztBQUFBLEVBQzNCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUSxxQkFBcUIsV0FBd0IsT0FBdUIsT0FBZTtBQUMxRixVQUFNLE1BQU0sS0FBSyxDQUFDLEdBQUcsTUFBTSxLQUFLLHNCQUFzQixFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUM7QUFFckUsVUFBTSxVQUFVLFVBQVUsVUFBVSxFQUFFLEtBQUssa0JBQWtCLENBQUM7QUFHOUQsVUFBTSxjQUFjLFFBQVEsVUFBVSxFQUFFLEtBQUsseUJBQXlCLENBQUM7QUFDdkUsZ0JBQVksV0FBVztBQUFBLE1BQ3RCLEtBQUs7QUFBQSxNQUNMLE1BQU0sS0FBSyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxDQUFDO0FBQUEsSUFDaEQsQ0FBQztBQUNELGdCQUFZLFdBQVc7QUFBQSxNQUN0QixLQUFLO0FBQUEsTUFDTCxNQUFNLEdBQUcsTUFBTSxNQUFNLE1BQU0sSUFBSSxLQUFLLE9BQU8sRUFBRSxPQUFPLENBQUM7QUFBQSxJQUN0RCxDQUFDO0FBR0QsVUFBTSxXQUFXLFFBQVEsVUFBVSxFQUFFLEtBQUssd0JBQXdCLENBQUM7QUFFbkUsYUFBUyxJQUFJLEdBQUcsSUFBSSxNQUFNLE1BQU0sUUFBUSxLQUFLO0FBQzVDLFlBQU0sV0FBVyxNQUFNLE1BQU0sQ0FBQztBQUM5QixZQUFNLE9BQU8sS0FBSyxJQUFJLE1BQU0sc0JBQXNCLFNBQVMsSUFBSTtBQUMvRCxVQUFJLEVBQUUsZ0JBQWdCLHdCQUFRO0FBRTlCLFlBQU0sU0FBUyxTQUFTLFVBQVU7QUFBQSxRQUNqQyxLQUFLLHdCQUF3QixNQUFNLElBQUksOEJBQThCLDJCQUEyQjtBQUFBLE1BQ2pHLENBQUM7QUFHRCxZQUFNLFFBQVEsT0FBTyxVQUFVLEVBQUUsS0FBSywyQkFBMkIsQ0FBQztBQUNsRSxZQUFNLE1BQU0sS0FBSyxJQUFJLE1BQU0sZ0JBQWdCLElBQUk7QUFDL0MsWUFBTSxNQUFNLE1BQU0sU0FBUyxPQUFPO0FBQUEsUUFDakMsTUFBTSxFQUFFLEtBQUssS0FBSyxLQUFLLEtBQUs7QUFBQSxNQUM3QixDQUFDO0FBQ0QsVUFBSSxpQkFBaUIsU0FBUyxNQUFNO0FBQ25DLGNBQU0sTUFBTTtBQUNaLGNBQU0sT0FBTyxNQUFNLFVBQVU7QUFDN0Isc0NBQVEsTUFBTSxPQUFPO0FBQUEsTUFDdEIsQ0FBQztBQUdELFlBQU0sT0FBTyxPQUFPLFVBQVUsRUFBRSxLQUFLLHNCQUFzQixDQUFDO0FBQzVELFdBQUssVUFBVSxFQUFFLEtBQUssdUJBQXVCLE1BQU0sS0FBSyxLQUFLLENBQUM7QUFDOUQsV0FBSyxVQUFVLEVBQUUsS0FBSyx1QkFBdUIsTUFBTSxLQUFLLEtBQUssQ0FBQztBQUU5RCxZQUFNLE9BQU8sS0FBSyxVQUFVLEVBQUUsS0FBSyxzQkFBc0IsQ0FBQztBQUMxRCxXQUFLLFdBQVcsRUFBRSxNQUFNLGVBQWUsS0FBSyxLQUFLLElBQUksRUFBRSxDQUFDO0FBQ3hELFdBQUssV0FBVyxFQUFFLE1BQU0sTUFBTSxJQUFJLEtBQUssS0FBSyxLQUFLLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxHQUFHLENBQUM7QUFDaEYsV0FBSyxXQUFXO0FBQUEsUUFDZixLQUFLO0FBQUEsUUFDTCxNQUFNLElBQUksU0FBUyxVQUFVO0FBQUEsTUFDOUIsQ0FBQztBQUdELFVBQUksTUFBTSxHQUFHO0FBQ1osZUFBTyxXQUFXLEVBQUUsS0FBSyx3QkFBd0IsTUFBTSxLQUFLLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQztBQUFBLE1BQ3RGLE9BQU87QUFFTixjQUFNLGdCQUFnQixPQUFPLFNBQVMsVUFBVSxFQUFFLEtBQUssMkJBQTJCLENBQUM7QUFDbkYsc0NBQVEsZUFBZSxTQUFTO0FBQ2hDLHNCQUFjLFdBQVcsRUFBRSxNQUFNLElBQUksS0FBSyxPQUFPLEVBQUUsWUFBWSxDQUFDLEdBQUcsQ0FBQztBQUNwRSxzQkFBYyxpQkFBaUIsU0FBUyxZQUFZO0FBQ25ELGdCQUFNLFdBQVcsTUFBTSxNQUFNLENBQUM7QUFDOUIsY0FBSSxDQUFDLFlBQVksU0FBUyxTQUFTLEtBQUssTUFBTTtBQUM3QztBQUFBLFVBQ0Q7QUFFQSx3QkFBYyxXQUFXO0FBQ3pCLGNBQUk7QUFDSCxrQkFBTSxtQkFBbUIsS0FBSyxLQUFLLEtBQUssTUFBTSxTQUFTLElBQUk7QUFDM0Qsa0JBQU0sU0FBUyxNQUFNLEtBQUssT0FBTyxlQUFlLElBQUk7QUFDcEQsZ0JBQUksQ0FBQyxRQUFRO0FBQ1osNEJBQWMsV0FBVztBQUN6QjtBQUFBLFlBQ0Q7QUFFQSxrQkFBTSxRQUFRLE1BQU0sTUFBTSxPQUFPLFdBQVMsTUFBTSxTQUFTLEtBQUssSUFBSTtBQUNsRSxnQkFBSSxNQUFNLE1BQU0sVUFBVSxHQUFHO0FBQzVCLG9CQUFNLE1BQU0sS0FBSyxnQkFBZ0IsUUFBUSxLQUFLO0FBQzlDLGtCQUFJLE9BQU8sRUFBRyxNQUFLLGdCQUFnQixPQUFPLEtBQUssQ0FBQztBQUFBLFlBQ2pEO0FBQ0Esa0JBQU0sS0FBSyxXQUFXO0FBQUEsVUFDdkIsU0FBUyxPQUFPO0FBQ2Ysb0JBQVEsTUFBTSxxREFBYSxLQUFLO0FBQ2hDLGdCQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQztBQUNoRSwwQkFBYyxXQUFXO0FBQUEsVUFDMUI7QUFBQSxRQUNELENBQUM7QUFBQSxNQUNGO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sMEJBQTBCO0FBQy9CLFFBQUksbUJBQW1CO0FBRXZCLGVBQVcsU0FBUyxLQUFLLGlCQUFpQjtBQUN6QyxZQUFNLE1BQU0sS0FBSyxDQUFDLEdBQUcsTUFBTSxLQUFLLHNCQUFzQixFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUM7QUFFckUsWUFBTSxXQUFXLE1BQU0sTUFBTSxDQUFDO0FBRTlCLGVBQVMsSUFBSSxHQUFHLElBQUksTUFBTSxNQUFNLFFBQVEsS0FBSztBQUM1QyxjQUFNLFFBQVEsTUFBTSxNQUFNLENBQUM7QUFDM0IsY0FBTSxPQUFPLEtBQUssSUFBSSxNQUFNLHNCQUFzQixNQUFNLElBQUk7QUFDNUQsWUFBSSxFQUFFLGdCQUFnQix3QkFBUTtBQUU5QixjQUFNLG1CQUFtQixLQUFLLEtBQUssS0FBSyxNQUFNLFNBQVMsSUFBSTtBQUMzRCxjQUFNLFNBQVMsTUFBTSxLQUFLLE9BQU8sZUFBZSxJQUFJO0FBQ3BELFlBQUksT0FBUTtBQUFBLE1BQ2I7QUFBQSxJQUNEO0FBRUEsUUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSx5QkFBeUIsRUFBRSxPQUFPLGlCQUFpQixDQUFDLENBQUM7QUFDOUUsU0FBSyxrQkFBa0IsQ0FBQztBQUN4QixVQUFNLEtBQUssV0FBVztBQUFBLEVBQ3ZCO0FBQ0Q7OztBR25hQSxJQUFBQyxtQkFBcUM7QUFJOUIsSUFBTSxvQkFBTixjQUFnQyx1QkFBTTtBQUFBLEVBUTVDLFlBQ0MsS0FDQSxRQUNBLE1BQ0EsV0FBb0IsQ0FBQyxHQUNyQixhQUFrQyxNQUNqQztBQUNELFVBQU0sR0FBRztBQVpWLHdCQUF1QjtBQUN2QixvQkFBb0IsQ0FBQztBQUNyQixTQUFRLGlCQUFzRDtBQUM5RCxTQUFRLGFBQWtDO0FBVXpDLFNBQUssU0FBUztBQUNkLFNBQUssT0FBTztBQUNaLFNBQUssV0FBVyxTQUFTLFNBQVMsSUFBSSxXQUFXLENBQUMsSUFBSTtBQUN0RCxVQUFNLE1BQU0sS0FBSyxTQUFTLFVBQVUsT0FBSyxFQUFFLFNBQVMsS0FBSyxJQUFJO0FBQzdELFNBQUssZUFBZSxPQUFPLElBQUksTUFBTTtBQUNyQyxTQUFLLGFBQWE7QUFBQSxFQUNuQjtBQUFBLEVBRUEsU0FBUztBQUNSLFVBQU0sRUFBRSxXQUFXLFFBQVEsSUFBSTtBQUMvQixZQUFRLFNBQVMscUJBQXFCO0FBR3RDLFVBQU0sV0FBVyxVQUFVLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBQzdELGFBQVMsY0FBYztBQUN2QixhQUFTLGlCQUFpQixTQUFTLE1BQU0sS0FBSyxNQUFNLENBQUM7QUFHckQsVUFBTSxZQUFZLFVBQVUsVUFBVSxFQUFFLEtBQUssb0JBQW9CLENBQUM7QUFHbEUsU0FBSyxZQUFZLFNBQVM7QUFHMUIsUUFBSSxLQUFLLFNBQVMsU0FBUyxHQUFHO0FBQzdCLFdBQUssaUJBQWlCLFNBQVM7QUFBQSxJQUNoQztBQUdBLFNBQUssY0FBYyxTQUFTO0FBRzVCLFFBQUksS0FBSyxPQUFPLFNBQVMsbUJBQW1CO0FBQzNDLFdBQUssb0JBQW9CO0FBQUEsSUFDMUI7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxZQUFZLFdBQXdCO0FBQ25DLGNBQVUsTUFBTTtBQUNoQixVQUFNLE9BQU8sS0FBSyxTQUFTLEtBQUssWUFBWTtBQUM1QyxVQUFNLE1BQU0sS0FBSyxVQUFVLFlBQVk7QUFDdkMsVUFBTSxZQUFZLGFBQWEsS0FBSyxJQUFJO0FBQ3hDLFVBQU0sVUFBVSxjQUFjO0FBQzlCLFVBQU0sVUFBVSxjQUFjO0FBQzlCLFVBQU0sVUFBVSxjQUFjO0FBQzlCLFVBQU0sYUFBYSxjQUFjO0FBQ2pDLFVBQU0sUUFBUSxRQUFRO0FBRXRCLFFBQUksU0FBUztBQUNaLFlBQU0sTUFBTSxVQUFVLFNBQVMsT0FBTztBQUFBLFFBQ3JDLEtBQUs7QUFBQSxRQUNMLE1BQU0sRUFBRSxLQUFLLEtBQUssSUFBSSxNQUFNLGdCQUFnQixJQUFJLEVBQUU7QUFBQSxNQUNuRCxDQUFDO0FBR0QsVUFBSSxpQkFBaUIsU0FBUyxNQUFNO0FBQ25DLGtCQUFVLE1BQU07QUFDaEIsa0JBQVUsVUFBVTtBQUFBLFVBQ25CLEtBQUs7QUFBQSxVQUNMLE1BQU0sS0FBSyxPQUFPLEVBQUUsZ0JBQWdCLEtBQUs7QUFBQSxRQUMxQyxDQUFDO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDRixXQUFXLFNBQVM7QUFDbkIsWUFBTSxRQUFRLFVBQVUsU0FBUyxTQUFTO0FBQUEsUUFDekMsS0FBSztBQUFBLFFBQ0wsTUFBTSxFQUFFLFVBQVUsT0FBTztBQUFBLE1BQzFCLENBQUM7QUFDRCxZQUFNLE1BQU0sS0FBSyxJQUFJLE1BQU0sZ0JBQWdCLElBQUk7QUFBQSxJQUNoRCxXQUFXLFNBQVM7QUFDbkIsWUFBTSxRQUFRLFVBQVUsU0FBUyxTQUFTO0FBQUEsUUFDekMsS0FBSztBQUFBLFFBQ0wsTUFBTSxFQUFFLFVBQVUsT0FBTztBQUFBLE1BQzFCLENBQUM7QUFDRCxZQUFNLE1BQU0sS0FBSyxJQUFJLE1BQU0sZ0JBQWdCLElBQUk7QUFBQSxJQUNoRCxXQUFXLE9BQU87QUFDakIsWUFBTSxTQUFTLFVBQVUsU0FBUyxVQUFVO0FBQUEsUUFDM0MsS0FBSztBQUFBLFFBQ0wsTUFBTTtBQUFBLFVBQ0wsS0FBSyxLQUFLLElBQUksTUFBTSxnQkFBZ0IsSUFBSTtBQUFBLFVBQ3hDLFNBQVM7QUFBQSxRQUNWO0FBQUEsTUFDRCxDQUFDO0FBQUEsSUFDRixXQUFXLFlBQVk7QUFDdEIsWUFBTSxjQUFjLFVBQVUsVUFBVSxFQUFFLEtBQUssc0JBQXNCLENBQUM7QUFDdEUsa0JBQVksVUFBVSxFQUFFLE1BQU0sd0JBQXdCLEtBQUssSUFBSSxFQUFFLENBQUM7QUFDbEUsa0JBQVksVUFBVTtBQUFBLFFBQ3JCLE1BQU0sS0FBSyxPQUFPLEVBQUUsaUNBQWlDLEtBQUssS0FBSyxPQUFPLEVBQUUscUJBQXFCO0FBQUEsTUFDOUYsQ0FBQztBQUFBLElBQ0YsT0FBTztBQUNOLGdCQUFVLFVBQVUsRUFBRSxLQUFLLHVCQUF1QixNQUFNLEtBQUssT0FBTyxFQUFFLHFCQUFxQixFQUFFLENBQUM7QUFBQSxJQUMvRjtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGlCQUFpQixXQUF3QjtBQUN4QyxVQUFNLE1BQU0sVUFBVSxVQUFVLEVBQUUsS0FBSyxjQUFjLENBQUM7QUFHdEQsVUFBTSxVQUFVLElBQUksU0FBUyxVQUFVLEVBQUUsS0FBSyxrQkFBa0IsQ0FBQztBQUNqRSxZQUFRLGNBQWM7QUFDdEIsWUFBUSxpQkFBaUIsU0FBUyxDQUFDLE1BQU07QUFDeEMsUUFBRSxnQkFBZ0I7QUFDbEIsV0FBSyxLQUFLO0FBQUEsSUFDWCxDQUFDO0FBR0QsUUFBSSxXQUFXO0FBQUEsTUFDZCxNQUFNLEdBQUcsS0FBSyxlQUFlLENBQUMsTUFBTSxLQUFLLFNBQVMsTUFBTTtBQUFBLE1BQ3hELEtBQUs7QUFBQSxJQUNOLENBQUM7QUFHRCxVQUFNLFVBQVUsSUFBSSxTQUFTLFVBQVUsRUFBRSxLQUFLLGtCQUFrQixDQUFDO0FBQ2pFLFlBQVEsY0FBYztBQUN0QixZQUFRLGlCQUFpQixTQUFTLENBQUMsTUFBTTtBQUN4QyxRQUFFLGdCQUFnQjtBQUNsQixXQUFLLEtBQUs7QUFBQSxJQUNYLENBQUM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxjQUFjLFdBQXdCO0FBQ3JDLFVBQU0sT0FBTyxLQUFLLFNBQVMsS0FBSyxZQUFZO0FBQzVDLFVBQU0sVUFBVSxVQUFVLFVBQVUsRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBRy9ELFlBQVEsVUFBVSxFQUFFLEtBQUssYUFBYSxNQUFNLEtBQUssS0FBSyxDQUFDO0FBR3ZELFVBQU0sVUFBVSxRQUFRLFVBQVUsRUFBRSxLQUFLLGVBQWUsQ0FBQztBQUd6RCxVQUFNLGNBQWMsUUFBUSxTQUFTLFFBQVE7QUFDN0MsZ0JBQVksY0FBYyxLQUFLLE9BQU8sRUFBRSxhQUFhO0FBQ3JELGdCQUFZLGlCQUFpQixTQUFTLE1BQU07QUFDM0MsV0FBSyxVQUFVLFVBQVUsVUFBVSxLQUFLLElBQUksRUFBRSxLQUFLLE1BQU07QUFDeEQsWUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxZQUFZLENBQUM7QUFBQSxNQUN2QyxDQUFDLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDbkIsZ0JBQVEsTUFBTSxxREFBYSxLQUFLO0FBQ2hDLFlBQUksd0JBQU8sS0FBSyxPQUFPLEVBQUUsT0FBTyxDQUFDO0FBQUEsTUFDbEMsQ0FBQztBQUFBLElBQ0YsQ0FBQztBQUdELFVBQU0sY0FBYyxRQUFRLFNBQVMsUUFBUTtBQUM3QyxnQkFBWSxjQUFjLEtBQUssT0FBTyxFQUFFLGFBQWE7QUFDckQsZ0JBQVksaUJBQWlCLFNBQVMsTUFBTTtBQUMzQyxZQUFNLE9BQU8sS0FBSyxPQUFPLGtCQUFrQixJQUFJO0FBQy9DLFdBQUssVUFBVSxVQUFVLFVBQVUsSUFBSSxFQUFFLEtBQUssTUFBTTtBQUNuRCxZQUFJLHdCQUFPLEtBQUssT0FBTyxFQUFFLFlBQVksQ0FBQztBQUFBLE1BQ3ZDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVTtBQUNuQixnQkFBUSxNQUFNLHFEQUFhLEtBQUs7QUFDaEMsWUFBSSx3QkFBTyxLQUFLLE9BQU8sRUFBRSxPQUFPLENBQUM7QUFBQSxNQUNsQyxDQUFDO0FBQUEsSUFDRixDQUFDO0FBR0QsVUFBTSxrQkFBa0IsUUFBUSxTQUFTLFFBQVE7QUFDakQsb0JBQWdCLGNBQWMsS0FBSyxPQUFPLEVBQUUsY0FBYztBQUMxRCxvQkFBZ0IsaUJBQWlCLFNBQVMsTUFBTTtBQUMvQyxXQUFLLEtBQUssT0FBTyxpQkFBaUIsSUFBSTtBQUFBLElBQ3ZDLENBQUM7QUFHRCxVQUFNLFVBQVUsUUFBUSxTQUFTLFFBQVE7QUFDekMsWUFBUSxjQUFjLEtBQUssT0FBTyxFQUFFLGFBQWE7QUFDakQsWUFBUSxpQkFBaUIsU0FBUyxNQUFNO0FBQ3ZDLFdBQUssTUFBTTtBQUNYLFdBQUssT0FBTyxpQkFBaUIsSUFBSTtBQUFBLElBQ2xDLENBQUM7QUFBQSxFQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxzQkFBc0I7QUFDckIsU0FBSyxpQkFBaUIsQ0FBQyxNQUFxQjtBQUMzQyxjQUFRLEVBQUUsS0FBSztBQUFBLFFBQ2QsS0FBSztBQUNKLGVBQUssS0FBSztBQUNWO0FBQUEsUUFDRCxLQUFLO0FBQ0osZUFBSyxLQUFLO0FBQ1Y7QUFBQSxRQUNELEtBQUs7QUFDSixlQUFLLE1BQU07QUFDWDtBQUFBLE1BQ0Y7QUFBQSxJQUNEO0FBRUEsU0FBSyxRQUFRLGlCQUFpQixXQUFXLEtBQUssY0FBYztBQUFBLEVBQzdEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxPQUFPO0FBQ04sUUFBSSxLQUFLLGVBQWUsR0FBRztBQUMxQixXQUFLO0FBQ0wsV0FBSyxjQUFjO0FBQUEsSUFDcEI7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxPQUFPO0FBQ04sUUFBSSxLQUFLLGVBQWUsS0FBSyxTQUFTLFNBQVMsR0FBRztBQUNqRCxXQUFLO0FBQ0wsV0FBSyxjQUFjO0FBQUEsSUFDcEI7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxnQkFBZ0I7QUFFZixRQUFJLENBQUMsS0FBSyxXQUFXO0FBQ3BCO0FBQUEsSUFDRDtBQUVBLFVBQU0sWUFBWSxLQUFLLFVBQVUsY0FBYyxvQkFBb0I7QUFDbkUsUUFBSSxXQUFXO0FBQ2QsV0FBSyxZQUFZLFNBQXdCO0FBQ3pDLFlBQU0sU0FBUyxVQUFVLGNBQWMsY0FBYztBQUNyRCxVQUFJLE9BQVEsUUFBTyxPQUFPO0FBQzFCLFVBQUksS0FBSyxTQUFTLFNBQVMsR0FBRztBQUM3QixhQUFLLGlCQUFpQixTQUF3QjtBQUFBLE1BQy9DO0FBQUEsSUFDRDtBQUNBLFVBQU0sYUFBYSxLQUFLLFVBQVUsY0FBYyxtQkFBbUI7QUFDbkUsUUFBSSxXQUFZLFlBQVcsT0FBTztBQUNsQyxTQUFLLGNBQWMsS0FBSyxTQUFTO0FBQUEsRUFDbEM7QUFBQSxFQUVBLFVBQVU7QUFDVCxVQUFNLEVBQUUsV0FBVyxRQUFRLElBQUk7QUFFL0IsUUFBSSxLQUFLLGdCQUFnQjtBQUN4QixjQUFRLG9CQUFvQixXQUFXLEtBQUssY0FBYztBQUMxRCxXQUFLLGlCQUFpQjtBQUFBLElBQ3ZCO0FBQ0EsY0FBVSxNQUFNO0FBQ2hCLFFBQUksS0FBSyxZQUFZO0FBQ3BCLFVBQUk7QUFDSCxhQUFLLFdBQVc7QUFBQSxNQUNqQixTQUFTLEdBQUc7QUFBQSxNQUFDO0FBQUEsSUFDZDtBQUFBLEVBQ0Q7QUFDRDs7O0FDclJBLElBQUFDLG1CQUFrRTtBQWlEM0QsSUFBTSxtQkFBeUM7QUFBQSxFQUNyRCxhQUFhO0FBQUEsRUFDYixlQUFlO0FBQUEsRUFDZixlQUFlO0FBQUEsRUFDZixRQUFRO0FBQUEsRUFDUixXQUFXO0FBQUEsRUFDWCxhQUFhO0FBQUEsRUFDYixrQkFBa0I7QUFBQSxFQUNsQixnQkFBZ0I7QUFBQSxFQUNoQixhQUFhO0FBQUEsRUFDYixrQkFBa0I7QUFBQSxFQUNsQixrQkFBa0I7QUFBQTtBQUFBLEVBRWxCLGNBQWM7QUFBQSxFQUNkLGNBQWM7QUFBQSxFQUNkLGFBQWE7QUFBQSxFQUNiLFdBQVc7QUFBQSxFQUNYLFVBQVU7QUFBQSxFQUNWLG9CQUFvQjtBQUFBLEVBQ3BCLG1CQUFtQjtBQUFBO0FBQUEsRUFFbkIsVUFBVTtBQUFBO0FBQUEsRUFFVixpQkFBaUI7QUFBQSxFQUNqQixtQkFBbUI7QUFBQSxFQUNuQixpQkFBaUIsSUFBSSxPQUFPO0FBQUE7QUFBQTtBQUFBLEVBRTVCLG9CQUFvQjtBQUFBO0FBQUEsRUFFcEIsZUFBZTtBQUFBLElBQ2Q7QUFBQSxNQUNDLE1BQU07QUFBQSxNQUNOLFNBQVM7QUFBQSxNQUNULGNBQWM7QUFBQSxNQUNkLGdCQUFnQjtBQUFBLE1BQ2hCLGlCQUFpQjtBQUFBLElBQ2xCO0FBQUEsRUFDRDtBQUFBO0FBQUEsRUFFQSx1QkFBdUI7QUFBQSxFQUN2QixzQkFBc0I7QUFBQSxFQUN0QixlQUFlO0FBQ2hCO0FBRU8sSUFBTSxjQUFOLGNBQTBCLGtDQUFpQjtBQUFBLEVBR2pELFlBQVksS0FBVSxRQUE0QjtBQUNqRCxVQUFNLEtBQUssTUFBTTtBQUNqQixTQUFLLFNBQVM7QUFBQSxFQUNmO0FBQUE7QUFBQSxFQUdRLEVBQUUsS0FBaUM7QUFDMUMsV0FBTyxLQUFLLE9BQU8sRUFBRSxHQUFHO0FBQUEsRUFDekI7QUFBQSxFQUVBLFVBQWdCO0FBQ2YsVUFBTSxFQUFFLFlBQVksSUFBSTtBQUN4QixnQkFBWSxNQUFNO0FBR2xCLGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxFQUFFLGdCQUFnQixFQUFFLENBQUM7QUFHN0QsUUFBSSx5QkFBUSxXQUFXLEVBQ3JCLFFBQVEsS0FBSyxFQUFFLGFBQWEsQ0FBQyxFQUM3QixRQUFRLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxFQUNqQyxRQUFRLFVBQVEsS0FDZixlQUFlLG1CQUFtQixFQUNsQyxTQUFTLEtBQUssT0FBTyxTQUFTLFdBQVcsRUFDekMsU0FBUyxPQUFPLFVBQVU7QUFDMUIsV0FBSyxPQUFPLFNBQVMsY0FBYyxtQkFBbUIsS0FBSztBQUMzRCxXQUFLLE9BQU8sV0FBVztBQUN2QixZQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDaEMsQ0FBQyxDQUFDO0FBR0osUUFBSSx5QkFBUSxXQUFXLEVBQ3JCLFFBQVEsS0FBSyxFQUFFLGVBQWUsQ0FBQyxFQUMvQixRQUFRLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxFQUNuQyxZQUFZLGNBQVksU0FDdkIsVUFBVSxTQUFTLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxFQUMzQyxVQUFVLFVBQVUsS0FBSyxFQUFFLGlCQUFpQixDQUFDLEVBQzdDLFVBQVUsU0FBUyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsRUFDM0MsU0FBUyxLQUFLLE9BQU8sU0FBUyxhQUFhLEVBQzNDLFNBQVMsT0FBTyxVQUFrQjtBQUNsQyxXQUFLLE9BQU8sU0FBUyxnQkFBZ0I7QUFDckMsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2hDLENBQUMsQ0FBQztBQUdKLFFBQUkseUJBQVEsV0FBVyxFQUNyQixRQUFRLEtBQUssRUFBRSxlQUFlLENBQUMsRUFDL0IsUUFBUSxLQUFLLEVBQUUsWUFBWSxDQUFDLEVBQzVCLFlBQVksY0FBWSxTQUN2QixVQUFVLFFBQVEsS0FBSyxFQUFFLFlBQVksQ0FBQyxFQUN0QyxVQUFVLFFBQVEsS0FBSyxFQUFFLFlBQVksQ0FBQyxFQUN0QyxVQUFVLFFBQVEsS0FBSyxFQUFFLFlBQVksQ0FBQyxFQUN0QyxTQUFTLEtBQUssT0FBTyxTQUFTLE1BQU0sRUFDcEMsU0FBUyxPQUFPLFVBQWtCO0FBQ2xDLFdBQUssT0FBTyxTQUFTLFNBQVM7QUFDOUIsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2hDLENBQUMsQ0FBQztBQUdKLFFBQUkseUJBQVEsV0FBVyxFQUNyQixRQUFRLEtBQUssRUFBRSxXQUFXLENBQUMsRUFDM0IsUUFBUSxLQUFLLEVBQUUsZUFBZSxDQUFDLEVBQy9CLFlBQVksY0FBWSxTQUN2QixVQUFVLE9BQU8sS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUNsQyxVQUFVLFFBQVEsS0FBSyxFQUFFLFVBQVUsQ0FBQyxFQUNwQyxTQUFTLEtBQUssT0FBTyxTQUFTLFNBQVMsRUFDdkMsU0FBUyxPQUFPLFVBQWtCO0FBQ2xDLFdBQUssT0FBTyxTQUFTLFlBQVk7QUFDakMsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2hDLENBQUMsQ0FBQztBQUdKLFFBQUkseUJBQVEsV0FBVyxFQUNyQixRQUFRLEtBQUssRUFBRSxlQUFlLENBQUMsRUFDL0IsUUFBUSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsRUFDbkMsVUFBVSxZQUFVLE9BQ25CLFNBQVMsS0FBSyxPQUFPLFNBQVMsYUFBYSxFQUMzQyxTQUFTLE9BQU8sVUFBVTtBQUMxQixXQUFLLE9BQU8sU0FBUyxnQkFBZ0I7QUFDckMsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2hDLENBQUMsQ0FBQztBQUdKLFFBQUkseUJBQVEsV0FBVyxFQUNyQixRQUFRLEtBQUssRUFBRSxhQUFhLENBQUMsRUFDN0IsUUFBUSxLQUFLLEVBQUUsaUJBQWlCLENBQUMsRUFDakMsVUFBVSxZQUFVLE9BQ25CLFNBQVMsS0FBSyxPQUFPLFNBQVMsV0FBVyxFQUN6QyxTQUFTLE9BQU8sVUFBVTtBQUMxQixXQUFLLE9BQU8sU0FBUyxjQUFjO0FBQ25DLFlBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxJQUNoQyxDQUFDLENBQUM7QUFHSixRQUFJLHlCQUFRLFdBQVcsRUFDckIsUUFBUSxLQUFLLEVBQUUsa0JBQWtCLENBQUMsRUFDbEMsUUFBUSxLQUFLLEVBQUUsZUFBZSxDQUFDLEVBQy9CLFlBQVksY0FBWSxTQUN2QixVQUFVLFFBQVEsS0FBSyxFQUFFLFdBQVcsQ0FBQyxFQUNyQyxVQUFVLFVBQVUsS0FBSyxFQUFFLGFBQWEsQ0FBQyxFQUN6QyxVQUFVLFNBQVMsS0FBSyxFQUFFLFlBQVksQ0FBQyxFQUN2QyxTQUFTLEtBQUssT0FBTyxTQUFTLGdCQUFnQixFQUM5QyxTQUFTLE9BQU8sVUFBa0I7QUFDbEMsV0FBSyxPQUFPLFNBQVMsbUJBQW1CO0FBQ3hDLFlBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxJQUNoQyxDQUFDLENBQUM7QUFHSixnQkFBWSxTQUFTLE1BQU0sRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBR3RELGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxFQUFFLG9CQUFvQixFQUFFLENBQUM7QUFHakUsUUFBSSx5QkFBUSxXQUFXLEVBQ3JCLFFBQVEsS0FBSyxFQUFFLGdCQUFnQixDQUFDLEVBQ2hDLFFBQVEsS0FBSyxFQUFFLG9CQUFvQixDQUFDLEVBQ3BDLFVBQVUsWUFBVSxPQUNuQixTQUFTLEtBQUssT0FBTyxTQUFTLGNBQWMsRUFDNUMsU0FBUyxPQUFPLFVBQVU7QUFDMUIsV0FBSyxPQUFPLFNBQVMsaUJBQWlCO0FBQ3RDLFlBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxJQUNoQyxDQUFDLENBQUM7QUFHSixRQUFJLHlCQUFRLFdBQVcsRUFDckIsUUFBUSxLQUFLLEVBQUUsaUJBQWlCLENBQUMsRUFDakMsUUFBUSxLQUFLLEVBQUUscUJBQXFCLENBQUMsRUFDckMsUUFBUSxVQUFRLEtBQ2YsZUFBZSw4QkFBOEIsRUFDN0MsU0FBUyxLQUFLLE9BQU8sU0FBUyxXQUFXLEVBQ3pDLFNBQVMsT0FBTyxVQUFVO0FBQzFCLFdBQUssT0FBTyxTQUFTLGNBQWMsbUJBQW1CLEtBQUs7QUFDM0QsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2hDLENBQUMsQ0FBQztBQUdKLFFBQUkseUJBQVEsV0FBVyxFQUNyQixRQUFRLEtBQUssRUFBRSxrQkFBa0IsQ0FBQyxFQUNsQyxRQUFRLEtBQUssRUFBRSxzQkFBc0IsQ0FBQyxFQUN0QyxVQUFVLFlBQVUsT0FDbkIsU0FBUyxLQUFLLE9BQU8sU0FBUyxnQkFBZ0IsRUFDOUMsU0FBUyxPQUFPLFVBQVU7QUFDMUIsV0FBSyxPQUFPLFNBQVMsbUJBQW1CO0FBQ3hDLFlBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxJQUNoQyxDQUFDLENBQUM7QUFHSixRQUFJLHlCQUFRLFdBQVcsRUFDckIsUUFBUSxLQUFLLEVBQUUsYUFBYSxDQUFDLEVBQzdCLFFBQVEsS0FBSyxFQUFFLGlCQUFpQixDQUFDLEVBQ2pDLFFBQVEsVUFBUSxLQUNmLGVBQWUsSUFBSSxFQUNuQixTQUFTLE9BQU8sS0FBSyxPQUFPLFNBQVMsZ0JBQWdCLENBQUMsRUFDdEQsU0FBUyxPQUFPLFVBQVU7QUFDMUIsWUFBTSxPQUFPLFNBQVMsT0FBTyxFQUFFO0FBQy9CLFVBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxPQUFPLEdBQUc7QUFDN0IsYUFBSyxPQUFPLFNBQVMsbUJBQW1CO0FBQ3hDLGNBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxNQUNoQztBQUFBLElBQ0QsQ0FBQyxDQUFDO0FBR0osZ0JBQVksU0FBUyxNQUFNLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUd0RCxnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxDQUFDO0FBRS9ELFFBQUkseUJBQVEsV0FBVyxFQUNyQixRQUFRLEtBQUssRUFBRSxVQUFVLENBQUMsRUFDMUIsUUFBUSxLQUFLLEVBQUUscUJBQXFCLENBQUMsRUFDckMsVUFBVSxZQUFVLE9BQ25CLFNBQVMsS0FBSyxPQUFPLFNBQVMsZUFBZSxFQUM3QyxTQUFTLE9BQU8sVUFBVTtBQUMxQixXQUFLLE9BQU8sU0FBUyxrQkFBa0I7QUFDdkMsWUFBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLElBQ2hDLENBQUMsQ0FBQztBQUVKLFFBQUkseUJBQVEsV0FBVyxFQUNyQixRQUFRLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxFQUNuQyxRQUFRLEtBQUssRUFBRSx1QkFBdUIsQ0FBQyxFQUN2QyxRQUFRLFVBQVEsS0FDZixlQUFlLElBQUksRUFDbkIsU0FBUyxPQUFPLEtBQUssT0FBTyxTQUFTLGlCQUFpQixDQUFDLEVBQ3ZELFNBQVMsT0FBTyxVQUFVO0FBQzFCLFlBQU0sT0FBTyxTQUFTLE9BQU8sRUFBRTtBQUMvQixVQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssT0FBTyxHQUFHO0FBQzdCLGFBQUssT0FBTyxTQUFTLG9CQUFvQjtBQUN6QyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDaEM7QUFBQSxJQUNELENBQUMsQ0FBQztBQUVKLFFBQUkseUJBQVEsV0FBVyxFQUNyQixRQUFRLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxFQUNqQyxRQUFRLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxFQUNyQyxRQUFRLFVBQVEsS0FDZixlQUFlLEdBQUcsRUFDbEIsU0FBUyxPQUFPLFFBQVEsS0FBSyxPQUFPLFNBQVMsbUJBQW1CLE9BQU8sT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDMUYsU0FBUyxPQUFPLFVBQVU7QUFDMUIsWUFBTSxTQUFTLFdBQVcsS0FBSztBQUMvQixVQUFJLENBQUMsTUFBTSxNQUFNLEtBQUssVUFBVSxHQUFHO0FBQ2xDLGFBQUssT0FBTyxTQUFTLGtCQUFrQixLQUFLLE1BQU0sU0FBUyxPQUFPLElBQUk7QUFDdEUsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ2hDO0FBQUEsSUFDRCxDQUFDLENBQUM7QUFHSixnQkFBWSxTQUFTLE1BQU0sRUFBRSxLQUFLLG1CQUFtQixDQUFDO0FBR3RELGdCQUFZLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxFQUFFLDRCQUE0QixFQUFFLENBQUM7QUFFekUsUUFBSSx5QkFBUSxXQUFXLEVBQ3JCLFFBQVEsS0FBSyxFQUFFLDJCQUEyQixDQUFDLEVBQzNDLFFBQVEsS0FBSyxFQUFFLHdCQUF3QixDQUFDLEVBQ3hDLFFBQVEsVUFBUSxLQUNmLGVBQWUsSUFBSSxFQUNuQixTQUFTLE9BQU8sS0FBSyxPQUFPLFNBQVMsa0JBQWtCLENBQUMsRUFDeEQsU0FBUyxPQUFPLFVBQVU7QUFDMUIsWUFBTSxZQUFZLFNBQVMsT0FBTyxFQUFFO0FBQ3BDLFVBQUksQ0FBQyxNQUFNLFNBQVMsS0FBSyxhQUFhLE1BQU0sYUFBYSxLQUFLO0FBQzdELGFBQUssT0FBTyxTQUFTLHFCQUFxQjtBQUMxQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDaEM7QUFBQSxJQUNELENBQUMsQ0FBQztBQUdKLGdCQUFZLFNBQVMsTUFBTSxFQUFFLEtBQUssbUJBQW1CLENBQUM7QUFHdEQsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLEVBQUUsWUFBWSxFQUFFLENBQUM7QUFFekQsUUFBSSx5QkFBUSxXQUFXLEVBQ3JCLFFBQVEsS0FBSyxFQUFFLG9CQUFvQixDQUFDLEVBQ3BDLFFBQVEsS0FBSyxFQUFFLHdCQUF3QixDQUFDLEVBQ3hDLFVBQVUsWUFBVSxPQUNuQixTQUFTLEtBQUssT0FBTyxTQUFTLFlBQVksRUFDMUMsU0FBUyxPQUFPLFVBQVU7QUFDMUIsV0FBSyxPQUFPLFNBQVMsZUFBZTtBQUNwQyxXQUFLLE9BQU8sV0FBVztBQUN2QixZQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDaEMsQ0FBQyxDQUFDO0FBRUosUUFBSSx5QkFBUSxXQUFXLEVBQ3JCLFFBQVEsS0FBSyxFQUFFLG9CQUFvQixDQUFDLEVBQ3BDLFFBQVEsS0FBSyxFQUFFLHdCQUF3QixDQUFDLEVBQ3hDLFVBQVUsWUFBVSxPQUNuQixTQUFTLEtBQUssT0FBTyxTQUFTLFlBQVksRUFDMUMsU0FBUyxPQUFPLFVBQVU7QUFDMUIsV0FBSyxPQUFPLFNBQVMsZUFBZTtBQUNwQyxXQUFLLE9BQU8sV0FBVztBQUN2QixZQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDaEMsQ0FBQyxDQUFDO0FBRUosUUFBSSx5QkFBUSxXQUFXLEVBQ3JCLFFBQVEsS0FBSyxFQUFFLG9CQUFvQixDQUFDLEVBQ3BDLFFBQVEsS0FBSyxFQUFFLHdCQUF3QixDQUFDLEVBQ3hDLFVBQVUsWUFBVSxPQUNuQixTQUFTLEtBQUssT0FBTyxTQUFTLFdBQVcsRUFDekMsU0FBUyxPQUFPLFVBQVU7QUFDMUIsV0FBSyxPQUFPLFNBQVMsY0FBYztBQUNuQyxXQUFLLE9BQU8sV0FBVztBQUN2QixZQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDaEMsQ0FBQyxDQUFDO0FBRUosUUFBSSx5QkFBUSxXQUFXLEVBQ3JCLFFBQVEsS0FBSyxFQUFFLGtCQUFrQixDQUFDLEVBQ2xDLFFBQVEsS0FBSyxFQUFFLHNCQUFzQixDQUFDLEVBQ3RDLFVBQVUsWUFBVSxPQUNuQixTQUFTLEtBQUssT0FBTyxTQUFTLFNBQVMsRUFDdkMsU0FBUyxPQUFPLFVBQVU7QUFDMUIsV0FBSyxPQUFPLFNBQVMsWUFBWTtBQUNqQyxXQUFLLE9BQU8sV0FBVztBQUN2QixZQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDaEMsQ0FBQyxDQUFDO0FBR0osZ0JBQVksU0FBUyxNQUFNLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUd0RCxnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQztBQUczRCxRQUFJLHlCQUFRLFdBQVcsRUFDckIsUUFBUSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsRUFDbkMsUUFBUSxLQUFLLEVBQUUsY0FBYyxDQUFDLEVBQzlCLFlBQVksY0FBWSxTQUN2QixVQUFVLFVBQVUsS0FBSyxFQUFFLGdCQUFnQixDQUFDLEVBQzVDLFVBQVUsTUFBTSxjQUFJLEVBQ3BCLFVBQVUsTUFBTSxTQUFTLEVBQ3pCLFNBQVMsS0FBSyxPQUFPLFNBQVMsUUFBUSxFQUN0QyxTQUFTLE9BQU8sVUFBa0I7QUFDbEMsV0FBSyxPQUFPLFNBQVMsV0FBVztBQUNoQyxZQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDaEMsQ0FBQyxDQUFDO0FBRUosUUFBSSx5QkFBUSxXQUFXLEVBQ3JCLFFBQVEsS0FBSyxFQUFFLFVBQVUsQ0FBQyxFQUMxQixRQUFRLEtBQUssRUFBRSxjQUFjLENBQUMsRUFDOUIsUUFBUSxVQUFRLEtBQ2YsZUFBZSxJQUFJLEVBQ25CLFNBQVMsT0FBTyxLQUFLLE9BQU8sU0FBUyxRQUFRLENBQUMsRUFDOUMsU0FBUyxPQUFPLFVBQVU7QUFDMUIsWUFBTSxPQUFPLFNBQVMsT0FBTyxFQUFFO0FBQy9CLFVBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxPQUFPLEdBQUc7QUFDN0IsYUFBSyxPQUFPLFNBQVMsV0FBVztBQUNoQyxjQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsTUFDaEM7QUFBQSxJQUNELENBQUMsQ0FBQztBQUVKLFFBQUkseUJBQVEsV0FBVyxFQUNyQixRQUFRLEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxFQUNwQyxRQUFRLEtBQUssRUFBRSx3QkFBd0IsQ0FBQyxFQUN4QyxVQUFVLFlBQVUsT0FDbkIsU0FBUyxLQUFLLE9BQU8sU0FBUyxrQkFBa0IsRUFDaEQsU0FBUyxPQUFPLFVBQVU7QUFDMUIsV0FBSyxPQUFPLFNBQVMscUJBQXFCO0FBQzFDLFlBQU0sS0FBSyxPQUFPLGFBQWE7QUFBQSxJQUNoQyxDQUFDLENBQUM7QUFFSixRQUFJLHlCQUFRLFdBQVcsRUFDckIsUUFBUSxLQUFLLEVBQUUsbUJBQW1CLENBQUMsRUFDbkMsUUFBUSxLQUFLLEVBQUUsdUJBQXVCLENBQUMsRUFDdkMsVUFBVSxZQUFVLE9BQ25CLFNBQVMsS0FBSyxPQUFPLFNBQVMsaUJBQWlCLEVBQy9DLFNBQVMsT0FBTyxVQUFVO0FBQzFCLFdBQUssT0FBTyxTQUFTLG9CQUFvQjtBQUN6QyxZQUFNLEtBQUssT0FBTyxhQUFhO0FBQUEsSUFDaEMsQ0FBQyxDQUFDO0FBR0osZ0JBQVksU0FBUyxNQUFNLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQztBQUd0RCxnQkFBWSxTQUFTLE1BQU0sRUFBRSxNQUFNLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxDQUFDO0FBQ2hFLGdCQUFZLFNBQVMsS0FBSztBQUFBLE1BQ3pCLE1BQU0sS0FBSyxFQUFFLGVBQWU7QUFBQSxNQUM1QixLQUFLO0FBQUEsSUFDTixDQUFDO0FBQ0QsZ0JBQVksU0FBUyxNQUFNLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQyxFQUFFLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxFQUFFLHFCQUFxQixFQUFFLENBQUM7QUFDM0csZ0JBQVksU0FBUyxNQUFNLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQyxFQUFFLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxFQUFFLDBCQUEwQixFQUFFLENBQUM7QUFDaEgsZ0JBQVksU0FBUyxNQUFNLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQyxFQUFFLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxFQUFFLG1CQUFtQixFQUFFLENBQUM7QUFFekcsZ0JBQVksU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLEVBQUUsVUFBVSxFQUFFLENBQUM7QUFDdkQsZ0JBQVksU0FBUyxLQUFLO0FBQUEsTUFDekIsTUFBTSxLQUFLLEVBQUUsY0FBYztBQUFBLE1BQzNCLEtBQUs7QUFBQSxJQUNOLENBQUM7QUFDRCxnQkFBWSxTQUFTLE1BQU0sRUFBRSxLQUFLLGdCQUFnQixDQUFDLEVBQUUsU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztBQUN0RyxnQkFBWSxTQUFTLE1BQU0sRUFBRSxLQUFLLGdCQUFnQixDQUFDLEVBQUUsU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQztBQUMzRyxnQkFBWSxTQUFTLE1BQU0sRUFBRSxLQUFLLGdCQUFnQixDQUFDLEVBQUUsU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQztBQUMxRyxnQkFBWSxTQUFTLE1BQU0sRUFBRSxLQUFLLGdCQUFnQixDQUFDLEVBQUUsU0FBUyxNQUFNLEVBQUUsTUFBTSxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUM7QUFDcEcsZ0JBQVksU0FBUyxNQUFNLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQyxFQUFFLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxFQUFFLGdCQUFnQixFQUFFLENBQUM7QUFDdEcsZ0JBQVksU0FBUyxNQUFNLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQyxFQUFFLFNBQVMsTUFBTSxFQUFFLE1BQU0sS0FBSyxFQUFFLGVBQWUsRUFBRSxDQUFDO0FBQUEsRUFDdEc7QUFDRDs7O0FDL2JPLElBQU0saUJBQU4sTUFBcUI7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUkzQixPQUFlLHVCQUF1QixVQUEwQjtBQUMvRCxRQUFJLGdCQUFnQixTQUFTLEtBQUs7QUFHbEMsVUFBTSxhQUFhLGNBQWMsTUFBTSx1REFBdUQ7QUFDOUYsUUFBSSxZQUFZO0FBQ2YsYUFBTyxXQUFXLENBQUMsRUFBRSxLQUFLO0FBQUEsSUFDM0I7QUFHQSxvQkFBZ0IsY0FBYyxRQUFRLGtEQUFrRCxFQUFFLEVBQUUsS0FBSztBQUlqRyxVQUFNLFlBQVksY0FBYyxNQUFNLGlDQUFpQztBQUN2RSxRQUFJLFdBQVc7QUFFZCxZQUFNLFlBQVksVUFBVSxDQUFDLEVBQUUsWUFBWTtBQUMzQyxVQUFJLGNBQWMsVUFBVSxjQUFjLFlBQVksY0FBYyxTQUFTO0FBQzVFLGVBQU8sTUFBTSxVQUFVLENBQUMsQ0FBQztBQUFBLE1BQzFCO0FBQUEsSUFDRDtBQUdBLG9CQUFnQixjQUFjLFFBQVEsc0NBQXNDLEVBQUUsRUFBRSxLQUFLO0FBRXJGLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLE9BQU8sZUFBZSxVQUFrQixXQUFrQztBQUN6RSxVQUFNLGdCQUFnQixLQUFLLHVCQUF1QixRQUFRLEVBQUUsS0FBSztBQUdqRSxVQUFNLGdCQUFnQixjQUFjLE1BQU0sc0JBQXNCO0FBQ2hFLFFBQUksZUFBZTtBQUNsQixZQUFNLFlBQVksY0FBYyxDQUFDO0FBQ2pDLGFBQU8sTUFBTSxTQUFTLElBQUksU0FBUztBQUFBLElBQ3BDO0FBR0EsVUFBTSxlQUFlLGNBQWMsTUFBTSw0QkFBNEI7QUFDckUsUUFBSSxjQUFjO0FBQ2pCLFlBQU0sVUFBVSxhQUFhLENBQUM7QUFDOUIsWUFBTSxZQUFZLGFBQWEsQ0FBQztBQUVoQyxhQUFPLE1BQU0sU0FBUyxJQUFJLFNBQVM7QUFBQSxJQUNwQztBQUdBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLE9BQU8sYUFBYSxVQUF3QztBQUUzRCxVQUFNLFlBQVksU0FBUyxNQUFNLCtCQUErQjtBQUNoRSxRQUFJLFdBQVc7QUFDZCxZQUFNLFlBQVksVUFBVSxDQUFDLEVBQUUsWUFBWTtBQUMzQyxVQUFJLGNBQWMsVUFBVSxjQUFjLFlBQVksY0FBYyxTQUFTO0FBQzVFLGVBQU87QUFBQSxNQUNSO0FBQUEsSUFDRDtBQUdBLFVBQU0sYUFBYSxTQUFTLE1BQU0sbUNBQW1DO0FBQ3JFLFFBQUksWUFBWTtBQUNmLFlBQU0sWUFBWSxXQUFXLENBQUMsRUFBRSxZQUFZO0FBQzVDLFVBQUksY0FBYyxVQUFVLGNBQWMsWUFBWSxjQUFjLFNBQVM7QUFDNUUsZUFBTztBQUFBLE1BQ1I7QUFBQSxJQUNEO0FBR0EsVUFBTSxhQUFhLFNBQVMsTUFBTSw0QkFBNEI7QUFDOUQsUUFBSSxZQUFZO0FBQ2YsWUFBTSxZQUFZLFdBQVcsQ0FBQyxFQUFFLFlBQVk7QUFDNUMsVUFBSSxjQUFjLFVBQVUsY0FBYyxZQUFZLGNBQWMsU0FBUztBQUM1RSxlQUFPO0FBQUEsTUFDUjtBQUFBLElBQ0Q7QUFHQSxVQUFNLGFBQWEsU0FBUyxNQUFNLGtDQUFrQztBQUNwRSxRQUFJLFlBQVk7QUFDZixhQUFPLFdBQVcsQ0FBQyxFQUFFLFlBQVk7QUFBQSxJQUNsQztBQUVBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxPQUFPLE9BQU8sV0FBbUIsVUFBa0IsSUFBSSxZQUEyQixVQUFrQjtBQUNuRyxVQUFNLFdBQTBDO0FBQUEsTUFDL0MsUUFBUTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsU0FBUztBQUFBLElBQ1Y7QUFFQSxXQUFPLGFBQWEsZUFBZSxTQUFTLENBQUMsVUFBVSxlQUFlLE9BQU8sQ0FBQyxZQUFZLFNBQVMsU0FBUyxDQUFDO0FBQUEsRUFDOUc7QUFDRDs7O0FDckhBLElBQUFDLG1CQUFvRDtBQVc3QyxJQUFNLHlCQUFOLE1BQTZCO0FBQUEsRUFHbkMsWUFBWSxRQUE0QjtBQUN2QyxTQUFLLFNBQVM7QUFBQSxFQUNmO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxXQUFXO0FBQ1YsU0FBSyxPQUFPLDhCQUE4QixDQUFDLFNBQVMsWUFBWTtBQUMvRCxXQUFLLGlCQUFpQixPQUFPO0FBQUEsSUFDOUIsQ0FBQztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtRLGlCQUFpQixTQUFzQjtBQUU5QyxVQUFNLFNBQVMsU0FBUztBQUFBLE1BQ3ZCO0FBQUEsTUFDQSxXQUFXO0FBQUEsTUFDWDtBQUFBLElBQ0Q7QUFFQSxVQUFNLGlCQUF3RCxDQUFDO0FBQy9ELFFBQUk7QUFFSixXQUFPLE9BQU8sT0FBTyxTQUFTLEdBQVc7QUFDeEMsWUFBTSxPQUFPLEtBQUssZUFBZTtBQUNqQyxZQUFNLGdCQUFnQixLQUFLO0FBQzNCLFVBQUksQ0FBQyxjQUFlO0FBRXBCLFVBQUksS0FBSyxTQUFTLEtBQUssTUFBTSxLQUFLLFNBQVMsUUFBUSxLQUFLLEtBQUssU0FBUyxNQUFNLEtBQUssS0FBSyxTQUFTLE9BQU8sSUFBSTtBQUN6Ryx1QkFBZSxLQUFLLEVBQUUsTUFBTSxRQUFRLGNBQWMsQ0FBQztBQUFBLE1BQ3BELFdBQVcsS0FBSyxTQUFTLFNBQVMsS0FBSyxLQUFLLFNBQVMsT0FBTyxLQUFLLEtBQUssU0FBUyxRQUFRLEdBQUc7QUFFekYsdUJBQWUsS0FBSyxFQUFFLE1BQU0sUUFBUSxjQUFjLENBQUM7QUFBQSxNQUNwRDtBQUFBLElBQ0Q7QUFHQSxlQUFXLEVBQUUsTUFBQUMsT0FBTSxPQUFPLEtBQUssZ0JBQWdCO0FBQzlDLFdBQUssWUFBWUEsT0FBTSxNQUFNO0FBQUEsSUFDOUI7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUSxZQUFZLE1BQVksUUFBcUI7QUFDcEQsVUFBTSxPQUFPLEtBQUssZUFBZTtBQUNqQyxRQUFJLFlBQVk7QUFDaEIsVUFBTSxXQUFXLFNBQVMsdUJBQXVCO0FBR2pELFVBQU0sZUFBZTtBQUNyQixRQUFJO0FBRUosWUFBUSxRQUFRLGFBQWEsS0FBSyxJQUFJLE9BQU8sTUFBTTtBQUVsRCxVQUFJLE1BQU0sUUFBUSxXQUFXO0FBQzVCLGlCQUFTLFlBQVksU0FBUyxlQUFlLEtBQUssVUFBVSxXQUFXLE1BQU0sS0FBSyxDQUFDLENBQUM7QUFBQSxNQUNyRjtBQUVBLFlBQU0sWUFBWSxNQUFNLENBQUMsRUFBRSxLQUFLO0FBQ2hDLFlBQU0sWUFBWSxNQUFNLENBQUMsRUFBRSxZQUFZO0FBR3ZDLFlBQU0saUJBQWlCLFNBQVMsY0FBYyxLQUFLO0FBQ25ELHFCQUFlLFlBQVksYUFBYSxTQUFTO0FBQ2pELHFCQUFlLE1BQU0sWUFBWTtBQUNqQyxxQkFBZSxNQUFNLFNBQVM7QUFHOUIsV0FBSyxnQkFBZ0IsTUFBTSxTQUFTLE1BQU0sY0FBYztBQUV4RCxlQUFTLFlBQVksY0FBYztBQUNuQyxrQkFBWSxNQUFNLFFBQVEsTUFBTSxDQUFDLEVBQUU7QUFBQSxJQUNwQztBQUdBLFFBQUksY0FBYyxHQUFHO0FBRXBCLFlBQU0sYUFBYTtBQUNuQixrQkFBWTtBQUVaLGNBQVEsUUFBUSxXQUFXLEtBQUssSUFBSSxPQUFPLE1BQU07QUFFaEQsWUFBSSxNQUFNLFFBQVEsV0FBVztBQUM1QixtQkFBUyxZQUFZLFNBQVMsZUFBZSxLQUFLLFVBQVUsV0FBVyxNQUFNLEtBQUssQ0FBQyxDQUFDO0FBQUEsUUFDckY7QUFFQSxjQUFNLFlBQVksTUFBTSxDQUFDLEVBQUUsWUFBWTtBQUN2QyxjQUFNLFVBQVUsTUFBTSxDQUFDLEVBQUUsS0FBSztBQUc5QixjQUFNLGlCQUFpQixTQUFTLGNBQWMsS0FBSztBQUNuRCx1QkFBZSxZQUFZLGFBQWEsU0FBUztBQUNqRCx1QkFBZSxNQUFNLFlBQVk7QUFDakMsdUJBQWUsTUFBTSxTQUFTO0FBRzlCLGFBQUssZ0JBQWdCLFNBQVMsY0FBYztBQUU1QyxpQkFBUyxZQUFZLGNBQWM7QUFDbkMsb0JBQVksTUFBTSxRQUFRLE1BQU0sQ0FBQyxFQUFFO0FBQUEsTUFDcEM7QUFBQSxJQUNEO0FBR0EsUUFBSSxjQUFjLEtBQUssU0FBUyxXQUFXLFdBQVcsR0FBRztBQUN4RDtBQUFBLElBQ0Q7QUFHQSxRQUFJLFlBQVksS0FBSyxRQUFRO0FBQzVCLGVBQVMsWUFBWSxTQUFTLGVBQWUsS0FBSyxVQUFVLFNBQVMsQ0FBQyxDQUFDO0FBQUEsSUFDeEU7QUFHQSxRQUFJLFVBQVUsU0FBUyxXQUFXLFNBQVMsR0FBRztBQUM3QyxhQUFPLGFBQWEsVUFBVSxJQUFJO0FBQUEsSUFDbkM7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUSxnQkFBZ0IsU0FBaUIsV0FBd0I7QUFFaEUsVUFBTSxnQkFBZ0I7QUFDdEIsVUFBTSxxQkFBcUI7QUFFM0IsUUFBSTtBQUNKLFVBQU0sU0FBeUMsQ0FBQztBQUdoRCxZQUFRLFFBQVEsY0FBYyxLQUFLLE9BQU8sT0FBTyxNQUFNO0FBQ3RELFlBQU0sV0FBVyxNQUFNLENBQUM7QUFDeEIsYUFBTyxLQUFLLEVBQUUsS0FBSyxVQUFVLEtBQUssU0FBUyxDQUFDO0FBQUEsSUFDN0M7QUFHQSxZQUFRLFFBQVEsbUJBQW1CLEtBQUssT0FBTyxPQUFPLE1BQU07QUFDM0QsYUFBTyxLQUFLLEVBQUUsS0FBSyxNQUFNLENBQUMsR0FBRyxLQUFLLE1BQU0sQ0FBQyxFQUFFLENBQUM7QUFBQSxJQUM3QztBQUdBLGVBQVcsT0FBTyxRQUFRO0FBQ3pCLFVBQUksQ0FBQyxVQUFVLElBQUksR0FBRyxFQUFHO0FBRXpCLFlBQU0sUUFBUSxTQUFTLGNBQWMsS0FBSztBQUMxQyxZQUFNLE1BQU0sSUFBSTtBQUVoQixVQUFJLENBQUMsSUFBSSxJQUFJLFdBQVcsTUFBTSxHQUFHO0FBQ2hDLGNBQU0sZ0JBQWdCLG1CQUFtQixJQUFJLEdBQUc7QUFDaEQsWUFBSSxDQUFDLFdBQVcsYUFBYSxFQUFHO0FBQ2hDLGNBQU0sT0FBTyxLQUFLLE9BQU8sSUFBSSxNQUFNLHNCQUFzQixhQUFhO0FBQ3RFLFlBQUksUUFBUSxnQkFBZ0Isd0JBQU87QUFDbEMsZ0JBQU0sTUFBTSxLQUFLLE9BQU8sSUFBSSxNQUFNLGdCQUFnQixJQUFJO0FBQUEsUUFDdkQsT0FBTztBQUNOLGdCQUFNLGtCQUFrQixLQUFLLGdCQUFnQixhQUFhO0FBQzFELGNBQUksaUJBQWlCO0FBQ3BCLGtCQUFNLE1BQU07QUFBQSxVQUNiLE9BQU87QUFDTjtBQUFBLFVBQ0Q7QUFBQSxRQUNEO0FBQUEsTUFDRCxPQUFPO0FBQ04sY0FBTSxNQUFNLElBQUk7QUFBQSxNQUNqQjtBQUVBLFlBQU0sTUFBTSxXQUFXO0FBQ3ZCLFlBQU0sTUFBTSxTQUFTO0FBQ3JCLGdCQUFVLFlBQVksS0FBSztBQUFBLElBQzVCO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1EsZ0JBQWdCLFVBQWlDO0FBQ3hELFVBQU0scUJBQXFCLG1CQUFtQixRQUFRO0FBQ3RELFVBQU0sUUFBUSxLQUFLLE9BQU8sSUFBSSxNQUFNLFNBQVM7QUFDN0MsZUFBVyxRQUFRLE9BQU87QUFDekIsVUFBSSxLQUFLLFNBQVMsc0JBQXNCLEtBQUssS0FBSyxTQUFTLGtCQUFrQixHQUFHO0FBQy9FLGVBQU8sS0FBSyxPQUFPLElBQUksTUFBTSxnQkFBZ0IsSUFBSTtBQUFBLE1BQ2xEO0FBQUEsSUFDRDtBQUNBLFdBQU87QUFBQSxFQUNSO0FBQ0Q7OztBQ2lFQSxJQUFNLEtBQW1CO0FBQUE7QUFBQSxFQUV4QixJQUFJO0FBQUEsRUFDSixRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixTQUFTO0FBQUEsRUFDVCxTQUFTO0FBQUEsRUFDVCxTQUFTO0FBQUEsRUFDVCxPQUFPO0FBQUE7QUFBQSxFQUdQLGNBQWM7QUFBQSxFQUNkLG1CQUFtQjtBQUFBLEVBQ25CLGlCQUFpQjtBQUFBO0FBQUEsRUFHakIsaUJBQWlCO0FBQUEsRUFDakIsY0FBYztBQUFBLEVBQ2QsdUJBQXVCO0FBQUEsRUFDdkIsbUJBQW1CO0FBQUEsRUFDbkIsZUFBZTtBQUFBO0FBQUEsRUFHZixtQkFBbUI7QUFBQSxFQUNuQixvQkFBb0I7QUFBQSxFQUNwQixlQUFlO0FBQUE7QUFBQSxFQUdmLFlBQVk7QUFBQSxFQUNaLGNBQWM7QUFBQSxFQUNkLFdBQVc7QUFBQSxFQUNYLGlCQUFpQjtBQUFBO0FBQUEsRUFHakIsYUFBYTtBQUFBLEVBQ2IsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsY0FBYztBQUFBLEVBQ2QsU0FBUztBQUFBO0FBQUEsRUFHVCxXQUFXO0FBQUEsRUFDWCxhQUFhO0FBQUEsRUFDYixrQkFBa0I7QUFBQSxFQUNsQixXQUFXO0FBQUE7QUFBQSxFQUdYLG9CQUFvQjtBQUFBLEVBQ3BCLGNBQWM7QUFBQSxFQUNkLGNBQWM7QUFBQTtBQUFBLEVBR2QscUJBQXFCO0FBQUEsRUFDckIscUJBQXFCO0FBQUEsRUFDckIsc0JBQXNCO0FBQUE7QUFBQSxFQUd0QixnQkFBZ0I7QUFBQSxFQUNoQixhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixlQUFlO0FBQUEsRUFDZixtQkFBbUI7QUFBQSxFQUNuQixnQkFBZ0I7QUFBQSxFQUNoQixpQkFBaUI7QUFBQSxFQUNqQixnQkFBZ0I7QUFBQSxFQUNoQixlQUFlO0FBQUEsRUFDZixZQUFZO0FBQUEsRUFDWixZQUFZO0FBQUEsRUFDWixZQUFZO0FBQUEsRUFDWixZQUFZO0FBQUEsRUFDWixXQUFXO0FBQUEsRUFDWCxlQUFlO0FBQUEsRUFDZixTQUFTO0FBQUEsRUFDVCxVQUFVO0FBQUEsRUFDVixlQUFlO0FBQUEsRUFDZixtQkFBbUI7QUFBQSxFQUNuQixhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixrQkFBa0I7QUFBQSxFQUNsQixlQUFlO0FBQUEsRUFDZixXQUFXO0FBQUEsRUFDWCxhQUFhO0FBQUEsRUFDYixZQUFZO0FBQUEsRUFDWixvQkFBb0I7QUFBQSxFQUNwQixnQkFBZ0I7QUFBQSxFQUNoQixvQkFBb0I7QUFBQSxFQUNwQixpQkFBaUI7QUFBQSxFQUNqQixxQkFBcUI7QUFBQSxFQUNyQixrQkFBa0I7QUFBQSxFQUNsQixzQkFBc0I7QUFBQSxFQUN0QixxQkFBcUI7QUFBQSxFQUNyQixhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixZQUFZO0FBQUEsRUFDWixvQkFBb0I7QUFBQSxFQUNwQix3QkFBd0I7QUFBQSxFQUN4QixvQkFBb0I7QUFBQSxFQUNwQix3QkFBd0I7QUFBQSxFQUN4QixvQkFBb0I7QUFBQSxFQUNwQix3QkFBd0I7QUFBQSxFQUN4QixrQkFBa0I7QUFBQSxFQUNsQixzQkFBc0I7QUFBQSxFQUN0QixjQUFjO0FBQUEsRUFDZCxtQkFBbUI7QUFBQSxFQUNuQixjQUFjO0FBQUEsRUFDZCxnQkFBZ0I7QUFBQSxFQUNoQixVQUFVO0FBQUEsRUFDVixjQUFjO0FBQUEsRUFDYixvQkFBb0I7QUFBQSxFQUNwQix3QkFBd0I7QUFBQSxFQUN4QixtQkFBbUI7QUFBQSxFQUNuQix1QkFBdUI7QUFBQSxFQUN2QixrQkFBa0I7QUFBQSxFQUNsQixxQkFBcUI7QUFBQSxFQUNyQixtQkFBbUI7QUFBQSxFQUNuQix1QkFBdUI7QUFBQSxFQUN2QixpQkFBaUI7QUFBQSxFQUNqQixxQkFBcUI7QUFBQSxFQUNyQiw0QkFBNEI7QUFBQSxFQUM1QiwyQkFBMkI7QUFBQSxFQUMzQix3QkFBd0I7QUFBQSxFQUN4QixtQkFBbUI7QUFBQSxFQUNuQixlQUFlO0FBQUEsRUFDZixxQkFBcUI7QUFBQSxFQUN0QiwwQkFBMEI7QUFBQSxFQUMxQixtQkFBbUI7QUFBQSxFQUNuQixVQUFVO0FBQUEsRUFDVixjQUFjO0FBQUEsRUFDZCxnQkFBZ0I7QUFBQSxFQUNoQixxQkFBcUI7QUFBQSxFQUNyQixvQkFBb0I7QUFBQSxFQUNwQixjQUFjO0FBQUEsRUFDZCxnQkFBZ0I7QUFBQSxFQUNoQixlQUFlO0FBQUE7QUFBQSxFQUdmLG1CQUFtQjtBQUFBLEVBQ25CLGtCQUFrQjtBQUFBLEVBQ2xCLGNBQWM7QUFBQSxFQUNkLFdBQVc7QUFBQSxFQUNYLHFCQUFxQjtBQUFBLEVBQ3JCLFNBQVM7QUFBQSxFQUNULFlBQVk7QUFBQSxFQUNaLG1CQUFtQjtBQUFBLEVBQ25CLGdCQUFnQjtBQUFBLEVBQ2hCLGlCQUFpQjtBQUFBLEVBQ2pCLHdCQUF3QjtBQUFBLEVBQ3hCLGFBQWE7QUFBQSxFQUNiLG1CQUFtQjtBQUFBLEVBQ25CLG1CQUFtQjtBQUFBLEVBQ25CLGFBQWE7QUFBQSxFQUNiLGdCQUFnQjtBQUFBLEVBQ2hCLGVBQWU7QUFBQSxFQUNmLGtCQUFrQjtBQUFBLEVBQ2xCLGNBQWM7QUFBQSxFQUNkLGdCQUFnQjtBQUFBLEVBQ2hCLG9CQUFvQjtBQUFBO0FBQUEsRUFHcEIsc0JBQXNCO0FBQUEsRUFDdEIsZ0JBQWdCO0FBQUEsRUFDaEIsV0FBVztBQUFBLEVBQ1gsa0JBQWtCO0FBQUEsRUFDbEIsaUJBQWlCO0FBQUEsRUFDakIsZ0JBQWdCO0FBQUEsRUFDaEIscUJBQXFCO0FBQUEsRUFDckIsY0FBYztBQUFBLEVBQ2QsaUJBQWlCO0FBQUE7QUFBQSxFQUdqQixpQkFBaUI7QUFBQSxFQUNqQixVQUFVO0FBQUEsRUFDVixVQUFVO0FBQUEsRUFDVixVQUFVO0FBQUEsRUFDVixhQUFhO0FBQUEsRUFDYixXQUFXO0FBQUEsRUFDWCxhQUFhO0FBQUEsRUFDYix1QkFBdUI7QUFBQSxFQUN2QixjQUFjO0FBQUEsRUFDZCxtQkFBbUI7QUFBQSxFQUNuQixpQkFBaUI7QUFBQTtBQUFBLEVBR2pCLHFCQUFxQjtBQUFBLEVBQ3JCLGlDQUFpQztBQUFBLEVBQ2pDLGFBQWE7QUFBQSxFQUNiLGFBQWE7QUFBQSxFQUNiLGFBQWE7QUFBQSxFQUNiLFlBQVk7QUFBQSxFQUNaLFlBQVk7QUFBQSxFQUNaLGdCQUFnQjtBQUFBO0FBQUEsRUFHaEIsZ0JBQWdCO0FBQUEsRUFDaEIsa0JBQWtCO0FBQUEsRUFDbEIsaUJBQWlCO0FBQUEsRUFDakIsa0JBQWtCO0FBQUEsRUFDbEIsYUFBYTtBQUFBLEVBQ2Isa0JBQWtCO0FBQUEsRUFDbEIsb0JBQW9CO0FBQUEsRUFDcEIsbUJBQW1CO0FBQUE7QUFBQSxFQUduQixnQkFBZ0I7QUFBQSxFQUNoQixvQkFBb0I7QUFBQSxFQUNwQixlQUFlO0FBQUEsRUFDZixjQUFjO0FBQUEsRUFDZCxhQUFhO0FBQUEsRUFDYixjQUFjO0FBQUE7QUFBQSxFQUdkLGlCQUFpQjtBQUFBLEVBQ2pCLDJCQUEyQjtBQUFBLEVBQzNCLGlCQUFpQjtBQUFBLEVBQ2pCLG1CQUFtQjtBQUFBLEVBQ25CLHFCQUFxQjtBQUFBLEVBQ3JCLG9CQUFvQjtBQUFBLEVBQ3BCLHFCQUFxQjtBQUFBLEVBQ3JCLDBCQUEwQjtBQUFBLEVBQzFCLHdCQUF3QjtBQUFBO0FBQUEsRUFHeEIsc0JBQXNCO0FBQUEsRUFDdEIsNkJBQTZCO0FBQUEsRUFDN0IsaUJBQWlCO0FBQUEsRUFDakIsWUFBWTtBQUFBO0FBQUEsRUFHWixvQkFBb0I7QUFBQSxFQUNwQix3QkFBd0I7QUFBQSxFQUN4QixtQkFBbUI7QUFBQSxFQUNuQixXQUFXO0FBQUEsRUFDWCxjQUFjO0FBQUEsRUFDZCxxQkFBcUI7QUFBQSxFQUNyQixzQkFBc0I7QUFBQSxFQUN0QixnQkFBZ0I7QUFBQSxFQUNoQixPQUFPO0FBQUEsRUFDUCxhQUFhO0FBQUEsRUFDYixZQUFZO0FBQUEsRUFDWix5QkFBeUI7QUFBQSxFQUN6QixpQkFBaUI7QUFBQSxFQUNqQix1QkFBdUI7QUFBQSxFQUN2QixrQkFBa0I7QUFBQSxFQUNsQixrQkFBa0I7QUFBQSxFQUNsQixjQUFjO0FBQUEsRUFDZCxlQUFlO0FBQUEsRUFDZixjQUFjO0FBQUEsRUFDZCxhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixxQkFBcUI7QUFBQSxFQUNyQix1QkFBdUI7QUFBQSxFQUN2QixVQUFVO0FBQUEsRUFDVixjQUFjO0FBQUEsRUFDZCxpQkFBaUI7QUFBQSxFQUNqQixtQkFBbUI7QUFBQSxFQUNuQixpQkFBaUI7QUFBQSxFQUNqQixrQkFBa0I7QUFBQSxFQUNsQixnQkFBZ0I7QUFBQSxFQUNoQix1QkFBdUI7QUFBQSxFQUN2QixZQUFZO0FBQUEsRUFDWixrQkFBa0I7QUFDbkI7QUFFQSxJQUFNLEtBQW1CO0FBQUE7QUFBQSxFQUV4QixJQUFJO0FBQUEsRUFDSixRQUFRO0FBQUEsRUFDUixRQUFRO0FBQUEsRUFDUixTQUFTO0FBQUEsRUFDVCxTQUFTO0FBQUEsRUFDVCxTQUFTO0FBQUEsRUFDVCxPQUFPO0FBQUE7QUFBQSxFQUdQLGNBQWM7QUFBQSxFQUNkLG1CQUFtQjtBQUFBLEVBQ25CLGlCQUFpQjtBQUFBO0FBQUEsRUFHakIsaUJBQWlCO0FBQUEsRUFDakIsY0FBYztBQUFBLEVBQ2QsdUJBQXVCO0FBQUEsRUFDdkIsbUJBQW1CO0FBQUEsRUFDbkIsZUFBZTtBQUFBO0FBQUEsRUFHZixtQkFBbUI7QUFBQSxFQUNuQixvQkFBb0I7QUFBQSxFQUNwQixlQUFlO0FBQUE7QUFBQSxFQUdmLFlBQVk7QUFBQSxFQUNaLGNBQWM7QUFBQSxFQUNkLFdBQVc7QUFBQSxFQUNYLGlCQUFpQjtBQUFBO0FBQUEsRUFHakIsYUFBYTtBQUFBLEVBQ2IsVUFBVTtBQUFBLEVBQ1YsVUFBVTtBQUFBLEVBQ1YsY0FBYztBQUFBLEVBQ2QsU0FBUztBQUFBO0FBQUEsRUFHVCxXQUFXO0FBQUEsRUFDWCxhQUFhO0FBQUEsRUFDYixrQkFBa0I7QUFBQSxFQUNsQixXQUFXO0FBQUE7QUFBQSxFQUdYLG9CQUFvQjtBQUFBLEVBQ3BCLGNBQWM7QUFBQSxFQUNkLGNBQWM7QUFBQTtBQUFBLEVBR2QscUJBQXFCO0FBQUEsRUFDckIscUJBQXFCO0FBQUEsRUFDckIsc0JBQXNCO0FBQUE7QUFBQSxFQUd0QixnQkFBZ0I7QUFBQSxFQUNoQixhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixlQUFlO0FBQUEsRUFDZixtQkFBbUI7QUFBQSxFQUNuQixnQkFBZ0I7QUFBQSxFQUNoQixpQkFBaUI7QUFBQSxFQUNqQixnQkFBZ0I7QUFBQSxFQUNoQixlQUFlO0FBQUEsRUFDZixZQUFZO0FBQUEsRUFDWixXQUFXO0FBQUEsRUFDWCxlQUFlO0FBQUEsRUFDZixZQUFZO0FBQUEsRUFDWixZQUFZO0FBQUEsRUFDWixZQUFZO0FBQUEsRUFDWixTQUFTO0FBQUEsRUFDVCxVQUFVO0FBQUEsRUFDVixlQUFlO0FBQUEsRUFDZixtQkFBbUI7QUFBQSxFQUNuQixhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixrQkFBa0I7QUFBQSxFQUNsQixlQUFlO0FBQUEsRUFDZixXQUFXO0FBQUEsRUFDWCxhQUFhO0FBQUEsRUFDYixZQUFZO0FBQUEsRUFDWixvQkFBb0I7QUFBQSxFQUNwQixnQkFBZ0I7QUFBQSxFQUNoQixvQkFBb0I7QUFBQSxFQUNwQixpQkFBaUI7QUFBQSxFQUNqQixxQkFBcUI7QUFBQSxFQUNyQixrQkFBa0I7QUFBQSxFQUNsQixzQkFBc0I7QUFBQSxFQUN0QixxQkFBcUI7QUFBQSxFQUNyQixhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixZQUFZO0FBQUEsRUFDWixvQkFBb0I7QUFBQSxFQUNwQix3QkFBd0I7QUFBQSxFQUN4QixvQkFBb0I7QUFBQSxFQUNwQix3QkFBd0I7QUFBQSxFQUN4QixvQkFBb0I7QUFBQSxFQUNwQix3QkFBd0I7QUFBQSxFQUN4QixrQkFBa0I7QUFBQSxFQUNsQixzQkFBc0I7QUFBQSxFQUN0QixjQUFjO0FBQUEsRUFDZCxtQkFBbUI7QUFBQSxFQUNuQixjQUFjO0FBQUEsRUFDZCxnQkFBZ0I7QUFBQSxFQUNoQixVQUFVO0FBQUEsRUFDVixjQUFjO0FBQUEsRUFDYixvQkFBb0I7QUFBQSxFQUNwQix3QkFBd0I7QUFBQSxFQUN4QixtQkFBbUI7QUFBQSxFQUNuQix1QkFBdUI7QUFBQSxFQUN2QixrQkFBa0I7QUFBQSxFQUNsQixxQkFBcUI7QUFBQSxFQUNyQixtQkFBbUI7QUFBQSxFQUNuQix1QkFBdUI7QUFBQSxFQUN2QixpQkFBaUI7QUFBQSxFQUNqQixxQkFBcUI7QUFBQSxFQUNyQiw0QkFBNEI7QUFBQSxFQUM1QiwyQkFBMkI7QUFBQSxFQUMzQix3QkFBd0I7QUFBQSxFQUN4QixtQkFBbUI7QUFBQSxFQUNuQixlQUFlO0FBQUEsRUFDZixxQkFBcUI7QUFBQSxFQUN0QiwwQkFBMEI7QUFBQSxFQUMxQixtQkFBbUI7QUFBQSxFQUNuQixVQUFVO0FBQUEsRUFDVixjQUFjO0FBQUEsRUFDZCxnQkFBZ0I7QUFBQSxFQUNoQixxQkFBcUI7QUFBQSxFQUNyQixvQkFBb0I7QUFBQSxFQUNwQixjQUFjO0FBQUEsRUFDZCxnQkFBZ0I7QUFBQSxFQUNoQixlQUFlO0FBQUE7QUFBQSxFQUdmLG1CQUFtQjtBQUFBLEVBQ25CLGtCQUFrQjtBQUFBLEVBQ2xCLGNBQWM7QUFBQSxFQUNkLFdBQVc7QUFBQSxFQUNYLHFCQUFxQjtBQUFBLEVBQ3JCLFNBQVM7QUFBQSxFQUNULFlBQVk7QUFBQSxFQUNaLG1CQUFtQjtBQUFBLEVBQ25CLGdCQUFnQjtBQUFBLEVBQ2hCLGlCQUFpQjtBQUFBLEVBQ2pCLHdCQUF3QjtBQUFBLEVBQ3hCLGFBQWE7QUFBQSxFQUNiLG1CQUFtQjtBQUFBLEVBQ25CLG1CQUFtQjtBQUFBLEVBQ25CLGFBQWE7QUFBQSxFQUNiLGdCQUFnQjtBQUFBLEVBQ2hCLGVBQWU7QUFBQSxFQUNmLGtCQUFrQjtBQUFBLEVBQ2xCLGNBQWM7QUFBQSxFQUNkLGdCQUFnQjtBQUFBLEVBQ2hCLG9CQUFvQjtBQUFBO0FBQUEsRUFHcEIsc0JBQXNCO0FBQUEsRUFDdEIsZ0JBQWdCO0FBQUEsRUFDaEIsV0FBVztBQUFBLEVBQ1gsa0JBQWtCO0FBQUEsRUFDbEIsaUJBQWlCO0FBQUEsRUFDakIsZ0JBQWdCO0FBQUEsRUFDaEIscUJBQXFCO0FBQUEsRUFDckIsY0FBYztBQUFBLEVBQ2QsaUJBQWlCO0FBQUE7QUFBQSxFQUdqQixpQkFBaUI7QUFBQSxFQUNqQixVQUFVO0FBQUEsRUFDVixVQUFVO0FBQUEsRUFDVixVQUFVO0FBQUEsRUFDVixhQUFhO0FBQUEsRUFDYixXQUFXO0FBQUEsRUFDWCxhQUFhO0FBQUEsRUFDYix1QkFBdUI7QUFBQSxFQUN2QixjQUFjO0FBQUEsRUFDZCxtQkFBbUI7QUFBQSxFQUNuQixpQkFBaUI7QUFBQTtBQUFBLEVBR2pCLHFCQUFxQjtBQUFBLEVBQ3JCLGlDQUFpQztBQUFBLEVBQ2pDLGFBQWE7QUFBQSxFQUNiLGFBQWE7QUFBQSxFQUNiLGFBQWE7QUFBQSxFQUNiLFlBQVk7QUFBQSxFQUNaLFlBQVk7QUFBQSxFQUNaLGdCQUFnQjtBQUFBO0FBQUEsRUFHaEIsZ0JBQWdCO0FBQUEsRUFDaEIsa0JBQWtCO0FBQUEsRUFDbEIsaUJBQWlCO0FBQUEsRUFDakIsa0JBQWtCO0FBQUEsRUFDbEIsYUFBYTtBQUFBLEVBQ2Isa0JBQWtCO0FBQUEsRUFDbEIsb0JBQW9CO0FBQUEsRUFDcEIsbUJBQW1CO0FBQUE7QUFBQSxFQUduQixnQkFBZ0I7QUFBQSxFQUNoQixvQkFBb0I7QUFBQSxFQUNwQixlQUFlO0FBQUEsRUFDZixjQUFjO0FBQUEsRUFDZCxhQUFhO0FBQUEsRUFDYixjQUFjO0FBQUE7QUFBQSxFQUdkLGlCQUFpQjtBQUFBLEVBQ2pCLDJCQUEyQjtBQUFBLEVBQzNCLGlCQUFpQjtBQUFBLEVBQ2pCLG1CQUFtQjtBQUFBLEVBQ25CLHFCQUFxQjtBQUFBLEVBQ3JCLG9CQUFvQjtBQUFBLEVBQ3BCLHFCQUFxQjtBQUFBLEVBQ3JCLDBCQUEwQjtBQUFBLEVBQzFCLHdCQUF3QjtBQUFBO0FBQUEsRUFHeEIsc0JBQXNCO0FBQUEsRUFDdEIsNkJBQTZCO0FBQUEsRUFDN0IsaUJBQWlCO0FBQUEsRUFDakIsWUFBWTtBQUFBO0FBQUEsRUFHWixvQkFBb0I7QUFBQSxFQUNwQix3QkFBd0I7QUFBQSxFQUN4QixtQkFBbUI7QUFBQSxFQUNuQixXQUFXO0FBQUEsRUFDWCxjQUFjO0FBQUEsRUFDZCxxQkFBcUI7QUFBQSxFQUNyQixzQkFBc0I7QUFBQSxFQUN0QixnQkFBZ0I7QUFBQSxFQUNoQixPQUFPO0FBQUEsRUFDUCxhQUFhO0FBQUEsRUFDYixZQUFZO0FBQUEsRUFDWix5QkFBeUI7QUFBQSxFQUN6QixpQkFBaUI7QUFBQSxFQUNqQix1QkFBdUI7QUFBQSxFQUN2QixrQkFBa0I7QUFBQSxFQUNsQixrQkFBa0I7QUFBQSxFQUNsQixjQUFjO0FBQUEsRUFDZCxlQUFlO0FBQUEsRUFDZixjQUFjO0FBQUEsRUFDZCxhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixxQkFBcUI7QUFBQSxFQUNyQix1QkFBdUI7QUFBQSxFQUN2QixVQUFVO0FBQUEsRUFDVixjQUFjO0FBQUEsRUFDZCxpQkFBaUI7QUFBQSxFQUNqQixtQkFBbUI7QUFBQSxFQUNuQixpQkFBaUI7QUFBQSxFQUNqQixrQkFBa0I7QUFBQSxFQUNsQixnQkFBZ0I7QUFBQSxFQUNoQix1QkFBdUI7QUFBQSxFQUN2QixZQUFZO0FBQUEsRUFDWixrQkFBa0I7QUFDbkI7QUFFQSxJQUFNLGVBQStDLEVBQUUsSUFBSSxHQUFHO0FBS3ZELFNBQVMsRUFBRSxNQUFnQixLQUF5QixRQUFrRDtBQUM1RyxNQUFJLFFBQVEsYUFBYSxJQUFJLEtBQUssYUFBYSxJQUFJLEdBQUcsR0FBRyxLQUFLLGFBQWEsSUFBSSxFQUFFLEdBQUcsS0FBSztBQUV6RixNQUFJLFFBQVE7QUFDWCxXQUFPLFFBQVEsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNO0FBQzFDLGFBQU8sS0FBSyxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsS0FBSyxPQUFPLENBQUMsQ0FBQztBQUFBLElBQzNDLENBQUM7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUNSO0FBS08sU0FBUyxvQkFBOEI7QUFFN0MsUUFBTSxjQUFjLE9BQU8sY0FBYyxjQUFjLFVBQVUsV0FBVztBQUM1RSxRQUFNLE9BQU8sY0FBYyxZQUFZLFlBQVksSUFBSTtBQUN2RCxNQUFJLEtBQUssV0FBVyxJQUFJLEVBQUcsUUFBTztBQUNsQyxTQUFPO0FBQ1I7OztBQ2p6QkEsSUFBQUMsb0JBQW9EO0FBZTdDLElBQU0saUJBQU4sTUFBcUI7QUFBQSxFQVMzQixZQUFZLE9BQWMsaUJBQXdDLE1BQU07QUFSeEUsU0FBUSxRQUFnQyxvQkFBSSxJQUFJO0FBR2hELFNBQVEsWUFBOEIsQ0FBQztBQUN2QyxTQUFRLG9CQUFpQyxvQkFBSSxJQUFJO0FBQ2pELFNBQVEsY0FBc0I7QUFDOUIsU0FBUSxjQUFjO0FBR3JCLFNBQUssUUFBUTtBQUNiLFNBQUssaUJBQWlCO0FBQUEsRUFDdkI7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLHFCQUFxQixZQUE0QjtBQUNoRCxTQUFLLG9CQUFvQixJQUFJLElBQUksV0FBVyxJQUFJLE9BQUssRUFBRSxZQUFZLENBQUMsQ0FBQztBQUFBLEVBQ3RFO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxlQUFlLE1BQW9CO0FBQ2xDLFNBQUssY0FBYztBQUFBLEVBQ3BCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUSxnQkFBZ0IsVUFBMkI7QUFDbEQsUUFBSSxDQUFDLEtBQUssWUFBYSxRQUFPO0FBQzlCLFdBQU8sU0FBUyxXQUFXLEtBQUssY0FBYyxHQUFHLEtBQUssYUFBYSxLQUFLO0FBQUEsRUFDekU7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtRLFlBQVksTUFBOEI7QUFDakQsUUFBSSxFQUFFLGdCQUFnQix5QkFBUSxRQUFPO0FBQ3JDLFFBQUksS0FBSyxnQkFBZ0IsS0FBSyxJQUFJLEVBQUcsUUFBTztBQUU1QyxVQUFNLE1BQU0sTUFBTSxLQUFLLFVBQVUsWUFBWTtBQUM3QyxRQUFJLEtBQUssa0JBQWtCLE9BQU8sR0FBRztBQUNwQyxhQUFPLEtBQUssa0JBQWtCLElBQUksR0FBRztBQUFBLElBQ3RDO0FBQ0EsV0FBTyxZQUFZLEtBQUssSUFBSTtBQUFBLEVBQzdCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUSxRQUFRLE1BQXdCO0FBQ3ZDLFdBQU87QUFBQSxNQUNOLE1BQU0sS0FBSztBQUFBLE1BQ1gsTUFBTSxLQUFLO0FBQUEsTUFDWCxNQUFNLEtBQUssS0FBSztBQUFBLE1BQ2hCLE9BQU8sS0FBSyxLQUFLO0FBQUEsTUFDakIsV0FBVyxLQUFLLFVBQVUsWUFBWTtBQUFBLElBQ3ZDO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBTSxXQUEwQjtBQUMvQixTQUFLLE1BQU0sTUFBTTtBQUVqQixVQUFNLFdBQVcsS0FBSyxNQUFNLFNBQVM7QUFDckMsZUFBVyxRQUFRLFVBQVU7QUFDNUIsVUFBSSxLQUFLLFlBQVksSUFBSSxHQUFHO0FBQzNCLGFBQUssTUFBTSxJQUFJLEtBQUssTUFBTSxLQUFLLFFBQVEsSUFBSSxDQUFDO0FBQUEsTUFDN0M7QUFBQSxJQUNEO0FBRUEsU0FBSyxjQUFjO0FBQUEsRUFDcEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGNBQWMsTUFBMkI7QUFDeEMsUUFBSSxDQUFDLEtBQUssWUFBWSxJQUFJLEVBQUc7QUFDN0IsVUFBTSxRQUFRLEtBQUssUUFBUSxJQUFhO0FBQ3hDLFNBQUssTUFBTSxJQUFJLE1BQU0sTUFBTSxLQUFLO0FBQ2hDLFNBQUssZ0JBQWdCLFVBQVUsS0FBSztBQUFBLEVBQ3JDO0FBQUEsRUFFQSxlQUFlLE1BQTJCO0FBQ3pDLFFBQUksQ0FBQyxLQUFLLFlBQVksSUFBSSxFQUFHO0FBQzdCLFVBQU0sUUFBUSxLQUFLLFFBQVEsSUFBYTtBQUN4QyxTQUFLLE1BQU0sSUFBSSxNQUFNLE1BQU0sS0FBSztBQUNoQyxTQUFLLGdCQUFnQixVQUFVLEtBQUs7QUFBQSxFQUNyQztBQUFBLEVBRUEsY0FBYyxNQUEyQjtBQUN4QyxVQUFNLE9BQU8sS0FBSztBQUNsQixVQUFNLFdBQVcsS0FBSyxNQUFNLElBQUksSUFBSTtBQUNwQyxRQUFJLENBQUMsU0FBVTtBQUVmLFNBQUssTUFBTSxPQUFPLElBQUk7QUFHdEIsUUFBSSxLQUFLLGdCQUFnQjtBQUN4QixXQUFLLEtBQUssZUFBZSxPQUFPLElBQUk7QUFBQSxJQUNyQztBQUVBLFNBQUssZ0JBQWdCLFVBQVUsUUFBUTtBQUFBLEVBQ3hDO0FBQUEsRUFFQSxjQUFjLE1BQXFCLFNBQXVCO0FBQ3pELFVBQU0sV0FBVyxLQUFLLE1BQU0sSUFBSSxPQUFPO0FBR3ZDLFFBQUksVUFBVTtBQUNiLFdBQUssTUFBTSxPQUFPLE9BQU87QUFBQSxJQUMxQjtBQUdBLFFBQUksS0FBSyxZQUFZLElBQUksR0FBRztBQUMzQixZQUFNLFdBQVcsS0FBSyxRQUFRLElBQWE7QUFDM0MsV0FBSyxNQUFNLElBQUksU0FBUyxNQUFNLFFBQVE7QUFHdEMsVUFBSSxLQUFLLGdCQUFnQjtBQUN4QixhQUFLLEtBQUssZUFBZSxPQUFPLFNBQVMsU0FBUyxJQUFJO0FBQUEsTUFDdkQ7QUFFQSxXQUFLLGdCQUFnQixVQUFVLFVBQVUsT0FBTztBQUFBLElBQ2pELFdBQVcsVUFBVTtBQUVwQixVQUFJLEtBQUssZ0JBQWdCO0FBQ3hCLGFBQUssS0FBSyxlQUFlLE9BQU8sT0FBTztBQUFBLE1BQ3hDO0FBQ0EsV0FBSyxnQkFBZ0IsVUFBVSxRQUFRO0FBQUEsSUFDeEM7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxXQUF3QjtBQUN2QixXQUFPLE1BQU0sS0FBSyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQUEsRUFDdEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLElBQUksT0FBZTtBQUNsQixXQUFPLEtBQUssTUFBTTtBQUFBLEVBQ25CO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxJQUFJLGdCQUF5QjtBQUM1QixXQUFPLEtBQUs7QUFBQSxFQUNiO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxTQUFTLE1BQXFDO0FBQzdDLFdBQU8sS0FBSyxNQUFNLElBQUksSUFBSTtBQUFBLEVBQzNCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxTQUFTLFVBQWdDO0FBQ3hDLFNBQUssVUFBVSxLQUFLLFFBQVE7QUFBQSxFQUM3QjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsVUFBVSxVQUFnQztBQUN6QyxVQUFNLE1BQU0sS0FBSyxVQUFVLFFBQVEsUUFBUTtBQUMzQyxRQUFJLE9BQU8sR0FBRztBQUNiLFdBQUssVUFBVSxPQUFPLEtBQUssQ0FBQztBQUFBLElBQzdCO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1EsZ0JBQWdCLE1BQWtCLE9BQWtCLFNBQXdCO0FBQ25GLGVBQVcsWUFBWSxLQUFLLFdBQVc7QUFDdEMsVUFBSTtBQUNILGlCQUFTLE1BQU0sT0FBTyxPQUFPO0FBQUEsTUFDOUIsU0FBUyxPQUFPO0FBQ2YsZ0JBQVEsTUFBTSxrQ0FBa0MsS0FBSztBQUFBLE1BQ3REO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLFFBQWM7QUFDYixTQUFLLE1BQU0sTUFBTTtBQUNqQixTQUFLLGNBQWM7QUFBQSxFQUNwQjtBQUNEOzs7QXJCaE5BLElBQXFCLHNCQUFyQixNQUFxQiw0QkFBMkIseUJBQU87QUFBQSxFQUF2RDtBQUFBO0FBQ0Msb0JBQWlDO0FBR2pDO0FBQUEsU0FBUSx3QkFBNEM7QUFDcEQsU0FBUSxpQkFBeUI7QUFFakM7QUFBQSxTQUFRLG9CQUEwRDtBQUdsRTtBQUFBLDBCQUFpQyxJQUFJLGVBQWU7QUFDcEQscUJBQTRCLElBQUksZUFBZSxJQUFXO0FBQzFELFNBQVEsdUJBQStCO0FBQ3ZDLFNBQVEscUJBQTZCO0FBQ3JDLFNBQVEscUJBQStDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUt2RCxxQkFBK0I7QUFDOUIsUUFBSSxLQUFLLFNBQVMsYUFBYSxVQUFVO0FBQ3hDLGFBQU8sa0JBQWtCO0FBQUEsSUFDMUI7QUFDQSxXQUFPLEtBQUssU0FBUztBQUFBLEVBQ3RCO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxFQUFFLEtBQWEsUUFBa0Q7QUFDaEUsV0FBTyxFQUFVLEtBQUssbUJBQW1CLEdBQUcsS0FBMkIsTUFBTTtBQUFBLEVBQzlFO0FBQUEsRUFFQSxNQUFNLFNBQVM7QUFDZCxVQUFNLEtBQUssYUFBYTtBQUN4QixVQUFNLEtBQUsseUJBQXlCO0FBR3BDLFVBQU0sS0FBSyxxQkFBcUI7QUFHaEMsU0FBSyxvQkFBb0I7QUFDekIsVUFBTSxLQUFLLFNBQVM7QUFHcEIsU0FBSyxhQUFhLHlCQUF5QixDQUFDLFNBQVMsSUFBSSxpQkFBaUIsTUFBTSxJQUFJLENBQUM7QUFHckYsU0FBSyxhQUFhLCtCQUErQixDQUFDLFNBQVMsSUFBSSx1QkFBdUIsTUFBTSxJQUFJLENBQUM7QUFHakcsU0FBSyxhQUFhLDRCQUE0QixDQUFDLFNBQVMsSUFBSSxvQkFBb0IsTUFBTSxJQUFJLENBQUM7QUFHM0YsU0FBSyxhQUFhLCtCQUErQixDQUFDLFNBQVMsSUFBSSx1QkFBdUIsTUFBTSxJQUFJLENBQUM7QUFHakcsVUFBTSxxQkFBcUIsSUFBSSx1QkFBdUIsSUFBSTtBQUMxRCx1QkFBbUIsU0FBUztBQUc1QixTQUFLLFdBQVc7QUFBQSxNQUNmLElBQUk7QUFBQSxNQUNKLE1BQU0sS0FBSyxFQUFFLGlCQUFpQjtBQUFBLE1BQzlCLGVBQWUsQ0FBQyxhQUFzQjtBQUNyQyxZQUFJLFNBQVUsUUFBTztBQUNyQixhQUFLLGlCQUFpQjtBQUFBLE1BQ3ZCO0FBQUEsSUFDRCxDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZixJQUFJO0FBQUEsTUFDSixNQUFNLEtBQUssRUFBRSwyQkFBMkI7QUFBQSxNQUN4QyxlQUFlLENBQUMsYUFBc0I7QUFDckMsWUFBSSxTQUFVLFFBQU87QUFDckIsYUFBSyx1QkFBdUI7QUFBQSxNQUM3QjtBQUFBLElBQ0QsQ0FBQztBQUdELFNBQUssV0FBVztBQUFBLE1BQ2YsSUFBSTtBQUFBLE1BQ0osTUFBTSxLQUFLLEVBQUUsaUJBQWlCO0FBQUEsTUFDOUIsZUFBZSxDQUFDLGFBQXNCO0FBQ3JDLFlBQUksU0FBVSxRQUFPO0FBQ3JCLGFBQUssYUFBYTtBQUFBLE1BQ25CO0FBQUEsSUFDRCxDQUFDO0FBR0QsU0FBSyxXQUFXO0FBQUEsTUFDZixJQUFJO0FBQUEsTUFDSixNQUFNLEtBQUssRUFBRSx1QkFBdUI7QUFBQSxNQUNwQyxlQUFlLENBQUMsYUFBc0I7QUFDckMsWUFBSSxTQUFVLFFBQU87QUFDckIsYUFBSyx1QkFBdUI7QUFBQSxNQUM3QjtBQUFBLElBQ0QsQ0FBQztBQUdELFNBQUssV0FBVztBQUFBLE1BQ2YsSUFBSTtBQUFBLE1BQ0osTUFBTSxLQUFLLEVBQUUsb0JBQW9CO0FBQUEsTUFDakMsZUFBZSxDQUFDLGFBQXNCO0FBQ3JDLFlBQUksU0FBVSxRQUFPO0FBQ3JCLGFBQUssb0JBQW9CO0FBQUEsTUFDMUI7QUFBQSxJQUNELENBQUM7QUFHRCxTQUFLLFdBQVc7QUFBQSxNQUNmLElBQUk7QUFBQSxNQUNKLE1BQU0sS0FBSyxFQUFFLG1CQUFtQjtBQUFBLE1BQ2hDLGdCQUFnQixDQUFDLFdBQW1CO0FBQ25DLGFBQUssbUJBQW1CLFFBQVEsTUFBTTtBQUFBLE1BQ3ZDO0FBQUEsSUFDRCxDQUFDO0FBRUQsU0FBSyxXQUFXO0FBQUEsTUFDZixJQUFJO0FBQUEsTUFDSixNQUFNLEtBQUssRUFBRSxxQkFBcUI7QUFBQSxNQUNsQyxnQkFBZ0IsQ0FBQyxXQUFtQjtBQUNuQyxhQUFLLG1CQUFtQixRQUFRLFFBQVE7QUFBQSxNQUN6QztBQUFBLElBQ0QsQ0FBQztBQUVELFNBQUssV0FBVztBQUFBLE1BQ2YsSUFBSTtBQUFBLE1BQ0osTUFBTSxLQUFLLEVBQUUsb0JBQW9CO0FBQUEsTUFDakMsZ0JBQWdCLENBQUMsV0FBbUI7QUFDbkMsYUFBSyxtQkFBbUIsUUFBUSxPQUFPO0FBQUEsTUFDeEM7QUFBQSxJQUNELENBQUM7QUFHRCxTQUFLO0FBQUE7QUFBQSxNQUVKLEtBQUssSUFBSSxVQUFVLEdBQUcsdUJBQXVCLENBQUMsTUFBVyxXQUFnQjtBQUN4RSxhQUFLLHNCQUFzQixNQUFNLE1BQU07QUFBQSxNQUN4QyxDQUFDO0FBQUEsSUFDRjtBQUdBLFNBQUssY0FBYyxJQUFJLFlBQVksS0FBSyxLQUFLLElBQUksQ0FBQztBQUdsRCxTQUFLLDBCQUEwQjtBQUcvQixTQUFLLDRCQUE0QjtBQUdqQyxTQUFLLDBCQUEwQjtBQUFBLEVBQ2hDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFjLDJCQUEyQjtBQUN4QyxVQUFNLGFBQWEsbUJBQW1CLG9CQUFtQixtQkFBbUI7QUFDNUUsVUFBTSxtQkFBbUIsbUJBQW1CLGlCQUFpQixXQUFXLEtBQUssaUJBQWlCO0FBQzlGLFVBQU0sc0JBQXNCLG1CQUFtQixLQUFLLFNBQVMsV0FBVyxLQUFLO0FBQzdFLFFBQUksa0JBQWtCO0FBRXRCLFFBQUksd0JBQXdCLFlBQVk7QUFDdkMsV0FBSyxTQUFTLGNBQWM7QUFDNUIsd0JBQWtCO0FBQUEsSUFDbkI7QUFFQSxRQUFJO0FBQ0gsWUFBTSxVQUFVLEtBQUssSUFBSSxNQUFNO0FBQy9CLFlBQU0sZUFBZSxNQUFNLFFBQVEsT0FBTyxVQUFVO0FBRXBELFVBQUksY0FBYztBQUNqQixjQUFNLGVBQWUsTUFBTSxRQUFRLE9BQU8sZ0JBQWdCO0FBQzFELFlBQUksQ0FBQyxjQUFjO0FBQ2xCLGdCQUFNLFFBQVEsT0FBTyxZQUFZLGdCQUFnQjtBQUFBLFFBQ2xEO0FBQUEsTUFDRDtBQUFBLElBQ0QsU0FBUyxPQUFPO0FBQ2YsY0FBUSxNQUFNLGlFQUFlLEtBQUs7QUFBQSxJQUNuQztBQUVBLFFBQUksaUJBQWlCO0FBQ3BCLFlBQU0sS0FBSyxTQUFTLEtBQUssUUFBUTtBQUFBLElBQ2xDO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsTUFBYyw0QkFBNEI7QUFFekMsUUFBSSxDQUFDLEtBQUssU0FBUyxrQkFBa0I7QUFDcEM7QUFBQSxJQUNEO0FBRUEsUUFBSTtBQUNILFlBQU0sS0FBSyxxQkFBcUI7QUFBQSxJQUNqQyxTQUFTLE9BQU87QUFDZixjQUFRLE1BQU0sdUVBQWdCLEtBQUs7QUFBQSxJQUNwQztBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sdUJBQXdDO0FBQzdDLFVBQU0sRUFBRSxNQUFNLElBQUksS0FBSztBQUN2QixVQUFNLFlBQVksbUJBQW1CLEtBQUssU0FBUyxXQUFXO0FBRTlELFFBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxTQUFTLEdBQUc7QUFDekMsYUFBTztBQUFBLElBQ1I7QUFFQSxVQUFNLGNBQWMsTUFBTSxzQkFBc0IsU0FBUztBQUd6RCxRQUFJLENBQUMsYUFBYTtBQUNqQixhQUFPO0FBQUEsSUFDUjtBQUdBLFFBQUksRUFBRSx1QkFBdUIsNEJBQVU7QUFDdEMsYUFBTztBQUFBLElBQ1I7QUFFQSxVQUFNLE9BQU8sS0FBSyxJQUFJLEdBQUcsS0FBSyxTQUFTLG9CQUFvQixFQUFFO0FBQzdELFVBQU0sYUFBYSxLQUFLLElBQUksSUFBSyxPQUFPLEtBQUssS0FBSyxLQUFLO0FBQ3ZELFFBQUksZUFBZTtBQUduQixVQUFNLFFBQVEsWUFBWTtBQUUxQixlQUFXLFFBQVEsT0FBTztBQUN6QixVQUFJLGdCQUFnQix5QkFBTztBQUUxQixZQUFJLEtBQUssS0FBSyxRQUFRLFlBQVk7QUFDakMsY0FBSTtBQUNILGtCQUFNLE1BQU0sT0FBTyxJQUFJO0FBQ3ZCO0FBQUEsVUFDRCxTQUFTLE9BQU87QUFDZixvQkFBUSxNQUFNLHFEQUFhLEtBQUssSUFBSSxJQUFJLEtBQUs7QUFBQSxVQUM5QztBQUFBLFFBQ0Q7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUVBLFFBQUksZUFBZSxHQUFHO0FBQ3JCLFVBQUkseUJBQU8sS0FBSyxFQUFFLHFCQUFxQixFQUFFLFFBQVEsV0FBVyxPQUFPLFlBQVksQ0FBQyxDQUFDO0FBQUEsSUFDbEY7QUFFQSxXQUFPO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS0EsNEJBQTRCO0FBRTNCLFNBQUssV0FBVztBQUFBLE1BQ2YsSUFBSTtBQUFBLE1BQ0osTUFBTSxLQUFLLEVBQUUscUJBQXFCO0FBQUEsTUFDbEMsU0FBUyxDQUFDLEVBQUUsV0FBVyxDQUFDLFFBQVEsT0FBTyxHQUFHLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFDcEQsVUFBVSxNQUFNO0FBQ2YsYUFBSyxpQkFBaUI7QUFBQSxNQUN2QjtBQUFBLElBQ0QsQ0FBQztBQUdELFNBQUssV0FBVztBQUFBLE1BQ2YsSUFBSTtBQUFBLE1BQ0osTUFBTSxLQUFLLEVBQUUsMEJBQTBCO0FBQUEsTUFDdkMsU0FBUyxDQUFDLEVBQUUsV0FBVyxDQUFDLFFBQVEsT0FBTyxHQUFHLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFDcEQsVUFBVSxNQUFNO0FBQ2YsYUFBSyx1QkFBdUI7QUFBQSxNQUM3QjtBQUFBLElBQ0QsQ0FBQztBQUdELFNBQUssV0FBVztBQUFBLE1BQ2YsSUFBSTtBQUFBLE1BQ0osTUFBTSxLQUFLLEVBQUUsd0JBQXdCO0FBQUEsTUFDckMsU0FBUyxDQUFDLEVBQUUsV0FBVyxDQUFDLFFBQVEsT0FBTyxHQUFHLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFDcEQsVUFBVSxNQUFNO0FBQ2YsYUFBSyxvQkFBb0I7QUFBQSxNQUMxQjtBQUFBLElBQ0QsQ0FBQztBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtRLDhCQUE4QjtBQUVyQyxTQUFLLGNBQWMsS0FBSyxJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsU0FBd0I7QUFDdkUsV0FBSyxVQUFVLGNBQWMsSUFBSTtBQUNqQyxXQUFLLHNCQUFzQixJQUFJO0FBQUEsSUFDaEMsQ0FBQyxDQUFDO0FBQ0YsU0FBSyxjQUFjLEtBQUssSUFBSSxNQUFNLEdBQUcsVUFBVSxDQUFDLFNBQXdCO0FBQ3ZFLFdBQUssVUFBVSxjQUFjLElBQUk7QUFDakMsV0FBSyxzQkFBc0IsSUFBSTtBQUFBLElBQ2hDLENBQUMsQ0FBQztBQUNGLFNBQUssY0FBYyxLQUFLLElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxTQUF3QjtBQUN2RSxXQUFLLFVBQVUsZUFBZSxJQUFJO0FBQ2xDLFdBQUssc0JBQXNCLElBQUk7QUFBQSxJQUNoQyxDQUFDLENBQUM7QUFDRixTQUFLLGNBQWMsS0FBSyxJQUFJLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBcUIsWUFBb0I7QUFDeEYsV0FBSyxVQUFVLGNBQWMsTUFBTSxPQUFPO0FBQzFDLFdBQUssc0JBQXNCLE1BQU0sT0FBTztBQUFBLElBQ3pDLENBQUMsQ0FBQztBQUFBLEVBQ0g7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQWMsdUJBQXNDO0FBRW5ELFVBQU0sS0FBSyxlQUFlLEtBQUs7QUFHL0IsU0FBSyxZQUFZLElBQUksZUFBZSxLQUFLLElBQUksT0FBTyxLQUFLLGNBQWM7QUFDdkUsVUFBTSxLQUFLLDZCQUE2QixJQUFJO0FBQUEsRUFDN0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsTUFBYyw2QkFBNkIsZ0JBQXlCLE9BQXNCO0FBQ3pGLFVBQU0sb0JBQW9CLHFCQUFxQixLQUFLLFFBQVE7QUFDNUQsVUFBTSxjQUFjLG1CQUFtQixLQUFLLFNBQVMsV0FBVyxLQUFLLGlCQUFpQjtBQUN0RixVQUFNLGdCQUFnQixDQUFDLEdBQUcsaUJBQWlCLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRztBQUM1RCxVQUFNLGNBQWMsaUJBQ2hCLENBQUMsS0FBSyxVQUFVLGlCQUNoQixLQUFLLHlCQUF5QixpQkFDOUIsS0FBSyx1QkFBdUI7QUFFaEMsU0FBSyxVQUFVLHFCQUFxQixpQkFBaUI7QUFDckQsU0FBSyxVQUFVLGVBQWUsV0FBVztBQUN6QyxTQUFLLHVCQUF1QjtBQUM1QixTQUFLLHFCQUFxQjtBQUUxQixRQUFJLGFBQWE7QUFDaEIsWUFBTSxLQUFLLFVBQVUsU0FBUztBQUFBLElBQy9CO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1Esc0JBQXNCLE1BQXFCLFNBQWtCO0FBQ3BFLFFBQUksZ0JBQWdCLDJCQUFTO0FBQzVCLFdBQUssV0FBVztBQUNoQixVQUFJLEtBQUssU0FBUyxhQUFhO0FBQzlCLGFBQUsseUJBQXlCO0FBQUEsTUFDL0I7QUFDQTtBQUFBLElBQ0Q7QUFFQSxRQUFJLEVBQUUsZ0JBQWdCLDBCQUFRO0FBQzdCO0FBQUEsSUFDRDtBQUVBLFVBQU0sb0JBQW9CLG1CQUFtQixXQUFXLEVBQUUsRUFBRSxZQUFZO0FBQ3hFLFVBQU0saUJBQWlCLGtCQUFrQixTQUFTLEtBQUs7QUFDdkQsVUFBTSxjQUFjLG9CQUFvQixZQUFZLGlCQUFpQixJQUFJO0FBQ3pFLFVBQU0sYUFBYSxLQUFLLGNBQWM7QUFDdEMsVUFBTSxVQUFVLFlBQVksS0FBSyxJQUFJO0FBR3JDLFFBQUksY0FBYyxnQkFBZ0I7QUFDakMsV0FBSyxXQUFXO0FBQUEsSUFDakI7QUFHQSxRQUFJLENBQUMsV0FBVyxDQUFDLGFBQWE7QUFDN0I7QUFBQSxJQUNEO0FBRUEsUUFBSSxFQUFFLGNBQWMsaUJBQWlCO0FBQ3BDLFdBQUssV0FBVztBQUFBLElBQ2pCO0FBRUEsUUFBSSxLQUFLLFNBQVMsYUFBYTtBQUM5QixXQUFLLHlCQUF5QjtBQUFBLElBQy9CO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1EseUJBQXlCLFVBQWtCLEtBQUs7QUFDdkQsUUFBSSxLQUFLLG1CQUFtQjtBQUMzQixtQkFBYSxLQUFLLGlCQUFpQjtBQUFBLElBQ3BDO0FBRUEsU0FBSyxvQkFBb0IsV0FBVyxNQUFNO0FBQ3pDLFdBQUssb0JBQW9CO0FBQ3pCLFdBQUssS0FBSyxpQkFBaUI7QUFBQSxJQUM1QixHQUFHLE9BQU87QUFBQSxFQUNYO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFjLG1CQUFtQjtBQUNoQyxVQUFNLFFBQTRCLENBQUM7QUFFbkMsZUFBVyxRQUFRLEtBQUssSUFBSSxVQUFVLGdCQUFnQix1QkFBdUIsR0FBRztBQUMvRSxZQUFNLE9BQU8sS0FBSztBQUNsQixVQUFJLGdCQUFnQixrQkFBa0I7QUFDckMsY0FBTSxLQUFLLEtBQUssY0FBYyxDQUFDO0FBQUEsTUFDaEM7QUFBQSxJQUNEO0FBRUEsZUFBVyxRQUFRLEtBQUssSUFBSSxVQUFVLGdCQUFnQiw2QkFBNkIsR0FBRztBQUNyRixZQUFNLE9BQU8sS0FBSztBQUNsQixVQUFJLGdCQUFnQix3QkFBd0I7QUFDM0MsY0FBTSxLQUFLLEtBQUssdUJBQXVCLENBQUM7QUFBQSxNQUN6QztBQUFBLElBQ0Q7QUFFQSxlQUFXLFFBQVEsS0FBSyxJQUFJLFVBQVUsZ0JBQWdCLDBCQUEwQixHQUFHO0FBQ2xGLFlBQU0sT0FBTyxLQUFLO0FBQ2xCLFVBQUksZ0JBQWdCLHFCQUFxQjtBQUN4QyxjQUFNLEtBQUssS0FBSyxlQUFlLENBQUM7QUFBQSxNQUNqQztBQUFBLElBQ0Q7QUFFQSxRQUFJLE1BQU0sU0FBUyxHQUFHO0FBQ3JCLFlBQU0sUUFBUSxXQUFXLEtBQUs7QUFBQSxJQUMvQjtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLE1BQU0sc0JBQXNCO0FBQzNCLFVBQU0sRUFBRSxVQUFVLElBQUksS0FBSztBQUUzQixRQUFJLE9BQU8sVUFBVSxnQkFBZ0IsMEJBQTBCLEVBQUUsQ0FBQztBQUNsRSxRQUFJLENBQUMsTUFBTTtBQUNWLGFBQU8sVUFBVSxRQUFRLEtBQUs7QUFDOUIsWUFBTSxLQUFLLGFBQWE7QUFBQSxRQUN2QixNQUFNO0FBQUEsUUFDTixRQUFRO0FBQUEsTUFDVCxDQUFDO0FBQUEsSUFDRjtBQUNBLGNBQVUsV0FBVyxJQUFJO0FBQUEsRUFDMUI7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtBLGlCQUFpQixNQUFhO0FBQzdCLFFBQUksQ0FBQyxLQUFLLFNBQVMsb0JBQW9CO0FBQ3RDLFlBQU0sTUFBTSxLQUFLLElBQUksTUFBTSxnQkFBZ0IsSUFBSTtBQUMvQyxhQUFPLEtBQUssS0FBSyxVQUFVLHFCQUFxQjtBQUNoRDtBQUFBLElBQ0Q7QUFHQSxRQUFJLEtBQUssb0JBQW9CO0FBQzVCLFVBQUk7QUFDSCxhQUFLLG1CQUFtQixNQUFNO0FBQUEsTUFDL0IsU0FBUyxHQUFHO0FBQUEsTUFBQztBQUNiLFdBQUsscUJBQXFCO0FBQUEsSUFDM0I7QUFFQSxVQUFNLFFBQVEsSUFBSSxrQkFBa0IsS0FBSyxLQUFLLE1BQU0sTUFBTSxDQUFDLEdBQUcsTUFBTTtBQUNuRSxVQUFJLEtBQUssdUJBQXVCLE9BQU87QUFDdEMsYUFBSyxxQkFBcUI7QUFBQSxNQUMzQjtBQUFBLElBQ0QsQ0FBQztBQUNELFNBQUsscUJBQXFCO0FBQzFCLFVBQU0sS0FBSztBQUFBLEVBQ1o7QUFBQSxFQUVBLFdBQVc7QUFDVixRQUFJLEtBQUssbUJBQW1CO0FBQzNCLG1CQUFhLEtBQUssaUJBQWlCO0FBQ25DLFdBQUssb0JBQW9CO0FBQUEsSUFDMUI7QUFFQSxTQUFLLGVBQWUsTUFBTTtBQUMxQixTQUFLLFVBQVUsTUFBTTtBQUVyQixTQUFLLElBQUksVUFBVSxtQkFBbUIsdUJBQXVCO0FBQzdELFNBQUssSUFBSSxVQUFVLG1CQUFtQiw2QkFBNkI7QUFDbkUsU0FBSyxJQUFJLFVBQVUsbUJBQW1CLDBCQUEwQjtBQUNoRSxTQUFLLElBQUksVUFBVSxtQkFBbUIsNkJBQTZCO0FBQ25FLFFBQUksS0FBSyxvQkFBb0I7QUFDNUIsVUFBSTtBQUNILGFBQUssbUJBQW1CLE1BQU07QUFBQSxNQUMvQixTQUFTLEdBQUc7QUFBQSxNQUFDO0FBQ2IsV0FBSyxxQkFBcUI7QUFBQSxJQUMzQjtBQUNBLFNBQUssb0JBQW9CO0FBQUEsRUFDMUI7QUFBQSxFQUVRLHNCQUFzQjtBQUM3QixhQUFTLGVBQWUsK0JBQStCLEdBQUcsT0FBTztBQUNqRSxhQUFTLGVBQWUsc0JBQXNCLEdBQUcsT0FBTztBQUFBLEVBQ3pEO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxNQUFNLHlCQUF5QjtBQUM5QixVQUFNLEVBQUUsVUFBVSxJQUFJLEtBQUs7QUFDM0IsUUFBSSxPQUFPLFVBQVUsZ0JBQWdCLDZCQUE2QixFQUFFLENBQUM7QUFDckUsUUFBSSxDQUFDLE1BQU07QUFDVixhQUFPLFVBQVUsUUFBUSxLQUFLO0FBQzlCLFlBQU0sS0FBSyxhQUFhO0FBQUEsUUFDdkIsTUFBTTtBQUFBLFFBQ04sUUFBUTtBQUFBLE1BQ1QsQ0FBQztBQUFBLElBQ0Y7QUFDQSxjQUFVLFdBQVcsSUFBSTtBQUFBLEVBQzFCO0FBQUE7QUFBQTtBQUFBLEVBSUEsTUFBTSxXQUFXO0FBQ2hCLFVBQU0sU0FBUyxNQUFNLEtBQUssbUJBQW1CO0FBQzdDLFFBQUksQ0FBQyxRQUFRO0FBQ1osV0FBSyxlQUFlO0FBQUEsSUFDckI7QUFBQSxFQUNEO0FBQUE7QUFBQSxFQUdBLE1BQU0scUJBQXVDO0FBRTVDLFFBQUksU0FBUyxlQUFlLCtCQUErQixHQUFHO0FBQzdELGFBQU87QUFBQSxJQUNSO0FBRUEsVUFBTSxhQUFhO0FBQUEsTUFDbEIsS0FBSyxTQUFTLE1BQU0sR0FBRyxtQkFBbUIsS0FBSyxTQUFTLEdBQUcsQ0FBQyxnQkFBZ0I7QUFBQSxNQUM1RSxxQkFBcUIsS0FBSyxTQUFTLEVBQUU7QUFBQSxNQUNyQztBQUFBLElBQ0QsRUFBRSxPQUFPLENBQUMsTUFBTSxPQUFPLFFBQVEsUUFBUSxJQUFJLFFBQVEsSUFBSSxNQUFNLEtBQUs7QUFFbEUsUUFBSTtBQUNILGlCQUFXLGFBQWEsWUFBWTtBQUNuQyxZQUFJLENBQUMsTUFBTSxLQUFLLElBQUksTUFBTSxRQUFRLE9BQU8sU0FBUyxHQUFHO0FBQ3BEO0FBQUEsUUFDRDtBQUVBLGNBQU0sVUFBVSxNQUFNLEtBQUssSUFBSSxNQUFNLFFBQVEsS0FBSyxTQUFTO0FBQzNELGNBQU0sZUFBZSxRQUVuQixRQUFRLHFCQUFxQixnQkFBZ0IsRUFDN0MsUUFBUSxvQkFBb0IsZ0JBQWdCLEVBQzVDLFFBQVEsa0JBQWtCLGdCQUFnQixFQUUxQyxRQUFRLHFCQUFxQixxQkFBcUIsRUFFbEQsUUFBUSxzQkFBc0IsdUJBQXVCLEVBRXJELFFBQVEsMEZBQTBGLG9CQUFvQixFQUV0SCxRQUFRLGtDQUFrQyw0QkFBNEIsRUFFdEUsUUFBUSxrQkFBa0IseUJBQXlCLEVBRW5ELFFBQVEsc0JBQXNCLDZCQUE2QixFQUUzRCxRQUFRLG1DQUFtQyx1QkFBdUIsRUFFbEUsUUFBUSxvREFBb0Qsd0JBQXdCO0FBQ3RGLGNBQU0sVUFBVSxTQUFTLGNBQWMsT0FBTztBQUM5QyxnQkFBUSxLQUFLO0FBQ2IsZ0JBQVEsY0FBYztBQUN0QixpQkFBUyxLQUFLLFlBQVksT0FBTztBQUNqQyxlQUFPO0FBQUEsTUFDUjtBQUFBLElBQ0QsU0FBUyxPQUFPO0FBQ2YsY0FBUSxJQUFJLDBHQUFxQixLQUFLO0FBQUEsSUFDdkM7QUFFQSxXQUFPO0FBQUEsRUFDUjtBQUFBO0FBQUEsRUFHQSxpQkFBaUI7QUFFaEIsUUFBSSxTQUFTLGVBQWUsc0JBQXNCLEdBQUc7QUFDcEQ7QUFBQSxJQUNEO0FBRUEsVUFBTSxVQUFVLFNBQVMsY0FBYyxPQUFPO0FBQzlDLFlBQVEsS0FBSztBQUNiLFlBQVEsY0FBYztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFB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QUFNLE9BQU8sTUFBTSxzQkFBc0I7QUFDL0MsVUFBSSx5QkFBTyxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxhQUFhLENBQUMsQ0FBQztBQUMzRCxhQUFPO0FBQUEsSUFDUixTQUFTLE9BQU87QUFDZixjQUFRLE1BQU0seUNBQVcsS0FBSztBQUM5QixVQUFJLHlCQUFPLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxTQUFVLE1BQWdCLFFBQVEsQ0FBQyxDQUFDO0FBQ3pFLGFBQU87QUFBQSxJQUNSO0FBQUEsRUFDRDtBQUFBO0FBQUEsRUFHQSxNQUFNLHNCQUFzQixNQUErQjtBQUMxRCxVQUFNLEVBQUUsTUFBTSxJQUFJLEtBQUs7QUFFdkIsUUFBSTtBQUNILFlBQU0sTUFBTSxPQUFPLElBQUk7QUFDdkIsVUFBSSx5QkFBTyxLQUFLLEVBQUUsZUFBZSxFQUFFLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQztBQUNyRCxhQUFPO0FBQUEsSUFDUixTQUFTLE9BQU87QUFDZixjQUFRLE1BQU0scURBQWEsS0FBSztBQUNoQyxVQUFJLHlCQUFPLEtBQUssRUFBRSxjQUFjLENBQUM7QUFDakMsYUFBTztBQUFBLElBQ1I7QUFBQSxFQUNEO0FBQ0Q7QUFocEVxQixvQkFFSSxzQkFBc0I7QUFGMUIsb0JBTUksaUJBQWlCLElBQUksS0FBSztBQU5uRCxJQUFxQixxQkFBckI7IiwKICAibmFtZXMiOiBbImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgInQiLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJsb2FkSW1hZ2UiLCAibG9hZEltYWdlIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iLCAiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJub2RlIiwgImltcG9ydF9vYnNpZGlhbiJdCn0K

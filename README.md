# Obsidian Media Toolkit

Manage images, video, audio, and PDF files inside your Obsidian vault.

## 中文

`Obsidian Media Toolkit` 是一个面向真实笔记工作流的媒体管理插件，覆盖媒体浏览、未引用清理、重复检测、隔离管理和图片对齐。

### 功能概览

#### 媒体库
- 网格浏览 Vault 中的图片、视频、音频和 PDF
- 搜索、排序、分页、多选、复制路径/链接、在笔记中查找
- 缩略图缓存和预览弹窗，减少重复打开时的等待

![Media Library](./assets/media-library.png)

#### 静态图片处理
- 在媒体库中直接处理 PNG / JPG / JPEG / WEBP / BMP
- 支持单文件和批量处理
- 支持格式转换和压缩
- 跨扩展名转换后自动保持笔记中的链接可用
- GIF 和 SVG 不显示破坏性处理入口

#### 未引用媒体和重复检测
- 扫描未被任何笔记引用的媒体文件
- 使用感知哈希检测像素级重复图片
- 支持将未引用文件或重复文件移动到隔离区，而不是直接删除

![Unreferenced Media](./assets/unreferenced-media.png)

#### 隔离区管理
- 删除操作优先进入隔离区
- 仪表盘显示文件数、总大小、类型分布和未引用率
- 支持引用计数、安全扫描、批量恢复和批量彻底删除

#### 图片对齐
支持扩展 Wiki 链接语法：

```markdown
![[image.png|center]]
![[photo.jpg|left]]
![[screenshot.png|right]]
```

旧的 `===center=== ... ===` 包装语法仍然兼容。

### 安装

#### BRAT 安装
1. 安装 BRAT 插件。
2. 在 BRAT 中选择 `Add Beta plugin`。
3. 输入仓库地址 `https://github.com/teee32/obsidian-media-toolkit`。
4. 在社区插件页面启用 `Media Toolkit`。

#### 手动安装
1. 克隆仓库或下载源码。
2. 在项目目录运行 `npm ci` 和 `npm run build`。
3. 将 `main.js`、`manifest.json`、`styles.css` 复制到你的 Vault 中 `.obsidian/plugins/obsidian-media-toolkit/`。
4. 重启 Obsidian 并启用插件。

### 快速使用

#### 快捷键

| 功能 | 快捷键 |
|------|--------|
| 打开媒体库 | `Ctrl/Cmd + Shift + M` |
| 查找未引用媒体 | `Ctrl/Cmd + Shift + U` |
| 打开隔离文件管理 | `Ctrl/Cmd + Shift + T` |

#### 命令面板
- `媒体库`
- `查找未引用图片`
- `刷新媒体引用缓存`
- `打开重复检测`
- `隔离文件管理`
- `图片居左/居中/居右对齐`

#### 典型工作流
1. 在媒体库里筛选文件，预览后复制路径、链接或定位引用笔记。
2. 对静态图片执行单文件或批量处理，完成后继续使用原有笔记引用。
3. 在重复检测视图扫描相似图片，确认后批量送入隔离区。
4. 在隔离管理视图里查看引用计数、运行安全扫描，并决定恢复或永久删除。

### 支持的媒体类型

#### 浏览与预览
- 图片: `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `bmp`
- 视频: `mp4`, `mov`, `avi`, `mkv`, `webm`
- 音频: `mp3`, `wav`, `ogg`, `m4a`, `flac`
- 文档: `pdf`

#### 静态图片处理
- `png`, `jpg`, `jpeg`, `webp`, `bmp`

### 主要设置
- 媒体文件夹范围
- 缩略图大小、分页大小、排序方式
- 图片/视频/音频/PDF 显示开关
- 预览弹窗和键盘导航
- 隔离区路径与自动清理
- 安全扫描天数和最小文件大小
- 重复检测相似度阈值

### 支持与反馈

Issue: https://github.com/teee32/obsidian-media-toolkit/issues

### 许可证

MIT License

---

## English

`Obsidian Media Toolkit` is a media-management plugin focused on real Obsidian workflows: browsing media, finding unreferenced files, detecting duplicates, managing quarantine, and aligning images in notes.

### Feature Overview

#### Media Library
- Browse images, video, audio, and PDF files in a grid view
- Search, sort, paginate, multi-select, copy paths/links, and find references in notes
- Cached thumbnails and preview modal for faster repeated access

![Media Library](./assets/media-library.png)

#### Static Image Processing
- Process PNG / JPG / JPEG / WEBP / BMP directly from the media library
- Single-file and batch processing flows
- Format conversion and compression
- Links remain valid when the file extension changes
- GIF and SVG intentionally do not expose destructive processing actions

#### Unreferenced Media and Duplicate Detection
- Scan for media files that are not referenced by any note
- Detect pixel-level duplicate images with perceptual hashing
- Move unreferenced or duplicate files into quarantine instead of deleting immediately

![Unreferenced Media](./assets/unreferenced-media.png)

#### Quarantine Management
- Destructive actions go through a quarantine folder first
- Dashboard for file count, total size, type distribution, and unreferenced rate
- Reference counts, safe scan, batch restore, and batch permanent delete

#### Image Alignment
Supports extended wiki-link syntax:

```markdown
![[image.png|center]]
![[photo.jpg|left]]
![[screenshot.png|right]]
```

The older `===center=== ... ===` wrapper syntax is still supported for backward compatibility.

### Installation

#### Install with BRAT
1. Install the BRAT plugin.
2. Choose `Add Beta plugin`.
3. Enter `https://github.com/teee32/obsidian-media-toolkit`.
4. Enable `Media Toolkit` in community plugins.

#### Manual Installation
1. Clone the repo or download the source.
2. Run `npm ci` and `npm run build`.
3. Copy `main.js`, `manifest.json`, and `styles.css` into `.obsidian/plugins/obsidian-media-toolkit/` inside your vault.
4. Restart Obsidian and enable the plugin.

### Quick Start

#### Keyboard Shortcuts

| Feature | Shortcut |
|---------|----------|
| Open Media Library | `Ctrl/Cmd + Shift + M` |
| Find Unreferenced Media | `Ctrl/Cmd + Shift + U` |
| Open Quarantine Management | `Ctrl/Cmd + Shift + T` |

#### Command Palette
- `Media Library`
- `Find Unreferenced Images`
- `Refresh Media Reference Cache`
- `Open Duplicate Detection`
- `Trash Management`
- `Align Image Left/Center/Right`

#### Typical Workflows
1. Filter and preview files from the media library, then copy a path, copy a link, or find note references.
2. Run single-file or batch processing for static images while keeping existing note links valid.
3. Scan for visually duplicate images and quarantine redundant copies.
4. Review reference counts in quarantine, run a safe scan, then restore or permanently delete files.

### Supported Media Types

#### Browsing and Preview
- Images: `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `bmp`
- Videos: `mp4`, `mov`, `avi`, `mkv`, `webm`
- Audio: `mp3`, `wav`, `ogg`, `m4a`, `flac`
- Documents: `pdf`

#### Static Image Processing
- `png`, `jpg`, `jpeg`, `webp`, `bmp`

### Main Settings
- Media folder scope
- Thumbnail size, page size, and default sorting
- Image / video / audio / PDF visibility toggles
- Preview modal and keyboard navigation
- Quarantine path and auto cleanup
- Safe-scan age and minimum file size
- Duplicate-detection similarity threshold

### Support

Issues: https://github.com/teee32/obsidian-media-toolkit/issues

### License

MIT License

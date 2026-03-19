# Media Toolkit

Manage images, video, audio, PDF, and common Office files inside your Obsidian vault.

[中文](#中文) | [English](#english)

## 中文

[Jump to English](#english)

`Media Toolkit` 是一个面向真实笔记工作流的媒体管理插件，覆盖媒体浏览、未引用清理、重复检测、隔离管理和图片对齐。

### 功能概览

#### 媒体库
- 网格浏览 Vault 中的图片、视频、音频，以及 PDF / Word / Excel / PowerPoint 文件
- 搜索、排序、分页、多选、复制路径/链接、在笔记中查找
- 缩略图缓存和预览弹窗，减少重复打开时的等待

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
3. 将 `main.js`、`manifest.json`、`styles.css` 复制到你的 Vault 中 `.obsidian/plugins/media-toolkit/`。
4. 重启 Obsidian 并启用插件。

### 快速使用

#### 快捷键

插件默认不绑定快捷键，避免和用户现有配置冲突。

你可以在 `设置 -> 快捷键` 里给下面这些命令自行分配快捷键：
- `媒体库`
- `查找未引用图片`
- `隔离文件管理`

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

### 使用教程

#### 1. 首次启用
1. 安装并启用插件。
2. 打开插件设置，先确认媒体类型开关、分页大小、缩略图大小和隔离区路径。
3. 如果你只想管理某个附件目录，设置“媒体文件夹”范围。

#### 2. 浏览和定位媒体
1. 执行 `媒体库` 命令；如果需要，也可以先在 `设置 -> 快捷键` 里给它分配自定义快捷键。
2. 在顶部搜索框输入文件名或路径片段。
3. 点击文件打开预览，右键可复制路径、复制链接、在笔记中查找或打开原文件。

#### 3. 处理静态图片
1. 在媒体库中找到 PNG/JPG/JPEG/WEBP/BMP。
2. 右键选择处理，或进入多选模式后批量处理。
3. 处理完成后，插件会写入新内容；如果扩展名发生变化，笔记中的链接也会一起更新。
4. GIF 和 SVG 不提供处理入口，这是刻意限制，避免破坏原始内容。

#### 4. 查找未引用文件
1. 执行 `查找未引用图片` 命令；如果需要，也可以先在 `设置 -> 快捷键` 里给它分配自定义快捷键。
2. 扫描完成后检查结果列表。
3. 将确认无用的文件送入隔离区，而不是直接永久删除。

#### 5. 检测重复图片
1. 执行 `打开重复检测`。
2. 点击开始扫描，等待感知哈希计算完成。
3. 按组检查重复图片，保留需要的文件，将冗余副本送入隔离区。
4. 隔离重复项时，插件会先把引用旧副本的笔记链接重写到保留文件，再移动冗余文件到隔离区。

#### 6. 管理隔离区
1. 执行 `隔离文件管理`；如果需要，也可以先在 `设置 -> 快捷键` 里给它分配自定义快捷键。
2. 查看引用计数、文件大小和类型分布。
3. 需要时运行安全扫描，筛出长期未引用且体积较大的文件。
4. 对误删文件执行恢复；确认无用后再永久删除。

#### 7. 图片对齐
1. 在笔记里选中图片链接。
2. 运行“图片居左/居中/居右对齐”命令。
3. 插件会把语法写成 `![[image.png|left]]` 这类可直接渲染的格式。

### 图标按钮速查

这些名称对应 Obsidian 内置的 Lucide 图标；界面里很多地方只显示图标，不显示文字。

#### 媒体库与多选工具栏

| 图标 | 位置 | 作用 |
|------|------|------|
| `search` | 单文件操作、未引用结果 | 在笔记中查找当前媒体的引用 |
| `link` | 单文件操作 | 复制 Vault 内路径 |
| `copy` | 单文件操作 | 复制 `[[file]]` 或 `![[file]]` 风格链接 |
| `external-link` | 单文件操作 | 用系统方式打开原始文件 |
| `check-square` / `square` | 多选或批量工具栏 | 全选 / 取消全选 |
| `folder-input` | 右键菜单、多选工具栏 | 按整理规则移动或重命名媒体文件 |
| `image-down` | 右键菜单、多选工具栏 | 对静态图片执行压缩或格式转换 |
| `trash-2` | 多选工具栏、结果列表 | 将文件送入隔离区，或在隔离视图中执行永久删除 |
| `x` | 多选工具栏、搜索框 | 退出多选模式或清空当前搜索 |

#### 重复检测与隔离管理

| 图标 | 位置 | 作用 |
|------|------|------|
| `search` | 重复检测头部 | 开始扫描当前 Vault 中的重复图片 |
| `broom` | 重复检测结果栏 | 每组保留建议文件，其余重复项一键送入隔离区 |
| `archive` | 重复检测单条结果 | 只隔离当前这一项重复副本 |
| `refresh-cw` | 未引用、隔离管理头部 | 重新加载列表或重新扫描 |
| `shield-check` | 隔离管理头部 | 运行安全扫描，优先筛出旧文件、大文件和未引用文件 |
| `rotate-ccw` | 隔离管理 | 将隔离区文件恢复回原路径 |
| `trash-2` | 隔离管理 | 永久删除隔离区文件 |

### 支持的媒体类型

#### 浏览与预览
- 图片: `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `bmp`
- 视频: `mp4`, `mov`, `avi`, `mkv`, `webm`
- 音频: `mp3`, `wav`, `ogg`, `m4a`, `flac`
- 文档: `pdf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`

注: PDF 支持内嵌预览；其他文档类型在列表里会显示文件类型标记，可复制链接、查找引用并用系统方式打开原文件。

#### 静态图片处理
- `png`, `jpg`, `jpeg`, `webp`, `bmp`

### 主要设置
- 媒体文件夹范围
- 缩略图大小、分页大小、排序方式
- 图片/视频/音频/文档 显示开关
- 预览弹窗和键盘导航
- 隔离区路径与自动清理
- 安全扫描天数和最小文件大小
- 重复检测相似度阈值

### 支持与反馈

Issue: https://github.com/teee32/obsidian-media-toolkit/issues

### 隐私与披露

- 不需要账号，也不依赖付费服务
- 不发送遥测、不注入广告、不上传 Vault 内容
- 不发起网络请求，所有媒体扫描、去重和处理都在本地完成
- 仅在你主动触发“打开原文件”时，才会调用系统默认程序打开本地文件
- 源代码完整公开在当前仓库中

### 许可证

MIT License

---

## English

[跳转到中文](#中文)

`Media Toolkit` is a media-management plugin focused on real Obsidian workflows: browsing media, finding unreferenced files, detecting duplicates, managing quarantine, and aligning images in notes.

### Feature Overview

#### Media Library
- Browse images, video, audio, plus PDF / Word / Excel / PowerPoint files in a grid view
- Search, sort, paginate, multi-select, copy paths/links, and find references in notes
- Cached thumbnails and preview modal for faster repeated access

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
3. Copy `main.js`, `manifest.json`, and `styles.css` into `.obsidian/plugins/media-toolkit/` inside your vault.
4. Restart Obsidian and enable the plugin.

### Quick Start

#### Keyboard Shortcuts

The plugin intentionally ships without default hotkeys to avoid conflicts with each user's setup.

You can assign your own hotkeys in `Settings -> Hotkeys` for:
- `Media Library`
- `Find Unreferenced Images`
- `Trash Management`

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

### Tutorial

#### 1. First-Time Setup
1. Install and enable the plugin.
2. Open plugin settings and review media-type toggles, page size, thumbnail size, and quarantine path.
3. If you only want to manage one attachments folder, set the media-folder scope first.

#### 2. Browse and Locate Media
1. Run the `Media Library` command. If you want a shortcut, assign one first in `Settings -> Hotkeys`.
2. Use the search box to filter by filename or path fragment.
3. Click a file to preview it. Right-click for path copy, link copy, note references, or opening the original file.

#### 3. Process Static Images
1. Find a PNG/JPG/JPEG/WEBP/BMP file in the media library.
2. Use the context menu to process one file, or switch to multi-select mode for batch processing.
3. After processing, the plugin writes the converted content and keeps note links valid even when the extension changes.
4. GIF and SVG intentionally do not expose processing actions.

#### 4. Find Unreferenced Files
1. Run `Find Unreferenced Images`. If you want a shortcut, assign one first in `Settings -> Hotkeys`.
2. Review the scan results.
3. Move confirmed unused files into quarantine instead of deleting them permanently right away.

#### 5. Detect Duplicate Images
1. Run `Open Duplicate Detection`.
2. Start the scan and wait for perceptual-hash analysis to finish.
3. Review each duplicate group, keep the file you want, and quarantine the redundant copies.
4. When quarantining a duplicate, the plugin rewrites note links that resolve to the removed copy so they point to the kept file first.

#### 6. Manage Quarantine
1. Run `Trash Management`. If you want a shortcut, assign one first in `Settings -> Hotkeys`.
2. Review reference counts, file sizes, and type distribution.
3. Use safe scan when you want to surface old, unreferenced, and larger files first.
4. Restore files that were quarantined by mistake, and permanently delete only after review.

#### 7. Align Images in Notes
1. Select an image link in a note.
2. Run the left / center / right alignment command.
3. The plugin rewrites the syntax to a renderable form such as `![[image.png|left]]`.

### Icon Quick Reference

These names map to Obsidian's built-in Lucide icons. In many places the UI shows the icon only, without a text label.

#### Media Library and Multi-Select Toolbar

| Icon | Where | Action |
|------|-------|--------|
| `search` | Per-file actions, unreferenced results | Find note references for the current media file |
| `link` | Per-file actions | Copy the vault-relative path |
| `copy` | Per-file actions | Copy a `[[file]]` or `![[file]]` style link |
| `external-link` | Per-file actions | Open the original file with the system handler |
| `check-square` / `square` | Multi-select and batch toolbars | Select all / clear selection |
| `folder-input` | Context menu, multi-select toolbar | Move or rename files with organize rules |
| `image-down` | Context menu, multi-select toolbar | Compress or convert static images |
| `trash-2` | Batch toolbars, result lists | Move files into quarantine, or permanently delete inside quarantine |
| `x` | Multi-select toolbar, search box | Exit multi-select mode or clear the current search |

#### Duplicate Detection and Quarantine Management

| Icon | Where | Action |
|------|-------|--------|
| `search` | Duplicate detection header | Start scanning duplicate images in the current vault |
| `broom` | Duplicate detection results bar | Keep the suggested file in each group and quarantine the rest |
| `archive` | Duplicate detection item row | Quarantine only the current duplicate copy |
| `refresh-cw` | Unreferenced and quarantine headers | Reload the list or rerun a scan |
| `shield-check` | Quarantine header | Run the safe scan to surface older, larger, and unreferenced files first |
| `rotate-ccw` | Quarantine actions | Restore a quarantined file back to its original path |
| `trash-2` | Quarantine actions | Permanently delete a quarantined file |

### Supported Media Types

#### Browsing and Preview
- Images: `png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `bmp`
- Videos: `mp4`, `mov`, `avi`, `mkv`, `webm`
- Audio: `mp3`, `wav`, `ogg`, `m4a`, `flac`
- Documents: `pdf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`

Note: PDF files support inline preview. Other document types use typed fallbacks in the UI, keep link/reference workflows, and can be opened via the system handler.

#### Static Image Processing
- `png`, `jpg`, `jpeg`, `webp`, `bmp`

### Main Settings
- Media folder scope
- Thumbnail size, page size, and default sorting
- Image / video / audio / document visibility toggles
- Preview modal and keyboard navigation
- Quarantine path and auto cleanup
- Safe-scan age and minimum file size
- Duplicate-detection similarity threshold

### Support

Issues: https://github.com/teee32/obsidian-media-toolkit/issues

### Privacy and disclosures

- No account is required and no paid service is needed
- No telemetry, no ads, and no Vault content is uploaded
- No network requests are made; scanning, duplicate detection, and image processing run locally
- The plugin only asks the operating system to open a local file when you explicitly use `Open original file`
- The full source code is available in this repository

### License

MIT License

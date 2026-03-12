# Obsidian Media Toolkit

[English](#english) | [中文](#中文)

---

## 简体中文

一个功能强大的 Obsidian 媒体管理插件，帮助你更好地管理和组织笔记中的媒体文件。

### 功能特性

#### 媒体库视图
- 以网格视图的方式浏览 Vault 中所有媒体文件
- 支持图片、视频、音频、PDF 文件
- 缩略图预览
- 搜索过滤功能
- 分页显示
- 多选和批量操作
- 点击预览

![Unreferenced Media](./assets/unreferenced-media.png)

#### 未引用媒体检测
- 自动检测 Vault 中未被任何笔记引用的孤立媒体文件
- 安全删除（先移入隔离文件夹）
- 支持批量删除

![Media Library](./assets/media-library.png)

#### 图片对齐
支持使用简洁的扩展链接语法对图片对齐：

```markdown
// 居中对齐
![[image.png|center]]

// 居左对齐
![[photo.jpg|left]]

// 居右对齐
![[screenshot.png|right]]

// 也可以设置宽度
![[image.png|300]]
```

> 提示：旧语法 `===center=== ... ===` 仍然兼容支持

#### 隔离文件管理
- 删除的文件先移入隔离文件夹
- 支持恢复或彻底删除
- 自动清理功能（可选）

### 安装方法

#### 使用 BRAT 安装（推荐）
1. 安装 BRAT 插件（社区插件搜索 "BRAT"）
2. 打开 BRAT 设置，点击 "Add Beta plugin"
3. 输入 `https://github.com/teee32/obsidian-media-toolkit`
4. 启用 "Media Toolkit" 插件

#### 手动安装
1. 克隆仓库或下载源码
2. 进入项目目录，运行 `npm install` 和 `npm run build`
3. 将 `dist` 目录下的文件复制到你的 Obsidian Vault 的 `.obsidian/plugins/obsidian-media-toolkit/` 目录下
4. 重启 Obsidian
5. 在第三方插件设置中启用插件

### 使用说明

#### 快捷键

| 功能 | 快捷键 |
|------|--------|
| 打开媒体库 | `Ctrl/Cmd + Shift + M` |
| 查找未引用媒体 | `Ctrl/Cmd + Shift + U` |
| 打开隔离文件管理 | `Ctrl/Cmd + Shift + T` |

#### 命令面板

- `媒体库` - 打开媒体库视图
- `查找未引用媒体` - 查找未被任何笔记引用的媒体文件
- `隔离文件管理` - 管理已删除的文件
- `图片居左/居中/居右对齐` - 对齐选中的图片

#### 媒体库功能

1. **搜索过滤**：在搜索框中输入文件名进行过滤
2. **排序**：按名称、日期、大小排序
3. **多选**：点击多选按钮进入选择模式
4. **预览**：点击媒体文件打开预览窗口
5. **右键菜单**：复制路径、复制链接、在笔记中查找等

#### 未引用媒体

1. 打开未引用媒体视图
2. 查看所有未被引用的媒体文件
3. 选择删除或批量删除
4. 删除的文件会移入隔离文件夹

### 支持的媒体类型

- **图片**: png, jpg, jpeg, gif, webp, svg, bmp
- **视频**: mp4, mov, avi, mkv, webm
- **音频**: mp3, wav, ogg, m4a, flac
- **文档**: pdf

### 设置选项

- 媒体文件夹路径
- 缩略图大小
- 默认排序方式
- 安全删除设置
- 媒体类型过滤
- 分页大小

### 支持与反馈

如果你遇到问题或有功能建议，请提交 Issue 到：
https://github.com/teee32/obsidian-media-toolkit/issues

### 许可证

MIT License - 详见 LICENSE 文件

---

## English

A powerful Obsidian media management plugin that helps you better manage and organize media files in your notes.

### Features

#### Media Library View
- Browse all media files in your Vault with grid view
- Support for images, videos, audio, and PDF files
- Thumbnail preview
- Search and filter functionality
- Pagination
- Multi-select and batch operations
- Click to preview

![Unreferenced Media](./assets/unreferenced-media.png)

#### Unreferenced Media Detection
- Automatically detect orphaned media files not referenced by any notes
- Safe deletion (moved to quarantine folder first)
- Support for batch deletion

![Media Library](./assets/media-library.png)

#### Image Alignment
Align images using the extended link syntax:

```markdown
// Center alignment
![[image.png|center]]

// Left alignment
![[photo.jpg|left]]

// Right alignment
![[screenshot.png|right]]

// You can also set width
![[image.png|300]]
```

> Note: The old syntax `===center=== ... ===` is still supported for backward compatibility

#### Quarantine File Management
- Deleted files are moved to quarantine folder first
- Support for restore or permanent deletion
- Auto-cleanup feature (optional)

### Installation

#### Install with BRAT (Recommended)
1. Install the BRAT plugin (search "BRAT" in community plugins)
2. Open BRAT settings, click "Add Beta plugin"
3. Enter `https://github.com/teee32/obsidian-media-toolkit`
4. Enable the "Media Toolkit" plugin

#### Manual Installation
1. Clone the repository or download the source code
2. Run `npm install` and `npm run build` in the project directory
3. Copy files from the `dist` folder to your Obsidian Vault's `.obsidian/plugins/obsidian-media-toolkit/` directory
4. Restart Obsidian
5. Enable the plugin in the third-party plugins settings

### Usage

#### Keyboard Shortcuts

| Feature | Shortcut |
|---------|----------|
| Open Media Library | `Ctrl/Cmd + Shift + M` |
| Find Unreferenced Media | `Ctrl/Cmd + Shift + U` |
| Open Quarantine Management | `Ctrl/Cmd + Shift + T` |

#### Command Palette

- `Media Library` - Open media library view
- `Find Unreferenced Media` - Find media files not referenced by any notes
- `Quarantine Management` - Manage deleted files
- `Align Image Left/Center/Right` - Align selected image

#### Media Library Features

1. **Search & Filter**: Enter filename in search box to filter
2. **Sort**: Sort by name, date, or size
3. **Multi-select**: Click multi-select button to enter selection mode
4. **Preview**: Click media file to open preview window
5. **Context Menu**: Copy path, copy link, find in notes, etc.

#### Unreferenced Media

1. Open unreferenced media view
2. View all unreferenced media files
3. Choose to delete or batch delete
4. Deleted files will be moved to quarantine folder

### Supported Media Types

- **Images**: png, jpg, jpeg, gif, webp, svg, bmp
- **Videos**: mp4, mov, avi, mkv, webm
- **Audio**: mp3, wav, ogg, m4a, flac
- **Documents**: pdf

### Settings

- Media folder path
- Thumbnail size
- Default sort order
- Safe deletion settings
- Media type filter
- Page size

### Support & Feedback

If you encounter issues or have feature suggestions, please submit an issue at:
https://github.com/teee32/obsidian-media-toolkit/issues

### License

MIT License - See LICENSE file for details

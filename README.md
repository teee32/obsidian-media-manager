# Obsidian Media Toolkit

一个功能强大的 Obsidian 媒体管理插件，帮助你更好地管理和组织笔记中的媒体文件。

## 功能特性

### 媒体库视图
- 以网格视图的方式浏览 Vault 中所有媒体文件
- 支持图片、视频、音频、PDF 文件
- 缩略图预览
- 搜索过滤功能
- 分页显示
- 多选和批量操作
- 点击预览

### 未引用媒体检测
- 自动检测 Vault 中未被任何笔记引用的孤立媒体文件
- 安全删除（先移入隔离文件夹）
- 支持批量删除

### 图片对齐
支持使用简洁的语法对图片进行对齐：
```markdown
===center===
![[image.png]]
===

===left===
![[photo.jpg]]
===

===right===
![[screenshot.png]]
===
```

### 隔离文件管理
- 删除的文件先移入隔离文件夹
- 支持恢复或彻底删除
- 自动清理功能（可选）

## 安装方法

### 使用 BRAT 安装（推荐）
1. 安装 BRAT 插件（社区插件搜索 "BRAT"）
2. 打开 BRAT 设置，点击 "Add Beta plugin"
3. 输入 `https://github.com/teee32/obsidian-media-toolkit`
4. 启用 "Media Toolkit" 插件

### 手动安装
1. 克隆仓库或下载源码
2. 进入项目目录，运行 `npm install` 和 `npm run build`
3. 将 `dist` 目录下的文件复制到你的 Obsidian Vault 的 `.obsidian/plugins/obsidian-media-toolkit/` 目录下
4. 重启 Obsidian
5. 在第三方插件设置中启用插件

## 使用说明

### 快捷键

| 功能 | 快捷键 |
|------|--------|
| 打开媒体库 | `Ctrl/Cmd + Shift + M` |
| 查找未引用媒体 | `Ctrl/Cmd + Shift + U` |
| 打开隔离文件管理 | `Ctrl/Cmd + Shift + T` |

### 命令面板

- `媒体库` - 打开媒体库视图
- `查找未引用媒体` - 查找未被任何笔记引用的媒体文件
- `隔离文件管理` - 管理已删除的文件
- `图片居左/居中/居右对齐` - 对齐选中的图片

### 媒体库功能

1. **搜索过滤**：在搜索框中输入文件名进行过滤
2. **排序**：按名称、日期、大小排序
3. **多选**：点击多选按钮进入选择模式
4. **预览**：点击媒体文件打开预览窗口
5. **右键菜单**：复制路径、复制链接、在笔记中查找等

### 未引用媒体

1. 打开未引用媒体视图
2. 查看所有未被引用的媒体文件
3. 选择删除或批量删除
4. 删除的文件会移入隔离文件夹

## 支持的媒体类型

- **图片**: png, jpg, jpeg, gif, webp, svg, bmp
- **视频**: mp4, mov, avi, mkv, webm
- **音频**: mp3, wav, ogg, m4a, flac
- **文档**: pdf

## 设置选项

- 媒体文件夹路径
- 缩略图大小
- 默认排序方式
- 安全删除设置
- 媒体类型过滤
- 分页大小

## 支持与反馈

如果你遇到问题或有功能建议，请提交 Issue 到：
https://github.com/teee32/obsidian-media-toolkit/issues

## 许可证

MIT License - 详见 LICENSE 文件

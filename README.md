# Obsidian Media Manager

一个功能强大的Obsidian图片管理插件，帮助你更好地管理和组织笔记中的媒体文件。

## 功能特性

### 图片对齐
支持使用简洁的语法对图片进行对齐：
- `===center===` - 居中对齐
- `===left===` - 居左对齐
- `===right===` - 居右对齐

只需在图片链接前后添加相应的标记即可实现对齐效果。

### 图片库视图
以网格视图的方式浏览你的Vault中所有图片：
- 直观地查看所有媒体文件
- 支持缩略图预览
- 快速定位图片位置
- 支持按文件名搜索过滤

### 未引用图片检测
自动检测Vault中未被任何笔记引用的孤立媒体文件：
- 识别孤立的图片文件
- 帮助清理不需要的媒体文件
- 释放存储空间

## 安装方法

### 使用 BRAT 安装（推荐）
1. 安装 BRAT 插件（社区插件搜索 "BRAT"）
2. 打开 BRAT 设置，点击 "Add Beta plugin"
3. 输入 `https://github.com/teee32/obsidian-media-manager`
4. 启用 "Media Manager" 插件

### 手动安装
1. 从GitHub releases下载最新版本
2. 解压到你的Obsidian Vault的`.obsidian/plugins/`目录下
3. 重启Obsidian
4. 在第三方插件设置中启用插件

## 使用说明

### 对齐图片

在笔记中按以下方式使用对齐语法：

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

### 打开图片库视图

1. 使用快捷键 `Ctrl/Cmd + Shift + M`
2. 或在命令面板中搜索 "Media Manager: Open Gallery"
3. 在网格视图中浏览所有图片
4. 点击图片可查看大图或复制文件路径

### 检测未引用图片

1. 使用快捷键 `Ctrl/Cmd + Shift + U`
2. 或在命令面板中搜索 "Media Manager: Find Unused Media"
3. 查看所有未引用的媒体文件列表
4. 可选择删除不需要的文件

## 快捷键

| 功能 | 快捷键 |
|------|--------|
| 打开图片库 | `Ctrl/Cmd + Shift + M` |
| 检测未引用图片 | `Ctrl/Cmd + Shift + U` |

## 支持与反馈

如果你遇到问题或有功能建议，请提交Issue到：
https://github.com/teee32/obsidian-media-manager/issues

## 许可证

MIT License - 详见 LICENSE 文件

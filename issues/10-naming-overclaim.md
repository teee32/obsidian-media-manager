# Issue 10: 命名过度营销 - 声称 Media Manager 但只处理图片

## 严重程度: P2 - 命名不准确

### 问题描述
项目命名为 "Obsidian Media Manager" / "Media Manager"，但实际实现只处理图片扩展名（png/jpg/gif/webp/svg/bmp），没有看到对音视频、PDF 等"media"常见附件的处理逻辑。

### 影响
"media-manager"这个名称在当前实现下属于过度营销/命名虚高。用户安装后期待能管理音视频或 PDF，但实际上只能用图片功能。

### 修复建议

选项 A: 扩展功能
- 实现音视频文件支持
- 实现 PDF 文件支持
- 实现附件的全面管理

选项 B: 改名
- 改名为 "Obsidian Image Manager" 或 "Image Toolkit"
- 或使用更谦虚的名称如 "Simple Image Manager"

### 参考资料
- [7] main.ts（命令注册 - 只处理图片扩展名）
- [1] 仓库主页与文件结构

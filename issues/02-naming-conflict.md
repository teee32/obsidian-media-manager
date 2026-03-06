# Issue 2: 存在同名项目冲突 - obsidian-image-manager 已被占用

## 严重程度: P0 - 阻塞发布

### 问题描述
GitHub 上已经存在 davidvkimball/obsidian-image-manager，项目名就叫 "Image Manager for Obsidian"，并且已经有版本迭代与 releases（截至 2026-03-03 还有 Latest）。

### 影响
你的仓库沿用 obsidian-image-manager 作为 id/name 的做法，非常容易造成品牌/搜索/生态层面的碰撞（即使你不是抄袭，用户也会以为你是那个项目的 fork/山寨/镜像）。

### 修复建议
- 将插件 ID 改为 `obsidian-media-manager` 或其他唯一名称
- 仓库架构文档文件名也需同步修改（目前还带 OBSIDIAN-IMAGE-MANAGER-...）

### 参考资料
- [2] manifest.json（插件 id/name/author 等）
- [5] 现存同名项目 davidvkimball/obsidian-image-manager（已发布版本、README 描述）

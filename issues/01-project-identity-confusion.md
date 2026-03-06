# Issue 1: 项目身份混乱 - manifest.json 与 package.json 元数据不一致

## 严重程度: P0 - 阻塞发布

### 问题描述
项目身份混乱到影响可发布性：repo 叫 media-manager，但核心元数据还是 image-manager

- manifest.json 的 id 是 `obsidian-image-manager`，name 是 "Image Manager"，描述也是 "Manage images ..."
- package.json 的 name 也还是 `obsidian-image-manager`，描述同样是 image management plugin
- README 却在讲 Obsidian Media Manager

### 影响
这会导致插件生态里直接造成冲突/混淆，即使代码写完，上架/分发/用户安装都会被这些元数据拖后腿。

### 修复建议
统一修改以下文件:
- manifest.json: id 改为 `obsidian-media-manager`, name 改为 "Media Manager"
- package.json: name 改为 `obsidian-media-manager`
- README: 保持一致的命名
- 所有源码中的引用

### 参考资料
- [1] teee32/obsidian-media-manager 仓库主页与文件结构
- [2] manifest.json（插件 id/name/author 等）
- [3] package.json（npm 包名/描述等）
- [4] README（功能宣称、安装方式）

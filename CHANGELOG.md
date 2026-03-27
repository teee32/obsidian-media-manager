# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.1.27] - 2026-03-27

### Fixed
- 移除媒体库、未引用媒体扫描和隔离管理命令的默认快捷键，避免与用户现有快捷键或 Obsidian 默认绑定冲突，满足最新一轮 ObsidianReviewBot 的 `Required` 要求

---

## [1.1.26] - 2026-03-27

### Changed
- 统一放大全插件按钮图标尺寸，覆盖工具栏、列表操作、搜索控件、重复检测操作和仪表盘图标
- 微调纯图标按钮的直径与间距，改善低对比暖色主题下的可辨识度

---

## [1.1.25] - 2026-03-27

### Changed
- 恢复默认快捷键：`Ctrl/Cmd + Shift + M/U/T` 分别用于媒体库、未引用媒体扫描和隔离管理
- 放大媒体卡片底部圆形操作按钮中的图标，并微调按钮尺寸与间距，提升可见性和点击感

---

## [1.1.24] - 2026-03-27

### Changed
- 继续收口 Anthropic 风格工作台界面：统一四个主视图的纸面质感、标题层级、摘要卡片、工具栏和列表项样式
- 减少整体卡片感和阴影依赖，改为更接近设计系统的分隔线、柔和边界和更有编辑感的排版节奏
- 优化窄面板下的响应式布局，让隔离管理、未引用列表和重复检测在较小宽度下更稳定

---

## [1.1.23] - 2026-03-20

### Fixed
- 移除 `syncPerformanceInfraSettings` 和 `refreshImages` 中不再需要的 `async` 声明，清理最新一轮社区审核指出的剩余 `Required` 项
- 清理图像对齐和媒体处理中的未使用局部变量，减少当前一轮 `Optional` 警告

---

## [1.1.22] - 2026-03-20

### Fixed
- 修复社区审核剩余的 `Required` 项：移除对同步函数的多余 `await`、将 `loadTrashItems` 调整为同步刷新流程，并避免拆出未绑定的 `vault.getFiles` 方法引用

### Added
- 新增真实回归测试，覆盖媒体库刷新、隔离管理、安全扫描、未引用媒体扫描，以及同名附件的 Wiki basename 链接改写场景

---

## [1.1.21] - 2026-03-19

### Fixed
- 修复未被 metadata cache 解析到的 Wiki basename 链接改写：在必要时回退遍历 vault 文件，确保隔离/移动同名附件后仍能把目标链接更新到正确文件
- 补充对应测试用例，覆盖 unresolved basename 链接的重写路径

---

## [1.1.20] - 2026-03-19

### Changed
- 设置页标题统一改为使用 Obsidian 官方 `Setting(...).setHeading()` 写法，并调整示例占位文本大小写
- 删除确认流程统一改为插件内 Modal，不再依赖浏览器原生 `confirm()`
- 统一将媒体缩略图回退、类型标签、删除确认布局等界面样式迁移到 `styles.css`

### Fixed
- 移除运行时动态注入 `<style>` 的后备逻辑，避免社区审核拦截
- 移除插件卸载时主动 `detachLeavesOfType()` 的行为，遵循 Obsidian 视图生命周期要求
- 清理社区审核指出的 `any`、未显式处理 Promise、空 `catch`、不安全类型断言和条件赋值问题
- 对齐重复检测、媒体库、未引用视图和隔离管理中的按钮回调、缩略图状态和删除/恢复流程实现，降低 review bot 报警

---

## [1.1.19] - 2026-03-19

### Changed
- 将插件 `id` 调整为 `media-toolkit`，同步更新手动安装目录和社区发布元数据
- 发布流程改为使用与 `manifest.json` 完全一致的纯版本号 tag，并补充 `versions.json`
- README 补充隐私与披露说明，移除默认快捷键说明，改为由用户自行分配

### Fixed
- 改用 `FileManager.trashFile()` 执行删除，遵循 Obsidian 的删除偏好设置
- 样式文件加载改用 `Vault.configDir`，兼容自定义配置目录
- 链接批量改写改用 `Vault.process()`，避免直接使用 `Vault.modify()`
- 新增旧插件 `obsidian-media-toolkit` 配置数据迁移，降低改 `id` 后的升级影响

---

## [1.1.18] - 2026-03-18

### Fixed
- 修复重复检测隔离副本时的链接重写逻辑：按 Obsidian 实际解析结果更新 Wiki/Markdown 链接，覆盖相对路径以及带查询参数/锚点的 Markdown 链接
- 修复同名文件场景下的 basename 改写安全性，避免误改到其他同名附件，并保证 Markdown basename 链接改写为正确相对路径
- 修复本地资源感知哈希加载的 CORS 问题，避免 `app://`、`file://`、`blob:` 资源导致重复检测哈希计算失败
- 修复媒体预览弹窗并发打开时的状态错位问题，并为不支持内嵌预览的 Office 文档提供更明确提示
- 修复隔离管理中的类型回退标签显示，按真实扩展名展示文档和其他文件类型

### Changed
- 文档支持范围和界面文案统一为 `pdf/doc/docx/xls/xlsx/ppt/pptx`，缩略图回退标签按真实扩展名显示，README 同步补充 Office 文档行为说明
- 复制链接在同名文件冲突时自动使用稳定路径，“打开原文件”优先交给系统默认程序处理

---

## [1.1.17] - 2026-03-17

### Fixed
- 修复重复检测对透明 PNG logo 的误判：哈希计算改为在白底上处理透明像素并裁掉透明留白，避免将 Grok 误并入 ChatGPT，同时提升 Claude 同图不同文件的命中率

---

## [1.1.16] - 2026-03-15

### Changed
- README 补充图标按钮速查和常用入口说明，覆盖媒体库、多选工具栏、重复检测和隔离管理
- 重复检测空状态改为只保留头部扫描按钮，避免重复入口造成混淆

### Fixed
- 修复重复检测视图样式加载不稳定，避免本地环境中开始扫描按钮错位或不可点击
- 修复插件重载后的样式清理逻辑，避免旧样式残留影响重复检测界面

---

## [1.1.12] - 2026-03-14

### Added
- 新增重复检测视图与命令，使用感知哈希扫描像素级重复图片，并支持一键隔离重复项
- 新增 IndexedDB 缩略图缓存与增量媒体索引，减少媒体库、重复检测和隔离管理视图的全量遍历开销
- 新增媒体库静态图片处理能力，支持单文件和批量格式转换/压缩
- 新增隔离管理仪表盘、引用计数展示以及批量恢复/批量删除工具栏

### Changed
- README 更新为当前功能集，并修正手动安装步骤中的构建产物路径
- 媒体库与隔离管理视图统一使用缓存缩略图和更完整的多媒体回退展示

### Fixed
- 修复媒体处理跨扩展名时的重命名链路，避免链接更新阻塞导致单文件处理或批量处理卡住
- 修复媒体处理动作暴露范围，仅对 PNG/JPG/JPEG/WEBP/BMP 显示静态图片处理入口
- 修复隔离管理视图回归，恢复桌面端真实性测试中的加载、统计和批量操作稳定性

---

## [1.1.11] - 2026-03-07

### Fixed
- 修复媒体库分页回归：翻页后刷新不再强制跳回第一页，分页交互恢复正常
- 修复媒体库分页大小设置：设置变更后可在已打开视图中立即生效
- 修复自动刷新重命名边界：媒体文件改名为非媒体/改回媒体时视图能正确刷新
- 修复隔离恢复流程：恢复时支持自动创建缺失目录并统一冲突校验与错误提示
- 修复未引用视图扫描并发问题：重复触发扫描时不再出现状态竞争
- 修复隔离管理恢复逻辑分叉：改为复用主插件 `restoreFile` 统一处理

### Changed
- 默认隔离目录从隐藏目录 `.obsidian-media-toolkit-trash` 调整为 `obsidian-media-toolkit-trash`
- 启动时自动迁移旧默认隔离目录到新目录并同步设置
- 媒体库与未引用视图统一支持图片/视频/音频/PDF 缩略图与回退图标
- 图片对齐语法统一为块包装格式 `===left|center|right=== ... ===`，并兼容清理旧写法

---

## [1.1.10] - 2026-03-07

### Fixed
- 修复 Windows 路径兼容问题：统一规范化路径分隔符，解决媒体库过滤、隔离目录加载/恢复、引用扫描异常
- 修复未引用检测误判：同时按文件名和规范化路径匹配，并使用 metadataCache 解析相对链接
- 修复隔离文件恢复逻辑：隔离文件名保存编码后的原始路径，兼容旧格式解析
- 修复隔离管理视图加载状态卡住问题（isLoading 未释放）
- 修复剪贴板错误处理：改为 Promise 异步捕获，避免未处理异常
- 修复 openImageInNotes 在读取单个 Markdown 文件失败时中断流程
- 修复 enablePreviewModal 设置未生效的问题
- 修复 build:release 在 Windows 下无法执行的问题（去除 Unix 风格环境变量写法）

### Changed
- 强化设置加载校验与类型兜底（布尔、枚举、数值范围）
- 安全删除策略调整：移动到隔离目录失败时不再自动永久删除源文件

---

## [1.1.2] - 2026-03-06

### Security
- 修复路径遍历漏洞：恢复文件、隔离文件夹操作全面添加 isPathSafe 校验
- 修复 XSS 漏洞：postProcessor 拦截 javascript:/data: 等危险协议 URL
- 修复 XSS 漏洞：imageAlignment toHTML 对 HTML 属性值做转义
- 修复 window.open 劫持风险：添加 noopener,noreferrer
- 修复原型污染：loadSettings 过滤 __proto__/constructor/prototype
- 修复 CSS 注入：loadExternalStyles 过滤 expression()/javascript: 模式
- 新增 utils/security.ts 共享安全工具模块（isPathSafe/isSafeUrl/escapeHtmlAttr）
- security.ts 拒绝空字符串输入防止绕过

### Fixed
- 修复 wikiLinkAliasPattern 正则逻辑错误，[[path.ext|alias]] 无法正确匹配
- 修复 MediaPreviewModal 文件不在列表时 index=-1 导致崩溃
- 修复 MediaPreviewModal 切换图片后导航栏和信息栏不更新
- 修复 UnreferencedImagesView 右键删除菜单传入不完整对象
- 修复 ImageLibraryView 文件夹前缀匹配误命中相似文件夹名
- 修复 ImageLibraryView 分页跳转输入空值导致 NaN
- 修复 i18n 占位符只替换第一个出现的问题
- 修复 i18n 无效语言参数可能导致崩溃
- 修复 formatFileSize 对负数/Infinity/小于1字节的边界处理
- 修复 trashCleanupDays 负值会导致所有隔离文件被删除
- 修复 getReferencedImages 单文件读取失败中断整批扫描
- 修复 restoreFile 翻译 key 不匹配和 openImageInNotes 多余逗号
- DeleteConfirmModal 移除重复的 formatFileSize，使用共享版本

### Changed
- 构建工具从 tsc 切换为 esbuild，输出单个 main.js（符合 Obsidian 插件标准）
- tsconfig.json 改为仅做类型检查（noEmit）
- loadSettings 增加 try/catch 容错和设置值校验（clamp trashCleanupDays/pageSize/thumbnailSize）
- Release workflow 升级 gh-release@v2，修正发布文件路径，增加 styles.css
- @types/node 移至 devDependencies
- 清理 git 中的编译产物（.d.ts.map），重新生成 package-lock.json

---

## [1.1.1] - 2026-03-06

### Added
- 提取 formatFileSize 到 utils/format.ts 工具函数
- 添加搜索防抖机制 (300ms)
- 批量删除/清空使用 Promise.all 并发处理
- ImageLibraryView pageSize 从 settings 读取
- 国际化完善（所有硬编码中文替换）
- 添加缓存刷新命令
- 提取文件扩展名到 utils/mediaTypes.ts 统一管理
- 设置变更同步（监听 setting-changed 事件）
- 排序后自动重置到第一页
- 隔离文件夹自动清理逻辑

### Fixed
- onunload 添加 TRASH_MANAGEMENT 视图清理
- 修复 main.ts 中命令名称硬编码问题
- 修复 Notice 消息硬编码问题

---

## [1.1.0] - 2026-03-06

### Added
- 中英双语国际化支持（zh/en/system跟随系统）
- 大Vault扫描进度提示
- 批量删除操作成功/失败计数反馈

### Changed
- 大Vault扫描性能优化：添加缓存机制（5分钟）+ 分批处理
- 隔离文件夹文件名格式变更（使用双下划线分隔符）

### Fixed
- 修复隔离文件夹文件名解析Bug（文件名含下划线时错误）
- 修复MediaPreviewModal键盘事件监听器内存泄漏
- 修复样式重复添加问题

### Removed
- 清理内部开发文件

---

## [1.0.0] - 2026-03-06

### Added
- 图片对齐功能（居左、居中、居右）
- 图片库网格视图
- 未引用图片检测功能
- 隔离文件夹管理
- 媒体预览Modal

---

## How to use this changelog

1. **Unreleased** section: Document changes that are not yet released
2. **Version entries**: Create a new section for each release with the version number and release date
3. **Categories**:
   - `Added`: New features
   - `Changed`: Changes to existing functionality
   - `Deprecated`: Features that will be removed in future releases
   - `Removed`: Features that have been removed
   - `Fixed`: Bug fixes
   - `Security`: Security-related changes

## Versioning

This project uses [Semantic Versioning](http://semver.org/). Given a version number `MAJOR.MINOR.PATCH`:

- `MAJOR` version: incompatible API changes
- `MINOR` version: new functionality in a backwards-compatible manner
- `PATCH` version: backwards-compatible bug fixes

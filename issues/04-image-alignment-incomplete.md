# Issue 4: 图片对齐功能实现矛盾且未连接

## 严重程度: P0 - 功能残缺

### 问题描述
utils/imageAlignment.ts 存在多个严重问题：

1. **同名导出冲突**: 同一个文件里同时 export type ImageAlignment = ... 和 export class ImageAlignment 同名

2. **读写风格不一致**:
   - applyAlignment() 先用正则尝试移除 `{ align : ... }`（冒号风格）
   - 但实际新增的是 `{align=center}`（等号风格）
   - getAlignment() 又只识别 `{ align : ... }`（冒号风格）
   - 结果：自己写进去的对齐标记，自己又读不出来

3. **功能未注册**:
   - main.ts 里注册的命令只有"图片库 / 查找未引用图片"
   - 没有看到任何"对齐"命令入口
   - 设置页也没有 alignment 相关设置

### 影响
"图片对齐"现在更像是丢在仓库里的未完成实验文件，而不是用户可用的功能。这会严重拉低插件可信度。

### 修复建议
选项A（推荐）: 完成实现
- 统一对齐语法风格（推荐使用 ===center=== 块语法，更符合 Markdown 习惯）
- 在 main.ts 中注册对齐相关命令
- 在设置页添加对齐选项

选项B: 移除未完成功能
- 删除 utils/imageAlignment.ts
- 从 README 中移除对齐功能的描述

### 参考资料
- [6] utils/imageAlignment.ts（对齐实现细节与自相矛盾点）
- [7] main.ts（命令注册）
- [8] settings.ts（现有设置项）

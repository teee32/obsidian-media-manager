# Issue 5: 未引用图片扫描逻辑存在严重误判

## 严重程度: P1 - 高风险误删

### 问题描述
getReferencedImages() 的正则表达式逻辑存在多个问题：

1. **Wiki 链接正则不完整**: 只匹配 `[[...png]]` 形式，不支持 `|alias` 的写法

2. **Markdown 图片正则简化**: `![](...png)` 只把路径最后的文件名塞进集合

3. **文件名对比问题**: 对比时用 file.name（只有文件名，不带目录）

### 会导致的误判场景

1. **同名图片误判**: vault 里如果存在同名图片（不同文件夹），按文件名匹配会误判引用关系

2. **带路径的 WikiLink 漏判**: `[[attachments/img.png]]` 会把 attachments/img.png 放进 referenced set，但对比时拿 img.png 去比，直接判成未引用

3. **带别名/尺寸的 WikiLink 漏判**: `[[img.png|300]]` / `[[img.png|alias]]` 这类常见写法，正则根本不吃，会漏掉引用

### 影响
用户使用"删除未引用图片"功能时，很可能把仍被引用的附件删掉，尤其是带路径/别名/同名的情况。

### 修复建议
- 使用 Obsidian 的 MetadataCache API 获取准确的引用关系，而不是正则扫描
- 或增强正则表达式，处理各种 WikiLink 变体
- 考虑使用 `app.metadataCache.getBacklinksForFile()` 获取准确的后向链接

### 参考资料
- [7] main.ts（命令注册、引用扫描）
- [9] getReferencedImages() 的 regex 逻辑细节

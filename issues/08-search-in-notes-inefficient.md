# Issue 8: 在笔记中查找功能低效 - 全库暴力字符串搜索

## 严重程度: P2 - 性能问题

### 问题描述
openImageInNotes() 的实现存在性能和精度问题：

1. **暴力扫描**: 会把所有 md 文件读出来，按行 `line.includes(imageFile.name)` 扫过去
2. **定位丢失**: 记录了匹配行号，但最后只是 `openLinkText(file.name, file.path, true)`，并没有跳转到具体行

### 影响

1. **性能问题**: 大库里会非常慢（大量 IO + split + 全扫描）
2. **精度问题**: 只要正文里提到同名字符串也会命中，不一定是图片引用（比如笔记中写了 "这个 bug 和 img.png 有关"）

### 修复建议
使用 Obsidian MetadataCache API 实现结构化定位：

```typescript
// 使用 backlinks 获取准确的引用关系
const backlinks = this.app.metadataCache.getBacklinksForFile(imageFile);
// backlinks 是一个 Map，key 是引用该文件的笔记
for (const [file, links] of backlinks) {
    // links 包含具体位置信息
    for (const link of links) {
        // link.position 包含行号和列号信息
    }
}
```

这样可以：
- 精确定位到引用位置
- 不需要扫描全库，性能更好
- 不会误判纯文本提及

### 参考资料
- [7] main.ts（命令注册、引用扫描、在笔记中查找实现）

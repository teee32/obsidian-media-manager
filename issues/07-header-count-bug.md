# Issue 7: 图片库 Header 计数存在逻辑 Bug

## 严重程度: P2 - 体验问题

### 问题描述
ImageLibraryView.ts 中，refreshImages() 的执行顺序有问题：

1. 先调用 renderHeader()
2. 之后才去读取图片文件并给 this.images 赋值

但 renderHeader() 的统计直接用 `this.images.length`

### 影响
用户很可能会看到"共 0 张图片"这种一眼劝退的小问题（除非刚好沿用了上一次的 images 状态）

### 修复建议
调整执行顺序：
```typescript
async refreshImages() {
    // 1. 先获取图片列表
    this.images = await this.getAllImageFiles();
    // 2. 再渲染 header（此时 images 已有数据）
    this.renderHeader();
    // 3. 最后渲染内容
    this.renderContent();
}
```

### 参考资料
- [11] ImageLibraryView.ts（图片库渲染/统计/菜单）

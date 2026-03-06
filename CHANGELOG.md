# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

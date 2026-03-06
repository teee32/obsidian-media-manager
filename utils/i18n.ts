/**
 * 国际化支持模块
 * 支持中文和英文
 */

export type Language = 'zh' | 'en';

export interface Translations {
	// 通用
	ok: string;
	cancel: string;
	delete: string;
	restore: string;
	confirm: string;
	success: string;
	error: string;

	// 视图名称
	mediaLibrary: string;
	unreferencedMedia: string;
	trashManagement: string;

	// 媒体库
	totalMediaFiles: string;
	noMediaFiles: string;
	searchPlaceholder: string;
	searchResults: string;

	// 未引用媒体
	unreferencedFound: string;
	allMediaReferenced: string;
	deleteToTrash: string;

	// 隔离文件夹
	trashEmpty: string;
	originalPath: string;
	deletedAt: string;
	confirmClearAll: string;

	// 操作
	openInNotes: string;
	copyPath: string;
	copyLink: string;
	openOriginal: string;
	preview: string;

	// 快捷键
	shortcuts: string;
	openLibrary: string;
	findUnreferenced: string;
	openTrash: string;

	// 扫描进度
	scanningReferences: string;
	scanComplete: string;
	filesScanned: string;

	// 批量操作
	batchDeleteComplete: string;
	batchDeleteProgress: string;
	batchRestoreComplete: string;

	// 设置页面
	pluginSettings: string;
	mediaFolder: string;
	mediaFolderDesc: string;
	thumbnailSize: string;
	thumbnailSizeDesc: string;
	thumbnailSmall: string;
	thumbnailMedium: string;
	thumbnailLarge: string;
	defaultSortBy: string;
	sortByDesc: string;
	sortByName: string;
	sortByDate: string;
	sortBySize: string;
	sortOrder: string;
	sortOrderDesc: string;
	sortAsc: string;
	sortDesc: string;
	showImageInfo: string;
	showImageInfoDesc: string;
	autoRefresh: string;
	autoRefreshDesc: string;
	defaultAlignment: string;
	alignmentDesc: string;
	alignLeft: string;
	alignCenter: string;
	alignRight: string;
	safeDeleteSettings: string;
	useTrashFolder: string;
	useTrashFolderDesc: string;
	trashFolderPath: string;
	trashFolderPathDesc: string;
	autoCleanupTrash: string;
	autoCleanupTrashDesc: string;
	autoCleanupComplete: string;
	cleanupDays: string;
	cleanupDaysDesc: string;
	mediaTypes: string;
	enableImageSupport: string;
	enableImageSupportDesc: string;
	enableVideoSupport: string;
	enableVideoSupportDesc: string;
	enableAudioSupport: string;
	enableAudioSupportDesc: string;
	enablePDFSupport: string;
	enablePDFSupportDesc: string;
	viewSettings: string;
	interfaceLanguage: string;
	languageDesc: string;
	languageSystem: string;
	pageSize: string;
	pageSizeDesc: string;
	enablePreviewModal: string;
	enablePreviewModalDesc: string;
	enableKeyboardNav: string;
	enableKeyboardNavDesc: string;
	keyboardShortcuts: string;
	shortcutsDesc: string;
	shortcutOpenLibrary: string;
	shortcutFindUnreferenced: string;
	shortcutOpenTrash: string;
	commands: string;
	commandsDesc: string;
	cmdOpenLibrary: string;
	cmdFindUnreferenced: string;
	cmdTrashManagement: string;
	cmdAlignLeft: string;
	cmdAlignCenter: string;
	cmdAlignRight: string;

	// Trash Management View
	loadingTrashFiles: string;
	trashFolderEmpty: string;
	filesInTrash: string;
	totalSize: string;
	trashManagementDesc: string;
	refresh: string;
	clearTrash: string;
	clearTrashTooltip: string;
	restoreTooltip: string;
	permanentDelete: string;
	permanentDeleteTooltip: string;
	deletedTime: string;
	confirmDeleteFile: string;
	confirmClearTrash: string;
	fileDeleted: string;
	restoreSuccess: string;
	restoreFailed: string;
	deleteFailed: string;
	fileNameCopied: string;
	originalPathCopied: string;

	// 未引用图片视图
	scanningUnreferenced: string;
	totalSizeLabel: string;
	scanError: string;
	unreferencedDesc: string;
	noFilesToDelete: string;
	processedFiles: string;
	processedFilesError: string;
	copyAllPaths: string;
	copiedFilePaths: string;

	// 图片库视图
	noMatchingFiles: string;
	prevPage: string;
	nextPage: string;
	pageInfo: string;
	selectFiles: string;
	selectAll: string;
	deselectAll: string;
	confirmDeleteSelected: string;
	deletedFiles: string;
	deleteFilesFailed: string;
	multiSelectMode: string;

	// 媒体预览
	unsupportedFileType: string;
	copyPathBtn: string;
	copyLinkBtn: string;
	findInNotes: string;
	pathCopied: string;
	linkCopied: string;

	// 图片对齐
	alignImageLeft: string;
	alignImageCenter: string;
	alignImageRight: string;
	selectImageFirst: string;
	selectImage: string;
	imageAlignedLeft: string;
	imageAlignedCenter: string;
	imageAlignedRight: string;

	// 隔离文件夹操作
	copiedFileName: string;
	copiedOriginalPath: string;
	notReferenced: string;
	movedToTrash: string;
	deletedFile: string;
	restoredFile: string;

	// 命令名称
	cmdImageLibrary: string;
	cmdFindUnreferencedImages: string;
	cmdRefreshCache: string;
	cmdAlignImageLeft: string;
	cmdAlignImageCenter: string;
	cmdAlignImageRight: string;
	cmdOpenMediaLibrary: string;
	cmdFindUnreferencedMedia: string;
	cmdOpenTrashManagement: string;

	// 删除操作
	deleteFailedWithName: string;
	deletedWithQuarantineFailed: string;
	operationFailed: string;
}

const zh: Translations = {
	// 通用
	ok: '确定',
	cancel: '取消',
	delete: '删除',
	restore: '恢复',
	confirm: '确认',
	success: '成功',
	error: '错误',

	// 视图名称
	mediaLibrary: '媒体库',
	unreferencedMedia: '未引用媒体',
	trashManagement: '隔离文件管理',

	// 媒体库
	totalMediaFiles: '共 {count} 个媒体文件',
	noMediaFiles: '未找到媒体文件',
	searchPlaceholder: '搜索文件名...',
	searchResults: '找到 {count} 个结果',

	// 未引用媒体
	unreferencedFound: '找到 {count} 个未引用的媒体文件',
	allMediaReferenced: '太棒了！所有媒体文件都已被引用',
	deleteToTrash: '文件将被移入隔离文件夹',

	// 隔离文件夹
	trashEmpty: '隔离文件夹为空',
	originalPath: '原始位置',
	deletedAt: '删除时间',
	confirmClearAll: '确定要清空隔离文件夹吗？',

	// 操作
	openInNotes: '在笔记中查找',
	copyPath: '复制文件路径',
	copyLink: '复制Markdown链接',
	openOriginal: '打开原始文件',
	preview: '预览',

	// 快捷键
	shortcuts: '快捷键',
	openLibrary: '打开媒体库',
	findUnreferenced: '查找未引用媒体',
	openTrash: '打开隔离文件管理',

	// 扫描进度
	scanningReferences: '正在扫描引用',
	scanComplete: '扫描完成',
	filesScanned: '个文件已扫描',

	// 批量操作
	batchDeleteComplete: '已删除 {count} 个文件',
	batchDeleteProgress: '正在删除 {current}/{total}',
	batchRestoreComplete: '已恢复 {count} 个文件',

	// 设置页面
	pluginSettings: '媒体工具箱插件设置',
	mediaFolder: '媒体文件夹',
	mediaFolderDesc: '指定要扫描的媒体文件夹路径（留空则扫描整个库）',
	thumbnailSize: '缩略图大小',
	thumbnailSizeDesc: '选择媒体库视图中缩略图的显示大小',
	thumbnailSmall: '小 (100px)',
	thumbnailMedium: '中 (150px)',
	thumbnailLarge: '大 (200px)',
	defaultSortBy: '默认排序方式',
	sortByDesc: '选择图片的默认排序方式',
	sortByName: '按名称',
	sortByDate: '按修改日期',
	sortBySize: '按文件大小',
	sortOrder: '排序顺序',
	sortOrderDesc: '选择升序或降序',
	sortAsc: '升序',
	sortDesc: '降序',
	showImageInfo: '显示图片信息',
	showImageInfoDesc: '在图片缩略图下方显示文件名和大小',
	autoRefresh: '自动刷新',
	autoRefreshDesc: '当库中的图片发生变化时自动刷新视图',
	defaultAlignment: '默认图片对齐方式',
	alignmentDesc: '插入图片时的默认对齐方式',
	alignLeft: '居左',
	alignCenter: '居中',
	alignRight: '居右',
	safeDeleteSettings: '安全删除设置',
	useTrashFolder: '使用隔离文件夹',
	useTrashFolderDesc: '删除文件时先移入隔离文件夹，而不是直接删除',
	trashFolderPath: '隔离文件夹',
	trashFolderPathDesc: '隔离文件夹的路径（相对路径）',
	autoCleanupTrash: '自动清理隔离文件夹',
	autoCleanupTrashDesc: '自动清理隔离文件夹中的旧文件',
	autoCleanupComplete: '自动清理完成，已删除 {count} 个文件',
	cleanupDays: '清理天数',
	cleanupDaysDesc: '隔离文件夹中的文件超过此天数后将自动删除',
	mediaTypes: '媒体类型',
	enableImageSupport: '启用图片支持',
	enableImageSupportDesc: '在媒体库中显示图片文件 (png, jpg, gif, webp, svg, bmp)',
	enableVideoSupport: '启用视频支持',
	enableVideoSupportDesc: '在媒体库中显示视频文件 (mp4, mov, avi, mkv, webm)',
	enableAudioSupport: '启用音频支持',
	enableAudioSupportDesc: '在媒体库中显示音频文件 (mp3, wav, ogg, m4a, flac)',
	enablePDFSupport: '启用 PDF 支持',
	enablePDFSupportDesc: '在媒体库中显示 PDF 文件',
	viewSettings: '视图设置',
	interfaceLanguage: '界面语言',
	languageDesc: '选择插件界面显示的语言',
	languageSystem: '跟随系统',
	pageSize: '分页大小',
	pageSizeDesc: '媒体库中每页显示的文件数量',
	enablePreviewModal: '启用预览 Modal',
	enablePreviewModalDesc: '点击媒体文件时打开预览窗口',
	enableKeyboardNav: '启用键盘导航',
	enableKeyboardNavDesc: '在预览窗口中使用方向键切换图片',
	keyboardShortcuts: '快捷键',
	shortcutsDesc: '插件支持的快捷键：',
	shortcutOpenLibrary: 'Ctrl+Shift+M - 打开媒体库',
	shortcutFindUnreferenced: 'Ctrl+Shift+U - 查找未引用媒体',
	shortcutOpenTrash: 'Ctrl+Shift+T - 打开隔离文件管理',
	commands: '快捷命令',
	commandsDesc: '在命令面板中使用以下命令：',
	cmdOpenLibrary: '媒体库 - 打开媒体库视图',
	cmdFindUnreferenced: '查找未引用媒体 - 查找未被任何笔记引用的媒体文件',
	cmdTrashManagement: '隔离文件管理 - 管理已删除的文件',
	cmdAlignLeft: '图片居左对齐 - 将选中图片居左对齐',
	cmdAlignCenter: '图片居中对齐 - 将选中图片居中对齐',
	cmdAlignRight: '图片居右对齐 - 将选中图片居右对齐',

	// Trash Management View
	loadingTrashFiles: '正在加载隔离文件...',
	trashFolderEmpty: '隔离文件夹为空',
	filesInTrash: '隔离文件夹中有 {count} 个文件',
	totalSize: '总计 {size}',
	trashManagementDesc: '已删除的文件会临时存放在这里，您可以恢复或彻底删除它们',
	refresh: '刷新',
	clearTrash: '清空隔离文件夹',
	clearTrashTooltip: '清空隔离文件夹',
	restoreTooltip: '恢复文件',
	permanentDelete: '彻底删除',
	permanentDeleteTooltip: '彻底删除',
	deletedTime: '删除时间',
	confirmDeleteFile: '确定要彻底删除 "{name}" 吗？此操作不可撤销。',
	confirmClearTrash: '确定要清空隔离文件夹吗？{count} 个文件将被彻底删除，此操作不可撤销。',
	fileDeleted: '已彻底删除: {name}',
	restoreSuccess: '已恢复: {name}',
	restoreFailed: '恢复失败: {message}',
	deleteFailed: '删除失败',
	fileNameCopied: '文件名已复制',
	originalPathCopied: '原始路径已复制',

	// 未引用图片视图
	scanningUnreferenced: '正在扫描未引用的媒体文件...',
	totalSizeLabel: '总计 {size}',
	scanError: '扫描图片时出错',
	unreferencedDesc: '以下媒体文件未被任何笔记引用，可能可以删除以释放空间',
	noFilesToDelete: '没有需要删除的图片',
	processedFiles: '已处理 {count} 个文件',
	processedFilesError: '处理 {errors} 个文件时出错',
	copyAllPaths: '复制所有路径',
	copiedFilePaths: '已复制 {count} 个文件路径',

	// 图片库视图
	noMatchingFiles: '没有匹配的文件',
	prevPage: '上一页',
	nextPage: '下一页',
	pageInfo: '第 {current} / {total} 页',
	selectFiles: '已选择 {count} 个文件',
	selectAll: '全选',
	deselectAll: '取消全选',
	confirmDeleteSelected: '确定要删除选中的 {count} 个文件吗？',
	deletedFiles: '已删除 {count} 个文件',
	deleteFilesFailed: '删除 {count} 个文件失败',
	multiSelectMode: '多选模式',

	// 媒体预览
	unsupportedFileType: '不支持预览此类型文件',
	copyPathBtn: '复制路径',
	copyLinkBtn: '复制链接',
	findInNotes: '在笔记中查找',
	pathCopied: '路径已复制',
	linkCopied: '链接已复制',

	// 图片对齐
	alignImageLeft: '图片居左对齐',
	alignImageCenter: '图片居中对齐',
	alignImageRight: '图片居右对齐',
	selectImageFirst: '请先选中一张图片',
	selectImage: '请选中图片',
	imageAlignedLeft: '图片已居左对齐',
	imageAlignedCenter: '图片已居中对齐',
	imageAlignedRight: '图片已居右对齐',

	// 隔离文件夹操作
	copiedFileName: '已复制文件名',
	copiedOriginalPath: '已复制原始路径',
	notReferenced: '该图片未被任何笔记引用',
	movedToTrash: '已移至隔离文件夹: {name}',
	deletedFile: '已删除: {name}',
	restoredFile: '已恢复文件',

	// 命令名称
	cmdImageLibrary: '图片库',
	cmdFindUnreferencedImages: '查找未引用图片',
	cmdRefreshCache: '刷新媒体引用缓存',
	cmdAlignImageLeft: '图片居左对齐',
	cmdAlignImageCenter: '图片居中对齐',
	cmdAlignImageRight: '图片居右对齐',
	cmdOpenMediaLibrary: '打开媒体库',
	cmdFindUnreferencedMedia: '查找未引用媒体',
	cmdOpenTrashManagement: '打开隔离文件管理',

	// 删除操作
	deleteFailedWithName: '删除失败: {name}',
	deletedWithQuarantineFailed: '已删除: {name}（隔离失败）',
	operationFailed: '操作失败: {name}'
};

const en: Translations = {
	// General
	ok: 'OK',
	cancel: 'Cancel',
	delete: 'Delete',
	restore: 'Restore',
	confirm: 'Confirm',
	success: 'Success',
	error: 'Error',

	// View names
	mediaLibrary: 'Media Library',
	unreferencedMedia: 'Unreferenced Media',
	trashManagement: 'Trash Management',

	// Media Library
	totalMediaFiles: '{count} media files',
	noMediaFiles: 'No media files found',
	searchPlaceholder: 'Search by filename...',
	searchResults: '{count} results found',

	// Unreferenced Media
	unreferencedFound: '{count} unreferenced media files found',
	allMediaReferenced: 'Great! All media files are referenced',
	deleteToTrash: 'Files will be moved to trash folder',

	// Trash Folder
	trashEmpty: 'Trash folder is empty',
	originalPath: 'Original location',
	deletedAt: 'Deleted at',
	confirmClearAll: 'Are you sure you want to empty the trash folder?',

	// Actions
	openInNotes: 'Find in Notes',
	copyPath: 'Copy Path',
	copyLink: 'Copy Link',
	openOriginal: 'Open Original',
	preview: 'Preview',

	// Shortcuts
	shortcuts: 'Shortcuts',
	openLibrary: 'Open Media Library',
	findUnreferenced: 'Find Unreferenced Media',
	openTrash: 'Open Trash Management',

	// Scanning progress
	scanningReferences: 'Scanning references',
	scanComplete: 'Scan complete',
	filesScanned: 'files scanned',

	// Batch operations
	batchDeleteComplete: '{count} files deleted',
	batchDeleteProgress: 'Deleting {current}/{total}',
	batchRestoreComplete: '{count} files restored',

	// Settings page
	pluginSettings: 'Media Toolkit Plugin Settings',
	mediaFolder: 'Media Folder',
	mediaFolderDesc: 'Specify the media folder path to scan (leave empty to scan entire vault)',
	thumbnailSize: 'Thumbnail Size',
	thumbnailSizeDesc: 'Choose thumbnail size in media library view',
	thumbnailSmall: 'Small (100px)',
	thumbnailMedium: 'Medium (150px)',
	thumbnailLarge: 'Large (200px)',
	defaultSortBy: 'Default Sort By',
	sortByDesc: 'Choose default sort method for images',
	sortOrder: 'Sort Order',
	sortOrderDesc: 'Choose ascending or descending order',
	sortByName: 'By Name',
	sortByDate: 'By Date',
	sortBySize: 'By Size',
	sortAsc: 'Ascending',
	sortDesc: 'Descending',
	showImageInfo: 'Show Image Info',
	showImageInfoDesc: 'Display filename and size below image thumbnails',
	autoRefresh: 'Auto Refresh',
	autoRefreshDesc: 'Automatically refresh view when images change in vault',
	defaultAlignment: 'Default Image Alignment',
	alignmentDesc: 'Default alignment when inserting images',
	alignLeft: 'Left',
	alignCenter: 'Center',
	alignRight: 'Right',
	safeDeleteSettings: 'Safe Delete Settings',
	useTrashFolder: 'Use Trash Folder',
	useTrashFolderDesc: 'Move files to trash folder instead of deleting directly',
	trashFolderPath: 'Trash Folder',
	trashFolderPathDesc: 'Path to trash folder (relative path)',
	autoCleanupTrash: 'Auto Cleanup Trash',
	autoCleanupTrashDesc: 'Automatically clean up old files in trash folder',
	autoCleanupComplete: 'Auto cleanup complete, deleted {count} files',
	cleanupDays: 'Cleanup Days',
	cleanupDaysDesc: 'Files older than this many days will be automatically deleted',
	mediaTypes: 'Media Types',
	enableImageSupport: 'Enable Image Support',
	enableImageSupportDesc: 'Show image files in media library (png, jpg, gif, webp, svg, bmp)',
	enableVideoSupport: 'Enable Video Support',
	enableVideoSupportDesc: 'Show video files in media library (mp4, mov, avi, mkv, webm)',
	enableAudioSupport: 'Enable Audio Support',
	enableAudioSupportDesc: 'Show audio files in media library (mp3, wav, ogg, m4a, flac)',
	enablePDFSupport: 'Enable PDF Support',
	enablePDFSupportDesc: 'Show PDF files in media library',
	viewSettings: 'View Settings',
	interfaceLanguage: 'Interface Language',
	languageDesc: 'Choose language for plugin interface',
	languageSystem: 'Follow System',
	pageSize: 'Page Size',
	pageSizeDesc: 'Number of files per page in media library',
	enablePreviewModal: 'Enable Preview Modal',
	enablePreviewModalDesc: 'Open preview window when clicking media files',
	enableKeyboardNav: 'Enable Keyboard Navigation',
	enableKeyboardNavDesc: 'Use arrow keys to navigate in preview window',
	keyboardShortcuts: 'Keyboard Shortcuts',
	shortcutsDesc: 'Plugin keyboard shortcuts:',
	shortcutOpenLibrary: 'Ctrl+Shift+M - Open Media Library',
	shortcutFindUnreferenced: 'Ctrl+Shift+U - Find Unreferenced Media',
	shortcutOpenTrash: 'Ctrl+Shift+T - Open Trash Management',
	commands: 'Commands',
	commandsDesc: 'Use these commands in command palette:',
	cmdOpenLibrary: 'Media Library - Open media library view',
	cmdFindUnreferenced: 'Find Unreferenced Media - Find media files not referenced by any notes',
	cmdTrashManagement: 'Trash Management - Manage deleted files',
	cmdAlignLeft: 'Align Image Left - Align selected image to left',
	cmdAlignCenter: 'Align Image Center - Center align selected image',
	cmdAlignRight: 'Align Image Right - Align selected image to right',

	// Trash Management View
	loadingTrashFiles: 'Loading trash files...',
	trashFolderEmpty: 'Trash folder is empty',
	filesInTrash: '{count} files in trash folder',
	totalSize: 'Total: {size}',
	trashManagementDesc: 'Deleted files are temporarily stored here. You can restore or permanently delete them.',
	refresh: 'Refresh',
	clearTrash: 'Empty Trash',
	clearTrashTooltip: 'Empty trash folder',
	restoreTooltip: 'Restore file',
	permanentDelete: 'Delete',
	permanentDeleteTooltip: 'Permanently delete',
	deletedTime: 'Deleted at',
	confirmDeleteFile: 'Are you sure you want to permanently delete "{name}"? This cannot be undone.',
	confirmClearTrash: 'Are you sure you want to empty the trash folder? {count} files will be permanently deleted. This cannot be undone.',
	fileDeleted: 'Permanently deleted: {name}',
	restoreSuccess: 'Restored: {name}',
	restoreFailed: 'Restore failed: {message}',
	deleteFailed: 'Delete failed',
	fileNameCopied: 'File name copied',
	originalPathCopied: 'Original path copied',

	// Unreferenced Images View
	scanningUnreferenced: 'Scanning unreferenced media files...',
	totalSizeLabel: 'Total: {size}',
	scanError: 'Error scanning images',
	unreferencedDesc: 'These media files are not referenced by any notes and can be deleted to free up space',
	noFilesToDelete: 'No files to delete',
	processedFiles: 'Processed {count} files',
	processedFilesError: 'Error processing {errors} files',
	copyAllPaths: 'Copy all paths',
	copiedFilePaths: 'Copied {count} file paths',

	// Image Library View
	noMatchingFiles: 'No matching files',
	prevPage: 'Previous',
	nextPage: 'Next',
	pageInfo: 'Page {current} / {total}',
	selectFiles: '{count} files selected',
	selectAll: 'Select All',
	deselectAll: 'Deselect All',
	confirmDeleteSelected: 'Are you sure you want to delete {count} selected files?',
	deletedFiles: '{count} files deleted',
	deleteFilesFailed: 'Failed to delete {count} files',
	multiSelectMode: 'Multi-select mode',

	// Media Preview
	unsupportedFileType: 'Preview not supported for this file type',
	copyPathBtn: 'Copy Path',
	copyLinkBtn: 'Copy Link',
	findInNotes: 'Find in Notes',
	pathCopied: 'Path copied',
	linkCopied: 'Link copied',

	// Image alignment
	alignImageLeft: 'Align Image Left',
	alignImageCenter: 'Align Image Center',
	alignImageRight: 'Align Image Right',
	selectImageFirst: 'Please select an image first',
	selectImage: 'Please select an image',
	imageAlignedLeft: 'Image aligned to left',
	imageAlignedCenter: 'Image centered',
	imageAlignedRight: 'Image aligned to right',

	// Trash folder operations
	copiedFileName: 'File name copied',
	copiedOriginalPath: 'Original path copied',
	notReferenced: 'This image is not referenced by any notes',
	movedToTrash: 'Moved to trash folder: {name}',
	deletedFile: 'Deleted: {name}',
	restoredFile: 'File restored',

	// Command names
	cmdImageLibrary: 'Image Library',
	cmdFindUnreferencedImages: 'Find Unreferenced Images',
	cmdRefreshCache: 'Refresh Media Reference Cache',
	cmdAlignImageLeft: 'Align Image Left',
	cmdAlignImageCenter: 'Align Image Center',
	cmdAlignImageRight: 'Align Image Right',
	cmdOpenMediaLibrary: 'Open Media Library',
	cmdFindUnreferencedMedia: 'Find Unreferenced Media',
	cmdOpenTrashManagement: 'Open Trash Management',

	// Delete operations
	deleteFailedWithName: 'Delete failed: {name}',
	deletedWithQuarantineFailed: 'Deleted: {name} (quarantine failed)',
	operationFailed: 'Operation failed: {name}'
};

const translations: Record<Language, Translations> = { zh, en };

/**
 * 获取翻译
 */
export function t(lang: Language, key: keyof Translations, params?: Record<string, string | number>): string {
	let text = translations[lang][key] || translations['zh'][key] || key;

	if (params) {
		Object.entries(params).forEach(([k, v]) => {
			text = text.replace(`{${k}}`, String(v));
		});
	}

	return text;
}

/**
 * 获取系统语言设置
 */
export function getSystemLanguage(): Language {
	const lang = navigator.language.toLowerCase();
	if (lang.startsWith('zh')) return 'zh';
	return 'en';
}

export default { t, getSystemLanguage, zh, en };

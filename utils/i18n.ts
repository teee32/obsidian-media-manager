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
	openTrash: '打开隔离文件管理'
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
	openTrash: 'Open Trash Management'
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

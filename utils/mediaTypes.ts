/**
 * 媒体类型扩展名统一管理
 * 集中管理所有支持的媒体文件扩展名，便于维护和扩展
 */

/**
 * 图片扩展名
 */
export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'] as const;

/**
 * 视频扩展名
 */
export const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'] as const;

/**
 * 音频扩展名
 */
export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'] as const;

/**
 * 文档扩展名
 */
export const DOCUMENT_EXTENSIONS = ['.pdf'] as const;

/**
 * 所有支持的图片扩展名（字符串数组）
 */
export const IMAGE_EXTENSIONS_STR: string[] = [...IMAGE_EXTENSIONS];

/**
 * 所有支持的视频扩展名（字符串数组）
 */
export const VIDEO_EXTENSIONS_STR: string[] = [...VIDEO_EXTENSIONS];

/**
 * 所有支持的音频扩展名（字符串数组）
 */
export const AUDIO_EXTENSIONS_STR: string[] = [...AUDIO_EXTENSIONS];

/**
 * 所有支持的文档扩展名（字符串数组）
 */
export const DOCUMENT_EXTENSIONS_STR: string[] = [...DOCUMENT_EXTENSIONS];

/**
 * 所有支持的媒体扩展名（字符串数组）
 */
export const ALL_MEDIA_EXTENSIONS: string[] = [
	...IMAGE_EXTENSIONS_STR,
	...VIDEO_EXTENSIONS_STR,
	...AUDIO_EXTENSIONS_STR,
	...DOCUMENT_EXTENSIONS_STR
];

/**
 * 扩展名到媒体类型的映射
 */
export const EXTENSION_TO_TYPE: Record<string, 'image' | 'video' | 'audio' | 'document'> = {
	// 图片
	'.png': 'image',
	'.jpg': 'image',
	'.jpeg': 'image',
	'.gif': 'image',
	'.webp': 'image',
	'.svg': 'image',
	'.bmp': 'image',
	// 视频
	'.mp4': 'video',
	'.mov': 'video',
	'.avi': 'video',
	'.mkv': 'video',
	'.webm': 'video',
	// 音频
	'.mp3': 'audio',
	'.wav': 'audio',
	'.ogg': 'audio',
	'.m4a': 'audio',
	'.flac': 'audio',
	// 文档
	'.pdf': 'document'
};

/**
 * 获取文件扩展名（小写）
 */
export function getFileExtension(filename: string): string {
	const lastDot = filename.lastIndexOf('.');
	if (lastDot === -1) return '';
	return filename.substring(lastDot).toLowerCase();
}

/**
 * 根据扩展名获取媒体类型
 */
export function getMediaType(filename: string): 'image' | 'video' | 'audio' | 'document' | null {
	const ext = getFileExtension(filename);
	return EXTENSION_TO_TYPE[ext] || null;
}

/**
 * 检查是否为图片文件
 */
export function isImageFile(filename: string): boolean {
	const ext = getFileExtension(filename);
	return IMAGE_EXTENSIONS_STR.includes(ext);
}

/**
 * 检查是否为视频文件
 */
export function isVideoFile(filename: string): boolean {
	const ext = getFileExtension(filename);
	return VIDEO_EXTENSIONS_STR.includes(ext);
}

/**
 * 检查是否为音频文件
 */
export function isAudioFile(filename: string): boolean {
	const ext = getFileExtension(filename);
	return AUDIO_EXTENSIONS_STR.includes(ext);
}

/**
 * 检查是否为文档文件
 */
export function isDocumentFile(filename: string): boolean {
	const ext = getFileExtension(filename);
	return DOCUMENT_EXTENSIONS_STR.includes(ext);
}

/**
 * 检查是否为支持的媒体文件
 */
export function isMediaFile(filename: string): boolean {
	const ext = getFileExtension(filename);
	return ALL_MEDIA_EXTENSIONS.includes(ext);
}

/**
 * 根据设置获取启用的媒体扩展名
 */
export function getEnabledExtensions(settings: {
	enableImages?: boolean;
	enableVideos?: boolean;
	enableAudio?: boolean;
	enablePDF?: boolean;
}): string[] {
	const extensions: string[] = [];

	if (settings.enableImages !== false) {
		extensions.push(...IMAGE_EXTENSIONS_STR);
	}
	if (settings.enableVideos !== false) {
		extensions.push(...VIDEO_EXTENSIONS_STR);
	}
	if (settings.enableAudio !== false) {
		extensions.push(...AUDIO_EXTENSIONS_STR);
	}
	if (settings.enablePDF !== false) {
		extensions.push(...DOCUMENT_EXTENSIONS_STR);
	}

	return extensions;
}

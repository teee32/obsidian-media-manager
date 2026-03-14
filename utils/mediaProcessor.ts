/**
 * Canvas 媒体处理器
 * 使用 Canvas API 实现图片压缩/转换/水印/裁剪
 * 纯浏览器实现，无原生依赖
 */

export interface ProcessOptions {
	quality?: number;        // 0-100, default 80
	maxWidth?: number;
	maxHeight?: number;
	format?: 'webp' | 'jpeg' | 'png';
	watermark?: {
		text: string;
		position: 'center' | 'bottom-right' | 'bottom-left';
		opacity: number;       // 0-1
		fontSize?: number;     // default 24
	};
	crop?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
}

export interface ProcessResult {
	blob: Blob;
	width: number;
	height: number;
	originalSize: number;
	newSize: number;
	format: string;
}

const MIME_MAP: Record<string, string> = {
	'webp': 'image/webp',
	'jpeg': 'image/jpeg',
	'jpg': 'image/jpeg',
	'png': 'image/png',
	'avif': 'image/avif'
};

/**
 * 检测浏览器是否支持某种输出格式
 */
export async function isFormatSupported(format: string): Promise<boolean> {
	const canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	const ctx = canvas.getContext('2d');
	if (!ctx) return false;
	ctx.fillRect(0, 0, 1, 1);

	return new Promise((resolve) => {
		canvas.toBlob(
			(blob) => resolve(blob !== null && blob.size > 0),
			MIME_MAP[format] || `image/${format}`
		);
	});
}

/**
 * 加载图片
 */
function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
		img.src = src;
	});
}

/**
 * 处理单张图片
 */
export async function processImage(
	src: string,
	originalSize: number,
	options: ProcessOptions = {}
): Promise<ProcessResult> {
	const img = await loadImage(src);

	let { width: srcW, height: srcH } = img;
	let drawX = 0;
	let drawY = 0;
	let drawW = srcW;
	let drawH = srcH;

	// 裁剪
	if (options.crop) {
		drawX = -options.crop.x;
		drawY = -options.crop.y;
		srcW = options.crop.width;
		srcH = options.crop.height;
	}

	// 缩放约束
	let targetW = srcW;
	let targetH = srcH;

	if (options.maxWidth || options.maxHeight) {
		const maxW = options.maxWidth || Infinity;
		const maxH = options.maxHeight || Infinity;
		const ratio = Math.min(maxW / srcW, maxH / srcH, 1);
		targetW = Math.round(srcW * ratio);
		targetH = Math.round(srcH * ratio);
	}

	const canvas = document.createElement('canvas');
	canvas.width = targetW;
	canvas.height = targetH;

	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Cannot get canvas context');

	// 绘制图片
	if (options.crop) {
		const scaleX = targetW / srcW;
		const scaleY = targetH / srcH;
		ctx.drawImage(
			img,
			options.crop.x, options.crop.y, options.crop.width, options.crop.height,
			0, 0, targetW, targetH
		);
	} else {
		ctx.drawImage(img, 0, 0, targetW, targetH);
	}

	// 水印
	if (options.watermark?.text) {
		const wm = options.watermark;
		const fontSize = wm.fontSize || Math.max(16, Math.round(targetW / 30));

		ctx.save();
		ctx.globalAlpha = wm.opacity;
		ctx.font = `${fontSize}px sans-serif`;
		ctx.fillStyle = '#ffffff';
		ctx.strokeStyle = '#000000';
		ctx.lineWidth = 2;

		const textMetrics = ctx.measureText(wm.text);
		let textX: number;
		let textY: number;

		switch (wm.position) {
			case 'center':
				textX = (targetW - textMetrics.width) / 2;
				textY = targetH / 2 + fontSize / 2;
				break;
			case 'bottom-left':
				textX = 20;
				textY = targetH - 20;
				break;
			case 'bottom-right':
			default:
				textX = targetW - textMetrics.width - 20;
				textY = targetH - 20;
				break;
		}

		ctx.strokeText(wm.text, textX, textY);
		ctx.fillText(wm.text, textX, textY);
		ctx.restore();
	}

	// 输出格式和质量
	const format = options.format || 'webp';
	const quality = (options.quality ?? 80) / 100;
	const mimeType = MIME_MAP[format] || 'image/webp';

	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(b) => {
				if (b) resolve(b);
				else reject(new Error('Canvas toBlob returned null'));
			},
			mimeType,
			quality
		);
	});

	return {
		blob,
		width: targetW,
		height: targetH,
		originalSize,
		newSize: blob.size,
		format
	};
}

/**
 * 批量处理图片
 */
export async function batchProcess(
	files: Array<{ src: string; originalSize: number; name: string }>,
	options: ProcessOptions,
	onProgress?: (processed: number, total: number, currentName: string) => void
): Promise<Array<{ name: string; result: ProcessResult | null; error?: string }>> {
	const results: Array<{ name: string; result: ProcessResult | null; error?: string }> = [];

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		if (onProgress) onProgress(i, files.length, file.name);

		try {
			const result = await processImage(file.src, file.originalSize, options);
			results.push({ name: file.name, result });
		} catch (error) {
			results.push({
				name: file.name,
				result: null,
				error: (error as Error).message
			});
		}
	}

	if (onProgress) onProgress(files.length, files.length, '');

	return results;
}

/**
 * 从视频截取帧作为缩略图
 */
export function extractVideoFrame(
	videoSrc: string,
	seekTime: number = 1
): Promise<{ blob: Blob; width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const video = document.createElement('video');
		video.crossOrigin = 'anonymous';
		video.muted = true;
		video.preload = 'metadata';

		video.addEventListener('loadedmetadata', () => {
			video.currentTime = Math.min(seekTime, video.duration * 0.1);
		});

		video.addEventListener('seeked', () => {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;

				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Cannot get canvas context'));
					return;
				}

				ctx.drawImage(video, 0, 0);

				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve({
								blob,
								width: video.videoWidth,
								height: video.videoHeight
							});
						} else {
							reject(new Error('Video frame extraction failed'));
						}
					},
					'image/webp',
					0.8
				);
			} catch (error) {
				reject(error);
			}
		});

		video.addEventListener('error', () => {
			reject(new Error(`Failed to load video: ${videoSrc}`));
		});

		video.src = videoSrc;
	});
}

/**
 * 获取输出格式的文件扩展名
 */
export function getFormatExtension(format: string): string {
	switch (format) {
		case 'jpeg': return '.jpg';
		case 'webp': return '.webp';
		case 'png': return '.png';
		case 'avif': return '.avif';
		default: return `.${format}`;
	}
}

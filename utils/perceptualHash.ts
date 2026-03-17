/**
 * 感知哈希去重模块
 * 使用 DCT pHash + dHash 组合哈希实现像素级图片去重
 * 纯浏览器 Canvas API 实现，无外部依赖
 */

const DEFAULT_IMAGE_LOAD_TIMEOUT = 8000;
const HASH_BACKGROUND_RGB = 255;
const ALPHA_CONTENT_THRESHOLD = 8;

interface ImageBounds {
	left: number;
	top: number;
	width: number;
	height: number;
}

interface SourceBitmap {
	canvas: HTMLCanvasElement;
	imageData: ImageData;
	bounds: ImageBounds;
	hasTransparency: boolean;
}

/**
 * 计算透明图片的有效内容区域。
 * 这样可以减少大面积透明留白对哈希结果的干扰。
 */
function analyzeImageData(imageData: ImageData): { bounds: ImageBounds; hasTransparency: boolean } {
	const { data, width, height } = imageData;
	let left = width;
	let top = height;
	let right = -1;
	let bottom = -1;
	let hasTransparency = false;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const alpha = data[(y * width + x) * 4 + 3];
			if (alpha < 255) {
				hasTransparency = true;
			}
			if (alpha <= ALPHA_CONTENT_THRESHOLD) continue;

			if (x < left) left = x;
			if (y < top) top = y;
			if (x > right) right = x;
			if (y > bottom) bottom = y;
		}
	}

	if (right < left || bottom < top) {
		return {
			bounds: { left: 0, top: 0, width, height },
			hasTransparency
		};
	}

	return {
		bounds: {
			left,
			top,
			width: right - left + 1,
			height: bottom - top + 1
		},
		hasTransparency
	};
}

/**
 * 读取原图像素数据，并预先分析透明区域与有效内容边界。
 */
function captureSourceBitmap(img: HTMLImageElement): SourceBitmap {
	const sourceCanvas = document.createElement('canvas');
	sourceCanvas.width = img.naturalWidth || img.width;
	sourceCanvas.height = img.naturalHeight || img.height;
	const sourceCtx = sourceCanvas.getContext('2d')!;
	sourceCtx.drawImage(img, 0, 0);

	const sourceImageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
	const { bounds, hasTransparency } = analyzeImageData(sourceImageData);

	return {
		canvas: sourceCanvas,
		imageData: sourceImageData,
		bounds,
		hasTransparency
	};
}

/**
 * 获取图片的灰度像素数据。
 * 对透明 PNG 会先在白底上合成，再裁掉透明留白，避免透明背景与黑色图形被误认为同一种像素。
 */
function getGrayscaleData(source: SourceBitmap, width: number, height: number): number[] {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = `rgb(${HASH_BACKGROUND_RGB}, ${HASH_BACKGROUND_RGB}, ${HASH_BACKGROUND_RGB})`;
	ctx.fillRect(0, 0, width, height);
	ctx.drawImage(
		source.canvas,
		source.bounds.left,
		source.bounds.top,
		source.bounds.width,
		source.bounds.height,
		0,
		0,
		width,
		height
	);

	const imageData = ctx.getImageData(0, 0, width, height);
	const data = imageData.data;
	const gray: number[] = [];

	for (let i = 0; i < data.length; i += 4) {
		gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
	}

	return gray;
}

/**
 * 简化 DCT 变换（仅计算低频分量）
 */
function dct2d(matrix: number[], size: number, outputSize: number): number[] {
	const result: number[] = new Array(outputSize * outputSize);

	for (let u = 0; u < outputSize; u++) {
		for (let v = 0; v < outputSize; v++) {
			let sum = 0;
			for (let x = 0; x < size; x++) {
				for (let y = 0; y < size; y++) {
					sum += matrix[x * size + y] *
						Math.cos(Math.PI * (2 * x + 1) * u / (2 * size)) *
						Math.cos(Math.PI * (2 * y + 1) * v / (2 * size));
				}
			}
			result[u * outputSize + v] = sum;
		}
	}

	return result;
}

/**
 * DCT pHash: 32×32灰度 → DCT → 取8×8低频 → 中位数阈值 → 64-bit hex
 */
function computePHash(source: SourceBitmap): string {
	const SIZE = 32;
	const LOW_FREQ = 8;

	const gray = getGrayscaleData(source, SIZE, SIZE);
	const dctCoeffs = dct2d(gray, SIZE, LOW_FREQ);

	// 排除 DC 分量 (0,0)
	const values = dctCoeffs.slice(1);
	const sorted = [...values].sort((a, b) => a - b);
	const median = sorted[Math.floor(sorted.length / 2)];

	// 生成 64-bit 哈希
	let hash = '';
	for (let i = 0; i < LOW_FREQ * LOW_FREQ; i++) {
		hash += dctCoeffs[i] > median ? '1' : '0';
	}

	return binaryToHex(hash);
}

/**
 * dHash: 9×8灰度 → 水平差分 → 64-bit hex
 */
function computeDHash(source: SourceBitmap): string {
	const gray = getGrayscaleData(source, 9, 8);
	let hash = '';

	for (let y = 0; y < 8; y++) {
		for (let x = 0; x < 8; x++) {
			hash += gray[y * 9 + x] < gray[y * 9 + x + 1] ? '1' : '0';
		}
	}

	return binaryToHex(hash);
}

/**
 * 二进制字符串转十六进制
 */
function binaryToHex(binary: string): string {
	let hex = '';
	for (let i = 0; i < binary.length; i += 4) {
		hex += parseInt(binary.substring(i, i + 4), 2).toString(16);
	}
	return hex;
}

/**
 * 计算透明图像的轮廓哈希。
 * 直接对 alpha 蒙版采样，比在透明背景上做灰度哈希更适合图标类素材。
 */
function computeAlphaMaskHash(source: SourceBitmap): string {
	const SIZE = 16;
	const canvas = document.createElement('canvas');
	canvas.width = SIZE;
	canvas.height = SIZE;
	const ctx = canvas.getContext('2d')!;
	ctx.clearRect(0, 0, SIZE, SIZE);
	ctx.drawImage(
		source.canvas,
		source.bounds.left,
		source.bounds.top,
		source.bounds.width,
		source.bounds.height,
		0,
		0,
		SIZE,
		SIZE
	);
	const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
	let binary = '';
	for (let i = 0; i < data.length; i += 4) {
		binary += data[i + 3] > ALPHA_CONTENT_THRESHOLD ? '1' : '0';
	}
	return binaryToHex(binary);
}

/**
 * 计算透明图像的粗颜色签名。
 * 颜色量化后可以容忍轻微抗锯齿差异，同时避免“同轮廓不同颜色”被当成完全重复。
 */
function computeQuantizedColorHash(source: SourceBitmap): string {
	const { data } = source.imageData;
	let visiblePixels = 0;
	let rTotal = 0;
	let gTotal = 0;
	let bTotal = 0;

	for (let i = 0; i < data.length; i += 4) {
		const alpha = data[i + 3];
		if (alpha <= ALPHA_CONTENT_THRESHOLD) continue;

		rTotal += data[i];
		gTotal += data[i + 1];
		bTotal += data[i + 2];
		visiblePixels++;
	}

	if (visiblePixels === 0) {
		return '000';
	}

	const quantize = (value: number): string => {
		const bucket = Math.max(0, Math.min(15, Math.round(value / 17)));
		return bucket.toString(16);
	};

	return [
		quantize(rTotal / visiblePixels),
		quantize(gTotal / visiblePixels),
		quantize(bTotal / visiblePixels)
	].join('');
}

export interface ImageHash {
	mode: 'opaque' | 'transparent';
	hashes: string[];
}

/**
 * 计算图片哈希。
 * 透明图优先使用 alpha 蒙版轮廓 + 粗颜色签名；普通图继续使用 pHash + dHash。
 */
export async function computePerceptualHash(imageSrc: string): Promise<ImageHash> {
	const img = await loadImage(imageSrc);
	const source = captureSourceBitmap(img);

	if (source.hasTransparency) {
		return {
			mode: 'transparent',
			hashes: [
				computeAlphaMaskHash(source),
				computeQuantizedColorHash(source)
			]
		};
	}

	return {
		mode: 'opaque',
		hashes: [
			computePHash(source),
			computeDHash(source)
		]
	};
}

/**
 * 从 ArrayBuffer 计算哈希
 */
export async function computeHashFromBuffer(buffer: ArrayBuffer, mimeType: string = 'image/png'): Promise<ImageHash> {
	const blob = new Blob([buffer], { type: mimeType });
	const url = URL.createObjectURL(blob);
	try {
		return await computePerceptualHash(url);
	} finally {
		URL.revokeObjectURL(url);
	}
}

/**
 * 加载图片
 */
function loadImage(src: string, timeoutMs: number = DEFAULT_IMAGE_LOAD_TIMEOUT): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		let settled = false;
		const timer = setTimeout(() => {
			if (settled) return;
			settled = true;
			// Best-effort abort to avoid hanging requests
			img.src = '';
			reject(new Error(`Failed to load image (timeout): ${src}`));
		}, timeoutMs);

		img.crossOrigin = 'anonymous';
		img.onload = () => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve(img);
		};
		img.onerror = () => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			reject(new Error(`Failed to load image: ${src}`));
		};
		img.src = src;
	});
}

/**
 * 计算两个哈希的汉明距离
 */
export function hammingDistance(h1: string, h2: string): number {
	if (h1.length !== h2.length) {
		throw new Error(`Hash length mismatch: ${h1.length} vs ${h2.length}`);
	}

	let distance = 0;
	for (let i = 0; i < h1.length; i++) {
		const n1 = parseInt(h1[i], 16);
		const n2 = parseInt(h2[i], 16);
		let xor = n1 ^ n2;
		while (xor) {
			distance += xor & 1;
			xor >>= 1;
		}
	}

	return distance;
}

/**
 * 计算两个哈希的相似度百分比
 */
function hashSegmentSimilarity(h1: string, h2: string): number {
	const totalBits = h1.length * 4; // 每个 hex 字符 4 bits
	const distance = hammingDistance(h1, h2);
	return Math.round((1 - distance / totalBits) * 100);
}

/**
 * 计算两个图片哈希的相似度百分比。
 * 透明图更看重轮廓，一般图片沿用原来的 pHash + dHash 组合。
 */
export function hashSimilarity(h1: ImageHash, h2: ImageHash): number {
	if (h1.mode !== h2.mode) {
		return 0;
	}

	if (h1.mode === 'transparent') {
		const shapeSimilarity = hashSegmentSimilarity(h1.hashes[0], h2.hashes[0]);
		const colorSimilarity = hashSegmentSimilarity(h1.hashes[1], h2.hashes[1]);
		return Math.round(shapeSimilarity * 0.8 + colorSimilarity * 0.2);
	}

	const pHashSimilarity = hashSegmentSimilarity(h1.hashes[0], h2.hashes[0]);
	const dHashSimilarity = hashSegmentSimilarity(h1.hashes[1], h2.hashes[1]);
	return Math.round((pHashSimilarity + dHashSimilarity) / 2);
}

/**
 * 重复组
 */
export interface DuplicateGroup {
	hash: ImageHash;
	files: Array<{ path: string; hash: ImageHash; similarity: number }>;
}

/**
 * 从哈希映射中查找重复组
 */
export function findDuplicateGroups(
	hashMap: Map<string, ImageHash>,
	threshold: number = 90
): DuplicateGroup[] {
	const entries = Array.from(hashMap.entries());
	const visited = new Set<string>();
	const groups: DuplicateGroup[] = [];

	for (let i = 0; i < entries.length; i++) {
		const [path1, hash1] = entries[i];
		if (visited.has(path1)) continue;

		const group: DuplicateGroup = {
			hash: hash1,
			files: [{ path: path1, hash: hash1, similarity: 100 }]
		};

		for (let j = i + 1; j < entries.length; j++) {
			const [path2, hash2] = entries[j];
			if (visited.has(path2)) continue;

			const similarity = hashSimilarity(hash1, hash2);
			if (similarity >= threshold) {
				group.files.push({ path: path2, hash: hash2, similarity });
				visited.add(path2);
			}
		}

		if (group.files.length > 1) {
			visited.add(path1);
			groups.push(group);
		}
	}

	return groups;
}

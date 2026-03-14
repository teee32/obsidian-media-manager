/**
 * 纯 JS EXIF 解析器
 * 从 JPEG 文件的 APP1 段中解析 TIFF IFD，提取关键 EXIF 信息
 * 无外部依赖
 */

export interface ExifData {
	dateTimeOriginal?: string;  // YYYY:MM:DD HH:mm:ss
	make?: string;             // 相机品牌
	model?: string;            // 相机型号
	imageWidth?: number;
	imageHeight?: number;
	orientation?: number;
}

// EXIF tag IDs
const TAG_DATE_TIME_ORIGINAL = 0x9003;
const TAG_MAKE = 0x010F;
const TAG_MODEL = 0x0110;
const TAG_IMAGE_WIDTH = 0xA002;
const TAG_IMAGE_HEIGHT = 0xA003;
const TAG_ORIENTATION = 0x0112;
const TAG_EXIF_IFD = 0x8769;

/**
 * 从 ArrayBuffer 解析 EXIF 数据
 */
export function parseExif(buffer: ArrayBuffer): ExifData {
	const view = new DataView(buffer);
	const result: ExifData = {};

	// 检查 JPEG SOI 标记
	if (view.getUint16(0) !== 0xFFD8) {
		return result;
	}

	let offset = 2;
	const length = Math.min(buffer.byteLength, 65536); // 只扫描前 64KB

	while (offset < length) {
		if (view.getUint8(offset) !== 0xFF) break;

		const marker = view.getUint8(offset + 1);
		offset += 2;

		// APP1 段（EXIF 数据）
		if (marker === 0xE1) {
			const segmentLength = view.getUint16(offset);

			// 检查 "Exif\0\0" 标识
			if (segmentLength > 8 &&
				view.getUint32(offset + 2) === 0x45786966 && // "Exif"
				view.getUint16(offset + 6) === 0x0000) {

				const tiffOffset = offset + 8;
				parseTiff(view, tiffOffset, result);
			}

			return result;
		}

		// 其他段：跳过
		if (marker >= 0xE0 && marker <= 0xEF || marker === 0xFE) {
			const segmentLength = view.getUint16(offset);
			offset += segmentLength;
		} else if (marker === 0xDA) {
			// SOS 标记，不再有 EXIF
			break;
		} else {
			// 尝试跳过
			if (offset + 2 <= length) {
				const segmentLength = view.getUint16(offset);
				offset += segmentLength;
			} else {
				break;
			}
		}
	}

	return result;
}

/**
 * 解析 TIFF 头和 IFD
 */
function parseTiff(view: DataView, tiffStart: number, result: ExifData): void {
	if (tiffStart + 8 > view.byteLength) return;

	// 字节序标记
	const byteOrder = view.getUint16(tiffStart);
	const littleEndian = byteOrder === 0x4949; // "II"
	if (byteOrder !== 0x4949 && byteOrder !== 0x4D4D) return; // 非 "II" 也非 "MM"

	// TIFF 版本号（应为 42）
	if (view.getUint16(tiffStart + 2, littleEndian) !== 42) return;

	// IFD0 偏移
	const ifd0Offset = view.getUint32(tiffStart + 4, littleEndian);
	parseIFD(view, tiffStart, tiffStart + ifd0Offset, littleEndian, result, true);
}

/**
 * 解析 IFD（Image File Directory）
 */
function parseIFD(
	view: DataView,
	tiffStart: number,
	ifdOffset: number,
	littleEndian: boolean,
	result: ExifData,
	followExifIFD: boolean
): void {
	if (ifdOffset + 2 > view.byteLength) return;

	const entryCount = view.getUint16(ifdOffset, littleEndian);
	let offset = ifdOffset + 2;

	for (let i = 0; i < entryCount; i++) {
		if (offset + 12 > view.byteLength) break;

		const tag = view.getUint16(offset, littleEndian);
		const type = view.getUint16(offset + 2, littleEndian);
		const count = view.getUint32(offset + 4, littleEndian);
		const valueOffset = offset + 8;

		switch (tag) {
			case TAG_MAKE:
				result.make = readStringValue(view, tiffStart, valueOffset, type, count, littleEndian);
				break;
			case TAG_MODEL:
				result.model = readStringValue(view, tiffStart, valueOffset, type, count, littleEndian);
				break;
			case TAG_ORIENTATION:
				result.orientation = readShortValue(view, valueOffset, littleEndian);
				break;
			case TAG_DATE_TIME_ORIGINAL:
				result.dateTimeOriginal = readStringValue(view, tiffStart, valueOffset, type, count, littleEndian);
				break;
			case TAG_IMAGE_WIDTH:
				result.imageWidth = readLongOrShort(view, valueOffset, type, littleEndian);
				break;
			case TAG_IMAGE_HEIGHT:
				result.imageHeight = readLongOrShort(view, valueOffset, type, littleEndian);
				break;
			case TAG_EXIF_IFD:
				if (followExifIFD) {
					const exifOffset = view.getUint32(valueOffset, littleEndian);
					parseIFD(view, tiffStart, tiffStart + exifOffset, littleEndian, result, false);
				}
				break;
		}

		offset += 12;
	}
}

function readShortValue(view: DataView, offset: number, littleEndian: boolean): number {
	if (offset + 2 > view.byteLength) return 0;
	return view.getUint16(offset, littleEndian);
}

function readLongOrShort(view: DataView, offset: number, type: number, littleEndian: boolean): number {
	if (type === 3) { // SHORT
		return readShortValue(view, offset, littleEndian);
	}
	if (offset + 4 > view.byteLength) return 0;
	return view.getUint32(offset, littleEndian);
}

function readStringValue(
	view: DataView,
	tiffStart: number,
	valueOffset: number,
	type: number,
	count: number,
	littleEndian: boolean
): string {
	if (type !== 2) return ''; // ASCII type

	let dataOffset: number;
	if (count <= 4) {
		dataOffset = valueOffset;
	} else {
		if (valueOffset + 4 > view.byteLength) return '';
		dataOffset = tiffStart + view.getUint32(valueOffset, littleEndian);
	}

	if (dataOffset + count > view.byteLength) return '';

	let str = '';
	for (let i = 0; i < count - 1; i++) { // -1 to exclude null terminator
		const charCode = view.getUint8(dataOffset + i);
		if (charCode === 0) break;
		str += String.fromCharCode(charCode);
	}

	return str.trim();
}

/**
 * 从 EXIF 日期字符串解析 Date 对象
 * 格式: "YYYY:MM:DD HH:mm:ss"
 */
export function parseExifDate(dateStr: string): Date | null {
	const match = dateStr.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
	if (!match) return null;

	const [, year, month, day, hour, minute, second] = match;
	return new Date(
		parseInt(year), parseInt(month) - 1, parseInt(day),
		parseInt(hour), parseInt(minute), parseInt(second)
	);
}

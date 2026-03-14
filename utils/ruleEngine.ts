/**
 * 规则引擎：基于日期 + 类型 + EXIF 信息自动整理媒体文件
 */

import { TFile } from 'obsidian';
import { OrganizeRule } from '../settings';
import { getFileExtension, getMediaType } from './mediaTypes';
import { ExifData, parseExifDate } from './exifReader';

export interface OrganizeContext {
	file: TFile;
	date: Date;
	exif?: ExifData;
	tags?: string[];
}

export interface OrganizeTarget {
	originalPath: string;
	newPath: string;
	newName: string;
}

/**
 * 查找匹配的第一条规则
 */
export function findMatchingRule(
	rules: OrganizeRule[],
	file: TFile,
	metadata?: { exif?: ExifData; tags?: string[] }
): OrganizeRule | null {
	const ext = getFileExtension(file.name).replace('.', '').toLowerCase();

	for (const rule of rules) {
		if (!rule.enabled) continue;

		// 检查扩展名匹配
		if (rule.matchExtensions) {
			const allowedExts = rule.matchExtensions
				.split(',')
				.map(e => e.trim().toLowerCase());

			if (!allowedExts.includes(ext)) continue;
		}

		return rule;
	}

	return null;
}

/**
 * 根据规则和上下文计算目标路径
 */
export function computeTarget(rule: OrganizeRule, ctx: OrganizeContext): OrganizeTarget {
	const ext = getFileExtension(ctx.file.name);
	const baseName = ctx.file.name.replace(/\.[^.]+$/, '');
	const mediaType = getMediaType(ctx.file.name) || 'other';

	// 优先使用 EXIF 日期
	let date = ctx.date;
	if (ctx.exif?.dateTimeOriginal) {
		const exifDate = parseExifDate(ctx.exif.dateTimeOriginal);
		if (exifDate) date = exifDate;
	}

	const year = String(date.getFullYear());
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	const camera = ctx.exif?.make
		? `${ctx.exif.make}${ctx.exif.model ? ' ' + ctx.exif.model : ''}`
		: 'Unknown';

	const tag = ctx.tags?.[0] || 'untagged';

	const vars: Record<string, string> = {
		'{year}': year,
		'{month}': month,
		'{day}': day,
		'{ext}': ext.replace('.', ''),
		'{name}': baseName,
		'{camera}': sanitizeFileName(camera),
		'{type}': mediaType,
		'{tag}': sanitizeFileName(tag)
	};

	// 展开路径模板
	let newDir = rule.pathTemplate;
	for (const [key, value] of Object.entries(vars)) {
		newDir = newDir.replace(new RegExp(escapeRegex(key), 'g'), value);
	}

	// 展开文件名模板
	let newName = rule.renameTemplate || '{name}';
	for (const [key, value] of Object.entries(vars)) {
		newName = newName.replace(new RegExp(escapeRegex(key), 'g'), value);
	}

	// 确保文件名有扩展名
	if (!newName.endsWith(ext)) {
		newName = newName + ext;
	}

	// 清理路径
	newDir = newDir.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');

	const newPath = newDir ? `${newDir}/${newName}` : newName;

	return {
		originalPath: ctx.file.path,
		newPath,
		newName
	};
}

/**
 * 清理文件名中的非法字符
 */
function sanitizeFileName(name: string): string {
	return name
		.replace(/[/\\:*?"<>|]/g, '_')
		.replace(/\s+/g, '_')
		.replace(/_+/g, '_')
		.trim();
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

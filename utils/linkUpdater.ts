/**
 * 链接更新工具
 * 用于在文件移动或删除时按 Obsidian 的真实解析结果更新笔记中的引用
 */

import { App, TFile, parseLinktext } from 'obsidian';
import { getFileNameFromPath, getParentPath, normalizeVaultPath, safeDecodeURIComponent } from './path';

const WIKI_LINK_PATTERN = /(!?\[\[)([^\]|]+)(\|[^\]]*)?(\]\])/g;
const MARKDOWN_LINK_PATTERN = /(!?\[[^\]]*\]\()([^)]+)(\))/g;
type LinkPathStyle = 'basename' | 'relative' | 'vault' | 'absolute';

/**
 * 更新所有笔记中的文件链接
 * @param app Obsidian app 实例
 * @param oldPath 旧文件路径
 * @param newPath 新文件路径
 */
export async function updateLinksInVault(
	app: App,
	oldPath: string,
	newPath: string
): Promise<number> {
	const normalizedOldPath = normalizeVaultPath(oldPath).toLowerCase();
	const normalizedNewPath = normalizeVaultPath(newPath);
	if (!normalizedOldPath || !normalizedNewPath || normalizedOldPath === normalizedNewPath.toLowerCase()) {
		return 0;
	}

	const newFile = app.vault.getAbstractFileByPath(normalizedNewPath);
	if (!(newFile instanceof TFile)) {
		return 0;
	}

	const markdownFiles = app.vault.getMarkdownFiles();
	let updatedCount = 0;

	for (const file of markdownFiles) {
		const content = await app.vault.read(file);
		const newContent = updateLinksInContent(app, file, content, normalizedOldPath, newFile);

		if (newContent !== content) {
			await app.vault.modify(file, newContent);
			updatedCount++;
		}
	}

	return updatedCount;
}

/**
 * 更新文本内容中的文件链接
 */
export function updateLinksInContent(
	app: App,
	sourceFile: TFile,
	content: string,
	oldPath: string,
	newFile: TFile
): string {
	const normalizedNewPath = normalizeVaultPath(newFile.path);

	content = content.replace(WIKI_LINK_PATTERN, (fullMatch, prefix, linktext, alias = '', suffix) => {
		const parsed = parseLinktext(linktext);
		const resolvedPath = resolveLinkDestination(app, parsed.path, sourceFile.path);
		if (!shouldRewriteLink(parsed.path, resolvedPath, oldPath)) {
			return fullMatch;
		}

		const replacementLinkPath = composeReplacementPath(parsed.path, sourceFile.path, normalizedNewPath);
		return `${prefix}${replacementLinkPath}${parsed.subpath || ''}${alias}${suffix}`;
	});

	content = content.replace(MARKDOWN_LINK_PATTERN, (fullMatch, prefix, destination, suffix) => {
		const parsed = parseMarkdownDestination(destination);
		const resolvedPath = resolveLinkDestination(app, parsed.path, sourceFile.path);
		if (!shouldRewriteLink(parsed.path, resolvedPath, oldPath)) {
			return fullMatch;
		}

		const nextDestination = formatMarkdownDestination(
			composeReplacementPath(parsed.path, sourceFile.path, normalizedNewPath),
			parsed.suffix,
			parsed.isWrapped
		);
		return `${prefix}${nextDestination}${suffix}`;
	});

	return content;
}

function resolveLinkDestination(app: App, rawLinkPath: string, sourcePath: string): string {
	let candidate = rawLinkPath.trim();
	if (!candidate) {
		return '';
	}

	candidate = candidate.replace(/\\ /g, ' ');
	candidate = safeDecodeURIComponent(candidate);

	if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
		return '';
	}

	const normalizedCandidate = normalizeVaultPath(candidate);
	const resolved = app.metadataCache.getFirstLinkpathDest(normalizedCandidate || candidate, sourcePath);
	const resolvedPath = resolved ? resolved.path : normalizedCandidate;
	return normalizeVaultPath(resolvedPath).toLowerCase();
}

function parseMarkdownDestination(destination: string): {
	path: string;
	suffix: string;
	isWrapped: boolean;
} {
	let normalized = destination.trim();
	const isWrapped = normalized.startsWith('<') && normalized.endsWith('>');

	if (isWrapped) {
		normalized = normalized.slice(1, -1).trim();
	}

	normalized = normalized.replace(/\\ /g, ' ');
	const match = normalized.match(/^[^?#]*/);
	const path = match ? match[0] : normalized;
	const suffix = normalized.slice(path.length);

	return {
		path,
		suffix,
		isWrapped
	};
}

function formatMarkdownDestination(linkPath: string, suffix: string, isWrapped: boolean): string {
	const combined = `${linkPath}${suffix}`;
	if (isWrapped) {
		return `<${combined}>`;
	}
	return combined.replace(/ /g, '\\ ');
}

function shouldRewriteLink(rawPath: string, resolvedPath: string, oldPath: string): boolean {
	if (resolvedPath === oldPath) {
		return true;
	}

	// 兜底：当链接是裸文件名（例如 [[moon-a.jpg]]）且与旧文件同名时，
	// 即使 metadataCache 因同名文件歧义返回了其他目标，也按旧文件处理。
	const normalized = normalizeVaultPath(safeDecodeURIComponent(rawPath).replace(/\\ /g, ' ')).toLowerCase();
	if (!normalized || normalized.includes('/')) {
		return false;
	}

	const oldBase = getFileNameFromPath(oldPath).toLowerCase();
	return normalized === oldBase;
}

function composeReplacementPath(rawPath: string, sourcePath: string, newPath: string): string {
	const style = detectLinkPathStyle(rawPath);
	switch (style) {
		case 'basename':
			return getFileNameFromPath(newPath) || newPath;
		case 'relative':
			return toRelativeVaultPath(sourcePath, newPath) || getFileNameFromPath(newPath) || newPath;
		case 'absolute':
			return `/${newPath}`;
		case 'vault':
		default:
			return newPath;
	}
}

function detectLinkPathStyle(rawPath: string): LinkPathStyle {
	const trimmed = String(rawPath || '').trim();
	if (!trimmed) return 'basename';
	if (trimmed.startsWith('/')) return 'absolute';
	if (trimmed.startsWith('./') || trimmed.startsWith('../')) return 'relative';

	const normalized = normalizeVaultPath(trimmed);
	if (normalized.includes('/')) {
		return 'vault';
	}
	return 'basename';
}

function toRelativeVaultPath(sourcePath: string, targetPath: string): string {
	const fromDir = normalizeVaultPath(getParentPath(sourcePath));
	const to = normalizeVaultPath(targetPath);
	if (!to) return '';

	const fromParts = fromDir ? fromDir.split('/') : [];
	const toParts = to.split('/');

	let common = 0;
	while (
		common < fromParts.length &&
		common < toParts.length &&
		fromParts[common] === toParts[common]
	) {
		common++;
	}

	const upCount = fromParts.length - common;
	const parts: string[] = [];
	for (let i = 0; i < upCount; i++) {
		parts.push('..');
	}
	parts.push(...toParts.slice(common));

	return parts.join('/');
}

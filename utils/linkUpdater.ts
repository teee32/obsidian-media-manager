/**
 * 链接更新工具
 * 用于在文件移动或删除时按 Obsidian 的真实解析结果更新笔记中的引用
 */

import { App, TFile, parseLinktext } from 'obsidian';
import { getFileNameFromPath, getParentPath, normalizeVaultPath, safeDecodeURIComponent } from './path';

const WIKI_LINK_PATTERN = /(!?\[\[)([^\]|]+)(\|[^\]]*)?(\]\])/g;
const MARKDOWN_LINK_PATTERN = /(!?\[[^\]]*\]\()([^)]+)(\))/g;
type LinkPathStyle = 'basename' | 'relative' | 'vault' | 'absolute';
type LinkKind = 'wiki' | 'markdown';

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
	const forceDisambiguateBasename = hasFilenameCollision(app, newFile.name, normalizedNewPath);

	const markdownFiles = app.vault.getMarkdownFiles();
	let updatedCount = 0;

	for (const file of markdownFiles) {
		let updated = false;
		await app.vault.process(file, (content) => {
			const newContent = updateLinksInContent(
				app,
				file,
				content,
				normalizedOldPath,
				newFile,
				forceDisambiguateBasename
			);
			updated = newContent !== content;
			return newContent;
		});

		if (updated) {
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
	newFile: TFile,
	forceDisambiguateBasename: boolean = false
): string {
	const normalizedNewPath = normalizeVaultPath(newFile.path);

	content = content.replace(WIKI_LINK_PATTERN, (fullMatch, prefix, linktext, alias = '', suffix) => {
		const parsed = parseLinktext(linktext);
		const resolvedPath = resolveLinkDestination(app, parsed.path, sourceFile.path);
		if (!shouldRewriteLink(parsed.path, resolvedPath, oldPath, sourceFile.path)) {
			return fullMatch;
		}

		const replacementLinkPath = composeReplacementPath(
			parsed.path,
			sourceFile.path,
			normalizedNewPath,
			forceDisambiguateBasename,
			'wiki'
		);
		return `${prefix}${replacementLinkPath}${parsed.subpath || ''}${alias}${suffix}`;
	});

	content = content.replace(MARKDOWN_LINK_PATTERN, (fullMatch, prefix, destination, suffix) => {
		const parsed = parseMarkdownDestination(destination);
		const resolvedPath = resolveLinkDestination(app, parsed.path, sourceFile.path);
		if (!shouldRewriteLink(parsed.path, resolvedPath, oldPath, sourceFile.path)) {
			return fullMatch;
		}

		const nextDestination = formatMarkdownDestination(
			composeReplacementPath(
				parsed.path,
				sourceFile.path,
				normalizedNewPath,
				forceDisambiguateBasename,
				'markdown'
			),
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
	if (!resolved) {
		return '';
	}
	return normalizeVaultPath(resolved.path).toLowerCase();
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

function shouldRewriteLink(rawPath: string, resolvedPath: string, oldPath: string, sourcePath: string): boolean {
	if (resolvedPath === oldPath) {
		return true;
	}
	if (resolvedPath) {
		return false;
	}

	// 兜底仅用于 metadataCache 无法解析时，且 rawPath 在语义上可唯一定位。
	// 对裸文件名不做兜底，避免同名文件误改。
	return resolveDeterministicPath(rawPath, sourcePath) === oldPath;
}

function composeReplacementPath(
	rawPath: string,
	sourcePath: string,
	newPath: string,
	forceDisambiguateBasename: boolean,
	linkKind: LinkKind
): string {
	const style = detectLinkPathStyle(rawPath);
	switch (style) {
		case 'basename':
			if (linkKind === 'markdown') {
				return toRelativeVaultPath(sourcePath, newPath) || getFileNameFromPath(newPath) || newPath;
			}
			if (forceDisambiguateBasename) {
				return newPath;
			}
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

function resolveDeterministicPath(rawPath: string, sourcePath: string): string {
	let candidate = String(rawPath || '').trim();
	if (!candidate) {
		return '';
	}

	candidate = candidate.replace(/\\ /g, ' ');
	candidate = safeDecodeURIComponent(candidate);

	if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
		return '';
	}

	if (candidate.startsWith('/')) {
		return normalizeVaultPath(candidate).toLowerCase();
	}

	if (candidate.startsWith('./') || candidate.startsWith('../')) {
		const sourceDir = normalizeVaultPath(getParentPath(sourcePath));
		return resolveRelativePath(sourceDir, candidate).toLowerCase();
	}

	const normalized = normalizeVaultPath(candidate).toLowerCase();
	if (normalized.includes('/')) {
		return normalized;
	}

	// basename 无法唯一确定目标
	return '';
}

function resolveRelativePath(sourceDir: string, relativePath: string): string {
	const baseParts = sourceDir ? sourceDir.split('/').filter(Boolean) : [];
	const relParts = String(relativePath || '').replace(/\\/g, '/').split('/');

	for (const part of relParts) {
		if (!part || part === '.') {
			continue;
		}
		if (part === '..') {
			if (baseParts.length === 0) {
				return '';
			}
			baseParts.pop();
			continue;
		}
		baseParts.push(part);
	}

	return normalizeVaultPath(baseParts.join('/'));
}

function hasFilenameCollision(app: App, fileName: string, canonicalPath: string): boolean {
	const normalizedPath = normalizeVaultPath(canonicalPath).toLowerCase();
	const lowerName = fileName.toLowerCase();
	return app.vault.getFiles().some(file =>
		file.name.toLowerCase() === lowerName &&
		normalizeVaultPath(file.path).toLowerCase() !== normalizedPath
	);
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

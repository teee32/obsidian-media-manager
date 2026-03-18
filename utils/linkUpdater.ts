/**
 * 链接更新工具
 * 用于在文件移动或删除时按 Obsidian 的真实解析结果更新笔记中的引用
 */

import { App, TFile, parseLinktext } from 'obsidian';
import { normalizeVaultPath, safeDecodeURIComponent } from './path';

const WIKI_LINK_PATTERN = /(!?\[\[)([^\]|]+)(\|[^\]]*)?(\]\])/g;
const MARKDOWN_LINK_PATTERN = /(!?\[[^\]]*\]\()([^)]+)(\))/g;

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
	const replacementLinkPath = app.metadataCache.fileToLinktext(newFile, sourceFile.path, false);

	content = content.replace(WIKI_LINK_PATTERN, (fullMatch, prefix, linktext, alias = '', suffix) => {
		const parsed = parseLinktext(linktext);
		const resolvedPath = resolveLinkDestination(app, parsed.path, sourceFile.path);
		if (resolvedPath !== oldPath) {
			return fullMatch;
		}

		return `${prefix}${replacementLinkPath}${parsed.subpath || ''}${alias}${suffix}`;
	});

	content = content.replace(MARKDOWN_LINK_PATTERN, (fullMatch, prefix, destination, suffix) => {
		const parsed = parseMarkdownDestination(destination);
		const resolvedPath = resolveLinkDestination(app, parsed.path, sourceFile.path);
		if (resolvedPath !== oldPath) {
			return fullMatch;
		}

		const nextDestination = formatMarkdownDestination(
			replacementLinkPath,
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

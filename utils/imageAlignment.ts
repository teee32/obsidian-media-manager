import { escapeHtmlAttr } from './security';

export type AlignmentType = 'left' | 'center' | 'right';

export class ImageAlignment {
	/**
	 * 去除已存在的对齐包装，避免重复嵌套
	 */
	private static stripExistingAlignment(markdown: string): string {
		let cleanMarkdown = markdown.trim();

		// 匹配 ===center=== 块语法（旧的）
		const blockMatch = cleanMarkdown.match(/^===\s*(left|center|right)\s*===\s*([\s\S]*?)\s*===$/i);
		if (blockMatch) {
			return blockMatch[2].trim();
		}

		// 匹配 {align=center} 或 { align=center } 风格（旧的）
		cleanMarkdown = cleanMarkdown.replace(/^\{\s*align\s*=\s*(left|center|right)\s*\}\s*/i, '').trim();

		// 匹配新的扩展链接语法 ![[image|center]] 或 ![[image|align]]
		// 提取出图片路径，去除对齐参数
		const linkMatch = cleanMarkdown.match(/^!?\[\[([^\]|]+)\|([^\]]+)\]\]$/);
		if (linkMatch) {
			// 如果第二个参数是 left/center/right，则去掉它
			const alignment = linkMatch[2].toLowerCase();
			if (alignment === 'left' || alignment === 'center' || alignment === 'right') {
				return `![[${linkMatch[1]}]]`;
			}
		}

		// 也支持标准的 [[image.png|300]] 宽度参数形式
		cleanMarkdown = cleanMarkdown.replace(/^\{\s*\.(left|center|right)\s*\}$/i, '').trim();

		return cleanMarkdown;
	}

	/**
	 * 为图片Markdown语法添加对齐属性
	 * 新语法: ![[image.png|center]]
	 */
	static applyAlignment(markdown: string, alignment: AlignmentType): string {
		const cleanMarkdown = this.stripExistingAlignment(markdown).trim();

		// 匹配 Wiki 链接语法 ![[image.png]] 或 [[image.png]]
		const wikiLinkMatch = cleanMarkdown.match(/^!?\[\[([^\]]+)\]\]$/);
		if (wikiLinkMatch) {
			const imagePath = wikiLinkMatch[1];
			return `![[${imagePath}|${alignment}]]`;
		}

		// 匹配标准 Markdown 图片语法 ![alt](image.png)
		const mdImageMatch = cleanMarkdown.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
		if (mdImageMatch) {
			const altText = mdImageMatch[1];
			const imagePath = mdImageMatch[2];
			// 转换为 Wiki 链接语法 + 对齐参数
			return `![[${imagePath}|${alignment}]]`;
		}

		// 如果不是图片语法，返回原样
		return markdown;
	}

	/**
	 * 从图片语法中提取对齐方式
	 * 支持: ![[image.png|center]], ===center=== 块语法, {align=center} 风格
	 */
	static getAlignment(markdown: string): AlignmentType | null {
		// 匹配新的扩展链接语法 ![[image|center]]
		const linkMatch = markdown.match(/!?\[\[([^\]|]+)\|([^\]]+)\]\]/);
		if (linkMatch) {
			const alignment = linkMatch[2].toLowerCase();
			if (alignment === 'left' || alignment === 'center' || alignment === 'right') {
				return alignment as AlignmentType;
			}
		}

		// 匹配 ===center=== 块语法（保留兼容旧的）
		const blockMatch = markdown.match(/^===\s*(left|center|right)\s*===/i);
		if (blockMatch) {
			const alignment = blockMatch[1].toLowerCase();
			if (alignment === 'left' || alignment === 'center' || alignment === 'right') {
				return alignment as AlignmentType;
			}
		}

		// 匹配 {align=center} 或 { align=center } 风格（保留兼容旧的）
		const alignMatch = markdown.match(/{\s*align\s*=\s*(\w+)\s*}/i);
		if (alignMatch) {
			const alignment = alignMatch[1].toLowerCase();
			if (alignment === 'left' || alignment === 'center' || alignment === 'right') {
				return alignment as AlignmentType;
			}
		}

		// 匹配 {.center} 风格
		const classMatch = markdown.match(/\{\s*\.(left|center|right)\s*\}/i);
		if (classMatch) {
			return classMatch[1].toLowerCase() as AlignmentType;
		}

		return null;
	}

	/**
	 * 生成带对齐样式的HTML图片标签
	 */
	static toHTML(imagePath: string, altText: string = '', alignment: AlignmentType = 'center'): string {
		const styleMap: Record<AlignmentType, string> = {
			'left': 'display: block; margin-left: 0; margin-right: auto;',
			'center': 'display: block; margin-left: auto; margin-right: auto;',
			'right': 'display: block; margin-left: auto; margin-right: 0;'
		};

		return `<img src="${escapeHtmlAttr(imagePath)}" alt="${escapeHtmlAttr(altText)}" style="${styleMap[alignment]}" />`;
	}
}

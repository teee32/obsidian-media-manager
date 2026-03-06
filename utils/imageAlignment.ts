export type AlignmentType = 'left' | 'center' | 'right';

export class ImageAlignment {
	/**
	 * 为图片Markdown语法添加对齐属性
	 */
	static applyAlignment(markdown: string, alignment: AlignmentType): string {
		// 检查是否是图片语法
		const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
		const match = markdown.match(imageRegex);

		if (!match) {
			return markdown;
		}

		// 如果已有对齐属性，先移除
		let cleanMarkdown = markdown.replace(/{\s*align\s*:\s*\w+\s*}/gi, '').trim();

		// 添加新的对齐属性
		if (alignment === 'center') {
			return `{align=center}\n\n${cleanMarkdown}`;
		} else if (alignment === 'left') {
			return `{align=left}\n\n${cleanMarkdown}`;
		} else if (alignment === 'right') {
			return `{align=right}\n\n${cleanMarkdown}`;
		}

		return markdown;
	}

	/**
	 * 从图片语法中提取对齐方式
	 */
	static getAlignment(markdown: string): AlignmentType | null {
		// 匹配 {align=center} 或 { align=center } 风格
		const alignMatch = markdown.match(/{\s*align\s*=\s*(\w+)\s*}/i);
		if (alignMatch) {
			const alignment = alignMatch[1].toLowerCase();
			if (alignment === 'left' || alignment === 'center' || alignment === 'right') {
				return alignment as AlignmentType;
			}
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

		return `<img src="${imagePath}" alt="${altText}" style="${styleMap[alignment]}" />`;
	}
}

import { MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownRenderer } from 'obsidian';
import ImageManagerPlugin from '../main';
import { ImageAlignment, AlignmentType } from './imageAlignment';

/**
 * 图片对齐 PostProcessor
 * 渲染 ===center===、===left===、===right=== 语法
 */
export class AlignmentPostProcessor {
	plugin: ImageManagerPlugin;

	constructor(plugin: ImageManagerPlugin) {
		this.plugin = plugin;
	}

	/**
	 * 注册 PostProcessor
	 */
	register() {
		this.plugin.registerMarkdownPostProcessor((element, context) => {
			this.processAlignment(element, context);
		});
	}

	/**
	 * 处理对齐语法
	 */
	private processAlignment(element: HTMLElement, context: MarkdownPostProcessorContext) {
		// 查找所有包含对齐标记的代码块或段落
		const walker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_TEXT,
			null
		);

		const nodesToProcess: { node: Text; parent: HTMLElement }[] = [];
		let node: Text | null;

		while (node = walker.nextNode() as Text) {
			const text = node.textContent || '';
			if (text.includes('===') && (text.includes('center') || text.includes('left') || text.includes('right'))) {
				nodesToProcess.push({ node, parent: node.parentElement! });
			}
		}

		// 处理找到的节点
		for (const { node, parent } of nodesToProcess) {
			this.processNode(node, parent);
		}
	}

	/**
	 * 处理单个节点
	 */
	private processNode(node: Text, parent: HTMLElement) {
		const text = node.textContent || '';
		const container = document.createElement('div');
		container.className = 'alignment-block';

		// 匹配对齐块: ===center=== ... === 或 ===left=== ... === 等
		const blockRegex = /===\s*(center|left|right)\s*===\s*([\s\S]*?)\s*===/gi;
		let match;
		let lastIndex = 0;
		const fragment = document.createDocumentFragment();

		while ((match = blockRegex.exec(text)) !== null) {
			// 添加匹配之前的文本
			if (match.index > lastIndex) {
				fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
			}

			const alignment = match[1].toLowerCase() as AlignmentType;
			const content = match[2].trim();

			// 创建对齐容器
			const alignContainer = document.createElement('div');
			alignContainer.className = `alignment-${alignment}`;
			alignContainer.style.textAlign = alignment;
			alignContainer.style.margin = '10px 0';

			// 渲染内容
			if (content.includes('![[') || content.includes('![') || content.includes('[[')) {
				// 处理图片链接
				this.renderImage(content, alignContainer);
			} else {
				alignContainer.textContent = content;
			}

			fragment.appendChild(alignContainer);
			lastIndex = match.index + match[0].length;
		}

		// 如果没有匹配到任何块，保持原样
		if (lastIndex === 0) {
			return;
		}

		// 添加剩余文本
		if (lastIndex < text.length) {
			fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
		}

		// 替换原节点
		if (parent && fragment.childNodes.length > 0) {
			parent.replaceChild(fragment, node);
		}
	}

	/**
	 * 渲染图片
	 */
	private async renderImage(content: string, container: HTMLElement) {
		// 匹配各种图片语法
		const wikiImageRegex = /!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
		const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
		const wikiLinkRegex = /\[\[([^\]|]+\.(?:png|jpg|jpeg|gif|webp|svg|bmp))(?:\|[^\]]+)?\]\]/gi;

		let match;
		const images: { src: string; alt: string }[] = [];

		// 匹配 [[wiki图片]]
		while ((match = wikiLinkRegex.exec(content)) !== null) {
			const fileName = match[1];
			images.push({ src: fileName, alt: fileName });
		}

		// 匹配 ![alt](url) 或 ![[image]]
		while ((match = markdownImageRegex.exec(content)) !== null) {
			images.push({ alt: match[1], src: match[2] });
		}

		// 渲染图片
		for (const img of images) {
			const imgEl = document.createElement('img');
			imgEl.alt = img.alt;

			// 处理内部链接
			if (!img.src.startsWith('http')) {
				const file = this.plugin.app.vault.getAbstractFileByPath(img.src);
				if (file) {
					imgEl.src = this.plugin.app.vault.getResourcePath(file as any);
				} else {
					// 尝试在附件文件夹中查找
					const attachmentsPath = this.findFileInVault(img.src);
					if (attachmentsPath) {
						imgEl.src = attachmentsPath;
					} else {
						imgEl.src = img.src;
					}
				}
			} else {
				imgEl.src = img.src;
			}

			imgEl.style.maxWidth = '100%';
			imgEl.style.height = 'auto';
			container.appendChild(imgEl);
		}
	}

	/**
	 * 在 Vault 中查找文件
	 */
	private findFileInVault(fileName: string): string | null {
		const files = this.plugin.app.vault.getFiles();
		for (const file of files) {
			if (file.name === fileName || file.path.endsWith(fileName)) {
				return this.plugin.app.vault.getResourcePath(file);
			}
		}
		return null;
	}
}

/**
 * 处理内联对齐语法 {align=center}
 */
export class InlineAlignmentProcessor {
	plugin: ImageManagerPlugin;

	constructor(plugin: ImageManagerPlugin) {
		this.plugin = plugin;
	}

	/**
	 * 注册 PostProcessor
	 */
	register() {
		this.plugin.registerMarkdownPostProcessor((element) => {
			this.processInlineAlignment(element);
		});
	}

	/**
	 * 处理内联对齐语法
	 */
	private processInlineAlignment(element: HTMLElement) {
		// 查找包含 {align=...} 的元素
		const walker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_TEXT,
			null
		);

		let node: Text | null;
		while (node = walker.nextNode() as Text) {
			const text = node.textContent || '';
			if (text.includes('{align=')) {
				this.processNode(node);
			}
		}
	}

	/**
	 * 处理单个节点
	 */
	private processNode(node: Text) {
		const text = node.textContent || '';
		const parent = node.parentElement;
		if (!parent) return;

		// 匹配 {align=center} 等语法
		const alignRegex = /{align=(center|left|right)}\s*(!?\[\[[^\]]+\]\]|\![^\(]+\([^\)]+\))/gi;
		let match;
		let lastIndex = 0;
		const fragment = document.createDocumentFragment();

		while ((match = alignRegex.exec(text)) !== null) {
			// 添加匹配之前的文本
			if (match.index > lastIndex) {
				fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
			}

			const alignment = match[1] as AlignmentType;
			const imageSyntax = match[2];

			// 创建对齐容器
			const alignContainer = document.createElement('span');
			alignContainer.className = `inline-align-${alignment}`;
			alignContainer.style.display = 'block';
			alignContainer.style.textAlign = alignment;
			alignContainer.style.margin = '5px 0';

			// 渲染图片
			await this.renderImage(imageSyntax, alignContainer);

			fragment.appendChild(alignContainer);
			lastIndex = match.index + match[0].length;
		}

		// 如果没有匹配到任何块，保持原样
		if (lastIndex === 0) {
			return;
		}

		// 添加剩余文本
		if (lastIndex < text.length) {
			fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
		}

		// 替换原节点
		parent.replaceChild(fragment, node);
	}

	/**
	 * 渲染图片
	 */
	private async renderImage(content: string, container: HTMLElement) {
		// 解析图片语法
		let src = '';
		let alt = '';

		const wikiMatch = content.match(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
		if (wikiMatch) {
			src = wikiMatch[1];
			alt = wikiMatch[2] || src;
		} else {
			const mdMatch = content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
			if (mdMatch) {
				alt = mdMatch[1];
				src = mdMatch[2];
			}
		}

		if (!src) return;

		const imgEl = document.createElement('img');
		imgEl.alt = alt;

		// 处理内部链接
		if (!src.startsWith('http')) {
			const file = this.plugin.app.vault.getAbstractFileByPath(src);
			if (file) {
				imgEl.src = this.plugin.app.vault.getResourcePath(file as any);
			}
		} else {
			imgEl.src = src;
		}

		imgEl.style.maxWidth = '100%';
		imgEl.style.height = 'auto';
		container.appendChild(imgEl);
	}
}

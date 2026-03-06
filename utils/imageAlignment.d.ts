export type AlignmentType = 'left' | 'center' | 'right';
export declare class ImageAlignment {
    /**
     * 为图片Markdown语法添加对齐属性
     */
    static applyAlignment(markdown: string, alignment: AlignmentType): string;
    /**
     * 从图片语法中提取对齐方式
     */
    static getAlignment(markdown: string): AlignmentType | null;
    /**
     * 生成带对齐样式的HTML图片标签
     */
    static toHTML(imagePath: string, altText?: string, alignment?: AlignmentType): string;
}
//# sourceMappingURL=imageAlignment.d.ts.map
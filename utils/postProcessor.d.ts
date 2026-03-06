import ImageManagerPlugin from '../main';
/**
 * 图片对齐 PostProcessor
 * 渲染 ===center===、===left===、===right=== 语法
 */
export declare class AlignmentPostProcessor {
    plugin: ImageManagerPlugin;
    constructor(plugin: ImageManagerPlugin);
    /**
     * 注册 PostProcessor
     */
    register(): void;
    /**
     * 处理对齐语法
     */
    private processAlignment;
    /**
     * 处理单个节点
     */
    private processNode;
    /**
     * 同步渲染图片
     */
    private renderImageSync;
    /**
     * 在 Vault 中查找文件
     */
    private findFileInVault;
}
//# sourceMappingURL=postProcessor.d.ts.map
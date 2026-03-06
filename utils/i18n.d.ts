/**
 * 国际化支持模块
 * 支持中文和英文
 */
export type Language = 'zh' | 'en';
export interface Translations {
    ok: string;
    cancel: string;
    delete: string;
    restore: string;
    confirm: string;
    success: string;
    error: string;
    mediaLibrary: string;
    unreferencedMedia: string;
    trashManagement: string;
    totalMediaFiles: string;
    noMediaFiles: string;
    searchPlaceholder: string;
    searchResults: string;
    unreferencedFound: string;
    allMediaReferenced: string;
    deleteToTrash: string;
    trashEmpty: string;
    originalPath: string;
    deletedAt: string;
    confirmClearAll: string;
    openInNotes: string;
    copyPath: string;
    copyLink: string;
    openOriginal: string;
    preview: string;
    shortcuts: string;
    openLibrary: string;
    findUnreferenced: string;
    openTrash: string;
    scanningReferences: string;
    scanComplete: string;
    filesScanned: string;
    batchDeleteComplete: string;
    batchDeleteProgress: string;
    batchRestoreComplete: string;
    pluginSettings: string;
    mediaFolder: string;
    mediaFolderDesc: string;
    thumbnailSize: string;
    thumbnailSizeDesc: string;
    thumbnailSmall: string;
    thumbnailMedium: string;
    thumbnailLarge: string;
    defaultSortBy: string;
    sortByDesc: string;
    sortByName: string;
    sortByDate: string;
    sortBySize: string;
    sortOrder: string;
    sortOrderDesc: string;
    sortAsc: string;
    sortDesc: string;
    showImageInfo: string;
    showImageInfoDesc: string;
    autoRefresh: string;
    autoRefreshDesc: string;
    defaultAlignment: string;
    alignmentDesc: string;
    alignLeft: string;
    alignCenter: string;
    alignRight: string;
    safeDeleteSettings: string;
    useTrashFolder: string;
    useTrashFolderDesc: string;
    trashFolderPath: string;
    trashFolderPathDesc: string;
    autoCleanupTrash: string;
    autoCleanupTrashDesc: string;
    cleanupDays: string;
    cleanupDaysDesc: string;
    mediaTypes: string;
    enableImageSupport: string;
    enableImageSupportDesc: string;
    enableVideoSupport: string;
    enableVideoSupportDesc: string;
    enableAudioSupport: string;
    enableAudioSupportDesc: string;
    enablePDFSupport: string;
    enablePDFSupportDesc: string;
    viewSettings: string;
    interfaceLanguage: string;
    languageDesc: string;
    languageSystem: string;
    pageSize: string;
    pageSizeDesc: string;
    enablePreviewModal: string;
    enablePreviewModalDesc: string;
    enableKeyboardNav: string;
    enableKeyboardNavDesc: string;
    keyboardShortcuts: string;
    shortcutsDesc: string;
    shortcutOpenLibrary: string;
    shortcutFindUnreferenced: string;
    shortcutOpenTrash: string;
    commands: string;
    commandsDesc: string;
    cmdOpenLibrary: string;
    cmdFindUnreferenced: string;
    cmdTrashManagement: string;
    cmdAlignLeft: string;
    cmdAlignCenter: string;
    cmdAlignRight: string;
    loadingTrashFiles: string;
    trashFolderEmpty: string;
    filesInTrash: string;
    totalSize: string;
    trashManagementDesc: string;
    refresh: string;
    clearTrash: string;
    clearTrashTooltip: string;
    restoreTooltip: string;
    permanentDelete: string;
    permanentDeleteTooltip: string;
    deletedTime: string;
    confirmDeleteFile: string;
    confirmClearTrash: string;
    fileDeleted: string;
    restoreSuccess: string;
    restoreFailed: string;
    fileNameCopied: string;
    originalPathCopied: string;
}
/**
 * 获取翻译
 */
export declare function t(lang: Language, key: keyof Translations, params?: Record<string, string | number>): string;
/**
 * 获取系统语言设置
 */
export declare function getSystemLanguage(): Language;
declare const _default: {
    t: typeof t;
    getSystemLanguage: typeof getSystemLanguage;
    zh: Translations;
    en: Translations;
};
export default _default;
//# sourceMappingURL=i18n.d.ts.map
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
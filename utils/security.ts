/**
 * 安全工具函数
 */

/**
 * 校验路径是否安全（无遍历序列、非绝对路径）
 * 先做 URL 解码以防 %2e%2e 等编码绕过
 */
export function isPathSafe(filePath: string): boolean {
	if (!filePath || !filePath.trim()) return false;
	try {
		const decoded = decodeURIComponent(filePath);
		const normalized = decoded.replace(/\\/g, '/');
		if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) return false;
		if (normalized.includes('\0')) return false;
		const parts = normalized.split('/');
		return parts.every(part => part !== '..' && part !== '.');
	} catch {
		return false;
	}
}

/**
 * 校验 URL 协议是否安全
 * 允许 http/https 和无协议前缀的内部路径，拦截 javascript:/data:/vbscript: 等
 */
export function isSafeUrl(url: string): boolean {
	if (!url || !url.trim()) return false;
	const trimmed = url.trim().toLowerCase();
	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
	if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) return false;
	return !trimmed.includes(':');
}

/**
 * 转义字符串用于 HTML 属性，防止属性注入
 */
export function escapeHtmlAttr(str: string): string {
	if (typeof str !== 'string') return '';
	return str
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

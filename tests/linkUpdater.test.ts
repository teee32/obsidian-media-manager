import { describe, expect, it } from 'vitest';

import { updateLinksInContent } from '../utils/linkUpdater';

function buildApp(
	resolve: (linkPath: string, sourcePath: string) => string | null,
	filePaths: string[] = []
): any {
	return {
		metadataCache: {
			getFirstLinkpathDest: (linkPath: string, sourcePath: string) => {
				const path = resolve(linkPath, sourcePath);
				return path ? { path } : null;
			}
		},
		vault: {
			getFiles: () => filePaths.map(path => makeFile(path))
		}
	};
}

function makeFile(path: string): any {
	const slash = path.lastIndexOf('/');
	const name = slash === -1 ? path : path.slice(slash + 1);
	return { path, name };
}

describe('updateLinksInContent', () => {
	const oldPath = 'attachments/moon-a.jpg';
	const newFile = makeFile('attachments/moon-b.jpg');

	it('does not rewrite wiki basename when metadata resolves to a different same-name file', () => {
		const app = buildApp((linkPath, sourcePath) => {
			if (linkPath === 'moon-a.jpg' && sourcePath === 'other/bare-old.md') {
				return 'other/moon-a.jpg';
			}
			return null;
		});

		const sourceFile = makeFile('other/bare-old.md');
		const content = '![[moon-a.jpg]]\n';

		const updated = updateLinksInContent(app, sourceFile, content, oldPath, newFile);
		expect(updated).toBe(content);
	});

	it('rewrites markdown basename links to relative path style', () => {
		const app = buildApp((linkPath) => (linkPath === 'moon-a.jpg' ? oldPath : null));
		const sourceFile = makeFile('notes/md-bare.md');
		const content = '![bare](moon-a.jpg)\n';

		const updated = updateLinksInContent(app, sourceFile, content, oldPath, newFile);
		expect(updated).toBe('![bare](../attachments/moon-b.jpg)\n');
	});

	it('preserves markdown query/hash suffix when rewriting basename links', () => {
		const app = buildApp((linkPath) => (linkPath === 'moon-a.jpg' ? oldPath : null));
		const sourceFile = makeFile('notes/md-bare.md');
		const content = '![bare](moon-a.jpg?raw=1#page=1)\n';

		const updated = updateLinksInContent(app, sourceFile, content, oldPath, newFile);
		expect(updated).toBe('![bare](../attachments/moon-b.jpg?raw=1#page=1)\n');
	});

	it('does not rewrite unresolved wiki basename links (ambiguous)', () => {
		const app = buildApp(() => null);
		const sourceFile = makeFile('notes/wiki.md');
		const content = '![[moon-a.jpg]]\n';

		const updated = updateLinksInContent(app, sourceFile, content, oldPath, newFile);
		expect(updated).toBe(content);
	});

	it('rewrites unresolved wiki basename links when deterministic vault lookup resolves to old file', () => {
		const app = buildApp(
			() => null,
			[
				'attachments/moon-a.jpg',
				'attachments/moon-b.jpg',
				'other/moon-a.jpg'
			]
		);
		const sourceFile = makeFile('notes/wiki.md');
		const content = '![[moon-a.jpg]]\n';

		const updated = updateLinksInContent(app, sourceFile, content, oldPath, newFile);
		expect(updated).toBe('![[moon-b.jpg]]\n');
	});

	it('rewrites unresolved deterministic relative markdown links', () => {
		const app = buildApp(() => null);
		const sourceFile = makeFile('notes/wiki.md');
		const content = '![x](../attachments/moon-a.jpg)\n';

		const updated = updateLinksInContent(app, sourceFile, content, oldPath, newFile);
		expect(updated).toBe('![x](../attachments/moon-b.jpg)\n');
	});
});

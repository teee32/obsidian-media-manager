export class TFile {
	path: string;
	name: string;

	constructor(path: string = '', name: string = '') {
		this.path = path;
		this.name = name;
	}
}

export function parseLinktext(linktext: string): { path: string; subpath: string } {
	const hashIndex = linktext.indexOf('#');
	if (hashIndex === -1) {
		return { path: linktext.trim(), subpath: '' };
	}
	return {
		path: linktext.slice(0, hashIndex).trim(),
		subpath: linktext.slice(hashIndex)
	};
}


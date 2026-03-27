/**
 * 重复文件检测视图
 * 使用感知哈希实现像素级图片去重
 */

import { TFile, ItemView, WorkspaceLeaf, setIcon, Notice } from 'obsidian';
import ImageManagerPlugin from '../main';
import { formatFileSize } from '../utils/format';
import { getMediaType } from '../utils/mediaTypes';
import { computePerceptualHash, findDuplicateGroups, DuplicateGroup, ImageHash } from '../utils/perceptualHash';
import { updateLinksInVault } from '../utils/linkUpdater';

export const VIEW_TYPE_DUPLICATE_DETECTION = 'duplicate-detection-view';

export class DuplicateDetectionView extends ItemView {
	plugin: ImageManagerPlugin;
	private duplicateGroups: DuplicateGroup[] = [];
	private isScanning: boolean = false;
	private scanProgress: { current: number; total: number } = { current: 0, total: 0 };
	private lastProgressAt: number = 0;

	constructor(leaf: WorkspaceLeaf, plugin: ImageManagerPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_DUPLICATE_DETECTION;
	}

	getDisplayText() {
		return this.plugin.t('duplicateDetection');
	}

	async onOpen() {
		let retries = 0;
		while (!this.contentEl && retries < 10) {
			await new Promise(resolve => setTimeout(resolve, 50));
			retries++;
		}
		if (!this.contentEl) {
			console.error('DuplicateDetectionView: contentEl not ready');
			return;
		}
		// Reset scan state on reopen to avoid stale "isScanning" blocking the UI.
		this.isScanning = false;
		this.scanProgress = { current: 0, total: 0 };
		this.contentEl.addClass('duplicate-detection-view');
		this.renderView();
	}

	onClose(): Promise<void> {
		this.isScanning = false;
		return Promise.resolve();
	}

	/**
	 * 渲染视图
	 */
	renderView() {
		if (!this.contentEl) return;
		this.contentEl.empty();

		this.renderHeader();
		this.renderWorkspaceSummary();

		if (this.isScanning) {
			this.renderProgress();
			return;
		}

		if (this.duplicateGroups.length === 0) {
			const emptyState = this.contentEl.createDiv({ cls: 'duplicate-empty-state' });
			emptyState.createDiv({
				cls: 'empty-state-label',
				text: this.plugin.t('duplicateDetection')
			});
			emptyState.createDiv({
				cls: 'duplicate-empty-text',
				text: this.plugin.t('noDuplicatesFound')
			});
			emptyState.createDiv({
				cls: 'duplicate-empty-subtext',
				text: this.plugin.t('duplicateDetectionDesc')
			});
			this.renderStartScanButton(emptyState, 'duplicate-empty-cta');
			return;
		}

		// 统计
		const totalDuplicates = this.duplicateGroups.reduce(
			(sum, g) => sum + g.files.length - 1, 0
		);
		const statsBar = this.contentEl.createDiv({ cls: 'duplicate-stats-bar' });
		statsBar.createSpan({
			text: this.plugin.t('duplicateGroupsFound', {
				groups: this.duplicateGroups.length,
				files: totalDuplicates
			}),
			cls: 'duplicate-stats-count'
		});

		// 一键清理按钮
		const cleanAllBtn = statsBar.createEl('button', { cls: 'duplicate-action-button' });
		setIcon(cleanAllBtn, 'broom');
		cleanAllBtn.createSpan({ cls: 'button-label', text: this.plugin.t('quarantineAllDuplicates') });
		cleanAllBtn.addEventListener('click', () => {
			void this.quarantineAllDuplicates();
		});

		// 渲染重复组
		const groupsContainer = this.contentEl.createDiv({ cls: 'duplicate-groups' });
		for (let i = 0; i < this.duplicateGroups.length; i++) {
			this.renderDuplicateGroup(groupsContainer, this.duplicateGroups[i], i + 1);
		}
	}

	private renderWorkspaceSummary() {
		const redundantFiles = this.duplicateGroups.reduce(
			(sum, group) => sum + Math.max(0, group.files.length - 1),
			0
		);
		const summary = this.contentEl.createDiv({ cls: 'workspace-summary-grid workspace-summary-grid-compact' });
		this.createSummaryCard(
			summary,
			this.plugin.t('duplicateReview'),
			`${this.plugin.settings.duplicateThreshold}%`,
			this.plugin.t('similarityThreshold', { value: this.plugin.settings.duplicateThreshold })
		);
		this.createSummaryCard(
			summary,
			this.plugin.t('duplicateDetection'),
			String(this.duplicateGroups.length),
			this.plugin.t('duplicateGroupsFound', {
				groups: this.duplicateGroups.length,
				files: redundantFiles
			})
		);
		this.createSummaryCard(
			summary,
			this.plugin.t('files'),
			String(redundantFiles),
			this.isScanning ? this.plugin.t('processing') : this.plugin.t('quarantineAllDuplicates')
		);
	}

	private createSummaryCard(container: HTMLElement, label: string, value: string, note?: string) {
		const card = container.createDiv({ cls: 'workspace-summary-card' });
		card.createDiv({ cls: 'workspace-summary-label', text: label });
		card.createDiv({ cls: 'workspace-summary-value', text: value });
		if (note) {
			card.createDiv({ cls: 'workspace-summary-note', text: note });
		}
	}

	/**
	 * 渲染头部
	 */
	private renderHeader() {
		const header = this.contentEl.createDiv({ cls: 'duplicate-header' });
		const headerMain = header.createDiv({ cls: 'view-header-main' });
		const titleBlock = headerMain.createDiv({ cls: 'view-header-copy' });
		const kicker = titleBlock.createDiv({ cls: 'view-kicker-row' });
		kicker.createSpan({ cls: 'view-kicker', text: this.plugin.t('duplicateReview') });
		kicker.createSpan({
			cls: 'view-inline-badge',
			text: this.plugin.t('similarityThreshold', {
				value: this.plugin.settings.duplicateThreshold
			})
		});
		titleBlock.createEl('h2', { text: this.plugin.t('duplicateDetection') });

		const desc = titleBlock.createDiv({ cls: 'duplicate-header-description' });
		desc.createSpan({ text: this.plugin.t('duplicateDetectionDesc') });

		const actions = header.createDiv({ cls: 'view-header-controls duplicate-header-actions' });
		this.renderStartScanButton(actions);

		// 阈值显示
		actions.createSpan({
			cls: 'duplicate-threshold-label',
			text: this.plugin.t('similarityThreshold', {
				value: this.plugin.settings.duplicateThreshold
			})
		});
	}

	private renderStartScanButton(container: HTMLElement, extraClass?: string) {
		const cls = ['duplicate-action-button', 'duplicate-action-button-primary'];
		if (extraClass) cls.push(extraClass);

		const scanBtn = container.createEl('button', { cls: cls.join(' ') });
		setIcon(scanBtn, 'search');
		scanBtn.createSpan({ cls: 'button-label', text: this.plugin.t('startScan') });
		scanBtn.disabled = this.isScanning;
		scanBtn.addEventListener('click', () => {
			void this.startScan();
		});
		return scanBtn;
	}

	/**
	 * 渲染扫描进度
	 */
	private renderProgress() {
		const progressContainer = this.contentEl.createDiv({ cls: 'duplicate-scan-progress' });

		const progressBar = progressContainer.createDiv({ cls: 'duplicate-progress-bar' });
		const progressFill = progressBar.createDiv({ cls: 'duplicate-progress-fill' });
		const percent = this.scanProgress.total > 0
			? Math.round((this.scanProgress.current / this.scanProgress.total) * 100)
			: 0;
		progressFill.setCssProps({ width: `${percent}%` });

		progressContainer.createDiv({
			cls: 'duplicate-progress-text',
			text: this.plugin.t('scanProgress', {
				current: this.scanProgress.current,
				total: this.scanProgress.total
			})
		});
	}

	private compareDuplicateFiles(pathA: string, pathB: string): number {
		const fileA = this.app.vault.getAbstractFileByPath(pathA);
		const fileB = this.app.vault.getAbstractFileByPath(pathB);

		if (fileA instanceof TFile && fileB instanceof TFile) {
			return (fileB.stat.mtime - fileA.stat.mtime)
				|| (fileB.stat.size - fileA.stat.size)
				|| pathA.localeCompare(pathB);
		}
		if (fileA instanceof TFile) return -1;
		if (fileB instanceof TFile) return 1;
		return pathA.localeCompare(pathB);
	}

	private normalizeDuplicateGroup(group: DuplicateGroup): DuplicateGroup {
		return {
			...group,
			files: [...group.files].sort((a, b) => this.compareDuplicateFiles(a.path, b.path))
		};
	}

	/**
	 * 开始扫描
	 */
	async startScan() {
		if (this.isScanning) {
			// If the previous scan appears stuck, allow a restart.
			const now = Date.now();
			if (this.lastProgressAt && now - this.lastProgressAt > 15000) {
				this.isScanning = false;
			} else {
				return;
			}
		}
		this.isScanning = true;
		this.duplicateGroups = [];
		this.lastProgressAt = Date.now();

		try {
			// 获取所有图片文件
			const imageFiles: TFile[] = [];
			if (this.plugin.fileIndex.isInitialized) {
				for (const entry of this.plugin.fileIndex.getFiles()) {
					if (getMediaType(entry.name) === 'image') {
						const file = this.app.vault.getAbstractFileByPath(entry.path);
						if (file instanceof TFile) {
							imageFiles.push(file);
						}
					}
				}
			} else {
				const allFiles = this.plugin.getAllImageFiles();
				imageFiles.push(...allFiles.filter(f => getMediaType(f.name) === 'image'));
			}

			this.scanProgress = { current: 0, total: imageFiles.length };
			this.lastProgressAt = Date.now();
			this.renderView();

			// 分批计算哈希
			const hashMap = new Map<string, ImageHash>();
			const BATCH_SIZE = 5;

			for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
				const batch = imageFiles.slice(i, i + BATCH_SIZE);

				await Promise.all(batch.map(async (file) => {
					try {
						const src = this.app.vault.getResourcePath(file);
						const hash = await computePerceptualHash(src);
						hashMap.set(file.path, hash);
					} catch (error) {
						console.warn(`Hash computation failed for ${file.name}:`, error);
					}
				}));

				this.scanProgress.current = Math.min(i + BATCH_SIZE, imageFiles.length);
				this.lastProgressAt = Date.now();

				// 更新进度 UI
				const progressFill = this.contentEl.querySelector('.duplicate-progress-fill') as HTMLElement;
				const progressText = this.contentEl.querySelector('.duplicate-progress-text') as HTMLElement;
				if (progressFill && progressText) {
					const percent = Math.round((this.scanProgress.current / this.scanProgress.total) * 100);
					progressFill.setCssProps({ width: `${percent}%` });
					progressText.textContent = this.plugin.t('scanProgress', {
						current: this.scanProgress.current,
						total: this.scanProgress.total
					});
				}

				// 让 UI 有机会更新
				await new Promise(resolve => setTimeout(resolve, 10));
			}

			// 查找重复组
			const threshold = this.plugin.settings.duplicateThreshold;
			this.duplicateGroups = findDuplicateGroups(hashMap, threshold)
				.map(group => this.normalizeDuplicateGroup(group));
			this.duplicateGroups.sort((a, b) => {
				const pathA = a.files[0]?.path || '';
				const pathB = b.files[0]?.path || '';
				return pathA.localeCompare(pathB);
			});

			if (this.duplicateGroups.length === 0) {
				new Notice(this.plugin.t('noDuplicatesFound'));
			} else {
				const totalDuplicates = this.duplicateGroups.reduce(
					(sum, g) => sum + g.files.length - 1, 0
				);
				new Notice(this.plugin.t('duplicatesFound', {
					groups: this.duplicateGroups.length,
					files: totalDuplicates
				}));
			}
		} catch (error) {
			console.error('Duplicate detection failed:', error);
			new Notice(this.plugin.t('scanError'));
		} finally {
			this.isScanning = false;
			this.renderView();
		}
	}

	/**
	 * 渲染单个重复组
	 */
	private renderDuplicateGroup(container: HTMLElement, group: DuplicateGroup, index: number) {
		group.files.sort((a, b) => this.compareDuplicateFiles(a.path, b.path));

		const groupEl = container.createDiv({ cls: 'duplicate-group' });

		// 组标题
		const groupHeader = groupEl.createDiv({ cls: 'duplicate-group-header' });
		groupHeader.createSpan({
			cls: 'duplicate-group-title',
			text: this.plugin.t('duplicateGroup', { index })
		});
		groupHeader.createSpan({
			cls: 'duplicate-group-count',
			text: `${group.files.length} ${this.plugin.t('files')}`
		});

		// 文件列表
		const fileList = groupEl.createDiv({ cls: 'duplicate-group-files' });

		for (let i = 0; i < group.files.length; i++) {
			const fileInfo = group.files[i];
			const file = this.app.vault.getAbstractFileByPath(fileInfo.path);
			if (!(file instanceof TFile)) continue;

			const fileEl = fileList.createDiv({
				cls: `duplicate-group-file ${i === 0 ? 'duplicate-keep-suggestion' : 'duplicate-file-suggestion'}`
			});
			fileEl.title = file.path;

			// 缩略图
			const thumb = fileEl.createDiv({ cls: 'duplicate-file-thumbnail' });
			const src = this.app.vault.getResourcePath(file);
			const img = thumb.createEl('img', {
				attr: { src, alt: file.name }
			});
			img.addEventListener('error', () => {
				thumb.empty();
				const icon = thumb.createDiv();
				setIcon(icon, 'image');
			});

			// 文件信息
			const info = fileEl.createDiv({ cls: 'duplicate-file-info' });
			info.createDiv({ cls: 'duplicate-file-name', text: file.name });
			info.createDiv({ cls: 'duplicate-file-path', text: file.path });

			const meta = info.createDiv({ cls: 'duplicate-file-meta' });
			meta.createSpan({ text: formatFileSize(file.stat.size) });
			meta.createSpan({ text: ` | ${new Date(file.stat.mtime).toLocaleDateString()}` });
			meta.createSpan({
				cls: 'duplicate-similarity-badge',
				text: ` ${fileInfo.similarity}%`
			});

			// 标记
			if (i === 0) {
				fileEl.createSpan({ cls: 'duplicate-keep-badge', text: this.plugin.t('suggestKeep') });
			} else {
				// 隔离按钮
				const quarantineBtn = fileEl.createEl('button', { cls: 'duplicate-quarantine-btn' });
				setIcon(quarantineBtn, 'archive');
				quarantineBtn.createSpan({ cls: 'button-label', text: this.plugin.t('quarantine') });
				quarantineBtn.title = this.plugin.t('quarantine');
				quarantineBtn.addEventListener('click', () => {
					void (async () => {
						const keepFile = group.files[0];
						if (!keepFile || keepFile.path === file.path) {
							return;
						}

						quarantineBtn.disabled = true;
						try {
							await updateLinksInVault(this.app, file.path, keepFile.path);
							const result = await this.plugin.safeDeleteFile(file);
							if (!result) {
								quarantineBtn.disabled = false;
								return;
							}

							group.files = group.files.filter(entry => entry.path !== file.path);
							if (group.files.length <= 1) {
								const idx = this.duplicateGroups.indexOf(group);
								if (idx >= 0) this.duplicateGroups.splice(idx, 1);
							}
							this.renderView();
						} catch (error) {
							console.error('单个重复隔离失败:', error);
							new Notice(this.plugin.t('operationFailed', { name: file.name }));
							quarantineBtn.disabled = false;
						}
					})();
				});
			}
		}
	}

	/**
	 * 一键隔离所有重复项（每组保留最新版）
	 */
	async quarantineAllDuplicates() {
		let totalQuarantined = 0;

		for (const group of this.duplicateGroups) {
			group.files.sort((a, b) => this.compareDuplicateFiles(a.path, b.path));

			const keepFile = group.files[0];
			// 保留第一个（最新），隔离其余
			for (let i = 1; i < group.files.length; i++) {
				const entry = group.files[i];
				const file = this.app.vault.getAbstractFileByPath(entry.path);
				if (!(file instanceof TFile)) continue;

				await updateLinksInVault(this.app, file.path, keepFile.path);
				const result = await this.plugin.safeDeleteFile(file);
				if (result) totalQuarantined++;
			}
		}

		new Notice(this.plugin.t('duplicatesQuarantined', { count: totalQuarantined }));
		this.duplicateGroups = [];
		this.renderView();
	}
}

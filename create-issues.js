#!/usr/bin/env node

/**
 * GitHub Issues 批量创建脚本
 * 使用方法: GITHUB_TOKEN=your_token node create-issues.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO_OWNER = 'teee32';
const REPO_NAME = 'obsidian-media-manager';
const ISSUES_DIR = path.join(__dirname, 'issues');

// GitHub API 请求函数
function createIssue(title, body, labels) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      title,
      body,
      labels
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'Obsidian-Media-Manager-Issue-Creator'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseData));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 解析 issue 文件
function parseIssueFile(filename) {
  const content = fs.readFileSync(path.join(ISSUES_DIR, filename), 'utf-8');

  // 解析标题（第一个 # 后面的内容）
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : filename;

  // 解析严重程度
  const severityMatch = content.match(/##\s+严重程度:\s*(.+)/);
  const severity = severityMatch ? severityMatch[1].trim() : 'P2';

  // 提取问题描述和修复建议作为 body
  const body = content;

  return { title, body, severity };
}

// 主函数
async function main() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error('错误: 请设置 GITHUB_TOKEN 环境变量');
    console.log('使用方法: GITHUB_TOKEN=your_token node create-issues.js');
    console.log('');
    console.log('或者手动创建以下 issues:');
    console.log('');

    const files = fs.readdirSync(ISSUES_DIR).sort();
    for (const file of files) {
      const issue = parseIssueFile(file);
      console.log(`- ${issue.title} [${issue.severity}]`);
    }
    process.exit(1);
  }

  console.log(`正在创建 issues 到 ${REPO_OWNER}/${REPO_NAME}...`);

  const files = fs.readdirSync(ISSUES_DIR).sort();
  const labelsMap = {
    'P0': ['bug', 'priority-high', 'blocking'],
    'P1': ['bug', 'priority-medium'],
    'P2': ['enhancement', 'priority-low']
  };

  for (const file of files) {
    try {
      const issue = parseIssueFile(file);
      const labels = labelsMap[issue.severity] || ['enhancement'];

      console.log(`创建: ${issue.title} [${issue.severity}]`);

      const result = await createIssue(issue.title, issue.body, labels);
      console.log(`  -> 成功! Issue #${result.number}`);

      // 避免 API 速率限制
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  -> 失败: ${error.message}`);
    }
  }

  console.log('');
  console.log('完成! 访问 https://github.com/teee32/obsidian-media-manager/issues 查看');
}

main().catch(console.error);

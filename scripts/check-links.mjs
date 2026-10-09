import { mkdir, writeFile } from 'node:fs/promises';
import { readLibrary } from './library.mjs';
import { selectPublished, linkPaths } from './publication.mjs';
import { checkLinks } from './link-utils.mjs';

const library = selectPublished(await readLibrary());
const urls = library.resources.map(item => item.url);
for (const question of Object.values(library.questionPublication ?? {})) if (question.status === 'published') urls.push(...question.sources);
for (const article of library.articles) {
  urls.push(...article.sources);
  urls.push(...linkPaths(article.content).filter(url => /^https?:\/\//i.test(url)));
}
const results = await checkLinks(urls);
const labels = { ok: '正常', redirected: '可用（重定向）', dead: '疑似失效', restricted: '需要登录或禁止机器人', temporary: '临时失败', review: '需要复核' };
const escape = value => String(value ?? '').replace(/[|\r\n]/g, ' ');
const report = `# 公开资料链接检查\n\n检查时间：${new Date().toISOString()}\n\n仅检查公开内容，不修改原始 URL。403、限流与超时不等于永久失效；请人工复核疑似失效项。单个外站失败不阻断发布。\n\n| 状态 | 地址 | HTTP / 原因 | 最终地址 |\n| --- | --- | --- | --- |\n${results.map(item => `| ${labels[item.state]} | ${escape(item.url)} | ${escape(item.status ?? item.error)} | ${escape(item.finalURL)} |`).join('\n')}\n`;
await mkdir('.reports', { recursive: true });
await writeFile('.reports/links.json', JSON.stringify(results, null, 2) + '\n');
await writeFile('.reports/links.md', report);
console.log(`检查 ${results.length} 个链接，${results.filter(item => !['ok', 'redirected'].includes(item.state)).length} 个需要复核。报告：.reports/links.md`);

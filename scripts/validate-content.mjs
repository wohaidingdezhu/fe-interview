import { readLibrary } from './library.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateContent } from './publication.mjs';
try {
  const library = await readLibrary();
  const report = await validateContent(library, fileURLToPath(new URL('../public/', import.meta.url)));
  const directory = new URL('../.reports/', import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('content-quality.json', directory), `${JSON.stringify(report, null, 2)}\n`);
  const lines = ['# 内容质量报告', '', `题目 ${report.summary.questions} 道；空答案 ${report.summary.empty} 道；短答案 ${report.summary.short} 道。`, '', `公开 ${report.summary.publishedArticles} 篇笔记、${report.summary.publishedResources} 条资料；${report.summary.draftArticles} 篇草稿不进入线上发布。字数通过不代表已完成技术审核。`, '', '| 专题 | 状态 | 题号 | 问题 |', '| --- | --- | --- | --- |'];
  for (const topic of report.topics) for (const question of topic.questions.filter((item) => item.issue)) {
    lines.push(`| ${topic.id} | ${topic.status} | Q${question.number} | ${question.issue === 'empty' ? '无实质答案' : `短答案（${question.characters} 字符）`} |`);
  }
  lines.push('', '## 其他提示', '', ...report.warnings.filter((warning) => !/ Q\d+ /.test(warning)).map((warning) => `- ${warning}`));
  if (report.errors.length) lines.push('', '## 阻断错误', '', ...report.errors.map((error) => `- ${error}`));
  await writeFile(new URL('content-quality.md', directory), `${lines.join('\n')}\n`);
  console.log(`质量报告：${report.summary.questions} 道题，${report.summary.empty} 道空答案，${report.summary.short} 道短答案；详见 .reports/content-quality.md。`);
  if (report.errors.length) throw new Error(report.errors.join('\n'));
  console.log(`内容校验通过：公开 ${report.summary.publishedArticles} 篇笔记、${report.summary.publishedResources} 条资料；${report.summary.draftArticles} 篇草稿仅在开发环境预览。`);
} catch (error) {
  console.error(`内容校验失败：${error.message}`);
  process.exitCode = 1;
}

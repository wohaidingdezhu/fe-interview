import { writeFile } from 'node:fs/promises';
import { readLibrary } from './library.mjs';
import { inspectQuestions, questionPublicationFor } from './publication.mjs';

const library = await readLibrary();
const topics = library.articles.map(article => {
  const questions = inspectQuestions(article);
  return { article, questions, ready: questions.filter(question => questionPublicationFor(library, question.number).status === 'published') };
}).filter(topic => topic.questions.length).sort((a, b) => a.questions[0].number - b.questions[0].number);
const total = topics.reduce((sum, topic) => sum + topic.questions.length, 0);
const ready = topics.reduce((sum, topic) => sum + topic.ready.length, 0);
const lines = ['# 面试题技术复核进度', '', '> 由 `npm run review:progress` 从正文和逐题发布清单生成。总题数保持稳定，待处理数会随复核减少。', '',
  `- 题库总数：${total}`, `- 技术复核后具备本地发布条件：${ready}`, `- 待处理：${total - ready}`, '',
  '这里的发布条件用于下一次生产构建，不代表已推送或部署到线上；技术复核不替代内容所有者的最终人工签字。', '',
  '| 专题 | 题号 | 总数 | 已复核 | 待处理 |', '| --- | --- | --- | --- | --- |'];
for (const { article, questions, ready } of topics) lines.push(`| ${article.title} | Q${questions[0].number}–Q${questions.at(-1).number} | ${questions.length} | ${ready.length} | ${questions.length - ready.length} |`);
lines.push('', '## 复核范围与限制', '',
  '- 修正过时或不准确说明，补充题解、适用版本、来源和必要实现，保留对应题目的原始图片。',
  '- 缺少原始程序的题提供标注清楚的独立示例，不推测原截图输出；见 `manual-review-needed.md`。',
  '- Alien Signals 系列固定为 v2.0.0 / commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916，教学实现与库源码区分。',
  '- 自动检查覆盖元数据、正文结构、图片路径、代码块语法与发布过滤；可执行测试覆盖选定算法与异步边界，不表示每段浏览器/数据库示例都已在真实环境运行。',
  '- 最新测试、构建、链接和搜索检查结果见 `project-verification.md`。', '');
await writeFile(new URL('../docs/review/interview-review-progress.md', import.meta.url), lines.join('\n'));
console.log(`总数 ${total} / 已复核 ${ready} / 待处理 ${total - ready}`);

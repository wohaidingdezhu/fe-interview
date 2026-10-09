import { transformWithOxc } from 'vite';
import { readLibrary } from './library.mjs';
import { markdownNodes } from './markdown.mjs';

// 只检查语法；不执行文档代码，不把缺少宿主环境的片段当运行失败。
const extensions = { js: 'js', javascript: 'js', ts: 'ts', typescript: 'ts', jsx: 'jsx', tsx: 'tsx' };
let checked = 0;
const failures = [];
for (const article of (await readLibrary()).articles) {
  for (const block of markdownNodes(article.content, ['code'])) {
    const extension = extensions[block.lang];
    if (!extension) continue;
    checked++;
    try { await transformWithOxc(block.value, `snippet.${extension}`); }
    catch (error) { failures.push(`${article.id}:${block.position.start.line} ${error.message}`); }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
console.log(`代码块语法检查：${checked} 个，${failures.length} 个错误。此检查不代替运行测试或类型检查。`);

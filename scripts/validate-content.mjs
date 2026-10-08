import { readLibrary } from './library.mjs';
try {
  const { articles, resources } = await readLibrary();
  const ids = new Set(articles.map((article) => article.id));
  for (const article of articles) {
    for (const match of article.content.matchAll(/\]\(\?article=([^\s)]+)\)/g)) {
      if (!ids.has(decodeURIComponent(match[1]))) throw new Error(`${article.id} 引用了不存在的笔记：${match[1]}`);
    }
  }
  console.log(`内容校验通过：${articles.length} 篇笔记，${resources.length} 条资料。`);
} catch (error) {
  console.error(`内容校验失败：${error.message}`);
  process.exitCode = 1;
}

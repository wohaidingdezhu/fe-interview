import { createHash } from 'node:crypto';
function assetPath(prefix, value) { return `${prefix}-${createHash('sha256').update(value).digest('hex').slice(0, 16)}.json`; }
export function contentAssets(library) {
  const assets = [];
  const articles = library.articles.map(({ content, ...metadata }) => {
    const source = JSON.stringify({ content });
    const bodyPath = assetPath(`content/${metadata.id}`, source);
    assets.push({ fileName: bodyPath, source });
    return { ...metadata, contentLength: content.length, bodyPath };
  });
  const documents = library.articles.map((article) => ({ id: article.id, text:
    `${article.title} ${article.category} ${article.tags.join(' ')} ${article.description}\n${article.content}`
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/```[^\n]*\n|```/g, '').replace(/^#{1,6}\s*/gm, '').replace(/\s+/g, ' ').trim(),
  }));
  const source = JSON.stringify(documents), searchPath = assetPath('search/index', source);
  assets.push({ fileName: searchPath, source });
  return { catalog: { articles, resources: library.resources, searchPath }, assets };
}

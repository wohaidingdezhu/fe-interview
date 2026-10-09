import { createHash } from 'node:crypto';
import { inspectQuestions, questionPublicationFor } from './publication.mjs';
function assetPath(prefix, value) { return `${prefix}-${createHash('sha256').update(value).digest('hex').slice(0, 16)}.json`; }
export function contentAssets(library) {
  const assets = [];
  const articles = library.articles.map(({ content, ...metadata }) => {
    const questions = inspectQuestions({ content });
    const publishedQuestionCount = library.questionPublication === undefined
      ? (metadata.status === 'published' ? questions.length : 0)
      : questions.filter((question) => questionPublicationFor(library, question.number).status === 'published').length;
    const source = JSON.stringify({ content });
    const bodyPath = assetPath(`content/${metadata.id}`, source);
    assets.push({ fileName: bodyPath, source });
    return { ...metadata, contentLength: content.length, bodyPath,
      questionCount: metadata.questionCount ?? questions.length, publishedQuestionCount };
  });
  const documents = library.articles.map((article) => ({ id: article.id, text:
    `${article.title} ${article.category} ${article.tags.join(' ')} ${(article.aliases ?? []).join(' ')} ${article.description}\n${article.content}`
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/```[^\n]*\n|```/g, '').replace(/^#{1,6}\s*/gm, '').replace(/\s+/g, ' ').trim(),
  }));
  const source = JSON.stringify(documents), searchPath = assetPath('search/index', source);
  assets.push({ fileName: searchPath, source });
  return { catalog: { articles, resources: library.resources, searchPath }, assets };
}

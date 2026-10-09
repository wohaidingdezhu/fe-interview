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
    const questionCount = metadata.questionCount ?? questions.length;
    const completeTopic = questionCount > 0 && publishedQuestionCount === questionCount;
    const dates = library.questionPublication === undefined ? [] : questions
      .filter(question => questionPublicationFor(library, question.number).status === 'published')
      .map(question => questionPublicationFor(library, question.number).reviewedAt).filter(Boolean).sort();
    return { ...metadata, ...(completeTopic ? { status: 'published', quality: 'complete' } : {}),
      ...(dates.length ? { reviewedAt: dates[0] } : {}), contentLength: content.length, bodyPath,
      questionCount, publishedQuestionCount };
  });
  const plainText = content => content
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/```[^\n]*\n|```/g, '').replace(/^#{1,6}\s*/gm, '').replace(/\s+/g, ' ').trim();
  const documents = library.articles.flatMap(article => {
    const prefix = `${article.title} ${article.category} ${article.tags.join(' ')} ${(article.aliases ?? []).join(' ')} ${article.description}`;
    const questions = inspectQuestions(article);
    return questions.length ? questions.map(question => ({ id: article.id,
      questionNumber: question.number, questionTitle: `Q${question.number}｜${question.title}`,
      anchor: `q${question.number}`, text: plainText(`${prefix}\n${question.raw}`),
    })) : [{ id: article.id, text: plainText(`${prefix}\n${article.content}`) }];
  });
  const source = JSON.stringify(documents), searchPath = assetPath('search/index', source);
  assets.push({ fileName: searchPath, source });
  return { catalog: { articles, resources: library.resources, searchPath }, assets };
}

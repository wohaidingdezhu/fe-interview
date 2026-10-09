import { access } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

export function inspectQuestions(article) {
  return [...article.content.matchAll(/^## Q(\d+)｜([^\n]+)\n([\s\S]*?)(?=^## Q\d+｜|(?![\s\S]))/gm)].map((match) => {
    const answer = match[3].replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/^#{1,6}.*$/gm, '')
      .replace(/答案[：:]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
    return { number: Number(match[1]), title: match[2], characters: answer.length,
      issue: !answer.length ? 'empty' : answer.length < 30 ? 'short' : null };
  });
}

export function imagePaths(content) {
  const references = new Map([...content.matchAll(/^\s*\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm)].map((match) => [match[1].toLowerCase(), match[2]]));
  const paths = [...content.matchAll(/!\[[^\]]*\]\(<?([^\s)>]+)>?(?:\s+["'][^)]*["'])?\)/g)].map((match) => match[1]);
  for (const match of content.matchAll(/!\[([^\]]*)\]\[([^\]]*)\]/g)) {
    const path = references.get((match[2] || match[1]).toLowerCase());
    if (!path) throw new Error(`图片引用未定义：${match[2] || match[1]}`);
    paths.push(path);
  }
  return paths;
}

export function localImagePath(value, publicDirectory) {
  if (/^https?:\/\//i.test(value)) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith('//')) throw new Error(`不支持的图片地址：${value}`);
  const path = decodeURIComponent(value.split(/[?#]/)[0]).replace(/^\//, '');
  const absolute = resolve(publicDirectory, path);
  const name = relative(resolve(publicDirectory), absolute);
  if (!name || name === '..' || name.startsWith(`..${sep}`) || name.split(sep).includes('.private')) throw new Error(`图片超出公开目录：${value}`);
  return name.split(sep).join('/');
}

export function selectPublished(library) {
  const articles = library.articles.filter((article) => article.status === 'published');
  for (const article of articles) {
    if (article.quality !== 'complete' || inspectQuestions(article).some((question) => question.issue === 'empty')) {
      throw new Error(`${article.id} 尚未完成，不能公开发布`);
    }
  }
  return { articles, resources: library.resources.filter((resource) => resource.status === 'published') };
}

export async function validateContent(library, publicDirectory) {
  const errors = [], warnings = [], topics = [];
  const ids = new Set(library.articles.map((article) => article.id));
  const publishedIds = new Set(library.articles.filter((article) => article.status === 'published').map((article) => article.id));
  const numbers = new Set();
  for (const article of library.articles) {
    const questions = inspectQuestions(article);
    if (questions.length) {
      topics.push({ id: article.id, status: article.status, questions });
      if (!article.sources.length) warnings.push(`${article.id} 缺少引用来源 sources`);
      if (!article.technologyVersion) warnings.push(`${article.id} 缺少技术版本 technologyVersion`);
    }
    for (const question of questions) {
      if (numbers.has(question.number)) errors.push(`重复题号 Q${question.number}`);
      numbers.add(question.number);
      if (question.issue) {
        const label = `${article.id} Q${question.number} ${question.issue === 'empty' ? '无实质答案' : '答案过短'}`;
        if (article.status === 'published' && question.issue === 'empty') errors.push(label);
        else warnings.push(label);
      }
    }
    if (article.status === 'published' && article.quality !== 'complete') errors.push(`${article.id} 的公开内容必须 quality: complete`);
    for (const match of article.content.matchAll(/\]\(\?article=([^\s)]+)\)/g)) {
      const id = decodeURIComponent(match[1]);
      if (!ids.has(id)) errors.push(`${article.id} 引用了不存在的笔记：${id}`);
      else if (article.status === 'published' && !publishedIds.has(id)) errors.push(`${article.id} 公开文章链接到了草稿：${id}`);
    }
    try {
      for (const value of imagePaths(article.content)) {
        const name = localImagePath(value, publicDirectory);
        if (name) {
          try { await access(resolve(publicDirectory, name)); }
          catch { errors.push(`${article.id} 图片不存在：${value}`); }
        }
      }
    } catch (error) { errors.push(`${article.id}：${error.message}`); }
  }
  const questions = topics.flatMap((topic) => topic.questions);
  return { errors, warnings, topics, summary: { questions: questions.length,
    empty: questions.filter((question) => question.issue === 'empty').length,
    short: questions.filter((question) => question.issue === 'short').length,
    publishedArticles: publishedIds.size, draftArticles: library.articles.length - publishedIds.size,
    publishedResources: library.resources.filter((resource) => resource.status === 'published').length } };
}

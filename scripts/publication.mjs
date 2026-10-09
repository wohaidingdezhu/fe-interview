import { access } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { parseMarkdown, markdownNodes, withoutDefinitions } from './markdown.mjs';

const implementationPattern = /(^实现|手动实现|^手写|^封装|^编写|^写一个|^写出|^还原|用.+实现|CSS 实现|拖动实现|链式调用实现|内在实现|拓扑排序|笛卡尔积|并发任务控制|数组打平|深拷贝|柯里化|防抖|节流|截流|全排列|反转.*链表|二叉树.*遍历|链表.*中间节点)/i;
const defaultQuestionPublication = Object.freeze({ status: 'draft', quality: 'incomplete', sources: [] });

export function inspectQuestions(article) {
  // 用整篇 Markdown 的语法树识别题目与引用，避免代码示例被拆成题目。
  const tree = parseMarkdown(article.content);
  const headings = tree.children.flatMap(node => {
    if (node.type !== 'heading' || node.depth !== 2) return [];
    const start = node.position.start.offset, bodyStart = node.position.end.offset;
    const match = article.content.slice(start, bodyStart).match(/^## Q(\d+)｜([^\r\n]+)/);
    return match ? [{ number: Number(match[1]), title: match[2], start, bodyStart }] : [];
  });
  return headings.map((heading, index) => {
    const { start, bodyStart } = heading;
    const end = headings[index + 1]?.start ?? article.content.length;
    const body = article.content.slice(bodyStart, end).trim();
    const raw = article.content.slice(start, end).trim();
    const values = [];
    let hasCode = false;
    function visit(node) {
      if (['heading', 'image', 'imageReference', 'definition'].includes(node.type)) return;
      if (['text', 'inlineCode', 'code'].includes(node.type)) values.push(node.value);
      if (node.type === 'code' && node.value.trim()) hasCode = true;
      for (const child of node.children ?? []) visit(child);
    }
    // 图片替代文本和引用 URL 不算答案；保留实际文字与实现代码。
    for (const node of tree.children) if (node.position.start.offset >= bodyStart && node.position.start.offset < end) visit(node);
    const answer = values.join(' ').replace(/答案[：:]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
    const issues = [];
    if (!answer.length) issues.push('empty');
    else if (answer.length < 30) issues.push('short');
    if (implementationPattern.test(heading.title) && !hasCode) issues.push('missing-code');
    if (!hasCode && /(?:^|\n)\s*\*{0,2}定义[：:]/.test(body) && answer.length < 180) issues.push('definition-only');
    if (/(?:TODO|TBD|待补充|暂无答案)/i.test(body)) issues.push('placeholder');
    return { number: heading.number, title: heading.title, body, raw, start, end, characters: answer.length,
      issues: [...new Set(issues)], issue: issues[0] ?? null };
  });
}

export function questionPublicationFor(library, number) {
  return library.questionPublication?.[`Q${number}`] ?? defaultQuestionPublication;
}

export function publishedQuestionContent(article, questions, library) {
  const published = questions.filter((question) => questionPublicationFor(library, question.number).status === 'published');
  const definitions = new Map(), needed = new Set();
  for (const node of markdownNodes(article.content, ['definition', 'imageReference', 'linkReference'])) {
    if (node.type === 'definition') {
      // Markdown 中同名定义以第一条为准。
      if (!definitions.has(node.identifier)) definitions.set(node.identifier, article.content.slice(node.position.start.offset, node.position.end.offset));
    } else if (published.some(question => node.position.start.offset >= question.start && node.position.start.offset < question.end)) needed.add(node.identifier);
  }
  const content = published.map(question => {
    const text = withoutDefinitions(question.raw);
    const nodes = parseMarkdown(text).children;
    let end = text.length;
    // 每题导入时已有末尾分隔线，拼接时统一生成；代码里的横线不属于 thematicBreak。
    for (let index = nodes.length - 1; index >= 0 && nodes[index].type === 'thematicBreak'; index--) end = nodes[index].position.start.offset;
    return text.slice(0, end).trimEnd();
  }).join('\n\n---\n\n');
  const references = [...needed].map(id => definitions.get(id)).filter(Boolean);
  return [content, ...references].filter(Boolean).join('\n\n');
}

export function articlePublicationErrors(article) {
  const errors = [];
  if (article.quality !== 'complete') errors.push('quality 必须是 complete');
  if (!article.sources?.length) errors.push('缺少文章来源 sources');
  if (!article.technologyVersion) errors.push('缺少适用版本 technologyVersion');
  const nodes = markdownNodes(article.content, ['text']);
  const text = nodes.map(node => node.value).join(' ').replace(/[^\p{L}\p{N}]/gu, '');
  if (text.length < 30) errors.push('缺少实质正文（至少 30 个有效字符）');
  if (/(?:^|\n)\s*(?:>\s*)?(?:TODO|TBD)(?:\s*[:：]|\s*$)|暂无答案|在这里写正文|维护状态：这是一篇新建草稿|这项知识解决什么问题\s*\n- 核心原理与操作步骤/im.test(article.content)) errors.push('仍有模板或占位内容');
  return errors;
}

function questionPublicationErrors(question, publication) {
  const errors = [];
  if (publication.quality !== 'complete') errors.push('quality 必须是 complete');
  if (question.issues.length) errors.push(`仍有内容问题：${question.issues.join('、')}`);
  if (!publication.sources.length) errors.push('缺少逐题来源');
  if (!publication.technologyVersion) errors.push('缺少技术版本');
  if (!publication.reviewedAt) errors.push('缺少审核日期');
  return errors;
}

export function imagePaths(content) {
  const references = new Map(), paths = [];
  for (const node of markdownNodes(content, ['definition'])) if (!references.has(node.identifier)) references.set(node.identifier, node.url);
  for (const node of markdownNodes(content, ['image', 'imageReference'])) {
    const path = node.type === 'image' ? node.url : references.get(node.identifier);
    if (!path) throw new Error(`图片引用未定义：${node.identifier}`);
    paths.push(path);
  }
  return paths;
}

export function linkPaths(content) {
  const references = new Map();
  for (const node of markdownNodes(content, ['definition'])) if (!references.has(node.identifier)) references.set(node.identifier, node.url);
  return markdownNodes(content, ['link', 'linkReference']).map(node => node.type === 'link' ? node.url : references.get(node.identifier)).filter(Boolean);
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
  const articles = [];
  const perQuestion = library.questionPublication !== undefined;
  for (const article of library.articles) {
    const questions = inspectQuestions(article);
    if (perQuestion && questions.length) {
      const published = questions.filter((question) => questionPublicationFor(library, question.number).status === 'published');
      if (!published.length) continue;
      for (const question of published) {
        const errors = questionPublicationErrors(question, questionPublicationFor(library, question.number));
        if (errors.length) throw new Error(`${article.id} Q${question.number} 不能公开：${errors.join('；')}`);
      }
      const labels = published.map((question) => `Q${question.number}`);
      const description = published.length === questions.length
        ? `共 ${questions.length} 道题，已全部完成技术复核。`
        : `共 ${questions.length} 道题，已完成技术复核 ${published.length} 道${labels.length <= 8 ? `（${labels.join('、')}）` : ''}，待处理 ${questions.length - published.length} 道。`;
      const reviewedAt = published.map(question => questionPublicationFor(library, question.number).reviewedAt).sort()[0];
      articles.push({ ...article, description, content: publishedQuestionContent(article, questions, library),
        questionCount: questions.length, publishedQuestionCount: published.length, reviewedAt, status: 'published', quality: 'complete' });
      continue;
    }
    if (article.status !== 'published') continue;
    const errors = questions.length ? (article.quality !== 'complete' || questions.some(question => question.issues.length) ? ['题目尚未完成'] : []) : articlePublicationErrors(article);
    if (errors.length) throw new Error(`${article.id} 不能公开发布：${errors.join('；')}`);
    articles.push(article);
  }
  const publicIds = new Set(articles.map((article) => article.id));
  const safeArticles = articles.map((article) => ({ ...article, related: (article.related ?? []).filter((id) => id !== article.id && publicIds.has(id)) }));
  return { articles: safeArticles, resources: library.resources.filter((resource) => resource.status === 'published'), questionPublication: library.questionPublication ?? {} };
}

export async function validateContent(library, publicDirectory) {
  const errors = [], warnings = [], topics = [];
  const perQuestion = library.questionPublication !== undefined;
  const inspected = new Map(library.articles.map((article) => [article.id, inspectQuestions(article)]));
  const ids = new Set(library.articles.map((article) => article.id));
  const publishedIds = new Set(library.articles.filter((article) => {
    const questions = inspected.get(article.id);
    return perQuestion && questions.length
      ? questions.some((question) => questionPublicationFor(library, question.number).status === 'published')
      : article.status === 'published';
  }).map((article) => article.id));
  const numbers = new Set();
  let publishedQuestions = 0, draftQuestions = 0, missingQuestionSources = 0, missingQuestionVersions = 0;
  let staleReviews = 0, missingReviewDates = 0;

  for (const article of library.articles) {
    const questions = inspected.get(article.id);
    const publiclyVisible = publishedIds.has(article.id);
    for (const relatedId of article.related ?? []) {
      if (relatedId === article.id) errors.push(`${article.id} 不能关联自身`);
      else if (!ids.has(relatedId)) errors.push(`${article.id} 引用了不存在的相关文章：${relatedId}`);
      else if (publiclyVisible && !publishedIds.has(relatedId)) warnings.push(`${article.id} 的相关文章仍是草稿：${relatedId}`);
    }
    const latestChange = article.updatedAt ?? article.addedAt;
    if (perQuestion && questions.length) {
      const published = questions.filter(question => questionPublicationFor(library, question.number).status === 'published');
      const stale = published.filter(question => {
        const date = questionPublicationFor(library, question.number).reviewedAt;
        return date && date < latestChange;
      });
      if (stale.length) {
        staleReviews++;
        warnings.push(`${article.id} 的 ${stale.map(question => `Q${question.number}`).join('、')} 更新晚于最近审核，需要重新复核`);
      }
    } else if (article.reviewedAt && article.reviewedAt < latestChange) {
      staleReviews++;
      warnings.push(`${article.id} 更新晚于最近审核，需要重新复核`);
    } else if (publiclyVisible && !article.reviewedAt) {
      missingReviewDates++;
      warnings.push(`${article.id} 已公开但缺少 reviewedAt`);
    }
    const reportedQuestions = questions.map((question) => {
      const publication = perQuestion ? questionPublicationFor(library, question.number) : {
        status: article.status, quality: article.quality, sources: article.sources,
        technologyVersion: article.technologyVersion, reviewedAt: article.addedAt,
      };
      return { ...question, status: publication.status, sources: publication.sources,
        quality: publication.quality, technologyVersion: publication.technologyVersion, reviewedAt: publication.reviewedAt };
    });
    if (questions.length) {
      topics.push({ id: article.id, status: article.status, questions: reportedQuestions });
      if (!article.sources.length) warnings.push(`${article.id} 缺少专题级引用来源 sources`);
      if (!article.technologyVersion) warnings.push(`${article.id} 缺少专题级技术版本 technologyVersion`);
    }

    for (let index = 0; index < questions.length; index++) {
      const question = questions[index], reported = reportedQuestions[index];
      if (numbers.has(question.number)) errors.push(`重复题号 Q${question.number}`);
      numbers.add(question.number);
      if (!reported.sources.length) missingQuestionSources++;
      if (!reported.technologyVersion) missingQuestionVersions++;
      if (reported.status === 'published') {
        publishedQuestions++;
        for (const problem of questionPublicationErrors(question, reported)) errors.push(`${article.id} Q${question.number} ${problem}`);
      } else {
        draftQuestions++;
        for (const issue of question.issues) warnings.push(`${article.id} Q${question.number} ${issue}`);
      }
    }

    if (!questions.length) {
      const problems = articlePublicationErrors(article);
      if (article.status === 'published') errors.push(...problems.map(problem => `${article.id} ${problem}`));
      else warnings.push(...problems.filter(problem => !problem.startsWith('quality ')).map(problem => `${article.id} ${problem}`));
    } else if (!perQuestion && article.status === 'published' && article.quality !== 'complete') errors.push(`${article.id} 的公开内容必须 quality: complete`);
    const publicContent = perQuestion && questions.length ? publishedQuestionContent(article, questions, library)
      : article.status === 'published' ? article.content : '';
    for (const value of linkPaths(article.content).filter(value => value.startsWith('?article='))) {
      const id = new URLSearchParams(value.slice(1)).get('article');
      if (!ids.has(id)) errors.push(`${article.id} 引用了不存在的笔记：${id}`);
    }
    for (const value of linkPaths(publicContent).filter(value => value.startsWith('?article='))) {
      const id = new URLSearchParams(value.slice(1)).get('article');
      if (ids.has(id) && !publishedIds.has(id)) errors.push(`${article.id} 公开内容链接到了草稿：${id}`);
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

  for (const key of Object.keys(library.questionPublication ?? {})) if (!numbers.has(Number(key.slice(1)))) errors.push(`逐题发布清单引用了不存在的 ${key}`);
  if (missingQuestionSources) warnings.push(`${missingQuestionSources} 道题缺少逐题来源`);
  if (missingQuestionVersions) warnings.push(`${missingQuestionVersions} 道题缺少逐题技术版本`);
  const questions = topics.flatMap((topic) => topic.questions);
  return { errors, warnings, topics, summary: { questions: questions.length,
    empty: questions.filter((question) => question.issues.includes('empty')).length,
    short: questions.filter((question) => question.issues.includes('short')).length,
    semanticIssues: questions.filter((question) => question.issues.some((issue) => !['empty', 'short'].includes(issue))).length,
    publishedQuestions, draftQuestions, missingQuestionSources, missingQuestionVersions,
    publishedArticles: publishedIds.size, draftArticles: library.articles.length - publishedIds.size,
    publishedResources: library.resources.filter((resource) => resource.status === 'published').length,
    staleReviews, missingReviewDates } };
}

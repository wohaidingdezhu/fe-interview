import { publicURL } from './link-utils.mjs';
import { inspectQuestions, selectPublished, questionPublicationFor } from './publication.mjs';
import { markdownNodes } from './markdown.mjs';

export function linkReferences(library, files) {
  const published = selectPublished(library), references = new Map();
  const add = (url, reference) => {
    if (!/^https?:\/\//i.test(url ?? '')) return;
    const key = publicURL(url), items = references.get(key) ?? [];
    if (!items.some(item => JSON.stringify(item) === JSON.stringify(reference))) items.push(reference);
    references.set(key, items);
  };
  const lineAt = (raw, offset) => raw.slice(0, Math.max(0, offset)).split('\n').length;
  function jsonLine(file, key, url) {
    const raw = files[file] ?? '', start = Math.max(0, raw.indexOf(JSON.stringify(key)));
    const offset = raw.indexOf(JSON.stringify(url), start);
    return lineAt(raw, offset < 0 ? start : offset);
  }
  for (const resource of published.resources) {
    const file = 'src/data/resources.json';
    add(resource.url, { title: resource.title, file, line: jsonLine(file, resource.id, resource.url), kind: '资料' });
  }
  for (const article of published.articles) {
    const original = library.articles.find(item => item.id === article.id);
    const file = library.articlePaths[article.id], raw = files[file];
    const bodyStart = raw.indexOf(original.content), bodyLine = lineAt(raw, bodyStart);
    for (const url of article.sources) add(url, { title: article.title, file, line: lineAt(raw, raw.indexOf(url)), kind: '文章来源' });
    const questions = inspectQuestions(original);
    for (const question of questions) {
      if (library.questionPublication !== undefined && questionPublicationFor(library, question.number).status !== 'published') continue;
      const publicationFile = 'src/data/question-publication.json';
      for (const url of questionPublicationFor(library, question.number).sources) add(url, {
        title: article.title, questionNumber: question.number, file: publicationFile,
        line: jsonLine(publicationFile, `Q${question.number}`, url), kind: '题目来源',
      });
    }
    const definitions = new Map();
    for (const node of markdownNodes(original.content, ['definition'])) if (!definitions.has(node.identifier)) definitions.set(node.identifier, node);
    for (const node of markdownNodes(original.content, ['link', 'linkReference'])) {
      const question = questions.find(question => node.position.start.offset >= question.start && node.position.start.offset < question.end);
      if (questions.length && library.questionPublication !== undefined && (!question || questionPublicationFor(library, question.number).status !== 'published')) continue;
      const destination = node.type === 'link' ? node : definitions.get(node.identifier);
      if (!destination) continue;
      add(destination.url, { title: article.title, ...(question ? { questionNumber: question.number } : {}), file,
        line: bodyLine + node.position.start.line - 1, kind: '正文引用' });
    }
  }
  return references;
}

const labels = { dead: '疑似失效', review: '需要复核', restricted: '登录或机器人限制', temporary: '临时失败', redirected: '可用（重定向）', ok: '正常' };
export function linkReport(results, references, checkedAt = new Date().toISOString()) {
  const priority = Object.keys(labels);
  const enriched = results.map(item => ({ ...item, references: references.get(item.url) ?? [] }))
    .sort((a, b) => priority.indexOf(a.state) - priority.indexOf(b.state) || a.url.localeCompare(b.url));
  const escape = value => String(value ?? '').replace(/[|\r\n<>]/g, ' ');
  const problems = enriched.filter(item => !['ok', 'redirected'].includes(item.state));
  const rows = items => items.map(item => `| ${labels[item.state]} | ${escape(item.url)} | ${escape(item.status ?? item.error)} | ${item.references.map(ref => `${escape(ref.title)}${ref.questionNumber ? ` Q${ref.questionNumber}` : ''} · ${ref.kind} · ${ref.file}:${ref.line}`).join('<br>')} | ${escape(item.finalURL)} |`).join('\n');
  const table = items => `| 状态 | 地址 | HTTP / 原因 | 文章 / 题号 / 位置 | 最终地址 |\n| --- | --- | --- | --- | --- |\n${rows(items)}\n`;
  const markdown = `# 公开资料链接维护清单\n\n检查时间：${checkedAt}\n\n共 ${enriched.length} 个地址，${problems.length} 个待复核。403、限流与超时不等于永久失效；先人工复核再修改。外站失败不阻断发布。位置指向源文件的引用行，题目来源指向逐题发布清单。\n\n## 待处理\n\n${problems.length ? table(problems) : '没有待复核地址。\n'}\n<details><summary>全部结果</summary>\n\n${table(enriched)}\n</details>\n`;
  return { results: enriched, markdown };
}

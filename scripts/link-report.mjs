import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import { markdownFiles } from './library.mjs';
import { parseArticle } from '../src/data-utils.ts';
import { inspectQuestions } from './publication.mjs';
import { markdownNodes } from './markdown.mjs';
import { publicURL } from './link-utils.mjs';

const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;
const document = text => {
  const parsed = parseDocument(text);
  if (parsed.errors.length) throw parsed.errors[0];
  return parsed;
};

// 在原始文件上定位，不能用发布过滤后的正文行号定位草稿与公开题混排的源文件。
export const collectLinkReferences = (library, { articleFiles, resourcesText, questionText }) => {
  const references = [];
  const add = (url, location) => {
    if (/^https?:\/\//i.test(url ?? '')) references.push({ url: publicURL(url), originalURL: url, ...location });
  };
  const resources = document(resourcesText).contents;
  for (const resource of library.resources) {
    const node = resources.items.find(item => item.get('id') === resource.id)?.get('url', true);
    if (!node) throw new Error(`找不到资料源位置：${resource.id}`);
    add(resource.url, { kind: 'resource', title: resource.title, path: 'src/data/resources.json', line: lineAt(resourcesText, node.range[0]) });
  }
  const publications = document(questionText);
  for (const article of library.articles) {
    const file = articleFiles.find(item => item.article.id === article.id);
    if (!file) throw new Error(`找不到文章源文件：${article.id}`);
    const { raw, path } = file;
    const front = raw.match(/^(\uFEFF?---\r?\n)([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
    if (!front) throw new Error(`缺少文章元数据：${path}`);
    const meta = document(front[2]);
    const bodyOffset = raw.length - front[3].trimStart().length;
    const content = file.article.content;
    const originalQuestions = inspectQuestions(file.article);
    const publishedNumbers = new Set(inspectQuestions(article).map(question => question.number));
    const owner = { articleId: article.id, articleTitle: article.title };
    for (const node of meta.get('sources', true)?.items ?? []) {
      add(node.value, { ...owner, kind: 'article-source', title: article.title, path, line: lineAt(raw, front[1].length + node.range[0]) });
    }
    for (const question of originalQuestions.filter(item => publishedNumbers.has(item.number))) {
      const nodes = publications.getIn([`Q${question.number}`, 'sources'], true)?.items ?? [];
      for (const node of nodes) add(node.value, { ...owner, kind: 'question-source', title: question.title, questionNumber: question.number,
        path: 'src/data/question-publication.json', line: lineAt(questionText, node.range[0]),
        articlePath: path, articleLine: lineAt(raw, bodyOffset + question.start) });
    }
    const definitions = new Map();
    for (const node of markdownNodes(content, ['definition'])) if (!definitions.has(node.identifier)) definitions.set(node.identifier, node);
    for (const node of markdownNodes(content, ['link', 'linkReference'])) {
      const question = originalQuestions.find(item => node.position.start.offset >= item.start && node.position.start.offset < item.end);
      if (question && !publishedNumbers.has(question.number)) continue;
      const target = node.type === 'link' ? node : definitions.get(node.identifier);
      if (!target) continue;
      add(target.url, { ...owner, kind: 'body-link', title: question?.title ?? article.title, questionNumber: question?.number,
        path, line: lineAt(raw, bodyOffset + target.position.start.offset), usageLine: lineAt(raw, bodyOffset + node.position.start.offset) });
    }
  }
  return references;
};

export const readLinkReferences = async (library, root = fileURLToPath(new URL('../', import.meta.url))) => {
  const directory = join(root, 'src/articles');
  const articleFiles = await Promise.all((await markdownFiles(directory)).map(async path => {
    const raw = await readFile(join(directory, path), 'utf8');
    return { path: `src/articles/${path.replaceAll('\\', '/')}`, raw, article: parseArticle(raw, path) };
  }));
  const [resourcesText, questionText] = await Promise.all([
    readFile(join(root, 'src/data/resources.json'), 'utf8'),
    readFile(join(root, 'src/data/question-publication.json'), 'utf8').catch(error => { if (error.code === 'ENOENT') return '{}'; throw error; }),
  ]);
  return collectLinkReferences(library, { articleFiles, resourcesText, questionText });
};

const states = {
  dead: { label: '疑似失效', priority: 1, action: '先人工核实 404/410；确认迁移后修订所有引用，不能确认时保留复核记录。' },
  temporary: { label: '临时失败', priority: 2, action: '稍后重查；确认网络、超时或限流，不直接删除引用。' },
  review: { label: '需要复核', priority: 2, action: '人工确认响应状态和内容是否仍与引用主题一致。' },
  restricted: { label: '访问受限', priority: 3, action: '在浏览器中确认登录或机器人限制，不按永久失效处理。' },
  redirected: { label: '可用（重定向）', priority: 4, action: '可继续使用；更新引用前核对最终地址对应的内容。' },
  ok: { label: '正常', priority: 5, action: '无需处理。' },
};
const cell = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\r\n]/g, ' ').replace(/[|\[\]`\\]/g, '\\$&');

export const createLinkReports = (results, references, { checkedAt = new Date().toISOString(), repositoryURL = 'https://github.com/wohaidingdezhu/fe-interview', revision = 'main' } = {}) => {
  const byURL = new Map();
  for (const reference of references) {
    const locations = byURL.get(reference.url) ?? [];
    if (!locations.some(item => JSON.stringify(item) === JSON.stringify(reference))) locations.push(reference);
    byURL.set(reference.url, locations);
  }
  const items = results.map(result => ({ ...result, ...states[result.state], checkedAt, references: byURL.get(result.url) ?? [] }))
    .sort((a, b) => a.priority - b.priority || b.references.length - a.references.length || a.url.localeCompare(b.url));
  const pending = items.filter(item => !['ok', 'redirected'].includes(item.state));
  const sourceLink = (path, line) => `[${cell(`${path}:${line}`)}](<${repositoryURL}/blob/${encodeURIComponent(revision)}/${path.split('/').map(encodeURIComponent).join('/')}#L${line}>)`;
  const address = url => `<${url.replace(/\|/g, '%7C')}>`;
  const location = reference => `${cell(reference.articleTitle ?? reference.title)}${reference.questionNumber ? ` · Q${reference.questionNumber} ${cell(reference.title)}` : ''} · ${sourceLink(reference.path, reference.line)}${reference.articlePath ? ` · 正文 ${sourceLink(reference.articlePath, reference.articleLine)}` : ''}${reference.usageLine && reference.usageLine !== reference.line ? ` · 使用处 ${sourceLink(reference.path, reference.usageLine)}` : ''}`;
  const table = (rows, compact = false) => `| 优先级 / 状态 | 地址 | HTTP / 原因 | 引用位置 | 处理建议 |\n| --- | --- | --- | --- | --- |\n${rows.map(item => {
    const locations = compact ? item.references.slice(0, 3) : item.references;
    const extra = compact && item.references.length > 3 ? `；其余 ${item.references.length - 3} 处见完整报告` : '';
    return `| ${item.priority} · ${item.label} | ${address(item.url)}${item.finalURL && item.finalURL !== item.url ? ` → ${address(item.finalURL)}` : ''} | ${cell(item.status ?? item.error)} | ${locations.map(location).join('<br>')}${extra} | ${item.action} |`;
  }).join('\n')}\n`;
  const header = `# 公开资料链接检查\n\n检查时间：${checkedAt}\n\n检查 ${items.length} 个唯一地址，${pending.length} 个需要复核。按状态优先级、引用数量排序，优先核实疑似失效并影响多处内容的地址。只检查公开内容，不修改原始 URL；访问限制、限流与超时不等于永久失效，单个外站失败不阻断发布。\n\n`;
  return { items, pending: pending.length,
    markdown: `${header}## 待处理清单\n\n${pending.length ? table(pending) : '没有需要复核的地址。\n'}\n## 全部检查结果\n\n${table(items)}`,
    summary: `${header}完整 Markdown 和 JSON 报告可从本次运行的 published-link-report 下载，包含全部引用位置。摘要最多显示前 50 个待处理地址。\n\n${pending.length ? table(pending.slice(0, 50), true) : '没有需要复核的地址。\n'}` };
};

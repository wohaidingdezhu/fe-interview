import { parse } from 'yaml';

export const resourceTypes = ['文章', '官方文档', '视频', '工具', '开源项目'] as const;
export type PublicationStatus = 'draft' | 'published';
export type Resource = {
  id: string; title: string; url: string; description: string; source: string;
  type: typeof resourceTypes[number]; category: string; tags: string[]; addedAt: string; status: PublicationStatus;
};
export type Article = {
  id: string; title: string; category: string; description: string;
  kind: '阅读指南' | '知识文章' | '手写题解'; tags: string[]; addedAt: string; order: number; content: string;
  status: PublicationStatus; quality: 'complete' | 'incomplete'; sources: string[]; technologyVersion?: string;
};
export type ArticleMetadata = Omit<Article, 'content'> & { contentLength: number; bodyPath: string };
function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} 必须是对象`);
  return value as Record<string, unknown>;
}
function publicationStatus(data: Record<string, unknown>, label: string): PublicationStatus {
  if ('privateNotes' in data) throw new Error(`${label} 的私人备注必须存放在 .private/ 中`);
  const status = data.status ?? 'draft';
  if (status !== 'draft' && status !== 'published') throw new Error(`${label} 的 status 必须是 draft 或 published`);
  return status;
}
function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} 不能为空`);
  return value.trim();
}
function identifier(value: unknown, label: string): string {
  const id = text(value, label);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`${label} 只能使用小写字母、数字和连字符`);
  return id;
}
function tags(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} 必须是字符串数组`);
  return [...new Set(value.map((tag) => text(tag, label)))];
}
function date(value: unknown, label: string): string {
  const result = text(value, label);
  const timestamp = new Date(`${result}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(timestamp.getTime()) || timestamp.toISOString().slice(0, 10) !== result) {
    throw new Error(`${label} 必须是有效的 YYYY-MM-DD 日期`);
  }
  return result;
}
export function validateURL(value: unknown): string {
  const input = text(value, 'URL');
  let url: URL;
  try { url = new URL(input); } catch { throw new Error(`无效 URL：${input}`); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error(`URL 必须是无账号密码的 HTTP(S) 链接：${input}`);
  }
  return input;
}
// 忽略定位片段与常见跟踪参数，保留影响正文的查询参数。
export function canonicalURL(value: string): string {
  const url = new URL(validateURL(value));
  if (!/^#!?\//.test(url.hash)) url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || /^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.href;
}
export function validateResource(value: unknown, label = '资料'): Resource {
  const data = record(value, label);
  const type = text(data.type, `${label}类型`);
  if (!resourceTypes.includes(type as Resource['type'])) throw new Error(`${label}类型必须是：${resourceTypes.join('、')}`);
  return {
    id: identifier(data.id, `${label} ID`), title: text(data.title, `${label}标题`),
    url: validateURL(data.url), description: text(data.description, `${label}简介`),
    source: text(data.source, `${label}来源`), type: type as Resource['type'],
    category: text(data.category, `${label}分类`), tags: tags(data.tags, `${label}标签`),
    addedAt: date(data.addedAt, `${label}收录日期`),
    status: publicationStatus(data, label),
  };
}
export function parseArticle(raw: string, path: string): Article {
  const match = raw.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${path} 缺少 YAML 元数据`);
  const data = record(parse(match[1]), path);
  const kind = text(data.kind, `${path}类型`);
  if (!['阅读指南', '知识文章', '手写题解'].includes(kind)) throw new Error(`${path} 的 kind 无效`);
  const order = data.order ?? 100;
  if (typeof order !== 'number' || !Number.isFinite(order)) throw new Error(`${path} 的 order 必须是数字`);
  const quality = data.quality ?? 'incomplete';
  if (quality !== 'complete' && quality !== 'incomplete') throw new Error(`${path} 的 quality 必须是 complete 或 incomplete`);
  const sources = data.sources ?? [];
  if (!Array.isArray(sources)) throw new Error(`${path} 的 sources 必须是 URL 数组`);
  return {
    id: identifier(data.id, `${path} ID`), title: text(data.title, `${path}标题`),
    category: text(data.category, `${path}分类`), description: text(data.description, `${path}简介`),
    kind: kind as Article['kind'], tags: tags(data.tags, `${path}标签`),
    addedAt: date(data.addedAt, `${path}日期`), order, content: text(match[2], `${path}正文`),
    status: publicationStatus(data, path), quality,
    sources: sources.map((value: unknown) => validateURL(value)),
    technologyVersion: data.technologyVersion === undefined ? undefined : text(data.technologyVersion, `${path}技术版本`),
  };
}
export function validateLibrary(data: unknown, articles: Article[] = []): Resource[] {
  if (!Array.isArray(data)) throw new Error('资料文件必须是 JSON 数组');
  const resources = data.map((value, index) => validateResource(value, `第 ${index + 1} 条资料`));
  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const item of [...articles, ...resources]) {
    if (ids.has(item.id)) throw new Error(`重复 ID：${item.id}`);
    ids.add(item.id);
  }
  for (const item of resources) {
    const url = canonicalURL(item.url);
    if (urls.has(url)) throw new Error(`重复 URL：${item.url}`);
    urls.add(url);
  }
  return resources;
}
export type ListItem = {
  id: string; title: string; description: string; category: string;
  tags: string[]; type: string; source: string; addedAt: string; url?: string; content?: string;
};
export type Filters = { query: string; category: string; tags: string[]; type: string; sort: string; page: number; pageSize: number };
export function filterItems(items: ListItem[], filters: Filters) {
  const terms = filters.query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const matching = items.filter((item) => {
    const searchable = `${item.title} ${item.description} ${item.source} ${item.category} ${item.tags.join(' ')} ${item.content || ''}`.toLocaleLowerCase();
    return (!filters.category || item.category === filters.category)
      && (!filters.type || item.type === filters.type)
      && filters.tags.every((tag) => item.tags.includes(tag))
      && terms.every((term) => searchable.includes(term));
  }).sort((a, b) => filters.sort === 'title'
    ? a.title.localeCompare(b.title, 'zh-CN')
    : filters.sort === 'oldest' ? a.addedAt.localeCompare(b.addedAt) || a.id.localeCompare(b.id)
      : b.addedAt.localeCompare(a.addedAt) || a.id.localeCompare(b.id));
  const pageSize = Math.max(1, Math.floor(filters.pageSize) || 12);
  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const page = Math.min(pages, Math.max(1, Math.floor(filters.page) || 1));
  return { items: matching.slice((page - 1) * pageSize, page * pageSize), total: matching.length, page, pages };
}

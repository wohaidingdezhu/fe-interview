import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const kinds = new Set(['阅读指南', '知识文章', '手写题解']);
function required(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}不能为空`);
  return value.trim();
}
function articlePath(value) {
  const normalized = required(value, '文章路径').replace(/\\/g, '/').replace(/\.md$/i, '');
  const parts = normalized.split('/');
  if (normalized.startsWith('/') || parts.some((part) => !part || part === '..' || part.startsWith('.'))) throw new Error('文章路径不能越出目录或使用隐藏目录');
  if (parts.some((part) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part))) throw new Error('文章路径和 ID 只能使用小写字母、数字和连字符');
  return { relative: `${normalized}.md`, id: parts.at(-1) };
}
function validDate(value) {
  const date = required(value, '日期');
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('日期必须是有效的 YYYY-MM-DD');
  return date;
}
function validSources(values) {
  return values.map((value) => {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(`来源必须是公开 HTTP(S) URL：${value}`);
    return value;
  });
}

export async function createArticle({
  relativePath,
  title,
  category,
  description,
  tags = [],
  aliases = [],
  related = [],
  kind = '知识文章',
  sources = [],
  technologyVersion,
  order = 1000,
  addedAt = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }),
  updatedAt,
  reviewedAt,
  articlesDir = resolve('src/articles'),
}) {
  const target = articlePath(relativePath);
  if (!kinds.has(kind)) throw new Error(`kind 必须是：${[...kinds].join('、')}`);
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== 'string' || !tag.trim())) throw new Error('tags 必须是字符串数组');
  if (!Array.isArray(aliases) || aliases.some((alias) => typeof alias !== 'string' || !alias.trim())) throw new Error('aliases 必须是字符串数组');
  if (!Array.isArray(related) || related.some((id) => typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))) throw new Error('related 必须是合法 ID 数组');
  if (!Array.isArray(sources)) throw new Error('sources 必须是 URL 数组');
  const created = validDate(addedAt);
  const updated = updatedAt ? validDate(updatedAt) : undefined;
  const reviewed = reviewedAt ? validDate(reviewedAt) : undefined;
  if (updated && updated < created) throw new Error('updatedAt 不能早于 addedAt');
  const file = join(articlesDir, target.relative);
  const content = `---
id: ${JSON.stringify(target.id)}
title: ${JSON.stringify(required(title, '标题'))}
category: ${JSON.stringify(required(category, '分类'))}
description: ${JSON.stringify(required(description, '简介'))}
kind: ${JSON.stringify(kind)}
tags: ${JSON.stringify([...new Set(tags.map((tag) => tag.trim()))])}
aliases: ${JSON.stringify([...new Set(aliases.map((alias) => alias.trim()))])}
related: ${JSON.stringify([...new Set(related)])}
addedAt: ${JSON.stringify(created)}
${updated ? `updatedAt: ${JSON.stringify(updated)}\n` : ''}${reviewed ? `reviewedAt: ${JSON.stringify(reviewed)}\n` : ''}order: ${Number.isFinite(order) ? order : 1000}
status: draft
quality: incomplete
sources: ${JSON.stringify(validSources(sources))}
${technologyVersion ? `technologyVersion: ${JSON.stringify(required(technologyVersion, '技术版本'))}\n` : ''}---

> 维护状态：这是一篇新建草稿。完成内容、来源和技术审核后，再改为 quality: complete；确认公开时改为 status: published。

## 内容提纲

- 这项知识解决什么问题
- 核心原理与操作步骤
- 可观察的验证结果
- 常见错误与适用边界
- 参考资料与适用版本
`;
  await mkdir(dirname(file), { recursive: true });
  try { await writeFile(file, content, { encoding: 'utf8', flag: 'wx' }); }
  catch (error) { if (error.code === 'EEXIST') throw new Error(`文章已存在，不会覆盖：${file}`); throw error; }
  return file;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const args = process.argv.slice(2), relativePath = args.shift(), options = {};
    for (let index = 0; index < args.length; index++) {
      const flag = args[index];
      if (!flag.startsWith('--') || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`无效参数：${flag}`);
      options[flag.slice(2)] = args[++index];
    }
    const tags = options.tags ? options.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
    const sources = options.sources ? options.sources.split(',').map((source) => source.trim()).filter(Boolean) : [];
    const aliases = options.aliases ? options.aliases.split(',').map((alias) => alias.trim()).filter(Boolean) : [];
    const related = options.related ? options.related.split(',').map((id) => id.trim()).filter(Boolean) : [];
    const file = await createArticle({ relativePath, title: options.title, category: options.category,
      description: options.description, tags, aliases, related, sources, kind: options.kind,
      technologyVersion: options.version, updatedAt: options['updated-at'], reviewedAt: options['reviewed-at'] });
    console.log(`已创建草稿：${file}`);
  } catch (error) {
    console.error(`创建失败：${error.message}`);
    console.error('用法：npm run new:article -- <分类目录/slug> --title 标题 --category 分类 --description 简介 --tags 标签1,标签2 [--aliases 别名1,别名2] [--related id1,id2] [--sources URL1,URL2] [--version 版本] [--updated-at YYYY-MM-DD] [--reviewed-at YYYY-MM-DD]');
    process.exitCode = 1;
  }
}

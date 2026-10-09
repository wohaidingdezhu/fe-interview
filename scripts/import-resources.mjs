import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { canonicalURL, validateResource, validateLibrary } from '../src/data-utils.ts';
import { readLibrary, resourcesPath } from './library.mjs';

try {
  const args = process.argv.slice(2);
  const input = args.shift();
  if (!input || input.startsWith('--')) throw new Error('用法：npm run import:resources -- 文件 [--category 分类] [--tags 标签1,标签2] [--type 类型] [--source 来源] [--dry-run]');
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') { options.dryRun = true; continue; }
    const key = args[i].replace(/^--/, '');
    if (!['category', 'tags', 'type', 'source', 'status'].includes(key) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`无效参数：${args[i]}`);
    options[key] = args[++i];
  }
  const raw = (await readFile(resolve(input), 'utf8')).replace(/^\uFEFF/, '').trim();
  if (!raw) throw new Error('导入文件为空');
  const entries = raw.startsWith('[') || raw.startsWith('{') ? JSON.parse(raw) : raw.split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => { const [url, title, description] = line.split('\t'); return { url: url.trim(), title: title?.trim(), description: description?.trim() }; });
  if (!Array.isArray(entries)) throw new Error('JSON 导入文件必须是数组');
  const { articles, resources } = await readLibrary();
  const seen = new Set(resources.map((item) => canonicalURL(item.url)));
  let duplicates = 0;
  const added = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`第 ${i + 1} 条必须是对象`);
    const canonical = canonicalURL(entry.url);
    if (seen.has(canonical)) { duplicates++; continue; }
    const url = new URL(entry.url);
    const item = validateResource({
      ...entry,
      id: entry.id ?? `link-${createHash('sha256').update(canonical).digest('hex').slice(0, 12)}`,
      title: entry.title ?? `${url.hostname}${url.pathname === '/' ? '' : url.pathname}`,
      description: entry.description ?? '外部资料，阅读后补充摘要。',
      category: entry.category ?? options.category ?? '未分类',
      source: entry.source ?? options.source ?? url.hostname,
      type: entry.type ?? options.type ?? '文章',
      tags: entry.tags ?? (options.tags ? options.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : []),
      addedAt: entry.addedAt ?? new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }),
      status: entry.status ?? options.status ?? 'draft',
    }, `第 ${i + 1} 条资料`);
    seen.add(canonical); added.push(item);
  }
  const combined = validateLibrary([...resources, ...added], articles);
  if (!options.dryRun && added.length) {
    const temporary = `${resourcesPath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, `${JSON.stringify(combined, null, 2)}\n`, { flag: 'wx' });
      await rename(temporary, resourcesPath);
    } finally { await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; }); }
  }
  console.log(`${options.dryRun ? '预览' : '导入完成'}：新增 ${added.length} 条，跳过重复 ${duplicates} 条，总计 ${combined.length} 条。`);
  if (options.dryRun) console.log('未写入文件；移除 --dry-run 后执行导入。');
} catch (error) {
  console.error(`导入失败，未写入资料文件：${error.message}`);
  process.exitCode = 1;
}

import { parse } from 'parse5';
import { createHash } from 'node:crypto';
import { publicURL } from './link-utils.mjs';
import { canonicalURL } from '../src/data-utils.ts';
export function extractMetadata(html) {
  const stack = [parse(html)], meta = new Map(); let title = '';
  const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
  while (stack.length) {
    const node = stack.pop(), attributes = new Map((node.attrs ?? []).map(item => [item.name, item.value]));
    if (node.tagName === 'title' && !title) title = text(node);
    if (node.tagName === 'meta') {
      const key = (attributes.get('property') || attributes.get('name') || '').toLowerCase();
      if (!meta.has(key)) meta.set(key, attributes.get('content') || '');
    }
    stack.push(...(node.childNodes ?? []).toReversed());
  }
  const clean = value => value.replace(/\s+/g, ' ').trim();
  return { title: clean(meta.get('og:title') || meta.get('twitter:title') || title),
    description: clean(meta.get('description') || meta.get('og:description') || meta.get('twitter:description') || '') };
}
export async function fetchResource(value, { fetchImpl = fetch, now = new Date(), maxBytes = 262144 } = {}) {
  const original = new URL(value).href, signal = AbortSignal.timeout(10000); let url = publicURL(original);
  for (let redirects = 0; redirects <= 5; redirects++) {
    const response = await fetchImpl(url, { redirect: 'manual', signal, headers: { Accept: 'text/html', 'User-Agent': 'fe-interview-metadata/1.0' } });
    if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.get('location')) {
      await response.body?.cancel(); url = publicURL(new URL(response.headers.get('location'), url).href); continue;
    }
    if (!response.ok || !/^(text\/html|application\/xhtml\+xml)\b/i.test(response.headers.get('content-type') || '')) {
      await response.body?.cancel(); throw new Error(`无法读取 HTML 页面（HTTP ${response.status}）`);
    }
    if (!response.body) throw new Error('页面正文为空');
    const reader = response.body.getReader(), chunks = []; let length = 0;
    try {
      while (length < maxBytes) {
        const { value: bytes, done } = await reader.read(); if (done) break;
        const selected = bytes.subarray(0, maxBytes - length); chunks.push(selected); length += selected.length;
      }
    } finally { await reader.cancel(); }
    const buffer = Buffer.concat(chunks), charset = /charset\s*=\s*["']?([^\s;"']+)/i.exec(response.headers.get('content-type'))?.[1] || 'utf-8';
    const { title, description } = extractMetadata(new TextDecoder(charset).decode(buffer));
    if (!title) throw new Error('页面没有静态标题，请手动录入');
    return { id: `link-${createHash('sha256').update(canonicalURL(original)).digest('hex').slice(0, 12)}`, title, url: original,
      description: description || '待整理：请补充简介。', source: new URL(url).hostname,
      type: '文章', category: '未分类', tags: [], addedAt: now.toISOString().slice(0, 10), status: 'draft' };
  }
  throw new Error('重定向过多');
}

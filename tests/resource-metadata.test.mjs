import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMetadata, fetchResource } from '../scripts/resource-metadata.mjs';

test('HTML 解析处理属性顺序、实体和大小写；不把脚本当作元数据', () => {
  assert.deepEqual(extractMetadata('<title>Fallback</title><META CONTENT="React &amp; Vue" PROPERTY="og:title"><meta content="说明 &quot;引号&quot;" name="description"><script>"<meta property=og:title content=wrong>"</script>'), { title: 'React & Vue', description: '说明 "引号"' });
});
test('抓取只生成草稿，限制读取字节且保留原链接，HTTP/非 HTML 错误拒绝', async () => {
  const html = '<title>Example</title><meta name="description" content="笔记"><p>' + 'a'.repeat(1000);
  const result = await fetchResource('https://example.com/a#section', { maxBytes: 150, now: new Date('2026-10-09'), fetchImpl: async () => new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }) });
  assert.equal(result.title, 'Example'); assert.equal(result.description, '笔记'); assert.equal(result.status, 'draft'); assert.equal(result.url, 'https://example.com/a#section');
  await assert.rejects(fetchResource('https://example.com', { fetchImpl: async () => new Response(null, { status: 404 }) }), /404/);
  await assert.rejects(fetchResource('https://example.com', { fetchImpl: async () => new Response('{}', { headers: { 'content-type': 'application/json' } }) }), /HTML/);
});

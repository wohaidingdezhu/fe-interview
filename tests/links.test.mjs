import test from 'node:test';
import assert from 'node:assert/strict';
import { checkLink, checkLinks, publicURL } from '../scripts/link-utils.mjs';

test('HEAD 不支持时使用小流量 GET，记录重定向并取消响应正文', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push([url, options.method, options.headers.Range]);
    if (url.endsWith('/old')) return new Response('', { status: 301, headers: { location: '/new' } });
    return new Response('body', { status: options.method === 'HEAD' ? 405 : 206 });
  };
  const result = await checkLink('https://example.com/old#anchor', { fetchImpl });
  assert.equal(result.state, 'redirected'); assert.equal(result.finalURL, 'https://example.com/new');
  assert.deepEqual(calls.map(item => item[1]), ['HEAD', 'HEAD', 'GET']); assert.equal(calls[2][2], 'bytes=0-1023');
});
test('区别永久失效、访问限制、限流和临时错误，不追踪危险重定向', async () => {
  for (const [status, state] of [[404, 'dead'], [410, 'dead'], [403, 'restricted'], [429, 'temporary'], [503, 'temporary']]) {
    assert.equal((await checkLink('https://example.com', { fetchImpl: async () => new Response(null, { status }) })).state, state);
  }
  const redirected = await checkLink('https://example.com', { fetchImpl: async () => new Response(null, { status: 302, headers: { location: 'file:///secret' } }) });
  assert.equal(redirected.state, 'temporary'); assert.match(redirected.error, /HTTP/);
  assert.throws(() => publicURL('https://user:pass@example.com'));
});
test('重复锚点只检查一次，并发上限以及异常回收', async () => {
  let running = 0, peak = 0;
  const results = await checkLinks(['https://example.com/a', 'https://example.com/a#test', 'https://example.com/b', 'https://example.com/c'], { concurrency: 2, fetchImpl: async url => {
    running++; peak = Math.max(peak, running); await new Promise(resolve => setTimeout(resolve, 5)); running--;
    if (url.endsWith('/b')) throw new Error('网络不可达'); return new Response(null, { status: 200 });
  } });
  assert.equal(results.length, 3); assert.ok(peak <= 2); assert.equal(results[1].state, 'temporary');
});

export function publicURL(value) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('仅支持不带凭据的 HTTP(S) 地址');
  url.hash = ''; return url.href;
}
export async function checkLink(value, { fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  const original = publicURL(value), signal = AbortSignal.timeout(timeoutMs);
  let url = original, method = 'HEAD'; const redirects = [];
  try {
    for (let attempts = 0; attempts < 8; attempts++) {
      const response = await fetchImpl(url, { method, redirect: 'manual', signal, headers: { 'User-Agent': 'fe-interview-link-check/1.0', ...(method === 'GET' ? { Range: 'bytes=0-1023' } : {}) } });
      // GET fallback 只读响应头，不下载完整页面。
      await response.body?.cancel();
      const status = response.status, location = response.headers.get('location');
      if ([301, 302, 303, 307, 308].includes(status) && location) {
        if (redirects.length >= 5) throw new Error('重定向过多');
        url = publicURL(new URL(location, url).href); redirects.push(url); continue;
      }
      if (method === 'HEAD' && [405, 501].includes(status)) { method = 'GET'; continue; }
      const state = status >= 200 && status < 300 ? (redirects.length ? 'redirected' : 'ok')
        : [404, 410].includes(status) ? 'dead'
        : [401, 403].includes(status) ? 'restricted'
        : status === 429 || status >= 500 ? 'temporary' : 'review';
      return { url: original, finalURL: url, status, state, redirects };
    }
    throw new Error('请求次数过多');
  } catch (error) { return { url: original, finalURL: url, state: 'temporary', redirects, error: error.message }; }
}
export async function checkLinks(urls, { concurrency = 4, ...options } = {}) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error('并发数应为 1–8');
  const unique = [...new Set(urls.map(publicURL))], results = new Array(unique.length); let next = 0;
  async function worker() { while (next < unique.length) { const index = next++; results[index] = await checkLink(unique[index], options); } }
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker)); return results;
}

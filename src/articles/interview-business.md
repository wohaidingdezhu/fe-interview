---
id: "interview-business"
title: "前端业务场景题"
category: "业务场景"
description: "收录 Q397–Q403 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["业务场景","性能","并发控制"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 116
status: draft
quality: complete
sources: ["https://developer.mozilla.org/en-US/docs/Web/API/Worker","https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API"]
technologyVersion: "现代浏览器；Worker 与请求池教学示例"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://developer.mozilla.org/en-US/docs/Web/API/Worker) · [参考 2](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)。


## Q397｜页面上有多个按钮，分别响应不同的点击事件，如何优化？

适用：现代浏览器 Worker/AbortController；requestIdleCallback 带降级；OAuth 安全 RFC 9700。

大量动态按钮可在稳定父容器上使用事件委托，根据 closest 找到按钮并映射到允许的动作。必须检查目标仍属于容器，处理禁用状态，并用原生 button 保留键盘语义。

```js
const container = document.querySelector("#actions");
const actions = new Map([["save", () => console.log("save")], ["preview", () => console.log("preview")]]);
function onClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-action]");
  if (!button || !container.contains(button) || button.disabled) return;
  actions.get(button.dataset.action)?.();
}
container.addEventListener("click", onClick);
// 卸载时 container.removeEventListener("click", onClick)
```

示例假定容器存在。React 等已在根级处理部分事件委托，少量按钮独立回调通常足够，不要为减少监听数量牺牲清晰性。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)。

---

## Q398｜登录无感刷新实现方案

适用：现代浏览器 Worker/AbortController；requestIdleCallback 带降级；OAuth 安全 RFC 9700。

常见方案是短期 access token 加受保护的 refresh token，访问凭据失效时通过刷新端点换新凭据，再最多重放一次原请求。多个请求同时失败时共享同一个刷新 Promise，避免刷新风暴与旋转 token 冲突。

```text
业务请求 -> 明确的 access-token 过期错误
         -> 若刷新中则等待同一 Promise，否则发起刷新
         -> 刷新成功且仍属于当前登录会话 -> 重放一次
         -> 刷新失败/会话变化 -> 清理状态并要求重新登录
```

不是所有 401 都该刷新，403 更不应循环刷新。退出登录需使在途刷新失效；多标签页要协调旋转。refresh token 可用 Secure/HttpOnly/SameSite Cookie 并配合 CSRF 防护。可重放请求需能重新生成 body，写操作要有服务端幂等与明确未执行约定。

![](./images/interview/大前端面试宝典-diagram-8.png)

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9700#section-4.14) · [资料 2](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)。

---

## Q399｜频繁切换页码，导致页码和数据不对应，解决方案。

适用：现代浏览器 Worker/AbortController；requestIdleCallback 带降级；OAuth 安全 RFC 9700。

核心是只允许当前选择对应的请求提交结果，取消旧请求用于节约资源，客户端序号用于保证正确性。序号不需要服务端配合；即使请求不能及时取消，旧结果仍不会覆盖新页。

```js
function createLatestLoader(load, commit) {
  let sequence = 0, controller;
  return {
    async run(input) {
      const current = ++sequence;
      controller?.abort();
      const ownController = new AbortController();
      controller = ownController;
      try {
        const value = await load(input, ownController.signal);
        if (current !== sequence) return { status: 'stale' };
        commit(value);
        return { status: 'committed', value };
      } catch (error) {
        if (current !== sequence) return { status: 'stale' };
        throw error;
      }
    },
    cancel() { ++sequence; controller?.abort(); },
  };
}
```

```js
const loader = createLatestLoader(async (page, signal) => {
  const response = await fetch(`/api/items?page=${page}`, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { page, items: await response.json() };
}, value => { console.log("仅提交最新页", value); });
// 选择页码时 loader.run(page).catch(showError)，卸载时 loader.cancel()。
```

loading/error 也要按同一序号更新，不能只保护列表值；并发的最新请求失败应明确展示错误，而不是回退旧请求的数据。

![](./images/interview/大前端面试宝典-diagram-9.png)

![](./images/interview/大前端面试宝典-image-75.png)

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) · [资料 2](https://react.dev/reference/react/useEffect#fetching-data-with-effects)。

---

## Q400｜webWorker 优化 100000000 数组遍历

适用：现代浏览器 Worker/AbortController；requestIdleCallback 带降级；OAuth 安全 RFC 9700。

先判断是否可以用公式/索引避免一亿次遍历；确需逐项 CPU 运算时可放 Worker，保持主线程响应。不要先创建一亿个对象再复制过去，可在 Worker 按范围生成，或转移 TypedArray 缓冲区。

```js
// sum.worker.js
self.onmessage = ({ data: count }) => {
  if (!Number.isSafeInteger(count) || count < 0 || count > 100_000_000) {
    self.postMessage({ error: "invalid count" }); return;
  }
  let sum = 0;
  for (let i = 0; i < count; i++) sum += i;
  self.postMessage({ sum });
};
```

```js
// 主线程模块
const worker = new Worker(new URL("./sum.worker.js", import.meta.url), { type: "module" });
worker.onmessage = ({ data }) => { console.log(data); worker.terminate(); };
worker.onerror = event => { console.error(event.message); worker.terminate(); };
worker.postMessage(100_000_000);
// 用户取消或卸载时也调用 worker.terminate()
```

这是调度教学例，整数求和可直接用公式；计数上限确保此例结果在安全整数范围。Worker 不自动降低复杂度；转移 buffer 后原线程不可继续使用它，频繁传巨型结果也会增加成本。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)。

---

## Q401｜requestIdleCallback 优化 100000000 数组遍历

适用：现代浏览器 Worker/AbortController；requestIdleCallback 带降级；OAuth 安全 RFC 9700。

requestIdleCallback 在浏览器安排的空闲期调用，不保证每帧或固定时间执行。每次只处理预算内的一小段，设置 timeout 防止长期饥饿，超时触发也不能一口气做完；不支持时可用短定时器预算降级。

```js
function forEachIdle(count, visit, { signal, batchSize = 1000 } = {}) {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('invalid count');
  if (!Number.isSafeInteger(batchSize) || batchSize < 1) throw new RangeError('invalid batch size');
  if (typeof visit !== 'function') throw new TypeError('visit must be synchronous function');
  const nativeIdle = typeof globalThis.requestIdleCallback === 'function';
  const schedule = nativeIdle
    ? callback => globalThis.requestIdleCallback(callback, { timeout: 100 })
    : callback => setTimeout(() => {
      const end = performance.now() + 4;
      callback({ didTimeout: true, timeRemaining: () => Math.max(0, end - performance.now()) });
    }, 0);
  const unschedule = nativeIdle ? id => globalThis.cancelIdleCallback(id) : clearTimeout;
  return new Promise((resolve, reject) => {
    let index = 0, handle, settled = false;
    function finish(error) {
      if (settled) return;
      settled = true;
      if (handle !== undefined) unschedule(handle);
      signal?.removeEventListener('abort', abort);
      if (error !== undefined) reject(error); else resolve();
    }
    function abort() { finish(signal.reason ?? new DOMException('Aborted', 'AbortError')); }
    function step(deadline) {
      handle = undefined;
      let processed = 0;
      try {
        while (!settled && index < count && processed < batchSize &&
          (deadline.timeRemaining() > 0 || (deadline.didTimeout && processed === 0))) {
          visit(index++);
          processed++;
        }
        if (!settled) {
          if (index === count) finish(); else handle = schedule(step);
        }
      } catch (error) { finish(error ?? new Error('visit failed')); }
    }
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener('abort', abort, { once: true });
    try { if (count === 0) finish(); else handle = schedule(step); }
    catch (error) { finish(error ?? new Error('schedule failed')); }
  });
}
```

```js
const controller = new AbortController();
let sum = 0;
forEachIdle(100_000, i => { sum += i; }, { signal: controller.signal })
  .then(() => console.log(sum)).catch(console.error);
// controller.abort();
```

visit 必须同步且足够短，单次昂贵计算无法被此调度器抢占。切片只改善响应性，不会降低 O(n) 工作量；一亿项通常仍优先 Worker/算法优化。DOM 更新更适合安排在 requestAnimationFrame。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)。

---

## Q402｜虚拟列表，如果子元素高度不固定，处理方案

适用：现代浏览器 Worker/AbortController；requestIdleCallback 带降级；OAuth 安全 RFC 9700。

动态高度虚拟列表先用估计高度建立累计偏移，再渲染视口及 overscan，用 ResizeObserver 测量实际高度并更新缓存。根据 scrollTop 二分累计偏移找到起点，而不是用固定高度相除。

高度更新后要保持当前可见项的滚动锚点，避免上方内容增高导致跳动；缓存用稳定 key，字体、容器宽度或内容变化时失效。大规模频繁更新可用树状数组维护前缀和。还需处理焦点、键盘导航、图片尺寸与反复测量循环，不能假定渲染前已知所有高度。

参考：[资料 1](https://tanstack.com/virtual/latest/docs/api/virtualizer) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)。

---

## Q403｜处理并发请求控制，同时最高并发 n 个请求，响应后逐个补充。

适用：现代浏览器 Worker/AbortController；requestIdleCallback 带降级；OAuth 安全 RFC 9700。

并发池在任一任务结束后立即补位，结果按输入顺序保存。下例沿用 Q125 的 all-settled 契约：每个结果记录 fulfilled/rejected，单项失败不会阻断后续任务；任务必须是函数，以免入池前已经启动。

```js
async function limitRequests(tasks, concurrency) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError('并发数必须是正整数');
  const results = new Array(tasks.length); let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      try { results[index] = { status: 'fulfilled', value: await tasks[index]() }; }
      catch (reason) { results[index] = { status: 'rejected', reason }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}
```

```js
const results = await limitRequests(urls.map(url => async () => {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}), 4);
```

示例假定 urls 已定义，AbortSignal.timeout 按目标环境评估。该池只控制任务调度，没有自动取消全部或重试，生产需规定这些策略。浏览器连接数限制不等于业务并发限制，服务端仍独立做限流与幂等。

![](./images/interview/大前端面试宝典-image-77.png)

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)。

---

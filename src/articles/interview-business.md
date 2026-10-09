---
id: "interview-business"
title: "前端业务场景题"
category: "业务场景"
description: "收录 Q397–Q403 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["业务场景","性能","并发控制"]
addedAt: "2026-10-08"
order: 116
status: draft
quality: incomplete
sources: ["https://developer.mozilla.org/en-US/docs/Web/API/Worker","https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API"]
technologyVersion: "现代浏览器；Worker 与请求池教学示例"
---

> 审核说明：本专题仍为草稿。本次补充参考资料与部分题解，未逐条审核全部原导入答案；字数校验通过不代表技术准确。

补充参考资料：[参考 1](https://developer.mozilla.org/en-US/docs/Web/API/Worker) · [参考 2](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)。


## Q397｜页面上有多个按钮，分别响应不同的点击事件，如何优化？

**优化方案：**采取事件代理的方式进行优化，把事件绑定到父或根元素中，把多个监听器合并为一个，减少性能损耗。

---

## Q398｜登录无感刷新实现方案

利用 “双token机制”，首次登录成功服务器返回 accessToekn(短期有效) + refreshToekn(长期有效)，日常业务请求，利用 accessToken，一旦 accessToken 失效，则利用 refreshToekn 请求服务器，换取新的 accessToken。

![](./images/interview/大前端面试宝典-diagram-8.png)

---

## Q399｜频繁切换页码，导致页码和数据不对应，解决方案。

**本质原因：**用户频繁切换页面发出了多个请求，但由于网络速度波动，请求顺序和响应顺序不能保证一致。

![](./images/interview/大前端面试宝典-diagram-9.png)

**案例代码：**

- client
- server
- 效果（问题呈现）

![](./images/interview/大前端面试宝典-image-75.png)

**解决方案：**

1. 添加 loading（影响体验）
2. 取消请求（fetch / xhr / axios）
3. 添加 request_id（需要服务端配合）

- client
- server

---

## Q400｜webWorker 优化 100000000 数组遍历

不要在主线程先创建一亿个 JS 数字再复制给 Worker，这会产生巨大的分配、复制和内存峰值。可以在 Worker 内按范围直接计算，或通过 transfer 转移 TypedArray 的 ArrayBuffer。转移后发送端缓冲区不可继续使用；只返回汇总结果，避免再次传回全部数据。Worker 负责 CPU 任务，并不会自动减少算法复杂度。

```js
// sum.worker.js：仅计算范围内整数之和，不分配巨型数组
self.onmessage = ({ data: count }) => {
  let sum = 0; for (let i = 0; i < count; i++) sum += i;
  self.postMessage(sum);
};
// 主线程，模块 Worker 的 URL 按实际工程配置
const worker = new Worker(new URL('./sum.worker.js', import.meta.url), { type: 'module' });
worker.onmessage = ({ data }) => { console.log(data); worker.terminate(); };
worker.onerror = () => worker.terminate();
worker.postMessage(100_000_000);
```

---

## Q401｜requestIdleCallback 优化 100000000 数组遍历

requestIdleCallback 会在浏览器每帧剩余的空闲时间内执行

---

## Q402｜虚拟列表，如果子元素高度不固定，处理方案

1. **动态计算子元素高度：** 首先，你需要在渲染子元素之前动态计算每个子元素的高度。
2. **存储高度信息：** 一旦你计算了每个子元素的高度，你可以将这些高度信息存储在一个数组中，其中索引对应于子元素在虚拟列表中的位置。
3. **根据高度信息渲染子元素：** 在虚拟列表中，使用已存储的子元素高度信息来计算视口中应该渲染哪些子元素。根据已知的子元素高度和视口的高度来动态计算可见子元素的数量。通过维护一个滚动位置，可以确定哪些子元素应该在视口中渲染，然后只渲染这些子元素。

---

## Q403｜处理并发请求控制，同时最高并发 n 个请求，响应后逐个补充。

并发数表示正在执行的任务数，不是一次发送一批然后统一等待。使用 Q125 的 worker 池，让每个任务在完成或失败后立即取下一项。客户端限流改善资源占用；服务端仍需独立的流量限制、幂等处理和资源配额，不能把客户端约束当作安全保证。

```js
// limitRequests 的完整实现见 Q125
const results = await limitRequests(urls.map(url => async () => {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}), 4);
```

原导入配图（仅辅助参考，以文字说明和示例为准）：

![](./images/interview/大前端面试宝典-image-77.png)

---

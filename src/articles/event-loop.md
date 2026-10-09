---
id: "event-loop"
title: "事件循环与执行顺序"
category: "JavaScript"
kind: "知识文章"
description: "通过一道输出题，区分同步代码、微任务和定时器。"
tags: ["JavaScript", "异步", "面试"]
addedAt: "2026-10-08"
order: 2
status: published
quality: complete
---

## 先预测输出

下面代码在浏览器的同一次脚本执行中运行。先写出你的答案，再看分析。

```javascript
console.log('A');

setTimeout(() => console.log('B'), 0);

Promise.resolve().then(() => console.log('C'));

console.log('D');
```

输出顺序是 **A → D → C → B**。

## 拆解执行过程

1. 同步执行脚本，输出 A。
2. 注册定时器。延时 0 不代表回调会立即执行。
3. 已兑现 Promise 的 `then` 回调进入微任务队列。
4. 继续同步执行，输出 D。
5. 本次脚本结束后，到达微任务检查点，执行微任务并输出 C。
6. 后续执行定时器对应的任务，输出 B。

## 微任务还会产生微任务

```javascript
queueMicrotask(() => {
  console.log(1);
  queueMicrotask(() => console.log(3));
});
queueMicrotask(() => console.log(2));
// 1、2、3
```

在一次微任务检查点中，会持续处理微任务，直到队列为空。递归添加微任务可能推迟其他任务以及页面渲染。

## 容易说错的地方

- `setTimeout(fn, 0)` 只是请求尽快调度，不保证零延迟。
- 不能简单地说“每执行一个任务，浏览器都一定渲染一次”；是否更新渲染还受渲染时机等条件影响。
- 此处讨论浏览器环境，不能把所有结论原样套到 Node.js 的不同队列上。

## 参考资料

- [MDN：在 JavaScript 中使用微任务](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_DOM_API/Microtask_guide)

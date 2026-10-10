---
id: "debounce"
title: "手写防抖函数"
category: "算法与手写"
kind: "手写题解"
description: "从搜索输入场景开始，写出支持参数、this 和取消的防抖函数。"
tags: ["JavaScript", "手写题", "面试"]
aliases: ["debounce", "搜索框防抖", "延迟执行"]
related: ["closure", "event-loop"]
addedAt: "2026-10-08"
reviewedAt: "2026-10-09"
order: 4
status: published
quality: complete
sources: ["https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout","https://developer.mozilla.org/en-US/docs/Web/API/Window/clearTimeout"]
technologyVersion: "现代 JavaScript；浏览器定时器 API"
---

## 题目要求

实现 `debounce(fn, delay)`：连续调用时，只有最后一次调用停止后等待 `delay` 毫秒，才执行 `fn`。保留最后一次调用的参数和 `this`，并支持取消。

这是一个**尾沿执行**版本，不包含立即执行和最大等待时间等扩展功能。

## 实现思路

用闭包保存定时器。每次调用先清除旧定时器，再重新计时。回调使用 `apply` 保留调用者传入的上下文和参数。

```javascript
function debounce(fn, delay) {
  let timer;

  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn.apply(this, args);
    }, delay);
  }

  debounced.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  return debounced;
}
```

外层返回普通函数，是为了接收调用时的 `this`。定时器使用箭头函数，读取本次 `debounced` 调用的 `this`。

## 使用示例

```javascript
const search = debounce((keyword) => {
  console.log('搜索：', keyword);
}, 300);

search('r');
search('re');
search('react');
// 停止调用 300ms 后，只输出“搜索：react”

// 不再需要时，可以取消待执行的回调
// search.cancel();
```

## 验证哪些边界

| 情况 | 预期 |
| --- | --- |
| 只调用一次 | 等待后执行一次 |
| 等待期间连续调用 | 只执行最后一次，使用最后一组参数 |
| 以对象方法方式调用 | 原函数获得该对象作为 this |
| 执行前调用 cancel | 原函数不执行 |
| 取消后重新调用 | 可以重新计时并执行 |

## 面试追问

- 防抖与节流分别适合什么场景？
- 为什么不能在每一次 React 渲染中随意创建新的防抖实例？
- 防抖减少请求次数之后，如何处理已发出请求的响应乱序？

注意：这个函数不会同步返回 `fn` 的计算结果；异步返回值需要另行设计契约。

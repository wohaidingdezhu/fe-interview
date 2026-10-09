---
id: "closure"
title: "理解作用域与闭包"
category: "JavaScript"
kind: "知识文章"
description: "从函数的词法环境出发，理解闭包保存的究竟是什么。"
tags: ["JavaScript", "闭包", "面试"]
aliases: ["词法作用域", "closure", "函数闭包"]
related: ["debounce", "event-loop", "react-state"]
addedAt: "2026-10-08"
reviewedAt: "2026-10-09"
order: 1
status: published
quality: complete
sources: ["https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Closures"]
technologyVersion: "现代 JavaScript（ES2015+）"
---

## 面试中怎么回答

闭包是函数与其周围词法环境的组合。函数可以访问它定义时所在作用域的变量，即使外层函数已经执行完毕。

理解的重点是：**闭包保留对变量绑定的访问能力，并不是把变量的值复制一份。**

## 从一个计数器开始

```javascript
function createCounter() {
  let count = 0;
  return () => ++count;
}

const next = createCounter();
console.log(next()); // 1
console.log(next()); // 2
```

`createCounter` 执行结束后，返回的函数仍可访问 `count`。调用同一个 `next`，操作的是同一个变量绑定。

再次调用 `createCounter()` 会创建新的词法环境，因此两个计数器之间互不影响。

## 保存的是变量，不是快照

```javascript
function createReader() {
  let value = 1;
  const read = () => value;
  value = 2;
  return read;
}

console.log(createReader()()); // 2
```

如果误以为闭包在创建时复制了 `value`，就会预测输出为 1。实际上，`read` 访问的是后来被修改为 2 的同一个绑定。

## 常见用途与边界

- **隐藏状态**：把变量保存在函数内部，只暴露必要的操作。
- **延迟执行**：事件回调和定时器回调可以读取外层变量。
- **函数工厂**：为不同实例保存各自的配置。

闭包本身不等于内存泄漏。但如果一个长期可达的回调保留了不再需要的大对象，这些对象可能无法被回收。需要结合引用关系、监听器生命周期和实际内存表现判断。

## 可以继续追问

1. 为什么循环中的 `var` 和 `let` 会让定时器输出不同？
2. 一个事件监听器不再使用时，应该如何解除引用？
3. [防抖函数](?article=debounce)如何利用闭包保存定时器？

## 参考资料

- [MDN：闭包](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Closures)

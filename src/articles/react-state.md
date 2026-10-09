---
id: "react-state"
title: "React 状态为什么像快照"
category: "React"
kind: "知识文章"
description: "理解渲染、状态更新与函数式更新之间的关系。"
tags: ["React", "状态", "面试"]
aliases: ["React state 快照", "函数式更新", "旧状态"]
related: ["closure", "use-persist-fn"]
addedAt: "2026-10-08"
reviewedAt: "2026-10-09"
order: 3
status: published
quality: complete
sources: ["https://zh-hans.react.dev/learn/state-as-a-snapshot","https://zh-hans.react.dev/learn/queueing-a-series-of-state-updates"]
technologyVersion: "React 18/19 函数组件"
---

## 状态是一次渲染的快照

React 调用组件函数时，会给这次渲染提供对应的状态值。事件处理器捕获这次渲染里的变量。调用状态更新函数，会请求后续渲染，而不会立刻修改当前处理器内的变量。

## 连续更新为什么只增加一次

```jsx
const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
}
```

如果当前渲染的 `count` 是 0，那么三次传入的值都是 1。它们不是依次执行 `count++`，最终得到的状态是 1。

## 使用函数式更新

当下一次状态依赖前一次状态时，传入更新函数：

```jsx
function handleClick() {
  setCount(previous => previous + 1);
  setCount(previous => previous + 1);
  setCount(previous => previous + 1);
}
```

React 按顺序处理更新队列，将前一个更新的结果传给下一个更新函数，最终增加 3。

更新函数应该是纯函数，不要在里面发送请求或修改组件外部变量。开发环境的严格模式可能额外调用更新函数，帮助发现不纯的逻辑。

## 延迟回调中的旧值

```jsx
function handleAlert() {
  setTimeout(() => alert(count), 3000);
}
```

这个回调读取的是创建它的那次渲染中的 `count`。如果业务需要回调执行时的最新值，可以结合需求重新组织逻辑，或使用 ref 保存最新值；不能把 ref 的变化当作触发渲染的状态更新。

这与 [闭包](?article=closure) 并不矛盾：每次渲染调用都会产生新的局部变量绑定。

## 参考资料

- [React：State 如同一张快照](https://zh-hans.react.dev/learn/state-as-a-snapshot)
- [React：把一系列 state 更新加入队列](https://zh-hans.react.dev/learn/queueing-a-series-of-state-updates)

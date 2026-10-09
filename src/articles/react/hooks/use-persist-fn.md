---
id: "use-persist-fn"
title: "usePersistFn：稳定回调与最新状态"
category: "React"
description: "区分函数引用稳定与闭包更新，说明提交阶段更新回调的实现和使用边界。"
kind: "知识文章"
tags: ["React", "Hooks", "闭包"]
aliases: ["React 持久函数", "稳定回调", "最新闭包", "useMemoizedFn"]
related: ["react-state", "closure", "interview-react"]
addedAt: "2026-10-09"
updatedAt: "2026-10-09"
reviewedAt: "2026-10-09"
order: 1001
status: draft
quality: complete
sources: ["https://react.dev/reference/react/useRef", "https://react.dev/reference/react/useCallback", "https://react.dev/reference/react/useLayoutEffect"]
technologyVersion: "React 18/19；浏览器客户端函数组件"
---

## 解决什么问题

`usePersistFn` 是这里使用的自定义 Hook 名称，不是 React 内置 API。它让回调的引用在通常的组件生命周期内保持稳定，同时在调用时使用最近一次已提交的回调。适合事件订阅、依赖函数身份的第三方组件，以及确实需要稳定事件处理器的场景。

单独使用 `useCallback(callback, [])` 会固定第一次渲染中的闭包；给它列出依赖，又可能在依赖变化时产生新函数。这里把稳定包装函数与可更新的回调引用分开。

## 客户端教学实现

```ts
import { useCallback, useLayoutEffect, useRef } from 'react';

export function usePersistFn<Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
): (...args: Args) => Result {
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args: Args) => callbackRef.current(...args), []);
}
```

ref 保存回调，包装函数在事件发生时读取 ref。更新放在提交阶段，而不是每次渲染直接改写 ref，避免一次被放弃的渲染把尚未提交的回调暴露给旧界面。React 官方提醒，除可预测的初始化外，不应在渲染期间读取或写入 `ref.current`。[useRef 文档](https://react.dev/reference/react/useRef)

这份实现面向提交完成后的客户端事件调用。返回值、同步异常和 Promise 都由原回调决定；它不会自动绑定对象方法的 `this`。

## 使用示例

```tsx
const handleSubmit = usePersistFn(() => {
  console.log(formState);
});

return <Form onSubmit={handleSubmit} />;
```

表单回调在提交完成后调用时，会读取对应已提交渲染中的 `formState`。如果 `Form` 自身仍有变化的 props，稳定回调不意味着整个组件一定不重渲染。

## 验证方法

1. 保存第一次渲染返回的函数，更新状态并等到提交完成；检查函数引用仍相同。
2. 调用该函数，确认回调读取更新后的状态，参数和返回值保持原样。
3. 验证原回调抛错或返回 Promise 时，包装函数不吞掉错误、不改变返回契约。
4. 对采用 Suspense 或并发更新的应用，额外验证未提交的渲染不会改变当前界面的事件行为。

## 使用边界

- 不要在渲染过程中调用返回的函数；它的契约是客户端事件调用，不是渲染计算。
- 不用它绕过 Effect 依赖检查。业务需要因依赖变化而重新订阅时，应明确表达依赖。
- 不把父子组件的 layout effect 执行顺序当作“任何提交中调用都读到最新值”的保证。
- `useLayoutEffect` 不在服务端执行；SSR 场景应按框架的客户端边界设计，不能把此示例直接当成通用服务端 Hook。
- `useCallback` 缓存存在初次挂起、开发热更新等边界，外部系统仍应正确处理订阅和清理。

## 参考资料

- [React：useRef](https://react.dev/reference/react/useRef)
- [React：useCallback](https://react.dev/reference/react/useCallback)
- [React：useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)

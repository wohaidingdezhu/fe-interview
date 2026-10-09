---
id: "interview-react"
title: "React 生态面试题"
category: "React 生态"
description: "整理 React 生态中的核心概念、Hooks、状态管理与工程实践。"
kind: "知识文章"
tags: ["React","Hooks","面试"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 105
status: draft
quality: complete
sources: ["https://react.dev/reference/react/useState","https://react.dev/reference/react/useEffect","https://react.dev/learn/reusing-logic-with-custom-hooks"]
technologyVersion: "React 18/19；客户端 Hook 语义"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://react.dev/reference/react/useState) · [参考 2](https://react.dev/reference/react/useEffect) · [参考 3](https://react.dev/learn/reusing-logic-with-custom-hooks)。


## Q204｜React 中为什么要设计 Hook ，为了解决什么问题

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

Hooks 让函数组件使用状态、Context、引用和副作用，并把相关业务逻辑抽成自定义 Hook。它解决了类组件中相关逻辑分散于多个生命周期、HOC/render props 容易形成嵌套、this 与实例行为较难组合等问题。

Hooks 复用的是逻辑，不是自动共享状态；每次调用拥有独立状态。一般 Hook 必须在组件或自定义 Hook 顶层调用，保持调用顺序稳定。类组件仍受支持，不必为了使用新语法重写所有存量代码。

参考：[资料 1](https://react.dev/learn/reusing-logic-with-custom-hooks) · [资料 2](https://react.dev/reference/rules/rules-of-hooks)。

---

## Q205｜组件的生命周期方法。

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

类组件挂载主要经过 constructor、render、componentDidMount；更新经过 render 并在提交后调用 componentDidUpdate，可用 shouldComponentUpdate 提供优化提示；卸载前调用 componentWillUnmount 清理资源。getDerivedStateFromProps、getSnapshotBeforeUpdate 和错误边界方法用于特定需求，不应机械地全部实现。

render 阶段必须纯净，可能执行后被放弃。请求、订阅等放在提交后阶段，并保证清理对称。函数组件用状态与 Effect 表达相同需求，但 useEffect 是与外部系统同步，不是每个生命周期方法的一对一替代。开发 StrictMode 可能额外执行挂载清理检查。

参考：[资料 1](https://react.dev/reference/react/Component)。

---

## Q206｜状态（state）和属性（props）

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

props 是组件收到的只读输入，state 是组件拥有的渲染状态。它们在一次渲染中都是快照，不能原地修改；通过 setter 或类组件 setState 请求下一次更新。

状态可以提升到共同父组件并通过 props 共享，并不是“只能在本组件访问”。Hook setter 替换整个状态值；类 setState 对对象执行浅合并。下一状态依赖旧状态时使用函数式更新；对象和数组更新通常创建新引用，避免破坏历史快照和变更检测。

参考：[资料 1](https://react.dev/learn/passing-props-to-a-component) · [资料 2](https://react.dev/learn/state-as-a-snapshot)。

---

## Q207｜高阶组件（Higher-Order Components）

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

高阶组件 HOC 是接收组件、返回增强组件的函数，用于权限、订阅或兼容已有库的包装。应组合原组件并透传无关 props，不能修改传入组件；也不要在父组件每次 render 时创建新的 HOC 类型，否则可能不断卸载和重挂。

包装会影响 displayName、静态属性和 ref 转发，需要显式处理。现代函数组件中的逻辑复用常用自定义 Hook；HOC 仍适合组件接口包装。两者应按调用方需要选择，不必将所有 HOC 改为 Hook。

参考：[资料 1](https://legacy.reactjs.org/docs/higher-order-components.html)。

---

## Q208｜受控组件 和 非受控组件

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

以表单为例，受控输入的 value/checked 由 React 状态决定，onChange 同步更新对应状态；非受控输入用 defaultValue/defaultChecked 提供初值，后续当前值保存在 DOM，提交时可通过 FormData 或 ref 读取。

```jsx
import { useState } from "react";
function NameInput() {
  const [name, setName] = useState("");
  return <input value={name} onChange={event => setName(event.target.value)} />;
}
```

同一个输入在生命周期内不要从 undefined 切到受控字符串；checkbox 使用 checked。文件输入的文件由用户选择，不能按普通文本 value 控制。

参考：[资料 1](https://react.dev/reference/react-dom/components/input)。

---

## Q209｜展示组件 (Presentational component) 和 容器组件 (Container component) 区别

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

展示组件偏重 UI 与交互接口，容器组件偏重获取数据、协调状态和处理业务。二者是职责划分约定，不是 React 的组件类型；展示组件也可以有展开状态，容器也可以渲染布局。

可以用 props 把数据与事件传给展示组件，或把获取逻辑抽成自定义 Hook。只有当复用、测试和理解成本确实下降时再拆层，避免每个简单组件都增加一个空容器。

参考：[资料 1](https://react.dev/learn/thinking-in-react)。

---

## Q210｜类组件(Class component) 和 函数式组件(Functional component)  区别

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

类组件继承 Component，通过 this.props、this.state、setState 和生命周期方法组织逻辑；函数组件直接接收 props，通过 Hooks 使用状态、副作用和引用。自 React 16.8 起，函数组件即可管理复杂状态，不能再把它定义成无状态展示函数。

函数每次渲染重新执行，闭包捕获该次状态快照；类方法通常通过 this 访问当前实例。新代码一般优先函数组件，现有类组件仍可维护；错误边界等能力还需使用对应类 API 或成熟封装。

参考：[资料 1](https://react.dev/reference/react/Component) · [资料 2](https://react.dev/reference/react)。

---

## Q211｜如何划分 技术组件 和 业务组件

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

技术组件提供通用能力，如 Button、Dialog、分页或上传基础交互；业务组件表达领域规则，如订单审批、购物车结算与权限化操作。划分依据是是否依赖具体业务概念，而不是能否包含样式、请求或状态。

通用层通过 props/事件暴露稳定接口，业务层负责字段映射、权限和服务调用。遵循单一职责与可组合性，但不为猜测中的复用过度抽象；通过依赖方向确保基础组件不反向引用业务模块。

参考：[资料 1](https://react.dev/learn/thinking-in-react)。

---

## Q212｜什么是 React 中的上下文（Context）？它有什么作用？

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

Context 用于让后代读取最近 Provider 提供的数据，避免逐层透传。createContext 的默认值只在找不到 Provider 时生效；Provider 传 undefined 不会自动退回默认值。

```jsx
import { createContext, useContext } from "react";
const ThemeContext = createContext("light");
function Label() { return <span>{useContext(ThemeContext)}</span>; }
function App() {
  return <ThemeContext.Provider value="dark"><Label /></ThemeContext.Provider>;
}
```

value 按 Object.is 比较，变化会更新读取该 Context 的组件，memo 不阻止这种更新。避免每次无意义创建新对象，可拆分不同更新频率的 Context。React 19 还支持直接用 Context 作 Provider；Context 自身不提供状态存储与更新策略。

参考：[资料 1](https://react.dev/reference/react/useContext) · [资料 2](https://react.dev/reference/react/createContext)。

---

## Q213｜React 是 mvvm 框架吗 ？

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

React 是构建 UI 的库，核心是组件、声明式渲染与单向数据流。它没有强制 Model/ViewModel/View 三层结构，不能仅因有状态和视图就认定是完整 MVVM 框架。

可以在业务中用领域服务作为 Model，自定义 Hook 作为 ViewModel，组件作为 View；也可采用其他架构。MVVM 的关键是职责与视图状态映射，是否具备语法级双向绑定不是唯一判据。

参考：[资料 1](https://react.dev/learn/thinking-in-react)。

---

## Q214｜React 如何实现 mvvm？

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

在 React 中可以用自定义 Hook 封装视图状态和操作，用服务层处理数据访问，组件只负责展示和派发意图。受控表单通过 value 与 onChange 显式连接两个方向，不需要所谓“双向绑定库”。

```jsx
import { useState } from "react";
function useNameModel() {
  const [name, setName] = useState("");
  return { name, setName, valid: name.trim().length > 0 };
}
function NameForm() {
  const vm = useNameModel();
  return <input value={vm.name} onChange={e => vm.setName(e.target.value)} aria-invalid={!vm.valid} />;
}
```

这是架构示意，实际提交、异步错误与服务端校验另行处理。MobX 的响应式观察也不等于自动表单双向绑定。

参考：[资料 1](https://react.dev/learn/reusing-logic-with-custom-hooks) · [资料 2](https://react.dev/reference/react-dom/components/input)。

---

## Q215｜redux 主要解决什么问题 及 优缺点

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

Redux 通过 store、action、reducer 组织共享状态转换，使更新路径可追踪、可重放和可测试。reducer 应纯净，不原地修改旧状态；Redux Toolkit 的 createSlice 可借助 Immer 写出修改草稿的语法，但仍产生不可变更新。

现代官方推荐 Redux Toolkit 与 React Redux，RTK Query 可管理请求缓存，不能只拿早期大量样板代码描述现状。代价包括依赖、数据建模和团队学习；局部表单、可派生值及所有服务端数据不必一律放到全局 store。

参考：[资料 1](https://redux.js.org/introduction/why-rtk-is-redux-today)。

---

## Q216｜React 性能优化方案，所关联周期函数。

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

先用 React Profiler 与浏览器 Performance 定位瓶颈，区分组件计算、DOM 提交、布局和网络。优先缩小状态作用域、避免 Effect 循环更新、虚拟化长列表、按路由加载代码，再对昂贵且输入稳定的部分考虑 memo/useMemo/useCallback。

memo 默认逐项用 Object.is 比较 props，是跳过部分渲染的优化提示；自身 state 或 Context 更新仍可触发渲染。类组件对应 PureComponent/shouldComponentUpdate。不要把 useMemo 当正确性保证，缓存也有比较与内存成本。Compiler 是否可替代手工缓存取决于项目配置；应在生产条件下测量收益。

参考：[资料 1](https://react.dev/reference/react/memo) · [资料 2](https://react.dev/reference/react/Profiler)。

---

## Q217｜虚拟 DOM 的意义

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

虚拟 DOM 为 UI 提供声明式描述，使 React 能协调组件更新并提交必要的宿主变化，也便于实现不同渲染目标和调度。开发者描述状态下应出现的 UI，框架处理结构复用与更新。

它不是性能的充分条件：创建元素、执行组件、协调与内存都有成本，也不保证最少 DOM 操作。React 一次重新渲染不等于 DOM 一定变化；长任务、布局抖动、巨大 DOM 仍须单独优化。

参考：[资料 1](https://react.dev/learn/render-and-commit)。

---

## Q218｜react DOM Diff 算法

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

React 按树中位置、元素类型和 key 判断身份。同一位置同类型通常复用已有状态与宿主节点；类型变化会重建对应子树，列表用稳定 key 匹配兄弟。props 差异在提交时反映到 DOM。

协调采用可承受的启发式规则，不计算任意两棵树的全局最短编辑序列，也不是“子节点数量相同才比较”。改变 key 可主动重置状态；把组件定义放进另一个组件函数内部会产生新的类型，可能意外重置。Fiber 的具体移动标记算法要固定源码版本后解释。

参考：[资料 1](https://react.dev/learn/preserving-and-resetting-state) · [资料 2](https://react.dev/learn/rendering-lists)。

---

## Q219｜关于 Fiber 架构

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

Fiber 是 React 协调器用于表示工作单元与保存更新状态的数据结构。它让渲染工作能够按优先级组织，支持并发渲染时暂停、继续或丢弃尚未提交的结果；这不同于开多个 JavaScript 线程并行执行组件。

让出控制是协作式的，不能在任意一条同步语句中抢占；组件内部一个超长循环仍会阻塞主线程。render 阶段必须无副作用，因为工作可能重做；DOM 变更在 commit 阶段提交，不应把提交过程也描述为随意中断。具体 lanes、flags 等结构属于版本相关实现。

参考：[资料 1](https://react.dev/blog/2022/03/29/react-v18) · [资料 2](https://react.dev/learn/render-and-commit)。

---

## Q220｜关于 Flux

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

Flux 是单向数据流架构：View 产生 action，dispatcher 分发给 store，store 更新后通知 view。目的在于明确状态写入入口和依赖方向，减少复杂应用中的隐式双向同步。

它不是 React 必需依赖，也不自动消除业务循环。经典 Flux 可有多个 store；Redux 借鉴其思想但通常有一个 store，用纯 reducer 计算下一状态，并不逐字复刻 dispatcher/store 模型。讨论时先说明是历史架构思想还是具体库。

参考：[资料 1](https://facebookarchive.github.io/flux/docs/in-depth-overview/)。

---

## Q221｜React 项目脚手架

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

Create React App 已被官方弃用，不再作为新项目默认推荐。生产应用先评估 React 官方推荐的框架及路由/数据加载能力；需要自行组合的客户端应用或学习项目，可用 Vite 等构建工具。

```bash
npm create vite@latest my-app -- --template react-ts
```

脚手架解决初始化，不自动提供鉴权、部署与可观测性。选择时考虑 SSR/静态生成需求、托管平台、路由、Node 版本及团队维护能力。Next.js 也不只是“轻量 SSR 脚手架”，其完整框架能力和运行模式应按对应版本评估。

参考：[资料 1](https://react.dev/blog/2025/02/14/sunsetting-create-react-app) · [资料 2](https://react.dev/learn/creating-a-react-app)。

---

## Q222｜React 组件可请求数据生命周期钩子

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

客户端类组件可在 componentDidMount 请求初始数据，在 componentDidUpdate 比较前后参数后请求新数据，并在卸载时清理。不能无条件在每次更新后 setState 发请求，否则可能循环；组件也不能修改收到的 props。

函数组件可在 Effect 中同步请求，但需处理取消、竞态、加载和失败。更完整的应用优先考虑框架数据加载器或请求缓存库，避免瀑布请求、重复获取与 SSR 缺数据。render 和 useMemo 都不应承担请求副作用。

参考：[资料 1](https://react.dev/reference/react/Component#componentdidmount) · [资料 2](https://react.dev/reference/react/useEffect#fetching-data-with-effects)。

---

## Q223｜refs 的作用

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

ref 保存跨渲染的可变引用，修改 current 不触发重新渲染。它适合 DOM 聚焦、测量、计时器 ID 与外部实例；显示在页面上的数据仍应使用 state。避免在普通 render 中读写 ref 来决定界面。

DOM ref 在提交时赋值，卸载时清空；函数组件没有类实例，可通过 useImperativeHandle 暴露有限命令。React 18 常用 forwardRef 接收 ref；React 19 函数组件可将 ref 作为 prop。不要用 ref 绕开单向数据流随意修改子组件内部状态。

参考：[资料 1](https://react.dev/reference/react/useRef) · [资料 2](https://react.dev/reference/react/useImperativeHandle)。

---

## Q224｜key 在渲染列表时的作用

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

key 标识同一父节点下列表项的身份，与类型/位置共同影响状态保留。排序、插入和删除时，稳定业务 ID 能帮助 React 把状态跟随到正确项。key 只需在当前兄弟中唯一，不会作为普通 prop 传入组件。

不要在每次 render 生成随机 key；会造成重挂、焦点丢失和状态重置。会变动的列表不宜用数组索引，否则输入值等局部状态可能对应错误记录。key 不保证组件永不重渲染，其首要意义是身份与正确性。

参考：[资料 1](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)。

---

## Q225｜如何使用 useState Hook 来管理状态

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

useState 返回当前渲染的状态与稳定 setter。调用 setter 安排下一次渲染，不会立即改写当前闭包中的变量；下一状态依赖旧状态时用 updater，连续更新会按队列计算。

```jsx
import { useState } from "react";
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => {
    setCount(n => n + 1);
    setCount(n => n + 1);
  }}>{count}</button>;
}
```

一次点击增加 2。对象/数组创建新引用；惰性 initializer 和 updater 必须纯净，开发 StrictMode 可能额外调用以检查纯度。

参考：[资料 1](https://react.dev/reference/react/useState) · [资料 2](https://react.dev/learn/queueing-a-series-of-state-updates)。

---

## Q226｜如何使用 useEffect Hook 执行副作用操作

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

useEffect 用于与外部系统同步。依赖变化时先清理旧效果再设置新效果，卸载时清理；依赖按 Object.is 比较，包含 Effect 用到的响应式值。Effect 只在客户端运行，不应把它笼统等同于“必定在绘制后运行”。

```js
useEffect(() => {
  const controller = new AbortController();
  let active = true;
  setError(null);
  setData(null);
  async function load() {
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (active) setData(data);
    } catch (error) {
      if (active) setError(error instanceof Error ? error.message : String(error));
    }
  }
  load();
  return () => { active = false; controller.abort(); };
}, [url]);
```

片段假定在组件内已声明 url、setData 与 setError。回调本身不能 async，否则返回 Promise 而非清理函数。开发 StrictMode 的额外设置/清理用于检查对称性。

参考：[资料 1](https://react.dev/reference/react/useEffect)。

---

## Q227｜如何使用自定义Hook来共享逻辑

适用：React 18/19 公共 API；CRA 弃用说明 2025-02-14；Redux Toolkit 2。

自定义 Hook 抽取有状态逻辑，名称以 use 开头，内部遵守 Hook 规则。多个组件调用同一个 Hook 得到独立状态；共享状态需要提升状态、Context 或外部 store。

```jsx
import { useState } from "react";
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  return { count, increment: () => setCount(n => n + 1) };
}
```

initial 只影响初次挂载，后续 prop 改变不会自动重置计数。抽象应表达业务目的与清理契约；不要为了复用而隐藏必要依赖或创建含糊的“生命周期 Hook”。

参考：[资料 1](https://react.dev/learn/reusing-logic-with-custom-hooks)。

---

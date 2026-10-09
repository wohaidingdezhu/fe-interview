---
id: "interview-vue"
title: "Vue 生态面试题"
category: "Vue 生态"
description: "收录 Q159–Q203 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["Vue","响应式","面试"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 104
status: draft
quality: complete
sources: ["https://vuejs.org/guide/essentials/event-handling.html","https://vuejs.org/guide/essentials/watchers.html","https://github.com/stackblitz/alien-signals/releases/tag/v2.0.0","https://github.com/vuejs/core"]
technologyVersion: "Vue 3.5+；Alien Signals 说明参考 v2.0.0，Vue 内部实现需固定提交"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://vuejs.org/guide/essentials/event-handling.html) · [参考 2](https://vuejs.org/guide/essentials/watchers.html) · [参考 3](https://github.com/stackblitz/alien-signals/releases/tag/v2.0.0) · [参考 4](https://github.com/vuejs/core)。


## Q159｜Vue2 不能监听数组下标原因

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Vue 2 对创建时已存在的对象属性安装 getter/setter，对数组主要改写 push、pop、shift、unshift、splice、sort、reverse 等变更方法。直接 arr[i] = value 或 arr.length = n 无法触发其数组通知路径。Object.defineProperty 本身可以定义数字索引访问器，但不能通用地截获未来新增索引和 length 的所有变化，不能把限制只归因于“性能不好”。

使用 Vue.set(arr, i, value) 或 arr.splice(i, 1, value)；截断数组可用 arr.splice(n)。Vue 3 的 Proxy 响应式数组支持索引赋值和 length 变化。

参考：[资料 1](https://v2.vuejs.org/v2/guide/reactivity.html#For-Arrays)。

---

## Q160｜vue2 和  vue3 的具体区别

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Vue 2.7 与 Vue 3 都支持 Options API，Vue 2.7 也回移了 Composition API 和 script setup，因此不能按“有无组合式 API”绝对区分。Vue 2 已结束官方常规维护，新项目通常采用 Vue 3。

主要迁移差异是：Vue 3 用 Proxy 处理响应式对象，支持属性增删和数组索引更新；应用入口改为 createApp；支持多根节点与 Teleport；移除了实例事件总线 API、过滤器等旧接口。Vue 3 编译器通过 patch flags、block tree 和静态缓存减少运行时遍历。Vue 2 也有静态树优化，不能说它每次重建所有静态节点。

体积和速度应在相同功能、生产构建下比较。Suspense 仍应按所用版本的实验性说明评估，不应与稳定特性一概而论。

参考：[资料 1](https://v3-migration.vuejs.org/) · [资料 2](https://v2.vuejs.org/v2/guide/migration-vue-2-7.html)。

---

## Q161｜vue 的通讯方式

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

父子组件优先 props 向下、emit 事件向上；组件 v-model 本质是值 prop 与更新事件的约定。跨层注入用 provide/inject，共享业务状态可用 Pinia，局部兄弟状态可提升至共同父组件。

ref/defineExpose 适合聚焦、重置等有限命令式接口；不应通过父子实例随意修改对方状态。Vue 3 的 $attrs 包含未声明的属性及监听器，Vue 2 的 $listeners 已移除；Vue 2 的 $on/$off/$once 实例事件总线也已移除。选择第三方事件总线时要在卸载时取消订阅。

参考：[资料 1](https://vuejs.org/guide/components/events.html) · [资料 2](https://vuejs.org/guide/components/provide-inject.html)。

---

## Q162｜vue 的常用修饰符

适用：Vue 3 模板修饰符。

事件修饰符包括 .stop、.prevent、.capture、.self、.once、.passive；按键修饰符可筛选 Enter 等，v-model 常见 .trim、.number、.lazy。修饰符顺序可能改变行为，.self.prevent 与 .prevent.self 不完全等价；不要同时使用 .passive 与 .prevent，因为被动监听器承诺不取消默认行为。

```html
<form @submit.prevent="save">…</form>
<input v-model.trim="name" @keyup.enter="save" />
```

参考：[资料 1](https://vuejs.org/guide/essentials/event-handling.html#event-modifiers) · [资料 2](https://vuejs.org/guide/essentials/forms.html#modifiers)。

---

## Q163｜vue2 初始化过程做了哪些事？

适用：Vue 2.7.16 / Vue 3.5.0 固定 tag 源码；教学示例明确边界。

固定 Vue 2.7.16 的 _init：建立实例标识与作用域，合并 options，初始化代理和自身引用；然后依次 initLifecycle、initEvents、initRender，调用 beforeCreate，再 initInjections、initState、initProvide，最后调用 created。若 options.el 存在则继续 $mount。

注入先于 state，provide 在 state 之后，使其可读取已初始化状态。created 并不意味着 DOM 已挂载，initRender 也不是已经将模板输出到页面。内部组件创建有简化 options 路径，具体细节按固定 tag 阅读，不把该顺序当 Vue 3 初始化流程。

参考：[资料 1](https://github.com/vuejs/vue/blob/v2.7.16/src/core/instance/init.ts)。

---

## Q164｜created 和 mounted 这两个生命周期的区别

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Options API 的 created 在 data、computed、methods、watch 等初始化之后执行，组件 DOM 尚未挂载；mounted 在组件 DOM 创建并挂入父容器、同步子组件完成挂载后调用，适合聚焦、测量和接入 DOM 插件。父容器自身也需要在文档中，才能保证组件在文档中。

异步请求可按需求在创建或挂载阶段启动，但应处理取消和过期结果。mounted 不保证异步子组件、图片与字体都已就绪；SSR 不执行 mounted。Vue 3 组合式 API 使用 setup 和 onMounted，不存在 onCreated。

参考：[资料 1](https://vuejs.org/api/options-lifecycle.html)。

---

## Q165｜Vue 的 \$nextTick 是如何实现的

适用：Vue 2.7.16 / Vue 3.5.0 固定 tag 源码；教学示例明确边界。

Vue 3.5.0 的 nextTick 使用 currentFlushPromise || resolvedPromise；当前已有调度时，等待该轮 flush 完成后再执行回调。因此应先修改状态再 await nextTick，才能读取对应更新后的 DOM。它不保证浏览器已经完成绘制，也不等待任意网络请求。

Vue 2.7.16 使用 callback 队列，优先原生 Promise，其次符合条件的 MutationObserver，再降级到 setImmediate/setTimeout。不能说两版都固定用同一算法，也不能把 nextTick 回调描述成“必定在本轮 DOM 更新前”。

```js
// Vue 3 组件 setup 内，count 是 ref
count.value++;
await nextTick();
// 此处读取本轮更新后的 DOM；不等于图像已经呈现到屏幕。
```

参考：[资料 1](https://github.com/vuejs/core/blob/v3.5.0/packages/runtime-core/src/scheduler.ts) · [资料 2](https://github.com/vuejs/vue/blob/v2.7.16/src/core/util/next-tick.ts)。

---

## Q166｜以下两段代码在 vue 中分别渲染多少次？为什么？

适用：Vue 2.7.16 / Vue 3.5.0 固定 tag 源码；教学示例明确边界。

原题缺少两段完整代码，补充下面可复现的 Vue 3.5 案例。分别在挂载后单独点击按钮，只有 n 参与模板且没有其他更新来源：同步五次赋值通常合并为一次组件更新；每次赋值后 await nextTick 则产生五轮更新。这里不计初始挂载，也不把更新轮数等同浏览器绘制次数。

```vue
<script setup>
import { ref, nextTick, onUpdated } from "vue";
const n = ref(0);
let updates = 0;
onUpdated(() => console.log("update", ++updates));
function together() { for (let i = 0; i < 5; i++) n.value++; }
async function separate() {
  for (let i = 0; i < 5; i++) { n.value++; await nextTick(); }
}
</script>
<template>
  <p>{{ n }}</p>
  <button @click="together">同步修改</button>
  <button @click="separate">逐轮修改</button>
</template>
```

渲染依赖必须实际读取状态，修改未使用的字段不必引起组件渲染。调度入口在 runtime-core scheduler，不能指向已过时的 deferredComputed 文件当通用答案。

参考：[资料 1](https://vuejs.org/api/general.html#nexttick) · [资料 2](https://github.com/vuejs/core/blob/v3.5.0/packages/runtime-core/src/scheduler.ts)。

---

## Q167｜为什么 vue 中的 data 是一个 function 而不是普通 object？

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

复用的组件需要每个实例拥有自己的初始状态，所以 Options API 的 data 写为返回新对象的函数：data() { return { count: 0 }; }。如果所有实例返回同一个外部对象，仍然会共享状态；函数写法本身不自动深拷贝。

Vue 2 根实例允许直接传 data 对象，是 API 的特例；Vue 3 的 data 选项统一要求函数。组合式 API 通常在 setup 内创建 ref/reactive；定义在模块顶层的状态会跨实例共享，SSR 中还应避免跨请求泄漏。

参考：[资料 1](https://vuejs.org/api/options-state.html#data)。

---

## Q168｜Vue 的父组件和子组件生命周期钩子函数执行顺序？

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

以 Vue 2 的同步父子组件、普通挂载为例：父 beforeCreate → 父 created → 父 beforeMount → 子 beforeCreate → 子 created → 子 beforeMount → 子 mounted → 父 mounted。父子都因同一轮变化更新时，通常父 beforeUpdate → 子 beforeUpdate → 子 updated → 父 updated。

只有子组件自己的状态变化时，父组件不一定更新；不能把“子更新”背成必定包含父钩子。销毁时父 beforeDestroy → 子 beforeDestroy → 子 destroyed → 父 destroyed。Vue 3 对应名称是 beforeUnmount/unmounted。异步组件、Suspense、KeepAlive 与条件渲染需要单独分析，业务通信不应依赖一套覆盖所有场景的固定顺序。

参考：[资料 1](https://v2.vuejs.org/v2/api/#Options-Lifecycle-Hooks) · [资料 2](https://vuejs.org/api/options-lifecycle.html)。

---

## Q169｜watch 和 computed 有什么区别？

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

computed 表达同步派生值，缓存最近计算结果，并跟踪 getter 运行时读到的响应式依赖；getter 应保持无副作用。watch 观察指定来源，变化后执行请求、持久化等副作用，不以返回值作为模板派生状态。

watch 默认懒执行，调度回调通常批量合并，不是每次赋值都同步调用。Vue 3 可用 immediate、deep 与 flush 控制首次执行、遍历和时机；读取更新后 DOM 通常选 flush: "post"。异步 watcher 要处理过期请求和清理，不能让旧结果覆盖新状态。

参考：[资料 1](https://vuejs.org/guide/essentials/computed.html) · [资料 2](https://vuejs.org/guide/essentials/watchers.html)。

---

## Q170｜谈谈 computed 的机制，缓存了什么？

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

computed 缓存 getter 的结果以及关联的响应式依赖；连续读取且依赖未变化时复用结果。依赖变化使结果需要重新检查/计算，实际求值通常按读取需求进行，不能说每次依赖赋值都会立即执行 getter。

只跟踪本次 getter 中真正读取的响应式数据，条件分支切换后依赖可改变。Date.now() 本身不是响应式依赖，computed(() => Date.now()) 不会随时间自动更新。Vue 3.4+ 还会利用计算值稳定性减少下游效果触发；具体脏标记和版本计数属于实现细节。

参考：[资料 1](https://vuejs.org/guide/essentials/computed.html) · [资料 2](https://vuejs.org/guide/best-practices/performance.html#computed-stability)。

---

## Q171｜为什么 computed 不支持异步？

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

computed 可以返回 Promise，但 Vue 不会把 Promise 最终 resolve 的值自动当成计算结果，也不会为其管理加载、错误与竞态。getter 还只能在同步求值期间建立正常的依赖跟踪，await 之后的读取不能按普通同步 computed 理解。

因此异步派生数据通常用 watch/watchEffect 发起请求，把结果、loading、error 保存到 ref，并通过清理或序号防止过期响应。computed 保留给同步纯计算。这是 API 使用约束，不能解释为“JavaScript 的 computed 函数不能写 async”。

参考：[资料 1](https://vuejs.org/guide/essentials/computed.html#best-practices) · [资料 2](https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup)。

---

## Q172｜Vue3 DOM Diff 算法

适用：Vue 2.7.16 / Vue 3.5.0 固定 tag 源码；教学示例明确边界。

固定 Vue 3.5.0 renderer.ts 的 keyed children 路径：先同步比较相同前缀，再比较后缀；一边耗尽时直接挂载或卸载剩余项。中间未知区建立新 key 到索引映射，遍历旧节点匹配、删除并记录新位置对应的旧位置。

若检测到顺序变化，对映射数组求最长递增子序列，再从后向前遍历：0 对应新节点需挂载，不在 LIS 中的可复用节点需要移动，其余保持相对顺序。旧位置存 i+1 以便用 0 表示新项。节点类型与 key 都参与判断，重复 key 不合法；该算法减少特定条件下的移动，不代表所有 DOM 编辑全局最优。

参考：[资料 1](https://github.com/vuejs/core/blob/v3.5.0/packages/runtime-core/src/renderer.ts)。

---

## Q173｜Vue3  的最长递增子序列算法

适用：Vue 2.7.16 / Vue 3.5.0 固定 tag 源码；教学示例明确边界。

Vue 3.5.0 getSequence 返回映射数组的最长严格递增子序列的索引，并跳过表示新节点的 0。用二分维护尾部候选，再记录前驱回溯，时间 O(n log n)、额外空间 O(n)。不能只拿 tails 数组当最终节点序列。

```js
function lisIndices(values) {
  const tails = [], previous = new Array(values.length).fill(-1);
  for (let i = 0; i < values.length; i++) {
    if (values[i] === 0) continue;
    let left = 0, right = tails.length;
    while (left < right) {
      const mid = (left + right) >> 1;
      if (values[tails[mid]] < values[i]) left = mid + 1; else right = mid;
    }
    if (left > 0) previous[i] = tails[left - 1];
    tails[left] = i;
  }
  const result = [];
  for (let i = tails.at(-1); i !== undefined && i !== -1; i = previous[i]) result.push(i);
  return result.reverse();
}
console.log(lisIndices([2, 1, 3, 0, 4])); // [1, 2, 4]
```

这是等价目的的教学实现，输入约定为非负整数旧位置映射，不是逐字复制 Vue 源码。

参考：[资料 1](https://github.com/vuejs/core/blob/v3.5.0/packages/runtime-core/src/renderer.ts#L2485)。

---

## Q174｜vue3 中 ref 和 reactive 的区别

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

ref(value) 用 .value 包装单个值，既支持原始值，也支持对象；普通 ref 内的对象会转换为深层响应式对象。reactive(object) 返回对象的响应式 Proxy，只支持对象类型，包括数组与集合。

脚本中读取 ref 用 .value；reactive 按属性访问。替换 ref.value 会保留订阅入口，直接把 reactive 变量重新赋为另一个对象会让旧订阅失去原代理联系。解构 reactive 的原始值属性通常失去关联，可用 toRef/toRefs。模板解包有位置与集合边界，并非任意嵌套 ref 都自动解包。

参考：[资料 1](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)。

---

## Q175｜vue3 区分 ref 和 reactive 的原因

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Proxy 的目标必须是对象，无法直接代理一个 number/string 变量；ref 通过一个稳定对象的 value 属性为任意值提供可追踪的读写入口，也方便整体替换对象。reactive 则以对象属性为操作界面，适合一组相关字段。

两者主要是表达与替换语义的选择，不应凭空推导 ref 必定更省内存或更快。ref 包装对象时仍会使用 reactive。Vue 官方通常推荐以 ref 作为声明响应式状态的主要 API，再根据对象结构选择 reactive。

参考：[资料 1](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)。

---

## Q176｜Vue 响应式 Observer、Dep、Watcher

适用：Vue 2.7.16 / Vue 3.5.0 固定 tag 源码；教学示例明确边界。

Observer、Dep、Watcher 主要对应 Vue 2 响应式术语。Vue 2.7.16 Observer 为对象已有属性安装访问器并处理数组；getter 通过当前 watcher 收集依赖，setter 通知 Dep，Watcher 根据类型执行计算或入队更新。

Watcher 重新运行还要清理未再次使用的依赖，computed 使用懒求值与缓存，组件渲染 watcher 参与调度批处理。Vue 3 的 reactive/ref/effect 系统采用不同结构，不能仅把类名套到 Proxy 上；响应式追踪本身也不等于表单双向绑定。

参考：[资料 1](https://github.com/vuejs/vue/blob/v2.7.16/src/core/observer/index.ts) · [资料 2](https://github.com/vuejs/vue/blob/v2.7.16/src/core/observer/dep.ts) · [资料 3](https://github.com/vuejs/vue/blob/v2.7.16/src/core/observer/watcher.ts)。

---

## Q177｜vue3 为什么要用 proxy 替换 Object.defineproperty ？

适用：Vue 3 Proxy 响应式。

Vue 3 在设计上选择使用 Proxy 替代 Object.defineProperty 主要是为了提供更好的响应性和性能。

Object.defineProperty 是在 ES5 中引入的属性定义方法，用于对对象的属性进行劫持和拦截。Vue 2.x 使用 Object.defineProperty 来实现对数据的劫持，从而实现响应式数据的更新和依赖追踪。

- Object.defineProperty 只能对已经存在的属性进行劫持，无法拦截新增的属性和删除的属性。这就意味着在 Vue 2.x 中，当你添加或删除属性时，需要使用特定的方法(Vue.set 和 Vue.delete)来通知 Vue 响应式系统进行更新。这种限制增加了开发的复杂性。
- Object.defineProperty 的劫持是基于属性级别的，也就是说每个属性都需要被劫持。这对于大规模的对象或数组来说，会导致性能下降。因为每个属性都需要添加劫持逻辑，这会增加内存消耗和初始化时间。
- 相比之下，Proxy 是 ES6 中引入的元编程特性，可以对整个对象进行拦截和代理。Proxy 提供了更强大和灵活的拦截能力，可以拦截对象的读取、赋值、删除等操作。Vue 3.x 利用 Proxy 的特性，可以更方便地实现响应式系统。
- 使用 Proxy 可以解决 Object.defineProperty 的限制问题。它可以直接拦截对象的读取和赋值操作，无需在每个属性上进行劫持。这样就消除了属性级别的劫持开销，提高了初始化性能。另外，Proxy 还可以拦截新增属性和删除属性的操作，使得响应式系统更加完备和自动化。

参考：[资料 1](https://vuejs.org/guide/extras/reactivity-in-depth.html) · [资料 2](https://v3-migration.vuejs.org/breaking-changes/)。

---

## Q178｜什么是虚拟 DOM

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

虚拟 DOM 用 JavaScript 节点描述期望 UI。状态变化后生成/复用 vnode，通过协调算法比较前后结构，再把变化提交到真实 DOM 或其他宿主。它支持声明式组件、批处理、跨平台渲染和与编译器协作。

比较和创建 vnode 自身也有开销；局部手写 DOM 更新可能更快。框架利用类型、key、静态标记等假设减少工作，不保证求得数学上的最少 DOM 操作，也不自动解决长列表、昂贵计算与布局抖动。优化应测量组件计算、提交和浏览器布局各阶段。

参考：[资料 1](https://vuejs.org/guide/extras/rendering-mechanism.html)。

---

## Q179｜vue2 的生命周期

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Vue 2 的 beforeCreate 在事件/生命周期初始化后、状态初始化前执行；created 时 data、computed、methods 和 watcher 已就绪。beforeMount 在首次渲染挂载之前调用；mounted 后可以访问自身已挂载的 DOM，但不保证所有异步后代完成。

beforeUpdate 发生在响应式数据已变、DOM 尚未补丁更新时；updated 发生在 DOM 补丁之后。不要在 updated 无条件修改它依赖的状态，否则可能循环更新。beforeDestroy 适合取消订阅、清理定时器；destroyed 后实例的 watcher 与 Vue 管理的连接已拆除，自建外部资源仍需自己清理。挂载/更新钩子不在 SSR 中执行。

![](./images/interview/大前端面试宝典-image-29.png)

参考：[资料 1](https://v2.vuejs.org/v2/api/#Options-Lifecycle-Hooks)。

---

## Q180｜vue3 生命周期

适用：Vue 3 当前生命周期 API。

![](./images/interview/大前端面试宝典-image-25.png)

Vue 3 同时支持 Options API 与 Composition API。setup 会在 beforeCreate/created 之前执行，因此组合式代码通常不需要这两个创建钩子。Options API 使用 beforeMount/mounted、beforeUpdate/updated、beforeUnmount/unmounted；Composition API 对应 onBeforeMount/onMounted、onBeforeUpdate/onUpdated、onBeforeUnmount/onUnmounted，它们是两套 API 的对应形式，不是同一组件必须重复注册两次。

onMounted 只表示组件自身同步子组件和 DOM 已挂载，不保证异步组件或所有资源加载完成。副作用应在 onUnmounted 清理；服务端渲染时 mounted 类钩子不会执行。父子组件钩子顺序不应替代数据流契约。

参考：[资料 1](https://vuejs.org/api/options-lifecycle.html) · [资料 2](https://vuejs.org/api/composition-api-lifecycle.html)。

---

## Q181｜watch 怎么深度监听对象变化

适用：Vue 3.5+ 数字 deep；旧版本仅 boolean。

Vue 3 直接 watch 一个 reactive 对象通常会隐式深度监听；watch(() => state.user, callback) 则默认关注 getter 返回值的替换，需要 deep:true 才递归观察内部变化。深度修改时新旧值可能是同一个对象引用，不能据此推断修改前的快照。Vue 3.5+ 支持数字 deep 限制遍历深度，大对象更适合只监听需要的字段。

```js
const state = reactive({ user: { name: 'A' } });
watch(() => state.user.name, (name, oldName) => console.log(name, oldName));
watch(() => state.user, () => console.log('内部或整体变化'), { deep: true });
```

参考：[资料 1](https://vuejs.org/guide/essentials/watchers.html#deep-watchers)。

---

## Q182｜vue2 删除数组用 delete 和 Vue.delete 有什么区别？

适用：Vue 2.7 与 JavaScript delete。

**delete：**

- delete 是 JavaScript 操作符。删除数组索引会形成空槽（该属性不存在），length 不变；空槽与值为 undefined 的元素在枚举和部分数组方法中行为不同。
- delete 操作不会触发Vue的响应系统，因此不会引起视图的更新。

**Vue.delete：**

- Vue.delete(array, index) 在 Vue 2 中通过 splice 删除，数组长度缩短并触发响应更新。也可直接使用 array.splice(index, 1)。Vue 3 基于 Proxy，可以检测 delete，但对数组通常仍应按业务语义选择 splice 或不可变更新。
- 使用 Vue.delete 来删除数组元素，Vue会正确追踪更改，并在视图中删除相应的元素。

参考：[资料 1](https://v2.vuejs.org/v2/api/#Vue-delete) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete)。

---

## Q183｜Vue3.0 编译做了哪些优化？

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Vue 3 的编译器先解析模板为 AST，变换后生成 render 函数，并把静态分析结果交给运行时。核心优化包括静态内容缓存/提升、标记动态属性类别的 patch flags、通过 block tree 收集动态后代、缓存可安全缓存的事件处理器。

这些提示减少更新时的创建与遍历成本，但不会自动把任意子组件模板内联，也不等于把模板块拆成网络按需加载模块。代码分割通常由动态 import 和打包器完成。Vue 2 也有静态树优化；具体生成代码应以所用编译器版本为准。

参考：[资料 1](https://vuejs.org/guide/extras/rendering-mechanism.html#compiler-informed-virtual-dom)。

---

## Q184｜Vue3.0 新特性 —— Composition API 与 React.js 中 Hooks 的异同点

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Composition API 与 React Hooks 都支持按业务关注点组织状态、副作用和可复用逻辑。Vue 的组合函数通常在 setup 中建立响应式对象与订阅，setup 通常每个实例执行一次；React 函数组件会随渲染重新执行，Hook 读取该次渲染的状态快照。

Vue 通过 ref/reactive 的访问追踪依赖；React 通过状态更新调度渲染，并用 Effect 依赖声明同步范围。React 并非“没有响应性”。一般 React Hooks 必须在组件或 Hook 顶层按稳定顺序调用；Vue 的生命周期注册也有当前实例与同步注册约束。Vue 的 Composition API 不等于 Vue 的无状态函数组件；两边均可使用 JSX，Vue Options API 与 React 类组件也仍受支持。

参考：[资料 1](https://vuejs.org/guide/extras/composition-api-faq.html#comparison-with-react-hooks) · [资料 2](https://react.dev/learn/state-as-a-snapshot)。

---

## Q185｜vue 要做权限管理该怎么做？如果控制到按钮级别的权限怎么做？

适用：Vue Router 4；服务端授权为安全边界。

登录后从可信服务端获取权限标识，路由守卫按 meta 中的要求控制页面入口；按钮可用 v-if、组件封装或自定义指令按权限展示。前端控制只改善交互，不是安全边界，用户可修改客户端代码，因此每个 API、数据对象和敏感操作必须在服务端再次授权。退出、角色切换和权限刷新时应清理缓存，避免继续展示过期权限。

```html
<button v-if="permissions.has('article:edit')" @click="edit">编辑</button>
```

参考：[资料 1](https://router.vuejs.org/guide/advanced/meta.html) · [资料 2](https://router.vuejs.org/guide/advanced/navigation-guards.html)。

---

## Q186｜vue 项目脚手架

适用：Vue 3 create-vue/Vite；Vue CLI 维护模式。

Vue 3 新项目的官方推荐入口是 create-vue，它生成基于 Vite 的项目并交互选择 TypeScript、Vue Router、Pinia、测试和代码规范。Vue CLI 处于维护模式，适合维护既有 webpack 项目，不再是新项目默认推荐。

```bash
npm create vue@latest
```

需要 SSR、文件路由和全栈能力时可选择 Nuxt；组件库应按各自官方安装方式接入，而不是把旧 Vue CLI 插件当成通用脚手架。选择工具前要确认 Node 版本、目标浏览器、部署平台和测试要求。

参考：[资料 1](https://vuejs.org/guide/quick-start.html) · [资料 2](https://cli.vuejs.org/)。

---

## Q187｜Vue-Router 3.x  hash模式 与 history模式 的区别

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Vue Router 3 默认 hash 模式，# 后片段不随 HTTP 请求发送，服务器通常只需提供入口文件。history 模式使用 History API，URL 更自然，但刷新 /user/42 时服务器必须识别前端路由并回退到入口。

回退规则应排除 /api 和静态资源；缺失 JS/CSS 应返回真实 404，不能一律返回 HTML。前端也需配置未匹配路由页面。Vue Router 4 改为显式 createWebHashHistory/createWebHistory，子路径部署还要对齐 base。

参考：[资料 1](https://v3.router.vuejs.org/guide/essentials/history-mode.html)。

---

## Q188｜Vue3.5 更新 - Props 响应式更新

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Vue 3.5 的响应式 props 解构特指 script setup 中从 defineProps() 返回值解构的变量。编译器将同一块代码中的访问改写为 props.foo，因此父 prop 更新后相关读取可以跟上。它不是 JavaScript 解构语义变化，也不适用于普通 reactive 对象。

```vue
<script setup>
import { watch } from "vue";
const { count = 0 } = defineProps({ count: Number });
watch(() => count, value => console.log(value));
</script>
```

传给 watch 或外部组合函数时要提供 getter，直接传 count 只是传当前值。Vue 3.4 及以前按旧行为处理，必要时用 toRef/toRefs。

参考：[资料 1](https://vuejs.org/api/sfc-script-setup.html#reactive-props-destructure)。

---

## Q189｜Vue3.5 更新 - useTemplateRef

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Vue 3.5 的 useTemplateRef("input") 按模板 ref 名称取得引用，并改善 IDE 的元素/组件类型推断。初次渲染前及 v-if 卸载后，引用可能为 null，应在 onMounted 或适当时机访问并检查。

```vue
<script setup>
import { useTemplateRef, onMounted } from "vue";
const input = useTemplateRef("input");
onMounted(() => input.value?.focus());
</script>
<template><input ref="input" /></template>
```

旧版 ref(null) 配合同名模板引用仍有效；对子组件的公开操作范围应由 defineExpose 约束。

参考：[资料 1](https://vuejs.org/guide/essentials/template-refs.html)。

---

## Q190｜Vue3.5 更新 - watch deep

适用：Vue 2.7 / Vue 3.5；每题明确 API 边界，Vue 2 用于旧项目维护。

Vue 3.5 起 deep 可以是数字，表示依赖遍历的最大深度。deep: true 递归遍历全部可达层级，数字深度适合只关心局部结构的情况。数组 deep: 1 可关注替换与数组变更，不会深入元素对象的所有字段。

深层修改回调的新旧对象仍可能是同一引用，这不提供修改前快照。大对象优先用 getter 监听具体字段；数字 deep 只是限制遍历范围，不能把任意大数据监视变成常数成本。

参考：[资料 1](https://vuejs.org/guide/essentials/watchers.html#deep-watchers)。

---

## Q191｜Alien Signals v2.0.0｜ 调试文件与使用方式

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

本组统一固定 Alien Signals v2.0.0，提交 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916。原题冠以 Vue 3.6，但独立库版本不能等同某一 Vue 版本，因此按独立库讲解并保留原图作背景。

```bash
# 在单独学习目录中安装固定版本
npm install --save-exact alien-signals@2.0.0
```

```js
import { signal, computed, effect } from "alien-signals";
const count = signal(1);
const doubled = computed(() => count() * 2);
const stop = effect(() => console.log(doubled()));
count(2); // 初始 2，更新后 4
stop();
```

调试从 src/index.ts 的 API 入口追到 src/system.ts 的依赖与传播函数。可在本地固定提交加日志/断点，不必修改当前项目的 Vue 依赖，也不使用未经验证的 npm run built 命令。

![](./images/interview/大前端面试宝典-image-23.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/index.ts) · [资料 2](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts)。

---

## Q192｜Alien Signals v2.0.0｜  signal

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

v2.0.0 的 signal 返回函数，零参数调用读取，带一个参数调用写入（包括写 undefined）。源节点保存 value/previousValue、订阅者链表与 flags；读取时若有 activeSub 就建立依赖，值变化时传播并按批次刷新效果。

源 signal 通常没有上游依赖，computed 才同时作为依赖消费者与下游来源，不能说每个 signal 都有上下游完整链。该版本值比较使用 !==，与 Object.is 对 NaN、+0/-0 的处理不同；不要混用不同库的相等约定。

![](./images/interview/大前端面试宝典-image-19.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/index.ts)。

---

## Q193｜Alien Signals v2.0.0｜  图论

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

响应式依赖可看作有向图：若 computed/effect 读取 signal，则从依赖源指向订阅者。一个源有多个订阅者，一个派生节点也可依赖多个源，构成多对多关系；分支切换会改变图的边。

矩阵可辅助理解，但大量稀疏依赖不适合分配 n² 表格。实际用邻接关系更经济，既要沿源找订阅者传播，也要沿订阅者找依赖校验/清理。菱形依赖需要避免重复执行与读取不一致中间值，不能简单递归执行所有可达节点。

![](./images/interview/大前端面试宝典-image-20.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts)。

---

## Q194｜Alien Signals v2.0.0｜ 建立关系的方案

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

依赖关系可以存为源到订阅者的 Set，加上订阅者到源的反向记录，也可把每条边独立建模为 Link。Alien Signals v2.0.0 采用 Link 同时连接两端，减少重复表达关系并支持局部拆链。

数据库中间表是多对多关系的类比，但运行时 Link 保存的是对象引用和前后指针，不是在做 SQL 查询。选择结构要考虑创建、遍历、删除、内存布局和重用，不能仅凭“链表”断言更快。

![](./images/interview/大前端面试宝典-image-21.png)

![](./images/interview/大前端面试宝典-image-17.png)

![](./images/interview/大前端面试宝典-image-15.png)

![](./images/interview/大前端面试宝典-image-22.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts)。

---

## Q195｜Alien Signals v2.0.0｜  依赖构建

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

v2.0.0 的 ReactiveNode 保存 deps/depsTail 和 subs/subsTail，Link 保存 dep/sub 两端以及 prevDep/nextDep、prevSub/nextSub 两组双向指针。同一边同时属于订阅者的依赖链与源的订阅链。

已知 Link 时可局部调整相邻指针完成拆链，并维护头尾；最后订阅者移除还触发 unwatched 清理。建立关系仍需去重或重用判断，遍历成本与边数有关；每条边也要分配对象，不能未经基准就承诺比 Set 总省内存。

![](./images/interview/大前端面试宝典-image-18.png)

![](./images/interview/大前端面试宝典-image-16.png)

![](./images/interview/大前端面试宝典-image-43.png)

![](./images/interview/大前端面试宝典-image-41.png)

![](./images/interview/大前端面试宝典-image-42.png)

![](./images/interview/大前端面试宝典-image-39.png)

![](./images/interview/大前端面试宝典-image-44.png)

![](./images/interview/大前端面试宝典-image-40.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts)。

---

## Q196｜Alien Signals v2.0.0｜ 依赖构建（源码分析）

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

固定源码路径：computed/effect 运行前设置 activeSub，startTracking 重置 depsTail 并标记追踪状态；读取 signal/computed 时调用 link(dep, activeSub)，按访问次序推进/复用链接。

结束时在 finally 恢复原 activeSub 并 endTracking，后者把本轮有效尾部之后的旧依赖 unlink。这样条件从读取 a 切换到读取 b 后，a 的过期订阅被移除。嵌套计算必须恢复上层订阅者，不能只设全局变量后清空。初次 effect 与后续运行的调用路径略有差别，应结合 index.ts 阅读，而非只看截图中的几个函数。

![](./images/interview/大前端面试宝典-image-38.png)

![](./images/interview/大前端面试宝典-image-36.png)

![](./images/interview/大前端面试宝典-image-37.png)

![](./images/interview/大前端面试宝典-image-34.png)

![](./images/interview/大前端面试宝典-image-33.png)

![](./images/interview/大前端面试宝典-image-35.png)

![](./images/interview/大前端面试宝典-image-30.png)

![](./images/interview/大前端面试宝典-image-31.png)

![](./images/interview/大前端面试宝典-image-32.png)

![](./images/interview/大前端面试宝典-image-58.png)

![](./images/interview/大前端面试宝典-image-57.png)

![](./images/interview/大前端面试宝典-image-56.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/index.ts) · [资料 2](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts)。

---

## Q197｜Alien Signals v2.0.0｜ 依赖构建（手动实现）

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

下面实现 signal/effect 和双向依赖 Link，演示读取订阅、通知、条件依赖清理、嵌套追踪恢复与停止订阅。它每次重新收集边，使用 Object.is 判等，不复刻 v2.0.0 的链接重用、computed、位标记和 push-pull 调度。

```js
function createSignalSystem() {
  let active;
  function unlink(link) {
    const { dep, sub, prevDep, nextDep, prevSub, nextSub } = link;
    if (prevDep) prevDep.nextDep = nextDep; else sub.deps = nextDep;
    if (nextDep) nextDep.prevDep = prevDep;
    if (prevSub) prevSub.nextSub = nextSub; else dep.subs = nextSub;
    if (nextSub) nextSub.prevSub = prevSub;
  }
  function clear(sub) { while (sub.deps) unlink(sub.deps); }
  function track(dep) {
    if (!active || active.stopped) return;
    for (let link = active.deps; link; link = link.nextDep) if (link.dep === dep) return;
    const link = { dep, sub: active, prevDep: undefined, nextDep: active.deps,
      prevSub: undefined, nextSub: dep.subs };
    if (active.deps) active.deps.prevDep = link;
    if (dep.subs) dep.subs.prevSub = link;
    active.deps = dep.subs = link;
  }
  function signal(value) {
    const dep = { subs: undefined };
    return {
      get() { track(dep); return value; },
      set(next) {
        if (Object.is(value, next)) return;
        value = next;
        const subscribers = [];
        for (let link = dep.subs; link; link = link.nextSub) subscribers.push(link.sub);
        let firstError, failed = false;
        for (const sub of subscribers) {
          try { sub.run(); } catch (error) { if (!failed) { failed = true; firstError = error; } }
        }
        if (failed) throw firstError;
      },
    };
  }
  function effect(fn) {
    if (typeof fn !== 'function') throw new TypeError('effect requires a function');
    const sub = { deps: undefined, stopped: false, running: false, run() {
      if (sub.stopped || sub.running) return;
      clear(sub);
      const previous = active;
      active = sub; sub.running = true;
      try { fn(); } finally { active = previous; sub.running = false; }
    } };
    const stop = () => { sub.stopped = true; clear(sub); };
    try { sub.run(); } catch (error) { stop(); throw error; }
    return stop;
  }
  return { signal, effect };
}
```

```js
const { signal, effect } = createSignalSystem();
const enabled = signal(true), a = signal(1), b = signal(10);
const stop = effect(() => console.log(enabled.get() ? a.get() : b.get()));
a.set(2); // 2
enabled.set(false); // 10
a.set(3); // 已解绑 a，不输出
b.set(11); // 11
stop();
```

effect 回调应同步，嵌套创建的 effect 需自行保留 stop；本例不支持循环写入、异步依赖追踪或自动子作用域管理。执行中的同一 effect 不重入，真实循环更新须由完整调度器处理。

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts) · [资料 2](https://vuejs.org/guide/extras/reactivity-in-depth.html)。

---

## Q198｜Alien Signals v2.0.0｜ 数据信号传播

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

在 v2.0.0 中，signal 写入不同值会设置源 Dirty 并对 subs 调用 propagate。propagate 沿依赖图把需要检查的下游标为 Pending，遇到 Watching 节点通过 notify 入队，避免立即执行每一个派生 getter。

未处于 batch 时随后 flush，effect 的 run 根据 Dirty 或 checkDirty 的结果决定是否执行；computed 的读取也会触发必要检查。notify 不等于立即执行回调，重复入队通过 Queued 位控制。批处理结束才刷新队列，普通写入则可能同步触发效果，不能套用 Vue DOM 的 nextTick 时序。

![](./images/interview/大前端面试宝典-image-53.png)

![](./images/interview/大前端面试宝典-image-55.png)

![](./images/interview/大前端面试宝典-image-59.png)

![](./images/interview/大前端面试宝典-image-54.png)

![](./images/interview/大前端面试宝典-image-51.png)

![](./images/interview/大前端面试宝典-image-49.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/index.ts) · [资料 2](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts)。

---

## Q199｜Alien Signals v2.0.0｜ 传播模型（push-pull 模型）

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

push-pull 把“可能失效的通知”与“实际求值”分开：push 沿订阅链标记 Pending/排队，pull 在读取或执行效果前检查依赖，必要时计算。若某个 computed 重新计算结果不变，下游可能无需重跑。

例如 parity = computed(() => count() % 2)，count 从 1 变 3 时 parity 需要检查并可能执行 getter，但其结果仍为 1，依赖 parity 的 effect 可跳过。收益取决于图结构、比较语义与批处理，不表示更新完全没有传播成本。

![](./images/interview/大前端面试宝典-image-50.png)

![](./images/interview/大前端面试宝典-image-48.png)

![](./images/interview/大前端面试宝典-image-52.png)

![](./images/interview/大前端面试宝典-image-47.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts) · [资料 2](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/index.ts)。

---

## Q200｜Alien Signals v2.0.0｜ 状态机

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

该版本 flags 是组合位，不是 clean/pending/dirty 三个互斥枚举。Mutable 标识可更新节点，Watching 标识观察者，Dirty 表示已确认需要更新，Pending 表示需向上游检查；RecursedCheck/Recursed 用于追踪和重入相关处理。index.ts 另有 Queued 控制效果队列。

startTracking 清除部分失效位并设置追踪位，endTracking 清理旧依赖并移除追踪位；checkDirty/update/shallowPropagate 决定后续传播。解释状态转换必须结合节点角色，不能仅把数字与截图颜色一一对应。

![](./images/interview/大前端面试宝典-image-46.png)

![](./images/interview/大前端面试宝典-image-45.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts) · [资料 2](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/index.ts)。

---

## Q201｜Alien Signals v2.0.0｜ 状态各种位运算

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

v2.0.0 的 Dirty = 1 << 4、Pending = 1 << 5，组合标记使用位或，判断存在某位用按位与，清除用与其补码。判断“同时具备多位”与“任一位存在”要区分。

```js
const Dirty = 1 << 4, Pending = 1 << 5;
let flags = Dirty | Pending;
console.log(Boolean(flags & Dirty)); // true
console.log((flags & (Dirty | Pending)) === (Dirty | Pending)); // true
flags &= ~Dirty;
console.log(Boolean(flags & Dirty)); // false
```

JavaScript 数值位运算按 32 位整数处理；逻辑 || 与按位 | 不可互换。真实 flags 还含其他位，flags === Dirty 不能判断所有“含 Dirty”的状态。

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts)。

---

## Q202｜Alien Signals v2.0.0｜ 栈结构替换递归

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

propagate/checkDirty 用循环、显式 Stack 链与深度信息保存遍历/回溯位置，降低核心图遍历对 JavaScript 调用栈的依赖。可恢复下一个兄弟或父检查点，不必为每条边递归调用同一函数。

显式栈仍占内存，不意味着无限图零成本；而 index.ts 的其他函数和用户 computed getter 仍可能产生递归，不能声称整个系统绝不会爆栈。该版本还对单订阅者等路径减少栈记录，这是具体结构优化，需结合源码与深链/宽图基准评估。

![](./images/interview/大前端面试宝典-image-71.png)

![](./images/interview/大前端面试宝典-image-69.png)

![](./images/interview/大前端面试宝典-image-68.png)

![](./images/interview/大前端面试宝典-image-72.png)

![](./images/interview/大前端面试宝典-image-73.png)

![](./images/interview/大前端面试宝典-image-67.png)

![](./images/interview/大前端面试宝典-image-70.png)

![](./images/interview/大前端面试宝典-image-66.png)

![](./images/interview/大前端面试宝典-image-64.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts) · [资料 2](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/index.ts)。

---

## Q203｜Alien Signals v2.0.0｜ 染色算法 性能优化

适用：Alien Signals v2.0.0，commit 1937d80cbb2e7581a5e194a4c59df3ec8d3a3916；Q197 为独立教学实现。

这里的“染色”可理解为用 Pending/Dirty 等位标记减少重复传播和不必要的下游执行。checkDirty 按依赖检查并在确认变化后更新，update 返回结果是否变化；shallowPropagate 将必要失效传给直接订阅者。

computed 的值未变化通常是重新计算后才知道，因此不能说“没变的 computed 不需要计算”。真正可避免的是部分下游 getter/effect，或已有缓存且依赖未失效的重复计算。比较使用该版本 !== 语义，返回新对象会被视为变化，复用稳定值有不同传播效果。

![](./images/interview/大前端面试宝典-image-65.png)

![](./images/interview/大前端面试宝典-image-74.png)

![](./images/interview/大前端面试宝典-image-63.png)

![](./images/interview/大前端面试宝典-image-60.png)

参考：[资料 1](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/system.ts) · [资料 2](https://github.com/stackblitz/alien-signals/blob/1937d80cbb2e7581a5e194a4c59df3ec8d3a3916/src/index.ts)。

---

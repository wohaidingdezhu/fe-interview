---
id: "interview-javascript"
title: "JavaScript 面试题"
category: "JavaScript"
description: "收录 Q40–Q116 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["JavaScript","面试"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 101
status: draft
quality: complete
sources: ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference","https://html.spec.whatwg.org/multipage/webappapis.html#event-loops"]
technologyVersion: "现代 ECMAScript；事件循环示例针对浏览器"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference) · [参考 2](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)。


## Q40｜以下哪段代码运行效率更高（隐藏类）

适用：ECMAScript ES2019+；V8 12.4.254 排序源码；浏览器 HTML 事件循环。

V8 的 hidden class（Map）描述对象形状，属性以一致顺序建立有利于共享形状和内联缓存；它不是每创建对象就 new 一个 JavaScript Class。原题缺少左右完整代码，不能据此宣称固定隐藏类数量或速度胜负。

```js
function ordered(x, y) { return { x, y }; }
function alternate(x, y, reverse) {
  return reverse ? { y, x } : { x, y };
}
console.log(ordered(1, 2).x, alternate(1, 2, true).x); // 1 1
```

此例只展示构造顺序，性能测试需固定 Node/Chrome/V8 版本、预热并消费结果，区分创建与访问成本。保持稳定对象结构是经验方向，具体优化仍由引擎决定。现代 Chromium Edge 使用 V8，旧 EdgeHTML 才使用 Chakra。

参考：[资料 1](https://v8.dev/docs/hidden-classes) · [资料 2](https://v8.dev/blog/fast-properties)。

---

## Q41｜以下哪段代码效率更高（数组 - 快速模式 / 字典模式）

适用：ECMAScript ES2019+；V8 12.4.254 排序源码；浏览器 HTML 事件循环。

V8 数组有不同 elements kinds，例如 packed/holey 与整数/双精度/通用元素的组合；极稀疏场景还可能采用字典表示。有一个空槽不等于立即进入 dictionary 模式，具体转换阈值与优化策略依版本。

```js
const packed = [1, 2, 3];
const holey = [1, , 3];
console.log(1 in packed, 1 in holey); // true false
```

两数组语义已经不同，forEach/map 等对空槽的行为也不同，因此不能仅比较时长就推导等价优化。实际开发尽量避免无意制造稀疏巨型数组，以性能分析确认瓶颈；隐藏类和 elements kinds 均不是 ECMAScript 保证。

参考：[资料 1](https://v8.dev/blog/elements-kinds)。

---

## Q42｜如何判断 object 为空

适用：现代 JavaScript（ES2015+）。

先定义“空”：通常指没有任何自身属性。Object.keys 只统计自身可枚举字符串键；Reflect.ownKeys 还包含不可枚举字符串键和 Symbol 键。若只关心可序列化业务字段，Object.keys 可能正合适；若要判断真正没有自身键，用 Reflect.ownKeys。

```js
const hasNoOwnKeys = value => value !== null && typeof value === 'object'
  && Reflect.ownKeys(value).length === 0;
```

JSON.stringify 会忽略 undefined、函数、Symbol 键，受 toJSON、属性顺序和循环引用影响，不适合做通用空对象判断。还应根据接口决定数组、Date、Map 等是否允许传入。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys)。

---

## Q43｜强制类型转换、隐式类型转换

适用：ECMAScript 当前类型转换规则。

显式转换通过 Number、String、Boolean 等表明意图；隐式转换发生在运算或比较中。加号既能加法也能连接字符串，减号通常要求数字。空数组和空对象都是 truthy，不能用 Boolean 判断容器是否为空。严格相等不做类型转换，通常更容易理解。

```js
Number('12'); // 12
'12' + 1; // '121'
'12' - 1; // 11
Boolean([]); // true
Number('oops'); // NaN
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion)。

---

## Q44｜== 和 === 的区别

适用：ECMAScript 当前相等比较算法。

严格相等 === 不进行类型转换，但有两个特殊点：NaN 与自身不相等，+0 与 -0 相等。抽象相等 == 按规范执行类型转换，规则包括 null == undefined、字符串与数字转换、对象先转原始值等，不能概括成“随便转成同一类型”。

```js
0 == false;          // true
'' == 0;             // true
null == undefined;   // true
[] == '';            // true
NaN === NaN;         // false
Object.is(NaN, NaN); // true
Object.is(+0, -0);   // false
```

业务判断通常优先 ===；需要 NaN 或正负零语义时使用 Object.is。不要依赖复杂的 == 题目技巧编写生产代码。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)。

---

## Q45｜javascript 的数据类型有哪些

适用：ECMAScript 2024 数据类型。

ECMAScript 原始类型有 Undefined、Null、Boolean、String、Symbol、Number、BigInt；其余语言值属于 Object。Array、Function、Date、Map 等都是具有不同内部槽或可调用能力的对象，不是与 Object 并列的新语言类型。

原始值不可变，变量赋值复制该值；对象赋值复制对象引用值，因此两个变量可指向同一对象。规范不规定“原始类型一定在栈、对象一定在堆”，具体内存布局由引擎优化决定。Number 使用 IEEE 754 双精度，BigInt 表示任意精度整数，二者不能直接混合算术。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures)。

---

## Q46｜javascript  变量在内存中的堆栈存储

适用：ECMAScript 值传递语义；内存布局属引擎实现。

ECMAScript 只定义值和对象语义，不要求引擎按“原始值进栈、引用类型进堆”实现。栈帧、寄存器、逃逸分析、指针压缩和对象内联都可能改变物理布局。面试真正要说明的是：参数按值传递；对象变量中传递的值能引用同一个对象。

```js
function run(obj) {
  obj.m = 40;       // 通过复制的引用修改同一对象
  obj = { m: 50 };  // 只让局部参数指向新对象
  console.log(obj.m); // 50
}
const original = { m: 30 };
run(original);
console.log(original.m); // 40
```

重新给参数赋值不会改变调用方变量的绑定，但通过该引用修改对象属性会被双方观察到。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) · [资料 2](https://tc39.es/ecma262/)。

原配图使用简化堆栈模型，仅辅助说明值与引用关系，实际物理存储不由 ECMAScript 规定：

![](./images/interview/大前端面试宝典-diagram.png)

![](./images/interview/大前端面试宝典-diagram-1.png)

---

## Q47｜JS  单线程设计的目的

适用：现代浏览器 JavaScript agents 与 Workers。

浏览器中的一个 JavaScript agent 一次执行一个调用栈，事件循环在任务之间调度脚本、事件和微任务，使同一 agent 内的普通代码不被另一段脚本任意抢占。这简化了 DOM 与脚本状态的一致性，但不代表浏览器只有一个线程：渲染、网络、媒体、Worker 等可并行工作。

Web Worker 在独立 agent 中执行，不能直接操作主文档 DOM，通常通过结构化克隆、可转移对象或受控共享内存通信。SharedArrayBuffer/Atomics 会重新引入共享内存同步问题。异步 API 也不等于新线程；Promise 回调仍在所属 agent 的事件循环中执行。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)。

---

## Q48｜如何判断 javascript 的数据类型

适用：现代 JavaScript；跨 realm 边界需注意。

- **typeof 操作符：** 可以用来确定一个值的基本数据类型，返回一个表示数据类型的字符串。

注意，typeof null 返回 "object" 是历史遗留问题，不是很准确。

- **Object.prototype.toString：** 用于获取更详细的数据类型信息。
- **instanceof 操作符：** 沿对象原型链检查构造函数 prototype，跨 realm、Symbol.hasInstance 或原型被修改时结果需要谨慎解释。
- Array.isArray：用于检查一个对象是否是数组。

typeof 适合快速区分 undefined、boolean、number、bigint、string、symbol、function 和普通 object；null 是历史例外。Object.prototype.toString 可用于部分内建对象，但可被 Symbol.toStringTag 影响。类型判断应服务具体接口，不存在对所有自定义对象都可靠的单一字符串方案。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof) · [资料 3](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)。

---

## Q49｜ES 每个版本引入了什么内容

适用：ECMAScript 2015–2024 特性摘要。

ECMAScript 自 ES2015 起按年发布，面试不必背完所有条目，应能定位规范年份并核对运行环境。常见里程碑：

- ES2015：let/const、class、module、Promise、箭头函数、解构、迭代器/生成器、Map/Set、Proxy。
- ES2016：指数运算符、Array.prototype.includes。
- ES2017：async/await、Object.values/entries、字符串 padding。
- ES2018：对象 rest/spread、异步迭代、Promise.finally、正则增强。
- ES2019：Array flat/flatMap、Object.fromEntries、optional catch binding 等。
- ES2020：BigInt、可选链、空值合并、Promise.allSettled、globalThis、动态 import。
- ES2021：逻辑赋值、Promise.any、String.replaceAll、WeakRef/FinalizationRegistry。
- ES2022：class fields/private fields、top-level await、Object.hasOwn、Error cause、at()。
- ES2023：toSorted/toReversed/toSpliced/with、findLast/findLastIndex、Hashbang。
- ES2024：Promise.withResolvers、Object.groupBy/Map.groupBy、正则 v flag、Resizable ArrayBuffer 等。

新语法进入 ECMAScript 不等于所有目标浏览器和工具链立即可用；应结合兼容表、转译目标和运行时 polyfill 判断。动态 import 属于 ES2020，不应列在 ES2019。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/JavaScript_technologies_overview) · [资料 2](https://github.com/tc39/proposals/blob/main/finished-proposals.md)。

---

## Q50｜let 声明变量的特性

适用：现代浏览器 HTML/DOM；ECMAScript 2024。

let 创建块级词法绑定，同一作用域不能重复声明，在初始化前处于暂时性死区。for 循环头部的 let 还会为各次迭代创建对应绑定，异步回调因此能保留不同的 i。

```js
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i), 0); // 0、1、2
for (var j = 0; j < 3; j++) setTimeout(() => console.log(j), 0); // 3、3、3
```

这里所有回调在当前同步任务结束后执行，setTimeout 不保证精确延迟。经典浏览器脚本顶层 let 不成为 window 的自有属性；ES 模块顶层 var/let 都是模块作用域，不应混用这两个环境。

![](./images/interview/大前端面试宝典-image-1.png)

![](./images/interview/大前端面试宝典-image-2.png)

![](./images/interview/大前端面试宝典-image-27.png)

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)。

---

## Q51｜变量提升 & 函数提升 (优先级)

适用：ECMAScript 声明实例化与词法绑定。

函数声明在其作用域初始化时绑定为函数；var 绑定初始化为 undefined，赋值仍发生在原来的执行位置。let/const 也建立词法绑定，但初始化前处于暂时性死区，访问会抛错。不要用“所有声明都搬到最上面”理解执行顺序；同名声明、严格模式和块级函数还会影响合法性。

```js
console.log(value); // undefined
console.log(run()); // 1
var value = 2;
function run() { return 1; }
// console.log(other); let other = 3; // ReferenceError
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)。

---

## Q52｜如何判断对象相等

适用：现代 JavaScript；深比较语义需由业务定义。

先定义相等语义：是否只比较引用、是否深比较、原型/属性描述符/Symbol/不可枚举属性是否重要，以及 Map、Set、Date、TypedArray、循环和共享引用如何处理。

- a === b / Object.is(a,b)：判断是否为同一引用（Object.is 还区分 +0/-0，并认为 NaN 等于自身）。
- 浅比较：比较自身可枚举键及每个值，常用于不可变状态和 React 优化。
- 深比较：应使用经过明确契约和测试的库或领域专用比较函数。

JSON.stringify 不适合通用深比较：会忽略 undefined、函数、Symbol 键，受属性顺序/toJSON 影响，不能处理 BigInt 和循环引用，也无法表达 Map/Set、原型与共享引用结构。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)。

---

## Q53｜null 和 undefined 的区别

适用：ECMAScript 当前 Null/Undefined 语义。

**undefined**

- 当声明了一个变量但未初始化它时，它的值为 undefined。
- 当访问对象属性或数组元素中不存在的属性或索引时，也会返回 undefined。
- 当函数没有返回值时，默认返回 undefined。
- 如果函数的参数没有传递或没有被提供值，函数内的对应参数的值为 undefined。

**null**

- null 是一个原始值，通常由程序显式表示“有这个字段，但当前没有对象/值”。“空对象指针”只是历史术语，不是 JavaScript 类型定义。
- typeof null 返回 "object" 是兼容性遗留行为。
- Object.prototype 的原型是 null，但这不表示 null 本身是对象或“原型链顶层对象”。Object.create(null) 可创建没有 Object.prototype 的对象。

默认参数只在参数为 undefined 或省略时使用，传 null 不会触发默认值。JSON 对对象中的 undefined 属性会忽略，而 null 会被序列化，因此 API 语义需要明确区分。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)。

---

## Q54｜用 setTimeout 来实现倒计时 ，与 setInterval 的区别？

适用：HTML timers；现代浏览器。

递归 setTimeout 在本轮回调结束后再安排下一轮，不会让同一倒计时的多个回调同时排队；setInterval 按计划尝试触发，但实际执行仍受主线程和任务队列影响，不能保证精确间隔。两者都会受到后台标签页节流、最小延迟和长任务影响。若要求与真实时钟对齐，应保存目标时间并用 Date.now() 计算剩余值，而不是假设每次正好过去一秒。

```js
function countdown(seconds, onTick, schedule = setTimeout, cancelSchedule = clearTimeout) {
  if (!Number.isInteger(seconds) || seconds < 0) throw new RangeError('seconds 必须是非负整数');
  if (typeof onTick !== 'function') throw new TypeError('onTick 必须是函数');
  let remaining = seconds, timer, cancelled = false;
  function tick() {
    if (cancelled) return;
    onTick(remaining);
    if (remaining === 0) return;
    remaining--;
    timer = schedule(tick, 1000);
  }
  tick();
  return () => { cancelled = true; if (timer !== undefined) cancelSchedule(timer); };
}
```

```js
const cancel = countdown(5, (value) => console.log(value));
// 不再需要时调用 cancel()
```

![](./images/interview/大前端面试宝典-diagram-2.png)

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)。

---

## Q55｜JS 事件循环机制 - 宏任务微任务是如何工作的？

适用：现代浏览器 HTML/DOM；ECMAScript 2024。

浏览器每轮选择一个可运行 task，在适当检查点清空微任务队列，再可能更新渲染并继续任务。Promise reaction 与 queueMicrotask 属于微任务；计时器和用户交互来自不同 task source，不能把所有任务合成简单全局 FIFO。

```js
console.log("start");
setTimeout(() => console.log("timer"), 0);
queueMicrotask(() => {
  console.log("microtask-1");
  queueMicrotask(() => console.log("microtask-2"));
});
console.log("end");
// start、end、microtask-1、microtask-2、timer
```

微任务中追加的微任务继续处理到队列清空，过多会延迟交互和绘制。Node 的 nextTick 与事件循环阶段另有约定，本题讨论浏览器。

![](./images/interview/大前端面试宝典-image-28.png)

参考：[资料 1](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)。

---

## Q56｜事件循环 - 以下代码输出结果

适用：HTML Living Standard 微任务检查点。

若微任务在执行时无条件继续排入自身，microtask checkpoint 永远无法清空，后续定时器和渲染都会饥饿。下面会持续输出 test，timeout 没有执行机会；实际运行会冻结页面，不要在主线程直接执行。

```js
function loop() {
  console.log('test');
  queueMicrotask(loop);
}
setTimeout(() => console.log('timeout'), 0);
loop();
```

这不是“微任务永远比宏任务优先”的普遍口号，而是当前 checkpoint 被无限延长。修复方法是让循环终止，或把后续批次让回 task/渲染机会，例如受控使用 setTimeout、scheduler API 等。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide) · [资料 2](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint)。

---

## Q57｜事件循环进阶（1）

适用：现代浏览器事件循环。

原导入材料没有可执行代码，无法还原其具体输出。下面用可验证的新例子说明浏览器事件循环：先执行当前任务中的同步代码，再清空微任务队列，之后才有机会执行定时器任务。这里的输出次序为 A、D、C、B。

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)。

---

## Q58｜事件循环进阶（2）

适用：现代浏览器 queueMicrotask。

原题没有保留代码，这里补一个独立示例。then 回调中新建的微任务会追加到队列尾部，而不是插到当前微任务后立即执行。当前任务结束后，输出依次为 A、B、C；微任务队列必须持续处理到空，过多微任务可能延迟绘制。

```js
queueMicrotask(() => { console.log('A'); queueMicrotask(() => console.log('C')); });
queueMicrotask(() => console.log('B'));
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Window/queueMicrotask)。

---

## Q59｜事件循环进阶（3）

适用：现代 JavaScript async/await。

原题没有保留代码，以下为教学替代示例。async 函数会同步执行到第一个 await；即使等待已解决的 Promise，await 之后的代码也不会在同一同步栈内立即执行。输出为 A、C、B。是否先于其他微任务需根据注册顺序分析，不能笼统说 async 更快。

```js
async function run() { console.log('A'); await Promise.resolve(); console.log('B'); }
run(); console.log('C');
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)。

---

## Q60｜事件循环进阶（4）

适用：现代 JavaScript Promise；浏览器任务模型。

原题没有保留代码，不能推测图片中输出。此例说明 Promise executor 在构造时同步执行，then 回调才进入微任务队列；setTimeout 是后续任务。输出为 A、D、C、B。浏览器和 Node 的调度阶段不同，本例仅针对浏览器，不把 Node 的 nextTick 等规则混入。

```js
new Promise(resolve => { console.log('A'); resolve(); }).then(() => console.log('C'));
setTimeout(() => console.log('B'), 0); console.log('D');
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)。

---

## Q61｜事件循环进阶（5）

适用：HTML Living Standard script 调度。

经典 script 的执行通常作为 HTML 事件循环中的 task 发生，但 async、defer、module、dynamic import 的获取和执行时机不同，不能把所有 script 简化成同一个“宏任务队列”。一个普通脚本 task 执行完同步代码后，会进行微任务检查点；浏览器随后可能渲染，再选择下一个 task。

```html
<script>
  console.log('script');
  queueMicrotask(() => console.log('microtask'));
  setTimeout(() => console.log('timer'), 0);
</script>
```

在没有其他干扰时顺序是 script、microtask、timer。外部脚本的网络完成顺序不直接决定执行顺序，应结合 async/defer/module 规则分析。

参考：[资料 1](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)。

---

## Q62｜什么是内存泄漏

适用：现代垃圾回收器与 Chrome DevTools。

内存泄漏是程序已经不再需要某些对象，但它们仍可从 GC roots（全局对象、活动栈、原生引用等）到达，因而无法回收。单纯“占用内存”或缓存增长不一定是泄漏；应观察完成同一操作并回到稳定状态后，保留对象是否逐轮增加。

常见原因包括未清理的监听器/订阅/定时器、无界缓存、全局集合、闭包意外保留大对象、未释放的 DOM/第三方资源。现代标记清除 GC 能处理不可达的循环引用，因此“对象互相引用就一定泄漏”是错误的。

排查时先用 Performance/任务管理器观察趋势，再对比 Heap Snapshot，沿 Retainers 找到保留路径。修复后重复相同操作并在 GC 后验证基线是否稳定。

参考：[资料 1](https://developer.chrome.com/docs/devtools/memory-problems/) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management)。

---

## Q63｜什么是闭包，有什么作用。

适用：现代 JavaScript（ES2015+）。

闭包是函数与其声明时词法环境的组合。内部函数保留的是对变量绑定的访问能力，不是简单复制当时的值。它可用于封装私有状态、函数工厂、事件处理器和异步回调；只要闭包仍然可达，它引用的对象也可能继续存活，因此应清理不再需要的监听器、定时器和长期缓存。

```js
function createCounter(initial = 0) {
  let value = initial;
  return { increment() { return ++value; }, current() { return value; } };
}
```

```js
const first = createCounter(1);
const second = createCounter(10);
first.increment(); // 2
second.current();  // 10，每个闭包拥有独立词法环境
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)。

---

## Q64｜常用的 console 方法有哪些，JS 调试方法

适用：Chrome DevTools 稳定版；Console API 按环境实现。

常见方法包括 log/info/warn/error、table、group/groupEnd、time/timeEnd、count、trace 和 assert。排查错误时可在开发者工具中设断点、条件断点和异常暂停，查看调用栈、作用域和网络请求。Source Map 将压缩代码映射回源码，但生产发布是否暴露源文件应按项目策略决定。console 输出对象可能是延迟查看，应保存需要对比的快照。

参考：[资料 1](https://developer.chrome.com/docs/devtools/console/)。

---

## Q65｜数组去重的方法

适用：现代 JavaScript（ES2015+）。

原始值和按引用去重通常使用 [...new Set(values)]，Set 使用 SameValueZero：NaN 视为相同，+0/-0 视为相同，对象仍按引用区分。filter + indexOf 无法把 NaN 正确去重，而 includes 使用 SameValueZero。对象若要按 id 等业务键去重，应明确保留第一条还是最后一条。

```js
const unique = [...new Set([1, 1, NaN, NaN])];
const byId = [...new Map(rows.map(row => [row.id, row])).values()]; // 保留最后一条
```

不要用 JSON.stringify 作为通用对象键，它有属性顺序、类型丢失和循环引用问题。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)。

---

## Q66｜清空数组的方法

适用：现代 JavaScript Array。

arr.length=0 和 arr.splice(0) 都清空原数组，所有持有相同数组引用的变量都会看到变化。arr=[] 只是把当前变量指向新数组，不会清空旧数组，也不能赋值给 const 绑定。选择前先明确是否需要保留数组身份。

```js
const a = [1, 2]; const b = a; a.length = 0;
console.log(b); // []
let x = [1, 2]; const y = x; x = [];
console.log(y); // [1, 2]
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice)。

---

## Q67｜JS 数组常见操作方式及方法

适用：ECMAScript 2023+；非修改数组方法需查兼容性。

push/pop 修改尾部，unshift/shift 修改头部，splice 修改任意区间；slice、map、filter 返回新数组。sort/reverse 会修改原数组，现代运行环境支持 toSorted/toReversed 等非修改版本，旧环境需要确认兼容性。find 返回第一个匹配元素，some/every 返回布尔值，includes 检查元素存在性；对象元素的相等通常比较引用。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)。

---

## Q68｜JS 数组 reduce 方法的使用

适用：现代 JavaScript Array.prototype.reduce。

reduce 把多个元素累计成一个值，可以做求和、分组或索引。推荐明确提供初始值，避免空数组抛错以及首个元素被当作累积器带来的类型混乱。纯函数式复制累积对象可读但大量数据时可能反复分配，需要结合性能选择实现。

```js
const total = [1, 2, 3].reduce((sum, value) => sum + value, 0); // 6
const grouped = rows.reduce((map, row) => {
  (map[row.category] ??= []).push(row); return map;
}, Object.create(null));
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)。

---

## Q69｜如何遍历对象

适用：现代 JavaScript 对象键枚举。

Object.keys/values/entries 遍历自身可枚举的字符串键，for...in 还可能遍历原型链上的可枚举字符串属性，应配合 Object.hasOwn。Reflect.ownKeys 返回全部自身字符串和 Symbol 键，包括不可枚举属性。遍历对象不能简单替换为 for...of，因为普通对象默认没有迭代器。

```js
for (const [key, value] of Object.entries(object)) console.log(key, value);
for (const key of Reflect.ownKeys(object)) console.log(key);
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys)。

---

## Q70｜创建函数的几种方式

适用：现代 JavaScript 函数语义。

- 函数声明：function fn() {}，绑定在作用域实例化时初始化，可在声明文本前调用，但块级函数和重复声明受模式/环境规则影响。
- 函数表达式：const fn = function named() {}，函数值在赋值表达式执行时产生；变量绑定本身遵循 var/let/const 规则。
- 箭头函数：const fn = () => {}，词法捕获 this/arguments/super/new.target，不能作为构造函数，也没有 prototype 属性用于 new。
- 方法定义：const obj = { fn() {} } 或 class 中的方法，具备方法的 [[HomeObject]] 语义以支持 super。
- Function 构造器：从字符串创建函数，作用域和安全/性能特征类似动态代码执行，通常不使用。

“匿名函数”描述有没有显式名称，不是与上述并列的独立创建机制；引擎还可能根据赋值位置推断 name。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)。

---

## Q71｜创建对象的几种方式

适用：现代 JavaScript 对象与 class。

- **对象字面量（Object Literal）：**使用大括号 {} 创建对象，可以在大括号内定义对象的属性和方法。
- **构造函数（Constructor Function）：**使用构造函数创建对象，通过 new 关键字调用以创建对象。
- **Object.create() 方法：**使用 Object.create() 方法创建对象，可以指定对象的原型。
- **工厂函数（Factory Function）：**使用工厂函数创建对象，工厂函数是一个返回新对象的函数。
- class + new：类语法基于原型机制，但还带有严格模式、不可直接调用、私有字段、super 等专门语义，不能把所有差异都概括成纯语法糖。

对象字面量适合固定结构，工厂函数适合封装创建逻辑，构造函数/class 适合同类实例共享原型方法，Object.create 适合明确指定原型（包括 null）。选择依据是状态封装、原型共享和 API 语义，不是性能口诀。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)。

---

## Q72｜宿主对象、内置对象、原生对象

适用：ECMAScript 内置对象与现代 Web APIs。

现代回答建议区分规范来源，而不是死背容易混用的“原生对象”术语：

- ECMAScript 内置对象：Object、Array、Function、Map、Promise、Math、JSON 等，由 ECMAScript 规范定义。
- 宿主/Web API 对象：Window、Document、Element、XMLHttpRequest、fetch 相关接口等，由 HTML、DOM、Fetch 等宿主规范提供。
- Node.js API：process、Buffer、fs 模块等，由 Node.js 定义，不属于 ECMAScript 核心。
- 用户对象：应用通过字面量、class、构造函数或 Object.create 创建。

Array 实例仍是 ECMAScript 对象；不能说“原生对象属于语言但不是内置对象”后又把 Array 与内置对象割裂。判断 API 可用性应看运行环境和版本。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API)。

---

## Q73｜如何区分数组和对象？

适用：现代 JavaScript；跨 realm 数组判断。

数组也是对象，typeof [] 返回 "object"。可靠判断使用 Array.isArray(value)，它能跨 iframe/realm 工作；value instanceof Array 可能因构造函数来自另一个 realm 而失败。不要用是否有 length、数字键或 push 方法判断，普通对象也能伪造这些属性。

数组对索引和 length 有特殊语义，适合有序序列；普通对象适合具名属性。稀疏数组、字符串键和 Symbol 键仍可能存在，应根据数据模型选择结构。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)。

---

## Q74｜什么是类数组（伪数组），如何将其转化为真实的数组？

适用：现代 JavaScript 可迭代/类数组转换。

类数组（或伪数组）是一种类似数组的对象，它们具有类似数组的结构，即具有数字索引和length属性，但不具有数组对象上的方法和功能。

**常见的类数组：**

- 函数内部的arguments对象
- DOM 元素列表（例如通过 querySelectorAll 获取的元素集合）
- 一些内置方法（如 getElementsByTagName 返回的集合）

**转换方式：**

```js
Array.from(arrayLike);
Array.prototype.slice.call(arrayLike);
[...iterable];
```

Array.from 同时支持类数组和可迭代对象；展开语法只支持 iterable，并非所有只有 length 的类数组都可展开。querySelectorAll 返回静态且通常可迭代的 NodeList，getElementsByTagName 返回动态 HTMLCollection，转换成数组后得到的是当时快照。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)。

---

## Q75｜什么是作用域链

适用：ECMAScript 词法环境与闭包。

“作用域链”是解释标识符解析的教学术语。执行环境会从当前词法环境记录查找绑定，找不到就沿 OuterEnv 指向的外层词法环境继续，直到全局环境；若仍不存在，读取会抛 ReferenceError。链由代码的词法嵌套决定，而不是由函数在哪里调用决定。

函数对象保存对定义时外部环境的访问，因此作为回调传到其他位置后，仍按定义位置解析自由变量；with/eval 等少数机制会使分析复杂，也是应避免的原因。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)。

---

## Q76｜作用域链如何延长

适用：现代 JavaScript；严格模式禁止 with。

作用域由代码的词法结构确定，不是在运行时随意“延长”。闭包让函数在外层函数返回后仍能访问其词法环境中的绑定，可以理解为保留访问能力。with 和 eval 不是推荐手段，会增加可读性、优化和安全问题，严格模式还禁止 with。

```js
function counter() { let value = 0; return () => ++value; }
const next = counter(); next(); next(); // 1、2
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/with)。

---

## Q77｜DOM 节点的 Attribute 和 Property 区别

适用：HTML Living Standard DOM reflection。

**Attribute（属性）：**

- Attribute 是 HTML 元素在文档中的属性，它们通常在 HTML 中定义，并被存储在 HTML 元素的开始标签中。
- Attribute 可以包含在 HTML 中，如 <div id="myDiv" class="container"> 中的 id 和 class。
- Attribute 始终是字符串值，无论它们在 HTML 中是什么数据类型。
- 通过 getAttribute() 方法可以访问元素的属性值，例如 element.getAttribute("id")。

**Property（属性）：**

- Property 是 DOM 元素对象的属性，它们通常表示了 HTML 元素在文档中的状态和属性。
- Property 的名称通常对应于 HTML 元素的属性名称，但不总是相同（有时有所不同）。
- Property 的值可以是不同的数据类型，取决于属性的类型。
- 通过访问 DOM 元素对象的属性，可以直接操作和修改元素的状态，例如 element.id 或 element.className。

部分标准属性会“反射”为 property，但同步规则按属性定义不同。getAttribute 返回字符串或 null；property 可以是布尔、数字、对象或实时状态。例如 checked attribute 表示默认/初始声明，input.checked 表示当前勾选状态；value attribute 与 input.defaultValue 关联，而 input.value 会随用户输入变化。布尔属性只看是否存在，checked="false" 仍表示存在。

```js
input.getAttribute('value'); // 标记中的初始字符串
input.value;                 // 当前交互值
input.hasAttribute('disabled');
input.disabled;              // boolean property
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Element/attributes) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement)。

---

## Q78｜DOM 结构操作创建、添加、移除、移动、复制、查找节点

适用：现代 DOM Standard。

```js
const item = document.createElement('li');              // 创建
item.textContent = 'New';
list.append(item);                                      // 添加到末尾
list.prepend(document.createTextNode('标题：'));         // 添加到开头
item.before(document.createElement('hr'));              // 相邻插入
otherList.append(item);                                 // 移动：已有节点会从原位置移除
const copy = item.cloneNode(true);                       // 深复制 DOM 子树，不复制 addEventListener 监听器
item.replaceWith(copy);                                 // 替换
copy.remove();                                          // 移除
const match = document.querySelector('[data-id="1"]'); // 查找首个
const matches = document.querySelectorAll('li');         // 静态 NodeList
```

批量插入可使用 DocumentFragment 或一次 append 多个节点。写文本优先 textContent；把不可信字符串交给 innerHTML 会产生 XSS 风险。cloneNode 可能复制重复 id，插入前要修正唯一标识和表单状态。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Element) · [资料 3](https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode)。

---

## Q79｜DOM 的事件模型

适用：现代 DOM Events。

1. **事件对象（Event Object）：** 事件对象是一个包含有关事件的信息的对象。它包括事件的类型、目标元素、鼠标位置、按下的键等信息。事件处理程序可以访问事件对象来了解事件的详细信息。
2. **事件类型（Event Type）：** 事件类型指定了发生的事件的种类，例如点击事件（click）、鼠标移动事件（mousemove）、键盘按下事件（keydown）等。
3. **事件目标（Event Target）：** 事件目标是触发事件的元素，事件将在目标元素上执行事件处理程序。
4. **事件冒泡和事件捕获（Event Bubbling and Event Capturing）：** 事件可以在 DOM 树中冒泡或捕获。事件冒泡从目标元素开始，逐级向上传播到根元素；事件捕获从根元素开始，逐级向下捕获到目标元素。
5. **事件监听器（Event Listener）：** 事件监听器是函数，用于处理特定类型的事件。它可以附加到元素，以便在事件发生时执行。通常使用 addEventListener 方法来添加事件监听器。
6. **事件处理程序（Event Handler）：** 事件处理程序是函数，负责处理特定事件类型的事件。事件监听器通常会调用事件处理程序。
7. **事件委托（Event Delegation）：** 事件委托是一种技术，其中一个父元素上的事件监听器处理该元素的所有子元素上发生的事件。这减少了事件监听器的数量，提高了性能。
8. **取消事件（Preventing Default）：** 事件处理程序可以取消事件的默认行为，例如在链接上阻止默认的点击跳转行为。这可以通过调用事件对象的 preventDefault 方法来实现。
9. **停止事件传播（Stopping Propagation）：** 事件处理程序可以停止事件的传播，防止事件继续冒泡或捕获。这可以通过调用事件对象的 stopPropagation 或 stopImmediatePropagation 方法来实现。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)。

---

## Q80｜事件三要素

适用：现代 DOM Events。

1. **事件源（Event Source）：** 事件源是事件的发出者或触发者，它是产生事件的对象或元素，事件源通常是用户与页面交互的元素，如按钮、链接、输入框等。
2. **事件类型（Event Type）：** 事件类型是指事件的种类或类型，描述了事件是什么样的行为或操作，不同的事件类型包括点击事件（click）、鼠标移动事件（mousemove）、键盘按下事件（keydown）、表单提交事件（submit）等。
3. **事件处理程序（Event Handler）：** 事件处理程序是事件触发后要执行的代码块或函数，它定义了当事件发生时要执行的操作。事件处理程序通常由开发人员编写，用于响应事件并执行相应的逻辑。

这三要素一起构成了事件的基本信息。当用户与页面交互时，事件源会触发特定类型的事件，然后事件处理程序会捕获并处理事件，执行相关的操作。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Event) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)。

---

## Q81｜如何绑定事件，解除事件

适用：现代 DOM EventTarget；AbortSignal 监听器清理。

addEventListener 可以注册多个监听器；removeEventListener 必须使用相同的事件类型、函数引用以及 capture 设置。重新写一个看似相同的匿名函数不是同一引用。支持的浏览器也可用 AbortController 一次解除一组监听器，适合组件卸载清理。

```js
const controller = new AbortController();
button.addEventListener('click', onClick, { signal: controller.signal });
controller.abort(); // 解除监听
function onClick() { console.log('clicked'); }
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener)。

---

## Q82｜事件冒泡和事件捕获的区别，如何阻止。

适用：现代浏览器 HTML/DOM；ECMAScript 2024。

一次事件分发通常先沿路径捕获，再到目标，再在事件允许时向外冒泡。capture:true 在捕获阶段监听，默认 false 在目标/冒泡阶段监听；并非所有事件都有冒泡阶段，查看 event.bubbles。

stopPropagation 阻止继续沿路径传播，同一节点的其他监听器仍可能执行；stopImmediatePropagation 还停止该节点后续监听器。preventDefault 取消可取消事件的默认动作，既不停止传播，也不能在 passive 监听器中生效。

Shadow DOM 存在 retargeting，composed 决定是否跨影子边界，composedPath 提供相应路径；事件委托需按真实目标和边界判断。不能把“冒泡是默认监听阶段”理解为浏览器没有捕获过程。

![](./images/interview/大前端面试宝典-diagram-3.png)

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Event/composed)。

---

## Q83｜事件委托

适用：现代 DOM Events。

事件委托是一种常见的 JavaScript 编程技巧，它的核心思想是将事件处理程序附加到一个祖先元素上，而不是直接附加到每个子元素上，当事件在子元素上冒泡时，祖先元素捕获事件并根据事件目标来确定如何处理事件。

1. **性能优势：** 事件委托可以减少事件处理程序的数量，特别是在大型文档中，因为您只需为一个祖先元素添加一个事件处理程序。这降低了内存消耗和提高了性能，因为不必为每个子元素都绑定事件。
2. **动态元素：** 事件委托适用于动态生成的元素，因为无需为新添加的元素单独绑定事件，而是在祖先元素上继续使用相同的事件处理程序。
3. **代码简洁性：** 通过将事件处理逻辑集中在祖先元素上，代码更加简洁和可维护，因为您不需要为每个子元素编写相似的事件处理代码。
4. **处理多个事件类型：** 通过在祖先元素上处理多个事件类型，可以实现更多的灵活性。例如，您可以在祖先元素上处理点击事件、鼠标移动事件和键盘事件，而不必为每个事件类型创建单独的事件处理程序。

```js
list.addEventListener('click', (event) => {
  const item = event.target.closest('li[data-id]');
  if (!item || !list.contains(item)) return;
  selectItem(item.dataset.id);
});
```

不能只判断 event.target 是否为 li，因为用户可能点击 li 内部图标；closest 找到实际委托目标，再用 contains 防止匹配到委托容器之外的祖先。focus、mouseenter 等不冒泡或传播语义不同，应改用 focusin、mouseover/pointerover 或捕获阶段，并确认 Shadow DOM retargeting。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)。

---

## Q84｜JavaScript 动画和 CSS3 动画有什么区别？

适用：现代 CSS/Web Animations；性能需实测。

CSS transition/animation 适合声明式状态过渡与关键帧，浏览器可以统一采样时间线；JavaScript 可用 requestAnimationFrame、Web Animations API 或动画库实现动态路径、物理计算和交互控制。setInterval 不是逐帧动画的首选，因为它与渲染帧不同步。

性能不由“CSS 还是 JS”单独决定。transform/opacity 在合适分层时两者都可能只合成；动画 width/top 等属性两者都可能触发布局和绘制。JavaScript 还会占用主线程执行预算，但 CSS 动画的事件和样式计算也不是零成本。应使用 Performance 面板验证长任务、Layout、Paint 和 Composite，并响应 prefers-reduced-motion。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)。

---

## Q85｜获取元素位置？

适用：现代 CSSOM View。

- element.getBoundingClientRect() 返回相对视口的边界矩形，包含 CSS transform 后的轴对齐边界；加 scrollX/scrollY 可换算到文档坐标。
- offsetTop/offsetLeft 相对 offsetParent，受定位、表格和布局结构影响，不是通用页面坐标。
- 事件的 clientX/clientY 相对视口，pageX/pageY 相对文档，screenX/screenY 相对屏幕。

读取几何属性可能迫使浏览器刷新待处理布局，循环中应先集中读取再写样式。缩放、滚动容器、transform、iframe 和多行 inline 元素都需要明确坐标系；多片段可使用 getClientRects()。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetTop)。

---

## Q86｜document.write 和 innerHTML 的区别？

适用：现代浏览器 HTML/DOM；ECMAScript 2024。

document.write 在解析期间向 HTML 输入流写入内容，会影响解析与 DOM；文档加载后调用可能隐式打开新文档并清空页面，也可能被浏览器忽略或干预，因此新业务不应使用。

innerHTML 解析字符串并替换特定元素的子树。旧节点被移除，但如果外部仍持有它们，监听器和状态不自动从内存消失；新建节点也不会继承旧节点的 addEventListener 注册。

两者都可能把不可信数据变为执行内容。展示文本优先 textContent；确需 HTML 用明确可信模板或成熟清洗方案，并配合 CSP/Trusted Types。不能因为 innerHTML 插入的某些 script 不执行，就认定它安全。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Document/write) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)。

---

## Q87｜mouseover 和 mouseenter 的区别

适用：现代 UI Events/Pointer Events。

- **触发时机：**
- mouseover：当鼠标指针从一个元素的外部进入到元素的范围内时触发该事件。它会在进入元素内部时触发一次，然后在鼠标在元素内部（有子元素）移动时会多次触发。
- mouseenter：当鼠标指针从一个元素的外部进入到元素的范围内时触发该事件。不同于 mouseover，mouseenter 只在第一次进入元素内部时触发一次，之后鼠标在元素内部移动不会再次触发。
- **冒泡：**
- mouseover 会冒泡，也就是说当鼠标进入子元素时，父元素的 mouseover 事件也会被触发。
- mouseenter 不冒泡；指针从元素外部进入该元素时触发，元素内部子节点之间移动不会像 mouseover 那样在祖先上产生重复委托效果。
- **应用场景：**
- mouseover 更常用于需要监听鼠标进入和离开元素的情况，特别是当需要处理子元素的情况。
- mouseenter 适合单个组件边界，mouseover 适合借助冒泡委托。需要同时支持鼠标、触控笔等输入时考虑 pointerover/pointerenter；触摸设备不能依赖 hover 完成核心操作。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover_event) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseenter_event)。

---

## Q88｜元素拖动实现方案

适用：Pointer Events；现代浏览器。

普通位置拖动推荐 Pointer Events。按下时记录指针与元素起点，setPointerCapture 保证指针离开元素后仍收到事件；移动时用 transform 更新视觉位置；pointerup、pointercancel 和 lostpointercapture 都要结束拖动。拖放文件和跨容器数据交换更适合 HTML Drag and Drop。生产组件还应提供键盘替代操作、边界限制和卸载清理。

```js
function makeDraggable(element) {
  let drag;
  element.style.touchAction = 'none';
  const stop = (event) => { if (drag?.id === event.pointerId) drag = undefined; };
  element.addEventListener('pointerdown', (event) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, tx: matrix.m41, ty: matrix.m42 };
    element.setPointerCapture(event.pointerId);
  });
  element.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    element.style.transform = `translate(${drag.tx + event.clientX - drag.x}px, ${drag.ty + event.clientY - drag.y}px)`;
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(type, stop);
}
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)。

---

## Q89｜script 标签 async 和 defer 的区别

适用：HTML Living Standard classic/module scripts。

- 经典外部 script 无属性：解析器遇到后暂停 HTML 解析，下载并执行，再继续解析。
- async：下载与解析并行，下载完成后尽快执行；执行时仍会占用主线程并可能暂停解析，多个 async 脚本不保证文档顺序。适合彼此独立脚本。
- defer：下载并行，文档解析完成后按文档顺序执行，并在 DOMContentLoaded 前完成。只对外部经典脚本有对应语义。
- type=module：默认类似 defer，模块依赖先加载；async 模块则在依赖就绪后尽快执行。模块默认严格模式。

动态插入脚本、preload、阻塞渲染属性等还有额外规则，不能用“async 完全不阻塞页面”概括。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)。

---

## Q90｜ES6 的继承和 ES5 的继承的区别

适用：现代 JavaScript class inheritance。

class/extends 仍建立在原型链上：实例方法定义在 prototype，静态方法通过构造函数的原型链继承。派生类构造器在使用 this 前必须调用 super()，类体默认严格模式，方法默认不可枚举，类不能像普通函数那样不带 new 调用。

ES5 常用寄生组合继承：在子构造函数中 Parent.call(this, ...) 初始化实例字段，再用 Object.create(Parent.prototype) 建立方法原型链，并修正 constructor。它能近似常见 class 继承，但 super、内建对象继承、new.target、私有字段等语义不能靠几行原型赋值完全复刻。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super)。

---

## Q91｜Promise

适用：ECMAScript Promise；现代 JavaScript。

Promise 表示一个异步结果，状态从 pending 只能变为 fulfilled 或 rejected 一次。then/catch/finally 返回新的 Promise；回调总以微任务方式执行。resolve 还会“吸收”thenable/Promise 的最终状态，不等于简单把对象作为 fulfilled 值保存。

Promise 不会自动取消底层操作，取消需由 AbortController 等 API 协作。创建 Promise 时 executor 同步执行，抛错会转成 rejection；未处理 rejection 应被监控。手写 Promise 必须实现 thenable 解析、循环检测和异步回调等规范细节，不能用一个状态加回调数组就宣称完整实现。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) · [资料 2](https://promisesaplus.com/)。

---

## Q92｜Promise all/allSettle/any/race 的使用场景

适用：现代 JavaScript Promise combinators。

- Promise.all：全部 fulfilled 才成功，结果保持输入顺序；任一 rejected 就快速拒绝。适合所有结果都必需的并行任务。
- Promise.allSettled：等待全部结束，返回每项 status/value/reason。适合批处理报告，不因单项失败丢失其他结果。
- Promise.any：任一 fulfilled 就成功；全部拒绝时以 AggregateError 拒绝。适合多个等价来源取首个成功。
- Promise.race：第一个 settle（成功或失败）决定结果。可用于超时竞争，但 race 本身不会取消输掉的任务。

四者都接受 iterable，并把非 Promise 值按已完成值处理。若任务函数在传入前已经调用，请求已启动；需要并发上限时应传函数并使用任务池。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) · [资料 3](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any) · [资料 4](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)。

---

## Q93｜如何解决异步回调地狱

适用：ES2017+；现代 Abort APIs。

**定义：**异步回调地狱是指在嵌套的回调函数中处理多个异步操作，导致代码变得混乱和难以维护的情况。

**解决方案：**

- **使用 Promise 对象：** Promises 出现主要为解决异步回调地狱，是一种处理异步操作的方式，它允许你链式调用 .then() 方法，以便更清晰地处理异步操作。这减少了回调嵌套的问题。
- **使用 async/await：** async/await 是 ES2017 的 Promise 语法，适合把有依赖关系的步骤写成顺序流程；独立任务应先启动再 Promise.all，避免不必要串行。
- **控制生命周期：** 使用 AbortSignal、超时、重试策略和 finally 清理资源，避免代码只是“看起来扁平”但无法取消和恢复。
- **使用库和工具：** 使用异步控制库（如Async.js）或工具（如RxJS）处理异步操作，提高代码的可读性和维护性。
- **模块化和拆分代码：** 将异步操作拆分为小的、可重用的函数或模块，在主代码中调用，减少嵌套的回调函数。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)。

---

## Q94｜链式调用实现方式

适用：现代 JavaScript（ES2015+）。

可变式链式 API 通常让每个操作方法返回 this，终结方法返回最终值。返回 this 之前要先完成状态更新；箭头函数没有动态 this，不适合直接作为依赖实例接收者的方法。不可变式 API 也可以每次返回新对象，但语义和分配成本不同。

```js
class ChainCalculator {
  constructor(value = 0) { this.value = value; }
  add(value) { this.value += value; return this; }
  multiply(value) { this.value *= value; return this; }
  result() { return this.value; }
}
```

```js
new ChainCalculator(2).add(3).multiply(4).result(); // 20
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)。

---

## Q95｜new 操作符内在逻辑

适用：现代 JavaScript [[Construct]] 语义。

普通构造过程可以概括为创建对象、把原型关联到构造函数 prototype、以该对象作为 this 调用构造函数，再依据返回值确定最终结果。若返回对象或函数，就使用返回值；返回基本值则保留创建的对象。手写 apply 版本无法调用 class，也不能完整模拟 new.target 等规则，真实动态构造应使用 Reflect.construct。

```js
const instance = Reflect.construct(Constructor, args);
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct)。

---

## Q96｜bind，apply，call 的区别，及内在实现

适用：现代 JavaScript（ES2015+）。

- call：立即调用，参数逐个传入。
- apply：立即调用，参数从数组或类数组结构传入。
- bind：返回新函数，可预置参数；普通调用使用绑定的 this，构造调用忽略绑定对象并继承目标函数原型。

教学实现优先使用 Reflect.apply/Reflect.construct，避免临时把函数挂到 thisArg 上造成属性冲突，也正确处理 null、原始值和严格模式。下面的 myApply 接受可迭代对象，和规范中的类数组细节并不完全等价；myBind 也没有复制原生函数的 length、name 等全部描述符，普通包装函数自身的 prototype 与原生绑定函数不同，因此不能作为完整 polyfill。通过 Symbol.hasInstance 将实例判断转交给目标函数，使 new Bound() instanceof Bound 和 new Target() instanceof Bound 都符合绑定函数的判断方式。

```js
function myCall(fn, thisArg, ...args) {
  if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
  return Reflect.apply(fn, thisArg, args);
}
function myApply(fn, thisArg, args = []) {
  if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
  if (args == null || typeof args[Symbol.iterator] !== 'function') throw new TypeError('args 必须可迭代');
  return Reflect.apply(fn, thisArg, [...args]);
}
function myBind(fn, thisArg, ...preset) {
  if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
  function bound(...later) {
    if (new.target) return Reflect.construct(fn, [...preset, ...later], new.target === bound ? fn : new.target);
    return Reflect.apply(fn, thisArg, [...preset, ...later]);
  }
  Object.setPrototypeOf(bound, Object.getPrototypeOf(fn));
  Object.defineProperty(bound, Symbol.hasInstance, { value: instance => instance instanceof fn });
  return bound;
}
```

```js
function sum(a, b) { return this.base + a + b; }
myCall(sum, { base: 1 }, 2, 3);      // 6
myApply(sum, { base: 2 }, [3, 4]);   // 9
myBind(sum, { base: 3 }, 4)(5);      // 12
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply) · [资料 3](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) · [资料 4](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/apply)。

---

## Q97｜Ajax 避免浏览器缓存方法

适用：HTTP 缓存语义（RFC 9111）。

Http 请求时，有时浏览器会缓存响应数据，以提高性能。但在某些情况下，你可能希望禁用缓存或控制缓存行为，以确保获得最新的数据。以下是解决浏览器缓存问题的方法：

缓存策略应由响应头按资源语义设计。Cache-Control:no-store 表示不要存储；no-cache 允许存储，但复用前必须重新验证；max-age/ETag/Last-Modified 用于新鲜度与条件请求。请求头 no-cache 通常要求沿途重新验证，不等于服务端响应永不缓存。Pragma:no-cache 主要用于旧 HTTP/1.0 兼容。

调试时添加查询参数会形成不同 URL，可以临时绕过已有缓存，但会污染缓存键，不应作为正式一致性方案。不要为了避缓存把安全、幂等的读取改成 POST；方法语义、CDN 和中间缓存行为应由 API 设计决定。开发者工具 Disable cache 也只适合诊断。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)。

---

## Q98｜eval 的功能和危害

适用：现代 JavaScript；CSP/Trusted Types 按环境。

eval 是 JavaScript 中的一个全局函数，用于将包含 JavaScript 代码的字符串作为参数，并执行该代码。它的作用是动态执行字符串中的 JavaScript 代码，可以在运行时生成 JavaScript 代码并执行它。

例如，你可以使用 eval 来执行动态生成的表达式或函数。

eval 函数具有潜在的危害，主要包括以下几个方面：

1. **安全风险：** 使用 eval 可能会导致安全漏洞，因为它允许执行来自不受信任的来源的代码。如果恶意代码被注入到 eval 中，它可能会访问和修改你的应用程序的敏感数据，甚至执行恶意操作。
2. **性能问题：**eval 的使用会导致性能下降，因为它需要在运行时解析和执行代码。这可能会影响应用程序的响应时间，特别是在循环中频繁使用 eval 的情况下。
3. **可读性问题：** 使用 eval 会使代码变得难以理解和维护。由于它执行的代码是字符串，很难进行分析和调试。
4. **移植性问题：** 依赖 eval 的代码可能不具备良好的移植性，因为不同的 JavaScript 引擎对 eval 的实现可能有差异，从而导致代码在不同环境中出现问题。
5. **限制代码优化：**eval 的存在可能会阻碍 JavaScript 引擎的代码优化，因为它使得引擎难以进行静态分析和优化，从而影响性能。

因此通常避免 eval，绝不能执行不可信输入。Function 构造器同样执行字符串代码，并不是安全替代；应优先解析明确的数据格式、使用映射表/解释器或受隔离 sandbox。直接 eval 还能访问当前词法作用域，间接 eval/Function 通常在全局作用域执行，具体差异也会影响安全和优化。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function)。

---

## Q99｜惰性函数

适用：现代 JavaScript 闭包与惰性初始化。

惰性初始化指第一次真正需要时才计算或创建资源，并缓存结果；一种写法是闭包缓存，另一种是首次调用后重写外部函数变量。闭包缓存通常更容易保持已有引用一致：若其他地方已经保存旧函数引用，自重写变量不会改变那份引用。还要定义失败是否缓存、并发调用如何合并、何时失效，以及缓存是否会长期占用资源。

```js
function lazy(factory) {
  let ready = false, value;
  return () => {
    if (!ready) { value = factory(); ready = true; }
    return value;
  };
}
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)。

---

## Q100｜JS 监听对象属性的改变

适用：现代 JavaScript Proxy/Reflect。

Object.defineProperty 可给特定属性设置 getter/setter；Proxy 可拦截对象的多种操作，包括赋值、删除和属性访问。代理只观察通过代理发生的操作，绕过代理直接改原对象不会通知。嵌套对象需要递归包装或按需包装；依赖收集还需要单独的 track/trigger 机制，参考 Q147。

```js
const observed = new Proxy({ count: 0 }, {
  set(target, key, value, receiver) {
    const old = target[key]; const ok = Reflect.set(target, key, value, receiver);
    if (ok && !Object.is(old, value)) console.log(key, value);
    return ok;
  }
});
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)。

---

## Q101｜prototype  和  \_\_proto\_\_  的 区别与关系

适用：ECMAScript 2024；严格模式与 ES 模块。

prototype 是部分函数对象的普通属性，用作 new 创建实例时的原型候选；箭头函数、普通方法、async 函数通常没有自己的 prototype。生成器函数可以有 prototype 却不可 new，因此不能只靠这个属性判断可构造性。

对象的 [[Prototype]] 是内部原型链接，应使用 Object.getPrototypeOf 读取。Object.prototype.__proto__ 是历史访问器，可能被遮蔽，无原型对象也不继承它。普通构造情形满足 Object.getPrototypeOf(new Person()) === Person.prototype；函数 Person 自己的原型通常是 Function.prototype，两条关系不要混淆。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/prototype)。

---

## Q102｜原型链的实践 - 以下代码输出2的原因

适用：ECMAScript ES2019+；V8 12.4.254 排序源码；浏览器 HTML 事件循环。

补充如下完整、可复制案例解释原题“先输出 2、删除实例属性后输出 3”的场景；这是明确给定程序的结果，不推定缺失截图中的代码。

```js
function Foo() { this.a = () => 2; }
Foo.prototype.a = function () { return 3; };
Foo.a = () => 1;
const foo = new Foo();
console.log(foo.a()); // 2：实例自有属性
delete foo.a;
console.log(foo.a()); // 3：沿原型查找
console.log(Foo.a()); // 1：构造函数自身属性
```

实例查找先检查自有属性，再沿 [[Prototype]] 继续；Foo.a 是函数对象自己的属性，不在 foo 的通常原型链上。赋值顺序、构造函数显式返回对象等变化都可能改变结果。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain)。

---

## Q103｜如何理解 箭头函数 没有 this

适用：现代 JavaScript arrow functions。

箭头函数不创建自己的 this、arguments、super 或 new.target，而是从定义位置的词法环境解析；call/apply/bind 不能改写它捕获的 this，箭头函数也不能作为构造器。它适合在已有方法内部创建回调以保留外层 this，但直接把箭头函数写成对象字面量方法时，它不会自动把该对象当作 this。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)。

---

## Q104｜上下文与 this 指向

适用：现代 JavaScript this 绑定。

普通函数的 this 主要由调用方式决定：obj.fn() 的接收者是 obj，call/apply/bind 可指定接收者，new 为构造调用创建接收者。独立调用在严格模式下 this 为 undefined。箭头函数不创建自己的 this，而是从定义位置的词法环境取得。对象把方法传给回调时会失去原接收者，应显式绑定或包一层函数。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)。

---

## Q105｜上下文与 this 指向 （1）

适用：ES modules 严格模式示例。

原导入内容没有完整代码，以下独立示例说明“方法被取出后丢失接收者”。obj.read() 返回 1；把 read 赋给变量再独立调用，在 ES module 的严格模式下 this 是 undefined，访问 this.value 会抛错。bind 返回固定接收者的新函数，不能依靠变量名字决定 this。

```js
const obj = { value: 1, read() { return this.value; } };
const read = obj.read;
obj.read(); // 1
obj.read.bind(obj)(); // 1
// read(); // 严格模式下 TypeError
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)。

---

## Q106｜上下文与 this 指向（2）

适用：现代 JavaScript 词法 this。

原题未保留完整代码，以下示例展示普通方法内创建的箭头函数继承方法调用时的 this。bind/call 无法改写箭头函数已经捕获的 this。若直接把箭头函数写成对象字面量属性，它捕获的是外层环境而不是该对象。

```js
const obj = { value: 2, make() { return () => this.value; } };
const read = obj.make();
read.call({ value: 9 }); // 2
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)。

---

## Q107｜去除字符串首尾空格

适用：ECMAScript 2024；严格模式与 ES 模块。

trim() 返回去掉字符串两端规范空白及行终止符的新字符串；trimStart/trimEnd 只处理一端，不修改原字符串，也不删除中间空白。

```js
const text = "  hello world\n";
console.log(text.trim()); // "hello world"
console.log(text.length > text.trim().length); // true
```

它不等于去掉全部 Unicode 不可见字符，replace(/\s/g, "") 则会连中间空白一起删除。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim)。

---

## Q108｜Symbol 特性与作用

适用：现代 JavaScript Symbols。

Symbol 是原始类型；Symbol('x') 每次创建唯一值，Symbol.for('x') 使用全局注册表复用同一 key。Symbol 可作属性键，避免与普通字符串键冲突；for...in、Object.keys、JSON.stringify 忽略 Symbol 键，但 Reflect.ownKeys/Object.getOwnPropertySymbols 可读取，Object.assign 还会复制可枚举 Symbol 属性，所以“Symbol 属性不可枚举”并不准确。

内置 well-known symbols（如 Symbol.iterator、Symbol.toPrimitive、Symbol.hasInstance）用于定制语言协议。Symbol 适合唯一标识和协议扩展，但不是安全私有字段；私有状态应使用 #private、闭包或 WeakMap。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys)。

---

## Q109｜String 的 startwith 和 indexof 两种方法的区别

适用：现代 JavaScript String UTF-16 索引。

正确方法名是 startsWith。startsWith(search, position) 判断从指定 UTF-16 索引开始是否以前缀开头，返回布尔值，并拒绝正则表达式参数；indexOf(search, fromIndex) 从位置起查找第一次出现，返回索引或 -1。

```js
'javascript'.startsWith('script', 4); // true
'javascript'.indexOf('script', 0);    // 4
```

两者都区分大小写，索引按 UTF-16 code units 计算，不是用户可见字素簇。只判断前缀用 startsWith 更直接，不要写 indexOf(x) === 0 降低语义清晰度。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf)。

---

## Q110｜字符串转数字的方法

适用：现代 JavaScript 数字转换。

Number 要求整体可转换，parseInt/parseFloat 可以解析开头的数值片段。parseInt 应明确进制；空字符串经 Number 转换为 0，而非法整体返回 NaN。用 Number.isNaN 判断结果是否是 NaN，用 Number.isSafeInteger 检查整数精度；超大整数可在合法输入下使用 BigInt。

```js
Number('12px'); // NaN
parseInt('12px', 10); // 12
parseFloat('3.5rem'); // 3.5
Number(''); // 0
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt)。

---

## Q111｜promise 和 await/async 的关系

适用：ES2017+ async/await。

- Promise：一种用于处理异步操作的对象，它代表了一个异步操作的最终完成或失败，并允许在异步操作完成后执行相关的代码。Promise提供了一种更灵活的方式来管理异步代码，尤其是在处理多个异步操作的情况下。
- async/await：一种构建在Promise之上的语法糖。它是 ECMAScript 2017 (ES8) 引入的特性，旨在简化异步代码的编写和理解。async 函数返回一个Promise，允许在函数内使用 await 关键字等待异步操作完成。

**关系：**

- async 函数调用总返回 Promise；return 值成为 fulfilled 值，抛错成为 rejection。
- await 接受任意值：普通值按已完成 Promise 处理，thenable 会被同化。它只暂停当前 async 函数，控制权返回调用者，后续代码通过微任务恢复，不会阻塞线程。
- await 到 rejection 会抛出原因，需要 try/catch 或让 async 函数返回 rejected Promise。
- 多个独立操作逐个 await 会串行，应先启动后 Promise.all；有依赖关系的步骤才顺序 await。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)。

---

## Q112｜Array.prototype.sort 在 V8 的实现机制

适用：ECMAScript ES2019+；V8 12.4.254 排序源码；浏览器 HTML 事件循环。

规范要求 Array.prototype.sort 自 ES2019 起稳定；默认比较按字符串的 UTF-16 序列，数值排序通常提供 (a,b) => a-b。sort 原地修改数组，undefined 与空槽还有单独处理规则，TypedArray.sort 默认数值排序不同。

源码分析固定 V8 12.4.254：array-sort.tq 使用稳定、自适应的 TimSort 思路，包含短 run 的插入排序与 run 合并。算法和阈值是实现细节，旧版快排分界不能当现代规则，也不能把稳定性起点粗略写成 V8 7.6。

```js
const items = [{ group: 1, id: "a" }, { group: 1, id: "b" }];
items.sort((a, b) => a.group - b.group);
console.log(items.map(x => x.id)); // ["a", "b"]
```

比较器要满足一致性与反对称/传递等契约，不应用随机数或布尔值比较器。

![](./images/interview/大前端面试宝典-image-26.png)

![](./images/interview/大前端面试宝典-image-24.png)

参考：[资料 1](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array.prototype.sort) · [资料 2](https://github.com/v8/v8/blob/12.4.254/third_party/v8/builtins/array-sort.tq) · [资料 3](https://v8.dev/blog/array-sort)。

---

## Q113｜JS 装箱机制（auto boxing）

适用：ECMAScript 2024；严格模式与 ES 模块。

访问原始值属性时，除 null/undefined 外，可以通过对应包装类型的原型使用方法；这不会把变量永久变为包装对象。给原始值新增普通属性不会持久保存：非严格脚本中赋值通常被忽略，严格模式和 ES 模块中会抛 TypeError。

```js
"use strict";
const value = "abc";
console.log(value.toUpperCase()); // ABC
try { value.extra = 1; } catch (error) {
  console.log(error instanceof TypeError); // true
}
console.log(typeof value); // string
console.log(typeof new String(value)); // object
```

业务代码直接使用原始值；包装对象参与相等、布尔判断和对象身份比较时有不同语义。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#cant_assign_to_properties_on_primitives)。

---

## Q114｜函数传值

适用：ECMAScript 参数按值传递。

ECMAScript 参数按值传递。传对象时，复制的是一个能引用同一对象的值，因此函数内修改对象属性对调用者可见；把形参重新赋成另一个对象，只改变局部绑定。称为“传地址”容易被误解为 C/C++ 指针或按引用传参，更准确的说法是对象引用值本身按值复制。

```js
function update(item) { item.count++; item = { count: 0 }; }
const state = { count: 1 };
update(state);
console.log(state.count); // 2
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) · [资料 2](https://tc39.es/ecma262/)。

---

## Q115｜不同类型宏任务的优先级

适用：ECMAScript ES2019+；V8 12.4.254 排序源码；浏览器 HTML 事件循环。

浏览器事件循环有多个 task source，规范没有一张“点击任务永远先于 timer”的统一优先级表。主线程阻塞时用户交互也不能运行；解除阻塞后具体 task queue 的选择由浏览器策略与就绪时间影响。原题缺少完整代码与点击时间，固定 click → timer 的结论应删除。

```js
console.log("sync");
setTimeout(() => console.log("timer"), 0);
queueMicrotask(() => console.log("microtask"));
// 本段普通脚本输出 sync、microtask、timer。
```

这段只验证当前任务结束后微任务检查点先于后续 timer 任务，不证明不同任务源之间的全局顺序。评估交互卡顿应看长任务和事件时延，不应人为阻塞五秒作为业务实现。

参考：[资料 1](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)。

---

## Q116｜console.log  被重写，重新获取的方法

适用：现代浏览器 Console API/DevTools。

最可靠的做法是在被覆盖前保存已绑定的引用，例如 const log=console.log.bind(console)。如果原引用已经丢失，没有一个跨环境通用的“恢复原方法”接口；可以刷新隔离的开发页面，或在开发工具中检查覆盖来源。新 iframe 的 console 属于另一个 realm，受沙箱和跨源限制，也不应成为线上依赖。

```js
const originalLog = console.log.bind(console);
console.log = () => {};
originalLog("仍可输出");
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/console/log_static) · [资料 2](https://developer.chrome.com/docs/devtools/console/)。

---

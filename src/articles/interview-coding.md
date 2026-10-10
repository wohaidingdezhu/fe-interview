---
id: "interview-coding"
title: "代码编程与算法题"
category: "算法与手写"
description: "收录 Q123–Q158 的参考答案、原理说明与配图。"
kind: "手写题解"
tags: ["JavaScript","算法","手写题"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 103
status: draft
quality: complete
sources: ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference","https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm"]
technologyVersion: "现代 JavaScript；浏览器 API 按兼容性使用"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference) · [参考 2](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)。


### 功能程序题

---

## Q123｜拓扑排序-求模块依赖关系

适用：有向无环图拓扑排序；现代 JavaScript。

将依赖关系表示为“模块 → 它依赖的模块”。先输出入度为零的模块，再减少依赖它的模块的入度，即 Kahn 算法。重复依赖需要去重，没有显式条目的叶节点也应加入图。若处理的节点数不足，说明存在循环依赖，应报错而不是返回一个看似可用的部分顺序。时间和空间复杂度均为 O(V + E)。

```js
function topologicalSort(dependencies) {
  const nodes = [...new Set([...Object.keys(dependencies), ...Object.values(dependencies).flat()])];
  const degree = new Map(nodes.map((node) => [node, 0]));
  const next = new Map(nodes.map((node) => [node, []]));
  for (const [node, deps] of Object.entries(dependencies)) for (const dep of new Set(deps)) {
    degree.set(node, degree.get(node) + 1); next.get(dep).push(node);
  }
  const queue = nodes.filter((node) => degree.get(node) === 0), result = [];
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head]; result.push(node);
    for (const child of next.get(node)) { degree.set(child, degree.get(child) - 1); if (degree.get(child) === 0) queue.push(child); }
  }
  if (result.length !== nodes.length) throw new Error('存在循环依赖');
  return result;
}
```


```js
topologicalSort({ app: ['api'], api: ['core'] }); // ['core', 'api', 'app']
```

参考：[资料 1](https://en.wikipedia.org/wiki/Topological_sorting)。

---

## Q124｜求笛卡尔积

适用：有限集合笛卡尔积；现代 JavaScript。

从一个空组合开始，每一轮把下一组中的每个元素追加到已有组合。输入包含空组时结果为空；没有组时约定结果为包含空元组的数组。结果数量是各组长度的乘积，组合较多时应使用生成器分批消费，避免一次占满内存。

```js
function cartesianProduct(groups) {
  return groups.reduce((result, group) => result.flatMap((prefix) => group.map((value) => [...prefix, value])), [[]]);
}
```


```js
cartesianProduct([[1, 2], ['a', 'b']]); // [[1,'a'], [1,'b'], [2,'a'], [2,'b']]
```

参考：[资料 1](https://en.wikipedia.org/wiki/Cartesian_product)。

---

## Q125｜并发任务控制

适用：现代 JavaScript Promise 任务池。

任务必须传入函数，例如 () => fetch(url)，不能先创建全部请求的 Promise，否则请求已经同时开始。启动 n 个 worker；每个 worker 等待自己的任务结束后立即取下一项。失败也释放槽位，返回值采用 allSettled 风格并保留输入顺序。真实项目还应为请求增加超时、取消和重试策略；本例不自动重试。

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
await limitRequests(urls.map(url => () => fetch(url)), 3);
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)。

---

## Q126｜多维数组降为一维（数组打平）

适用：现代 JavaScript Array.flat。

已知有限数组可以使用 flat(Infinity)，它返回新数组，不改变原数组，且会移除被展开层级中的空槽。深度不确定或数据量巨大时，可以用显式栈实现遍历，避免递归栈溢出。不要用字符串拼接再 split，因为它会破坏数字、对象、空字符串等元素类型。

```js
const result = [1, [2, [3]], 4].flat(Infinity); // [1, 2, 3, 4]
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat)。

---

## Q127｜找到页面所有 a标签的 href 属性

适用：现代 DOM/HTMLAnchorElement。

querySelectorAll 获取当前文档的静态节点列表。getAttribute("href") 返回写在属性里的原始值；元素的 href 属性通常返回解析后的绝对 URL，二者需要按题意选择。后续新增的链接不会自动进入这个快照。

```js
const original = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
const absolute = [...document.querySelectorAll('a[href]')].map(a => a.href);
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement/href)。

---

## Q128｜如何给按钮绑定两个事件

适用：现代 DOM EventTarget。

同一按钮可以通过 addEventListener 注册多个不同的监听函数，依注册顺序在相应阶段执行。连续设置 onclick 会覆盖前一次赋值。相同类型、相同函数和相同 capture 的重复注册不会产生两个监听器，移除时也必须保留函数引用。

```js
function first() { console.log('第一个'); }
function second() { console.log('第二个'); }
button.addEventListener('click', first);
button.addEventListener('click', second);
button.removeEventListener('click', first);
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)。

---

## Q129｜实现拖拉拽功能

适用：现代 Pointer Events。

拖动组件可使用 Pointer Events，同时兼容鼠标、触摸和笔。按下时记录初始指针和元素位置，用 setPointerCapture 保证离开元素后仍能收到移动事件；抬起、取消或失去捕获时停止。实际产品还需键盘移动方式、边界限制及卸载清理。以下适用于 position:absolute 的元素，父容器需要 position:relative。

```js
let start;
box.style.touchAction = 'none';
box.addEventListener('pointerdown', e => {
  start = { id: e.pointerId, x: e.clientX, y: e.clientY, left: box.offsetLeft, top: box.offsetTop };
  box.setPointerCapture(e.pointerId);
});
box.addEventListener('pointermove', e => {
  if (!start || start.id !== e.pointerId) return;
  box.style.left = `${start.left + e.clientX - start.x}px`;
  box.style.top = `${start.top + e.clientY - start.y}px`;
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  box.addEventListener(type, e => { if (start?.id === e.pointerId) start = undefined; });
}
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)。

---

## Q130｜原地打乱数组（数组洗牌）

适用：Fisher–Yates；Math.random 不用于安全随机。

Fisher–Yates 从末尾向前遍历，每次在尚未处理的区间均匀选一个位置交换。假设随机源均匀，每种排列等概率；时间 O(n)，额外空间 O(1)，会修改原数组。Math.random 不适合安全抽奖或密码用途。

```js
function shuffle(values, random = Math.random) {
  for (let i = values.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]]; }
  return values;
}
```


```js
shuffle([1, 2, 3]);
```

参考：[资料 1](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)。

---

## Q131｜不能用 Array.sort 方法来打乱数组的原因

适用：现代 JavaScript sort；均匀洗牌使用 Fisher–Yates。

sort(() => Math.random() - 0.5) 不能保证等概率洗牌：比较器不满足排序所要求的一致性，不同排序算法和引擎可能得到不同偏差。无法概括为“有 50% 概率保持不变”。应使用 Q130 的 Fisher–Yates，若不想修改原数组，先对数组做浅拷贝。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) · [资料 2](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)。

---

## Q132｜对象深拷贝

适用：现代 structured clone；教学实现仅普通对象/数组。

优先了解 structuredClone 的支持范围：它可处理循环引用、Map、Set 等，但不能复制函数，并不保留任意对象的原型和所有属性描述符。以下手写示例刻意仅支持普通对象与数组，通过 WeakMap 同时保留循环和共享引用，通过描述符避免主动执行 getter。函数保留原引用；Map、Date、DOM 节点等对象会报错，不是通用克隆库。

```js
function clonePlain(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new TypeError('示例仅支持普通对象和数组');
  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value)); seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if ('value' in descriptor) descriptor.value = clonePlain(descriptor.value, seen);
    Object.defineProperty(copy, key, descriptor);
  }
  return copy;
}
```


```js
const a = { child: { value: 1 } }; a.self = a;
const b = clonePlain(a);
console.log(b !== a, b.self === b); // true true
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)。

---

## Q133｜判断对象是否存在循环引用

适用：现代 JavaScript 对象图遍历。

“重复访问同一对象”不一定是循环：两个属性共享一个对象也会重复访问。检测时区分当前递归路径 visiting 与已完成节点 finished，只有重新走到当前路径中的节点才是环。本例检查自身数据属性构成的图，不执行 getter、不遍历 Map/Set 的内部条目；极深结构需改为显式栈。

```js
function hasCycle(value, visiting = new WeakSet(), finished = new WeakSet()) {
  if (!value || typeof value !== 'object') return false;
  if (visiting.has(value)) return true;
  if (finished.has(value)) return false;
  visiting.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if ('value' in descriptor && hasCycle(descriptor.value, visiting, finished)) return true;
  }
  visiting.delete(value); finished.add(value); return false;
}
```


```js
const shared = {};
hasCycle({ a: shared, b: shared }); // false
shared.self = shared; hasCycle(shared); // true
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)。

---

## Q134｜实现一个柯里化函数 add

适用：现代 JavaScript（ES2015+）。

这个题目的调用参数个数没有结束标记，因此不能像固定参数柯里化那样自动返回数字；做法是始终返回同一个收集函数，并通过 valueOf、toString 和 Symbol.toPrimitive 暴露累计值。实现只接受有限数字，避免字符串拼接、NaN 或 Infinity 让结果失去数值语义。收集函数内部状态可变，不应从同一个中间结果分叉成两条独立计算链。

```js
function add(...initialValues) {
  const sum = (values) => values.reduce((total, value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError('add 只接受有限数字');
    return total + value;
  }, 0);
  let total = sum(initialValues);
  function collect(...values) { total += sum(values); return collect; }
  Object.defineProperties(collect, {
    valueOf: { value: () => total },
    toString: { value: () => String(total) },
    [Symbol.toPrimitive]: { value: () => total },
  });
  return collect;
}
```

```js
add(1, 2, 3).valueOf(); // 6
add(1, 2)(3)(4, 5).valueOf(); // 15
add(1)(2)(3)(4, 5, 6)(7).valueOf(); // 28
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive)。

---

## Q135｜通用柯里化高阶方法

适用：现代 JavaScript 函数柯里化教学实现。

将多参数调用转为逐步收集参数，累计达到指定 arity 时执行原函数。fn.length 遇到默认参数、剩余参数时未必等于实际所需参数数目，因此允许显式传入 arity。本例支持一次传入多个参数，不支持占位符；this 来自最终执行的那次调用。

```js
function curry(fn, arity = fn.length) {
  function collect(previous) { return function (...args) { const all = [...previous, ...args]; return all.length >= arity ? fn.apply(this, all) : collect(all); }; }
  return collect([]);
}
```


```js
curry((a, b, c) => a + b + c)(1)(2, 3); // 6
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length)。

---

## Q136｜字符串 "abcde" 如何反转

适用：现代 JavaScript；字素簇使用 Intl.Segmenter。

对题目中的 ASCII 字符串可直接转换成数组再反转。扩展运算符按 Unicode 码点迭代，能保留多数单个 emoji，但不能保证组合字符和家庭 emoji 的完整性。用户可见字符需要用 Intl.Segmenter 按字素簇分段后再反转。

```js
const simple = [...'abcde'].reverse().join(''); // edcba
const segmenter = new Intl.Segmenter('zh', { granularity: 'grapheme' });
const reverse = text => [...segmenter.segment(text)].map(x => x.segment).reverse().join('');
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse)。

---

## Q137｜实现一个防抖函数

适用：现代 JavaScript；浏览器定时器 API。

防抖把一串连续触发合并为停止触发后的最后一次执行。下面是 trailing-only 版本：保存最后一次调用的 this 和参数，并提供 cancel 与 flush。定时器触发的返回值无法同步交给最初调用者；flush 可立即执行待处理调用并取得结果。组件卸载、请求切换等场景应调用 cancel，避免过期副作用。

```js
function debounce(fn, wait) {
  if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
  if (!Number.isFinite(wait) || wait < 0) throw new RangeError('wait 必须是非负有限数字');
  let timer, context, args, result;
  function invoke() {
    const currentContext = context, currentArgs = args;
    timer = context = args = undefined;
    result = fn.apply(currentContext, currentArgs);
    return result;
  }
  function debounced(...nextArgs) {
    context = this; args = nextArgs;
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(invoke, wait);
    return result;
  }
  debounced.cancel = () => { if (timer !== undefined) clearTimeout(timer); timer = context = args = undefined; };
  debounced.flush = () => { if (timer === undefined) return result; clearTimeout(timer); return invoke(); };
  return debounced;
}
```

```js
const search = debounce((keyword) => console.log(keyword), 300);
search('rea'); search('react'); // 停止输入 300ms 后只输出 react
```

![](./images/interview/大前端面试宝典-diagram-4.png)

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Window/clearTimeout)。

---

## Q138｜实现一个截流函数

适用：现代 JavaScript；浏览器定时器 API。

通常称为“节流”。它保证高频触发期间每个时间窗口最多执行一次。下面采用 leading + trailing 语义：窗口开始立即执行首个调用，窗口结束再执行期间最后一次调用；连续调用始终保留最新 this 和参数。cancel 会同时取消尾调用并重置窗口。若业务只允许 leading 或 trailing，需要把选项作为明确 API，而不是含糊地修改定时器。

```js
function throttle(fn, wait) {
  if (typeof fn !== 'function') throw new TypeError('fn 必须是函数');
  if (!Number.isFinite(wait) || wait < 0) throw new RangeError('wait 必须是非负有限数字');
  let last, timer, context, args, result;
  function invoke(time) {
    last = time;
    const currentContext = context, currentArgs = args;
    timer = context = args = undefined;
    result = fn.apply(currentContext, currentArgs);
    return result;
  }
  function throttled(...nextArgs) {
    const now = Date.now(), remaining = last === undefined ? 0 : wait - (now - last);
    context = this; args = nextArgs;
    if (remaining <= 0 || remaining > wait) {
      if (timer !== undefined) clearTimeout(timer);
      return invoke(now);
    }
    if (timer === undefined) timer = setTimeout(() => invoke(Date.now()), remaining);
    return result;
  }
  throttled.cancel = () => { if (timer !== undefined) clearTimeout(timer); last = undefined; timer = context = args = undefined; };
  return throttled;
}
```

```js
const reportScroll = throttle(() => console.log(window.scrollY), 200);
window.addEventListener('scroll', reportScroll);
```

![](./images/interview/大前端面试宝典-diagram-5.png)

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now)。

---

## Q139｜实现一个方法，能上传多张图片，保持单次 n 张上传，n 张里如果有 1 张已经上传成功，然后就补上 1 张，就一直维持n 张图片同时在上传。

适用：现代 Fetch/FormData；并发池复用 Q125。

复用 Q125 的 limitRequests，每张图片包装成尚未开始的上传任务。worker 完成一张就补下一张，不需要等同一批全部完成。FormData 的 Content-Type 应交给浏览器设置，否则可能缺少 multipart boundary。失败项保留在结果中，重试时只选失败项，避免重复上传。

```js
const tasks = files.map(file => async () => {
  const data = new FormData(); data.append('file', file);
  const response = await fetch('/upload', { method: 'POST', body: data });
  if (!response.ok) throw new Error(`上传失败 ${response.status}`);
  return response.json();
});
const results = await limitRequests(tasks, 3);
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/FormData) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)。

---

## Q140｜获取当前日期（年-月-日 时:分:秒）

适用：现代 JavaScript Date/Intl。

题目格式使用本地时区，通过 getFullYear/getMonth/getDate 等方法取得各部分，月份从零开始，其他字段需要补两位。toISOString 输出 UTC 时间，不应直接截取后冒充本地时间。若业务规定某个时区，应使用 Intl.DateTimeFormat 的 timeZone 而非用户电脑的默认时区。

```js
function formatLocal(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)。

---

## Q141｜实现一个 once 函数，传入函数参数只执行一次

适用：现代 JavaScript 闭包。

通过闭包缓存是否执行过及返回值，并保留调用的 this 与参数。本例同步抛错后允许重试；成功返回的 Promise 会被缓存，即使后续拒绝也不会自动重试。先标记执行状态可以防止重入导致重复执行，但重入时结果尚未计算完成，会返回 undefined。这些语义应在面试中说清楚。

```js
function once(fn) {
  let called = false, value;
  return function (...args) {
    if (!called) { called = true; try { value = fn.apply(this, args); } catch (error) { called = false; throw error; } }
    return value;
  };
}
```


```js
let count = 0; const run = once(() => ++count);
run(); run(); // count 为 1
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply)。

---

## Q142｜实现一个私有变量，用 get 、set 可以访问，不能直接访问。

适用：现代 JavaScript private fields/accessors。

闭包中的变量不作为返回对象的属性暴露，外部只能通过提供的方法访问。类也可以使用 #value 私有字段，它与“以下划线命名”不同，后者只是约定。set 应按业务需要校验输入；私有字段用于封装，不是对运行环境中恶意代码的安全隔离。

```js
function createCell(initial) {
  let value = initial;
  return { get: () => value, set: next => { value = next; } };
}
const cell = createCell(1); cell.set(2); console.log(cell.get()); // 2
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_elements) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get)。

---

## Q143｜将原生的 ajax 封装成 promise

适用：现代 XMLHttpRequest/Promise。

Promise 封装 XHR 时必须同时处理 HTTP 错误、网络错误、超时和取消。onload 只说明传输完成，不表示状态码成功。以下示例返回响应文本，跨域仍受浏览器 CORS 约束，并不会因为套一层 Promise 而获得跨域能力。

```js
function request(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); xhr.open('GET', url); xhr.timeout = timeout;
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(xhr.responseText) : reject(new Error(`HTTP ${xhr.status}`));
    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.ontimeout = () => reject(new Error('请求超时'));
    xhr.onabort = () => reject(new Error('请求取消'));
    xhr.send();
  });
}
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)。

---

## Q144｜实现 sleep 效果

适用：现代浏览器 timers/Promise。

sleep 通常指异步等待，让当前 async 函数暂停，而不是阻塞浏览器线程。setTimeout 的时间是最早调度时间，页面后台限速或主线程忙碌时可能更晚。不要用 while 循环忙等待，它会阻塞输入、绘制和所有后续任务。

```js
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
await sleep(1000); // 约一秒后继续
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)。

---

## Q145｜实现下载图片功能

适用：现代浏览器 Blob URL/download；跨源受策略限制。

同源图片可用带 download 的链接；跨域图片不一定支持 download 属性。需要自定义文件名时，可以在服务器允许 CORS 的前提下 fetch 得到 Blob，创建对象 URL，触发下载后再回收。大文件宜由服务端提供下载响应，避免整份文件进入客户端内存。

```js
async function downloadImage(url, filename) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blobURL = URL.createObjectURL(await response.blob());
  const a = document.createElement('a'); a.href = blobURL; a.download = filename;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(blobURL), 1000);
}
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#download)。

---

## Q146｜实现前端添加水印

适用：现代 Canvas/CSS；水印不是安全防护。

可用 Canvas 画透明文字小图，转成 data URL 后作为固定覆盖层的重复背景。覆盖层应 pointer-events:none、aria-hidden=true，以免妨碍点击和阅读辅助工具。前端水印可被用户移除，不能作为不可篡改凭据；敏感文件需要服务端生成嵌入水印，并考虑导出和打印。

```js
const canvas = document.createElement('canvas'); canvas.width = 240; canvas.height = 140;
const ctx = canvas.getContext('2d'); ctx.translate(30, 95); ctx.rotate(-Math.PI / 6);
ctx.font = '18px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillText('示例水印', 0, 0);
const layer = document.createElement('div'); layer.setAttribute('aria-hidden', 'true');
Object.assign(layer.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9999', backgroundImage: `url(${canvas.toDataURL()})` });
document.body.append(layer);
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events)。

---

## Q147｜实现响应式数据 + 依赖收集

适用：现代 JavaScript Proxy；教学依赖收集模型。

响应式依赖收集通常由“当前正在执行的 effect”与“对象、属性 → effect 集合”的映射完成。Proxy 的 get 收集依赖，set 在值变化时触发依赖。Promise 用于异步结果，不能替代依赖收集。下面是只有一个对象、一个订阅函数的教学示例；生产实现还需嵌套 effect 栈、分支依赖清理、去重调度和停止订阅。

```js
let activeEffect; const dependencies = new Map();
const state = new Proxy({ count: 0 }, {
  get(target, key, receiver) {
    if (activeEffect) {
      if (!dependencies.has(key)) dependencies.set(key, new Set());
      dependencies.get(key).add(activeEffect);
    }
    return Reflect.get(target, key, receiver);
  },
  set(target, key, value, receiver) {
    const old = Reflect.get(target, key, receiver);
    const ok = Reflect.set(target, key, value, receiver);
    if (ok && !Object.is(old, value)) for (const fn of [...(dependencies.get(key) ?? [])]) fn();
    return ok;
  }
});
function effect(fn) {
  const run = () => { activeEffect = run; try { fn(); } finally { activeEffect = undefined; } };
  run();
}
effect(() => console.log(state.count)); state.count++;
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) · [资料 2](https://vuejs.org/guide/extras/reactivity-in-depth.html)。

---

## Q148｜手动实现一个 instanceOf 方法

适用：现代 JavaScript instanceof。

普通 instanceof 可以沿对象原型链寻找构造函数的 prototype。以下是这种常见情况的教学实现，基本值直接返回 false。原生语义还涉及 Symbol.hasInstance、自定义构造函数、绑定函数和跨 realm，示例没有完整实现这些规则；实际业务应使用原生操作符或按需求使用 Array.isArray。

```js
function myInstanceOf(value, Constructor) {
  if (typeof Constructor !== 'function' || !Constructor.prototype || typeof Constructor.prototype !== 'object') throw new TypeError('右侧需要具有对象原型的构造函数');
  if (value === null || !['object', 'function'].includes(typeof value)) return false;
  let prototype = Object.getPrototypeOf(value);
  while (prototype !== null) { if (prototype === Constructor.prototype) return true; prototype = Object.getPrototypeOf(prototype); }
  return false;
}
```


```js
myInstanceOf([], Array); // true
myInstanceOf(1, Number); // false
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance)。

---

## Q149｜还原一棵树

适用：通用树构建；现代 JavaScript Map。

题目必须先约定输入格式：这里用 id、parentId，null/undefined 表示根，返回森林，避免假设一定只有一个根。先建立 Map，再连接父子节点，允许父节点在子节点之后出现。重复 ID、缺失父节点和环均报错。时间和额外空间 O(n)，不会修改原始条目。

```js
function toTree(items) {
  const map = new Map();
  for (const item of items) { if (map.has(item.id)) throw new Error('重复节点'); map.set(item.id, { ...item, children: [] }); }
  const roots = [];
  for (const item of items) {
    const node = map.get(item.id);
    if (item.parentId == null) roots.push(node);
    else { const parent = map.get(item.parentId); if (!parent) throw new Error('父节点不存在'); parent.children.push(node); }
  }
  const visited = new Set();
  const stack = [...roots];
  while (stack.length) { const node = stack.pop(); if (visited.has(node.id)) throw new Error('存在环'); visited.add(node.id); stack.push(...node.children); }
  if (visited.size !== items.length) throw new Error('存在循环父子关系');
  return roots;
}
```


```js
toTree([{ id: 2, parentId: 1 }, { id: 1, parentId: null }]);
```

参考：[资料 1](https://en.wikipedia.org/wiki/Tree_(data_structure)) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)。

---

## Q150｜实现 b 函数，使得 b.then 中能打印出 cb 的参数值

适用：现代 JavaScript（ES2015+）。

题目的关键是让 b 返回 Promise，并把 Promise 的 resolve/reject 交给回调。回调调用 resolve(value) 后，then 就能收到同一个 value。Promise 只采用第一次 settle；回调同步抛错时需要转成 reject。若回调使用 Node 风格 callback(error, value)，接口签名应另行适配，不能和这里的 register(resolve, reject) 混用。

```js
function fromCallback(register) {
  if (typeof register !== 'function') return Promise.reject(new TypeError('register 必须是函数'));
  return new Promise((resolve, reject) => {
    try { register(resolve, reject); }
    catch (error) { reject(error); }
  });
}
```

```js
const cb = (resolve) => resolve(Math.random());
const b = fromCallback(cb);
b.then((value) => console.log(value));
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise)。

---

## Q151｜实现一个 set 方法，支持根据路径设置对象的属性值。

适用：现代 JavaScript；原型污染防护。

先把点路径和方括号路径解析为片段，保留引号键中的点，逐层创建自有对象或数组，最后写入目标值。仅读取自有数据属性，拒绝访问器，避免触发继承对象修改。字符串语法支持单/双引号键但不支持反斜杠转义；更复杂字段直接传路径数组。语法先整体验证，但中途遇到只读属性等错误不提供事务回滚。实现必须拒绝 __proto__、prototype、constructor 等危险片段，避免把用户输入路径变成原型污染入口；若中间节点已经存在但不是对象，也不应静默覆盖。

```js
function setByPath(target, path, value) {
  if (!target || typeof target !== 'object') throw new TypeError('target 必须是对象');
  const parts = [];
  if (Array.isArray(path)) {
    for (const part of path) {
      if (typeof part !== 'string' && typeof part !== 'number') throw new TypeError('路径段必须是字符串或数字');
      parts.push(String(part));
    }
  } else {
    if (typeof path !== 'string') throw new TypeError('path 必须是字符串或数组');
    const token = /([\w$]+)|\[(?:"([^"\\]*)"|'([^'\\]*)'|(\d+))\]/y;
    let position = 0, afterDot = false;
    while (position < path.length) {
      token.lastIndex = position;
      const match = token.exec(path);
      if (!match || (afterDot && match[1] === undefined)) throw new Error('路径语法错误');
      parts.push(match[1] ?? match[2] ?? match[3] ?? match[4]);
      position = token.lastIndex; afterDot = false;
      if (position === path.length) break;
      if (path[position] === '.') {
        position++; afterDot = true;
        if (position === path.length) throw new Error('路径语法错误');
      } else if (path[position] !== '[') throw new Error('路径语法错误');
    }
  }
  if (!parts.length) throw new Error('路径不能为空');
  if (parts.some(part => !part)) throw new Error('路径段不能为空');
  if (parts.some((part) => ['__proto__', 'prototype', 'constructor'].includes(part))) throw new Error('包含危险路径');
  function ownValue(object, key) {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (descriptor && !('value' in descriptor)) throw new TypeError('路径不支持访问器属性');
    return descriptor?.value;
  }
  function write(object, key, next) {
    ownValue(object, key);
    Object.defineProperty(object, key, Object.hasOwn(object, key)
      ? { value: next } : { value: next, writable: true, enumerable: true, configurable: true });
  }
  let current = target;
  for (let index = 0; index < parts.length - 1; index++) {
    const key = parts[index], next = parts[index + 1];
    const nextIsIndex = /^(0|[1-9]\d*)$/.test(next) && Number(next) < 4294967295;
    let child = ownValue(current, key);
    if (child === undefined) { child = nextIsIndex ? [] : {}; write(current, key, child); }
    else if (!child || typeof child !== 'object') throw new TypeError(`路径 ${parts.slice(0, index + 1).join('.')} 不是对象`);
    current = child;
  }
  write(current, parts.at(-1), value);
  return target;
}
```

```js
setByPath({}, 'user.items[0].name', 'Ada');
// { user: { items: [{ name: 'Ada' }] } }
```

---

### 算法题

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors) · [资料 2](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html)。

---

## Q152｜一只青蛙一次可以跳上1级台阶，也可以跳上2级台阶。求该青蛙跳上一个 n 级的台阶总共有多少种跳法。

适用：动态规划；结果使用 BigInt。

每次只能跳一级或两级时，最后一步来自 n−1 或 n−2，因此 f(n)=f(n−1)+f(n−2)。约定 f(0)=1 表示空方案，f(1)=1；若题目规定零级为零，需另行调整。迭代只保存两个状态，使用 BigInt 防止较大 n 超出安全整数范围；以迭代次数计时间 O(n)，大整数运算成本随位数增加。

```js
function climbStairs(n) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError('n 必须是非负整数');
  let previous = 1n, current = 1n;
  for (let i = 2; i <= n; i++) [previous, current] = [current, previous + current];
  return current;
}
```


```js
climbStairs(5); // 8n
```

参考：[资料 1](https://en.wikipedia.org/wiki/Fibonacci_sequence)。

---

## Q153｜找出字符串中不含有重复字符的 最长子串 的长度。

适用：滑动窗口；按 Unicode code point 迭代。

滑动窗口记录每个字符最后出现的位置。遇到重复时，左边界只能向右推进，不能回退。每个位置访问一次，时间 O(n)，空间取决于不同字符数量。本例按 Unicode 码点计数，不按 UTF-16 单元，也不是按用户可见的字素簇计数。

```js
function longestUniqueSubstring(text) {
  const values = Array.from(text), last = new Map(); let left = 0, maximum = 0;
  for (let right = 0; right < values.length; right++) { left = Math.max(left, (last.get(values[right]) ?? -1) + 1); last.set(values[right], right); maximum = Math.max(maximum, right - left + 1); }
  return maximum;
}
```


```js
longestUniqueSubstring('abcabcbb'); // 3
longestUniqueSubstring('🙂a🙂b'); // 3
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Symbol.iterator)。

---

## Q154｜给定一个字符串，判定其能否排列成回文串。

适用：回文排列奇偶计数；现代 JavaScript。

回文中除中间字符外，其余字符必须两两配对，所以至多一种字符的出现次数可以是奇数。用 Set 记录当前出现奇数次的字符；扫描结束后大小不超过一即可。此题只判断能否重排，不要求原串本身是回文。本例区分大小写，并把空格、标点计入字符。

```js
function canPermutePalindrome(text) {
  const odd = new Set();
  for (const value of text) { if (odd.has(value)) odd.delete(value); else odd.add(value); }
  return odd.size <= 1;
}
```


```js
canPermutePalindrome('aab'); // true
canPermutePalindrome('abc'); // false
```

参考：[资料 1](https://en.wikipedia.org/wiki/Palindrome) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)。

---

## Q155｜反转一个链表

适用：单链表原地反转。

对无环单链表逐个保存 next，再将当前节点 next 指向前一个节点，最后返回新的头节点。一定要先保存原 next，否则会丢失未处理部分。时间 O(n)、额外空间 O(1)，会修改原链表；若输入可能有环，应先检查，空链表返回 null。

```js
function reverseList(head) {
  let previous = null;
  while (head) { const next = head.next; head.next = previous; previous = head; head = next; }
  return previous;
}
```


```js
const head = { value: 1, next: { value: 2, next: null } };
reverseList(head); // 新头为原节点 2
```

参考：[资料 1](https://en.wikipedia.org/wiki/Linked_list)。

---

## Q156｜二叉树的遍历

适用：二叉树前/中/后序遍历。

前序为根左右，中序为左根右，后序为左右根。这里用“节点、是否已访问”的栈统一实现三种深度优先遍历，避免深树导致递归调用栈溢出。输入约定为无环二叉树，节点含 value、left、right；时间 O(n)，输出数组 O(n)，辅助栈 O(h)。

```js
function traverseTree(root, order = 'in') {
  if (!['pre', 'in', 'post'].includes(order)) throw new Error('未知遍历顺序');
  const values = [], stack = root ? [[root, false]] : [];
  while (stack.length) {
    const [node, visited] = stack.pop();
    if (visited) { values.push(node.value); continue; }
    const work = order === 'pre' ? [[node, true], [node.left, false], [node.right, false]] : order === 'in' ? [[node.left, false], [node, true], [node.right, false]] : [[node.left, false], [node.right, false], [node, true]];
    for (const pair of work.reverse()) if (pair[0]) stack.push(pair);
  }
  return values;
}
```


```js
const tree = { value: 2, left: { value: 1 }, right: { value: 3 } };
traverseTree(tree, 'in'); // [1, 2, 3]
```

参考：[资料 1](https://en.wikipedia.org/wiki/Tree_traversal)。

---

## Q157｜实现一个全排列

适用：现代 JavaScript；回溯算法。

使用回溯维护当前路径和已使用位置。按输入顺序搜索，在每一层用 Set 跳过本层已选择过的值，避免重复排列。Set 使用 SameValueZero：NaN 与自身相同，+0/-0 相同，数字与字符串不同，对象按引用区分。n 个互异元素会产生 n! 个结果，时间和输出空间都至少是 O(n · n!)；数据较大时应改成生成器逐个消费。

```js
function permutations(values) {
  const items = [...values], used = new Array(items.length).fill(false), result = [], current = [];
  function visit() {
    if (current.length === items.length) { result.push([...current]); return; }
    const chosen = new Set();
    for (let index = 0; index < items.length; index++) {
      if (used[index] || chosen.has(items[index])) continue;
      chosen.add(items[index]);
      used[index] = true; current.push(items[index]); visit(); current.pop(); used[index] = false;
    }
  }
  visit();
  return result;
}
```

```js
permutations([1, 1, 2]);
// [[1,1,2], [1,2,1], [2,1,1]]
```

参考：[资料 1](https://en.wikipedia.org/wiki/Permutation) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)。

---

## Q158｜快速找到链表的中间节点

适用：单链表快慢指针算法。

快慢指针同时从头节点出发，slow 每次走一步，fast 每次走两步。fast 到达尾部时 slow 位于中点，时间 O(n)、额外空间 O(1)。偶数长度存在两个中点，下面的循环条件返回第二个中点；若题目要求第一个中点，应改成 while (fast?.next?.next)。输入应是无环单链表，有环时需要先检测或限制遍历。

```js
function middleNode(head) {
  let slow = head, fast = head;
  while (fast?.next) { slow = slow.next; fast = fast.next.next; }
  return slow;
}
```

```js
// 1 -> 2 -> 3 -> 4，返回节点 3
middleNode(head);
```

参考：[资料 1](https://en.wikipedia.org/wiki/Cycle_detection)。

---

---
id: "interview-coding"
title: "代码编程与算法题"
category: "代码编程"
description: "收录 Q123–Q158 的参考答案、原理说明与配图。"
kind: "手写题解"
tags: ["JavaScript","算法","手写题"]
addedAt: "2026-10-08"
order: 103
status: draft
quality: incomplete
sources: ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference","https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm"]
technologyVersion: "现代 JavaScript；浏览器 API 按兼容性使用"
---

> 审核说明：本专题仍为草稿。本次补充参考资料与部分题解，未逐条审核全部原导入答案；字数校验通过不代表技术准确。

补充参考资料：[参考 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference) · [参考 2](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)。


### 功能程序题

---

## Q123｜拓扑排序-求模块依赖关系

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

---

## Q124｜求笛卡尔积

从一个空组合开始，每一轮把下一组中的每个元素追加到已有组合。输入包含空组时结果为空；没有组时约定结果为包含空元组的数组。结果数量是各组长度的乘积，组合较多时应使用生成器分批消费，避免一次占满内存。

```js
function cartesianProduct(groups) {
  return groups.reduce((result, group) => result.flatMap((prefix) => group.map((value) => [...prefix, value])), [[]]);
}
```


```js
cartesianProduct([[1, 2], ['a', 'b']]); // [[1,'a'], [1,'b'], [2,'a'], [2,'b']]
```

---

## Q125｜并发任务控制

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

---

## Q126｜多维数组降为一维（数组打平）

已知有限数组可以使用 flat(Infinity)，它返回新数组，不改变原数组，且会移除被展开层级中的空槽。深度不确定或数据量巨大时，可以用显式栈实现遍历，避免递归栈溢出。不要用字符串拼接再 split，因为它会破坏数字、对象、空字符串等元素类型。

```js
const result = [1, [2, [3]], 4].flat(Infinity); // [1, 2, 3, 4]
```

---

## Q127｜找到页面所有 a标签的 href 属性

querySelectorAll 获取当前文档的静态节点列表。getAttribute("href") 返回写在属性里的原始值；元素的 href 属性通常返回解析后的绝对 URL，二者需要按题意选择。后续新增的链接不会自动进入这个快照。

```js
const original = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
const absolute = [...document.querySelectorAll('a[href]')].map(a => a.href);
```

---

## Q128｜如何给按钮绑定两个事件

同一按钮可以通过 addEventListener 注册多个不同的监听函数，依注册顺序在相应阶段执行。连续设置 onclick 会覆盖前一次赋值。相同类型、相同函数和相同 capture 的重复注册不会产生两个监听器，移除时也必须保留函数引用。

```js
function first() { console.log('第一个'); }
function second() { console.log('第二个'); }
button.addEventListener('click', first);
button.addEventListener('click', second);
button.removeEventListener('click', first);
```

---

## Q129｜实现拖拉拽功能

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

---

## Q130｜原地打乱数组（数组洗牌）

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

---

## Q131｜不能用 Array.sort 方法来打乱数组的原因

sort(() => Math.random() - 0.5) 不能保证等概率洗牌：比较器不满足排序所要求的一致性，不同排序算法和引擎可能得到不同偏差。无法概括为“有 50% 概率保持不变”。应使用 Q130 的 Fisher–Yates，若不想修改原数组，先对数组做浅拷贝。

---

## Q132｜对象深拷贝

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

---

## Q133｜判断对象是否存在循环引用

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

---

## Q134｜实现一个柯里化函数 add

1. add(1,2,3).valueOf() // 6
2. add(1,2)(3)(4,5).valueOf() // 15
3. add(1)(2)(3)(4,5,6)(7).valueOf() // 28

---

## Q135｜通用柯里化高阶方法

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

---

## Q136｜字符串 "abcde" 如何反转

对题目中的 ASCII 字符串可直接转换成数组再反转。扩展运算符按 Unicode 码点迭代，能保留多数单个 emoji，但不能保证组合字符和家庭 emoji 的完整性。用户可见字符需要用 Intl.Segmenter 按字素簇分段后再反转。

```js
const simple = [...'abcde'].reverse().join(''); // edcba
const segmenter = new Intl.Segmenter('zh', { granularity: 'grapheme' });
const reverse = text => [...segmenter.segment(text)].map(x => x.segment).reverse().join('');
```

---

## Q137｜实现一个防抖函数

**定义：**当事件触发后，会设置一个定时器，在指定的延迟时间后再执行相应的操作，如果在延迟时间内再次触发了同一个事件，那么就会清除之前的定时器，并重新设置新的定时器，直到事件触发完成。

![](./images/interview/大前端面试宝典-diagram-4.png)

---

## Q138｜实现一个截流函数

**定义：**当事件触发后，事件处理函数会在固定的时间间隔内执行，即使事件被频繁触发也是如此。

![](./images/interview/大前端面试宝典-diagram-5.png)

---

## Q139｜实现一个方法，能上传多张图片，保持单次 n 张上传，n 张里如果有 1 张已经上传成功，然后就补上 1 张，就一直维持n 张图片同时在上传。

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

---

## Q140｜获取当前日期（年-月-日 时:分:秒）

题目格式使用本地时区，通过 getFullYear/getMonth/getDate 等方法取得各部分，月份从零开始，其他字段需要补两位。toISOString 输出 UTC 时间，不应直接截取后冒充本地时间。若业务规定某个时区，应使用 Intl.DateTimeFormat 的 timeZone 而非用户电脑的默认时区。

```js
function formatLocal(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
```

---

## Q141｜实现一个 once 函数，传入函数参数只执行一次

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

---

## Q142｜实现一个私有变量，用 get 、set 可以访问，不能直接访问。

闭包中的变量不作为返回对象的属性暴露，外部只能通过提供的方法访问。类也可以使用 #value 私有字段，它与“以下划线命名”不同，后者只是约定。set 应按业务需要校验输入；私有字段用于封装，不是对运行环境中恶意代码的安全隔离。

```js
function createCell(initial) {
  let value = initial;
  return { get: () => value, set: next => { value = next; } };
}
const cell = createCell(1); cell.set(2); console.log(cell.get()); // 2
```

---

## Q143｜将原生的 ajax 封装成 promise

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

---

## Q144｜实现 sleep 效果

sleep 通常指异步等待，让当前 async 函数暂停，而不是阻塞浏览器线程。setTimeout 的时间是最早调度时间，页面后台限速或主线程忙碌时可能更晚。不要用 while 循环忙等待，它会阻塞输入、绘制和所有后续任务。

```js
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
await sleep(1000); // 约一秒后继续
```

---

## Q145｜实现下载图片功能

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

---

## Q146｜实现前端添加水印

可用 Canvas 画透明文字小图，转成 data URL 后作为固定覆盖层的重复背景。覆盖层应 pointer-events:none、aria-hidden=true，以免妨碍点击和阅读辅助工具。前端水印可被用户移除，不能作为不可篡改凭据；敏感文件需要服务端生成嵌入水印，并考虑导出和打印。

```js
const canvas = document.createElement('canvas'); canvas.width = 240; canvas.height = 140;
const ctx = canvas.getContext('2d'); ctx.translate(30, 95); ctx.rotate(-Math.PI / 6);
ctx.font = '18px sans-serif'; ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillText('示例水印', 0, 0);
const layer = document.createElement('div'); layer.setAttribute('aria-hidden', 'true');
Object.assign(layer.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9999', backgroundImage: `url(${canvas.toDataURL()})` });
document.body.append(layer);
```

---

## Q147｜实现响应式数据 + 依赖收集

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

---

## Q148｜手动实现一个 instanceOf 方法

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

---

## Q149｜还原一棵树

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

---

## Q150｜实现 b 函数，使得 b.then 中能打印出 cb 的参数值

**补充说明：即打印 Math.random() 的值**

**实现：利用 promise resolve** 

---

## Q151｜实现一个 set 方法，支持根据路径设置对象的属性值。

**实现方案一：**循环遍历

**实现方案二：**reduce 遍历（和方案一类似）

**实现方案三：**递归

---

### 算法题

---

## Q152｜一只青蛙一次可以跳上1级台阶，也可以跳上2级台阶。求该青蛙跳上一个 n 级的台阶总共有多少种跳法。

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

---

## Q153｜找出字符串中不含有重复字符的 最长子串 的长度。

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

---

## Q154｜给定一个字符串，判定其能否排列成回文串。

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

---

## Q155｜反转一个链表

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

---

## Q156｜二叉树的遍历

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

---

## Q157｜实现一个全排列

给定的数组，生成包含数组中所有元素的所有可能排列的过程。每个排列都是数组中元素的不同排列顺序。

例如，对于数组 [1, 2, 3] 的全排列包括：

1. [1, 2, 3]
2. [1, 3, 2]
3. [2, 1, 3]
4. [2, 3, 1]
5. [3, 1, 2]
6. [3, 2, 1]

---

## Q158｜快速找到链表的中间节点

快慢指针，快指针步进为2，慢指针步进为1，两个指针同时启动，当快指针走到底，慢指针指向的即是中间节点。

---

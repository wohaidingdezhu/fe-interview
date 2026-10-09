---
id: "interview-javascript"
title: "JavaScript 面试题"
category: "JavaScript"
description: "收录 Q40–Q116 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["JavaScript","面试"]
addedAt: "2026-10-08"
order: 101
status: draft
quality: incomplete
sources: ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference","https://html.spec.whatwg.org/multipage/webappapis.html#event-loops"]
technologyVersion: "现代 ECMAScript；事件循环示例针对浏览器"
---

> 审核说明：本专题仍为草稿。本次补充参考资料与部分题解，未逐条审核全部原导入答案；字数校验通过不代表技术准确。

补充参考资料：[参考 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference) · [参考 2](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)。


## Q40｜以下哪段代码运行效率更高（隐藏类）

- **左边效率更高，重用了 隐藏类（Hidden Class）**
- JS运行机制： 浏览器 -> 内核 ->  JS 解析引擎

| **浏览器** | **内核** | **JS解析引擎** |
|-|-|-|
| chrome | 早期 WebKit，现目前 Blink | V8 |
| Mozilla Firefox | Gecko | SpiderMonkey |
| Edge | Chromium | Chakra / V8 |
| Safari | Webkit | JavascriptCore |

- 比较主流的 JS 引擎是 v8，这里假设是跑在 chrome 或 node 上，用的是 v8 引擎。
- V8 是一个 c++ 实现的 js 解析引擎，内部利用 隐藏类（Hidden Class） 的方式来存放 JS 对象。
- 隐藏类的特性是：多个属性顺序一致的 JS 对象，会重用同一个隐藏类，减少 new Class 的开销。
- 所以左边生成1个隐藏类，而右边生成3个隐藏类，因此左边代码性能更好。
- **指导代码编写习惯：**定义对象或类时，尽可能保证属性顺序一致。


---

## Q41｜以下哪段代码效率更高（数组 - 快速模式 / 字典模式）

- **左边的效率更高，利用了数组的 快速模式**
- JS运行机制： 浏览器 -> 内核 ->  JS 解析引擎

| **浏览器** | **内核** | **JS解析引擎** |
|-|-|-|
| chrome | 早期 WebKit，现目前 Blink | V8 |
| Mozilla Firefox | Gecko | SpiderMonkey |
| Edge | Chromium | Chakra / V8 |
| Safari | Webkit | JavascriptCore |

- 比较主流的 JS 引擎是 v8，这里假设是跑在 chrome 或 node 上，用的是 v8 引擎。
- V8 是一个 c++ 实现的 js 解析引擎，内部有多种方式存放 JS 数组。
- "数组从 0 到 length-1 无空洞" ，会进入快速模式，存放为 array。
- "数组中间有空洞"，会进入字典模式，存放为 HashMap。（这是 V8 的一个优化策略，保证用最合适的数据结构处理当下场景，如果遇到数据量过大或者是松散结构的话，就改变为 HashMap，牺牲遍历性能，换取访问性能。）
- **指导代码编写习惯：**
- 从0开始初始化数组，避免数组进入字典模式。
- 让数组保持紧凑，避免数组进入字典模式。

**相关文章：**https://itnext.io/v8-deep-dives-understanding-array-internals-5b17d7a28ecc


---

## Q42｜如何判断 object 为空

- 常用方法：
- Object.keys(obj).length === 0 
- JSON.stringify(obj) === '{}' 
- for in 判断
- 以上方法都是不太严谨，因为处理不了 const obj = { [Symbol('a')]: 1 }. 这种情况
- 更严谨的方法： Reflect.ownKeys(obj).length === 0;

---

## Q43｜强制类型转换、隐式类型转换

显式转换通过 Number、String、Boolean 等表明意图；隐式转换发生在运算或比较中。加号既能加法也能连接字符串，减号通常要求数字。空数组和空对象都是 truthy，不能用 Boolean 判断容器是否为空。严格相等不做类型转换，通常更容易理解。

```js
Number('12'); // 12
'12' + 1; // '121'
'12' - 1; // 11
Boolean([]); // true
Number('oops'); // NaN
```

---

## Q44｜== 和 === 的区别

- "==" ，先隐式类型转换，再判断值是否相等
- "==="，直接判断 类型 + 值 是否相等

**问题补充：**当 a = ? 以下代码成立？

---

## Q45｜javascript 的数据类型有哪些

- 基本数据类型：

1. Number（数字）：表示数值，包括整数和浮点数。
2. String（字符串）：表示文本数据，使用引号（单引号或双引号）括起来。
3. Boolean（布尔值）：表示逻辑值，即true（真）或false（假）。
4. Null（空）：表示一个空值或没有值的对象。
5. Undefined（未定义）：表示一个未被赋值的变量的值。
6. Symbol（符号）：表示唯一的标识符。

- 复杂数据类型（也被称为引用类型）：

1. Object（对象）：表示复杂数据结构，可以包含键值对的集合。
2. Array（数组）：表示有序的集合，可以包含任意类型的数据。
3. Function（函数）：表示可执行的代码块。

- 在 ECMAScript 2020（ES11）规范中正式被添加 BigInt 数据类型。用于对 “大整数” 的表示和操作。

1. 结尾用n表示：100000n / 200n

- 基础类型存放于栈，变量记录原始值；引用类型存放堆，变量记录地址。

---

## Q46｜javascript  变量在内存中的堆栈存储

- 基础类型会存放于栈，引用类型会存放在堆
- 案例：以下代码为什么输出 50 30 ？
- 解析
- 当执行 const o = { m: 30 } 时，相当于在堆内存开辟一块空间，存储 { m:30 }，同时利用变量 o 记录该堆内存地址，o 存放于栈。

![](./images/interview/大前端面试宝典-diagram.png)

- 接着执行 fn(o) ，会把 o 记录的地址值作为实参传递到方法 fn 中，同时记录在 obj 副本变量中（注意：JS 的传参都是值传递）
- 再下来执行 obj = { m: 50 }，相当于重新开辟了一个堆内存空间存储 { m: 50 }，同时把地址记录到 obj 中。

![](./images/interview/大前端面试宝典-diagram-1.png)

- 然后执行 console.log(obj.m) 会根据 obj 记录的地址2，找到 { m: 50 }，所以输出 50。
- 最后同理，执行 console.log(o.m) 会根据 o 记录的地址1，找到 { m: 30 }，所以会输出 30。

---

## Q47｜JS  单线程设计的目的

javascript 是浏览器的脚本语言，主要用途是进行页面的一系列交互操作以及用户互动，多线程编程通常会引发竞态条件、死锁和资源竞争等问题。如果以多线程的方式进行浏览器操作，则可能出现不可预测的冲突。假设有两个线程同时操作同一个 DOM 元素，线程 1 要求浏览器修改 DOM 内容，而线程 2 却要求删除 DOM，浏览器就疑惑，无法决定采用哪个线程的操作。所以 JavaScript 的单线程设计很好的简化了这类并发问题，避免了因多线程而引发的竞态条件、死锁和资源竞争等问题。当然，如果在开发中确切需要到异步场景， javascript 也有众多的异步队列来帮助我们实现，也就是我们熟知的事件循环，微任务队列，宏任务队列。如果真的需要开辟一个新线程处理逻辑，也可以通过 webworker 实现。

---

## Q48｜如何判断 javascript 的数据类型

- **typeof 操作符：** 可以用来确定一个值的基本数据类型，返回一个表示数据类型的字符串。

注意，typeof null 返回 "object" 是历史遗留问题，不是很准确。

- **Object.prototype.toString：** 用于获取更详细的数据类型信息。
- **instanceof 操作符：** 用于检查对象是否属于某个类的实例。
- Array.isArray：用于检查一个对象是否是数组。

---

## Q49｜ES 每个版本引入了什么内容

ECMAScript是一种用于编写 JavaScript 的标准化脚本语言。下面是每个版本的一些重要特性和区别：

- **ES6（ECMAScript 2015）：**
- 引入了let和const关键字，用于声明块级作用域的变量。
- 引入了箭头函数（arrow functions）。
- 添加了模板字符串（template strings）。
- 引入了解构赋值（destructuring assignment）。
- 引入了类和模块（classes and modules）。
- 引入了 Promise。
- **ES7（ECMAScript 2016）：**
- 引入了Array.prototype.includes()方法，用于检查数组是否包含特定元素。
- 引入了指数操作符（exponentiation operator）。
- **ES8（ECMAScript 2017）：**
- 引入了异步函数（async/await）。
- 添加了Object.values()和Object.entries()方法，用于遍历对象的值和键值对。
- 引入了字符串填充方法（string padding）。
- **ES9（ECMAScript 2018）：**
- 引入了异步迭代器（asynchronous iterators）。
- 添加了Promise.finally()方法，用于指定无论Promise状态如何都会执行的回调函数。
- 引入了对象的扩展运算符（object spread）。
- **ES10（ECMAScript 2019）：**
- 引入了Array.prototype.flat()和Array.prototype.flatMap()方法，用于处理嵌套数组。
- 添加了String.prototype.trimStart()和String.prototype.trimEnd()方法，用于去除字符串开头和结尾的空格。
- 引入了动态导入（dynamic imports）。
- **ES11（ECMAScript 2020）：**
- 引入了可选链操作符（optional chaining）。
- 添加了空值合并操作符（nullish coalescing）。
- 引入了BigInt类型，用于处理超出Number类型范围的整数。

---

## Q50｜let 声明变量的特性

1. **块级作用域**

1 秒后输出 10 个 10，循环体变量 i 会渗透到循环体外部，所以在 setTimeout 1 秒 的过程中，i 的值实质变成了 10，因此会在 1 秒后输出 10 个 10。

变会 let 定义之后，问题会消失，正常在 1 秒后，输出 0 - 9，因为 let 是块级作用域，仅局限于循环体内部。

如果用 var 定义，可通过在循环体内添加一个立即执行函数，把迭代变量的作用域保护起来。

- **暂时性死区（temporal dead zone）**

在 let 声明之前的执行瞬间被称为 “暂时性死区”，此阶段引用任何后面声明的变量会抛出 ReferenceError 错误

![](./images/interview/大前端面试宝典-image-1.png)

- **同级作用域下不能重复声明**

![](./images/interview/大前端面试宝典-image-2.png)

- **全局声明会挂到 Script 作用域下，不会挂在 window**

![](./images/interview/大前端面试宝典-image-27.png)

---

## Q51｜变量提升 & 函数提升 (优先级)

函数声明在其作用域初始化时绑定为函数；var 绑定初始化为 undefined，赋值仍发生在原来的执行位置。let/const 也建立词法绑定，但初始化前处于暂时性死区，访问会抛错。不要用“所有声明都搬到最上面”理解执行顺序；同名声明、严格模式和块级函数还会影响合法性。

```js
console.log(value); // undefined
console.log(run()); // 1
var value = 2;
function run() { return 1; }
// console.log(other); let other = 3; // ReferenceError
```

---

## Q52｜如何判断对象相等

较为常用：JSON.stringify(obj1) === JSON.stringify(obj2)

---

## Q53｜null 和 undefined 的区别

**undefined**

- 当声明了一个变量但未初始化它时，它的值为 undefined。
- 当访问对象属性或数组元素中不存在的属性或索引时，也会返回 undefined。
- 当函数没有返回值时，默认返回 undefined。
- 如果函数的参数没有传递或没有被提供值，函数内的对应参数的值为 undefined。

**null**

- null 是一个特殊的关键字，表示一个空对象指针。
- 它通常用于显式地指示一个变量或属性的值是空的，null 是一个赋值的操作，用来表示 "没有值" 或 "空"。
- null 通常需要开发人员主动分配给变量，而不是自动分配的默认值。
- null 是原型链的顶层：所有对象都继承自Object原型对象，Object原型对象的原型是null。

---

## Q54｜用 setTimeout 来实现倒计时 ，与 setInterval 的区别？

- **setTimeout：**每隔一秒生成一个任务，等待一秒后执行，执行完成后，再生成下一个任务，等待一秒后执行，如此循环，所以左边任务间的间隔保证是1秒。
- **setInterval:**  无视执行时间，每隔一秒往任务队列添加一个任务，等待一秒后执行，这样会导致任务执行间隔小于1秒，甚至任务堆积。

**PS：**setInterval 中当任务执行时间大于任务间隔时间，会导致消费赶不上生产。

![](./images/interview/大前端面试宝典-diagram-2.png)

---

## Q55｜JS 事件循环机制 - 宏任务微任务是如何工作的？

1. 同步任务直接执行
2. 遇到微任务放到微任务队列（Promise.then / process.nextTick 等等）
3. 遇到宏任务放到宏任务队列（setTimeout / setInterval 等等）
4. 执行完所有同步任务
5. 执行微任务队列中的任
6. 执行宏任务队列中的任务

![](./images/interview/大前端面试宝典-image-28.png)

**案例：问打印顺序**

**过程分析：**

---

## Q56｜事件循环 - 以下代码输出结果

**考察重点：**事件循环中，宏任务与微任务的执行优先级。

**答案：**持续输出 test 且 不会输出 timeout   (重点)

**解释：**微任务执行优先级高于宏任务，pormise.then callback 会挂载到微任务队列，而 setTimeout callback 会挂载到宏任务队列，每次在执行微任务队列任务时，又重新执行 test()，test运行时会往微任务队列中添加一个微任务，如此循环，所以宏任务队列始终没机会，所以不会输出 timeout。

---

## Q57｜事件循环进阶（1）

原导入材料没有可执行代码，无法还原其具体输出。下面用可验证的新例子说明浏览器事件循环：先执行当前任务中的同步代码，再清空微任务队列，之后才有机会执行定时器任务。这里的输出次序为 A、D、C、B。

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```

---

## Q58｜事件循环进阶（2）

原题没有保留代码，这里补一个独立示例。then 回调中新建的微任务会追加到队列尾部，而不是插到当前微任务后立即执行。当前任务结束后，输出依次为 A、B、C；微任务队列必须持续处理到空，过多微任务可能延迟绘制。

```js
queueMicrotask(() => { console.log('A'); queueMicrotask(() => console.log('C')); });
queueMicrotask(() => console.log('B'));
```

---

## Q59｜事件循环进阶（3）

原题没有保留代码，以下为教学替代示例。async 函数会同步执行到第一个 await；即使等待已解决的 Promise，await 之后的代码也不会在同一同步栈内立即执行。输出为 A、C、B。是否先于其他微任务需根据注册顺序分析，不能笼统说 async 更快。

```js
async function run() { console.log('A'); await Promise.resolve(); console.log('B'); }
run(); console.log('C');
```

---

## Q60｜事件循环进阶（4）

原题没有保留代码，不能推测图片中输出。此例说明 Promise executor 在构造时同步执行，then 回调才进入微任务队列；setTimeout 是后续任务。输出为 A、D、C、B。浏览器和 Node 的调度阶段不同，本例仅针对浏览器，不把 Node 的 nextTick 等规则混入。

```js
new Promise(resolve => { console.log('A'); resolve(); }).then(() => console.log('C'));
setTimeout(() => console.log('B'), 0); console.log('D');
```

---

## Q61｜事件循环进阶（5）

**答案：**script 代码片段会被浏览器内容作为 task 调度，放入宏任务队列

- step1：
- step2：
- step3：
- step4：
- step5：

---

## Q62｜什么是内存泄漏

内存泄漏是指应用程序中的内存不再被使用但仍然被占用，导致内存消耗逐渐增加，最终可能导致应用程序性能下降或崩溃。内存泄漏通常是由于开发者编写的代码未正确释放不再需要的对象或数据而导致的。

**特征:** 程序对内存失去控制

**内存泄漏的案例：**

- 意外的全局变量
- 闭包: 闭包可能会无意中持有对不再需要的变量或对象的引用，从而阻止它们被垃圾回收。
- 事件监听器: 忘记移除事件监听器可能会导致内存泄漏，因为与监听器相关联的对象将无法被垃圾回收。
- 循环引用: 对象之间的循环引用会阻止它们被垃圾回收。
- setTimeout/setInterval: 使用 setTimeout 或 setInterval 时，如果没有正确清理，可能会导致内存泄漏，特别是当回调函数持有对大型对象的引用时。

---

## Q63｜什么是闭包，有什么作用。

**定义：**闭包 是指引用了另一个函数作用域中变量的函数，通常是在嵌套函数中实现的。

**作用：**闭包可以保留其被定义时的作用域，这意味着闭包内部可以访问外部函数的局部变量，即使外部函数已经执行完毕。这种特性使得闭包可以在后续调用中使用这些变量。

**注意：**闭包会使得函数内部的变量在函数执行后仍然存在于内存中，直到没有任何引用指向闭包。如果不注意管理闭包，可能会导致内存泄漏问题。

**案例：**

---

## Q64｜常用的 console 方法有哪些，JS 调试方法

常见方法包括 log/info/warn/error、table、group/groupEnd、time/timeEnd、count、trace 和 assert。排查错误时可在开发者工具中设断点、条件断点和异常暂停，查看调用栈、作用域和网络请求。Source Map 将压缩代码映射回源码，但生产发布是否暴露源文件应按项目策略决定。console 输出对象可能是延迟查看，应保存需要对比的快照。

---

## Q65｜数组去重的方法

- Set 只允许存储唯一的值，可以将数组转换为Set，然后再将Set转换回数组以去重。
- 利用 filter 方法来遍历数组，只保留第一次出现的元素。
- 使用reduce方法逐个遍历数组元素，构建一个新的数组，只添加第一次出现的元素。
- 使用indexOf方法 ，遍历数组，对于每个元素，检查其在数组中的索引，如果第一次出现，则添加到新数组。
- 使用includes方法：类似于indexOf方法，只不过使用includes来检查元素是否已存在于新数组。

---

## Q66｜清空数组的方法

arr.length=0 和 arr.splice(0) 都清空原数组，所有持有相同数组引用的变量都会看到变化。arr=[] 只是把当前变量指向新数组，不会清空旧数组，也不能赋值给 const 绑定。选择前先明确是否需要保留数组身份。

```js
const a = [1, 2]; const b = a; a.length = 0;
console.log(b); // []
let x = [1, 2]; const y = x; x = [];
console.log(y); // [1, 2]
```

---

## Q67｜JS 数组常见操作方式及方法

push/pop 修改尾部，unshift/shift 修改头部，splice 修改任意区间；slice、map、filter 返回新数组。sort/reverse 会修改原数组，现代运行环境支持 toSorted/toReversed 等非修改版本，旧环境需要确认兼容性。find 返回第一个匹配元素，some/every 返回布尔值，includes 检查元素存在性；对象元素的相等通常比较引用。

---

## Q68｜JS 数组 reduce 方法的使用

reduce 把多个元素累计成一个值，可以做求和、分组或索引。推荐明确提供初始值，避免空数组抛错以及首个元素被当作累积器带来的类型混乱。纯函数式复制累积对象可读但大量数据时可能反复分配，需要结合性能选择实现。

```js
const total = [1, 2, 3].reduce((sum, value) => sum + value, 0); // 6
const grouped = rows.reduce((map, row) => {
  (map[row.category] ??= []).push(row); return map;
}, Object.create(null));
```

---

## Q69｜如何遍历对象

Object.keys/values/entries 遍历自身可枚举的字符串键，for...in 还可能遍历原型链上的可枚举字符串属性，应配合 Object.hasOwn。Reflect.ownKeys 返回全部自身字符串和 Symbol 键，包括不可枚举属性。遍历对象不能简单替换为 for...of，因为普通对象默认没有迭代器。

```js
for (const [key, value] of Object.entries(object)) console.log(key, value);
for (const key of Reflect.ownKeys(object)) console.log(key);
```

---

## Q70｜创建函数的几种方式

- **函数声明（Function Declaration）：**使用 function 关键字定义函数，可以在任何位置声明并使用，函数声明提升（hoisting），所以可以在声明之前调用函数。
- **函数表达式（Function Expression）：**将函数赋值给变量或属性，函数表达式的名称是可选的，与函数声明不同，函数表达式不会提升。
- **箭头函数（Arrow Function）：**箭头函数是ES6引入的一种函数声明方式，它具有更短的语法和词法作用域，箭头函数没有自己的 this，它继承自外围作用域。
- **匿名函数（Anonymous Function）：**函数没有名字，通常用于回调函数或临时函数。

---

## Q71｜创建对象的几种方式

- **对象字面量（Object Literal）：**使用大括号 {} 创建对象，可以在大括号内定义对象的属性和方法。
- **构造函数（Constructor Function）：**使用构造函数创建对象，通过 new 关键字调用以创建对象。
- **Object.create() 方法：**使用 Object.create() 方法创建对象，可以指定对象的原型。
- **工厂函数（Factory Function）：**使用工厂函数创建对象，工厂函数是一个返回新对象的函数。
- 类（ES6中引入的类）：使用类定义对象，类是一种对象构造器的语法糖。

---

## Q72｜宿主对象、内置对象、原生对象

宿主对象是由宿主环境（通常是浏览器或Node.js）提供的对象。它们不属于JavaScript的核心，而是根据运行环境提供的功能而存在。宿主对象可以包括

1. **宿主对象（Host Objects）：**

- 浏览器环境中的window、document、XMLHttpRequest
- Node.js环境中的global、process等。

宿主对象的定义和行为取决于宿主环境，因此它们可能在不同的环境中有不同的特性。

内置对象是JavaScript语言本身提供的对象，它们包含在JavaScript的标准规范中。这些对象包括全局对象、数学对象、日期对象、正则表达式对象等。内置对象可以直接在任何JavaScript环境中使用，无需额外导入或引入。例如，全局对象Math用于数学计算，日期对象Date用于日期和时间操作。

1. **内置对象（Built-in Objects）：**

原生对象是JavaScript语言的一部分，但它们不是内置对象。原生对象是通过构造函数或字面量方式创建的对象，例如数组、字符串、函数、对象等。这些对象可以通过JavaScript代码自定义，它们通常是开发人员用来构建应用程序的基本构建块。

- **原生对象（Native Objects）：**

---

## Q73｜如何区分数组和对象？

- 语法区别：
- 数组使用方括号 [] 来定义，元素之间使用逗号分隔。
- 对象使用花括号 {} 来定义，每个属性由键值对组成，键和值之间使用冒号分隔，键和值之间使用逗号分隔。
- 方法和属性区别：
- 数组具有一系列方法和属性，用于操作和查询元素，例如 push()、pop()、length 等。
- 对象没有数组的方法，但它们有属性，可以通过属性名称访问值。
- 访问区别：
- 数组的元素可以通过数字索引（从 0 开始）来访问。
- 对象的属性名可以是字符串或符号，可以包含任何字符。
- 用途区别：
- 数组通常用于存储一系列有序的值，可以通过索引访问。
- 对象通常用于表示实体或实体的属性，每个属性都有一个唯一的名称。

---

## Q74｜什么是类数组（伪数组），如何将其转化为真实的数组？

类数组（或伪数组）是一种类似数组的对象，它们具有类似数组的结构，即具有数字索引和length属性，但不具有数组对象上的方法和功能。

**常见的类数组：**

- 函数内部的arguments对象
- DOM 元素列表（例如通过 querySelectorAll 获取的元素集合）
- 一些内置方法（如 getElementsByTagName 返回的集合）

**类数组转化为真实的数组方法：**

1. Array.from() 方法：
2. Array.prototype.slice.call() 方法：
3. Spread 运算符：

---

## Q75｜什么是作用域链

作用域链是 JavaScript 中用于查找变量的一种机制，它是由一系列嵌套的作用域对象构成的链式结构，每个作用域对象包含了在该作用域中声明的变量以及对外部作用域的引用，目的是确定在给定的执行上下文中如何查找变量。当您引用一个变量时，JavaScript 引擎会首先在当前作用域对象中查找该变量，如果找不到，它会沿着作用域链向上查找，直到找到该变量或达到全局作用域，如果变量在全局作用域中也找不到，将抛出一个引用错误。

**作用域链的形成方法：**

1. 在函数内部，会创建一个新的作用域对象，包含了函数的参数、局部变量以及对外部作用域的引用。
2. 如果在函数内部嵌套了其他函数，那么每个内部函数都会创建自己的作用域对象，形成一个链。
3. 这个链条会一直延伸到全局作用域。

---

## Q76｜作用域链如何延长

作用域由代码的词法结构确定，不是在运行时随意“延长”。闭包让函数在外层函数返回后仍能访问其词法环境中的绑定，可以理解为保留访问能力。with 和 eval 不是推荐手段，会增加可读性、优化和安全问题，严格模式还禁止 with。

```js
function counter() { let value = 0; return () => ++value; }
const next = counter(); next(); next(); // 1、2
```

---

## Q77｜DOM 节点的 Attribute 和 Property 区别

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

**总结：**

- Attribute 是 HTML 标记中的属性，它们以字符串形式存储在 HTML 元素的标记中。
- Property 是 DOM 元素对象的属性，它们表示了元素在文档中的状态和属性，可以是不同的数据类型。
- Attribute 始终是字符串，而 Property 的数据类型可以更广泛。
- 通常，Property 的名称与 Attribute 的名称相同，但不总是一致。

**案例：**

- id 和 class 是 Attribute，它们以字符串形式存储在 HTML 标记中。
- id 和 className 是 Property，它们是 DOM 元素对象的属性，可以直接访问和操作。

---

## Q78｜DOM 结构操作创建、添加、移除、移动、复制、查找节点

1. **创建节点：**
2. **添加节点：**
3. **移除节点：**
4. **移动节点：**
5. **复制节点：**
6. **查找节点：**

---

## Q79｜DOM 的事件模型

1. **事件对象（Event Object）：** 事件对象是一个包含有关事件的信息的对象。它包括事件的类型、目标元素、鼠标位置、按下的键等信息。事件处理程序可以访问事件对象来了解事件的详细信息。
2. **事件类型（Event Type）：** 事件类型指定了发生的事件的种类，例如点击事件（click）、鼠标移动事件（mousemove）、键盘按下事件（keydown）等。
3. **事件目标（Event Target）：** 事件目标是触发事件的元素，事件将在目标元素上执行事件处理程序。
4. **事件冒泡和事件捕获（Event Bubbling and Event Capturing）：** 事件可以在 DOM 树中冒泡或捕获。事件冒泡从目标元素开始，逐级向上传播到根元素；事件捕获从根元素开始，逐级向下捕获到目标元素。
5. **事件监听器（Event Listener）：** 事件监听器是函数，用于处理特定类型的事件。它可以附加到元素，以便在事件发生时执行。通常使用 addEventListener 方法来添加事件监听器。
6. **事件处理程序（Event Handler）：** 事件处理程序是函数，负责处理特定事件类型的事件。事件监听器通常会调用事件处理程序。
7. **事件委托（Event Delegation）：** 事件委托是一种技术，其中一个父元素上的事件监听器处理该元素的所有子元素上发生的事件。这减少了事件监听器的数量，提高了性能。
8. **取消事件（Preventing Default）：** 事件处理程序可以取消事件的默认行为，例如在链接上阻止默认的点击跳转行为。这可以通过调用事件对象的 preventDefault 方法来实现。
9. **停止事件传播（Stopping Propagation）：** 事件处理程序可以停止事件的传播，防止事件继续冒泡或捕获。这可以通过调用事件对象的 stopPropagation 或 stopImmediatePropagation 方法来实现。

---

## Q80｜事件三要素

1. **事件源（Event Source）：** 事件源是事件的发出者或触发者，它是产生事件的对象或元素，事件源通常是用户与页面交互的元素，如按钮、链接、输入框等。
2. **事件类型（Event Type）：** 事件类型是指事件的种类或类型，描述了事件是什么样的行为或操作，不同的事件类型包括点击事件（click）、鼠标移动事件（mousemove）、键盘按下事件（keydown）、表单提交事件（submit）等。
3. **事件处理程序（Event Handler）：** 事件处理程序是事件触发后要执行的代码块或函数，它定义了当事件发生时要执行的操作。事件处理程序通常由开发人员编写，用于响应事件并执行相应的逻辑。

这三要素一起构成了事件的基本信息。当用户与页面交互时，事件源会触发特定类型的事件，然后事件处理程序会捕获并处理事件，执行相关的操作。

---

## Q81｜如何绑定事件，解除事件

addEventListener 可以注册多个监听器；removeEventListener 必须使用相同的事件类型、函数引用以及 capture 设置。重新写一个看似相同的匿名函数不是同一引用。支持的浏览器也可用 AbortController 一次解除一组监听器，适合组件卸载清理。

```js
const controller = new AbortController();
button.addEventListener('click', onClick, { signal: controller.signal });
controller.abort(); // 解除监听
function onClick() { console.log('clicked'); }
```

---

## Q82｜事件冒泡和事件捕获的区别，如何阻止。

![](./images/interview/大前端面试宝典-diagram-3.png)

**事件冒泡（Bubbling）：**

- 事件从触发事件的目标元素开始，逐级向上冒泡到 DOM 树的根节点。
- 首先执行目标元素上的事件处理程序，然后是父元素，再是更高层次的祖先元素。
- 事件冒泡是默认的事件传播方式。

**事件捕获（Capturing）：**

- 事件从 DOM 树的根节点开始，逐级向下捕获到触发事件的目标元素。
- 首先执行根节点上的事件处理程序，然后是子元素，再是更低层次的子孙元素。
- 事件捕获通常需要显式启用，通过 addEventListener 的第三个参数设置为 true 来启用事件捕获。

**应用：**addEventListener 第三个参数：true 为捕获，false 为冒泡，默认 false

- event.stopPropagation() 阻止冒泡

---

## Q83｜事件委托

事件委托是一种常见的 JavaScript 编程技巧，它的核心思想是将事件处理程序附加到一个祖先元素上，而不是直接附加到每个子元素上，当事件在子元素上冒泡时，祖先元素捕获事件并根据事件目标来确定如何处理事件。

1. **性能优势：** 事件委托可以减少事件处理程序的数量，特别是在大型文档中，因为您只需为一个祖先元素添加一个事件处理程序。这降低了内存消耗和提高了性能，因为不必为每个子元素都绑定事件。
2. **动态元素：** 事件委托适用于动态生成的元素，因为无需为新添加的元素单独绑定事件，而是在祖先元素上继续使用相同的事件处理程序。
3. **代码简洁性：** 通过将事件处理逻辑集中在祖先元素上，代码更加简洁和可维护，因为您不需要为每个子元素编写相似的事件处理代码。
4. **处理多个事件类型：** 通过在祖先元素上处理多个事件类型，可以实现更多的灵活性。例如，您可以在祖先元素上处理点击事件、鼠标移动事件和键盘事件，而不必为每个事件类型创建单独的事件处理程序。

示例：假设您有一个无序列表（<ul>）中的多个列表项（<li>），您希望在点击任何列表项时执行某些操作。您可以使用事件委托来处理这些点击事件，而不必为每个列表项单独添加事件处理程序。

在上述示例中，事件委托将点击事件处理程序附加到了 <ul> 元素上，并使用 event.target 来确定被点击的列表项。这种方法使得单个事件处理程序能够处理整个列表的点击事件。

---

## Q84｜JavaScript 动画和 CSS3 动画有什么区别？

**实现方式：**

- JavaScript 动画： JavaScript 动画是通过编写 JavaScript 代码来操作 DOM 元素的样式和属性，从而实现动画效果。您可以使用 setTimeout、setInterval 或现代的动画库（如 GreenSock Animation Platform）来创建 JavaScript 动画。
- CSS3 动画： CSS3 动画是使用 CSS3 的动画属性和关键帧动画来定义和控制动画效果。您可以通过在 CSS 中定义关键帧和过渡效果来创建 CSS3 动画。

**性能：**

- JavaScript 动画： JavaScript 动画可以在更复杂的动画场景下提供更多的控制和灵活性，但性能取决于代码的质量。不合理的 JavaScript 动画可能导致性能问题，因为它们通常需要大量的计算。
- CSS3 动画： CSS3 动画通常更具性能优势，因为浏览器可以使用硬件加速来处理它们，而不需要 JavaScript 的运行时计算。CSS3 动画通常更流畅和高效，特别是在简单的过渡效果中。

**适用场景：**

- JavaScript 动画： 适用于需要更多控制和互动性的场景，例如游戏、用户交互和需要基于条件的动画。JavaScript 动画可以响应用户输入，并在运行时根据条件调整动画。
- CSS3 动画： 适用于简单的过渡效果、页面加载动画、滑动效果、渐变等。CSS3 动画是为了更好的性能和可维护性而设计的，适合许多常见的动画需求。

**可维护性：**

- JavaScript 动画： JavaScript 动画可能需要更多的代码和维护工作，尤其是对于复杂的动画效果。它们通常需要手动处理动画的每一帧。
- CSS3 动画： CSS3 动画通常更容易维护，因为它们将动画效果与样式分开，可以在样式表中轻松修改动画的属性和参数。

---

## Q85｜获取元素位置？

1. getBoundingClientRect() 方法： 
2. offsetTop 和 offsetLeft 属性： 
3. pageX 和 pageY 属性： 
4. clientX 和 clientY 属性：

---

## Q86｜document.write 和 innerHTML 的区别？

1. **输出位置：**

- document.write：document.write 方法将内容直接写入到页面的当前位置，它会覆盖已存在的内容。如果它在页面加载后调用，它会覆盖整个页面内容，因此通常不建议在文档加载后使用它。
- innerHTML：innerHTML 是 DOM 元素的属性，可以用来设置或获取元素的 HTML 内容。它可以用于特定元素，而不会覆盖整个页面。

1. **用法：**

- document.write：通常用于在页面加载过程中动态生成 HTML 内容。它是一种旧的、不太推荐的方法，因为它可能导致页面结构混乱，不易维护。
- innerHTML：通常用于通过 JavaScript 动态更改特定元素的内容。它更加灵活，允许您以更精确的方式操作 DOM。

1. **DOM 操作：**

- document.write：不是 DOM 操作，它仅用于输出文本到页面。
- innerHTML：是 DOM 操作，允许您操作特定元素的内容，包括添加、删除和替换元素的 HTML 内容。

---

## Q87｜mouseover 和 mouseenter 的区别

- **触发时机：**
- mouseover：当鼠标指针从一个元素的外部进入到元素的范围内时触发该事件。它会在进入元素内部时触发一次，然后在鼠标在元素内部（有子元素）移动时会多次触发。
- mouseenter：当鼠标指针从一个元素的外部进入到元素的范围内时触发该事件。不同于 mouseover，mouseenter 只在第一次进入元素内部时触发一次，之后鼠标在元素内部移动不会再次触发。
- **冒泡：**
- mouseover 会冒泡，也就是说当鼠标进入子元素时，父元素的 mouseover 事件也会被触发。
- mouseenter 不会冒泡，只有在真正进入指定元素时触发。
- **应用场景：**
- mouseover 更常用于需要监听鼠标进入和离开元素的情况，特别是当需要处理子元素的情况。
- mouseenter 更常用于只需要在鼠标第一次进入元素时触发事件的情况，通常用于菜单、工具提示等需要忽略子元素的场景。

---

## Q88｜元素拖动实现方案

普通位置拖动推荐 Pointer Events，完整示例见 Q129：按下时记录位置、设置指针捕获，移动时更新 transform 或定位属性，结束和取消时清理。拖放文件和跨容器数据交换更适合 HTML Drag and Drop。频繁移动应尽量用 transform 并合并绘制，避免每次移动都触发同步布局计算。

---

## Q89｜script 标签 async 和 defer 的区别

- **默认情况（无 async 和 defer 属性）：** 如果 <script> 标签既没有 async 属性，也没有 defer 属性，浏览器会按照标签在 HTML 中的顺序，阻塞页面渲染，下载后并同步加载脚本，脚本会阻塞页面的加载和渲染。
- **async 属性：** 如果 <script> 标签带有 async 属性，脚本将异步下载并执行，不会阻塞页面的加载和渲染。脚本将在下载完成后立即执行，而不管其在文档中的位置。
- **defer 属性：** 如果 <script> 标签带有 defer 属性，脚本也会异步下载，但不会立即执行。它将在文档解析完成（DOMContentLoaded 事件之前）时按照它们在文档中的顺序执行。
- **总结：**如果没有指定 async 或 defer 属性，脚本默认是同步的，会阻塞页面加载。如果使用 async 属性，脚本会异步加载和执行。如果使用 defer 属性，脚本也会异步加载，但在文档解析完成后按顺序执行。根据页面性能和脚本执行时机的需求，您可以选择适当的属性。

---

## Q90｜ES6 的继承和 ES5 的继承的区别

**ES6 类继承：**

1. **Class 和 extends 关键字：** ES6 引入了 class 和 extends 关键字，使得创建类和继承更加直观和易于理解。类提供了一种更面向对象的编程方式。
2. **构造函数：** ES6 类继承通过构造函数 constructor 定义类的初始化逻辑，并通过 super 调用父类的构造函数。这使得继承更加符合直觉。
3. **方法定义：** 类中的方法不再需要使用原型链，而是可以直接定义在类内部。这让方法的定义更集中和易读。
4. **super 关键字：**super 关键字用于在子类中调用父类的方法，包括构造函数和普通方法。

**ES5 原型继承：**

- **原型链继承：**

**缺点：**

- 属性共享： 子类共享了父类原型上的属性，一旦父类有引用类型，其中一个实例修改了这个引用类型的属性值，会会影响所有其他实例。
- 不能传递参数： 无法向父类构造函数传参，因为父类构造函数已经被调用。
- **构造函数继承：**

在这个示例中，Dog 构造函数内部调用了 Animal 构造函数，从而继承了 Animal 的属性。

**缺点：**

- 属性 继承 ：构造函数继承只继承了父类的属性，而没有继承父类的方法。子类无法访问父类原型上的方法。
- 属性复制：将属性复制到子类实例中，而不是通过原型链共享。导致内存浪费，特别创建大量实例时。
- 不能 继承 方法： 子类无法继承父类原型上的方法，因此会导致代码重复和内存浪费。
- **寄生组合继承**

结合了构造函数继承和原型继承，通过在子类构造函数内部调用父类构造函数来继承属性，然后通过 Object.create() 方法来继承父类原型上的方法。克服构造函数继承和原型继承各自的缺点。

首先使用构造函数继承来继承属性，然后使用 Object.create(Animal.prototype) 继承了父类的原型。这种方式避免了原型链中属性共享的问题，并允许更灵活地定义子类的构造函数和方法。

---

## Q91｜Promise

Promise 是 JavaScript 中处理异步操作的一种模式和对象，它提供了一种更优雅的方式来处理异步代码，尤其是处理回调地狱（callback hell）问题

- **Promise有三种状态：**
- Pending（进行中）：Promise的初始状态，表示异步操作尚未完成，也不失败。
- Fulfilled（已完成）：表示异步操作成功完成，其结果值可用。
- Rejected（已失败）：表示异步操作失败，包含失败的原因。
- **模拟实现：**

---

## Q92｜Promise all/allSettle/any/race 的使用场景

- Promise.all
- Promise.allSettled
- Promise.any
- Promise.race

---

## Q93｜如何解决异步回调地狱

**定义：**异步回调地狱是指在嵌套的回调函数中处理多个异步操作，导致代码变得混乱和难以维护的情况。

**解决方案：**

- **使用 Promise 对象：** Promises 出现主要为解决异步回调地狱，是一种处理异步操作的方式，它允许你链式调用 .then() 方法，以便更清晰地处理异步操作。这减少了回调嵌套的问题。
- **使用 async/await：** async/await 是 ES6 的异步处理方式，它允许你使用类似同步代码的方式来处理异步操作。这使得代码更具可读性。
- **Generators 和 yield：** 使用生成器函数和 yield 关键字来编写可暂停和可恢复的异步代码，以更容易处理复杂的异步流程。
- **使用库和工具：** 使用异步控制库（如Async.js）或工具（如RxJS）处理异步操作，提高代码的可读性和维护性。
- **模块化和拆分代码：** 将异步操作拆分为小的、可重用的函数或模块，在主代码中调用，减少嵌套的回调函数。

---

## Q94｜链式调用实现方式

链式调用是通过在对象的方法中返回对象自身（this）来实现的。可使多个方法调用连续写在一起，形成链式调用。

---

## Q95｜new 操作符内在逻辑

普通构造过程可以概括为创建对象、把原型关联到构造函数 prototype、以该对象作为 this 调用构造函数，再依据返回值确定最终结果。若返回对象或函数，就使用返回值；返回基本值则保留创建的对象。手写 apply 版本无法调用 class，也不能完整模拟 new.target 等规则，真实动态构造应使用 Reflect.construct。

```js
const instance = Reflect.construct(Constructor, args);
```

---

## Q96｜bind，apply，call 的区别，及内在实现

- **call 方法：**
- 用于调用一个函数，显式指定函数内部的 this 指向，参数以列表的形式传递给函数。
- 语法：func.call(thisArg, arg1, arg2, ...)
- 直接调用函数，立即执行。
- 用法 与 模拟实现：
- **apply 方法：**
- 用于调用一个函数，显式指定函数内部的 this 指向，参数以数组的形式传递给函数。
- 语法：func.apply(thisArg, [arg1, arg2, ...])
- 用法 与 模拟实现：
- **bind 方法：**
- bind 方法不会立即调用函数，而是创建一个新的函数，该函数的 this 指向由 bind 的第一个参数指定，参数以列表的形式传递给函数。
- 语法：newFunc = func.bind(thisArg, arg1, arg2, ...)
- 不会立即执行函数，而是返回一个新函数。
- 用法 与 模拟实现：

---

## Q97｜Ajax 避免浏览器缓存方法

Http 请求时，有时浏览器会缓存响应数据，以提高性能。但在某些情况下，你可能希望禁用缓存或控制缓存行为，以确保获得最新的数据。以下是解决浏览器缓存问题的方法：

- **添加时间戳或随机参数：**

在 Ajax 请求的 URL 中添加一个时间戳或随机参数，以使每个请求看起来不同，从而防止缓存。例如：

- **禁用缓存头信息：**

可以在请求头中添加 Cache-Control: no-cache 或 Pragma: no-cache，告诉服务器不使用缓存。

- **设置响应头：**

服务器可以在响应头中设置缓存控制信息，以告诉浏览器不要缓存响应。

- **使用 POST 请求：**

GET 请求通常更容易被浏览器缓存，而 POST 请求通常不会被缓存。如果没有特殊需求，可以考虑使用 POST。

---

## Q98｜eval 的功能和危害

eval 是 JavaScript 中的一个全局函数，用于将包含 JavaScript 代码的字符串作为参数，并执行该代码。它的作用是动态执行字符串中的 JavaScript 代码，可以在运行时生成 JavaScript 代码并执行它。

例如，你可以使用 eval 来执行动态生成的表达式或函数。

eval 函数具有潜在的危害，主要包括以下几个方面：

1. **安全风险：** 使用 eval 可能会导致安全漏洞，因为它允许执行来自不受信任的来源的代码。如果恶意代码被注入到 eval 中，它可能会访问和修改你的应用程序的敏感数据，甚至执行恶意操作。
2. **性能问题：**eval 的使用会导致性能下降，因为它需要在运行时解析和执行代码。这可能会影响应用程序的响应时间，特别是在循环中频繁使用 eval 的情况下。
3. **可读性问题：** 使用 eval 会使代码变得难以理解和维护。由于它执行的代码是字符串，很难进行分析和调试。
4. **移植性问题：** 依赖 eval 的代码可能不具备良好的移植性，因为不同的 JavaScript 引擎对 eval 的实现可能有差异，从而导致代码在不同环境中出现问题。
5. **限制代码优化：**eval 的存在可能会阻碍 JavaScript 引擎的代码优化，因为它使得引擎难以进行静态分析和优化，从而影响性能。

因此，通常情况下，应该尽量避免使用 eval，特别是在处理来自不受信任的源的数据时。如果需要动态执行代码，可以考虑使用其他更安全的方式，例如使用函数、Function 构造函数、闭包等。

---

## Q99｜惰性函数

惰性函数是指在第一次调用时执行特定操作，之后将函数重写或修改，以便在以后的调用中直接返回缓存的结果，而不再执行该操作。这通常用于性能优化，以避免重复执行开销较大的操作。

---

## Q100｜JS 监听对象属性的改变

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

---

## Q101｜prototype  和  \_\_proto\_\_  的 区别与关系

- **prototype：**
- 函数对象（构造函数）特有属性，每个函数对象都有一个 prototype 属性，它是一个对象。
- 通常用于定义共享的属性和方法，可以被构造函数创建的实例对象所继承。可以在构造函数的 prototype 上定义方法，以便多个实例对象共享这些方法，从而节省内存。
- 主要用于原型继承，它是构造函数和实例对象之间的链接，用于共享方法和属性。
- **\_\_proto\_\_：**
- 每个对象（包括函数对象和普通对象）都具有的属性，它指向对象的原型，也就是它的父对象。
- 用于实现原型链，当你访问一个对象的属性时，如果对象本身没有这个属性，JavaScript 引擎会沿着原型链（通过 \_\_proto\_\_ 属性）向上查找，直到找到属性或到达原型链的顶部（通常是 Object.prototype）。
- 主要用于对象之间的继承，它建立了对象之间的原型关系。
- **总结：**prototype 和 **\_\_proto\_\_** 是不同的，但它们在 JavaScript 中一起用于实现原型继承。构造函数的 prototype 对象会被赋予给实例对象的 **\_\_protpo\_\_** 属性，从而建立了原型链。

首先定义了一个构造函数 Person，然后在构造函数的 prototype 上定义了一个方法 sayHello。接着，创建了一个 person1 实例对象，并访问了它的属性和方法。最后，验证了 person1 实例对象的 **proto** 属性确实指向构造函数 Person 的 prototype 对象，建立了原型链关系。

---

## Q102｜原型链的实践 - 以下代码输出2的原因

输出结果为 2，当 js 尝试访问一个方法的属性时，首先会在实例本身去寻找，找不到就会往 prototype 上找，在该案例中，foo 实例本身就拥有了 a 方法，所以就会直接执行，输出2。

所以，当 Foo 中没有 a 方法时，就会寻找到 prototype 上的 a 方法，输出 3。

而 Foo.a 则是 Foo 的静态方法，通过 Foo.a() 直接执行。

---

## Q103｜如何理解 箭头函数 没有 this

所谓的没有 this，不是箭头函数中没有 this 这个变量，而是箭头函数不绑定自己的 this，它们会捕获其所在上下文的 this 值，作为自己的 this 值。这对于回调函数特别有用，可以避免传统函数中常见的 this 指向问题。例如，在对象方法中使用箭头函数可以确保 this 保持一致。

---

## Q104｜上下文与 this 指向

普通函数的 this 主要由调用方式决定：obj.fn() 的接收者是 obj，call/apply/bind 可指定接收者，new 为构造调用创建接收者。独立调用在严格模式下 this 为 undefined。箭头函数不创建自己的 this，而是从定义位置的词法环境取得。对象把方法传给回调时会失去原接收者，应显式绑定或包一层函数。

---

## Q105｜上下文与 this 指向 （1）

原导入内容没有完整代码，以下独立示例说明“方法被取出后丢失接收者”。obj.read() 返回 1；把 read 赋给变量再独立调用，在 ES module 的严格模式下 this 是 undefined，访问 this.value 会抛错。bind 返回固定接收者的新函数，不能依靠变量名字决定 this。

```js
const obj = { value: 1, read() { return this.value; } };
const read = obj.read;
obj.read(); // 1
obj.read.bind(obj)(); // 1
// read(); // 严格模式下 TypeError
```

---

## Q106｜上下文与 this 指向（2）

原题未保留完整代码，以下示例展示普通方法内创建的箭头函数继承方法调用时的 this。bind/call 无法改写箭头函数已经捕获的 this。若直接把箭头函数写成对象字面量属性，它捕获的是外层环境而不是该对象。

```js
const obj = { value: 2, make() { return () => this.value; } };
const read = obj.make();
read.call({ value: 9 }); // 2
```

---

## Q107｜去除字符串首尾空格

trim 返回去掉两端空白的新字符串，不修改原字符串；trimStart 与 trimEnd 分别处理一端。它处理规范中的空白和行终止符，不会删除字符串中间的空格，也不等同于去掉所有 Unicode 不可见字符。不要为此使用 replace(/\s/g, "")，那会同时改变中间内容。

```js
'  hello world
'.trim(); // 'hello world'
```

---

## Q108｜Symbol 特性与作用

1. **唯一性：**每个Symbol值都是唯一的，即使它们具有相同的描述字符串，它们也不相等。
2. **不可枚举：**Symbol类型的属性通常是不可枚举的，这意味着它们不会出现在for...in循环中。
3. **用作属性名：**主要用途是作为对象属性的键，以确保属性的唯一性。
4. **Symbol常量**：在代码中，可以使用Symbol来定义常量，以避免意外的值修改。

---

## Q109｜String 的 startwith 和 indexof 两种方法的区别

- **startsWith：**
- 字符串对象的方法，用于检查字符串是否以指定的子字符串开始。
- 返回一个布尔值，如果字符串以指定的子字符串开头，则返回 true，否则返回 false。
- 可以接受两个参数，第一个参数是要查找的子字符串，第二个参数是可选的，表示开始搜索的位置。
- **indexOf：**
- 字符串对象的方法，用于查找子字符串在字符串中第一次出现的位置。
- 返回子字符串在字符串中的索引位置，如果没有找到子字符串，返回 -1。
- 可以接受两个参数，第一个参数是要查找的子字符串，第二个参数是可选的，表示开始搜索的位置。

---

## Q110｜字符串转数字的方法

Number 要求整体可转换，parseInt/parseFloat 可以解析开头的数值片段。parseInt 应明确进制；空字符串经 Number 转换为 0，而非法整体返回 NaN。用 Number.isNaN 判断结果是否是 NaN，用 Number.isSafeInteger 检查整数精度；超大整数可在合法输入下使用 BigInt。

```js
Number('12px'); // NaN
parseInt('12px', 10); // 12
parseFloat('3.5rem'); // 3.5
Number(''); // 0
```

---

## Q111｜promise 和 await/async 的关系

- Promise：一种用于处理异步操作的对象，它代表了一个异步操作的最终完成或失败，并允许在异步操作完成后执行相关的代码。Promise提供了一种更灵活的方式来管理异步代码，尤其是在处理多个异步操作的情况下。
- async/await：一种构建在Promise之上的语法糖。它是 ECMAScript 2017 (ES8) 引入的特性，旨在简化异步代码的编写和理解。async 函数返回一个Promise，允许在函数内使用 await 关键字等待异步操作完成。

**关系：**

- async 函数返回一个Promise对象。这意味着你可以在async函数内使用await来等待一个Promise对象的解决。await暂停async函数的执行，直到Promise状态变为 resolved（成功）或 rejected（失败）。
- async/await 是一种更直观的方式来处理Promise，可以避免嵌套的回调函数（回调地狱）。

---

## Q112｜Array.propertype.sort 在 V8 的实现机制

**知识点：**默认情况下都会把数组项，转换为 字符串 进行比较

**V8 版本查看方式：**

![](./images/interview/大前端面试宝典-image-26.png)

![](./images/interview/大前端面试宝典-image-24.png)

**5.9版本以前：**用 Javascript 语言实现（不稳定）

***源码地址：****https://github.com/v8/v8/blob/5.9.221/src/js/array.js*

- 数组项 0 \\\~ 10 以内：插入排序
- 数组项 10 \\\~ 1000 以内：常规快速排序
- 数组项大于 1000：优化快速排序（快排中间值通过多个中间值求得）

**7.6版本以后：**用 Torque 语言实现（稳定）

***源码地址：****https://github.com/v8/v8/blob/main/third_party/v8/builtins/array-sort.tq*

- 采用 timSort 算法实现

---

## Q113｜JS 装箱机制（auto boxing）

为什么以下代码第二行输出 true，第三行输出 false？

首先，基础类型是没有 \_\_proto\_\_ 的，第二行之所以会输出 true，是因为触发了 js 的 autoboxing 机制，也叫装箱机制，当一个基础类型尝试访问 \_\_propt\_\_ 时，js 会把基础类型临时装箱，理解为 const a = new Number(1)，所以第二行会输出 true，而第三行没有触发装箱机制，因此输出 false。

---

## Q114｜函数传值

EcmaScript 中的所有参数都按值传递的。不可能按引用传递参数。如果把对象作为参数传递，那么传递的就是这个对象的地址。 ------- 《Javascript 高级程序设计（第四版）》（红宝书）-- （292页）

---

## Q115｜不同类型宏任务的优先级

刷新页面后，点击 test 按钮，5s 后页面会输出什么？

当页面初始化时，生成了一个延时类型宏任务，并且页面会被阻塞5秒，而在这5s内，点击 test 按钮，新创建了交互类型的宏任务，而交互类型的宏任务优先级要高于延时类型，因此最终页面会先输出 click，再输出 setTimeout。

---

## Q116｜console.log  被重写，重新获取的方法

最可靠的做法是在被覆盖前保存已绑定的引用，例如 const log=console.log.bind(console)。如果原引用已经丢失，没有一个跨环境通用的“恢复原方法”接口；可以刷新隔离的开发页面，或在开发工具中检查覆盖来源。新 iframe 的 console 属于另一个 realm，受沙箱和跨源限制，也不应成为线上依赖。

```js
const originalLog = console.log.bind(console);
console.log = () => {};
originalLog("仍可输出");
```

---

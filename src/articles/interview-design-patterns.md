---
id: "interview-design-patterns"
title: "设计模式面试题"
category: "设计模式"
description: "收录 Q261–Q289 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["设计模式","架构","面试"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 109
status: draft
quality: complete
sources: ["https://www.oreilly.com/library/view/design-patterns-elements/0201633612/"]
technologyVersion: "GoF 1994 模式术语；JavaScript 场景解释"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://www.oreilly.com/library/view/design-patterns-elements/0201633612/)。


## Q261｜设计模式是什么

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

设计模式描述反复出现的设计问题、适用情境、职责协作与权衡，提供可沟通的方案词汇。它不是可直接复制的完整程序，也不保证优于简单实现。

GoF 常按创建型、结构型、行为型分类；MVC/MVVM 则更偏 UI 架构。选用时先明确变化点与耦合成本，再判断组合、函数或对象是否足够，避免为了套模式增加多余层次。

参考：[资料 1](https://refactoring.guru/design-patterns/)。

---

## Q262｜设计模式的意义

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

设计模式的价值在于描述清晰边界、隔离变化并建立团队共同词汇。例如策略便于替换算法，适配器隔离旧接口，观察者组织变化通知。

模式不会自动提高性能或降低错误率；更多对象、间接调用和共享状态也有成本。应通过可读性、测试便利度和真实需求验证收益，在扩展需求尚不明确时优先保持简单。

参考：[资料 1](https://refactoring.guru/design-patterns/)。

---

## Q263｜什么是 MVC

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

MVC 将 Model（领域数据与规则）、View（呈现）和 Controller（解释用户输入并协调操作）分开。业务不变量应留在领域模型或服务，而不是把控制器变成所有逻辑的堆积点。

Web MVC 和桌面 MVC 的通信细节可能不同，不宜背成唯一箭头图。分层让接口与规则可独立测试，但边界变化仍可能影响多层，不能承诺各层永不相互影响。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Glossary/MVC)。

---

## Q264｜什么是 MVVM

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

MVVM 用 ViewModel 提供视图需要的状态、派生值与命令，Model 保存领域规则，View 展示并转发用户意图。ViewModel 尽量不直接依赖具体 DOM，便于独立测试。

数据绑定常用于同步视图与 ViewModel，但双向绑定不是全部定义。Vue 的 v-model 是值与事件的约定；Proxy/defineProperty 支持响应式数据追踪，本身不会自动完成从输入事件到状态的写回。

参考：[资料 1](https://learn.microsoft.com/en-us/dotnet/architecture/maui/mvvm)。

---

## Q265｜有了 mvc 为什么要有 mvvm

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

MVVM 适合视图状态、格式转换与交互命令很多的场景，将这些展示相关逻辑集中到 ViewModel，可减少控制器和视图中的重复同步代码。它是对不同问题的结构选择，不是 MVC 失效后的必然升级。

简单页面的额外 ViewModel 可能徒增成本；复杂领域规则仍属于 Model/服务，不应都迁移进 ViewModel。实际项目可混用服务端 MVC 和客户端 MVVM，按测试与维护边界选择。

参考：[资料 1](https://learn.microsoft.com/en-us/dotnet/architecture/maui/mvvm)。

---

## Q266｜实现一个 mvvm 示例

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

MVVM 把视图操作交给 ViewModel：输入事件把 View 写回 Model，响应式状态变化再驱动 View。下面是教学版，只演示一个 name 字段；真实框架还要处理依赖收集、批量更新、模板编译、数组/集合、嵌套对象和组件卸载。

```html
<label>姓名 <input id="name" /></label>
<p>你好，<span id="preview"></span></p>
```

```js
function createViewModel(initial, bindings) {
  const render = (key, value) => bindings[key]?.write(value);
  const state = new Proxy({ ...initial }, {
    set(target, key, value) {
      if (Object.is(target[key], value)) return true;
      target[key] = value;
      render(key, value);
      return true;
    },
  });
  for (const [key, binding] of Object.entries(bindings)) {
    binding.listen((value) => { state[key] = value; });
    render(key, state[key]);
  }
  return state;
}

const input = document.querySelector('#name');
const preview = document.querySelector('#preview');
const vm = createViewModel({ name: 'Ada' }, {
  name: {
    write(value) { input.value = value; preview.textContent = value; },
    listen(update) { input.addEventListener('input', (event) => update(event.target.value)); },
  },
});

vm.name = 'Grace'; // 数据变化同步到输入框和文本
```

这个示例中的 Proxy 只拦截顶层赋值，listen 也没有返回清理函数，不能直接作为生产框架。面试时应区分“展示 MVVM 数据流”与“复刻 Vue 响应式源码”。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) · [资料 2](https://learn.microsoft.com/en-us/dotnet/architecture/maui/mvvm)。

---

## Q267｜面向对象基本特性

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

封装通过接口保护内部状态与不变量；抽象只暴露调用方需要的能力；继承表达可替换的类型关系；多态让不同实现响应相同操作。JavaScript 可用原型、类、闭包及鸭子类型实现这些思想。

下划线命名并不真正私有，私有字段可用 #field；继承也不是代码复用的唯一方式。若子类破坏父类契约，应考虑组合而不是继续扩展层级。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Advanced_JavaScript_objects/Object-oriented_programming)。

---

## Q268｜面向对象的设计原则

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

SOLID 包括单一职责、开闭、里氏替换、接口隔离和依赖倒置。它们关注变化原因、扩展边界、行为契约、调用方所需接口，以及高层策略与底层细节的依赖方向。

依赖倒置不等于必须引入 DI 容器；函数参数也可注入实现。开闭原则不意味着永远不能修改旧代码，单一职责也不是每个类只能有一个方法。再结合组合优于继承和最少知识原则，按需求控制复杂度。

参考：[资料 1](https://en.wikipedia.org/wiki/SOLID)。

---

## Q269｜单例模式（Singleton Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

单例在约定作用域内共享一个实例，例如当前页面配置服务。模块导出的对象可作为简单实现，但多标签页、Worker、服务进程和重复打包的模块并不自动共享。隐藏全局状态不利测试和 SSR 请求隔离，应暴露依赖与生命周期，避免把用户数据放在跨请求单例中。

参考：[资料 1](https://refactoring.guru/design-patterns/singleton)。

---

## Q270｜工厂模式（Factory Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

工厂把创建决策与使用者分开，调用者面向共同接口，例如根据配置得到本地或远程存储。简单工厂用条件创建对象；工厂方法允许子类决定具体产品；抽象工厂创建一族配套产品。不要把这三者混为一个固定类图，JavaScript 中普通函数常已足够。

参考：[资料 1](https://refactoring.guru/design-patterns/factory-method)。

---

## Q271｜建造者模式（Builder Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

建造者分步骤构造复杂结果，例如查询条件、导出报告；最终 build 应校验必需参数并说明是否返回独立快照。链式调用只是表达形式，不自动构成该模式。可变 builder 若复用，应防止上次配置污染下一次结果；少量参数通常直接用对象更清晰。

参考：[资料 1](https://refactoring.guru/design-patterns/builder)。

---

## Q272｜原型模式（Prototype Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

原型模式通过复制已有实例创建新实例，适合有模板状态或初始化复杂的对象。要定义浅/深复制、共享资源及身份字段如何处理。它不同于 JavaScript 原型链：Object.create 建立委托关系，不复制自有属性；structuredClone 也不能克隆函数或保留任意自定义类行为。

参考：[资料 1](https://refactoring.guru/design-patterns/prototype)。

---

## Q273｜适配器模式（Adapter Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

适配器把现有接口转换成调用方期待的接口，例如将旧 API 的字段与错误格式规范化。它隔离兼容细节，便于逐步替换供应方。除了字段映射，还要保留取消、超时、分页与失败语义；不能用默认空值悄悄吞掉接口错误。

参考：[资料 1](https://refactoring.guru/design-patterns/adapter)。

---

## Q274｜装饰者模式（Decorator Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

装饰者在保持接口契约的同时叠加行为，例如给请求函数加日志或重试。多个包装的顺序有意义：鉴权、缓存和重试次序会改变语义。需要保留 this、返回类型、错误与取消行为；不要把 GoF 装饰模式与某个版本的 JavaScript @decorator 语法直接等同。

参考：[资料 1](https://refactoring.guru/design-patterns/decorator)。

---

## Q275｜观察者模式（Observer Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

观察者让被观察对象维护订阅者，在状态变化时通知它们，适合状态更新与事件监听。发布订阅通常增加消息总线或主题层，发送者与接收者可进一步解耦，两者相关但结构不完全相同。必须提供取消订阅，并约定通知顺序、重入、异常隔离与监听中增删订阅的行为，防止泄漏和循环通知。

参考：[资料 1](https://refactoring.guru/design-patterns/observer)。

---

## Q276｜策略模式（Strategy Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

策略把可互换算法封装成统一调用接口，如地区运费、排序方式或校验器。JavaScript 可用函数映射选择策略，不必为每项创建类。适用于同一目标有多种算法的变化点；非法策略需要明确失败或默认行为，不能任由外部输入执行任意对象属性。

参考：[资料 1](https://refactoring.guru/design-patterns/strategy)。

---

## Q277｜命令模式（Command Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

命令将操作及其参数封装，使调用方可排队、记录或延迟执行，例如编辑器的插入文字命令。撤销需要保存逆操作或先前状态，不是封装后天然具备。网络副作用可能不可逆，重试要考虑幂等；日志中也不能直接持久化敏感参数。

参考：[资料 1](https://refactoring.guru/design-patterns/command)。

---

## Q278｜状态模式（State Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

状态模式把不同状态下的行为委托给相应实现，例如订单待支付、已支付、已取消分别允许不同动作。与策略相比，重点是生命周期中的合法迁移，迁移可改变后续行为。应显式定义非法操作与异步失败恢复；前端状态机不能代替服务端对真实订单状态的校验。

参考：[资料 1](https://refactoring.guru/design-patterns/state)。

---

## Q279｜访问者模式（Visitor Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

访问者将操作与较稳定的数据结构分离，例如对 AST 分别执行打印、校验与统计。新增操作较方便，但新增节点类型通常要求更新多个访问者；这是它的重要权衡。JavaScript 常用节点 type 到处理函数的映射，不一定模拟完整双分派；要处理未知节点与递归深度。

参考：[资料 1](https://refactoring.guru/design-patterns/visitor)。

---

## Q280｜模板方法模式（Template Method Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

模板方法固定算法骨架，让子类覆盖有限步骤，例如导入中的读取、解析、校验、保存。调用顺序和不变量由骨架维护，不能让任意覆盖破坏流程。若变化只是少量算法，函数参数或策略组合常更直接；基类构造中调用可覆盖方法可能访问未初始化子类状态。

参考：[资料 1](https://refactoring.guru/design-patterns/template-method)。

---

## Q281｜中介者模式（Mediator Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

中介者集中协调一组对象之间的交互，例如表单各字段联动由协调器处理，而非每个控件互相引用。它减少参与者之间的耦合，却可能把复杂度集中为巨型中介对象。需要按职责拆分协调范围，明确事件流，避免中介与参与者互相反复触发。

参考：[资料 1](https://refactoring.guru/design-patterns/mediator)。

---

## Q282｜备忘录模式（Memento Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

备忘录捕获对象状态以便恢复，例如编辑器撤销历史。快照应保护对象封装，并说明浅拷贝还是独立副本；共享可变子对象会破坏历史。大状态可采用不可变结构或增量补丁并限制历史大小；外部网络/文件副作用不会因恢复内存快照自动撤销。

参考：[资料 1](https://refactoring.guru/design-patterns/memento)。

---

## Q283｜解释器模式（Interpreter Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

解释器定义一个小语言的语法及求值规则，例如筛选条件中的 AND/OR/比较表达式。先解析到受控 AST，再按允许操作执行，限制输入大小和递归复杂度。不应使用 eval 直接执行用户表达式；语法变复杂时选择成熟解析器并提供错误位置。

参考：[资料 1](https://en.wikipedia.org/wiki/Interpreter_pattern)。

---

## Q284｜享元模式（Flyweight Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

享元共享许多对象中不变的内部状态，把位置、用户等外部上下文由调用方提供，例如字形共享字体描述。共享内容应不可变，缓存键和生命周期必须明确。实例差异很大或共享表无限增长时可能反而浪费内存，应先测量重复数据占比。

参考：[资料 1](https://refactoring.guru/design-patterns/flyweight)。

---

## Q285｜责任链模式（Chain of Responsibility Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

责任链让请求沿一组处理者传递，每项决定处理、拒绝或交给下一项，例如校验链与中间件。必须约定是否短路、异常如何传播和链尾默认行为。Koa 的 await next() 还形成前后包裹的洋葱顺序，不只是单向依次调用；同一次 next 不应重复执行。

参考：[资料 1](https://refactoring.guru/design-patterns/chain-of-responsibility)。

---

## Q286｜桥接模式（Bridge Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

桥接将两个独立变化维度通过组合连接，例如形状与 Canvas/SVG 渲染器，使新增形状无需为每种后端复制子类。抽象依赖稳定实现接口，各维度可分别扩展。它关注预先解耦变化维度；适配器更多解决既有接口不兼容，二者不能只按是否包装对象区分。

参考：[资料 1](https://refactoring.guru/design-patterns/bridge)。

---

## Q287｜组合模式（Composite Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

组合模式让叶节点与容器提供统一接口，容器递归委托子节点，例如文件/目录统计大小。应明确哪些操作仅容器支持，避免叶节点暴露无意义 add/remove。还需防止环、共享节点重复计算和极深递归；树结构假设要在边界验证。

参考：[资料 1](https://refactoring.guru/design-patterns/composite)。

---

## Q288｜迭代器模式（Iterator Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

迭代器用统一接口访问集合而不暴露存储细节。JavaScript 可迭代对象通过 Symbol.iterator 返回带 next() 的迭代器，next 返回 {value, done}；generator 可简化实现。需要约定重复遍历与迭代中修改集合的行为；异步来源用 Symbol.asyncIterator，提前退出时还要释放资源。

参考：[资料 1](https://refactoring.guru/design-patterns/iterator)。

---

## Q289｜代理模式（Proxy Pattern）

适用：GoF 模式概念；JavaScript ES2024 示例；MVVM 教学模型。

代理通过替身控制目标访问，例如惰性初始化、远程调用或缓存。它侧重访问控制与间接访问，装饰者更侧重叠加职责，接口仍应保留目标的错误、身份与生命周期契约。JavaScript Proxy 是语言机制，能辅助实现但不等于全部代理模式；客户端鉴权代理无法成为服务端安全边界。

参考：[资料 1](https://refactoring.guru/design-patterns/proxy)。

---

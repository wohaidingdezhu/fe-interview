---
id: "interview-typescript"
title: "TypeScript 面试题"
category: "TypeScript"
description: "整理 TypeScript 基础、运行时数据校验与联合类型建模的面试题。"
kind: "知识文章"
tags: ["TypeScript","类型系统","面试"]
addedAt: "2026-10-08"
updatedAt: "2026-11-10"
order: 102
status: draft
quality: complete
sources: ["https://www.typescriptlang.org/docs/handbook/intro.html"]
technologyVersion: "TypeScript Handbook；类型检查与运行时边界见题解"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://www.typescriptlang.org/docs/handbook/intro.html)。


## Q117｜TypeScript 和 JavaScript 的主要区别。

适用：TypeScript 5.x/6.x 类型系统概念；运行时仍为 JavaScript。

TypeScript 是 JavaScript 的带类型超集，增加静态类型系统、类型注解、接口、泛型等编译期能力。它大量依赖类型推断，并不要求每个变量都显式写类型。普通 TypeScript 通常经过 tsc、Babel、SWC 等移除类型语法后生成 JavaScript；类型默认在运行时不存在，不会自动校验接口响应或用户输入。

JavaScript 本身是动态类型语言，也有 class、module、原型继承和现代工具链。浏览器/Node 是否“直接运行”与构建、模块和目标语法有关，不能简单等同于解释执行。TypeScript 的收益是更早发现类型不一致、增强编辑器重构和文档能力；代价包括配置、声明文件、编译时间，以及类型模型与运行时数据仍可能不一致。

参考：[资料 1](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html) · [资料 2](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)。

---

## Q118｜TS 定义变量类型的方法

适用：TypeScript 当前 Handbook。

主要方式是显式类型注解和类型推断：

```ts
const name: string | undefined = getName(); // 注解
const count = 1;                            // 推断为字面量类型 1
let total = 1;                              // 可重赋值，通常拓宽为 number
const direction = 'left' as const;          // 保留字面量类型
const config = { mode: 'dark' } satisfies Config; // 校验但尽量保留具体推断
```

还可通过接口/类型别名、泛型参数、函数返回类型、typeof/索引访问/条件类型等组合类型。类型断言 as T 不会做运行时转换，应在已掌握额外事实时使用，不能拿来绕过错误。

参考：[资料 1](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) · [资料 2](https://www.typescriptlang.org/docs/handbook/type-inference.html)。

---

## Q119｜TypeScript  类型注解（Type Annotations）

适用：TypeScript 当前 Handbook。

类型注解描述编译器应检查的静态类型，可用于变量、参数、返回值、对象属性、类成员等：

```ts
type User = { id: string; name?: string };
function display(user: User): string {
  return user.name ?? user.id;
}
```

能可靠推断时不必重复注解；公共 API、复杂返回值和需要约束的边界更适合显式标注。注解不会生成运行时验证代码，外部 JSON 仍应使用 schema/类型守卫校验后再缩小 unknown。

参考：[资料 1](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)。

---

## Q120｜TypeScript 中的 类型别名 和 交叉类型

适用：TypeScript 当前 Handbook。

**类型别名（Type Aliases）**

类型别名让你可以给一个类型起一个新的名字。这不仅仅限于对象类型，也可以适用于联合类型、元组以及任何其他类型。类型别名定义使用 type 关键字。

**交叉类型（Intersection Types）**

T & U 表示值必须同时满足 T 和 U 的要求，不是运行时对象合并。兼容属性会组合，冲突属性可能收窄为 never，导致没有可构造的值。

```ts
type Named = { name: string };
type Timestamped = { updatedAt: Date };
type RecordItem = Named & Timestamped;
// { value: string } & { value: number } 的 value 为 never
```

参考：[资料 1](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types) · [资料 2](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases)。

---

## Q121｜TypeScript 中的接口（Interfaces）和它们的用途。

适用：TypeScript 当前 Handbook。

接口（Interfaces）是一个非常强大的特性，用于定义对象的结构。接口可以指定一个对象应该有哪些属性以及这些属性的类型。它们是TypeScript进行静态类型检查的重要工具，尤其是在处理复杂数据结构时。接口不仅可以帮助你定义复杂类型，还能提高代码的可读性和维护性，确保在开发过程中使用一致的数据结构。

1. **定义对象结构**

- **函数参数**
- **强制实现特定的类结构**

接口可以被类实现（Implements），这意味着类必须包含接口中定义的所有属性和方法。这是一种确保类满足特定契约的方式。

- **继承**

接口可以继承其他接口，这允许你从一个或多个基接口复制成员，创建出包含所有成员的新接口。

接口只存在于类型检查阶段，不会自动生成运行时基类或校验器。implements 只检查实例侧契约，也不会把接口成员实现复制到类中。TypeScript 采用结构类型系统，通常只要对象形状兼容就能赋值，不要求显式声明 implements。

参考：[资料 1](https://www.typescriptlang.org/docs/handbook/2/objects.html) · [资料 2](https://www.typescriptlang.org/docs/handbook/2/classes.html#implements-clauses)。

---

## Q122｜Typescript  接口（Interface）和类型别名（Type Aliases）  的区别

适用：TypeScript 当前 Handbook。

1. **扩展性：**

- **接口：**可以通过声明合并来扩展。这意味着你可以多次声明同一个接口，并将它们合并为一个。接口支持扩展多个接口，提供了一种强大的方式来构建抽象和契约。
- **类型别名：**不能通过声明合并来扩展。类型别名可以使用交叉类型来实现类似的功能。

1. **使用场景：**

- **接口：**主要用于可扩展的对象形状和类契约。声明合并适合库扩展，但应用内部同名声明也可能意外合并。
- **类型别名：**更适用于定义类型的联合或元组，以及其他需要具体类型组合的场景。类型别名的灵活性更高，可以用来定义几乎任何类型。

1. **声明合并：**

- **接口：**支持。
- **类型别名：**不支持。

1. **继承与交叉类型：**

- **接口：**可以通过 extends 关键字继承其他接口或类。
- **类型别名：**可以通过 & 符号创建交叉类型，也可表达联合、元组、原始类型别名、映射/条件类型等非对象结构。

两者都能描述多数对象形状，也都可递归引用。接口 extends 在属性冲突时通常直接报错，交叉类型可能把冲突属性变成 never；选择应根据是否需要声明合并、开放扩展和非对象类型表达，而不是性能口诀。

参考：[资料 1](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)。

---

## Q406｜接口返回 JSON，为什么 as User 之后仍可能报错？

适用：TypeScript `strict` 模式与 Fetch API。

**面试回答**：`as User` 影响编译器看待值的方式，编译后不会生成字段检查。`response.json()` 负责解析 JSON，合法 JSON 也可能是 `null`、数组，或字段类型与约定不符。把外部数据先接成 `unknown`，验证后再交给业务代码。

例如组件要读取 `user.name.trim()`，接口给出 `{ "name": null }` 时，`as User` 可以让编译通过，实际仍会抛出异常。检查应覆盖对象非空、必填字段存在、字段类型和业务取值范围，成功后构造一个已验证对象。HTTP 状态、JSON 解析与字段校验失败要区分，排查时才能找到真正的故障点。

**追问**：可以把 `fetchJson<User>()` 当校验吗？泛型参数同样只在编译时存在。封装可以额外接收解析函数或 schema，由它在运行时检查，并验证拒绝错类型、缺字段和非法取值的样例。

参考：[TypeScript 类型收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) · [Fetch 标准](https://fetch.spec.whatwg.org/#dom-body-json) · [实战笔记](?article=typescript-api-boundary)。

---

## Q407｜怎样用可辨识联合建模请求状态，并让遗漏分支在编译时报错？

适用：TypeScript `strict` 模式，以下状态用于单次加载，不含后台刷新。

**面试回答**：用共同的字面量字段 `status` 区分各状态，让成功态只持有数据，失败态只持有错误。读到 `status: 'success'` 后，编译器会收窄到带 `data` 的成员。多个独立布尔值和可选字段容易表示出矛盾组合，例如同时成功和失败。

```typescript
type LoadState =
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; message: string };

function describe(state: LoadState): string {
  switch (state.status) {
    case 'loading': return '加载中';
    case 'success': return `共 ${state.data.length} 条`;
    case 'error': return state.message;
    default: {
      const unhandled: never = state;
      throw new Error(`未知状态：${JSON.stringify(unhandled)}`);
    }
  }
}
```

**追问**：新增 `status: 'refreshing'` 会怎样？若未补对应分支，`state` 在 `default` 中仍可能是刷新态，赋给 `never` 时编译报错。若刷新时应保留旧列表，就给刷新态定义必填的 `data`。穷尽检查约束已类型化的状态，API 返回的数据仍需先通过运行时校验。

参考：[TypeScript 可辨识联合与穷尽检查](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking) · [实战笔记](?article=typescript-api-boundary)。

---

## Q410｜satisfies、类型注解和类型断言有什么区别？

适用：TypeScript 4.9 及以上。

**面试回答**：类型注解用声明的类型约束变量的使用；`satisfies` 检查表达式是否兼容指定类型，同时保留表达式更具体的推断信息；`as` 是类型断言，告诉编译器按指定类型看待值，不能代替运行时校验。

例如调色板的每个值允许字符串或 RGB 元组。给对象标注 `Record<颜色, string | RGB>` 后，某个属性通常只能按联合类型使用。用 `satisfies Record<颜色, string | RGB>` 检查对象时，字符串属性仍可直接调用字符串方法，同时对象字面量中的颜色拼写错误会被检查出来。

**追问**：`satisfies` 会让对象变成只读吗？不会。它会参与上下文类型推断，也不保证所有字面量都原样保留。需要只读或字面量类型时，应根据需求使用 `as const`，并确保目标类型允许只读值。外部输入仍需运行时校验。

参考：[TypeScript 4.9 satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)。

---

## Q411｜unknown 和 any 有什么区别？接口错误该如何处理？

适用：TypeScript strict 模式。

**面试回答**：`any` 允许直接访问属性和调用方法，相关类型检查会被跳过。`unknown` 可以接收任意值，但使用前需要收窄或断言。对于接口数据、用户输入和捕获的异常，先使用 `unknown`，再通过 `typeof`、`instanceof` 或字段检查确认可用信息。

**追问**：`catch` 中的值一定是 `Error` 吗？不一定，JavaScript 可以抛出字符串或其他值。可以先用 `error instanceof Error` 读取 `message`，否则显示通用错误并保留原始值供日志记录。跨 iframe 等不同执行环境的 `Error` 可能不通过当前环境的 `instanceof`，需要按数据来源决定是否增加安全的结构检查。

参考：[TypeScript unknown](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#new-unknown-top-type) · [catch 中使用 unknown](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#defaulting-to-the-unknown-type-in-catch-variables)。

---

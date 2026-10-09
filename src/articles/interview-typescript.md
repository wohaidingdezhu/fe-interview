---
id: "interview-typescript"
title: "TypeScript 面试题"
category: "TypeScript"
description: "收录 Q117–Q122 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["TypeScript","类型系统","面试"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
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

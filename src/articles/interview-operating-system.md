---
id: "interview-operating-system"
title: "操作系统基础面试题"
category: "操作系统"
description: "收录 Q290–Q292 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["操作系统","进程","内存"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 110
status: draft
quality: complete
sources: ["https://www.kernel.org/doc/html/latest/"]
technologyVersion: "操作系统通用概念；Unix/Linux 实现因版本而异"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://www.kernel.org/doc/html/latest/)。


## Q290｜0.1 + 0.2 为什么不等于 0.3 ？

适用：IEEE 754 binary64；ECMAScript Number；操作系统通用概念。

JavaScript Number 使用 IEEE 754 binary64。正常数有 1 位符号、11 位指数、52 位显式小数，加上隐含最高位提供 53 位有效二进制精度。0.1、0.2 在二进制中不能有限表示，转换与算术需要舍入，最终和的可表示值不同于 0.3 的可表示值。

```js
console.log(0.1 + 0.2); // 0.30000000000000004
console.log(0.1 + 0.2 === 0.3); // false
```

近似比较应结合绝对/相对容差，Number.EPSILON 不是适合所有数量级的固定误差。金额可按明确单位用安全整数或十进制定点库，仍要规定舍入和溢出边界。

![](./images/interview/大前端面试宝典-image-61.png)

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)。

---

## Q291｜线程与进程的区别

适用：IEEE 754 binary64；ECMAScript Number；操作系统通用概念。

进程通常是地址空间与资源隔离边界；线程是进程内的执行单元，共享地址空间及部分资源，并各自拥有寄存器状态、调用栈等。线程共享内存便于通信，也需要同步以避免竞态。

进程可通过管道、套接字、共享内存等 IPC 通信，不是完全不能共享数据；进程和线程都能并发，多核下也可并行，不能说进程天然“并发性低”。创建、切换与故障隔离成本依平台实现而异，选型应按隔离、CPU 工作和通信需求决定。

参考：[资料 1](https://man7.org/linux/man-pages/man7/pthreads.7.html)。

---

## Q292｜内存中的堆（Heap）和栈（Stack）

适用：IEEE 754 binary64；ECMAScript Number；操作系统通用概念。

调用栈保存调用帧、返回信息及部分局部值，通常按调用进入/返回管理；过深递归可能耗尽栈空间。堆支持生命周期不必服从后进先出的动态分配，管理方式取决于语言，JavaScript 主要由垃圾回收器管理。

不能把“原始值永远在栈、对象永远在堆”当语言规则：闭包、逃逸分析、寄存器分配和内联都会改变物理存储。栈也是运行时增长与管理的结构，并非一律编译期静态分配；内存泄漏与达到内存上限要分别诊断。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management)。

---

---
id: "interview-browser"
title: "浏览器原理面试题"
category: "浏览器"
description: "收录 Q245–Q246 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["浏览器","V8","存储"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 107
status: draft
quality: complete
sources: ["https://html.spec.whatwg.org/","https://developer.mozilla.org/en-US/docs/Web/API"]
technologyVersion: "现代浏览器；实现细节按题内固定版本说明"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://html.spec.whatwg.org/) · [参考 2](https://developer.mozilla.org/en-US/docs/Web/API)。


## Q245｜V8 垃圾回收机制

适用：现代浏览器存储 API；V8 垃圾回收概念，非特定版本源码复刻。

垃圾回收以可达性为基础，从根对象沿引用追踪仍可使用的对象；循环引用本身不一定泄漏，始终被全局缓存、闭包、DOM 监听等持有的无用对象才可能持续存活。

V8 采用分代思想，并结合复制、标记、清扫/整理以及增量、并发、并行技术降低停顿；不同空间和版本策略不同。不能承诺对象在某一时刻立即回收，WeakRef/FinalizationRegistry 也不能用于必须及时释放的资源。排查时看多次操作与 GC 后的堆趋势、保留路径和分配热点，而不是一次内存高峰。

参考：[资料 1](https://v8.dev/blog/trash-talk) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management)。

---

## Q246｜localStorage 、sessionStorage、indexedDB 的区别

适用：现代浏览器存储 API；V8 垃圾回收概念，非特定版本源码复刻。

浏览器存储按用途选择：Cookie 可随匹配请求自动发送，适合会话标识；localStorage/sessionStorage 是同步字符串存储，前者持久、后者主要按顶层浏览上下文隔离；IndexedDB 提供异步结构化数据与事务，适合较大本地数据。Cache API 存储 Request/Response，常与 Service Worker 配合。

配额、隐私模式、清理与跨站分区受浏览器策略影响，不能写死统一容量或永久保留。敏感会话优先评估 Secure/HttpOnly/SameSite Cookie 与服务端校验；JS 可读存储无法抵御同源 XSS。跨设备同步需服务器，不能靠 localStorage 自动实现。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)。

---

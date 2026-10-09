---
id: "interview-performance"
title: "前端性能面试题"
category: "前端性能"
description: "收录 Q247–Q260 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["性能优化","缓存","渲染"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 108
status: draft
quality: complete
sources: ["https://web.dev/articles/virtualize-long-lists-react-window","https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API"]
technologyVersion: "现代浏览器；具体优化需结合测量"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://web.dev/articles/virtualize-long-lists-react-window) · [参考 2](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)。


## Q247｜性能优化相关的参考指标有哪些？

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

当前 Core Web Vitals 关注 LCP（加载）、INP（交互）和 CLS（视觉稳定性）；良好阈值分别为 ≤2.5 秒、≤200 毫秒、≤0.1，按实际访问的第 75 百分位评估，并区分移动端和桌面端。FID 已由 INP 取代。

TTFB、FCP、长任务、请求耗时、JS 错误和业务可用时间辅助定位原因，不能把一次 Lighthouse 分数当全体用户体验。实验室测试用于可重复诊断，RUM 反映真实设备/网络分布；优化前后对齐版本、样本与统计口径。

参考：[资料 1](https://web.dev/articles/vitals)。

---

## Q248｜performance 对象

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

Performance API 提供单调时钟与性能条目。performance.now() 适合测耗时；mark/measure 标记业务阶段；PerformanceObserver 持续观察支持的条目，导航和资源时序优先使用 PerformanceNavigationTiming/ResourceTiming，旧 performance.timing 已弃用。

```js
performance.mark("filter-start");
const result = [1, 2, 3].filter(n => n > 1);
performance.mark("filter-end");
performance.measure("filter", "filter-start", "filter-end");
console.log(result, performance.getEntriesByName("filter").at(-1).duration);
performance.clearMarks("filter-start");
performance.clearMarks("filter-end");
performance.clearMeasures("filter");
```

极短代码的计时受精度、JIT 和噪声影响。跨域资源详细时序受 Timing-Allow-Origin 控制；观察器应按需断开并控制上报量。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Performance) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)。

---

## Q249｜webpack 优化前端性能

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

webpack 层可通过生产模式、tree shaking、按需导入、合理 splitChunks、压缩与 contenthash 降低传输和重复下载。CSS 提取、图片尺寸/格式与字体裁剪也应按业务衡量。

tree shaking 依赖静态分析及正确 sideEffects 标注，错误声明会删除必要副作用。压缩/缓存响应头和 CDN 由部署端提供，打包器不自动使资源离线可用。先分析产物与真实加载路径，避免把拆包后总量不变误认为首屏一定变快。

参考：[资料 1](https://webpack.js.org/guides/tree-shaking/) · [资料 2](https://webpack.js.org/guides/code-splitting/)。

---

## Q250｜如何实现长缓存

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

对内容指纹命名的静态文件设置 Cache-Control: public, max-age=31536000, immutable，内容变化使用新 URL；入口 HTML 通常使用 no-cache 配合 ETag/Last-Modified 重新验证，让用户及时得到新文件引用。no-cache 允许存储但要求验证，no-store 才是不存储。

发布先上传新资产再切入口，并保留旧资产以支持已打开页面与回滚。无指纹文件不能随意标 immutable；用户私有响应不应被共享缓存。浏览器是否复用响应由缓存规则决定，不是“URL 不变就一直缓存”。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)。

---

## Q251｜要遍历 100000000 项的数组如何优化？

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

先减少工作量：服务端聚合、索引、分页、流式处理可能比换循环更有效。一亿个值还会产生显著内存和复制成本，应按类型估算容量，避免只优化 CPU。

CPU 密集计算可放 Web Worker，让主线程保持交互；TypedArray 的 ArrayBuffer 可转移所有权减少复制，但原线程随后不能继续使用被转移的缓冲区。必须在主线程执行的任务可按时间预算切片并让出事件循环。切片不降低总复杂度，也不会把数组自动变为 V8 的某种“快速模式”。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) · [资料 2](https://web.dev/articles/optimize-long-tasks)。

---

## Q252｜延迟加载的方式有哪些？

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

懒加载是在接近使用时才请求资源：图片/iframe 可用 loading="lazy"，模块用动态 import，较复杂可见性判断用 IntersectionObserver。首屏关键内容和 LCP 图片应正常加载或适当提高优先级，避免延迟。

async/defer 调整脚本执行与解析关系，脚本通常仍会立即下载，不能等同于按需加载。不要给 img 的 src 设置空字符串作为通用方案；使用真实地址和原生懒加载更简单。加载失败、骨架尺寸、取消与重试也属于方案的一部分。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading)。

---

## Q253｜图片懒加载和预加载的区别

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

懒加载推迟非关键图片请求，减少首屏竞争；预加载提前获取很快就要使用的关键资源，降低发现延迟。懒加载可用 loading="lazy"；首屏关键图可考虑 link rel="preload" as="image" 或 fetchpriority。

预加载必须与实际 URL、响应式候选和跨域模式匹配，否则可能重复下载；不要预加载整套图库。new Image().src 也能发起请求，但是否复用仍取决于缓存和请求匹配。两种策略按图片重要性分配，而不是全站只能选一种。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)。

---

## Q254｜加载大量图片优化方案

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

先按显示尺寸提供响应式图片 srcset/sizes，选择合适质量和 AVIF/WebP 等格式并保留兼容路径；设置 width/height 或 aspect-ratio 预留空间。首屏关键图优先，屏外图片懒加载，长列表用虚拟化限制 DOM 和解码内存。

CDN 可做尺寸转换与缓存，注意缓存键与回源成本。并非文件越小就越好：解码时间、总像素、网络竞争也会影响体验。监测 LCP、CLS、失败率与滚动内存，及时释放不再需要的对象 URL。

参考：[资料 1](https://web.dev/learn/images/)。

---

## Q255｜CDN 能加速访问资源的原因

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

CDN 将可缓存内容放到离用户网络路径较近的边缘节点，通过路由调度、连接复用、缓存命中与回源优化降低延迟和源站负载。首次 miss 仍需回源，地理近也不一定网络快。

效果依赖缓存键、TTL、命中率、地区覆盖与源站性能。鉴权、Cookie、Vary 和用户数据要正确配置，防止缓存串号。DNS 查询只是调度的一环，不能把 CDN 解释成单纯多台 DNS 服务器。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Glossary/CDN) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)。

---

## Q256｜浏览器的渲染过程，DOM 树和渲染树的区别。

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

浏览器解析 HTML 构建 DOM，解析 CSS 得到样式规则，进行样式计算、布局、绘制与合成。资源发现、脚本执行和网络下载可交错发生，不是所有步骤只按一次直线顺序执行。

DOM 表示文档结构；用于布局/绘制的结构结合样式，可能省略 display:none，也包含伪元素等不直接对应 DOM 元素的盒。渲染树是教学概念，各引擎内部结构不同。读写布局交错可能强制刷新；transform/opacity 常能走合成优化，但应通过工具确认。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work)。

---

## Q257｜浏览器输入 URL 到页面加载显示完成全过程

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

导航先处理 URL、历史/缓存/Service Worker 等路径，必要时解析 DNS、建立连接（HTTPS 涉及 TLS，HTTP/3 使用 QUIC），再发送请求。服务器处理并可能重定向，浏览器收到响应后流式解析 HTML、发现资源并执行相应脚本，进行样式、布局、绘制与合成。

连接和 DNS 可能复用，缓存命中也不一定访问网络；defer、async、模块脚本影响执行时机。DOMContentLoaded 与 load 都不是“用户永远不会再看到变化”的标志，图片、字体、异步数据及客户端渲染还可能持续更新。用 Network、Navigation Timing 与 Performance 时间线验证实际路径。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work)。

---

## Q258｜列表无限滚动，页面逐渐卡顿，解决方案

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

无限滚动不能无限保留 DOM 与数据。先检查节点数、图片解码、长任务和保留对象，再用虚拟列表只渲染视口及缓冲区域，缓存数据设上限，服务端分页避免一次拉全量。

IntersectionObserver 可触发加载更多，但要有 loading/hasMore 与重复请求保护。卸载时取消请求和监听，恢复滚动时保留稳定 key 与测量结果。动态高度、焦点、键盘导航和辅助技术要纳入设计，单纯 display:none 不会释放数据和节点成本。

参考：[资料 1](https://web.dev/articles/virtualize-long-lists-react-window)。

---

## Q259｜域名发散

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

域名发散是把静态资源分布到多个域名，历史上常用于绕开 HTTP/1.1 浏览器每源连接数量限制、增加并行下载。它并非因为浏览器负责替所有服务器防止崩溃，也不限于 PC。

代价是额外 DNS、TCP/TLS、Cookie/跨域和连接竞争。在 HTTP/2/3 多路复用环境下收益往往减少甚至倒退，应以实际连接瀑布和拥塞行为测试，不能沿用“域名越多越快”。

参考：[资料 1](https://web.dev/articles/performance-http2)。

---

## Q260｜域名收敛

适用：Web Performance / Core Web Vitals（LCP、INP、CLS）；webpack 5；HTTP/1.1–3。

域名收敛减少来源数量，以复用连接、降低 DNS 与握手成本，并更好利用 HTTP/2/3 多路复用。它不只适用于移动端，也不是“DNS 总是占主要耗时”的结论。

仍可因 CDN、隔离、不携带 Cookie 或安全策略保留不同域名；某些条件下浏览器还支持连接合并。合理方案取决于证书、协议、资源优先级、缓存与网络质量，需观察实测数据。

参考：[资料 1](https://web.dev/articles/performance-http2)。

---

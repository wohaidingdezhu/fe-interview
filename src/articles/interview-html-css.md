---
id: "interview-html-css"
title: "HTML + CSS 面试题"
category: "HTML + CSS"
description: "收录 Q1–Q39 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["HTML","CSS","面试"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 100
status: draft
quality: complete
sources: ["https://developer.mozilla.org/en-US/docs/Web/CSS","https://html.spec.whatwg.org/"]
technologyVersion: "HTML Living Standard；现代 CSS，注意浏览器兼容性"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://developer.mozilla.org/en-US/docs/Web/CSS) · [参考 2](https://html.spec.whatwg.org/)。


## Q1｜什么是重绘，什么是回流？如何减少回流？

适用：现代浏览器渲染流水线。

浏览器渲染大致经过样式计算、布局（Layout）、绘制（Paint）与合成（Composite）。传统说法中的“回流”通常指重新布局：元素几何信息或文档结构变化后，浏览器需要重新计算受影响节点的尺寸和位置；“重绘”指布局不变，但像素外观需要重新绘制。transform、opacity 等变化在满足条件时可能只进入合成阶段，既不布局也不重新绘制，但是否分层由浏览器决定。

减少代价的核心不是追求“零回流”，而是避免布局抖动和无意义的大范围更新：

- 把布局读取集中在一起，再批量写入样式；不要在循环中交替读取 offsetWidth/getBoundingClientRect 和修改样式。
- 动画优先使用 transform、opacity，并通过 Performance 面板确认实际渲染路径。
- 在同一帧内批量更新 DOM，使用 class、DocumentFragment 或框架批处理减少中间状态。
- 用 requestAnimationFrame 安排视觉更新，但它不会自动消除布局；回调中仍要避免读写交错。
- 对彼此独立的复杂区域按需使用 contain/content-visibility，先验证可访问性、尺寸占位和浏览器支持。
- 谨慎使用 will-change；长期创建过多合成层会增加显存和管理成本。

translate3d(0,0,0) 不是“强制 GPU 加速”的通用答案，visibility:hidden 也不是 display:none 的等价性能替代：两者布局、可访问性和交互语义都不同。最终应以 Chrome DevTools Performance 录制中的 Layout、Paint 和 Composite 证据为准。

参考：[资料 1](https://web.dev/articles/rendering-performance) · [资料 2](https://developer.chrome.com/docs/devtools/performance/)。

---

## Q2｜以下代码触发了多少次回流？

适用：现代浏览器布局实验；次数需按当前环境录制。

原导入题只保留截图和固定次数，缺少可复制程序，不能据此保证“必定回流 3 次”。下面补一个独立实验：比较集中写入与读写交错，具体 Layout 次数用当前浏览器 Performance 记录确认。

```html
<div id="box" style="width:100px;height:20px"></div>
<script>
const box = document.querySelector("#box");
function batched() {
  for (let i = 0; i < 5; i++) box.style.width = `${101 + i}px`;
  return box.offsetWidth;
}
function interleaved() {
  const widths = [];
  for (let i = 0; i < 5; i++) {
    box.style.width = `${111 + i}px`;
    widths.push(box.offsetWidth);
  }
  return widths;
}
// 分别从控制台运行 batched() 和 interleaved() 并录制 Performance。
</script>
```

布局失效后读取 offsetWidth 可能强制同步布局；集中写入有机会合并，交错读取通常迫使多次刷新。浏览器初始状态、containment 和实现会影响记录，不能把赋值次数直接换算布局次数。以下旧图保留作题目背景，图中数字不是新实验的验证结果。

![](./images/interview/大前端面试宝典-image-11.png)

![](./images/interview/大前端面试宝典-image-10.png)

![](./images/interview/大前端面试宝典-image-9.png)

![](./images/interview/大前端面试宝典-image-8.png)

![](./images/interview/大前端面试宝典-image-7.png)

![](./images/interview/大前端面试宝典-image-6.png)

![](./images/interview/大前端面试宝典-image-13.png)

![](./images/interview/大前端面试宝典-image-5.png)

![](./images/interview/大前端面试宝典-image-3.png)

![](./images/interview/大前端面试宝典-image-4.png)

![](./images/interview/大前端面试宝典-image.png)

参考：[资料 1](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)。

---

## Q3｜Margin 塌陷问题如何解决？BFC 是什么？ 怎么触发？

适用：现代 CSS；块格式化上下文与外边距折叠。

垂直外边距折叠发生在特定块级布局关系中，例如同一块格式化上下文里的相邻块、父元素与第一个/最后一个普通流子元素、没有内容和边框的空块。折叠后的距离通常取正 margin 最大值；存在负值时按规范组合，不能简单概括为“两个 margin 相加”或“永远取最大值”。Flex/Grid 项目的 margin 不发生这种折叠。

BFC（Block Formatting Context）是块级布局的独立格式化上下文。它会包含内部浮动，并阻止内部块与上下文外部块发生部分布局影响。现代代码若只是需要显式创建 BFC，优先使用 display:flow-root，语义比 overflow:hidden 更清楚，也不会意外裁剪内容。

常见创建方式包括：

- 根元素。
- float 不是 none。
- position 为 absolute 或 fixed。
- display 为 flow-root、inline-block、table-cell、table-caption。
- overflow 不是 visible/clip。
- Flex/Grid 容器的非普通块子项，以及部分 contain、多列布局等场景。

解决 margin 折叠要先确认是哪种关系：相邻元素可改用 gap；父子折叠可用 padding/border、flow-root、Flex/Grid；不要为了“修复”而给所有元素随意加 overflow:hidden。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Block_formatting_context) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing)。

---

## Q4｜如何隐藏一个元素

适用：现代 HTML/CSS；同时考虑命中测试和无障碍语义。

隐藏方式要同时考虑布局占位、命中测试、键盘焦点和无障碍树，不能只看“肉眼是否可见”。

| 方式 | 保留布局空间 | 默认指针命中 | 典型语义 |
| --- | --- | --- | --- |
| display:none / hidden 属性 | 否 | 否 | 内容当前不存在于布局和无障碍树 |
| visibility:hidden | 是 | 否 | 保留布局，但内容不可见；后代可重新设 visible |
| opacity:0 | 是 | 是 | 只改变透明度；仍可能被点击和键盘聚焦 |
| clip-path:circle(0) | 是 | 通常仅裁剪区域参与命中 | 视觉裁剪，不等价于语义隐藏 |
| 移到屏幕外 | 取决于定位方式 | 可能 | 常用于特定视觉隐藏模式，处理不当会产生滚动和焦点跳转 |

若只是暂时不显示组件，通常使用 hidden/display:none；若要做淡入淡出，可以动画 opacity，同时在不可见阶段处理 pointer-events、inert 或焦点。给屏幕阅读器保留、但视觉隐藏的文本应使用经过验证的 visually-hidden 样式，不能简单写 top:-999px。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/display) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/visibility) · [资料 3](https://developer.mozilla.org/en-US/docs/Web/CSS/opacity)。

---

## Q5｜overflow 不同值的区别。

适用：CSS Overflow Module Level 3/4；现代浏览器。

overflow 控制内容超出 padding box 时的裁剪和滚动行为，可分别通过 overflow-x/overflow-y 设置两个方向。

| 值 | 行为 |
| --- | --- |
| visible | 默认不裁剪，也不是滚动容器；内容可能绘制到盒外 |
| hidden | 裁剪溢出内容，不显示滚动条；仍是滚动容器，可被脚本或焦点滚动 |
| clip | 在 overflow clip edge 裁剪，禁止程序化滚动；单独使用不会创建 BFC |
| scroll | 裁剪并提供滚动机制；传统滚动条通常会预留/显示，不依赖当前是否溢出 |
| auto | 由浏览器在实际溢出时提供滚动机制 |

hidden、scroll、auto 通常会创建 BFC，visible 和 clip 不会；需要 clip 同时创建格式化上下文时可配合 display:flow-root。全局关键字 inherit、initial、unset、revert 控制级联，不是 overflow 独有的滚动模式。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow)。

---

## Q6｜三栏布局的实现方式（圣杯模型）

适用：现代 CSS Grid/Flexbox。

三栏布局通常是左右固定或受约束、中间自适应。现代实现优先 Grid 或 Flex；经典“圣杯/双飞翼”依赖 float 和负 margin，面试可说明原理，但新项目通常不必继续使用。

Grid 最直接：

```css
.layout { display: grid; grid-template-columns: 16rem minmax(0, 1fr) 18rem; gap: 1rem; }
```

Flex 需要允许中间列收缩：

```css
.layout { display: flex; gap: 1rem; }
.left { flex: 0 0 16rem; }
.main { flex: 1 1 auto; min-width: 0; }
.right { flex: 0 0 18rem; }
```

响应式布局通常在窄屏改成单列或把侧栏折叠。不要只用 CSS order 改变视觉顺序而忽略 DOM、键盘焦点和屏幕阅读器顺序。绝对定位适合覆盖层，不适合作为普通文档三栏的首选，因为父容器高度和内容溢出需要额外管理。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout)。

---

## Q7｜calc() 方法

适用：现代 CSS Values and Units；新算术语法需查兼容性。

calc() 让浏览器在计算值阶段组合长度、百分比、角度、时间等兼容类型，常用于“可用空间减固定尺寸”和把自定义属性带入计算。百分比仍按对应属性的包含块规则解析；calc() 不能读取任意兄弟元素的实际 DOM 尺寸。

```css
.sidebar-layout { width: calc(100% - 18rem); }
.card { padding: calc(var(--space) * 2); }
.hero { min-height: calc(100dvh - var(--header-height)); }
.title { font-size: clamp(1.5rem, calc(1rem + 2vw), 3rem); }
```

加减号两侧需要空格，例如 calc(100% - 2rem)；不同单位能否运算取决于它们是否具有兼容类型。乘除等较新的 typed arithmetic 能力应先确认目标浏览器兼容性，不能把实验性语法当成所有环境都支持。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/calc)。

---

## Q8｜实现 一个固定长宽div 在屏幕上垂直水平居中

适用：现代 Flexbox；动态视口单位按兼容性使用。

给父容器设置至少一个视口高度，使用 Flex 的 justify-content 与 align-items 同时居中。固定长宽属于子元素；box-sizing:border-box 可让边框和内边距包含在指定尺寸内。移动浏览器可用 100dvh 跟随可见视口变化，并为旧浏览器保留 min-height:100vh。

```css
.page { min-height: 100vh; min-height: 100dvh; display: flex; justify-content: center; align-items: center; }
.box { width: 240px; height: 160px; box-sizing: border-box; }
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Aligning_items_in_a_flex_container) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/length)。

---

## Q9｜渐进增强（progressive enhancement）和优雅降级（graceful degradation）

适用：现代 Web 平台；特性检测与基础可访问性。

渐进增强从可访问的核心内容和基本操作开始，再根据能力增加样式、交互或性能优化；优雅降级从完整体验出发，为能力不足或依赖失败的环境保留可接受的退化路径。两者都强调核心任务可完成，差别主要在设计起点。

实际项目更推荐渐进增强：先使用语义 HTML 和普通表单保证基本提交，再用 CSS、美化控件和 JavaScript 异步提交增强体验。能力判断优先使用特性检测与 @supports，不用浏览器名称猜测。

```css
.layout { display: block; }
@supports (display: grid) {
  .layout { display: grid; grid-template-columns: 1fr 2fr; }
}
```

降级也适用于非浏览器兼容问题，例如图片加载失败显示替代文本、JavaScript 失败仍可使用服务端表单、实时连接断开后回退到轮询。无障碍不是“高级增强”，应属于基础能力。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports)。

---

## Q10｜iframe 有哪些优缺点及使用场景

适用：HTML Living Standard；现代浏览器安全策略。

iframe 在当前文档中嵌入另一个浏览上下文，适合第三方视频、地图、支付/身份组件、在线编辑器预览和需要较强隔离的微前端。它可以独立导航、加载自己的文档和运行环境，但也带来额外内存、网络、生命周期、焦点与无障碍复杂度。

安全性不是自动获得的：嵌入不可信内容时应使用最小 sandbox 权限，并结合 allow、referrerpolicy、CSP frame-src/frame-ancestors 等策略。不要同时随意授予 allow-scripts 与 allow-same-origin；具体风险取决于内容来源。跨源父子页面不能直接读写彼此 DOM，应通过 postMessage 通信，并严格校验 event.origin、event.source 和消息结构。

```html
<iframe
  title="代码运行结果"
  src="/preview.html"
  sandbox="allow-scripts"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>
```

使用时还要处理：明确 title、响应式尺寸、加载/失败状态、键盘焦点、消息清理和导航策略。SEO 不能简单概括为“iframe 一定不被索引”，但嵌入内容通常不等同于宿主页面自己的可索引正文，因此核心内容不应只存在于第三方 iframe 中。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)。

---

## Q11｜CSS 盒子模型

适用：现代 CSS Box Model。

CSS 盒由 content、padding、border、margin 四层组成。background 绘制在边框盒内部，margin 位于盒外且可能发生折叠。width/height 控制哪一层取决于 box-sizing：content-box 下声明尺寸只约束内容盒，总占用还要加 padding 和 border；border-box 下声明尺寸包含 padding 和 border，但不包含 margin。

```css
* { box-sizing: border-box; }
.card { width: 300px; padding: 20px; border: 2px solid; }
```

盒的实际尺寸还受 min/max-width、固有尺寸、百分比包含块、书写模式和格式化上下文影响。调试时应在 DevTools Box Model 查看计算值，不要只根据声明的 width 推断最终占用空间。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing)。

---

## Q12｜HTML5 的特性

适用：HTML Living Standard；独立 Web API 按各自规范。

“HTML5”在面试中通常泛指现代 HTML 与同期 Web 平台，但要区分 HTML 元素和独立 Web API。HTML Living Standard 中的重要变化包括语义结构元素（main/article/nav 等）、audio/video、canvas、更丰富的表单类型与约束验证、原生拖放以及更明确的解析规则。Web Storage、IndexedDB、Workers、WebSocket、Geolocation 等由各自规范定义，不应全部说成 HTML 标签特性。

Application Cache 已废弃并从现代浏览器移除；离线能力通常使用 Service Worker 与 Cache API。addEventListener 也早于 HTML5。回答时应说明“HTML 语言能力”和“现代 Web API 生态”两个层次，避免列出已经废弃的功能。

参考：[资料 1](https://html.spec.whatwg.org/) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/HTML)。

---

## Q13｜CSS3 的特性

适用：现代模块化 CSS；各模块兼容性独立判断。

现代 CSS 不再整体发布为一个“CSS3 版本”，而是按模块独立演进。面试中的 CSS3 通常指相对 CSS2.1 普及的一批模块，例如 border-radius/box-shadow、渐变、媒体查询、Web Fonts、多列布局、transform、transition、animation、Flexbox、Grid、自定义属性等。

回答时应避免暗示这些能力同时出现或兼容性完全一致：Grid、Custom Properties 等模块成熟时间不同；表单控件和滚动条样式也不是所有浏览器完全统一。实际项目应针对具体属性查询 Baseline/兼容性，并准备可接受的回退，而不是只说“支持 CSS3”。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS)。

---

## Q14｜CSS 中选择器的优先级，权重计算方式。

适用：CSS Cascade Level 5/6；包含 cascade layers。

CSS 先按来源、重要性、层叠上下文与层（cascade layers）比较，再比较选择器特定性，最后才看作用域接近度和声明顺序。!important 不是无条件高于所有来源，用户重要声明等仍可能胜出。

特定性用三列元组比较，不应当作十进制 100/10/1 相加：

- ID 列：#id。
- 类列：.class、[attr]、:hover 等伪类。
- 类型列：div、::before 等类型与伪元素。

例如 #app .item 是 (1,1,0)，.page .list .item 是 (0,3,0)，前者胜出；再多类选择器也不会“进位”成一个 ID。:where() 的特定性为零，:is()、:not()、:has() 取参数列表中最高特定性。内联样式可视为独立的更高层级，而不是简单写成 1000。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade)。

---

## Q15｜HTML5 input 元素 type 属性

适用：HTML Living Standard；控件 UI 按平台实现。

常用类型包括 text、password、search、email、url、tel、number、range、date、month、week、time、datetime-local、color、file、checkbox、radio、hidden，以及 submit/reset/button/image。未知 type 按 text 处理。

type 不只是改变外观，还会影响输入法提示、原生控件、默认校验和提交值。例如 email/url 会参与约束验证，但浏览器验证不能替代服务端校验；number 适合真正的数值，不适合邮编、身份证或带前导零的编号；日期控件界面与支持程度依平台而异。应搭配 label、name、autocomplete、inputmode、min/max/step 等属性，并在目标设备验证可访问性。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input)。

---

## Q16｜CSS 中属性的继承性

适用：现代 CSS Cascade and Inheritance。

继承发生在没有指定值时：部分属性会从父元素的计算值取得值，常见的是 color、font-family/font-size/font-style/font-weight、line-height、text-align、visibility 等文本与可见性属性。布局和盒模型属性如 display、position、width、height、margin、padding、border、background 通常不继承。

不能只靠记忆列表：每个属性规范都定义 inherited: yes/no。inherit 可强制继承，initial 使用属性初始值，unset 对可继承属性等同 inherit、对其他属性等同 initial，revert 回退到较早来源/层。自定义属性默认继承，但通过 @property 可以改变继承行为和类型。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Inheritance) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/inherit)。

---

## Q17｜画一条 0.5px  的线

适用：现代 CSS；显示效果受 DPR 和缩放影响。

CSS 像素不是物理像素，0.5px 在不同设备像素比和缩放下表现可能不同。常见方案是在定位好的容器中画 1px 高的伪元素，再用 scaleY(.5) 缩放；它不占额外布局高度。设备像素比为 2 时，半个 CSS 像素通常对应一个物理像素，不能保证所有设备都得到完全相同的清晰度。

```css
.divider { position: relative; }
.divider::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: #aaa; transform: scaleY(.5); transform-origin: bottom; }
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/length) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)。

---

## Q18｜position 的值

适用：现代 CSS Positioned Layout。

- static：普通定位，inset 属性通常不参与定位。
- relative：保留原布局位置，再按 inset 视觉偏移，并可为绝对定位后代建立包含块。
- absolute：脱离普通流，通常相对最近建立定位包含块的祖先；没有时使用初始包含块。
- fixed：脱离普通流，通常相对视口；transform、filter、contain 等属性可能让祖先建立固定定位包含块。
- sticky：在普通流中占位，并相对最近滚动机制祖先/包含块在指定 inset 阈值内粘附。

sticky 至少需要一个非 auto inset（如 top:0）和可滚动空间；祖先 overflow、容器高度、表格布局等都可能影响效果。z-index 与定位会参与层叠上下文，但“设置 position 就一定创建层叠上下文”并不正确。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/position)。

---

## Q19｜什么是浮动，浮动会引起什么问题，有何解决方案？

适用：现代 CSS；flow-root 优先用于包含浮动。

float 最初用于让文本和行内内容环绕图片等浮动盒。浮动盒移到当前行左侧或右侧，后续行盒绕开它；它仍影响普通流排版，但父块高度可能不包含只由浮动子项形成的高度。现代多列页面布局优先 Flex/Grid，不应用 absolute/inline-block 模拟 float。

包含浮动推荐在父容器使用 display:flow-root。传统 clearfix 也可通过生成清除浮动的伪元素处理；clear 属性用于让某个后续块移动到相关浮动盒下方。overflow:auto/hidden 能因创建 BFC 包含浮动，但可能产生滚动条或裁剪，不应只为 clearfix 随意使用。

```css
.media { display: flow-root; }
.media img { float: inline-start; margin-inline-end: 1rem; }
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/float) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/clear) · [资料 3](https://developer.mozilla.org/en-US/docs/Web/CSS/display#flow-root)。

---

## Q20｜line-height 和 height 的区别

适用：现代 CSS Inline/Box Sizing。

line-height 定义行框使用的行高，影响多行文本间距和行内内容垂直分布，并且默认可继承。无单位值通常更适合继承，例如 line-height:1.5 会在后代按各自字体大小计算。用 line-height 等于容器高度只能近似居中单行文本，不适合多行、图标混排或可变字体。

height 定义盒在块轴上的指定尺寸；默认 box-sizing:content-box 时只约束内容盒，padding 和 border 会额外增加外部尺寸，border-box 时才包含它们。height:auto、min/max-height、百分比基准和内容溢出还会影响最终尺寸。现代居中优先使用 Flex/Grid 对齐，而不是依赖 line-height 技巧。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/height)。

---

## Q21｜设置一个元素的背景颜色会填充的区域。

适用：现代 CSS Backgrounds and Borders。

背景绘制区域由 background-clip 决定。默认 border-box，背景绘制到边框盒边缘并位于边框下方；如果边框不透明，背景只是被边框遮住。padding-box 截止到内边距外边缘，content-box 只绘制内容盒，text 可用于文字裁剪但兼容和前缀需要确认。背景不会绘制到 margin。

```css
.box { background-color: tomato; background-clip: padding-box; }
```

多层背景共享 background-origin/background-clip 的对应列表；根元素背景还有传播到画布的特殊规则，不能用普通盒模型简单概括。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip)。

---

## Q22｜inline-block、inline 和 block 的区别

适用：现代 CSS Display。

这三个值描述外部/内部显示类型的组合：block 在块布局中生成块盒，通常从新行开始；inline 生成可分片的行内盒，参与行布局；inline-block 对外参与行布局，对内建立块级格式化上下文。

- block 的 width:auto 通常填充可用内联尺寸，但它不是“永远占满一行”。
- 非替换 inline 盒的 width/height 通常不生效，左右 margin/padding 参与行布局，垂直 margin 不按块盒方式推开行；内容可跨多行形成多个片段。
- inline-block 可以设置尺寸且整体不跨行拆分，默认按基线对齐；HTML 源码中的空白也可能形成可见间隙。

现代水平布局通常优先 Flex/Grid；选择 display 应根据布局语义，而不是元素标签的传统“块级/行内”称呼。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/display)。

---

## Q23｜为什么 img 是 inline 但是可以设置宽高

适用：HTML Living Standard；现代 CSS replaced elements。

img 默认是 inline-level replaced element（行内级替换元素）。普通非替换 inline 盒由文字内容和字体指标决定，width/height 通常不适用；替换元素的内容由外部图像替代，具有固有宽高和宽高比，因此 CSS width/height 可以参与计算。

它仍参与行盒并按基线对齐，所以图片下方常出现为文字下行部预留的间隙。可按需求设置 display:block，或调整 vertical-align。给 img 写 width/height HTML 属性还能让浏览器在图片下载前预留宽高比，减少布局偏移，但响应式 CSS 仍应允许 max-width:100%;height:auto。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_images/Replaced_element_properties) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)。

---

## Q24｜box-sizing 的作用，如何使用？

适用：现代 CSS Box Sizing。

box-sizing 决定 width/height、min/max 尺寸作用于内容盒还是边框盒。content-box 是多数元素默认值：外部宽度 = width + padding + border；border-box 把 padding 和 border 包含在声明宽度内，内容盒会相应缩小。margin 始终不包含在两者中。

```css
*, *::before, *::after { box-sizing: border-box; }
```

表单控件的用户代理默认值可能不同。border-box 让组件尺寸更易预测，但若 padding+border 大于声明尺寸，内容尺寸仍会受最小约束和溢出规则影响。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing)。

---

## Q25｜CSS 实现动画

适用：CSS Animations Level 1；现代浏览器。

CSS 动画使用 @keyframes 描述关键状态，通过 animation-* 属性控制时长、缓动、延迟、次数、方向和填充模式。优先动画 transform 与 opacity，通常可以避免布局计算；宽高、位置等影响布局的属性可能触发更多样式计算和绘制。

```css
@keyframes slide-in {
  from { transform: translateX(-24px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.card.is-entering {
  animation: slide-in 240ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .card.is-entering { animation: none; }
}
```

添加类名触发动画：

```js
card.classList.add('is-entering');
card.addEventListener('animationend', () => card.classList.remove('is-entering'), { once: true });
```

animationend 在动画正常结束时触发；如果元素被移除或动画被取消，不能假设它一定发生。需要业务状态收尾时应设计超时或取消路径。可交互界面还应尊重 prefers-reduced-motion，避免强制用户观看大幅运动。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)。

---

## Q26｜transition 和 animation 的区别？

适用：现代 CSS Transitions and Animations。

transition 和 animation 是CSS用于创建动画效果的两种不同的属性。

**Transition（过渡）：**

- transition允许元素在状态改变时平滑地过渡到新的样式。它可应用于元素各属性，如颜色、尺寸、位置等。
- 过渡是由触发状态变化的事件触发的，比如鼠标悬停、焦点获得、类名变化等。
- 过渡通常使用简单的语法定义，包括要过渡的属性、过渡持续时间、过渡的时间函数和延迟时间。
- 过渡通常是在元素的常规和伪类状态之间进行切换，例如hover、focus。

**Animation（动画）：**

- animation允许您创建更复杂的动画，它可以定义关键帧，以便在动画的不同阶段应用不同的样式。
- 动画是在元素的状态、时间轴或事件触发下进行的。
- 动画可以更精细地控制动画的每一帧，包括持续时间、循环次数、缓动函数等。
- 动画通常用于创建更复杂的动画序列，可以包括多个关键帧和自定义时间函数。

**总结：**

- 使用 transition 可以创建简单的状态过渡效果，适用于鼠标悬停、焦点等触发的状态变化。
- 使用 animation 可以创建更复杂的动画，包括关键帧、持续时间、循环和更精细的控制。它适用于需要更多控制和复杂度的动画场景。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations)。

---

## Q27｜如何实现在某个容器中居中的？

适用：现代 CSS Grid/Flex alignment。

需要同时居中时，父容器用 display:grid 和 place-items:center，并保证容器有足够高度。只有水平居中且子元素宽度受限时，可用 margin-inline:auto。绝对定位的 50% 加 translate(-50%,-50%) 适合脱离文档流的覆盖元素，必须先给容器建立定位上下文。

```css
.container { display: grid; place-items: center; min-height: 300px; }
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/place-items)。

---

## Q28｜如何改变一个 DOM 元素的字体颜色？

适用：现代 CSSOM/DOM。

字体颜色由 CSS 的 color 属性控制，可设置类，也可修改元素 style.color；background-color 改的是背景，不是文字。推荐通过切换类表达状态，避免大量内联样式。颜色应同时考虑深浅主题和可读性，不能只靠颜色传达错误或成功。

```js
element.classList.add('is-error'); // CSS: .is-error { color: #b42318; }
element.style.color = '#334155'; // 简单动态场景
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/color) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList)。

---

## Q29｜相对布局和绝对布局，position:relative 和 absolute。

适用：现代 CSS Positioned Layout。

relative 元素保留在普通流中的原始空间，再相对自身正常位置按 inset 偏移；它常用于轻微视觉偏移，也可为绝对定位后代建立包含块。偏移不会让周围元素重新占用它原来的位置。

absolute 元素脱离普通流，通常相对最近建立定位包含块的祖先定位。position 非 static 的祖先是常见来源，但 transform、contain 等也可能建立包含块；没有合适祖先时使用初始包含块。绝对定位适合徽标、弹层内部定位等明确覆盖关系，不适合替代普通响应式布局。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/position)。

---

## Q30｜弹性盒子 flex 布局

适用：现代 CSS Flexbox。

Flexbox 是一维布局模型：flex-direction 决定主轴，交叉轴与主轴垂直；writing-mode 和方向会影响实际物理方向。容器默认 flex-wrap:nowrap，不会“空间不够自动换行”，需要显式设置 wrap。

flex 项先取得 flex-basis，再按 flex-grow 分配剩余空间、按 flex-shrink 收缩。常见的 flex:1 等价语义需结合规范展开值理解；内容项无法收缩时通常给它 min-width:0。justify-content 控制主轴分布，align-items/align-self 控制单行交叉轴，align-content 只对多行容器的行分布有效。

order 只改变视觉顺序，不改变 DOM 与通常的键盘/朗读顺序，因此不应拿来修复语义结构。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout)。

---

## Q31｜Less 和 SCSS 的区别

适用：Less/Sass 当前文档；Sass 模块系统。

Less 与 Sass/SCSS 都在构建阶段编译为 CSS。Less 变量常用 @name，mixin 可直接复用规则集；SCSS 变量使用 $name，并提供模块系统、mixin/function、控制指令和更系统的值类型。SCSS 是 Sass 的 CSS 兼容语法，缩进语法 .sass 是另一种写法。

选择时应看现有技术栈、组件库和构建工具，而不是只比较语法多少。现代 CSS 已原生支持自定义属性、嵌套、颜色函数等部分能力，但编译期变量/循环与运行时 CSS 自定义属性语义不同，不能直接互换。新 Sass 代码应优先 @use/@forward，旧 @import 已被弃用。

参考：[资料 1](https://lesscss.org/features/) · [资料 2](https://sass-lang.com/documentation/)。

---

## Q32｜CSS3 伪类，伪元素

适用：现代 Selectors/Pseudo-elements。

伪类用单冒号选择元素的状态或结构关系，例如 :hover、:focus-visible、:checked、:nth-child()、:not()、:is()、:where()、:has()。:nth-child(n) 判断元素在兄弟节点中的位置，不是简单“选父元素中的某种标签第 n 个”，需要区分 :nth-of-type()。

伪元素用双冒号表示元素的一部分或生成盒，例如 ::before、::after、::first-line、::first-letter、::selection、::marker。::before/::after 依赖 content 生成，不能替代有业务语义的真实 DOM；生成内容的可访问性支持也不应作为关键信息唯一来源。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements)。

---

## Q33｜::before 和 ::after 中双冒号和单冒号的区别

适用：CSS Selectors / Pseudo-elements。

双冒号表示伪元素，例如 ::before、::after、::marker；单冒号表示伪类，例如 :hover、:focus。为了兼容 CSS 早期语法，浏览器同时接受 :before、:after、:first-line、:first-letter 这四个历史伪元素的单冒号写法。

该兼容规则不能推广到所有伪元素，:marker 并不是 ::marker 的等价写法。新代码统一使用双冒号表示伪元素。before/after 通常需要 content 才产生生成内容，其文本不能替代关键语义、表单标签或可访问名称。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements)。

---

## Q34｜响应式布局的实现方案

适用：现代响应式 Web；容器查询按兼容性使用。

响应式设计不是按设备型号写多套页面，而是让内容和组件在可用空间、输入方式、用户偏好和资源能力变化时保持可用。

- 先使用流式尺寸、Flex/Grid、minmax()、clamp() 等让布局自然伸缩。
- 视口级变化使用移动优先媒体查询；组件由所在容器决定布局时使用 container queries。
- 图片使用 max-width:100%;height:auto，并通过 picture/srcset/sizes 提供合适资源。
- 使用逻辑属性和相对单位支持不同书写方向与缩放。
- 响应 prefers-reduced-motion、prefers-color-scheme、hover/pointer 等用户或设备能力。
- 断点应由内容何时失效决定，不按某款手机宽度硬编码。

响应式还包括可触摸目标、键盘操作、文本放大、动态视口单位和真实低性能设备验证。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)。

---

## Q35｜link 标签和 import 标签的区别？

适用：HTML Living Standard；现代 CSS Cascade。

link rel=stylesheet 在 HTML 解析阶段被发现，样式表通常会阻塞首次渲染，避免无样式内容闪烁；它支持 media、integrity、crossorigin 等属性。@import 写在 CSS 内，浏览器必须先取得并解析外层样式表才能发现导入，容易形成串行请求链，因此性能关键样式通常优先 link 或构建期合并。

@import 必须出现在样式表其他普通规则之前（除 @charset、@layer 等允许的前置规则），并可指定 media、supports、layer。两者最终都参与 CSS 层叠；“link 不阻塞渲染”是错误表述。现代构建工具还可能内联、拆包或重写导入，分析网络行为时要看最终产物。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/link) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/@import)。

---

## Q36｜块元素、行元素、置换元素的区别

适用：HTML Living Standard；现代 CSS Display。

要区分 HTML 内容模型和 CSS 盒类型。div、p、a 等标签允许包含什么由 HTML 规范决定；它们默认生成块盒还是行内盒由用户代理样式和 display 决定，CSS 可以改变显示类型，但不能因此改变 HTML 嵌套合法性或语义。

块级/行内级描述盒如何参与外部格式化上下文。替换元素则描述内容表现由外部对象替代，并可能具有固有尺寸，例如 img、video、iframe 和部分表单控件。img 可以同时是行内级盒和替换元素，这两个维度不冲突。并非所有 video/iframe 尺寸都完全由资源决定，CSS 仍可约束它们。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/display) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_images/Replaced_element_properties)。

---

## Q37｜单行元素的文本省略号实现方式

适用：现代 CSS Overflow/Text。

单行省略号需要同时具备受限宽度、禁止换行和隐藏溢出，再设置 text-overflow:ellipsis。Flex 或 Grid 子项常因默认最小宽度而不收缩，应加 min-width:0。省略只影响视觉展示，完整文字仍在 DOM 中，重要内容应允许查看全文。

```css
.title { min-width: 0; max-width: 20rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
```

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/text-overflow)。

---

## Q38｜HTML 语义化标签

适用：HTML Living Standard；现代无障碍语义。

HTML 语义化是根据内容角色选择元素，让浏览器、辅助技术、搜索工具和维护者理解结构，而不是只按默认样式选标签。语义元素不能代替正确的标题层级、可访问名称和键盘行为：

1. **<header>：**定义文档或文档的一部分的页眉。通常包括网站的标题、标志、导航菜单等。
2. **<nav>：**用于定义导航部分，通常包括导航链接、菜单、目录等。
3. **<main>：**表示文档主要内容，通常只应有一个当前可见 main。
4. **<article>：**用于表示独立于页面内容的、可独立分发或重复使用的内容块，如一篇新闻文章、博客帖子或评论。
5. **<section>：**用于组织文档的不同章节或主题区域，如文章的章节、内容块等。
6. **<aside>：**表示与页面主要内容相关但可以视为附属的内容，如侧边栏、广告、引用等。
7. **<footer>：**定义文档或文档的一部分的页脚，通常包括版权信息、联系信息、相关链接等。
8. **<figure>：**用于包含与文档相关的图像、图表、照片等，通常与<figcaption>元素一起使用来提供图像的描述。
9. **<figcaption>：**用于为<figure>元素提供标题或描述。
10. **<time>：**表示日期、时间或时间范围，可通过 datetime 提供机器可读值。

如果原生 button、nav、details 等已经提供语义和交互，不要优先用 div 加 ARIA 重新实现；规则是“没有 ARIA 胜过错误 ARIA，原生语义优先”。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Glossary/Semantics) · [资料 2](https://html.spec.whatwg.org/)。

---

## Q39｜px，rpx，vw，vh，rem，em 的区别

适用：现代 CSS Values and Units；rpx 为非标准平台单位。

- px 是 CSS 绝对长度单位中的参考像素，不等于一个物理屏幕像素；缩放和设备像素比会决定它映射到多少设备像素。
- rpx 是微信小程序等特定平台的非标准单位，通常按 750rpx 对应屏幕宽度换算，不能直接用于普通 Web CSS。
- 1vw/1vh 分别是初始包含块宽高的 1%；移动端浏览器工具栏变化时还需理解 svh/lvh/dvh 等小、大、动态视口单位。
- rem 相对根元素字体大小；适合全局尺度与用户字体设置联动。
- em 在 font-size 上相对父元素字体大小，在多数其他属性上相对当前元素计算后的字体大小，嵌套时可能累积。

字体通常优先 rem/em，边框等精细尺寸可用 px，流式尺寸可结合百分比、视口/容器单位和 clamp()。单位选择应服务缩放、内容和组件边界，不能靠单一单位解决所有响应式问题。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/CSS/length)。

---

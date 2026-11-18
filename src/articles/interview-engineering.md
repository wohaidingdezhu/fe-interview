---
id: "interview-engineering"
title: "前端构建与工程化面试题"
category: "工程化"
description: "收录前端构建、工程化与 Electron 桌面应用面试题。"
kind: "知识文章"
tags: ["Webpack","Vite","工程化"]
addedAt: "2026-10-08"
updatedAt: "2026-11-18"
order: 106
status: draft
quality: complete
sources: ["https://webpack.js.org/api/loaders/","https://webpack.js.org/contribute/writing-a-plugin/"]
technologyVersion: "补充示例基于 webpack 5；各题标注适用范围"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://webpack.js.org/api/loaders/) · [参考 2](https://webpack.js.org/contribute/writing-a-plugin/)。


## Q228｜webpack 的作用

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

webpack 从入口解析依赖图，将 JavaScript 与经 loader/资源模块处理的 CSS、图片等组织成可部署产物。它提供代码分割、模块运行时、生产优化与开发 HMR，并不要求所有代码合成一个文件。

语法降级、类型检查、HTTP 缓存和部署属于相邻环节，需分别配置 Babel、TypeScript、服务器等。性能应同时关注构建耗时与浏览器下载/执行成本。

参考：[资料 1](https://webpack.js.org/concepts/)。

---

## Q229｜Webpack 的构建流程

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

webpack 5 先规范化配置并创建 Compiler、注册插件；每次构建创建 Compilation，从入口解析模块，运行 loader 并分析依赖，递归构建模块图。随后优化模块与 chunk 图、生成代码和资源，在 processAssets 等阶段处理产物，最后输出并生成 stats。

插件贯穿生命周期，而不是独立的某一个末尾步骤；压缩、source map、哈希也属于生成/处理资源的流程。watch 下 Compiler 可复用，多次 Compilation 代表不同构建；缓存复用不等于跳过所有依赖校验。

参考：[资料 1](https://webpack.js.org/api/compiler-hooks/) · [资料 2](https://webpack.js.org/api/compilation-hooks/)。

---

## Q230｜Webpack 的热更新原理

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

开发服务器监听变化，webpack 增量编译生成热更新资源，客户端通过开发连接收到新构建信息，再由 HMR runtime 获取并应用更新。更新沿依赖图寻找 accept 边界，旧模块可通过 dispose 清理资源并保存必要状态。

能否保留状态取决于框架集成和模块接受逻辑，HMR 不保证所有编辑都保留状态。找不到可接受边界、接口变化或错误时可能回退整页刷新。重复注册监听、未清理定时器会在热更新后放大问题。

![](./images/interview/大前端面试宝典-diagram-6.png)

参考：[资料 1](https://webpack.js.org/concepts/hot-module-replacement/)。

---

## Q231｜webpack 常用 Loader

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

常见 loader 有 babel-loader（按目标转换 JS）、ts-loader（处理 TS）、css-loader（解析 CSS 依赖）、style-loader（开发时注入样式）、sass-loader/less-loader（预处理）、postcss-loader（运行 CSS 插件）、vue-loader（处理 SFC）。

webpack 5 通常使用 asset/resource、asset/inline 等资产模块替代旧 file-loader/url-loader。eslint-loader 已弃用，检查可用独立 ESLint 或 eslint-webpack-plugin。语法转译不自动补齐所有运行时 API，也不必然执行类型检查，应明确每个工具职责。

参考：[资料 1](https://webpack.js.org/loaders/) · [资料 2](https://webpack.js.org/guides/asset-modules/)。

---

## Q232｜webpack 常用 Plugin

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

HtmlWebpackPlugin 生成入口 HTML，MiniCssExtractPlugin 提取 CSS，CopyWebpackPlugin 复制额外文件，DefinePlugin 做编译期替换，分析插件辅助查看产物。webpack 5 可用 output.clean 清理输出，不一定需要额外清理插件。

DefinePlugin 替换值应正确编码，例如 JSON.stringify("production")；写入客户端 bundle 的环境变量可被访客读取，不能放密钥。插件应按具体版本兼容性选用，生产压缩也不必沿用旧 UglifyJSPlugin。

参考：[资料 1](https://webpack.js.org/plugins/) · [资料 2](https://webpack.js.org/plugins/define-plugin/)。

---

## Q233｜Loader 和 Plugin 的区别

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

loader 面向模块源内容转换，通过 module.rules 匹配资源；正常阶段通常按从右到左顺序执行，pitch 阶段另有规则。plugin 通过 apply(compiler) 注册生命周期钩子，能操作模块图、构建流程与最终资产。

例如 sass-loader 把 Sass 转成 CSS，css-loader 处理 CSS 依赖；提取或生成构建资源的插件负责更大范围的协作。异步 loader 用 this.async，异步插件按 hook 类型使用 tapAsync/tapPromise，不能在同步 hook 中启动任务后直接返回。

参考：[资料 1](https://webpack.js.org/concepts/loaders/) · [资料 2](https://webpack.js.org/concepts/plugins/)。

---

## Q234｜写一个 loader

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

下面是 webpack 5 的 CommonJS 教学 loader，读取选项并在源码前添加安全注释。写为普通函数以使用 loader context；项目为 ESM 时可将文件保存为 .cjs。

```js
// comment-loader.cjs
module.exports = function (source) {
  this.cacheable();
  const { label = "compiled" } = this.getOptions();
  const safe = String(label).replace(/\*\//g, "* /").replace(/[\r\n\u2028\u2029]/g, " ");
  return `/* ${safe} */\n${source}`;
};
```

配置时将 use 指向其绝对路径。该简例未生成精确 source map，也不处理 hashbang；真实语法变换应用解析器并维护映射。异步转换使用 this.async()，依赖额外文件需 addDependency 使缓存正确失效。

参考：[资料 1](https://webpack.js.org/api/loaders/)。

---

## Q235｜写一个 Plugin

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

插件通过 apply 注册钩子；以下 webpack 5 示例在资源处理阶段生成一个文本资产。

```js
// build-note-plugin.cjs
class BuildNotePlugin {
  apply(compiler) {
    const name = "BuildNotePlugin";
    compiler.hooks.thisCompilation.tap(name, compilation => {
      compilation.hooks.processAssets.tap({
        name, stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
      }, () => {
        compilation.emitAsset("build-note.txt",
          new compiler.webpack.sources.RawSource("Build finished"));
      });
    });
  }
}
module.exports = BuildNotePlugin;
```

配置 plugins: [new BuildNotePlugin()]。名称用于标识注册者；异步任务选择支持 Promise 的钩子，watch 时每次 compilation 独立处理资产，避免全局监听累积。

参考：[资料 1](https://webpack.js.org/contribute/writing-a-plugin/)。

---

## Q236｜Webpack 构建速度提升

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

先测冷启动、缓存启动与增量更新，再定位解析、转译、压缩或插件耗时。webpack 5 可启用 filesystem cache，并把配置文件纳入 buildDependencies；持久化构建缓存与浏览器资源长缓存是两回事。

缩小 loader include 范围、减少无用插件和昂贵 source map、按目标转译；并行 worker 有启动和通信成本，仅对足够重的工作有意义。HappyPack/DLL 等旧方案不应默认照搬。代码分割和 tree shaking 优化浏览器负载，未必缩短构建时间；升级前验证插件兼容与产物行为。

参考：[资料 1](https://webpack.js.org/guides/build-performance/) · [资料 2](https://webpack.js.org/configuration/cache/)。

---

## Q237｜Webpack 神奇注释

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

webpack 解析动态 import 的特殊注释来控制 chunk 名称、加载模式和资源提示；它们是构建器约定，不是 ECMAScript 标准。

```js
const loadEditor = () => import(
  /* webpackChunkName: "editor", webpackPrefetch: true */
  "./editor.js"
);
```

prefetch 通常提示未来导航可能需要，preload 更偏当前导航。它们可能竞争带宽，不应为所有模块添加。变量路径会产生上下文模块，应控制匹配范围；迁移到 Vite 等工具时不能假定注释仍具有相同效果。

参考：[资料 1](https://webpack.js.org/api/module-methods/#magic-comments)。

---

## Q238｜webpack 分包案例

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

按路由或大功能用动态 import 建立分割点，再用 splitChunks 复用共享依赖。示例为 webpack 5 的配置片段：

```js
module.exports = {
  mode: "production",
  output: { filename: "[name].[contenthash].js", chunkFilename: "[name].[contenthash].js" },
  optimization: { splitChunks: { chunks: "all" }, runtimeChunk: "single" },
};
```

还需入口与实际动态导入才形成相应功能块。拆得过碎会增加请求和调度成本；拆出的文件若仍被入口同步依赖，也不等于实现按需加载。发布应保留旧版本 chunk 一段时间，防止打开中的页面加载失败。

参考：[资料 1](https://webpack.js.org/guides/code-splitting/) · [资料 2](https://webpack.js.org/guides/caching/)。

---

## Q239｜Webpack 和 Vite 的区别

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

webpack 是高度可配置的模块打包器，开发通常通过内存构建和 HMR 提供资源。Vite 是包含开发服务器和生产构建的工具链，开发时利用原生 ESM、按需转换与依赖处理，缩小改动影响范围。

必须区分版本：Vite 7 及此前常见说明是 esbuild 依赖预构建/转换与 Rollup 生产打包；Vite 8 统一采用 Rolldown，并引入 Oxc 工具链。不能再把当前 Vite 永久描述成“生产一定用 Rollup”。选择时看插件生态、存量配置、兼容目标与实测构建表现，不能只比较宣传倍数。

参考：[资料 1](https://vite.dev/guide/why.html) · [资料 2](https://vite.dev/blog/announcing-vite8)。

---

## Q240｜Babel 的原理

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

Babel 的主要流程是解析源码成 AST，插件遍历与变换节点，再生成代码和 source map。preset 是一组插件与配置的组合；preset-env 按目标环境选择需要的转换，不是总把所有语法降到 ES5。

语法变换与运行时 API polyfill 不同，Promise、Array 方法等是否注入取决于明确配置及目标。Babel 可移除 TypeScript/Flow 类型语法，但不执行这些语言的完整类型检查，应另跑 tsc/Flow。过度转换和重复 helper 还会增大产物。

参考：[资料 1](https://babeljs.io/docs/) · [资料 2](https://babeljs.io/docs/babel-preset-typescript)。

---

## Q241｜模块化与组件化的区别

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

模块化按依赖和导出边界组织代码，例如一个解析器模块只暴露 parse；组件化按 UI 与行为边界组织可组合实例，例如一个有 props、事件和样式的搜索框。组件通常由一个或多个模块实现，二者可以同时使用。

模块作用域与组件实例状态不是一回事：模块顶层变量会在同一模块实例内共享，组件内部状态通常按实例隔离。划分应围绕稳定接口和变化原因，避免组件直接依赖另一业务组件的内部细节。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) · [资料 2](https://react.dev/learn/thinking-in-react)。

---

## Q242｜CommonJS 与 ESM（ECMAScript Modules） 的区别

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

CommonJS 用 require/module.exports，Node 常见路径中按需同步求值并缓存导出；ESM 的静态 import/export 支持链接阶段分析与活绑定，默认严格模式，也支持运行时 import()。不能说 ESM 完全不支持动态依赖。

CJS 导出对象也可以共享引用，“CJS 全是值拷贝”不准确；ESM 导入绑定不能由导入方重赋值，但导出的对象仍可变。循环依赖两者都有边界，ESM 可能触发暂时性死区。Node 按 .mjs/.cjs/package.json type 和版本决定解析，现代 Node 部分 require(ESM) 互操作有条件限制，应避免只凭扩展名猜行为。

参考：[资料 1](https://nodejs.org/api/esm.html) · [资料 2](https://nodejs.org/api/modules.html)。

---

## Q243｜关于服务端渲染（SSR）与客户端渲染（CSR）的理解

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

CSR 主要在浏览器执行组件生成 UI；SSR 先在服务端生成 HTML，再由浏览器接收、渲染并按需要 hydration 接管交互。两者均由浏览器最终绘制，不能把 SSR 理解为服务器替浏览器画出页面。

SSR 可更早提供内容和元数据，但增加服务端计算、缓存和 hydration 一致性成本；不保证 TTFB 或交互一定更快。SSR 首屏后仍可客户端路由跳转，无需每次整页刷新。静态生成、流式 SSR 与局部 hydration 是可组合选择，按业务数据新鲜度、SEO 与部署成本评估。

参考：[资料 1](https://vuejs.org/guide/scaling-up/ssr.html)。

---

## Q244｜单页面应用（SPA）与多页面应用（MPA）的优劣

适用：webpack 5；Babel 7；Vite 8 与早期版本区别；Node 24 ESM。

SPA 通常在同一文档中进行客户端路由和状态更新，适合交互连续的应用；MPA 通过浏览器文档导航进入不同页面，天然利用独立页面边界。SPA/MPA 描述导航方式，SSR/CSR 描述生成方式，二者不是同一维度。

SPA 要处理首屏脚本量、深链接、错误恢复与滚动状态；MPA 要考虑跨页交互连续性。MPA 的共享资源可命中缓存，不是每次都重新下载；SPA 结合 SSR/预渲染也能支持 SEO。按页面性质选择或混合，避免“某模式一定更快”的结论。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Glossary/SPA) · [资料 2](https://web.dev/articles/rendering-on-the-web)。

---

## Q419｜Electron 的主进程、渲染进程和 Preload 分别做什么？

适用：现代 Electron 的默认多进程模型。

**面试回答**：Electron 使用 Chromium 渲染网页界面，并结合 Node.js 和原生系统能力构建桌面应用。每个应用有一个主进程，负责应用生命周期、创建和管理窗口，以及调用原生对话框、菜单等能力。每个窗口加载的网页运行在渲染进程中，例如 React 界面及其交互。

Preload 是在渲染进程中、页面脚本运行前执行的脚本。启用上下文隔离时，它与页面脚本处于不同的 JavaScript 上下文，可以通过 `contextBridge` 暴露经过设计的接口。沙箱化的 Preload 只有受限的 Node.js 和 Electron API，不能假定它能使用完整 Node.js 环境。

**追问**：Preload 是独立进程吗？不是，它属于渲染进程。窗口之间不能直接共享 JavaScript 对象状态，跨进程或跨窗口协作需要设计消息通道和数据所有权。

参考：[Electron 进程模型](https://www.electronjs.org/docs/latest/tutorial/process-model) · [进程沙箱](https://www.electronjs.org/docs/latest/tutorial/sandbox)。

---

## Q420｜Electron 的 IPC 如何通信，如何选择调用方式？

适用：Electron 的 `ipcMain`、`ipcRenderer` 与 `contextBridge`。

**面试回答**：IPC 是进程间通信。页面点击“选择文件”后，可以调用 Preload 暴露的 `window.desktop.pickFile()`；Preload 使用 `ipcRenderer.invoke('file:pick')` 请求主进程，主进程通过 `ipcMain.handle('file:pick', handler)` 打开文件对话框，结果以 Promise 返回。通道名由应用定义，用户取消时应明确返回空结果，调用方也要处理请求失败。

无需回复的渲染进程到主进程通知，可用 `ipcRenderer.send` 配合 `ipcMain.on`。主进程向指定页面推送事件可使用对应窗口的 `webContents.send`，Preload 内部注册监听并提供取消订阅的方法，组件卸载时清理监听器，避免重复响应。

**追问**：传递任意 JavaScript 对象都可行吗？IPC 参数需要符合可序列化规则，DOM 对象、函数等不能直接当作普通消息传递。主进程应验证发送方、通道用途和参数，向页面暴露具体方法，而不是提供可任意发送的通用 IPC 接口。

参考：[Electron IPC 指南](https://www.electronjs.org/docs/latest/tutorial/ipc) · [ipcRenderer API](https://www.electronjs.org/docs/latest/api/ipc-renderer)。

---

## Q421｜Electron 的进程隔离、上下文隔离和沙箱有什么区别？

适用：启用上下文隔离与渲染进程沙箱的现代 Electron 应用。

**面试回答**：进程隔离将主进程和渲染进程放在不同的操作系统进程，使用各自的内存空间并通过 IPC 交换消息。上下文隔离让同一渲染进程内的 Preload 和页面脚本运行在不同的 JavaScript 上下文中，各自的全局对象相互隔离，使用 `contextBridge` 暴露选定的能力。沙箱限制渲染进程可直接使用的系统能力，需要特权的工作由主进程处理。

**追问**：开启隔离后，页面就可以安全调用任意 IPC 通道吗？应用仍需控制暴露给页面的能力。应为业务操作定义窄接口，在主进程校验发送方的 `webContents`、框架和可信来源以及参数，并处理页面导航、子框架和窗口生命周期。不要把 IPC 事件对象直接传给页面，也不要仅靠通道名称当作授权。

参考：[上下文隔离](https://www.electronjs.org/docs/latest/tutorial/context-isolation) · [进程沙箱](https://www.electronjs.org/docs/latest/tutorial/sandbox) · [IPC 发送方校验](https://www.electronjs.org/docs/latest/tutorial/security#17-validate-the-sender-of-all-ipc-messages)。

---

## Q422｜Electron 应用如何设计安全的桌面能力接口？

适用：加载本地页面或远程内容的 Electron 应用。

**面试回答**：先划清信任边界：页面负责交互，Preload 只暴露业务必需的方法，主进程执行特权操作并负责授权。窗口通常保持 `contextIsolation: true`、`sandbox: true` 和 `nodeIntegration: false`；对于远程内容尤其不能开启 Node.js 集成。配置隔离只是基础，仍需限制页面导航和新窗口、设置合适的内容安全策略（CSP），并按需处理权限请求。

例如文件选择只暴露 `pickFile()`，不要暴露让页面自行指定通道的 `send(channel, ...args)`。主进程对每个特权请求检查 `event.sender` 所属窗口及 `event.senderFrame` 的可信来源和框架，校验参数及允许的操作；来源 URL 应解析后按协议、域名和预期路径等规则检查，不能仅用字符串前缀判断。要同时考虑 iframe、窗口跳转和销毁等情况。

**追问**：为什么开启上下文隔离后仍可能不安全？如果桥接接口能力过大，或主进程相信任意请求，受攻击的页面仍可通过已暴露接口滥用权限。事件订阅的回调也只应向页面传递业务数据，不直接传递 IPC 事件对象。

参考：[Electron 安全指南](https://www.electronjs.org/docs/latest/tutorial/security) · [上下文隔离](https://www.electronjs.org/docs/latest/tutorial/context-isolation)。

---

## Q423｜Electron 中如何设计可靠的 IPC 请求和事件订阅？

适用：`invoke` / `handle` 请求及主进程向页面推送事件。

**面试回答**：把 IPC 当作跨边界的接口来设计：按业务定义通道、参数和结果；页面通过 `invoke` 等待 `handle` 的异步结果，处理 Promise 拒绝、用户取消和窗口关闭。传递的数据应符合结构化克隆规则，函数、DOM 对象等不能作为普通参数发送。不要使用同步 IPC 等待耗时操作，否则会阻塞调用方。

主进程推送进度时，通过目标窗口的 `webContents.send` 发送可序列化数据。Preload 包装监听器，只把业务数据交给页面，并返回取消订阅函数；React 组件在 effect 清理阶段调用它。重复挂载、窗口销毁和任务取消都应考虑，避免重复通知和向已销毁的窗口发送消息。

**追问**：调用失败和用户取消是一回事吗？不是。取消是预期业务结果，错误应有清晰的错误约定；跨进程错误可能丢失部分原始信息，不要依赖完整的错误对象或向页面泄露敏感路径。

参考：[Electron IPC 指南](https://www.electronjs.org/docs/latest/tutorial/ipc) · [ipcRenderer API](https://www.electronjs.org/docs/latest/api/ipc-renderer)。

---

## Q424｜Electron 多窗口如何同步状态，避免数据覆盖？

适用：设置窗口、主窗口等需要共享数据的场景。

**面试回答**：不同窗口的页面各有运行环境，不能把某个窗口的内存对象当成共享状态。可以让主进程或专门的数据服务持有权威状态：窗口启动时请求快照，修改时发送意图，数据源校验并更新后，再向相关窗口广播新状态或变更。窗口重新打开或重载时重新获取快照，不能只依赖之前的广播。

**追问**：两个窗口同时修改设置怎么办？需要明确冲突策略，例如由数据源串行处理修改、对不同字段合并，或带版本号提交并在版本冲突时提示重试。快照与订阅之间也可能发生更新，可用版本号识别遗漏并重新同步。涉及落盘时还应处理写入失败和应用意外退出；不要把广播成功误认为数据已持久化。

参考：[Electron 进程模型](https://www.electronjs.org/docs/latest/tutorial/process-model) · [Electron IPC 指南](https://www.electronjs.org/docs/latest/tutorial/ipc)。

---

## Q425｜Electron 应用卡顿时如何定位和处理？

适用：启动缓慢、界面掉帧或文件处理耗时等场景。

**面试回答**：先量化并区分启动阶段、渲染进程和主进程的问题：用 Chromium 开发者工具的性能分析观察长任务与渲染；结合主进程日志和时间标记检查启动、磁盘与 IPC 耗时。主进程承担窗口和应用生命周期管理，长时间同步计算或同步文件操作会影响整个应用；渲染进程的长任务则会阻塞页面交互。

处理时优先减少启动时不必要的工作、延迟加载非关键模块，I/O 优先使用异步接口。CPU 密集型任务可以根据隔离与通信需要放到 Worker 或独立的 utility process；`utilityProcess` 可从主进程启动具备 Node.js 能力的子进程。异步函数本身不会自动把 CPU 密集计算移出当前线程。

**追问**：放到其他进程就一定更快吗？不一定。进程启动、数据序列化和传输都可能带来开销；要比较数据规模、任务频率和资源占用，并处理进程异常退出、取消、进度和清理。

参考：[Electron 性能指南](https://www.electronjs.org/docs/latest/tutorial/performance) · [utilityProcess API](https://www.electronjs.org/docs/latest/api/utility-process)。

---

## Q426｜Electron 应用如何打包、签名和更新？

适用：面向 macOS、Windows 或 Linux 分发桌面应用。

**面试回答**：先使用 Electron Forge 等工具将应用代码、资源和 Electron 运行时打包，再根据目标系统生成安装包或分发产物。代码签名帮助操作系统和用户识别发布者并验证产物完整性；macOS、Windows 的签名和发布要求不同，macOS 分发还需根据渠道处理公证。发布前应在目标平台检查安装、启动和卸载，而不只看构建是否成功。

更新流程通常包括检查版本、下载和校验更新、提示用户并在适当时机安装；还要处理下载中断、更新失败、用户数据兼容以及回退策略。Electron 内置更新能力与不同平台、安装格式和发布服务有关，选型时应核对对应工具文档，不能假定所有平台的流程相同。

**追问**：把代码放进 ASAR 就能保护密钥吗？不能。ASAR 是应用资源归档格式，不是可靠的加密或保密方案；不要在客户端包中放置需要保密的服务端密钥。

参考：[Electron 分发概览](https://www.electronjs.org/docs/latest/tutorial/distribution-overview) · [代码签名](https://www.electronjs.org/docs/latest/tutorial/code-signing) · [应用更新](https://www.electronjs.org/docs/latest/tutorial/updates) · [ASAR 归档](https://www.electronjs.org/docs/latest/tutorial/asar-archives)。

---

# 内容维护与交互复核（2026-10-14）

## 内容范围与结论

复核 React 路径中的 Q206、react-state、closure、Q204、Q226、Q227、use-persist-fn，以及 event-loop、http-cache、Q63、Q115。依据公开原始文档核对关键语义；复核日期已更新，未改动稳定 ID 或题号。

Q204、Q206、Q226、Q227 和 Q115 的正文与逐题发布清单已同步收窄适用版本，去除这些题目不涉及的 CRA、Redux 或 V8 排序信息。

| 内容 | 核对重点 | 依据 |
| --- | --- | --- |
| 状态快照 | 回调捕获该次渲染状态，函数式更新处理队列 | [React 状态快照](https://react.dev/learn/state-as-a-snapshot) |
| Hooks / Effect / 自定义 Hook | 顶层规则、清理、依赖、逻辑复用与状态独立 | [同步 Effect](https://react.dev/learn/synchronizing-with-effects)、[自定义 Hook](https://react.dev/learn/reusing-logic-with-custom-hooks) |
| 稳定回调 | 提交阶段更新 ref；不能用来绕过 Effect 依赖 | [useRef](https://react.dev/reference/react/useRef) |
| 闭包 | 访问变量绑定，闭包本身不等同于内存泄漏 | [MDN 闭包](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures) |
| 事件循环 | 微任务检查点与 timer 示例；不承诺每任务一次绘制 | [MDN 微任务](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide) |
| HTTP 缓存 | no-cache 可存储但复用前验证，区别 no-store | [MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control) |

配图额外检查 Q46、Q50、Q302 的 6 张历史图片，未声称审核全部 86 张图片：

- Q46 第二张旧图省略 `obj.m = 40`，与当前示例不完全对应，新增明确说明并补替代文本。
- Q50 三张控制台/作用域截图补替代文本，说明控制台、经典脚本、模块的行为不能混用；[MDN let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)。
- Q302 旧图把 HTTPS 端口写成 433，新增 443 说明；[RFC 9110](https://httpwg.org/specs/rfc9110.html#https.uri)。保留原图用于历史对照，明确旧 RSA 握手不适用 TLS 1.3；本文现有技术版本仍固定 RFC 8446 基线。

闭包笔记两段代码实际执行验证输出；事件循环笔记的两段代码在 Chromium/WebKit 中执行。React 宿主示例本轮核对文档与源码语义，未把所有示例当作已运行的完整应用。

## 链接核查

首次检查 504 个去重地址：421 正常、73 重定向可用、1 个 403、9 个临时失败，没有 404/410。对 9 项重试后 5 项恢复 200；其余 Nginx、SVN、PostgreSQL 文档通过浏览工具可访问，不能认定永久失效。403 保留为访问限制，不删除或替换链接。

报告按问题优先级排序，附文章/题号/源文件行；同一 URL 保留全部引用位置，草稿不进入结果。定时工作流提供 Markdown/JSON 下载，保留 30 天。

## 交互与验收边界

新增跨标签页收藏/阅读状态、清空后不复活、清单替换/结束、题内锚点与键盘目录回归。复现 WebKit 点击“正文目录”后关闭弹窗没有返回按钮焦点；打开弹窗前显式聚焦按钮，沿用原生 dialog 的焦点恢复。

真机验收步骤见 [mobile-device-acceptance.md](./mobile-device-acceptance.md)，所有真机结果仍标记待验收。本报告属于技术复核记录，不等于内容所有者人工签字。

本地验证：142 项 Node 测试、63 项浏览器测试、类型检查、403 道题的内容门禁、165 个代码块语法检查和生产构建通过。浏览器覆盖 Chromium、WebKit、手机 WebKit 视口及开发模式；保留 1 项仅生产适用的条件跳过。

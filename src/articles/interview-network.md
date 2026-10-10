---
id: "interview-network"
title: "计算机网络面试题"
category: "网络"
description: "收录 Q293–Q329 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["HTTP","TCP","网络安全"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 111
status: draft
quality: complete
sources: ["https://www.rfc-editor.org/rfc/rfc9110","https://www.rfc-editor.org/rfc/rfc9111","https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events"]
technologyVersion: "HTTP RFC 9110/9111；浏览器 SSE"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://www.rfc-editor.org/rfc/rfc9110) · [参考 2](https://www.rfc-editor.org/rfc/rfc9111) · [参考 3](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)。


## Q293｜HTTP 请求方式

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

GET 读取资源，HEAD 获取对应头部，POST 让目标处理提交内容，PUT 创建/替换目标表示，PATCH 按补丁格式修改，DELETE 请求移除目标关联，OPTIONS 查询通信选项。方法表达语义，不是强制业务一定正确实现。

GET/HEAD 等是安全方法，PUT/DELETE 按语义幂等；幂等指多次相同请求的预期服务端效果相同，不要求响应完全相同。POST 在满足条件时可缓存，GET 也不是一定缓存。GET/DELETE 请求体没有通用语义，不能任意假设所有服务器支持。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9110#section-9)。

---

## Q294｜Get / Post 的区别

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

GET 用于获取表示，按语义应安全且幂等；POST 用于处理提交内容，通常不保证幂等。URL 查询与请求体是参数表达方式，并非安全等级：POST 表单同样可能受到 CSRF，HTTPS 才提供传输加密。

GET 响应常可缓存，POST 也存在规范允许的缓存条件。HTTP 没有统一的 URL/请求体上限，浏览器、代理与服务器各有约束。敏感数据不宜放 URL，避免历史、日志和 Referer 暴露；请求体也仍需权限和日志脱敏。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9110#section-9.3)。

---

## Q295｜RESTful 规范

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

REST 是架构风格，包括客户端/服务器、无状态、可缓存、统一接口、分层系统等约束。用名词路径和 HTTP 方法组织资源是常见实践，但仅把 URL 写成 /users/1 不代表满足所有 REST 约束。

无状态要求请求包含理解它所需的上下文，不代表服务器不能持久化资源或用户数据。接口还需明确分页、错误模型、并发更新、鉴权和幂等策略；统一接口原始约束包含超媒体驱动应用状态。

参考：[资料 1](https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)。

---

## Q296｜浏览器缓存（强缓存 / 协商缓存）

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

新鲜缓存可以直接复用已存响应，通常无需网络往返；DevTools 显示的 200/from memory cache 不代表服务器又发了一次 200。过期或要求验证时，可带 If-None-Match 或 If-Modified-Since 请求，未变化返回 304 后复用缓存正文，变化则返回新表示。

Cache-Control 优先于 Expires，ETag 条件通常优先于日期条件。no-cache 要求复用前验证，no-store 禁止存储；Vary、请求方法、授权和缓存键都会影响是否能复用。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9111) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)。

---

## Q297｜Cache-Control 的取值

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

响应常用 max-age 控制新鲜期，s-maxage 指定共享缓存新鲜期；private 限制共享缓存存储，public 允许按规则共享。no-store 禁止存储，no-cache 允许存储但复用前必须成功验证。

must-revalidate 约束过期后不得随意使用陈旧响应，不是每次新鲜命中都需验证；immutable 表示新鲜期内内容不变。stale-while-revalidate、stale-if-error 分别允许特定陈旧复用窗口。请求的 max-stale、min-fresh、only-if-cached 则是客户端偏好，不能与响应指令混为一谈。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)。

---

## Q298｜常见的 HTTP 状态码以及代表的意义

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

2xx 表示成功：200 有相应结果，201 创建资源，204 无正文；3xx 表示重定向或缓存验证，例如 301/302/307/308 和 304。4xx 多为请求或权限条件问题，5xx 表示服务端未能满足有效请求。

常见 400 参数/格式问题、401 缺少有效认证、403 拒绝访问、404 未找到、405 方法不允许、409 状态冲突、429 频率受限；500 内部错误、502 网关收到无效上游响应、503 暂不可用、504 网关等待超时。前端应保留具体状态并配合业务错误码，重试只针对合适且可安全重复的请求。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9110#section-15) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429)。

---

## Q299｜网络状态  301、302、303  有何区别？

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

301 表示永久迁移，302 表示临时迁移；历史兼容允许客户端对部分 POST 重定向改用 GET，因此不能用它们保证保留方法与请求体。303 引导客户端到其他资源执行检索，通常使用 GET（HEAD 可保留）。

需要保持方法/请求体时选择 307（临时）或 308（永久）。缓存取决于状态与缓存头，302 并非永远不可缓存，301 也不是必然永久不再请求。服务端 Location 必须避免不受控的开放重定向。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9110#section-15.4)。

---

## Q300｜400 和 401、403 状态码

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

400 表示请求存在客户端问题，例如格式非法；401 表示缺少有效认证凭证，规范要求带适当 WWW-Authenticate 挑战；403 表示服务器理解请求但拒绝满足。

403 不保证用户一定已经登录，匿名请求也可能被策略拒绝。认证失败与资源权限不足应区分处理；为隐藏敏感资源是否存在，服务端也可按策略返回 404。不要遇到所有 4xx 都自动刷新 token 或重试。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9110#section-15.5)。

---

## Q301｜Http 和 Https 的区别

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

HTTPS 是通过安全传输保护的 HTTP，现代主要使用 TLS，提供传输机密性、完整性与服务端身份认证。默认端口通常 HTTP 80、HTTPS 443，但可以自定义。TLS 不负责应用授权、输入安全或服务端数据加密。

免费自动化证书已广泛使用，不能说 HTTPS 一定收费；握手有成本但连接复用、恢复及 HTTP/2/3 会影响整体表现，不能断言 HTTP 总是更快。证书信任与主机名校验必须正确，过时 SSL 不应继续作为部署方案。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Glossary/HTTPS) · [资料 2](https://www.rfc-editor.org/rfc/rfc8446)。

---

## Q302｜描述一下 HTTPS 的加密过程

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

以 TLS 1.3 的证书认证与临时 (EC)DHE 握手为例：客户端发送支持参数和 key share，服务端选择参数并提供 key share，双方派生握手密钥；服务端发送证书、签名证明和 Finished，客户端验证信任链、主机名和握手完整性后完成握手，再使用派生的流量密钥保护应用数据。

公钥签名用于认证，密钥协商用于建立共享秘密，应用数据使用带认证的对称加密。TLS 1.3 已移除旧 RSA 密钥传输；“客户端用证书公钥加密 premastersecret”只适合解释旧握手，不能套到所有 HTTPS。共享秘密不会以明文传给窃听者；0-RTT 恢复有重放边界。下方原配图如展示 RSA 流程，应作为历史方案对照。

![](./images/interview/大前端面试宝典-diagram-7.png)

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc8446#section-2)。

---

## Q303｜Cookie 为了解决什么问题

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

Cookie 是由浏览器保存并在满足域、路径、安全、SameSite 等条件时自动随请求发送的状态数据。服务端通常用 Set-Cookie 设置，后续从 Cookie 请求头读取，因此可把多个独立 HTTP 请求关联到同一会话。

HTTP 无状态不等于不能识别用户，Cookie 只是承载标识的一种机制。单 Cookie 与总数量存在浏览器限制，约 4 KB 只能作为经验边界而非全部平台统一容量；会话 Cookie 也可能随浏览器会话恢复保留。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)。

---

## Q304｜Cookie 和 Session 的区别

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

Cookie 是客户端存储和传输机制，Session 是应用会话状态模型；常见组合是 Cookie 保存随机 session ID，服务端数据库/缓存保存会话数据。两者不是互斥方案，也都可用于未登录的购物车。

关闭浏览器不保证服务端 Session 立即删除，通常靠过期、注销和回收策略；浏览器恢复功能也可能恢复会话 Cookie。认证后应轮换会话标识，并设置 Secure、HttpOnly、SameSite，服务端校验过期与权限。HttpOnly 限制脚本读取，不阻止浏览器携带 Cookie 发请求。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) · [资料 2](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)。

---

## Q305｜TCP（传输控制协议）和 UDP（用户数据报协议）的区别

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

TCP 提供连接上的可靠、有序字节流、流量与拥塞控制，不保留应用消息边界；应用需要自己做长度或分隔帧协议。UDP 提供数据报，保留报文边界，但本身不保证交付、顺序、去重或重传。

UDP 并非“没有校验所以数据随便损坏”，它有校验和规则，可靠性和拥塞控制可由上层协议实现。QUIC 就建立在 UDP 上并提供可靠流等能力。选择协议应看实时性、丢包处理、连接环境和应用协议，而不是简单认为 UDP 总更快。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9293) · [资料 2](https://www.rfc-editor.org/rfc/rfc768)。

---

## Q306｜TCP 三次握手

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

典型 TCP 建连：客户端发 SYN，序号 x；服务端发 SYN+ACK，序号 y、确认 x+1；客户端发 ACK，确认 y+1。SYN 消耗一个序号，双方由此同步初始序号并确认各方向的可达性。

第三个 ACK 可以携带数据；丢包时按状态和定时器重传。握手不是应用身份认证，也不能单靠三次交换防御所有攻击。TCP 同时打开等情况需要按状态机分析，普通三步描述只是最常见路径。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9293#section-3.5)。

---

## Q307｜如果 TCP 变成二次握手会导致的问题

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

如果只保留 SYN 与 SYN+ACK 两次交换，服务端无法确认客户端收到自己的 SYN 和初始序号。延迟到达的旧 SYN 可能使服务端创建客户端并不想建立的连接，占用资源并造成双方状态不一致。

第三次 ACK 确认服务端序号，帮助抵御旧重复连接发起的混淆。不能把“两次握手”定义成删掉 SYN+ACK 又保留它的内容；讨论应明确保留哪两个报文。即使有三次握手，半连接资源仍需 SYN cookies、限流等机制保护。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9293#section-3.5)。

---

## Q308｜TCP 的四次挥手

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

TCP 是全双工，两个方向分别关闭：主动方发 FIN，对端 ACK；对端发送完自己的数据后再发 FIN，主动方 ACK。FIN 表示该方向不再发送数据，接收方向仍可继续，这就是半关闭。

ACK 和 FIN 可合并，所以抓包不一定恰好四个报文。典型主动关闭方进入 TIME_WAIT，以便重发最后 ACK 并让旧报文在网络中消退；对端先进入 CLOSE_WAIT 等待应用关闭。RST 是异常终止路径，应与正常关闭区分。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9293#section-3.6)。

---

## Q309｜描述一下 TCP 的拥塞控制

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

拥塞控制限制发送方给网络施加的负荷，流量控制则保护接收端缓冲区；实际可发送量同时受拥塞窗口和接收窗口等约束。经典 Reno 教学包括慢启动、拥塞避免、快速重传与快速恢复。

慢启动按确认反馈扩张窗口，拥塞避免更谨慎增长，丢包/超时或 ECN 信号会影响调整。现代实现还可能用 CUBIC、BBR 等，不能说所有 TCP 固定只有同一套四算法。优化应看 RTT、丢包、吞吐和排队时延，不只是盲目增大窗口。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc5681)。

---

## Q310｜什么是跨域？如何解决？

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

浏览器的源通常由协议、主机和端口组成，任一不同即跨源。同源策略主要限制脚本读取跨源敏感数据，并不禁止所有跨源发送、嵌入与导航。

API 共享可由服务端配置 CORS，或通过同源 BFF/反向代理；postMessage 用于合作窗口通信并校验 origin/source。带凭据 CORS 必须明确允许源并配置 credentials，不能用星号冒充授权。mode: "no-cors" 只得到不透明响应，不能让前端读取任意跨源数据。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)。

---

## Q311｜同源策略具体限制的具体内容

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

同源策略限制跨源 DOM/窗口访问、Web Storage 等数据访问，以及 fetch/XHR 对响应的读取。图片、经典脚本、样式、表单和导航有各自允许规则，因此不是“跨源脚本都不能执行”。

postMessage 是被允许的跨源通信机制，接收方要验证来源、窗口和数据结构。Cookie 按域/路径/Secure/SameSite 等规则处理，不按端口隔离，不能直接套用源三元组。CORS 授权响应读取也不等于服务端业务鉴权。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)。

---

## Q312｜发起请求是浏览器做了什么。

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

浏览器依据 URL、请求模式、凭据、缓存与安全策略构造请求。需要时进行 CORS 预检，成功后才发实际请求；满足简单请求条件或命中预检缓存时不一定有 OPTIONS。Service Worker、HTTP 缓存和连接复用还会改变实际网络路径。

传输后浏览器按 CORS 等规则决定脚本是否可读取响应。某些跨源请求已到服务器并产生影响，但脚本仍看不到响应，所以 CORS 失败不能证明业务动作没发生。诊断需同时看 Network、服务端日志与具体错误。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) · [资料 2](https://fetch.spec.whatwg.org/)。

---

## Q313｜XSS 攻击是什么？

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

XSS 是不可信数据被当作可执行内容进入页面，导致攻击者代码在受害站点上下文运行。存储/反射描述数据如何到达，DOM 型强调客户端源到危险 sink 的路径，三者不是完全互斥分类。

防护首先使用 textContent 或框架默认文本转义；确需富文本时用成熟白名单清洗器，URL 还需限制协议，禁止将输入放入脚本和危险 HTML sink。CSP/Trusted Types 可作纵深防护，不能替代输出上下文处理。HttpOnly 可防止直接读取会话 Cookie，但 XSS 仍可能代用户执行操作。

参考：[资料 1](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)。

---

## Q314｜SQL 注入

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

SQL 注入发生在把外部输入拼入 SQL 语法，输入改变原查询结构。首选参数化查询，使数据与语句结构分离，而不是仅替换引号。

```js
// mysql2/promise；connection 已建立，userId 是待绑定数据
const [rows] = await connection.execute(
  "SELECT id, name FROM users WHERE id = ?", [userId]
);
```

表名、列名和排序方向通常不能作为值占位符绑定，应映射到固定允许列表；同时校验类型、使用最小数据库权限并避免向客户端暴露 SQL 错误。ORM 的原始查询拼接也可能引入注入。

参考：[资料 1](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)。

---

## Q315｜DDoS 攻击

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

DDoS 利用分布式流量耗尽带宽、连接状态或应用资源，既可发生在网络层，也可通过昂贵 HTTP 请求消耗数据库/CPU。流量多不一定是攻击，应结合来源分布、行为、错误和资源指标判断。

防护包括上游清洗/CDN、连接与请求限额、WAF、缓存、超时和负载降级，并保护源站不被绕过。应用单机限流无法解决上游链路已被打满的问题；规则还要避免误伤共享出口的真实用户，建立可观测与恢复流程。

参考：[资料 1](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)。

---

## Q316｜CSRF 攻击

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

CSRF 利用浏览器自动携带目标站点凭据，诱导用户发起其未授权的状态修改请求。攻击者不必读到响应，POST 表单也可构成攻击；CORS 和 HttpOnly 不能单独阻止。

采用与会话绑定的 CSRF token 或规范的签名双提交方案，校验 Origin/Fetch Metadata，合理设置 SameSite，并避免 GET 修改状态。跨站登录等合法流程需要评估 Cookie 策略。服务端仍需认证和资源级授权；XSS 可能绕过许多 CSRF 防护，应同时治理。

参考：[资料 1](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)。

---

## Q317｜Ajax 的定义及优缺点

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

Ajax 描述浏览器通过脚本异步交换数据并局部更新页面的方式，历史名称包含 XML，实际可用 JSON、文本等，常用 fetch 或 XMLHttpRequest。它减少整页导航但不自动降低总流量或保证页面更快。

跨源可通过 CORS 合法访问，并非“不支持跨域”。异步页面需处理加载、错误、竞态、取消、历史/焦点及可访问性；SEO 是否受影响取决于内容呈现与抓取方式，必要时结合 SSR/预渲染。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Glossary/AJAX)。

---

## Q318｜XMLHttpRequest 对象用法

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

XHR 用 open 初始化，设置响应类型、头部和事件后 send。load 仅表示传输完成，必须检查 HTTP 状态；error、timeout、abort 分别处理网络、超时与取消。

```js
const xhr = new XMLHttpRequest();
xhr.open("GET", "/api/users", true);
xhr.responseType = "json";
xhr.timeout = 5000;
xhr.onload = () => {
  if (xhr.status >= 200 && xhr.status < 300) console.log(xhr.response);
  else console.error(`HTTP ${xhr.status}`);
};
xhr.onerror = () => console.error("网络或 CORS 错误");
xhr.ontimeout = () => console.error("超时");
xhr.onabort = () => console.log("已取消");
xhr.send();
```

可调用 xhr.abort() 取消；JSON responseType 下不要读取 responseText。同步 XHR 会阻塞主线程，不应在页面逻辑中使用。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)。

---

## Q319｜封装一个 ajax 请求方法

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

封装 XMLHttpRequest 时至少要统一成功状态、网络错误、超时、取消、请求头和响应类型。不要把所有非 200 状态都当成网络错误：只要请求到达服务器，HTTP 状态应保留给调用方判断。下面约定只有 2xx resolve，其他状态 reject，并支持 AbortSignal。

```js
function request(url, options = {}) {
  const { method = 'GET', headers = {}, body = null, timeout = 10000,
    responseType = 'json', signal } = options;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('请求已取消', 'AbortError')); return; }
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.timeout = timeout;
    xhr.responseType = responseType;
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    const abort = () => xhr.abort();
    const cleanup = () => signal?.removeEventListener('abort', abort);
    signal?.addEventListener('abort', abort, { once: true });
    xhr.onload = () => {
      cleanup();
      const result = { status: xhr.status, data: xhr.response, headers: xhr.getAllResponseHeaders() };
      if (xhr.status >= 200 && xhr.status < 300) resolve(result);
      else reject(Object.assign(new Error(`HTTP ${xhr.status}`), result));
    };
    xhr.onerror = () => { cleanup(); reject(new TypeError('网络错误')); };
    xhr.ontimeout = () => { cleanup(); reject(new Error(`请求超时：${timeout}ms`)); };
    xhr.onabort = () => { cleanup(); reject(new DOMException('请求已取消', 'AbortError')); };
    try { xhr.send(body); } catch (error) { cleanup(); reject(error); }
  });
}
```

```js
const controller = new AbortController();
request('/api/users', { signal: controller.signal }).then(({ data }) => console.log(data));
// controller.abort();
```

传 JSON 时由调用方同时执行 JSON.stringify，并设置 Content-Type。上传 FormData 时不要手动设置 multipart/form-data，否则浏览器无法自动补 boundary。Axios 不只是“简单 XHR 包装”，还提供配置合并、拦截器、适配器、转换和兼容层等能力。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)。

---

## Q320｜Fetch API

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

Fetch 是 WHATWG Fetch Living Standard 定义的请求 API，返回 Promise<Response>，并与 Headers、Request、流和 AbortSignal 配合。HTTP 404/500 通常仍 resolve，网络/CORS/取消等失败才 reject，所以要主动检查 ok/status。

```js
async function getJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}
```

正文通常只能消费一次，JSON 解析也可能失败。默认凭据策略为 same-origin，跨源携带 Cookie 需要客户端与服务端共同配置；no-cors 无法获得任意可读响应。

参考：[资料 1](https://fetch.spec.whatwg.org/) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)。

---

## Q321｜fetch 与 XMLHttpRequest 的区别

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

fetch 使用 Promise 与 Request/Response，便于流式读取和 Service Worker；XHR 是事件驱动对象，支持 timeout、abort 和成熟的上传 progress。XHR 不需要另建一个“XMLHttpResponse”对象。

两者都受 CORS 约束，都可取消：XHR 用 abort，fetch 用 AbortController。两者 HTTP 错误都需检查状态。fetch 支持响应流，但浏览器上传进度不能直接照搬 XHR 的事件 API；根据兼容目标、进度与现有封装选择，不能以“现代 API 自动解决跨域”作理由。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)。

---

## Q322｜请求会发送2次的原因

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

先查看两条记录的 method、status、Initiator 与时间：OPTIONS 加实际请求通常是预检；3xx 后到 Location 的请求是重定向；两个相同业务请求则可能来自重复监听、重试、Effect 依赖或开发 StrictMode。

预检不是每个跨源请求必有，也可能命中预检缓存；重定向顺序是先原 URL 再目标 URL。用请求 ID 和服务端日志确认是否真正重复执行业务，修复重复触发并为不可重复操作设置服务端幂等，不能简单屏蔽第二条请求。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) · [资料 2](https://react.dev/reference/react/StrictMode)。

---

## Q323｜websocket

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

WebSocket 提供持久连接上的双向消息通信，适合交互频繁的聊天或协作。浏览器 API 通过 open/message/error/close 处理生命周期，可发送文本与二进制；HTTP/1.1 常见握手通过 Upgrade，HTTP/2 等有不同扩展机制。

生产中需鉴权、Origin 检查、心跳、重连退避、消息序号与积压限制；连接建立不等于会话永不过期。浏览器 WebSocket 缺少自动背压，应监测 bufferedAmount 并限流，避免消息队列占满内存。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) · [资料 2](https://www.rfc-editor.org/rfc/rfc6455)。

---

## Q324｜WebSocket 建立连接的过程

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

HTTP/1.1 握手由客户端发送 GET、Upgrade: websocket、Connection: Upgrade、Sec-WebSocket-Key 和版本等头；服务端校验后返回 101 与计算出的 Sec-WebSocket-Accept，随后双方交换 WebSocket 帧。wss 在此之外使用 TLS。

Accept 是基于随机 key 与固定 GUID 的握手确认，不是用户认证或数据加密。服务端必须检查 Origin 与会话权限。HTTP/2 扩展 CONNECT 不使用完全相同的 101/Upgrade 流程，所以应明确这里描述的是 HTTP/1.1。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc6455#section-4) · [资料 2](https://www.rfc-editor.org/rfc/rfc8441)。

---

## Q325｜Websocket 支持传输的数据格式

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

WebSocket 协议有文本消息和二进制消息，文本必须是有效 UTF-8；JSON 是应用选择的文本编码，不是独立帧类型。浏览器 send 可接收字符串、Blob、ArrayBuffer 或视图，接收二进制用 binaryType 选择 Blob/ArrayBuffer。

消息可能在传输中分片，应用还要规定 schema、版本、长度限制和校验。不要把 WebSocket 帧边界与 TCP 数据包边界等同，也不能假定收到的任意文本都是合法 JSON。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send) · [资料 2](https://www.rfc-editor.org/rfc/rfc6455#section-5)。

---

## Q326｜Server-Sent Events (SSE)

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

SSE 用 HTTP 响应持续发送 UTF-8 text/event-stream 文本，事件由空行分隔，支持 data、event、id、retry 等字段。EventSource 提供接收和自动重连，id/Last-Event-ID 可辅助服务端实现断点续传，但不会自动持久保存消息。

同一连接主要是服务端向客户端，客户端发送可另用 HTTP。代理缓冲、压缩、超时与心跳会影响实时性；原生 EventSource 主要发 GET，不能任意设置 Authorization 头，需按鉴权需求选择 Cookie 或 fetch 流式方案。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)。

---

## Q327｜Server-Sent Events (SSE)  示例代码

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

下面用 Node HTTP 提供同源 SSE，每两秒推送一次时间；浏览器侧需要从同源页面访问或配置对应代理。它只演示传输，不提供鉴权、历史重放或业务确认。

```js
import { createServer } from "node:http";
createServer((req, res) => {
  if (req.url !== "/events" || req.method !== "GET") { res.writeHead(404).end(); return; }
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" });
  res.write(": connected\n\n");
  const timer = setInterval(() => {
    // 客户端过慢则断开，避免无限积压；EventSource 会尝试重连。
    if (!res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`)) {
      clearInterval(timer);
      res.end();
    }
  }, 2000);
  res.on("close", () => clearInterval(timer));
}).listen(3000);
```

```js
const source = new EventSource("/events");
source.onmessage = event => console.log(JSON.parse(event.data));
// 组件卸载时调用 source.close()；事件负载应按业务 schema 校验。
```

Nginx 等中间层需关闭该路由响应缓冲并配置足够的读超时，客户端重连要结合事件 ID 才能实现可靠续传。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) · [资料 2](https://nodejs.org/api/http.html)。

---

## Q328｜SSE 与 websocket 区别

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

SSE 基于 HTTP 响应流发送文本，服务端单向推送，EventSource 内置重连和事件 ID 机制；WebSocket 提供双向文本/二进制消息，重连与应用确认通常自己实现。SSE 也可运行在 HTTP/2，不限定 HTTP/1.1。

通知、日志和模型输出常适合 SSE；高频双向协作可选 WebSocket。两者都需处理代理、鉴权、心跳、流控和连接数，SSE 的自动重连不代表消息恰好一次，WebSocket 也不天然比所有 HTTP 流更省资源。

参考：[资料 1](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)。

---

## Q329｜http2.0

适用：HTTP RFC 9110/9111/9113；TCP RFC 9293；TLS 1.3 RFC 8446；浏览器 Fetch/XHR/SSE。

HTTP/2 在一个 TCP 连接中用二进制帧多路复用多个流，使用 HPACK 压缩头部，并提供连接/流级别流量控制。它保留 HTTP 方法、状态和语义，改变主要是传输表达。

它缓解 HTTP/1.1 应用层排队，但 TCP 丢包仍可能阻塞整个连接的交付；HTTP/3 用 QUIC 的独立流减少这类跨流阻塞。流控不自动保证公平，优先级是协作提示。Server Push 虽在协议中存在，浏览器支持已收缩，不能当成通用前端优化默认启用；现代浏览器的 HTTP/2 通常经 TLS 协商。

参考：[资料 1](https://www.rfc-editor.org/rfc/rfc9113) · [资料 2](https://developer.chrome.com/blog/removing-push)。

---

---
id: "interview-server"
title: "前端服务端面试题"
category: "服务端"
description: "收录 Q346–Q355 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["Node.js","Nginx","服务端"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 113
status: draft
quality: complete
sources: ["https://expressjs.com/en/resources/middleware/cors/","https://nginx.org/en/docs/http/ngx_http_proxy_module.html"]
technologyVersion: "补充示例基于 Node、Express 5 与 Nginx HTTP proxy 模块"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://expressjs.com/en/resources/middleware/cors/) · [参考 2](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)。


## Q346｜nodejs 特点

适用：Node 24；Express 5；Koa async 中间件；Nginx HTTP 配置。

Node.js 是基于 V8 的 JavaScript 运行时，事件循环配合非阻塞 I/O 适合大量等待网络/文件的任务。一个 isolate 通常在一个线程执行 JS，但运行时还有线程池和其他内部线程，也可使用 worker_threads；不能把整个 Node 进程说成只有一个线程。

同步文件操作、巨型 JSON 处理和 CPU 循环仍会阻塞事件循环。CPU 重任务可放 Worker/独立进程，注意队列、通信和内存成本。非阻塞模型不自动保证低延迟，需要限制并发、设置超时并测量事件循环延迟。

参考：[资料 1](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop) · [资料 2](https://nodejs.org/api/worker_threads.html)。

---

## Q347｜nodejs 作用

适用：Node 24；Express 5；Koa async 中间件；Nginx HTTP 配置。

Node 可用于 BFF/API、SSR、CLI、构建工具、WebSocket 服务和任务编排。BFF 常按页面聚合后端接口、整理错误和会话，减少前端连接复杂度。

聚合并不意味着越多越好：要设单请求预算、限制扇出并发、传递取消、记录追踪 ID，并避免把底层所有失败隐藏成成功。CPU 密集计算或强隔离场景可交给更适合的服务，选择依据是团队与工作负载，而不是语言统一就必然性能更好。

参考：[资料 1](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)。

---

## Q348｜nodejs 开放跨域白名单

适用：Node 24；Express 5；Koa async 中间件；Nginx HTTP 配置。

服务端按完整 Origin 白名单决定是否开放响应读取。Express 的 cors 中间件可处理预检与 Vary: Origin，带凭据时不能使用通配符。

```js
import express from "express";
import cors from "cors";
const app = express();
const allowed = new Set(["https://example.com"]);
app.use(cors({
  origin(origin, callback) { callback(null, origin !== undefined && allowed.has(origin)); },
  credentials: true,
}));
app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(3000);
```

未允许的来源不会获得 CORS 响应头，但请求仍可能到达路由；无 Origin 的服务端/同源调用也不需此授权头。CORS 不是认证、CSRF 或防爬边界，敏感接口必须另做身份与权限校验，不要用 endsWith 域名后缀判断替代精确匹配。

参考：[资料 1](https://expressjs.com/en/resources/middleware/cors/)。

---

## Q349｜dependencies 和 devDependencies 两者区别

适用：Node 24；Express 5；Koa async 中间件；Nginx HTTP 配置。

dependencies 声明包正常使用/运行所需依赖，devDependencies 声明本包开发、测试与构建工具。npm 默认安装通常包含两者，npm ci --omit=dev 才会省略开发依赖；构建阶段仍可能需要它们。

前端静态站点最终部署的是构建产物，浏览器不会读取 package.json 决定下载哪些包，实际 bundle 由 import 图与打包配置决定。SSR/Node 服务运行期用到的库应正确放入 dependencies；可复用库的 peerDependencies 则表达与宿主的版本契约。

参考：[资料 1](https://docs.npmjs.com/cli/v11/configuring-npm/package-json)。

---

## Q350｜幽灵依赖是什么 及 解决方案

适用：Node 24；Express 5；Koa async 中间件；Nginx HTTP 配置。

幽灵依赖指代码直接导入了未在所属包依赖清单声明的包，却因提升或其他间接依赖暂时能解析。上游升级或安装布局变化后就可能失败。

修复应把直接使用的包声明在正确 workspace 的 dependencies/devDependencies/peerDependencies 中，使用 lockfile 和干净 npm ci 验证。pnpm 严格布局或 Yarn PnP 可更早暴露问题，但提升例外和配置仍会影响结果；npm ls 只能帮助分析依赖图，不会自动找全源码里的未声明导入。

参考：[资料 1](https://pnpm.io/symlinked-node-modules-structure) · [资料 2](https://docs.npmjs.com/cli/v11/commands/npm-ci)。

---

## Q351｜从服务器接收到 url 开始 到 返回响应结果 发生了什么事

适用：Node 24；Express 5；Koa async 中间件；Nginx HTTP 配置。

服务端连接通常先经过负载均衡/反向代理、TLS 与 HTTP 解析，再进入路由和中间件：请求大小限制、认证授权、参数校验、业务处理、数据库/下游访问、响应编码与发送。缓存、流式响应或提前拒绝会缩短该路径。

需要贯穿请求 ID、超时、取消、错误映射与日志脱敏；响应发出后客户端断开不一定自动取消底层数据库任务。高并发下还要控制连接池与队列，避免单次慢依赖耗尽服务资源。顺序以具体框架和中间件注册为准。

参考：[资料 1](https://nodejs.org/api/http.html) · [资料 2](https://expressjs.com/en/guide/using-middleware.html)。

---

## Q352｜Koa 和 Expreess 区别

适用：Node 24；Express 5；Koa async 中间件；Nginx HTTP 配置。

Express 通过 req/res/next 组织路由和中间件，生态丰富；Koa 通过 ctx 与 async 中间件组织流程，await next() 形成下游执行后再返回上游的洋葱模型。Koa 核心通常需另接路由和 body parser。

Express 5 对返回 Promise 的路由/中间件拒绝会自动交给错误处理，不能沿用“Express 完全不支持 async”旧结论。Koa 的异步错误可在上游 try/catch 中集中捕获，但未 await 的后台 Promise 仍需自行管理。性能取决于实际中间件和业务，不按框架名字保证。

参考：[资料 1](https://expressjs.com/en/guide/error-handling.html) · [资料 2](https://koajs.com/)。

---

## Q353｜nginx 配置

适用：Node 24；Express 5；Koa async 中间件；Nginx HTTP 配置。

Nginx 在 http 块中配置 server，再通过 location 匹配请求。下面是部署在根路径的 SPA 示例片段：

```nginx
server {
    listen 80;
    server_name example.com;
    root /srv/app/dist;
    location /assets/ { try_files $uri =404; }
    location /api/ { proxy_pass http://127.0.0.1:3000; }
    location / { try_files $uri $uri/ /index.html; }
}
```

上线还需配置 HTTPS、入口与指纹资源缓存、日志和请求限制。API 与缺失静态文件不能一律回退 HTML；改动后先 nginx -t 校验，再按环境流程 reload。子路径部署要对齐构建 base 与服务器路由。

参考：[资料 1](https://nginx.org/en/docs/beginners_guide.html)。

---

## Q354｜nginx 配置代理转发，解决跨域问题

适用：Node 24；Express 5；Koa async 中间件；Nginx HTTP 配置。

让浏览器向同源 /api 请求，再由 Nginx 转发给上游，可避免前端读取跨源 API 的限制。proxy_pass 是否带 URI 尾斜杠会影响路径替换：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_connect_timeout 5s;
    proxy_read_timeout 30s;
}
```

此例 /api/users 转为上游 /users；不带尾部 / 的版本通常保留 /api/users。后端只应信任已知代理添加的转发头；Cookie Domain/Path、流式响应缓冲及 WebSocket 升级需按具体路由另配。

参考：[资料 1](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)。

---

## Q355｜反向代理

适用：Node 24；Express 5；Koa async 中间件；Nginx HTTP 配置。

反向代理代表服务端接收客户端请求并转发到内部服务，常用于 TLS 终止、路由、负载均衡、缓存与访问控制；正向代理主要代表客户端访问外部目标。

反向代理不等于只隐藏 IP 或自动消除跨域，它必须与浏览器访问入口和转发规则配合。要明确可信转发头、超时、缓冲、请求体限制和健康检查，并保留请求 ID 以区分代理失败与上游失败。代理不能代替后端资源级权限校验。

参考：[资料 1](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)。

---

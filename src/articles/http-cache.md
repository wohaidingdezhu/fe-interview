---
id: "http-cache"
title: "理解 HTTP 缓存"
category: "浏览器与网络"
kind: "知识文章"
description: "沿着一次请求，理解新鲜度检查、条件请求与 304。"
tags: ["网络", "性能", "面试"]
addedAt: "2026-10-08"
order: 6
status: published
quality: complete
---

## 先理解两个阶段

浏览器复用 HTTP 响应时，可以先判断缓存是否仍然新鲜；需要重新验证时，再向服务器发送条件请求。面试中通常把它们称为“强缓存”和“协商缓存”。

## 缓存仍然新鲜

```http
Cache-Control: max-age=600
```

这个响应允许缓存在满足其他适用条件时，在指定的新鲜期内复用。对于普通资源请求，浏览器可能直接使用缓存内容，避免一次网络传输。用户主动刷新等情况可能改变具体缓存行为。

## 需要向服务器验证

服务器可以在响应中附上验证器：

```http
ETag: "article-v3"
Cache-Control: no-cache
```

下次复用前，客户端可以发起条件请求：

```http
If-None-Match: "article-v3"
```

如果对应资源未变化，服务器可返回 `304 Not Modified`，客户端复用已有响应体；发生变化时，则返回新的完整响应。

## 三个容易混淆的指令

| 指令 | 含义 |
| --- | --- |
| max-age=600 | 设置缓存的新鲜期为 600 秒 |
| no-cache | 可以存储，但再次使用前需要验证 |
| no-store | 不应存储该请求或响应的内容 |

`no-cache` 不等于“不存储”。对于敏感内容，应根据实际需求考虑 `no-store` 等策略。

## 在前端部署中怎么用

带内容哈希的静态资源可以配置较长缓存时间，因为内容变化时 URL 也会变化。HTML 入口通常需要更及时地更新，避免继续引用旧版本资源。

具体响应头由托管服务或服务器设置，不能只通过 React 代码决定。

## 参考资料

- [MDN：HTTP 缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)
- [MDN：Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)

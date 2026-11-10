---
id: "typescript-api-boundary"
title: "TypeScript 接口实战：从 unknown 到可渲染的用户数据"
category: "TypeScript"
kind: "知识文章"
description: "从 HTTP、JSON 和字段三个阶段排查接口错误，用可辨识联合把结果交给界面。"
tags: ["TypeScript", "Fetch", "运行时校验", "可辨识联合"]
aliases: ["接口数据校验", "类型守卫", "API 响应解析"]
related: ["interview-typescript", "interview-business"]
addedAt: "2026-11-10"
reviewedAt: "2026-11-10"
status: published
quality: complete
sources: ["https://www.typescriptlang.org/docs/handbook/2/narrowing.html", "https://fetch.spec.whatwg.org/#dom-body-json"]
technologyVersion: "TypeScript strict 模式与标准 Fetch API；练习使用 Node.js 24"
---

## 先定位失败发生在哪一层

用户详情页约定接口返回正整数 `id` 和非空 `name`。如果后端临时把 `id` 从数字改成字符串，`as User` 无法保护界面。可以在响应进入业务代码之前完成三道检查。

| 阶段 | 反例 | 界面需要的信息 |
| --- | --- | --- |
| HTTP 状态 | 503，正文可能是 HTML | 状态码，可用于显示请求失败 |
| 正文读取与解析 | 200，正文截断成 `{"id":` | 正文无法读取或解析 |
| 字段契约 | 200，合法 JSON 为 `{"id":"7","name":"小林"}` | 字段格式与约定不同 |

`fetch()` 收到 HTTP 错误状态时仍可以返回 `Response`，因此先读 `response.ok`，再调用 `json()`。建立类型约束的地方是字段校验后的返回值，调用方可以按结果的 `kind` 决定如何渲染。[Fetch 标准](https://fetch.spec.whatwg.org/#dom-body-json) · [TypeScript 类型收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

## 可本地运行的响应检查

将这段代码存为 `api-response.mts`，用 Node.js 24 执行 `node api-response.mts`。示例用内存中的 `Response` 模拟请求结果，无需启动服务。

```typescript
type User = { id: number; name: string };
type UserResult =
  | { kind: 'ok'; user: User }
  | { kind: 'http-error'; status: number }
  | { kind: 'body-error' }
  | { kind: 'invalid-user' };

function parseUser(value: unknown): User | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  if (!('id' in value) || !('name' in value)) return null;

  const { id, name } = value;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) return null;
  if (typeof name !== 'string' || name.trim() === '') return null;

  return { id, name: name.trim() };
}

async function readUser(response: Response): Promise<UserResult> {
  if (!response.ok) return { kind: 'http-error', status: response.status };

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { kind: 'body-error' };
  }

  const user = parseUser(payload);
  return user ? { kind: 'ok', user } : { kind: 'invalid-user' };
}

const cases = [
  { response: Response.json({ id: 7, name: ' 小林 ' }), expected: 'ok' },
  { response: new Response('Unavailable', { status: 503 }), expected: 'http-error' },
  { response: new Response('{"id":'), expected: 'body-error' },
  { response: Response.json({ id: '7', name: '小林' }), expected: 'invalid-user' },
  { response: Response.json({ id: 7 }), expected: 'invalid-user' },
  { response: Response.json({ id: 7, name: '  ' }), expected: 'invalid-user' },
  { response: Response.json(null), expected: 'invalid-user' },
];

for (const { response, expected } of cases) {
  const result = await readUser(response);
  if (result.kind !== expected) throw new Error(`预期 ${expected}，实际 ${result.kind}`);
  if (result.kind === 'ok' && (result.user.id !== 7 || result.user.name !== '小林')) {
    throw new Error('成功结果的数据不符合预期');
  }
  console.log(result.kind);
}
```

业务代码在 `kind === 'ok'` 时可直接使用 `result.user`，在 `kind === 'http-error'` 时可读 `result.status`。示例按用户详情接口的约定处理 2xx，`204` 的空正文会进入 `body-error`。若某个接口允许无正文成功，就为它明确增加相应结果。实际发起请求还要处理拿不到 `Response` 的情况，例如网络断开。若支持取消，请在调用处识别取消，包括请求发出后读取正文时的取消，避免把主动取消展示成错误。

## 再做两个变更练习

1. 把 `id` 改成 `0`、`1.5` 或超出安全整数的值，观察合法 JSON 仍进入 `invalid-user`。如果产品使用字符串 ID，先统一前后端契约，再一起调整解析器与测试。
2. 在界面加上加载中与失败后重试，按 [Q407 的联合类型写法](?article=interview-typescript#q407) 建模。模拟接口已返回但字段不合规，确认界面显示正确错误，并且旧用户数据没有被误当成新请求的结果。

继续阅读 [Q406 接口数据与类型断言](?article=interview-typescript#q406) 和 [Q399 请求乱序](?article=interview-business#q399)。

---
id: "interview-ai-fullstack"
title: "AI 全栈面试题"
category: "AI 全栈"
description: "收录 Q368–Q396 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["LLM","RAG","Agent"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 115
status: draft
quality: complete
sources: ["https://modelcontextprotocol.io/docs/getting-started/intro","https://platform.openai.com/docs/overview"]
technologyVersion: "工具快速迭代；各题标注固定版本或文档核对日期"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://modelcontextprotocol.io/docs/getting-started/intro) · [参考 2](https://platform.openai.com/docs/overview)。


## Q368｜LLM 是什么

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

LLM 是在大量数据上训练、具有较大参数规模的语言模型，常见自回归模型按上下文预测下一 token，再通过后训练改善指令遵循与任务表现。它可用于生成、总结、提取和辅助推理，但流畅输出不等于事实正确。

能力取决于数据、训练目标、架构、推理预算与评估任务，不能说参数越多必然越强。知识更新、权限、工具执行与业务状态通常由外部系统提供；应对具体业务建立准确率、延迟、成本和拒答评估。

参考：[资料 1](https://huggingface.co/learn/llm-course/chapter1/1)。

---

## Q369｜目前热门 LLM 大模型

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

常见模型生态包括 OpenAI GPT、Anthropic Claude、Google Gemini，以及 Meta Llama、Qwen、DeepSeek、Mistral、Gemma 等开放权重或不同授权模式的系列。具体在售型号与能力变化很快，应以供应商当前目录及许可为准，不把某个型号永久列为“最强”。

选型使用同一业务评测集，比较文本/多模态/工具能力、上下文、延迟、总成本、部署位置、数据政策与许可。开放权重不一定等于 OSI 意义的开源；长上下文上限也不代表其中信息能被同样可靠利用。

参考：[资料 1](https://platform.openai.com/docs/models) · [资料 2](https://ai.google.dev/gemini-api/docs/models) · [资料 3](https://huggingface.co/models)。

---

## Q370｜问题：关于 AI 的名词解释

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

Prompt 是模型输入的指令与上下文；token 是模型处理文本等内容的基本单位；embedding 将内容映射为向量表示。RAG 先检索资料再生成，微调则改变模型或适配器参数。

Tool/function calling 让模型输出结构化工具请求，由运行时校验并执行；Agent 将模型、工具与状态反馈组织为目标导向流程。MCP 是由 Anthropic 在 2024 年推出的开放集成协议，描述应用与上下文/工具服务的通信。提示注入是不可信输入试图改变应用的指令边界，可能来自网页/文档等间接来源，不能仅靠关键词过滤解决。

参考：[资料 1](https://modelcontextprotocol.io/specification/2025-06-18/) · [资料 2](https://www.anthropic.com/news/model-context-protocol) · [资料 3](https://platform.openai.com/docs/guides/function-calling)。

---

## Q371｜关于全栈名词解释

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

BFF 为特定前端聚合与适配后端能力；SSR 在服务端生成初始 HTML，仍由浏览器绘制并可能 hydration。Monorepo 把多个项目放在同一仓库，需明确包边界和构建依赖，不自动等于微服务。

CI 是持续整合验证；CD 可指持续交付或持续部署，前者保留发布决策，后者自动部署通过门禁的变更。容器封装用户空间依赖，仍受架构、内核与外部配置影响。解释名词时应说明它解决哪一层问题及代价。

参考：[资料 1](https://samnewman.io/patterns/architectural/bff/) · [资料 2](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)。

---

## Q372｜大模型在 ToB 领域中应用的常见问题

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

企业应用常遇到内部知识缺失/过期、权限隔离、幻觉、成本延迟、数据泄漏、工具误调用及结果不可追踪等问题。RAG 可提供最新资料，但无法单独解决所有问题，更不能保证生成内容正确。

从有明确验收标准的任务开始，检索时按身份过滤，回答引用可访问来源并允许证据不足时拒答。执行操作由服务端校验权限和参数，建立离线评测、线上监控与人工升级路径。是否适合生产取决于错误后果和控制措施，不是一概不可用。

![](./images/interview/大前端面试宝典-image-62.png)

参考：[资料 1](https://www.anthropic.com/engineering/building-effective-agents) · [资料 2](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)。

---

## Q373｜LLM 出现幻觉（Hallucination）的深层原因是什么

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

幻觉指模型输出不受证据支持或与事实冲突的内容。训练目标通常优化 token 预测和偏好，并不直接等同逐项事实验证；训练资料噪声、知识缺口、上下文误读和检索错误都可能导致虚构。

降低温度不能保证真实性，RAG 也可能检索错或被误引用。缓解应检查证据与引用、使用可验证工具、结构化输出、允许不确定，并对高影响任务增加验证。模型可通过工具获得实时信息，因此“LLM 永远不能联网”也不是系统层面的准确结论。

参考：[资料 1](https://arxiv.org/abs/2311.05232) · [资料 2](https://platform.openai.com/docs/guides/evaluation-best-practices)。

---

## Q374｜RAG （检索增强生成）是什么？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

RAG 把检索到的外部资料作为生成上下文，使模型可以利用训练后更新或私有的数据。检索可用关键词、向量、结构化查询或混合方案，不一定必须有向量数据库，也不需要先改变模型权重。

基本路径是问题理解 → 检索与权限过滤 → 排序/裁剪 → 带证据生成 → 引用与验证。效果取决于资料质量、召回和生成忠实性，检索命中不代表答案必然正确，应分别评估召回率与答案质量。

参考：[资料 1](https://arxiv.org/abs/2005.11401) · [资料 2](https://platform.openai.com/docs/guides/retrieval)。

---

## Q375｜RAG（检索增强生成）的原理与工程实现方式。

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

入库阶段保留文档 ID、版本、权限和来源，解析清洗后按语义切块，建立关键词/向量索引；更新与删除必须同步索引。查询阶段先确定用户可访问范围，检索候选、重排并在 token 预算内拼装上下文，再生成带来源的回答。

```text
文档 -> 清洗/分块/元数据 -> 索引
问题 + 身份 -> 权限过滤 -> 混合召回 -> 重排
     -> 上下文预算 -> 模型生成 -> 引用/事实检查
```

调参看真实问题集，不凭感觉固定 chunk 大小或 top-k。还需处理重复资料、版本冲突、证据不足、注入文本及索引延迟；RAG 本身不要求 Agent 循环。

![](./images/interview/大前端面试宝典-image-76.png)

参考：[资料 1](https://platform.openai.com/docs/guides/retrieval) · [资料 2](https://arxiv.org/abs/2005.11401)。

---

## Q376｜前端实现 LLM 的流式输出。

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

前端通过自己的 BFF 请求模型流，供应商密钥只在服务端保存。下面约定 BFF 返回 SSE，data 为 {"delta":"文本"}，结束可发 [DONE]；真实供应商的事件类型应在 BFF 映射。不能把一次 reader.read() 当作一条完整事件或一个完整 UTF-8 字符。

```js
async function consumeSSE(stream, onEvent, { maxEventChars = 1_000_000 } = {}) {
  if (!Number.isSafeInteger(maxEventChars) || maxEventChars < 1) throw new RangeError('invalid event limit');
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let line = '', data = [], event = '', id = '', skipLF = false, size = 0;
  function processLine() {
    if (line === '') {
      if (data.length) onEvent({ data: data.join('\n'), event: event || 'message', id });
      data = []; event = ''; size = 0;
    } else if (!line.startsWith(':')) {
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.slice(0, colon);
      let value = colon < 0 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'data') data.push(value);
      else if (field === 'event') event = value;
      else if (field === 'id' && !value.includes('\0')) id = value;
    }
    line = '';
  }
  function consume(text) {
    for (const char of text) {
      if (skipLF) { skipLF = false; if (char === '\n') continue; }
      if (++size > maxEventChars) throw new RangeError('SSE event too large');
      if (char === '\r') { processLine(); skipLF = true; }
      else if (char === '\n') processLine();
      else line += char;
    }
  }
  let ended = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { consume(decoder.decode()); ended = true; break; }
      consume(decoder.decode(value, { stream: true }));
    }
    // SSE 只分发由空行结束的事件；EOF 不补发未完成事件。
  } finally {
    if (!ended) { try { await reader.cancel(); } catch { /* 保留原始失败 */ } }
    reader.releaseLock();
  }
}
```

```js
const controller = new AbortController();
async function start(prompt, onDelta) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }), signal: controller.signal,
  });
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
  await consumeSSE(response.body, ({ data }) => {
    if (data === "[DONE]") return;
    const payload = JSON.parse(data);
    if (typeof payload.delta !== "string") throw new TypeError("invalid delta");
    onDelta(payload.delta);
  });
}
// UI 调用 start(...).catch(...)；停止/卸载时 controller.abort()。
```

消费器处理跨块 UTF-8、CR/LF、连续 data 行与大小上限；回调是同步接口，不实现自动重连/retry。UI 应批量提交增量，避免每 token 重排；错误/结束状态单独展示，Markdown/HTML 渲染仍需防注入。

参考：[资料 1](https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream) · [资料 2](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams)。

---

## Q377｜Function Calling 是什么

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

Function calling/tool calling 是模型输出结构化工具名称和参数的能力，宿主应用据此决定是否执行外部能力，再把结果回传模型。不同供应商都有类似接口，不能把它等同模型直接运行任意本地函数。

参数 schema 改善结构约束，但仍需服务端验证类型、范围、权限与业务状态；工具结果也是不可信数据。工具可以是本地函数或远程服务，语言并不被某个 SDK 限死。

参考：[资料 1](https://platform.openai.com/docs/guides/function-calling)。

---

## Q378｜Function Calling 原理流程

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

先注册允许的工具及参数 schema，再提交上下文；模型返回工具请求时，运行时验证工具名、参数、权限与预算，执行并按 call ID 回填结果，继续请求模型，直到得到答案或达到明确停止条件。

```text
用户请求 -> 模型 -> tool_call(name, arguments, call_id)
                     -> 校验/授权 -> 执行 -> tool_result(call_id)
                     -> 模型继续生成
```

并行调用只用于互不依赖的工具；超时、重试、幂等键和失败反馈应由程序管理。整个过程可自动编排，不需要每次由人手动中转 JSON。

参考：[资料 1](https://platform.openai.com/docs/guides/function-calling)。

---

## Q379｜Function Calling 优缺点

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

工具调用能把实时数据、精确计算和外部动作纳入模型工作流，并通过 schema 与调用 ID 改善可观测性。代价是额外往返、成本，以及错误参数、错误选工具、重复副作用和注入风险。

它不保证语义正确或权限安全；供应商 API 格式也可能不同，需要适配层。但远程 HTTP 工具可跨语言复用，执行结果可由程序自动回传，不能说 function calling 天生不支持共享或必须人工中转。

参考：[资料 1](https://platform.openai.com/docs/guides/function-calling)。

---

## Q380｜MCP 是什么？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

MCP（Model Context Protocol）是由 Anthropic 于 2024 年推出的开放协议，用于统一 AI 应用连接工具、资源与提示模板的方式。它基于 JSON-RPC 描述生命周期、能力协商、发现与调用，使集成可被多个宿主复用。

MCP 不替代模型推理，也不是 function calling 的必然升级版。宿主常把 MCP 工具描述转换为模型工具定义；模型提出请求后再由客户端调用服务端。授权框架不等于所有工具天然安全，业务权限仍由宿主与服务端落实。

参考：[资料 1](https://www.anthropic.com/news/model-context-protocol) · [资料 2](https://modelcontextprotocol.io/specification/2025-06-18/)。

---

## Q381｜MCP 的核心结构

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

MCP 采用 host-client-server 架构：host 是 AI 应用，负责模型、用户交互与策略；client 是宿主内对接某个服务端的协议连接；server 提供 tools、resources、prompts 等能力。Bridge 不是该规范要求的第三核心角色。

初始化时协商协议版本和能力，再执行发现、读取或调用。本组固定说明 2025-06-18 版的 stdio 与 Streamable HTTP；后者可使用 SSE 承载流式消息。不要把早期 HTTP+SSE 传输名称与所有新版远程通信等同。

参考：[资料 1](https://modelcontextprotocol.io/specification/2025-06-18/architecture) · [资料 2](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)。

---

## Q382｜Function Calling 与 MCP 实现差异

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

直接 function calling 时，应用把工具 schema 发给模型，并在工具请求后调用自己的函数/HTTP 服务。接入 MCP 时，应用先通过 tools/list 获取服务端工具，转换为模型需要的定义，再把选中的请求映射成 tools/call。

```json
{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"get_price","arguments":{"symbol":"AAPL"}}}
```

示例是假定该工具已存在且完成初始化后的协议消息。模型供应商的 call ID 与 MCP JSON-RPC id 属于不同层，需要宿主正确关联；两种方案都必须执行权限、参数和结果校验。

参考：[资料 1](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) · [资料 2](https://platform.openai.com/docs/guides/function-calling)。

---

## Q383｜Function Calling 与 MCP 对比

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

两者通常协作：function calling 约定模型如何提出工具请求，MCP 约定应用如何发现和访问外部能力。

| 比较 | Function calling | MCP |
| --- | --- | --- |
| 边界 | 模型 API 与应用工具调度 | 宿主客户端与能力服务端 |
| 描述 | 供应商定义的工具 schema | 标准化发现与工具/资源接口 |
| 传输 | 随模型 API 交互，执行层自定 | 固定版本规定的 stdio/HTTP 等 |
| 安全 | 应用验证权限与参数 | 协议授权加业务权限校验 |

二者均可跨语言集成，均不自动保证调用安全。动态工具列表变化要按服务端能力通知处理，不等于无限制热加载任意代码。

参考：[资料 1](https://modelcontextprotocol.io/specification/2025-06-18/architecture) · [资料 2](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) · [资料 3](https://platform.openai.com/docs/guides/function-calling)。

---

## Q384｜Agent 是什么

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

Agent 在目标与环境反馈下使用模型选择动作、调用工具并更新状态，直到完成、失败或触及预算。固定工作流由程序决定大部分路径，Agent 给模型更多选择空间；实际系统常组合二者。

长期记忆、多智能体和显式思维链都不是必备条件。工程上需明确可调用能力、状态持久化、停止条件、错误恢复及外部动作权限；自主程度越高，越需要可追踪执行与可验证结果。

参考：[资料 1](https://www.anthropic.com/engineering/building-effective-agents)。

---

## Q385｜Agent Loop 是什么什么

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

Agent loop 是“读取状态 → 模型决定下一步 → 校验并执行工具 → 记录观察 → 再决定”的控制循环。最终答案可以结束循环，但程序还需限制轮数、token、总时长与重复动作。

```text
while 未完成 且 未超预算:
    decision = model(context)
    if decision 是最终回答: 返回回答
    校验 decision 的工具、参数与授权
    result = 在超时限制内执行工具
    context += 关联调用 ID 的结果
超预算时返回当前进度与停止原因
```

外部副作用要幂等或记录已执行状态，不能因网络重试重复下单。观察内容必须与指令边界分开，不能让工具文本擅自改变授权。

参考：[资料 1](https://www.anthropic.com/engineering/building-effective-agents)。

---

## Q386｜Agent Loop 常见问题与风险

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

循环常见风险有重复无进展调用、上下文膨胀、成本失控、错误结果连锁传播、工具超时与重复副作用。检索内容中的提示注入还可能诱导越权行动。

用总预算、步骤上限、超时/退避、重复动作检测和检查点约束执行；记录调用 ID、输入输出摘要与状态，支持恢复与审计。把秘密和写权限限制在服务端边界，工具结果按数据处理。停止规则应报告真实进度，不能为满足循环次数宣称任务完成。

参考：[资料 1](https://www.anthropic.com/engineering/building-effective-agents) · [资料 2](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)。

---

## Q387｜什么是模型微调（Fine-tuning）？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

微调在预训练模型上用任务数据更新全部或部分参数，使输出行为、格式或领域任务表现更符合目标。它不是简单给模型外挂一份数据库，也不保证精确记住所有新知识。

对频繁变化、需要来源与权限的知识，优先评估检索/工具；对稳定的行为模式可评估微调。先建立基线和独立评测集，关注过拟合、灾难性遗忘、数据许可及敏感信息泄漏，不能只看训练损失下降。

参考：[资料 1](https://huggingface.co/docs/transformers/training)。

---

## Q388｜LLM 微调中常见的两种类型是什么？各适合什么场景？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

按可训练参数范围可分全参数微调与参数高效微调 PEFT。全参数更新全部权重，灵活但显存、优化器状态和存储成本更高；LoRA、adapter、prefix 等只训练部分新增/选定参数。

这是一种分类维度，SFT/偏好优化则按训练目标分类，不能混成只有两种训练方法。全参不保证总优于 PEFT，PEFT 也不必然泛化更差；结果取决于任务、数据、预算和超参数。QLoRA 结合基础权重量化与 LoRA，不能说只是另一种模型架构。

参考：[资料 1](https://huggingface.co/docs/peft/index) · [资料 2](https://arxiv.org/abs/2305.14314)。

---

## Q389｜LoRA 是如何实现高效微调的？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

LoRA 冻结原矩阵 W，只训练低秩更新：W′ = W + (α/r)BA。若 W 为 d_out×d_in，B 为 d_out×r、A 为 r×d_in，训练参数从 d_out*d_in 降到 r*(d_out+d_in)，通常 r 远小于原维度。

显存节省还受激活、基础权重、优化器与精度影响，不能统一承诺减少 90% 或固定倍数提速。部署可在条件允许时合并权重，或保留适配器；量化、多个适配器和不同目标层会影响合并与精度。

参考：[资料 1](https://arxiv.org/abs/2106.09685) · [资料 2](https://huggingface.co/docs/peft/conceptual_guides/lora)。

---

## Q390｜微调一个 LLM 需要准备哪些数据？格式上有什么要求？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

准备覆盖真实任务分布的高质量输入/期望输出，并按训练方法组织：SFT 常用指令/对话，偏好优化常用选中与拒绝回答。格式按模型 chat template 与训练平台 schema 决定，不存在适用于所有平台的统一 JSON 字段。

```json
{"messages":[{"role":"user","content":"将 hello 翻译为中文"},{"role":"assistant","content":"你好"}]}
```

这是聊天训练样本示意。按来源去重并拆分训练/验证/测试，避免同源泄漏；清除秘密、核对许可和标签一致性。无需强制所有样本长度相同，但要处理上下文上限、截断和 loss mask。

参考：[资料 1](https://huggingface.co/docs/trl/sft_trainer)。

---

## Q391｜Dify 是什么？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

Dify 是 AI 应用开发平台，提供模型接入、提示配置、知识检索、工作流/对话流、工具与应用发布等能力。可用云服务或按许可自托管，是否满足商业使用与多租户要求要查看对应版本 LICENSE。

它降低编排成本，但不代替数据治理、业务授权、评测和运行保障。模型供应商、插件版本、密钥、向量库与网络环境都会影响结果，应记录部署版本与依赖配置，而不是认为可视化流程天然可靠。

参考：[资料 1](https://docs.dify.ai/en/cloud/use-dify/getting-started/introduction) · [资料 2](https://github.com/langgenius/dify/blob/main/LICENSE)。

---

## Q392｜Dify 的 Workflow（工作流）是什么？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

Workflow 用节点和连线定义输入、处理、分支、循环与输出；Chatflow 在此基础上提供多轮对话相关能力。LLM、代码、HTTP、知识检索与条件节点可组合，但每条执行路径都应有明确输出和失败策略。

先定义变量 schema，再连接节点并用代表性输入调试，配置错误分支、重试与预算；发布前保存版本并做回归。节点能力会随 Dify 版本变化，应按当前部署说明，不把某个截图中的按钮名当稳定 API。

参考：[资料 1](https://docs.dify.ai/en/cloud/use-dify/build/workflow-chatflow) · [资料 2](https://docs.dify.ai/en/cloud/use-dify/build/orchestrate-node)。

---

## Q393｜Dify 如何接入外部 API 或数据库？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

调用外部 API 可使用 HTTP Request 节点或工具插件，按需要设置方法、认证、参数与响应映射。接数据库通常通过受控后端 API 或明确支持的连接插件，不应把任意数据库凭据与生成 SQL 直接暴露给模型。

外部系统调用 Dify 则走应用 API/Webhook 等已配置入口，这是相反方向。密钥存为秘密配置，限制目标网络与权限，设置超时、结果大小和重试幂等；失败应进入可观测错误分支。

参考：[资料 1](https://docs.dify.ai/en/cloud/use-dify/nodes/http-request) · [资料 2](https://docs.dify.ai/en/cloud/use-dify/nodes/tools)。

---

## Q394｜Dify 的知识库（Knowledge Base）在 RAG 中起什么作用？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

知识库负责文档解析、索引与检索配置，Knowledge Retrieval 节点根据 query 返回候选片段，后续 LLM 节点必须正确连接并引用这些结果作为上下文。上传文档并不代表每次生成都会自动使用它。

按应用配置检索方式、top-k、阈值、重排和元数据过滤，检查引用来源与召回质量。知识更新、删除、租户权限及不可访问来源要同步处理；模型仍可能误读上下文，所以“有知识库就保证基于事实”不成立。

参考：[资料 1](https://docs.dify.ai/en/cloud/use-dify/nodes/knowledge-retrieval)。

---

## Q395｜在 Dify 中，如何让一个应用支持多轮上下文对话？

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

多轮应用应使用支持会话的 Chatflow/聊天类型，API 调用时延续返回的 conversation_id，并在应用层绑定真实用户，避免跨用户串会话。LLM 节点还需按需求启用记忆/窗口，业务状态可放 conversation variables。

会话存在不代表每个节点自动收到全部历史；上下文窗口与预算仍有限。不要虚构所有版本通用的 {conversation_history} 占位符，应从当前节点变量选择器/API 文档配置。Workflow 单次运行状态也不能直接当长期聊天记忆。

参考：[资料 1](https://docs.dify.ai/en/cloud/use-dify/nodes/llm) · [资料 2](https://docs.dify.ai/en/cloud/use-dify/nodes/variable-assigner) · [资料 3](https://docs.dify.ai/en/cloud/use-dify/build/workflow-chatflow)。

---

## Q396｜Dify 中 智能体 和 工作流 的关系

适用：LLM/RAG/LoRA 通用原理；MCP 固定 2025-06-18；Dify Cloud 官方文档核对 2026-10-09。

Workflow 主要由开发者预定义节点和控制流，Agent 在给定工具与约束下由模型决定调用步骤。Dify 可以在工作流中放 Agent 节点，形成固定业务流程中的一个动态子任务。

并非所有 Agent 都必须先有可视化工作流，也不是所有 Workflow 都是智能体。确定性步骤如参数校验、权限和持久化宜放受控节点；开放式检索/分析可交给 Agent，并设置工具范围、迭代预算、错误回退与输出 schema。

参考：[资料 1](https://docs.dify.ai/en/cloud/use-dify/nodes/agent) · [资料 2](https://docs.dify.ai/en/cloud/use-dify/build/workflow-chatflow)。

---

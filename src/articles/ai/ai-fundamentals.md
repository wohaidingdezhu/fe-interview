---
id: "ai-fundamentals"
title: "AI 基础：从 Token 到模型输出"
category: "AI 与 Agent"
kind: "知识文章"
description: "面向前端开发者，理解大语言模型、Token、上下文、提示词和结果验证。"
tags: ["AI", "LLM", "Token", "入门"]
aliases: ["AI 基础", "人工智能入门", "大语言模型", "LLM", "提示词", "prompt"]
related: ["ai-evaluation", "rag-basics", "ai-agent-basics"]
addedAt: "2026-11-01"
updatedAt: "2026-11-02"
reviewedAt: "2026-11-02"
order: 101
status: published
quality: complete
sources: ["https://huggingface.co/learn/llm-course/chapter1/4", "https://huggingface.co/learn/llm-course/chapter2/4"]
technologyVersion: "大语言模型通用概念；2026-11-02 核对，不绑定模型或 SDK 版本"
---

## 先明确讨论范围

AI 涵盖的任务比聊天更广。这篇聚焦生成文本的大语言模型（LLM），用它建立理解 AI 应用的起点，不把所有 AI 都等同于聊天机器人。

常见自回归语言模型根据已有上下文预测后续 Token，逐步生成文本。预训练学习参数；微调继续调整参数以适配任务；日常发送提示词通常是在推理时提供输入，并不等于现场训练模型。[原理参考](https://huggingface.co/learn/llm-course/chapter1/4)

## Token、向量和上下文分别是什么

| 概念 | 可以怎样理解 | 容易混淆的地方 |
| --- | --- | --- |
| Token | 分词器处理后的文本单元，再映射为数字 ID | 不固定等于一个汉字或一个英文单词 |
| Embedding | 将离散输入表示为数值向量 | 相似向量不代表事实一定相同 |
| 上下文 | 本次模型处理所依据的指令、问题、历史和资料 | 聊天界面显示的全部历史未必都发送给模型 |
| 模型参数 | 训练过程中学习的数值 | 与本次请求携带的资料、应用保存的历史不同 |

分词方式随模型而异，不能直接用 JavaScript 字符串的 `length` 当作 Token 数。[分词参考](https://huggingface.co/learn/llm-course/chapter2/4)

## 提示词先说明任务和判断标准

下面是本资料库的一个练习，不需要接入任何模型服务：

```text
任务：根据给定的 HTTP 缓存笔记，整理三条复习要点。
资料：在这里粘贴已核验的笔记片段，并标明来源。
要求：每条包含结论和适用条件；资料不足时明确指出。
输出：三条列表，每条最多两句话。
验证：是否混淆强缓存与协商缓存？有没有补造资料未提到的配置？
```

将同一问题改成“总结一下”，比较两份结果是否满足上述判断标准。更明确的输入通常更便于验收，但不能据此保证事实正确。

## 前端接入时要分清三种状态

1. **请求完成**：网络连接正常结束。
2. **格式有效**：输出符合界面需要的结构。
3. **业务正确**：内容与证据、权限和业务规则一致。

这是不同层次的验证。例如一份 JSON 可以语法正确，却包含不存在的文章 ID；界面应根据真实目录校验 ID，不能直接把模型生成的网址当作可信导航。

设计练习：为摘要界面分别写出“正在生成”“已取消”“格式不正确”“生成完成”的显示文案。流式输出中途取消时，不要把已收到的片段标成完整结果；服务端密钥也不应放进浏览器构建产物。

## 一个可以本地运行的输出校验练习

下面是自拟的简化摘要结构。把代码粘贴到浏览器控制台或 Node.js 中运行，不调用模型：

```javascript
const articleIds = new Set(['closure', 'http-cache']);
const hasValidSummaryShape = value => Boolean(
  value && typeof value === 'object'
  && typeof value.summary === 'string' && value.summary.trim()
  && Array.isArray(value.sources) && value.sources.length > 0
  && value.sources.every(id => typeof id === 'string' && articleIds.has(id))
);

console.log(hasValidSummaryShape({ summary: '闭包保留变量绑定。', sources: ['closure'] })); // true
console.log(hasValidSummaryShape({ summary: '内容待核验。', sources: ['invented'] })); // false
console.log(hasValidSummaryShape({ summary: '', sources: ['closure'] })); // false
```

这个检查只验证最小结构和来源 ID 是否在允许集合中。把第一条摘要改成“闭包复制所有变量值”，检查依然会通过：**格式与引用标识有效，仍不能证明摘要得到原文支持**。它也不是完整安全校验，实际服务还需要长度限制、访问控制和内容核对。

输出到网页时，应按普通文本渲染；若产品需要 Markdown，也要使用受控渲染流程，不能把模型文本直接作为 HTML 执行。

## 上下文、应用记忆和微调怎么选

| 需要改善什么 | 先尝试什么 | 如何检查是否有效 |
| --- | --- | --- |
| 本次回答缺少条件 | 补充明确指令与相关资料 | 用同一组问题比较遗漏和错误 |
| 跨次访问保留用户偏好 | 应用按权限保存偏好，需要时提供给模型 | 检查保存、删除和隔离是否生效 |
| 经常查找更新的知识 | 检索并提供当前资料 | 检查资料版本与引用支持程度 |
| 稳定的任务行为仍不达标 | 在有基准和数据的前提下评估微调 | 对未用于训练的样例评估收益与退化 |

这是工程选型的起点，不是效果保证。应用记忆不代表模型自动永久记住了对话；检索和微调也可以组合使用。

## 面试自测

- 为什么增加聊天历史不能替代微调？前者改变输入，后者改变参数。
- 为什么回答流畅仍要核验？语言生成目标与业务事实验证并不是同一件事。
- 如何让回答引用资料？继续阅读 [RAG：让回答有可核对的依据](?article=rag-basics)。
- 模型如何执行动作？继续阅读 [AI Agent：工具调用、工作流与执行边界](?article=ai-agent-basics)。

## 参考资料与边界

- [Hugging Face：Transformer 与语言模型](https://huggingface.co/learn/llm-course/chapter1/4)
- [Hugging Face：Tokenizers](https://huggingface.co/learn/llm-course/chapter2/4)

本文的界面练习为本资料库自拟。实际 Token 上限、计费、输出格式支持和数据保留规则，应查询所用服务的当前文档。

想比较提示词或流程改动是否有效，继续阅读 [AI 应用评估：从示例演示到回归验证](?article=ai-evaluation)。

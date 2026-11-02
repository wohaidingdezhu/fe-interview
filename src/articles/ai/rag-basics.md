---
id: "rag-basics"
title: "RAG：让回答有可核对的依据"
category: "AI 与 Agent"
kind: "知识文章"
description: "区分检索与生成，理解分块、Embedding、引用、权限过滤和 RAG 评估。"
tags: ["AI", "RAG", "检索", "评估"]
aliases: ["RAG", "检索增强生成", "向量检索", "Embedding", "知识库问答"]
related: ["ai-fundamentals", "ai-agent-basics"]
addedAt: "2026-11-01"
reviewedAt: "2026-11-01"
order: 102
status: published
quality: complete
sources: ["https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview", "https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators?view=foundry"]
technologyVersion: "通用 RAG 流程与评估概念；2026-11-01 核对，不绑定向量数据库"
---

## RAG 解决什么问题

检索增强生成（Retrieval-Augmented Generation）先查找与问题相关的资料，再将选中的内容提供给模型生成回答。它可以引入模型参数之外的资料，但不会自动让每个答案都正确，也不要求所有步骤都使用向量数据库。

本篇讨论流程明确的基础 RAG；由模型动态规划检索步骤的系统，还需要考虑 [Agent 的执行控制](?article=ai-agent-basics)。

## 从资料到回答的基本流程

```text
资料更新 → 清洗、分块、保存来源信息 → 建立索引
用户问题 → 权限过滤与检索 → 选择相关片段 → 生成回答与引用 → 核验
```

| 环节 | 目的 | 一个检查点 |
| --- | --- | --- |
| 分块 | 将长文整理为可检索片段 | 标题、条件和代码说明是否被拆散 |
| 关键词检索 | 匹配名称、编号或具体术语 | 搜索 Q134 时能否精确命中 |
| 向量检索 | 用 Embedding 的相似度发现相关表达 | 相似描述是否实际属于不同场景 |
| 混合检索与重排 | 合并候选并重新排序 | 是否找回了真正包含答案的片段 |
| 来源信息 | 保留原文位置与版本 | 引用能否打开且支持对应结论 |

这些是可选的工程组合，不是每个系统都要堆齐的组件。片段长度、候选数量应通过实际问题集比较；把更多资料塞进上下文不一定更好。[流程参考](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview)

## 用本资料库做一个验收练习

假设要回答“缓存没有过期，为什么页面还是发起了请求？”：

1. 检索缓存相关笔记和题目，保存命中的标题、片段与地址。
2. 检查资料是否区分普通访问、强制刷新和具体缓存指令。
3. 回答只解释有证据支持的部分；缺少请求头时，列出需要补充的信息。
4. 给每个关键结论关联具体片段，而不是只在文末随意放一个链接。

这是自拟验收方案。本项目目前的全文搜索是确定性关键词搜索，**没有接入向量检索或模型生成**，搜索到文章本身并不等于实现了 RAG。

## 把检索和生成分开评估

- **检索是否命中**：预先标注应包含答案的片段，检查是否进入候选集。
- **回答是否有依据**：关键结论能否由提供给模型的片段支持。
- **是否回答问题**：内容正确但答非所问，也需要记录为问题。
- **成本与体验**：记录延迟、失败率和需要的上下文量，比较不同配置。

先准备少量人工核验的问题，包含可回答、资料不足、版本冲突和不应访问的内容。自动评估可辅助筛选，但评估器本身也可能出错，应对样本进行人工复核。[评估维度参考](https://learn.microsoft.com/en-us/azure/foundry/concepts/evaluation-evaluators/rag-evaluators?view=foundry)

## 常见错误与边界

权限必须在可信服务端执行，并在资料进入模型上下文前落实；不能先检索所有私有文档，再要求模型“不要透露”。资料更新后还需维护索引和旧版本，引用链接存在并不代表引用内容仍然有效。

检索出的文档是待分析的数据，其中“忽略原指令”的文字不能获得系统指令权限。前端展示引用时，应使用已核验的来源标识映射链接，而不是信任回答随意生成的地址。

## 继续阅读

- 不清楚 Token 和上下文的区别：先读 [AI 基础](?article=ai-fundamentals)。
- 需要根据检索结果继续执行动作：再读 [AI Agent](?article=ai-agent-basics)。

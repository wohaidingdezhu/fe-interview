---
id: "ai-evaluation"
title: "AI 应用评估：从示例演示到回归验证"
category: "AI 与 Agent"
kind: "知识文章"
description: "建立固定问题集，区分规则检查、人工评审与模型评审，用可运行样例理解评估分数的边界。"
tags: ["AI", "评估", "回归测试", "Agent"]
aliases: ["AI 评估", "evals", "LLM-as-a-judge", "模型评审", "智能体评估"]
related: ["ai-fundamentals", "rag-basics", "ai-agent-basics"]
addedAt: "2026-11-02"
reviewedAt: "2026-11-02"
order: 104
status: published
quality: complete
sources: ["https://www.anthropic.com/research/demystifying-evals-for-ai-agents", "https://learn.microsoft.com/en-us/ai/playbook/technology-guidance/generative-ai/working-with-llms/evaluation/list-of-eval-metrics"]
technologyVersion: "AI 应用评估通用概念；2026-11-02 核对，示例不调用模型或外部服务"
---

## 先写清楚怎样才算成功

一次回答看起来不错，只能说明这个样例在这次尝试中的表现。评估应固定输入、可用资料与成功条件，记录结果，再比较改动前后的行为。Agent 还要检查真实环境中的结果：它说“已保存”与文件确实保存，是两个不同的判断。[评估结构参考](https://www.anthropic.com/research/demystifying-evals-for-ai-agents)

下面沿用资料库问答场景。所有样例、分数与门槛均为自拟练习，不是实际模型能力测评。

## 一个样例至少保存什么

| 字段 | 示例 | 用途 |
| --- | --- | --- |
| 稳定标识 | storage-transfer-01 | 对比同一个问题的多次结果 |
| 输入与资料版本 | 换手机是否自动同步收藏；资料版本 v1 | 避免一边换资料、一边把变化归因于模型 |
| 必须满足的条件 | 明确不自动同步；说明备份迁移方式 | 定义可观察的成功结果 |
| 不能发生的行为 | 编造账号功能；访问未授权内容 | 将越界行为单独检查 |
| 执行记录 | 检索片段、工具状态、实际结果 | 定位失败阶段 |
| 评审与配置版本 | 规则 v1、提示词版本、模型配置 | 说明分数对应什么系统 |

将用于调整提示词的开发样例，与独立验收样例分开。发现新的失败时补充回归，但也要持续保留没有参与调参的检查，避免只记住已有答案。

## 规则、人工与模型评审各看什么

| 方式 | 适合检查 | 局限 |
| --- | --- | --- |
| 程序规则 | 必填字段、有效 ID、工具调用次数、真实文件结果 | 不能仅凭几个词判断语义正确 |
| 人工评审 | 引用是否支持结论、任务是否完成、表达是否误导 | 需要明确标准，处理评审分歧 |
| 模型评审 | 按统一量表批量筛查语义问题 | 仍可能误判，需要与人工样本校准 |

文本相似度衡量的是特定形式的相近程度，不自动等于事实正确。[评估指标参考](https://learn.microsoft.com/en-us/ai/playbook/technology-guidance/generative-ai/working-with-llms/evaluation/list-of-eval-metrics)

使用模型评审时，给出明确量表和必要证据，保留评审依据。比较两份答案可隐藏方案名称、交换展示顺序，抽查是否存在顺序或冗长偏好；不要仅让生成答案的模型评价“自己做得好不好”。

## 可本地运行：一个很容易被钻空子的检查

这段 JavaScript 不调用模型，可在 Node.js 或浏览器控制台运行：

```javascript
const samples = [
  { id: 'correct', answer: '不会自动同步，可以导出备份再导入。' },
  { id: 'wrong', answer: '登录账号即可自动同步。' },
  { id: 'misleading', answer: '不用导出备份，登录就会自动同步。' },
];
const mentionsBackup = answer => answer.includes('导出备份');
const results = samples.map(sample => ({
  id: sample.id,
  passed: mentionsBackup(sample.answer),
}));
console.log(results.map(result => `${result.id}:${result.passed}`).join(', '));
// correct:true, wrong:false, misleading:true
```

最后一条结论是错误的，却通过了关键词检查。这说明规则写得太弱，不能将 `2 / 3` 叫作“答案准确率”。这个数字只说明三份固定文本有两份出现指定词语。

改进练习：先由人工标注“是否宣称自动同步”“是否给出资料支持的迁移方法”，再检查评审器能否找出最后一条的错误。不要把匹配词换成更多词后，就宣布解决了语义判断。

## 对比两个版本时怎样读结果

保留同一组输入、相同资料和明确的运行配置，记录每个样例的通过情况、失败原因、延迟与成本。生成结果可能变化，需要按预算进行多次尝试，报告尝试次数；不能只挑最好的一次展示。

将不同维度分开呈现。例如回答更完整，但出现未授权工具调用，不能靠平均分把越界问题抵消。对不应回答的问题，也应单独记录资料不足或拒绝处理是否恰当，避免通过全部拒绝来获得表面上的安全。

## 一个小项目可以怎样开始

1. 选少量真实问题，覆盖正常回答、资料不足、冲突、权限、超时和取消。
2. 为每个问题写出需要的证据、预期行为与不可接受的行为。
3. 先人工检查一轮，再自动化可明确判断的部分。
4. 每次改动运行原样例，人工抽查改善与退化，逐渐补充新失败。

这里不提供通用“达到某个分数就能上线”的门槛。门槛要与任务后果、样本覆盖和人工验收共同确定，离线评估也需要结合实际使用反馈。

## 继续阅读

- [AI 基础](?article=ai-fundamentals)：区分结构有效与业务正确。
- [RAG](?article=rag-basics)：把检索命中与回答有据分开检查。
- [AI Agent](?article=ai-agent-basics)：检查工具结果和最终状态，而非只看模型声明。

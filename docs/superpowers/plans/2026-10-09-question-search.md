# 题目搜索与稳定定位 Implementation Plan

> 本任务按用户要求在当前会话内联执行，保留共享工作区改动；不创建提交或部署。

**Goal:** 搜索 Q 编号或关键词时显示具体题目，并用稳定锚点打开答案。

**Architecture:** 搜索索引按题拆分，所有记录保留所属文章 id；普通文章继续单条索引。搜索工具返回匹配记录，列表按文章聚合，顶部搜索按题展示。题目 DOM 增加 q<number> 别名锚点，原有标题锚点继续有效；导航时显式处理同篇题目切换和历史恢复。

**Tech Stack:** React、TypeScript、Markdown AST、node:test、现有 Vite 资产生成流程。

## 任务 1：索引和检索

- [x] 修改 scripts/content-assets.mjs：用 inspectQuestions 拆分正文，题目记录带 questionNumber/questionTitle/anchor；不重复储存整篇题库正文。
- [x] 修改 src/search-utils.ts：SearchDocument 增加可选题目信息，searchHits 支持完整 Q 编号过滤与多词匹配；searchDocuments 聚合第一个命中保持现有列表接口。
- [x] 测试 `Q1` 不匹配 `Q10`、不同题中的关键词不能合并命中、普通文章搜索保持有效、草稿题不进入生产索引。

## 任务 2：定位与展示

- [x] 修改 src/content.ts：loadSearchIndex 校验可选字段，searchArticles 返回题目结果与带锚点 href。
- [x] 修改 src/ArticleContent.tsx：给 Q 标题增加稳定 q<number> 别名，保留 rehype-slug 原锚点；正文加载后与定位参数改变时滚动。
- [x] 修改 src/main.tsx：导航状态含 hash，处理 popstate/hashchange，具体题目搜索链接与键盘修饰点击按原有约定工作。
- [x] 修改 src/LibraryList.tsx：正文命中显示可直接进入首个匹配题的链接。

## 任务 3：验收

- [x] `perl -e 'alarm shift; exec @ARGV' 120 node --test tests/search.test.mjs tests/publication.test.mjs`。
- [x] `npm test`、`npm run typecheck`、`npm run build`。
- [x] 对最终索引测量真实 403 题查询耗时与压缩体积，确认正文/图片完整且普通草稿仍被排除。
- [x] 浏览器自动化工具若不可用，报告该限制；以可执行测试、服务端渲染和 HTTP 产物检查提供已完成证据，不声明完成浏览器交互验证。

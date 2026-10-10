# 知识库发现与阅读改进计划

**目标：**首页明确呈现题库、专题、独立笔记和资料；所有题目可浏览筛选；手机可定位长文；本地学习记录可备份；公开文章有静态 HTML 与分享信息。

**结构：**沿用 React/Vite/Git 内容。轻量题目目录单独生成 JSON，全文索引只在搜索时获取；首页统计从目录元数据派生。本地学习记录按 q:number / a:id 保存，版本化校验备份。公开文章由同一 Markdown 组件生成静态 HTML，浏览器仍使用原应用交互。

- [x] 新增 library-utils.ts、learning-utils.ts / useLearning.ts：统计、筛选、路由、记录校验与合并。
- [x] 新增 HomePage.tsx、QuestionList.tsx、LearningPage.tsx、LearningControls.tsx：入口、全量题列表和学习界面。
- [x] TableOfContents 支持手机 dialog、当前题号、上一题/下一题；main 路由与当前阅读记录配合。
- [x] content-assets 增加轻量题目目录，生产继续只包含通过发布过滤的题目。
- [x] scripts/prerender.mjs 生成公开文章静态页、canonical、OG、JSON-LD、sitemap；旧查询链接兼容，子路径资源正确。
- [x] 正常/空结果/题号精确匹配/备份非法输入/合并/静态草稿隔离测试，保留现有测试。
- [ ] 桌面与手机浏览器检查（独立浏览器待用户确认工具限制覆盖）；测首次搜索和长文，修复实际发现。
- [x] 运行测试、类型检查、构建，记录证据与未覆盖边界，不自动提交或部署。

测试流程：Step1 准备；Step2 复用已读 JS 和 node:test 约定；Step3 新 utility/导出备份/预渲染/题目目录；Step4 新功能无预设缺陷，风险为非法备份、草稿泄漏、子路径/锚点误跳；Step5 按行为验证；Step6 无覆盖率门槛；Step7 报告与 utree flush。

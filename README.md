# 前端资料库 · fe-interview

React + TypeScript + Vite 构建的静态资料库，共有两个入口：

- **资料收藏**：外部文章、官方文档、视频、工具和开源项目，保存链接和简介。
- **我的笔记**：Markdown 文章与题解，保留全文搜索、正文目录、代码高亮和复制。

两种列表支持关键词、分类、类型和多个标签组合筛选，标签取交集；支持排序与分页。分类自动汇总，无需修改页面代码。列表筛选条件保存在 URL 中，可直接分享和刷新。

## 本地运行

使用 Node.js 24+，项目提供 `.nvmrc`。

```bash
nvm use
npm ci
npm run dev
```

```bash
npm test
npm run typecheck
npm run validate:content
npm run build
npm run preview
```

构建前自动检查：必填字段、合法日期、HTTP(S) URL 格式、跨资料/笔记的重复 ID、规范化后的重复资料 URL、笔记内部文章链接、重复题号和图片文件。公开文章中的空答案、不完整质量或指向草稿的链接会阻断构建。

## 录入一条外部资料

在 `src/data/resources.json` 数组中添加：

```json
{
  "id": "react-effects",
  "title": "useEffect 参考文档",
  "url": "https://zh-hans.react.dev/reference/react/useEffect",
  "description": "理解副作用、依赖数组和清理函数。",
  "source": "React 官方",
  "type": "官方文档",
  "category": "React",
  "tags": ["React", "副作用", "面试"],
  "addedAt": "2026-10-08",
  "status": "draft"
}
```

`type` 支持：文章、官方文档、视频、工具、开源项目。分类与标签自由扩展。ID 使用小写字母、数字和连字符，必须全站唯一。`addedAt` 使用引号内的 YYYY-MM-DD。

`status` 为 `draft` 或 `published`，省略时默认草稿。整理完成后改为 `published`，下一次部署才会展示。

## 批量导入

支持 JSON 数组，以及 TXT/TSV 链接清单。文本每行是一个 URL，也可以用真正的 Tab 分隔 URL、标题、简介；空行和以 `#` 开头的注释会跳过。参考 `examples/import-links.txt`。

先预览：

```bash
npm run import:resources -- examples/import-links.txt --category React --tags React,副作用 --type 官方文档 --source React官方 --dry-run
```

确认后执行相同命令并去掉 `--dry-run`。导入会直接更新 `src/data/resources.json`，无需修改组件或另外的索引文件。

- JSON 条目中的显式字段优先于命令行批次默认值。
- 缺失 ID 时按规范化 URL 生成稳定 ID。
- 仅有 URL 时，自动使用域名/路径作为标题，来源使用域名，分类为“未分类”，简介为占位说明；应在导入后补全。
- 重复 URL 跳过并输出数量，包括已有条目和本次重复链接。重复导入不会增加副本，也不会覆盖已有资料。
- 去重忽略文内锚点、路径末尾斜杠、`utm_*`、`fbclid`、`gclid`，保留业务查询参数以及 `#/`、`#!/` 开头的应用路由。
- 全部新增条目与现有资料校验通过后才原子写入；失败不写入。请一次运行一个导入任务。
- 不自动抓取网页，也不检查远端页面是否在线。
- 新导入条目默认 `draft`。已审核的批次可用 `--status published`，JSON 条目自己的状态优先。

## 新增自己的笔记

直接在 `src/articles/` 新建 `.md` 文件，在顶部填写 YAML 元数据，不再修改 `content.ts`：

```markdown
---
id: prototype
title: 理解原型链
category: JavaScript
kind: 知识文章
description: 从对象属性查找开始，理解原型链。
tags: [JavaScript, 原型, 面试]
addedAt: "2026-10-08"
order: 20
status: draft
quality: incomplete
sources: ["https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide"]
technologyVersion: "现代 JavaScript（ES2022+）"
---

## 核心概念

在这里写正文……
```

`kind` 支持“知识文章”“手写题解”“阅读指南”。`order` 可省略，默认 100，用于上一篇/下一篇顺序。元数据中的 ID 决定访问地址，文件名不必与 ID 相同。

正文支持 Markdown 表格、代码块和普通链接，不执行嵌入 HTML 或 JSX。站内链接写成 `[理解闭包](?article=closure)`；已有博客文章可以作为普通外部链接引用。图片放在 `public/images/`，使用 `![说明](./images/example.png)`。

## 大型知识库的目录与新增流程

一般知识采用“一篇主题一个 Markdown 文件”，可以按领域使用任意层级的分类子目录；构建会递归发现 `.md` 文件，目录只用于维护，页面分类仍由 frontmatter 的 `category` 决定：

```text
src/articles/
  browser/
    chrome-devtools-workflow.md
  react/
    hooks/
      use-persist-fn.md
  interview-react.md
```

`Qxxx` 是从原面试宝典保留下来的稳定题号，只用于面试题库。新增普通教程、操作流程、项目复盘或原理文章时使用语义 ID，不分配 Q 编号。面试题暂时仍集中在专题文件并由逐题清单控制发布，后续可迁移成一题一文件。

使用脚手架创建安全草稿：

```bash
npm run new:article -- browser/chrome-devtools-workflow \
  --title "Chrome DevTools 调试操作流程" \
  --category 浏览器 \
  --description "从复现问题到定位、验证和记录的完整调试流程。" \
  --tags "Chrome DevTools,调试,性能" \
  --aliases "Google 浏览器调试,F12 调试" \
  --related "http-cache,interview-browser" \
  --updated-at "YYYY-MM-DD" \
  --reviewed-at "YYYY-MM-DD"
```

命令会自动创建子目录，生成合法 YAML、`draft / incomplete` 状态和维护提纲，并拒绝目录穿越、非法 ID 及覆盖已有文件。维护流程是：创建草稿 → 完成正文 → 补来源和适用版本 → 改为 `quality: complete` → 审核 → 改为 `status: published` → 运行测试和构建。

`aliases` 用于补充标题中没有出现的常用搜索词；`related` 使用稳定文章 ID 建立继续阅读关系。`updatedAt` 表示正文最近实质修改时间，`reviewedAt` 表示最近完成技术复核的时间。若更新晚于审核，质量报告会提示重新复核；线上只展示当前生产目录中存在的相关文章，不会生成草稿死链。

普通文章发布时也检查实质正文、`sources` 和 `technologyVersion`；脚手架的维护提示和占位提纲必须替换为实际内容，仅修改状态不能通过构建。草稿中的这些问题作为告警，方便逐步整理。

本地“我的笔记”列表提供维护状态筛选：`待补充` 表示 `draft / incomplete`，`待审核` 表示 `draft / complete`，`已公开` 包含整篇公开文章和已有题目上线的专题。专题卡片显示公开题数与总题数；部分公开的专题仍可出现在草稿维护队列中。筛选条件保存在 URL 中，可以把待审核队列保存为书签。

`scripts/import-interview-content.mjs` 只用于最初从大文档生成面试专题。专题进入人工维护后不要再次覆盖导入；新知识应直接使用独立文章或脚手架。

## 内容与发布边界

示例资料用于展示录入格式，示例笔记为本项目编写的起步内容。正式发布前继续核对题解与引用来源。

文章同时使用 `status: draft | published` 和 `quality: incomplete | complete`。只有 `published` 且 `complete` 的文章可以发布；资料只检查发布状态。省略状态或质量时，默认草稿、不完整。不要为了消除告警直接把未审核内容标为完整。

`npm run dev` 显示所有内容，并标注草稿；`npm run build` / `npm run preview` 只包含公开内容。过滤在构建源模块之前完成，草稿不会进入页面、搜索数据或 JS 包。`public/images/` 下仅发布被公开文章引用的图片，草稿专用图片不会复制到 `dist/`。其他 `public/` 文件仍被视为明确公开的静态资产。

**草稿不是私人数据。** 此仓库公开，`src/` 内的草稿与历史提交依然可以在 GitHub 阅读。私人备注仅存放在本地 `.private/resources.json` 或独立私有仓库；`.private/` 已被 Git 忽略，构建和客户端都不读取它。公开模型禁止 `privateNotes` 字段。`.private/` 不随普通 Git 同步，不提供跨设备同步或管理后台。

本次导入的 17 个专题（403 题）在源文件层面保持 `draft / incomplete`，原有 7 篇笔记与 8 条资料整篇公开。面试专题改用 `src/data/question-publication.json` 逐题审核：省略的题默认草稿；某题只有同时满足 `published + complete + 逐题来源 + 技术版本 + 审核日期`，并通过内容门禁，才会进入生产正文、搜索索引和图片集合。一个专题只要有一道题通过审核，就会在线上出现，但只包含已公开题目。

```json
{
  "Q134": {
    "status": "published",
    "quality": "complete",
    "sources": ["https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf"],
    "technologyVersion": "现代 JavaScript（ES2015+）",
    "reviewedAt": "2026-10-09"
  }
}
```

内容校验生成 `.reports/content-quality.md` 和 JSON 报告（不提交），除空答案和短答案外，还识别实现题缺少代码、只有概念定义、遗留占位内容等语义完整度问题。逐题公开内容遇到任一问题会阻断构建；草稿只产生报告。字符数和规则只能帮助筛查，不代替技术准确性审核。

本次补充了 90 处题解，包括 58 道空答案、31 道短答案和洗牌问题的错误说明，并给手写算法增加测试。Q134、Q137、Q138 已补充可运行实现、边界说明和行为测试，并作为首批逐题发布示例；其余题目继续保持草稿。`examples/interview-algorithms.mjs` 是接受测试的算法版本，测试同时检查题解代码与其一致。

逐题过滤保留已公开题目需要的 Markdown 图片和链接定义，排除未使用的草稿引用；代码示例中的链接、图片写法不参与检查。公开进度使用原专题总题数，例如代码编程专题显示 `3 / 36 题已公开`。`usePersistFn` 已整理到 `src/articles/react/hooks/use-persist-fn.md`，作为独立知识文章待审核，不再追加 Q 编号。

首屏仅加载文章元数据；进入文章时请求对应的 `content/*.json`，第一次搜索时才请求独立的 `search/index-*.json`。索引保留规范化后的全文以维持正文搜索，结果展示关键词片段，体积仍随公开内容增长。正文、索引均先过滤草稿再生成，文件名包含内容摘要，加载失败可重试。Markdown 阅读界面、代码运行工具也分开按需加载；目录支持内部滚动、折叠与当前章节高亮。

当前公开内容构建的主 JS 约 275 KB（gzip 约 88 KB），阅读组件另约 333 KB，搜索索引约 12 KB；实际体积会随依赖和内容变化。

## 链接检查与网页信息抓取

```bash
npm run check:links
```

只检查公开资料、公开文章的引用来源与正文外链，最多 4 个并发、每个地址超时 8 秒、最多 5 次重定向。先 HEAD，不支持时使用带 Range 的 GET 并取消正文下载。报告保存在 `.reports/links.md` 和 JSON 中，区分 404/410、登录或机器人限制、限流与临时错误；不会修改地址，也不会因单个外站失败阻断发布。`.github/workflows/links.yml` 每周一北京时间 10:00 运行，也可手动运行；报告在 Actions 摘要中。

可选地读取网页的静态标题和简介，然后检查生成的草稿再导入：

```bash
npm run --silent fetch:resource -- https://react.dev/learn > /tmp/resource.json
npm run import:resources -- /tmp/resource.json --dry-run
```

确认标题、简介、类型、分类、来源和标签后，去掉 `--dry-run` 导入。抓取最多读取 256 KB、超时 10 秒，不执行网页脚本，也不自动发布；登录页、没有静态标题或非 HTML 内容需要手工录入。保留原链接，不以页面重定向结果擅自覆盖它。

## GitHub Pages

`npm run build` 生成 `dist/`。使用相对资源路径与查询参数路由，兼容 `/fe-interview/` 子路径，刷新文章无需 SPA 路由回退。

发布地址：`https://wohaidingdezhu.github.io/fe-interview/`，由独立 `fe-interview` 仓库管理，和原博客主页共存。

源码仓库：`https://github.com/wohaidingdezhu/fe-interview`，当前为公开仓库。文档转换草稿 `draft_*_folder/` 仅保留在本地，不进入源码仓库。

自动部署配置在 `.github/workflows/pages.yml`。推送到 `main` 或手动运行工作流时，安装 Node 24 和依赖，执行测试、类型检查和生产构建（包含内容校验），成功后上传 `dist/` 并部署 Pages。PR 只校验和构建，不部署。质量报告会出现在 Actions 运行摘要中；检查失败时保留上一次网站版本。

Pages 的发布源使用 **GitHub Actions**。日常更新流程是：整理内容 → 本地运行 `npm test` 与 `npm run build` → 提交并推送 `main` → 在仓库 Actions 查看部署结果。无需向原博客发布仓库强制推送，也无需购买额外域名。

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

## 内容与发布边界

示例资料用于展示录入格式，示例笔记为本项目编写的起步内容。正式发布前继续核对题解与引用来源。

文章同时使用 `status: draft | published` 和 `quality: incomplete | complete`。只有 `published` 且 `complete` 的文章可以发布；资料只检查发布状态。省略状态或质量时，默认草稿、不完整。不要为了消除告警直接把未审核内容标为完整。

`npm run dev` 显示所有内容，并标注草稿；`npm run build` / `npm run preview` 只包含公开内容。过滤在构建源模块之前完成，草稿不会进入页面、搜索数据或 JS 包。`public/images/` 下仅发布被公开文章引用的图片，草稿专用图片不会复制到 `dist/`。其他 `public/` 文件仍被视为明确公开的静态资产。

**草稿不是私人数据。** 此仓库公开，`src/` 内的草稿与历史提交依然可以在 GitHub 阅读。私人备注仅存放在本地 `.private/resources.json` 或独立私有仓库；`.private/` 已被 Git 忽略，构建和客户端都不读取它。公开模型禁止 `privateNotes` 字段。`.private/` 不随普通 Git 同步，不提供跨设备同步或管理后台。

本次导入的 17 个专题（403 题）均保持 `draft / incomplete`，逐题审核和补充后再发布。原有 7 篇笔记与 8 条资料标为公开。内容校验生成 `.reports/content-quality.md` 和 JSON 报告（不提交），列出空答案、少于 30 个有效字符的短答案，以及缺少来源和技术版本的专题；短答案和草稿空答案是告警，公开空答案是错误。图片和占位“答案：”不计作答案。字符数只能帮助筛查，不代替技术准确性审核。

公开正文和索引目前仍在启动时加载；按需加载与大规模搜索优化留待下一批。构建仍可能提示主 JS 包较大，不影响生成静态文件。

## GitHub Pages

`npm run build` 生成 `dist/`。使用相对资源路径与查询参数路由，兼容 `/fe-interview/` 子路径，刷新文章无需 SPA 路由回退。

发布地址：`https://wohaidingdezhu.github.io/fe-interview/`，由独立 `fe-interview` 仓库管理，和原博客主页共存。

源码仓库：`https://github.com/wohaidingdezhu/fe-interview`，当前为公开仓库。文档转换草稿 `draft_*_folder/` 仅保留在本地，不进入源码仓库。

自动部署配置在 `.github/workflows/pages.yml`。推送到 `main` 或手动运行工作流时，安装 Node 24 和依赖，执行测试、类型检查和生产构建（包含内容校验），成功后上传 `dist/` 并部署 Pages。PR 只校验和构建，不部署。质量报告会出现在 Actions 运行摘要中；检查失败时保留上一次网站版本。

Pages 的发布源使用 **GitHub Actions**。日常更新流程是：整理内容 → 本地运行 `npm test` 与 `npm run build` → 提交并推送 `main` → 在仓库 Actions 查看部署结果。无需向原博客发布仓库强制推送，也无需购买额外域名。

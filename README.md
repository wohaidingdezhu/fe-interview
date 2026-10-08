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

构建前自动检查：必填字段、合法日期、HTTP(S) URL 格式、跨资料/笔记的重复 ID、规范化后的重复资料 URL、笔记内部文章链接。

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
  "addedAt": "2026-10-08"
}
```

`type` 支持：文章、官方文档、视频、工具、开源项目。分类与标签自由扩展。ID 使用小写字母、数字和连字符，必须全站唯一。`addedAt` 使用引号内的 YYYY-MM-DD。

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
---

## 核心概念

在这里写正文……
```

`kind` 支持“知识文章”“手写题解”“阅读指南”。`order` 可省略，默认 100，用于上一篇/下一篇顺序。元数据中的 ID 决定访问地址，文件名不必与 ID 相同。

正文支持 Markdown 表格、代码块和普通链接，不执行嵌入 HTML 或 JSX。站内链接写成 `[理解闭包](?article=closure)`；已有博客文章可以作为普通外部链接引用。图片放在 `public/images/`，使用 `![说明](./images/example.png)`。

## 内容与发布边界

示例资料用于展示录入格式，示例笔记为本项目编写的起步内容。正式发布前继续核对题解与引用来源。

目前所有资料与笔记都会进入公开构建，尚未实现待整理、私有内容与私人备注隔离。不要在这些文件中放私人备注或敏感内容。跨设备维护可通过 Git 提交与同步完成；访客页面只负责公开检索和阅读，没有写入后台。

正文和索引目前仍在启动时加载；按需加载与大规模搜索优化留待下一批。构建可能提示主 JS 包较大，不影响生成静态文件。

## GitHub Pages

`npm run build` 生成 `dist/`。使用相对资源路径与查询参数路由，兼容 `/fe-interview/` 子路径，刷新文章无需 SPA 路由回退。

计划地址：`https://wohaidingdezhu.github.io/fe-interview/`，由独立 `fe-interview` 仓库管理，和原博客主页共存。

源码仓库：`https://github.com/wohaidingdezhu/fe-interview`，当前为私有仓库。文档转换草稿 `draft_*_folder/` 仅保留在本地，不进入源码仓库。

尚未发布网站。发布时再确认仓库可见性与 Pages 可用性，配置 GitHub Actions 自动构建并上传 `dist/`，无需向原博客发布仓库强制推送。

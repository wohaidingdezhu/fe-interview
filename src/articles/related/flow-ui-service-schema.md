---
id: flow-ui-service-schema
title: "FlowUIService：通过 Schema 从服务层调用弹窗"
section: resources
category: "工程实践"
kind: "知识文章"
description: "按服务定义、Schema 注册、业务调用和最终效果，整理将流程编排与 UI 渲染分离的设计。"
tags: ["Service", "IoC", "Schema", "弹窗", "可测试性"]
aliases: ["FlowUIService", "FlowUIRegistry", "createDialog", "生成子流程"]
related: [inversify-ui-service]
addedAt: "2026-10-22"
reviewedAt: "2026-10-22"
order: 103
status: published
quality: complete
sourceNote: "个人收藏 · 用户提供的 FlowUIService 说明与截图"
sources: ["https://inversify.io/docs/introduction/getting-started/"]
technologyVersion: "TypeScript / React / IoC；FlowUIService 与 Schema 为截图所属项目的自定义 API"
---

## 想解决的问题

> 写了个 FlowUIService，完全剥离了 UI 渲染，直接在 IoC 里调用对话框。

这份设计把业务服务发起对话框的动作，与 React 组件怎样渲染对话框分开。业务层提交对话框标识、初始值和提交回调；注册层负责找到对应 Schema，再交由 UI 层渲染。

这里的“剥离”指业务服务不直接依赖弹窗组件。UI 层仍然负责真正渲染，截图中的 `FlowUIService`、`FlowUIRegistry` 和 `FlowUIDialogSchema` 都是原项目自定义契约，并不是 Inversify 内置功能。

## 一、命令服务承接业务动作

`FlowCommandService` 将复制节点、删除节点等动作组织成服务方法。依赖、状态和 UI 交互通过服务边界协作，业务入口不必散落在多个组件事件中。

![FlowCommandService 将复制、删除节点等业务动作封装为方法](images/related/flow-command-service.png)

*原截图中的方法仍是片段，仅用于说明服务组织方式，不代表这些功能已在本站实现。*

## 二、FlowUIService 转发创建请求

服务注入 `FlowUIRegistry`，由 `createDialog(opts)` 将请求交给注册层。原截图约定：提交回调可以异步执行，用来发起请求并驱动加载状态。

![FlowUIService 注入 FlowUIRegistry 并提供 createDialog 方法的服务定义](images/related/flow-ui-service.png)

原项目注释还约定：提交返回值透传给 Promise 并关闭对话框；返回 `undefined` 则保留弹窗，以便拦截无效提交。这是该项目的协议，接入其他弹窗库时需要单独实现。

## 三、用 Schema 注册对话框

Schema 描述标题、表单结构与布局。示例通过 `SubFlowCreateDialogProvider.id` 将“生成子流程”标识与 `getSchema` 关联起来。

![生成子流程的 Schema 定义，包含标题、表单结构、提示布局和 Provider 注册](images/related/flow-dialog-schema.png)

截图里的 `renderLayout` 将提示信息与表单组合；表单配置负责名称、API 名称等字段。这样业务调用方不需要重复拼装同一份 UI。

## 四、在业务服务中调用

`createSubFlow` 先检查是否存在选中节点，再调用 `flowUIService.createDialog`，传入 Provider 标识、初始值和 `onSubmit`。

![createSubFlow 通过 FlowUIService 调用生成子流程对话框的代码](images/related/flow-dialog-calling.png)

提交回调承担业务动作，弹窗渲染留在 UI 层。测试业务编排时，可以注入可控的 UI 服务替身，不必打开真实对话框。

## 五、最终效果

![生成子流程弹窗，含说明、子流程名称、API 名称，以及取消和提交按钮](images/related/flow-dialog-result.png)

上面的服务调用最终呈现为一个带说明和表单的弹窗。这里保留的是用户提供的效果截图，并非本站可操作的表单。

## 复用时要补齐的边界

- 定义取消、提交成功和提交失败各自的返回结果，避免 Promise 一直悬而未决。
- 提交进行中防止重复提交；失败后保留输入并允许重试。
- 关闭弹窗时恢复触发位置的焦点，支持 Escape、键盘操作和窄屏滚动。
- 用独立容器或显式依赖替换测试实现，分别验证成功、取消、异常分支。

图片按“服务 → 注册 → 调用 → 效果”顺序保留，可点击放大查看原始代码细节。IoC 的基本机制可参考 [Inversify 官方入门](https://inversify.io/docs/introduction/getting-started/)。

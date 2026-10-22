---
id: inversify-ui-service
title: "用 Inversify 替换 UI 服务，让业务逻辑更容易测试"
section: resources
category: "工程实践"
kind: "知识文章"
description: "从 UIService 的真实弹窗与测试实现出发，整理依赖注入、服务边界和可测试性的实践。"
tags: ["Inversify", "IoC", "依赖注入", "单元测试", "Service"]
aliases: ["UIServiceKunlunImpl", "UIServiceVitestImpl", "service 替代 utils"]
related: [flow-ui-service-schema]
addedAt: "2026-10-22"
reviewedAt: "2026-10-22"
order: 102
status: published
quality: complete
sourceNote: "个人收藏 · 用户提供的实践说明与原始截图"
sources: ["https://inversify.io/docs/introduction/getting-started/"]
technologyVersion: "TypeScript / Inversify；截图为原项目片段，容器及装饰器配置以安装版本为准"
---

## 为什么收藏这个实践

> 强烈安利 Inversify。对基于 Inversify 写的模块，测试用例写起来特别方便。

写测试时，经常需要替换业务方法依赖的外部行为。例如，“删除前确认”在实际产品里需要用户点击弹窗，在测试中却希望直接控制确认或取消，从而验证后续业务分支。

可以让业务逻辑依赖一个 UI 服务契约，再在不同环境绑定不同实现。

## 同一个 UIService，两种实现

| 实现 | 行为 | 使用场景 |
| --- | --- | --- |
| `UIServiceKunlunImpl` | 打开 Kunlun Design 弹窗，根据用户选择返回 `true` 或 `false` | 实际产品 |
| `UIServiceVitestImpl` | 返回测试场景指定的布尔结果 | 测试确认与取消分支 |

下面是从原截图整理的接口示意，不是完整的 Kunlun Design 接入代码：

```typescript
type ConfirmOptions = { title: string };

abstract class UIService {
  abstract confirmByDialog(options: ConfirmOptions): Promise<boolean>;
}

class UIServiceVitestImpl extends UIService {
  constructor(private readonly confirmed = true) { super(); }

  async confirmByDialog(_options: ConfirmOptions): Promise<boolean> {
    return this.confirmed;
  }
}
```

测试确认分支时提供 `true`，取消分支提供 `false`。业务方法只依赖 `UIService`，无需直接模拟弹窗 DOM 或等待用户交互。

## 注入与绑定各自负责什么

原始分享提到给类加上 `@injectable()`。更准确地说，它用于配合容器管理类；**替换依赖还需要定义服务契约、绑定实现并让调用方通过注入获取依赖**。只加装饰器不会自动替换任意方法。

实际环境与测试环境应分别创建容器，各自绑定一种实现。不要把截图中演示的两个绑定同时照搬进同一个容器，造成同一服务标识对应多个实现。

装饰器、元数据以及 `ContainerModule` 等 API 的写法受 Inversify 版本影响，接入时对照 [官方入门文档](https://inversify.io/docs/introduction/getting-started/) 与项目锁定版本。

![UIService 契约、容器绑定、真实与测试实现，以及调用方注入的原始代码截图](images/related/inversify-ui-testing.png)

*原始截图：左侧定义契约与容器绑定，中间区分生产和测试实现，右侧业务服务注入 UIService。点击图片可放大。截图来自用户提供的资料，项目内部类型与依赖不属于本站。*

## 什么时候用 Service，什么时候保留 utils

这份实践里的 Service 有三个主要用途：

1. 支持通过 IoC 容器注入依赖，让外部行为可替换。
2. 可以使用私有变量保留状态；需要同时考虑实例作用域和销毁时机，避免跨测试共享状态。
3. 更容易为依赖提供测试替身，验证成功、取消和异常分支。

适合封装为服务的例子包括弹窗确认、接口访问、剪贴板、带状态的编辑器命令。没有状态和外部依赖的字符串处理、排序、数据转换，继续使用纯函数 `utils` 通常更直接；可测试性也并不要求所有函数都改成类。

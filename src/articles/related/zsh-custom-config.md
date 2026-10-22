---
id: zsh-custom-config
title: "Oh My Zsh 配置收藏与自动建议"
section: resources
category: "终端工具"
kind: "阅读指南"
description: "收藏 xfanwu 的 Oh My Zsh 自定义配置，区分主题配置与 zsh-autosuggestions 插件。"
tags: ["Zsh", "Oh My Zsh", "终端", "工具"]
aliases: ["zsh-autosuggestions", "xxf", "命令建议"]
addedAt: "2026-10-22"
reviewedAt: "2026-10-22"
order: 101
status: published
quality: complete
sourceNote: "个人收藏 · 项目 README 与插件官方说明"
sources: ["https://github.com/xfanwu/oh-my-zsh-custom-xxf", "https://github.com/zsh-users/zsh-autosuggestions"]
technologyVersion: "Zsh / Oh My Zsh；安装步骤以各项目当前 README 为准"
---

## 收藏入口

- [oh-my-zsh-custom-xxf：自定义主题与配置](https://github.com/xfanwu/oh-my-zsh-custom-xxf)
- [zsh-autosuggestions：命令自动建议插件](https://github.com/zsh-users/zsh-autosuggestions)

收录用途：整理自己的终端配置约定，并为配置 zsh-autosuggestions 保留参考入口。

## 两份资料分别解决什么问题

`oh-my-zsh-custom-xxf` 收集了作者的 Oh My Zsh 配置、自定义文件和主题。仓库 README 介绍了将主题放入自定义主题目录、通过 `ZSH_THEME="xxf"` 启用的方式。

`zsh-autosuggestions` 是独立插件，会根据历史记录与补全策略，在输入命令时显示建议。主题外观与命令建议是两件事，需要分别配置。

## 配置时的约定

1. 修改前备份已有 `.zshrc`，只合并需要的配置，不直接覆盖整份文件。
2. 对照插件的安装说明，确认实际安装目录、加载方式及插件顺序。
3. 打开新终端验证：主题是否生效、历史命令建议是否出现、常用快捷键是否正常。
4. 给自己的别名和快捷键留下注释，记录用途，方便之后迁移设备。

这是一份资料入口与配置检查清单，不会自动修改本机终端。

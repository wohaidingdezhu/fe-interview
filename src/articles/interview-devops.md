---
id: "interview-devops"
title: "DevOps 面试题"
category: "DevOps"
description: "收录 Q330–Q345 的参考答案、原理说明与配图。"
kind: "知识文章"
tags: ["Git","Docker","DevOps"]
addedAt: "2026-10-08"
updatedAt: "2026-10-09"
order: 112
status: draft
quality: complete
sources: ["https://git-scm.com/docs/gitignore","https://docs.github.com/en/actions"]
technologyVersion: "Git 通用命令；CI 工具需以实际安装版本为准"
---

> 本专题已完成本轮技术内容修订。题号用于稳定定位；适用版本和来源见各题。教学示例按文中约定使用，原始配图保留作辅助参考。

补充参考资料：[参考 1](https://git-scm.com/docs/gitignore) · [参考 2](https://docs.github.com/en/actions)。


## Q330｜设计文档规范

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

设计文档应让实现者与评审者明确问题、边界和验收：写出背景/目标、非目标、关键用例、数据与接口契约、方案及备选取舍、异常路径、影响范围、验证方法和发布/回滚安排。

与其堆框架名，不如解释请求如何流转、状态由谁拥有、失败后如何恢复。记录负责人、日期和关键决策，图示应对应真实模块；小改动可缩短篇幅，但需要保留可验证的成功标准。

参考：[资料 1](https://c4model.com/) · [资料 2](https://adr.github.io/)。

---

## Q331｜ESLint 的作用

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

ESLint 通过解析 AST 与规则发现潜在错误、约定违例和框架使用问题，不能替代类型检查、行为测试或安全审查。格式化可交给 Prettier，避免重复风格规则冲突。

ESLint 9 起 flat config 成为默认配置方式，常用 eslint.config.js；旧 .eslintrc 属于历史配置路径，应按项目版本迁移。团队使用本地锁定版本并在 CI 执行，TypeScript 类型感知规则需正确的解析器与项目配置，自动修复后仍要检查变更。

参考：[资料 1](https://eslint.org/docs/latest/use/configure/configuration-files)。

---

## Q332｜Git 的基本使用方法

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

Git 有工作区、索引和提交历史三个主要状态。日常先看 status/diff，再有选择暂存并检查 staged diff，提交只包含索引内容，不自动上传远程。

```bash
git status --short
git switch -c feature/search
git diff
git add src/search.ts
git diff --cached
git commit -m "feat(search): add keyword filter"
git log --oneline -5
```

路径是示例，按实际修改选择。fetch 更新远程跟踪引用，push 才向远程发送提交；分支名、上游与协作策略应先明确，不要习惯性暂存整个工作区。

参考：[资料 1](https://git-scm.com/docs/git) · [资料 2](https://git-scm.com/docs/git-add)。

---

## Q333｜git commit message 规范

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

Conventional Commits 常用 <type>[optional scope][!]: <description>，例如 fix(search): handle empty query。feat 与 fix 分别表示新增功能和修复；docs/test/refactor/chore 等由团队约定。

破坏性变化可用 ! 或 BREAKING CHANGE footer 标注。标题写可观察变化，正文说明必要的原因和约束，关联任务放 footer；规范用于自动化和可读历史，不是 Git 强制语法，也不应把所有改动都写成 update。

参考：[资料 1](https://www.conventionalcommits.org/en/v1.0.0/)。

---

## Q334｜Git Flow 工作流

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

经典 Git Flow 使用稳定发布分支、develop、feature、release 与 hotfix 管理版本；功能回到 develop，发布/紧急修复需同步到相关长期分支，避免下一版本丢失修复。

它适合有并行维护版本与明确发布周期的团队，但长期分支增加合并成本。持续交付团队可用短分支/主干开发，分支保护、CI、评审和 feature flag 比固定分支名字更关键。工作流选择要匹配部署节奏，不能把 Git Flow 当唯一规范。

参考：[资料 1](https://nvie.com/posts/a-successful-git-branching-model/)。

---

## Q335｜Git 提交文件发生冲突的原因 以及 解决方法

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

冲突发生在 Git 无法自动协调变更时，例如同一区域不同修改、修改与删除冲突或复杂重命名；并行改同一文件不同区域未必冲突。先看 status 和上下文，保留双方意图，修复后运行相关检查再标记解决。

```bash
git status
# 编辑冲突文件并检查结果
git add src/example.ts
git merge --continue
# 若当前是 rebase，则使用 git rebase --continue
```

无法继续可用对应 --abort 回到操作前状态。rebase 中 ours/theirs 的含义容易与直觉相反，不应一键全部选择某一边，也不能仅删除冲突标记就认为逻辑正确。

参考：[资料 1](https://git-scm.com/docs/git-merge) · [资料 2](https://git-scm.com/docs/git-rebase)。

---

## Q336｜本次提交误操作，具体撤销操作

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

先区分改动处于工作区、暂存区、本地提交还是共享历史。只取消暂存用 git restore --staged；本地最近提交需重新整理且保留改动，可用 reset --soft；共享提交通常用 revert 生成反向提交。

```bash
git restore --staged -- src/example.ts
# 仅针对尚未共享的最近提交，保留改动在暂存区
git reset --soft HEAD~1
# 对已共享的指定提交创建反向提交
git revert <commit-id>
```

以上是独立方案，不能顺序照抄。reset --hard 和工作区 restore 会丢弃本地内容，应先检查/备份。reflog 可帮助找回曾被引用的提交，不能保证恢复未提交文件。

参考：[资料 1](https://git-scm.com/docs/git-reset) · [资料 2](https://git-scm.com/docs/git-revert) · [资料 3](https://git-scm.com/docs/git-restore)。

---

## Q337｜查看查看某个文件的历史记录

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

用路径限定 log 可查看文件历史，-p 查看补丁，--follow 在单文件场景下尝试追踪重命名。blame 解释当前行最后来自哪个提交，不等于最初作者或缺陷责任。

```bash
git log --follow -p -- src/example.ts
git log --oneline -- src/example.ts
git blame -- src/example.ts
git show <commit-id>:src/example.ts
```

路径分隔符 -- 可避免文件名被当参数；重命名追踪依赖相似性判断，跨复杂重写可能不完整。

参考：[资料 1](https://git-scm.com/docs/git-log) · [资料 2](https://git-scm.com/docs/git-blame)。

---

## Q338｜本地工程配置文件，不需要被提交，如何处理

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

团队共享忽略规则放 .gitignore，个人仅本仓库规则可放 .git/info/exclude；本地配置常用 .env.local，提交无秘密的 .env.example。已跟踪文件不会因加入 ignore 自动停止跟踪，必要时经确认用 git rm --cached 从索引移除并提交。

ignore 不清理历史，泄漏凭据应先轮换。不要把 assume-unchanged/skip-worktree 当长期配置管理方案，它们不是安全边界，也可能在切换/合并时产生意外。

参考：[资料 1](https://git-scm.com/docs/gitignore) · [资料 2](https://git-scm.com/docs/git-rm)。

---

## Q339｜git fetch 和  git pull 的区别

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

fetch 下载对象并更新相应远程跟踪引用，通常不把它们整合进当前分支；pull 先 fetch，再按参数/配置执行 merge、rebase 或仅快进。不能把 pull 固定理解为总产生一次合并提交。

希望先检查时，可 fetch 后查看本地与 origin/main 差异；只接受快进可用 pull --ff-only。存在本地修改或分叉时先确认策略，避免自动整合带来意外工作区变化。

参考：[资料 1](https://git-scm.com/docs/git-fetch) · [资料 2](https://git-scm.com/docs/git-pull)。

---

## Q340｜git rebase 和 git merge 的区别

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

merge 把另一条历史合入当前分支，能快进时可能只移动指针，否则通常产生合并提交；保留原提交身份。rebase 将一组改动重新应用到新基底，通常产生新提交 ID，历史更线性但会改写引用关系。

rebase 并不保证冲突更少，甚至可能逐提交解决相似冲突；--rebase-merges 还可重建合并结构。未协商不要重写他人依赖的共享历史，按团队策略选择并验证最终代码，而不是只追求日志形状。

参考：[资料 1](https://git-scm.com/docs/git-merge) · [资料 2](https://git-scm.com/docs/git-rebase)。

---

## Q341｜git reset、git revert 和 git checkout 有什么区别 ？

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

reset 可移动当前引用，并按 soft/mixed/hard 控制索引与工作区；也可只操作特定路径的索引。revert 在当前历史上创建抵消指定提交的变更，适合撤销已共享修改。

checkout 兼具切换与恢复文件，现代 Git 可用 switch/restore 分开表达。恢复文件可能丢弃未提交内容；revert 合并提交要明确主线父节点且影响以后重合并，不能机械添加参数。操作前先看 status/diff 与是否已推送。

参考：[资料 1](https://git-scm.com/docs/git-reset) · [资料 2](https://git-scm.com/docs/git-revert) · [资料 3](https://git-scm.com/docs/git-checkout)。

---

## Q342｜git 跟 svn 有什么区别

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

Git 以分布式对象库与引用组织历史，本地可提交、分支和比较；SVN 主要以中央仓库和全局修订号组织版本，提交需要连接服务器。Git 也支持浅克隆/部分克隆，不能说每次都必须下载完整历史。

SVN 分支/标签通常是廉价目录复制，并非必然复制全部内容；SVN 也有校验与访问控制，不能说它没有完整性保护。选型看工作流、权限粒度、大文件和既有工具，而非简单断言一种在所有操作上更快或更安全。

参考：[资料 1](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control) · [资料 2](https://svnbook.red-bean.com/en/1.8/svn.branchmerge.html)。

---

## Q343｜如何解决联调依赖问题

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

先约定可机器校验的接口契约，包括字段、错误码、分页、鉴权和兼容变化；用示例及 Mock 覆盖成功、空数据、失败、慢响应与乱序，前后端可并行开发。

用契约测试防止 Mock 与真实服务漂移，在集成环境验证完整链路并保留请求 ID。Mock 不能代替真实鉴权、网关、CORS、超时和数据库验证；联调数据应可复现且不依赖生产敏感信息。

参考：[资料 1](https://spec.openapis.org/oas/latest.html) · [资料 2](https://docs.pact.io/)。

---

## Q344｜关于 DevOps

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

DevOps 是开发与运维共同对交付和运行结果负责的一组文化与实践，常包含频繁集成、自动验证、可重复部署、基础设施管理和监控反馈。CI 强调持续整合验证；持续交付让版本随时可发布，持续部署则进一步自动部署通过门禁的变更。

容器、微服务和某个 CI 产品都不是必备定义。应建立可追踪构建产物、环境配置、渐进发布、回滚与故障恢复，用交付周期、变更失败和恢复表现评估改进，避免只统计流水线数量。

参考：[资料 1](https://dora.dev/guides/)。

---

## Q345｜关于 Docker

适用：Git 2.23+；ESLint 9+ flat config；Docker/Node 24 教学配置。

Docker 用镜像描述应用与用户空间依赖，容器是镜像运行的实例；Linux 容器通常共享宿主内核，依靠隔离与资源控制。它提高环境一致性，但 CPU 架构、内核、挂载和外部服务仍会影响运行。

```dockerfile
FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
USER node
EXPOSE 3000
CMD ["node", "app.js"]
```

示例假定无需编译的 Node 服务、已有 lockfile，并通过 .dockerignore 排除 node_modules、秘密和无关文件。需编译的项目用多阶段构建；EXPOSE 不自动开放宿主端口，运行需显式映射。生产可固定镜像 digest，并配置资源上限、健康检查和外部持久存储。

参考：[资料 1](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/) · [资料 2](https://docs.docker.com/build/building/best-practices/)。

---

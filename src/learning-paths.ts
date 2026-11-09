export type LearningPathDefinition = {
  id: string; subject: string; title: string; description: string;
  steps: readonly { key: string; stage: string; goal: string }[];
};

export const learningPaths: readonly LearningPathDefinition[] = [{
  id: 'react-basics', subject: 'React', title: 'React 基础学习路径',
  description: '适合已经接触 JavaScript、想理清 React 状态与 Hooks 的你。用题目、原理笔记与代码实践串起关键概念。',
  steps: [
    { key: 'q:206', stage: '建立基础', goal: '区分 props 与 state，理解组件的数据从哪里来。' },
    { key: 'a:react-state', stage: '理解状态快照', goal: '对照连续更新示例，解释当前回调为什么仍读到旧状态。' },
    { key: 'a:closure', stage: '补齐闭包知识', goal: '用计数器示例理解变量绑定，再联系每次渲染产生的回调。' },
    { key: 'q:204', stage: '认识 Hooks', goal: '了解 Hooks 解决的问题，以及使用时需要遵守的规则。' },
    { key: 'q:226', stage: '管理副作用', goal: '结合示例检查依赖与清理，理解何时需要重新同步。' },
    { key: 'q:227', stage: '组织复用逻辑', goal: '区分复用逻辑和共享状态，理解自定义 Hook 的职责。' },
    { key: 'a:use-persist-fn', stage: '动手验证回调', goal: '按文中的验证方法检查函数引用、最新状态和使用边界。' },
  ],
}, {
  id: 'ai-basics', subject: 'AI', title: 'AI 应用学习路径',
  description: '适合想了解如何构建和验证 AI 应用的前端开发者。用现有笔记和可在本地运行的练习，从理解模型输出学到应用评估。',
  steps: [
    { key: 'a:ai-fundamentals', stage: '理解模型输出', goal: '区分 Token、向量和上下文，运行输出校验示例，验证缺字段和类型错误会被拒绝。' },
    { key: 'a:rag-basics', stage: '让回答有据可查', goal: '用固定资料和问题做练习，分别判断检索有没有找到依据、回答有没有正确使用依据。' },
    { key: 'a:ai-agent-basics', stage: '设计工具执行边界', goal: '区分工具请求、执行结果和任务完成，写出超时或结果未知时的处理步骤。' },
    { key: 'a:ai-evaluation', stage: '验证应用改动', goal: '运行关键词规则的反例，为一个场景写出样例、失败条件与回归检查。' },
  ],
}];

export const findLearningPath = (id: string | null) => learningPaths.find(path => path.id === id);
export const learningPathHref = (path: LearningPathDefinition) => `?view=learning&path=${path.id}`;

import { useState } from 'react';
import { articles, useQuestions } from './content';
import { learningTargets } from './learning-view';
import { reactPathHref, reactPathSteps } from './react-path';
import { studyDirectory, studyProgress } from './study-session';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import { StudyResumeCard } from './StudyResumeCard';
import type { StartStudy } from './StudyStartActions';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';

export const ReactLearningPath = ({ learning, study, navigate, startStudy }: { learning: Learning; study: Study; navigate: Navigate; startStudy: StartStudy }) => {
  const catalog = useQuestions();
  const [error, setError] = useState('');
  const targets = new Map(learningTargets(catalog.questions, articles).map(target => [target.key, target]));
  const steps = reactPathSteps.map(step => ({ ...step, target: targets.get(step.key) }));
  const queue = steps.flatMap(step => step.target ? [step.target] : []);
  const ready = !catalog.loading && !catalog.error && queue.length === steps.length;
  const counts = studyProgress(queue, learning.data);
  const unread = studyDirectory(queue, learning.data, '', 'unread');
  const review = studyDirectory(queue, learning.data, '', 'review');
  const begin = (selected: typeof queue) => {
    if (!ready || !selected.length) return;
    try { startStudy(selected, new URLSearchParams(reactPathHref)); setError(''); }
    catch (cause) { setError(`无法开始路径：${cause instanceof Error ? cause.message : '清单无效'}`); }
  };
  return <>
    <nav className="breadcrumb" aria-label="面包屑"><Link href="?view=home" navigate={navigate}>首页</Link><span>/</span><Link href="?view=learning" navigate={navigate}>我的学习</Link><span>/</span><b aria-current="page">React 学习路径</b></nav>
    <span className="eyebrow">LEARN REACT STEP BY STEP</span><h1>React 基础学习路径</h1>
    <p className="description">适合已经接触 JavaScript、想理清 React 状态与 Hooks 的你。沿着 {steps.length} 步，连接题目、原理笔记与代码实践。</p>
    {study.session && <StudyResumeCard study={study} learning={learning} navigate={navigate} />}
    {catalog.loading && <p role="status">正在加载路径内容…</p>}
    {catalog.error && <p role="alert">{catalog.error}<button onClick={catalog.retry}>重试路径内容</button></p>}
    {!catalog.loading && !catalog.error && !ready && <p role="alert">部分路径内容暂不可用，请先阅读可用内容，完整清单暂不能开始。</p>}
    {ready && <div className="path-progress"><p role="status">共 {counts.total} 步 · 已读 {counts.read} · 待复习 {counts.review} · 未读 {counts.unread}</p><progress aria-label="React 路径已读进度" value={counts.read} max={counts.total} /></div>}
    {ready && counts.read === counts.total && <p className="path-note" role="status">这条路径已全部标记已读。可以重新学习全部步骤，或将需要重看的步骤标为待复习。</p>}
    {ready && !counts.unread && counts.review > 0 && <p className="path-note" role="status">没有未读步骤，还有 {counts.review} 步待复习。</p>}
    <div className="path-actions"><div className="path-action-buttons" role="group" aria-label="React 路径学习操作">
      <button className={counts.unread < counts.total ? 'path-secondary' : 'primary-link'} disabled={!ready} onClick={() => begin(queue)}>按顺序开始学习 →</button>
      <button className={counts.unread > 0 && counts.unread < counts.total ? 'primary-link' : 'path-secondary'} disabled={!ready || !unread.length} onClick={() => begin(unread)}>只学未读{ready ? `（${unread.length} 步）` : ''}</button>
      <button className="path-secondary" disabled={!ready || !review.length} onClick={() => begin(review)}>复习待复习{ready ? `（${review.length} 步）` : ''}</button>
    </div><span>{study.session ? '开始后会替换当前清单，已有阅读标记保留。也可以使用上方入口继续原清单。' : '全部、未读和待复习均按路径顺序学习；单独打开内容不会替换学习清单。'}</span></div>
    {(error || learning.error) && <p role="alert">{error || learning.error}</p>}
    <ol className="learning-path-steps" aria-label="React 学习步骤">{steps.map(step => <li key={step.key}>
      <div className="path-step-meta"><strong>{step.stage}</strong><span>{({ read: '已读', review: '待复习', unread: '未读' })[learning.data.entries[step.key]?.status ?? 'unread']}</span></div>
      <h2>{step.target ? <Link href={step.target.href} navigate={navigate}>{step.target.title} →</Link> : catalog.loading ? '正在加载…' : '内容暂不可用'}</h2><p>{step.goal}</p>
    </li>)}</ol>
    <p className="path-note">最后一步建议实际运行示例后再标记。已读只是你的阅读记录，不代表已通过知识测验。</p>
  </>;
};

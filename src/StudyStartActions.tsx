import { useState } from 'react';
import type { LearningTarget } from './learning-view';
import type { Navigate } from './NavigationLink';

export type StartStudy = (targets: LearningTarget[], params: URLSearchParams, random?: boolean) => void;

export const StudyStartActions = ({ queue, items, selection, params, navigate, startStudy, hasSession, review = false }: { queue: LearningTarget[]; items: LearningTarget[]; selection?: LearningTarget[]; params: URLSearchParams; navigate: Navigate; startStudy: StartStudy; hasSession: boolean; review?: boolean }) => {
  const [error, setError] = useState('');
  const range = params.get('studyRange') === 'page' ? 'page' : 'all';
  const selecting = selection !== undefined;
  const selected = selection ?? (range === 'page' ? items : queue);
  const begin = (random = false) => {
    try { startStudy(selected, params, random); setError(''); }
    catch (cause) { setError(`无法开始学习：${cause instanceof Error ? cause.message : '清单无效'}`); }
  };
  return <div className="study-start-actions">
    {selecting ? <span>学习范围：仅勾选内容</span> : <label>学习范围<select aria-label="学习清单范围" value={range} onChange={event => { const next = new URLSearchParams(params); if (event.target.value === 'page') next.set('studyRange', 'page'); else next.delete('studyRange'); navigate(`?${next}`, true); }}><option value="all">全部匹配（{queue.length} 项）</option><option value="page">仅当前页（{items.length} 项）</option></select></label>}
    <button className="primary-learning-action" disabled={!selected.length} onClick={() => begin()}>{selecting ? `${review ? '复习' : '学习'}所选 ${selected.length} 项` : review ? '开始复习' : '开始学习'} →</button>
    <button disabled={!selected.length} onClick={() => begin(true)}>{selecting ? '随机学习所选' : '随机学习'}</button>
    <small>{selecting && !selected.length ? '先勾选下方题目或笔记，再开始学习。' : `本次清单 ${selected.length} 项，按当前列表顺序学习；随机学习打乱${selecting ? '所选内容' : '完整清单'}，每项只出现一次。`}</small>
    {hasSession && <small>开始学习会替换当前清单，已有阅读标记保留。</small>}
    {error && <p role="alert">{error}</p>}
  </div>;
};

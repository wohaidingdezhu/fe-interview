import { useEffect, useRef } from 'react';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';
import type { LearningTarget } from './learning-view';
import type { Navigate } from './NavigationLink';
import { createStudySession, studyDirectory, studyHref, studyProgress } from './study-session';

export const StudySummary = ({ queue, learning, study, navigate, onClose }: { queue: LearningTarget[]; learning: Learning; study: Study; navigate: Navigate; onClose: () => void }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement; const modal = dialog.current; modal?.showModal(); return () => { modal?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); }; }, []);
  const counts = studyProgress(queue, learning.data);
  const back = study.session?.returnSearch ?? '?view=learning';
  const resume = (status: 'unread' | 'review') => {
    const remaining = studyDirectory(queue, learning.data, '', status);
    if (!remaining.length) return;
    study.start(createStudySession(remaining, new URLSearchParams(back)));
    onClose(); navigate(studyHref(remaining[0]));
  };
  return <dialog ref={dialog} className="study-summary" aria-labelledby="study-summary-title" onClose={event => {
    // StrictMode 重开弹窗后，忽略前一次清理排队的 close 事件。
    if (!event.currentTarget.open) onClose();
  }}>
    <h2 id="study-summary-title">本次清单结果</h2>
    <p>清单共 {counts.total} 项，以下按当前阅读标记统计，跳过的内容不会自动标记已读。</p>
    <div className="learning-stats"><div><strong>{counts.read}</strong><span>已读</span></div><div><strong>{counts.review}</strong><span>待复习</span></div><div><strong>{counts.unread}</strong><span>未读</span></div></div>
    <div className="study-summary-actions">
      {counts.unread > 0 && <button className="primary-learning-action" onClick={() => resume('unread')}>继续剩余 {counts.unread} 项未读</button>}
      {counts.review > 0 && <button onClick={() => resume('review')}>复习 {counts.review} 项</button>}
      <button onClick={() => { study.end(); navigate(back); }}>结束清单并返回列表</button>
      <button onClick={onClose}>关闭结果</button>
    </div>
  </dialog>;
};

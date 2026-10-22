import { useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { LearningTarget } from './learning-view';
import type { LearningData, LearningStatus } from './learning-utils';
import { studyDirectory, studyHref, studyProgress } from './study-session';
import { NavigationLink as Link, type Navigate } from './NavigationLink';

export const StudyQueueDialog = ({ queue, data, currentKey, dialogRef, onClose, navigate }: { queue: LearningTarget[]; data: LearningData; currentKey: string; dialogRef: RefObject<HTMLDialogElement | null>; onClose: () => void; navigate: Navigate }) => {
  const titleId = useId(), [query, setQuery] = useState(''), [status, setStatus] = useState<LearningStatus | ''>('');
  const searchRef = useRef<HTMLInputElement>(null), [focusTarget, setFocusTarget] = useState<'search' | 'current' | ''>('');
  const counts = studyProgress(queue, data), items = studyDirectory(queue, data, query, status);
  const resetFilters = (target: 'search' | 'current') => { setQuery(''); setStatus(''); setFocusTarget(target); };
  useLayoutEffect(() => {
    if (!focusTarget) return;
    const target = focusTarget === 'search' ? searchRef.current : dialogRef.current?.querySelector<HTMLAnchorElement>('a[aria-current="location"]');
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    setFocusTarget('');
  }, [focusTarget, dialogRef]);
  return <dialog ref={dialogRef} className="study-queue-dialog" aria-labelledby={titleId} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
    <div className="study-queue-header"><div><h2 id={titleId}>学习清单目录</h2><p>共 {counts.total} 项 · 已读 {counts.read} · 待复习 {counts.review} · 未读 {counts.unread}</p></div><button aria-label="关闭学习清单目录" onClick={() => dialogRef.current?.close()}>关闭 ×</button></div>
    <div className="study-queue-filters"><label>题号或标题<input ref={searchRef} type="search" aria-label="搜索清单内容" placeholder="例如 Q134、闭包" value={query} onChange={event => setQuery(event.target.value)} /></label><label>阅读状态<select aria-label="清单阅读状态" value={status} onChange={event => setStatus(event.target.value as LearningStatus | '')}><option value="">全部状态</option><option value="unread">未读</option><option value="read">已读</option><option value="review">待复习</option></select></label></div>
    <p className="study-queue-summary" role="status">显示 {items.length} / {counts.total} 项，序号沿用原清单。</p>
    <div className="study-queue-actions">{queue.some(item => item.key === currentKey) && <button onClick={() => resetFilters('current')}>定位当前项</button>}{(query || status) && <button onClick={() => resetFilters('search')}>清除筛选</button>}</div>
    <nav className="study-queue-list" aria-label="选择清单内容">{items.map(item => <Link key={item.key} navigate={navigate} href={studyHref(item)} aria-current={item.key === currentKey ? 'location' : undefined} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) dialogRef.current?.close(); }}><span>{item.index + 1}</span><div><strong>{item.title}</strong><small>{item.category} · {item.status === 'read' ? '已读' : item.status === 'review' ? '待复习' : '未读'}{item.key === currentKey ? ' · 当前项' : ''}</small></div></Link>)}</nav>
    {!items.length && <p className="study-queue-empty">没有匹配的内容，试试其他关键词或阅读状态。</p>}
  </dialog>;
};

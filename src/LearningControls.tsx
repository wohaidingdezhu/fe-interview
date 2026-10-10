import type { Learning } from './useLearning';
export function LearningControls({ itemKey, learning, compact = false }: { itemKey: string; learning: Learning; compact?: boolean }) {
  const entry = learning.data.entries[itemKey];
  return <div className={`learning-controls ${compact ? 'compact' : ''}`} aria-label="学习标记">
    <button type="button" aria-pressed={entry?.bookmarked ?? false} onClick={() => learning.update(itemKey, { bookmarked: !entry?.bookmarked })}>{entry?.bookmarked ? '★ 已收藏' : '☆ 收藏'}</button>
    <button type="button" aria-pressed={entry?.status === 'read'} onClick={() => learning.update(itemKey, { status: entry?.status === 'read' ? 'unread' : 'read' })}>{entry?.status === 'read' ? '✓ 已读' : '标为已读'}</button>
    <button type="button" aria-pressed={entry?.status === 'review'} onClick={() => learning.update(itemKey, { status: entry?.status === 'review' ? 'unread' : 'review' })}>{entry?.status === 'review' ? '↺ 待复习' : '稍后复习'}</button>
  </div>;
}

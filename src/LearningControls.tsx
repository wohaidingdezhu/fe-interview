import type { Learning } from './useLearning';
export function LearningControls({ itemKey, learning, compact = false }: { itemKey: string; learning: Learning; compact?: boolean }) {
  const entry = learning.data.entries[itemKey];
  const labels = compact ? {
    bookmark: entry?.bookmarked ? '★ 收藏' : '☆ 收藏', read: entry?.status === 'read' ? '✓ 已读' : '○ 已读', review: entry?.status === 'review' ? '↺ 复习' : '↻ 复习',
  } : {
    bookmark: entry?.bookmarked ? '★ 已收藏' : '☆ 收藏', read: entry?.status === 'read' ? '✓ 已读' : '标为已读', review: entry?.status === 'review' ? '↺ 待复习' : '稍后复习',
  };
  return <div className={`learning-controls ${compact ? 'compact' : ''}`} aria-label="学习标记">
    <button type="button" aria-pressed={entry?.bookmarked ?? false} onClick={() => learning.update(itemKey, { bookmarked: !entry?.bookmarked })}>{labels.bookmark}</button>
    <button type="button" aria-pressed={entry?.status === 'read'} onClick={() => learning.update(itemKey, { status: entry?.status === 'read' ? 'unread' : 'read' })}>{labels.read}</button>
    <button type="button" aria-pressed={entry?.status === 'review'} onClick={() => learning.update(itemKey, { status: entry?.status === 'review' ? 'unread' : 'review' })}>{labels.review}</button>
  </div>;
}

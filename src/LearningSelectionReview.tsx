import { useLayoutEffect, useRef } from 'react';
import type { LearningTarget } from './learning-view';

export const LearningSelectionReview = ({ items, onLocate, onRemove }: {
  items: LearningTarget[]; onLocate: (key: string) => void; onRemove: (key: string) => void;
}) => {
  const summary = useRef<HTMLElement>(null);
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<{ key?: string } | null>(null);
  useLayoutEffect(() => {
    if (!pendingFocus.current) return;
    const next = pendingFocus.current.key;
    (next ? removeButtons.current.get(next) ?? summary.current : summary.current)?.focus();
    pendingFocus.current = null;
  }, [items]);
  return <details className="learning-selection-review">
    <summary ref={summary}>查看已选内容（{items.length} 项）</summary>
    {items.length ? <ol aria-label="已选学习内容">{items.map((item, index) => <li key={item.key}>
      <strong>{item.title}</strong>
      <div><button type="button" aria-label={`定位 ${item.title}`} onClick={() => onLocate(item.key)}>定位原条目</button>
        <button ref={button => { if (button) removeButtons.current.set(item.key, button); else removeButtons.current.delete(item.key); }} type="button" aria-label={`取消选择 ${item.title}`} onClick={() => {
          // 渲染完成后聚焦相邻条目，便于连续取消；空清单则回到入口。
          pendingFocus.current = { key: items[index + 1]?.key ?? items[index - 1]?.key };
          onRemove(item.key);
        }}>取消选择</button></div>
    </li>)}</ol> : <p>尚未选择内容。勾选下方题目或笔记后，会在这里按列表顺序显示。</p>}
  </details>;
};

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { LearningImportChange } from './learning-backup';
import type { LearningEntry } from './learning-utils';
import type { LearningTarget } from './learning-view';

const labels = { added: '新增', updated: '更新', removed: '移除', retained: '保留' };
const describe = (entry?: LearningEntry) => entry ? `${{ unread: '未读', read: '已读', review: '待复习' }[entry.status]} · ${entry.bookmarked ? '已收藏' : '未收藏'}` : '无记录';

export const LearningImportChanges = ({ changes, targets }: { changes: LearningImportChange[]; targets: LearningTarget[] }) => {
  const [filter, setFilter] = useState('changed'), [query, setQuery] = useState(''), [page, setPage] = useState(1);
  const heading = useRef<HTMLParagraphElement>(null), focusPage = useRef(false);
  const titles = useMemo(() => new Map(targets.map(target => [target.key, target.title])), [targets]);
  const words = query.trim().toLocaleLowerCase(), exact = /^q:?([1-9]\d*)$/.exec(words);
  const matches = changes.filter(change => (filter === 'changed' ? change.kind !== 'retained' : change.kind === filter)
    && (!words || (exact ? change.key === `q:${exact[1]}` : words.split(/\s+/).every(word => `${change.key} ${titles.get(change.key) ?? ''}`.toLocaleLowerCase().includes(word)))))
    .sort((a, b) => a.key.localeCompare(b.key, 'zh-CN', { numeric: true }));
  const pages = Math.max(1, Math.ceil(matches.length / 8)), currentPage = Math.min(page, pages);
  useEffect(() => { setPage(value => Math.min(value, pages)); }, [pages]);
  useLayoutEffect(() => {
    if (focusPage.current) { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: 'nearest' }); focusPage.current = false; }
  }, [currentPage]);
  return <details className="backup-change-details"><summary>查看记录变更明细</summary>
    <div className="backup-change-filters"><label>变更类型<select value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}><option value="changed">仅有变更</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>题号或标题<input type="search" aria-label="搜索导入记录" placeholder="例如 Q5、闭包" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></label></div>
    <p ref={heading} tabIndex={-1} role="status">共 {matches.length} 条记录 · 第 {currentPage} / {pages} 页</p>
    <ol className="backup-change-list" aria-label="备份记录变更明细">{matches.slice((currentPage - 1) * 8, currentPage * 8).map(change => <li key={change.key}>
      <div><span className="pill">{labels[change.kind]}</span><strong>{titles.get(change.key) ?? `${change.key.startsWith('q:') ? `Q${change.key.slice(2)}` : change.key}（当前目录未匹配）`}</strong></div>
      <p>{describe(change.before)} → {describe(change.after)}</p>
      {change.kind === 'removed' ? <small>备份中的清空或清理操作生效。</small> : change.after && <small>{change.kind === 'updated' && describe(change.before) === describe(change.after) ? '标记时间更新：' : '标记时间：'}<time dateTime={change.after.updatedAt}>{new Date(change.after.updatedAt).toLocaleString('zh-CN')}</time></small>}
    </li>)}</ol>
    {!matches.length && <p>没有匹配的记录，试试其他变更类型或关键词。</p>}
    {pages > 1 && <nav aria-label="导入记录明细分页"><button type="button" disabled={currentPage === 1} onClick={() => { focusPage.current = true; setPage(currentPage - 1); }}>上一页明细</button><button type="button" disabled={currentPage === pages} onClick={() => { focusPage.current = true; setPage(currentPage + 1); }}>下一页明细</button></nav>}
  </details>;
};

import { LearningBackupImport } from './LearningBackupImport';
import { LearningBackupButton } from './LearningBackupButton';
import { readingInStudy } from './study-session';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { articles, useQuestions } from './content';
import { articleHref } from './library-utils';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import { LearningControls } from './LearningControls';
import { LearningOverview } from './LearningOverview';
import { LearningSelectionReview } from './LearningSelectionReview';
import { LearningSaveRecovery } from './LearningSaveRecovery';
import { learningFilters, learningOverview, learningShelf, learningTargets, type LearningTarget } from './learning-view';
import type { Learning } from './useLearning';
import type { LearningBatchUndo, LearningStatus } from './learning-utils';
import { StudyResumeCard } from './StudyResumeCard';
import type { Study } from './useStudySession';
import { StudyStartActions } from './StudyStartActions';
import { learningPaths, learningPathHref } from './learning-paths';
export const LearningPage = ({ learning, navigate, params, startStudy, study, onListReady }: { learning: Learning; navigate: Navigate; params: URLSearchParams; startStudy: (targets: LearningTarget[], params: URLSearchParams, random?: boolean) => void; study?: Study; onListReady?: () => void }) => {
  const catalog = useQuestions(), [message, setMessage] = useState('');
  useLayoutEffect(() => { if (!catalog.loading) onListReady?.(); }, [catalog.loading, onListReady]);
  const [undo, setUndo] = useState<LearningBatchUndo | null>(null);
  const [selection, setSelection] = useState<{ scope: string; keys: string[] }>();
  const feedback = useRef<HTMLParagraphElement>(null), searchRef = useRef<HTMLInputElement>(null);
  const actions = useRef<HTMLElement>(null), list = useRef<HTMLDivElement>(null);
  const targets = learningTargets(catalog.questions, articles);
  const result = learningShelf(targets, learning.data, params);
  const scope = params.toString(), pageKeys = JSON.stringify(result.items.map(item => item.key));
  const selecting = selection?.scope === scope;
  const selectedItems = selecting ? result.items.filter(item => selection.keys.includes(item.key)) : [];
  const batchItems = selecting ? selectedItems : result.items;
  useEffect(() => {
    const visible = new Set<string>(JSON.parse(pageKeys));
    setSelection(previous => {
      if (!previous || previous.scope !== scope) return undefined;
      const keys = previous.keys.filter(key => visible.has(key));
      return keys.length === previous.keys.length ? previous : { scope, keys };
    });
  }, [scope, pageKeys]);
  const counts = learningOverview(targets, learning.data);
  const categories = counts.categories.map(item => item.category);
  const query = params.get('q') || '';
  const update = (key: string, value: string, replace = false) => {
    const next = new URLSearchParams(params);
    next.set('view', 'learning');
    next.delete('page');
    if (value) next.set(key, value); else next.delete(key);
    navigate(`?${next}`, replace);
  };
  const validKeys = new Set(targets.map(item => item.key)), validArticles = new Set(articles.map(article => article.id));
  const catalogReady = !catalog.loading && !catalog.error;
  const staleCount = catalogReady ? Object.keys(learning.data.entries).filter(key => !validKeys.has(key)).length + (learning.data.lastRead && !validArticles.has(learning.data.lastRead.articleId) ? 1 : 0) : 0;
  const last = learning.data.lastRead;
  const selectItem = (key: string, checked: boolean) => setSelection(previous => {
    const keys = previous?.scope === scope ? previous.keys.filter(value => value !== key) : [];
    return { scope, keys: checked ? [...keys, key] : keys };
  });
  const locateItem = (key: string) => {
    const checkbox = Array.from(list.current?.querySelectorAll<HTMLInputElement>('.learning-select input') ?? []).find(input => input.value === key);
    checkbox?.focus({ preventScroll: true });
    checkbox?.scrollIntoView({ block: 'center', behavior: 'instant' });
  };
  const markPage = (status: LearningStatus) => {
    if (!batchItems.length) return;
    const saved = learning.updateMany(batchItems.map(item => item.key), status);
    if (saved.count) setUndo(saved.undo);
    if (selecting) setSelection({ scope, keys: [] });
    setMessage(saved.count ? `已将${selecting ? '选中的' : '本页'} ${saved.count} 条内容标记为${status === 'read' ? '已读' : '待复习'}。${saved.error ? '尚未保存到浏览器，请导出备份。' : ''}` : '所选内容已是这个状态，无需重复标记。');
    feedback.current?.focus();
  };
  const undoBatch = () => {
    if (!undo) return;
    const saved = learning.undoMany(undo), expected = Object.keys(undo.previous).length;
    setUndo(null);
    setMessage(`已撤销 ${saved.count} 条标记。${saved.count < expected ? '其余记录已有后续修改，已保留。' : ''}${saved.error ? '尚未保存到浏览器，请导出备份。' : ''}`);
    feedback.current?.focus();
  };
  return <><div className="breadcrumb">前端资料库 <span>/</span> 我的学习</div><span className="eyebrow">YOUR PERSONAL READING SHELF</span><h1>我的学习</h1><p className="description">收藏、已读与待复习。把下一次阅读，接在这一次之后。</p>
    <nav className="path-entry-links" aria-label="学习路径">{learningPaths.map(path => <Link key={path.id} navigate={navigate} href={learningPathHref(path)}>查看 {path.subject} 学习路径 →</Link>)}</nav>
    <LearningSaveRecovery learning={learning} study={study} onSaved={() => setMessage('')} />
    {study?.session && <StudyResumeCard study={study} learning={learning} navigate={navigate} />}
    {last && !readingInStudy(study?.session, last) && articles.some(a => a.id === last.articleId) && <section className="resume-card"><div><small>上次读到</small><h2>{last.title}</h2></div><Link navigate={navigate} href={articleHref(last.articleId, last.anchor)}>继续自由阅读 →</Link></section>}
    {catalogReady && <LearningOverview targets={targets} data={learning.data} navigate={navigate} />}
    <div className="learning-tabs" aria-label="学习记录筛选">{learningFilters.map(({ value, label }) => <button key={value} aria-pressed={result.filter === value} onClick={() => update('filter', value)}>{label} <span>{catalogReady ? counts.total[value] : '—'}</span></button>)}</div>
    <section className="filters learning-filters" aria-label="筛选学习记录">
      <label>题号或标题<input ref={searchRef} type="search" aria-label="搜索学习记录" placeholder="例如 Q134、闭包" value={query} onChange={event => update('q', event.target.value, true)} /></label>
      <label>分类<select aria-label="学习记录分类" value={result.category} onChange={event => update('category', event.target.value)}><option value="">全部分类</option>{categories.map(category => <option key={category}>{category}</option>)}{result.category && !categories.includes(result.category) && <option>{result.category}</option>}</select></label>
      <label>内容类型<select aria-label="学习内容类型" value={result.kind} onChange={event => update('kind', event.target.value)}><option value="">题目和笔记</option><option value="questions">仅题目</option><option value="notes">仅笔记</option></select></label>
      <label>排序<select aria-label="学习记录排序" value={result.sort} onChange={event => update('sort', event.target.value)}><option value="recent">最近标记优先</option><option value="oldest">较早标记优先</option><option value="title">题号与标题顺序</option></select></label>
      <label>每页数量<select aria-label="学习记录每页数量" value={result.size} onChange={event => update('size', event.target.value)}>{[12, 24, 48].map(size => <option key={size} value={size}>{size} 条</option>)}</select></label>
    </section>
    <div className="learning-feedback"><p ref={feedback} tabIndex={-1} role="status" className="backup-message">{message}</p>{undo && <button onClick={undoBatch}>撤销上次批量标记</button>}</div>
    {catalog.error && <p role="alert">{catalog.error}<button onClick={catalog.retry}>重试题目目录</button></p>}
    {catalog.loading && <p role="status">正在加载题目目录…</p>}
    {catalogReady && <><div className="list-summary"><span role="status">共找到 {result.total} 条内容</span>{(query || result.category || result.kind) && <button className="text-button" onClick={() => { const next = new URLSearchParams(params); for (const key of ['q', 'category', 'kind', 'page']) next.delete(key); next.set('view', 'learning'); navigate(`?${next}`); searchRef.current?.focus(); }}>清除筛选 ×</button>}</div>
      {!!result.total && <section ref={actions} tabIndex={-1} className="learning-actions" aria-label="学习与批量标记">
        <div className="learning-selection-actions">
          <span role="status">本页 {result.items.length} 条{selecting ? ` · 已选择 ${selectedItems.length} 条` : ''}</span>
          <button type="button" aria-pressed={selecting} onClick={() => setSelection(selecting ? undefined : { scope, keys: [] })}>{selecting ? '退出选择' : '选择部分内容'}</button>
          {selecting && <><button type="button" disabled={selectedItems.length === result.items.length} onClick={() => setSelection({ scope, keys: result.items.map(item => item.key) })}>全选本页</button><button type="button" disabled={!selectedItems.length} onClick={() => setSelection({ scope, keys: [] })}>清空选择</button></>}
          {selecting && <small>勾选后可开始学习或批量标记；切换筛选、排序或页码会清除选择。</small>}
        </div>
        {selecting && <LearningSelectionReview items={selectedItems} onLocate={locateItem} onRemove={key => selectItem(key, false)} />}
        <StudyStartActions queue={result.queue} items={result.items} selection={selecting ? selectedItems : undefined} params={params} navigate={navigate} startStudy={startStudy} hasSession={Boolean(study?.session)} review={result.filter === 'review'} />
        <details className="batch-management"><summary>{selecting ? '批量标记所选内容' : '批量标记本页'}</summary><div>
          <button disabled={batchItems.every(item => learning.data.entries[item.key]?.status === 'read')} onClick={() => markPage('read')}>{selecting ? '所选标记已读' : '本页标记已读'}</button>
          <button disabled={batchItems.every(item => learning.data.entries[item.key]?.status === 'review')} onClick={() => markPage('review')}>{selecting ? '所选标记待复习' : '本页标记待复习'}</button>
        </div></details>
      </section>}
      <div ref={list} className="resource-list">{result.items.map(item => <article className="resource-card" key={item.key} data-selected={selecting && selection.keys.includes(item.key) ? 'true' : undefined}>
        {selecting && <label className="learning-select"><input type="checkbox" value={item.key} aria-label={`选择 ${item.title}`} checked={selection.keys.includes(item.key)} onChange={event => selectItem(item.key, event.target.checked)} /><span>选择此项</span></label>}
        <small>{item.category}</small><h2><Link data-list-entry="" navigate={navigate} href={item.href}>{item.title} →</Link></h2><LearningControls itemKey={item.key} learning={learning} />
      </article>)}</div>
      {selecting && !!result.items.length && <div className="learning-selection-footer" role="region" aria-label="本页选择快捷操作"><span>本页已选择 {selectedItems.length} 条</span><button type="button" onClick={() => {
        actions.current?.focus({ preventScroll: true }); actions.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }}>返回学习操作 ↑</button></div>}
      {!result.total && <div className="empty-state"><h2>{query || result.category || result.kind ? '没有匹配的学习内容' : result.filter === 'unread' ? '当前内容都已标记' : '书架上还没有这类记录'}</h2><p>{query || result.category || result.kind ? '试试其他关键词或清除分类、类型筛选。' : '从一道感兴趣的题目开始，点击收藏或标记阅读状态。'}</p><Link navigate={navigate} href="?view=questions">去看看全部题目 →</Link></div>}
      {result.pages > 1 && <nav className="list-pagination" aria-label="学习记录分页"><button disabled={result.page === 1} onClick={() => update('page', String(result.page - 1))}>← 上一页</button><span>{result.page} / {result.pages}</span><button disabled={result.page === result.pages} onClick={() => update('page', String(result.page + 1))}>下一页 →</button></nav>}
    </>}
    <details className="learning-management"><summary>记录管理 · 备份与清理</summary><div className="learning-backup"><div><strong>记录只保存在当前浏览器</strong><p>备份包含阅读记录和未完成清单。导入前可预览记录变化，并选择恢复备份清单或保留当前清单；旧版备份仅合并记录。</p></div><div><LearningBackupButton learning={learning} study={study} /><LearningBackupImport learning={learning} study={study} targets={targets} onImported={() => { setUndo(null); setSelection(undefined); setMessage(''); }} /></div></div>
    <div className="learning-maintenance"><button disabled={!staleCount} onClick={() => { const saved = learning.prune(validKeys, validArticles); setMessage(saved.error ? `本次访问已清理 ${staleCount} 条失效记录，但尚未保存到浏览器。` : `已清理 ${staleCount} 条失效记录。`); }}>清理失效记录{staleCount ? `（${staleCount}）` : ''}</button><button className="danger-text" onClick={() => { if (window.confirm('确定清空全部收藏、阅读状态、继续阅读位置及未完成清单吗？建议先导出备份。')) { const saved = learning.clear(), cleared = study?.end(); setUndo(null); setSelection(undefined); setMessage(saved.error || cleared?.error ? '本次访问的记录及清单已清空，但未能全部保存到浏览器。' : '学习记录已清空。'); update('page', ''); } }}>清空全部记录</button></div>{message && <p className="backup-message" aria-hidden="true">{message}</p>}</details>
  </>;
};

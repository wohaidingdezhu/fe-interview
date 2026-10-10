import { useQuestions, useSearchIndex } from './content';
import { questionPage, articleHref } from './library-utils';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import { LearningControls } from './LearningControls';
import { normalizeCategory } from './categories';
import type { Learning } from './useLearning';
export function QuestionList({ params, navigate, learning }: { params: URLSearchParams; navigate: Navigate; learning: Learning }) {
  const catalog = useQuestions(), query = params.get('q') || '', category = normalizeCategory(params.get('category') || ''), tag = params.get('tag') || '', progress = params.get('progress') || '';
  const search = useSearchIndex(query && !/^q[1-9]\d*$/i.test(query.trim()) ? query : '');
  const ids = progress ? new Set(catalog.questions.filter(q => { const e = learning.data.entries[`q:${q.number}`]; return progress === 'bookmarked' ? e?.bookmarked : (e?.status ?? 'unread') === progress; }).map(q => q.number)) : undefined;
  const result = questionPage(catalog.questions, { query, category, tag, ids, documents: search.documents, page: Number(params.get('page')) || 1, size: Number(params.get('size')) || 12 });
  const update = (key: string, value: string, replace = false) => { const next = new URLSearchParams(params); next.set('view', 'questions'); next.delete('page'); if (value) next.set(key, value); else next.delete(key); navigate(`?${next}`, replace); };
  const changePage = (page: number) => { const next = new URLSearchParams(params); next.set('page', String(page)); navigate(`?${next}`); };
  return <><div className="breadcrumb">前端资料库 <span>/</span> 全部题目</div><div className="list-heading"><div><span className="eyebrow">ONE QUESTION AT A TIME</span><h1>全部题目</h1><p className="description">按题查找、按主题学习。每一道题，都有直接抵达的入口。</p></div><span className="collection-count">{catalog.questions.length || '—'}<small>道题目</small></span></div>
    <section className="filters" aria-label="题目筛选"><label className="list-search">搜索题号或全文关键词<input type="search" aria-label="搜索题目" placeholder="例如 Q134、React 状态、闭包" value={query} onChange={event => update('q', event.target.value, true)} /></label><div className="filter-selects has-maintenance">
      <label>分类<select value={category} onChange={event => update('category', event.target.value)}><option value="">全部分类</option>{[...new Set(catalog.questions.map(q => q.category))].map(c => <option key={c}>{c}</option>)}</select></label>
      <label>标签<select value={tag} onChange={event => update('tag', event.target.value)}><option value="">全部标签</option>{[...new Set(catalog.questions.flatMap(q => q.tags))].map(t => <option key={t}>{t}</option>)}</select></label>
      <label>学习状态<select value={progress} onChange={event => update('progress', event.target.value)}><option value="">全部状态</option><option value="bookmarked">已收藏</option><option value="unread">未读</option><option value="read">已读</option><option value="review">待复习</option></select></label>
      <label>每页<select value={Number(params.get('size')) || 12} onChange={event => update('size', event.target.value)}>{[12,24,48].map(size => <option key={size} value={size}>{size} 道</option>)}</select></label>
    </div></section>
    {(catalog.error || search.error) && <p role="alert">{catalog.error || search.error}<button onClick={catalog.error ? catalog.retry : search.retry}>重试</button></p>}
    {learning.error && <p role="alert">{learning.error}</p>}
    <div className="list-summary"><span role="status">{catalog.loading || search.loading ? '正在检索题目…' : `共找到 ${result.total} 道题`}</span>{(query || category || tag || progress) && <button className="text-button" onClick={() => navigate('?view=questions')}>清除筛选 ×</button>}</div>
    {!search.loading && !catalog.loading && <div className="question-list">{result.items.map(q => <article className="question-row" key={q.number}><span className="question-number">Q{q.number}</span><div><small>{q.category}{q.status === 'draft' ? ' · 草稿预览' : ''}</small><h2><Link navigate={navigate} href={articleHref(q.articleId, `q${q.number}`)}>{q.title}<span aria-hidden="true"> →</span></Link></h2><LearningControls compact itemKey={`q:${q.number}`} learning={learning} /></div></article>)}</div>}
    {!result.total && !catalog.loading && !search.loading && !catalog.error && !search.error && <div className="empty-state"><h2>暂时没有匹配的题目</h2><p>试试更短的关键词，或清除分类和学习状态筛选。</p></div>}
    <nav className="list-pagination" aria-label="题目分页"><button disabled={result.page <= 1} onClick={() => changePage(result.page - 1)}>← 上一页</button><span>第 {result.page} / {result.pages} 页</span><button disabled={result.page >= result.pages} onClick={() => changePage(result.page + 1)}>下一页 →</button></nav>
  </>;
}

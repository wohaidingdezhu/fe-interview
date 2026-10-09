import { articles, resources, useSearchIndex } from './content';
import { filterItems, type ListItem } from './data-utils';
import { searchDocuments, searchHits } from './search-utils';

type Props = { params: URLSearchParams; navigate: (href: string, replace?: boolean) => void };
export function LibraryList({ params, navigate }: Props) {
  const isNotes = params.get('view') === 'notes';
  const items: ListItem[] = isNotes ? articles.map((item) => ({ ...item, type: item.kind, source: '我的笔记' })) : resources;
  const category = params.get('category') || '';
  const selectedTags = params.getAll('tag');
  const query = params.get('q') || '';
  const search = useSearchIndex(isNotes ? query : '');
  const matches = isNotes && query.trim() ? searchDocuments(search.documents || [], query) : undefined;
  const questionMatches = new Map<string, { title: string; href: string }>();
  if (isNotes && query.trim()) for (const hit of searchHits(search.documents || [], query)) {
    if (hit.anchor && !questionMatches.has(hit.id)) questionMatches.set(hit.id, { title: hit.questionTitle!, href: `?article=${encodeURIComponent(hit.id)}#${hit.anchor}` });
  }
  const type = params.get('type') || '';
  const maintenance = isNotes ? params.get('maintenance') || '' : '';
  const sort = params.get('sort') || 'newest';
  const pageSize = [6, 12, 24].includes(Number(params.get('size'))) ? Number(params.get('size')) : 6;
  const result = filterItems(matches ? items.filter((item) => matches.has(item.id)) : items, { query: isNotes ? '' : query, category, tags: selectedTags, type, maintenance, sort, page: Number(params.get('page')) || 1, pageSize });
  const categories = [...new Set(items.map((item) => item.category))];
  const types = [...new Set(items.map((item) => item.type))];
  const tags = [...new Set(items.flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b, 'zh-CN'));

  function update(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params);
    next.set('view', isNotes ? 'notes' : 'resources');
    next.delete('page');
    if (value) next.set(key, value); else next.delete(key);
    navigate(`?${next}`, replace);
  }
  function toggleTag(tag: string) {
    const next = new URLSearchParams(params);
    next.delete('tag'); next.delete('page');
    const selected = selectedTags.includes(tag) ? selectedTags.filter((item) => item !== tag) : [...selectedTags, tag];
    selected.forEach((item) => next.append('tag', item));
    navigate(`?${next}`);
  }
  const hasFilters = Boolean(query || category || type || maintenance || selectedTags.length);

  return <>
    <div className="breadcrumb">前端资料库 <span>/</span> <b>{isNotes ? '我的笔记' : '资料收藏'}</b></div>
    <div className="list-heading"><div><span className="eyebrow">{isNotes ? 'NOTES & IDEAS' : 'READ · LEARN · BUILD'}</span><h1>{isNotes ? '我的笔记' : '资料收藏'}</h1><p className="description">{isNotes ? '留下自己的理解，让零散的知识连成体系。' : '值得阅读的文章、文档与工具，在需要时更容易找到。'}</p></div><span className="collection-count">{items.length}<small>{isNotes ? '篇笔记' : '条资料'}</small></span></div>
    <section className="filters" aria-label="资料筛选">
      <label className="list-search"><span>关键词</span><input type="search" aria-label="检索当前列表" placeholder={isNotes ? '题号、标题、标签或正文关键词' : '标题、简介、来源或标签'} value={query} onChange={(event) => update('q', event.target.value, true)} /></label>
      <div className={`filter-selects ${isNotes ? 'has-maintenance' : ''}`}>
        <label>分类<select aria-label="按分类筛选" value={category} onChange={(event) => update('category', event.target.value)}><option value="">全部分类</option>{categories.map((value) => <option key={value}>{value}</option>)}{category && !categories.includes(category) && <option>{category}</option>}</select></label>
        <label>类型<select aria-label="按类型筛选" value={type} onChange={(event) => update('type', event.target.value)}><option value="">全部类型</option>{types.map((value) => <option key={value}>{value}</option>)}{type && !types.includes(type) && <option>{type}</option>}</select></label>
        <label>排序<select aria-label="列表排序" value={sort} onChange={(event) => update('sort', event.target.value)}><option value="newest">最近收录</option><option value="oldest">最早收录</option><option value="title">标题顺序</option></select></label>
        {isNotes && <label>维护状态<select aria-label="按维护状态筛选" value={maintenance} onChange={(event) => update('maintenance', event.target.value)}><option value="">全部状态</option><option value="incomplete">待补充</option><option value="ready">待审核</option><option value="draft">全部草稿</option><option value="published">已公开</option></select></label>}
      </div>
      <div className="tag-filter"><span>标签<small>多选时同时满足</small></span><div>{tags.map((tag) => <button key={tag} className={selectedTags.includes(tag) ? 'tag selected' : 'tag'} aria-pressed={selectedTags.includes(tag)} onClick={() => toggleTag(tag)}>{tag}</button>)}{selectedTags.filter((tag) => !tags.includes(tag)).map((tag) => <button key={tag} className="tag selected" onClick={() => toggleTag(tag)}>{tag} ×</button>)}</div></div>
    </section>
    <div className="list-summary"><span role="status">{search.loading ? '正在搜索正文…' : <>共找到 <strong>{result.total}</strong> {isNotes ? '篇笔记' : '条资料'}</>}</span>{hasFilters && <button className="text-button" onClick={() => navigate(`?view=${isNotes ? 'notes' : 'resources'}`)}>清除筛选 ×</button>}<label>每页<select aria-label="每页条数" value={pageSize} onChange={(event) => update('size', event.target.value)}>{[6,12,24].map((size) => <option key={size} value={size}>{size} 条</option>)}</select></label></div>
    {search.error && <p role="alert">{search.error}<button className="text-button" onClick={search.retry}>重试搜索</button></p>}
    <div className="resource-list">{result.items.map((item) => <article key={item.id} className="resource-card">
      <div className="resource-meta"><span className="pill">{item.type}</span>{item.status === 'published' && <span className="pill published-label">已公开</span>}{item.status === 'draft' && item.quality === 'complete' && <span className="pill review-label">待审核</span>}{item.status === 'draft' && item.quality === 'incomplete' && <span className="pill incomplete-label">待补充</span>}{item.status === 'draft' && item.quality === undefined && <span className="pill draft-label">草稿 · 仅本地预览</span>}<span>{item.category}</span><time dateTime={item.addedAt}>{item.addedAt}</time></div>
      <h2><a href={item.url || `?article=${item.id}`} target={item.url ? '_blank' : undefined} rel={item.url ? 'noopener noreferrer' : undefined} onClick={(event) => {
        if (!item.url && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate(`?article=${item.id}`); }
      }}>{item.title}<span aria-hidden="true">{item.url ? '↗' : '→'}</span></a></h2>
      <p>{item.description}</p>
      {(item.questionCount ?? 0) > 0 && <p className="resource-source">共 {item.questionCount} 题 · 已复核 {item.publishedQuestionCount} · 待处理 {(item.questionCount ?? 0) - (item.publishedQuestionCount ?? 0)}{(item.publishedQuestionCount ?? 0) > 0 && (item.publishedQuestionCount ?? 0) < (item.questionCount ?? 0) ? ' · 部分公开' : ''}</p>}
      {matches?.has(item.id) && <p className="search-snippet">{matches.get(item.id)}</p>}
      {questionMatches.has(item.id) && <a className="question-result-link" href={questionMatches.get(item.id)!.href} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(questionMatches.get(item.id)!.href); }}>阅读 {questionMatches.get(item.id)!.title} →</a>}
      <div className="resource-bottom"><span className="resource-source">{item.source}</span><div>{item.tags.map((tag) => <button className="tag" key={tag} aria-label={`筛选标签 ${tag}`} onClick={() => toggleTag(tag)}>{tag}</button>)}</div></div>
    </article>)}</div>
    {!search.loading && !search.error && !result.total && <div className="empty-state"><span aria-hidden="true">⌕</span><h2>没有找到匹配内容</h2><p>减少筛选条件，或换一个关键词再试。</p><button className="text-button" onClick={() => navigate(`?view=${isNotes ? 'notes' : 'resources'}`)}>查看全部{isNotes ? '笔记' : '资料'} →</button></div>}
    <nav className="list-pagination" aria-label="列表分页"><button disabled={result.page === 1} onClick={() => update('page', String(result.page - 1))}>← 上一页</button><span>第 {result.page} / {result.pages} 页</span><button disabled={result.page === result.pages} onClick={() => update('page', String(result.page + 1))}>下一页 →</button></nav>
  </>;
}

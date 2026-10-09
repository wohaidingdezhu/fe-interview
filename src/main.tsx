import { StrictMode, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { articles, resources, searchArticles, loadArticle, useSearchIndex } from './content';
import { TableOfContents } from './TableOfContents';
import type { Heading } from './ArticleContent';
import { filterItems } from './data-utils';
import { LibraryList } from './LibraryList';
import { ReaderBoundary } from './ReaderBoundary';
import './style.css';
const ArticleContent = lazy(() => import('./ArticleContent'));
const CodePlayground = lazy(() => import('./CodePlayground').then((module) => ({ default: module.CodePlayground })));

function articleHref(id: string) { return `?article=${encodeURIComponent(id)}`; }
function modified(event: React.MouseEvent) { return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey; }
function App() {
  const [location, setLocation] = useState(window.location.search + window.location.hash);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [toc, setToc] = useState<Heading[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState<{ id: string; content?: string; error?: string }>({ id: '' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const search = useSearchIndex(query);
  const params = new URLSearchParams(location.split('#')[0]);
  const id = params.get('article');
  const isNotes = Boolean(id) || params.get('view') === 'notes';
  const article = articles.find((item) => item.id === id);
  const currentIndex = articles.findIndex((item) => item.id === id);
  const relatedArticles = article?.related.map((relatedId) => articles.find((item) => item.id === relatedId)).filter((item): item is (typeof articles)[number] => Boolean(item)) ?? [];
  const collection = isNotes ? articles : resources;
  const categories = [...new Set(collection.map((item) => item.category))];
  const category = article?.category || params.get('category') || '';
  const noteResults = query.trim() ? searchArticles(query, search.documents) : [];
  const resourceResults = query.trim() ? filterItems(resources, { query, category: '', tags: [], type: '', sort: 'newest', page: 1, pageSize: 5 }) : { items: [], total: 0 };

  function navigate(href: string, replace = false) {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', href);
    setLocation(window.location.search + window.location.hash); setQuery(''); setMenuOpen(false);
    if (!replace && !window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.location.hash) {
      try { document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView(); } catch { /* invalid anchor */ }
    }
  }
  useEffect(() => {
    const onPopState = () => { setLocation(window.location.search + window.location.hash); setQuery(''); setMenuOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === 'Escape') { setQuery(''); setMenuOpen(false); }
    };
    window.addEventListener('popstate', onPopState); window.addEventListener('hashchange', onPopState); window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPopState); window.removeEventListener('hashchange', onPopState); window.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => {
    document.title = `${id ? article?.title || '笔记未找到' : isNotes ? '我的笔记' : '资料收藏'} · 前端资料库`;

  }, [article, id, isNotes]);
  useEffect(() => {
    setToc([]);
    if (!article) return;
    let current = true;
    setBody({ id: article.id });
    loadArticle(article).then((content) => { if (current) setBody({ id: article.id, content }); }, (error: Error) => { if (current) setBody({ id: article.id, error: error.message }); });
    return () => { current = false; };
  }, [article?.bodyPath, loadAttempt]);
  const link = (href: string, title: string, className?: string) => <a href={href} className={className} onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate(href); }}>{title}</a>;

  return <>
    <a className="skip-link" href="#main">跳到正文</a>
    <header className="header">
      <a className="brand" href="?view=resources" onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate('?view=resources'); }}><span className="brand-icon" aria-hidden="true">&lt;/&gt;</span><span>前端资料库<small>FE LIBRARY</small></span></a>
      <div className="search-wrap"><span className="search-icon" aria-hidden="true">⌕</span><input ref={searchRef} type="search" aria-label="搜索全部资料和笔记" placeholder="搜索题号（如 Q134）、关键词、资料…" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd>
        {query.trim() && <div className="search-results" aria-label="搜索结果"><div className="result-count" role="status">{resourceResults.total} 条资料 · {search.loading ? '正在搜索笔记…' : `${noteResults.length} 个知识结果`}</div>
          {resourceResults.items.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"><small>资料 · {item.source}</small><strong>{item.title} ↗</strong><span>{item.description}</span></a>)}
          {noteResults.slice(0, 6).map((item) => <a key={item.href} href={item.href} onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate(item.href); }}><small>{item.questionNumber ? '题目' : '笔记'} · {item.category}</small><strong>{item.title}</strong><span>{item.snippet}</span></a>)}
          {search.error && <p role="alert">{search.error}<button onClick={search.retry}>重试搜索</button></p>}
          {!search.loading && !search.error && !resourceResults.total && !noteResults.length && <p>没有找到相关内容，试试“React”或“性能”。</p>}
          <div className="search-all">{link(`?view=resources&q=${encodeURIComponent(query)}`, '查看全部资料结果 →')}{link(`?view=notes&q=${encodeURIComponent(query)}`, '查看笔记列表 →')}</div>
        </div>}
      </div><span className="header-note"><i />收藏资料，沉淀理解</span><button className="menu-button" aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen} aria-controls="sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '关闭' : '目录'}</button>
    </header>
    {menuOpen && <button className="menu-overlay" aria-label="关闭导航遮罩" onClick={() => setMenuOpen(false)} />}
    <aside id="sidebar" className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="资料库导航">
      <div className="sidebar-label">LIBRARY <span>{resources.length + articles.length} 条内容</span></div>
      <nav className="section-nav" aria-label="资料库入口">{link('?view=resources', '↗ 资料收藏', !isNotes ? 'section-link active' : 'section-link')}{link('?view=notes', '▤ 我的笔记', isNotes ? 'section-link active' : 'section-link')}</nav>
      <div className="sidebar-label category-label">按分类浏览</div>
      <nav aria-label="分类导航">{link(`?view=${isNotes ? 'notes' : 'resources'}`, '全部分类', !category ? 'nav-link active' : 'nav-link')}{categories.map((value) => <div className="category-row" key={value}>{link(`?view=${isNotes ? 'notes' : 'resources'}&category=${encodeURIComponent(value)}`, value, category === value ? 'nav-link active' : 'nav-link')}<span>{collection.filter((item) => item.category === value).length}</span></div>)}</nav>
      <div className="sidebar-footer"><span className="footer-mark">↗</span><p>收藏有价值的资料<small>文章 · 文档 · 视频 · 工具 · 开源项目</small></p></div>
    </aside>
    <div className={`workspace ${!id ? 'list-workspace' : ''}`}><main id="main" className="main" tabIndex={-1}>
      {!id ? <LibraryList params={params} navigate={navigate} /> : article ? <>
        <div className="breadcrumb">{link('?view=notes', '我的笔记')}<span>/</span>{article.category}<span>/</span><b>{article.title}</b></div>
        <div className="article-meta"><span className="pill">{article.kind}</span>{article.status === 'draft' && <span className="pill draft-label">草稿 · 仅本地预览</span>}{article.questionCount > 0 && <span>共 {article.questionCount} 题 · 已复核 {article.publishedQuestionCount} · 待处理 {article.questionCount - article.publishedQuestionCount}</span>}<span>约 {Math.max(1, Math.ceil(article.contentLength / 450))} 分钟阅读</span><time dateTime={article.updatedAt ?? article.addedAt}>{article.updatedAt ? `更新 ${article.updatedAt}` : `收录 ${article.addedAt}`}</time>{article.reviewedAt && <time dateTime={article.reviewedAt}>审核 {article.reviewedAt}</time>}</div><h1>{article.title}</h1><p className="description">{article.description}</p><div className="article-tags">{article.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        {article.quality === 'incomplete' && <p className="quality-notice" role="note">{article.questionCount > 0 ? '这篇专题尚未完成逐题审核；已审核题目可以单独上线，其余内容继续保留为草稿。' : '这篇知识文章仍待补充和审核，暂不公开发布。'}</p>}
        {article.category === 'JavaScript' && <ReaderBoundary key={`playground-${article.id}`}><Suspense fallback={<p role="status">正在加载代码运行工具…</p>}><CodePlayground /></Suspense></ReaderBoundary>}
        {body.id === article.id && body.error ? <p role="alert">{body.error}<button className="text-button" onClick={() => setLoadAttempt((value) => value + 1)}>重新加载正文</button></p>
          : body.id === article.id && body.content !== undefined ? <ReaderBoundary key={article.id}><Suspense fallback={<p role="status">正在加载阅读界面…</p>}><ArticleContent key={article.id} hash={location.includes('#') ? location.slice(location.indexOf('#')) : ''} content={body.content} navigate={navigate} onHeadings={setToc} /></Suspense></ReaderBoundary>
          : <p role="status">正在加载正文…</p>}
        {relatedArticles.length > 0 && <section className="related-articles" aria-labelledby="related-title"><div className="related-heading"><span>KEEP EXPLORING</span><h2 id="related-title">继续阅读</h2></div><div className="related-grid">{relatedArticles.map((related) => <a key={related.id} href={articleHref(related.id)} onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate(articleHref(related.id)); }}><small>{related.category}</small><strong>{related.title}</strong><p>{related.description}</p><span aria-hidden="true">↗</span></a>)}</div></section>}
        <div className="article-end"><span />把读过的内容，变成自己的理解。<span /></div><nav className="pagination" aria-label="上一篇和下一篇">{currentIndex > 0 ? <div><small>← 上一篇</small>{link(articleHref(articles[currentIndex - 1].id), articles[currentIndex - 1].title)}</div> : <div />}{currentIndex < articles.length - 1 && <div><small>下一篇 →</small>{link(articleHref(articles[currentIndex + 1].id), articles[currentIndex + 1].title)}</div>}</nav>
      </> : <div className="not-found"><span className="pill">404</span><h1>这篇笔记还不存在</h1><p>链接可能有误，或笔记已经移动。</p>{link('?view=notes', '返回我的笔记 →')}</div>}
      <footer className="page-footer">前端资料库 <span>收藏资料 · 沉淀笔记</span></footer>
    </main>{id && article && <TableOfContents key={id} headings={toc} />}</div>
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

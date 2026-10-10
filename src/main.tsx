import { StrictMode, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { articles, resources, searchArticles, loadArticle, useSearchIndex } from './content';
import { TableOfContents } from './TableOfContents';
import type { Heading } from './ArticleContent';
import { filterItems } from './data-utils';
import { LibraryList } from './LibraryList';
import { ReaderBoundary } from './ReaderBoundary';
import { normalizeCategory } from './categories';
import './style.css';
import './discovery.css';
import siteConfig from '../site.config.json';
import { ShareButton } from './ShareButton';
import { HomePage } from './HomePage';
import { QuestionList } from './QuestionList';
import { LearningPage } from './LearningPage';
import { LearningControls } from './LearningControls';
import { useLearning } from './useLearning';
import { articleIdFromLocation, libraryCounts } from './library-utils';
const ArticleContent = lazy(() => import('./ArticleContent'));
const CodePlayground = lazy(() => import('./CodePlayground').then((module) => ({ default: module.CodePlayground })));

function articleHref(id: string) { return `?article=${encodeURIComponent(id)}`; }
function modified(event: React.MouseEvent) { return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey; }
// 固定站点根目录，避免静态子路径或 history 导航改变资源相对地址。
const baseElement = document.querySelector<HTMLBaseElement>('base') ?? document.createElement('base');
baseElement.href = new URL(window.location.pathname.replace(/articles\/[a-z0-9-]+\/(?:index\.html)?$/, ''), window.location.origin).href;
if (!baseElement.parentNode) document.head.prepend(baseElement);
function App() {
  const [location, setLocation] = useState(window.location.href);
  const learning = useLearning();
  const [activeHeading, setActiveHeading] = useState<Heading>();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [toc, setToc] = useState<Heading[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [body, setBody] = useState<{ id: string; content?: string; error?: string }>({ id: '' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const search = useSearchIndex(query);
  const route = new URL(location);
  const params = route.searchParams;
  const id = articleIdFromLocation(route.pathname, route.search);
  const view = id ? 'article' : params.get('view') || 'home';
  const counts = libraryCounts(articles, resources);
  const isNotes = Boolean(id) || ['notes','questions','learning','home'].includes(view);
  const article = articles.find((item) => item.id === id);
  const currentIndex = articles.findIndex((item) => item.id === id);
  const relatedArticles = article?.related.map((relatedId) => articles.find((item) => item.id === relatedId)).filter((item): item is (typeof articles)[number] => Boolean(item)) ?? [];
  const collection = isNotes ? (view === 'home' || view === 'questions' ? articles.filter(a => a.questionCount > 0) : articles) : resources;
  const categories = [...new Set(collection.map((item) => item.category))];
  const category = article?.category || normalizeCategory(params.get('category') || '');
  const noteResults = query.trim() ? searchArticles(query, search.documents) : [];
  const resourceResults = query.trim() ? filterItems(resources, { query, category: '', tags: [], type: '', sort: 'newest', page: 1, pageSize: 5 }) : { items: [], total: 0 };

  const navigate = useCallback((href: string, replace = false) => {
    const target = new URL(href, document.baseURI);
    const previous = new URL(window.location.href);
    const changesPage = articleIdFromLocation(previous.pathname, previous.search) !== articleIdFromLocation(target.pathname, target.search)
      || (previous.searchParams.get('view') || 'home') !== (target.searchParams.get('view') || 'home');
    window.history[replace ? 'replaceState' : 'pushState']({}, '', target);
    setLocation(window.location.href); setQuery(''); setMenuOpen(false);
    if (!replace && !window.location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (changesPage) setTimeout(() => document.getElementById('main')?.focus({ preventScroll: true }), 0);
    }
    if (window.location.hash) {
      try { document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView(); } catch { /* invalid anchor */ }
    }
  }, []);
  useEffect(() => {
    const onPopState = () => { setLocation(window.location.href); setQuery(''); setMenuOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === 'Escape') {
        if (searchWrapRef.current?.contains(document.activeElement)) searchRef.current?.focus();
        if (document.getElementById('sidebar')?.contains(document.activeElement)) menuButtonRef.current?.focus();
        setQuery(''); setMenuOpen(false);
      }
    };
    window.addEventListener('popstate', onPopState); window.addEventListener('hashchange', onPopState); window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPopState); window.removeEventListener('hashchange', onPopState); window.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => {
    const title = id ? article?.title || '笔记未找到' : ({ home: '首页', questions: '全部题目', learning: '我的学习', notes: '我的笔记', resources: '外部资料' }[view] || '首页');
    document.title = `${title} · 前端资料库`;
    const description = article?.description || '按题查找、按主题学习，收藏值得反复阅读的前端知识。';
    for (const selector of ['meta[name=description]', 'meta[property="og:description"]']) document.querySelector(selector)?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    const canonical = new URL(article ? `articles/${article.id}/` : './', siteConfig.url).href;
    document.querySelector('link[rel=canonical]')?.setAttribute('href', canonical);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
    document.querySelector('meta[property="og:type"]')?.setAttribute('content', article ? 'article' : 'website');
    const structured = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (article) {
      const node = structured ?? document.createElement('script'); node.type = 'application/ld+json';
      node.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.description, url: canonical,
        datePublished: article.addedAt, dateModified: article.updatedAt ?? article.reviewedAt ?? article.addedAt, inLanguage: 'zh-CN' });
      if (!node.parentNode) document.head.append(node);
    } else structured?.remove();

  }, [article, id, view]);
  useEffect(() => {
    setToc([]); setActiveHeading(undefined);
    if (!article) return;
    let current = true;
    setBody({ id: article.id });
    loadArticle(article).then((content) => { if (current) setBody({ id: article.id, content }); }, (error: Error) => { if (current) setBody({ id: article.id, error: error.message }); });
    return () => { current = false; };
  }, [article?.bodyPath, loadAttempt]);
  useEffect(() => {
    if (!article || body.id !== article.id || !body.content) return;
    const timer = setTimeout(() => learning.remember({ articleId: article.id, anchor: activeHeading?.id ?? '', title: activeHeading?.title ?? article.title }), 500);
    return () => clearTimeout(timer);
  }, [article?.id, body.id, body.content, activeHeading?.id, learning.remember]);
  const link = (href: string, title: string, className?: string) => <a href={href} className={className} onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate(href); }}>{title}</a>;

  return <>
    <a className="skip-link" href={`${route.pathname}${route.search}#main`}>跳到正文</a>
    <header className="header">
      <a className="brand" href="?view=home" onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate('?view=home'); }}><span className="brand-icon" aria-hidden="true">&lt;/&gt;</span><span>前端资料库<small>FE LIBRARY</small></span></a>
      <div className="search-wrap" ref={searchWrapRef} onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        const links = [...searchWrapRef.current?.querySelectorAll<HTMLAnchorElement>('.search-results a') ?? []];
        if (!links.length) return;
        const index = links.indexOf(document.activeElement as HTMLAnchorElement);
        if (event.key === 'ArrowDown') { event.preventDefault(); links[Math.min(index + 1, links.length - 1)]?.focus(); }
        if (event.key === 'ArrowUp') { event.preventDefault(); (index <= 0 ? searchRef.current : links[index - 1])?.focus(); }
        if (event.key === 'Enter' && event.target === searchRef.current) { event.preventDefault(); links[0]?.click(); }
      }}><span className="search-icon" aria-hidden="true">⌕</span><input ref={searchRef} type="search" aria-label="搜索全部资料和笔记" aria-describedby="search-help" placeholder="搜索题号（如 Q134）、关键词、资料…" value={query} onChange={(event) => setQuery(event.target.value)} /><span id="search-help" className="sr-only">输入关键词后，用上下方向键选择结果，回车打开，Escape 关闭。</span><kbd>⌘ K</kbd>
        {query.trim() && <div className="search-results" aria-label="搜索结果"><div className="result-count" role="status">{resourceResults.total} 条资料 · {search.loading ? '正在搜索笔记…' : `${noteResults.length} 个知识结果`}</div>
          {resourceResults.items.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"><small>资料 · {item.source}</small><strong>{item.title} ↗</strong><span>{item.description}</span></a>)}
          {noteResults.slice(0, 6).map((item) => <a key={item.href} href={item.href} onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate(item.href); }}><small>{item.questionNumber ? '题目' : '笔记'} · {item.category}</small><strong>{item.title}</strong><span>{item.snippet}</span></a>)}
          {search.error && <p role="alert">{search.error}<button onClick={search.retry}>重试搜索</button></p>}
          {!search.loading && !search.error && !resourceResults.total && !noteResults.length && <p>没有找到相关内容，试试“React”或“性能”。</p>}
          <div className="search-all">{link(`?view=resources&q=${encodeURIComponent(query)}`, '查看外部资料结果 →')}{link(`?view=notes&q=${encodeURIComponent(query)}`, '查看笔记列表 →')}{link(`?view=questions&q=${encodeURIComponent(query)}`, '查看全部题目结果 →')}</div>
        </div>}
      </div><span className="header-note"><i />整理知识，沉淀理解</span><button ref={menuButtonRef} className="menu-button" aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen} aria-controls="sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '关闭' : '导航'}</button>
    </header>
    {menuOpen && <button className="menu-overlay" aria-label="关闭导航遮罩" onClick={() => setMenuOpen(false)} />}
    <aside id="sidebar" className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="资料库导航">
      <div className="sidebar-label">LIBRARY <span>{counts.questions} 题 · {counts.notes} 笔记</span></div>
      <nav className="section-nav" aria-label="资料库入口">{link('?view=home', '首页', view === 'home' ? 'section-link active' : 'section-link')}{link('?view=questions', '全部题目', view === 'questions' ? 'section-link active' : 'section-link')}{link('?view=learning', '我的学习', view === 'learning' ? 'section-link active' : 'section-link')}{link('?view=notes', '▤ 我的笔记', view === 'notes' || view === 'article' ? 'section-link active' : 'section-link')}</nav>
      <nav className="section-nav external-nav" aria-label="扩展内容入口">{link('?view=resources', '↗ 外部资料', view === 'resources' ? 'section-link active' : 'section-link')}</nav>
      <div className="sidebar-label category-label">按分类浏览</div>
      <nav aria-label="分类导航">{link(`?view=${view === 'questions' || view === 'home' ? 'questions' : isNotes ? 'notes' : 'resources'}`, '全部分类', !category ? 'nav-link active' : 'nav-link')}{categories.map((value) => <div className="category-row" key={value}>{link(`?view=${view === 'questions' || view === 'home' ? 'questions' : isNotes ? 'notes' : 'resources'}&category=${encodeURIComponent(value)}`, value, category === value ? 'nav-link active' : 'nav-link')}<span>{view === 'home' || view === 'questions' ? articles.filter(a => a.category === value).reduce((sum,a) => sum+a.publishedQuestionCount,0) : collection.filter((item) => item.category === value).length}</span></div>)}</nav>
      <div className="sidebar-footer"><span className="footer-mark">↗</span><p>延伸到可靠来源<small>文章 · 文档 · 视频 · 工具 · 开源项目</small></p></div>
    </aside>
    <div className={`workspace ${!id ? 'list-workspace' : ''}`}><main id="main" className="main" tabIndex={-1}>
      {!id ? view === 'questions' ? <QuestionList params={params} navigate={navigate} learning={learning} /> : view === 'learning' ? <LearningPage learning={learning} navigate={navigate} /> : ['notes','resources'].includes(view) ? <LibraryList key={view} params={params} navigate={navigate} /> : <HomePage navigate={navigate} learning={learning} /> : article ? <>
        <div className="breadcrumb">{link('?view=notes', '我的笔记')}<span>/</span>{article.category}<span>/</span><b>{article.title}</b></div>
        <div className="article-meta"><span className="pill">{article.kind}</span>{article.status === 'draft' && <span className="pill draft-label">草稿 · 仅本地预览</span>}{article.questionCount > 0 && <span>共 {article.questionCount} 题 · 已复核 {article.publishedQuestionCount} · 待处理 {article.questionCount - article.publishedQuestionCount}</span>}<span>约 {Math.max(1, Math.ceil(article.contentLength / 450))} 分钟阅读</span><time dateTime={article.updatedAt ?? article.addedAt}>{article.updatedAt ? `更新 ${article.updatedAt}` : `收录 ${article.addedAt}`}</time>{article.reviewedAt && <time dateTime={article.reviewedAt}>审核 {article.reviewedAt}</time>}</div><h1>{article.title}</h1><p className="description">{article.description}</p><div className="article-tags">{article.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        <ShareButton articleId={article.id} anchor={activeHeading?.id} />
        {!article.questionCount && <LearningControls itemKey={`a:${article.id}`} learning={learning} />}
        {learning.error && <p role="status">{learning.error}</p>}
        {article.quality === 'incomplete' && <p className="quality-notice" role="note">{article.questionCount > 0 ? '这篇专题尚未完成逐题审核；已审核题目可以单独上线，其余内容继续保留为草稿。' : '这篇知识文章仍待补充和审核，暂不公开发布。'}</p>}
        {article.category === 'JavaScript' && <ReaderBoundary key={`playground-${article.id}`}><Suspense fallback={<p role="status">正在加载代码运行工具…</p>}><CodePlayground /></Suspense></ReaderBoundary>}
        {body.id === article.id && body.error ? <p role="alert">{body.error}<button className="text-button" onClick={() => setLoadAttempt((value) => value + 1)}>重新加载正文</button></p>
          : body.id === article.id && body.content !== undefined ? <ReaderBoundary key={article.id}><Suspense fallback={<p role="status">正在加载阅读界面…</p>}><ArticleContent articleId={article.id} key={article.id} hash={location.includes('#') ? location.slice(location.indexOf('#')) : ''} content={body.content} navigate={navigate} onHeadings={setToc} /></Suspense></ReaderBoundary>
          : <p role="status">正在加载正文…</p>}
        {relatedArticles.length > 0 && <section className="related-articles" aria-labelledby="related-title"><div className="related-heading"><span>KEEP EXPLORING</span><h2 id="related-title">继续阅读</h2></div><div className="related-grid">{relatedArticles.map((related) => <a key={related.id} href={articleHref(related.id)} onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate(articleHref(related.id)); }}><small>{related.category}</small><strong>{related.title}</strong><p>{related.description}</p><span aria-hidden="true">↗</span></a>)}</div></section>}
        <div className="article-end"><span />把读过的内容，变成自己的理解。<span /></div><nav className="pagination" aria-label="上一篇和下一篇">{currentIndex > 0 ? <div><small>← 上一篇</small>{link(articleHref(articles[currentIndex - 1].id), articles[currentIndex - 1].title)}</div> : <div />}{currentIndex < articles.length - 1 && <div><small>下一篇 →</small>{link(articleHref(articles[currentIndex + 1].id), articles[currentIndex + 1].title)}</div>}</nav>
      </> : <div className="not-found"><span className="pill">404</span><h1>这篇笔记还不存在</h1><p>链接可能有误，或笔记已经移动。</p>{link('?view=notes', '返回我的笔记 →')}</div>}
      <footer className="page-footer">前端资料库 <span>整理知识 · 沉淀理解</span></footer>
    </main>{id && article && <TableOfContents key={id} articleId={id} hash={route.hash} headings={toc} navigate={navigate} onActive={setActiveHeading} learning={learning} />}</div>
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

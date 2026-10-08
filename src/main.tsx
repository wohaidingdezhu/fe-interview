import { StrictMode, useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';
import { createRoot } from 'react-dom/client';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { articles, resources, searchArticles } from './content';
import { filterItems } from './data-utils';
import { LibraryList } from './LibraryList';
import { CodePlayground } from './CodePlayground';
import './style.css';

function articleHref(id: string) { return `?article=${encodeURIComponent(id)}`; }
function modified(event: React.MouseEvent) { return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey; }
function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const ref = useRef<HTMLPreElement>(null);
  const [status, setStatus] = useState('复制代码');
  return <div className="code-block"><button className="copy-button" onClick={async () => {
    try { await navigator.clipboard.writeText(ref.current?.textContent || ''); setStatus('已复制'); }
    catch { setStatus('复制失败，请手动选择'); }
  }} aria-live="polite">{status}</button><pre {...props} ref={ref}>{children}</pre></div>;
}
function App() {
  const [location, setLocation] = useState(window.location.search);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [toc, setToc] = useState<{ id: string; title: string; level: number }[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const params = new URLSearchParams(location);
  const id = params.get('article');
  const isNotes = Boolean(id) || params.get('view') === 'notes';
  const article = articles.find((item) => item.id === id);
  const currentIndex = articles.findIndex((item) => item.id === id);
  const collection = isNotes ? articles : resources;
  const categories = [...new Set(collection.map((item) => item.category))];
  const category = article?.category || params.get('category') || '';
  const noteResults = query.trim() ? searchArticles(query) : [];
  const resourceResults = query.trim() ? filterItems(resources, { query, category: '', tags: [], type: '', sort: 'newest', page: 1, pageSize: 5 }) : { items: [], total: 0 };

  function navigate(href: string, replace = false) {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', href);
    setLocation(window.location.search); setQuery(''); setMenuOpen(false);
    if (!replace) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  useEffect(() => {
    const onPopState = () => { setLocation(window.location.search); setQuery(''); setMenuOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === 'Escape') { setQuery(''); setMenuOpen(false); }
    };
    window.addEventListener('popstate', onPopState); window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPopState); window.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => {
    document.title = `${id ? article?.title || '笔记未找到' : isNotes ? '我的笔记' : '资料收藏'} · 前端资料库`;
    setToc(Array.from(bodyRef.current?.querySelectorAll('h2, h3') || []).map((heading) => ({ id: heading.id, title: heading.textContent || '', level: Number(heading.tagName.slice(1)) })));
  }, [article, id, isNotes]);
  const link = (href: string, title: string, className?: string) => <a href={href} className={className} onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate(href); }}>{title}</a>;

  return <>
    <a className="skip-link" href="#main">跳到正文</a>
    <header className="header">
      <a className="brand" href="?view=resources" onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate('?view=resources'); }}><span className="brand-icon" aria-hidden="true">&lt;/&gt;</span><span>前端资料库<small>FE LIBRARY</small></span></a>
      <div className="search-wrap"><span className="search-icon" aria-hidden="true">⌕</span><input ref={searchRef} type="search" aria-label="搜索全部资料和笔记" placeholder="搜索资料、知识点、笔记…" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd>
        {query.trim() && <div className="search-results" aria-label="搜索结果"><div className="result-count" role="status">{resourceResults.total} 条资料 · {noteResults.length} 篇笔记</div>
          {resourceResults.items.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"><small>资料 · {item.source}</small><strong>{item.title} ↗</strong><span>{item.description}</span></a>)}
          {noteResults.slice(0, 3).map((item) => <a key={item.id} href={articleHref(item.id)} onClick={(event) => { if (modified(event)) return; event.preventDefault(); navigate(articleHref(item.id)); }}><small>笔记 · {item.category}</small><strong>{item.title}</strong><span>{item.description}</span></a>)}
          {!resourceResults.total && !noteResults.length && <p>没有找到相关内容，试试“React”或“性能”。</p>}
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
        <div className="article-meta"><span className="pill">{article.kind}</span><span>约 {Math.max(1, Math.ceil(article.content.length / 450))} 分钟阅读</span><time dateTime={article.addedAt}>{article.addedAt}</time></div><h1>{article.title}</h1><p className="description">{article.description}</p><div className="article-tags">{article.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        {article.category === 'JavaScript' && <CodePlayground />}
        <div className="article-body" ref={bodyRef} key={article.id}><Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeHighlight]} components={{
          pre: ({ node: _node, ...props }) => <CodeBlock {...props} />,
          a: ({ node: _node, href, children, ...props }) => <a {...props} href={href} onClick={(event) => { if (href?.startsWith('?article=') && !modified(event)) { event.preventDefault(); navigate(href); } }}>{children}</a>,
        }}>{article.content}</Markdown></div>
        <div className="article-end"><span />把读过的内容，变成自己的理解。<span /></div><nav className="pagination" aria-label="上一篇和下一篇">{currentIndex > 0 ? <div><small>← 上一篇</small>{link(articleHref(articles[currentIndex - 1].id), articles[currentIndex - 1].title)}</div> : <div />}{currentIndex < articles.length - 1 && <div><small>下一篇 →</small>{link(articleHref(articles[currentIndex + 1].id), articles[currentIndex + 1].title)}</div>}</nav>
      </> : <div className="not-found"><span className="pill">404</span><h1>这篇笔记还不存在</h1><p>链接可能有误，或笔记已经移动。</p>{link('?view=notes', '返回我的笔记 →')}</div>}
      <footer className="page-footer">前端资料库 <span>收藏资料 · 沉淀笔记</span></footer>
    </main>{id && <aside className="toc" aria-label="本页目录"><span className="toc-label">本页内容</span>{toc.map((heading) => <a key={heading.id} className={heading.level === 3 ? 'toc-sub' : ''} href={`#${heading.id}`}>{heading.title}</a>)}<div className="toc-tip"><span>阅读建议</span><p>记录来源，也记录自己的理解。</p></div></aside>}</div>
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

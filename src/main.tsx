import { StudySaveRecovery } from './StudySaveRecovery';
import { StrictMode, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { articles, searchArticles, loadArticle, useQuestions, useSearchIndex } from './content';
import { TableOfContents } from './TableOfContents';
import type { Heading } from './ArticleContent';
import { LibraryList } from './LibraryList';
import { ReaderBoundary } from './ReaderBoundary';
import { LoadRecovery } from './LoadRecovery';
import { normalizeCategory } from './categories';
import './style.css';
import './discovery.css';
import siteConfig from '../site.config.json';
import { ArticleHeader } from './ArticleHeader';
import { HomePage } from './HomePage';
import { QuestionList } from './QuestionList';
import { LearningPage } from './LearningPage';
import { LearningPath } from './LearningPath';
import { findLearningPath } from './learning-paths';
import { LearningControls } from './LearningControls';
import { useLearning } from './useLearning';
import { useStudySession } from './useStudySession';
import { createStudySession, studyHref, shuffleStudyTargets, studyQuestion, skipToContentHref } from './study-session';
import { StudySessionBar } from './StudySessionBar';
import type { LearningTarget } from './learning-view';
import { articleHref, articleIdFromLocation, exactQuestionNumber, libraryCounts, publicView } from './library-utils';
import { NavigationLink as Link } from './NavigationLink';
import { navigationListReturn, readListReturn } from './list-return';
const ArticleContent = lazy(() => import('./ArticleContent'));
const CodePlayground = lazy(() => import('./CodePlayground').then((module) => ({ default: module.CodePlayground })));

// 固定站点根目录，避免静态子路径或 history 导航改变资源相对地址。
const baseElement = document.querySelector<HTMLBaseElement>('base') ?? document.createElement('base');
baseElement.href = new URL(window.location.pathname.replace(/articles\/[a-z0-9-]+\/(?:index\.html)?$/, ''), window.location.origin).href;
if (!baseElement.parentNode) document.head.prepend(baseElement);
const App = () => {
  const [location, setLocation] = useState(window.location.href);
  const learning = useLearning();
  const study = useStudySession();
  const [activeHeading, setActiveHeading] = useState<Heading>();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toc, setToc] = useState<Heading[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const studyDirectoryRef = useRef<HTMLDialogElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const retryBodyRef = useRef<HTMLButtonElement>(null);
  const listFocus = useRef<{ href: string; entry: string; previousFocus: Element | null } | undefined>(undefined);
  const [body, setBody] = useState<{ id: string; content?: string; error?: string; retrying?: boolean }>({ id: '' });
  const [rendered, setRendered] = useState<{ body: typeof body; question: string; studyMode: boolean }>();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const searchedNumber = exactQuestionNumber(query);
  const questionSearch = useQuestions(searchedNumber !== undefined);
  const fullTextSearch = useSearchIndex(searchedNumber === undefined ? query : '');
  const search = searchedNumber === undefined ? fullTextSearch : questionSearch;
  const route = new URL(location);
  const params = route.searchParams;
  const id = articleIdFromLocation(route.pathname, route.search);
  const inStudy = Boolean(id && params.get('study') === '1');
  const question = inStudy ? studyQuestion(route) : '';
  const view = id ? 'article' : publicView(params.get('view'));
  const path = view === 'learning' ? findLearningPath(params.get('path')) : undefined;
  const counts = libraryCounts(articles, []);
  const article = articles.find((item) => item.id === id);
  const siblings = articles.filter(item => (item.section === 'resources') === (article?.section === 'resources'));
  const currentIndex = siblings.findIndex((item) => item.id === id);
  const relatedArticles = article?.related.map((relatedId) => articles.find((item) => item.id === relatedId)).filter((item): item is (typeof articles)[number] => Boolean(item)) ?? [];
  const resourceSection = view === 'resources' || article?.section === 'resources';
  const categoryView = resourceSection ? 'resources' : view === 'questions' || view === 'home' ? 'questions' : 'notes';
  const collection = articles.filter(item => categoryView === 'resources' ? item.section === 'resources' : categoryView === 'questions' && view !== 'home' ? item.questionCount > 0 : item.section !== 'resources');
  const categories = [...new Set(collection.map((item) => item.category))];
  const category = article?.category || normalizeCategory(params.get('category') || '');
  const matchingQuestion = questionSearch.questions.find(item => item.number === searchedNumber);
  const matchingTopic = matchingQuestion && articles.find(item => item.id === matchingQuestion.articleId);
  const exactResult = matchingQuestion && matchingTopic ? [{
    category: matchingTopic.category, section: matchingTopic.section, questionNumber: matchingQuestion.number,
    title: `Q${matchingQuestion.number}｜${matchingQuestion.title}`,
    href: articleHref(matchingTopic.id, `q${matchingQuestion.number}`), snippet: matchingTopic.title,
  }] : [];
  const searchResults = searchedNumber === undefined && query.trim()
    ? searchArticles(query, fullTextSearch.documents)
    : exactResult;
  const focusedHeading = question ? toc.find(heading => heading.id === question) : undefined;
  const onReaderReady = useCallback((ready: boolean) => {
    setRendered(ready ? { body, question, studyMode: inStudy } : undefined);
  }, [body, question, inStudy]);
  const onReaderError = useCallback(() => setRendered(undefined), []);
  const readingReady = body.id === id && body.content !== undefined && rendered?.body === body
    && rendered.question === question && rendered.studyMode === inStudy
    && (!question || toc.some(heading => heading.id === question));

  const onListReady = useCallback(() => {
    const pending = listFocus.current;
    if (!pending) return;
    listFocus.current = undefined;
    if (window.location.href !== pending.href || (document.activeElement !== pending.previousFocus && document.activeElement !== document.body)) return;
    const main = document.getElementById('main');
    const entry = Array.from(main?.querySelectorAll<HTMLAnchorElement>('a[data-list-entry]') ?? []).find(link => link.getAttribute('href') === pending.entry);
    (entry ?? main)?.focus({ preventScroll: true });
    if (entry) entry.scrollIntoView({ block: 'center', behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const navigate = useCallback((href: string, replace = false, source?: HTMLAnchorElement) => {
    const previousFocus = document.activeElement;
    const target = new URL(href, document.baseURI);
    const previous = new URL(window.location.href);
    // 翻页按钮写入页码，修改筛选或排序时删除页码。
    const paginatesList = target.searchParams.has('page')
      && (previous.searchParams.get('page') || '1') !== target.searchParams.get('page');
    const changesPage = articleIdFromLocation(previous.pathname, previous.search) !== articleIdFromLocation(target.pathname, target.search)
      || (previous.searchParams.get('view') || 'home') !== (target.searchParams.get('view') || 'home')
      || paginatesList
      || previous.searchParams.get('path') !== target.searchParams.get('path');
    const returning = source?.hasAttribute('data-list-return') ? readListReturn(window.history.state) : undefined;
    const restore = !replace && returning?.entry && returning.href === target.search ? { href: target.href, entry: returning.entry, previousFocus } : undefined;
    listFocus.current = restore;
    const listReturn = navigationListReturn(previous, target, window.history.state, source?.hasAttribute('data-list-entry') ? href : undefined);
    window.history[replace ? 'replaceState' : 'pushState'](listReturn ? { listReturn: listReturn.href, listEntry: listReturn.entry } : {}, '', target);
    setLocation(window.location.href); setQuery(''); setMenuOpen(false);
    if (!replace && !window.location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (changesPage && !restore) setTimeout(() => {
        if (window.location.href !== target.href) return;
        // 用户已主动聚焦其他控件时，导航不能再抢走焦点。
        if (document.activeElement !== previousFocus && document.activeElement !== document.body) return;
        const main = document.getElementById('main');
        const first = paginatesList ? main?.querySelector<HTMLElement>('.question-list h2 a, .resource-list h2 a') : undefined;
        (first ?? main)?.focus({ preventScroll: true });
        first?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }, 0);
    }
    if (window.location.hash) {
      try { document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView(); } catch { /* invalid anchor */ }
      if (window.location.hash === '#main') document.getElementById('main')?.focus({ preventScroll: true });
    }
  }, []);
  useEffect(() => {
    const onPopState = () => { listFocus.current = undefined; setLocation(window.location.href); setQuery(''); setMenuOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); setSearchOpen(true); }
      if (event.key === 'Escape') {
        if (searchWrapRef.current?.contains(document.activeElement)) { event.preventDefault(); searchRef.current?.focus(); }
        if (document.getElementById('sidebar')?.contains(document.activeElement)) menuButtonRef.current?.focus();
        setSearchOpen(false); setMenuOpen(false);
      }
    };
    window.addEventListener('popstate', onPopState); window.addEventListener('hashchange', onPopState); window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPopState); window.removeEventListener('hashchange', onPopState); window.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => {
    const title = id ? focusedHeading?.title || article?.title || '笔记未找到' : path?.title ?? ({ home: '首页', questions: '全部题目', learning: '我的学习', notes: '专题与笔记', resources: '相关资料', article: '阅读文章' }[view] || '首页');
    document.title = `${title} · 前端资料库`;
    const description = focusedHeading && article ? `${focusedHeading.title}，来自《${article.title}》。` : article?.description || '按题查找、按主题学习，收藏值得反复阅读的前端知识。';
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

  }, [article, id, view, path, focusedHeading?.title]);
  useEffect(() => {
    setToc([]); setActiveHeading(undefined);
    if (!article) return;
    let current = true;
    setBody(previous => previous.id === article.id && previous.retrying ? previous : { id: article.id });
    loadArticle(article).then((content) => {
      if (!current) return;
      const retryButton = retryBodyRef.current;
      if (retryButton && document.activeElement === retryButton) readerRef.current?.focus({ preventScroll: true });
      setBody({ id: article.id, content });
    }, (error: Error) => { if (current) setBody({ id: article.id, error: error.message }); });
    return () => { current = false; };
  }, [article?.bodyPath, loadAttempt]);
  useEffect(() => {
    if (!article || body.id !== article.id || !body.content) return;
    const remember = learning.prepareReadingPosition({ articleId: article.id, anchor: question || activeHeading?.id || '', title: (question ? toc.find(heading => heading.id === question)?.title : activeHeading?.title) ?? article.title });
    const timer = setTimeout(remember, 500);
    return () => clearTimeout(timer);
  }, [article?.id, body.id, body.content, activeHeading?.id, question, learning.prepareReadingPosition]);
  const link = (href: string, title: string, className?: string) => <Link href={href} className={className} navigate={navigate}>{title}</Link>;
  const startStudy = (targets: LearningTarget[], filters: URLSearchParams, random = false) => {
    if (!targets.length) throw new Error('当前筛选没有可学习的内容');
    const queue = random ? shuffleStudyTargets(targets) : targets;
    const target = queue[0];
    const session = createStudySession(queue, filters);
    study.start(session);
    navigate(studyHref(target));
  };

  return <>
    <Link className="skip-link" href={skipToContentHref(route)} navigate={navigate}>跳到正文</Link>
    <header className="header">
      <Link className="brand" href="?view=home" navigate={navigate}><span className="brand-icon" aria-hidden="true">&lt;/&gt;</span><span>前端资料库<small>FE LIBRARY</small></span></Link>
      <div className="search-wrap" ref={searchWrapRef} onFocus={() => setSearchOpen(true)} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false);
      }} onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === 'ArrowDown' && !searchOpen && query.trim()) { event.preventDefault(); setSearchOpen(true); return; }
        const links = [...searchWrapRef.current?.querySelectorAll<HTMLAnchorElement>('.search-results a') ?? []];
        if (!links.length) return;
        const index = links.indexOf(document.activeElement as HTMLAnchorElement);
        if (event.key === 'ArrowDown') { event.preventDefault(); links[Math.min(index + 1, links.length - 1)]?.focus(); }
        if (event.key === 'ArrowUp') { event.preventDefault(); (index <= 0 ? searchRef.current : links[index - 1])?.focus(); }
        if (event.key === 'Enter' && event.target === searchRef.current) { event.preventDefault(); links[0]?.click(); }
      }}><span className="search-icon" aria-hidden="true">⌕</span><input ref={searchRef} type="search" onClick={() => setSearchOpen(true)} aria-label="搜索题目和笔记" aria-describedby="search-help" placeholder="搜索题号（如 Q134）、知识点、笔记…" value={query} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} /><span id="search-help" className="sr-only">输入关键词后，用上下方向键选择结果，回车打开，Escape 关闭。</span><kbd>⌘ K</kbd>
        {searchOpen && query.trim() && <div className="search-results" aria-label="搜索结果" onMouseDown={event => {
          const target = event.target instanceof Element ? event.target.closest<HTMLElement>('a, button') : null;
          // Safari 点击链接或按钮不一定转移焦点，避免输入框先失焦并卸载结果。
          if (event.button === 0 && target) { event.preventDefault(); target.focus({ preventScroll: true }); }
        }}><div className="result-count" role="status">{search.loading ? '正在搜索题目和笔记…' : search.error ? '搜索暂时不可用' : `${searchResults.length} 个知识结果`}</div>
          {searchResults.slice(0, 6).map((item) => <Link key={item.href} href={item.href} navigate={navigate}><small>{item.questionNumber ? '题目' : item.section === 'resources' ? '资料' : '笔记'} · {item.category}</small><strong>{item.title}</strong><span>{item.snippet}</span></Link>)}
          {search.error && <p role="alert">{search.error}<button onClick={() => { searchRef.current?.focus({ preventScroll: true }); search.retry(); }}>重试搜索</button></p>}
          {!search.loading && !search.error && !searchResults.length && <p>没有找到相关内容，试试“React”或“性能”。</p>}
          <div className="search-all">{link(`?view=notes&q=${encodeURIComponent(query)}`, '查看专题与笔记 →')}{link(`?view=questions&q=${encodeURIComponent(query)}`, '查看全部题目结果 →')}{link(`?view=resources&q=${encodeURIComponent(query)}`, '查看相关资料 →')}</div>
        </div>}
      </div><span className="header-note"><i />整理知识，沉淀理解</span><button ref={menuButtonRef} className="menu-button" aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen} aria-controls="sidebar" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '关闭' : '导航'}</button>
    </header>
    {menuOpen && <button className="menu-overlay" aria-label="关闭导航遮罩" onClick={() => setMenuOpen(false)} />}
    <aside id="sidebar" className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="资料库导航">
      <div className="sidebar-label">LIBRARY <span>{counts.questions} 题 · {counts.notes} 笔记</span></div>
      <nav className="section-nav" aria-label="资料库入口">{link('?view=home', '首页', view === 'home' ? 'section-link active' : 'section-link')}{link('?view=questions', '全部题目', view === 'questions' ? 'section-link active' : 'section-link')}{link('?view=notes', '专题与笔记', view === 'notes' || view === 'article' && !resourceSection ? 'section-link active' : 'section-link')}{link('?view=resources', '相关资料', resourceSection ? 'section-link active' : 'section-link')}{link('?view=learning', '我的学习', view === 'learning' ? 'section-link active' : 'section-link')}</nav>
      <div className="sidebar-label category-label">按分类浏览</div>
      <nav aria-label="分类导航">{link(`?view=${categoryView}`, '全部分类', !category ? 'nav-link active' : 'nav-link')}{categories.map((value) => {
        const items = collection.filter(item => item.category === value);
        const questions = items.reduce((sum, item) => sum + item.publishedQuestionCount, 0);
        const targetView = view === 'home' && questions === 0 ? 'notes' : categoryView;
        return <div className="category-row" key={value}>{link(`?view=${targetView}&category=${encodeURIComponent(value)}`, value, category === value ? 'nav-link active' : 'nav-link')}<span>{targetView === 'questions' ? questions : `${items.length} 篇`}</span></div>;
      })}</nav>
    </aside>
    {inStudy && <StudySessionBar key={`${id}:${question || "note"}`} study={study} learning={learning} route={route} navigate={navigate} openDirectory={() => studyDirectoryRef.current?.showModal()} directoryReady={toc.length > 0} readingReady={readingReady} />}
    <div className={`workspace ${!id ? 'list-workspace' : ''} ${inStudy ? 'study-workspace' : ''}`}><main id="main" className="main" tabIndex={-1}>
      <LoadRecovery learning={learning} study={study} />
      {!inStudy && <StudySaveRecovery study={study} learning={learning} />}
      {!id ? view === 'questions' ? <QuestionList onListReady={onListReady} params={params} navigate={navigate} learning={learning} study={study} startStudy={startStudy} /> : view === 'learning' ? <>{path ? <LearningPath key={path.id} path={path} onListReady={onListReady} learning={learning} navigate={navigate} startStudy={startStudy} study={study} /> : <LearningPage onListReady={onListReady} learning={learning} navigate={navigate} params={params} startStudy={startStudy} study={study} />}</> : view === 'notes' || view === 'resources' ? <LibraryList onListReady={onListReady} key={view} params={params} navigate={navigate} /> : <HomePage navigate={navigate} learning={learning} study={study} /> : article ? <>
        <ArticleHeader article={article} navigate={navigate} listReturn={readListReturn(window.history.state)} study={inStudy ? { question, returnHref: study.session?.returnSearch ?? '?view=learning' } : undefined} />
        {!inStudy && !article.questionCount && article.section !== 'resources' && <LearningControls itemKey={`a:${article.id}`} learning={learning} />}
        {learning.error && <p role="status">{learning.error}</p>}
        {article.quality === 'incomplete' && <p className="quality-notice" role="note">{article.questionCount > 0 ? '这篇专题尚未完成逐题审核；已审核题目可以单独上线，其余内容继续保留为草稿。' : '这篇知识文章仍待补充和审核，暂不公开发布。'}</p>}
        {!inStudy && article.category === 'JavaScript' && <ReaderBoundary key={`playground-${article.id}`}><Suspense fallback={<p role="status">正在加载代码运行工具…</p>}><CodePlayground /></Suspense></ReaderBoundary>}
        <div id="article-reader" ref={readerRef} role="region" aria-label="文章正文" tabIndex={-1}>
          {body.id === article.id && body.error ? <p>
            <span role="status">{body.retrying ? '正在重新加载正文…' : ''}</span>
            {!body.retrying && <span role="alert">{body.error}</span>}
            <button type="button" ref={retryBodyRef} className="text-button" aria-disabled={body.retrying} onClick={event => {
              if (body.retrying) return;
              event.currentTarget.focus({ preventScroll: true });
              setBody({ ...body, retrying: true });
              setLoadAttempt((value) => value + 1);
            }}>重新加载正文</button>
          </p> : body.id === article.id && body.content !== undefined ? <ReaderBoundary key={article.id} onError={onReaderError}><Suspense fallback={<p role="status">正在加载阅读界面…</p>}><ArticleContent articleId={article.id} key={article.id} hash={location.includes('#') ? location.slice(location.indexOf('#')) : ''} content={body.content} navigate={navigate} onHeadings={setToc} onReady={onReaderReady} studyMode={inStudy} question={question || (inStudy && article.questionCount ? "missing" : undefined)} /></Suspense></ReaderBoundary>
            : <p role="status">正在加载正文…</p>}
        </div>
        {!inStudy && relatedArticles.length > 0 && <section className="related-articles" aria-labelledby="related-title"><div className="related-heading"><span>KEEP EXPLORING</span><h2 id="related-title">继续阅读</h2></div><div className="related-grid">{relatedArticles.map((related) => <Link key={related.id} href={articleHref(related.id)} navigate={navigate}><small>{related.category}</small><strong>{related.title}</strong><p>{related.description}</p><span aria-hidden="true">→</span></Link>)}</div></section>}
        <div className="article-end"><span />把读过的内容，变成自己的理解。<span /></div>{!inStudy && <nav className="pagination" aria-label="上一篇和下一篇">{currentIndex > 0 ? <div><small>← 上一篇</small>{link(articleHref(siblings[currentIndex - 1].id), siblings[currentIndex - 1].title)}</div> : <div />}{currentIndex < siblings.length - 1 && <div><small>下一篇 →</small>{link(articleHref(siblings[currentIndex + 1].id), siblings[currentIndex + 1].title)}</div>}</nav>}
      </> : <div className="not-found"><span className="pill">404</span><h1>这篇内容还不存在</h1><p>链接可能有误，或内容已经移动。</p>{link('?view=notes', '返回专题与笔记 →')}</div>}
      <footer className="page-footer">前端资料库 <span>整理知识 · 沉淀理解</span></footer>
    </main>{id && article && <TableOfContents key={id} articleId={id} hash={route.hash} headings={toc} navigate={navigate} onActive={setActiveHeading} learning={learning} studyMode={inStudy} question={question} dialogRef={studyDirectoryRef} />}</div>
  </>;
};
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

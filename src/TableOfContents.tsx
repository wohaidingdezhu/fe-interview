import { useEffect, useRef, useState } from 'react';
import type { Heading } from './ArticleContent';
import { articleHref } from './library-utils';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import type { Learning } from './useLearning';
import { LearningControls } from './LearningControls';

const isQuestion = (heading: Heading) => /^q[1-9]\d*$/.test(heading.id);

export function visibleDesktopHeadings(headings: Heading[], active: string): Heading[] {
  const questions = headings.filter(isQuestion);
  if (questions.length) return questions;
  const sections = headings.filter(heading => heading.level === 2);
  if (!sections.length) return headings;
  const activeIndex = headings.findIndex(heading => heading.id === active);
  const activeSection = activeIndex >= 0
    ? headings.slice(0, activeIndex + 1).reverse().find(heading => heading.level === 2)?.id ?? sections[0].id
    : sections[0].id;
  let section = '';
  return headings.filter(heading => {
    if (heading.level === 2) { section = heading.id; return true; }
    return heading.level !== 3 || section === activeSection;
  });
}

function headingLabel(heading: Heading) {
  if (!isQuestion(heading)) return heading.title;
  const number = heading.id.toUpperCase();
  const title = heading.title.replace(/^Q[1-9]\d*\s*[｜|]\s*/i, '').trim();
  return <><span className="toc-question-number">{number}</span><span className="toc-question-title">{title || heading.title}</span></>;
}

export function TableOfContents({ headings, articleId, hash, navigate, onActive, learning }: { headings: Heading[]; articleId: string; hash: string; navigate: Navigate; onActive: (heading?: Heading) => void; learning: Learning }) {
  const [active, setActive] = useState(''), [collapsed, setCollapsed] = useState(false);
  const nav = useRef<HTMLElement>(null), dialog = useRef<HTMLDialogElement>(null), button = useRef<HTMLButtonElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const nodes = headings.map(heading => document.getElementById(heading.id)).filter((node): node is HTMLElement => Boolean(node));
    let frame = 0;
    const update = () => { frame = 0; const current = [...nodes].reverse().find(node => node.getBoundingClientRect().top <= 145) || nodes[0]; setActive(current?.id || ''); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    let hashId = '';
    try { hashId = decodeURIComponent(hash.replace(/^#/, '')); } catch { /* 无效编码退回滚动位置判断。 */ }
    if (hashId && headings.some(heading => heading.id === hashId)) setActive(hashId); else update();
    window.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(onScroll); const body = document.querySelector('.article-body'); if (body) observer.observe(body);
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); observer.disconnect(); };
  }, [headings, hash]);
  useEffect(() => { onActive(headings.find(heading => heading.id === active)); }, [active, headings, onActive]);
  useEffect(() => {
    const link = nav.current?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!link || !nav.current || collapsed) return;
    const top = link.getBoundingClientRect().top - nav.current.getBoundingClientRect().top + nav.current.scrollTop;
    if (top < nav.current.scrollTop || top + link.offsetHeight > nav.current.scrollTop + nav.current.clientHeight) nav.current.scrollTop = Math.max(0, top - nav.current.clientHeight / 3);
  }, [active, collapsed]);
  const questions = headings.filter(isQuestion);
  const headingIndex = headings.findIndex(h => h.id === active);
  const current = headings.slice(0, headingIndex + 1).reverse().find(isQuestion);
  const sections = headings.filter(heading => heading.level === 2);
  const steps = questions.length ? questions : sections.length ? sections : headings;
  const reading = headings.slice(0, headingIndex + 1).reverse().find(heading => steps.some(step => step.id === heading.id));
  const index = steps.findIndex(heading => heading.id === reading?.id);
  const unit = questions.length ? '题' : '节';
  function close() { dialog.current?.close(); button.current?.focus(); }
  const links = (items: Heading[], mobile = false) => items.map(heading => <Link key={heading.id} navigate={navigate} onClick={mobile ? close : undefined} className={[heading.level === 3 ? 'toc-sub' : '', isQuestion(heading) ? 'toc-question' : ''].filter(Boolean).join(' ')} href={articleHref(articleId, heading.id)} aria-current={active === heading.id || !mobile && current?.id === heading.id ? 'location' : undefined}>{headingLabel(heading)}</Link>);
  const desktopHeadings = visibleDesktopHeadings(headings, active);
  const countLabel = questions.length ? `${questions.length} 道` : `${headings.filter(heading => heading.level === 2).length} 节`;
  const previous = index > 0 ? steps[index - 1] : undefined, next = index >= 0 && index < steps.length - 1 ? steps[index + 1] : undefined;
  if (!headings.length) return null;
  return <><aside className="toc" aria-label="本篇目录" onKeyDown={event => {
    if (event.key === 'Escape' && !collapsed) { event.preventDefault(); setCollapsed(true); toggle.current?.focus(); }
  }}><button ref={toggle} className="toc-toggle" aria-expanded={!collapsed} aria-controls="toc-links" onClick={() => setCollapsed(!collapsed)}><span className="toc-heading">本篇目录 <small>{countLabel}</small></span><span className="toc-action">{collapsed ? '展开' : '收起'}</span></button>
    {!collapsed && <nav id="toc-links" className="toc-links desktop-toc-links" ref={nav}>{links(desktopHeadings)}</nav>}
    {!collapsed && current && <div className="toc-study"><small><span>阅读定位</span><strong>{current.id.toUpperCase()}</strong></small><LearningControls itemKey={`q:${current.id.slice(1)}`} learning={learning} compact /></div>}
  </aside>
  <nav className="mobile-reading-bar" aria-label="手机阅读导航"><button ref={button} onClick={() => dialog.current?.showModal()} aria-haspopup="dialog">☰ 目录 <span>{current?.id.toUpperCase() ?? (index >= 0 ? `${index + 1}/${steps.length}` : '正文')}</span></button>{previous ? <Link href={articleHref(articleId, previous.id)} navigate={navigate}>← 上一{unit}</Link> : <button disabled>← 上一{unit}</button>}{next ? <Link href={articleHref(articleId, next.id)} navigate={navigate}>下一{unit} →</Link> : <button disabled>下一{unit} →</button>}</nav>
  <dialog className="mobile-toc-dialog" ref={dialog} aria-labelledby="mobile-toc-title" onClick={event => { if (event.target === dialog.current) close(); }} onClose={() => button.current?.focus()}><div className="mobile-toc-header"><h2 id="mobile-toc-title">本页目录 <small>{questions.length ? `${questions.length} 道题` : ''}</small></h2><button onClick={close} aria-label="关闭正文目录">关闭 ×</button></div>
    {current && <div className="mobile-current-question"><strong>{current.title}</strong><LearningControls itemKey={`q:${current.id.slice(1)}`} learning={learning} /></div>}
    <nav className="toc-links">{links(headings, true)}</nav>
  </dialog></>;
}

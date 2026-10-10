import { useEffect, useRef, useState } from 'react';
import type { Heading } from './ArticleContent';
import { articleHref } from './library-utils';
import { NavigationLink as Link, type Navigate } from './NavigationLink';
import type { Learning } from './useLearning';
import { LearningControls } from './LearningControls';
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
  const questions = headings.filter(h => /^q[1-9]\d*$/.test(h.id));
  const headingIndex = headings.findIndex(h => h.id === active);
  const current = headings.slice(0, headingIndex + 1).reverse().find(h => /^q[1-9]\d*$/.test(h.id));
  const index = questions.findIndex(h => h.id === current?.id);
  function close() { dialog.current?.close(); button.current?.focus(); }
  const links = (mobile = false) => headings.map(heading => <Link key={heading.id} navigate={href => { if (mobile) close(); navigate(href); }} className={heading.level === 3 ? 'toc-sub' : ''} href={articleHref(articleId, heading.id)} aria-current={active === heading.id ? 'location' : undefined}>{heading.title}</Link>);
  const previous = index > 0 ? questions[index - 1] : undefined, next = index >= 0 && index < questions.length - 1 ? questions[index + 1] : undefined;
  if (!headings.length) return null;
  return <><aside className="toc" aria-label="本篇目录" onKeyDown={event => {
    if (event.key === 'Escape' && !collapsed) { event.preventDefault(); setCollapsed(true); toggle.current?.focus(); }
  }}><button ref={toggle} className="toc-toggle" aria-expanded={!collapsed} aria-controls="toc-links" onClick={() => setCollapsed(!collapsed)}>本篇目录 <span>{collapsed ? `展开 · ${headings.length} 节` : '收起'}</span></button>
    {!collapsed && <nav id="toc-links" className="toc-links" ref={nav}>{links()}</nav>}
    {current && <div className="toc-study"><small>当前 {current.id.toUpperCase()}</small><LearningControls itemKey={`q:${current.id.slice(1)}`} learning={learning} compact /></div>}
  </aside>
  <nav className="mobile-reading-bar" aria-label="手机阅读导航"><button ref={button} onClick={() => dialog.current?.showModal()} aria-haspopup="dialog">☰ 目录 <span>{current?.id.toUpperCase() ?? '正文'}</span></button><button disabled={!previous} onClick={() => previous && navigate(articleHref(articleId, previous.id))}>← 上一题</button><button disabled={!next} onClick={() => next && navigate(articleHref(articleId, next.id))}>下一题 →</button></nav>
  <dialog className="mobile-toc-dialog" ref={dialog} aria-labelledby="mobile-toc-title" onClick={event => { if (event.target === dialog.current) close(); }} onClose={() => button.current?.focus()}><div className="mobile-toc-header"><h2 id="mobile-toc-title">本页目录 <small>{questions.length ? `${questions.length} 道题` : ''}</small></h2><button onClick={close} aria-label="关闭正文目录">关闭 ×</button></div>
    {current && <div className="mobile-current-question"><strong>{current.title}</strong><LearningControls itemKey={`q:${current.id.slice(1)}`} learning={learning} /></div>}
    <nav className="toc-links">{links(true)}</nav>
  </dialog></>;
}

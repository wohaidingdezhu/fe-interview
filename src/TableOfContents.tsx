import { useEffect, useRef, useState } from 'react';
import type { Heading } from './ArticleContent';
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState('');
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 1150px)').matches);
  const nav = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1150px)');
    const update = () => setCollapsed(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const nodes = headings.map((heading) => document.getElementById(heading.id)).filter((node): node is HTMLElement => Boolean(node));
    let frame = 0;
    const update = () => { frame = 0; const current = [...nodes].reverse().find((node) => node.getBoundingClientRect().top <= 145) || nodes[0]; setActive(current?.id || ''); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [headings]);
  useEffect(() => {
    const link = nav.current?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!link || !nav.current || collapsed) return;
    const top = link.getBoundingClientRect().top - nav.current.getBoundingClientRect().top + nav.current.scrollTop;
    if (top < nav.current.scrollTop || top + link.offsetHeight > nav.current.scrollTop + nav.current.clientHeight) nav.current.scrollTop = Math.max(0, top - nav.current.clientHeight / 3);
  }, [active, collapsed]);
  if (!headings.length) return null;
  return <aside className="toc" aria-label="本篇目录" onKeyDown={(event) => {
    if (event.key === 'Escape' && !collapsed) { event.preventDefault(); setCollapsed(true); toggle.current?.focus(); }
  }}><button ref={toggle} className="toc-toggle" aria-expanded={!collapsed} aria-controls="toc-links" onClick={() => setCollapsed(!collapsed)}>本篇目录 <span>{collapsed ? `展开 · ${headings.length} 节` : '收起'}</span></button>
    {!collapsed && <nav id="toc-links" className="toc-links" ref={nav} aria-label="文章章节">{headings.map((heading) => <a key={heading.id} className={heading.level === 3 ? 'toc-sub' : ''} href={`#${heading.id}`} aria-current={active === heading.id ? 'location' : undefined} onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (window.matchMedia('(max-width: 1150px)').matches) setCollapsed(true);
      requestAnimationFrame(() => {
        const anchor = document.getElementById(heading.id);
        const target = anchor?.closest('h2, h3') ?? anchor;
        if (target instanceof HTMLElement) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
      });
    }}>{heading.title}</a>)}</nav>}
    <div className="toc-tip"><span>阅读建议</span><p>记录来源，也记录自己的理解。</p></div></aside>;
}

import { useEffect, useRef, useState } from 'react';
import type { Heading } from './ArticleContent';
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(''), [collapsed, setCollapsed] = useState(false);
  const nav = useRef<HTMLElement>(null);
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
  return <aside className="toc" aria-label="本页目录"><button className="toc-toggle" aria-expanded={!collapsed} aria-controls="toc-links" onClick={() => setCollapsed(!collapsed)}>本页内容 <span>{collapsed ? '展开' : '收起'}</span></button>
    {!collapsed && <nav id="toc-links" className="toc-links" ref={nav}>{headings.map((heading) => <a key={heading.id} className={heading.level === 3 ? 'toc-sub' : ''} href={`#${heading.id}`} aria-current={active === heading.id ? 'location' : undefined}>{heading.title}</a>)}</nav>}
    <div className="toc-tip"><span>阅读建议</span><p>记录来源，也记录自己的理解。</p></div></aside>;
}

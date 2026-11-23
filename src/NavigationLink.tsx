import type { ComponentProps } from 'react';
import siteConfig from '../site.config.json';
export type Navigate = (href: string, replace?: boolean, source?: HTMLAnchorElement) => void;
export const NavigationLink = ({ href, navigate, onClick, target, rel, download, ...props }: ComponentProps<'a'> & { href: string; navigate?: Navigate }) => {
  const base = typeof document === 'undefined' ? siteConfig.url : document.baseURI;
  let external = false, internal = false;
  try {
    const root = new URL(base), destination = new URL(href, root);
    if (['http:', 'https:'].includes(destination.protocol)) {
      external = destination.origin !== root.origin;
      const path = destination.pathname.startsWith(root.pathname) ? destination.pathname.slice(root.pathname.length) : undefined;
      internal = !external && (path === '' || path === 'index.html' || (path !== undefined && /^articles\/[a-z0-9-]+\/?(?:index\.html)?$/.test(path)));
    }
  } catch { /* 无效链接交给浏览器原生处理。 */ }
  const linkTarget = target ?? (external ? '_blank' : undefined);
  const linkRel = external || linkTarget === '_blank' ? [...new Set(`${rel ?? ''} noopener noreferrer`.trim().split(/\s+/))].join(' ') : rel;
  return <a {...props} href={href} target={linkTarget} rel={linkRel} download={download} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || external || !internal || !navigate || download !== undefined || (linkTarget && linkTarget !== '_self') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); navigate(href, false, event.currentTarget);
  }} />;
};

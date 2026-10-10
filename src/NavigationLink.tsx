import type { ComponentProps } from 'react';
import siteConfig from '../site.config.json';
export type Navigate = (href: string, replace?: boolean) => void;
export function NavigationLink({ href, navigate, onClick, ...props }: ComponentProps<'a'> & { href: string; navigate?: Navigate }) {
  const base = typeof document === 'undefined' ? siteConfig.url : document.baseURI;
  let external = false, internal = false;
  try {
    const destination = new URL(href, base);
    if (['http:', 'https:'].includes(destination.protocol)) {
      external = destination.origin !== new URL(base).origin;
      internal = !external;
    }
  } catch { /* 无效链接交给浏览器原生处理。 */ }
  return <a {...props} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || external || !internal || !navigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); navigate(href);
  }} />;
}

import type { ComponentProps } from 'react';
export type Navigate = (href: string, replace?: boolean) => void;
export function NavigationLink({ href, navigate, onClick, ...props }: ComponentProps<'a'> & { href: string; navigate: Navigate }) {
  return <a {...props} href={href} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); navigate(href);
  }} />;
}

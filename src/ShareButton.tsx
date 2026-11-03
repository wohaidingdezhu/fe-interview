import { useLayoutEffect, useRef, useState } from 'react';
export const ShareButton = ({ articleId, anchor = '' }: { articleId: string; anchor?: string }) => {
  const [status,setStatus] = useState('');
  const request = useRef(0);
  const question = /^q[1-9]\d*$/.test(anchor) ? anchor : '';
  const href = `articles/${encodeURIComponent(articleId)}/${question ? `#${question}` : ''}`;
  useLayoutEffect(() => {
    request.current++; setStatus('');
    return () => { request.current++; };
  }, [href]);
  return <div className="share-control"><a href={href}>{question ? '独立题目链接 →' : '独立文章链接 →'}</a><button type="button" onClick={async () => {
    const selected = ++request.current;
    setStatus('正在复制链接…');
    try {
      await navigator.clipboard.writeText(new URL(href, document.baseURI).href);
      if (selected === request.current) setStatus('链接已复制');
    } catch {
      if (selected === request.current) setStatus('复制失败，请长按或右键复制左侧链接。');
    }
  }}>{question ? '复制题目链接' : '复制文章链接'}</button><span role="status">{status}</span></div>;
};

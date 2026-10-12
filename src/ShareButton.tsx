import { useEffect, useState } from 'react';
export function ShareButton({ articleId, anchor = '' }: { articleId: string; anchor?: string }) {
  const [status,setStatus] = useState('');
  const question = /^q[1-9]\d*$/.test(anchor) ? anchor : '';
  const href = `articles/${encodeURIComponent(articleId)}/${question ? `#${question}` : ''}`;
  useEffect(() => setStatus(''), [href]);
  return <div className="share-control"><a href={href}>{question ? '独立题目链接 →' : '独立文章链接 →'}</a><button type="button" onClick={async () => {
    try { await navigator.clipboard.writeText(new URL(href, document.baseURI).href); setStatus('链接已复制'); }
    catch { setStatus('复制失败，请长按或右键复制左侧链接。'); }
  }}>{question ? '复制题目链接' : '复制文章链接'}</button><span role="status">{status}</span></div>;
}

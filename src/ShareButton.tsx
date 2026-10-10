import { useState } from 'react';
export function ShareButton({ articleId, anchor }: { articleId: string; anchor?: string }) {
  const [status,setStatus] = useState('');
  const href = `articles/${articleId}/${anchor ? `#${encodeURIComponent(anchor)}` : ''}`;
  return <div className="share-control"><a href={href}>独立文章链接 ↗</a><button type="button" onClick={async () => {
    try { await navigator.clipboard.writeText(new URL(href, document.baseURI).href); setStatus('链接已复制'); }
    catch { setStatus('复制失败，请长按或右键复制左侧链接。'); }
  }}>复制分享链接</button><span role="status">{status}</span></div>;
}

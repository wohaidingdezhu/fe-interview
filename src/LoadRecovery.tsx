import { useEffect, useState } from 'react';

export function LoadRecovery() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener('vite:preloadError', show);
    window.addEventListener('library:asset-unavailable', show);
    return () => {
      window.removeEventListener('vite:preloadError', show);
      window.removeEventListener('library:asset-unavailable', show);
    };
  }, []);
  if (!visible) return null;
  return <section className="load-recovery" role="alert" aria-label="内容加载恢复">
    <strong>部分内容未能加载</strong>
    <p>网站可能已更新，或网络暂时异常。刷新可重新获取资源，当前网址及已保存的学习记录会保留。</p>
    <button type="button" onClick={() => window.location.reload()}>刷新并继续阅读</button>
    <button type="button" onClick={() => setVisible(false)}>暂不刷新</button>
  </section>;
}

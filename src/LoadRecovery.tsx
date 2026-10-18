import { useEffect, useState } from 'react';
import { LearningBackupButton } from './LearningBackupButton';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';

export const LoadRecovery = ({ learning, study }: { learning: Learning; study: Study }) => {
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
    {(learning.error || study.error) && <p>尚有记录未能保存，建议先导出备份再刷新，避免丢失本次访问中的修改。</p>}
    <LearningBackupButton learning={learning} study={study} />
    <button type="button" onClick={() => window.location.reload()}>刷新并继续阅读</button>
    <button type="button" onClick={() => setVisible(false)}>暂不刷新</button>
  </section>;
};

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LearningBackupButton } from './LearningBackupButton';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';

export const StudySaveRecovery = ({ study, learning, showBackup = true }: { study: Study; learning: Learning; showBackup?: boolean }) => {
  const [message, setMessage] = useState('');
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (study.error) setMessage(''); }, [study.error]);
  useLayoutEffect(() => { if (message && !study.error) feedback.current?.focus(); }, [message, study.error]);
  if (!study.error && !message) return null;
  return <section className="learning-save-recovery" aria-label="学习清单保存">
    {study.error ? <>
      <p role="alert">{study.error}</p>
      <div><button type="button" onClick={() => {
        const result = study.retrySave();
        setMessage(result === 'failed' ? '' : result === 'synced'
          ? '浏览器中的清单已变化，已同步最新状态，未覆盖其他页面的修改。'
          : '学习清单已保存，当前阅读页面保持不变。');
      }}>重试保存学习清单</button>{showBackup && <LearningBackupButton learning={learning} study={study} />}</div>
    </> : <p ref={feedback} tabIndex={-1} role="status">{message}</p>}
  </section>;
};

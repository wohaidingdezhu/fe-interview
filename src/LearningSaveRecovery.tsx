import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LearningBackupButton } from './LearningBackupButton';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';

export const LearningSaveRecovery = ({ learning, study, onSaved }: { learning: Learning; study?: Study; onSaved?: () => void }) => {
  const [saved, setSaved] = useState(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (learning.error) setSaved(false); }, [learning.error]);
  useLayoutEffect(() => { if (saved && !learning.error) feedback.current?.focus(); }, [saved, learning.error]);
  if (!learning.error && !saved) return null;
  return <section className="learning-save-recovery" aria-label="阅读记录保存">
    {learning.error ? <>
      <p role="alert">阅读记录尚未保存。{learning.error}</p>
      <div><button type="button" onClick={() => {
        const result = learning.retrySave();
        setSaved(!result.error);
        if (!result.error) onSaved?.();
      }}>重试保存阅读记录</button><LearningBackupButton learning={learning} study={study} /></div>
    </> : <p ref={feedback} tabIndex={-1} role="status">阅读记录已保存，当前内容和学习清单位置保持不变。</p>}
  </section>;
};

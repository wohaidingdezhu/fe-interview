import { useState } from 'react';
import { createLearningBackup } from './learning-backup';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';

export const LearningBackupButton = ({ learning, study }: { learning: Learning; study?: Study }) => {
  const [feedback, setFeedback] = useState({ message: '', failed: false });
  const download = () => {
    let url: string | undefined, link: HTMLAnchorElement | undefined;
    try {
      const blob = new Blob([JSON.stringify(createLearningBackup(learning.data, study?.session), null, 2)], { type: 'application/json' });
      url = URL.createObjectURL(blob);
      link = document.createElement('a');
      link.href = url; link.download = `前端资料库-学习记录-${new Date().toISOString().slice(0, 10)}.json`; link.hidden = true;
      document.body.append(link); link.click();
      setFeedback({ message: '备份已导出，请确认文件已保存。', failed: false });
    } catch {
      setFeedback({ message: '导出失败，请保持本页打开并重试。', failed: true });
    } finally {
      link?.remove();
      if (url) { const exportedURL = url; window.setTimeout(() => URL.revokeObjectURL(exportedURL), 1000); }
    }
  };
  return <span className="backup-export"><button type="button" onClick={download}>导出备份</button><span className="backup-export-message" role={feedback.failed ? 'alert' : 'status'}>{feedback.message}</span></span>;
};

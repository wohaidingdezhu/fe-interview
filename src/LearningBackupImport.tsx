import { useEffect, useRef, useState, type RefObject } from 'react';
import { parseLearningBackup, previewLearningImport } from './learning-backup';
import type { Learning } from './useLearning';
import type { Study } from './useStudySession';
import type { LearningTarget } from './learning-view';
import { LearningImportChanges } from './LearningImportChanges';

type PendingBackup = { name: string; backup: ReturnType<typeof parseLearningBackup>; request: number };

const BackupPreview = ({ pending, learning, study, targets, error, trigger, onConfirm, onClose }: {
  pending: PendingBackup; learning: Learning; study?: Study; error: string;
  targets: LearningTarget[];
  trigger: RefObject<HTMLButtonElement | null>; onConfirm: (restoreStudy: boolean) => void; onClose: () => void;
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const [restoreStudy, setRestoreStudy] = useState(true);
  useEffect(() => {
    const modal = dialog.current; modal?.showModal();
    return () => { modal?.close(); trigger.current?.focus({ preventScroll: true }); };
  }, [trigger]);
  const { backup } = pending, { counts, changes } = previewLearningImport(learning.data, backup.learning);
  const hasStudy = backup.study !== undefined && Boolean(study);
  return <dialog ref={dialog} className="study-summary backup-preview" aria-labelledby="backup-preview-title" onClose={event => { if (!event.currentTarget.open) onClose(); }}>
    <h2 id="backup-preview-title">导入备份预览</h2>
    <p className="backup-filename">文件：{pending.name}</p>
    <p>预计合并后有 {counts.total} 条记录。相同内容保留时间较新的标记，确认时按最新记录合并。</p>
    <dl className="backup-preview-counts" aria-label="记录变更预览">
      <div><dt>新增</dt><dd>{counts.added}</dd></div><div><dt>更新</dt><dd>{counts.updated}</dd></div>
      <div><dt>移除</dt><dd>{counts.removed}</dd></div><div><dt>保留</dt><dd>{counts.retained}</dd></div>
    </dl>
    <LearningImportChanges changes={changes} targets={targets} />
    <p>备份中的较新清空或清理操作也会生效；继续阅读位置按时间合并。</p>
    {hasStudy ? <>
      <label className="backup-study-choice"><input type="checkbox" checked={restoreStudy} onChange={event => setRestoreStudy(event.target.checked)} />
        {backup.study ? '同时恢复备份中的学习清单' : '结束当前学习清单（备份中没有清单）'}</label>
      <p>{restoreStudy ? backup.study ? `将恢复 ${backup.study.keys.length} 项清单及暂停位置${study?.session ? '，替换当前清单' : ''}。` : '确认后将结束当前清单。' : '只合并阅读记录，保留当前学习清单。'}</p>
    </> : <p>此备份仅合并阅读记录，当前学习清单保持不变。</p>}
    {error && <p role="alert">{error}</p>}
    <div className="study-summary-actions"><button className="primary-learning-action" onClick={() => onConfirm(hasStudy && restoreStudy)}>{error ? '重试导入' : '确认导入'}</button><button autoFocus onClick={onClose}>{error ? '关闭预览' : '取消导入'}</button></div>
  </dialog>;
};

export const LearningBackupImport = ({ learning, study, targets, onImported }: { learning: Learning; study?: Study; targets: LearningTarget[]; onImported: () => void }) => {
  const input = useRef<HTMLInputElement>(null), trigger = useRef<HTMLButtonElement>(null), request = useRef(0);
  const [pending, setPending] = useState<PendingBackup>();
  const [loading, setLoading] = useState(false), [feedback, setFeedback] = useState({ message: '', failed: false });
  useEffect(() => () => { request.current++; }, []);
  const confirm = (restoreStudy: boolean) => {
    if (!pending) return;
    const restored = learning.restore(JSON.stringify(pending.backup.learning)); onImported();
    if (restored.error) { setFeedback({ message: '阅读记录已合并到本次访问，但尚未保存；清单未替换，请保留备份后重试。', failed: true }); return; }
    const saved = !restoreStudy ? undefined : pending.backup.study ? study?.start(pending.backup.study) : study?.end();
    if (saved?.error) { setFeedback({ message: '阅读记录已保存，清单仅在本次访问恢复，尚未保存；请保留备份后重试。', failed: true }); return; }
    setPending(undefined); setFeedback({ message: restoreStudy ? '备份已合并并保存，学习清单已按选择更新。' : '阅读记录已合并并保存，学习清单保持不变。', failed: false });
  };
  return <div className="backup-import">
    <button ref={trigger} type="button" disabled={loading} aria-haspopup="dialog" onClick={event => { event.currentTarget.focus(); input.current?.click(); }}>{loading ? '正在读取备份…' : '导入备份'}</button>
    <input hidden ref={input} type="file" accept="application/json,.json" onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      const selected = ++request.current; setLoading(true); setPending(undefined); setFeedback({ message: '', failed: false });
      try {
        if (file.size > 4_000_000) throw new Error('备份不能超过 4 MB');
        const backup = parseLearningBackup(await file.text());
        if (selected === request.current) setPending({ name: file.name, backup, request: selected });
      } catch (error) {
        if (selected === request.current) setFeedback({ message: `导入失败：${error instanceof Error ? error.message : '文件无效'}`, failed: true });
      } finally { if (selected === request.current) setLoading(false); }
    }} />
    {!pending && <span className="backup-import-message" role={feedback.failed ? 'alert' : 'status'}>{feedback.message}</span>}
    {pending && <BackupPreview key={pending.request} pending={pending} learning={learning} study={study} targets={targets} error={feedback.failed ? feedback.message : ''} trigger={trigger} onConfirm={confirm} onClose={() => { setPending(undefined); setFeedback({ message: '', failed: false }); }} />}
  </div>;
};

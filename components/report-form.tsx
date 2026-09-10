'use client';
import { useState } from 'react';
import { Modal } from './common';
import { Report, parseReport } from '@/lib/reporting';
export default function ReportForm({
  title,
  year,
  metric,
  unit,
  departmentId,
  existing,
  onSave,
  onClose,
}: {
  title: string;
  year: number;
  metric: boolean;
  unit?: string | null;
  departmentId: string;
  existing?: Report;
  onSave: (r: Report) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(existing?.value?.toString() ?? ''),
    [text, setText] = useState(existing?.text ?? ''),
    [progress, setProgress] = useState(existing?.progress?.toString() ?? ''),
    [note, setNote] = useState(existing?.note ?? ''),
    [error, setError] = useState('');
  return (
    <Modal title={`${year} 年度填报`} description={title} onClose={onClose}>
      <form
        className="report-form"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onSave(
              parseReport(
                { value, text, progress, note },
                metric,
                departmentId,
              ),
            );
          } catch (e) {
            setError(e instanceof Error ? e.message : '保存失败');
          }
        }}
      >
        {metric ? (
          <label>
            当前完成值{unit ? `（${unit}）` : ''}
            <input
              required
              type="number"
              min="0"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="请输入实际完成值"
            />
          </label>
        ) : (
          <>
            <label>
              完成情况
              <textarea
                required
                maxLength={4000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
              />
            </label>
            <label>
              完成进度（%）
              <input
                required
                type="number"
                min="0"
                max="100"
                step="1"
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
              />
            </label>
          </>
        )}
        <label>
          备注
          <textarea
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="填写推进情况、问题或说明"
          />
        </label>
        <p className="muted">演示填报保存在当前浏览器，供本机继续查看。</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="outline" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="primary">
            保存填报
          </button>
        </div>
      </form>
    </Modal>
  );
}

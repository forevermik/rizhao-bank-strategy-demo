import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Info, LockKeyhole } from 'lucide-react';
import type { StrategicTask, Year } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCompletionReports } from '../../hooks/useCompletionReports';
import { getTaskImplementationYears } from '../../utils/taskCalculations';
import {
  calculateStandardYearProgress,
  getTaskProgressSummary,
  progressExplanation,
} from '../../utils/progressCalculations';

export function TaskCard({ task, relation, year = 2026 }: { task: StrategicTask; relation?: 'lead' | 'support' | 'none'; year?: Year }) {
  const { user } = useAuth();
  const { reports } = useCompletionReports();
  const [showRule, setShowRule] = useState(false);
  const summary = getTaskProgressSummary(task, reports, year);
  const relationLabel = relation === 'lead' ? '我牵头' : relation === 'support' ? '我协同' : '';
  const canReport = user?.role === 'department' && relation === 'lead';
  const isLockedForSupport = user?.role === 'department' && relation === 'support';
  const isStrategy = user?.role === 'strategy';
  const implementationYears = getTaskImplementationYears(task);

  return (
    <article className="soft-panel group rounded-ui p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {relationLabel && <TaskRelationBadge relation={relation!} />}
            <span className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-extrabold text-brand-500">{task.code}</span>
            <span className="rounded-lg bg-[#ECFEFF] px-2 py-0.5 text-xs font-semibold text-[#087D92]">{task.businessArea || '—'}</span>
            <span className="rounded-lg bg-[#FFF7ED] px-2 py-0.5 text-xs font-semibold text-[#B54708]">{task.tag || task.priority || '—'}</span>
          </div>
          <Link title={task.title} to={`/tasks/${task.id}`} className="mt-2 block line-clamp-2 min-h-11 text-[15px] font-extrabold leading-[22px] text-ink hover:text-brand-500">
            {task.title}
          </Link>
          <p title={task.objective} className="mt-1 line-clamp-2 text-[11px] text-muted">{task.objective || '未录入任务目标'}</p>
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-xs">
        <MiniInfo label="牵头" value={task.leadDepartmentName || '—'} />
        <MiniInfo label="协同" value={`${task.supportingDepartmentNames.length} 个`} />
        <MiniInfo label="实施时间" value={task.period || '—'} />
      </div>

      <div className="relative mt-2.5">
        <div className="mb-1.5 flex justify-between text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            总体进度
            <button type="button" onClick={() => setShowRule((value) => !value)} className="grid h-5 w-5 place-items-center rounded-full hover:bg-brand-50" aria-label="查看计算口径">
              <Info size={13} />
            </button>
          </span>
          <span className="font-bold text-brand-500">{summary.displayProgress == null ? '—' : `${summary.displayProgress}%`}</span>
        </div>
        {showRule && (
          <div className="absolute left-0 top-6 z-10 w-72 rounded-xl border border-[#D9E3F2] bg-white p-3 text-xs leading-5 text-muted shadow-lg">
            {summary.explanation || progressExplanation}
          </div>
        )}
        <div className="h-1.5 overflow-hidden rounded-full bg-[#E4EBF5]">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyanx" style={{ width: `${summary.displayProgress ?? 0}%` }} />
        </div>
      </div>

      {implementationYears.length > 0 && <div className="mt-2.5 grid gap-1" style={{ gridTemplateColumns: `repeat(${implementationYears.length}, minmax(0, 1fr))` }}>
        {implementationYears.map((itemYear) => {
          const yearProgress = calculateStandardYearProgress(task, itemYear, reports);
          return (
            <div key={itemYear} className={`rounded-lg p-1 ${itemYear === year ? 'bg-brand-50' : 'bg-[#F6F9FE]'}`} title={`${itemYear} 年度进度：${yearProgress == null ? '—' : `${yearProgress}%`}`}>
              <div className="text-[10px] font-semibold text-muted">{itemYear}</div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#DDE7F6]">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${yearProgress ?? 0}%` }} />
              </div>
              <div className="mt-0.5 text-[10px] font-bold text-ink">{yearProgress == null ? '—' : `${yearProgress}%`}</div>
            </div>
          );
        })}
      </div>}

      <div className="mt-2.5 flex items-center justify-end gap-1.5">
        <Link to={`/tasks/${task.id}`} className="inline-flex h-8 items-center rounded-xl border border-[#D9E3F2] bg-white px-3 text-xs font-bold text-brand-500 shadow-sm">
          查看详情
        </Link>
        {canReport ? (
          <Link to={`/tasks/${task.id}?year=${year}&mode=edit`} className="inline-flex h-8 items-center gap-1 rounded-xl bg-brand-500 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600">
            <Edit3 size={13} /> 填报进度
          </Link>
        ) : (
          <Link to={isStrategy ? `/tasks/${task.id}?year=${year}&review=1` : `/tasks/${task.id}?year=${year}`} className={`inline-flex h-8 items-center gap-1 rounded-xl px-3 text-xs font-bold ${isLockedForSupport ? 'border border-[#D9E3F2] bg-[#F8FBFF] text-muted' : 'bg-brand-50 text-brand-500'}`}>
            {isLockedForSupport && <LockKeyhole size={13} />} {isStrategy ? '审核进度' : isLockedForSupport ? '查看进度' : '查看填报'}
          </Link>
        )}
      </div>
    </article>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#F8FBFF] px-2 py-1">
      <div className="text-[10px] text-muted">{label}</div>
      <div title={value} className="mt-0.5 min-w-0 line-clamp-2 break-words font-bold text-ink">{value}</div>
    </div>
  );
}

function TaskRelationBadge({ relation }: { relation: 'lead' | 'support' | 'none' }) {
  if (relation === 'lead') return <span className="rounded-lg bg-brand-700 px-2 py-0.5 text-xs font-black text-white">我牵头</span>;
  if (relation === 'support') return <span className="rounded-lg border border-cyanx bg-white px-2 py-0.5 text-xs font-black text-[#087D92]">我协同</span>;
  return null;
}

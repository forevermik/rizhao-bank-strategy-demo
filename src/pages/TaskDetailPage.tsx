import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Info, LockKeyhole } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { CURRENT_DEMO_YEAR } from '../data/constants';
import { useAuth } from '../hooks/useAuth';
import { useCompletionReports } from '../hooks/useCompletionReports';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTaskReporting } from '../hooks/useTaskReporting';
import type { AnnualStandardReport, CompletionStandardItem, Measure, Priority, StrategicTask, Year } from '../types';
import { years } from '../utils/taskCalculations';
import { canViewTask, getTaskRelation } from '../utils/taskSelectors';
import {
  calculatePlannedFinalGap,
  calculateStandardYearProgress,
  getPlannedTarget,
  getTaskProgressSummary,
  getTaskStandards,
  progressExplanation,
  standardTypeLabel,
} from '../utils/progressCalculations';

type Tab = 'overview' | 'standards';
type TableMode = 'all' | 'single';
type TargetOverrideState = { targets: Record<string, string> };
const STANDARD_TARGET_STORAGE_KEY = 'rizhao-standard-target-overrides-v1';

export function TaskDetailPage() {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tasks, updateTask } = useTaskReporting();
  const { reports, saveReport } = useCompletionReports();
  const task = tasks.find((item) => item.id === taskId);
  const initialYear = Number(searchParams.get('year')) as Year;
  const editMode = searchParams.get('mode') === 'edit';
  const [tab, setTab] = useState<Tab>(editMode ? 'standards' : 'overview');
  const [tableMode, setTableMode] = useState<TableMode>('all');
  const [selectedYear, setSelectedYear] = useState<Year>(years.includes(initialYear) ? initialYear : CURRENT_DEMO_YEAR);
  const [showRule, setShowRule] = useState(false);

  if (!task) return <EmptyState text="未找到任务卡片" />;
  if (!canViewTask(task, user)) return <Navigate to="/workbench?notice=unauthorized-task" replace />;

  const relation = getTaskRelation(task, user?.departmentId);
  const standards = getTaskStandards(task.id);
  const summary = getTaskProgressSummary(task, reports, selectedYear);
  const reportingLabel = relation === 'lead' ? '牵头部门' : '本部门协同';
  const canEdit = user?.role === 'department' && relation === 'lead';
  const isLockedForSupport = user?.role === 'department' && relation === 'support';

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex items-center justify-between">
        <Link to={user?.role === 'strategy' ? '/tasks' : '/workbench'} className="inline-flex items-center gap-2 text-sm font-bold text-brand-500">
          <ArrowLeft size={18} /> {user?.role === 'strategy' ? '返回战略任务' : '返回工作台'}
        </Link>
        <button onClick={() => { setTab('standards'); setTableMode('all'); }} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold ${canEdit ? 'bg-brand-500 text-white' : 'border border-[#D9E3F2] bg-[#F8FBFF] text-muted'}`}>
          {!canEdit && <LockKeyhole size={15} />}{canEdit ? '填报进度' : isLockedForSupport ? '查看进度（只读）' : '查看进度'}
        </button>
      </div>

      <section className="soft-panel rounded-ui p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-brand-50 px-3 py-1 text-sm font-black text-brand-500">{task.code}</span>
          {user?.role === 'department' && <span className={`rounded-lg px-3 py-1 text-sm font-black ${relation === 'lead' ? 'bg-brand-700 text-white' : 'border border-cyanx bg-white text-[#087D92]'}`}>{relation === 'lead' ? '我牵头' : '我协同'}</span>}
          <span className="rounded-lg bg-[#ECFEFF] px-3 py-1 text-sm font-bold text-[#087D92]">{task.businessArea || '—'}</span>
          <span className="rounded-lg bg-[#FFF7ED] px-3 py-1 text-sm font-bold text-[#B54708]">标签：{task.tag || '—'}</span>
        </div>
        <h2 className="mt-4 text-3xl font-black text-ink">{task.title}</h2>
        <p className="mt-4 text-base leading-8 text-[#344054]">{task.objective || '未录入任务目标'}</p>
        <div className="mt-6 grid grid-cols-5 gap-3">
          <InfoBox label="牵头部门" value={task.leadDepartmentName} />
          <InfoBox label="协同部门" value={task.supportingDepartmentNames.join('、') || '—'} />
          <InfoBox label="实施时间" value={task.period || '—'} />
          <InfoBox label="完成标准项" value={standards.length ? `${standards.length} 项` : '暂无完成标准'} />
          <div className="relative rounded-xl bg-[#F8FBFF] p-3">
            <div className="flex items-center gap-1 text-xs text-muted">
              总体进度
              <button type="button" onClick={() => setShowRule((value) => !value)} className="grid h-5 w-5 place-items-center rounded-full hover:bg-brand-50" aria-label="查看计算口径"><Info size={13} /></button>
            </div>
            <div className="mt-1 text-sm font-bold leading-6 text-ink">{summary.displayProgress == null ? '—' : `${summary.displayProgress}%`}</div>
            {showRule && <div className="absolute right-0 top-16 z-10 w-80 rounded-xl border border-[#D9E3F2] bg-white p-3 text-xs leading-5 text-muted shadow-lg">{summary.explanation || progressExplanation}</div>}
          </div>
        </div>
      </section>

      {canEdit && editMode && <TaskDetailEditor defaultOpen task={task} onSave={(patch) => updateTask(task.id, patch)} />}

      <div className="soft-panel rounded-ui p-2">
        <div className="flex gap-2">
          {[
            { key: 'overview' as Tab, label: '任务总览' },
            { key: 'standards' as Tab, label: '任务完成标准年度达成表' },
          ].map((item) => (
            <button key={item.key} onClick={() => setTab(item.key)} className={`h-11 rounded-[14px] px-5 text-sm font-bold transition ${tab === item.key ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-muted hover:bg-brand-50 hover:text-brand-500'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <section className="soft-panel rounded-ui p-5">
            <h3 className="text-xl font-black text-ink">关键实施举措</h3>
            <div className="mt-4 space-y-4">
              {task.measures.map((measure, index) => {
                const sameContent = normalizeText(measure.title) === normalizeText(measure.description);
                return (
                  <article key={measure.id} className="rounded-ui border border-[#D9E3F2] bg-white p-5">
                    <div className="text-sm font-black text-brand-500">举措 {index + 1}</div>
                    {sameContent ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-7 text-[#344054]">{measure.title}</p>
                    ) : (
                      <>
                        <h4 className="mt-2 text-base font-black text-ink">{measure.title}</h4>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#344054]">{measure.description}</p>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="soft-panel rounded-ui p-5">
            <h3 className="text-xl font-black text-ink">任务完成标准</h3>
            <p className="mt-2 text-sm font-semibold text-muted">只有完成全部任务完成标准，任务卡才可以判定为“已完成”。</p>
            <div className="mt-4 space-y-3">
              {standards.map((standard) => (
                <article key={standard.id} className="rounded-ui border border-[#D9E3F2] bg-white p-4">
                  <div className="text-sm font-black text-brand-500">标准 {standard.order}</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-[#344054]">{standard.name || standard.sourceText}</p>
                  {normalizeText(standard.name || standard.sourceText) !== normalizeText(standard.sourceText) && (
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-muted">{standard.sourceText}</p>
                  )}
                </article>
              ))}
              {!standards.length && <div className="rounded-xl bg-[#F8FBFF] p-4 text-sm font-semibold text-muted">暂无完成标准</div>}
            </div>
          </section>
        </div>
      )}

      {tab === 'standards' && (
        <CompletionStandardTable
          reportingLabel={reportingLabel}
          canEdit={canEdit}
          isLockedForSupport={isLockedForSupport}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          setTableMode={setTableMode}
          standards={standards}
          tableMode={tableMode}
          task={task}
          reports={reports}
          saveReport={saveReport}
        />
      )}
    </div>
  );
}

function CompletionStandardTable({
  reportingLabel,
  canEdit,
  isLockedForSupport,
  selectedYear,
  setSelectedYear,
  setTableMode,
  standards,
  tableMode,
  task,
  reports,
  saveReport,
}: {
  reportingLabel: string;
  canEdit: boolean;
  isLockedForSupport: boolean;
  selectedYear: Year;
  setSelectedYear: (year: Year) => void;
  setTableMode: (mode: TableMode) => void;
  standards: CompletionStandardItem[];
  tableMode: TableMode;
  task: StrategicTask;
  reports: AnnualStandardReport[];
  saveReport: (report: AnnualStandardReport) => void;
}) {
  const { user } = useAuth();
  const [targetState, setTargetState] = useLocalStorage<TargetOverrideState>(STANDARD_TARGET_STORAGE_KEY, { targets: {} });
  const visibleYears = tableMode === 'all' ? years : [selectedYear];
  const [showRule, setShowRule] = useState(false);
  const minWidth = tableMode === 'all' ? 2900 : 1260;
  const departmentId = canEdit ? user?.departmentId ?? task.leadDepartmentId : task.leadDepartmentId;

  function saveTarget(standardId: string, year: Year, value: string) {
    if (!canEdit) return;
    setTargetState({
      targets: {
        ...targetState.targets,
        [targetKey(standardId, year)]: value,
      },
    });
  }

  function saveYearReport(report: AnnualStandardReport) {
    if (!canEdit) return;
    saveReport(report);
  }

  return (
    <section className="soft-panel min-w-0 rounded-ui p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-ink">任务完成标准年度达成表</h3>
          <p className="mt-2 text-sm font-semibold text-muted">
            {canEdit
              ? `${reportingLabel} · 可填报年度目标、年度进度和达成说明。`
              : isLockedForSupport
                ? '协同部门 · 填报框已锁定，可查看牵头部门填报的年度目标、进度和达成说明。'
                : '战略管理部门 · 查看各部门年度目标、年度进度和达成说明。'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setTableMode('all')} className={`h-9 rounded-xl px-4 text-sm font-bold ${tableMode === 'all' ? 'bg-brand-500 text-white' : 'bg-[#F6F9FE] text-muted'}`}>全周期</button>
          <button onClick={() => setTableMode('single')} className={`h-9 rounded-xl px-4 text-sm font-bold ${tableMode === 'single' ? 'bg-brand-500 text-white' : 'bg-[#F6F9FE] text-muted'}`}>单年度</button>
          <select className="h-9 rounded-xl border border-[#D9E3F2] bg-white px-3 text-sm font-bold text-ink" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value) as Year)}>
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <button type="button" onClick={() => setShowRule((value) => !value)} className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#D9E3F2] bg-white px-3 text-sm font-bold text-brand-500"><Info size={15} /> 计算口径</button>
        </div>
      </div>
      {showRule && <div className="mb-4 rounded-xl border border-[#D9E3F2] bg-white p-3 text-sm leading-6 text-muted">{progressExplanation}</div>}

      <div className="completion-table-shell">
        <div className="completion-table-scroll thin-scroll">
          <table className="completion-table" style={{ minWidth }}>
            <colgroup>
              <col style={{ width: 56 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 88 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 112 }} />
              {visibleYears.map((year) => <YearCols key={year} />)}
            </colgroup>
            <thead>
              <tr>
                <StickyHeader left={0} rowSpan={2}>序号</StickyHeader>
                <StickyHeader left={56} rowSpan={2}>完成标准项</StickyHeader>
                <StickyHeader left={276} rowSpan={2}>类型</StickyHeader>
                <StickyHeader left={364} rowSpan={2}>单位</StickyHeader>
                <StickyHeader left={444} rowSpan={2}>最终目标</StickyHeader>
                <StickyHeader left={594} rowSpan={2} shadow>目标时间</StickyHeader>
                {visibleYears.map((year) => <th key={year} colSpan={4} className="year-head">{year}</th>)}
              </tr>
              <tr>
                {visibleYears.map((year) => (
                  <FragmentHeaders key={year} year={year} />
                ))}
              </tr>
            </thead>
            <tbody>
              {standards.map((standard) => (
                <tr key={standard.id}>
                  <StickyCell left={0} className="font-black text-brand-500">{standard.order}</StickyCell>
                  <StickyCell left={56}>
                    <div className="whitespace-pre-wrap font-bold leading-6 text-ink">{standard.name || standard.sourceText}</div>
                    {normalizeText(standard.name || standard.sourceText) !== normalizeText(standard.sourceText) && (
                      <div className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted">{standard.sourceText}</div>
                    )}
                  </StickyCell>
                  <StickyCell left={276}>{standardTypeLabel(standard.type)}</StickyCell>
                  <StickyCell left={364}>{standard.unit || '—'}</StickyCell>
                  <StickyCell left={444} className="font-bold text-ink">{standard.finalTargetText || '—'}</StickyCell>
                  <StickyCell left={594} shadow>{standard.finalTargetDate || (standard.finalTargetYear ? `${standard.finalTargetYear}` : '—')}</StickyCell>
                  {visibleYears.map((year) => {
                    return (
                      <YearCells
                        key={year}
                        standard={standard}
                        task={task}
                        year={year}
                        departmentId={departmentId}
                        report={reports.find((item) => item.taskId === task.id && item.standardId === standard.id && item.year === year && item.departmentId === departmentId)}
                        allReports={reports.filter((item) => item.taskId === task.id && item.standardId === standard.id && item.year === year)}
                        canEdit={canEdit}
                        targetOverride={targetState.targets[targetKey(standard.id, year)]}
                        onSaveReport={saveYearReport}
                        onSaveTarget={(value) => saveTarget(standard.id, year, value)}
                      />
                    );
                  })}
                </tr>
              ))}
              {!standards.length && (
                <tr>
                  <td colSpan={visibleYears.length * 4 + 6} className="px-4 py-10 text-center text-sm font-semibold text-muted">暂无完成标准</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function YearCols() {
  return (
    <>
      <col style={{ width: 140 }} />
      <col style={{ width: 112 }} />
      <col style={{ width: 180 }} />
      <col style={{ width: 150 }} />
    </>
  );
}

function FragmentHeaders({ year }: { year: Year }) {
  return (
    <>
      <th>{year}年度目标</th>
      <th>{year}年度进度</th>
      <th>{year}达成说明</th>
      <th>距最终目标差异</th>
    </>
  );
}

function YearCells({
  standard,
  task,
  year,
  departmentId,
  report,
  allReports,
  canEdit,
  targetOverride,
  onSaveReport,
  onSaveTarget,
}: {
  standard: CompletionStandardItem;
  task: StrategicTask;
  year: Year;
  departmentId: string;
  report?: AnnualStandardReport;
  allReports: AnnualStandardReport[];
  canEdit: boolean;
  targetOverride?: string;
  onSaveReport: (report: AnnualStandardReport) => void;
  onSaveTarget: (value: string) => void;
}) {
  const plannedTarget = getPlannedTarget(standard, year);
  const progress = report?.manualProgress ?? calculateStandardYearProgress(task, year, []);
  const plannedGap = calculatePlannedFinalGap(standard, year);
  const [target, setTarget] = useState(targetOverride ?? (plannedTarget == null ? '' : formatTargetValue(plannedTarget, standard.unit)));
  const [progressValue, setProgressValue] = useState(progress == null ? '' : String(progress));
  const [actualText, setActualText] = useState(report?.actualText ?? '');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const readonlyProgress = getReadonlyProgress(task, year, allReports);
  const readonlyDescription = allReports.length
    ? allReports.map((item) => `${departmentNameForReport(task, item.departmentId)}：${item.actualText || item.note || '已填报'}`).join('\n')
    : '暂无部门填报';

  function handleSave() {
    if (!actualText.trim()) {
      setSaveError('请先填写达成情况或成果说明。');
      return;
    }
    const nextProgress = parseProgress(progressValue);
    onSaveTarget(target);
    onSaveReport({
      taskId: task.id,
      standardId: standard.id,
      year,
      departmentId,
      actualValue: null,
      actualText,
      manualProgress: nextProgress,
      note: target ? `年度目标：${target}` : '',
      reportStatus: 'completed',
    });
    setSaved(true);
    setSaveError('');
    window.setTimeout(() => setSaved(false), 1400);
  }

  return (
    <>
      <td>
        {canEdit ? (
          <textarea
            className="min-h-16 w-full rounded-lg border border-[#D9E3F2] bg-white px-2 py-1 text-xs font-bold leading-5 text-ink outline-none focus:border-brand-500"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="填写年度目标"
          />
        ) : (
          <div className="whitespace-pre-wrap rounded-lg bg-[#F8FBFF] px-2 py-2 text-xs font-bold leading-5 text-ink">{target || '—'}</div>
        )}
      </td>
      <td>
        {canEdit ? (
          <div className="rounded-lg border border-[#D9E3F2] bg-white px-2 py-2">
            <div className="mb-1 flex items-center justify-between text-xs"><span className="text-muted">拖动进度</span><span className="font-black text-brand-500">{progressValue || '0'}%</span></div>
            <input type="range" min="0" max="100" step="5" className="w-full accent-[#155EEF]" value={progressValue || '0'} onChange={(event) => setProgressValue(event.target.value)} aria-label={`${year}年度进度`} />
            <button type="button" onClick={() => setProgressValue('100')} className="mt-1 text-[11px] font-bold text-brand-500">标记完成（100%）</button>
          </div>
        ) : (
          <div className="rounded-lg bg-[#F8FBFF] px-2 py-2 text-xs font-black text-brand-500">{readonlyProgress == null ? '—' : `${readonlyProgress}%`}</div>
        )}
      </td>
      <td>
        {canEdit ? (
          <>
            <textarea
              className="min-h-16 w-full rounded-lg border border-[#D9E3F2] bg-white px-2 py-1 text-xs leading-5 text-ink outline-none focus:border-brand-500"
              value={actualText}
              onChange={(event) => { setActualText(event.target.value); setSaveError(''); }}
              placeholder="填写达成情况、成果或说明"
            />
            {saveError && <div className="mt-1 text-xs font-bold text-[#D92D20]">{saveError}</div>}
            <button type="button" onClick={handleSave} className="mt-2 h-7 rounded-lg bg-brand-500 px-3 text-xs font-bold text-white">
              {saved ? '已保存' : '保存进度'}
            </button>
          </>
        ) : (
          <div className="whitespace-pre-wrap rounded-lg bg-[#F8FBFF] px-2 py-2 text-xs leading-5 text-ink">{readonlyDescription}</div>
        )}
      </td>
      <td>
        {plannedGap !== '—' && <div className="mt-1 text-xs leading-5 text-muted">{plannedGap}</div>}
        {plannedGap === '—' && <div>—</div>}
      </td>
    </>
  );
}

function TaskDetailEditor({ defaultOpen = false, task, onSave }: { defaultOpen?: boolean; task: StrategicTask; onSave: (patch: Partial<StrategicTask>) => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState(task.title);
  const [objective, setObjective] = useState(task.objective);
  const [businessArea, setBusinessArea] = useState(task.businessArea);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [period, setPeriod] = useState(task.period);
  const [measuresText, setMeasuresText] = useState(task.measures.map((measure) => measure.title).join('\n'));
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const measures = measuresText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .map<Measure>((item, index) => ({
        id: task.measures[index]?.id ?? `${task.id}-custom-measure-${index + 1}`,
        title: item,
        description: item,
        nodes: task.measures[index]?.nodes ?? [],
      }));
    onSave({
      title,
      objective,
      businessArea,
      priority,
      period,
      measures,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }

  return (
    <section className="soft-panel rounded-ui p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-ink">任务细节编辑</h3>
          <p className="mt-1 text-sm font-semibold text-muted">可修改当前任务卡展示信息，保存到本地演示数据。</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="h-9 rounded-xl bg-brand-50 px-4 text-sm font-bold text-brand-500">
          {open ? '收起' : '编辑任务细节'}
        </button>
      </div>

      {open && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-bold text-muted">任务名称</span>
            <input className="mt-1 h-10 w-full rounded-xl border border-[#D9E3F2] px-3 text-sm outline-none focus:border-brand-500" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-muted">业务板块</span>
            <input className="mt-1 h-10 w-full rounded-xl border border-[#D9E3F2] px-3 text-sm outline-none focus:border-brand-500" value={businessArea} onChange={(event) => setBusinessArea(event.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-muted">优先级</span>
            <select className="mt-1 h-10 w-full rounded-xl border border-[#D9E3F2] px-3 text-sm outline-none focus:border-brand-500" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
              <option value="">—</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-muted">实施时间</span>
            <input className="mt-1 h-10 w-full rounded-xl border border-[#D9E3F2] px-3 text-sm outline-none focus:border-brand-500" value={period} onChange={(event) => setPeriod(event.target.value)} />
          </label>
          <label className="col-span-2 block">
            <span className="text-xs font-bold text-muted">任务目标</span>
            <textarea className="mt-1 min-h-24 w-full rounded-xl border border-[#D9E3F2] px-3 py-2 text-sm leading-6 outline-none focus:border-brand-500" value={objective} onChange={(event) => setObjective(event.target.value)} />
          </label>
          <label className="col-span-2 block">
            <span className="text-xs font-bold text-muted">关键实施举措</span>
            <textarea className="mt-1 min-h-32 w-full rounded-xl border border-[#D9E3F2] px-3 py-2 text-sm leading-6 outline-none focus:border-brand-500" value={measuresText} onChange={(event) => setMeasuresText(event.target.value)} />
          </label>
          <div className="col-span-2 flex justify-end">
            <button type="button" onClick={handleSave} className="h-10 rounded-xl bg-brand-500 px-5 text-sm font-bold text-white">
              {saved ? '已保存' : '保存任务细节'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function targetKey(standardId: string, year: Year) {
  return `${standardId}:${year}`;
}

function parseProgress(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getReadonlyProgress(task: StrategicTask, year: Year, reports: AnnualStandardReport[]) {
  const reported = reports
    .map((report) => report.manualProgress)
    .filter((value): value is number => value != null);
  if (reported.length) return Math.round(reported.reduce((sum, value) => sum + value, 0) / reported.length);
  return calculateStandardYearProgress(task, year, []);
}

function departmentNameForReport(task: StrategicTask, departmentId: string) {
  if (departmentId === task.leadDepartmentId) return task.leadDepartmentName;
  const index = task.supportingDepartmentIds.indexOf(departmentId);
  if (index >= 0) return task.supportingDepartmentNames[index] ?? departmentId;
  return departmentId;
}

function StickyHeader({ children, left, rowSpan, shadow = false }: { children: React.ReactNode; left: number; rowSpan: number; shadow?: boolean }) {
  return <th rowSpan={rowSpan} className={`sticky-col sticky-head ${shadow ? 'sticky-shadow' : ''}`} style={{ left }}>{children}</th>;
}

function StickyCell({ children, left, shadow = false, className = '' }: { children: React.ReactNode; left: number; shadow?: boolean; className?: string }) {
  return <td className={`sticky-col ${shadow ? 'sticky-shadow' : ''} ${className}`} style={{ left }}>{children}</td>;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F8FBFF] p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-sm font-bold leading-6 text-ink">{value || '—'}</div>
    </div>
  );
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, '').replace(/[，,。.;；:：]/g, '');
}

function formatTargetValue(value: number | string, unit: string | null) {
  if (typeof value === 'string') return `${value}${unit ?? ''}`;
  const rounded = unit?.includes('户') || unit === '人'
    ? Math.round(value).toLocaleString('zh-CN')
    : value.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  return `${rounded}${unit ?? ''}`;
}

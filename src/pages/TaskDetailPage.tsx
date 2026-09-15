import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, LockKeyhole } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { CURRENT_DEMO_YEAR } from '../data/constants';
import { useAuth } from '../hooks/useAuth';
import { useQuarterlyReports } from '../hooks/useQuarterlyReports';
import { useTaskReporting } from '../hooks/useTaskReporting';
import type { Measure, Priority, Quarter, QuarterlyTaskReport, StrategicTask, Year } from '../types';
import { getTaskImplementationYears } from '../utils/taskCalculations';
import { canViewTask, getTaskLeads, getTaskRelation } from '../utils/taskSelectors';
import { getTaskStandards } from '../utils/progressCalculations';
import { calculateMeasureYearProgress, calculateTaskOverallQuarterProgress, calculateTaskYearQuarterProgress, getMeasureFilledQuarters, getQuarterReport, getTaskQuarterStats, quarters } from '../utils/quarterlyProgress';

type Tab = 'overview' | 'quarters';

export function TaskDetailPage() {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tasks, updateTask } = useTaskReporting();
  const { reports, saveReport } = useQuarterlyReports();
  const task = tasks.find((item) => item.id === taskId);
  const queryYear = Number(searchParams.get('year')) as Year;
  const editMode = searchParams.get('mode') === 'edit';
  const [tab, setTab] = useState<Tab>(editMode ? 'quarters' : 'overview');
  const [selectedYear, setSelectedYear] = useState<Year>(queryYear || CURRENT_DEMO_YEAR);

  if (!task) return <EmptyState text="未找到任务卡片" />;
  if (!canViewTask(task, user)) return <Navigate to="/workbench?notice=unauthorized-task" replace />;

  const relation = getTaskRelation(task, user?.departmentId);
  const standards = getTaskStandards(task.id);
  const implementationYears = getTaskImplementationYears(task);
  const activeYear = implementationYears.includes(selectedYear) ? selectedYear : implementationYears[0] ?? CURRENT_DEMO_YEAR;
  const canEdit = user?.role === 'department' && relation === 'lead';
  const isLockedForSupport = user?.role === 'department' && relation === 'support';
  const overallProgress = calculateTaskOverallQuarterProgress(task, reports);

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex items-center justify-between">
        <Link to={user?.role === 'strategy' ? '/tasks' : '/workbench'} className="inline-flex items-center gap-2 text-sm font-bold text-brand-500"><ArrowLeft size={18} /> {user?.role === 'strategy' ? '返回战略任务' : '返回工作台'}</Link>
        <button onClick={() => setTab('quarters')} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold ${canEdit ? 'bg-brand-500 text-white' : 'border border-[#D9E3F2] bg-[#F8FBFF] text-muted'}`}>
          {!canEdit && <LockKeyhole size={15} />}{canEdit ? '填报季度进度' : isLockedForSupport ? '查看季度进度（只读）' : '查看季度进度'}
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
          <InfoBox label="整体进度" value={overallProgress == null ? '—' : `${overallProgress}%`} />
        </div>
      </section>

      {canEdit && editMode && <TaskDetailEditor defaultOpen task={task} onSave={(patch) => updateTask(task.id, patch)} />}

      <div className="soft-panel rounded-ui p-2"><div className="flex gap-2">
        {[{ key: 'overview' as Tab, label: '任务总览' }, { key: 'quarters' as Tab, label: canEdit ? '季度进度填报' : '季度进度查看' }].map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} className={`h-11 rounded-[14px] px-5 text-sm font-bold transition ${tab === item.key ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-muted hover:bg-brand-50 hover:text-brand-500'}`}>{item.label}</button>
        ))}
      </div></div>

      {tab === 'overview' && <TaskOverview task={task} />}
      {tab === 'quarters' && <QuarterlyProgressPanel task={task} year={activeYear} implementationYears={implementationYears} setYear={setSelectedYear} canEdit={canEdit} isLockedForSupport={isLockedForSupport} departmentId={user?.departmentId ?? task.leadDepartmentId} reports={reports} saveReport={saveReport} />}
    </div>
  );
}

function TaskOverview({ task }: { task: StrategicTask }) {
  const standards = getTaskStandards(task.id);
  return <div className="space-y-5">
    <section className="soft-panel rounded-ui p-5"><h3 className="text-xl font-black text-ink">关键实施举措</h3><div className="mt-4 space-y-4">
      {task.measures.map((measure, index) => {
        const sameContent = normalizeText(measure.title) === normalizeText(measure.description);
        return <article key={measure.id} className="rounded-ui border border-[#D9E3F2] bg-white p-5"><div className="text-sm font-black text-brand-500">举措 {index + 1}</div>{sameContent ? <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-7 text-[#344054]">{measure.title}</p> : <><h4 className="mt-2 text-base font-black text-ink">{measure.title}</h4><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#344054]">{measure.description}</p></>}</article>;
      })}
    </div></section>
    <section className="soft-panel rounded-ui p-5"><h3 className="text-xl font-black text-ink">任务完成标准</h3><div className="mt-4 space-y-3">
      {standards.map((standard) => <article key={standard.id} className="rounded-ui border border-[#D9E3F2] bg-white p-4"><div className="text-sm font-black text-brand-500">标准 {standard.order}</div><p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-[#344054]">{standard.name || standard.sourceText}</p>{normalizeText(standard.name || standard.sourceText) !== normalizeText(standard.sourceText) && <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-muted">{standard.sourceText}</p>}</article>)}
      {!standards.length && <div className="rounded-xl bg-[#F8FBFF] p-4 text-sm font-semibold text-muted">暂无完成标准</div>}
    </div></section>
  </div>;
}

function QuarterlyProgressPanel({ task, year, implementationYears, setYear, canEdit, isLockedForSupport, departmentId, reports, saveReport }: { task: StrategicTask; year: Year; implementationYears: Year[]; setYear: (year: Year) => void; canEdit: boolean; isLockedForSupport: boolean; departmentId: string; reports: QuarterlyTaskReport[]; saveReport: (report: QuarterlyTaskReport) => void }) {
  const progressDepartmentId = canEdit ? departmentId : undefined;
  const stats = getTaskQuarterStats(task, year, reports, progressDepartmentId);
  const yearProgress = calculateTaskYearQuarterProgress(task, year, reports, progressDepartmentId) ?? 0;
  return <section className="soft-panel rounded-ui p-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-xl font-black text-ink">关键举措季度进度{canEdit ? '填报' : '查看'}</h3><p className="mt-2 text-sm font-semibold text-muted">{canEdit ? '所有牵头部门统一填写填报内容（完成情况）和预计完成时间节点；任一项有内容，该季度计 25%。' : isLockedForSupport ? '协同部门为只读状态，可查看牵头部门填写的内容和预计完成时间节点。' : '战略管理部门查看各牵头部门的填报内容、预计完成时间节点及汇总进度。'}</p></div><div className="flex flex-wrap gap-2">{implementationYears.map((item) => <button key={item} onClick={() => setYear(item)} className={`h-9 rounded-xl px-4 text-sm font-bold ${year === item ? 'bg-brand-500 text-white' : 'bg-[#F6F9FE] text-muted'}`}>{item}</button>)}</div></div>
    <div className="mt-5 rounded-ui bg-[#F8FBFF] p-4">
      <div className="flex items-center justify-between"><span className="font-black text-ink">{year} 年关键举措填报概览</span><span className="text-2xl font-black text-brand-500">{yearProgress}%</span></div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm"><SummaryBox label="关键举措" value={`${stats.measureCount} 项`} /><SummaryBox label="已完成举措" value={`${stats.completedMeasures} 项`} /><SummaryBox label="已填报季度单元" value={`${stats.filledSlots} / ${stats.totalSlots}`} /></div>
      <div className="mt-3 grid grid-cols-4 gap-2">{stats.quarterStats.map((item) => <div key={item.quarter} className={`rounded-xl px-3 py-2 text-center text-sm font-bold ${item.filled === item.total && item.total > 0 ? 'bg-brand-500 text-white' : 'bg-white text-muted'}`}>第 {item.quarter} 季度 {item.filled}/{item.total}</div>)}</div>
    </div>
    <div className="mt-5 space-y-4">{task.measures.map((measure, index) => {
      const measureProgress = calculateMeasureYearProgress(task, measure.id, year, reports, progressDepartmentId) ?? 0;
      const filledQuarters = getMeasureFilledQuarters(task, measure.id, year, reports, progressDepartmentId);
      return <article key={measure.id} className="rounded-ui border border-[#D9E3F2] bg-white p-5">
        <div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="text-sm font-black text-brand-500">关键举措 {index + 1}</div><p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-7 text-[#344054]">{measure.title}</p></div><div className="shrink-0 text-right"><div className="text-xs font-bold text-muted">年度完成</div><div className="mt-1 text-2xl font-black text-brand-500">{measureProgress}%</div></div></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E5ECF6]"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyanx" style={{ width: `${measureProgress}%` }} /></div>
        <div className="mt-4 grid grid-cols-2 gap-3">{quarters.map((quarter) => <MeasureQuarterCard key={`${measure.id}-${year}-${quarter}`} task={task} measure={measure} year={year} quarter={quarter} departmentId={departmentId} canEdit={canEdit} filled={filledQuarters.includes(quarter)} reports={reports} saveReport={saveReport} />)}</div>
      </article>;
    })}</div>
  </section>;
}

function MeasureQuarterCard({ task, measure, year, quarter, departmentId, canEdit, filled, reports, saveReport }: { task: StrategicTask; measure: Measure; year: Year; quarter: Quarter; departmentId: string; canEdit: boolean; filled: boolean; reports: QuarterlyTaskReport[]; saveReport: (report: QuarterlyTaskReport) => void }) {
  const report = getQuarterReport(reports, task.id, measure.id, year, quarter, departmentId);
  const [content, setContent] = useState(report?.content ?? '');
  const [expectedCompletionTime, setExpectedCompletionTime] = useState(report?.expectedCompletionTime ?? '');
  const [saved, setSaved] = useState(false);
  const leadIds = new Set(getTaskLeads(task).map((lead) => lead.id));
  const visibleReports = reports.filter((item) => item.taskId === task.id && item.measureId === measure.id && item.year === year && item.quarter === quarter && leadIds.has(item.departmentId));
  function handleSave() {
    saveReport({ taskId: task.id, measureId: measure.id, year, quarter, departmentId, content, expectedCompletionTime, updatedAt: new Date().toISOString() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }
  return <div className="rounded-xl border border-[#E4EBF5] bg-[#FBFDFF] p-4">
    <div className="flex items-center justify-between"><div className="font-black text-ink">第 {quarter} 季度</div>{filled ? <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-bold text-[#027A48]"><CheckCircle2 size={14} /> 已填报 · +25%</span> : <span className="rounded-full bg-[#F2F4F7] px-3 py-1 text-xs font-bold text-muted">待填报</span>}</div>
    {canEdit ? <>
      <label className="mt-3 block">
        <span className="text-xs font-bold text-muted">填报内容（完成情况）</span>
        <textarea className="mt-1 min-h-24 w-full rounded-xl border border-[#D9E3F2] bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-brand-500" value={content} onChange={(event) => setContent(event.target.value)} placeholder="填写该举措本季度已完成的工作、成果或进展情况" />
      </label>
      <label className="mt-3 block">
        <span className="text-xs font-bold text-muted">填报预计完成时间节点</span>
        <textarea className="mt-1 min-h-20 w-full rounded-xl border border-[#D9E3F2] bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-brand-500" value={expectedCompletionTime} onChange={(event) => setExpectedCompletionTime(event.target.value)} placeholder="填写预计完成日期或阶段性时间节点" />
      </label>
      <div className="mt-3 flex justify-end"><button type="button" onClick={handleSave} className="h-9 rounded-xl bg-brand-500 px-4 text-sm font-bold text-white">{saved ? '已保存' : '保存本季度'}</button></div>
    </> : visibleReports.length ? <div className="mt-3 space-y-2">{visibleReports.map((item) => <div key={`${item.departmentId}-${item.updatedAt}`} className="rounded-xl bg-white px-3 py-3 text-sm leading-6">
      <div className="mb-2 text-xs font-bold text-brand-500">{departmentName(task, item.departmentId)}</div>
      <div className="text-xs font-bold text-muted">填报内容（完成情况）</div>
      <div className="mt-1 whitespace-pre-wrap text-[#344054]">{item.content || '未填写'}</div>
      <div className="mt-3 text-xs font-bold text-muted">预计完成时间节点</div>
      <div className="mt-1 whitespace-pre-wrap text-[#344054]">{item.expectedCompletionTime || '未填写'}</div>
    </div>)}</div> : <div className="mt-3 rounded-xl bg-white px-3 py-5 text-center text-sm text-muted">该举措本季度暂无填报内容</div>}
  </div>;
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white px-3 py-3"><div className="text-xs font-bold text-muted">{label}</div><div className="mt-1 font-black text-ink">{value}</div></div>;
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
    const measures = measuresText.split('\n').map((item) => item.trim()).filter(Boolean).map<Measure>((item, index) => ({ id: task.measures[index]?.id ?? `${task.id}-custom-measure-${index + 1}`, title: item, description: item, nodes: task.measures[index]?.nodes ?? [] }));
    onSave({ title, objective, businessArea, priority, period, measures });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }
  return <section className="soft-panel rounded-ui p-5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-black text-ink">任务细节编辑</h3><p className="mt-1 text-sm font-semibold text-muted">可修改当前任务卡展示信息，保存到本地演示数据。</p></div><button type="button" onClick={() => setOpen((value) => !value)} className="h-9 rounded-xl bg-brand-50 px-4 text-sm font-bold text-brand-500">{open ? '收起' : '编辑任务细节'}</button></div>{open && <div className="mt-4 grid grid-cols-2 gap-4">
    <label className="block"><span className="text-xs font-bold text-muted">任务名称</span><input className="mt-1 h-10 w-full rounded-xl border border-[#D9E3F2] px-3 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label className="block"><span className="text-xs font-bold text-muted">业务板块</span><input className="mt-1 h-10 w-full rounded-xl border border-[#D9E3F2] px-3 text-sm" value={businessArea} onChange={(event) => setBusinessArea(event.target.value)} /></label>
    <label className="block"><span className="text-xs font-bold text-muted">优先级</span><select className="mt-1 h-10 w-full rounded-xl border border-[#D9E3F2] px-3 text-sm" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option value="高">高</option><option value="中">中</option><option value="低">低</option><option value="">—</option></select></label><label className="block"><span className="text-xs font-bold text-muted">实施时间</span><input className="mt-1 h-10 w-full rounded-xl border border-[#D9E3F2] px-3 text-sm" value={period} onChange={(event) => setPeriod(event.target.value)} /></label>
    <label className="col-span-2 block"><span className="text-xs font-bold text-muted">任务目标</span><textarea className="mt-1 min-h-24 w-full rounded-xl border border-[#D9E3F2] px-3 py-2 text-sm leading-6" value={objective} onChange={(event) => setObjective(event.target.value)} /></label><label className="col-span-2 block"><span className="text-xs font-bold text-muted">关键实施举措</span><textarea className="mt-1 min-h-32 w-full rounded-xl border border-[#D9E3F2] px-3 py-2 text-sm leading-6" value={measuresText} onChange={(event) => setMeasuresText(event.target.value)} /></label><div className="col-span-2 flex justify-end"><button type="button" onClick={handleSave} className="h-10 rounded-xl bg-brand-500 px-5 text-sm font-bold text-white">{saved ? '已保存' : '保存任务细节'}</button></div>
  </div>}</section>;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#F8FBFF] p-3"><div className="text-xs text-muted">{label}</div><div className="mt-1 text-sm font-bold leading-6 text-ink">{value || '—'}</div></div>;
}

function departmentName(task: StrategicTask, departmentId: string) {
  return getTaskLeads(task).find((item) => item.id === departmentId)?.name ?? departmentId;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, '').replace(/[，,。.;；:：]/g, '');
}

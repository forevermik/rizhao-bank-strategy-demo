import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Search } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { TaskCard } from '../components/task/TaskCard';
import { useQuarterlyReports } from '../hooks/useQuarterlyReports';
import { useTaskReporting } from '../hooks/useTaskReporting';
import type { StrategicTask, Year } from '../types';
import { getTaskLeads } from '../utils/taskSelectors';
import { years } from '../utils/taskCalculations';
import { hasPlanningConfiguration } from '../utils/progressCalculations';
import { calculateQuarterlyReportingStatus, calculateTaskOverallQuarterProgress, calculateTaskYearQuarterProgress, isTaskQuarterlyCompleted } from '../utils/quarterlyProgress';

type StrategyTaskTab = 'all' | 'planning-configured' | 'planning-missing' | 'reported' | 'unreported' | 'completed';

export function TaskListPage() {
  const [searchParams] = useSearchParams();
  const { tasks } = useTaskReporting();
  const { reports } = useQuarterlyReports();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<StrategyTaskTab>('all');
  const [area, setArea] = useState('全部板块');
  const [dept, setDept] = useState(searchParams.get('lead') ?? '全部部门');
  const [year, setYear] = useState<Year>(2026);
  const [tag, setTag] = useState('全部标签');
  const [view, setView] = useState<'card' | 'table'>('card');
  const areas = ['全部板块', ...Array.from(new Set(tasks.map((task) => task.businessArea)))];
  const departments = [
    { id: '全部部门', name: '全部部门' },
    ...Array.from(new Map(tasks.flatMap(getTaskLeads).map((lead) => [lead.id, lead])).values()),
  ];
  const counts = {
    all: tasks.length,
    planningConfigured: tasks.filter(hasPlanningConfiguration).length,
    planningMissing: tasks.filter((task) => !hasPlanningConfiguration(task)).length,
    reported: tasks.filter((task) => (calculateTaskYearQuarterProgress(task, year, reports) ?? 0) > 0).length,
    unreported: tasks.filter((task) => (calculateTaskYearQuarterProgress(task, year, reports) ?? 0) === 0).length,
    completed: tasks.filter((task) => isTaskQuarterlyCompleted(task, reports)).length,
  };
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const textOk = !normalized || `${task.code}${task.title}${task.leadDepartmentName}${task.supportingDepartmentNames.join('')}`.toLowerCase().includes(normalized);
      const areaOk = area === '全部板块' || task.businessArea === area;
      const deptOk = dept === '全部部门' || getTaskLeads(task).some((lead) => lead.id === dept);
      const tagOk = tag === '全部标签' || task.tag === tag;
      const statusOk =
        tab === 'all'
        || (tab === 'reported' && (calculateTaskYearQuarterProgress(task, year, reports) ?? 0) > 0)
        || (tab === 'unreported' && (calculateTaskYearQuarterProgress(task, year, reports) ?? 0) === 0)
        || (tab === 'planning-configured' && hasPlanningConfiguration(task))
        || (tab === 'planning-missing' && !hasPlanningConfiguration(task))
        || (tab === 'completed' && isTaskQuarterlyCompleted(task, reports));
      return textOk && areaOk && deptOk && tagOk && statusOk;
    });
  }, [area, dept, tag, query, reports, tab, tasks, year]);

  return (
    <div className="space-y-5">
      <div className="soft-panel rounded-ui p-5">
        <div className="mb-2 text-xs font-black text-muted">目标配置情况</div>
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ['all', `全部任务 ${counts.all}`],
            ['planning-configured', `已配置规划目标 ${counts.planningConfigured}`],
            ['planning-missing', `缺少规划目标 ${counts.planningMissing}`],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as StrategyTaskTab)} className={`h-10 rounded-xl px-4 text-sm font-bold ${tab === key ? 'bg-brand-500 text-white' : 'bg-[#F6F9FE] text-muted hover:text-brand-500'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="mb-2 text-xs font-black text-muted">进度状态</div>
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ['reported', `已有季度填报 ${counts.reported}`],
            ['unreported', `季度待填报 ${counts.unreported}`],
            ['completed', `已达成 ${counts.completed}`],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as StrategyTaskTab)} className={`h-10 rounded-xl px-4 text-sm font-bold ${tab === key ? 'bg-brand-500 text-white' : 'bg-[#F6F9FE] text-muted hover:text-brand-500'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_160px_170px_130px_130px_auto] gap-3">
          <div className="flex h-11 flex-1 items-center gap-3 rounded-ui border border-[#D9E3F2] bg-white px-4">
            <Search className="text-muted" size={18} />
            <input className="flex-1 outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索编号、任务名称、部门" />
          </div>
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-3" value={area} onChange={(event) => setArea(event.target.value)}>{areas.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-3" value={dept} onChange={(event) => setDept(event.target.value)}>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-3" value={year} onChange={(event) => setYear(Number(event.target.value) as Year)}>{years.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-3" aria-label="任务标签" value={tag} onChange={(event) => setTag(event.target.value)}>{['全部标签', ...Array.from(new Set(tasks.map((task) => task.tag || '')))].map((item) => <option key={item} value={item}>{item || '—'}</option>)}</select>
          <div className="flex rounded-ui border border-[#D9E3F2] bg-white p-1">
            <button className={`grid h-9 w-9 place-items-center rounded-xl ${view === 'card' ? 'bg-brand-500 text-white' : 'text-muted'}`} onClick={() => setView('card')} aria-label="卡片视图"><LayoutGrid size={18} /></button>
            <button className={`grid h-9 w-9 place-items-center rounded-xl ${view === 'table' ? 'bg-brand-500 text-white' : 'text-muted'}`} onClick={() => setView('table')} aria-label="表格视图"><List size={18} /></button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-ink">战略任务列表 <span className="text-brand-500">({filtered.length})</span></h2>
        <div className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-500">Excel 任务卡总数：{tasks.length} 张</div>
      </div>

      {view === 'card' ? (
        filtered.length ? <div className="grid grid-cols-3 gap-3">{filtered.map((task) => <TaskCard key={task.id} task={task} relation="none" year={year} />)}</div> : <EmptyState />
      ) : (
        <StrategyTaskTable tasks={filtered} reports={reports} year={year} />
      )}
    </div>
  );
}

function StrategyTaskTable({ tasks, reports, year }: { tasks: StrategicTask[]; reports: ReturnType<typeof useQuarterlyReports>['reports']; year: Year }) {
  return (
    <div className="soft-panel overflow-hidden rounded-ui">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[#F6F9FE] text-muted">
          <tr>
            {['编号', '任务名称', '业务板块', '牵头部门', '标签', '整体进度', `${year}填报状态`, '操作'].map((head) => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const overallProgress = calculateTaskOverallQuarterProgress(task, reports);
            return (
              <tr key={task.id} className="border-t border-[#E4EBF5] hover:bg-brand-50/50">
                <td className="px-4 py-4 font-extrabold text-brand-500">{task.code}</td>
                <td className="px-4 py-4"><Link className="font-bold text-ink hover:text-brand-500" to={`/tasks/${task.id}`}>{task.title}</Link></td>
                <td className="px-4 py-4 text-muted">{task.businessArea}</td>
                <td className="px-4 py-4 text-muted">{task.leadDepartmentName}</td>
                <td className="px-4 py-4">{task.tag || '—'}</td>
                <td className="px-4 py-4 font-bold text-brand-500">{overallProgress == null ? '—' : `${overallProgress}%`}</td>
                <td className="px-4 py-4">{calculateQuarterlyReportingStatus(task, task.leadDepartmentId, reports, year)}</td>
                <td className="px-4 py-4"><Link className="font-bold text-brand-500" to={`/tasks/${task.id}?year=${year}`}>查看进度</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

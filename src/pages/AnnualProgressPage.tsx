import { getTaskLeads } from '../utils/taskSelectors';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, ClockAlert, Database, ListChecks, Search } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { DEMO_DATA_AS_OF_DATE } from '../data/constants';
import { useAuth } from '../hooks/useAuth';
import { useCompletionReports } from '../hooks/useCompletionReports';
import { useTaskReporting } from '../hooks/useTaskReporting';
import type { CompletionStandardItem, StrategicTask, Year } from '../types';
import { years } from '../utils/taskCalculations';
import { calculateStandardYearProgress, getTaskStandards, isStandardApplicableToYear } from '../utils/progressCalculations';
import { getTaskRelation, getVisibleTasks } from '../utils/taskSelectors';

type StandardRow = {
  task: StrategicTask;
  standard: CompletionStandardItem;
  relation: 'lead' | 'support' | 'none';
};

export function AnnualProgressPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tasks } = useTaskReporting();
  const { reports } = useCompletionReports();
  const queryYear = Number(searchParams.get('year')) as Year;
  const [year, setYear] = useState<Year>(years.includes(queryYear) ? queryYear : 2026);
  const [reportStatus, setReportStatus] = useState(searchParams.get('overdue') === '1' ? '仅逾期' : '全部状态');
  const [taskId, setTaskId] = useState('全部任务');
  const [leadDept, setLeadDept] = useState('全部牵头部门');
  const [area, setArea] = useState('全部板块');
  const [standardType, setStandardType] = useState('全部标准类型');
  const [query, setQuery] = useState('');

  const visibleTasks = useMemo(() => getVisibleTasks(tasks, user), [tasks, user]);
  const taskOptions = [{ id: '全部任务', name: '全部任务' }, ...visibleTasks.map((task) => ({ id: task.id, name: `${task.code} ${task.title}` }))];
  const departmentOptions = [
    { id: '全部牵头部门', name: '全部牵头部门' },
    ...Array.from(new Map(visibleTasks.flatMap(getTaskLeads).map((lead) => [lead.id, lead])).values()),
  ];
  const areaOptions = ['全部板块', ...Array.from(new Set(visibleTasks.map((task) => task.businessArea)))];

  const rows: StandardRow[] = visibleTasks.flatMap((task) =>
    getTaskStandards(task.id)
      .filter((standard) => isStandardApplicableToYear(standard, year))
      .map((standard) => ({ task, standard, relation: getTaskRelation(task, user?.departmentId) })),
  );
  const filteredRows = rows.filter(({ task, standard }) => {
    const progress = calculateStandardYearProgress(task, year, reports);
    const overdue = isOverdueStandard(standard, progress);
    const keyword = query.trim();
    const statusOk =
      reportStatus === '全部状态'
      || (reportStatus === '有进度' && progress != null)
      || (reportStatus === '无进度' && progress == null)
      || (reportStatus === '已达成' && progress != null && progress >= 100)
      || (reportStatus === '仅逾期' && overdue);
    const taskOk = taskId === '全部任务' || task.id === taskId;
    const deptOk = leadDept === '全部牵头部门' || getTaskLeads(task).some((lead) => lead.id === leadDept);
    const areaOk = area === '全部板块' || task.businessArea === area;
    const typeOk = standardType === '全部标准类型' || (standardType === '指标类' ? standard.type === 'metric' : standard.type !== 'metric');
    const queryOk = !keyword || `${task.code}${task.title}${standard.name}${standard.sourceText}${task.leadDepartmentName}`.includes(keyword);
    return statusOk && taskOk && deptOk && areaOk && typeOk && queryOk;
  });
  const progressValues = filteredRows
    .map(({ task }) => calculateStandardYearProgress(task, year, reports))
    .filter((value): value is number => value != null);
  const averageProgress = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + Math.min(value, 100), 0) / filteredRows.length) : null;
  const completedCount = filteredRows.filter(({ task, standard }) => {
    const progress = calculateStandardYearProgress(task, year, reports);
    return progress != null && progress >= 100;
  }).length;
  const reportedCount = filteredRows.filter(({ task }) => calculateStandardYearProgress(task, year, reports) != null).length;
  const overdueCount = filteredRows.filter(({ task, standard }) => {
    const progress = calculateStandardYearProgress(task, year, reports);
    return isOverdueStandard(standard, progress);
  }).length;

  return (
    <div className="space-y-6">
      <div className="soft-panel rounded-ui p-4">
        <div className="flex flex-wrap items-center gap-2">
          {years.map((item) => (
            <button key={item} onClick={() => setYear(item)} className={`h-10 rounded-xl px-5 font-bold ${year === item ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-muted hover:bg-brand-50 hover:text-brand-500'}`}>
              {item}
            </button>
          ))}
          <div className="ml-auto flex h-10 min-w-[280px] items-center gap-2 rounded-xl border border-[#D9E3F2] bg-white px-3">
            <Search size={16} className="text-muted" />
            <input className="w-full outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务、完成标准、部门" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-3">
          <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
            {taskOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={leadDept} onChange={(event) => setLeadDept(event.target.value)}>
            {departmentOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={area} onChange={(event) => setArea(event.target.value)}>
            {areaOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={standardType} onChange={(event) => setStandardType(event.target.value)}>
            {['全部标准类型', '指标类', '非指标类'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={reportStatus} onChange={(event) => setReportStatus(event.target.value)}>
            {['全部状态', '有进度', '无进度', '已达成', '仅逾期'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard label="年度项目" value={filteredRows.length} icon={ListChecks} />
        <StatCard label="有进度项" value={reportedCount} icon={Database} tone="cyan" />
        <StatCard label="已达成标准项" value={completedCount} icon={CalendarCheck} tone="green" />
        <StatCard label="逾期标准项" value={overdueCount} icon={ClockAlert} tone="amber" />
        <StatCard label="进度" value={averageProgress == null ? '—' : averageProgress} suffix={averageProgress == null ? '' : '%'} icon={CalendarCheck} />
      </div>

      <section className="soft-panel overflow-hidden rounded-ui">
        <div className="flex items-center justify-between border-b border-[#E4EBF5] px-5 py-4">
          <h2 className="text-base font-extrabold text-ink">年度完成标准列表</h2>
          <span className="text-sm font-semibold text-muted">共 {filteredRows.length} 条</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#F6F9FE] text-muted">
              <tr>
                {['任务编号', '任务名称', '完成标准项', '牵头部门', '年度', '标准类型', '进度', '逾期', user?.role === 'department' ? '关系' : '负责部门', '操作'].map((head) => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(({ task, standard, relation }) => {
                const progress = calculateStandardYearProgress(task, year, reports);
                const overdue = isOverdueStandard(standard, progress);
                return (
                  <tr key={`${task.id}-${standard.id}`} className="border-t border-[#E4EBF5] hover:bg-brand-50/50">
                    <td className="px-4 py-3 font-black text-brand-500">{task.code}</td>
                    <td className="px-4 py-3 font-bold text-ink">{task.title}</td>
                    <td className="px-4 py-3">{standard.name || standard.sourceText}</td>
                    <td className="px-4 py-3 text-muted">{task.leadDepartmentName}</td>
                    <td className="px-4 py-3">{year}</td>
                    <td className="px-4 py-3">{standard.type === 'metric' ? '指标类' : '非指标类'}</td>
                    <td className="px-4 py-3">{progress == null ? '—' : `${progress}%`}</td>
                    <td className="px-4 py-3">{overdue ? <span className="font-bold text-[#B54708]">是</span> : '否'}</td>
                    <td className="px-4 py-3">{user?.role === 'department' ? (relation === 'lead' ? '牵头填报' : '协同查看') : task.leadDepartmentName}</td>
                    <td className="px-4 py-3"><Link className="font-bold text-brand-500" to={`/tasks/${task.id}?year=${year}${relation === 'lead' ? '&mode=edit' : ''}`}>{relation === 'lead' ? '进入填报' : '查看填报'}</Link></td>
                  </tr>
                );
              })}
              {!filteredRows.length && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm font-semibold text-muted">没有符合当前筛选条件的年度完成标准</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function isOverdueStandard(standard: CompletionStandardItem, progress: number | null) {
  return !!standard.finalTargetDate && standard.finalTargetDate < DEMO_DATA_AS_OF_DATE && (progress == null || progress < 100);
}

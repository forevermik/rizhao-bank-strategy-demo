import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, Database, ListChecks, Search } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { CURRENT_DEMO_YEAR } from '../data/constants';
import { useAuth } from '../hooks/useAuth';
import { useQuarterlyReports } from '../hooks/useQuarterlyReports';
import { useTaskReporting } from '../hooks/useTaskReporting';
import type { Measure, StrategicTask, Year } from '../types';
import { calculateMeasureYearProgress, getMeasureFilledQuarters, quarters } from '../utils/quarterlyProgress';
import { getTaskImplementationYears, years } from '../utils/taskCalculations';
import { getTaskLeads, getTaskRelation, getVisibleTasks } from '../utils/taskSelectors';

type MeasureRow = {
  task: StrategicTask;
  measure: Measure;
  measureIndex: number;
  relation: 'lead' | 'support' | 'none';
};

export function AnnualProgressPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { tasks } = useTaskReporting();
  const { reports } = useQuarterlyReports();
  const queryYear = Number(searchParams.get('year')) as Year;
  const [year, setYear] = useState<Year>(years.includes(queryYear) ? queryYear : CURRENT_DEMO_YEAR);
  const [reportStatus, setReportStatus] = useState('全部状态');
  const [taskId, setTaskId] = useState('全部任务');
  const [leadDept, setLeadDept] = useState('全部牵头部门');
  const [area, setArea] = useState('全部板块');
  const [query, setQuery] = useState('');

  const visibleTasks = useMemo(() => getVisibleTasks(tasks, user), [tasks, user]);
  const activeTasks = visibleTasks.filter((task) => getTaskImplementationYears(task).includes(year));
  const taskOptions = [{ id: '全部任务', name: '全部任务' }, ...activeTasks.map((task) => ({ id: task.id, name: `${task.code} ${task.title}` }))];
  const departmentOptions = [
    { id: '全部牵头部门', name: '全部牵头部门' },
    ...Array.from(new Map(activeTasks.flatMap(getTaskLeads).map((lead) => [lead.id, lead])).values()),
  ];
  const areaOptions = ['全部板块', ...Array.from(new Set(activeTasks.map((task) => task.businessArea)))];

  const rows: MeasureRow[] = activeTasks.flatMap((task) => task.measures.map((measure, measureIndex) => ({
    task,
    measure,
    measureIndex,
    relation: getTaskRelation(task, user?.departmentId),
  })));

  const filteredRows = rows.filter((row) => {
    const progress = getRowProgress(row, year, reports, user?.role === 'department' ? user.departmentId : undefined);
    const keyword = query.trim().toLowerCase();
    const statusOk = reportStatus === '全部状态'
      || (reportStatus === '未填报' && progress === 0)
      || (reportStatus === '填报中' && progress > 0 && progress < 100)
      || (reportStatus === '已完成' && progress === 100);
    const taskOk = taskId === '全部任务' || row.task.id === taskId;
    const deptOk = leadDept === '全部牵头部门' || getTaskLeads(row.task).some((lead) => lead.id === leadDept);
    const areaOk = area === '全部板块' || row.task.businessArea === area;
    const queryOk = !keyword || `${row.task.code}${row.task.title}${row.measure.title}${row.task.leadDepartmentName}`.toLowerCase().includes(keyword);
    return statusOk && taskOk && deptOk && areaOk && queryOk;
  });

  const progressValues = filteredRows.map((row) => getRowProgress(row, year, reports, user?.role === 'department' ? user.departmentId : undefined));
  const averageProgress = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : null;
  const inProgressCount = progressValues.filter((value) => value > 0 && value < 100).length;
  const completedCount = progressValues.filter((value) => value === 100).length;

  return (
    <div className="space-y-6">
      <section className="soft-panel rounded-ui p-4">
        <div className="flex flex-wrap items-center gap-2">
          {years.map((item) => (
            <button key={item} onClick={() => setYear(item)} className={`h-10 rounded-xl px-5 font-bold ${year === item ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-muted hover:bg-brand-50 hover:text-brand-500'}`}>
              {item}
            </button>
          ))}
          <div className="ml-auto flex h-10 min-w-[320px] items-center gap-2 rounded-xl border border-[#D9E3F2] bg-white px-3">
            <Search size={16} className="text-muted" />
            <input className="w-full outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务、关键举措、部门" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3">
          <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
            {taskOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={leadDept} onChange={(event) => setLeadDept(event.target.value)}>
            {departmentOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={area} onChange={(event) => setArea(event.target.value)}>
            {areaOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={reportStatus} onChange={(event) => setReportStatus(event.target.value)}>
            {['全部状态', '未填报', '填报中', '已完成'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="细分任务（关键实施举措）" value={filteredRows.length} icon={ListChecks} />
        <StatCard label="填报中举措" value={inProgressCount} icon={Database} tone="cyan" />
        <StatCard label="已完成举措" value={completedCount} icon={CalendarCheck} tone="green" />
        <StatCard label="年度填报进度" value={averageProgress == null ? '—' : averageProgress} suffix={averageProgress == null ? '' : '%'} icon={CalendarCheck} />
      </div>

      <section className="soft-panel overflow-hidden rounded-ui">
        <div className="flex items-center justify-between border-b border-[#E4EBF5] px-5 py-4">
          <div><h2 className="text-base font-extrabold text-ink">年度关键实施举措列表</h2><p className="mt-1 text-sm text-muted">每项举措按四个季度分别填报，每个有内容的季度计 25%。</p></div>
          <span className="text-sm font-semibold text-muted">共 {filteredRows.length} 项</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] border-collapse text-left text-sm">
            <thead className="bg-[#F6F9FE] text-muted">
              <tr>
                {['任务编号', '任务名称', '细分任务（关键实施举措）', '牵头部门', '年度', '季度填报', '年度进度', user?.role === 'department' ? '关系' : '负责部门', '操作'].map((head) => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const progressDepartmentId = user?.role === 'department' && row.relation === 'lead' ? user.departmentId : undefined;
                const progress = calculateMeasureYearProgress(row.task, row.measure.id, year, reports, progressDepartmentId) ?? 0;
                const filledQuarters = getMeasureFilledQuarters(row.task, row.measure.id, year, reports, progressDepartmentId);
                const canEdit = user?.role === 'department' && row.relation === 'lead';
                return (
                  <tr key={`${row.task.id}-${row.measure.id}`} className="border-t border-[#E4EBF5] hover:bg-brand-50/50">
                    <td className="px-4 py-3 font-black text-brand-500">{row.task.code}</td>
                    <td className="px-4 py-3 font-bold text-ink">{row.task.title}</td>
                    <td className="max-w-[430px] px-4 py-3 leading-6"><span className="mr-2 font-black text-brand-500">{row.measureIndex + 1}.</span>{stripMeasureNumber(row.measure.title)}</td>
                    <td className="px-4 py-3 text-muted">{row.task.leadDepartmentName}</td>
                    <td className="px-4 py-3">{year}</td>
                    <td className="px-4 py-3"><div className="flex gap-1">{quarters.map((quarter) => <span key={quarter} className={`rounded-lg px-2 py-1 text-xs font-bold ${filledQuarters.includes(quarter) ? 'bg-[#ECFDF3] text-[#027A48]' : 'bg-[#F2F4F7] text-muted'}`}>Q{quarter}</span>)}</div></td>
                    <td className="px-4 py-3"><span className={`font-black ${progress === 100 ? 'text-[#027A48]' : 'text-brand-500'}`}>{progress}%</span></td>
                    <td className="px-4 py-3">{user?.role === 'department' ? (row.relation === 'lead' ? '牵头填报' : '协同查看') : row.task.leadDepartmentName}</td>
                    <td className="px-4 py-3"><Link className="font-bold text-brand-500" to={`/tasks/${row.task.id}?year=${year}${canEdit ? '&mode=edit' : ''}`}>{canEdit ? '进入填报' : '查看填报'}</Link></td>
                  </tr>
                );
              })}
              {!filteredRows.length && <tr><td colSpan={9} className="px-4 py-10 text-center text-sm font-semibold text-muted">没有符合当前筛选条件的关键实施举措</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function getRowProgress(row: MeasureRow, year: Year, reports: ReturnType<typeof useQuarterlyReports>['reports'], departmentId?: string) {
  const progressDepartmentId = row.relation === 'lead' ? departmentId : undefined;
  return calculateMeasureYearProgress(row.task, row.measure.id, year, reports, progressDepartmentId) ?? 0;
}

function stripMeasureNumber(value: string) {
  return value.replace(/^\s*\d+\s*[、，,.．]\s*/, '');
}

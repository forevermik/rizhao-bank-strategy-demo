import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Edit3, LayoutGrid, List, LockKeyhole, Search } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { TaskCard } from '../components/task/TaskCard';
import { CURRENT_DEMO_YEAR } from '../data/constants';
import { useAuth } from '../hooks/useAuth';
import { useCompletionReports } from '../hooks/useCompletionReports';
import { useTaskReporting } from '../hooks/useTaskReporting';
import type { StrategicTask, Year } from '../types';
import { years } from '../utils/taskCalculations';
import { getLeadTasks, getSupportTasks, getTaskRelation, getVisibleTasks } from '../utils/taskSelectors';
import {
  calculateStandardOverallProgress,
  calculateStandardYearProgress,
  calculateTaskReportingStatus,
  isTaskCompletedByStandards,
  isTaskOverdueByStandards,
} from '../utils/progressCalculations';

type WorkbenchTab = 'pending' | 'reviewing' | 'approved' | 'overdue' | 'all' | 'lead' | 'support';

export function DepartmentWorkbenchPage() {
  const { user } = useAuth();
  const { tasks } = useTaskReporting();
  const { reports } = useCompletionReports();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<WorkbenchTab>(searchParams.get('view') === 'tasks' ? 'all' : 'pending');
  const [view, setView] = useState<'card' | 'table'>('card');
  const [year, setYear] = useState<Year>(CURRENT_DEMO_YEAR);
  const [status, setStatus] = useState('全部状态');
  const [priority, setPriority] = useState('全部优先级');
  const [query, setQuery] = useState('');

  const visibleTasks = useMemo(() => getVisibleTasks(tasks, user), [tasks, user]);
  const leadTasks = useMemo(() => getLeadTasks(visibleTasks, user?.departmentId), [user?.departmentId, visibleTasks]);
  const supportTasks = useMemo(() => getSupportTasks(visibleTasks, user?.departmentId), [user?.departmentId, visibleTasks]);
  const pendingTasks = leadTasks.filter((task) => calculateTaskReportingStatus(task, user?.departmentId, reports, year) === '待更新');
  const reviewingTasks = leadTasks.filter((task) => calculateTaskReportingStatus(task, user?.departmentId, reports, year) === '待审核');
  const approvedTasks = leadTasks.filter((task) => calculateTaskReportingStatus(task, user?.departmentId, reports, year) === '审核通过');
  const overdueTasks = visibleTasks.filter((task) => isTaskOverdueByStandards(task, reports));

  const tabTasks = tab === 'lead' ? leadTasks : tab === 'support' ? supportTasks : tab === 'pending' ? pendingTasks : tab === 'reviewing' ? reviewingTasks : tab === 'approved' ? approvedTasks : tab === 'overdue' ? overdueTasks : visibleTasks;
  const filteredTasks = tabTasks
    .filter((task) => {
      const reportingStatus = calculateTaskReportingStatus(task, user?.departmentId, reports, year);
      const statusOk = status === '全部状态' || reportingStatus === status;
      const priorityOk = priority === '全部优先级' || task.priority === priority;
      const q = query.trim();
      const queryOk = !q || `${task.code}${task.title}${task.leadDepartmentName}${task.supportingDepartmentNames.join('')}`.includes(q);
      return statusOk && priorityOk && queryOk;
    })
    .sort((a, b) => taskSortWeight(a, reports, user?.departmentId, year) - taskSortWeight(b, reports, user?.departmentId, year));

  return (
    <div className="space-y-5">
      <section className="soft-panel rounded-ui p-5">
        {searchParams.get('notice') === 'unauthorized-task' && (
          <div className="mb-4 rounded-xl bg-[#FFF7ED] px-4 py-3 text-sm font-bold text-[#B54708]">
            该任务不属于当前部门的牵头或协同范围
          </div>
        )}
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm font-semibold text-brand-500">部门工作台</div>
            <h2 className="mt-1 text-3xl font-black text-ink">{user?.departmentName}</h2>
            <p className="mt-2 text-sm text-muted">牵头任务可填报进度，协同任务仅可查看；退回任务按审核意见整改后重新提交。</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <MiniStat label="我牵头" value={leadTasks.length} />
            <MiniStat label="我协同" value={supportTasks.length} />
            <MiniStat label="进度待更新" value={pendingTasks.length} />
            <MiniStat label="逾期任务" value={overdueTasks.length} tone="orange" />
          </div>
        </div>
      </section>

      <section className="soft-panel rounded-ui p-4">
        <div className="flex flex-wrap items-center gap-3">
          {[
            ['pending', `进度待更新 ${pendingTasks.length}`],
            ['reviewing', `待审核 ${reviewingTasks.length}`],
            ['approved', `审核通过 ${approvedTasks.length}`],
            ['overdue', `逾期 ${overdueTasks.length}`],
            ['all', `全部相关 ${visibleTasks.length}`],
            ['lead', `我牵头 ${leadTasks.length}`],
            ['support', `我协同 ${supportTasks.length}`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as WorkbenchTab)}
              className={`h-10 rounded-xl px-4 text-sm font-bold ${tab === key ? 'bg-brand-500 text-white' : 'bg-[#F6F9FE] text-muted hover:text-brand-500'}`}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-10 items-center gap-2 rounded-xl border border-[#D9E3F2] bg-white px-3">
              <Search size={16} className="text-muted" />
              <input className="w-56 outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务名称" />
            </div>
            <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={year} onChange={(event) => setYear(Number(event.target.value) as Year)}>
              {years.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={status} onChange={(event) => setStatus(event.target.value)}>
              {['全部状态', '待更新', '待审核', '审核通过', '逾期', '仅查看', '暂无完成标准'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select className="h-10 rounded-xl border border-[#D9E3F2] bg-white px-3" value={priority} onChange={(event) => setPriority(event.target.value)}>
              {['全部优先级', '高', '中', '低', ''].map((item) => <option key={item} value={item}>{item || '—'}</option>)}
            </select>
            <div className="flex rounded-xl border border-[#D9E3F2] bg-white p-1">
              <button className={`grid h-8 w-8 place-items-center rounded-lg ${view === 'card' ? 'bg-brand-500 text-white' : 'text-muted'}`} onClick={() => setView('card')} aria-label="卡片视图"><LayoutGrid size={17} /></button>
              <button className={`grid h-8 w-8 place-items-center rounded-lg ${view === 'table' ? 'bg-brand-500 text-white' : 'text-muted'}`} onClick={() => setView('table')} aria-label="表格视图"><List size={17} /></button>
            </div>
          </div>
        </div>
      </section>

      {view === 'card' ? (
        filteredTasks.length ? (
          <div className="grid grid-cols-3 gap-3">
            {filteredTasks.map((task) => <TaskCard key={task.id} task={task} relation={getTaskRelation(task, user?.departmentId)} year={year} />)}
          </div>
        ) : <EmptyState text="当前筛选下暂无本部门相关任务" />
      ) : (
        <TaskTable tasks={filteredTasks} year={year} departmentId={user?.departmentId} reports={reports} />
      )}
    </div>
  );
}

function MiniStat({ label, value, tone = 'blue' }: { label: string; value: number; tone?: 'blue' | 'orange' }) {
  return (
    <div className="min-w-28 rounded-[14px] bg-[#F8FBFF] px-4 py-3">
      <div className="text-xs text-muted">{label}</div>
      <div className={`metric-number mt-1 text-2xl font-black ${tone === 'orange' ? 'text-[#B54708]' : 'text-brand-500'}`}>{value}</div>
    </div>
  );
}

function TaskTable({ tasks, year, departmentId, reports }: { tasks: StrategicTask[]; year: Year; departmentId?: string; reports: ReturnType<typeof useCompletionReports>['reports'] }) {
  return (
    <div className="soft-panel overflow-hidden rounded-ui">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[#F6F9FE] text-muted">
          <tr>
            {['关系', '编号', '任务名称', '牵头部门', '年度进度', '总体进度', '状态', '操作'].map((head) => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const relation = getTaskRelation(task, departmentId);
            const yearProgress = calculateStandardYearProgress(task, year, reports);
            const overallProgress = calculateStandardOverallProgress(task, reports);
            const status = calculateTaskReportingStatus(task, departmentId, reports, year);
            return (
              <tr key={task.id} className="border-t border-[#E4EBF5] hover:bg-brand-50/50">
                <td className="px-4 py-3">{relation === 'lead' ? '我牵头' : '我协同'}</td>
                <td className="px-4 py-3 font-black text-brand-500">{task.code}</td>
                <td className="px-4 py-3 font-bold text-ink">{task.title}</td>
                <td className="px-4 py-3 text-muted">{task.leadDepartmentName}</td>
                <td className="px-4 py-3">{yearProgress == null ? '—' : `${yearProgress}%`}</td>
                <td className="px-4 py-3">{overallProgress == null ? '—' : `${overallProgress}%`}</td>
                <td className="px-4 py-3">{status}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link className="font-bold text-brand-500" to={`/tasks/${task.id}`}>查看详情</Link>
                    {relation === 'lead' ? (
                      <Link className="inline-flex items-center gap-1 font-bold text-[#087D92]" to={`/tasks/${task.id}?year=${year}&mode=edit`}><Edit3 size={14} />填报进度</Link>
                    ) : (
                      <Link className="inline-flex items-center gap-1 font-bold text-muted" to={`/tasks/${task.id}?year=${year}`}><LockKeyhole size={14} />查看进度</Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function taskSortWeight(task: StrategicTask, reports: ReturnType<typeof useCompletionReports>['reports'], departmentId: string | undefined, year: Year) {
  if (isTaskOverdueByStandards(task, reports)) return 1;
  const status = calculateTaskReportingStatus(task, departmentId, reports, year);
  if (status === '待更新') return 2;
  if (status === '待审核') return 3;
  if (status === '审核通过' && !isTaskCompletedByStandards(task, reports)) return 4;
  if (isTaskCompletedByStandards(task, reports)) return 4;
  return 5;
}

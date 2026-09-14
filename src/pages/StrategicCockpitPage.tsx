import { getTaskLeads } from '../utils/taskSelectors';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Activity, Building2, ClockAlert, Database, Layers3, ListChecks, Target } from 'lucide-react';
import { dashboardSeed } from '../data/dashboard';
import { indicators } from '../data/indicators';
import { DEMO_DATA_AS_OF_DATE } from '../data/constants';
import { ChartFrame } from '../components/charts/ChartFrame';
import { StatCard } from '../components/common/StatCard';
import { useCompletionReports } from '../hooks/useCompletionReports';
import { useTaskReporting } from '../hooks/useTaskReporting';
import type { Year } from '../types';
import {
  years,
} from '../utils/taskCalculations';
import {
  calculateStandardYearProgress,
  getTaskStandards,
  isStandardApplicableToYear,
  isTaskOverdueByStandards,
} from '../utils/progressCalculations';

const palette = ['#155EEF', '#06AED4', '#12B76A', '#F79009', '#2E90FA', '#7A5AF8', '#0E9384', '#667085'];

export function StrategicCockpitPage() {
  const { tasks } = useTaskReporting();
  const { reports } = useCompletionReports();
  const [year, setYear] = useState<Year>(2026);
  const [area, setArea] = useState('全部板块');
  const [activeSummary, setActiveSummary] = useState<'departments' | 'systems' | null>(null);
  const areas = ['全部板块', ...Array.from(new Set(tasks.map((task) => task.businessArea)))];

  const filtered = useMemo(() => tasks.filter((task) => area === '全部板块' || task.businessArea === area), [area, tasks]);
  const yearStandards = filtered.flatMap((task) => getTaskStandards(task.id).filter((standard) => isStandardApplicableToYear(standard, year, task)));
  const yearProgressValues = filtered.map((task) => calculateStandardYearProgress(task, year, reports)).filter((value): value is number => value != null);
  const yearProgress = yearProgressValues.length ? Math.round(yearProgressValues.reduce((sum, value) => sum + value, 0) / yearProgressValues.length) : null;
  const overdueTasks = filtered.filter((task) => isTaskOverdueByStandards(task, reports));

  const areaDistribution = Array.from(new Set(filtered.map((task) => task.businessArea))).map((name) => ({
    name,
    value: filtered.filter((task) => task.businessArea === name).length,
  }));

  const leadDepartments = Array.from(new Map(filtered.flatMap(getTaskLeads).map((lead) => [lead.id, lead])).values()).map(({id: departmentId, name}) => {
    const ownedTasks = filtered.filter((task) => getTaskLeads(task).some((lead) => lead.id === departmentId));
    return {
      id: departmentId,
      name,
      count: ownedTasks.length,
      overdueCount: ownedTasks.filter((task) => isTaskOverdueByStandards(task, reports)).length,
    };
  });

  const openSummary = (target: 'departments' | 'systems') => {
    setActiveSummary(target);
    window.setTimeout(() => document.getElementById('summary-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black text-ink">日照银行“十五五”战略驾驶舱</h2>
          <p className="mt-2 text-muted">战略管理部门 · 全行任务执行总览</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#FFF7ED] px-4 py-2 text-sm font-bold text-[#B54708]">数据截止日期：{DEMO_DATA_AS_OF_DATE}</div>
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-4" value={year} onChange={(event) => setYear(Number(event.target.value) as Year)}>
            {years.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-4" value={area} onChange={(event) => setArea(event.target.value)}>
            {areas.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 2xl:grid-cols-7">
        <Link to="/tasks" className="block focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard label="战略任务总数" value={filtered.length} icon={ListChecks} actionLabel="进入战略任务" />
        </Link>
        <Link to={`/annual?year=${year}&overdue=1`} className="block focus:outline-none focus:ring-2 focus:ring-brand-500" title="截止数据日期，完成标准计划时间已到且尚未达成的任务，即计为逾期任务。">
          <StatCard label="逾期任务" value={overdueTasks.length} icon={ClockAlert} tone="amber" actionLabel="查看逾期任务" />
        </Link>
        <Link to={`/annual?year=${year}`} className="block focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard label={`${year} 年度填报项`} value={yearStandards.length} icon={Layers3} tone="cyan" actionLabel="进入年度推进" />
        </Link>
        <Link to={`/annual?year=${year}`} className="block focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard label={`${year} 年度进度`} value={yearProgress == null ? '—' : yearProgress} suffix={yearProgress == null ? '' : '%'} icon={Activity} tone="blue" actionLabel="进入年度推进" />
        </Link>
        <button type="button" onClick={() => openSummary('departments')} className="block text-left focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard label="牵头部门数" value={leadDepartments.length} icon={Building2} tone="cyan" actionLabel="查看部门明细" />
        </button>
        <Link to="/indicators" className="block focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard label="指标任务总数" value={indicators.length} icon={Target} tone="green" actionLabel="进入指标任务" />
        </Link>
        <button type="button" onClick={() => openSummary('systems')} className="block text-left focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard label="系统建设事项" value={dashboardSeed.systemProjects.length} icon={Database} tone="amber" actionLabel="查看系统清单" />
        </button>
      </div>

      <section id="summary-detail" className="soft-panel rounded-ui p-5">
        {!activeSummary && (
          <div className="text-sm font-semibold text-muted">点击上方总览卡片，可进入对应模块或在此查看明细。</div>
        )}
        {activeSummary === 'departments' && (
          <div>
            <h3 className="text-lg font-black text-ink">牵头部门明细</h3>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {leadDepartments.map((item) => (
                <Link key={item.id} to={`/tasks?lead=${item.id}`} className="rounded-xl bg-[#F8FBFF] p-4 text-sm transition hover:bg-brand-50">
                  <div className="font-black text-ink">{item.name}</div>
                  <div className="mt-2 text-muted">牵头任务 {item.count} 项 · 逾期任务 {item.overdueCount} 项</div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {activeSummary === 'systems' && (
          <div>
            <h3 className="text-lg font-black text-ink">系统建设清单</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {dashboardSeed.systemProjects.slice(0, 8).map((item) => (
                <div key={`${item.name}-${item.dueDate}`} className="rounded-xl bg-[#F8FBFF] p-4 text-sm">
                  <div className="font-bold text-ink">{item.name}</div>
                  <div className="mt-2 text-muted">{item.leadDepartment} · {item.dueDate || '待定'} · {item.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-12 gap-5">
        <ChartFrame title="各业务板块任务分布" className="col-span-12">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={areaDistribution.slice(0, 10)} dataKey="value" nameKey="name" innerRadius={58} outerRadius={102} paddingAngle={3}>
                {areaDistribution.slice(0, 10).map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
              </Pie>
              <Tooltip wrapperClassName="chart-tooltip" />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>

      </div>
    </div>
  );
}

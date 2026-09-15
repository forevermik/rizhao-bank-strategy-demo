import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Building2, Database, ListChecks, Target, Workflow } from 'lucide-react';
import { ChartFrame } from '../components/charts/ChartFrame';
import { StatCard } from '../components/common/StatCard';
import { CURRENT_DEMO_YEAR, DEMO_DATA_AS_OF_DATE } from '../data/constants';
import { dashboardSeed } from '../data/dashboard';
import { indicators } from '../data/indicators';
import { useQuarterlyReports } from '../hooks/useQuarterlyReports';
import { useTaskReporting } from '../hooks/useTaskReporting';
import { calculateMeasureYearProgress } from '../utils/quarterlyProgress';
import { getTaskImplementationYears, years } from '../utils/taskCalculations';
import { getTaskLeads } from '../utils/taskSelectors';
import type { Year } from '../types';

const palette = ['#155EEF', '#06AED4', '#12B76A', '#F79009', '#2E90FA', '#7A5AF8', '#0E9384', '#667085'];

export function StrategicCockpitPage() {
  const { tasks } = useTaskReporting();
  const { reports } = useQuarterlyReports();
  const [area, setArea] = useState('全部板块');
  const [year, setYear] = useState<Year>(CURRENT_DEMO_YEAR);
  const [activeSummary, setActiveSummary] = useState<'departments' | 'systems' | null>(null);
  const areas = ['全部板块', ...Array.from(new Set(tasks.map((task) => task.businessArea)))];

  const filtered = useMemo(() => tasks.filter((task) => area === '全部板块' || task.businessArea === area), [area, tasks]);
  const activeYearTasks = filtered.filter((task) => getTaskImplementationYears(task).includes(year));
  const measureTotal = activeYearTasks.reduce((sum, task) => sum + task.measures.length, 0);
  const completedMeasureTotal = activeYearTasks.reduce((sum, task) => (
    sum + task.measures.filter((measure) => calculateMeasureYearProgress(task, measure.id, year, reports) === 100).length
  ), 0);

  const areaDistribution = Array.from(new Set(filtered.map((task) => task.businessArea))).map((name) => ({
    name,
    value: filtered.filter((task) => task.businessArea === name).length,
  }));

  const leadDepartments = Array.from(new Map(filtered.flatMap(getTaskLeads).map((lead) => [lead.id, lead])).values()).map(({ id: departmentId, name }) => {
    const ownedTasks = filtered.filter((task) => getTaskLeads(task).some((lead) => lead.id === departmentId));
    const activeOwnedTasks = ownedTasks.filter((task) => getTaskImplementationYears(task).includes(year));
    const measureCount = activeOwnedTasks.reduce((sum, task) => sum + task.measures.length, 0);
    const completedCount = activeOwnedTasks.reduce((sum, task) => (
      sum + task.measures.filter((measure) => calculateMeasureYearProgress(task, measure.id, year, reports, departmentId) === 100).length
    ), 0);
    return {
      id: departmentId,
      name,
      count: ownedTasks.length,
      measureCount,
      completedCount,
    };
  });

  const departmentMeasureData = leadDepartments
    .filter((item) => item.measureCount > 0)
    .sort((a, b) => b.measureCount - a.measureCount)
    .map((item) => ({ name: item.name, total: item.measureCount, completed: item.completedCount }));

  const openSummary = (target: 'departments' | 'systems') => {
    setActiveSummary((current) => current === target ? null : target);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black text-ink">日照银行“十五五”战略驾驶舱</h2>
          <p className="mt-1 text-sm text-muted">战略管理部门 · 全行任务执行总览</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#FFF7ED] px-4 py-2 text-sm font-bold text-[#B54708]">数据截止日期：{DEMO_DATA_AS_OF_DATE}</div>
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-4" value={area} onChange={(event) => setArea(event.target.value)}>
            {areas.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Link to="/tasks" className="block focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard compact label="战略任务总数" value={filtered.length} icon={ListChecks} actionLabel="进入战略任务" />
        </Link>
        <Link to={`/annual?year=${year}`} className="block focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard compact label={`${year}关键举措`} value={measureTotal} icon={Workflow} tone="cyan" actionLabel={`已完成 ${completedMeasureTotal} 项`} />
        </Link>
        <button type="button" onClick={() => openSummary('departments')} className="block text-left focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard compact label="牵头部门数" value={leadDepartments.length} icon={Building2} tone="cyan" actionLabel="查看部门明细" />
        </button>
        <Link to="/indicators" className="block focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard compact label="指标任务总数" value={indicators.length} icon={Target} tone="green" actionLabel="进入指标任务" />
        </Link>
        <button type="button" onClick={() => openSummary('systems')} className="block text-left focus:outline-none focus:ring-2 focus:ring-brand-500">
          <StatCard compact label="系统建设事项" value={dashboardSeed.systemProjects.length} icon={Database} tone="amber" actionLabel="查看系统清单" />
        </button>
      </div>

      {activeSummary && <section id="summary-detail" className="soft-panel max-h-60 overflow-y-auto rounded-ui p-4">
        {activeSummary === 'departments' && (
          <div>
            <h3 className="text-lg font-black text-ink">牵头部门明细</h3>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {leadDepartments.map((item) => (
                <Link key={item.id} to={`/tasks?lead=${item.id}`} className="rounded-xl bg-[#F8FBFF] p-4 text-sm transition hover:bg-brand-50">
                  <div className="font-black text-ink">{item.name}</div>
                  <div className="mt-2 text-muted">牵头任务 {item.count} 项</div>
                  <div className="mt-1 text-muted">{year} 关键举措 {item.measureCount} 项 · 已完成 {item.completedCount} 项</div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {activeSummary === 'systems' && (
          <div>
            <h3 className="text-lg font-black text-ink">系统建设清单</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {dashboardSeed.systemProjects.slice(0, 8).map((item) => (
                <div key={`${item.name}-${item.dueDate}`} className="rounded-xl bg-[#F8FBFF] p-4 text-sm">
                  <div className="font-bold text-ink">{item.name}</div>
                  <div className="mt-2 text-muted">{item.leadDepartment} · {item.dueDate || '待定'} · {item.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>}

      <div className="grid grid-cols-12 gap-4">
      <ChartFrame
        className="col-span-8"
        title={`各牵头部门关键实施举措完成情况（${year}）`}
        action={(
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted">拖动底部滑块查看全部部门</span>
            <select
              aria-label="柱状图年份"
              className="h-9 rounded-xl border border-[#D9E3F2] bg-white px-3 text-sm font-bold text-ink"
              value={year}
              onChange={(event) => setYear(Number(event.target.value) as Year)}
            >
              {years.map((item) => <option key={item} value={item}>{item}年</option>)}
            </select>
          </div>
        )}
      >
        <div className="overflow-x-auto pb-2">
          <div style={{ width: Math.max(860, departmentMeasureData.length * 92), height: 290 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentMeasureData} margin={{ top: 24, right: 18, left: 0, bottom: 68 }} barGap={3}>
                <CartesianGrid stroke="#E4EBF5" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" interval={0} angle={-28} textAnchor="end" height={78} tick={{ fill: '#667085', fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#667085', fontSize: 12 }} />
                <Tooltip wrapperClassName="chart-tooltip" />
                <Legend verticalAlign="top" align="center" />
                <Bar dataKey="total" name="举措总数" fill="#155EEF" radius={[5, 5, 0, 0]} maxBarSize={34}>
                  <LabelList dataKey="total" position="top" fill="#344054" fontSize={12} fontWeight={700} />
                </Bar>
                <Bar dataKey="completed" name="已完成举措" fill="#12B76A" radius={[5, 5, 0, 0]} maxBarSize={34}>
                  <LabelList dataKey="completed" position="top" fill="#027A48" fontSize={12} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ChartFrame>

      <ChartFrame className="col-span-4" title="各业务板块任务分布">
        <ResponsiveContainer width="100%" height={290}>
          <PieChart>
            <Pie data={areaDistribution.slice(0, 10)} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3} cx="38%">
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

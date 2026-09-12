import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, CircleGauge, Target } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { indicators } from '../data/indicators';
import { ChartFrame } from '../components/charts/ChartFrame';
import { EmptyState } from '../components/common/EmptyState';
import { ProgressRing } from '../components/common/ProgressRing';
import { StatCard } from '../components/common/StatCard';
import { formatValue } from '../utils/calculations';
import { indicatorValue } from '../utils/indicatorCalculations';

export function IndicatorDetailPage() {
  const { indicatorId } = useParams();
  const indicator = indicators.find((item) => item.id === indicatorId);
  if (!indicator) return <EmptyState text="未找到指标" />;
  const current = indicatorValue(indicator, 2026);
  const trend = [{ year: 2025, target: Number(indicator.base2025) || 0 }, ...indicator.yearlyValues.map((item) => ({ year: item.year, target: item.target }))];
  const compare = indicator.yearlyValues.map((item) => ({ year: item.year, 目标: item.target, 完成: item.actual }));
  const gap = indicator.yearlyValues.map((item) => ({ year: item.year, 数据差值: item.gap ?? 0 }));

  return (
    <div className="space-y-6">
      <Link to="/indicators" className="inline-flex items-center gap-2 text-sm font-bold text-brand-500">
        <ArrowLeft size={18} /> 返回指标任务
      </Link>
      <section className="soft-panel rounded-ui p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-bold text-brand-500">{indicator.businessLine} · {indicator.department}</div>
            <h2 className="mt-2 text-3xl font-black text-ink">{indicator.name}</h2>
      <p className="mt-2 text-sm text-muted">指标单位：{indicator.unit} · 当前年度：2026 · 数据更新时间：{indicator.updatedAt ?? '2026-07-20'}</p>
          </div>
          <ProgressRing value={Math.round(current.completionRate ?? 0)} label={current.completionRate == null ? '未填报' : '完成率'} />
        </div>
      </section>

      <div className="grid grid-cols-4 gap-5">
        <StatCard label="总部目标" value={Math.round(current.target ?? 0)} icon={Target} hint={current.target == null ? '未填报' : indicator.unit} />
        <StatCard label="当前值" value={Math.round(current.actual ?? 0)} icon={BarChart3} tone="cyan" hint={current.actual == null ? '未填报' : indicator.unit} />
        <StatCard label="数据差值" value={Math.round(Math.abs(current.gap ?? 0))} icon={CircleGauge} tone="amber" hint={current.gap == null ? '—' : indicator.unit} />
        <StatCard label="完成率" value={Math.round(current.completionRate ?? 0)} suffix={current.completionRate == null ? '' : '%'} icon={CircleGauge} tone="green" />
      </div>

      <div className="grid grid-cols-12 gap-5">
        <ChartFrame title="2025—2030 目标趋势" className="col-span-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid stroke="#E4EBF5" vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip wrapperClassName="chart-tooltip" formatter={(value) => value == null ? '未填报' : formatValue(Number(value), indicator.unit)} />
              <Line dataKey="target" name="目标值" stroke="#155EEF" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartFrame>
        <ChartFrame title="计划与完成对比" className="col-span-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={compare}>
              <CartesianGrid stroke="#E4EBF5" vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip wrapperClassName="chart-tooltip" />
              <Legend />
              <Bar dataKey="目标" fill="#155EEF" radius={[10, 10, 0, 0]} />
              <Bar dataKey="完成" fill="#06AED4" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <ChartFrame title="数据差值" className="col-span-5">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={gap}>
              <CartesianGrid stroke="#E4EBF5" vertical={false} />
              <XAxis dataKey="year" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip wrapperClassName="chart-tooltip" />
              <Bar dataKey="数据差值" fill="#F79009" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <ChartFrame title="年度完成率" className="col-span-7">
          <div className="grid grid-cols-5 gap-4">
            {indicator.yearlyValues.map((item) => (
              <div key={item.year} className="rounded-ui bg-[#F8FBFF] p-4 text-center">
                <ProgressRing value={Math.round(item.completionRate ?? 0)} size={100} />
                <div className="mt-3 font-black text-ink">{item.year}</div>
                <div className="mt-1 text-xs text-muted">目标 {item.target == null ? '未填报' : formatValue(item.target, indicator.unit)}</div>
              </div>
            ))}
          </div>
        </ChartFrame>
      </div>
      <p className="text-xs text-muted">当前完成值为前端演示数据，仅用于界面展示。</p>
    </div>
  );
}

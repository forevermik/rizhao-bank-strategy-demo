import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, Database, Search, XCircle } from 'lucide-react';
import { indicators } from '../data/indicators';
import { StatCard } from '../components/common/StatCard';
import { useAuth } from '../hooks/useAuth';
import { formatValue } from '../utils/calculations';
import { indicatorValue, isIndicatorAchieved, isIndicatorFilled } from '../utils/indicatorCalculations';
import { years } from '../utils/taskCalculations';
import type { Year } from '../types';

export function IndicatorListPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [line, setLine] = useState('全部条线');
  const [dept, setDept] = useState('全部部门');
  const [unit, setUnit] = useState('全部单位');
  const [fillStatus, setFillStatus] = useState('全部填报状态');
  const [year, setYear] = useState<Year>(2026);
  const baseIndicators = user?.role === 'strategy' ? indicators : indicators.filter((indicator) => indicator.departmentId === user?.departmentId);
  const lines = ['全部条线', ...Array.from(new Set(baseIndicators.map((item) => item.businessLine)))];
  const departments = ['全部部门', ...Array.from(new Set(baseIndicators.map((item) => item.departmentName)))];
  const units = ['全部单位', ...Array.from(new Set(baseIndicators.map((item) => item.unit)))];
  const filtered = useMemo(() => {
    return baseIndicators.filter((indicator) => {
      const q = query.trim();
      const value = indicatorValue(indicator, year);
      const filledValue = value.target != null && value.actual != null;
      const achievedValue = filledValue && value.actual! >= value.target!;
      const queryOk = !q || `${indicator.name}${indicator.departmentName}${indicator.businessLine}`.includes(q);
      const lineOk = line === '全部条线' || indicator.businessLine === line;
      const deptOk = dept === '全部部门' || indicator.departmentName === dept;
      const unitOk = unit === '全部单位' || indicator.unit === unit;
      const fillOk =
        fillStatus === '全部填报状态'
        || (fillStatus === '已达成' && achievedValue)
        || (fillStatus === '未达成' && filledValue && !achievedValue)
        || (fillStatus === '未填报' && !filledValue);
      return queryOk && lineOk && deptOk && unitOk && fillOk;
    });
  }, [baseIndicators, dept, fillStatus, line, query, unit, year]);
  const filled = filtered.filter((indicator) => isIndicatorFilled(indicator, year)).length;
  const achieved = filtered.filter((indicator) => isIndicatorAchieved(indicator, year)).length;
  const notAchieved = filtered.filter((indicator) => isIndicatorFilled(indicator, year) && !isIndicatorAchieved(indicator, year)).length;

  return (
    <div className="space-y-6">
      <div className="soft-panel rounded-ui p-5">
        <div className="grid grid-cols-[1fr_170px_170px_130px_150px_130px] gap-3">
          <div className="flex h-11 flex-1 items-center gap-3 rounded-ui border border-[#D9E3F2] bg-white px-4">
            <Search className="text-muted" size={18} />
            <input className="flex-1 outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索指标名称、负责部门" />
          </div>
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-4" value={line} onChange={(event) => setLine(event.target.value)}>{lines.map((item) => <option key={item}>{item}</option>)}</select>
          {user?.role === 'strategy' && <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-4" value={dept} onChange={(event) => setDept(event.target.value)}>{departments.map((item) => <option key={item}>{item}</option>)}</select>}
          {user?.role !== 'strategy' && <div />}
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-4" value={year} onChange={(event) => setYear(Number(event.target.value) as Year)}>{years.map((item) => <option key={item}>{item}</option>)}</select>
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-4" value={fillStatus} onChange={(event) => setFillStatus(event.target.value)}>{['全部填报状态', '已达成', '未达成', '未填报'].map((item) => <option key={item}>{item}</option>)}</select>
          <select className="h-11 rounded-ui border border-[#D9E3F2] bg-white px-4" value={unit} onChange={(event) => setUnit(event.target.value)}>{units.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <StatCard label="指标总数" value={filtered.length} icon={Database} />
        <StatCard label="已填报指标数" value={filled} icon={Activity} tone="cyan" />
        <StatCard label="已达成指标数" value={achieved} icon={CheckCircle2} tone="green" />
        <StatCard label="未达成指标数" value={notAchieved} icon={XCircle} tone="amber" />
      </div>

      <div className="soft-panel overflow-hidden rounded-ui">
        <div className="flex items-center justify-between border-b border-[#E4EBF5] px-5 py-4">
          <h2 className="text-base font-extrabold text-ink">指标任务列表</h2>
          <span className="text-sm font-semibold text-muted">共 {filtered.length} 条筛选结果</span>
        </div>
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#F6F9FE] text-muted">
            <tr>
              {['条线', '指标名称', '负责部门', '年度', '总部目标', '当前完成值', '数据差值', '完成率', '数据更新时间', '操作'].map((head) => <th key={head} className="px-4 py-3 font-bold">{head}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((indicator) => {
              const value = indicatorValue(indicator, year);
              const filledValue = value.target != null && value.actual != null;
              const achievedValue = filledValue && value.actual! >= value.target!;
              return (
                <tr key={indicator.id} className="border-t border-[#E4EBF5] hover:bg-brand-50/50">
                  <td className="px-4 py-4 text-muted">{indicator.businessLine}</td>
                  <td className="px-4 py-4"><Link className="font-bold text-ink hover:text-brand-500" to={`/indicators/${indicator.id}`}>{indicator.name}</Link></td>
                  <td className="px-4 py-4 text-muted">{indicator.departmentName}</td>
                  <td className="px-4 py-4">{year}</td>
                  <td className="px-4 py-4">{value.target == null ? '未填报' : formatValue(value.target, indicator.unit)}</td>
                  <td className="px-4 py-4">{value.actual == null ? '未填报' : formatValue(value.actual, indicator.unit)}</td>
                  <td className="px-4 py-4">{value.gap == null ? '—' : formatValue(value.gap, indicator.unit)}</td>
                  <td className="px-4 py-4 font-black text-brand-500">{value.completionRate == null ? '—' : `${value.completionRate}%`}</td>
                  <td className="px-4 py-4">{indicator.updatedAt ?? '2026-07-20'}</td>
                  <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${achievedValue ? 'bg-[#ECFDF3] text-[#027A48]' : filledValue ? 'bg-[#FFF7ED] text-[#B54708]' : 'bg-[#F2F4F7] text-muted'}`}>{achievedValue ? '已达成' : filledValue ? '未达成' : '未填报'}</span></td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm font-semibold text-muted">没有符合当前筛选条件的指标任务</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">当前完成值为前端演示数据，仅用于界面展示。</p>
    </div>
  );
}

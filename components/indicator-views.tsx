'use client';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Indicator, indicators, years, uniq, format, cutoff } from '@/lib/data';
import { Report, reportKey } from '@/lib/reporting';
import { ViewProps } from './task-views';
import {
  Select,
  SearchBox,
  YearTabs,
  StatStrip,
  Progress,
  Empty,
} from './common';
import ReportForm from './report-form';
function current(i: Indicator, year: number, p: ViewProps) {
  const r = p.reports[reportKey(i.id, year, i.departmentId)],
    target = i.yearlyValues.find((y) => y.year === year)?.target ?? null;
  const actual = r?.value ?? null,
    rate =
      actual !== null && target !== null && target !== 0
        ? Math.round((actual / target) * 100)
        : null;
  return {
    r,
    target,
    actual,
    rate,
    gap: actual !== null && target !== null ? actual - target : null,
    status:
      actual === null
        ? '未填报'
        : rate !== null && rate >= 100
          ? '已达成'
          : '未达成',
  };
}
export function IndicatorList(p: ViewProps) {
  const { filters: f, setFilter, year, user, allowed } = p;
  const allowedIndicators = indicators.filter(
    (i) => user.role === 'strategy' || i.departmentId === user.departmentId,
  );
  const list = allowedIndicators.filter(
    (i) =>
      (!f.department || f.department === i.departmentName) &&
      (!f.area ||
        allowed.some(
          (t) =>
            t.businessArea === f.area &&
            (t.leadDepartmentId === i.departmentId ||
              t.linkedIndicatorIds.includes(i.id)),
        )) &&
      (!f.line || f.line === i.businessLine) &&
      (!f.unit || f.unit === i.unit) &&
      (!f.status || f.status === current(i, year, p).status) &&
      `${i.name}${i.departmentName}`
        .toLowerCase()
        .includes(f.query.trim().toLowerCase()),
  );
  const [editing, setEditing] = useState<Indicator | null>(null);
  return (
    <>
      <div className="filter-panel">
        <SearchBox
          value={f.query}
          onChange={(v) => setFilter('query', v)}
          placeholder="搜索指标名称、负责部门"
        />
        <Select
          label="全部条线"
          value={f.line}
          onChange={(v) => setFilter('line', v)}
          options={uniq(allowedIndicators.map((i) => i.businessLine))}
        />
        <Select
          label="全部部门"
          value={f.department}
          onChange={(v) => setFilter('department', v)}
          options={uniq(allowedIndicators.map((i) => i.departmentName))}
        />
        <Select
          label="年度"
          value={year}
          onChange={(v) => p.setYear(+v)}
          options={years}
          all={false}
        />
        <Select
          label="全部填报状态"
          value={f.status}
          onChange={(v) => setFilter('status', v)}
          options={['已达成', '未达成', '未填报']}
        />
        <Select
          label="全部单位"
          value={f.unit}
          onChange={(v) => setFilter('unit', v)}
          options={uniq(allowedIndicators.map((i) => i.unit))}
        />
        <button className="text-link" onClick={p.reset}>
          重置
        </button>
      </div>
      <StatStrip
        items={[
          ['指标总数', list.length],
          [
            '已填报指标数',
            list.filter((i) => current(i, year, p).actual !== null).length,
          ],
          [
            '已达成指标数',
            list.filter((i) => current(i, year, p).status === '已达成').length,
          ],
          [
            '未达成指标数',
            list.filter((i) => current(i, year, p).status === '未达成').length,
          ],
        ]}
      />
      <section className="panel table-panel">
        <div className="panel-heading padded">
          <h3>指标任务列表</h3>
          <span>共 {list.length} 条筛选结果</span>
        </div>
        {list.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    '条线',
                    '指标名称',
                    '负责部门',
                    '年度',
                    '总部目标',
                    '当前完成值',
                    '数据差值',
                    '完成率',
                    '数据更新时间',
                    '操作',
                  ].map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((i) => {
                  const d = current(i, year, p);
                  return (
                    <tr key={i.id}>
                      <td>{i.businessLine}</td>
                      <td className="wide-cell">
                        <button
                          className="text-link"
                          onClick={() =>
                            p.go(`/indicators/${i.id}?year=${year}`)
                          }
                        >
                          {i.name}
                        </button>
                      </td>
                      <td>{i.departmentName}</td>
                      <td>{year}</td>
                      <td className="number-cell">
                        {format(d.target)} {i.unit}
                      </td>
                      <td>
                        {d.actual === null ? (
                          <span className="muted">未填报</span>
                        ) : (
                          `${format(d.actual)} ${i.unit}`
                        )}
                      </td>
                      <td
                        className={d.gap !== null && d.gap < 0 ? 'overdue' : ''}
                      >
                        {format(d.gap)}
                      </td>
                      <td>{d.rate === null ? '—' : `${d.rate}%`}</td>
                      <td>{d.r ? d.r.updatedAt.slice(0, 10) : i.updatedAt}</td>
                      <td>
                        {user.role === 'department' ? (
                          <button
                            className="text-link"
                            onClick={() => setEditing(i)}
                          >
                            {d.actual === null ? '填报' : '修改填报'}
                          </button>
                        ) : (
                          <span
                            className={`status-tag ${d.status === '已达成' ? 'green-tag' : ''}`}
                          >
                            {d.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty onReset={p.reset} />
        )}
      </section>
      {editing && (
        <ReportForm
          title={editing.name}
          year={year}
          metric
          unit={editing.unit}
          departmentId={user.departmentId}
          existing={current(editing, year, p).r}
          onSave={(r) => {
            p.save(editing.id, year, user.departmentId, r);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
export function IndicatorDetail(p: ViewProps & { indicator: Indicator }) {
  const { indicator: i, year, user } = p;
  const d = current(i, year, p),
    [editing, setEditing] = useState(false);
  const data = years.map((y) => {
      const c = current(i, y, p);
      return {
        year: String(y),
        target: c.target,
        actual: c.actual,
        gap: c.gap,
        rate: c.rate,
      };
    }),
    trend = [{ year: '2025', target: i.base2025 }, ...data];
  return (
    <>
      <div className="detail-toolbar">
        <button
          className="back-link"
          onClick={() => p.go(`/indicators?year=${year}`)}
        >
          <ArrowLeft size={17} />
          返回指标任务
        </button>
        {user.role === 'department' && (
          <button className="primary" onClick={() => setEditing(true)}>
            {d.r ? '修改填报' : '填报完成值'}
          </button>
        )}
      </div>
      <section className="panel detail-intro">
        <span className="eyebrow">
          {i.businessLine} · {i.departmentName}
        </span>
        <h2>{i.name}</h2>
        <p>
          指标单位：{i.unit} · 当前年度：{year} · 数据更新时间：
          {d.r ? d.r.updatedAt.slice(0, 10) : cutoff}
        </p>
      </section>
      <YearTabs year={year} onChange={p.setYear} />
      <StatStrip
        items={[
          ['总部目标', `${format(d.target)} ${i.unit}`],
          [
            '当前值',
            d.actual === null ? '未填报' : `${format(d.actual)} ${i.unit}`,
          ],
          ['数据差值', format(d.gap)],
          ['完成率', d.rate === null ? '—' : `${d.rate}%`],
        ]}
      />
      <div className="chart-grid">
        <section className="panel">
          <h3 className="section-title">2025—2030 目标趋势</h3>
          <div
            className="chart"
            role="img"
            aria-label="2025 至 2030 年目标趋势，具体数值见下方年度明细表"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trend}
                margin={{ left: 8, right: 20, top: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e7edf5"
                />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis width={65} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => [
                    `${format(v as number)} ${i.unit}`,
                    '目标',
                  ]}
                />
                <Line
                  name="目标"
                  dataKey="target"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <h3 className="section-title">计划与完成对比</h3>
          <div
            className="chart"
            role="img"
            aria-label="年度目标与完成值对比，未填报年份不展示完成柱"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ left: 8, right: 15, top: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e7edf5"
                />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis width={65} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                  name="目标"
                  dataKey="target"
                  fill="#3479f4"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
                <Bar
                  name="完成"
                  dataKey="actual"
                  fill="#11baa4"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
      <section className="panel">
        <h3 className="section-title">年度完成率</h3>
        <div className="completion-grid">
          {data.map((y) => (
            <div key={y.year}>
              <Progress label={y.year} value={y.rate} />
              <small>
                目标 {format(y.target)} {i.unit}
              </small>
              <p className="muted">
                {y.actual === null
                  ? '未填报'
                  : `已完成 ${format(y.actual)} ${i.unit}`}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="panel table-panel">
        <div className="panel-heading padded">
          <h3>年度指标明细</h3>
          <span>
            2025 年基期值：{format(i.base2025)} {i.unit}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  '年度',
                  '总部目标',
                  '当前完成值',
                  '数据差值',
                  '完成率',
                  '填报状态',
                ].map((s) => (
                  <th key={s}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((y) => (
                <tr key={y.year}>
                  <td>{y.year}</td>
                  <td>
                    {format(y.target)} {i.unit}
                  </td>
                  <td>
                    {y.actual === null
                      ? '未填报'
                      : `${format(y.actual)} ${i.unit}`}
                  </td>
                  <td>{format(y.gap)}</td>
                  <td>{y.rate === null ? '—' : `${y.rate}%`}</td>
                  <td>{current(i, +y.year, p).status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {d.r?.note && (
        <section className="panel">
          <h3 className="section-title">填报备注</h3>
          <p>{d.r.note}</p>
        </section>
      )}
      {editing && (
        <ReportForm
          title={i.name}
          year={year}
          metric
          unit={i.unit}
          departmentId={user.departmentId}
          existing={d.r}
          onSave={(r) => {
            p.save(i.id, year, user.departmentId, r);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}

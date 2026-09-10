'use client';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  List,
  Info,
  CalendarDays,
  Building2,
} from 'lucide-react';
import {
  Account,
  Task,
  Standard,
  standards,
  years,
  uniq,
  taskStandards,
  taskOverdue,
  overdue,
  scheduled,
  yearlyProgress,
  average,
  format,
  targetFor,
  indicators,
} from '@/lib/data';
import { Reports, Report, reportKey, reportProgress } from '@/lib/reporting';
import type { Filters } from './platform';
import {
  Select,
  SearchBox,
  YearTabs,
  Progress,
  Modal,
  Empty,
  Explanation,
  StatStrip,
} from './common';
import ReportForm from './report-form';
import CycleTable from './cycle-table';
export type ViewProps = {
  year: number;
  setYear: (y: number) => void;
  filters: Filters;
  setFilter: (k: keyof Filters, v: string) => void;
  reset: () => void;
  user: Account;
  allowed: Task[];
  reports: Reports;
  save: (id: string, y: number, dep: string, r: Report) => void;
  go: (route: string) => void;
};
const includes = (text: string, q: string) =>
  text.toLowerCase().includes(q.trim().toLowerCase());
function baseFilter(t: Task, p: ViewProps) {
  const f = p.filters;
  return (
    (!f.area || f.area === t.businessArea) &&
    (!f.department || f.department === t.leadDepartmentName) &&
    (!f.priority || f.priority === t.priority)
  );
}
export function TaskList(p: ViewProps) {
  const { year, filters: f, setFilter, allowed, go } = p;
  const [view, setView] = useState('cards'),
    [explanation, setExplanation] = useState(false);
  const list = allowed.filter(
    (t) =>
      baseFilter(t, p) &&
      includes(
        `${t.code}${t.title}${t.objective}${t.leadDepartmentName}`,
        f.query,
      ) &&
      (!f.status ||
        f.status === '全部任务' ||
        (f.status === '已配置规划目标' && taskStandards(t.id).length > 0) ||
        (f.status === '缺少规划目标' && !taskStandards(t.id).length) ||
        (f.status === '已有进度' && t.overallProgress > 0) ||
        (f.status === '进度待更新' && !t.overallProgress) ||
        (f.status === '逾期' && taskOverdue(t)) ||
        (f.status === '已达成' && t.overallProgress >= 100)),
  );
  const chips: [string, number][] = [
    ['全部任务', allowed.length],
    [
      '已配置规划目标',
      allowed.filter((t) => taskStandards(t.id).length).length,
    ],
    ['缺少规划目标', allowed.filter((t) => !taskStandards(t.id).length).length],
    ['已有进度', allowed.filter((t) => t.overallProgress > 0).length],
    ['进度待更新', allowed.filter((t) => !t.overallProgress).length],
    ['逾期', allowed.filter(taskOverdue).length],
    ['已达成', allowed.filter((t) => t.overallProgress >= 100).length],
  ];
  return (
    <>
      <div className="status-filters">
        <span>目标与进度状态</span>
        {chips.map(([label, count]) => (
          <button
            key={label}
            onClick={() =>
              setFilter('status', label === '全部任务' ? '' : label)
            }
            className={(f.status || '全部任务') === label ? 'selected' : ''}
          >
            {label}
            <b>{count}</b>
          </button>
        ))}
      </div>
      <div className="filter-panel">
        <SearchBox
          value={f.query}
          onChange={(v) => setFilter('query', v)}
          placeholder="搜索任务名称、编号、部门"
        />
        <Select
          label="全部板块"
          value={f.area}
          onChange={(v) => setFilter('area', v)}
          options={uniq(allowed.map((t) => t.businessArea))}
        />
        <Select
          label="全部部门"
          value={f.department}
          onChange={(v) => setFilter('department', v)}
          options={uniq(allowed.map((t) => t.leadDepartmentName))}
        />
        <Select
          label="年度"
          value={year}
          onChange={(v) => p.setYear(+v)}
          options={years}
          all={false}
        />
        <Select
          label="全部优先级"
          value={f.priority}
          onChange={(v) => setFilter('priority', v)}
          options={['高', '中', '低']}
        />
        <button className="text-link" onClick={p.reset}>
          重置
        </button>
        <div className="view-switch">
          <button
            className={view === 'cards' ? 'active' : ''}
            aria-label="卡片视图"
            aria-pressed={view === 'cards'}
            onClick={() => setView('cards')}
          >
            <LayoutGrid size={19} />
          </button>
          <button
            className={view === 'table' ? 'active' : ''}
            aria-label="表格视图"
            aria-pressed={view === 'table'}
            onClick={() => setView('table')}
          >
            <List size={19} />
          </button>
        </div>
      </div>
      <div className="list-heading">
        <h2>
          战略任务列表 <span>({list.length})</span>
        </h2>
        <span>原 DEMO 任务卡总数：{allowed.length} 张</span>
      </div>
      {!list.length ? (
        <Empty onReset={p.reset} />
      ) : view === 'cards' ? (
        <div className="task-grid">
          {list.map((t) => (
            <article className="task-card" key={t.id}>
              <div className="task-tags">
                <b>{t.code}</b>
                <span>{t.businessArea}</span>
                <em className={`priority ${t.priority === '高' ? 'high' : ''}`}>
                  {t.priority}
                </em>
              </div>
              <a
                className="task-title"
                href={`/tasks/${t.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(`/tasks/${t.id}`);
                }}
              >
                {t.title}
              </a>
              <p className="task-objective">{t.objective}</p>
              <div className="task-meta">
                <div>
                  <Building2 size={15} />
                  <span>牵头</span>
                  <b>{t.leadDepartmentName}</b>
                </div>
                <div>
                  <span>协同</span>
                  <b title={t.supportingDepartmentNames.join('、')}>
                    {t.supportingDepartmentNames.length
                      ? `${t.supportingDepartmentNames.length} 个`
                      : '—'}
                  </b>
                </div>
                <div>
                  <CalendarDays size={15} />
                  <span>实施时间</span>
                  <b>{t.period}</b>
                </div>
              </div>
              <div className="progress-line">
                <Progress value={t.overallProgress || null} label="总体进度" />
                <button
                  onClick={() => setExplanation(true)}
                  aria-label="查看计算口径"
                >
                  <Info size={16} />
                </button>
              </div>
              <div className="year-grid">
                {years.map((y) => (
                  <div key={y} className={year === y ? 'current' : ''}>
                    <span>{y}</span>
                    <b>
                      {yearlyProgress(t, y) === null
                        ? '—'
                        : `${yearlyProgress(t, y)}%`}
                    </b>
                  </div>
                ))}
              </div>
              <div className="task-bottom">
                <a
                  href={`/tasks/${t.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(`/tasks/${t.id}`);
                  }}
                >
                  查看详情
                  <ArrowRight size={15} />
                </a>
                <a
                  href={`/tasks/${t.id}?year=${year}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(`/tasks/${t.id}?year=${year}`);
                  }}
                >
                  查看填报
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel table-panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    '任务编号',
                    '任务名称',
                    '业务板块',
                    '牵头部门',
                    '优先级',
                    '实施时间',
                    '总体进度',
                    `${year} 年度进度`,
                    '操作',
                  ].map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td className="code">{t.code}</td>
                    <td className="wide-cell">
                      <button
                        className="text-link"
                        onClick={() => go(`/tasks/${t.id}`)}
                      >
                        {t.title}
                      </button>
                    </td>
                    <td>{t.businessArea}</td>
                    <td>{t.leadDepartmentName}</td>
                    <td>
                      <span
                        className={`priority ${t.priority === '高' ? 'high' : ''}`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td>{t.period}</td>
                    <td>{t.overallProgress}%</td>
                    <td>
                      {yearlyProgress(t, year) === null
                        ? '—'
                        : `${yearlyProgress(t, year)}%`}
                    </td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => go(`/tasks/${t.id}?year=${year}`)}
                      >
                        查看填报
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {explanation && (
        <Modal title="进度计算口径" onClose={() => setExplanation(false)}>
          <Explanation />
        </Modal>
      )}
    </>
  );
}
export function AnnualView(p: ViewProps) {
  const { year, filters: f, setFilter, allowed, reports } = p;
  const rows = standards
    .map((s) => ({ s, t: allowed.find((t) => t.id === s.taskId) }))
    .filter(
      (r): r is { s: Standard; t: Task } =>
        Boolean(r.t) && scheduled(r.s, year),
    )
    .filter(
      ({ s, t }) =>
        baseFilter(t, p) &&
        (!f.taskId || f.taskId === t.id) &&
        (!f.type ||
          (f.type === '指标类' ? s.type === 'metric' : s.type !== 'metric')) &&
        includes(
          `${t.code}${t.title}${s.sourceText}${t.leadDepartmentName}`,
          f.query,
        ) &&
        (!f.status ||
          (f.status === '逾期' && overdue(s)) ||
          (f.status === '有进度' && yearlyProgress(t, year) !== null) ||
          (f.status === '无进度' && yearlyProgress(t, year) === null) ||
          (f.status === '已达成' &&
            (reportProgress(
              s,
              reports[reportKey(s.id, year, t.leadDepartmentId)],
              year,
            ) ?? 0) >= 100)),
    );
  return (
    <>
      <YearTabs year={year} onChange={p.setYear} />
      <div className="filter-panel">
        <SearchBox
          value={f.query}
          onChange={(v) => setFilter('query', v)}
          placeholder="搜索任务、完成标准、部门"
        />
        <select
          aria-label="全部任务"
          value={f.taskId}
          onChange={(e) => setFilter('taskId', e.target.value)}
        >
          <option value="">全部任务</option>
          {allowed.map((t) => (
            <option value={t.id} key={t.id}>
              {t.code} {t.title}
            </option>
          ))}
        </select>
        <Select
          label="全部牵头部门"
          value={f.department}
          onChange={(v) => setFilter('department', v)}
          options={uniq(allowed.map((t) => t.leadDepartmentName))}
        />
        <Select
          label="全部板块"
          value={f.area}
          onChange={(v) => setFilter('area', v)}
          options={uniq(allowed.map((t) => t.businessArea))}
        />
        <Select
          label="全部标准类型"
          value={f.type}
          onChange={(v) => setFilter('type', v)}
          options={['指标类', '非指标类']}
        />
        <Select
          label="全部状态"
          value={f.status}
          onChange={(v) => setFilter('status', v)}
          options={['有进度', '无进度', '已达成', '逾期']}
        />
        <button className="text-link" onClick={p.reset}>
          重置
        </button>
      </div>
      <StatStrip
        items={[
          ['年度项目', rows.length],
          [
            '有进度项',
            rows.filter(({ t }) => yearlyProgress(t, year) !== null).length,
          ],
          [
            '已达成标准项',
            rows.filter(
              ({ s, t }) =>
                (reportProgress(
                  s,
                  reports[reportKey(s.id, year, t.leadDepartmentId)],
                  year,
                ) ?? 0) >= 100,
            ).length,
          ],
          ['逾期标准项', rows.filter(({ s }) => overdue(s)).length],
          [
            '进度',
            `${average(rows.map(({ t }) => yearlyProgress(t, year))) ?? 0}%`,
          ],
        ]}
      />
      <section className="panel table-panel">
        <div className="panel-heading padded">
          <h3>年度完成标准列表</h3>
          <span>共 {rows.length} 条</span>
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {[
                    '任务编号',
                    '任务名称',
                    '完成标准项',
                    '牵头部门',
                    '年度',
                    '标准类型',
                    '示例进度',
                    '逾期',
                    '操作',
                  ].map((s) => (
                    <th key={s}>{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ s, t }) => (
                  <tr key={s.id}>
                    <td className="code">{t.code}</td>
                    <td className="wide-cell">{t.title}</td>
                    <td className="wide-cell">{s.name}</td>
                    <td>{t.leadDepartmentName}</td>
                    <td>{year}</td>
                    <td>
                      <span
                        className={`status-tag ${s.type === 'metric' ? 'blue-tag' : ''}`}
                      >
                        {s.type === 'metric' ? '指标类' : '非指标类'}
                      </span>
                    </td>
                    <td>
                      {yearlyProgress(t, year) === null
                        ? '—'
                        : `${yearlyProgress(t, year)}%`}
                    </td>
                    <td>
                      <span className={overdue(s) ? 'overdue' : ''}>
                        {overdue(s) ? '是' : '否'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => p.go(`/tasks/${t.id}?year=${year}`)}
                      >
                        查看填报
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty onReset={p.reset} />
        )}
      </section>
    </>
  );
}
export function TaskDetail(p: ViewProps & { task: Task }) {
  const { task: t, year, user, reports, save } = p;
  const [cycle,setCycle]=useState(false);
  const [tab, setTab] = useState(
      typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).has('year')
        ? 'annual'
        : 'overview',
    ),
    [explanation, setExplanation] = useState(false),
    [editing, setEditing] = useState<Standard | null>(null),
    [viewReport, setViewReport] = useState<{ s: Standard; r: Report } | null>(
      null,
    );
  const all = taskStandards(t.id),
    rows = all.filter((s) => scheduled(s, year)),
    canEdit = user.role === 'department';
  return (
    <>
      <div className="detail-toolbar">
        <button
          className="back-link"
          onClick={() => p.go(`/tasks?year=${year}`)}
        >
          <ArrowLeft size={17} />
          返回战略任务
        </button>
        <button className="primary" onClick={() => setTab('annual')}>
          查看进度
        </button>
      </div>
      <section className="panel detail-intro">
        <div className="task-tags">
          <b>{t.code}</b>
          <span>{t.businessArea}</span>
          <em className={`priority ${t.priority === '高' ? 'high' : ''}`}>
            优先级：{t.priority}
          </em>
        </div>
        <h2>{t.title}</h2>
        <p>{t.objective}</p>
        <div className="detail-facts">
          <div>
            <span>牵头部门</span>
            <b>{t.leadDepartmentName}</b>
          </div>
          <div>
            <span>协同部门</span>
            <b>{t.supportingDepartmentNames.join('、') || '—'}</b>
          </div>
          <div>
            <span>实施时间</span>
            <b>{t.period}</b>
          </div>
          <div>
            <span>完成标准项</span>
            <b>{all.length} 项</b>
          </div>
        </div>
        <div className="progress-line">
          <Progress label="总体进度" value={t.overallProgress || null} />
          <button
            aria-label="查看计算口径"
            onClick={() => setExplanation(true)}
          >
            <Info size={17} />
          </button>
        </div>
      </section>
      <div className="tabs">
        <button
          className={tab === 'overview' ? 'active' : ''}
          onClick={() => setTab('overview')}
        >
          任务总览
        </button>
        <button
          className={tab === 'annual' ? 'active' : ''}
          onClick={() => setTab('annual')}
        >
          任务完成标准年度达成表
        </button>
      </div>
      {tab === 'overview' ? (
        <>
          <section className="panel">
            <h3 className="section-title">关键实施举措</h3>
            {t.measures.map((m, i) => (
              <article className="standard-item" key={m.id}>
                <span>举措 {i + 1}</span>
                <p>{m.description || m.title}</p>
              </article>
            ))}
          </section>
          <section className="panel">
            <h3 className="section-title">任务完成标准</h3>
            <p className="muted mb-space">
              只有完成全部任务完成标准，任务卡才可以判定为“已完成”。
            </p>
            {all.map((s) => (
              <article key={s.id} className="standard-item">
                <span>标准 {s.order}</span>
                <p>{s.sourceText}</p>
                <small>
                  {s.finalTargetDate
                    ? `计划完成：${s.finalTargetDate}`
                    : '持续推进'}
                </small>
              </article>
            ))}
          </section>
          {t.linkedIndicatorIds.length > 0 && (
            <section className="panel">
              <h3 className="section-title">关联指标</h3>
              <div className="linked-list">
                {indicators
                  .filter(
                    (i) =>
                      t.linkedIndicatorIds.includes(i.id) &&
                      (user.role === 'strategy' ||
                        i.departmentId === user.departmentId),
                  )
                  .map((i) => (
                    <button
                      key={i.id}
                      onClick={() => p.go(`/indicators/${i.id}?year=${year}`)}
                    >
                      {i.name}
                      <ArrowRight size={16} />
                    </button>
                  ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <div className="tabs cycle-tabs"><button className={cycle?'active':''} onClick={()=>setCycle(true)}>全周期</button><button className={!cycle?'active':''} onClick={()=>setCycle(false)}>单年度</button></div>
          <YearTabs year={year} onChange={p.setYear} />
          <Explanation />
          {cycle?<CycleTable task={t} reports={reports} user={user}/>:<section className="panel table-panel">
            <div className="panel-heading padded">
              <h3>{year} 年度达成表</h3>
              <span>
                共 {rows.length} 项 · {canEdit ? '部门填报' : '总行查看'}
              </span>
            </div>
            {rows.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {[
                        '完成标准',
                        '标准类型',
                        '最终目标',
                        '年度目标',
                        '示例进度',
                        '当前完成情况',
                        '填报部门',
                        '操作',
                      ].map((s) => (
                        <th key={s}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => {
                      const dep =
                          user.role === 'strategy'
                            ? t.leadDepartmentId
                            : user.departmentId,
                        r = reports[reportKey(s.id, year, dep)];
                      return (
                        <tr key={s.id}>
                          <td className="wide-cell">{s.name}</td>
                          <td>{s.type === 'metric' ? '指标类' : '非指标类'}</td>
                          <td className="wide-cell">
                            {s.finalTargetText || s.sourceText}
                          </td>
                          <td>
                            {targetFor(s, year) === null
                              ? s.finalTargetYear === year
                                ? '本年度完成'
                                : '—'
                              : `${format(targetFor(s, year))}${s.unit ?? ''}`}
                          </td>
                          <td>
                            {yearlyProgress(t, year) === null
                              ? '—'
                              : `${yearlyProgress(t, year)}%`}
                          </td>
                          <td className="wide-cell">
                            {r ? (
                              s.type === 'metric' ? (
                                `${format(r.value)}${s.unit ?? ''}`
                              ) : (
                                r.text
                              )
                            ) : (
                              <span className="muted">未填报</span>
                            )}
                          </td>
                          <td>
                            {user.role === 'strategy'
                              ? t.leadDepartmentName
                              : user.departmentName}
                          </td>
                          <td>
                            {canEdit ? (
                              <button
                                className="text-link"
                                onClick={() => setEditing(s)}
                              >
                                {r ? '修改填报' : '填报'}
                              </button>
                            ) : r ? (
                              <button
                                className="text-link"
                                onClick={() => setViewReport({ s, r })}
                              >
                                查看填报
                              </button>
                            ) : (
                              <span className="muted">未填报</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty />
            )}
          </section>}
          {user.role === 'strategy' &&
            Object.entries(reports).some(([key]) =>
              all.some((s) => key.startsWith(`${s.id}:${year}:`)),
            ) && (
              <section className="panel">
                <h3 className="section-title">部门填报记录</h3>
                {all.flatMap((s) =>
                  Object.entries(reports)
                    .filter(([key]) => key.startsWith(`${s.id}:${year}:`))
                    .map(([key, r]) => (
                      <article className="standard-item" key={key}>
                        <span>{s.name}</span>
                        <p>
                          {r.value !== null
                            ? `${format(r.value)}${s.unit ?? ''}`
                            : r.text}
                        </p>
                        <small>
                          部门编号：{r.departmentId} ·{' '}
                          {new Date(r.updatedAt).toLocaleString('zh-CN')}
                        </small>
                        {r.note && <p>{r.note}</p>}
                      </article>
                    )),
                )}
              </section>
            )}
        </>
      )}
      {explanation && (
        <Modal title="进度计算口径" onClose={() => setExplanation(false)}>
          <Explanation />
        </Modal>
      )}
      {editing && (
        <ReportForm
          title={editing.name}
          year={year}
          metric={editing.type === 'metric'}
          unit={editing.unit}
          departmentId={user.departmentId}
          existing={reports[reportKey(editing.id, year, user.departmentId)]}
          onSave={(r) => {
            save(editing.id, year, user.departmentId, r);
            setEditing(null);
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {viewReport && (
        <Modal
          title="填报记录"
          description={viewReport.s.name}
          onClose={() => setViewReport(null)}
        >
          <div className="report-read">
            <p>
              完成值：{format(viewReport.r.value)} {viewReport.s.unit}
            </p>
            <p>完成情况：{viewReport.r.text || '—'}</p>
            <p>备注：{viewReport.r.note || '—'}</p>
            <small>
              更新时间：
              {new Date(viewReport.r.updatedAt).toLocaleString('zh-CN')}
            </small>
          </div>
        </Modal>
      )}
    </>
  );
}

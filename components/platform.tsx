'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gauge,
  ClipboardList,
  CalendarDays,
  Target,
  Building2,
  Layers,
  Clock3,
  TrendingUp,
  ArrowUpRight,
  LogOut,
  Database,
  Menu,
  MessageCircle,
} from 'lucide-react';
import {
  tasks,
  standards,
  indicators,
  years,
  cutoff,
  uniq,
  taskOverdue,
  scheduled,
  average,
  yearlyProgress,
  visibleTasks,
  accounts,
  Account,
  Task,
} from '@/lib/data';
import { Reports, Report, reportKey } from '@/lib/reporting';
import systems from '@/data/systems.json';
import Login, { Brand } from './login';
import { Select, Modal, Empty } from './common';
import { TaskList, AnnualView, TaskDetail } from './task-views';
import { IndicatorList, IndicatorDetail } from './indicator-views';
import Assistant from './site-assistant';
const navigation = [
  ['cockpit', '战略驾驶舱', Gauge],
  ['tasks', '战略任务', ClipboardList],
  ['annual', '年度推进', CalendarDays],
  ['indicators', '指标任务', Target],
] as const;
const STORAGE = 'rizhao-strategy-demo-reports-v1';
export type Filters = {
  query: string;
  area: string;
  department: string;
  priority: string;
  status: string;
  type: string;
  taskId: string;
  unit: string;
  line: string;
};
const cleanFilters: Filters = {
  query: '',
  area: '',
  department: '',
  priority: '',
  status: '',
  type: '',
  taskId: '',
  unit: '',
  line: '',
};
export default function Platform() {
  const path = usePathname() || '/cockpit',
    router = useRouter();
  const [user, setUser] = useState<Account | null>(null),
    [ready, setReady] = useState(false),
    [year, setYear] = useState(2026),
    [filters, setFilters] = useState<Filters>(cleanFilters),
    [reports, setReports] = useState<Reports>({}),
    [collapsed, setCollapsed] = useState(false),
    [modal, setModal] = useState(''),
    [assistant, setAssistant] = useState(false),
    [notice, setNotice] = useState('');
  const section = path.split('/')[1] || 'cockpit',
    detailId = path.split('/')[2],
    title = navigation.find((n) => n[0] === section)?.[1] ?? '战略驾驶舱';
  useEffect(() => {
    try {
      const a = accounts.find(
        (a) => a.username === sessionStorage.getItem('rizhao-demo-account'),
      );
      if (a) setUser(a);
      const stored = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
        const valid = Object.fromEntries(
          Object.entries(stored).filter(
            ([, r]) =>
              r &&
              typeof r === 'object' &&
              'departmentId' in r &&
              'updatedAt' in r,
          ),
        );
        setReports(valid as Reports);
      }
    } catch {
      setNotice('浏览器存储暂不可用，本次填报可能无法保留。');
    }
    setReady(true);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const y = Number(params.get('year'));
    if (years.includes(y)) setYear(y);
    setFilters({
      ...cleanFilters,
      area: params.get('area') || '',
      department: params.get('department') || '',
      status: params.get('overdue') === '1' ? '逾期' : '',
      taskId: params.get('task') || '',
    });
    setModal('');
  }, [path]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  const allowed = user ? visibleTasks(user) : [],
    isStrategy = user?.role === 'strategy';
  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const reset = () => setFilters(cleanFilters);
  const go = (route: string) => router.push(route);
  const save = (id: string, y: number, departmentId: string, r: Report) => {
    if (!user || user.role === 'strategy' || departmentId !== user.departmentId)
      throw Error('当前账号没有填报权限。');
    const task = tasks.find(
        (t) => t.id === standards.find((s) => s.id === id)?.taskId,
      ),
      indicator = indicators.find((i) => i.id === id);
    if (
      (task && !allowed.some((t) => t.id === task.id)) ||
      (indicator && indicator.departmentId !== departmentId) ||
      (!task && !indicator)
    )
      throw Error('当前账号没有该事项的填报权限。');
    const next = { ...reports, [reportKey(id, y, departmentId)]: r };
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
    } catch {
      throw Error('浏览器无法保存，请检查存储空间或隐私设置。');
    }
    setReports(next);
    setNotice('填报已保存，可在当前浏览器继续查看。');
  };
  useEffect(() => {
    if (!user) return;
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: { signal: AbortSignal },
          ) => unknown;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tool = {
      name: 'search_strategy_tasks',
      title: '检索战略任务',
      description:
        '按关键词检索当前演示账号可见的战略任务，返回任务编号、名称和牵头部门。',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute(input: unknown) {
        if (
          !input ||
          typeof input !== 'object' ||
          !('query' in input) ||
          typeof input.query !== 'string' ||
          input.query.length > 200
        )
          throw Error('query 必须为不超过 200 字的字符串');
        const q = input.query.trim().toLowerCase();
        return {
          tasks: visibleTasks(user)
            .filter((t) =>
              `${t.code}${t.title}${t.objective}${t.leadDepartmentName}`
                .toLowerCase()
                .includes(q),
            )
            .map((t) => ({
              id: t.id,
              code: t.code,
              title: t.title,
              department: t.leadDepartmentName,
            })),
          dataNote: '原 DEMO 示例数据，待替换日照银行规划',
        };
      },
    };
    try {
      Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [user]);
  if (!ready)
    return (
      <div className="loading" role="status">
        正在载入战略规划平台…
      </div>
    );
  if (!user || section === 'login')
    return (
      <Login
        onLogin={(a) => {
          setUser(a);
          try {
            sessionStorage.setItem('rizhao-demo-account', a.username);
          } catch {}
          router.push('/cockpit');
        }}
      />
    );
  const base = allowed.filter(
      (t) => !filters.area || t.businessArea === filters.area,
    ),
    annual = standards.filter(
      (s) => base.some((t) => t.id === s.taskId) && scheduled(s, year),
    ),
    deps = uniq(base.map((t) => t.leadDepartmentName));
  const visibleIndicators = indicators.filter(
    (i) =>
      (isStrategy || i.departmentId === user.departmentId) &&
      (!filters.area ||
        base.some(
          (t) =>
            t.linkedIndicatorIds.includes(i.id) ||
            t.leadDepartmentId === i.departmentId,
        )),
  );
  const visibleSystems = systems.filter(
    (s) =>
      (isStrategy || s.leadDepartmentId === user.departmentId) &&
      (!filters.area ||
        base.some((t) => t.leadDepartmentId === s.leadDepartmentId)),
  );
  const query = `year=${year}${filters.area ? `&area=${encodeURIComponent(filters.area)}` : ''}`;
  const cards = [
    {
      label: '战略任务总数',
      value: base.length,
      icon: ClipboardList,
      action: '进入战略任务',
      color: 'blue',
      run: () => go(`/tasks?${query}`),
    },
    {
      label: '逾期任务',
      value: base.filter(taskOverdue).length,
      icon: Clock3,
      action: '查看逾期任务',
      color: 'orange',
      run: () => go(`/annual?${query}&overdue=1`),
    },
    {
      label: `${year} 年度填报项`,
      value: annual.length,
      icon: Layers,
      action: '进入年度推进',
      color: 'cyan',
      run: () => go(`/annual?${query}`),
    },
    {
      label: `${year} 年度进度`,
      value: `${average(base.map((t) => yearlyProgress(t, year))) ?? 0}%`,
      icon: TrendingUp,
      action: '进入年度推进',
      color: 'blue',
      run: () => go(`/annual?${query}`),
    },
    {
      label: '牵头部门数',
      value: deps.length,
      icon: Building2,
      action: '查看部门明细',
      color: 'cyan',
      run: () => setModal('departments'),
    },
    {
      label: '指标任务总数',
      value: visibleIndicators.length,
      icon: Target,
      action: '进入指标任务',
      color: 'green',
      run: () => go(`/indicators?${query}`),
    },
    {
      label: '系统建设事项',
      value: visibleSystems.length,
      icon: Database,
      action: '查看系统清单',
      color: 'orange',
      run: () => setModal('systems'),
    },
  ];
  const shared = {
    year,
    setYear,
    filters,
    setFilter,
    reset,
    user,
    allowed,
    reports,
    save,
    go,
  };
  const selectedTask = allowed.find((t) => t.id === detailId),
    selectedIndicator = indicators.find(
      (i) =>
        i.id === detailId &&
        (isStrategy || i.departmentId === user.departmentId),
    );
  return (
    <div className={`platform ${collapsed ? 'collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <Brand />
          <button
            className="collapse-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="切换导航"
            aria-expanded={!collapsed}
          >
            <Menu size={20} />
          </button>
        </div>
        <p className="brand-sub">“十五五”战略规划执行管理平台</p>
        <div className="view-label">
          当前视角：{isStrategy ? '战略驾驶舱' : user.departmentName}
        </div>
        <nav>
          {navigation.map(([id, label, Icon]) => (
            <a
              key={id}
              className={id === section ? 'active' : ''}
              href={`/${id}`}
              onClick={(e) => {
                e.preventDefault();
                go(`/${id}?year=${year}`);
              }}
              aria-current={id === section ? 'page' : undefined}
              title={label}
            >
              <Icon size={21} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <b>{year} 战略执行季</b>
          <p>聚焦完成标准、部门推进与指标达成的统一管理视图。</p>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <small>日照银行 / 十五五战略规划</small>
            <h1>{title}</h1>
          </div>
          <div className="topbar-right">
            <span className="badge">当前年度：{year}</span>
            <span className="badge teal">
              {isStrategy ? '总行视角' : '部门视角'}
            </span>
            <div className="account">
              <b>{user.username}</b>
              <small>{user.departmentName}</small>
            </div>
            <button
              className="outline"
              onClick={() => {
                setUser(null);
                try {
                  sessionStorage.removeItem('rizhao-demo-account');
                } catch {}
                go('/login');
              }}
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        </header>
        <div className="page-content">
          {section === 'cockpit' || section === '' ? (
            <>
              <div className="page-heading">
                <div>
                  <h2>日照银行“十五五”战略驾驶舱</h2>
                  <p>
                    {user.departmentName} ·{' '}
                    {isStrategy ? '全行任务执行总览' : '部门任务执行总览'}
                  </p>
                </div>
                <div className="filters">
                  <span className="date-label">数据截止日期：{cutoff}</span>
                  <Select
                    label="年度"
                    value={year}
                    onChange={(v) => setYear(Number(v))}
                    options={years}
                    all={false}
                  />
                  <Select
                    label="全部板块"
                    value={filters.area}
                    onChange={(v) => setFilter('area', v)}
                    options={uniq(allowed.map((t) => t.businessArea))}
                  />
                </div>
              </div>
              <div className="metric-grid">
                {cards.map(
                  ({ label, value, icon: Icon, action, color, run }) => (
                    <button className="metric-card" key={label} onClick={run}>
                      <div className={`metric-icon ${color}`}>
                        <Icon size={24} />
                      </div>
                      <div className="spark" aria-hidden="true">
                        {[24, 38, 31, 50, 42].map((h, i) => (
                          <i key={i} style={{ height: h }} />
                        ))}
                      </div>
                      <p>{label}</p>
                      <strong>{value}</strong>
                      <span>
                        {action}
                        <ArrowUpRight size={15} />
                      </span>
                    </button>
                  ),
                )}
              </div>
              <div className="hint">
                点击上方总览卡片，可进入对应模块或查看明细。
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <h3>各业务板块任务分布</h3>
                  <span>共 {base.length} 项战略任务</span>
                </div>
                {base.length ? (
                  <div className="distribution">
                    {uniq(base.map((t) => t.businessArea)).map((a) => {
                      const count = base.filter(
                        (t) => t.businessArea === a,
                      ).length;
                      return (
                        <button
                          className="bar-row"
                          key={a}
                          onClick={() =>
                            go(
                              `/tasks?year=${year}&area=${encodeURIComponent(a)}`,
                            )
                          }
                        >
                          <span>{a}</span>
                          <div>
                            <i
                              style={{
                                width: `${(count / Math.max(...uniq(base.map((t) => t.businessArea)).map((a) => base.filter((t) => t.businessArea === a).length))) * 100}%`,
                              }}
                            />
                          </div>
                          <b>{count}</b>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Empty />
                )}
              </section>
            </>
          ) : section === 'tasks' ? (
            detailId ? (
              selectedTask ? (
                <TaskDetail
                  key={selectedTask.id}
                  task={selectedTask}
                  {...shared}
                />
              ) : (
                <Empty />
              )
            ) : (
              <TaskList {...shared} />
            )
          ) : section === 'annual' ? (
            <AnnualView {...shared} />
          ) : section === 'indicators' ? (
            detailId ? (
              selectedIndicator ? (
                <IndicatorDetail
                  key={selectedIndicator.id}
                  indicator={selectedIndicator}
                  {...shared}
                />
              ) : (
                <Empty />
              )
            ) : (
              <IndicatorList {...shared} />
            )
          ) : (
            <Empty />
          )}
          <footer>
            原 DEMO
            示例数据，待替换日照银行规划。页面进度不代表实际经营完成情况。
          </footer>
        </div>
      </main>
      {modal && (
        <Modal
          title={modal === 'departments' ? '牵头部门明细' : '系统建设事项'}
          description={
            modal === 'departments'
              ? `当前范围共 ${deps.length} 个牵头部门`
              : `当前范围共 ${visibleSystems.length} 项系统建设事项`
          }
          onClose={() => setModal('')}
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {(modal === 'departments'
                    ? ['牵头部门', '战略任务数', '操作']
                    : ['系统名称', '牵头部门', '计划时间', '状态']
                  ).map((t) => (
                    <th key={t}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modal === 'departments'
                  ? deps.map((d) => (
                      <tr key={d}>
                        <td>{d}</td>
                        <td>
                          {
                            base.filter((t) => t.leadDepartmentName === d)
                              .length
                          }
                        </td>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => {
                              setModal('');
                              router.push(`/tasks?year=${year}&department=${encodeURIComponent(d)}`);
                            }}
                          >
                            查看任务
                          </button>
                        </td>
                      </tr>
                    ))
                  : visibleSystems.map((s, i) => (
                      <tr key={i}>
                        <td>{s.name}</td>
                        <td>{s.leadDepartment}</td>
                        <td>{s.dueDate}</td>
                        <td>
                          <span
                            className={`status-tag ${s.status === '进行中' ? 'blue-tag' : ''}`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
      <button className="assistant-toggle" onClick={() => setAssistant(true)}>
        <MessageCircle size={20} />
        <span>智能助手</span>
      </button>
      {assistant && (
        <Assistant
          tasks={allowed}
          onClose={() => setAssistant(false)}
          go={go}
        />
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, ClipboardList, Database, Edit3, Home, LockKeyhole, LogOut, Search, Target, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../components/common/LogoMark';
import { dashboardSeed } from '../data/dashboard';
import { indicators } from '../data/indicators';
import { CURRENT_DEMO_YEAR, DEMO_DATA_AS_OF_DATE } from '../data/constants';
import { accounts } from '../data/accounts';
import { useAuth } from '../hooks/useAuth';
import { useQuarterlyReports } from '../hooks/useQuarterlyReports';
import { useTaskReporting } from '../hooks/useTaskReporting';
import type { StrategicTask, Year } from '../types';
import {
  years,
} from '../utils/taskCalculations';
import { calculateTaskOverallQuarterProgress, calculateTaskYearQuarterProgress } from '../utils/quarterlyProgress';
import { getLeadTasks, getSupportTasks, getTaskRelation, getVisibleTasks } from '../utils/taskSelectors';
import { indicatorValue, isIndicatorAchieved, isIndicatorFilled } from '../utils/indicatorCalculations';

type MiniTab = 'cockpit' | 'tasks' | 'workbench' | 'indicators';
type Sheet = 'departments' | 'systems' | null;

export function MiniProgramPage() {
  const { user, login, logout, matchAccount } = useAuth();
  const [account, setAccount] = useState('111zlb');
  const [password, setPassword] = useState('111');
  const [message, setMessage] = useState('');
  const matched = useMemo(() => matchAccount(account), [account, matchAccount]);

  if (!user) {
    function handleLogin(event: React.FormEvent) {
      event.preventDefault();
      const result = login(account, password);
      if (!result.ok) setMessage(result.message ?? '登录信息不正确');
    }

    return (
      <MiniFrame>
        <div className="flex min-h-screen flex-col bg-[#0B2F73] text-white">
          <div className="px-6 pt-8">
            <LogoMark inverse />
            <h1 className="mt-8 text-3xl font-black leading-tight">日照银行十五五战略执行小程序</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">与 PC 端同源数据，按账号进入战略驾驶舱或部门工作台。</p>
          </div>
          <form onSubmit={handleLogin} className="mt-auto rounded-t-[28px] bg-[#F6F9FE] px-5 pb-7 pt-6 text-ink">
            <div className="text-center">
              <div className="mx-auto inline-flex"><LogoMark compact /></div>
              <h2 className="mt-3 text-2xl font-black text-brand-500">日照银行</h2>
              <p className="mt-1 text-sm font-semibold text-muted">“十五五”战略规划执行管理平台</p>
            </div>
            <label className="mt-6 block">
              <span className="text-sm font-bold">账号</span>
              <div className="mt-2 flex h-12 items-center gap-2 rounded-[14px] border border-[#D9E3F2] bg-white px-3">
                <UserRound size={18} className="text-muted" />
                <input className="w-full outline-none" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="请输入账号" />
              </div>
              {account && matched && <div className="mt-2 text-xs font-bold text-brand-500">已识别：{matched.departmentName}</div>}
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-bold">密码</span>
              <div className="mt-2 flex h-12 items-center gap-2 rounded-[14px] border border-[#D9E3F2] bg-white px-3">
                <LockKeyhole size={18} className="text-muted" />
                <input className="w-full outline-none" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" />
              </div>
            </label>
            {message && <div className="mt-3 rounded-xl bg-[#FFF7ED] px-3 py-2 text-sm font-bold text-[#B54708]">{message}</div>}
            <button className="mt-5 h-12 w-full rounded-[16px] bg-brand-500 font-black text-white shadow-lg shadow-brand-500/20">登录</button>
            <div className="mt-5 rounded-[16px] bg-[#EEF5FF] p-3 text-xs leading-6 text-muted">
              <b className="text-ink">演示账号</b><br />
              {accounts.slice(0, 4).map((item) => <span key={item.username}>{item.username}：{item.departmentName}<br /></span>)}
              统一密码：111
            </div>
          </form>
        </div>
      </MiniFrame>
    );
  }

  return <MiniAuthenticatedApp logout={logout} />;
}

function MiniAuthenticatedApp({ logout }: { logout: () => void }) {
  const { user } = useAuth();
  const { tasks } = useTaskReporting();
  const { reports } = useQuarterlyReports();
  const isStrategy = user?.role === 'strategy';
  const [tab, setTab] = useState<MiniTab>(isStrategy ? 'cockpit' : 'workbench');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [year, setYear] = useState<Year>(CURRENT_DEMO_YEAR);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setTab(isStrategy ? 'cockpit' : 'workbench');
  }, [isStrategy]);

  const visibleTasks = useMemo(() => getVisibleTasks(tasks, user), [tasks, user]);
  const leadTasks = getLeadTasks(visibleTasks, user?.departmentId);
  const supportTasks = getSupportTasks(visibleTasks, user?.departmentId);
  const filteredTasks = visibleTasks
    .filter((task) => !query.trim() || `${task.code}${task.title}${task.leadDepartmentName}`.includes(query.trim()));
  const visibleIndicators = user?.role === 'strategy' ? indicators : indicators.filter((indicator) => indicator.departmentId === user?.departmentId);
  const filledIndicators = visibleIndicators.filter((indicator) => isIndicatorFilled(indicator, year)).length;
  const achievedIndicators = visibleIndicators.filter((indicator) => isIndicatorAchieved(indicator, year)).length;
  const leadDepartments = Array.from(new Set(tasks.map((task) => task.leadDepartmentId))).map((id) => {
    const owned = tasks.filter((task) => task.leadDepartmentId === id);
    return { id, name: owned[0]?.leadDepartmentName ?? id, count: owned.length };
  });

  return (
    <MiniFrame>
      <div className="mini-app min-h-[100dvh] bg-[#F6F9FE] text-ink">
        <header className="mini-app-header sticky top-0 z-20 border-b border-[#D9E3F2] bg-white/95 px-4 pb-3 pt-3 backdrop-blur">
          <div className="mini-statusbar"><span>9:41</span><span>● ● ● ▰</span></div>
          <div className="flex items-center justify-between">
            <LogoMark compact />
            <button onClick={logout} className="flex items-center gap-1 rounded-full bg-[#F2F4F7] px-3 py-1 text-xs font-bold text-muted">
              <LogOut size={13} /> 退出
            </button>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-black">{isStrategy ? '战略驾驶舱' : '部门工作台'}</h1>
              <p className="mt-1 text-xs font-semibold text-muted">{user?.username} · {user?.departmentName}</p>
            </div>
            <span className="rounded-full bg-[#ECFEFF] px-3 py-1 text-xs font-black text-[#087D92]">{isStrategy ? '战略视角' : '部门视角'}</span>
          </div>
        </header>

        <main className="mini-app-content px-4 pb-28 pt-4">
          {tab === 'cockpit' && isStrategy && (
            <div className="space-y-4">
              <section className="rounded-[20px] bg-gradient-to-br from-brand-700 to-brand-500 p-4 text-white shadow-lg">
                <div className="text-sm font-semibold text-white/75">日照银行“十五五”战略驾驶舱</div>
                <div className="mt-2 text-3xl font-black">{tasks.length}</div>
                <div className="mt-1 text-sm text-white/80">战略任务总数 · 数据截止 {DEMO_DATA_AS_OF_DATE}</div>
              </section>
              <div className="grid grid-cols-2 gap-3">
                <MiniMetric title="战略任务总数" value={tasks.length} onClick={() => setTab('tasks')} />
                <MiniMetric title="牵头部门数" value={leadDepartments.length} onClick={() => setSheet('departments')} />
                <MiniMetric title="系统建设事项" value={dashboardSeed.systemProjects.length} onClick={() => setSheet('systems')} />
              </div>
              <BusinessAreaList tasks={tasks} />
            </div>
          )}

          {tab === 'workbench' && !isStrategy && (
            <div className="space-y-4">
              <section className="rounded-[20px] bg-gradient-to-br from-brand-700 to-brand-500 p-4 text-white shadow-lg">
                <div className="text-sm font-semibold text-white/75">{user?.departmentName}</div>
                <div className="mt-2 text-3xl font-black">{visibleTasks.length}</div>
                <div className="mt-1 text-sm text-white/80">本部门相关任务</div>
              </section>
              <div className="grid grid-cols-2 gap-2">
                <MiniCounter label="我牵头" value={leadTasks.length} />
                <MiniCounter label="我协同" value={supportTasks.length} />
              </div>
              <SearchBox query={query} setQuery={setQuery} />
              <div className="space-y-3">
                {filteredTasks.slice(0, 12).map((task) => <MobileTaskCard key={task.id} task={task} year={year} canEdit={getTaskRelation(task, user?.departmentId) === 'lead'} departmentId={user?.departmentId} reports={reports} />)}
              </div>
            </div>
          )}

          {tab === 'tasks' && isStrategy && (
            <div className="space-y-4">
              <SearchBox query={query} setQuery={setQuery} />
              <div className="grid grid-cols-2 gap-2">
                <MiniCounter label="任务总数" value={tasks.length} />
                <MiniCounter label="筛选结果" value={filteredTasks.length} />
              </div>
              <div className="space-y-3">
                {filteredTasks.slice(0, 20).map((task) => <MobileTaskCard key={task.id} task={task} year={year} canEdit={false} reports={reports} />)}
              </div>
            </div>
          )}

          {tab === 'indicators' && (
            <div className="space-y-4">
              <YearPicker year={year} setYear={setYear} />
              <div className="grid grid-cols-3 gap-2">
                <MiniCounter label="指标" value={visibleIndicators.length} />
                <MiniCounter label="已填报" value={filledIndicators} />
                <MiniCounter label="已达成" value={achievedIndicators} />
              </div>
              <section className="rounded-[18px] bg-white shadow-sm">
                <div className="border-b border-[#E4EBF5] px-4 py-3 font-black">指标任务</div>
                <div className="divide-y divide-[#E4EBF5]">
                  {visibleIndicators.map((indicator) => {
                    const value = indicatorValue(indicator, year);
                    return (
                      <div key={indicator.id} className="p-4">
                        <div className="text-sm font-black">{indicator.name}</div>
                        <div className="mt-1 text-xs text-muted">{indicator.businessLine} · {indicator.departmentName}</div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <span className="rounded-lg bg-[#F8FBFF] px-2 py-2 text-muted">目标<br /><b className="text-ink">{value.target ?? '—'}</b></span>
                          <span className="rounded-lg bg-[#F8FBFF] px-2 py-2 text-muted">完成<br /><b className="text-ink">{value.actual ?? '—'}</b></span>
                          <span className="rounded-lg bg-[#F8FBFF] px-2 py-2 text-muted">完成率<br /><b className="text-brand-500">{value.completionRate == null ? '—' : `${value.completionRate}%`}</b></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </main>

        <MiniBottomNav tab={tab} setTab={setTab} isStrategy={isStrategy} />
        <MiniSheet sheet={sheet} setSheet={setSheet} leadDepartments={leadDepartments} />
      </div>
    </MiniFrame>
  );
}

function MiniFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mini-device-stage">
      <div className="mini-device">{children}</div>
    </div>
  );
}

function MiniBottomNav({ tab, setTab, isStrategy }: { tab: MiniTab; setTab: (tab: MiniTab) => void; isStrategy: boolean }) {
  const items: Array<{ key: MiniTab; label: string; icon: LucideIcon }> = isStrategy
    ? [
        { key: 'cockpit', label: '驾驶舱', icon: Home },
        { key: 'tasks', label: '战略任务', icon: ClipboardList },
        { key: 'indicators', label: '指标任务', icon: Target },
      ]
    : [
        { key: 'workbench', label: '工作台', icon: Home },
        { key: 'indicators', label: '指标任务', icon: Target },
      ];

  return (
    <nav className={`fixed bottom-0 left-1/2 z-30 grid w-full max-w-[430px] -translate-x-1/2 border-t border-[#D9E3F2] bg-white pb-3 pt-2 ${isStrategy ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {items.map((item) => <MiniTabButton key={item.key} active={tab === item.key} icon={item.icon} label={item.label} onClick={() => setTab(item.key)} />)}
    </nav>
  );
}

function MiniMetric({ title, value, onClick }: { title: string; value: number | string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-[18px] bg-white p-4 text-left shadow-sm">
      <div className="text-xs font-semibold text-muted">{title}</div>
      <div className="mt-2 text-2xl font-black text-ink">{value}</div>
      <div className="mt-3 flex items-center text-xs font-bold text-brand-500">查看 <ChevronRight size={14} /></div>
    </button>
  );
}

function MiniCounter({ label, value, tone = 'blue' }: { label: string; value: number | string; tone?: 'blue' | 'orange' }) {
  return (
    <div className="rounded-[14px] bg-white px-3 py-3 shadow-sm">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-lg font-black ${tone === 'orange' ? 'text-[#B54708]' : 'text-brand-500'}`}>{value}</div>
    </div>
  );
}

function SearchBox({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-[14px] bg-white px-3 shadow-sm">
      <Search size={16} className="text-muted" />
      <input className="w-full bg-transparent text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索任务编号或名称" />
    </div>
  );
}

function YearPicker({ year, setYear }: { year: Year; setYear: (year: Year) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {years.map((item) => (
        <button key={item} onClick={() => setYear(item)} className={`h-9 shrink-0 rounded-full px-4 text-sm font-bold ${year === item ? 'bg-brand-500 text-white' : 'bg-white text-muted'}`}>{item}</button>
      ))}
    </div>
  );
}

function BusinessAreaList({ tasks }: { tasks: StrategicTask[] }) {
  return (
    <section className="rounded-[18px] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-black">业务板块任务分布</h2>
        <Database size={18} className="text-brand-500" />
      </div>
      <div className="mt-3 space-y-2">
        {Array.from(new Set(tasks.map((task) => task.businessArea))).slice(0, 8).map((area) => {
          const count = tasks.filter((task) => task.businessArea === area).length;
          return (
            <div key={area} className="flex items-center gap-2 text-sm">
              <span className="w-28 truncate text-muted">{area}</span>
              <span className="h-2 flex-1 rounded-full bg-[#EEF5FF]"><span className="block h-2 rounded-full bg-brand-500" style={{ width: `${Math.max(8, count / tasks.length * 100)}%` }} /></span>
              <span className="w-8 text-right font-black text-brand-500">{count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MobileTaskCard({ task, year, canEdit, departmentId, reports }: { task: StrategicTask; year: Year; canEdit: boolean; departmentId?: string; reports: ReturnType<typeof useQuarterlyReports>['reports'] }) {
  const progress = calculateTaskYearQuarterProgress(task, year, reports, canEdit ? departmentId : undefined);
  const overallProgress = calculateTaskOverallQuarterProgress(task, reports);
  const relationType = getTaskRelation(task, departmentId);
  const relation = departmentId ? (relationType === 'lead' ? '我牵头' : '我协同') : task.leadDepartmentName;
  const isLockedForSupport = relationType === 'support';
  return (
    <article className="rounded-[18px] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-black text-brand-500">{relation}</span>
        <span className="text-xs font-bold text-muted">{task.code}</span>
      </div>
      <h3 className="mt-3 text-base font-black">{task.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{task.objective}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <span className="rounded-lg bg-[#F8FBFF] px-2 py-2">牵头<br /><b>{task.leadDepartmentName}</b></span>
        <span className="rounded-lg bg-[#F8FBFF] px-2 py-2">总体进度<br /><b>{overallProgress == null ? '—' : `${overallProgress}%`}</b></span>
        <span className="rounded-lg bg-[#F8FBFF] px-2 py-2">{year}填报<br /><b>{progress == null ? '—' : `${progress}%`}</b></span>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Link to={`/tasks/${task.id}`} className="inline-flex h-8 items-center rounded-xl border border-[#D9E3F2] bg-white px-3 text-xs font-bold text-brand-500">
          查看详情
        </Link>
        <Link to={`/tasks/${task.id}?year=${year}${canEdit ? '&mode=edit' : ''}`} className={`inline-flex h-8 items-center gap-1 rounded-xl px-3 text-xs font-bold ${canEdit ? 'bg-brand-500 text-white' : 'border border-[#D9E3F2] bg-[#F8FBFF] text-muted'}`}>
          {isLockedForSupport ? <LockKeyhole size={13} /> : <Edit3 size={13} />} {canEdit ? '填报进度' : '查看进度'}
        </Link>
      </div>
    </article>
  );
}

function MiniTabButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 text-xs font-bold ${active ? 'text-brand-500' : 'text-muted'}`}>
      <Icon size={20} />
      {label}
    </button>
  );
}

function MiniSheet({ sheet, setSheet, leadDepartments }: { sheet: Sheet; setSheet: (sheet: Sheet) => void; leadDepartments: Array<{ id: string; name: string; count: number }> }) {
  if (!sheet) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/35" onClick={() => setSheet(null)}>
      <section className="absolute bottom-0 left-1/2 max-h-[70vh] w-full max-w-[430px] -translate-x-1/2 overflow-y-auto rounded-t-[24px] bg-white p-4" onClick={(event) => event.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#D9E3F2]" />
        <h2 className="text-lg font-black">{sheet === 'departments' ? '牵头部门明细' : '系统建设清单'}</h2>
        <div className="mt-3 space-y-3">
          {sheet === 'departments' && leadDepartments.map((item) => <SheetRow key={item.id} title={item.name} meta={`牵头任务 ${item.count} 项`} />)}
          {sheet === 'systems' && dashboardSeed.systemProjects.slice(0, 12).map((item) => <SheetRow key={`${item.name}-${item.dueDate}`} title={item.name} meta={`${item.leadDepartment} · ${item.dueDate || '待定'} · ${item.status}`} />)}
        </div>
      </section>
    </div>
  );
}

function SheetRow({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="p-3">
      <div className="text-sm font-black">{title}</div>
      <div className="mt-1 text-xs text-muted">{meta}</div>
    </div>
  );
}

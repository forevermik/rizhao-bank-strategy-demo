import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Building2,
  CalendarCheck,
  ClipboardList,
  Gauge,
  LogOut,
  Menu,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogoMark } from '../common/LogoMark';
import { AiAssistant } from '../ai-assistant/AiAssistant';

const navItems = [
  { to: '/cockpit', label: '战略驾驶舱', icon: Gauge },
  { to: '/workbench', label: '工作台', icon: Building2 },
  { to: '/tasks', label: '战略任务', icon: ClipboardList },
  { to: '/annual', label: '年度推进', icon: CalendarCheck },
  { to: '/indicators', label: '指标任务', icon: Target },
];

const titleMap: Record<string, string> = {
  cockpit: '战略驾驶舱',
  workbench: '工作台',
  tasks: '战略任务',
  annual: '年度推进',
  indicators: '指标任务',
};

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const isStrategic = user?.role === 'strategy';
  const visibleNavItems = navItems.filter((item) => {
    if (isStrategic) return ['/cockpit', '/tasks', '/annual', '/indicators'].includes(item.to);
    return ['/workbench', '/annual', '/indicators'].includes(item.to);
  });
  const key = location.pathname.split('/')[1] || (isStrategic ? 'cockpit' : 'workbench');
  const title = titleMap[key] ?? '战略规划';

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className={`${collapsed ? 'w-[86px]' : 'w-[258px]'} fixed inset-y-0 left-0 z-20 border-r border-[#D9E3F2] bg-white/90 px-4 py-5 backdrop-blur-xl transition-all duration-200`}>
        <div className="flex items-center justify-between">
          <LogoMark compact={collapsed} />
          <button
            className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-brand-50 hover:text-brand-500"
            onClick={() => setCollapsed((value) => !value)}
            aria-label="切换导航"
          >
            <Menu size={20} />
          </button>
        </div>
        <nav className="mt-10 space-y-2">
          {!collapsed && (
            <div className="mb-3 rounded-[14px] bg-[#EEF5FF] px-3 py-2 text-xs font-black text-brand-500">
              {isStrategic ? '当前视角：战略驾驶舱' : '当前视角：工作台'}
            </div>
          )}
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex h-12 items-center gap-3 rounded-[14px] px-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-[#344054] hover:bg-brand-50 hover:text-brand-500'
                }`
              }
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        {!collapsed && (
          <div className="absolute bottom-5 left-4 right-4 rounded-ui bg-gradient-to-br from-brand-700 to-brand-500 p-4 text-white shadow-glow">
            <div className="text-sm font-semibold">2026 战略执行季</div>
            <div className="mt-2 text-xs leading-5 text-white/75">聚焦关键举措、季度填报与指标达成的统一管理视图。</div>
          </div>
        )}
      </aside>

      <main className={`${collapsed ? 'pl-[86px]' : 'pl-[258px]'} min-h-screen flex-1 transition-all duration-200`}>
        <header className="sticky top-0 z-10 border-b border-[#D9E3F2] bg-white/80 px-8 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-muted">日照银行 / 十五五战略规划</div>
              <h1 className="mt-1 text-2xl font-extrabold text-ink">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-500">当前年度：2026</div>
              <div className="rounded-full bg-[#ECFEFF] px-4 py-2 text-sm font-semibold text-[#087D92]">
                {isStrategic ? '总行视角' : '部门视角'}
              </div>
              <div className="rounded-ui border border-[#D9E3F2] bg-white px-4 py-2 text-right shadow-sm">
                <div className="text-sm font-bold text-ink">{user?.username}</div>
                <div className="text-xs text-muted">{user?.departmentName}</div>
              </div>
              <button
                onClick={logout}
                className="flex h-11 items-center gap-2 rounded-ui border border-[#D9E3F2] bg-white px-4 text-sm font-semibold text-muted shadow-sm transition hover:border-brand-500 hover:text-brand-500"
              >
                <LogOut size={18} />
                退出登录
              </button>
            </div>
          </div>
        </header>
        <div className="page-fade p-8">
          <Outlet />
          <div className="mt-8 rounded-xl bg-[#F8FBFF] px-4 py-3 text-center text-xs font-semibold text-muted">
            页面进度为静态Demo演示数据，不代表实际经营完成情况。
          </div>
          <AiAssistant variant="desktop" />
        </div>
      </main>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Eye, LockKeyhole, UserRound } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoMark } from '../components/common/LogoMark';

export function LoginPage() {
  const { user, login, matchAccount } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState('111zlb');
  const [password, setPassword] = useState('111');
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const matched = useMemo(() => matchAccount(account), [account, matchAccount]);

  useEffect(() => {
    if (account && !matched) setMessage('未匹配到演示部门');
    else setMessage('');
  }, [account, matched]);

  if (user) return <Navigate to={user.role === 'strategy' ? '/cockpit' : '/workbench'} replace />;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = login(account, password);
    if (!result.ok) {
      setMessage(result.message ?? '登录信息不正确');
      return;
    }
    setTransitioning(true);
    setTimeout(() => navigate(matched?.role === 'strategy' ? '/cockpit' : '/workbench'), 520);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#0A2A6B]">
      <div className="grid min-h-screen grid-cols-[1.08fr_0.92fr]">
        <section className="flex flex-col justify-between bg-[#0B2F73] p-12 text-white">
          <div>
            <LogoMark inverse />
          </div>
          <div className="max-w-2xl">
            <h1 className="text-5xl font-black leading-tight">日照银行十五五战略规划执行管理平台</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
              面向总行与部门的战略任务执行演示系统。
            </p>
          </div>
          <div className="text-sm font-semibold text-white/65">数据截止日期：2026-07-20</div>
        </section>

        <section className="grid place-items-center bg-[#F4F7FC] p-10">
          <form onSubmit={handleSubmit} className="glass-card w-full max-w-[470px] rounded-[28px] p-8">
            <div className="text-center">
              <div className="mx-auto inline-flex justify-center">
                <LogoMark compact />
              </div>
              <h2 className="mt-5 text-3xl font-black text-brand-500">日照银行</h2>
              <p className="mt-2 font-semibold text-ink">十五五战略规划执行管理平台</p>
            </div>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-ink">账号</span>
                <div className="mt-2 flex h-14 items-center gap-3 rounded-ui border border-[#D9E3F2] bg-white px-4">
                  <UserRound className="text-muted" size={20} />
                  <input className="h-12 flex-1 outline-none" value={account} onChange={(event) => setAccount(event.target.value)} placeholder="请输入账号" />
                </div>
                {account && matched && <div className="mt-2 text-sm font-semibold text-brand-500">已识别：{matched.departmentName}</div>}
              </label>
              <label className="block">
                <span className="text-sm font-bold text-ink">密码</span>
                <div className="mt-2 flex h-14 items-center gap-3 rounded-ui border border-[#D9E3F2] bg-white px-4">
                  <LockKeyhole className="text-muted" size={20} />
                  <input className="h-12 flex-1 outline-none" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" />
                  <Eye className="text-muted" size={20} />
                </div>
              </label>
              {message && <div className="rounded-xl bg-[#FFF7ED] px-3 py-2 text-sm font-semibold text-[#B54708]">{message}</div>}
              <button className="flex h-12 w-full items-center justify-center gap-2 rounded-ui bg-gradient-to-r from-brand-500 to-[#0B4DE3] font-bold text-white shadow-glow transition hover:-translate-y-0.5">
                登录 <ArrowRight size={18} />
              </button>
            </div>

            <div className="mt-8 rounded-ui bg-[#EEF5FF] p-4">
              <div className="text-sm font-extrabold text-ink">演示账号</div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted">
                <span><b className="text-brand-500">111zlb</b>：战略管理部门</span>
                <span><b className="text-brand-500">222gsywb</b>：公司业务部</span>
                <span><b className="text-brand-500">222grywb</b>：个人业务部</span>
                <span><b className="text-brand-500">222phjrb</b>：普惠金融部</span>
                {expanded && (
                  <>
                    <span><b className="text-brand-500">222jgywb</b>：机构业务部</span>
                    <span><b className="text-brand-500">222xfjrb</b>：消费金融部</span>
                    <span><b className="text-brand-500">222gjywb</b>：国际业务部</span>
                    <span><b className="text-brand-500">222szjrb</b>：数字金融部</span>
                    <span><b className="text-brand-500">222jrkjb</b>：金融科技部</span>
                    <span><b className="text-brand-500">222jhcwb</b>：计划财务部</span>
                  </>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-muted">统一密码：111</span>
                <button type="button" className="font-bold text-brand-500" onClick={() => setExpanded((value) => !value)}>
                  {expanded ? '收起账号' : '展开全部账号'}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
      {transitioning && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand-700/95 text-white">
          <div className="text-center">
            <div className="mb-5 flex justify-center"><LogoMark compact /></div>
            <div className="text-2xl font-black">正在进入战略执行视图</div>
          </div>
        </div>
      )}
    </div>
  );
}

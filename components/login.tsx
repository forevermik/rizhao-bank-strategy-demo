'use client';
import { useState } from 'react';
import { UserRound, LockKeyhole, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { accounts, Account, cutoff } from '@/lib/data';
export function Brand() {
  return (
    <div className="brand">
      <img
        src="/rizhao-bank-logo.png"
        alt="日照银行 BANK OF RIZHAO"
        width="277"
        height="77"
      />
    </div>
  );
}
export default function Login({ onLogin }: { onLogin: (a: Account) => void }) {
  const [username, setUsername] = useState('111zlb'),
    [password, setPassword] = useState(''),
    [show, setShow] = useState(false),
    [all, setAll] = useState(false),
    [error, setError] = useState('');
  const identified = accounts.find((a) => a.username === username.trim());
  return (
    <div className="login-page">
      <section className="login-intro">
        <Brand />
        <div>
          <span className="login-eyebrow">2026 — 2030</span>
          <h1>
            日照银行“十五五”
            <br />
            战略规划执行管理平台
          </h1>
          <p>面向总行与部门的战略任务执行演示系统。</p>
          <div className="login-modules">
            <span>战略任务</span>
            <i />
            <span>年度推进</span>
            <i />
            <span>指标达成</span>
          </div>
        </div>
        <small>原 DEMO 示例数据 · 数据截止日期：{cutoff}</small>
      </section>
      <section className="login-side">
        <form
          className="login-card"
          onSubmit={(e) => {
            e.preventDefault();
            const found = accounts.find(
              (a) => a.username === username.trim() && a.password === password,
            );
            if (found) {
              setError('');
              onLogin(found);
            } else setError('账号或密码不正确，请使用下方演示账号。');
          }}
        >
          <Brand />
          <h2>欢迎登录</h2>
          <p>“十五五”战略规划执行管理平台</p>
          <label>
            账号
            <div className="input-icon">
              <UserRound size={18} />
              <input
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                aria-label="账号"
              />
            </div>
          </label>
          <div className="identified">
            {identified
              ? `已识别：${identified.departmentName}`
              : '请输入演示账号'}
          </div>
          <label>
            密码
            <div className="input-icon">
              <LockKeyhole size={18} />
              <input
                autoComplete="current-password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="密码"
              />
              <button
                type="button"
                aria-label={show ? '隐藏密码' : '显示密码'}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="primary login-submit">
            登录
            <ArrowRight size={18} />
          </button>
          <div className="demo-accounts">
            <b>演示账号</b>
            {(all
              ? accounts
              : accounts.filter((a) =>
                  ['111zlb', '222gsywb', '222grywb', '222phjrb'].includes(
                    a.username,
                  ),
                )
            ).map((a) => (
              <button
                type="button"
                key={a.username}
                onClick={() => {
                  setUsername(a.username);
                  setPassword('111');
                }}
              >
                <code>{a.username}</code>
                <span>{a.departmentName}</span>
              </button>
            ))}
            <p>
              统一密码：<b>111</b>
            </p>
            <button
              type="button"
              className="text-link"
              onClick={() => setAll(!all)}
            >
              {all ? '收起账号' : '展开全部账号'}
            </button>
          </div>
        </form>
        <p className="login-foot">
          原 DEMO 内容暂予保留，后续按日照银行 Excel 规划更新。
        </p>
      </section>
    </div>
  );
}

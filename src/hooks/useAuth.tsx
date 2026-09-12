import { createContext, useContext, useMemo } from 'react';
import { accounts } from '../data/accounts';
import { useLocalStorage } from './useLocalStorage';
import { clearAiAssistantSession } from '../components/ai-assistant/useAiChat';
import type { SessionUser } from '../types';

type AuthContextValue = {
  user: SessionUser | null;
  login: (account: string, password: string) => { ok: boolean; message?: string };
  logout: () => void;
  matchAccount: (account: string) => SessionUser | undefined;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useLocalStorage<string | null>('rzb-session-account', null);
  const user = useMemo(() => accounts.find((item) => item.username === account) ?? null, [account]);

  const value: AuthContextValue = {
    user,
    matchAccount(input) {
      return accounts.find((item) => item.username === input.trim());
    },
    login(input, password) {
      const matched = accounts.find((item) => item.username === input.trim());
      if (!matched) return { ok: false, message: '未匹配到演示部门' };
      if (matched.password !== password) return { ok: false, message: '密码不正确' };
      setAccount(matched.username);
      return { ok: true };
    },
    logout() {
      setAccount(null);
      clearAiAssistantSession();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

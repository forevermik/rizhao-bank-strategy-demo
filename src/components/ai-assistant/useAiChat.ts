import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatApiResponse, ChatMessage } from './types';
import { tasks } from '../../data/tasks';
import { indicators } from '../../data/indicators';
import { departments } from '../../data/departments';
import { dashboardSeed } from '../../data/dashboard';

const STORAGE_KEY = 'rzb-ai-assistant-session-v1';
const MAX_INPUT_LENGTH = 2000;
const MAX_STORED_MESSAGES = 24;

function welcomeMessage(): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content: '你好，我是站内智能助手。你可以直接询问网站中的功能、内容或使用方式。',
    createdAt: Date.now(),
  };
}

function loadMessages(): ChatMessage[] {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return [welcomeMessage()];
    const parsed = JSON.parse(saved) as ChatMessage[];
    return Array.isArray(parsed) && parsed.length ? parsed.slice(-MAX_STORED_MESSAGES) : [welcomeMessage()];
  } catch {
    return [welcomeMessage()];
  }
}

export function clearAiAssistantSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  }, [messages]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const startNewConversation = useCallback(() => {
    controllerRef.current?.abort();
    setIsGenerating(false);
    setError('');
    setLastQuestion('');
    setMessages([welcomeMessage()]);
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const sendMessage = useCallback(async (raw: string) => {
    const message = raw.trim();
    if (!message || isGenerating) return false;
    if (message.length > MAX_INPUT_LENGTH) {
      setError(`问题最多 ${MAX_INPUT_LENGTH} 个字符。`);
      return false;
    }

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: message, createdAt: Date.now() };
    const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', createdAt: Date.now() };
    const history = messages.filter((item) => item.id !== 'welcome').slice(-20).map(({ role, content }) => ({ role, content }));
    const controller = new AbortController();
    controllerRef.current = controller;
    setMessages((current) => [...current, userMessage, assistantMessage]);
    setIsGenerating(true);
    setError('');
    setLastQuestion(message);

    const timeout = window.setTimeout(() => controller.abort(), 55_000);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message,
          history,
          currentRoute: window.location.pathname,
          pageTitle: document.title,
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null) as (ChatApiResponse & { error?: { message?: string } }) | null;
        throw new Error(payload?.error?.message || '暂时无法连接智能助手，请稍后重试。');
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) {
          const parsed = parseSse(event);
          if (!parsed) continue;
          if (parsed.event === 'delta' && typeof (parsed.data as { text?: string }).text === 'string') {
            const delta = (parsed.data as { text: string }).text;
            answer += delta;
            setMessages((current) => current.map((item) => item.id === assistantMessage.id ? { ...item, content: answer } : item));
          }
          if (parsed.event === 'done') {
            const data = parsed.data as { sources?: ChatMessage['sources'] };
            setMessages((current) => current.map((item) => item.id === assistantMessage.id ? { ...item, content: answer, sources: data.sources } : item));
          }
          if (parsed.event === 'error') throw new Error((parsed.data as { message?: string }).message || '暂时无法连接智能助手，请稍后重试。');
        }
      }
      if (!answer.trim()) throw new Error('智能助手没有返回有效内容，请重新尝试。');
      return true;
    } catch (reason) {
      if (!controller.signal.aborted) {
        const fallback = localAnswer(message);
        setError('');
        setMessages((current) => current.map((item) => item.id === assistantMessage.id
          ? { ...item, content: fallback.content, sources: fallback.sources }
          : item));
        return true;
      }
      const messageText = '回答生成已停止。';
      setError(messageText);
      setMessages((current) => current.map((item) => item.id === assistantMessage.id
        ? { ...item, content: messageText, failed: true }
        : item));
      return false;
    } finally {
      window.clearTimeout(timeout);
      if (controllerRef.current === controller) controllerRef.current = null;
      setIsGenerating(false);
    }
  }, [isGenerating, messages]);

  return { messages, isGenerating, error, lastQuestion, maxInputLength: MAX_INPUT_LENGTH, sendMessage, startNewConversation, stop, retry: () => sendMessage(lastQuestion) };
}

function localAnswer(question: string): Pick<ChatMessage, 'content' | 'sources'> {
  const query = question.trim().toLowerCase();
  const taskMatches = tasks.filter((task) =>
    `${task.code}${task.title}${task.objective}${task.businessArea}${task.leadDepartmentName}`.toLowerCase().includes(query),
  ).slice(0, 5);
  const indicatorMatches = indicators.filter((indicator) =>
    `${indicator.name}${indicator.businessLine}${indicator.departmentName}`.toLowerCase().includes(query),
  ).slice(0, 5);

  if (taskMatches.length) {
    return {
      content: `找到 ${taskMatches.length} 项相关战略任务：\n\n${taskMatches.map((task) => `- **${task.code}** ${task.title}（${task.leadDepartmentName}）`).join('\n')}`,
      sources: taskMatches.map((task) => ({ title: task.title, section: task.code, route: `/tasks/${task.id}` })),
    };
  }
  if (indicatorMatches.length) {
    return {
      content: `找到 ${indicatorMatches.length} 项相关指标：\n\n${indicatorMatches.map((indicator) => `- **${indicator.name}**：${indicator.departmentName}，单位 ${indicator.unit}`).join('\n')}`,
      sources: indicatorMatches.map((indicator) => ({ title: indicator.name, section: indicator.departmentName, route: `/indicators/${indicator.id}` })),
    };
  }
  if (/系统|项目/.test(query)) {
    return { content: `当前演示数据包含 **${dashboardSeed.systemProjects.length}** 项系统建设事项，可在战略驾驶舱的“系统建设事项”卡片中查看。`, sources: [{ title: '战略驾驶舱', section: '系统建设事项', route: '/cockpit' }] };
  }
  if (/部门|账号/.test(query)) {
    return { content: `平台覆盖 **${departments.length}** 个部门。战略管理部门可查看全行数据，部门账号可查看本部门牵头和协同任务。`, sources: [{ title: '部门工作台', section: '部门视角', route: '/workbench' }] };
  }
  return {
    content: `当前平台包含 **${tasks.length}** 项战略任务、**${indicators.length}** 项指标任务和 **${dashboardSeed.systemProjects.length}** 项系统建设事项。你可以输入任务编号、任务名称、指标名称或部门名称继续查询。`,
    sources: [
      { title: '战略任务', section: '任务清单', route: '/tasks' },
      { title: '指标任务', section: '指标清单', route: '/indicators' },
    ],
  };
}

function parseSse(value: string): { event: string; data: unknown } | null {
  const event = value.split('\n').find((line) => line.startsWith('event: '))?.slice(7);
  const data = value.split('\n').find((line) => line.startsWith('data: '))?.slice(6);
  if (!event || !data) return null;
  try { return { event, data: JSON.parse(data) as unknown }; } catch { return null; }
}

'use client';
import { useState } from 'react';
import { Send, ArrowRight } from 'lucide-react';
import { Task, taskStandards } from '@/lib/data';
import { Modal } from './common';
type Message = { role: string; text: string; results?: Task[] };
export default function Assistant({
  tasks,
  onClose,
  go,
}: {
  tasks: Task[];
  onClose: () => void;
  go: (path: string) => void;
}) {
  const [query, setQuery] = useState(''),
    [messages, setMessages] = useState<Message[]>([
      {
        role: 'assistant',
        text: '你好，我可以帮你检索站内战略任务、完成标准，或说明模块使用方式。当前为站内检索演示。',
      },
    ]);
  function ask(value: string) {
    const q = value.trim();
    if (!q) return;
    let text = '',
      results: Task[] = [];
    if (/怎么|如何|功能|使用|填报|模块/.test(q)) {
      text = /填报/.test(q)
        ? '请使用对应部门演示账号登录。在“年度推进”中选择年度，点击“查看填报”，在任务年度达成表中填写完成情况；指标完成值可在“指标任务”中填报。填报保存在当前浏览器。'
        : '平台包含战略驾驶舱、战略任务、年度推进、指标任务。驾驶舱汇总执行情况；战略任务展示举措与完成标准；年度推进按年跟踪完成标准；指标任务对比年度目标与完成值。';
    } else if (/进度|口径/.test(q)) {
      text =
        '总体及年度进度保留原 DEMO 静态示例值。新增填报单独保存和展示，暂不改写原示例进度；具体规则待原源码和日照银行规划资料核对。';
    } else {
      results = tasks.filter((t) =>
        `${t.code}${t.title}${t.objective}${t.leadDepartmentName}${taskStandards(
          t.id,
        )
          .map((s) => s.sourceText)
          .join('')}`
          .toLowerCase()
          .includes(q.toLowerCase()),
      );
      text = results.length
        ? `找到 ${results.length} 个相关任务，显示前 ${Math.min(8, results.length)} 项。`
        : '暂未找到匹配任务。可试试任务编号、部门名称或简短关键词，例如“普惠”“公司业务”“数据治理”。';
    }
    setMessages((m) => [
      ...m,
      { role: 'user', text: q },
      { role: 'assistant', text, results: results.slice(0, 8) },
    ]);
    setQuery('');
  }
  return (
    <Modal
      title="智能助手"
      description="站内检索演示 · 基于当前账号可见任务"
      onClose={onClose}
    >
      <div className="chat-messages" aria-live="polite">
        {messages.map((m, i) => (
          <article key={i} className={`chat-message ${m.role}`}>
            <p>{m.text}</p>
            {m.results?.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onClose();
                  go(`/tasks/${t.id}`);
                }}
              >
                <span>
                  {t.code} · {t.title}
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </article>
        ))}
      </div>
      <div className="chat-suggestions">
        {['如何填报', '进度口径', '普惠', '数据治理'].map((q) => (
          <button key={q} onClick={() => ask(q)}>
            {q}
          </button>
        ))}
      </div>
      <form
        className="chat-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(query);
        }}
      >
        <textarea
          aria-label="助手问题"
          maxLength={2000}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入任务关键词或使用问题…"
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              ask(query);
            }
          }}
        />
        <button
          type="submit"
          className="primary"
          disabled={!query.trim()}
          aria-label="发送"
        >
          <Send size={18} />
        </button>
      </form>
      <small>{query.length}/2000 · Enter 发送，Shift + Enter 换行</small>
    </Modal>
  );
}

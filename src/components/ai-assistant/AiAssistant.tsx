import { Bot, MessageCircleMore, Plus, Send, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SafeMarkdown } from './SafeMarkdown';
import { useAiChat } from './useAiChat';

export function AiAssistant({ variant }: { variant: 'desktop' | 'mobile' }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const chat = useAiChat();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && close();
    window.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 220);
    return () => { window.removeEventListener('keydown', onKeyDown); window.clearTimeout(timer); };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat.messages, chat.isGenerating, open]);

  function close() { setOpen(false); window.setTimeout(() => triggerRef.current?.focus(), 180); }
  function submit() { if (!input.trim()) return; void chat.sendMessage(input).then((sent) => sent && setInput('')); }

  return <>
    <button ref={triggerRef} type="button" className={`ai-assistant-fab ai-assistant-fab-${variant}`} aria-label="打开智能助手" onClick={() => setOpen(true)}>
      <Bot size={variant === 'desktop' ? 27 : 23} aria-hidden="true" />
      {variant === 'desktop' && <span>智能助手</span>}
    </button>
    <div className={`ai-assistant-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button className="ai-assistant-backdrop" type="button" aria-label="关闭智能助手" onClick={close} />
      <section className={`ai-assistant-panel ai-assistant-panel-${variant}`} role="dialog" aria-modal="true" aria-label="智能助手对话窗口"
        onTouchStart={(event) => { touchStartRef.current = event.touches[0]?.clientY ?? null; }}
        onTouchEnd={(event) => { if (variant === 'mobile' && touchStartRef.current != null && (event.changedTouches[0]?.clientY ?? 0) - touchStartRef.current > 90) close(); touchStartRef.current = null; }}>
        <header className="ai-assistant-header">
          <div className="ai-assistant-title"><span><Bot size={22} /></span><div><h2>智能助手</h2><p>基于站内内容为你解答</p></div></div>
          <div className="ai-assistant-actions">
            <button type="button" onClick={chat.startNewConversation} aria-label="新建对话" title="新建对话"><Plus size={19} /></button>
            <button type="button" onClick={close} aria-label="关闭智能助手" title="关闭"><X size={20} /></button>
          </div>
        </header>
        <div className="ai-assistant-messages thin-scroll" ref={listRef} aria-live="polite">
          {chat.messages.map((message) => <article key={message.id} className={`ai-message ai-message-${message.role} ${message.failed ? 'is-failed' : ''}`}>
            <div className="ai-message-bubble">{message.content ? <SafeMarkdown content={message.content} /> : <span className="ai-thinking"><i /><i /><i /> 正在思考</span>}
              {message.sources?.length ? <div className="ai-sources">参考：{message.sources.slice(0, 3).map((source) => source.route ? <a href={source.route} key={`${source.route}-${source.section}`}>{source.section || source.title}</a> : <span key={source.title}>{source.section || source.title}</span>)}</div> : null}
            </div>
          </article>)}
          {chat.isGenerating && <div className="ai-generating"><MessageCircleMore size={15} /> 正在生成回答</div>}
        </div>
        <footer className="ai-assistant-composer">
          {chat.error && <div className="ai-assistant-error" role="alert"><span>{chat.error}</span>{chat.lastQuestion && !chat.isGenerating && <button type="button" onClick={() => void chat.retry()}>重新发送</button>}</div>}
          <div className="ai-composer-box">
            <textarea ref={inputRef} value={input} rows={2} maxLength={chat.maxInputLength} disabled={chat.isGenerating} placeholder="请输入你想了解的问题……" aria-label="输入问题"
              onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }} />
            <button type="button" aria-label={chat.isGenerating ? '停止生成' : '发送消息'} disabled={!chat.isGenerating && !input.trim()} onClick={chat.isGenerating ? chat.stop : submit}>{chat.isGenerating ? <Square size={16} /> : <Send size={18} />}</button>
          </div>
          <p>{input.length}/{chat.maxInputLength} · Enter 发送，Shift + Enter 换行</p>
        </footer>
      </section>
    </div>
  </>;
}

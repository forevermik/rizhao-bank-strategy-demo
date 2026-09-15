import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: number | string;
  suffix?: string;
  hint?: string;
  icon: LucideIcon;
  tone?: 'blue' | 'cyan' | 'green' | 'amber';
  actionLabel?: string;
  compact?: boolean;
};

const toneMap = {
  blue: 'from-brand-500 to-[#2E90FA]',
  cyan: 'from-[#06AED4] to-[#2E90FA]',
  green: 'from-[#12B76A] to-[#06AED4]',
  amber: 'from-[#F79009] to-[#FDB022]',
};

export function StatCard({ label, value, suffix = '', hint, icon: Icon, tone = 'blue', actionLabel, compact = false }: StatCardProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (typeof value !== 'number') return;
    const duration = 520;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * progress));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <div className={`soft-panel group rounded-ui transition duration-200 hover:-translate-y-1 hover:shadow-glow ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between">
        <div className={`grid place-items-center rounded-[14px] bg-gradient-to-br ${toneMap[tone]} text-white shadow-lg ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}>
          <Icon size={compact ? 19 : 22} />
        </div>
        <div className="flex h-9 items-end gap-1">
          {[28, 42, 32, 54, 40].map((height, index) => (
            <span
              key={index}
              className="w-1.5 rounded-full bg-brand-500/20 transition group-hover:bg-brand-500/50"
              style={{ height }}
            />
          ))}
        </div>
      </div>
      <div className={`${compact ? 'mt-3' : 'mt-5'} text-sm text-muted`}>{label}</div>
      <div className={`metric-number mt-1 font-extrabold text-ink ${compact ? 'text-3xl' : 'text-4xl'}`}>
        {typeof value === 'number' ? display : value}
        {typeof value === 'number' && <span className="ml-1 text-xl text-brand-500">{suffix}</span>}
      </div>
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
      {actionLabel && <div className={`${compact ? 'mt-2' : 'mt-3'} text-xs font-bold text-brand-500`}>{actionLabel}</div>}
    </div>
  );
}

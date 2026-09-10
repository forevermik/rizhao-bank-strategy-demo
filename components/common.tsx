'use client';
import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, Info, Inbox } from 'lucide-react';
import { years } from '@/lib/data';
export function Select({
  label,
  value,
  onChange,
  options,
  all = true,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  options: (string | number)[];
  all?: boolean;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {all && <option value="">{label}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search">
      <Search size={18} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function YearTabs({
  year,
  onChange,
}: {
  year: number;
  onChange: (y: number) => void;
}) {
  return (
    <div className="year-tabs" aria-label="年度切换">
      {years.map((y) => (
        <button
          key={y}
          aria-pressed={year === y}
          className={year === y ? 'active' : ''}
          onClick={() => onChange(y)}
        >
          {y}
        </button>
      ))}
    </div>
  );
}
export function Progress({
  value,
  label = '进度',
}: {
  value: number | null;
  label?: string;
}) {
  return (
    <div className="progress-block">
      <div>
        <span>{label}</span>
        <b>{value === null ? '—' : `${value}%`}</b>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value ?? undefined}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }} />
      </div>
    </div>
  );
}
export function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="app-dialog">
        <DialogHeader>
          <DialogTitle className="dialog-title">{title}</DialogTitle>
          <DialogDescription>
            {description ?? '原 DEMO 示例内容'}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
export function Empty({ onReset }: { onReset?: () => void }) {
  return (
    <div className="empty">
      <Inbox size={36} />
      <b>暂无符合条件的内容</b>
      <p>请尝试调整搜索词或筛选条件。</p>
      {onReset && (
        <button className="outline" onClick={onReset}>
          重置筛选
        </button>
      )}
    </div>
  );
}
export function Explanation() {
  return (
    <div className="info-box">
      <Info size={18} />
      <p>
        总体进度和年度进度沿用原 DEMO
        静态示例值，不代表实际经营完成情况。年度目标仅作计划展示；填报记录单独展示，不改写原示例进度。
      </p>
    </div>
  );
}
export function StatStrip({ items }: { items: [string, string | number][] }) {
  return (
    <div className="stat-strip">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}

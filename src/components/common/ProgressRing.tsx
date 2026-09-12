export function ProgressRing({ value, size = 118, label }: { value: number; size?: number; label?: string }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E4EBF5" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#155EEF" />
            <stop offset="1" stopColor="#06AED4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="metric-number text-2xl font-extrabold text-ink">{value}%</div>
        {label && <div className="text-xs text-muted">{label}</div>}
      </div>
    </div>
  );
}

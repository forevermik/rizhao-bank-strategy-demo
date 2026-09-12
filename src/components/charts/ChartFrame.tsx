export function ChartFrame({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`soft-panel rounded-ui p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-extrabold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

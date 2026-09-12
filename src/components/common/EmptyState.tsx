import { SearchX } from 'lucide-react';

export function EmptyState({ text = '暂无匹配数据' }: { text?: string }) {
  return (
    <div className="soft-panel grid min-h-48 place-items-center rounded-ui p-8 text-center text-muted">
      <div>
        <SearchX className="mx-auto mb-3 text-brand-500" />
        <div>{text}</div>
      </div>
    </div>
  );
}

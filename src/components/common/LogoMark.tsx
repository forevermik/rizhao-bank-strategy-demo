import logoUrl from '../../assets/rizhao-bank-logo.png';

export function LogoMark({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <div className={`flex ${compact ? 'items-center' : 'flex-col items-start'} gap-2`}>
      <span className={inverse ? 'rounded-xl bg-white px-2 py-1' : ''}>
        <img className={`${compact ? 'h-9 max-w-[96px]' : 'h-11 max-w-[180px]'} w-auto object-contain`} src={logoUrl} alt="日照银行" />
      </span>
      {!compact && (
        <div className={`text-xs font-semibold ${inverse ? 'text-white/72' : 'text-muted'}`}>“十五五”战略规划执行管理平台</div>
      )}
    </div>
  );
}

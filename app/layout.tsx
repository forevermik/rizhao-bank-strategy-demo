import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '日照银行“十五五”战略规划执行管理平台',
  description: '日照银行战略规划执行演示平台，原 DEMO 示例内容待替换。',
  icons: { icon: '/rizhao-bank-mark.png' },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MockupAI - AI 목업 이미지 생성',
  description: '제품 기획 초기단계에서 실제 제품과 유사한 비주얼 목업을 빠르게 생성하세요.',
  keywords: ['AI', '목업', 'mockup', '제품 디자인', '캐릭터 IP'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}

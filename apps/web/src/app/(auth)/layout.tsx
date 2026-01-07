/**
 * 인증 페이지 레이아웃
 * 로그인, 회원가입 페이지용
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            🎨 MockupAI
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            AI 목업 이미지 생성 도구
          </p>
        </div>

        {/* 컨텐츠 */}
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api';

/**
 * 로그인 폼 스키마
 */
const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * 로그인 페이지
 */
export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /**
   * 로그인 제출 핸들러
   */
  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    try {
      const response = await authApi.login(data.email, data.password);
      const { user, accessToken, refreshToken } = response.data;

      login(user, accessToken, refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-semibold text-[var(--text-primary)]">
        로그인
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {/* 이메일 */}
        <Input
          type="email"
          label="이메일"
          placeholder="email@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* 비밀번호 */}
        <Input
          type="password"
          label="비밀번호"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        {/* 로그인 버튼 */}
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          로그인
        </Button>
      </form>

      {/* 회원가입 링크 */}
      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        계정이 없으신가요?{' '}
        <Link
          href="/register"
          className="font-medium text-brand-500 hover:text-brand-400"
        >
          회원가입
        </Link>
      </p>
    </div>
  );
}

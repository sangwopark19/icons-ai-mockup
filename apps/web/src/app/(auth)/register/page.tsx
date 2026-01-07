'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authApi } from '@/lib/api';

/**
 * 회원가입 폼 스키마
 */
const registerSchema = z
  .object({
    name: z.string().min(1, '이름을 입력해주세요').max(100),
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * 회원가입 페이지
 */
export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  /**
   * 회원가입 제출 핸들러
   */
  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    try {
      await authApi.register(data.email, data.password, data.name);
      setSuccess(true);

      // 2초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
    }
  };

  // 성공 메시지
  if (success) {
    return (
      <div className="text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h2 className="mb-2 text-2xl font-semibold text-[var(--text-primary)]">
          회원가입 완료!
        </h2>
        <p className="text-[var(--text-secondary)]">
          잠시 후 로그인 페이지로 이동합니다...
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-semibold text-[var(--text-primary)]">
        회원가입
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {/* 이름 */}
        <Input
          type="text"
          label="이름"
          placeholder="홍길동"
          error={errors.name?.message}
          {...register('name')}
        />

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
          placeholder="8자 이상 입력"
          error={errors.password?.message}
          {...register('password')}
        />

        {/* 비밀번호 확인 */}
        <Input
          type="password"
          label="비밀번호 확인"
          placeholder="비밀번호를 다시 입력"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {/* 회원가입 버튼 */}
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          회원가입
        </Button>
      </form>

      {/* 로그인 링크 */}
      <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        이미 계정이 있으신가요?{' '}
        <Link
          href="/login"
          className="font-medium text-brand-500 hover:text-brand-400"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}

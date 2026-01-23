'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

/**
 * UI 컴포넌트 테스트 페이지
 */
export default function TestComponentsPage() {
  // Checkbox 상태
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = React.useState(false);
  const [requiredChecked, setRequiredChecked] = React.useState(false);
  const [showCheckboxError, setShowCheckboxError] = React.useState(false);

  // Textarea 상태
  const [feedback, setFeedback] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [showTextareaError, setShowTextareaError] = React.useState(false);

  const handleSubmit = () => {
    // 검증
    if (!requiredChecked) {
      setShowCheckboxError(true);
    } else {
      setShowCheckboxError(false);
    }

    if (feedback.length < 10) {
      setShowTextareaError(true);
    } else {
      setShowTextareaError(false);
    }

    if (requiredChecked && feedback.length >= 10) {
      alert('제출 완료!\n\n테스트가 성공했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-8">
      <div className="mx-auto max-w-2xl space-y-12">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            UI 컴포넌트 테스트
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            체크박스와 텍스트에어리어 컴포넌트를 테스트합니다
          </p>
        </div>

        {/* Checkbox 섹션 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            Checkbox 컴포넌트
          </h2>

          <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              기본 체크박스
            </h3>
            <Checkbox
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
              label="이용약관에 동의합니다"
            />
          </div>

          <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              설명이 있는 체크박스
            </h3>
            <Checkbox
              checked={newsletterSubscribed}
              onCheckedChange={setNewsletterSubscribed}
              label="뉴스레터 구독"
              description="새로운 소식과 업데이트를 이메일로 받아보세요"
            />
          </div>

          <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              에러 상태 체크박스
            </h3>
            <Checkbox
              checked={requiredChecked}
              onCheckedChange={(checked) => {
                setRequiredChecked(checked);
                if (checked) setShowCheckboxError(false);
              }}
              label="필수 동의 항목"
              description="이 항목은 필수입니다"
              error={showCheckboxError ? '필수 항목에 동의해주세요' : undefined}
            />
          </div>

          <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              비활성화된 체크박스
            </h3>
            <Checkbox
              checked={false}
              label="비활성화된 체크박스"
              disabled
            />
            <Checkbox
              checked={true}
              label="체크된 상태에서 비활성화"
              disabled
            />
          </div>
        </section>

        {/* Textarea 섹션 */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            Textarea 컴포넌트
          </h2>

          <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              기본 텍스트에어리어
            </h3>
            <Textarea
              label="피드백"
              description="최소 10자 이상 입력해주세요"
              placeholder="여기에 피드백을 입력하세요"
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                if (e.target.value.length >= 10) setShowTextareaError(false);
              }}
              error={
                showTextareaError ? '최소 10자 이상 입력해주세요' : undefined
              }
            />
            <p className="text-sm text-[var(--text-tertiary)]">
              현재 입력: {feedback.length}자
            </p>
          </div>

          <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              필수 입력
            </h3>
            <Textarea
              label="상세 설명"
              description="제품에 대한 자세한 설명을 입력하세요"
              required
              rows={5}
              placeholder="상세 설명을 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              읽기 전용
            </h3>
            <Textarea
              label="생성된 프롬프트"
              readOnly
              resize="none"
              value="이것은 읽기 전용 텍스트에어리어입니다. 수정할 수 없습니다."
            />
          </div>

          <div className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              비활성화
            </h3>
            <Textarea
              label="비활성화된 입력"
              disabled
              placeholder="비활성화된 상태입니다"
            />
          </div>
        </section>

        {/* 제출 버튼 */}
        <div className="flex gap-4">
          <Button onClick={handleSubmit}>테스트 제출</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setTermsAccepted(false);
              setNewsletterSubscribed(false);
              setRequiredChecked(false);
              setFeedback('');
              setDescription('');
              setShowCheckboxError(false);
              setShowTextareaError(false);
            }}
          >
            초기화
          </Button>
        </div>

        {/* 상태 표시 */}
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6">
          <h3 className="mb-4 text-lg font-medium text-[var(--text-primary)]">
            현재 상태
          </h3>
          <pre className="overflow-auto text-sm text-[var(--text-secondary)]">
            {JSON.stringify(
              {
                checkboxes: {
                  termsAccepted,
                  newsletterSubscribed,
                  requiredChecked,
                },
                textareas: {
                  feedbackLength: feedback.length,
                  descriptionLength: description.length,
                },
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

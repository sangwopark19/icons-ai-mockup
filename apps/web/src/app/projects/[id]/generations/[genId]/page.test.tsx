import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useParams } from 'next/navigation';
import GenerationResultPage from './page';

// Next.js 라우터 모킹
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

// Auth store 모킹
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    accessToken: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
  })),
}));

// fetch 모킹
global.fetch = vi.fn();

describe('GenerationResultPage - 새로운 버튼 기능', () => {
  const mockPush = vi.fn();
  const mockBack = vi.fn();
  const mockWindowOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 라우터 모킹
    (useRouter as any).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
    
    (useParams as any).mockReturnValue({
      id: 'project-123',
      genId: 'gen-456',
    });

    // window.open 모킹
    global.window.open = mockWindowOpen;

    // 기본 fetch 응답
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          id: 'gen-456',
          status: 'completed',
          mode: 'ip_change',
          errorMessage: null,
          images: [
            {
              id: 'img-1',
              filePath: 'test.jpg',
              thumbnailPath: 'thumb.jpg',
              isSelected: true,
              width: 1024,
              height: 768,
            },
          ],
        },
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('헤더 버튼 렌더링', () => {
    it('헤더에 3개의 버튼이 표시된다', async () => {
      render(<GenerationResultPage />);

      await waitFor(() => {
        expect(screen.getByText('🔄 다시 생성')).toBeInTheDocument();
        expect(screen.getByText('✂️ 배경 제거 (Adobe)')).toBeInTheDocument();
        expect(screen.getByText('다운로드')).toBeInTheDocument();
      });
    });

    it('버튼들이 올바른 순서로 배치된다', async () => {
      render(<GenerationResultPage />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const headerButtons = buttons.filter(btn => 
          btn.textContent?.includes('다시 생성') || 
          btn.textContent?.includes('배경 제거') || 
          btn.textContent === '다운로드'
        );

        expect(headerButtons[0].textContent).toContain('다시 생성');
        expect(headerButtons[1].textContent).toContain('배경 제거');
        expect(headerButtons[2].textContent).toBe('다운로드');
      });
    });
  });

  describe('다시 생성 버튼 (API 호출)', () => {
    it('다시 생성 버튼 클릭 시 API를 호출한다', async () => {
      const mockRegenerateResponse = {
        success: true,
        data: {
          generationId: 'new-gen-789',
        },
      };

      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/regenerate')) {
          return Promise.resolve({
            json: async () => mockRegenerateResponse,
          });
        }
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: {
              id: 'gen-456',
              status: 'completed',
              mode: 'ip_change',
              images: [{
                id: 'img-1',
                filePath: 'test.jpg',
                thumbnailPath: 'thumb.jpg',
                isSelected: true,
                width: 1024,
                height: 768,
              }],
            },
          }),
        });
      });

      render(<GenerationResultPage />);

      await waitFor(() => {
        expect(screen.getByText('🔄 다시 생성')).toBeInTheDocument();
      });

      const regenerateButton = screen.getByText('🔄 다시 생성');
      await userEvent.click(regenerateButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/generations/gen-456/regenerate'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer mock-token',
            }),
          })
        );
      });
    });

    it('API 호출 성공 시 새 생성 페이지로 이동한다', async () => {
      const mockRegenerateResponse = {
        success: true,
        data: {
          generationId: 'new-gen-789',
        },
      };

      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/regenerate')) {
          return Promise.resolve({
            json: async () => mockRegenerateResponse,
          });
        }
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: {
              id: 'gen-456',
              status: 'completed',
              mode: 'ip_change',
              images: [{
                id: 'img-1',
                filePath: 'test.jpg',
                thumbnailPath: 'thumb.jpg',
                isSelected: true,
                width: 1024,
                height: 768,
              }],
            },
          }),
        });
      });

      render(<GenerationResultPage />);

      await waitFor(() => {
        expect(screen.getByText('🔄 다시 생성')).toBeInTheDocument();
      });

      const regenerateButton = screen.getByText('🔄 다시 생성');
      await userEvent.click(regenerateButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/projects/project-123/generations/new-gen-789');
      });
    });

    it('API 호출 실패 시 에러 알림이 표시된다', async () => {
      const mockAlertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/regenerate')) {
          return Promise.resolve({
            json: async () => ({
              success: false,
              error: { message: '다시 생성에 실패했습니다' },
            }),
          });
        }
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: {
              id: 'gen-456',
              status: 'completed',
              mode: 'ip_change',
              images: [{
                id: 'img-1',
                filePath: 'test.jpg',
                thumbnailPath: 'thumb.jpg',
                isSelected: true,
                width: 1024,
                height: 768,
              }],
            },
          }),
        });
      });

      render(<GenerationResultPage />);

      await waitFor(() => {
        expect(screen.getByText('🔄 다시 생성')).toBeInTheDocument();
      });

      const regenerateButton = screen.getByText('🔄 다시 생성');
      await userEvent.click(regenerateButton);

      await waitFor(() => {
        expect(mockAlertSpy).toHaveBeenCalledWith('다시 생성에 실패했습니다');
      });

      mockAlertSpy.mockRestore();
    });
  });

  describe('Adobe 배경 제거 버튼', () => {
    it('배경 제거 버튼 클릭 시 Adobe 페이지가 새 탭에서 열린다', async () => {
      render(<GenerationResultPage />);

      await waitFor(() => {
        expect(screen.getByText('✂️ 배경 제거 (Adobe)')).toBeInTheDocument();
      });

      const adobeButton = screen.getByText('✂️ 배경 제거 (Adobe)');
      await userEvent.click(adobeButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://www.adobe.com/express/feature/image/remove-background',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('배경 제거 버튼은 로딩 상태가 없다', async () => {
      render(<GenerationResultPage />);

      await waitFor(() => {
        expect(screen.getByText('✂️ 배경 제거 (Adobe)')).toBeInTheDocument();
      });

      const adobeButton = screen.getByText('✂️ 배경 제거 (Adobe)');
      
      // 버튼에 spinner가 없는지 확인
      expect(adobeButton.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('사이드바 버튼 변경', () => {
    it('사이드바 버튼이 "모드로 돌아가기"로 표시된다', async () => {
      render(<GenerationResultPage />);

      await waitFor(() => {
        expect(screen.getByText('🔄 모드로 돌아가기')).toBeInTheDocument();
      });
    });

    it('모드로 돌아가기 버튼 클릭 시 해당 모드 페이지로 이동한다', async () => {
      render(<GenerationResultPage />);

      await waitFor(() => {
        expect(screen.getByText('🔄 모드로 돌아가기')).toBeInTheDocument();
      });

      const returnButton = screen.getByText('🔄 모드로 돌아가기');
      await userEvent.click(returnButton);

      expect(mockPush).toHaveBeenCalledWith('/projects/project-123/ip-change');
    });
  });

  describe('버튼 스타일링', () => {
    it('다시 생성과 배경 제거 버튼은 secondary variant를 사용한다', async () => {
      render(<GenerationResultPage />);

      await waitFor(() => {
        expect(screen.getByText('🔄 다시 생성')).toBeInTheDocument();
        expect(screen.getByText('✂️ 배경 제거 (Adobe)')).toBeInTheDocument();
      });

      const regenerateButton = screen.getByText('🔄 다시 생성').closest('button');
      const adobeButton = screen.getByText('✂️ 배경 제거 (Adobe)').closest('button');

      // secondary variant 클래스가 포함되어 있는지 확인
      expect(regenerateButton).toHaveClass('bg-transparent');
      expect(adobeButton).toHaveClass('bg-transparent');
    });

    it('다운로드 버튼은 primary variant를 사용한다', async () => {
      render(<GenerationResultPage />);

      await waitFor(() => {
        expect(screen.getByText('다운로드')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('다운로드').closest('button');

      // primary variant 클래스가 포함되어 있는지 확인
      expect(downloadButton).toHaveClass('bg-brand-500');
    });
  });
});

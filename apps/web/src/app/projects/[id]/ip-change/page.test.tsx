import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useParams } from 'next/navigation';
import IPChangePage from './page';

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

// ImageUploader 모킹
vi.mock('@/components/ui/image-uploader', () => ({
  ImageUploader: ({ onUpload, label }: any) => (
    <div>
      <label htmlFor={label}>{label}</label>
      <input
        id={label}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
        }}
      />
    </div>
  ),
}));

// FileReader 모킹
global.FileReader = class {
  result: string | ArrayBuffer | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  readAsDataURL(blob: Blob) {
    this.result = 'data:image/png;base64,mock';
    if (this.onload) {
      this.onload({ target: this } as ProgressEvent<FileReader>);
    }
  }
} as any;

describe('IPChangePage - v3 옵션 통합', () => {
  const mockPush = vi.fn();
  const mockBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 라우터 모킹
    (useRouter as any).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
    
    (useParams as any).mockReturnValue({
      id: 'project-123',
    });

    // 기본 fetch 응답
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/upload/image')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: { filePath: 'uploads/source.jpg' },
          }),
        });
      }
      if (url.includes('/upload/character')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: { filePath: 'uploads/character.jpg' },
          }),
        });
      }
      if (url.includes('/generations')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: { id: 'gen-123' },
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('컴포넌트 렌더링', () => {
    it('페이지가 정상적으로 렌더링된다', () => {
      render(<IPChangePage />);
      
      expect(screen.getByText('⚡ IP 변경')).toBeInTheDocument();
      expect(screen.getByText('기존 제품의 캐릭터를 새로운 IP로 변경합니다')).toBeInTheDocument();
    });

    it('기본 옵션 섹션이 표시된다', () => {
      render(<IPChangePage />);
      
      expect(screen.getByText('기본 옵션')).toBeInTheDocument();
      expect(screen.getByText('원본 구조 우선 유지')).toBeInTheDocument();
      expect(screen.getByText('투명 배경 (누끼)')).toBeInTheDocument();
    });

    it('v3 생성 옵션 컴포넌트가 표시된다', () => {
      render(<IPChangePage />);
      
      // GenerationOptions 컴포넌트의 제목
      expect(screen.getByText('생성 옵션')).toBeInTheDocument();
      // v3 옵션들
      expect(screen.getByText('시점 고정')).toBeInTheDocument();
      expect(screen.getByText('백색 배경')).toBeInTheDocument();
      expect(screen.getByLabelText(/사용자 지시사항/i)).toBeInTheDocument();
    });
  });

  describe('v3 옵션 상태 관리', () => {
    it('시점 고정 체크박스를 클릭하면 상태가 변경된다', async () => {
      render(<IPChangePage />);

      const checkbox = screen.getByRole('checkbox', { name: /시점 고정/i });
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);
      
      await waitFor(() => {
        expect(checkbox).toBeChecked();
      });
    });

    it('백색 배경 체크박스를 클릭하면 상태가 변경된다', async () => {
      render(<IPChangePage />);

      const checkbox = screen.getByRole('checkbox', { name: /백색 배경/i });
      expect(checkbox).not.toBeChecked();

      await userEvent.click(checkbox);
      
      await waitFor(() => {
        expect(checkbox).toBeChecked();
      });
    });

    it('사용자 지시사항을 입력할 수 있다', async () => {
      render(<IPChangePage />);

      const textarea = screen.getByLabelText(/사용자 지시사항/i);
      const testText = '더 밝은 조명으로';

      await userEvent.type(textarea, testText);

      await waitFor(() => {
        expect(textarea).toHaveValue(testText);
      });
    });
  });

  describe('API 통합', () => {
    it('생성 요청 시 v3 옵션이 payload에 포함된다', async () => {
      render(<IPChangePage />);

      // 이미지 업로드 (파일 생성)
      const sourceFile = new File(['source'], 'source.png', { type: 'image/png' });
      const characterFile = new File(['character'], 'character.png', { type: 'image/png' });

      const sourceInput = screen.getByLabelText('원본 제품 이미지');
      const characterInput = screen.getByLabelText('새 캐릭터 이미지');

      await userEvent.upload(sourceInput, sourceFile);
      await userEvent.upload(characterInput, characterFile);

      // v3 옵션 설정
      const viewpointCheckbox = screen.getByRole('checkbox', { name: /시점 고정/i });
      const whiteBackgroundCheckbox = screen.getByRole('checkbox', { name: /백색 배경/i });
      const userInstructionsTextarea = screen.getByLabelText(/사용자 지시사항/i);

      await userEvent.click(viewpointCheckbox);
      await userEvent.click(whiteBackgroundCheckbox);
      await userEvent.type(userInstructionsTextarea, '테스트 지시사항');

      // 생성 버튼 클릭
      const generateButton = screen.getByRole('button', { name: /목업 생성하기/i });
      await userEvent.click(generateButton);

      await waitFor(() => {
        const generationCall = (global.fetch as any).mock.calls.find(
          (call: any[]) => call[0].includes('/generations')
        );

        expect(generationCall).toBeDefined();
        
        const payload = JSON.parse(generationCall[1].body);
        
        // v3 옵션 확인
        expect(payload.options.viewpointLock).toBe(true);
        expect(payload.options.whiteBackground).toBe(true);
        expect(payload.options.userInstructions).toBe('테스트 지시사항');
        
        // 기존 옵션도 유지되는지 확인
        expect(payload.options.preserveStructure).toBeDefined();
        expect(payload.options.transparentBackground).toBeDefined();
        expect(payload.options.outputCount).toBe(2);
      });
    });

    it('v3 옵션이 비활성화 상태일 때 기본값으로 전송된다', async () => {
      render(<IPChangePage />);

      // 이미지 업로드
      const sourceFile = new File(['source'], 'source.png', { type: 'image/png' });
      const characterFile = new File(['character'], 'character.png', { type: 'image/png' });

      const sourceInput = screen.getByLabelText('원본 제품 이미지');
      const characterInput = screen.getByLabelText('새 캐릭터 이미지');

      await userEvent.upload(sourceInput, sourceFile);
      await userEvent.upload(characterInput, characterFile);

      // 생성 버튼 클릭 (v3 옵션 기본값)
      const generateButton = screen.getByRole('button', { name: /목업 생성하기/i });
      await userEvent.click(generateButton);

      await waitFor(() => {
        const generationCall = (global.fetch as any).mock.calls.find(
          (call: any[]) => call[0].includes('/generations')
        );

        const payload = JSON.parse(generationCall[1].body);
        
        // v3 옵션 기본값 확인
        expect(payload.options.viewpointLock).toBe(false);
        expect(payload.options.whiteBackground).toBe(false);
        expect(payload.options.userInstructions).toBe('');
      });
    });
  });

  describe('기존 기능 보존', () => {
    it('기존 체크박스 옵션이 정상 작동한다', async () => {
      render(<IPChangePage />);

      const preserveCheckbox = screen.getByRole('checkbox', { name: /원본 구조 우선 유지/i });
      const transparentCheckbox = screen.getByRole('checkbox', { name: /투명 배경/i });

      await userEvent.click(preserveCheckbox);
      await userEvent.click(transparentCheckbox);

      await waitFor(() => {
        expect(preserveCheckbox).toBeChecked();
        expect(transparentCheckbox).toBeChecked();
      });
    });

    it('생성 성공 시 결과 페이지로 이동한다', async () => {
      render(<IPChangePage />);

      // 이미지 업로드
      const sourceFile = new File(['source'], 'source.png', { type: 'image/png' });
      const characterFile = new File(['character'], 'character.png', { type: 'image/png' });

      const sourceInput = screen.getByLabelText('원본 제품 이미지');
      const characterInput = screen.getByLabelText('새 캐릭터 이미지');

      await userEvent.upload(sourceInput, sourceFile);
      await userEvent.upload(characterInput, characterFile);

      // 생성 버튼 클릭
      const generateButton = screen.getByRole('button', { name: /목업 생성하기/i });
      await userEvent.click(generateButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/projects/project-123/generations/gen-123');
      });
    });
  });
});

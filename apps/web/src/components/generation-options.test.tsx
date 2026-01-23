import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerationOptions } from './generation-options';
import type { GenerationOptionsV3 } from '@icons/shared';

describe('GenerationOptions', () => {
  describe('렌더링', () => {
    it('컴포넌트가 에러 없이 마운트된다', () => {
      render(<GenerationOptions />);
      
      expect(screen.getByText('생성 옵션')).toBeInTheDocument();
      expect(screen.getByText('이미지 생성 시 적용할 추가 옵션을 선택하세요')).toBeInTheDocument();
    });

    it('모든 옵션 요소가 렌더링된다', () => {
      render(<GenerationOptions />);
      
      // 체크박스
      expect(screen.getByRole('checkbox', { name: /시점 고정/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /백색 배경/i })).toBeInTheDocument();
      
      // Textarea
      expect(screen.getByRole('textbox', { name: /사용자 지시사항/i })).toBeInTheDocument();
    });

    it('defaultOptions props를 전달하면 초기값이 반영된다', () => {
      const defaultOptions: Partial<GenerationOptionsV3> = {
        viewpointLock: true,
        whiteBackground: false,
        userInstructions: '테스트 지시사항',
      };

      render(<GenerationOptions defaultOptions={defaultOptions} />);

      const viewpointCheckbox = screen.getByRole('checkbox', { name: /시점 고정/i });
      const whiteBackgroundCheckbox = screen.getByRole('checkbox', { name: /백색 배경/i });
      const textarea = screen.getByRole('textbox', { name: /사용자 지시사항/i });

      expect(viewpointCheckbox).toBeChecked();
      expect(whiteBackgroundCheckbox).not.toBeChecked();
      expect(textarea).toHaveValue('테스트 지시사항');
    });

    it('disabled props를 전달하면 모든 요소가 비활성화된다', () => {
      render(<GenerationOptions disabled />);

      const viewpointCheckbox = screen.getByRole('checkbox', { name: /시점 고정/i });
      const whiteBackgroundCheckbox = screen.getByRole('checkbox', { name: /백색 배경/i });
      const textarea = screen.getByRole('textbox', { name: /사용자 지시사항/i });

      expect(viewpointCheckbox).toBeDisabled();
      expect(whiteBackgroundCheckbox).toBeDisabled();
      expect(textarea).toBeDisabled();
    });
  });

  describe('체크박스 상호작용', () => {
    it('시점 고정 체크박스를 클릭하면 상태가 토글된다', async () => {
      const handleChange = vi.fn();
      render(<GenerationOptions onOptionsChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox', { name: /시점 고정/i });
      
      await userEvent.click(checkbox);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({
            viewpointLock: true,
            whiteBackground: false,
            userInstructions: '',
          })
        );
      });
    });

    it('백색 배경 체크박스를 클릭하면 상태가 토글된다', async () => {
      const handleChange = vi.fn();
      render(<GenerationOptions onOptionsChange={handleChange} />);

      const checkbox = screen.getByRole('checkbox', { name: /백색 배경/i });
      
      await userEvent.click(checkbox);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({
            viewpointLock: false,
            whiteBackground: true,
            userInstructions: '',
          })
        );
      });
    });

    it('여러 체크박스를 클릭하면 각각 독립적으로 동작한다', async () => {
      const handleChange = vi.fn();
      render(<GenerationOptions onOptionsChange={handleChange} />);

      const viewpointCheckbox = screen.getByRole('checkbox', { name: /시점 고정/i });
      const whiteBackgroundCheckbox = screen.getByRole('checkbox', { name: /백색 배경/i });
      
      await userEvent.click(viewpointCheckbox);
      await userEvent.click(whiteBackgroundCheckbox);

      expect(handleChange).toHaveBeenCalledTimes(2);
      
      // 마지막 호출에서 두 옵션 모두 true여야 함
      expect(handleChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          viewpointLock: true,
          whiteBackground: true,
        })
      );
    });
  });

  describe('Textarea 상호작용', () => {
    it('텍스트를 입력하면 상태가 업데이트된다', async () => {
      const handleChange = vi.fn();
      render(<GenerationOptions onOptionsChange={handleChange} />);

      const textarea = screen.getByRole('textbox', { name: /사용자 지시사항/i });
      const testText = '더 밝은 조명';
      
      await userEvent.type(textarea, testText);

      await waitFor(() => {
        expect(handleChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            userInstructions: testText,
          })
        );
      });
    });

    it('최대 500자까지 입력할 수 있다', async () => {
      render(<GenerationOptions />);

      const textarea = screen.getByRole('textbox', { name: /사용자 지시사항/i }) as HTMLTextAreaElement;
      
      expect(textarea.maxLength).toBe(500);
    });

    it('450자를 초과하면 글자 수 카운터가 경고 색상으로 변경된다', async () => {
      const longText = 'a'.repeat(451);
      render(<GenerationOptions defaultOptions={{ userInstructions: longText }} />);

      const counter = screen.getByText(/451 \/ 500/);
      expect(counter).toHaveClass('text-red-500');
    });

    it('450자 이하일 때는 일반 색상으로 표시된다', async () => {
      const normalText = 'a'.repeat(400);
      render(<GenerationOptions defaultOptions={{ userInstructions: normalText }} />);

      const counter = screen.getByText(/400 \/ 500/);
      expect(counter).not.toHaveClass('text-red-500');
    });
  });

  describe('onOptionsChange 콜백', () => {
    it('초기 렌더링 시에는 콜백이 호출되지 않는다', () => {
      const handleChange = vi.fn();
      render(<GenerationOptions onOptionsChange={handleChange} />);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('옵션 변경 시 최신 상태로 콜백이 호출된다', async () => {
      const handleChange = vi.fn();
      render(<GenerationOptions onOptionsChange={handleChange} />);

      const viewpointCheckbox = screen.getByRole('checkbox', { name: /시점 고정/i });
      const textarea = screen.getByRole('textbox', { name: /사용자 지시사항/i });
      
      // 시점 고정 활성화
      await userEvent.click(viewpointCheckbox);
      
      // 텍스트 입력
      await userEvent.type(textarea, '테스트');

      await waitFor(() => {
        // 마지막 호출에서 모든 변경사항이 반영되어야 함
        expect(handleChange).toHaveBeenLastCalledWith({
          viewpointLock: true,
          whiteBackground: false,
          userInstructions: '테스트',
        });
      });
    });
  });

  describe('접근성', () => {
    it('체크박스에 올바른 label이 연결되어 있다', () => {
      render(<GenerationOptions />);

      const viewpointCheckbox = screen.getByRole('checkbox', { name: /시점 고정/i });
      const whiteBackgroundCheckbox = screen.getByRole('checkbox', { name: /백색 배경/i });

      expect(viewpointCheckbox).toHaveAccessibleName();
      expect(whiteBackgroundCheckbox).toHaveAccessibleName();
    });

    it('Textarea에 올바른 label이 연결되어 있다', () => {
      render(<GenerationOptions />);

      const textarea = screen.getByRole('textbox', { name: /사용자 지시사항/i });

      expect(textarea).toHaveAccessibleName();
      expect(textarea).toHaveAccessibleDescription();
    });
  });

  describe('스타일링', () => {
    it('커스텀 className이 적용된다', () => {
      const { container } = render(<GenerationOptions className="custom-class" />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('custom-class');
    });
  });
});

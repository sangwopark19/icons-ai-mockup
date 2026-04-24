import { describe, expect, it } from 'vitest';
import {
  assertStoragePathWithinPrefixes,
  normalizeStoragePath,
} from '../upload.service.js';

describe('upload storage path helpers', () => {
  it('normalizes safe relative paths', () => {
    expect(normalizeStoragePath('uploads\\u1\\proj1\\source.png')).toBe(
      'uploads/u1/proj1/source.png'
    );
  });

  it('rejects absolute and traversal paths', () => {
    expect(() => normalizeStoragePath('/etc/passwd')).toThrow('파일 경로가 유효하지 않습니다');
    expect(() => normalizeStoragePath('../secret.png')).toThrow('파일 경로가 유효하지 않습니다');
    expect(() => normalizeStoragePath('uploads/u1/../../secret.png')).toThrow(
      '파일 경로가 유효하지 않습니다'
    );
  });

  it('enforces allowed ownership prefixes', () => {
    expect(
      assertStoragePathWithinPrefixes('uploads/u1/proj1/source.png', ['uploads/u1/proj1'])
    ).toBe('uploads/u1/proj1/source.png');
    expect(() =>
      assertStoragePathWithinPrefixes('uploads/u2/proj1/source.png', ['uploads/u1/proj1'])
    ).toThrow('파일 경로 권한이 없습니다');
  });
});

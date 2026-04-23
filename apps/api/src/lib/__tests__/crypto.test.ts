import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encrypt, decrypt, getEncryptionKey } from '../crypto.js';

const TEST_KEY = Buffer.from('0'.repeat(64), 'hex'); // 32 zero bytes

describe('crypto - encrypt', () => {
  it('should return a colon-separated iv:tag:ciphertext string', () => {
    const result = encrypt('test-key', TEST_KEY);
    const parts = result.split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(24); // 12-byte IV = 24 hex chars
    expect(parts[1]).toHaveLength(32); // 16-byte tag = 32 hex chars
  });

  it('should produce different ciphertext on each call (fresh IV)', () => {
    const a = encrypt('same-value', TEST_KEY);
    const b = encrypt('same-value', TEST_KEY);
    expect(a).not.toBe(b);
  });

  it('should return a non-empty ciphertext part', () => {
    const result = encrypt('AIzaSyD-test', TEST_KEY);
    const parts = result.split(':');
    expect(parts[2].length).toBeGreaterThan(0);
  });
});

describe('crypto - decrypt', () => {
  it('should round-trip: decrypt(encrypt(x)) === x', () => {
    const original = 'AIzaSyD-actual-key-value';
    const ciphertext = encrypt(original, TEST_KEY);
    expect(decrypt(ciphertext, TEST_KEY)).toBe(original);
  });

  it('should throw if auth tag is tampered (bit-flip attack)', () => {
    const ciphertext = encrypt('value', TEST_KEY);
    const [iv, tag, data] = ciphertext.split(':');
    // Flip first byte of data
    const tamperedData =
      (parseInt(data.slice(0, 2), 16) ^ 0xff).toString(16).padStart(2, '0') + data.slice(2);
    expect(() => decrypt([iv, tag, tamperedData].join(':'), TEST_KEY)).toThrow();
  });

  it('should throw if wrong key is used', () => {
    const wrongKey = Buffer.from('f'.repeat(64), 'hex');
    const ciphertext = encrypt('value', TEST_KEY);
    expect(() => decrypt(ciphertext, wrongKey)).toThrow();
  });

  it('should correctly decrypt longer strings (API key length)', () => {
    const longKey = 'AIzaSyD-SomeReallyLongAPIKeyThatGoogleMightIssue-12345678';
    const ciphertext = encrypt(longKey, TEST_KEY);
    expect(decrypt(ciphertext, TEST_KEY)).toBe(longKey);
  });
});

describe('crypto - getEncryptionKey', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = originalEnv;
    }
  });

  it('should return a 32-byte Buffer when ENCRYPTION_KEY is a valid 64-char hex string', () => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    const key = getEncryptionKey();
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it('should throw if ENCRYPTION_KEY is not set', () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => getEncryptionKey()).toThrow();
  });

  it('should throw if ENCRYPTION_KEY is wrong length (e.g. 32 chars instead of 64)', () => {
    process.env.ENCRYPTION_KEY = '0'.repeat(32);
    expect(() => getEncryptionKey()).toThrow();
  });

  it('should throw if ENCRYPTION_KEY contains non-hex characters', () => {
    process.env.ENCRYPTION_KEY = 'z'.repeat(64);
    expect(() => getEncryptionKey()).toThrow(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'
    );
  });
});

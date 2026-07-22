/**
 * Unit tests for encryption utilities
 * Tests cover: encryption, decryption, key derivation, salt/IV generation, edge cases
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  encryptData,
  decryptData,
  encryptObject,
  decryptObject,
  generateSalt,
  generateIV,
  isEncrypted,
  sanitizeEncryptionData,
  containsSensitiveInfo,
  sanitizeData,
  generateEncryptionPassword,
  isCryptoAvailable,
  type EncryptionResult,
} from '../utils/encryption';

describe('Encryption Utilities', () => {
  describe('Crypto Availability', () => {
    it('should detect crypto API availability', () => {
      expect(isCryptoAvailable()).toBe(true);
    });
  });

  describe('Salt and IV Generation', () => {
    it('should generate a salt of correct length', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    it('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toEqual(salt2);
    });

    it('should generate an IV of correct length', () => {
      const iv = generateIV();
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12);
    });

    it('should generate unique IVs', () => {
      const iv1 = generateIV();
      const iv2 = generateIV();
      expect(iv1).not.toEqual(iv2);
    });
  });

  describe('Data Encryption/Decryption', () => {
    const testPassword = 'test-password-123';

    it('should encrypt and decrypt a string', async () => {
      const original = 'Hello, World!';
      const encrypted = await encryptData(original, testPassword);
      const decrypted = await decryptData(encrypted, testPassword);

      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt an object', async () => {
      const original = { foo: 'bar', num: 42, bool: true };
      const encrypted = await encryptObject(original, testPassword);
      const decrypted = await decryptObject(encrypted, testPassword);

      expect(decrypted).toEqual(original);
    });

    it('should produce different encrypted output for same input', async () => {
      const original = 'Same input';
      const encrypted1 = await encryptData(original, testPassword);
      const encrypted2 = await encryptData(original, testPassword);

      // Different salt/IV should produce different ciphertext
      expect(encrypted1.encrypted).not.toEqual(encrypted2.encrypted);
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
      expect(encrypted1.salt).not.toEqual(encrypted2.salt);
    });

    it('should fail to decrypt with wrong password', async () => {
      const original = 'Secret data';
      const encrypted = await encryptData(original, testPassword);

      await expect(decryptData(encrypted, 'wrong-password')).rejects.toThrow();
    });

    it('should handle empty strings', async () => {
      const original = '';
      const encrypted = await encryptData(original, testPassword);
      const decrypted = await decryptData(encrypted, testPassword);

      expect(decrypted).toBe(original);
    });

    it('should handle special characters and unicode', async () => {
      const original = 'Hello 世界! 🌟 Ñoño';
      const encrypted = await encryptData(original, testPassword);
      const decrypted = await decryptData(encrypted, testPassword);

      expect(decrypted).toBe(original);
    });

    it('should handle large objects', async () => {
      const largeObj = {
        data: Array(1000).fill({ item: 'test', value: 123 }),
      };
      const encrypted = await encryptObject(largeObj, testPassword);
      const decrypted = await decryptObject(encrypted, testPassword);

      expect(decrypted).toEqual(largeObj);
    });

    it('should handle nested objects', async () => {
      const nested = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };
      const encrypted = await encryptObject(nested, testPassword);
      const decrypted = await decryptObject(encrypted, testPassword);

      expect(decrypted).toEqual(nested);
    });
  });

  describe('Encryption Result Structure', () => {
    it('should return valid encryption result structure', async () => {
      const encrypted = await encryptData('test', 'password');

      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
      expect(typeof encrypted.encrypted).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.salt).toBe('string');
    });

    it('should correctly identify encrypted data', () => {
      const encryptedData: EncryptionResult = {
        encrypted: 'base64data',
        iv: 'base64iv',
        salt: 'base64salt',
      };

      expect(isEncrypted(encryptedData)).toBe(true);
      expect(isEncrypted({})).toBe(false);
      expect(isEncrypted(null)).toBe(false);
      expect(isEncrypted({ encrypted: 'only' })).toBe(false);
    });
  });

  describe('Data Sanitization', () => {
    it('should identify sensitive fields', () => {
      expect(containsSensitiveInfo('ssn')).toBe(true);
      expect(containsSensitiveInfo('social')).toBe(true);
      expect(containsSensitiveInfo('accountNumber')).toBe(true);
      expect(containsSensitiveInfo('routing')).toBe(true);
      expect(containsSensitiveInfo('policy')).toBe(true);
      expect(containsSensitiveInfo('name')).toBe(false);
      expect(containsSensitiveInfo('address')).toBe(false);
    });

    it('should sanitize sensitive fields from objects', () => {
      const data = {
        name: 'John Doe',
        ssn: '123-45-6789',
        address: '123 Main St',
        account: '987654321',
      };

      const sanitized = sanitizeData(data);

      expect(sanitized).toHaveProperty('name', 'John Doe');
      expect(sanitized).toHaveProperty('address', '123 Main St');
      expect(sanitized).not.toHaveProperty('ssn');
      expect(sanitized).not.toHaveProperty('account');
    });

    it('should sanitize nested objects', () => {
      const data = {
        user: {
          name: 'Jane',
          ssn: '999-99-9999',
        },
      };

      const sanitized = sanitizeData(data);

      expect(sanitized.user).toHaveProperty('name', 'Jane');
      expect(sanitized.user).not.toHaveProperty('ssn');
    });
  });

  describe('Encryption Data Sanitization', () => {
    it('should clear encrypted data from memory', () => {
      const encrypted: EncryptionResult = {
        encrypted: 'sensitive-data',
        iv: 'sensitive-iv',
        salt: 'sensitive-salt',
      };

      sanitizeEncryptionData(encrypted);

      expect(encrypted.encrypted).toBe('');
      expect(encrypted.iv).toBe('');
      expect(encrypted.salt).toBe('');
    });
  });

  describe('Password Generation', () => {
    it('should generate password of default length', () => {
      const password = generateEncryptionPassword();
      expect(password.length).toBe(12);
    });

    it('should generate password of custom length', () => {
      const password = generateEncryptionPassword(24);
      expect(password.length).toBe(24);
    });

    it('should generate unique passwords', () => {
      const pwd1 = generateEncryptionPassword();
      const pwd2 = generateEncryptionPassword();
      expect(pwd1).not.toEqual(pwd2);
    });

    it('should include varied character types', () => {
      const password = generateEncryptionPassword(100);
      expect(password).toMatch(/[a-z]/); // lowercase
      expect(password).toMatch(/[A-Z]/); // uppercase
      expect(password).toMatch(/[0-9]/); // digits
      // eslint-disable-next-line no-useless-escape
      expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // special chars
    });
  });

  describe('Edge Cases', () => {
    it('should handle arrays', async () => {
      const original = [1, 2, 3, { nested: 'value' }];
      const encrypted = await encryptObject(original, 'test');
      const decrypted = await decryptObject(encrypted, 'test');

      expect(decrypted).toEqual(original);
    });

    it('should handle null and undefined values in objects', async () => {
      const original = { a: null, b: undefined, c: 'value' };
      const encrypted = await encryptObject(original, 'test');
      const decrypted = await decryptObject(encrypted, 'test');

      expect(decrypted).toHaveProperty('a', null);
      expect(decrypted).toHaveProperty('c', 'value');
    });

    it('should handle numbers when passed to encryptData', async () => {
      const encrypted = await encryptData(42, 'test');
      const decrypted = await decryptData(encrypted, 'test');

      expect(decrypted).toBe('42');
    });

    it('should fail to decrypt corrupted data', async () => {
      const corrupted: EncryptionResult = {
        encrypted: 'not-valid-base64!',
        iv: 'invalid',
        salt: 'invalid',
      };

      await expect(decryptData(corrupted, 'test')).rejects.toThrow();
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const original = 'test data';
      const encrypted = await encryptData(original, longPassword);
      const decrypted = await decryptData(encrypted, longPassword);

      expect(decrypted).toBe(original);
    });
  });
});

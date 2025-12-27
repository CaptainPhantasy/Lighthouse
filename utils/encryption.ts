// Zero-Knowledge Encryption Utility for Lighthouse
// Uses Web Crypto API to encrypt/decrypt sensitive data locally

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  salt: string;
}

export interface DecryptionResult {
  decrypted: string;
}

// Key derivation function using PBKDF2
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Generate random salt
export const generateSalt = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(16));
};

// Generate random initialization vector
export const generateIV = (): Uint8Array => {
  return crypto.getRandomValues(new Uint8Array(12));
};

// Encrypt data using AES-GCM
export const encryptData = async (data: any, password: string): Promise<EncryptionResult> => {
  try {
    // Convert data to string
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();

    // Generate salt and IV
    const salt = generateSalt();
    const iv = generateIV();

    // Derive encryption key
    const key = await deriveKey(password, salt);

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encoder.encode(dataString)
    );

    // Convert to base64 strings for storage
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const saltBase64 = btoa(String.fromCharCode(...salt));

    return {
      encrypted: encryptedBase64,
      iv: ivBase64,
      salt: saltBase64
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data using AES-GCM
export const decryptData = async (encryptedResult: EncryptionResult, password: string): Promise<string> => {
  try {
    const { encrypted, iv: ivBase64, salt: saltBase64 } = encryptedResult;

    // Convert from base64 to Uint8Array
    const iv = new Uint8Array(
      atob(ivBase64)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    const salt = new Uint8Array(
      atob(saltBase64)
        .split('')
        .map(char => char.charCodeAt(0))
    );
    const encryptedArray = new Uint8Array(
      atob(encrypted)
        .split('')
        .map(char => char.charCodeAt(0))
    );

    // Derive decryption key
    const key = await deriveKey(password, salt);

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedArray
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Check if data appears to be encrypted (has iv and salt properties)
export const isEncrypted = (data: any): data is EncryptionResult => {
  return data &&
    typeof data === 'object' &&
    'encrypted' in data &&
    'iv' in data &&
    'salt' in data;
};

// Sanitize encryption keys and salts (permanently delete)
export const sanitizeEncryptionData = (data: EncryptionResult): void => {
  // Clear sensitive data from memory
  data.encrypted = '';
  data.iv = '';
  data.salt = '';

  // Additional memory clearing (not guaranteed but helps)
  if (typeof window !== 'undefined') {
    const buffer = new Uint8Array(256);
    crypto.getRandomValues(buffer); // Fill with random data
  }
};

// Helper function to identify sensitive data fields
export const SENSITIVE_FIELDS = [
  'ssn',
  'social',
  'security',
  'account',
  'routing',
  'policy',
  'license',
  'passport',
  'id',
  'tax',
  'ein',
  'itins'
];

export const containsSensitiveInfo = (text: string): boolean => {
  return SENSITIVE_FIELDS.some(field =>
    text.toLowerCase().includes(field)
  );
};

// Encrypt a single sensitive field
export const encryptField = async (value: string, password: string): Promise<EncryptionResult> => {
  return encryptData(value, password);
};

// Decrypt a single sensitive field
export const decryptField = async (encryptedResult: EncryptionResult, password: string): Promise<string> => {
  return decryptData(encryptedResult, password);
};

// Sanitize all sensitive data from an object while preserving non-sensitive data
export const sanitizeData = <T>(data: T): T => {
  const sanitized = { ...data };

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (containsSensitiveInfo(lowerKey)) {
      // Remove the sensitive field
      delete sanitized[key];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
};

// Example usage patterns for different data types
export const encryptObject = async (obj: any, password: string): Promise<EncryptionResult> => {
  return encryptData(obj, password);
};

export const decryptObject = async (encryptedResult: EncryptionResult, password: string): Promise<any> => {
  const decrypted = await decryptData(encryptedResult, password);
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

// Storage helper functions
export const saveToEncryptedStorage = async (key: string, data: any, password: string): Promise<void> => {
  const encrypted = await encryptData(data, password);
  localStorage.setItem(key, JSON.stringify(encrypted));
};

export const getFromEncryptedStorage = async (key: string, password: string): Promise<any> => {
  const encryptedStr = localStorage.getItem(key);
  if (!encryptedStr) return null;

  const encrypted = JSON.parse(encryptedStr);
  return decryptObject(encrypted, password);
};

// Check if crypto API is available
export const isCryptoAvailable = (): boolean => {
  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues !== 'undefined';
};

// Generate encryption password helper
export const generateEncryptionPassword = (length: number = 12): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
};
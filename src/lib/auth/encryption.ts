/**
 * Encryption utilities for storing sensitive credentials
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }

  // Ensure key is correct length
  const keyBuffer = Buffer.from(key, 'base64');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes`);
  }

  return keyBuffer;
}

/**
 * Encrypt sensitive data
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv + authTag + encrypted data (all hex encoded)
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  } catch (error) {
    console.error('[Encryption] Failed to encrypt:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt encrypted data
 */
export function decrypt(ciphertext: string): string {
  try {
    const key = getEncryptionKey();

    // Extract iv, authTag, and encrypted data
    const iv = Buffer.from(ciphertext.slice(0, IV_LENGTH * 2), 'hex');
    const authTag = Buffer.from(
      ciphertext.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2),
      'hex'
    );
    const encrypted = ciphertext.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  return randomBytes(KEY_LENGTH).toString('base64');
}

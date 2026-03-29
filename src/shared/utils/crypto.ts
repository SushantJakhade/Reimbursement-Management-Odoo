import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { env } from '../../config/env';

const SALT_ROUNDS = 12;
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Hash a plain-text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Encrypt a string value (e.g., API keys)
 */
export function encrypt(text: string): string {
  const key = crypto.scryptSync(env.encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an encrypted string
 */
export function decrypt(encryptedText: string): string {
  const key = crypto.scryptSync(env.encryptionKey, 'salt', 32);
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate a random reference number
 */
export function generateReferenceNumber(prefix: string = 'REF'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

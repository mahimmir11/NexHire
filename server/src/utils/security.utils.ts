import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { JWTPayload } from '../types/auth.types.js';

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt with salt rounds 10.
 * Passwords are never logged or stored in plain text.
 */
export async function hashPassword(plaintextPassword: string): Promise<string> {
  if (!plaintextPassword || plaintextPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  return bcrypt.hash(plaintextPassword, SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 */
export async function comparePassword(plaintextPassword: string, hash: string): Promise<boolean> {
  if (!plaintextPassword || !hash) {
    return false;
  }
  return bcrypt.compare(plaintextPassword, hash);
}

/**
 * Signs a cryptographic JWT access token with the given user payload.
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  // @ts-expect-error jsonwebtoken typing compatibility with string expiresIn
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Verifies and decodes a JWT access token.
 * Returns null if the token is invalid, forged, or expired.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

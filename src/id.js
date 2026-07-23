import crypto from 'node:crypto';

export function generateId() {
  return crypto.randomBytes(4).toString('hex');
}

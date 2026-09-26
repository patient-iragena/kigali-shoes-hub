import crypto from 'crypto';
import { config } from './intouchConfig';

/**
 * Generates current UTC timestamp in YYYYMMDDHHmmss format
 */
export function getFormattedTimestamp() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Generates SHA-256 hashed password string
 * Pattern: SHA256(username + accountno + partnerpassword + timestamp)
 */
export function generateHashedPassword(timestamp) {
  const rawString = `${config.username}${config.accountNo}${config.partnerPassword}${timestamp}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}
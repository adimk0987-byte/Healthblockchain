/**
 * Encryption helpers using Node's crypto module (AES-256-GCM)
 * - deriveKeyFromSecret: use PBKDF2 to derive a 32-byte key
 * - encrypt: accepts plaintext and key(secret) -> returns { encrypted, iv, authTag }
 * - decrypt: accepts encrypted + iv + key -> returns plaintext
 */
const crypto = require('crypto');

const deriveKeyFromSecret = async (secret, salt = 'healthchain_salt') => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(secret, salt, 100000, 32, 'sha256', (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey);
    });
  });
};

const encrypt = async (plainText, keyBuffer) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(plainText, 'utf8')), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
};

const decrypt = async (encryptedBase64, ivBase64, authTagBase64, keyBuffer) => {
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return plain.toString('utf8');
};

module.exports = { deriveKeyFromSecret, encrypt, decrypt };

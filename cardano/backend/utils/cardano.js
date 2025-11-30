/**
 * Lightweight Cardano helper for generating transaction metadata/hash and verifying signature.
 * This is a stub to be replaced with real CIP-30 wallet interactions in the client.
 */
const crypto = require('crypto');

function hashRecord(payload) {
  const h = crypto.createHash('sha256');
  h.update(JSON.stringify(payload));
  return h.digest('hex');
}

// Verify signature stub (in the future, use Cardano libs to verify signatures)
function verifySignature(message, signature, publicKeyOrAddress) {
  // Not implemented: placeholder that returns true for demo
  return true;
}

module.exports = { hashRecord, verifySignature };

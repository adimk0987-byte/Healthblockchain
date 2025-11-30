const cardano = require('../utils/cardano');
const AuditLog = require('../models/AuditLog');

async function hashRecord(req, res) {
  try {
    const payload = req.body;
    const hash = cardano.hashRecord(payload);
    await AuditLog.create({ actor: req.user._id, action: 'blockchain_hash_generated', target: hash });
    return res.json({ hash });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}

async function verifyRecord(req, res) {
  try {
    const { payload, expectedHash } = req.body;
    const actual = cardano.hashRecord(payload);
    const ok = actual === expectedHash;
    await AuditLog.create({ actor: req.user._id, action: 'blockchain_record_verified', target: expectedHash, meta: { ok } });
    return res.json({ ok, actual });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}

async function verifySignature(req, res) {
  try {
    const { message, signature, address } = req.body;
    const ok = cardano.verifySignature(message, signature, address);
    return res.json({ ok });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}

async function pushTransaction(req, res) {
  try {
    // Stub: in future, call Cardano node or service. For demo, echo metadata
    const { metadata } = req.body;
    await AuditLog.create({ actor: req.user._id, action: 'blockchain_tx_push', target: JSON.stringify(metadata) });
    return res.json({ message: 'Transaction prepared (demo)', metadata });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}

module.exports = { hashRecord, verifyRecord, verifySignature, pushTransaction };

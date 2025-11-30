const MedicalRecord = require('../models/MedicalRecord');
const Permission = require('../models/Permission');
const AuditLog = require('../models/AuditLog');
const { deriveKeyFromSecret, encrypt, decrypt } = require('../utils/encryption');
const cardano = require('../utils/cardano');

/**
 * getProfile - returns the authenticated user's profile
 */
async function getProfile(req, res) {
  return res.json({ user: req.user });
}

/**
 * getRecords - returns decrypted metadata (not the plaintext unless authorized)
 */
async function getRecords(req, res) {
  try {
    const records = await MedicalRecord.find({ patientID: req.user._id }).sort({ timestamp: -1 }).lean();
    // For demo, do not decrypt automatically; return metadata and blockchainHash
    return res.json({ records });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * addRecord - accepts plaintext or encrypted data. We accept plaintext and then encrypt with a key derived from patient's walletAddress (or phone as fallback)
 */
async function addRecord(req, res) {
  try {
    const { data, walletAddress } = req.body;
    if (!data) return res.status(400).json({ error: 'data is required' });
    const secret = walletAddress || req.user.phone || req.user._id.toString();
    const key = await deriveKeyFromSecret(secret);
    const { encrypted, iv, authTag } = await encrypt(JSON.stringify(data), key);
    const record = await MedicalRecord.create({
      patientID: req.user._id,
      doctorID: req.user.assignedDoctor,
      encryptedData: encrypted + '::' + authTag,
      iv: iv,
      blockchainHash: cardano.hashRecord(data)
    });
    await AuditLog.create({ actor: req.user._id, action: 'add_record', target: record._id.toString(), meta: { patient: req.user._id } });
    return res.json({ message: 'Record saved', record });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * shareRecord - patient initiates a share request to grant access (creates Permission entry)
 */
async function shareRecord(req, res) {
  try {
    const { doctorID, accessType, durationHours } = req.body;
    if (!doctorID) return res.status(400).json({ error: 'doctorID required' });
    const expiresAt = new Date(Date.now() + (parseInt(durationHours || 24) * 3600 * 1000));
    const permission = await Permission.create({ patientID: req.user._id, doctorID, accessType: accessType || 'full', expiresAt });
    await AuditLog.create({ actor: req.user._id, action: 'grant_access', target: doctorID, meta: { permissionId: permission._id } });
    return res.json({ message: 'Permission granted', permission });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getPermissions(req, res) {
  try {
    const permissions = await Permission.find({ patientID: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.json({ permissions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function grantPermission(req, res) {
  // For patient endpoints this can duplicate shareRecord; here for API parity
  return shareRecord(req, res);
}

async function revokePermission(req, res) {
  try {
    const { permissionId } = req.body;
    const permission = await Permission.findById(permissionId);
    if (!permission) return res.status(404).json({ error: 'Permission not found' });
    if (permission.patientID.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Not authorized' });
    await Permission.findByIdAndDelete(permissionId);
    await AuditLog.create({ actor: req.user._id, action: 'revoke_access', target: permissionId });
    return res.json({ message: 'Permission revoked' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getProfile, getRecords, addRecord, shareRecord, getPermissions, grantPermission, revokePermission };

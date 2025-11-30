const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const AuditLog = require('../models/AuditLog');

async function getDetails(req, res) {
  try {
    // Return a minimal emergency summary for the authenticated user
    const user = req.user;
    const summary = {
      name: user.name,
      phone: user.phone,
      emergencyContact: user.emergencyContact,
      allergies: user.allergies,
      diseases: user.diseases
    };
    return res.json({ summary });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function findNearestHospital(req, res) {
  try {
    // Demo implementation: return static list. Integrate geolocation in production.
    const hospitals = [
      { id: 'hosp_1', name: 'City Hospital', distanceKm: 2.1, bedsAvailable: 5, phone: '+911234567890' },
      { id: 'hosp_2', name: 'Green Valley Clinic', distanceKm: 4.8, bedsAvailable: 2, phone: '+911234567891' }
    ];
    return res.json({ hospitals });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}

async function getBloodAvailability(req, res) {
  try {
    const { bloodType } = req.query;
    const query = bloodType ? { bloodType } : {};
    const list = await BloodBank.find(query).limit(20).lean();
    return res.json({ availability: list });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}

async function autoShare(req, res) {
  try {
    // Auto-share minimal medical ID and emergency summary with param recipients.
    const { recipients } = req.body; // array of phone numbers or ids
    await AuditLog.create({ actor: req.user._id, action: 'auto_share_emergency', target: JSON.stringify(recipients) });
    return res.json({ message: 'Shared emergency data to recipients (demo)', recipients });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}

module.exports = { getDetails, findNearestHospital, getBloodAvailability, autoShare };

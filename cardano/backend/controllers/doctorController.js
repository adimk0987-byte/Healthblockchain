const DoctorVerification = require('../models/DoctorVerification');
const Permission = require('../models/Permission');
const MedicalRecord = require('../models/MedicalRecord');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

async function requestVerification(req, res) {
  try {
    const { documents } = req.body;
    const dv = await DoctorVerification.create({ doctorID: req.user._id, documents });
    await AuditLog.create({ actor: req.user._id, action: 'doctor_verification_requested', target: dv._id });
    return res.json({ message: 'Verification submitted', dv });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getPatients(req, res) {
  try {
    // Return patients assigned to this doctor
    const patients = await User.find({ assignedDoctor: req.user._id }).select('-__v');
    return res.json({ patients });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function addDiagnosis(req, res) {
  try {
    const { patientID, diagnosis } = req.body;
    if (!patientID || !diagnosis) return res.status(400).json({ error: 'Missing fields' });
    // For demo, we attach diagnosis to a new MedicalRecord (doctor-created record)
    const rec = await MedicalRecord.create({ patientID, doctorID: req.user._id, encryptedData: Buffer.from(JSON.stringify(diagnosis)).toString('base64'), iv: 'manual', blockchainHash: '' });
    await AuditLog.create({ actor: req.user._id, action: 'add_diagnosis', target: rec._id });
    return res.json({ message: 'Diagnosis added', rec });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getEmergencyAlerts(req, res) {
  // For demo, find recent records with a special meta flag (not fully implemented)
  return res.json({ alerts: [] });
}

module.exports = { requestVerification, getPatients, addDiagnosis, getEmergencyAlerts };

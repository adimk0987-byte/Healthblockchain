const DoctorVerification = require('../models/DoctorVerification');
const AuditLog = require('../models/AuditLog');
const BloodBank = require('../models/BloodBank');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');

async function getPendingDoctors(req, res) {
  try {
    const pending = await DoctorVerification.find({ status: 'pending' }).populate('doctorID', 'name phone');
    return res.json({ pending });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function approveDoctor(req, res) {
  try {
    const { verificationId, approve } = req.body;
    const dv = await DoctorVerification.findById(verificationId);
    if (!dv) return res.status(404).json({ error: 'Not found' });
    dv.status = approve ? 'approved' : 'rejected';
    dv.reviewedAt = new Date();
    await dv.save();
    await AuditLog.create({ actor: req.user._id, action: approve ? 'doctor_approved' : 'doctor_rejected', target: dv._id });
    return res.json({ message: 'Updated', dv });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateBloodBank(req, res) {
  try {
    const { hospitalID, bloodType, quantity } = req.body;
    let entry = await BloodBank.findOne({ hospitalID, bloodType });
    if (!entry) entry = await BloodBank.create({ hospitalID, bloodType, quantity });
    else { entry.quantity = quantity; entry.updatedAt = new Date(); await entry.save(); }
    await AuditLog.create({ actor: req.user._id, action: 'update_bloodbank', target: `${hospitalID}:${bloodType}`, meta: { quantity } });
    return res.json({ message: 'Updated', entry });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getAnalytics(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    const totalRecords = await MedicalRecord.countDocuments();
    return res.json({ totalUsers, totalRecords });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { getPendingDoctors, approveDoctor, updateBloodBank, getAnalytics };

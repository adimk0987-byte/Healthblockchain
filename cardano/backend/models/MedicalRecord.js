const mongoose = require('mongoose');
const { Schema } = mongoose;

const MedicalRecordSchema = new Schema({
  patientID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorID: { type: Schema.Types.ObjectId, ref: 'User' },
  encryptedData: { type: String, required: true },
  iv: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  blockchainHash: { type: String },
  signature: { type: String }
});

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);

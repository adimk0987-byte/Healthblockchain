const mongoose = require('mongoose');
const { Schema } = mongoose;

const DoctorVerificationSchema = new Schema({
  doctorID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  documents: [{ type: String }], // URLs or base64 references
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date }
});

module.exports = mongoose.model('DoctorVerification', DoctorVerificationSchema);

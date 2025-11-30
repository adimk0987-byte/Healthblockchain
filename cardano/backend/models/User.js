const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  assignedDoctor: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedPatients: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  allergies: [{ type: String }],
  diseases: [{ type: String }],
  emergencyContact: {
    name: String,
    phone: String
  },
  walletAddress: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);

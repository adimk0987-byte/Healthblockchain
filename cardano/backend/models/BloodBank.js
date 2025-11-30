const mongoose = require('mongoose');
const { Schema } = mongoose;

const BloodBankSchema = new Schema({
  hospitalID: { type: Schema.Types.ObjectId, ref: 'User' },
  bloodType: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BloodBank', BloodBankSchema);

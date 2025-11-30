const mongoose = require('mongoose');
const { Schema } = mongoose;

const PermissionSchema = new Schema({
  patientID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  accessType: { type: String, enum: ['full','recent','specific','labs'], default: 'full' },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Permission', PermissionSchema);

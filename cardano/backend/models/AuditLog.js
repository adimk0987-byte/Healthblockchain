const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  target: { type: String },
  timestamp: { type: Date, default: Date.now },
  meta: { type: Schema.Types.Mixed }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);

// server-fast.js - Lightweight in-memory backend for instant startup (no MongoDB required)
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const jwtSecret = process.env.JWT_SECRET || 'demo-secret-key';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// ============ IN-MEMORY DATA STORE ============
const users = new Map(); // phone -> user object
const records = new Map(); // id -> medical record
const permissions = new Map(); // id -> permission
const auditLogs = [];
const otpStore = new Map(); // phone -> { otp, expiresAt }

// ============ UTILITIES ============
function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

function generateOTP() {
  return (Math.floor(100000 + Math.random() * 900000)).toString();
}

function hashRecord(payload) {
  const h = crypto.createHash('sha256');
  h.update(JSON.stringify(payload));
  return h.digest('hex');
}

// ============ AUTH MIDDLEWARE ============
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    const user = users.get(payload.phone);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', details: err.message });
  }
}

// ============ ROUTES ============

// /health
app.get('/health', (req, res) => res.json({ status: 'ok', backend: 'in-memory-fast' }));

// /auth/send-otp
app.post('/auth/send-otp', (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  const otp = generateOTP();
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });
  console.log(`[OTP] ${phone}: ${otp}`);
  res.json({ message: 'OTP sent', otp }); // For demo, return otp in response
});

// /auth/verify-otp
app.post('/auth/verify-otp', (req, res) => {
  const { phone, otp, name } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
  const entry = otpStore.get(phone);
  if (!entry || Date.now() > entry.expiresAt || entry.otp !== otp) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  otpStore.delete(phone);
  let user = users.get(phone);
  if (!user) {
    user = { id: uuidv4(), phone, name: name || 'User', role: 'patient', allergies: [], diseases: [], createdAt: new Date() };
    users.set(phone, user);
  }
  const token = signToken({ phone, role: user.role });
  res.json({ token, user });
});

// /auth/login
app.post('/auth/login', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  let user = users.get(phone);
  if (!user) {
    user = { id: uuidv4(), phone, name: 'User', role: 'patient', allergies: [], diseases: [], createdAt: new Date() };
    users.set(phone, user);
  }
  const token = signToken({ phone, role: user.role });
  res.json({ token, user });
});

// /patient/profile
app.get('/patient/profile', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// /patient/records
app.get('/patient/records', authMiddleware, (req, res) => {
  const userRecords = Array.from(records.values()).filter(r => r.patientPhone === req.user.phone);
  res.json({ records: userRecords });
});

// /patient/records/add
app.post('/patient/records/add', authMiddleware, (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Data required' });
  const id = uuidv4();
  const record = {
    id,
    patientPhone: req.user.phone,
    data,
    hash: hashRecord(data),
    timestamp: new Date(),
    encrypted: Buffer.from(JSON.stringify(data)).toString('base64')
  };
  records.set(id, record);
  auditLogs.push({ actor: req.user.phone, action: 'add_record', target: id, timestamp: new Date() });
  res.json({ message: 'Record saved', record });
});

// /patient/records/share
app.post('/patient/records/share', authMiddleware, (req, res) => {
  const { doctorPhone, accessType, durationHours } = req.body;
  if (!doctorPhone) return res.status(400).json({ error: 'doctorPhone required' });
  const id = uuidv4();
  const permission = {
    id,
    patientPhone: req.user.phone,
    doctorPhone,
    accessType: accessType || 'full',
    expiresAt: new Date(Date.now() + (durationHours || 24) * 3600 * 1000),
    createdAt: new Date()
  };
  permissions.set(id, permission);
  auditLogs.push({ actor: req.user.phone, action: 'grant_access', target: doctorPhone, timestamp: new Date() });
  res.json({ message: 'Permission granted', permission });
});

// /patient/permissions
app.get('/patient/permissions', authMiddleware, (req, res) => {
  const userPerms = Array.from(permissions.values()).filter(p => p.patientPhone === req.user.phone);
  res.json({ permissions: userPerms });
});

// /patient/permissions/revoke
app.post('/patient/permissions/revoke', authMiddleware, (req, res) => {
  const { permissionId } = req.body;
  const perm = permissions.get(permissionId);
  if (!perm) return res.status(404).json({ error: 'Permission not found' });
  if (perm.patientPhone !== req.user.phone) return res.status(403).json({ error: 'Unauthorized' });
  permissions.delete(permissionId);
  auditLogs.push({ actor: req.user.phone, action: 'revoke_access', target: permissionId, timestamp: new Date() });
  res.json({ message: 'Permission revoked' });
});

// /ai/diagnose (simulated)
app.post('/ai/diagnose', authMiddleware, (req, res) => {
  const { symptoms } = req.body;
  const s = (symptoms || '').toLowerCase();
  let severity = 'low', emergency = false, confidence = 0.65;
  const suggestions = [];

  if (s.includes('chest') || s.includes('breath')) {
    severity = 'high';
    emergency = true;
    confidence = 0.9;
    suggestions.push('Seek emergency care immediately.');
  } else if (s.includes('fever') || s.includes('cough')) {
    severity = 'medium';
    confidence = 0.78;
    suggestions.push('Rest, hydration. Consult doctor if worsening.');
  } else {
    suggestions.push('Mild symptoms. Rest and monitor.');
  }

  res.json({
    ai: {
      id: uuidv4(),
      severity,
      emergency,
      confidence,
      suggestions,
      followUpDays: severity === 'high' ? 0 : severity === 'medium' ? 3 : 7
    }
  });
});

// /blockchain/hash
app.post('/blockchain/hash', authMiddleware, (req, res) => {
  const hash = hashRecord(req.body);
  auditLogs.push({ actor: req.user.phone, action: 'blockchain_hash', target: hash, timestamp: new Date() });
  res.json({ hash });
});

// /blockchain/verify
app.post('/blockchain/verify', authMiddleware, (req, res) => {
  const { payload, expectedHash } = req.body;
  const actual = hashRecord(payload);
  const ok = actual === expectedHash;
  res.json({ ok, actual });
});

// /emergency/details
app.get('/emergency/details', authMiddleware, (req, res) => {
  res.json({
    summary: {
      name: req.user.name,
      phone: req.user.phone,
      allergies: req.user.allergies,
      diseases: req.user.diseases
    }
  });
});

// /emergency/nearest-hospital
app.get('/emergency/nearest-hospital', authMiddleware, (req, res) => {
  res.json({
    hospitals: [
      { id: 'h1', name: 'City Hospital', distance: 2.1, beds: 5, phone: '+911234567890', eta: '8 mins' },
      { id: 'h2', name: 'Green Valley Clinic', distance: 4.8, beds: 2, phone: '+911234567891', eta: '15 mins' }
    ]
  });
});

// /admin/analytics
app.get('/admin/analytics', authMiddleware, (req, res) => {
  res.json({
    totalUsers: users.size,
    totalRecords: records.size,
    totalPermissions: permissions.size,
    auditLogsCount: auditLogs.length
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ HealthChain backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

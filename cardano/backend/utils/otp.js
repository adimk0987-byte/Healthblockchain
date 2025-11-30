const crypto = require('crypto');
const config = require('../config');

// Simple in-memory OTP store for demo. Replace with Redis or DB in production.
const store = new Map();

function generateOTP(phone) {
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiresAt = Date.now() + (config.otpExpiryMinutes * 60 * 1000);
  store.set(phone, { otp, expiresAt });
  // In production, send SMS here. For demo, we return the OTP.
  console.log(`OTP for ${phone}: ${otp} (expires ${new Date(expiresAt).toISOString()})`);
  return otp;
}

function verifyOTP(phone, otp) {
  const entry = store.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(phone);
    return false;
  }
  if (entry.otp !== otp) return false;
  store.delete(phone);
  return true;
}

module.exports = { generateOTP, verifyOTP };

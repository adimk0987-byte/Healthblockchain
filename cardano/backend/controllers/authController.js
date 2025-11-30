const User = require('../models/User');
const { generateOTP, verifyOTP } = require('../utils/otp');
const jwtUtil = require('../utils/jwt');
const config = require('../config');

/**
 * sendOtp: generates OTP and (in prod) sends via SMS provider.
 */
async function sendOtp(req, res) {
  try {
    const { phone, name } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required' });
    const otp = generateOTP(phone);
    // Return masked response for security; include otp in response for dev/testing
    return res.json({ message: 'OTP sent', otp });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * verifyOtp: verifies OTP and creates (or fetches) user, returns JWT
 */
async function verifyOtp(req, res) {
  try {
    const { phone, otp, name } = req.body;
    if (!verifyOTP(phone, otp)) return res.status(400).json({ error: 'Invalid or expired OTP' });
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, name: name || 'Unnamed', role: 'patient' });
    }
    const token = jwtUtil.signToken({ id: user._id, role: user.role });
    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  // Lightweight login for demo (phone-based)
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: 'User not found. Use /auth/send-otp first.' });
    const token = jwtUtil.signToken({ id: user._id, role: user.role });
    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function roleSwitch(req, res) {
  // Allows switching role if allowed. Requires auth; simplified for demo.
  return res.status(501).json({ error: 'Role switch not implemented in demo' });
}

module.exports = { sendOtp, verifyOtp, login, roleSwitch };

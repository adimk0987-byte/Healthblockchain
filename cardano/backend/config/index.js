const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

module.exports = {
  port: process.env.PORT || 4000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/healthchain',
  jwtSecret: process.env.JWT_SECRET || 'please-change-this',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
  cardanoNetwork: process.env.CARDANO_NETWORK || 'testnet'
};

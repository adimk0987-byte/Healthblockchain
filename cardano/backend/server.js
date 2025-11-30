// server.js - entry point
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');

const config = require('./config');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const adminRoutes = require('./routes/admin');
const emergencyRoutes = require('./routes/emergency');
const blockchainRoutes = require('./routes/blockchain');
const aiRoutes = require('./routes/ai');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiter
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15') ) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Connect to DB
connectDB(process.env.MONGODB_URI || config.mongodbUri);

// API routes (prefix)
app.use('/auth', authRoutes);
app.use('/patient', patientRoutes);
app.use('/doctor', doctorRoutes);
app.use('/admin', adminRoutes);
app.use('/emergency', emergencyRoutes);
app.use('/blockchain', blockchainRoutes);
app.use('/ai', aiRoutes);

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`HealthChain backend running on port ${PORT}`);
});

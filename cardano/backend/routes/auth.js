const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/send-otp', [body('phone').isString().notEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return authController.sendOtp(req, res);
});

router.post('/verify-otp', [body('phone').isString().notEmpty(), body('otp').isString().notEmpty()], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return authController.verifyOtp(req, res);
});

// login can support social/loginless by returning token
router.post('/login', [body('phone').isString().notEmpty()], (req, res) => authController.login(req, res));

router.post('/role-switch', authController.roleSwitch);

module.exports = router;

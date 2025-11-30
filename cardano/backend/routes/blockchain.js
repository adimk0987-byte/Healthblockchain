const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const blockchainController = require('../controllers/blockchainController');

router.post('/hash', auth, (req, res) => blockchainController.hashRecord(req, res));
router.post('/verify', auth, (req, res) => blockchainController.verifyRecord(req, res));
router.post('/wallet/verify-signature', auth, (req, res) => blockchainController.verifySignature(req, res));
router.post('/transactions/push', auth, (req, res) => blockchainController.pushTransaction(req, res));

module.exports = router;

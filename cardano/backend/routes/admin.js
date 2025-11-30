const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const adminController = require('../controllers/adminController');

router.use(auth);
router.use(roles(['admin']));

router.get('/doctors/pending', (req, res) => adminController.getPendingDoctors(req, res));
router.post('/doctors/approve', (req, res) => adminController.approveDoctor(req, res));
router.post('/blood-bank/update', (req, res) => adminController.updateBloodBank(req, res));
router.get('/analytics', (req, res) => adminController.getAnalytics(req, res));

module.exports = router;

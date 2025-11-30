const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const doctorController = require('../controllers/doctorController');

router.use(auth);

router.post('/verify', (req, res) => doctorController.requestVerification(req, res));
router.get('/patients', (req, res) => doctorController.getPatients(req, res));
router.post('/diagnosis/add', (req, res) => doctorController.addDiagnosis(req, res));
router.get('/emergency-alerts', (req, res) => doctorController.getEmergencyAlerts(req, res));

module.exports = router;

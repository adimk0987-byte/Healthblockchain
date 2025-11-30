const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const emergencyController = require('../controllers/emergencyController');

router.use(auth);

router.get('/details', (req, res) => emergencyController.getDetails(req, res));
router.get('/nearest-hospital', (req, res) => emergencyController.findNearestHospital(req, res));
router.get('/blood-availability', (req, res) => emergencyController.getBloodAvailability(req, res));
router.post('/auto-share', (req, res) => emergencyController.autoShare(req, res));

module.exports = router;

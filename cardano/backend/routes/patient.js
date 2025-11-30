const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const patientController = require('../controllers/patientController');

router.use(auth);

router.get('/profile', (req, res) => patientController.getProfile(req, res));
router.get('/records', (req, res) => patientController.getRecords(req, res));
router.post('/records/add', (req, res) => patientController.addRecord(req, res));
router.post('/records/share', (req, res) => patientController.shareRecord(req, res));

router.get('/permissions', (req, res) => patientController.getPermissions(req, res));
router.post('/permissions/grant', (req, res) => patientController.grantPermission(req, res));
router.post('/permissions/revoke', (req, res) => patientController.revokePermission(req, res));

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

// AI diagnosis endpoint supports optional image/pdf
router.post('/diagnose', auth, upload.single('file'), (req, res) => aiController.diagnose(req, res));

module.exports = router;

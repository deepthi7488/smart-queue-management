const express = require('express');
const router = express.Router();
const { getAllPatients } = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('admin'), getAllPatients);

module.exports = router;

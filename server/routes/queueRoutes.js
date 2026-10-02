const express = require('express');
const router = express.Router();
const {
  getAdminDashboardStats,
  getDoctorQueue,
  callNextPatient,
  completeConsultation,
  markMissedPatient,
  updateDuration,
} = require('../controllers/queueController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public/Live Queue display for a doctor
router.get('/doctor/:doctorId', getDoctorQueue);

// Admin-only queue operations
router.get('/admin/stats', protect, authorize('admin'), getAdminDashboardStats);
router.post('/call-next', protect, authorize('admin'), callNextPatient);
router.post('/complete-consultation', protect, authorize('admin'), completeConsultation);
router.post('/mark-missed', protect, authorize('admin'), markMissedPatient);
router.put('/update-duration', protect, authorize('admin'), updateDuration);

module.exports = router;

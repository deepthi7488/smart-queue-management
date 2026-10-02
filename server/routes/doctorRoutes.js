const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctorStatus,
  updateDoctor,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes (patients can view doctor list and availability)
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);

// Admin-only routes
router.post('/', protect, authorize('admin'), createDoctor);
router.put('/:id/status', protect, authorize('admin'), updateDoctorStatus);
router.put('/:id', protect, authorize('admin'), updateDoctor);

module.exports = router;

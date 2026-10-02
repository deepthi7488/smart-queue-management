const Doctor = require('../models/Doctor');
const Token = require('../models/Token');
const { recalculateDoctorQueue } = require('../utils/queueCalculator');

// @desc    Get all doctors (with live queue status summary)
// @route   GET /api/doctors
// @access  Public
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isActive: true }).sort({ name: 1 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Attach real-time queue count for each doctor today
    const doctorListWithQueue = await Promise.all(
      doctors.map(async (doc) => {
        const tokensToday = await Token.find({
          doctorId: doc._id,
          appointmentDate: { $gte: todayStart, $lte: todayEnd },
        });

        const activeToken = tokensToday.find((t) => t.status === 'in_consultation');
        const waitingCount = tokensToday.filter((t) => t.status === 'waiting').length;
        const completedCount = tokensToday.filter((t) => t.status === 'completed').length;

        return {
          ...doc.toObject(),
          queueSummary: {
            currentServingToken: activeToken ? activeToken.tokenNumber : 'None',
            waitingPatients: waitingCount,
            completedPatients: completedCount,
            totalToday: tokensToday.length,
            availableSlots: Math.max(0, doc.maxDailyTokens - tokensToday.length),
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: doctorListWithQueue.length,
      data: doctorListWithQueue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch doctors',
    });
  }
};

// @desc    Get single doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const queueData = await recalculateDoctorQueue(doctor._id);

    res.status(200).json({
      success: true,
      data: doctor,
      queue: queueData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch doctor details',
    });
  }
};

// @desc    Create new doctor (Admin only)
// @route   POST /api/doctors
// @access  Private/Admin
exports.createDoctor = async (req, res) => {
  try {
    const {
      name,
      specialization,
      department,
      roomNumber,
      averageConsultationTime,
      scheduleStartTime,
      scheduleEndTime,
      maxDailyTokens,
    } = req.body;

    if (!name || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'Doctor name and specialization are required.',
      });
    }

    const doctor = await Doctor.create({
      name,
      specialization,
      department: department || 'General OPD',
      roomNumber: roomNumber || 'OPD-101',
      averageConsultationTime: averageConsultationTime || 10,
      scheduleStartTime: scheduleStartTime || '09:00 AM',
      scheduleEndTime: scheduleEndTime || '05:00 PM',
      maxDailyTokens: maxDailyTokens || 30,
    });

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create doctor',
    });
  }
};

// @desc    Update doctor status & delay (Admin only)
// @route   PUT /api/doctors/:id/status
// @access  Private/Admin
exports.updateDoctorStatus = async (req, res) => {
  try {
    const { status, delayMinutes, delayReason } = req.body;

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (status) doctor.status = status;
    if (delayMinutes !== undefined) doctor.delayMinutes = Math.max(0, Number(delayMinutes));
    if (delayReason !== undefined) doctor.delayReason = delayReason;

    await doctor.save();

    // Automatically recalculate remaining queue when doctor status or delay changes!
    const queueSummary = await recalculateDoctorQueue(doctor._id);

    res.status(200).json({
      success: true,
      message: `Doctor status updated to '${doctor.status}' with ${doctor.delayMinutes} mins delay`,
      data: doctor,
      queue: queueSummary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update doctor status',
    });
  }
};

// @desc    Update doctor profile (Admin only)
// @route   PUT /api/doctors/:id
// @access  Private/Admin
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    await recalculateDoctorQueue(doctor._id);

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update doctor',
    });
  }
};

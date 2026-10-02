const Token = require('../models/Token');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const { recalculateDoctorQueue } = require('../utils/queueCalculator');

// @desc    Get aggregate stats for Admin Dashboard
// @route   GET /api/queue/admin/stats
// @access  Private/Admin
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalRegisteredPatients,
      todayTokens,
      activeDoctorsCount,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Token.find({ appointmentDate: { $gte: todayStart, $lte: todayEnd } }),
      Doctor.countDocuments({ isActive: true }),
    ]);

    const onlineTokensCount = todayTokens.filter((t) => t.tokenType === 'online').length;
    const offlineTokensCount = todayTokens.filter((t) => t.tokenType === 'offline').length;
    const waitingCount = todayTokens.filter((t) => t.status === 'waiting').length;
    const inConsultationCount = todayTokens.filter((t) => t.status === 'in_consultation').length;
    const completedCount = todayTokens.filter((t) => t.status === 'completed').length;
    const cancelledCount = todayTokens.filter((t) => t.status === 'cancelled').length;
    const missedCount = todayTokens.filter((t) => t.status === 'missed').length;

    res.status(200).json({
      success: true,
      stats: {
        totalRegisteredPatients,
        totalTokensToday: todayTokens.length,
        onlineTokensCount,
        offlineTokensCount,
        waitingCount,
        inConsultationCount,
        completedCount,
        cancelledCount,
        missedCount,
        activeDoctorsCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin stats',
    });
  }
};

// @desc    Get full day queue for a specific doctor
// @route   GET /api/queue/doctor/:doctorId
// @access  Public / Admin
exports.getDoctorQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Recalculate queue to ensure all times are fresh
    const queueSummary = await recalculateDoctorQueue(doctorId);

    const tokens = await Token.find({
      doctorId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
    })
      .populate('patientId', 'email phone')
      .sort({ sequenceNumber: 1 });

    res.status(200).json({
      success: true,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        roomNumber: doctor.roomNumber,
        status: doctor.status,
        delayMinutes: doctor.delayMinutes,
        delayReason: doctor.delayReason,
        averageConsultationTime: doctor.averageConsultationTime,
      },
      summary: queueSummary,
      tokens,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch doctor queue',
    });
  }
};

// @desc    Call next waiting patient into consultation (Admin)
// @route   POST /api/queue/call-next
// @access  Private/Admin
exports.callNextPatient = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'Please provide doctorId' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // If there is an existing in_consultation token, auto-complete it
    const activeToken = await Token.findOne({
      doctorId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
      status: 'in_consultation',
    });

    if (activeToken) {
      activeToken.status = 'completed';
      activeToken.actualEndTime = new Date();
      await activeToken.save();

      // Complete any open consultation record
      const activeConsultation = await Consultation.findOne({
        tokenId: activeToken._id,
        status: 'in_progress',
      });

      if (activeConsultation) {
        activeConsultation.status = 'completed';
        activeConsultation.endTime = new Date();
        const durationMin = Math.max(
          1,
          Math.round((activeConsultation.endTime - activeConsultation.startTime) / 60000)
        );
        activeConsultation.actualDuration = durationMin;
        activeConsultation.delayMinutes = durationMin - activeConsultation.expectedDuration;
        await activeConsultation.save();
      }
    }

    // Find the next waiting patient strictly in sequence
    const nextToken = await Token.findOne({
      doctorId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
      status: 'waiting',
    }).sort({ sequenceNumber: 1 });

    if (!nextToken) {
      doctor.status = 'Available';
      await doctor.save();
      return res.status(200).json({
        success: true,
        message: 'No more waiting patients in queue. Doctor marked Available.',
        token: null,
      });
    }

    // Transition next token to in_consultation
    nextToken.status = 'in_consultation';
    nextToken.actualStartTime = new Date();
    await nextToken.save();

    // Create Consultation record
    await Consultation.create({
      tokenId: nextToken._id,
      doctorId: doctor._id,
      startTime: new Date(),
      expectedDuration: doctor.averageConsultationTime || 10,
      status: 'in_progress',
    });

    // Update Doctor status
    doctor.status = 'In Consultation';
    await doctor.save();

    // Trigger queue recalculation for remaining waiting patients
    await recalculateDoctorQueue(doctorId);

    res.status(200).json({
      success: true,
      message: `Now serving Token ${nextToken.tokenNumber} (${nextToken.patientName})`,
      token: nextToken,
    });
  } catch (error) {
    console.error('Call next patient error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to call next patient',
    });
  }
};

// @desc    Complete current consultation (Admin)
// @route   POST /api/queue/complete-consultation
// @access  Private/Admin
exports.completeConsultation = async (req, res) => {
  try {
    const { doctorId, notes } = req.body;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const activeToken = await Token.findOne({
      doctorId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
      status: 'in_consultation',
    });

    if (!activeToken) {
      return res.status(400).json({
        success: false,
        message: 'No patient is currently in consultation for this doctor.',
      });
    }

    const now = new Date();
    activeToken.status = 'completed';
    activeToken.actualEndTime = now;
    await activeToken.save();

    const consultation = await Consultation.findOne({
      tokenId: activeToken._id,
      status: 'in_progress',
    });

    let actualDuration = null;
    let delayMinutes = 0;

    if (consultation) {
      consultation.status = 'completed';
      consultation.endTime = now;
      actualDuration = Math.max(
        1,
        Math.round((now.getTime() - new Date(consultation.startTime).getTime()) / 60000)
      );
      consultation.actualDuration = actualDuration;
      delayMinutes = actualDuration - consultation.expectedDuration;
      consultation.delayMinutes = delayMinutes;
      if (notes) consultation.doctorNotes = notes;
      await consultation.save();
    }

    // Set doctor status back to Available
    const doctor = await Doctor.findById(doctorId);
    if (doctor) {
      doctor.status = 'Available';
      await doctor.save();
    }

    // Dynamic queue recalculation
    const queueSummary = await recalculateDoctorQueue(doctorId);

    res.status(200).json({
      success: true,
      message: `Consultation for Token ${activeToken.tokenNumber} completed. Actual duration: ${actualDuration || 'N/A'} mins.`,
      token: activeToken,
      consultation,
      queue: queueSummary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete consultation',
    });
  }
};

// @desc    Mark patient as missed / absent (Admin)
// @route   POST /api/queue/mark-missed
// @access  Private/Admin
exports.markMissedPatient = async (req, res) => {
  try {
    const { tokenId, reason } = req.body;

    const token = await Token.findById(tokenId);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    token.status = 'missed';
    token.missedReason = reason || 'Patient was absent when token was announced';
    await token.save();

    // If this token was currently in consultation, mark consultation cancelled
    await Consultation.updateOne(
      { tokenId: token._id, status: 'in_progress' },
      { status: 'cancelled', notes: 'Patient missed/walked out' }
    );

    // Reset doctor status if it was in consultation
    const doctor = await Doctor.findById(token.doctorId);
    if (doctor && doctor.status === 'In Consultation') {
      doctor.status = 'Available';
      await doctor.save();
    }

    // Recalculate remaining queue
    const queueSummary = await recalculateDoctorQueue(token.doctorId);

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} marked as missed. Queue times recalculated.`,
      token,
      queue: queueSummary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark token as missed',
    });
  }
};

// @desc    Update consultation duration in real-time (Admin/Doctor)
// @route   PUT /api/queue/update-duration
// @access  Private/Admin
exports.updateDuration = async (req, res) => {
  try {
    const { doctorId, additionalMinutes, reason } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Add delay to doctor
    const delay = Math.max(0, Number(additionalMinutes) || 0);
    doctor.delayMinutes = (doctor.delayMinutes || 0) + delay;
    if (reason) doctor.delayReason = reason;
    await doctor.save();

    // Recalculate all queue positions & wait times immediately
    const queueSummary = await recalculateDoctorQueue(doctorId);

    res.status(200).json({
      success: true,
      message: `Doctor schedule shifted by +${delay} minutes. All patient wait times updated dynamically!`,
      doctor,
      queue: queueSummary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update consultation duration',
    });
  }
};

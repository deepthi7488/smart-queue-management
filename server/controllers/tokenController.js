const Token = require('../models/Token');
const Doctor = require('../models/Doctor');
const { recalculateDoctorQueue } = require('../utils/queueCalculator');

// Helper to generate next sequential token number (e.g., A001, A002, etc.)
const generateNextTokenNumber = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId);
  const prefix = doctor && doctor.name ? doctor.name.replace('Dr. ', '').charAt(0).toUpperCase() : 'T';

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Count existing tokens for this doctor today
  const existingCount = await Token.countDocuments({
    doctorId,
    appointmentDate: { $gte: todayStart, $lte: todayEnd },
  });

  const nextSeq = existingCount + 1;
  const formattedNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;

  return {
    tokenNumber: formattedNumber,
    sequenceNumber: nextSeq,
  };
};

// @desc    Book an online token (Patient)
// @route   POST /api/tokens/book-online
// @access  Private/Patient
exports.bookOnlineToken = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'Please select a doctor' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ success: false, message: 'Doctor is not available for booking' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check if patient already has an active (waiting/in_consultation) token today with this doctor
    const existingActiveToken = await Token.findOne({
      doctorId,
      patientId: req.user._id,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ['waiting', 'in_consultation'] },
    });

    if (existingActiveToken) {
      return res.status(400).json({
        success: false,
        message: `You already have an active token (${existingActiveToken.tokenNumber}) with ${doctor.name} today.`,
      });
    }

    // Check daily limit
    const totalToday = await Token.countDocuments({
      doctorId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
    });

    if (totalToday >= doctor.maxDailyTokens) {
      return res.status(400).json({
        success: false,
        message: `Token booking limit reached for ${doctor.name} today. Please try another doctor or visit reception.`,
      });
    }

    const { tokenNumber, sequenceNumber } = await generateNextTokenNumber(doctorId);

    const token = await Token.create({
      tokenNumber,
      sequenceNumber,
      patientId: req.user._id,
      patientName: req.user.name,
      patientPhone: req.user.phone,
      doctorId,
      tokenType: 'online',
      status: 'waiting',
      appointmentDate: new Date(),
    });

    // Automatically recalculate queue and update estimated wait time
    await recalculateDoctorQueue(doctorId);

    // Reload freshly calculated token
    const updatedToken = await Token.findById(token._id).populate('doctorId', 'name specialization roomNumber status');

    res.status(201).json({
      success: true,
      message: `Token ${tokenNumber} booked successfully!`,
      data: updatedToken,
    });
  } catch (error) {
    console.error('Online booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book online token',
    });
  }
};

// @desc    Book an offline walk-in token (Admin)
// @route   POST /api/tokens/book-offline
// @access  Private/Admin
exports.bookOfflineToken = async (req, res) => {
  try {
    const { doctorId, patientName, patientPhone } = req.body;

    if (!doctorId || !patientName || !patientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide doctorId, patientName, and patientPhone for offline token.',
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const { tokenNumber, sequenceNumber } = await generateNextTokenNumber(doctorId);

    const token = await Token.create({
      tokenNumber,
      sequenceNumber,
      patientId: null, // Walk-in offline token
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      doctorId,
      tokenType: 'offline', // Clearly distinguished as offline in admin interface
      status: 'waiting',
      appointmentDate: new Date(),
    });

    // Automatically recalculate queue so the new offline token enters the SAME sequential line!
    await recalculateDoctorQueue(doctorId);

    const updatedToken = await Token.findById(token._id).populate('doctorId', 'name specialization roomNumber status');

    res.status(201).json({
      success: true,
      message: `Offline walk-in token ${tokenNumber} generated successfully for ${patientName}!`,
      data: updatedToken,
    });
  } catch (error) {
    console.error('Offline booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate offline token',
    });
  }
};

// @desc    Get all tokens for current patient (active and past)
// @route   GET /api/tokens/my-tokens
// @access  Private/Patient
exports.getMyTokens = async (req, res) => {
  try {
    const tokens = await Token.find({ patientId: req.user._id })
      .populate('doctorId', 'name specialization roomNumber department status delayMinutes')
      .sort({ createdAt: -1 });

    // For any waiting token today, refresh queue calculation to return accurate live estimate
    const activeWaiting = tokens.find((t) => t.status === 'waiting');
    if (activeWaiting && activeWaiting.doctorId) {
      await recalculateDoctorQueue(activeWaiting.doctorId._id);
    }

    // Re-fetch populated tokens after recalculation
    const refreshedTokens = await Token.find({ patientId: req.user._id })
      .populate('doctorId', 'name specialization roomNumber department status delayMinutes')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: refreshedTokens.length,
      data: refreshedTokens,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch your tokens',
    });
  }
};

// @desc    Get live queue status for a specific token
// @route   GET /api/tokens/:id/status
// @access  Public / Patient
exports.getTokenStatus = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id).populate('doctorId');
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    // Refresh live queue calculations
    const queueData = await recalculateDoctorQueue(token.doctorId._id);
    const refreshedToken = await Token.findById(req.params.id).populate('doctorId');

    // Count how many patients are waiting strictly ahead of this token
    const patientsAhead = Math.max(0, (refreshedToken.queuePosition || 1) - 1);

    res.status(200).json({
      success: true,
      data: {
        tokenNumber: refreshedToken.tokenNumber,
        patientName: refreshedToken.patientName,
        doctorName: refreshedToken.doctorId.name,
        doctorStatus: refreshedToken.doctorId.status,
        doctorDelayMinutes: refreshedToken.doctorId.delayMinutes,
        roomNumber: refreshedToken.doctorId.roomNumber,
        status: refreshedToken.status,
        tokenType: refreshedToken.tokenType,
        queuePosition: refreshedToken.queuePosition,
        patientsAhead: refreshedToken.status === 'waiting' ? patientsAhead : 0,
        estimatedWaitMinutes: refreshedToken.status === 'waiting' ? refreshedToken.estimatedWaitMinutes : 0,
        estimatedStartTime: refreshedToken.estimatedStartTime,
        currentServingToken: queueData.activeToken ? queueData.activeToken.tokenNumber : 'None',
        appointmentDate: refreshedToken.appointmentDate,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch token status',
    });
  }
};

// @desc    Cancel a token (by patient or admin)
// @route   PUT /api/tokens/:id/cancel
// @access  Private
exports.cancelToken = async (req, res) => {
  try {
    const token = await Token.findById(req.params.id);
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    // Ensure authorization: patient can only cancel their own token; admin can cancel any
    if (req.user.role !== 'admin' && String(token.patientId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this token' });
    }

    if (token.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already completed consultation' });
    }

    token.status = 'cancelled';
    token.cancellationReason = req.body.reason || 'Cancelled by user/reception';
    await token.save();

    // Recalculate remaining queue so subsequent patients shift up!
    await recalculateDoctorQueue(token.doctorId);

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} has been cancelled successfully. Queue updated.`,
      data: token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel token',
    });
  }
};

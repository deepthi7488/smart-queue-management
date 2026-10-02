const Doctor = require('../models/Doctor');
const Token = require('../models/Token');
const Consultation = require('../models/Consultation');

/**
 * Recalculate dynamic queue times and positions for a doctor's active queue.
 * Accounts for:
 * 1. Doctor delays / late arrival
 * 2. Active consultation overruns / early completions
 * 3. Skipped / missed / cancelled tokens (excluded from upcoming wait times)
 * 4. Average consultation duration per doctor
 * 
 * @param {string|ObjectId} doctorId 
 * @returns {Promise<Object>} Summary of recalculated queue
 */
const recalculateDoctorQueue = async (doctorId) => {
  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      throw new Error(`Doctor not found with ID ${doctorId}`);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch all tokens for this doctor today, ordered strictly by sequenceNumber
    const tokens = await Token.find({
      doctorId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
    }).sort({ sequenceNumber: 1 });

    const now = new Date();
    const avgConsultationMinutes = doctor.averageConsultationTime || 10;
    const doctorDelayMinutes = doctor.delayMinutes || 0;

    // Find currently active consultation if any
    const activeToken = tokens.find((t) => t.status === 'in_consultation');

    // Base time = now + any doctor-level manual delay (e.g. late arrival)
    let nextAvailableTime = new Date(now.getTime() + doctorDelayMinutes * 60000);

    if (activeToken) {
      const activeConsultation = await Consultation.findOne({
        tokenId: activeToken._id,
        status: 'in_progress',
      });

      if (activeConsultation && activeConsultation.startTime) {
        // ── AUTOMATIC REAL-TIME OVERRUN DETECTION ─────────────────────────────
        // Measure how many minutes have ACTUALLY elapsed since consultation started.
        // This happens automatically — no admin needs to type any delay value.
        // e.g. Expected = 10 min, Elapsed = 17 min → system detects overrun of 7 min
        const elapsedMs = now.getTime() - new Date(activeConsultation.startTime).getTime();
        const elapsedMinutes = Math.max(0, elapsedMs / 60000); // keep as float for accuracy

        if (elapsedMinutes >= avgConsultationMinutes) {
          // Consultation has OVERRUN its expected duration.
          // The overrun is: how many extra minutes beyond the scheduled slot.
          // e.g. elapsed=17, expected=10 → overrunMinutes=7
          // The next patient's slot starts: NOW + 2min wrap-up buffer
          // All subsequent patients shift by the same overrun automatically.
          const overrunMinutes = elapsedMinutes - avgConsultationMinutes;

          // Small 2-min buffer for doctor to wrap up notes and call in next patient
          nextAvailableTime = new Date(now.getTime() + 2 * 60000);

          // Auto-record the detected overrun on the consultation for audit logs
          // (no admin input required — happens silently every recalculation cycle)
          if (Math.round(overrunMinutes) !== activeConsultation.delayMinutes) {
            activeConsultation.delayMinutes = Math.round(overrunMinutes);
            await activeConsultation.save();
          }
        } else {
          // Consultation is still within its expected duration.
          // Calculate exactly how many minutes remain before it should end.
          // e.g. expected=10, elapsed=4 → remaining=6 → next patient starts in 6 min
          const remainingMinutes = avgConsultationMinutes - elapsedMinutes;
          nextAvailableTime = new Date(now.getTime() + remainingMinutes * 60000);
        }
      } else {
        // No consultation record yet — use full average as safe fallback
        nextAvailableTime = new Date(now.getTime() + avgConsultationMinutes * 60000);
      }
    } else {
      // No active consultation — if doctor is on break, add a 15-min buffer
      if (doctor.status === 'On Break') {
        nextAvailableTime = new Date(nextAvailableTime.getTime() + 15 * 60000);
      }
    }

    // Now loop through waiting tokens and update their position and estimated times
    const waitingTokens = tokens.filter((t) => t.status === 'waiting');

    for (let i = 0; i < waitingTokens.length; i++) {
      const token = waitingTokens[i];
      const waitMinutes = Math.max(
        0,
        Math.round((nextAvailableTime.getTime() - now.getTime()) / 60000)
      );

      token.queuePosition = i + 1; // 1-based position in waiting line
      token.estimatedWaitMinutes = waitMinutes;
      token.estimatedStartTime = new Date(nextAvailableTime);

      await token.save();

      // Subsequent patient starts after this consultation's average time
      nextAvailableTime = new Date(
        nextAvailableTime.getTime() + avgConsultationMinutes * 60000
      );
    }

    return {
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorStatus: doctor.status,
      doctorDelayMinutes: doctor.delayMinutes,
      activeToken: activeToken
        ? {
            id: activeToken._id,
            tokenNumber: activeToken.tokenNumber,
            patientName: activeToken.patientName,
            tokenType: activeToken.tokenType,
          }
        : null,
      waitingCount: waitingTokens.length,
      completedCount: tokens.filter((t) => t.status === 'completed').length,
      cancelledCount: tokens.filter((t) => t.status === 'cancelled').length,
      missedCount: tokens.filter((t) => t.status === 'missed').length,
      totalTokensToday: tokens.length,
    };
  } catch (error) {
    console.error('Error in recalculateDoctorQueue:', error);
    throw error;
  }
};

module.exports = { recalculateDoctorQueue };

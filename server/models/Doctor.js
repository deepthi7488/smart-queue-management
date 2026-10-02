const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide doctor name'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Please provide doctor specialization'],
      trim: true,
    },
    department: {
      type: String,
      default: 'General Outpatient Department (OPD)',
      trim: true,
    },
    roomNumber: {
      type: String,
      default: 'OPD-101',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'Available',
          'Not Available',
          'Delayed',
          'In Consultation',
          'On Break',
          'Completed',
        ],
        message: 'Invalid doctor status',
      },
      default: 'Available',
    },
    delayMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Delay minutes cannot be negative'],
    },
    delayReason: {
      type: String,
      default: '',
      trim: true,
    },
    averageConsultationTime: {
      type: Number,
      default: 10, // Default 10 minutes per patient
      min: [1, 'Average consultation time must be at least 1 minute'],
    },
    scheduleStartTime: {
      type: String,
      default: '09:00 AM',
    },
    scheduleEndTime: {
      type: String,
      default: '05:00 PM',
    },
    maxDailyTokens: {
      type: Number,
      default: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);

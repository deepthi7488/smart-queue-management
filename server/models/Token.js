const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: [true, 'Token number is required'],
      trim: true,
      uppercase: true,
    },
    // Optional reference to a registered user (if booked online)
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Required name & phone for both online patients and offline walk-ins
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    patientPhone: {
      type: String,
      required: [true, 'Patient phone number is required'],
      trim: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor selection is required'],
    },
    appointmentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    tokenType: {
      type: String,
      enum: {
        values: ['online', 'offline'],
        message: 'Token type must be either online or offline',
      },
      required: [true, 'Token type is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['waiting', 'in_consultation', 'completed', 'cancelled', 'missed'],
        message: 'Invalid token status',
      },
      default: 'waiting',
    },
    // Sequential counter for the doctor on that day
    sequenceNumber: {
      type: Number,
      required: true,
    },
    // Dynamically calculated estimated start time
    estimatedStartTime: {
      type: Date,
    },
    // Estimated wait time in minutes for this patient
    estimatedWaitMinutes: {
      type: Number,
      default: 0,
    },
    // Position in current waiting queue (e.g., 3 patients ahead)
    queuePosition: {
      type: Number,
      default: 0,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    missedReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of tokenNumber per doctor per day
tokenSchema.index({ doctorId: 1, appointmentDate: 1, sequenceNumber: 1 });

module.exports = mongoose.model('Token', tokenSchema);

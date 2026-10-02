const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    tokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Token',
      required: [true, 'Token reference is required'],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endTime: {
      type: Date,
    },
    expectedDuration: {
      type: Number,
      default: 10, // Expected minutes for consultation
      required: true,
    },
    actualDuration: {
      type: Number, // Computed in minutes when consultation completes
      default: null,
    },
    delayMinutes: {
      type: Number, // Positive if overrun, negative if completed early
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['in_progress', 'completed', 'cancelled'],
        message: 'Invalid consultation status',
      },
      default: 'in_progress',
    },
    doctorNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Consultation', consultationSchema);

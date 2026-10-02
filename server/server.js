const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const queueRoutes = require('./routes/queueRoutes');
const patientRoutes = require('./routes/patientRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/patients', patientRoutes);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Smart Queue Management API is running healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/doctors',
      '/api/tokens',
      '/api/queue',
      '/api/patients'
    ]
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.send('<h3>Smart Queue Management System API - Running</h3>');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTOMATIC BACKGROUND QUEUE RECALCULATION ENGINE
// Runs every 60 seconds silently in the background.
// NO admin or patient needs to do anything manually.
// 
// What it does automatically:
//   → Finds all doctors who currently have a patient "in_consultation"
//   → Checks how long the consultation has ACTUALLY been running
//   → If it has overrun (e.g. 17 mins for a 10-min slot), detects +7 min overrun
//   → Updates all WAITING patients' estimated start times automatically
//   → Example: Token 2 was 12:30 → system shifts it to 12:37 silently
// ══════════════════════════════════════════════════════════════════════════════
const Doctor = require('./models/Doctor');
const { recalculateDoctorQueue } = require('./utils/queueCalculator');

const startAutoQueueEngine = () => {
  // Run immediately once at startup, then every 60 seconds
  const runCycle = async () => {
    try {
      // Find all doctors who currently have an active in-progress consultation
      const activeDoctors = await Doctor.find({
        status: 'In Consultation',
        isActive: true,
      });

      if (activeDoctors.length > 0) {
        console.log(`⏱  Auto-Queue Engine: Recalculating for ${activeDoctors.length} active doctor(s)...`);
        await Promise.all(
          activeDoctors.map((doc) => recalculateDoctorQueue(doc._id))
        );
        console.log(`✅ Auto-Queue Engine: All queues updated (${new Date().toLocaleTimeString()})`);
      }
    } catch (err) {
      console.error('Auto-Queue Engine Error:', err.message);
    }
  };

  // Run once immediately on server start
  setTimeout(runCycle, 5000);

  // Then repeat every 60 seconds
  setInterval(runCycle, 60 * 1000);

  console.log(`🔄 Auto-Queue Engine: Started — recalculates every 60s automatically`);
};

// Start server
app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🏥 Smart Queue Hospital Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);

  // Start the background auto-recalculation engine AFTER server is ready
  startAutoQueueEngine();
});

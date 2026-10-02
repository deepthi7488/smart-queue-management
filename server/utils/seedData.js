const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

dotenv.config();

const sampleDoctors = [
  {
    name: 'Dr. Rajesh Sharma',
    specialization: 'Cardiology',
    department: 'Cardiology & Heart Care Wing',
    roomNumber: 'OPD-101',
    status: 'Available',
    delayMinutes: 0,
    averageConsultationTime: 15,
    scheduleStartTime: '09:00 AM',
    scheduleEndTime: '01:00 PM',
    maxDailyTokens: 25,
  },
  {
    name: 'Dr. Priya Nair',
    specialization: 'General Medicine',
    department: 'Primary Healthcare & OPD',
    roomNumber: 'OPD-102',
    status: 'Available',
    delayMinutes: 0,
    averageConsultationTime: 10,
    scheduleStartTime: '08:30 AM',
    scheduleEndTime: '02:00 PM',
    maxDailyTokens: 35,
  },
  {
    name: 'Dr. Ananya Sen',
    specialization: 'Pediatrics',
    department: 'Child Care & Pediatrics',
    roomNumber: 'OPD-103',
    status: 'Available',
    delayMinutes: 0,
    averageConsultationTime: 12,
    scheduleStartTime: '09:30 AM',
    scheduleEndTime: '01:30 PM',
    maxDailyTokens: 25,
  },
  {
    name: 'Dr. Vikram Patel',
    specialization: 'Orthopedics',
    department: 'Bone & Joint Clinic',
    roomNumber: 'OPD-104',
    status: 'Available',
    delayMinutes: 0,
    averageConsultationTime: 20,
    scheduleStartTime: '10:00 AM',
    scheduleEndTime: '03:00 PM',
    maxDailyTokens: 20,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🌱 Seeding initial database records...');

    // 1. Create Default Admin if not exists
    const adminExists = await User.findOne({ email: 'admin@hospital.com' });
    if (!adminExists) {
      await User.create({
        name: 'Hospital Administrator',
        email: 'admin@hospital.com',
        phone: '9876543210',
        password: 'adminpassword123',
        role: 'admin',
      });
      console.log('👤 Default Admin created: admin@hospital.com / adminpassword123');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    // 2. Create Sample Patient if not exists
    const patientExists = await User.findOne({ email: 'patient@example.com' });
    if (!patientExists) {
      await User.create({
        name: 'Rohan Verma',
        email: 'patient@example.com',
        phone: '9123456780',
        password: 'patientpassword123',
        role: 'patient',
      });
      console.log('👤 Demo Patient created: patient@example.com / patientpassword123');
    } else {
      console.log('ℹ️ Demo Patient already exists.');
    }

    // 3. Seed Doctors if none exist
    const doctorCount = await Doctor.countDocuments();
    if (doctorCount === 0) {
      await Doctor.insertMany(sampleDoctors);
      console.log(`🩺 Seeded ${sampleDoctors.length} sample doctors successfully.`);
    } else {
      console.log(`ℹ️ ${doctorCount} Doctors already present in the database.`);
    }

    console.log('🎉 Phase 2 Database verification & seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();

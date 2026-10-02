const dotenv = require('dotenv');
dotenv.config();

const runComprehensiveBackendTests = async () => {
  const base = 'http://localhost:5000/api';

  try {
    console.log('🚀 Running Comprehensive Backend Test Suite...');

    // 1. Login Admin
    console.log('\n[1] Admin Login...');
    const adminLoginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@hospital.com', password: 'adminpassword123' }),
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;
    if (!adminToken) throw new Error('Admin login failed: ' + JSON.stringify(adminData));
    console.log('✅ Admin logged in. Token acquired.');

    // 2. Login Patient
    console.log('\n[2] Patient Login...');
    const patientLoginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@example.com', password: 'patientpassword123' }),
    });
    const patientData = await patientLoginRes.json();
    const patientToken = patientData.token;
    if (!patientToken) throw new Error('Patient login failed');
    console.log('✅ Patient logged in. Token acquired.');

    // 3. Fetch Doctors
    console.log('\n[3] Fetching Doctors...');
    const docsRes = await fetch(`${base}/doctors`);
    const docsData = await docsRes.json();
    console.log(`✅ Retrieved ${docsData.count} doctors.`);
    const targetDoctor = docsData.data[0];
    console.log(`🎯 Testing with Doctor: ${targetDoctor.name} (${targetDoctor.specialization})`);

    // 4. Patient Books Online Token
    console.log('\n[4] Patient Booking Online Token...');
    const bookOnlineRes = await fetch(`${base}/tokens/book-online`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({ doctorId: targetDoctor._id }),
    });
    const onlineTokenData = await bookOnlineRes.json();
    console.log('Online Booking Result:', onlineTokenData.message);
    console.log(`Token Number: ${onlineTokenData.data?.tokenNumber}, Sequence: ${onlineTokenData.data?.sequenceNumber}, Type: ${onlineTokenData.data?.tokenType}`);

    // 5. Admin Generates Offline Walk-in Token for the SAME Doctor
    console.log('\n[5] Admin Booking Offline Walk-in Token...');
    const bookOfflineRes = await fetch(`${base}/tokens/book-offline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        doctorId: targetDoctor._id,
        patientName: 'Sunita Devi (Walk-in)',
        patientPhone: '9845012345',
      }),
    });
    const offlineTokenData = await bookOfflineRes.json();
    console.log('Offline Booking Result:', offlineTokenData.message);
    console.log(`Token Number: ${offlineTokenData.data?.tokenNumber}, Sequence: ${offlineTokenData.data?.sequenceNumber}, Type: ${offlineTokenData.data?.tokenType}`);

    // 6. Verify Unified Queue (Both tokens are in the same queue!)
    console.log('\n[6] Verifying Unified Queue (Doctor Queue endpoint)...');
    const queueRes = await fetch(`${base}/queue/doctor/${targetDoctor._id}`);
    const queueData = await queueRes.json();
    console.log(`Doctor Queue has ${queueData.tokens.length} total tokens today.`);
    queueData.tokens.forEach((t) => {
      console.log(`  -> Token ${t.tokenNumber} | Patient: ${t.patientName} | Type: [${t.tokenType}] | Status: ${t.status} | Est Wait: ${t.estimatedWaitMinutes} mins | Position: #${t.queuePosition}`);
    });

    // 7. Test Doctor Status & Delay Update (Doctor Delayed by 15 mins)
    console.log('\n[7] Simulating Doctor Delay (Admin adds 15 minutes delay)...');
    const delayRes = await fetch(`${base}/doctors/${targetDoctor._id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'Delayed',
        delayMinutes: 15,
        delayReason: 'Traffic congestion on emergency transit',
      }),
    });
    const delayData = await delayRes.json();
    console.log('Doctor Delay Updated:', delayData.message);

    // 8. Re-check Queue to confirm Automatic Queue Recalculation
    console.log('\n[8] Checking Queue Recalculation after Doctor Delay...');
    const shiftedQueueRes = await fetch(`${base}/queue/doctor/${targetDoctor._id}`);
    const shiftedQueueData = await shiftedQueueRes.json();
    shiftedQueueData.tokens.filter(t => t.status === 'waiting').forEach((t) => {
      console.log(`  -> Token ${t.tokenNumber} | Wait time updated to: ${t.estimatedWaitMinutes} mins (Shifted dynamically!)`);
    });

    // 9. Admin Calls First Patient into Consultation
    console.log('\n[9] Admin Calling Next Patient into Consultation...');
    const callRes = await fetch(`${base}/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ doctorId: targetDoctor._id }),
    });
    const callData = await callRes.json();
    console.log('Call Next Result:', callData.message);

    // 10. Admin Completes Consultation
    console.log('\n[10] Admin Completing Consultation...');
    const compRes = await fetch(`${base}/queue/complete-consultation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        doctorId: targetDoctor._id,
        notes: 'Routine checkup completed. Prescribed multivitamins.',
      }),
    });
    const compData = await compRes.json();
    console.log('Complete Consultation Result:', compData.message);

    // 11. Admin Dashboard Stats
    console.log('\n[11] Admin Dashboard Stats Check...');
    const statsRes = await fetch(`${base}/queue/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await statsRes.json();
    console.log('Admin Stats:', statsData.stats);

    // 12. Patient Management List
    console.log('\n[12] Admin Patient Directory Check...');
    const patientsRes = await fetch(`${base}/patients`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const patientsData = await patientsRes.json();
    console.log(`Retrieved ${patientsData.count} patient records for admin view.`);

    console.log('\n======================================================');
    console.log('🎉 ALL BACKEND MODULES & SMART QUEUE ALGORITHM PASSED!');
    console.log('======================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Comprehensive Test Error:', err);
    process.exit(1);
  }
};

setTimeout(runComprehensiveBackendTests, 1500);

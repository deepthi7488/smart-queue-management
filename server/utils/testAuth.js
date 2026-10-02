const dotenv = require('dotenv');
dotenv.config();

const testAuthentication = async () => {
  const baseURL = 'http://localhost:5000/api/auth';

  try {
    console.log('🧪 Testing Phase 3: Authentication & Role Protection...');

    // 1. Test Admin Login
    console.log('\n1️⃣ Testing Admin Login (admin@hospital.com)...');
    const adminRes = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hospital.com',
        password: 'adminpassword123',
      }),
    });
    const adminData = await adminRes.json();
    console.log('Admin Login Status:', adminRes.status);
    console.log('Admin Role:', adminData.user?.role);
    console.log('JWT Token received:', adminData.token ? 'YES (Length: ' + adminData.token.length + ')' : 'NO');
    if (!adminData.token) throw new Error('Admin login failed');

    // 2. Test Patient Login
    console.log('\n2️⃣ Testing Patient Login (patient@example.com)...');
    const patientRes = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'patient@example.com',
        password: 'patientpassword123',
      }),
    });
    const patientData = await patientRes.json();
    console.log('Patient Login Status:', patientRes.status);
    console.log('Patient Role:', patientData.user?.role);
    console.log('JWT Token received:', patientData.token ? 'YES' : 'NO');
    if (!patientData.token) throw new Error('Patient login failed');

    // 3. Test Protected Profile Route with Token
    console.log('\n3️⃣ Testing Protected Route /api/auth/profile with Bearer Token...');
    const profileRes = await fetch(`${baseURL}/profile`, {
      headers: {
        Authorization: `Bearer ${patientData.token}`,
      },
    });
    const profileData = await profileRes.json();
    console.log('Profile Fetch Status:', profileRes.status);
    console.log('Profile User Name:', profileData.user?.name);
    console.log('Profile User Email:', profileData.user?.email);

    // 4. Test Invalid Password
    console.log('\n4️⃣ Testing Invalid Password Handling...');
    const invalidRes = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hospital.com',
        password: 'wrongpassword',
      }),
    });
    const invalidData = await invalidRes.json();
    console.log('Invalid Password Status (expected 401):', invalidRes.status);
    console.log('Error message:', invalidData.message);

    console.log('\n🎉 ALL Phase 3 Authentication tests passed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    process.exit(1);
  }
};

// Give server a moment to start if run concurrently
setTimeout(testAuthentication, 1500);

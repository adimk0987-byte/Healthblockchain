// HealthChain Console Tester
// Paste this entire script into browser console (F12) to test backend

console.log('====== HealthChain Backend Tester ======');
console.log('Run commands below:');
console.log('');

// Test 1: Send OTP
window.testSendOTP = async function() {
  const phone = '+919876543210';
  const name = 'Test User';
  console.log(`📱 Sending OTP to ${phone}...`);
  try {
    const response = await fetch('http://localhost:4000/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name })
    });
    const data = await response.json();
    console.log('✅ OTP sent!', data);
    window.lastOTP = data.otp;
    console.log(`📝 OTP Code: ${data.otp} (saved as window.lastOTP)`);
    return data;
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Test 2: Verify OTP
window.testVerifyOTP = async function(otp) {
  const phone = '+919876543210';
  const name = 'Test User';
  const otpCode = otp || window.lastOTP;
  if (!otpCode) {
    console.log('❌ No OTP provided. Run testSendOTP() first.');
    return;
  }
  console.log(`🔐 Verifying OTP: ${otpCode}...`);
  try {
    const response = await fetch('http://localhost:4000/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp: otpCode, name })
    });
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    console.log('✅ Logged in!', data.user);
    console.log(`🔑 JWT Token: ${data.token.substring(0, 50)}...`);
    return data;
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Test 3: Save Medical Record
window.testSaveRecord = async function() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.log('❌ Not logged in. Run testVerifyOTP() first.');
    return;
  }
  const record = {
    type: 'blood_test',
    date: new Date().toISOString(),
    results: { glucose: 95, hemoglobin: 13.5 }
  };
  console.log('💾 Saving record...', record);
  try {
    const response = await fetch('http://localhost:4000/patient/records/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ data: record })
    });
    const data = await response.json();
    console.log('✅ Record saved!', data.record);
    return data.record;
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Test 4: AI Diagnosis
window.testAIDiagnose = async function(symptoms) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.log('❌ Not logged in. Run testVerifyOTP() first.');
    return;
  }
  const symptomText = symptoms || 'fever and cough for 3 days';
  console.log(`🤖 AI Diagnosis for: "${symptomText}"...`);
  try {
    const response = await fetch('http://localhost:4000/ai/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ symptoms: symptomText })
    });
    const data = await response.json();
    console.log('✅ AI Result:', data.ai);
    console.log(`Severity: ${data.ai.severity} | Confidence: ${data.ai.confidence * 100}%`);
    console.log(`Suggestions: ${data.ai.suggestions.join(', ')}`);
    return data.ai;
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Test 5: Share Records
window.testShareRecord = async function(doctorPhone) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.log('❌ Not logged in. Run testVerifyOTP() first.');
    return;
  }
  const doctor = doctorPhone || '+919876543211';
  console.log(`👨‍⚕️ Sharing records with ${doctor}...`);
  try {
    const response = await fetch('http://localhost:4000/patient/records/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ doctorPhone: doctor, accessType: 'full', durationHours: 24 })
    });
    const data = await response.json();
    console.log('✅ Permission granted!', data.permission);
    return data.permission;
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Test 6: Emergency Details
window.testEmergency = async function() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.log('❌ Not logged in. Run testVerifyOTP() first.');
    return;
  }
  console.log('🚨 Fetching emergency details...');
  try {
    const response = await fetch('http://localhost:4000/emergency/details', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    console.log('✅ Emergency summary:', data.summary);
    return data.summary;
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Test 7: Find Hospitals
window.testHospitals = async function() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.log('❌ Not logged in. Run testVerifyOTP() first.');
    return;
  }
  console.log('🏥 Finding nearest hospitals...');
  try {
    const response = await fetch('http://localhost:4000/emergency/nearest-hospital', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    console.log('✅ Nearby hospitals:', data.hospitals);
    data.hospitals.forEach(h => {
      console.log(`  📍 ${h.name} - ${h.distance}km away (${h.beds} beds available)`);
    });
    return data.hospitals;
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Test 8: Get All Records
window.testGetRecords = async function() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.log('❌ Not logged in. Run testVerifyOTP() first.');
    return;
  }
  console.log('📋 Fetching all records...');
  try {
    const response = await fetch('http://localhost:4000/patient/records', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    console.log(`✅ Found ${data.records.length} records:`, data.records);
    return data.records;
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
};

// Test 9: Backend Health
window.testHealth = async function() {
  console.log('🏥 Checking backend health...');
  try {
    const response = await fetch('http://localhost:4000/health');
    const data = await response.json();
    console.log('✅ Backend is alive!', data);
    return data;
  } catch (err) {
    console.error('❌ Backend is DOWN:', err.message);
  }
};

// Print menu
console.log('');
console.log('════════════════════════════════════════');
console.log('📝 QUICK TEST COMMANDS:');
console.log('════════════════════════════════════════');
console.log('');
console.log('1️⃣  testHealth()                    - Check backend');
console.log('2️⃣  testSendOTP()                   - Send OTP to phone');
console.log('3️⃣  testVerifyOTP()                 - Verify OTP & login');
console.log('4️⃣  testSaveRecord()                - Save medical record');
console.log('5️⃣  testAIDiagnose()                - AI diagnosis');
console.log('6️⃣  testShareRecord()               - Share with doctor');
console.log('7️⃣  testGetRecords()                - List all records');
console.log('8️⃣  testEmergency()                 - Emergency details');
console.log('9️⃣  testHospitals()                 - Find hospitals');
console.log('');
console.log('════════════════════════════════════════');
console.log('⚡ QUICK START FLOW:');
console.log('════════════════════════════════════════');
console.log('');
console.log('await testHealth()');
console.log('await testSendOTP()');
console.log('await testVerifyOTP()      // Use OTP from above');
console.log('await testAIDiagnose("fever and cough")');
console.log('await testSaveRecord()');
console.log('await testHospitals()');
console.log('');

# Frontend ↔ Backend Integration Guide

## Quick Start

The frontend (`app.js`) currently uses **localStorage simulation**. To connect it to the **live backend API** (running on `http://localhost:4000`), follow these steps:

---

## Step 1: Update `app.js` - Add API Base URL

At the top of `app.js`, add:

```javascript
// API Configuration
const API_BASE_URL = 'http://localhost:4000';
const BACKEND_ENABLED = true;

async function apiCall(endpoint, method = 'GET', data = null, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    method,
    headers,
    body: data ? JSON.stringify(data) : null
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}
```

---

## Step 2: Replace OTP Login Flow

**Old (localStorage-only):**
```javascript
function simulateOTPLogin() {
  // ... stored in localStorage
}
```

**New (Backend API):**
```javascript
async function sendOTPToBackend() {
  try {
    const phone = document.getElementById('phoneInput').value;
    const result = await apiCall('/auth/send-otp', 'POST', { phone, name: 'User' });
    console.log('OTP sent:', result.otp); // For demo, backend returns OTP
    alert(`OTP sent to ${phone}. Check console.`);
    return result.otp;
  } catch (err) {
    alert('Failed to send OTP: ' + err.message);
  }
}

async function verifyOTPWithBackend() {
  try {
    const phone = document.getElementById('phoneInput').value;
    const otp = prompt('Enter OTP:');
    const result = await apiCall('/auth/verify-otp', 'POST', { phone, otp });
    
    // Save token to localStorage
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('userData', JSON.stringify(result.user));
    
    console.log('Logged in:', result.user);
    navigateTo('dashboard');
  } catch (err) {
    alert('Invalid OTP: ' + err.message);
  }
}
```

---

## Step 3: Replace Record Operations

**Old (localStorage only):**
```javascript
async function saveRecordToBlockchain(medicalRecord) {
  // Saved to localStorage['healthchain_records']
}
```

**New (Backend + localStorage backup):**
```javascript
async function saveRecordToBackend(medicalRecord) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('Not authenticated. Saving to localStorage only.');
      return saveRecordToBlockchain(medicalRecord); // Fallback
    }

    const response = await apiCall('/patient/records/add', 'POST', { data: medicalRecord }, token);
    console.log('Record saved to backend:', response.record);
    
    // Also save locally for offline access
    medicalRecordsOnChain.push(response.record);
    localStorage.setItem('healthchain_records', JSON.stringify(medicalRecordsOnChain));
    
    return response.record;
  } catch (err) {
    console.error('Backend save failed, using localStorage:', err);
    return saveRecordToBlockchain(medicalRecord);
  }
}
```

---

## Step 4: Replace AI Diagnosis

**Old (simulated in frontend):**
```javascript
function generateMockDiagnosis() {
  // Heuristic-based simulation
}
```

**New (Backend AI):**
```javascript
async function callBackendAIDiagnosis(symptoms) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('Not authenticated');

    const response = await apiCall('/ai/diagnose', 'POST', { symptoms }, token);
    console.log('AI Response:', response.ai);
    return response.ai;
  } catch (err) {
    console.error('AI endpoint failed, using local simulation:', err);
    return generateMockDiagnosis(); // Fallback to local
  }
}

// Usage in diagnosis form submit:
document.getElementById('diagnosisForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const symptoms = document.getElementById('symptomsInput').value;
  const diagnosis = await callBackendAIDiagnosis(symptoms);
  displayAIResults(diagnosis);
});
```

---

## Step 5: Replace Permissions & Sharing

**Old (localStorage):**
```javascript
async function grantAccessPermission(doctorAddress, accessType, durationHours) {
  // Created in accessPermissions[] and localStorage
}
```

**New (Backend):**
```javascript
async function shareRecordWithDoctor() {
  try {
    const token = localStorage.getItem('authToken');
    const doctorPhone = prompt('Enter doctor phone:');
    const accessType = 'full'; // or 'recent', 'specific', 'labs'
    const durationHours = 24;

    const response = await apiCall('/patient/records/share', 'POST', {
      doctorPhone,
      accessType,
      durationHours
    }, token);

    console.log('Permission granted:', response.permission);
    alert(`Shared records with ${doctorPhone} for ${durationHours} hours`);
  } catch (err) {
    alert('Failed to share: ' + err.message);
  }
}
```

---

## Step 6: Replace Blockchain Hash Operations

**Old (frontend hashing):**
```javascript
async function saveRecordToBlockchain() {
  const hash = await hashRecord(data); // Frontend SHA-256
}
```

**New (Backend verification):**
```javascript
async function verifyRecordIntegrityWithBackend(payload, expectedHash) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await apiCall('/blockchain/verify', 'POST', {
      payload,
      expectedHash
    }, token);

    if (response.ok) {
      console.log('✅ Record verified on blockchain');
    } else {
      console.warn('❌ Hash mismatch! Expected:', expectedHash, 'Actual:', response.actual);
    }
    return response.ok;
  } catch (err) {
    console.error('Backend verification failed:', err);
  }
}
```

---

## Step 7: Replace Emergency Operations

**Old (localStorage):**
```javascript
async function activateEmergencyBlockchain() {
  // Stored in emergencyActivations[]
}
```

**New (Backend):**
```javascript
async function activateEmergencyWithBackend() {
  try {
    const token = localStorage.getItem('authToken');
    
    // Get emergency details
    const detailsRes = await apiCall('/emergency/details', 'GET', null, token);
    console.log('Emergency summary:', detailsRes.summary);

    // Find nearest hospital
    const hospitalsRes = await apiCall('/emergency/nearest-hospital', 'GET', null, token);
    console.log('Nearby hospitals:', hospitalsRes.hospitals);

    // Auto-share with emergency contacts
    const shareRes = await apiCall('/emergency/auto-share', 'POST', {
      recipients: detailsRes.summary.emergencyContact ? [detailsRes.summary.emergencyContact.phone] : []
    }, token);

    console.log('✅ Emergency activated and shared');
    displayEmergencyUI(detailsRes.summary, hospitalsRes.hospitals);
  } catch (err) {
    alert('Emergency activation failed: ' + err.message);
  }
}
```

---

## Step 8: Network Fallback Strategy

Wrap all API calls with a fallback to localStorage/offline mode:

```javascript
async function withOfflineFallback(apiCall, fallbackFn) {
  try {
    return await apiCall();
  } catch (err) {
    console.warn('API failed, using offline mode:', err);
    if (fallbackFn) return fallbackFn();
    throw err;
  }
}

// Usage:
const result = await withOfflineFallback(
  () => callBackendAIDiagnosis(symptoms),
  () => generateMockDiagnosis()
);
```

---

## Testing Checklist

- [ ] Can log in with OTP (phone + OTP from console)
- [ ] JWT token stored in localStorage after login
- [ ] Can add medical records (saved to both backend + localStorage)
- [ ] Can share records with doctor (permission created)
- [ ] AI diagnosis works (backend endpoint called)
- [ ] Emergency details fetch from backend
- [ ] Blockchain hash verification works
- [ ] Offline fallback activates when backend is down

---

## API Endpoints Quick Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/send-otp` | POST | ❌ | Send OTP to phone |
| `/auth/verify-otp` | POST | ❌ | Verify OTP, get JWT |
| `/patient/profile` | GET | ✅ | Get user profile |
| `/patient/records` | GET | ✅ | Fetch all records |
| `/patient/records/add` | POST | ✅ | Save new record |
| `/patient/records/share` | POST | ✅ | Share with doctor |
| `/patient/permissions` | GET | ✅ | List active permissions |
| `/ai/diagnose` | POST | ✅ | AI diagnosis |
| `/blockchain/hash` | POST | ✅ | Generate hash |
| `/blockchain/verify` | POST | ✅ | Verify hash |
| `/emergency/details` | GET | ✅ | Emergency summary |
| `/emergency/nearest-hospital` | GET | ✅ | Find hospitals |
| `/admin/analytics` | GET | ✅ | Get analytics |

---

## Example: Minimal Integration

If you want a **minimal working example**, add this to the end of `app.js`:

```javascript
// Minimal Backend Integration
if (BACKEND_ENABLED) {
  // Override key functions to use backend
  window.sendOTPToBackend = sendOTPToBackend;
  window.verifyOTPWithBackend = verifyOTPWithBackend;
  window.saveRecordToBackend = saveRecordToBackend;
  window.callBackendAIDiagnosis = callBackendAIDiagnosis;
  
  // Update buttons in index.html:
  // <button onclick="sendOTPToBackend()">Send OTP</button>
  // <button onclick="verifyOTPWithBackend()">Verify OTP</button>
}
```

Then update `index.html` buttons to call the new functions:

```html
<button onclick="sendOTPToBackend()">Send OTP</button>
<button onclick="verifyOTPWithBackend()">Verify OTP</button>
```

---

That's it! Your frontend will now be **fully integrated** with the backend API while maintaining **offline fallback** support.


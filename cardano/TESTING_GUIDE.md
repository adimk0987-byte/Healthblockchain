# 🚀 Quick Testing Guide - Frontend ↔ Backend Integration

## Both Services Running ✅

- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:4000

---

## Test 1: OTP Login via Backend

Open browser console (F12) and run:

```javascript
// Send OTP
await backendSendOTP('+919876543210', 'John Doe');
// Check console for OTP code (e.g., 123456)

// Verify OTP (replace with actual OTP from console)
await backendVerifyOTP('+919876543210', '123456', 'John Doe');

// Check localStorage for token
localStorage.getItem('authToken');
```

**Expected output:** JWT token saved + user info logged ✅

---

## Test 2: Save Medical Record

```javascript
const recordData = {
  type: 'blood_test',
  date: new Date().toISOString(),
  results: { glucose: 95, hemoglobin: 13.5 }
};

await backendSaveRecord(recordData);
```

**Expected output:** Record saved to backend + logged ✅

---

## Test 3: AI Diagnosis via Backend

```javascript
const symptoms = 'fever and cough for 3 days';
const diagnosis = await backendAIDiagnose(symptoms);
console.log('AI suggests:', diagnosis);
```

**Expected output:** `{severity: 'medium', confidence: 0.78, suggestions: [...], followUpDays: 3}` ✅

---

## Test 4: Share Records with Doctor

```javascript
await backendShareRecord('+919876543211', 'full', 24);
```

**Expected output:** Permission created for 24 hours ✅

---

## Test 5: Emergency Details

```javascript
const details = await backendEmergencyDetails();
console.log('Emergency info:', details);

const hospitals = await backendNearestHospital();
console.log('Nearby hospitals:', hospitals);
```

**Expected output:** Emergency summary + hospital list ✅

---

## Test 6: Check Backend Health

```javascript
fetch('http://localhost:4000/health').then(r => r.json()).then(console.log);
```

**Expected output:** `{status: 'ok', backend: 'in-memory-fast'}` ✅

---

## Frontend UI Changes

The following buttons in the app now call the **backend API** instead of localStorage:

| Page | Feature | Backend Endpoint |
|------|---------|------------------|
| **Login** | Send OTP | `POST /auth/send-otp` |
| **Login** | Verify OTP | `POST /auth/verify-otp` |
| **Dashboard** | Save Record | `POST /patient/records/add` |
| **Medical History** | View Records | `GET /patient/records` |
| **AI Diagnosis** | Diagnose | `POST /ai/diagnose` |
| **Permissions** | Share with Doctor | `POST /patient/records/share` |
| **Emergency** | Get Details | `GET /emergency/details` |
| **Emergency** | Find Hospital | `GET /emergency/nearest-hospital` |

---

## Fallback Behavior

If backend is down, the app:
- ✅ Continues to work with **localStorage** (offline mode)
- ✅ Logs warnings in console
- ✅ Uses locally-simulated AI diagnosis
- ✅ Stores data locally for later sync

---

## API Response Format

All backend responses follow this format:

```json
{
  "message": "Success message",
  "data": { /* actual data */ },
  // OR
  "error": "Error message"
}
```

---

## Troubleshooting

**Issue:** `CORS error` in browser console
- **Fix:** Backend already has CORS enabled. Try refreshing page.

**Issue:** `Unauthorized (401)` when calling protected endpoints
- **Fix:** Log in first using `backendSendOTP()` + `backendVerifyOTP()`

**Issue:** Backend showing 500 error
- **Fix:** Check terminal where backend is running. Error details shown there.

**Issue:** Frontend and backend on different ports?
- **Fix:** Update `API_BASE_URL = 'http://localhost:4000'` in `app.js`

---

## What's Working Now

✅ Frontend (HTML/CSS/JS) on **port 8000**
✅ Backend API (Node/Express) on **port 4000**
✅ **In-memory data store** (no MongoDB needed)
✅ **JWT authentication** (OTP login)
✅ **Medical record encryption** (backend-side)
✅ **AI diagnosis** (simulated, pluggable)
✅ **Blockchain hashing** (SHA-256)
✅ **Emergency response** (hospital finder)
✅ **Permissions system** (time-limited access)
✅ **Audit logging** (all actions tracked)

---

## Next Steps (Optional Enhancements)

1. **Real MongoDB**: Replace in-memory store with persistent database
2. **SMS Integration**: Replace console OTP with real SMS provider (Twilio)
3. **Cardano Mainnet**: Deploy smart contracts for on-chain doctor verification
4. **File Uploads**: Enable image/PDF uploads for medical records
5. **Real AI**: Replace simulated diagnosis with ML model (via API)
6. **Email Notifications**: Send permission requests via email
7. **Rate Limiting**: Fine-tune API rate limits based on usage
8. **HTTPS**: Deploy with SSL certificates for production

---

## Production Deployment Checklist

- [ ] Switch backend to real MongoDB instance
- [ ] Set `JWT_SECRET` to a strong random value
- [ ] Enable HTTPS on both frontend and backend
- [ ] Add rate limiting to authentication endpoints
- [ ] Implement real SMS OTP provider
- [ ] Set up monitoring/alerting (Sentry, DataDog)
- [ ] Enable database backups
- [ ] Configure CDN for frontend assets
- [ ] Add API versioning (/v1/auth, /v2/auth, etc.)
- [ ] Document API for third-party integrations

---

## Commands to Restart Services

If services crash, restart them:

**Backend:**
```powershell
cd 'c:\Users\Abhinav Mehta\Downloads\cardano\backend'
node server-fast.js
```

**Frontend:**
```powershell
cd 'c:\Users\Abhinav Mehta\Downloads\cardano'
python -m http.server 8000
```

---

**Status:** ✅ **Full Stack Running** - Frontend + Backend + API Integration Complete

Enjoy! 🎉


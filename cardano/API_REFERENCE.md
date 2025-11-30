# HealthChain ID - Quick API Reference

## 🔐 Wallet & Encryption Functions

### Connect Wallet
```javascript
// Auto-detect Cardano wallet
detectCardanoWallet()

// Connect to wallet (Nami, Flint, Gero)
await connectCardanoWallet(walletName = 'nami')
```

### Encryption
```javascript
// Generate encryption keys from wallet
await generateEncryptionKeys()

// Encrypt medical data (AES-256-GCM)
const encrypted = await encryptMedicalData(medicalRecord)

// Decrypt medical data
const decrypted = await decryptMedicalData(encryptedRecord)

// Save to blockchain
await saveRecordToBlockchain(medicalRecord)

// Save diagnosis specifically
await saveDiagnosisToBlockchain()
```

---

## 🏥 Medical Record Functions

### AI Diagnosis
```javascript
// Generate diagnosis with severity
const diagnosis = generateMockDiagnosis()
// Returns: {severity, condition, recommendations, emergencyFlag, etc.}

// Display results with styling
displayAIResults(diagnosis)

// Get severity badge HTML
getSeverityBadge(severity, score)

// Get color for severity
getSeverityColor(severity) // 'low'|'medium'|'high'
```

### Medical Records
```javascript
// Get all records
medicalRecordsOnChain[]

// Group records by type
groupRecordsByType() // {type: count, ...}

// Get hospital stats
getHospitalDashboardStats()

// Get patient analytics
getPatientAnalytics()
```

---

## 👨‍⚕️ Doctor Verification Functions

```javascript
// Request doctor verification
await requestDoctorVerification(doctorName, hospitalName, specialization)

// Approve doctor access
await approveDoctorAccess(verificationId, doctorWalletAddress)

// Get approved doctors
getApprovedDoctors() // Returns array of verified doctors

// List pending verifications
doctorVerifications[]
```

---

## 🔒 Permission & Access Functions

### Grant/Revoke Access
```javascript
// Grant access with time limit
await grantAccessPermission(
  doctorAddress, 
  accessType,     // 'full'|'recent'|'specific'|'labs'
  durationHours   // 6, 24, 168, custom
)

// Revoke access
await revokeAccessPermission(permissionId)

// Get active permissions
getActivePermissions()
  // Only returns non-expired, active permissions

// Get access audit log
getAccessAuditLog()
  // Sorted by timestamp (newest first)
```

### Audit Logging
```javascript
// Access audit log array
accessAuditLog[]

// Each entry contains:
{
  event: 'permission_granted|permission_revoked|emergency_activated',
  permissionId: '...',
  timestamp: 'ISO_8601'
}
```

---

## 🚨 Emergency Functions

```javascript
// Activate emergency with blockchain record
async activateEmergency()

// Blockchain emergency activation
async activateEmergencyBlockchain()

// Generate medical summary for emergency
async generateEmergencySummary()

// Get nearby hospitals
getNearbyHospitals()
// Returns: [{name, distance, beds, phone, eta}, ...]

// Emergency activations list
emergencyActivations[]
```

---

## 📱 QR/NFC Functions

### QR Scanner
```javascript
// Initialize camera for QR scanning
async initializeQRScanner()

// Start QR detection
startQRDetection(video)

// Simulate QR read (demo)
await simulateQRCodeRead()
```

### NFC Integration
```javascript
// Real NFC reading with fallback
async enhancedNFCRead()

// Process NFC data
processNFCData(nfcData)

// Simulate NFC scan
simulateNFCScan()
```

---

## ⛓️ Blockchain Functions

### Hashing & Verification
```javascript
// SHA-256 hash a record
hash = await hashRecord(data)

// Verify record integrity
const isValid = await verifyRecordIntegrity(record)
```

### Cardano Metadata
```javascript
// Convert to Cardano metadata format (CIP-25)
metadata = await convertToCardanoMetadata(medicalRecord)

// Submit to Cardano blockchain
const result = await submitRecordToCardano(medicalRecord)
```

---

## 📊 Hospital Admin Functions

```javascript
// Get dashboard statistics
stats = getHospitalDashboardStats()
// Returns: {totalPatients, activeAdmissions, emergencyAlerts, ...}

// Get patient analytics
analytics = getPatientAnalytics()
// Returns: {totalRecords, recordsByType, topDiseases, ...}

// Group records by type
groupRecordsByType()

// Average severity calculation
calculateAverageSeverity()

// Top diseases report
getTopDiseases()

// Record timeline data
getRecordTimeline()
```

---

## 🌍 Multi-Language Functions

```javascript
// Set language
setLanguage(lang) // 'en'|'hi'|'kn'|'bn'

// Access translations
translations[currentLanguage].key

// Example:
alert(translations[currentLanguage].welcomeBack)
```

---

## 🎨 UI Functions

```javascript
// Navigate between pages
navigateTo(pageName)
// Pages: 'home', 'scan', 'login', 'dashboard', 'medicalHistory', 
//        'aiDiagnosis', 'emergency', 'privacy', 'doctorDashboard', 
//        'adminDashboard', 'doctors'

// Show notification
showNotification(message, type = 'success')

// Toggle dark mode
toggleDarkMode()

// Set theme
setTheme(theme) // 'light'|'dark'
```

---

## 💾 Local Storage Keys

```javascript
// Language & theme
localStorage.getItem('healthchain_language')
localStorage.getItem('healthchain_theme')

// User data
localStorage.getItem('healthchain_user')
localStorage.getItem('healthchain_encryption_keys')

// Records & permissions
localStorage.getItem('healthchain_records')
localStorage.getItem('healthchain_permissions')
localStorage.getItem('healthchain_audit_log')

// Doctor verification
localStorage.getItem('healthchain_doctor_verify')

// Emergencies
localStorage.getItem('healthchain_emergencies')
```

---

## 🔄 Data Flow Example

```javascript
// 1. User connects wallet
await connectCardanoWallet('nami')

// 2. Generate encryption keys
await generateEncryptionKeys()

// 3. User analyzes symptoms
analyzeSymptoms()

// 4. AI generates diagnosis
const diagnosis = generateMockDiagnosis()

// 5. Display results
displayAIResults(diagnosis)

// 6. Save to blockchain
await saveDiagnosisToBlockchain()

// 7. Grant doctor access
await grantAccessPermission(doctorAddress, 'full', 24)

// 8. Doctor can decrypt and view
const decrypted = await decryptMedicalData(encryptedRecord)

// 9. Emergency? Activate blockchain
if (diagnosis.emergencyFlag) {
  await activateEmergency()
}
```

---

## 📋 Common Translations

```javascript
// Doctor Verification
translations[lang].doctorVerificationTitle
translations[lang].requestDoctorAccess
translations[lang].approveDoctor

// Permissions
translations[lang].permissionTitle
translations[lang].grantNewAccess
translations[lang].accessType
translations[lang].activeAccessList

// Emergency
translations[lang].emergencyBlockchainTitle
translations[lang].nearestHospitals
translations[lang].emergencyContact

// Wallet
translations[lang].connectWallet
translations[lang].walletConnected
translations[lang].encryptionActive

// AI Diagnosis
translations[lang].diagnosisConfidence
translations[lang].diagnosisCode
translations[lang].saveDiagnosisBC

// Admin
translations[lang].adminStatsTitle
translations[lang].adminDashboardTitle
```

---

## 🧪 Testing Commands

```javascript
// Test in browser console

// 1. Check wallet
console.log(cardanoWallet)
console.log(walletAddress)

// 2. Check records
console.log(medicalRecordsOnChain)

// 3. Check permissions
console.log(accessPermissions)
console.log(getActivePermissions())

// 4. Check audit log
console.log(accessAuditLog)

// 5. Test encryption
const test = await encryptMedicalData({test: 'data'})
console.log(test)

// 6. Hospital stats
console.log(getHospitalDashboardStats())

// 7. Check doctor verifications
console.log(doctorVerifications)
```

---

## 🚀 Production Checklist

- [ ] Replace `simulateQRCodeRead()` with actual QR library
- [ ] Replace `simulateNFCScan()` with real NFC implementation
- [ ] Deploy smart contracts for permissions
- [ ] Connect to Cardano testnet
- [ ] Test wallet integration with real Nami wallet
- [ ] Set up backend API
- [ ] Configure IPFS for large files
- [ ] Test emergency response flow
- [ ] Verify encryption/decryption cycle
- [ ] Load test with 1000+ records
- [ ] Security audit
- [ ] Mainnet deployment


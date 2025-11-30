// HealthChain ID - Main Application Logic with Cardano Wallet
// ==================================================

// ============ BACKEND API INTEGRATION ============
const API_BASE_URL = 'http://localhost:4000';
const BACKEND_ENABLED = true;

async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const options = { method, headers, body: data ? JSON.stringify(data) : null };
        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        console.error(`API ${method} ${endpoint}:`, err.message);
        throw err;
    }
}

// Backend OTP Login
async function backendSendOTP(phone, name) {
    try {
        const result = await apiCall('/auth/send-otp', 'POST', { phone, name });
        console.log('✅ OTP sent to', phone, '| Demo OTP:', result.otp);
        alert(`OTP sent! (Demo: ${result.otp})`);
        return result;
    } catch (err) {
        alert('❌ OTP failed: ' + err.message);
    }
}

async function backendVerifyOTP(phone, otp, name) {
    try {
        const result = await apiCall('/auth/verify-otp', 'POST', { phone, otp, name });
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('userData', JSON.stringify(result.user));
        currentUser = result.user;
        console.log('✅ Logged in:', result.user);
        return result;
    } catch (err) {
        alert('❌ Verification failed: ' + err.message);
        throw err;
    }
}

// Backend Record & AI Functions
async function backendSaveRecord(data) {
    try {
        const result = await apiCall('/patient/records/add', 'POST', { data });
        console.log('✅ Record saved to backend');
        return result.record;
    } catch (err) {
        console.warn('⚠️ Backend save failed:', err.message);
        return null;
    }
}

async function backendAIDiagnose(symptoms) {
    try {
        const result = await apiCall('/ai/diagnose', 'POST', { symptoms });
        return result.ai;
    } catch (err) {
        console.warn('⚠️ Backend AI failed, using local:', err.message);
        return null;
    }
}

async function backendShareRecord(doctorPhone, accessType, durationHours) {
    try {
        const result = await apiCall('/patient/records/share', 'POST', { doctorPhone, accessType, durationHours });
        console.log('✅ Permission granted');
        return result.permission;
    } catch (err) {
        alert('❌ Share failed: ' + err.message);
    }
}

async function backendEmergencyDetails() {
    try {
        return (await apiCall('/emergency/details', 'GET')).summary;
    } catch (err) {
        console.warn('⚠️ Emergency details failed:', err.message);
        return null;
    }
}

async function backendNearestHospital() {
    try {
        return (await apiCall('/emergency/nearest-hospital', 'GET')).hospitals;
    } catch (err) {
        console.warn('⚠️ Hospital search failed:', err.message);
        return [];
    }
}

// Global State
let currentLanguage = 'en';
let currentTheme = 'light';
let currentUser = null;
let currentPage = 'home';
let cardanoWallet = null;
let walletAddress = null;
let encryptionKeys = null;
let medicalRecordsOnChain = [];
let accessPermissions = [];
let doctorVerifications = [];
let accessAuditLog = [];

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkOnlineStatus();
    detectCardanoWallet();
});

// ==================================================
// CARDANO WALLET INTEGRATION
// ==================================================

async function detectCardanoWallet() {
    // Check if Cardano wallet extensions are available
    if (window.cardano !== undefined) {
        try {
            // List available wallets (Nami, Flint, GeroWallet, etc.)
            const walletList = Object.keys(window.cardano);
            console.log('Available Cardano wallets:', walletList);

            // Store wallet interface
            cardanoWallet = window.cardano;

            // Show wallet connection button
            const walletBtn = document.getElementById('connectWalletBtn');
            if (walletBtn) {
                walletBtn.classList.remove('hidden');
            }
        } catch (error) {
            console.log('Cardano wallet not detected. Install a Cardano wallet extension.');
        }
    }
}

async function connectCardanoWallet(walletName = 'nami') {
    try {
        if (!window.cardano || !window.cardano[walletName]) {
            alert('Please install a Cardano wallet extension (Nami, Flint, etc.)');
            return;
        }

        // Enable wallet
        const wallet = window.cardano[walletName];
        const enable = await wallet.enable();

        // Get wallet address
        const addresses = await enable.getAddresses();
        walletAddress = addresses[0]; // Use first address

        // Generate encryption key pair from wallet
        await generateEncryptionKeys();

        // Update UI
        showWalletConnected();
        showNotification('✅ Cardano wallet connected successfully!', 'success');

        return true;
    } catch (error) {
        console.error('Wallet connection error:', error);
        showNotification('❌ Failed to connect wallet. ' + error.message, 'error');
        return false;
    }
}

async function generateEncryptionKeys() {
    try {
        // Generate encryption key pair using wallet data
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(walletAddress),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        // Generate AES key for encryption
        const encryptionKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: new Uint8Array(16),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        encryptionKeys = {
            key: encryptionKey,
            walletAddress: walletAddress,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('healthchain_encryption_keys', JSON.stringify({
            walletAddress: walletAddress,
            createdAt: encryptionKeys.createdAt
        }));

        return encryptionKeys;
    } catch (error) {
        console.error('Key generation error:', error);
        throw error;
    }
}

function showWalletConnected() {
    const walletStatus = document.getElementById('walletStatus');
    const connectBtn = document.getElementById('connectWalletBtn');

    if (walletStatus) {
        const shortAddress = walletAddress.substring(0, 15) + '...' + walletAddress.substring(walletAddress.length - 10);
        walletStatus.innerHTML = `
            <div style="padding: 1rem; background: rgba(6, 179, 128, 0.1); border-radius: 8px; border-left: 4px solid #06B380;">
                <strong>🔐 Wallet Connected</strong><br>
                <small>${shortAddress}</small>
            </div>
        `;
        walletStatus.classList.remove('hidden');
    }

    if (connectBtn) {
        connectBtn.textContent = '✓ Wallet Connected';
        connectBtn.disabled = true;
    }
}

// ==================================================
// ENCRYPTION UTILITIES
// ==================================================

async function encryptMedicalData(data) {
    if (!encryptionKeys) {
        throw new Error('Encryption keys not initialized. Connect wallet first.');
    }

    try {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(JSON.stringify(data));

        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            encryptionKeys.key,
            encodedData
        );

        // Return encrypted data with IV
        return {
            encrypted: Array.from(new Uint8Array(encryptedData)),
            iv: Array.from(iv),
            timestamp: new Date().toISOString(),
            walletAddress: walletAddress
        };
    } catch (error) {
        console.error('Encryption error:', error);
        throw error;
    }
}

async function decryptMedicalData(encryptedRecord) {
    if (!encryptionKeys) {
        throw new Error('Encryption keys not initialized.');
    }

    try {
        const iv = new Uint8Array(encryptedRecord.iv);
        const encryptedArray = new Uint8Array(encryptedRecord.encrypted);

        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            encryptionKeys.key,
            encryptedArray
        );

        return JSON.parse(new TextDecoder().decode(decryptedData));
    } catch (error) {
        console.error('Decryption error:', error);
        throw error;
    }
}

// ==================================================
// BLOCKCHAIN OPERATIONS
// ==================================================

async function saveRecordToBlockchain(medicalRecord) {
    if (!walletAddress) {
        showNotification('❌ Please connect your Cardano wallet first', 'error');
        return false;
    }

    try {
        // Encrypt the medical data
        const encryptedRecord = await encryptMedicalData(medicalRecord);

        // Create record object
        const blockchainRecord = {
            id: 'record_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: medicalRecord.type || 'medical_record',
            encryptedData: encryptedRecord,
            hash: await hashRecord(encryptedRecord),
            timestamp: new Date().toISOString(),
            walletAddress: walletAddress
        };

        // In production, this would be submitted to Cardano blockchain
        // For demo, store in indexed DB and local storage
        medicalRecordsOnChain.push(blockchainRecord);
        localStorage.setItem('healthchain_records', JSON.stringify(medicalRecordsOnChain));

        console.log('Record saved to blockchain:', blockchainRecord);
        showNotification('✅ Medical record encrypted and saved securely on blockchain!', 'success');

        return blockchainRecord;
    } catch (error) {
        console.error('Blockchain save error:', error);
        showNotification('❌ Failed to save record: ' + error.message, 'error');
        return false;
    }
}

async function saveDiagnosisToBlockchain() {
    const symptomsText = document.getElementById('symptomsText')?.value || 'AI Diagnosis Report';

    try {
        await saveRecordToBlockchain({
            type: 'ai_diagnosis_report',
            symptoms: symptomsText,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to save diagnosis:', error);
    }
}

async function hashRecord(data) {
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyRecordIntegrity(record) {
    try {
        const currentHash = await hashRecord(record.encryptedData);
        return currentHash === record.hash;
    } catch (error) {
        console.error('Verification error:', error);
        return false;
    }
}

// ==================================================
// INITIALIZATION
// ==================================================

function initializeApp() {
    // Load saved preferences
    const savedLang = localStorage.getItem('healthchain_language') || 'en';
    const savedTheme = localStorage.getItem('healthchain_theme') || 'light';
    const savedUser = localStorage.getItem('healthchain_user');
    const savedRecords = localStorage.getItem('healthchain_records');
    const savedPermissions = localStorage.getItem('healthchain_permissions');
    const savedDoctorVerify = localStorage.getItem('healthchain_doctor_verify');
    const savedAuditLog = localStorage.getItem('healthchain_audit_log');

    currentLanguage = savedLang;
    currentTheme = savedTheme;

    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showQuickEmergencyButton();
    }

    if (savedRecords) {
        medicalRecordsOnChain = JSON.parse(savedRecords);
    }

    if (savedPermissions) {
        accessPermissions = JSON.parse(savedPermissions);
    }

    if (savedDoctorVerify) {
        doctorVerifications = JSON.parse(savedDoctorVerify);
    }

    if (savedAuditLog) {
        accessAuditLog = JSON.parse(savedAuditLog);
    }

    // Apply language and theme
    setLanguage(currentLanguage);
    setTheme(currentTheme);

    // Set language selector
    document.getElementById('languageSelect').value = currentLanguage;
}

// ==================================================
// NAVIGATION
// ==================================================

function navigateTo(pageName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    let targetPage;
    switch (pageName) {
        case 'home':
            targetPage = 'homePage';
            break;
        case 'scan':
        case 'login':
            targetPage = 'scanLoginPage';
            break;
        case 'dashboard':
            targetPage = 'dashboardPage';
            break;
        case 'medicalHistory':
            targetPage = 'medicalHistoryPage';
            break;
        case 'aiDiagnosis':
            targetPage = 'aiDiagnosisPage';
            break;
        case 'emergency':
            targetPage = 'emergencyPage';
            break;
        case 'privacy':
            targetPage = 'privacyPage';
            break;
        case 'aiReportAnalyzer':
            targetPage = 'aiReportAnalyzerPage';
            if (typeof initAIReportAnalyzer === 'function') {
                initAIReportAnalyzer();
            }
            break;
        case 'doctorDashboard':
            targetPage = 'doctorDashboardPage';
            break;
        case 'adminDashboard':
            targetPage = 'adminDashboardPage';
            break;
        case 'doctors':
            targetPage = 'doctorsPage';
            break;
        default:
            targetPage = 'homePage';
    }

    document.getElementById(targetPage).classList.add('active');
    currentPage = pageName;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================================================
// MULTI-LANGUAGE SUPPORT
// ==================================================

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('healthchain_language', lang);

    // Update all translatable elements
    if (typeof translations !== 'undefined' && translations[lang]) {
        const t = translations[lang];

        // Update all elements with IDs that match translation keys
        Object.keys(t).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = t[key];
                } else {
                    element.textContent = t[key];
                }
            }
        });
    }

    // Update HTML lang attribute
    document.documentElement.lang = lang;
}

// ==================================================
// DARK MODE
// ==================================================

function toggleDarkMode() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('healthchain_theme', theme);

    // Update dark mode icon
    const icon = document.getElementById('darkModeIcon');
    if (icon) {
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// ==================================================
// AUTHENTICATION & LOGIN
// ==================================================

function simulateNFCScan() {
    const scannerUI = document.getElementById('scannerUI');
    scannerUI.classList.remove('hidden');

    // Simulate scanning delay
    setTimeout(() => {
        // Auto-login as patient
        loginAs('patient', 'Ramesh');
        scannerUI.classList.add('hidden');
    }, 2000);
}

function simulateQRScan() {
    const scannerUI = document.getElementById('scannerUI');
    scannerUI.classList.remove('hidden');

    // Simulate scanning delay
    setTimeout(() => {
        loginAs('patient', 'Ramesh');
        scannerUI.classList.add('hidden');
    }, 2000);
}

function sendOTP() {
    const phoneInput = document.getElementById('phoneInput');
    const phone = phoneInput.value;

    if (!phone || phone.length < 10) {
        alert(translations[currentLanguage]?.error || 'Please enter a valid phone number');
        return;
    }

    // Show OTP section
    document.getElementById('otpSection').classList.remove('hidden');
    document.getElementById('btnSendOTP').disabled = true;
    document.getElementById('btnSendOTP').textContent = '✓ OTP Sent';
}

function verifyOTP() {
    const otpInput = document.getElementById('otpInput');
    const otp = otpInput.value;

    if (!otp || otp.length !== 6) {
        alert(translations[currentLanguage]?.error || 'Please enter a 6-digit OTP');
        return;
    }

    // Show role selection
    document.getElementById('roleSection').classList.remove('hidden');
}

function loginAs(role, name = 'User') {
    // Set current user
    currentUser = {
        role: role,
        name: name + ' Kumar',
        age: 45,
        gender: 'Male',
        bloodGroup: 'O+',
        allergies: ['Penicillin', 'Peanuts'],
        diseases: ['Diabetes Type 2']
    };

    // Save to localStorage
    localStorage.setItem('healthchain_user', JSON.stringify(currentUser));

    // Show emergency button in header
    showQuickEmergencyButton();

    // Navigate to appropriate dashboard
    if (role === 'patient') {
        navigateTo('dashboard');
    } else if (role === 'doctor') {
        navigateTo('doctorDashboard');
    } else if (role === 'admin') {
        navigateTo('adminDashboard');
    }
}

function showQuickEmergencyButton() {
    const emergencyBtn = document.getElementById('quickEmergency');
    if (emergencyBtn) {
        emergencyBtn.classList.remove('hidden');
    }
}

// ==================================================
// AI DIAGNOSIS
// ==================================================

function analyzeSymptoms() {
    const imageUpload = document.getElementById('imageUpload');
    const pdfUpload = document.getElementById('pdfUpload');
    const symptomsText = document.getElementById('symptomsText');

    // Check if user provided any input
    const hasInput = imageUpload.files.length > 0 ||
        pdfUpload.files.length > 0 ||
        symptomsText.value.trim().length > 0;

    if (!hasInput) {
        alert(translations[currentLanguage]?.error || 'Please upload an image, PDF, or describe your symptoms');
        return;
    }

    if (!walletAddress) {
        alert('⚠️ Please connect your Cardano wallet first to save encrypted records');
        return;
    }

    // Show AI results section
    const aiResults = document.getElementById('aiResults');
    const aiLoading = document.getElementById('aiLoading');
    const aiResultsDisplay = document.getElementById('aiResultsDisplay');

    aiResults.classList.remove('hidden');
    aiLoading.classList.remove('hidden');
    aiResultsDisplay.classList.add('hidden');

    // Simulate AI analysis (2-3 seconds)
    setTimeout(async () => {
        aiLoading.classList.add('hidden');
        aiResultsDisplay.classList.remove('hidden');

        // Generate diagnosis
        const diagnosis = generateMockDiagnosis();
        displayAIResults(diagnosis);

        // Encrypt and save diagnosis to blockchain
        try {
            await saveRecordToBlockchain({
                type: 'ai_diagnosis',
                diagnosis: diagnosis,
                symptoms: symptomsText.value,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to save diagnosis to blockchain:', error);
        }
    }, 2500);
}

function generateMockDiagnosis() {
    // Randomly generate severity for demo
    const severities = ['mild', 'medium', 'critical'];
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];

    const diagnoses = {
        mild: {
            condition: 'Common Cold / Viral Infection',
            description: 'Based on symptoms: fever, runny nose, and sore throat.',
            severity: 'low',
            severityScore: 2,
            recommendations: [
                'Rest and stay hydrated',
                'Drink warm water with honey and lemon',
                'Take steam inhalation',
                'Over-the-counter pain relievers if needed'
            ],
            action: 'Monitor symptoms for 3-5 days',
            emergencyFlag: false,
            diseaseCode: 'J00',
            confidence: 0.85,
            followUpDays: 5
        },
        medium: {
            condition: 'Possible Bacterial Infection',
            description: 'Symptoms suggest potential bacterial infection requiring medical attention.',
            severity: 'medium',
            severityScore: 5,
            recommendations: [
                'Visit a doctor within 24-48 hours',
                'Keep hydrated',
                'Monitor temperature',
                'Avoid self-medication with antibiotics'
            ],
            action: 'Schedule doctor appointment soon',
            emergencyFlag: false,
            diseaseCode: 'J18.9',
            confidence: 0.72,
            followUpDays: 2
        },
        critical: {
            condition: 'Severe Infection / High Fever Alert',
            description: 'Critical symptoms detected - immediate medical attention required.',
            severity: 'high',
            severityScore: 9,
            recommendations: [
                'Go to nearest hospital IMMEDIATELY',
                'Do not drive yourself',
                'Have someone accompany you',
                'Bring medical ID card',
                'Call emergency: 108 (India) / 911 (US)'
            ],
            action: 'Seek emergency care NOW',
            emergencyFlag: true,
            diseaseCode: 'R50.9',
            confidence: 0.91,
            followUpDays: 0,
            hospitalRequired: true,
            icuRisk: true
        }
    };

    return {
        severity: randomSeverity,
        timestamp: new Date().toISOString(),
        ...diagnoses[randomSeverity]
    };
}

function displayAIResults(diagnosis) {
    // Enhanced results display with severity indicators
    const resultHTML = `
        <div class="ai-result-container" style="animation: slideInUp 0.6s ease-out;">
            <!-- Severity Indicator -->
            <div class="severity-indicator" style="margin-bottom: 1.5rem;">
                ${getSeverityBadge(diagnosis.severity, diagnosis.severityScore)}
            </div>
            
            <!-- Diagnosis Card -->
            <div class="card" style="border-left: 4px solid ${getSeverityColor(diagnosis.severity)}; margin-bottom: 1.5rem;">
                <h3 style="color: ${getSeverityColor(diagnosis.severity)};">${diagnosis.condition}</h3>
                <p>${diagnosis.description}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; font-size: 0.9rem;">
                    <div>
                        <strong>Confidence:</strong> ${(diagnosis.confidence * 100).toFixed(0)}%
                    </div>
                    <div>
                        <strong>Follow-up:</strong> ${diagnosis.followUpDays} days
                    </div>
                    <div>
                        <strong>Disease Code:</strong> ${diagnosis.diseaseCode}
                    </div>
                    <div>
                        <strong>Scan Date:</strong> ${new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>
            
            <!-- Emergency Warning (if critical) -->
            ${diagnosis.emergencyFlag ? `
                <div class="card card-emergency" style="margin-bottom: 1.5rem;">
                    <strong>🚨 EMERGENCY ALERT</strong>
                    <p>This condition requires immediate medical attention. Call emergency services or visit the nearest hospital.</p>
                    <button class="btn btn-emergency" onclick="activateEmergency()" style="width: 100%; margin-top: 1rem;">
                        🚑 CALL EMERGENCY NOW
                    </button>
                </div>
            ` : ''}
            
            <!-- Recommendations -->
            <div class="card" style="margin-bottom: 1.5rem;">
                <h4>📋 Recommendations</h4>
                <ul style="margin: 0; padding-left: 1.5rem;">
                    ${diagnosis.recommendations.map(rec => `<li style="margin-bottom: 0.5rem;">${rec}</li>`).join('')}
                </ul>
            </div>
            
            <!-- Action Required -->
            <div class="card" style="background: linear-gradient(135deg, rgba(15, 95, 159, 0.1) 0%, rgba(0, 188, 212, 0.1) 100%); border-left: 4px solid var(--primary-blue);">
                <h4>✅ Next Steps</h4>
                <p><strong>${diagnosis.action}</strong></p>
                ${diagnosis.hospitalRequired ? `
                    <p style="color: var(--severity-critical); font-weight: 600;">⚠️ Hospital admission recommended</p>
                ` : ''}
            </div>
            
            <!-- Save to Blockchain -->
            <button class="btn btn-primary" onclick="saveDiagnosisToBlockchain()" style="width: 100%; margin-top: 1.5rem;">
                🔐 Save Diagnosis to Blockchain
            </button>
        </div>
    `;

    const resultsDisplay = document.getElementById('aiResultsDisplay');
    if (resultsDisplay) {
        resultsDisplay.innerHTML = resultHTML;
    }
}

function getSeverityBadge(severity, score) {
    const badges = {
        low: `
            <div class="badge badge-success" style="font-size: 1rem; padding: 1rem 1.5rem; background: rgba(16, 185, 129, 0.2); color: var(--severity-mild); border: 2px solid var(--severity-mild); display: inline-block;">
                ✓ LOW SEVERITY (${score}/10) - Monitor at Home
            </div>
        `,
        medium: `
            <div class="badge badge-warning" style="font-size: 1rem; padding: 1rem 1.5rem; background: rgba(245, 158, 11, 0.2); color: var(--severity-medium); border: 2px solid var(--severity-medium); display: inline-block;">
                ⚠ MEDIUM SEVERITY (${score}/10) - Consult Doctor
            </div>
        `,
        high: `
            <div class="badge badge-danger" style="font-size: 1rem; padding: 1rem 1.5rem; background: rgba(239, 68, 68, 0.2); color: var(--severity-critical); border: 2px solid var(--severity-critical); display: inline-block; animation: pulse 2s infinite;">
                🚨 HIGH SEVERITY (${score}/10) - EMERGENCY!
            </div>
        `
    };
    return badges[severity] || badges.medium;
}

function getSeverityColor(severity) {
    const colors = {
        low: 'var(--severity-mild)',
        medium: 'var(--severity-medium)',
        high: 'var(--severity-critical)'
    };
    return colors[severity] || 'var(--dark-gray)';
}

// ==================================================
// HOSPITAL ADMIN SYSTEM
// ==================================================

let hospitalStats = {
    totalPatients: 0,
    activeAdmissions: 0,
    emergencyAlerts: 0,
    bedOccupancy: 0,
    diagnosisCount: {},
    revenueData: []
};

function getHospitalDashboardStats() {
    const allRecords = medicalRecordsOnChain;
    const diagnosisCounts = {};

    allRecords.forEach(record => {
        if (record.type === 'ai_diagnosis_report') {
            diagnosisCounts[record.id] = (diagnosisCounts[record.id] || 0) + 1;
        }
    });

    hospitalStats.totalPatients = allRecords.length;
    hospitalStats.diagnosisCount = diagnosisCounts;
    hospitalStats.activeAdmissions = Math.floor(Math.random() * 150) + 50;
    hospitalStats.emergencyAlerts = accessAuditLog.filter(log => log.event === 'emergency_activated').length;

    return hospitalStats;
}

function getPatientAnalytics() {
    return {
        totalRecords: medicalRecordsOnChain.length,
        recordsByType: groupRecordsByType(),
        avgSeverity: calculateAverageSeverity(),
        topDiseases: getTopDiseases(),
        timelineData: getRecordTimeline()
    };
}

function groupRecordsByType() {
    const groups = {};
    medicalRecordsOnChain.forEach(record => {
        groups[record.type] = (groups[record.type] || 0) + 1;
    });
    return groups;
}

function calculateAverageSeverity() {
    // Placeholder calculation
    return 5.2;
}

function getTopDiseases() {
    // Placeholder data
    return [
        { name: 'Diabetes Type 2', count: 45 },
        { name: 'Hypertension', count: 38 },
        { name: 'Viral Infection', count: 32 }
    ];
}

function getRecordTimeline() {
    return medicalRecordsOnChain.map(r => ({
        date: r.timestamp,
        type: r.type,
        count: 1
    }));
}

// ==================================================
// EMERGENCY RESPONSE SYSTEM
// ==================================================

let emergencyActivations = [];

async function activateEmergencyBlockchain() {
    if (!walletAddress) {
        alert('Please connect wallet first');
        return false;
    }

    try {
        const emergencyRecord = {
            id: 'emergency_' + Date.now(),
            activatedAt: new Date().toISOString(),
            patientAddress: walletAddress,
            status: 'active',
            emergencyHash: await hashRecord({
                patientAddress: walletAddress,
                timestamp: Date.now()
            }),
            nearbyHospitals: getNearbyHospitals(),
            medicalSummary: await generateEmergencySummary()
        };

        emergencyActivations.push(emergencyRecord);
        localStorage.setItem('healthchain_emergencies', JSON.stringify(emergencyActivations));

        // Add to audit log
        accessAuditLog.push({
            event: 'emergency_activated',
            emergencyId: emergencyRecord.id,
            timestamp: new Date().toISOString()
        });

        return emergencyRecord;
    } catch (error) {
        console.error('Emergency activation error:', error);
        return false;
    }
}

async function generateEmergencySummary() {
    return {
        bloodGroup: currentUser?.bloodGroup || 'Unknown',
        allergies: currentUser?.allergies || [],
        chronicDiseases: currentUser?.diseases || [],
        lastRecordHash: medicalRecordsOnChain[medicalRecordsOnChain.length - 1]?.hash || 'N/A',
        emergencyContacts: currentUser?.emergencyContacts || []
    };
}

function getNearbyHospitals() {
    return [
        {
            name: 'Apollo Hospital',
            distance: '2.3 km',
            beds: 5,
            phone: '+91-80-2626-2626',
            eta: '7 minutes'
        },
        {
            name: 'Fortis Hospital',
            distance: '4.1 km',
            beds: 3,
            phone: '+91-80-4566-4566',
            eta: '12 minutes'
        },
        {
            name: 'Max Hospital',
            distance: '5.8 km',
            beds: 7,
            phone: '+91-80-6112-6112',
            eta: '15 minutes'
        }
    ];
}

// ==================================================
// CARDANO TRANSACTION METADATA SYSTEM
// ==================================================

async function convertToCardanoMetadata(medicalRecord) {
    try {
        const metadata = {
            metadata: {
                674: {
                    fields: [
                        // HealthChain identifier
                        { int: 1 },
                        // Record type
                        { bytes: medicalRecord.type },
                        // Encrypted data hash
                        { bytes: medicalRecord.encryptedData.hash || 'hash' },
                        // Timestamp
                        { int: new Date(medicalRecord.timestamp).getTime() },
                        // Patient wallet address (shortened)
                        { bytes: medicalRecord.walletAddress.substring(0, 32) }
                    ]
                }
            }
        };

        return metadata;
    } catch (error) {
        console.error('Metadata conversion error:', error);
        return null;
    }
}

async function submitRecordToCardano(medicalRecord) {
    try {
        if (!walletAddress || !window.cardano) {
            throw new Error('Wallet not connected');
        }

        // Convert to metadata
        const metadata = await convertToCardanoMetadata(medicalRecord);

        // In production, this would:
        // 1. Create a Cardano transaction
        // 2. Include the metadata
        // 3. Sign with wallet
        // 4. Submit to blockchain

        console.log('Cardano metadata ready:', metadata);
        showNotification('✅ Record ready for Cardano submission', 'success');

        return metadata;
    } catch (error) {
        console.error('Cardano submission error:', error);
        showNotification('❌ Failed to prepare for Cardano: ' + error.message, 'error');
        return false;
    }
}

// ==================================================
// OFFLINE DETECTION
// ==================================================

function checkOnlineStatus() {
    const updateOnlineStatus = () => {
        const offlineIndicator = document.getElementById('offlineIndicator');
        if (navigator.onLine) {
            offlineIndicator.classList.add('hidden');
        } else {
            offlineIndicator.classList.remove('hidden');
        }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();
}

// ==================================================
// FILE UPLOAD HANDLERS
// ==================================================

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('Image uploaded:', file.name);
        // In production, you'd process the image here
    }
}

function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('PDF uploaded:', file.name);
        // In production, you'd process the PDF here
    }
}

// ==================================================
// PERMISSION MANAGEMENT SYSTEM
// ==================================================

async function grantAccessPermission(doctorAddress, accessType, durationHours) {
    try {
        const permission = {
            id: 'perm_' + Date.now(),
            doctorAddress: doctorAddress,
            patientAddress: walletAddress,
            accessType: accessType, // 'full', 'recent', 'specific', 'labs'
            grantedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + durationHours * 3600000).toISOString(),
            status: 'active',
            blockchainHash: await hashRecord({ doctorAddress, accessType, timestamp: Date.now() })
        };

        // Add audit log entry
        accessAuditLog.push({
            event: 'permission_granted',
            permission: permission,
            timestamp: new Date().toISOString()
        });

        accessPermissions.push(permission);
        localStorage.setItem('healthchain_permissions', JSON.stringify(accessPermissions));
        localStorage.setItem('healthchain_audit_log', JSON.stringify(accessAuditLog));

        showNotification(`✅ Access granted to doctor for ${durationHours} hours`, 'success');
        return permission;
    } catch (error) {
        console.error('Permission grant error:', error);
        showNotification('❌ Failed to grant permission', 'error');
        return false;
    }
}

async function revokeAccessPermission(permissionId) {
    try {
        const permission = accessPermissions.find(p => p.id === permissionId);
        if (permission) {
            permission.status = 'revoked';
            permission.revokedAt = new Date().toISOString();

            // Add audit log
            accessAuditLog.push({
                event: 'permission_revoked',
                permissionId: permissionId,
                timestamp: new Date().toISOString()
            });

            localStorage.setItem('healthchain_permissions', JSON.stringify(accessPermissions));
            localStorage.setItem('healthchain_audit_log', JSON.stringify(accessAuditLog));

            showNotification('✅ Access revoked successfully', 'success');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Revoke error:', error);
        return false;
    }
}

function getActivePermissions() {
    return accessPermissions.filter(p => {
        const expiry = new Date(p.expiresAt);
        return p.status === 'active' && expiry > new Date();
    });
}

function getAccessAuditLog() {
    return accessAuditLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ==================================================
// DOCTOR VERIFICATION SYSTEM
// ==================================================

async function requestDoctorVerification(doctorName, hospitalName, specialization) {
    try {
        const verificationRequest = {
            id: 'verify_' + Date.now(),
            doctorName: doctorName,
            hospitalName: hospitalName,
            specialization: specialization,
            requestedAt: new Date().toISOString(),
            status: 'pending', // pending, approved, rejected
            patientAddress: walletAddress,
            verificationHash: await hashRecord({ doctorName, hospitalName, Date: Date.now() })
        };

        doctorVerifications.push(verificationRequest);
        localStorage.setItem('healthchain_doctor_verify', JSON.stringify(doctorVerifications));

        showNotification(`📋 Verification request sent for ${doctorName}`, 'success');
        return verificationRequest;
    } catch (error) {
        console.error('Verification request error:', error);
        return false;
    }
}

async function approveDoctorAccess(verificationId, doctorWalletAddress) {
    try {
        const verification = doctorVerifications.find(v => v.id === verificationId);
        if (verification) {
            verification.status = 'approved';
            verification.approvedAt = new Date().toISOString();
            verification.doctorWalletAddress = doctorWalletAddress;

            // Grant access permission
            await grantAccessPermission(doctorWalletAddress, 'full', 168); // 1 week

            localStorage.setItem('healthchain_doctor_verify', JSON.stringify(doctorVerifications));
            showNotification(`✅ Doctor ${verification.doctorName} approved and granted access`, 'success');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Approval error:', error);
        return false;
    }
}

function getApprovedDoctors() {
    return doctorVerifications.filter(v => v.status === 'approved');
}

// ==================================================
// QR CODE SCANNER INTEGRATION
// ==================================================

async function initializeQRScanner() {
    // Check if browser supports HTML5 video API
    const video = document.getElementById('qrVideo');
    if (!video) return false;

    try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });

        video.srcObject = stream;
        video.play();

        // Start QR detection
        startQRDetection(video);
        return true;
    } catch (error) {
        console.error('Camera access error:', error);
        showNotification('❌ Camera access denied. Try NFC scan instead.', 'error');
        return false;
    }
}

function startQRDetection(video) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    function scan() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            // In production, use a QR library like 'jsQR' or 'qrcode.js'
            // For now, simulate QR detection
            console.log('QR Scan in progress...');
        }
        requestAnimationFrame(scan);
    }
    scan();
}

async function simulateQRCodeRead() {
    // Simulated QR code data containing doctor/hospital wallet
    const qrData = {
        type: 'doctor_verification',
        walletAddress: 'addr1qy2jy5dxvzg4x8k5m2n3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0g1h2i',
        doctorName: 'Dr. Priya Sharma',
        hospitalName: 'Apollo Hospital',
        specialization: 'Endocrinologist',
        timestamp: new Date().toISOString()
    };

    return qrData;
}

// ==================================================
// NFC ENHANCEMENTS
// ==================================================

async function enhancedNFCRead() {
    if ('NDEFReader' in window) {
        try {
            const ndef = new NDEFReader();
            await ndef.scan();

            ndef.onreading = ({ message }) => {
                for (const record of message.records) {
                    if (record.recordType === 'text') {
                        const decoder = new TextDecoder();
                        const nfcData = JSON.parse(decoder.decode(record.data));
                        processNFCData(nfcData);
                    }
                }
            };

            ndef.onerror = () => {
                console.log('NFC read error, falling back to simulation');
                simulateNFCScan();
            };
        } catch (error) {
            console.log('NFC not available, using simulation');
            simulateNFCScan();
        }
    } else {
        simulateNFCScan();
    }
}

function processNFCData(nfcData) {
    if (nfcData.type === 'medical_card') {
        loginAs('patient', nfcData.patientName);
    } else if (nfcData.type === 'doctor_card') {
        loginAs('doctor', nfcData.doctorName);
    }
}

// ==================================================
// EVENT LISTENERS SETUP
// ==================================================

function setupEventListeners() {
    // Language selector
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // Home page buttons
    const btnScanNFC = document.getElementById('btnScanNFC');
    if (btnScanNFC) {
        btnScanNFC.addEventListener('click', () => navigateTo('scan'));
    }

    const btnLoginPhone = document.getElementById('btnLoginPhone');
    if (btnLoginPhone) {
        btnLoginPhone.addEventListener('click', () => navigateTo('login'));
    }

    // Scan/Login page buttons
    const btnTapNFC = document.getElementById('btnTapNFC');
    if (btnTapNFC) {
        btnTapNFC.addEventListener('click', simulateNFCScan);
    }

    const btnScanQR = document.getElementById('btnScanQR');
    if (btnScanQR) {
        btnScanQR.addEventListener('click', simulateQRScan);
    }

    const btnSendOTP = document.getElementById('btnSendOTP');
    if (btnSendOTP) {
        btnSendOTP.addEventListener('click', sendOTP);
    }

    const btnVerifyOTP = document.getElementById('btnVerifyOTP');
    if (btnVerifyOTP) {
        btnVerifyOTP.addEventListener('click', verifyOTP);
    }

    // Quick emergency button in header
    const quickEmergency = document.getElementById('quickEmergency');
    if (quickEmergency) {
        quickEmergency.addEventListener('click', () => navigateTo('emergency'));
    }

    // AI Diagnosis
    const btnAnalyzeSymptoms = document.getElementById('btnAnalyzeSymptoms');
    if (btnAnalyzeSymptoms) {
        btnAnalyzeSymptoms.addEventListener('click', analyzeSymptoms);
    }

    // File uploads
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }

    const pdfUpload = document.getElementById('pdfUpload');
    if (pdfUpload) {
        pdfUpload.addEventListener('change', handlePDFUpload);
    }

    // Phone input - auto-format
    const phoneInput = document.getElementById('phoneInput');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            // Simple formatting for demo
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.slice(0, 10);
            e.target.value = value;
        });
    }

    // OTP input - auto-format
    const otpInput = document.getElementById('otpInput');
    if (otpInput) {
        otpInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 6) value = value.slice(0, 6);
            e.target.value = value;
        });
    }


    // Grant Access Button
    const btnGrantAccess = document.getElementById('btnGrantAccess');
    if (btnGrantAccess) {
        btnGrantAccess.addEventListener('click', handleGrantAccess);
    }
}

// ==================================================
// MOCK DATA GENERATORS
// ==================================================

function getMockMedicalRecords() {
    return [
        {
            date: '2024-11-15',
            hospital: 'Apollo Hospital, Bangalore',
            doctor: 'Dr. Priya Sharma',
            specialty: 'Endocrinologist',
            diagnosis: 'Diabetes Type 2 - Routine Checkup',
            status: 'Completed'
        },
        {
            date: '2024-08-03',
            hospital: 'Fortis Hospital, Delhi',
            doctor: 'Dr. Rajesh Kumar',
            specialty: 'General Physician',
            diagnosis: 'Viral Fever - Prescribed medication',
            status: 'Completed'
        },
        {
            date: '2024-03-12',
            hospital: 'Max Hospital, Mumbai',
            doctor: 'Dr. Sneha Reddy',
            specialty: 'Cardiologist',
            diagnosis: 'Routine Cardiac Checkup',
            status: 'Completed'
        }
    ];
}

function getMockNearbyHospitals() {
    return [
        {
            name: 'Apollo Hospital',
            distance: '2.3 km',
            time: '7 minutes',
            beds: 5,
            bloodBank: 'O+ Available',
            phone: '+91-80-2626-2626'
        },
        {
            name: 'Fortis Hospital',
            distance: '4.1 km',
            time: '12 minutes',
            beds: 3,
            bloodBank: 'O+ Limited',
            phone: '+91-80-4566-4566'
        },
        {
            name: 'Max Hospital',
            distance: '5.8 km',
            time: '15 minutes',
            beds: 7,
            bloodBank: 'All Types Available',
            phone: '+91-80-6112-6112'
        }
    ];
}

// ==================================================
// UTILITY FUNCTIONS
// ==================================================

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(currentLanguage, options);
}

function showNotification(message, type = 'success') {
    // Simple notification (could be enhanced with a toast library)
    alert(message);
}

// ==================================================
// EXPORT FUNCTIONS FOR GLOBAL ACCESS
// ==================================================

// ==================================================
// EMERGENCY FUNCTIONS
// ==================================================

let userLocation = null;

// Activate Emergency - Alert all contacts and hospitals
function activateEmergency() {
    if (!currentUser) {
        alert('Please login first to use emergency features');
        return;
    }

    const confirmed = confirm('🚨 EMERGENCY ACTIVATION\n\nThis will:\n• Alert all your emergency contacts\n• Share your location with nearby hospitals\n• Send your medical ID to emergency services\n\nProceed?');

    if (confirmed) {
        // Get current location
        updateLiveLocation();

        // Show notification
        showNotification('🚨 Emergency activated! Alerting contacts and hospitals...', 'error');

        // Simulate emergency alert
        setTimeout(() => {
            alert('✅ Emergency Alert Sent!\n\n• Emergency contacts notified\n• Location shared with 4 nearby hospitals\n• Medical ID transmitted\n• Ambulance dispatched');
        }, 1500);

        // Navigate to emergency page if not already there
        if (currentPage !== 'emergency') {
            navigateTo('emergency');
        }
    }
}

// Update Live Location using Geolocation API
function updateLiveLocation() {
    const statusEl = document.getElementById('locationStatus');
    const coordsEl = document.getElementById('coordsText');
    const addressEl = document.getElementById('addressText');
    const shareBtn = document.getElementById('shareLocationBtn');
    const updateBtn = document.getElementById('updateLocationBtn');

    if (!navigator.geolocation) {
        if (statusEl) statusEl.textContent = 'Geolocation not supported by your browser';
        return;
    }

    if (statusEl) statusEl.textContent = 'Getting location...';
    if (updateBtn) updateBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: new Date().toISOString()
            };

            // Update UI
            if (statusEl) statusEl.textContent = '✅ Location acquired';
            if (statusEl) statusEl.style.color = 'var(--primary-green)';

            if (coordsEl) {
                coordsEl.textContent = `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`;
                document.getElementById('locationCoords').classList.remove('hidden');
            }

            // Reverse geocode to get address
            reverseGeocode(userLocation.latitude, userLocation.longitude);

            // Enable share button
            if (shareBtn) shareBtn.disabled = false;
            if (updateBtn) updateBtn.disabled = false;

            showNotification('📍 Location updated successfully!', 'success');
        },
        (error) => {
            let errorMsg = 'Unable to get location';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = 'Location permission denied';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = 'Location information unavailable';
                    break;
                case error.TIMEOUT:
                    errorMsg = 'Location request timed out';
                    break;
            }

            if (statusEl) statusEl.textContent = '❌ ' + errorMsg;
            if (statusEl) statusEl.style.color = 'var(--severity-critical)';
            if (updateBtn) updateBtn.disabled = false;

            showNotification(errorMsg, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Reverse geocode coordinates to address
async function reverseGeocode(lat, lon) {
    const addressEl = document.getElementById('addressText');

    try {
        // Using OpenStreetMap Nominatim API (free, no API key required)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
        );

        if (response.ok) {
            const data = await response.json();
            const address = data.display_name || 'Address not found';

            if (addressEl) {
                addressEl.textContent = address;
                document.getElementById('locationAddress').classList.remove('hidden');
            }
        } else {
            if (addressEl) addressEl.textContent = 'Unable to fetch address';
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        if (addressEl) addressEl.textContent = 'Address lookup failed';
    }
}

// Share location with emergency contacts
function shareLocationWithContacts() {
    if (!userLocation) {
        alert('Please update your location first');
        return;
    }

    const locationText = `🚨 EMERGENCY LOCATION SHARE\n\nCoordinates: ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}\n\nGoogle Maps: https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}\n\nTime: ${new Date().toLocaleString()}`;

    // Try to use Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'Emergency Location',
            text: locationText
        }).then(() => {
            showNotification('📤 Location shared successfully!', 'success');
        }).catch((error) => {
            console.log('Share failed:', error);
            // Fallback: copy to clipboard
            copyToClipboard(locationText);
        });
    } else {
        // Fallback: copy to clipboard
        copyToClipboard(locationText);
    }
}

// Copy text to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('📋 Location copied to clipboard!\n\nYou can now paste and send it via SMS or WhatsApp.');
        }).catch(() => {
            alert('Failed to copy location');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('📋 Location copied to clipboard!');
        } catch (err) {
            alert('Failed to copy location');
        }
        document.body.removeChild(textArea);
    }
}

// Call a phone number
function callNumber(phoneNumber) {
    // Remove spaces and special characters except +
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Create tel: link
    window.location.href = `tel:${cleanNumber}`;

    showNotification(`📞 Calling ${phoneNumber}...`, 'info');
}

// Send SMS to a number
function sendSMS(phoneNumber, message = '') {
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    const defaultMessage = message || `Emergency! I need medical assistance. My location: ${userLocation ? `https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}` : 'Location not available'}`;

    // Create sms: link
    window.location.href = `sms:${cleanNumber}?body=${encodeURIComponent(defaultMessage)}`;

    showNotification(`💬 Opening SMS to ${phoneNumber}...`, 'info');
}

// Open map with directions
function openMap(lat, lon, hospitalName) {
    const destination = `${lat},${lon}`;
    let mapsUrl;

    // Check if user has location
    if (userLocation) {
        // With user location - show directions
        mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destination}&travelmode=driving`;
    } else {
        // Without user location - just show hospital location
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;
    }

    // Open in new tab
    window.open(mapsUrl, '_blank');

    showNotification(`🗺️ Opening directions to ${hospitalName}...`, 'info');
}

// Send Medical ID to hospital
function sendMedicalID(hospitalName) {
    if (!currentUser) {
        alert('Please login first');
        return;
    }

    const medicalInfo = `
🏥 MEDICAL ID - ${currentUser.name}

📋 Basic Info:
• Age: ${currentUser.age}
• Gender: ${currentUser.gender}
• Blood Group: ${currentUser.bloodGroup}

⚠️ Allergies:
${currentUser.allergies.map(a => `• ${a}`).join('\n')}

🏥 Chronic Conditions:
${currentUser.diseases.map(d => `• ${d}`).join('\n')}

${userLocation ? `📍 Current Location:\nhttps://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}` : ''}

⏰ Sent: ${new Date().toLocaleString()}
    `.trim();

    // Simulate sending to hospital
    console.log('Sending Medical ID to', hospitalName);
    console.log(medicalInfo);

    // Show success message
    alert(`✅ Medical ID sent to ${hospitalName}!\n\nYour critical medical information has been transmitted securely.`);

    showNotification(`📤 Medical ID sent to ${hospitalName}`, 'success');
}

// Contact blood donors
function contactBloodDonors() {
    if (!userLocation) {
        alert('Please enable location to find nearby blood donors');
        updateLiveLocation();
        return;
    }

    const message = `🩸 URGENT BLOOD NEEDED\n\nBlood Type: ${currentUser?.bloodGroup || 'O+'}\nPatient: ${currentUser?.name || 'Emergency Patient'}\n\nLocation: https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}\n\nPlease contact immediately if you can donate.`;

    // Try to share
    if (navigator.share) {
        navigator.share({
            title: 'Urgent Blood Donation Request',
            text: message
        }).then(() => {
            showNotification('📤 Blood donor request shared!', 'success');
        }).catch(() => {
            copyToClipboard(message);
        });
    } else {
        copyToClipboard(message);
    }
}

// Make functions available globally for onclick handlers
window.navigateTo = navigateTo;
window.loginAs = loginAs;
window.toggleDarkMode = toggleDarkMode;
window.activateEmergency = activateEmergency;
window.grantPermission = grantPermission;
window.revokePermission = revokePermission;
window.updateLiveLocation = updateLiveLocation;
window.shareLocationWithContacts = shareLocationWithContacts;
window.callNumber = callNumber;
window.sendSMS = sendSMS;
window.openMap = openMap;
window.sendMedicalID = sendMedicalID;
window.contactBloodDonors = contactBloodDonors;


// ==================================================
// CARDANO WALLET FUNCTIONS EXPORT
// ==================================================

// Make wallet functions available globally
window.connectCardanoWallet = connectCardanoWallet;
window.encryptMedicalData = encryptMedicalData;
window.decryptMedicalData = decryptMedicalData;
window.saveRecordToBlockchain = saveRecordToBlockchain;
window.verifyRecordIntegrity = verifyRecordIntegrity;

// ==================================================
// SERVICE WORKER (Offline Support) - Optional
// ==================================================

if ('serviceWorker' in navigator) {
    // Uncomment to enable service worker for offline support
    /* 
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('SW registered:', registration))
        .catch(error => console.log('SW registration failed:', error));
    });
    */
}

// ==================================================
// SECURITY & PRIVACY FUNCTIONS
// ==================================================

function selectDuration(btn, duration) {
    // Reset all buttons
    document.querySelectorAll('.duration-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
    });

    // Highlight selected
    btn.classList.remove('btn-outline');
    btn.classList.add('btn-primary');

    // Set hidden input value
    document.getElementById('selectedDuration').value = duration;
}

function handleGrantAccess() {
    const doctorName = document.getElementById('grantDoctorName').value;
    const duration = document.getElementById('selectedDuration').value;

    if (!doctorName) {
        alert('Please enter a doctor or hospital name');
        return;
    }

    if (!duration) {
        alert('Please select a duration');
        return;
    }

    // Get access levels
    const accessLevels = [];
    if (document.getElementById('accessFullHistory').checked) accessLevels.push('Full Medical History');
    if (document.getElementById('accessRecentVisits').checked) accessLevels.push('Recent Visits Only');
    if (document.getElementById('accessSpecificConditions').checked) accessLevels.push('Specific Conditions Only');
    if (document.getElementById('accessLabReports').checked) accessLevels.push('Lab Reports Only');

    if (accessLevels.length === 0) {
        alert('Please select at least one access level');
        return;
    }

    // Create new medical history record
    const newRecord = {
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        hospital: doctorName,
        doctor: 'Access Granted',
        diagnosis: `Access Level: ${accessLevels.join(', ')}`,
        status: 'Active'
    };

    // Add to Medical History Page
    const medicalRecordsList = document.getElementById('medicalRecordsList');
    if (medicalRecordsList) {
        const recordHTML = `
          <div class="card mb-md" style="border-left: 4px solid var(--primary-blue);">
            <div class="flex flex-between mb-sm">
              <div>
                <h3>Date: ${newRecord.date}</h3>
                <p style="color: var(--dark-gray); margin: 0;">
                  <strong>${newRecord.hospital}</strong>
                </p>
              </div>
              <div class="badge badge-primary">Active Access</div>
            </div>
            <div class="grid grid-2 gap-md mt-md">
              <div>
                <p><strong>Action:</strong> Medical Data Access Granted</p>
                <p><strong>Details:</strong> ${newRecord.diagnosis}</p>
                <p><strong>Duration:</strong> ${duration}</p>
              </div>
              <div class="flex gap-sm" style="justify-content: flex-end; flex-wrap: wrap;">
                <button class="btn btn-outline" style="color: var(--severity-critical); border-color: var(--severity-critical);">
                  🚫 Revoke Access
                </button>
              </div>
            </div>
          </div>
        `;
        medicalRecordsList.insertAdjacentHTML('afterbegin', recordHTML);
    }

    // Add to Access Logs in Privacy Page
    const accessLogsBody = document.getElementById('accessLogsBody');
    if (accessLogsBody) {
        const logHTML = `
            <tr style="border-bottom: 1px solid var(--light-gray);">
              <td style="padding: 1rem;">${doctorName}</td>
              <td style="padding: 1rem;">Just now</td>
              <td style="padding: 1rem;">${accessLevels.join(', ')}</td>
              <td style="padding: 1rem;">
                <button class="btn btn-outline" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
                  ⛓️ Verify
                </button>
              </td>
            </tr>
        `;
        accessLogsBody.insertAdjacentHTML('afterbegin', logHTML);
    }

    alert(`Access granted to ${doctorName} for ${duration}`);

    // Reset form
    document.getElementById('grantDoctorName').value = '';
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
    });
    document.getElementById('selectedDuration').value = '';
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
}

console.log('HealthChain ID - Application initialized with Cardano Blockchain support! 🏥🔐');
console.log('🔗 Cardano Integration Ready - End-to-End Encrypted Medical Records');

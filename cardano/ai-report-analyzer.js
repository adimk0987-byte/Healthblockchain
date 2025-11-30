/**
 * AI Medical Report Analyzer - Vanilla JavaScript Implementation
 * Integrates with Google Gemini API for medical report analysis
 */

// Configuration
const GEMINI_API_KEY = "AIzaSyAD1EBET12Ah6VBpt2We162B34L7z2Z-_c"; // Enter your key here or leave empty
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

const SYSTEM_PROMPT = `
You are Ai report check, an assistant that analyzes uploaded medical reports. Your job is to:
1. Extract structured findings (test names, numeric values, units, reference ranges if present).
2. Compare values to reference ranges and determine deviation direction (+/-) and percent difference.
3. Classify the overall report into one of: "Normal", "Slightly Abnormal", "Abnormal", "Critical".
4. For "Slightly Abnormal" or "Abnormal" primarily related to metabolic/nutritional/lab markers, produce a practical diet and lifestyle plan.
5. For "Critical", recommend a medical specialty and nearby hospitals.
6. Produce strict machine-readable JSON.

OUTPUT JSON SCHEMA (must be followed exactly):
{
  "request_id": string,
  "parsed_tests": [
    { "test_name": string, "value": number|string, "unit": string|null, "ref_low": number|null, "ref_high": number|null, "deviation": "low"|"high"|"normal"|"unknown", "pct_diff": number|null }
  ],
  "interpretation": [ string ],
  "classification": "Normal" | "Slightly Abnormal" | "Abnormal" | "Critical",
  "severity_score": number,
  "diet_plan": {
     "primary_goal": string,
     "duration_weeks": number,
     "nutrition_overview": string,
     "foods_to_include": [string],
     "foods_to_avoid": [string],
     "sample_one_day_meal_plan": { "breakfast": string, "lunch": string, "snack": string, "dinner": string },
     "supplements": [ { "name":string, "dose": string, "notes": string } ],
     "exercise": [ string ],
     "monitoring": [ { "test_name": string, "when_weeks": number } ],
     "red_flags": [ string ]
  } | null,
  "recommended_specialty": string | null,
  "hospital_search_query": string | null,
  "human_summary": string,
  "follow_up_questions": [ string ],
  "disclaimer": string
}
`;

const DEMO_REPORT_TEXT = `LIPID PANEL:
Total Cholesterol: 265 mg/dL (Ref <200)
HDL Cholesterol: 32 mg/dL (Ref >40)
Triglycerides: 210 mg/dL (Ref <150)
LDL Calculated: 191 mg/dL (Ref <100)

GLUCOSE METABOLISM:
HbA1c: 6.2% (Ref 4.0-5.6%)
Fasting Glucose: 118 mg/dL (Ref 70-99)`;

// State
let analyzerState = {
  reportText: "",
  file: null,
  userContext: { age: 45, sex: "M", conditions: "" },
  loading: false,
  result: null,
  error: "",
  activeTab: "report"
};

/**
 * Initialize AI Report Analyzer page
 */
function initAIReportAnalyzer() {
  const container = document.getElementById('aiReportAnalyzerContainer');
  if (!container) return;

  container.innerHTML = renderAnalyzerHTML();
  attachAnalyzerEventListeners();
}

/**
 * Render the analyzer UI
 */
function renderAnalyzerHTML() {
  return `
    <div class="analyzer-wrapper">
      <!-- Header -->
      <div class="analyzer-header">
        <div class="analyzer-header-content">
          <div class="analyzer-icon">🏥</div>
          <div>
            <h1 class="analyzer-title">Ai report check</h1>
            <p class="analyzer-subtitle">AI Medical Report Analyzer</p>
          </div>
        </div>
      </div>
      <button id="analyzerBackBtn" class="analyzer-back-btn" style="margin:16px 0 0 16px;padding:8px 16px;background:#0d9488;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1rem;">← Back to Dashboard</button>
      <main class="analyzer-main">
        <!-- Input Section -->
        <section class="analyzer-section">
          <div class="analyzer-section-header">
            <h2>📄 Upload or Paste Report</h2>
            <button id="loadDemoBtn" class="btn-secondary">Load Demo Data</button>
          </div>
          
          <div class="analyzer-content">
            <!-- User Context Form -->
            <div class="context-form-grid">
              <div class="form-group">
                <label>Age</label>
                <input type="number" id="userAge" value="45" class="form-input">
              </div>
              <div class="form-group">
                <label>Sex</label>
                <select id="userSex" class="form-input">
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group" style="grid-column: 1/-1;">
                <label>Known Conditions</label>
                <input type="text" id="userConditions" placeholder="e.g. Hypertension" class="form-input">
              </div>
            </div>

            <!-- File Upload Area -->
            <div class="file-upload-area">
              <input 
                type="file" 
                id="fileInput"
                accept="image/*,application/pdf"
                class="file-input-hidden"
              />
              
              <div id="fileUploadContent" class="upload-content">
                <div class="upload-icon">📤</div>
                <p class="upload-text">Click to upload or drag & drop</p>
                <p class="upload-subtext">Supports Images (JPG, PNG) or PDF</p>
              </div>
            </div>

            <div class="divider">
              <span class="divider-text">Or paste text</span>
            </div>

            <!-- Text Input -->
            <textarea
              id="reportTextarea"
              class="report-textarea"
              placeholder="Paste text from medical report here if not uploading a file..."
            ></textarea>

            <!-- Error Message -->
            <div id="errorMessage" class="error-message hidden"></div>

            <!-- Analyze Button -->
            <button id="analyzeBtn" class="btn-primary btn-large">
              <span id="analyzeBtnText">Analyze Report</span>
            </button>
          </div>
        </section>

        <!-- Results Section -->
        <div id="resultsSection" class="hidden"></div>
      </main>
    </div>
  `;
}

/**
 * Attach event listeners
 */
function attachAnalyzerEventListeners() {
  // File input
  const fileInput = document.getElementById('fileInput');
  const fileUploadArea = document.querySelector('.file-upload-area');
  
  fileInput.addEventListener('change', handleFileChange);
  fileUploadArea.addEventListener('click', () => fileInput.click());
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('drag-over');
  });
  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('drag-over');
  });
  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) {
      fileInput.files = e.dataTransfer.files;
      handleFileChange({ target: fileInput });
    }
  });

  // Text input
  document.getElementById('reportTextarea').addEventListener('input', (e) => {
    analyzerState.reportText = e.target.value;
    if (e.target.value) analyzerState.file = null;
  });

  // Demo data
  document.getElementById('loadDemoBtn').addEventListener('click', loadDemoData);

  // Analyze button
  document.getElementById('analyzeBtn').addEventListener('click', analyzeReport);

  // User context inputs
  document.getElementById('userAge').addEventListener('change', (e) => {
    analyzerState.userContext.age = e.target.value;
  });
  document.getElementById('userSex').addEventListener('change', (e) => {
    analyzerState.userContext.sex = e.target.value;
  });
  document.getElementById('userConditions').addEventListener('change', (e) => {
    analyzerState.userContext.conditions = e.target.value;
  });

  // Back button event
  const backBtn = document.getElementById("analyzerBackBtn");
  if (backBtn) {
    backBtn.onclick = function() {
      if (typeof navigateTo === 'function') {
        navigateTo('dashboard');
      }
    };
  }
}

/**
 * Handle file selection
 */
function handleFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    analyzerState.file = file;
    analyzerState.reportText = "";
    document.getElementById('reportTextarea').value = "";
    document.getElementById('reportTextarea').disabled = true;
    
    // Update file display
    const fileUploadContent = document.getElementById('fileUploadContent');
    fileUploadContent.innerHTML = `
      <div class="file-selected">
        <div class="file-icon">${file.type.includes('image') ? '🖼️' : '📄'}</div>
        <div class="file-info">
          <p class="file-name">${file.name}</p>
          <p class="file-size">${(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button class="file-remove" onclick="removeFile()">✕</button>
      </div>
    `;
  }
}

/**
 * Remove selected file
 */
function removeFile() {
  analyzerState.file = null;
  document.getElementById('fileInput').value = "";
  document.getElementById('reportTextarea').disabled = false;
  document.getElementById('fileUploadContent').innerHTML = `
    <div class="upload-icon">📤</div>
    <p class="upload-text">Click to upload or drag & drop</p>
    <p class="upload-subtext">Supports Images (JPG, PNG) or PDF</p>
  `;
}

/**
 * Load demo data
 */
function loadDemoData() {
  analyzerState.reportText = DEMO_REPORT_TEXT;
  analyzerState.file = null;
  document.getElementById('reportTextarea').value = DEMO_REPORT_TEXT;
  document.getElementById('reportTextarea').disabled = false;
  document.getElementById('fileInput').value = "";
  document.getElementById('fileUploadContent').innerHTML = `
    <div class="upload-icon">📤</div>
    <p class="upload-text">Click to upload or drag & drop</p>
    <p class="upload-subtext">Supports Images (JPG, PNG) or PDF</p>
  `;
}

/**
 * Convert file to Base64
 */
async function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Analyze report using Gemini API
 */
async function analyzeReport() {
  if (!analyzerState.reportText.trim() && !analyzerState.file) {
    showError("Please upload a file or paste report text.");
    return;
  }

  if (!GEMINI_API_KEY) {
    showError("Gemini API key not configured. Please add your API key to the configuration.");
    return;
  }

  analyzerState.loading = true;
  analyzerState.error = "";
  analyzerState.result = null;
  updateAnalyzeButton();

  try {
    const requestId = `req_${Date.now()}`;

    // Construct prompt
    let promptInstructions = `
${SYSTEM_PROMPT}

Now parse and respond for the following request:
{ 
  "request_id": "${requestId}", 
  "user_context": ${JSON.stringify({
    age: analyzerState.userContext.age,
    sex: analyzerState.userContext.sex,
    known_conditions: analyzerState.userContext.conditions.split(',').map(c => c.trim()).filter(Boolean)
  })} 
}
`;

    const parts = [];

    if (analyzerState.file) {
      promptInstructions += `\n\nNOTE: The medical report is attached as an image/PDF. Extract data from the attachment.`;
      parts.push({ text: promptInstructions });

      // Add file as base64
      const base64Data = await fileToBase64(analyzerState.file);
      const mimeType = analyzerState.file.type;
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    } else {
      promptInstructions += `\n\nNOTE: The medical report text is provided below:\n${analyzerState.reportText}`;
      parts.push({ text: promptInstructions });
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) throw new Error("No response from AI");

    const parsedData = JSON.parse(rawText);
    analyzerState.result = parsedData;

    if (parsedData.diet_plan) {
      analyzerState.activeTab = "diet";
    } else {
      analyzerState.activeTab = "report";
    }

    displayResults();
  } catch (err) {
    showError(err.message || "Failed to analyze report");
    console.error(err);
  } finally {
    analyzerState.loading = false;
    updateAnalyzeButton();
  }
}

/**
 * Display results
 */
function displayResults() {
  const resultsSection = document.getElementById('resultsSection');
  resultsSection.classList.remove('hidden');
  resultsSection.innerHTML = `
    ${renderSeverityBadge()}
    ${renderCriticalAlert()}
    ${renderTabs()}
    ${renderTabContent()}
    ${renderDisclaimer()}
  `;
}

/**
 * Render severity badge
 */
function renderSeverityBadge() {
  const result = analyzerState.result;
  const colors = {
    "Normal": "#10b981",
    "Slightly Abnormal": "#f59e0b",
    "Abnormal": "#f97316",
    "Critical": "#ef4444"
  };

  const bgColors = {
    "Normal": "#dcfce7",
    "Slightly Abnormal": "#fef3c7",
    "Abnormal": "#fed7aa",
    "Critical": "#fee2e2"
  };

  const color = colors[result.classification] || colors["Normal"];
  const bgColor = bgColors[result.classification] || bgColors["Normal"];

  return `
    <div class="severity-badge" style="background-color: ${bgColor}; border-left: 4px solid ${color};">
      <div class="severity-content">
        <div class="severity-icon">${result.classification === "Critical" ? "⚠️" : "❤️"}</div>
        <div>
          <h3 class="severity-title">${result.classification}</h3>
          <p class="severity-score">Severity Score: ${result.severity_score}</p>
        </div>
      </div>
      <div class="severity-number">${Math.round(result.severity_score * 100)}/100</div>
    </div>
  `;
}

/**
 * Render critical alert
 */
function renderCriticalAlert() {
  const result = analyzerState.result;
  if (result.classification !== "Critical" && !result.hospital_search_query) {
    return "";
  }

  const hospitalLink = result.hospital_search_query 
    ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.hospital_search_query)}" target="_blank" class="hospital-link">📍 Find Hospitals Near Me</a>`
    : "";

  return `
    <div class="critical-alert">
      <div class="alert-icon">📍</div>
      <div class="alert-content">
        <h3>Immediate Action Recommended</h3>
        <p>${result.recommended_specialty ? `Consult ${result.recommended_specialty}. ` : ""}${result.human_summary}</p>
        ${hospitalLink}
      </div>
    </div>
  `;
}

/**
 * Render tabs
 */
function renderTabs() {
  const result = analyzerState.result;
  return `
    <div class="tabs">
      <button class="tab-btn ${analyzerState.activeTab === 'report' ? 'active' : ''}" onclick="switchTab('report')">
        📊 Lab Findings
      </button>
      ${result.diet_plan ? `
        <button class="tab-btn ${analyzerState.activeTab === 'diet' ? 'active' : ''}" onclick="switchTab('diet')">
          🍎 Action Plan
        </button>
      ` : ""}
    </div>
  `;
}

/**
 * Render tab content
 */
function renderTabContent() {
  const result = analyzerState.result;

  if (analyzerState.activeTab === 'report') {
    return `
      <div class="tab-content">
        <div class="summary-box">
          <h3>Summary</h3>
          <p>${result.human_summary}</p>
        </div>

        <div class="tests-table">
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Value</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${result.parsed_tests.map(test => `
                <tr>
                  <td class="test-name">${test.test_name}</td>
                  <td class="test-value">${test.value} <span class="test-unit">${test.unit || ""}</span></td>
                  <td class="test-ref">${test.ref_low && test.ref_high ? `${test.ref_low} - ${test.ref_high}` : "N/A"}</td>
                  <td>
                    ${test.deviation === 'normal' 
                      ? '<span class="status-badge normal">Normal</span>' 
                      : `<span class="status-badge abnormal">${test.deviation.toUpperCase()} ${test.pct_diff ? `(${Math.abs(Math.round(test.pct_diff))}%)` : ""}</span>`
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="interpretation">
          <h4>Clinical Interpretation</h4>
          <ul>
            ${result.interpretation.map(item => `<li>• ${item}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  } else if (analyzerState.activeTab === 'diet' && result.diet_plan) {
    const plan = result.diet_plan;
    return `
      <div class="tab-content">
        <div class="goal-box">
          <h3>Primary Goal</h3>
          <p>${plan.primary_goal} (${plan.duration_weeks} weeks)</p>
        </div>

        <div class="foods-grid">
          <div class="foods-column">
            <h4>✅ Foods to Include</h4>
            <ul>
              ${plan.foods_to_include.map(f => `<li>• ${f}</li>`).join('')}
            </ul>
          </div>
          <div class="foods-column">
            <h4>⚠️ Foods to Avoid</h4>
            <ul>
              ${plan.foods_to_avoid.map(f => `<li>• ${f}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div class="meal-plan">
          <h4>🍽️ Sample Meal Plan</h4>
          <div class="meals-grid">
            ${Object.entries(plan.sample_one_day_meal_plan).map(([meal, food]) => `
              <div class="meal-card">
                <span class="meal-label">${meal.toUpperCase()}</span>
                <span class="meal-food">${food}</span>
              </div>
            `).join('')}
          </div>
        </div>

        ${plan.supplements && plan.supplements.length > 0 ? `
          <div class="supplements-box">
            <h4>💊 Recommended Support</h4>
            ${plan.supplements.map(supp => `
              <div class="supplement">
                <span>${supp.name}</span>
                <span>${supp.dose}</span>
              </div>
            `).join('')}
          </div>
        ` : ""}

        ${plan.red_flags && plan.red_flags.length > 0 ? `
          <div class="red-flags">
            <h4>🚨 Red Flags - Call Doctor If:</h4>
            <ul>
              ${plan.red_flags.map(flag => `<li>• ${flag}</li>`).join('')}
            </ul>
          </div>
        ` : ""}
      </div>
    `;
  }
  return "";
}

/**
 * Render disclaimer
 */
function renderDisclaimer() {
  return `
    <div class="disclaimer">
      <p><strong>MEDICAL DISCLAIMER</strong></p>
      <p>${analyzerState.result.disclaimer}</p>
    </div>
  `;
}

/**
 * Switch active tab
 */
function switchTab(tabName) {
  analyzerState.activeTab = tabName;
  displayResults();
}

/**
 * Show error message
 */
function showError(message) {
  analyzerState.error = message;
  const errorEl = document.getElementById('errorMessage');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }
}

/**
 * Update analyze button state
 */
function updateAnalyzeButton() {
  const btn = document.getElementById('analyzeBtn');
  const btnText = document.getElementById('analyzeBtnText');
  const hasInput = analyzerState.reportText.trim() || analyzerState.file;

  if (analyzerState.loading) {
    btn.disabled = true;
    btnText.textContent = "⏳ Analyzing Report...";
  } else {
    btn.disabled = !hasInput;
    btnText.textContent = "Analyze Report";
  }
}

# AI Report Analyzer - Code Reference

## Files Location and Purpose

### Core Files

#### 1. `ai-report-analyzer.js` (Main Logic)
**Purpose**: All analyzer functionality
**Size**: 460+ lines
**Key Functions**:
- `initAIReportAnalyzer()` - Initialize page UI
- `analyzeReport()` - Call Gemini API
- `displayResults()` - Render results
- `switchTab()` - Change between tabs

**Entry Point**:
```javascript
// Called when navigating to analyzer page
navigateTo('aiReportAnalyzer');
// Which triggers: initAIReportAnalyzer();
```

#### 2. `ai-report-analyzer.css` (Styling)
**Purpose**: Complete UI styling
**Size**: 650+ lines
**Classes**:
- `.analyzer-*` - Main page structure
- `.severity-badge` - Colored status indicator
- `.tab-*` - Tab interface
- `.meals-grid` - Meal plan display
- All responsive and mobile-optimized

#### 3. `index.html` (Integration Point)
**Location**: Root of project
**Changes Made**:
```html
<!-- Added in <head> section -->
<link rel="stylesheet" href="ai-report-analyzer.css">

<!-- Added before </body> -->
<section id="aiReportAnalyzerPage" class="section">
  <div id="aiReportAnalyzerContainer"></div>
</section>

<!-- Script order (important) -->
<script src="translations.js"></script>
<script src="ai-report-analyzer.js"></script>  <!-- Must be before app.js -->
<script src="app.js"></script>
```

**Dashboard Integration**:
```html
<!-- Added AI Medical Report card to dashboard -->
<div class="card" onclick="navigateTo('aiReportAnalyzer')" style="cursor: pointer;">
  <div class="card-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); color: white;">📊</div>
  <h3 class="card-title">AI Medical Report</h3>
  <p class="card-description">Analyze lab reports with AI</p>
  <div class="badge badge-info mt-sm">Analyze Now →</div>
</div>
```

#### 4. `app.js` (Navigation)
**Location**: Root of project
**Change**: Added case to `navigateTo()` function
```javascript
case 'aiReportAnalyzer':
    targetPage = 'aiReportAnalyzerPage';
    if (typeof initAIReportAnalyzer === 'function') {
        initAIReportAnalyzer();
    }
    break;
```

---

## Configuration

### API Configuration

**File**: `ai-report-analyzer.js` Lines 10-12

```javascript
// --- CONFIGURATION ---
// In a real production app, this should be in an .env file or a backend proxy.
const GEMINI_API_KEY = ""; // Enter your key here or leave empty to use the environment's key if available.

const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
```

**How to Set**:
1. Get key from: https://aistudio.google.com/app/apikeys
2. Replace empty string with your key:
```javascript
const GEMINI_API_KEY = "AIzaSyC_YOUR_KEY_HERE_abcdef123456";
```

### Demo Data

**File**: `ai-report-analyzer.js` Lines 53-63

```javascript
const DEMO_REPORT_TEXT = `LIPID PANEL:
Total Cholesterol: 265 mg/dL (Ref <200)
HDL Cholesterol: 32 mg/dL (Ref >40)
Triglycerides: 210 mg/dL (Ref <150)
LDL Calculated: 191 mg/dL (Ref <100)

GLUCOSE METABOLISM:
HbA1c: 6.2% (Ref 4.0-5.6%)
Fasting Glucose: 118 mg/dL (Ref 70-99)`;
```

---

## Key Functions

### Initialization

```javascript
/**
 * Initialize AI Report Analyzer page
 */
function initAIReportAnalyzer() {
  const container = document.getElementById('aiReportAnalyzerContainer');
  if (!container) return;

  container.innerHTML = renderAnalyzerHTML();
  attachAnalyzerEventListeners();
}
```

### Analysis Flow

```javascript
/**
 * Analyze report using Gemini API
 */
async function analyzeReport() {
  // 1. Validation
  if (!analyzerState.reportText.trim() && !analyzerState.file) {
    showError("Please upload a file or paste report text.");
    return;
  }

  // 2. Set loading state
  analyzerState.loading = true;
  analyzerState.error = "";
  analyzerState.result = null;
  updateAnalyzeButton();

  try {
    // 3. Prepare request
    const requestId = `req_${Date.now()}`;
    const parts = [];

    // ... construct prompt ...
    // ... add file if present ...

    // 4. Call API
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

    // 5. Parse response
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedData = JSON.parse(rawText);

    // 6. Store and display
    analyzerState.result = parsedData;
    displayResults();

  } catch (err) {
    showError(err.message || "Failed to analyze report");
  } finally {
    analyzerState.loading = false;
    updateAnalyzeButton();
  }
}
```

### Event Listeners

```javascript
/**
 * Attach event listeners
 */
function attachAnalyzerEventListeners() {
  // File input
  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', handleFileChange);

  // Text input
  document.getElementById('reportTextarea').addEventListener('input', (e) => {
    analyzerState.reportText = e.target.value;
  });

  // Demo data
  document.getElementById('loadDemoBtn').addEventListener('click', loadDemoData);

  // Analyze button
  document.getElementById('analyzeBtn').addEventListener('click', analyzeReport);

  // User context inputs
  document.getElementById('userAge').addEventListener('change', (e) => {
    analyzerState.userContext.age = e.target.value;
  });
}
```

---

## API Schema

### Request Format

```json
{
  "contents": [{
    "parts": [
      {
        "text": "SYSTEM_PROMPT\n\nNow parse and respond for the following request:\n{\n  \"request_id\": \"req_1234567890\",\n  \"user_context\": {\"age\": 45, \"sex\": \"M\", \"known_conditions\": []}\n}\n\nNOTE: The medical report text is provided below:\nLIPID PANEL:\nTotal Cholesterol: 265 mg/dL (Ref <200)..."
      },
      {
        "inlineData": {
          "data": "iVBORw0KGgoAAAANSUhEUgAAAAE...",
          "mimeType": "image/jpeg"
        }
      }
    ]
  }],
  "generationConfig": {
    "responseMimeType": "application/json"
  }
}
```

### Response Format

```javascript
{
  "request_id": "req_1234567890",
  "parsed_tests": [
    {
      "test_name": "Total Cholesterol",
      "value": 265,
      "unit": "mg/dL",
      "ref_low": 0,
      "ref_high": 200,
      "deviation": "high",
      "pct_diff": 32.5
    },
    // ... more tests ...
  ],
  "interpretation": [
    "Elevated cholesterol levels...",
    "LDL cholesterol is significantly..."
  ],
  "classification": "Abnormal",
  "severity_score": 0.68,
  "diet_plan": {
    "primary_goal": "Reduce cholesterol and triglycerides",
    "duration_weeks": 12,
    "nutrition_overview": "Low-saturated-fat, high-fiber diet",
    "foods_to_include": ["Oats", "Almonds", "Salmon"],
    "foods_to_avoid": ["Red meat", "Butter"],
    "sample_one_day_meal_plan": {
      "breakfast": "Oatmeal with berries",
      "lunch": "Grilled salmon with vegetables",
      "snack": "Almonds and apple",
      "dinner": "Baked chicken breast with quinoa"
    },
    "supplements": [
      {"name": "Omega-3", "dose": "1000mg daily", "notes": "Fish oil"}
    ],
    "exercise": ["30 min walking daily"],
    "monitoring": [
      {"test_name": "Lipid Panel", "when_weeks": 4}
    ],
    "red_flags": [
      "Chest pain or shortness of breath"
    ]
  },
  "recommended_specialty": "Cardiologist",
  "hospital_search_query": "cardiology hospitals near me",
  "human_summary": "Your lipid panel shows elevated cholesterol...",
  "follow_up_questions": ["Any family history?"],
  "disclaimer": "This is AI-generated analysis for informational purposes only..."
}
```

---

## State Management

### Initial State

```javascript
let analyzerState = {
  reportText: "",           // User-pasted text
  file: null,               // Uploaded file object
  userContext: {
    age: 45,                // User's age
    sex: "M",               // User's sex (M/F/Other)
    conditions: ""          // Known conditions (comma-separated)
  },
  loading: false,           // API call in progress?
  result: null,             // Parsed AI response
  error: "",                // Error message to display
  activeTab: "report"       // "report" or "diet"
};
```

### State Update Examples

```javascript
// Update text input
analyzerState.reportText = "New report text...";

// Update user age
analyzerState.userContext.age = 50;

// Set result from API
analyzerState.result = {
  classification: "Abnormal",
  severity_score: 0.68,
  // ... rest of response ...
};

// Switch tab
analyzerState.activeTab = "diet";
```

---

## Styling Reference

### Main Classes

```css
/* Page wrapper */
.analyzer-wrapper { ... }

/* Header */
.analyzer-header { ... }
.analyzer-header-content { ... }

/* Main content */
.analyzer-main { ... }
.analyzer-section { ... }

/* Forms */
.context-form-grid { ... }
.form-group { ... }
.form-input { ... }

/* File upload */
.file-upload-area { ... }
.file-selected { ... }

/* Results */
.severity-badge { ... }
.critical-alert { ... }

/* Tabs */
.tabs { ... }
.tab-btn { ... }
.tab-content { ... }

/* Tables */
.tests-table { ... }

/* Meal plan */
.meals-grid { ... }
.meal-card { ... }

/* Mobile breakpoint */
@media (max-width: 640px) { ... }
```

---

## Common Modifications

### Change API Model

```javascript
// Line 12 in ai-report-analyzer.js
const GEMINI_MODEL = "gemini-2.0-pro"; // or "gemini-2.0-flash"
```

### Add New System Prompt

```javascript
// Replace SYSTEM_PROMPT starting at line 14
const SYSTEM_PROMPT = `
You are [YOUR_CUSTOM_ROLE]...
`;
```

### Change Primary Color

```css
/* In ai-report-analyzer.css */
/* Find all #0d9488 and replace with your color */
--primary-color: #0d9488;

/* Or search & replace */
.btn-primary { background: #0d9488; }
```

### Add Translation Keys

```javascript
// In translations.js, add:
translations.en.analyzerTitle = "AI Medical Report Analyzer";
translations.hi.analyzerTitle = "एआई मेडिकल रिपोर्ट विश्लेषक";

// Then in ai-report-analyzer.js:
document.querySelector('.analyzer-title').textContent = 
  translate('analyzerTitle');
```

---

## Integration Checklist

- [ ] Copied `ai-report-analyzer.js` to project root
- [ ] Copied `ai-report-analyzer.css` to project root
- [ ] Updated `index.html` with CSS link
- [ ] Updated `index.html` with page section
- [ ] Updated `app.js` with navigation case
- [ ] Got Gemini API key from https://aistudio.google.com/app/apikeys
- [ ] Pasted API key in `ai-report-analyzer.js` line 10
- [ ] Verified all files exist
- [ ] Tested with demo data
- [ ] Tested file upload
- [ ] Tested text input
- [ ] Checked mobile responsiveness
- [ ] Verified no console errors
- [ ] Read `AI_QUICK_START.md` for setup
- [ ] Read `AI_REPORT_ANALYZER_GUIDE.md` for advanced features

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Can't find initAIReportAnalyzer" | Move `ai-report-analyzer.js` before `app.js` in HTML |
| Styles not loading | Check CSS file path, refresh browser (Ctrl+Shift+Del) |
| API error 400 | Verify API key is correct |
| API error 403 | Check quota at Google Cloud Console |
| Analyzer page not loading | Check browser console (F12) for errors |
| File upload not working | Try a smaller file or use text input |

---

**Reference Complete! Ready to use the AI Report Analyzer. 🚀**

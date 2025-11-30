# AI Report Analyzer - Visual Architecture & Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     HealthChain ID Application                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Frontend (HTML/CSS/JS)               │ │
│  │                                                          │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │            AI Report Analyzer Page              │   │ │
│  │  │                                                 │   │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │ │
│  │  │  │  Upload  │  │  Paste   │  │   Demo   │    │   │ │
│  │  │  │  File    │  │  Text    │  │   Data   │    │   │ │
│  │  │  └─────┬────┘  └────┬─────┘  └────┬─────┘    │   │ │
│  │  │        │             │             │          │   │ │
│  │  │        └─────────────┴─────────────┘          │   │ │
│  │  │               ▼                               │   │ │
│  │  │        ┌──────────────────┐                  │   │ │
│  │  │        │ analyzeReport()  │                  │   │ │
│  │  │        │ - Validate input │                  │   │ │
│  │  │        │ - Prepare prompt │                  │   │ │
│  │  │        │ - Build request  │                  │   │ │
│  │  │        └────────┬─────────┘                  │   │ │
│  │  │                 ▼                             │   │ │
│  │  │        Convert to Base64                     │   │ │
│  │  │        (if file upload)                      │   │ │
│  │  │                 ▼                             │   │ │
│  │  │        Build JSON request                    │   │ │
│  │  │        with parts array                      │   │ │
│  │  │                 │                             │   │ │
│  │  └─────────────────┼─────────────────────────────┘   │ │
│  │                    │                                  │ │
│  └────────────────────┼──────────────────────────────────┘ │
│                       │                                     │
│                       │ HTTPS POST                          │
│                       │ /v1beta/models/{model}:generateContent
│                       ▼                                     │
│      ┌────────────────────────────────────────┐            │
│      │    Google Cloud (Gemini API)           │            │
│      │                                        │            │
│      │  ┌──────────────────────────────────┐ │            │
│      │  │     Gemini 2.5 Flash Model       │ │            │
│      │  │                                  │ │            │
│      │  │  - Parse medical data            │ │            │
│      │  │  - Extract test values           │ │            │
│      │  │  - Compare to reference ranges   │ │            │
│      │  │  - Generate interpretation       │ │            │
│      │  │  - Create diet plan              │ │            │
│      │  │  - Return JSON response          │ │            │
│      │  └────────┬─────────────────────────┘ │            │
│      │           │                            │            │
│      │           │ JSON Response              │            │
│      │           ▼                            │            │
│      │  ┌──────────────────────────────────┐ │            │
│      │  │    Response Structure:           │ │            │
│      │  │  {                               │ │            │
│      │  │    classification: "Abnormal"    │ │            │
│      │  │    severity_score: 0.68          │ │            │
│      │  │    parsed_tests: [...]           │ │            │
│      │  │    diet_plan: {...}              │ │            │
│      │  │    interpretation: [...]         │ │            │
│      │  │  }                               │ │            │
│      │  └────────┬─────────────────────────┘ │            │
│      │           │                            │            │
│      └───────────┼────────────────────────────┘            │
│                  │                                         │
│                  │ HTTPS Response                          │
│                  ▼                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │         Frontend Result Rendering                 │  │
│  │                                                   │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │  displayResults()                        │    │  │
│  │  │  - Parse JSON response                   │    │  │
│  │  │  - Generate HTML tabs                    │    │  │
│  │  │  - Render tables with test results       │    │  │
│  │  │  - Show diet recommendations             │    │  │
│  │  │  - Display severity badge                │    │  │
│  │  │  - Show hospital finder (if critical)    │    │  │
│  │  └────────┬─────────────────────────────────┘    │  │
│  │           ▼                                       │  │
│  │  ┌──────────────────────────────────────────┐    │  │
│  │  │        Two-Tab UI Results Display        │    │  │
│  │  │                                          │    │  │
│  │  │  TAB 1: Lab Findings                     │    │  │
│  │  │  ├─ Severity Badge (colored)             │    │  │
│  │  │  ├─ Summary Text                         │    │  │
│  │  │  ├─ Test Results Table                   │    │  │
│  │  │  │  ├─ Test Name | Value | Range | Status   │    │  │
│  │  │  │  └─ Color-coded deviation             │    │  │
│  │  │  └─ Clinical Interpretation              │    │  │
│  │  │                                          │    │  │
│  │  │  TAB 2: Action Plan (if applicable)      │    │  │
│  │  │  ├─ Health Goal                          │    │  │
│  │  │  ├─ Foods to Include                     │    │  │
│  │  │  ├─ Foods to Avoid                       │    │  │
│  │  │  ├─ Sample Meal Plan                     │    │  │
│  │  │  ├─ Supplement Recommendations           │    │  │
│  │  │  ├─ Exercise Suggestions                 │    │  │
│  │  │  └─ Red Flags Alert                      │    │  │
│  │  └──────────────────────────────────────────┘    │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## User Journey Flow

```
START
  │
  ├─► Visit Dashboard
  │     │
  │     ├─► Login (if needed)
  │     │
  │     └─► Dashboard loads
  │           │
  │           └─► Scroll to AI Report Analyzer card
  │
  ├─► Click "📊 AI Medical Report"
  │     │
  │     └─► AI Analyzer page loads
  │
  ├─► Choice: Upload file OR Paste text
  │     │
  │     ├─► FILE UPLOAD PATH
  │     │   ├─ Drag & drop OR click to browse
  │     │   ├─ Select JPG/PNG/PDF
  │     │   └─ File preview shows
  │     │
  │     └─► TEXT INPUT PATH
  │         ├─ Clear any uploaded file
  │         ├─ Copy medical report text
  │         └─ Paste into textarea
  │
  ├─► (Optional) Set User Context
  │     ├─ Age: 45
  │     ├─ Sex: Male/Female/Other
  │     └─ Known Conditions: Hypertension, Diabetes
  │
  ├─► Click "Analyze Report"
  │     │
  │     ├─► Validation: Check input exists ✓
  │     ├─► Loading state: Show "Analyzing..." ⏳
  │     │
  │     └─► API Call to Gemini
  │           │
  │           ├─► Request: Text + System Prompt + Context
  │           ├─► Processing: AI analyzes report (10-30 sec)
  │           └─► Response: Structured JSON
  │
  ├─► Parse Response
  │     ├─ Extract classification
  │     ├─ Extract severity score
  │     ├─ Extract test results
  │     ├─ Extract diet plan
  │     └─ Extract recommendations
  │
  ├─► Display Results
  │     │
  │     ├─► Severity Badge (green/yellow/orange/red)
  │     │
  │     ├─► Tab 1: Lab Findings (default selected)
  │     │   ├─ Summary box
  │     │   ├─ Results table with color-coded status
  │     │   └─ Interpretation points
  │     │
  │     ├─► Tab 2: Action Plan (if diet_plan exists)
  │     │   ├─ Health goal
  │     │   ├─ Foods list
  │     │   ├─ Sample meals
  │     │   └─ Supplements & exercises
  │     │
  │     └─► (If Critical) Show alert + hospital finder
  │
  ├─► User Actions
  │     ├─ Read results & interpretation
  │     ├─ Switch between tabs
  │     ├─ Click hospital link (if critical)
  │     ├─ Scroll through recommendations
  │     └─ Share/save results (future feature)
  │
  └─► END
```

## Component Hierarchy

```
aiReportAnalyzerPage
│
└─ aiReportAnalyzerContainer
   │
   ├─ .analyzer-wrapper
   │  │
   │  ├─ .analyzer-header
   │  │  ├─ Logo (🏥)
   │  │  ├─ Title: MedCheck-GPT
   │  │  └─ Subtitle: AI Medical Report Analyzer
   │  │
   │  └─ .analyzer-main
   │     │
   │     ├─ .analyzer-section (Input Section)
   │     │  │
   │     │  ├─ .analyzer-section-header
   │     │  │  ├─ Title: "Upload or Paste Report"
   │     │  │  └─ Button: "Load Demo Data"
   │     │  │
   │     │  └─ .analyzer-content
   │     │     │
   │     │     ├─ .context-form-grid
   │     │     │  ├─ Age input
   │     │     │  ├─ Sex select
   │     │     │  └─ Conditions input
   │     │     │
   │     │     ├─ .file-upload-area (drag & drop)
   │     │     │
   │     │     ├─ .divider
   │     │     │
   │     │     ├─ .report-textarea (text input)
   │     │     │
   │     │     ├─ .error-message (if error)
   │     │     │
   │     │     └─ .btn-primary "Analyze Report"
   │     │
   │     └─ #resultsSection (hidden until analysis)
   │        │
   │        ├─ .severity-badge
   │        │  ├─ Icon (❤️ or ⚠️)
   │        │  ├─ Classification text
   │        │  ├─ Severity score text
   │        │  └─ Numerical score (0-100)
   │        │
   │        ├─ .critical-alert (if applicable)
   │        │  ├─ Icon (📍)
   │        │  ├─ Recommended specialty
   │        │  └─ Hospital finder link
   │        │
   │        ├─ .tabs
   │        │  ├─ Tab button: "📊 Lab Findings"
   │        │  └─ Tab button: "🍎 Action Plan" (optional)
   │        │
   │        ├─ .tab-content
   │        │  │
   │        │  ├─ Lab Findings Tab
   │        │  │  ├─ .summary-box
   │        │  │  ├─ .tests-table
   │        │  │  │  ├─ Headers: Test Name, Value, Reference, Status
   │        │  │  │  └─ Row per test (color-coded)
   │        │  │  └─ .interpretation
   │        │  │     └─ Bullet point list
   │        │  │
   │        │  └─ Action Plan Tab (if diet_plan)
   │        │     ├─ .goal-box
   │        │     ├─ .foods-grid
   │        │     │  ├─ Foods to include
   │        │     │  └─ Foods to avoid
   │        │     ├─ .meal-plan
   │        │     │  └─ 4 meal cards
   │        │     ├─ .supplements-box (if exists)
   │        │     └─ .red-flags (if exists)
   │        │
   │        └─ .disclaimer
   │           └─ Medical disclaimer text
```

## State Management Flow

```
┌─────────────────────────────────────────┐
│      analyzerState (Global Object)      │
├─────────────────────────────────────────┤
│                                         │
│  reportText: ""                         │
│  └─ ▲ Updated on textarea input        │
│    │ └─ Cleared on file upload         │
│                                         │
│  file: null                             │
│  └─ ▲ Set on file selection            │
│    │ └─ Cleared on text input          │
│                                         │
│  userContext: {                         │
│    age: 45,          ◄─── User edits   │
│    sex: "M",         ◄─── User selects │
│    conditions: ""    ◄─── User types   │
│  }                                      │
│                                         │
│  loading: false                         │
│  ├─ true during API call               │
│  └─ false when API returns             │
│                                         │
│  result: null                           │
│  └─ Set when API returns JSON          │
│                                         │
│  error: ""                              │
│  └─ Set when error occurs              │
│                                         │
│  activeTab: "report"                    │
│  └─ Switches between "report"/"diet"   │
│                                         │
└─────────────────────────────────────────┘

Flow:
User Input → analyzerState updated → UI re-rendered
```

## API Request/Response Cycle

```
┌──────────────────────────────┐
│   Frontend: analyzeReport()   │
│                              │
│  1. Validate input          │
│  2. Prepare prompt          │
│  3. Handle file (Base64)    │
│  4. Build parts array       │
│  5. Build JSON body         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│  HTTPS POST Request                              │
├──────────────────────────────────────────────────┤
│                                                  │
│  URL:                                           │
│  https://generativelanguage.googleapis.com/...  │
│                                                  │
│  Header: Content-Type: application/json        │
│                                                  │
│  Body: {                                        │
│    contents: [{                                 │
│      parts: [                                   │
│        { text: SYSTEM_PROMPT + ...},           │
│        { inlineData: { data, mimeType } }      │
│      ]                                         │
│    }],                                         │
│    generationConfig: {                         │
│      responseMimeType: "application/json"     │
│    }                                           │
│  }                                             │
│                                                  │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Google Gemini AI  │
        │    Processing...   │
        │   (10-30 seconds)  │
        └────────────┬───────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  HTTPS Response (200 OK)                         │
├──────────────────────────────────────────────────┤
│                                                  │
│  {                                              │
│    "candidates": [{                             │
│      "content": {                               │
│        "parts": [{                              │
│          "text": "{                             │
│            \"request_id\": \"req_...\",        │
│            \"parsed_tests\": [...],            │
│            \"classification\": \"Abnormal\",   │
│            \"severity_score\": 0.68,           │
│            \"diet_plan\": {...},               │
│            ...                                 │
│          }"                                    │
│        }]                                      │
│      }                                         │
│    }]                                          │
│  }                                             │
│                                                  │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────┐
│ Frontend: Parse Response │
│                          │
│ 1. Extract JSON text    │
│ 2. JSON.parse()         │
│ 3. Validate schema      │
│ 4. Store in state       │
│ 5. Display results      │
└──────────────────────────┘
```

## CSS Class Hierarchy

```
.analyzer-wrapper
├── .analyzer-header
│   └── .analyzer-header-content
│       ├── .analyzer-icon
│       ├── .analyzer-title
│       └── .analyzer-subtitle
│
└── .analyzer-main
    └── .analyzer-section
        ├── .analyzer-section-header
        └── .analyzer-content
            ├── .context-form-grid
            │   └── .form-group (x3)
            │       ├── .form-label
            │       └── .form-input
            │
            ├── .file-upload-area
            │   ├── .upload-content (initial)
            │   └── .file-selected (after upload)
            │
            ├── .divider
            ├── .report-textarea
            ├── .error-message
            └── .btn-primary

            Results Section (when data present)
            ├── .severity-badge
            │   ├── .severity-content
            │   │   ├── .severity-icon
            │   │   ├── .severity-title
            │   │   └── .severity-score
            │   └── .severity-number
            │
            ├── .critical-alert
            │   ├── .alert-icon
            │   ├── .alert-content
            │   └── .hospital-link
            │
            ├── .tabs
            │   └── .tab-btn (x2, active state)
            │
            └── .tab-content
                ├── Lab Findings Tab
                │   ├── .summary-box
                │   ├── .tests-table
                │   │   ├── thead
                │   │   └── tbody
                │   │       ├── .test-name
                │   │       ├── .test-value
                │   │       ├── .test-unit
                │   │       ├── .test-ref
                │   │       └── .status-badge
                │   └── .interpretation
                │
                └── Action Plan Tab
                    ├── .goal-box
                    ├── .foods-grid
                    │   ├── .foods-column
                    │   └── .foods-column
                    ├── .meal-plan
                    │   └── .meals-grid
                    │       └── .meal-card (x4)
                    ├── .supplements-box
                    └── .red-flags
```

## Mobile Responsive Breakpoints

```
MOBILE (< 640px)
├─ Single column layout
├─ Stack all form inputs vertically
├─ Smaller font sizes
├─ Full-width buttons
├─ One meal per row
└─ Optimized touch targets

TABLET (640px - 1024px)
├─ Two column layout for some sections
├─ Grid adjusts to fit
├─ Medium font sizes
├─ Buttons full-width
├─ Two meals per row
└─ Improved spacing

DESKTOP (> 1024px)
├─ Multi-column layouts
├─ Four form inputs per row
├─ Standard font sizes
├─ Wider containers
├─ Four meals per row
└─ Optimal spacing and padding
```

---

These diagrams provide a visual reference for:
- System architecture and data flow
- User journey and decision points
- Component hierarchy and nesting
- State management and updates
- API request/response cycle
- CSS class organization
- Responsive design breakpoints

**Use these to understand how all pieces fit together!** 🧩

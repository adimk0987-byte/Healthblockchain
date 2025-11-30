# AI Medical Report Analyzer - Integration Guide

## Overview

The AI Medical Report Analyzer is a new feature integrated into your HealthChain ID application that uses Google's Gemini AI to analyze medical reports and provide:

- ✅ Structured lab findings extraction
- ✅ Automatic interpretation of test results
- ✅ Severity classification (Normal, Slightly Abnormal, Abnormal, Critical)
- ✅ Personalized diet and lifestyle recommendations
- ✅ Hospital finder for critical cases
- ✅ Multi-language support (inherited from main app)

## Features

### 1. **Report Input Methods**
- **Upload Files**: Support for images (JPG, PNG) and PDF documents
- **Paste Text**: Direct text input for medical report data
- **Demo Data**: Pre-loaded sample report for testing

### 2. **User Context**
Personalize analysis with:
- Age
- Sex (Male/Female/Other)
- Known medical conditions (comma-separated)

### 3. **AI Analysis**
The system uses Google Gemini 2.5 Flash model to:
- Parse unstructured medical reports
- Extract test names, values, units, and reference ranges
- Calculate percent deviation from normal ranges
- Generate clinical interpretations
- Create actionable recommendations

### 4. **Results Display**
Two-tab interface:

#### **Lab Findings Tab**
- Summary of overall health status
- Detailed test results table with:
  - Test name and value
  - Reference ranges
  - Status (Normal/Abnormal with % deviation)
- Clinical interpretation points

#### **Action Plan Tab** (if applicable)
- Primary health goal
- Duration-based recommendations (weeks)
- Foods to include/avoid
- Sample daily meal plan (breakfast, lunch, snack, dinner)
- Supplement recommendations
- Exercise suggestions
- Monitoring schedule
- Red flags requiring immediate doctor consultation

### 5. **Critical Cases Alert**
- Special attention for "Critical" severity
- Recommended medical specialty
- Direct Google Maps link to find nearby hospitals

## Installation & Setup

### Step 1: Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. Create or select your project
3. Click "Create API Key"
4. Copy the generated key

### Step 2: Configure API Key

Open `ai-report-analyzer.js` (line 10):

```javascript
const GEMINI_API_KEY = "YOUR_API_KEY_HERE"; // Enter your key here
```

Replace `YOUR_API_KEY_HERE` with your actual Gemini API key.

**Note**: For production, use environment variables or backend proxies instead of storing keys in frontend code.

### Step 3: Verify Integration

The following files have been added/modified:

**New Files:**
- `ai-report-analyzer.js` - Core analyzer logic (450+ lines)
- `ai-report-analyzer.css` - Complete styling with responsive design

**Modified Files:**
- `index.html` - Added analyzer page section and CSS link
- `app.js` - Added navigation route for `aiReportAnalyzer`

### Step 4: Test the Feature

1. Start your app:
```powershell
cd 'c:\Users\Abhinav Mehta\Downloads\cardano'
python -m http.server 8000  # Frontend on port 8000
```

2. Navigate to: `http://localhost:8000`

3. **For Authenticated Users:**
   - Login to dashboard
   - Click the **"📊 AI Medical Report"** card
   - The AI Report Analyzer page will load

4. **Test Without Login:**
   - Navigate directly to the analyzer by calling in browser console:
     ```javascript
     navigateTo('aiReportAnalyzer');
     ```

## Usage Guide

### Demo Mode (No API Key Required)

1. Click **"Load Demo Data"** button
2. Review the pre-filled sample report
3. Click **"Analyze Report"**
4. *(Will show error if API key not configured)*

### Upload Your Report

1. **File Upload:**
   - Drag & drop image/PDF into the upload area, OR
   - Click to browse and select file
   - Maximum file size: depends on browser (typically 100MB+)

2. **Text Input:**
   - Clear any uploaded file
   - Paste medical report text into textarea
   - Format: `TEST_NAME: VALUE UNIT (Ref RANGE)`

### Analyze & Interpret

1. Set your **Age**, **Sex**, and **Known Conditions**
2. Click **"Analyze Report"** button
3. Wait for AI processing (10-30 seconds depending on report complexity)
4. Review results in:
   - **Lab Findings**: Detailed test breakdown
   - **Action Plan**: Diet/lifestyle recommendations (if applicable)

### Interpret Results

| Classification | Severity | Action |
|---|---|---|
| **Normal** | 0.0-0.25 | No immediate action needed. Maintain current health habits. |
| **Slightly Abnormal** | 0.26-0.5 | Consider lifestyle changes. Consult doctor if persistent. |
| **Abnormal** | 0.51-0.75 | Schedule doctor appointment. Follow recommendations. |
| **Critical** | 0.76-1.0 | Seek immediate medical attention. Use hospital finder. |

## API Integration Details

### Request Flow

```
User Input
   ↓
[Client] Construct Gemini Prompt
   ↓
[Gemini API] Analyze report + Generate JSON
   ↓
[Client] Parse & Display Results
```

### Request Format

```javascript
{
  "contents": [{
    "parts": [
      {
        "text": "SYSTEM_PROMPT + user_context + report_text"
      },
      {
        "inlineData": {
          "data": "base64_encoded_image_or_pdf",
          "mimeType": "image/jpeg|application/pdf"
        }
      }
    ]
  }],
  "generationConfig": {
    "responseMimeType": "application/json"
  }
}
```

### Response Schema

```json
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
    }
  ],
  "interpretation": [
    "Elevated cholesterol levels indicate cardiovascular risk",
    "LDL cholesterol is significantly above normal range"
  ],
  "classification": "Abnormal",
  "severity_score": 0.68,
  "diet_plan": {
    "primary_goal": "Reduce cholesterol and triglycerides",
    "duration_weeks": 12,
    "nutrition_overview": "Low-saturated-fat, high-fiber diet",
    "foods_to_include": ["Oats", "Almonds", "Salmon"],
    "foods_to_avoid": ["Red meat", "Butter", "Full-fat dairy"],
    "sample_one_day_meal_plan": {
      "breakfast": "Oatmeal with berries",
      "lunch": "Grilled salmon with vegetables",
      "snack": "Almonds and apple",
      "dinner": "Baked chicken breast with quinoa"
    },
    "supplements": [
      {"name": "Omega-3", "dose": "1000mg daily", "notes": "Fish oil supplement"},
      {"name": "Fiber", "dose": "10g daily", "notes": "Psyllium husk"}
    ],
    "exercise": ["30 min walking daily", "Weight training 3x/week"],
    "monitoring": [
      {"test_name": "Lipid Panel", "when_weeks": 4},
      {"test_name": "Lipid Panel", "when_weeks": 12}
    ],
    "red_flags": [
      "Chest pain or shortness of breath",
      "Severe headaches",
      "Confusion or dizziness"
    ]
  },
  "recommended_specialty": "Cardiologist",
  "hospital_search_query": "cardiology hospitals near me",
  "human_summary": "Your lipid panel shows elevated cholesterol...",
  "follow_up_questions": ["Any family history of heart disease?"],
  "disclaimer": "This is AI-generated analysis for informational purposes only..."
}
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|---|---|---|
| **No response from AI** | API timeout or no internet | Check connection, try again |
| **API Error: 400** | Invalid API key | Verify key in `ai-report-analyzer.js` |
| **API Error: 403** | Insufficient quota | Check Google Cloud billing |
| **JSON Parse Error** | AI returned non-JSON | Try a simpler report format |
| **File too large** | Browser upload limit | Use text input instead |

### Debug Mode

Open browser console (F12) to see:
- Detailed error messages
- API request/response logs
- Prompt construction

## Customization

### Change Gemini Model

In `ai-report-analyzer.js` (line 12):
```javascript
const GEMINI_MODEL = "gemini-2.0-pro"; // Try other models
```

Available models:
- `gemini-2.5-flash-preview-09-2025` (default, fastest)
- `gemini-2.0-pro` (more accurate)
- `gemini-2.0-flash` (balanced)

### Modify Analysis Prompt

Edit `SYSTEM_PROMPT` (lines 14-45) to customize:
- Analysis depth
- Output format
- Specific medical focus areas

### Change UI Colors

In `ai-report-analyzer.css`:
- Primary color: `#0d9488` (teal)
- Success color: `#059669` (green)
- Critical color: `#ef4444` (red)

Find-replace to match your brand colors.

## Production Deployment

### Security Best Practices

1. **Never expose API keys in frontend code** - Use backend proxy:
   ```javascript
   // Instead of direct API call
   fetch('https://api.gemini.google.com/...',{
     headers: { 'Authorization': 'Bearer KEY' }
   });
   
   // Do this - proxy through backend
   fetch('/api/analyze-report', {
     method: 'POST',
     body: JSON.stringify(report)
   });
   ```

2. **Backend Proxy Example** (Node.js):
   ```javascript
   app.post('/api/analyze-report', async (req, res) => {
     const result = await fetch('https://generativelanguage.googleapis.com/...', {
       headers: {
         'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
       }
     });
     res.json(await result.json());
   });
   ```

3. **Rate Limiting**: Add throttling to prevent abuse
   ```javascript
   const rateLimit = require('express-rate-limit');
   app.use('/api/analyze-report', 
     rateLimit({ windowMs: 60*1000, max: 10 })
   );
   ```

4. **HIPAA Compliance** (if handling real medical data):
   - Use HTTPS only
   - Implement audit logging
   - Add data retention policies
   - Get proper consent before analysis

### Deployment Steps

1. **Add backend proxy** (replace frontend API call)
2. **Store API key** in `.env` or secure vault
3. **Enable HTTPS** on production domain
4. **Test thoroughly** with sample reports
5. **Add rate limiting** to prevent abuse
6. **Monitor API usage** via Google Cloud Console
7. **Set up error tracking** (Sentry, LogRocket, etc.)

## Troubleshooting

### Report not analyzing?

1. **Check API Key**: Ensure it's valid and properly copied
2. **Check Quota**: Visit [Google Cloud Console](https://console.cloud.google.com) → Quotas
3. **Check Internet**: Verify network connection
4. **Check Report Format**: Try with demo data first

### Results look incorrect?

1. **Check Report Clarity**: Poor image quality = poor analysis
2. **Check Language**: AI works best with English reports
3. **Check Format**: Ensure test names and values are clearly separated

### CSS not loading?

1. Verify `ai-report-analyzer.css` exists in project root
2. Check browser DevTools → Network tab for 404 errors
3. Clear browser cache (Ctrl+Shift+Del)

### Still having issues?

1. Open browser console (F12)
2. Check for JavaScript errors
3. Try with demo data first
4. Check Google Gemini API documentation

## Testing Checklist

- [ ] API key configured and valid
- [ ] Demo data loads correctly
- [ ] Upload file functionality works (image & PDF)
- [ ] Text input with paste works
- [ ] Analysis completes successfully
- [ ] Results display all sections (Lab Findings tab)
- [ ] Diet plan appears when applicable (Action Plan tab)
- [ ] Hospital link works for critical cases
- [ ] Mobile responsiveness verified
- [ ] Dark mode displays correctly
- [ ] All translations intact (language switching works)
- [ ] Error messages show properly
- [ ] Loading state shows during analysis

## Support Resources

- **Google Gemini Docs**: https://ai.google.dev/docs
- **MedCheck-GPT System Prompt**: See lines 14-45 in `ai-report-analyzer.js`
- **Report Format Examples**: See `DEMO_REPORT_TEXT` in `ai-report-analyzer.js`
- **HealthChain Support**: Check README.md

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Status**: Production Ready (with backend proxy for security)

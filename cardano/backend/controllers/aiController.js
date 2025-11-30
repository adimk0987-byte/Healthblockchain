/**
 * AI Controller - Simulated AI diagnosis engine. Lightweight, deterministic, and pluggable.
 * The design allows replacing `simulateDiagnosis` with a call to an external AI service.
 */
const { v4: uuidv4 } = require('uuid');

function simulateDiagnosis({ symptoms, file }) {
  // Very small heuristic-based simulation: look for keywords
  const s = (symptoms || '').toLowerCase();
  const result = { id: uuidv4(), suggestions: [], severity: 'low', emergency: false, confidence: 0.65 };
  if (!s) {
    result.suggestions.push('No symptoms provided. Provide more context.');
    return result;
  }
  if (s.includes('chest') || s.includes('breath') || s.includes('shortness')) {
    result.severity = 'high'; result.emergency = true; result.confidence = 0.9;
    result.suggestions.push('Seek emergency care: possible cardiac or respiratory issue.');
  } else if (s.includes('fever') || s.includes('cough')) {
    result.severity = 'medium'; result.confidence = 0.78;
    result.suggestions.push('Rest, hydration, monitor symptoms. If worsening, consult doctor.');
  } else {
    result.severity = 'low'; result.confidence = 0.6;
    result.suggestions.push('Mild symptoms. Home remedies: rest, fluids, paracetamol if needed.');
  }
  // Add follow-up days suggestion
  result.followUpDays = result.severity === 'high' ? 0 : result.severity === 'medium' ? 3 : 7;
  // optional file analysis stub
  if (file) result.suggestions.push('Attachment received (not analyzed in demo).');
  return result;
}

async function diagnose(req, res) {
  try {
    const { symptoms } = req.body;
    const file = req.file;
    const aiResponse = simulateDiagnosis({ symptoms, file });
    return res.json({ ai: aiResponse });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { diagnose };

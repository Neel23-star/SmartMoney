function analyzeRequest({ employee_name, employee_id, request_type, department, description, amount, attachment_name }) {
  const warnings = [];
  if (!attachment_name) warnings.push('⚠️ Mandatory policy attachment missing.');
  if (!description || description.length < 20) warnings.push('⚠️ Request description is too brief.');
  if (!employee_id) warnings.push('⚠️ Employee ID is missing.');
  if (!department) warnings.push('⚠️ Department information is missing.');
  if (!amount || amount <= 0) warnings.push('⚠️ Budget/Amount field is required.');

  const urgencyKeywords = ['urgent', 'immediate', 'asap', 'critical', 'production issue', 'emergency', 'blocker'];
  const isUrgent = urgencyKeywords.some(k => (description || '').toLowerCase().includes(k));

  let risk_level = amount > 50000 ? 'High' : (amount > 10000 || isUrgent) ? 'Medium' : 'Low';
  let ai_recommendation = warnings.length > 1 ? 'Reject' : (warnings.length === 1 || risk_level !== 'Low') ? 'Review Further' : 'Approve';

  let suggested_category = 'Standard';
  if (isUrgent || request_type === 'Rush') suggested_category = 'Rush';
  else if (request_type === 'NOPO') suggested_category = 'NOPO';
  else if (request_type === 'PERN') suggested_category = 'PERN';

  const urgencyNote = isUrgent ? ' Urgency indicators detected in description.' : '';
  const ai_summary = `Request from ${employee_name || 'Unknown'} (${department || 'Unknown'}) for ${request_type || 'Standard'} - ${suggested_category} routing. Amount: $${amount || 0}.${urgencyNote} Risk: ${risk_level}. AI recommends: ${ai_recommendation}.`;

  const routing_path = [
    { level: 1, title: 'Level 1 Approver', role: 'Direct Manager', status: 'Pending' },
    { level: 2, title: 'Level 2 Manager', role: 'Department Head', status: 'Pending' }
  ];
  if (risk_level === 'High' || amount > 25000 || request_type === 'NOPO') {
    routing_path.push({ level: 3, title: 'Level 3 Business Approval', role: 'Finance & Compliance', status: 'Pending' });
  }

  return { ai_summary, risk_level, warnings, suggested_category, ai_recommendation, routing_path, isUrgent };
}

module.exports = { analyzeRequest };

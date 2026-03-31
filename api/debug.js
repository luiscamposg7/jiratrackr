module.exports = async function handler(req, res) {
  const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'NOT SET';
  const JIRA_EMAIL = process.env.JIRA_EMAIL || 'NOT SET';
  const token = process.env.JIRA_API_TOKEN || 'NOT SET';

  const credentials = Buffer.from(`${JIRA_EMAIL}:${token}`).toString('base64');

  // Test /myself to verify credentials
  const r = await fetch(`${JIRA_BASE_URL}/rest/api/3/myself`, {
    headers: { 'Authorization': `Basic ${credentials}`, 'Accept': 'application/json' }
  });
  const body = await r.json();

  res.json({
    url: JIRA_BASE_URL,
    email: JIRA_EMAIL,
    tokenLength: token.length,
    tokenStart: token.slice(0, 8),
    tokenEnd: token.slice(-8),
    jiraStatus: r.status,
    jiraResponse: body,
  });
};

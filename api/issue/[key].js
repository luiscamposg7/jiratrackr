const { buildGanttData } = require('../../lib/gantt');

module.exports = async function handler(req, res) {
  const { key } = req.query;

  const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
  const JIRA_EMAIL = process.env.JIRA_EMAIL;
  const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    return res.status(500).json({ error: 'Faltan variables de entorno JIRA_BASE_URL, JIRA_EMAIL o JIRA_API_TOKEN' });
  }

  const credentials = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const issueKey = String(key).toUpperCase();

  try {
    const response = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}?expand=changelog&fields=summary,status,assignee,created,resolutiondate,priority,issuetype`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Jira API error ${response.status}: ${text}` });
    }

    const data = await response.json();
    const gantt = buildGanttData(data);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(gantt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

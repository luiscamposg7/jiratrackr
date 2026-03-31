require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { buildGanttData } = require('./lib/gantt');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

async function jiraFetch(apiPath) {
  const fetch = (await import('node-fetch')).default;
  const url = `${JIRA_BASE_URL}/rest/api/3${apiPath}`;
  const credentials = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const res = await fetch(url, {
    headers: { 'Authorization': `Basic ${credentials}`, 'Accept': 'application/json' }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API error ${res.status}: ${text}`);
  }
  return res.json();
}

app.get('/api/issue/:key', async (req, res) => {
  try {
    const issueKey = req.params.key.toUpperCase();
    const data = await jiraFetch(`/issue/${issueKey}?expand=changelog&fields=summary,status,assignee,created,resolutiondate,priority,issuetype`);
    res.json(buildGanttData(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Jira Gantt running at http://localhost:${PORT}`));

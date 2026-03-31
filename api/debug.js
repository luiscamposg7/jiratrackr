module.exports = async function handler(req, res) {
  const url = process.env.JIRA_BASE_URL || 'NOT SET';
  const email = process.env.JIRA_EMAIL || 'NOT SET';
  const token = process.env.JIRA_API_TOKEN || 'NOT SET';

  res.json({
    urlLength: url.length,
    urlValue: url,
    emailValue: email,
    tokenLength: token.length,
    tokenStart: token.slice(0, 10),
    tokenEnd: token.slice(-10),
  });
};

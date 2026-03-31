function buildGanttData(issue) {
  const changelog = issue.changelog?.histories || [];
  const sorted = [...changelog].sort((a, b) => new Date(a.created) - new Date(b.created));

  const transitions = [];
  for (const history of sorted) {
    for (const item of history.items) {
      if (item.field === 'status') {
        transitions.push({
          from: item.fromString,
          to: item.toString,
          at: history.created,
          author: history.author?.displayName || 'Unknown',
        });
      }
    }
  }

  const issueCreated = issue.fields.created;
  const segments = [];

  if (transitions.length === 0) {
    segments.push({
      status: issue.fields.status.name,
      start: issueCreated,
      end: null,
      durationMs: Date.now() - new Date(issueCreated).getTime(),
      isActive: true,
    });
  } else {
    segments.push({
      status: transitions[0].from,
      start: issueCreated,
      end: transitions[0].at,
      durationMs: new Date(transitions[0].at) - new Date(issueCreated),
      isActive: false,
    });

    for (let i = 0; i < transitions.length - 1; i++) {
      segments.push({
        status: transitions[i].to,
        start: transitions[i].at,
        end: transitions[i + 1].at,
        durationMs: new Date(transitions[i + 1].at) - new Date(transitions[i].at),
        isActive: false,
      });
    }

    const lastTransition = transitions[transitions.length - 1];
    const endDate = issue.fields.resolutiondate || null;
    segments.push({
      status: lastTransition.to,
      start: lastTransition.at,
      end: endDate,
      durationMs: endDate
        ? new Date(endDate) - new Date(lastTransition.at)
        : Date.now() - new Date(lastTransition.at),
      isActive: !endDate,
    });
  }

  const timeByStatus = {};
  for (const seg of segments) {
    timeByStatus[seg.status] = (timeByStatus[seg.status] || 0) + seg.durationMs;
  }

  return {
    key: issue.key,
    summary: issue.fields.summary,
    issueType: issue.fields.issuetype?.name,
    priority: issue.fields.priority?.name,
    assignee: issue.fields.assignee?.displayName || 'Unassigned',
    currentStatus: issue.fields.status.name,
    created: issueCreated,
    resolved: issue.fields.resolutiondate,
    transitions,
    segments,
    timeByStatus,
  };
}

module.exports = { buildGanttData };

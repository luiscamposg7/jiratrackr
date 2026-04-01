function isDone(status) {
  const s = (status || '').toLowerCase();
  return s.includes('finaliz') || s.includes('done') || s.includes('listo') ||
    s.includes('closed') || s.includes('resolved') || s.includes('resuelto');
}

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
    if (isDone(lastTransition.to)) {
      // Done state: close the previous segment at the transition time, skip done segment
      if (segments.length > 0) {
        segments[segments.length - 1].end = lastTransition.at;
        segments[segments.length - 1].isActive = false;
        const prev = segments[segments.length - 1];
        prev.durationMs = new Date(prev.end) - new Date(prev.start);
      }
    } else {
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
  }

  const resolvedDate = issue.fields.resolutiondate ||
    (isDone(issue.fields.status.name) && transitions.length > 0
      ? transitions[transitions.length - 1].at
      : null);

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
    resolved: resolvedDate,
    transitions,
    segments,
    timeByStatus,
  };
}

module.exports = { buildGanttData };

export interface Segment {
  status: string
  start: string
  end: string | null
  durationMs: number
  isActive: boolean
}

export interface Transition {
  from: string
  to: string
  at: string
  author: string
}

export interface IssueGantt {
  key: string
  summary: string
  issueType: string | null
  priority: string | null
  assignee: string
  currentStatus: string
  created: string
  resolved: string | null
  transitions: Transition[]
  segments: Segment[]
  timeByStatus: Record<string, number>
}

import { Badge } from '@/components/base/badges/badges'
import type { IssueGantt } from '../types'
import { fmtDate, fmtDuration, fmtRelativeTime, getStatusBadgeColor, getStatusSvgColor } from '../utils'
import { GanttChart } from './GanttChart'
import type { BadgeColors } from '@/components/base/badges/badge-types'

interface IssueCardProps {
  issue: IssueGantt
}

const JIRA_BASE = (import.meta as any).env?.VITE_JIRA_BASE_URL ?? 'https://prestamype.atlassian.net'

function ArrowRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getPriorityColor(priority: string): BadgeColors {
  const p = priority.toLowerCase()
  if (p.includes('highest') || p.includes('critical') || p.includes('blocker')) return 'error'
  if (p.includes('high') || p.includes('alta')) return 'warning'
  if (p.includes('medium') || p.includes('media')) return 'blue'
  if (p.includes('low') || p.includes('baja')) return 'gray-blue'
  return 'gray'
}

function getIssueTypeColor(type: string): BadgeColors {
  const t = type.toLowerCase()
  if (t.includes('bug') || t.includes('defecto')) return 'error'
  if (t.includes('epic')) return 'purple'
  if (t.includes('story') || t.includes('historia')) return 'indigo'
  if (t.includes('task') || t.includes('tarea')) return 'blue'
  if (t.includes('sub')) return 'gray-blue'
  return 'gray'
}

export function IssueCard({ issue }: IssueCardProps) {
  const totalMs = issue.segments.reduce((a, s) => a + s.durationMs, 0)

  return (
    <div className="rounded-2xl bg-secondary ring-1 ring-primary overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-primary">
        <a
          href={`${JIRA_BASE}/browse/${issue.key}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 font-bold text-lg whitespace-nowrap hover:underline leading-none"
        >
          {issue.key}
        </a>
        <span className="flex-1 text-lg font-bold text-primary min-w-[160px] leading-snug">
          {issue.summary}
        </span>
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium text-tertiary uppercase tracking-wide leading-none mb-0.5">
              Tiempo total
            </span>
            <span className="text-lg font-bold text-primary leading-none">
              {fmtDuration(totalMs)}
            </span>
          </div>
          <div className="w-px h-8 bg-border-primary" />
          <Badge color={getStatusBadgeColor(issue.currentStatus)} size="sm" type="color">
            {issue.currentStatus}
          </Badge>
        </div>
      </div>

      {/* Meta badges row */}
      <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-primary">
        {issue.issueType && (
          <Badge color={getIssueTypeColor(issue.issueType)} size="sm" type="color">
            Tipo: {issue.issueType}
          </Badge>
        )}
        {issue.priority && (
          <Badge color={getPriorityColor(issue.priority)} size="sm" type="color">
            Prioridad: {issue.priority}
          </Badge>
        )}
        <Badge color="gray" size="sm" type="color">
          Asignado: {issue.assignee}
        </Badge>
        <Badge color="gray-blue" size="sm" type="color">
          Creado: {fmtDate(issue.created)}
        </Badge>
        {issue.resolved && (
          <Badge color="success" size="sm" type="color">
            Resuelto: {fmtDate(issue.resolved)}
          </Badge>
        )}
      </div>

      {/* Gantt chart */}
      <div className="px-5 py-5">
        <GanttChart segments={issue.segments} />
      </div>

      {/* Time by status stats */}
      <div className="flex flex-wrap gap-2 px-5 pb-4 border-t border-primary pt-4">
        {Object.entries(issue.timeByStatus)
          .sort((a, b) => b[1] - a[1])
          .map(([status, ms]) => {
            const pct = (ms / totalMs) * 100
            const pctLabel = pct.toFixed(1)
            const color = getStatusSvgColor(status)
            return (
              <div
                key={status}
                className="flex items-center gap-2 rounded-lg bg-tertiary px-3 py-1.5 text-xs ring-1 ring-primary"
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: color,
                  opacity: 0.1,
                  pointerEvents: 'none',
                }} />
                <span className="size-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-tertiary">{status}</span>
                <span className="font-semibold text-primary">{fmtDuration(ms)}</span>
                <span className="text-quaternary">{pctLabel}%</span>
              </div>
            )
          })}
      </div>

      {/* Transitions table */}
      {issue.transitions.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-quaternary mb-3">
            Historial de transiciones
          </p>
          <div className="rounded-xl overflow-hidden ring-1 ring-primary">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-tertiary">
                  <th className="text-left px-4 py-2.5 font-medium text-tertiary border-b border-primary">Fecha</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tertiary border-b border-primary">Transición</th>
                  <th className="text-left px-4 py-2.5 font-medium text-tertiary border-b border-primary">Por</th>
                </tr>
              </thead>
              <tbody>
                {issue.transitions.map((t, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-primary' : 'bg-secondary'}>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="text-tertiary">{fmtDate(t.at)}</span>
                      <span className="block text-quaternary" style={{ fontSize: 10 }}>{fmtRelativeTime(t.at)}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <Badge color={getStatusBadgeColor(t.from)} size="sm" type="color">
                          {t.from}
                        </Badge>
                        <span className="text-quaternary">
                          <ArrowRight />
                        </span>
                        <Badge color={getStatusBadgeColor(t.to)} size="sm" type="color">
                          {t.to}
                        </Badge>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-tertiary">{t.author}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

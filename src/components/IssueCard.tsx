import { Badge } from '@/components/base/badges/badges'
import type { IssueGantt } from '../types'
import { fmtDate, fmtDuration, getStatusBadgeColor, getStatusSvgColor } from '../utils'
import { GanttChart } from './GanttChart'

interface IssueCardProps {
  issue: IssueGantt
}

export function IssueCard({ issue }: IssueCardProps) {
  const totalMs = issue.segments.reduce((a, s) => a + s.durationMs, 0)

  return (
    <div className="rounded-2xl bg-secondary ring-1 ring-primary overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3 px-5 py-4 border-b border-primary">
        <a
          href={`${window.location.origin.replace('5173', '3000').replace('localhost:3000', 'prestamype.atlassian.net')}/browse/${issue.key}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 font-bold text-sm whitespace-nowrap hover:underline"
        >
          {issue.key}
        </a>
        <span className="flex-1 text-sm font-medium text-primary min-w-[160px]">
          {issue.summary}
        </span>
        <Badge color={getStatusBadgeColor(issue.currentStatus)} size="sm" type="color">
          {issue.currentStatus}
        </Badge>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 px-5 py-3 border-b border-primary text-xs text-tertiary">
        {issue.issueType && (
          <span><span className="text-secondary font-medium">Tipo:</span> {issue.issueType}</span>
        )}
        {issue.priority && (
          <span><span className="text-secondary font-medium">Prioridad:</span> {issue.priority}</span>
        )}
        <span><span className="text-secondary font-medium">Asignado:</span> {issue.assignee}</span>
        <span><span className="text-secondary font-medium">Creado:</span> {fmtDate(issue.created)}</span>
        {issue.resolved && (
          <span><span className="text-secondary font-medium">Resuelto:</span> {fmtDate(issue.resolved)}</span>
        )}
        <span><span className="text-secondary font-medium">Tiempo total:</span> {fmtDuration(totalMs)}</span>
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
            const pct = ((ms / totalMs) * 100).toFixed(1)
            const color = getStatusSvgColor(status)
            return (
              <div
                key={status}
                className="flex items-center gap-2 rounded-lg bg-tertiary px-3 py-1.5 text-xs ring-1 ring-primary"
              >
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span className="text-tertiary">{status}</span>
                <span className="font-semibold text-primary">{fmtDuration(ms)}</span>
                <span className="text-quaternary">{pct}%</span>
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
                  <tr
                    key={i}
                    className={i % 2 === 0 ? 'bg-primary' : 'bg-secondary'}
                  >
                    <td className="px-4 py-2.5 text-tertiary whitespace-nowrap">{fmtDate(t.at)}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <Badge color={getStatusBadgeColor(t.from)} size="sm" type="color">
                          {t.from}
                        </Badge>
                        <span className="text-quaternary">→</span>
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

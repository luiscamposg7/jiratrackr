import { useState } from 'react'
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

  // Status filter state
  const allStatuses = [...new Set(issue.segments.map(s => s.status))]
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  function toggleStatus(status: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  const filteredSegments = issue.segments.filter(s => !excluded.has(s.status))
  const filteredMs = Object.entries(issue.timeByStatus)
    .filter(([s]) => !excluded.has(s))
    .reduce((a, [, ms]) => a + ms, 0)
  const savedMs = totalMs - filteredMs
  const hasFilter = excluded.size > 0

  // End date
  const endDate = issue.resolved ?? issue.segments.at(-1)?.end ?? null
  const isActive = !endDate

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
          <div className="w-px h-8" style={{ background: 'var(--color-border-primary)' }} />
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

      {/* Fecha de finalización prominente */}
      <div className="flex items-center gap-6 px-5 py-4 border-b border-primary"
        style={{ background: 'var(--color-bg-tertiary)' }}>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-quaternary mb-1">Inicio</span>
          <span className="text-sm font-semibold text-primary">{fmtDate(issue.created)}</span>
        </div>

        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: 'var(--color-border-secondary)' }} />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-tertiary flex-shrink-0">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex-1 h-px" style={{ background: 'var(--color-border-secondary)' }} />
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-quaternary mb-1">
            {isActive ? 'En curso' : 'Finalización'}
          </span>
          {isActive ? (
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-semibold text-primary">Activo ahora</span>
            </div>
          ) : (
            <span className="text-display-xs font-bold text-primary leading-none">
              {fmtDate(endDate)}
            </span>
          )}
        </div>
      </div>

      {/* Status toggles + Gantt */}
      <div className="px-5 pt-4 pb-2">
        {/* Toggle chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {allStatuses.map(status => {
            const color = getStatusSvgColor(status)
            const ms = issue.timeByStatus[status] ?? 0
            const pct = ((ms / totalMs) * 100).toFixed(0)
            const isExcluded = excluded.has(status)
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                title={isExcluded ? `Incluir "${status}"` : `Excluir "${status}"`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px',
                  borderRadius: 8,
                  border: `1px solid ${isExcluded ? 'var(--color-border-secondary)' : color + '55'}`,
                  background: isExcluded ? 'var(--color-bg-tertiary)' : color + '18',
                  cursor: 'pointer',
                  opacity: isExcluded ? 0.5 : 1,
                  transition: 'all 150ms ease',
                }}
              >
                {/* Checkbox visual */}
                <span style={{
                  width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${isExcluded ? 'var(--color-border-primary)' : color}`,
                  background: isExcluded ? 'transparent' : color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!isExcluded && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: isExcluded ? 'var(--color-text-quaternary)' : 'var(--color-text-primary)',
                  textDecoration: isExcluded ? 'line-through' : 'none',
                }}>
                  {status}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-quaternary)' }}>
                  {pct}%
                </span>
              </button>
            )
          })}
        </div>

        {/* Filtered total callout */}
        {hasFilter && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-3 text-xs"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-secondary)' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-tertiary flex-shrink-0">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v3.5L10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span className="text-tertiary">Tiempo sin estados excluidos:</span>
            <span className="font-bold text-primary">{fmtDuration(filteredMs)}</span>
            <span className="text-quaternary">·</span>
            <span className="text-success-primary font-medium">−{fmtDuration(savedMs)} menos</span>
          </div>
        )}

        {/* Gantt chart */}
        {filteredSegments.length > 0 ? (
          <GanttChart segments={filteredSegments} />
        ) : (
          <div className="flex items-center justify-center rounded-xl py-10 text-sm text-tertiary"
            style={{ border: '1px dashed var(--color-border-secondary)' }}>
            Activa al menos un estado para ver el Gantt
          </div>
        )}
      </div>

      {/* Time by status stats */}
      <div className="flex flex-wrap gap-2 px-5 pb-4 pt-3 border-t border-primary">
        {Object.entries(issue.timeByStatus)
          .sort((a, b) => b[1] - a[1])
          .map(([status, ms]) => {
            const pct = (ms / totalMs) * 100
            const pctLabel = pct.toFixed(1)
            const color = getStatusSvgColor(status)
            const isExcluded = excluded.has(status)
            return (
              <div
                key={status}
                className="flex items-center gap-2 rounded-lg bg-tertiary px-3 py-1.5 text-xs ring-1 ring-primary"
                style={{ position: 'relative', overflow: 'hidden', opacity: isExcluded ? 0.4 : 1, transition: 'opacity 150ms ease' }}
              >
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct}%`, background: color, opacity: 0.1, pointerEvents: 'none',
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
                        <Badge color={getStatusBadgeColor(t.from)} size="sm" type="color">{t.from}</Badge>
                        <span className="text-quaternary"><ArrowRight /></span>
                        <Badge color={getStatusBadgeColor(t.to)} size="sm" type="color">{t.to}</Badge>
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

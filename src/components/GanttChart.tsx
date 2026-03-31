import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Segment } from '../types'
import { fmtDate, fmtDuration, getStatusSvgColor } from '../utils'

interface GanttChartProps {
  segments: Segment[]
}

const LABEL_W = 188
const ROW_H = 44
const BAR_H = 28
const BAR_PAD = (ROW_H - BAR_H) / 2
const AXIS_H = 30
const PX_PER_DAY = 24

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function generateTicks(startTs: number, endTs: number): Date[] {
  const ticks: Date[] = []
  const start = new Date(startTs)
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)

  while (cursor.getTime() <= endTs + 86400000) {
    if (cursor.getTime() >= startTs - 86400000) {
      ticks.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 5)
  }

  return ticks
}

function fmtTickLabel(date: Date): string {
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

interface TooltipState {
  seg: Segment
  x: number
  y: number
}

export function GanttChart({ segments }: GanttChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const startTs = new Date(segments[0].start).getTime()
  const endTs = segments[segments.length - 1].end
    ? new Date(segments[segments.length - 1].end!).getTime()
    : Date.now()
  const spanMs = Math.max(endTs - startTs, 1)
  const spanDays = spanMs / 86400000

  const CHART_W = Math.max(600, Math.ceil(spanDays * PX_PER_DAY)) + 80

  // Ordered unique statuses (first-seen order)
  const statusOrder: string[] = []
  for (const seg of segments) {
    if (!statusOrder.includes(seg.status)) statusOrder.push(seg.status)
  }
  const numRows = statusOrder.length

  // Statuses that have at least one active segment — glow applies to ALL bars of that status
  const activeStatuses = new Set(segments.filter(s => s.isActive).map(s => s.status))
  const svgH = numRows * ROW_H + AXIS_H

  function tsToX(ts: number): number {
    return ((ts - startTs) / spanMs) * CHART_W
  }

  // ── Grid lines + axis ticks ──────────────────────────────────────────────
  const ticks = generateTicks(startTs, endTs)
  const gridLines: ReactNode[] = []
  const axisLabels: ReactNode[] = []

  const axisY = numRows * ROW_H

  ticks.forEach((date, i) => {
    const tx = tsToX(date.getTime())
    if (tx < 4 || tx > CHART_W - 4) return
    gridLines.push(
      <line key={`g${i}`}
        x1={tx} y1={0} x2={tx} y2={axisY}
        stroke="var(--color-border-secondary)" strokeWidth={1}
        strokeDasharray="3 3" opacity={0.6} />
    )
    axisLabels.push(
      <line key={`tm${i}`}
        x1={tx} y1={axisY} x2={tx} y2={axisY + 5}
        stroke="var(--color-border-primary)" strokeWidth={1} />
    )
    axisLabels.push(
      <text key={`a${i}`}
        x={tx} y={axisY + 18}
        textAnchor="middle"
        fontSize={12}
        fontFamily="var(--font-body)"
        fill="var(--color-text-tertiary)">
        {fmtTickLabel(date)}
      </text>
    )
  })

  // ── Today line ────────────────────────────────────────────────────────────
  const nowTs = Date.now()
  const nowLine = nowTs >= startTs && nowTs <= endTs + 86400000 * 2 ? (() => {
    const nx = tsToX(nowTs)
    return (
      <g>
        <line x1={nx} y1={0} x2={nx} y2={numRows * ROW_H}
          stroke="#f79009" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.8} />
        <rect x={nx - 14} y={2} width={28} height={16} rx={4}
          fill="#f79009" opacity={0.15} />
        <text x={nx} y={13}
          textAnchor="middle"
          fontSize={9} fontFamily="var(--font-body)" fontWeight={700}
          fill="#f79009">
          HOY
        </text>
      </g>
    )
  })() : null

  // ── End date line (only when ticket is resolved) ─────────────────────────
  const lastEnd = segments[segments.length - 1].end
  const endLine = lastEnd ? (() => {
    // Clamp to right edge — endTs maps to exactly CHART_W, show it there
    const ex = Math.min(tsToX(new Date(lastEnd).getTime()), CHART_W - 1)
    const label = new Date(lastEnd).toLocaleDateString('es', { day: 'numeric', month: 'short' })
    return (
      <g>
        <line x1={ex} y1={0} x2={ex} y2={numRows * ROW_H}
          stroke="#17b26a" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.9} />
        <rect x={ex - 20} y={2} width={40} height={16} rx={4}
          fill="#17b26a" opacity={0.15} />
        <text x={ex} y={13}
          textAnchor="middle"
          fontSize={9} fontFamily="var(--font-body)" fontWeight={700}
          fill="#17b26a">
          FIN
        </text>
        <text x={ex} y={axisY + 18}
          textAnchor="middle"
          fontSize={12} fontFamily="var(--font-body)" fontWeight={600}
          fill="#17b26a">
          {label}
        </text>
      </g>
    )
  })() : null

  // ── Bars ──────────────────────────────────────────────────────────────────
  const bars: ReactNode[] = []
  segments.forEach((seg, si) => {
    const rowIdx = statusOrder.indexOf(seg.status)
    const rowY = rowIdx * ROW_H
    const color = getStatusSvgColor(seg.status)
    const x1 = tsToX(new Date(seg.start).getTime())
    const x2 = tsToX(seg.end ? new Date(seg.end).getTime() : Date.now())
    const barW = Math.max(x2 - x1, 8)
    const barY = rowY + BAR_PAD
    const dur = fmtDuration(seg.durationMs)

    const isHovered = hoveredIdx === si
    const isDimmed = hoveredIdx !== null && !isHovered

    bars.push(
      <g key={`b${si}`}
        style={{ cursor: 'pointer' }}
        onMouseMove={(e) => {
          setHoveredIdx(si)
          setTooltip({ seg, x: e.clientX, y: e.clientY })
        }}
        onMouseLeave={() => {
          setHoveredIdx(null)
          setTooltip(null)
        }}>
        {/* Glow halo — all bars of the currently active status */}
        {activeStatuses.has(seg.status) && !prefersReducedMotion && (
          <g opacity={isDimmed ? 0.15 : 1} style={{ pointerEvents: 'none' }}>
            <rect
              x={x1 - 4} y={barY - 4} width={barW + 8} height={BAR_H + 8}
              fill={color} rx={8}
              style={{
                filter: 'blur(9px)',
                animation: 'gantt-glow 1.8s ease-in-out infinite',
              }}
            />
          </g>
        )}
        <rect
          x={x1} y={barY} width={barW} height={BAR_H}
          fill={color} rx={5}
          opacity={isDimmed ? 0.45 : seg.isActive ? 1 : 0.88}
          style={{
            transition: 'opacity 150ms ease, filter 150ms ease',
            filter: isHovered ? 'brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.18))' : 'none',
          }}
        />
        {barW >= 28 ? (
          <text x={x1 + barW / 2} y={barY + BAR_H / 2}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={barW < 50 ? 10 : 12} fontFamily="var(--font-body)" fontWeight={600}
            fill="#fff" opacity={isDimmed ? 0.45 : 1}
            style={{ pointerEvents: 'none', transition: 'opacity 150ms ease' }}>
            {dur}
          </text>
        ) : (
          <text x={x1 + barW + 4} y={barY + BAR_H / 2}
            textAnchor="start" dominantBaseline="middle"
            fontSize={10} fontFamily="var(--font-body)" fontWeight={600}
            fill={color} opacity={isDimmed ? 0.45 : 1}
            style={{ pointerEvents: 'none', transition: 'opacity 150ms ease' }}>
            {dur}
          </text>
        )}
        {seg.isActive && barW > 12 && (
          <circle cx={Math.min(x2 - 7, x1 + barW - 7)} cy={barY + BAR_H / 2} r={4}
            fill="#fff" opacity={0.9}
            style={{ pointerEvents: 'none' }}>
            {!prefersReducedMotion && (
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.6s" repeatCount="indefinite" />
            )}
          </circle>
        )}
      </g>
    )
  })

  // ── Row stripe backgrounds ────────────────────────────────────────────────
  const rowStripes = statusOrder.map((_, i) => (
    <rect key={`s${i}`}
      x={0} y={i * ROW_H} width={CHART_W} height={ROW_H}
      fill={i % 2 === 0 ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)'} />
  ))

  const rowDividers = statusOrder.map((_, i) => (
    <line key={`d${i}`}
      x1={0} y1={(i + 1) * ROW_H} x2={CHART_W} y2={(i + 1) * ROW_H}
      stroke="var(--color-border-secondary)" strokeWidth={1} />
  ))

  const ariaLabel = `Gantt: ${segments.length} segmento${segments.length !== 1 ? 's' : ''} en ${statusOrder.length} estado${statusOrder.length !== 1 ? 's' : ''}`

  return (
    <div style={{ position: 'relative' }}>
      <div className="flex rounded-xl ring-1 ring-primary overflow-hidden"
        style={{ background: 'var(--color-bg-primary)' }}>

        {/* ── Fixed label column ── */}
        <div className="flex-shrink-0" style={{ width: LABEL_W, borderRight: '1.5px solid var(--color-border-primary)' }}>
          {statusOrder.map((status, i) => {
            const color = getStatusSvgColor(status)
            const isEven = i % 2 === 0
            return (
              <div key={status}
                style={{
                  height: ROW_H,
                  background: isEven ? 'var(--color-bg-primary)' : 'var(--color-bg-secondary)',
                  borderBottom: '1px solid var(--color-border-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 10,
                  paddingRight: 8,
                  gap: 8,
                }}>
                <div style={{ width: 3, height: BAR_H, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{
                  fontSize: 12,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {status}
                </span>
              </div>
            )
          })}
          <div style={{ height: AXIS_H, background: 'var(--color-bg-primary)' }} />
        </div>

        {/* ── Scrollable chart area ── */}
        <div className="scrollbar-hover" style={{ overflowX: 'auto', flex: 1, paddingBottom: 2 }}>
          <svg
            role="img"
            aria-label={ariaLabel}
            width={CHART_W}
            height={svgH}
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}>
            {rowStripes}
            {rowDividers}
            {gridLines}
            {nowLine}
            {endLine}
            {bars}
            {axisLabels}
          </svg>
        </div>

      </div>

      {/* ── Custom tooltip ── */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 14,
          top: tooltip.y - 8,
          transform: 'translateY(-100%)',
          zIndex: 50,
          pointerEvents: 'none',
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border-primary)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          padding: '8px 12px',
          minWidth: 180,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: getStatusSvgColor(tooltip.seg.status),
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}>
              {tooltip.seg.status}
            </span>
            {tooltip.seg.isActive && (
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                color: '#2e90fa', background: '#2e90fa18',
                borderRadius: 4, padding: '1px 6px',
              }}>
                Activo
              </span>
            )}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            {fmtDuration(tooltip.seg.durationMs)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>
            <div>{fmtDate(tooltip.seg.start)}</div>
            <div>{tooltip.seg.end ? fmtDate(tooltip.seg.end) : 'Ahora →'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

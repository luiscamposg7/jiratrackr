import type { Segment } from '../types'
import { fmtDate, fmtDuration, getStatusSvgColor } from '../utils'

interface GanttChartProps {
  segments: Segment[]
}

const LABEL_W = 188
const ROW_H = 44
const BAR_H = 28
const BAR_PAD = (ROW_H - BAR_H) / 2
const AXIS_H = 32
const PX_PER_DAY = 24   // minimum pixels per day — drives scroll width

function generateTicks(startTs: number, endTs: number, spanDays: number): Date[] {
  const ticks: Date[] = []
  const start = new Date(startTs)

  let step: { unit: 'day' | 'week' | 'month'; every: number }

  if (spanDays <= 10)       step = { unit: 'day',   every: 1  }
  else if (spanDays <= 21)  step = { unit: 'day',   every: 2  }
  else if (spanDays <= 45)  step = { unit: 'week',  every: 1  }
  else if (spanDays <= 120) step = { unit: 'week',  every: 2  }
  else if (spanDays <= 365) step = { unit: 'month', every: 1  }
  else                      step = { unit: 'month', every: 2  }

  // Align first tick to the start of the interval
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  if (step.unit === 'week') {
    const day = cursor.getDay()
    cursor.setDate(cursor.getDate() - day + (day === 0 ? -6 : 1)) // align to Monday
  } else if (step.unit === 'month') {
    cursor.setDate(1)
  }

  while (cursor.getTime() <= endTs + 86400000) {
    if (cursor.getTime() >= startTs - 86400000) {
      ticks.push(new Date(cursor))
    }
    if (step.unit === 'day') {
      cursor.setDate(cursor.getDate() + step.every)
    } else if (step.unit === 'week') {
      cursor.setDate(cursor.getDate() + 7 * step.every)
    } else {
      cursor.setMonth(cursor.getMonth() + step.every)
    }
  }

  return ticks
}

function fmtTickLabel(date: Date, spanDays: number): string {
  if (spanDays <= 45) {
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export function GanttChart({ segments }: GanttChartProps) {
  const startTs = new Date(segments[0].start).getTime()
  const endTs = segments[segments.length - 1].end
    ? new Date(segments[segments.length - 1].end!).getTime()
    : Date.now()
  const spanMs = Math.max(endTs - startTs, 1)
  const spanDays = spanMs / 86400000

  // Dynamic chart width — at least 600px, grows with time
  const CHART_W = Math.max(600, Math.ceil(spanDays * PX_PER_DAY))

  // Ordered unique statuses (first-seen order)
  const statusOrder: string[] = []
  for (const seg of segments) {
    if (!statusOrder.includes(seg.status)) statusOrder.push(seg.status)
  }
  const numRows = statusOrder.length
  const svgH = numRows * ROW_H + AXIS_H

  function tsToX(ts: number): number {
    return ((ts - startTs) / spanMs) * CHART_W
  }

  // ── Grid lines + axis ticks ──────────────────────────────────────────────
  const ticks = generateTicks(startTs, endTs, spanDays)
  const gridLines: React.ReactNode[] = []
  const axisLabels: React.ReactNode[] = []

  ticks.forEach((date, i) => {
    const tx = tsToX(date.getTime())
    if (tx < 0 || tx > CHART_W + 1) return
    gridLines.push(
      <line key={`g${i}`}
        x1={tx} y1={0} x2={tx} y2={numRows * ROW_H}
        stroke="var(--color-border-secondary)" strokeWidth={1}
        strokeDasharray="3 3" opacity={0.6} />
    )
    axisLabels.push(
      <text key={`a${i}`}
        x={tx} y={numRows * ROW_H + 16}
        textAnchor="middle" fontSize={10}
        fontFamily="var(--font-body)"
        fill="var(--color-text-quaternary)">
        {fmtTickLabel(date, spanDays)}
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
        <text x={nx} y={numRows * ROW_H + 16}
          textAnchor="middle" fontSize={9}
          fontFamily="var(--font-body)" fontWeight={700}
          fill="#f79009">
          HOY
        </text>
      </g>
    )
  })() : null

  // ── Bars ──────────────────────────────────────────────────────────────────
  const bars: React.ReactNode[] = []
  segments.forEach((seg, si) => {
    const rowIdx = statusOrder.indexOf(seg.status)
    const rowY = rowIdx * ROW_H
    const color = getStatusSvgColor(seg.status)
    const x1 = tsToX(new Date(seg.start).getTime())
    const x2 = tsToX(seg.end ? new Date(seg.end).getTime() : Date.now())
    const barW = Math.max(x2 - x1, 3)
    const barY = rowY + BAR_PAD
    const dur = fmtDuration(seg.durationMs)
    const tooltip = `${seg.status}: ${dur}\n${fmtDate(seg.start)} → ${seg.end ? fmtDate(seg.end) : 'Ahora'}`

    bars.push(
      <g key={`b${si}`}>
        <rect x={x1} y={barY} width={barW} height={BAR_H}
          fill={color} rx={5} opacity={seg.isActive ? 1 : 0.88}>
          <title>{tooltip}</title>
        </rect>
        {barW > 60 && (
          <text x={x1 + barW / 2} y={barY + BAR_H / 2}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={11} fontFamily="var(--font-body)" fontWeight={600}
            fill="#fff" style={{ pointerEvents: 'none' }}>
            {dur}
          </text>
        )}
        {seg.isActive && barW > 12 && (
          <circle cx={Math.min(x2 - 7, x1 + barW - 7)} cy={barY + BAR_H / 2} r={4}
            fill="#fff" opacity={0.9}>
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.6s" repeatCount="indefinite" />
          </circle>
        )}
      </g>
    )
  })

  // ── Row stripe backgrounds (chart area only) ──────────────────────────────
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

  return (
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
        {/* Axis row spacer */}
        <div style={{ height: AXIS_H, background: 'var(--color-bg-primary)' }} />
      </div>

      {/* ── Scrollable chart area ── */}
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <svg
          width={CHART_W}
          height={svgH}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}>
          {rowStripes}
          {rowDividers}
          {gridLines}
          {nowLine}
          {bars}
          {axisLabels}
        </svg>
      </div>

    </div>
  )
}

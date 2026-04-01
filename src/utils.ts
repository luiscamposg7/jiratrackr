export function fmtDuration(ms: number): string {
  const days = Math.floor(ms / 86400000)
  if (days === 0) return '< 1 día'
  return `${days} día${days !== 1 ? 's' : ''}`
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// Maps a Jira status string to an Untitled UI badge color
export type StatusBadgeColor =
  | 'gray'
  | 'brand'
  | 'error'
  | 'warning'
  | 'success'
  | 'gray-blue'
  | 'blue-light'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'orange'

export function getStatusBadgeColor(status: string): StatusBadgeColor {
  const s = status.toLowerCase()
  if (s.includes('done') || s.includes('finaliz') || s.includes('listo') || s.includes('closed') || s.includes('resolved') || s.includes('resuelto')) return 'success'
  if (s.includes('progress') || s.includes('curso') || s.includes('desarrollo') || s.includes('activ')) return 'blue'
  if (s.includes('review') || s.includes('revisión') || s.includes('revisar') || s.includes('qa') || s.includes('test') || s.includes('prueba')) return 'indigo'
  if (s.includes('block') || s.includes('bloqueado') || s.includes('impedido') || s.includes('error')) return 'error'
  if (s.includes('wait') || s.includes('espera') || s.includes('pending') || s.includes('pendiente') || s.includes('otra')) return 'warning'
  if (s.includes('sprint') || s.includes('prioriz') || s.includes('backlog')) return 'purple'
  if (s.includes('cancel') || s.includes('descart')) return 'gray'
  return 'gray-blue'
}

// SVG-compatible color for Gantt bars (uses design token palette)
const SVG_COLORS: Record<StatusBadgeColor, string> = {
  success:   '#17b26a',
  blue:      '#2e90fa',
  indigo:    '#6172f3',
  error:     '#f04438',
  warning:   '#f79009',
  purple:    '#7a5af8',
  brand:     '#9e77ed',
  gray:      '#667085',
  'gray-blue': '#4e5ba6',
  'blue-light': '#0ba5ec',
  pink:      '#ee46bc',
  orange:    '#ef6820',
}

export function getStatusSvgColor(status: string): string {
  return SVG_COLORS[getStatusBadgeColor(status)]
}

export function fmtRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'ahora'
  if (mins < 60) return `hace ${mins} minuto${mins !== 1 ? 's' : ''}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} hora${hours !== 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days} día${days !== 1 ? 's' : ''}`
  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`
  const years = Math.floor(months / 12)
  return `hace ${years} año${years > 1 ? 's' : ''}`
}

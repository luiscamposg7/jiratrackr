import { useState, useEffect } from 'react'
import { Button } from '@/components/base/buttons/button'
import { TextField } from '@/components/base/input/input'
import { InputBase } from '@/components/base/input/input'
import { SearchMd } from '@untitledui/icons'
import type { IssueGantt } from './types'
import { IssueCard } from './components/IssueCard'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Sidebar } from './components/Sidebar'

const SIDEBAR_COLLAPSED = 64
const SIDEBAR_EXPANDED = 272

export default function App() {
  const [dark, setDark] = useState(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark-mode', prefersDark)
    return prefersDark
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', dark)
  }, [dark])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const [keyInput, setKeyInput] = useState('')
  const [issues, setIssues] = useState<IssueGantt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  async function search() {
    const key = keyInput.trim()
    if (!key) return
    setLoading(true)
    setError(null)
    setNotFound(false)
    setIssues([])
    try {
      const res = await fetch(`/api/issue/${encodeURIComponent(key)}`)
      const data = await res.json()
      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setIssues([data])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex">
      <Sidebar dark={dark} onToggleDark={() => setDark(d => !d)} />

      {/* Main content — offset by sidebar collapsed width */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ marginLeft: SIDEBAR_COLLAPSED }}>
        {/* Search area */}
        <div className="border-b border-primary bg-secondary/50 py-10">
          <div className="max-w-[1140px] mx-auto flex flex-col items-center gap-4">
            <p className="text-display-sm font-semibold text-primary">Buscar ticket</p>
            <p className="text-md text-tertiary -mt-2">Ingresa el ID del ticket para ver su historial de estados</p>
            <div className="flex gap-3 items-center w-full max-w-lg">
              <div className="flex-1">
                <TextField value={keyInput} onChange={setKeyInput}>
                  <InputBase
                    size="md"
                    placeholder="ej: BA-4351"
                    onKeyDown={(e: any) => e.key === 'Enter' && search()}
                    icon={SearchMd}
                    shortcut="Enter ↵"
                  />
                </TextField>
              </div>
              <Button color="primary" size="lg" onPress={search} isDisabled={loading || !keyInput.trim()}>
                {loading ? 'Cargando…' : 'Buscar'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-[1140px] mx-auto py-6 w-full">
          {notFound && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-12 rounded-xl bg-tertiary flex items-center justify-center mb-4">
                <svg className="size-5 text-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <p className="text-md font-semibold text-primary mb-1">Ticket no encontrado</p>
              <p className="text-sm text-tertiary max-w-xs">
                No existe ningún ticket con el ID <span className="font-mono font-semibold text-primary">{keyInput.trim().toUpperCase()}</span>. Verifica que el ID sea correcto.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl bg-error-primary/10 ring-1 ring-error-primary/30 px-4 py-3 text-sm text-error-primary">
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl bg-secondary ring-1 ring-primary overflow-hidden animate-pulse">
                  <div className="px-5 py-4 border-b border-primary flex gap-3">
                    <div className="h-4 w-20 rounded bg-tertiary" />
                    <div className="h-4 flex-1 rounded bg-tertiary" />
                  </div>
                  <div className="px-5 py-5">
                    <div className="h-36 rounded-xl bg-tertiary" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && issues.length > 0 && (
            <div className="space-y-5">
              {issues.map(issue => (
                <ErrorBoundary key={issue.key}>
                  <IssueCard issue={issue} />
                </ErrorBoundary>
              ))}
            </div>
          )}

          {!loading && !error && !notFound && issues.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-12 rounded-xl bg-tertiary flex items-center justify-center mb-4">
                <SearchMd className="size-5 text-quaternary" />
              </div>
              <p className="text-md font-medium text-secondary mb-1">Busca un ticket de Jira</p>
              <p className="text-sm text-tertiary max-w-xs">
                Ingresa el ID del ticket como <span className="font-mono text-primary">BA-4351</span> y presiona Enter o Buscar.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Button } from '@/components/base/buttons/button'
import { TextField } from '@/components/base/input/input'
import { InputBase } from '@/components/base/input/input'
import { SearchMd } from '@untitledui/icons'
import type { IssueGantt } from './types'
import { IssueCard } from './components/IssueCard'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  const [keyInput, setKeyInput] = useState('')
  const [issues, setIssues] = useState<IssueGantt[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    const key = keyInput.trim()
    if (!key) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/issue/${encodeURIComponent(key)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setIssues([data])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="border-b border-primary bg-secondary py-4">
        <div className="max-w-[1140px] mx-auto flex items-center gap-3">
          <div
            className="size-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--color-brand-500)' }}
          >
            G
          </div>
          <div>
            <h1 className="text-sm font-semibold text-primary leading-tight">Jira Gantt</h1>
            <p className="text-xs text-tertiary leading-tight">Prestamype · Historial de estados</p>
          </div>
        </div>
      </header>

      {/* Search area */}
      <div className="border-b border-primary bg-secondary/50 py-10">
        <div className="max-w-[1140px] mx-auto flex flex-col items-center gap-4">
          <p className="text-display-xs font-semibold text-primary">Buscar ticket</p>
          <p className="text-sm text-tertiary -mt-2">Ingresa el ID del ticket para ver su historial de estados</p>
          <div className="flex gap-3 items-center w-full max-w-lg">
            <div className="flex-1">
              <TextField value={keyInput} onChange={setKeyInput}>
                <InputBase
                  size="md"
                  placeholder="ej: BA-4351"
                  onKeyDown={(e: any) => e.key === 'Enter' && search()}
                  icon={SearchMd}
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
      <main className="max-w-[1140px] mx-auto py-6">
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

        {!loading && !error && issues.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-12 rounded-xl bg-tertiary flex items-center justify-center mb-4">
              <SearchMd className="size-5 text-quaternary" />
            </div>
            <p className="text-sm font-medium text-secondary mb-1">Busca un ticket de Jira</p>
            <p className="text-xs text-tertiary max-w-xs">
              Ingresa el ID del ticket como <span className="font-mono text-primary">BA-4351</span> y presiona Enter o Buscar.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

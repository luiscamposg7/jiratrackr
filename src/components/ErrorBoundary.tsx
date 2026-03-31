import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-6 rounded-xl bg-error-primary/10 ring-1 ring-error-primary/30 px-5 py-4">
          <p className="text-sm font-semibold text-error-primary mb-1">Error al renderizar</p>
          <pre className="text-xs text-error-primary/70 whitespace-pre-wrap">{this.state.error.message}</pre>
          <button
            className="mt-3 text-xs text-error-primary underline"
            onClick={() => this.setState({ error: null })}
          >
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

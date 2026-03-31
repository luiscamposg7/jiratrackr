import { useState } from 'react'

interface SidebarProps {
  dark: boolean
  onToggleDark: () => void
}

const COLLAPSED = 64
const EXPANDED = 272

export function Sidebar({ dark, onToggleDark }: SidebarProps) {
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const expanded = pinned || hovered

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col flex-shrink-0 border-r border-primary bg-secondary fixed inset-y-0 left-0 z-50"
      style={{ width: expanded ? EXPANDED : COLLAPSED, transition: 'width 200ms ease', overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        className="flex items-center border-b border-primary flex-shrink-0"
        style={{
          height: 64,
          padding: expanded ? '0 16px' : '0 12px',
          justifyContent: expanded ? 'space-between' : 'center',
          transition: 'padding 200ms ease',
        }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className="size-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-brand-500)' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 10C2 10 5.5 4 10 4C14.5 4 18 10 18 10C18 10 14.5 16 10 16C5.5 16 2 10 2 10Z" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="2.8" stroke="white" strokeWidth="1.6"/>
              <circle cx="10" cy="10" r="1.2" fill="white"/>
            </svg>
          </div>
          {expanded && (
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-primary whitespace-nowrap truncate leading-tight">
                Jira Gantt
              </p>
              <p className="text-xs text-tertiary whitespace-nowrap truncate leading-tight">
                Prestamype
              </p>
            </div>
          )}
        </div>
        {expanded && (
          <button
            onClick={() => { const next = !pinned; setPinned(next); if (!next) setHovered(false) }}
            title={pinned ? 'Desfijar sidebar' : 'Fijar sidebar'}
            className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${pinned ? 'text-brand-tertiary' : 'text-quaternary hover:text-secondary hover:bg-primary_hover'}`}
          >
            <svg className="size-4" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path d="M7.5 2.5V17.5M6.5 2.5H13.5C14.9001 2.5 15.6002 2.5 16.135 2.77248C16.6054 3.01217 16.9878 3.39462 17.2275 3.86502C17.5 4.3998 17.5 5.09987 17.5 6.5V13.5C17.5 14.9001 17.5 15.6002 17.2275 16.135C16.9878 16.6054 16.6054 16.9878 16.135 17.2275C15.6002 17.5 14.9001 17.5 13.5 17.5H6.5C5.09987 17.5 4.3998 17.5 3.86502 17.2275C3.39462 16.9878 3.01217 16.6054 2.77248 16.135C2.5 15.6002 2.5 14.9001 2.5 13.5V6.5C2.5 5.09987 2.5 4.3998 2.77248 3.86502C3.01217 3.39462 3.39462 3.01217 3.86502 2.77248C4.3998 2.5 5.09987 2.5 6.5 2.5Z" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ padding: expanded ? '16px 12px' : '16px 8px' }}
      >
        <div
          className="flex items-center rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--color-brand-500) 12%, transparent)',
            gap: 12,
            padding: expanded ? '8px 12px' : 0,
            width: expanded ? '100%' : 40,
            height: 40,
            justifyContent: expanded ? 'flex-start' : 'center',
            color: 'var(--color-brand-500)',
            flexShrink: 0,
          }}
        >
          <svg className="size-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          {expanded && (
            <span className="text-sm font-medium text-primary whitespace-nowrap">
              Buscar ticket
            </span>
          )}
        </div>
      </nav>

      {/* Bottom — dark mode toggle */}
      <div
        className="border-t border-primary flex-shrink-0"
        style={{ padding: expanded ? '16px 12px' : '16px 8px' }}
      >
        <button
          title={!expanded ? (dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro') : undefined}
          onClick={onToggleDark}
          className="w-full flex items-center rounded-lg text-tertiary hover:text-primary hover:bg-primary_hover transition-colors duration-150"
          style={{
            gap: expanded ? 12 : 0,
            padding: expanded ? '10px 12px' : '10px 0',
            justifyContent: expanded ? 'space-between' : 'center',
          }}
        >
          <div className="flex items-center" style={{ gap: expanded ? 12 : 0 }}>
            {dark ? (
              // Sun — switch to light
              <svg className="size-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 3v1m0 16v1m8.66-9H21M3 12H2m15.36-6.36-.71.71M7.05 16.95l-.71.71M18.36 18.36l-.71-.71M6.34 6.34l-.71-.71M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0z" />
              </svg>
            ) : (
              // Moon — switch to dark
              <svg className="size-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {expanded && (
              <span className="text-sm whitespace-nowrap">
                {dark ? 'Modo oscuro' : 'Modo claro'}
              </span>
            )}
          </div>
          {expanded && (
            <div
              className="w-8 h-4 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors duration-200"
              style={{
                backgroundColor: dark ? 'var(--color-brand-500)' : 'var(--color-border-primary)',
                justifyContent: dark ? 'flex-end' : 'flex-start',
              }}
            >
              <div className="size-3 bg-white rounded-full shadow-sm" />
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}

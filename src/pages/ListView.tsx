import { useEffect, useMemo, useRef, type ChangeEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, SearchIcon } from '../components/Icons'
import { ErrorMessage, Loading } from '../components/StatusMessage'
import TypeBadge from '../components/TypeBadge'
import usePokemonList from '../hooks/usePokemonList'
import controls from '../styles/controls.module.css'
import type { PokemonSummary } from '../types/pokemon'
import type { DetailNavState } from '../utils/detailNav'
import { displayName, formatHeight, formatId, formatWeight } from '../utils/format'
import { typeClass } from '../utils/typeClass'
import styles from './ListView.module.css'

type SortKey = 'id' | 'name' | 'height' | 'weight' | 'baseExperience' | 'totalStats'
type SortOrder = 'asc' | 'desc'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'Pokédex number' },
  { key: 'name', label: 'Name' },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
  { key: 'baseExperience', label: 'Base experience' },
  { key: 'totalStats', label: 'Total base stats' },
]

// The numbers shown on the right of every row.
const METRICS: { key: SortKey; label: string; format: (p: PokemonSummary) => string }[] = [
  { key: 'height', label: 'Height', format: (p) => formatHeight(p.height) },
  { key: 'weight', label: 'Weight', format: (p) => formatWeight(p.weight) },
  { key: 'baseExperience', label: 'Base XP', format: (p) => String(p.baseExperience) },
  { key: 'totalStats', label: 'Total', format: (p) => String(p.totalStats) },
]

function isSortKey(value: string | null): value is SortKey {
  return SORT_OPTIONS.some((o) => o.key === value)
}

function compare(a: PokemonSummary, b: PokemonSummary, key: SortKey): number {
  if (key === 'name') return a.name.localeCompare(b.name)
  // Ties fall back to Pokédex order so the result is stable.
  return a[key] - b[key] || a.id - b.id
}

function matchesQuery(p: PokemonSummary, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase().replace(/^#/, '')
  if (/^\d+$/.test(q)) return String(p.id).includes(String(Number(q)))
  return p.name.includes(q) || displayName(p.name).toLowerCase().includes(q)
}

export default function ListView() {
  const { status, pokemon, progress, error, retry } = usePokemonList()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const query = searchParams.get('q') ?? ''
  const sortParam = searchParams.get('sort')
  const sortKey: SortKey = isSortKey(sortParam) ? sortParam : 'id'
  const order: SortOrder = searchParams.get('order') === 'desc' ? 'desc' : 'asc'
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? ''

  // Press "/" anywhere on the page to jump to the search field.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (e.key !== '/' || (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Keep search/sort state in the URL so it survives a trip to the detail
  // page and back. `replace` avoids one history entry per keystroke.
  function updateParam(name: string, value: string, defaultValue: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === defaultValue) next.delete(name)
        else next.set(name, value)
        return next
      },
      { replace: true },
    )
  }

  const results = useMemo(() => {
    const filtered = pokemon.filter((p) => matchesQuery(p, query.trim()))
    const direction = order === 'asc' ? 1 : -1
    return filtered.sort((a, b) => compare(a, b, sortKey) * direction)
  }, [pokemon, query, sortKey, order])

  const navState: DetailNavState = {
    ids: results.map((p) => p.id),
    from: location.pathname + location.search,
    fromLabel: 'Back to search',
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Pokédex</p>
        <h1 className={styles.title}>Find your Pokémon.</h1>
        <p className={styles.subtitle}>
          All 151 originals, searchable by name or number and sortable by what matters to you.
        </p>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <SearchIcon className={styles.searchIcon} />
          <span className={styles.srOnly}>Search Pokémon</span>
          <input
            ref={inputRef}
            type="search"
            className={styles.searchInput}
            placeholder="Search by name or number"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateParam('q', e.target.value, '')}
            autoFocus
          />
          {!query && (
            <kbd className={styles.kbd} title="Press / to search">
              /
            </kbd>
          )}
        </label>

        <div className={styles.sortGroup}>
          <label className={styles.popup}>
            <span className={styles.popupLabel}>Sort by</span>
            <select
              className={styles.select}
              value={sortKey}
              onChange={(e) => updateParam('sort', e.target.value, 'id')}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div
            className={`${controls.segmented} ${order === 'desc' ? controls.second : ''}`}
            role="group"
            aria-label="Sort order"
          >
            <span className={controls.indicator} aria-hidden="true" />
            <button
              type="button"
              className={order === 'asc' ? `${controls.segment} ${controls.segmentActive}` : controls.segment}
              aria-pressed={order === 'asc'}
              onClick={() => updateParam('order', 'asc', 'asc')}
            >
              <ArrowUp />
              Ascending
            </button>
            <button
              type="button"
              className={order === 'desc' ? `${controls.segment} ${controls.segmentActive}` : controls.segment}
              aria-pressed={order === 'desc'}
              onClick={() => updateParam('order', 'desc', 'asc')}
            >
              <ArrowDown />
              Descending
            </button>
          </div>
        </div>
      </div>

      {status === 'loading' && <Loading message="Catching Pokémon…" progress={progress} />}
      {status === 'error' && <ErrorMessage message={error ?? 'Failed to load Pokémon.'} onRetry={retry} />}

      {status === 'ready' && (
        <>
          <p className={styles.count} aria-live="polite">
            {results.length === 0 ? (
              <>No Pokémon match “{query}”.</>
            ) : (
              <>
                <strong>{results.length}</strong> of {pokemon.length} Pokémon · sorted by {sortLabel.toLowerCase()},{' '}
                {order === 'asc' ? 'ascending' : 'descending'}
              </>
            )}
          </p>

          {results.length > 0 && (
            <ul className={styles.grid}>
              {results.map((p) => (
                <li key={p.id} className={styles.cell}>
                  <Link to={`/pokemon/${p.id}`} state={navState} className={`${styles.card} ${typeClass(p.types[0])}`}>
                    <span className={styles.cardTop}>
                      <span className={sortKey === 'id' ? `${styles.number} ${styles.active}` : styles.number}>
                        {formatId(p.id)}
                      </span>
                      <span className={styles.types}>
                        {p.types.map((t) => (
                          <TypeBadge key={t} type={t} />
                        ))}
                      </span>
                    </span>

                    <span className={styles.art}>
                      <span className={styles.glow} aria-hidden="true" />
                      <img className={styles.artwork} src={p.artwork} alt="" loading="lazy" width={120} height={120} />
                    </span>

                    <span className={sortKey === 'name' ? `${styles.name} ${styles.active}` : styles.name}>
                      {displayName(p.name)}
                    </span>

                    <span className={styles.stats}>
                      {METRICS.map((m) => (
                        <span key={m.key} className={m.key === sortKey ? `${styles.stat} ${styles.statActive}` : styles.stat}>
                          <span className={styles.statLabel}>{m.label}</span>
                          <span className={styles.statValue}>{m.format(p)}</span>
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

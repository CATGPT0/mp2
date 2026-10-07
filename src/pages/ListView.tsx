import { useMemo, type ChangeEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ErrorMessage, Loading } from '../components/StatusMessage'
import TypeBadge from '../components/TypeBadge'
import usePokemonList from '../hooks/usePokemonList'
import type { PokemonSummary } from '../types/pokemon'
import type { DetailNavState } from '../utils/detailNav'
import { displayName, formatHeight, formatId, formatWeight } from '../utils/format'
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

  const query = searchParams.get('q') ?? ''
  const sortParam = searchParams.get('sort')
  const sortKey: SortKey = isSortKey(sortParam) ? sortParam : 'id'
  const order: SortOrder = searchParams.get('order') === 'desc' ? 'desc' : 'asc'

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
      <header className={styles.intro}>
        <h1 className={styles.title}>Search the Pokédex</h1>
        <p className={styles.subtitle}>
          Find any of the original 151 Pokémon by name or number, then sort the results.
        </p>
      </header>

      <div className={styles.controls}>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search Pokémon</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search by name or number, e.g. “pika” or “25”"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateParam('q', e.target.value, '')}
            autoFocus
          />
        </label>

        <div className={styles.sortGroup}>
          <label className={styles.sortLabel}>
            Sort by
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

          <div className={styles.orderToggle} role="group" aria-label="Sort order">
            <button
              type="button"
              className={order === 'asc' ? `${styles.orderButton} ${styles.orderActive}` : styles.orderButton}
              aria-pressed={order === 'asc'}
              onClick={() => updateParam('order', 'asc', 'asc')}
            >
              ↑ Ascending
            </button>
            <button
              type="button"
              className={order === 'desc' ? `${styles.orderButton} ${styles.orderActive}` : styles.orderButton}
              aria-pressed={order === 'desc'}
              onClick={() => updateParam('order', 'desc', 'asc')}
            >
              ↓ Descending
            </button>
          </div>
        </div>
      </div>

      {status === 'loading' && <Loading message="Catching Pokémon…" progress={progress} />}
      {status === 'error' && <ErrorMessage message={error ?? 'Failed to load Pokémon.'} onRetry={retry} />}

      {status === 'ready' && (
        <>
          <p className={styles.count} aria-live="polite">
            {results.length === 0
              ? `No Pokémon match “${query}”.`
              : `Showing ${results.length} of ${pokemon.length} Pokémon`}
          </p>

          {results.length > 0 && (
            <div className={styles.list}>
              <div className={styles.headerRow} aria-hidden="true">
                <span />
                <span className={sortKey === 'id' || sortKey === 'name' ? styles.sorted : undefined}>Pokémon</span>
                <span>Type</span>
                <span className={sortKey === 'height' ? styles.sorted : undefined}>Height</span>
                <span className={sortKey === 'weight' ? styles.sorted : undefined}>Weight</span>
                <span className={sortKey === 'baseExperience' ? styles.sorted : undefined}>Base XP</span>
                <span className={sortKey === 'totalStats' ? styles.sorted : undefined}>Total</span>
              </div>

              <ul className={styles.rows}>
                {results.map((p) => (
                  <li key={p.id}>
                    <Link to={`/pokemon/${p.id}`} state={navState} className={styles.row}>
                      <img className={styles.sprite} src={p.sprite} alt="" loading="lazy" width={64} height={64} />
                      <span className={styles.nameCell}>
                        <span className={styles.number}>{formatId(p.id)}</span>
                        <span className={styles.name}>{displayName(p.name)}</span>
                      </span>
                      <span className={styles.types}>
                        {p.types.map((t) => (
                          <TypeBadge key={t} type={t} />
                        ))}
                      </span>
                      <span className={`${styles.stat} ${styles.statHeight}`} data-label="Height">
                        {formatHeight(p.height)}
                      </span>
                      <span className={`${styles.stat} ${styles.statWeight}`} data-label="Weight">
                        {formatWeight(p.weight)}
                      </span>
                      <span className={`${styles.stat} ${styles.statXp}`} data-label="Base XP">
                        {p.baseExperience}
                      </span>
                      <span className={`${styles.stat} ${styles.statTotal}`} data-label="Total">
                        {p.totalStats}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}

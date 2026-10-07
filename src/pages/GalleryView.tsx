import { useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ErrorMessage, Loading } from '../components/StatusMessage'
import TypeBadge from '../components/TypeBadge'
import usePokemonList from '../hooks/usePokemonList'
import type { DetailNavState } from '../utils/detailNav'
import { capitalize, displayName, formatId } from '../utils/format'
import { typeClass } from '../utils/typeClass'
import styles from './GalleryView.module.css'

type MatchMode = 'any' | 'all'

export default function GalleryView() {
  const { status, pokemon, progress, error, retry } = usePokemonList()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const selected = useMemo(
    () => (searchParams.get('types') ?? '').split(',').filter(Boolean),
    [searchParams],
  )
  const matchMode: MatchMode = searchParams.get('match') === 'all' ? 'all' : 'any'

  // Every type that appears in the dataset, in a stable alphabetical order.
  const allTypes = useMemo(
    () => [...new Set(pokemon.flatMap((p) => p.types))].sort(),
    [pokemon],
  )

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of pokemon) for (const t of p.types) counts.set(t, (counts.get(t) ?? 0) + 1)
    return counts
  }, [pokemon])

  const results = useMemo(() => {
    if (selected.length === 0) return pokemon
    return pokemon.filter((p) =>
      matchMode === 'all'
        ? selected.every((t) => p.types.includes(t))
        : selected.some((t) => p.types.includes(t)),
    )
  }, [pokemon, selected, matchMode])

  function updateParams(types: string[], mode: MatchMode) {
    const next = new URLSearchParams()
    if (types.length > 0) next.set('types', types.join(','))
    if (mode === 'all') next.set('match', 'all')
    setSearchParams(next, { replace: true })
  }

  function toggleType(type: string) {
    const types = selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type]
    updateParams(types, matchMode)
  }

  const navState: DetailNavState = {
    ids: results.map((p) => p.id),
    from: location.pathname + location.search,
    fromLabel: 'Back to gallery',
  }

  return (
    <section className={styles.page}>
      <header className={styles.intro}>
        <h1 className={styles.title}>Gallery</h1>
        <p className={styles.subtitle}>Pick one or more types to filter the gallery.</p>
      </header>

      {status === 'loading' && <Loading message="Catching Pokémon…" progress={progress} />}
      {status === 'error' && <ErrorMessage message={error ?? 'Failed to load Pokémon.'} onRetry={retry} />}

      {status === 'ready' && (
        <>
          <div className={styles.filters}>
            <div className={styles.filterHeader}>
              <h2 className={styles.filterTitle}>Filter by type</h2>
              <div className={styles.filterActions}>
                <div className={styles.matchToggle} role="group" aria-label="Type match mode">
                  <button
                    type="button"
                    className={matchMode === 'any' ? `${styles.matchButton} ${styles.matchActive}` : styles.matchButton}
                    aria-pressed={matchMode === 'any'}
                    onClick={() => updateParams(selected, 'any')}
                    title="Show Pokémon that have at least one of the selected types"
                  >
                    Match any
                  </button>
                  <button
                    type="button"
                    className={matchMode === 'all' ? `${styles.matchButton} ${styles.matchActive}` : styles.matchButton}
                    aria-pressed={matchMode === 'all'}
                    onClick={() => updateParams(selected, 'all')}
                    title="Show Pokémon that have every selected type"
                  >
                    Match all
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.clear}
                  onClick={() => updateParams([], matchMode)}
                  disabled={selected.length === 0}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={styles.chips}>
              {allTypes.map((type) => {
                const active = selected.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    className={`${styles.chip} ${typeClass(type)} ${active ? styles.chipActive : ''}`}
                    aria-pressed={active}
                    onClick={() => toggleType(type)}
                  >
                    {capitalize(type)}
                    <span className={styles.chipCount}>{typeCounts.get(type)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <p className={styles.count} aria-live="polite">
            {results.length === 0
              ? 'No Pokémon have all of the selected types. Try “Match any” or remove a type.'
              : `Showing ${results.length} of ${pokemon.length} Pokémon`}
          </p>

          <ul className={styles.grid}>
            {results.map((p) => (
              <li key={p.id}>
                <Link to={`/pokemon/${p.id}`} state={navState} className={`${styles.card} ${typeClass(p.types[0])}`}>
                  <span className={styles.number}>{formatId(p.id)}</span>
                  <img
                    className={styles.artwork}
                    src={p.artwork}
                    alt={displayName(p.name)}
                    loading="lazy"
                    width={240}
                    height={240}
                  />
                  <span className={styles.name}>{displayName(p.name)}</span>
                  <span className={styles.types}>
                    {p.types.map((t) => (
                      <TypeBadge key={t} type={t} />
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

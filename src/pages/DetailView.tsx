import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  artworkUrl,
  describeError,
  getEvolutionChain,
  getPokemon,
  getSpecies,
  idFromUrl,
  spriteUrl,
} from '../api/pokeapi'
import HeightCompare from '../components/HeightCompare'
import { ChevronLeft, ChevronRight } from '../components/Icons'
import StatRings from '../components/StatRings'
import { ErrorMessage, Loading } from '../components/StatusMessage'
import TypeBadge from '../components/TypeBadge'
import usePokemonList from '../hooks/usePokemonList'
import type { ChainLink, PokemonResponse, SpeciesResponse } from '../types/pokemon'
import { isDetailNavState, type DetailNavState } from '../utils/detailNav'
import {
  cleanFlavorText,
  displayName,
  formatHeight,
  formatId,
  formatWeight,
  titleCase,
} from '../utils/format'
import { typeClass } from '../utils/typeClass'
import styles from './DetailView.module.css'

interface EvolutionMember {
  id: number
  name: string
}

interface DetailData {
  pokemon: PokemonResponse
  species: SpeciesResponse | null
  evolution: EvolutionMember[][]
}

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: DetailData }

// A finished request, tagged with what it was for so a stale result is
// treated as "still loading" once the id changes or the user retries.
type DetailResult = Exclude<DetailState, { status: 'loading' }> & { id: number; attempt: number }

// Flattens the evolution tree into stages: [[bulbasaur], [ivysaur], [venusaur]].
// Branching lines such as Eevee's end up with several members in one stage.
function flattenChain(root: ChainLink): EvolutionMember[][] {
  const stages: EvolutionMember[][] = []
  let level: ChainLink[] = [root]
  while (level.length > 0) {
    stages.push(level.map((link) => ({ id: idFromUrl(link.species.url), name: link.species.name })))
    level = level.flatMap((link) => link.evolves_to)
  }
  return stages
}

async function loadDetail(id: number): Promise<DetailData> {
  const pokemon = await getPokemon(id)

  // Species and evolution data are extras; the page still works without them.
  let species: SpeciesResponse | null = null
  let evolution: EvolutionMember[][] = []
  try {
    species = await getSpecies(idFromUrl(pokemon.species.url))
    if (species.evolution_chain) {
      const chain = await getEvolutionChain(species.evolution_chain.url)
      evolution = flattenChain(chain.chain)
    }
  } catch {
    // Fall through with whatever we managed to load.
  }

  return { pokemon, species, evolution }
}

function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null
  const id = Number(raw)
  return id > 0 ? id : null
}

export default function DetailView() {
  const params = useParams()
  const id = parseId(params.id)
  const location = useLocation()
  const navigate = useNavigate()
  const { pokemon: allPokemon } = usePokemonList()
  const [result, setResult] = useState<DetailResult | null>(null)
  const [attempt, setAttempt] = useState(0)
  const state: DetailState =
    result && result.id === id && result.attempt === attempt ? result : { status: 'loading' }

  // When the page is opened from the list or gallery, cycle through that
  // exact (filtered/sorted) list. A direct visit via URL falls back to the
  // whole Pokédex in numeric order.
  const navState: DetailNavState = useMemo(() => {
    if (isDetailNavState(location.state) && location.state.ids.length > 0) return location.state
    return { ids: allPokemon.map((p) => p.id), from: '/', fromLabel: 'Back to search' }
  }, [location.state, allPokemon])

  const namesById = useMemo(() => new Map(allPokemon.map((p) => [p.id, p.name])), [allPokemon])

  const neighbours = useMemo(() => {
    if (id === null) return null
    const { ids } = navState
    const index = ids.indexOf(id)
    if (index === -1) {
      // The current Pokémon is outside the list (e.g. reached through an
      // evolution link), so step through Pokédex numbers instead.
      return { prev: id > 1 ? id - 1 : null, next: id + 1, position: null, total: ids.length }
    }
    if (ids.length === 1) return { prev: null, next: null, position: 1, total: 1 }
    return {
      prev: ids[(index - 1 + ids.length) % ids.length],
      next: ids[(index + 1) % ids.length],
      position: index + 1,
      total: ids.length,
    }
  }, [id, navState])

  useEffect(() => {
    if (id === null) return
    let cancelled = false
    loadDetail(id)
      .then((data) => {
        if (!cancelled) setResult({ status: 'ready', data, id, attempt })
      })
      .catch((err: unknown) => {
        if (!cancelled) setResult({ status: 'error', message: describeError(err), id, attempt })
      })
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  // Left/right arrow keys mirror the previous/next buttons.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      const dest = e.key === 'ArrowLeft' ? neighbours?.prev : e.key === 'ArrowRight' ? neighbours?.next : null
      if (dest) navigate(`/pokemon/${dest}`, { state: navState })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [neighbours, navState, navigate])

  useEffect(() => {
    if (result?.status === 'ready') {
      document.title = `${displayName(result.data.pokemon.name)} · PokéExplorer`
    }
    return () => {
      document.title = 'PokéExplorer'
    }
  }, [result])

  if (id === null) {
    return (
      <section className={styles.page}>
        <ErrorMessage message={`“${params.id}” is not a valid Pokédex number.`} />
        <Link to="/" className={styles.standaloneBack}>
          Back to search
        </Link>
      </section>
    )
  }

  function neighbourLabel(neighbourId: number): string {
    const name = namesById.get(neighbourId)
    return name ? displayName(name) : formatId(neighbourId)
  }

  // A floating, dock-like bar for previous / back / next.
  const dock = (
    <nav className={styles.dock} aria-label="Pokémon navigation">
      {neighbours?.prev ? (
        <Link
          to={`/pokemon/${neighbours.prev}`}
          state={navState}
          className={styles.dockButton}
          rel="prev"
          title="Previous (← key)"
        >
          <span className={styles.dockIcon}>
            <ChevronLeft />
          </span>
          <span className={styles.dockText}>
            <span className={styles.dockHint}>Previous</span>
            <span className={styles.dockName}>{neighbourLabel(neighbours.prev)}</span>
          </span>
        </Link>
      ) : (
        <span className={`${styles.dockButton} ${styles.dockDisabled}`} aria-disabled="true">
          <span className={styles.dockIcon}>
            <ChevronLeft />
          </span>
        </span>
      )}

      <div className={styles.dockCenter}>
        <Link to={navState.from} className={styles.backLink}>
          {navState.fromLabel}
        </Link>
        {neighbours?.position && (
          <span className={styles.position}>
            {neighbours.position} of {neighbours.total}
          </span>
        )}
      </div>

      {neighbours?.next ? (
        <Link
          to={`/pokemon/${neighbours.next}`}
          state={navState}
          className={`${styles.dockButton} ${styles.dockNext}`}
          rel="next"
          title="Next (→ key)"
        >
          <span className={styles.dockText}>
            <span className={styles.dockHint}>Next</span>
            <span className={styles.dockName}>{neighbourLabel(neighbours.next)}</span>
          </span>
          <span className={styles.dockIcon}>
            <ChevronRight />
          </span>
        </Link>
      ) : (
        <span className={`${styles.dockButton} ${styles.dockNext} ${styles.dockDisabled}`} aria-disabled="true">
          <span className={styles.dockIcon}>
            <ChevronRight />
          </span>
        </span>
      )}
    </nav>
  )

  return (
    <section className={styles.page}>
      {state.status === 'loading' && <Loading message="Loading Pokémon…" />}
      {state.status === 'error' && (
        <ErrorMessage message={state.message} onRetry={() => setAttempt((n) => n + 1)} />
      )}
      {state.status === 'ready' && <PokemonDetail data={state.data} navState={navState} />}
      {dock}
    </section>
  )
}

function PokemonDetail({ data, navState }: { data: DetailData; navState: DetailNavState }) {
  const { pokemon, species, evolution } = data
  const types = [...pokemon.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name)
  const artwork = pokemon.sprites.other?.['official-artwork']?.front_default ?? artworkUrl(pokemon.id)
  const name = displayName(pokemon.name)

  const genus = species?.genera.find((g) => g.language.name === 'en')?.genus
  // Use the most recent English Pokédex entry.
  const flavor = species?.flavor_text_entries.filter((f) => f.language.name === 'en').at(-1)

  const profile: { label: string; value: string }[] = species
    ? [
        { label: 'Habitat', value: species.habitat ? titleCase(species.habitat.name) : 'Unknown' },
        { label: 'Colour', value: titleCase(species.color.name) },
        { label: 'Generation', value: species.generation.name.replace('generation-', '').toUpperCase() },
      ]
    : []

  return (
    <article className={`${styles.detail} ${typeClass(types[0])}`}>
      {/* The artwork itself, hugely blurred, tints the top of the page. */}
      <div className={styles.ambient} aria-hidden="true">
        <img src={artwork} alt="" />
      </div>

      <header className={styles.hero}>
        <p className={styles.eyebrow}>
          {formatId(pokemon.id)}
          {genus && <> · {genus}</>}
        </p>
        <h1 className={styles.name}>{name}</h1>
        <div className={styles.types}>
          {types.map((t) => (
            <TypeBadge key={t} type={t} size="large" />
          ))}
          {species && (species.is_legendary || species.is_mythical) && (
            <span className={styles.rarity}>{species.is_mythical ? 'Mythical' : 'Legendary'}</span>
          )}
        </div>

        <div className={styles.stage}>
          <span className={styles.halo} aria-hidden="true" />
          <img className={styles.artwork} src={artwork} alt={name} width={360} height={360} />
          <span className={styles.floorShadow} aria-hidden="true" />
        </div>

        {flavor && (
          <figure className={styles.flavor}>
            <blockquote className={styles.quote}>{cleanFlavorText(flavor.flavor_text)}</blockquote>
            <figcaption className={styles.source}>Pokédex entry · Pokémon {titleCase(flavor.version.name)}</figcaption>
          </figure>
        )}
      </header>

      <div className={styles.bento}>
        <section className={`${styles.tile} ${styles.statsTile}`}>
          <h2 className={styles.tileTitle}>Base stats</h2>
          <StatRings stats={pokemon.stats.map((s) => ({ name: s.stat.name, value: s.base_stat }))} />
        </section>

        <section className={`${styles.tile} ${styles.heightTile}`}>
          <h2 className={styles.tileTitle}>Height</h2>
          <p className={styles.bigValue}>{formatHeight(pokemon.height)}</p>
          <HeightCompare metres={pokemon.height / 10} name={name} />
        </section>

        <section className={styles.tile}>
          <h2 className={styles.tileTitle}>Weight</h2>
          <p className={styles.bigValue}>{formatWeight(pokemon.weight)}</p>
        </section>

        <section className={styles.tile}>
          <h2 className={styles.tileTitle}>Base experience</h2>
          <p className={styles.bigValue}>{pokemon.base_experience ?? '—'}</p>
          <p className={styles.tileNote}>XP earned for defeating it</p>
        </section>

        {species && (
          <section className={styles.tile}>
            <h2 className={styles.tileTitle}>Capture rate</h2>
            <p className={styles.bigValue}>
              {species.capture_rate}
              <span className={styles.unit}> / 255</span>
            </p>
            <progress className={styles.meter} value={species.capture_rate} max={255} />
            <p className={styles.tileNote}>Higher is easier to catch</p>
          </section>
        )}

        <section className={`${styles.tile} ${styles.wideTile}`}>
          <h2 className={styles.tileTitle}>Abilities</h2>
          <ul className={styles.abilities}>
            {pokemon.abilities.map((a) => (
              <li key={a.ability.name} className={styles.ability}>
                {titleCase(a.ability.name)}
                {a.is_hidden && <span className={styles.hidden}>Hidden</span>}
              </li>
            ))}
          </ul>
        </section>

        {profile.length > 0 && (
          <section className={styles.tile}>
            <h2 className={styles.tileTitle}>Profile</h2>
            <dl className={styles.profile}>
              {profile.map((f) => (
                <div key={f.label} className={styles.profileRow}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {evolution.length > 1 && (
          <section className={`${styles.tile} ${styles.fullTile}`}>
            <h2 className={styles.tileTitle}>Evolution line</h2>
            <ol className={styles.evolution}>
              {evolution.map((stage, i) => (
                <li key={i} className={styles.evoStage}>
                  {i > 0 && <ChevronRight className={styles.evoArrow} />}
                  <span className={styles.evoMembers}>
                    {stage.map((member) => (
                      <Link
                        key={member.id}
                        to={`/pokemon/${member.id}`}
                        state={navState}
                        className={
                          member.id === pokemon.id ? `${styles.evoMember} ${styles.evoCurrent}` : styles.evoMember
                        }
                        aria-current={member.id === pokemon.id ? 'page' : undefined}
                      >
                        <img src={spriteUrl(member.id)} alt="" width={88} height={88} loading="lazy" />
                        <span className={styles.evoName}>{displayName(member.name)}</span>
                        <span className={styles.evoNumber}>{formatId(member.id)}</span>
                      </Link>
                    ))}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </article>
  )
}

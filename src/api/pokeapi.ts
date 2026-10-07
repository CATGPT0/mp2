import axios from 'axios'
import type {
  EvolutionChainResponse,
  PokemonListResponse,
  PokemonResponse,
  PokemonSummary,
  SpeciesResponse,
} from '../types/pokemon'

// The original 151 Pokémon (Generation I) make up the browsable dataset.
export const POKEMON_LIMIT = 151

const BATCH_SIZE = 30
const STORAGE_KEY = 'pokeexplorer:summaries:v1'
const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000

const client = axios.create({
  baseURL: 'https://pokeapi.co/api/v2',
  timeout: 15000,
})

// In-memory cache of in-flight and finished requests, keyed by path, so the
// same resource is only requested once per session. Failed requests are
// evicted so a retry can try again.
const requestCache = new Map<string, Promise<unknown>>()

function cachedGet<T>(path: string): Promise<T> {
  const cached = requestCache.get(path)
  if (cached) return cached as Promise<T>

  const request = client
    .get<T>(path)
    .then((res) => res.data)
    .catch((err: unknown) => {
      requestCache.delete(path)
      throw err
    })
  requestCache.set(path, request)
  return request
}

export function getPokemon(idOrName: number | string): Promise<PokemonResponse> {
  return cachedGet<PokemonResponse>(`/pokemon/${idOrName}`)
}

export function getSpecies(idOrName: number | string): Promise<SpeciesResponse> {
  return cachedGet<SpeciesResponse>(`/pokemon-species/${idOrName}`)
}

export function getEvolutionChain(url: string): Promise<EvolutionChainResponse> {
  // The species response hands us an absolute URL; strip the base so it
  // shares the cache key format of the other requests.
  const path = url.replace(/^https?:\/\/pokeapi\.co\/api\/v2/, '').replace(/\/$/, '')
  return cachedGet<EvolutionChainResponse>(path)
}

export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

// Pulls the numeric id out of a resource URL like ".../pokemon-species/25/".
export function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : NaN
}

export function toSummary(p: PokemonResponse): PokemonSummary {
  return {
    id: p.id,
    name: p.name,
    types: [...p.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    height: p.height,
    weight: p.weight,
    baseExperience: p.base_experience ?? 0,
    totalStats: p.stats.reduce((sum, s) => sum + s.base_stat, 0),
    sprite: p.sprites.front_default ?? spriteUrl(p.id),
    artwork: p.sprites.other?.['official-artwork']?.front_default ?? artworkUrl(p.id),
  }
}

function readStoredSummaries(): PokemonSummary[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { savedAt: number; data: PokemonSummary[] }
    if (Date.now() - parsed.savedAt > STORAGE_TTL_MS) return null
    if (!Array.isArray(parsed.data) || parsed.data.length !== POKEMON_LIMIT) return null
    return parsed.data
  } catch {
    return null
  }
}

function storeSummaries(data: PokemonSummary[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    // Storage can be full or disabled; the app still works without it.
  }
}

// Loads summaries for the whole dataset. Details are fetched in batches to
// stay friendly to PokéAPI's fair-use policy, and the result is cached in
// localStorage so repeat visits make no requests at all.
export async function loadAllSummaries(
  onProgress?: (loaded: number, total: number) => void,
): Promise<PokemonSummary[]> {
  const stored = readStoredSummaries()
  if (stored) return stored

  const list = await cachedGet<PokemonListResponse>(`/pokemon?limit=${POKEMON_LIMIT}`)
  const ids = list.results.map((r) => idFromUrl(r.url))
  const summaries: PokemonSummary[] = []

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map((id) => getPokemon(id)))
    summaries.push(...results.map(toSummary))
    onProgress?.(summaries.length, ids.length)
  }

  storeSummaries(summaries)
  return summaries
}

export function describeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 404) return 'That Pokémon could not be found.'
    if (err.response?.status === 429) return 'PokéAPI is rate limiting requests. Please wait a moment and try again.'
    if (err.code === 'ECONNABORTED') return 'The request to PokéAPI timed out.'
    if (!err.response) return 'Could not reach PokéAPI. Check your connection and try again.'
    return `PokéAPI returned an error (${err.response.status}).`
  }
  return 'Something went wrong while loading data.'
}

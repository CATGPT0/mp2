import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { describeError, loadAllSummaries, POKEMON_LIMIT } from '../api/pokeapi'
import type { PokemonSummary } from '../types/pokemon'
import { PokemonContext, type LoadStatus, type PokemonContextValue } from './pokemonContext'

export default function PokemonProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [pokemon, setPokemon] = useState<PokemonSummary[]>([])
  const [progress, setProgress] = useState({ loaded: 0, total: POKEMON_LIMIT })
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    loadAllSummaries((loaded, total) => {
      if (!cancelled) setProgress({ loaded, total })
    })
      .then((data) => {
        if (cancelled) return
        setPokemon(data)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(describeError(err))
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setStatus('loading')
    setError(null)
    setProgress({ loaded: 0, total: POKEMON_LIMIT })
    setAttempt((n) => n + 1)
  }, [])

  const value = useMemo<PokemonContextValue>(
    () => ({ status, pokemon, progress, error, retry }),
    [status, pokemon, progress, error, retry],
  )

  return <PokemonContext.Provider value={value}>{children}</PokemonContext.Provider>
}

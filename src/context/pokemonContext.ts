import { createContext } from 'react'
import type { PokemonSummary } from '../types/pokemon'

export type LoadStatus = 'loading' | 'ready' | 'error'

export interface PokemonContextValue {
  status: LoadStatus
  pokemon: PokemonSummary[]
  progress: { loaded: number; total: number }
  error: string | null
  retry: () => void
}

export const PokemonContext = createContext<PokemonContextValue | null>(null)

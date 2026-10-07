import { useContext } from 'react'
import { PokemonContext, type PokemonContextValue } from '../context/pokemonContext'

export default function usePokemonList(): PokemonContextValue {
  const value = useContext(PokemonContext)
  if (!value) throw new Error('usePokemonList must be used inside <PokemonProvider>')
  return value
}

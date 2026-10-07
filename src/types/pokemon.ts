// Shapes of the PokéAPI responses we use (only the fields we read).

export interface NamedAPIResource {
  name: string
  url: string
}

export interface PokemonResponse {
  id: number
  name: string
  height: number // decimetres
  weight: number // hectograms
  base_experience: number | null
  types: { slot: number; type: NamedAPIResource }[]
  stats: { base_stat: number; stat: NamedAPIResource }[]
  abilities: { is_hidden: boolean; ability: NamedAPIResource }[]
  sprites: {
    front_default: string | null
    other?: {
      'official-artwork'?: { front_default: string | null }
    }
  }
  species: NamedAPIResource
}

export interface SpeciesResponse {
  id: number
  name: string
  capture_rate: number
  base_happiness: number | null
  is_legendary: boolean
  is_mythical: boolean
  color: NamedAPIResource
  habitat: NamedAPIResource | null
  generation: NamedAPIResource
  genera: { genus: string; language: NamedAPIResource }[]
  flavor_text_entries: {
    flavor_text: string
    language: NamedAPIResource
    version: NamedAPIResource
  }[]
  evolution_chain: { url: string } | null
}

export interface ChainLink {
  species: NamedAPIResource
  evolves_to: ChainLink[]
}

export interface EvolutionChainResponse {
  id: number
  chain: ChainLink
}

export interface PokemonListResponse {
  count: number
  results: NamedAPIResource[]
}

// The compact record the list and gallery views work with.
export interface PokemonSummary {
  id: number
  name: string
  types: string[]
  height: number
  weight: number
  baseExperience: number
  totalStats: number
  sprite: string
  artwork: string
}

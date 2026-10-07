// A handful of Pokémon have punctuation that the API slugs drop.
const SPECIAL_NAMES: Record<string, string> = {
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  'mr-mime': 'Mr. Mime',
  'mr-rime': 'Mr. Rime',
  'mime-jr': 'Mime Jr.',
  farfetchd: 'Farfetch’d',
  sirfetchd: 'Sirfetch’d',
  'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z',
  'type-null': 'Type: Null',
}

export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

// "special-attack" -> "Special Attack"
export function titleCase(slug: string): string {
  return slug.split('-').map(capitalize).join(' ')
}

export function displayName(slug: string): string {
  return SPECIAL_NAMES[slug] ?? titleCase(slug)
}

export function formatId(id: number): string {
  return `#${String(id).padStart(3, '0')}`
}

// PokéAPI reports height in decimetres and weight in hectograms.
export function formatHeight(decimetres: number): string {
  return `${(decimetres / 10).toFixed(1)} m`
}

export function formatWeight(hectograms: number): string {
  return `${(hectograms / 10).toFixed(1)} kg`
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

export function statLabel(slug: string): string {
  return STAT_LABELS[slug] ?? titleCase(slug)
}

// Flavor text from the games contains form feeds and hard line breaks.
export function cleanFlavorText(text: string): string {
  return text.replace(/[\f\n\r­]+/g, ' ').replace(/\s+/g, ' ').trim()
}

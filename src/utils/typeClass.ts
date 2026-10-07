import typeStyles from '../styles/types.module.css'

// Returns the CSS module class that sets --type-color for a Pokémon type.
export function typeClass(type: string | undefined): string {
  return (type && typeStyles[type]) || typeStyles.normal
}

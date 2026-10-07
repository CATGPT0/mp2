import { capitalize } from '../utils/format'
import { typeClass } from '../utils/typeClass'
import styles from './TypeBadge.module.css'

interface TypeBadgeProps {
  type: string
  size?: 'small' | 'large'
}

export default function TypeBadge({ type, size = 'small' }: TypeBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[size]} ${typeClass(type)}`}>{capitalize(type)}</span>
  )
}

import { statLabel } from '../utils/format'
import styles from './StatRings.module.css'

// Rings fill completely at this value; the legend always shows the exact
// number, so the few stats above it (Chansey's HP) simply read as full.
const RING_MAX = 200
const SIZE = 240
const CENTER = SIZE / 2
const STROKE = 10
const GAP = 4.5
const OUTER_RADIUS = 112

const STAT_CLASS: Record<string, string> = {
  hp: styles.hp,
  attack: styles.attack,
  defense: styles.defense,
  'special-attack': styles.spAtk,
  'special-defense': styles.spDef,
  speed: styles.speed,
}

interface StatRingsProps {
  stats: { name: string; value: number }[]
}

export default function StatRings({ stats }: StatRingsProps) {
  const total = stats.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className={styles.wrap}>
      <div className={styles.chart}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={styles.svg}
          role="img"
          aria-label={stats.map((s) => `${statLabel(s.name)} ${s.value}`).join(', ')}
        >
          {stats.map((s, i) => {
            const r = OUTER_RADIUS - i * (STROKE + GAP)
            const pct = Math.min(s.value / RING_MAX, 1) * 100
            return (
              <g key={s.name} className={STAT_CLASS[s.name]}>
                <circle className={styles.track} cx={CENTER} cy={CENTER} r={r} strokeWidth={STROKE} />
                <circle
                  className={styles.value}
                  cx={CENTER}
                  cy={CENTER}
                  r={r}
                  strokeWidth={STROKE}
                  pathLength={100}
                  strokeDasharray={`${pct} 100`}
                  transform={`rotate(-90 ${CENTER} ${CENTER})`}
                />
              </g>
            )
          })}
        </svg>
        <div className={styles.center}>
          <span className={styles.total}>{total}</span>
          <span className={styles.totalLabel}>Total</span>
        </div>
      </div>

      <ul className={styles.legend}>
        {stats.map((s) => (
          <li key={s.name} className={`${styles.legendItem} ${STAT_CLASS[s.name] ?? ''}`}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label}>{statLabel(s.name)}</span>
            <span className={styles.number}>{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

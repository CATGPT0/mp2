import styles from './HeightCompare.module.css'

const TRAINER_METRES = 1.7
const WIDTH = 160
const HEIGHT = 112
const GROUND = 98
const TALLEST = 84

interface HeightCompareProps {
  metres: number
  name: string
}

// Draws the Pokémon as a bar next to a simple 1.7 m trainer figure, both
// scaled so the taller of the two fills the drawing.
export default function HeightCompare({ metres, name }: HeightCompareProps) {
  const scale = TALLEST / Math.max(TRAINER_METRES, metres)
  const trainer = TRAINER_METRES * scale
  const pokemon = Math.max(metres * scale, 3)
  const headR = trainer * 0.09
  const bodyWidth = trainer * 0.26

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label={`${name} is ${metres.toFixed(1)} m tall, shown next to a ${TRAINER_METRES} m trainer`}
    >
      <line className={styles.ground} x1={6} x2={WIDTH - 6} y1={GROUND} y2={GROUND} />
      <g className={styles.trainer}>
        <circle cx={50} cy={GROUND - trainer + headR} r={headR} />
        <rect
          x={50 - bodyWidth / 2}
          y={GROUND - trainer + headR * 2 + 1.5}
          width={bodyWidth}
          height={trainer - headR * 2 - 1.5}
          rx={bodyWidth / 2.4}
        />
      </g>
      <rect
        className={styles.pokemon}
        x={92}
        y={GROUND - pokemon}
        width={36}
        height={pokemon}
        rx={Math.min(9, pokemon / 2)}
      />
      <text className={styles.label} x={50} y={HEIGHT - 2} textAnchor="middle">
        Trainer
      </text>
      <text className={`${styles.label} ${styles.pokemonLabel}`} x={110} y={HEIGHT - 2} textAnchor="middle">
        {metres.toFixed(1)} m
      </text>
    </svg>
  )
}

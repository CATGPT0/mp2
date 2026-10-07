import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { POKEMON_LIMIT } from '../api/pokeapi'
import controls from '../styles/controls.module.css'
import { ShuffleIcon } from './Icons'
import styles from './NavBar.module.css'

function segmentClass({ isActive }: { isActive: boolean }): string {
  return isActive ? `${controls.segment} ${controls.segmentActive}` : controls.segment
}

export default function NavBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Where the sliding pill sits: under "Search", under "Gallery", or hidden
  // on pages that belong to neither (detail, 404).
  const position = pathname === '/' ? '' : pathname.startsWith('/gallery') ? controls.second : controls.none

  function surpriseMe() {
    const id = Math.floor(Math.random() * POKEMON_LIMIT) + 1
    navigate(`/pokemon/${id}`)
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label="PokéExplorer home">
          <span className={styles.mark} aria-hidden="true" />
          <span className={styles.wordmark}>PokéExplorer</span>
        </Link>

        <nav className={`${controls.segmented} ${position}`} aria-label="Main">
          <span className={controls.indicator} aria-hidden="true" />
          <NavLink to="/" end className={segmentClass}>
            Search
          </NavLink>
          <NavLink to="/gallery" className={segmentClass}>
            Gallery
          </NavLink>
        </nav>

        <button type="button" className={styles.surprise} onClick={surpriseMe} title="Jump to a random Pokémon">
          <ShuffleIcon className={styles.surpriseIcon} />
          <span className={styles.surpriseText}>Surprise me</span>
        </button>
      </div>
    </header>
  )
}

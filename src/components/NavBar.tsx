import { Link, NavLink } from 'react-router-dom'
import styles from './NavBar.module.css'

function navClass({ isActive }: { isActive: boolean }): string {
  return isActive ? `${styles.link} ${styles.active}` : styles.link
}

export default function NavBar() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.ball} aria-hidden="true" />
          PokéExplorer
        </Link>
        <nav className={styles.nav} aria-label="Main">
          <NavLink to="/" end className={navClass}>
            Search
          </NavLink>
          <NavLink to="/gallery" className={navClass}>
            Gallery
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

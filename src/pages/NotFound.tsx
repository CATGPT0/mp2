import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <section className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>This page fled!</h1>
      <p className={styles.text}>The page you were looking for doesn’t exist.</p>
      <Link to="/" className={styles.home}>
        Back to search
      </Link>
    </section>
  )
}

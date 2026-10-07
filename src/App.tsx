import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import NavBar from './components/NavBar'
import PokemonProvider from './context/PokemonProvider'
import DetailView from './pages/DetailView'
import GalleryView from './pages/GalleryView'
import ListView from './pages/ListView'
import NotFound from './pages/NotFound'
import styles from './App.module.css'

// Start each page at the top, except when only the query string changes
// (typing in the search box or toggling filters).
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <PokemonProvider>
      <ScrollToTop />
      <div className={styles.app}>
        <NavBar />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<ListView />} />
            <Route path="/gallery" element={<GalleryView />} />
            <Route path="/pokemon/:id" element={<DetailView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className={styles.footer}>
          Data from{' '}
          <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">
            PokéAPI
          </a>
          . Pokémon and Pokémon character names are trademarks of Nintendo.
        </footer>
      </div>
    </PokemonProvider>
  )
}

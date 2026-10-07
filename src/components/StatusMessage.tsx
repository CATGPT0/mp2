import styles from './StatusMessage.module.css'

interface LoadingProps {
  message?: string
  progress?: { loaded: number; total: number }
}

export function Loading({ message = 'Loading…', progress }: LoadingProps) {
  return (
    <div className={styles.status} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.message}>{message}</p>
      {progress && progress.loaded > 0 && (
        <>
          <progress className={styles.progress} value={progress.loaded} max={progress.total} />
          <p className={styles.hint}>
            {progress.loaded} / {progress.total} Pokémon
          </p>
        </>
      )}
    </div>
  )
}

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className={`${styles.status} ${styles.error}`} role="alert">
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

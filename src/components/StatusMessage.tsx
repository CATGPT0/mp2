import styles from './StatusMessage.module.css'

interface LoadingProps {
  message?: string
  progress?: { loaded: number; total: number }
}

const SPOKES = Array.from({ length: 12 }, (_, i) => i)

export function Loading({ message = 'Loading…', progress }: LoadingProps) {
  return (
    <div className={styles.status} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true">
        {SPOKES.map((i) => (
          <span key={i} className={styles.spoke} />
        ))}
      </div>
      <p className={styles.message}>{message}</p>
      {progress && progress.loaded > 0 && (
        <>
          <progress className={styles.progress} value={progress.loaded} max={progress.total} />
          <p className={styles.hint}>
            {progress.loaded} of {progress.total}
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
      <span className={styles.errorIcon} aria-hidden="true">
        !
      </span>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

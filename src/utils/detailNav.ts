// State passed through React Router when opening a detail page, so the
// previous/next buttons cycle through the exact list the user came from
// (filtered and sorted), and "Back" returns to it with its filters intact.
export interface DetailNavState {
  ids: number[]
  from: string
  fromLabel: string
}

export function isDetailNavState(value: unknown): value is DetailNavState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Partial<DetailNavState>
  return (
    Array.isArray(v.ids) &&
    v.ids.every((id) => typeof id === 'number') &&
    typeof v.from === 'string' &&
    typeof v.fromLabel === 'string'
  )
}

export const findHashPosition = (hash: string): { el: string, behavior: ScrollBehavior, top: number } | undefined => {
  const el = document.querySelector(hash)
  if (!el) return undefined

  const top = parseFloat(getComputedStyle(el).scrollMarginTop)

  return {
    el: hash,
    behavior: 'smooth',
    top,
  }
}

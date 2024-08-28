import { ref, watch, onBeforeMount, onBeforeUnmount } from '#imports'

export type UseScrollSpy = {
  visibleHeadings: string[]
  activeHeadings: string[]
  updateHeadings: (headings: Element[]) => void
}

export const useScrollspy = () => {
  const observer = ref<IntersectionObserver | null>(null)
  const visibleHeadings = ref<string[]>([])
  const activeHeadings = ref<string[]>([])

  const observerCallback = (entries: IntersectionObserverEntry[]): void => {
    entries.forEach((entry) => {
      const id = entry.target.id

      if (entry.isIntersecting) {
        visibleHeadings.value = [...visibleHeadings.value, id]
      } else {
        visibleHeadings.value = visibleHeadings.value.filter((h) => h !== id)
      }
    })
  }

  const updateHeadings = (headings: Element[]): void => {
    headings.forEach((heading) => {
      if (!observer.value) {
        return
      }

      observer.value.observe(heading)
    })
  }

  watch(visibleHeadings, (val, oldVal) => {
    if (val.length === 0) {
      activeHeadings.value = oldVal
    } else {
      activeHeadings.value = val
    }
  })

  onBeforeMount(() => {
    observer.value = new IntersectionObserver(observerCallback)
  })

  onBeforeUnmount(() => observer.value?.disconnect())

  return {
    visibleHeadings,
    activeHeadings,
    updateHeadings,
  }
}

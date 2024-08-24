import { globSync } from 'glob'

export const getContentRoutes = (): string[] => {
  const routeNames = globSync('src/content/**/*.md').map((f) => {
    const replaced = f
      .replaceAll('\\', '/')
      .replaceAll('src/content', '')
      .replace('.md', '')
    return `/posts${replaced}`
  })

  return [...routeNames]
}

import { readdirSync } from 'fs'

export const getContentRoutes = (): string[] => {
  let contentRoutes: string[] = []

  readdirSync('./src/content', { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .forEach((dirent) => {
      const dirRef = readdirSync(`./src/content/${dirent.name}`, { withFileTypes: true })

      const postRoutes = dirRef.map((f) => {
        const replaced = f.name
          .replaceAll('\\', '/')
          .replaceAll('src/content', '')
          .replace('.md', '')

        return `/posts/${dirent.name}/${replaced}`
      })

      const count = dirRef.filter((subDirent) => subDirent.isFile() && subDirent.name.includes('.md')).length

      let maxPageNum = Math.floor(count / 5)
      // ページネーションのため、あまりが出たときはページ数を 1 追加する
      if (count % 5 > 0) {
        maxPageNum++
      }

      const categoryRoutes = Array.from({ length: maxPageNum }, (_, pageNum) => pageNum + 1)
        .map((pageNum) => {
          return `/posts/categories/${dirent.name}/${pageNum}`
        })

      contentRoutes = [...contentRoutes, ...postRoutes, ...categoryRoutes]
    })

  return contentRoutes
}

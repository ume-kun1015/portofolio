import { readdirSync } from 'fs'

import { per } from '../../../constant/post'

export const getContentRoutes = (): string[] => {
  let contentRoutes: string[] = []

  const dirRef = readdirSync('./src/content', { withFileTypes: true, recursive: true })
  const count = dirRef.filter((dirent) => dirent.isFile() && dirent.name.includes('.md')).length

  let maxPageNum = Math.floor(count / per)
  // ページネーションのため、あまりが出たときはページ数を 1 追加する
  if (count % per > 0) {
    maxPageNum++
  }

  const postRoutes = Array.from({ length: maxPageNum }, (_, pageNum) => pageNum + 1)
    .map((pageNum) => `/posts/${pageNum}`)

  contentRoutes = [...postRoutes]

  readdirSync('./src/content', { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .forEach((dirent) => {
      const subdirRef = readdirSync(`./src/content/${dirent.name}`, { withFileTypes: true })

      const postRoutes = subdirRef.map((f) => {
        const replaced = f.name
          .replaceAll('\\', '/')
          .replaceAll('src/content', '')
          .replace('.md', '')

        return `/posts/${dirent.name}/${replaced}`
      })

      const count = subdirRef.filter((subDirent) => subDirent.isFile() && subDirent.name.includes('.md')).length

      let maxPageNum = Math.floor(count / per)
      // ページネーションのため、あまりが出たときはページ数を 1 追加する
      if (count % per > 0) {
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

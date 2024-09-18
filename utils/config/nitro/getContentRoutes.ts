import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

import { parseFrontMatter } from 'remark-mdc'

import { per, categoryUrlParamsMap } from '../../../constant/post'

const getFrontMatter = (markdownPath: string): { categories: string[], draft: boolean } => {
  const { data: frontmatter } = parseFrontMatter(readFileSync(markdownPath, 'utf8'))
  const { categories, draft } = frontmatter
  return { categories, draft }
}

export const getContentRoutes = (): string[] => {
  const markdownFiles = readdirSync('./src/content', { withFileTypes: true, recursive: true })
    .filter((dirent) => dirent.isFile() && dirent.name.includes('.md'))

  const postRoutes: string[] = []

  let allPageCount = 0
  const markdownNumByCategoryMap: Record<string, number> = {}
  for (const markdownFile of markdownFiles) {
    const frontmatter = getFrontMatter(`${markdownFile.path}/${markdownFile.name}`)
    if (frontmatter.draft) continue

    allPageCount++

    const path = `${markdownFile.path}/${markdownFile.name}`
      .replaceAll('\\', '/')
      .replaceAll('src/content', '')
      .replace('.md', '')

    postRoutes.push(join('/posts', path))

    for (const category of frontmatter.categories) {
      const urlParamCategory = categoryUrlParamsMap[category] || category

      if (markdownNumByCategoryMap[urlParamCategory]) {
        markdownNumByCategoryMap[urlParamCategory]++
      } else {
        markdownNumByCategoryMap[urlParamCategory] = 1
      }
    }
  }

  let maxPageNum = Math.floor(allPageCount / per)
  // ページネーションのため、あまりが出たときはページ数を 1 追加する
  if (allPageCount % per > 0) {
    maxPageNum++
  }

  postRoutes.push(...Array.from({ length: maxPageNum }, (_, pageNum) => pageNum + 1)
    .map((pageNum) => join('/posts', pageNum.toString())))

  const contentRoutes: string[] = []

  for (const category of Object.keys(markdownNumByCategoryMap)) {
    const urlParamCategory = categoryUrlParamsMap[category] || category

    if (!markdownNumByCategoryMap[urlParamCategory]) continue

    const markdownCount = markdownNumByCategoryMap[urlParamCategory]
    let categoryPageCount = Math.floor(markdownCount / per)
    // ページネーションのため、あまりが出たときはページ数を 1 追加する
    if (markdownNumByCategoryMap[urlParamCategory] % per > 0) {
      categoryPageCount++
    }

    const categoryPageRoutes = Array.from({ length: categoryPageCount }, (_, pageNum) => pageNum + 1)
      .map((pageNum) => join('/posts/categories', urlParamCategory.toLowerCase(), pageNum.toString()))

    contentRoutes.push(...categoryPageRoutes)
  }

  return ['/sitemap.xml', ...postRoutes, ...contentRoutes]
}

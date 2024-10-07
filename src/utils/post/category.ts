import { categoryUrlParamsMap } from '~~/constant/post'

export const toPathString = (category: string): string => {
  const found = categoryUrlParamsMap[category]
  return found || category.toLowerCase()
}

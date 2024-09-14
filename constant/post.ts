export const per = 5

export const categoryUrlParamsMap: Record<string, string> = {
  'GitHub Actions': 'githubactions',
  JavaScript: 'javascript',
  'Ruby on Rails': 'rubyonrails',
  VeeValidate: 'veevalidate',
}

export const urlParamsCategoryMap: Record<string, string> = Object.keys(categoryUrlParamsMap)
  .reduce((previous, key) => {
    const newKey = categoryUrlParamsMap[key]
    const newValue = key

    return { ...previous, [newKey]: newValue }
  }, {})

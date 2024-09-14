import { join } from 'path'

import { defineEventHandler } from '#imports'
import { SitemapStream, streamToPromise } from 'sitemap'

import { serverQueryContent } from '#content/server'

export default defineEventHandler(async (event) => {
  const docs = await serverQueryContent(event).find()
  const sitemap = new SitemapStream({
    hostname: 'https://offich.me',
    lastmodDateOnly: true,
  })

  for (const doc of docs) {
    if (doc.draft) {
      continue
    }

    sitemap.write({
      url: join('/posts', doc._path),
      changefreq: 'weekly',
      lastmod: doc.updatedAt,
      priority: doc.priority || 0.5,
    })
  }

  sitemap.end()

  return streamToPromise(sitemap)
})

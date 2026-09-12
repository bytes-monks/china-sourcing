import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { headFor } from '../lib/head'

/**
 * Keeps `<title>` and the `data-seo` meta block in step with the current route
 * after a client-side navigation.
 *
 * Every route is prerendered with its own tags already in place, so on first
 * paint this finds the head already correct and rewrites it to the same
 * values. It earns its keep on in-app navigation, which changes the URL
 * without touching the document head.
 */
export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const head = headFor(pathname)
    document.title = head.title

    // Replace wholesale rather than diffing: the prerendered set and the set
    // built here are generated from the same list, so a stale tag can only
    // come from the previous route.
    document.head.querySelectorAll('[data-seo]').forEach(el => el.remove())

    const anchor = document.head.querySelector('meta[name="author"]')
    for (const tag of head.tags) {
      const el =
        tag.kind === 'canonical'
          ? Object.assign(document.createElement('link'), { rel: 'canonical', href: tag.content })
          : document.createElement('meta')
      if (tag.kind !== 'canonical') {
        el.setAttribute(tag.kind, tag.key)
        el.setAttribute('content', tag.content)
      }
      el.setAttribute('data-seo', '')
      document.head.insertBefore(el, anchor)
    }
  }, [pathname])

  return null
}

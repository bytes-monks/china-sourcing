import { Suspense, useEffect } from 'react'
import { useRoutes } from 'react-router-dom'
import { routes } from './routes'
import Seo from './components/Seo'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  const element = useRoutes(routes)

  // A flag the pixel/hydration harness gates on. Every check used to wait for
  // `header nav a`, which the PRERENDERED markup already contains — so a build
  // whose client JS 404s satisfied it on first paint and every gate went green
  // on a dead page. This is the one signal that cannot be faked by server
  // markup. It touches no DOM, so it costs no pixels.
  useEffect(() => {
    window.__hydrated = true
  }, [])

  return (
    <>
      <Seo />
      <ScrollToTop />
      {/* No spinner: every route is prerendered, so the only time this
          boundary is visible is an in-app navigation, where a flash of empty
          frame reads worse than the half-beat the chunk takes to arrive. */}
      <Suspense fallback={null}>{element}</Suspense>
    </>
  )
}

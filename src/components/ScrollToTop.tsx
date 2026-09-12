import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Restores the top of the page on navigation. The canvas did this in its own
 * `nav()` handler; the router does not, and without it a click from the bottom
 * of a long page lands mid-way down the next one.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

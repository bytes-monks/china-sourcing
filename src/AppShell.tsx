// The page frame: announcement bar, masthead, routed page, footer, sticky pills.
// Reproduces the design canvas's outermost `min-height:100vh` column.
import { Outlet, useLocation } from 'react-router-dom'
import { normalizePath } from './lib/routes'
import TopBar from './components/TopBar'
import SiteHeader from './components/SiteHeader'
import SiteCta from './components/SiteCta'
import SiteFooter from './components/SiteFooter'
import StickyContact from './components/StickyContact'

export default function AppShell() {
  const { pathname } = useLocation()
  // The canvas hid the floating pills on the contact page — there is already a
  // form on screen, so a button that scrolls to it is noise.
  const showSticky = normalizePath(pathname) !== '/contact'

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Beyond the canvas: twelve focusable items sit ahead of the page
          content on every route. Clipped to nothing at rest — the pixel gate
          shoots the resting state — and painted by .skip-link:focus only when
          it takes focus. data-beyond-canvas keeps it out of check-hover, which
          has no design counterpart to compare it against. */}
      <a
        className="skip-link"
        data-beyond-canvas
        href="#main"
        style={{ position: "absolute", width: "1px", height: "1px", padding: "0", margin: "-1px", border: "0", overflow: "hidden", clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap" }}
      >Skip to content</a>
      <TopBar />
      <SiteHeader />
      <main id="main" tabIndex={-1} style={{ flex: "1", outline: "none" }}>
        <Outlet />
      </main>
      <SiteCta />
      <SiteFooter />
      {showSticky && <StickyContact />}
    </div>
  )
}

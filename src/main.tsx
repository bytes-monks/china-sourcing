import { StrictMode } from 'react'
import { hydrateRoot, createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const root = document.getElementById('root')!
const tree = (
  <StrictMode>
    {/* import.meta.env.BASE_URL is vite.config.ts's `base`, i.e. BASE_URL from
        the deploy workflow. Without it a project-subpath deploy (/repo/) has
        no matching route, useRoutes returns null, and hydration replaces the
        correct server HTML with an empty #root. entry-server.tsx passes the
        same basename so the two agree. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Every route ships as prerendered HTML, so the normal path is hydration.
// `createRoot` is the fallback for a dev server, where #root starts empty.
if (root.hasChildNodes()) hydrateRoot(root, tree)
else createRoot(root).render(tree)

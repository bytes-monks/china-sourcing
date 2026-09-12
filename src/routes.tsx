// Route elements. Each page is lazy so a visit costs one page's JS, not ten;
// scripts/prerender.mjs emits a modulepreload for the matching chunk so the
// split never costs a round trip on first paint.
import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'
import AppShell from './AppShell'
// Not lazy: it is tiny, and the point of a 404 is that it appears at once.
import NotFound from './pages/NotFound'

const Home = lazy(() => import('./pages/Home'))
const Services = lazy(() => import('./pages/Services'))
const Process = lazy(() => import('./pages/Process'))
const Industries = lazy(() => import('./pages/Industries'))
const Pricing = lazy(() => import('./pages/Pricing'))
const About = lazy(() => import('./pages/About'))
const Faq = lazy(() => import('./pages/Faq'))
const Audit = lazy(() => import('./pages/Audit'))
const Contact = lazy(() => import('./pages/Contact'))
const Mobile = lazy(() => import('./pages/Mobile'))

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'services', element: <Services /> },
      { path: 'process', element: <Process /> },
      { path: 'industries', element: <Industries /> },
      { path: 'pricing', element: <Pricing /> },
      { path: 'about', element: <About /> },
      { path: 'faq', element: <Faq /> },
      { path: 'audit', element: <Audit /> },
      { path: 'contact', element: <Contact /> },
      { path: 'mobile', element: <Mobile /> },
      // A CHILD of '/', not a second top-level route. React Router will not
      // match a parent unless a descendant matches, so without this
      // `useRoutes` returned null for any unknown path and dropped AppShell
      // with it — dist/404.html rendered a completely blank page.
      { path: '*', element: <NotFound /> },
    ],
  },
]

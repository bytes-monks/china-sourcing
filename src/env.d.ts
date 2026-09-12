/// <reference types="vite/client" />

/** Injected by vite.config.ts's `define`; shared by the client and SSR builds. */
declare const __BUILD_YEAR__: string

interface Window {
  /** Set by src/App.tsx once React has mounted. Read only by scripts/ in the
   *  pixel-fidelity harness, to prove the client bundle actually ran. */
  __hydrated?: true
}

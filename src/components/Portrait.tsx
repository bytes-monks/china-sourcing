// The portrait slot on Home and About — declared divergence `portrait-slot`.
//
// The canvas draws a dashed 4:5 box and fills it with notes to itself: "Photo
// placeholder", a description of a photo nobody has taken, "PORTRAIT · 1200 ×
// 1500". The site shipped those words to every visitor. This component keeps
// the box and replaces what is in it.
//
// What is kept, exactly: the OUTER element and every declaration on it, in
// the canvas's order. That box is load-bearing — on Home its height sets the
// hero's, and the "Example order" card hangs off its bottom-left corner — so
// the pixel harness still diffs its position and size. What changes is only
// its content. The outer element carries `data-portrait`, and the harness
// masks that rect on both sides before diffing (minus the order card, which
// overlaps it on Home and is still compared).
//
// The content is one of two things:
//
//   PORTRAIT set in src/lib/site.ts  The photograph, cropped to fill the box.
//                                    It is absolutely positioned, so the image
//                                    can never size the box: whatever file is
//                                    dropped in, the layout does not move.
//   PORTRAIT null (today)            A finished card in the canvas's own
//                                    vocabulary: the masthead's rotated red "B"
//                                    seal at display size, over a caption drawn
//                                    from what the site already says. No
//                                    "placeholder", no pixel dimensions, and no
//                                    stock photo standing in for a real person.
//
// The fallback has one hard constraint. An `aspect-ratio` box still grows to
// fit content taller than the ratio allows (its min-height is `auto`), so the
// fallback is sized to fit the smallest box it is drawn in — Home at 320px
// wide, 232 × 302 inside the padding, with the order card over the bottom
// ~83px of that. It scales with the box through container query units rather
// than with the viewport, because the box is not proportional to the viewport:
// it stops growing at 1260px, and below 860px mobile.css makes it full-width.
import type { CSSProperties } from 'react'
import { PORTRAIT } from '../lib/site'

interface Props {
  /** The outer box's flex gap — the one declaration the two artboards draw
   *  differently (10px on Home, 9px on About). */
  gap: string
  /** The fallback's line of copy. Every word of it must be something the site
   *  already says; this slot is where a photo of a real person goes. */
  caption: string
  /** Home: the photo is the hero's largest element, so it is fetched eagerly at
   *  high priority. About: it is beside the fold at best, so it waits. */
  priority?: boolean
  /** Home: the order card covers the bottom of the box, so the fallback centres
   *  itself in the part above it instead of disappearing under it. */
  clearBottom?: boolean
}

/** A root-relative src respects the deploy base (BASE_URL=/repo/ for a project
 *  page); an absolute URL is used as given. */
const resolve = (src: string): string =>
  src.startsWith('/') && !src.startsWith('//') ? `${import.meta.env.BASE_URL}${src.slice(1)}` : src

export default function Portrait({ gap, caption, priority = false, clearBottom = false }: Props) {
  const photo = PORTRAIT

  return (
    <div
      data-portrait={photo ? 'photo' : 'fallback'}
      style={{
        // Verbatim from the canvas, in its order.
        aspectRatio: "4/5", border: "1px dashed rgba(192,57,47,.4)", background: "#E9E0CF", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap, textAlign: "center", padding: "24px",
        // Only with a photo, which is positioned against it. No offsets, so
        // the box does not move; left off otherwise so the fallback is the
        // canvas's element plus an attribute and nothing else.
        ...(photo ? { position: 'relative' as const } : {}),
      }}
    >
      {photo ? (
        <img
          src={resolve(photo.src)}
          width={photo.width}
          height={photo.height}
          alt={photo.alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'auto' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          // -1px on every side so the photo covers the dashed rule too: a
          // dashed border round a photograph reads as a placeholder again.
          style={{ position: 'absolute', inset: '-1px', width: 'calc(100% + 2px)', height: 'calc(100% + 2px)', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Fallback caption={caption} clearBottom={clearBottom} />
      )}
    </div>
  )
}

function Fallback({ caption, clearBottom }: { caption: string; clearBottom: boolean }) {
  return (
    // Stretched across the box and made a size container, so everything in it
    // can be sized in cqw — a fraction of the box, not of the window.
    <div style={{ alignSelf: 'stretch', flex: '1 1 auto', containerType: 'inline-size', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: clearBottom ? '90px' : '0' }}>
      {/* The masthead seal — 38px square, a 24px "B", 3px radius, -3deg —
          scaled as one unit through --seal. Decorative: the name is in the
          line beneath it. */}
      <span
        aria-hidden="true"
        style={{ '--seal': 'clamp(72px, 29cqw, 128px)', width: 'var(--seal)', height: 'var(--seal)', background: '#C0392F', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', borderRadius: 'calc(var(--seal) * .08)', transform: 'rotate(-3deg)', marginBottom: 'clamp(18px, 6.4cqw, 28px)' } as CSSProperties}
      >
        <span style={{ font: "400 calc(var(--seal) * .63)/1 'Instrument Serif',serif", color: '#F4F0E8' }}>B</span>
      </span>
      {/* #1A1614 on #E9E0CF is 13.7:1. */}
      <span style={{ font: "400 clamp(20px, 5.9cqw, 26px)/1.2 'Instrument Serif',serif", color: '#1A1614', maxWidth: '12em', textWrap: 'balance' }}>{caption}</span>
      {/* #6B6259, the canvas's grey for mono notes: 4.6:1 on #E9E0CF. */}
      <span style={{ font: "500 10px 'JetBrains Mono',monospace", letterSpacing: '.16em', textTransform: 'uppercase', color: '#6B6259', marginTop: '14px' }}>Bachar · The China Guy</span>
    </div>
  )
}

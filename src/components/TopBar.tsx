// TopBar.
// Transpiled from the design canvas by scripts/from-design.mjs — every style
// value is copied verbatim from "Bachar The China Guy.dc.html", with two
// declared divergences (ids shared with the pixel harness, which replays each
// one onto the canvas DOM before the shutter so the diff stays at zero):
//
//   topbar-no-mobile-link      The canvas had a third item here, MOBILE, to
//                              /mobile/ — a page that documents the site's own
//                              responsive layer. It is not something a buyer
//                              sourcing from China came for, and it sat in the
//                              first line of every page. Removed; the route
//                              still exists and still prerenders.
//   topbar-languages-contrast  The language list was rgba(244,240,232,.45) on
//                              #1A1614: 4.1:1, under the 4.5:1 that 11px text
//                              needs. .55 is 5.5:1, and still reads as the
//                              quietest thing on the bar.

import { Link } from 'react-router-dom'

export default function TopBar() {
  return (
    <div data-m="topbar" style={{ background: "#1A1614", color: "rgba(244,240,232,.7)", fontFamily: "'JetBrains Mono',monospace", fontSize: "11px", letterSpacing: ".02em" }}>
      <div data-m="topbar-row" style={{ maxWidth: "1260px", margin: "0 auto", padding: "10px 32px", display: "flex", flexWrap: "wrap", gap: "18px", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "9px" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C0392F", display: "inline-block" }} />BASED IN GUANGZHOU · I BUY IN GUANGZHOU, FOSHAN, YIWU & SHENZHEN · I ANSWER EVERY MESSAGE MYSELF</span>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <Link className="hv-cream" to="/audit/" style={{ color: "rgba(244,240,232,.7)", textDecoration: "none", borderBottom: "1px solid rgba(244,240,232,.25)" }}>SAMPLE AUDIT REPORT</Link>
          <span style={{ color: "rgba(244,240,232,.55)" }}>EN · 中文 · العربية</span>
        </div>
      </div>
    </div>
  )
}

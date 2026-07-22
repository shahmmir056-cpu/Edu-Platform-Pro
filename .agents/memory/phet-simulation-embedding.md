---
name: PhET simulation embedding
description: How to embed official PhET HTML5 science/math simulations via iframe for a "virtual lab" style feature.
---

Official PhET Interactive Simulations (University of Colorado Boulder) HTML5 sims can be embedded
directly via iframe from any origin: their pages return `access-control-allow-origin: *` and set no
`X-Frame-Options` header, so they are not blocked by browser framing/CORS restrictions.

URL pattern: `https://phet.colorado.edu/sims/html/{slug}/latest/{slug}_en.html`

**Why:** confirmed via live HTTP header checks before building a Virtual Lab feature — avoids assuming
embeddability and getting blocked at runtime by X-Frame-Options/CSP.

**How to apply:** when a project wants interactive physics/chemistry/biology/math simulations, prefer
embedding real PhET sims over building custom ones. Not every slug exists — verify each slug resolves
(some intuitive names like `optics-lab` or `reactions-and-rates` 404) before relying on it, e.g. via a
quick HTTP HEAD/GET check per candidate slug.

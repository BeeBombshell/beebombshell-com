# Footer: minimal specimen wordmark

Audience: the coding agent working in this repo. Read `design.md` and `copy.md` first. `design.md` wins on any conflict about tokens, type, motion, accessibility, or particles; note any difference in the PR.

Reference prototype (layout, metrics code, spotlight feel): https://claude.ai/artifact/9HdedBqecxBNep5mStUCrC. Use it for behavior and feel; rebuild on the real stack.

## 1. Goal

A footer with almost nothing in it and one playful element: a giant mono wordmark **made of particles** (an outline of dots, with bare dashed construction guides) that scatters from the cursor and reforms. It follows the particle system in `design.md` and the "specimen" candidate in Texture and open question 6. About 340 to 380px tall on desktop. Quiet at rest, fun when touched.

**Removed on purpose (do not add back):** the `Status:` prefix, the `FIG 0.5` caption, the rotating "last updated" line, the discipline tagline, and the guide metric labels (`BASE`, `X-HT`, `CAP`). The guides stay as bare dashed lines. No captions, readouts, or jokes in this footer.

## 2. Structure

1. **Talk row.** Hairline above. Left: status (pixel glyph plus text), `h2`, one-line subtext. Right: `Book a call`.
2. **Specimen.** The wordmark with three dashed guides. Nothing around it.
3. **Link bar.** Hairline above. Left: GitHub, X, LinkedIn, `llms.txt`. Right: copyright and `up we go ↑`.

Two full-width hairlines, both `--line` at 0.5px. No cards or shadows.

## 3. Copy (add to `copy.md`, read from there)

| Key | String |
| --- | --- |
| `footer.status` | `Open for chats` (uppercase via CSS, mono 11px) |
| `footer.heading` | `Let's talk` |
| `footer.sub` | `Pick a time. Bring a problem, I'll bring opinions.` |
| `footer.cta` | `Book a call` |
| `footer.copyright` | `© 2026 beebombshell.com` (year can be computed) |
| `footer.top` | `up we go` followed by `↑` |
| `footer.links` | GitHub, X, LinkedIn, `llms.txt`, each with `↗` |

CTAs stay plain. No new strings.

## 4. Particle wordmark

The wordmark is not drawn text. It is a field of particles that spring into the shape of an outlined `BEEBOMBSHELL` (confirm the text with the owner). Use the particle conventions from `design.md` exactly:

| Parameter | Value |
| --- | --- |
| Dots | Square, 1 to 1.9px, `fillRect` (prototype uses 1 to 1.9) |
| Count | About 2,000 to 2,600 on desktop, fewer on mobile (cap at 2,600; thin by random removal) |
| Spring toward target | 0.018 |
| Velocity damping | 0.86 per frame |
| Cursor repel radius / force | 90px / 1.6 (force scales with `1 - distance / radius`) |
| Click burst radius / force | 260px / 14 |
| Resting opacity | 0.85 light, 0.9 dark |
| Color | Palette index from target x (left to right, cool to warm) plus gaussian noise about 0.3; colors read from the `--p0` to `--p5` CSS variables and refreshed on theme change |

**Integration.** The preferred route is a new `wordmark` mode in the shared particle set, retargeting to the footer wordmark as the footer scrolls into view, so the morph is continuous (one particle set, per `design.md`). If the shared canvas cannot host a target inside the footer, fall back to a local canvas in the footer that follows the same constants (the prototype does this). Decide after reading the existing particle code and say which you chose in the PR.

**Targets (sampling).**
1. Fit the word to the column width using real font metrics: measure `M` at 100px, compute the per-character advance (mono advance plus `-0.06em` tracking), and scale the font size so the word fills the column.
2. Draw the outlined text (`strokeText`, line width about `max(1.6, 0.014 * fontSize)`, round joins) into an offscreen canvas, one character at a time at `i * advance`.
3. Read pixels and keep points where alpha passes a threshold, on a grid of about 2.4 to 2.8px with sub-pixel jitter (about 0.8px). Cap the count at 2,600.
4. Re-sample after `document.fonts.ready`, on font swap, and on resize (debounced about 150ms). Do not re-sample on every frame.

**Guides.** Three bare dashed lines (3px dash, 4px gap, `--line`, 1px) at baseline, x-height, and cap height, drawn on the same canvas. Positions come from `measureText` (`actualBoundingBoxAscent` of `H` and `x`), never by eye. No labels.

**Interaction.**
- On first view the particles start scattered and spring into the wordmark (the section's one entrance moment).
- Cursor repels particles (90px / 1.6); they spring back. A click or tap bursts them outward (260px / 14).
- After about 1.2s without a pointer on the wordmark, and always on touch, a virtual cursor drifts slowly across the word on a sine path (x period about 2.1s, small y wobble) so the interaction is discoverable without a mouse.
- `prefers-reduced-motion`: render one static frame with particles at their targets and no cursor interaction.
- Run the loop only while the footer is on screen and the tab is visible. Cap DPR at 2.

## 5. Other components

- **Status glyph.** 8×8 square, `--fg`, stepped 2.4s blink (static under reduced motion). The label is static copy until a real availability source exists.
- **h2.** Grotesk display face, clamp 30 to 40px, weight 400, letter-spacing `-0.035em`. Subtext mono 12.5px, `--mut`.
- **Button.** Pill, `--fg` fill, `--bg` text, mono 13px. Hover lifts 2px and the `↗` moves 3px up and right. A real `<button>` that opens the existing booking popover, with the plain-link fallback. No decoration.
- **Links.** Mono 11.5px, `--mut`, hover to `--fg`, arrow nudges 2px. External links use `target="_blank"` and `rel="noopener noreferrer"`. Use the real GitHub and LinkedIn URLs from config (the prototype uses placeholders). `llms.txt` behaves as in the notch.
- **Up we go.** Scrolls to top (smooth, instant under reduced motion). The `↑` rises 3px on hover.

## 6. Layout, accessibility, performance

- Same page column as the site (max about 960px; 32px padding desktop, 20px mobile). Talk row wraps with the button below the text on narrow screens. Link bar wraps. Respect bottom safe-area insets.
- The wordmark section is decorative: `aria-hidden="true"`. The talk row is a `section` labelled by its `h2`; links sit in a labelled `nav`; the button is a real `button`. Visible 2px `--fg` focus outline, 3px offset. Contrast at least 4.5:1 in both themes.
- One particle loop. Skip repel math for particles outside the cursor's bounding box. Cache the canvas rect; no layout reads inside the frame loop. Batch `fillStyle` changes by sorting particles by color index once. If the fallback local canvas is used, it must not run a second competing particle system while the shared field is active on the same page.
- Only the four core tokens plus the particle palette. Theme transition per `design.md` (500ms).

## 7. Build phases

1. Static footer: talk row, link bar, both themes, mobile, copy from `copy.md`.
2. Wordmark targets: font-fit sizing, outline sampling, bare guides, `fonts.ready` and resize handling.
3. Particles: spring and damping, cursor repel, click burst, palette indexing, entrance, idle drift and touch, reduced-motion static frame.
4. Polish: reduced motion, offscreen pause, focus rings, contrast, booking popover, `llms.txt`.

## 8. Acceptance checklist

- [ ] About 340 to 380px tall at 1440px wide. No captions, labels, readouts, or rotating lines anywhere in the footer.
- [ ] Guides sit exactly on the font's baseline, x-height, and cap height (swap the font and they move with it; the particles re-sample).
- [ ] Particles assemble on first view, repel from the cursor, burst on click, and use the `design.md` constants.
- [ ] Idle drift and touch work; reduced motion shows one static frame.
- [ ] Pastel appears only in the particles; everything else is monochrome.
- [ ] Every string comes from `copy.md`. `Book a call` opens the booking popover; links use real URLs.
- [ ] Both themes pass contrast; focus rings visible; no work done while offscreen; no layout shift when fonts load.

## 9. Open questions for the owner

1. Wordmark text: `BEEBOMBSHELL` or the full name from the badge strap?
2. Real GitHub and LinkedIn URLs.
3. Should the status text stay static, or be driven by something real (calendar availability)?

# Views nobody asked for: redesign plan

Audience: the coding agent working in this repo. Read `design.md` and `copy.md` first. This plan only covers the "Views nobody asked for" section (`№ 004 · FIG 0.4`). `design.md` wins on any conflict about tokens, type, motion, accessibility, or the particle system. If a value here disagrees with it, follow `design.md` and note the difference in the PR.

Reference prototype (one-take-at-a-time idea, word-by-word reveal, pixel pagination): https://claude.ai/artifact/4QeVD6vwtp5RyNBJBydiiN. Use it for feel only. Do not copy its code; build this on the real stack (Motion for springs, the shared particle canvas).

## 1. Goal

Replace the current grid of six tilted cards with a compact, single-row **carousel of real tweets**, one take readable at a time, with the particle field and light interactivity doing the "fun." The section should be about one screen-height or less, quiet at rest, and feel weighted when touched.

What to remove: the tilted cards, the per-card dividers and `share ↗` rows, the `0 requests` stats, and any copy button or clipboard behavior.

## 2. Content

Source of truth is a data file, not JSX. The owner will paste tweets and URLs; the agent turns them into this file.

`content/views.json` (or the repo's equivalent content location):

```json
[
  {
    "id": "001",
    "text": "A good README is the cheapest feature you'll ever ship.",
    "url": "https://x.com/bee_bombshell/status/<id>",
    "date": "2026-03-12"
  }
]
```

Rules:
- `text` is verbatim. Do not edit, shorten, "improve," or re-punctuate it. Preserve line breaks (`white-space: pre-line`) and keep emoji as written.
- `url` must match `^https://(x|twitter)\.com/bee_bombshell/status/\d+`. Normalize `twitter.com` to `x.com`. Strip tracking query strings. Fail the build (or log a loud warning in dev) on an invalid URL.
- `date` is optional (`YYYY-MM-DD`). If present, show it in the meta line. If absent, omit it silently.
- `id` is the display number (`№ 001`). Order in the file is display order, newest first unless the owner says otherwise.
- Do **not** embed X's `widgets.js` or iframes. They add third-party scripts, tracking, and styling we don't control. The tweet text is stored locally; the link goes out to X.
- Do not fetch tweets at build or runtime (X blocks automated access). If the owner's paste is missing a URL, leave `url` out and render the take without a link rather than inventing one. Flag it in the PR description.
- Long tweets: design for 1 to 280 characters. Test with a one-liner, a 280-character tweet, and one with line breaks.

## 3. Copy

All strings live in `copy.md` and follow its humor rules. For this section:
- Keep it plain. No new jokes, captions, or microcopy beyond what `copy.md` already defines for this section. If a string is missing, add a neutral placeholder key (for example `views.link`) and list it in the PR for the owner to fill in.
- Required labels (from `design.md` annotation voice): `№ 004 · FIG 0.4 · UNSOLICITED TAKES`, a position readout (`01 / 06`), and the link label (`open on X ↗` or whatever `copy.md` says).
- The `character` flag in `site/config` gates any humor. With it off, the section must still read cleanly.

## 4. Layout

- Sits in the standard page column (32px padding on desktop, 20px on mobile).
- Header row: `FIG 0.4` caption on the left (mono 11px, secondary color), position readout on the right.
- Stage: a full-width band with hairline (`--line`, 0.5px) top and bottom borders. Height roughly `clamp(220px, 34vw, 300px)`. It must not grow with tweet length: long tweets reduce font size within limits, then clamp (see Typography).
- Active slide is centered. Previous and next slides **peek** from the edges to signal that it is a carousel (about 12 to 18% of the viewport width visible on desktop, a thin sliver on mobile). Peeking slides are scaled to about 0.94, dimmed to about 35% opacity, text clamped to 3 lines.
- Meta line under the active take (mono 11px): `@bee_bombshell · {date}` on the left, the link on the right.
- Pagination below the stage (see section 6).
- No card chrome. No shadows. No tilt. The only borders are the stage hairlines.

## 5. Typography

Follow `design.md`. Specific to this section:
- Active take: grotesk, weight 400, letter-spacing `-0.035em`, line-height 1.12, `text-wrap: balance`. Size `clamp(26px, 4.6vw, 46px)`. Over about 140 characters, step down to `clamp(22px, 3.4vw, 34px)`. Never below 20px.
- Peeking takes: same family, 18 to 22px, clamped to 3 lines.
- Labels and meta: mono 11px, `--mut`.
- Text must meet 4.5:1 against `--bg` in both themes (particles dim around it, see section 7).

## 6. Carousel behavior ("a better carousel")

Build it custom. No Swiper or Embla unless the repo already uses one. The behavior matters more than the library, so if you do use one, you must still meet every item below.

**Model**
- Infinite loop (wraps from last to first and back). Current index is the single source of truth; the track position is a spring that follows it.
- Track position uses a Motion spring (start at stiffness 260, damping 28, tune by feel). Nothing uses CSS easing for movement.

**Input**
- Pointer drag (mouse, touch, pen) with velocity tracking. On release, project the landing position from velocity plus offset and snap to the nearest slide, so a quick flick can advance one slide and a long fast fling can still only advance one (cap at ±1 per gesture).
- Rubber-band is not needed because the loop is infinite. Instead, resist slightly past 40% of a slide width so it feels weighted.
- Click-vs-drag: movement under 6px counts as a click. A click on a peeking slide moves to it. A click on the active slide does nothing except on the link itself.
- Keyboard: `←` and `→` move, `Home` and `End` jump. The stage is focusable (`tabindex="0"`) with a visible 2px `--fg` outline, offset 2px.
- Trackpad and wheel: horizontal wheel or shift+wheel advances, debounced (about 350ms) so one swipe is one slide. Never hijack vertical scrolling.
- Touch: set `touch-action: pan-y` so vertical page scroll still works.

**Transition on the active text**
- The outgoing take's words lift up and out, and the incoming take's words rise in with a short stagger (about 28ms per word, capped so the total stays under about 600ms). Words are wrapped in masked spans; the whole take stays a single text node for accessibility (set the full text on `aria-label` or keep a visually hidden copy; don't make a screen reader read word fragments).
- Only the active slide animates its words. Peeking slides are static.

**Pagination**
- Up to 12 takes: one 10px square per take (`fillRect` language, matches the particles). Inactive squares are hollow with a `--mut` 0.5px border. The active square fills with its particle-palette color (index `i % 6`). They are real buttons with `aria-label="Take N"`.
- More than 12 takes: replace the squares with a 1px progress line plus the `NN / NN` readout.
- No autoplay. If `character` is on, idle escalation from `design.md` may nudge the track a few pixels at 15s of no input (it never changes the slide by itself).

**The link**
- Each take shows a single link to its tweet: `url`, `target="_blank"`, `rel="noopener noreferrer"`, mono 11px, with an `↗` that springs 2px up and right on hover or focus.
- The link is a real anchor with an accessible name like `Open take N on X`. No copy button, no share sheet, no clipboard code anywhere in this section.
- Only the active slide's link is focusable. Peeking slides are `inert` (or `aria-hidden` plus `tabindex="-1"`), and they must not trap the tab order.

## 7. Particles and interactivity

Use the shared particle system from `design.md` (one set of particles retargeting per section, square dots, `fillRect`, same spring and damping values). Do not add a second canvas or a second particle set. If this section is on a page that has no particle mode yet, add one named `takes`.

**Mode `takes` (background field)**
- Shape: a low-density, horizontally drifting dot-matrix "tape" behind the stage, in 2 or 3 loose bands, like a film strip or ticker. Density stays well under `burst` and `lattice`, so it reads as texture.
- Drift: the whole field drifts slowly in the direction of the last slide change and eases to a near-stop. Dragging the carousel shears the field by the drag velocity (scaled down, about 0.15), and the particles spring back.
- Slide change: apply a one-off impulse (about 6 to 10 in the direction of travel, decaying via the 0.86 damping) so the field visibly "turns the page" with the slide.
- Color: index from target x plus gaussian noise (about 0.3), per the palette rules. The active pagination square's color picks up a small local tint: particles within about 80px of it shift one palette index. Keep the rest of the UI monochrome.
- Cursor: normal repel (90px radius, 1.6 force). Click bursts stay as in `design.md`.

**Text-aware dimming**
- Register the active take, the peeking takes, and the meta line as text rects. Particles dim to about 5% inside them and ramp to full about 46px away, per `design.md`. Refresh rects on slide change (after the spring settles), resize, and about every 20 frames.

**Stretch (only if everything above is done and smooth)**
- On link hover or focus, about 100 to 150 particles retarget to a small arrow glyph (↗) next to the link, then release on blur. This is the "fun" moment and the only one that gathers particles into a shape in this section.
- Do not add anything else flashy. `design.md` says the badge is the one centerpiece.

**Reduced motion**
- `prefers-reduced-motion`: no spring snapping (instant index change with a 120ms opacity crossfade), no word-by-word reveal, a single static particle frame, no cursor interaction. Keyboard, drag, and links still work.

## 8. Accessibility

- The stage has `role="group"`, `aria-roledescription="carousel"`, and a label. Each slide has `role="group"`, `aria-roledescription="slide"`, `aria-label="N of M"`.
- A polite live region announces the new take's text on change (not on initial load).
- Visible focus rings (2px `--fg`, 2px offset). Pagination buttons and the link are reachable by keyboard.
- The canvas is `aria-hidden`. The `FIG` caption and the position readout are decorative; hide them from screen readers if they add noise, but keep the position available through the slide labels.
- All text meets 4.5:1 in light and dark with the particles at their brightest.

## 9. Performance

- No new dependencies unless unavoidable. The carousel, word reveal, and pagination are small enough to hand-build.
- Reuse the existing canvas, DPR cap (2), and visibility pause. Particle count for this mode scales by viewport; start at about 40% of the `lattice` count.
- Keep the carousel in `transform` and `opacity` only. No layout thrash during drag. Read rects once per frame at most.
- Pause the field when the section is offscreen, if the page doesn't already do that.

## 10. Build phases

1. **Content and data.** Create `views.json`, a loader, and URL validation. Seed it with the placeholder takes (below) until the owner pastes real ones.
2. **Static layout.** Header, stage, peeking slides, meta line, link, pagination, both themes, mobile. No motion yet.
3. **Carousel behavior.** Spring track, drag with velocity, snap, click on peeks, keyboard, wheel, `touch-action`, loop, `inert` on peeks.
4. **Text transition.** Word-masked reveal and exit. Confirm the screen reader sees one intact string.
5. **Particles.** `takes` mode, drift, shear, slide-change impulse, text-aware dimming, palette indexing.
6. **Polish and a11y pass.** Reduced motion, live region, focus rings, contrast in both themes, tab order, low-end device check.
7. **Stretch.** Arrow-glyph retarget on link hover.

Placeholder takes (replace when the owner provides real tweets; remove the placeholder flag from the PR once replaced):
1. "A good README is the cheapest feature you'll ever ship."
2. "If your error message doesn't say what to do next, it's not an error message. It's a vibe."
3. "Developer experience is just empathy with a changelog."
4. "Low-code is still code. It's just somewhere else, and someone is on call for it."
5. "Mentoring is the only open source contribution with compounding returns."
6. "Memes are documentation for people who skipped the docs."

## 11. Acceptance checklist

- [ ] Section is at most about one screen tall on a 1440×900 desktop and a 390×844 phone.
- [ ] Every take links to its real tweet URL (or has no link if the owner supplied none). No copy button or clipboard code exists.
- [ ] Tweet text is verbatim from the owner's paste.
- [ ] Drag, flick, click-on-peek, arrow keys, Home/End, and horizontal wheel all work. Vertical scroll is never blocked.
- [ ] A flick advances exactly one slide; the loop wraps both ways.
- [ ] Words reveal on the active take only; a screen reader reads each take as one string.
- [ ] Peeking slides are not focusable and don't appear in the tab order.
- [ ] Particles shear with drag, turn with slide changes, repel from the cursor, and dim around all text.
- [ ] Reduced motion produces a calm, functional version.
- [ ] Contrast is at least 4.5:1 in light and dark. Focus rings are visible.
- [ ] Only existing tokens are used. No new colors in UI chrome. Pastels appear only in particles and the active pagination square.
- [ ] No third-party X scripts or iframes are loaded.

## 12. Open questions for the owner

1. Real tweets and URLs (paste them; the agent formats them into `views.json`). How many? Under 12 keeps square pagination.
2. Order: newest first, or curated?
3. Show tweet dates, or keep the meta line to the handle only?
4. Does this live as its own page, or as a section on About? (The agent should check the current routing and match it.)
5. Is the arrow-glyph particle moment wanted, or should the section stay fully quiet?

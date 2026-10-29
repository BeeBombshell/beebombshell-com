# /ping page: build spec

Anonymous messages for beebombshell.com, delivered through [whodunit-ping](https://github.com/BeeBombshell/whodunit-ping). The page is a black glossy macro pad that matches the ID card on the home page. **The text input is part of the pad: the pad's own screen is the textarea.** This document is self-contained: everything needed to build the page is below.

## 1. Goals

1. Let anyone send me an anonymous message with no account, name or IP stored.
2. Be upfront that I may share pings on X, anonymously.
3. Feel like part of the portfolio: dark glass, mono type, pink-lilac-blue accents, a bit of 3D, one moment that makes people say "wow".

## 2. Routing and stack

| Path | Purpose |
|---|---|
| `/ping` | The page |
| `/api/ping` (or `ping.beebombshell.com/api/ping`) | Whodunit worker. Must not share the `/ping` path with the page |

- Add `ping` to the nav pill after `about`.
- Optional teaser on the home page: a small keycap linking to `/ping`, plus a `P` keyboard shortcut.
- Framework-agnostic. Build it in whatever the portfolio already uses; the pad is plain HTML/CSS plus about 150 lines of JS.

## 3. Page layout

1. Nav pill (reuse the site's real nav).
2. Glass card: same radius, border, dot grid and shadow as the home ID card.
3. Eyebrow `ANONYMOUS PING`, headline "Send me a ping. I won't know *it was you.*" (gradient on the italic part), one-line explainer.
4. **The pad** (section 5). Cable fades in above it.
5. One-line disclosure, then toast, then the privacy receipt after sending.
6. Footer hint: arrows change tag and prompt, Ctrl+Enter sends.

Disclosure copy (keep it visible, directly under the pad):

> No name, IP or browser details are stored. I may share pings on X, without anything that could identify you.

My own rules when sharing: post only the message text, no tag or metadata; strip names and handles of third parties; skip anything abusive or that could identify the sender.

## 4. Design tokens

| Token | Value |
|---|---|
| Background | `#050506` dark, `#e9e7f0` light (pad stays black in both) |
| Card gradient | `#1b1b1f` to `#0c0c0f`, 1px border `rgba(255,255,255,.12)` |
| Text gradient | `#ff8ad1`, `#d9b8f0` at 55%, `#86d6f0` |
| Pad body | `#25252b`, `#121215` at 55%, `#08080a` (160deg) |
| Rim and halo | conic gradient `#ff8ad1`, `#9b6bf0`, `#86d6f0`, `#9b6bf0`, `#ff8ad1`, rotating |
| Enter key | `#ff8ad1`, `#a78bfa` at 55%, `#86d6f0` (135deg), dark legend `#150f24` |
| Fonts | Geist (UI) and Geist Mono (screen, labels). Swap in the site's real fonts |

## 5. The pad

### Anatomy (top to bottom, inside the pad body)

1. **Head row:** white pill eye, status strip, white pill eye. The strip shows the current tag (`‹ compliment ›`) and five level bars that animate while typing.
2. **Screen (the input):** a real `<textarea>`, 500 characters, wrapped in a `<label>` so clicking anywhere on the screen focuses it. Pink `>` prompt, pink caret, character counter in the corner, honeypot input hidden off-screen.
3. **Keys:** 7-column grid, 3 rows.

### Shape

Pixel-mascot silhouette: top body, side arms, four legs. One `clip-path: polygon(...)` is shared by two stacked layers: a rotating gradient rim behind, and the black body scaled to 99.2% on top, which leaves a thin gradient edge. A clipped element can't have its own border or shadow, so the drop-shadow goes on the wrapper.

```css
.shape{clip-path:polygon(8% 0,92% 0,92% 30%,100% 30%,100% 64%,92% 64%,92% 84%,88% 84%,88% 100%,74% 100%,74% 84%,70% 84%,70% 94%,56% 94%,56% 84%,44% 84%,44% 94%,30% 94%,30% 84%,26% 84%,26% 100%,12% 100%,12% 84%,8% 84%,8% 64%,0 64%,0 30%,8% 30%)}
.shell-wrap{position:relative;filter:drop-shadow(0 26px 22px rgba(0,0,0,.6))}
.rim{position:absolute;inset:0;background:conic-gradient(from var(--a),#ff8ad1,#9b6bf0,#86d6f0,#9b6bf0,#ff8ad1);animation:spin 9s linear infinite}
.shell{position:relative;aspect-ratio:100/79;transform:scale(.992);
  background:radial-gradient(240px circle at var(--sx,30%) var(--sy,0%),rgba(255,255,255,.16),transparent 62%),
             linear-gradient(160deg,#25252b,#121215 55%,#08080a)}
.body{position:absolute;left:8%;right:8%;top:0;height:84%;padding:3.2cqw 4cqw 0}
@property --a{syntax:"<angle>";initial-value:0deg;inherits:false}
@keyframes spin{to{--a:360deg}}
```

Also on the shell: a faint dot-grid `::before` (same pattern as the card) and a diagonal gloss `::after` (`linear-gradient(118deg, rgba(255,255,255,.16), transparent 28%, transparent 72%, rgba(255,255,255,.05))`).

Under the pad sits a blurred copy of the same conic gradient (`filter: blur(36px)`, opacity .26, breathing scale) that goes to opacity .55 while typing or sending.

### Responsive sizing

The pad wrapper has `container-type: inline-size; max-width: 560px;` and every size inside it uses `cqw` units, so the whole pad scales as one object. On touch devices set the textarea to `font-size: 16px` (iOS zooms on smaller text) and let it scroll internally.

### Markup skeleton

```html
<div class="stage"><div class="pad">
  <div class="halo"></div>
  <svg class="cable">…wire path, pulse path, plug…</svg>
  <div class="shell-wrap">
    <div class="shape rim"></div>
    <div class="shape shell"><div class="body">
      <div class="head"><div class="eye"></div><div class="oled">…tag, bars…</div><div class="eye"></div></div>
      <label class="screen" for="msg">
        <span class="prompt">&gt;</span>
        <textarea id="msg" maxlength="500" aria-label="Your anonymous message"></textarea>
        <input class="hp" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <span class="count">0/500</span>
      </label>
      <div class="keys">…buttons…</div>
    </div></div>
  </div>
</div></div>
```

### Keys

Grid is 7 columns, rows `9.2cqw`, gap `2.2cqw 1.2cqw`.

| Key | Grid area (row/col) | Action |
|---|---|---|
| Tag | 1 / 1-2 | Cycle the tag (legend shows the current tag) |
| Up | 1 / 4 | Previous placeholder prompt |
| Sound | 1 / 6-7 | Toggle key sounds (off by default; legend shows on/off) |
| Left | 2 / 3 | Previous tag |
| Down | 2 / 4 | Next placeholder prompt |
| Right | 2 / 5 | Next tag |
| Reject | 3 / 1-2 | Clear the draft (shred animation) |
| Enter | 3 / 3-6 | Send. Ctrl/Cmd+Enter works from anywhere |
| Mic | 3 / 7 | Disabled on purpose: browser speech APIs can send audio to third parties. Pressing it explains why |

Tags: compliment, question, roast, confession, secret. Prompts rotate through the textarea placeholder (for example "What did you never say at standup?").

Key look: backlit black glass. Charcoal gradient cap, light legend with a soft violet text-shadow, inner top highlight, a violet bottom edge line, and a hard dark bottom shadow for depth (`0 5px 0 #030304`). Pressed state moves the key down 4px and flips the bottom edge to pink. Keep the `mousedown` default prevented while the textarea is focused so tapping a key doesn't close the mobile keyboard.

Physical keyboard: when the textarea isn't focused, arrows, Enter, Esc and Backspace trigger the matching keys with a press animation.

## 6. Motion and effects

| Effect | Behavior |
|---|---|
| Tilt | Pad rotates up to about 8deg (x) and 10deg (y) toward the cursor. Fine pointers only |
| Spotlight | A soft highlight follows the cursor across the glossy surface (CSS vars `--sx`, `--sy`) |
| Eyes | Pill eyes drift toward the cursor, squint while sending |
| Typing | Each keystroke lights a random key for about 140ms, bars animate, the halo brightens, optional tick sound |
| Sending | Pad bumps up, a light pulse runs up the cable, then a burst of about 80 pink, violet, blue and white pixels flies out of the pad on a full-screen canvas |
| Ambient | About 46 faint pixels drift upward behind the card |

`prefers-reduced-motion`: no tilt, no spotlight, no canvas, no animations. Everything still works.

## 7. Data flow

1. Visitor types on the pad screen.
2. Enter validates: not empty, at most 500 characters, under the daily limit.
3. `POST` to the worker with JSON `{ message, hp }` where `message` is `"[tag] text"`. Add the Turnstile token if enabled; check the whodunit-ping README for the exact field names.
4. Worker rate-limits (hashed key, daily expiry) and forwards to my phone.
5. Success: clear the screen, run the burst, show the toast "Delivered. Bee's phone just buzzed." and the receipt. Failure: keep the draft and tell the visitor to press Enter again.

```js
const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: `[${TAGS[tag]}] ${text}`, hp: honeypot.value })
});
if (!res.ok) throw new Error("bad status");
```

Config values: `ENDPOINT` (environment variable), `TAGS`, `PROMPTS`, `DAILY`. The server must enforce the length and the limit; the client checks are only for UX.

Privacy receipt rows: Your IP address (not stored), Browser details (not stored), Rate-limit key (hashed, expires at midnight UTC), Shared on X (maybe, anonymously). Only show lines that are true for the deployment.

## 8. Accessibility

- All keys are real `<button>`s with `aria-label`s. The input is a real textarea inside a label, so mobile keyboards and screen readers work.
- The status strip is a polite live region; the toast is `role="status"`.
- Visible focus rings on keys and on the screen (violet glow).
- Keys have tabindex order matching the visual order. Decorative layers (cable, halo, canvas, eyes) are `aria-hidden`.
- Contrast: legends on keys and the screen text pass on the black surfaces; check the gradient text on the light theme.

## 9. Build checklist

- [ ] Route `/ping` and nav entry added; API on a different path or subdomain.
- [ ] Pad scales cleanly from 320px to desktop (container units).
- [ ] Textarea works on iOS Safari and Android Chrome with the keyboard open.
- [ ] Enter, Ctrl+Enter, Reject, Esc and the arrow keys behave as in section 5.
- [ ] Honeypot present; worker URL comes from config; CORS allows only the site origin.
- [ ] Sending, success and failure states all tested (including offline).
- [ ] Reduced-motion mode checked.
- [ ] OG image (render of the pad) and page meta added.
- [ ] Test ping sent from a phone; notification text checked.

## 10. Open questions

- Is `@Bee_Bombshell` the right X handle (only needed if it appears anywhere on the page)?
- Keep the five tags or simplify?
- Daily limit: 3 or something else?
- Use the site's real fonts instead of Geist.
# Agent prompt: build the physical badge card (lanyard, card, physics)

Paste everything below this line into your coding agent. Attach your current screenshot too, if the agent can see images.

---

You are building one React client component, `<Badge />`, for a Next.js (App Router, TypeScript, Tailwind) portfolio. It is a landscape ID card hanging from a woven lanyard. The card swings on a real rope simulation, can be dragged and flung, flips on click, has a holographic glossy mascot with eyes that follow the cursor, and reacts to scroll.

Do not use physics or 3D libraries (no matter.js, rapier, three). Use Canvas 2D for the strap and hardware, DOM plus CSS 3D for the card, SVG for the mascot, and one `requestAnimationFrame` loop. Never use React state for per-frame values: keep them in refs and write styles directly.

## What is wrong with the current version (fix these first)

1. The card is static. It must hang from a rope simulation and swing, with the strap drawn from the top of the stage down to the card.
2. The mascot is a flat star inside a big violet disc. There must be no disc. The mascot is a 7-lobe shape only, with a stacked extrusion for thickness, a rim light, and a gloss highlight.
3. The gradient text on "someone cared." is missing. It must be gradient-filled and shift with tilt.
4. The particle burst (a separate component) is off to one side. Expose the card's center so the burst can center behind it.
5. The eyes must follow the cursor.

## Files

```
components/badge/Badge.tsx     client component, DOM, refs, rAF loop, pointer events
components/badge/rope.ts       node setup, verlet step, constraints (pure functions)
components/badge/ribbon.ts     catmull-rom, twisted ribbon renderer, hardware drawing
components/badge/blob.ts       polygon points and SVG layer helpers
components/badge/badge.css     card styles (or a CSS module)
```

Props:

```ts
type BadgeProps = {
  copy: { label: string; meta: string; headline: string; accent: string; bio: string; chips: string[]; spec: string; hint: string; back: { label: string; actions: { icon: ReactNode; text: string; onClick: () => void }[] } };
  anchorOffset?: number;              // px, negative moves the anchors up (scroll coupling)
  onFlip?: (center: {x:number;y:number}) => void; // lets the particle field fire an impulse
  onCenter?: (center: {x:number;y:number}) => void; // card center each frame, for the particle burst
};
```

## Layer structure

```
<section class="stage" style="position:relative;height:100svh;overflow:hidden">
  <canvas class="rope" />                         // absolute, inset 0, z-index 2, pointer-events none
  <div class="card" style="position:absolute;left:0;top:0;width:560px;height:380px;z-index:3;will-change:transform;touch-action:none;cursor:grab">
    <div class="slot" />                          // 44x7, radius 4, left:50%, margin-left:-22px, top:-6px, background #0b0b0c
    <div class="ring" />                          // 13x21, border 2.5px solid #c4c4cb, radius 8, left:50%, margin-left:-6.5px, top:-17px, box-sizing border-box
    <div style="width:100%;height:100%;perspective:1200px">
      <div class="flip" style="width:100%;height:100%;position:relative;transform-style:preserve-3d;border-radius:20px;box-shadow:0 30px 50px rgba(0,0,0,.24)">
        <div class="face front" />
        <div class="face back" style="transform:rotateY(180deg)" />
      </div>
    </div>
  </div>
</section>
```

Rules:
- `.face { position:absolute; inset:0; border-radius:20px; backface-visibility:hidden; -webkit-backface-visibility:hidden; overflow:hidden; }`. Put `overflow:hidden` on the faces only. Never put it on `.flip` or `.card`, or the 3D flip collapses and the ring is clipped.
- Do not put CSS transitions on the card's `transform`. The loop writes it every frame.
- The strap canvas sits below the card, so the hook end tucks behind the card top.

## Card front (absolute positions inside a 560×380 face)

- Face: background `#0b0b0c`, border `1px solid rgba(255,255,255,.14)`.
- Dot overlay: `inset:0; background-image:radial-gradient(rgba(255,255,255,.14) 1px, transparent 1.3px); background-size:7px 7px; mix-blend-mode:screen; opacity:.5`. Its `background-position` is `${tilt*1.5}px ${deg*1.2}px` each frame.
- Label + meta at left 24, top 20. Label: 11px mono, white, letter-spacing .14em. Meta: 11px mono, `#a3a3aa`, margin-top 4px.
- Headline at left 24, top 82, width 350: grotesk 27px, line-height 1.08, letter-spacing -0.035em, white. The accent phrase is a span with `background-clip:text; -webkit-background-clip:text; color:transparent; -webkit-text-fill-color:transparent; background-image:linear-gradient(100deg,#c9b8ff,#ff9ed6,#8fe3f5,#c9b8ff); background-size:250% 100%`. Each frame set `background-position` to `${50 + deg*3 + tilt*2}% 0`.
- Bio at left 24, top 190, width 360: grotesk 13px, line-height 1.6, `#c4c4cb`.
- Chips at left 24, bottom 20, flex, gap 8: 11px mono, `#d9d9de`, border `.5px solid rgba(255,255,255,.28)`, radius 999, padding `4px 10px`.
- Hint and spec at right 24, bottom 24: 11px mono, `#8a8a92`.
- Glare: `position:absolute; inset:0; pointer-events:none; mix-blend-mode:screen; background-size:260% 100%; background-image:linear-gradient(105deg, transparent 42%, rgba(255,255,255,.16) 50%, transparent 58%)`. Each frame `background-position: ${50 - tilt*3 - deg*2}% 0`.
- Mascot container at right 24, top 24, 134×134. Do not give it a background and do not clip it.

## Card back

Label top-left (24, 20), 11px mono `#a3a3aa`. Actions as a column at left 24, bottom 24: 13px, white, line-height 2.1, each with an icon and `onClick`. The back face must not receive pointer events while the front shows (`inert` or `pointer-events:none`).

## Rope model

Work in stage coordinates (px, origin top-left of the stage). Let `ax = stageWidth / 2`.

Nodes (index: x, y):

```
0: ax-34, -50  pinned      // left anchor, above the viewport
1: ax-23, -10
2: ax-11,  30
3: ax,     70              // junction
4: ax+34, -50  pinned      // right anchor
5: ax+23, -10
6: ax+11,  30
7: ax,    100              // stem
8: ax,    130
9: ax,    160              // clip (top center of the card)
10: ax,   540              // card bottom center (start at ax+60 so the card swings in on mount)
```

Constraints `[a, b, length, minOnly?]`:

```
[0,1,44] [1,2,44] [2,3,44]
[4,5,44] [5,6,44] [6,3,44]
[3,7,30] [7,8,30] [8,9,30]
[9,10, cardHeight]            // rigid card (380)
[8,10, cardHeight + 15, true] // minOnly: pushes apart when closer than this, so the card cannot fold up
```

Read `cardHeight` from the card element, so the portrait mobile variant works.

Constants: `GRAVITY = 0.55`, `DAMPING = 0.992`, `ITERATIONS = 18` (10 on mobile), `VMAX = 30`.

```ts
type N = { x:number; y:number; ox:number; oy:number; pin:boolean };

export function step(nodes: N[], cons: [number,number,number,boolean?][], drag: {active:boolean; target:{x:number;y:number}} ) {
  for (const p of nodes) {
    if (p.pin) continue;
    const vx = (p.x - p.ox) * DAMPING, vy = (p.y - p.oy) * DAMPING;
    p.ox = p.x; p.oy = p.y;
    p.x += clamp(vx, -VMAX, VMAX);
    p.y += clamp(vy, -VMAX, VMAX) + GRAVITY;
  }
  const bottom = nodes[10];
  if (drag.active) {
    bottom.x = drag.target.x; bottom.y = drag.target.y;
    bottom.ox = bottom.x - (bottom.x - bottom.ox) * 0.5; // keep half the velocity, so a release flings
    bottom.oy = bottom.y - (bottom.y - bottom.oy) * 0.5;
  }
  for (let it = 0; it < ITERATIONS; it++) {
    for (const [ia, ib, len, minOnly] of cons) {
      const a = nodes[ia], b = nodes[ib];
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
      if (minOnly && d >= len) continue;
      const diff = (d - len) / d;
      const ma = a.pin || (drag.active && ia === 10) ? 0 : 1;
      const mb = b.pin || (drag.active && ib === 10) ? 0 : 1;
      const t = ma + mb; if (!t) continue;
      a.x += dx * diff * ma / t; a.y += dy * diff * ma / t;
      b.x -= dx * diff * mb / t; b.y -= dy * diff * mb / t;
    }
  }
}
```

Scroll coupling: each frame, set the pinned nodes' y to `-50 + anchorOffset`. Clamp the change in `anchorOffset` to 40px per frame so anchor-link jumps cannot explode the rope.

## Per-frame card transform

```ts
const clip = nodes[9], bottom = nodes[10];
const cx = (clip.x + bottom.x) / 2, cy = (clip.y + bottom.y) / 2;
const theta = Math.atan2(-(bottom.x - clip.x), bottom.y - clip.y);   // 0 when hanging straight down
const vx = cx - prevCx; prevCx = cx; vxc += (vx - vxc) * 0.2;        // smoothed horizontal speed
const tilt = clamp(vxc * 4.5, -38, 38);                              // degrees
const deg = theta * 180 / Math.PI;
flip += (flipTarget - flip) * 0.12;                                  // flipTarget is 0 or 180
card.style.transform = `translate(${cx - W/2}px, ${cy - H/2}px) rotate(${theta}rad)`;
flipEl.style.transform = `rotateY(${flip + tilt}deg)`;
onCenter?.({ x: cx, y: cy });
```

`W` and `H` are the card's width and height (560, 380).

## Pointer interaction

- `pointerdown` on the card: record the pointer in stage coordinates, `grab = bottom - pointer`, `moved = 0`, `drag.active = true`, `setPointerCapture`.
- `pointermove` (stage-level): update the pointer. While dragging, `moved += |dx| + |dy|` and `drag.target = pointer + grab`.
- `pointerup`/`pointercancel`: if `moved < 6`, toggle `flipTarget` (0 or 180) and call `onFlip`. Always set `drag.active = false`. The fling comes from the retained velocity.
- Cursor: `grab` normally, `grabbing` while dragging.
- Keyboard: the card is focusable (`role="button"`, `aria-label` "Interactive ID badge. Press Enter to flip."). Enter or Space flips.

## Strap rendering (canvas)

Scale the canvas for DPR (cap at 2) with `ctx.setTransform(dpr,0,0,dpr,0,0)`, and clear it every frame. Smooth each chain with Catmull-Rom (8 samples per segment), then draw a twisting flat ribbon.

```ts
type V = { x:number; y:number };

export function catmull(P: V[], n = 8): V[] {
  const out: V[] = [], L = P.length;
  for (let s = 0; s < L - 1; s++) {
    const p0 = P[Math.max(0, s-1)], p1 = P[s], p2 = P[s+1], p3 = P[Math.min(L-1, s+2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t*t, t3 = t2*t;
      out.push({
        x: .5*(2*p1.x + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
        y: .5*(2*p1.y + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
      });
    }
  }
  out.push({ ...P[L-1] });
  return out;
}

export function drawRibbon(ctx: CanvasRenderingContext2D, poly: V[], o: {
  width: number; twist: (u:number)=>number; front: string; back: string;
  print?: { text: string; phase: number; color: string; font: string };
}) {
  const n = poly.length, s = [0];
  for (let i = 1; i < n; i++) s.push(s[i-1] + Math.hypot(poly[i].x-poly[i-1].x, poly[i].y-poly[i-1].y));
  const total = s[n-1] || 1;
  const tx: number[] = [], ty: number[] = [], nx: number[] = [], ny: number[] = [], c: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = poly[Math.max(0, i-1)], b = poly[Math.min(n-1, i+1)];
    const dx = b.x-a.x, dy = b.y-a.y, l = Math.hypot(dx, dy) || 1;
    tx.push(dx/l); ty.push(dy/l); nx.push(-dy/l); ny.push(dx/l);
    c.push(Math.cos(o.twist(s[i] / total)));                  // cos of the twist angle at this sample
  }
  for (let i = 0; i < n-1; i++) {
    const c1 = c[i], c2 = c[i+1];
    const h1 = o.width/2 * Math.max(.12, Math.abs(c1)), h2 = o.width/2 * Math.max(.12, Math.abs(c2));
    ctx.fillStyle = ctx.strokeStyle = (c1 + c2) >= 0 ? o.front : o.back; ctx.lineWidth = .6;
    ctx.beginPath();
    ctx.moveTo(poly[i].x + nx[i]*h1,     poly[i].y + ny[i]*h1);
    ctx.lineTo(poly[i+1].x + nx[i+1]*h2, poly[i+1].y + ny[i+1]*h2);
    ctx.lineTo(poly[i+1].x - nx[i+1]*h2, poly[i+1].y - ny[i+1]*h2);
    ctx.lineTo(poly[i].x - nx[i]*h1,     poly[i].y - ny[i]*h1);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (c1 + c2 > .7 && i % 2 === 0) {                         // stitching on both edges
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
      for (const sg of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(poly[i].x + sg*nx[i]*h1*.78,     poly[i].y + sg*ny[i]*h1*.78);
        ctx.lineTo(poly[i+1].x + sg*nx[i+1]*h2*.78, poly[i+1].y + sg*ny[i+1]*h2*.78);
        ctx.stroke();
      }
    }
  }
  if (o.print) {                                               // text printed along the strap by arc length
    ctx.font = o.print.font; ctx.textBaseline = 'middle';
    let d = o.print.phase, k = 0; const T = o.print.text;
    while (d < total - 8) {
      const ch = T[k % T.length], w = ctx.measureText(ch).width + 1.4;
      let j = 0; while (j < n-2 && s[j+1] < d) j++;
      const f = (d - s[j]) / ((s[j+1] - s[j]) || 1);
      const px = poly[j].x + (poly[j+1].x - poly[j].x) * f, py = poly[j].y + (poly[j+1].y - poly[j].y) * f;
      if (c[j] > .3 && d > 14) {
        ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(ty[j], tx[j])); ctx.scale(1, Math.abs(c[j]));
        ctx.fillStyle = o.print.color; ctx.fillText(ch, 0, 0); ctx.restore();
      }
      d += w; k++;
    }
  }
}
```

Per frame, draw in this order:

```ts
const flipRad = flip * Math.PI / 180;
const tw0 = theta * 2.2 + vxc * 0.1, t = performance.now() / 900;
const L = catmull([n0,n1,n2,n3]), R = catmull([n4,n5,n6,n3]), K = catmull([n3,n7,n8]);
drawRibbon(ctx, L, { width:20, twist:u => tw0*u + flipRad*.5*u + .3*Math.sin(t + u*4),     front:'#121212', back:'#2c2c31', print:{ text:'BHAVYA VERMA · PRODUCT ENGINEER · ', phase:40, color:'rgba(246,245,241,.88)', font:'500 11px <mono>' }});
drawRibbon(ctx, R, { width:20, twist:u => tw0*u + flipRad*.5*u + .3*Math.sin(t + u*4 + 2), front:'#121212', back:'#2c2c31', print:{ text:'BHAVYA VERMA · PRODUCT ENGINEER · ', phase:92, color:'rgba(246,245,241,.88)', font:'500 11px <mono>' }});
drawRibbon(ctx, K, { width:13, twist:u => tw0*u + flipRad*u, front:'#121212', back:'#2c2c31' });
// hardware
metal(ctx, J + dir*6, 24, 36, 5, angle(n3→n7) + Math.PI/2);        // crimp at the junction
ring at n8: circle radius 6, stroke 2.5px #c4c4cb;
metal(ctx, mid(n8,n9), dist(n8,n9) + 10, 12, 6, angle(n8→n9));    // swivel hook
```

`metal(ctx, x, y, w, h, r, angle)`: translate, rotate, vertical linear gradient `#f3f3f6` (0), `#a9a9b2` (.45), `#e0e0e5` (1), stroke `#7d7d86` 1px, `roundRect(-w/2,-h/2,w,h,r)` (add a fallback path for browsers without `roundRect`).

Dark mode: swap strap colors (front `#eeece6`, back `#cfcdc6`, print `rgba(18,18,18,.88)`, stitching `rgba(0,0,0,.3)`). The card border becomes `rgba(255,255,255,.24)`.

## Mascot (SVG, no background, no clip-path on the container)

```ts
// 7-lobe shape in a 134x134 viewBox, center (67,67)
const points = Array.from({length:140}, (_, a) => {
  const t = a/140 * Math.PI*2, r = .36 + .075*Math.cos(7*t);
  return `${(67 + Math.cos(t)*r*134).toFixed(1)},${(67 + Math.sin(t)*r*134).toFixed(1)}`;
}).join(' ');
```

Layers, bottom to top, all using `points`:

1. Extrusion: 8 polygons, drawn from i = 7 down to 0, `fill` and `stroke` (1.6px, round join) `url(#eg)` where `eg` is a linear gradient `#4b2fd6` to `#b43bd0`. Each frame, `transform = translate(exx*(i+1)/8, eyy*(i+1)/8)` with `exx = 4 - tilt*0.22`, `eyy = 7`.
2. Top face: polygon filled with `url(#tg)`, a linear gradient `#e2d8ff` (0), `#ff9ed6` (.5), `#8fe3f5` (1). Each frame set its `gradientTransform` to `rotate(${deg*3 + tilt*3} .5 .5)`.
3. A `clipPath` made from the same polygon, containing:
   - Rim light: polygon, `fill:none`, `stroke:#fff`, width 6, opacity .8, `filter: blur 2.2`, `transform: translate(2.5,2.5)`.
   - Shade: polygon, `fill:none`, `stroke:#4b2fd6`, width 6, opacity .35, same blur, `transform: translate(-2.5,-2.5)`.
   - Gloss: ellipse rx 30, ry 18, filled by a radial gradient (white .9 to 0), at `cx = 45 + tilt*0.9`, `cy = 38 + deg*0.5`.
4. Use unique ids for gradients and the clipPath (`useId`), and set `overflow: visible` on the svg so the extrusion is not clipped.

## Eyes

Two white bars, 9×34, radius 5, opacity .96, inside a zero-size container at `left:50%; top:36%` of the mascot. Left bar `left:-15px`, right bar `left:6px`.

Each frame:

```ts
// mascot center relative to the card center, then rotated by theta into stage space
const lx0 = mascotCenterX - W/2, ly0 = mascotCenterY - H/2;       // (189, -99) for the 560x380 card
const bx = cx + lx0*cos(theta) - ly0*sin(theta);
const by = cy + lx0*sin(theta) + ly0*cos(theta);
// cursor vector rotated back into the card frame
const dx = pointer.x - bx, dy = pointer.y - by;
const lx = dx*cos(theta) + dy*sin(theta), ly = -dx*sin(theta) + dy*cos(theta);
const len = Math.hypot(lx, ly) || 1, k = Math.tanh(len / 150);
targetX = lx/len * k * 9;  targetY = ly/len * k * 7;
targetY += clamp(scrollVelocity * 0.6, -7, 7);                      // look up as the page scrolls down
ex += (targetX - ex) * 0.22;  ey += (targetY - ey) * 0.22;
eyes.style.transform = `translate(${ex + tilt*0.15}px, ${ey}px)`;
// blink: every 2.6 to 5.2 s, lasts 130 ms, scaleY .12
// scaleY: blink .12, dragging or fast scroll 1.25 (scaleX 1.1), fast swing (|vxc| > 3) .7, else 1
mascot.style.transform = `translate(${ex*.6}px, ${ey*.6}px) scale(${1 + .025*Math.sin(now/600)})`;
```

With no pointer (touch, or the pointer left the window), the eyes drift between random targets every 0.9 to 1.8 seconds.

## Loop, lifecycle, and fallbacks

- One `requestAnimationFrame` loop started in `useEffect` and cancelled on cleanup. Use `ResizeObserver` on the stage and rebuild the rope when the width changes.
- Pause the loop when the tab is hidden or the stage is off-screen (`IntersectionObserver`). Resume without a velocity spike (reset `ox, oy` to `x, y`).
- DPR cap 2. On screens under 640px use `ITERATIONS = 10` and switch to a portrait card (300×420, with `cardHeight` read from the DOM). The bio may scroll inside the card.
- `prefers-reduced-motion`: run about 240 physics steps once at mount, render a single frame, then stop the loop. No eyes tracking, flip is instant (no rotation animation).
- Dragging and flipping must work with touch. `touch-action: none` on the card only.

## Acceptance checklist

1. On load the card drops in with a small swing and settles hanging straight, with a visible lanyard running from above the top edge, merging into one strap at a metal crimp, down to a ring and hook through the slot.
2. Dragging moves the card, releasing flings it, and it settles again. It never folds, spins endlessly, or jitters at rest.
3. The strap is a flat ribbon with stitched edges and printed text. When the card flips, the strap visibly twists (narrows to a pinch and shows its darker back face).
4. A click (under 6px of movement) flips the card in 3D. The back face shows the links.
5. The mascot has no disc behind it. It is a 7-lobe shape with visible thickness that shifts as the card swings, a bright rim light, and a gloss spot that moves.
6. "someone cared." is gradient-filled and shifts with tilt. The glare band and dot overlay move with tilt.
7. The eyes follow the cursor, blink, widen when grabbed, and squint when the card swings fast.
8. `anchorOffset` lifts the anchors, so scrolling swings the card up and out.
9. 60fps on a mid-range laptop, with no layout thrash and no React re-renders per frame.
10. Reduced motion shows a still, hanging badge.

## Debugging aids

Add a `?debug` mode that draws every node (dots) and constraint (lines) over the strap, plus a readout of `theta`, `tilt`, `vxc`, and FPS.

If something breaks:
- Card folds or flips upside down: check the bend constraint (`[8,10, cardHeight+15, minOnly]`) and the iteration count.
- Card jitters at rest: lower `GRAVITY` slightly or raise `DAMPING` toward 0.99, and check the anchors are truly pinned.
- Strap looks straight or stiff: make sure the strand constraint total (3 × 44) is longer than the anchor-to-junction distance (about 125px).
- Flip looks flat: `preserve-3d` is broken by `overflow:hidden` on `.flip` or `.card`, or `perspective` is missing on the wrapper.
- Gradient text shows a solid block: the span needs `display:inline`, the text must be inside it, and both `background-clip:text` variants plus `-webkit-text-fill-color: transparent` must be set.
- Card slides away on resize: rebuild the rope from the new stage center instead of keeping old coordinates.

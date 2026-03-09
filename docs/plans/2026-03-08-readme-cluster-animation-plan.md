# README Cluster Animation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create an animated SVG showing an 8-node DGX SuperPOD cluster dashboard with a 15-second fault-detection animation loop, replacing the static GIF hero in README.md.

**Architecture:** Single self-contained SVG file with embedded CSS `@keyframes` animations. No JavaScript. GitHub-compatible (no `<script>`, `<foreignObject>`, or external references). Dark terminal aesthetic matching the app's existing theme.

**Tech Stack:** SVG 1.1, CSS3 animations, inline `<style>` block

**Design doc:** `docs/plans/2026-03-08-readme-cluster-animation-design.md`

---

### Task 1: Create static SVG scaffold with background and status bar

**Files:**
- Create: `docs/cluster-animation.svg`

**Step 1: Create the SVG file with canvas, background, and status bar**

Create `docs/cluster-animation.svg` with:
- Root `<svg>` element: `viewBox="0 0 960 420"`, `xmlns="http://www.w3.org/2000/svg"`
- Background `<rect>`: full canvas, fill `#0D1117`, `rx="12"` for rounded corners
- Status bar `<g>` at top (y=0 to y=40):
  - Background rect: fill `#161B22`, full width, 40px tall, top corners rounded
  - Left-aligned text "DGX SuperPOD" in `#C9D1D9`, font `Consolas, 'Courier New', monospace`, 13px
  - Center stats: "8 Nodes" and "64 GPUs" in `#8B949E`, 11px
  - Small green circle (r=4) + "HEALTHY" text in `#76B900` on right side (this will animate later)
  - Stacked behind it: amber circle + "DEGRADED" text in `#D4A017`, initially opacity 0

**Step 2: Verify in browser**

Open the SVG directly in a browser. Confirm:
- Dark background renders correctly
- Status bar text is readable
- "HEALTHY" shows, "DEGRADED" is hidden
- Rounded corners visible

**Step 3: Commit**

```bash
git add docs/cluster-animation.svg
git commit -m "feat: add SVG scaffold with background and status bar"
```

---

### Task 2: Add 8 node cards in a 4x2 grid

**Files:**
- Modify: `docs/cluster-animation.svg`

**Step 1: Define node card template dimensions**

Each node card:
- Width: 205px, Height: 140px
- Grid spacing: 20px gap between cards
- Grid starts at x=30, y=60 (below status bar)
- Top row: dgx-00 through dgx-03 (y=60)
- Bottom row: dgx-04 through dgx-07 (y=220)
- Card: `<rect>` with fill `#161B22`, stroke `#30363D`, stroke-width 1, rx=8

Card x-positions: 30, 255, 480, 705

**Step 2: Add all 8 node cards**

For each of the 8 nodes, create a `<g>` group containing:
- Card background `<rect>` (205x140, positioned per grid)
- Hostname label: "dgx-0N" in `#C9D1D9`, 12px, monospace, positioned 12px from top-left of card
- 8 GPU indicator squares: each 16x16, rx=3, fill `#76B900`, arranged in a 4x2 grid within the card
  - GPU grid starts 36px from card top, 12px from card left
  - Horizontal gap: 6px between squares (4 per row)
  - Vertical gap: 6px between rows (2 rows)
  - Total GPU grid: ~4*(16+6) = 88px wide, 2*(16+6) = 44px tall
- Temperature label: "45C" (varies per node) in `#8B949E`, 10px, below GPU grid
- Status label: "OK" in `#76B900`, 10px, right-aligned below GPU grid

Node temperatures (healthy state): dgx-00: 45C, dgx-01: 44C, dgx-02: 46C, dgx-03: 47C, dgx-04: 43C, dgx-05: 45C, dgx-06: 44C, dgx-07: 46C

For dgx-03 specifically:
- GPU 3 (4th square, 0-indexed, top-right of GPU grid) gets a unique class: `gpu-fault`
- Add a hidden temp label "85C" stacked behind "47C" with opacity 0, class `temp-fault`
- Add a hidden "ECC: 8" label below temp with opacity 0, class `ecc-label`
- Add a hidden "XID 63" badge with opacity 0, class `xid-badge`
- The card border rect gets class `node3-border` for later animation

**Step 3: Verify in browser**

Open SVG in browser. Confirm:
- 8 cards visible in 4x2 grid with proper spacing
- All hostnames readable
- 64 green GPU squares visible (8 per node)
- Temps and "OK" labels visible on each card

**Step 4: Commit**

```bash
git add docs/cluster-animation.svg
git commit -m "feat: add 8-node card grid with GPU indicators"
```

---

### Task 3: Add GPU pulse animation (healthy steady-state)

**Files:**
- Modify: `docs/cluster-animation.svg`

**Step 1: Add the `<style>` block with pulse animation**

Inside the SVG, add a `<style>` block in `<defs>` or directly after the opening `<svg>` tag:

```css
@keyframes gpuPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.82; }
}
```

Apply to all GPU squares via a `.gpu` class:
```css
.gpu {
  animation: gpuPulse 2s ease-in-out infinite;
}
```

Stagger the pulse per node using `animation-delay` on each node group. Use node index * 0.25s for natural feel:
```css
.node0 .gpu { animation-delay: 0s; }
.node1 .gpu { animation-delay: 0.25s; }
.node2 .gpu { animation-delay: 0.5s; }
.node3 .gpu { animation-delay: 0.75s; }
.node4 .gpu { animation-delay: 1.0s; }
.node5 .gpu { animation-delay: 1.25s; }
.node6 .gpu { animation-delay: 1.5s; }
.node7 .gpu { animation-delay: 1.75s; }
```

**Step 2: Add class attributes to existing elements**

Add `class="gpu"` to every GPU square rect. Add `class="nodeN"` to each node's `<g>` group (N = 0-7).

**Step 3: Verify in browser**

Open SVG. Confirm:
- GPU squares gently pulse (opacity varies 0.82-1.0)
- Pulse is staggered across nodes (wave-like effect)
- Animation loops smoothly

**Step 4: Commit**

```bash
git add docs/cluster-animation.svg
git commit -m "feat: add staggered GPU pulse animation"
```

---

### Task 4: Add fault animation on dgx-03 GPU 3

**Files:**
- Modify: `docs/cluster-animation.svg`

**Step 1: Add fault keyframes to the `<style>` block**

The main fault animation runs on a 15s loop. All fault-related keyframes use the same 15s duration:

```css
/* GPU 3 color: green 0-4s, green->amber 4-7s, amber->red 7-10s, red 10-13s, red->green 13-15s */
@keyframes gpuFaultColor {
  0%, 26.7% { fill: #76B900; }           /* 0-4s: green */
  46.7% { fill: #D4A017; }                /* 7s: amber */
  66.7%, 86.7% { fill: #E5534B; }         /* 10-13s: red */
  100% { fill: #76B900; }                  /* 15s: back to green */
}

/* Temp cross-fade: "47C" visible 0-4s, fades out 4-7s */
@keyframes tempHealthy {
  0%, 26.7% { opacity: 1; }
  46.7%, 86.7% { opacity: 0; }
  100% { opacity: 1; }
}

/* Temp cross-fade: "85C" hidden 0-4s, fades in 4-7s */
@keyframes tempFault {
  0%, 26.7% { opacity: 0; }
  46.7%, 86.7% { opacity: 1; }
  100% { opacity: 0; }
}

/* ECC label: hidden 0-4s, fades in 4-7s */
@keyframes eccFadeIn {
  0%, 26.7% { opacity: 0; }
  46.7%, 86.7% { opacity: 1; }
  100% { opacity: 0; }
}

/* XID badge: hidden 0-7s, fades in 7-10s */
@keyframes xidFadeIn {
  0%, 46.7% { opacity: 0; }
  66.7%, 86.7% { opacity: 1; }
  100% { opacity: 0; }
}

/* Node 3 border: gray 0-7s, amber 7-13s, back to gray 13-15s */
@keyframes borderFault {
  0%, 46.7% { stroke: #30363D; }
  66.7%, 86.7% { stroke: #D4A017; }
  100% { stroke: #30363D; }
}
```

Apply the animations:
```css
.gpu-fault {
  animation: gpuFaultColor 15s ease-in-out infinite;
}
.temp-healthy {
  animation: tempHealthy 15s ease-in-out infinite;
}
.temp-fault {
  animation: tempFault 15s ease-in-out infinite;
}
.ecc-label {
  animation: eccFadeIn 15s ease-in-out infinite;
}
.xid-badge {
  animation: xidFadeIn 15s ease-in-out infinite;
}
.node3-border {
  animation: borderFault 15s ease-in-out infinite;
}
```

**Step 2: Apply classes to dgx-03 elements**

- GPU 3 square on dgx-03: replace `class="gpu"` with `class="gpu-fault"`
- The healthy temp text "47C": add `class="temp-healthy"`
- The hidden fault temp text "85C": add `class="temp-fault"`
- The hidden "ECC: 8" text: add `class="ecc-label"`
- The hidden "XID 63" text: add `class="xid-badge"`
- The dgx-03 card border rect: add `class="node3-border"`

**Step 3: Verify in browser**

Open SVG. Watch a full 15s cycle:
- 0-4s: All green, everything normal
- 4-7s: GPU 3 on dgx-03 shifts to amber, temp changes to 85C, ECC: 8 appears
- 7-10s: GPU 3 turns red, XID 63 appears, card border goes amber
- 10-13s: Holds in fault state
- 13-15s: Everything fades back to healthy
- Loop restarts smoothly

**Step 4: Commit**

```bash
git add docs/cluster-animation.svg
git commit -m "feat: add 15s fault detection animation on dgx-03"
```

---

### Task 5: Add status bar animation (HEALTHY → DEGRADED)

**Files:**
- Modify: `docs/cluster-animation.svg`

**Step 1: Add status bar keyframes**

```css
/* Status "HEALTHY" text + green dot: visible 0-7s, fades out 7-10s */
@keyframes statusHealthy {
  0%, 46.7% { opacity: 1; }
  66.7%, 86.7% { opacity: 0; }
  100% { opacity: 1; }
}

/* Status "DEGRADED" text + amber dot: hidden 0-7s, fades in 7-10s */
@keyframes statusDegraded {
  0%, 46.7% { opacity: 0; }
  66.7%, 86.7% { opacity: 1; }
  100% { opacity: 0; }
}
```

**Step 2: Apply classes to status bar elements**

- "HEALTHY" text + green dot group: add `class="status-healthy"`
- "DEGRADED" text + amber dot group: add `class="status-degraded"`

Apply:
```css
.status-healthy {
  animation: statusHealthy 15s ease-in-out infinite;
}
.status-degraded {
  animation: statusDegraded 15s ease-in-out infinite;
}
```

**Step 3: Verify in browser**

- 0-7s: "HEALTHY" visible in green
- 7-10s: Cross-fades to "DEGRADED" in amber
- 10-13s: "DEGRADED" holds
- 13-15s: Fades back to "HEALTHY"

**Step 4: Commit**

```bash
git add docs/cluster-animation.svg
git commit -m "feat: add status bar healthy/degraded animation"
```

---

### Task 6: Add amber glow filter on dgx-03

**Files:**
- Modify: `docs/cluster-animation.svg`

**Step 1: Add SVG filter definition**

Inside `<defs>`, add a glow filter:
```xml
<filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
  <feFlood flood-color="#D4A017" flood-opacity="0.3" result="color"/>
  <feComposite in="color" in2="blur" operator="in" result="glow"/>
  <feMerge>
    <feMergeNode in="glow"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>
```

**Step 2: Add a glow overlay rect on dgx-03**

Add a `<rect>` matching the dgx-03 card dimensions with `filter="url(#amberGlow)"`, `fill="none"`, `stroke="#D4A017"`, `stroke-width="1"`, initially at `opacity: 0`, class `node3-glow`.

```css
@keyframes glowFadeIn {
  0%, 46.7% { opacity: 0; }
  66.7%, 86.7% { opacity: 1; }
  100% { opacity: 0; }
}
.node3-glow {
  animation: glowFadeIn 15s ease-in-out infinite;
}
```

**Step 3: Verify in browser**

- During fault phase (7-13s), dgx-03 has a subtle amber glow around its border
- Glow fades in and out smoothly with other fault elements

**Step 4: Commit**

```bash
git add docs/cluster-animation.svg
git commit -m "feat: add amber glow filter on dgx-03 during fault"
```

---

### Task 7: Update README.md to use the animated SVG

**Files:**
- Modify: `README.md:16`

**Step 1: Replace the GIF reference**

In `README.md`, change line 16 from:
```markdown
![Demo](docs/demo-optimized.gif)
```
to:
```markdown
![DGX SuperPOD — 8-node cluster dashboard with live fault detection](docs/cluster-animation.svg)
```

Keep the GIF file in `docs/` — don't delete it.

**Step 2: Verify locally**

Run `npm run dev` or open README in a Markdown previewer that renders SVGs. Confirm the animation appears where the GIF used to be.

**Step 3: Commit**

```bash
git add README.md
git commit -m "feat: replace GIF hero with animated SVG cluster dashboard"
```

---

### Task 8: Visual QA and polish

**Files:**
- Modify: `docs/cluster-animation.svg` (if adjustments needed)

**Step 1: Full animation review**

Open the SVG in a browser and watch 3+ full loops. Check:
- [ ] All 64 GPU squares visible and pulsing
- [ ] Fault animation timing feels smooth (no jarring transitions)
- [ ] Text is readable at both full size and scaled down (e.g., 480px wide)
- [ ] Colors match the design spec exactly
- [ ] Status bar transition syncs with GPU fault phases
- [ ] Amber glow is subtle, not overpowering
- [ ] Loop reset (13-15s) is smooth, no flicker
- [ ] File size is under 30KB

**Step 2: Test GitHub rendering**

Push to a branch and check the README on GitHub. Verify:
- [ ] Animation plays automatically
- [ ] No elements stripped by GitHub's sanitizer
- [ ] Renders correctly in both GitHub light and dark themes
- [ ] Alt text shows when image fails to load

**Step 3: Final adjustments**

If anything looks off (timing, spacing, colors), adjust the SVG and re-verify.

**Step 4: Build check**

```bash
npm run build
npm run test:run
```

SVG is a static asset in `docs/` so build/tests should be unaffected, but verify nothing broke.

**Step 5: Final commit**

```bash
git add docs/cluster-animation.svg README.md
git commit -m "polish: finalize cluster animation visual QA"
```

---

## Execution Order

```
Task 1: SVG scaffold (background + status bar)
Task 2: 8 node cards with GPU indicators
Task 3: GPU pulse animation
Task 4: Fault animation on dgx-03
Task 5: Status bar animation
Task 6: Amber glow filter
Task 7: Update README.md
Task 8: Visual QA and polish
```

Tasks are sequential — each builds on the previous. Estimated total: ~45-60 minutes.

# PROMPT: AceIIIT "pack your courses into a box" checkout section

Build this exactly, element by element. Use plain HTML, CSS and JavaScript (no framework, no build step) and three.js r128 from cdnjs (`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`). Write simple, readable, student-level code: normal loops and if/else, simple variable names, no classes, no TypeScript, no extra libraries, only short useful comments.

Files: `index.html`, `style.css`, `logo.js` (defines `LOGO_SRC`, the logo as a base64 PNG with transparent background), `box.js` (3D scene), `app.js` (page logic). Script order in index.html: three.js, logo.js, box.js, app.js.

---

## 1. What it is

A course-selection section. Left: list of course rows. Right: a 3D open cardboard box. When the user ticks a course, a card for that course drops from above into the box. When the user clicks CONTINUE, the box closes: the camera looks into the box, pulls back, the flaps fold shut and a branded tape is stuck across the top. The box is always visible and always open at the start.

## 2. Page and theme

- Background `#fbf6ea` with a faint square grid: two 1px lines of `rgba(0,0,0,0.04)`, every 48px.
- Text `#111`. Gold `#c9962e`. Body font Inter/Arial. Headings Space Grotesk (fallback Arial Black). Small labels JetBrains Mono (fallback monospace).
- Section: max-width 1200px, centred, padding 48px 32px, flex row, gap 48px, items aligned to the top.
- Under 900px width: stack in one column, right column full width, heading 44px.

## 3. Left column

1. Heading `Build your` / `preparation.` (two lines), 64px, weight 800, line-height 1.
2. Sub text: "Select what you need — study material is dropped in the box free, on us." 17px, `#666`.
3. Label `SELECT YOUR COURSES`: mono 12px, letter-spacing 2px, `#a5852f`.
4. Course rows (one per course), each: white background, 1px `#e6e0d2` border, radius 12px, padding 20px 24px, gap 16px, margin-bottom 14px, pointer cursor. Left to right:
   - Checkbox 22px, 2px `#ccc` border, radius 5px, white tick "✓". When selected: gold fill and border.
   - Icon tile 44px, radius 10px, background `#f3ece0`, emoji 22px.
   - Middle: tag (mono 11px, letter-spacing 2px, `#999`), name (17px, weight 800), description (13px, `#777`).
   - Right (aligned right): price `₹` + number (19px bold), under it `ONE-TIME` (mono 10px, letter-spacing 2px, `#999`).
   - Selected row: border `#c9962e` plus a 3px ring `rgba(201,150,46,0.15)`.
   - Locked row (while box is closing or closed): opacity 0.7, default cursor, clicks ignored.

Courses (data array, easy to replace):

| id | icon | tag | title | price | description |
|---|---|---|---|---|---|
| class | 🎓 | FULL COURSE | Class + Notes | 1499 | Live classes with UGEE faculty + complete notes bundle |
| mock | 📝 | MOCK TESTS | Paid Mock Series | 599 | 2 free on signup + 4 full-length UGEE mocks with analytics |
| interview | 🎙️ | INTERVIEW PREP | Interview Guidance | 699 | PI prep, portfolio review, SOP + mock interviews |

## 4. Right column (width 400px, does not shrink)

Top to bottom:

1. **Stage**: height 340px, holds the three.js canvas (transparent background so the page grid shows through). A gold circle badge (24px, `#c9962e`, bold 12px text) sits at top 12px, right 20px, showing the number of selected courses. Hidden when 0.
2. **Summary card**: white, 1px `#e6e0d2` border, radius 12px, padding 18px 22px, margin 8px 0 16px, 14px text, min-height 90px.
   - Nothing selected: "No courses selected yet".
   - Otherwise one row per selected course: `icon title` on the left, `₹price` on the right (`#555`).
   - Then an italic green (`#1f7a4d`) row `📚 Study Material` with a pill `FREE` (11px bold, background `#e3f5ea`, border `#b9e4c9`, radius 12px, padding 2px 10px).
   - Then a divider (1px `#eee`), and a row `Total` (bold) with the sum in 24px weight 800.
3. **CONTINUE button**: full width, padding 18px, background `#111`, white text, 15px, weight 800, letter-spacing 1px, radius 8px. Text `CONTINUE →` when empty (disabled, opacity 0.4), `CONTINUE — ₹{total} →` when courses are selected. While the box closes: `PACKING YOUR ORDER...` (disabled). When finished: `ORDER PACKED ✓`.
4. **Edit order**: small underlined grey text button under CONTINUE, only visible after the box has closed. It reopens the box (cards stay inside) and unlocks the list.

## 5. Behaviour

- Tick a course: row becomes selected, a card for it drops into the box. If it is the first selected course, a free "Study Material" card (tag `BONUS`, price shown as a green FREE tag) drops 0.5s after it.
- Untick a course: its card disappears and the cards above it fall down to close the gap. When no courses remain, the Study Material card is removed too.
- Summary, badge and button text update on every change.
- CONTINUE (needs at least one course): lock the list, run the close animation, then run the "done" callback where a real redirect goes (`// window.location.href = "/checkout"`).
- Clicks are ignored unless the box is in the `open` state. States: `open`, `closing`, `closed`, `opening`.

Functions `box.js` exposes: `initBox(stageElement, logoImage, onOpened)`, `addToBox(id, tag, title, priceText, isFree, waitSeconds)`, `removeFromBox(id)`, `checkoutBox(onDone)`, `reopenBox()`, `getBoxMode()`. Start everything only after the logo image has loaded (the logo is drawn onto textures).

## 6. The 3D box

Units are arbitrary. Box: width W=1.6, height H=1.2, depth D=1.2, board thickness T=0.02. Bottom sits on y=0.

Parts:
- Bottom panel plus four walls made from thin boxes (front, back, left, right). Outer face uses the "outer" material, inner face the "inner" material, cut edges a plain edge material.
- Four top flaps, each a thin box on a pivot at the top edge of its wall:
  - Front and back are the major flaps (length about D/2, full width W). They sit 0.02 above the minor flaps so they overlap without z-fighting.
  - Left and right are the minor flaps (length about D/2 − 0.02, width about D).
  - Open angles: major 140°, minor 115°. Flaps rotate around x (front `+`, back `−`) and z (left `+`, right `−`).
- Open animation (used on "Edit order"): back flap starts at 0.0s, front 0.15s, left 0.3s, right 0.35s, each takes 1.1s with an ease-out-back overshoot (constant 1.2). Whole opening lasts 1.8s. Camera glides back to the home view over 1.5s.

### Cardboard texture (must look like the reference image)

The reference is a clean, smooth, light-tan kraft box: no heavy grain, no visible ridges, soft shading.
- Flat colour, drawn on a 256×256 canvas: outer face `rgb(198,156,106)`, inner face `rgb(208,168,118)`, cut edges `#b08a5a`.
- Add a soft vertical fade over the colour: `rgba(255,235,200,0.10)` at the top to `rgba(90,55,20,0.10)` at the bottom.
- Add only a very faint grain: about 2500 tiny 2×2 specks, dark `rgba(90,55,20,0–0.05)` or light `rgba(255,240,215,0–0.06)`.
- No bump map, no corrugation lines, no fibres. Material roughness 0.85, metalness 0.
- Handling symbols printed in dark brown `#4a3320` at the bottom right of the front wall (a plane 0.5 × 0.156 at x=0.5, y=0.17), opacity 0.85: two upward arrows on a base line (this way up), an umbrella (keep dry), a wine glass (fragile).

### Branding on the box

- Logo printed on the front wall (0.9 wide, centred at 55% height), on the left and right walls (0.7 wide), and on top of the front flap (0.7 wide, seen when closed). The logo image has a transparent background, plane opacity 0.92.
- Packing tape: a plane W × 0.22 lying across the seam on top (x from −W/2 to +W/2, at z=0, just above the flaps), pale tan `#e6cf98`, the logo repeated along it every 440px on a 1400×190 canvas, opacity 0.93, slightly glossy (roughness 0.25). Its scale.x grows from 0 to 1 so it is pulled across.

### Lighting and rendering

- Renderer: antialias, alpha true, clear colour transparent, pixel ratio max 2, sRGB output, **no tone mapping**, PCF soft shadows.
- Hemisphere light white/`0xcdb89a`, intensity 0.8. Key directional light `0xfff4e5`, intensity 0.8, at (3.5, 6, 4), casts shadows (2048 map, bias −0.0006, frustum ±4). Fill directional light white 0.25 at (−4, 2, 3).
- Floor: 40×40 shadow-only plane (opacity 0.22) plus a soft radial dark patch under the box (`rgba(0,0,0,0.5)` to transparent, size W+1.4 by D+1.4).
- Camera: perspective, fov 35 (50 if the stage is taller than wide), near 0.05, far 60.

## 7. The product cards

A card is a thin box 0.9 × 0.04 × 0.6 (white edges) whose top face uses a 512×341 canvas:
- Background `#fffdf7`. Header strip 84px `#f3ece0` with the logo at left (54px high), then a 6px gold (`#c9962e`) line.
- Tag in bold 20px monospace `#999` at y=128. Title in bold 40px Arial `#111`, wrapped to 460px, 46px line height, starting y=178.
- Paid card: price bold 40px at bottom left, `ONE-TIME` (bold 18px monospace `#999`) at the right.
- Free card: green tag `FREE` (background `#e3f5ea`, text `#1f7a4d`, bold 26px) instead of a price.

Drop physics (no physics library): start at y=3.6 above the box (off screen), x and z random within ±0.125, random yaw ±0.35 and random tilt (x ±0.5, z ±0.3) that eases to flat. Gravity 9 units/s². On hitting its resting height it bounces once at 25% speed if falling faster than 1.2, then settles. Cards stack upward in the order added, each adding 0.045 of height. `restack()` recomputes resting heights after removals so higher cards fall down.

## 8. Checkout (close) animation, total 6.2s

Camera follows a smooth curve (Catmull-Rom) through these positions, looking at the matching points, eased with smoothstep over 6.2s:

| stop | camera position | look at |
|---|---|---|
| home | (0, 2.7, 5.0) | (0, 0.6, 0) |
| 2 | (0, 3.3, 2.4) | (0, 0.3, 0) |
| 3 (looking down into the box) | (0, 2.4, 0.7) | (0, 0.1, 0) |
| 4 | (0, 2.4, 4.4) | (0, 0.8, 0) |
| end (front view of closed box) | (0, 0.9, 5.6) | (0, 0.65, 0) |

Flaps start folding shut (each takes 1.0s, smoothstep): left at 3.3s, right 3.35s, back 3.7s, front 3.9s. Tape appears and is pulled across from 4.9s to 5.5s. At 6.2s the state becomes `closed` and the done callback runs. Frame loop uses `requestAnimationFrame` with dt capped at 0.05s.

## 9. Acceptance checklist

- Box is open and visible on load; no course selected; summary says "No courses selected yet"; CONTINUE disabled.
- Ticking a course drops its card in; the first tick also drops Study Material 0.5s later.
- Unticking removes the card and the cards above settle down.
- Every card, the box walls, the front flap and the tape show the AceIIIT logo.
- The box looks like clean smooth tan kraft cardboard with the three small symbols bottom right of the front.
- CONTINUE plays the full 6.2s sequence, button texts change as listed, "Edit order" reopens the box with the cards still inside.
- Layout matches the screenshot: courses on the left, box then summary then button on the right.

# Nyro website integration

## Inspected originals

The referenced conversation's attachments were recovered as local temporary files. `/mnt/data/nyro-pet.zip` is not mounted in this Windows session; the recovered attachment named `nyro-pet.zip` was inspected instead. Originals were not edited. The two files under `assets/nyro/` are byte-for-byte copies of ZIP entries.

Original archive SHA-256: `268235b9202b756a8d52ad8a6b7555b1aaf60cde851c130d44cbc3c8f7689b8d`.

```text
nyro-pet.zip
└── nyro/
    ├── pet.json           167 bytes
    └── spritesheet.webp   2,022,612 bytes
```

The WebP is one static RGBA image, 1536 × 2288 pixels. It has real transparency, 8 columns and 11 rows, no cell gutters, and 192 × 208 pixel cells. It is not an animated WebP: JavaScript must select cells.

## Exact pet.json

```json
{"id":"nyro","displayName":"Nyro","description":"A friendly black-and-orange robotic rabbit companion.","spriteVersionNumber":2,"spritesheetPath":"spritesheet.webp"}
```

`id` is the identifier; `displayName` is the visible name; `description` describes the character; `spriteVersionNumber` identifies the v2 sheet format; `spritesheetPath` points to the image relative to pet.json. This file contains no frame mappings, timing, website behavior, or chatbot configuration. The website code uses the inspected mapping directly and does not need to fetch pet.json.

## Verified frame mapping

All row and column indices below are zero-based. Mapping is supported by the labeled supplied contact sheet and generation notes, and occupied cells were independently checked against the WebP alpha channel.

| Row | State | Animation columns | Source Y |
|---|---|---|---|
| 0 | idle | 0–5; column 6 is separate neutral | 0 |
| 1 | running-right | 0–7 | 208 |
| 2 | running-left | 0–7 | 416 |
| 3 | waving | 0–3 | 624 |
| 4 | jumping | 0–4 | 832 |
| 5 | failed | 0–7 | 1040 |
| 6 | waiting | 0–5 | 1248 |
| 7 | running (working/processing, not locomotion) | 0–5 | 1456 |
| 8 | review | 0–5 | 1664 |
| 9 | look directions 0°–157.5° | 0–7 | 1872 |
| 10 | look directions 180°–337.5° | 0–7 | 2080 |

All other cells are transparent and should not be played. Standard animations read left to right. Source rectangle: `(column × 192, row × 208, 192, 208)`.

Look directions are clockwise, with 0° up, 90° screen-right, 180° down, and 270° screen-left. Row 9 columns: `0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5`. Row 10 columns: `180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5`. These are poses selected by direction, not a continuous animation to loop for cursor tracking. The supplied README notes uneven angle steps near up/down.

## Accompanying files

| File | Inspection |
|---|---|
| nyro-wave.gif | 192 × 208; 4 frames; durations 140, 140, 140, 280 ms |
| nyro-look-around.gif | 192 × 208; 16 frames; 180 ms each |
| nyro-contact-sheet.png | 768 × 1386; labeled static preview, with checkerboard baked into this preview |
| image.png | 124 × 218; static RGBA reference image |
| README.md | Package description and reported earlier QA; those earlier QA claims were not re-run here |
| nyro-generation-prompts.md | Artwork generation notes, state counts and direction conventions |

The GIFs are previews and are not required by this integration. The contact sheet is not the runtime sprite sheet. Wave timing in the code matches the GIF; other animation speeds are deliberate website defaults because the package provides no runtime timing manifest.

## Install on nanotek.lk

1. Upload `assets/nyro/spritesheet.webp` and optionally `assets/nyro/pet.json` to the matching site paths.
2. Upload `nyro.css` and `nyro.js` to the site root.
3. Insert the contents of `nyro.html` before the closing `</body>` of the shared site template, once per page.

The exact HTML, CSS and JavaScript are in the three supplied files. No library, build step, external service, or API key is required. The widget is fixed at the bottom-right and renders each cell at 120 × 130 CSS pixels. Therefore the whole background is scaled to 960 × 1430 CSS pixels, with offsets `-column × 120` and `-row × 130`. To resize, keep both cell dimensions, background dimensions, offsets and widget/button dimensions in sync.

Click or keyboard activation toggles a greeting and plays a wave once. Pointer movement selects look poses while idle. Escape closes the bubble. Reduced-motion users see idle frame 0. Animation pauses when the page is hidden; missing or incorrectly sized artwork keeps the widget hidden. The sprite includes internal transparent padding, so the visible character is smaller than the button.

The widget is a visual companion. Connect the activation event to your existing chat UI if desired:

```javascript
document.getElementById('nyro-widget').addEventListener('nyro:activate', event => {
  // Call your actual chatbot's open/close API using event.detail.open.
});
```

Application state hooks, available after nyro.js executes:

```javascript
NyroPet.play('running');                       // Product search in progress
NyroPet.say('Looking for matching products…');
NyroPet.play('review');                        // Results ready
NyroPet.play('waiting');                       // Waiting for customer input
NyroPet.play('failed', { loop: false });        // Then return to idle
NyroPet.play('jumping', { loop: false });
NyroPet.play('idle');
NyroPet.close();
```

Messages are inserted as text, not HTML. Running-left/right animate poses in place; this fixed widget does not travel around the page. No site deployment or existing Nanotek chat integration was performed. Check the bottom-right placement against your site's cookie banner, cart and chat controls before publishing.


## Local preview fix
Open index.html after extracting the entire ZIP, or open the separate self-contained nyro-preview.html. The preview includes its artwork and needs no server. The multi-file version now uses relative paths; keep the files and assets folder together. When integrating into nested website pages, use site-root URLs for the CSS and script tags (or the full deployment directory). The script resolves artwork relative to its own URL.

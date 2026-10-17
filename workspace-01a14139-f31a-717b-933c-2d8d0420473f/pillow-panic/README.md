# Pillow Panic — Yanivo vs. Elish

A tiny, funny, two-button pillow fight using face cut-outs from the supplied photo.

## Play

- Open **Pillow-Panic.html** in a modern browser, or use the live game preview.
- Choose **Yanivo** or **Elish**. The other character is the computer.
- **BONK!** swings your pillow. **DUCK!** dodges it.
- Watch for **PILLOW INCOMING!**, then duck. Each move has a short cooldown.
- Every landed hit is one point. Most bonks in **30 seconds** wins.
- Replay immediately, or switch characters after a round.

### Keyboard

| Action | Key |
|---|---|
| Bonk | Space, J, or A |
| Duck | Down arrow, K, or D |
| Pause / resume | P or Escape |

The top-right buttons provide instructions, pause, and sound. The game pauses when you leave its tab. Character choice, sound preference, and personal bests are stored locally when browser storage is available. Storage being blocked does not prevent play.

## Files

- `Pillow-Panic.html` — downloadable, standalone game. Photos, illustrations, sounds, and the font are all included; there are no CDN or runtime dependencies.
- `index.html` — identical game for static website hosting.
- `game.template.html` — editable HTML, CSS, and JavaScript source with asset placeholders.
- `build_game.py` — embeds the two face cut-outs, font, and font license into both playable HTML files.
- `assets/` — transparent face cut-outs and the display font.
- `make_assets.py` — records the original face extraction, including correct EXIF photo orientation.
- `tests/smoke.cjs` — automated browser tests.
- `tests/test-report.json` — latest test result.

The game has no tracking, advertising, API calls, or photo uploads. To share it as a website, put `index.html` on any static web host. Opening downloaded HTML directly on a phone depends on whether that phone's file viewer allows JavaScript; using the browser-hosted version is easiest on phones.

## Development

Rebuild after editing the template:

```sh
python build_game.py
```

Serve locally:

```sh
python -m http.server 3000 --bind 0.0.0.0
```

The game itself needs no package installation. Automated tests use Playwright:

```sh
npm install
npx playwright install --with-deps chromium
npm test
```

Tests cover real touch input; both selectable characters; hits and dodges; cooldowns; AI warnings; pause and instructions; wins, losses and ties; replay; preferences; phone, tablet and landscape layouts; offline play; a scripts-only sandboxed document preview; and a complete unaccelerated 30-second round.

The photo was supplied by the user. All room and body illustrations are inline vector art. Fredoka is distributed under the SIL Open Font License 1.1; its license is included in `assets/Fredoka-OFL.txt` and in the standalone HTML's source.

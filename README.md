# jays.lol

Personal portfolio: a dark terminal-style site inside a loud retro-poster frame.
Plain HTML/CSS/JS, no build step: `index.html`, `styles.css`, `main.js`.

## Customising

- **Copy, links, projects, posts, ticker phrases, image paths** → the `CONFIG` object at the top of `main.js`.
  Placeholders are marked `[NAME]`, `[CITY]`, `[BIO]`, `[ABOUT]`, `[PROJECT]`, `[ALT]`.
- **Colours, fonts, frame sizes** → CSS variables in `:root` at the top of `styles.css`.
- **Images** → `images/`. Portrait: `images/pfp.jpg`. Photo strip: `images/strip-1.jpg` … `strip-3.jpg`
  (a generated city placeholder is drawn if a file is missing).

## Notes

- The portrait is dithered client-side (Floyd–Steinberg on `<canvas>`). Browsers block reading pixels
  from `file://` pages, so preview with a local server (e.g. `python3 -m http.server`) — otherwise
  the photo falls back to the plain high-contrast treatment.
- `[ ~ tweak ]` controls dithering (off / portrait / all), accent colour, the poster frame
  (minimal mode) and motion. Choices are remembered in `localStorage`.
- Motion defaults to off when the OS asks for reduced motion.

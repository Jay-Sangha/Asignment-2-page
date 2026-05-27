# Assignment 2 — Blocky 3D Horse

WebGL blocky horse built from cubes with hierarchical leg joints, animation, and color.

## Run locally

```bash
npm install
npm start
```

Opens at http://localhost:1234

## Controls

- **Global rotation / tilt** — sliders on the right
- **Front left leg** — shoulder, knee, ankle sliders
- **Animation** — toggle button
- **Mouse** — drag on canvas to rotate; **Shift+click** for poke (wink) animation

## Deploy to GitHub Pages

1. `npm install`
2. `npm run build` (updates the `docs/` folder)
3. Commit and push (including `docs/`)
4. GitHub → **Settings → Pages** → Source: **main** branch, folder **/docs**
5. Site URL: https://jay-sangha.github.io/Asignment-2-page/

**Important:** Use the root Pages URL above. Do **not** open `/src/index.html` — that is source only and will not run without a build.

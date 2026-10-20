# Liminal Bloom / Sudeki V42

An original, self-contained 3D world: a flooded iridescent garden with a cinematic path, free movement, three collectible light sources, an unfolding central bloom, flocking birds, reactive mineral pollen, a segmented halo, water waves and planar reflection, and an exit to the world gallery.

Desktop: wheel for a reversible journey, WASD to leave the path, drag to look, J/L to turn, E or a click/tap to touch the light. The three quiet diamonds approach each source without collecting it. Mobile: joystick to move, horizontal drag to look, scrolling down raises the camera. Audio is original synthesis and remains off until explicitly enabled. The ritual can be replayed.

The garden's shapes, shaders and audio are original code. No external media or reference-site assets. Three.js 0.186.1, RoomEnvironment, EffectComposer, UnrealBloomPass and OutputPass are MIT licensed. The local build uses the retained project dependency installation at `gemini-ouroboros-review-v2/node_modules/three` and esbuild at `.qa/node_modules/esbuild`.

Run `node build-bloom-v42.cjs` from the retained primary source directory. Production entry is `liminal-bloom/index.html` or the main site's `#/bloom` route. `?quality=lite` selects a simple renderer for comparison. `?view=cover` stages the same scene for its gallery cover; it is not the default visitor state.

Checks: numerical surface/matrix/interaction checks in `check-bloom-v42.mjs`, plus browser validation of actual rendering, light collection, camera motion, particle response, the ritual, replay, exit and a 390×844 layout. Physical mobile GPU performance is not claimed by the viewport test.

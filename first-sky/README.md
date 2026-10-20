# First sky / Sudeki V43

A full replacement of First sky. Three fixed, eroded islands, continuous walkable bridges, an ivory and sage garden, dawn sky, clouds, falling water, curved foliage, birds, spring-driven motes and a segmented luminous beacon. All geometry, materials, motion, input and sound code is original to this project. Three.js 0.186.1 and addons are MIT licensed.

Desktop: wheel walks the route forward/back; WASD walks freely inside the supported land and bridges; drag turns the first-person view. J/L turns with the keyboard. E or a tap on the beacon awakens it when nearby. A visible beacon control offers the same action. Awakening opens the shell, sends light waves through the garden and warms the light. Continue through the ring beyond the beacon to return to Worlds. Three route stations, replay, opt-in synthesized audio and the shared world/corridor navigation remain available.

Phone: joystick walks; horizontal drag looks; swiping upward (scrolling down) raises the camera. Desktop behavior is unchanged. Reduced-motion preference freezes continuous ambient time; quality=lite omits postprocessing. This is a 3D procedural world with alpha cloud cards, not a video or image sequence.

The previous First sky is preserved at /archive/v42-first-sky/index.html. The main, other worlds and existing comparison archive are unchanged.

Build from the retained authoring workspace: node build-sky-v43.cjs. Meaningful numerical checks: node check-sky-v43.mjs. Deployable output: publish-v43/web. No CDN runtime dependency.

## Cloud artwork

Asset: assets/cloud-bank.png. Generated with the built-in imagegen tool, genuine RGBA transparency, 1983×793, 1.51 MB. It is used in depth-tested 3D layers with parallax, alongside the procedural cloud sea. The editable source is in this folder. Exact generation prompt follows in CLOUD_PROMPT.txt.

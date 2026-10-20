# Freefall / Sudeki V44

Standalone scroll experience: /freefall/. Integrated route: /#/freefall. The existing homepage flight and six worlds remain intact.

Seven deterministic shapes: a fragmented metal sphere; a long chamber of rings; a double helix; two nested Menger structures; flowing metal ribbons; a mechanical light iris; an infinity sculpture. Scroll forward to transform the space and travel through it; scroll back to rebuild. Seven chapter controls offer direct navigation. Home/End return to the start/end. The final scene links to the corridor and Worlds and includes replay.

Move the cursor to repel nearby pieces. Hold to pull them toward the ray. Release to scatter; damped springs restore the intended shape. Touch uses native vertical page scrolling and tap response. On phones the camera roll is reduced, fragment count is halved and pixel ratio is capped. Reduced-motion preference disables idle movement, parallax and roll and uses direct scroll state. quality=lite skips postprocessing. Ambient synthesized sound is optional and starts only after explicit interaction.

800 desktop / 400 mobile rounded fragments. Geometry and seven target layouts are created once, then displayed with instancing. There is no video, model download, generated image, CDN dependency or reference-site code. Three.js 0.186.1, RoundedBoxGeometry and postprocessing are MIT licensed. All choreography, surfaces, mathematical layouts, input, spring simulation, composition and audio synthesis are original to this project.

Build in the retained authoring workspace: node build-freefall-v44.cjs. Validate: node check-freefall-v44.mjs. Checks cover 8,400 target poses, 400 Menger cells, 29 forward/reverse matrix snapshots, real ray influence, spring convergence, reset, finite scene transforms, preservation of the existing main flight and First sky.

Browser QA includes the seven chapters, pointer drag/hold/release, reverse scroll, replay, navigation and a 390×844 iframe viewport. Physical-phone GPU performance has not been measured. Original editable modules are retained alongside the deployable bundle.

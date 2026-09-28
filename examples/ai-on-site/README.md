# AI on site

A portrait (1080×1920) text explainer drawn in a project component, with an ElevenLabs voiceover
(voice "Darren - Warm, Trustworthy, Narration", eleven_multilingual_v2). No Script, generated images
or source video. `packages/steps-scene` shows a hook, numbered steps and a
closing line on authored beats. Three videos share it: `ai-on-site`, `catch-it` and `paperwork`.
Edit the `Beat` text and `at` times in each `.svml`; build any one by its `.svrun`.

```bash
pnpm --filter @example/steps-scene build
node bin/hypit.mjs build examples/ai-on-site/ai-on-site.svrun --workspace examples/ai-on-site --runtime examples/ai-on-site/hypit.runtime.json --follow
```

## Voiceover

`assets/voice/<video>/1-…6-*.mp3` hold one generated clip per beat. `build-voiceover.py` measures
them, places each on a frame-aligned beat (0.35s gaps, 0.6s before the close, 1.5s tail), mixes
`assets/voice/<video>.m4a` at -14 LUFS target and rewrites the Beat `at` times and Timeline `end` in
each `.svml`. Re-run it after replacing a clip, then rebuild.

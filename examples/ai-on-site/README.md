# AI on site

A 20-second portrait (1080×1920) text explainer drawn entirely in a project component: no Script,
voice, generated images or source video. `packages/steps-scene` shows a hook, numbered steps and a
closing line on authored beats. Three videos share it: `ai-on-site`, `catch-it` and `paperwork`.
Edit the `Beat` text and `at` times in each `.svml`; build any one by its `.svrun`.

```bash
pnpm --filter @example/steps-scene build
node bin/hypit.mjs build examples/ai-on-site/ai-on-site.svrun --workspace examples/ai-on-site --runtime examples/ai-on-site/hypit.runtime.json --follow
```

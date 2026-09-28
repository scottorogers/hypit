# AI on site

A 20-second portrait (1080×1920) text explainer drawn entirely in a project component: no Script,
voice, generated images or source video. `packages/steps-scene` shows a hook, numbered steps and a
closing line on authored beats; edit the `Beat` text and `at` times in `ai-on-site.svml`.

```bash
pnpm --filter @example/steps-scene build
node bin/hypit.mjs build examples/ai-on-site/ai-on-site.svrun --workspace examples/ai-on-site --runtime examples/ai-on-site/hypit.runtime.json --follow
```

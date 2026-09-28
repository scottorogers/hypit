#!/bin/bash
# Prepares a Claude Code on the web container for Hypit tests and local rendering.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# ffmpeg/ffprobe: needed by the media tests and every render.
if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg >/dev/null
fi

# JavaScript dependencies (lockfile unchanged; reuses the cached node_modules).
pnpm install --frozen-lockfile

# Public types: project and example component packages build against these.
pnpm build:public-types

# Managed Chrome Headless Shell for the local HyperFrames renderer (skips if already present).
node bin/hypit.mjs programs prepare \
  --runtime examples/semantic-composition/hypit.runtime.json \
  --endpoint hyperframes.local

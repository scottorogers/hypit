"""Lay each video's voice clips on frame-aligned beats, mix one track, and retime the .svml to match.

Usage: python3 build-voiceover.py   (run from examples/ai-on-site; needs ffmpeg/ffprobe)
"""
import math, re, subprocess
from pathlib import Path

FPS, GAP, CLOSE_GAP, TAIL = 30, 0.35, 0.6, 1.5
VIDEOS = ["ai-on-site", "catch-it", "paperwork"]

def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out)

for name in VIDEOS:
    clips = sorted(Path(f"assets/voice/{name}").glob("[1-6]-*.mp3"))
    assert len(clips) == 6, (name, clips)
    frames, t = [], 0.0
    for i, clip in enumerate(clips):
        if i == 5: t += CLOSE_GAP - GAP
        start = math.ceil(t * FPS)
        frames.append(start)
        t = start / FPS + duration(clip) + GAP
    end = math.ceil((frames[-1] / FPS + duration(clips[-1]) + TAIL) * FPS)
    inputs = sum((["-i", str(c)] for c in clips), [])
    delays = "".join(f"[{i}:a]adelay={round(f * 1000 / FPS)}:all=1[a{i}];" for i, f in enumerate(frames))
    mix = "".join(f"[a{i}]" for i in range(6)) + f"amix=inputs=6:normalize=0,apad,atrim=0:{end / FPS},loudnorm=I=-14:TP=-1.5:LRA=11[out]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", delays + mix, "-map", "[out]",
                    "-ar", "48000", "-ac", "1", "-c:a", "aac", "-b:a", "128k", f"assets/voice/{name}.m4a"], check=True)
    src = Path(f"{name}.svml"); text = src.read_text()
    beats = iter(frames)
    text = re.sub(r'(<steps:Beat [^>]*? at=")[^"]*(")', lambda m: f"{m.group(1)}{next(beats)}f{m.group(2)}", text)
    text = re.sub(r'(<time:Timeline id="animation" clock=\{animation-clock\} end=")[^"]*(")', rf"\g<1>{end}f\g<2>", text)
    src.write_text(text)
    print(name, "beats", frames, "end", end, f"({end / FPS:.2f}s)")

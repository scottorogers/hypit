import { sealVisualTrack } from "@hypit/hypit/composition";
import type { VisualElement } from "@hypit/hypit/composition";
import { browserProgram } from "@hypit/hypit/hyperframes";
import type { FontStackRef } from "@hypit/hypit/media";
import type { Timeline } from "@hypit/hypit/timeline";
import type { CanvasSpace } from "@hypit/hypit/spatial";
import { assertTemporalWindowFor } from "@hypit/hypit/temporal";
import type { TemporalInstant, TemporalWindow } from "@hypit/hypit/temporal";

export type Beat = { id: string; role: "hook" | "step" | "end"; text: string; at: TemporalInstant };
export type StepsOptions = { id: string; title: string; entranceFrames: number };

/** Hook, numbered steps and closing line share one scene; timing is already resolved. */
export function renderSteps(timeline: Timeline, canvas: CanvasSpace, window: TemporalWindow,
  font: FontStackRef, beats: readonly Beat[], options: StepsOptions) {
  assertTemporalWindowFor(window, { subjectId: options.id, space: timeline });
  if (!Number.isSafeInteger(options.entranceFrames) || options.entranceFrames < 1) throw new Error("Steps entrance-frames must be a positive integer.");
  if (beats.some(beat => beat.at.frame < window.span.startFrame || beat.at.frame >= window.span.endFrameExclusive)) throw new Error("Beats must appear inside the scene's window.");
  const hook = beats.filter(beat => beat.role === "hook"), end = beats.filter(beat => beat.role === "end");
  const steps = beats.filter(beat => beat.role === "step");
  if (hook.length !== 1 || end.length !== 1 || !steps.length) throw new Error("Steps Scene needs one hook, at least one step and one end beat.");
  if (beats[0]?.role !== "hook" || beats.at(-1)?.role !== "end") throw new Error("The hook comes first and the end beat last.");
  let order = 0;
  const text = (id: string, value: string, size: number, color: string): VisualElement => ({
    id, kind: "text", parent: "steps", order: ++order, text: value, fonts: font.faces,
    style: [{ name: "font-size", value: `${size}px` }, { name: "line-height", value: 1.15 }, { name: "color", value: color }],
  });
  const children = [text("title", options.title, 34, "#16191d"), text("hook", hook[0]!.text, 92, "#f7f5f0"),
    ...steps.flatMap((step, index) => [text(`number-${index}`, String(index + 1), 60, "#16191d"), text(`step-${index}`, step.text, 70, "#f7f5f0")]),
    text("end", end[0]!.text, 84, "#f7f5f0")];
  const start = window.span.startFrame;
  const program = browserProgram({
    html: `<div class="stripe"></div><div class="tag">{{title}}</div>
      <section class="hook"><div class="line">{{hook}}</div><div class="bar"></div></section>
      <ol class="steps">${steps.map((_, index) => `<li><div class="num">{{number-${index}}}</div><div class="text">{{step-${index}}}</div></li>`).join("")}</ol>
      <section class="end"><div class="line">{{end}}</div><div class="bar"></div></section>
      <div class="progress"><div class="fill"></div></div>`,
    css: `:scope{background:#16191d;overflow:hidden}
      .stripe{position:absolute;inset:0 0 auto;height:22px;background:repeating-linear-gradient(135deg,#f5c518 0 34px,#16191d 34px 68px)}
      .tag{position:absolute;top:110px;left:80px;padding:14px 28px;border-radius:10px;background:#f5c518;letter-spacing:2px}
      .hook,.end{position:absolute;left:80px;right:80px;top:50%;transform:translateY(-50%)}
      .bar{height:14px;margin-top:40px;background:#f5c518;transform-origin:left center;transform:scaleX(0)}
      .steps{position:absolute;top:50%;left:80px;right:80px;margin:0;padding:0;list-style:none;transform:translateY(-50%)}
      .steps li{display:flex;align-items:flex-start;gap:36px;margin-bottom:72px}
      .num{flex:none;width:104px;height:104px;border-radius:14px;background:#f5c518;display:flex;align-items:center;justify-content:center}
      .text{padding-top:10px}
      .progress{position:absolute;left:0;right:0;bottom:0;height:16px;background:#2a2f35}
      .fill{height:100%;background:#f5c518;transform-origin:left center}`,
    data: { hook: hook[0]!.at.frame - start, steps: steps.map(step => step.at.frame - start), end: end[0]!.at.frame - start,
      total: window.span.endFrameExclusive - start, entrance: options.entranceFrames },
    setup: `const hook=root.querySelector('.hook'), end=root.querySelector('.end'), rows=[...root.querySelectorAll('.steps li')];
      const fill=root.querySelector('.fill'), ease=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
      const bar=section=>section.querySelector('.bar');
      return frame=>{
        // A hook on the first frame is already fully shown: it is the thumbnail and the opening read.
        const inHook=data.hook===0?1:ease((frame-data.hook)/data.entrance), outHook=ease((frame-data.steps[0])/data.entrance);
        hook.style.opacity=String(inHook*(1-outHook));
        hook.style.transform='translateY(calc(-50% + '+(40*(1-inHook)-80*outHook)+'px))';
        bar(hook).style.transform='scaleX('+ease((frame-data.hook-data.entrance)/(data.entrance*2))+')';
        const outSteps=ease((frame-data.end)/data.entrance);
        let current=-1;
        rows.forEach((row,i)=>{ if(frame>=data.steps[i]) current=i; });
        rows.forEach((row,i)=>{
          const p=ease((frame-data.steps[i])/data.entrance), active=i===current;
          row.style.visibility=frame>=data.steps[i]?'visible':'hidden';
          row.style.opacity=String(p*(active?1:0.4)*(1-outSteps));
          row.style.transform='translateX('+(-60*(1-p))+'px)';
        });
        const inEnd=ease((frame-data.end)/data.entrance);
        end.style.opacity=String(inEnd);
        end.style.transform='translateY(calc(-50% + '+(40*(1-inEnd))+'px))';
        bar(end).style.transform='scaleX('+ease((frame-data.end-data.entrance)/(data.entrance*2))+')';
        fill.style.transform='scaleX('+(frame/data.total)+')';
      };`,
  });
  return sealVisualTrack({ id: options.id, programSpaceId: timeline.id, visualIr: "hypit.visual-ir@1",
    presents: [{ id: options.id, span: window.span, stacking: { order: 0, tieBreak: options.id },
      elements: [{ id: "steps", kind: "program", order: 0, program,
        style: [{ name: "position", value: "absolute" }, { name: "inset", value: 0 },
          { name: "width", value: `${canvas.widthPx}px` }, { name: "height", value: `${canvas.heightPx}px` }] }, ...children] }] });
}

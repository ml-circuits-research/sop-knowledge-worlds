// A strip of faces for a sample plan of k.motion: the face at every change the plan makes, drawn by
// tools/render-faces.mjs, with the time and what changed under each face, as one PNG sheet (rsvg-convert and
// ImageMagick's montage, through tools/contact-sheet.mjs; nothing of it is published).
//   node tools/motion-strip.mjs <out.png> [--preset man] [--seed 3] [--outcome done] [--text "Done, I moved it."]
//   node tools/motion-strip.mjs <out.png> --outcomes      one face per outcome at the height of its expression
import { mkdirSync, writeFileSync, rmSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanWorlds, fullWorld } from './lib/worlds.mjs';
import { readMotion, planMotion } from './lib/motion.mjs';
import { indexOf, presetFace, renderFace } from './render-faces.mjs';
import { contactSheets } from './contact-sheet.mjs';

export const SAMPLE = { outcome: 'done', text: 'Done, I moved it.' };

export function motionSetup(worlds = scanWorlds()) {
  const motion = readMotion(fullWorld('k.motion', worlds));
  const faces = fullWorld('k.faces', worlds);
  const idx = indexOf(faces);
  const features = (slot, name) => idx.variants.find((v) => v.style === 'plain' && v.slot === slot && v.name === name)?.features ?? {};
  return { motion, faces, features };
}

// The face of a preset with the state of a plan at one time.
export function faceAt(faces, preset, state) {
  const face = presetFace(faces, preset);
  for (const k of ['mouth', 'eyebrows', 'eyes']) if (state[k]) face.pick[k] = state[k];
  if (state.one_eye) face.oneEye = state.one_eye;
  return face;
}

// The frames of a plan: one per time at which something changes, with a caption.
export function stripFrames({ motion, faces, features }, { preset = 'man', seed = 3, outcome = SAMPLE.outcome, text = SAMPLE.text, at = 500, tail = 1500 } = {}) {
  const p0 = presetFace(faces, preset);
  const base = { mouth: p0.pick.mouth, eyebrows: p0.pick.eyebrows, eyes: p0.pick.eyes };
  const events = [{ t: at, name: 'reply', fields: { outcome, text } }];
  const probe = planMotion(motion, { events, seed, end: 60000, base, features });
  const ends = probe.instances.filter((i) => i.rule.on).map((i) => i.end).filter(Number.isFinite);
  const end = Math.max(at, ...ends) + tail;
  const plan = planMotion(motion, { events, seed, end, base, features });
  const byTime = new Map();
  for (const c of plan.changes) {
    if (!byTime.has(c.t)) byTime.set(c.t, []);
    byTime.get(c.t).push(c);
  }
  const frames = [];
  for (const [t, cs] of byTime) {
    const parts = [];
    for (const c of cs) {
      if (c.key === 'one_eye' && cs.some((x) => x.key === 'eyes')) continue;
      const what = c.value === null || c.value === base[c.key] ? `${c.key} back` : `${c.key}: ${c.value}`;
      parts.push(c.char !== undefined ? `"${c.char}" ${c.unitClass}: ${c.value}` : `${what}${c.rule ? ` (${c.rule})` : ''}`);
    }
    frames.push({ t, caption: `${Math.round(t)} ms|${t === 0 ? `the face (preset ${preset})` : parts.join('|')}`, face: faceAt(faces, preset, plan.stateAt(t)) });
  }
  return { frames, plan, end };
}

// One face per outcome, at the height of what its rules show (a short text, the face after it is said).
export function outcomeFrames(setup, { preset = 'man', seed = 3 } = {}) {
  const { motion, faces, features } = setup;
  const p0 = presetFace(faces, preset);
  const base = { mouth: p0.pick.mouth, eyebrows: p0.pick.eyebrows, eyes: p0.pick.eyes };
  const out = [];
  for (const outcome of motion.fields.find((f) => f.event === 'reply' && f.name === 'outcome').values) {
    const text = outcome === 'thinking' ? '' : 'Yes.';
    const plan = planMotion(motion, { events: [{ t: 0, name: 'reply', fields: { outcome, text } }], seed, end: 8000, base, features });
    const spoken = plan.emitted.find((e) => e.name === 'spoken')?.t ?? 0;
    const exp = plan.segments.filter((s) => s.inst.rule.layer === 'expression');
    // During the reply (brows) and after it is said (mouth): the moment most expression keys are fully shown.
    const times = [spoken + 1, ...exp.map((s) => s.onEnd + 1)];
    const best = times.map((t) => [t, exp.filter((s) => t >= s.onEnd && t < s.backStart).length]).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    const t = best ? best[0] : spoken + 1;
    const state = Object.fromEntries(Object.entries(plan.stateAt(t)).map(([k, v]) => [k, plan.top(k, t)?.s.inst.rule.layer === 'expression' ? v : base[k]]));
    out.push({ t, caption: `${outcome}|${exp.map((s) => `${s.key}: ${s.value}`).filter((x, i, a) => a.indexOf(x) === i).join('|') || 'the face as it is'}`, face: faceAt(faces, preset, state) });
  }
  return out;
}

export function writeSheet(faces, frames, out, { cols = 8, size = 170 } = {}) {
  const dir = join(tmpdir(), `motion-strip-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  const rows = frames.map((f, i) => {
    const file = join(dir, `f${String(i).padStart(3, '0')}.svg`);
    writeFileSync(file, renderFace(faces, f.face, f.caption.replace(/\|/g, ' ')));
    return [file, f.caption];
  });
  const pages = contactSheets(rows, join(dir, 'sheet'), { cols, rowsPerPage: Math.ceil(rows.length / cols), size });
  mkdirSync(dirname(out), { recursive: true });
  renameSync(pages[0], out);
  rmSync(dir, { recursive: true });
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [out, ...rest] = process.argv.slice(2);
  const opt = (name, dflt) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : dflt; };
  const setup = motionSetup();
  if (rest.includes('--outcomes')) {
    const frames = outcomeFrames(setup, { preset: opt('preset', 'man'), seed: Number(opt('seed', 3)) });
    console.log(`${frames.length} faces -> ${writeSheet(setup.faces, frames, out, { cols: frames.length })}`);
  } else {
    const { frames, end } = stripFrames(setup, { preset: opt('preset', 'man'), seed: Number(opt('seed', 3)), outcome: opt('outcome', SAMPLE.outcome), text: opt('text', SAMPLE.text) });
    console.log(`${frames.length} frames over ${Math.round(end)} ms -> ${writeSheet(setup.faces, frames, out)}`);
  }
}

// Loads every docs/worlds/*/schema.sop as a library module, then each shard of the world into a fresh
// world with that schema, and all shards of the world together. Fails on any error; prints warnings,
// wires, bytes and load time per shard.
//   node tools/validate.mjs [worlds-dir]
import { performance } from 'node:perf_hooks';
import { parse } from './sopworld/sopworld.mjs';
import { scanWorlds, schemaWorld, readHeader, isMatrix, fmtViolation, WORLDS_DIR, MAX_WIRES, MAX_BYTES } from './lib/worlds.mjs';

const warningText = (w) => `${w.kind}${w.id ? ` ${w.id}` : ''}: ${w.why ?? w.key ?? ''}`.trim();

export function validateWorlds(root = WORLDS_DIR) {
  const worlds = scanWorlds(root);
  const errors = [];
  const results = [];
  for (const world of worlds) {
    const t0 = performance.now();
    let base;
    try {
      base = schemaWorld(worlds, world.id);
    } catch (e) {
      errors.push(`${world.schemaPath}: ${e.message}`);
      continue;
    }
    const schemaMs = performance.now() - t0;
    if (!base.result.ok) {
      for (const v of base.result.violations) errors.push(`${world.schemaPath}: ${fmtViolation(v)}`);
      continue;
    }
    const schemaWarnings = base.world.warnings.map(warningText);
    results.push({ world: world.id, shard: null, path: world.schemaPath, wires: parse(world.schemaText).length,
      bytes: Buffer.byteLength(world.schemaText), ms: schemaMs, warnings: schemaWarnings });

    const all = base.world.fork();
    for (const shard of world.shards) {
      const res = { world: world.id, shard: shard.id, path: shard.path, wires: 0, bytes: shard.bytes, ms: 0, warnings: [] };
      results.push(res);
      let wires;
      try {
        wires = parse(shard.text);
      } catch (e) {
        errors.push(`${shard.path}: ${e.message}`);
        continue;
      }
      res.wires = wires.length;
      const header = readHeader(shard.text);
      for (const k of ['sources', 'license', 'script']) if (!header[k]) errors.push(`${shard.path}: the header has no "# ${k}:" line`);
      for (const w of wires) {
        if (isMatrix(w)) errors.push(`${shard.path}: @${w.id} is a matrix wire (${w.type}); shards hold facts only`);
        else if (!w.attrs['core.source']) errors.push(`${shard.path}: @${w.id} has no core.source`);
        // An open world takes a fact of a type no schema declares; here every fact's type must be declared.
        if (!isMatrix(w) && !w.type.startsWith('core.') && !base.world.schema(w.type)) errors.push(`${shard.path}: @${w.id} is of the type ${w.type}, which no schema declares`);
      }
      if (wires.length > MAX_WIRES) errors.push(`${shard.path}: ${wires.length} wires, more than ${MAX_WIRES}`);
      if (shard.bytes > MAX_BYTES) errors.push(`${shard.path}: ${shard.bytes} bytes, more than ${MAX_BYTES}`);
      const w = base.world.fork();
      const before = w.warnings.length;
      const t1 = performance.now();
      const r = w.tell(shard.text);
      res.ms = performance.now() - t1;
      if (!r.ok) for (const v of r.violations) errors.push(`${shard.path}: ${fmtViolation(v)}`);
      res.warnings = w.warnings.slice(before).map(warningText);
      if (r.issues?.length) res.warnings.push(...r.issues.map((i) => `issue ${i.rule}: ${i.why}`));
      const together = all.tell(shard.text);
      if (r.ok && !together.ok) for (const v of together.violations) errors.push(`${shard.path} (with the other shards of ${world.id}): ${fmtViolation(v)}`);
    }
  }
  return { ok: errors.length === 0, errors, results, worlds };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ok, errors, results } = validateWorlds(process.argv[2]);
  for (const r of results) {
    console.log(`${r.path}  wires=${r.wires} bytes=${r.bytes} load=${r.ms.toFixed(1)}ms warnings=${r.warnings.length}`);
    for (const w of r.warnings) console.log(`  warning: ${w}`);
  }
  for (const e of errors) console.error(`error: ${e}`);
  console.log(ok ? `ok: ${results.length} files, 0 errors` : `failed: ${errors.length} errors`);
  process.exit(ok ? 0 : 1);
}

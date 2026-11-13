// SVG -> drawable parts for k.objects: every element becomes one part with a primitive shape, a box in the 0-100
// frame, and points for polygons and lines. Circles, ellipses and rectangles stay primitives; a path is flattened to
// polygons and simplified (Douglas-Peucker); holes, gradients (one flat colour is kept), clips and strokes of filled
// shapes are dropped. No dependencies; deterministic.

// The colour names of k.objects (declared as an enum in its schema) with the value each name stands for.
export const COLOURS = {
  black: [0, 0, 0], white: [255, 255, 255], grey: [128, 128, 128], red: [220, 30, 30], orange: [255, 150, 0],
  yellow: [255, 220, 40], green: [50, 160, 60], blue: [40, 110, 220], purple: [130, 60, 170], pink: [255, 160, 190],
  brown: [140, 85, 45],
};

const lab = ([r, g, b]) => {
  const f = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [R, G, B] = [f(r), f(g), f(b)];
  const x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, y = 0.2126 * R + 0.7152 * G + 0.0722 * B, z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const g3 = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * g3(y) - 16, 500 * (g3(x) - g3(y)), 200 * (g3(y) - g3(z))];
};
const COLOUR_LAB = Object.entries(COLOURS).map(([name, rgb]) => [name, lab(rgb)]);

// The nearest colour name of the list (distance in CIE Lab).
export function colourName(rgb) {
  const p = lab(rgb);
  let best = null, bestD = Infinity;
  for (const [name, q] of COLOUR_LAB) {
    const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2;
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}

const hex = (rgb) => `#${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
const NAMED = { white: [255, 255, 255], black: [0, 0, 0], red: [255, 0, 0], blue: [0, 0, 255], green: [0, 128, 0], yellow: [255, 255, 0], gray: [128, 128, 128], grey: [128, 128, 128] };

// A paint value -> [r, g, b], 'none', { url } or null (not understood).
function parsePaint(value) {
  const v = value.trim();
  if (v === 'none' || v === 'transparent') return 'none';
  let m = /^#([0-9a-f]{3})$/i.exec(v);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16));
  m = /^#([0-9a-f]{6})$/i.exec(v);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  m = /^rgb\(\s*([\d.]+)(%?)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*\)$/i.exec(v);
  if (m) return [m[1], m[3], m[4]].map((n) => (m[2] ? Number(n) * 2.55 : Number(n)));
  m = /^url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)/i.exec(v);
  if (m) return { url: m[1] };
  return NAMED[v.toLowerCase()] ?? null;
}

// Matrices are [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f.
const IDENTITY = [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const numbers = (s) => (s.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? []).map(Number);
function parseTransform(s) {
  let m = IDENTITY;
  for (const [, name, args] of s.matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g)) {
    const a = numbers(args);
    let t = IDENTITY;
    if (name === 'matrix' && a.length === 6) t = a;
    else if (name === 'translate') t = [1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0];
    else if (name === 'scale') t = [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0];
    else if (name === 'rotate') {
      const r = ((a[0] ?? 0) * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
      t = [c, sn, -sn, c, 0, 0];
      if (a.length >= 3) t = mul(mul([1, 0, 0, 1, a[1], a[2]], t), [1, 0, 0, 1, -a[1], -a[2]]);
    } else if (name === 'skewX') t = [1, 0, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 1, 0, 0];
    else if (name === 'skewY') t = [1, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0];
    m = mul(m, t);
  }
  return m;
}
const isAxisAligned = (m) => Math.abs(m[1]) < 1e-9 && Math.abs(m[2]) < 1e-9;

const CURVE_STEPS = 10;
// Path data -> subpaths: { points, closed }.
export function flattenPath(d) {
  const tokens = d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const subpaths = [];
  let cur = null, x = 0, y = 0, sx = 0, sy = 0, i = 0, cmd = '', px = null, py = null, prev = '';
  const num = () => Number(tokens[i++]);
  const flag = () => { // arc flags may be written without separators (a1 1 0 01 2 2)
    const t = tokens[i];
    if (t.length > 1 && /^[01]/.test(t)) { tokens[i] = t.slice(1); return Number(t[0]); }
    i++;
    return Number(t);
  };
  const start = (nx, ny) => { cur = { points: [[nx, ny]], closed: false }; subpaths.push(cur); };
  const lineTo = (nx, ny) => { if (!cur) start(x, y); cur.points.push([nx, ny]); x = nx; y = ny; };
  const cubic = (x1, y1, x2, y2, x3, y3) => {
    const x0 = x, y0 = y;
    for (let k = 1; k <= CURVE_STEPS; k++) {
      const t = k / CURVE_STEPS, u = 1 - t;
      lineTo(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3);
    }
  };
  const arc = (rx, ry, phiDeg, large, sweep, x2, y2) => {
    const x1 = x, y1 = y;
    rx = Math.abs(rx); ry = Math.abs(ry);
    if (!rx || !ry || (x1 === x2 && y1 === y2)) { lineTo(x2, y2); return; }
    const phi = (phiDeg * Math.PI) / 180, c = Math.cos(phi), s = Math.sin(phi);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const xp = c * dx + s * dy, yp = -s * dx + c * dy;
    const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const q = Math.max(0, (rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp) / (rx * rx * yp * yp + ry * ry * xp * xp));
    const k = (large === sweep ? -1 : 1) * Math.sqrt(q);
    const cxp = (k * rx * yp) / ry, cyp = (-k * ry * xp) / rx;
    const cx = c * cxp - s * cyp + (x1 + x2) / 2, cy = s * cxp + c * cyp + (y1 + y2) / 2;
    const ang = (ux, uy) => Math.atan2(uy, ux);
    const a1 = ang((xp - cxp) / rx, (yp - cyp) / ry);
    let da = ang((-xp - cxp) / rx, (-yp - cyp) / ry) - a1;
    if (sweep && da < 0) da += 2 * Math.PI;
    if (!sweep && da > 0) da -= 2 * Math.PI;
    const steps = Math.max(2, Math.ceil((Math.abs(da) / (Math.PI / 2)) * 6));
    for (let n = 1; n <= steps; n++) {
      const a = a1 + (da * n) / steps;
      lineTo(c * rx * Math.cos(a) - s * ry * Math.sin(a) + cx, s * rx * Math.cos(a) + c * ry * Math.sin(a) + cy);
    }
    x = x2; y = y2;
    cur.points[cur.points.length - 1] = [x2, y2];
  };
  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) cmd = tokens[i++];
    else if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
    else if (cmd === 'Z' || cmd === 'z' || cmd === '') { i++; continue; }
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M': { const nx = ox + num(), ny = oy + num(); x = nx; y = ny; sx = nx; sy = ny; start(nx, ny); break; }
      case 'L': { const nx = ox + num(), ny = oy + num(); lineTo(nx, ny); break; }
      case 'H': lineTo(ox + num(), y); break;
      case 'V': lineTo(x, oy + num()); break;
      case 'C': { const a = [ox + num(), oy + num(), ox + num(), oy + num(), ox + num(), oy + num()]; cubic(...a); px = a[2]; py = a[3]; break; }
      case 'S': {
        const rx1 = /[CS]/i.test(prev) ? 2 * x - px : x, ry1 = /[CS]/i.test(prev) ? 2 * y - py : y;
        const a = [ox + num(), oy + num(), ox + num(), oy + num()];
        cubic(rx1, ry1, ...a); px = a[0]; py = a[1]; break;
      }
      case 'Q': {
        const qx = ox + num(), qy = oy + num(), ex = ox + num(), ey = oy + num();
        cubic(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), ex + (2 / 3) * (qx - ex), ey + (2 / 3) * (qy - ey), ex, ey);
        px = qx; py = qy; break;
      }
      case 'T': {
        const qx = /[QT]/i.test(prev) ? 2 * x - px : x, qy = /[QT]/i.test(prev) ? 2 * y - py : y;
        const ex = ox + num(), ey = oy + num();
        cubic(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), ex + (2 / 3) * (qx - ex), ey + (2 / 3) * (qy - ey), ex, ey);
        px = qx; py = qy; break;
      }
      case 'A': { const rx = num(), ry = num(), phi = num(), large = flag(), sweep = flag(); arc(rx, ry, phi, large, sweep, ox + num(), oy + num()); break; }
      case 'Z': if (cur) cur.closed = true; x = sx; y = sy; cur = null; break;
      default: i++;
    }
    prev = cmd;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return subpaths.filter((s) => s.points.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])));
  }
  return subpaths;
}

const area = (pts) => { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return Math.abs(a / 2); };
const bounds = (pts) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};
const inside = (x, y, ring) => {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

// Douglas-Peucker on an open run of points.
function simplifyRun(pts, tol) {
  if (pts.length <= 2) return pts.slice();
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    let far = -1, farD = tol;
    for (let k = a + 1; k < b; k++) {
      const d = len === 0 ? Math.hypot(pts[k][0] - ax, pts[k][1] - ay) : Math.abs(dy * (pts[k][0] - ax) - dx * (pts[k][1] - ay)) / len;
      if (d > farD) { farD = d; far = k; }
    }
    if (far >= 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, k) => keep[k]);
}
// A closed ring is cut at its first point and at the point farthest from it, and both halves are simplified.
export function simplify(pts, tol, closed) {
  if (!closed || pts.length < 4) return simplifyRun(pts, tol);
  let far = 0, farD = -1;
  for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[0][0], pts[k][1] - pts[0][1]); if (d > farD) { farD = d; far = k; } }
  const a = simplifyRun(pts.slice(0, far + 1), tol), b = simplifyRun([...pts.slice(far), pts[0]], tol);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

const attrsOf = (s) => {
  const a = {};
  for (const [, k, , v1, v2] of s.matchAll(/([a-zA-Z_:][-\w:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g)) a[k] = v1 ?? v2 ?? '';
  if (a.style) for (const decl of a.style.split(';')) { const c = decl.indexOf(':'); if (c > 0) a[decl.slice(0, c).trim()] = decl.slice(c + 1).trim(); }
  return a;
};

// Reads the drawable elements of an SVG text: [{ kind, geometry..., fill | stroke, matrix }] in document order.
export function readSvg(svg) {
  const text = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/<!DOCTYPE[\s\S]*?\]>/, '').replace(/<!DOCTYPE[^>]*>/, '');
  const tags = [...text.matchAll(/<(\/?)([a-zA-Z][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g)];
  // Gradients: one flat colour each, the middle stop.
  const gradients = new Map();
  let open = null;
  for (const [, close, name, rest] of tags) {
    if (name === 'linearGradient' || name === 'radialGradient') {
      if (close) { open = null; continue; }
      const a = attrsOf(rest);
      open = { stops: [], href: (a['xlink:href'] ?? a.href ?? '').replace(/^#/, '') };
      if (a.id) gradients.set(a.id, open);
      if (rest.trim().endsWith('/')) open = null;
    } else if (name === 'stop' && open && !close) {
      const a = attrsOf(rest);
      const c = parsePaint(a['stop-color'] ?? '#000');
      if (Array.isArray(c) && Number(a['stop-opacity'] ?? 1) >= 0.5) open.stops.push(c);
    }
  }
  const gradientColour = (id, depth = 0) => {
    const g = gradients.get(id);
    if (!g || depth > 5) return null;
    if (g.stops.length) return g.stops[Math.floor((g.stops.length - 1) / 2)];
    return g.href ? gradientColour(g.href, depth + 1) : null;
  };
  const resolve = (paint) => (paint && paint.url ? gradientColour(paint.url) : paint);

  const out = [];
  let viewBox = null;
  const stack = [{ fill: [0, 0, 0], stroke: 'none', opacity: 1, matrix: IDENTITY, skip: false }];
  const SKIP = new Set(['defs', 'clipPath', 'mask', 'symbol', 'pattern', 'marker', 'linearGradient', 'radialGradient', 'filter', 'metadata', 'switch_', 'foreignObject']);
  for (const [, close, name, rest, selfClose] of tags) {
    if (close) { if (stack.length > 1) stack.pop(); continue; }
    const a = attrsOf(rest);
    const top = stack[stack.length - 1];
    const state = { ...top };
    if (name === 'svg' && a.viewBox) { const v = numbers(a.viewBox); if (v.length === 4) viewBox = v; }
    if (SKIP.has(name) || a.display === 'none' || a.visibility === 'hidden') state.skip = true;
    if (a.fill !== undefined) { const p = resolve(parsePaint(a.fill)); if (p !== null && !p.url) state.fill = p; }
    if (a.stroke !== undefined) { const p = resolve(parsePaint(a.stroke)); if (p !== null && !p.url) state.stroke = p; }
    state.opacity = top.opacity * Number(a.opacity ?? 1) * 1;
    const fillOpacity = Number(a['fill-opacity'] ?? 1);
    if (a.transform) state.matrix = mul(top.matrix, parseTransform(a.transform));
    const selfClosing = selfClose === '/' || rest.trim().endsWith('/');
    if (!selfClosing) stack.push(state);
    if (state.skip || !(state.opacity * fillOpacity >= 0.75)) continue; // translucent overlays (highlights, shadows) are dropped
    const n = (k, d = 0) => (a[k] === undefined ? d : parseFloat(a[k]));
    const paint = state.fill !== 'none' ? { fill: state.fill } : state.stroke !== 'none' ? { stroke: state.stroke } : null;
    if (!paint) continue;
    const el = { ...paint, matrix: state.matrix };
    if (name === 'path' && a.d) out.push({ ...el, kind: 'path', subpaths: flattenPath(a.d) });
    else if (name === 'polygon' || name === 'polyline') {
      const v = numbers(a.points ?? '');
      const points = [];
      for (let k = 0; k + 1 < v.length; k += 2) points.push([v[k], v[k + 1]]);
      out.push({ ...el, kind: 'path', subpaths: [{ points, closed: name === 'polygon' }] });
    } else if (name === 'line') {
      if (state.stroke !== 'none') out.push({ stroke: state.stroke, matrix: state.matrix, kind: 'path', subpaths: [{ points: [[n('x1'), n('y1')], [n('x2'), n('y2')]], closed: false }] });
    } else if (name === 'circle') out.push({ ...el, kind: 'ellipse', cx: n('cx'), cy: n('cy'), rx: n('r'), ry: n('r') });
    else if (name === 'ellipse') out.push({ ...el, kind: 'ellipse', cx: n('cx'), cy: n('cy'), rx: n('rx'), ry: n('ry') });
    else if (name === 'rect') out.push({ ...el, kind: 'rect', x: n('x'), y: n('y'), w: n('width'), h: n('height') });
  }
  return { viewBox: viewBox ?? [0, 0, 128, 128], elements: out };
}

const r1 = (v) => Math.round(Math.max(0, Math.min(100, v)) * 10) / 10;

// SVG text -> parts in draw order: { shape, x, y, w, h, rgb, colour, points? } in the 0-100 frame.
export function svgToParts(svg, { maxParts = 16, maxPoints = 40, budget = 200, tolerance = 0.35 } = {}) {
  const { viewBox, elements } = readSvg(svg);
  const scale = 100 / Math.max(viewBox[2], viewBox[3]);
  const frame = [scale, 0, 0, scale, (100 - viewBox[2] * scale) / 2 - viewBox[0] * scale, (100 - viewBox[3] * scale) / 2 - viewBox[1] * scale];
  let parts = [];
  for (const el of elements) {
    const m = mul(frame, el.matrix);
    const rgb = el.fill ?? el.stroke;
    const base = { rgb: hex(rgb), colour: colourName(rgb) };
    const ellipsePoints = () => Array.from({ length: 24 }, (_, k) => apply(m, [el.cx + el.rx * Math.cos((k * Math.PI) / 12), el.cy + el.ry * Math.sin((k * Math.PI) / 12)]));
    if (el.kind === 'ellipse' && el.fill && isAxisAligned(m)) {
      const [cx, cy] = apply(m, [el.cx, el.cy]);
      const rx = Math.abs(el.rx * m[0]), ry = Math.abs(el.ry * m[3]);
      parts.push({ ...base, shape: Math.abs(rx - ry) < 0.05 ? 'circle' : 'oval', box: { x: cx - rx, y: cy - ry, w: 2 * rx, h: 2 * ry }, area: Math.PI * rx * ry });
    } else if (el.kind === 'rect' && el.fill && isAxisAligned(m)) {
      const [x0, y0] = apply(m, [el.x, el.y]), [x1, y1] = apply(m, [el.x + el.w, el.y + el.h]);
      const box = { x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) };
      parts.push({ ...base, shape: Math.abs(box.w - box.h) < 0.05 ? 'square' : 'rectangle', box, area: box.w * box.h });
    } else {
      const subpaths = el.kind === 'path' ? el.subpaths.map((s) => ({ closed: s.closed, points: s.points.map((p) => apply(m, p)) }))
        : el.kind === 'ellipse' ? [{ closed: true, points: ellipsePoints() }]
          : [{ closed: true, points: [[el.x, el.y], [el.x + el.w, el.y], [el.x + el.w, el.y + el.h], [el.x, el.y + el.h]].map((p) => apply(m, p)) }];
      if (el.fill) {
        // Filled: every subpath is a polygon; one that lies inside an earlier, larger one of the same path is a hole.
        const rings = subpaths.filter((s) => s.points.length >= 3).map((s) => ({ points: s.points, area: area(s.points) }));
        const kept = [];
        for (const r of rings) {
          const hole = kept.some((k) => k.area > r.area && inside(r.points[0][0], r.points[0][1], k.points));
          if (!hole) kept.push(r);
        }
        for (const r of kept) parts.push({ ...base, shape: 'polygon', points: r.points, closed: true, area: r.area });
      } else {
        for (const s of subpaths) if (s.points.length >= 2) { const b = bounds(s.points); parts.push({ ...base, shape: 'line', points: s.points, closed: false, area: Math.max(b.w, b.h) }); }
      }
    }
  }
  parts = parts.filter((p) => p.area >= 0.3);
  if (parts.length > maxParts) {
    const keep = new Set([...parts.keys()].sort((a, b) => parts[b].area - parts[a].area || a - b).slice(0, maxParts));
    parts = parts.filter((_, i) => keep.has(i));
  }
  // Simplify: each polygon to at most maxPoints, all together to at most `budget` points.
  const round = (pts) => {
    const out = [];
    for (const p of pts) { const q = [r1(p[0]), r1(p[1])]; const last = out[out.length - 1]; if (!last || last[0] !== q[0] || last[1] !== q[1]) out.push(q); }
    if (out.length > 1 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop();
    return out;
  };
  let tol = tolerance, done = [];
  for (let pass = 0; pass < 40; pass++) {
    done = parts.map((p) => {
      if (!p.points) return p;
      let t = tol, pts = round(simplify(p.points, t, p.closed));
      while (pts.length > maxPoints) { t *= 1.3; pts = round(simplify(p.points, t, p.closed)); }
      return { ...p, simple: pts };
    });
    if (done.reduce((n, p) => n + (p.simple?.length ?? 0), 0) <= budget) break;
    tol *= 1.25;
  }
  const result = [];
  for (const p of done) {
    if (p.simple) {
      if (p.simple.length < (p.shape === 'line' ? 2 : 3)) continue;
      const b = bounds(p.simple);
      result.push({ shape: p.shape, x: r1(b.x), y: r1(b.y), w: r1(b.w), h: r1(b.h), rgb: p.rgb, colour: p.colour, points: p.simple });
    } else {
      // A primitive: clipped to the frame; a circle or a square keeps w = h.
      const x = r1(p.box.x), y = r1(p.box.y);
      let w = r1(Math.min(100, p.box.x + p.box.w) - x), h = r1(Math.min(100, p.box.y + p.box.h) - y);
      if (p.shape === 'circle' || p.shape === 'square') w = h = Math.min(w, h);
      if (w <= 0 || h <= 0) continue;
      result.push({ shape: p.shape, x, y, w: r1(w), h: r1(h), rgb: p.rgb, colour: p.colour });
    }
  }
  return result;
}

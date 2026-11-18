import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanWorlds, schemaWorld } from '../tools/lib/worlds.mjs';

const id = 'k.spatial2d';
const library = scanWorlds();
const policies = library.find((world) => world.id === id).shards.find((shard) => shard.id.endsWith('/policies'));
const scope = 'frame="sheet" instance="scene" revision="17" scope="root"';
const at = (fields = {}) => Object.entries(fields)
  .reduce((context, [key, value]) => context.replace(new RegExp(key + '="[^"]*"'), key + '=' + JSON.stringify(value)), scope);
const box = (entity, [left, top, right, bottom], context = scope, evidence = 'bounds') =>
  `@${entity} ${id}.box entity="${entity}" ${context} evidence=${evidence} min_x=${left} min_y=${top} max_x=${right} max_y=${bottom}`;
const point = (entity, x, y, context = scope) =>
  `@${entity} ${id}.point entity="${entity}" ${context} x=${x} y=${y}`;
const relation = (kind, subject, object, evidence = '', context = scope) =>
  `@${kind} ${id}.relation kind=${kind} subject="${subject}" object="${object}" ${context} ${evidence}`;

function makeWorld() {
  const { world, result } = schemaWorld(library, id);
  assert.equal(result.ok, true, JSON.stringify(result.violations));
  tell(world, policies.text);
  return world;
}

function tell(world, ...source) {
  const result = world.tell(source.join('\n'));
  assert.equal(result.ok, true, JSON.stringify(result.violations));
}

function measurements(world) {
  return Object.fromEntries(world.ofType(id + '.measurement').map(({ attrs }) => [attrs.metric[0], Number(attrs.value[0])]));
}

test('peer clearance has a gradient below the gap and an area penalty under overlap', () => {
  for (const [left, deficit, area] of [[22, 0, 0], [16, 6, 0], [10, 12, 0], [8, 14, 20], [5, 17, 50]]) {
    const world = makeWorld();
    tell(world, box('a', [0, 0, 10, 10]), box('b', [left, 0, left + 10, 10]), relation('independent_peer', 'a', 'b'));
    assert.deepEqual(measurements(world), { clearance_deficit: deficit, overlap_area: area });
  }
});

test('scope, frame, instance, revision and relation restrict applicability', () => {
  for (const fields of [{ scope: 'group' }, { frame: 'page' }, { instance: 'other' }, { revision: '16' }]) {
    const world = makeWorld();
    tell(world, box('a', [0, 0, 10, 10]), box('b', [0, 0, 10, 10], at(fields)), relation('independent_peer', 'a', 'b'));
    assert.deepEqual(measurements(world), {});
  }
  const world = makeWorld();
  tell(world, box('a', [0, 0, 10, 10]), relation('independent_peer', 'a', 'a'));
  assert.deepEqual(measurements(world), {});
});

test('membership permits occupation and requires containment only with rectangular evidence', () => {
  const group = at({ scope: 'group' });
  const membership = relation('member_of', 'child', 'group', 'evidence=containment', group);
  const container = box('group', [0, 0, 20, 20], scope, 'rectangle');
  const world = makeWorld();
  tell(world, container, box('child', [0, 0, 10, 10], group), membership);
  assert.deepEqual(measurements(world), { containment: 0 });
  const rejected = makeWorld().tell([container, box('child', [-1, 0, 10, 10], group), membership].join('\n'));
  assert.equal(rejected.ok, false);
  assert.match(JSON.stringify(rejected.violations), /Hard spatial requirement violated/);
  const boundsOnly = makeWorld();
  tell(boundsOnly, box('group', [0, 0, 20, 20]), box('child', [-1, 0, 10, 10], group), membership);
  assert.deepEqual(measurements(boundsOnly), {});
});

test('attached endpoints and part anchors use observed point evidence', () => {
  for (const kind of ['endpoint_of', 'anchored_to']) {
    const attachment = relation(kind, 'endpoint', 'anchor', 'evidence=coincident');
    const world = makeWorld();
    tell(world, point('endpoint', 1, 3), point('anchor', 1, 3), attachment);
    assert.deepEqual(measurements(world), { coincident: 0 });
    const rejected = makeWorld().tell([point('endpoint', 1, 3), point('anchor', 2, 3), attachment].join('\n'));
    assert.equal(rejected.ok, false);
    assert.match(JSON.stringify(rejected.violations), /Hard spatial requirement violated/);
    const missing = makeWorld();
    tell(missing, point('endpoint', 1, 3), point('anchor', 1, 3, at({ revision: '16' })), attachment);
    assert.deepEqual(measurements(missing), {});
  }
});

test('scoped preference changes near cost and retracting it restores defaults', () => {
  const world = makeWorld();
  const preference = `@preference ${id}.preference profile="editor" frame="sheet" scope="root" relation=near metric=near_distance clearance=4 weight=2 evidence="explicit setting"`;
  tell(world, box('a', [0, 0, 10, 10]), box('b', [14, 0, 24, 10]), relation('near', 'a', 'b'),
    `@profile ${id}.profile name="editor" ${scope}`,
    preference.replace('root', 'another-group').replace('@preference ', '@other '));
  assert.deepEqual(measurements(world), { near_distance: 8 });
  tell(world, preference);
  assert.deepEqual(measurements(world), { near_distance: 0 });
  assert.equal(world.ofType(id + '.measurement')[0].attrs.weight[0], '2');
  assert.equal(world.retract('preference').ok, true);
  assert.deepEqual(measurements(world), { near_distance: 8 });
});

test('two concordant independent corrections inform comparable placements and retract with evidence', () => {
  const world = makeWorld();
  const correction = (idOfCorrection, event, clearance, comparison = 'similar', before = 12) =>
    `@${idOfCorrection} ${id}.correction profile="editor" frame="sheet" scope="root" relation=near metric=near_distance comparison="${comparison}" event="${event}" before=${before} clearance=${clearance}`;
  tell(world, box('a', [0, 0, 10, 10]), box('b', [14, 0, 24, 10]), relation('near', 'a', 'b'),
    `@profile ${id}.profile name="editor" comparison="similar" ${scope}`,
    correction('first', 'transaction-1', 4), correction('duplicate', 'transaction-1', 4),
    correction('unrelated', 'transaction-2', 4, 'different'), correction('unchanged', 'transaction-3', 4, 'similar', 4));
  assert.deepEqual(measurements(world), { near_distance: 8 });
  assert.equal(world.ofType(id + '.learned_preference').length, 0);

  tell(world, correction('second', 'transaction-4', 4));
  const evidence = world.ofType(id + '.learned_preference');
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].attrs.first_event[0], '"transaction-1"');
  assert.equal(evidence[0].attrs.second_event[0], '"transaction-4"');
  assert.deepEqual(measurements(world), { near_distance: 0 });

  tell(world, `@explicit ${id}.preference profile="editor" frame="sheet" scope="root" relation=near metric=near_distance clearance=6 weight=1 evidence="explicit setting"`);
  assert.deepEqual(measurements(world), { near_distance: 2 });
  assert.equal(world.retract('explicit').ok, true);

  tell(world, correction('third', 'transaction-5', 8), correction('fourth', 'transaction-6', 8));
  assert.deepEqual(measurements(world), { near_distance: 8 }, 'disagreement restores the default');
  assert.equal(world.retract('fourth').ok, true);
  assert.deepEqual(measurements(world), { near_distance: 0 });
  assert.equal(world.retract('second').ok, true);
  assert.deepEqual(measurements(world), { near_distance: 8 });
});

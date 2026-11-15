// w.person (block 10:55, PSys2 Q19): a person as they tell it in a session, and the w.lang.en frames of the shard
// person-frames (tools/lang-en-person-frames.mjs) that read what a person says and asks about themselves: statements
// with mood declarative, questions with mood interrogative. The turns below are the kinds of turn of PSys2's former
// Profile tab (30 real turns: "I have two kids", "I like cats, dogs and horses", "what do you know about me", "I am 40").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../tools/sopworld/sopworld.mjs';
import { WORLDS_DIR } from '../tools/lib/worlds.mjs';
import { actsWorld } from '../tools/lib/schemas.mjs';
import { frameReader } from '../tools/lib/lang-en.mjs';
import { personFrameShard, lexicons } from '../tools/lang-en-person-frames.mjs';

const shards = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));
const read = frameReader(shards('w.lang.en'), shards('k.actions'), { needs: (n) => n === undefined || n === 'person' });

test('the shard person-frames is what tools/lang-en-person-frames.mjs gives; its lexicons come from w.person and k.people', () => {
  assert.equal(readFileSync(join(WORLDS_DIR, 'w.lang.en', 'shards', 'person-frames.sop'), 'utf8'), personFrameShard());
  const lx = lexicons();
  for (const w of ['child', 'kids', 'mum', 'grandma', 'daughters']) assert.ok(lx['person.relation'].items.includes(w), w);
  for (const w of ['teacher', 'doctor', 'nurse']) assert.ok(lx['person.occupation'].items.includes(w), w);
});

// [turn, act/mode, mood, args]
const TURNS = [
  ['I have two kids', 'change/set', 'declarative', { thing: 'me', attribute: 'kids', value: 'two' }],
  ["I've got three children", 'change/set', 'declarative', { thing: 'me', attribute: 'children', value: 'three' }],
  ['I have a son', 'change/set', 'declarative', { thing: 'me', attribute: 'son' }],
  ['we have 2 daughters', 'change/set', 'declarative', { thing: 'me', attribute: 'daughters', value: '2' }],
  ['I am 40', 'change/set', 'declarative', { thing: 'me', attribute: 'age', value: '40' }],
  ["I'm 40 years old", 'change/set', 'declarative', { thing: 'me', attribute: 'age', value: '40' }],
  ['I like cats, dogs and horses', 'change/set', 'declarative', { thing: 'me', attribute: 'likes', value: 'cats dogs and horses' }],
  ['I love pizza', 'change/set', 'declarative', { thing: 'me', attribute: 'likes', value: 'pizza' }],
  ["I don't like spiders", 'change/set', 'declarative', { thing: 'me', attribute: 'dislikes', value: 'spiders' }],
  ['I hate snakes', 'change/set', 'declarative', { thing: 'me', attribute: 'dislikes', value: 'snakes' }],
  ['My name is Ana', 'change/set', 'declarative', { thing: 'me', attribute: 'name', value: 'ana' }],
  ["My name's Ana", 'change/set', 'declarative', { thing: 'me', attribute: 'name', value: 'ana' }],
  ['I am called Ana', 'change/set', 'declarative', { thing: 'me', attribute: 'name', value: 'ana' }],
  ['call me Ana', 'change/set', 'declarative', { thing: 'me', attribute: 'name', value: 'ana' }],
  ['I am a teacher', 'change/set', 'declarative', { thing: 'me', attribute: 'occupation', value: 'teacher' }],
  ['I work as a nurse', 'change/set', 'declarative', { thing: 'me', attribute: 'occupation', value: 'nurse' }],
  ['I speak English and Romanian', 'change/set', 'declarative', { thing: 'me', attribute: 'language', value: 'english and romanian' }],
  ['what do you know about me', 'ask/describe', 'interrogative', { thing: 'me' }],
  ['tell me about myself', 'ask/describe', 'interrogative', { thing: 'me' }],
  ['who am I', 'ask/describe', 'interrogative', { thing: 'me' }],
  ['how many kids do I have', 'ask/count', 'interrogative', { thing: 'me', topic: 'kids' }],
  ['how many brothers have I got', 'ask/count', 'interrogative', { thing: 'me', topic: 'brothers' }],
  ['how old am I', 'ask/what', 'interrogative', { thing: 'me', topic: 'age' }],
  ['what is my name', 'ask/what', 'interrogative', { thing: 'me', topic: 'name' }],
  ['do you remember my name', 'ask/what', 'interrogative', { thing: 'me', topic: 'name' }],
  ['what do I like', 'ask/what', 'interrogative', { thing: 'me', topic: 'likes' }],
  ['what is my job', 'ask/what', 'interrogative', { thing: 'me', topic: 'occupation' }],
  ['what languages do I speak', 'ask/what', 'interrogative', { thing: 'me', topic: 'language' }],
];

test('first-person statements read as change with mood declarative, questions about the speaker as ask with mood interrogative', () => {
  const bad = [];
  for (const [s, am, mood, args] of TURNS) {
    const [r] = read(s);
    const got = r ? [`${r.act}/${r.mode}`, r.mood, r.args] : null;
    try { assert.deepEqual(got, [am, mood, args]); } catch { bad.push(`${s} -> ${JSON.stringify(got)}`); }
  }
  assert.deepEqual(bad, []);
  // a pet is not a relative: no person frame reads it
  assert.ok(!read('I have a cat').some((r) => r.frame.startsWith('person.')));
});

test('a session of w.person: the user, two kids, three tastes, an age changed; a wrong relation is refused', () => {
  const w = actsWorld(['w.person']), act = (a, args) => w.act({ action: a, args });
  assert.equal(act('make', { kind: 'w.person.person', user: true, name: 'Ana', age: 40, occupation: 'teacher' }).result.thing, 'w_person_person1');
  assert.equal(act('make', { kind: 'w.person.relative', of: '$w_person_person1', relation: 'child', count: 2 }).ok, true);
  for (const [thing, type] of [['cat', 'k.animals.animal'], ['dog', 'k.animals.animal'], ['horse', 'k.animals.animal']]) assert.equal(act('make', { kind: 'w.person.taste', of: '$w_person_person1', thing, type }).ok, true);
  assert.equal(act('make', { kind: 'w.person.taste', of: '$w_person_person1', thing: 'spider', stance: 'dislikes' }).ok, true);
  assert.equal(act('pick', { kind: 'w.person.taste', stance: 'likes' }).result.things.length, 3);
  assert.equal(act('ask', { thing: 'w_person_relative1', attr: 'count' }).result.value, '2');
  assert.equal(act('change', { thing: 'w_person_person1', attr: 'age', value: 41 }).ok, true);
  assert.equal(act('ask', { thing: 'w_person_person1', attr: 'age' }).result.value, '41');
  assert.equal(act('make', { kind: 'w.person.relative', of: '$w_person_person1', relation: 'kid' }).ok, false, 'kid is a word for child, not a relation');
  assert.equal(act('change', { thing: 'w_person_person1', attr: 'age', value: 200 }).ok, false);
});

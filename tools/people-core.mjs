// The roles and jobs of k.people (R7.5), hand-written: what they wear, hold and use, where they work, what they do,
// and the k.faces features that suit them.
//   node tools/people-core.mjs      writes docs/worlds/k.people/shards/roles-<group>.sop; prints the joins
// A role: [name, group, { is, wears, holds, uses, at, does, hat, glasses, beard, moustache, shoulders, face, words }].
// Lists are written as one text with "," between the values.
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
const J = 'job', F = 'family', S = 'story', O = 'social';
export const ROLES = [
  ['doctor', J, { wears: 'lab coat', holds: 'stethoscope', uses: 'syringe, medicine, clinical thermometer', at: 'hospital', does: 'examine, heal, give medicine', glasses: 'round', shoulders: 'lab coat', words: 'doctors, physician, dr' }],
  ['nurse', J, { wears: 'apron', holds: 'syringe', uses: 'clinical thermometer, plaster, medicine', at: 'hospital', does: 'care for patients, bandage, give medicine', shoulders: 'scrubs', hat: 'nurse cap', words: 'nurses' }],
  ['dentist', J, { wears: 'lab coat', holds: 'toothbrush', uses: 'mirror, toothpaste', at: 'hospital', does: 'look after teeth, fill a tooth', shoulders: 'scrubs', glasses: 'square', words: 'dentists' }],
  ['vet', J, { wears: 'lab coat', holds: 'stethoscope', uses: 'syringe, medicine', at: 'farm, zoo', does: 'heal animals, examine', shoulders: 'lab coat', words: 'vets, veterinarian, animal doctor' }],
  ['teacher', J, { holds: 'chalk, book', uses: 'blackboard, whiteboard, globe showing Europe-Africa', at: 'classroom', does: 'teach, explain, read aloud', glasses: 'square', shoulders: 'shirt', words: 'teachers, schoolteacher' }],
  ['farmer', J, { wears: 'wellington boots, hat', holds: 'rake', uses: 'tractor, wheelbarrow, hay', at: 'farm, field', does: 'plough, sow, harvest, feed the animals, milk the cows', hat: 'sun hat', shoulders: 'overalls', words: 'farmers' }],
  ['cook', J, { wears: 'apron', holds: 'wooden spoon, frying pan', uses: 'saucepan, kitchen knife, cooker', at: 'kitchen, restaurant', does: 'cook, fry, stir, taste', shoulders: 'chef jacket', hat: 'chef hat', words: 'cooks, chef, chefs' }],
  ['baker', J, { wears: 'apron', holds: 'rolling pin, bread', uses: 'oven, flour, dough', at: 'kitchen', does: 'bake bread, knead dough', shoulders: 'apron', hat: 'chef hat', words: 'bakers' }],
  ['waiter', J, { wears: 'bow tie, apron', holds: 'tray, menu', uses: 'plate, wine glass', at: 'restaurant, cafe', does: 'serve, take orders, clear the table', shoulders: 'bow tie', words: 'waiters, waitress, waitresses' }],
  ['firefighter', J, { wears: 'fire helmet, boots', holds: 'fire hose', uses: 'fire engine, ladder, fire extinguisher', at: 'city street', does: 'put out fires, rescue people', shoulders: 'fire jacket', hat: 'fire helmet', words: 'firefighters, fireman, firemen' }],
  ['police officer', J, { wears: 'police helmet', holds: 'handcuffs, police radio', uses: 'police car', at: 'city street', does: 'keep order, catch thieves, direct traffic', hat: 'police cap', shoulders: 'uniform', words: 'police, policeman, policewoman, cop, officer' }],
  ['pilot', J, { wears: 'suit, sunglasses', uses: 'airplane, helicopter', at: 'airport', does: 'fly a plane, take off, land', hat: 'pilot cap', glasses: 'sunglasses', shoulders: 'uniform', words: 'pilots, airman' }],
  ['astronaut', J, { wears: 'space suit', uses: 'rocket, space shuttle, satellite', at: 'space', does: 'fly to space, float, explore', shoulders: 'space suit', hat: 'space helmet', words: 'astronauts, spaceman, cosmonaut' }],
  ['sailor', J, { holds: 'rope', uses: 'ship, anchor, sailboat', at: 'harbour', does: 'sail, tie knots, steer', hat: 'sailor cap', shoulders: 'sailor collar', words: 'sailors, seaman' }],
  ['fisherman', J, { wears: 'wellington boots, raincoat', holds: 'fishing pole', uses: 'boat, net with handle', at: 'harbour, river, lake', does: 'catch fish, cast a net', hat: 'beanie', beard: 'full', shoulders: 'hoodie', words: 'fishermen, angler, fisher' }],
  ['soldier', J, { wears: 'military helmet, boots', holds: 'rifle', uses: 'tank', does: 'guard, march', shoulders: 'uniform', hat: 'military helmet', words: 'soldiers' }],
  ['builder', J, { wears: 'hard hat, safety vest', holds: 'hammer', uses: 'brick, cement mixer, ladder, crane', at: 'construction site', does: 'build, lay bricks, dig', shoulders: 'safety vest', hat: 'hard hat', words: 'builders, bricklayer, construction worker' }],
  ['carpenter', J, { wears: 'apron', holds: 'saw, hammer', uses: 'nail, wood, chisel, drill electric', at: 'workshop', does: 'saw, hammer, make furniture', shoulders: 'overalls', words: 'carpenters, joiner' }],
  ['plumber', J, { holds: 'wrench', uses: 'toolbox, pliers, tap', at: 'bathroom, kitchen', does: 'fix pipes, stop leaks', shoulders: 'overalls', hat: 'cap', words: 'plumbers' }],
  ['mechanic', J, { holds: 'wrench', uses: 'toolbox, car, tire, screwdriver', at: 'workshop', does: 'repair cars, change tyres', shoulders: 'boiler suit', words: 'mechanics' }],
  ['gardener', J, { wears: 'gardening gloves, wellington boots', holds: 'watering can, spade', uses: 'rake, wheelbarrow, lawn mower, hose', at: 'garden, park', does: 'plant, water, dig, mow', hat: 'sun hat', shoulders: 'apron', words: 'gardeners' }],
  ['postman', J, { holds: 'letter, package', uses: 'post van, postbox', at: 'city street, village', does: 'deliver letters, carry parcels', hat: 'cap', shoulders: 'uniform', words: 'postmen, postwoman, mailman, postal worker' }],
  ['bus driver', J, { uses: 'bus', at: 'city street', does: 'drive, stop at bus stops, sell tickets', hat: 'cap', shoulders: 'shirt', words: 'driver, drivers, bus drivers' }],
  ['shopkeeper', J, { wears: 'apron', holds: 'money', uses: 'balance scale, shopping bags, shelf', at: 'supermarket, market', does: 'sell, weigh, give change', shoulders: 'apron', words: 'shopkeepers, grocer, seller, shop assistant, cashier' }],
  ['hairdresser', J, { holds: 'scissors, comb', uses: 'hairdryer, mirror, hairbrush', does: 'cut hair, comb, dry hair', shoulders: 'v-neck', words: 'hairdressers, barber' }],
  ['painter', J, { wears: 'apron', holds: 'paint brush, artist palette', uses: 'paint, painting', at: 'museum', does: 'paint pictures, mix colours', hat: 'beret', shoulders: 'apron', words: 'painters, artist, artists' }],
  ['musician', J, { holds: 'guitar', uses: 'piano, violin, trumpet, drum', at: 'theatre', does: 'play music, practise', shoulders: 'bow tie', words: 'musicians, guitarist, pianist' }],
  ['singer', J, { holds: 'microphone', at: 'theatre', does: 'sing', shoulders: 'v-neck', words: 'singers' }],
  ['dancer', J, { wears: 'ballet shoes, dress', at: 'theatre', does: 'dance, spin, jump', shoulders: 'tank top', words: 'dancers, ballerina' }],
  ['scientist', J, { wears: 'lab coat, safety goggles', holds: 'test tube', uses: 'microscope, conical flask, computer', at: 'laboratory', does: 'experiment, measure, discover', glasses: 'large', shoulders: 'shirt', words: 'scientists, researcher, chemist' }],
  ['judge', J, { wears: 'robe, wig', at: 'courthouse', does: 'listen, decide', glasses: 'small round', shoulders: 'robe', hat: 'judge wig', words: 'judges' }],
  ['cleaner', J, { wears: 'apron', holds: 'mop, broom', uses: 'bucket, sponge, vacuum cleaner hand held', does: 'clean, sweep, mop', shoulders: 'apron', hat: 'headscarf', words: 'cleaners, janitor, caretaker' }],
  ['librarian', J, { holds: 'book', uses: 'books, bookcase, computer', at: 'library', does: 'lend books, sort books', glasses: 'cat-eye', shoulders: 'shirt', words: 'librarians' }],
  ['photographer', J, { holds: 'camera', uses: 'photographs, camera with flash', does: 'take photos', shoulders: 'hoodie', words: 'photographers' }],
  ['footballer', J, { wears: 'football kit, boots', uses: 'soccer ball, goal', at: 'football pitch', does: 'kick the ball, score goals, run', shoulders: 'football shirt', words: 'footballers, football player, soccer player, player' }],
  ['swimmer', J, { wears: 'swimming cap, goggles, swimming costume', at: 'swimming pool, beach', does: 'swim, dive', hat: 'swimming cap', shoulders: 'tank top', words: 'swimmers' }],
  // family
  ['mother', F, { is: 'woman', does: 'look after the children', face: 'woman', words: 'mothers, mum, mom, mummy, mommy, mama' }],
  ['father', F, { is: 'man', does: 'look after the children', face: 'man', words: 'fathers, dad, daddy, papa' }],
  ['grandmother', F, { is: 'grandmother', wears: 'glasses', holds: 'yarn', uses: 'rocking chair, walking stick', does: 'tell stories, knit, bake', glasses: 'small round', face: 'old woman', words: 'grandma, granny, nan, nana' }],
  ['grandfather', F, { is: 'grandfather', wears: 'glasses', holds: 'walking stick', uses: 'armchair, newspaper', does: 'tell stories, read the newspaper', moustache: 'walrus', face: 'old man', words: 'grandpa, granddad, grandad' }],
  ['sister', F, { is: 'girl', does: 'play', face: 'girl', words: 'sisters' }],
  ['brother', F, { is: 'boy', does: 'play', face: 'boy', words: 'brothers' }],
  ['aunt', F, { is: 'woman', does: 'visit', face: 'woman', words: 'aunts, auntie, aunty' }],
  ['uncle', F, { is: 'man', does: 'visit', face: 'bearded man', words: 'uncles' }],
  // block 07:40 item 4: the people a child knows who are no relatives
  ['friend', O, { does: 'play, talk', words: 'friends, pal, pals, buddy, buddies, mate, mates' }],
  ['neighbour', O, { does: 'visit, say hello', words: 'neighbours, neighbor, neighbors' }],
  // figures of stories
  ['king', S, { is: 'man', wears: 'crown, robe', holds: 'sword', uses: 'throne', at: 'castle', does: 'rule, give orders', hat: 'crown', beard: 'full', shoulders: 'cloak', words: 'kings' }],
  ['queen', S, { is: 'woman', wears: 'crown, dress, necklace', uses: 'throne', at: 'castle', does: 'rule', hat: 'crown', face: 'queen', words: 'queens' }],
  ['prince', S, { is: 'boy', wears: 'crown', holds: 'sword', uses: 'horse', at: 'castle', does: 'ride, rescue', hat: 'crown', words: 'princes' }],
  ['princess', S, { is: 'girl', wears: 'crown, dress', at: 'castle', does: 'dance, sing', hat: 'crown', words: 'princesses' }],
  ['knight', S, { is: 'man', wears: 'armor', holds: 'sword, shield', uses: 'horse', at: 'castle', does: 'fight dragons, ride, guard the castle', hat: 'knight helmet', shoulders: 'metal plate', words: 'knights' }],
  ['pirate', S, { is: 'man', wears: 'hat, boots', holds: 'sword', uses: 'ship, treasure chest, map, cannon, telescope', at: 'pirate ship, island', does: 'sail the seas, hunt for treasure', beard: 'full', moustache: 'handlebar', hat: 'pirate hat', words: 'pirates, buccaneer' }],
  ['witch', S, { is: 'woman', wears: 'witches hat', holds: 'broomstick', uses: 'black cat', at: 'Halloween', does: 'cast spells, fly on a broomstick', hat: 'witch hat', words: 'witches' }],
  ['wizard', S, { is: 'man', wears: 'robe, witches hat', holds: 'magic wand', uses: 'crystal ball, book', does: 'cast spells, do magic', beard: 'long', hat: 'wizard hat', shoulders: 'cloak', words: 'wizards, sorcerer' }],
  ['fairy', S, { is: 'girl', wears: 'dress', holds: 'magic wand', at: 'garden, forest', does: 'fly, grant wishes', hat: 'flower wreath', words: 'fairies' }],
  ['clown', S, { wears: 'bow tie', holds: 'balloon', uses: 'ball', at: 'circus', does: 'make people laugh, juggle, fall over', hat: 'party hat', face: 'clown', words: 'clowns' }],
  ['cowboy', S, { is: 'man', wears: 'boots, hat', holds: 'rope', uses: 'horse', at: 'desert', does: 'ride, herd cattle', hat: 'cowboy hat', moustache: 'handlebar', words: 'cowboys, cowgirl' }],
  ['detective', S, { wears: 'coat, hat', holds: 'magnifying glass tilted left', uses: 'notebook', at: 'city street', does: 'look for clues, solve mysteries', moustache: 'pencil', shoulders: 'suit', hat: 'fedora', words: 'detectives, sleuth' }],
  ['superhero', S, { wears: 'mask', at: 'city street', does: 'fly, rescue people, fight villains', shoulders: 'cape', words: 'superheroes, hero' }],
  ['magician', S, { is: 'man', wears: 'top hat, suit, bow tie', holds: 'magic wand', uses: 'rabbit, playing cards', at: 'theatre, circus', does: 'do tricks, pull a rabbit out of a hat', hat: 'top hat', moustache: 'thin', shoulders: 'suit', words: 'magicians, conjurer' }],
  ['explorer', S, { wears: 'backpack, hiking boot, hat', holds: 'map, compass', uses: 'tent, telescope', at: 'jungle, desert, mountains, arctic', does: 'explore, discover, climb', hat: 'sun hat', beard: 'stubble', words: 'explorers, adventurer' }],
  ['Father Christmas', S, { is: 'grandfather', wears: 'hat Christmas, boots', holds: 'Father Christmas sack', uses: 'sleigh, Rudolph, present', at: 'Christmas', does: 'bring presents, ride a sleigh', hat: 'Santa hat', beard: 'long', moustache: 'walrus', shoulders: 'fur coat', words: 'santa, santa claus, father christmas, saint nicholas' }],
];

const list = (v) => (v ? v.split(',').map((x) => x.trim()).filter(Boolean) : []);
const ABOUT = { job: 'jobs', family: 'members of a family', story: 'figures of stories', social: 'people one knows who are no relatives' };
// Block 07:40 item 4: every role is a kind of person (k.kinds: is_a, and kind_of by its rules); a member of a family
// is a relative, and a relative a person (k.people.kind). A fairy is a figure of stories but no person.
const IS_A = { job: 'person', family: 'relative', story: 'person', social: 'person' };
const NOT_A_PERSON = new Set(['fairy']);
export function roleShards() {
  const files = {};
  for (const group of ['job', 'family', 'story', 'social']) {
    const roles = ROLES.filter((r) => r[1] === group);
    const lines = roles.map(([name, , r]) => wire(`k.people.role.${seg(name)}`, 'k.people.role', [['name', name], ['group', group], ['is', r.is], ['is_a', NOT_A_PERSON.has(name) ? undefined : IS_A[group]],
      ...list(r.wears).map((v) => ['wears', v]), ...list(r.holds).map((v) => ['holds', v]), ...list(r.uses).map((v) => ['uses', v]), ...list(r.at).map((v) => ['works_at', v]), ...list(r.does).map((v) => ['does', v]),
      ['hat', r.hat], ['glasses', r.glasses], ['beard', r.beard], ['moustache', r.moustache], ['shoulders', r.shoulders], ['face', r.face], ['drawing', 'person']], SRC));
    const words = roles.filter(([, , r]) => r.words).map(([name, , r]) => wire(`k.people.word.role.${seg(name)}`, 'core.word', [...list(r.words).filter((w) => w !== name).map((w) => ['text', w]), ['means', name], ['of', 'k.people.role.name']], SRC));
    const id = group === 'job' ? 'roles-jobs' : `roles-${group}`;
    files[`${id}.sop`] = `${header({
      id: `k.people/shards/${id}`,
      about: `${roles.length} ${ABOUT[group]} (${roles.map((r) => r[0]).join(', ')}): what they wear, hold and use, where they work, what they do, the k.faces features that suit them; and their other names.`,
      sources: ['hand-core 1 (hand-written in this repository: tools/people-core.mjs)'],
      license: 'CC0-1.0', script: 'tools/people-core.mjs',
    })}\n${lines.join('\n')}\n\n# Words: plural forms and other names.\n${words.join('\n')}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = roleShards();
  writeShards(join(WORLDS_DIR, 'k.people', 'shards'), files, 'roles-');
  console.log(`${ROLES.length} roles in ${Object.keys(files).length} shards`);
}

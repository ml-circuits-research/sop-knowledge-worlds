// k.wearables (Round 8, item 4): what is worn where. Places on the body where things are worn, each with its box on
// the drawing `person` of k.objects, the k.faces slot that draws it and the k.body part; and wearables: where each
// is worn, what else it covers, its layer, its drawing in k.objects and its variant in k.faces.
//   node tools/wearables-core.mjs     writes docs/worlds/k.wearables/shards/*.sop
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';
import { wire, header, seg, text, writeShards } from './import/lib.mjs';

const SRC = 'hand-core 1';
const list = (s) => (s ?? '').split(',').map((x) => x.trim()).filter(Boolean);

// A place: [name, about, face slot, body part, box on the person drawing (x, y, w, h), pair, other words].
export const PLACES = [
  ['head', 'the top of the head, where a hat sits', 'hat', 'head', [36, 1, 28, 11], false, 'top of the head, on the head'],
  ['hair', 'the hair, where a clip or a band is worn', undefined, 'hair', [38, 4, 24, 7], false, 'in the hair'],
  ['eyes', 'in front of the eyes', 'glasses', 'eye', [41, 10, 18, 8], false, 'over the eyes, on the nose'],
  ['ears', 'on or over an ear', 'earrings', 'ear', [35, 13, 5, 8], true, 'ear, on the ears'],
  ['face', 'over the face', undefined, 'face', [40, 8, 20, 20], false, 'over the face'],
  ['neck', 'around the neck', undefined, 'neck', [45, 27, 10, 5], false, 'around the neck, throat'],
  ['body', 'the upper body, from the shoulders to the waist', 'shoulders', 'chest', [41, 30, 18, 30], false, 'upper body, torso, chest, top half'],
  ['back', 'on the back', undefined, 'back', [43, 31, 14, 22], false, 'on the back'],
  ['waist', 'around the waist', undefined, 'hip', [44, 57, 12, 6], false, 'around the waist, hips'],
  ['arms', 'on an arm', undefined, 'arm', [30, 38, 20, 17], true, 'arm, sleeves'],
  ['wrist', 'around a wrist', undefined, 'wrist', [30, 50, 6, 5], true, 'wrists, on the wrist'],
  ['hands', 'on a hand', undefined, 'hand', [26, 52, 8, 7], true, 'hand, on the hands'],
  ['finger', 'on a finger', undefined, 'finger', [27, 54, 4, 4], true, 'fingers, on the finger'],
  ['legs', 'on the legs, from the waist down', undefined, 'leg', [35, 62, 15, 30], true, 'leg, lower body, bottom half'],
  ['feet', 'on a foot', undefined, 'foot', [30, 88, 9, 7], true, 'foot, on the feet'],
];

// A wearable: [name, kind, worn on, also covers, layer, pair, drawing in k.objects, variant in k.faces, worn for, other words].
const W = (name, kind, on, covers, layer, pair, drawing, face, wornFor, words) => ({ name, kind, on, covers: list(covers), layer, pair, drawing, face, wornFor: list(wornFor), words: list(words) });
export const WEARABLES = [
  // Headwear.
  W('hat', 'headwear', 'head', '', 'over', false, 'hat', undefined, 'sun, looks', 'hats'),
  W('cap', 'headwear', 'head', '', 'over', false, 'cap', 'cap', 'sun, sport', 'caps, baseball cap, billed cap'),
  W('bobble hat', 'headwear', 'head', 'ears', 'over', false, 'bobble hat', 'beanie', 'cold', 'beanie, woolly hat, wool hat, winter hat'),
  W('top hat', 'headwear', 'head', '', 'over', false, 'top hat', 'top hat', 'party, looks', 'top hats'),
  W('cowboy hat', 'headwear', 'head', '', 'over', false, undefined, 'cowboy hat', 'sun', 'stetson'),
  W('sun hat', 'headwear', 'head', '', 'over', false, undefined, 'sun hat', 'sun', 'straw hat'),
  W('beret', 'headwear', 'head', '', 'over', false, undefined, 'beret', 'looks', 'berets'),
  W('party hat', 'headwear', 'head', '', 'over', false, undefined, 'party hat', 'party', 'paper hat'),
  W('chef hat', 'headwear', 'head', '', 'over', false, undefined, 'chef hat', 'work', "chef's hat, cook's hat"),
  W('witches hat', 'headwear', 'head', '', 'over', false, 'witches hat', 'witch hat', 'party', "witch hat, witch's hat, pointed hat"),
  W('Christmas hat', 'headwear', 'head', '', 'over', false, 'hat Christmas', 'Santa hat', 'party', 'Santa hat, Father Christmas hat, hat Christmas'),
  W('graduation cap', 'headwear', 'head', '', 'over', false, 'graduation cap', undefined, 'party', 'mortarboard'),
  W('crown', 'headwear', 'head', '', 'over', false, 'crown', 'crown', 'looks', 'crowns, tiara'),
  W('helmet', 'headwear', 'head', 'ears', 'over', false, 'helmet', undefined, 'safety', 'helmets'),
  W('bicycle helmet', 'headwear', 'head', '', 'over', false, 'bicycle helmet', undefined, 'safety, sport', 'cycle helmet, bike helmet'),
  W('hard hat', 'headwear', 'head', '', 'over', false, 'hard hat', 'hard hat', 'safety, work', 'safety helmet, builder hat'),
  W('fire helmet', 'headwear', 'head', '', 'over', false, 'fire helmet', 'fire helmet', 'safety, work', "firefighter's helmet"),
  W('police helmet', 'headwear', 'head', '', 'over', false, 'police helmet', undefined, 'safety, work', "policeman's helmet"),
  W('military helmet', 'headwear', 'head', '', 'over', false, 'military helmet', 'military helmet', 'safety, work', "soldier's helmet, army helmet"),
  W('swimming cap', 'headwear', 'head', 'hair', 'over', false, 'swimming cap', 'swimming cap', 'swimming', 'swim cap, bathing cap'),
  W('shower cap', 'headwear', 'head', 'hair', 'over', false, 'shower cap', undefined, 'washing', ''),
  W('headscarf', 'headwear', 'head', 'hair', 'over', false, undefined, 'headscarf', 'sun, looks', 'head scarf, kerchief'),
  W('hood', 'headwear', 'head', 'hair, ears', 'over', false, undefined, undefined, 'cold, rain', 'hoods'),
  W('wig', 'headwear', 'hair', '', 'over', false, 'wig', undefined, 'looks', 'wigs, toupee'),
  W('headband', 'headwear', 'hair', '', 'over', false, 'headband', undefined, 'looks, sport', 'hairband, hair band, Alice band'),
  W('bow', 'headwear', 'hair', '', 'over', false, undefined, 'bow', 'looks', 'hair bow, hair ribbon'),
  // Eyes, ears, face.
  W('glasses', 'eyewear', 'eyes', '', 'over', false, 'glasses', 'round', 'seeing', 'spectacles, eyeglasses, specs'),
  W('sunglasses', 'eyewear', 'eyes', '', 'over', false, 'sunglasses', 'sunglasses', 'sun', 'shades, dark glasses'),
  W('goggles', 'eyewear', 'eyes', '', 'over', false, 'goggles', undefined, 'swimming, safety', 'swimming goggles, safety goggles'),
  W('monocle', 'eyewear', 'eyes', '', 'over', false, undefined, 'monocle', 'seeing', ''),
  W('diving mask', 'eyewear', 'eyes', 'face', 'over', false, 'diving mask', undefined, 'swimming', 'snorkel mask'),
  W('mask', 'facewear', 'face', '', 'over', false, 'mask', undefined, 'party, safety', 'masks, face mask'),
  W('earrings', 'jewellery', 'ears', '', 'over', true, 'earrings', 'stud', 'looks', 'earring, ear rings'),
  W('ear muffs', 'headwear', 'ears', '', 'over', true, 'ear muffs', undefined, 'cold', 'earmuffs'),
  W('headphones', 'device', 'ears', 'head', 'over', true, 'headphones', undefined, 'listening', 'headphone, earphones, headset'),
  // Neck.
  W('scarf', 'neckwear', 'neck', '', 'over', false, 'scarf', undefined, 'cold', 'scarves, scarfs, muffler'),
  W('necklace', 'jewellery', 'neck', '', 'over', false, 'necklace', undefined, 'looks', 'necklaces, chain, pendant, beads'),
  W('tie', 'neckwear', 'neck', 'body', 'over', false, 'tie', undefined, 'work, looks', 'necktie, ties'),
  W('bow tie', 'neckwear', 'neck', '', 'over', false, 'bow tie', 'bow tie', 'party, looks', 'bowtie, dicky bow'),
  W('collar', 'neckwear', 'neck', '', 'main', false, 'collar', undefined, '', 'collars'),
  W('bib', 'neckwear', 'neck', 'body', 'over', false, 'bib', undefined, 'eating', 'bibs'),
  // Upper body.
  W('shirt', 'top', 'body', 'arms', 'main', false, 'shirt', 'shirt', '', 'shirts'),
  W('t-shirt', 'top', 'body', '', 'main', false, 't-shirt', 't-shirt', '', 'tee shirt, tee, T-shirt'),
  W('blouse', 'top', 'body', 'arms', 'main', false, 'blouse', undefined, '', 'blouses'),
  W('vest', 'underwear', 'body', '', 'under', false, 'vest', 'tank top', '', 'undershirt, tank top'),
  W('jumper', 'top', 'body', 'arms', 'over', false, 'jumper', undefined, 'cold', 'sweater, pullover, jersey, woolly'),
  W('sweatshirt', 'top', 'body', 'arms', 'over', false, 'sweatshirt', undefined, 'cold, sport', 'sweatshirts'),
  W('hoodie', 'top', 'body', 'arms', 'over', false, 'hooded top', 'hoodie', 'cold, sport', 'hooded top, hoody'),
  W('cardigan', 'top', 'body', 'arms', 'over', false, undefined, undefined, 'cold', 'cardigans'),
  W('waistcoat', 'top', 'body', '', 'over', false, 'waistcoat', undefined, 'looks', ''),
  W('jacket', 'coat', 'body', 'arms', 'over', false, 'jacket', undefined, 'cold', 'jackets, blazer'),
  W('coat', 'coat', 'body', 'arms, legs', 'over', false, 'coat', undefined, 'cold', 'coats, overcoat, winter coat'),
  W('raincoat', 'coat', 'body', 'arms, legs', 'over', false, 'raincoat', undefined, 'rain', 'mac, waterproof, anorak'),
  W('lab coat', 'coat', 'body', 'arms, legs', 'over', false, 'lab coat', 'lab coat', 'work', 'white coat'),
  W('apron', 'protective', 'body', 'legs', 'over', false, 'apron', 'apron', 'work, cooking', 'aprons, pinafore'),
  W('safety vest', 'protective', 'body', '', 'over', false, 'safety vest', 'safety vest', 'safety, work', 'high-visibility vest, hi-vis vest'),
  W('cape', 'coat', 'back', 'body', 'over', false, undefined, 'cape', 'looks', 'capes'),
  W('cloak', 'coat', 'back', 'body, arms, legs', 'over', false, undefined, 'cloak', 'cold, looks', 'cloaks'),
  W('backpack', 'bag', 'back', '', 'over', false, 'backpack', undefined, 'carrying', 'rucksack, school bag, knapsack'),
  W('brooch', 'jewellery', 'body', '', 'over', false, 'brooch', undefined, 'looks', 'badge, pin'),
  W('bra', 'underwear', 'body', '', 'under', false, 'bra', undefined, '', 'bras'),
  // Whole body.
  W('dress', 'whole', 'body', 'legs', 'main', false, 'dress', undefined, '', 'dresses, frock, gown'),
  W('suit', 'whole', 'body', 'arms, legs', 'main', false, 'suit', 'suit', 'work, looks', 'suits'),
  W('robe', 'whole', 'body', 'arms, legs', 'over', false, 'robe', 'robe', '', 'robes'),
  W('dressing gown', 'whole', 'body', 'arms, legs', 'over', false, 'dressing gown', undefined, 'sleep', 'bathrobe, housecoat'),
  W('pyjamas', 'whole', 'body', 'arms, legs', 'main', false, 'pyjamas', undefined, 'sleep', 'pajamas, pjs, nightclothes'),
  W('nightgown', 'whole', 'body', 'legs', 'main', false, 'nightgown', undefined, 'sleep', 'nightdress, nightie'),
  W('kimono', 'whole', 'body', 'arms, legs', 'main', false, 'kimono', undefined, '', 'kimonos'),
  W('sari', 'whole', 'body', 'legs', 'main', false, 'sari', undefined, '', 'saree'),
  W('overalls', 'whole', 'body', 'legs', 'over', false, undefined, 'overalls', 'work', 'dungarees, boiler suit'),
  W('tracksuit', 'whole', 'body', 'arms, legs', 'main', false, 'tracksuit', undefined, 'sport', 'track suit'),
  W('football kit', 'whole', 'body', 'legs', 'main', false, 'football kit', 'football shirt', 'sport', 'football shirt, football strip, soccer kit'),
  W('swimming costume', 'whole', 'body', '', 'main', false, 'swimming costume', undefined, 'swimming', 'swimsuit, bathing suit, one-piece swimsuit'),
  W('bikini', 'whole', 'body', '', 'main', false, 'bikini', undefined, 'swimming', 'bikinis'),
  W('space suit', 'whole', 'body', 'arms, legs, head, hands, feet', 'over', false, undefined, 'space suit', 'safety, work', 'spacesuit'),
  W('armor', 'protective', 'body', 'arms, legs', 'over', false, 'armor', undefined, 'safety', 'armour, suit of armour'),
  // Waist and legs.
  W('belt', 'accessory', 'waist', '', 'over', false, 'belt', undefined, '', 'belts'),
  W('trousers', 'bottom', 'legs', 'waist', 'main', true, 'trousers', undefined, '', 'pants, slacks'),
  W('jeans', 'bottom', 'legs', 'waist', 'main', true, 'jeans', undefined, '', 'denims'),
  W('shorts', 'bottom', 'legs', 'waist', 'main', true, 'shorts', undefined, 'sun, sport', 'short trousers'),
  W('skirt', 'bottom', 'legs', 'waist', 'main', false, 'skirt', undefined, '', 'skirts'),
  W('tights', 'underwear', 'legs', 'feet', 'under', true, 'tights', undefined, 'cold', 'pantyhose, stockings'),
  W('leg warmers', 'bottom', 'legs', '', 'over', true, 'leg warmers', undefined, 'cold, sport', ''),
  W('swimming trunks', 'bottom', 'legs', 'waist', 'main', false, 'swimming trunks', undefined, 'swimming', 'swim trunks, swim shorts, trunks'),
  W('underpants', 'underwear', 'waist', '', 'under', false, 'underwear', undefined, '', 'underwear, pants, knickers, briefs, boxer shorts, boxers'),
  W('nappy', 'underwear', 'waist', '', 'under', false, 'nappy', undefined, '', 'diaper, nappies'),
  // Feet.
  W('socks', 'footwear', 'feet', '', 'under', true, 'socks', undefined, '', 'sock'),
  W('shoes', 'footwear', 'feet', '', 'main', true, 'shoe', undefined, '', 'shoe'),
  W('boots', 'footwear', 'feet', '', 'main', true, 'boots', undefined, 'cold, rain', 'boot'),
  W('wellington boots', 'footwear', 'feet', '', 'main', true, 'wellington boots', undefined, 'rain', 'wellies, rubber boots, rain boots, gumboots'),
  W('hiking boots', 'footwear', 'feet', '', 'main', true, 'hiking boot', undefined, 'sport', 'walking boots, hiking boot'),
  W('sandals', 'footwear', 'feet', '', 'main', true, 'sandals', undefined, 'sun', 'sandal, flip-flops'),
  W('slippers', 'footwear', 'feet', '', 'main', true, 'slippers', undefined, 'home', 'slipper'),
  W('trainers', 'footwear', 'feet', '', 'main', true, 'trainers', undefined, 'sport', 'sneakers, sneaker, running shoes, running shoe, gym shoes'),
  W('high-heeled shoes', 'footwear', 'feet', '', 'main', true, 'high-heeled shoe', undefined, 'looks', 'high heels, heels, high-heeled shoe'),
  W('ballet shoes', 'footwear', 'feet', '', 'main', true, 'ballet shoes', undefined, 'dancing', 'ballet slippers'),
  W('ice skates', 'footwear', 'feet', '', 'main', true, 'ice skate', undefined, 'sport', 'ice skate, skates'),
  W('roller skates', 'footwear', 'feet', '', 'main', true, 'roller skate', undefined, 'sport', 'roller skate, rollerblades'),
  // Hands, wrists, fingers.
  W('gloves', 'handwear', 'hands', '', 'over', true, 'gloves', undefined, 'cold', 'glove'),
  W('mittens', 'handwear', 'hands', '', 'over', true, 'mittens', undefined, 'cold', 'mitten, mitts'),
  W('gardening gloves', 'handwear', 'hands', '', 'over', true, 'gardening gloves', undefined, 'work, safety', 'work gloves'),
  W('boxing gloves', 'handwear', 'hands', '', 'over', true, 'boxing glove', undefined, 'sport', 'boxing glove'),
  W('ring', 'jewellery', 'finger', '', 'over', false, 'ring', undefined, 'looks', 'rings, wedding ring'),
  W('bracelet', 'jewellery', 'wrist', '', 'over', false, 'bracelet', undefined, 'looks', 'bracelets, bangle'),
  W('watch', 'device', 'wrist', '', 'over', false, 'watch', undefined, 'telling the time', 'wristwatch, watches, smartwatch'),
];

// The k.faces slot that draws a wearable: by its kind, or the slot of its place.
const FACE_SLOT = (w) => (w.kind === 'headwear' ? 'hat' : w.kind === 'eyewear' ? 'glasses' : w.name === 'earrings' ? 'earrings' : 'shoulders');

export function wearableShards() {
  const places = PLACES.map(([name, about, slot, part, [x, y, w, h], pair]) => wire(`k.wearables.place.${seg(name)}`, 'k.wearables.place', [['name', name], ['about', text(about)], ['face_slot', slot], ['body_part', part],
    ['x', x], ['y', y], ['w', w], ['h', h], ['pair', pair ? 'true' : undefined], ['named', 'model']], SRC));
  const placeWords = PLACES.map((p) => wire(`k.wearables.word.place.${seg(p[0])}`, 'core.word', [...list(p[6]).map((t) => ['text', t]), ['means', p[0]], ['of', 'k.wearables.place.name']], SRC));
  const lines = WEARABLES.map((w) => wire(`k.wearables.wearable.${seg(w.name)}`, 'k.wearables.wearable', [['name', w.name], ['kind', w.kind], ['worn_on', w.on], ...w.covers.map((c) => ['covers', c]), ['layer', w.layer],
    ['pair', w.pair ? 'true' : undefined], ['drawing', w.drawing], ['face_slot', w.face ? FACE_SLOT(w) : undefined], ['face', w.face], ...w.wornFor.map((f) => ['worn_for', f])], SRC));
  const words = WEARABLES.filter((w) => w.words.length).map((w) => wire(`k.wearables.word.wearable.${seg(w.name)}`, 'core.word', [...w.words.map((t) => ['text', t]), ['means', w.name], ['of', 'k.wearables.wearable.name']], SRC));
  const head = (id, about) => header({ id: `k.wearables/shards/${id}`, about, sources: ['hand-core 1 (hand-written in this repository: tools/wearables-core.mjs)'], license: 'CC0-1.0', script: 'tools/wearables-core.mjs' });
  return {
    'places.sop': `${head('places', `the ${PLACES.length} places on the body where things are worn (${PLACES.map((p) => p[0]).join(', ')}): the box of each on the drawing "person" of k.objects, the k.faces slot that draws what is worn there, and the k.body part.`)}\n${places.join('\n')}\n\n# Words.\n${placeWords.join('\n')}\n`,
    'wearables.sop': `${head('wearables', `${WEARABLES.length} things people wear: where each is worn, what else it covers, its layer, whether it is a pair, its drawing in k.objects, its variant in k.faces, what it is worn for; and other words for them.`)}\n${lines.join('\n')}\n\n# Words.\n${words.join('\n')}\n`,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeShards(join(WORLDS_DIR, 'k.wearables', 'shards'), wearableShards());
  console.log(`${PLACES.length} places, ${WEARABLES.length} wearables`);
}

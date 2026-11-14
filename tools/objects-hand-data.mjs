// The drawings of tools/objects-hand.mjs: shard -> [name, words, parts]. One line a part:
//   <name> <shape> <x y w h | points x,y ...> | <z> <colours> [key=value ...]
// Hand-written in this repository (hand-core 1, CC0-1.0). Round 11 item 3.

// Lines made by a rule: n lines from f(i), i = 0 .. n-1.
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');

// A closed star of n points around cx, cy: radii r1 (inner) and r2 (outer), a gear or a burr.
const star = (cx, cy, r1, r2, n) => Array.from({ length: 2 * n }, (_, i) => {
  const a = (Math.PI * i) / n - Math.PI / 2, r = i % 2 ? r1 : r2;
  return `${Math.round((cx + r * Math.cos(a)) * 10) / 10},${Math.round((cy + r * Math.sin(a)) * 10) / 10}`;
}).join(' ');

// A band along a centre line (points [x, y], a width at each point): the closed polygon of its two edges. Round 12:
// the eel's body and its fin.
const r1 = (n) => Math.round(n * 10) / 10;
const ribbon = (line, widths) => {
  const left = [], right = [];
  line.forEach(([x, y], i) => {
    const [px, py] = line[Math.max(0, i - 1)], [nx, ny] = line[Math.min(line.length - 1, i + 1)];
    const len = Math.hypot(nx - px, ny - py) || 1, ox = (-(ny - py) / len) * widths[i] / 2, oy = ((nx - px) / len) * widths[i] / 2;
    left.push(`${r1(x + ox)},${r1(y + oy)}`); right.unshift(`${r1(x - ox)},${r1(y - oy)}`);
  });
  return [...left, ...right].join(' ');
};
const EEL = [[90, 36], [80, 40], [70, 48], [58, 58], [46, 62], [34, 58], [24, 50], [14, 48], [6, 54]];

// The spokes of a wheel at cx, cy of radius r: four lines through the hub (eight spokes).
const spokes = (cx, cy, r, name) => rep(4, (i) => { const a = (Math.PI * i) / 4; return `${name}_${i + 1} line ${r1(cx + r * Math.cos(a))},${r1(cy + r * Math.sin(a))} ${r1(cx - r * Math.cos(a))},${r1(cy - r * Math.sin(a))} | 5 black kind=spoke`; });

// A four-legged animal seen from the side, facing right; what differs is said by the options.
function quad({ c, c2 = c, ears = 'pointed', tail = 'long', tailColour = c, leg = 34, extra = '' }) {
  const legY = 56, legH = Math.min(leg, 100 - legY);
  const tails = {
    long: `tail line 22,46 10,54 6,40 | 1 ${tailColour}`,
    bushy: `tail polygon 22,44 6,42 2,56 10,60 | 1 ${tailColour}`,
  };
  const earLine = ears === 'pointed' ? `ear triangle 72 14 8 12 | 2 ${c} pointing=up above=head` : `ear circle 72 20 8 8 | 2 ${c} above=head`;
  return `
    ${tails[tail]}
    back_leg_1 rectangle 26 ${legY} 6 ${legH} | 1 ${c} kind=leg
    back_leg_2 rectangle 34 ${legY} 6 ${legH} | 1 ${c} kind=leg
    front_leg_1 rectangle 62 ${legY} 6 ${legH} | 1 ${c} kind=leg
    front_leg_2 rectangle 70 ${legY} 6 ${legH} | 1 ${c} kind=leg
    body oval 20 38 58 26 | 2 ${c}
    ${earLine}
    head circle 68 24 20 20 | 3 ${c}
    snout oval 82 32 13 10 | 4 ${c2} right_of=head
    nose circle 92 33 4 4 | 5 black
    eye circle 76 29 3 3 | 5 black inside=head
    ${extra}`;
}

export const objectsData = {
  'animals-2': [
    ['crane bird', [], `
      left_leg rectangle 44 62 2 32 | 1 black kind=leg
      right_leg rectangle 52 62 2 32 | 1 black kind=leg
      left_foot line 40,94 50,94 | 2 black kind=foot
      right_foot line 48,94 58,94 | 2 black kind=foot
      tail polygon 18,34 34,32 36,50 20,52 | 1 black
      body oval 26 30 40 26 | 2 grey white
      neck polygon 58,36 63,12 68,12 66,38 | 3 grey
      head circle 61 4 10 10 | 4 black grey above=neck
      crown circle 64 4 4 4 | 5 red inside=head
      cheek oval 62 9 6 4 | 5 white inside=head
      beak triangle 70 7 16 4 | 4 yellow grey pointing=right right_of=head
      eye circle 66 7 2 2 | 6 black inside=head`],
    ['kiwi bird', [], `
      left_leg line 38,74 36,88 | 1 yellow kind=leg
      right_leg line 52,74 54,88 | 1 yellow kind=leg
      left_foot line 30,88 42,88 | 1 yellow kind=foot
      right_foot line 48,88 60,88 | 1 yellow kind=foot
      body oval 18 30 56 46 | 2 brown
      head circle 62 28 18 18 | 3 brown
      beak polygon 78,38 97,62 95,64 76,41 | 4 yellow
      eye circle 70 33 3 3 | 4 black inside=head
      streak_1 line 30,44 36,50 | 3 black kind=streak
      streak_2 line 44,40 50,46 | 3 black kind=streak
      streak_3 line 36,58 42,64 | 3 black kind=streak`],
    ['tuna fish', [], `
      tail polygon 84,50 98,30 94,50 98,70 | 1 blue
      dorsal_fin triangle 44 22 12 12 | 1 blue pointing=up
      belly_fin triangle 48 62 10 10 | 1 blue pointing=down
      finlet_1 triangle 64 31 4 5 | 1 yellow pointing=up kind=finlet
      finlet_2 triangle 69 33 4 5 | 1 yellow pointing=up kind=finlet
      finlet_3 triangle 74 36 4 5 | 1 yellow pointing=up kind=finlet
      finlet_4 triangle 64 61 4 5 | 1 yellow pointing=down kind=finlet
      finlet_5 triangle 69 59 4 5 | 1 yellow pointing=down kind=finlet
      finlet_6 triangle 74 56 4 5 | 1 yellow pointing=down kind=finlet
      body polygon 8,50 22,38 50,32 74,38 86,50 74,60 50,66 22,62 | 2 blue grey
      belly polygon 14,54 30,58 50,62 72,58 82,52 50,56 | 3 white
      pectoral_fin polygon 30,48 44,52 32,54 | 4 blue
      eye circle 16 44 5 5 | 4 white
      pupil circle 17.5 45.5 2 2 | 5 black inside=eye
      mouth line 8,52 14,52 | 4 black`],
    ['eel', ['eels'], `
      fin polygon ${ribbon(EEL.slice(1).map(([x, y]) => [x, y - 5]), [3, 7, 7, 7, 7, 7, 6, 3])} | 1 green
      body polygon ${ribbon(EEL, [14, 13, 12, 11, 10, 9, 7, 5, 2])} | 2 green
      head oval 78 29 18 14 | 3 green
      side_fin oval 69 43 6 10 | 4 green
      eye circle 86 31 4 4 | 4 white
      pupil circle 87 32 2 2 | 5 black inside=eye
      mouth line 95,38 88,39 82,37 | 5 black`],
    ['jaguar', ['jaguars'], quad({ c: 'yellow', c2: 'yellow', ears: 'round', extra: `
      spot_1 circle 30 44 4 4 | 3 black kind=spot inside=body
      spot_2 circle 40 41 4 4 | 3 black kind=spot inside=body
      spot_3 circle 50 44 4 4 | 3 black kind=spot inside=body
      spot_4 circle 60 41 4 4 | 3 black kind=spot inside=body
      spot_5 circle 35 52 4 4 | 3 black kind=spot inside=body
      spot_6 circle 46 54 4 4 | 3 black kind=spot inside=body
      spot_7 circle 57 51 4 4 | 3 black kind=spot inside=body` })],
    ['cougar', ['cougars', 'mountain lion', 'mountain lions'], `
      tail polygon ${ribbon([[22, 46], [14, 52], [9, 62], [8, 74], [10, 82], [14, 86]], [6, 6, 5, 5, 5, 5])} | 1 orange
      tail_tip oval 10 82 9 7 | 2 black
      neck polygon 64,44 74,28 88,32 80,56 | 1 orange
      back_leg_1 rectangle 24 54 7 34 | 1 orange kind=leg
      back_leg_2 rectangle 33 56 7 32 | 1 orange kind=leg
      front_leg_1 rectangle 62 56 7 32 | 1 orange kind=leg
      front_leg_2 rectangle 70 54 7 34 | 1 orange kind=leg
      paw_1 oval 23 86 10 5 | 2 orange kind=paw
      paw_2 oval 32 86 10 5 | 2 orange kind=paw
      paw_3 oval 61 86 10 5 | 2 orange kind=paw
      paw_4 oval 69 86 10 5 | 2 orange kind=paw
      body oval 16 38 64 24 | 2 orange
      left_ear triangle 74 15 7 9 | 3 orange pointing=up above=head kind=ear
      right_ear triangle 83 14 7 9 | 3 orange pointing=up above=head kind=ear
      head oval 72 19 22 19 | 4 orange
      muzzle oval 84 28 12 10 | 5 white right_of=head
      nose triangle 92 28 5 4 | 6 pink pointing=down
      eye oval 81 23 4 3 | 6 black inside=head
      mouth line 90,35 95,34 | 6 black`],
    ['dingo', ['dingoes', 'dingos'], quad({ c: 'orange', c2: 'white', ears: 'pointed', tail: 'bushy', extra: `
      chest oval 70 44 10 14 | 3 white` })],
    ['jackal', ['jackals'], quad({ c: 'brown', c2: 'brown', ears: 'pointed', tail: 'bushy', extra: `
      saddle polygon 28,40 62,38 58,48 32,48 | 3 black grey inside=body
      tail_tip polygon 2,54 6,52 10,60 4,58 | 2 black` })],
    ['possum', ['possums', 'opossum', 'opossums'], quad({ c: 'grey', c2: 'white', ears: 'round', tailColour: 'pink', leg: 18, extra: `
      face circle 72 28 14 14 | 4 white inside=head
      nose_tip circle 92 33 4 4 | 6 pink` })],
    ['alligator', ['alligators', 'gator', 'gators'], `
      tail polygon 4,56 30,50 30,62 | 1 green
      back_leg rectangle 32 62 6 10 | 1 green kind=leg
      front_leg rectangle 56 62 6 10 | 1 green kind=leg
      ridge_1 triangle 34 43 5 5 | 1 green pointing=up kind=ridge
      ridge_2 triangle 42 43 5 5 | 1 green pointing=up kind=ridge
      ridge_3 triangle 50 42 5 5 | 1 green pointing=up kind=ridge
      ridge_4 triangle 58 41 5 5 | 1 green pointing=up kind=ridge
      body polygon 26,48 66,46 70,56 66,64 26,64 | 2 green
      head polygon 64,48 84,50 98,54 98,58 84,60 64,62 | 3 green
      eye circle 70 44 5 5 | 4 yellow
      pupil circle 71.5 45.5 2 2 | 5 black inside=eye
      mouth line 70,57 98,56 | 4 black
      tooth_1 triangle 78 56.5 3 3 | 5 white pointing=down kind=tooth
      tooth_2 triangle 85 56.3 3 3 | 5 white pointing=down kind=tooth
      tooth_3 triangle 92 56 3 3 | 5 white pointing=down kind=tooth`],
    ['newt', ['newts'], `
      tail polygon 32,50 4,44 6,48 32,58 | 1 brown
      front_leg_1 line 56,58 60,68 64,68 | 1 brown kind=leg
      front_leg_2 line 52,58 50,68 46,68 | 1 brown kind=leg
      back_leg_1 line 40,58 42,68 46,68 | 1 brown kind=leg
      back_leg_2 line 36,58 32,68 28,68 | 1 brown kind=leg
      body oval 30 46 36 14 | 2 brown orange
      belly polygon 34,56 62,56 58,60 38,60 | 3 orange
      head oval 62 44 18 12 | 3 brown
      eye circle 72 46 3 3 | 4 black inside=head
      spot_1 circle 40 49 2 2 | 4 black kind=spot
      spot_2 circle 48 48 2 2 | 4 black kind=spot
      spot_3 circle 56 50 2 2 | 4 black kind=spot`],
    ['flea', ['fleas'], `
      back_leg line 34,64 22,80 36,92 | 1 brown kind=leg
      middle_leg line 46,68 44,84 50,92 | 1 brown kind=leg
      front_leg line 60,66 66,82 72,90 | 1 brown kind=leg
      body oval 22 30 50 40 | 2 brown
      band_1 line 40,32 38,68 | 3 black kind=band
      band_2 line 52,31 52,69 | 3 black kind=band
      head circle 66 34 16 16 | 3 brown
      eye circle 74 38 3 3 | 4 black inside=head
      mouthparts line 80,46 86,56 | 4 brown
      antenna line 74,34 80,26 | 4 brown`],
    ['grasshopper', ['grasshoppers'], `
      front_leg line 72,54 76,70 | 1 green kind=leg
      middle_leg line 64,55 64,72 | 1 green kind=leg
      body polygon 22,46 70,40 78,48 70,56 22,56 | 2 green
      wing polygon 30,42 66,38 64,46 28,48 | 3 green brown
      head oval 72 38 16 18 | 3 green
      eye circle 78 41 5 5 | 4 brown inside=head
      antenna_1 line 80,38 90,14 | 4 green kind=antenna
      antenna_2 line 78,38 84,12 | 4 green kind=antenna
      hind_thigh polygon 40,52 64,30 68,32 46,56 | 4 green
      hind_shin line 66,31 46,76 | 4 green`],
    ['mantis', ['mantises', 'praying mantis', 'praying mantises'], `
      middle_leg line 52,60 46,80 | 1 green kind=leg
      back_leg_1 line 40,64 30,84 | 1 green kind=leg
      back_leg_2 line 30,64 18,82 | 1 green kind=leg
      abdomen oval 14 52 44 16 | 2 green
      wing polygon 20,52 54,54 48,60 18,62 | 3 green
      thorax polygon 52,56 70,26 74,28 58,60 | 3 green
      head triangle 66 14 16 14 | 4 green pointing=down
      left_eye circle 65 13 4 4 | 5 brown kind=eye
      right_eye circle 79 13 4 4 | 5 brown kind=eye
      front_leg line 68,32 84,42 78,24 | 4 green
      antenna line 72,14 86,4 | 5 green`],
    ['leech', ['leeches'], `
      back_sucker circle 8 44 14 14 | 1 brown
      body oval 12 40 76 22 | 2 brown black
      stripe line 16,51 84,51 | 3 orange
      band_1 line 26,42 26,60 | 3 black kind=band
      band_2 line 38,40 38,62 | 3 black kind=band
      band_3 line 50,40 50,62 | 3 black kind=band
      band_4 line 62,40 62,62 | 3 black kind=band
      band_5 line 74,42 74,60 | 3 black kind=band
      front_sucker circle 80 46 10 10 | 3 brown`],
    ['clam', ['clams'], `
      hinge oval 44 16 12 8 | 0 brown
      shell polygon 8,64 12,48 22,34 36,24 50,20 64,24 78,34 88,48 92,64 84,76 68,82 50,84 32,82 16,76 | 1 white
      growth_1 arc 12 60 76 14 | 2 brown opens=up kind=growth_line
      growth_2 arc 18 50 64 13 | 2 brown opens=up kind=growth_line
      growth_3 arc 25 40 50 12 | 2 brown opens=up kind=growth_line
      growth_4 arc 33 31 34 10 | 2 brown opens=up kind=growth_line
      growth_5 arc 41 24 18 7 | 2 brown opens=up kind=growth_line
      gap line 10,68 30,74 50,76 70,74 90,68 | 3 grey`],
  ],
  plants: [
    ['fern', ['ferns'], `
      stem line 50,96 50,60 54,30 60,10 | 1 green
      leaflet_1 oval 34 79 16 6 | 2 green kind=leaflet
      leaflet_2 oval 50 79 16 6 | 2 green kind=leaflet
      leaflet_3 oval 36 67 15 6 | 2 green kind=leaflet
      leaflet_4 oval 50 67 15 6 | 2 green kind=leaflet
      leaflet_5 oval 38 55 14 5 | 2 green kind=leaflet
      leaflet_6 oval 51 55 14 5 | 2 green kind=leaflet
      leaflet_7 oval 41 43 12 5 | 2 green kind=leaflet
      leaflet_8 oval 53 43 12 5 | 2 green kind=leaflet
      leaflet_9 oval 44 31 10 4 | 2 green kind=leaflet
      leaflet_10 oval 55 31 10 4 | 2 green kind=leaflet
      leaflet_11 oval 49 20 8 4 | 2 green kind=leaflet
      leaflet_12 oval 58 20 8 4 | 2 green kind=leaflet
      tip oval 57 8 6 5 | 2 green`],
    ['seaweed', ['seaweeds', 'kelp'], `
      rock oval 30 84 40 14 | 1 grey
      frond_1 polygon 40,88 36,70 42,54 36,36 42,18 46,20 40,36 46,54 40,70 44,88 | 2 green kind=frond
      frond_2 polygon 50,88 56,66 50,46 58,26 54,8 58,8 62,26 54,46 60,66 54,88 | 2 green kind=frond
      frond_3 polygon 58,88 64,74 60,60 68,44 72,44 64,60 68,74 62,88 | 2 brown kind=frond
      bubble_1 circle 72 20 4 4 | 3 blue kind=bubble
      bubble_2 circle 78 30 3 3 | 3 blue kind=bubble`],
    ['stump', ['stumps', 'tree stump', 'tree stumps'], `
      ground rectangle 0 86 100 14 | 0 green
      root_left polygon 32,74 16,88 34,86 | 1 brown
      root_right polygon 68,74 84,88 66,86 | 1 brown
      trunk rectangle 30 50 40 36 | 2 brown
      bark_1 line 40,60 40,80 | 3 black kind=bark
      bark_2 line 52,58 52,82 | 3 black kind=bark
      bark_3 line 62,60 62,80 | 3 black kind=bark
      top oval 30 44 40 12 | 3 yellow brown
      ring_1 oval 38 46.5 24 7 | 4 brown kind=ring
      ring_2 oval 45 48.5 10 3 | 5 yellow kind=ring`],
  ],
  'land-3': [
    ['iceberg', ['icebergs'], `
      under_ice polygon 26,50 74,50 86,72 64,94 34,92 16,70 | 1 white
      top polygon 30,50 36,30 46,34 54,14 62,30 70,26 74,50 | 2 white
      shade polygon 54,14 62,30 70,26 74,50 60,50 | 3 grey
      waterline line 4,50 96,50 | 4 blue`],
    ['glacier', ['glaciers'], `
      ground_left polygon 0,70 36,62 20,100 0,100 | 0 brown
      ground_right polygon 100,70 66,62 80,100 100,100 | 0 brown
      mountain_left polygon 0,70 22,14 46,70 | 1 grey
      mountain_right polygon 54,70 80,10 100,60 100,70 | 1 grey
      snow_left polygon 16,28 22,14 28,28 | 2 white
      snow_right polygon 74,24 80,10 86,24 | 2 white
      ice polygon 30,30 70,24 66,62 80,100 20,100 36,62 | 3 white blue
      crevasse_1 line 40,74 48,76 | 4 blue kind=crevasse
      crevasse_2 line 52,84 62,86 | 4 blue kind=crevasse
      crevasse_3 line 44,92 56,94 | 4 blue kind=crevasse`],
    ['crater', ['craters'], `
      mountain polygon 4,96 36,40 64,40 96,96 | 1 brown
      ridge_1 line 40,46 28,84 | 2 black kind=ridge
      ridge_2 line 60,46 72,84 | 2 black kind=ridge
      crater oval 34 34 32 12 | 3 grey black
      lava oval 42 37 16 6 | 4 red orange inside=crater`],
    ['plateau', ['plateaus', 'plateaux', 'tableland'], `
      ground rectangle 0 80 100 20 | 0 green
      plateau polygon 10,40 90,40 98,80 2,80 | 1 brown
      top rectangle 10 36 80 6 | 2 green
      crack_1 line 20,46 16,76 | 3 black kind=crack
      crack_2 line 34,46 32,78 | 3 black kind=crack
      crack_3 line 66,46 68,78 | 3 black kind=crack
      crack_4 line 80,46 84,76 | 3 black kind=crack`],
  ],
  'places-3': [
    ['dungeon', ['dungeons', 'donjon'], `
      ground rectangle 0 88 100 12 | 0 green
      pole line 50,2 50,16 | 1 black
      flag triangle 51 2 12 7 | 2 red pointing=right
      merlon_1 rectangle 30 16 8 8 | 1 grey kind=merlon
      merlon_2 rectangle 41 16 8 8 | 1 grey kind=merlon
      merlon_3 rectangle 52 16 8 8 | 1 grey kind=merlon
      merlon_4 rectangle 62 16 8 8 | 1 grey kind=merlon
      tower rectangle 30 24 40 64 | 2 grey
      window_1 rectangle 38 36 5 10 | 3 black kind=window
      window_2 rectangle 57 36 5 10 | 3 black kind=window
      window_3 rectangle 47 52 6 10 | 3 black kind=window
      door rectangle 44 72 12 16 | 3 brown`],
    ['curb', ['curbs', 'kerb', 'kerbs', 'curbstone'], `
      road rectangle 0 62 100 38 | 0 black
      mark_1 rectangle 8 80 18 3 | 1 white kind=mark
      mark_2 rectangle 41 80 18 3 | 1 white kind=mark
      mark_3 rectangle 74 80 18 3 | 1 white kind=mark
      sidewalk rectangle 0 30 100 24 | 1 grey
      curb rectangle 0 54 100 8 | 2 white
      joint_1 line 20,54 20,62 | 3 black kind=joint
      joint_2 line 40,54 40,62 | 3 black kind=joint
      joint_3 line 60,54 60,62 | 3 black kind=joint
      joint_4 line 80,54 80,62 | 3 black kind=joint`],
    ['capitol', ['capitols', 'statehouse'], `
      dome oval 36 14 28 28 | 1 white
      lantern rectangle 47 7 6 8 | 1 white
      drum rectangle 38 30 24 14 | 2 white
      pediment triangle 30 44 40 12 | 3 white pointing=up
      base rectangle 14 56 72 28 | 2 white
${rep(6, (i) => `      column_${i + 1} rectangle ${18 + i * 12} 58 4 24 | 3 grey kind=column`)}
      steps rectangle 10 84 80 8 | 1 white`],
    ['greenhouse', ['greenhouses', 'glasshouse', 'hothouse'], `
      ground rectangle 0 86 100 14 | 0 green
      house polygon 14,86 14,46 50,20 86,46 86,86 | 1 white
      plant_1 oval 18 68 12 18 | 2 green kind=plant
      plant_2 oval 36 72 10 14 | 2 green kind=plant
      plant_3 oval 70 68 12 18 | 2 green kind=plant
      door rectangle 44 64 12 22 | 2 white
      frame_1 line 32,86 32,33 | 3 grey kind=frame
      frame_2 line 50,86 50,20 | 3 grey kind=frame
      frame_3 line 68,86 68,33 | 3 grey kind=frame
      frame_4 line 14,60 86,60 | 3 grey kind=frame
      roof line 14,46 50,20 86,46 | 3 grey`],
    ['observatory', ['observatories'], `
      ground rectangle 0 86 100 14 | 0 green
      star_1 circle 10 10 3 3 | 0 yellow kind=star
      star_2 circle 84 8 3 3 | 0 yellow kind=star
      star_3 circle 90 30 3 3 | 0 yellow kind=star
      dome oval 22 26 56 52 | 0 white
      slit polygon 46,28 54,28 54,52 46,52 | 1 black
      telescope polygon 50,40 70,18 74,22 54,44 | 1 grey
      building rectangle 22 52 56 34 | 2 white
      door rectangle 44 68 12 18 | 3 brown
      window_1 circle 30 60 8 8 | 3 blue kind=window
      window_2 circle 62 60 8 8 | 3 blue kind=window`],
    ['billboard', ['billboards'], `
      post_1 rectangle 26 60 6 36 | 0 grey kind=post
      post_2 rectangle 68 60 6 36 | 0 grey kind=post
      board rectangle 6 14 88 48 | 1 white
      picture circle 12 22 24 24 | 2 red
      text_1 line 42,26 86,26 | 2 black kind=text_line
      text_2 line 42,36 80,36 | 2 black kind=text_line
      text_3 line 42,46 84,46 | 2 black kind=text_line
      walkway rectangle 6 62 88 3 | 1 grey`],
  ],
  'food-3': [
    ['raspberry', ['raspberries'], `
      stem line 50,32 50,8 | 1 green
      leaf polygon 50,16 68,6 82,14 66,22 | 1 green
      berry oval 32 34 36 40 | 2 red
      drupelet_1 circle 36 40 9 9 | 3 red kind=drupelet
      drupelet_2 circle 46 38 9 9 | 3 red kind=drupelet
      drupelet_3 circle 56 40 9 9 | 3 red kind=drupelet
      drupelet_4 circle 35 51 9 9 | 3 red kind=drupelet
      drupelet_5 circle 46 50 9 9 | 3 red kind=drupelet
      drupelet_6 circle 57 51 9 9 | 3 red kind=drupelet
      drupelet_7 circle 39 62 9 9 | 3 red kind=drupelet
      drupelet_8 circle 52 62 9 9 | 3 red kind=drupelet
      calyx polygon 36,36 44,28 50,33 56,28 64,36 50,39 | 4 green`],
    ['caviar', ['caviare', 'roe'], `
      lid oval 26 16 56 22 | 0 blue
      tin_bottom oval 16 62 68 14 | 1 grey
      tin_side rectangle 16 52 68 17 | 2 grey
      tin_top oval 16 45 68 14 | 3 grey
      caviar oval 20 47 60 10 | 4 black
${rep(6, (i) => `      egg_${i + 1} circle ${28 + i * 7} ${i % 2 ? 50 : 52} 2.5 2.5 | 5 grey kind=egg`)}`],
    ['tonic', ['tonics', 'tonic water'], `
      glass polygon 30,20 70,20 66,90 34,90 | 1 white
      tonic polygon 31.5,34 68.5,34 66,88 34,88 | 2 blue
      straw line 40,6 44,70 | 3 red
      ice_1 square 37 38 12 12 | 3 white kind=ice
      ice_2 square 52 44 12 12 | 3 white kind=ice
${rep(4, (i) => `      bubble_${i + 1} circle ${38 + i * 6} ${80 - i * 7} 3 3 | 3 white kind=bubble`)}
      lime circle 56 8 24 24 | 4 green
      lime_flesh circle 59 11 18 18 | 5 yellow green inside=lime`],
    ['salsa', ['salsas'], `
      rim oval 14 42 72 16 | 1 white
      salsa oval 17 44 66 12 | 2 red
      bit_1 circle 30 45 4 4 | 3 green kind=bit
      bit_2 circle 44 47 3 3 | 3 white kind=bit
      bit_3 circle 58 45 4 4 | 3 green kind=bit
      bit_4 circle 68 47 3 3 | 3 white kind=bit
      chip_1 triangle 56 26 16 22 | 3 yellow pointing=up kind=chip
      chip_2 triangle 32 30 14 18 | 3 yellow pointing=up kind=chip
      bowl polygon 14,50 86,50 74,80 26,80 | 4 white`],
    ['cinnamon', ['cinnamon stick', 'cinnamon sticks'], `
      stick_1 rectangle 14 34 70 12 | 1 brown kind=stick
      stick_2 rectangle 10 46 70 12 | 1 brown kind=stick
      stick_3 rectangle 18 58 70 12 | 1 brown kind=stick
      end_1 oval 80 34 8 12 | 2 orange kind=end
      end_2 oval 76 46 8 12 | 2 orange kind=end
      end_3 oval 84 58 8 12 | 2 orange kind=end
      curl_1 arc 81 37 4 6 | 3 brown opens=left kind=curl
      curl_2 arc 77 49 4 6 | 3 brown opens=left kind=curl
      curl_3 arc 85 61 4 6 | 3 brown opens=left kind=curl
      twine rectangle 42 30 6 44 | 4 red`],
    ['tofu', ['bean curd'], `
      plate oval 6 60 88 30 | 1 blue
      front rectangle 26 46 40 30 | 2 white
      top polygon 26,46 38,36 78,36 66,46 | 3 white
      side polygon 66,46 78,36 78,66 66,76 | 3 grey
      chopstick_1 line 50,20 94,52 | 4 brown kind=chopstick
      chopstick_2 line 56,16 96,46 | 4 brown kind=chopstick`],
    ['risotto', ['risottos'], `
      plate oval 6 46 88 40 | 1 white
      risotto oval 18 50 64 28 | 2 yellow
${rep(6, (i) => `      grain_${i + 1} oval ${26 + (i % 3) * 16} ${56 + Math.floor(i / 3) * 10} 6 3 | 3 white kind=grain`)}
      pea_1 circle 34 60 5 5 | 3 green kind=pea
      pea_2 circle 58 54 5 5 | 3 green kind=pea
      pea_3 circle 64 68 5 5 | 3 green kind=pea
      mushroom_1 polygon 42,62 50,60 52,66 44,68 | 3 brown kind=mushroom
      mushroom_2 polygon 26,64 32,62 34,68 28,70 | 3 brown kind=mushroom`],
    ['trifle', ['trifles'], `
      base rectangle 32 84 36 6 | 1 white
      foot rectangle 42 80 16 4 | 1 white
      bowl polygon 20,30 80,30 72,80 28,80 | 1 white
      sponge polygon 25.8,66 74.2,66 72.3,78 27.7,78 | 2 brown
      jelly polygon 23.8,54 76.2,54 74.2,66 25.8,66 | 2 red
      custard polygon 21.9,42 78.1,42 76.2,54 23.8,54 | 2 yellow
      cream polygon 20.6,34 79.4,34 78.1,42 21.9,42 | 2 white
      cream_top oval 26 24 48 14 | 3 white
      cherry circle 46 16 8 8 | 4 red`],
    ['meatball', [], `
      plate oval 6 50 88 36 | 1 white
      sauce oval 18 54 64 26 | 2 red
      meatball_3 circle 38 38 20 20 | 3 brown kind=meatball
      meatball_1 circle 22 48 22 22 | 4 brown kind=meatball
      meatball_2 circle 48 50 22 22 | 4 brown kind=meatball
      parsley_1 circle 30 52 3 3 | 5 green kind=parsley
      parsley_2 circle 58 54 3 3 | 5 green kind=parsley
      parsley_3 circle 46 42 3 3 | 5 green kind=parsley`],
    ['cider', ['ciders'], `
      handle arc 56 40 16 30 | 0 grey opens=left
      glass polygon 22,28 62,28 60,88 24,88 | 1 white
      cider polygon 23,36 61,36 60,86 24,86 | 2 yellow
${rep(3, (i) => `      bubble_${i + 1} circle ${32 + i * 10} ${74 - i * 12} 3 3 | 3 white kind=bubble`)}
      apple circle 66 62 26 26 | 3 red
      stem line 79,63 80,56 | 4 brown
      leaf polygon 80,57 88,51 89,57 | 4 green`],
    ['grinder', ['grinders', 'submarine sandwich', 'hoagie'], `
      bottom_bun polygon 6,60 94,60 90,72 10,72 | 1 brown
      lettuce polygon 6,58 14,54 22,60 30,54 38,60 46,54 54,60 62,54 70,60 78,54 86,60 94,56 94,62 6,62 | 2 green
      tomato_1 oval 14 50 20 6 | 3 red kind=tomato
      tomato_2 oval 40 50 20 6 | 3 red kind=tomato
      tomato_3 oval 66 50 20 6 | 3 red kind=tomato
      meat rectangle 8 46 84 6 | 3 pink
      cheese_1 triangle 12 44 14 10 | 4 yellow pointing=down kind=cheese
      cheese_2 triangle 46 44 14 10 | 4 yellow pointing=down kind=cheese
      cheese_3 triangle 74 44 14 10 | 4 yellow pointing=down kind=cheese
      top_bun polygon 4,46 10,30 30,24 70,24 90,30 96,46 | 5 brown
      seed_1 oval 30 30 4 2 | 6 white kind=seed
      seed_2 oval 50 28 4 2 | 6 white kind=seed
      seed_3 oval 70 31 4 2 | 6 white kind=seed`],
    ['cheesecake', ['cheesecakes'], `
      crust polygon 12,72 90,64 90,72 12,80 | 1 brown
      filling polygon 12,52 90,42 90,64 12,72 | 1 white
      top polygon 12,52 66,28 90,42 | 2 white
      sauce polygon 44,40 66,28 90,42 90,50 86,48 84,56 80,46 72,48 70,54 66,46 56,48 | 3 red
      strawberry oval 64 22 14 12 | 4 red on=top
      leaf triangle 67 18 8 6 | 5 green pointing=up above=strawberry`],
    ['schnapps', ['schnaps'], `
      bottle rectangle 20 40 24 52 | 1 white
      shoulder polygon 20,40 26,28 38,28 44,40 | 1 white
      neck rectangle 27 12 10 16 | 1 white
      cap rectangle 26 6 12 8 | 2 red
      liquid rectangle 21 50 22 41 | 2 yellow
      label rectangle 22 58 20 16 | 3 red
      label_line line 25,66 39,66 | 4 white
      shot_glass polygon 58,70 80,70 78,92 60,92 | 1 white
      shot polygon 59,76 79,76 78,91 60,91 | 2 yellow`],
  ],
  'vehicles-2': [
    ['destroyer', ['destroyers', 'warship'], `
      mast line 50,40 50,16 | 1 black
      yard line 44,24 56,24 | 1 black
      bridge rectangle 40 40 18 16 | 2 grey
      funnel rectangle 62 42 8 14 | 2 grey
      turret_1 rectangle 20 50 10 6 | 2 grey kind=turret
      turret_2 rectangle 74 50 10 6 | 2 grey kind=turret
      barrel_1 line 20,52 10,50 | 2 black kind=barrel
      barrel_2 line 84,52 94,50 | 2 black kind=barrel
      hull polygon 4,56 96,56 88,74 10,74 | 3 grey
      windows line 42,46 56,46 | 3 black
      waterline line 7,68 91,68 | 4 red`],
    ['chariot', ['chariots'], `
      pole line 70,60 98,52 | 1 brown
      seat_back rectangle 22 22 8 16 | 1 red
      body polygon 20,36 78,36 70,64 26,64 | 2 red
      rail line 30,36 72,30 | 3 yellow
      back_wheel circle 12 52 32 32 | 3 brown kind=wheel
      front_wheel circle 58 58 26 26 | 3 brown kind=wheel
      back_spoke_1 line 14,68 42,68 | 4 brown kind=spoke
      back_spoke_2 line 28,54 28,82 | 4 brown kind=spoke
      front_spoke_1 line 60,71 82,71 | 4 brown kind=spoke
      front_spoke_2 line 71,60 71,82 | 4 brown kind=spoke
      back_hub circle 25 65 6 6 | 5 yellow kind=hub
      front_hub circle 68 68 6 6 | 5 yellow kind=hub`],
    ['brig', ['brigs'], `
      sail_1 polygon 22,18 48,18 50,40 20,40 | 1 white kind=sail
      sail_2 polygon 20,44 50,44 52,66 18,66 | 1 white kind=sail
      sail_3 polygon 54,14 78,14 80,36 52,36 | 1 white kind=sail
      sail_4 polygon 52,40 80,40 82,66 50,66 | 1 white kind=sail
      mast_1 rectangle 34 14 3 56 | 2 brown kind=mast
      mast_2 rectangle 64 10 3 60 | 2 brown kind=mast
      flag triangle 66 4 10 6 | 3 red pointing=right
      bowsprit line 92,72 99,60 | 2 brown
      hull polygon 6,70 94,70 84,86 14,86 | 3 brown
      stripe line 10,76 90,76 | 4 yellow`],
    ['buggy', ['buggies', 'horse buggy'], `
      shafts line 64,56 98,44 | 1 brown
      rear_tyre circle 10 52 40 40 | 2 black kind=wheel
      rear_rim circle 13 55 34 34 | 3 white inside=rear_tyre
      ${spokes(30, 72, 17, 'rear_spoke')}
      rear_hub circle 27 69 6 6 | 6 black inside=rear_rim
      front_tyre circle 56 64 28 28 | 2 black kind=wheel
      front_rim circle 59 67 22 22 | 3 white inside=front_tyre
      ${spokes(70, 78, 11, 'front_spoke')}
      front_hub circle 67.5 75.5 5 5 | 6 black inside=front_rim
      box polygon 20,46 70,46 68,60 24,60 | 7 black
      dashboard polygon 66,46 70,46 78,32 76,30 | 7 black
      hood polygon 18,48 16,26 22,14 36,10 50,12 54,18 40,20 32,26 30,48 | 8 black above=box
      seat rectangle 30 38 22 8 | 8 red on=box`],
    ['freighter', ['freighters', 'cargo ship', 'container ship'], `
      funnel rectangle 78 22 6 8 | 1 red
      bridge rectangle 72 30 16 26 | 2 white
      windows line 74,36 86,36 | 3 black
${['red', 'blue', 'green', 'yellow', 'orange'].map((c, i) => `      container_${i + 1} rectangle ${14 + i * 11} 44 10 12 | 2 ${c} kind=container`).join('\n')}
${['blue', 'yellow', 'red'].map((c, i) => `      container_${i + 6} rectangle ${19 + i * 11} 32 10 12 | 2 ${c} kind=container`).join('\n')}
      hull polygon 4,56 96,56 92,66 8,66 | 3 black
      lower_hull polygon 8,66 92,66 88,76 12,76 | 3 red`],
    ['tanker', ['tankers', 'oil tanker'], `
      bow_mast line 10,50 10,36 | 1 black
      funnel rectangle 80 20 6 8 | 1 black
      bridge rectangle 74 28 16 22 | 2 white
      windows line 76,34 88,34 | 3 black
      pipes line 12,48 70,48 | 2 grey
      manifold rectangle 36 42 10 6 | 2 grey
      hull polygon 4,50 96,50 92,62 8,62 | 3 black
      lower_hull polygon 6,62 94,62 88,74 12,74 | 3 red`],
    ['battleship', ['battleships'], `
      mast line 50,18 50,4 | 1 black
      tower rectangle 46 18 8 16 | 2 grey
      superstructure rectangle 38 34 24 22 | 2 grey
      funnel_1 rectangle 63 38 7 18 | 2 grey kind=funnel
      funnel_2 rectangle 71 40 6 16 | 2 grey kind=funnel
${[12, 24, 82].map((x, i) => `      turret_${i + 1} rectangle ${x} 50 10 6 | 2 grey kind=turret`).join('\n')}
      barrel_1 line 12,51 2,49 | 2 black kind=barrel
      barrel_2 line 12,54 2,52 | 2 black kind=barrel
      barrel_3 line 24,51 14,47 | 2 black kind=barrel
      barrel_4 line 92,51 98,49 | 2 black kind=barrel
      hull polygon 2,56 98,56 90,74 8,74 | 3 grey
      windows line 40,40 60,40 | 3 black
      waterline line 6,68 92,68 | 4 red`],
  ],
  'things-3': [
    ['hive', ['hives', 'beehive', 'beehives'], `
      stand rectangle 28 84 44 6 | 1 brown
      band_5 oval 40 28 20 10 | 2 yellow kind=band
      band_4 oval 36 36 28 12 | 3 yellow kind=band
      band_3 oval 32 46 36 14 | 4 yellow kind=band
      band_2 oval 30 58 40 14 | 5 yellow kind=band
      band_1 oval 28 70 44 14 | 6 yellow kind=band
      door oval 44 74 12 8 | 7 black
      bee_1 oval 72 30 6 4 | 8 yellow black kind=bee
      bee_2 oval 78 44 6 4 | 8 yellow black kind=bee`],
    ['intercom', ['intercoms', 'entryphone', 'door phone'], `
      panel rectangle 30 14 40 72 | 1 grey
      speaker circle 38 20 24 24 | 2 black
      slot_1 line 42,28 58,28 | 3 grey kind=slot
      slot_2 line 41,32 59,32 | 3 grey kind=slot
      slot_3 line 42,36 58,36 | 3 grey kind=slot
      button_1 rectangle 38 52 24 8 | 2 white kind=button
      button_2 rectangle 38 64 24 8 | 2 white kind=button
      light circle 48 76 4 4 | 2 green`],
    ['dryer', ['dryers', 'drier', 'tumble dryer', 'clothes dryer'], `
      foot_1 rectangle 22 92 8 4 | 0 black kind=foot
      foot_2 rectangle 70 92 8 4 | 0 black kind=foot
      body rectangle 18 10 64 82 | 1 white
      panel rectangle 18 10 64 14 | 2 grey
      button_1 rectangle 26 15 8 4 | 3 black kind=button
      button_2 rectangle 38 15 8 4 | 3 black kind=button
      dial circle 66 13 8 8 | 3 black
      door circle 30 34 40 40 | 3 grey
      window circle 36 40 28 28 | 4 black
      clothes polygon 40,58 48,50 58,54 60,62 46,64 | 5 red inside=window`],
    ['harness', ['harnesses', 'climbing harness'], `
      left_strap polygon 30,40 36,40 38,56 32,56 | 1 blue kind=strap
      right_strap polygon 64,40 70,40 68,56 62,56 | 1 blue kind=strap
      waist_belt polygon 8,22 50,30 92,22 92,34 50,42 8,34 | 2 blue
      left_loop oval 14 52 30 26 | 2 blue kind=leg_loop
      right_loop oval 56 52 30 26 | 2 blue kind=leg_loop
      buckle rectangle 44 30 12 10 | 3 grey inside=waist_belt
      left_hole oval 19 57 20 16 | 3 white kind=hole inside=left_loop
      right_hole oval 61 57 20 16 | 3 white kind=hole inside=right_loop
      gear_loop_1 arc 14 34 12 8 | 3 grey opens=up kind=gear_loop below=waist_belt
      gear_loop_2 arc 74 34 12 8 | 3 grey opens=up kind=gear_loop below=waist_belt
      belay_loop oval 44 40 12 20 | 4 orange below=buckle
      belay_hole oval 47 43 6 14 | 5 white inside=belay_loop
      carabiner polygon 46,56 54,56 57,62 56,84 50,90 44,84 43,62 | 6 grey below=belay_loop
      carabiner_hole polygon 48,61 52,61 53,64 52,81 50,84 48,81 47,64 | 7 white inside=carabiner`],
    ['reel', ['reels', 'film reel', 'film reels'], `
      film polygon 74,72 98,90 92,98 68,78 | 0 black
      reel circle 14 14 72 72 | 1 grey
      hole_1 circle 42 22 16 16 | 2 white kind=hole
      hole_2 circle 23 36 16 16 | 2 white kind=hole
      hole_3 circle 30 58 16 16 | 2 white kind=hole
      hole_4 circle 54 58 16 16 | 2 white kind=hole
      hole_5 circle 61 36 16 16 | 2 white kind=hole
      hub circle 44 44 12 12 | 2 black`],
    ['typewriter', ['typewriters'], `
      paper rectangle 28 10 44 36 | 1 white
      text_1 line 32,18 66,18 | 2 black kind=text_line
      text_2 line 32,24 62,24 | 2 black kind=text_line
      text_3 line 32,30 64,30 | 2 black kind=text_line
      base polygon 10,58 90,58 96,90 4,90 | 1 black
      carriage rectangle 6 46 88 10 | 2 grey
      roller rectangle 14 42 72 8 | 3 black
      knob_left circle 2 42 8 8 | 3 black kind=knob
      knob_right circle 90 42 8 8 | 3 black kind=knob
${rep(15, (i) => `      key_${i + 1} circle ${18 + (i % 5) * 14 + (Math.floor(i / 5) % 2) * 4} ${62 + Math.floor(i / 5) * 7} 6 6 | 3 white kind=key`)}
      space_bar rectangle 30 83 40 4 | 3 white`],
    ['bandage', ['bandages', 'roller bandage'], `
      strip polygon 36,60 94,70 92,84 30,70 | 0 white
      weave_1 line 50,64 48,73 | 1 grey kind=weave
      weave_2 line 64,66 62,76 | 1 grey kind=weave
      weave_3 line 78,69 76,79 | 1 grey kind=weave
      roll circle 14 24 44 44 | 2 white
      layer circle 21 31 30 30 | 3 white
      core circle 28 38 16 16 | 4 grey`],
    ['rook', ['rooks', 'castle piece'], `
      base rectangle 26 82 48 10 | 1 black
      foot rectangle 30 74 40 8 | 1 black
      body polygon 36,74 64,74 60,36 40,36 | 2 black
      collar rectangle 34 30 32 6 | 3 black
      top rectangle 32 16 36 14 | 3 black
      notch_1 rectangle 39 16 6 5 | 4 white kind=notch
      notch_2 rectangle 55 16 6 5 | 4 white kind=notch
      shine line 44,42 42,70 | 4 grey`],
    ['canteen', ['canteens'], `
      strap line 22,40 30,10 70,10 78,40 | 0 brown
      body circle 18 26 64 64 | 1 green
      seam line 18,58 82,58 | 2 brown
      neck rectangle 44 18 12 10 | 2 grey
      cap rectangle 42 12 16 8 | 3 black`],
    ['napkin', ['napkins', 'serviette', 'serviettes'], `
      napkin rectangle 26 14 48 72 | 1 red
      hem_1 line 30,18 30,82 | 2 white kind=hem
      hem_2 line 70,18 70,82 | 2 white kind=hem
      fold line 26,50 74,50 | 2 black
      fork_handle rectangle 48 44 4 36 | 3 grey
      fork_neck rectangle 44 36 12 8 | 3 grey
${rep(4, (i) => `      tine_${i + 1} rectangle ${44 + i * 3.3} 20 2 16 | 3 grey kind=tine`)}`],
    ['boiler', ['boilers', 'steam boiler'], `
      pipe rectangle 46 0 8 10 | 0 grey
      foot_1 rectangle 28 84 8 8 | 0 black kind=foot
      foot_2 rectangle 64 84 8 8 | 0 black kind=foot
      tank rectangle 26 14 48 72 | 1 grey
      top oval 26 8 48 12 | 2 grey
      gauge circle 40 22 20 20 | 3 white
      needle line 50,32 56,26 | 4 red inside=gauge
      door rectangle 38 60 24 18 | 3 black
      flame polygon 42,78 46,68 50,74 54,64 58,78 | 4 orange inside=door`],
    ['cone', ['cones', 'traffic cone', 'traffic cones'], `
      base rectangle 18 84 64 8 | 1 black
      cone triangle 26 10 48 76 | 2 orange pointing=up
      band_1 polygon 40.5,40 59.5,40 62,48 38,48 | 3 white kind=band
      band_2 polygon 34.2,60 65.8,60 68.3,68 31.7,68 | 3 white kind=band`],
    ['knob', ['drawer knob'], `
      drawer rectangle 10 30 80 40 | 1 brown
      knob circle 40 40 20 20 | 2 yellow
      highlight circle 44 44 6 6 | 3 white inside=knob`],
    ['sphere', ['spheres', 'globe shape', 'ball shape'], `
      shadow oval 24 82 52 8 | 0 grey
      sphere circle 20 20 60 60 | 1 blue
      highlight oval 32 30 16 10 | 2 white inside=sphere`],
    ['scalpel', ['scalpels', 'lancet'], `
      handle polygon 10,74 60,46 64,52 14,80 | 1 grey
      grip_1 line 24,70 26,74 | 2 black kind=grip
      grip_2 line 30,66 32,70 | 2 black kind=grip
      grip_3 line 36,62 38,66 | 2 black kind=grip
      blade polygon 60,46 92,24 84,38 64,52 | 2 white grey`],
    ['telegraph', ['telegraphs', 'telegraph key', 'morse key'], `
      wire_1 line 14,70 4,92 | 0 red kind=wire
      wire_2 line 18,72 10,96 | 0 black kind=wire
      base rectangle 10 66 80 14 | 1 brown
      post rectangle 24 52 8 14 | 2 grey
      contact rectangle 70 58 6 8 | 2 grey
      spring line 54,50 54,64 | 2 grey
      lever polygon 20,50 80,44 80,48 20,54 | 3 grey
      knob oval 72 36 16 10 | 4 black
      screw_1 circle 14 71 4 4 | 2 grey kind=screw
      screw_2 circle 82 71 4 4 | 2 grey kind=screw`],
    ['heater', ['heaters', 'space heater', 'fan heater'], `
      foot_1 rectangle 24 80 12 6 | 0 grey kind=foot
      foot_2 rectangle 64 80 12 6 | 0 grey kind=foot
      body rectangle 20 20 60 60 | 1 white
      grille rectangle 26 26 48 38 | 2 black
${rep(4, (i) => `      coil_${i + 1} line 30,${32 + i * 8} 70,${32 + i * 8} | 3 orange kind=coil`)}
      dial circle 30 68 8 8 | 2 black
      switch rectangle 60 70 10 6 | 2 red
${rep(3, (i) => `      heat_${i + 1} line ${40 + i * 10},16 ${44 + i * 10},11 ${40 + i * 10},6 | 2 red kind=heat`)}`],
    ['graffiti', ['graffito'], `
      wall rectangle 4 14 92 72 | 1 grey
      course_1 line 4,32 96,32 | 2 black kind=course
      course_2 line 4,50 96,50 | 2 black kind=course
      course_3 line 4,68 96,68 | 2 black kind=course
      tag_1 line 14,60 24,30 34,60 44,30 | 3 pink kind=tag
      tag_2 line 50,40 60,28 70,40 80,28 88,44 | 3 green kind=tag
      blob polygon 52,58 62,50 76,54 80,66 66,74 54,70 | 3 yellow
      drip line 66,74 66,82 | 3 yellow
      tag_3 line 14,78 36,72 58,80 86,72 | 3 blue kind=tag`],
    ['windshield', ['windshields', 'windscreens'], `
      hood polygon 6,70 94,70 98,90 2,90 | 0 red
      frame polygon 10,70 22,24 78,24 90,70 | 1 black
      glass polygon 14,66 25,28 75,28 86,66 | 2 blue
      reflection_1 line 30,60 44,34 | 3 white kind=reflection
      reflection_2 line 38,62 50,38 | 3 white kind=reflection
      mirror rectangle 45 30 10 5 | 3 black
      wiper_1 line 24,64 46,48 | 3 black kind=wiper
      wiper_2 line 54,64 76,48 | 3 black kind=wiper`],
    ['antenna', ['antennas'], `
      cable line 52,40 60,60 54,92 | 0 black
      mast rectangle 48 30 4 62 | 1 grey
      base rectangle 40 92 20 4 | 1 black
      boom rectangle 10 28 80 4 | 2 grey
${rep(7, (i) => `      element_${i + 1} line ${16 + i * 11},${16 + i * 1.5} ${16 + i * 11},${44 - i * 1.5} | 3 grey kind=element`)}`],
    ['gavel', ['gavels'], `
      block oval 50 76 40 12 | 1 brown
      handle polygon 10,74 54,40 58,44 14,78 | 2 brown
      head polygon 44,26 64,14 80,40 60,52 | 3 brown
      band_1 line 49,23 65,49 | 4 yellow kind=band
      band_2 line 59,17 75,43 | 4 yellow kind=band`],
    ['helm', ['helms', 'ship wheel', 'steering wheel of a ship'], `
      rim circle 22 22 56 56 | 1 brown
      inner circle 28 28 44 44 | 2 white
      spoke_1 line 10,50 90,50 | 3 brown kind=spoke
      spoke_2 line 50,10 50,90 | 3 brown kind=spoke
      spoke_3 line 22,22 78,78 | 3 brown kind=spoke
      spoke_4 line 78,22 22,78 | 3 brown kind=spoke
${[[10, 50], [90, 50], [50, 10], [50, 90], [22, 22], [78, 78], [78, 22], [22, 78]].map(([x, y], i) => `      handle_${i + 1} circle ${x - 3} ${y - 3} 6 6 | 4 brown kind=handle`).join('\n')}
      hub circle 42 42 16 16 | 4 brown
      hub_centre circle 47 47 6 6 | 5 yellow inside=hub`],
    ['tile', ['tiles', 'floor tile', 'wall tile'], `
${rep(9, (i) => `      tile_${i + 1} square ${10 + (i % 3) * 28} ${10 + Math.floor(i / 3) * 28} 26 26 | 1 ${i % 2 ? 'white' : 'blue'} kind=tile`)}`],
    ['ashtray', ['ashtrays'], `
      tray oval 14 50 72 30 | 1 grey
      well oval 24 54 52 18 | 2 black
      ash_1 circle 34 60 4 4 | 3 grey kind=ash
      ash_2 circle 60 62 4 4 | 3 grey kind=ash
      cigarette polygon 50,58 86,44 88,48 52,62 | 3 white
      filter polygon 78,47 86,44 88,48 80,51 | 4 orange
      tip circle 47 56 5 5 | 4 red
      smoke line 49,54 45,44 51,34 45,24 | 4 grey`],
    ['locket', ['lockets'], `
      chain line 30,4 50,30 70,4 | 1 yellow
      bail circle 46 26 8 8 | 2 yellow
      hinge rectangle 68 52 4 8 | 2 grey
      locket oval 30 32 40 50 | 3 yellow
      heart polygon 50,68 38,56 38,48 44,44 50,48 56,44 62,48 62,56 | 4 red inside=locket`],
    ['aquarium', ['aquariums', 'aquaria', 'fish tank', 'fish tanks'], `
      stand rectangle 6 84 88 6 | 0 brown
      water rectangle 10 20 80 64 | 1 blue
      air rectangle 10 20 80 8 | 2 white
      lid rectangle 8 16 84 6 | 3 black
      gravel rectangle 10 76 80 8 | 2 yellow
      plant polygon 20,76 16,56 22,40 26,40 22,56 26,76 | 3 green
      fish_1 oval 40 40 16 9 | 3 orange kind=fish
      fish_1_tail triangle 34 40.5 7 8 | 3 orange pointing=right
      fish_2 oval 62 56 12 7 | 3 yellow kind=fish
      fish_2_tail triangle 57 56.5 6 6 | 3 yellow pointing=right
${rep(3, (i) => `      bubble_${i + 1} circle ${74 + (i % 2) * 3} ${44 - i * 7} 3 3 | 4 white kind=bubble`)}`],
    ['basin', ['basins', 'washbasin', 'wash basin'], `
      rim oval 10 32 80 16 | 1 grey
      water oval 16 35 68 10 | 2 blue
      basin polygon 10,40 90,40 76,76 24,76 | 3 grey
      foot rectangle 38 76 24 6 | 2 grey`],
    ['portfolio', ['portfolios', 'art folder'], `
      paper rectangle 16 16 40 12 | 0 white
      handle arc 38 10 24 12 | 1 black opens=down
      case rectangle 10 22 80 64 | 2 black
      zip line 12,26 88,26 | 3 grey
      corner_1 triangle 10 74 12 12 | 3 grey pointing=left kind=corner
      corner_2 triangle 78 74 12 12 | 3 grey pointing=right kind=corner
      tie_1 line 50,56 44,70 | 3 red kind=tie
      tie_2 line 50,56 56,70 | 3 red kind=tie`],
    ['binoculars', ['field glasses', 'binocular'], `
      left_eyepiece rectangle 20 20 16 12 | 1 grey kind=eyepiece
      right_eyepiece rectangle 64 20 16 12 | 1 grey kind=eyepiece
      left_barrel rectangle 16 30 24 50 | 2 black kind=barrel
      right_barrel rectangle 60 30 24 50 | 2 black kind=barrel
      bridge rectangle 40 40 20 14 | 3 grey
      focus_wheel rectangle 46 32 8 8 | 4 grey
      left_lens oval 16 74 24 10 | 3 blue kind=lens
      right_lens oval 60 74 24 10 | 3 blue kind=lens`],
    ['cello', ['cellos', 'violoncello'], `
      endpin line 50,86 50,98 | 0 grey
      lower_bout oval 26 52 48 36 | 1 brown
      upper_bout oval 30 28 40 30 | 1 brown
      scroll circle 46 2 8 8 | 2 brown
      fingerboard rectangle 47 8 6 58 | 2 black
      bridge rectangle 42 66 16 3 | 3 yellow
      tailpiece polygon 46,70 54,70 52,84 48,84 | 3 black
      f_hole_1 line 38,58 36,64 38,70 | 3 black kind=f_hole
      f_hole_2 line 62,58 64,64 62,70 | 3 black kind=f_hole
      string_1 line 49,12 49,80 | 4 white kind=string
      string_2 line 51,12 51,80 | 4 white kind=string`],
    ['stocking', ['stockings', 'nylons'], `
      leg polygon 34,4 60,4 59,22 57,40 56,54 55,66 53,78 58,82 72,84 80,87 83,92 79,95 50,95 44,93 42,86 44,78 40,64 37,54 37,40 35,22 | 1 pink
      top_band rectangle 34 4 26 10 | 2 white
      ${rep(5, (i) => `lace_${i + 1} circle ${35 + i * 5} 12 4 4 | 2 white kind=lace below=top_band`)}
      seam line 37,16 38,40 40,60 44,76 44,90 | 3 brown
      heel polygon 42,84 50,86 50,95 44,93 | 3 brown
      toe polygon 76,86 80,87 83,92 79,95 74,95 | 3 brown`],
    ['chime', ['chimes', 'tubular bells'], `
      bar rectangle 14 8 72 4 | 1 brown
      post_1 rectangle 14 10 4 82 | 1 brown kind=post
      post_2 rectangle 82 10 4 82 | 1 brown kind=post
      foot_1 rectangle 8 90 16 4 | 1 brown kind=foot
      foot_2 rectangle 76 90 16 4 | 1 brown kind=foot
${rep(6, (i) => `      tube_${i + 1} rectangle ${24 + i * 10} 14 5 ${70 - i * 8} | 2 yellow kind=tube`)}
      mallet_handle line 62,94 92,72 | 3 brown
      mallet_head oval 86 64 10 8 | 3 black`],
    ['blindfold', ['blindfolds'], `
      tail polygon 78,42 92,56 88,60 76,46 | 1 black
      head oval 24 10 52 72 | 1 pink
      hair polygon 24,40 26,20 50,8 74,20 76,40 70,26 50,16 30,26 | 2 brown
      band polygon 22,34 78,34 78,48 22,48 | 3 black
      knot circle 72 36 8 8 | 4 black
      nose polygon 48,52 52,52 50,60 | 3 pink
      mouth arc 40 64 20 8 | 3 red opens=up`],
    ['radiator', ['radiators'], `
      foot_1 rectangle 16 80 4 10 | 0 grey kind=foot
      foot_2 rectangle 80 80 4 10 | 0 grey kind=foot
      pipe line 91,78 91,96 | 0 grey
${rep(8, (i) => `      fin_${i + 1} rectangle ${14 + i * 9} 28 7 52 | 1 white kind=fin`)}
      top_pipe rectangle 12 32 76 4 | 2 white
      bottom_pipe rectangle 12 72 76 4 | 2 white
      valve rectangle 88 70 6 8 | 2 grey
      knob circle 88 62 6 6 | 3 red
${rep(3, (i) => `      heat_${i + 1} line ${36 + i * 14},22 ${40 + i * 14},16 ${36 + i * 14},10 | 2 red kind=heat`)}`],
    ['mortar', ['mortars'], `
      base_plate polygon 10,86 54,86 50,92 14,92 | 1 grey
      leg_1 line 58,40 76,88 | 1 green kind=leg
      leg_2 line 62,44 86,88 | 1 green kind=leg
      barrel polygon 28,84 62,22 72,28 38,88 | 2 green
      muzzle oval 61 19 12 8 | 3 black`],
    ['bugle', ['bugles'], `
      cord line 30,58 28,80 | 0 red
      tassel triangle 24 78 8 10 | 0 red pointing=up
      loop oval 24 30 48 28 | 1 yellow
      loop_inside oval 30 35 36 18 | 2 white
      tube rectangle 10 40 62 6 | 3 yellow
      bell polygon 70,38 92,22 92,66 70,50 | 3 yellow
      mouthpiece rectangle 4 39 8 8 | 4 grey`],
    ['clockwork', ['clockworks', 'gears', 'cogs'], `
      gear_1 polygon ${star(34, 42, 22, 28, 10)} | 1 yellow kind=gear
      hole_1 circle 28 36 12 12 | 2 white kind=hole
      gear_2 polygon ${star(70, 66, 15, 20, 8)} | 1 grey kind=gear
      hole_2 circle 66 62 8 8 | 2 white kind=hole
      gear_3 polygon ${star(72, 22, 9, 13, 7)} | 1 yellow kind=gear
      hole_3 circle 69.5 19.5 5 5 | 2 white kind=hole`],
    ['bellows', ['bellow'], `
      leather polygon 12,32 70,42 70,52 12,70 | 1 red
      top_board polygon 10,24 70,40 72,44 12,32 | 2 brown
      bottom_board polygon 12,70 70,52 72,56 10,78 | 2 brown
      pleat_1 line 24,35 24,67 | 2 black kind=pleat
      pleat_2 line 36,38 36,63 | 2 black kind=pleat
      pleat_3 line 48,40 48,59 | 2 black kind=pleat
      nozzle polygon 70,44 94,47 94,49 70,52 | 3 grey
      top_handle rectangle 2 22 10 6 | 3 brown kind=handle
      bottom_handle rectangle 2 74 10 6 | 3 brown kind=handle`],
    ['barricade', ['barricades', 'roadblock', 'roadblocks'], `
      leg_1 rectangle 12 26 6 68 | 1 grey kind=leg
      leg_2 rectangle 82 26 6 68 | 1 grey kind=leg
      foot_1 rectangle 6 90 18 6 | 1 grey kind=foot
      foot_2 rectangle 76 90 18 6 | 1 grey kind=foot
      top_board rectangle 6 30 88 12 | 2 white
      bottom_board rectangle 6 52 88 12 | 2 white
${[12, 32, 52, 72].map((x, i) => `      stripe_${i + 1} polygon ${x},30 ${x + 10},30 ${x + 4},42 ${x - 6},42 | 3 orange kind=stripe
      stripe_${i + 5} polygon ${x},52 ${x + 10},52 ${x + 4},64 ${x - 6},64 | 3 orange kind=stripe`).join('\n')}
      light circle 46 20 10 10 | 4 orange`],
    ['chainsaw', ['chainsaws', 'chain saw'], `
      bar polygon 50,46 94,46 98,52 94,58 50,58 | 1 grey
      chain line 50,45 94,45 99,52 94,59 50,59 | 2 black
      rear_handle rectangle 6 48 12 16 | 2 black
      body rectangle 16 36 38 30 | 2 orange
      top_handle arc 18 22 30 16 | 3 black opens=down
      guard rectangle 50 30 4 20 | 3 black
${rep(3, (i) => `      vent_${i + 1} line ${24 + i * 8},44 ${24 + i * 8},58 | 3 black kind=vent`)}`],
    ['slab', ['slabs', 'stone slab', 'concrete slab'], `
      front rectangle 8 52 74 18 | 1 grey
      top polygon 8,52 20,40 94,40 82,52 | 2 white
      side polygon 82,52 94,40 94,58 82,70 | 2 grey
      crack_1 line 30,52 34,60 32,70 | 3 black kind=crack
      crack_2 line 60,44 66,48 | 3 black kind=crack`],
    ['pendant', ['pendants', 'necklace pendant'], `
      chain arc 20 6 60 46 | 1 yellow opens=up
      bail circle 46 50 8 8 | 2 yellow
      setting polygon 50,56 62,70 50,90 38,70 | 2 yellow
      gem polygon 50,60 58,70 50,84 42,70 | 3 blue inside=setting
      sparkle line 46,66 49,62 | 4 white`],
    ['harmonica', ['harmonicas', 'mouth organ'], `
      body rectangle 8 36 84 28 | 1 grey
      engraving line 20,40 80,40 | 2 black
      comb rectangle 8 46 84 10 | 2 white
${rep(10, (i) => `      hole_${i + 1} square ${12 + i * 8} 48.5 5 5 | 3 black kind=hole`)}`],
    ['vial', ['vials', 'phial', 'phials'], `
      bottle rectangle 38 24 24 64 | 1 white
      neck rectangle 42 14 16 10 | 1 white
      liquid rectangle 39 50 22 37 | 2 green
      bubble circle 48 54 3 3 | 3 white
      label rectangle 40 60 20 14 | 3 white
      label_line line 43,67 57,67 | 4 black
      stopper rectangle 40 6 20 10 | 3 brown`],
    ['burr', ['burrs', 'bur', 'burs'], `
      stem line 50,30 60,6 | 0 brown
      spines polygon ${star(50, 56, 22, 36, 14)} | 1 brown
      burr circle 30 36 40 40 | 2 brown`],
    ['machete', ['machetes'], `
      blade polygon 30,52 88,30 96,34 92,42 34,62 | 1 grey
      edge line 34,62 92,42 | 2 white
      handle polygon 6,62 30,52 34,62 10,72 | 2 black
      rivet_1 circle 14 63 3 3 | 3 grey kind=rivet
      rivet_2 circle 22 60 3 3 | 3 grey kind=rivet`],
    ['jukebox', ['jukeboxes'], `
      arch oval 14 12 72 56 | 1 red
      body rectangle 14 40 72 56 | 1 red
      light_band oval 20 18 60 44 | 2 yellow
      window oval 26 24 48 34 | 3 black
      record circle 40 30 20 20 | 4 grey inside=window
      record_label circle 47 37 6 6 | 5 red inside=record
      side_light_1 rectangle 16 46 6 48 | 2 orange kind=light
      side_light_2 rectangle 78 46 6 48 | 2 orange kind=light
      panel rectangle 26 60 48 10 | 2 white
${rep(5, (i) => `      button_${i + 1} rectangle ${30 + i * 8} 63 5 4 | 3 black kind=button`)}
      grille rectangle 26 74 48 18 | 2 brown
${rep(3, (i) => `      grille_line_${i + 1} line ${38 + i * 12},76 ${38 + i * 12},90 | 3 black kind=grille_line`)}`],
    ['doorknob', ['doorknobs', 'door knob', 'door handle'], `
      door_edge rectangle 6 0 14 100 | 0 brown
      rose oval 20 34 6 32 | 1 yellow
      neck rectangle 26 44 18 12 | 2 yellow
      knob circle 42 30 40 40 | 3 yellow
      highlight oval 52 38 12 8 | 4 white inside=knob`],
    ['mainframe', ['mainframes', 'mainframe computer'], `
      floor line 2,92 98,92 | 0 black
      cabinet_1 rectangle 6 20 28 72 | 1 grey kind=cabinet
      cabinet_2 rectangle 36 20 28 72 | 1 grey kind=cabinet
      cabinet_3 rectangle 66 20 28 72 | 1 grey kind=cabinet
      reel_1 circle 9 26 10 10 | 2 black kind=reel
      reel_2 circle 21 26 10 10 | 2 black kind=reel
      reel_3 circle 69 26 10 10 | 2 black kind=reel
      reel_4 circle 81 26 10 10 | 2 black kind=reel
${['red', 'green', 'yellow', 'green', 'red', 'yellow'].map((c, i) => `      light_${i + 1} circle ${40 + (i % 3) * 8} ${28 + Math.floor(i / 3) * 8} 4 4 | 2 ${c} kind=light`).join('\n')}
${rep(4, (i) => `      vent_${i + 1} line 40,${54 + i * 8} 60,${54 + i * 8} | 2 black kind=vent`)}`],
    ['scuba', ['aqualung', 'aqua-lung', 'scuba gear'], `
      tank rectangle 18 20 22 66 | 1 yellow
      tank_top oval 18 14 22 12 | 2 yellow
      valve rectangle 25 6 8 10 | 3 grey
      hose line 33,10 52,6 70,58 | 3 black
      mask_frame oval 56 30 40 24 | 3 black
      left_lens oval 59 33 16 18 | 4 blue kind=lens
      right_lens oval 77 33 16 18 | 4 blue kind=lens
      regulator circle 64 56 12 12 | 4 black`],
    ['mast', ['masts'], `
      sail_1 polygon 32,21 68,21 70,44 30,44 | 1 white kind=sail
      sail_2 polygon 28,47 72,47 74,76 26,76 | 1 white kind=sail
      hull polygon 10,80 90,80 80,92 20,92 | 1 brown
      mast rectangle 48 6 4 74 | 2 brown
      yard_1 line 30,20 70,20 | 3 brown kind=yard
      yard_2 line 26,46 74,46 | 3 brown kind=yard
      crows_nest rectangle 45 12 10 4 | 3 brown
      flag triangle 52 2 10 6 | 3 red pointing=right`],
    ['shawl', ['shawls', 'stole'], `
      shawl polygon 6,20 94,20 50,86 | 1 purple
      border line 14,26 86,26 | 2 yellow
      pattern polygon 44,36 50,30 56,36 50,42 | 2 yellow
${[[14.8, 33.2], [23.6, 46.4], [32.4, 59.6], [41.2, 72.8]].map(([x, y], i) => `      fringe_${i + 1} line ${x},${y} ${x - 4},${y + 4} | 0 purple kind=fringe
      fringe_${i + 5} line ${100 - x},${y} ${104 - x},${y + 4} | 0 purple kind=fringe`).join('\n')}
      fringe_9 line 50,86 50,92 | 0 purple kind=fringe`],
    ['seatbelt', ['seatbelts', 'seat belt', 'seat belts', 'safety belt'], `
      headrest rectangle 36 2 22 10 | 1 blue
      back polygon 30,10 64,10 70,70 26,70 | 1 blue
      cushion polygon 20,70 80,70 84,86 16,86 | 2 blue
      shoulder_belt polygon 58,14 66,18 34,74 26,70 | 3 black
      lap_belt rectangle 22 72 50 6 | 3 black
      anchor circle 58 10 8 8 | 4 grey
      tongue rectangle 64 72 8 6 | 4 grey
      buckle rectangle 70 70 12 10 | 4 red`],
    ['caddy', ['caddies', 'tea caddy', 'tea tin'], `
      can rectangle 26 30 48 60 | 1 red
      lid rectangle 24 20 52 12 | 2 black
      knob rectangle 44 14 12 6 | 3 black
      label rectangle 32 46 36 26 | 2 yellow
      text_1 line 36,54 64,54 | 3 black kind=text_line
      text_2 line 36,62 60,62 | 3 black kind=text_line
      leaf polygon 56,64 64,58 66,66 | 3 green`],
  ],
};

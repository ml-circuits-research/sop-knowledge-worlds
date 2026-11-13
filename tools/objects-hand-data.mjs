// The drawings of tools/objects-hand.mjs: shard -> [name, words, parts]. One line a part:
//   <name> <shape> <x y w h | points x,y ...> | <z> <colours> [key=value ...]
// Hand-written in this repository (hand-core 1, CC0-1.0). Round 11 item 3.

// Lines made by a rule: n lines from f(i), i = 0 .. n-1.
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');

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
      body polygon 6,50 20,40 36,38 50,48 64,56 80,52 94,44 96,48 82,60 64,64 48,56 36,46 20,50 8,56 | 2 green grey
      fin line 22,39 36,36 50,45 64,53 80,49 92,43 | 3 brown
      eye circle 10 46 3 3 | 4 black
      mouth line 6,51 11,52 | 4 black`],
    ['jaguar', ['jaguars'], quad({ c: 'yellow', c2: 'yellow', ears: 'round', extra: `
      spot_1 circle 30 44 4 4 | 3 black kind=spot inside=body
      spot_2 circle 40 41 4 4 | 3 black kind=spot inside=body
      spot_3 circle 50 44 4 4 | 3 black kind=spot inside=body
      spot_4 circle 60 41 4 4 | 3 black kind=spot inside=body
      spot_5 circle 35 52 4 4 | 3 black kind=spot inside=body
      spot_6 circle 46 54 4 4 | 3 black kind=spot inside=body
      spot_7 circle 57 51 4 4 | 3 black kind=spot inside=body` })],
    ['cougar', ['cougars', 'mountain lion', 'mountain lions'], quad({ c: 'brown', c2: 'brown', ears: 'round', extra: `
      muzzle oval 86 37 8 6 | 5 white inside=snout
      tail_tip circle 4 38 4 4 | 2 black` })],
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
      lower_shell polygon 14,60 86,60 80,70 50,74 20,70 | 1 white
      upper_shell polygon 14,60 20,36 36,22 50,18 64,22 80,36 86,60 | 2 white
      ridge_1 line 50,64 26,36 | 3 brown kind=ridge
      ridge_2 line 50,64 40,22 | 3 brown kind=ridge
      ridge_3 line 50,64 60,22 | 3 brown kind=ridge
      ridge_4 line 50,64 74,36 | 3 brown kind=ridge
      edge line 14,60 86,60 | 3 brown`],
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
  ],
  'vehicles-2': [
    ['destroyer', ['destroyers', 'warship'], `
      sea rectangle 0 70 100 30 | 0 blue
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
      left_strap polygon 30,38 38,38 36,54 28,54 | 1 red kind=strap
      right_strap polygon 62,38 70,38 72,54 64,54 | 1 red kind=strap
      waist_belt oval 14 18 72 24 | 2 red
      waist_hole oval 20 23 60 14 | 3 white
      left_loop oval 14 50 32 28 | 2 red kind=leg_loop
      left_hole oval 20 55 20 18 | 3 white kind=hole
      right_loop oval 54 50 32 28 | 2 red kind=leg_loop
      right_hole oval 60 55 20 18 | 3 white kind=hole
      buckle rectangle 43 36 14 8 | 4 grey`],
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
  ],
};

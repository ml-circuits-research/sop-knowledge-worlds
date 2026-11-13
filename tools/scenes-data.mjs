// The scenes of k.scenes (R7.1), hand-written: 60 typical scenes, what is usually there, how many, where in the
// picture, what happens there, and the time, weather and season that fit. Read by tools/scenes-core.mjs.
// A scene: [name, group, kind, ground, { time, weather, season, happens, words, drawing }, things].
// A thing: "name[=drawing], count, where[, side][, @on][, *]"; things are separated by ";"; "*" says that the
// thing fills its layer from side to side (the sea). The drawing is the k.objects
// object of that name when there is one; "=drawing" names another object (farmhouse=house). A thing with no
// fitting drawing has none (a stall, a street lamp): every "=drawing" was looked at next to the thing.
import { wire, header, seg } from './import/lib.mjs';
import { objectNames } from './coverage.mjs';

const SRC = 'hand-core 1';
const W = { sky: 'sky', ceil: 'ceiling', bg: 'background', wall: 'wall', gr: 'ground', wat: 'water', fg: 'foreground' };
const SIDE = { L: 'left', C: 'centre', R: 'right' };

export const SCENES = [
  // ---- nature
  ['beach', 'nature', 'outdoors', 'sand', { time: 'day', weather: 'sunny', season: 'summer', happens: ['swim', 'sunbathe', 'build sandcastles', 'play ball', 'collect shells'], words: ['seaside', 'seashore', 'shore', 'beaches'], drawing: 'beach' },
    'sun,1,sky,R; cloud,2,sky; seagull,3,sky; sea,1,bg,*; sailboat,1,wat,@sea; palm tree,2,gr,L; beach umbrella=umbrella on ground,2,gr; beach towel,2,gr; sun lounger,2,gr; beach ball=ball beach,1,gr; sandcastle,1,gr,C; bucket,1,gr; spade,1,gr; person,3,gr; crab,1,fg; shell,3,fg; starfish,1,fg'],
  ['farm', 'nature', 'outdoors', 'grass', { time: 'day', weather: 'sunny', happens: ['feed the animals', 'milk the cows', 'plough', 'harvest', 'collect eggs'], words: ['farmyard', 'farms'] },
    'sun,1,sky; cloud,2,sky; barn,1,bg,L; farmhouse=house,1,bg,R; field,1,bg; tree,2,bg; scarecrow,1,bg; tractor,1,gr; fence,2,gr; cow,3,gr; pig,2,gr; sheep,4,gr; horse,1,gr; goat,1,gr; hen,4,gr; rooster,1,gr; pond,1,gr; duck,2,wat,@pond; dog,1,gr; cat,1,gr; farmer=person,1,gr; hay,2,gr; wheelbarrow,1,gr'],
  ['forest', 'nature', 'outdoors', 'earth', { time: 'day', happens: ['walk', 'pick mushrooms', 'listen to the birds', 'climb trees'], words: ['woods', 'wood', 'woodland', 'forests'] },
    'tree=deciduous tree,12,bg; fir tree=evergreen tree,6,bg; bush,4,gr; path,1,gr,C; log,2,gr; deer,2,gr; fox,1,gr; wolf,1,gr; bear,1,gr; boar,1,gr; rabbit,2,gr; hedgehog,1,gr; squirrel,2,gr,@tree; owl,1,gr,@tree; nest,1,gr,@tree; bird,4,sky; mushroom,5,fg; acorn,5,fg; fallen leaf,8,fg'],
  ['mountains', 'nature', 'outdoors', 'rock', { time: 'day', happens: ['hike', 'climb', 'ski'], words: ['mountain', 'the mountains', 'alps'], drawing: 'mountains' },
    'sun,1,sky; cloud,3,sky; eagle,1,sky; mountain=snow-capped mountain,3,bg; evergreen tree,8,gr; rock,5,gr; hut,1,gr; path,1,gr; goat,1,gr; cow,2,gr; hiker=person,2,gr; tent,1,gr; cable car=mountain cableway,1,sky; lake,1,gr,C; flower,6,fg'],
  ['meadow', 'nature', 'outdoors', 'grass', { time: 'day', weather: 'sunny', season: ['spring', 'summer'], happens: ['pick flowers', 'run', 'lie in the grass', 'fly a kite'], words: ['meadows', 'pasture'] },
    'sun,1,sky; cloud,2,sky; bird,2,sky; butterfly,4,sky; bee,5,sky; tree,1,bg; fence,1,bg; flower,12,gr; daisy,8,gr; poppy,5,gr; cow,2,gr; rabbit,2,gr; grass,6,fg; snail,1,fg; ladybird=lady beetle,2,fg; grasshopper=cricket,2,fg'],
  ['river', 'nature', 'outdoors', 'grass', { time: 'day', happens: ['fish', 'paddle a canoe', 'skip stones', 'swim'], words: ['rivers', 'stream', 'riverside', 'brook'], drawing: 'river' },
    'sun,1,sky; cloud,2,sky; dragonfly,2,sky; tree,4,bg; river,1,gr,C; river bank,2,gr; bridge,1,bg; rowing boat,1,wat,@river; canoe,1,wat,@river; duck,3,wat,@river; swan,2,wat,@river; fish,4,wat,@river; heron,1,wat,@river; otter,1,wat,@river; beaver,1,gr; frog,2,gr; stone,5,gr; angler=person,1,gr; fishing pole,1,gr'],
  ['lake', 'nature', 'outdoors', 'grass', { time: 'day', weather: 'sunny', season: 'summer', happens: ['swim', 'row a boat', 'fish', 'sail'], words: ['lakes', 'lakeside'], drawing: 'mountain lake' },
    'sun,1,sky; cloud,2,sky; bird,2,sky; mountain,2,bg; evergreen tree,5,bg; lake,1,gr,C; pier,1,gr; rowing boat,1,wat,@lake; sailboat,1,wat,@lake; swan,2,wat,@lake; duck,3,wat,@lake; fish,3,wat,@lake; tent,1,gr; person,2,gr; rock,3,fg; frog,1,fg'],
  ['pond', 'nature', 'outdoors', 'grass', { time: 'day', season: ['spring', 'summer'], happens: ['feed the ducks', 'catch tadpoles', 'watch dragonflies'], words: ['ponds'], drawing: 'pond' },
    'sun,1,sky; dragonfly,3,sky; pond,1,gr,C; duck,3,wat,@pond; frog,3,wat,@pond; water lily=lotus,4,wat,@pond; goldfish,3,wat,@pond; heron,1,wat,@pond; tree,2,bg; bush,2,bg; bench,1,gr; grass,5,fg; snail,1,fg; stone,3,fg'],
  ['desert', 'nature', 'outdoors', 'sand', { time: 'day', weather: 'sunny', happens: ['ride a camel', 'cross the dunes'], words: ['deserts', 'dunes', 'sahara'], drawing: 'desert' },
    'sun,1,sky; vulture,1,sky; dune,3,bg; pyramid,1,bg; cactus,4,gr; camel,2,gr; rock,3,gr; palm tree,2,gr; tent,1,gr; snake,1,fg; scorpion,1,fg; lizard,1,fg'],
  ['jungle', 'nature', 'outdoors', 'earth', { time: 'day', weather: 'rainy', happens: ['swing on vines', 'explore', 'watch the monkeys'], words: ['rainforest', 'rain forest', 'jungles'] },
    'parrot,3,sky; butterfly,3,sky; palm tree,6,bg; tree=deciduous tree,8,bg; vine,5,bg; monkey,3,gr,@tree; sloth,1,gr,@tree; snake,1,gr,@tree; tiger,1,gr; elephant,1,gr; gorilla,1,gr; river,1,gr; crocodile,1,wat,@river; frog,2,fg; flower=hibiscus,5,fg; leafy plant=plant,6,fg'],
  ['savanna', 'nature', 'outdoors', 'grass', { time: 'day', weather: 'sunny', happens: ['go on safari', 'watch the animals'], words: ['savannah', 'safari', 'african plain'] },
    'sun,1,sky; vulture,2,sky; tree,2,bg; lion,2,gr; elephant,3,gr; giraffe,2,gr; zebra,4,gr; rhinoceros,1,gr; antelope,5,gr; cheetah,1,gr; ostrich,2,gr; water hole=pond,1,gr; hippopotamus,2,wat,@water hole; jeep,1,gr; bush,3,fg; grass,6,fg'],
  ['arctic', 'nature', 'outdoors', 'snow', { weather: ['snowy', 'windy'], season: 'winter', happens: ['fish through the ice', 'ride a sled'], words: ['north pole', 'polar', 'antarctic', 'south pole', 'ice'] },
    'cloud,2,sky; snowflake,10,sky; iceberg,2,bg; igloo,1,gr; polar bear,2,gr; penguin,5,gr; seal,2,gr; walrus,1,gr; reindeer,2,gr; sled,1,gr; person,1,gr; sea,1,bg,*; whale,1,wat,@sea; fish,3,wat,@sea; snowman,1,gr'],
  ['island', 'nature', 'outdoors', 'sand', { time: 'day', weather: 'sunny', happens: ['look for treasure', 'wait for a ship', 'swim'], words: ['desert island', 'islands', 'tropical island'], drawing: 'island' },
    'sun,1,sky; cloud,1,sky; seagull,2,sky; sea,1,bg,*; island,1,gr,C; palm tree,3,gr; coconut,3,gr; hut,1,gr; treasure chest,1,gr; crab,2,fg; shell,3,fg; ship,1,wat,@sea; dolphin,2,wat,@sea; shark,1,wat,@sea; raft,1,wat,@sea; parrot,1,gr,@palm tree'],
  ['garden', 'nature', 'outdoors', 'grass', { time: 'day', weather: 'sunny', season: ['spring', 'summer'], happens: ['water the flowers', 'dig', 'mow the lawn', 'play'], words: ['gardens', 'back garden', 'yard', 'backyard'], drawing: 'back garden' },
    'sun,1,sky; cloud,2,sky; butterfly,2,sky; bee,3,sky; bird,2,sky; house,1,bg; fence,1,bg; hedge,1,bg; tree,1,gr,L; flower,10,gr; rose,4,gr; tulip,5,gr; bush,2,gr; bench,1,gr; watering can,1,gr; wheelbarrow,1,gr; lawn mower,1,gr; hose,1,gr; rake,1,gr; swing,1,gr; cat,1,gr; snail,1,fg; earthworm,1,fg'],
  ['park', 'nature', 'outdoors', 'grass', { time: 'day', weather: 'sunny', happens: ['walk the dog', 'feed the ducks', 'have a picnic', 'jog', 'play ball'], words: ['parks', 'city park'] },
    'sun,1,sky; cloud,2,sky; bird,3,sky; kite,1,sky; tree,6,bg; bush,3,bg; path,1,gr; bench,3,gr; fountain,1,gr,C; pond,1,gr; duck,3,wat,@pond; flower,8,gr; person,4,gr; dog,2,gr; pigeon,4,gr; squirrel,1,gr; ball,1,gr; bicycle,1,gr; trash bin,1,gr; lamp post,2,gr'],
  ['orchard', 'nature', 'outdoors', 'grass', { time: 'day', season: 'autumn', happens: ['pick apples', 'climb the ladder', 'fill the baskets'], words: ['orchards', 'apple orchard'] },
    'sun,1,sky; bird,2,sky; fruit tree,8,gr; apple,20,gr,@fruit tree; ladder,1,gr; basket,3,gr; wheelbarrow,1,gr; fence,1,bg; person,2,gr; bee,3,sky; grass,5,fg; fallen apple=red apple,5,fg'],
  ['campsite', 'nature', 'outdoors', 'grass', { time: ['evening', 'night'], season: 'summer', happens: ['pitch a tent', 'sit by the fire', 'toast marshmallows', 'tell stories', 'sleep in a tent'], words: ['camp', 'camping', 'campground'], drawing: 'camping' },
    'moon,1,sky; star,10,sky; evergreen tree,6,bg; mountain,1,bg; tent,2,gr; campfire=bonfire,1,gr,C; log,3,gr; person,3,gr; backpack,2,gr; lantern,1,gr; guitar,1,gr; marshmallows,4,gr; pot=pot of food,1,gr; caravan,1,bg; owl,1,gr,@evergreen tree; bat,2,sky'],
  ['field', 'nature', 'outdoors', 'earth', { time: 'day', season: ['summer', 'autumn'], happens: ['plough', 'sow', 'harvest'], words: ['fields', 'wheat field', 'cornfield'], drawing: 'field' },
    'sun,1,sky; cloud,2,sky; crow=black bird,4,sky; field,1,gr; wheat,20,gr; tractor,1,gr; scarecrow,1,gr,C; hay,5,gr; tree,2,bg; barn,1,bg; farmer=person,1,gr; mouse,2,fg; poppy,4,fg'],
  ['picnic', 'nature', 'outdoors', 'grass', { time: 'day', weather: 'sunny', season: 'summer', happens: ['eat outdoors', 'spread a blanket', 'share food'], words: ['picnics'], drawing: 'picnic' },
    'sun,1,sky; cloud,1,sky; tree,1,bg; blanket,1,gr,C; basket,1,gr,@blanket; sandwich,4,gr,@blanket; apple,3,gr,@blanket; grapes,1,gr,@blanket; cake,1,gr,@blanket; lemonade,1,gr,@blanket; cup,4,gr,@blanket; plate,4,gr,@blanket; person,4,gr; dog,1,gr; ball,1,gr; ant,6,fg; flower,5,fg'],
  // ---- town
  ['city street', 'town', 'outdoors', 'road', { time: 'day', happens: ['drive', 'cross the road', 'shop', 'wait for the bus'], words: ['street', 'city', 'town', 'downtown', 'streets'], drawing: 'street' },
    'sun,1,sky; cloud,2,sky; pigeon,3,sky; building=office building,5,bg; shop,3,bg; road,1,gr,C,*; sidewalk,2,gr; car,4,gr; bus,1,gr; taxi,1,gr; bicycle,1,gr; truck,1,gr; traffic light=vertical traffic light,2,gr; street lamp,4,gr; bus stop,1,gr; tree,3,gr; person,6,gr; dog,1,gr; mailbox=postbox,1,gr; trash bin,2,gr; stop sign,1,gr'],
  ['village', 'town', 'outdoors', 'road', { time: 'day', happens: ['go to market', 'ring the church bell', 'meet the neighbours'], words: ['villages', 'hamlet'] },
    'sun,1,sky; cloud,2,sky; bird,3,sky; hill,2,bg; house,6,gr; church,1,gr,C; shop,1,gr; well,1,gr; road,1,gr; tree,5,gr; fence,3,gr; person,3,gr; dog,1,gr; cat,1,gr; hen,3,gr; bicycle,1,gr; bench,1,gr; flower,6,fg'],
  ['playground', 'town', 'outdoors', 'sand', { time: 'day', weather: 'sunny', happens: ['swing', 'slide', 'climb', 'play in the sand', 'run'], words: ['playgrounds', 'play park'] },
    'sun,1,sky; cloud,2,sky; kite,1,sky; tree,3,bg; fence,1,bg; swing,2,gr; slide,1,gr; see saw,1,gr; merry go round,1,gr; jungle gym,1,gr; sandbox,1,gr; bucket,1,gr; spade,1,gr; ball,2,gr; bench,2,gr; child=person,5,gr; scooter=kick scooter,1,gr; bicycle,1,gr; dog,1,gr'],
  ['market', 'town', 'outdoors', 'paving', { time: ['morning', 'day'], happens: ['buy fruit', 'sell vegetables', 'weigh', 'carry bags'], words: ['markets', 'marketplace', 'street market', 'bazaar'] },
    'sun,1,sky; building,3,bg; stall,5,gr; apple,10,gr,@stall; banana,6,gr,@stall; tomato,8,gr,@stall; carrot,8,gr,@stall; bread,4,gr,@stall; cheese,3,gr,@stall; fish,4,gr,@stall; flower=bouquet,5,gr,@stall; basket,4,gr; scales=balance scale,2,gr,@stall; shopping bags,3,gr; person,8,gr; dog,1,gr; pigeon,3,fg'],
  ['harbour', 'town', 'outdoors', 'water', { time: 'day', happens: ['load ships', 'fish', 'sail away', 'watch the boats'], words: ['harbor', 'port', 'docks', 'harbours', 'marina'] },
    'sun,1,sky; cloud,2,sky; seagull,5,sky; sea,1,bg,*; lighthouse,1,bg,R; ship,2,wat; sailboat,3,wat; motor boat,1,wat; rowing boat,2,wat; ferry,1,wat; pier,2,gr; crane,2,gr; warehouse,1,bg; anchor,1,gr; rope,3,gr; fishing net=net with handle,2,gr; fisherman=person,3,gr; fish,6,fg; crab,1,fg; ring buoy,2,gr'],
  ['airport', 'town', 'outdoors', 'tarmac', { happens: ['take off', 'land', 'check in', 'wait for a flight'], words: ['airports', 'airfield'], drawing: 'airport' },
    'sun,1,sky; cloud,3,sky; airplane,2,sky; helicopter,1,gr; control tower,1,bg; airport,1,bg; hangar,1,bg; runway,1,gr,C; bus,1,gr; fuel truck=petrol tanker,1,gr; luggage,6,gr; suitcase,4,gr; pilot=person,2,gr; passenger=person,6,gr; windsock,1,gr'],
  ['railway station', 'town', 'outdoors', 'platform', { happens: ['wait for the train', 'buy a ticket', 'wave goodbye'], words: ['train station', 'station', 'railroad station', 'platform'], drawing: 'station' },
    'cloud,2,sky; station,1,bg; train,1,gr,C; locomotive,1,gr; railway car,3,gr; railway track,2,gr; clock,1,wall; bench,3,gr; suitcase,4,gr; ticket,2,gr; person,8,gr; conductor=person,1,gr; signal=vertical traffic light,2,gr; pigeon,3,fg; trash bin,1,gr'],
  ['construction site', 'town', 'outdoors', 'earth', { time: 'day', happens: ['dig', 'lift', 'build', 'pour concrete'], words: ['building site', 'roadworks'], drawing: 'building construction' },
    'sun,1,sky; cloud,2,sky; crane,1,bg; building construction,1,bg; brick,20,gr; cement mixer,1,gr; dumper truck,1,gr; ladder,2,gr; wheelbarrow,2,gr; shovel,3,gr; hammer,2,gr; barrier=construction,3,gr; builder=person,4,gr; hard hat,4,gr,@builder; hole,1,gr; fence,1,gr; pipe=-,4,gr; wood,3,gr'],
  ['petrol station', 'town', 'outdoors', 'tarmac', { happens: ['fill the tank', 'pay', 'check the tyres'], words: ['gas station', 'filling station', 'service station'] },
    'cloud,2,sky; shop=convenience store,1,bg; fuel pump,3,gr; car,2,gr; truck,1,gr; motorcycle,1,gr; road,1,fg; person,2,gr; tire,2,gr; oil drum,2,gr; signpost,1,gr; trash bin,1,gr'],
  ['zoo', 'town', 'outdoors', 'paving', { time: 'day', happens: ['watch the animals', 'feed the goats', 'take photos'], words: ['zoos', 'animal park'] },
    'sun,1,sky; cloud,2,sky; tree,4,bg; fence,5,gr; cage,2,gr; lion,2,gr; elephant,2,gr; giraffe,2,gr; monkey,4,gr; zebra,2,gr; penguin,5,gr; bear,1,gr; tiger,1,gr; parrot,2,gr; pond,1,gr; flamingo,3,wat,@pond; seal,2,wat,@pond; path,1,gr; person,6,gr; balloon,2,sky; ice cream,2,gr; bench,2,gr; signpost,2,gr'],
  ['fairground', 'town', 'outdoors', 'grass', { time: ['evening', 'day'], happens: ['ride the carousel', 'eat candy floss', 'win a prize'], words: ['funfair', 'fair', 'amusement park', 'carnival', 'theme park'] },
    'cloud,2,sky; balloon,6,sky; fireworks,2,sky; ferris wheel,1,bg; roller coaster,1,bg; carousel=carousel horse,1,gr,C; tent=circus tent,2,gr; stall,3,gr; candy floss,3,gr; ice cream,2,gr; popcorn,2,gr; teddy bear,3,gr,@stall; ticket,3,gr; person,8,gr; flag,6,gr; Christmas lights,3,bg'],
  ['football pitch', 'town', 'outdoors', 'grass', { time: 'day', happens: ['kick the ball', 'score a goal', 'cheer', 'run'], words: ['football field', 'soccer field', 'pitch', 'stadium', 'soccer pitch'] },
    'sun,1,sky; cloud,2,sky; stadium,1,bg; goal,2,gr; football=soccer ball,1,gr,C; player=person,10,gr; referee=person,1,gr; flag,4,gr; bench,2,gr; trophy,1,gr; football kit,10,gr,@player; boots,10,gr,@player; fan=person,10,bg'],
  ['swimming pool', 'town', 'outdoors', 'tiles', { time: 'day', weather: 'sunny', season: 'summer', happens: ['swim', 'dive', 'splash', 'float'], words: ['pool', 'swimming baths', 'lido'], drawing: 'pool' },
    'sun,1,sky; pool,1,gr,C; swimmer=person,5,wat,@pool; ladder,2,gr; diving board,1,gr; sun lounger,4,gr; beach umbrella=umbrella on ground,2,gr; towel,4,gr; ball beach,1,wat,@pool; ring buoy,2,wat,@pool; rubber duck,1,wat,@pool; swimming cap,3,gr,@swimmer; goggles,2,gr,@swimmer; lifeguard=person,1,gr; playground slide,1,gr'],
  ['circus', 'town', 'indoors', 'sawdust', { time: 'evening', happens: ['juggle', 'walk the tightrope', 'clap', 'laugh at the clown'], words: ['circuses', 'big top'], drawing: 'circus tent' },
    'circus tent,1,bg; spotlight=spot light,3,ceil; trapeze,2,ceil; rope,1,ceil; ring=-,1,gr,C; clown=person,2,gr; acrobat=person,3,gr; juggler=person,1,gr; ball,5,gr; elephant,1,gr; horse,2,gr; lion,1,gr; drum,1,gr; trumpet,1,gr; balloon,6,gr; top hat,1,gr; audience=person,20,bg; popcorn,4,bg'],
  ['castle', 'town', 'outdoors', 'grass', { time: 'day', happens: ['guard the gate', 'ride out', 'hold a feast'], words: ['castles', 'fortress', 'palace', 'fairy tale castle'], drawing: 'castle' },
    'sun,1,sky; cloud,2,sky; bird,3,sky; dragon,1,sky; hill,1,bg; castle,1,gr,C; tower,2,gr; flag,4,gr,@tower; gate,1,gr; bridge,1,gr; moat,1,gr; wall,2,gr; knight=person,3,gr; king=person,1,gr; queen=person,1,gr; crown,2,gr; horse,2,gr; sword,3,gr; shield,3,gr; cannon,1,gr; throne,1,gr; tree,3,bg'],
  // ---- indoors
  ['kitchen', 'indoors', 'indoors', 'floor', { happens: ['cook', 'bake', 'wash the dishes', 'eat breakfast'], words: ['kitchens'] },
    'ceiling light,1,ceil; window,1,wall; cupboard,3,wall; clock,1,wall; cooker,1,gr; fridge,1,gr,R; sink,1,gr; dishwasher,1,gr; table,1,gr,C; chair,4,gr; kettle,1,gr,@cooker; saucepan,2,gr,@cooker; frying pan,1,gr,@cooker; toaster,1,gr; microwave,1,gr; plate,4,gr,@table; cup,4,gr,@table; bowl,2,gr,@table; fork,4,gr,@table; knife,4,gr,@table; spoon,4,gr,@table; bread,1,gr,@table; apple,3,gr,@table; trash bin,1,gr; cook=person,1,gr; cat,1,fg'],
  ['bedroom', 'indoors', 'indoors', 'floor', { time: ['night', 'morning'], happens: ['sleep', 'dream', 'get dressed', 'read in bed'], words: ['bedrooms', 'room'] },
    'ceiling light,1,ceil; window,1,wall; curtains,1,wall,@window; picture,2,wall; bed,1,gr,C; pillow,2,gr,@bed; blanket,1,gr,@bed; wardrobe,1,gr,L; chest of drawers,1,gr; desk,1,gr; chair,1,gr; lamp,1,gr; alarm clock,1,gr; rug,1,gr; book,3,gr; teddy bear,1,gr,@bed; slippers,1,fg; toy box,1,gr'],
  ['living room', 'indoors', 'indoors', 'floor', { time: 'evening', happens: ['watch television', 'read', 'talk', 'play a game'], words: ['lounge', 'sitting room', 'front room', 'living rooms'], drawing: 'couch and lamp' },
    'ceiling light,1,ceil; window,1,wall; curtains,1,wall,@window; picture,2,wall; clock,1,wall; sofa,1,gr,C; armchair,2,gr; coffee table,1,gr; television,1,gr; bookcase,1,gr,L; fireplace,1,gr; rug,1,gr; standard lamp,1,gr,R; potted plant,2,gr; cushion=pillow,3,gr,@sofa; book,4,gr; remote control,1,gr,@coffee table; vase,1,gr,@coffee table; cat,1,gr,@sofa; person,2,gr'],
  ['bathroom', 'indoors', 'indoors', 'tiles', { time: ['morning', 'evening'], happens: ['wash', 'brush teeth', 'take a bath', 'shower'], words: ['bathrooms', 'washroom'] },
    'ceiling light,1,ceil; mirror,1,wall; window,1,wall; bathtub,1,gr,C; shower,1,gr; toilet,1,gr; sink,1,gr; tap,2,gr,@sink; towel,2,wall; soap,1,gr,@sink; toothbrush,2,gr,@sink; toothpaste,1,gr,@sink; shampoo,1,gr,@bathtub; sponge,1,gr,@bathtub; rubber duck,1,wat,@bathtub; bubbles,10,wat,@bathtub; bath mat,1,gr; toilet roll,1,wall; scales,1,gr; laundry basket,1,gr'],
  ['classroom', 'indoors', 'indoors', 'floor', { time: ['morning', 'day'], happens: ['learn', 'read', 'write', 'count', 'raise a hand'], words: ['classrooms', 'school', 'class', 'schoolroom'] },
    'ceiling light,2,ceil; blackboard,1,wall,C; clock,1,wall; world map,1,wall; window,2,wall; desk,8,gr; chair,8,gr; teacher=person,1,gr,C; pupil=person,8,gr; book,8,gr,@desk; pencil,8,gr,@desk; notebook,8,gr,@desk; school bag,8,gr; globe=globe showing Europe-Africa,1,gr; chalk,3,gr; bookcase,1,gr; computer,1,gr; ruler=straight ruler,2,gr,@desk; scissors,2,gr,@desk; wastebasket,1,gr; potted plant,1,gr'],
  ['office', 'indoors', 'indoors', 'floor', { time: 'day', happens: ['type', 'phone', 'hold a meeting', 'print'], words: ['offices', 'workplace'] },
    'ceiling light,2,ceil; window,2,wall; clock,1,wall; calendar,1,wall; desk,3,gr; chair computer,3,gr; computer=desktop computer,3,gr,@desk; keyboard,3,gr,@desk; computer mouse,3,gr,@desk; telephone,2,gr,@desk; printer,1,gr; file cabinet,2,gr; photocopier,1,gr; wastebasket,2,gr; potted plant,2,gr; paper,6,gr,@desk; pen,4,gr,@desk; stapler,1,gr,@desk; cup,2,gr,@desk; briefcase,1,gr; worker=person,3,gr'],
  ['supermarket', 'indoors', 'indoors', 'floor', { happens: ['shop', 'push a trolley', 'pay', 'pack the bags'], words: ['shop', 'store', 'grocery store', 'supermarkets', 'grocery'], drawing: 'supermarket' },
    'ceiling light,4,ceil; shelf,6,wall; shopping cart,3,gr; basket,2,gr; till,2,gr; milk,6,gr,@shelf; bread,4,gr,@shelf; eggs,3,gr,@shelf; cereal,4,gr,@shelf; tin can,10,gr,@shelf; apple,10,gr,@shelf; banana,6,gr,@shelf; cheese,3,gr,@shelf; fridge,2,gr; freezer,1,gr; shopping bags,3,gr; money,2,gr; shopper=person,5,gr; cashier=person,1,gr; scales=balance scale,1,gr'],
  ['restaurant', 'indoors', 'indoors', 'floor', { time: 'evening', happens: ['order', 'eat', 'serve', 'pay the bill'], words: ['restaurants', 'diner', 'bistro'], drawing: 'restaurant' },
    'chandelier,1,ceil; window,2,wall; picture,2,wall; table,4,gr; chair,8,gr; table cloth,4,gr,@table; plate,8,gr,@table; fork and knife,8,gr,@table; wine glass,6,gr,@table; candle,4,gr,@table; menu,4,gr,@table; vase,2,gr,@table; pizza,1,gr,@table; spaghetti,1,gr,@table; soup,1,gr,@table; waiter=person,2,gr; guest=person,6,gr; cook=person,1,bg; bottle,2,gr,@table'],
  ['library', 'indoors', 'indoors', 'floor', { time: 'day', happens: ['read', 'borrow a book', 'whisper', 'study'], words: ['libraries'], drawing: 'library' },
    'ceiling light,3,ceil; window,2,wall; clock,1,wall; bookcase,8,gr; books,30,gr,@bookcase; table,3,gr; chair,6,gr; desk,1,gr; computer,2,gr,@table; ladder,1,gr; armchair,2,gr; desk lamp,3,gr,@table; open book,4,gr,@table; librarian=person,1,gr; reader=person,5,gr; globe=globe showing Americas,1,gr; potted plant,1,gr'],
  ['hospital', 'indoors', 'indoors', 'floor', { happens: ['rest', 'examine', 'give medicine', 'visit'], words: ['hospitals', 'ward', 'hospital room', 'clinic', 'doctor\'s surgery'], drawing: 'hospital' },
    'ceiling light,2,ceil; window,1,wall; clock,1,wall; bed=single bed,2,gr; patient=person,2,gr,@bed; doctor=person,1,gr; nurse=person,1,gr; stethoscope,1,gr,@doctor; lab coat,1,gr,@doctor; saline drip,1,gr; wheel chair,1,gr; crutches,1,gr; chair,2,gr; medicine,2,gr; syringe,1,gr; clinical thermometer,1,gr; plaster,2,gr; first aid box,1,wall; flowers=bouquet,1,gr; patient clipboard,1,gr; stretcher,1,gr'],
  ['workshop', 'indoors', 'indoors', 'floor', { time: 'day', happens: ['saw', 'hammer', 'drill', 'repair', 'paint'], words: ['garage', 'shed', 'tool shed', 'workshops'] },
    'ceiling light,1,ceil; window,1,wall; shelf,2,wall; workbench=table,1,gr,C; vice,1,gr,@workbench; hammer,2,gr,@workbench; saw,1,wall; screwdriver,3,gr,@workbench; wrench,2,gr,@workbench; pliers,1,gr,@workbench; drill electric,1,gr,@workbench; nail,10,gr,@workbench; screw,10,gr,@workbench; toolbox,1,gr; ladder,1,gr; paint,3,gr; paint brush,2,gr; wood,4,gr; bicycle,1,gr; car,1,gr; tire,2,gr; mechanic=person,1,gr'],
  ['theatre', 'indoors', 'indoors', 'stage', { time: 'evening', happens: ['act', 'sing', 'dance', 'clap', 'bow'], words: ['theater', 'stage', 'theatres', 'playhouse', 'opera'], drawing: 'theater' },
    'spot light,4,ceil; curtains,2,wall; stage,1,gr,C; actor=person,3,gr; performing arts,1,wall; piano,1,gr; microphone,1,gr; seat=-,20,fg; audience=person,20,fg; ticket,2,fg; bouquet,1,gr; crown,1,gr,@actor; violin,1,gr; chandelier,1,ceil'],
  ['museum', 'indoors', 'indoors', 'floor', { time: 'day', happens: ['look at paintings', 'learn about the past', 'follow the guide'], words: ['museums', 'gallery', 'art gallery', 'exhibition'], drawing: 'museum' },
    'ceiling light,3,ceil; painting,5,wall; portrait,2,wall; statue,2,gr; sculpture,1,gr; dinosaur=sauropod,1,gr,C; vase=amphora,2,gr; armor,1,gr; sword,1,wall; bench,2,gr; rope,2,gr; visitor=person,5,gr; guide=person,1,gr; camera,1,gr; ticket,2,gr; signpost,1,gr'],
  ['cafe', 'indoors', 'indoors', 'floor', { time: ['morning', 'day'], happens: ['drink coffee', 'eat cake', 'chat', 'read the newspaper'], words: ['café', 'coffee shop', 'coffee house', 'tea room', 'cafes'], drawing: 'viennese coffee house' },
    'ceiling light,2,ceil; window,2,wall; picture,2,wall; counter=table,1,gr,L; espresso machine,1,gr,@counter; table,4,gr; chair,8,gr; cup=hot beverage,6,gr,@table; coffee,3,gr,@table; tea,2,gr,@table; cake slice,3,gr,@table; croissant,2,gr,@table; muffin,2,gr,@table; newspaper,1,gr,@table; menu,2,gr,@table; potted plant,2,gr; waiter=person,1,gr; guest=person,5,gr'],
  ['nursery', 'indoors', 'indoors', 'floor', { time: 'day', happens: ['play', 'nap', 'build with bricks', 'sing'], words: ['playroom', 'baby room', 'kindergarten', 'day care', 'nurseries'] },
    'ceiling light,1,ceil; window,1,wall; picture,3,wall; cot,1,gr; baby=person,1,gr,@cot; high chair,1,gr; toy box,1,gr; rug,1,gr,C; teddy bear,2,gr; doll,2,gr; ball,3,gr; bricks,10,gr; toy car,3,gr; rocking chair,1,gr; baby bottle,1,gr; nappy,2,gr; book,4,gr; rubber duck,1,gr; child=person,3,gr; mobile,3,ceil'],
  ['laboratory', 'indoors', 'indoors', 'floor', { time: 'day', happens: ['experiment', 'measure', 'mix', 'look through the microscope'], words: ['lab', 'science lab', 'laboratories'] },
    'ceiling light,2,ceil; window,1,wall; shelf,2,wall; table,2,gr; microscope,2,gr,@table; test tube,8,gr,@table; conical flask,3,gr,@table; petri dish,3,gr,@table; alembic,1,gr,@table; dropper pipette,2,gr,@table; computer,1,gr,@table; balance scale,1,gr,@table; scientist=person,2,gr; lab coat,2,gr,@scientist; safety goggles,2,gr,@scientist; stool,3,gr; sink,1,gr; whiteboard,1,wall; fire extinguisher,1,wall'],
  ['birthday party', 'indoors', 'indoors', 'floor', { time: 'day', happens: ['blow out the candles', 'sing', 'open presents', 'play games', 'eat cake'], words: ['party', 'birthday', 'parties'] },
    'balloon,8,ceil; party streamers=confetti ball,3,ceil; table,1,gr,C; table cloth,1,gr,@table; birthday cake,1,gr,@table; candle,6,gr,@birthday cake; present,6,gr; cup,6,gr,@table; plate,6,gr,@table; lemonade,2,gr,@table; sweets=candy,10,gr,@table; party hat,6,gr; child=person,6,gr; chair,6,gr; birthday card,3,gr; cupcake,6,gr,@table; ice cream,3,gr,@table'],
  // ---- other
  ['space', 'other', 'space', undefined, { time: 'night', happens: ['orbit', 'float', 'fly a rocket', 'explore'], words: ['outer space', 'cosmos', 'universe', 'solar system'], drawing: 'milky way' },
    'star,30,bg; sun,1,bg,L; Earth,1,bg; moon,1,bg; Mars,1,bg; Jupiter,1,bg; Saturn,1,bg; ringed planet,1,bg; comet,1,sky; asteroid,4,sky; rocket,1,sky,C; space shuttle,1,sky; satellite,2,sky; astronaut=person,2,fg; flying saucer,1,sky; milky way,1,bg; telescope,1,fg'],
  ['underwater', 'other', 'underwater', 'sand', { happens: ['swim', 'dive', 'hide in the coral', 'hunt'], words: ['under the sea', 'sea bed', 'ocean floor', 'coral reef', 'reef', 'seabed', 'deep sea'] },
    'water wave,3,sky; fish,8,wat; tropical fish,6,wat; shark,1,wat; whale,1,bg; dolphin,2,wat; octopus,1,wat; jellyfish,3,wat; turtle,1,wat; seahorse,2,wat; squid,1,wat; coral,5,gr; seaweed,6,gr; shell,5,gr; starfish,3,gr; crab,2,gr; lobster,1,gr; rock,4,gr; treasure chest,1,gr; anchor,1,gr; shipwreck,1,bg; diver=person,1,wat; submarine,1,wat; bubbles,10,wat'],
  ['night', 'other', 'outdoors', 'grass', { time: 'night', happens: ['sleep', 'look at the stars', 'hoot'], words: ['night sky', 'at night', 'midnight', 'night time'], drawing: 'night with stars' },
    'moon,1,sky,R; star,20,sky; cloud,1,sky; shooting star,1,sky; bat,3,sky; owl,1,gr,@tree; tree,2,gr; house,1,gr,C; window,2,gr,@house; street lamp,1,gr; cat,1,gr; fox,1,gr; hedgehog,1,fg; firefly,5,fg'],
  ['winter', 'other', 'outdoors', 'snow', { time: 'day', weather: 'snowy', season: 'winter', happens: ['build a snowman', 'throw snowballs', 'ski', 'skate', 'sledge'], words: ['snow', 'snowy day', 'winter day', 'in the snow'] },
    'cloud,3,sky; snowflake,20,sky; leafless tree,3,bg; evergreen tree,3,bg; house,1,bg; chimney,1,bg,@house; hill,1,bg; snowman,1,gr,C; sledge,2,gr; skis,1,gr; ice skate,2,gr; child=person,3,gr; bobble hat,3,gr,@child; scarf,3,gr,@child; mittens,3,gr,@child; snowball,6,gr; robin,1,gr; pond,1,gr; igloo,1,gr'],
  ['autumn', 'other', 'outdoors', 'leaves', { time: 'day', weather: ['windy', 'rainy', 'cloudy'], season: 'autumn', happens: ['rake the leaves', 'collect chestnuts', 'fly a kite', 'jump in puddles'], words: ['fall', 'autumn day'] },
    'cloud,3,sky; kite,1,sky; leaf fluttering in wind,10,sky; bird,5,sky; tree=deciduous tree,4,bg; fallen leaf,20,gr; maple leaf,8,gr; chestnut,6,gr; acorn,6,gr; mushroom,4,gr; pumpkin,3,gr; rake,1,gr; puddle=pond,2,gr; squirrel,1,gr; hedgehog,1,gr; person,2,gr; umbrella,1,gr; wellington boots,2,gr; scarecrow,1,bg'],
  ['spring', 'other', 'outdoors', 'grass', { time: 'day', weather: ['sunny', 'rainy'], season: 'spring', happens: ['plant seeds', 'watch the lambs', 'pick flowers', 'build nests'], words: ['springtime', 'spring day'] },
    'sun,1,sky; cloud,2,sky; rainbow,1,sky; bird,4,sky; butterfly,3,sky; bee,3,sky; tree,2,bg; blossom,10,bg,@tree; nest with eggs,1,bg,@tree; tulip,8,gr; daffodil,8,gr; flower,6,gr; lamb=ewe,3,gr; rabbit,2,gr; baby chick,4,gr; seedling,6,fg; grass,6,fg; snail,1,fg'],
  ['rainy day', 'other', 'outdoors', 'road', { weather: ['rainy', 'cloudy', 'stormy'], happens: ['splash in puddles', 'open an umbrella', 'stay indoors'], words: ['rain', 'storm', 'thunderstorm', 'in the rain', 'wet day'] },
    'cloud with rain,3,sky; cloud with lightning,1,sky; rainbow,1,sky; droplet,20,sky; house,2,bg; tree,2,bg; puddle=pond,3,gr; person,2,gr; umbrella,2,gr,@person; raincoat,2,gr,@person; wellington boots,2,gr,@person; car,1,gr; frog,2,fg; snail,2,fg; earthworm,2,fg; duck,2,gr'],
  ['Christmas', 'other', 'indoors', 'floor', { time: ['evening', 'night'], weather: 'snowy', season: 'winter', happens: ['decorate the tree', 'give presents', 'sing carols', 'hang up stockings'], words: ['christmas', 'xmas', 'christmas eve', 'christmas day'] },
    'Christmas tree,1,gr,C; Christmas bauble,12,gr,@Christmas tree; Christmas lights,2,gr,@Christmas tree; star,1,gr,@Christmas tree; present,8,gr; fireplace,1,wall; Christmas sock,3,wall,@fireplace; candle,4,gr; Father Christmas,1,gr; Father Christmas sack,1,gr; window,1,wall; holly,3,wall; mistletoe,1,ceil; Christmas pudding,1,gr; cracker,4,gr; child=person,2,gr; candy cane,4,gr'],
  ['Halloween', 'other', 'outdoors', 'earth', { time: 'night', season: 'autumn', happens: ['dress up', 'trick or treat', 'carve pumpkins', 'tell ghost stories'], words: ['halloween', 'spooky night', 'haunted house'] },
    'moon,1,sky; cloud,2,sky; bat,5,sky; witch,1,sky; broomstick,1,sky,@witch; haunted house,1,bg,C; leafless tree,2,bg; pumpkin lantern,4,gr; ghost,3,gr; black cat,1,gr; spider,3,gr; spider web,2,gr; headstone,3,gr; witches hat,1,gr; monster,1,gr; owl,1,gr,@leafless tree; candy,8,gr; child=person,3,gr; fence,1,gr'],
  ['pirate ship', 'other', 'outdoors', 'water', { time: 'day', weather: 'windy', happens: ['sail the seas', 'hunt for treasure', 'fire the cannon', 'walk the plank'], words: ['pirates', 'pirate', 'galleon'] },
    'sun,1,sky; cloud,2,sky; seagull,3,sky; sea,1,bg,*; pirate ship,1,wat,C; flag,1,wat,@pirate ship; anchor,1,wat,@pirate ship; cannon,2,wat,@pirate ship; pirate=person,4,wat,@pirate ship; parrot,1,wat,@pirate ship; treasure chest,1,wat,@pirate ship; map,1,wat,@pirate ship; telescope,1,wat,@pirate ship; sword,3,wat,@pirate ship; rope,3,wat,@pirate ship; island,1,bg; shark,1,wat,@sea; rowing boat,1,wat,@sea; coin,10,wat,@treasure chest'],
];

// The facts of the scenes, grouped into shards by `group`. `objects` is the set of k.objects object names.
export function sceneWires(objects = new Set(objectNames())) {
  const groups = new Map();
  const report = [];
  const names = new Set();
  for (const [name, group, kind, ground, info, thingsText] of SCENES) {
    if (names.has(name)) throw new Error(`scene ${name} twice`);
    names.add(name);
    const list = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
    if (info.drawing && !objects.has(info.drawing)) throw new Error(`${name}: no object "${info.drawing}"`);
    const lines = [wire(`k.scenes.scene.${seg(name)}`, 'k.scenes.scene', [['name', name], ['kind', kind], ['ground', ground],
      ...list(info.time).map((t) => ['time', t]), ...list(info.weather).map((t) => ['weather', t]), ...list(info.season).map((t) => ['season', t]),
      ...list(info.happens).map((t) => ['happens', t]), ['drawing', info.drawing]], SRC)];
    const seen = new Set();
    const things = thingsText.split(';').map((t) => t.trim()).filter(Boolean).map((t) => {
      const f = t.split(',').map((x) => x.trim());
      const [thing, given] = f[0].split('=').map((x) => x.trim());
      const count = Number(f[1]);
      const where = W[f[2]];
      const side = f.slice(3).map((x) => SIDE[x]).find(Boolean);
      const on = f.slice(3).find((x) => x.startsWith('@'))?.slice(1);
      const fills = f.slice(3).includes('*') ? true : undefined;
      if (!thing || !Number.isInteger(count) || count < 1 || !where) throw new Error(`${name}: bad thing "${t}"`);
      if (given && given !== '-' && !objects.has(given)) throw new Error(`${name}: no object "${given}" for ${thing}`);
      // "=-": the object of that name shows another thing (a pipe to smoke, a ring for a finger): no drawing.
      return { thing, count, where, side, on, fills, drawing: given === '-' ? undefined : given ?? (objects.has(thing) ? thing : undefined) };
    });
    // The same thing twice in a scene (an airplane in the sky and on the ground) keeps its first fact.
    const kept = things.filter((t) => (seen.has(t.thing) ? false : seen.add(t.thing)));
    for (const t of kept) {
      if (t.on && !seen.has(t.on)) throw new Error(`${name}: ${t.thing} is on "${t.on}", which is not in the scene`);
      lines.push(wire(`k.scenes.has.${seg(name)}.${seg(t.thing)}`, 'k.scenes.has', [['scene', name], ['thing', t.thing], ['count', t.count], ['where', t.where], ['side', t.side], ['on', t.on], ['fills', t.fills], ['drawing', t.drawing]], SRC));
    }
    const words = [...new Set(list(info.words))].filter((w) => w !== name);
    if (words.length) lines.push(wire(`k.scenes.word.scene.${seg(name)}`, 'core.word', [...words.map((w) => ['text', w]), ['means', name], ['of', 'k.scenes.scene.name']], SRC));
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ name, lines });
    report.push({ scene: name, group, things: kept.length, drawn: kept.filter((t) => t.drawing).length, undrawn: kept.filter((t) => !t.drawing).map((t) => t.thing) });
  }
  return { groups, report };
}

const ABOUT = { nature: 'scenes in nature and the countryside', town: 'scenes in a town and places people build', indoors: 'scenes indoors', other: 'space, underwater, the night, the seasons, the weather and feasts' };
export function sceneShards(objects) {
  const { groups } = sceneWires(objects);
  const files = {};
  for (const [group, scenes] of groups) {
    files[`scenes-${group}.sop`] = `${header({
      id: `k.scenes/shards/scenes-${group}`,
      about: `${scenes.length} ${ABOUT[group]} (${scenes.map((s) => s.name).join(', ')}): what is usually there, how many, where in the picture, what happens there, the time, weather and season that fit; and other names of the scenes.`,
      sources: ['hand-core 1 (hand-written in this repository: tools/scenes-data.mjs)'],
      license: 'CC0-1.0', script: 'tools/scenes-core.mjs',
    })}\n${scenes.map((s) => `# ${s.name}\n${s.lines.join('\n')}\n`).join('\n')}`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { report } = sceneWires();
  for (const r of report) console.log(`${r.scene}\t${r.drawn}/${r.things}\t${r.undrawn.join(', ')}`);
  const t = report.reduce((n, r) => n + r.things, 0), d = report.reduce((n, r) => n + r.drawn, 0);
  console.log(`${report.length} scenes, ${t} things, ${d} with a drawing (${(100 * d / t).toFixed(1)}%)`);
}

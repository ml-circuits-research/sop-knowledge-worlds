// w.lang.ro frames and syntax (reviewer block "18:20" item 1): how a Romanian request says an act of k.actions with
// its roles, in the same frame vocabulary as w.lang.en (`frame` name, act, mode, set, priority, needs, role, example;
// `part` frame, at, is lead/det/verb/word/phrase/lexicon/role, takes words/rest/number/prep/lexicon), each frame
// naming the English frame it says (`en`: same act, mode and roles), so that a reader of one reads the other.
// What is Romanian here: the verbs (any form of a dictionary lemma whose sense reaches the act: a k.actions verb, or a
// k.words verb sense whose English word is a k.actions verb of the act), the joined clitics after an imperative
// ("șterge-l", "scoate-ți": the part `is=word` of the clitic phrase), the bound clitics before a finite verb, the
// prepositions (w.lang.ro.prep, their relation names are w.lang.en's), the leads and politeness words, and the
// order facts a reader needs (`w.lang.ro.syntax`): an adjective follows its noun, the possessor follows in the genitive
// without a preposition (culoarea casei), the definite article is a suffix, clitics join an imperative with a hyphen.
// Hand-written (CC0); this tool writes the shard from the table.
//   node tools/lang-ro-frames.mjs      writes docs/worlds/w.lang.ro/shards/frames.sop
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORLDS_DIR } from './lib/worlds.mjs';

const W = 'w.lang.ro';
const SRC = 'hand-core 1';
const q = (s) => JSON.stringify(String(s));
const ascii = (s) => String(s).replace(/[ăâîșțşţ]/g, (c) => ({ ă: 'a2', â: 'a3', î: 'i3', ș: 's2', ț: 't2', ş: 's2', ţ: 't2' })[c]).replace(/[^\w.]+/g, '_');

// Phrase groups (a lead, a politeness word anywhere, the clitics joined after an imperative) and lexicons.
export const PHRASES = [
  ['lead.polite', 'words before a request: politeness, a wish, an ability, a sequence', ['te rog', 'vă rog', 'poți să', 'puteți să', 'ai putea să', 'hai să', 'aș vrea să', 'vreau să', 'acum', 'apoi', 'și', 'deci', 'te rog să', 'încearcă să', 'mai']],
  ['skip', 'politeness words a reader skips wherever they stand ("..., te rog")', ['te rog', 'vă rog', 'mersi', 'mulțumesc', 'hm', 'ăă', 'pls']],
  ['clitic.joined', 'the clitics joined to an imperative with a hyphen (w.lang.ro.pron clitic=joined): pune-l, scoate-ți, dă-mi', ['l', 'o', 'i', 'le', 'mi', 'ți', 'și', 'ne', 'vă', 'ni', 'vi', 'li', 'm', 's', 'te', 'ne']],
  ['clitic.bound', 'the clitics before a finite verb (w.lang.ro.pron clitic=bound): îl mut, o șterg', ['îl', 'o', 'îi', 'le', 'îmi', 'îți', 'își', 'ne', 'vă', 'mă', 'te', 'se']],
  ['wish', 'a wish that names what to make', ['vreau', 'aș vrea', 'doresc', 'aș dori', 'mi-ar plăcea', 'îmi trebuie', 'dă-mi']],
];
export const LEXICONS = [
  ['cmp.more', 'comparatives up: mai + an adjective of size', ['mai mare', 'mai mari', 'mai lung', 'mai lungă', 'mai lungi', 'mai înalt', 'mai înaltă', 'mai înalți', 'mai lat', 'mai lată', 'mai gros', 'mai groasă', 'mai larg', 'mai largă', 'mai multe', 'mai mulți']],
  ['cmp.less', 'comparatives down', ['mai mic', 'mai mică', 'mai mici', 'mai scurt', 'mai scurtă', 'mai scurți', 'mai scurte', 'mai îngust', 'mai îngustă', 'mai subțire', 'mai subțiri', 'mai puține', 'mai puțini']],
  ['acts.dir', 'directions of a move (the English lexicon acts.dir says them in English)', ['la stânga', 'la dreapta', 'în sus', 'în jos', 'sus', 'jos', 'mai aproape', 'mai departe', 'în față', 'în spate', 'la mijloc', 'în centru', 'stânga', 'dreapta', 'mai sus', 'mai jos']],
];

// Order facts (`w.lang.ro.syntax`): what a reader of these frames does with the words a frame captures.
export const SYNTAX = [
  ['adjective.after.noun', 'an adjective follows the noun it qualifies (o casă roșie); a host reading the noun phrase of a kind takes the first noun as the head and the adjectives after it as its values'],
  ['genitive.possessor', 'the possessor follows its noun in the genitive, without a preposition (culoarea casei: the colour of the house); the frames take the attribute as one word, the thing after it'],
  ['article.suffix', 'the definite article is a suffix of the noun (casa, copacul), a cell of its class; a determiner part takes only the free determiners (un, o, acest)'],
  ['clitic.joined', 'a pronoun object joins an imperative with a hyphen (șterge-l, pune-mi); a reader splits it (w.lang.ro.split) and the frame takes it as a word of clitic.joined, or as the thing when it is the object'],
  ['clitic.bound', 'before a finite verb the clitic stands free (îl mut, o șterg); the frames of the indicative take it as a word of clitic.bound'],
  ['subjunctive.after.wish', 'after a wish or an ability (vreau să, poți să) the verb is in the conjunctive (să desenezi): the lead phrase takes the wish, the verb part every form of the lemma'],
];

// The frames: [name, English frame, act, mode, priority, needs, example, pattern]. Pattern: L (lead), V.<act> (a verb
// of the act), CJ? (a joined clitic), CB? (a bound clitic), D? (a determiner), {role:words|rest|number|prep|words1},
// {role:lex.<name>}, [a|b_c] words (_ a space), ? optional.
export const FRAMES = [
  ['ro.make', 'acts.make', 'make', null, 10, null, 'Desenează o casă.', 'L? V.make CJ? D? {thing:words}'],
  ['ro.make.n', 'acts.make.n', 'make', null, 12, null, 'Desenează două case.', 'L? V.make CJ? {amount:number} {thing:words}'],
  ['ro.make.place', 'acts.make.place', 'make', null, 12, 'in', 'Adaugă un copac lângă casă.', 'L? V.make CJ? D? {thing:words} {rel:prep} D? {place:words}'],
  ['ro.make.name', 'acts.make.name', 'make', null, 13, 'named', 'Adaugă un invitat numit Ana.', 'L? V.make CJ? D? {thing:words} [numit|numită|numiți|numite|cu_numele|chemat|chemată] {value:rest}'],
  ['ro.make.wish', 'acts.more.make.wish', 'make', null, 9, 'wish', 'Vreau o casă.', '$wish D? {thing:words}'],
  ['ro.make.self', 'acts.make.self', 'make', null, 12, 'self', 'Dă-ți ochi de vizor.', 'L? [dă|pune|fă] [ți|mi|și|îți|îmi] D? {thing:words}'],
  ['ro.remove', 'acts.remove', 'remove', null, 10, null, 'Șterge casa.', 'L? V.remove CJ? D? {thing:words}'],
  ['ro.remove.it', 'acts.remove', 'remove', null, 11, null, 'Șterge-l.', 'L? V.remove {thing:lex.clitic.joined}'],
  ['ro.remove.place', 'acts.remove.place', 'remove', null, 12, 'in', 'Șterge prunele din grafic.', 'L? V.remove CJ? D? {thing:words} [din|de_pe|de_la|de_lângă] D? {place:words}'],
  ['ro.change.call', 'acts.change.call', 'change', 'set', 12, 'name', 'Numește-te Pixel.', 'L? [numește|redenumește|cheamă|botează] [te|ți] [pe]? {value:rest}'],
  ['ro.change.value', 'acts.change.value', 'change', 'set', 12, 'values', 'Fă casa roșie.', 'L? [fă|V.change] CJ? D? {thing:words} {value:words1}'],
  ['ro.change.into', 'acts.change.swap', 'change', 'set', 11, 'be', 'Schimbă gura într-un zigzag.', 'L? V.change CJ? D? {thing:words} [în|într|la] D? {value:rest}'],
  ['ro.change.of', 'acts.change.of', 'change', 'set', 14, 'attrs', 'Schimbă culoarea casei în roșu.', 'L? V.change CJ? D? {attribute:words1} [lui|de_la|de]? D? {thing:words} [în|la|pe|într] D? {value:rest}'],
  ['ro.change.add', 'acts.change.add', 'change', 'more', 14, 'number', 'Adaugă 2 locuri la masa 1.', 'L? V.make CJ? {amount:number} {attribute:words1} [la|lui|pe] D? {thing:words}'],
  ['ro.change.less', 'acts.change.less', 'change', 'less', 14, 'number', 'Scoate 2 locuri de la masa 1.', 'L? V.remove CJ? {amount:number} {attribute:words1} [de_la|din|de_pe] D? {thing:words}'],
  ['ro.change.cmp.more', 'acts.change.cmp.more', 'change', 'more', 13, 'more', 'Fă masa 1 mai mare.', 'L? [fă|V.change] CJ? D? {thing:words} {value:lex.cmp.more}'],
  ['ro.change.cmp.less', 'acts.change.cmp.less', 'change', 'less', 13, 'less', 'Fă masa 1 mai mică.', 'L? [fă|V.change] CJ? D? {thing:words} {value:lex.cmp.less}'],
  ['ro.place', 'acts.place', 'place', null, 11, 'in', 'Mută casa lângă copac.', 'L? V.place CJ? D? {thing:words} {rel:prep} D? {place:words}'],
  ['ro.place.dir', 'acts.place.dir', 'place', null, 13, 'dir', 'Mută casa la stânga.', 'L? V.place CJ? D? {thing:words} {rel:lex.acts.dir}'],
  ['ro.connect', 'acts.connect', 'connect', null, 11, null, 'Conectează masa 1 cu masa 2.', 'L? [conectează|conectați|leagă|legați|unește|V.connect] CJ? D? {thing:words} [cu|de|la|și] D? {place:words}'],
  ['ro.connect.bare', 'acts.connect.bare', 'connect', null, 5, null, 'Conectează masa 1.', 'L? [conectează|conectați|leagă|legați|unește|V.connect] CJ? D? {thing:words}'],
  ['ro.group', 'acts.group', 'group', 'group', 10, null, 'Grupează mesele.', 'L? V.group CJ? D? {thing:words}'],
  ['ro.apart', 'acts.apart', 'group', 'apart', 10, null, 'Desparte mesele.', 'L? [desparte|despărțiți|desfă|separă|V.take_apart] CJ? D? {thing:words}'],
  ['ro.pick', 'acts.pick', 'pick', null, 10, null, 'Selectează masa 2.', 'L? V.pick CJ? D? {thing:words}'],
  ['ro.pick.none', 'acts.more.pick.none', 'pick', 'none', 12, 'none', 'Deselectează tot.', 'L? [deselectează|anulează_selecția] [tot|totul]?'],
  ['ro.copy', 'acts.copy', 'copy', null, 10, null, 'Copiază masa 2.', 'L? V.copy CJ? D? {thing:words}'],
  ['ro.send', 'acts.send', 'send', null, 11, null, 'Trimite masa 2 la diagramă.', 'L? V.send CJ? D? {thing:words} [la|către|în|spre] D? {place:words}'],
  ['ro.undo', 'acts.undo', 'undo', null, 16, null, 'Anulează asta.', 'L? V.undo CJ? [asta|aia|ultima_schimbare|ultima_acțiune|ultimul_pas]?'],
  ['ro.redo', 'acts.redo', 'redo', null, 16, null, 'Refă asta.', 'L? V.redo CJ? [asta|aia]?'],
  ['ro.save', 'acts.save', 'save', null, 10, null, 'Salvează ca prânz.', 'L? V.save CJ? [ca|drept|sub_numele|cu_numele] {value:rest}'],
  ['ro.load', 'acts.load', 'load', null, 10, null, 'Încarcă prânz.', 'L? [încarcă|încărcați|V.load] CJ? {value:rest}'],
  ['ro.ask.what', 'acts.ask.what', 'ask', 'what', 12, 'attrs', 'Care este culoarea mesei 2?', 'L? [care|ce|cum] [este|e|sunt|era] D? {attribute:words1} {thing:words}'],
  ['ro.ask.what.is', 'acts.ask.what.is', 'ask', 'what', 12, 'attrs', 'Ce culoare are masa 2?', 'L? [ce|care] {attribute:words1} [are|au|e|este] D? {thing:words}'],
  ['ro.ask.count', 'acts.ask.count', 'ask', 'count', 12, null, 'Câte mese sunt?', 'L? [câte|câți] {thing:words} [sunt|există|am|ai|avem|are]'],
  ['ro.ask.count.at', 'acts.ask.count.at', 'ask', 'count', 13, 'in', 'Câte lucruri sunt în desen?', 'L? [câte|câți] {thing:words} [sunt|există|se_află] {rel:prep} D? {place:words}'],
  ['ro.ask.count.attr', 'acts.ask.count.attr', 'ask', 'what', 14, 'number', 'Câte locuri are masa 1?', 'L? [câte|câți] {attribute:words} [are|au] D? {thing:words}'],
  ['ro.ask.where', 'acts.ask.where', 'ask', 'where', 12, 'in', 'Unde este Ana?', 'L? unde [este|e|sunt|se_află|stă] D? {thing:words}'],
  ['ro.ask.why', 'acts.ask.why', 'ask', 'why', 11, null, 'De ce este masa 2 albastră?', 'L? de_ce {rest:rest}'],
  ['ro.ask.options', 'acts.more.ask.options', 'ask', 'options', 11, 'list', 'Ce culori există?', 'L? [ce|care] {thing:words} [există|sunt_disponibile|pot_folosi|am|ai|sunt]'],
];

// The pattern of a frame as parts (the w.lang.en part keys).
export function partsOf(pattern) {
  return pattern.trim().split(/\s+/).map((t0) => {
    let t = t0, optional = false;
    if (/\?$/.test(t)) { optional = true; t = t.slice(0, -1); }
    const p = {};
    if (t === 'L') Object.assign(p, { is: 'lead', phrase: ['lead.polite'] });
    else if (t === 'D') Object.assign(p, { is: 'det' });
    else if (t === 'CJ') Object.assign(p, { is: 'phrase', phrase: ['clitic.joined'] });
    else if (t === 'CB') Object.assign(p, { is: 'phrase', phrase: ['clitic.bound'] });
    else if (/^\$/.test(t)) Object.assign(p, { is: 'phrase', phrase: [t.slice(1)] });
    else if (/^V\./.test(t)) Object.assign(p, { is: 'verb', act: t.slice(2).replace(/_/g, ' ') });
    else if (/^\{/.test(t)) {
      const [, role, cls] = /^\{(\w+):([\w.]+)\}$/.exec(t);
      Object.assign(p, { is: 'role', role });
      if (cls === 'words1') Object.assign(p, { takes: 'words', max_words: 1 });
      else if (cls.startsWith('lex.')) Object.assign(p, { takes: 'lexicon', lexicon: cls.slice(4) });
      else p.takes = cls;
    } else {
      const alts = /^\[.*\]$/.test(t) ? t.slice(1, -1).split('|') : [t];
      const verb = alts.find((a) => /^V\./.test(a));
      Object.assign(p, { is: 'word', ...(verb ? { act: verb.slice(2).replace(/_/g, ' ') } : {}), word: alts.filter((a) => a !== verb).map((a) => a.replace(/_/g, ' ')) });
    }
    if (optional) p.optional = 'yes';
    return p;
  });
}
export const rolesOf = (pattern) => partsOf(pattern).filter((p) => p.is === 'role').map((p) => p.role);

export function framesShard() {
  const out = [
    `# ${W}/shards/frames: Romanian frames and order (reviewer block "18:20" item 1): ${FRAMES.length} frames from Romanian verbs to the acts of`,
    '# k.actions with their roles, in w.lang.en\'s frame vocabulary (each names the English frame it says: `en`), the phrase groups',
    '# (leads, politeness, joined and bound clitics, wishes), lexicons (comparatives, directions) and the order facts a reader of',
    '# them needs (adjective after its noun, genitive possessor, article suffix, clitic placement).',
    '# sources: hand-core 1 (written by hand in this repository)',
    '# license: CC0-1.0',
    '# script: tools/lang-ro-frames.mjs',
    '',
  ];
  for (const [name, about] of SYNTAX) out.push(`@${W}.syntax.${ascii(name)} ${W}.syntax name=${name} about=${q(about)} core.source="${SRC}"`);
  for (const [name, doc, items] of PHRASES) out.push(`@${W}.phrase.${ascii(name)} ${W}.phrase name=${name} doc=${q(doc)} ${items.map((x) => `item=${q(x)}`).join(' ')} core.source="${SRC}"`);
  for (const [name, doc, items] of LEXICONS) out.push(`@${W}.lex.${ascii(name)} ${W}.lex name=${name} doc=${q(doc)} ${items.map((x) => `item=${q(x)}`).join(' ')} core.source="${SRC}"`);
  for (const [name, en, act, mode, priority, needs, example, pattern] of FRAMES) {
    out.push(`@${W}.frame.${ascii(name)} ${W}.frame name=${name} en=${en} act=${/\s/.test(act) ? q(act) : act}${mode ? ` mode=${mode}` : ''} set=acts priority=${priority}${needs ? ` needs=${needs}` : ''}`
      + `${rolesOf(pattern).map((r) => ` role=${r}`).join('')} example=${q(example)} core.source="${SRC}"`);
    partsOf(pattern).forEach((p, i) => {
      const attrs = Object.entries(p).flatMap(([k, v]) => [].concat(v).map((x) => `${k}=${['word', 'act'].includes(k) && /[\s"ăâîșț]/.test(x) ? q(x) : (k === 'word' ? q(x) : x)}`)).join(' ');
      out.push(`@${W}.part.${ascii(name)}.${i + 1} ${W}.part frame=${name} at=${i + 1} ${attrs} core.source="${SRC}"`);
    });
  }
  return `${out.join('\n')}\n`;
}

if (process.argv[1]?.endsWith('lang-ro-frames.mjs')) {
  const text = framesShard();
  writeFileSync(join(WORLDS_DIR, W, 'shards', 'frames.sop'), text);
  console.log(`frames.sop: ${FRAMES.length} frames, ${text.split('\n').filter((l) => l.startsWith('@')).length} wires, ${Buffer.byteLength(text)} bytes`);
}

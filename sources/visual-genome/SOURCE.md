# visual-genome

- **What:** Visual Genome 1.4 object attributes, aggregated: for each object synset (NLTK WordNet 3.0 name, car.n.01),
  each attribute and its count over the dataset's 3.8 M objects (439,318 rows).
- **Origin:** Visual Genome (Krishna et al., "Visual Genome: Connecting Language and Vision Using Crowdsourced Dense
  Image Annotations", IJCV 2017), `attributes.json` from the verbatim mirror https://huggingface.co/datasets/jn12/VisualGenome;
  aggregated for questions.md Q80 by PSys2's machine (psys2 `data/external/visual-genome-attributes/`, commit 30a5808a,
  with its own SOURCE.md).
- **Version:** 1.4.
- **License:** CC-BY-4.0. Attribution: "Visual Genome (Krishna et al., 2017), CC BY 4.0".
- **How to fetch:** copy psys2 `data/external/visual-genome-attributes/object-attributes.tsv` into `sources/visual-genome/raw/`;
  run `node tools/import/attributes-data.mjs`.
- **What is kept:** for the 1,500 common things whose kept sense names a synset of the file: the modal basic colour
  (white, black, grey, red, orange, yellow, green, blue, purple, pink, brown) when the colour words are said at least
  20 times and it holds at least half of them, as `colour`, only where the catalog has none and only the values the hand
  check (sources/coverage/kr6-visual-genome-colour-audit.tsv) found right while its error is 5 % or more.

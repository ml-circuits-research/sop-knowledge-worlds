# quickdraw: the Quick, Draw! dataset (not imported yet)

- **What:** 50 million quick drawings of 345 categories, made by players of Google's game. For `k.objects`: a
  sketch skeleton per category (the usual box of each stroke).
- **Origin:** https://github.com/googlecreativelab/quickdraw-dataset ; the simplified drawings are
  `https://storage.googleapis.com/quickdraw_dataset/full/simplified/<category>.ndjson` (the category names are in
  `categories.txt` of the GitHub repository).
- **Version:** the 2017 release (`core.source="quickdraw 2017"`).
- **License:** CC-BY-4.0.
- **Attribution:** The Quick, Draw! Dataset, made available by Google, Inc. under the Creative Commons Attribution
  4.0 International license, https://creativecommons.org/licenses/by/4.0/ .
- **Status: NOT FETCHED.** The files are on Google Cloud Storage, which the network of this repository's workers
  does not reach. No Quick, Draw! fact is in the repository. `tools/import/quickdraw.mjs` is written and tested
  on made-up drawings in the file's format (`tests/import.quickdraw.test.mjs`).
- **How to fetch and run (on a machine with an open network):** `mkdir -p sources/quickdraw/raw && cd
  sources/quickdraw/raw && curl -L -O https://raw.githubusercontent.com/googlecreativelab/quickdraw-dataset/master/categories.txt
  && while read c; do curl -L -o "$c.ndjson" "https://storage.googleapis.com/quickdraw_dataset/full/simplified/$c.ndjson";
  done < categories.txt` (use `%20` for spaces in the URL); then `node tools/import/quickdraw.mjs && node
  tools/build-catalog.mjs && npm test`. The script reads the first 2,000 recognised drawings of each file.
- **What will be kept:** per category whose drawings agree (at least 15% of them have the most common stroke count,
  and the stroke centres spread 15 or less on the 0 to 100 frame): one `k.objects.skeleton` per stroke with its
  median box, the number of drawings, the spread, and the name of the part of the `k.objects` object it overlaps,
  if any. The script prints which categories are usable. No drawing itself is kept.

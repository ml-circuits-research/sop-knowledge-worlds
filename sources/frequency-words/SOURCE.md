# frequency-words: FrequencyWords, English 2018

- **What:** a list of English words by how often they occur in film and television subtitles (OpenSubtitles 2018),
  the 50,000 most frequent with their counts. Used only to choose which WordNet words go into `k.words`: the first
  20,000 lines. No count and no line of the list is published in a shard.
- **Origin:** https://github.com/hermitdave/FrequencyWords , commit `525f9b560de45753a5ea01069454e72e9aa541c6`, file
  `content/2018/en/en_50k.txt` (sha256 `5351ff405b1126ef555791dd4d9798a48e3e9a501a9fc481a9da957752cfb458`).
- **Version:** 2018 (`frequency-words 2018` in shard headers).
- **License:** CC-BY-SA-4.0 for the lists (MIT for the generator code), as the repository's README says.
- **Attribution:** FrequencyWords by Hermit Dave, https://github.com/hermitdave/FrequencyWords , CC BY-SA 4.0; made
  from the OpenSubtitles 2018 corpus (https://opus.nlpl.eu/OpenSubtitles2018.php).
- **How to fetch:** `mkdir -p sources/frequency-words/raw && curl -L -o sources/frequency-words/raw/en_50k.txt
  https://raw.githubusercontent.com/hermitdave/FrequencyWords/525f9b560de45753a5ea01069454e72e9aa541c6/content/2018/en/en_50k.txt`
- **What is kept:** nothing of the list itself; the choice of words only (see questions.md Q9 on what that means for
  the terms of the `k.words` shards).

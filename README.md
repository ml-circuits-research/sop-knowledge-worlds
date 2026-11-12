# sop-knowledge-worlds

Reusable **knowledge worlds** for [sopworld](https://github.com/ml-circuits-research/soplang-words-lib): world
**schemas** (types, slots, rules, soft rules) and world **instances** (facts), written in SOP Lang only, split into
small shards, and served as static files through GitHub Pages.

Applications (PSys2 first) do not copy this knowledge into their own worlds. They load a schema as a sopworld
module and load only the instance shards that a conversation needs, when the words of a message point to them.

- **Catalog:** `docs/worlds/index.json` lists every world, its schema, its shards and its sources and licenses.
- **Vocabulary index:** `docs/worlds/vocab.json` maps an English word to the shards where it matters, so a host can load
  knowledge lazily.
- **Documentation:** `docs/index.html` (how to use the catalog from an application) and `docs/worlds/README.md`.

Status: plan written, nothing imported yet. See [PLAN.md](PLAN.md) and [worker-tasks.md](worker-tasks.md).
Agents working here start with [AGENTS.md](AGENTS.md).

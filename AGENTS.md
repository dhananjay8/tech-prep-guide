# Diagram compatibility

- Draw.io cell IDs must not collide with JavaScript Array or Object prototype properties (for example, `keys`, `values`, `entries`, `map`, `push`, `constructor`, or `toString`). Older mxCodec versions use arrays as ID caches and can fail to open otherwise valid XML. Use descriptive, hyphenated IDs and update any parent/source/target references when renaming.
- XML validation and the latest diagrams.net viewer do not prove compatibility with older Draw.io editor extensions. When investigating loading failures, also test decoding with an array-backed `mxCodec.objects` cache.

# Cultural Labor Observatory Public Snapshot

This folder contains the static public edition of the Cultural Labor Observatory. It is safe to publish because it exposes the case index, coverage counts, selected cases, and methodology text without exposing the internal review interface, database credentials, local snapshots, or admin tools.

## Build

From the project root:

```bash
python3 outputs/public_observatory/build_public_observatory.py
```

The build creates:

```text
outputs/public_observatory/data/cases.js
```

## Preview

Open:

```text
outputs/public_observatory/index.html
```

Because the data is packaged as a JavaScript file, the page can be opened directly from the filesystem and can also be deployed as a static website.

## Publish

Deploy the contents of this folder to any static host:

- GitHub Pages
- Netlify
- Vercel
- institutional web space
- an object-storage static website

Recommended public files:

```text
index.html
styles.css
script.js
data/cases.js
README.md
.nojekyll
```

## Update Cycle

The public site should be rebuilt after each reviewed discovery/import cycle. The recurring 15-day automation should:

1. Run a balanced discovery search with multilingual and source-direct terms.
2. Log a new discovery session, including weak and negative results.
3. Export approved candidates to the case-seed registry.
4. Rebuild this public snapshot.
5. Leave new findings as candidates until manually reviewed.

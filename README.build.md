Build & lint instructions for Tidningssimulator

1) Install Node.js (macOS - Homebrew recommended):

```bash
brew install node
```

2) Install npm deps:

```bash
cd /Users/gmpethan/Documents/deploy/Tidningssimulator
npm install
```

3) Build the frontend bundle (produces `static/script.js`):

```bash
npm run build
```

4) Run linters:

```bash
npm run lint
```

Notes:
- This repo uses `esbuild` for a tiny build step that bundles `src/js/main.js` into `static/script.js`.
- The `src/js` modules are intentionally small stubs to start modularization; further migration should port logic from `static/script.js` into these modules incrementally.

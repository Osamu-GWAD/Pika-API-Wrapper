# Contributing

## Setup

```bash
npm install
```

## Workflow

```bash
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run test        # vitest
npm run build       # unbuild
npm run verify      # all of the above, in order
```

A pre-commit hook runs `lint-staged` (eslint --fix + prettier) automatically once you're inside a git repo (`git init` / clone) and have run `npm install`.

## Commits

Conventional Commits, enforced by commitlint on `commit-msg`:

```text
feat(types): add clan endpoint support
fix(guard): correct interval=yearly guard for unrankedpractice
docs(rate-limit): expand rate limiting guide
chore(version): bump zod
```

## Docs

```bash
npm run docs:dev    # local VitePress dev server
npm run docs:build  # static build to docs/.vitepress/dist
```

`docs:api` regenerates the TypeDoc reference and sidebar from `src/`, run it (or `docs:build`, which includes it) after any change to public exports.

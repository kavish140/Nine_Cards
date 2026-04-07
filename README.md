# Card Solver UI

A browser-based UI for the provided 9-card CLI solver.

## What it keeps intact

- Card parsing rules
- Match categories: Color, Sequence, Jump, Pair
- Recursive pair search logic
- Winner selection priority
- The same fallback rank ordering

## Run locally

Open `index.html` in a browser, or serve the folder with any static server.

## Deploy to GitHub Pages

This repo is already structured for GitHub Pages because the app is static and uses relative paths.

1. Push the repository to GitHub.
2. In repository settings, enable GitHub Pages using GitHub Actions.
3. Commit and push to `main`.
4. The workflow in `.github/workflows/deploy.yml` will publish the site.

## Input format

Paste cards the same way you would in the CLI:

`AS 10H 4D 7C JD 2S 8H QC 5D`

Invalid tokens are skipped, and the solver uses the first 9 valid cards, matching the original command-line behavior.

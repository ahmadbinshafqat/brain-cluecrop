# Changes: saved set search and filtering

Added search and filtering support to the saved flashcard sets sidebar.

## What changed

- `GET /api/flashcard-sets` now accepts optional query parameters:
  - `q`: keyword search across set title, source text, flashcard questions, and answers
  - `sort`: `recent`, `oldest`, `title`, or `cards`
  - `minCards`: only show sets with at least this many cards
- The sidebar UI now includes:
  - a search input
  - sort selector
  - minimum-card-count filter
  - a clear filters button
  - result counts and empty-state messaging
- Filtering happens through the existing API so the sidebar remains fast and useful as the number of saved sets grows.

## Integration

These files are modified in place and should be committed directly on top of the existing repo:

- `src/flashcards/flashcards.controller.ts`
- `src/flashcards/flashcards.service.ts`
- `public/app.js`
- `public/index.html`
- `public/styles.css`

Run as before:

```bash
npm install
npm run start:dev
```

Then open `http://localhost:3000` and use the new search/filter controls in the saved sets sidebar.
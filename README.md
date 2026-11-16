# Quest Journal

A personal quest journal as an installable web app. Teal and cream, nine tabs, and a magic-link sign-in. Your pages live in Supabase. Edits save there and into a log that gets read each morning.

The app is deployed at [https://checkyourpockets.github.io/quest-journal/](https://checkyourpockets.github.io/quest-journal/).

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173/quest-journal/](http://localhost:5173/quest-journal/). Sign in with the email that owns the journal. Supabase emails a magic link. Open that link in the same browser. The session stays until you sign out from the footer.

The Site URL and redirect allow list for the Supabase project need to include:

- `https://checkyourpockets.github.io/quest-journal/`
- `http://localhost:5173/quest-journal/`

### Dev fixture

Production builds do not contain journal data. For local UI work, put the two exports in a `fixtures/` folder (gitignored):

```bash
mkdir -p fixtures
# fixtures/questlog-data.json
# fixtures/web.json
```

Then open [http://localhost:5173/quest-journal/?fixture=1](http://localhost:5173/quest-journal/?fixture=1), or use **Use local fixture** on the sign-in screen. That path only exists while `npm run dev` is running. `npm run build` does not serve or bundle those files.

Do not commit `questlog-data.json`, `web.json`, or any export of finances, email, or journal text. This repository is public.

## How deploys work

Pushing to `main` runs `.github/workflows/pages.yml`. The workflow installs, tests, builds with Vite (`base` is `/quest-journal/`), and deploys the `dist` folder with `actions/deploy-pages`.

GitHub Pages has to use **GitHub Actions** as its source. In the repository: **Settings → Pages → Build and deployment → Source → GitHub Actions**. If the workflow cannot switch that setting itself, set it once by hand. The first successful run publishes the site.

## Data

Signed-in reads and writes go to `qj_docs` and `qj_events` on the Supabase project named in `src/config.ts`. The URL and publishable key are public. Row level security only returns rows whose `owner_email` matches the signed-in email.

Edits update the `collections` document (optimistic, then a short debounce) and append an event: `chronicle`, `habit_check`, `quest_update`, `backpack`, `rune_add`, `rune_review`, `reading_add`, or `story_request`. The footer notes that Chamwei reads the log and updates omens, episodes, and XP each morning.

The last loaded documents are cached in `localStorage`. If a save happens while offline, it stays in a queue on the device and flushes when the browser reconnects. A service worker caches the app shell so the journal can open without a network.

Rune reviews write the next due date back onto the rune in the `collections` document.

## Scripts

- `npm run dev` — local app
- `npm test` — view-model and tab render tests (no personal data)
- `npm run build` — typecheck and production build
- `npm run preview` — serve the production build

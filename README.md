# Daily Life

A personal daily planner, habit tracker, journal, and goals tracker. Installs
as a Progressive Web App on iPhone (Add to Home Screen) and works in any
browser on Windows. Data syncs across devices through a real Supabase account
(email + password), not local-only storage.

## Local development

```bash
npm install
npm run dev
```

Requires a Supabase project — see below — with `.env.local` filled in.

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run the contents of
   [`supabase/schema.sql`](supabase/schema.sql) to create the tables and Row
   Level Security policies. RLS is what makes it safe to talk to Supabase
   directly from the browser with no custom backend.
3. In **Project Settings → API**, copy the **Project URL** and **anon public**
   key.
4. Copy `.env.local.example` to `.env.local` and fill both in:

   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. Sign-up is open in the app (no invite system) — create your one account
   from the sign-in screen the first time you run the app.

## Google Calendar setup (optional)

The Planner page can show your Google Calendar events (read-only) alongside
the schedule grid and in an all-day events section. This is entirely
client-side — there's no backend to hold a refresh token, so the connection
uses short-lived (~1hr) access tokens and re-prompts you to reconnect
periodically. Skip this section if you don't want calendar sync; the rest of
the app works fine without it.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create a new project (or use an existing one).
2. **APIs & Services → Library** → search for and enable the **Google
   Calendar API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External** (fine to leave in **Testing** mode — you never
     need to submit for Google's verification since you're the only user).
   - Fill in the required app name/support email fields.
   - Under **Test users**, add your own Google account email.
4. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Under **Authorized JavaScript origins**, add `http://localhost:5173`
     (for local dev) and your deployed GitHub Pages URL (e.g.
     `https://<username>.github.io`) once you have one.
   - No redirect URI needed for this flow.
5. Copy the generated **Client ID** (looks like
   `123-abc.apps.googleusercontent.com`) into `.env.local`:

   ```
   VITE_GOOGLE_CLIENT_ID=123-abc.apps.googleusercontent.com
   ```

6. For the deployed build, also add `VITE_GOOGLE_CLIENT_ID` as a repo secret
   (see Deployment below) and add the Pages URL to the OAuth client's
   authorized origins from step 4 once you know it.
7. In the app, click **Connect Google Calendar** on the Planner page and
   approve access. Read-only scope — nothing is ever written back to your
   calendar.

Note: silent reconnection on page reload relies on third-party-cookie access
to Google, which iOS Safari restricts. On iPhone you may need to tap
**Connect Google Calendar** again more often than on desktop.

## Deployment (GitHub Pages)

This repo's [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds and deploys to GitHub Pages on every push to `main`.

1. Push this project to a GitHub repository, e.g. `daily-life-app`.
2. In the repo's **Settings → Pages**, set the source to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions**, add repo secrets
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and (if using Google
   Calendar sync) `VITE_GOOGLE_CLIENT_ID` — same values as `.env.local`.
   These get baked into the client bundle at build time; all three are safe
   to expose publicly (the Supabase anon key and Google OAuth client ID are
   both designed for client-side use — RLS and Google's own origin checks
   are the real access control, not secrecy of these values).
4. Push to `main`; the Pages URL appears in the workflow run summary.
5. On your iPhone, open the deployed URL in Safari, tap the Share icon, then
   **Add to Home Screen**. On Windows, most browsers offer an install icon in
   the address bar.

## Data model

Each module (planner, habits, journal, goals) has its own Supabase tables,
documented in [`supabase/schema.sql`](supabase/schema.sql). Every table
carries a `user_id` column enforced by Row Level Security, so each signed-in
user only ever sees their own rows.

## Offline behavior

The app shell (JS/CSS/HTML/icons) is precached and opens instantly offline.
Supabase reads/writes are **not** cached or queued offline — actions made
without a connection fail visibly rather than silently queuing.

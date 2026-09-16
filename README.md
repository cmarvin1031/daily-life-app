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

5. Create your one account from the Supabase dashboard: **Authentication →
   Users → Add user** (tick "Auto Confirm User"). There's deliberately no
   sign-up form in the app.
6. Lock the project down so the public Pages URL can't be used to create
   accounts against it: **Authentication → Providers → Email** → turn off
   **Allow new users to sign up**.
7. So password-reset emails link back to the app instead of the default
   `localhost:3000`: **Authentication → URL Configuration** → set **Site
   URL** to your deployed Pages URL, and add both that URL and
   `http://localhost:5173` under **Redirect URLs**.

## Google Calendar sync (optional)

The Planner and Dashboard show your Google Calendar events (read-only)
alongside the schedule. Rather than the browser talking to Google, a small
**Supabase Edge Function** ([`supabase/functions/sync-google-calendar`](supabase/functions/sync-google-calendar/index.ts))
runs once a day (and on demand from **Settings → Sync now**), pulls the next
90 days / last 30 days of events from every calendar you have **ticked in
Google Calendar's sidebar**, and mirrors them into a `calendar_events`
table. The app just reads that table like everything else — no tokens in
the browser, nothing to reconnect on your phone. Skip this section if you
don't want calendar sync; the rest of the app works without it.

Setup is one-time. It's the only server-side piece in the project, so it's
the longest section here, but each step is small.

### A. Google Cloud (a client that can hold a refresh token)

1. [console.cloud.google.com](https://console.cloud.google.com) → create a
   project (or reuse one). **APIs & Services → Library** → enable the
   **Google Calendar API**.
2. **APIs & Services → OAuth consent screen** (now under *Google Auth
   Platform* in newer consoles):
   - User type **External**; fill in the app name and support email.
   - Add the scope `https://www.googleapis.com/auth/calendar.readonly`.
   - **Publishing status must be "In production"**, not "Testing". Google
     expires the refresh tokens of Testing-mode apps after 7 days, which
     would silently break the sync weekly. Click **Publish app**; you'll see
     a note about verification — ignore it. An unverified app just shows a
     warning screen the one time you authorize it below.
3. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**:
   - Application type **Web application**.
   - Under **Authorized redirect URIs** add
     `https://developers.google.com/oauthplayground`.
   - Save, then copy the **Client ID** and **Client secret**. The secret is
     a real secret: it goes only into Supabase (step C), never into the
     repo or `.env.local`.

### B. Get a refresh token (once, in the OAuth Playground)

1. Open [developers.google.com/oauthplayground](https://developers.google.com/oauthplayground).
2. Click the ⚙️ gear (top right) → tick **Use your own OAuth credentials**
   → paste the Client ID and Client secret from A3.
3. In the left panel, find **Calendar API v3** and tick
   `https://www.googleapis.com/auth/calendar.readonly`, then **Authorize
   APIs**. Sign in with the Google account whose calendar you want, click
   through the "unverified app" warning (**Advanced → Go to …**), and allow.
4. Back in the Playground, click **Exchange authorization code for tokens**.
   Copy the **Refresh token**. (The access token shown alongside it is
   irrelevant — the function mints its own.)

### C. Supabase (table, function, secrets, schedule)

1. **SQL Editor**: run the `calendar_events` section at the bottom of
   [`supabase/schema.sql`](supabase/schema.sql) (just that section if the
   rest of the schema already exists).
2. Find your **user id**: **Authentication → Users** → click your user →
   copy the UUID. And your **project ref**: it's the `xxxxx` in
   `https://xxxxx.supabase.co`.
3. **Edge Functions → Secrets** (or **Manage secrets**) → add:

   | Name | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | from A3 |
   | `GOOGLE_CLIENT_SECRET` | from A3 |
   | `GOOGLE_REFRESH_TOKEN` | from B4 |
   | `SYNC_USER_ID` | your user UUID from C2 |
   | `SYNC_SECRET` | any long random string — it's the password the cron job uses to call the function. Generate one with `openssl rand -hex 32` or a password manager. |
   | `SYNC_ALL_CALENDARS` | *(optional)* `true` to sync every calendar rather than only the ticked ones |

4. Deploy the function from this repo (the Supabase CLI runs through `npx`,
   nothing to install):

   ```bash
   npx supabase login
   ```

   ```bash
   npx supabase link --project-ref <PROJECT_REF>
   ```

   ```bash
   npx supabase functions deploy sync-google-calendar --no-verify-jwt
   ```

   `--no-verify-jwt` is required: the function does its own auth (the
   shared secret for cron, or your signed-in session for the Settings
   button), and the gateway's default JWT check would block the cron call.
5. Test it: open the app → **Settings → Sync now**. You should get a toast
   like "Calendar synced — 42 events from 3 calendars", and events appear
   on the Planner. If it fails, the toast shows the function's own error
   message; the function's logs are under **Edge Functions →
   sync-google-calendar → Logs**.
6. Schedule it: enable **Cron** under **Integrations** (this turns on
   `pg_cron`), enable **pg_net** under **Database → Extensions**, then in
   the **SQL Editor** run [`supabase/calendar_sync_cron.sql`](supabase/calendar_sync_cron.sql)
   after replacing its two placeholders (`<PROJECT_REF>`, `<SYNC_SECRET>`).
   It runs daily at 10:00 UTC; the file says how to change that.

### How it behaves

- **Which calendars**: only the ones ticked in Google Calendar's left-hand
  sidebar (that's Google's `selected` flag). Untick "Holidays in United
  States" there and it drops out of the app on the next sync — no picker
  needed in the app itself. Set the `SYNC_ALL_CALENDARS` secret to `true`
  to ignore this and sync everything.
- **Window**: 30 days back to 90 days ahead. Days outside that show no
  events. Deleted or moved events disappear on the next sync.
- **Freshness**: as of the last sync — daily by default, or whenever you
  press **Sync now**. Recurring events are expanded by Google, so every
  instance shows.
- **Secrets**: the Google client secret and refresh token live only in the
  function's secrets. The browser bundle contains nothing Google-related
  anymore, and the `calendar_events` table has no write policy for users,
  so nothing the browser holds can modify it.

## Deployment (GitHub Pages)

This repo's [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds and deploys to GitHub Pages on every push to `main`.

1. Push this project to a GitHub repository, e.g. `daily-life-app`.
2. In the repo's **Settings → Pages**, set the source to **GitHub Actions**.
3. In **Settings → Secrets and variables → Actions**, add repo secrets
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — same values as
   `.env.local`. These get baked into the client bundle at build time; both
   are safe to expose publicly (the anon key is designed for client-side
   use — RLS is the real access control, not secrecy of the key).
4. Push to `main`; the Pages URL appears in the workflow run summary.
5. On your iPhone, open the deployed URL in Safari, tap the Share icon, then
   **Add to Home Screen**. On Windows, most browsers offer an install icon in
   the address bar.

## Data model

Each module (planner, habits, journal, goals) has its own Supabase tables,
documented in [`supabase/schema.sql`](supabase/schema.sql). Every table
carries a `user_id` column enforced by Row Level Security, so each signed-in
user only ever sees their own rows.

## Offline behavior & errors

The app shell (JS/CSS/HTML/icons) is precached and opens instantly offline.
While offline, a banner shows at the top, reads show whatever was last
cached, and writes are paused and replayed once the connection returns —
but only for as long as the app stays open; a reload while offline drops
anything still pending. Any read or write that fails for another reason
(server error, expired session, Google Calendar hiccup) surfaces as a toast
at the bottom of the screen rather than failing silently.

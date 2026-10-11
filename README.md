# Coat of Arms Collector — Vercel account version

This is the current game plus username/password accounts and shared cloud saves. Player coins and collections are stored per account. Packs, coats, uploaded coat images, pack logos and trivia are shared game content. Only the `blobby` account can see/use Admin and publish shared content.

## Before you deploy: back up your existing game

1. Open the **old game file in the browser where your content is saved**.
2. Sign into Admin and choose **Export backup**. Copy the full JSON into a text file and keep it safe.
3. Do not clear browser data or delete the old file until the new site is working.

Browser storage for a `file://` HTML file does not automatically move to your Vercel domain. After deploying, you will import this backup into the new cloud game.

## 1. Create a Supabase project

1. Create a project at https://supabase.com/.
2. Open **SQL Editor → New query**.
3. Paste and run `supabase/schema.sql`.
4. In **Project Settings → API** (or **Connect**), copy the Project URL, publishable/anon key, and service-role/secret key. The service-role key must remain secret.

## 2. Deploy to Vercel

1. Upload this folder to a private Git repository, or import the folder with Vercel.
2. In Vercel → Project → **Settings → Environment Variables**, add:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_ANON_KEY` — your publishable/anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — your service-role key (server-side only; never put this in `index.html`)
   - `ADMIN_PASSWORD` — set this privately to `Coccinella214700` to match the requested admin password. If the repository will be public, consider choosing a new private password before launch.
3. Redeploy after adding the variables.

## 3. Create your admin account

On the deployed site, choose **Create account** and register username `blobby` with the exact password configured in `ADMIN_PASSWORD`. The server reserves `blobby`; nobody can register it with a different password. After login, the Admin button/tab appears. Other usernames never see those controls, and Supabase row-level security also blocks them from changing the shared catalog.

Normal players can register any other 3–20 character username using letters, numbers and underscores plus a password of at least 8 characters. No email address is required; the server creates a confirmed internal auth email for each username.

## 4. Import your old game content

1. Log in to the deployed site as `blobby`.
2. Open Admin → **Import backup** and paste the JSON you exported from the old game.
3. Import it. The game catalog (packs, coats, images, rarity, logos and trivia) is synced to Supabase. Your admin player save is also restored from that backup.
4. Reload the site and verify a pack, collection, and coin balance before inviting players.

The first admin login seeds cloud content from that browser's local copy only if the cloud catalog is empty. If you deploy from a different browser/device, use the export/import steps above to move your curated content.

## Notes

- Cloud saves require the deployed Vercel site and configured Supabase project. **Continue offline** is local-browser-only and will not sync to other devices.
- `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` belong only in Vercel environment variables, never in frontend code.
- This app stores the current artwork as base64 in the game JSON. If the catalog grows to hundreds/thousands of high-resolution images, move artwork into Supabase Storage to keep the game-content row smaller.
- This project uses Supabase Auth's password hashing and access tokens; passwords are not stored in the game database.

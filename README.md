# Akụkọ N'asụsụ Igbo

An editorial media site that gathers a Facebook-hosted video page and written stories into one publication, with a private admin dashboard for the editor.

- **Public site:** Home, Videos, Blog, article pages, About. Server-rendered and statically cached, so it is fast and fully indexable.
- **Admin (`/admin`):** sign in, then create, edit, draft, publish and delete posts, upload thumbnails, pin the homepage lead, and edit the About text and site name.
- **No public link to the admin.** Nothing on the public site points to `/admin`, and `robots.txt` and `noindex` keep it out of search.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4, hand-built components (no UI kit) |
| Backend, database, auth, file storage | [Convex](https://convex.dev) with Convex Auth (email and password) |
| Rich text | TipTap |
| Icons | Lucide |
| Type | Fraunces (headlines), Newsreader (article text), Geist (interface), loaded with `next/font` |
| Facebook videos | Plain `<iframe>` embeds. No Facebook JavaScript SDK. |

## Run it locally

You need Node 20.9 or newer and a free [Convex account](https://dashboard.convex.dev).

```bash
# 1. Get the code
git clone <your-repo-url> akuko
cd akuko
npm install

# 2. Provision your Convex backend. This opens a browser to sign in, creates a
#    project, writes NEXT_PUBLIC_CONVEX_URL into .env.local, and then keeps
#    watching convex/. Leave it running in its own terminal.
npx convex dev
```

In a second terminal:

```bash
# 3a. Generate the signing keys Convex Auth needs and set them on your dev deployment
npm run setup:auth

# 3b. Create the one admin account (see "Creating the admin" below)
npx convex run seed:createAdmin '{"email":"you@example.com","password":"a-long-passphrase"}'

# 3c. Optional: add realistic sample posts so the design has something to show
npx convex run seed:sampleContent

# 4. Add the site URL to .env.local (copy the rest from .env.example if you like)
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" >> .env.local

# 5. Run the site
npm run dev
```

Open <http://localhost:3000>. The dashboard is at <http://localhost:3000/admin> (there is deliberately no link to it).

### Creating the admin

There is no sign-up form. The owner account is created once, from your terminal, and Convex Auth's sign-up flow is switched off in `convex/auth.ts`, so nobody else can register.

```bash
# macOS / Linux / Git Bash
npx convex run seed:createAdmin '{"email":"you@example.com","password":"a-long-passphrase"}'
```

```powershell
# Windows PowerShell
npx convex run seed:createAdmin "{\"email\":\"you@example.com\",\"password\":\"a-long-passphrase\"}"
```

Passwords must be at least 12 characters. The command refuses to run if an account already exists. To change the password later (this also signs out existing sessions):

```bash
npx convex run seed:setAdminPassword '{"email":"you@example.com","password":"a-new-long-passphrase"}'
```

For your production deployment, add `--prod` to any `npx convex run` command.

### Sample content

`seed:sampleContent` inserts six articles and four videos with Igbo and English headlines. The four sample videos all point at Facebook's own demo video so the embed frames render; replace or delete them from `/admin` once you have real videos. Sample posts have no thumbnails, so they show the typographic fallback tile.

## Deploy: GitHub to Vercel

1. **Push to GitHub.** `.env.local` is git-ignored; no secrets are committed.

   ```bash
   git init && git add . && git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Get a production deploy key.** In the Convex dashboard open your project, then Settings, then URL & Deploy Key, and generate a **Production** deploy key.

3. **Import the repo in Vercel.** It detects Next.js on its own. Before the first deploy, set:

   - **Build Command** (override): `npx convex deploy && npx convex deploy --cmd 'npm run build'`
     The first command pushes `convex/` to your production Convex deployment. The second runs the build, and the Convex CLI supplies `NEXT_PUBLIC_CONVEX_URL` to it. Both are needed: the public pages read from Convex while they are being built, so the functions must already exist there, and `--cmd` on its own runs the build *before* pushing the functions (the first build then fails with a "Server Error" from `posts:listPublished`). The second push is a no-op.
   - **Environment variables** (scope them to **Production** only, so preview builds never touch your live backend):
     | Name | Value |
     |---|---|
     | `CONVEX_DEPLOY_KEY` | the production deploy key from step 2 (mark it Sensitive) |
     | `NEXT_PUBLIC_SITE_URL` | optional; your public origin, e.g. `https://akuko.example.com` (no trailing slash). If empty, Vercel's production domain is used automatically. |

     You do not need to set `NEXT_PUBLIC_CONVEX_URL` in Vercel. (If you ever set it by hand, it must be the **production** URL, never the dev one from `.env.local`.)

4. **Give the production deployment its auth keys, once.** From your machine:

   ```bash
   npm run setup:auth -- --prod --site-url https://akuko.example.com
   ```

   If that asks you to log in, run `npx convex login` first, or set `CONVEX_DEPLOY_KEY` in your shell for the command.

5. **Create the production admin**, then deploy:

   ```bash
   npx convex run --prod seed:createAdmin '{"email":"you@example.com","password":"a-long-passphrase"}'
   ```

Every later `git push` redeploys both the backend and the site.

### Environment variables

Everything is listed in [`.env.example`](.env.example). In short:

- `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_SITE_URL`: read by Next.js.
- `CONVEX_DEPLOY_KEY`: Vercel only, so the build can deploy `convex/`.
- `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`: live on the Convex deployment itself; `npm run setup:auth` sets them.

## How it works

```
app/(site)/         public pages: /, /videos, /blog, /blog/[slug], /about
app/admin/          login, and the (dashboard) group: posts, new/edit post, settings
app/sitemap.ts      sitemap.xml built from published posts
app/robots.ts       robots.txt (disallows /admin and /api)
app/opengraph-image.tsx   default share image for pages without a thumbnail
proxy.ts            redirects signed-out visitors away from /admin
components/site/    masthead, footer, cards, editorial grid, article tools
components/admin/   sidebar pieces, post form, TipTap editor, uploader, toasts
convex/schema.ts    posts and settings tables (plus the auth tables)
convex/posts.ts     public queries, admin queries, create / update / remove
convex/settings.ts  site name, About text, featured post
convex/files.ts     upload URL for thumbnails (Convex file storage)
convex/auth.ts      email and password auth, sign-up disabled
convex/seed.ts      createAdmin, setAdminPassword, sampleContent (internal only)
convex/lib/         validation, slugs and Facebook-embed parsing shared by client and server
```

### Content model

A **post** is either a *video* (a Facebook embed plus a description) or a *blog* article (a TipTap body). Both have a title, category (free text), thumbnail, publish date and a Draft or Published status. Only published posts are ever returned by the public queries.

### Facebook embeds

Paste the iframe code from Facebook's Embed dialog (or just a video link). The app extracts the `src`, checks it points at `facebook.com/plugins/...`, and renders its own iframe in a fixed 16:9 frame. Anything else is rejected, on the client and again on the server. Inside an article, use the video button in the editor toolbar; the saved HTML is sanitised again when the page renders.

### Featured post

Settings, then Homepage lead, pins any *published* post as the front-page lead. With none pinned, the newest post leads. Unpublishing or deleting a pinned post unpins it.

### Caching

Public pages are statically generated and refreshed in the background at most every 60 seconds (`export const revalidate = 60`), so a newly published post can take up to a minute to appear. Change the number in each page if you want faster or slower.

## Security notes

- Sign-up and password reset are not enabled; the only account is the one you seed.
- Every admin query and mutation calls `requireAdmin` on the server. The `proxy.ts` redirect only keeps the screens from rendering.
- Seed commands are `internal` Convex functions: they cannot be called from a browser.
- Article HTML and embed URLs are validated on save and sanitised on render.
- Thumbnails are checked to be images under 10 MB before they are attached to a post.
- No secrets are committed. Rotate the signing keys with `npm run setup:auth -- --force` (this signs the admin out).

## Known limits

- The unsaved-changes guard covers closing or reloading the tab and every in-app link and the sidebar. The browser's own Back button inside the app cannot be intercepted by a Next.js app, so it is not covered.
- A thumbnail is uploaded the moment you choose it. If you upload one and then abandon the post without saving, that file stays in Convex storage until you clear it from the dashboard.
- The wordmark, footer and About page use the site name from Settings, but the default share image (`app/opengraph-image.tsx`) is rendered at build time with the default name.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | Type-check the app and `convex/` |
| `npm run setup:auth` | Generate and set the Convex Auth signing keys |

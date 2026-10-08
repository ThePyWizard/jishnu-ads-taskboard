# Ad Ledger

A shared notebook for Lascade's ad work: log every change you make in Meta, Google Ads or any other ad manager,
plus your daily tasks, so your cofounder can follow the history of each app's campaigns
(TravelAnimator, MarineRadar, AR Measure, GeoAnimator, Pingee).

Everything is entered by hand. There are no ad platform connections or API keys.

**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Postgres, email + password sign-in, row level security) · Vercel (hosting).

## What it does
- Log a change: app, platform, what changed, campaign name, before → after, and why.
- Timeline grouped by day, filterable by app, platform or text.
- One owner adds and edits everything; viewers see the same history, read-only.
- Daily task list; unfinished tasks carry over to the next day.
- 12-week activity grid, changes per app this week, and a day streak.

## Setup

### 1. Supabase
1. Create a project at supabase.com.
2. In **SQL Editor**, run the files in `supabase/migrations/` in order (`…000000_init.sql`, then `…010000_owner_viewer_roles.sql`).
3. **Authentication → Users → Add user → Create new user**: create an account for the owner and one for each viewer,
   each with an email and password. Tick **Auto Confirm User** so no confirmation email is needed.
4. **Authentication → Sign In / Providers → Email**: turn off **Allow new users to sign up**, so nobody else can
   create an account. The app has no sign-up page; accounts only come from step 3.
5. Add the members and their roles:
   ```sql
   insert into members (email, role) values
     ('owner@yourcompany.com', 'owner'),     -- adds and edits changes and tasks
     ('cofounder@yourcompany.com', 'viewer'); -- read-only
   ```
   The database enforces this: a viewer cannot add, edit or delete anything, even outside the app.

### 2. Run locally
```bash
cp .env.example .env.local   # fill in the Supabase values
npm install
npm run dev                  # http://localhost:3000
```

### 3. Deploy
1. Push this folder to a GitHub repo and import it in Vercel.
2. Add the variables from `.env.example` under Settings → Environment Variables.

## Ideas for later
- Daily Slack or email digest of yesterday's changes for your cofounder.
- Weekly plain-English summary written by the Claude API.
- Note spend and CPI next to each change, to see what a change actually did.

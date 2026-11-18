# One-time setup

You make 4 accounts (2 YouTube channels, 2 Instagram accounts), connect them to this GitHub repo through 8 secrets,
and test. About 2 hours, done once.

**Golden rule:** keys and tokens go only into GitHub (Settings → Secrets and variables → Actions → **Repository
secrets**), never into a chat or a screenshot. Paste carefully: a stray space or line break is fixed automatically
for YouTube, but check anyway.

**Names:** English = **Cutaway**, Indonesian = **Bongkar Pasang**. Artwork is in `assets/profile/`.

| Part | What you get | Secrets |
|---|---|---|
| 1. YouTube channels | 2 channels | none yet |
| 2. YouTube API | upload and stats access | `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN_EN`, `YT_REFRESH_TOKEN_ID` |
| 3. Instagram accounts + Facebook Pages | 2 accounts linked to 2 Pages | none yet |
| 4. Instagram API | upload and stats access | `IG_USER_ID_EN`, `IG_TOKEN_EN`, `IG_USER_ID_ID`, `IG_TOKEN_ID` |
| 5. GitHub settings and tests | switch it on | optional variables `POSTING`, `PRIVACY` |

---

## 1. YouTube channels

1. Sign in to YouTube with one Google account. It can own both channels.
2. Click your profile picture → **Create a channel** (or Settings → Add or manage your channel(s)). Make one called
   **Cutaway** (English) and one called **Bongkar Pasang** (Indonesian). Each is a "brand account" channel.
3. Upload the artwork (YouTube Studio → Customization → Branding):
   - `avatar-en.png` / `avatar-id.png` → **Picture**
   - `banner-en.png` / `banner-id.png` → **Banner image**
4. Optional: put your affiliate or Gumroad link in each channel's description once you have one.

## 2. YouTube API (free)

1. <https://console.cloud.google.com> → create a project → **APIs & Services → Library** → enable **YouTube Data API v3**
   and **YouTube Analytics API**.
2. **OAuth consent screen** (Google calls it "Branding" and "Audience"): type External. Fill the app name, support
   email, home page and privacy policy link. Both links must be on a domain listed under **Authorised domains**. Free
   route: turn on GitHub Pages for this repo (Settings → Pages → Deploy from a branch → `main`, folder `/docs`), then use
   `https://qiiiiyr.github.io/Content/` (home page), `https://qiiiiyr.github.io/Content/privacy.html` (privacy policy)
   and add `qiiiiyr.github.io` as an authorised domain. Then press **Publish app** so it is "In production". In
   "Testing", your login expires every 7 days and posting stops.
3. **Credentials → Create credentials → OAuth client ID → Web application**, authorised redirect URI
   `https://developers.google.com/oauthplayground`. Save the client ID and client secret as the secrets `YT_CLIENT_ID`
   and `YT_CLIENT_SECRET`.
4. Get one refresh token per channel at <https://developers.google.com/oauthplayground>: gear icon → tick "Use your own
   OAuth credentials" → paste the ID and secret. In "Input your own scopes" paste
   `https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly`
   → **Authorize APIs** → when Google asks which account or channel, **pick the Cutaway (EN) channel** → **Exchange
   authorization code for tokens** → copy the **refresh token** into the secret `YT_REFRESH_TOKEN_EN`. Repeat with the
   Bongkar Pasang channel for `YT_REFRESH_TOKEN_ID`.
5. Uploads from new API projects may be forced to **private** until YouTube audits the project. If your first test
   video stays private even though uploads are public, request the free audit:
   <https://support.google.com/youtube/contact/yt_api_form>. Until it passes, publish by hand from the preview links
   during your weekly review.

## 3. Instagram accounts and Facebook Pages

The posting code can only reach an Instagram account that is a **Creator** (or Business) account **linked to a
Facebook Page**. Do the steps below **twice**: once for Cutaway (EN), once for Bongkar Pasang (ID).

You need one personal **Facebook profile** to own both Pages. Use the same one you will later use for the Meta
developer app (part 4). If you do not have one, create it at facebook.com first.

**A. Create the Instagram account**
1. Instagram app or instagram.com → **Sign up**. Use a different email for each account (a `+alias` of the same
   address works, for example `you+cutaway@gmail.com`). Username: the brand name, for example `cutaway.tech` or
   `bongkarpasang`.
2. Upload `avatar-en.png` / `avatar-id.png` as the profile photo.

**B. Switch it to a Creator account**
1. Profile → menu (☰) → **Settings and privacy** → **Account type and tools** → **Switch to professional account**.
2. Choose **Creator**, pick a category (for example "Education" or "Science & Technology"), finish. If asked to
   connect Facebook, skip for now; you do it in step D.

**C. Create the Facebook Page**
1. Logged in to Facebook as your personal profile: <https://www.facebook.com/pages/create>.
2. Page name: **Cutaway** (or **Bongkar Pasang**). Category: "Video creator" or "Education website". Create it.
   Nobody needs to follow it or see it; it only has to exist.

**D. Link the Instagram account to the Page**
1. Instagram → **Edit profile** → **Page** (under "Public business information") → **Connect or create** → choose the
   Page you just made. If you cannot find it: on Facebook open the Page → **Settings** → **Linked accounts** →
   **Instagram** → **Connect account**, and log in to the Instagram account.
2. **Check:** the Page's Settings → Linked accounts shows your Instagram account.

When both accounts are done, you have: 2 Instagram Creator accounts, 2 Facebook Pages, each linked.

## 4. Instagram API (free)

Meta calls it the "Instagram Graph API". It is not a separate site: you make a Meta app and add Instagram to it.

**A. Make the Meta app (once)**
1. <https://developers.facebook.com> → log in with the same Facebook profile → accept the developer terms (it may ask
   to verify your phone or email) → **My Apps** → **Create app**.
2. App name: `Cutaway uploader`. Choose the use case **Manage messaging & content on Instagram**. If you do not see
   it, choose **Other** → **Business** instead, then in the app dashboard click **Add product** and add
   **Instagram**. If asked for a business portfolio, you can skip it.
3. In the use case, click **Customize** → **Add all required permissions**. Also make sure these are listed:
   `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_show_list`,
   `pages_read_engagement`, `business_management`.
4. Leave the app in **Development mode**. As its admin you can use your own two accounts without Meta's App Review.

**B. Get a token (once for both accounts)**
1. Open the Graph API Explorer: <https://developers.facebook.com/tools/explorer>. In the right panel choose your app.
   Under "User or Page" choose **User Token**.
2. In **Permissions** add the six permissions above, then click **Generate Access Token**. Facebook shows a pop-up: when
   it asks which Pages, tick **both** Pages, and when it asks about Instagram accounts, tick **both**. Continue.
3. **Make it long-lived:** open <https://developers.facebook.com/tools/debug/accesstoken>, paste the token, press
   **Debug**, then **Extend Access Token**, and copy the new long token.

**C. Get the two Page tokens and the two Instagram IDs**
1. Back in the Explorer, paste the long token into the **Access Token** box. Set the request to `GET` and the field to
   `me/accounts`, and click **Submit**. The result lists each Page with a `name`, an `id` and an `access_token`.
   These Page tokens **do not expire** (confirm one by pasting it into the Access Token Debugger: "Expires: Never").
2. For each Page, run `GET <page id>?fields=instagram_business_account`. The `id` inside `instagram_business_account`
   is the **Instagram user ID** (a long number, not the username).
3. Write the secrets (GitHub → Settings → Secrets and variables → Actions → New repository secret):

| Secret | Value |
|---|---|
| `IG_USER_ID_EN` | Instagram user ID of the Cutaway account |
| `IG_TOKEN_EN` | `access_token` of the **Cutaway Page** |
| `IG_USER_ID_ID` | Instagram user ID of the Bongkar Pasang account |
| `IG_TOKEN_ID` | `access_token` of the **Bongkar Pasang Page** |

## 5. GitHub settings and tests

1. Settings → General → make `main` the default branch (scheduled workflows only run there).
2. Settings → Actions → General → Workflow permissions: **Read and write**, and tick "Allow GitHub Actions to create
   and approve pull requests" (needed for the preview comments).
3. Add the 8 secrets from parts 2 and 4. Posting is **on and public** by default: per language, YouTube once a day and Instagram twice:
   ID YouTube 19:17 WIB, Instagram 11:47 and 19:19 WIB; EN YouTube 12:23 New York, Instagram 12:25 and 17:25 New York.
   An hourly run posts whatever is due, so a slot goes out within the hour after its time, and missed slots catch up. Two optional repository **variables** (Settings → Secrets and variables → Actions →
   Variables) change that: `POSTING` = `off` pauses the schedule, `PRIVACY` = `private` uploads YouTube videos as
   private (Instagram has no private mode).
4. **Check logins.** Actions → **publish** → Run workflow → lang `en`, dry run ticked. The log prints, for each of the
   4 accounts, either `login OK -> <channel or @username>` or what is wrong and how to fix it (secret values are never
   printed). Fix anything red and run again.
5. **Test a real post.** Run again with dry run unticked (set "only" to `youtube` or `instagram` to test one platform).
   Both are public unless `PRIVACY` = `private`. Look at both.
6. Actions → **collect stats** → Run workflow: writes `data/stats/<week>.json`. Its `unresolvedCompetitors` list shows
   handles the weekly review will fix.
7. Actions → **snapshot** runs every day at 10:30 WIB and writes `data/snapshot.json` (followers, views, likes and
   comments for all 4 accounts). A red run means one login needs fixing; the dashboard shows these numbers.
8. Done: posting runs on that schedule (step 3): each language gets 1 YouTube Short and 2 Instagram Reels a day, until the queue
   runs out (the weekly pull request refills it).

## If something fails

| Message | Meaning and fix |
|---|---|
| `invalid_client` (YouTube) | Google does not know this client ID. Copy the ID and secret again from Google Cloud → Credentials; both must be repository secrets. |
| `invalid_grant` (YouTube) | Refresh token expired or revoked, often because the app is still in "Testing". Publish the app, then redo the token in the OAuth Playground. |
| Instagram `code 190` | Token expired or invalid. Redo part 4C and update the secret. |
| Instagram `code 100` | Wrong Instagram user ID, or the token's Page is not the one linked to that account. Redo part 4C step 2 with the right Page. |
| Instagram `code 10` / permission error | Add the missing permission (part 4A step 3), then make a new token. |
| `me/accounts` returns nothing | In the pop-up of part 4B you did not tick the Pages. Generate the token again and tick both. |
| Account not found when linking | The Instagram account is not Creator/Business yet (part 3B), or you are logged in to the wrong Facebook profile. |

## Your weekly routine (about 20 minutes, Saturday evening or Sunday morning)

Open the dashboard's **Weekly review** section: read the report, watch the previews (English and Indonesian), untick
anything wrong, press **Approve and merge**. A Claude task (every 2 hours on weekends) unticks those items in the pull
request and merges it; unticked episodes and an unticked theme switch are then removed automatically. You can still
review on GitHub instead: open the "Weekly review" pull request, untick, merge.

## Artwork reference

`assets/profile/`: `avatar-*.png` (profile picture, both platforms crop it to a circle), `banner-*.png` (YouTube
banner only), `logo-*.png` (name next to the mark, for posts), `loop-*.mp4` (4 s animated logo for Instagram Stories;
neither platform plays an animated profile picture). Re-render after a change with
`npx remotion still src/index.ts Avatar assets/profile/avatar-en.png --props='{"lang":"en"}'` (compositions `Avatar`,
`Logo`, `Banner`, `AvatarLoop` in `src/Brand.tsx`).

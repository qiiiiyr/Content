# One-time setup (about 2 hours)

You create 4 accounts, connect them to the GitHub repo with 8 secrets, and test. Paste keys and tokens only into
GitHub's **Settings → Secrets and variables → Actions**, never into a chat.

## 1. Accounts

1. Pick a broad brand name that fits every theme in `themes.json` (for example "How It Actually Works"), with an
   Indonesian variant (for example "Cara Kerjanya").
2. **YouTube:** create 2 channels (EN and ID). One Google account can own both as brand channels.
3. **Instagram:** create 2 accounts, switch each to a **Creator** account (Settings → Account type), and link each
   to its own **Facebook Page** (Instagram → Settings → Accounts Center). The Page link is required for posting
   from code and for reading competitor accounts.
4. Put your affiliate / Gumroad link in each bio once you have one.

## 2. YouTube API (free)

1. <https://console.cloud.google.com> → new project → **APIs & Services → Library**: enable **YouTube Data API v3**
   and **YouTube Analytics API**.
2. **OAuth consent screen**: External, add your email as a test user, then press **Publish app** so it is
   "In production". In "Testing" your login expires every 7 days and posting stops.
3. **Credentials → Create credentials → OAuth client ID → Web application**, authorised redirect URI
   `https://developers.google.com/oauthplayground`. Save the client ID and secret as secrets `YT_CLIENT_ID` and
   `YT_CLIENT_SECRET`.
4. Get a refresh token per channel at <https://developers.google.com/oauthplayground>: gear icon → "Use your own
   OAuth credentials" → paste the ID and secret. In "Input your own scopes" paste
   `https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly`
   → Authorize → **choose the EN channel** when Google asks which account → "Exchange authorization code for
   tokens" → copy the refresh token into secret `YT_REFRESH_TOKEN_EN`. Repeat choosing the ID channel for
   `YT_REFRESH_TOKEN_ID`.
5. Uploads from new API projects may be forced to **private** until YouTube audits the project. After your first
   test upload (step 5 below), if the video is stuck as private, request the free audit:
   <https://support.google.com/youtube/contact/yt_api_form>. Until it passes, publish the week's Shorts by hand
   from the preview links during your Sunday review.

## 3. Instagram API (free)

1. <https://developers.facebook.com> → **Create app** → use case "Manage messaging & content on Instagram" (or
   "Other → Business"). Keep it in **Development mode**: as the app's admin you can use your own accounts without
   App Review.
2. Add the **Instagram Graph API** (Instagram API with Facebook Login) product.
3. **Graph API Explorer** (<https://developers.facebook.com/tools/explorer>): select your app, "Get User Access
   Token" with permissions `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`,
   `pages_show_list`, `pages_read_engagement`, `business_management`.
4. Make it long-lived: open the **Access Token Debugger**, paste the token, press "Extend Access Token".
   Back in the Explorer, with the long-lived token run `me/accounts`: each Page in the result has an
   `access_token` that **does not expire**. Check it in the debugger ("Expires: Never").
5. For each Page run `<page-id>?fields=instagram_business_account`: the id it returns is the Instagram user id.
6. Secrets: `IG_USER_ID_EN`, `IG_TOKEN_EN` (the EN Page's token), `IG_USER_ID_ID`, `IG_TOKEN_ID`.

## 4. GitHub

1. Make `main` the default branch (Settings → General). Scheduled workflows only run there.
2. Settings → Actions → General → Workflow permissions: **Read and write**, and tick "Allow GitHub Actions to
   create and approve pull requests" (needed for preview comments).
3. Add the 8 secrets above. Add a repository **variable** `PRIVACY` = `private` for now. This also switches on the daily posting schedule; until it exists the schedule does nothing.

## 5. Test

1. Actions → **publish** → Run workflow, lang `en`, dry run ticked: prints what would be posted.
2. Run again with dry run unticked: renders and posts. YouTube will be private (because of `PRIVACY`); Instagram
   has no private mode, so this first Reel is public. Check both, then delete them if you like.
3. Actions → **collect stats** → Run workflow: writes `data/stats/<week>.json`. Its `unresolvedCompetitors` list
   shows handles the weekly review will fix.
4. Set the `PRIVACY` variable to `public`. From now on posting runs daily at 19:17 WIB (ID) and 12:23 New York
   time (EN).

## Your weekly routine (about 10 minutes, Saturday/Sunday)

Open the "Weekly review" pull request on your phone: read the report, watch the preview links, untick anything
wrong, merge. Unticked episodes and an unticked theme switch are removed automatically after the merge.

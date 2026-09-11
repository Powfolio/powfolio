# Custom Access Token hook — click-by-click

You are not writing a new function in the dashboard. Chunk 04 already created
`public.custom_access_token_hook(event jsonb)`. The dashboard only *points*
Auth at that existing function.

## 0. Confirm the function exists

Supabase dashboard → **SQL Editor** → New query → run:

```sql
select n.nspname as schema, p.proname as name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'custom_access_token_hook';
```

You should see `public | custom_access_token_hook`.

If the row is missing, run `supabase/chunks/04_custom_access_token_hook.sql`
first, then come back here.

## 1. Open Auth Hooks

1. Open https://supabase.com/dashboard
2. Select the **Pow3Folio** project
3. Left sidebar → **Authentication**
4. Then **Hooks** (sometimes labelled **Hooks (Beta)**)

You will see a list of hook *slots*, not a code editor:

- Before User Created
- **Custom Access Token**  ← this one
- Send SMS
- Send Email
- MFA Verification Attempt
- Password Verification Attempt

Do **not** open Edge Functions. Do **not** create an HTTP endpoint.

## 2. Configure Custom Access Token

Click **Custom Access Token**.

Fill the form exactly like this:

| Field you will see | What to choose |
| --- | --- |
| Enable / Enabled | **On** |
| Hook type / Type / Functionality | **Postgres** or **Postgres Function** or **SQL**. Not HTTP. Not HTTPS. Not Edge Function. |
| Schema | `public` |
| Function / Postgres function | `custom_access_token_hook` |
| Secret / HTTP URL / Method | Leave blank. Those appear only if you picked HTTP by mistake. |

Then **Save**.

If the function dropdown is empty, chunk 04 is not on this project yet.

## 3. What “functionality function” means

The dashboard is asking *how Auth should call your hook*:

- **Postgres function** = run SQL inside your database. This is the correct choice.
- **HTTP / HTTPS / Edge Function** = call a URL. Ignore this.

After you pick Postgres, the only other required field is the function name:
`custom_access_token_hook`.

## 4. Permissions the SQL already granted

Chunk 04 already ran the grants Auth needs:

- `supabase_auth_admin` can execute `public.custom_access_token_hook`
- `supabase_auth_admin` can use schema `public`
- `supabase_auth_admin` can `select` from `public.admin_users`

You do not add extra grants unless the hook save fails with a permission error.

## 5. Prove it worked

1. Sign out of Pow3Folio
2. Sign back in with the Super Admin email
3. Open https://jwt.io and paste the access token from the browser cookie / Application tab if you want to inspect claims
4. You should see either `user_role: "admin"` or `app_metadata.role: "admin"` after the next token issue

The hook runs **when a new access token is minted**. An already-open session may still have the old token until you sign out and back in.

## 6. Common mistakes

- Picking HTTP and then being asked for a URL — go back and switch to Postgres.
- Creating a new blank function in the SQL editor instead of selecting `custom_access_token_hook`.
- Enabling MFA Verification Attempt or Password Verification Attempt. Leave those off.
- Forgetting to run chunk 04, so the dropdown has nothing to select.

# POWFOLIO security audit — 2026-10-24

## Scope
- Production Supabase project referenced by `.env.local.example`: `qdpzxshuxyrzamdkjeha` (POW3FOLIO).
- Reviewed repository security-hardening SQL, auth middleware, account deletion route, admin API guards, service-role client, and live Supabase Security/Performance Advisors.
- This is a focused configuration/code audit, not a penetration test or formal security certification.

## Checks that passed
- All base tables in the exposed `public` schema have Row Level Security enabled (0 tables without RLS).
- Six tables have RLS enabled with no policies: `deleted_profile_archive`, `nft_cache`, `profile_history`, `profile_snapshot_pending`, `profile_snapshots`, and `rate_limits`. This denies client-role access by default and appears intentional for internal/server-managed data; do not add public policies without reviewing each access path.
- Nine `SECURITY DEFINER` functions in `public` were found. Their execute ACLs were restricted to `postgres` and/or `service_role`; the functions have pinned `search_path` settings. No public `auth.role()` policy references were found.
- Service-role client is kept in a server-only module and reads `SUPABASE_SERVICE_ROLE_KEY`, not a `NEXT_PUBLIC_*` variable.
- Account deletion route verifies the authenticated user, requires the account email and explicit DELETE phrase, then invokes the soft-delete flow.
- Admin API routes reviewed call `requireAdmin()` before accessing service-role data.
- Existing production migration history includes profile/function hardening and a private admin helper.

## Findings / follow-up
1. **Action required in Supabase Dashboard:** leaked-password protection is disabled. Enable it under Authentication password/security settings. This setting was not changed automatically by this repository PR.
2. **Performance cleanup, not a confirmed security vulnerability:** advisors report 38 RLS policies that may re-evaluate auth functions per row, 66 multiple-permissive-policy warnings, 4 foreign keys without covering indexes, and 5 unused-index notices. Review query patterns before changing policies/indexes; do not blindly remove indexes or merge policies.
3. **No-policy tables:** keep locked down unless code review proves a client-facing policy is required.
4. **Out-of-scope verification:** deployment secrets/rotation, Supabase Auth MFA/custom-hook dashboard configuration, storage bucket policies and object-level access, production HTTP headers, and adversarial end-to-end tests still require separate checks.

## IndexNow
The branch adds a public verification key file and a script that submits URLs from the live sitemap to IndexNow. A successful submission means search engines were notified; it does not guarantee crawl or indexation. After this branch is deployed, run `npm run indexnow:submit` from the project checkout and inspect the IndexNow report in Bing Webmaster Tools.

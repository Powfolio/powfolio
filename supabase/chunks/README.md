# Trust and safety SQL chunks

Run these in order in the Supabase SQL editor. Each file is self-contained and uses no dollar-quoting.

1. `01_profile_status.sql`
2. `02_tables.sql`
3. `03_is_admin.sql`
4. `04_custom_access_token_hook.sql`
5. `05_wallet_uniqueness.sql`
6. `06_rls.sql`
7. `07_action_reports.sql`
8. `08_report_evidence_bucket.sql`
9. `09_promote_admin.sql` after you replace the placeholder email
10. `10_appeals_softdelete_activity.sql`

Then in the Supabase dashboard:

- Follow `supabase/HOOK_SETUP.md` for the Custom Access Token hook
- Authentication -> Multi-Factor -> enable TOTP
- Add `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_BOOTSTRAP_EMAILS` on Vercel (server only)
- Optional: `RESEND_API_KEY` so suspension emails actually send

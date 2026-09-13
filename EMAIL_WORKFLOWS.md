# Pow3Folio — talent email workflows

Mail sending is **not wired for production yet** except the existing suspension helper in `lib/admin/mail.ts`.
When Resend is enabled (`RESEND_API_KEY`, `MAIL_FROM`), implement these sends using the functions already sketched in `lib/admin/mail.ts`.

Do not email Super Admin internal events (snapshot views, legal hold, exports) to talents.

## 1. Account suspended
- When: Super Admin suspends an account.
- Already implemented: `suspensionEmail`.
- Subject: Your Pow3Folio account "{username}" has been suspended
- Message: suspicious or malicious activity; 60 days to appeal; appeal link `{origin}/{username}?appeal=1`.

## 2. Account unsuspended
- Function: `unsuspendEmail`
- Subject: Your Pow3Folio account "{username}" is active again
- Message: suspension lifted; link to public profile.

## 3. Account marked under review
- Function: `underReviewEmail`
- Subject: Your Pow3Folio account "{username}" is under review
- Message: profile may stay public while reports are checked.

## 4. Warning logged
- Function: `warningEmail`
- Subject: A warning was added to your Pow3Folio account "{username}"
- Message: include admin reason; repeated issues can lead to suspension.

## 5. Talent deleted their own account
- Function: `accountDeletedEmail`
- Subject: Your Pow3Folio account "{username}" has been deleted
- Message: public profile gone, sign-in disabled, restricted archive until {purgeAt}, then permanent removal. If unexpected, contact support@pow3folio.com.

## 6. Super Admin deleted / archived an account
- Same template as #5, plus one line that Trust & Safety took the action.
- Never include reporter identity or evidence URLs.

## 7. Account restored from the deleted archive
- Function: `accountRestoredEmail`
- Subject: Your Pow3Folio account "{username}" has been restored
- Message: account is active; sign-in link.

## 8. Appeal received
- Function: `appealReceivedEmail`
- Subject: We received your Pow3Folio appeal
- Message: in review; do not create a second account.

## 9. Appeal approved
- Function: `appealDecisionEmail({ approved: true })`
- Subject: Your Pow3Folio appeal for "{username}" was approved
- Message: account active; optional admin note; sign-in link.

## 10. Appeal denied
- Function: `appealDecisionEmail({ approved: false })`
- Subject: Your Pow3Folio appeal for "{username}" was denied
- Message: original decision stands; do not create a replacement account to evade it.

## 11. Retention archive permanently purged
- Function: `purgeNoticeEmail`
- Subject: Pow3Folio has permanently removed retained data for "{username}"
- Message: 180-day window ended; archive and snapshots permanently deleted.
- Do not send if legal hold is active.

## 12. Legal hold placed or removed
- Do not email the talent. Audit only.

## 13. Snapshot / history / export viewed
- Do not email the talent. Audit only.

## 14. Signup / login / password
- Remain owned by Supabase Auth. Do not duplicate.

## Implementation notes when mail work starts
1. Set `RESEND_API_KEY` and `MAIL_FROM` on Vercel.
2. Keep sends server-side only.
3. Never put reporter identity, evidence URLs, snapshot payloads, or legal-hold reasons in talent email.
4. If Resend is missing, `sendTransactionalEmail` already no-ops and logs `mail skipped`.

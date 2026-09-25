# Pow3Folio — talent email workflows

Mail sending is **not fully wired for production yet** except:

- the suspension helper in `lib/admin/mail.ts`
- the signup OTP send in `POST /api/auth/otp/send` (uses `otpEmail` + Resend when `RESEND_API_KEY` is set)

When Resend is enabled (`RESEND_API_KEY`, `MAIL_FROM`), implement the remaining sends using the functions sketched in `lib/admin/mail.ts`.

Do not email Super Admin internal events (snapshot views, legal hold, exports) to talents.

## 1. Account suspended
- When: Super Admin suspends an account.
- Already implemented: `suspensionEmail`.
- Subject: Your Powfolio account "{username}" has been suspended
- Message: suspicious or malicious activity; 60 days to appeal; appeal link `{origin}/{username}?appeal=1`.

## 2. Account unsuspended
- Function: `unsuspendEmail`
- Subject: Your Powfolio account "{username}" is active again
- Message: suspension lifted; link to public profile.

## 3. Account marked under review
- Function: `underReviewEmail`
- Subject: Your Powfolio account "{username}" is under review
- Message: profile may stay public while reports are checked.

## 4. Warning logged
- Function: `warningEmail`
- Subject: A warning was added to your Powfolio account "{username}"
- Message: include admin reason; repeated issues can lead to suspension.

## 5. Talent deleted their own account
- Function: `accountDeletedEmail`
- Subject: Your Powfolio account "{username}" has been deleted
- Message: public profile gone, sign-in disabled, restricted archive until {purgeAt}, then permanent removal. If unexpected, contact support@pow3folio.com.

## 6. Super Admin deleted / archived an account
- Same template as #5, plus one line that Trust & Safety took the action.
- Never include reporter identity or evidence URLs.

## 7. Account restored from the deleted archive
- Function: `accountRestoredEmail`
- Subject: Your Powfolio account "{username}" has been restored
- Message: account is active; sign-in link.

## 8. Appeal received
- Function: `appealReceivedEmail`
- Subject: We received your Powfolio appeal
- Message: in review; do not create a second account.

## 9. Appeal approved
- Function: `appealDecisionEmail({ approved: true })`
- Subject: Your Powfolio appeal for "{username}" was approved
- Message: account active; optional admin note; sign-in link.

## 10. Appeal denied
- Function: `appealDecisionEmail({ approved: false })`
- Subject: Your Powfolio appeal for "{username}" was denied
- Message: original decision stands; do not create a replacement account to evade it.

## 11. Retention archive permanently purged
- Function: `purgeNoticeEmail`
- Subject: Powfolio has permanently removed retained data for "{username}"
- Message: 180-day window ended; archive and snapshots permanently deleted.
- Do not send if legal hold is active.

## 12. Legal hold placed or removed
- Do not email the talent. Audit only.

## 13. Snapshot / history / export viewed
- Do not email the talent. Audit only.

## 14. Password login (Supabase-owned)
- Password sign-in stays on Supabase (`/api/auth/password-login`).
- Do not invent a second password system.

## 15. Email verification OTP
- When: Signup "Send Code" / resend (`POST /api/auth/otp/send`).
- Function: `otpEmail`
- Status: **Live** when `RESEND_API_KEY` is set. Code is validated server-side via the HMAC cookie in `lib/auth/otp.ts`.
- Subject: Your Powfolio verification code
- Message: 4-digit code; expires in 10 minutes; ignore if they did not request it.
- Never log the code. Never put the code in the JSON response.

## 16. Forgotten password
- When: Login "Forgot password?" on `/login`.
- Today: Supabase Auth sends the reset mail via `resetPasswordForEmail` to `/auth/update-password`.
- Function: `passwordResetEmail` — template ready for the Resend cutover.
- Subject: Reset your Powfolio password
- Message: they asked to reset the password; link expires; ignore the mail if they did not request it.
- Do not reveal whether the email exists.

## 17. Welcome to Powfolio
- When: After a successful first account creation (session or confirmed signup).
- Function: `welcomeEmail`
- Status: Template ready. Wire `sendTransactionalEmail(welcomeEmail(...))` when mail work is turned on. Do not send on every later login.
- Subject: Welcome to Powfolio
- Message: account is ready; dashboard link; they can connect wallet / GitHub / X; support@pow3folio.com.

## Implementation notes when mail work starts
1. Set `RESEND_API_KEY` and `MAIL_FROM` on Vercel.
2. Keep sends server-side only.
3. Never put reporter identity, evidence URLs, snapshot payloads, or legal-hold reasons in talent email.
4. If Resend is missing, `sendTransactionalEmail` already no-ops and logs `mail skipped`.
5. OTP (#15) is the first transactional template already on the live send path.

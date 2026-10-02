# Assignment implementation progress

Legend: `[x]` implemented locally, `[ ]` not implemented, `[~]` designed or scaffolded but not externally verified.

## Foundation

- [x] Next.js and TypeScript project structure
- [x] Secret-safe `.env.example` and Git ignores
- [x] Architecture, route, permission, and setup documentation
- [x] Initial Supabase schema and fictional employees
- [x] Initial migration applied to the live Supabase project and verified
- [x] Row Level Security enabled on all four application tables with no public policies
- [x] Shared commission calculation with assignment rounding rule
- [~] Dependencies installed; TypeScript and ESLint pass; automated tests and the final local build worker are blocked by this sandbox's `spawn EPERM` restriction; Vercel production build succeeds

## Access and permissions

- [x] Demonstration role selector with five employees
- [x] Signed demonstration-role cookie and server-side role enforcement for submission actions
- [x] Telegram sender lookup by Telegram user ID
- [x] Manager-only Telegram account linking
- [x] Unlinked Telegram users rejected
- [x] Role-filtered employee and manager views

## Transactions

- [x] Shared transaction validation and processing layer designed for website and Telegram callers
- [x] Unique sale and expense references enforced by database
- [x] Positive amounts and valid commission totals enforced by database
- [x] Website sale submission with original proposal and Pending status implemented and verified against Supabase
- [x] Website expense submission with original proposal implemented and verified against Supabase
- [x] Automatic company-overhead allocation implemented and verified against Supabase
- [x] Original Telegram chat destination stored by schema
- [x] Duplicate database reference translated into a friendly conflict response

## Decisions and calculations

- [x] Manager sale approval and split correction
- [x] Manager expense allocation and correction
- [x] Approval idempotency at processing layer and live database conditional-update check
- [x] Dashboard calculations from stored records
- [x] Pending sales excluded from income and commission
- [x] Awaiting allocation included in company expenses only
- [x] Commission totals per salesperson
- [x] Commission pool and individual rounding function

## Google Sheets

- [x] Sales and Expenses tabs created automatically and live-verified
- [x] Reference-keyed insert/update integration
- [x] Sync status and error fields in database
- [x] Retry without duplicate row or changed totals
- [x] Instructor can view spreadsheet through the verified anyone-with-link Viewer permission
- [x] Live integration verified for both sale and expense rows; temporary verification data removed
- [x] Instructor test S100160 verified once in Supabase and Sheets with readable employee-name projection corrected

## Telegram

- [x] Submission conversation and validation errors
- [x] Confirmation only after database save
- [x] Sale decision notification with changes
- [x] Expense decision notification with changes
- [x] Delivery status and error fields in database
- [ ] Retry failed notification without undoing decision
- [x] Live bot sale submission and corrected-split return notification verified

## Tests and submission

- [x] First milestone: Telegram -> Supabase -> Vercel -> Sheets
- [x] Test 1 entered with S01 and E01 through real Telegram bot
- [x] Test 1 totals and notifications verified
- [x] Test 2 cumulative records entered and verified
- [x] Required denied actions covered at processing layer (execution blocked locally by sandbox `spawn EPERM`; TypeScript verifies test sources)
- [x] Interrupted Sheets update test completed; retry restored one reference-keyed row
- [x] Failed Telegram delivery test completed; decision persisted and delivery remained FAILED
- [x] GitHub repository is publicly accessible
- [x] Vercel production deployment is publicly accessible and live-tested
- [x] Page includes student name, links, and brief instructions
- [x] Professor regression scenario covered generically: pending exclusion, corrected €10 commission split, idempotent upsert, and notification content
- [ ] One Vercel URL submitted in the student's course-spreadsheet row

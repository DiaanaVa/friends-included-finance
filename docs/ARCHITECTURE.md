# Friends Included architecture

## Purpose

The application records fictional sales and expenses, allows the manager to make final decisions, calculates results from stored records, and mirrors each record to Google Sheets.

## System boundaries

- **Supabase Postgres** is the source of truth.
- **Next.js on Vercel** provides the website and server-side route handlers.
- **Telegram webhook** converts bot messages into the same validated commands used by website forms.
- **Google Sheets** is a readable projection. It never writes back to Supabase.
- **Telegram sendMessage** delivers confirmations and manager decisions after database commits.

## Shared command flow

1. Identify the actor from the selected demonstration role or linked Telegram user ID.
2. Enforce role permission in the server route.
3. Parse and validate the command with a shared schema.
4. Execute one idempotent database operation keyed by transaction reference.
5. Attempt a Sheets upsert using the reference as the row key.
6. Persist synchronization outcome and expose retry for failure.
7. Attempt any required Telegram message after the financial decision is committed.
8. Persist delivery outcome and expose retry for failure.

## Planned routes

| Route | Purpose | Authorization |
|---|---|---|
| `POST /api/sales` | Submit a pending sale | Salesperson only |
| `POST /api/expenses` | Submit an expense | Kevin only |
| `POST /api/sales/[reference]/approve` | Approve or correct split | Svetlana only |
| `POST /api/expenses/[reference]/allocate` | Confirm or change allocation | Svetlana only |
| `POST /api/integrations/sheets/retry` | Retry an idempotent row upsert | Owner or Svetlana |
| `POST /api/notifications/retry` | Retry a failed Telegram decision notice | Svetlana only |
| `POST /api/telegram/webhook` | Receive Telegram updates | Verified webhook secret |
| `POST /api/telegram/link` | Link Telegram user to employee | Svetlana only |
| `GET /api/dashboard` | Read role-filtered records and totals | Demonstration role required |

## Authorization approach

The assignment permits a demonstration-role selector instead of five accounts. The browser will send the selected employee plus a shared demonstration-session credential. Every route will load the employee from Supabase and enforce that employee's stored role before processing. Telegram actors are resolved exclusively from manager-maintained user-ID links. The bot will never accept a self-selected role.

This is assessment access, not production-grade identity. The interface must label it “Demonstration role.”

## Status model

- Sale: `PENDING_APPROVAL` -> `APPROVED`
- Expense: `AWAITING_ALLOCATION` -> `ALLOCATED`; overhead starts as `ALLOCATED`
- Sheets: `PENDING`, `SYNCED`, or `FAILED`
- Notification: `NOT_REQUIRED`, `PENDING`, `SENT`, or `FAILED`

Approved decisions are idempotent. A repeat request returns the existing result without adding money, commission, expense, or another transaction.

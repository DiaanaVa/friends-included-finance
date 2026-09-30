# Manual setup checklist

Do not paste credentials into chat, commit them, or display them on the website.

## Local prerequisites

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local`.
3. Fill `.env.local` only on your computer.
4. Run `pnpm install`, then `pnpm dev` (the equivalent npm commands also work).

## Supabase

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/0001_initial_schema.sql`.
3. Copy the project URL, publishable key, and server secret key into the matching local variables.
4. Never use the secret key in code marked for the browser.

## Telegram

1. Message BotFather and create one bot.
2. Store its token as `TELEGRAM_BOT_TOKEN`.
3. Choose a long random webhook secret for `TELEGRAM_WEBHOOK_SECRET`.
4. After deployment, register the Vercel webhook URL and secret with Telegram.
5. Start a private chat with the bot before testing.
6. Use the manager screen, once implemented, to link your Telegram user ID to the fictional employees.

## Google Cloud and Google Sheets

1. Create a Google Cloud project and enable the Google Sheets API.
2. Create a service account and a key.
3. Create one spreadsheet with tabs named `Sales` and `Expenses`.
4. Share the spreadsheet with the service-account email as Editor.
5. Give the instructor Viewer access; do not enable public editing.
6. Store the spreadsheet ID, service-account email, and private key in environment variables.

## GitHub and Vercel

1. Create a private or public repository accessible to the instructor.
2. Commit the project without `.env.local` or credential files.
3. Import the repository into Vercel.
4. Add every variable from `.env.example` in Vercel project settings.
5. Set `APP_BASE_URL` to the deployed HTTPS URL and redeploy.
6. Later add the working Vercel URL to your own row in the course spreadsheet.

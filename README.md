<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1VmDT34-tz96hpCD0okl8UAVckca02Fgi

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Environment

Copy `.env.example` to `.env.local` and fill in your own keys. Important variables:

- `VITE_STRIPE_PUBLISHABLE_KEY` – Stripe publishable key for the card fields.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` – Supabase project credentials.
- `VITE_EMAIL_FUNCTION_URL` – HTTP endpoint that sends the customer their download links (e.g., a Supabase Edge Function or another email provider).

## Supabase schema

The frontend now talks directly to Supabase REST endpoints when the environment variables are present. Recommended minimal tables:

- `access_records` – `id (uuid)`, `code (text)`, `email (text)`, `photos (jsonb)` containing `{ id, url, highResUrl, title }[]`, optional `driveLink (text)`, optional `firstLoginAt (timestamptz)`.
- `purchases` – `id (text)`, `email (text)`, `amount (numeric)`, `description (text)`, `timestamp (timestamptz)`, `status (text)`.
- `abandoned_checkouts` – `id (text)`, `email (text)`, `potentialValue (numeric)`, `itemsCount (int4)`, `stage (text)`, `timestamp (timestamptz)`.
- `analytics_events` – generic event log with `event_type (text)`, `email (text)`, `timestamp (timestamptz)`, plus optional columns for `amount`, `description`, `potentialValue`, `itemsCount`, and `stage`.

If a Supabase call fails, the app falls back to the built-in demo data in `constants.ts` so you can still demo locally.

## Payments and email

- Stripe is loaded from `VITE_STRIPE_PUBLISHABLE_KEY`; replace the default test key before deploying.
- On payment success the app writes purchases and abandonment records to Supabase (when configured) and optionally POSTs to `VITE_EMAIL_FUNCTION_URL` so you can trigger a receipt/download email.
- If you prefer running payments on the server, point `VITE_EMAIL_FUNCTION_URL` to an API route that both charges the card and sends the email, then update the Edge Function to write to your analytics tables.

## Deploying to your own domain

1. Build the project: `npm run build` (outputs to `dist/`).
2. Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, etc.).
3. Add your custom domain at your host and point DNS to their records.
4. Set the same environment variables (`VITE_*`) in your hosting provider so Supabase, Stripe, and email hooks work in production.
5. Test a full flow in production with Stripe test cards before switching to live keys.

# BoxShot Maker

A Next.js + Tailwind CSS 3D box-shot maker with authentication, saved projects, Lemon Squeezy subscriptions, server-side download limits, and legal policy pages.

## Plans

- **Starter — $8/month:** 10 downloads per billing period
- **Creator — $10/month:** 20 downloads per billing period
- **Studio — $15/month:** unlimited downloads

The download limits are enforced server-side. Projects can be created and saved before subscribing.

## Legal pages

The app includes:

- `/terms` — Terms & Conditions
- `/privacy` — Privacy Policy
- `/refunds` — Refund & Cancellation Policy

These are linked in the **footer only**, not the header/navigation.

> The legal pages are starter templates. Before launching commercially, replace the generic contact language with your actual business/legal details and have the policies reviewed for the jurisdictions in which you operate.

## 1. Install

```bash
npm install
```

## 2. Database

Create a PostgreSQL database and set `DATABASE_URL` in `.env.local`. Then:

```bash
npx prisma generate
npx prisma db push
```

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=long-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
LEMONSQUEEZY_API_KEY=...
LEMONSQUEEZY_STORE_ID=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
LEMONSQUEEZY_STARTER_VARIANT_ID=...
LEMONSQUEEZY_BASIC_VARIANT_ID=...
LEMONSQUEEZY_PRO_VARIANT_ID=...
```

Create three recurring Lemon Squeezy variants in your store:

1. Starter — $8/month
2. Creator — $10/month
3. Studio — $15/month

Put their variant IDs into the corresponding environment variables.

## 4. Lemon Squeezy webhook

Create a webhook pointing to:

`https://YOUR_DOMAIN.com/api/webhooks/lemonsqueezy`

Use the same value as `LEMONSQUEEZY_WEBHOOK_SECRET`. Enable at least:

- `subscription_created`
- `subscription_updated`
- `subscription_payment_success`
- `subscription_payment_failed`
- `subscription_payment_recovered`
- `subscription_cancelled`
- `subscription_expired`

The checkout sends the local user ID as Lemon Squeezy custom data, allowing the webhook to associate the subscription with the correct account.

## 5. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Download-limit behavior

The download endpoint checks the authenticated user and project ownership, verifies an active subscription, then atomically increments the subscription's download counter.

- Starter: blocks after 10 downloads in the current billing period.
- Creator: blocks after 20 downloads in the current billing period.
- Studio: unlimited downloads.

A successful recurring subscription payment resets the counter for the new billing period. The browser cannot simply change a JavaScript variable to bypass the quota because the authorization check happens on the server.

## Production note

For a production image-heavy service, replace database-stored data URLs with object storage such as S3/R2/Vercel Blob. The included implementation intentionally keeps the storage layer self-contained.

## Lemon Squeezy customer sync

The application now synchronizes local accounts with Lemon Squeezy customers.

- **Sign up:** the server normalizes the email, finds an existing Lemon Squeezy customer in the configured store, or creates one, then stores its customer ID on the local `User` record.
- **Sign in:** the server authenticates the local password first, then reconciles the Lemon customer by stored customer ID/email. A temporary Lemon Squeezy API failure does not prevent authentication; the next sign-in retries synchronization.
- **Checkout:** the stored Lemon customer ID is passed to the checkout when available, while the internal `user_id` remains in Lemon Squeezy custom checkout data for webhook reconciliation.
- **Webhooks:** subscription events update both the local subscription and the user's Lemon customer ID.

Run the schema update after pulling these changes:

```bash
npx prisma db push
npx prisma generate
```

For production, keep `LEMONSQUEEZY_API_KEY` server-side only. Never expose it as a `NEXT_PUBLIC_*` variable.

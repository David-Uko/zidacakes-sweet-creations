# Supabase Migration Guide

## Overview

This project is fully portable. All Supabase configuration uses environment variables — no hardcoded project IDs or URLs exist in the application code.

---

## Step 1: Create Your Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Note down:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (found in Settings → API)
   - **Service Role Key** (found in Settings → API — keep this secret!)

---

## Step 2: Set Up the Database

Run the SQL migrations from `supabase/migrations/` in order against your new project.
You can do this via:
- **Supabase CLI**: `supabase db push`
- **SQL Editor**: Copy and paste each migration file into the SQL Editor in your Supabase dashboard.

This will create all tables (`custom_orders`, `orders`, `order_items`, `payments`, `profiles`, `support_messages`), RLS policies, functions, and triggers.

---

## Step 3: Create Storage Bucket

In your Supabase dashboard → Storage:
1. Create a bucket called `cake-references`
2. Set it to **Public**
3. Add policies:
   - INSERT for authenticated users
   - SELECT for public (anonymous) users

(This is also handled by the migrations, but verify it exists.)

---

## Step 4: Configure Environment Variables

### Frontend (`.env` file in project root)

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=YOUR-PROJECT-ID
```

### Edge Functions (Supabase Secrets)

Set these in your Supabase dashboard → Settings → Edge Functions → Secrets, or via CLI:

```bash
supabase secrets set SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Payment Providers
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_PUBLISHABLE_KEY=pk_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set PAYPAL_CLIENT_ID=your-paypal-client-id
supabase secrets set PAYPAL_CLIENT_SECRET=your-paypal-secret
```

#### Email Services (these are independent of Supabase)
```bash
supabase secrets set EMAILJS_SERVICE_ID=your-emailjs-service-id
supabase secrets set EMAILJS_TEMPLATE_ID=your-emailjs-template-id
supabase secrets set EMAILJS_PUBLIC_KEY=your-emailjs-public-key
supabase secrets set EMAILJS_PRIVATE_KEY=your-emailjs-private-key
supabase secrets set WEB3FORMS_ACCESS_KEY=your-web3forms-key
```

---

## Step 5: Deploy Edge Functions

Using the Supabase CLI:

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-cart-checkout
supabase functions deploy create-paypal-order
supabase functions deploy capture-paypal-order
supabase functions deploy stripe-webhook
supabase functions deploy send-customer-email
supabase functions deploy send-admin-notification
supabase functions deploy support-assistant
```

---

## Step 6: Update `supabase/config.toml`

Change the `project_id` to your new project:

```toml
project_id = "YOUR-PROJECT-ID"
```

---

## Step 7: Configure Authentication

In your Supabase dashboard → Authentication → Settings:
1. Add your site URL to **Site URL** (e.g., `https://yourdomain.com`)
2. Add redirect URLs:
   - `https://yourdomain.com`
   - `https://yourdomain.com/reset-password`
   - `https://yourdomain.com/order-success`

---

## What Does NOT Change

- **EmailJS** — operates independently via its own API keys (no Supabase dependency)
- **Web3Forms** — operates independently via its own access key (no Supabase dependency)
- **Frontend components** — all use `@/integrations/supabase/client` which reads from env vars
- **Edge Functions** — all use `Deno.env.get()` for configuration

---

## Quick Checklist

- [ ] Created new Supabase project
- [ ] Ran all database migrations
- [ ] Created `cake-references` storage bucket
- [ ] Updated `.env` with new URL, anon key, and project ID
- [ ] Set all edge function secrets
- [ ] Deployed all edge functions
- [ ] Updated `config.toml` project ID
- [ ] Configured auth redirect URLs
- [ ] Tested login, signup, and password reset
- [ ] Tested Stripe and PayPal checkout flows
- [ ] Verified EmailJS and Web3Forms emails still work

# Signup and Verification Plan

## Overview
Implement a secure signup flow using Supabase Auth (email + password) with email verification via Magic Link (PKCE). Add a centered signup card on the landing page with a disclosure, email and password inputs, a live password strength checklist with green checks, and repeat-password validation. On submit, POST to a server route that calls Supabase `auth.signUp`, which triggers the verification email. After the user clicks the Magic Link, handle the verification (`verifyOtp`) server-side, create/link a MongoDB user record, bi-directionally associate Mongo and Supabase IDs, then redirect to `/account` (placeholder page for 5 profile cards to be added).

Strict validation and explicit error toasts are required; no fallback behavior.

## Requirements and Environment
- Required env vars (no fallbacks):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `MONGODB_URI`
- DigitalOcean: env vars configured per environment (dev/test/prod) in App Platform/Secrets.
- URL allow list and email templates configured in Supabase Dashboard (see below).

## Dependencies
- `@supabase/supabase-js`
- `@supabase/ssr`
- `mongodb` (official MongoDB Node.js driver)

## Supabase Client Utilities
Create:
- `utils/supabase/client.ts` using `createBrowserClient` from `@supabase/ssr`, initialized with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `utils/supabase/server.ts` using `createServerClient` from `@supabase/ssr` and Next.js `cookies()` integration to read/write cookies.

Notes:
- These clients enable PKCE flow and cookie-based sessions (SSR-compatible).

## Middleware (Session Refresh)
- `middleware.ts` (root) that calls `updateSession` from `utils/supabase/middleware.ts`.
- `utils/supabase/middleware.ts` uses `createServerClient` to refresh auth cookies by calling `supabase.auth.getUser()` and ensures cookies are propagated to the response.
- Add `config.matcher` to run on all relevant paths (exclude static assets/images/favicon).

Purpose:
- Ensure server components and route handlers always have a fresh, valid session cookie.

## MongoDB Connection Utility
- `lib/mongo.ts`: create a singleton connection using `MongoClient` with `MONGODB_URI`.
- Expose helpers to get the DB and the `users` collection.
- Ensure a unique index on `email`.

## Routes
### 1) Sign Up Route: `app/auth/sign-up/route.ts`
- Method: `POST`.
- Input: form data or JSON `{ email, password }`.
- Validation:
  - Email format.
  - Password checklist: 8+ chars, uppercase, lowercase, number, special.
- Action:
  - Create server Supabase client.
  - Call `supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/auth/confirm` } })`.
  - Return 200 on success with `{ message: "Please check your email for a verification link to log in." }`.
  - On error, return 400/500 with JSON error; the client will display a toast.

### 2) Confirm Route: `app/auth/confirm/route.ts`
- Method: `GET`.
- Reads query: `token_hash`, `type=email` (Supabase Magic Link) and optional `next`.
- Action:
  - Create server Supabase client.
  - Call `supabase.auth.verifyOtp({ type, token_hash })`.
  - On success:
    - Retrieve the verified Supabase user (`supabase.auth.getUser()`), get `user.id` and `user.email`.
    - Upsert a Mongo `users` doc (by `email`). If not exists, insert a new one. Capture Mongo `_id`.
    - Bi-directional linking:
      - Update Supabase user metadata with Mongo ObjectId string (no service key needed since we have a session):
        - `supabase.auth.updateUser({ data: { mongoUserId: mongoIdString } })`
      - Update Mongo user with `supabaseUserId: user.id`.
    - Redirect to `/account`.
  - On error: redirect to `/auth/error` (or a simple error page) with explanatory text.

### 3) Logout Route: `app/auth/logout/route.ts`
- Method: `POST`.
- If a user is logged in, call `supabase.auth.signOut()`.
- Redirect to `/` or `/login` as desired.

## Landing Page UI: `app/page.tsx`
- Replace placeholder with:
  - A “Sign up” button that opens a centered card (accessible dialog or in-place card) containing:
    - Disclosure text (typo-corrected):
      - "We do not collect any personal information. We do need an email for communicating with you, so please consider making a dedicated email that is not used anywhere else."
    - Email input.
    - Password input with live checklist showing green checks for:
      - 8+ characters
      - uppercase letter
      - lowercase letter
      - number
      - special character
    - Repeat password input with validation match.
    - Submit button (disabled until checklist passes and passwords match).
  - On submit:
    - POST to `/auth/sign-up` with `{ email, password }`.
    - On success, show a success message on the card: “Please check your email for the verification link to log in.”
    - On error, show a toast with the server error message. No silent fallback.

Notes:
- Use concise, accessible HTML/React; no new heavy UI libraries.

## `/account` Page Skeleton: `app/account/page.tsx`
- Protected route (relies on middleware-refresh and reading the session); server component fetches user via Supabase server client.
- If no session, redirect to `/`.
- Display a placeholder indicating that 5 profile cards will be built here next.

## Supabase Dashboard Configuration (Ops Task)
1) URL Configuration
   - Add your site URLs (dev/test/prod) to the Redirect URL allow list.
2) Email Templates (Confirm Signup for PKCE)
   - Change Confirm Signup link to:
     - `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   - (Optional) Ensure Magic Link template is also available if you later add “send magic link” separately.
3) Providers
   - Ensure Email confirmations are enabled.

## Data Model (Initial)
- Mongo `users` collection (extensible):
  - `_id`: ObjectId
  - `email`: string (unique)
  - `supabaseUserId`: string | null
  - `createdAt`: Date
  - `updatedAt`: Date
  - (future fields for the 5 profile cards)
- Supabase `auth.users.user_metadata.mongoUserId`: string of Mongo ObjectId.

## Validation and Error Handling
- Client-side:
  - Email format and password checklist validation; repeat password check.
  - Show error toasts for API errors; show success text after signup.
- Server-side:
  - Validate inputs; return clear HTTP status and JSON error.
  - No fallbacks or silent behavior.

## Implementation Order
1) Supabase utils (`client.ts`, `server.ts`) and middleware.
2) `app/auth/sign-up/route.ts` with strict validation.
3) `app/auth/confirm/route.ts` with Supabase `verifyOtp` → Mongo link → update Supabase metadata → redirect `/account`.
4) Landing page UI with signup card and visual password checks.
5) `/account` skeleton with guard.
6) `app/auth/logout/route.ts`.
7) Ops: Supabase URL allow list and Email Templates (token-hash).

## Testing Scenarios
- Valid signup → success message → email click → redirect to `/account` → verify Mongo doc created and both IDs linked.
- Invalid email/password: server returns 400, client shows toast; no call to Supabase on invalid payloads.
- Duplicate email: Supabase returns error; toast shows message.
- Confirm route errors (missing/invalid token): redirect to `/auth/error`.

## Notes and Future Work
- Later implement the 5 profile cards on `/account`, backed by Mongo (and/or Supabase) as needed.
- Add role-based or metadata-based guards if required.
- Consider adding a simple error page under `app/auth/error/page.tsx`.
- Consider rate limiting signup route to prevent abuse.

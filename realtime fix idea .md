## Realtime Chat – Fix Plan (Backend-first, zero frontend envs)

Goal
- Make chat reliable without exposing Supabase env vars in the frontend. All REST writes/reads go through backend. Frontend only receives a short-lived access token for Realtime subscriptions and may fetch public config (URL/anon) from backend when needed.

Principles
- Do not rollback today’s DB work (tables, RLS, triggers) – it’s compatible with this plan.
- Frontend will not call PostgREST directly. All CRUD is proxied by backend HTTP routes.
- Frontend keeps Realtime subscription using an access token from backend. Public anon key/URL can be served by backend endpoint (public information) instead of Vite env.

What stays as-is (DB/Supabase)
- Tables: `public.chat_threads`, `public.chat_messages`
- Indexes: `chat_messages(thread_id, created_at)` and `(thread_id, id)`
- RLS: participants-only select; insert enforces membership (and sender via auth.uid).
- Realtime: trigger broadcasts to `chat:<thread_id>`; RLS on `realtime.messages` for participants.
- RPC (added today): `public.insert_chat_message(_thread_id, _sender_mongo_id, _recipient_mongo_id, _body)` returns inserted row with `sender_supabase_id = auth.uid()`.

Backend changes
1) Keep token endpoint (already exists)
   - `app/api/auth/token/route.ts` → returns session `access_token` for Realtime auth.

2) New: Chat send endpoint (server executes RPC)
   - `POST /api/chat/send`
   - Body: `{ threadId: string, recipientMongoId: string, body: string }`
   - Steps:
     - `createSupabaseRouteClient()` → ensure user session (401 if none)
     - Ensure thread exists (reuse `/api/chat/threads/ensure` or inline upsert)
     - Call `supabase.rpc('insert_chat_message', { _thread_id, _sender_mongo_id, _recipient_mongo_id, _body })`
     - Return inserted row (mapped for UI)

3) New: Chat history endpoint (server queries with session)
   - `GET /api/chat/history?threadId=...&before=ISO&limit=50`
   - Steps:
     - Session check
     - `select * from chat_messages where thread_id = ? [and created_at < ?] order by created_at desc limit ?`
     - Return rows

4) Keep: Thread ensure endpoint
   - `app/api/chat/threads/ensure/route.ts` (already added) → upserts the thread based on both users.

5) Keep: Public config endpoint (optional but useful)
   - `GET /api/config/supabase` → `{ url, anonKey }` for client Realtime init (no secrets; anon is public). If you prefer, we can inline these values in the token endpoint response and remove this route.

Frontend changes
1) Remove direct PostgREST usage from ChatModal
   - Replace `insertMessage` RPC/direct calls with `fetch(getBackendApi('/api/chat/send'), ...)`.
   - Replace history loads with `fetch(getBackendApi('/api/chat/history'), ...)`.

2) Keep Realtime subscription on client (minimal supabase-js use)
   - On modal open:
     - call `/api/auth/token` → `access_token`
     - call `/api/config/supabase` → `{ url, anonKey }`
     - `createClient(url, anonKey)` and `realtime.setAuth(access_token)`
     - subscribe to `chat:<threadId>`
   - Note: This keeps keys off the build; they are fetched at runtime from backend.

3) UI mapping unchanged
   - Map DB rows to bubbles; optimistic UI on send; retry token on subscribe failure.

Implementation steps (targeted edits only)
Backend
- Add file: `app/api/chat/send/route.ts`
  - POST; session check; ensure thread; call RPC; return row.
- Add file: `app/api/chat/history/route.ts`
  - GET; session check; select messages; return rows.

Frontend
- Edit file: `frontend/src/internal/components/ChatModal.tsx`
  - Replace direct `insertMessage` calls with `fetch(getBackendApi('/api/chat/send'), ...)`.
  - Replace direct message selects with `fetch(getBackendApi('/api/chat/history'), ...)`.
  - Keep Realtime subscribe using runtime-fetched `{ url, anonKey }` and `/api/auth/token`.
  - Remove temporary debug logs added today.

Revert/cleanup from today (safe refactors)
- Remove supabase REST helpers on frontend: `frontend/src/lib/chat.ts` (or keep only types)
- Keep `app/api/config/supabase/route.ts` (or merge into `/api/auth/token` payload) and remove if policy requires fewer endpoints.
- Remove debug logs in ChatModal and config calls after validation.

Risk & Mitigation
- Risk: Session not present on backend calls → ChatModal must ensure the user is logged in; surface a friendly error.
- Risk: Thread upsert race → Upsert is idempotent by `thread_id`; safe.
- Risk: Realtime subscribe fails → Retry by refetching token; show non-blocking warning.

Roll-forward testing
- Open chat, confirm history loads via `/api/chat/history`.
- Send message, confirm `/api/chat/send` responds 200 and bubble status → sent.
- Confirm Realtime event appends new message on receiver’s chat in another browser.

Roll-back plan
- If any issue arises, we can conditionally switch ChatModal to a “backend-only no-Realtime” mode (poll `/api/chat/history` after send) until Realtime is confirmed OK.



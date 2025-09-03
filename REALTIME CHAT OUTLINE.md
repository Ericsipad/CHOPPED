## Realtime 1:1 Chat – Broadcast from DB (Supabase) – Implementation Outline

- Selected options:
  - Realtime: Broadcast from DB with private channels and Realtime Authorization
  - Token provisioning: Backend-provided Supabase session access token (Option A)
  - Env vars: Use existing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

### Data model (Supabase)
- Tables
  - public.chat_threads (optional helper)
    - thread_id text primary key
    - user_a_mongo_id text
    - user_b_mongo_id text
    - user_a_supabase_id uuid
    - user_b_supabase_id uuid
    - created_at timestamptz default now()
    - last_message_at timestamptz
  - public.chat_messages
    - id uuid primary key default gen_random_uuid()
    - thread_id text not null
    - sender_supabase_id uuid not null
    - sender_mongo_id text not null
    - recipient_mongo_id text not null
    - body text not null
    - created_at timestamptz default now()
- Indexes
  - create index on chat_messages(thread_id, created_at)
  - create index on chat_messages(thread_id, id)

### RLS policies (Supabase)
- Enable RLS on public.chat_threads and public.chat_messages
- SELECT policy: allow authenticated users to read rows where they are a participant of the thread (auth.uid() is either user_a_supabase_id or user_b_supabase_id / matches thread membership)
- INSERT policy on chat_messages: enforce sender_supabase_id = auth.uid() and that the thread belongs to the sender/recipient

### Realtime Broadcast from DB (Supabase)
- Realtime Authorization
  - Private channels enforced; add RLS on realtime.messages so only participants can join a topic for chat:<thread_id>
  - Example policy concept: authenticated can read/write broadcast where realtime.topic() = 'chat:' || thread_id AND auth.uid() is in that thread’s participants
- Trigger function on public.chat_messages
  - Use realtime.broadcast_changes('chat:' || NEW.thread_id, TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD)
  - AFTER INSERT trigger executes the function
- Client subscription
  - Subscribe to private topic chat:<thread_id>
  - Listen for 'INSERT' broadcast events and append new messages

### Token provisioning (Option A)
- Backend (Next.js) endpoint returns current Supabase access token (access_token) from createSupabaseRouteClient().auth.getSession() / getUser()
- Frontend fetches token and calls supabase.realtime.setAuth(token) before channel subscribe
- Handle token refresh: re-fetch token on subscribe failure or periodically based on expiry

### Frontend env vars (Vite)
- Continue using existing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Expose to Vite via define so import.meta.env can be used in the Vite app

### Frontend integration (Vite app)
- Supabase client
  - Create a singleton browser client using @supabase/supabase-js v2 initialized with NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY
- Thread id
  - Deterministic from the two Mongo IDs: sort lexicographically and join with '__'
  - thread_id = `${min(mongoA, mongoB)}__${max(mongoA, mongoB)}`
- Initial load
  - On modal open, fetch last 50: select from public.chat_messages where thread_id = ? order by created_at desc limit 50 (reverse in UI)
- Pagination (load older)
  - Keyset pagination with lt('created_at', oldestLoadedCreatedAt) limit 50
- Realtime subscribe
  - Fetch token -> supabase.realtime.setAuth(token)
  - Subscribe to supabase.channel(`chat:${threadId}`, { config: { private: true } })
  - .on('broadcast', { event: 'INSERT' }, handler) to append new messages
  - Unsubscribe on modal close
- Send message
  - supabase.from('chat_messages').insert([{ thread_id, sender_supabase_id, sender_mongo_id, recipient_mongo_id, body }])
  - Optimistic UI (status: sending -> sent/error)
- Identity on client
  - myMongoId from localStorage 'chopped.mongoUserId'
  - otherUserId from selectedUserId in ChoppingBoardPage
- UI mapping
  - Map rows to ChatModal shape; sender === 'me' if sender_mongo_id === myMongoId

### Backend integration
- New endpoint: return Supabase access_token for current session with CORS honoring ALLOWED_ORIGINS
- Reuse existing auth linkage (mongoUserId is already stored in Supabase user metadata server-side)

### Supabase configuration notes
- Broadcast-from-DB relies on realtime.messages; no need to add chat_messages to supabase_realtime publication
- Ensure Realtime private channels enabled in project settings
- Ensure all RLS policies for both Postgres tables and realtime.messages are in place

### References
- Supabase Realtime Broadcast guide (private channels, DB triggers, ack)
- Realtime Authorization (RLS on realtime.messages, private channels)
- Subscribing to Database Changes (broadcast_changes usage)

### Implementation steps (high level)
1) Apply SQL: create tables, indexes, RLS policies, realtime.messages policies
2) Create trigger function + trigger for broadcast_changes on chat_messages
3) Add backend endpoint to return session access_token (CORS per ALLOWED_ORIGINS)
4) Expose NEXT_PUBLIC_SUPABASE_* in Vite define; add frontend supabase client
5) Wire ChatModal to fetch 50, paginate by 50, subscribe/unsubscribe
6) Implement send with optimistic UI and error handling
7) Test end-to-end and verify RLS is enforced



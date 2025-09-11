-- CHOPPED Database Schema
--
-- This file documents the authoritative schema for:
-- 1) Supabase (PostgreSQL) objects used by the app
-- 2) MongoDB collections and document shapes used by the app (as reference comments)
--
-- Keep this file up to date as we evolve the backend.

-------------------------------------------------------------------------------
-- 1) SUPABASE (POSTGRESQL) SCHEMA
-------------------------------------------------------------------------------

-- Required extensions
create extension if not exists pgcrypto;

-- Chat threads between two users (participants captured by Mongo and Supabase IDs)
create table if not exists public.chat_threads (
	thread_id text primary key,
	user_a_mongo_id text,
	user_b_mongo_id text,
	user_a_supabase_id uuid,
	user_b_supabase_id uuid,
	created_at timestamptz not null default now(),
	last_message_at timestamptz
);

-- Chat messages
create table if not exists public.chat_messages (
	id uuid primary key default gen_random_uuid(),
	thread_id text not null references public.chat_threads(thread_id) on delete cascade,
	sender_supabase_id uuid not null,
	sender_mongo_id text not null,
	recipient_mongo_id text not null,
	body text not null,
	created_at timestamptz not null default now()
);

-- Indexes for message retrieval performance
create index if not exists chat_messages_thread_created_at_idx on public.chat_messages(thread_id, created_at);
create index if not exists chat_messages_thread_id_idx on public.chat_messages(thread_id, id);

-- Row Level Security: enable and lock down by thread participation
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

-- Policy: users can select a thread if they are a participant
drop policy if exists chat_threads_select_participants on public.chat_threads;
create policy chat_threads_select_participants on public.chat_threads
	for select using (
		auth.uid() is not null and (
			auth.uid() = user_a_supabase_id or auth.uid() = user_b_supabase_id
		)
	);

-- Policy: users can select messages if they are a participant of the thread
drop policy if exists chat_messages_select_participants on public.chat_messages;
create policy chat_messages_select_participants on public.chat_messages
	for select using (
		exists (
			select 1 from public.chat_threads t
			where t.thread_id = chat_messages.thread_id
			and (t.user_a_supabase_id = auth.uid() or t.user_b_supabase_id = auth.uid())
		)
	);

-- Policy: users can insert messages only as themselves and if they are a participant
drop policy if exists chat_messages_insert_sender on public.chat_messages;
create policy chat_messages_insert_sender on public.chat_messages
	for insert with check (
		sender_supabase_id = auth.uid() and
		exists (
			select 1 from public.chat_threads t
			where t.thread_id = chat_messages.thread_id
			and (t.user_a_supabase_id = auth.uid() or t.user_b_supabase_id = auth.uid())
		)
	);

-- Helper RPC to insert a chat message (enforces sender = auth.uid())
drop function if exists public.insert_chat_message(text, text, text, text);
create or replace function public.insert_chat_message(
	_thread_id text,
	_sender_mongo_id text,
	_recipient_mongo_id text,
	_body text
) returns public.chat_messages language plpgsql security definer as $$
declare
	new_row public.chat_messages;
begin
	-- Ensure thread exists (participants not strictly enforced here; rely on policies for read/write)
	insert into public.chat_threads(thread_id, created_at)
	values (_thread_id, now())
	on conflict (thread_id) do nothing;

	insert into public.chat_messages(
		thread_id,
		sender_supabase_id,
		sender_mongo_id,
		recipient_mongo_id,
		body
	) values (
		_thread_id,
		auth.uid(),
		_sender_mongo_id,
		_recipient_mongo_id,
		_body
	) returning * into new_row;

	update public.chat_threads set last_message_at = new_row.created_at where thread_id = _thread_id;
	return new_row;
end; $$;

-------------------------------------------------------------------------------
-- 2) MONGODB SCHEMA (REFERENCE)
-------------------------------------------------------------------------------

-- MongoDB `users` collection (document shape; reference only)
-- Fields in active use across the codebase:
--
-- _id: ObjectId
-- supabaseUserId: string (unique index)
-- createdAt: Date
-- updatedAt: Date
-- subscription: number (plan: 10 | 20 | 50 | 3), default 3
-- subscriptionUpdatedAt: Date
-- stripeCustomerId: string
-- paymentHistory: [
--   {
--     amountCents: number,
--     currency: string,
--     paidAt: Date,
--     invoiceId: string,
--     subscriptionId: string
--   }
-- ]
--
-- pendingmatch_array: [ { userId: string, imageUrl: string } ]
-- Last_matchsearch: Date
-- Match_array: [ { userId: string, imageUrl?: string, status?: 'pending' | 'chopped', createdAt?: Date } ]
-- choppedmatch_array: [ { userId: string, imageUrl?: string, status?: 'chopped', createdAt?: Date } ]
--
-- gifts_got: [
--   {
--     senderUserId: string,                -- Mongo _id of the sender (stored as string)
--     stripeTransactionId: string | null,
--     createdAt: Date,
--     amountCents: number,                 -- integer cents
--     withdrawn: boolean,
--     withdrawnAt: Date | null,
--     giftProvider: 'stripe' | string,
--     withdrawTransactionId: string | null,
--     giftMessage: string                  -- long free-text message
--   }
-- ]
--
-- gifts_sent: [
--   {
--     recipientUserId: string,             -- Mongo _id of the recipient (stored as string)
--     stripeTransactionId: string | null,
--     createdAt: Date,
--     amountCents: number,
--     withdrawn: boolean,
--     withdrawnAt: Date | null,
--     giftProvider: 'stripe' | string,
--     withdrawTransactionId: string | null,
--     giftMessage: string
--   }
-- ]
--
-- Indexes (as created in code):
-- users: createIndex({ supabaseUserId: 1 }, { unique: true })
-- Profile_Matching: createIndex({ userId: 1 }, { unique: true })

-- See docs/HOW_TO_TALK_TO_MONGO.md for operational guidance when inspecting or updating Mongo.

-------------------------------------------------------------------------------
-- 3) MONGODB COLLECTIONS IN 'chopped' (DISCOVERED)
-------------------------------------------------------------------------------
-- Collections:
-- - users
--   Indexes:
--     - { _id: 1 }
--     - { supabaseUserId: 1 } unique
--
-- - USER_PROFILE_IMAGES
--   Indexes:
--     - { _id: 1 }
--     - { userId: 1 } unique
--   Shape (in use):
--     {
--       userId: ObjectId,
--       createdAt: Date,
--       updatedAt?: Date,
--       main?: string | null,
--       thumbs?: Array<{ name: 'thumb1'|'thumb2'|'thumb3'|'thumb4'|'thumb5'|'thumb6', url: string }>
--     }
--
-- - Profile_Matching
--   Indexes:
--     - { _id: 1 }
--     - { userId: 1 } unique
--     - { iam: 1, Iwant: 1 }
--     - { city: 1 }
--     - { stateProvince: 1 }
--     - { age: 1 }
--     - { country: 1 }
--   Shape (selected fields):
--     {
--       userId: ObjectId,
--       displayName?: string,
--       age?: number,
--       heightCm?: number,
--       bio?: string,
--       country?: string,
--       stateProvince?: string,
--       city?: string,
--       locationAnswer?: string,
--       iam?: string,
--       Iwant?: string,
--       healthCondition?: string,
--       Accept_hiv?: boolean,
--       Accept_Herpes?: boolean,
--       Accept_Autism?: boolean,
--       Accept_Physical_Handicap?: boolean
--     }
--
-- - signups
--   Indexes:
--     - { _id: 1 }
--   (Used historically for signup tracking; not actively referenced in current code.)
--
-- - MAPSET (legacy; no longer used by app runtime)
--   Indexes:
--     - { _id: 1 }
--     - { key: 1 }
--   Note: Collection retained for historical reasons; location data now sourced from country-state-city JSON.



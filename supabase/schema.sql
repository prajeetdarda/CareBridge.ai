-- CareBridge.ai Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query → paste & run)

-- ── Profiles ───────────────────────────────────────────────────────────────
-- Single-row table (id = 'default'); upserted on every settings save.

create table if not exists profiles (
  id                    text primary key default 'default',
  family_member_name    text not null default '',
  loved_one_name        text not null default '',
  loved_one_image_url   text,
  loved_one_date_of_birth text not null default '',
  preferred_language    text not null default 'en',
  relationship_label    text not null default '',
  care_topics           jsonb not null default '[]'::jsonb,
  reminder_rules        jsonb not null default '[]'::jsonb,
  backup_contacts       jsonb not null default '[]'::jsonb,
  family_member_image_url text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── Summaries ──────────────────────────────────────────────────────────────

create table if not exists summaries (
  id                    text primary key,
  timestamp             timestamptz not null default now(),
  initiated_by          text not null,
  transcript            text not null default '',
  summary               text not null default '',
  urgency_level         text not null default 'summary_later',
  escalation_reason     text,
  action_taken          text,
  media_path            text,
  media_type            text,
  language              text,
  call_duration_seconds integer
);

create index if not exists idx_summaries_timestamp on summaries (timestamp desc);

-- ── Alerts ─────────────────────────────────────────────────────────────────

create table if not exists alerts (
  id                    text primary key,
  session_id            text not null,
  timestamp             timestamptz not null default now(),
  urgency_level         text not null,
  reason                text not null default '',
  transcript            text,
  acknowledged          boolean not null default false
);

create index if not exists idx_alerts_acknowledged on alerts (acknowledged, timestamp desc);

-- ── Pending Calls (child → parent handoff) ─────────────────────────────────

create table if not exists pending_calls (
  session_id            text primary key,
  created_at            timestamptz not null default now(),
  expires_at            timestamptz not null,
  scheduled_for         timestamptz,
  incoming_signal_at    timestamptz,
  profile_snapshot      jsonb not null default '{}'::jsonb,
  call_notes            text,
  voice_provider        text not null default 'gemini'
);

create index if not exists idx_pending_calls_expires on pending_calls (expires_at);

-- ── Auto-update updated_at on profiles ─────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at();

-- ── Row Level Security (permissive — service role key bypasses RLS) ────────
-- Enable RLS but allow everything via service role.

alter table profiles enable row level security;
alter table summaries enable row level security;
alter table alerts enable row level security;
alter table pending_calls enable row level security;

create policy "Service role full access" on profiles for all using (true) with check (true);
create policy "Service role full access" on summaries for all using (true) with check (true);
create policy "Service role full access" on alerts for all using (true) with check (true);
create policy "Service role full access" on pending_calls for all using (true) with check (true);

-- If profiles already existed before new image columns were added, run:
-- alter table profiles add column if not exists family_member_image_url text;
-- alter table profiles add column if not exists loved_one_image_url text;

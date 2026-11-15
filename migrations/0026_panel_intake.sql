-- Additive request metadata and durable handoff. Existing requests/files are untouched.
alter table bookings add column if not exists request_kind text not null default 'booking';
alter table bookings add column if not exists requested_services text not null default '[]';
alter table bookings add column if not exists pickup_requested boolean not null default false;
alter table bookings add column if not exists intake_version integer;
create table if not exists panel_intake_queue (
  booking_id integer primary key references bookings(id),
  payload text not null,
  state text not null default 'queued' check (state in ('queued','processing','saved','failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  lease_until timestamptz,
  lease_token text,
  panel_reference text,
  email_status text,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists panel_intake_due_idx on panel_intake_queue(state,next_attempt_at);
alter table panel_intake_queue enable row level security;

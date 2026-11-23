-- Additive, private reception archive. No public renderer reads this table.
-- Apply through the reviewed migration command before activating the release.
create table if not exists panel_catalog_snapshots (
  revision bigint primary key check (revision between 1 and 9007199254740991),
  body text not null check (octet_length(body) between 1 and 2097152),
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  received_at timestamptz not null default now()
);
alter table panel_catalog_snapshots enable row level security;

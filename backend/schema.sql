-- Supabase tables. Paste this whole file into the Supabase SQL editor and run.
-- After creating them, either disable RLS on these tables or use the service key.

create table skill_packs (
  id            text primary key,
  name          text not null,
  lesson        text not null,
  trigger       text not null,
  domain        text not null,
  rep_score     integer not null default 0,
  created_by    text not null,
  episode_count integer not null default 0,
  created_at    timestamptz not null default now()
);

create table agent_runs (
  id          bigserial primary key,
  agent_id    text not null,
  task        text not null,
  outcome     text not null,            -- 'success' | 'fail'
  result      text,
  created_at  timestamptz not null default now()
);

create table install_events (
  id          bigserial primary key,
  pack_id     text not null references skill_packs(id),
  agent_id    text not null,
  created_at  timestamptz not null default now()
);

create index on skill_packs (rep_score desc);

alter table "user"
  add column if not exists "role" text not null default 'user';

alter table "user"
  add column if not exists "banned" boolean not null default false;

alter table "user"
  add column if not exists "banReason" text;

alter table "user"
  add column if not exists "banExpires" timestamptz;

alter table "session"
  add column if not exists "impersonatedBy" text;
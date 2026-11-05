-- Schema and security tests. Run by tools/test-db.sh against a throwaway local Postgres.
-- Each block raises an exception (and the run stops) if an expectation fails.

\set ON_ERROR_STOP on
set client_min_messages = notice;
\o /dev/null

create or replace function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text, ''), false);
  if uid is null then set role anon; else set role authenticated; end if;
end $$;

create or replace function pg_temp.expect_error(sql text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    raise notice 'ok: % (%)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: expected an error: %', label;
end $$;

create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', label; end if;
  raise notice 'ok: %', label;
end $$;

-- Two people sign up.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.test');

select pg_temp.expect((select count(*) from public.user_settings) = 2, 'sign-up creates settings');
select pg_temp.expect((select count(*) from public.notification_preferences) = 2, 'sign-up creates reminder preferences');

-- Alice builds a library and records her morning.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
update public.user_settings set time_zone = 'Asia/Beirut';
insert into public.categories (id, name, color) values
  ('10000000-0000-0000-0000-000000000001', 'Work', '#7c3aed'),
  ('10000000-0000-0000-0000-000000000002', 'Sleep', '#3730a3');
insert into public.activities (id, category_id, name) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Working'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Sleep');
insert into public.activity_records (activity_id, start_at, end_at, time_zone) values
  ('20000000-0000-0000-0000-000000000002', '2026-11-01 23:00+02', '2026-11-02 07:00+02', 'Asia/Beirut'),
  ('20000000-0000-0000-0000-000000000001', '2026-11-02 08:00+02', '2026-11-02 12:00+02', 'Asia/Beirut');
insert into public.daily_reflections (local_date, feeling) values ('2026-11-02', 4);

select pg_temp.expect((select count(*) from public.activity_records) = 2, 'a record crossing midnight is accepted');
select pg_temp.expect(
  (select user_id from public.categories limit 1) = '00000000-0000-0000-0000-00000000000a',
  'user_id defaults to the signed-in person');

-- Overlap rules.
select pg_temp.expect_error($$insert into public.activity_records (activity_id, start_at, end_at)
  values ('20000000-0000-0000-0000-000000000001', '2026-11-02 11:00+02', '2026-11-02 13:00+02')$$,
  'overlapping records are rejected');
insert into public.activity_records (activity_id, start_at, end_at)
  values ('20000000-0000-0000-0000-000000000001', '2026-11-02 12:00+02', '2026-11-02 12:30+02');
select pg_temp.expect(true, 'a record starting exactly when the previous one ends is accepted');

select pg_temp.expect_error($$insert into public.activity_records (activity_id, start_at, end_at)
  values ('20000000-0000-0000-0000-000000000001', now() + interval '1 hour', now() + interval '2 hours')$$,
  'records in the future are rejected');
select pg_temp.expect_error($$insert into public.activity_records (activity_id, start_at, end_at)
  values ('20000000-0000-0000-0000-000000000001', '2026-10-01 08:00+02', '2026-10-05 08:00+02')$$,
  'a record longer than 72 h is rejected');
select pg_temp.expect_error($$insert into public.activity_records (activity_id, start_at, end_at)
  values ('20000000-0000-0000-0000-000000000001', '2026-10-01 09:00+02', '2026-10-01 08:00+02')$$,
  'a record ending before it starts is rejected');
select pg_temp.expect_error($$insert into public.activity_records (activity_id, start_at, end_at, time_zone)
  values ('20000000-0000-0000-0000-000000000001', '2026-10-01 08:00+02', '2026-10-01 09:00+02', 'Mars/Olympus')$$,
  'an unknown time zone is rejected');

-- Live timer: start, switch, stop.
select public.start_activity('20000000-0000-0000-0000-000000000002');
select pg_temp.expect((select count(*) from public.activity_records where end_at is null) = 1, 'start_activity opens one timer');
select pg_temp.expect((select source from public.activity_records where end_at is null) = 'timer', 'timer records are marked as timer');
select pg_temp.expect((select time_zone from public.activity_records where end_at is null) = 'Asia/Beirut', 'timer keeps the person''s time zone');
select pg_temp.expect_error($$insert into public.activity_records (activity_id, start_at)
  values ('20000000-0000-0000-0000-000000000001', now() - interval '1 minute')$$,
  'a second running timer is rejected');
select public.start_activity('20000000-0000-0000-0000-000000000001');
select pg_temp.expect(
  (select count(*) from public.activity_records where source = 'timer') = 1
  and (select activity_id from public.activity_records where end_at is null) = '20000000-0000-0000-0000-000000000001',
  'switching within a minute replaces the mistaken timer instead of keeping a tiny block');
select public.start_activity('20000000-0000-0000-0000-000000000002');
-- Pretend the first timer started 30 minutes ago, then switch.
reset role;
update public.activity_records set start_at = now() - interval '30 minutes' where end_at is null;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select public.start_activity('20000000-0000-0000-0000-000000000001');
select pg_temp.expect((select count(*) from public.activity_records where end_at is null) = 1, 'switching leaves exactly one timer');
select pg_temp.expect(
  (select activity_id from public.activity_records where end_at is null) = '20000000-0000-0000-0000-000000000001',
  'the new activity is the running one');
select pg_temp.expect(
  (select count(*) from public.activity_records a join public.activity_records b
     on a.end_at = b.start_at where b.end_at is null and a.source = 'timer') = 1,
  'the previous timer ended exactly when the next began');
select public.stop_activity();
select pg_temp.expect((select count(*) from public.activity_records where end_at is null) = 0, 'stop_activity ends the timer');

-- Library integrity.
select pg_temp.expect_error($$delete from public.categories where id = '10000000-0000-0000-0000-000000000001'$$,
  'a category in use cannot be deleted');
select pg_temp.expect_error($$delete from public.activities where id = '20000000-0000-0000-0000-000000000001'$$,
  'an activity with history cannot be deleted (it can be archived)');
update public.activities set archived_at = now() where id = '20000000-0000-0000-0000-000000000001';
select pg_temp.expect(true, 'archiving an activity keeps its history');
select pg_temp.expect_error($$insert into public.categories (name, color) values ('work', '#000000')$$,
  'category names are unique per person, ignoring case');
select pg_temp.expect_error($$insert into public.user_settings (user_id) values ('00000000-0000-0000-0000-00000000000a')$$,
  'settings rows cannot be inserted by the client');

-- Bob cannot see or touch any of it.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.expect((select count(*) from public.categories) = 0, 'other people''s categories are invisible');
select pg_temp.expect((select count(*) from public.activities) = 0, 'other people''s activities are invisible');
select pg_temp.expect((select count(*) from public.activity_records) = 0, 'other people''s records are invisible');
select pg_temp.expect((select count(*) from public.daily_reflections) = 0, 'other people''s reflections are invisible');
select pg_temp.expect((select count(*) from public.user_settings) = 1, 'only your own settings are visible');
with u as (update public.activity_records set notes = 'hacked' returning 1)
  select pg_temp.expect((select count(*) from u) = 0, 'other people''s records cannot be updated');
with d as (delete from public.activity_records returning 1)
  select pg_temp.expect((select count(*) from d) = 0, 'other people''s records cannot be deleted');
select pg_temp.expect_error($$insert into public.categories (user_id, name, color)
  values ('00000000-0000-0000-0000-00000000000a', 'Planted', '#000000')$$,
  'rows cannot be written into someone else''s account');
insert into public.categories (id, name, color) values ('10000000-0000-0000-0000-00000000000b', 'Work', '#7c3aed');
select pg_temp.expect_error($$insert into public.activities (category_id, name)
  values ('10000000-0000-0000-0000-000000000001', 'Borrowed category')$$,
  'an activity cannot use someone else''s category');
select pg_temp.expect_error($$insert into public.activity_records (activity_id, start_at, end_at)
  values ('20000000-0000-0000-0000-000000000001', '2026-11-03 08:00+02', '2026-11-03 09:00+02')$$,
  'a record cannot use someone else''s activity');
select pg_temp.expect_error($$update public.categories set user_id = '00000000-0000-0000-0000-00000000000a'$$,
  'rows cannot be handed to someone else');
-- Bob's records do not clash with Alice's at the same time.
insert into public.activities (id, category_id, name)
  values ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'Working');
insert into public.activity_records (activity_id, start_at, end_at)
  values ('20000000-0000-0000-0000-00000000000b', '2026-11-02 08:00+02', '2026-11-02 12:00+02');
select pg_temp.expect(true, 'overlap rules are per person');

-- Anonymous visitors get nothing.
select pg_temp.act_as(null);
select pg_temp.expect_error($$select count(*) from public.activity_records$$, 'anonymous visitors cannot read records');
select pg_temp.expect_error($$select public.start_activity('20000000-0000-0000-0000-000000000001')$$,
  'anonymous visitors cannot start timers');

-- Erasing data removes only your own.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select public.delete_my_data();
select pg_temp.expect((select count(*) from public.activity_records) = 0, 'delete_my_data removes your records');
select pg_temp.expect((select count(*) from public.categories) = 0, 'delete_my_data removes your library');
reset role;
select pg_temp.expect((select count(*) from public.activity_records) = 1, 'other people''s data is untouched');

-- Deleting an account removes everything it owned.
delete from auth.users where id = '00000000-0000-0000-0000-00000000000b';
select pg_temp.expect((select count(*) from public.activity_records) = 0, 'deleting an account cascades');
select pg_temp.expect((select count(*) from public.user_settings) = 1, 'only that account''s settings go');

\echo 'all database tests passed'

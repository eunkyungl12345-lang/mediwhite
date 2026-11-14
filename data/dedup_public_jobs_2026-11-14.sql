-- =============================================================================
-- 메디화이트 · 공공(잡알리오) 채용공고 중복 정리
-- 작성일: 2026-11-14
-- 대상  : author_id = mw_bot 계정이 자동 수집한 공공 공고(jobs)만. 회원이 올린 공고는 건드리지 않음.
-- 원칙  : 같은 공고는 '대표 1건'(가장 먼저 등록된 = 가장 작은 id)만 남기고,
--         댓글(game_state 'jc:j<id>:<key>')·지원 기록('japply:<id>')은 대표 공고로 옮긴 뒤 나머지를 지운다.
--
-- ⚠️ 이 파일은 운영 DB에 자동 실행되지 않는다. Supabase SQL Editor에서 직접 실행한다.
--    1) 먼저 [1] 미리보기만 실행해서 무엇이 지워질지 눈으로 확인
--    2) 이상 없으면 [2]~[6]을 실행
--    3) [7]로 남은 중복이 0인지 확인
--    * 여러 번 실행해도 안전하다(멱등) — 매 실행마다 '지금 남아 있는 중복'만 다시 계산한다.
--    * 지우기 전에 백업을 남기고 싶으면 아래 한 줄의 주석을 풀어 먼저 실행한다.
--      create table if not exists jobs_backup_20261114 as select * from jobs;
-- =============================================================================


-- ── [1] 미리보기 — 지우지 않음. 중복 그룹 목록 ────────────────────────────────
with bot as (
  select id from users where username = 'mw_bot'
),
p as (
  select j.id,
         j.hospital,
         j.welfare,
         j.deadline::text as deadline,
         j.contact,
         j.created_at,
         -- 중복 판정 키: 원문 URL이 있으면 URL, 없으면 (병원 | 공고제목 | 마감일)을 공백·구두점 무시하고 정규화
         coalesce(
           nullif(btrim(j.contact), ''),
           regexp_replace(lower(coalesce(j.hospital, '')), '\s+', '', 'g') || '|' ||
           regexp_replace(lower(coalesce(j.welfare, '')), '\s+', '', 'g') || '|' ||
           coalesce(j.deadline::text, '')
         ) as dup_key
  from jobs j
  join bot on bot.id = j.author_id
)
select dup_key,
       count(*)                       as dup_n,        -- 이 그룹의 공고 수
       min(id)                        as keep_id,      -- 남길 대표 공고 id
       array_agg(id order by id)      as all_ids,      -- 지워질 후보 id들
       min(hospital)                  as hospital,
       min(welfare)                   as welfare,
       min(deadline)                  as deadline
from p
group by dup_key
having count(*) > 1
order by dup_n desc, keep_id;


-- ── [2] 정리 대상 매핑 테이블 만들기 (이번 세션에만 존재) ─────────────────────
drop table if exists pg_temp.pub_job_dedup;
create temp table pub_job_dedup as
with bot as (
  select id from users where username = 'mw_bot'
),
p as (
  select j.id,
         coalesce(
           nullif(btrim(j.contact), ''),
           regexp_replace(lower(coalesce(j.hospital, '')), '\s+', '', 'g') || '|' ||
           regexp_replace(lower(coalesce(j.welfare, '')), '\s+', '', 'g') || '|' ||
           coalesce(j.deadline::text, '')
         ) as dup_key
  from jobs j
  join bot on bot.id = j.author_id
),
g as (
  select id, dup_key, min(id) over (partition by dup_key) as keep_id
  from p
)
select id as dup_id, keep_id
from g
where id <> keep_id;

create index on pub_job_dedup (dup_id);

-- 이번 실행에서 지울 건수 / 남길 건수
select (select count(*) from pub_job_dedup) as delete_targets,
       (select count(distinct keep_id) from pub_job_dedup) as keep_targets;


-- ── [3] 공고 댓글·질문 이관: jc:j<중복id>:<key> → jc:j<대표id>:<key> ─────────
--        같은 사람이 대표 공고에 이미 같은 댓글을 남겨 두었다면 옮기지 않는다(중복 방지).
update game_state gs
set game = 'jc:j' || d.keep_id || ':' || split_part(gs.game, ':', 3)
from pub_job_dedup d
where gs.game like 'jc:j' || d.dup_id || ':%'
  and not exists (
    select 1 from game_state k
    where k.user_id = gs.user_id
      and k.game = 'jc:j' || d.keep_id || ':' || split_part(gs.game, ':', 3)
  );


-- ── [4] 지원 기록 이관: japply:<중복id> → japply:<대표id> ────────────────────
update game_state gs
set game = 'japply:' || d.keep_id
from pub_job_dedup d
where gs.game = 'japply:' || d.dup_id
  and not exists (
    select 1 from game_state k
    where k.user_id = gs.user_id
      and k.game = 'japply:' || d.keep_id
  );


-- ── [5] 이관 후 남은(대표 공고에 같은 기록이 이미 있는) 중복 참조 행 정리 ────
delete from game_state gs
using pub_job_dedup d
where gs.game like 'jc:j' || d.dup_id || ':%'
   or gs.game = 'japply:' || d.dup_id;


-- ── [6] 중복 공고 삭제 (대표로 쓰이는 id는 어떤 경우에도 지우지 않는다) ──────
delete from jobs j
using pub_job_dedup d
where j.id = d.dup_id
  and j.id not in (select keep_id from pub_job_dedup);


-- ── [7] 정리 결과 확인 ───────────────────────────────────────────────────────
-- (a) 남은 중복: 0행이면 완료. 0이 아니면 이 파일을 한 번 더 실행하면 된다(체인이 남은 경우).
with bot as (
  select id from users where username = 'mw_bot'
),
p as (
  select j.id,
         coalesce(
           nullif(btrim(j.contact), ''),
           regexp_replace(lower(coalesce(j.hospital, '')), '\s+', '', 'g') || '|' ||
           regexp_replace(lower(coalesce(j.welfare, '')), '\s+', '', 'g') || '|' ||
           coalesce(j.deadline::text, '')
         ) as dup_key
  from jobs j
  join bot on bot.id = j.author_id
)
select dup_key, count(*) as left_n, array_agg(id order by id) as ids
from p
group by dup_key
having count(*) > 1
order by left_n desc;

-- (b) 공공 공고 전체 건수 (정리 후)
select count(*) as public_jobs_left
from jobs j
join users u on u.id = j.author_id
where u.username = 'mw_bot';

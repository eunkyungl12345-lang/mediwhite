-- 3차: 경험치 지급을 DB 함수 한 번으로 (채팅 속도 개선)
create or replace function grant_xp(p_user uuid, p_amount int, p_key text, p_kind text, p_cap int)
returns table(old_xp int, new_xp int, granted int) language plpgsql security definer as $$
declare v_old int; v_today int; v_ins int;
begin
  if p_key is not null then
    insert into xp_log(user_id, key, amount, kind) values (p_user, p_key, p_amount, p_kind) on conflict do nothing;
    get diagnostics v_ins = row_count;
    if v_ins = 0 then select xp, xp, 0 into old_xp, new_xp, granted from users where id = p_user; return next; return; end if;
  else
    if p_cap > 0 then
      select coalesce(sum(amount),0) into v_today from xp_log
        where user_id = p_user and kind = p_kind and created_at >= (date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul');
      if v_today + p_amount > p_cap then select xp, xp, 0 into old_xp, new_xp, granted from users where id = p_user; return next; return; end if;
    end if;
    insert into xp_log(user_id, key, amount, kind) values (p_user, null, p_amount, p_kind);
  end if;
  update users set xp = xp + p_amount where id = p_user returning xp - p_amount, xp into v_old, new_xp;
  old_xp := v_old; granted := p_amount; return next;
end $$;

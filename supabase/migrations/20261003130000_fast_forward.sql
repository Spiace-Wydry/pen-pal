-- Demo helper: move every letter in the user's pairings 2 days into the past,
-- so letters "in transit" arrive immediately. Delivery state is derived from these timestamps.
create function public.fast_forward_letters(p_user uuid) returns integer
language sql as $$
  with moved as (
    update public.letters l
       set sent_at = l.sent_at - interval '2 days',
           deliver_at = l.deliver_at - interval '2 days'
      from public.pairings p
     where p.id = l.pairing_id and p_user in (p.user_a_id, p.user_b_id)
    returning 1)
  select count(*)::int from moved
$$;
revoke execute on function public.fast_forward_letters(uuid) from public, anon, authenticated;

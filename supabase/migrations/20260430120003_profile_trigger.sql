-- Auto-create a profiles row and an empty user_settings row when a new user
-- signs up. The user_settings row's webhook_secret is generated from its
-- column default, so the user can copy a working webhook URL on first visit
-- to the Settings page.
--
-- security definer is required because the trigger fires inside auth.users
-- and needs to write into public.* tables that the auth role can't otherwise
-- touch. search_path is pinned to public to prevent search_path-injection.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.user_settings (user_id, recipient_email)
  values (new.id, new.email);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

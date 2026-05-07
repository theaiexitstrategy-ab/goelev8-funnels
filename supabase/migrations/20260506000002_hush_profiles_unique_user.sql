-- (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
--
-- Each Hush user has exactly one profile row. The original schema migration
-- (20260506000000) missed the UNIQUE constraint on hush_profiles.user_id;
-- without it the onboarding upsert can't pin a target row and would insert
-- duplicate profiles per user.

ALTER TABLE hush_profiles
  ADD CONSTRAINT hush_profiles_user_id_unique UNIQUE (user_id);

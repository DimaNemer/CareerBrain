-- Migration: add the 'viewer' company role
--
-- The team UI offers Viewer as a permission level, but 00003 constrained
-- company_invites.role to ('owner','admin','recruiter'), so inviting a viewer
-- was rejected by the database even though the API accepted the value.
--
-- This widens the invite CHECK constraint. It is intentionally additive and
-- idempotent so it is safe to re-run.
--
-- Note: company_members.role carries no CHECK constraint in this schema, so
-- existing memberships with role 'viewer' already work. If your database has
-- one on company_members, run the same ALTER against that table.

ALTER TABLE public.company_invites
  DROP CONSTRAINT IF EXISTS company_invites_role_check;

ALTER TABLE public.company_invites
  ADD CONSTRAINT company_invites_role_check
  CHECK (role IN ('owner', 'admin', 'recruiter', 'viewer'));

-- The application guards the viewer role itself: only an owner or admin may
-- change roles, and only an owner may mint or revoke an owner. Adding the
-- value to the enum does not grant it any capability by itself.
--
-- A viewer cannot open the applicant pipeline, so a company that demotes
-- everyone to viewer locks itself out of hiring. Existing code already treats
-- 'viewer' as read-only (lib/employer-auth.js COMPANY_ROLES), which is why it
-- was absent from the earlier list.
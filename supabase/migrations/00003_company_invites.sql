-- Migration: company invites
-- Adds a pending-invite flow for building a company team.
--
-- Security model:
-- - Only the invitee can read or respond to their own invite (by email).
-- - Employers can only see invites for a company they are an active member of.
-- - There is no INSERT policy: invites are created server-side through the
--   service-role API route, which additionally enforces owner/admin roles.
--   This means a client can never fabricate an invite.
-- - There is no UPDATE policy: state transitions happen server-side only.

CREATE TABLE IF NOT EXISTS public.company_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'recruiter',
  job_title text,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  responded_at timestamptz
);

CREATE INDEX IF NOT EXISTS company_invites_company_idx
  ON public.company_invites (company_id);

CREATE INDEX IF NOT EXISTS company_invites_email_idx
  ON public.company_invites (email);

-- A company can only have one live invite per email address.
CREATE UNIQUE INDEX IF NOT EXISTS company_invites_pending_unique
  ON public.company_invites (company_id, email)
  WHERE status = 'pending';

ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

-- The invitee can see invites addressed to their own email.
-- Uses the `email` claim Supabase puts in the access token rather than a
-- profiles column, which this codebase does not read anywhere.
CREATE POLICY "Users can view invites addressed to them"
  ON public.company_invites
  FOR SELECT TO authenticated
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Employers can list the invites for a company they belong to.
CREATE POLICY "Company members can view their company invites"
  ON public.company_invites
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.company_id = company_invites.company_id
        AND cm.is_current = true
    )
  );

-- Constrain role/status to known values so bad data cannot be written.
ALTER TABLE public.company_invites
  DROP CONSTRAINT IF EXISTS company_invites_role_check;

ALTER TABLE public.company_invites
  ADD CONSTRAINT company_invites_role_check
  CHECK (role IN ('owner', 'admin', 'recruiter'));

ALTER TABLE public.company_invites
  DROP CONSTRAINT IF EXISTS company_invites_status_check;

ALTER TABLE public.company_invites
  ADD CONSTRAINT company_invites_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'revoked'));

-- ---------------------------------------------------------------------------
-- Atomic invite acceptance.
--
-- Accepting an invite inserts a membership AND flips the invite to accepted.
-- Doing that in two statements from the app is racy: a failure between the two
-- leaves a membership with a still-pending invite (permanent wedge, because
-- every retry then hits the "already on a team" branch), and two concurrent
-- accepts can both pass the "is there a current membership?" check and insert
-- two rows. A user with two current memberships breaks every other query that
-- expects a single current company.
--
-- One function, one transaction, row lock on the invite. This is the only
-- supported way to join a company team.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_company_invite(p_invite_id uuid)
RETURNS public.company_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_invite public.company_invites%ROWTYPE;
  v_user_email text;
  v_profile_role text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the invite row for the rest of the transaction so a concurrent
  -- accept of the same invite cannot slip through.
  SELECT * INTO v_invite
    FROM public.company_invites
    WHERE id = p_invite_id
    FOR UPDATE;

  IF NOT FOUND OR v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'Invite is not available';
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invite has expired';
  END IF;

  SELECT lower(u.email) INTO v_user_email
    FROM auth.users u
    WHERE u.id = v_user_id;

  -- The invite must be addressed to the caller's own verified email. This is
  -- what proves the caller controls the invited mailbox.
  IF v_invite.email IS NULL
     OR lower(v_invite.email) IS DISTINCT FROM v_user_email THEN
    RAISE EXCEPTION 'Invite is not available';
  END IF;

  -- Only employer accounts can hold company memberships. Without this check a
  -- job seeker could accept an invite and end up with a membership they have
  -- no way to clear, permanently locking themselves out of their own account.
  SELECT role INTO v_profile_role
    FROM public.profiles
    WHERE id = v_user_id;

  IF v_profile_role IS DISTINCT FROM 'employer' THEN
    RAISE EXCEPTION 'Only employer accounts can join a company team';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = v_user_id AND is_current = true
  ) THEN
    RAISE EXCEPTION 'You already belong to a company';
  END IF;

  UPDATE public.company_invites
    SET status = 'accepted', responded_at = now()
    WHERE id = p_invite_id;

  RETURN QUERY
    INSERT INTO public.company_members
      (company_id, user_id, job_title, role, is_current)
    VALUES
      (v_invite.company_id, v_user_id, v_invite.job_title, v_invite.role, true)
    RETURNING *;
END;
$$;

-- Callers are ordinary signed-in users, NOT the service role: the function
-- reads auth.uid(), which is only populated when invoked with the caller's own
-- JWT. Exposing it to `authenticated` is safe precisely because the identity is
-- derived from the token rather than accepted as an argument - a caller can
-- never choose whose invite to accept or which company to join. SECURITY
-- DEFINER is what lets it write company_members, which the user cannot do
-- directly under RLS.
REVOKE ALL ON FUNCTION public.accept_company_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_company_invite(uuid) TO authenticated;

-- A user can hold only ONE current company. Enforced here rather than in
-- application code so that two concurrent accepts cannot both pass an
-- application-level "do they already have a team?" check and each insert a row.
-- A user with two current memberships breaks every query that resolves a
-- single current company, locking them out of the workspace.
CREATE UNIQUE INDEX IF NOT EXISTS company_members_one_current_per_user
  ON public.company_members (user_id)
  WHERE is_current = true;

-- ---------------------------------------------------------------------------
-- Last-owner protection.
--
-- The application checks "is this the only owner?" before demoting or removing
-- a teammate, but two owners acting at the same moment can both observe a
-- count of 2 and both succeed, leaving the company with zero owners and nobody
-- able to administer it. This trigger makes the invariant unconditional: any
-- UPDATE or DELETE that would remove the final active owner is rejected at the
-- database, no matter which code path attempted it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_last_company_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  removing_active_owner boolean := false;
  remaining_owners integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    removing_active_owner := OLD.role = 'owner' AND OLD.is_current;
  ELSIF TG_OP = 'UPDATE' THEN
    removing_active_owner :=
      OLD.role = 'owner'
      AND OLD.is_current
      AND (NEW.role IS DISTINCT FROM 'owner' OR NEW.is_current IS DISTINCT FROM true);
  END IF;

  IF removing_active_owner THEN
    SELECT count(*) INTO remaining_owners
      FROM public.company_members
      WHERE company_id = COALESCE(NEW.company_id, OLD.company_id)
        AND role = 'owner'
        AND is_current = true
        AND id IS DISTINCT FROM COALESCE(NEW.id, OLD.id);

    IF remaining_owners = 0 THEN
      RAISE EXCEPTION 'A company must keep at least one active owner';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS company_members_guard_last_owner ON public.company_members;

CREATE TRIGGER company_members_guard_last_owner
  BEFORE UPDATE OR DELETE ON public.company_members
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_last_company_owner();

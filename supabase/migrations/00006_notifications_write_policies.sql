-- Migration: let users mark their own notifications read / delete them
--
-- Why this exists
-- ---------------
-- RLS is already enabled on public.notifications in this project, and 00005
-- adds a SELECT policy scoped to the owner. It deliberately adds no write
-- policies, on the assumption that every write goes through the service-role
-- client and therefore bypasses RLS.
--
-- That assumption is only half true, and it is the half that breaks:
--
--   INSERT  - service role only (lib/supabase-service.js). Correct to leave
--             policy-free so an anon-key client cannot forge notifications.
--   UPDATE  - app/api/notifications/[id]/route.js      (mark one read)
--             app/api/notifications/read-all/route.js   (mark all read)
--   DELETE  - app/api/notifications/[id]/route.js      (delete one)
--
-- All three of those run on the USER-SCOPED client from
-- lib/supabase-server.js, which passes the caller's JWT and is subject to RLS.
-- With no UPDATE/DELETE policy, Postgres filters those statements to zero rows.
-- Supabase returns HTTP 200 with an empty array rather than an error, so what
-- the user actually sees differs per route:
--
--   PATCH  /api/notifications/[id]        -> 404 "Notification not found",
--                                            because .single() turns zero rows
--                                            into PGRST116. Misleading, at least.
--   DELETE /api/notifications/[id]        -> 200 { success: true } and the row is
--                                            still there. Silent no-op.
--   POST   /api/notifications/read-all    -> 200 { success: true } and nothing
--                                            was marked. The badge never clears.
--
-- These policies are scoped to `auth.uid() = user_id`, so a user can only ever
-- touch their own notifications. They do not widen access to anyone else's
-- rows, and they do not permit INSERT - forging notifications stays blocked.
--
-- Idempotent: re-running is a no-op. Policies are permissive and OR'd
-- together, so if a write policy already exists under a different name this
-- adds a second equivalent one instead of conflicting with it.

-- ── Mark read / unread ─────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
      AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications"
      ON public.notifications
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- ── Delete own notification ────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
      AND policyname = 'Users can delete their own notifications'
  ) THEN
    CREATE POLICY "Users can delete their own notifications"
      ON public.notifications
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;
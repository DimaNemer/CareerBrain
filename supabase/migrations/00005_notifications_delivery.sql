-- Migration: make in-app notifications actually arrive, fast
--
-- The notification bell reads its data from GET /api/notifications once at
-- mount, then relies entirely on Supabase Realtime for anything that arrives
-- afterwards. Nothing in this repository ever added `notifications` to a
-- realtime publication, so on any project where that was not clicked through
-- by hand in the dashboard, the bell silently froze at whatever it loaded on
-- page load. An applicant could be accepted and see nothing until a hard
-- refresh.
--
-- This migration makes delivery deterministic:
--
--   1. Realtime publication, so postgres_changes INSERT events fire.
--   2. An index for the read path (filter by user_id, order by created_at).
--   3. RLS, which the client needs for Realtime to deliver rows at all.
--
-- Every statement is idempotent, so it is safe to re-run.

-- ── Realtime publication ────────────────────────────────────────────────
-- postgres_changes only emits for tables in the `supabase_realtime`
-- publication. Without this the subscriber in hooks/useNotifications.js
-- connects successfully, reports SUBSCRIBED, and then never receives a
-- single event, which looks identical to "no new notifications".
--
-- REPLICA IDENTITY FULL is not required for INSERT events (the new row is
-- carried in full regardless) but is set so a future DELETE handler, which
-- reads payload.old, is not silently missing its primary key.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;

ALTER TABLE public.notifications
  REPLICA IDENTITY FULL;

-- ── Read path index ────────────────────────────────────────────────────
-- GET /api/notifications filters user_id and orders created_at DESC, and the
-- unread badge counts user_id + is_read. Neither had a committed index, so
-- every bell mount was a sequential scan.
CREATE INDEX IF NOT EXISTS notifications_user_id_created_at_idx
  ON public.notifications (user_id, created_at DESC);

-- Partial index: the unread count only ever touches unread rows, and they are
-- a small fraction of the table once history builds up.
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON public.notifications (user_id)
  WHERE is_read = false;

-- ── Row level security ─────────────────────────────────────────────────
-- RLS is what makes the realtime filter `user_id=eq.<uid>` meaningful. The
-- browser client in hooks/useNotifications.js subscribes with the anon key,
-- so without an `auth.uid() = user_id` policy a subscriber could read another
-- user's notifications by passing their id in the filter.
--
-- If RLS was already enabled and already correct, these are no-ops.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'notifications'
      AND policyname = 'Users can read their own notifications'
  ) THEN
    CREATE POLICY "Users can read their own notifications"
      ON public.notifications
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Writes deliberately have no policy. INSERT is only ever issued through
-- lib/supabase-service.js (service role), which bypasses RLS, so a client
-- holding just the anon key cannot fabricate a notification for someone else.
--
-- UPDATE and DELETE are a different case and DO need policies: these are issued
-- by the *user-scoped* client in app/api/notifications/[id]/route.js and
-- app/api/notifications/read-all/route.js, not the service role. Without an
-- owner-scoped write policy RLS filters those statements to zero rows and
-- "mark as read" / "delete" fail silently. See 00006 for those policies.
--
-- Note for local dev: app/api/notifications/test/route.js inserts with the
-- *user-scoped* client, so it will be rejected by RLS. That is correct
-- behaviour, and the route is 404 in production anyway.
--
-- service_role retains full access regardless of these policies, so no
-- existing notification write breaks.
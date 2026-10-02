-- Allow authenticated users to INSERT into skills table (needed for embed-seeding)
CREATE POLICY "Authenticated users can insert skills" ON public.skills
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to UPDATE skills (needed for embedding vector updates)
CREATE POLICY "Authenticated users can update skills" ON public.skills
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Restrict DELETE to service role only (no delete policy for authenticated)

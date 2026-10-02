CREATE TABLE IF NOT EXISTS public.applied_opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) NOT NULL,
  applied_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE (user_id, opportunity_id)
);

ALTER TABLE public.applied_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications" ON public.applied_opportunities
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications" ON public.applied_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications" ON public.applied_opportunities
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

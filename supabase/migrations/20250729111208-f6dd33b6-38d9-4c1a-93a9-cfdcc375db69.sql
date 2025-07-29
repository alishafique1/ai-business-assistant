-- Add missing RLS policies for existing tables

-- Business expenses policies
ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own business expenses" 
ON public.business_expenses 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Business outcomes policies  
ALTER TABLE public.business_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own business outcomes" 
ON public.business_outcomes 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Client metrics policies
ALTER TABLE public.client_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own client metrics" 
ON public.client_metrics 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add policies for expenses table (already has RLS enabled but limited policies)
CREATE POLICY "Users can insert their own expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" 
ON public.expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" 
ON public.expenses 
FOR DELETE 
USING (auth.uid() = user_id);
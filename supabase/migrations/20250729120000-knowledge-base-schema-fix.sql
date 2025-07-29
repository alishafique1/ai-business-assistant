-- Create proper knowledge_base table structure
DROP TABLE IF EXISTS public.knowledge_base;

CREATE TABLE public.knowledge_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category text,
    tags text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own knowledge base entries" 
ON public.knowledge_base 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_knowledge_base_updated_at
    BEFORE UPDATE ON public.knowledge_base
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
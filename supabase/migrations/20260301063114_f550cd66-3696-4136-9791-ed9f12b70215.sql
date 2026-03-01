
-- Prompt Vault table
CREATE TABLE public.prompt_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.prompt_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prompts" ON public.prompt_vault FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prompts" ON public.prompt_vault FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prompts" ON public.prompt_vault FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prompts" ON public.prompt_vault FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_prompt_vault_updated_at BEFORE UPDATE ON public.prompt_vault FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

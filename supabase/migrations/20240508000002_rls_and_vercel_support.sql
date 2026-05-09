-- RLS and ownership fixes required by the Vite/Vercel application.

-- Create a profile automatically when a Supabase Auth user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- The current UI stores user-owned mock servers and contracts without a workspace.
ALTER TABLE public.mock_servers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.mock_servers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage mock servers in their workspace" ON public.mock_servers;
DROP POLICY IF EXISTS "Users can manage their own mock servers" ON public.mock_servers;
CREATE POLICY "Users can manage their own mock servers"
ON public.mock_servers FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

ALTER TABLE public.mock_endpoints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage endpoints for their mock servers" ON public.mock_endpoints;
CREATE POLICY "Users can manage endpoints for their mock servers"
ON public.mock_endpoints FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.mock_servers ms
    WHERE ms.id = mock_endpoints.mock_server_id
      AND ms.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.mock_servers ms
    WHERE ms.id = mock_endpoints.mock_server_id
      AND ms.owner_id = auth.uid()
  )
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own contracts" ON public.contracts;
CREATE POLICY "Users can manage their own contracts"
ON public.contracts FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own request logs" ON public.request_logs;
CREATE POLICY "Users can view their own request logs"
ON public.request_logs FOR SELECT
USING (auth.uid() = user_id);

-- Webhook inserts must go through the local Express server or Vercel function,
-- both of which use the Supabase service role key.
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can insert webhook events" ON public.webhook_events;
DROP POLICY IF EXISTS "Users can view their own webhook events" ON public.webhook_events;
CREATE POLICY "Users can view their own webhook events"
ON public.webhook_events FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mock_servers_owner_id ON public.mock_servers(owner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_owner_id ON public.contracts(owner_id);

DROP TRIGGER IF EXISTS update_mock_servers_updated_at ON public.mock_servers;
CREATE TRIGGER update_mock_servers_updated_at
BEFORE UPDATE ON public.mock_servers
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

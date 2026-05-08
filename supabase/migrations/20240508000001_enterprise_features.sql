-- Enterprise FlowForge Schema Expansion

-- Environments
CREATE TABLE IF NOT EXISTS public.environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extended Requests (adding schema validation config)
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS expected_schema JSONB;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"timeout": 30000, "retries": 0}'::jsonb;

-- Request Execution Logs (Centralized Logging)
CREATE TABLE IF NOT EXISTS public.request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_headers JSONB,
    response_body JSONB,
    duration_ms INTEGER,
    validation_results JSONB, -- Results from the validation engine
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mock Servers
CREATE TABLE IF NOT EXISTS public.mock_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mock Endpoints
CREATE TABLE IF NOT EXISTS public.mock_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mock_server_id UUID REFERENCES public.mock_servers(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    method TEXT NOT NULL,
    response_status INTEGER DEFAULT 200,
    response_headers JSONB DEFAULT '{"Content-Type": "application/json"}'::jsonb,
    response_body JSONB,
    delay_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specification JSONB NOT NULL, -- OpenAPI / Swagger
    version TEXT NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications / Alerts
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'error', 'warning', 'info', 'success'
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Additional Policies

-- Environments
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view environments in their workspace" ON public.environments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.profiles p ON p.organization_id = w.organization_id
    WHERE w.id = environments.workspace_id AND p.id = auth.uid()
  )
);

-- Request Logs
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own request logs" ON public.request_logs FOR SELECT USING (auth.uid() = user_id);

-- Mock Servers
ALTER TABLE public.mock_servers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage mock servers in their workspace" ON public.mock_servers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.profiles p ON p.organization_id = w.organization_id
    WHERE w.id = mock_servers.workspace_id AND p.id = auth.uid()
  )
);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_request_logs_user_id ON public.request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON public.request_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON public.webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_endpoints_server_id ON public.mock_endpoints(mock_server_id);

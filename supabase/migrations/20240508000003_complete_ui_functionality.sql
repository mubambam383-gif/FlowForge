-- Data support for the visible FlowForge UI controls.

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.environments ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own collections" ON public.collections;
CREATE POLICY "Users can manage their own collections"
ON public.collections FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own requests" ON public.requests;
CREATE POLICY "Users can manage their own requests"
ON public.requests FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view environments in their workspace" ON public.environments;
DROP POLICY IF EXISTS "Users can manage their own environments" ON public.environments;
CREATE POLICY "Users can manage their own environments"
ON public.environments FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own api keys" ON public.api_keys;
CREATE POLICY "Users can manage their own api keys"
ON public.api_keys FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can view their organizations" ON public.organizations;
CREATE POLICY "Owners can view their organizations"
ON public.organizations FOR SELECT
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create organizations they own" ON public.organizations;
CREATE POLICY "Users can create organizations they own"
ON public.organizations FOR INSERT
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;
CREATE POLICY "Owners can update their organizations"
ON public.organizations FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage invitations" ON public.organization_invitations;
CREATE POLICY "Owners can manage invitations"
ON public.organization_invitations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_invitations.organization_id
      AND o.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = organization_invitations.organization_id
      AND o.owner_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_collections_owner_id ON public.collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_requests_owner_id ON public.requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_environments_owner_id ON public.environments(owner_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON public.organization_invitations(organization_id);

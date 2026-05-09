import DashboardLayout from '../components/DashboardLayout';
import { Settings as SettingsIcon, Shield, Users, Key, Bell, Globe, CreditCard, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../hooks/useAuth';
import { createNotification } from '../lib/notifications';
import { getErrorMessage, slugify } from '../lib/validation';

const tabs = [
  { icon: SettingsIcon, label: 'General' },
  { icon: Users, label: 'Members' },
  { icon: Key, label: 'API Keys' },
  { icon: Bell, label: 'Notifications' },
  { icon: Shield, label: 'Security' },
  { icon: Globe, label: 'Environments' },
  { icon: CreditCard, label: 'Billing' },
];

export default function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('General');
  const [org, setOrg] = useState<any>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [envName, setEnvName] = useState('');
  const [envVariables, setEnvVariables] = useState('{\n  "API_BASE_URL": "https://api.example.com"\n}');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    const profile = await supabase.from('profiles').select('organization_id').eq('id', user?.id).single();
    let organization = null;
    if (profile.data?.organization_id) {
      const { data } = await supabase.from('organizations').select('*').eq('id', profile.data.organization_id).single();
      organization = data;
    }
    setOrg(organization);
    setOrgName(organization?.name || 'FlowForge Engineering');
    setOrgSlug(organization?.slug || slugify(organization?.name || 'flowforge-engineering'));

    const [keys, notices, envs, invitationRows] = await Promise.all([
      supabase.from('api_keys').select('id, name, scopes, created_at, last_used_at').eq('user_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(25),
      supabase.from('environments').select('*').eq('owner_id', user?.id).order('created_at', { ascending: false }),
      organization ? supabase.from('organization_invitations').select('*').eq('organization_id', organization.id).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    setApiKeys(keys.data || []);
    setNotifications(notices.data || []);
    setEnvironments(envs.data || []);
    setInvites(invitationRows.data || []);
  };

  const saveOrganization = async () => {
    if (!user || !orgName.trim()) return;
    try {
      const payload = { name: orgName.trim(), slug: slugify(orgSlug || orgName), owner_id: user.id };
      const { data, error } = org
        ? await supabase.from('organizations').update(payload).eq('id', org.id).select().single()
        : await supabase.from('organizations').insert(payload).select().single();
      if (error) throw error;
      if (!org) await supabase.from('profiles').update({ organization_id: data.id }).eq('id', user.id);
      setOrg(data);
      setOrgSlug(data.slug);
      setStatusMessage('Organization saved.');
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  };

  const createApiKey = async () => {
    if (!user) return;
    const rawKey = `ff_live_${crypto.randomUUID().replaceAll('-', '')}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey));
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    const { error } = await supabase.from('api_keys').insert({
      user_id: user.id,
      name: `Production Key ${apiKeys.length + 1}`,
      key_hash: keyHash,
      scopes: ['read', 'write'],
    });
    if (error) {
      setStatusMessage(error.message);
      return;
    }
    await loadSettings();
    setStatusMessage(`Copy this key now: ${rawKey}`);
  };

  const revokeApiKey = async (id: string) => {
    if (!confirm('Revoke this API key?')) return;
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) setStatusMessage(error.message);
    await loadSettings();
  };

  const inviteMember = async () => {
    if (!org || !inviteEmail.includes('@')) {
      setStatusMessage('Save an organization and enter a valid email first.');
      return;
    }
    const { error } = await supabase.from('organization_invitations').insert({
      organization_id: org.id,
      email: inviteEmail.trim().toLowerCase(),
      role: 'member',
      invited_by: user?.id,
    });
    if (error) setStatusMessage(error.message);
    setInviteEmail('');
    await loadSettings();
  };

  const createEnvironment = async () => {
    if (!user || !envName.trim()) return;
    try {
      const { error } = await supabase.from('environments').insert({
        owner_id: user.id,
        name: envName.trim(),
        variables: JSON.parse(envVariables || '{}'),
      });
      if (error) throw error;
      setEnvName('');
      await loadSettings();
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
    }
  };

  const sendResetEmail = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin + '/auth' });
    setStatusMessage(error ? error.message : 'Password reset email sent.');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        <header>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">Settings</h1>
          <p className="text-xs text-neutral-500">Manage your organization, team, and security preferences.</p>
        </header>

        {statusMessage && <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-neutral-300">{statusMessage}</div>}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <SettingsNavItem key={tab.label} icon={tab.icon} label={tab.label} active={activeTab === tab.label} onClick={() => setActiveTab(tab.label)} />
            ))}
          </nav>

          <div className="md:col-span-3 space-y-8">
            {activeTab === 'General' && (
              <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-6 text-sm font-semibold">Organization Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Name" value={orgName} onChange={setOrgName} />
                  <Field label="Slug" value={orgSlug} onChange={(value) => setOrgSlug(slugify(value))} />
                </div>
                <button onClick={saveOrganization} className="mt-6 rounded-lg bg-brand-blue px-4 py-2 text-xs font-bold">Save organization</button>
              </section>
            )}

            {activeTab === 'Members' && (
              <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-6 text-sm font-semibold">Members</h3>
                <div className="mb-4 flex gap-2">
                  <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="member@example.com" className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
                  <button onClick={inviteMember} className="rounded-lg bg-brand-blue px-4 text-xs font-bold">Invite</button>
                </div>
                <SettingRow title={user?.email || 'Current user'} subtitle="Owner" />
                {invites.map((invite) => <SettingRow key={invite.id} title={invite.email} subtitle={`Invitation ${invite.status}`} />)}
              </section>
            )}

            {activeTab === 'API Keys' && (
              <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-6 text-sm font-semibold">API Keys</h3>
                <div className="space-y-4">
                  {apiKeys.length === 0 && <div className="text-xs italic text-neutral-600">No API keys created yet.</div>}
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/40 p-3">
                      <div>
                        <div className="text-xs font-semibold">{key.name}</div>
                        <div className="mt-0.5 text-[10px] font-mono text-neutral-600">Created {new Date(key.created_at).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => revokeApiKey(key.id)} className="text-xs font-bold text-brand-blue hover:underline">Revoke</button>
                    </div>
                  ))}
                  <button onClick={createApiKey} className="flex items-center gap-2 text-xs font-bold text-brand-blue hover:underline">Create new API key +</button>
                </div>
              </section>
            )}

            {activeTab === 'Notifications' && (
              <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-6 text-sm font-semibold">Notifications</h3>
                {notifications.length === 0 ? <div className="text-xs italic text-neutral-600">No notifications yet.</div> : notifications.map((item) => <SettingRow key={item.id} title={item.title} subtitle={item.message} />)}
              </section>
            )}

            {activeTab === 'Security' && (
              <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-6 text-sm font-semibold">Security</h3>
                <button onClick={sendResetEmail} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold">Send password reset email</button>
              </section>
            )}

            {activeTab === 'Environments' && (
              <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-6 text-sm font-semibold">Environments</h3>
                <div className="mb-4 grid grid-cols-1 gap-3">
                  <input value={envName} onChange={e => setEnvName(e.target.value)} placeholder="Production" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
                  <textarea value={envVariables} onChange={e => setEnvVariables(e.target.value)} className="h-28 rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-xs outline-none" />
                  <button onClick={createEnvironment} className="w-fit rounded-lg bg-brand-blue px-4 py-2 text-xs font-bold">Create environment</button>
                </div>
                {environments.map((env) => <SettingRow key={env.id} title={env.name} subtitle={JSON.stringify(env.variables)} />)}
              </section>
            )}

            {activeTab === 'Billing' && (
              <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <h3 className="mb-6 text-sm font-semibold">Billing</h3>
                <SettingRow title="Developer Plan" subtitle="Local and Vercel deployment ready. Add Stripe before accepting payments." />
              </section>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, value, onChange }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-brand-blue/50 focus:outline-none" />
    </div>
  );
}

function SettingRow({ title, subtitle }: any) {
  return (
    <div className="mb-2 flex items-center justify-between rounded-lg border border-white/5 bg-black/40 p-3">
      <div>
        <div className="text-xs font-semibold">{title}</div>
        <div className="mt-0.5 text-[10px] text-neutral-600">{subtitle}</div>
      </div>
    </div>
  );
}

function SettingsNavItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
      active ? "bg-white/5 text-white" : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]"
    )}>
      <Icon className={cn("h-4 w-4", active ? "text-brand-blue" : "text-neutral-600")} />
      {label}
    </button>
  );
}

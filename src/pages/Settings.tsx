import DashboardLayout from '../components/DashboardLayout';
import { Settings as SettingsIcon, Shield, Users, Key, Bell, Globe, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        <header>
           <h1 className="text-xl font-bold tracking-tight text-white font-display">Settings</h1>
           <p className="text-xs text-neutral-500">Manage your organization, team, and security preferences.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <nav className="space-y-1">
              <SettingsNavItem icon={SettingsIcon} label="General" active />
              <SettingsNavItem icon={Users} label="Members" />
              <SettingsNavItem icon={Key} label="API Keys" />
              <SettingsNavItem icon={Bell} label="Notifications" />
              <SettingsNavItem icon={Shield} label="Security" />
              <SettingsNavItem icon={Globe} label="Environments" />
              <SettingsNavItem icon={CreditCard} label="Billing" />
           </nav>

           <div className="md:col-span-3 space-y-8">
              <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                 <h3 className="text-sm font-semibold mb-6">Organization Profile</h3>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Name</label>
                          <input type="text" defaultValue="FlowForge Engineering" className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand-blue/50" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Slug</label>
                          <input type="text" defaultValue="flowforge-eng" className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-brand-blue/50" />
                       </div>
                    </div>
                 </div>
              </section>

              <section className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                 <h3 className="text-sm font-semibold mb-6">API Keys</h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                       <div>
                          <div className="text-xs font-semibold">Production Key</div>
                          <div className="text-[10px] font-mono text-neutral-600 mt-0.5">Created on May 7, 2026</div>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-neutral-400">ff_live_••••••••••••••••</span>
                          <button className="text-xs text-brand-blue font-bold hover:underline">Revoke</button>
                       </div>
                    </div>
                    <button className="text-xs font-bold text-brand-blue flex items-center gap-2 hover:underline">
                       Create new API key +
                    </button>
                 </div>
              </section>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SettingsNavItem({ icon: Icon, label, active }: any) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
      active ? "bg-white/5 text-white" : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]"
    )}>
       <Icon className={cn("h-4 w-4", active ? "text-brand-blue" : "text-neutral-600")} />
       {label}
    </button>
  );
}

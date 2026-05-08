import React, { useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Zap, 
  LayoutDashboard, 
  Globe, 
  Server, 
  FileCheck, 
  Activity, 
  History, 
  Settings,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  Command,
  Plus
} from 'lucide-react';
import { useAuthStore } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  icon: any;
  label: string;
  to: string;
  isActive: boolean;
  key?: string;
}

function SidebarItem({ icon: Icon, label, to, isActive }: SidebarItemProps) {
  return (
    <Link 
      to={to}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-brand-blue/10 text-brand-blue shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]" 
          : "text-neutral-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive && "text-brand-blue")} />
      <span>{label}</span>
      {isActive && (
        <motion.div 
          layoutId="sidebar-active"
          className="ml-auto flex h-4 w-4 items-center justify-center rounded bg-brand-blue/20 text-[10px]"
        >
          <ChevronRight className="h-3 w-3" />
        </motion.div>
      )}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Activity, label: 'APIs', to: '/api-testing' },
    { icon: Globe, label: 'Webhooks', to: '/webhook-lab' },
    { icon: Server, label: 'Mock Servers', to: '/mocks' },
    { icon: FileCheck, label: 'Contracts', to: '/contracts' },
    { icon: History, label: 'Logs', to: '/logs' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  const handleSignOut = () => {
    supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen bg-dark-bg text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-white/5 bg-dark-bg p-4 flex flex-col">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue">
            <Zap className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">FlowForge</span>
        </div>

        <div className="flex-1 space-y-1">
          <div className="px-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600">Main</span>
          </div>
          {sidebarItems.map((item) => (
            <SidebarItem 
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={location.pathname === item.to}
            />
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-4">
             <div className="h-8 w-8 rounded-full bg-brand-cyan/20 flex items-center justify-center border border-brand-cyan/30 text-xs font-bold text-brand-cyan">
                {user?.email?.[0].toUpperCase() || 'U'}
             </div>
             <div className="flex-1 overflow-hidden">
                <div className="text-xs font-medium truncate">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Developer'}</div>
                <div className="text-[10px] text-neutral-500 truncate">{user?.email}</div>
             </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-white/5 bg-dark-bg/50 backdrop-blur-md px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
             <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
                <input 
                  type="text" 
                  placeholder="Search APIs, webhooks, or logs..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-12 text-sm focus:outline-none focus:border-brand-blue/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                   <Command className="h-3 w-3 text-neutral-600" />
                   <span className="text-[10px] text-neutral-600">K</span>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <button className="flex h-8 items-center gap-2 rounded-lg bg-brand-blue px-3 text-xs font-semibold hover:bg-blue-600 transition-all">
                <Plus className="h-3 w-3" />
                Create New
             </button>
             <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-neutral-400 hover:text-white transition-colors"
             >
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-blue border-2 border-dark-bg" />
             </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}

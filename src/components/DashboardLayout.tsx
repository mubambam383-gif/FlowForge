import React, { useEffect, useMemo, useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);
      setNotifications(data || []);
    };

    loadNotifications();
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, loadNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Activity, label: 'API Testing', to: '/api-testing' },
    { icon: Globe, label: 'Webhook Lab', to: '/webhooks' },
    { icon: Server, label: 'Mock Servers', to: '/mock-servers' },
    { icon: FileCheck, label: 'Contracts', to: '/contracts' },
    { icon: History, label: 'Audit Logs', to: '/logs' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleGlobalSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (query) navigate(`/logs?search=${encodeURIComponent(query)}`);
  };

  const markNotificationsRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
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
             <form className="relative w-full" onSubmit={handleGlobalSearch}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search APIs, webhooks, or logs..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-10 pr-12 text-sm focus:outline-none focus:border-brand-blue/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                   <Command className="h-3 w-3 text-neutral-600" />
                   <span className="text-[10px] text-neutral-600">K</span>
                </div>
             </form>
          </div>

          <div className="relative flex items-center gap-4">
             <button
               onClick={() => setIsCreateOpen((value) => !value)}
               className="flex h-8 items-center gap-2 rounded-lg bg-brand-blue px-3 text-xs font-semibold hover:bg-blue-600 transition-all"
             >
                <Plus className="h-3 w-3" />
                Create New
             </button>
             <button 
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  markNotificationsRead();
                }}
                className="relative p-2 text-neutral-400 hover:text-white transition-colors"
             >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-blue border-2 border-dark-bg" />}
             </button>
             <AnimatePresence>
               {isCreateOpen && (
                 <motion.div
                   initial={{ opacity: 0, y: -8 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -8 }}
                   className="absolute right-12 top-10 z-50 w-56 rounded-xl border border-white/10 bg-[#121212] p-2 shadow-2xl"
                 >
                   {[
                     ['API request', '/api-testing'],
                     ['Webhook', '/webhooks'],
                     ['Mock server', '/mock-servers'],
                     ['Contract', '/contracts'],
                   ].map(([label, to]) => (
                     <button
                       key={to}
                       onClick={() => {
                         setIsCreateOpen(false);
                         navigate(to);
                       }}
                       className="w-full rounded-lg px-3 py-2 text-left text-xs text-neutral-300 hover:bg-white/5 hover:text-white"
                     >
                       {label}
                     </button>
                   ))}
                 </motion.div>
               )}
               {isNotificationsOpen && (
                 <motion.div
                   initial={{ opacity: 0, y: -8 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -8 }}
                   className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-white/10 bg-[#121212] p-3 shadow-2xl"
                 >
                   <div className="mb-3 flex items-center justify-between">
                     <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Notifications</span>
                     <Link to="/settings" className="text-[10px] font-bold text-brand-blue">Settings</Link>
                   </div>
                   {notifications.length === 0 ? (
                     <div className="py-8 text-center text-xs italic text-neutral-600">No notifications yet</div>
                   ) : (
                     <div className="max-h-80 space-y-2 overflow-y-auto">
                       {notifications.map((item) => (
                         <div key={item.id} className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
                           <div className="text-xs font-semibold text-white">{item.title}</div>
                           <div className="mt-1 text-[10px] text-neutral-500">{item.message}</div>
                         </div>
                       ))}
                     </div>
                   )}
                 </motion.div>
               )}
             </AnimatePresence>
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

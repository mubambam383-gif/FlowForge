import DashboardLayout from '../components/DashboardLayout';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Globe, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Server,
  FileCode
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    requests: '0',
    webhooks: '0',
    mocks: '0',
    contracts: '0',
    recentActivity: [] as any[]
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      
      // Subscribe to real-time logs
      const channel = supabase
        .channel('dashboard-logs')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'request_logs',
            filter: `user_id=eq.${user.id}`
          }, 
          () => fetchDashboardData()
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchDashboardData = async () => {
    const [logsCount, webhooksCount, mocksCount, contractsCount, recentLogs] = await Promise.all([
      supabase.from('request_logs').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
      supabase.from('webhook_events').select('*', { count: 'exact', head: true }).eq('user_id', user?.id),
      supabase.from('mock_servers').select('*', { count: 'exact', head: true }),
      supabase.from('contracts').select('*', { count: 'exact', head: true }),
      supabase.from('request_logs').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(5)
    ]);

    setStats({
      requests: (logsCount.count || 0).toLocaleString(),
      webhooks: (webhooksCount.count || 0).toLocaleString(),
      mocks: (mocksCount.count || 0).toLocaleString(),
      contracts: (contractsCount.count || 0).toLocaleString(),
      recentActivity: recentLogs.data || []
    });
  };

  const chartData = [
    { name: '00:00', requests: 400, errors: 24 },
    { name: '04:00', requests: 300, errors: 13 },
    { name: '08:00', requests: 900, errors: 98 },
    { name: '12:00', requests: 1200, errors: 120 },
    { name: '16:00', requests: 1500, errors: 45 },
    { name: '20:00', requests: 1100, errors: 56 },
    { name: '23:59', requests: 600, errors: 21 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-xl font-bold tracking-tight">Overview</h1>
              <p className="text-xs text-neutral-500">Real-time status of your enterprise integrations.</p>
           </div>
           <div className="flex gap-2">
              <button className="flex items-center gap-2 rounded-md border border-white/5 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors">
                Last 24 hours
                <Clock className="h-3 w-3" />
              </button>
           </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
           <StatCard 
              label="Total Executions" 
              value={stats.requests} 
              change="+12.5%" 
              trend="up" 
              icon={<Activity className="h-4 w-4" />} 
           />
           <StatCard 
              label="Webhooks Logged" 
              value={stats.webhooks} 
              change="+0.4%" 
              trend="up" 
              icon={<Globe className="h-4 w-4" />} 
              color="text-emerald-400"
           />
           <StatCard 
              label="Mock Servers" 
              value={stats.mocks} 
              change="0" 
              trend="up" 
              icon={<Server className="h-4 w-4" />} 
           />
           <StatCard 
              label="Contracts Tracked" 
              value={stats.contracts} 
              change="+2" 
              trend="up" 
              icon={<FileCode className="h-4 w-4" />} 
              color="text-emerald-400"
           />
        </div>

        {/* Main Charts area */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
           <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="mb-4 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-brand-blue" />
                    <h3 className="text-sm font-semibold">Request Traffic</h3>
                 </div>
                 <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-wider text-neutral-600">
                    <div className="flex items-center gap-1.5">
                       <span className="h-2 w-2 rounded-full bg-brand-blue" />
                       Successes
                    </div>
                    <div className="flex items-center gap-1.5">
                       <span className="h-2 w-2 rounded-full bg-red-400" />
                       Failures
                    </div>
                 </div>
              </div>
              <div className="h-[240px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" stroke="#525252" fontSize={10} axisLine={false} tickLine={false} />
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#151515', border: '1px solid #333', fontSize: '10px', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                       />
                       <Area 
                          type="monotone" 
                          dataKey="requests" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorRequests)" 
                       />
                       <Area 
                          type="monotone" 
                          dataKey="errors" 
                          stroke="#f87171" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorErrors)" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="mb-4 flex items-center justify-between">
                 <h3 className="text-sm font-semibold">Active Webhooks</h3>
                 <button className="text-[10px] font-bold uppercase tracking-wider text-brand-blue hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                 <WebhookStatusItem name="Stripe Production" status="Active" uptime="99.99%" />
                 <WebhookStatusItem name="GitHub App Sync" status="Active" uptime="99.95%" />
                 <WebhookStatusItem name="Auth0 Callback" status="Failed" uptime="98.24%" />
                 <WebhookStatusItem name="Shopify Events" status="Active" uptime="100%" />
                 <WebhookStatusItem name="Slack Notifications" status="Active" uptime="99.99%" />
              </div>
           </div>
        </div>

        {/* Bottom Section: Activity and Tasks */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
           <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <h3 className="mb-4 text-sm font-semibold">Live Integration Stream</h3>
              <div className="space-y-4">
                 {stats.recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-neutral-600 italic text-xs">No activity yet</div>
                 ) : (
                    stats.recentActivity.map((log) => (
                       <ActivityItem 
                          key={log.id}
                          title={`${log.method} ${log.url.split('/').pop()}`}
                          desc={log.url} 
                          time={new Date(log.created_at).toLocaleTimeString()} 
                          type={log.response_status < 400 ? 'success' : 'error'} 
                       />
                    ))
                 )}
              </div>
           </div>

           <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <h3 className="mb-4 text-sm font-semibold">Recommended Actions</h3>
              <div className="space-y-2">
                 <ActionItem title="Fix Contract Mismatch" desc="User profile has missing 'phone' field in response" />
                 <ActionItem title="Setup Webhook Signature" desc="Stripe webhooks are missing signature validation" />
                 <ActionItem title="Update Mock Template" desc="Outdated mocks detected for Payment service" />
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, change, trend, icon, color }: any) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] shadow-sm">
      <div className="flex items-center justify-between mb-3 text-neutral-500">
         <div className="rounded-md bg-white/5 p-1.5">{icon}</div>
         <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1", 
            trend === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
         )}>
           <TrendingUp className="h-3 w-3" />
           {change}
         </div>
      </div>
      <div className="space-y-1">
         <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</div>
         <div className={cn("text-2xl font-bold font-display tracking-tight text-white", color)}>{value}</div>
      </div>
    </div>
  );
}

function WebhookStatusItem({ name, status, uptime }: any) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/5 p-2 px-3">
       <div className="flex items-center gap-3">
          <div className={cn("h-1.5 w-1.5 rounded-full", status === 'Active' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]")} />
          <span className="text-xs font-medium">{name}</span>
       </div>
       <span className="text-[10px] font-mono text-neutral-600">{uptime}</span>
    </div>
  );
}

function ActivityItem({ title, desc, time, type }: any) {
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Clock;
  const colorClass = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : 'text-neutral-500';

  return (
    <div className="flex gap-3">
       <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/5", colorClass)}>
          <Icon className="h-4 w-4" />
       </div>
       <div className="flex-1">
          <div className="flex items-center justify-between">
             <span className="text-xs font-semibold">{title}</span>
             <span className="text-[10px] text-neutral-600">{time}</span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">{desc}</div>
       </div>
    </div>
  );
}

function ActionItem({ title, desc }: any) {
  return (
    <div className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3 hover:border-brand-blue/30 transition-all cursor-pointer">
       <div>
          <div className="text-xs font-semibold">{title}</div>
          <div className="text-[10px] text-neutral-600 mt-0.5">{desc}</div>
       </div>
       <ArrowUpRight className="h-4 w-4 text-neutral-700 group-hover:text-brand-blue transition-colors" />
    </div>
  );
}

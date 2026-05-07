import DashboardLayout from '../components/DashboardLayout';
import { History, Search, Filter, Download, Activity, Globe, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Logs() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-xl font-bold tracking-tight">System Logs</h1>
              <p className="text-xs text-neutral-500">Trace requests, events, and system activity across all integrations.</p>
           </div>
           <button className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all">
              <Download className="h-4 w-4" />
              Export CSV
           </button>
        </header>

        <div className="flex items-center gap-4 py-2">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
              <input 
                type="text" 
                placeholder="Search logs by keyword, ID, or IP..."
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-blue/50"
              />
           </div>
           <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-all">
              <Filter className="h-4 w-4" />
              Filters
           </button>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
           <div className="divide-y divide-white/5">
              <LogEntry type="success" title="API Test Success" target="User Service / GET /profile" time="14:02:11" id="req_9281" />
              <LogEntry type="webhook" title="Webhook Received" target="Stripe Checkout / wh_8123" time="14:01:45" id="wh_8123" />
              <LogEntry type="error" title="Contract Mismatch" target="Payments API / Breaking Change" time="13:58:20" id="con_0129" />
              <LogEntry type="success" title="Mock Served" target="Inventory Proxy / GET /stock" time="13:55:04" id="mock_112" />
              <LogEntry type="success" title="API Test Success" target="Auth Service / POST /login" time="13:52:12" id="req_9280" />
              <LogEntry type="error" title="Webhook Timeout" target="GitHub Events / wh_0021" time="13:48:33" id="wh_0021" />
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function LogEntry({ type, title, target, time, id }: any) {
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? ShieldAlert : type === 'webhook' ? Globe : Activity;
  const colorClass = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : 'text-brand-blue';

  return (
    <div className="flex items-center gap-6 p-4 hover:bg-white/[0.01] transition-colors">
       <div className="text-[10px] font-mono text-neutral-600 w-16">{time}</div>
       <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5", colorClass)}>
          <Icon className="h-4 w-4" />
       </div>
       <div className="flex-1">
          <div className="text-xs font-semibold">{title}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">{target}</div>
       </div>
       <div className="text-[10px] font-mono text-neutral-700 bg-white/5 px-2 py-0.5 rounded">{id}</div>
    </div>
  );
}

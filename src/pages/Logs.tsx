import DashboardLayout from '../components/DashboardLayout';
import { History, Search, Filter, Download, Activity, Globe, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../hooks/useAuth';
import { downloadTextFile, toCsv } from '../lib/notifications';

export default function Logs() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [filter, setFilter] = useState(searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    const loadLogs = async () => {
      setLoading(true);
      const [requests, webhooks] = await Promise.all([
        supabase.from('request_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(200),
        supabase.from('webhook_events').select('*').eq('user_id', user.id).order('received_at', { ascending: false }).limit(100),
      ]);

      const requestRows = (requests.data || []).map((item: any) => ({
        id: item.id,
        type: item.error || item.response_status >= 400 ? 'error' : 'success',
        title: item.error ? 'API Test Failed' : 'API Test Success',
        target: `${item.method} ${item.url}`,
        time: item.created_at,
        status: item.response_status,
      }));
      const webhookRows = (webhooks.data || []).map((item: any) => ({
        id: item.id,
        type: 'webhook',
        title: 'Webhook Received',
        target: `${item.payload?.method || 'POST'} from ${item.source || 'external'}`,
        time: item.received_at,
        status: 200,
      }));

      setLogs([...requestRows, ...webhookRows].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
      setLoading(false);
    };

    loadLogs();
  }, [user]);

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchesQuery = !query.trim() || `${item.title} ${item.target} ${item.id}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === 'all' || item.type === filter;
      return matchesQuery && matchesFilter;
    });
  }, [logs, query, filter]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const visibleLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const exportLogs = () => {
    downloadTextFile('flowforge-logs.csv', toCsv(filteredLogs), 'text/csv;charset=utf-8');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-xl font-bold tracking-tight">System Logs</h1>
              <p className="text-xs text-neutral-500">Trace requests, events, and system activity across all integrations.</p>
           </div>
           <button onClick={exportLogs} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all">
              <Download className="h-4 w-4" />
              Export CSV
           </button>
        </header>

        <div className="flex items-center gap-4 py-2">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
              <input 
                type="text" 
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search logs by keyword, ID, or IP..."
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-blue/50"
              />
           </div>
           <button onClick={() => {
             const order = ['all', 'success', 'error', 'webhook'];
             setFilter(order[(order.indexOf(filter) + 1) % order.length]);
             setPage(1);
           }} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-all">
              <Filter className="h-4 w-4" />
              {filter === 'all' ? 'Filters' : filter}
           </button>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
           <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-8 text-center text-xs text-neutral-600">Loading logs...</div>
              ) : visibleLogs.length === 0 ? (
                <div className="p-8 text-center text-xs italic text-neutral-600">No logs match your filters.</div>
              ) : visibleLogs.map((item) => (
                <LogEntry key={item.id} {...item} time={new Date(item.time).toLocaleTimeString()} />
              ))}
           </div>
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{filteredLogs.length} result(s)</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded border border-white/10 px-3 py-1 disabled:opacity-30">Prev</button>
            <span className="px-2 py-1">Page {page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="rounded border border-white/10 px-3 py-1 disabled:opacity-30">Next</button>
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

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Globe, 
  Copy, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  History, 
  CheckCircle2, 
  AlertCircle,
  FileJson,
  Search,
  Filter,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Editor from '@monaco-editor/react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../hooks/useAuth';
import { createNotification } from '../lib/notifications';

export default function WebhookLab() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Same-origin URLs work on localhost and Vercel rewrites.
    const baseUrl = window.location.origin;
    setWebhookUrl(`${baseUrl}/wh/user-${user.id}`);

    const fetchInitialEvents = async () => {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('user_id', user.id)
        .order('received_at', { ascending: false })
        .limit(20);

      if (error) {
        setErrorStatus(error.message);
      } else {
        setEvents(data.map(e => ({
          id: e.id,
          method: e.payload.method,
          headers: e.payload.headers,
          body: e.payload.body,
          receivedAt: e.received_at
        })));
      }
    };

    fetchInitialEvents();

    // Real-time listener for webhook events
    const channel = supabase
      .channel('webhook_events_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newEvent = {
            id: payload.new.id,
            method: payload.new.payload.method,
            headers: payload.new.payload.headers,
            body: payload.new.payload.body,
            receivedAt: payload.new.received_at
          };
          setEvents(prev => [newEvent, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setErrorStatus(null);
    setSuccessStatus('Webhook URL copied.');
  };

  const simulateWebhook = async () => {
    setLoading(true);
    setErrorStatus(null);
    setSuccessStatus(null);
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Simulation': 'FlowForge' },
        body: JSON.stringify({
          event: "order.created",
          data: {
            id: "ord_12345",
            amount: 5999,
            currency: "usd",
            customer: {
              name: "John Doe",
              email: "john@example.com"
            }
          }
        })
      });
      if (!response.ok) throw new Error('Webhook simulation failed');
      setSuccessStatus('Simulation sent.');
      if (user) await createNotification(user.id, 'Webhook simulated', 'A test webhook event was recorded.', 'success');
    } catch (e) {
      setErrorStatus(e instanceof Error ? e.message : 'Webhook simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const replayEvent = async () => {
    if (!selectedEvent) return;
    setLoading(true);
    setErrorStatus(null);
    setSuccessStatus(null);
    try {
      const response = await fetch(webhookUrl, {
        method: selectedEvent.method || 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Simulation': 'Replay' },
        body: JSON.stringify(selectedEvent.body || {}),
      });
      if (!response.ok) throw new Error('Replay failed');
      setSuccessStatus('Event replayed.');
    } catch (e) {
      setErrorStatus(e instanceof Error ? e.message : 'Replay failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-xl font-bold tracking-tight">Webhook Lab</h1>
              <p className="text-xs text-neutral-500">Inspect and replay incoming integration events in real-time.</p>
           </div>
           <div className="flex gap-2">
              <button 
                onClick={simulateWebhook}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                  <PlayCircle className="h-4 w-4 text-brand-cyan" />
                  Simulate Event
              </button>
           </div>
        </header>

        {(errorStatus || successStatus) && (
          <div className={cn("rounded-lg border px-4 py-2 text-xs", errorStatus ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300")}>
            {errorStatus || successStatus}
          </div>
        )}

        {/* Webhook Configuration Card */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                 <h3 className="text-sm font-semibold">Your Webhook URL</h3>
                 <p className="text-xs text-neutral-500">Send POST requests to this URL to see them appear below.</p>
              </div>
              <div className="flex flex-1 max-w-xl items-center gap-2">
                 <div className="flex-1 flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 font-mono text-[11px] text-brand-cyan border border-white/5 overflow-x-auto whitespace-nowrap">
                    {webhookUrl}
                 </div>
                 <button 
                   onClick={copyUrl}
                   className="p-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-neutral-400 hover:text-white"
                 >
                    <Copy className="h-4 w-4" />
                 </button>
              </div>
           </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
           {/* Sidebar: Event Feed */}
           <div className="flex flex-col rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-neutral-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Event Stream</h3>
                 </div>
                 <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex-1 overflow-y-auto">
                 {events.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-neutral-600">
                       <RefreshCw className="h-8 w-8 mb-4 animate-spin-slow opacity-20" />
                       <p className="text-xs italic">Waiting for incoming events...</p>
                    </div>
                 ) : (
                    <div className="divide-y divide-white/5">
                       {events.map((event) => (
                          <EventListItem 
                            key={event.id}
                            event={event}
                            isActive={selectedEvent?.id === event.id}
                            onClick={() => setSelectedEvent(event)}
                          />
                       ))}
                    </div>
                 )}
              </div>
           </div>

           {/* Main: Event Inspector */}
           <div className="lg:col-span-2 flex flex-col rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
              {selectedEvent ? (
                 <div className="flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                       <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <h3 className="text-sm font-semibold">{selectedEvent.method} Event</h3>
                          <span className="text-[10px] text-neutral-600 font-mono">{selectedEvent.id}</span>
                       </div>
                       <button onClick={replayEvent} disabled={loading} className="flex items-center gap-2 rounded-md bg-brand-blue/10 px-3 py-1 text-[10px] font-bold text-brand-blue hover:bg-brand-blue/20 transition-all disabled:opacity-50">
                          Replay Event
                       </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
                       <div className="border-r border-white/5 flex flex-col">
                          <div className="p-3 px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-black/20">Headers</div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-2">
                             {Object.entries(selectedEvent.headers || {}).map(([key, val]: any) => (
                                <div key={key} className="flex flex-col gap-1">
                                   <span className="text-[10px] font-mono text-neutral-500">{key}</span>
                                   <span className="text-[11px] font-mono break-all text-neutral-200">{val}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                       <div className="flex flex-col min-h-0">
                          <div className="p-3 px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 bg-black/20">Payload</div>
                          <div className="flex-1 overflow-hidden">
                             <Editor 
                                height="100%"
                                defaultLanguage="json"
                                theme="vs-dark"
                                value={typeof selectedEvent.body === 'string' ? selectedEvent.body : JSON.stringify(selectedEvent.body, null, 2)}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  fontSize: 11,
                                  lineNumbers: 'on',
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                  padding: { top: 12 }
                                }}
                             />
                          </div>
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-neutral-700">
                    <Globe className="h-12 w-12 mb-4 opacity-5" />
                    <p className="text-sm italic">Select an event from the stream to inspect details</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function EventListItem({ event, isActive, onClick }: any) {
  const timestamp = event.receivedAt ? new Date(event.receivedAt).getTime() : Date.now();
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-4 text-left transition-all",
        isActive ? "bg-brand-blue/5 border-l-2 border-brand-blue" : "hover:bg-white/[0.02]"
      )}
    >
       <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-emerald-400">200</span>
             <span className="text-xs font-semibold text-white uppercase">{event.method}</span>
          </div>
          <div className="text-[10px] text-neutral-500 truncate max-w-[120px]">
             {typeof event.body === 'string' ? 'Raw Payload' : (event.body.event || 'Incoming Hook')}
          </div>
       </div>
       <div className="text-[10px] font-mono text-neutral-600">
          {time}
       </div>
    </button>
  );
}

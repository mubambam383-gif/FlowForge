import DashboardLayout from '../components/DashboardLayout';
import { 
  Server, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  ExternalLink,
  Code,
  ShieldAlert,
  Zap,
  MoreVertical,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function MockServers() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-xl font-bold tracking-tight">Mock Servers</h1>
              <p className="text-xs text-neutral-500">Virtualize your downstream dependencies and test against simulated responses.</p>
           </div>
           <button className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Plus className="h-4 w-4" />
              Create Mock Server
           </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <MockCard 
              name="Payment Proxy" 
              url="pay-mock.flowforge.dev" 
              status="Running" 
              endpoints={12} 
              requests="1.2k"
              active
           />
           <MockCard 
              name="Identity Auth" 
              url="auth-mock.flowforge.dev" 
              status="Running" 
              endpoints={5} 
              requests="482"
              active
           />
           <MockCard 
              name="Inventory Service" 
              url="inv-mock.flowforge.dev" 
              status="Paused" 
              endpoints={8} 
              requests="0"
           />
        </div>

        <section className="mt-12">
           <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-600 mb-6">Endpoints in Payment Proxy</h2>
           <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <table className="w-full text-left text-xs">
                 <thead className="bg-white/5 text-neutral-500">
                    <tr>
                       <th className="px-6 py-3 font-semibold">Method</th>
                       <th className="px-6 py-3 font-semibold">Path</th>
                       <th className="px-6 py-3 font-semibold">Type</th>
                       <th className="px-6 py-3 font-semibold">Response</th>
                       <th className="px-6 py-3 font-semibold text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    <MockEndpointRow method="POST" path="/v1/charges" type="JSON" response="200 OK" />
                    <MockEndpointRow method="GET" path="/v1/customers/:id" type="JSON" response="200 OK" />
                    <MockEndpointRow method="POST" path="/v1/refunds" type="JSON" response="402 Required" />
                    <MockEndpointRow method="GET" path="/v1/balance" type="JSON" response="200 OK" />
                 </tbody>
              </table>
           </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function MockCard({ name, url, status, endpoints, requests, active }: any) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 group hover:bg-white/[0.04] transition-all">
       <div className="flex items-start justify-between mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
             <Server className="h-5 w-5" />
          </div>
          <div className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
            active ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-500/10 text-neutral-500"
          )}>
             {active ? <Play className="h-2.5 w-2.5 fill-current" /> : <Pause className="h-2.5 w-2.5 fill-current" />}
             {status}
          </div>
       </div>
       <div className="space-y-1 mb-6">
          <h3 className="font-semibold text-white">{name}</h3>
          <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
             <Globe className="h-3 w-3" />
             {url}
          </div>
       </div>
       <div className="flex items-center gap-6 pt-4 border-t border-white/5">
          <div className="text-[10px]">
             <span className="text-neutral-500 block mb-0.5">Endpoints</span>
             <span className="font-bold text-white uppercase">{endpoints}</span>
          </div>
          <div className="text-[10px]">
             <span className="text-neutral-500 block mb-0.5">Requests</span>
             <span className="font-bold text-white uppercase">{requests}</span>
          </div>
          <button className="ml-auto p-1.5 hover:bg-white/5 rounded text-neutral-500 hover:text-white transition-colors">
             <Settings className="h-4 w-4" />
          </button>
       </div>
    </div>
  );
}

function MockEndpointRow({ method, path, type, response }: any) {
  return (
    <tr className="hover:bg-white/[0.01] transition-colors group">
       <td className="px-6 py-4">
          <span className={cn("font-bold text-[10px]", 
             method === 'GET' ? 'text-brand-blue' : 
             method === 'POST' ? 'text-emerald-400' : 
             'text-amber-400'
          )}>{method}</span>
       </td>
       <td className="px-6 py-4 font-mono text-[11px] text-neutral-300">{path}</td>
       <td className="px-6 py-4 text-neutral-500">{type}</td>
       <td className="px-6 py-4">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", 
             response.includes('200') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          )}>{response}</span>
       </td>
       <td className="px-6 py-4 text-right">
          <button className="p-1.5 hover:bg-white/5 rounded text-neutral-600 hover:text-white transition-colors">
             <MoreVertical className="h-4 w-4" />
          </button>
       </td>
    </tr>
  );
}

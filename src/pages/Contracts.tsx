import DashboardLayout from '../components/DashboardLayout';
import { 
  FileCheck, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Download,
  CheckCircle2,
  XCircle,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Contracts() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-xl font-bold tracking-tight">Contract Validation</h1>
              <p className="text-xs text-neutral-500">Ensure your APIs adhere to their schemas and detect breaking changes automatically.</p>
           </div>
           <button className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Upload className="h-4 w-4" />
              Upload Spec
           </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           {/* Summary Stats */}
           <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <ContractStat label="Total Schemas" value="24" icon={<FileCode className="h-4 w-4" />} />
              <ContractStat label="Passing Contracts" value="21" icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} />
              <ContractStat label="Failing Contracts" value="3" icon={<XCircle className="h-4 w-4 text-red-400" />} />
           </div>

           {/* Active Contracts List */}
           <div className="lg:col-span-3 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-600">Active API Contracts</h2>
              <div className="space-y-3">
                 <ContractItem 
                   name="Production Payments API" 
                   version="v1.2.4" 
                   status="Pass" 
                   lastValidated="2m ago" 
                   spec="swagger.json"
                 />
                 <ContractItem 
                   name="User Identity Service" 
                   version="v2.0.1" 
                   status="Fail" 
                   lastValidated="14m ago" 
                   spec="openapi.yaml"
                   error="Missing 'billing_address' in /users/:id response"
                 />
                 <ContractItem 
                   name="Internal Inventory" 
                   version="v0.9.12" 
                   status="Pass" 
                   lastValidated="1h ago" 
                   spec="inventory-spec.json"
                 />
              </div>
           </div>

           {/* Sidebar: Diagnostics */}
           <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-6">
              <div>
                 <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-brand-blue" />
                    Latest Health
                 </h3>
                 <div className="space-y-4">
                    <HealthItem label="Schema Coverage" value="92%" color="text-emerald-400" />
                    <HealthItem label="Breaking Changes" value="2 detected" color="text-red-400" />
                    <HealthItem label="Deprecated Fields" value="4 active" color="text-amber-400" />
                 </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-4">Quick Scan</h3>
                 <div className="rounded-lg border border-dashed border-white/10 p-6 flex flex-col items-center justify-center text-center">
                    <Upload className="h-6 w-6 text-neutral-700 mb-2" />
                    <p className="text-[10px] text-neutral-500">Drag & drop Swagger/OpenAPI file here</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ContractStat({ label, value, icon }: any) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
       <div>
          <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1">{label}</div>
          <div className="text-xl font-bold font-display">{value}</div>
       </div>
       <div className="p-2 rounded-lg bg-white/5">{icon}</div>
    </div>
  );
}

function ContractItem({ name, version, status, lastValidated, spec, error }: any) {
  return (
    <div className={cn(
      "rounded-xl border p-4 transition-all hover:bg-white/[0.01]",
      status === 'Pass' ? "border-white/5 bg-white/[0.02]" : "border-red-500/20 bg-red-500/[0.02]"
    )}>
       <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
             <div className={cn(
               "h-1.5 w-1.5 rounded-full",
               status === 'Pass' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
             )} />
             <h4 className="text-sm font-semibold text-white">{name}</h4>
             <span className="text-[10px] font-mono text-neutral-600 bg-white/5 px-1.5 py-0.5 rounded">{version}</span>
          </div>
          <div className="text-[10px] text-neutral-600 flex items-center gap-2">
             <History className="h-3 w-3" />
             Validated {lastValidated}
          </div>
       </div>
       
       <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
                <FileCode className="h-3 w-3" />
                {spec}
             </div>
             {error && (
                <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-medium">
                   <AlertTriangle className="h-3 w-3" />
                   {error}
                </div>
             )}
          </div>
          <button className="flex items-center gap-1 text-[10px] font-bold text-brand-blue hover:underline">
             View Details <ArrowRight className="h-3 w-3" />
          </button>
       </div>
    </div>
  );
}

function HealthItem({ label, value, color }: any) {
  return (
    <div className="flex justify-between items-center bg-black/20 rounded p-2 px-3">
       <span className="text-[10px] font-medium text-neutral-500">{label}</span>
       <span className={cn("text-[11px] font-bold", color)}>{value}</span>
    </div>
  );
}

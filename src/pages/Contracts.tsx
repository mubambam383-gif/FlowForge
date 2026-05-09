import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  FileCode, 
  Search, 
  Plus, 
  ShieldCheck, 
  ShieldAlert, 
  History as HistoryIcon,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Code,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../hooks/useAuth';
import Editor from '@monaco-editor/react';
import { ContractEngine } from '../services/contractEngine';
import { createNotification } from '../lib/notifications';
import { getErrorMessage, parseJson } from '../lib/validation';

export default function Contracts() {
  const { user } = useAuthStore();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const [newContract, setNewContract] = useState({
    name: '',
    version: '1.0.0',
    spec: '{\n  "type": "object",\n  "properties": {\n    "id": { "type": "number" },\n    "name": { "type": "string" }\n  }\n}'
  });

  const [compareSpec, setCompareSpec] = useState('{\n  "type": "object",\n  "properties": {\n    "id": { "type": "string" }\n  }\n}');
  const [diffResults, setDiffResults] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('owner_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setContracts(data);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!newContract.name || !newContract.spec) return;

    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert({
          name: newContract.name,
          version: newContract.version,
          specification: parseJson(newContract.spec, {}),
          owner_id: user?.id,
          workspace_id: null // Fixed for demo
        })
        .select()
        .single();

      if (error) throw error;
      setContracts([data, ...contracts]);
      setShowUploadModal(false);
      setStatusMessage('Contract registered.');
      if (user) await createNotification(user.id, 'Contract registered', `${data.name} v${data.version}`, 'success');
    } catch (e: any) {
      setStatusMessage(getErrorMessage(e));
    }
  };

  const handleCompare = () => {
    if (!selectedContract) return;
    try {
      const results = ContractEngine.compareSchemas(
        selectedContract.specification,
        parseJson(compareSpec, {})
      );
      setDiffResults(results);
    } catch (e: any) {
      setStatusMessage("Invalid JSON for comparison");
    }
  };

  const versions = selectedContract
    ? contracts.filter((contract) => contract.name === selectedContract.name)
    : [];

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
        {/* Contracts Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-hidden">
           <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white tracking-tight">API Contracts</h1>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {loading ? (
                 <div className="flex items-center justify-center h-20 opacity-20">
                    <HistoryIcon className="animate-spin" />
                 </div>
              ) : contracts.length === 0 ? (
                 <div className="text-center py-12 px-4 rounded-xl border border-dashed border-white/10 opacity-30">
                    <FileCode className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm italic">No contracts defined yet</p>
                 </div>
              ) : (
                 contracts.map(contract => (
                    <div 
                      key={contract.id}
                      onClick={() => {
                        setSelectedContract(contract);
                        setDiffResults(null);
                      }}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer group",
                        selectedContract?.id === contract.id 
                          ? "bg-emerald-500/10 border-emerald-500/30" 
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      )}
                    >
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <ShieldCheck className={cn("h-4 w-4", contract.status === 'active' ? "text-emerald-500" : "text-neutral-600")} />
                             <span className="text-sm font-semibold">{contract.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-neutral-500">v{contract.version}</span>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] text-neutral-600">
                             {new Date(contract.created_at).toLocaleDateString()}
                          </span>
                          <ChevronRight className="h-3 w-3 text-neutral-700 transition-transform group-hover:translate-x-1" />
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>

        {/* Contract Health & Diff View */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
           {selectedContract ? (
              <div className="flex-1 flex flex-col gap-4">
                 <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                       <div>
                          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedContract.name}</h2>
                          <p className="text-sm text-neutral-500 mt-1">Contract Version {selectedContract.version} Enforcement</p>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col items-end">
                             <div className="text-[10px] font-bold text-neutral-600 uppercase mb-1">Health Score</div>
                             <div className="text-2xl font-black text-emerald-500">98%</div>
                          </div>
                          <div className="h-10 w-[1px] bg-white/5" />
                          <button onClick={() => setShowVersionsModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10">
                             <HistoryIcon className="h-4 w-4" />
                             VERSIONS
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                       <HealthCard icon={ShieldCheck} title="Validation Pass" value="1,240" sub="Requests today" />
                       <HealthCard icon={ShieldAlert} title="Violations" value="12" sub="Detected drift" variant="error" />
                       <HealthCard icon={Clock} title="Latency Drift" value="+15ms" sub="vs baseline" />
                    </div>
                 </div>

                 <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                    {/* Active Specification */}
                    <div className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                       <div className="p-4 px-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Master Specification</h3>
                          <span className="text-[10px] text-emerald-500 font-bold">LATEST VERSION</span>
                       </div>
                       <div className="flex-1 overflow-hidden bg-black/20">
                          <Editor 
                             height="100%"
                             defaultLanguage="json"
                             theme="vs-dark"
                             value={JSON.stringify(selectedContract.specification, null, 2)}
                             options={{ readOnly: true, minimap: { enabled: false }, fontSize: 11 }}
                          />
                       </div>
                    </div>

                    {/* Diff/Comparison View */}
                    <div className="flex flex-col rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                       <div className="p-4 px-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Compatibility Test</h3>
                          <button 
                            onClick={handleCompare}
                            className="text-[10px] font-bold text-brand-blue bg-brand-blue/10 hover:bg-brand-blue/20 px-3 py-1 rounded-lg border border-brand-blue/20"
                          >
                             RUN DIFF
                          </button>
                       </div>
                       
                       <div className="flex-1 flex flex-col overflow-hidden">
                          <div className="h-1/2 overflow-hidden border-b border-white/5">
                             <div className="p-2 px-6 text-[10px] font-bold text-neutral-600 bg-black/40">INPUT DRIFT SCHEMA</div>
                             <Editor 
                                height="calc(100% - 24px)"
                                defaultLanguage="json"
                                theme="vs-dark"
                                value={compareSpec}
                                onChange={v => setCompareSpec(v || '')}
                                options={{ minimap: { enabled: false }, fontSize: 11 }}
                             />
                          </div>
                          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                             {diffResults ? (
                                <div className="space-y-4">
                                   <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-bold text-neutral-400">DIFF ANALYSIS</h4>
                                      {diffResults.isCompatible ? (
                                         <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/5 px-2 py-0.5 rounded">
                                            <CheckCircle2 className="h-3 w-3" /> COMPATIBLE
                                         </span>
                                      ) : (
                                         <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold bg-red-500/5 px-2 py-0.5 rounded">
                                            <AlertCircle className="h-3 w-3" /> BREAKING CHANGES
                                         </span>
                                      )}
                                   </div>
                                   <div className="space-y-2">
                                      {diffResults.changes.map((change: any, i: number) => (
                                         <div key={i} className={cn(
                                            "p-3 rounded-lg border text-[11px]",
                                            change.type === 'breaking' ? "bg-red-500/5 border-red-500/10 text-red-400" :
                                            change.type === 'non-breaking' ? "bg-amber-500/5 border-amber-500/10 text-amber-400" :
                                            "bg-white/5 border-white/10 text-neutral-400"
                                         )}>
                                            <div className="font-bold mb-1 uppercase text-[9px] opacity-60">{change.type}</div>
                                            {change.message}
                                            {change.path && <div className="mt-1 font-mono opacity-50 underline">Path: {change.path}</div>}
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             ) : (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-700 italic text-xs">
                                   Paste a new version or drift schema above to run comparison
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-800 text-center px-12">
                 <ShieldCheck className="h-24 w-24 opacity-5 mb-8" />
                 <h2 className="text-xl font-bold text-white/40 mb-2 uppercase tracking-widest">Select a Contract</h2>
                 <p className="text-xs text-neutral-700 italic max-w-sm">
                    Upload your OpenAPI specifications and enforce them across your development lifecycle. Detect breaking changes before they hit production.
                 </p>
              </div>
           )}
        </div>
      </div>
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-white/10 bg-[#121212] px-4 py-3 text-xs text-neutral-200 shadow-2xl">
          {statusMessage}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowUploadModal(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                 <h3 className="text-lg font-bold text-white">Upload New Contract</h3>
                 <p className="text-xs text-neutral-500">Import your API specification to start enforcement.</p>
              </div>
              <div className="p-6 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-neutral-500 uppercase">Contract Name</label>
                       <input 
                         type="text" 
                         value={newContract.name}
                         onChange={e => setNewContract({...newContract, name: e.target.value})}
                         placeholder="e.g. Identity Management V3"
                         className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-brand-blue transition-colors"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-neutral-500 uppercase">Version Tag</label>
                       <input 
                         type="text" 
                         value={newContract.version}
                         onChange={e => setNewContract({...newContract, version: e.target.value})}
                         placeholder="1.2.0"
                         className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none"
                       />
                    </div>
                 </div>
                 <div className="space-y-1.5 flex flex-col h-[300px]">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Schema (JSON Schema / OpenAPI Partial)</label>
                    <div className="flex-1 rounded-lg border border-white/10 overflow-hidden bg-black">
                       <Editor 
                         height="100%"
                         defaultLanguage="json"
                         theme="vs-dark"
                         value={newContract.spec}
                         onChange={v => setNewContract({...newContract, spec: v || ''})}
                         options={{
                           minimap: { enabled: false },
                           fontSize: 11,
                           lineNumbers: 'on',
                           padding: { top: 12 }
                         }}
                       />
                    </div>
                 </div>
              </div>
              <div className="p-6 bg-white/[0.01] border-t border-white/10 flex gap-3">
                 <button 
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-neutral-400 hover:bg-white/5"
                 >
                   CANCEL
                 </button>
                 <button 
                   onClick={handleUpload}
                   className="flex-1 px-6 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                 >
                   REGISTER CONTRACT
                 </button>
              </div>
            </motion.div>
          </div>
        )}
        {showVersionsModal && selectedContract && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVersionsModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121212] p-6">
              <h3 className="mb-4 text-lg font-bold">{selectedContract.name} Versions</h3>
              <div className="space-y-2">
                {versions.map((contract) => (
                  <button
                    key={contract.id}
                    onClick={() => {
                      setSelectedContract(contract);
                      setDiffResults(null);
                      setShowVersionsModal(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] p-3 text-left hover:bg-white/5"
                  >
                    <span className="text-xs font-semibold">v{contract.version}</span>
                    <span className="text-[10px] text-neutral-500">{new Date(contract.created_at).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

function HealthCard({ icon: Icon, title, value, sub, variant }: any) {
   return (
      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex items-center gap-4">
         <div className={cn(
            "p-2 rounded-lg bg-white/5",
            variant === 'error' ? "text-red-400 bg-red-400/5" : "text-neutral-400"
         )}>
            <Icon className="h-4 w-4" />
         </div>
         <div>
            <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">{title}</div>
            <div className={cn(
               "text-xl font-black",
               variant === 'error' ? "text-red-400" : "text-white"
            )}>{value}</div>
            <div className="text-[9px] text-neutral-600">{sub}</div>
         </div>
      </div>
   );
}

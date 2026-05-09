import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Plus, 
  Server, 
  Globe, 
  Settings, 
  Play, 
  Trash2, 
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../hooks/useAuth';
import Editor from '@monaco-editor/react';
import { createNotification } from '../lib/notifications';
import { getErrorMessage, parseJson, slugify } from '../lib/validation';

export default function MockServers() {
  const { user } = useAuthStore();
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerSlug, setNewServerSlug] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [showEndpointModal, setShowEndpointModal] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<any>(null);
  const [newEndpoint, setNewEndpoint] = useState({
    path: '/',
    method: 'GET',
    status: 200,
    body: '{\n  "status": "success",\n  "message": "Hello from Mock Server"\n}',
    delay: 0
  });

  useEffect(() => {
    if (user) {
      fetchServers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedServer) {
      fetchEndpoints(selectedServer.id);
    }
  }, [selectedServer]);

  const fetchServers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mock_servers')
      .select('*')
      .eq('owner_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (data) setServers(data);
    setLoading(false);
  };

  const fetchEndpoints = async (serverId: string) => {
    const { data, error } = await supabase
      .from('mock_endpoints')
      .select('*')
      .eq('mock_server_id', serverId)
      .order('created_at', { ascending: false });
    
    if (data) setEndpoints(data);
  };

  const handleCreateServer = async () => {
    if (!newServerName.trim() || !newServerSlug.trim()) {
      setStatusMessage('Server name and slug are required.');
      return;
    }
    
    // Check if workspace exists, otherwise create organization/workspace first (for demo we assume it exists or use null organization)
    // For this lab, we'll just insert directly.
    const { data, error } = await supabase
      .from('mock_servers')
      .insert({
        name: newServerName,
        slug: slugify(newServerSlug),
        owner_id: user?.id,
        workspace_id: null // In production we'd link this
      })
      .select()
      .single();

    if (error) {
      setStatusMessage(error.message);
    } else {
      setServers([data, ...servers]);
      setShowCreateModal(false);
      setNewServerName('');
      setNewServerSlug('');
      setStatusMessage('Mock server created.');
      if (user) await createNotification(user.id, 'Mock server created', data.name, 'success');
    }
  };

  const handleCreateEndpoint = async () => {
    if (!selectedServer) return;
    let responseBody;
    try {
      responseBody = parseJson(newEndpoint.body || '{}', {});
    } catch (error) {
      setStatusMessage('Response body must be valid JSON.');
      return;
    }
    
    const payload = {
        mock_server_id: selectedServer.id,
        path: newEndpoint.path.startsWith('/') ? newEndpoint.path : `/${newEndpoint.path}`,
        method: newEndpoint.method,
        response_status: newEndpoint.status,
        response_body: responseBody,
        delay_ms: newEndpoint.delay
      };

    const query = editingEndpoint
      ? supabase.from('mock_endpoints').update(payload).eq('id', editingEndpoint.id)
      : supabase.from('mock_endpoints').insert(payload);

    const { data, error } = await query
      .select()
      .single();

    if (error) {
      setStatusMessage(error.message);
    } else {
      setEndpoints(editingEndpoint ? endpoints.map((item) => item.id === data.id ? data : item) : [data, ...endpoints]);
      setShowEndpointModal(false);
      setEditingEndpoint(null);
      setStatusMessage(editingEndpoint ? 'Endpoint updated.' : 'Endpoint created.');
    }
  };

  const openEndpointEditor = (endpoint: any) => {
    setEditingEndpoint(endpoint);
    setNewEndpoint({
      path: endpoint.path,
      method: endpoint.method,
      status: endpoint.response_status,
      body: JSON.stringify(endpoint.response_body || {}, null, 2),
      delay: endpoint.delay_ms || 0,
    });
    setShowEndpointModal(true);
  };

  const updateSelectedServer = async () => {
    if (!selectedServer || !newServerName.trim() || !newServerSlug.trim()) return;
    const { data, error } = await supabase
      .from('mock_servers')
      .update({ name: newServerName.trim(), slug: slugify(newServerSlug) })
      .eq('id', selectedServer.id)
      .select()
      .single();
    if (error) {
      setStatusMessage(error.message);
      return;
    }
    setServers(servers.map((server) => server.id === data.id ? data : server));
    setSelectedServer(data);
    setShowServerSettings(false);
    setStatusMessage('Mock server updated.');
  };

  const deleteSelectedServer = async () => {
    if (!selectedServer || !confirm(`Delete mock server "${selectedServer.name}"?`)) return;
    const { error } = await supabase.from('mock_servers').delete().eq('id', selectedServer.id);
    if (error) {
      setStatusMessage(error.message);
      return;
    }
    setServers(servers.filter((server) => server.id !== selectedServer.id));
    setSelectedServer(null);
    setShowServerSettings(false);
    setStatusMessage('Mock server deleted.');
  };

  const toggleServerStatus = async (server: any) => {
    const { error } = await supabase
      .from('mock_servers')
      .update({ is_active: !server.is_active })
      .eq('id', server.id);
    
    if (!error) {
      setServers(servers.map(s => s.id === server.id ? { ...s, is_active: !s.is_active } : s));
      if (selectedServer?.id === server.id) {
        setSelectedServer({ ...selectedServer, is_active: !selectedServer.is_active });
      }
    }
  };

  const deleteEndpoint = async (id: string) => {
    const { error } = await supabase
      .from('mock_endpoints')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setEndpoints(endpoints.filter(e => e.id !== id));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
        {/* Servers List Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4 overflow-hidden">
           <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white tracking-tight">Mock Servers</h1>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="p-2 rounded-lg bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {loading ? (
                 <div className="flex items-center justify-center h-20 opacity-20">
                    <Loader2 className="animate-spin" />
                 </div>
              ) : servers.length === 0 ? (
                 <div className="text-center py-12 px-4 rounded-xl border border-dashed border-white/10 opacity-30">
                    <Server className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs italic">No mock servers created yet</p>
                 </div>
              ) : (
                 servers.map(server => (
                    <div 
                      key={server.id}
                      onClick={() => setSelectedServer(server)}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer group",
                        selectedServer?.id === server.id 
                          ? "bg-brand-blue/10 border-brand-blue/30" 
                          : "bg-white/[0.02] border-white/5 hover:border-white/10"
                      )}
                    >
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                             <Server className={cn("h-4 w-4", server.is_active ? "text-brand-blue" : "text-neutral-600")} />
                             <span className="text-sm font-semibold">{server.name}</span>
                          </div>
                          <div className={cn(
                             "w-2 h-2 rounded-full",
                             server.is_active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-neutral-800"
                          )} />
                       </div>
                       <div className="text-[10px] font-mono text-neutral-500 truncate mb-3">
                          /m/{server.slug}
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] text-neutral-600">
                             {new Date(server.created_at).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleServerStatus(server);
                            }}
                            className="text-[10px] font-bold text-neutral-400 hover:text-white"
                          >
                             {server.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                          </button>
                       </div>
                    </div>
                 ))
              )}
           </div>
        </div>

        {/* Selected Server Management */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
           {selectedServer ? (
              <>
                 {/* Server Header Card */}
                 <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                       <div>
                          <div className="flex items-center gap-3">
                             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedServer.name}</h2>
                             <span className={cn(
                               "px-2 py-0.5 rounded text-[10px] font-bold",
                               selectedServer.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-800 text-neutral-500"
                             )}>
                                {selectedServer.is_active ? 'ONLINE' : 'OFFLINE'}
                             </span>
                          </div>
                          <p className="text-sm text-neutral-500 mt-1">Manage rules, dynamic responses, and latency for this mock server.</p>
                       </div>
                       <div className="flex items-center gap-2">
                          <button onClick={() => {
                            setNewServerName(selectedServer.name);
                            setNewServerSlug(selectedServer.slug);
                            setShowServerSettings(true);
                          }} className="p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all">
                             <Settings className="h-5 w-5 text-neutral-400" />
                          </button>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-white/5">
                       <Globe className="h-4 w-4 text-brand-blue" />
                       <div className="text-xs font-mono text-neutral-400 truncate flex-1">
                          {window.location.origin}/m/{selectedServer.slug}
                       </div>
                       <button 
                         onClick={() => navigator.clipboard.writeText(`${window.location.origin}/m/${selectedServer.slug}`)}
                         className="p-1 px-3 rounded-lg bg-white/5 text-[10px] font-bold hover:bg-white/10"
                       >
                          COPY BASE URL
                       </button>
                    </div>
                 </div>

                 {/* Endpoints Table */}
                 <div className="flex-1 flex flex-col rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                    <div className="p-4 px-6 border-b border-white/5 flex items-center justify-between">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Configured Rules</h3>
                       <button 
              onClick={() => {
                setEditingEndpoint(null);
                setNewEndpoint({
                  path: '/',
                  method: 'GET',
                  status: 200,
                  body: '{\n  "status": "success",\n  "message": "Hello from Mock Server"\n}',
                  delay: 0
                });
                setShowEndpointModal(true);
              }}
                         className="flex items-center gap-2 text-[10px] font-bold text-white bg-brand-blue/20 hover:bg-brand-blue/30 px-3 py-1.5 rounded-lg border border-brand-blue/20"
                       >
                          <Plus className="h-3 w-3" />
                          ADD RULE
                       </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                       {endpoints.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-neutral-700 opacity-40">
                             <ArrowRight className="h-12 w-12 mb-4" />
                             <p className="text-sm italic">Define patterns and responses to start mocking</p>
                          </div>
                       ) : (
                          <table className="w-full text-left border-collapse">
                             <thead>
                                <tr className="border-b border-white/5 text-[10px] text-neutral-500 uppercase font-bold bg-white/[0.01]">
                                   <th className="p-4 px-6">Method</th>
                                   <th className="p-4 px-6">Pattern</th>
                                   <th className="p-4 px-6">Status</th>
                                   <th className="p-4 px-6">Delay</th>
                                   <th className="p-4 px-6 text-right">Actions</th>
                                </tr>
                             </thead>
                             <tbody>
                                {endpoints.map(endpoint => (
                                   <tr key={endpoint.id} className="border-b border-white/[0.02] hover:bg-white/5 transition-all group">
                                      <td className="p-4 px-6">
                                         <span className={cn(
                                           "text-[10px] font-black px-2 py-0.5 rounded",
                                           endpoint.method === 'GET' ? "bg-emerald-500/10 text-emerald-400" :
                                           endpoint.method === 'POST' ? "bg-brand-blue/10 text-brand-blue" :
                                           "bg-neutral-800 text-neutral-400"
                                         )}>{endpoint.method}</span>
                                      </td>
                                      <td className="p-4 px-6 text-xs font-mono text-neutral-400">{endpoint.path}</td>
                                      <td className="p-4 px-6 text-xs font-bold text-white">{endpoint.response_status}</td>
                                      <td className="p-4 px-6 text-xs text-neutral-500">
                                         {endpoint.delay_ms > 0 ? (
                                            <span className="flex items-center gap-1">
                                               <Clock className="h-3 w-3" /> {endpoint.delay_ms}ms
                                            </span>
                                         ) : 'Instant'}
                                      </td>
                                      <td className="p-4 px-6 text-right">
                                         <div className="flex items-center justify-end gap-2 transition-opacity">
                                            <button onClick={() => openEndpointEditor(endpoint)} className="p-1.5 rounded hover:bg-white/10 text-neutral-600 hover:text-white">
                                               <Settings className="h-3 w-3" />
                                            </button>
                                            <button 
                                              onClick={() => deleteEndpoint(endpoint.id)}
                                              className="p-1.5 rounded hover:bg-red-500/10 text-neutral-600 hover:text-red-500"
                                            >
                                               <Trash2 className="h-3 w-3" />
                                            </button>
                                         </div>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       )}
                    </div>
                 </div>
              </>
           ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-800 text-center px-12">
                 <div className="relative mb-8">
                    <Server className="h-24 w-24 opacity-5" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
                       <Play className="h-6 w-6 text-brand-blue animate-pulse" />
                    </div>
                 </div>
                 <h2 className="text-xl font-bold text-white/40 mb-2 uppercase tracking-widest">Select a Server</h2>
                 <p className="text-xs text-neutral-700 italic max-w-sm">
                    Connect your applications to dynamic endpoints that look and behave like your real API, but with total control over data and failure scenarios.
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

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowCreateModal(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Initialize Mock Server</h3>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Server Display Name</label>
                    <input 
                      type="text" 
                      value={newServerName}
                      onChange={e => setNewServerName(e.target.value)}
                      placeholder="e.g. Stripe Simulation"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-brand-blue transition-colors"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Server URL Slug</label>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-neutral-600">
                       <span className="opacity-40">/m/</span>
                       <input 
                        type="text" 
                        value={newServerSlug}
                        onChange={e => setNewServerSlug(slugify(e.target.value))}
                        placeholder="stripe-engine"
                        className="flex-1 bg-transparent text-white outline-none"
                      />
                    </div>
                 </div>
                 <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-xs font-bold text-neutral-400 hover:bg-white/5 transition-all"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={handleCreateServer}
                      className="flex-3 px-4 py-3 rounded-xl bg-brand-blue text-xs font-bold text-white hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    >
                      PROVISION ENGINE
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}

        {showEndpointModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => {
                 setEditingEndpoint(null);
                 setShowEndpointModal(false);
               }}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                 <h3 className="text-lg font-bold text-white">{editingEndpoint ? 'Edit Response Rule' : 'Create Response Rule'}</h3>
                 <p className="text-xs text-neutral-500">Define the pattern and static/dynamic response payload.</p>
              </div>
              <div className="p-6 grid grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase">Method</label>
                          <select 
                            value={newEndpoint.method}
                            onChange={e => setNewEndpoint({...newEndpoint, method: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none"
                          >
                             <option>GET</option>
                             <option>POST</option>
                             <option>PUT</option>
                             <option>PATCH</option>
                             <option>DELETE</option>
                          </select>
                       </div>
                       <div className="col-span-2 space-y-1.5">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase">Status Code</label>
                          <input 
                            type="number" 
                            value={newEndpoint.status}
                            onChange={e => setNewEndpoint({...newEndpoint, status: parseInt(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none"
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-neutral-500 uppercase">Path</label>
                       <input 
                         type="text" 
                         value={newEndpoint.path}
                         onChange={e => setNewEndpoint({...newEndpoint, path: e.target.value})}
                         placeholder="/v1/users"
                         className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-neutral-500 uppercase">Latency Injection (ms)</label>
                       <input 
                         type="number" 
                         value={newEndpoint.delay}
                         onChange={e => setNewEndpoint({...newEndpoint, delay: parseInt(e.target.value)})}
                         placeholder="0"
                         className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-white outline-none"
                       />
                    </div>
                 </div>
                 <div className="space-y-1.5 flex flex-col h-[240px]">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Response Body</label>
                    <div className="flex-1 rounded-lg border border-white/10 overflow-hidden bg-black">
                       <Editor 
                         height="100%"
                         defaultLanguage="json"
                         theme="vs-dark"
                         value={newEndpoint.body}
                         onChange={v => setNewEndpoint({...newEndpoint, body: v || ''})}
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
                  onClick={() => {
                    setEditingEndpoint(null);
                    setShowEndpointModal(false);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-neutral-400 hover:bg-white/5"
                 >
                   CANCEL
                 </button>
                 <button 
                   onClick={handleCreateEndpoint}
                   className="flex-1 px-6 py-2.5 rounded-xl bg-brand-blue text-xs font-bold text-white hover:bg-blue-600 transition-all"
                 >
                   {editingEndpoint ? 'SAVE RULE' : 'DEPLOY RULE'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
        {showServerSettings && selectedServer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowServerSettings(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-6">
              <h3 className="mb-4 text-lg font-bold">Server Settings</h3>
              <div className="space-y-4">
                <input value={newServerName} onChange={e => setNewServerName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm outline-none" />
                <input value={newServerSlug} onChange={e => setNewServerSlug(slugify(e.target.value))} className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm outline-none" />
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={deleteSelectedServer} className="rounded-xl border border-red-500/20 px-4 py-2 text-xs font-bold text-red-400">DELETE</button>
                <button onClick={() => setShowServerSettings(false)} className="flex-1 rounded-xl border border-white/10 py-2 text-xs font-bold text-neutral-400">CANCEL</button>
                <button onClick={updateSelectedServer} className="flex-1 rounded-xl bg-brand-blue py-2 text-xs font-bold">SAVE</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Editor from '@monaco-editor/react';
import { 
  Play, 
  Save, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Copy, 
  Eye, 
  Sparkles,
  History,
  Settings2,
  ChevronDown,
  Globe,
  Lock,
  Code,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatBytes } from '../lib/utils';
import { RequestEngine, RequestExecutionResult, RequestSettings } from '../services/requestEngine';
import { AiDiagnostics } from '../services/aiDiagnostics';
import { useAuthStore } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function ApiTesting() {
  const { user } = useAuthStore();
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [activeTab, setActiveTab] = useState('body');
  const [body, setBody] = useState('{\n  "name": "FlowForge Test"\n}');
  const [headers, setHeaders] = useState<string>('{\n  "Content-Type": "application/json"\n}');
  const [expectedSchema, setExpectedSchema] = useState<string>('{\n  "type": "object"\n}');
  const [expectedStatus, setExpectedStatus] = useState<string>('200');
  
  const [response, setResponse] = useState<RequestExecutionResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('request_logs')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setHistory(data);
  };

  const handleSend = async () => {
    if (!user) return;
    setIsSending(true);
    setResponse(null);
    setDiagnostics(null);
    
    try {
      let parsedBody = undefined;
      if (method !== 'GET' && body.trim()) {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          throw new Error('Invalid JSON Body');
        }
      }

      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (e) {
         // ignore or warn
      }

      const settings: RequestSettings = {
        expectedStatus: expectedStatus.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s)),
        maxDurationMs: 5000,
      };

      if (expectedSchema.trim()) {
        try {
          settings.expectedSchema = JSON.parse(expectedSchema);
        } catch (e) {}
      }

      const result = await RequestEngine.execute(
        {
          method: method as any,
          url,
          data: parsedBody,
          headers: parsedHeaders
        },
        settings,
        { userId: user.id }
      );

      setResponse(result);
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setResponse({
        status: 0,
        statusText: 'Error',
        headers: {},
        body: err.message,
        durationMs: 0,
        validation: { isValid: false, errors: [err.message] }
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDiagnose = async () => {
    if (!response) return;
    setIsDiagnosing(true);
    
    try {
      const result = await AiDiagnostics.analyzeFailure({
        url,
        method,
        requestBody: body ? JSON.parse(body) : undefined,
        responseStatus: response.status,
        responseBody: response.body,
        validationErrors: response.validation.errors
      });
      
      setDiagnostics(result.explanation + " Fix: " + result.suggestedFix);
    } catch (error) {
      setDiagnostics("AI diagnostic failed. Please check your connection.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-120px)] gap-4 overflow-hidden">
        {/* Collections Sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col rounded-xl border border-white/5 bg-white/[0.02]">
           <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Collections</h3>
              <button className="p-1 hover:bg-white/5 rounded transition-colors">
                 <Plus className="h-4 w-4" />
              </button>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-1 flex items-center gap-2">
                 <History className="h-3 w-3" />
                 Recent Activity
              </div>
              {history.map((item) => (
                 <div 
                   key={item.id}
                   onClick={() => {
                       setUrl(item.url);
                       setMethod(item.method);
                   }}
                   className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer group transition-all"
                 >
                   <div className={cn(
                     "text-[8px] font-bold w-10 py-0.5 rounded text-center uppercase flex-shrink-0",
                     item.response_status < 400 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                   )}>{item.method}</div>
                   <span className="text-[10px] truncate flex-1 text-neutral-400 group-hover:text-neutral-200">
                     {item.url.replace(/^https?:\/\//, '')}
                   </span>
                 </div>
              ))}
           </div>
        </div>

        {/* Request Builder */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
           {/* Top Bar */}
           <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                 <div className="relative group">
                    <select 
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="bg-transparent pl-4 pr-8 py-2 text-xs font-bold text-brand-blue outline-none appearance-none cursor-pointer hover:bg-white/5"
                    >
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>PATCH</option>
                      <option>DELETE</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-600 pointer-events-none" />
                 </div>
                 <div className="h-4 w-[1px] bg-white/10" />
                 <input 
                   type="text" 
                   value={url}
                   onChange={(e) => setUrl(e.target.value)}
                   className="flex-1 bg-transparent px-4 py-2 text-sm text-neutral-200 outline-none placeholder:text-neutral-700"
                   placeholder="Enter request URL"
                 />
              </div>
              <button 
                onClick={handleSend}
                disabled={isSending}
                className="flex items-center gap-2 rounded-lg bg-brand-blue px-6 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Send'}
                <Play className={cn("h-4 w-4", !isSending && "fill-white")} />
              </button>
              <button className="p-2 rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:text-white transition-colors">
                <Save className="h-4 w-4" />
              </button>
           </div>

           {/* Tabs and Editors */}
           <div className="flex-1 flex flex-col min-h-0 min-w-0">
             <div className="flex items-center gap-6 border-b border-white/5 px-2 mb-4">
                <Tab label="Body" active={activeTab === 'body'} onClick={() => setActiveTab('body')} />
                <Tab label="Headers" active={activeTab === 'headers'} onClick={() => setActiveTab('headers')} />
                <Tab label="Validation" active={activeTab === 'validation'} onClick={() => setActiveTab('validation')} />
                <Tab label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
             </div>

             <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeTab === 'body' && (
                    <EditorTab 
                      value={body} 
                      onChange={setBody} 
                      language="json" 
                    />
                  )}
                  {activeTab === 'headers' && (
                    <EditorTab 
                      value={headers} 
                      onChange={setHeaders} 
                      language="json" 
                    />
                  )}
                  {activeTab === 'validation' && (
                    <div className="h-full flex gap-4">
                       <div className="flex-2 flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-neutral-500 uppercase">Response Schema (JSON Schema)</label>
                          <EditorTab value={expectedSchema} onChange={setExpectedSchema} language="json" />
                       </div>
                       <div className="flex-1 flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Expected Status</label>
                            <input 
                              type="text" 
                              value={expectedStatus}
                              onChange={e => setExpectedStatus(e.target.value)}
                              placeholder="200, 201"
                              className="bg-white/5 border border-white/10 rounded p-2 text-xs text-white outline-none"
                            />
                          </div>
                       </div>
                    </div>
                  )}
                  {activeTab === 'settings' && (
                    <motion.div 
                      key="settings-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex h-full items-center justify-center text-neutral-600 text-sm italic"
                    >
                      Enterprise Settings: Retries, Workspaces, RBAC
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
           </div>

           {/* Response Section */}
           <div className={cn(
             "h-1/2 flex flex-col rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all",
             !response && "h-[60px]"
           )}>
             <div className="flex items-center justify-between p-3 px-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">Response</h3>
                   {response && (
                      <div className="flex items-center gap-3">
                         <div className={cn(
                           "text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1",
                          !response.validation.isValid ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                         )}>
                          {response.status || (!response.validation.isValid ? 'Error' : '200 OK')}
                         </div>
                         <div className="text-[10px] text-neutral-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {response.durationMs}ms
                         </div>
                         <div className="text-[10px] text-neutral-600 flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {formatBytes(JSON.stringify(response).length)}
                         </div>
                      </div>
                   )}
                </div>
                <div className="flex items-center gap-2">
                   {response && (
                      <button 
                        onClick={handleDiagnose}
                        disabled={isDiagnosing}
                        className="flex items-center gap-2 rounded-md bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold text-brand-blue hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                         <Sparkles className="h-3 w-3" />
                         {isDiagnosing ? 'Diagnosing...' : 'AI Diagnose'}
                      </button>
                   )}
                   <button className="p-1 hover:bg-white/5 rounded">
                      <ChevronDown className="h-4 w-4 text-neutral-600" />
                   </button>
                </div>
             </div>
             
             {response ? (
               <div className="flex-1 flex flex-col min-h-0">
                  {diagnostics && (
                    <div className="p-3 px-4 bg-brand-blue/5 border-b border-white/5 flex items-start gap-3">
                       <Sparkles className="h-4 w-4 text-brand-blue mt-0.5 flex-shrink-0" />
                       <div className="text-xs text-brand-blue/90 font-medium italic">
                          {diagnostics}
                       </div>
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                     <Editor 
                        height="100%"
                        defaultLanguage="json"
                        theme="vs-dark"
                        value={typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2)}
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
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-neutral-700">
                  <Play className="h-8 w-8 mb-4 opacity-10" />
                  <p className="text-xs italic">Enter a URL and click send to test your API</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function EditorTab({ value, onChange, language }: { value: string, onChange: (v: string) => void, language: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full rounded-xl border border-white/5 bg-[#1e1e1e] overflow-hidden"
    >
      <Editor 
        height="100%"
        defaultLanguage={language}
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || '')}
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 }
        }}
      />
    </motion.div>
  );
}

function CollectionItem({ name, count, active }: any) {
  return (
    <div className={cn(
      "group flex items-center justify-between rounded-md p-2 transition-all cursor-pointer",
      active ? "bg-white/5 text-white" : "text-neutral-500 hover:bg-white/[0.03] hover:text-neutral-300"
    )}>
       <div className="flex items-center gap-2 overflow-hidden">
          <ChevronDown className={cn("h-3 w-3 transition-transform", !active && "-rotate-90")} />
          <Code className="h-3 w-3 flex-shrink-0" />
          <span className="text-xs font-medium truncate">{name}</span>
       </div>
       <span className="text-[10px] font-mono opacity-50">{count}</span>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative pb-2 text-xs font-semibold tracking-wide transition-all",
        active ? "text-white" : "text-neutral-600 hover:text-neutral-400"
      )}
    >
      {label}
      {active && (
        <motion.div 
          layoutId="active-tab"
          className="absolute bottom-0 left-0 h-0.5 w-full bg-brand-blue" 
        />
      )}
    </button>
  );
}

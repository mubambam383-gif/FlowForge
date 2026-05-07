import React, { useState } from 'react';
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
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatBytes } from '../lib/utils';
import axios from 'axios';
import { GoogleGenAI } from "@google/genai";

export default function ApiTesting() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://api.example.com/v1/resource');
  const [activeTab, setActiveTab] = useState('params');
  const [body, setBody] = useState('{\n  "name": "FlowForge Test"\n}');
  
  const [response, setResponse] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [diagnostics, setDiagnostics] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    
    return new GoogleGenAI({ apiKey });
  };

  const handleSend = async () => {
    setIsSending(true);
    setResponse(null);
    setDiagnostics(null);
    
    try {
      // Use our backend proxy to avoid CORS
      const res = await axios.post('/api/proxy', {
        url,
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'GET' ? JSON.parse(body) : undefined
      });
      setResponse(res.data);
    } catch (err: any) {
      setResponse({
        error: true,
        message: err.response?.data?.error || err.message,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDiagnose = async () => {
    if (!response) return;
    setIsDiagnosing(true);
    
    try {
      const prompt = `Analyze this API response for potential integration issues or errors. 
      URL: ${url}
      Method: ${method}
      Request Body: ${body}
      
      Response: ${JSON.stringify(response)}
      
      Provide a concise 2-3 sentence diagnostic and suggestion for fix.`;

      const result = await getAiClient().models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      setDiagnostics(result.text || "Unable to diagnose at this time.");
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
              <CollectionItem name="Marketing API" count={4} />
              <CollectionItem name="User Service" count={12} active />
              <CollectionItem name="Payment Webhooks" count={3} />
              <CollectionItem name="Auth Service" count={8} />
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
                <Tab label="Params" active={activeTab === 'params'} onClick={() => setActiveTab('params')} />
                <Tab label="Auth" active={activeTab === 'auth'} onClick={() => setActiveTab('auth')} />
                <Tab label="Headers" active={activeTab === 'headers'} onClick={() => setActiveTab('headers')} />
                <Tab label="Body" active={activeTab === 'body'} onClick={() => setActiveTab('body')} />
                <Tab label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
             </div>

             <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeTab === 'body' ? (
                    <motion.div 
                      key="body-editor"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full rounded-xl border border-white/5 bg-[#1e1e1e] overflow-hidden"
                    >
                      <Editor 
                        height="100%"
                        defaultLanguage="json"
                        theme="vs-dark"
                        value={body}
                        onChange={(val) => setBody(val || '')}
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
                  ) : (
                    <motion.div 
                      key="other-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex h-full items-center justify-center text-neutral-600 text-sm italic"
                    >
                      No configuration needed for {activeTab}
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
                           response.error ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                         )}>
                           {response.status || (response.error ? 'Error' : '200 OK')}
                         </div>
                         <div className="text-[10px] text-neutral-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {response.time || '124ms'}
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
                        value={JSON.stringify(response, null, 2)}
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

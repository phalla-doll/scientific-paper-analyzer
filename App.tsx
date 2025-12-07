import React, { useState, useRef, useEffect } from 'react';
import { Upload, Bot, AlertCircle, CheckCircle2, Sparkles, Send, RefreshCw, MessageSquare, FileText, X, Plus, Play, Download, Square, Copy, Check } from 'lucide-react';
import { JsonDisplay, JsonDisplayRef } from './components/JsonDisplay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { convertPdfToImages } from './utils/pdfUtils';
import { analyzePaper, chatWithPaper } from './services/geminiService';
import { trackEvent } from './services/analytics';
import { Message, PaperAnalysis, AppState } from './types';

// Minimal HUD Corner Component
const CornerAccents = ({ className = "border-blue-500/30", size = "w-1.5 h-1.5" }) => (
  <>
    <div className={`absolute top-0 left-0 ${size} border-l border-t ${className}`} />
    <div className={`absolute top-0 right-0 ${size} border-r border-t ${className}`} />
    <div className={`absolute bottom-0 left-0 ${size} border-l border-b ${className}`} />
    <div className={`absolute bottom-0 right-0 ${size} border-r border-b ${className}`} />
  </>
);

const AnalysisLoader = ({ appState }: { appState: AppState }) => {
  const [internalStage, setInternalStage] = useState(0);

  useEffect(() => {
    if (appState === AppState.PROCESSING_PDF) {
      setInternalStage(1);
    } else if (appState === AppState.ANALYZING) {
      setInternalStage(2);
      // Simulate transition to Synthesis phase after a few seconds of Analysis
      const timer = setTimeout(() => setInternalStage(3), 4000);
      return () => clearTimeout(timer);
    }
  }, [appState]);

  const steps = [
    { id: 1, label: 'DOCUMENT RASTERIZATION' },
    { id: 2, label: 'MULTIMODAL INFERENCE' },
    { id: 3, label: 'STRUCTURAL SYNTHESIS' }
  ];

  const getStatus = (stepId: number) => {
    if (internalStage > stepId) return 'complete';
    if (internalStage === stepId) return 'active';
    return 'pending';
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 w-full max-w-sm mx-auto font-mono">
      <style>
        {`
          @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes spin-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
          @keyframes pulse-fast { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          .loader-spin { animation: spin-slow 8s linear infinite; }
          .loader-spin-reverse { animation: spin-reverse 6s linear infinite; }
          .loader-pulse { animation: pulse-fast 1.5s ease-in-out infinite; }
        `}
      </style>

      {/* Central Tech Graphic */}
      <div className="relative w-24 h-24 mb-12">
        {/* Outer Ring */}
        <div className="absolute inset-0 border border-blue-900/40 rounded-none transform rotate-45 loader-spin" />
        <div className="absolute inset-0 border border-blue-900/40 rounded-none transform -rotate-45 loader-spin-reverse" />
        
        {/* Active Ring */}
        <div className="absolute inset-2 border-t-2 border-r-2 border-blue-500 rounded-none loader-spin" />
        
        {/* Core */}
        <div className="absolute inset-[30%] bg-blue-950/30 border border-blue-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.2)]">
           <div className="w-1.5 h-1.5 bg-blue-400 loader-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
        </div>

        {/* HUD Accents */}
        <div className="absolute -top-2 -left-2 w-2 h-2 border-t border-l border-blue-800" />
        <div className="absolute -bottom-2 -right-2 w-2 h-2 border-b border-r border-blue-800" />
      </div>

      {/* Status Steps */}
      <div className="w-full space-y-5">
        {steps.map((step) => {
          const status = getStatus(step.id);
          return (
            <div 
              key={step.id} 
              className={`flex items-center gap-4 transition-all duration-500 ${status === 'pending' ? 'opacity-30 blur-[0.5px]' : 'opacity-100'}`}
            >
              <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                {status === 'complete' && (
                  <div className="bg-blue-600 w-full h-full flex items-center justify-center text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]">
                    <CheckCircle2 size={12} />
                  </div>
                )}
                {status === 'active' && (
                  <div className="w-2 h-2 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] loader-pulse" />
                )}
                {status === 'pending' && (
                  <div className="w-1.5 h-1.5 bg-zinc-800" />
                )}
              </div>
              
              <div className="flex-1 flex justify-between items-baseline border-b border-dashed border-zinc-800 pb-2">
                <span className={`text-[10px] tracking-[0.2em] font-bold ${status === 'active' ? 'text-blue-400' : 'text-zinc-600'}`}>
                  {step.label}
                </span>
                {status === 'active' && (
                  <span className="text-[9px] text-blue-500 font-bold animate-pulse">{'>>>'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'System Initialized. Upload a PDF or paste text to begin multimodal analysis.',
      timestamp: Date.now()
    }
  ]);
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [inputText, setInputText] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [showStickyActions, setShowStickyActions] = useState(false);
  const [stickyCopied, setStickyCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const jsonDisplayRef = useRef<JsonDisplayRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Ref to track the current analysis session ID. 
  // If the user cancels, we increment this to ignore results from the stale promise.
  const analysisIdRef = useRef<number>(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
        // Threshold: 200px. If scrolled past, show sticky actions.
        const shouldShow = scrollContainerRef.current.scrollTop > 200;
        if (shouldShow !== showStickyActions) {
            setShowStickyActions(shouldShow);
        }
    }
  };

  const addMessage = (role: Message['role'], content: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      role,
      content,
      timestamp: Date.now()
    }]);
  };

  const handleInputSubmit = async () => {
    if (!inputText.trim()) return;

    // Mode 1: Interactive Chat (Post-Analysis)
    if (analysis && appState === AppState.COMPLETE) {
      const userQuery = inputText;
      setInputText('');
      setIsChatting(true);
      addMessage('user', userQuery);
      
      trackEvent('chat_query_sent', { query_length: userQuery.length });

      try {
        const response = await chatWithPaper(analysis, userQuery, messages);
        addMessage('assistant', response);
        trackEvent('chat_response_received', { response_length: response.length });
      } catch (error: any) {
        addMessage('assistant', `Error: ${error.message}`);
        trackEvent('chat_error', { message: error.message });
      }
      setIsChatting(false);
      return;
    }

    // Mode 2: Raw Text Analysis (Pre-Analysis)
    handleTextAnalyze();
  };

  const handleTextAnalyze = async () => {
    if (!inputText.trim()) return;

    const currentId = Date.now();
    analysisIdRef.current = currentId;

    const textToAnalyze = inputText;
    trackEvent('analyze_text_submitted', { text_length: textToAnalyze.length });

    setAnalysis(null);
    setSelectedFiles([]);
    setAppState(AppState.ANALYZING);
    setShowStickyActions(false);
    
    addMessage('user', 'Submitted text for analysis.');
    addMessage('assistant', 'Analyzing text content...');
    
    setInputText('');

    try {
      const result = await analyzePaper({ text: textToAnalyze });
      
      // Guard: Check if this process is still active (not cancelled/superseded)
      if (analysisIdRef.current !== currentId) return;

      setAnalysis(result);
      setAppState(AppState.COMPLETE);
      addMessage('assistant', 'Analysis complete. You can now ask questions about the paper below.');
      trackEvent('analyze_text_completed', { success: true, paper_title: result.paper_title });
    } catch (error: any) {
      if (analysisIdRef.current !== currentId) return;
      console.error(error);
      setAppState(AppState.ERROR);
      addMessage('assistant', `Error processing text: ${error.message || 'Unknown error'}`);
      trackEvent('analyze_text_failed', { message: error.message });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
      
      if (newFiles.length === 0) {
         addMessage('system', 'Please upload valid PDF files.');
         return;
      }

      setSelectedFiles(prev => [...prev, ...newFiles]);
      trackEvent('files_selected', { count: newFiles.length });
      
      // Reset input so duplicate selection is possible if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeFiles = async () => {
    if (selectedFiles.length === 0) return;

    const currentId = Date.now();
    analysisIdRef.current = currentId;

    setAppState(AppState.PROCESSING_PDF);
    setShowStickyActions(false);
    const fileNames = selectedFiles.map(f => f.name).join(', ');
    addMessage('user', `Uploaded ${selectedFiles.length} document(s): ${fileNames}`);
    addMessage('assistant', `Processing ${selectedFiles.length} document(s) for multimodal analysis...`);
    trackEvent('batch_analysis_started', { file_count: selectedFiles.length });

    try {
      // Convert all PDFs to images in parallel
      const allImagesArrays = await Promise.all(selectedFiles.map(f => convertPdfToImages(f)));
      
      if (analysisIdRef.current !== currentId) return;

      const images = allImagesArrays.flat();
      
      setAppState(AppState.ANALYZING);
      addMessage('assistant', `Derendering documents (${images.length} total pages) and interpreting visuals...`);
      
      const result = await analyzePaper({ images });
      
      if (analysisIdRef.current !== currentId) return;
      
      setAnalysis(result);
      setAppState(AppState.COMPLETE);
      addMessage('assistant', 'Analysis complete. Structured data extracted.');
      addMessage('assistant', 'System is ready for Q&A. Type below to query the documents.');
      
      trackEvent('analyze_pdf_completed', { page_count: images.length, paper_title: result.paper_title });

    } catch (error: any) {
      if (analysisIdRef.current !== currentId) return;
      console.error(error);
      setAppState(AppState.ERROR);
      addMessage('assistant', `Error processing documents: ${error.message || 'Unknown error'}`);
      trackEvent('analyze_pdf_failed', { message: error.message });
    }
  };

  const handleCancelAnalysis = () => {
    // Invalidate the current analysis ID
    analysisIdRef.current = 0;
    
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setShowStickyActions(false);
    addMessage('system', 'Analysis process cancelled by user.');
    trackEvent('analysis_cancelled');
  };

  const handleReset = () => {
    trackEvent('app_reset');
    setAnalysis(null);
    setSelectedFiles([]);
    setAppState(AppState.IDLE);
    setShowStickyActions(false);
    analysisIdRef.current = 0;
    setMessages([{
      id: 'reset',
      role: 'system',
      content: 'Context cleared. Ready for new input.',
      timestamp: Date.now()
    }]);
  };

  const isIdle = appState === AppState.IDLE || appState === AppState.ERROR;
  const isComplete = appState === AppState.COMPLETE;
  const isAnalyzing = appState === AppState.PROCESSING_PDF || appState === AppState.ANALYZING;

  const getHeaderText = () => {
    if (!analysis) return 'System Ready';
    if (selectedFiles.length === 1) return `FILE: ${selectedFiles[0].name}`;
    if (selectedFiles.length > 1) return `FILES: ${selectedFiles.length} Documents`;
    return 'TEXT ANALYSIS';
  };

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-200 overflow-hidden font-sans tracking-wide selection:bg-blue-500/30">
      {/* LEFT PANEL */}
      <div className="w-1/3 min-w-[350px] max-w-[500px] border-r border-zinc-800 flex flex-col bg-zinc-900/50 h-full z-10 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.3)]">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] relative group cursor-default">
              <CornerAccents className="border-blue-400 group-hover:border-white transition-colors" size="w-0.5 h-0.5" />
              <Bot size={20} />
            </div>
            <div>
              <h1 className="font-bold text-zinc-100 text-lg tracking-tight uppercase leading-none">Research<br/>Assistant</h1>
            </div>
          </div>
          
          {isComplete && (
            <button 
                onClick={handleReset}
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Reset / New Analysis"
            >
                <RefreshCw size={16} />
            </button>
          )}
        </div>

        {/* Chat Area */}
        <ErrorBoundary componentName="CHAT_LOG">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-dots-pattern">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`
                  relative max-w-[90%] px-5 py-4 text-sm leading-relaxed border backdrop-blur-sm
                  ${msg.role === 'user' 
                    ? 'bg-zinc-800/50 text-zinc-200 border-zinc-700 shadow-sm' 
                    : msg.role === 'assistant'
                      ? 'bg-blue-950/20 text-blue-200 border-blue-900/50'
                      : 'text-zinc-500 text-xs font-mono uppercase tracking-wider border-transparent pl-0'
                  }
                `}>
                  {msg.role !== 'system' && (
                      <CornerAccents className={msg.role === 'user' ? 'border-zinc-600' : 'border-blue-800'} size="w-1 h-1"/>
                  )}
                  {msg.role === 'assistant' && (
                    <span className="flex items-center gap-2 mb-2 font-bold text-blue-500 text-[10px] uppercase tracking-widest">
                      <Bot size={10} /> AI Analysis
                    </span>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}
            {isChatting && (
              <div className="flex flex-col items-start animate-pulse">
                  <div className="relative max-w-[90%] px-5 py-4 text-sm bg-blue-950/10 border border-blue-900/30 text-blue-400">
                      <CornerAccents className="border-blue-800" size="w-1 h-1"/>
                      Thinking...
                  </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </ErrorBoundary>

        {/* Footer Input Area */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900 space-y-5 relative z-20">
          <div className="space-y-2">
            <div className="relative group">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block flex justify-between">
                <span>{isComplete ? 'Ask a question about this paper' : 'Input Source'}</span>
                {isComplete && <span className="text-blue-500">Q&A Mode Active</span>}
              </label>
              
              <div className="relative">
                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleInputSubmit();
                        }
                    }}
                    placeholder={isComplete ? "e.g. What is the sample size? Explain Figure 3." : "Paste abstract text here..."}
                    className={`w-full h-24 p-3 pr-10 text-xs font-mono bg-zinc-950 border focus:outline-none resize-none transition-all placeholder:text-zinc-600 text-zinc-300
                        ${isComplete ? 'border-blue-900/50 focus:border-blue-500/50 focus:bg-blue-950/10' : 'border-zinc-800 focus:border-blue-500/50 focus:bg-zinc-950'}
                    `}
                    disabled={isAnalyzing}
                />
                <CornerAccents className={`transition-colors ${isComplete ? 'border-blue-800' : 'border-zinc-700 group-focus-within:border-blue-500'}`} />
                
                <button
                    onClick={handleInputSubmit}
                    disabled={!inputText.trim() || isAnalyzing}
                    className={`absolute bottom-3 right-3 p-2 text-white transition-colors
                        ${isComplete ? 'bg-blue-600 hover:bg-blue-500' : 'bg-zinc-700 hover:bg-zinc-600'}
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    title={isComplete ? "Send Question" : "Analyze Text"}
                >
                    {isComplete ? <MessageSquare size={14} /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </div>

          {!isComplete && (
            <>
                <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                    <div className="h-px bg-zinc-800 flex-1"></div>
                    <span>OR</span>
                    <div className="h-px bg-zinc-800 flex-1"></div>
                </div>
                
                {/* File List if files selected */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-2 group hover:border-zinc-600 transition-colors">
                           <div className="flex items-center gap-2 overflow-hidden">
                             <FileText size={14} className="text-zinc-500 group-hover:text-blue-400 shrink-0" />
                             <span className="text-xs text-zinc-400 truncate font-mono">{file.name}</span>
                           </div>
                           <button 
                             onClick={() => handleRemoveFile(idx)}
                             className="text-zinc-600 hover:text-red-400 p-1"
                             title="Remove file"
                             disabled={isAnalyzing}
                           >
                             <X size={12} />
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf"
                        multiple
                    />
                    
                    {/* Upload/Add Button */}
                    <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isIdle}
                    className={`group border border-zinc-800 hover:border-blue-500/50 bg-zinc-900 hover:bg-blue-900/10 transition-all duration-300 flex flex-col items-center justify-center gap-2 relative focus:outline-none disabled:opacity-50
                      ${selectedFiles.length > 0 ? 'w-1/3 h-12' : 'w-full h-20'}
                    `}
                    title="Upload PDF(s)"
                    >
                    <CornerAccents className="border-zinc-800 group-hover:border-blue-500/50 transition-colors" />
                    {selectedFiles.length > 0 ? (
                       <Plus className="w-5 h-5 text-zinc-500 group-hover:text-blue-400" />
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-zinc-500 group-hover:text-blue-400 transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Upload PDF</span>
                        </div>
                      </>
                    )}
                    </button>

                    {/* Analyze Button OR Cancel Button */}
                    {selectedFiles.length > 0 && (
                      isAnalyzing ? (
                        <button
                          onClick={handleCancelAnalysis}
                          className="group flex-1 border border-red-900/50 bg-red-600 hover:bg-red-500 text-white transition-all duration-300 flex items-center justify-center gap-2 relative focus:outline-none h-12"
                          title="Cancel Analysis"
                        >
                           <CornerAccents className="border-red-400" />
                           <Square size={14} fill="currentColor" />
                           <span className="text-xs font-bold uppercase tracking-widest">
                             Cancel
                           </span>
                        </button>
                      ) : (
                        <button
                          onClick={handleAnalyzeFiles}
                          className="group flex-1 border border-blue-900/50 bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 flex items-center justify-center gap-2 relative focus:outline-none h-12"
                          title="Start Analysis"
                        >
                           <CornerAccents className="border-blue-400" />
                           <Play size={14} fill="currentColor" />
                           <span className="text-xs font-bold uppercase tracking-widest">
                             Analyze {selectedFiles.length > 1 ? `(${selectedFiles.length})` : ''}
                           </span>
                        </button>
                      )
                    )}
                </div>

                {selectedFiles.length === 0 && (
                  <div className="flex justify-center pt-2">
                    <a 
                      href="/assets/sample_paper.pdf" 
                      download
                      className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-blue-400 transition-colors font-mono uppercase tracking-wide group"
                    >
                      <Download size={12} className="group-hover:animate-bounce" />
                      <span>Download Sample PDF</span>
                    </a>
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 bg-[#09090b] h-full overflow-y-auto relative custom-scrollbar"
      >
        {!analysis && appState === AppState.IDLE ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600">
            <div className="w-16 h-16 border border-zinc-800 bg-zinc-900 flex items-center justify-center mb-6 relative">
              <CornerAccents className="border-zinc-700" />
              <Sparkles size={24} className="text-zinc-600" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">System Ready</p>
            <p className="text-xs text-zinc-700 mt-2">Awaiting Input Stream</p>
          </div>
        ) : (
          <div className="p-8 max-w-4xl mx-auto min-h-full">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#09090b]/95 backdrop-blur z-20 py-4 border-b border-zinc-800 transition-all">
                <h2 className="text-xs font-mono text-zinc-500 truncate max-w-md uppercase">
                   {getHeaderText()}
                </h2>
                <div className="flex items-center gap-2">
                   {/* Sticky Header Actions */}
                   {showStickyActions && appState === AppState.COMPLETE && (
                      <>
                        <button 
                            onClick={async () => {
                                if (jsonDisplayRef.current) {
                                    await jsonDisplayRef.current.copyJson();
                                    setStickyCopied(true);
                                    setTimeout(() => setStickyCopied(false), 2000);
                                }
                            }}
                            className={`flex items-center justify-center px-3 py-1 border transition-colors relative
                                ${stickyCopied 
                                    ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900' 
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-950/20'
                                }`}
                            title="Copy JSON"
                        >
                            <CornerAccents className={stickyCopied ? "border-emerald-800" : "border-zinc-700"} size="w-0.5 h-0.5" />
                            {stickyCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button 
                             onClick={() => jsonDisplayRef.current?.downloadReport()}
                             className="flex items-center justify-center px-3 py-1 border bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-950/20 transition-colors relative"
                             title="Download Report"
                        >
                             <CornerAccents className="border-zinc-700" size="w-0.5 h-0.5" />
                             <Download size={14} />
                        </button>
                        <div className="w-px h-6 bg-zinc-800 mx-1"></div>
                      </>
                   )}

                   {appState === AppState.COMPLETE && (
                       <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 px-3 py-1 bg-emerald-950/30 border border-emerald-900 relative">
                          <CornerAccents className="border-emerald-800" size="w-0.5 h-0.5" />
                          <CheckCircle2 size={10} />
                          Analysis Complete
                       </span>
                   )}
                   {appState === AppState.ERROR && (
                       <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400 px-3 py-1 bg-red-950/30 border border-red-900 relative">
                          <CornerAccents className="border-red-800" size="w-0.5 h-0.5" />
                          <AlertCircle size={10} />
                          Error
                       </span>
                   )}
                </div>
            </div>

            <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {analysis ? (
                  <ErrorBoundary 
                    componentName="DATA_VISUALIZER" 
                    onReset={() => {
                        setAnalysis(null);
                        setAppState(AppState.IDLE);
                        setSelectedFiles([]);
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'system',
                            content: 'System reset due to visualization error.',
                            timestamp: Date.now()
                        }]);
                    }}
                  >
                      <JsonDisplay ref={jsonDisplayRef} data={analysis} />
                  </ErrorBoundary>
              ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center border border-zinc-800 bg-zinc-900/30 relative">
                      <CornerAccents className="border-zinc-700" />
                      {appState === AppState.ERROR ? (
                          <div className="text-center p-6">
                              <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
                              <p className="text-zinc-500 font-mono text-sm">PROCESS_FAILED</p>
                          </div>
                      ) : (
                        <AnalysisLoader appState={appState} />
                      )}
                  </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
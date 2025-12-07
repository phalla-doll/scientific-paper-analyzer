import React from 'react';
import { Bot, RefreshCw, MessageSquare, Send, FileText, X, Upload, Plus, Square, Play, Download, Sun, Moon, Cpu, ArrowRight } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
import { CornerAccents } from './CornerAccents';
import { AppState, Message } from '../types';

interface LeftPanelProps {
  appState: AppState;
  messages: Message[];
  isChatting: boolean;
  inputText: string;
  setInputText: (text: string) => void;
  handleInputSubmit: () => void;
  selectedFiles: File[];
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: (index: number) => void;
  handleAnalyzeFiles: () => void;
  handleCancelAnalysis: () => void;
  handleReset: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  chatEndRef: React.RefObject<HTMLDivElement>;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  appState,
  messages,
  isChatting,
  inputText,
  setInputText,
  handleInputSubmit,
  selectedFiles,
  handleFileSelect,
  handleRemoveFile,
  handleAnalyzeFiles,
  handleCancelAnalysis,
  handleReset,
  fileInputRef,
  chatEndRef,
  isDarkMode,
  toggleTheme
}) => {
  const isComplete = appState === AppState.COMPLETE;
  const isAnalyzing = appState === AppState.PROCESSING_PDF || appState === AppState.ANALYZING;
  const isIdle = appState === AppState.IDLE || appState === AppState.ERROR;

  return (
    <div className="w-[28%] min-w-[320px] max-w-[450px] border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white/50 dark:bg-zinc-900/50 h-full z-10 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-colors duration-300">
      
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] dark:shadow-[0_0_15px_rgba(37,99,235,0.5)] relative group cursor-default">
            <CornerAccents className="border-blue-300 dark:border-blue-400 group-hover:border-white transition-colors" size="w-0.5 h-0.5" />
            <Bot size={20} />
          </div>
          <div>
            <h1 className="font-bold text-zinc-800 dark:text-zinc-100 text-lg tracking-tight uppercase leading-none">Research<br/>Assistant</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-zinc-500 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isComplete && (
            <button 
                onClick={handleReset}
                className="p-2 text-zinc-500 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Reset Analysis"
            >
                <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
        <ErrorBoundary componentName="CHAT_LOG">
            {messages.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex gap-2.5 items-start animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
                <div className={`w-8 h-8 shrink-0 flex items-center justify-center border relative
                ${msg.role === 'assistant' 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
                    : msg.role === 'user'
                    ? 'bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800'
                }`}
                >
                <CornerAccents className={msg.role === 'assistant' ? 'border-blue-300 dark:border-blue-400' : 'border-zinc-400 dark:border-zinc-600'} size="w-0.5 h-0.5" />
                {msg.role === 'assistant' ? <Bot size={16} /> : msg.role === 'user' ? <MessageSquare size={16} /> : <Bot size={16} className="opacity-50" />}
                </div>
                
                <div className={`max-w-[85%] text-sm leading-relaxed border relative
                ${msg.role === 'user' 
                    ? 'bg-zinc-100 border-zinc-200 text-zinc-800 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-200 p-3' 
                    : msg.role === 'assistant'
                    ? 'bg-blue-50 border-blue-100 text-zinc-800 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-100 py-2.5 px-3'
                    : 'bg-transparent border-transparent text-zinc-500 font-mono text-xs py-2.5 px-3'
                }`}
                >
                  {msg.role !== 'system' && (
                      <CornerAccents 
                          className={msg.role === 'assistant' ? 'border-blue-200 dark:border-blue-800' : 'border-zinc-300 dark:border-zinc-600'} 
                          size="w-1 h-1" 
                      />
                  )}
                  {msg.content}
                </div>
            </div>
            ))}
            <div ref={chatEndRef} />
        </ErrorBoundary>
      </div>

      {/* Input Section */}
      <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 relative z-20">
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
            placeholder={isComplete ? "Ask a question about this paper..." : "Paste text abstract or hypothesis..."}
            className="w-full bg-zinc-50 border border-zinc-200 text-zinc-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200 dark:focus:border-blue-600 min-h-[80px] p-3 pr-12 text-sm resize-none custom-scrollbar placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-colors"
            disabled={isAnalyzing}
          />
          
          <button 
            onClick={handleInputSubmit}
            disabled={!inputText.trim() || isAnalyzing || isChatting}
            className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors group"
          >
            <CornerAccents className="border-blue-300 group-hover:border-white" size="w-0.5 h-0.5" />
            {isComplete ? <Send size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>

        {/* Download Sample PDF Link - Only show when no files are selected */}
        {selectedFiles.length === 0 && (
          <div className="mt-2 flex justify-end">
            <a 
              href="/assets/sample-research-paper.pdf" 
              download 
              className="text-[10px] text-zinc-500 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-500 flex items-center gap-1.5 transition-colors uppercase tracking-wider font-mono cursor-pointer pb-0.5 border-b border-dashed border-transparent hover:border-blue-500 dark:hover:border-blue-400"
            >
              <Download size={10} />
              Download Sample PDF
            </a>
          </div>
        )}
        
        {/* Technical Footer */}
        <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-600 font-mono tracking-widest uppercase">
          <div className="flex items-center gap-1">
             <Cpu size={10} />
             <span>System v3.0.4</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span>Made with Gemini-3 by </span>
            <a 
              href="https://mantha.vercel.app/?utm_source=scientific-paper-analyzer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-500 dark:text-zinc-500 border-b border-dashed border-transparent hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-600 dark:hover:border-blue-400 transition-colors pb-0.5"
            >
              mantha
            </a>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
         {/* File List */}
         {selectedFiles.length > 0 && (
            <div className="space-y-2 mb-4 animate-in slide-in-from-bottom-2">
               {selectedFiles.map((file, idx) => (
                   <div key={idx} className="flex items-center justify-between p-2 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 group relative">
                       <CornerAccents className="border-zinc-300 dark:border-zinc-700" size="w-0.5 h-0.5" />
                       <div className="flex items-center gap-2 overflow-hidden">
                          <FileText size={14} className="text-blue-500 shrink-0" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-300 truncate font-mono">{file.name}</span>
                       </div>
                       <button 
                         onClick={() => handleRemoveFile(idx)}
                         className="text-zinc-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-zinc-400 dark:disabled:hover:text-zinc-600"
                         disabled={isAnalyzing}
                       >
                          <X size={14} />
                       </button>
                   </div>
               ))}
               
               {/* Add More Files Button (Small) */}
               {selectedFiles.length < 5 && (
                 <div className={`relative group border border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent p-2 flex items-center justify-center transition-colors ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-600'}`}>
                    <input 
                        type="file" 
                        accept="application/pdf"
                        multiple
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        disabled={isAnalyzing}
                    />
                    <Plus size={14} className={`text-zinc-400 transition-colors ${!isAnalyzing && 'group-hover:text-blue-500'}`} />
                 </div>
               )}
            </div>
         )}

         {/* Main Upload Area (Hidden if files selected) */}
         {selectedFiles.length === 0 && (
            <div className={`relative group h-32 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300 overflow-hidden ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500 dark:hover:border-blue-500'}`}>
                <CornerAccents className="border-zinc-300 dark:border-zinc-700 group-hover:border-blue-400 dark:group-hover:border-blue-400 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/50 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <input 
                    type="file" 
                    accept="application/pdf"
                    multiple
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                    disabled={isAnalyzing}
                />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-none flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Upload size={20} className="text-zinc-400 group-hover:text-blue-500 dark:text-zinc-500 transition-colors" />
                    </div>
                    <div className="text-center space-y-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Upload Research PDF
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
                            Drag & drop or click to browse
                        </p>
                    </div>
                </div>
            </div>
         )}

         {/* Analyze Action Button */}
         {selectedFiles.length > 0 && !isAnalyzing && (
             <button
                onClick={handleAnalyzeFiles}
                className="w-full relative py-3 bg-blue-600 hover:bg-blue-500 text-white uppercase tracking-widest text-xs font-bold transition-all group overflow-hidden leading-none"
             >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <CornerAccents className="border-blue-300 group-hover:border-white" size="w-1 h-1" />
                <span className="relative flex items-center justify-center gap-2 leading-none">
                   <Play size={14} /> 
                   <span>Start Analysis</span>
                </span>
             </button>
         )}

         {/* Cancel Button */}
         {isAnalyzing && (
             <button
                onClick={handleCancelAnalysis}
                className="w-full relative py-3 bg-red-600 hover:bg-red-500 text-white uppercase tracking-widest text-xs font-bold transition-all group overflow-hidden animate-in fade-in leading-none"
             >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <CornerAccents className="border-red-300 group-hover:border-white" size="w-1 h-1" />
                <span className="relative flex items-center justify-center gap-2 leading-none">
                   <Square size={14} fill="currentColor" /> 
                   <span className="mt-0.5">Cancel Process</span>
                </span>
             </button>
         )}
      </div>
    </div>
  );
};
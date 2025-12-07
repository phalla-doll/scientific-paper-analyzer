import React from 'react';
import { Bot, RefreshCw, MessageSquare, Send, FileText, X, Upload, Plus, Square, Play, Download } from 'lucide-react';
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
  chatEndRef
}) => {
  const isComplete = appState === AppState.COMPLETE;
  const isAnalyzing = appState === AppState.PROCESSING_PDF || appState === AppState.ANALYZING;
  const isIdle = appState === AppState.IDLE || appState === AppState.ERROR;

  return (
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
  );
};
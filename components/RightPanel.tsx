
import React from 'react';
import { Sparkles, Copy, Download, Check, CheckCircle2, AlertCircle, Menu } from 'lucide-react';
import { JsonDisplay, JsonDisplayRef } from './JsonDisplay';
import { ErrorBoundary } from './ErrorBoundary';
import { AnalysisLoader } from './AnalysisLoader';
import { CornerAccents } from './CornerAccents';
import { AppState, PaperAnalysis } from '../types';

interface RightPanelProps {
  appState: AppState;
  analysis: PaperAnalysis | null;
  errorDetail?: any;
  onReset: () => void;
  jsonDisplayRef: React.RefObject<JsonDisplayRef>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  showStickyActions: boolean;
  stickyCopied: boolean;
  onCopyJson: () => void;
  onDownloadReport: () => void;
  headerText: string;
  onScroll: () => void;
  onOpenSidebar: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  appState,
  analysis,
  errorDetail,
  onReset,
  jsonDisplayRef,
  scrollContainerRef,
  showStickyActions,
  stickyCopied,
  onCopyJson,
  onDownloadReport,
  headerText,
  onScroll,
  onOpenSidebar
}) => {
  return (
    <div 
      ref={scrollContainerRef}
      onScroll={onScroll}
      className="flex-1 bg-zinc-50 dark:bg-[#09090b] h-full overflow-y-auto relative custom-scrollbar transition-colors duration-300"
    >
      {!analysis && appState === AppState.IDLE ? (
        <div className="h-full flex flex-col items-center justify-center text-zinc-600">
          <div className="md:hidden absolute top-6 left-6">
            <button 
                onClick={onOpenSidebar} 
                className="p-2 -ml-2 text-zinc-500 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <Menu size={24} />
            </button>
          </div>
          <div className="w-16 h-16 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center mb-6 relative transition-colors">
            <CornerAccents className="border-zinc-300 dark:border-zinc-700" />
            <Sparkles size={24} className="text-zinc-400 dark:text-zinc-600" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">System Ready</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-700 mt-2">Awaiting Input Stream</p>
        </div>
      ) : (
        <div className="p-8 max-w-4xl mx-auto min-h-full">
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-zinc-50/95 dark:bg-[#09090b]/95 backdrop-blur z-20 py-4 border-b border-zinc-200 dark:border-zinc-800 transition-all">
              {/* Left Side: Title + Action Buttons */}
              <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                  {/* Mobile Menu Button */}
                  <button 
                    onClick={onOpenSidebar} 
                    className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Menu size={20} />
                  </button>

                  <h2 className="text-xs font-mono text-zinc-600 dark:text-zinc-500 truncate max-w-md uppercase">
                     {headerText}
                  </h2>
                  
                  {/* Sticky Header Actions - Placed next to title */}
                  {showStickyActions && appState === AppState.COMPLETE && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-800"></div>
                        <button 
                            onClick={onCopyJson}
                            className={`flex items-center justify-center px-3 py-1 border transition-colors relative
                                ${stickyCopied 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900' 
                                    : 'bg-white text-zinc-500 border-zinc-200 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:text-blue-400 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/20'
                                }`}
                            title="Copy JSON"
                        >
                            <CornerAccents className={stickyCopied ? "border-emerald-300 dark:border-emerald-800" : "border-zinc-300 dark:border-zinc-700"} size="w-0.5 h-0.5" />
                            {stickyCopied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button 
                             onClick={onDownloadReport}
                             className="flex items-center justify-center px-3 py-1 border bg-white text-zinc-500 border-zinc-200 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:text-blue-400 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/20 transition-colors relative"
                             title="Download Report"
                        >
                             <CornerAccents className="border-zinc-300 dark:border-zinc-700" size="w-0.5 h-0.5" />
                             <Download size={14} />
                        </button>
                    </div>
                  )}
              </div>

              {/* Right Side: Status Badge */}
              <div className="flex items-center gap-2 shrink-0">
                 {appState === AppState.COMPLETE && (
                     <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 relative">
                        <CornerAccents className="border-emerald-300 dark:border-emerald-800" size="w-0.5 h-0.5" />
                        <CheckCircle2 size={10} />
                        <span className="hidden sm:inline">Analysis Complete</span>
                        <span className="sm:hidden">Done</span>
                     </span>
                 )}
                 {appState === AppState.ERROR && (
                     <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 px-3 py-1 bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-900 relative">
                        <CornerAccents className="border-red-300 dark:border-red-800" size="w-0.5 h-0.5" />
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
                  onReset={onReset}
                >
                    <JsonDisplay ref={jsonDisplayRef} data={analysis} />
                </ErrorBoundary>
            ) : (
                <div className="h-[400px] flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 relative transition-colors">
                    <CornerAccents className="border-zinc-300 dark:border-zinc-700" />
                    {appState === AppState.ERROR ? (
                        <div className="text-center p-6 w-full px-12">
                            <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
                            <p className="text-zinc-500 font-mono text-sm mb-6 uppercase tracking-widest">PROCESS_FAILED</p>
                            
                            {errorDetail && (
                                <div className="w-full bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/50 p-4 text-left relative group">
                                    <CornerAccents className="border-red-300 dark:border-red-900/50" />
                                    <h4 className="text-[10px] text-red-600 dark:text-red-500 font-bold uppercase tracking-widest mb-2 border-b border-red-200 dark:border-red-900/30 pb-1">Error Diagnostics</h4>
                                    <pre className="text-[10px] text-red-500 dark:text-red-400 font-mono whitespace-pre-wrap break-all leading-relaxed overflow-x-auto max-h-[300px] custom-scrollbar">
                                        {JSON.stringify(errorDetail, (key, value) => {
                                          if (value instanceof Error) {
                                            const errObj: any = {
                                              name: value.name,
                                              message: value.message,
                                              stack: value.stack
                                            };
                                            Object.getOwnPropertyNames(value).forEach(prop => {
                                              if (prop !== 'name' && prop !== 'message' && prop !== 'stack') {
                                                // @ts-ignore
                                                errObj[prop] = value[prop];
                                              }
                                            });
                                            return errObj;
                                          }
                                          return value;
                                        }, 2)}
                                    </pre>
                                </div>
                            )}
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
  );
};

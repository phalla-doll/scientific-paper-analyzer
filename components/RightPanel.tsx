import React from 'react';
import { Sparkles, Copy, Download, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { JsonDisplay, JsonDisplayRef } from './JsonDisplay';
import { ErrorBoundary } from './ErrorBoundary';
import { AnalysisLoader } from './AnalysisLoader';
import { CornerAccents } from './CornerAccents';
import { AppState, PaperAnalysis } from '../types';

interface RightPanelProps {
  appState: AppState;
  analysis: PaperAnalysis | null;
  onReset: () => void;
  jsonDisplayRef: React.RefObject<JsonDisplayRef>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  showStickyActions: boolean;
  stickyCopied: boolean;
  onCopyJson: () => void;
  onDownloadReport: () => void;
  headerText: string;
  onScroll: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  appState,
  analysis,
  onReset,
  jsonDisplayRef,
  scrollContainerRef,
  showStickyActions,
  stickyCopied,
  onCopyJson,
  onDownloadReport,
  headerText,
  onScroll
}) => {
  return (
    <div 
      ref={scrollContainerRef}
      onScroll={onScroll}
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
              {/* Left Side: Title + Action Buttons */}
              <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                  <h2 className="text-xs font-mono text-zinc-500 truncate max-w-md uppercase">
                     {headerText}
                  </h2>
                  
                  {/* Sticky Header Actions - Placed next to title */}
                  {showStickyActions && appState === AppState.COMPLETE && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                        <div className="w-px h-4 bg-zinc-800"></div>
                        <button 
                            onClick={onCopyJson}
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
                             onClick={onDownloadReport}
                             className="flex items-center justify-center px-3 py-1 border bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-950/20 transition-colors relative"
                             title="Download Report"
                        >
                             <CornerAccents className="border-zinc-700" size="w-0.5 h-0.5" />
                             <Download size={14} />
                        </button>
                    </div>
                  )}
              </div>

              {/* Right Side: Status Badge */}
              <div className="flex items-center gap-2 shrink-0">
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
                  onReset={onReset}
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
  );
};
import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AppState } from '../types';

interface AnalysisLoaderProps {
  appState: AppState;
}

export const AnalysisLoader: React.FC<AnalysisLoaderProps> = ({ appState }) => {
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
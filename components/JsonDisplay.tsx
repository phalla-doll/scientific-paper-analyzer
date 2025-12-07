import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { PaperAnalysis, FigureData, DataPoint, MethodologyStage } from '../types';
import { trackEvent } from '../services/analytics';
import { 
  Copy, Check, BarChart3, ImageIcon, ScanEye, ArrowRight, Microscope, Activity, 
  FlaskConical, Binary, Layers, PenTool, Beaker, Download, Workflow, Settings2, Cpu,
  FileText
} from 'lucide-react';
import { CornerAccents } from './CornerAccents';

export interface JsonDisplayRef {
  copyJson: () => Promise<void>;
  downloadReport: () => void;
}

interface JsonDisplayProps {
  data: PaperAnalysis;
}

export const JsonDisplay = forwardRef<JsonDisplayRef, JsonDisplayProps>(({ data }, ref) => {
  const [copied, setCopied] = useState(false);
  const [rawCopied, setRawCopied] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      trackEvent('copy_json_output', { paper_title: data.paper_title });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setRawCopied(true);
      trackEvent('copy_raw_output');
      setTimeout(() => setRawCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopySummary = async () => {
    try {
      const summaryText = `Hypothesis: ${data.core_hypothesis}\n\nKey Findings: ${data.key_results.join('; ')}\n\nConclusion: ${data.conclusions}`;
      await navigator.clipboard.writeText(summaryText);
      setSummaryCopied(true);
      trackEvent('copy_summary_text', { paper_title: data.paper_title });
      setTimeout(() => setSummaryCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    trackEvent('download_markdown_report', { paper_title: data.paper_title });
    const { paper_title, core_hypothesis, methodology_summary, methodology_steps, key_results, conclusions, limitations, figures_data } = data;
    
    let mdContent = `# ${paper_title}\n\n`;
    mdContent += `## Core Hypothesis\n${core_hypothesis}\n\n`;
    mdContent += `## Methodology\n${methodology_summary}\n\n`;
    
    if (methodology_steps && methodology_steps.length > 0) {
      mdContent += `### Experimental Phases\n`;
      methodology_steps.forEach((stage, idx) => {
        mdContent += `#### ${idx + 1}. ${stage.stage_name}\n`;
        stage.steps.forEach(step => mdContent += `- ${step}\n`);
        mdContent += `\n`;
      });
    }
    
    mdContent += `## Key Results\n`;
    key_results.forEach((res, idx) => mdContent += `${idx + 1}. ${res}\n`);
    mdContent += `\n`;

    mdContent += `## Conclusions\n${conclusions}\n\n`;
    mdContent += `## Limitations\n${limitations}\n\n`;
    
    mdContent += `## Figures & Data\n`;
    (figures_data as any[]).forEach((fig, idx) => {
        if (typeof fig === 'string') {
            mdContent += `- ${fig}\n`;
        } else {
            mdContent += `### Figure ${idx + 1}: ${fig.caption || 'Untitled'}\n`;
            mdContent += `**Type:** ${fig.type} | **Purpose:** ${fig.purpose}\n\n`;
            mdContent += `**Findings:**\n`;
            if (Array.isArray(fig.findings)) {
                 fig.findings.forEach((f: string) => mdContent += `- ${f}\n`);
            } else {
                 mdContent += `${fig.findings}\n`;
            }
            if (fig.data_points && fig.data_points.length > 0) {
                mdContent += `\n**Extracted Data:**\n`;
                const values = fig.data_points.map((p: any) => p.value);
                const maxVal = Math.max(...values, 0) || 1;
                const maxLabelWidth = Math.max(...fig.data_points.map((p: any) => p.label.length), 10);
                mdContent += "```text\n";
                fig.data_points.forEach((dp: any) => {
                    const barLen = Math.floor((dp.value / maxVal) * 20);
                    const bar = '█'.repeat(barLen).padEnd(20, '░');
                    mdContent += `${dp.label.padEnd(maxLabelWidth)} | ${bar} ${dp.value}${dp.unit ? ' ' + dp.unit : ''}\n`;
                });
                mdContent += "```\n";
            }
            mdContent += `\n---\n\n`;
        }
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper_title.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 50)}_analysis.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useImperativeHandle(ref, () => ({
    copyJson: handleCopy,
    downloadReport: handleDownload
  }));

  const renderDataChart = (points: DataPoint[]) => {
    if (!points || points.length === 0) return null;
    
    const validPoints = points.filter(p => typeof p.value === 'number');
    if (validPoints.length === 0) return null;

    const values = validPoints.map(p => p.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const positives = values.filter(v => v > 0);
    const minPositive = positives.length > 0 ? Math.min(...positives) : 0.0001;

    const rangeRatio = minPositive > 0 ? maxValue / minPositive : 0;
    const useLogScale = minValue >= 0 && rangeRatio > 1000;
    
    const maxBarChars = 24;
    
    return (
      <div className="mt-5 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800/50">
        <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={12} className="text-blue-500" /> 
            Data Distribution
            </h4>
            {useLogScale && (
                <span className="text-[9px] font-mono text-blue-500 border border-blue-200 px-1.5 py-0.5 bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:bg-blue-950/20">
                    LOG SCALE
                </span>
            )}
        </div>
        
        <div className="font-mono text-xs bg-zinc-50 dark:bg-zinc-950/50 p-4 border border-zinc-200 dark:border-zinc-800/80 relative transition-colors">
          <CornerAccents className="border-zinc-300 dark:border-zinc-700" size="w-1 h-1" />
          
          <div className="space-y-1">
            {validPoints.map((p, idx) => {
              let ratio = 0;
              if (useLogScale && p.value > 0) {
                 const logMin = Math.log10(minPositive);
                 const logMax = Math.log10(maxValue);
                 const logVal = Math.log10(p.value);
                 const norm = logMax === logMin ? 1 : (logVal - logMin) / (logMax - logMin);
                 ratio = 0.1 + (0.9 * norm); 
              } else {
                 ratio = maxValue !== 0 ? p.value / maxValue : 0;
              }
              ratio = Math.max(0, Math.min(1, ratio));

              const filledCount = Math.round(ratio * maxBarChars);
              const emptyCount = maxBarChars - filledCount;
              const filled = '█'.repeat(filledCount);
              const empty = '░'.repeat(Math.max(0, emptyCount));

              return (
                <div key={idx} className="flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-900 py-0.5 transition-colors group">
                   <div className="w-24 text-right shrink-0 border-r border-zinc-200 dark:border-zinc-800 pr-3 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 transition-colors">
                     <span className="text-zinc-500 dark:text-zinc-400 truncate block" title={p.label}>{p.label}</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="relative" title={`${p.value} ${p.unit || ''}`}>
                        <span className="text-blue-600 dark:text-blue-500 tracking-tighter select-none drop-shadow-[0_0_8px_rgba(37,99,235,0.2)] dark:drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">{filled}</span>
                        <span className="text-zinc-300 dark:text-zinc-800 tracking-tighter select-none">{empty}</span>
                     </div>
                     <span className="text-zinc-700 dark:text-zinc-300 font-bold tabular-nums">
                        {p.value}
                        {p.unit && <span className="text-[10px] text-zinc-500 dark:text-zinc-600 ml-1 font-normal">{p.unit}</span>}
                     </span>
                   </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-2 text-[9px] text-zinc-500 dark:text-zinc-600 font-mono">
            <div className="w-24 shrink-0 pr-3 text-right opacity-0">Labels</div>
            <div className="flex justify-between w-[20ch] tracking-tighter px-[1px]">
               <span>{useLogScale ? minPositive.toExponential(0) : 0}</span>
               <span className="opacity-50">
                  {useLogScale 
                    ? Math.pow(10, (Math.log10(minPositive) + Math.log10(maxValue)) / 2).toExponential(0)
                    : Math.round(maxValue / 2)
                  }
               </span>
               <span>{useLogScale ? maxValue.toExponential(0) : maxValue}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getPhaseIcon = (stageName: string) => {
    const lower = stageName.toLowerCase();
    if (lower.includes('syn') || lower.includes('prep') || lower.includes('fabric') || lower.includes('material') || lower.includes('grow')) return <FlaskConical size={18} />;
    if (lower.includes('charac') || lower.includes('imag') || lower.includes('micro') || lower.includes('spec') || lower.includes('scan')) return <Microscope size={18} />;
    if (lower.includes('analy') || lower.includes('data') || lower.includes('stat')) return <Activity size={18} />;
    if (lower.includes('simul') || lower.includes('model') || lower.includes('theor') || lower.includes('comput')) return <Cpu size={18} />;
    if (lower.includes('setup') || lower.includes('config') || lower.includes('design') || lower.includes('build')) return <Settings2 size={18} />;
    if (lower.includes('measure') || lower.includes('test') || lower.includes('eval') || lower.includes('perf')) return <ScanEye size={18} />;
    return <Layers size={18} />;
  };

  return (
    <div className="space-y-8 font-sans text-zinc-700 dark:text-zinc-300 tracking-wide transition-colors">
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight uppercase text-zinc-900 dark:text-zinc-100">{data.paper_title}</h2>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleCopy}
                className={`group relative flex items-center gap-2 text-xs font-medium transition-all border px-4 py-2 uppercase tracking-wide
                  ${copied 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900' 
                    : 'bg-white text-zinc-500 border-zinc-200 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:text-blue-400 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/20'
                  }`}
                title="Copy JSON to clipboard"
              >
                <CornerAccents className={copied ? "border-emerald-300 dark:border-emerald-800" : "border-zinc-300 dark:border-zinc-700 group-hover:border-blue-300 dark:group-hover:border-blue-500/50"} size="w-1 h-1"/>
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? 'COPIED' : 'COPY JSON'}
              </button>

              <button 
                onClick={handleDownload}
                className="group relative flex items-center gap-2 text-xs font-medium transition-all border px-4 py-2 bg-white text-zinc-500 border-zinc-200 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:text-blue-400 dark:hover:border-blue-500/50 dark:hover:bg-blue-950/20 uppercase tracking-wide"
                title="Download Analysis Report (.md)"
              >
                <CornerAccents className="border-zinc-300 dark:border-zinc-700 group-hover:border-blue-300 dark:group-hover:border-blue-500/50" size="w-1 h-1"/>
                <Download size={14} />
                EXPORT REPORT
              </button>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-blue-600"></div>
        <h1 className="text-lg font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">Analysis Result</h1>
      </div>

      <section className="relative">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-2">Core Hypothesis Detail</h3>
        <div className="bg-white dark:bg-zinc-900/50 border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 py-2 text-zinc-800 dark:text-zinc-200 leading-relaxed text-sm md:text-base">
          {data.core_hypothesis}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-4">Methodology</h3>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8 border-l-2 border-transparent pl-4">
          {data.methodology_summary}
        </p>
        
        {data.methodology_steps && data.methodology_steps.length > 0 && (
          <div className="relative pl-2">
            <div className="absolute top-0 bottom-0 left-[19px] w-px bg-zinc-200 dark:bg-zinc-800"></div>
            
            <div className="space-y-8">
              {data.methodology_steps.map((stage, index) => (
                <div key={index} className="relative flex gap-6 group">
                  <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-blue-600 dark:text-blue-500 flex items-center justify-center z-10 shadow-sm group-hover:border-blue-300 dark:group-hover:border-blue-500/50 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-all">
                    {getPhaseIcon(stage.stage_name)}
                  </div>
                  
                  <div className="flex-1 pt-1">
                    <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <span className="text-blue-600 dark:text-blue-500 font-mono text-xs">0{index + 1}</span>
                      {stage.stage_name}
                    </h4>
                    <div className="relative bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-5 hover:border-blue-300 dark:hover:border-blue-900 transition-colors">
                      <CornerAccents className="border-zinc-300 dark:border-zinc-800 group-hover:border-blue-300 dark:group-hover:border-blue-900" />
                      <ul className="space-y-2.5">
                        {stage.steps.map((step, sIdx) => (
                          <li key={sIdx} className="text-sm text-zinc-600 dark:text-zinc-400 leading-snug flex gap-3 items-start">
                             <div className="w-1 h-1 bg-blue-600 dark:bg-blue-500 mt-2 shrink-0"></div>
                             <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-4">Key Results</h3>
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-6 relative">
          <CornerAccents className="border-zinc-300 dark:border-zinc-700" />
          <ul className="space-y-3">
            {data.key_results.map((result, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-50 border border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400 flex items-center justify-center text-xs font-mono font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{result}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-5">
          <CornerAccents className="border-zinc-300 dark:border-zinc-700" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-3 flex items-center gap-2">
            <span className="w-1 h-1 bg-zinc-400 dark:bg-zinc-600"></span> Conclusions
          </h3>
          <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">{data.conclusions}</p>
        </div>
        <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 p-5">
           <CornerAccents className="border-zinc-300 dark:border-zinc-700" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-3 flex items-center gap-2">
            <span className="w-1 h-1 bg-zinc-400 dark:bg-zinc-600"></span> Limitations
          </h3>
          <p className="text-sm italic text-zinc-500 dark:text-zinc-500 leading-relaxed">
            {data.limitations}
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-4">Figures & Data Visualization</h3>
        <div className="grid grid-cols-1 gap-6">
          {(data.figures_data as any[]).map((fig: FigureData | string, idx: number) => {
             if (typeof fig === 'string') {
                 return (
                    <div key={idx} className="border border-zinc-200 dark:border-zinc-800 p-3 text-sm text-zinc-500 font-mono">
                        {fig}
                    </div>
                 )
             }
             
             const typeLower = fig.type?.toLowerCase() || '';
             const isMicrograph = typeLower.includes('micrograph') || typeLower.includes('microscop') || typeLower.includes('tem') || typeLower.includes('sem') || typeLower.includes('afm');
             const isChart = typeLower.includes('chart') || typeLower.includes('plot') || typeLower.includes('graph') || typeLower.includes('spectrum') || typeLower.includes('spectra') || typeLower.includes('histogram') || (fig.data_points && fig.data_points.length > 0);
             const isDiagram = typeLower.includes('diagram') || typeLower.includes('schematic') || typeLower.includes('illustration') || typeLower.includes('mechanism') || typeLower.includes('model') || typeLower.includes('flow');

             let IconComponent = ImageIcon;
             let iconStyles = "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50";
             let badgeStyles = "text-rose-600 border-rose-200 bg-rose-50 dark:text-rose-400 dark:border-rose-900/50 dark:bg-rose-950/20";
             
             if (isMicrograph) {
                 IconComponent = Microscope;
                 iconStyles = "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50";
                 badgeStyles = "text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900/50 dark:bg-emerald-950/20";
             } else if (isChart) {
                 IconComponent = BarChart3;
                 iconStyles = "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50";
                 badgeStyles = "text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:bg-blue-950/20";
             } else if (isDiagram) {
                 IconComponent = Workflow;
                 iconStyles = "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50";
                 badgeStyles = "text-orange-600 border-orange-200 bg-orange-50 dark:text-orange-400 dark:border-orange-900/50 dark:bg-orange-950/20";
             }

             return (
                <div key={idx} className="group relative bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-6 transition-all duration-200 hover:border-zinc-400 dark:hover:border-zinc-600">
                    <CornerAccents className="border-zinc-300 dark:border-zinc-800 group-hover:border-zinc-400 dark:group-hover:border-zinc-600" />
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div className="flex items-start gap-4">
                           <div className={`p-2.5 shrink-0 border ${iconStyles}`}>
                             <IconComponent size={20} />
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-semibold text-zinc-900 dark:text-zinc-200 text-base leading-tight font-mono uppercase">
                                {fig.caption || `Figure ${idx + 1}`}
                              </h4>
                              <p className="text-xs text-zinc-500 font-normal leading-normal uppercase tracking-wide">
                                {fig.purpose}
                              </p>
                           </div>
                        </div>
                        <span className={`shrink-0 text-[10px] uppercase font-medium tracking-widest px-3 py-1 border ${badgeStyles}`}>
                          {fig.type}
                        </span>
                    </div>
                    
                    <div className="pl-0 sm:pl-14">
                      <div className="mb-4">
                         <div className="flex items-center gap-2 mb-2">
                            <ScanEye size={14} className="text-zinc-500 dark:text-zinc-600" />
                            <span className="text-[10px] font-bold uppercase text-zinc-500 dark:text-zinc-600 tracking-widest">Findings</span>
                         </div>
                         {Array.isArray(fig.findings) ? (
                            <ul className="space-y-1.5">
                              {fig.findings.map((finding: string, fIdx: number) => (
                                <li key={fIdx} className="text-sm text-zinc-600 dark:text-zinc-400 flex gap-2 items-start">
                                  <ArrowRight size={14} className="mt-1 text-zinc-400 dark:text-zinc-700 shrink-0" />
                                  <span>{finding}</span>
                                </li>
                              ))}
                            </ul>
                         ) : (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{(fig as any).observation || (fig as any).findings}</p>
                         )}
                      </div>
                      
                      {renderDataChart(fig.data_points || [])}
                    </div>
                </div>
             );
          })}
        </div>
      </section>

      <section className="relative mt-2 mb-6">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 flex items-center gap-2">
                <FileText size={14} /> Executive Summary
            </h3>
            <button 
                onClick={handleCopySummary}
                className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-blue-600 dark:text-zinc-600 dark:hover:text-blue-400 transition-colors"
                title="Copy Summary"
            >
                {summaryCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span className={summaryCopied ? "text-emerald-500" : ""}>{summaryCopied ? "COPIED" : "COPY"}</span>
            </button>
        </div>
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-5 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed relative hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <CornerAccents className="border-zinc-300 dark:border-zinc-700" />
            <p>
                <span className="text-blue-600 dark:text-blue-400 font-bold uppercase text-[10px] tracking-wider mr-2">Hypothesis</span> 
                {data.core_hypothesis}
            </p>
            <p className="mt-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold uppercase text-[10px] tracking-wider mr-2">Key Findings</span> 
                {data.key_results.join('; ')}
            </p>
            <p className="mt-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold uppercase text-[10px] tracking-wider mr-2">Conclusion</span> 
                {data.conclusions}
            </p>
        </div>
      </section>

      <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-600">Raw Data Stream</h3>
          <button 
            onClick={handleCopyRaw}
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-blue-600 dark:text-zinc-600 dark:hover:text-blue-400 transition-colors"
            title="Copy Raw Data"
          >
            {rawCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            <span className={rawCopied ? "text-emerald-500" : ""}>{rawCopied ? "COPIED" : "COPY"}</span>
          </button>
        </div>
        <pre className="bg-zinc-100 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-500 p-4 overflow-x-auto text-[10px] font-mono leading-tight">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
});

JsonDisplay.displayName = 'JsonDisplay';
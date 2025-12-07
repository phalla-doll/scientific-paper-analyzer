import React, { useState } from 'react';
import { PaperAnalysis, FigureData, DataPoint, MethodologyStage } from '../types';
import { 
  Copy, Check, LineChart, ImageIcon, ScanEye, ArrowRight, Microscope, Activity, 
  FlaskConical, Binary, Layers, PenTool, Beaker, Download, Workflow, Settings2, Cpu
} from 'lucide-react';

interface JsonDisplayProps {
  data: PaperAnalysis;
}

// Reusable Corner Accent Component for that "Tech/HUD" look
const CornerAccents = ({ color = "border-gray-300", size = "w-1.5 h-1.5" }) => (
  <>
    <div className={`absolute top-0 left-0 ${size} border-l border-t ${color}`} />
    <div className={`absolute top-0 right-0 ${size} border-r border-t ${color}`} />
    <div className={`absolute bottom-0 left-0 ${size} border-l border-b ${color}`} />
    <div className={`absolute bottom-0 right-0 ${size} border-r border-b ${color}`} />
  </>
);

export const JsonDisplay: React.FC<JsonDisplayProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
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
                
                // Generate ASCII Bar Chart for Markdown
                const maxVal = Math.max(...fig.data_points.map((p: any) => p.value));
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

  const renderDataChart = (points: DataPoint[]) => {
    if (!points || points.length === 0) return null;
    
    // Find max value for scaling
    const maxValue = Math.max(...points.map(p => p.value));
    const maxBarChars = 20;
    
    return (
      <div className="mt-4 pt-3 border-t border-gray-100">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Activity size={12} className="text-blue-600" /> 
          Data Distribution
        </h4>
        <div className="font-mono text-xs bg-gray-50 p-4 border border-gray-200 overflow-x-auto relative">
          <CornerAccents color="border-gray-300" size="w-1 h-1" />
          {points.map((p, idx) => {
            const filledCount = Math.max(0, Math.round((p.value / maxValue) * maxBarChars));
            const emptyCount = Math.max(0, maxBarChars - filledCount);
            const filled = '█'.repeat(filledCount);
            const empty = '░'.repeat(emptyCount);

            return (
              <div key={idx} className="flex items-center gap-3 leading-relaxed hover:bg-gray-100 px-1 -mx-1 transition-colors">
                 <span className="w-24 truncate text-gray-500 text-right shrink-0" title={p.label}>{p.label}</span>
                 <span className="text-blue-600 tracking-tight select-none">
                    {filled}
                    <span className="text-gray-300">{empty}</span>
                 </span>
                 <span className="shrink-0 text-gray-900 font-semibold tabular-nums">
                    {p.value}
                    {p.unit && <span className="text-[10px] text-gray-400 ml-0.5 font-normal">{p.unit}</span>}
                 </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getPhaseIcon = (stageName: string) => {
    const lower = stageName.toLowerCase();
    
    // Synthesis / Materials / Preparation
    if (lower.includes('syn') || lower.includes('prep') || lower.includes('fabric') || lower.includes('material') || lower.includes('grow')) {
      return <FlaskConical size={18} />;
    }
    
    // Characterization / Microscopy / Imaging
    if (lower.includes('charac') || lower.includes('imag') || lower.includes('micro') || lower.includes('spec') || lower.includes('scan')) {
      return <Microscope size={18} />;
    }
    
    // Data Analysis / Statistics
    if (lower.includes('analy') || lower.includes('data') || lower.includes('stat')) {
      return <Activity size={18} />;
    }
    
    // Simulation / Modeling / Theory / Computation
    if (lower.includes('simul') || lower.includes('model') || lower.includes('theor') || lower.includes('comput')) {
      return <Cpu size={18} />;
    }
    
    // Experimental Setup / Design / Configuration
    if (lower.includes('setup') || lower.includes('config') || lower.includes('design') || lower.includes('build')) {
      return <Settings2 size={18} />;
    }

    // Measurements / Testing / Evaluation
    if (lower.includes('measure') || lower.includes('test') || lower.includes('eval') || lower.includes('perf')) {
      return <ScanEye size={18} />;
    }

    // Default Fallback
    return <Layers size={18} />;
  };

  return (
    <div className="space-y-8 font-sans text-gray-800">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight uppercase">{data.paper_title}</h2>
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleCopy}
                className={`group relative flex items-center gap-2 text-xs font-medium transition-all border px-4 py-2 uppercase tracking-wide
                  ${copied 
                    ? 'bg-green-50 text-green-700 border-green-300' 
                    : 'bg-white text-gray-600 border-gray-300 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                title="Copy JSON to clipboard"
              >
                <CornerAccents color={copied ? "border-green-400" : "border-gray-400 group-hover:border-blue-400"} size="w-1 h-1"/>
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? 'COPIED' : 'COPY JSON'}
              </button>

              <button 
                onClick={handleDownload}
                className="group relative flex items-center gap-2 text-xs font-medium transition-all border px-4 py-2 bg-white text-gray-600 border-gray-300 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 uppercase tracking-wide"
                title="Download Analysis Report (.md)"
              >
                <CornerAccents color="border-gray-400 group-hover:border-blue-400" size="w-1 h-1"/>
                <Download size={14} />
                EXPORT REPORT
              </button>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-blue-600"></div>
        <h1 className="text-lg font-bold text-gray-400 uppercase tracking-widest">Analysis Result</h1>
      </div>

      <section className="relative">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Core Hypothesis</h3>
        <div className="bg-white border-l-2 border-gray-200 pl-4 py-2 text-gray-800 leading-relaxed text-sm md:text-base">
          {data.core_hypothesis}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Methodology</h3>
        <p className="text-gray-700 leading-relaxed mb-8 border-l-2 border-transparent pl-4">
          {data.methodology_summary}
        </p>
        
        {data.methodology_steps && data.methodology_steps.length > 0 && (
          <div className="relative pl-2">
            <div className="absolute top-0 bottom-0 left-[19px] w-px bg-gray-200"></div>
            
            <div className="space-y-8">
              {data.methodology_steps.map((stage, index) => (
                <div key={index} className="relative flex gap-6 group">
                  {/* Phase Icon - Square now */}
                  <div className="flex-shrink-0 w-10 h-10 bg-white border border-blue-200 text-blue-500 flex items-center justify-center z-10 shadow-sm group-hover:border-blue-500 group-hover:text-blue-600 transition-all">
                    {getPhaseIcon(stage.stage_name)}
                  </div>
                  
                  {/* Phase Content */}
                  <div className="flex-1 pt-1">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                      <span className="text-blue-400 font-mono text-xs">0{index + 1}</span>
                      {stage.stage_name}
                    </h4>
                    <div className="relative bg-white border border-gray-200 p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] hover:border-blue-300 transition-colors">
                      <CornerAccents color="border-gray-200 group-hover:border-blue-300" />
                      <ul className="space-y-2.5">
                        {stage.steps.map((step, sIdx) => (
                          <li key={sIdx} className="text-sm text-gray-700 leading-snug flex gap-3 items-start">
                             <div className="w-1 h-1 bg-blue-400 mt-2 shrink-0"></div>
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
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Key Results</h3>
        <div className="border border-gray-200 bg-white p-6 relative">
          <CornerAccents />
          <ul className="space-y-3">
            {data.key_results.map((result, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-xs font-mono font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-gray-700 leading-relaxed">{result}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative border border-gray-200 bg-white p-5">
          <CornerAccents />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-1 h-1 bg-gray-400"></span> Conclusions
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">{data.conclusions}</p>
        </div>
        <div className="relative border border-gray-200 bg-white p-5">
           <CornerAccents />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <span className="w-1 h-1 bg-gray-400"></span> Limitations
          </h3>
          <p className="text-gray-700 text-sm italic text-gray-500 leading-relaxed">
            {data.limitations}
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Figures & Data Visualization</h3>
        <div className="grid grid-cols-1 gap-6">
          {(data.figures_data as any[]).map((fig: FigureData | string, idx: number) => {
             if (typeof fig === 'string') {
                 return (
                    <div key={idx} className="border border-gray-200 p-3 text-sm text-gray-600 font-mono">
                        {fig}
                    </div>
                 )
             }
             
             const hasDataPoints = fig.data_points && fig.data_points.length > 0;
             const typeLower = fig.type?.toLowerCase() || '';
             
             const isMicrograph = typeLower.includes('micrograph') || typeLower.includes('microscop') || typeLower.includes('tem') || typeLower.includes('sem') || typeLower.includes('afm');
             const isChart = typeLower.includes('chart') || typeLower.includes('plot') || typeLower.includes('graph') || typeLower.includes('spectrum') || typeLower.includes('spectra') || typeLower.includes('histogram') || hasDataPoints;
             const isDiagram = typeLower.includes('diagram') || typeLower.includes('schematic') || typeLower.includes('illustration') || typeLower.includes('mechanism') || typeLower.includes('model') || typeLower.includes('flow');

             let IconComponent = ImageIcon;
             let iconStyles = "bg-purple-50 text-purple-600 border-purple-200";
             let badgeStyles = "text-purple-700 border-purple-200 bg-purple-50";
             
             if (isMicrograph) {
                 IconComponent = Microscope;
                 iconStyles = "bg-emerald-50 text-emerald-600 border-emerald-200";
                 badgeStyles = "text-emerald-700 border-emerald-200 bg-emerald-50";
             } else if (isChart) {
                 IconComponent = LineChart;
                 iconStyles = "bg-blue-50 text-blue-600 border-blue-200";
                 badgeStyles = "text-blue-700 border-blue-200 bg-blue-50";
             } else if (isDiagram) {
                 IconComponent = Workflow;
                 iconStyles = "bg-orange-50 text-orange-600 border-orange-200";
                 badgeStyles = "text-orange-700 border-orange-200 bg-orange-50";
             }

             return (
                <div key={idx} className="group relative bg-white border border-gray-200 p-6 transition-all duration-200 hover:border-gray-300">
                    <CornerAccents color="border-gray-200 group-hover:border-gray-400" />
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div className="flex items-start gap-4">
                           <div className={`p-2.5 shrink-0 border ${iconStyles}`}>
                             <IconComponent size={20} />
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-semibold text-gray-900 text-base leading-tight font-mono uppercase">
                                {fig.caption || `Figure ${idx + 1}`}
                              </h4>
                              <p className="text-xs text-gray-500 font-normal leading-normal uppercase tracking-wide">
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
                            <ScanEye size={14} className="text-gray-400" />
                            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Findings</span>
                         </div>
                         {Array.isArray(fig.findings) ? (
                            <ul className="space-y-1.5">
                              {fig.findings.map((finding: string, fIdx: number) => (
                                <li key={fIdx} className="text-sm text-gray-700 flex gap-2 items-start">
                                  <ArrowRight size={14} className="mt-1 text-gray-300 shrink-0" />
                                  <span>{finding}</span>
                                </li>
                              ))}
                            </ul>
                         ) : (
                            <p className="text-sm text-gray-700 leading-relaxed">{(fig as any).observation || (fig as any).findings}</p>
                         )}
                      </div>
                      
                      {renderDataChart(fig.data_points || [])}
                    </div>
                </div>
             );
          })}
        </div>
      </section>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Raw Data Stream</h3>
        <pre className="bg-gray-50 border border-gray-200 text-gray-600 p-4 overflow-x-auto text-[10px] font-mono leading-tight">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};
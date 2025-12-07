export interface DataPoint {
  label: string;
  value: number;
  unit?: string;
}

export interface FigureData {
  caption: string;
  type: string;
  purpose: string;
  findings: string[];
  data_points?: DataPoint[];
}

export interface MethodologyStage {
  stage_name: string;
  steps: string[];
}

export interface PaperAnalysis {
  paper_title: string;
  core_hypothesis: string;
  methodology_summary: string;
  methodology_steps: MethodologyStage[];
  key_results: string[];
  conclusions: string;
  limitations: string;
  figures_data: FigureData[] | string[]; 
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING_PDF = 'PROCESSING_PDF',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
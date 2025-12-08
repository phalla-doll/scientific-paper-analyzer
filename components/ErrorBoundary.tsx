import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { CornerAccents } from './CornerAccents';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary [${this.props.componentName}] caught error:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="relative w-full border border-red-900 bg-red-950/10 p-8 flex flex-col items-center justify-center text-center min-h-[250px] animate-in fade-in zoom-in-95 duration-300 backdrop-blur-sm my-4">
          <CornerAccents className="border-red-800" />
          
          <div className="w-12 h-12 bg-red-900/20 flex items-center justify-center mb-4 relative">
             <CornerAccents className="border-red-600" size="w-1 h-1" />
             <AlertCircle size={24} className="text-red-500" />
          </div>

          <h3 className="text-red-500 font-mono font-bold uppercase tracking-widest text-sm mb-2">
            Rendering Fault
          </h3>
          
          <p className="text-red-400/70 text-xs font-mono mb-6 max-w-sm uppercase tracking-wide">
             Module [{this.props.componentName || 'UNKNOWN_COMPONENT'}] encountered a critical exception.
          </p>

          {this.state.error && (
             <div className="w-full max-w-md bg-black/50 border border-red-900/50 p-3 mb-6 text-left overflow-hidden">
                <p className="font-mono text-[10px] text-red-400 break-all leading-relaxed line-clamp-4">
                   Error: {this.state.error.message}
                </p>
             </div>
          )}

          <button
            onClick={this.handleReset}
            className="group relative px-6 py-2 bg-zinc-900 border border-red-900/50 hover:border-red-500 hover:bg-red-950/20 transition-all cursor-pointer"
          >
            <CornerAccents className="border-red-900 group-hover:border-red-500" size="w-1 h-1" />
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest">
                <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                <span>Reset Module</span>
            </div>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
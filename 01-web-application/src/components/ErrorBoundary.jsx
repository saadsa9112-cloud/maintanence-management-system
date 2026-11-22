import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
          <div className="backdrop-blur-xl bg-white/95 border border-rose-200 p-8 rounded-3xl shadow-2xl max-w-2xl w-full text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto border border-rose-500/20 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Something went wrong in this view
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              A temporary rendering glitch occurred. Click the button below to recover immediately without losing your saved records.
            </p>

            {this.state.error && (
              <div className="text-left bg-rose-50 border border-rose-200 rounded-xl p-3 my-3 overflow-x-auto text-xs font-mono text-rose-800">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-[10px] mt-2 whitespace-pre-wrap text-slate-600 max-h-48 overflow-y-auto">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload View</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
              >
                Refresh App
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

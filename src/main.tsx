import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Root application render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-white mb-2">
              เกิดข้อผิดพลาดในการโหลดระบบ
            </h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              ระบบไม่สามารถแสดงผลได้ กรุณาลองรีเฟรชหน้าเว็บ หรือล้างข้อมูลเซสชัน
            </p>
            {this.state.error && (
              <pre className="text-[11px] bg-slate-950/80 text-rose-300 p-3 rounded-xl overflow-x-auto text-left mb-4 font-mono">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                รีเฟรชหน้าเว็บ
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('hospital_session_user');
                    sessionStorage.clear();
                  } catch {}
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                ล้างเซสชันแล้วเริ่มใหม่
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}

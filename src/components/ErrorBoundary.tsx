import React from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'เกิดข้อผิดพลาดในการแสดงผล' };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught Error in UI:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.removeItem('academic_app_current_user_v2');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 text-center space-y-5">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-slate-900">เกิดข้อผิดพลาดในการโหลดหน้าเว็บ</h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                ระบบตรวจพบข้อผิดพลาดชั่วคราว คุณสามารถกดปุ่มด้านล่างเพื่อโหลดหน้าเว็บใหม่และทำงานต่อได้ทันที
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" /> โหลดหน้าเว็บใหม่
              </button>
              
              <button
                onClick={this.handleResetAndReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-4 h-4" /> กลับสู่หน้าแรก
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

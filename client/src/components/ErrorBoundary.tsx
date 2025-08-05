import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string; // エラーバウンダリの名前（デバッグ用）
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // エラーが発生したときの状態を更新
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーをログに記録 (開発時のみ)
    console.error(`Error caught by ErrorBoundary${this.props.name ? ` (${this.props.name})` : ''}:`, error);
    
    // 開発環境でのみ詳細なエラー情報をログに出力
    if (process.env.NODE_ENV === 'development') {
      console.debug('Error details:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  public render() {
    if (this.state.hasError) {
      // エラー時のフォールバックUI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-700 font-medium">エラーが発生しました</h3>
          <p className="text-red-600 text-sm mt-1">
            ページを再読み込みしてください。
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
              <p>{this.state.error.message}</p>
              <pre>{this.state.error.stack}</pre>
            </div>
          )}
          <button
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            ページを再読み込み
          </button>
        </div>
      );
    }

    // 通常のレンダリング
    return this.props.children;
  }
}

export default ErrorBoundary; 
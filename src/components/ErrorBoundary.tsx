'use client';

import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err?.message ?? '不明なエラー' };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <p className="text-4xl mb-4">⚠️</p>
            <h1 className="text-white font-bold text-xl mb-2">予期しないエラーが発生しました</h1>
            <p className="text-white/50 text-sm mb-6">
              ページを再読み込みすることで解決する場合があります。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-400 transition-colors"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

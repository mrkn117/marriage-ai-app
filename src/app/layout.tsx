import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { DiagnosisProvider } from '@/context/DiagnosisContext';
import { Header } from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: '婚活AI診断 | あなたの婚活力を診断・改善',
  description: 'AIが写真と基本情報をもとに、婚活市場での強み・弱みを辛口診断。具体的な改善策と季節連動の服装・デートプランを提案します。',
  keywords: '婚活, AI診断, マッチングアプリ, 外見診断, デートプラン, 婚活改善',
  openGraph: {
    title: '婚活AI診断',
    description: 'AIによる辛口婚活診断・改善アプリ',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-dark-900 min-h-screen">
        <AuthProvider>
          <DiagnosisProvider>
            <Header />
            <main>{children}</main>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a1025',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                },
                success: {
                  iconTheme: { primary: '#ec4899', secondary: '#fff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
              }}
            />
          </DiagnosisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

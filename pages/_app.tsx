import type { AppProps } from 'next/app'
import { AuthProvider } from '@/contexts/AuthContext'
import Layout from '@/components/ui/layout'
import { Toaster } from '@/components/ui/sonner'
import '@/styles/globals.css'

function MyApp({ Component, pageProps, router }: AppProps) {
  // ★ サイドバーを表示したくないページのパスをここに列挙します
  const noLayoutPages = [
    '/login',
    '/forgot-password',
    '/update-password',
    '/register/host',
    '/register/admin',
    '/seminars'
  ];

  // ★ 現在のページパスが、上記リストに含まれるかチェック
  const hasLayout = !noLayoutPages.includes(router.pathname);

  return (
    <AuthProvider>
      {hasLayout ? (
        // サイドバーを含む共通レイアウトを適用するページ
        <Layout>
          <Component {...pageProps} />
        </Layout>
      ) : (
        // 共通レイアウトを適用しないページ
        <Component {...pageProps} />
      )}
      <Toaster richColors />
    </AuthProvider>
  )
}

export default MyApp
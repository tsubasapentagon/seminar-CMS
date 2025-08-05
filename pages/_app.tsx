import type { AppProps } from 'next/app'
import { AuthProvider } from '@/contexts/AuthContext'
import Layout from '@/components/ui/layout'
import { Toaster } from '@/components/ui/sonner'
import Head from 'next/head'
import '@/styles/globals.css'

function MyApp({ Component, pageProps, router }: AppProps) {
  const noLayoutPages = [
    '/login',
    '/forgot-password',
    '/update-password',
    '/register/host',
    '/register/admin',
    '/seminars'
  ];

  const hasLayout = !noLayoutPages.includes(router.pathname);

  return (
    <>
      <Head>
        <title>就活戦略大全2027｜全業界・企業比較セミナー</title>
        <meta name="description" content="就活戦略大全2027｜全業界・企業比較セミナー" />
        <link rel="icon" href="https://s3-ap-northeast-1.amazonaws.com/digmedia/media/2025/07/フォルダアイコン11.png" />
      </Head>

      <AuthProvider>
        {hasLayout ? (
          <Layout>
            <Component {...pageProps} />
          </Layout>
        ) : (
          <Component {...pageProps} />
        )}
        <Toaster richColors />
      </AuthProvider>
    </>
  )
}

export default MyApp
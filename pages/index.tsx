// pages/index.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const loginUser = localStorage.getItem('loginUser')
    if (loginUser) {
      router.replace('/dashboard') // ログイン済 → ダッシュボードへ
    } else {
      router.replace('/login') // 未ログイン → ログインページへ
    }
  }, [router])

  return null
}

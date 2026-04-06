'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const code = error.message?.toLowerCase() || ''
      if (code.includes('invalid') || code.includes('credentials')) setError('Email or password is incorrect.')
      else if (code.includes('confirmed')) setError('Please confirm your email before signing in.')
      else if (code.includes('many')) setError('Too many attempts. Please wait and try again.')
      else setError('Something went wrong. Please try again.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #000; }
        .signin-wrap { min-height: 100vh; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; font-family: 'DM Sans', sans-serif; }
        .signin-card { background: #0e0e0e; border: 1px solid #222; border-radius: 8px; padding: 48px 40px; width: 100%; max-width: 440px; display: flex; flex-direction: column; align-items: center; }
        .brand-mark { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 32px; }
        .brand-name { font-family: 'Bebas Neue', sans-serif; font-size: 19px; color: #F5F5F5; letter-spacing: 0.5px; }
        .card-headline { font-family: 'Bebas Neue', sans-serif; font-size: 48px; color: #F5F5F5; line-height: 1; margin-bottom: 8px; text-align: center; }
        .card-sub { font-size: 13px; color: #666; margin-bottom: 32px; text-align: center; font-weight: 300; }
        .form { width: 100%; display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 5px; width: 100%; }
        .field-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #555; text-transform: uppercase; letter-spacing: 0.1em; }
        .field-input { background: rgba(255,255,255,0.04); border: 1px solid #222; border-radius: 4px; padding: 11px 14px; color: #F5F5F5; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; width: 100%; }
        .field-input:focus { border-color: #00CFFF; }
        .error-msg { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #FF3B3B; text-align: center; padding: 8px 12px; background: rgba(255,59,59,0.08); border: 1px solid rgba(255,59,59,0.2); border-radius: 4px; letter-spacing: 0.03em; }
        .btn-signin { background: #00CFFF; color: #000; font-family: 'Bebas Neue', sans-serif; font-size: 20px; padding: 14px; border: none; cursor: pointer; letter-spacing: 0.05em; width: 100%; border-radius: 2px; transition: opacity 0.2s; margin-top: 4px; }
        .btn-signin:hover:not(:disabled) { opacity: 0.88; }
        .btn-signin:disabled { opacity: 0.5; cursor: not-allowed; }
        .forgot { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #555; text-align: center; text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s; }
        .forgot:hover { color: #F5F5F5; }
        .divider { display: flex; align-items: center; gap: 12px; width: 100%; margin: 4px 0; }
        .divider-line { flex: 1; height: 1px; background: #222; }
        .divider-text { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #333; letter-spacing: 0.1em; }
        .signup-row { font-size: 13px; color: #666; text-align: center; font-weight: 300; }
        .signup-link { color: #00CFFF; text-decoration: none; font-weight: 400; transition: opacity 0.2s; }
        .signup-link:hover { opacity: 0.8; }
        @media(max-width:480px) { .signin-card { padding: 32px 20px; } .card-headline { font-size: 38px; } }
      `}</style>

      <div className="signin-wrap">
        <div className="signin-card">
          <div className="brand-mark">
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10C33 10 20 22 20 37C20 46 25 53 33 58L50 68L67 58C75 53 80 46 80 37C80 22 67 10 50 10Z" stroke="white" strokeWidth="7" fill="none"/>
              <path d="M50 90C67 90 80 78 80 63C80 54 75 47 67 42L50 32L33 42C25 47 20 54 20 63C20 78 33 90 50 90Z" stroke="white" strokeWidth="7" fill="none"/>
              <path d="M43 37C43 33.7 45.7 31 49 31C52.3 31 55 33.7 55 37L55 63C55 66.3 52.3 69 49 69C45.7 69 43 66.3 43 63" stroke="white" strokeWidth="5" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="brand-name">GOELEV8.AI</span>
          </div>

          <h1 className="card-headline">WELCOME BACK.</h1>
          <p className="card-sub">Sign in to your Lead Acquisition System</p>

          <form className="form" onSubmit={handleSubmit}>
            {error && <div className="error-msg">{error}</div>}
            <div className="field">
              <label className="field-label">Email Address</label>
              <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="marcus@mybusiness.com" required autoComplete="email" />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input className="field-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required autoComplete="current-password" />
            </div>
            <button className="btn-signin" type="submit" disabled={loading}>
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
            <Link href="/auth/reset-password" className="forgot">Forgot password?</Link>
            <div className="divider">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>
            <p className="signup-row">Don&apos;t have an account? <Link href="/auth/signup" className="signup-link">Start free trial →</Link></p>
          </form>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Heart, Mail, ArrowLeft, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Mode = 'login' | 'signup' | 'forgot' | 'otp'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { toast.error('Email ou senha incorretos'); return }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Conta criada! Verifique seu email para confirmar.')
  }

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Codigo enviado!')
    setMode('otp')
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email, token: otp, type: 'email',
    })
    setLoading(false)
    if (error) { toast.error('Codigo invalido ou expirado'); return }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div
            className="w-16 h-16 love-gradient rounded-2xl flex items-center justify-center mx-auto mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </motion.div>
          <h1 className="text-3xl font-black love-gradient-text">FITLOVE</h1>
          <p className="text-white/40 text-sm mt-1">Evoluindo juntos todos os dias.</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <AnimatePresence mode="wait">

            {/* LOGIN */}
            {mode === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="flex mb-6 glass rounded-xl p-1">
                  <button onClick={() => setMode('login')} className="flex-1 py-2 rounded-lg text-sm font-medium love-gradient text-white">Entrar</button>
                  <button onClick={() => setMode('signup')} className="flex-1 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-white">Criar conta</button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50 [&:-webkit-autofill]:!bg-transparent [&:-webkit-autofill]:![box-shadow:0_0_0_1000px_rgba(255,255,255,0.05)_inset] [&:-webkit-autofill]:![-webkit-text-fill-color:white]" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type={showPwd ? 'text' : 'password'} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50 [&:-webkit-autofill]:![box-shadow:0_0_0_1000px_rgba(255,255,255,0.05)_inset] [&:-webkit-autofill]:![-webkit-text-fill-color:white]" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="button" onClick={() => setMode('forgot')} className="text-pink-400/70 text-xs hover:text-pink-400 transition-colors">
                    Esqueci minha senha
                  </button>
                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                    className="w-full love-gradient py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50">
                    {loading ? 'Entrando...' : 'Entrar'}
                  </motion.button>
                </form>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs">ou</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <motion.button whileTap={{ scale: 0.98 }} onClick={handleGoogle}
                  className="w-full glass border border-white/10 py-3 rounded-xl text-white/70 font-medium text-sm hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-3">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google
                </motion.button>
              </motion.div>
            )}

            {/* SIGNUP */}
            {mode === 'signup' && (
              <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex mb-6 glass rounded-xl p-1">
                  <button onClick={() => setMode('login')} className="flex-1 py-2 rounded-lg text-sm font-medium text-white/40 hover:text-white">Entrar</button>
                  <button onClick={() => setMode('signup')} className="flex-1 py-2 rounded-lg text-sm font-medium love-gradient text-white">Criar conta</button>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50 [&:-webkit-autofill]:!bg-transparent [&:-webkit-autofill]:![box-shadow:0_0_0_1000px_rgba(255,255,255,0.05)_inset] [&:-webkit-autofill]:![-webkit-text-fill-color:white]" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type={showPwd ? 'text' : 'password'} placeholder="Crie uma senha" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50 [&:-webkit-autofill]:![box-shadow:0_0_0_1000px_rgba(255,255,255,0.05)_inset] [&:-webkit-autofill]:![-webkit-text-fill-color:white]" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                    className="w-full love-gradient py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50">
                    {loading ? 'Criando conta...' : 'Criar minha conta'}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* FORGOT */}
            {mode === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-6">
                  <Mail className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                  <h2 className="text-white font-bold text-lg">Recuperar acesso</h2>
                  <p className="text-white/40 text-sm mt-1">Enviaremos um codigo para seu email</p>
                </div>
                <form onSubmit={sendOtp} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50 [&:-webkit-autofill]:!bg-transparent [&:-webkit-autofill]:![box-shadow:0_0_0_1000px_rgba(255,255,255,0.05)_inset] [&:-webkit-autofill]:![-webkit-text-fill-color:white]" />
                  </div>
                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                    className="w-full love-gradient py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50">
                    {loading ? 'Enviando...' : 'Enviar codigo'}
                  </motion.button>
                </form>
                <button onClick={() => setMode('login')} className="w-full text-center text-white/30 text-sm mt-4 hover:text-white/50 transition-colors">
                  Voltar ao login
                </button>
              </motion.div>
            )}

            {/* OTP */}
            {mode === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-6">
                  <ShieldCheck className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h2 className="text-white font-bold text-lg">Digite o codigo</h2>
                  <p className="text-white/40 text-sm mt-1">Enviamos para</p>
                  <p className="text-pink-400 text-sm font-medium">{email}</p>
                </div>
                <form onSubmit={verifyOtp} className="space-y-4">
                  <input
                    type="text" inputMode="numeric" placeholder="000000"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required autoFocus maxLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 text-2xl font-bold tracking-[0.5em] text-center focus:outline-none focus:border-pink-500/50"
                  />
                  <motion.button type="submit" disabled={loading || otp.length < 6} whileTap={{ scale: 0.98 }}
                    className="w-full love-gradient py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50">
                    {loading ? 'Verificando...' : 'Confirmar codigo'}
                  </motion.button>
                </form>
                <button onClick={() => { setMode('forgot'); setOtp('') }} className="w-full text-center text-white/30 text-sm mt-4 hover:text-white/50">
                  Usar outro email
                </button>
                <button onClick={sendOtp} className="w-full text-center text-pink-400/70 text-sm mt-2 hover:text-pink-400">
                  Reenviar codigo
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

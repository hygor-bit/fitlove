'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Heart, Mail, ArrowLeft, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: undefined },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Codigo enviado para seu email!')
    setStep('otp')
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
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
        {/* Logo */}
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

            {/* Step 1 — email */}
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-6">
                  <Mail className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                  <h2 className="text-white font-bold text-lg">Entrar no FITLOVE</h2>
                  <p className="text-white/40 text-sm mt-1">Enviaremos um link de acesso para seu email</p>
                </div>

                <form onSubmit={sendOtp} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50 transition-colors"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full love-gradient py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar link de acesso'}
                  </motion.button>
                </form>

                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs">ou</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogle}
                  className="w-full glass border border-white/10 py-3 rounded-xl text-white/70 font-medium text-sm hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-3"
                >
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

            {/* Step 2 — OTP */}
            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-6">
                  <ShieldCheck className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <h2 className="text-white font-bold text-lg">Verifique seu email</h2>
                  <p className="text-white/40 text-sm mt-1">Enviamos um link de acesso para</p>
                  <p className="text-pink-400 text-sm font-medium mt-1">{email}</p>
                  <p className="text-white/30 text-xs mt-3">Clique no link do email para entrar.<br/>Pode fechar essa aba.</p>
                </div>

                <button
                  onClick={() => { setStep('email'); setOtp('') }}
                  className="w-full glass border border-white/10 py-3 rounded-xl text-white/50 text-sm hover:text-white hover:border-white/20 transition-all"
                >
                  Usar outro email
                </button>

                <button
                  onClick={sendOtp}
                  className="w-full text-center text-pink-400/70 text-sm mt-3 hover:text-pink-400 transition-colors"
                >
                  Reenviar link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

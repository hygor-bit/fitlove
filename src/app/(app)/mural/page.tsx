'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Send, Camera, X, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MotivationMessage, Profile } from '@/types'

export default function MuralPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<MotivationMessage[]>([])
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null)
  const [message, setMessage] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCompose, setShowCompose] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: profiles }, { data: msgs }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('motivation_messages').select(`*, from_profile:profiles!motivation_messages_from_user_id_fkey(*)`).order('created_at', { ascending: false }),
    ])
    if (profiles) {
      const me = profiles.find((p: Profile) => p.user_id === user.id) || null
      const partner = profiles.find((p: Profile) => p.user_id === me?.partner_id) || null
      setMyProfile(me)
      setPartnerProfile(partner)
    }
    if (msgs) setMessages(msgs)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function sendMessage() {
    if (!message.trim() && !photoFile) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !partnerProfile) return
    setSending(true)
    let image_url: string | undefined
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `mural/${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('fitlove').upload(path, photoFile)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('fitlove').getPublicUrl(path)
        image_url = publicUrl
      }
    }
    await supabase.from('motivation_messages').insert({
      from_user_id: user.id,
      to_user_id: partnerProfile.user_id,
      message: message.trim(),
      image_url,
    })
    toast.success(`Mensagem enviada para ${partnerProfile.name}!`)
    setMessage('')
    setPhotoFile(null)
    setShowCompose(false)
    setSending(false)
    load()
  }

  const QUICK_MESSAGES = [
    'Te amo e estou muito orgulhoso(a) de voce!',
    'Voce consegue! Nao desista!',
    'Juntos somos mais fortes!',
    'Voce e incrivel, continue assim!',
  ]

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 love-gradient rounded-full animate-pulse" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Mural do Amor</h1>
          <p className="text-white/40 text-sm">
            Mensagens especiais para {partnerProfile?.name || 'seu parceiro'}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCompose(true)}
          className="love-gradient px-4 py-2.5 rounded-xl text-white text-sm font-medium flex items-center gap-2"
        >
          <Heart className="w-4 h-4 fill-white" />
          Enviar
        </motion.button>
      </div>

      {/* Partner card */}
      {partnerProfile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 border border-pink-500/20 bg-gradient-to-r from-pink-500/5 to-purple-500/5"
        >
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {partnerProfile.avatar_url ? (
                <img src={partnerProfile.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              ) : (
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-xl font-black text-white ${
                  partnerProfile.name?.[0] === 'J' ? 'from-pink-500 to-rose-500' : 'from-blue-500 to-cyan-500'
                }`}>
                  {partnerProfile.name?.[0]}
                </div>
              )}
            </motion.div>
            <div>
              <p className="text-white font-bold">{partnerProfile.name}</p>
              <p className="text-white/40 text-sm">
                {partnerProfile.objective || 'Sem objetivo definido'}
              </p>
            </div>
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400 ml-auto float" />
          </div>
        </motion.div>
      )}

      {/* Quick messages */}
      <div>
        <p className="text-white/40 text-xs font-medium mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          MENSAGENS RAPIDAS
        </p>
        <div className="space-y-2">
          {QUICK_MESSAGES.map((msg, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setMessage(msg); setShowCompose(true) }}
              className="w-full text-left glass rounded-xl px-4 py-3 text-white/60 text-sm hover:text-white hover:border-pink-500/20 border border-transparent transition-all"
            >
              {msg}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div>
        <p className="text-white/40 text-xs font-medium mb-3">HISTORICO DO MURAL</p>
        {messages.length === 0 && (
          <div className="text-center py-12 text-white/20">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma mensagem ainda. Mande amor!</p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((msg, i) => {
            const isFromMe = msg.from_profile?.id === myProfile?.id
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass rounded-2xl p-4 border ${
                  isFromMe
                    ? 'border-purple-500/20 bg-purple-500/5'
                    : 'border-pink-500/20 bg-pink-500/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br ${
                    msg.from_profile?.name?.[0] === 'H'
                      ? 'from-blue-500 to-cyan-500'
                      : 'from-pink-500 to-rose-500'
                  }`}>
                    {msg.from_profile?.name?.[0] || '?'}
                  </div>
                  <span className="text-white/50 text-xs font-medium">
                    {msg.from_profile?.name}
                  </span>
                  <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
                  <span className="text-white/30 text-xs ml-auto">
                    {formatDistanceToNow(new Date(msg.created_at), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
                {msg.message && (
                  <p className="text-white/80 text-sm leading-relaxed">{msg.message}</p>
                )}
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    alt=""
                    className="w-full mt-3 rounded-xl object-cover max-h-48"
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowCompose(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                  Para {partnerProfile?.name}
                </h2>
                <button
                  onClick={() => setShowCompose(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <textarea
                  placeholder={`Escreva algo especial para ${partnerProfile?.name}...`}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50 resize-none"
                />
                <label className="flex items-center gap-2 text-white/40 text-sm cursor-pointer hover:text-white/60 transition-colors">
                  <Camera className="w-4 h-4" />
                  {photoFile ? photoFile.name : 'Adicionar foto'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                  />
                </label>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={sendMessage}
                  disabled={sending || (!message.trim() && !photoFile)}
                  className="w-full love-gradient py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Enviando...' : 'Enviar com amor'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

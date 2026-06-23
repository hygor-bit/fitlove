'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Profile } from '@/types'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

function Avatar({ profile, size = 'sm' }: { profile?: Profile; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  const letter = profile?.name?.[0] || '?'
  const color = letter === 'H' ? 'from-blue-500 to-cyan-500' : 'from-pink-500 to-rose-500'
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" className={`${sz} rounded-xl object-cover flex-shrink-0`} />
  }
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {letter}
    </div>
  )
}

export default function ConversationPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const convId = params.id as string
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: conv }, { data: msgs }, { data: profiles }] = await Promise.all([
      supabase.from('conversations').select('*').eq('id', convId).single(),
      supabase.from('messages').select('*').eq('conversation_id', convId).order('created_at'),
      supabase.from('profiles').select('*'),
    ])

    const profileMap = new Map((profiles || []).map((p: Profile) => [p.user_id, p]))
    const me = profileMap.get(user.id) as Profile | undefined
    if (me) setMyProfile(me)

    if (conv) {
      const otherId = conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id
      setOtherProfile((profileMap.get(otherId) as Profile | undefined) || null)
    }

    if (msgs) setMessages(msgs)

    // Mark as read
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .neq('sender_id', user.id)
      .is('read_at', null)

  }, [supabase, convId])

  useEffect(() => {
    load()
    const ch = supabase.channel(`conv-${convId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load, supabase, convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSending(true)
    const content = text.trim()
    setText('')
    await Promise.all([
      supabase.from('messages').insert({ conversation_id: convId, sender_id: user.id, content }),
      supabase.from('conversations').update({ last_message: content, last_message_at: new Date().toISOString() }).eq('id', convId),
    ])
    setSending(false)
    load()
  }

  function groupByDate(msgs: Message[]) {
    const groups: { date: string; messages: Message[] }[] = []
    msgs.forEach(msg => {
      const date = format(new Date(msg.created_at), "d 'de' MMMM", { locale: ptBR })
      const last = groups[groups.length - 1]
      if (last?.date === date) last.messages.push(msg)
      else groups.push({ date, messages: [msg] })
    })
    return groups
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/5 flex-shrink-0">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar profile={otherProfile ?? undefined} size="md" />
        <div>
          <p className="text-white font-semibold text-sm">{otherProfile?.name || 'Usuario'}</p>
          <p className="text-white/30 text-xs">{otherProfile?.objective || 'Atleta FITLOVE'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {groupByDate(messages).map(group => (
          <div key={group.date}>
            <div className="text-center mb-3">
              <span className="text-white/20 text-xs bg-white/5 px-3 py-1 rounded-full">{group.date}</span>
            </div>
            <div className="space-y-1">
              {group.messages.map((msg, i) => {
                const isMe = msg.sender_id === myProfile?.user_id
                const prevMsg = group.messages[i - 1]
                const showAvatar = !isMe && msg.sender_id !== prevMsg?.sender_id

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isMe && (
                      <div className="w-7 flex-shrink-0">
                        {showAvatar && <Avatar profile={otherProfile ?? undefined} />}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'love-gradient text-white rounded-br-sm'
                          : 'bg-white/8 text-white rounded-bl-sm border border-white/5'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-white/20 text-[10px] mt-0.5 px-1">
                        {format(new Date(msg.created_at), 'HH:mm')}
                        {isMe && msg.read_at && ' ✓✓'}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-12 text-white/20">
            <p className="text-sm">Comece a conversa!</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 pt-3 border-t border-white/5 flex-shrink-0">
        <input
          placeholder="Digite uma mensagem..."
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/30"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.9 }}
          disabled={!text.trim() || sending}
          className="love-gradient w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
        >
          <Send className="w-4 h-4 text-white" />
        </motion.button>
      </form>
    </div>
  )
}

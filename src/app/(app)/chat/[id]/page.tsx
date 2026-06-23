'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Image, Video, X, CheckCheck, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Profile } from '@/types'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  image_url?: string | null
  video_url?: string | null
  message_type?: string
  created_at: string
  read_at: string | null
}

function Avatar({ profile }: { profile?: Profile }) {
  const letter = profile?.name?.[0] || '?'
  const color = letter === 'H' ? 'from-blue-500 to-cyan-500' : 'from-pink-500 to-rose-500'
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-xl object-cover flex-shrink-0" />
  }
  return (
    <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white text-xs flex-shrink-0`}>
      {letter}
    </div>
  )
}

function MediaPreview({ url, type, onRemove }: { url: string; type: 'image' | 'video'; onRemove: () => void }) {
  return (
    <div className="relative inline-block">
      {type === 'image'
        ? <img src={url} alt="" className="h-20 rounded-xl object-cover" />
        : <video src={url} className="h-20 rounded-xl" />
      }
      <button onClick={onRemove} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
        <X className="w-3 h-3 text-white" />
      </button>
    </div>
  )
}

export default function ConversationPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const convId = params.id as string

  const [myId, setMyId] = useState<string>('')
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const markRead = useCallback(async (userId: string) => {
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .neq('sender_id', userId)
      .is('read_at', null)
  }, [supabase, convId])

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMyId(user.id)

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
    markRead(user.id)
  }, [supabase, convId, markRead])

  useEffect(() => {
    init()

    // Real-time: new messages arrive instantly
    const ch = supabase.channel(`chat-${convId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, payload => {
        const msg = payload.new as Message
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Mark read if it's from the other person
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user && msg.sender_id !== user.id) markRead(user.id)
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${convId}`,
      }, payload => {
        const updated = payload.new as Message
        setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [init, supabase, convId, markRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: messages.length > 10 ? 'smooth' : 'instant' })
  }, [messages])

  function pickMedia(e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    setMediaType(type)
    setMediaPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function clearMedia() {
    setMediaFile(null)
    setMediaPreview(null)
  }

  async function uploadMedia(file: File): Promise<{ url: string; type: 'image' | 'video' } | null> {
    const ext = file.name.split('.').pop()
    const isVideo = file.type.startsWith('video')
    const folder = isVideo ? 'chat-videos' : 'chat-images'
    const path = `${folder}/${convId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('fitlove').upload(path, file)
    if (error) { toast.error('Erro ao enviar midia'); return null }
    const { data: { publicUrl } } = supabase.storage.from('fitlove').getPublicUrl(path)
    return { url: publicUrl, type: isVideo ? 'video' : 'image' }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if ((!text.trim() && !mediaFile) || sending) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSending(true)
    setUploading(!!mediaFile)

    let image_url: string | undefined
    let video_url: string | undefined
    let message_type = 'text'

    if (mediaFile) {
      const result = await uploadMedia(mediaFile)
      if (result) {
        if (result.type === 'image') { image_url = result.url; message_type = 'image' }
        else { video_url = result.url; message_type = 'video' }
      }
      clearMedia()
    }

    const content = text.trim()
    setText('')
    setUploading(false)

    const { data: msg } = await supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      content,
      image_url,
      video_url,
      message_type,
    }).select().single()

    // Optimistic: add immediately if realtime hasn't arrived
    if (msg) {
      setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
    }

    await supabase.from('conversations').update({
      last_message: content || (image_url ? 'Foto' : 'Video'),
      last_message_at: new Date().toISOString(),
    }).eq('id', convId)

    setSending(false)
    inputRef.current?.focus()
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

  function ReadTick({ msg }: { msg: Message }) {
    if (msg.sender_id !== myId) return null
    return msg.read_at
      ? <CheckCheck className="w-3 h-3 text-blue-400 inline ml-1" />
      : <Check className="w-3 h-3 text-white/30 inline ml-1" />
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4rem)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/5 flex-shrink-0">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {otherProfile?.avatar_url
          ? <img src={otherProfile.avatar_url} className="w-9 h-9 rounded-xl object-cover" alt="" />
          : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">{otherProfile?.name?.[0]}</div>
        }
        <div>
          <p className="text-white font-semibold text-sm">{otherProfile?.name || 'Usuario'}</p>
          <p className="text-white/30 text-xs">{otherProfile?.objective || 'Atleta FITLOVE'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 overscroll-contain">
        {groupByDate(messages).map(group => (
          <div key={group.date}>
            <div className="text-center mb-3">
              <span className="text-white/20 text-xs bg-white/5 px-3 py-1 rounded-full">{group.date}</span>
            </div>
            <div className="space-y-0.5">
              {group.messages.map((msg, i) => {
                const isMe = msg.sender_id === myId
                const prevMsg = group.messages[i - 1]
                const showAvatar = !isMe && msg.sender_id !== prevMsg?.sender_id
                const isConsecutive = prevMsg && prevMsg.sender_id === msg.sender_id

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18 }}
                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isConsecutive ? 'mt-0.5' : 'mt-2'}`}
                  >
                    <div className="w-7 flex-shrink-0">
                      {!isMe && showAvatar && <Avatar profile={otherProfile ?? undefined} />}
                    </div>
                    <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {/* Image */}
                      {msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt=""
                          className={`max-w-full rounded-2xl object-cover max-h-64 mb-0.5 ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                          loading="lazy"
                        />
                      )}
                      {/* Video */}
                      {msg.video_url && (
                        <video
                          src={msg.video_url}
                          controls
                          className={`max-w-full rounded-2xl max-h-64 mb-0.5 ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                        />
                      )}
                      {/* Text bubble */}
                      {msg.content && (
                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'love-gradient text-white rounded-br-sm'
                            : 'bg-white/8 text-white rounded-bl-sm border border-white/5'
                        }`}>
                          {msg.content}
                        </div>
                      )}
                      <span className="text-white/20 text-[10px] mt-0.5 px-1 flex items-center gap-0.5">
                        {format(new Date(msg.created_at), 'HH:mm')}
                        <ReadTick msg={msg} />
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

      {/* Media preview */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-2 pb-2 flex-shrink-0"
          >
            <MediaPreview url={mediaPreview} type={mediaType} onRemove={clearMedia} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-center gap-2 pt-2 border-t border-white/5 flex-shrink-0">
        {/* Photo */}
        <label className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-white/30 hover:text-white/60 cursor-pointer">
          <Image className="w-5 h-5" />
          <input type="file" accept="image/*" className="hidden" onChange={e => pickMedia(e, 'image')} />
        </label>
        {/* Video */}
        <label className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-white/30 hover:text-white/60 cursor-pointer">
          <Video className="w-5 h-5" />
          <input type="file" accept="video/*" className="hidden" onChange={e => pickMedia(e, 'video')} />
        </label>

        <input
          ref={inputRef}
          placeholder="Mensagem..."
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/30 min-w-0"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.88 }}
          disabled={(!text.trim() && !mediaFile) || sending}
          className="love-gradient w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
        >
          {uploading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <Send className="w-4 h-4 text-white" />
          }
        </motion.button>
      </form>
    </div>
  )
}

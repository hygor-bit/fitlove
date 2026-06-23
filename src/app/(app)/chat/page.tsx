'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Search, Plus, X, Check, UserPlus, MoreVertical, Trash2, BellOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

interface Conversation {
  id: string
  participant1_id: string
  participant2_id: string
  last_message: string | null
  last_message_at: string
  other_user?: Profile
}

interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: string
  from_profile?: Profile
}

function Avatar({ profile, size = 'md' }: { profile?: Profile; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-11 h-11'
  const letter = profile?.name?.[0] || '?'
  const color = letter === 'H' ? 'from-blue-500 to-cyan-500' : 'from-pink-500 to-rose-500'
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" className={`${sz} rounded-2xl object-cover flex-shrink-0`} />
  }
  return (
    <div className={`${sz} rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {letter}
    </div>
  )
}

export default function ChatPage() {
  const supabase = createClient()
  const router = useRouter()
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState<Profile | null>(null)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menuConvId, setMenuConvId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: prof }, { data: convs }, { data: reqs }, { data: profiles }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('conversations').select('*')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false }),
      supabase.from('friend_requests').select('*').eq('to_user_id', user.id).eq('status', 'pending'),
      supabase.from('profiles').select('*'),
    ])

    if (prof) setMyProfile(prof)

    const profileMap = new Map((profiles || []).map((p: Profile) => [p.user_id, p]))

    if (convs) {
      setConversations(convs.map((c: Conversation) => ({
        ...c,
        other_user: profileMap.get(c.participant1_id === user.id ? c.participant2_id : c.participant1_id),
      })))
    }

    if (reqs) {
      setRequests(reqs.map((r: FriendRequest) => ({
        ...r,
        from_profile: profileMap.get(r.from_user_id),
      })))
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
    const ch = supabase.channel('chat-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load, supabase])

  async function searchUser() {
    if (!searchEmail.trim()) return
    setSearching(true)
    setSearchResult(null)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', `%${searchEmail}%`)
      .neq('user_id', myProfile?.user_id || '')
      .limit(1)
      .single()
    setSearching(false)
    if (data) setSearchResult(data)
    else toast.error('Usuario nao encontrado')
  }

  async function sendRequest(toUserId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${toUserId}),and(participant1_id.eq.${toUserId},participant2_id.eq.${user.id})`)
      .single()

    if (existing) {
      router.push(`/chat/${existing.id}`)
      return
    }

    const { error } = await supabase.from('friend_requests').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
    })

    if (error && error.code !== '23505') {
      toast.error('Erro ao enviar solicitacao')
    } else {
      toast.success('Solicitacao enviada!')
      setShowAddUser(false)
      setSearchEmail('')
      setSearchResult(null)
    }
  }

  async function acceptRequest(req: FriendRequest) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', req.id)

    const { data: conv } = await supabase.from('conversations').insert({
      participant1_id: req.from_user_id,
      participant2_id: user.id,
    }).select().single()

    toast.success('Conversa iniciada!')
    load()
    if (conv) router.push(`/chat/${conv.id}`)
  }

  async function rejectRequest(id: string) {
    await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', id)
    load()
  }

  async function deleteConversation(convId: string) {
    await supabase.from('messages').delete().eq('conversation_id', convId)
    await supabase.from('conversations').delete().eq('id', convId)
    setMenuConvId(null)
    toast.success('Conversa excluida')
    load()
  }

  async function blockUser(otherUserId: string, convId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('blocked_users').insert({ user_id: user.id, blocked_user_id: otherUserId }).throwOnError()
    await deleteConversation(convId)
    toast.success('Usuario bloqueado')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 love-gradient rounded-full animate-pulse" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Chat</h1>
          <p className="text-white/40 text-sm">Suas conversas</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddUser(true)}
          className="love-gradient p-2.5 rounded-xl text-white"
        >
          <UserPlus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Solicitacoes pendentes */}
      {requests.length > 0 && (
        <div className="space-y-2">
          <p className="text-white/40 text-xs font-medium">SOLICITACOES ({requests.length})</p>
          {requests.map(req => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 border border-pink-500/20 flex items-center gap-3"
            >
              <Avatar profile={req.from_profile} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{req.from_profile?.name || 'Usuario'}</p>
                <p className="text-white/40 text-xs">Quer conversar com voce</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => acceptRequest(req)}
                  className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center text-green-400 hover:bg-green-500/30"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => rejectRequest(req.id)}
                  className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lista de conversas */}
      <div className="space-y-2">
        {conversations.length === 0 && requests.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma conversa ainda</p>
            <p className="text-xs mt-1">Clique em + para adicionar alguem</p>
          </div>
        )}
        {conversations.map((conv, i) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative"
          >
            <button
              onClick={() => router.push(`/chat/${conv.id}`)}
              className="w-full glass rounded-2xl p-4 border border-white/5 flex items-center gap-3 hover:border-white/10 transition-all text-left"
            >
              <Avatar profile={conv.other_user} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-white font-semibold text-sm">{conv.other_user?.name || 'Usuario'}</p>
                  <span className="text-white/30 text-xs">
                    {formatDistanceToNow(new Date(conv.last_message_at), { locale: ptBR, addSuffix: true })}
                  </span>
                </div>
                <p className="text-white/40 text-xs truncate">
                  {conv.last_message || 'Iniciar conversa...'}
                </p>
              </div>
            </button>
            {/* Menu 3 pontos */}
            <button
              onClick={e => { e.stopPropagation(); setMenuConvId(menuConvId === conv.id ? null : conv.id) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white/20 hover:text-white/60 rounded-xl hover:bg-white/5"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuConvId === conv.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-3 top-12 z-20 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-xl"
              >
                <button
                  onClick={() => deleteConversation(conv.id)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 w-full text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir conversa
                </button>
                <button
                  onClick={() => conv.other_user && blockUser(conv.other_user.user_id, conv.id)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-white/50 hover:bg-white/5 w-full text-left"
                >
                  <BellOff className="w-4 h-4" />
                  Bloquear usuario
                </button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Modal adicionar usuario */}
      {showAddUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowAddUser(false)}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold">Nova conversa</h2>
              <button onClick={() => setShowAddUser(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  placeholder="Buscar por nome..."
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchUser()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50"
                />
              </div>
              <button
                onClick={searchUser}
                disabled={searching}
                className="love-gradient px-4 rounded-xl text-white text-sm font-medium disabled:opacity-50"
              >
                {searching ? '...' : 'Buscar'}
              </button>
            </div>

            {searchResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 glass rounded-xl border border-white/10"
              >
                <Avatar profile={searchResult} size="lg" />
                <div className="flex-1">
                  <p className="text-white font-semibold">{searchResult.name}</p>
                  <p className="text-white/40 text-xs">{searchResult.objective || 'Atleta FITLOVE'}</p>
                </div>
                <button
                  onClick={() => sendRequest(searchResult.user_id)}
                  className="love-gradient px-3 py-2 rounded-xl text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Conversar
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

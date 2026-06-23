'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Send, Smile, ImagePlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNotifications } from '@/hooks/useNotifications'
import type { Post, Comment, Profile } from '@/types'

function Avatar({ profile, size = 'md' }: { profile?: Profile; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs rounded-xl' : 'w-10 h-10 text-sm rounded-xl'
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" className={`${sz} object-cover flex-shrink-0`} />
  }
  const letter = profile?.name?.[0] || '?'
  const color = letter === 'H' ? 'from-blue-500 to-cyan-500' : 'from-pink-500 to-rose-500'
  return (
    <div className={`${sz} bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {letter}
    </div>
  )
}

const EMOJI_QUICK = ['🔥', '💪', '❤️', '🥗', '💧', '🏆', '✅', '😍']

export default function FeedPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [newComments, setNewComments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const { notify } = useNotifications()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [
      { data: prof },
      { data: postsData, error: postsError },
      { data: profiles },
      { data: likes },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('profiles').select('*'),
      supabase.from('likes').select('post_id').eq('user_id', user.id),
    ])

    if (postsError) console.error('posts error:', postsError)
    if (prof) setMyProfile(prof)

    const profileMap = new Map((profiles || []).map((p: Profile) => [p.user_id, p]))
    const likedSet = new Set((likes || []).map((l: { post_id: string }) => l.post_id))
    setPosts((postsData || []).map((p: Post) => ({
      ...p,
      profile: profileMap.get(p.user_id),
      liked_by_me: likedSet.has(p.id),
    })))
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
    const ch = supabase.channel('feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload: { new: Post }) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && payload.new.user_id !== user.id) {
          const { data: prof } = await supabase.from('profiles').select('name').eq('user_id', payload.new.user_id).single()
          notify(
            `${(prof as { name?: string } | null)?.name || 'Alguem'} publicou no Feed`,
            payload.new.content?.slice(0, 80) || 'Nova publicacao',
          )
        }
        load()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load, supabase, notify])

  function pickImage(file: File) {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
  }

  async function submitPost() {
    if (!content.trim() && !imageFile) return
    setPosting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let image_url: string | undefined
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `posts/${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('fitlove').upload(path, imageFile)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('fitlove').getPublicUrl(path)
        image_url = publicUrl
      }
    }

    await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      image_url,
      likes_count: 0,
      comments_count: 0,
    })
    setContent('')
    clearImage()
    toast.success('Post publicado!')
    setPosting(false)
    load()
  }

  async function toggleLike(post: Post) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (post.liked_by_me) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
      await supabase.from('posts').update({ likes_count: Math.max(0, post.likes_count - 1) }).eq('id', post.id)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
      await supabase.from('posts').update({ likes_count: post.likes_count + 1 }).eq('id', post.id)
    }
    load()
  }

  async function loadComments(postId: string) {
    const { data } = await supabase
      .from('comments')
      .select(`*, profile:profiles!comments_user_id_fkey(*)`)
      .eq('post_id', postId)
      .order('created_at')
    if (data) setComments(prev => ({ ...prev, [postId]: data }))
  }

  async function toggleComments(postId: string) {
    const next = new Set(expandedComments)
    if (next.has(postId)) {
      next.delete(postId)
    } else {
      next.add(postId)
      await loadComments(postId)
    }
    setExpandedComments(next)
  }

  async function submitComment(postId: string) {
    const text = newComments[postId]?.trim()
    if (!text) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content: text })
    const post = posts.find(p => p.id === postId)
    await supabase.from('posts').update({ comments_count: (post?.comments_count || 0) + 1 }).eq('id', postId)
    setNewComments(prev => ({ ...prev, [postId]: '' }))
    loadComments(postId)
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 love-gradient rounded-full animate-pulse" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-black text-white">Feed FITLOVE</h1>
        <p className="text-white/40 text-sm">Compartilhe suas conquistas</p>
      </div>

      {/* Compose */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 border border-white/5"
      >
        <div className="flex gap-3">
          <Avatar profile={myProfile ?? undefined} />
          <div className="flex-1">
            <textarea
              placeholder="O que voce conquistou hoje?"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-white placeholder-white/30 text-sm focus:outline-none resize-none"
            />

            {/* Image preview */}
            {imagePreview && (
              <div className="relative mt-2 rounded-xl overflow-hidden">
                <img src={imagePreview} alt="" className="w-full max-h-48 object-cover rounded-xl" />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {EMOJI_QUICK.map(e => (
                    <button
                      key={e}
                      onClick={() => setContent(c => c + e)}
                      className="text-base hover:scale-125 transition-transform"
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <label className="text-white/30 hover:text-white/60 cursor-pointer transition-colors ml-1">
                  <ImagePlus className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) pickImage(f) }}
                  />
                </label>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={submitPost}
                disabled={posting || (!content.trim() && !imageFile)}
                className="love-gradient px-4 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-40 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {posting ? 'Enviando...' : 'Publicar'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Posts */}
      <div className="space-y-3">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-2xl border border-white/5 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <Avatar profile={post.profile} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold text-sm">
                      {post.profile?.name || 'Atleta'}
                    </span>
                    <span className="text-white/30 text-xs">
                      {formatDistanceToNow(new Date(post.created_at), { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>
                  {post.content && <p className="text-white/70 text-sm leading-relaxed">{post.content}</p>}
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt=""
                      className="w-full mt-3 rounded-xl object-cover max-h-72"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => toggleLike(post)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    post.liked_by_me ? 'text-pink-400' : 'text-white/30 hover:text-pink-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-pink-400' : ''}`} />
                  <span>{post.likes_count}</span>
                </motion.button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments_count}</span>
                </button>
              </div>
            </div>

            {/* Comments */}
            <AnimatePresence>
              {expandedComments.has(post.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5"
                >
                  <div className="p-4 space-y-3">
                    {(comments[post.id] || []).map(c => (
                      <div key={c.id} className="flex gap-2">
                        <Avatar profile={c.profile} size="sm" />
                        <div className="flex-1 bg-white/5 rounded-xl px-3 py-2">
                          <p className="text-white/60 text-xs font-medium mb-0.5">
                            {c.profile?.name}
                          </p>
                          <p className="text-white/70 text-sm">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Avatar profile={myProfile ?? undefined} size="sm" />
                      <div className="flex-1 flex gap-2">
                        <input
                          placeholder="Comentar..."
                          value={newComments[post.id] || ''}
                          onChange={e => setNewComments(p => ({ ...p, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && submitComment(post.id)}
                          className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none border border-transparent focus:border-pink-500/30"
                        />
                        <button
                          onClick={() => submitComment(post.id)}
                          className="text-pink-400 hover:text-pink-300"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <Smile className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum post ainda. Seja o primeiro!</p>
          </div>
        )}
      </div>
    </div>
  )
}

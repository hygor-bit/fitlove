'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { User, Save, Target, Droplets, Flame, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types'

export default function PerfilPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({
    name: '', objective: '',
    weight_current: '', weight_goal: '',
    calories_goal: '', protein_goal: '', carbs_goal: '', fat_goal: '',
    water_goal: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    if (data) {
      setProfile(data)
      setForm({
        name: data.name || '',
        objective: data.objective || '',
        weight_current: data.weight_current?.toString() || '',
        weight_goal: data.weight_goal?.toString() || '',
        calories_goal: data.calories_goal?.toString() || '2000',
        protein_goal: data.protein_goal?.toString() || '150',
        carbs_goal: data.carbs_goal?.toString() || '300',
        fat_goal: data.fat_goal?.toString() || '60',
        water_goal: ((data.water_goal || 3000) / 1000).toString(),
      })
    } else {
      const { data: { user: u } } = await supabase.auth.getUser()
      setForm(f => ({ ...f, name: u?.email?.split('@')[0] || '' }))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function uploadAvatar(file: File) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUploadingPhoto(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error } = await supabase.storage.from('fitlove').upload(path, file, { upsert: true })
    if (error) { toast.error('Erro ao enviar foto'); setUploadingPhoto(false); return }
    const { data: { publicUrl } } = supabase.storage.from('fitlove').getPublicUrl(path)
    await supabase.from('profiles').upsert({ user_id: user.id, avatar_url: publicUrl }, { onConflict: 'user_id' })
    toast.success('Foto atualizada!')
    setUploadingPhoto(false)
    load()
  }

  async function save() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').upsert({
      user_id: user.id,
      name: form.name,
      objective: form.objective,
      weight_current: form.weight_current ? +form.weight_current : null,
      weight_goal: form.weight_goal ? +form.weight_goal : null,
      calories_goal: +form.calories_goal || 2000,
      protein_goal: +form.protein_goal || 150,
      carbs_goal: +form.carbs_goal || 300,
      fat_goal: +form.fat_goal || 60,
      water_goal: (+form.water_goal || 3) * 1000,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    toast.success('Perfil salvo!')
    setSaving(false)
    load()
  }

  const progress = profile?.weight_current && profile?.weight_goal
    ? Math.min(Math.abs(profile.weight_current - profile.weight_goal) / Math.abs((profile.weight_current + profile.weight_goal) / 2 - profile.weight_goal) * 100, 100)
    : 0

  const avatarLetter = form.name?.[0] || '?'
  const avatarGradient = avatarLetter === 'H' ? 'from-blue-500 to-cyan-500' : 'from-pink-500 to-rose-500'

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 love-gradient rounded-full animate-pulse" /></div>

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Perfil</h1>
        <p className="text-white/40 text-sm">Personalize suas metas e informacoes</p>
      </div>

      {/* Avatar + info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 border border-white/5 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl object-cover"
            />
          ) : (
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white bg-gradient-to-br ${avatarGradient}`}>
              {avatarLetter}
            </div>
          )}
          <label className={`absolute -bottom-2 -right-2 w-8 h-8 love-gradient rounded-full flex items-center justify-center cursor-pointer shadow-lg ${uploadingPhoto ? 'opacity-50' : ''}`}>
            <Camera className="w-3.5 h-3.5 text-white" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingPhoto}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) uploadAvatar(f)
              }}
            />
          </label>
          {uploadingPhoto && (
            <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg">{form.name || 'Atleta'}</p>
          <p className="text-white/40 text-sm truncate">{form.objective || 'Sem objetivo definido'}</p>
          {profile?.weight_current && profile?.weight_goal && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-white/30 mb-1">
                <span>{profile.weight_current}kg atual</span>
                <span>meta: {profile.weight_goal}kg</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full love-gradient rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <Section title="INFORMACOES PESSOAIS" icon={<User className="w-4 h-4 text-pink-400" />}>
        <Field label="Nome" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Seu nome" />
        <Field label="Objetivo" value={form.objective} onChange={v => setForm(f => ({ ...f, objective: v }))} placeholder="Ex: Ganhar massa muscular" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Peso atual (kg)" value={form.weight_current} onChange={v => setForm(f => ({ ...f, weight_current: v }))} placeholder="75" type="number" />
          <Field label="Meta de peso (kg)" value={form.weight_goal} onChange={v => setForm(f => ({ ...f, weight_goal: v }))} placeholder="80" type="number" />
        </div>
      </Section>

      <Section title="METAS NUTRICIONAIS" icon={<Flame className="w-4 h-4 text-orange-400" />}>
        <Field label="Calorias diarias (kcal)" value={form.calories_goal} onChange={v => setForm(f => ({ ...f, calories_goal: v }))} placeholder="2000" type="number" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Proteina (g)" value={form.protein_goal} onChange={v => setForm(f => ({ ...f, protein_goal: v }))} placeholder="150" type="number" />
          <Field label="Carbs (g)" value={form.carbs_goal} onChange={v => setForm(f => ({ ...f, carbs_goal: v }))} placeholder="300" type="number" />
          <Field label="Gordura (g)" value={form.fat_goal} onChange={v => setForm(f => ({ ...f, fat_goal: v }))} placeholder="60" type="number" />
        </div>
      </Section>

      <Section title="META DE HIDRATACAO" icon={<Droplets className="w-4 h-4 text-blue-400" />}>
        <Field label="Agua por dia (litros)" value={form.water_goal} onChange={v => setForm(f => ({ ...f, water_goal: v }))} placeholder="3" type="number" step="0.5" />
      </Section>

      <div className="glass rounded-2xl p-5 border border-white/5">
        <p className="text-white/40 text-xs font-medium mb-3 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          PRESETS RAPIDOS
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setForm(f => ({ ...f, name: 'Hygor', calories_goal: '2750', protein_goal: '150', carbs_goal: '400', fat_goal: '60', water_goal: '3' }))}
            className="glass border border-blue-500/20 rounded-xl py-3 px-4 text-sm text-blue-400 hover:bg-blue-500/10 transition-all text-left"
          >
            <p className="font-bold">H - Hygor</p>
            <p className="text-white/30 text-xs mt-0.5">2750kcal - Ganho de massa</p>
          </button>
          <button
            onClick={() => setForm(f => ({ ...f, name: 'Julia', calories_goal: '1650', protein_goal: '140', carbs_goal: '145', fat_goal: '55', water_goal: '3' }))}
            className="glass border border-pink-500/20 rounded-xl py-3 px-4 text-sm text-pink-400 hover:bg-pink-500/10 transition-all text-left"
          >
            <p className="font-bold">J - Julia</p>
            <p className="text-white/30 text-xs mt-0.5">1650kcal - Perda de gordura</p>
          </button>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={save}
        disabled={saving}
        className="w-full love-gradient py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Salvando...' : 'Salvar perfil'}
      </motion.button>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
      <p className="text-white/40 text-xs font-medium flex items-center gap-1.5">{icon}{title}</p>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', step }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; step?: string
}) {
  return (
    <div>
      <label className="text-white/40 text-xs mb-1.5 block">{label}</label>
      <input
        type={type}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50"
      />
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Plus, X, Camera, Scale, Ruler } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { BodyProgress } from '@/types'

export default function ProgressoPage() {
  const supabase = createClient()
  const [records, setRecords] = useState<BodyProgress[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [sliderPos, setSliderPos] = useState(50)
  const [form, setForm] = useState({
    weight: '', chest: '', waist: '', hips: '', arm: '', thigh: '', notes: ''
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('body_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
    if (data) setRecords(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function saveProgress() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUploading(true)
    let photo_url: string | undefined
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `progress/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('fitlove').upload(path, photoFile)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('fitlove').getPublicUrl(path)
        photo_url = publicUrl
      }
    }
    await supabase.from('body_progress').insert({
      user_id: user.id,
      weight: form.weight ? +form.weight : null,
      chest: form.chest ? +form.chest : null,
      waist: form.waist ? +form.waist : null,
      hips: form.hips ? +form.hips : null,
      arm: form.arm ? +form.arm : null,
      thigh: form.thigh ? +form.thigh : null,
      notes: form.notes || null,
      photo_url,
    })
    toast.success('Progresso salvo!')
    setForm({ weight: '', chest: '', waist: '', hips: '', arm: '', thigh: '', notes: '' })
    setPhotoFile(null)
    setShowForm(false)
    setUploading(false)
    load()
  }

  const first = records[records.length - 1]
  const last = records[0]
  const photosWithImg = records.filter(r => r.photo_url)

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 love-gradient rounded-full animate-pulse" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Progresso</h1>
          <p className="text-white/40 text-sm">Acompanhe sua evolucao corporal</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="love-gradient px-4 py-2.5 rounded-xl text-white text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Registrar
        </motion.button>
      </div>

      {/* Stats comparison */}
      {first && last && first.id !== last.id && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 border border-white/5"
        >
          <p className="text-white/40 text-xs font-medium mb-4">COMPARATIVO</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Inicio', v: first.weight, color: 'text-white/50' },
              {
                label: 'Diferenca',
                v: last.weight && first.weight ? +(last.weight - first.weight).toFixed(1) : null,
                color: (last.weight || 0) > (first.weight || 0) ? 'text-green-400' : 'text-red-400',
                prefix: true
              },
              { label: 'Atual', v: last.weight, color: 'text-white' },
            ].map((s, i) => (
              <div key={i}>
                <p className={`text-2xl font-black ${s.color}`}>
                  {s.v != null
                    ? (s.prefix && s.v > 0 ? '+' : '') + s.v
                    : '---'
                  }
                  {s.v != null && <span className="text-sm ml-0.5">kg</span>}
                </p>
                <p className="text-white/30 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Before/After slider */}
      {photosWithImg.length >= 2 && (
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <p className="text-white/40 text-xs font-medium px-5 pt-4 pb-3">ANTES x DEPOIS</p>
          <div
            className="relative aspect-video overflow-hidden cursor-col-resize"
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              setSliderPos(((e.clientX - rect.left) / rect.width) * 100)
            }}
          >
            <img
              src={photosWithImg[photosWithImg.length - 1].photo_url!}
              alt="Antes"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={photosWithImg[0].photo_url!}
                alt="Depois"
                className="h-full object-cover"
                style={{ width: `${10000 / sliderPos}%`, maxWidth: 'none' }}
              />
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/80"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <span className="text-xs text-black font-bold">⟺</span>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 glass px-2 py-1 rounded text-xs text-white">Antes</div>
            <div className="absolute bottom-2 right-2 glass px-2 py-1 rounded text-xs text-white">Depois</div>
          </div>
          <p className="text-white/30 text-xs px-5 py-2">Arraste para comparar</p>
        </div>
      )}

      {/* Records */}
      <div>
        <p className="text-white/40 text-xs font-medium mb-3">HISTORICO</p>
        {records.length === 0 && (
          <div className="text-center py-12 text-white/20">
            <Scale className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum registro ainda</p>
          </div>
        )}
        <div className="space-y-3">
          {records.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 border border-white/5"
            >
              <div className="flex items-start gap-3">
                {r.photo_url && (
                  <img
                    src={r.photo_url}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/40 text-xs">
                      {format(new Date(r.recorded_at), "d 'de' MMM, yyyy", { locale: ptBR })}
                    </span>
                    {r.weight && <span className="text-white font-bold">{r.weight}kg</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.chest && <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-lg">Peito: {r.chest}cm</span>}
                    {r.waist && <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-lg">Cintura: {r.waist}cm</span>}
                    {r.hips && <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-lg">Quadril: {r.hips}cm</span>}
                    {r.arm && <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-lg">Braco: {r.arm}cm</span>}
                    {r.thigh && <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-lg">Coxa: {r.thigh}cm</span>}
                  </div>
                  {r.notes && <p className="text-white/30 text-xs mt-2">{r.notes}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold">Registrar Progresso</h2>
                <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'PESO (kg)', key: 'weight', icon: <Scale className="w-3 h-3" /> },
                    { label: 'PEITO (cm)', key: 'chest', icon: <Ruler className="w-3 h-3" /> },
                    { label: 'CINTURA (cm)', key: 'waist', icon: <Ruler className="w-3 h-3" /> },
                    { label: 'QUADRIL (cm)', key: 'hips', icon: <Ruler className="w-3 h-3" /> },
                    { label: 'BRACO (cm)', key: 'arm', icon: <Ruler className="w-3 h-3" /> },
                    { label: 'COXA (cm)', key: 'thigh', icon: <Ruler className="w-3 h-3" /> },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-white/40 text-xs mb-1.5 flex items-center gap-1 block">
                        {f.icon}{f.label}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        value={form[f.key as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">FOTO</label>
                  <label className="w-full border border-dashed border-white/15 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-pink-500/30 transition-colors">
                    <Camera className="w-6 h-6 text-white/20" />
                    <span className="text-white/30 text-xs">
                      {photoFile ? photoFile.name : 'Clique para adicionar foto'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1.5 block">OBSERVACOES</label>
                  <textarea
                    placeholder="Como voce esta se sentindo?"
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50 resize-none"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={saveProgress}
                  disabled={uploading}
                  className="w-full love-gradient py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Salvando...' : 'Salvar Progresso'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

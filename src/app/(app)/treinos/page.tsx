'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Plus, Check, Clock, FileText, X, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Workout, DailyHabit } from '@/types'

const WORKOUT_TYPES = [
  'Peito', 'Costas', 'Pernas', 'Ombros', 'Biceps', 'Triceps',
  'Abdomen', 'Gluteos', 'Cardio', 'Funcional', 'Yoga', 'Outro'
]

export default function TreinosPage() {
  const supabase = createClient()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [habit, setHabit] = useState<DailyHabit | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ type: 'Peito', duration: '', notes: '' })
  const today = format(new Date(), 'yyyy-MM-dd')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: w }, { data: h }] = await Promise.all([
      supabase.from('workouts').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(20),
      supabase.from('daily_habits').select('*').eq('user_id', user.id).eq('date', today).single(),
    ])
    if (w) setWorkouts(w)
    if (h) setHabit(h)
    setLoading(false)
  }, [supabase, today])

  useEffect(() => { load() }, [load])

  async function logWorkout() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const wasTrainedToday = habit?.trained
    const newScore = (habit?.fitlove_score || 0) + (wasTrainedToday ? 0 : 15)
    await Promise.all([
      supabase.from('workouts').insert({
        user_id: user.id,
        type: form.type,
        duration_minutes: +form.duration || 0,
        notes: form.notes,
      }),
      supabase.from('daily_habits').upsert({
        user_id: user.id, date: today,
        trained: true,
        fitlove_score: newScore,
      }, { onConflict: 'user_id,date' }),
    ])
    toast.success('Treino registrado! +15 pontos!')
    setShowForm(false)
    setForm({ type: 'Peito', duration: '', notes: '' })
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 love-gradient rounded-full animate-pulse" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Treinos</h1>
          <p className="text-white/40 text-sm">Registre seus treinos e acompanhe a evolucao</p>
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

      {/* Today status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-5 flex items-center gap-4 ${
          habit?.trained
            ? 'bg-purple-500/15 border border-purple-500/30'
            : 'glass border border-white/5'
        }`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          habit?.trained ? 'bg-purple-500/30' : 'bg-white/5'
        }`}>
          {habit?.trained
            ? <Check className="w-6 h-6 text-purple-400" />
            : <Dumbbell className="w-6 h-6 text-white/30" />
          }
        </div>
        <div>
          <p className="text-white font-semibold text-sm">
            {habit?.trained ? 'Treino concluido hoje!' : 'Sem treino registrado hoje'}
          </p>
          <p className="text-white/40 text-xs">
            {habit?.trained ? '+15 pontos conquistados' : 'Registre para ganhar +15 pontos'}
          </p>
        </div>
        {habit?.trained && <Trophy className="w-5 h-5 text-yellow-400 ml-auto" />}
      </motion.div>

      {/* Workout history */}
      <div>
        <p className="text-white/40 text-xs font-medium mb-3">HISTORICO</p>
        <div className="space-y-3">
          {workouts.length === 0 && (
            <div className="text-center py-12 text-white/20">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum treino registrado ainda</p>
            </div>
          )}
          {workouts.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 border border-white/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{w.type}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {w.duration_minutes > 0 && (
                        <span className="text-white/30 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />{w.duration_minutes}min
                        </span>
                      )}
                      <span className="text-white/30 text-xs">
                        {format(new Date(w.logged_at), "d 'de' MMM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {w.notes && (
                <div className="flex items-start gap-2 mt-3 pt-3 border-t border-white/5">
                  <FileText className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                  <p className="text-white/40 text-xs">{w.notes}</p>
                </div>
              )}
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
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold">Registrar Treino</h2>
                <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-white/40 text-xs mb-2 block">TIPO DE TREINO</label>
                  <div className="grid grid-cols-3 gap-2">
                    {WORKOUT_TYPES.map(t => (
                      <button
                        key={t}
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={`py-2 rounded-xl text-xs font-medium transition-all ${
                          form.type === t
                            ? 'love-gradient text-white'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-2 block">DURACAO (minutos)</label>
                  <input
                    type="number"
                    placeholder="Ex: 60"
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50"
                  />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-2 block">OBSERVACOES</label>
                  <textarea
                    placeholder="Como foi o treino?"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50 resize-none"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={logWorkout}
                  className="w-full love-gradient py-3 rounded-xl text-white font-semibold"
                >
                  Salvar Treino
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, Plus, X, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { Profile, DailyHabit, NutritionLog } from '@/types'

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min((value / goal) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/50">{label}</span>
        <span className="text-white/70 font-medium">{value}g <span className="text-white/30">/ {goal}g</span></span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default function NutricaoPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [habit, setHabit] = useState<DailyHabit | null>(null)
  const [logs, setLogs] = useState<NutritionLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const today = format(new Date(), 'yyyy-MM-dd')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: p }, { data: h }, { data: nl }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('daily_habits').select('*').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('nutrition_logs').select('*').eq('user_id', user.id).gte('logged_at', today).order('logged_at', { ascending: false }),
    ])
    if (p) setProfile(p)
    if (h) setHabit(h)
    if (nl) setLogs(nl)
    setLoading(false)
  }, [supabase, today])

  useEffect(() => { load() }, [load])

  async function addMeal() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !form.name) return
    const cal = +form.calories || 0
    const prot = +form.protein || 0
    const carbs = +form.carbs || 0
    const fat = +form.fat || 0
    const newCal = (habit?.calories_consumed || 0) + cal
    const calGoal = profile?.calories_goal || 2000
    const wasHit = (habit?.calories_consumed || 0) >= calGoal
    const nowHit = newCal >= calGoal
    let newScore = habit?.fitlove_score || 0
    if (!wasHit && nowHit) newScore += 10

    await Promise.all([
      supabase.from('nutrition_logs').insert({
        user_id: user.id, meal_name: form.name,
        calories: cal, protein: prot, carbs, fat,
      }),
      supabase.from('daily_habits').upsert({
        user_id: user.id, date: today,
        calories_consumed: newCal,
        protein_consumed: (habit?.protein_consumed || 0) + prot,
        carbs_consumed: (habit?.carbs_consumed || 0) + carbs,
        fat_consumed: (habit?.fat_consumed || 0) + fat,
        fitlove_score: newScore,
      }, { onConflict: 'user_id,date' }),
    ])

    toast.success(`${form.name} adicionado!`)
    if (!wasHit && nowHit) toast.success('+10 pontos! Meta calorica atingida!')
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    setShowForm(false)
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 love-gradient rounded-full animate-pulse" />
    </div>
  )

  const cal = habit?.calories_consumed || 0
  const prot = habit?.protein_consumed || 0
  const carbs = habit?.carbs_consumed || 0
  const fat = habit?.fat_consumed || 0
  const calGoal = profile?.calories_goal || 2000
  const calPct = Math.min(cal / calGoal, 1)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Nutricao</h1>
          <p className="text-white/40 text-sm">Registre suas refeicoes do dia</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="love-gradient px-4 py-2.5 rounded-xl text-white text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Refeicao
        </motion.button>
      </div>

      {/* Calories ring */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-white/5"
      >
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="56" cy="56" r="46" fill="none"
                stroke="url(#calGrad)" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 46 * calPct} ${2 * Math.PI * 46}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 1s ease' }}
              />
              <defs>
                <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff4d8d" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-white font-bold text-sm mt-0.5">{cal}</span>
              <span className="text-white/30 text-xs">kcal</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <MacroBar label="Proteina" value={prot} goal={profile?.protein_goal || 150} color="#a855f7" />
            <MacroBar label="Carboidratos" value={carbs} goal={profile?.carbs_goal || 300} color="#3b82f6" />
            <MacroBar label="Gordura" value={fat} goal={profile?.fat_goal || 60} color="#f97316" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-white/40">
          <span>Meta: {calGoal} kcal</span>
          <span>Restam: {Math.max(calGoal - cal, 0)} kcal</span>
        </div>
      </motion.div>

      {/* Meal log */}
      <div>
        <p className="text-white/40 text-xs font-medium mb-3">REFEICOES DE HOJE</p>
        {logs.length === 0 && (
          <div className="text-center py-10 text-white/20">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma refeicao registrada</p>
          </div>
        )}
        <div className="space-y-2">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 border border-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium text-sm">{log.meal_name}</span>
                <span className="text-orange-400 font-bold text-sm">{log.calories} kcal</span>
              </div>
              <div className="flex gap-3 text-xs text-white/40">
                <span>P: {log.protein}g</span>
                <span>C: {log.carbs}g</span>
                <span>G: {log.fat}g</span>
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
              className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold">Adicionar Refeicao</h2>
                <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'NOME DA REFEICAO', key: 'name', placeholder: 'Ex: Almoco, Pre-treino...', type: 'text' },
                  { label: 'CALORIAS (kcal)', key: 'calories', placeholder: '0', type: 'number' },
                  { label: 'PROTEINA (g)', key: 'protein', placeholder: '0', type: 'number' },
                  { label: 'CARBOIDRATOS (g)', key: 'carbs', placeholder: '0', type: 'number' },
                  { label: 'GORDURA (g)', key: 'fat', placeholder: '0', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-white/40 text-xs mb-1.5 block">{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-pink-500/50"
                    />
                  </div>
                ))}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={addMeal}
                  className="w-full love-gradient py-3 rounded-xl text-white font-semibold mt-2"
                >
                  Salvar Refeicao
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

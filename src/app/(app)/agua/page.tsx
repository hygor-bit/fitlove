'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Droplets, Plus, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { Profile, DailyHabit, WaterLog } from '@/types'

const QUICK_ADD = [250, 500, 750, 1000]

export default function AguaPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [habit, setHabit] = useState<DailyHabit | null>(null)
  const [logs, setLogs] = useState<WaterLog[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: prof }, { data: hab }, { data: wlogs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('daily_habits').select('*').eq('user_id', user.id).eq('date', today).single(),
      supabase.from('water_logs').select('*').eq('user_id', user.id).gte('logged_at', today).order('logged_at', { ascending: false }),
    ])
    if (prof) setProfile(prof)
    if (hab) setHabit(hab)
    if (wlogs) setLogs(wlogs)
    setLoading(false)
  }, [supabase, today])

  useEffect(() => { load() }, [load])

  async function addWater(ml: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newTotal = (habit?.water_consumed || 0) + ml
    const goal = profile?.water_goal || 3000
    const wasComplete = (habit?.water_consumed || 0) >= goal
    const nowComplete = newTotal >= goal
    let newScore = habit?.fitlove_score || 0
    if (!wasComplete && nowComplete) newScore += 10

    await Promise.all([
      supabase.from('water_logs').insert({ user_id: user.id, amount_ml: ml }),
      supabase.from('daily_habits').upsert({
        user_id: user.id, date: today,
        water_consumed: newTotal,
        fitlove_score: newScore,
      }, { onConflict: 'user_id,date' }),
    ])

    toast.success(`+${ml}ml adicionados!`)
    if (!wasComplete && nowComplete) toast.success('+10 pontos! Meta de agua batida!')
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 love-gradient rounded-full animate-pulse" />
    </div>
  )

  const consumed = habit?.water_consumed || 0
  const goal = profile?.water_goal || 3000
  const pct = Math.min(consumed / goal, 1)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Hidratacao</h1>
        <p className="text-white/40 text-sm">Acompanhe sua ingestao de agua hoje</p>
      </div>

      {/* Big water display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-8 border border-white/5 text-center relative overflow-hidden"
      >
        <div
          className="absolute bottom-0 left-0 right-0 bg-blue-500/10 transition-all duration-1000"
          style={{ height: `${pct * 100}%` }}
        />
        <div className="relative z-10">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Droplets className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          </motion.div>
          <div className="text-5xl font-black text-white mb-1">
            {(consumed / 1000).toFixed(2)}L
          </div>
          <p className="text-white/40">de {(goal / 1000).toFixed(1)}L meta</p>

          <div className="mt-6 bg-white/5 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className="text-blue-400 text-sm mt-2 font-medium">{Math.round(pct * 100)}% da meta</p>
        </div>

        {pct >= 1 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4"
          >
            <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1.5">
              <Trophy className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold">Meta batida!</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Quick add */}
      <div>
        <p className="text-white/40 text-xs font-medium mb-3">ADICIONAR RAPIDO</p>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_ADD.map(ml => (
            <motion.button
              key={ml}
              whileTap={{ scale: 0.95 }}
              onClick={() => addWater(ml)}
              className="glass border border-white/10 rounded-xl py-4 flex flex-col items-center gap-1 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all"
            >
              <Droplets className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-semibold">
                {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Custom add */}
      <CustomWaterAdd onAdd={addWater} />

      {/* Log */}
      {logs.length > 0 && (
        <div>
          <p className="text-white/40 text-xs font-medium mb-3">HISTORICO DE HOJE</p>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm">{log.amount_ml}ml</span>
                </div>
                <span className="text-white/30 text-xs">
                  {format(new Date(log.logged_at), 'HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CustomWaterAdd({ onAdd }: { onAdd: (ml: number) => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="glass rounded-xl p-4 border border-white/5">
      <p className="text-white/40 text-xs font-medium mb-3">QUANTIDADE PERSONALIZADA</p>
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="ml"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-500/50"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { if (+value > 0) { onAdd(+value); setValue('') } }}
          className="love-gradient px-4 rounded-xl text-white"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

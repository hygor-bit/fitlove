'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { BarChart3, TrendingUp, Droplets, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 rounded-xl border border-white/10 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function EstatisticasPage() {
  const supabase = createClient()
  const [habitData, setHabitData] = useState<Array<{
    date: string; agua: number; calorias: number; score: number; treino: number
  }>>([])
  const [weightData, setWeightData] = useState<Array<{ date: string; peso: number }>>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const days30 = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() })
    const startDate = format(subDays(new Date(), 29), 'yyyy-MM-dd')

    type HabitRow = { date: string; water_consumed: number; calories_consumed: number; fitlove_score: number; trained: boolean }
    type ProgressRow = { weight: number; recorded_at: string }

    const [{ data: habits }, { data: progress }] = await Promise.all([
      supabase.from('daily_habits').select('*').eq('user_id', user.id).gte('date', startDate),
      supabase.from('body_progress').select('weight, recorded_at').eq('user_id', user.id).gte('recorded_at', startDate).order('recorded_at'),
    ])

    const habitMap = new Map((habits as HabitRow[] | null)?.map(h => [h.date, h]) || [])
    setHabitData(days30.map(d => {
      const key = format(d, 'yyyy-MM-dd')
      const h = habitMap.get(key)
      return {
        date: format(d, 'dd/MM', { locale: ptBR }),
        agua: h ? Math.round(h.water_consumed / 100) / 10 : 0,
        calorias: h?.calories_consumed || 0,
        score: h?.fitlove_score || 0,
        treino: h?.trained ? 1 : 0,
      }
    }))

    setWeightData(((progress as ProgressRow[] | null) || []).map(p => ({
      date: format(new Date(p.recorded_at), 'dd/MM'),
      peso: p.weight || 0,
    })))

    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const totalTrainings = habitData.filter(d => d.treino === 1).length
  const avgWater = habitData.length
    ? (habitData.reduce((s, d) => s + d.agua, 0) / habitData.length).toFixed(1)
    : '0'
  const maxScore = Math.max(...habitData.map(d => d.score), 0)
  const streak = (() => {
    let s = 0
    for (let i = habitData.length - 1; i >= 0; i--) {
      if (habitData[i].treino === 1) s++; else break
    }
    return s
  })()

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 love-gradient rounded-full animate-pulse" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Estatisticas</h1>
        <p className="text-white/40 text-sm">Sua evolucao dos ultimos 30 dias</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Dumbbell className="w-4 h-4" />, label: 'Treinos', value: totalTrainings, unit: 'total', color: 'text-purple-400' },
          { icon: <Droplets className="w-4 h-4" />, label: 'Agua media', value: avgWater, unit: 'L/dia', color: 'text-blue-400' },
          { icon: <TrendingUp className="w-4 h-4" />, label: 'Melhor score', value: maxScore, unit: 'pts', color: 'text-yellow-400' },
          { icon: <BarChart3 className="w-4 h-4" />, label: 'Streak atual', value: streak, unit: 'dias', color: 'text-pink-400' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-2xl p-4 border border-white/5 text-center"
          >
            <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-white/30 text-xs">{s.unit}</p>
            <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Score chart */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-5 border border-white/5"
      >
        <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-pink-400" />
          FITLOVE Score
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={habitData.slice(-14)}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4d8d" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ff4d8d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="score" name="Score" stroke="#ff4d8d" fill="url(#scoreGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Water chart */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-5 border border-white/5"
      >
        <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" />
          Hidratacao (L)
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={habitData.slice(-14)} barSize={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="agua" name="Agua (L)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Weight chart */}
      {weightData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5 border border-white/5"
        >
          <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Evolucao do Peso (kg)
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="peso" name="Peso" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Training heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-5 border border-white/5"
      >
        <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-purple-400" />
          Frequencia de Treino (30 dias)
        </p>
        <div className="grid grid-cols-10 gap-1.5">
          {habitData.map((d, i) => (
            <div
              key={i}
              title={`${d.date}: ${d.treino ? 'Treinou' : 'Nao treinou'}`}
              className={`aspect-square rounded-md transition-colors ${d.treino ? 'bg-purple-500' : 'bg-white/5'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-white/30">
          <div className="w-3 h-3 rounded-sm bg-white/5" /> Sem treino
          <div className="w-3 h-3 rounded-sm bg-purple-500 ml-2" /> Treinou
        </div>
      </motion.div>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Flame, Droplets, Dumbbell, Trophy, Heart, TrendingUp, Target, Zap, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Profile, DailyHabit } from '@/types'

function ProgressRing({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1)
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  return (
    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx="44" cy="44" r={r} fill="none"
        stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  )
}

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null)
  const [habit, setHabit] = useState<DailyHabit | null>(null)
  const [partnerHabit, setPartnerHabit] = useState<DailyHabit | null>(null)
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profiles }, { data: habits }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('daily_habits').select('*').eq('date', today),
    ])

    console.log('today:', today, 'habits:', habits)

    if (profiles) {
      const me = profiles.find((p: Profile) => p.user_id === user.id)
      const partner = profiles.find((p: Profile) => p.user_id === me?.partner_id)
      setProfile(me || null)
      setPartnerProfile(partner || null)
    }

    if (habits) {
      const myHabit = habits.find((h: DailyHabit) => h.user_id === user.id)
      const partnerHab = habits.find((h: DailyHabit) => h.user_id !== user.id)
      setHabit(myHabit || null)
      setPartnerHabit(partnerHab || null)
    }

    setLoading(false)
  }, [supabase, today])

  useEffect(() => {
    loadData()
    window.addEventListener('focus', loadData)
    const interval = setInterval(loadData, 30000)
    return () => {
      window.removeEventListener('focus', loadData)
      clearInterval(interval)
    }
  }, [loadData])

  async function doCheckin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('daily_habits').upsert({
      user_id: user.id,
      date: today,
      checkin_done: true,
      fitlove_score: (habit?.fitlove_score || 0) + 5,
    }, { onConflict: 'user_id,date' })
    if (!error) {
      toast.success('+5 pontos! Check-in feito!')
      loadData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 love-gradient rounded-full animate-pulse" />
      </div>
    )
  }

  const myScore = habit?.fitlove_score || 0
  const partnerScore = partnerHabit?.fitlove_score || 0
  const myIsLeading = myScore >= partnerScore
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-white/30 text-sm capitalize">{todayFormatted}</p>
        <h1 className="text-2xl font-black text-white mt-1">
          Ola, <span className="love-gradient-text">{profile?.name || 'Atleta'}</span>
        </h1>
        <p className="text-white/40 text-sm">Evoluindo juntos todos os dias.</p>
      </motion.div>

      {/* Couple Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 border border-white/5 glow-pink"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            <span className="text-white font-semibold">Ranking de Hoje</span>
          </div>
          <div className="flex items-center gap-1.5 glass px-3 py-1.5 rounded-full">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-white/60 text-xs">7 dias</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { p: profile, h: habit, isLeading: myIsLeading, rank: myIsLeading ? 1 : 2 },
            { p: partnerProfile, h: partnerHabit, isLeading: !myIsLeading, rank: myIsLeading ? 2 : 1 },
          ].map(({ p, h, isLeading, rank }) => (
            <div
              key={rank}
              className={`rounded-xl p-4 text-center ${
                isLeading
                  ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/20'
                  : 'bg-white/3 border border-white/5'
              }`}
            >
              {p?.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt={p.name}
                  className="w-12 h-12 rounded-xl object-cover mx-auto mb-3"
                />
              ) : (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white mx-auto mb-3 ${
                  p?.name?.[0] === 'H'
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    : 'bg-gradient-to-br from-pink-500 to-rose-500'
                }`}>
                  {p?.name?.[0] || '?'}
                </div>
              )}
              <p className="text-white font-semibold text-sm">{p?.name || '---'}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-2xl">{rank === 1 ? '🥇' : '🥈'}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-lg">{h?.fitlove_score || 0}</span>
                <span className="text-white/30 text-xs">pts</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Habit Trackers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: <Droplets className="w-5 h-5" />,
            label: 'Agua',
            value: ((habit?.water_consumed || 0) / 1000).toFixed(1) + 'L',
            goal: ((profile?.water_goal || 3000) / 1000).toFixed(0) + 'L',
            pct: (habit?.water_consumed || 0) / (profile?.water_goal || 3000),
            color: '#3b82f6',
            href: '/agua',
          },
          {
            icon: <Dumbbell className="w-5 h-5" />,
            label: 'Treino',
            value: habit?.trained ? 'Feito!' : 'Pendente',
            goal: '1 treino',
            pct: habit?.trained ? 1 : 0,
            color: '#a855f7',
            href: '/treinos',
          },
          {
            icon: <Target className="w-5 h-5" />,
            label: 'Calorias',
            value: `${habit?.calories_consumed || 0}kcal`,
            goal: `${profile?.calories_goal || 2000}kcal`,
            pct: (habit?.calories_consumed || 0) / (profile?.calories_goal || 2000),
            color: '#f97316',
            href: '/nutricao',
          },
          {
            icon: <Zap className="w-5 h-5" />,
            label: 'Score',
            value: `${myScore}pts`,
            goal: '40pts',
            pct: myScore / 40,
            color: '#eab308',
            href: '/dashboard',
          },
        ].map((item, i) => (
          <motion.a
            key={item.label}
            href={item.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            className="glass rounded-2xl p-4 flex flex-col items-center gap-2 border border-white/5 hover:border-white/10 transition-all cursor-pointer"
          >
            <div className="relative">
              <ProgressRing value={item.pct} max={1} color={item.color} />
              <div className="absolute inset-0 flex items-center justify-center" style={{ color: item.color }}>
                {item.icon}
              </div>
            </div>
            <p className="text-white font-semibold text-sm text-center">{item.value}</p>
            <p className="text-white/30 text-xs">{item.label} - {item.goal}</p>
          </motion.a>
        ))}
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6 border border-white/5"
      >
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-pink-400" />
          Acoes Rapidas
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={doCheckin}
            disabled={habit?.checkin_done}
            className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
              habit?.checkin_done
                ? 'bg-green-500/10 border border-green-500/20 text-green-400 cursor-default'
                : 'love-gradient text-white hover:opacity-90'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            {habit?.checkin_done ? 'Check-in feito' : 'Check-in diario (+5pts)'}
          </button>
          <a
            href="/treinos"
            className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all ${
              habit?.trained
                ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400 cursor-default'
                : 'bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            {habit?.trained ? 'Treino feito' : 'Registrar treino (+15pts)'}
          </a>
          <a
            href="/agua"
            className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all"
          >
            <Droplets className="w-4 h-4" />
            Adicionar agua (+10pts)
          </a>
          <a
            href="/nutricao"
            className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all"
          >
            <Target className="w-4 h-4" />
            Registrar refeicao
          </a>
        </div>
      </motion.div>

      {/* Score rules */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-2xl p-4 border border-white/5"
      >
        <p className="text-white/40 text-xs font-medium mb-3">COMO GANHAR PONTOS</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Check-in diario', pts: '+5' },
            { label: 'Agua concluida', pts: '+10' },
            { label: 'Treino feito', pts: '+15' },
            { label: 'Calorias atingidas', pts: '+10' },
          ].map(r => (
            <div key={r.label} className="flex items-center justify-between py-1">
              <span className="text-white/40 text-xs">{r.label}</span>
              <span className="text-pink-400 text-xs font-bold">{r.pts}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

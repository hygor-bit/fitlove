'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, TrendingUp, Droplets, Dumbbell, Users, Star, ChevronRight, Flame, Trophy, MessageCircle } from 'lucide-react'

const features = [
  {
    icon: <Dumbbell className="w-6 h-6" />,
    title: 'Treinos Sincronizados',
    desc: 'Registre seus treinos e veja a evolução do casal em tempo real.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: <Droplets className="w-6 h-6" />,
    title: 'Hidratação Diária',
    desc: 'Metas de água personalizadas com lembretes e progresso visual.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Progresso Corporal',
    desc: 'Fotos antes e depois, medidas e evolução de peso com gráficos.',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'Feed do Casal',
    desc: 'Compartilhe conquistas, motivações e mensagens especiais.',
    color: 'from-orange-500 to-amber-600',
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: 'FITLOVE Score',
    desc: 'Sistema de pontuação gamificado para motivar o casal diariamente.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Mural do Amor',
    desc: 'Espaço exclusivo para mensagens motivacionais ao seu parceiro.',
    color: 'from-pink-400 to-red-500',
  },
]

const stats = [
  { value: '100%', label: 'Personalizado' },
  { value: '2x', label: 'Mais motivação' },
  { value: '∞', label: 'Progresso juntos' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070707] grid-bg overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-pink-600/8 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 love-gradient rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-xl font-bold love-gradient-text">FITLOVE</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3"
        >
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm love-gradient text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Começar
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-20 pb-32 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs text-white/60 mb-8">
            <Flame className="w-3 h-3 text-pink-400" />
            <span>Plataforma fitness premium para casais</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-4 leading-none">
            FIT
            <span className="love-gradient-text">LOVE</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/40 font-light mb-3">
            "Evoluindo juntos todos os dias."
          </p>

          <p className="text-white/50 max-w-lg mx-auto mb-12 text-base leading-relaxed">
            A plataforma definitiva para casais que querem transformar o corpo e a vida juntos, com acompanhamento completo de hábitos, treinos e progresso.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="group flex items-center gap-2 love-gradient text-white px-8 py-4 rounded-xl font-semibold text-base hover:opacity-90 transition-all glow-pink"
            >
              <Heart className="w-4 h-4 fill-white" />
              Começar Jornada
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 glass text-white/70 px-8 py-4 rounded-xl font-medium text-base hover:text-white transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </motion.div>

        {/* Couple avatars preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-20 flex justify-center gap-6"
        >
          {[
            { letter: 'H', name: 'Hygor', score: 40, color: 'from-blue-500 to-cyan-500' },
            { letter: 'J', name: 'Júlia', score: 35, color: 'from-pink-500 to-rose-500' },
          ].map((user, i) => (
            <motion.div
              key={user.letter}
              className="glass rounded-2xl p-6 flex flex-col items-center gap-3 w-36"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 2 }}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${user.color} rounded-2xl flex items-center justify-center text-2xl font-black text-white`}>
                {user.letter}
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">{user.name}</p>
                <p className="text-white/40 text-xs">{user.score} pts hoje</p>
              </div>
              <div className="flex items-center gap-1 text-yellow-400 text-xs">
                <Star className="w-3 h-3 fill-yellow-400" />
                <span>7 dias 🔥</span>
              </div>
            </motion.div>
          ))}
          <div className="flex items-center self-center">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500 float" />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-black love-gradient-text">{s.value}</p>
              <p className="text-white/40 text-sm mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Tudo que o casal precisa
          </h2>
          <p className="text-white/40 max-w-md mx-auto">
            Uma plataforma completa para acompanhar a jornada fitness juntos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-6 hover:glass-strong transition-all group"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feed preview mockup */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="glass rounded-3xl p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-white/30 text-xs ml-2">Feed FITLOVE</span>
          </div>
          <div className="space-y-4">
            {[
              { avatar: 'H', name: 'Hygor', text: 'Treino de peito concluído 💪 Batendo meta de proteína hoje!', time: '2h', likes: 1 },
              { avatar: 'J', name: 'Júlia', text: 'Meta de água batida! 3 litros hoje 💧 Muito orgulho!', time: '4h', likes: 1 },
              { avatar: 'H', name: 'Hygor', text: '12 dias consecutivos juntos 🔥 Não vamos parar agora!', time: '1d', likes: 1 },
            ].map((post, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-3 p-4 rounded-xl bg-white/3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${post.avatar === 'H' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-pink-500 to-rose-500'}`}>
                  {post.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-medium">{post.name}</span>
                    <span className="text-white/30 text-xs">{post.time}</span>
                  </div>
                  <p className="text-white/60 text-sm">{post.text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button className="flex items-center gap-1 text-pink-400 text-xs">
                      <Heart className="w-3 h-3 fill-pink-400" /> {post.likes}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-24 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="love-gradient rounded-3xl p-12">
            <h2 className="text-3xl font-black text-white mb-3">
              Prontos para evoluir juntos?
            </h2>
            <p className="text-white/70 mb-8">
              Crie sua conta gratuitamente e comece hoje a jornada de vocês.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-pink-600 px-8 py-4 rounded-xl font-bold hover:bg-white/90 transition-all"
            >
              <Heart className="w-4 h-4 fill-pink-600" />
              Começar Agora
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-white/20 text-sm border-t border-white/5">
        <p>© 2025 FITLOVE · Evoluindo juntos todos os dias ❤️</p>
      </footer>
    </div>
  )
}

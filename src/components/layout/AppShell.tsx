'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Rss, Dumbbell, UtensilsCrossed, Droplets,
  TrendingUp, BarChart3, Heart, User, LogOut, Menu, X, ChevronRight, MessageCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/feed', icon: Rss, label: 'Feed' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/treinos', icon: Dumbbell, label: 'Treinos' },
  { href: '/nutricao', icon: UtensilsCrossed, label: 'Nutricao' },
  { href: '/agua', icon: Droplets, label: 'Agua' },
  { href: '/progresso', icon: TrendingUp, label: 'Progresso' },
  { href: '/estatisticas', icon: BarChart3, label: 'Stats' },
  { href: '/mural', icon: Heart, label: 'Mural' },
  { href: '/perfil', icon: User, label: 'Perfil' },
]

// Bottom nav shows only the most important items on mobile
const bottomNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/feed', icon: Rss, label: 'Feed' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/agua', icon: Droplets, label: 'Agua' },
  { href: '/perfil', icon: User, label: 'Perfil' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#070707] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 p-4 fixed inset-y-0 left-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 love-gradient rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-lg font-black love-gradient-text">FITLOVE</span>
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  active
                    ? 'love-gradient text-white font-medium'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-white/60 transition-colors mt-4"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 w-72 z-50 bg-[#0a0a0a] border-r border-white/5 p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="w-8 h-8 love-gradient rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </div>
                  <span className="text-lg font-black love-gradient-text">FITLOVE</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {navItems.map(item => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        active ? 'love-gradient text-white font-medium' : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/30 hover:text-white/60 transition-colors">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 sticky top-0 z-30 bg-[#070707]/90 backdrop-blur-md">
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            <span className="font-black love-gradient-text text-base">FITLOVE</span>
          </Link>
          <Link href="/perfil" className="text-white/60 hover:text-white p-1">
            <User className="w-5 h-5" />
          </Link>
        </header>

        {/* Page content — pb-24 on mobile to clear bottom nav */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 p-4 pb-28 lg:pb-8 lg:p-8"
        >
          {children}
        </motion.main>
      </div>

      {/* Bottom nav — mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/5 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl relative"
              >
                {active && (
                  <motion.div
                    layoutId="bottomNavActive"
                    className="absolute inset-0 love-gradient rounded-xl opacity-20"
                    transition={{ type: 'spring', bounce: 0.2 }}
                  />
                )}
                <item.icon
                  className={`w-5 h-5 transition-colors ${active ? 'text-pink-400' : 'text-white/30'}`}
                />
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-pink-400' : 'text-white/30'}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

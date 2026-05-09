import { login } from '@/app/login/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowRight, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-[#0a0812] text-zinc-50 font-manrope overflow-hidden">

      {/* Mesh gradient background — matches landing */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#fdd393] blur-[180px] opacity-40 mix-blend-screen" />
        <div className="absolute top-[10%] left-[10%] w-[70%] h-[70%] rounded-full bg-[#7e3af2] blur-[200px] opacity-20 mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[#150e28] blur-[200px] opacity-90" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <span className="font-archivo text-3xl font-black tracking-tight text-white mb-2">Quickqi</span>
          <p className="text-zinc-400 text-sm font-medium">Sign in to your account</p>
        </div>

        {/* Glass card */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(126,58,242,0.12)]">
          <form action={login} className="space-y-5">

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  className="pl-10 h-12 bg-zinc-800/60 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#7e3af2]/50 focus-visible:border-[#7e3af2]/50 rounded-xl transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs font-medium text-[#b682ff] hover:text-[#7e3af2] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••••••"
                  required
                  className="pl-10 h-12 bg-zinc-800/60 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#7e3af2]/50 focus-visible:border-[#7e3af2]/50 rounded-xl transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-2 bg-[#7e3af2] hover:bg-[#6c2bd9] text-white font-bold text-base rounded-xl transition-all hover:-translate-y-0.5 shadow-[0_0_30px_rgba(126,58,242,0.35)] gap-2"
            >
              Sign In <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-center text-sm text-zinc-500 pt-2">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-bold text-[#b682ff] hover:text-white transition-colors">
                Create one free
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-8 uppercase tracking-widest font-medium">
          No credit card required · 30-day free trial
        </p>
      </div>
    </div>
  )
}
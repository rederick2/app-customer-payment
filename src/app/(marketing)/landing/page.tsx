import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  ArrowRight, CheckCircle2, Zap, Users, FileText, Briefcase,
  Clock, RefreshCw, Sparkles, Star, ChevronRight, BarChart3,
  Shield, Smartphone
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Quotes & Invoices',
    description: 'Create professional, branded quotes in minutes. Convert them to jobs with one click and send polished PDF invoices.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
  },
  {
    icon: Briefcase,
    title: 'Job Management',
    description: 'Track every project from quote to completion. Assign tasks, monitor progress, and keep your team aligned.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/20',
  },
  {
    icon: Users,
    title: 'Client CRM',
    description: 'Keep a full history of every client, their jobs, and communications. Never lose context again.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
  },
  {
    icon: Clock,
    title: 'Team Timesheets',
    description: 'Workers clock in from their phone. You approve hours and sync them to QuickBooks with a single click.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
  },
  {
    icon: RefreshCw,
    title: 'QuickBooks Sync',
    description: 'Stop double-entering data. Sync approved time entries directly to QuickBooks Online seamlessly.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/20',
  },
  {
    icon: Sparkles,
    title: 'AI Analytics',
    description: 'Ask your data anything. Our built-in AI assistant surfaces revenue trends and business insights instantly.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/20',
  },
];

const steps = [
  { num: '01', title: 'Create a Quote', desc: 'Add your client, itemize the work, and send a professional quote in under 3 minutes.' },
  { num: '02', title: 'Run the Job', desc: 'Convert the quote to an active job. Assign team members, track tasks, and log hours.' },
  { num: '03', title: 'Get Paid', desc: 'Invoice the client, sync to QuickBooks, and watch your revenue grow month over month.' },
];

const testimonials = [
  {
    body: 'Quickqi completely replaced our spreadsheet chaos. The moment I converted our first quote to a job I knew this was the tool we needed.',
    author: 'Marcus T.',
    role: 'General Contractor',
  },
  {
    body: 'The QuickBooks sync alone saves us 4 hours a week. Approving timesheets and syncing to QBO takes 5 minutes now.',
    author: 'Sandra R.',
    role: 'Owner, SR Electrical',
  },
  {
    body: 'My guys log their hours from their phones. I approve from mine. It just works. Super clean app.',
    author: 'Daniel K.',
    role: 'HVAC Business Owner',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'Perfect for solo contractors.',
    features: ['Unlimited quotes & invoices', 'Up to 50 clients', '2 team members', 'PDF export', 'Email support'],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/mo',
    description: 'For growing service businesses.',
    features: ['Everything in Starter', 'Unlimited clients & team', 'Timesheets & QBO sync', 'AI analytics assistant', 'Priority support'],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large operations.',
    features: ['Everything in Pro', 'Custom integrations', 'Dedicated onboarding', 'SLA guarantee', 'Custom reporting'],
    cta: 'Contact us',
    highlighted: false,
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to app if already logged in
  if (user) {
    redirect('/');
  }

  // Pure dark mode wrapper specifically for the landing page
  return (
    <div className="flex-1 w-full flex flex-col min-h-screen relative overflow-x-hidden text-zinc-50 selection:bg-purple-500/30 font-manrope bg-[#0a0812]">

      {/* ── Mesh Gradient Background ──────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top-left vibrant peach/yellow glow */}
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#fdd393] blur-[180px] opacity-60 mix-blend-screen" />
        
        {/* Center-left vibrant purple */}
        <div className="absolute top-[10%] left-[10%] w-[70%] h-[70%] rounded-full bg-[#7e3af2] blur-[200px] opacity-30 mix-blend-screen" />
        
        {/* Bottom-right deep midnight violet */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[#150e28] blur-[200px] opacity-90" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* ── Nav ───────────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0812]/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <span className="font-archivo text-xl font-bold tracking-tight text-white">Quickqi</span>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors hidden md:block">
                Sign in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white text-zinc-950 px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all hover:-translate-y-0.5 shadow-[0_4px_14px_0_rgba(255,255,255,0.2)]"
              >
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section className="relative pt-40 pb-24 px-6 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-8">
            <span className="h-2 w-2 rounded-full bg-[#fdd393] shadow-[0_0_10px_rgba(253,211,147,0.8)] animate-pulse" />
            30-day free trial · Built for contractors & service businesses
          </div>

          <h1 className="font-archivo text-6xl md:text-8xl font-black tracking-tight max-w-5xl mb-8 leading-[1.1]">
            <span className="text-white">Quote. Invoice.</span><br />
            <span className="bg-gradient-to-r from-[#fdd393] via-[#b682ff] to-[#7e3af2] bg-clip-text text-transparent drop-shadow-sm">
              Get paid faster.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-300 max-w-3xl mb-12 leading-relaxed">
            The all-in-one platform to run your service business — from quotes to jobs to timesheets — with QuickBooks sync built in.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-20 w-full justify-center">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#7e3af2] text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-[#6c2bd9] transition-all hover:-translate-y-1 shadow-[0_0_40px_rgba(126,58,242,0.4)]"
            >
              Start 30-day free trial <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/10 bg-white/5 backdrop-blur px-8 py-4 rounded-2xl text-lg font-medium text-white hover:bg-white/10 transition-all hover:-translate-y-0.5"
            >
              See how it works <ChevronRight className="h-5 w-5" />
            </a>
          </div>

          {/* Stats bar */}
          <div className="relative w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl">
            {[
              { value: '3 min', label: 'To create a quote' },
              { value: '1-click', label: 'QuickBooks sync' },
              { value: '100%', label: 'Mobile-ready PWA' },
              { value: '∞', label: 'Clients & jobs' },
            ].map(({ value, label }) => (
              <div key={label} className="p-4 text-center">
                <p className="font-archivo text-3xl font-black text-white mb-1">{value}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">{label}</p>
              </div>
            ))}
          </div>
        </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="relative py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]">Everything you need</p>
            <h2 className="font-archivo text-4xl md:text-6xl font-bold tracking-tight text-white">One platform, zero chaos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur transition-all duration-300 hover:border-white/20 hover:-translate-y-2 hover:bg-zinc-800/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 -z-10" />
                <div className="flex flex-col items-center text-center">
                  <div className={`${bg} ${color} p-4 rounded-2xl mb-6 transition-transform duration-300 group-hover:scale-110 shadow-inner`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-archivo text-xl font-bold mb-3 text-white">{title}</h3>
                  <p className="text-base text-zinc-400 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-32 px-6 border-t border-white/5 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">Simple by design</p>
            <h2 className="font-archivo text-4xl md:text-6xl font-bold tracking-tight text-white">Up and running in minutes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-[45%] left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />
            
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-zinc-950 border border-white/10 flex items-center justify-center mb-8 shadow-xl shadow-black">
                  <p className="font-archivo text-3xl font-black bg-gradient-to-br from-zinc-300 to-zinc-600 bg-clip-text text-transparent">{num}</p>
                </div>
                <h3 className="font-archivo text-2xl font-bold mb-4 text-white">{title}</h3>
                <p className="text-base text-zinc-400 leading-relaxed max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────── */}
      <section className="relative py-32 px-6 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[150px] mix-blend-screen" />
          <div className="absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-pink-600/10 blur-[150px] mix-blend-screen" />
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-400 mb-4 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]">Real businesses, real results</p>
            <h2 className="font-archivo text-4xl md:text-6xl font-bold tracking-tight text-white">Loved by service pros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ body, author, role }) => (
              <div
                key={author}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur flex flex-col items-center text-center transition-all duration-300 hover:border-white/20 hover:-translate-y-2 hover:bg-zinc-800/50"
              >
                <div className="flex mb-6 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                  ))}
                </div>
                <p className="text-lg text-zinc-300 leading-relaxed mb-8 flex-1">&ldquo;{body}&rdquo;</p>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center text-white font-black text-lg shadow-inner">
                    {author[0]}
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">{author}</p>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" className="relative py-32 px-6 border-t border-white/5 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">Pricing</p>
            <h2 className="font-archivo text-4xl md:text-6xl font-bold tracking-tight text-white">Simple, transparent pricing</h2>
            <p className="text-xl text-zinc-400 mt-6 max-w-2xl mx-auto">30-day free trial on all plans. No credit card required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {pricingPlans.map(({ name, price, period, description, features, cta, highlighted }) => (
              <div
                key={name}
                className={`relative rounded-3xl p-8 flex flex-col transition-all duration-300 ${
                  highlighted
                    ? 'border-2 border-indigo-500 bg-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.15)] md:-translate-y-4'
                    : 'border border-white/10 bg-zinc-900/50 backdrop-blur hover:border-white/20'
                }`}
              >
                {highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="font-archivo text-2xl font-bold mb-2 text-white">{name}</h3>
                  <p className="text-sm text-zinc-400">{description}</p>
                </div>

                <div className="text-center mb-8">
                  <span className="font-archivo text-6xl font-black text-white">{price}</span>
                  <span className="text-zinc-500 text-lg font-medium">{period}</span>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-base justify-center sm:justify-start">
                      <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-bold transition-all hover:-translate-y-1 ${
                    highlighted
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/25'
                      : 'bg-white text-zinc-950 hover:bg-zinc-200'
                  }`}
                >
                  {cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="relative py-40 px-6 overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-blue-600/20 blur-[150px] mix-blend-screen" />
        </div>

        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] text-zinc-300 mb-8">
            <Zap className="h-4 w-4 text-amber-400" />
            Start in under 3 minutes
          </div>
          <h2 className="font-archivo text-5xl md:text-7xl font-black tracking-tight mb-8 text-white leading-[1.1]">
            Ready to run a tighter ship?
          </h2>
          <p className="text-xl text-zinc-400 mb-12 leading-relaxed max-w-2xl mx-auto">
            Join hundreds of contractors already using Quickqi to quote faster, manage better, and get paid without the headache.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-zinc-950 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-zinc-200 transition-all hover:-translate-y-1 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            Start your 30-day free trial <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-sm font-medium text-zinc-500 mt-6 uppercase tracking-wider">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#0a0812]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <span className="font-archivo text-2xl font-black text-white tracking-tight">Quickqi</span>
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
          </div>
          <p className="text-sm font-medium text-zinc-500">© {new Date().getFullYear()} Quickqi. All rights reserved.</p>
        </div>
      </footer>
      </div> {/* <-- Closes relative z-10 wrapper */}

    </div>
  );
}

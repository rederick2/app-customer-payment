import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logout } from '@/app/login/actions';
import {
  CheckCircle2, Zap, Users, FileText, Briefcase,
  Clock, RefreshCw, Sparkles, ArrowRight, LogOut, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTrialDaysRemaining, isTrialExpired, TRIAL_DURATION_DAYS } from '@/lib/trial';
import Link from 'next/link';

const features = [
  { icon: FileText, label: 'Unlimited quotes and invoices', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { icon: Briefcase, label: 'Full job management', color: 'text-violet-400', bg: 'bg-violet-500/20' },
  { icon: Users, label: 'Unlimited client CRM', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { icon: Clock, label: 'Team timesheets', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { icon: RefreshCw, label: 'QuickBooks synchronization', color: 'text-teal-400', bg: 'bg-teal-500/20' },
  { icon: Sparkles, label: 'AI Analytical Assistant', color: 'text-pink-400', bg: 'bg-pink-500/20' },
];

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get trial info
  const { data: profile } = await supabase
    .from('users')
    .select('trial_started_at, display_name, email')
    .eq('id', user.id)
    .single();

  const trialStartedAt = profile?.trial_started_at ?? null;
  const expired = isTrialExpired(trialStartedAt);
  const daysRemaining = getTrialDaysRemaining(trialStartedAt);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#0a0812] text-zinc-50 font-manrope flex flex-col items-center">

      {/* Background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#7e3af2] blur-[200px] opacity-20 mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[#150e28] blur-[200px] opacity-90" />
        {expired && (
          <div className="absolute top-[20%] left-[30%] w-[50%] h-[50%] rounded-full bg-red-900/30 blur-[200px]" />
        )}
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-20 flex flex-col items-center">

        {/* Status badge */}
        <div className={`inline-flex items-center gap-2 border px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-10 backdrop-blur ${
          expired
            ? 'border-red-500/30 bg-red-500/10 text-red-400'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
        }`}>
          <span className={`h-2 w-2 rounded-full ${expired ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
          {expired ? 'Trial expired' : `Active trial — ${daysRemaining} days remaining`}
        </div>

        {/* Heading */}
        <h1 className="font-archivo text-5xl md:text-7xl font-black text-center tracking-tight mb-6 leading-[1.1]">
          {expired ? (
            <>
              <span className="text-white">Your</span>{' '}
              <span className="bg-gradient-to-r from-red-400 via-red-300 to-orange-400 bg-clip-text text-transparent">
                {TRIAL_DURATION_DAYS}-day trial
              </span>
              <br />
              <span className="text-white">has expired</span>
            </>
          ) : (
            <>
              <span className="text-white">Continue with</span>{' '}
              <span className="bg-gradient-to-r from-[#fdd393] via-[#b682ff] to-[#7e3af2] bg-clip-text text-transparent">
                Quickqi
              </span>
            </>
          )}
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 text-center max-w-2xl mb-14 leading-relaxed">
          {expired
            ? 'To continue using all of Quickqi\'s features, contact our team to activate your plan.'
            : `You have ${daysRemaining} days remaining of your free trial. Subscribe now to keep access.`}
        </p>

        {/* Features grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
          {features.map(({ icon: Icon, label, color, bg }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur p-5 hover:border-white/20 transition-all hover:-translate-y-0.5"
            >
              <div className={`${bg} ${color} p-3 rounded-xl shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <p className="text-sm font-semibold text-zinc-200">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing teaser */}
        <div className="w-full rounded-3xl border-2 border-indigo-500/60 bg-indigo-500/10 p-10 mb-10 text-center shadow-[0_0_60px_rgba(99,102,241,0.12)]">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-400 mb-3">Pro Plan</p>
          <p className="font-archivo text-6xl font-black text-white mb-1">$99</p>
          <p className="text-zinc-500 font-medium mb-8">/month · No contract, cancel anytime</p>

          <a
            href="mailto:hello@quickqi.app?subject=I%20want%20to%20subscribe%20to%20Quickqi"
            className="inline-flex items-center gap-3 bg-indigo-500 hover:bg-indigo-600 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all hover:-translate-y-1 shadow-lg shadow-indigo-500/30"
          >
            <Mail className="h-5 w-5" />
            Contact to subscribe
            <ArrowRight className="h-5 w-5" />
          </a>

          <p className="text-xs text-zinc-600 mt-5 uppercase tracking-wider">
            Our team will contact you in less than 24 hours
          </p>
        </div>

        {/* Back / logout */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {!expired && (
            <Link
              href="/"
              className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all"
            >
              ← Back to dashboard
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


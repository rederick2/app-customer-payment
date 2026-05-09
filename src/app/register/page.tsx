'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { signup } from '@/app/register/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import {
  ArrowRight, ArrowLeft, Check, Mail, Lock, Phone, MapPin,
  Building2, Users, Briefcase, Wrench, ChevronDown, AlertCircle
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Account', description: 'Your login credentials' },
  { id: 2, label: 'Company', description: 'About your business' },
  { id: 3, label: 'Team', description: 'Size & sector' },
]

const SECTORS = [
  'General Contracting',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Roofing',
  'Landscaping',
  'Painting',
  'Flooring',
  'Cleaning Services',
  'Pest Control',
  'Carpentry',
  'Masonry',
  'Other',
]

const WORKER_RANGES = [
  'Just me',
  '2 – 5 workers',
  '6 – 15 workers',
  '16 – 50 workers',
  '50+ workers',
]

export default function RegisterPage() {
  const [step, setStep] = useState(1)

  // Step 1 — credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 2 — company
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [website, setWebsite] = useState('')

  // Step 3 — team / sector
  const [workers, setWorkers] = useState('')
  const [sector, setSector] = useState('')
  const [jobTypes, setJobTypes] = useState('')

  const searchParams = useSearchParams()
  const urlError = searchParams.get('error') ?? ''

  const [passwordError, setPasswordError] = useState('')
  const [submitError, setSubmitError] = useState(urlError)
  const [isLoading, setIsLoading] = useState(false)

  // When URL has ?error, go back to step 1 and reset loading
  useEffect(() => {
    if (urlError) {
      setSubmitError(urlError)
      setIsLoading(false)
      setStep(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlError])

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100

  function nextStep() {
    if (step === 1) {
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match.')
        return
      }
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters.')
        return
      }
      setPasswordError('')
    }
    setStep(s => s + 1)
  }

  function prevStep() {
    setStep(s => s - 1)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Guard: if not on final step (e.g. user pressed Enter), advance step instead
    if (step < STEPS.length) {
      nextStep()
      return
    }

    setIsLoading(true)
    setSubmitError('')
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)
      formData.append('phone', phone)
      formData.append('address', address)
      formData.append('company_name', companyName)
      formData.append('website', website)
      formData.append('workers', workers)
      formData.append('sector', sector)
      formData.append('job_types', jobTypes)
      await signup(formData)
    } catch (err: unknown) {
      // next/navigation redirect throws NEXT_REDIRECT — ignore it (it's a success redirect)
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('NEXT_REDIRECT')) {
        setSubmitError('Something went wrong. Please try again.')
        setIsLoading(false)
      }
      // If it IS a NEXT_REDIRECT, the page will navigate — state resets via useEffect above
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0812] text-zinc-50 font-manrope overflow-hidden">

      {/* Mesh gradient background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#fdd393] blur-[180px] opacity-40 mix-blend-screen" />
        <div className="absolute top-[10%] left-[10%] w-[70%] h-[70%] rounded-full bg-[#7e3af2] blur-[200px] opacity-20 mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[#150e28] blur-[200px] opacity-90" />
      </div>

      <div className="relative z-10 w-full max-w-lg">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <span className="font-archivo text-3xl font-black tracking-tight text-white mb-2">Quickqi</span>
          <p className="text-zinc-400 text-sm font-medium">Create your free account — 30-day trial included</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8 relative">
          {/* Progress line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10 -z-10" />
          <div
            className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-[#fdd393] to-[#7e3af2] -z-10 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />

          {STEPS.map(s => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 ${step > s.id
                ? 'border-[#7e3af2] bg-[#7e3af2] text-white shadow-[0_0_12px_rgba(126,58,242,0.5)]'
                : step === s.id
                  ? 'border-[#b682ff] bg-zinc-900 text-[#b682ff] shadow-[0_0_12px_rgba(182,130,255,0.3)]'
                  : 'border-white/10 bg-zinc-900 text-zinc-600'
                }`}>
                {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest hidden sm:block transition-colors ${step >= s.id ? 'text-zinc-300' : 'text-zinc-600'
                }`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step heading */}
        <div className="mb-6">
          <h2 className="font-archivo text-2xl font-black text-white">{STEPS[step - 1].label}</h2>
          <p className="text-sm text-zinc-500 mt-1">{STEPS[step - 1].description}</p>
        </div>

        {/* Glass card */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(126,58,242,0.12)]">
          <form onSubmit={handleSubmit}>

            {/* ── STEP 1: Account ───────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-zinc-800/60 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#7e3af2]/50 focus-visible:border-[#7e3af2]/50 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type="password"
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-zinc-800/60 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#7e3af2]/50 focus-visible:border-[#7e3af2]/50 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type="password"
                      placeholder="Repeat your password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="pl-10 h-12 bg-zinc-800/60 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#7e3af2]/50 focus-visible:border-[#7e3af2]/50 rounded-xl"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-400 font-medium mt-1">{passwordError}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: Company ───────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type="text"
                      placeholder="Acme Contracting LLC"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      className="pl-10 h-12 bg-zinc-800/60 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#7e3af2]/50 focus-visible:border-[#7e3af2]/50 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="pl-10 h-12 bg-zinc-800/60 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#7e3af2]/50 focus-visible:border-[#7e3af2]/50 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Business Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      type="text"
                      placeholder="123 Main St, Austin TX"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      className="pl-10 h-12 bg-zinc-800/60 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#7e3af2]/50 focus-visible:border-[#7e3af2]/50 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Website <span className="text-zinc-600 normal-case tracking-normal font-medium">(optional)</span></Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">🌐</span>
                    <Input
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      className="pl-10 h-12 bg-zinc-800/60 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-[#7e3af2]/50 focus-visible:border-[#7e3af2]/50 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Team & Sector ─────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    <Users className="inline h-3.5 w-3.5 mr-1.5 opacity-60" />
                    Number of Workers
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {WORKER_RANGES.map(range => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setWorkers(range)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${workers === range
                          ? 'border-[#7e3af2] bg-[#7e3af2]/15 text-white shadow-[0_0_12px_rgba(126,58,242,0.2)]'
                          : 'border-white/10 bg-zinc-800/40 text-zinc-400 hover:border-white/20 hover:bg-zinc-800/60'
                          }`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${workers === range ? 'border-[#7e3af2] bg-[#7e3af2]' : 'border-zinc-600'
                          }`}>
                          {workers === range && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    <Briefcase className="inline h-3.5 w-3.5 mr-1.5 opacity-60" />
                    Business Sector
                  </Label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                    <select
                      value={sector}
                      onChange={e => setSector(e.target.value)}
                      className="w-full h-12 bg-zinc-800/60 border border-white/10 text-zinc-100 rounded-xl px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-[#7e3af2]/50 focus:border-[#7e3af2]/50 transition-all text-sm"
                    >
                      <option value="" className="bg-zinc-900">Select your sector...</option>
                      {SECTORS.map(s => (
                        <option key={s} value={s} className="bg-zinc-900">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    <Wrench className="inline h-3.5 w-3.5 mr-1.5 opacity-60" />
                    Main Types of Work <span className="text-zinc-600 normal-case tracking-normal font-medium">(optional)</span>
                  </Label>
                  <textarea
                    placeholder="e.g. Bathroom remodels, roofing repairs, deck installations..."
                    value={jobTypes}
                    onChange={e => setJobTypes(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-800/60 border border-white/10 text-zinc-100 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7e3af2]/50 focus:border-[#7e3af2]/50 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center gap-3 mt-8">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 h-12 border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white rounded-xl font-bold gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}

              {step < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 h-12 bg-[#7e3af2] hover:bg-[#6c2bd9] text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 shadow-[0_0_30px_rgba(126,58,242,0.35)] gap-2"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-12 inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all select-none bg-gradient-to-r from-[#7e3af2] to-[#b682ff] hover:from-[#6c2bd9] hover:to-[#a370f0] text-white font-bold rounded-xl hover:-translate-y-0.5 shadow-[0_0_30px_rgba(126,58,242,0.4)] gap-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  {isLoading ? 'Creating account...' : <><Check className="h-4 w-4" /> Create Account</>}
                </button>
              )}
            </div>

                        {submitError && (
              <div className="flex items-start gap-3 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl py-3 px-4">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-0.5">Registration failed</p>
                  <p className="text-xs text-red-300/80">{submitError}</p>
                  <p className="text-xs text-zinc-500 mt-1.5">This email may already be registered. Try <Link href="/login" className="text-[#b682ff] hover:text-white">signing in</Link> instead.</p>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-zinc-500 mt-5">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-[#b682ff] hover:text-white transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-8 uppercase tracking-widest font-medium">
          Step {step} of {STEPS.length} · No credit card required
        </p>
      </div>
    </div>
  )
}

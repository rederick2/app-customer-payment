'use client';

import { useState } from 'react';
import { Mail, X, Send, Loader2, CheckCircle, MessageSquare } from 'lucide-react';

export default function FloatingContactForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setSent(false);
    setError('');
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-[#7e3af2] to-[#b682ff] text-white shadow-[0_0_30px_rgba(126,58,242,0.5)] hover:shadow-[0_0_40px_rgba(126,58,242,0.7)] hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Contact us"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close */}
            <button
              onClick={reset}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            {sent ? (
              <div className="py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Message sent!</h3>
                <p className="text-zinc-400 text-sm mb-6">We&apos;ll get back to you as soon as possible.</p>
                <button
                  onClick={reset}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-sm hover:bg-white/15 transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-[#7e3af2]/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-[#b682ff]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Contact us</h3>
                    <p className="text-xs text-zinc-500">We&apos;ll reply within 24 hours</p>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Your name *"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-12 bg-zinc-800/60 border border-white/10 text-zinc-100 rounded-xl px-4 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7e3af2]/50 focus:border-[#7e3af2]/50 transition-all"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    placeholder="Your email *"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 bg-zinc-800/60 border border-white/10 text-zinc-100 rounded-xl px-4 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7e3af2]/50 focus:border-[#7e3af2]/50 transition-all"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full h-12 bg-zinc-800/60 border border-white/10 text-zinc-100 rounded-xl px-4 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7e3af2]/50 focus:border-[#7e3af2]/50 transition-all"
                  />
                </div>

                <div>
                  <textarea
                    placeholder="Your message *"
                    required
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full bg-zinc-800/60 border border-white/10 text-zinc-100 rounded-xl px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7e3af2]/50 focus:border-[#7e3af2]/50 transition-all resize-none"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-400 font-medium">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#7e3af2] to-[#b682ff] text-white font-bold text-sm transition-all hover:-translate-y-0.5 shadow-[0_0_20px_rgba(126,58,242,0.3)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Send message</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

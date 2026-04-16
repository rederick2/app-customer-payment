'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password reset link sent to your email.')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <Card className="w-full max-w-md border-border/40 shadow-2xl shadow-primary/5 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-primary/10">
        <form onSubmit={handleReset}>
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center mb-2">
              <img src="/logo.png" alt="Logo" className="w-54 h-24" />
            </div>
            <CardDescription className="text-center text-base">
              Enter your email to receive a password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-5 pt-4 px-6" style={{ marginTop: '1.5rem' }}>
            <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-medium shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Send Reset Link
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Back to Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

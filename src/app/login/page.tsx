import { login } from '@/app/login/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Sparkles } from 'lucide-react' // Asegúrate de tener lucide-react instalado

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <Card className="w-full max-w-md border-border/40 shadow-2xl shadow-primary/5 bg-background/60 backdrop-blur-xl transition-all duration-300 hover:shadow-primary/10">
        <form action={login}>
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center mb-2">
              <img src="/logo.png" alt="Logo" className="w-54 h-24" />
            </div>
            <CardDescription className="text-center text-base">
              Enter your email and password to access your Quotes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                required
                className="bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80 font-medium">
                  Password
                </Label>
                <Link href="/forgot-password" className="text-xs text-primary/80 hover:text-primary transition-colors">
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="***************"
                required
                className="bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-5 pt-4 px-6" style={{ marginTop: '1.5rem' }}>
            <Button type="submit" className="w-full h-11 text-base font-medium shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
              Sign In
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Sign up here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
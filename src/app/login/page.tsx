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
              <div className="p-3 bg-primary/10 rounded-2xl ring-1 ring-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-serif text-center bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              EstudioPro
            </CardTitle>
            <CardDescription className="text-center text-base">
              Ingresa tu correo y contraseña para acceder a tus proformas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80 font-medium">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@correo.com"
                required
                className="bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80 font-medium">
                  Contraseña
                </Label>
                <Link href="/forgot-password" className="text-xs text-primary/80 hover:text-primary transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-background/50 border-border/50 focus-visible:ring-primary/50 transition-all h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-5 pt-4 px-6" style={{ marginTop: '1.5rem' }}>
            <Button type="submit" className="w-full h-11 text-base font-medium shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
              Iniciar Sesión
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Regístrate aquí
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
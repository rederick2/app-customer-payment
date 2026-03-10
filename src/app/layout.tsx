import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Estudio de Diseño | Generador de Proformas',
  description: 'Generador de cotizaciones premium para proyectos de diseño interior.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased min-h-screen bg-background text-foreground flex flex-col`}
      >
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
          <div className="container flex h-16 items-center mx-auto px-4 max-w-7xl">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-serif font-bold text-xl tracking-tight text-primary">Estudio<span className="text-foreground">Pro</span></span>
            </Link>
            <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
              <Link href="/" className="transition-colors hover:text-primary text-foreground/80">Dashboard</Link>
              <Link href="/proforma/new" className="transition-colors hover:text-primary text-foreground/80">Nueva Proforma</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}

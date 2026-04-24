import type { Metadata } from 'next';
import { Archivo_Black, Manrope } from 'next/font/google';
import '../globals.css';

const archivoBlack = Archivo_Black({
  weight: '400',
  variable: '--font-archivo',
  subsets: ['latin'],
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Quickqi — Quote, Invoice & Manage Your Projects',
  description: 'The all-in-one platform for contractors and service businesses. Create quotes, track jobs, manage clients, sync timesheets and close more deals.',
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivoBlack.variable} ${manrope.variable}`}>
      <body className="font-manrope antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

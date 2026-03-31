import Link from 'next/link';
import { LayoutGrid, ScanLine, ArrowRight, Sparkles, Zap } from 'lucide-react';

export const metadata = {
  title: 'Apps | EstudioPro',
  description: 'Powerful tools and AI-powered apps to supercharge your workflow.',
};

const apps = [
  {
    id: 'room-scanner',
    name: 'Room Scanner',
    tagline: 'Scan any room & generate a 2D floor plan instantly',
    description: 'Use your camera to pan around a room and our AI will generate a professional 2D floor plan with estimated dimensions.',
    icon: ScanLine,
    href: '/apps/room-scanner',
    gradient: 'from-violet-500 to-indigo-600',
    badge: 'New',
    badgeColor: 'bg-violet-100 text-violet-700',
    tags: ['AI', 'Camera', 'Floor Plans'],
    status: 'available',
  },
];

export default function AppsPage() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">Apps</h1>
        </div>
        <p className="text-muted-foreground max-w-xl">
          AI-powered tools built for your business. From scanning rooms to generating reports — all in one place.
        </p>
      </div>

      {/* Featured App Banner */}
      <div className="mb-10 rounded-2xl overflow-hidden relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">✨ Featured App</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-serif mb-2">Room Scanner</h2>
            <p className="text-white/80 max-w-md text-sm leading-relaxed">
              Point your camera and pan slowly around a room. Our AI processes the movement and generates a clean 2D floor plan with dimensions — right in your browser.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {['AI-Powered', 'Works on Mobile', 'Export to PDF'].map(tag => (
                <span key={tag} className="text-xs bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full font-medium">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <ScanLine className="h-10 w-10 text-white" />
            </div>
            <Link
              href="/apps/room-scanner"
              className="flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
            >
              Open App <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* App Grid */}
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">All Apps</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <Link key={app.id} href={app.href} className="group">
              <div className="border border-border/40 rounded-2xl bg-card shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden h-full flex flex-col">
                {/* Card Header */}
                <div className={`bg-gradient-to-br ${app.gradient} p-6 flex items-center justify-between`}>
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${app.badgeColor}`}>{app.badge}</span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-base mb-1">{app.name}</h3>
                  <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{app.description}</p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {app.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-medium bg-muted rounded-full px-2 py-0.5 text-muted-foreground">{tag}</span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Zap className="h-3 w-3" /> Available
                    </span>
                    <span className="text-xs text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
                      Open <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Coming Soon Placeholder */}
        {[
          { name: 'Receipt Scanner', desc: 'Scan a receipt and auto-add it to your expenses.', icon: '🧾' },
          { name: 'AI Estimator', desc: 'Describe a project and get an instant cost estimate.', icon: '🤖' },
        ].map((item) => (
          <div key={item.name} className="border border-border/40 border-dashed rounded-2xl bg-muted/20 p-6 flex flex-col items-center justify-center text-center opacity-60 select-none">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            <span className="mt-4 text-[10px] font-bold bg-muted rounded-full px-2.5 py-1 text-muted-foreground uppercase tracking-wider">Coming Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}

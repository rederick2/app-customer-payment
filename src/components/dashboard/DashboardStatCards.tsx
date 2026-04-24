import type { LucideIcon } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export function DashboardStatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all duration-200 hover:border-border/60 hover:shadow-lg hover:-translate-y-1"
        >
          {/* Hover gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold truncate">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
            <div className={`${bg} ${color} p-3 rounded-2xl shrink-0 ml-4 transition-transform duration-200 group-hover:scale-110`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

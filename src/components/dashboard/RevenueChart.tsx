'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface Props {
  data: { month: string; revenue: number }[];
}

export function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0D3B47" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#0D3B47" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#888' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          width={46}
        />
        <Tooltip
          formatter={(value: ValueType | undefined) => {
            const num = typeof value === 'number' ? value : 0;
            return [`$${num.toLocaleString('en-US', { minimumFractionDigits: 0 })}`, 'Revenue'];
          }}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#0D3B47"
          strokeWidth={2}
          fill="url(#colorRevenue)"
          dot={false}
          activeDot={{ r: 4, fill: '#0D3B47' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

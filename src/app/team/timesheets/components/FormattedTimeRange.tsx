'use client';

import { useEffect, useState } from 'react';

export default function FormattedTimeRange({ startTime, endTime }: { startTime: string, endTime: string | null }) {
  const [formatted, setFormatted] = useState<{ start: string, end: string }>({ start: '', end: '' });

  useEffect(() => {
    const startStr = new Date(startTime).toLocaleString('en-US', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
    
    const endStr = endTime 
      ? ` → ${new Date(endTime).toLocaleString('en-US', { timeStyle: 'short' })}` 
      : '';
      
    setFormatted({ start: startStr, end: endStr });
  }, [startTime, endTime]);

  // We return a fragment with suppressHydrationWarning to handle the gap between 
  // server-side rendering and client-side hydration.
  return (
    <span suppressHydrationWarning>
      {formatted.start}{formatted.end}
    </span>
  );
}

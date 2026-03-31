'use client';

import { useEffect, useRef } from 'react';
import { trackProformaView } from '../actions';

export function ViewTracker({ proformaId }: { proformaId: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackProformaView(proformaId).catch(console.error);
    }
  }, [proformaId]);

  return null;
}

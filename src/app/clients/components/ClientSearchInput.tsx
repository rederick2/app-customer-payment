'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';


export function ClientSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');

  // Custom simple useDebounce effect inside the component without adding a dependency
  const [debouncedValue, setDebouncedValue] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (debouncedValue) {
      params.set('q', debouncedValue);
    } else {
      params.delete('q');
    }
    // Reset page on new search
    params.delete('page');

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, [debouncedValue, pathname, router]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search client, company or email..."
        className="pl-8 bg-background shadow-sm"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {isPending && (
        <div className="absolute right-2.5 top-2.5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}

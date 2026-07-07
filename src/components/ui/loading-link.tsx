'use client';

import * as React from 'react';
import Link, { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { useLoading } from './loading-provider';

interface LoadingLinkProps extends LinkProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const LoadingLink = React.forwardRef<HTMLAnchorElement, LoadingLinkProps>(
  ({ children, href, onClick, ...props }, ref) => {
    const pathname = usePathname();
    const { startLoading } = useLoading();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick(e);
      }

      // Determine if we should start loading
      const targetHref = href.toString();
      const isExternal = targetHref.startsWith('http://') || targetHref.startsWith('https://') || targetHref.startsWith('mailto:') || targetHref.startsWith('tel:');
      const isHash = targetHref.startsWith('#');
      const isNewTab = e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1;

      if (
        targetHref &&
        !isExternal &&
        !isHash &&
        !isNewTab &&
        targetHref !== pathname
      ) {
        startLoading();
      }
    };

    return (
      <Link href={href} onClick={handleClick} ref={ref} {...props}>
        {children}
      </Link>
    );
  }
);

LoadingLink.displayName = 'LoadingLink';

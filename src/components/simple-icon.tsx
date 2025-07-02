'use client';

import * as React from 'react';
import * as simpleIcons from 'simple-icons';
import { cn } from '@/lib/utils';

interface SimpleIconProps extends React.SVGProps<SVGSVGElement> {
  slug: string;
}

export function SimpleIcon({ slug, className, ...props }: SimpleIconProps) {
  const icon = simpleIcons.get(slug);

  if (!icon) {
    return null;
  }

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-full w-full', className)}
      {...props}
    >
      <title>{icon.title}</title>
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}

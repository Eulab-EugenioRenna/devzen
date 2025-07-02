'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const { get } = require('simple-icons');

interface SimpleIconProps extends React.SVGProps<SVGSVGElement> {
  slug: string;
}

export function SimpleIcon({ slug, className, ...props }: SimpleIconProps) {
  if (!slug) {
    return null;
  }

  let icon;
  try {
    icon = get(slug);
  } catch (e) {
    // Suppress the error and return null if the icon is not found.
    // This prevents the app from crashing with an invalid slug.
    return null;
  }

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

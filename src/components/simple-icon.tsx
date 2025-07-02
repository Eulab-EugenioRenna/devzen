'use client';

import * as React from 'react';
import * as allIcons from 'simple-icons/icons';
import { cn } from '@/lib/utils';

// Create a lookup map from slug to icon object for dynamic access.
// This is more reliable than using require() with newer versions of simple-icons.
const iconMap = new Map<string, any>();
for (const icon of Object.values(allIcons)) {
  iconMap.set(icon.slug, icon);
}

interface SimpleIconProps extends React.SVGProps<SVGSVGElement> {
  slug: string;
}

export function SimpleIcon({ slug, className, ...props }: SimpleIconProps) {
  if (!slug) {
    return null;
  }

  // Normalize the slug to be safe: lowercase. The library slugs are already lowercase.
  const normalizedSlug = slug.toLowerCase().replace(/\s/g, '');
  const icon = iconMap.get(normalizedSlug);


  if (!icon) {
    // To help with debugging, we can log that the icon was not found.
    console.warn(`Simple Icon not found for slug: ${slug}`);
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

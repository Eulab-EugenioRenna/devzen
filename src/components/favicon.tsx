'use client';

import * as React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface FaviconProps {
  url: string;
  title: string;
  className?: string;
  fallbackClassName?: string;
}

export function Favicon({ url, title, className, fallbackClassName }: FaviconProps) {
  const [imgSrc, setImgSrc] = React.useState(() => {
    try {
      return `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`;
    } catch {
      return `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`;
    }
  });
  const googleFallbackSrc = `https://www.google.com/s2/favicons?sz=64&domain_url=${url}`;

  const handleError = () => {
    if (imgSrc !== googleFallbackSrc) {
      setImgSrc(googleFallbackSrc);
    }
  };

  return (
    <Avatar className={cn('h-8 w-8 flex-shrink-0 rounded-md border', className)}>
      <AvatarImage src={imgSrc} alt={`${title} favicon`} onError={handleError} />
      <AvatarFallback className={cn("rounded-md bg-transparent text-xs font-bold", fallbackClassName)}>
        {title?.[0]?.toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

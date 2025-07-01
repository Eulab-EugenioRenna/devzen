'use client';

import * as React from 'react';
import type { Bookmark } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

interface BookmarkCardProps {
  bookmark: Bookmark;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

export function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const domain = getDomain(bookmark.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block transition-transform duration-200 ease-in-out hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
    >
      <Card className="flex h-full flex-col overflow-hidden bg-card/50 backdrop-blur-sm transition-shadow duration-200 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-8 w-8 rounded-md border">
              <AvatarImage src={faviconUrl} alt={`${bookmark.title} favicon`} />
              <AvatarFallback className="rounded-md bg-transparent text-xs font-bold">
                {bookmark.title?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="font-headline text-lg leading-tight">
                {bookmark.title}
              </CardTitle>
              <CardDescription className="mt-1 truncate text-xs">
                {domain}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground">{bookmark.summary}</p>
        </CardContent>
      </Card>
    </a>
  );
}

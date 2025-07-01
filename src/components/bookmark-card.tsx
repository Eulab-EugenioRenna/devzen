'use client';

import * as React from 'react';
import type { Bookmark } from '@/lib/types';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { MoreHorizontal } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: () => void;
  onDeleted: (id: string, type: 'bookmark' | 'folder') => void;
  isOverlay?: boolean;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

export function BookmarkCard({ bookmark, onEdit, onDeleted, isOverlay }: BookmarkCardProps) {
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging } = useDraggable({
    id: bookmark.id,
    data: { type: 'bookmark', item: bookmark },
  });
  
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: bookmark.id,
    data: { type: 'bookmark', item: bookmark },
  });
  
  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  }

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const domain = getDomain(bookmark.url);
  const faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'transition-transform duration-200 ease-in-out cursor-grab relative',
        isDragging && 'opacity-50',
        isOverlay && 'shadow-2xl'
      )}
    >
      <Card
        className={cn(
            "flex h-full flex-col overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-200 hover:shadow-lg",
            isOver && "ring-2 ring-primary"
        )}
      >
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-8 w-8 flex-shrink-0 rounded-md border">
              <AvatarImage src={faviconUrl} alt={`${bookmark.title} favicon`} />
              <AvatarFallback className="rounded-md bg-transparent text-xs font-bold">
                {bookmark.title?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <CardTitle className="font-headline text-lg leading-tight hover:underline">
                  {bookmark.title}
                </CardTitle>
              </a>
              <CardDescription className="mt-1 truncate text-xs">
                {domain}
              </CardDescription>
            </div>
            <div className="flex items-center" onMouseDown={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Bookmark options</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                    >
                        Delete
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground">{bookmark.summary}</p>
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the bookmark for &quot;{bookmark.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onDeleted(bookmark.id, 'bookmark')}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

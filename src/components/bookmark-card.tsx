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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SimpleIcon } from './simple-icon';
import { Favicon } from './favicon';
import { TooltipProvider } from './ui/tooltip';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: () => void;
  onDeleted: (id: string, type: 'bookmark' | 'folder') => void;
  onCustomize: () => void;
  onDuplicate: () => void;
  isOverlay?: boolean;
  viewMode?: 'grid' | 'list';
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

export function BookmarkCard({ bookmark, onEdit, onDeleted, onCustomize, onDuplicate, isOverlay, viewMode = 'grid' }: BookmarkCardProps) {
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, isDragging } = useDraggable({
    id: bookmark.id,
    data: { type: 'bookmark', item: bookmark },
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: bookmark.id,
    data: { type: 'bookmark', item: bookmark },
  });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const domain = getDomain(bookmark.url);
    
  const cardStyle = {
    '--card-header-bg': bookmark.backgroundColor ?? 'hsl(var(--primary))',
    '--card-text-color': bookmark.textColor ?? 'hsl(var(--primary-foreground))',
  } as React.CSSProperties;

  const iconContent = (() => {
    const commonClasses = "h-12 w-12 rounded-full border-2 border-background bg-card flex-shrink-0";
    if (bookmark.iconUrl) {
      return (
        <img
          src={bookmark.iconUrl}
          alt={bookmark.title}
          className={cn(commonClasses, "object-cover p-1")}
        />
      );
    }
    if (bookmark.icon) {
      return (
        <div
          className={cn(commonClasses, "p-2.5 flex items-center justify-center")}
          style={{ color: bookmark.iconColor ?? 'currentColor' }}
        >
          <SimpleIcon slug={bookmark.icon} />
        </div>
      );
    }
    return (
      <Favicon
        url={bookmark.url}
        title={bookmark.title}
        className={commonClasses}
        fallbackClassName="text-xl"
      />
    );
  })();
  
  const DraggableIcon = (
    <div ref={setDraggableNodeRef} {...listeners} {...attributes} className="cursor-grab">
        {iconContent}
    </div>
  );

  const OptionsMenu = (
    <div className="absolute right-2 top-2">
      <TooltipProvider>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Opzioni segnalibro</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onEdit}>Modifica</DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>Duplica</DropdownMenuItem>
            <DropdownMenuItem onClick={onCustomize}>Personalizza</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
            >
                Elimina
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        </TooltipProvider>
    </div>
  );

  if (isOverlay) {
    return (
        <Card
            className={cn("flex w-64 items-center gap-4 p-3 shadow-2xl")}
        >
            {iconContent}
            <div className="flex-1 overflow-hidden">
                <CardTitle className="font-headline text-base leading-tight truncate">
                  {bookmark.title}
                </CardTitle>
                <CardDescription className="truncate text-xs">
                    {domain}
                </CardDescription>
            </div>
        </Card>
    )
  }
  
  if (viewMode === 'list') {
    return (
    <div
      ref={setDroppableNodeRef}
      className={cn(
        'relative',
        isDragging && 'opacity-50'
      )}
    >
      <Card
        style={cardStyle}
        className={cn(
            "group/card overflow-hidden transition-all duration-200 hover:shadow-md",
            isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        <div 
          className="h-10 bg-[--card-header-bg] text-[--card-text-color] px-4 flex items-center"
        />

        <div className="relative flex items-start gap-4 p-4 pt-0">
          <div className="-mt-6">
             {DraggableIcon}
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <CardTitle className="font-headline text-base leading-tight hover:underline truncate">
                {bookmark.title}
              </CardTitle>
            </a>
            <CardDescription className="mt-1 truncate text-xs">
              {domain}
            </CardDescription>
          </div>
          <div className="flex items-center ml-auto pt-2">
            {OptionsMenu}
          </div>
        </div>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Eliminerà permanentemente il segnalibro per &quot;{bookmark.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onDeleted(bookmark.id, 'bookmark')}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    )
  }

  return (
    <div
      ref={setDroppableNodeRef}
      className={cn(
        'relative',
        isDragging && 'opacity-50'
      )}
    >
      <Card
        style={cardStyle}
        className={cn(
            "group/card h-full flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md",
            isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        <div 
          className="h-10 bg-[--card-header-bg] text-[--card-text-color] px-4 flex items-center"
        />
        <div className="relative p-4 pt-0 flex-1 flex flex-col">
          <div className="absolute right-2 -top-8">
            {OptionsMenu}
          </div>
          <div className="-mt-6 mb-4">
             {DraggableIcon}
          </div>
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
        
            <CardContent className="p-0 pt-4 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">{bookmark.summary}</p>
            </CardContent>
        </div>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
               Questa azione non può essere annullata. Eliminerà permanentemente il segnalibro per &quot;{bookmark.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onDeleted(bookmark.id, 'bookmark')}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

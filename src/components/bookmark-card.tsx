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

export function BookmarkCard({ bookmark, onEdit, onDeleted, onCustomize, isOverlay, viewMode = 'grid' }: BookmarkCardProps) {
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
    
  const cardStyle: React.CSSProperties = {
    '--glow-color': bookmark.backgroundColor ?? 'hsl(var(--primary))',
    backgroundColor: bookmark.backgroundColor,
    color: bookmark.textColor,
  } as React.CSSProperties;

  const iconContent = (() => {
    if (bookmark.iconUrl) {
      return (
        <img
          src={bookmark.iconUrl}
          alt={bookmark.title}
          className="h-8 w-8 flex-shrink-0 rounded-md border object-contain p-1 bg-white"
        />
      );
    }
    if (bookmark.icon) {
      return (
        <div
          className="h-8 w-8 flex-shrink-0 rounded-md border p-1.5 flex items-center justify-center bg-card"
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
      />
    );
  })();
  
  const DraggableIcon = (
    <div ref={setDraggableNodeRef} {...listeners} {...attributes} className="cursor-grab -m-1 p-1">
        {iconContent}
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
      style={cardStyle}
      className={cn(
        'relative',
        isDragging && 'opacity-50'
      )}
    >
      <Card
        className={cn(
            "overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_0_8px_1px_var(--glow-color)]",
            isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
        style={{
            backgroundColor: bookmark.backgroundColor ? `${bookmark.backgroundColor}A0` : undefined,
        }}
      >
        <div className="flex items-center p-3 gap-4">
          {DraggableIcon}

          <div className="flex-1 overflow-hidden">
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
          <div className="flex items-center ml-auto">
            <TooltipProvider>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Opzioni segnalibro</span>
                  </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={onEdit}>Modifica</DropdownMenuItem>
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
      style={cardStyle}
      className={cn(
        'relative',
        isDragging && 'opacity-50'
      )}
    >
      <Card
        className={cn(
            "flex h-full flex-col overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_0_8px_1px_var(--glow-color)]",
            isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
        style={{
            backgroundColor: bookmark.backgroundColor ? `${bookmark.backgroundColor}A0` : undefined,
        }}
      >
        <CardHeader>
          <div className="flex items-start gap-4">
            {DraggableIcon}

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
            <div className="flex items-center">
              <TooltipProvider>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Opzioni segnalibro</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={onEdit}>Modifica</DropdownMenuItem>
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
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground">{bookmark.summary}</p>
        </CardContent>
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

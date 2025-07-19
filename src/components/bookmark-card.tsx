
'use client';

import * as React from 'react';
import type { Bookmark } from '@/lib/types';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { MoreHorizontal, Pencil, Copy, Palette, Trash2, FileText, NotebookPen, RefreshCw, Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
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
  onEdit: (bookmark: Bookmark) => void;
  onDeleted: (id: string, type: 'bookmark' | 'folder') => void;
  onCustomize: () => void;
  onDuplicate: () => void;
  onViewNote: (note: Bookmark) => void;
  onViewTextNote: (note: Bookmark) => void;
  onRegenerateSummary: (id: string) => void;
  isRegenerating: boolean;
  isOverlay?: boolean;
  viewMode?: 'grid' | 'list';
  isDragging?: boolean;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

export function BookmarkCard({ bookmark, onEdit, onDeleted, onCustomize, onDuplicate, onViewNote, onViewTextNote, onRegenerateSummary, isRegenerating, isOverlay, viewMode = 'grid', isDragging }: BookmarkCardProps) {
  const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({
    id: bookmark.id,
    data: { type: 'bookmark', item: bookmark },
  });

  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: bookmark.id,
    data: { type: 'bookmark', item: bookmark },
  });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const isChatNote = bookmark.url.startsWith('devzen:note:');
  const isTextNote = bookmark.url.startsWith('devzen:text-note:');
  const isNote = isChatNote || isTextNote;
  
  const domain = (() => {
    if (isChatNote) return 'Conversazione Salvata';
    if (isTextNote) return 'Nota di Testo';
    return getDomain(bookmark.url);
  })();

  const cardStyle = {
    '--card-header-bg': bookmark.backgroundColor ?? 'hsl(var(--primary))',
    '--card-text-color': bookmark.textColor ?? 'hsl(var(--primary-foreground))',
  } as React.CSSProperties;

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isChatNote) {
      onViewNote(bookmark);
    } else if (isTextNote) {
      onViewTextNote(bookmark);
    } else {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isNote) {
        e.preventDefault();
        handleCardClick(e);
    }
  };
    
  const getNoteSummaryPreview = (summary?: string): string => {
    if (!summary) return 'Nessun contenuto...';
    if (isChatNote) {
      try {
        const messages = JSON.parse(summary);
        if (Array.isArray(messages) && messages.length > 0) {
          return messages.map(m => `${m.role === 'user' ? 'Tu' : 'AI'}: ${m.content}`).join(' ').substring(0, 150) + '...';
        }
      } catch (e) {
        return 'Contenuto della chat non valido.';
      }
    }
    // For text notes, summary is markdown content
    return summary;
  };

  const iconContent = (() => {
    const commonClasses = "h-12 w-12 rounded-full border-2 border-[--card-header-bg] flex-shrink-0";
    if (isChatNote) {
        return (
            <div className={cn(commonClasses, "p-2.5 flex items-center justify-center bg-card")}>
                <FileText className="text-muted-foreground" />
            </div>
        )
    }
    if (isTextNote) {
      return (
          <div className={cn(commonClasses, "p-2.5 flex items-center justify-center bg-card")}>
              <NotebookPen className="text-muted-foreground" />
          </div>
      )
  }
    if (bookmark.iconUrl) {
      return (
        <img
          src={bookmark.iconUrl}
          alt={bookmark.title}
          className={cn(commonClasses, "object-cover p-1 bg-card")}
        />
      );
    }
    if (bookmark.icon) {
      return (
        <div
          className={cn(commonClasses, "p-2.5 flex items-center justify-center bg-card")}
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
    <div>
      <TooltipProvider>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Opzioni segnalibro</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleCardClick}>
                <Pencil className="mr-2 h-4 w-4" />
                {isNote ? 'Visualizza / Modifica' : 'Modifica'}
              </DropdownMenuItem>
              {!isNote && (
                <DropdownMenuItem onClick={() => onRegenerateSummary(bookmark.id)} disabled={isRegenerating}>
                   {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Rigenera Riepilogo
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplica
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCustomize}>
                <Palette className="mr-2 h-4 w-4" />
                Personalizza
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        </TooltipProvider>
    </div>
  );

  if (isDragging) {
    return <div className={cn(
      "rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20",
      viewMode === 'list' ? 'h-28' : 'h-52'
    )} />;
  }
  
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
      className={cn('relative')}
      onClick={handleCardClick}
    >
      <Card
        style={cardStyle}
        className={cn(
            "group/card overflow-hidden transition-all duration-200 hover:shadow-md",
            isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            isNote && "cursor-pointer"
        )}
      >
        <div 
          className="h-10 bg-[--card-header-bg] text-[--card-text-color] px-4 flex items-center"
          style={{ clipPath: 'inset(0 0 -6px 0)' }}
        />

        <div className="relative flex items-start gap-4 p-4 pt-0">
          <div className="-mt-6">
             {DraggableIcon}
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <a
              href={bookmark.url}
              target={isNote ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
              onClick={handleLinkClick}
            >
              <CardTitle className="font-headline text-base leading-tight hover:underline truncate">
                {bookmark.title}
              </CardTitle>
            </a>
            <CardDescription className="mt-1 truncate text-xs">
              {domain}
            </CardDescription>
          </div>
          <div className="ml-auto pt-2">
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
      className={cn('relative')}
      onClick={handleCardClick}
    >
      <Card
        style={cardStyle}
        className={cn(
            "group/card h-full flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md",
            isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            isNote && "cursor-pointer"
        )}
      >
        <div 
          className="h-10 bg-[--card-header-bg] text-[--card-text-color] px-4 flex items-center"
          style={{ clipPath: 'inset(0 0 -6px 0)' }}
        />
        <div className="relative p-4 pt-0 flex-1 flex flex-col">
          <div className="-mt-6 mb-4">
             {DraggableIcon}
          </div>

          <div className="flex justify-between items-start gap-2 mb-1">
              <div className='flex-1 min-w-0'>
                <a
                  href={bookmark.url}
                  target={isNote ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  onClick={handleLinkClick}
                >
                  <CardTitle className="font-headline text-lg leading-tight hover:underline">
                    {bookmark.title}
                  </CardTitle>
                </a>
                <CardDescription className="mt-1 truncate text-xs">
                  {domain}
                </CardDescription>
              </div>
               {OptionsMenu}
          </div>
        
            <CardContent className="p-0 pt-3 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {getNoteSummaryPreview(bookmark.summary)}
                </p>
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

    

'use client';

import * as React from 'react';
import type { Folder, SpaceLink } from '@/lib/types';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { MoreHorizontal, FolderIcon, Link, Undo2, Eye, Pencil, Copy, Palette, Trash2, Share2 } from 'lucide-react';

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
import { Input } from './ui/input';
import { Favicon } from './favicon';
import { TooltipProvider } from './ui/tooltip';
import { SimpleIcon } from './simple-icon';

interface FolderCardProps {
  folder: Folder | SpaceLink;
  onDeleted: (id: string, type: 'folder' | 'bookmark' | 'space-link') => void;
  onView: (folder: Folder | SpaceLink) => void;
  onNameUpdated: (id: string, name: string) => void;
  onCustomize: () => void;
  onDuplicate: () => void;
  onShare: (folder: Folder | SpaceLink) => void;
  onUnlink: (link: SpaceLink) => void;
  isOverlay?: boolean;
  viewMode?: 'grid' | 'list';
  isDragging?: boolean;
}

export function FolderCard({ folder, onDeleted, onView, onNameUpdated, onCustomize, onDuplicate, onShare, onUnlink, isOverlay, viewMode = 'grid', isDragging }: FolderCardProps) {
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: { type: folder.type, item: folder },
  });
  
   const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({
    id: folder.id,
    data: { type: folder.type, item: folder },
  });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(folder.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isLink = folder.type === 'space-link';

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOverlay || isLink) return;
    setIsEditing(true);
  };

  const handleInputBlur = () => {
    if (name.trim() && name.trim() !== folder.name) {
      onNameUpdated(folder.id, name.trim());
    } else {
      setName(folder.name);
    }
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setName(folder.name);
      setIsEditing(false);
    }
  };

  React.useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  
  React.useEffect(() => {
    setName(folder.name);
  }, [folder.name])

  const cardStyle = {
    '--card-header-bg': folder.backgroundColor ?? 'hsl(var(--secondary))',
    '--card-text-color': folder.textColor ?? 'hsl(var(--secondary-foreground))',
  } as React.CSSProperties;


  const folderIcon = (
    <div className='h-12 w-12 rounded-full border-2 border-[--card-header-bg] bg-card flex-shrink-0 p-2.5 flex items-center justify-center'>
      {isLink ? <Link className="h-full w-full text-muted-foreground" /> : <FolderIcon className="h-full w-full text-muted-foreground" />}
    </div>
  );
  
  const DraggableIcon = (
    <div ref={setDraggableNodeRef} {...listeners} {...attributes} className="cursor-grab">
        {folderIcon}
    </div>
  );

  const OptionsMenu = (
    <div>
        <TooltipProvider>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Opzioni cartella</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onView(folder)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizza
              </DropdownMenuItem>
              {!isLink && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rinomina
                </DropdownMenuItem>
              )}
              {isLink && (
                  <DropdownMenuItem onClick={() => onUnlink(folder as SpaceLink)}>
                      <Undo2 className="mr-2 h-4 w-4" />
                      Ripristina Spazio
                  </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplica
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(folder)}>
                <Share2 className="mr-2 h-4 w-4" />
                Condividi
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

  const cardDescriptionText = isLink
    ? 'Collegamento a Spazio'
    : `${(folder as Folder).items?.length ?? 0} elemento/i`;
    
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
            {folderIcon}
            <div className="flex-1 overflow-hidden">
                <CardTitle className="font-headline text-base leading-tight truncate">
                  {folder.name}
                </CardTitle>
                <CardDescription className="truncate text-xs">
                    {cardDescriptionText}
                </CardDescription>
            </div>
        </Card>
    )
  }

  if (viewMode === 'list') {
    return (
     <div
      ref={setDroppableNodeRef}
      onDoubleClick={() => !isOverlay && onView(folder)}
       className='relative'
    >
      <Card
        style={cardStyle}
        className={cn(
            "group/card overflow-hidden transition-all duration-200 hover:shadow-md",
            isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        <div 
          className="h-10 bg-[--card-header-bg] text-[--card-text-color]"
          style={{ clipPath: 'inset(0 0 -6px 0)' }}
        />
        <div className="relative flex items-start gap-4 p-4 pt-0">
            <div className='-mt-6'>
              {DraggableIcon}
            </div>
            <div className="flex-1 min-w-0 pt-2" onDoubleClick={handleTitleDoubleClick}>
               {isEditing ? (
                  <Input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    className="h-7 text-base font-headline p-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <CardTitle className="font-headline text-base leading-tight p-1 rounded-sm truncate">
                    {folder.name}
                  </CardTitle>
                )}
                <CardDescription className="mt-1 text-xs px-1">
                  {cardDescriptionText}
                </CardDescription>
            </div>
             <div className="ml-auto pt-2">
                {OptionsMenu}
            </div>
        </div>
      </Card>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Eliminerà permanentemente {isLink ? 'il collegamento' : 'la cartella'} "{folder.name}"{isLink ? '.' : ' e sposterà tutti i segnalibri al suo interno alla radice dello spazio.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onDeleted(folder.id, folder.type)}
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
      onDoubleClick={() => !isOverlay && onView(folder)}
      className='relative'
    >
      <Card
        style={cardStyle}
        className={cn(
            "group/card flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-md",
            isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        <div 
          className="h-10 bg-[--card-header-bg] text-[--card-text-color]"
          style={{ clipPath: 'inset(0 0 -6px 0)' }}
        />
        <div className="relative p-4 pt-0 flex-1 flex flex-col">
          <div className="-mt-6 mb-4">
              <div ref={setDraggableNodeRef} {...listeners} {...attributes} className="cursor-grab inline-block">
                {folderIcon}
              </div>
          </div>
          <div className='flex justify-between items-start gap-2 mb-1'>
            <div className='flex-1 min-w-0' onDoubleClick={handleTitleDoubleClick}>
                {isEditing ? (
                <Input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    className="h-7 text-lg font-headline p-1"
                    onClick={(e) => e.stopPropagation()}
                />
                ) : (
                <CardTitle className="font-headline text-lg leading-tight p-1 rounded-sm">
                    {folder.name}
                </CardTitle>
                )}
                <CardDescription className="mt-1 text-xs px-1">
                    {cardDescriptionText}
                </CardDescription>
            </div>
            {OptionsMenu}
          </div>
        
            <CardContent className="p-0 pt-3 flex-1">
            {!isLink && (folder as Folder).items?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                {(folder as Folder).items.slice(0, 10).map((bookmark) => {
                    const iconContent = (() => {
                    const commonClasses = "h-8 w-8 rounded-full border bg-card flex-shrink-0";
                    if (bookmark.iconUrl) {
                        return (
                        <img
                            src={bookmark.iconUrl}
                            alt={bookmark.title}
                            className={cn(commonClasses, "object-cover p-0.5")}
                        />
                        );
                    }
                    if (bookmark.icon) {
                        return (
                        <div
                            className={cn(commonClasses, "p-1.5 flex items-center justify-center")}
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
                        fallbackClassName="text-xs"
                        />
                    );
                    })();

                    return (
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} key={bookmark.id}>
                        {iconContent}
                    </a>
                    );
                })}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">{isLink ? 'Clicca per navigare allo spazio.' : 'Questa cartella è vuota. Trascina qui i segnalibri per aggiungerli.'}</p>
            )}
            </CardContent>
        </div>
      </Card>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
             <AlertDialogDescription>
              Questa azione non può essere annullata. Eliminerà permanentemente {isLink ? 'il collegamento' : 'la cartella'} "{folder.name}"{isLink ? '.' : ' e sposterà tutti i segnalibri al suo interno alla radice dello spazio.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onDeleted(folder.id, folder.type)}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    

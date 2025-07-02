'use client';

import * as React from 'react';
import type { Folder } from '@/lib/types';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { MoreHorizontal, FolderIcon } from 'lucide-react';

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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from './ui/input';
import { SimpleIcon } from './simple-icon';
import { Favicon } from './favicon';

interface FolderCardProps {
  folder: Folder;
  onDeleted: (id: string, type: 'bookmark' | 'folder') => void;
  onView: (folder: Folder) => void;
  onNameUpdated: (id: string, name: string) => void;
  onCustomize: () => void;
  isOverlay?: boolean;
  viewMode?: 'grid' | 'list';
}

export function FolderCard({ folder, onDeleted, onView, onNameUpdated, onCustomize, isOverlay, viewMode = 'grid' }: FolderCardProps) {
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: { type: 'folder', item: folder },
  });
  
   const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({
    id: folder.id,
    data: { type: 'folder', item: folder },
  });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [name, setName] = React.useState(folder.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOverlay) return;
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

  const cardStyle: React.CSSProperties = {
    '--glow-color': folder.backgroundColor ?? 'hsl(var(--primary))',
    backgroundColor: folder.backgroundColor,
    color: folder.textColor,
  } as React.CSSProperties;

  const setCombinedNodeRef = (node: HTMLElement | null) => {
    setDroppableNodeRef(node);
    setDraggableNodeRef(node);
  };
  
  if (viewMode === 'list') {
    return (
     <div
      ref={setDroppableNodeRef}
      className={cn(
        'transition-shadow duration-200 ease-in-out',
        isOverlay && 'shadow-2xl'
      )}
      onDoubleClick={() => !isOverlay && onView(folder)}
      style={cardStyle}
    >
      <Card
        className={cn(
            "overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_0_8px_1px_var(--glow-color)]",
            isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
        style={{
            backgroundColor: folder.backgroundColor ? `${folder.backgroundColor}A0` : undefined,
        }}
      >
        <div className="flex items-center p-3 gap-4">
            <div ref={setDraggableNodeRef} {...listeners} {...attributes} className="cursor-grab">
                <FolderIcon className="h-8 w-8 flex-shrink-0" />
            </div>
            <div className="flex-1 overflow-hidden" onDoubleClick={handleTitleDoubleClick}>
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
                    {folder.items.length} item(s)
                </CardDescription>
            </div>
             <div className="flex items-center ml-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Folder options</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onView(folder)}>View</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>Rename</DropdownMenuItem>
                    <DropdownMenuItem onClick={onCustomize}>Customize</DropdownMenuItem>
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
      </Card>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the folder &quot;{folder.name}&quot; and move all bookmarks inside it to the root of the space.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onDeleted(folder.id, 'folder')}
            >
              Delete
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
        'transition-shadow duration-200 ease-in-out',
        isOverlay && 'shadow-2xl'
      )}
      onDoubleClick={() => !isOverlay && onView(folder)}
      style={cardStyle}
    >
      <Card
        className={cn(
            "flex h-full flex-col overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-200 hover:shadow-[0_0_8px_1px_var(--glow-color)]",
            isOver && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
        style={{
            backgroundColor: folder.backgroundColor ? `${folder.backgroundColor}A0` : undefined,
        }}
      >
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex-1 overflow-hidden">
              <div onDoubleClick={handleTitleDoubleClick} ref={setDraggableNodeRef} {...listeners} {...attributes} className="cursor-grab">
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
              </div>
              <CardDescription className="mt-1 text-xs">
                {folder.items.length} item(s)
              </CardDescription>
            </div>
             <div className="flex items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Folder options</span>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={onCustomize}>Customize</DropdownMenuItem>
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
        <CardContent>
          {folder.items.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {folder.items.slice(0, 10).map((bookmark) => {
                const iconContent = bookmark.icon ? (
                  <div className="h-8 w-8 flex-shrink-0 rounded-md border p-1.5 flex items-center justify-center bg-card">
                    <SimpleIcon slug={bookmark.icon} />
                  </div>
                ) : (
                  <Favicon
                    url={bookmark.url}
                    title={bookmark.title}
                  />
                );

                return (
                  <Tooltip key={bookmark.id}>
                    <TooltipTrigger asChild>
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                       {iconContent}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent onClick={(e) => e.stopPropagation()}>
                      <p className='font-bold'>{bookmark.title}</p>
                      <p className='text-muted-foreground text-xs'>{bookmark.url}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ) : (
             <p className="text-sm text-muted-foreground">This folder is empty. Drag bookmarks here to add them.</p>
          )}
        </CardContent>
      </Card>
      
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the folder &quot;{folder.name}&quot; and move all bookmarks inside it to the root of the space.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onDeleted(folder.id, 'folder')}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

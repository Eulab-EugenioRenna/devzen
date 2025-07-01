'use client';

import * as React from 'react';
import type { Folder } from '@/lib/types';
import { useDroppable } from '@dnd-kit/core';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from './ui/input';

interface FolderCardProps {
  folder: Folder;
  onDeleted: (id: string, type: 'bookmark' | 'folder') => void;
  onView: (folder: Folder) => void;
  onNameUpdated: (id: string, name: string) => void;
  isOverlay?: boolean;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

export function FolderCard({ folder, onDeleted, onView, onNameUpdated, isOverlay }: FolderCardProps) {
  const { setNodeRef, isOver } = useDroppable({
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

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-shadow duration-200 ease-in-out',
        isOverlay && 'shadow-2xl'
      )}
      onDoubleClick={() => !isOverlay && onView(folder)}
    >
      <Card
        className={cn(
            "flex h-full flex-col overflow-hidden bg-card/50 backdrop-blur-sm transition-all duration-200 hover:shadow-lg",
            isOver && "ring-2 ring-primary"
        )}
      >
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex-1 overflow-hidden">
              <div onDoubleClick={handleTitleDoubleClick}>
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
            <TooltipProvider>
              <div className="grid grid-cols-5 gap-2">
                {folder.items.slice(0, 10).map((bookmark) => {
                   const domain = getDomain(bookmark.url);
                   const faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
                  return (
                    <Tooltip key={bookmark.id}>
                      <TooltipTrigger asChild>
                        <a href={bookmark.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                         <Avatar className="h-8 w-8 rounded-md border">
                          <AvatarImage src={faviconUrl} alt={`${bookmark.title} favicon`} />
                          <AvatarFallback className="rounded-md bg-transparent text-xs font-bold">
                            {bookmark.title?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
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
            </TooltipProvider>
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

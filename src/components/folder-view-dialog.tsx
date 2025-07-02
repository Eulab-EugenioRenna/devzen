'use client';

import * as React from 'react';
import type { Bookmark, Folder, SpaceItem } from '@/lib/types';
import { moveItemAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Trash2, ArrowUpRightFromSquare } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SimpleIcon } from './simple-icon';
import { Favicon } from './favicon';


interface FolderViewDialogProps {
  folder: Folder;
  onOpenChange: (open: boolean) => void;
  onItemMove: (item: SpaceItem) => void;
  onItemDelete: (id: string, type: 'bookmark' | 'folder') => void;
}

export function FolderViewDialog({ folder, onOpenChange, onItemMove, onItemDelete }: FolderViewDialogProps) {
  const { toast } = useToast();
  const [bookmarks, setBookmarks] = React.useState(folder.items);
  const [deletingBookmark, setDeletingBookmark] = React.useState<Bookmark | null>(null);

  const handleRemoveFromFolder = async (bookmark: Bookmark) => {
    const originalBookmarks = bookmarks;
    setBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
    try {
      const movedItem = await moveItemAction({ id: bookmark.id, newParentId: null });
      onItemMove(movedItem);
      toast({ title: 'Bookmark moved', description: `"${bookmark.title}" moved to space root.` });
    } catch (e) {
      setBookmarks(originalBookmarks);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to move bookmark.' });
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!deletingBookmark) return;
    const bookmarkToDelete = deletingBookmark;
    setDeletingBookmark(null);
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkToDelete.id));
    try {
        await onItemDelete(bookmarkToDelete.id, 'bookmark');
    } catch(e) {
        // The dashboard will handle reverting state on error
    }
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{folder.name}</DialogTitle>
          <DialogDescription>
            Managing {bookmarks.length} bookmark(s) in this folder.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
            {bookmarks.length > 0 ? (
                <ul className='space-y-2'>
                    {bookmarks.map(bookmark => {
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
                            <li key={bookmark.id} className='flex items-center gap-4 p-2 rounded-md hover:bg-muted/50'>
                                {iconContent}
                                <div className='flex-grow overflow-hidden'>
                                    <p className='font-medium truncate'>{bookmark.title}</p>
                                    <p className='text-xs text-muted-foreground truncate'>{bookmark.url}</p>
                                </div>
                                <div className='flex gap-1'>
                                    <Button size="icon" variant="ghost" className='h-8 w-8' onClick={() => handleRemoveFromFolder(bookmark)}>
                                        <ArrowUpRightFromSquare className='h-4 w-4' />
                                        <span className="sr-only">Move to root</span>
                                    </Button>
                                    <AlertDialog open={!!deletingBookmark && deletingBookmark.id === bookmark.id} onOpenChange={(open) => !open && setDeletingBookmark(null)}>
                                        <AlertDialogTrigger asChild>
                                             <Button size="icon" variant="ghost" className='h-8 w-8 text-destructive hover:text-destructive' onClick={() => setDeletingBookmark(bookmark)}>
                                                <Trash2 className='h-4 w-4' />
                                                <span className="sr-only">Delete</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the bookmark for &quot;{deletingBookmark?.title}&quot;.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={handleConfirmDelete}
                                                >
                                                Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-8">This folder is empty.</p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import type { Bookmark, Folder, SpaceItem } from '@/lib/types';
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

  React.useEffect(() => {
    setBookmarks(folder.items)
  }, [folder.items])

  const handleRemoveFromFolder = async (bookmark: Bookmark) => {
    try {
      await onItemMove(bookmark);
      toast({ title: 'Segnalibro spostato', description: `"${bookmark.title}" spostato alla radice dello spazio.` });
    } catch (e) {
      // The provider will show the toast on error
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!deletingBookmark) return;
    const bookmarkToDelete = deletingBookmark;
    setDeletingBookmark(null);
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
            Gestione di {bookmarks.length} segnalibro/i in questa cartella.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
            {bookmarks.length > 0 ? (
                <ul className='space-y-2'>
                    {bookmarks.map(bookmark => {
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
                                        <span className="sr-only">Sposta alla radice</span>
                                    </Button>
                                    <AlertDialog open={!!deletingBookmark && deletingBookmark.id === bookmark.id} onOpenChange={(open) => !open && setDeletingBookmark(null)}>
                                        <AlertDialogTrigger asChild>
                                             <Button size="icon" variant="ghost" className='h-8 w-8 text-destructive hover:text-destructive' onClick={() => setDeletingBookmark(bookmark)}>
                                                <Trash2 className='h-4 w-4' />
                                                <span className="sr-only">Elimina</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                Questa azione non può essere annullata. Eliminerà permanentemente il segnalibro per "{deletingBookmark?.title}".
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                                <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={handleConfirmDelete}
                                                >
                                                Elimina
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
                <p className="text-sm text-muted-foreground text-center py-8">Questa cartella è vuota.</p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

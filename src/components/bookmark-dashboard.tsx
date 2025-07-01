'use client';

import * as React from 'react';
import type { Bookmark, Folder, Space, SpaceItem } from '@/lib/types';
import {
  DndContext,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import {
  deleteItemAction,
  moveItemAction,
  createFolderAction,
  createSpaceAction,
  updateSpaceAction,
  deleteSpaceAction,
  updateFolderNameAction,
} from '@/app/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { getIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { BookmarkCard } from '@/components/bookmark-card';
import { FolderCard } from '@/components/folder-card';
import { AddBookmarkDialog } from '@/components/add-bookmark-dialog';
import { EditBookmarkDialog } from '@/components/edit-bookmark-dialog';
import { PlusCircle, Plus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AddEditSpaceDialog } from '@/components/add-edit-space-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FolderViewDialog } from './folder-view-dialog';
import { CustomizeItemDialog } from './customize-item-dialog';

function SidebarSpaceMenuItem({
  space,
  isActive,
  onClick,
  onEdit,
  onDelete,
}: {
  space: Space;
  isActive: boolean;
  onClick: (id: string) => void;
  onEdit: (space: Space) => void;
  onDelete: (space: Space) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: space.id });
  const Icon = getIcon(space.icon);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          ref={setNodeRef}
          className={cn(
            'rounded-lg transition-colors',
            isOver ? 'bg-sidebar-accent/20' : 'bg-transparent'
          )}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <SidebarMenuItem className="px-4">
            <SidebarMenuButton
              onClick={() => onClick(space.id)}
              isActive={isActive}
              tooltip={space.name}
            >
              <Icon />
              <span>{space.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onEdit(space)}>Edit Space</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
          onClick={() => onDelete(space)}
        >
          Delete Space
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


function DroppableSidebarMenu({
  spaces,
  activeSpaceId,
  setActiveSpaceId,
  onEdit,
  onDelete,
}: {
  spaces: Space[];
  activeSpaceId: string;
  setActiveSpaceId: (id: string) => void;
  onEdit: (space: Space) => void;
  onDelete: (space: Space) => void;
}) {
  return (
    <SidebarMenu>
      {spaces.map((space) => (
        <SidebarSpaceMenuItem
          key={space.id}
          space={space}
          isActive={activeSpaceId === space.id}
          onClick={setActiveSpaceId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </SidebarMenu>
  );
}

export function BookmarkDashboard({ initialItems, initialSpaces }: { initialItems: SpaceItem[], initialSpaces: Space[] }) {
  const [spaces, setSpaces] = React.useState<Space[]>(initialSpaces);
  const [items, setItems] = React.useState<SpaceItem[]>(initialItems);
  const [activeSpaceId, setActiveSpaceId] = React.useState<string>(initialSpaces[0]?.id ?? '');
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);
  const [draggedItem, setDraggedItem] = React.useState<SpaceItem | null>(null);
  const [editingSpace, setEditingSpace] = React.useState<Space | null>(null);
  const [isAddingSpace, setIsAddingSpace] = React.useState(false);
  const [deletingSpace, setDeletingSpace] = React.useState<Space | null>(null);
  const [viewingFolder, setViewingFolder] = React.useState<Folder | null>(null);
  const [customizingItem, setCustomizingItem] = React.useState<SpaceItem | null>(null);

  const [isMounted, setIsMounted] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Set first space as active if the active one is deleted
  React.useEffect(() => {
    if (spaces.length > 0 && !spaces.find(s => s.id === activeSpaceId)) {
      setActiveSpaceId(spaces[0].id);
    } else if (spaces.length === 0) {
      setActiveSpaceId('');
    }
  }, [spaces, activeSpaceId]);


  const { folders, rootBookmarks } = React.useMemo(() => {
    const spaceItems = items.filter((item) => item.spaceId === activeSpaceId);
    const allBookmarks = spaceItems.filter((i) => i.type === 'bookmark') as Bookmark[];
    const allFolders = spaceItems.filter((i) => i.type === 'folder') as Folder[];

    const foldersById = new Map<string, Folder>(
      allFolders.map((f) => [f.id, { ...f, items: [] }])
    );
    const rootBookmarks: Bookmark[] = [];

    for (const bookmark of allBookmarks) {
      if (bookmark.parentId && foldersById.has(bookmark.parentId)) {
        foldersById.get(bookmark.parentId)!.items.push(bookmark);
      } else {
        rootBookmarks.push(bookmark);
      }
    }

    return { folders: Array.from(foldersById.values()), rootBookmarks };
  }, [items, activeSpaceId]);

  const displayedItems: SpaceItem[] = [...folders, ...rootBookmarks];

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  const handleAddBookmark = (newBookmark: Bookmark) => {
    setItems((prev) => [newBookmark, ...prev]);
    toast({
      title: 'Bookmark added!',
      description: `"${newBookmark.title}" has been saved.`,
    });
  };
  
  const handleItemUpdate = (updatedItem: SpaceItem) => {
    setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    if (editingBookmark && editingBookmark.id === updatedItem.id) setEditingBookmark(null);
    if (customizingItem && customizingItem.id === updatedItem.id) setCustomizingItem(null);
  };


  const handleDeleteItem = async (id: string, type: 'bookmark' | 'folder') => {
    const itemToDelete = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    
    try {
      const result = await deleteItemAction({ id });
      if (result.success && type === 'folder' && result.updatedBookmarks) {
         setItems(prev => [...prev.filter(i => result.updatedBookmarks!.every(u => u.id !== i.id)), ...result.updatedBookmarks!]);
      }
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`,
        description: `Successfully removed.`,
      });
    } catch (error) {
      if(itemToDelete) setItems((prev) => [...prev, itemToDelete]);
      toast({ variant: 'destructive', title: 'Error', description: `Failed to delete ${type}.`});
    }
  };

  const handleUpdateFolderName = async (id: string, name: string) => {
    const originalFolder = items.find(i => i.id === id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, name } : i));
    try {
      await updateFolderNameAction({ id, name });
    } catch (e) {
      if (originalFolder) setItems(prev => prev.map(i => i.id === id ? originalFolder : i));
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to rename folder.' });
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItem(event.active.data.current?.item ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggedItem(null);
    const { active, over } = event;
    if (!over || !active.id || active.id === over.id) return;

    const activeItem = active.data.current?.item as SpaceItem;
    const overId = over.id;
    
    const overIsSpace = spaces.some(s => s.id === overId);
    if (overIsSpace && activeItem.spaceId !== overId) {
      setItems(prev => prev.map(i => i.id === active.id ? {...i, spaceId: String(overId), parentId: null} : i));
      try {
        await moveItemAction({ id: String(active.id), newSpaceId: String(overId) });
      } catch (e) {
        setItems(prev => prev.map(i => i.id === active.id ? {...i, spaceId: activeItem.spaceId } : i));
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to move item.' });
      }
      return;
    }

    const overItem = items.find(i => i.id === over.id);
    if (!overItem) return;

    if (activeItem.type === 'bookmark' && overItem.type === 'bookmark' && activeItem.spaceId === overItem.spaceId) {
       const originalItems = items;
       setItems(prev => prev.filter(i => i.id !== active.id && i.id !== over.id));
       try {
        const { folder, bookmarks } = await createFolderAction({ spaceId: activeItem.spaceId, initialBookmarkIds: [String(active.id), String(over.id)] });
        setItems(prev => [...prev, folder, ...bookmarks]);
       } catch (e) {
         setItems(originalItems);
         toast({ variant: 'destructive', title: 'Error', description: 'Failed to create folder.' });
       }
       return;
    }
    
    if (activeItem.type === 'bookmark' && overItem.type === 'folder' && activeItem.parentId !== overItem.id) {
        setItems(prev => prev.map(i => i.id === active.id ? {...i, parentId: String(over.id)} : i));
        try {
            await moveItemAction({ id: String(active.id), newParentId: String(over.id) });
        } catch (e) {
            setItems(prev => prev.map(i => i.id === active.id ? {...i, parentId: activeItem.parentId } : i));
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to move item into folder.' });
        }
    }
  };

  const handleSpaceSave = async (spaceData: { name: string, icon: string }, id?: string) => {
    if (id) { // Editing existing space
      const originalSpaces = spaces;
      setSpaces(prev => prev.map(s => s.id === id ? { ...s, ...spaceData } : s));
      setEditingSpace(null);
      try {
        await updateSpaceAction({ id, data: spaceData });
        toast({ title: 'Space updated!', description: `"${spaceData.name}" has been saved.`});
      } catch (error) {
        setSpaces(originalSpaces);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update space.' });
      }
    } else { // Adding new space
      setIsAddingSpace(false);
      try {
        const newSpace = await createSpaceAction(spaceData);
        setSpaces(prev => [...prev, newSpace]);
        setActiveSpaceId(newSpace.id);
        toast({ title: 'Space created!', description: `"${spaceData.name}" has been added.`});
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create space.' });
      }
    }
  };

  const handleConfirmDeleteSpace = async () => {
    if (!deletingSpace) return;
    const spaceToDelete = deletingSpace;
    const originalSpaces = spaces;
    const originalItems = items;

    setSpaces(prev => prev.filter(s => s.id !== spaceToDelete.id));
    setItems(prev => prev.filter(i => i.spaceId !== spaceToDelete.id));
    setDeletingSpace(null);

    try {
      await deleteSpaceAction({ id: spaceToDelete.id });
      toast({ title: 'Space Deleted', description: `"${spaceToDelete.name}" and all its contents have been removed.` });
    } catch (error) {
      setSpaces(originalSpaces);
      setItems(originalItems);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete space.' });
    }
  };
  
  const handleItemMove = (updatedItem: SpaceItem) => {
    setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6"><path d="M4 4h8a4 4 0 0 1 4 4v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4" /><path d="M20 12V8a4 4 0 0 0-4-4H8" /></svg>
                 <h1 className="text-lg font-semibold font-headline">DevZen</h1>
              </div>
              <Button variant="ghost" size="icon" className='h-7 w-7' onClick={() => setIsAddingSpace(true)}>
                <Plus className="h-4 w-4"/>
              </Button>
            </div>
          </SidebarHeader>
          <SidebarContent className='px-2'>
            <DroppableSidebarMenu
              spaces={spaces}
              activeSpaceId={activeSpaceId}
              setActiveSpaceId={setActiveSpaceId}
              onEdit={setEditingSpace}
              onDelete={setDeletingSpace}
            />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <h2 className="text-xl font-bold font-headline">
              {activeSpace?.name ?? 'Dashboard'}
            </h2>
            <AddBookmarkDialog activeSpaceId={activeSpaceId} onBookmarkAdded={handleAddBookmark}>
              <Button disabled={!activeSpaceId}>
                <PlusCircle className="mr-2" />
                Add Bookmark
              </Button>
            </AddBookmarkDialog>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {displayedItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayedItems.map(item => item.type === 'folder' ? (
                  <FolderCard
                    key={item.id}
                    folder={item}
                    onDeleted={handleDeleteItem}
                    onView={() => setViewingFolder(item as Folder)}
                    onNameUpdated={handleUpdateFolderName}
                    onCustomize={() => setCustomizingItem(item)}
                  />
                ) : (
                  <BookmarkCard
                    key={item.id}
                    bookmark={item}
                    onEdit={() => setEditingBookmark(item)}
                    onDeleted={handleDeleteItem}
                    onCustomize={() => setCustomizingItem(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
                <h3 className="text-lg font-semibold font-headline">{activeSpace ? 'This space is empty!' : 'No spaces yet!'}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {activeSpace ? `Add your first bookmark to '${activeSpace.name}' to get started.` : 'Create your first space using the [+] button in the sidebar.'}
                </p>
              </div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
      {isMounted && createPortal(
        <DragOverlay>
          {draggedItem ? (
            draggedItem.type === 'bookmark' ? (
                <BookmarkCard
                    bookmark={draggedItem}
                    onEdit={() => {}}
                    onDeleted={() => {}}
                    onCustomize={() => {}}
                    isOverlay
                />
            ) : (
                <FolderCard
                    folder={draggedItem as Folder}
                    onDeleted={() => {}}
                    onView={() => {}}
                    onNameUpdated={() => {}}
                    onCustomize={() => {}}
                    isOverlay
                />
            )
          ) : null}
        </DragOverlay>,
        document.body
      )}
      {editingBookmark && (
        <EditBookmarkDialog
          bookmark={editingBookmark}
          onOpenChange={(open) => !open && setEditingBookmark(null)}
          onBookmarkUpdated={handleItemUpdate}
        />
      )}
      {(isAddingSpace || editingSpace) && (
        <AddEditSpaceDialog
            space={editingSpace}
            onSave={handleSpaceSave}
            onOpenChange={(open) => {
                if (!open) {
                    setIsAddingSpace(false);
                    setEditingSpace(null);
                }
            }}
        />
      )}
      {deletingSpace && (
         <AlertDialog open={!!deletingSpace} onOpenChange={(open) => !open && setDeletingSpace(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete &quot;{deletingSpace.name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this space and all of the bookmarks and folders within it. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleConfirmDeleteSpace}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      )}
      {viewingFolder && (
        <FolderViewDialog
          folder={viewingFolder}
          onOpenChange={(open) => !open && setViewingFolder(null)}
          onItemMove={handleItemMove}
          onItemDelete={handleDeleteItem}
        />
      )}
      {customizingItem && (
        <CustomizeItemDialog
            item={customizingItem}
            onOpenChange={(open) => !open && setCustomizingItem(null)}
            onItemUpdated={handleItemUpdate}
        />
      )}
    </DndContext>
  );
}

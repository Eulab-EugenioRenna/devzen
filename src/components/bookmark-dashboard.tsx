'use client';

import * as React from 'react';
import type { Bookmark, Folder, Space, SpaceItem } from '@/lib/types';
import {
  DndContext,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type Active,
  type Over,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { mockSpaces } from '@/lib/mock-data';
import {
  deleteItemAction,
  moveItemAction,
  createFolderAction,
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
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { BookmarkCard } from '@/components/bookmark-card';
import { FolderCard } from '@/components/folder-card';
import { AddBookmarkDialog } from '@/components/add-bookmark-dialog';
import { EditBookmarkDialog } from '@/components/edit-bookmark-dialog';
import { PlusCircle } from 'lucide-react';

function DroppableSidebarMenu({
  spaces,
  activeSpaceId,
  setActiveSpaceId,
}: {
  spaces: Space[];
  activeSpaceId: string;
  setActiveSpaceId: (id: string) => void;
}) {
  return (
    <SidebarMenu>
      {spaces.map((space) => {
        const { setNodeRef, isOver } = useDroppable({ id: space.id });
        return (
          <div
            ref={setNodeRef}
            key={space.id}
            className={cn(
              'rounded-lg transition-colors',
              isOver ? 'bg-sidebar-accent/20' : 'bg-transparent'
            )}
          >
            <SidebarMenuItem className='px-4'>
              <SidebarMenuButton
                onClick={() => setActiveSpaceId(space.id)}
                isActive={activeSpaceId === space.id}
                tooltip={space.name}
              >
                <space.icon />
                <span>{space.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        );
      })}
    </SidebarMenu>
  );
}

export function BookmarkDashboard({ initialItems }: { initialItems: SpaceItem[] }) {
  const [spaces] = React.useState<Space[]>(mockSpaces);
  const [items, setItems] = React.useState<SpaceItem[]>(initialItems);
  const [activeSpaceId, setActiveSpaceId] = React.useState<string>(mockSpaces[0]?.id ?? '');
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);
  const [draggedItem, setDraggedItem] = React.useState<SpaceItem | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
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

  const handleUpdateBookmark = (updatedBookmark: Bookmark) => {
    setItems((prev) => prev.map((b) => (b.id === updatedBookmark.id ? updatedBookmark : b)));
    setEditingBookmark(null);
    toast({
      title: 'Bookmark updated!',
      description: `"${updatedBookmark.title}" has been saved.`,
    });
  };

  const handleDeleteItem = async (id: string, type: 'bookmark' | 'folder') => {
    const itemToDelete = items.find((i) => i.id === id);
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== id));
    
    try {
      const result = await deleteItemAction({ id });
      if (result.success && type === 'folder' && result.updatedBookmarks) {
        // if a folder was deleted, some bookmarks might have been moved to root
         setItems(prev => [...prev, ...result.updatedBookmarks!]);
      }
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`,
        description: `Successfully removed.`,
      });
    } catch (error) {
      // Revert on error
      if(itemToDelete) setItems((prev) => [...prev, itemToDelete]);
      toast({ variant: 'destructive', title: 'Error', description: `Failed to delete ${type}.`});
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItem(event.active.data.current?.item ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggedItem(null);
    const { active, over } = event;
    if (!over || !active.id) return;

    const activeItem = active.data.current?.item as SpaceItem;
    const overId = over.id;
    
    // Case 1: Drop on a space in sidebar
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

    const overItem = over.data.current?.item as SpaceItem;
    if (!overItem || active.id === over.id) return;
    
    // Case 2: Drop bookmark on another bookmark to create a folder
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
    
    // Case 3: Drop bookmark on a folder
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

  const renderItem = (item: SpaceItem) => {
    if (item.type === 'folder') {
      return (
        <FolderCard
          key={item.id}
          folder={item}
          onDeleted={handleDeleteItem}
        />
      );
    }
    return (
      <BookmarkCard
        key={item.id}
        bookmark={item}
        onEdit={() => setEditingBookmark(item)}
        onDeleted={handleDeleteItem}
      />
    );
  };
  
  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Icons.logo className="size-6" />
              <h1 className="text-lg font-semibold font-headline">DevZen</h1>
            </div>
          </SidebarHeader>
          <SidebarContent className='px-2'>
            <DroppableSidebarMenu
              spaces={spaces}
              activeSpaceId={activeSpaceId}
              setActiveSpaceId={setActiveSpaceId}
            />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <h2 className="text-xl font-bold font-headline">
              {activeSpace?.name ?? 'Dashboard'}
            </h2>
            <AddBookmarkDialog activeSpaceId={activeSpaceId} onBookmarkAdded={handleAddBookmark}>
              <Button>
                <PlusCircle className="mr-2" />
                Add Bookmark
              </Button>
            </AddBookmarkDialog>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {displayedItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayedItems.map(renderItem)}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
                <h3 className="text-lg font-semibold font-headline">No items here!</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first bookmark to '{activeSpace?.name}' to get started.
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
                    isOverlay
                />
            ) : (
                <FolderCard
                    folder={draggedItem as Folder}
                    onDeleted={() => {}}
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
          onBookmarkUpdated={handleUpdateBookmark}
        />
      )}
    </DndContext>
  );
}

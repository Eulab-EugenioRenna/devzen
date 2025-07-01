'use client';

import * as React from 'react';
import type { Bookmark, Space } from '@/lib/types';
import {
  DndContext,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { mockSpaces } from '@/lib/mock-data';
import {
  deleteBookmarkAction,
  moveBookmarkAction,
  updateBookmarkAction,
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
            <SidebarMenuItem>
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

export function BookmarkDashboard({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [spaces] = React.useState<Space[]>(mockSpaces);
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>(initialBookmarks);
  const [activeSpaceId, setActiveSpaceId] = React.useState<string>(mockSpaces[0]?.id ?? '');
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);
  const [draggedBookmark, setDraggedBookmark] = React.useState<Bookmark | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);
  const filteredBookmarks = bookmarks.filter((b) => b.spaceId === activeSpaceId);

  const handleAddBookmark = (newBookmark: Bookmark) => {
    setBookmarks((prev) => [newBookmark, ...prev]);
    toast({
      title: 'Bookmark added!',
      description: `"${newBookmark.title}" has been saved.`,
    });
  };

  const handleUpdateBookmark = (updatedBookmark: Bookmark) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === updatedBookmark.id ? updatedBookmark : b))
    );
    setEditingBookmark(null);
    toast({
      title: 'Bookmark updated!',
      description: `"${updatedBookmark.title}" has been saved.`,
    });
  };

  const handleDeleteBookmark = async (id: string) => {
    const bookmarkToDelete = bookmarks.find((b) => b.id === id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    try {
      await deleteBookmarkAction({ id });
      toast({
        title: 'Bookmark deleted',
        description: `"${bookmarkToDelete?.title}" has been removed.`,
      });
    } catch (error) {
      setBookmarks((prev) => (bookmarkToDelete ? [...prev, bookmarkToDelete] : prev));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete bookmark.',
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const bookmark = bookmarks.find((b) => b.id === active.id);
    if (bookmark) {
      setDraggedBookmark(bookmark);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggedBookmark(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const originalBookmark = bookmarks.find((b) => b.id === active.id);
      if (originalBookmark && originalBookmark.spaceId !== over.id) {
        setBookmarks((prev) =>
          prev.map((b) =>
            b.id === active.id ? { ...b, spaceId: String(over.id) } : b
          )
        );

        try {
          await moveBookmarkAction({ id: String(active.id), newSpaceId: String(over.id) });
        } catch (error) {
          setBookmarks((prev) =>
            prev.map((b) =>
              b.id === active.id
                ? { ...b, spaceId: originalBookmark.spaceId }
                : b
            )
          );
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to move bookmark.',
          });
        }
      }
    }
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
          <SidebarContent>
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
            {filteredBookmarks.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    onEdit={() => setEditingBookmark(bookmark)}
                    onDeleted={handleDeleteBookmark}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
                <h3 className="text-lg font-semibold font-headline">No bookmarks here!</h3>
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
          {draggedBookmark ? (
            <BookmarkCard
              bookmark={draggedBookmark}
              onEdit={() => {}}
              onDeleted={() => {}}
              isOverlay
            />
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

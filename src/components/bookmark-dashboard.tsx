'use client';

import * as React from 'react';
import type { Bookmark, Space } from '@/lib/types';
import { mockSpaces } from '@/lib/mock-data';
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
import { PlusCircle } from 'lucide-react';

export function BookmarkDashboard({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [spaces, setSpaces] = React.useState<Space[]>(mockSpaces);
  const [bookmarks, setBookmarks] = React.useState<Bookmark[]>(initialBookmarks);
  const [activeSpaceId, setActiveSpaceId] = React.useState<string>(
    mockSpaces[0]?.id ?? ''
  );

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  const filteredBookmarks = bookmarks.filter(
    (b) => b.spaceId === activeSpaceId
  );

  const handleAddBookmark = (newBookmark: Bookmark) => {
    setBookmarks((prev) => [newBookmark, ...prev]);
  };
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Icons.logo className="size-6" />
            <h1 className="text-lg font-semibold font-headline">DevZen</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {spaces.map((space) => (
              <SidebarMenuItem key={space.id}>
                <SidebarMenuButton
                  onClick={() => setActiveSpaceId(space.id)}
                  isActive={activeSpaceId === space.id}
                  tooltip={space.name}
                >
                  <space.icon />
                  <span>{space.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <h2 className="text-xl font-bold font-headline">
            {activeSpace?.name ?? 'Dashboard'}
          </h2>
          <AddBookmarkDialog
            activeSpaceId={activeSpaceId}
            onBookmarkAdded={handleAddBookmark}
          >
            <Button>
              <PlusCircle />
              Add Bookmark
            </Button>
          </AddBookmarkDialog>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredBookmarks.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBookmarks.map((bookmark) => (
                <BookmarkCard key={bookmark.id} bookmark={bookmark} />
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
  );
}

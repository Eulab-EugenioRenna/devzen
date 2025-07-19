
'use client';

import * as React from 'react';
import type { AppInfo, Bookmark, Folder, Space, SpaceItem, ToolsAi } from '@/lib/types';
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
  updateAppInfoAction,
  createWorkspaceFromJsonAction,
  exportWorkspaceAction,
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
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { getIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { BookmarkCard } from '@/components/bookmark-card';
import { FolderCard } from '@/components/folder-card';
import { AddBookmarkDialog } from '@/components/add-bookmark-dialog';
import { EditBookmarkDialog } from '@/components/edit-bookmark-dialog';
import { PlusCircle, Plus, LayoutGrid, List, MoreVertical, Library, Bot, ChevronDown, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AddEditSpaceDialog } from '@/components/add-edit-space-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FolderViewDialog } from './folder-view-dialog';
import { CustomizeItemDialog } from './customize-item-dialog';
import { Input } from './ui/input';
import { EditAppInfoDialog } from './edit-app-info-dialog';
import { AddFromLibraryDialog } from './add-from-library-dialog';
import { pb, toolsAiCollectionName, bookmarksCollectionName, spacesCollectionName } from '@/lib/pocketbase';
import { recordToToolAi, recordToSpaceItem } from '@/lib/data-mappers';
import { GenerateWorkspaceDialog } from './generate-workspace-dialog';

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
    <SidebarMenuItem
      ref={setNodeRef}
      className={cn(
        'rounded-lg transition-colors',
        isOver ? 'bg-sidebar-accent/20' : 'bg-transparent'
      )}
    >
      <SidebarMenuButton
          onClick={() => onClick(space.id)}
          isActive={isActive}
          tooltip={space.name}
          className="pr-8"
      >
          <Icon />
          <span>{space.name}</span>
      </SidebarMenuButton>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 group-data-[collapsible=icon]:hidden">
                <MoreVertical className="h-4 w-4" />
            </Button>
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
    </SidebarMenuItem>
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
    <SidebarMenu className="p-2">
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

export function BookmarkDashboard({ initialItems, initialSpaces, initialAppInfo, initialTools }: { initialItems: SpaceItem[], initialSpaces: Space[], initialAppInfo: AppInfo, initialTools: ToolsAi[] }) {
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
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  
  const [appInfo, setAppInfo] = React.useState<AppInfo>(initialAppInfo);
  const [isEditingAppInfo, setIsEditingAppInfo] = React.useState(false);

  const [tools, setTools] = React.useState<ToolsAi[]>(initialTools);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isGeneratingWorkspace, setIsGeneratingWorkspace] = React.useState(false);
  const [isAddingFromLibrary, setIsAddingFromLibrary] = React.useState(false);

  const { toast } = useToast();

  React.useEffect(() => {
    setIsMounted(true);
    // Real-time subscriptions are only set up on the client
    const handleItemUpdate = (e: { action: string; record: any }) => {
      try {
        const item = recordToSpaceItem(e.record);
        if (!item) return;

        setItems((currentItems) => {
          if (e.action === 'delete') {
            return currentItems.filter((i) => i.id !== item.id);
          }
          const existingIndex = currentItems.findIndex((i) => i.id === item.id);
          if (existingIndex > -1) {
            const newItems = [...currentItems];
            newItems[existingIndex] = item;
            return newItems;
          }
          // Only add if it doesn't exist to avoid duplicates from optimistic updates
          return [...currentItems, item];
        });
      } catch (error) {
        console.error('Error processing real-time item update:', error);
      }
    };
    
    const handleSpaceUpdate = (e: { action: string; record: any }) => {
      try {
        const space: Space = { id: e.record.id, name: e.record.name, icon: e.record.icon };
        if (!space) return;

        setSpaces((currentSpaces) => {
          if (e.action === 'delete') {
            return currentSpaces.filter((s) => s.id !== space.id);
          }
          const existingIndex = currentSpaces.findIndex((s) => s.id === space.id);
          if (existingIndex > -1) {
            const newSpaces = [...currentSpaces];
            newSpaces[existingIndex] = space;
            return newSpaces;
          }
          // Only add if it doesn't exist to avoid duplicates from optimistic updates
          return [...currentSpaces, space];
        });
      } catch (error) {
        console.error('Error processing real-time space update:', error);
      }
    };

    const handleToolUpdate = (e: { action: string; record: any }) => {
      try {
        const tool = recordToToolAi(e.record);
        if (!tool) return;

        setTools((currentTools) => {
          if (e.action === 'delete' || tool.deleted) {
            return currentTools.filter((t) => t.id !== tool.id);
          }
          const existingIndex = currentTools.findIndex((t) => t.id === tool.id);
          if (existingIndex > -1) {
            const newTools = [...currentTools];
            newTools[existingIndex] = tool;
            return newTools;
          } else {
            return [tool, ...currentTools];
          }
        });
      } catch (error) {
        console.error("Error processing real-time tool update:", error);
      }
    };
    
    const connectWithRetry = async (subscribeFn: () => Promise<() => void>, name: string) => {
        try {
            return await subscribeFn();
        } catch (err: any) {
            console.error(`Failed to subscribe to ${name} collection:`, err?.originalError || err);
            // Don't toast on initial load failures for now, can be noisy.
        }
    };

    connectWithRetry(() => pb.collection(bookmarksCollectionName).subscribe('*', handleItemUpdate), 'bookmarks');
    connectWithRetry(() => pb.collection(spacesCollectionName).subscribe('*', handleSpaceUpdate), 'spaces');
    connectWithRetry(() => pb.collection(toolsAiCollectionName).subscribe('*', handleToolUpdate), 'tools');


    return () => {
      pb.collection(bookmarksCollectionName).unsubscribe('*');
      pb.collection(spacesCollectionName).unsubscribe('*');
      pb.collection(toolsAiCollectionName).unsubscribe('*');
    };
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
    
    const filteredItems = spaceItems.filter(item => {
        if (!searchTerm) return true;
        const lowerCaseSearch = searchTerm.toLowerCase();
        if (item.type === 'bookmark') {
            return item.title.toLowerCase().includes(lowerCaseSearch) ||
                   item.url.toLowerCase().includes(lowerCaseSearch) ||
                   (item.summary ?? '').toLowerCase().includes(lowerCaseSearch);
        }
        if (item.type === 'folder') {
            return item.name.toLowerCase().includes(lowerCaseSearch);
        }
        return false;
    });

    const allBookmarks = filteredItems.filter((i) => i.type === 'bookmark') as Bookmark[];
    const allFolders = filteredItems.filter((i) => i.type === 'folder') as Folder[];

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
    
    const populatedFolders = Array.from(foldersById.values()).map(folder => {
        const folderBookmarks = allBookmarks.filter(bm => bm.parentId === folder.id);
        return {...folder, items: folderBookmarks};
    });

    return { folders: populatedFolders, rootBookmarks };
  }, [items, activeSpaceId, searchTerm]);

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
    if (!itemToDelete) return;

    // Optimistic update
    const originalItems = items;
    setItems(currentItems => {
        const itemsWithoutDeleted = currentItems.filter(i => i.id !== id);
        if (type === 'folder') {
            return itemsWithoutDeleted.map(i => {
                if (i.parentId === id) {
                    return { ...i, parentId: null };
                }
                return i;
            });
        }
        return itemsWithoutDeleted;
    });
    
    try {
      const result = await deleteItemAction({ id });
      // The optimistic update is usually sufficient. 
      // If server-side logic changes more state (e.g. un-nesting),
      // we might need to refresh state from the server response.
      // For now, we rely on optimistic + real-time updates.
      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted`,
        description: `Successfully removed.`,
      });

    } catch (error) {
      setItems(originalItems); // Revert on error
      console.error(`Failed to delete ${type}`, error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete ${type}.`,
      });
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
        setItems(prev => [...prev.filter(i => !bookmarks.find(b => b.id === i.id)), folder, ...bookmarks]);
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
            setSpaces((prev) => [...prev, newSpace]);
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
  
  const handleAppInfoSave = async (formData: FormData) => {
    setIsEditingAppInfo(false);
    try {
        const updatedInfo = await updateAppInfoAction(appInfo.id, formData);
        setAppInfo(updatedInfo);
        toast({ title: 'App info updated!', description: 'Your application name and icon have been changed.'});
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update app info.' });
    }
  }

    const handleWorkspaceGenerated = (newSpaces: Space[], newItems: SpaceItem[]) => {
        setSpaces(prev => [...prev, ...newSpaces]);
        setItems(prev => [...prev, ...newItems]);
        if (newSpaces.length > 0) {
            setActiveSpaceId(newSpaces[0].id);
        }
    };

    const handleExport = async () => {
        try {
            const jsonString = await exportWorkspaceAction(spaces.map(s => s.id));
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'workspace.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({ title: 'Export Successful', description: 'Your workspace has been downloaded as a JSON file.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Export Failed', description: 'Could not export your workspace.' });
        }
    };

  const isLogoUrl = appInfo.logo?.startsWith('http');
  const AppIcon = isLogoUrl ? null : getIcon(appInfo.logo);

  if (!isMounted) {
    return null; // or a skeleton loader
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 overflow-hidden w-full">
                {isLogoUrl ? (
                <img src={appInfo.logo} alt={appInfo.title} className="size-6 shrink-0 rounded-sm object-cover" />
                ) : (
                AppIcon && <AppIcon className="size-6 shrink-0" />
                )}
                <h1 className="text-lg font-semibold font-headline truncate">{appInfo.title}</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <DroppableSidebarMenu
              spaces={spaces}
              activeSpaceId={activeSpaceId}
              setActiveSpaceId={setActiveSpaceId}
              onEdit={setEditingSpace}
              onDelete={setDeletingSpace}
            />
          </SidebarContent>
          <SidebarFooter>
            <div className="flex rounded-md shadow-sm w-full">
                <Button onClick={() => setIsAddingSpace(true)} className="rounded-r-none relative z-10 flex-1">
                    <Plus className="mr-2" />
                    Add Space
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="rounded-l-none border-l-0 px-2">
                            <span className="sr-only">More settings</span>
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top">
                        <DropdownMenuItem onClick={() => setIsEditingAppInfo(true)}>
                            Edit Title & Logo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExport}>
                            Export Workspace
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className='flex items-center gap-2'>
              <SidebarTrigger />
              <h2 className="text-xl font-bold font-headline truncate">
                {activeSpace?.name ?? 'Dashboard'}
              </h2>
            </div>
            <div className='flex-grow max-w-md'>
                 <Input 
                    placeholder='Search in this space...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className='flex items-center gap-2'>
                <div className='flex items-center rounded-md bg-muted p-1'>
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
                        <LayoutGrid className='h-4 w-4' />
                        <span className='sr-only'>Grid View</span>
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                        <List className='h-4 w-4' />
                        <span className='sr-only'>List View</span>
                    </Button>
                </div>
                <div className="flex rounded-md shadow-sm">
                    <AddBookmarkDialog activeSpaceId={activeSpaceId} onBookmarkAdded={handleAddBookmark}>
                        <Button disabled={!activeSpaceId} className="rounded-r-none relative z-10">
                            <PlusCircle className="mr-2" />
                            Add Bookmark
                        </Button>
                    </AddBookmarkDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={!activeSpaceId} className="rounded-l-none border-l-0 px-2">
                                <span className="sr-only">More add options</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsAddingFromLibrary(true)}>
                                <Library className="mr-2 h-4 w-4" />
                                Add from Library
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsGeneratingWorkspace(true)}>
                                <Bot className="mr-2 h-4 w-4" />
                                Generate with AI
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {displayedItems.length > 0 ? (
              <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "flex flex-col gap-4"
              )}>
                {displayedItems.map(item => item.type === 'folder' ? (
                  <FolderCard
                    key={item.id}
                    folder={item}
                    onDeleted={handleDeleteItem}
                    onView={() => setViewingFolder(item as Folder)}
                    onNameUpdated={handleUpdateFolderName}
                    onCustomize={() => setCustomizingItem(item)}
                    viewMode={viewMode}
                  />
                ) : (
                  <BookmarkCard
                    key={item.id}
                    bookmark={item}
                    onEdit={() => setEditingBookmark(item)}
                    onDeleted={handleDeleteItem}
                    onCustomize={() => setCustomizingItem(item)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
                <h3 className="text-lg font-semibold font-headline">{searchTerm ? 'No results found' : (activeSpace ? 'This space is empty!' : 'No spaces yet!')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm ? `Your search for "${searchTerm}" did not match any items.` : (activeSpace ? `Add your first bookmark to '${activeSpace.name}' to get started.` : 'Create your first space using the [+] button in the sidebar.')}
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
      {isEditingAppInfo && (
        <EditAppInfoDialog
            appInfo={appInfo}
            onSave={handleAppInfoSave}
            onOpenChange={setIsEditingAppInfo}
        />
      )}
       {isAddingFromLibrary && (
        <AddFromLibraryDialog 
            tools={tools} 
            activeSpaceId={activeSpaceId} 
            onBookmarkAdded={handleAddBookmark}
            onOpenChange={setIsAddingFromLibrary}
        />
      )}
      {isGeneratingWorkspace && (
        <GenerateWorkspaceDialog
            onOpenChange={setIsGeneratingWorkspace}
            onWorkspaceGenerated={handleWorkspaceGenerated}
        />
      )}
    </DndContext>
  );
}

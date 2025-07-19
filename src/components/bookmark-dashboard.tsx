'use client';

import * as React from 'react';
import type { AppInfo, Bookmark, Folder, Space, SpaceItem, ToolsAi, AnalyzeSpaceOutput } from '@/lib/types';
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
  smartSearchAction,
  analyzeSpaceAction,
  suggestSpaceForUrlAction,
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
import { PlusCircle, Plus, LayoutGrid, List, MoreVertical, Library, Bot, ChevronDown, Settings, Search, Sparkles, Loader2 } from 'lucide-react';
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
import { Separator } from './ui/separator';
import { AnalyzeSpaceDialog } from './analyze-space-dialog';


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
        'group relative rounded-lg transition-colors',
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
      <div className="absolute right-1 top-1/2 -translate-y-1/2 group-data-[collapsible=icon]:hidden">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onEdit(space)}>Modifica Spazio</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                onClick={() => onDelete(space)}
            >
                Elimina Spazio
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
       </div>
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
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchResultIds, setSearchResultIds] = React.useState<Set<string> | null>(null);
  
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  
  const [appInfo, setAppInfo] = React.useState<AppInfo>(initialAppInfo);
  const [isEditingAppInfo, setIsEditingAppInfo] = React.useState(false);

  const [tools, setTools] = React.useState<ToolsAi[]>(initialTools);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isGeneratingWorkspace, setIsGeneratingWorkspace] = React.useState(false);
  const [isAddingFromLibrary, setIsAddingFromLibrary] = React.useState(false);

  const [analyzingSpace, setAnalyzingSpace] = React.useState<Space | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeSpaceOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

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
          if (currentItems.some(i => i.id === item.id)) return currentItems;
          return [...currentItems, item];
        });
      } catch (error) {
        console.error('Errore durante l\'elaborazione dell\'aggiornamento in tempo reale dell\'elemento:', error);
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
          if (currentSpaces.some(s => s.id === space.id)) return currentSpaces;
          return [...currentSpaces, space];
        });
      } catch (error) {
        console.error('Errore durante l\'elaborazione dell\'aggiornamento in tempo reale dello spazio:', error);
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
        console.error("Errore durante l'elaborazione dell'aggiornamento in tempo reale dello strumento:", error);
      }
    };
    
    const connectWithRetry = async (subscribeFn: () => Promise<() => void>, name: string) => {
        try {
            return await subscribeFn();
        } catch (err: any) {
            console.error(`Impossibile iscriversi alla collezione ${name}:`, err?.originalError || err);
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
  
  React.useEffect(() => {
    if (spaces.length > 0 && !spaces.find(s => s.id === activeSpaceId)) {
      setActiveSpaceId(spaces[0].id);
    } else if (spaces.length === 0) {
      setActiveSpaceId('');
    }
  }, [spaces, activeSpaceId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) {
        setSearchResultIds(null);
        return;
    }
    setIsSearching(true);
    try {
        const spaceBookmarks = items.filter(i => i.spaceId === activeSpaceId && i.type === 'bookmark') as Bookmark[];
        const ids = await smartSearchAction(searchTerm, spaceBookmarks);
        setSearchResultIds(new Set(ids));
    } catch (error) {
        console.error("Errore nella ricerca intelligente:", error);
        toast({ variant: "destructive", title: "Errore di Ricerca", description: "Impossibile eseguire la ricerca intelligente." });
    } finally {
        setIsSearching(false);
    }
  };

  const handleAnalyzeSpace = async () => {
    if (!activeSpace) return;
    setIsAnalyzing(true);
    setAnalyzingSpace(activeSpace);
    try {
        const spaceBookmarks = items.filter(i => i.spaceId === activeSpaceId && i.type === 'bookmark') as Bookmark[];
        const input = {
            spaceName: activeSpace.name,
            bookmarks: spaceBookmarks.map(b => ({ title: b.title, summary: b.summary }))
        };
        const result = await analyzeSpaceAction(input);
        setAnalysisResult(result);
    } catch (error) {
        console.error("Errore nell'analisi dello spazio:", error);
        toast({ variant: "destructive", title: "Errore di Analisi", description: "Impossibile analizzare lo spazio." });
        setAnalyzingSpace(null);
    } finally {
        setIsAnalyzing(false);
    }
  }


  const { folders, rootBookmarks } = React.useMemo(() => {
    const spaceItems = items.filter((item) => item.spaceId === activeSpaceId);
    
    let filteredItems = spaceItems;

    if (searchResultIds) {
        const allFolderIds = new Set(spaceItems.filter(i => i.type === 'folder').map(f => f.id));
        const bookmarksInResults = spaceItems.filter(i => searchResultIds.has(i.id));

        const parentFolderIds = new Set<string>();
        bookmarksInResults.forEach(b => {
            if (b.parentId && allFolderIds.has(b.parentId)) {
                parentFolderIds.add(b.parentId);
            }
        });
        
        filteredItems = spaceItems.filter(i => searchResultIds.has(i.id) || parentFolderIds.has(i.id));
    }


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
  }, [items, activeSpaceId, searchResultIds]);

  const displayedItems: SpaceItem[] = [...folders, ...rootBookmarks];

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  const handleAddBookmark = (newBookmark: Bookmark) => {
    setItems((prev) => [newBookmark, ...prev]);
    toast({
      title: 'Segnalibro aggiunto!',
      description: `"${newBookmark.title}" è stato salvato.`,
    });
  };
  
  const handleItemUpdate = (updatedItem: SpaceItem) => {
    setItems((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
    if (editingBookmark && editingBookmark.id === updatedItem.id) setEditingBookmark(null);
    if (customizingItem && customizingItem.id === updatedItem.id) setCustomizingItem(null);
  };

  const handleDeleteItem = async (id: string, type: 'bookmark' | 'folder') => {
    const originalItems = [...items];
    const itemToDelete = originalItems.find((i) => i.id === id);
    if (!itemToDelete) return;
  
    setItems((currentItems) => {
      let newItems = currentItems.filter((i) => i.id !== id);
      if (type === 'folder') {
        newItems = newItems.map((i) => {
          if (i.parentId === id) {
            return { ...i, parentId: null };
          }
          return i;
        });
      }
      return newItems;
    });
  
    try {
      const result = await deleteItemAction({ id });
  
      if (result.success && result.updatedBookmarks) {
        setItems((currentItems) => {
          const updatedMap = new Map(result.updatedBookmarks?.map(b => [b.id, b]));
          return currentItems
            .filter(i => i.id !== id) // Ensure folder is removed
            .map(i => updatedMap.get(i.id) || i); // Replace with updated bookmarks
        });
      }
  
      toast({
        title: `${type === 'bookmark' ? 'Segnalibro' : 'Cartella'} eliminat${type === 'bookmark' ? 'o' : 'a'}`,
        description: `Rimosso con successo.`,
      });
    } catch (error) {
      setItems(originalItems); // Revert on error
      console.error(`Impossibile eliminare ${type}`, error);
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: `Impossibile eliminare ${type}.`,
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
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile rinominare la cartella.' });
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
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile spostare l\'elemento.' });
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
         toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile creare la cartella.' });
       }
       return;
    }
    
    if (activeItem.type === 'bookmark' && overItem.type === 'folder' && activeItem.parentId !== overItem.id) {
        setItems(prev => prev.map(i => i.id === active.id ? {...i, parentId: String(over.id)} : i));
        try {
            await moveItemAction({ id: String(active.id), newParentId: String(over.id) });
        } catch (e) {
            setItems(prev => prev.map(i => i.id === active.id ? {...i, parentId: activeItem.parentId } : i));
            toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile spostare l\'elemento nella cartella.' });
        }
    }
  };

  const handleSpaceSave = async (spaceData: { name: string, icon: string }, id?: string) => {
    if (id) {
      const originalSpaces = spaces;
      setSpaces(prev => prev.map(s => s.id === id ? { ...s, ...spaceData } : s));
      setEditingSpace(null);
      try {
        await updateSpaceAction({ id, data: spaceData });
        toast({ title: 'Spazio aggiornato!', description: `"${spaceData.name}" è stato salvato.`});
      } catch (error) {
        setSpaces(originalSpaces);
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile aggiornare lo spazio.' });
      }
    } else {
        setIsAddingSpace(false);
        try {
            const newSpace = await createSpaceAction(spaceData);
            setSpaces((prev) => [...prev, newSpace]);
            setActiveSpaceId(newSpace.id);
            toast({ title: 'Spazio creato!', description: `"${spaceData.name}" è stato aggiunto.`});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile creare lo spazio.' });
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
      toast({ title: 'Spazio Eliminato', description: `"${spaceToDelete.name}" e tutti i suoi contenuti sono stati rimossi.` });
    } catch (error) {
      setSpaces(originalSpaces);
      setItems(originalItems);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile eliminare lo spazio.' });
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
        toast({ title: 'Info app aggiornate!', description: 'Il nome e l\'icona della tua applicazione sono stati cambiati.'});
    } catch (e) {
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile aggiornare le info dell\'app.' });
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
            toast({ title: 'Esportazione Riuscita', description: 'Il tuo spazio di lavoro è stato scaricato come file JSON.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Esportazione Fallita', description: 'Impossibile esportare il tuo spazio di lavoro.' });
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
                    Aggiungi Spazio
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="rounded-l-none border-l-0 px-2">
                            <span className="sr-only">Altre impostazioni</span>
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top">
                        <DropdownMenuItem onClick={() => setIsEditingAppInfo(true)}>
                            Modifica Titolo & Logo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExport}>
                            Esporta Spazio di Lavoro
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
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca con AI (es. 'strumenti per UI design')..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!e.target.value) setSearchResultIds(null);
                  }}
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
              </div>
            </form>
            <div className='flex items-center gap-2'>
                <Button variant="outline" size="sm" onClick={handleAnalyzeSpace} disabled={isAnalyzing || !activeSpace}>
                    {isAnalyzing ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Sparkles className='mr-2 h-4 w-4' />}
                    Analizza Spazio
                </Button>
                <div className='flex items-center rounded-md bg-muted p-1'>
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
                        <LayoutGrid className='h-4 w-4' />
                        <span className='sr-only'>Vista Griglia</span>
                    </Button>
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                        <List className='h-4 w-4' />
                        <span className='sr-only'>Vista Elenco</span>
                    </Button>
                </div>
                <div className="flex rounded-md shadow-sm">
                    <AddBookmarkDialog activeSpaceId={activeSpaceId} spaces={spaces} onBookmarkAdded={handleAddBookmark}>
                        <Button disabled={!activeSpaceId} className="rounded-r-none relative z-10">
                            <PlusCircle className="mr-2" />
                            Aggiungi Segnalibro
                        </Button>
                    </AddBookmarkDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button disabled={!activeSpaceId} className="rounded-l-none border-l-0 px-2">
                                <span className="sr-only">Altre opzioni di aggiunta</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsAddingFromLibrary(true)}>
                                <Library className="mr-2 h-4 w-4" />
                                Aggiungi dalla Libreria
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsGeneratingWorkspace(true)}>
                                <Bot className="mr-2 h-4 w-4" />
                                Genera con AI
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {displayedItems.length > 0 ? (
                <div className="flex flex-col gap-8">
                    {folders.length > 0 && (
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Cartelle</h3>
                            <div className={cn(
                                viewMode === 'grid'
                                ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                : "flex flex-col gap-4"
                            )}>
                                {folders.map(folder => (
                                <FolderCard
                                    key={folder.id}
                                    folder={folder}
                                    onDeleted={handleDeleteItem}
                                    onView={() => setViewingFolder(folder)}
                                    onNameUpdated={handleUpdateFolderName}
                                    onCustomize={() => setCustomizingItem(folder)}
                                    viewMode={viewMode}
                                />
                                ))}
                            </div>
                        </div>
                    )}

                    {folders.length > 0 && rootBookmarks.length > 0 && (
                        <Separator />
                    )}

                    {rootBookmarks.length > 0 && (
                        <div>
                             <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Segnalibri</h3>
                            <div className={cn(
                                viewMode === 'grid'
                                ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                : "flex flex-col gap-4"
                            )}>
                                {rootBookmarks.map(bookmark => (
                                <BookmarkCard
                                    key={bookmark.id}
                                    bookmark={bookmark}
                                    onEdit={() => setEditingBookmark(bookmark)}
                                    onDeleted={handleDeleteItem}
                                    onCustomize={() => setCustomizingItem(bookmark)}
                                    viewMode={viewMode}
                                />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
                <h3 className="text-lg font-semibold font-headline">{searchResultIds ? 'Nessun risultato trovato' : (activeSpace ? 'Questo spazio è vuoto!' : 'Nessuno spazio ancora!')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchResultIds ? `La tua ricerca per "${searchTerm}" non ha prodotto risultati.` : (activeSpace ? `Aggiungi il tuo primo segnalibro a '${activeSpace.name}' per iniziare.` : 'Crea il tuo primo spazio usando il pulsante [+] nella barra laterale.')}
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
                <AlertDialogTitle>Eliminare "{deletingSpace.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questo eliminerà permanentemente questo spazio e tutti i segnalibri e le cartelle al suo interno. Questa azione non può essere annullata.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={handleConfirmDeleteSpace}
                >
                  Elimina
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
      {analyzingSpace && (
        <AnalyzeSpaceDialog
            space={analyzingSpace}
            result={analysisResult}
            onOpenChange={(open) => {
                if (!open) {
                    setAnalyzingSpace(null);
                    setAnalysisResult(null);
                }
            }}
        />
       )}
    </DndContext>
  );
}

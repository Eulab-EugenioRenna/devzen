
'use client';

import * as React from 'react';
import type { AppInfo, Bookmark, Folder, Space, SpaceItem, ToolsAi, AnalyzeSpaceOutput, SpaceLink } from '@/lib/types';
import {
  DndContext,
  useDroppable,
  useDraggable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import {
  addBookmarkAction,
  updateBookmarkAction,
  deleteItemAction,
  moveItemAction,
  createFolderAction,
  createSpaceAction,
  updateSpaceAction,
  deleteSpaceAction,
  updateFolderNameAction,
  updateAppInfoAction,
  addBookmarkFromLibraryAction,
  createWorkspaceFromJsonAction,
  exportWorkspaceAction,
  smartSearchAction,
  analyzeSpaceAction,
  getItemsAction,
  getSpacesAction,
  customizeItemAction,
  duplicateItemAction,
  createSpaceLinkAction
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
import { PlusCircle, Plus, LayoutGrid, List, MoreVertical, Library, Bot, ChevronDown, Settings, Search, Sparkles, Loader2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { AddEditSpaceDialog } from '@/components/add-edit-space-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FolderViewDialog } from './folder-view-dialog';
import { CustomizeItemDialog } from './customize-item-dialog';
import { Input } from './ui/input';
import { EditAppInfoDialog } from './edit-app-info-dialog';
import { AddFromLibraryDialog } from './add-from-library-dialog';
import { pb, toolsAiCollectionName, bookmarksCollectionName, spacesCollectionName } from '@/lib/pocketbase';
import { GenerateWorkspaceDialog } from './generate-workspace-dialog';
import { Separator } from './ui/separator';
import { AnalyzeSpaceDialog } from './analyze-space-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


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
  const { setNodeRef, isOver } = useDroppable({
    id: `space-sidebar-${space.id}`,
    data: { type: 'space-sidebar', item: space },
  });

   const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({
    id: `space-drag-${space.id}`,
    data: { type: 'space', item: space },
  });

  const Icon = getIcon(space.icon);

  return (
    <SidebarMenuItem
      ref={setNodeRef}
      className={cn(
        'group relative rounded-lg transition-colors',
        isOver ? 'bg-sidebar-accent/20' : 'bg-transparent'
      )}
    >
      <div className='flex items-center w-full'>
          <div 
              ref={setDraggableNodeRef} 
              {...listeners} 
              {...attributes} 
              className="p-2 cursor-grab touch-none"
              onClick={(e) => e.stopPropagation()}
          >
              <GripVertical className="h-4 w-4 text-sidebar-foreground/50" />
          </div>
          <SidebarMenuButton
              onClick={() => onClick(space.id)}
              isActive={isActive}
              tooltip={space.name}
              className="pr-8 flex-1"
          >
              <Icon />
              <span>{space.name}</span>
          </SidebarMenuButton>
      </div>
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
  const [draggedItem, setDraggedItem] = React.useState<SpaceItem | Space | null>(null);
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
  
  const [showLinks, setShowLinks] = React.useState(false);

  const [tools, setTools] = React.useState<ToolsAi[]>(initialTools);
  const [isMounted, setIsMounted] = React.useState(false);
  const [isGeneratingWorkspace, setIsGeneratingWorkspace] = React.useState(false);
  const [isAddingFromLibrary, setIsAddingFromLibrary] = React.useState(false);

  const [analyzingSpace, setAnalyzingSpace] = React.useState<Space | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<AnalyzeSpaceOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const { toast } = useToast();

  const refreshAllData = React.useCallback(async () => {
    const [refreshedSpaces, refreshedItems] = await Promise.all([
      getSpacesAction(),
      getItemsAction()
    ]);
    setSpaces(refreshedSpaces);
    setItems(refreshedItems);
  }, []);

  const refreshItems = React.useCallback(async () => {
    setItems(await getItemsAction());
  }, []);

  const refreshSpaces = React.useCallback(async () => {
    setSpaces(await getSpacesAction());
  }, []);


  React.useEffect(() => {
    setIsMounted(true);
    
    const handleSubscriptionChange = (e: {action: string, record: any}) => {
      console.log('Subscription change received:', e);
      refreshAllData();
    };
    
    const subscribeToCollection = async (collectionName: string) => {
        try {
            await pb.collection(collectionName).subscribe('*', handleSubscriptionChange);
        } catch (err: any) {
            console.error(`Failed to subscribe to ${collectionName}:`, err?.originalError || err);
        }
    };

    subscribeToCollection(bookmarksCollectionName);
    subscribeToCollection(spacesCollectionName);
    subscribeToCollection(toolsAiCollectionName);


    return () => {
      pb.collection(bookmarksCollectionName).unsubscribe('*');
      pb.collection(spacesCollectionName).unsubscribe('*');
      pb.collection(toolsAiCollectionName).unsubscribe('*');
    };
  }, [refreshAllData]);
  
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


  const { folders, rootBookmarks, spaceLinks } = React.useMemo(() => {
    const spaceItems = items.filter((item) => item.spaceId === activeSpaceId);
    
    let filteredItems = spaceItems;

    if (searchResultIds) {
        const allFolderIds = new Set(spaceItems.filter(i => i.type === 'folder').map(f => f.id));
        const bookmarksInResults = spaceItems.filter(i => searchResultIds.has(i.id));

        const parentFolderIds = new Set<string>();
        bookmarksInResults.forEach(b => {
            if (b.type === 'bookmark' && b.parentId && allFolderIds.has(b.parentId)) {
                parentFolderIds.add(b.parentId);
            }
        });
        
        filteredItems = spaceItems.filter(i => searchResultIds.has(i.id) || parentFolderIds.has(i.id));
    }


    const allBookmarks = filteredItems.filter((i) => i.type === 'bookmark') as Bookmark[];
    const allFolders = filteredItems.filter((i) => i.type === 'folder') as Folder[];
    const allSpaceLinks = filteredItems.filter((i) => i.type === 'space-link') as SpaceLink[];

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

    return { folders: populatedFolders, rootBookmarks, spaceLinks: allSpaceLinks };
  }, [items, activeSpaceId, searchResultIds]);

  const displayedItems: SpaceItem[] = [...folders, ...rootBookmarks, ...spaceLinks];
  
  const sidebarSpaces = React.useMemo(() => {
    return showLinks ? spaces : spaces.filter(s => !s.isLink);
  }, [spaces, showLinks]);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  const handleAddBookmark = async (values: {title: string, url: string, spaceId: string}) => {
    await addBookmarkAction(values);
    await refreshItems();
    toast({
        title: 'Segnalibro aggiunto!',
        description: `"${values.title}" è stato salvato.`,
    });
  };
  
  const handleItemUpdate = async (updatedItem: Partial<Bookmark>) => {
    try {
        await updateBookmarkAction({id: editingBookmark!.id, ...updatedItem});
        await refreshItems();
        setEditingBookmark(null);
        if (customizingItem) setCustomizingItem(null);
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'Errore sconosciuto';
        toast({ variant: "destructive", title: "Errore di aggiornamento", description: errorMessage });
    }
  };

  const handleCustomizeItem = async (customizationData: any) => {
    try {
        await customizeItemAction({ id: customizingItem!.id, ...customizationData });
        await refreshItems();
        setCustomizingItem(null);
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore imprevisto.';
        toast({
          variant: 'destructive',
          title: 'Errore',
          description: `Impossibile aggiornare la personalizzazione: ${errorMessage}`,
        });
    }
  };

  const handleDeleteItem = async (id: string, type: 'bookmark' | 'folder' | 'space-link') => {
    await deleteItemAction({ id });
    await refreshItems();
    toast({
        title: `${type === 'bookmark' ? 'Segnalibro' : 'Cartella'} eliminat${type === 'bookmark' ? 'o' : 'a'}`,
        description: `Rimosso con successo.`,
    });
  };

  const handleUpdateFolderName = async (id: string, name: string) => {
    try {
      await updateFolderNameAction({ id, name });
      await refreshItems();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile rinominare la cartella.' });
    }
  }
  
  const handleDuplicateItem = async (item: SpaceItem) => {
    try {
        await duplicateItemAction(item);
        await refreshItems();
        toast({ title: 'Elemento duplicato!', description: 'La copia è stata creata con successo.'});
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Impossibile duplicare l\'elemento.';
        toast({ variant: 'destructive', title: 'Errore', description: message });
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItem(event.active.data.current?.item ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggedItem(null);
    const { active, over } = event;
  
    if (!over || !active.id || active.id === over.id) return;
  
    const activeItem = active.data.current?.item as SpaceItem | Space;
    const activeType = active.data.current?.type as string;
    const overId = String(over.id);
    const overItem = over.data.current?.item as SpaceItem | Space;
    const overType = over.data.current?.type as string;

    try {
      if (activeType === 'space' && overType === 'space-content') {
        const targetSpaceId = overId.replace('space-content-', '');
        await createSpaceLinkAction(activeItem as Space, targetSpaceId);
      } else if (overType.startsWith('space-sidebar')) {
        const newSpaceId = overItem.id;
        if (activeType === 'folder' || activeType === 'bookmark') {
          await moveItemAction({ id: String(active.id), newSpaceId });
        }
      } else {
        const overItemFromState = items.find(i => i.id === overId);
        if (!overItemFromState) return;
  
        if (activeType === 'bookmark' && overItemFromState.type === 'bookmark' && activeItem.spaceId === overItemFromState.spaceId) {
          await createFolderAction({ spaceId: (activeItem as SpaceItem).spaceId!, initialBookmarkIds: [String(active.id), overId] });
        } else if (activeType === 'bookmark' && overItemFromState.type === 'folder' && (activeItem as Bookmark).parentId !== overItemFromState.id) {
          await moveItemAction({ id: String(active.id), newParentId: overId });
        }
      }
      await refreshAllData();
    } catch (e) {
      console.error("Drag end error:", e);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile spostare l\'elemento.' });
      await refreshAllData();
    }
  };

  const handleSpaceSave = async (spaceData: { name: string, icon: string }, id?: string) => {
    try {
        if (id) {
            await updateSpaceAction({ id, data: spaceData });
            toast({ title: 'Spazio aggiornato!', description: `"${spaceData.name}" è stato salvato.`});
        } else {
            const newSpace = await createSpaceAction(spaceData);
            setActiveSpaceId(newSpace.id);
            toast({ title: 'Spazio creato!', description: `"${spaceData.name}" è stato aggiunto.`});
        }
        await refreshSpaces();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Errore', description: `Impossibile salvare lo spazio.` });
    } finally {
        setIsAddingSpace(false);
        setEditingSpace(null);
    }
  };

  const handleConfirmDeleteSpace = async () => {
    if (!deletingSpace) return;
    const spaceName = deletingSpace.name;
    try {
      await deleteSpaceAction({ id: deletingSpace.id });
      await refreshAllData(); 
      toast({ title: 'Spazio Eliminato', description: `"${spaceName}" e tutti i suoi contenuti sono stati rimossi.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile eliminare lo spazio.' });
    } finally {
        setDeletingSpace(null);
    }
  };
  
  const handleItemMove = async (item: SpaceItem) => {
    await refreshItems();
  };
  
  const handleAppInfoSave = async (formData: FormData) => {
    try {
        const updatedInfo = await updateAppInfoAction(appInfo.id, formData);
        setAppInfo(updatedInfo);
        setIsEditingAppInfo(false);
        toast({ title: 'Info app aggiornate!', description: 'Il nome e l\'icona della tua applicazione sono stati cambiati.'});
    } catch (e) {
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile aggiornare le info dell\'app.' });
    }
  }

  const handleWorkspaceGenerated = async () => {
    await refreshAllData();
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

    const handleAddFromLibrary = async (tool: ToolsAi) => {
        try {
            await addBookmarkFromLibraryAction({ toolId: tool.id, spaceId: activeSpaceId });
            await refreshItems();
            toast({ title: 'Segnalibro Importato', description: `"${tool.name}" è stato importato nel tuo spazio.` });
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore imprevisto.';
            toast({ variant: 'destructive', title: 'Errore', description: `Impossibile importare il segnalibro: ${errorMessage}` });
        }
    };


  const isLogoUrl = appInfo.logo?.startsWith('http');
  const AppIcon = isLogoUrl ? null : getIcon(appInfo.logo);

  const { setNodeRef: setSpaceContentRef, isOver: isOverSpaceContent } = useDroppable({
    id: `space-content-${activeSpaceId}`,
    data: { type: 'space-content' },
  });

  const DraggedSpaceIcon = React.useMemo(() => {
    if (draggedItem && (draggedItem as any).type === 'space') {
      return getIcon((draggedItem as Space).icon);
    }
    return null;
  }, [draggedItem]);


  if (!isMounted) {
    return null; 
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
              spaces={sidebarSpaces}
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
                         <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={showLinks}
                            onCheckedChange={setShowLinks}
                        >
                            Mostra Spazi Collegati
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
           <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="lg:hidden" />
              <h2 className="hidden text-xl font-bold font-headline truncate sm:block">
                {activeSpace?.name ?? 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex flex-1 justify-center px-4">
              <form onSubmit={handleSearch} className="w-full max-w-md">
                <div className="relative flex items-center">
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
            </div>

            <div className='flex items-center gap-2'>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className='shrink-0' onClick={handleAnalyzeSpace} disabled={isAnalyzing || !activeSpace}>
                                {isAnalyzing ? <Loader2 className='h-4 w-4 animate-spin' /> : <Sparkles className='h-4 w-4' />}
                                <span className='sr-only'>Analizza Spazio</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Analizza Spazio</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <div className='hidden items-center rounded-md bg-muted p-1 md:flex'>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
                                    <LayoutGrid className='h-4 w-4' />
                                    <span className='sr-only'>Vista Griglia</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Vista Griglia</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}>
                                    <List className='h-4 w-4' />
                                    <span className='sr-only'>Vista Elenco</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Vista Elenco</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                
                <div className="flex rounded-md shadow-sm">
                     <AddBookmarkDialog activeSpaceId={activeSpaceId} spaces={spaces} onBookmarkAdded={handleAddBookmark}>
                         <Button disabled={!activeSpaceId} className="rounded-r-none relative z-10">
                            <PlusCircle className="mr-2 h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">Aggiungi</span>
                            <span className="sr-only sm:hidden">Aggiungi Segnalibro</span>
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
          <main ref={setSpaceContentRef} className={cn("flex-1 overflow-y-auto p-4 sm:p-6", isOverSpaceContent && 'bg-primary/5')}>
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
                                    onDuplicate={() => handleDuplicateItem(folder)}
                                    viewMode={viewMode}
                                />
                                ))}
                            </div>
                        </div>
                    )}
                    
                     {spaceLinks.length > 0 && (
                        <div>
                            <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Collegamenti Spazio</h3>
                            <div className={cn(
                                viewMode === 'grid'
                                ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                : "flex flex-col gap-4"
                            )}>
                                {spaceLinks.map(link => (
                                <FolderCard
                                    key={link.id}
                                    folder={link}
                                    onDeleted={handleDeleteItem}
                                    onView={() => setActiveSpaceId(link.linkedSpaceId)}
                                    onNameUpdated={() => {}} // Cannot rename links
                                    onCustomize={() => setCustomizingItem(link)}
                                    onDuplicate={() => handleDuplicateItem(link)}
                                    viewMode={viewMode}
                                />
                                ))}
                            </div>
                        </div>
                    )}


                    {(folders.length > 0 || spaceLinks.length > 0) && rootBookmarks.length > 0 && (
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
                                    onDuplicate={() => handleDuplicateItem(bookmark)}
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
            (draggedItem as any).type === 'bookmark' ? (
                <BookmarkCard
                    bookmark={draggedItem as Bookmark}
                    onEdit={() => {}}
                    onDeleted={() => {}}
                    onCustomize={() => {}}
                    onDuplicate={() => {}}
                    isOverlay
                />
            ) : (draggedItem as any).type === 'folder' || (draggedItem as any).type === 'space-link' ? (
                <FolderCard
                    folder={draggedItem as Folder}
                    onDeleted={() => {}}
                    onView={() => {}}
                    onNameUpdated={() => {}}
                    onCustomize={() => {}}
                    onDuplicate={() => {}}
                    isOverlay
                />
            ) : (draggedItem as any).type === 'space' && DraggedSpaceIcon ? (
                 <div className="flex items-center gap-2 overflow-hidden w-64 bg-primary text-primary-foreground p-3 rounded-lg shadow-2xl">
                    <DraggedSpaceIcon className="size-6 shrink-0" />
                    <h1 className="text-base font-semibold font-headline truncate">{(draggedItem as Space).name}</h1>
                </div>
            ) : null
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
            onItemUpdated={handleCustomizeItem}
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
            onBookmarkAdded={handleAddFromLibrary}
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

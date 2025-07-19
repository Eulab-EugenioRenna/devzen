
'use client';

import * as React from 'react';
import type { AppInfo, Bookmark, Folder, Space, SpaceItem, ToolsAi, AnalyzeSpaceOutput, SpaceLink } from '@/lib/types';
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  type Active,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import {
  addBookmarkAction,
  addBookmarkOrNoteAction,
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
  createSpaceLinkAction,
  unlinkSpaceAction,
  chatInSpaceAction
} from '@/app/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getIcon } from '@/components/icons';
import { BookmarkCard } from '@/components/bookmark-card';
import { FolderCard } from '@/components/folder-card';
import { EditBookmarkDialog } from '@/components/edit-bookmark-dialog';
import { AddEditSpaceDialog } from './add-edit-space-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FolderViewDialog } from './folder-view-dialog';
import { CustomizeItemDialog } from './customize-item-dialog';
import { EditAppInfoDialog } from './edit-app-info-dialog';
import { AddFromLibraryDialog } from './add-from-library-dialog';
import { pb, toolsAiCollectionName, bookmarksCollectionName, spacesCollectionName } from '@/lib/pocketbase';
import { GenerateWorkspaceDialog } from './generate-workspace-dialog';
import { AnalyzeSpaceDialog } from './analyze-space-dialog';
import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardContent } from './dashboard-content';
import { NoteViewDialog } from './note-view-dialog';
import { NoteEditViewDialog } from './note-edit-view-dialog';

interface DashboardContextType {
  // State
  spaces: Space[];
  items: SpaceItem[];
  activeSpaceId: string;
  viewMode: 'grid' | 'list';
  appInfo: AppInfo;
  tools: ToolsAi[];
  showLinks: boolean;
  activeDragItem: Active | null;
  searchTerm: string;
  isSearching: boolean;
  searchResultIds: Set<string> | null;
  isAnalyzing: boolean;

  // Setters
  setActiveSpaceId: (id: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setShowLinks: (show: boolean) => void;
  setSearchTerm: (term: string) => void;
  setSearchResultIds: (ids: Set<string> | null) => void;

  // Handlers
  handleSpaceSave: (data: { name: string; icon: string; category?: string }, id?: string) => void;
  handleEditSpace: (space: Space | null) => void;
  handleNewSpaceClick: () => void;
  handleDeleteSpace: (space: Space) => void;
  handleUnlinkSpace: (link: SpaceLink) => void;
  handleAppInfoSave: (formData: FormData) => void;
  handleEditAppInfo: () => void;
  handleExport: () => void;
  handleGenerateWorkspace: () => void;
  handleAnalyzeSpace: () => void;
  handleAddBookmarkOrNote: (values: { text: string; spaceId: string; }) => Promise<void>;
  handleAddFromLibrary: () => void;
  handleSearch: (e: React.FormEvent) => void;
  handleItemDelete: (id: string, type: 'bookmark' | 'folder' | 'space-link') => void;
  handleItemEdit: (bookmark: Bookmark) => void;
  handleItemCustomize: (item: SpaceItem) => void;
  handleItemDuplicate: (item: SpaceItem) => void;
  handleItemMove: (item: SpaceItem) => void;
  handleFolderView: (folder: Folder) => void;
  handleNoteView: (note: Bookmark) => void;
  handleTextNoteView: (note: Bookmark) => void;
  handleUpdateFolderName: (id: string, name: string) => void;
}

const DashboardContext = React.createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a BookmarkDashboardProvider');
  }
  return context;
};

export function BookmarkDashboardProvider({ initialItems, initialSpaces, initialAppInfo, initialTools }: { initialItems: SpaceItem[], initialSpaces: Space[], initialAppInfo: AppInfo, initialTools: ToolsAi[] }) {
  const [spaces, setSpaces] = React.useState<Space[]>(initialSpaces);
  const [items, setItems] = React.useState<SpaceItem[]>(initialItems);
  const [activeSpaceId, setActiveSpaceId] = React.useState<string>(initialSpaces[0]?.id ?? '');
  const [editingBookmark, setEditingBookmark] = React.useState<Bookmark | null>(null);
  const [activeDragItem, setActiveDragItem] = React.useState<Active | null>(null);
  const [editingSpace, setEditingSpace] = React.useState<Space | null>(null);
  const [isAddingSpace, setIsAddingSpace] = React.useState(false);
  const [deletingSpace, setDeletingSpace] = React.useState<Space | null>(null);
  const [viewingFolder, setViewingFolder] = React.useState<Folder | null>(null);
  const [viewingNote, setViewingNote] = React.useState<Bookmark | null>(null);
  const [viewingTextNote, setViewingTextNote] = React.useState<Bookmark | null>(null);
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

  const [linkingSpacesInfo, setLinkingSpacesInfo] = React.useState<{ source: Space; target: Space; } | null>(null);
  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

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
    setAnalysisResult(null); // Reset previous result
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
        setAnalyzingSpace(null); // Close dialog on error
    } finally {
        setIsAnalyzing(false);
    }
  }

  const handleAddBookmarkOrNote = async (values: {text: string, spaceId: string}) => {
    await addBookmarkOrNoteAction(values);
    await refreshItems();
    toast({
        title: 'Elemento aggiunto!',
        description: `Il tuo nuovo elemento è stato salvato.`,
    });
  };
  
  const handleItemUpdate = async (updatedItem: Partial<Bookmark>) => {
    if (!editingBookmark) return;
    try {
        await updateBookmarkAction({id: editingBookmark.id, ...updatedItem, title: updatedItem.title!, url: updatedItem.url!});
        await refreshItems();
        setEditingBookmark(null);
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'Errore sconosciuto';
        toast({ variant: "destructive", title: "Errore di aggiornamento", description: errorMessage });
    }
  };

  const handleNoteUpdate = async (id: string, title: string, summary: string) => {
    const noteToUpdate = items.find(i => i.id === id);
    if (!noteToUpdate || noteToUpdate.type !== 'bookmark') return;

    try {
        await updateBookmarkAction({id, title, url: noteToUpdate.url, summary});
        await refreshItems();
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'Errore sconosciuto';
        toast({ variant: "destructive", title: "Errore di aggiornamento nota", description: errorMessage });
    }
  };

  const handleCustomizeItem = async (customizationData: any) => {
    if (!customizingItem) return;
    try {
        await customizeItemAction({ id: customizingItem.id, ...customizationData });
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
    await refreshAllData(); // Refresh all data to ensure spaces list is also updated
    toast({
        title: `${type === 'bookmark' ? 'Segnalibro' : type === 'folder' ? 'Cartella' : 'Collegamento'} eliminat${type === 'bookmark' ? 'o' : 'a'}`,
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
    setActiveDragItem(event.active);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || !active.id || active.id === over.id) {
        return;
    }

    const activeType = active.data.current?.type as string;
    const activeItem = active.data.current?.item;
    const overType = over.data.current?.type as string;
    const overId = String(over.id);

    // Scenario: Dragging a Space from sidebar to the main content area to create a link
    if (activeType === 'space' && overId === 'space-link-droppable-area' && activeSpace) {
        const sourceSpace = activeItem as Space;
        if (sourceSpace && activeSpace && sourceSpace.id !== activeSpace.id) {
            setLinkingSpacesInfo({ source: sourceSpace, target: activeSpace });
        }
        return; // Stop further processing
    }

    // Handle all other drag-and-drop scenarios
    try {
        if ((activeType === 'bookmark' || activeType === 'folder') && overType.startsWith('space-sidebar-')) {
            const newSpaceId = overId.replace('space-sidebar-', '');
            if (newSpaceId && activeItem.spaceId !== newSpaceId) {
                await moveItemAction({ id: activeItem.id, newSpaceId });
            }
        } else if (activeType === 'bookmark' && overType === 'bookmark' && activeItem.spaceId === over.data.current?.item.spaceId) {
            await createFolderAction({ spaceId: activeItem.spaceId!, initialBookmarkIds: [activeItem.id, overId] });
        } else if (activeType === 'bookmark' && overType === 'folder' && activeItem.parentId !== overId) {
            await moveItemAction({ id: activeItem.id, newParentId: overId });
        }
        await refreshAllData();
    } catch (e) {
        console.error("Drag end error:", e);
        toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile spostare l\'elemento.' });
        await refreshAllData(); // Refresh on error to revert optimistic updates if any
    }
  };

  const handleConfirmSpaceLink = async () => {
    if (!linkingSpacesInfo) return;
    try {
        await createSpaceLinkAction(linkingSpacesInfo.source, linkingSpacesInfo.target.id);
        await refreshAllData();
        toast({
            title: 'Collegamento Spazio Creato!',
            description: `Un collegamento a "${linkingSpacesInfo.source.name}" è stato aggiunto a "${linkingSpacesInfo.target.name}".`,
        });
    } catch (error) {
        console.error("Errore nella creazione del collegamento tra spazi:", error);
        toast({ variant: "destructive", title: "Errore", description: "Impossibile creare il collegamento tra spazi." });
    } finally {
        setLinkingSpacesInfo(null);
    }
  };

  const handleUnlinkSpace = async (link: SpaceLink) => {
    try {
      await unlinkSpaceAction({ id: link.id, linkedSpaceId: link.linkedSpaceId });
      await refreshAllData();
      toast({ title: 'Spazio Ripristinato', description: `Lo spazio "${link.name}" è ora di nuovo visibile nella sidebar.` });
    } catch (error) {
      console.error("Errore nel ripristino dello spazio:", error);
      toast({ variant: "destructive", title: "Errore", description: "Impossibile ripristinare lo spazio." });
    }
  };

  const handleSpaceSave = async (spaceData: { name: string, icon: string, category?: string }, id?: string) => {
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

  const handleAddFromLibraryFlow = async (tool: ToolsAi) => {
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
  
  const handleNewSpaceClick = () => {
    setEditingSpace(null);
    setIsAddingSpace(true);
  };

  if (!isMounted) {
    return null; 
  }
  
  const contextValue: DashboardContextType = {
    spaces,
    items,
    activeSpaceId,
    viewMode,
    appInfo,
    tools,
    showLinks,
    activeDragItem,
    searchTerm,
    isSearching,
    searchResultIds,
    isAnalyzing: isAnalyzing || (!!analyzingSpace && !analysisResult),
    setActiveSpaceId,
    setViewMode,
    setShowLinks,
    setSearchTerm,
    setSearchResultIds,
    handleSpaceSave,
    handleEditSpace: setEditingSpace,
    handleNewSpaceClick,
    handleDeleteSpace: setDeletingSpace,
    handleUnlinkSpace,
    handleAppInfoSave,
    handleEditAppInfo: () => setIsEditingAppInfo(true),
    handleExport,
    handleGenerateWorkspace: () => setIsGeneratingWorkspace(true),
    handleAnalyzeSpace,
    handleAddBookmarkOrNote,
    handleAddFromLibrary: () => setIsAddingFromLibrary(true),
    handleSearch,
    handleItemDelete: handleDeleteItem,
    handleItemEdit: setEditingBookmark,
    handleItemCustomize: setCustomizingItem,
    handleItemDuplicate: handleDuplicateItem,
    handleItemMove: handleItemMove,
    handleFolderView: setViewingFolder,
    handleNoteView: setViewingNote,
    handleTextNoteView: setViewingTextNote,
    handleUpdateFolderName: handleUpdateFolderName,
  };


  return (
    <DashboardContext.Provider value={contextValue}>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SidebarProvider>
          <DashboardSidebar />
          <DashboardContent />
        </SidebarProvider>
        
        {isMounted && createPortal(
          <DragOverlay>
            {activeDragItem ? (() => {
              const draggedItem = activeDragItem.data.current?.item;
              const type = activeDragItem.data.current?.type;

              if (type === 'bookmark' && draggedItem) {
                return <BookmarkCard bookmark={draggedItem as Bookmark} onEdit={() => {}} onDeleted={() => {}} onCustomize={() => {}} onDuplicate={() => {}} onViewNote={() => {}} onViewTextNote={() => {}} isOverlay isDragging={false} />;
              }
              if ((type === 'folder' || type === 'space-link') && draggedItem) {
                return <FolderCard folder={draggedItem as Folder} onDeleted={() => {}} onView={() => {}} onNameUpdated={() => {}} onCustomize={() => {}} onDuplicate={() => {}} onUnlink={() => {}} isOverlay isDragging={false} />;
              }
              if (type === 'space' && draggedItem) {
                  const space = draggedItem as Space;
                  const Icon = getIcon(space.icon);
                  return (
                      <div className="flex items-center gap-2 overflow-hidden w-64 bg-primary text-primary-foreground p-3 rounded-lg shadow-2xl">
                          <Icon className="size-6 shrink-0" />
                          <h1 className="text-base font-semibold font-headline truncate">{space.name}</h1>
                      </div>
                  );
              }
              return null;
            })() : null}
          </DragOverlay>,
          document.body
        )}
        
        {editingBookmark && <EditBookmarkDialog bookmark={editingBookmark} onOpenChange={(open) => !open && setEditingBookmark(null)} onBookmarkUpdated={handleItemUpdate} />}
        {(isAddingSpace || editingSpace) && <AddEditSpaceDialog space={editingSpace} onSave={handleSpaceSave} onOpenChange={(open) => { if (!open) { setIsAddingSpace(false); setEditingSpace(null); } }} />}
        {deletingSpace && <AlertDialog open={!!deletingSpace} onOpenChange={(open) => !open && setDeletingSpace(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminare "{deletingSpace.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questo eliminerà permanentemente questo spazio e tutti i segnalibri e le cartelle al suo interno. Questa azione non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleConfirmDeleteSpace}>Elimina</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
           </AlertDialog>
        }
        {viewingFolder && <FolderViewDialog folder={viewingFolder} onOpenChange={(open) => !open && setViewingFolder(null)} onItemMove={handleItemMove} onItemDelete={handleDeleteItem} />}
        {viewingNote && <NoteViewDialog
            note={viewingNote}
            space={spaces.find(s => s.id === viewingNote.spaceId)!}
            spaceBookmarks={items.filter(i => i.spaceId === viewingNote.spaceId && i.type === 'bookmark') as Bookmark[]}
            libraryTools={tools}
            onOpenChange={(open) => !open && setViewingNote(null)}
            onNoteUpdated={handleNoteUpdate}
        />}
        {viewingTextNote && <NoteEditViewDialog
          note={viewingTextNote}
          onOpenChange={(open) => !open && setViewingTextNote(null)}
          onNoteUpdated={handleNoteUpdate}
        />}
        {customizingItem && <CustomizeItemDialog item={customizingItem} onOpenChange={(open) => !open && setCustomizingItem(null)} onItemUpdated={handleCustomizeItem} />}
        {isEditingAppInfo && <EditAppInfoDialog appInfo={appInfo} onSave={handleAppInfoSave} onOpenChange={setIsEditingAppInfo} />}
        {isAddingFromLibrary && <AddFromLibraryDialog tools={tools} onBookmarkAdded={handleAddFromLibraryFlow} onOpenChange={setIsAddingFromLibrary} />}
        {isGeneratingWorkspace && <GenerateWorkspaceDialog onOpenChange={setIsGeneratingWorkspace} onWorkspaceGenerated={handleWorkspaceGenerated} />}
        {analyzingSpace && <AnalyzeSpaceDialog 
            space={analyzingSpace} 
            spaceBookmarks={items.filter(i => i.spaceId === analyzingSpace.id && i.type === 'bookmark') as Bookmark[]}
            libraryTools={tools}
            analysisResult={analysisResult} 
            isLoadingAnalysis={isAnalyzing}
            onOpenChange={(open) => { if (!open) { setAnalyzingSpace(null); setAnalysisResult(null); } }} 
            onNoteSaved={refreshItems}
        />}
        {linkingSpacesInfo && <AlertDialog open={!!linkingSpacesInfo} onOpenChange={(open) => !open && setLinkingSpacesInfo(null)}>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Conferma Collegamento Spazio</AlertDialogTitle>
                          <AlertDialogDescription>
                              Stai per collegare lo spazio "{linkingSpacesInfo.source.name}" all'interno di "{linkingSpacesInfo.target.name}".
                              Lo spazio originale sarà nascosto dalla sidebar (potrai mostrarlo di nuovo tramite le impostazioni).
                              Vuoi procedere?
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setLinkingSpacesInfo(null)}>Annulla</AlertDialogCancel>
                          <AlertDialogAction onClick={handleConfirmSpaceLink}>Conferma</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
        }
      </DndContext>
    </DashboardContext.Provider>
  );
}

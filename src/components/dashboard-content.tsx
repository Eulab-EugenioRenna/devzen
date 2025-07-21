
'use client';

import * as React from 'react';
import { useDashboard } from './bookmark-dashboard-provider';
import type { Bookmark, Folder, SpaceItem, SpaceLink } from '@/lib/types';
import { useDroppable } from '@dnd-kit/core';

import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { AddBookmarkDialog } from '@/components/add-bookmark-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FolderCard } from '@/components/folder-card';
import { BookmarkCard } from '@/components/bookmark-card';

import { cn } from '@/lib/utils';
import { PlusCircle, Plus, LayoutGrid, List, ChevronDown, Library, Bot, Search, Sparkles, Loader2, Link as LinkIcon, BrainCircuit } from 'lucide-react';

export function DashboardContent() {
  const {
    spaces,
    items,
    activeSpaceId,
    viewMode,
    activeDragItem,
    searchTerm,
    isSearching,
    searchResultIds,
    isAnalyzing,
    regeneratingSummaryId,
    setViewMode,
    handleAnalyzeSpace,
    handleSearch,
    setSearchTerm,
    setSearchResultIds,
    handleAddBookmarkOrNote,
    handleAddFromLibrary,
    handleGenerateWorkspace,
    handleDevelopIdea,
    handleItemDelete,
    handleItemEdit,
    handleItemCustomize,
    handleItemDuplicate,
    handleItemMove,
    handleShareItem,
    handleFolderView,
    handleNoteView,
    handleTextNoteView,
    handleUpdateFolderName,
    setActiveSpaceId,
    handleUnlinkSpace,
    handleRegenerateSummary,
  } = useDashboard();

  const activeSpace = spaces.find(s => s.id === activeSpaceId);

  const { setNodeRef: setSpaceLinkDroppableRef, isOver: isOverSpaceLinkArea } = useDroppable({
    id: 'space-link-droppable-area',
  });

  const { folders, regularBookmarks, chatNotes, textNotes, spaceLinks } = React.useMemo(() => {
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
    
    allBookmarks.forEach(bookmark => {
      if (bookmark.parentId && foldersById.has(bookmark.parentId)) {
        foldersById.get(bookmark.parentId)!.items.push(bookmark);
      } else {
        rootBookmarks.push(bookmark);
      }
    });
    
    const populatedFolders = Array.from(foldersById.values()).map(folder => {
        const folderBookmarks = allBookmarks.filter(bm => bm.parentId === folder.id);
        return {...folder, items: folderBookmarks};
    });

    const chatNotes = rootBookmarks.filter(bm => bm.url.startsWith('devzen:note:'));
    const textNotes = rootBookmarks.filter(bm => bm.url.startsWith('devzen:text-note:'));
    const regularBookmarks = rootBookmarks.filter(bm => !bm.url.startsWith('devzen:'));

    return { folders: populatedFolders, regularBookmarks, chatNotes, textNotes, spaceLinks: allSpaceLinks };
  }, [items, activeSpaceId, searchResultIds]);
  
  const hasContent = folders.length > 0 || regularBookmarks.length > 0 || chatNotes.length > 0 || textNotes.length > 0 || spaceLinks.length > 0;

  return (
    <SidebarInset className="flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="lg:hidden" />
          <div className="flex items-center gap-2">
            <h2 className="hidden text-xl font-bold font-headline truncate sm:block">
                {activeSpace?.name ?? 'Dashboard'}
            </h2>
          </div>
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

        <div className='flex items-center gap-1 sm:gap-2'>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="outline" size="icon" className='shrink-0 h-9 w-9' onClick={handleAnalyzeSpace} disabled={isAnalyzing || !activeSpace}>
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
                 <AddBookmarkDialog activeSpaceId={activeSpaceId} spaces={spaces} onAdd={handleAddBookmarkOrNote}>
                     <Button disabled={!activeSpaceId} className="rounded-r-none relative z-10 h-9 px-3">
                        <PlusCircle className="mr-0 sm:mr-2 h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">Aggiungi</span>
                    </Button>
                </AddBookmarkDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button disabled={!activeSpaceId} className="rounded-l-none border-l-0 px-2 h-9">
                            <span className="sr-only">Altre opzioni di aggiunta</span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleAddFromLibrary}>
                            <Library className="mr-2 h-4 w-4" />
                            Aggiungi dalla Libreria
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleGenerateWorkspace}>
                            <Bot className="mr-2 h-4 w-4" />
                            Genera Workspace con AI
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={handleDevelopIdea}>
                            <BrainCircuit className="mr-2 h-4 w-4" />
                            Sviluppa Idea con AI
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
        {activeDragItem?.type === 'space' && activeDragItem?.item?.id !== activeSpaceId && (
          <div
            ref={setSpaceLinkDroppableRef}
            className={cn(
              "absolute inset-4 z-10 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 transition-colors",
              isOverSpaceLinkArea && "bg-primary/20 border-solid"
            )}
          >
              <LinkIcon className="h-10 w-10 text-primary mb-2" />
              <p className="text-lg font-semibold text-primary">Rilascia per creare un collegamento a questo spazio</p>
          </div>
        )}
        
        {!hasContent && activeDragItem?.item?.id ? (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center" />
        ) : hasContent ? (
            <div className="flex flex-col gap-8">
                {folders.length > 0 && (
                    <div>
                        <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Cartelle</h3>
                        <div className={cn(
                            viewMode === 'grid'
                            ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "flex flex-col gap-4"
                        )}>
                            {folders.map(folder =>
                              activeDragItem?.item?.id === folder.id ? (
                                <div key={folder.id} className={cn(
                                    "rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20",
                                    viewMode === 'list' ? 'h-28' : 'h-52'
                                )}/>
                              ) : (
                                <FolderCard
                                    key={folder.id}
                                    folder={folder}
                                    onDeleted={handleItemDelete}
                                    onView={() => handleFolderView(folder)}
                                    onNameUpdated={handleUpdateFolderName}
                                    onCustomize={() => handleItemCustomize(folder)}
                                    onDuplicate={() => handleItemDuplicate(folder)}
                                    onShare={() => handleShareItem(folder)}
                                    onUnlink={() => {}}
                                    viewMode={viewMode}
                                />
                               )
                            )}
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
                             {spaceLinks.map(link =>
                                activeDragItem?.item?.id === link.id ? (
                                    <div key={link.id} className={cn(
                                        "rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20",
                                        viewMode === 'list' ? 'h-28' : 'h-52'
                                    )}/>
                                ) : (
                                    <FolderCard
                                        key={link.id}
                                        folder={link}
                                        onDeleted={handleItemDelete}
                                        onView={() => setActiveSpaceId(link.linkedSpaceId)}
                                        onNameUpdated={() => {}} // Cannot rename links
                                        onCustomize={() => handleItemCustomize(link)}
                                        onDuplicate={() => handleItemDuplicate(link)}
                                        onShare={() => handleShareItem(link)}
                                        onUnlink={handleUnlinkSpace}
                                        viewMode={viewMode}
                                    />
                                )
                            )}
                        </div>
                    </div>
                )}

                {(folders.length > 0 || spaceLinks.length > 0) && (regularBookmarks.length > 0 || chatNotes.length > 0 || textNotes.length > 0) && (
                    <Separator />
                )}

                {chatNotes.length > 0 && (
                    <div>
                         <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Conversazioni</h3>
                        <div className={cn(
                            viewMode === 'grid'
                            ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "flex flex-col gap-4"
                        )}>
                            {chatNotes.map(bookmark => 
                              activeDragItem?.item?.id === bookmark.id ? (
                                <div key={bookmark.id} className={cn(
                                    "rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20",
                                    viewMode === 'list' ? 'h-28' : 'h-52'
                                )}/>
                               ) : (
                                <BookmarkCard
                                    key={bookmark.id}
                                    bookmark={bookmark}
                                    onEdit={handleItemEdit}
                                    onDeleted={handleItemDelete}
                                    onCustomize={() => handleItemCustomize(bookmark)}
                                    onDuplicate={() => handleItemDuplicate(bookmark)}
                                    onShare={() => handleShareItem(bookmark)}
                                    onViewNote={handleNoteView}
                                    onViewTextNote={handleTextNoteView}
                                    onRegenerateSummary={handleRegenerateSummary}
                                    isRegenerating={regeneratingSummaryId === bookmark.id}
                                    viewMode={viewMode}
                                />
                               )
                            )}
                        </div>
                    </div>
                )}
                
                {textNotes.length > 0 && (
                    <div>
                         <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Note</h3>
                        <div className={cn(
                            viewMode === 'grid'
                            ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "flex flex-col gap-4"
                        )}>
                            {textNotes.map(bookmark => 
                              activeDragItem?.item?.id === bookmark.id ? (
                                <div key={bookmark.id} className={cn(
                                    "rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20",
                                    viewMode === 'list' ? 'h-28' : 'h-52'
                                )}/>
                               ) : (
                                <BookmarkCard
                                    key={bookmark.id}
                                    bookmark={bookmark}
                                    onEdit={handleItemEdit}
                                    onDeleted={handleItemDelete}
                                    onCustomize={() => handleItemCustomize(bookmark)}
                                    onDuplicate={() => handleItemDuplicate(bookmark)}
                                    onShare={() => handleShareItem(bookmark)}
                                    onViewNote={handleNoteView}
                                    onViewTextNote={handleTextNoteView}
                                    onRegenerateSummary={handleRegenerateSummary}
                                    isRegenerating={regeneratingSummaryId === bookmark.id}
                                    viewMode={viewMode}
                                />
                               )
                            )}
                        </div>
                    </div>
                )}

                {(chatNotes.length > 0 || textNotes.length > 0) && regularBookmarks.length > 0 && <Separator />}

                {regularBookmarks.length > 0 && (
                    <div>
                         <h3 className="mb-4 text-lg font-semibold text-muted-foreground">Segnalibri</h3>
                        <div className={cn(
                            viewMode === 'grid'
                            ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "flex flex-col gap-4"
                        )}>
                            {regularBookmarks.map(bookmark => 
                              activeDragItem?.item?.id === bookmark.id ? (
                                <div key={bookmark.id} className={cn(
                                    "rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20",
                                    viewMode === 'list' ? 'h-28' : 'h-52'
                                )}/>
                               ) : (
                                <BookmarkCard
                                    key={bookmark.id}
                                    bookmark={bookmark}
                                    onEdit={handleItemEdit}
                                    onDeleted={handleItemDelete}
                                    onCustomize={() => handleItemCustomize(bookmark)}
                                    onDuplicate={() => handleItemDuplicate(bookmark)}
                                    onShare={() => handleShareItem(bookmark)}
                                    onViewNote={handleNoteView}
                                    onViewTextNote={handleTextNoteView}
                                    onRegenerateSummary={handleRegenerateSummary}
                                    isRegenerating={regeneratingSummaryId === bookmark.id}
                                    viewMode={viewMode}
                                />
                               )
                            )}
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
  );
}

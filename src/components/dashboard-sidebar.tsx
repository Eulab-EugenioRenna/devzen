'use client';

import * as React from 'react';
import { useDashboard } from './bookmark-dashboard-provider';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { getIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Settings, GripVertical } from 'lucide-react';

function SidebarSpaceMenuItem({
  space,
  isActive,
  isDragging,
}: {
  space: any;
  isActive: boolean;
  isDragging: boolean;
}) {
  const { setActiveSpaceId, handleEditSpace, handleDeleteSpace } = useDashboard();
  const { setNodeRef, isOver } = useDroppable({
    id: `space-sidebar-${space.id}`,
    data: { type: 'space-sidebar', item: space },
  });

  const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({
    id: space.id,
    data: { type: 'space', item: space },
  });

  const Icon = getIcon(space.icon);

  if (isDragging) {
    return (
      <div className="h-12 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 m-2" />
    );
  }

  return (
    <SidebarMenuItem
      ref={setNodeRef}
      className={cn(
        'group relative rounded-lg transition-colors',
        isOver && "bg-sidebar-accent"
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
              <GripVertical className="h-4 w-4 text-sidebar-foreground/50 group-hover:text-sidebar-foreground" />
          </div>
          <SidebarMenuButton
              onClick={() => setActiveSpaceId(space.id)}
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
            <DropdownMenuItem onClick={() => handleEditSpace(space)}>Modifica Spazio</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                onClick={() => handleDeleteSpace(space)}
            >
                Elimina Spazio
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
       </div>
    </SidebarMenuItem>
  );
}

export function DashboardSidebar() {
  const {
    spaces,
    activeSpaceId,
    appInfo,
    showLinks,
    activeDragItem,
    setShowLinks,
    handleNewSpaceClick,
    handleEditAppInfo,
    handleExport,
  } = useDashboard();

  const isLogoUrl = appInfo.logo?.startsWith('http');
  const AppIcon = isLogoUrl ? null : getIcon(appInfo.logo);

  const sidebarSpaces = React.useMemo(() => {
    return showLinks ? spaces : spaces.filter(s => !s.isLink);
  }, [spaces, showLinks]);

  return (
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
        <SidebarMenu className="p-2">
          {sidebarSpaces.map((space) => (
            <SidebarSpaceMenuItem
              key={space.id}
              space={space}
              isActive={activeSpaceId === space.id}
              isDragging={activeDragItem?.id === space.id}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex rounded-md shadow-sm w-full">
            <Button onClick={handleNewSpaceClick} className="rounded-r-none relative z-10 flex-1">
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
                    <DropdownMenuItem onClick={handleEditAppInfo}>
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
  );
}

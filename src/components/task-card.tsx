
'use client';

import * as React from 'react';
import type { Bookmark } from '@/lib/types';
import { useDraggable } from '@dnd-kit/core';
import { MoreHorizontal, Pencil, Copy, Palette, Trash2, ClipboardCheck, Share2, Edit, ChevronsUpDown } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Progress } from './ui/progress';
import { TooltipProvider } from './ui/tooltip';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface Task {
  text: string;
  completed: boolean;
}

const parseTasks = (markdown: string): Task[] => {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  return lines
    .filter(line => line.trim().startsWith('- ['))
    .map(line => {
      const completed = line.includes('[x]');
      const text = line.replace(/- \[[x ]\]\s*/, '').trim();
      return { text, completed };
    });
};

const tasksToMarkdown = (title: string, tasks: Task[]): string => {
    const headerMatch = title.match(/Piano d'Azione e Task|Tasks per (.*)/);
    const baseTitle = headerMatch?.[1] || title;
    const header = `# Tasks per ${baseTitle}\n\n`;
    return header + tasks.map(task => `- [${task.completed ? 'x' : ' '}] ${task.text}`).join('\n');
};


interface TaskCardProps {
  note: Bookmark;
  onNoteUpdated: (id: string, title: string, summary: string) => void;
  onDeleted: (id: string, type: 'bookmark' | 'folder' | 'space-link') => void;
  onCustomize: () => void;
  onDuplicate: () => void;
  onShare: (note: Bookmark) => void;
  onEditTasks: (note: Bookmark) => void;
  isOverlay?: boolean;
  viewMode?: 'grid' | 'list';
  isDragging?: boolean;
}

export function TaskCard({ note, onNoteUpdated, onDeleted, onCustomize, onDuplicate, onShare, onEditTasks, isOverlay, viewMode = 'grid', isDragging }: TaskCardProps) {
  const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({
    id: note.id,
    data: { type: 'bookmark', item: note },
  });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [tasks, setTasks] = React.useState<Task[]>(() => parseTasks(note.summary ?? ''));
  
  React.useEffect(() => {
    setTasks(parseTasks(note.summary ?? ''));
  }, [note.summary]);

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleTaskToggle = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].completed = !newTasks[index].completed;
    setTasks(newTasks);
    const newMarkdown = tasksToMarkdown(note.title, newTasks);
    onNoteUpdated(note.id, note.title, newMarkdown);
  };

  const cardStyle = {
    '--card-header-bg': note.backgroundColor ?? 'hsl(var(--primary))',
    '--card-text-color': note.textColor ?? 'hsl(var(--primary-foreground))',
  } as React.CSSProperties;

  const iconContent = (
    <div className="h-12 w-12 rounded-full border-2 border-[--card-header-bg] flex-shrink-0 p-2.5 flex items-center justify-center bg-card">
      <ClipboardCheck className="text-muted-foreground" />
    </div>
  );
  
  const DraggableIcon = (
    <div ref={setDraggableNodeRef} {...listeners} {...attributes} className="cursor-grab">
        {iconContent}
    </div>
  );

  const OptionsMenu = (
    <div>
      <TooltipProvider>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Opzioni task</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEditTasks(note)}>
                <Edit className="mr-2 h-4 w-4" />
                Gestisci Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplica
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(note)}>
                <Share2 className="mr-2 h-4 w-4" />
                Condividi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCustomize}>
                <Palette className="mr-2 h-4 w-4" />
                Personalizza
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Elimina
              </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        </TooltipProvider>
    </div>
  );

  const TaskList = ({ tasks, start = 0, end }: { tasks: Task[], start?: number, end?: number }) => (
    <div className="space-y-2">
      {tasks.slice(start, end).map((task, index) => (
        <div key={index + start} className="flex items-center space-x-2">
          <Checkbox 
              id={`task-${note.id}-${index + start}`}
              checked={task.completed}
              onCheckedChange={() => handleTaskToggle(index + start)}
              onClick={(e) => e.stopPropagation()}
          />
          <Label 
              htmlFor={`task-${note.id}-${index + start}`}
              className={cn("text-sm truncate", task.completed && "line-through text-muted-foreground")}
          >
              {task.text}
          </Label>
        </div>
      ))}
    </div>
  );

  if (isDragging) {
    return <div className={cn(
      "rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20",
      viewMode === 'list' ? 'h-28' : 'h-52'
    )} />;
  }
  
  if (isOverlay) {
    return (
        <Card
            className={cn("flex w-64 items-center gap-4 p-3 shadow-2xl")}
        >
            {iconContent}
            <div className="flex-1 overflow-hidden">
                <CardTitle className="font-headline text-base leading-tight truncate">
                  {note.title}
                </CardTitle>
                <CardDescription className="truncate text-xs">
                    {completedTasks} di {totalTasks} completati
                </CardDescription>
            </div>
        </Card>
    )
  }
  
  if (viewMode === 'list') {
    return (
    <div
      className={cn('relative')}
    >
      <Card
        style={cardStyle}
        className={cn(
            "group/card overflow-hidden transition-all duration-200 hover:shadow-md",
        )}
      >
        <div 
          className="h-10 bg-[--card-header-bg] text-[--card-text-color] px-4 flex items-center"
          style={{ clipPath: 'inset(0 0 -6px 0)' }}
        />

        <div className="relative flex items-start gap-4 p-4 pt-0">
          <div className="-mt-6">
             {DraggableIcon}
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <CardTitle className="font-headline text-base leading-tight truncate">
              {note.title}
            </CardTitle>
            <CardDescription className="mt-1 truncate text-xs">
              {completedTasks} di {totalTasks} completati
            </CardDescription>
            <Progress value={progress} className="mt-2 h-2" />
          </div>
          <div className="ml-auto pt-2">
            {OptionsMenu}
          </div>
        </div>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. Eliminerà permanentemente la nota task &quot;{note.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onDeleted(note.id, 'bookmark')}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    )
  }

  return (
    <div
      className={cn('relative')}
    >
      <Card
        style={cardStyle}
        className={cn(
            "group/card h-full flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md",
        )}
      >
        <div 
          className="h-10 bg-[--card-header-bg] text-[--card-text-color] px-4 flex items-center"
          style={{ clipPath: 'inset(0 0 -6px 0)' }}
        />
        <div className="relative p-4 pt-0 flex-1 flex flex-col">
          <div className="-mt-6 mb-4">
             {DraggableIcon}
          </div>

          <div className="flex justify-between items-start gap-2 mb-1">
              <div className='flex-1 min-w-0'>
                  <CardTitle className="font-headline text-lg leading-tight">
                    {note.title}
                  </CardTitle>
                <CardDescription className="mt-1 truncate text-xs">
                  {completedTasks} di {totalTasks} completati
                </CardDescription>
              </div>
               {OptionsMenu}
          </div>
        
            <CardContent className="p-0 pt-3 flex-1 flex flex-col gap-2">
                <Progress value={progress} className="h-2" />
                <div className="space-y-2 pt-2">
                  <TaskList tasks={tasks} end={3} />
                </div>
                 {tasks.length > 3 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1" className="border-b-0">
                        <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline py-1 justify-start gap-1">
                           <span>+ {tasks.length - 3} altre attività</span>
                           <ChevronsUpDown className="h-3 w-3" />
                        </AccordionTrigger>
                        <AccordionContent>
                           <TaskList tasks={tasks} start={3} />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                )}
            </CardContent>
        </div>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
            <AlertDialogDescription>
               Questa azione non può essere annullata. Eliminerà permanentemente la nota task &quot;{note.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => onDeleted(note.id, 'bookmark')}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

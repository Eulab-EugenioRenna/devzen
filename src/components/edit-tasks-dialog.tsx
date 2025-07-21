
'use client';

import * as React from 'react';
import type { Bookmark } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';

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

interface EditTasksDialogProps {
  note: Bookmark;
  onOpenChange: (open: boolean) => void;
  onNoteUpdated: (id: string, title: string, summary: string) => void;
}

export function EditTasksDialog({ note, onOpenChange, onNoteUpdated }: EditTasksDialogProps) {
  const [title, setTitle] = React.useState(note.title);
  const [tasks, setTasks] = React.useState<Task[]>(() => parseTasks(note.summary ?? ''));
  const [newTaskText, setNewTaskText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const newMarkdown = tasksToMarkdown(title, tasks);
      await onNoteUpdated(note.id, title, newMarkdown);
      toast({
        title: 'Task Aggiornati!',
        description: 'La tua lista di attività è stata salvata.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Errore nel salvataggio dei task:", error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Impossibile salvare i task.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      setTasks([...tasks, { text: newTaskText.trim(), completed: false }]);
      setNewTaskText('');
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskToggle = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].completed = !newTasks[index].completed;
    setTasks(newTasks);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl h-[70vh] flex flex-col">
        <DialogHeader>
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-headline font-bold h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            aria-label="Titolo della lista di task"
          />
          <DialogDescription>
            Aggiungi, rimuovi e gestisci le tue attività.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow my-4 pr-4 -mr-4">
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
                <Checkbox
                  id={`edit-task-${index}`}
                  checked={task.completed}
                  onCheckedChange={() => handleTaskToggle(index)}
                />
                <label htmlFor={`edit-task-${index}`} className="flex-grow text-sm">{task.text}</label>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={() => handleRemoveTask(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <form onSubmit={handleAddTask} className="flex items-center gap-2 mt-auto">
          <Input
            placeholder="Aggiungi una nuova attività..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
          />
          <Button type="submit">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Aggiungi Task</span>
          </Button>
        </form>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annulla</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salva Modifiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import { getToolsAiAction, addBookmarkFromLibraryAction } from '@/app/actions';
import type { ToolsAi, Bookmark } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface AddFromLibraryDialogProps {
  children: React.ReactNode;
  activeSpaceId: string;
  onBookmarkAdded: (bookmark: Bookmark) => void;
}

export function AddFromLibraryDialog({ children, activeSpaceId, onBookmarkAdded }: AddFromLibraryDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tools, setTools] = React.useState<ToolsAi[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAdding, setIsAdding] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getToolsAiAction()
        .then(setTools)
        .catch(err => {
          console.error(err);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load AI tools library.' });
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, toast]);

  const handleAddTool = async (tool: ToolsAi) => {
    setIsAdding(tool.id);
    try {
      const newBookmark = await addBookmarkFromLibraryAction({ toolId: tool.id, spaceId: activeSpaceId });
      onBookmarkAdded(newBookmark);
      toast({ title: 'Bookmark Added', description: `Added "${tool.name}" to your space.` });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({ variant: 'destructive', title: 'Error', description: `Failed to add bookmark: ${errorMessage}` });
    } finally {
      setIsAdding(null);
    }
  };

  const filteredTools = tools.filter(tool => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    return (
      tool.name.toLowerCase().includes(lowerCaseSearch) ||
      tool.category.toLowerCase().includes(lowerCaseSearch) ||
      tool.summary.summary.toLowerCase().includes(lowerCaseSearch) ||
      tool.summary.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearch))
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Add from AI Tools Library</DialogTitle>
          <DialogDescription>
            Browse a curated list of AI tools and add them as bookmarks to your space.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <Input
            placeholder="Search tools by name, category, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="pr-4 space-y-2">
              {filteredTools.map(tool => (
                <div key={tool.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent">
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium truncate">{tool.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{tool.summary.summary}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddTool(tool)}
                    disabled={isAdding === tool.id}
                  >
                    {isAdding === tool.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add
                  </Button>
                </div>
              ))}
              {filteredTools.length === 0 && <p className="text-center text-muted-foreground py-4">No tools found.</p>}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

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
      toast({ title: 'Bookmark Imported', description: `Imported "${tool.name}" to your space.` });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({ variant: 'destructive', title: 'Error', description: `Failed to import bookmark: ${errorMessage}` });
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Import from AI Tools Library</DialogTitle>
          <DialogDescription>
            Browse a curated list of AI tools and import them as bookmarks to your space.
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
            <div className="pr-4">
              {filteredTools.map(tool => (
                <div key={tool.id} className="flex items-start gap-4 p-3 rounded-lg border-b transition-colors hover:bg-accent/50">
                    <Avatar className="h-12 w-12 flex-shrink-0 rounded-lg border">
                        <AvatarImage src={tool.brand} alt={tool.name} />
                        <AvatarFallback className="rounded-lg bg-transparent font-semibold">
                            {tool.name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div className="flex-grow overflow-hidden mr-4">
                                <p className="font-semibold truncate">{tool.name}</p>
                                <a href={tool.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">{tool.link}</a>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleAddTool(tool)}
                                disabled={isAdding === tool.id}
                                className="shrink-0"
                            >
                                {isAdding === tool.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                Import
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">{tool.summary.summary}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {tool.summary.tags.slice(0, 7).map(tag => (
                                <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                            ))}
                        </div>
                    </div>
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

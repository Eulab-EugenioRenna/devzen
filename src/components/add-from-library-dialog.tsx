
'use client';

import * as React from 'react';
import { addBookmarkFromLibraryAction } from '@/app/actions';
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
import { Badge } from './ui/badge';
import { Favicon } from './favicon';

interface AddFromLibraryDialogProps {
  children: React.ReactNode;
  activeSpaceId: string;
  onBookmarkAdded: (bookmark: Bookmark) => void;
  tools: ToolsAi[];
}

export function AddFromLibraryDialog({ children, activeSpaceId, onBookmarkAdded, tools }: AddFromLibraryDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAdding, setIsAdding] = React.useState<string | null>(null);
  const { toast } = useToast();

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
      <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Import from AI Tools Library</DialogTitle>
          <DialogDescription>
            Browse a curated list of AI tools and import them as bookmarks to your space.
          </DialogDescription>
        </DialogHeader>
        <div className="shrink-0">
          <Input
            placeholder="Search tools by name, category, or tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex-grow overflow-hidden relative">
            <ScrollArea className="absolute inset-0 h-full w-full">
            <div className="pr-4">
                {filteredTools.map(tool => (
                <div key={tool.id} className="flex items-center gap-4 p-3 border-b transition-colors hover:bg-muted/50">
                    <Favicon 
                        url={tool.link} 
                        title={tool.name}
                        className="h-12 w-12 flex-shrink-0 rounded-lg" 
                        fallbackClassName="rounded-lg text-xl"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{tool.name}</p>
                        <a href={tool.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">{tool.link}</a>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tool.summary.summary}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {tool.summary.tags.slice(0, 5).map(tag => (
                                <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                            ))}
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => handleAddTool(tool)}
                        disabled={isAdding === tool.id}
                        className="shrink-0 ml-4"
                    >
                        {isAdding === tool.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        Import
                    </Button>
                </div>
                ))}
                {filteredTools.length === 0 && <p className="text-center text-muted-foreground py-4">No tools found.</p>}
            </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

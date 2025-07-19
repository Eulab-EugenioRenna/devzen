'use client';

import * as React from 'react';
import type { ToolsAi } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, LayoutGrid, List, Star, Search } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Favicon } from './favicon';
import { cn } from '@/lib/utils';

interface AddFromLibraryDialogProps {
  onOpenChange: (open: boolean) => void;
  onBookmarkAdded: (tool: ToolsAi) => void;
  tools: ToolsAi[];
}

export function AddFromLibraryDialog({ onOpenChange, onBookmarkAdded, tools }: AddFromLibraryDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [categorySearchTerm, setCategorySearchTerm] = React.useState('');
  const [isAdding, setIsAdding] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState('All');
  
  const handleAddTool = async (tool: ToolsAi) => {
    setIsAdding(tool.id);
    await onBookmarkAdded(tool);
    setIsAdding(null);
  };

  const categories = React.useMemo(() => {
    const categorySet = new Set(tools.map(tool => tool.category));
    const allCategories = ['All', ...Array.from(categorySet).sort()];
    
    if (!categorySearchTerm) {
        return allCategories;
    }

    const lowerCaseSearch = categorySearchTerm.toLowerCase();
    return allCategories.filter(category => 
        category.toLowerCase().includes(lowerCaseSearch) || 
        (category === 'All' && 'tutti gli strumenti'.includes(lowerCaseSearch))
    );

  }, [tools, categorySearchTerm]);

  const filteredTools = React.useMemo(() => {
    return tools.filter(tool => {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const inCategory = activeCategory === 'All' || tool.category === activeCategory;
      const inSearch = (
        tool.name.toLowerCase().includes(lowerCaseSearch) ||
        tool.category.toLowerCase().includes(lowerCaseSearch) ||
        tool.summary.summary.toLowerCase().includes(lowerCaseSearch) ||
        tool.summary.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearch))
      );
      return inCategory && inSearch;
    });
  }, [tools, searchTerm, activeCategory]);
  
    React.useEffect(() => {
    if (!categories.includes(activeCategory)) {
        setActiveCategory('All');
    }
  }, [categories, activeCategory]);

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="font-headline text-2xl">Importa dalla Libreria di Strumenti AI</DialogTitle>
          <DialogDescription>
            Sfoglia un elenco curato di strumenti AI e importali come segnalibri nel tuo spazio.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex min-h-0 border-t">
          <aside className="w-1/4 max-w-xs border-r p-4 flex flex-col">
            <h3 className="font-semibold text-lg px-2 mb-2">Categorie</h3>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca categorie..."
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <ScrollArea className="h-full pr-3 -mr-3">
                <nav className="flex flex-col gap-1">
                {categories.map(category => (
                    <Button
                    key={category}
                    variant={activeCategory === category ? 'secondary' : 'ghost'}
                    onClick={() => setActiveCategory(category)}
                    className="justify-start"
                    >
                    {category === 'All' ? 'Tutti gli Strumenti' : category}
                    </Button>
                ))}
                </nav>
            </ScrollArea>
          </aside>
          <main className="flex-1 flex flex-col min-w-0">
            <div className="shrink-0 p-4 border-b">
                <Input
                placeholder="Cerca strumenti per nome, categoria o tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex-grow overflow-hidden relative">
                <ScrollArea className="absolute inset-0 h-full w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                    {filteredTools.map(tool => (
                        <div key={tool.id} className="border rounded-lg p-4 flex flex-col justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-4">
                                <Favicon 
                                    url={tool.link} 
                                    title={tool.name}
                                    className="h-12 w-12 flex-shrink-0 rounded-lg" 
                                    fallbackClassName="rounded-lg text-xl"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold">{tool.name}</p>
                                    <a href={tool.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all" onClick={(e) => e.stopPropagation()}>{tool.link}</a>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground my-3 line-clamp-3">{tool.summary.summary}</p>
                             <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t">
                                {tool.summary.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                                ))}
                            </div>
                             <div className="mt-4 flex">
                                <Button
                                    className='w-full'
                                    onClick={(e) => { e.stopPropagation(); handleAddTool(tool); }}
                                    disabled={isAdding === tool.id}
                                >
                                    {isAdding === tool.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                    )}
                                    Importa
                                </Button>
                            </div>
                        </div>
                    ))}
                    </div>
                    {filteredTools.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <p className="font-semibold">Nessun strumento trovato.</p>
                            <p className="text-sm">Prova a modificare la ricerca o la categoria.</p>
                        </div>
                    )}
                </ScrollArea>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import type { Bookmark } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from './ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { RichTextEditor } from './rich-text-editor';

interface NoteEditViewDialogProps {
  note: Bookmark;
  onOpenChange: (open: boolean) => void;
  onNoteUpdated: (id: string, title: string, summary: string) => void;
}

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
    // A simple parser for demonstration. For production, a library like 'marked' or 'react-markdown' would be better.
    const htmlContent = content
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-3 mb-1.5">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mt-2 mb-1">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^(<li.*<\/li>)+/gms, (match) => `<ul class="list-disc pl-5 my-2">${match}</ul>`)
      .replace(/`([^`]+)`/g, '<code class="bg-muted text-muted-foreground px-1 py-0.5 rounded-sm">$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>')
      .replace(/\n/g, '<br />');

  return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent.replace(/<br \/><br \/>/g, '<br />') }} />;
};

export function NoteEditViewDialog({ note, onOpenChange, onNoteUpdated }: NoteEditViewDialogProps) {
    const [title, setTitle] = React.useState(note.title);
    const [content, setContent] = React.useState(note.summary ?? '');
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onNoteUpdated(note.id, title, content);
            toast({
                title: 'Nota Salvata!',
                description: 'Le tue modifiche sono state salvate con successo.',
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Errore nel salvataggio della nota:", error);
            toast({
                variant: 'destructive',
                title: 'Errore',
                description: 'Impossibile salvare la nota.',
            })
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-6">
                <DialogHeader>
                    <Input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-2xl font-headline font-bold h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </DialogHeader>
                
                <Tabs defaultValue="editor" className="flex-grow flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-2 shrink-0">
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="preview">Lettura</TabsTrigger>
                    </TabsList>
                    <TabsContent value="editor" className="flex-grow mt-4 flex flex-col min-h-0 relative">
                       <RichTextEditor
                         content={content}
                         onChange={setContent}
                       />
                    </TabsContent>
                    <TabsContent value="preview" className="flex-grow mt-4 border rounded-md p-4 relative">
                        <ScrollArea className="absolute inset-0 h-full w-full">
                            {content ? <MarkdownContent content={content} /> : <p className='text-muted-foreground'>L'anteprima apparirà qui.</p>}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
                <DialogFooter className='mt-4 shrink-0'>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Annulla</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salva Nota
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

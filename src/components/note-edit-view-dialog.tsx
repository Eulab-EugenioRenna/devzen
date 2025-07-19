
'use client';

import * as React from 'react';
import type { Bookmark } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { RichTextEditor } from './rich-text-editor';

interface NoteEditViewDialogProps {
  note: Bookmark;
  onOpenChange: (open: boolean) => void;
  onNoteUpdated: (id: string, title: string, summary: string) => void;
}

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
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                    <Input 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-2xl font-headline font-bold h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        aria-label="Titolo della nota"
                    />
                </DialogHeader>
                
                <div className="flex-grow flex flex-col min-h-0 mt-2">
                    <RichTextEditor
                        content={content}
                        onChange={setContent}
                    />
                </div>

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

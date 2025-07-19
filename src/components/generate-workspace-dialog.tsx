'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { generateWorkspaceAction, createWorkspaceFromJsonAction } from '@/app/actions';
import type { Space, SpaceItem } from '@/lib/types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const workspaceSchema = z.object({
  prompt: z.string().min(10, { message: 'Fornisci una descrizione più dettagliata.' }),
});

interface GenerateWorkspaceDialogProps {
  onOpenChange: (open: boolean) => void;
  onWorkspaceGenerated: (newSpaces: Space[], newItems: SpaceItem[]) => void;
}

export function GenerateWorkspaceDialog({
  onOpenChange,
  onWorkspaceGenerated,
}: GenerateWorkspaceDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof workspaceSchema>>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { prompt: '' },
  });
  
  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof workspaceSchema>) => {
    try {
      const workspaceJson = await generateWorkspaceAction(values.prompt);
      
      const { newSpaces, newItems } = await createWorkspaceFromJsonAction(workspaceJson);
      
      onWorkspaceGenerated(newSpaces, newItems);
      onOpenChange(false);
      
      toast({
        title: 'Spazio di Lavoro Generato!',
        description: 'I tuoi nuovi spazi ed elementi sono stati creati.',
      });

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore imprevisto.';
      toast({
        variant: 'destructive',
        title: 'Errore nella Generazione dello Spazio di Lavoro',
        description: errorMessage,
      });
    }
  };

  const setPrompt = (promptText: string) => {
    form.setValue('prompt', promptText);
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Genera Spazio di Lavoro con AI</DialogTitle>
          <DialogDescription>
            Descrivi il tipo di spazio di lavoro che vuoi creare, o incolla un JSON precedentemente esportato. L'AI genererà spazi, cartelle e segnalibri per te.
          </DialogDescription>
        </DialogHeader>
        <Alert>
            <Wand className="h-4 w-4" />
            <AlertTitle>Suggerimenti per il Prompt</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-5 mt-2 text-xs space-y-1">
                    <li>
                        <button onClick={() => setPrompt("Crea uno spazio per il social media marketing, includendo strumenti per analisi, pianificazione e creazione di contenuti.")} className="text-left hover:underline text-primary">
                            "Crea uno spazio per il social media marketing..."
                        </button>
                    </li>
                    <li>
                        <button onClick={() => setPrompt("Costruisci uno spazio di lavoro per uno sviluppatore front-end con link alla documentazione di React, TailwindCSS e Vercel.")} className="text-left hover:underline text-primary">
                            "Costruisci uno spazio di lavoro per uno sviluppatore front-end..."
                        </button>
                    </li>
                    <li>
                       <button onClick={() => setPrompt("Genera uno spazio chiamato 'Ricerca AI' con segnalibri per articoli di ricerca, le principali aziende AI e modelli open-source.")} className="text-left hover:underline text-primary">
                           "Genera uno spazio per 'Ricerca AI'..."
                       </button>
                    </li>
                     <li>
                       <button onClick={() => setPrompt("Crea due spazi: uno per 'Progetti Personali' con un'icona di codice, e uno per 'Lavoro Clienti' con un'icona di valigetta.")} className="text-left hover:underline text-primary">
                            "Crea due spazi per progetti personali e lavoro clienti..."
                       </button>
                    </li>
                </ul>
                <p className='mt-2'>Puoi anche incollare un oggetto JSON da un'esportazione precedente per importare uno spazio di lavoro.</p>
            </AlertDescription>
        </Alert>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Il Tuo Prompt o JSON</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="es. Uno spazio per imparare l'italiano con link a dizionari, siti di notizie e canali YouTube."
                      className="min-h-[150px] font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Annulla
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Genera Spazio di Lavoro
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

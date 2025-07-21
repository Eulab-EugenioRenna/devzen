'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { batchImportToolsAction } from '@/app/actions/items';
import { ScrollArea } from './ui/scroll-area';

const toolSchema = z.object({
  name: z.string().min(1, { message: 'Il nome è obbligatorio.' }),
  link: z.string().min(1, { message: 'Il link è obbligatorio.' }),
});

const importSchema = z.object({
  tools: z.array(toolSchema).min(1, 'Aggiungi almeno uno strumento.'),
});

interface ImportToLibraryDialogProps {
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function ImportToLibraryDialog({ onOpenChange, onImported }: ImportToLibraryDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof importSchema>>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      tools: [{ name: '', link: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tools',
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof importSchema>) => {
    try {
      const result = await batchImportToolsAction(values.tools);
      toast({
        title: 'Importazione Riuscita!',
        description: `${result.count} nuovi strumenti sono stati inviati alla libreria.`,
      });
      onImported();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore imprevisto.';
      toast({
        variant: 'destructive',
        title: 'Errore di Importazione',
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Importa Nuovi Strumenti nella Libreria</DialogTitle>
          <DialogDescription>
            Aggiungi uno o più strumenti alla libreria globale. Questi saranno disponibili per tutti gli utenti.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow flex flex-col min-h-0">
            <ScrollArea className="flex-grow pr-6 -mr-6">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4 flex-grow">
                      <FormField
                        control={form.control}
                        name={`tools.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Strumento</FormLabel>
                            <FormControl>
                              <Input placeholder="es. Figma" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`tools.${index}.link`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link</FormLabel>
                            <FormControl>
                              <Input placeholder="figma.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Rimuovi strumento</span>
                    </Button>
                  </div>
                ))}
              </div>
              <FormMessage>{form.formState.errors.tools?.message}</FormMessage>
            </ScrollArea>

            <div className="shrink-0 pt-4 flex justify-between items-center">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ name: '', link: '' })}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi Strumento
                </Button>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Annulla
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Invia alla Libreria
                    </Button>
                </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

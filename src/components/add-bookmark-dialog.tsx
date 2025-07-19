'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { addBookmarkAction, suggestSpaceForUrlAction } from '@/app/actions';
import type { Bookmark, Space } from '@/lib/types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';

const bookmarkSchema = z.object({
  title: z.string().min(1, { message: 'Il titolo è obbligatorio.' }),
  url: z.string().min(1, { message: 'L\'URL è obbligatorio.' }),
  spaceId: z.string({ required_error: 'Devi selezionare uno spazio.' }),
});

interface AddBookmarkDialogProps {
  children: React.ReactNode;
  activeSpaceId: string;
  spaces: Space[];
  onBookmarkAdded: (bookmark: Bookmark) => void;
}

export function AddBookmarkDialog({
  children,
  activeSpaceId,
  spaces,
  onBookmarkAdded,
}: AddBookmarkDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof bookmarkSchema>>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      title: '',
      url: '',
      spaceId: activeSpaceId,
    },
  });
  
  const { isSubmitting } = form.formState;

  const handleUrlBlur = async () => {
    let url = form.getValues('url');
    if (!url || spaces.length <= 1) return;
    
    if (!/^(https?:\/\/)/i.test(url)) {
      url = `https://${url}`;
    }

    try {
      new URL(url); // Validate URL before sending to AI
    } catch {
      return; // Don't run suggestion on invalid URL
    }

    setIsSuggesting(true);
    try {
      const suggestedSpaceId = await suggestSpaceForUrlAction(url, spaces);
      if (suggestedSpaceId && spaces.some(s => s.id === suggestedSpaceId)) {
        form.setValue('spaceId', suggestedSpaceId, { shouldValidate: true });
        toast({
            title: 'Suggerimento AI',
            description: `Lo spazio è stato impostato su "${spaces.find(s => s.id === suggestedSpaceId)?.name}".`,
        })
      }
    } catch (error) {
      console.error("Errore nel suggerimento dello spazio:", error);
      // Non mostrare un errore all'utente, è solo un aiuto
    } finally {
      setIsSuggesting(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof bookmarkSchema>) => {
    try {
      let url = values.url;
      if (!/^(https?:\/\/)/i.test(url)) {
        url = `https://${url}`;
      }
      
      const newBookmark = await addBookmarkAction({
        ...values,
        url,
      });
      onBookmarkAdded(newBookmark);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore imprevisto.';
      if (errorMessage.includes('URL non valido')) {
        form.setError('url', { type: 'manual', message: 'Inserisci un URL valido.' });
      } else {
        toast({
          variant: 'destructive',
          title: 'Errore',
          description: `Impossibile aggiungere il segnalibro: ${errorMessage}`,
        });
      }
    }
  };
  
  React.useEffect(() => {
    if (isOpen) {
      form.reset({ title: '', url: '', spaceId: activeSpaceId });
    }
  }, [isOpen, form, activeSpaceId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Aggiungi Nuovo Segnalibro</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli. L'AI genererà un riassunto e suggerirà lo spazio corretto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Documentazione Next.js" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                          <span className="text-muted-foreground">https://</span>
                          <input
                              {...field}
                              onBlur={handleUrlBlur}
                              placeholder="nextjs.org"
                              className="w-full border-none bg-transparent pl-1 text-foreground placeholder:text-muted-foreground focus:outline-none"
                          />
                      </div>
                      {isSuggesting && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="spaceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spazio</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona uno spazio..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {spaces.map((space) => (
                         <SelectItem key={space.id} value={space.id}>
                           {space.name}
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button type="submit" disabled={isSubmitting || isSuggesting}>
                {(isSubmitting || isSuggesting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aggiungi Segnalibro
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

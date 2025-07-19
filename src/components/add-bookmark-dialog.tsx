'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Space } from '@/lib/types';

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const bookmarkSchema = z.object({
  text: z.string().min(1, { message: 'Il campo non può essere vuoto.' }),
  spaceId: z.string({ required_error: 'Devi selezionare uno spazio.' }),
});

interface AddBookmarkDialogProps {
  children: React.ReactNode;
  activeSpaceId: string;
  spaces: Space[];
  onAdd: (values: { text: string, spaceId: string }) => Promise<void>;
}

export function AddBookmarkDialog({
  children,
  activeSpaceId,
  spaces,
  onAdd,
}: AddBookmarkDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof bookmarkSchema>>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      text: '',
      spaceId: activeSpaceId,
    },
  });
  
  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof bookmarkSchema>) => {
    try {
      await onAdd(values);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Si è verificato un errore imprevisto.';
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: `Impossibile aggiungere l'elemento: ${errorMessage}`,
      });
    }
  };
  
  React.useEffect(() => {
    if (isOpen) {
      form.reset({ text: '', spaceId: activeSpaceId });
    }
  }, [isOpen, form, activeSpaceId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Aggiungi Segnalibro o Nota</DialogTitle>
          <DialogDescription>
            Incolla un URL per un segnalibro o scrivi del testo per creare una nota. L'AI capirà.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL o Testo della Nota</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="es. nextjs.org&#10;oppure&#10;La mia idea per un nuovo progetto..."
                      className="min-h-[120px]"
                      {...field} 
                    />
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aggiungi
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

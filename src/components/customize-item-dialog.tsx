'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Bookmark, SpaceItem } from '@/lib/types';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const customizeSchema = z.object({
  backgroundColor: z.string(),
  textColor: z.string(),
  icon: z.string().optional(),
  iconUrl: z.string().url({ message: 'Inserisci un URL valido.' }).optional().or(z.literal('')),
  iconColor: z.string().optional(),
});

interface CustomizeItemDialogProps {
  item: SpaceItem;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (data: z.infer<typeof customizeSchema>) => void;
}

export function CustomizeItemDialog({
  item,
  onOpenChange,
  onItemUpdated,
}: CustomizeItemDialogProps) {
  const isBookmark = item.type === 'bookmark';

  const form = useForm<z.infer<typeof customizeSchema>>({
    resolver: zodResolver(customizeSchema),
    defaultValues: {
      backgroundColor: item.backgroundColor ?? '#FFFFFF',
      textColor: item.textColor ?? '#000000',
      icon: isBookmark ? (item as Bookmark).icon ?? '' : undefined,
      iconUrl: isBookmark ? (item as Bookmark).iconUrl ?? '' : undefined,
      iconColor: isBookmark ? (item as Bookmark).iconColor ?? '#000000' : undefined,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof customizeSchema>) => {
    const dataToSubmit: any = {
      backgroundColor: values.backgroundColor,
      textColor: values.textColor,
    };
    if (isBookmark) {
        dataToSubmit.icon = values.icon;
        dataToSubmit.iconUrl = values.iconUrl;
        dataToSubmit.iconColor = values.iconColor;
    }
    await onItemUpdated(dataToSubmit);
  };

  const itemName = item.type === 'bookmark' ? item.title : item.name;

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Personalizza "{itemName}"</DialogTitle>
          <DialogDescription>
            Modifica l'aspetto del tuo elemento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="backgroundColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colore di Sfondo</FormLabel>
                  <FormControl>
                    <div className='flex items-center gap-2'>
                       <Input type="color" {...field} className='p-1 h-10 w-14' />
                       <Input type="text" {...field} placeholder="#FFFFFF" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="textColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colore del Testo</FormLabel>
                  <FormControl>
                     <div className='flex items-center gap-2'>
                       <Input type="color" {...field} className='p-1 h-10 w-14' />
                       <Input type="text" {...field} placeholder="#000000" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isBookmark && (
              <>
                <FormField
                  control={form.control}
                  name="iconUrl"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>URL Icona Personalizzata</FormLabel>
                          <FormControl>
                              <Input placeholder="https://example.com/icon.png" {...field} value={field.value ?? ''}/>
                          </FormControl>
                          <FormDescription>
                              Fornisci un URL diretto a un'immagine. Questo sovrascriverà l'icona Semplice e la favicon.
                          </FormDescription>
                          <FormMessage />
                      </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icona Personalizzata (da Simple Icons)</FormLabel>
                      <FormControl>
                        <Input placeholder="es. nextdotjs" {...field} value={field.value ?? ''}/>
                      </FormControl>
                      <FormDescription>
                        Inserisci uno slug da{' '}
                        <a href="https://simpleicons.org/" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                          Simple Icons
                        </a>. Lascia vuoto per usare la favicon del sito.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="iconColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colore Icona</FormLabel>
                      <FormControl>
                          <div className='flex items-center gap-2'>
                          <Input type="color" {...field} className='p-1 h-10 w-14' value={field.value ?? '#000000'} />
                          <Input type="text" {...field} placeholder="#000000" value={field.value ?? '#000000'} />
                          </div>
                      </FormControl>
                      <FormDescription>
                          Si applica solo alle icone da Simple Icons.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Annulla
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salva Modifiche
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

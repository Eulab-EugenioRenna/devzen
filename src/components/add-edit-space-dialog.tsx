'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Space } from '@/lib/types';
import { iconMap, getIcon } from './icons';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const spaceSchema = z.object({
  name: z.string().min(1, { message: 'Il nome dello spazio è obbligatorio.' }),
  icon: z.string().min(1, { message: 'L\'icona è obbligatoria.' }),
});

interface AddEditSpaceDialogProps {
  space: Space | null;
  onSave: (data: z.infer<typeof spaceSchema>, id?: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function AddEditSpaceDialog({ space, onSave, onOpenChange }: AddEditSpaceDialogProps) {
  const form = useForm<z.infer<typeof spaceSchema>>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: space?.name ?? '',
      icon: space?.icon ?? 'Briefcase',
    },
  });
  
  const { isSubmitting } = form.formState;
  const availableIcons = Object.keys(iconMap);

  const onSubmit = (values: z.infer<typeof spaceSchema>) => {
    onSave(values, space?.id);
  };
  
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{space ? 'Modifica Spazio' : 'Aggiungi Nuovo Spazio'}</DialogTitle>
          <DialogDescription>
            {space ? 'Aggiorna i dettagli per il tuo spazio.' : 'Inserisci i dettagli per il tuo nuovo spazio.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Il Mio Progetto Fantastico" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icona</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un'icona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableIcons.map((iconName) => {
                         const IconComponent = getIcon(iconName);
                        return (
                           <SelectItem key={iconName} value={iconName}>
                            <div className='flex items-center gap-2'>
                                <IconComponent className='h-4 w-4'/>
                                <span>{iconName}</span>
                            </div>
                           </SelectItem>
                        )
                      })}
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
                Salva
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

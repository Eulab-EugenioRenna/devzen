'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { SpaceItem } from '@/lib/types';
import { updateItemColorsAction } from '@/app/actions';

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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const colorSchema = z.object({
  backgroundColor: z.string(),
  textColor: z.string(),
});

interface CustomizeItemDialogProps {
  item: SpaceItem;
  onOpenChange: (open: boolean) => void;
  onItemUpdated: (item: SpaceItem) => void;
}

export function CustomizeItemDialog({
  item,
  onOpenChange,
  onItemUpdated,
}: CustomizeItemDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof colorSchema>>({
    resolver: zodResolver(colorSchema),
    defaultValues: {
      backgroundColor: item.backgroundColor ?? '#FFFFFF',
      textColor: item.textColor ?? '#000000',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof colorSchema>) => {
    try {
      const updatedItem = await updateItemColorsAction({
        id: item.id,
        ...values,
      });
      onItemUpdated(updatedItem);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update colors: ${errorMessage}`,
      });
    }
  };

  const itemName = item.type === 'bookmark' ? item.title : item.name;

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Customize &quot;{itemName}&quot;</DialogTitle>
          <DialogDescription>
            Change the background and text color of your item.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="backgroundColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Color</FormLabel>
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
                  <FormLabel>Text Color</FormLabel>
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
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

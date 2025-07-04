'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Bookmark, SpaceItem } from '@/lib/types';
import { customizeItemAction } from '@/app/actions';

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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const customizeSchema = z.object({
  backgroundColor: z.string(),
  textColor: z.string(),
  icon: z.string().optional(),
  iconUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  iconColor: z.string().optional(),
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
    try {
      const updatedItem = await customizeItemAction({
        id: item.id,
        backgroundColor: values.backgroundColor,
        textColor: values.textColor,
        icon: isBookmark ? values.icon : undefined,
        iconUrl: isBookmark ? values.iconUrl : undefined,
        iconColor: isBookmark ? values.iconColor : undefined,
      });
      onItemUpdated(updatedItem);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update customization: ${errorMessage}`,
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
            Change the appearance of your item.
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
            {isBookmark && (
              <>
                <FormField
                  control={form.control}
                  name="iconUrl"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Custom Icon URL</FormLabel>
                          <FormControl>
                              <Input placeholder="https://example.com/icon.png" {...field} value={field.value ?? ''}/>
                          </FormControl>
                          <FormDescription>
                              Provide a direct URL to an image. This will override the Simple Icon and favicon.
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
                      <FormLabel>Custom Icon (from Simple Icons)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., nextdotjs" {...field} value={field.value ?? ''}/>
                      </FormControl>
                      <FormDescription>
                        Enter a slug from{' '}
                        <a href="https://simpleicons.org/" target="_blank" rel="noopener noreferrer" className="underline text-primary">
                          Simple Icons
                        </a>. Leave blank to use the website favicon.
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
                      <FormLabel>Icon Color</FormLabel>
                      <FormControl>
                          <div className='flex items-center gap-2'>
                          <Input type="color" {...field} className='p-1 h-10 w-14' value={field.value ?? '#000000'} />
                          <Input type="text" {...field} placeholder="#000000" value={field.value ?? '#000000'} />
                          </div>
                      </FormControl>
                      <FormDescription>
                          Only applies to icons from Simple Icons.
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

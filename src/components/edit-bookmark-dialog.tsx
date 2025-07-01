'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { updateBookmarkAction } from '@/app/actions';
import type { Bookmark } from '@/lib/types';

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

const bookmarkSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  url: z.string().url({ message: 'Please enter a valid URL.' }),
});

interface EditBookmarkDialogProps {
  bookmark: Bookmark;
  onOpenChange: (open: boolean) => void;
  onBookmarkUpdated: (bookmark: Bookmark) => void;
}

export function EditBookmarkDialog({
  bookmark,
  onOpenChange,
  onBookmarkUpdated,
}: EditBookmarkDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof bookmarkSchema>>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      title: bookmark.title,
      url: bookmark.url,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof bookmarkSchema>) => {
    try {
      const updatedBookmark = await updateBookmarkAction({
        id: bookmark.id,
        ...values,
      });
      onBookmarkUpdated(updatedBookmark);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update bookmark: ${errorMessage}`,
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit Bookmark</DialogTitle>
          <DialogDescription>
            Make changes to your bookmark here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Next.js Docs" {...field} />
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
                    <Input placeholder="https://nextjs.org" {...field} />
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

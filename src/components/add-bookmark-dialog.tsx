'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { addBookmarkAction } from '@/app/actions';
import type { Bookmark } from '@/lib/types';

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const bookmarkSchema = z.object({
  title: z.string().min(1, { message: 'Title is required.' }),
  url: z.string().min(1, { message: 'URL is required.' }),
});

interface AddBookmarkDialogProps {
  children: React.ReactNode;
  activeSpaceId: string;
  onBookmarkAdded: (bookmark: Bookmark) => void;
}

export function AddBookmarkDialog({
  children,
  activeSpaceId,
  onBookmarkAdded,
}: AddBookmarkDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof bookmarkSchema>>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      title: '',
      url: '',
    },
  });
  
  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof bookmarkSchema>) => {
    try {
      let url = values.url;
      if (!/^(https?:\/\/)/i.test(url)) {
        url = `https://${url}`;
      }
      
      const newBookmark = await addBookmarkAction({
        ...values,
        url,
        spaceId: activeSpaceId,
      });
      onBookmarkAdded(newBookmark);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      if (errorMessage.includes('Invalid URL')) {
        form.setError('url', { type: 'manual', message: 'Please enter a valid URL.' });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to add bookmark: ${errorMessage}`,
        });
      }
    }
  };
  
  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Add New Bookmark</DialogTitle>
          <DialogDescription>
            Enter the details for your new bookmark. An AI summary will be
            generated automatically.
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
                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                        <span className="text-muted-foreground">https://</span>
                        <input
                            {...field}
                            placeholder="nextjs.org"
                            className="w-full border-none bg-transparent pl-1 text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
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
                Add Bookmark
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

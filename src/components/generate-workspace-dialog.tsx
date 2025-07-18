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
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const workspaceSchema = z.object({
  prompt: z.string().min(10, { message: 'Please provide a more detailed description.' }),
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
      // Step 1: Generate the JSON structure from the prompt (or parse if it's already JSON)
      const workspaceJson = await generateWorkspaceAction(values.prompt);
      
      // Step 2: Create the actual spaces, folders, and bookmarks
      const { newSpaces, newItems } = await createWorkspaceFromJsonAction(workspaceJson);
      
      onWorkspaceGenerated(newSpaces, newItems);
      onOpenChange(false);
      
      toast({
        title: 'Workspace Generated!',
        description: 'Your new spaces and items have been created.',
      });

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error Generating Workspace',
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline">Generate Workspace with AI</DialogTitle>
          <DialogDescription>
            Describe the kind of workspace you want to create, or paste a previously exported JSON. The AI will generate spaces, folders, and bookmarks for you.
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription>
            You can either write a prompt (e.g., "Create spaces for my web development projects, including JavaScript frameworks and CSS libraries") or paste a JSON object from a previous export to import a workspace.
          </AlertDescription>
        </Alert>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Prompt or JSON</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., A space for learning Italian with links to dictionaries, news sites, and YouTube channels."
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
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Workspace
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

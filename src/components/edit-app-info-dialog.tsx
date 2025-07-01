'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { AppInfo } from '@/lib/types';
import { getIcon } from './icons';

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
  FormDescription,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const appInfoSchema = z.object({
  title: z.string().min(1, { message: 'App name is required.' }),
  logo: z.any().optional(),
});

interface EditAppInfoDialogProps {
  appInfo: AppInfo;
  onSave: (formData: FormData) => void;
  onOpenChange: (open: boolean) => void;
}

export function EditAppInfoDialog({ appInfo, onSave, onOpenChange }: EditAppInfoDialogProps) {
  const form = useForm<z.infer<typeof appInfoSchema>>({
    resolver: zodResolver(appInfoSchema),
    defaultValues: {
      title: appInfo.title,
      logo: null,
    },
  });
  
  const { isSubmitting } = form.formState;

  const onSubmit = (values: z.infer<typeof appInfoSchema>) => {
    const formData = new FormData();
    formData.append('title', values.title);
    if (values.logo && values.logo.length > 0) {
      formData.append('logo', values.logo[0]);
    }
    onSave(formData);
  };
  
  const isLogoUrl = appInfo.logo?.startsWith('http');
  const IconComponent = !isLogoUrl ? getIcon(appInfo.logo) : null;
  
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Edit App Info</DialogTitle>
          <DialogDescription>
            Update the name and icon for your application.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 pt-2">
            <span className="text-sm font-medium text-muted-foreground">Current Logo:</span>
            {isLogoUrl ? (
                <img src={appInfo.logo} alt="current logo" className="h-10 w-10 rounded-md object-cover" />
            ) : (
                IconComponent && <IconComponent className="h-10 w-10" />
            )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>App Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., DevZen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logo"
              render={({ field: { onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Upload New Logo</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => onChange(e.target.files)}
                      {...fieldProps}
                     />
                  </FormControl>
                  <FormDescription>
                    Leave blank to keep the current logo.
                  </FormDescription>
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
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

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
import { handleSignup } from '@/app/auth/actions';

const formSchema = z.object({
    username: z.string().min(3, { message: 'L\'username deve contenere almeno 3 caratteri.' }),
    email: z
      .string()
      .min(1, { message: 'L\'email è obbligatoria.' })
      .email({ message: 'Inserisci un\'email valida.' }),
    password: z
      .string()
      .min(8, { message: 'La password deve contenere almeno 8 caratteri.' }),
  });

export function SignupForm() {
    const router = useRouter();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        username: '',
        email: '',
        password: '',
      },
    });
  
    const { isSubmitting } = form.formState;
  
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
      const formData = new FormData();
      formData.append('username', values.username);
      formData.append('email', values.email);
      formData.append('password', values.password);
  
      const result = await handleSignup(formData);
  
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Errore di Registrazione',
          description: result.error,
        });
      } else {
        toast({
          title: 'Registrazione Riuscita!',
          description: 'Stai per essere reindirizzato alla dashboard.',
        });
        // Redirect is now handled by the server action
      }
    };
  
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="il_tuo_username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="tuamail@esempio.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crea Account
          </Button>
        </form>
      </Form>
    );
}

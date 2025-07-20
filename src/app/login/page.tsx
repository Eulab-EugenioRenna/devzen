
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { LoginForm } from './login-form';
import { getIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { pb, usersCollectionName } from '@/lib/pocketbase';
import { setAuthCookieAction } from '@/app/auth/actions';

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-.83 0-1.5.67-1.5 1.5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z" />
        </svg>
    )
}


export default function LoginPage() {
    const AppIcon = getIcon('Logo');
    const router = useRouter();
    const { toast } = useToast();
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            await pb.collection(usersCollectionName).authWithOAuth2({ provider: 'google' });
            
            // If the popup is successful, the auth store is updated.
            // Now, we need to set the cookie for server-side auth.
            if (pb.authStore.isValid) {
                await setAuthCookieAction();
                toast({
                    title: 'Accesso Riuscito!',
                    description: 'Benvenuto!',
                });
                router.push('/dashboard');
                router.refresh(); // Ensure the layout re-renders with the new auth state
            } else {
                throw new Error('Autenticazione Google fallita.');
            }
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Errore',
                description: 'Impossibile accedere con Google. Potrebbe essere necessario abilitare i popup.',
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-muted">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <AppIcon className="h-12 w-12 text-primary" />
                    </Link>
                    <h1 className="text-3xl font-bold font-headline mt-4">Bentornato!</h1>
                    <p className="text-muted-foreground">Inserisci le tue credenziali per accedere al tuo account.</p>
                </div>
                
                <div className="space-y-4">
                    <LoginForm />
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-muted px-2 text-muted-foreground">
                                O CONTINUA CON
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
                        {isGoogleLoading ? <div className="animate-spin h-5 w-5 border-b-2 rounded-full border-gray-900"></div> : <GoogleIcon />}
                        <span className="ml-2">Accedi con Google</span>
                    </Button>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Non hai un account?{' '}
                    <Link href="/signup" className="font-semibold text-primary hover:underline">
                        Registrati
                    </Link>
                </p>
            </div>
        </div>
    );
}

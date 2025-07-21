
'use client';

import * as React from 'react';
import Link from 'next/link';
import { ClientResponseError } from 'pocketbase';

import { SignupForm } from './signup-form';
import { getIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { pb } from '@/lib/pocketbase_client';
import { usersCollectionName } from '@/lib/pocketbase';
import { setAuthCookieAction } from '@/app/auth/actions';

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" fill="none">
            <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
            <path fill="#FBBC05" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
            <path fill="#34A853" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
            <path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.023 35.596 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
        </svg>
    )
}

export default function SignupPage() {
    const AppIcon = getIcon('Logo');
    const { toast } = useToast();
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            await pb.collection(usersCollectionName).authWithOAuth2({ provider: 'google' });
            
            if (pb.authStore.isValid) {
                const cookie = pb.authStore.exportToCookie();
                await setAuthCookieAction(cookie);
                toast({
                    title: 'Accesso Riuscito!',
                    description: 'Benvenuto!',
                });
                window.location.href = '/dashboard';
            } else {
                throw new Error('Autenticazione Google fallita.');
            }
        } catch (error) {
             if (error instanceof ClientResponseError && error.status === 400) {
                 toast({
                    variant: 'destructive',
                    title: 'Registrazione Fallita',
                    description: "Impossibile registrarsi con Google. Esiste già un account registrato con questa email. Prova ad accedere.",
                });
            } else {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Errore',
                    description: 'Impossibile accedere con Google. Potrebbe essere necessario abilitare i popup.',
                });
            }
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
                    <h1 className="text-3xl font-bold font-headline mt-4">Crea il Tuo Account</h1>
                    <p className="text-muted-foreground">Inizia il tuo viaggio verso un'organizzazione potenziata dall'IA.</p>
                </div>
                
                <div className="space-y-4">
                    <SignupForm />
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-muted px-2 text-muted-foreground">
                                O REGISTRATI CON
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
                        {isGoogleLoading ? <div className="animate-spin h-5 w-5 border-b-2 rounded-full border-gray-900"></div> : <GoogleIcon />}
                        <span className="ml-2">Registrati con Google</span>
                    </Button>
                </div>

                 <p className="mt-6 text-center text-sm text-muted-foreground">
                    Hai già un account?{' '}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Accedi
                    </Link>
                </p>
            </div>
        </div>
    );
}

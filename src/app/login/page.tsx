import Link from 'next/link';
import { LoginForm } from './login-form';
import { getIcon } from '@/components/icons';

export default function LoginPage() {
    const AppIcon = getIcon('Logo');
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
                <LoginForm />
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
